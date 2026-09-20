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
// 🆕🚨 19/09 — VERSION 3 : LE BORDEREAU URSSAF, ET LA SCISSION DES
// COTISATIONS MALADIE ET ALLOCATIONS FAMILIALES
//
// ✅ EPROUVE : fichier d essai de 542 lignes passe dans dsn-val 2026.1.0.16,
// ZERO ANOMALIE. C est ce fichier qui a fixe la place des blocs 20, 22 et
// 23 — entre l etablissement et le premier individu — et confirme que les
// codes 907 et 102 sont admis.
//
// CE QUI CHANGE, ET POURQUOI
//
// 1. 🚨 LA MALADIE ET LES ALLOCATIONS FAMILIALES SE DECLARENT EN DEUX
//    LIGNES CHACUNE. Guide URSSAF v5.1, page 34, mot pour mot : « a compter
//    de la periode d emploi de janvier 2026 l employeur eligible a la
//    Reduction Generale doit NECESSAIREMENT ET QUELLE QUE SOIT LA
//    REMUNERATION utiliser les CTP 635 (complement maladie — equivalence DI
//    bloc 81 code 907) et 430 (complement AF — equivalence DI bloc 81
//    code 102) ».
//    Autrement dit : la maladie ne s ecrit pas en une ligne a 13 %, mais
//    en 075 (7 %) plus 907 (6 %) ; les allocations familiales en 074
//    (3,45 %) plus 102 (1,80 %).
//    ⛔ dsn-val NE PEUT PAS VOIR CE DEFAUT : il controle la structure, pas
//    la ventilation. C est l URSSAF qui rapproche ensuite le CTP 635 de la
//    somme des codes 907, et qui emet un avis d anomalie chaque mois quand
//    ils ne concordent pas. Un editeur a livre ce defaut en 2022 : anomalie
//    a chaque depot, chez chaque client.
//
// 2. 🚨 LE BORDEREAU (blocs 20, 22 et 23) : ce que l employeur doit a
//    l URSSAF, en lignes agregees. Sans lui, la DSN decrit les salaries
//    mais ne declare aucune cotisation.
//
// ⚠️ LES DEUX SE TIENNENT : l URSSAF exige depuis 2022 l equivalence entre
// l agrege et le nominatif. Le generateur calcule donc le bordereau A
// PARTIR des memes cumuls que les blocs 78 — jamais par un calcul parallele,
// qui finirait par diverger.
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
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 17/09 — LE PASSAGE 8, LE PREMIER SUR UN dsn-val QUI ACCEPTE P26V01
//
// Les sept premiers passages ont ete juges par une installation de dsn-val
// qui REFUSAIT la version de norme P26V01. Le huitieme l a ete par une
// installation a jour, qui l ACCEPTE — et qui ne rend pas le meme verdict
// sur trois points :
//
//   · S10.G00.00.006 'P26V01'  →  acceptee. L anomalie des sept premiers
//     passages a disparu sans que le fichier ait change.
//   · S21.G00.06.003 (APEN) et S21.G00.11.002 (APET)  →  « CST-03 / Absence
//     de la rubrique ». L ancienne installation les disait « inconnues »,
//     et nous les avions retirees. ELLES SONT OBLIGATOIRES.
//   · S21.G00.40.084  →  « CV10 / Rubrique inconnue dans la norme ». Elle
//     est retiree.
//
// ⛔ LA LECON : un outil de controle qui refuse la version de norme du
// fichier ne juge pas ce fichier avec les bonnes tables. Tant que
// S10.G00.00.006 est en anomalie, AUCUN des autres verdicts n est sur.
// C EST L INSTALLATION QUI ACCEPTE P26V01 QUI FAIT FOI.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 17/09 — LE PASSAGE 9 : DE DIX-HUIT ANOMALIES A UNE SEULE
//
// Il ne restait que S21.G00.51.011 / CCH-11. Le controle, lu en entier
// dans le journal de maintenance de la norme et dans le guide URSSAF :
// pour un contrat et un versement individu donnes, QUATRE types de
// remuneration sont requis — 001, 002, 003 et 010. Nous n en ecrivions
// que deux. Voir la section des remunerations plus bas.
//
// ⛔ LE MESSAGE DE dsn-val ETAIT TRONQUE A L ECRAN juste apres « 002 - ».
// La suite se lisait dans la norme, pas dans une deduction.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 18/09 — TROIS VALEURS SORTENT DU CODE ET ENTRENT DANS LA BASE
//
// Trois choses etaient ecrites EN DUR dans ce fichier alors qu elles
// varient d une societe a l autre, et d un salarie a l autre. Tant
// qu elles y restaient, aucun depot reel n etait possible sans modifier le
// code — et le modifier pour un client l aurait change pour tous.
//
//   1. LE MODE D ENVOI (S10.G00.00.005). Il valait « 01 », c est-a-dire
//      ESSAI. Une DSN reelle exige « 02 ». Tant que ce « 01 » etait dans le
//      code, tout depot partait, etait accepte — et ne declarait rien.
//      ⛔ ET CE N EST PAS UN REGLAGE GLOBAL : une societe peut etre en
//      essai pendant que trois autres declarent pour de vrai.
//      → vient desormais de compta_societes.dsn_mode.
//
//   2. LE POINT DE DEPOT (S10.G00.00.007). Il valait « 01 »,
//      net-entreprises. Un employeur AGRICOLE depose a la MSA, valeur
//      « 02 » — et le fichier partait chez le mauvais destinataire.
//      → vient desormais de compta_societes.dsn_regime.
//
//   3. LE TAUX DE PRELEVEMENT A LA SOURCE (S21.G00.50.006 et 007). Il
//      valait 0 au taux neutre pour TOUT LE MONDE. Le taux neutre est la
//      regle legale tant que l administration n a pas transmis de taux
//      personnel — mais il fait prelever au salarie PLUS que son taux
//      reel, et la difference ne lui revient qu a sa declaration de
//      revenus suivante.
//      → vient desormais de paie_salaries.taux_pas, avec sa date d effet.
//
// ⚠️ LES COLONNES ONT ETE POSEES LE 18/09 et sont vides : le comportement
// est donc IDENTIQUE a celui d avant tant que personne ne les remplit.
// Rien ne change pour les fichiers deja valides.
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

// 🚨🚨 CE NUMERO EST INVENTE, ET C EST UN PROBLEME.
//
// Il passe dsn-val, qui ne controle que la forme — dix chiffres. Mais
// c est le numero qu un organisme compose quand une declaration pose
// question : la CPAM sur un arret de travail, France Travail sur une fin
// de contrat. Personne ne repondra jamais.
//
// ⚠️ IL N EST PLUS SILENCIEUX : quand le generateur retombe dessus, il le
// SIGNALE en anomalie. Renseigner compta_societes.contact_tel le fait
// disparaitre.
const TELEPHONE_DEFAUT = "0100000000";

// 🚨 LA VERSION DE LA NORME (S10.G00.00.006). Elle change CHAQUE ANNEE :
// cahier technique publie en decembre, applicable en avril.
// ✅ VERIFIE AU CAHIER, page 129 : « P26V01 - Annee 2026 Version 1 »,
// format impose X [6,6] — exactement six caracteres.
//
// ⚠️ L HISTOIRE DE CETTE VALEUR : une premiere installation de dsn-val l a
// refusee sept fois de suite (« valeur hors de la liste de valeurs
// autorisees »), et P26V02 essayee a sa place l etait tout autant.
// ✅ 17/09, PASSAGE 8 : une installation a jour de dsn-val 2026.1.0.16
// L ACCEPTE. Le cahier technique avait raison, c est la premiere
// installation qui ne jugeait pas avec les tables de la norme 2026.
// ⛔ NE PLUS Y TOUCHER avant le cahier technique 2027 (P27V01).
const NORME = "P26V01";

// 🚨 CODE ENVOI DU FICHIER D ESSAI OU REEL — S10.G00.00.005.
//
// ✅ VERIFIE AU CAHIER, page 129 : « 01 - envoi fichier test », « 02 - envoi
// fichier reel ». C est dans ce sens, et pas l inverse. En essai, le bilan
// des controles est rendu quel que soit le resultat et AUCUNE donnee n est
// conservee par les organismes — le nombre d envois n est pas limite.
//
// 🆕 18/09 — CE N EST PLUS UNE CONSTANTE, C EST UNE COLONNE.
// compta_societes.dsn_mode vaut 'test' (defaut) ou 'reel'. Une societe
// nouvellement creee est donc en essai tant que personne n a decide le
// contraire — et le generateur le dit a chaque fichier.
const ENVOI_TEST = "01";
const ENVOI_REEL = "02";

// POINT DE DEPOT — S10.G00.00.007.
// ✅ VERIFIE AU CAHIER, page 129 : « 01 - Net-entreprises », « 02 - MSA ».
//
// 🆕 18/09 — IL SUIT DESORMAIS LE REGIME DE LA SOCIETE.
// ⚠️ LA MSA CONCERNE LE REGIME AGRICOLE, et ce n est pas un detail : le
// fichier part chez un autre destinataire, et plusieurs rubriques changent.
// Un employeur agricole dont le fichier part chez net-entreprises ne
// declare rien du tout.
const DEPOT_NET_ENTREPRISES = "01";
const DEPOT_MSA = "02";

// TYPE DE L ENVOI — S10.G00.00.008.
// ✅ VERIFIE AU CAHIER, page 129 : « 01 - envoi normal », « 02 - envoi
// neant ». Le second ne vaut QUE si toutes les declarations du fichier sont
// sans individu — un mois sans aucun salarie. Ce n est jamais notre cas ici,
// puisqu on ne genere qu a partir de bulletins emis.
const TYPE_ENVOI = "01";

// 🚨 LE TYPE DE TAUX DE PRELEVEMENT A LA SOURCE — S21.G00.50.007.
//
// LA RUBRIQUE PORTE LE CODE DU BAREME APPLIQUE :
//     01  taux PERSONNALISE, transmis par la DGFiP
//     13  bareme non personnalise — metropole
//     23  bareme non personnalise — autre situation geographique
//     33  bareme non personnalise — autre situation geographique
//
// « 13 » est donc le taux neutre de metropole, celui qui s applique tant
// que l administration n a pas transmis de taux personnel. Il est LEGAL et
// c est la valeur par defaut de tout nouveau salarie.
//
// ⚠️ POUR UN SALARIE HORS METROPOLE, « 13 » EST FAUX. Les codes 23 et 33
// existent pour les autres situations geographiques, mais JE N AI PAS LU
// a quel territoire chacun correspond. Le generateur garde donc « 13 » ET
// SIGNALE le cas quand l adresse du salarie est en 97x ou 98x.
//
// ⛔ LA VALEUR DU TAUX PERSONNALISE N EST PAS ECRITE ICI, ET C EST VOULU :
// elle vit dans dsn_codes, correspondance « taux_pas_personnalise », posee
// le 18/09 avec verifie = false — deux sources secondaires concordantes, pas
// le cahier technique lui-meme.
const TYPE_TAUX_NEUTRE = "13";

// 🚨 LES CODES DE COTISATION QUI RELEVENT DE LA RETRAITE COMPLEMENTAIRE.
// La reduction generale se ventile entre deux codes DSN, et c est cette
// liste qui decide de quel cote va chaque euro.
const RETRAITE_COMPLEMENTAIRE = ["RETRAITE_C_T1", "RETRAITE_C_T2", "CEG_T1", "CEG_T2"];

