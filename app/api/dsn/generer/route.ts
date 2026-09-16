import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ═══════════════════════════════════════════════════════════════════════
// LE GENERATEUR DE DSN MENSUELLE — 16/09/2026
//
// Il prend un mois et une societe, lit les bulletins EMIS de ce mois, et
// ecrit le fichier au format NEODeS.
//
// 🚨 IL NE RECALCULE RIEN. Il lit `detail`, la photographie du calcul gardee
// dans chaque bulletin. Recalculer ici donnerait un fichier qui ne
// correspond plus au bulletin remis au salarie — et c est exactement ce
// qu un controle compare.
//
// ⛔ SEULS LES BULLETINS « EMIS » ENTRENT DANS LA DSN. Un brouillon n a pas
// ete remis : le declarer reviendrait a annoncer un salaire que le salarie
// n a pas recu.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 LE FORMAT, ET SES QUATRE PIEGES
//
// 1. UNE RUBRIQUE PAR LIGNE, forme exacte :  Sxx.Gyy.zz.nnn,'valeur'
//    La virgule separe, les quotes simples entourent la valeur. Un espace
//    en trop et la ligne est rejetee.
//
// 2. 🚨🚨 L ENCODAGE EST ISO 8859-1 (LATIN-1), PAS UTF-8.
//    C est le piege le plus couteux : un « é » encode en UTF-8 fait
//    rejeter TOUTE LA DECLARATION, pas la ligne. Et le rejet arrive apres
//    la date limite de depot, donc avec une penalite.
//    ⛔ NE JAMAIS ECRIRE CE FICHIER EN UTF-8.
//
// 3. LES DATES SONT EN JJMMAAAA, sans separateur. Le 15 janvier 2026
//    s ecrit 15012026 — pas 2026-01-15, pas 15/01/2026.
//    ⚠️ LES PERIODES MENSUELLES SONT EN MMAAAA : 012026.
//
// 4. LES MONTANTS ONT DEUX DECIMALES ET UN POINT : 3000.00, jamais
//    « 3000,00 » ni « 3 000.00 ».
//
// ⚠️ LES LIGNES SE TERMINENT PAR CR/LF, pas par LF seul.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "documents-signes";

// 🚨 LE NOM ET LA VERSION DU LOGICIEL EMETTEUR figurent dans le bloc S10 et
// servent aux organismes a identifier l origine d une anomalie.
const LOGICIEL = "Mr Comptable";
const EDITEUR = "AcadeMIA Pro LLC";
const VERSION = "1.0.0";

// 🚨 LA VERSION DE LA NORME (S10.G00.00.006). Elle change CHAQUE ANNEE :
// cahier technique publie en decembre, applicable en avril.
// ⛔ A VERIFIER SUR dsn-info.fr AVANT CHAQUE CAMPAGNE DECLARATIVE.
const NORME = "2601";

// ⚠️ « 01 » = envoi reel, « 02 » = envoi de TEST. Tant que rien n a ete
// depose pour de vrai, on reste en test : un envoi reel errone doit etre
// corrige par une declaration « annule et remplace ».
const ENVOI_TEST = "02";

function q(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

// LA DATE AU FORMAT DSN : JJMMAAAA.
function dateDsn(v: any): string {
  const d = q(v);
  if (!d) return "";
  // On accepte AAAA-MM-JJ, la forme de Postgres.
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + m[2] + m[1];
  return "";
}

// LA PERIODE AU FORMAT DSN : MMAAAA.
function moisDsn(v: any): string {
  const m = q(v).match(/^(\d{4})-(\d{2})/);
  return m ? m[2] + m[1] : "";
}

// LE MONTANT AU FORMAT DSN : deux decimales, point.
function montantDsn(v: any): string {
  return Number(v || 0).toFixed(2);
}

// 🚨 LE NETTOYAGE LATIN-1. Les caracteres hors de cette table font rejeter
// la declaration entiere. On translittere plutot que de laisser passer.
// ⚠️ LES QUOTES SIMPLES SONT INTERDITES DANS UNE VALEUR : elles ferment la
// valeur et decalent tout le reste de la ligne.
function latin(v: any): string {
  return q(v)
    .replace(/'/g, " ")
    .replace(/\u2019|\u2018/g, " ")
    .replace(/\u201C|\u201D/g, " ")
    .replace(/\u2014|\u2013/g, "-")
    .replace(/\u00A0|\u202F/g, " ")
    .replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\xFF]/g, "");
}

