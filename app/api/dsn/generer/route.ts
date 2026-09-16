import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 120;

// ═══════════════════════════════════════════════════════════════════════
// LE GENERATEUR DE DSN MENSUELLE — 16/09/2026, corrige le meme jour
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
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 16/09 — LES CORRECTIONS APRES LE PREMIER FICHIER SORTI
//
// Le premier fichier a ete genere puis relu ligne par ligne. Il portait
// sept defauts, dont deux qui coutaient de l argent tous les mois.
//
// 1. 🚨🚨 TOUT LE BLOC S10 ETAIT DECALE D UN CRAN. La structure officielle,
//    verifiee le 16/09 (liste des rubriques CNETP, cahier technique NEODeS) :
//      001 Nom du logiciel utilise
//      002 Nom de l editeur
//      003 Numero de version du logiciel
//      004 Code de conformite en pre-controle (conditionnel)
//      005 Code envoi du fichier d essai ou reel
//      006 Numero de version de la norme utilisee
//      007 Point de depot
//      008 Type de l envoi
//    Le fichier declarait donc le NOM DU LOGICIEL a « 02 », l EDITEUR a
//    « Mr Comptable » et la VERSION a « AcadeMIA Pro LLC ». Les rubriques
//    007 et 008 manquaient alors qu elles sont obligatoires.
//
// 2. 🚨🚨 LA REDUCTION GENERALE N ETAIT PAS DECLAREE DU TOUT. 387,53 EUR
//    pour un seul salarie, absents du fichier : l URSSAF aurait reclame la
//    totalite des cotisations. Voir le bloc RGDU plus bas.
//
// 3. 🚨 LES CODES DE COTISATION ETAIENT LES NOTRES. S21.G00.81.001 attend
//    les codes NUMERIQUES de la norme (018, 040, 048, 072, 131…), pas
//    « MALADIE » ni « CSG_DED ». Les quatorze lignes du premier fichier
//    etaient non conformes.
//    ⛔ LE GENERATEUR REFUSE DESORMAIS D ECRIRE UN CODE NON TRADUIT et le
//    signale, plutot que de produire un fichier rejete en bloc.
//
// 4. 🚨 LE SEXE ETAIT MIS A « 01 » PAR DEFAUT — donc tout le monde declare
//    homme. Il se lit dans le premier chiffre du NIR.
//
// 5. ⚠️ L IDENTIFIANT DE CONTRAT ETAIT UN UUID TRONQUE A VINGT CARACTERES,
//    tirets compris : « 99d1ad6c-f20b-421b-9 ».
//
// 6. ⚠️ LE CLASSEMENT DES ASSIETTES SE TROMPAIT : le test cherchait « PLAF »
//    n importe ou dans le code, donc VIEILLESSE_DEPLAF etait classee
//    plafonnee. Ici sans consequence (le brut est sous le plafond), faux
//    des qu un salaire le depasse.
//
// 7. ⚠️ LE CODE ENVOI D ESSAI : 01 = ESSAI, 02 = REEL. La passation disait
//    l inverse, et sur la mauvaise rubrique.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "documents-signes";

// 🚨 CES TROIS VALEURS IDENTIFIENT L ORIGINE D UNE ANOMALIE aupres des
// organismes. Elles designent LE LOGICIEL, pas l employeur declare.
const LOGICIEL = "Mr Comptable";
const EDITEUR = "AcadeMIA Pro LLC";
const VERSION_LOGICIEL = "1.0.0";

// 🚨 LA VERSION DE LA NORME (S10.G00.00.006). Elle change CHAQUE ANNEE :
// cahier technique publie en decembre, applicable en avril.
// ⚠️ LE FORMAT EST « PnnVmm » — P26V01 pour 2026. Le fichier precedent
// portait « 2601 », qui est la forme abregee qu on trouve sur des sites
// secondaires, pas celle du cahier technique.
// ⛔ A CONFIRMER DANS dsn-val AVANT TOUT DEPOT REEL.
const NORME = "P26V01";

