import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { lecture, dossiersAutorises } from "../../../../lib/droits";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Sans cette option, Next met en cache le resultat des requetes et la route
// travaille sur des donnees perimees — un dossier cree a l instant reste
// introuvable.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

// Siren de remplacement, utilise uniquement pour un dossier qui n'en a pas
// (la LLC americaine). Toute societe francaise porte le sien.
const SIREN_PLACEHOLDER = "000000000";

// Format de date FEC : AAAAMMJJ
function dateFec(d: string | null): string {
  if (!d) return "";
  return d.slice(0, 10).replace(/-/g, "");
}

// Montant FEC : virgule decimale, deux chiffres
function montantFec(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
}

// Nettoie un champ texte : pas de pipe, pas de retour ligne
function champ(s: string | null): string {
  if (!s) return "";
  return String(s).replace(/[|\r\n\t]/g, " ").trim();
}

// ══════════════════════════════════════════════════════════════════════════
// 🆕 LE CONTROLE DU FEC AVANT ENVOI — 09/09.
//
// L export ne verifiait qu une chose : l equilibre global. L outil officiel
// de l administration (Test Compta Demat) rejette pour bien d autres
// raisons, et un FEC rejete au controle fiscal coute au cabinet sa
// credibilite. Ce controle reproduit les verifications connues de l article
// A.47 A-1 du LPF et de l outil de test :
//   - champs obligatoires renseignes (JournalCode, EcritureNum,
//     EcritureDate, CompteNum, CompteLib, EcritureLib, ValidDate) ;
//   - CompteNum d au moins trois caracteres, commencant par un chiffre ;
//   - chaque ECRITURE (meme journal + meme numero) equilibree a elle seule ;
//   - aucune ligne portant a la fois un debit et un credit, ni aucun des deux ;
//   - dates dans l exercice ; PieceDate au plus tard a EcritureDate ;
//   - DateLet presente si et seulement si EcritureLet l est ;
//   - ValidDate au plus tot a EcritureDate ;
//   - numerotation croissante par journal dans l ordre des dates ;
//   - caracteres interdits (pipe, retour a la ligne) dans les libelles ;
//   - equilibre global.
// Chaque anomalie porte une gravite : « rejet » (le fichier sera refuse)
// ou « avertissement » (accepte mais suspect).
//
// ?controle=1 rend la liste en JSON SANS produire le fichier. L export
// reste tel qu il etait ; il ajoute seulement l en-tete X-Rejets.
// ══════════════════════════════════════════════════════════════════════════
function controlerFec(lignes: any[], debut: string, fin: string) {
  const anomalies: Array<{ gravite: "rejet" | "avertissement"; code: string; detail: string; nb: number }> = [];
  function ajouter(gravite: "rejet" | "avertissement", code: string, detail: string, nb: number) {
    if (nb > 0) anomalies.push({ gravite, code, detail, nb });
  }

  let sansJournal = 0, sansNum = 0, sansDate = 0, sansCompte = 0, sansCompteLib = 0, sansLib = 0, sansValid = 0;
  let compteCourt = 0, debitEtCredit = 0, niDebitNiCredit = 0, horsExercice = 0, pieceApres = 0;
  let letSansDate = 0, dateSansLet = 0, validAvant = 0, caracteres = 0;
  const parEcriture: any = {};
  const parJournal: any = {};
  let totalDebit = 0, totalCredit = 0;

  for (const l of lignes) {
    const d = Number(l.debit) || 0;
    const c = Number(l.credit) || 0;
    totalDebit += d; totalCredit += c;
    const jc = String(l.journal_code || "").trim();
    const num = String(l.ecriture_num || "").trim();
    const date = String(l.ecriture_date || "").slice(0, 10);
    const compte = String(l.compte_num || "").trim();

    if (!jc) sansJournal++;
    if (!num) sansNum++;
    if (!date) sansDate++;
    if (!compte) sansCompte++;
    else if (compte.length < 3 || !/^[0-9]/.test(compte)) compteCourt++;
    if (!String(l.compte_lib || "").trim()) sansCompteLib++;
    if (!String(l.ecriture_lib || "").trim()) sansLib++;
    if (!l.valid_date) sansValid++;
    if (d > 0 && c > 0) debitEtCredit++;
    if (d === 0 && c === 0) niDebitNiCredit++;
    if (date && (date < debut || date > fin)) horsExercice++;
    if (l.piece_date && date && String(l.piece_date).slice(0, 10) > date) pieceApres++;
    if (l.lettrage && !l.date_lettrage) letSansDate++;
    if (!l.lettrage && l.date_lettrage) dateSansLet++;
    if (l.valid_date && date && String(l.valid_date).slice(0, 10) < date) validAvant++;
    for (const t of [l.journal_lib, l.compte_lib, l.ecriture_lib, l.piece_ref, l.comp_aux_lib]) {
      if (t && /[|\r\n]/.test(String(t))) { caracteres++; break; }
    }

    const cle = jc + "|" + num;
    if (!parEcriture[cle]) parEcriture[cle] = { debit: 0, credit: 0, date };
    parEcriture[cle].debit += d;
    parEcriture[cle].credit += c;

    if (!parJournal[jc]) parJournal[jc] = [];
    parJournal[jc].push({ num, date });
  }

  let ecrituresDesequilibrees = 0;
  const exemples: string[] = [];
  for (const cle of Object.keys(parEcriture)) {
    const e = parEcriture[cle];
    if (Math.abs(Math.round((e.debit - e.credit) * 100) / 100) > 0.01) {
      ecrituresDesequilibrees++;
      if (exemples.length < 5) exemples.push(cle.split("|")[1] || cle);
    }
  }

  let nonChronologique = 0;
  for (const jc of Object.keys(parJournal)) {
    const liste = parJournal[jc].slice().sort(function (a: any, b: any) { return a.num < b.num ? -1 : a.num > b.num ? 1 : 0; });
    let derniereDate = "";
    const vus = new Set<string>();
    for (const x of liste) {
      if (vus.has(x.num)) continue;
      vus.add(x.num);
      if (derniereDate && x.date < derniereDate) nonChronologique++;
      if (x.date > derniereDate) derniereDate = x.date;
    }
  }

  const ecart = Math.round((totalDebit - totalCredit) * 100) / 100;

  ajouter("rejet", "equilibre_global", "Le fichier n'est pas équilibré : écart de " + montantFec(ecart) + ".", Math.abs(ecart) > 0.01 ? 1 : 0);
  ajouter("rejet", "ecriture_desequilibree", "Écriture(s) déséquilibrée(s) à elle(s) seule(s)" + (exemples.length ? " : " + exemples.join(", ") : "") + ".", ecrituresDesequilibrees);
  ajouter("rejet", "journal_code_vide", "Ligne(s) sans code journal.", sansJournal);
  ajouter("rejet", "ecriture_num_vide", "Ligne(s) sans numéro d'écriture.", sansNum);
  ajouter("rejet", "ecriture_date_vide", "Ligne(s) sans date d'écriture.", sansDate);
  ajouter("rejet", "compte_vide", "Ligne(s) sans numéro de compte.", sansCompte);
  ajouter("rejet", "compte_court", "Compte(s) de moins de trois caractères ou ne commençant pas par un chiffre.", compteCourt);
  ajouter("rejet", "compte_lib_vide", "Ligne(s) sans libellé de compte.", sansCompteLib);
  ajouter("rejet", "ecriture_lib_vide", "Ligne(s) sans libellé d'écriture.", sansLib);
  ajouter("rejet", "valid_date_vide", "Ligne(s) sans date de validation : une écriture non validée n'a pas sa place dans un FEC.", sansValid);
  ajouter("rejet", "debit_et_credit", "Ligne(s) portant à la fois un débit et un crédit.", debitEtCredit);
  ajouter("rejet", "hors_exercice", "Ligne(s) datées hors de l'exercice " + debut + " → " + fin + ".", horsExercice);
  ajouter("rejet", "caracteres_interdits", "Libellé(s) contenant un pipe ou un retour à la ligne (nettoyés à l'export, mais à corriger à la source).", caracteres);
  ajouter("avertissement", "ni_debit_ni_credit", "Ligne(s) à zéro des deux côtés.", niDebitNiCredit);
  ajouter("avertissement", "piece_apres_ecriture", "Pièce(s) datée(s) après l'écriture.", pieceApres);
  ajouter("avertissement", "lettrage_sans_date", "Lettrage(s) sans date de lettrage.", letSansDate);
  ajouter("avertissement", "date_sans_lettrage", "Date(s) de lettrage sans code de lettrage.", dateSansLet);
  ajouter("avertissement", "valid_avant_ecriture", "Date(s) de validation antérieure(s) à l'écriture.", validAvant);
  ajouter("avertissement", "non_chronologique", "Écriture(s) dont le numéro ne suit pas l'ordre des dates dans son journal.", nonChronologique);

  const rejets = anomalies.filter(function (a) { return a.gravite === "rejet"; }).length;
  return {
    lignes: lignes.length,
    ecritures: Object.keys(parEcriture).length,
    journaux: Object.keys(parJournal).length,
    debit: Math.round(totalDebit * 100) / 100,
    credit: Math.round(totalCredit * 100) / 100,
    ecart,
    rejets,
    avertissements: anomalies.length - rejets,
    verdict: rejets > 0 ? "rejete" : anomalies.length > 0 ? "accepte_avec_reserves" : "conforme",
    anomalies,
  };
}

