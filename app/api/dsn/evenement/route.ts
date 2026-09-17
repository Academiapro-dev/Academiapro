import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LES SIGNALEMENTS D EVENEMENT — 17/09/2026
//
// La DSN mensuelle raconte le mois ecoule. Les SIGNALEMENTS racontent ce
// qui arrive maintenant, et ils ont leurs propres delais :
//
//   · ARRET DE TRAVAIL — nature 02, a envoyer DANS LES CINQ JOURS. C est
//     lui qui declenche les indemnites journalieres. En retard, le salarie
//     n est pas paye.
//   · FIN DE CONTRAT (FCTU) — nature 07, cinq jours egalement. Il REMPLACE
//     L ATTESTATION EMPLOYEUR depuis 2022 : sans lui, l ancien salarie ne
//     peut pas ouvrir ses droits au chomage.
//
// ⚠️ UN SIGNALEMENT NE REMPLACE PAS LA DSN MENSUELLE. Un arret se signale
// ET se retrouve dans la DSN du mois. Les deux se completent.
//
// 🚨 MEME FORMAT QUE LA DSN MENSUELLE, MEMES PIEGES :
//   · une rubrique par ligne, forme Sxx.Gyy.zz.nnn,'valeur'
//   · ISO 8859-1, JAMAIS UTF-8 — un accent mal encode fait rejeter tout
//   · dates en JJMMAAAA, montants a deux decimales avec un point
//   · fins de ligne CR/LF
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨🚨 17/09, PREMIER PASSAGE DU FCTU DANS dsn-val — VINGT-HUIT ANOMALIES,
// SEPT CAUSES, ET UNE IDEE FAUSSE A RETIRER
//
// ⛔ L IDEE FAUSSE ETAIT LA MIENNE : j avais ecrit qu un signalement « ne
// fait que designer le contrat concerne » et que son bloc contrat pouvait
// rester minimal. dsn-val dit le contraire, et il a raison : le FCTU
// REMPLACE L ATTESTATION EMPLOYEUR. France Travail y lit le contrat en
// entier, la derniere paie, le preavis. Un fichier de cinquante-cinq lignes
// ne pouvait pas porter cela.
//
// LES SEPT CAUSES, TELLES QUE dsn-val LES A DITES :
//   1. S20.G00.05.005 et S20.G00.05.008 sont INTERDITES dans un signalement
//      (CST-04). Le « mois principal declare » et le « champ de la
//      declaration » n ont de sens que pour une mensuelle.
//   2. LE BLOC CONTRAT DOIT ETRE COMPLET : dix-neuf rubriques reclamees
//      d un coup (CST-03), les memes que dans la mensuelle.
//   3. LE BLOC 71, retraite complementaire, est attendu sous le contrat.
//   4. LE BLOC 50, versement individu, est attendu sous l individu — et
//      avec lui la derniere paie.
//   5. LE BLOC 62 reclame deux rubriques de plus : « transaction en cours »
//      (62.008) et le mois de la mensuelle qui porte les derniers elements
//      (62.020).
//   6. LE BLOC 63, le preavis, est attendu sous le 62 — meme quand il n y a
//      pas de preavis : il se declare alors « 90 - pas de clause de preavis
//      applicable », sans dates.
//   7. LE LIEU DE TRAVAIL designe en 40.019 doit exister en bloc 85.
//
// ⚠️ CE QUE dsn-val N A PAS RECLAME COMPTE AUTANT : les rubriques 40.039,
// 40.040, 40.043 et 40.046 (regime et risque accident du travail,
// etablissement utilisateur) ne figurent PAS dans sa liste des absentes,
// alors que la mensuelle les porte. Le controle CST-03 enumere TOUTES les
// rubriques obligatoires manquantes : celles qu il ne cite pas ne le sont
// pas dans un signalement. ON NE LES ECRIT DONC PAS ICI — une rubrique en
// trop coute une anomalie « rubrique interdite ».
//
// 🚨 UN FCTU NE SE GENERE QU A PARTIR D UN BULLETIN EMIS. Il porte la
// derniere paie : sans bulletin, il n a rien a declarer, et le generateur
// le refuse plutot que d ecrire des zeros.
//
// ⛔ CE QUI RESTE A EPROUVER, DIT FRANCHEMENT : la place exacte de la paie
// dans un FCTU (blocs 51, 53, 58, 78, 79, 81, 86) est reprise de la
// mensuelle, ou dsn-val l a validee. Il n a pas encore pu la juger ici : il
// s arretait au bloc 50 absent. Ce qu il refusera se retirera d un coup.
//
// ⚠️ LE SIGNALEMENT D ARRET DE TRAVAIL N EST PAS ENCORE PASSE DANS dsn-val.
// Il recoit ici ce qui vaut pour tout signalement (causes 1, 2, 3 et 7),
// pas la paie : un arret ne declare pas de remuneration, les indemnites se
// calculent sur les mensuelles deja deposees.
// ═══════════════════════════════════════════════════════════════════════

const NOM_LOGICIEL = "Mr Comptable";
const NOM_EDITEUR = "AcadeMIA Pro LLC";
const VERSION_LOGICIEL = "1.0.0";
const CONTACT_DEFAUT = "Jacques LALOU";
const EMAIL_DEFAUT = "contact@academiapro.fr";
const TELEPHONE_DEFAUT = "0100000000";

// ✅ 17/09 — P26V01 EST ACCEPTEE PAR dsn-val 2026.1.0.16 a jour.
// ⛔ NE PLUS Y TOUCHER avant le cahier technique 2027 (P27V01).
const NORME = "P26V01";

// LES CODES DE COTISATION QUI RELEVENT DE LA RETRAITE COMPLEMENTAIRE — la
// reduction generale se ventile entre deux codes DSN selon cette liste.
// ⚠️ MEME LISTE QUE DANS LA MENSUELLE : les deux fichiers doivent ventiler
// la meme reduction de la meme facon.
const RETRAITE_COMPLEMENTAIRE = ["RETRAITE_C_T1", "RETRAITE_C_T2", "CEG_T1", "CEG_T2"];

// 🆕 LES MOTIFS DE RUPTURE QUI N OUVRENT AUCUN PREAVIS. Pour eux, le bloc 63
// se declare « 90 - pas de clause de preavis applicable », sans dates.
//   031 fin de CDD · 032 fin de mission · 035 fin d essai (salarie)
//   043 rupture conventionnelle
// ⚠️ LES AUTRES MOTIFS — licenciement, demission, retraite — ONT UN PREAVIS :
// effectue ou non, paye ou non, avec ses deux dates. Cela se SAISIT, cela ne
// se devine pas.
const MOTIFS_SANS_PREAVIS = ["031", "032", "035", "043"];

function q(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cleLuhnValide(numero: string): boolean {
  const n = numero.replace(/\D/g, "");
  if (n.length === 0) return false;
  let somme = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    somme += d;
    double = !double;
  }
  return somme % 10 === 0;
}