// LE DERNIER JOUR D UN MOIS, pour les periodes de rattachement.
function finDeMois(periode: string): string {
  const p = periode.split("-");
  const d = new Date(Number(p[0]), Number(p[1]), 0);
  return String(d.getDate()).padStart(2, "0") + p[1] + p[0];
}

// LIRE UN CODE DE LA NORME depuis notre correspondance.
async function code(rubrique: string, correspondance: string, periode: string): Promise<string | null> {
  const { data } = await supabase
    .from("dsn_codes")
    .select("code")
    .eq("rubrique", rubrique)
    .eq("correspondance", correspondance)
    .lte("date_effet", periode)
    .or("date_fin.is.null,date_fin.gte." + periode)
    .order("date_effet", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? String(data.code) : null;
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }

  const societeId = q(c.societe_id);
  const periode = q(c.periode);

  if (!societeId || !/^\d{4}-\d{2}-01$/.test(periode)) {
    return NextResponse.json({
      erreur: "societe_id et periode (AAAA-MM-01) sont obligatoires",
    }, { status: 400 });
  }

  // ---- LA SOCIETE ----
  const { data: societe } = await supabase
    .from("compta_societes")
    .select("*")
    .eq("id", societeId)
    .maybeSingle();

  if (!societe) return NextResponse.json({ erreur: "societe introuvable" }, { status: 404 });

  // 🚨 LE SIRET EST INDISPENSABLE : c est lui qui identifie l etablissement
  // declarant. Sans lui, la DSN n a pas de destinataire.
  const siret = q(societe.siret);
  if (!siret || siret.length !== 14) {
    return NextResponse.json({
      erreur: "la societe n a pas de SIRET a 14 chiffres. ⛔ AUCUNE DSN N EST "
        + "POSSIBLE SANS LUI : c est l identifiant de l etablissement declarant. "
        + "Le renseigner dans compta_societes.siret.",
    }, { status: 400 });
  }

  // ---- LES BULLETINS EMIS DU MOIS ----
  const { data: bulletins } = await supabase
    .from("paie_bulletins")
    .select("*, paie_contrats(*, paie_salaries(*))")
    .eq("societe_id", societeId)
    .eq("periode", periode)
    .eq("statut", "emis")
    .order("numero");

  if (!bulletins || bulletins.length === 0) {
    return NextResponse.json({
      erreur: "aucun bulletin EMIS pour " + periode + ". "
        + "⛔ Un bulletin en brouillon n a pas ete remis au salarie : le "
        + "declarer annoncerait un salaire qu il n a pas recu. Emettre les "
        + "bulletins d abord.",
    }, { status: 400 });
  }

  // ---- LE NUMERO D ORDRE ----
  // ⚠️ IL S INCREMENTE A CHAQUE DEPOT DU MEME MOIS : c est lui qui dit
  // quelle version fait foi.
  const { data: precedentes } = await supabase
    .from("dsn_declarations")
    .select("numero_ordre")
    .eq("societe_id", societeId)
    .eq("periode", periode)
    .eq("nature", "01")
    .order("numero_ordre", { ascending: false })
    .limit(1);

  const ordre = precedentes && precedentes[0]
    ? Number(precedentes[0].numero_ordre) + 1 : 1;

  // 🚨 A PARTIR DU SECOND DEPOT, C EST UNE « ANNULE ET REMPLACE ».
  const typeDeclaration = ordre > 1 ? "02" : "01";

  // ---- L ECRITURE DU FICHIER ----
  const L: string[] = [];
  const ecrire = function (ref: string, valeur: any) {
    const v = latin(valeur);
    if (v === "") return;          // ⚠️ UNE RUBRIQUE VIDE NE S ECRIT PAS.
    L.push(ref + ",'" + v + "'");
  };

  const anomalies: string[] = [];

  // ══ S10 — L ENVOI ══
  ecrire("S10.G00.00.001", ENVOI_TEST);
  ecrire("S10.G00.00.002", LOGICIEL);
  ecrire("S10.G00.00.003", EDITEUR);
  ecrire("S10.G00.00.004", VERSION);
  ecrire("S10.G00.00.005", "01");
  ecrire("S10.G00.00.006", NORME);

  ecrire("S10.G00.01.001", siret.slice(0, 9));
  ecrire("S10.G00.01.002", siret.slice(9));
  ecrire("S10.G00.01.005", societe.raison_sociale);

  // ══ S20 — LA DECLARATION ══
  ecrire("S20.G00.05.001", "01");                    // DSN mensuelle
  ecrire("S20.G00.05.002", typeDeclaration);
  ecrire("S20.G00.05.003", "01");                    // fraction
  ecrire("S20.G00.05.004", String(ordre).padStart(2, "0"));
  ecrire("S20.G00.05.005", moisDsn(periode));
  ecrire("S20.G00.05.010", siret);

  // ══ S21.G00.06 — L ENTREPRISE ══
  ecrire("S21.G00.06.001", siret.slice(0, 9));
  ecrire("S21.G00.06.002", q(societe.code_ape));
  ecrire("S21.G00.06.003", societe.adresse);
  ecrire("S21.G00.06.004", q(societe.code_postal));
  ecrire("S21.G00.06.005", societe.ville);

  if (!q(societe.code_ape)) {
    anomalies.push("Code APE absent (S21.G00.06.002) — mention obligatoire.");
  }

  // ══ S21.G00.11 — L ETABLISSEMENT ══
  ecrire("S21.G00.11.001", siret.slice(9));
  ecrire("S21.G00.11.002", q(societe.code_ape));
  ecrire("S21.G00.11.003", societe.adresse);
  ecrire("S21.G00.11.004", q(societe.code_postal));
  ecrire("S21.G00.11.005", societe.ville);
  if (societe.effectif) ecrire("S21.G00.11.008", String(societe.effectif));

  let totalBrut = 0;
  let totalCotisations = 0;

  // ══ S21.G00.30 — CHAQUE SALARIE ══
  for (const b of bulletins) {
    const ct = b.paie_contrats || {};
    const s = ct.paie_salaries || {};
    const detail = b.detail || {};

    // 🚨 LE NIR EST LA CLE DE TOUTE LA DECLARATION. Sans lui, l organisme
    // ne sait a qui rattacher les cotisations, et le salarie ne voit rien
    // arriver sur son compte.
    const nir = q(s.numero_secu).replace(/\s/g, "");
    if (nir.length < 13) {
      anomalies.push(q(s.prenom) + " " + q(s.nom)
        + " : numero de securite sociale absent ou incomplet. "
        + "⛔ LA DECLARATION SERA REJETEE.");
    }

    ecrire("S21.G00.30.001", nir);
    ecrire("S21.G00.30.002", s.nom);
    ecrire("S21.G00.30.004", s.prenom);
    ecrire("S21.G00.30.005", q(s.sexe) === "F" ? "02" : "01");
    ecrire("S21.G00.30.006", dateDsn(s.date_naissance));
    ecrire("S21.G00.30.007", s.lieu_naissance);
    ecrire("S21.G00.30.008", s.adresse);
    ecrire("S21.G00.30.009", q(s.code_postal));
    ecrire("S21.G00.30.010", s.ville);
    ecrire("S21.G00.30.011", q(s.pays) || "FR");

    // ⚠️ L IDENTIFIANT DU SERVICE DE SANTE AU TRAVAIL est attendu depuis le
    // cahier technique 2026. Il se parametre sur l etablissement.
    if (q(societe.spst_identifiant)) {
      ecrire("S21.G00.30.030", societe.spst_identifiant);
    }

    // ══ S21.G00.40 — LE CONTRAT ══
    const natureContrat = await code("S21.G00.40.007", q(ct.type_contrat), periode);
    if (!natureContrat) {
      anomalies.push("Aucun code DSN pour le type de contrat « "
        + q(ct.type_contrat) + " » (S21.G00.40.007). "
        + "⛔ AJOUTER LA CORRESPONDANCE DANS dsn_codes.");
    }

    ecrire("S21.G00.40.001", dateDsn(ct.date_debut));
    ecrire("S21.G00.40.002", q(ct.statut_conventionnel) || "03");
    ecrire("S21.G00.40.007", natureContrat || "");
    ecrire("S21.G00.40.009", q(ct.idcc) ? String(ct.idcc).padStart(4, "0") : "9999");

    // ⚠️ LA QUOTITE DE TRAVAIL : le nombre d heures du contrat rapporte a
    // la duree de reference. Elle sert au calcul des droits.
    if (ct.quotite_travail) {
      ecrire("S21.G00.40.011", montantDsn(ct.quotite_travail));
    } else if (ct.duree_hebdo) {
      ecrire("S21.G00.40.011", montantDsn(ct.duree_hebdo));
    }

    ecrire("S21.G00.40.019", String(ct.id).slice(0, 20));

    // 🚨 LA PERIODE D ESSAI EST OBLIGATOIRE pour les CDI et les CDD de plus
    // de six mois depuis le cahier technique 2026.
    if (ct.essai_duree_jours) {
      ecrire("S21.G00.40.082", String(ct.essai_duree_jours));
    } else if (q(ct.type_contrat) === "cdi") {
      anomalies.push(q(s.prenom) + " " + q(s.nom)
        + " : duree de periode d essai absente (S21.G00.40.082), "
        + "obligatoire pour un CDI depuis le cahier technique 2026.");
    }

    // ⚠️ POUR UN CONTRAT DE MISSION, L ENTREPRISE UTILISATRICE se declare.
    if (q(ct.type_contrat) === "mission" && q(ct.eu_siret)) {
      ecrire("S21.G00.40.022", q(ct.eu_siret));
    }

    // ══ S21.G00.51 — LA REMUNERATION ══
    const debutPeriode = dateDsn(periode);
    const finPeriode = finDeMois(periode);

    const codeBrut = await code("S21.G00.51.011", "brut", periode);
    ecrire("S21.G00.51.001", debutPeriode);
    ecrire("S21.G00.51.002", finPeriode);
    ecrire("S21.G00.51.011", codeBrut || "001");
    ecrire("S21.G00.51.013", montantDsn(b.brut));

    // ══ S21.G00.78 — LES BASES ASSUJETTIES ══
    //
    // 🚨 C EST LE RAPPROCHEMENT AVEC CE QU ON VERSE A L URSSAF. Chaque
    // assiette du bulletin doit apparaitre ici, sinon l organisme ne peut
    // pas verifier que le versement correspond a la declaration.
    const assiettes: any = {};
    for (const l of (detail.lignes_cotisations || [])) {
      const t = q(l.code).indexOf("CSG") === 0 || q(l.code) === "CRDS"
        ? "csg"
        : (q(l.code).indexOf("PLAF") > 0 ? "plafonne" : "brut");
      if (!assiettes[t] || Number(l.base) > assiettes[t]) assiettes[t] = Number(l.base);
    }

    for (const t of Object.keys(assiettes)) {
      const codeBase = await code("S21.G00.78.001", t, periode);
      if (!codeBase) {
        anomalies.push("Aucun code DSN pour l assiette « " + t
          + " » (S21.G00.78.001). ⛔ AJOUTER LA CORRESPONDANCE.");
        continue;
      }
      ecrire("S21.G00.78.001", codeBase);
      ecrire("S21.G00.78.002", debutPeriode);
      ecrire("S21.G00.78.003", finPeriode);
      ecrire("S21.G00.78.004", montantDsn(assiettes[t]));
    }

    // ══ S21.G00.81 — LES COTISATIONS, UNE PAR UNE ══
    //
    // 🚨 OBLIGATOIRE DEPUIS LA PHASE 3 : chaque cotisation doit etre
    // ventilee individuellement, pour que chaque organisme recoive
    // directement ce qui lui est du.
    for (const l of (detail.lignes_cotisations || [])) {
      ecrire("S21.G00.81.001", q(l.code));
      ecrire("S21.G00.81.003", montantDsn(l.base));
      ecrire("S21.G00.81.004", montantDsn(Number(l.part_salariale || 0)
        + Number(l.part_patronale || 0)));
    }

    // ══ S21.G00.70 — LE PRELEVEMENT A LA SOURCE ══
    //
    // ⚠️ LE TAUX VIENT DU COMPTE RENDU METIER DE LA DSN PRECEDENTE. Tant
    // qu aucune DSN n a ete deposee, il n y en a pas : on declare le taux
    // neutre (« 13 »), ce qui est la regle pour un salarie dont
    // l administration n a pas encore transmis de taux.
    ecrire("S21.G00.70.001", montantDsn(b.prelevement_source > 0 ? 0 : 0));
    ecrire("S21.G00.70.002", "13");
    ecrire("S21.G00.70.004", montantDsn(b.prelevement_source));

    // ══ S21.G00.85 — LE VERSEMENT ══
    ecrire("S21.G00.85.001", finPeriode);
    ecrire("S21.G00.85.002", montantDsn(b.net_imposable));
    ecrire("S21.G00.85.003", montantDsn(b.net_a_payer));

    totalBrut += Number(b.brut || 0);
    totalCotisations += Number(b.total_salarial || 0) + Number(b.total_patronal || 0);
  }

  // ══ S80 / S89 / S90 — LES TOTAUX DE CONTROLE ══
  //
  // ⚠️ ILS SERVENT A VERIFIER QUE LE FICHIER EST ARRIVE ENTIER. Un ecart
  // entre ces totaux et la somme des lignes fait rejeter la declaration.
  ecrire("S80.G01.00.001", String(bulletins.length).padStart(3, "0"));
  ecrire("S89.G00.91.001", String(bulletins.length).padStart(3, "0"));
  ecrire("S90.G00.90.001", "001");

  // 🚨 L ENCODAGE LATIN-1, ET LES FINS DE LIGNE CR/LF.
  const texte = L.join("\r\n") + "\r\n";
  const octets = Buffer.from(texte, "latin1");
  const sha = crypto.createHash("sha256").update(octets).digest("hex");

  // ---- ARCHIVAGE ----
  const nomFichier = "DSN-" + siret + "-" + moisDsn(periode)
    + "-" + String(ordre).padStart(2, "0") + ".dsn";
  const chemin = q(societe.tenant_id) + "/" + societeId + "/dsn/"
    + periode.slice(0, 4) + "/" + nomFichier;

  const { error: eUp } = await supabase.storage
    .from(BUCKET)
    .upload(chemin, octets, { contentType: "text/plain", upsert: true });

  if (eUp) {
    return NextResponse.json({ erreur: "archivage impossible : " + eUp.message }, { status: 500 });
  }

  // 🚨 L INSERT EST VERIFIE — lecon du 15/09 : un insert Supabase non
  // verifie echoue en silence.
  const { data: decl, error: eIns } = await supabase
    .from("dsn_declarations")
    .insert({
      tenant_id: societe.tenant_id,
      societe_id: societeId,
      periode: periode,
      nature: "01",
      type_declaration: typeDeclaration,
      numero_ordre: ordre,
      nb_individus: bulletins.length,
      total_brut: Math.round(totalBrut * 100) / 100,
      total_cotisations: Math.round(totalCotisations * 100) / 100,
      chemin_fichier: chemin,
      sha256: sha,
      nb_lignes: L.length,
      statut: "brouillon",
      notes: anomalies.length > 0 ? anomalies.join(" | ") : null,
    })
    .select().maybeSingle();

  if (eIns) {
    return NextResponse.json({
      erreur: "le fichier est archive (" + chemin + ") mais son enregistrement "
        + "a echoue : " + eIns.message,
    }, { status: 500 });
  }

  const { data: signe } = await supabase.storage
    .from(BUCKET).createSignedUrl(chemin, 3600);

  return NextResponse.json({
    success: true,
    declaration_id: decl ? decl.id : null,
    fichier: nomFichier,
    periode: periode,
    type: typeDeclaration === "02" ? "annule et remplace" : "normale",
    numero_ordre: ordre,
    nb_individus: bulletins.length,
    nb_lignes: L.length,
    total_brut: Math.round(totalBrut * 100) / 100,
    total_cotisations: Math.round(totalCotisations * 100) / 100,
    sha256: sha,
    url: signe ? signe.signedUrl : null,
    anomalies: anomalies,

    // 🚨 CE QUI RESTE AVANT UN DEPOT REEL, DIT FRANCHEMENT.
    avant_depot: [
      "⛔ PASSER LE FICHIER DANS dsn-val (outil officiel) : aucune DSN ne se depose sans ce controle.",
      "⛔ RECOUPER LES CODES sur dsn-info.fr : ils portent tous verifie = false dans dsn_codes.",
      "L envoi est en MODE TEST (S10.G00.00.001 = 02). Passer a 01 pour un depot reel.",
      "Le taux de prelevement a la source est neutre : le vrai taux vient du compte rendu metier.",
      "Les cotisations sont declarees avec NOS codes internes : les codes officiels URSSAF (CTP) doivent etre renseignes.",
    ],
    message: "Fichier DSN genere en BROUILLON. "
      + (anomalies.length > 0
        ? "⚠️ " + anomalies.length + " anomalie(s) a corriger avant tout depot."
        : "Aucune anomalie detectee a la generation."),
  });
}
