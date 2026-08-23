import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

// ---------------------------------------------------------------------------
// LE PREVISIONNEL DE TRESORERIE.
//
// La comptabilite dit ce qui S EST PASSE. Un dirigeant, lui, veut savoir
// s il pourra payer ses salaires le mois prochain. C est la seule question
// qu il pose vraiment, et aucun bilan n y repond.
//
// LE PREVISIONNEL SE CONSTRUIT SUR TROIS SOURCES, ET AUCUNE N EST DEVINEE :
//
//   1. LE SOLDE D AUJOURD HUI — classe 5 du plan comptable, ce qu il y a
//      en banque a l instant.
//   2. CE QUI EST DEJA ENGAGE — les creances clients (411) et les dettes
//      fournisseurs (401), avec leur echeance quand elle est connue. Ce
//      sont des faits, pas des hypotheses.
//   3. CE QUI REVIENT CHAQUE MOIS — loyer, salaires, abonnements. Deduit de
//      la MOYENNE DES SIX DERNIERS MOIS sur les comptes recurrents.
//
// 🚨 LA TROISIEME SOURCE EST LA SEULE ESTIMATION, et elle est signalee comme
// telle a l ecran. Un previsionnel qui melange le certain et le suppose sans
// le dire fait prendre de mauvaises decisions — et c est le dirigeant qui
// paie l erreur, pas le logiciel.
// ---------------------------------------------------------------------------

// Les comptes de charge qui reviennent tous les mois. Un loyer se paie en
// janvier comme en juillet ; un achat de marchandises, non.
const CHARGES_RECURRENTES = [
  "613",  // locations
  "615",  // entretien et reparations
  "616",  // assurances
  "626",  // telephone, internet, affranchissement
  "627",  // services bancaires
  "641",  // remunerations du personnel
  "645",  // charges sociales
  "651",  // redevances, licences
];

// Six mois de recul : assez pour lisser un mois creux, pas trop pour rester
// fidele a la situation actuelle.
const MOIS_DE_RECUL = 6;

// Douze semaines : le dirigeant voit son trimestre. Au-dela, la projection
// devient un exercice de style.
const SEMAINES = 12;