// ═══════════════════════════════════════════════════════════════════════
// 🆕 LE SOCLE DE CTP D UN EMPLOYEUR ORDINAIRE — bordereau, bloc S21.G00.23
//
// Chaque ligne dit : quel code type de personnel, quel qualifiant
// d assiette, et sur quelle assiette du nominatif il se calcule.
// ⚠️ LES ASSIETTES SONT CELLES DES BLOCS 78, cumulees sur tous les
// salaries — c est ce qui garantit l equivalence agrege / nominatif.
//
// 🚨 LE QUALIFIANT : « 921 » pour une assiette plafonnee, « 920 » pour
// toutes les autres (guide URSSAF, §1.3).
// 🚨 LE TAUX (23.003) NE SE DECLARE QUE POUR TROIS COTISATIONS : accident
// du travail, versement mobilite, bonus-malus. Aucune autre.
// 🚨 LE MONTANT DE COTISATION N EST PAS RENSEIGNE sur les CTP de cotisation
// du socle : seule l assiette l est. Le montant ne s ecrit que sur les CTP
// de deduction, de format F — la reduction generale.
// ⚠️ LES TAUX NE FIGURENT PAS ICI : ils vivent dans urssaf_ctp, avec leur
// date d effet. Le generateur controle que chaque CTP y existe et n est pas
// cloture a la periode declaree.
// ═══════════════════════════════════════════════════════════════════════
const CTP_SOCLE: { ctp: string; qualifiant: string; assiette: string; tauxAt?: boolean }[] = [
  // Le regime general, en deux lignes : le taux AT est porte par la 920.
  { ctp: "100", qualifiant: "920", assiette: "03", tauxAt: true },
  { ctp: "100", qualifiant: "921", assiette: "02" },
  // CSG-CRDS : sur l assiette abattue, celle des blocs 78 de type 04.
  { ctp: "260", qualifiant: "920", assiette: "04" },
  // FNAL des moins de cinquante salaries : plafonne.
  { ctp: "332", qualifiant: "921", assiette: "02" },
  // Les deux complements, obligatoires depuis janvier 2026.
  { ctp: "430", qualifiant: "920", assiette: "03" },
  { ctp: "635", qualifiant: "920", assiette: "03" },
  // Chomage et AGS : sur l assiette de l assurance chomage (type 07).
  { ctp: "772", qualifiant: "920", assiette: "07" },
  { ctp: "937", qualifiant: "920", assiette: "07" },
];

// 🚨 LE FNAL DES CINQUANTE SALARIES ET PLUS est un autre CTP, sur la
// totalite et non sur le plafond.
const CTP_FNAL_50PLUS = "236";

// 🚨 LA REDUCTION GENERALE — deux codes, et le choix n est pas indifferent.
// Guide URSSAF, page 33 :
//   668  reduction generale ETENDUE : regime general ET assurance chomage.
//        C est le cas general, celui d un employeur dont l URSSAF recouvre
//        le chomage.
//   671  reduction generale SANS CHOMAGE : pour les employeurs dont la
//        contribution d assurance chomage n est PAS recouvree par l URSSAF.
// ⚠️ LE MONTANT S ECRIT EN POSITIF au bordereau — « au niveau agrege, le
// CTP porte le signe » — alors qu il est negatif au nominatif.
// 🚨 IL DOIT EGALER LA SOMME DES CODES 018, ET ELLE SEULE : le code 106,
// part Agirc-Arrco, ne regarde pas l URSSAF.
const CTP_RGDU_AVEC_CHOMAGE = "668";
const CTP_RGDU_SANS_CHOMAGE = "671";

// 🚨 LES COTISATIONS QUI SE SCINDENT EN BASE ET COMPLEMENT (voir l en-tete).
// Le taux du complement est lu dans urssaf_ctp a la periode declaree — il
// n est pas ecrit ici, il changerait sans qu on le sache.
const SCISSIONS = [
  { codeBase: "075", codeComplement: "907", ctpComplement: "635", quoi: "maladie" },
  { codeBase: "074", codeComplement: "102", ctpComplement: "430", quoi: "allocations familiales" },
];

// 🚨 LES MONTANTS DU BORDEREAU SONT ARRONDIS A L EURO — assiettes comprises.
// Guide URSSAF §1.6 : « tous les montants des blocs Cotisation agregee
// doivent etre arrondis a l euro le plus proche ». Le reste de la DSN est au
// centime. ⚠️ Ils s ecrivent quand meme avec deux decimales : « 7582.00 ».
function euroDsn(v: number): string {
  return Math.round(Number(v || 0)).toFixed(2);
}

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

// 🆕 LE CODE APE AU FORMAT DSN : cinq caracteres, quatre chiffres et une
// lettre, SANS LE POINT. L INSEE l ecrit « 78.20Z », la norme attend
// « 7820Z ». On normalise plutot que de faire confiance a la saisie.
// ⚠️ UNE VALEUR QUI N A PAS CETTE FORME REND UNE CHAINE VIDE : elle n est
// alors pas ecrite, et l appelant la signale — un code APE faux fait
// rejeter le bloc qui le porte.
function apeDsn(v: any): string {
  const a = q(v).replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  return /^\d{4}[A-Z]$/.test(a) ? a : "";
}

// 🆕🚨 LE SALAIRE DE BASE D UN BULLETIN — pour la remuneration de type 010.
//
// ⛔ CE N EST PAS LE BRUT. Un CDD a 2 100 EUR de salaire porte 2 541,00 EUR
// de brut une fois ajoutees l indemnite de fin de contrat et celle de
// conges payes. Declarer le brut en « salaire de base » serait faux pour
// lui, et personne ne le verrait : les deux montants se ressemblent.
//
// ⚠️ ON LE LIT DANS LE BULLETIN, PAS DANS LE CONTRAT : le generateur declare
// ce qui a ete remis au salarie. Le contrat peut avoir change depuis
// (augmentation), le bulletin emis, lui, ne bouge plus.
//
// LA RECHERCHE, DANS L ORDRE :
//   1. la ligne du brut dont le libelle commence par « Salaire de base »
//      ou « Heures normales » — les deux ecritures du calculateur, la
//      seconde pour un salarie paye a l heure ;
//   2. a defaut, la PREMIERE ligne du brut : c est la place du salaire de
//      base sur un bulletin. Le repli est SIGNALE, avec le libelle retenu ;
//   3. a defaut, le salaire mensuel du contrat, SIGNALE lui aussi ;
//   4. sinon rien : on n invente pas un salaire de base.
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 20/09 — LES PRIMES ET INDEMNITES DU BLOC S21.G00.52
//
// LA REGLE, LUE ET EPROUVEE :
// « Tout element qui fait l objet d une declaration au niveau du bloc
// Prime, gratification et indemnite – S21.G00.52 ne doit pas etre integre
// au 002 – Salaire brut servant au calcul de l Assurance chomage »
// (net-entreprises, fiche 2699). Les declarer sans les sortir de la 002
// les compterait deux fois dans les droits au chomage.
//
// ⚠️ L ASSIETTE CHOMAGE DU BLOC 78, ELLE, NE BOUGE PAS : la meme fiche
// precise que la 002 differe de la base assujettie de type 07. Ce sont
// deux notions distinctes — l une ouvre des droits, l autre porte des
// cotisations.
//
// LES CODES, LUS DANS L ENUMERATION QUE dsn-val A AFFICHEE :
//   011  Indemnite legale de fin de CDD          (prime de precarite)
//   012  Indemnite legale de fin de mission      (IFM d un interimaire)
//   020  Indemnite compensatrice de conges payes
//
// ⛔ CE QUI EST FRAGILE, ET QUI EST DIT : le calculateur ne marque pas
// encore ces lignes d un code — on les reconnait a leur LIBELLE. Un
// libelle qui change casserait la declaration en silence. La fonction lit
// donc d abord un code s il existe (`l.code`), et ne retombe sur le
// libelle qu a defaut, en le signalant. ⚠️ A REPRENDRE quand le
// calculateur posera un code sur ces lignes, comme pour le salaire de base.
// ═══════════════════════════════════════════════════════════════════════
function primesDsn(detail: any, ct: any): { lignes: any[]; inconnues: string[] } {
  // 🚨 LES INDEMNITES NE SONT PAS DANS `lignes_brut` — MESURE DU 20/09.
  // Le premier jet les y cherchait et n en trouvait aucune : `lignes_brut`
  // ne porte que le salaire, les heures supplementaires et le panier. Les
  // indemnites de fin de contrat vivent dans `detail.lignes_mission`, et
  // elles y portent DEJA UN CODE — « IFM » et « ICCP ».
  // ⛔ C EST LA LECON DE LA JOURNEE : lire la donnee avant d ecrire le code
  // qui la decoupe. Une supposition sur la forme d un JSON ne se voit pas,
  // elle produit simplement un fichier ou il manque quelque chose.
  const lignes: any[] = Array.isArray(detail && detail.lignes_mission)
    ? detail.lignes_mission : [];

  const sortie: any[] = [];
  const inconnues: string[] = [];

  // ⚠️ LE MEME CODE « IFM » COUVRE DEUX TYPES DIFFERENTS, et c est la
  // nature du contrat qui tranche :
  //   · mission (interim) → 012, indemnite legale de fin de mission
  //   · CDD               → 011, indemnite legale de fin de CDD
  // Les declarer l un pour l autre rattacherait le salarie au mauvais
  // dispositif aupres de France Travail.
  const estMission = q(ct && ct.type_contrat).toLowerCase() === "mission";

  for (const l of lignes) {
    const montant = Number(l && l.montant || 0);
    if (!(montant > 0)) continue;

    const code = q(l && l.code).toUpperCase();
    let type = "";

    if (code === "IFM") type = estMission ? "012" : "011";
    else if (code === "ICCP") type = "020";

    if (type) {
      sortie.push({ type: type, montant: montant, libelle: q(l.libelle) });
    } else {
      // ⛔ ON N INVENTE PAS DE TYPE. Une ligne inconnue reste dans la
      // remuneration et l anomalie la nomme : c est a un humain de dire
      // sous quel type elle se declare.
      inconnues.push(q(l.libelle) + " (code « " + code + " », "
        + montant.toFixed(2) + " EUR)");
    }
  }

  return { lignes: sortie, inconnues: inconnues };
}

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

