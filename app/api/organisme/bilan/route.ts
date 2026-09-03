import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

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

// Cadre C du Cerfa 10443*17 : origine des produits hors taxes.
// Le dispositif determine la ligne, pas le payeur.
const LIGNE_C: any = {
  apprentissage: "2a",
  professionnalisation: "2b",
  reconversion_alternance: "2c",
  transition_pro: "2d",
  cpf: "2e",
  demandeur_emploi: "2f",
  travailleur_non_salarie: "2g",
  plan_developpement: "2h",
  public_europe: "4",
  public_etat: "5",
  public_region: "6",
  public_france_travail: "7",
  public_autre: "8",
};

// Quand le dispositif n est pas renseigne, on retombe sur le payeur.
const LIGNE_C_PAR_PAYEUR: any = {
  entreprise: "1",
  cpf: "2e",
  opco: "2h",
  pouvoirs_publics: "8",
  particulier: "9",
  organisme_formation: "10",
  fonds_propres: "11",
};

// Cadre F-1 : type de stagiaires.
const LIGNE_F1: any = {
  salarie_prive: "a",
  apprenti: "b",
  recherche_emploi: "c",
  particulier: "d",
  autre: "e",
};

// Cadre F-3 : objectif general des prestations.
const LIGNE_F3: any = {
  rncp: "a",
  rs: "b",
  cqp_non_enregistre: "c",
  autre_formation: "d",
  bilan_competences: "e",
  vae: "f",
};

// LA DUREE EST UN TEXTE, PAS UN NOMBRE.
//
// En base, elle s ecrit « 120h », « 8 h », « 24 heures ». Un Number() dessus
// renvoie NaN, la duree tombe a zero, et le bilan reclame une duree qui est
// pourtant renseignee. C est ce qui faisait crier au manque sur des fiches
// completes.
function heuresDe(valeur: any): number {
  if (valeur === null || valeur === undefined) return 0;
  const direct = Number(valeur);
  if (!isNaN(direct) && direct > 0) return direct;

  const m = String(valeur).replace(",", ".").match(/[\d.]+/);
  if (!m) return 0;
  const n = Number(m[0]);
  return isNaN(n) || n <= 0 ? 0 : n;
}

function contexte(req: NextRequest) {
  const session = sessionCourante();
  if (!session) return { session: null, tenant: null };
  const admin = ADMINS.indexOf(session.email) >= 0;
  let tenant = session.tenantId;
  if (!tenant && admin) tenant = new URL(req.url).searchParams.get("tenant");
  return { session: session, tenant: tenant };
}

function vide() {
  return { stagiaires: 0, heures: 0, montant: 0 };
}

function ajouter(cible: any, cle: string, stagiaires: number, heures: number, montant: number) {
  if (!cible[cle]) cible[cle] = vide();
  cible[cle].stagiaires = cible[cle].stagiaires + stagiaires;
  cible[cle].heures = cible[cle].heures + heures;
  cible[cle].montant = cible[cle].montant + montant;
}