export async function GET(req: NextRequest) {
  try {
    // LA VRAIE SESSION, PAS UN COOKIE. Se contenter de constater la presence
    // d un cookie ne dit ni qui demande, ni ce qu il a le droit de lire.
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json(
        { error: "Connectez-vous pour produire un FEC." },
        { status: 401 }
      );
    }

    // CHOIX DU DOSSIER. On ne devine jamais : avec plusieurs dossiers et
    // aucun precise, on refuse. Melanger les ecritures de deux societes
    // dans un meme FEC serait une faute grave.
    const codeDemande = (req.nextUrl.searchParams.get("societe") || "").trim().toUpperCase();
    const idDemande = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    const modeControle = req.nextUrl.searchParams.get("controle") === "1";

    // dossiersAutorises rend TOUJOURS une liste : les dossiers de l organisme
    // de la session, restreints a ceux confies au collaborateur. Un dossier
    // hors de cette liste doit repondre « introuvable » : dire qu il existe
    // mais qu il est interdit serait deja un renseignement.
    const autorises = await dossiersAutorises();

    if (autorises.length === 0) {
      return NextResponse.json(
        { error: "Aucun dossier ne vous est confie." },
        { status: 403 }
      );
    }

    const { data: dossiers, error: erreurDossiers } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, siren, exercice_debut, exercice_fin, actif")
      .in("id", autorises)
      .limit(500);

    if (erreurDossiers) {
      return NextResponse.json(
        { error: "Lecture des dossiers: " + erreurDossiers.message },
        { status: 500 }
      );
    }

    const liste = (dossiers || []).filter(function (s: any) { return s.actif !== false; });

    if (liste.length === 0) {
      return NextResponse.json(
        { error: "Aucun dossier comptable. Ouvrez-en un avant de produire un FEC." },
        { status: 404 }
      );
    }

    let dossier: any = null;

    if (idDemande) {
      dossier = liste.find(function (s: any) { return s.id === idDemande; }) || null;
    } else if (codeDemande) {
      dossier = liste.find(function (s: any) {
        return String(s.code || "").trim().toUpperCase() === codeDemande;
      }) || null;
    } else if (liste.length === 1) {
      dossier = liste[0];
    }

    if (!dossier) {
      if (!codeDemande && !idDemande) {
        return NextResponse.json(
          {
            error: "Precisez le dossier : ?societe=CODE",
            dossiers: liste.map(function (s: any) {
              return { code: s.code, raison_sociale: s.raison_sociale };
            }),
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: "Dossier introuvable.",
          demande: codeDemande || idDemande,
          dossiers_connus: liste.map(function (s: any) {
            return { code: s.code, raison_sociale: s.raison_sociale };
          }),
        },
        { status: 404 }
      );
    }

    // LE BARRAGE DE LECTURE, en second rideau : meme si le dossier a ete
    // trouve, on verifie qu il est bien ouvert a cette session.
    const refus = await lecture(dossier.id);
    if (refus) return refus;

    // PERIODE. L annee demandee prime ; a defaut on prend l exercice inscrit
    // au dossier ; en dernier recours l annee civile en cours.
    const anneeDemandee = parseInt(req.nextUrl.searchParams.get("year") || "", 10);

    let debut: string;
    let fin: string;

    if (anneeDemandee) {
      debut = anneeDemandee + "-01-01";
      fin = anneeDemandee + "-12-31";
    } else if (dossier.exercice_debut && dossier.exercice_fin) {
      debut = String(dossier.exercice_debut).slice(0, 10);
      fin = String(dossier.exercice_fin).slice(0, 10);
    } else {
      const annee = new Date().getFullYear();
      debut = annee + "-01-01";
      fin = annee + "-12-31";
    }

    const { data: lignes, error } = await supabase
      .from("compta_ecritures")
      .select(
        "journal_code, journal_lib, ecriture_num, ecriture_date, compte_num, compte_lib, comp_aux_num, comp_aux_lib, piece_ref, piece_date, ecriture_lib, debit, credit, lettrage, date_lettrage, valid_date, montant_devise, devise"
      )
      .eq("societe_id", dossier.id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .order("ecriture_date", { ascending: true })
      .order("ecriture_num", { ascending: true })
      .order("credit", { ascending: true })
      .limit(50000);

    if (error) {
      return NextResponse.json(
        { error: "Lecture ecritures: " + error.message },
        { status: 500 }
      );
    }

    if (!lignes || lignes.length === 0) {
      return NextResponse.json(
        {
          error: "Aucune ecriture pour " + dossier.raison_sociale
            + " entre le " + debut + " et le " + fin + ".",
          dossier: dossier.code,
          ok: false,
        },
        { status: 404 }
      );
    }

    // 🆕 LE CONTROLE, toujours calcule ; rendu seul en mode controle.
    const controle = controlerFec(lignes, debut, fin);

    if (modeControle) {
      return NextResponse.json({
        ok: true,
        dossier: { code: dossier.code, raison_sociale: dossier.raison_sociale },
        exercice: { debut, fin },
        ...controle,
      });
    }

    // CONTROLE D EQUILIBRE. Un FEC desequilibre est rejete par l administration.
    let totalDebit = 0;
    let totalCredit = 0;
    for (const l of lignes) {
      totalDebit = totalDebit + (Number(l.debit) || 0);
      totalCredit = totalCredit + (Number(l.credit) || 0);
    }
    const ecart = Math.round((totalDebit - totalCredit) * 100) / 100;

    if (Math.abs(ecart) > 0.01 && req.nextUrl.searchParams.get("forcer") !== "1") {
      return NextResponse.json(
        {
          error: "Ecritures desequilibrees : debit " + montantFec(totalDebit)
            + " contre credit " + montantFec(totalCredit)
            + ", ecart de " + montantFec(ecart)
            + ". Corrigez avant de produire le FEC, ou ajoutez &forcer=1 pour l obtenir tel quel.",
          debit: totalDebit,
          credit: totalCredit,
          ecart: ecart,
        },
        { status: 409 }
      );
    }

    const entete = [
      "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
      "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
      "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
      "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise",
    ].join("|");

    const corps = lignes.map((l) =>
      [
        champ(l.journal_code),
        champ(l.journal_lib),
        champ(l.ecriture_num),
        dateFec(l.ecriture_date),
        champ(l.compte_num),
        champ(l.compte_lib),
        champ(l.comp_aux_num),
        champ(l.comp_aux_lib),
        champ(l.piece_ref),
        dateFec(l.piece_date),
        champ(l.ecriture_lib),
        montantFec(Number(l.debit || 0)),
        montantFec(Number(l.credit || 0)),
        champ(l.lettrage),
        dateFec(l.date_lettrage),
        dateFec(l.valid_date),
        l.devise && l.devise !== "EUR" ? montantFec(Number(l.montant_devise || 0)) : "",
        l.devise && l.devise !== "EUR" ? champ(l.devise) : "",
      ].join("|")
    );

    const contenu = [entete, ...corps].join("\r\n") + "\r\n";

    // NOM DU FICHIER : SIREN du dossier suivi de la date de cloture.
    const siren = dossier.siren
      ? String(dossier.siren).replace(/\D/g, "").padStart(9, "0").slice(0, 9)
      : SIREN_PLACEHOLDER;
    const nomFichier = siren + "FEC" + dateFec(fin) + ".txt";

    return new NextResponse(contenu, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + nomFichier + '"',
        "Cache-Control": "no-store",
        "X-Nb-Lignes": String(lignes.length),
        "X-Dossier": champ(dossier.code),
        "X-Equilibre": Math.abs(ecart) <= 0.01 ? "oui" : "non",
        "X-Rejets": String(controle.rejets),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e && e.message ? e.message : e) },
      { status: 500 }
    );
  }
}