// 🆕🚨 LE TAUX DE PRELEVEMENT A LA SOURCE D UN SALARIE, A LA DATE DECLAREE.
//
// LA REGLE, ET POURQUOI ELLE TIENT EN UNE DATE :
//
// Le taux personnel d un salarie arrive dans le compte rendu metier que
// net-entreprises renvoie APRES un depot. Il porte une date d effet, et
// cette date n est pas decorative : un taux recu en octobre ne s applique
// pas aux bulletins de septembre deja emis.
//
// ⛔ APPLIQUER UN TAUX RETROACTIVEMENT SERAIT UNE FAUTE : le bulletin remis
// au salarie porte un prelevement, la declaration en porterait un autre, et
// c est la difference que l administration regarde.
//
// ⚠️ SANS TAUX CONNU, LE TAUX NEUTRE EST LA REGLE — pas un pis-aller. Il
// est prevu par la loi pour ce cas precis. Mais il preleve au salarie plus
// que son taux reel, et la difference ne lui revient qu a sa declaration
// de revenus suivante : c est pour cela que le compte rendu metier doit
// etre depouille des qu il arrive.
function tauxPasDe(s: any, periode: string): { taux: number; personnalise: boolean; identifiantCrm: string } {
  const vide = { taux: 0, personnalise: false, identifiantCrm: "" };

  const taux = Number(s && s.taux_pas);
  if (!(taux > 0)) return vide;

  // ⚠️ SANS DATE D EFFET, ON N APPLIQUE PAS LE TAUX. Un taux sans date est
  // un taux dont on ignore depuis quand il vaut : le supposer applicable
  // au mois declare serait deviner.
  const effet = q(s.taux_pas_date_effet);
  if (!effet) return vide;

  // La comparaison porte sur le PREMIER JOUR du mois declare : un taux qui
  // prend effet en cours de mois ne s applique qu au mois suivant.
  if (effet > periode) return vide;

  return {
    taux: taux,
    personnalise: true,
    identifiantCrm: q(s.taux_pas_identifiant_crm),
  };
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

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 LE MODE D ENVOI ET LE POINT DE DEPOT — LUS SUR LA SOCIETE
  //
  // ⚠️ TOUTE AUTRE VALEUR QUE 'reel' EST TRAITEE COMME UN ESSAI. C est le
  // sens de la prudence : une faute de frappe dans la colonne ne doit pas
  // faire partir une declaration reelle par accident.
  // ═══════════════════════════════════════════════════════════════════
  const modeReel = q(societe.dsn_mode).toLowerCase() === "reel";
  const envoi = modeReel ? ENVOI_REEL : ENVOI_TEST;

  const regimeAgricole = q(societe.dsn_regime).toLowerCase() === "agricole";
  const pointDepot = regimeAgricole ? DEPOT_MSA : DEPOT_NET_ENTREPRISES;

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

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — LES ARRETS DE TRAVAIL DU MOIS
  //
  // 🚨 UN ARRET SE SIGNALE DANS LES CINQ JOURS, ET IL SE RETROUVE AUSSI
  // DANS LA MENSUELLE DU MOIS. Les deux ne se remplacent pas : le
  // signalement ouvre les indemnites journalieres, la mensuelle porte la
  // trace de l absence dans la carriere du salarie.
  // ⛔ JUSQU ICI LA MENSUELLE L IGNORAIT : un arret signale n apparaissait
  // nulle part dans la declaration du mois.
  //
  // ⚠️ ON PREND LES ARRETS QUI CHEVAUCHENT LE MOIS, pas seulement ceux qui
  // y commencent : un arret ouvert le 28 aout et clos le 10 septembre
  // concerne les deux mois.
  // ⛔ CE QUI N EST PAS VERIFIE : si un arret qui court sur trois mois se
  // redeclare a l identique chaque mois, ou seulement au premier. La norme
  // n a pas ete lue sur ce point — a eprouver quand un tel cas se
  // presentera.
  //
  // ⚠️ LECTURE TOLERANTE : si la table n est pas lisible, la DSN se genere
  // quand meme et l anomalie le dit. Une brique en moins ne doit pas
  // empecher de declarer les salaires.
  // ═══════════════════════════════════════════════════════════════════
  const arretsParContrat: Record<string, any[]> = {};
  const rupturesParContrat: Record<string, any> = {};
  let arretsLectureEchec = "";
  {
    const finMoisIso = new Date(Number(periode.slice(0, 4)),
      Number(periode.slice(5, 7)), 0).toISOString().slice(0, 10);

    const { data: evts, error: eEvt } = await supabase
      .from("paie_evenements")
      .select("*")
      .eq("societe_id", societeId)
      .lte("date_debut", finMoisIso)
      .order("date_debut");

    if (eEvt) {
      // ⚠️ La liste des anomalies n existe pas encore a ce stade : on
      // retient le message et on le pousse plus bas, des qu elle est la.
      arretsLectureEchec = "Les arrêts de travail n'ont pas pu être lus ("
        + eEvt.message + ") : s'il y en a eu ce mois-ci, ils NE SONT PAS "
        + "déclarés dans cette mensuelle.";
    } else {
      for (const ev of (evts || [])) {
        const cle = String(ev.contrat_id);

        // ═══════════════════════════════════════════════════════════
        // 🆕 20/09 — LA FIN DE CONTRAT, DANS LE MOIS OU ELLE TOMBE
        //
        // 🚨 ELLE NE SE DECLARE QUE DANS LA MENSUELLE DU MOIS DE LA
        // RUPTURE. dsn-val, controle SIG-13 : une date de fin hors du
        // mois declare leve une anomalie. Une rupture de novembre n a
        // donc rien a faire dans la declaration de septembre.
        // ═══════════════════════════════════════════════════════════
        if (String(ev.type_evenement) === "fin_contrat") {
          const dr = q(ev.date_fin) || q(ev.date_debut);
          if (dr && dr >= periode && dr <= finMoisIso) {
            rupturesParContrat[cle] = ev;
          }
          continue;
        }

        if (String(ev.type_evenement) !== "arret") continue;

        // Un arret clos avant le debut du mois ne concerne pas ce mois.
        const fin = q(ev.date_fin);
        if (fin && fin < periode) continue;
        if (!arretsParContrat[cle]) arretsParContrat[cle] = [];
        arretsParContrat[cle].push(ev);
      }
    }
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
  // 🆕 20/09 — l echec de lecture des arrets, retenu plus haut.
  if (arretsLectureEchec) anomalies.push(arretsLectureEchec);

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
  ecrire("S10.G00.00.005", envoi);             // essai (01) ou reel (02)
  ecrire("S10.G00.00.006", NORME);             // version de la norme
  ecrire("S10.G00.00.007", pointDepot);        // net-entreprises ou MSA
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
  const telContact = q(societe.contact_tel) || TELEPHONE_DEFAUT;
  ecrire("S10.G00.02.005", telContact);

  // 🆕🚨 LE NUMERO INVENTE NE PASSE PLUS EN SILENCE — 18/09.
  //
  // « 0100000000 » a la bonne forme, donc dsn-val l accepte. Mais c est le
  // numero que la CPAM composera pour une question sur un arret de travail,
  // et que France Travail composera sur une fin de contrat. Personne ne
  // repondra, et le dossier du salarie attendra.
  if (telContact === TELEPHONE_DEFAUT) {
    anomalies.push("Le téléphone du contact déclaré est le numéro par défaut "
      + "« " + TELEPHONE_DEFAUT + " », qui n'existe pas. ⚠️ C'est le numéro "
      + "que la CPAM ou France Travail composera en cas de question sur un "
      + "salarié. Renseigner compta_societes.contact_tel.");
  }

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
  const codeApe = apeDsn(societe.code_ape);

  ecrire("S21.G00.06.001", siret.slice(0, 9));
  ecrire("S21.G00.06.002", siret.slice(9));
  // 🆕🚨 LE CODE APEN (06.003) EST OBLIGATOIRE — dsn-val, passage 8 :
  // « CST-03 / Absence de la rubrique S21.G00.06.003 ».
  // ⚠️ NOUS L AVIONS RETIRE parce qu une premiere installation de dsn-val
  // le disait « rubrique inconnue dans la norme », sur 06.003 comme sur
  // 11.002. Cette installation refusait aussi P26V01 : elle ne jugeait pas
  // avec les tables de la norme 2026. Celle qui accepte P26V01 reclame les
  // deux rubriques, et le cahier technique les nomme — les deux s accordent.
  // APEN = l activite de l ENTREPRISE, APET = celle de l ETABLISSEMENT. Une
  // societe a un seul etablissement porte le meme code aux deux endroits.
  ecrire("S21.G00.06.003", codeApe);
  ecrire("S21.G00.06.004", societe.adresse);
  ecrire("S21.G00.06.005", q(societe.code_postal));
  ecrire("S21.G00.06.006", societe.ville);

  if (!codeApe) {
    anomalies.push(q(societe.code_ape)
      ? "Code APE « " + q(societe.code_ape) + " » mal formé : il s'écrit sur "
        + "quatre chiffres et une lettre (7820Z). ⛔ NON DÉCLARÉ — les "
        + "rubriques S21.G00.06.003 et S21.G00.11.002 sont obligatoires, LA "
        + "DÉCLARATION SERA REJETÉE. Corriger compta_societes.code_ape."
      : "Code APE absent. ⛔ Les rubriques S21.G00.06.003 (APEN) et "
        + "S21.G00.11.002 (APET) sont obligatoires : LA DÉCLARATION SERA "
        + "REJETÉE. Renseigner compta_societes.code_ape.");
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
  // 🆕🚨 LE CODE APET (11.002) EST OBLIGATOIRE — dsn-val, passage 8 :
  // « CST-03 / Absence de la rubrique S21.G00.11.002 ». Meme histoire que
  // le code APEN du bloc 06, racontee plus haut.
  ecrire("S21.G00.11.002", codeApe);
  ecrire("S21.G00.11.003", societe.adresse);
  ecrire("S21.G00.11.004", q(societe.code_postal));
  ecrire("S21.G00.11.005", societe.ville);

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — LA CONVENTION DE L ETABLISSEMENT NE DEPEND PLUS DE
  // L ORDRE DES BULLETINS
  //
  // DEFAUT MESURE CE MATIN : la rubrique valait 2378 le matin et 1486
  // l apres-midi, sur la MEME societe et le MEME mois. Elle etait prise
  // sur le contrat du PREMIER bulletin du fichier, et l ordre des
  // bulletins avait change — trois rectificatifs emis dans un autre ordre
  // suffisaient a changer la branche declaree pour tout l etablissement.
  // ⛔ UNE DONNEE DE L ETABLISSEMENT NE PEUT PAS DEPENDRE DE QUI A ETE
  // PAYE EN PREMIER.
  //
  // L ORDRE RETENU, DU PLUS SUR AU MOINS SUR :
  //   1. la convention de la societe, quand elle est renseignee — c est
  //      elle que la rubrique attend ;
  //   2. sinon, la convention la PLUS REPRESENTEE parmi les contrats du
  //      mois, et a egalite le code le plus petit : deux generations du
  //      meme mois donnent alors toujours le meme resultat.
  //
  // ⚠️ QUAND PLUSIEURS CONVENTIONS COEXISTENT, ON LE DIT. La 11.022 n en
  // porte qu une, et c est la 40.017 de chaque contrat qui fait foi pour
  // le salarie — elle est deja ecrite, contrat par contrat. Une societe de
  // travail temporaire (2378) dont les permanents relevent d une autre
  // branche est exactement ce cas.
  // ═══════════════════════════════════════════════════════════════════
  const idccParContrat: Record<string, number> = {};
  for (const b of bulletins) {
    const i = q((b as any)?.paie_contrats?.idcc);
    if (i) idccParContrat[i] = (idccParContrat[i] || 0) + 1;
  }
  const idccPresents = Object.keys(idccParContrat).sort(function (a, b) {
    // Le plus represente d abord ; a egalite, le code le plus petit.
    if (idccParContrat[b] !== idccParContrat[a]) {
      return idccParContrat[b] - idccParContrat[a];
    }
    return a < b ? -1 : 1;
  });

  const idccEtab = q(societe.idcc) || idccPresents[0] || "";

  if (idccEtab) ecrire("S21.G00.11.022", String(idccEtab).padStart(4, "0"));
  else {
    anomalies.push("Code convention collective principale absent "
      + "(S21.G00.11.022) — rubrique obligatoire de l'établissement.");
  }

  // ⚠️ LA RESERVE EST UTILE MEME QUAND LE FICHIER PASSE : dsn-val ne voit
  // pas ce defaut-la, et la mauvaise branche rattache le salarie a de
  // mauvais droits conventionnels.
  if (!q(societe.idcc) && idccPresents.length > 1) {
    anomalies.push("Plusieurs conventions collectives parmi les salariés ("
      + idccPresents.join(", ") + ") et aucune n'est renseignée sur la "
      + "société : l'établissement est déclaré sous " + idccEtab
      + ", la plus représentée. Chaque salarié garde la sienne en "
      + "S21.G00.40.017. ⚠️ Renseigner la convention de l'établissement "
      + "pour lever ce choix par défaut.");
  }

  if (q(societe.spst_identifiant)) {
    ecrire("S21.G00.11.025", societe.spst_identifiant);
  }


  let totalBrut = 0;
  let totalCotisations = 0;
  let totalReductions = 0;

  // 🆕 LE COMPTE DES TAUX PERSONNALISES, pour le rendre a l appelant :
  // c est le seul moyen de savoir, sans ouvrir le fichier, si le compte
  // rendu metier a bien ete depouille.
  let nbTauxPersonnalises = 0;

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

  // 🆕 LE CODE DU TYPE DE TAUX PERSONNALISE, lu une seule fois pour tout le
  // fichier. Voir le commentaire de TYPE_TAUX_NEUTRE : cette valeur n est
  // pas ecrite en dur parce qu elle n a pas ete lue au cahier technique.
  const codeTauxPersonnalise = await code("S21.G00.50.007",
    "taux_pas_personnalise", periode);

  // ═══════════════════════════════════════════════════════════════════
  // 🆕 LA PLACE DU BORDEREAU EST RESERVEE ICI.
  //
  // 🚨 Les blocs 20, 22 et 23 sont enfants de l ETABLISSEMENT, comme les
  // individus. Entre freres, l ordre est croissant : 20 et 22 passent donc
  // AVANT le bloc 30. Place apres, tout ce qui suit serait ignore — c est
  // ce qui est arrive trois fois au bloc 85.
  // ✅ CONFIRME PAR dsn-val sur le fichier d essai du 19/09 : zero anomalie.
  //
  // ⚠️ MAIS SON CONTENU SE CALCULE SUR LES INDIVIDUS, qui viennent apres.
  // On retient donc la position, on cumule pendant la boucle, et on insere
  // les lignes a leur place une fois les salaries ecrits. Deux passes sur
  // les bulletins donneraient deux calculs a garder d accord ; une seule
  // passe et une insertion ne peuvent pas diverger.
  // ═══════════════════════════════════════════════════════════════════
  const posBordereau = L.length;

  // Les assiettes cumulees, par type de bloc 78 : c est la matiere du
  // bordereau, et elle vient des memes chiffres que le nominatif.
  const assiettesCumulees: Record<string, number> = {};
  // 🆕 20/09 — LE VERSEMENT MOBILITE, CUMULE PAR COMMUNE.
  // 🚨 PAR COMMUNE, PAS EN TOTAL : le CTP 900 se declare « pour chaque
  // commune au titre de laquelle le versement mobilite est du, y compris en
  // cas de similarite de taux » (guide Urssaf). Deux etablissements dans
  // deux zones font deux lignes, meme si le taux est identique.
  const vmParCommune: Record<string, { assiette: number; montant: number; taux: number }> = {};
  // La somme des codes 018 — la part de reduction qui revient a l URSSAF.
  let rgduUrssaf = 0;
  // Ce que l employeur doit reellement a l URSSAF, pour les blocs 20 et 22.
  let duUrssaf = 0;

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

    // 🚨 L IDENTIFIANT DU LIEU DE TRAVAIL EST OBLIGATOIRE POUR TOUS LES
    // CONTRATS, pas seulement pour l interim. dsn-val : « absence de la
    // rubrique S21.G00.40.019 » sur le CDI comme sur le CDD.
    //
    // ⚠️ POUR UN SALARIE ORDINAIRE, LE LIEU DE TRAVAIL EST L ETABLISSEMENT
    // QUI L EMPLOIE : la rubrique reprend alors le SIRET de la societe.
    // Pour un interimaire, c est l entreprise utilisatrice — c est la qu il
    // travaille reellement, et c est elle qui porte le risque.
    // ⛔ ET CE QUI EST DECLARE ICI DOIT EXISTER EN BLOC 85 : les deux se
    // repondent, sinon la declaration est rejetee.
    ecrire("S21.G00.40.019", missionValide ? siretEu : siret);

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

    // 🚨 LA PERIODE D ESSAI NE SE DECLARE QUE TANT QU ELLE COURT.
    //
    // dsn-val, sur le CDI de janvier avec 60 jours d essai : « presence de
    // la rubrique interdite S21.G00.40.082 ». Le cahier la dit obligatoire
    // — elle l est, mais seulement pendant l essai. Une fois le delai
    // ecoule, la declarer n a plus de sens et devient une faute.
    //
    // ⚠️ LE CALCUL SE FAIT A LA FIN DU MOIS DECLARE : si l essai se termine
    // avant, la rubrique disparait d elle-meme au mois suivant.
    if (ct.essai_duree_jours && q(ct.date_debut)) {
      const debutC = new Date(String(ct.date_debut));
      const finEssai = new Date(debutC.getTime()
        + Number(ct.essai_duree_jours) * 86400000);
      const finMois = new Date(Number(periode.slice(0, 4)),
        Number(periode.slice(5, 7)), 0);
      if (finEssai >= finMois) {
        ecrire("S21.G00.40.082", String(ct.essai_duree_jours));
      }
    }

    // 🆕⛔ LA RUBRIQUE S21.G00.40.084 A ETE RETIREE LE 17/09.
    //
    // Nous y declarions la proratisation du plafond de securite sociale
    // (« 02 » pour un temps plein). dsn-val, passage 8, sur les trois
    // contrats : « CV10 / Rubrique inconnue dans la norme ».
    // ⚠️ UNE RUBRIQUE INCONNUE NE SE CORRIGE PAS, ELLE SE RETIRE : il n y a
    // pas de bonne valeur a y mettre. La derniere rubrique du contrat est
    // donc la periode d essai (40.082) quand elle court, sinon le risque
    // accident du travail.

    // ═══════════════════════════════════════════════════════════════


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

    // ═══════════════════════════════════════════════════════════════
    // 🚨🚨 L ORDRE DES SOUS-GROUPES DU CONTRAT — LA REGLE, ENFIN COMPLETE
    //
    // Sous un meme parent, les sous-groupes se suivent dans l ORDRE
    // CROISSANT DE LEUR NUMERO, sans exception :
    //     40 contrat · 50 versement · 51 remuneration · 53 activite
    //     58 net social · 71 retraite complementaire · 78 assiettes
    //     (avec 79 et 81) · 86 anciennete
    //
    // ⚠️ J AVAIS ECRIT 53, 71 ET 86 JUSTE APRES LE CONTRAT, avant le
    // versement. dsn-val a repondu « sous-groupe S21.G00.50 non attendu
    // apres S21.G00.86.005 » et « S21.G00.53 non attendu apres
    // S21.G00.40.084 » : l activite etait ignoree, d ou l anomalie sur
    // l unite de mesure de la quotite, et la remuneration ne se rattachait
    // plus au versement.
    //
    // ⛔ UNE SEULE INVERSION FAIT TOMBER TOUT CE QUI SUIT DANS LE BLOC.
    // C est la troisieme fois de la journee que cette regle se rappelle a
    // nous, et la derniere : l ordre ci-dessous est celui de la norme.
    // ═══════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════
    // 🆕 20/09 — ══ S21.G00.60 — L ARRET DE TRAVAIL ══
    //
    // 🚨 SA PLACE EST ICI : enfant du contrat, et AVANT le bloc 71 —
    // entre freres, 60 precede 71. Le fichier d essai de 587 lignes a
    // ete valide par dsn-val a cette place exacte, zero anomalie.
    //
    // LES HUIT RUBRIQUES, telles que dsn-val les a acceptees :
    //   001 motif · 002 date du dernier jour travaille · 003 date de fin
    //   previsionnelle · 004 subrogation · puis, EN SUBROGATION SEULEMENT,
    //   005 debut · 006 fin · 007 IBAN · 008 BIC.
    // 🚨 LES QUATRE RUBRIQUES DE SUBROGATION VONT ENSEMBLE : l une sans
    // les autres est refusee.
    // ⚠️ LA FIN DE SUBROGATION N EST PAS LA FIN DE L ARRET : c est la fin
    // du maintien de salaire. ⛔ ELLE NE SE PRE-REMPLIT PAS.
    // ═══════════════════════════════════════════════════════════════
    for (const ev of (arretsParContrat[String(ct.id)] || [])) {
      const motifBrut = q(ev.motif);
      const debutArret = q(ev.date_debut);
      const finPrev = q(ev.date_fin);

      // 🚨 LE MOTIF EST EN CLAIR EN BASE (« maladie »), PAS EN CODE. La
      // norme attend « 01 ». La correspondance vit dans dsn_codes, comme
      // partout ailleurs. ⛔ NE JAMAIS ECRIRE LE LIBELLE : la ligne serait
      // rejetee, et inventer un code serait pire.
      let motif = "";
      if (motifBrut) {
        motif = (await code("S21.G00.60.001", motifBrut, periode)) || "";
        // Un motif deja saisi sous sa forme normalisee passe tel quel.
        if (!motif && /^[0-9]{2}$/.test(motifBrut)) motif = motifBrut;
      }

      if (!motif) {
        anomalies.push(qui + " : le motif d'arrêt « " + motifBrut + " » n'a "
          + "pas de correspondance dans dsn_codes (S21.G00.60.001). "
          + "⛔ L'ARRÊT N'EST PAS DÉCLARÉ dans cette mensuelle.");
        continue;
      }

      // ⛔ DEUX DATES SONT OBLIGATOIRES : sans elles, la ligne serait
      // rejetee. On prefere ne rien ecrire et le dire.
      if (!debutArret || !finPrev) {
        anomalies.push(qui + " : arrêt de travail incomplet (date de début "
          + "ou date de fin prévisionnelle manquante) — ⛔ NON DÉCLARÉ dans "
          + "cette mensuelle. Le compléter dans l'écran de paie.");
        continue;
      }

      ecrire("S21.G00.60.001", motif);
      ecrire("S21.G00.60.002", dateDsn(debutArret));
      ecrire("S21.G00.60.003", dateDsn(finPrev));

      const subro = ev.subrogation === true;
      ecrire("S21.G00.60.004", subro ? "01" : "02");

      if (subro) {
        const sDeb = q(ev.subro_debut) || debutArret;
        const sFin = q(ev.subro_fin);
        const iban = q(ev.iban);
        const bic = q(ev.bic);

        // 🚨 LES QUATRE OU AUCUNE.
        if (sFin && iban && bic) {
          ecrire("S21.G00.60.005", dateDsn(sDeb));
          ecrire("S21.G00.60.006", dateDsn(sFin));
          ecrire("S21.G00.60.007", iban);
          ecrire("S21.G00.60.008", bic);
        } else {
          anomalies.push(qui + " : subrogation annoncée mais incomplète "
            + "(il faut la date de fin de maintien, l'IBAN et le BIC). "
            + "⛔ Les coordonnées ne sont PAS déclarées : la caisse versera "
            + "les indemnités au salarié et non à l'employeur.");
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🆕 20/09 — ══ S21.G00.62 — LA FIN DU CONTRAT ══
    //
    // 🚨🚨 DANS LA MENSUELLE, DEUX RUBRIQUES ET PAS UNE DE PLUS : la date
    // de fin (001) et le motif de rupture (002). ⛔ TOUT LE RESTE DU
    // SIGNALEMENT Y EST INTERDIT, et dsn-val l a dit en toutes lettres
    // sur le fichier d essai de 593 lignes :
    //   · « le sous-groupe S21.G00.63 est interdit pour cette nature de
    //     declaration (DSN Mensuelle) » — le preavis ne se declare que
    //     dans le signalement de fin de contrat ;
    //   · CST-04 sur 62.008, la transaction en cours ;
    //   · CST-04 sur 62.020, le mois de la DSN portant le solde.
    // Le fichier reduit a ces deux rubriques (589 lignes) est passe sans
    // aucune anomalie.
    //
    // ⚠️ LA DATE DOIT TOMBER DANS LE MOIS DECLARE : le controle SIG-13
    // refuse une rupture de novembre dans une declaration de septembre.
    // C est pourquoi la selection se fait sur le mois, plus haut.
    // ⚠️ LE SIGNALEMENT DE FIN DE CONTRAT RESTE DU : il part dans les cinq
    // jours et porte le detail. La mensuelle n en garde que la trace.
    // ═══════════════════════════════════════════════════════════════
    {
      const rup = rupturesParContrat[String(ct.id)];
      if (rup) {
        const dateRupture = q(rup.date_fin) || q(rup.date_debut);
        const motifBrut = q(ct.motif_rupture_dsn) || q(rup.motif);

        // 🚨 LE MOTIF PASSE PAR dsn_codes, comme celui de l arret : en base
        // il vaut « fin_cdd », la norme attend « 031 ».
        let motifRup = "";
        if (motifBrut) {
          motifRup = (await code("S21.G00.62.002", motifBrut, periode)) || "";
          if (!motifRup && /^[0-9]{3}$/.test(motifBrut)) motifRup = motifBrut;
        }

        if (!motifRup) {
          anomalies.push(qui + " : le motif de rupture « " + motifBrut
            + " » n'a pas de correspondance dans dsn_codes (S21.G00.62.002). "
            + "⛔ LA FIN DE CONTRAT N'EST PAS DÉCLARÉE dans cette mensuelle.");
        } else {
          ecrire("S21.G00.62.001", dateDsn(dateRupture));
          ecrire("S21.G00.62.002", motifRup);

          // ═══════════════════════════════════════════════════════════
          // 🆕🚨 20/09 — LE DERNIER JOUR TRAVAILLE, POUR UNE MISSION
          //
          // dsn-val, controle CCH-14, sur la fin de mission de Julien :
          // « Vous avez declare la valeur "03 - Contrat de mission
          // (contrat de travail temporaire)" au niveau de la rubrique
          // Nature du contrat » — et la 62.006 manquait.
          //
          // ⛔ CETTE REGLE DEPEND DE LA NATURE DU CONTRAT, et c est ce qui
          // l avait masquee : le premier essai portait sur un CDD, ou la
          // rubrique n est pas reclamee. Une regle eprouvee sur un seul
          // type de contrat n est pas une regle eprouvee.
          //
          // ⚠️ CE N EST PAS LA DATE DE FIN : c est le dernier jour paye au
          // salaire habituel, qui peut etre anterieur — un salarie en
          // arret jusqu a la fin de son contrat, par exemple. On prend
          // donc la valeur saisie, et la date de rupture seulement a
          // defaut.
          // ═══════════════════════════════════════════════════════════
          const natureContrat = q(ct.type_contrat).toLowerCase();
          const estMissionRup = natureContrat === "mission";
          const dernierJour = q(rup.dernier_jour_travaille);

          if (dernierJour) {
            ecrire("S21.G00.62.006", dateDsn(dernierJour));
          } else if (estMissionRup) {
            // Obligatoire ici : plutot que de laisser la declaration etre
            // rejetee, on retombe sur la date de rupture et on le dit.
            ecrire("S21.G00.62.006", dateDsn(dateRupture));
            anomalies.push(qui + " : le dernier jour travaillé et payé au "
              + "salaire habituel (S21.G00.62.006) n'était pas renseigné. "
              + "⚠️ La date de fin de contrat a été déclarée à sa place — "
              + "elle est fausse si le salarié a cessé d'être payé avant.");
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ══ S21.G00.71 — LA RETRAITE COMPLEMENTAIRE ══
    //
    // 🚨🚨 SA PLACE EST JUSTE APRES LE CONTRAT, et dsn-val l a dit deux
    // fois : « sous-groupe S21.G00.71 ABSENT APRES S21.G00.40 » et « non
    // attendu apres S21.G00.58.004 ».
    //
    // ⚠️ POURQUOI : LE BLOC 71 EST ENFANT DU CONTRAT, tandis que le
    // versement (50) est enfant de l INDIVIDU. Ils ne sont pas freres, donc
    // la regle de l ordre croissant ne les compare pas — c est la
    // hierarchie qui commande, et elle place 71 sous 40.
    // 🚨 L ORDRE CROISSANT NE VAUT QU ENTRE FRERES. Je l avais applique a
    // des blocs de niveaux differents, ce qui a coute un passage.
    //
    // ⚠️ CONTROLE CCH-17 : un salarie declare « 04 - non cadre » en statut
    // categoriel EXIGE un bloc 71 portant RETA, RUAA ou CAVEC. Sans lui, la
    // declaration ne dit pas a quelle caisse de retraite complementaire le
    // salarie est rattache — et personne ne peut lui ouvrir de droits.
    // ═══════════════════════════════════════════════════════════════
    ecrire("S21.G00.71.002", q(ct.regime_retraite_c) || "RUAA");

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
    // ═══════════════════════════════════════════════════════════════
    ecrire("S21.G00.50.001", finPeriode);
    ecrire("S21.G00.50.002", montantDsn(b.net_imposable));
    ecrire("S21.G00.50.003", "01");
    ecrire("S21.G00.50.004", montantDsn(b.net_a_payer));

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 LE TAUX DE PRELEVEMENT A LA SOURCE — 18/09
    //
    // Il valait 0 au taux neutre pour tout le monde, en dur. Il vient
    // desormais du salarie, avec sa date d effet.
    //
    // ⚠️ DEUX CAS, ET UN SEUL EST ECRIT :
    //   · un taux personnel connu ET applicable au mois declare → on ecrit
    //     ce taux, avec son type ;
    //   · tout le reste → taux neutre, valeur legale et sans risque.
    //
    // ⛔ LE TYPE DU TAUX PERSONNALISE N EST PAS INVENTE. S il manque dans
    // dsn_codes, le generateur GARDE LE TAUX NEUTRE et le signale : mieux
    // vaut un prelevement legalement correct qu un type de taux devine.
    // ═══════════════════════════════════════════════════════════════
    const pas = tauxPasDe(s, periode);

    if (pas.personnalise && codeTauxPersonnalise) {
      ecrire("S21.G00.50.006", montantDsn(pas.taux));
      ecrire("S21.G00.50.007", codeTauxPersonnalise);

      // 🆕🚨 S21.G00.50.008 — L IDENTIFIANT DU COMPTE RENDU METIER.
      //
      // Elle ne se renseigne QUE sur un taux personnalise, et elle dit DE
      // QUEL compte rendu le taux a ete tire. C est ce qui permet a la DGFiP
      // de rattacher le prelevement a la transmission qui l a fonde.
      // ⚠️ SANS ELLE, LE TAUX EST DECLARE SANS SA SOURCE. Le fichier passe,
      // mais l administration ne peut plus verifier d ou vient le taux
      // applique au salarie.
      if (pas.identifiantCrm) {
        ecrire("S21.G00.50.008", pas.identifiantCrm);
      } else {
        anomalies.push(qui + " : taux personnalisé de " + montantDsn(pas.taux)
          + " % déclaré SANS l'identifiant du compte rendu métier "
          + "(S21.G00.50.008). ⚠️ La DGFiP ne pourra pas rattacher ce taux à "
          + "la transmission qui l'a fourni. Renseigner "
          + "paie_salaries.taux_pas_identifiant_crm, il figure dans le compte "
          + "rendu d'où le taux a été repris.");
      }

      nbTauxPersonnalises++;
    } else {
      ecrire("S21.G00.50.006", montantDsn(0));
      ecrire("S21.G00.50.007", TYPE_TAUX_NEUTRE);

      if (pas.personnalise && !codeTauxPersonnalise) {
        anomalies.push(qui + " : un taux de prélèvement à la source de "
          + montantDsn(pas.taux) + " % est enregistré, mais le code du type "
          + "de taux personnalisé est absent de dsn_codes (S21.G00.50.007). "
          + "⚠️ LE TAUX NEUTRE A ÉTÉ DÉCLARÉ À LA PLACE — le salarié paiera "
          + "plus que son taux réel ce mois-ci. Renseigner la correspondance "
          + "« taux_pas_personnalise » depuis le cahier technique.");
      }

      // 🆕🚨 LE BAREME NEUTRE DEPEND DE LA SITUATION GEOGRAPHIQUE.
      //
      // « 13 » est le bareme de METROPOLE. Les codes 23 et 33 existent pour
      // les autres situations geographiques — mais je n ai pas lu a quel
      // territoire chacun correspond, et l inventer ferait prelever au
      // salarie un montant calcule sur le mauvais bareme.
      // ⚠️ ON GARDE « 13 » ET ON LE DIT : un taux legalement defendable et
      // une anomalie visible valent mieux qu une valeur devinee.
      const cpSalarie = q(s.code_postal);
      if (cpSalarie.length >= 2 && (cpSalarie.slice(0, 2) === "97"
          || cpSalarie.slice(0, 2) === "98")) {
        anomalies.push(qui + " : adresse hors métropole (code postal "
          + cpSalarie + ") et taux neutre déclaré au barème « 13 », qui est "
          + "celui de la métropole. ⚠️ Les barèmes 23 et 33 existent pour les "
          + "autres situations géographiques — la correspondance exacte n'a "
          + "PAS été vérifiée au cahier technique. À trancher avant tout "
          + "dépôt réel concernant ce salarié.");
      }
    }

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
    // ══ 🆕 LES REMUNERATIONS 003 ET 010 — REQUISES PAR LE CONTROLE CCH-11 ══
    //
    // 🚨🚨 dsn-val, passage 9, la derniere anomalie du fichier : « vous
    // avez declare un contrat et un versement individu, sans renseigner de
    // remuneration de type 001, 002… ». Le message etait tronque a l ecran.
    // LE CONTROLE EN ENTIER (journal de maintenance de la norme, guide
    // URSSAF de declaration en DSN) : pour un contrat dont la nature n est
    // pas « 93 » et un versement individu donnes, les remunerations de type
    //     001 - Remuneration brute non plafonnee
    //     002 - Salaire brut servant aux droits de l Assurance chomage
    //     003 - Salaire retabli - reconstitue
    //     010 - Salaire de base
    // SONT TOUTES LES QUATRE REQUISES. Nous n ecrivions que 001 et 002.
    //
    // ⛔ LE TYPE 003 NE SE MET PAS A ZERO QUAND IL N Y A PAS D ABSENCE.
    // Le salaire retabli est ce que le salarie AURAIT touche s il avait
    // travaille tout le mois. Il est renseigne TOUS LES MOIS : sans absence,
    // il est strictement egal au brut reel. Le « 0.00 » que prevoit la
    // norme ne vaut que pour une remuneration reellement nulle.
    // 🚨 CE MONTANT SERT A L ASSURANCE MALADIE POUR CALCULER LES INDEMNITES
    // JOURNALIERES. Un zero ici, et le salarie qui tombe malade trois mois
    // plus tard voit ses indemnites calculees sur un salaire nul.
    // ⚠️ LE JOUR OU LE BULLETIN TRAITERA L ABSENCE MALADIE (retenue et
    // maintien), ce montant devra venir du calcul reconstitue, PAS du brut :
    // c est precisement le mois de l absence que les deux different.
    //
    // ⚠️ L ORDRE DES QUATRE BLOCS : 001, 003, 010, et la 002 EN DERNIER. La
    // norme n impose aucun ordre entre les types, mais la 002 est la seule a
    // porter un enfant — le bloc activite (53). Ecrite en dernier, elle
    // evite de redescendre puis remonter d un niveau au milieu des
    // remunerations.
    // ═══════════════════════════════════════════════════════════════
    ecrire("S21.G00.51.001", debutPeriode);
    ecrire("S21.G00.51.002", finPeriode);
    ecrire("S21.G00.51.010", numeroContrat);
    ecrire("S21.G00.51.011", "003");
    ecrire("S21.G00.51.013", montantDsn(b.brut));

    const base010 = salaireDeBaseDsn(detail, ct);
    if (base010) {
      ecrire("S21.G00.51.001", debutPeriode);
      ecrire("S21.G00.51.002", finPeriode);
      ecrire("S21.G00.51.010", numeroContrat);
      ecrire("S21.G00.51.011", "010");
      ecrire("S21.G00.51.013", montantDsn(base010.montant));
      if (base010.repli) {
        anomalies.push(qui + " : le salaire de base déclaré (S21.G00.51, type 010) "
          + "vient d'un repli — " + base010.repli + ", soit "
          + montantDsn(base010.montant) + " EUR. Aucune ligne « Salaire de base » "
          + "ni « Heures normales » n'a été trouvée sur le bulletin. À VÉRIFIER.");
      }
    } else {
      anomalies.push(qui + " : salaire de base introuvable, ni sur le bulletin ni "
        + "sur le contrat. ⛔ LA RÉMUNÉRATION DE TYPE 010 N'EST PAS DÉCLARÉE — "
        + "elle est obligatoire (contrôle CCH-11), LA DÉCLARATION SERA REJETÉE.");
    }

    // ═══════════════════════════════════════════════════════════════
    // ══ LA REMUNERATION DE TYPE 002, ET LE BLOC ACTIVITE ══
    //
    // 🚨🚨 LE BLOC ACTIVITE NE PEUT VIVRE QUE SOUS UNE REMUNERATION DE
    // TYPE « 002 - salaire brut servant aux calculs des droits de
    // l Assurance chomage ». dsn-val, controle CCH-11 : sous un bloc 51 de
    // type 001, il est refuse.
    //
    // ⚠️ LA 001 ET LA 002 NE DISENT PAS LA MEME CHOSE :
    //   · 001 — la remuneration brute non plafonnee, celle des cotisations
    //   · 002 — l assiette qui ouvre les droits au chomage, sous laquelle
    //     se declare le volume de travail
    // Les deux portent le meme montant tant qu il n y a ni prime exclue de
    // l assiette chomage ni plafonnement.
    // ⛔ RESERVE LEVEE LE 20/09 : les primes et indemnites sont desormais
    // declarees en bloc S21.G00.52 et SORTIES de la 002, conformement a la
    // norme. Voir la fonction primesDsn en tete de fichier.
    //
    // 🚨 C EST LE VOLUME DE TRAVAIL QUI FONDE LES DROITS : France Travail
    // calcule l allocation sur ces heures autant que sur ce montant. Les
    // omettre prive le salarie d une partie de ses droits, et cela ne se
    // voit qu au moment ou il en a besoin.
    // ═══════════════════════════════════════════════════════════════
    const primes = primesDsn(detail, ct);
    const totalPrimes = primes.lignes.reduce(function (s: number, p: any) {
      return s + Number(p.montant || 0);
    }, 0);

    // ⚠️ LA 002 EST LE BRUT MOINS CE QUI PART EN BLOC 52.
    // ⛔ ELLE NE PEUT PAS ETRE NEGATIVE : si les primes depassaient le brut,
    // c est qu une ligne a ete mal reconnue. On ne declare alors aucune
    // prime, et on le dit — mieux vaut la declaration d hier que des
    // chiffres qui ne s additionnent pas.
    let remu002 = Number(b.brut) - totalPrimes;
    let primesRetenues = primes.lignes;

    if (remu002 < 0) {
      anomalies.push(qui + " : les primes et indemnités reconnues ("
        + montantDsn(totalPrimes) + " EUR) dépassent le brut du bulletin ("
        + montantDsn(b.brut) + " EUR). ⛔ AUCUNE N'EST DÉCLARÉE en bloc "
        + "S21.G00.52 : une ligne a forcément été mal reconnue.");
      primesRetenues = [];
      remu002 = Number(b.brut);
    }

    ecrire("S21.G00.51.001", debutPeriode);
    ecrire("S21.G00.51.002", finPeriode);
    ecrire("S21.G00.51.010", numeroContrat);
    ecrire("S21.G00.51.011", "002");
    ecrire("S21.G00.51.013", montantDsn(remu002));

    // ⚠️ TYPE 01 = travail remunere, unite 10 = heure. Le type 02 sert aux
    // absences, qui ne sont pas encore traitees.
    if (dureeMensuelleRef > 0) {
      ecrire("S21.G00.53.001", "01");
      ecrire("S21.G00.53.002", montantDsn(dureeMensuelleRef));
      ecrire("S21.G00.53.003", "10");
    }

    // ═══════════════════════════════════════════════════════════════
    // 🆕 ══ S21.G00.52 — PRIMES, GRATIFICATIONS ET INDEMNITES ══
    //
    // 🚨 SA PLACE : apres la remuneration et son bloc activite, avant le
    // net social. Entre freres, 51 < 52 < 58. Le fichier d essai de 602
    // lignes a ete valide par dsn-val a cette place exacte.
    // ⚠️ TROIS RUBRIQUES SUFFISENT : type, montant, numero de contrat. Les
    // dates de rattachement sont conditionnelles — elles servent quand la
    // prime se rattache a une periode autre que le mois declare, ce qui
    // n est pas le cas ici.
    // ═══════════════════════════════════════════════════════════════
    for (const p of primesRetenues) {
      ecrire("S21.G00.52.001", p.type);
      ecrire("S21.G00.52.002", montantDsn(p.montant));
      ecrire("S21.G00.52.006", numeroContrat);
    }

    if (primes.inconnues.length > 0) {
      anomalies.push(qui + " : indemnité(s) sans type DSN connu — "
        + primes.inconnues.join(" ; ") + ". ⛔ ELLE(S) NE SONT PAS DÉCLARÉES "
        + "en bloc S21.G00.52 et restent dans la rémunération de type 002. "
        + "Ajouter la correspondance avant le dépôt.");
    }


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
      // 🆕 20/09 — COMBIEN DE LIGNES DE BULLETIN ALIMENTENT CE CODE ?
      // Le taux au nominatif (81.007) n a de sens que si une seule ligne
      // l alimente : deux lignes de taux differents donneraient un taux
      // moyen, qui n existe nulle part.
      parAssiette[bAss].codes[corr.code].nb =
        (parAssiette[bAss].codes[corr.code].nb || 0) + 1;

      // ═══════════════════════════════════════════════════════════════
      // 🆕 20/09 — LE VERSEMENT MOBILITE PORTE SA COMMUNE ET SON TAUX
      //
      // 🚨 LE CODE INSEE EST OBLIGATOIRE, DEUX FOIS : en S21.G00.81.005 au
      // nominatif et en S21.G00.23.006 au bordereau, « pour chaque commune
      // au titre de laquelle le versement mobilite est du, Y COMPRIS EN CAS
      // DE SIMILARITE DE TAUX » (guide Urssaf, §1.1). Le guide precise
      // qu une ligne du CTP 900 rejetee faute de code commune oblige a
      // regulariser le mois suivant.
      //
      // ⚠️ IL VIENT DU BULLETIN, pas d une deduction faite ici : c est le
      // moteur de paie qui a choisi la commune — lieu de travail du
      // contrat, sinon entreprise utilisatrice, sinon etablissement — et
      // qui a lu le taux correspondant. ⛔ LE REDEVINER ICI, C EST
      // RISQUER DE DECLARER UNE AUTRE COMMUNE QUE CELLE QUI A SERVI AU
      // CALCUL.
      // ⚠️ UN BULLETIN EMIS AVANT LE 20/09 NE PORTE PAS CE CHAMP : la
      // ligne est alors declaree au nominatif sans sa commune, et
      // l anomalie le dit au moment d ecrire le bordereau.
      // ═══════════════════════════════════════════════════════════════
      if (interne === "VERSEMENT_MOBILITE") {
        const insee = q((l as any).insee);
        if (insee) parAssiette[bAss].codes[corr.code].insee = insee;
        parAssiette[bAss].codes[corr.code].tauxVm = Number(l.taux_patronal || 0);
      }

      // 🚨 CONTROLE SIG-18 DU CAHIER : tout bloc « 131 - regime unifie
      // Agirc-Arrco » doit etre accompagne d un bloc « 142 - part patronale
      // tranche T1 ». On cumule la part patronale pour l ecrire ensuite.
      if (corr.code === "131") patronaleT1 += Number(l.part_patronale || 0);
    }

    // ⚠️ L ORDRE DES ASSIETTES : la deplafonnee en premier, parce que c est
    // sous elle que se rattache la reduction generale (controle CCH-17).
    // 🆕 20/09 — « 57 - Assiette du versement mobilite » ferme la marche.
    // 🚨 ELLE EST PROPRE AU VERSEMENT MOBILITE : le guide Urssaf range
    // cette cotisation sous sa propre base assujettie, pas sous l assiette
    // brute deplafonnee. ⛔ SANS CETTE LIGNE, LE GROUPE « 57 » SERAIT
    // CALCULE PUIS JETE EN SILENCE — la cotisation disparaitrait du
    // nominatif sans aucun message.
    const ordreAssiettes = ["03", "02", "04", "07", "57"];

    for (const bAss of ordreAssiettes) {
      const grp = parAssiette[bAss];
      if (!grp) continue;

      // 🆕 LE CUMUL QUI NOURRIT LE BORDEREAU : la meme valeur que celle
      // ecrite au nominatif, jamais un calcul parallele.
      assiettesCumulees[bAss] = (assiettesCumulees[bAss] || 0) + Number(grp.assiette || 0);

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
            // 🆕 LE BORDEREAU DOIT PORTER EXACTEMENT CETTE SOMME.
            rgduUrssaf += partAutres;
            duUrssaf -= partAutres;
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

      // ═══════════════════════════════════════════════════════════
      // 🆕🚨 LA SCISSION DE LA MALADIE ET DES ALLOCATIONS FAMILIALES
      //
      // Voir l en-tete du fichier : depuis janvier 2026, ces deux
      // cotisations se declarent en DEUX lignes — la base et le
      // complement — et l URSSAF rapproche chaque complement du CTP
      // correspondant au bordereau.
      //
      // ⚠️ LE COMPLEMENT SE CALCULE AU TAUX DU CTP, PAS PAR SOUSTRACTION
      // D UN TAUX SUPPOSE : c est la table urssaf_ctp qui porte le taux,
      // avec sa date d effet. La base est ce qui reste.
      // ⛔ SI LE TAUX N EST PAS TROUVE, ON NE SCINDE PAS et on le dit :
      // une ligne entiere sous le mauvais code vaut mieux que deux lignes
      // fausses, et l anomalie dit quoi corriger.
      // ═══════════════════════════════════════════════════════════
      for (const sc of SCISSIONS) {
        const ligne = grp.codes[sc.codeBase];
        if (!ligne) continue;

        const { data: ctpc } = await supabase
          .from("urssaf_ctp")
          .select("taux_deplafonne, libelle")
          .eq("code", sc.ctpComplement)
          .lte("date_effet", periode)
          .or("date_fin.is.null,date_fin.gte." + periode)
          .order("date_effet", { ascending: false })
          .limit(1)
          .maybeSingle();

        const tauxc = ctpc ? Number(ctpc.taux_deplafonne || 0) : 0;
        if (tauxc <= 0) {
          anomalies.push("Le taux du CTP " + sc.ctpComplement + " (complément "
            + sc.quoi + ") est introuvable dans urssaf_ctp pour " + periode
            + ". ⛔ LA COTISATION N'EST PAS SCINDÉE : l'URSSAF signalera une "
            + "incohérence entre le bordereau et les données individuelles. "
            + "Importer la table des codes types de personnel.");
          continue;
        }

        const complement = Math.round(ligne.base * tauxc) / 100;
        const reste = Math.round((ligne.montant - complement) * 100) / 100;

        // ⚠️ UN COMPLEMENT PLUS GROS QUE LA COTISATION veut dire que le taux
        // du bulletin n est pas celui qu on croit. On ne scinde pas.
        if (reste < 0) {
          anomalies.push(qui + " : le complément " + sc.quoi + " calculé au taux "
            + "du CTP " + sc.ctpComplement + " (" + tauxc.toFixed(2) + " %) dépasse "
            + "la cotisation du bulletin. ⛔ NON SCINDÉE — vérifier le taux dans "
            + "paie_cotisations.");
          continue;
        }

        ligne.montant = reste;
        grp.codes[sc.codeComplement] = { montant: complement, base: ligne.base };
      }

      // ══ LES COTISATIONS DE CETTE ASSIETTE ══
      const listeCodes = Object.keys(grp.codes).sort();
      for (const cd of listeCodes) {
        ecrire("S21.G00.81.001", cd);
        ecrire("S21.G00.81.003", montantDsn(grp.codes[cd].base));
        ecrire("S21.G00.81.004", montantDsn(grp.codes[cd].montant));

        // ═══════════════════════════════════════════════════════════════
        // 🆕🚨 20/09 — LE TAUX AU NOMINATIF (S21.G00.81.007)
        //
        // Le guide Urssaf le montre dans l attendu de chaque code, sauf pour
        // les reductions, les exonerations et les cotisations forfaitaires.
        // dsn-val l accepte a cette place, avec deux decimales (essai de 611
        // lignes, zero anomalie).
        //
        // 🚨 MAIS dsn-val NE VERIFIE PAS QUE ASSIETTE × TAUX = MONTANT : il
        // aurait accepte n importe quel taux. C est l URSSAF qui rapproche
        // les trois ensuite, et un taux faux y declenche une anomalie A
        // CHAQUE DEPOT, chez chaque client.
        //
        // ⛔ ON N ECRIT DONC LE TAUX QUE S IL RETOMBE AU CENTIME. Partout
        // ailleurs on s abstient : une rubrique absente ne declenche rien,
        // un taux faux declenche a chaque fois.
        // LES CAS OU ON S ABSTIENT, ET POURQUOI :
        //   · un code alimente par PLUSIEURS lignes de bulletin (le 076
        //     agrege la part salariale et la part patronale de la vieillesse,
        //     a deux taux differents) : le quotient serait un taux moyen qui
        //     n existe dans aucun texte ;
        //   · les codes 018 et 106, qui portent la reduction generale — le
        //     guide les exclut expressement ;
        //   · un montant nul, ou une assiette nulle : le quotient n aurait
        //     pas de sens.
        // ═══════════════════════════════════════════════════════════════
        const baseCode = Number(grp.codes[cd].base || 0);
        const montantCode = Number(grp.codes[cd].montant || 0);
        const uneSeuleLigne = Number(grp.codes[cd].nb || 0) === 1;
        const estReduction = cd === "018" || cd === "106";

        if (uneSeuleLigne && !estReduction && baseCode > 0 && montantCode !== 0) {
          const tauxCalcule = Math.round((montantCode / baseCode) * 10000) / 100;
          // 🚨 LE CONTROLE : on refait le calcul DANS L AUTRE SENS et on
          // n ecrit que si l ecart est inferieur au centime.
          const verif = Math.round(baseCode * tauxCalcule) / 100;
          if (Math.abs(verif - montantCode) <= 0.01 && tauxCalcule > 0) {
            ecrire("S21.G00.81.007", montantDsn(tauxCalcule));
          }
        }

        // 🆕 20/09 — LA COMMUNE DU VERSEMENT MOBILITE, AU NOMINATIF.
        // ⚠️ ELLE NE S ECRIT QUE LA : le guide montre « Code INSEE commune
        // (S21.G00.81.005) : non renseigne » dans l attendu de toutes les
        // autres cotisations.
        if (grp.codes[cd].insee) {
          ecrire("S21.G00.81.005", grp.codes[cd].insee);

          // 🆕 LE CUMUL PAR COMMUNE, QUI NOURRIT LE CTP 900 DU BORDEREAU.
          // 🚨 UNE LIGNE PAR COMMUNE, jamais un total : deux etablissements
          // dans deux zones se declarent separement, meme a taux egal.
          const ins = String(grp.codes[cd].insee);
          if (!vmParCommune[ins]) {
            vmParCommune[ins] = { assiette: 0, montant: 0, taux: 0 };
          }
          vmParCommune[ins].assiette += Number(grp.codes[cd].base || 0);
          vmParCommune[ins].montant += Number(grp.codes[cd].montant || 0);
          // ⚠️ LE TAUX EST CELUI DE LA COMMUNE : il est le meme pour tous
          // les salaries qui y travaillent. On garde le dernier vu, et on
          // signale si deux taux differents apparaissent pour une meme
          // commune — ce serait le signe d un bulletin calcule avant une
          // mise a jour de la table.
          const t = Number(grp.codes[cd].tauxVm || 0);
          if (vmParCommune[ins].taux > 0 && t > 0
            && Math.abs(vmParCommune[ins].taux - t) > 0.0001) {
            anomalies.push("Deux taux de versement mobilité différents pour la "
              + "commune " + ins + " (" + vmParCommune[ins].taux + " % et " + t
              + " %). ⛔ Un bulletin a été calculé avant une mise à jour de la "
              + "table des taux : le recalculer avant de déposer.");
          }
          if (t > 0) vmParCommune[ins].taux = t;
        } else if (grp.codes[cd].tauxVm !== undefined) {
          // 🚨 UN VERSEMENT MOBILITE SANS COMMUNE EST REJETE PAR L URSSAF.
          anomalies.push(qui + " : versement mobilité déclaré sans code INSEE "
            + "de commune. ⛔ LA LIGNE DU CTP 900 SERA REJETÉE et une "
            + "régularisation sera attendue le mois suivant. Recalculer le "
            + "bulletin pour que la commune du lieu de travail y figure.");
        }

        // 🆕 CE QUI EST DU A L URSSAF : tout sauf la retraite complementaire,
        // qui releve de l Agirc-Arrco et se verse ailleurs.
        // ⚠️ LE CODE 142 EST UNE PART DEJA COMPTEE DANS LE 131 : l ajouter
        // compterait deux fois la meme cotisation.
        if (cd !== "131" && cd !== "142" && cd !== "106") {
          duUrssaf += Number(grp.codes[cd].montant || 0);
        }

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

    totalBrut += Number(b.brut || 0);
    totalCotisations += Number(b.total_salarial || 0) + Number(b.total_patronal || 0);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 LE BORDEREAU URSSAF — BLOCS 20, 22 ET 23
  //
  // Il s insere a la place reservee plus haut, avant le premier individu.
  // ✅ Cette place a ete confirmee par dsn-val le 19/09 : zero anomalie sur
  // un fichier de 542 lignes.
  //
  // ⛔ ON NE L ECRIT PAS DU TOUT PLUTOT QUE DE L ECRIRE FAUX. Sans
  // l organisme de rattachement, on ne sait pas a qui la declaration
  // s adresse : un bordereau adresse au mauvais organisme est pire qu un
  // bordereau absent, parce qu il a l air juste.
  // ═══════════════════════════════════════════════════════════════════
  // ⚠️ LES BORNES DU MOIS, recalculees ici : celles de la boucle des
  // salaries vivent dans son bloc et ne sont plus visibles a ce niveau.
  const debutMois = dateDsn(periode);
  const finMois = finDeMois(periode);

  const B: string[] = [];
  const ecrireB = function (ref: string, valeur: any) {
    const v = latin(valeur);
    if (v === "") return;
    B.push(ref + ",'" + v + "'");
  };

  {
    const codification = q(societe.urssaf_codification);
    let siretUrssaf = "";

    if (codification) {
      const { data: org } = await supabase
        .from("urssaf_organismes")
        .select("siret, denomination")
        .eq("codification", codification)
        .maybeSingle();
      // 🚨 L IDENTIFIANT DE L ORGANISME EST LE SIRET DE L URSSAF, pas sa
      // codification. Guide URSSAF, rubrique 81.002 : « Siret de l Urssaf ».
      // La codification (U827) sert a le retrouver dans la table.
      if (org && q(org.siret)) siretUrssaf = q(org.siret).replace(/\D/g, "");
      else {
        anomalies.push("La codification URSSAF « " + codification + " » de la "
          + "société est introuvable dans urssaf_organismes. ⛔ LE BORDEREAU "
          + "N'EST PAS DÉCLARÉ. Importer la table des Urssaf, ou corriger "
          + "compta_societes.urssaf_codification.");
      }
    } else {
      anomalies.push("L'URSSAF de rattachement de la société n'est pas renseignée "
        + "(compta_societes.urssaf_codification, par exemple « U827 » pour "
        + "Rhône-Alpes). ⛔ LE BORDEREAU N'EST PAS DÉCLARÉ : sans lui, la DSN "
        + "décrit les salariés mais ne déclare aucune cotisation à l'URSSAF.");
    }

    if (siretUrssaf) {
      const duArrondi = Math.round(duUrssaf);

      // ══ S21.G00.20 — LE VERSEMENT A L ORGANISME ══
      //
      // ⚠️ POUR L URSSAF, LE SEUL MODE DE PAIEMENT ADMIS EST « 05 -
      // prelevement SEPA ».
      // ⛔ ON N INVENTE PAS D IBAN : sans lui, le bloc du versement n est pas
      // ecrit et l anomalie le dit. Un IBAN faux ferait echouer le
      // prelevement, et l employeur serait en retard de paiement sans le
      // savoir.
      const iban = q(societe.iban_prelevement).replace(/\s/g, "").toUpperCase();
      const bic = q(societe.bic_prelevement).replace(/\s/g, "").toUpperCase();

      if (iban && bic) {
        ecrireB("S21.G00.20.001", siretUrssaf);
        if (q(societe.urssaf_entite_affectation)) {
          ecrireB("S21.G00.20.002", societe.urssaf_entite_affectation);
        }
        ecrireB("S21.G00.20.003", bic);
        ecrireB("S21.G00.20.004", iban);
        ecrireB("S21.G00.20.005", euroDsn(duArrondi));
        ecrireB("S21.G00.20.006", debutMois);
        ecrireB("S21.G00.20.007", finMois);
        ecrireB("S21.G00.20.010", "05");
      } else {
        anomalies.push("Coordonnées bancaires absentes : le bloc « Versement "
          + "organisme de protection sociale » (S21.G00.20) n'est pas déclaré. "
          + "Renseigner compta_societes.iban_prelevement et bic_prelevement — "
          + "c'est le compte d'où l'URSSAF prélèvera " + euroDsn(duArrondi) + " EUR.");
      }

      // ══ S21.G00.22 — LE BORDEREAU DE COTISATION DUE ══
      //
      // ⚠️ UN BORDEREAU NE PORTE QU UN SEUL MOIS CIVIL.
      ecrireB("S21.G00.22.001", siretUrssaf);
      if (q(societe.urssaf_entite_affectation)) {
        ecrireB("S21.G00.22.002", societe.urssaf_entite_affectation);
      }
      ecrireB("S21.G00.22.003", debutMois);
      ecrireB("S21.G00.22.004", finMois);
      ecrireB("S21.G00.22.005", euroDsn(duArrondi));

      // ══ S21.G00.23 — LES COTISATIONS AGREGEES, UNE LIGNE PAR CTP ══
      //
      // 🚨 LE TAUX AT VIENT DU MEME ENDROIT QUE LE BULLETIN : paie_taux_societe.
      // Le relire ailleurs ferait diverger la declaration et la paie.
      let tauxAtSociete = 0;
      {
        const { data: tx } = await supabase
          .from("paie_taux_societe")
          .select("taux")
          .eq("societe_id", societeId)
          .eq("code", "AT_MP")
          .lte("date_effet", periode)
          .or("date_fin.is.null,date_fin.gte." + periode)
          .order("date_effet", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (tx) tauxAtSociete = Number(tx.taux || 0);
      }

      // ⚠️ LE FNAL DEPEND DE L EFFECTIF : sous cinquante salaries il est
      // plafonne (CTP 332), au-dela il porte sur la totalite (CTP 236).
      const effectif = Number(societe.effectif || 0);
      const socle = CTP_SOCLE.map(function (r) {
        if (r.ctp === "332" && effectif >= 50) {
          return { ctp: CTP_FNAL_50PLUS, qualifiant: "920", assiette: "03", tauxAt: false };
        }
        return r;
      });

      for (const regle of socle) {
        const assiette = assiettesCumulees[regle.assiette] || 0;
        // ⚠️ UNE ASSIETTE NULLE NE SE DECLARE PAS : aucun salarie n y cotise.
        if (assiette <= 0) continue;

        // 🚨 ON CONTROLE QUE LE CTP EXISTE ET N EST PAS CLOTURE. Un CTP clos
        // ne se declare plus, et la table porte sa date de fin.
        const { data: ctp } = await supabase
          .from("urssaf_ctp")
          .select("code, libelle")
          .eq("code", regle.ctp)
          .lte("date_effet", periode)
          .or("date_fin.is.null,date_fin.gte." + periode)
          .order("date_effet", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!ctp) {
          anomalies.push("Le code type de personnel " + regle.ctp + " n'existe pas "
            + "dans urssaf_ctp à la période " + periode + ", ou il est clôturé. "
            + "⛔ CETTE LIGNE DU BORDEREAU N'EST PAS DÉCLARÉE.");
          continue;
        }

        ecrireB("S21.G00.23.001", regle.ctp);
        ecrireB("S21.G00.23.002", regle.qualifiant);
        // 🚨 SEULS TROIS TAUX SE DECLARENT : accident du travail, versement
        // mobilite, bonus-malus. Aucun autre — guide URSSAF §1.3.
        if (regle.tauxAt && tauxAtSociete > 0) {
          ecrireB("S21.G00.23.003", montantDsn(tauxAtSociete));
        }
        ecrireB("S21.G00.23.004", euroDsn(assiette));
        // ⛔ PAS DE MONTANT DE COTISATION sur les CTP du socle : la fiche 1
        // du guide ne renseigne que l assiette.
      }

      // ═══════════════════════════════════════════════════════════════
      // 🆕 20/09 — LE VERSEMENT MOBILITE AU BORDEREAU : CTP 900
      //
      // 🚨 UNE LIGNE PAR COMMUNE, ET LE CODE INSEE EST OBLIGATOIRE. Le
      // guide Urssaf : la rubrique 23.006 « est a renseigner de facon
      // obligatoire des lors que l entreprise est assujettie au versement
      // mobilite, et pour chaque commune au titre de laquelle le versement
      // mobilite est du, y compris en cas de similarite de taux ». Une
      // ligne rejetee faute de code commune oblige a regulariser le mois
      // suivant.
      // 🚨 LE TAUX SE DECLARE : le versement mobilite est l une des trois
      // seules cotisations dont la rubrique 23.003 est attendue, avec
      // l accident du travail et le bonus-malus.
      // ⚠️ L ASSIETTE EST CELLE DES BLOCS 78 DE TYPE 57, ventilee par
      // commune : c est l equivalence agrege / nominatif.
      // ⚠️ LE VMRR (CTP 820) N EST PAS TRAITE ICI : il releve d une table
      // regionale distincte, et aucune commune de l essai n y figure.
      // ═══════════════════════════════════════════════════════════════
      const communes = Object.keys(vmParCommune).sort();
      if (communes.length > 0) {
        const { data: ctp900 } = await supabase
          .from("urssaf_ctp")
          .select("code, libelle")
          .eq("code", "900")
          .lte("date_effet", periode)
          .or("date_fin.is.null,date_fin.gte." + periode)
          .order("date_effet", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!ctp900) {
          anomalies.push("Le code type de personnel 900 (versement mobilité) "
            + "n'existe pas dans urssaf_ctp à la période " + periode + ", ou il "
            + "est clôturé. ⛔ LE VERSEMENT MOBILITÉ N'EST PAS DÉCLARÉ AU "
            + "BORDEREAU alors qu'il figure sur les bulletins.");
        } else {
          for (const ins of communes) {
            const v = vmParCommune[ins];
            if (v.assiette <= 0) continue;

            ecrireB("S21.G00.23.001", "900");
            // Le versement mobilite porte sur la totalite : qualifiant 920.
            ecrireB("S21.G00.23.002", "920");
            if (v.taux > 0) ecrireB("S21.G00.23.003", montantDsn(v.taux));
            ecrireB("S21.G00.23.004", euroDsn(v.assiette));
            ecrireB("S21.G00.23.006", ins);
          }
        }
      }

      // ══ LA REDUCTION GENERALE ══
      //
      // 🚨 LE MONTANT EST POSITIF ICI et negatif au nominatif : « au niveau
      // agrege, le CTP porte le signe ».
      // 🚨 IL EGALE LA SOMME DES CODES 018, ET RIEN D AUTRE : le code 106,
      // part Agirc-Arrco, ne regarde pas l URSSAF.
      if (rgduUrssaf > 0) {
        // ⚠️ LE CHOIX DU CTP DEPEND DE QUI RECOUVRE LE CHOMAGE. L URSSAF le
        // recouvre pour le cas general — c est notre situation des lors que
        // la cotisation chomage figure au bulletin.
        const chomageUrssaf = (assiettesCumulees["07"] || 0) > 0;
        const ctpRgdu = chomageUrssaf ? CTP_RGDU_AVEC_CHOMAGE : CTP_RGDU_SANS_CHOMAGE;

        ecrireB("S21.G00.23.001", ctpRgdu);
        ecrireB("S21.G00.23.002", "921");
        ecrireB("S21.G00.23.005", euroDsn(rgduUrssaf));
      }

      // 🆕 L INSERTION A LA PLACE RESERVEE, avant le premier individu.
      if (B.length > 0) {
        L.splice(posBordereau, 0, ...B);
      }
    }
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
  // 🚨 L ETABLISSEMENT EMPLOYEUR EST LUI-MEME UN LIEU DE TRAVAIL : tous les
  // salaries qui ne sont pas en mission y travaillent, et leur rubrique
  // 40.019 le designe. Il doit donc figurer en bloc 85 comme les autres.
  const lieuxVus: string[] = [];

  if (bulletins.some(function (b0: any) {
    const c0: any = (b0 as any).paie_contrats;
    return !c0 || q(c0.type_contrat) !== "mission" || !q(c0.eu_siret);
  })) {
    lieuxVus.push(siret);
    ecrire("S21.G00.85.001", siret);
    ecrire("S21.G00.85.002", codeApe);
    ecrire("S21.G00.85.003", societe.adresse);
    ecrire("S21.G00.85.004", q(societe.code_postal));
    ecrire("S21.G00.85.005", societe.ville);
    ecrire("S21.G00.85.010", "01");
    // ⚠️ LE CODE INSEE DE LA COMMUNE DU SIEGE : sans lui le bloc est rejete.
    if (q(societe.code_insee)) ecrire("S21.G00.85.011", societe.code_insee);
    else {
      anomalies.push("Code INSEE de la commune absent pour l'établissement "
        + "employeur (S21.G00.85.011). ⛔ LE BLOC LIEU DE TRAVAIL SERA "
        + "REJETÉ. Renseigner compta_societes.code_insee.");
    }
  }

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
    // 🆕 Normalise comme celui de l employeur : « 52.10B » devient « 5210B ».
    ecrire("S21.G00.85.002", apeDsn(c0.eu_code_ape));
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
  // 🆕 L EXTENSION EST « .txt », ET C EST UN CHOIX D USAGE, PAS DE NORME.
  //
  // La norme ne dit rien de l extension : le fichier est du texte, et
  // net-entreprises le prend tel quel. Deux usages s opposent donc :
  //   · « .dsn » — la fenetre d ouverture de dsn-val filtre sur ce nom, le
  //     fichier apparait sans rien regler ;
  //   · « .txt » — l iPad sait le telecharger.
  // ⚠️ ESSAYE EN « .dsn » LE 17/09 : SAFARI NE LE TELECHARGE PAS. iOS ne
  // connait pas cette extension et le bouton reste sans effet. Le fichier
  // devenait alors inaccessible depuis le seul appareil qui le genere.
  // ✅ EN « .txt », IL SE TELECHARGE. Dans dsn-val, il suffit de passer le
  // filtre de la fenetre d ouverture sur « Tous les fichiers » — un reglage,
  // une fois, contre un fichier hors de portee a chaque generation.
  //
  // 🆕 18/09 — LE NOM DIT LE MODE. Un fichier d essai et un fichier reel se
  // ressemblent trait pour trait ; seul le « 01 » ou « 02 » de la rubrique
  // S10.G00.00.005 les separe, et personne ne le lit. Le nom porte donc la
  // mention « ESSAI » tant que la societe n est pas en mode reel — ainsi on
  // ne depose pas un essai en croyant deposer la vraie declaration.
  const mentionMode = modeReel ? "" : "-ESSAI";
  const nomFichier = "DSN-" + siret + "-" + moisDsn(periode)
    + "-" + String(ordre).padStart(2, "0") + mentionMode + ".txt";
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

  // 🆕 CE QUI RESTE AVANT UN DEPOT REEL. La liste s adapte au mode : dire
  // « passer en 02 » a quelqu un qui y est deja est du bruit, et le bruit
  // fait ignorer le reste.
  const avantDepot: string[] = [];

  avantDepot.push("⛔ PASSER LE FICHIER DANS dsn-val (outil officiel) : aucune "
    + "DSN ne se dépose sans ce contrôle. Il se télécharge sur "
    + "net-entreprises.fr et tourne sur un ORDINATEUR, pas dans le navigateur.");

  if (modeReel) {
    avantDepot.push("🚨 CE FICHIER EST EN MODE RÉEL (S10.G00.00.005 = 02) : "
      + "une fois déposé, il déclare pour de vrai. Le mode vient de "
      + "compta_societes.dsn_mode.");
  } else {
    avantDepot.push("Ce fichier est en MODE ESSAI (S10.G00.00.005 = 01) : il "
      + "peut être déposé autant de fois que voulu, aucune donnée n'est "
      + "conservée par les organismes et RIEN N'EST DÉCLARÉ. Passer "
      + "compta_societes.dsn_mode à « reel » pour un vrai dépôt.");
  }

  if (regimeAgricole) {
    avantDepot.push("Le point de dépôt est la MSA (S10.G00.00.007 = 02), "
      + "régime agricole.");
  }

  if (nbTauxPersonnalises === 0) {
    avantDepot.push("Aucun taux de prélèvement à la source personnalisé : tous "
      + "les salariés sont au taux neutre. Les vrais taux arrivent dans le "
      + "compte rendu métier après le premier dépôt, à reporter dans "
      + "paie_salaries.taux_pas avec leur date d'effet.");
  } else {
    avantDepot.push(nbTauxPersonnalises + " salarié(s) au taux personnalisé, "
      + (bulletins.length - nbTauxPersonnalises) + " au taux neutre.");
  }

  avantDepot.push("La clé de ventilation de la réduction générale entre les "
    + "codes 018 et 106 est proportionnelle aux cotisations éligibles — à "
    + "recouper avec la règle URSSAF.");
  avantDepot.push("Le code PCS-ESE de chaque contrat vient de la nomenclature "
    + "INSEE : un code faux ne fait pas rejeter la déclaration, il fausse le "
    + "rattachement conventionnel.");
  avantDepot.push("Les primes et indemnités (fin de contrat, fin de mission, "
    + "congés payés) ne sont pas encore déclarées en bloc S21.G00.52 : elles "
    + "restent comprises dans la rémunération de type 002.");
  avantDepot.push("Le salaire rétabli (type 003) est égal au brut : exact tant "
    + "qu'aucune absence n'est traitée sur le bulletin, à reprendre avec le "
    + "maintien de salaire en maladie.");

  return NextResponse.json({
    success: true,
    declaration_id: decl ? decl.id : null,
    fichier: nomFichier,
    periode: periode,
    type: typeDeclaration === "03" ? "annule et remplace" : "normale",
    mode: modeReel ? "RÉEL" : "essai",
    point_depot: regimeAgricole ? "MSA" : "net-entreprises",
    numero_ordre: ordre,
    nb_individus: bulletins.length,
    nb_taux_personnalises: nbTauxPersonnalises,
    nb_lignes: L.length,
    total_brut: Math.round(totalBrut * 100) / 100,
    total_cotisations: Math.round((totalCotisations - totalReductions) * 100) / 100,
    total_reductions: Math.round(totalReductions * 100) / 100,
    sha256: sha,
    url: signe ? signe.signedUrl : null,
    anomalies: anomalies,
    avant_depot: avantDepot,
    message: "Fichier DSN généré en BROUILLON, mode "
      + (modeReel ? "RÉEL" : "essai") + ". "
      + (anomalies.length > 0
        ? "⚠️ " + anomalies.length + " anomalie(s) à corriger avant tout dépôt."
        : "Aucune anomalie détectée à la génération."),
  });
}
