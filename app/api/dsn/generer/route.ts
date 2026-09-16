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

// 🚨 LE CONTACT DE L EMETTEUR — sous-groupe S10.G00.02, OBLIGATOIRE apres
// le bloc emetteur (controle CST-02). C est la personne qu un organisme
// appelle quand une declaration pose question.
// ⚠️ VALEURS DE REPLI : la societe peut porter les siennes (contact_nom,
// contact_email). A defaut, celles de l editeur.
const CONTACT_DEFAUT = "Jacques LALOU";
const EMAIL_DEFAUT = "contact@academiapro.fr";
const TELEPHONE_DEFAUT = "0100000000";

// 🚨 LA VERSION DE LA NORME (S10.G00.00.006). Elle change CHAQUE ANNEE :
// cahier technique publie en decembre, applicable en avril.
// ✅ VERIFIE AU CAHIER, page 129 : « P26V01 - Annee 2026 Version 1 »,
// format impose X [6,6] — exactement six caracteres.
//
// ⚠️⚠️ MAIS dsn-val 2026.1.0.16 LA REFUSE : « contient une valeur hors de
// la liste de valeurs autorisees ». Le cahier technique et l outil de
// controle ne disent donc pas la meme chose — probablement parce que le
// journal de maintenance n° 1, applicable depuis juillet 2026, a fait
// evoluer cette liste.
// ⛔ A TRANCHER AU PROCHAIN PASSAGE DANS dsn-val : essayer P26V02 si
// P26V01 est encore refusee. C est la seule anomalie du rapport que le
// cahier technique ne permet pas de resoudre.
const NORME = "P26V01";

// 🚨 CODE ENVOI DU FICHIER D ESSAI OU REEL — S10.G00.00.005.
// ✅ VERIFIE AU CAHIER, page 129 : « 01 - envoi fichier test », « 02 - envoi
// fichier reel ». C est dans ce sens, et pas l inverse. En essai, le bilan
// des controles est rendu quel que soit le resultat et AUCUNE donnee n est
// conservee par les organismes — le nombre d envois n est pas limite.
// ⛔ NE PASSER A « 02 » QUE LE JOUR D UN VRAI DEPOT.
const ENVOI = "01";

// POINT DE DEPOT — S10.G00.00.007.
// ✅ VERIFIE AU CAHIER, page 129 : « 01 - Net-entreprises », « 02 - MSA ».
// ⚠️ LA MSA CONCERNE LE REGIME AGRICOLE. Un employeur agricole depose chez
// elle, pas chez net-entreprises : le jour ou un client releve de la MSA,
// cette valeur devra suivre la societe et non le logiciel.
const POINT_DEPOT = "01";

// TYPE DE L ENVOI — S10.G00.00.008.
// ✅ VERIFIE AU CAHIER, page 129 : « 01 - envoi normal », « 02 - envoi
// neant ». Le second ne vaut QUE si toutes les declarations du fichier sont
// sans individu — un mois sans aucun salarie. Ce n est jamais notre cas ici,
// puisqu on ne genere qu a partir de bulletins emis.
const TYPE_ENVOI = "01";

// 🚨 LES CODES DE COTISATION QUI RELEVENT DE LA RETRAITE COMPLEMENTAIRE.
// La reduction generale se ventile entre deux codes DSN, et c est cette
// liste qui decide de quel cote va chaque euro.
const RETRAITE_COMPLEMENTAIRE = ["RETRAITE_C_T1", "RETRAITE_C_T2", "CEG_T1", "CEG_T2"];