// ETAT PREPARATOIRE. Les chiffres sont ranges selon les cadres du
// Cerfa 10443*17 pour que l organisme n ait qu a les recopier sur
// Mon Activite Formation. Ce n est pas la declaration elle-meme.
export async function GET(req: NextRequest) {
  try {
    const { session, tenant } = contexte(req);
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const brut = new URL(req.url).searchParams.get("annee");
    const annee = brut && /^\d{4}$/.test(brut)
      ? parseInt(brut, 10)
      : new Date().getUTCFullYear();

    const debut = new Date(Date.UTC(annee, 0, 1)).toISOString();
    const fin = new Date(Date.UTC(annee + 1, 0, 1)).toISOString();

    // ══════════════════════════════════════════════════════════════════════
    // 🚨 UNE ANNEE DE BILAN, C EST UNE ANNEE D ACTIVITE — 03/09.
    //
    // LE DEFAUT : cette requete ne retenait que les inscriptions CREEES dans
    // l annee. Un stagiaire inscrit le 15 decembre 2025 et forme pendant
    // tout 2026 n apparaissait NULLE PART : ni dans le bilan 2025, ou il
    // n avait rien suivi, ni dans celui de 2026, ou il n etait pas inscrit.
    // Son activite disparaissait purement et simplement de la declaration.
    //
    // LE REGISTRE ENTIER EST DESORMAIS LU, puis reparti selon ce que chaque
    // inscription a produit dans l annee demandee :
    //
    //   — LES PRODUITS suivent la DATE D INSCRIPTION. Une vente se declare
    //     l annee ou elle est faite ; c est la regle comptable, et elle ne
    //     change pas parce que le stagiaire etudie l annee suivante.
    //
    //   — LES HEURES suivent les MODULES VALIDES DANS L ANNEE. Le Cerfa
    //     demande les heures dispensees pendant l exercice : celles de 2025
    //     appartiennent au bilan 2025, meme si le parcours se poursuit.
    //
    //   — UNE INSCRIPTION ENTRE DANS LE BILAN si elle remplit l une OU
    //     l autre condition. Une inscription de decembre 2025 sans aucune
    //     validation figure donc en 2025 pour son produit, et en 2026 pour
    //     ses heures.
    //
    // ⚠️ LA LIMITE PASSE A 20000 : on ne lit plus une annee mais tout
    // l historique. Au-dela, il faudra paginer.
    // ══════════════════════════════════════════════════════════════════════
    const { data: registre, error } = await supabase
      .from("organisme_apprenants")
      .select("email, formation_code, prix_vente, payeur, dispositif, statut_stagiaire, created_at")
      .eq("tenant_id", tenant)
      .limit(20000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const debutMs = new Date(debut).getTime();
    const finMs = new Date(fin).getTime();

    function dansAnnee(quand: any): boolean {
      if (!quand) return false;
      const t = new Date(quand).getTime();
      if (isNaN(t)) return false;
      return t >= debutMs && t < finMs;
    }

    const { data: fiches } = await supabase
      .from("formations")
      .select("code, titre, duree, objectif, code_nsf, domaine")
      .limit(1000);

    const infoDe: any = {};
    for (const f of fiches || []) infoDe[f.code] = f;

    const { data: catalogue } = await supabase
      .from("organisme_catalogue")
      .select("formation_code, prix_vente_public")
      .eq("tenant_id", tenant)
      .limit(1000);

    const prixDe: any = {};
    for (const c of catalogue || []) {
      prixDe[c.formation_code] = Number(c.prix_vente_public) || 0;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 🚨 LES HEURES DECLAREES SONT CELLES REELLEMENT SUIVIES — 03/09.
    //
    // LE DEFAUT, ET IL PORTAIT SUR UN DOCUMENT OFFICIEL. Cette route
    // additionnait la DUREE THEORIQUE de la formation pour chaque inscrit :
    // `heuresTotal = heuresTotal + duree`. Un stagiaire ayant valide 2
    // modules sur 80 d une formation de 120 heures faisait donc declarer
    // 120 heures a l organisme, au lieu des 3 qu il avait suivies.
    //
    // Les heures sont le chiffre central du Cerfa : c est sur elles que
    // porte un controle. Surdeclarer n avantage personne et expose
    // l organisme, qui ne pouvait meme pas s en apercevoir.
    //
    // LA REGLE : heures = duree x modules valides / modules au plan. Le
    // rapport se lit dans `lms_plans` (le plan) et `progression_apprenants`
    // (ce qui est valide) — les memes tables que la cloture de parcours de
    // la facturation, pour que les deux ecrans racontent la meme histoire.
    //
    // ⚠️ UN PLAN VIDE NE PERMET AUCUNE MESURE. Plutot que d ecrire zero —
    // ce qui ferait disparaitre une activite reelle du bilan — on garde la
    // duree theorique ET on la signale dans « À completer ». L organisme
    // voit alors qu il declare une estimation, et sait quoi corriger.
    //
    // ⚠️ LES FORMATIONS PROPRES DE L ORGANISME vivent dans `organisme_cours`
    // et n ont pas de plan dans `lms_plans` : elles tombent dans ce cas.
    // ══════════════════════════════════════════════════════════════════════
    const codesInscrits: string[] = [];
    for (const i of registre || []) {
      const c = i.formation_code || "";
      if (c && codesInscrits.indexOf(c) < 0) codesInscrits.push(c);
    }

    const modulesAuPlan: any = {};
    if (codesInscrits.length > 0) {
      const { data: plan } = await supabase
        .from("lms_plans")
        .select("formation_code")
        .in("formation_code", codesInscrits)
        .limit(20000);

      for (const p of plan || []) {
        modulesAuPlan[p.formation_code] = (modulesAuPlan[p.formation_code] || 0) + 1;
      }
    }

    // LA DATE DE VALIDATION EST LUE : c est elle qui range un module dans
    // une annee. ⚠️ LA COLONNE S APPELLE `date_validation`, PAS
    // `updated_at` — cette table ne porte pas la seconde, contrairement a
    // `qcm_reponses`. Une lecture d `updated_at` renverrait `undefined`
    // pour chaque ligne, et AUCUNE heure ne serait comptee.
    const { data: progression } = await supabase
      .from("progression_apprenants")
      .select("user_email, formation_code, module_cle, date_validation")
      .eq("tenant_id", tenant)
      .eq("statut", "valide")
      .limit(50000);

    // Deux jeux de cles distinctes : celles validees DANS L ANNEE, qui
    // donnent les heures declarees, et toutes les validations, qui servent
    // a savoir si l inscription a eu de l activite. Un module valide deux
    // fois ne compte qu une fois.
    const validesAnnee: any = {};
    const validesTotal: any = {};

    for (const p of progression || []) {
      const cle = String(p.user_email || "").toLowerCase().trim() + "|" + (p.formation_code || "");
      const mod = String(p.module_cle || "");

      if (!validesTotal[cle]) validesTotal[cle] = new Set<string>();
      validesTotal[cle].add(mod);

      if (dansAnnee(p.date_validation)) {
        if (!validesAnnee[cle]) validesAnnee[cle] = new Set<string>();
        validesAnnee[cle].add(mod);
      }
    }

    // 🚨 UN MODULE VALIDE SANS DATE NE SE RANGE DANS AUCUNE ANNEE. Il est
    // compte dans `validesTotal` — l inscription est donc bien reconnue
    // comme active — mais ses heures ne sont declarees nulle part. C est le
    // choix prudent : mieux vaut sous-declarer une heure sans date que la
    // porter au hasard sur un exercice.
    function heuresSuivies(email: any, code: string, duree: number) {
      const auPlan = modulesAuPlan[code] || 0;
      if (!duree) return { heures: 0, mesure: true };

      const cle = String(email || "").toLowerCase().trim() + "|" + code;

      // Sans plan, aucune mesure possible : la duree prevue est retenue,
      // mais SEULEMENT si l inscription appartient bien a cette annee.
      if (auPlan <= 0) return { heures: duree, mesure: false };

      const jeu = validesAnnee[cle];
      const valides = jeu ? jeu.size : 0;
      const part = Math.min(valides, auPlan) / auPlan;
      return { heures: Math.round(duree * part * 10) / 10, mesure: true };
    }

    function aValideDansAnnee(email: any, code: string): boolean {
      const jeu = validesAnnee[String(email || "").toLowerCase().trim() + "|" + code];
      return !!jeu && jeu.size > 0;
    }

    const cadreC: any = {};
    const cadreF1: any = {};
    const cadreF3: any = {};
    const cadreF4: any = {};

    const stagiaires = new Set<string>();
    let heuresTotal = 0;
    let heuresTheoriques = 0;
    let produitsTotal = 0;

    const aCompleter = {
      sans_dispositif: 0,
      sans_statut: 0,
      sans_prix: 0,
      sans_formation: 0,
      sans_duree: 0,
      sans_code_nsf: 0,
      sans_plan: 0,
    };

    let inscriptionsRetenues = 0;
    let reportees = 0;

    for (const i of registre || []) {
      const code = i.formation_code || "";
      const nouvelle = dansAnnee(i.created_at);
      const active = code ? aValideDansAnnee(i.email, code) : false;

      // NI INSCRITE NI ACTIVE CETTE ANNEE : l inscription appartient a un
      // autre exercice.
      if (!nouvelle && !active) continue;

      inscriptionsRetenues = inscriptionsRetenues + 1;
      if (!nouvelle && active) reportees = reportees + 1;

      stagiaires.add(i.email);

      const fiche = infoDe[code] || {};
      const duree = heuresDe(fiche.duree);
      if (!i.formation_code) aCompleter.sans_formation = aCompleter.sans_formation + 1;
      if (!duree) aCompleter.sans_duree = aCompleter.sans_duree + 1;

      // LE PRODUIT NE SE DECLARE QU UNE FOIS, L ANNEE DE LA VENTE. Une
      // inscription reportee apporte ses heures a cette annee, pas son
      // chiffre d affaires : il a deja ete declare l annee de l inscription.
      let prix = 0;
      if (nouvelle) {
        prix = Number(i.prix_vente);
        if (!prix || isNaN(prix)) prix = prixDe[code] || 0;
        if (!prix) aCompleter.sans_prix = aCompleter.sans_prix + 1;
      }

      // Sans plan, la duree prevue n est retenue que pour une inscription
      // de l annee : la reporter chaque annee la compterait deux fois.
      const suivi = heuresSuivies(i.email, code, duree);
      let heures = suivi.heures;
      if (!suivi.mesure) {
        if (nouvelle) aCompleter.sans_plan = aCompleter.sans_plan + 1;
        else heures = 0;
      }

      heuresTotal = heuresTotal + heures;
      if (nouvelle) heuresTheoriques = heuresTheoriques + duree;
      produitsTotal = produitsTotal + prix;

      // Cadre C
      let ligneC = i.dispositif ? LIGNE_C[i.dispositif] : null;
      if (!ligneC) {
        ligneC = LIGNE_C_PAR_PAYEUR[i.payeur || ""] || "11";
        if (!i.dispositif && i.payeur !== "entreprise" && i.payeur !== "particulier") {
          aCompleter.sans_dispositif = aCompleter.sans_dispositif + 1;
        }
      }
      ajouter(cadreC, ligneC, 1, heures, prix);

      // Cadre F-1
      const ligneF1 = LIGNE_F1[i.statut_stagiaire || ""] || "e";
      if (!i.statut_stagiaire) aCompleter.sans_statut = aCompleter.sans_statut + 1;
      ajouter(cadreF1, ligneF1, 1, heures, prix);

      // Cadre F-3
      const ligneF3 = LIGNE_F3[fiche.objectif || ""] || "d";
      ajouter(cadreF3, ligneF3, 1, heures, prix);

      // Cadre F-4 : specialites, par code NSF si connu, sinon par domaine.
      const specialite = fiche.code_nsf || fiche.domaine || "non_renseigne";
      if (!fiche.code_nsf) aCompleter.sans_code_nsf = aCompleter.sans_code_nsf + 1;
      ajouter(cadreF4, specialite, 1, heures, prix);
    }

    heuresTotal = Math.round(heuresTotal * 10) / 10;
    heuresTheoriques = Math.round(heuresTheoriques * 10) / 10;

    // Total du cadre C ligne 2 : somme des lignes 2a a 2h.
    const total2 = vide();
    ["2a", "2b", "2c", "2d", "2e", "2f", "2g", "2h"].forEach(function (k) {
      if (cadreC[k]) {
        total2.stagiaires = total2.stagiaires + cadreC[k].stagiaires;
        total2.heures = total2.heures + cadreC[k].heures;
        total2.montant = total2.montant + cadreC[k].montant;
      }
    });

    const { data: fiche } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, numero_da, siret, adresse, telephone, email_contact")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const { data: valides } = await supabase
      .from("progression_apprenants")
      .select("user_email")
      .eq("tenant_id", tenant)
      .eq("statut", "valide")
      .limit(10000);

    return NextResponse.json({
      ok: true,
      avertissement:
        "État préparatoire au bilan pédagogique et financier (Cerfa 10443*17). "
        + "Les chiffres sont rangés selon les cadres du formulaire pour être "
        + "recopiés sur Mon Activité Formation. Ce document n'est pas la déclaration.",
      annee: annee,
      cadre_a: fiche || null,
      distanciel: true,
      cadre_c: cadreC,
      cadre_c_total_2: total2,
      produits_total: produitsTotal,
      cadre_f1: cadreF1,
      cadre_f3: cadreF3,
      cadre_f4: cadreF4,
      stagiaires_distincts: stagiaires.size,
      inscriptions: inscriptionsRetenues,
      // INSCRIPTIONS REPORTEES : entrees une annee anterieure, mais dont
      // des modules ont ete valides cette annee-ci. Leurs heures comptent
      // ici, leur produit non — il a ete declare a l inscription.
      inscriptions_reportees: reportees,
      heures_total: heuresTotal,
      // LES HEURES THEORIQUES SONT RENVOYEES A PART, jamais melangees aux
      // heures declarees : elles servent a montrer l ecart entre ce qui
      // etait prevu et ce qui a ete suivi. Le Cerfa demande le second.
      heures_theoriques: heuresTheoriques,
      modules_valides: (valides || []).length,
      a_completer: aCompleter,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