function dateDsn(v: any): string {
  const d = q(v);
  if (!d) return "";
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + m[2] + m[1];
  return "";
}

function montantDsn(v: any): string {
  return Number(v || 0).toFixed(2);
}

// LE DERNIER JOUR D UN MOIS, pour les periodes de rattachement.
function finDeMois(periode: string): string {
  const p = periode.split("-");
  const d = new Date(Number(p[0]), Number(p[1]), 0);
  return String(d.getDate()).padStart(2, "0") + p[1] + p[0];
}

// LE CODE APE AU FORMAT DSN : quatre chiffres et une lettre, SANS LE POINT.
function apeDsn(v: any): string {
  const a = q(v).replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  return /^\d{4}[A-Z]$/.test(a) ? a : "";
}

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

function sexeDsn(sexe: any, nir: string): string {
  const s = q(sexe).toUpperCase();
  if (s === "F" || s === "2" || s === "02") return "02";
  if (s === "M" || s === "1" || s === "01") return "01";
  if (nir.length >= 1) {
    if (nir[0] === "1") return "01";
    if (nir[0] === "2") return "02";
  }
  return "";
}

// LE SALAIRE DE BASE D UN BULLETIN — pour la remuneration de type 010.
// ⛔ CE N EST PAS LE BRUT : un CDD a 2 100 EUR de salaire porte 2 541 EUR de
// brut une fois ajoutees la prime de precarite et l indemnite de conges.
// ⚠️ MEME REGLE QUE DANS LA MENSUELLE, dans le meme ordre : la ligne
// « Salaire de base » ou « Heures normales » du bulletin, a defaut sa
// premiere ligne, a defaut le salaire mensuel du contrat — sinon rien.
function salaireDeBaseDsn(detail: any, ct: any): { montant: number; repli: string } | null {
  const lignes: any[] = Array.isArray(detail && detail.lignes_brut) ? detail.lignes_brut : [];
  const norm = function (v: any): string {
    return q(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };
  for (const l of lignes) {
    const lib = norm(l && l.libelle);
    if (lib.indexOf("salaire de base") === 0 || lib.indexOf("heures normales") === 0) {
      return { montant: Number(l.montant || 0), repli: "" };
    }
  }
  if (lignes.length > 0 && Number(lignes[0].montant || 0) > 0) {
    return {
      montant: Number(lignes[0].montant),
      repli: "première ligne du brut « " + q(lignes[0].libelle) + " »",
    };
  }
  if (Number(ct && ct.salaire_mensuel || 0) > 0) {
    return { montant: Number(ct.salaire_mensuel), repli: "salaire mensuel du contrat" };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !cle) {
    return NextResponse.json({ erreur: "Supabase non configuré." },
      { status: 500 });
  }
  const supabase = createClient(url, cle);

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }

  if (q(c.cle) !== q(process.env.CRON_SECRET)) {
    return NextResponse.json({ erreur: "clé invalide." }, { status: 401 });
  }

  const evenementId = q(c.evenement_id);
  if (!evenementId) {
    return NextResponse.json({ erreur: "événement manquant." },
      { status: 400 });
  }

  try {
    const { data: ev } = await supabase
      .from("paie_evenements")
      .select("*")
      .eq("id", evenementId)
      .maybeSingle();
    if (!ev) {
      return NextResponse.json({ erreur: "événement introuvable." },
        { status: 404 });
    }

    const { data: ctLu } = await supabase
      .from("paie_contrats")
      .select("*, paie_salaries(*)")
      .eq("id", (ev as any).contrat_id)
      .maybeSingle();
    if (!ctLu) {
      return NextResponse.json({ erreur: "contrat introuvable." },
        { status: 404 });
    }
    const ct: any = ctLu;

    const { data: socLue } = await supabase
      .from("compta_societes")
      .select("*")
      .eq("id", (ev as any).societe_id)
      .maybeSingle();
    if (!socLue) {
      return NextResponse.json({ erreur: "société introuvable." },
        { status: 404 });
    }
    const societe: any = socLue;

    const siret = q(societe.siret).replace(/\D/g, "");
    if (siret.length !== 14 || !cleLuhnValide(siret)) {
      return NextResponse.json({
        erreur: "le SIRET de la société est absent ou sa clé est fausse. "
          + "⛔ AUCUN SIGNALEMENT N'EST POSSIBLE SANS LUI.",
      }, { status: 400 });
    }

    const type = q((ev as any).type_evenement);
    const estArret = type === "arret";

    // ⚠️ LA NATURE DIT DE QUEL SIGNALEMENT IL S AGIT : 02 arret de travail,
    // 07 fin de contrat. C est elle qui aiguille le fichier vers le bon
    // organisme — la CPAM pour l un, France Travail pour l autre.
    const nature = estArret ? "02" : "07";

    const dateEv = q((ev as any).date_debut);
    const dateFinContrat = q((ev as any).date_fin) || dateEv;

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 LA DERNIERE PAIE — POUR UNE FIN DE CONTRAT SEULEMENT
    //
    // Le FCTU porte le dernier bulletin du contrat. On cherche celui du mois
    // de la fin ; a defaut, le plus recent qui le precede — et on le DIT.
    //
    // ⚠️ LA LECTURE PASSE PAR LA SOCIETE, PUIS SE FILTRE SUR LE CONTRAT :
    // c est exactement la requete de la mensuelle, dont chaque nom de
    // colonne est eprouve. Ecrire une autre requete aurait demande de
    // deviner le nom de la cle qui relie un bulletin a son contrat.
    //
    // ⛔ SEULS LES BULLETINS EMIS COMPTENT. Un brouillon n a pas ete remis au
    // salarie : le declarer a France Travail annoncerait une paie qu il n a
    // pas recue.
    // ═══════════════════════════════════════════════════════════════════
    let b: any = null;
    let bulletinDuMois = true;
    if (!estArret) {
      const moisFin = dateFinContrat.slice(0, 7) + "-01";
      const { data: buls, error: eBul } = await supabase
        .from("paie_bulletins")
        .select("*, paie_contrats(*)")
        .eq("societe_id", (ev as any).societe_id)
        .eq("statut", "emis")
        .lte("periode", moisFin)
        .order("periode", { ascending: false });
      if (eBul) {
        return NextResponse.json({
          erreur: "lecture des bulletins impossible : " + eBul.message,
        }, { status: 500 });
      }
      for (const x of (buls || [])) {
        const cx: any = (x as any).paie_contrats;
        if (cx && q(cx.id) === q(ct.id)) { b = x; break; }
      }
      if (!b) {
        return NextResponse.json({
          erreur: "aucun bulletin ÉMIS pour ce contrat. ⛔ UN SIGNALEMENT DE FIN "
            + "DE CONTRAT PORTE LA DERNIÈRE PAIE : sans bulletin émis, il n'a "
            + "rien à déclarer. Émettre d'abord le dernier bulletin du salarié.",
        }, { status: 400 });
      }
      bulletinDuMois = q(b.periode).slice(0, 7) === moisFin.slice(0, 7);
    }

    // LA PERIODE QUI DATE LES CODES ET LES PARAMETRES : celle du bulletin
    // pour une fin de contrat, celle de l evenement pour un arret.
    const periode = b ? q(b.periode).slice(0, 7) + "-01" : dateEv.slice(0, 7) + "-01";
    const detail: any = (b && b.detail) || {};

    // LIRE UN CODE DE LA NORME depuis notre correspondance, a la date voulue.
    const code = async function (rubrique: string, correspondance: string): Promise<string | null> {
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
      return data ? String((data as any).code) : null;
    };

    const anomalies: string[] = [];
    const L: string[] = [];
    const dernierePar: Record<string, number> = {};

    // 🚨 LE GARDE-FOU DE L ORDRE : dsn-val cesse de lire un bloc des qu une
    // rubrique revient en arriere, et ignore tout ce qui suit. Le controle
    // vit dans le code, pas dans ma relecture.
    const ecrire = function (ref: string, valeur: any) {
      const v = latin(valeur);
      if (v === "") return;
      const mr = ref.match(/^(S\d\d\.G\d\d\.\d\d)\.(\d{3})$/);
      if (mr) {
        const bloc = mr[1];
        const num = Number(mr[2]);
        const avant = dernierePar[bloc];
        if (avant !== undefined && num < avant) {
          anomalies.push("⛔ ORDRE DES RUBRIQUES : " + ref + " après "
            + bloc + "." + String(avant).padStart(3, "0") + ".");
        }
        dernierePar[bloc] = num;
      }
      L.push(ref + ",'" + v + "'");
    };

    // 🆕 UN BLOC QUI SE REPETE REPART DE SA PREMIERE RUBRIQUE, et c est
    // normal : quatre remunerations, quatre assiettes, quinze cotisations.
    // Le garde-fou ci-dessus les prendrait pour un retour en arriere. On lui
    // dit donc, a chaque nouvelle occurrence, qu un bloc neuf commence.
    const ouvrir = function (bloc: string) {
      delete dernierePar[bloc];
    };

    const codeApe = apeDsn(societe.code_ape);
    if (!codeApe) {
      anomalies.push(q(societe.code_ape)
        ? "Code APE « " + q(societe.code_ape) + " » mal formé : il s'écrit sur "
          + "quatre chiffres et une lettre (7820Z). ⛔ NON DÉCLARÉ — les "
          + "rubriques S21.G00.06.003 et S21.G00.11.002 sont obligatoires, LE "
          + "SIGNALEMENT SERA REJETÉ. Corriger compta_societes.code_ape."
        : "Code APE absent. ⛔ Les rubriques S21.G00.06.003 (APEN) et "
          + "S21.G00.11.002 (APET) sont obligatoires : LE SIGNALEMENT SERA "
          + "REJETÉ. Renseigner compta_societes.code_ape.");
    }

    // ── S10 — L ENVOI ET L EMETTEUR ──
    ecrire("S10.G00.00.001", NOM_LOGICIEL);
    ecrire("S10.G00.00.002", NOM_EDITEUR);
    ecrire("S10.G00.00.003", VERSION_LOGICIEL);
    ecrire("S10.G00.00.005", "01");            // essai
    ecrire("S10.G00.00.006", NORME);
    ecrire("S10.G00.00.007", "01");            // net-entreprises
    ecrire("S10.G00.00.008", "01");            // envoi normal

    ecrire("S10.G00.01.001", siret.slice(0, 9));
    ecrire("S10.G00.01.002", siret.slice(9));
    ecrire("S10.G00.01.003", societe.raison_sociale);
    ecrire("S10.G00.01.004", societe.adresse);
    ecrire("S10.G00.01.005", q(societe.code_postal));
    ecrire("S10.G00.01.006", societe.ville);

    ecrire("S10.G00.02.002", q(societe.contact_nom) || CONTACT_DEFAUT);
    ecrire("S10.G00.02.004", q(societe.contact_email) || EMAIL_DEFAUT);
    ecrire("S10.G00.02.005", q(societe.contact_tel) || TELEPHONE_DEFAUT);

    // ── S20 — LA DECLARATION ──
    const aujourdhui = new Date();
    const dateConstitution = String(aujourdhui.getDate()).padStart(2, "0")
      + String(aujourdhui.getMonth() + 1).padStart(2, "0")
      + String(aujourdhui.getFullYear());

    // 🆕⛔ DEUX RUBRIQUES ONT ETE RETIREES D ICI — dsn-val, controle CST-04 :
    // « Presence de la rubrique interdite S20.G00.05.005 », et la meme chose
    // pour la 05.008. Le « mois principal declare » et le « champ de la
    // declaration » appartiennent a la mensuelle. Un signalement porte sur
    // un EVENEMENT, date dans son propre bloc (60 ou 62), pas sur un mois.
    ecrire("S20.G00.05.001", nature);
    ecrire("S20.G00.05.002", "01");            // declaration normale
    ecrire("S20.G00.05.003", "11");            // fraction 1 sur 1
    ecrire("S20.G00.05.004", "1");
    ecrire("S20.G00.05.007", dateConstitution);
    ecrire("S20.G00.05.010", "01");            // euro

    // ── S21.G00.06 / 11 — ENTREPRISE ET ETABLISSEMENT ──
    ecrire("S21.G00.06.001", siret.slice(0, 9));
    ecrire("S21.G00.06.002", siret.slice(9));
    ecrire("S21.G00.06.003", codeApe);         // APEN, obligatoire
    ecrire("S21.G00.06.004", societe.adresse);
    ecrire("S21.G00.06.005", q(societe.code_postal));
    ecrire("S21.G00.06.006", societe.ville);

    ecrire("S21.G00.11.001", siret.slice(9));
    ecrire("S21.G00.11.002", codeApe);         // APET, obligatoire
    ecrire("S21.G00.11.003", societe.adresse);
    ecrire("S21.G00.11.004", q(societe.code_postal));
    ecrire("S21.G00.11.005", societe.ville);

    // 🚨 L IDCC DU CONTRAT PRIME SUR CELUI DE LA SOCIETE. Une entreprise
    // peut relever d une convention et employer un salarie sous une autre —
    // c est le cas de Thomas BERNARD, en 1486 dans une societe a 2378.
    const idcc = q(ct.idcc) || q(societe.idcc);
    if (idcc) ecrire("S21.G00.11.022", String(idcc).padStart(4, "0"));

    // ── S21.G00.30 — L INDIVIDU ──
    //
    // 🚨 UN SIGNALEMENT NE PORTE QU UN SEUL SALARIE, celui que l evenement
    // concerne. Y mettre tout l effectif ferait declarer un arret de
    // travail pour chacun.
    const sal: any = ct.paie_salaries || {};
    const nirComplet = q(sal.numero_secu).replace(/[^0-9AaBb]/g, "").toUpperCase();
    const nir = nirComplet.slice(0, 13);
    const qui = q(sal.prenom) + " " + q(sal.nom);

    if (nirComplet.length < 13) {
      anomalies.push(qui + " : numéro de sécurité sociale absent ou "
        + "incomplet (S21.G00.30.001). ⛔ LE SIGNALEMENT SERA REJETÉ.");
    }
    if (!dateDsn(sal.date_naissance)) {
      anomalies.push(qui + " : date de naissance absente "
        + "(S21.G00.30.006). ⛔ RUBRIQUE OBLIGATOIRE.");
    }
    if (!sexeDsn(sal.sexe, nirComplet)) {
      anomalies.push(qui + " : sexe indéterminé (S21.G00.30.005) — ni saisi, "
        + "ni déductible du numéro de sécurité sociale. ⛔ RUBRIQUE "
        + "OBLIGATOIRE.");
    }

    ecrire("S21.G00.30.001", nir);
    ecrire("S21.G00.30.002", sal.nom);
    ecrire("S21.G00.30.004", sal.prenom);
    ecrire("S21.G00.30.005", sexeDsn(sal.sexe, nirComplet));
    ecrire("S21.G00.30.006", dateDsn(sal.date_naissance));

    const deptNaissance = nirComplet.length >= 7 ? nirComplet.slice(5, 7) : "";
    if (deptNaissance && deptNaissance !== "99") {
      ecrire("S21.G00.30.007", sal.lieu_naissance);
    }
    ecrire("S21.G00.30.008", sal.adresse);
    ecrire("S21.G00.30.009", q(sal.code_postal));
    ecrire("S21.G00.30.010", sal.ville);
    ecrire("S21.G00.30.013", q(sal.codification_ue) || "01");
    if (deptNaissance) ecrire("S21.G00.30.014", deptNaissance);
    const paysNaiss = q(sal.pays_naissance).toUpperCase();
    ecrire("S21.G00.30.015", paysNaiss.length === 2 ? paysNaiss : "FR");

    // ═══════════════════════════════════════════════════════════════════
    // ── S21.G00.40 — LE CONTRAT, EN ENTIER ──
    //
    // 🆕🚨 DIX-NEUF RUBRIQUES RECLAMEES PAR dsn-val D UN COUP (CST-03) :
    //   002 003 004 006 007 008 011 012 013 014 016 017 018 019 020 024 026
    //   036 037
    // Ce sont les memes que dans la mensuelle, ecrites de la meme facon et
    // depuis les memes sources : un contrat ne peut pas se decrire de deux
    // manieres selon le fichier qui le porte.
    //
    // ⚠️ LA DATE DE FIN PREVISIONNELLE (010) ET LE MOTIF DE RECOURS (021)
    // SUIVENT LA NATURE DU CONTRAT, pas celle de la declaration : un CDD les
    // porte partout ou il est decrit.
    //
    // ⛔ QUATRE RUBRIQUES DE LA MENSUELLE NE SONT PAS REPRISES : 039, 040, 043
    // et 046. dsn-val ne les a pas citees parmi les absentes — elles ne sont
    // donc pas obligatoires ici, et rien ne dit qu elles y soient permises.
    // ═══════════════════════════════════════════════════════════════════
    const numeroContrat = String(ct.id).replace(/-/g, "").slice(0, 20);

    const natureContrat = await code("S21.G00.40.007", q(ct.type_contrat));
    if (!natureContrat) {
      anomalies.push(qui + " : aucun code DSN pour le type de contrat « "
        + q(ct.type_contrat) + " » (S21.G00.40.007). ⛔ NON DÉCLARÉ.");
    }

    let statutConv = q(ct.statut_conventionnel);
    if (!statutConv) {
      statutConv = (await code("S21.G00.40.002", q(ct.categorie))) || "";
    }
    if (!statutConv) {
      anomalies.push(qui + " : statut conventionnel introuvable pour la "
        + "catégorie « " + q(ct.categorie) + " » (S21.G00.40.002). ⛔ NON "
        + "DÉCLARÉ.");
    }

    const statutRc = await code("S21.G00.40.003",
      q(ct.categorie) === "cadre" ? "rc_cadre" : "rc_non_cadre");
    if (!statutRc) {
      anomalies.push(qui + " : statut catégoriel de retraite complémentaire "
        + "introuvable (S21.G00.40.003). ⛔ NON DÉCLARÉ.");
    }

    // LA DUREE MENSUELLE DE REFERENCE — meme source que la mensuelle.
    let dureeMensuelleRef = 0;
    {
      const { data: dm } = await supabase
        .from("paie_parametres").select("valeur")
        .eq("code", "DUREE_MENSUELLE")
        .lte("date_effet", periode)
        .or("date_fin.is.null,date_fin.gte." + periode)
        .order("date_effet", { ascending: false })
        .limit(1).maybeSingle();
      if (dm) dureeMensuelleRef = Number((dm as any).valeur);
    }
    if (dureeMensuelleRef <= 0) {
      anomalies.push("Durée mensuelle de référence introuvable dans "
        + "paie_parametres (DUREE_MENSUELLE). ⛔ Les quotités du contrat "
        + "(S21.G00.40.012 et 013) NE SONT PAS DÉCLARÉES — elles sont "
        + "obligatoires.");
    }

    const estMission = q(ct.type_contrat) === "mission";
    const siretEu = q(ct.eu_siret).replace(/\D/g, "");
    const missionValide = estMission && siretEu.length === 14
      && cleLuhnValide(siretEu);
    const lieuTravail = missionValide ? siretEu : siret;
    const tempsPlein = !ct.duree_hebdo || Number(ct.duree_hebdo) >= 35;

    ecrire("S21.G00.40.001", dateDsn(ct.date_debut));
    ecrire("S21.G00.40.002", statutConv);
    if (statutRc) ecrire("S21.G00.40.003", statutRc);
    if (q(ct.pcs_ese)) ecrire("S21.G00.40.004", q(ct.pcs_ese));
    else {
      anomalies.push(qui + " : code PCS-ESE absent (S21.G00.40.004) — "
        + "nomenclature INSEE des professions, rubrique obligatoire.");
    }
    if (!q(ct.intitule_poste)) {
      anomalies.push(qui + " : libellé de l'emploi absent (S21.G00.40.006). "
        + "⛔ RUBRIQUE OBLIGATOIRE.");
    }
    ecrire("S21.G00.40.006", ct.intitule_poste);
    ecrire("S21.G00.40.007", natureContrat || "");
    ecrire("S21.G00.40.008", q(ct.dispositif_public) || "99");
    ecrire("S21.G00.40.009", numeroContrat);
    if (ct.date_fin) ecrire("S21.G00.40.010", dateDsn(ct.date_fin));

    const uniteQuotite = await code("S21.G00.40.011", "heure");
    if (uniteQuotite) ecrire("S21.G00.40.011", uniteQuotite);
    else {
      anomalies.push("Unité de mesure de la quotité sans code DSN "
        + "(S21.G00.40.011). ⛔ NON DÉCLARÉE — rubrique obligatoire.");
    }
    if (dureeMensuelleRef > 0) {
      ecrire("S21.G00.40.012", montantDsn(dureeMensuelleRef));
      const hebdo = ct.duree_hebdo ? Number(ct.duree_hebdo) : 35;
      const quotite = dureeMensuelleRef * Math.min(hebdo, 35) / 35;
      ecrire("S21.G00.40.013", montantDsn(Math.round(quotite * 100) / 100));
    }
    ecrire("S21.G00.40.014", tempsPlein ? "10" : "20");
    ecrire("S21.G00.40.016", q(ct.regime_alsace_moselle) || "99");
    ecrire("S21.G00.40.017", q(ct.idcc) ? String(ct.idcc).padStart(4, "0") : "9999");
    ecrire("S21.G00.40.018", q(ct.regime_maladie) || "200");
    ecrire("S21.G00.40.019", lieuTravail);
    ecrire("S21.G00.40.020", q(ct.regime_vieillesse) || "200");

    if (q(ct.type_contrat) === "mission" || q(ct.type_contrat) === "cdd") {
      const codeRecours = await code("S21.G00.40.021", q(ct.motif_recours));
      if (codeRecours) ecrire("S21.G00.40.021", codeRecours);
      else {
        anomalies.push(qui + " : motif de recours « " + q(ct.motif_recours)
          + " » sans code DSN (S21.G00.40.021). ⛔ NON DÉCLARÉ — obligatoire "
          + "sur un contrat de mission ou un CDD.");
      }
    }

    ecrire("S21.G00.40.024", q(ct.travailleur_etranger) || "99");
    ecrire("S21.G00.40.026", q(ct.statut_emploi) || "04");
    ecrire("S21.G00.40.036", q(ct.emplois_multiples) || "01");
    ecrire("S21.G00.40.037", q(ct.employeurs_multiples) || "01");

    // ⚠️ LE MOTIF DE L EVENEMENT EST UN CODE DE LA NORME, lu en base. Le
    // deviner ferait declarer une fin de CDD comme un licenciement
    // economique — les deux n ouvrent pas les memes droits.
    const { data: codesMotif } = await supabase
      .from("dsn_codes")
      .select("*")
      .eq("rubrique", estArret ? "S21.G00.60.001" : "S21.G00.62.002")
      .is("date_fin", null);

    let codeMotif = "";
    for (const k of (codesMotif || [])) {
      if (q((k as any).correspondance) === q((ev as any).motif)) {
        codeMotif = q((k as any).code);
      }
    }
    if (!codeMotif) {
      anomalies.push("⛔ MOTIF « " + q((ev as any).motif) + " » SANS CODE DSN "
        + "actif pour la rubrique "
        + (estArret ? "S21.G00.60.001" : "S21.G00.62.002")
        + ". Le signalement ne peut pas être déposé.");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🚨 L ORDRE DES ENFANTS DU CONTRAT : 60 ou 62, puis 63, puis 71.
    //
    // L arret (60), la fin de contrat (62) et la retraite complementaire
    // (71) sont tous trois enfants du CONTRAT. Entre freres, l ordre est
    // celui des numeros : le 71 vient donc APRES l evenement, pas juste
    // apres le contrat comme dans la mensuelle — ou il n a pas de frere
    // plus petit que lui.
    // ═══════════════════════════════════════════════════════════════════

    if (estArret) {
      // ═══════════════════════════════════════════════════════════════
      // ── S21.G00.60 — L ARRET DE TRAVAIL ──
      //
      // 🚨 LA SUBROGATION DECIDE QUI TOUCHE LES INDEMNITES. Quand
      // l employeur maintient le salaire, il percoit les IJSS a la place
      // du salarie — et doit donner son IBAN. L oublier fait verser les
      // indemnites au salarie qui a deja ete paye, et il faut les lui
      // reclamer ensuite.
      //
      // ⚠️ LE DERNIER JOUR TRAVAILLE N EST PAS LA VEILLE DE L ARRET quand
      // le salarie a travaille le matin puis consulte l apres-midi. C est
      // lui qui fixe le point de depart du delai de carence.
      // ═══════════════════════════════════════════════════════════════
      ecrire("S21.G00.60.001", codeMotif);
      ecrire("S21.G00.60.002", dateDsn((ev as any).dernier_jour_travaille
        || (ev as any).date_debut));
      if (q((ev as any).date_fin)) {
        ecrire("S21.G00.60.003", dateDsn((ev as any).date_fin));
      }
      ecrire("S21.G00.60.004", (ev as any).subrogation ? "01" : "02");

      if ((ev as any).subrogation) {
        ecrire("S21.G00.60.005", dateDsn((ev as any).subro_debut
          || (ev as any).date_debut));
        if (q((ev as any).subro_fin)) {
          ecrire("S21.G00.60.006", dateDsn((ev as any).subro_fin));
        }
        // ⛔ SANS IBAN, LES INDEMNITES NE PEUVENT PAS ETRE VERSEES a
        // l employeur : la subrogation est declaree mais inopérante.
        if (q((ev as any).iban)) {
          ecrire("S21.G00.60.007", q((ev as any).iban).replace(/\s/g, ""));
          if (q((ev as any).bic)) ecrire("S21.G00.60.008", (ev as any).bic);
        } else {
          anomalies.push("⛔ SUBROGATION DÉCLARÉE SANS IBAN : les indemnités "
            + "journalières ne pourront pas être versées à l'employeur. "
            + "Renseigner l'IBAN sur l'événement.");
        }
      }
    } else {
      // ═══════════════════════════════════════════════════════════════
      // ── S21.G00.62 — LA FIN DU CONTRAT ──
      //
      // 🚨 CE SIGNALEMENT REMPLACE L ATTESTATION EMPLOYEUR. France Travail
      // s en sert pour ouvrir les droits : un motif faux, et le salarie
      // est prive d allocation ou en recoit une a tort.
      //
      // ⚠️ LE DERNIER JOUR PAYE AU SALAIRE HABITUEL n est pas toujours la
      // date de fin : un preavis non effectue mais paye les separe.
      //
      // 🆕 DEUX RUBRIQUES RECLAMEES PAR dsn-val (CST-03) :
      //   · 62.008 « Transaction en cours » — 01 oui, 02 non. Une
      //     transaction est un accord signe APRES la rupture pour eviter un
      //     proces ; ses sommes retardent l indemnisation. Elle est RARE, et
      //     ne se presume pas : « non » tant qu elle n est pas saisie.
      //   · 62.020 « Mois de la DSN mensuelle portant les derniers elements
      //     declares dans le FCTU » — le mois du bulletin repris ci-dessous.
      //     C est lui qui permet a l organisme de rapprocher le signalement
      //     de la mensuelle, et de ne pas compter deux fois la meme paie.
      // ═══════════════════════════════════════════════════════════════
      ecrire("S21.G00.62.001", dateDsn(dateFinContrat));
      ecrire("S21.G00.62.002", codeMotif);
      if (q((ev as any).date_notification)) {
        ecrire("S21.G00.62.003", dateDsn((ev as any).date_notification));
      }
      ecrire("S21.G00.62.006", dateDsn((ev as any).dernier_jour_paye
        || dateFinContrat));
      ecrire("S21.G00.62.008", (ev as any).transaction_en_cours ? "01" : "02");
      ecrire("S21.G00.62.020", dateDsn(periode));

      // ═══════════════════════════════════════════════════════════════
      // ── S21.G00.63 — LE PREAVIS ──
      //
      // 🆕🚨 CE BLOC EST OBLIGATOIRE MEME QUAND IL N Y A PAS DE PREAVIS —
      // dsn-val : « sous-groupe S21.G00.63 absent apres S21.G00.62 ». Il se
      // declare alors « 90 - pas de clause de preavis applicable », et la
      // consigne officielle precise que les deux dates NE SE RENSEIGNENT
      // PAS dans ce cas.
      //
      // ⛔ POUR UN LICENCIEMENT OU UNE DEMISSION, LE PREAVIS SE SAISIT : le
      // type (effectue et paye, non effectue et paye, non effectue et non
      // paye…) et ses deux dates. L ecran ne le demande pas encore. Tant
      // qu il manque, le bloc n est PAS ecrit et le signalement le dit — on
      // n invente pas un preavis, il decale le debut de l indemnisation.
      // ═══════════════════════════════════════════════════════════════
      const typePreavis = q((ev as any).preavis_type)
        || (MOTIFS_SANS_PREAVIS.indexOf(codeMotif) >= 0 ? "90" : "");
      if (typePreavis) {
        ecrire("S21.G00.63.001", typePreavis);
        if (typePreavis !== "90") {
          ecrire("S21.G00.63.002", dateDsn((ev as any).preavis_debut));
          ecrire("S21.G00.63.003", dateDsn((ev as any).preavis_fin));
          if (!dateDsn((ev as any).preavis_debut) || !dateDsn((ev as any).preavis_fin)) {
            anomalies.push("⛔ PRÉAVIS DE TYPE « " + typePreavis + " » SANS SES DEUX "
              + "DATES (S21.G00.63.002 et 003). Elles sont obligatoires dès "
              + "qu'un préavis s'applique.");
          }
        }
      } else if (codeMotif) {
        anomalies.push("⛔ LE MOTIF « " + codeMotif + " » OUVRE UN PRÉAVIS, et "
          + "il n'est pas renseigné sur l'événement (type, date de début, date "
          + "de fin). Le bloc S21.G00.63 est obligatoire : LE SIGNALEMENT SERA "
          + "REJETÉ. La saisie du préavis n'existe pas encore à l'écran.");
      }
    }

    // ── S21.G00.71 — LA RETRAITE COMPLEMENTAIRE ──
    //
    // 🆕🚨 dsn-val : « sous-groupe S21.G00.71 absent apres S21.G00.40 ».
    // CONTROLE CCH-17 : un salarie declare « 04 - non cadre » en statut
    // categoriel EXIGE un bloc 71 portant RETA, RUAA ou CAVEC — quelle que
    // soit la nature de la declaration.
    ecrire("S21.G00.71.002", q(ct.regime_retraite_c) || "RUAA");

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 LA DERNIERE PAIE — BLOCS 50, 51, 53, 58, 78, 79, 81 ET 86
    //
    // dsn-val : « sous-groupe S21.G00.50 absent apres S21.G00.30 ».
    //
    // ⚠️ TOUT CE QUI SUIT EST REPRIS DE LA MENSUELLE, A L IDENTIQUE : memes
    // rubriques, meme ordre, memes sources. La mensuelle est passee dans
    // dsn-val sans anomalie, et le FCTU declare LA MEME PAIE — les deux
    // fichiers ne doivent pas pouvoir diverger d un centime.
    //
    // 🚨 IL NE RECALCULE RIEN. Il lit `detail`, la photographie du calcul
    // gardee dans le bulletin emis.
    //
    // ⛔ UN ARRET DE TRAVAIL NE PORTE PAS CES BLOCS : il ne declare pas de
    // paie, les indemnites se calculent sur les mensuelles deja deposees.
    // ═══════════════════════════════════════════════════════════════════
    if (b) {
      if (!bulletinDuMois) {
        anomalies.push("⚠️ AUCUN BULLETIN ÉMIS POUR LE MOIS DE LA FIN DU CONTRAT ("
          + dateFinContrat.slice(5, 7) + "/" + dateFinContrat.slice(0, 4)
          + ") : la paie déclarée est celle du bulletin " + q(b.numero) + " ("
          + q(b.periode).slice(5, 7) + "/" + q(b.periode).slice(0, 4) + "), le "
          + "plus récent. ⛔ POUR UN DÉPÔT RÉEL, ÉMETTRE D'ABORD LE DERNIER "
          + "BULLETIN : France Travail calcule les droits sur la dernière paie.");
      }

      const debutPeriode = dateDsn(periode);
      const finPeriode = finDeMois(periode);

      // ── S21.G00.50 — LE VERSEMENT ──
      ecrire("S21.G00.50.001", finPeriode);
      ecrire("S21.G00.50.002", montantDsn(b.net_imposable));
      ecrire("S21.G00.50.003", "01");
      ecrire("S21.G00.50.004", montantDsn(b.net_a_payer));
      ecrire("S21.G00.50.006", montantDsn(0));
      ecrire("S21.G00.50.007", "13");          // taux neutre
      ecrire("S21.G00.50.009", montantDsn(b.prelevement_source));
      ecrire("S21.G00.50.013", montantDsn(b.net_imposable));

      // ── S21.G00.51 — LES QUATRE REMUNERATIONS ──
      //
      // 001 brut non plafonne · 003 salaire retabli · 010 salaire de base,
      // et la 002 EN DERNIER parce qu elle seule porte un enfant, le bloc
      // activite (53).
      // ⛔ LE TYPE 003 NE SE MET PAS A ZERO : sans absence, il est egal au
      // brut. Il sert au calcul des indemnites journalieres.
      const remuneration = function (typeRem: string, montant: number) {
        ouvrir("S21.G00.51");
        ecrire("S21.G00.51.001", debutPeriode);
        ecrire("S21.G00.51.002", finPeriode);
        ecrire("S21.G00.51.010", numeroContrat);
        ecrire("S21.G00.51.011", typeRem);
        ecrire("S21.G00.51.013", montantDsn(montant));
      };

      remuneration("001", Number(b.brut || 0));
      remuneration("003", Number(b.brut || 0));

      const base010 = salaireDeBaseDsn(detail, ct);
      if (base010) {
        remuneration("010", base010.montant);
        if (base010.repli) {
          anomalies.push(qui + " : le salaire de base déclaré (S21.G00.51, type "
            + "010) vient d'un repli — " + base010.repli + ", soit "
            + montantDsn(base010.montant) + " EUR. À VÉRIFIER.");
        }
      } else {
        anomalies.push(qui + " : salaire de base introuvable, ni sur le "
          + "bulletin ni sur le contrat. ⛔ LA RÉMUNÉRATION DE TYPE 010 N'EST "
          + "PAS DÉCLARÉE.");
      }

      remuneration("002", Number(b.brut || 0));

      // ── S21.G00.53 — L ACTIVITE, sous la remuneration 002 ──
      // 🚨 C EST LE VOLUME DE TRAVAIL QUI FONDE LES DROITS AU CHOMAGE.
      if (dureeMensuelleRef > 0) {
        ecrire("S21.G00.53.001", "01");
        ecrire("S21.G00.53.002", montantDsn(dureeMensuelleRef));
        ecrire("S21.G00.53.003", "10");
      }

      // ── S21.G00.58 — LE MONTANT NET SOCIAL ──
      ecrire("S21.G00.58.001", debutPeriode);
      ecrire("S21.G00.58.002", finPeriode);
      ecrire("S21.G00.58.003", "03");
      ecrire("S21.G00.58.004", montantDsn(b.net_social));

      // ── S21.G00.78 / 79 / 81 — LES ASSIETTES ET LEURS COTISATIONS ──
      //
      // 🚨 LA HIERARCHIE SE LIT DANS L ORDRE DES LIGNES : une cotisation (81)
      // est enfant de l assiette (78) qui la precede. On ecrit donc assiette
      // par assiette — la base, ses composants, ses cotisations.
      // ⚠️ PLUSIEURS COTISATIONS INTERNES PARTAGENT UN MEME CODE DSN (les
      // deux CSG sont le 072) : ON LES ADDITIONNE.
      const parAssiette: any = {};
      let patronaleT1 = 0;

      for (const l of (detail.lignes_cotisations || [])) {
        const interne = q(l.code);
        const montant = Number(l.part_salariale || 0) + Number(l.part_patronale || 0);
        if (montant === 0) continue;

        const { data: corr } = await supabase
          .from("dsn_codes")
          .select("code, base_rattachement")
          .eq("rubrique", "S21.G00.81.001")
          .eq("correspondance", interne)
          .lte("date_effet", periode)
          .or("date_fin.is.null,date_fin.gte." + periode)
          .order("date_effet", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!corr || !(corr as any).code) {
          anomalies.push("Aucun code DSN pour la cotisation « " + interne
            + " » (" + montantDsn(montant) + " EUR). ⛔ NON DÉCLARÉE.");
          continue;
        }
        if (!(corr as any).base_rattachement) {
          anomalies.push("La cotisation « " + interne + " » (code "
            + (corr as any).code + ") n'a pas de base de rattachement dans "
            + "dsn_codes. ⛔ NON DÉCLARÉE.");
          continue;
        }

        const cdDsn = String((corr as any).code);
        const bAss = String((corr as any).base_rattachement);
        if (!parAssiette[bAss]) parAssiette[bAss] = { assiette: 0, codes: {} };
        if (Number(l.base) > parAssiette[bAss].assiette) {
          parAssiette[bAss].assiette = Number(l.base);
        }
        if (!parAssiette[bAss].codes[cdDsn]) {
          parAssiette[bAss].codes[cdDsn] = { montant: 0, base: Number(l.base) };
        }
        parAssiette[bAss].codes[cdDsn].montant += montant;

        // SIG-18 : tout bloc 131 s accompagne d un bloc 142.
        if (cdDsn === "131") patronaleT1 += Number(l.part_patronale || 0);
      }

      const cotisation = function (cd: string, base: number, montant: number) {
        ouvrir("S21.G00.81");
        ecrire("S21.G00.81.001", cd);
        ecrire("S21.G00.81.003", montantDsn(base));
        ecrire("S21.G00.81.004", montantDsn(montant));
      };

      const ordreAssiettes = ["03", "02", "04", "07"];
      for (const bAss of ordreAssiettes) {
        const grp = parAssiette[bAss];
        if (!grp) continue;

        ouvrir("S21.G00.78");
        ecrire("S21.G00.78.001", bAss);
        ecrire("S21.G00.78.002", debutPeriode);
        ecrire("S21.G00.78.003", finPeriode);
        ecrire("S21.G00.78.004", montantDsn(grp.assiette));
        ecrire("S21.G00.78.006", numeroContrat);

        // LA REDUCTION GENERALE, SOUS L ASSIETTE DEPLAFONNEE — CCH-17 : les
        // codes 018 et 106 exigent un bloc 79 « montant du SMIC retenu »
        // sous la meme assiette 03. LE MONTANT S ECRIT EN NEGATIF.
        if (bAss === "03" && Number(detail.rgdu || 0) > 0) {
          const rgdu = Number(detail.rgdu);
          let eligibleRetraite = 0;
          let eligibleAutres = 0;
          for (const l of (detail.lignes_cotisations || [])) {
            if (!l.eligible_rgdu) continue;
            const pat = Number(l.part_patronale || 0);
            if (RETRAITE_COMPLEMENTAIRE.indexOf(q(l.code)) >= 0) eligibleRetraite += pat;
            else eligibleAutres += pat;
          }
          const totalEligible = eligibleRetraite + eligibleAutres;

          if (totalEligible <= 0) {
            anomalies.push(qui + " : réduction générale de " + montantDsn(rgdu)
              + " EUR sans cotisation éligible à réduire. ⛔ NON DÉCLARÉE.");
          } else {
            // ON ARRONDIT UNE SEULE PART ET ON DEDUIT L AUTRE : la somme des
            // deux fait EXACTEMENT la reduction du bulletin.
            const partRetraite = Math.round(rgdu * eligibleRetraite / totalEligible * 100) / 100;
            const partAutres = Math.round((rgdu - partRetraite) * 100) / 100;

            const codeSmic = await code("S21.G00.79.001", "smic_rgdu");
            const smicRetenu = detail.rgdu_detail
              ? Number(detail.rgdu_detail.smic_mensuel_reference || 0) : 0;

            if (codeSmic && smicRetenu > 0) {
              ouvrir("S21.G00.79");
              ecrire("S21.G00.79.001", codeSmic);
              ecrire("S21.G00.79.004", montantDsn(smicRetenu));
            } else {
              anomalies.push(qui + " : montant du SMIC retenu pour la réduction "
                + "générale absent (S21.G00.79). ⛔ OBLIGATOIRE — contrôle "
                + "CCH-17.");
            }

            const code018 = await code("S21.G00.81.001", "rgdu_secu");
            const code106 = await code("S21.G00.81.001", "rgdu_retraite");
            if (code018 && partAutres !== 0) cotisation(code018, grp.assiette, -partAutres);
            if (code106 && partRetraite !== 0) cotisation(code106, grp.assiette, -partRetraite);
            if (!code018 || !code106) {
              anomalies.push("Codes de réduction générale absents de dsn_codes. "
                + "⛔ LA RÉDUCTION DE " + montantDsn(rgdu) + " EUR N'EST PAS "
                + "DÉCLARÉE.");
            }
          }
        }

        const listeCodes = Object.keys(grp.codes).sort();
        for (const cd of listeCodes) {
          cotisation(cd, grp.codes[cd].base, grp.codes[cd].montant);
          if (cd === "131" && patronaleT1 > 0) {
            const code142 = await code("S21.G00.81.001", "agirc_part_patronale_t1");
            if (code142) cotisation(code142, grp.codes[cd].base, patronaleT1);
            else {
              anomalies.push("Code 142 (part patronale Agirc-Arrco T1) absent de "
                + "dsn_codes. ⛔ OBLIGATOIRE avec le code 131 — contrôle "
                + "SIG-18.");
            }
          }
        }
      }

      // ── S21.G00.86 — L ANCIENNETE ──
      // ⚠️ ELLE SE COMPTE A LA FIN DU CONTRAT, pas a la fin du mois du
      // bulletin : c est l anciennete ACQUISE AU JOUR DE LA RUPTURE qui
      // fonde le preavis et les indemnites.
      // 🚨 UNE ANCIENNETE NULLE EST INTERDITE : en dessous d un mois, la
      // norme demande de compter en JOURS.
      if (q(ct.date_debut)) {
        const d0 = new Date(String(ct.date_debut));
        const d1 = new Date(dateFinContrat);
        let mois = (d1.getFullYear() - d0.getFullYear()) * 12
          + (d1.getMonth() - d0.getMonth());
        if (d1.getDate() < d0.getDate()) mois -= 1;
        if (mois < 0) mois = 0;
        const joursAnciennete = Math.max(1, Math.round(
          (d1.getTime() - d0.getTime()) / 86400000) + 1);

        ecrire("S21.G00.86.001", "07");
        if (mois >= 1) {
          ecrire("S21.G00.86.002", "02");      // unite : mois
          ecrire("S21.G00.86.003", String(mois));
        } else {
          ecrire("S21.G00.86.002", "01");      // unite : jours
          ecrire("S21.G00.86.003", String(joursAnciennete));
        }
        ecrire("S21.G00.86.005", numeroContrat);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── S21.G00.85 — LE LIEU DE TRAVAIL ──
    //
    // 🆕🚨 dsn-val, controle CCH-11 de la rubrique 40.019 : le lieu designe
    // par le contrat doit exister en bloc 85. SA PLACE EST APRES L INDIVIDU,
    // comme dans la mensuelle : il est enfant de l etablissement, et entre
    // freres le 85 ferme la marche.
    //
    // ⚠️ CE BLOC SE REMPLIT EN ENTIER OU PAS DU TOUT : sans nature juridique
    // le SIRET est refuse, et sans code INSEE la commune n est pas situee.
    // ═══════════════════════════════════════════════════════════════════
    if (missionValide) {
      const insee = q(ct.eu_code_insee);
      const cpLieu = q(ct.eu_code_postal);
      if (!insee || !cpLieu || !q(ct.eu_adresse) || !q(ct.eu_ville)) {
        anomalies.push("Lieu de travail " + siretEu + " : adresse, code postal, "
          + "ville ou code INSEE manquant. ⛔ LE BLOC S21.G00.85 N'EST PAS "
          + "DÉCLARÉ, alors que le contrat le désigne (S21.G00.40.019). "
          + "Compléter le contrat (colonnes eu_adresse, eu_code_postal, "
          + "eu_ville, eu_code_insee).");
      } else {
        ecrire("S21.G00.85.001", siretEu);
        ecrire("S21.G00.85.002", apeDsn(ct.eu_code_ape));
        ecrire("S21.G00.85.003", ct.eu_adresse);
        ecrire("S21.G00.85.004", cpLieu);
        ecrire("S21.G00.85.005", ct.eu_ville);
        ecrire("S21.G00.85.010", q(ct.eu_nature_juridique) || "01");
        ecrire("S21.G00.85.011", insee);
      }
    } else {
      if (estMission && siretEu) {
        anomalies.push(qui + " : le SIRET de l'entreprise utilisatrice « "
          + siretEu + " » ne respecte pas la clé de Luhn. Le lieu de travail "
          + "déclaré est celui de l'employeur.");
      }
      ecrire("S21.G00.85.001", siret);
      ecrire("S21.G00.85.002", codeApe);
      ecrire("S21.G00.85.003", societe.adresse);
      ecrire("S21.G00.85.004", q(societe.code_postal));
      ecrire("S21.G00.85.005", societe.ville);
      ecrire("S21.G00.85.010", "01");
      if (q(societe.code_insee)) ecrire("S21.G00.85.011", societe.code_insee);
      else {
        anomalies.push("Code INSEE de la commune absent pour l'établissement "
          + "employeur (S21.G00.85.011). ⛔ LE BLOC LIEU DE TRAVAIL SERA "
          + "REJETÉ. Renseigner compta_societes.code_insee.");
      }
    }

    // ── S90 — LE TOTAL ──
    const nbRubriques = L.length + 2;
    L.push("S90.G00.90.001,'" + nbRubriques + "'");
    L.push("S90.G00.90.002,'1'");

    const contenu = L.join("\r\n") + "\r\n";

    // L EXTENSION EST « .txt », COMME CELLE DE LA MENSUELLE : iOS ne
    // telecharge pas un « .dsn ». Dans dsn-val, passer le filtre de la
    // fenetre d ouverture sur « Tous les fichiers ».
    const nomFichier = "DSN-" + siret + "-"
      + (estArret ? "ARRET" : "FCTU") + "-"
      + (estArret ? dateEv : dateFinContrat).replace(/-/g, "") + ".txt";

    const { error: eMaj } = await supabase
      .from("paie_evenements")
      .update({ fichier: contenu, statut: "genere" })
      .eq("id", evenementId);
    if (eMaj) {
      return NextResponse.json({ erreur: eMaj.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      nom_fichier: nomFichier,
      nature: nature,
      type: estArret ? "arrêt de travail" : "fin de contrat",
      salarie: qui,
      bulletin: b ? q(b.numero) : null,
      lignes: L.length,
      contenu: contenu,
      anomalies: anomalies,
      reserves: [
        "⛔ PASSER LE FICHIER DANS dsn-val avant tout dépôt réel.",
        "L'envoi est en MODE ESSAI (S10.G00.00.005 = 01). Passer à 02 pour "
          + "un dépôt réel.",
        "⚠️ DÉLAI LÉGAL DE CINQ JOURS : au-delà, "
          + (estArret
            ? "les indemnités journalières du salarié sont retardées."
            : "l'ancien salarié ne peut pas ouvrir ses droits au chômage."),
        estArret
          ? "Le signalement d'arrêt de travail n'est pas encore passé dans "
            + "dsn-val."
          : "Le préavis ne se saisit pas encore à l'écran : seuls les motifs "
            + "sans préavis (fin de CDD, fin de mission, fin d'essai, rupture "
            + "conventionnelle) peuvent être déposés.",
        "Le canal de transmission n'est pas branché : le fichier se dépose "
          + "à la main sur net-entreprises.",
      ],
      message: anomalies.length > 0
        ? "⚠️ " + anomalies.length + " anomalie(s) à corriger avant dépôt."
        : "Signalement généré. Aucune anomalie détectée à la génération.",
    });

  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