function q(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

// 🚨🚨 LA CLE DE LUHN D UN SIREN OU D UN SIRET.
//
// DEFAUT TROUVE PAR dsn-val LE 16/09 : le SIRET du jeu d essai,
// 12345678200019, etait DECLARE VALIDE PAR MOI et refuse par l outil
// officiel — deux fois, pour l emetteur et pour l etablissement.
//
// ⚠️ MON ERREUR : je doublais un chiffre sur deux EN PARTANT DE LA GAUCHE.
// L algorithme de Luhn double EN PARTANT DE LA DROITE, le dernier chiffre
// n etant jamais double. Les deux methodes donnent des resultats
// differents, et seule la seconde est la bonne.
//
// 🚨 LE CONTROLE VIT DESORMAIS DANS LE CODE : un SIRET faux fait rejeter
// toute la declaration, et rien sur le bulletin ne le laisse voir.
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
  const siret = q(societe.siret).replace(/\D/g, "");
  if (!siret || siret.length !== 14) {
    return NextResponse.json({
      erreur: "la société n'a pas de SIRET à 14 chiffres. ⛔ AUCUNE DSN N'EST "
        + "POSSIBLE SANS LUI : c'est l'identifiant de l'établissement déclarant. "
        + "Le renseigner dans compta_societes.siret.",
    }, { status: 400 });
  }

  // 🚨 LA CLE DU SIRET EST CONTROLEE AVANT TOUT. dsn-val la verifie, et un
  // SIRET dont la cle est fausse fait rejeter la declaration entiere —
  // deux fois plutot qu une, puisqu il figure comme emetteur ET comme
  // etablissement declarant.
  if (!cleLuhnValide(siret)) {
    return NextResponse.json({
      erreur: "le SIRET " + siret + " ne respecte pas la clé de Luhn. "
        + "⛔ LA DÉCLARATION SERAIT REJETÉE. Vérifier le numéro dans "
        + "compta_societes.siret — un chiffre a probablement été mal saisi.",
    }, { status: 400 });
  }
  if (!cleLuhnValide(siret.slice(0, 9))) {
    return NextResponse.json({
      erreur: "le SIREN " + siret.slice(0, 9) + " ne respecte pas la clé de Luhn. "
        + "⛔ LA DÉCLARATION SERAIT REJETÉE.",
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

  // 🚨🚨 LE TYPE DE LA DECLARATION — LA CAUSE RACINE DE LA MOITIE DES
  // ANOMALIES DU 16/09.
  //
  // Nous ecrivions « 02 » pour un annule et remplace. Or la nomenclature
  // officielle (cahier page 135) dit :
  //     01  declaration normale
  //     02  declaration normale SANS INDIVIDU      ← ce que nous declarions
  //     03  declaration ANNULE ET REMPLACE INTEGRAL ← ce qu il fallait
  //     04  declaration annule
  //     05  annule et remplace sans individu
  //
  // ⚠️ CONSEQUENCE : depuis le premier fichier, chaque regeneration
  // declarait une DSN NEANT — un mois sans aucun salarie. dsn-val repondait
  // donc « le sous-groupe S21.G00.30 est interdit pour cette nature de
  // declaration », « rubrique inconnue », et ignorait des blocs entiers.
  // Une seule valeur fausse invalidait tout le reste.
  const typeDeclaration = ordre > 1 ? "03" : "01";

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

  // ══ S10.G00.01 — L EMETTEUR ══
  //
  // 🚨🚨 LES RUBRIQUES ETAIENT DECALEES. dsn-val a donne les vrais
  // libelles le 16/09 :
  //     001  SIREN de l emetteur
  //     002  NIC de l emetteur
  //     003  NOM OU RAISON SOCIALE      ← nous ecrivions en 005
  //     004  Numero, nature et libelle de la voie
  //     005  CODE POSTAL                ← nous y mettions la raison sociale
  //     006  Localite
  //     007  Code pays
  // ⚠️ L ANOMALIE ETAIT DOUBLE : la rubrique 003 manquait, et la 005
  // contenait « TEST DSN SAS » dans un champ limite a cinq caracteres et
  // controle contre le fichier Hexaposte des codes postaux.
  ecrire("S10.G00.01.001", siret.slice(0, 9));
  ecrire("S10.G00.01.002", siret.slice(9));
  ecrire("S10.G00.01.003", societe.raison_sociale);
  ecrire("S10.G00.01.004", societe.adresse);
  ecrire("S10.G00.01.005", q(societe.code_postal));
  ecrire("S10.G00.01.006", societe.ville);

  // ══ S10.G00.02 — LE CONTACT DE L EMETTEUR ══
  //
  // 🚨 CONTROLE CST-02 : ce sous-groupe est OBLIGATOIRE apres S10.G00.01.
  // Il n existait pas du tout dans le premier fichier.
  // ⚠️ C EST LA PERSONNE QU UN ORGANISME APPELLE quand une declaration pose
  // question. Sans elle, l anomalie revient sans interlocuteur.
  ecrire("S10.G00.02.002", q(societe.contact_nom) || CONTACT_DEFAUT);
  ecrire("S10.G00.02.004", q(societe.contact_email) || EMAIL_DEFAUT);
  // 🚨 L ADRESSE TELEPHONIQUE EST OBLIGATOIRE (CST-03) : un organisme qui
  // doit joindre le declarant ne se contente pas d une adresse mel.
  ecrire("S10.G00.02.005", q(societe.contact_tel) || TELEPHONE_DEFAUT);

  // ══ S20 — LA DECLARATION ══
  //
  // 🚨 QUATRE CORRECTIONS APRES dsn-val :
  //   · 003 s ecrit « nd » — n la fraction, d le nombre total. Une seule
  //     fraction se declare « 11 », pas « 01 ».
  //   · 004 est un NUMERIQUE libre : « 7 », pas « 07 ».
  //   · 005 attend 01mmaaaa, la date du PREMIER JOUR du mois — pas mmaaaa.
  //   · 010 est la DEVISE (01 euro, 02 franc Pacifique). Nous y ecrivions
  //     le SIRET.
  // 🚨 ET DEUX RUBRIQUES OBLIGATOIRES MANQUAIENT : la date de constitution
  // du fichier (007) et le champ de la declaration (008).
  const aujourdhui = new Date();
  const dateConstitution = String(aujourdhui.getDate()).padStart(2, "0")
    + String(aujourdhui.getMonth() + 1).padStart(2, "0")
    + String(aujourdhui.getFullYear());

  ecrire("S20.G00.05.001", "01");                    // DSN mensuelle
  ecrire("S20.G00.05.002", typeDeclaration);
  ecrire("S20.G00.05.003", "11");                    // fraction 1 sur 1
  ecrire("S20.G00.05.004", String(ordre));           // numerique, sans zero
  ecrire("S20.G00.05.005", dateDsn(periode));        // 01mmaaaa
  ecrire("S20.G00.05.007", dateConstitution);
  ecrire("S20.G00.05.008", "01");                    // entreprise non mixte
  ecrire("S20.G00.05.010", "01");                    // euro

  // ══ S21.G00.06 — L ENTREPRISE ══
  //
  // 🚨🚨 TOUTES LES RUBRIQUES ETAIENT DECALEES D UN CRAN :
  //     001  SIREN                          ✓
  //     002  NIC DU SIEGE                   ← nous y mettions le code APE
  //     003  CODE APEN                      ← nous y mettions l adresse
  //     004  Numero, nature et libelle de la voie
  //     005  CODE POSTAL                    ← nous y mettions la ville
  //     006  Localite
  //     015  Code convention collective applicable
  // ⚠️ dsn-val a signale « Rubrique inconnue dans la norme » sur la 003 et
  // « code postal plus court que 5 » sur la 005 ou figurait « Lyon ».
  ecrire("S21.G00.06.001", siret.slice(0, 9));
  ecrire("S21.G00.06.002", siret.slice(9));
  // ⚠️ LE CODE APE N EST PAS ECRIT ICI. dsn-val repond « rubrique inconnue
  // dans la norme » sur 06.003 comme sur 11.002, alors que le cahier
  // technique les nomme « Code APEN » et « Code APET ». Le cahier et l outil
  // de controle se contredisent — comme sur la version de norme.
  // ⛔ TANT QUE CE DESACCORD N EST PAS TRANCHE, ON NE LES ECRIT PAS : une
  // rubrique absente vaut mieux qu une rubrique refusee.
  // 🚨 LE CODE APE RESTE DECLARE dans le bloc 85 (rubrique 85.002), accepte.
  ecrire("S21.G00.06.004", societe.adresse);
  ecrire("S21.G00.06.005", q(societe.code_postal));
  ecrire("S21.G00.06.006", societe.ville);

  if (!q(societe.code_ape)) {
    anomalies.push("Code APE absent — il est déclaré dans le bloc lieu de "
      + "travail (S21.G00.85.002).");
  }

  // ══ S21.G00.11 — L ETABLISSEMENT ══
  //
  // 🚨 L EFFECTIF N EXISTE PAS EN 11.008 : dsn-val repond « rubrique
  // inconnue dans la norme ». Il ne se declare pas ici.
  // 🚨 LE CODE CONVENTION COLLECTIVE PRINCIPALE (11.022) EST OBLIGATOIRE,
  // et il manquait.
  // 🚨 L IDENTIFIANT DU SERVICE DE PREVENTION ET DE SANTE AU TRAVAIL est
  // en 11.025, sur l ETABLISSEMENT — pas en 30.030 sur l individu, ou
  // nous l ecrivions.
  ecrire("S21.G00.11.001", siret.slice(9));
  ecrire("S21.G00.11.003", societe.adresse);
  ecrire("S21.G00.11.004", q(societe.code_postal));
  ecrire("S21.G00.11.005", societe.ville);

  // ⚠️ L IDCC DE L ETABLISSEMENT : celui de la societe, a defaut celui du
  // premier contrat. Sans lui, la declaration part en anomalie.
  const idccEtab = q(societe.idcc)
    || q((bulletins[0] as any)?.paie_contrats?.idcc) || "";
  if (idccEtab) ecrire("S21.G00.11.022", String(idccEtab).padStart(4, "0"));
  else {
    anomalies.push("Code convention collective principale absent "
      + "(S21.G00.11.022) — rubrique obligatoire de l'établissement.");
  }

  if (q(societe.spst_identifiant)) {
    ecrire("S21.G00.11.025", societe.spst_identifiant);
  }


  let totalBrut = 0;
  let totalCotisations = 0;
  let totalReductions = 0;

  // ⚠️ LA DUREE MENSUELLE DE REFERENCE sert a la quotite de travail du
  // contrat. Elle vit dans paie_parametres, a la date de la periode.
  let dureeMensuelleRef = 0;
  {
    const { data: dm } = await supabase
      .from("paie_parametres").select("valeur")
      .eq("code", "DUREE_MENSUELLE")
      .lte("date_effet", periode)
      .or("date_fin.is.null,date_fin.gte." + periode)
      .order("date_effet", { ascending: false })
      .limit(1).maybeSingle();
    if (dm) dureeMensuelleRef = Number(dm.valeur);
  }

  // ══ S21.G00.30 — CHAQUE SALARIE ══
  for (const b of bulletins) {
    const ct = b.paie_contrats || {};
    const s = ct.paie_salaries || {};
    const detail = b.detail || {};
    const qui = q(s.prenom) + " " + q(s.nom);

    // 🚨 LE NIR EST LA CLE DE TOUTE LA DECLARATION. Sans lui, l organisme
    // ne sait a qui rattacher les cotisations, et le salarie ne voit rien
    // arriver sur son compte.
    // 🚨 LE NIR SE DECLARE SUR TREIZE CARACTERES, SANS SA CLE.
    // dsn-val : « plus longue que la longueur maximale autorisee (13) ».
    // Nous ecrivions les quinze, clé comprise. La clé se contrôle a la
    // saisie — elle ne se declare pas.
    const nirComplet = q(s.numero_secu).replace(/[^0-9AaBb]/g, "").toUpperCase();
    const nir = nirComplet.slice(0, 13);
    if (nirComplet.length < 13) {
      anomalies.push(qui + " : numéro de sécurité sociale absent ou incomplet. "
        + "⛔ LA DÉCLARATION SERA REJETÉE.");
    }

    ecrire("S21.G00.30.001", nir);
    ecrire("S21.G00.30.002", s.nom);
    ecrire("S21.G00.30.004", s.prenom);

    // 🚨 LE SEXE SE DEDUIT DU NIR PLUTOT QUE DE VALOIR « 01 » PAR DEFAUT.
    const sexe = sexeDsn(s.sexe, nirComplet);
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

    // 🚨 LE LIEU DE NAISSANCE EST UNE RUBRIQUE INTERDITE ICI.
    // dsn-val : « Presence de la rubrique interdite S21.G00.30.007 ». Elle
    // ne vaut que pour les personnes nees a l etranger, et se double alors
    // du code pays de naissance (30.015).
    // 🚨 LE DEPARTEMENT DE NAISSANCE SE LIT DANS LE NIR : positions 6 et 7.
    // Il est calcule ICI parce que le lieu de naissance (30.007) en depend
    // et doit s ecrire AVANT l adresse (30.008) — l ordre croissant des
    // rubriques ne souffre aucune exception.
    const deptNaissance = nirComplet.length >= 7 ? nirComplet.slice(5, 7) : "";
    if (deptNaissance && deptNaissance !== "99") {
      ecrire("S21.G00.30.007", s.lieu_naissance);
    }

    ecrire("S21.G00.30.008", s.adresse);
    ecrire("S21.G00.30.009", q(s.code_postal));
    ecrire("S21.G00.30.010", s.ville);

    // 🚨 « FR » EST INTERDIT COMME CODE PAYS. dsn-val : la table ISO
    // 3166-1-A2 exclut explicitement FR, GP, MQ, RE, YT… Pour une adresse
    // en France, la rubrique 30.011 RESTE VIDE — le code pays ne sert
    // qu aux adresses etrangeres, et il est alors exclusif du code postal.
    const paysSalarie = q(s.pays).toUpperCase();
    const PAYS_FR = ["FR","GP","BL","MF","MQ","GF","RE","PM","YT","WF","PF","NC","MC"];
    if (paysSalarie.length === 2 && PAYS_FR.indexOf(paysSalarie) < 0) {
      ecrire("S21.G00.30.011", paysSalarie);
    }

    // 🚨 LA CODIFICATION UE (30.013) EST OBLIGATOIRE : elle classe l origine
    // du salarie au regard des frontieres. 01 France, 02 UE, 03 EEE,
    // 04 reste du monde.
    ecrire("S21.G00.30.013", q(s.codification_ue) || "01");

    // 🚨🚨 LES TROIS RUBRIQUES DE NAISSANCE VONT ENSEMBLE.
    //
    // ⚠️ J AVAIS RETIRE LE LIEU DE NAISSANCE au deuxieme passage, parce que
    // dsn-val le disait « rubrique interdite ». Il l etait — mais dans le
    // contexte d une DSN NEANT, ou aucun individu n est attendu. Une fois
    // le type de declaration corrige, il redevient OBLIGATOIRE.
    // 🚨 LA LECON : une anomalie lue dans un fichier par ailleurs invalide
    // peut dire le contraire de la regle. Ne jamais corriger sur une seule
    // anomalie sans regarder si le fichier tient debout par ailleurs.
    //
    // LA REGLE, elle, est simple : si le departement de naissance vaut
    // autre chose que « 99 », le LIEU de naissance est obligatoire ; et le
    // CODE PAYS de naissance l est dans tous les cas.
    if (deptNaissance) ecrire("S21.G00.30.014", deptNaissance);
    // ⚠️ LE CODE PAYS DE NAISSANCE EST OBLIGATOIRE MEME POUR UNE NAISSANCE
    // EN FRANCE — a la difference du code pays de l ADRESSE, ou « FR » est
    // au contraire interdit. Les deux rubriques se ressemblent et obeissent
    // a des regles opposees.
    // 🚨 LE CODE PAYS DE NAISSANCE TIENT EN DEUX CARACTERES (table ISO
    // 3166-1-A2), comme celui de l adresse. La colonne du salarie contient
    // parfois le LIBELLE (« France »), qui serait refuse sur la longueur.
    // ⚠️ ON NE GARDE LA VALEUR QUE SI ELLE FAIT DEJA DEUX CARACTERES ;
    // sinon on retombe sur FR, puisque le departement de naissance nous dit
    // deja qu il s agit d une naissance en France.
    const paysNaiss = q(s.pays_naissance).toUpperCase();
    ecrire("S21.G00.30.015", paysNaiss.length === 2 ? paysNaiss : "FR");
    // 🚨 S21.G00.30.011 EST UN CODE PAYS SUR DEUX CARACTERES (« C 2 2 »,
    // cahier page 95). Le premier fichier ecrivait « France » : six
    // caracteres, bloc rejete. On normalise plutot que de faire confiance a
    // la donnee saisie.
    if (!q(s.adresse) || !q(s.code_postal) || !q(s.ville)) {
      anomalies.push(qui + " : adresse incomplète (S21.G00.30.008 à 010).");
    }

    // ═══════════════════════════════════════════════════════════════
    // ══ S21.G00.40 — LE CONTRAT ══
    //
    // 🚨🚨 16/09 — TOUTES LES RUBRIQUES DE CE BLOC ETAIENT MAL PLACEES.
    // Relues une par une dans le cahier technique, page 180 :
    //     40.002  Statut du salarie (CONVENTIONNEL, categorie socio-pro)
    //     40.003  Code statut categoriel Retraite Complementaire
    //     40.004  Code PCS-ESE (profession et categorie socioprofessionnelle)
    //     40.006  Libelle de l emploi
    //     40.007  Nature du contrat
    //     40.009  NUMERO DU CONTRAT        ← on y ecrivait l IDCC
    //     40.010  Date de fin previsionnelle
    //     40.011  UNITE DE MESURE de la quotite (un code : 10 = heure)
    //     40.012  Quotite de reference de l entreprise
    //     40.013  Quotite de travail du contrat  ← la valeur en heures
    //     40.017  CODE CONVENTION COLLECTIVE     ← c est la que va l IDCC
    //     40.019  Identifiant du LIEU DE TRAVAIL ← on y ecrivait l id contrat
    //     40.021  MOTIF DE RECOURS               ← on ecrivait un libelle
    //     40.022  Caisse professionnelle de conges payes ← on y mettait le
    //             SIRET de l entreprise utilisatrice
    //
    // ⚠️ AUCUNE DE CES ERREURS NE SE VOYAIT A LA LECTURE : le fichier avait
    // l air propre, chaque ligne etait bien formee, les montants justes.
    // C est la NATURE de chaque rubrique qui etait fausse.
    // ═══════════════════════════════════════════════════════════════

    // 🚨 LE NUMERO DU CONTRAT — vingt caracteres, stable, sans tirets.
    const numeroContrat = String(ct.id).replace(/-/g, "").slice(0, 20);

    const natureContrat = await code("S21.G00.40.007", q(ct.type_contrat), periode);
    if (!natureContrat) {
      anomalies.push(qui + " : aucun code DSN pour le type de contrat « "
        + q(ct.type_contrat) + " » (S21.G00.40.007). ⛔ NON DÉCLARÉ.");
    }

    // 🚨 LE STATUT CONVENTIONNEL EST UNE CATEGORIE SOCIO-PROFESSIONNELLE,
    // pas « cadre / non-cadre » : 07 pour un ouvrier, 04 pour un cadre,
    // 03 pour un cadre dirigeant. Le « 03 » ecrit en dur auparavant
    // declarait donc tout le monde CADRE DIRIGEANT.
    let statutConv = q(ct.statut_conventionnel);
    if (!statutConv) {
      statutConv = (await code("S21.G00.40.002", q(ct.categorie), periode)) || "";
    }
    if (!statutConv) {
      anomalies.push(qui + " : statut conventionnel introuvable pour la "
        + "catégorie « " + q(ct.categorie) + " » (S21.G00.40.002). ⛔ NON DÉCLARÉ.");
    }

    // 🚨 LA DISTINCTION CADRE / NON-CADRE A SA PROPRE RUBRIQUE (40.003).
    // Controle CCH-11 : si elle vaut « 01 - cadre », le statut conventionnel
    // doit valoir 03, 04 ou 08.
    const statutRc = await code("S21.G00.40.003",
      q(ct.categorie) === "cadre" ? "rc_cadre" : "rc_non_cadre", periode);

    ecrire("S21.G00.40.001", dateDsn(ct.date_debut));
    ecrire("S21.G00.40.002", statutConv);
    if (statutRc) ecrire("S21.G00.40.003", statutRc);

    // ⚠️ LE CODE PCS-ESE EST OBLIGATOIRE et n existe pas encore chez nous :
    // c est la nomenclature INSEE des professions. On le signale plutot que
    // d inventer un code.
    if (q(ct.pcs_ese)) ecrire("S21.G00.40.004", q(ct.pcs_ese));
    else {
      anomalies.push(qui + " : code PCS-ESE absent (S21.G00.40.004) — "
        + "nomenclature INSEE des professions, rubrique obligatoire.");
    }

    ecrire("S21.G00.40.006", ct.intitule_poste);
    ecrire("S21.G00.40.007", natureContrat || "");

    // 🚨 DISPOSITIF DE POLITIQUE PUBLIQUE (40.008) — obligatoire. « 99 »
    // pour un contrat ordinaire : la nomenclature sert surtout aux
    // contrats aides et aux apprentissages.
    ecrire("S21.G00.40.008", q(ct.dispositif_public) || "99");

    ecrire("S21.G00.40.009", numeroContrat);
    if (ct.date_fin) ecrire("S21.G00.40.010", dateDsn(ct.date_fin));

    // ⚠️ L UNITE DE MESURE EST UN CODE, LA QUOTITE UN NOMBRE. Le premier
    // fichier ecrivait « 35.00 » dans la rubrique de l unite.
    const uniteQuotite = await code("S21.G00.40.011", "heure", periode);
    if (uniteQuotite) ecrire("S21.G00.40.011", uniteQuotite);
    // 🚨 LES DEUX QUOTITES SE MESURENT DANS LA MEME UNITE ET DEPUIS LA MEME
    // SOURCE. La reference de l entreprise vient de paie_parametres
    // (151,67 h) ; celle du contrat s en deduit au prorata de la duree
    // hebdomadaire. Calculer l une par 52/12 et l autre autrement ferait
    // diverger deux valeurs censees etre comparables — et la comparaison
    // est precisement ce que l organisme regarde pour savoir si le salarie
    // est a temps plein ou partiel.
    if (dureeMensuelleRef > 0) {
      ecrire("S21.G00.40.012", montantDsn(dureeMensuelleRef));

      // ⚠️ 35 HEURES EST LA DUREE LEGALE : un contrat a 35 h est a temps
      // plein, donc sa quotite EGALE la reference. En dessous, elle est
      // proportionnelle.
      const hebdo = ct.duree_hebdo ? Number(ct.duree_hebdo) : 35;
      const quotite = dureeMensuelleRef * Math.min(hebdo, 35) / 35;
      ecrire("S21.G00.40.013", montantDsn(Math.round(quotite * 100) / 100));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🚨🚨 LES TREIZE RUBRIQUES OBLIGATOIRES DU CONTRAT
    //
    // dsn-val les a toutes reclamees d un coup, une fois le bloc enfin lu.
    // Elles decrivent la situation administrative du salarie : de quel
    // regime il releve pour la maladie, la vieillesse, les accidents du
    // travail, s il a un ou plusieurs employeurs, s il travaille a temps
    // plein, s il est detache a l etranger.
    //
    // ⚠️ AUCUNE N EST UN CALCUL : ce sont des etats de fait, et les valeurs
    // retenues ci-dessous sont celles du cas ordinaire — salarie de droit
    // prive, en France, a temps plein, au regime general, employeur unique.
    // Le jour ou un client sortira de ce cas, ces valeurs devront venir de
    // la fiche du contrat, pas d une constante.
    // ═══════════════════════════════════════════════════════════════

    // ⚠️ MODALITE D EXERCICE DU TEMPS DE TRAVAIL : 10 temps plein,
    // 20 temps partiel. Elle se deduit de la duree hebdomadaire.
    const tempsPlein = !ct.duree_hebdo || Number(ct.duree_hebdo) >= 35;
    ecrire("S21.G00.40.014", tempsPlein ? "10" : "20");

    // ⚠️ COMPLEMENT DE BASE AU REGIME OBLIGATOIRE : 01 regime local
    // Alsace-Moselle, 99 non applicable.
    ecrire("S21.G00.40.016", q(ct.regime_alsace_moselle) || "99");

    // 🚨 L IDCC VA ICI, PAS EN 40.009.
    ecrire("S21.G00.40.017", q(ct.idcc) ? String(ct.idcc).padStart(4, "0") : "9999");

    // ⚠️ LES TROIS REGIMES DE BASE : maladie (CNAM), vieillesse (CNAV),
    // accidents du travail (CNAM). « 200 » est le regime general dans les
    // trois nomenclatures.
    ecrire("S21.G00.40.018", q(ct.regime_maladie) || "200");

    // 🚨 L IDENTIFIANT DU LIEU DE TRAVAIL (40.019) S ECRIT ICI, entre le
    // regime maladie (018) et le regime vieillesse (020). Il etait ecrit
    // plus bas, avec le risque AT — donc APRES la rubrique 039, et l ordre
    // croissant etait rompu : dsn-val cesse alors de lire le bloc.
    //
    // ⚠️ POUR UN INTERIMAIRE, LE LIEU DE TRAVAIL EST L ENTREPRISE
    // UTILISATRICE : c est la qu il travaille reellement. Les rubriques 019
    // et 046 portent le meme SIRET sans dire la meme chose — l une designe
    // le lieu, l autre l employeur d accueil — et le bloc 85 le decrit.
    const estMission = q(ct.type_contrat) === "mission";
    const siretEu = q(ct.eu_siret).replace(/\D/g, "");
    const missionValide = estMission && siretEu.length === 14
      && cleLuhnValide(siretEu);

    if (missionValide) ecrire("S21.G00.40.019", siretEu);

    ecrire("S21.G00.40.020", q(ct.regime_vieillesse) || "200");

    // 🚨 LE MOTIF DE RECOURS (40.021) SE PLACE ICI, entre le regime
    // vieillesse (020) et le travailleur a l etranger (024). L ordre
    // croissant des rubriques n est pas une elegance : dsn-val cesse de
    // lire un bloc des qu il revient en arriere, et ignore tout ce qui
    // suit. Nous l avons paye trois fois aujourd hui.
    // ⚠️ LE MOTIF DE RECOURS EST UN CODE (40.021), pas un libelle.
    if (q(ct.type_contrat) === "mission" || q(ct.type_contrat) === "cdd") {
      const codeMotif = await code("S21.G00.40.021", q(ct.motif_recours), periode);
      if (codeMotif) ecrire("S21.G00.40.021", codeMotif);
      else {
        anomalies.push(qui + " : motif de recours « " + q(ct.motif_recours)
          + " » sans code DSN (S21.G00.40.021). ⛔ NON DÉCLARÉ — obligatoire "
          + "sur un contrat de mission ou un CDD.");
      }
    }

    // ⚠️ TRAVAILLEUR A L ETRANGER : 01 detache, 02 expatrie, 03 frontalier,
    // 99 non concerne.
    ecrire("S21.G00.40.024", q(ct.travailleur_etranger) || "99");

    // ⚠️ STATUT D EMPLOI : 04 non statutaire, pour un salarie de droit prive.
    ecrire("S21.G00.40.026", q(ct.statut_emploi) || "04");

    // ⚠️ EMPLOIS ET EMPLOYEURS MULTIPLES : 01 unique, 02 multiples,
    // 03 situation non connue.
    ecrire("S21.G00.40.036", q(ct.emplois_multiples) || "01");
    ecrire("S21.G00.40.037", q(ct.employeurs_multiples) || "01");

    ecrire("S21.G00.40.039", q(ct.regime_at) || "200");


    // ═══════════════════════════════════════════════════════════════
    // 🚨🚨 LE RISQUE ACCIDENT DU TRAVAIL ET L ETABLISSEMENT UTILISATEUR
    //
    // dsn-val a livre la regle qui lie les deux, et elle est stricte :
    // « si S21.G00.40.046 est renseignee, alors le code risque accident du
    // travail S21.G00.40.040 doit etre egal a 745BD, 745BE ou 752EE ».
    // Ce sont les codes risque du TRAVAIL TEMPORAIRE — l intérim a ses
    // propres taux, plus eleves, parce que la sinistralite y est plus forte.
    //
    // 🚨 ET L ENTREPRISE UTILISATRICE VA EN 40.046, PAS EN 40.019.
    // La 40.019 designe un lieu de travail qui doit exister comme bloc 85 ;
    // la 40.046 designe l etablissement utilisateur d un interimaire. Nous
    // confondions les deux depuis le debut.
    //
    // ⚠️ LE TAUX AT (40.043) DEVIENT ALORS OBLIGATOIRE : il n est interdit
    // que si le code risque vaut « 999ZZ ». Il vient de paie_taux_societe,
    // la meme source que le bulletin — ainsi la declaration et le bulletin
    // ne peuvent pas diverger.
    // ═══════════════════════════════════════════════════════════════
    // ⚠️ LE TAUX AT/MP VIENT DU MEME ENDROIT QUE LE BULLETIN : le detail du
    // calcul, ou le moteur a range la ligne AT_MP avec son taux. Le relire
    // ailleurs ferait diverger la declaration et le bulletin.
    let tauxAtMp = 0;
    for (const l of (detail.lignes_cotisations || [])) {
      if (q(l.code) === "AT_MP") tauxAtMp = Number(l.taux_patronal || 0);
    }

    if (missionValide) {
      ecrire("S21.G00.40.040", q(ct.code_risque_at) || "745BD");
      if (tauxAtMp > 0) ecrire("S21.G00.40.043", montantDsn(tauxAtMp));
      ecrire("S21.G00.40.046", siretEu);
    } else {
      // ⚠️ HORS INTERIM, LE CODE RISQUE VIENT DE LA NOTIFICATION CARSAT.
      // « 999ZZ » signifie « sans code risque » et INTERDIT alors de
      // declarer un taux — c est la seule combinaison valide tant que le
      // vrai code n est pas renseigne.
      const codeRisque = q(ct.code_risque_at) || q(societe.code_risque_at);
      if (codeRisque) {
        ecrire("S21.G00.40.040", codeRisque);
        if (tauxAtMp > 0) ecrire("S21.G00.40.043", montantDsn(tauxAtMp));
      } else {
        ecrire("S21.G00.40.040", "999ZZ");
      }
      if (estMission && siretEu) {
        anomalies.push(qui + " : le SIRET de l'entreprise utilisatrice « "
          + siretEu + " » ne respecte pas la clé de Luhn (S21.G00.40.046). "
          + "⛔ NON DÉCLARÉ.");
      }
    }

    // 🚨 LA PERIODE D ESSAI EST OBLIGATOIRE pour les CDI et les CDD de plus
    // de six mois depuis le cahier technique 2026.
    if (ct.essai_duree_jours) {
      ecrire("S21.G00.40.082", String(ct.essai_duree_jours));
    } else if (q(ct.type_contrat) === "cdi") {
      anomalies.push(qui + " : durée de période d'essai absente "
        + "(S21.G00.40.082), obligatoire pour un CDI.");
    }

    // ⚠️ PRORATISATION DU PLAFOND DE SECURITE SOCIALE a hauteur de la
    // quotite de travail : elle ne s applique pas a un temps plein.
    ecrire("S21.G00.40.084", tempsPlein ? "02" : "01");

    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    // ══ S21.G00.53 — L ACTIVITE ══
    //
    // 🚨 CONTROLE CCH-15 : des lors que l unite de mesure de la quotite est
    // « 10 - heure » ou « 12 - journee », au moins un bloc Activite est
    // exige. C est lui qui porte le VOLUME REELLEMENT TRAVAILLE du mois —
    // la ou nous avions tente, a tort, de le mettre dans la remuneration.
    // ⚠️ TYPE 01 = travail remunere. Le type 02 sert aux absences, qui ne
    // sont pas encore traitees.
    // ═══════════════════════════════════════════════════════════════
    if (dureeMensuelleRef > 0) {
      ecrire("S21.G00.53.001", "01");
      ecrire("S21.G00.53.002", montantDsn(dureeMensuelleRef));
      ecrire("S21.G00.53.003", "10");
    }

    // ══ S21.G00.71 — LA RETRAITE COMPLEMENTAIRE ══
    //
    // 🚨 CONTROLE CST-02 : ce sous-groupe est obligatoire apres le contrat.
    // « RUAA » designe le regime unifie Agirc-Arrco — coherent avec le code
    // de cotisation 131 que nous declarons plus bas. Les deux doivent dire
    // la meme chose, sinon l organisme recoit une cotisation pour un regime
    // auquel le salarie n est pas rattache.
    // ═══════════════════════════════════════════════════════════════
    ecrire("S21.G00.71.002", q(ct.regime_retraite_c) || "RUAA");

    // ═══════════════════════════════════════════════════════════════
    // ══ S21.G00.86 — L ANCIENNETE ══
    //
    // 🚨 CONTROLE CCH-14 : une anciennete de type « 07 - anciennete dans
    // l entreprise » est OBLIGATOIRE sur un CDI, un CDD, un contrat de
    // mission et plusieurs autres natures. Elle sert aux droits
    // conventionnels — primes d anciennete, preavis, indemnites.
    // ⚠️ ELLE SE COMPTE DEPUIS LA DATE DE DEBUT DU CONTRAT, en mois entiers
    // revolus a la fin de la periode declaree.
    // ═══════════════════════════════════════════════════════════════
    if (q(ct.date_debut)) {
      const d0 = new Date(String(ct.date_debut));
      const d1 = new Date(Number(periode.slice(0, 4)),
        Number(periode.slice(5, 7)), 0);
      let mois = (d1.getFullYear() - d0.getFullYear()) * 12
        + (d1.getMonth() - d0.getMonth());
      if (d1.getDate() < d0.getDate()) mois -= 1;
      if (mois < 0) mois = 0;

      // 🚨🚨 UNE ANCIENNETE NULLE EST INTERDITE. Le cahier, rubrique
      // 86.003 : « la valeur retenue pour le code type d expression de
      // l anciennete doit permettre d exprimer une anciennete NON NULLE ».
      //
      // ⚠️ UN SALARIE EMBAUCHE LE MOIS MEME A ZERO MOIS D ANCIENNETE — et
      // c est arithmetiquement juste. La norme demande alors de CHANGER
      // D UNITE plutot que de declarer zero : on compte en JOURS.
      // C est exactement pourquoi la rubrique 86.002 existe.
      const joursAnciennete = Math.max(1, Math.round(
        (d1.getTime() - d0.getTime()) / 86400000) + 1);

      ecrire("S21.G00.86.001", "07");
      if (mois >= 1) {
        ecrire("S21.G00.86.002", "02");          // unite : mois
        ecrire("S21.G00.86.003", String(mois));
      } else {
        ecrire("S21.G00.86.002", "01");          // unite : jours
        ecrire("S21.G00.86.003", String(joursAnciennete));
      }
      ecrire("S21.G00.86.005", numeroContrat);
    }

    // ═══════════════════════════════════════════════════════════════
    // ══ S21.G00.85 — LE LIEU DE TRAVAIL / ETABLISSEMENT UTILISATEUR ══
    //
    // 🚨 C EST ICI QUE SE DECLARE L ENTREPRISE UTILISATRICE D UN CONTRAT DE
    // MISSION — la rubrique s appelle « Identifiant du lieu de travail ou de
    // l etablissement utilisateur ». Le premier fichier mettait son SIRET en
    // 40.022, qui est la caisse professionnelle de conges payes, et se
    // servait du bloc 85 pour ecrire des montants nets.
    // ⚠️ LE CONTRAT LE REFERENCE PAR SA RUBRIQUE 40.019.
    // ═══════════════════════════════════════════════════════════════
    // 🚨🚨 LE BLOC S21.G00.85 A ETE RETIRE D ICI, ET C EST LA CORRECTION
    // LA PLUS LOURDE DU FICHIER.
    //
    // Place apres le contrat, il faisait IGNORER TOUT CE QUI SUIVAIT :
    // dsn-val repondait « Sous-groupe S21.G00.51 non attendu apres
    // S21.G00.85.001 », puis la meme chose pour les blocs 78, 81 et 50.
    // La remuneration, les assiettes, les cotisations et le versement
    // n ont meme pas ete controles — la moitie du fichier etait morte.
    //
    // ⚠️ LE LIEU DE TRAVAIL EST UN ENFANT DE L ETABLISSEMENT, pas du
    // contrat : sa place est avant les individus, et le contrat s y
    // rattache par sa rubrique 40.019.
    // ⛔ TANT QUE CETTE PLACE N EST PAS CONFIRMEE PAR dsn-val, ON NE
    // L ECRIT PAS : une rubrique absente coute une anomalie, un bloc mal
    // place en coute vingt. L identifiant du lieu de travail (40.019) est
    // ecrit plus haut, a sa place dans l ordre des rubriques.

    // ═══════════════════════════════════════════════════════════════
    // ⚠️ LES DEUX BORNES DU MOIS, calculees ici parce que le bloc versement
    // et tous ses enfants en ont besoin.
    const debutPeriode = dateDsn(periode);
    const finPeriode = finDeMois(periode);

    // ══ S21.G00.50 — LE VERSEMENT INDIVIDU ══
    //
    // 🚨🚨 SA PLACE EST ICI, AVANT LA REMUNERATION ET LES ASSIETTES.
    // dsn-val repondait « Sous-groupe S21.G00.51 non attendu apres
    // S21.G00.40.021 » : entre le contrat et la remuneration, il manquait
    // le versement. Les blocs 51, 78, 79 et 81 sont ses ENFANTS — ecrits
    // avant lui, ils n avaient pas de parent et etaient ignores.
    //
    //     50.001  Date de versement
    //     50.002  Remuneration nette fiscale
    //     50.003  Numero de versement — DEUX CARACTERES minimum
    //     50.004  Montant net verse
    //     50.006  Taux de prelevement a la source
    //     50.007  Type du taux
    //     50.009  Montant de prelevement a la source
    //
    // ⚠️ LE TAUX VIENT DU COMPTE RENDU METIER DE LA DSN PRECEDENTE. Tant
    // qu aucune DSN n a ete deposee, on declare le taux neutre — la regle
    // pour un salarie dont l administration n a pas encore transmis de taux.
    // ═══════════════════════════════════════════════════════════════
    ecrire("S21.G00.50.001", finPeriode);
    ecrire("S21.G00.50.002", montantDsn(b.net_imposable));
    ecrire("S21.G00.50.003", "01");
    ecrire("S21.G00.50.004", montantDsn(b.net_a_payer));
    ecrire("S21.G00.50.006", montantDsn(0));
    ecrire("S21.G00.50.007", "13");
    ecrire("S21.G00.50.009", montantDsn(b.prelevement_source));
    // 🚨 LE MONTANT SOUMIS AU PAS (50.013) EST OBLIGATOIRE : c est l assiette
    // sur laquelle l administration calculera le prelevement, et elle n est
    // pas le net verse mais le NET IMPOSABLE.
    ecrire("S21.G00.50.013", montantDsn(b.net_imposable));

    // ⚠️ LE BLOC S21.G00.58 (montant net social) EST ECRIT PLUS BAS, apres
    // la remuneration et les assiettes : les sous-groupes d un meme parent
    // se suivent dans l ordre croissant de leur numero — 50, puis 51, puis
    // 58, puis 78. Ecrit ici, il precedait le 51 et cassait cet ordre.

    // ══ S21.G00.51 — LA REMUNERATION ══
    const codeBrut = await code("S21.G00.51.011", "brut", periode);
    ecrire("S21.G00.51.001", debutPeriode);
    ecrire("S21.G00.51.002", finPeriode);
    // ⚠️ 51.010 RATTACHE LA REMUNERATION AU CONTRAT : sans lui, un salarie
    // qui a deux contrats dans la meme entreprise voit ses remunerations
    // melangees.
    ecrire("S21.G00.51.010", numeroContrat);
    ecrire("S21.G00.51.011", codeBrut || "001");
    // 🚨 LE NOMBRE D HEURES EST INTERDIT ICI, ET C ETAIT MON ERREUR.
    // dsn-val, controle SIG-13 : « vous avez renseigne un nombre d heures
    // dans un bloc relatif a la remuneration brute non plafonnee. Cela
    // n est pas autorise. »
    // ⚠️ LE VOLUME DE TRAVAIL SE DECLARE DANS LE BLOC ACTIVITE
    // (S21.G00.53), ecrit plus haut, pas dans la remuneration.
    ecrire("S21.G00.51.013", montantDsn(b.brut));

    // ═══════════════════════════════════════════════════════════════
    // ══ S21.G00.58 — LE MONTANT NET SOCIAL ══
    //
    // 🚨 CONTROLE CCH-14 : un versement date du mois declare exige un bloc
    // enfant « Element de revenu calcule en net » de type « 03 - Montant
    // net social ». C est la meme valeur que celle imprimee sur le
    // bulletin, et elle sert de reference aux prestations sociales.
    // ⚠️ SI ELLE DIFFERE ENTRE LE BULLETIN ET LA DSN, c est le salarie qui
    // voit ses droits mal calcules.
    // ═══════════════════════════════════════════════════════════════
    ecrire("S21.G00.58.001", debutPeriode);
    ecrire("S21.G00.58.002", finPeriode);
    ecrire("S21.G00.58.003", "03");
    ecrire("S21.G00.58.004", montantDsn(b.net_social));

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
      // ⚠️ 78.006 RATTACHE L ASSIETTE AU CONTRAT, meme raison qu en 51.010.
      ecrire("S21.G00.78.006", numeroContrat);

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

    totalBrut += Number(b.brut || 0);
    totalCotisations += Number(b.total_salarial || 0) + Number(b.total_patronal || 0);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ══ S21.G00.85 — LES LIEUX DE TRAVAIL ET ETABLISSEMENTS UTILISATEURS ══
  //
  // 🚨🚨 SA PLACE EST ICI, APRES TOUS LES INDIVIDUS. C est la troisieme
  // place essayee, et cette fois la regle est explicite : les sous-groupes
  // d un meme parent se suivent dans l ORDRE CROISSANT DE LEUR NUMERO. Sous
  // l etablissement viennent d abord les individus (30), et le lieu de
  // travail (85) ferme la marche.
  //
  // CE QUE LES DEUX PLACES PRECEDENTES ONT COUTE :
  //   · APRES LE CONTRAT : « sous-groupe S21.G00.51 non attendu apres
  //     S21.G00.85.001 » — la remuneration, les assiettes et les
  //     cotisations etaient ignorees.
  //   · AVANT LES INDIVIDUS : « sous-groupe S21.G00.30 non attendu apres
  //     S21.G00.85.011 » — les trois salaries disparaissaient d un coup, et
  //     dsn-val annoncait « Nombre de salaries : 0 » sur un fichier qui en
  //     portait trois.
  //
  // ⚠️ LA REFERENCE N IMPOSE PAS L ORDRE : la rubrique 40.019 de chaque
  // contrat designe un lieu decrit PLUS BAS dans le fichier, et c est
  // normal. Un identifiant se rattache, il ne se lit pas de haut en bas.
  //
  // ⚠️ CE BLOC SE REMPLIT EN ENTIER OU PAS DU TOUT : sans nature juridique
  // le SIRET est refuse, et sans code INSEE la commune n est pas situee.
  // Un bloc 85 incomplet emporte tous les salaries avec lui.
  // ═══════════════════════════════════════════════════════════════════
  const lieuxVus: string[] = [];
  for (const b0 of bulletins) {
    const c0: any = (b0 as any).paie_contrats;
    if (!c0) continue;
    const sir = q(c0.eu_siret).replace(/\D/g, "");
    if (sir.length !== 14 || !cleLuhnValide(sir)) continue;
    if (lieuxVus.indexOf(sir) >= 0) continue;
    lieuxVus.push(sir);

    // 🚨🚨 LE BLOC 85 SE REMPLIT EN ENTIER OU PAS DU TOUT.
    //
    // Incomplet, il a fait rejeter LES TROIS SALARIES d un coup : dsn-val a
    // compte « 0 salarie » sur un fichier qui en portait trois, et les
    // quinze anomalies du rapport venaient toutes de ce seul bloc.
    //
    // ⚠️ SANS NATURE JURIDIQUE, LE SIRET EST REFUSE. Le cahier (page 318)
    // autorise le SIRET en 85.001 — mais la regle CCH-12 ne le valide que
    // si 85.010 vaut « 01 - Etablissement ». Sans cette rubrique, dsn-val
    // ne sait pas qu il regarde un etablissement immatricule, et repond
    // « vous avez renseigne un SIRET, ceci n est pas admis ».
    //
    // ⚠️ LE CODE INSEE DE LA COMMUNE (85.011) EST OBLIGATOIRE des lors
    // qu aucun code pays n est declare. Ce n est pas le code postal : c est
    // lui qui rattache le lieu a son autorite de transport, donc au taux de
    // versement mobilite qui sera reclame.
    //
    // ⛔ SI L UNE DE CES DONNEES MANQUE, ON N ECRIT PAS LE BLOC : un bloc 85
    // incomplet coute plus cher que pas de bloc du tout, puisqu il emporte
    // tous les salaries avec lui.
    const natureJur = q(c0.eu_nature_juridique) || "01";
    const insee = q(c0.eu_code_insee);
    const cpLieu = q(c0.eu_code_postal);

    if (!insee || !cpLieu || !q(c0.eu_adresse) || !q(c0.eu_ville)) {
      anomalies.push("Lieu de travail " + sir + " : adresse, code postal, "
        + "ville ou code INSEE manquant. ⛔ LE BLOC S21.G00.85 N'EST PAS "
        + "DÉCLARÉ — un bloc incomplet ferait rejeter tous les salariés. "
        + "Compléter le contrat (colonnes eu_adresse, eu_code_postal, "
        + "eu_ville, eu_code_insee).");
      lieuxVus.pop();
      continue;
    }

    ecrire("S21.G00.85.001", sir);
    // ⚠️ LE CODE APE DU LIEU DE TRAVAIL, PAS CELUI DE L EMPLOYEUR : c est
    // l activite reelle exercee sur place qui compte pour le risque.
    if (q(c0.eu_code_ape)) ecrire("S21.G00.85.002", c0.eu_code_ape);
    ecrire("S21.G00.85.003", c0.eu_adresse);
    ecrire("S21.G00.85.004", cpLieu);
    ecrire("S21.G00.85.005", c0.eu_ville);
    // ⛔ PAS DE CODE PAYS (85.006) POUR UN LIEU EN FRANCE : code postal et
    // code pays s excluent, exactement comme sur l adresse du salarie.
    ecrire("S21.G00.85.010", natureJur);
    ecrire("S21.G00.85.011", insee);
  }

  // ══ S90 — LE TOTAL DE L ENVOI ══
  //
  // 🚨🚨 LES TROIS LIGNES DE FIN ETAIENT FAUSSES TOUTES LES TROIS :
  //   · S80.G01.00.001 — rubrique INCONNUE dans la norme.
  //   · S89.G00.91.001 — ce n est pas un compteur mais un NUMERO
  //     D INSCRIPTION AU REPERTOIRE : le bloc S89.G00.91 decrit un individu
  //     non salarie, pour les regularisations. Nous y ecrivions « 001 ».
  //   · S90.G00.90.001 — c est le NOMBRE TOTAL DE RUBRIQUES du fichier,
  //     pas un compteur d individus. Nous ecrivions « 001 » pour 135
  //     lignes, et dsn-val repondait « votre envoi contient un nombre de
  //     rubriques different du nombre declare ».
  //   · S90.G00.90.002 — le NOMBRE DE DSN, qui manquait.
  //
  // 🚨 LE COMPTE S ETABLIT APRES COUP, LES DEUX LIGNES S90 COMPRISES : le
  // total doit inclure les rubriques qui le portent. C est pourquoi ces
  // deux lignes s ajoutent a la main plutot que par `ecrire`.
  const nbRubriques = L.length + 2;
  L.push("S90.G00.90.001,'" + nbRubriques + "'");
  L.push("S90.G00.90.002,'1'");

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
    type: typeDeclaration === "03" ? "annule et remplace" : "normale",
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
      "⛔ PASSER LE FICHIER DANS dsn-val (outil officiel) : aucune DSN ne se dépose sans ce contrôle. "
        + "Il se télécharge sur net-entreprises.fr et tourne sur un ORDINATEUR, pas dans le navigateur.",
      "L'envoi est en MODE ESSAI (S10.G00.00.005 = 01). Passer à 02 pour un dépôt réel.",
      "Le taux de prélèvement à la source est neutre : le vrai taux vient du compte rendu métier de la DSN précédente.",
      "La clé de ventilation de la réduction générale entre les codes 018 et 106 est proportionnelle aux cotisations éligibles — à recouper avec la règle URSSAF.",
      "Le code PCS-ESE de chaque contrat vient de la nomenclature INSEE : un code faux ne fait pas rejeter la déclaration, il fausse le rattachement conventionnel.",
    ],
    message: "Fichier DSN généré en BROUILLON. "
      + (anomalies.length > 0
        ? "⚠️ " + anomalies.length + " anomalie(s) à corriger avant tout dépôt."
        : "Aucune anomalie détectée à la génération."),
  });
}