// 🚨 CODE ENVOI DU FICHIER D ESSAI OU REEL — S10.G00.00.005.
// ⚠️ « 01 » = ESSAI, « 02 » = REEL. C est dans ce sens, et pas l inverse :
// verifie le 16/09 dans le cahier technique NEODeS. En essai, le bilan des
// controles est rendu quel que soit le resultat et AUCUNE donnee n est
// conservee par les organismes.
// ⛔ NE PASSER A « 02 » QUE LE JOUR D UN VRAI DEPOT.
const ENVOI = "01";

// ⚠️ POINT DE DEPOT — S10.G00.00.007. « 01 » pour net-entreprises (regime
// general). ⛔ A CONFIRMER DANS dsn-val.
const POINT_DEPOT = "01";

// ⚠️ TYPE DE L ENVOI — S10.G00.00.008. Il distingue un envoi normal d un
// envoi ne contenant que des declarations « sans individu ».
// ⛔ A CONFIRMER DANS dsn-val.
const TYPE_ENVOI = "01";

// 🚨 LES CODES DE COTISATION QUI RELEVENT DE LA RETRAITE COMPLEMENTAIRE.
// La reduction generale se ventile entre deux codes DSN, et c est cette
// liste qui decide de quel cote va chaque euro.
const RETRAITE_COMPLEMENTAIRE = ["RETRAITE_C_T1", "RETRAITE_C_T2", "CEG_T1", "CEG_T2"];

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
// ⚠️ IL ACCEPTE LES NEGATIFS : une reduction se declare avec son signe.
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