function r2(n: any): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function jourISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Le lundi de la semaine d une date : toutes les previsions se rangent par
// semaine, et une semaine commence le lundi.
function lundiDe(d: Date): Date {
  const x = new Date(d.getTime());
  const jour = x.getUTCDay();
  const recul = jour === 0 ? 6 : jour - 1;
  x.setUTCDate(x.getUTCDate() - recul);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function estRecurrent(compte: string): boolean {
  const c = String(compte || "");
  for (const r of CHARGES_RECURRENTES) {
    if (c.indexOf(r) === 0) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const societeId = req.nextUrl.searchParams.get("societe_id") || "";

    const { data: societes } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, devise")
      .eq("tenant_id", session.tenantId)
      .eq("actif", true)
      .limit(500);

    const liste = societes || [];
    if (liste.length === 0) {
      return NextResponse.json({ ok: true, dossiers: [], tous: [] });
    }

    const dossier = societeId
      ? liste.filter(function (s: any) { return s.id === societeId; })[0]
      : liste[0];

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const { data: lignes } = await supabase
      .from("compta_ecritures")
      .select("compte_num, debit, credit, ecriture_date, ecriture_num, ecriture_lib, journal_code")
      .eq("societe_id", dossier.id)
      .limit(50000);

    // ---- 1. LE SOLDE D AUJOURD HUI ----
    let tresorerie = 0;
    let tvaDue = 0;

    // ---- LES TIERS, poste par poste ----
    //
    // On ne cumule pas un solde global : on suit CHAQUE tiers separement,
    // parce qu une creance de 10 000 EUR chez un client et une dette de
    // 10 000 EUR chez un fournisseur ne s annulent pas dans la vraie vie.
    const parTiers: any = {};

    // ---- LES CHARGES DES SIX DERNIERS MOIS ----
    const aujourdhui = new Date();
    const debutRecul = new Date(aujourdhui.getTime());
    debutRecul.setUTCMonth(debutRecul.getUTCMonth() - MOIS_DE_RECUL);
    const bornRecul = jourISO(debutRecul);

    let chargesRecurrentes = 0;
    const moisVus: any = {};

    for (const l of lignes || []) {
      const compte = String(l.compte_num || "");
      const d = Number(l.debit) || 0;
      const c = Number(l.credit) || 0;
      const classe = compte.slice(0, 1);
      const date = String(l.ecriture_date || "").slice(0, 10);

      if (classe === "5") {
        tresorerie = tresorerie + d - c;
        continue;
      }

      // La TVA a decaisser : elle sort du compte, il faut la prevoir.
      if (compte.indexOf("4455") === 0) {
        tvaDue = tvaDue + c - d;
        continue;
      }

      if (compte.indexOf("411") === 0 || compte.indexOf("401") === 0) {
        const cle = compte;
        if (!parTiers[cle]) {
          parTiers[cle] = { compte: compte, solde: 0, sens: compte.indexOf("411") === 0 ? "client" : "fournisseur", libelle: "" };
        }
        // Un client nous doit quand son compte est debiteur ; un fournisseur
        // attend quand le sien est crediteur.
        parTiers[cle].solde = parTiers[cle].solde
          + (compte.indexOf("411") === 0 ? d - c : c - d);
        if (!parTiers[cle].libelle && l.ecriture_lib) {
          parTiers[cle].libelle = String(l.ecriture_lib).slice(0, 120);
        }
        continue;
      }

      // Les charges recurrentes des six derniers mois.
      if (classe === "6" && estRecurrent(compte) && date >= bornRecul) {
        chargesRecurrentes = chargesRecurrentes + d - c;
        const m = date.slice(0, 7);
        if (m) moisVus[m] = true;
      }
    }

    const nbMois = Math.max(1, Object.keys(moisVus).length);
    const chargeMensuelle = r2(chargesRecurrentes / nbMois);

    // ---- 2. CE QUI EST DEJA ENGAGE, AVEC SES ECHEANCES ----
    //
    // Les factures emises par le cabinet portent une echeance reelle : on la
    // prend telle quelle. Pour les creances comptables sans echeance connue,
    // on retient trente jours — le delai legal par defaut entre
    // professionnels.
    const { data: facturesEmises } = await supabase
      .from("devis_factures")
      .select("numero, client_nom, total_ttc, reste_du, date_echeance, statut")
      .eq("tenant_id", session.tenantId)
      .eq("societe_id", dossier.id)
      .eq("type", "facture")
      .not("numero", "is", null)
      .in("statut", ["envoye", "partiel"])
      .gt("reste_du", 0)
      .limit(500);

    const entrees: any[] = [];
    const sorties: any[] = [];

    for (const f of facturesEmises || []) {
      entrees.push({
        date: f.date_echeance || jourISO(new Date(Date.now() + 30 * 86400000)),
        montant: r2(f.reste_du),
        libelle: "Facture " + f.numero + " — " + f.client_nom,
        certain: true,
      });
    }

    // Les creances et dettes comptables, hors factures deja listees.
    let creancesRestantes = 0;
    let dettesRestantes = 0;

    for (const cle of Object.keys(parTiers)) {
      const t = parTiers[cle];
      if (t.sens === "client" && t.solde > 0.005) creancesRestantes = creancesRestantes + t.solde;
      if (t.sens === "fournisseur" && t.solde > 0.005) dettesRestantes = dettesRestantes + t.solde;
    }

    // Ce que les factures du module couvrent deja, pour ne pas compter deux
    // fois le meme argent.
    const dejaCompte = entrees.reduce(function (s: number, e: any) { return s + e.montant; }, 0);
    const creancesNettes = r2(Math.max(0, creancesRestantes - dejaCompte));

    if (creancesNettes > 0.005) {
      entrees.push({
        date: jourISO(new Date(Date.now() + 30 * 86400000)),
        montant: creancesNettes,
        libelle: "Créances clients en comptabilité",
        certain: true,
      });
    }

    if (dettesRestantes > 0.005) {
      sorties.push({
        date: jourISO(new Date(Date.now() + 30 * 86400000)),
        montant: r2(dettesRestantes),
        libelle: "Dettes fournisseurs",
        certain: true,
      });
    }

    if (tvaDue > 0.005) {
      // La TVA se declare le mois suivant : on la place au 20 du mois
      // prochain, date usuelle de l echeance.
      const echeanceTva = new Date(Date.UTC(
        aujourdhui.getUTCFullYear(),
        aujourdhui.getUTCMonth() + 1,
        20
      ));
      sorties.push({
        date: jourISO(echeanceTva),
        montant: r2(tvaDue),
        libelle: "TVA à décaisser",
        certain: true,
      });
    }

    // ---- 3. CE QUI REVIENT CHAQUE MOIS ----
    //
    // ⚠️ C EST LA SEULE ESTIMATION DU PREVISIONNEL, et elle est marquee
    // certain: false. L ecran la distingue visuellement du reste.
    if (chargeMensuelle > 0.005) {
      for (let m = 1; m <= 3; m++) {
        const d = new Date(Date.UTC(
          aujourdhui.getUTCFullYear(),
          aujourdhui.getUTCMonth() + m,
          5
        ));
        sorties.push({
          date: jourISO(d),
          montant: chargeMensuelle,
          libelle: "Charges récurrentes (estimation)",
          certain: false,
        });
      }
    }

    // ---- LA PROJECTION, SEMAINE PAR SEMAINE ----
    const depart = lundiDe(aujourdhui);
    const semaines: any[] = [];
    let solde = r2(tresorerie);
    let creux: any = null;

    for (let i = 0; i < SEMAINES; i++) {
      const debut = new Date(depart.getTime() + i * 7 * 86400000);
      const fin = new Date(debut.getTime() + 6 * 86400000);
      const bDebut = jourISO(debut);
      const bFin = jourISO(fin);

      let entree = 0;
      let sortie = 0;
      const details: any[] = [];

      for (const e of entrees) {
        if (e.date >= bDebut && e.date <= bFin) {
          entree = entree + e.montant;
          details.push({ sens: "entree", ...e });
        }
      }
      for (const s of sorties) {
        if (s.date >= bDebut && s.date <= bFin) {
          sortie = sortie + s.montant;
          details.push({ sens: "sortie", ...s });
        }
      }

      // La toute premiere semaine ramasse ce qui est deja echu : une facture
      // en retard n arrivera pas dans le passe, elle est attendue maintenant.
      if (i === 0) {
        for (const e of entrees) {
          if (e.date < bDebut) {
            entree = entree + e.montant;
            details.push({ sens: "entree", ...e, echu: true });
          }
        }
        for (const s of sorties) {
          if (s.date < bDebut) {
            sortie = sortie + s.montant;
            details.push({ sens: "sortie", ...s, echu: true });
          }
        }
      }

      solde = r2(solde + entree - sortie);

      // 🚨 LE CREUX EST LE SEUL CHIFFRE QUI COMPTE VRAIMENT. Un dirigeant ne
      // regarde pas son solde final : il regarde le moment ou il passera au
      // plus bas, parce que c est la qu il devra emprunter ou relancer.
      if (solde < 0 && !creux) {
        creux = { semaine: i + 1, date: bDebut, solde: solde };
      }

      semaines.push({
        rang: i + 1,
        debut: bDebut,
        fin: bFin,
        entrees: r2(entree),
        sorties: r2(sortie),
        solde: solde,
        details: details.sort(function (a: any, b: any) {
          return String(a.date).localeCompare(String(b.date));
        }),
      });
    }

    const soldeFinal = semaines.length > 0 ? semaines[semaines.length - 1].solde : r2(tresorerie);
    const plusBas = semaines.reduce(function (m: any, s: any) {
      return !m || s.solde < m.solde ? s : m;
    }, null);

    return NextResponse.json({
      ok: true,
      dossier: {
        id: dossier.id,
        code: dossier.code,
        nom: dossier.raison_sociale,
        devise: dossier.devise || "EUR",
      },
      aujourd_hui: {
        tresorerie: r2(tresorerie),
        creances: r2(creancesRestantes),
        dettes: r2(dettesRestantes),
        tva_a_decaisser: r2(tvaDue),
      },
      hypotheses: {
        charge_mensuelle_estimee: chargeMensuelle,
        mois_observes: nbMois,
        comptes_recurrents: CHARGES_RECURRENTES,
      },
      projection: semaines,
      solde_final: soldeFinal,
      plus_bas: plusBas ? { semaine: plusBas.rang, date: plusBas.debut, solde: plusBas.solde } : null,
      creux: creux,
      alerte: creux
        ? "Trésorerie négative prévue en semaine " + creux.semaine + "."
        : null,
      tous: liste.map(function (s: any) {
        return { id: s.id, code: s.code, raison_sociale: s.raison_sociale };
      }),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