// 🆕 LE SEXE, DEDUIT DU NUMERO DE SECURITE SOCIALE.
//
// 🚨 SON PREMIER CHIFFRE LE DIT : 1 pour un homme, 2 pour une femme. C est
// une regle de construction du NIR, pas une convention locale.
// ⚠️ ON NE MET PLUS « 01 » PAR DEFAUT : le premier fichier declarait tout
// le monde homme, et personne ne l aurait vu — le bulletin n affiche pas le
// sexe.
// ⚠️ LE CHAMP SAISI L EMPORTE quand il existe : un salarie peut avoir un
// NIR dont le premier chiffre ne correspond pas a son etat civil actuel.
function sexeDsn(sexeSaisi: any, nir: string): string | null {
  const s = q(sexeSaisi).toUpperCase();
  if (s === "F" || s === "2" || s === "02") return "02";
  if (s === "M" || s === "1" || s === "01") return "01";
  if (nir.length >= 1) {
    if (nir[0] === "1") return "01";
    if (nir[0] === "2") return "02";
  }
  return null;
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
  const { data: societe, error: eSoc } = await supabase
    .from("compta_societes")
    .select("*")
    .eq("id", societeId)
    .maybeSingle();

  if (eSoc) return NextResponse.json({ erreur: "lecture impossible : " + eSoc.message }, { status: 500 });
  if (!societe) return NextResponse.json({ erreur: "societe introuvable" }, { status: 404 });

  // 🚨 LE SIRET EST INDISPENSABLE : c est lui qui identifie l etablissement
  // declarant. Sans lui, la DSN n a pas de destinataire.
  const siret = q(societe.siret);
  if (!siret || siret.length !== 14) {
    return NextResponse.json({
      erreur: "la société n'a pas de SIRET à 14 chiffres. ⛔ AUCUNE DSN N'EST "
        + "POSSIBLE SANS LUI : c'est l'identifiant de l'établissement déclarant. "
        + "Le renseigner dans compta_societes.siret.",
    }, { status: 400 });
  }

  // ---- LES BULLETINS EMIS DU MOIS ----
  const { data: bulletins, error: eBul } = await supabase
    .from("paie_bulletins")
    .select("*, paie_contrats(*, paie_salaries(*))")
    .eq("societe_id", societeId)
    .eq("periode", periode)
    .eq("statut", "emis")
    .order("numero");

  if (eBul) return NextResponse.json({ erreur: "lecture impossible : " + eBul.message }, { status: 500 });

  if (!bulletins || bulletins.length === 0) {
    return NextResponse.json({
      erreur: "aucun bulletin ÉMIS pour " + periode + ". "
        + "⛔ Un bulletin en brouillon n'a pas été remis au salarié : le "
        + "déclarer annoncerait un salaire qu'il n'a pas reçu. Émettre les "
        + "bulletins d'abord.",
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

  // ═══════════════════════════════════════════════════════════════════
  // ══ S10 — L ENVOI ══
  //
  // 🚨 L ORDRE DES HUIT RUBRIQUES N EST PAS NEGOCIABLE. Il a ete verifie
  // le 16/09 apres que le premier fichier les ait toutes decalees d un
  // cran. Chaque numero porte un sens precis, rappele en face.
  // ═══════════════════════════════════════════════════════════════════
  ecrire("S10.G00.00.001", LOGICIEL);          // nom du logiciel utilise
  ecrire("S10.G00.00.002", EDITEUR);           // nom de l editeur
  ecrire("S10.G00.00.003", VERSION_LOGICIEL);  // version du logiciel
  // ⚠️ 004 — code de conformite en pre-controle : conditionnel, delivre par
  // le GIP-MDS apres homologation. Tant qu il n existe pas, on ne l ecrit
  // pas : une rubrique inventee vaut moins qu une rubrique absente.
  ecrire("S10.G00.00.005", ENVOI);             // essai (01) ou reel (02)
  ecrire("S10.G00.00.006", NORME);             // version de la norme
  ecrire("S10.G00.00.007", POINT_DEPOT);       // point de depot
  ecrire("S10.G00.00.008", TYPE_ENVOI);        // type de l envoi

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
  let totalReductions = 0;

  // ══ S21.G00.30 — CHAQUE SALARIE ══
  for (const b of bulletins) {
    const ct = b.paie_contrats || {};
    const s = ct.paie_salaries || {};
    const detail = b.detail || {};
    const qui = q(s.prenom) + " " + q(s.nom);

    // 🚨 LE NIR EST LA CLE DE TOUTE LA DECLARATION. Sans lui, l organisme
    // ne sait a qui rattacher les cotisations, et le salarie ne voit rien
    // arriver sur son compte.
    const nir = q(s.numero_secu).replace(/\s/g, "");
    if (nir.length < 13) {
      anomalies.push(qui + " : numéro de sécurité sociale absent ou incomplet. "
        + "⛔ LA DÉCLARATION SERA REJETÉE.");
    }

    ecrire("S21.G00.30.001", nir);
    ecrire("S21.G00.30.002", s.nom);
    ecrire("S21.G00.30.004", s.prenom);

    // 🚨 LE SEXE SE DEDUIT DU NIR PLUTOT QUE DE VALOIR « 01 » PAR DEFAUT.
    const sexe = sexeDsn(s.sexe, nir);
    if (sexe) ecrire("S21.G00.30.005", sexe);
    else {
      anomalies.push(qui + " : sexe indéterminé (S21.G00.30.005) — ni saisi, "
        + "ni déductible du numéro de sécurité sociale. ⛔ RUBRIQUE OBLIGATOIRE.");
    }

    // 🚨 LA DATE DE NAISSANCE EST OBLIGATOIRE. Le premier fichier l omettait
    // en silence parce que l ecran de saisie n avait pas le champ : la
    // rubrique vide ne s ecrit pas, et rien ne le signalait.
    const naissance = dateDsn(s.date_naissance);
    if (naissance) ecrire("S21.G00.30.006", naissance);
    else {
      anomalies.push(qui + " : date de naissance absente (S21.G00.30.006). "
        + "⛔ RUBRIQUE OBLIGATOIRE — LA DÉCLARATION SERA REJETÉE.");
    }

    ecrire("S21.G00.30.007", s.lieu_naissance);
    ecrire("S21.G00.30.008", s.adresse);
    ecrire("S21.G00.30.009", q(s.code_postal));
    ecrire("S21.G00.30.010", s.ville);
    ecrire("S21.G00.30.011", q(s.pays) || "FR");

    if (!q(s.adresse) || !q(s.code_postal) || !q(s.ville)) {
      anomalies.push(qui + " : adresse incomplète (S21.G00.30.008 à 010).");
    }

    // ⚠️ L IDENTIFIANT DU SERVICE DE SANTE AU TRAVAIL est attendu depuis le
    // cahier technique 2026. Il se parametre sur l etablissement.
    if (q(societe.spst_identifiant)) {
      ecrire("S21.G00.30.030", societe.spst_identifiant);
    }

    // ══ S21.G00.40 — LE CONTRAT ══
    const natureContrat = await code("S21.G00.40.007", q(ct.type_contrat), periode);
    if (!natureContrat) {
      anomalies.push(qui + " : aucun code DSN pour le type de contrat « "
        + q(ct.type_contrat) + " » (S21.G00.40.007). "
        + "⛔ NON DÉCLARÉ. Ajouter la correspondance dans dsn_codes — "
        + "01 CDI, 02 CDD, 07 contrat de travail temporaire.");
    }

    // 🆕🚨 16/09 — LE STATUT CONVENTIONNEL NE S ECRIT PLUS EN DUR.
    //
    // DEFAUT TROUVE EN LISANT LA TABLE OFFICIELLE : le generateur posait
    // « 03 » faute de valeur saisie. Or 03 = CADRE DIRIGEANT
    // (art. L.3111-2). Tout salarie sans statut renseigne — donc tous —
    // etait declare cadre dirigeant. Le cariste de l essai en faisait
    // partie.
    //   01 Non-cadre · 02 Cadre (article 4) · 03 Cadre dirigeant
    //   04 Article 4 bis (assimile cadre retraite)
    // ⚠️ CE CODE COMMANDE LE REGIME DE RETRAITE COMPLEMENTAIRE et les
    // obligations de prevoyance : c est tout sauf anodin.
    // 🚨 IL SE DEDUIT DE LA CATEGORIE DU CONTRAT, par une correspondance en
    // base — comme les taux, comme les nomenclatures.
    let statutConv = q(ct.statut_conventionnel);
    if (!statutConv) {
      statutConv = (await code("S21.G00.40.002", q(ct.categorie), periode)) || "";
    }
    if (!statutConv) {
      anomalies.push(qui + " : statut conventionnel introuvable pour la "
        + "catégorie « " + q(ct.categorie) + " » (S21.G00.40.002). "
        + "⛔ NON DÉCLARÉ — ne jamais poser « 03 » par défaut, c'est "
        + "« cadre dirigeant ».");
    }

    ecrire("S21.G00.40.001", dateDsn(ct.date_debut));
    ecrire("S21.G00.40.002", statutConv);
    ecrire("S21.G00.40.007", natureContrat || "");
    ecrire("S21.G00.40.009", q(ct.idcc) ? String(ct.idcc).padStart(4, "0") : "9999");

    // ⚠️ LA QUOTITE DE TRAVAIL : le nombre d heures du contrat rapporte a
    // la duree de reference. Elle sert au calcul des droits.
    if (ct.quotite_travail) {
      ecrire("S21.G00.40.011", montantDsn(ct.quotite_travail));
    } else if (ct.duree_hebdo) {
      ecrire("S21.G00.40.011", montantDsn(ct.duree_hebdo));
    }

    // 🆕 L IDENTIFIANT DU CONTRAT — vingt caracteres maximum.
    // ⚠️ LE PREMIER FICHIER COUPAIT L UUID BRUT, TIRETS COMPRIS
    // (« 99d1ad6c-f20b-421b-9 ») : trois caracteres sur vingt etaient des
    // tirets, donc de l identifiant perdu pour rien. En retirant les tirets
    // d abord, les vingt caracteres sont vingt chiffres hexadecimaux — assez
    // pour que deux contrats ne puissent pas se confondre.
    ecrire("S21.G00.40.019", String(ct.id).replace(/-/g, "").slice(0, 20));

    // 🚨 LA PERIODE D ESSAI EST OBLIGATOIRE pour les CDI et les CDD de plus
    // de six mois depuis le cahier technique 2026.
    if (ct.essai_duree_jours) {
      ecrire("S21.G00.40.082", String(ct.essai_duree_jours));
    } else if (q(ct.type_contrat) === "cdi") {
      anomalies.push(qui + " : durée de période d'essai absente "
        + "(S21.G00.40.082), obligatoire pour un CDI depuis le cahier "
        + "technique 2026.");
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

    // ═══════════════════════════════════════════════════════════════
    // ══ S21.G00.78 / 79 / 81 — LES ASSIETTES ET LEURS COTISATIONS ══
    //
    // 🚨🚨 16/09, APRES LECTURE DU CAHIER TECHNIQUE : LA HIERARCHIE SE LIT
    // DANS L ORDRE DES LIGNES. Un bloc « Cotisation individuelle -
    // S21.G00.81 » est ENFANT du bloc « Base assujettie - S21.G00.78 » qui
    // le precede. Le generateur ecrivait toutes les bases, puis toutes les
    // cotisations : elles se rattachaient donc TOUTES a la derniere base
    // ecrite — la CSG. Une cotisation maladie declaree sous l assiette CSG
    // est un rejet assure.
    //
    // 🚨 ON ECRIT DESORMAIS, ASSIETTE PAR ASSIETTE : la base, puis ses
    // composants, puis ses cotisations. C est la structure que la norme
    // attend, et elle seule.
    //
    // ⚠️ PLUSIEURS COTISATIONS INTERNES PEUVENT PARTAGER UN MEME CODE DSN :
    // la CSG deductible et la non deductible sont toutes deux le code 072,
    // la retraite complementaire et la CEG sont toutes deux le 131. ON LES
    // ADDITIONNE au lieu d ecrire deux lignes — declarer deux fois le meme
    // code sous la meme assiette fait rejeter la declaration.
    // ═══════════════════════════════════════════════════════════════
    const parAssiette: any = {};
    let patronaleT1 = 0;

    for (const l of (detail.lignes_cotisations || [])) {
      const interne = q(l.code);
      const montant = Number(l.part_salariale || 0) + Number(l.part_patronale || 0);

      // ⚠️ UNE COTISATION A ZERO NE SE DECLARE PAS : l AT/MP sans taux
      // renseigne n a rien a dire a l URSSAF.
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

      if (!corr || !corr.code) {
        anomalies.push("Aucun code DSN pour la cotisation « " + interne
          + " » (" + montantDsn(montant) + " EUR). ⛔ NON DÉCLARÉE. "
          + "Renseigner la correspondance dans dsn_codes depuis le cahier "
          + "technique NEODeS.");
        continue;
      }
      if (!corr.base_rattachement) {
        anomalies.push("La cotisation « " + interne + " » (code " + corr.code
          + ") n'a pas de base de rattachement dans dsn_codes. ⛔ NON "
          + "DÉCLARÉE : on ne devine pas sous quelle assiette la ranger.");
        continue;
      }

      const bAss = String(corr.base_rattachement);
      if (!parAssiette[bAss]) parAssiette[bAss] = { assiette: 0, codes: {} };

      // ⚠️ L ASSIETTE DE LA BASE EST LA PLUS GRANDE DE SES COTISATIONS :
      // toutes celles rangees sous une meme base portent la meme assiette.
      if (Number(l.base) > parAssiette[bAss].assiette) {
        parAssiette[bAss].assiette = Number(l.base);
      }

      if (!parAssiette[bAss].codes[corr.code]) {
        parAssiette[bAss].codes[corr.code] = { montant: 0, base: Number(l.base) };
      }
      parAssiette[bAss].codes[corr.code].montant += montant;

      // 🚨 CONTROLE SIG-18 DU CAHIER : tout bloc « 131 - regime unifie
      // Agirc-Arrco » doit etre accompagne d un bloc « 142 - part patronale
      // tranche T1 ». On cumule la part patronale pour l ecrire ensuite.
      if (corr.code === "131") patronaleT1 += Number(l.part_patronale || 0);
    }

    // ⚠️ L ORDRE DES ASSIETTES : la deplafonnee en premier, parce que c est
    // sous elle que se rattache la reduction generale (controle CCH-17).
    const ordreAssiettes = ["03", "02", "04", "07"];

    for (const bAss of ordreAssiettes) {
      const grp = parAssiette[bAss];
      if (!grp) continue;

      ecrire("S21.G00.78.001", bAss);
      ecrire("S21.G00.78.002", debutPeriode);
      ecrire("S21.G00.78.003", finPeriode);
      ecrire("S21.G00.78.004", montantDsn(grp.assiette));

      // ═══════════════════════════════════════════════════════════
      // ══ LA REDUCTION GENERALE, SOUS L ASSIETTE DEPLAFONNEE ══
      //
      // 🚨 CONTROLE CCH-17, mot pour mot : les codes 018 et 106 exigent un
      // bloc « Composant de base assujettie - S21.G00.79 » de type « 01 -
      // Montant du SMIC retenu » rattache au MEME bloc parent portant
      // « 03 - Assiette brute deplafonnee ».
      // 🚨 CONTROLE CCH-16 : l assiette ET le montant sont obligatoires sur
      // ces deux codes.
      // ⚠️ LE MONTANT S ECRIT EN NEGATIF : c est une reduction.
      // ═══════════════════════════════════════════════════════════
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
          // 🚨 ON ARRONDIT UNE SEULE PART ET ON DEDUIT L AUTRE : la somme
          // des deux fait EXACTEMENT la reduction du bulletin. Deux arrondis
          // independants laisseraient un centime d ecart entre la paie et la
          // declaration, et ce centime se voit au controle.
          const partRetraite = Math.round(rgdu * eligibleRetraite / totalEligible * 100) / 100;
          const partAutres = Math.round((rgdu - partRetraite) * 100) / 100;

          const codeSmic = await code("S21.G00.79.001", "smic_rgdu", periode);
          const smicRetenu = detail.rgdu_detail
            ? Number(detail.rgdu_detail.smic_mensuel_reference || 0) : 0;

          if (codeSmic && smicRetenu > 0) {
            ecrire("S21.G00.79.001", codeSmic);
            ecrire("S21.G00.79.004", montantDsn(smicRetenu));
          } else {
            anomalies.push(qui + " : montant du SMIC retenu pour la réduction "
              + "générale absent (S21.G00.79). ⛔ OBLIGATOIRE — contrôle CCH-17.");
          }

          const code018 = await code("S21.G00.81.001", "rgdu_secu", periode);
          const code106 = await code("S21.G00.81.001", "rgdu_retraite", periode);

          if (code018 && partAutres !== 0) {
            ecrire("S21.G00.81.001", code018);
            ecrire("S21.G00.81.003", montantDsn(grp.assiette));
            ecrire("S21.G00.81.004", montantDsn(-partAutres));
          }
          if (code106 && partRetraite !== 0) {
            ecrire("S21.G00.81.001", code106);
            ecrire("S21.G00.81.003", montantDsn(grp.assiette));
            ecrire("S21.G00.81.004", montantDsn(-partRetraite));
          }
          if (!code018 || !code106) {
            anomalies.push("Codes de réduction générale absents de dsn_codes. "
              + "⛔ LA RÉDUCTION DE " + montantDsn(rgdu) + " EUR N'EST PAS "
              + "DÉCLARÉE : l'URSSAF réclamera la totalité des cotisations.");
          } else {
            totalReductions += rgdu;
          }
        }
      }

      // ══ LES COTISATIONS DE CETTE ASSIETTE ══
      const listeCodes = Object.keys(grp.codes).sort();
      for (const cd of listeCodes) {
        ecrire("S21.G00.81.001", cd);
        ecrire("S21.G00.81.003", montantDsn(grp.codes[cd].base));
        ecrire("S21.G00.81.004", montantDsn(grp.codes[cd].montant));

        // 🚨 SIG-18 : le bloc 142 accompagne obligatoirement le 131.
        if (cd === "131" && patronaleT1 > 0) {
          const code142 = await code("S21.G00.81.001", "agirc_part_patronale_t1", periode);
          if (code142) {
            ecrire("S21.G00.81.001", code142);
            ecrire("S21.G00.81.003", montantDsn(grp.codes[cd].base));
            ecrire("S21.G00.81.004", montantDsn(patronaleT1));
          } else {
            anomalies.push("Code 142 (part patronale Agirc-Arrco T1) absent de "
              + "dsn_codes. ⛔ OBLIGATOIRE avec le code 131 — contrôle SIG-18.");
          }
        }
      }
    }

    // ══ S21.G00.70 — LE PRELEVEMENT A LA SOURCE ══
    //
    // ⚠️ LE TAUX VIENT DU COMPTE RENDU METIER DE LA DSN PRECEDENTE. Tant
    // qu aucune DSN n a ete deposee, il n y en a pas : on declare le taux
    // neutre (« 13 »), ce qui est la regle pour un salarie dont
    // l administration n a pas encore transmis de taux.
    // ⚠️ 70.001 EST LE TAUX, 70.004 LE MONTANT. Le premier fichier ecrivait
    // un montant dans la rubrique du taux, par une expression qui valait
    // zero dans tous les cas.
    ecrire("S21.G00.70.001", montantDsn(0));
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
      // ⚠️ LE TOTAL DECLARE EST NET DES REDUCTIONS : c est ce que
      // l employeur doit reellement, et ce que l URSSAF attend.
      total_cotisations: Math.round((totalCotisations - totalReductions) * 100) / 100,
      chemin_fichier: chemin,
      sha256: sha,
      nb_lignes: L.length,
      statut: "brouillon",
      notes: anomalies.length > 0 ? anomalies.join(" | ") : null,
    })
    .select().maybeSingle();

  if (eIns) {
    return NextResponse.json({
      erreur: "le fichier est archivé (" + chemin + ") mais son enregistrement "
        + "a échoué : " + eIns.message,
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
    total_cotisations: Math.round((totalCotisations - totalReductions) * 100) / 100,
    total_reductions: Math.round(totalReductions * 100) / 100,
    sha256: sha,
    url: signe ? signe.signedUrl : null,
    anomalies: anomalies,

    // 🚨 CE QUI RESTE AVANT UN DEPOT REEL, DIT FRANCHEMENT.
    avant_depot: [
      "⛔ PASSER LE FICHIER DANS dsn-val (outil officiel) : aucune DSN ne se dépose sans ce contrôle.",
      "⛔ RECOUPER LES CODES sur dsn-info.fr : ils portent tous verifie = false dans dsn_codes.",
      "L'envoi est en MODE ESSAI (S10.G00.00.005 = 01). Passer à 02 pour un dépôt réel.",
      "Le point de dépôt (007), le type d'envoi (008) et la version de norme « " + NORME + " » sont à confirmer dans dsn-val.",
      "Le taux de prélèvement à la source est neutre : le vrai taux vient du compte rendu métier.",
      "La clé de ventilation de la réduction générale entre les codes 018 et 106 est proportionnelle aux cotisations éligibles — à recouper avec la règle URSSAF.",
    ],
    message: "Fichier DSN généré en BROUILLON. "
      + (anomalies.length > 0
        ? "⚠️ " + anomalies.length + " anomalie(s) à corriger avant tout dépôt."
        : "Aucune anomalie détectée à la génération."),
  });
}
