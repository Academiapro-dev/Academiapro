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

// 🆕 05/10 — LA LISTE COMPLETE, LUE AU CAHIER TECHNIQUE 2026.1 (page 245) :
//     01  Taux transmis par la DGFIP
//     13  Bareme mensuel metropole
//     17  Bareme mathematique sur base mensuelle metropole
//     23  Bareme mensuel Guadeloupe, Reunion et Martinique
//     27  Bareme mathematique, memes territoires
//     33  Bareme mensuel Guyane et Mayotte
//     37  Bareme mathematique, memes territoires
//     99  Indu relatif a un exercice anterieur — pas de taux
// ⚠️ LE MOTEUR DE PAIE N APPLIQUE QUE LA GRILLE DE METROPOLE (les grilles
// d outre-mer ne sont pas chargees) : c est donc « 13 » qui decrit ce qui
// a ete preleve, et le cas d outre-mer reste signale.
const TYPE_TAUX_PERSONNALISE = "01";

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

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 22/09 — LES CTP DE L APPRENTI, LUS DANS LE TABLEUR DIDA DE L URSSAF
//
// Source : « Tableau equivalence donnees individuelles et agregees »,
// open.urssaf.fr, jeu de donnees `equivalence-dida`, 1 457 enregistrements.
// C est LA table qui dit, CTP par CTP, quelles bases assujetties et quels
// codes de cotisation individuelle l URSSAF attend en face.
//
// 🚨 CE QUE LA FICHE DU CTP 726 DIT MOT POUR MOT : « Ils permettent de
// declarer L ASSIETTE INFERIEURE AU SEUIL D EXONERATION. […] L utilisation
// des CTP 726 ou 727 doit OBLIGATOIREMENT donner lieu a celle du CTP 423
// (Chomage). »
//
// ⚠️ LE BORDEREAU SE COUPE EN DEUX, PAS LE NOMINATIF. Les deux CTP se
// rattachent a la MEME base assujettie : leurs assiettes s additionnent
// pour retrouver le brut du salarie (933,51 + 205,37 = 1 138,88). C est
// pourquoi le bloc 78 garde le brut entier et n a pas a etre touche — le
// principe d equivalence de l URSSAF reste satisfait.
//   sous le seuil   CTP 726 (920 sur la base 03, 921 sur la base 02)
//                   CTP 423 pour le chomage (base 07)
//   au-dela         CTP 100 et CTP 772, les CTP ordinaires
// ⛔ 727 ET 429 SONT LES EQUIVALENTS ALSACE-MOSELLE ET SECTEUR PUBLIC :
// hors de notre perimetre tant qu aucun client n en releve.
const CTP_APPRENTI_SOUS_SEUIL = "726";
const CTP_APPRENTI_CHOMAGE = "423";

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

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 05/10 (soir) — LES DOUZE POINTS QUI RESTAIENT, ECRITS D APRES DEUX
// FICHIERS D ESSAI PASSES DANS dsn-val 2026.1.0.17 SANS AUCUNE ANOMALIE
//   · mensuelle de 1 831 lignes, onze salaries, un cas par salarie ;
//   · signalement de fin de contrat de 189 lignes (route /api/dsn/evenement).
// Les deux fichiers sont gardes dans les documents du projet : c est a eux
// que se compare ce que ce generateur produit.
//
// CE QUE dsn-val A APPRIS, cas par cas :
//   MANDAT SOCIAL    nature « 80 » · unite « 99 » · quotites 0.00 · modalite
//                    « 99 » · convention « 9999 » · statut d emploi « 99 » ·
//                    remuneration 002 a 0.00, sans bloc activite · ni base
//                    chomage ni reduction generale · au bordereau, CTP 863.
//   STAGIAIRE        nature « 29 » · retraite complementaire « 99 » et bloc
//                    71 « 90000 » · date de fin obligatoire · statut d emploi
//                    « 99 » · remuneration 002 a 0.00 · seule la fraction qui
//                    cotise est declaree.
//   CONTRAT PRO      un CDD ou un CDI, dispositif « 61 ».
//   APPRENTI PUBLIC  dispositif « 81 » · retraite complementaire « 98 » et
//                    bloc 71 « IRCANTEC » · code 003 · base « 28 » et codes
//                    060 / 061 · au bordereau, CTP 803 et 518.
//   HEURES SUP.      remuneration « 017 » avec le nombre d heures · code 114
//                    (reduction salariale) et 021 (deduction patronale), en
//                    negatif · bloc 58 de type « 01 » · CTP 003 et 004.
//   AVANTAGES        bloc 54 : 02 repas, 03 logement, 04 vehicule.
//   MOIS INCOMPLET   les dates des blocs 51 et 78 sont celles de la periode
//                    d emploi · bloc activite d unite « 40 » (jours
//                    calendaires) sous la remuneration 001.
//   FIN D UN CDI     bloc 62 · bloc 52 : 001 rupture conventionnelle, 007
//                    licenciement, 020 conges non pris · code 093 et CTP 719.
//   CHANGEMENT       bloc 41 : un bloc par caracteristique changee, avec
//                    l ANCIENNE valeur ; la profondeur de recalcul est le
//                    1er du mois (ou le debut du contrat).
//   FORFAIT SOCIAL   base « 13 », code 071, CTP 479.
// ═══════════════════════════════════════════════════════════════════════

// ⚠️ LA TABLE dsn_codes RESTE LA PREMIERE SOURCE. Ces valeurs ne servent que
// si elle ne porte pas la correspondance : elles sont celles des fichiers
// valides, lues au cahier technique 2026.1.
const NATURE_CONTRAT_REPLI: Record<string, string> = {
  mandat_social: "80",   // 80 - Mandat social
  stage: "29",           // 29 - Convention de stage (hors formation professionnelle)
};
const COTISATION_REPLI: Record<string, { code: string; base: string }> = {
  REDUCTION_HS: { code: "114", base: "03" },
  CONTRIBUTION_PATRONALE_RC: { code: "093", base: "03" },
  FORFAIT_SOCIAL_PREVOYANCE: { code: "071", base: "13" },
  IRCANTEC_TA: { code: "060", base: "28" },
  IRCANTEC_TB: { code: "061", base: "28" },
  APEC: { code: "132", base: "02" },
  // 🆕 06/10 — formation professionnelle, CPF-CDD, taxe d apprentissage,
  // dialogue social : codes lus au cahier technique 2026.1 (rubrique
  // S21.G00.81.001) et au tableau d equivalence de l URSSAF, base « 03 ».
  FORMATION_PRO_MOINS11: { code: "128", base: "03" },
  FORMATION_PRO_11PLUS: { code: "128", base: "03" },
  CPF_CDD: { code: "129", base: "03" },
  TAXE_APPRENTISSAGE: { code: "130", base: "03" },
  TAXE_APPRENTISSAGE_AM: { code: "130", base: "03" },
  DIALOGUE_SOCIAL: { code: "100", base: "03" },
};

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 06/10 — LES CONTRIBUTIONS DE FORMATION AU BORDEREAU
//
// ⛔ ELLES N ETAIENT PAS DECLAREES (ni calculees : voir le moteur de paie).
// Tableau d equivalence de l URSSAF, lu le 06/10 — toutes de format « E »
// (l ASSIETTE se renseigne, sans taux), qualifiant 920, base « 03 » :
//   959  formation professionnelle, moins de 11 salaries      code 128
//   971  formation professionnelle, 11 salaries et plus       code 128
//   987  contribution CPF-CDD                                 code 129
//   992  taxe d apprentissage, part principale                code 130
//   993  taxe d apprentissage, Alsace-Moselle                 code 130
//   027  contribution au dialogue social                      code 100
// 🚨 LE CTP SUIT LA LIGNE DU BULLETIN, pas un nouveau calcul : c est le
// moteur de paie qui a choisi le taux d apres l effectif et le lieu.
// 🚨 L ASSIETTE EST LA SOMME DES ASSIETTES DES CODES ECRITS, PAS LE BRUT
// DE TOUS : un apprenti d une petite entreprise, un mandataire ou un
// stagiaire n y entrent pas toujours.
// ⚠️ LE SOLDE ANNUEL DE LA TAXE D APPRENTISSAGE (CTP 995, DSN d avril, bloc
// 82) N EST PAS ECRIT ICI.
// ═══════════════════════════════════════════════════════════════════════
const CTP_FORMATION: Record<string, { ctp: string; quoi: string }> = {
  FORMATION_PRO_MOINS11: { ctp: "959", quoi: "formation professionnelle, moins de 11 salariés" },
  FORMATION_PRO_11PLUS: { ctp: "971", quoi: "formation professionnelle, 11 salariés et plus" },
  CPF_CDD: { ctp: "987", quoi: "contribution CPF-CDD" },
  TAXE_APPRENTISSAGE: { ctp: "992", quoi: "taxe d'apprentissage, part principale" },
  TAXE_APPRENTISSAGE_AM: { ctp: "993", quoi: "taxe d'apprentissage, Alsace-Moselle" },
  DIALOGUE_SOCIAL: { ctp: "027", quoi: "contribution au dialogue social" },
};
// L ordre d ecriture au bordereau.
const ORDRE_CTP_FORMATION = ["959", "971", "987", "992", "993", "027"];

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 06/10 — LES CONTRIBUTIONS CONVENTIONNELLES RECOUVREES PAR L URSSAF
//
// Depuis la periode d emploi de janvier 2026, les branches qui ont designe
// l URSSAF comme collecteur (hotels, cafes, restaurants entre autres)
// declarent chaque mois leurs contributions conventionnelles. Tableau
// d equivalence de l URSSAF (fichier du projet), lu le 06/10 :
//   844  contribution conventionnelle au dialogue social      code 140
//   845  contribution conventionnelle a la formation          code 141
// format « V » : le TAUX se declare (S21.G00.23.003) avec l assiette,
// qualifiant 920, base « 03 ». Les codes 140 et 141 figurent au cahier
// technique 2026.1 (rubrique S21.G00.81.001).
// 🚨 LE BAREME LES NOMME PAR UN PREFIXE : toute ligne de `paie_cotisations`
// dont le code commence par CONV_DIALOGUE ou CONV_FORMATION suit ce chemin,
// quelle que soit la convention.
// ═══════════════════════════════════════════════════════════════════════
function regleConventionnelle(interne: string): { code: string; base: string; ctp: string; quoi: string } | null {
  const k = String(interne || "").toUpperCase();
  if (k.indexOf("CONV_DIALOGUE") === 0) {
    return { code: "140", base: "03", ctp: "844", quoi: "contribution conventionnelle au dialogue social" };
  }
  if (k.indexOf("CONV_FORMATION") === 0) {
    return { code: "141", base: "03", ctp: "845", quoi: "contribution conventionnelle à la formation professionnelle" };
  }
  return null;
}
// La deduction forfaitaire patronale sur les heures supplementaires n est pas
// une ligne du bulletin : le moteur la range dans `detail.deduction_hs`.
const CODE_DEDUCTION_HS = "021";
// 🚨 CES CODES NE FONT PAS L ASSIETTE DE LEUR BASE : leur « assiette » est la
// remuneration des heures supplementaires ou la part exoneree d une indemnite
// de rupture — qui peut depasser le brut du mois.
const CODES_HORS_ASSIETTE = ["114", "021", "093"];
// Ni taux ni rapprochement assiette x taux : reductions et exonerations.
const CODES_SANS_TAUX = ["018", "106", "001", "002", "003", "114", "021"];
// Ce qui n est PAS du a l URSSAF : Agirc-Arrco (131, 142, 106, 132) et
// Ircantec (060, 061).
const CODES_HORS_URSSAF = ["131", "142", "106", "132", "060", "061"];
// L exoneration de l apprenti : loi de 1979, de 1987, de 1992 (secteur public).
const CODES_EXONERATION_APPRENTI = ["001", "002", "003"];

// LES CTP DES NOUVEAUX CAS — lus dans le tableur d equivalence de l URSSAF.
const CTP_MANDATAIRE = "863";           // l equivalent du CTP 100, il porte aussi les codes 102 et 907
const CTP_REDUCTION_HS = "003";         // reduction salariale, montant en positif
const CTP_DEDUCTION_HS = "004";         // deduction patronale, montant en positif
const CTP_RUPTURE_CONV = "719";         // contribution sur la rupture conventionnelle
const CTP_FORFAIT_SOCIAL_8 = "479";     // forfait social a 8 %
const CTP_APPRENTI_PUBLIC_SOUS = "803"; // apprenti du secteur public, part sous le seuil
const CTP_APPRENTI_PUBLIC_AU_DELA = "518";

// 🚨 LES MOTIFS DE RUPTURE QUI ADMETTENT UNE INDEMNITE DE LICENCIEMENT (types
// 007 a 010 du bloc 52) — controle CCH-24 de la rubrique S21.G00.52.001.
const MOTIFS_LICENCIEMENT = ["011", "012", "014", "015", "020", "025", "026",
  "082", "086", "087", "089", "091", "092", "093", "098", "099", "111", "112",
  "113", "114", "115", "117"];

// LES JOURS TRAVAILLES D UN CONTRAT (0 = dimanche … 6 = samedi) : la meme
// lecture que le moteur de paie, pour proratiser les heures d un mois
// incomplet dans le meme rapport que le salaire.
function joursTravailDsn(ct: any): number[] {
  const brut = q(ct && ct.jours_travailles);
  if (!brut) return [1, 2, 3, 4, 5];
  const vus: number[] = [];
  for (const morceau of brut.split(/[^0-9]+/)) {
    if (!morceau) continue;
    const n = Number(morceau);
    if (n >= 0 && n <= 6 && vus.indexOf(n) < 0) vus.push(n);
  }
  return vus.length > 0 ? vus : [1, 2, 3, 4, 5];
}
function compterJours(debut: string, fin: string, jours: number[] | null): number {
  if (!debut || !fin || fin < debut) return 0;
  let n = 0;
  const d = new Date(debut + "T00:00:00Z");
  const f = new Date(fin + "T00:00:00Z").getTime();
  while (d.getTime() <= f) {
    if (!jours || jours.indexOf(d.getUTCDay()) >= 0) n += 1;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return n;
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 05/10 — LA COMPLEMENTAIRE SANTE ET LA PREVOYANCE DANS LA DSN
//
// ⛔ JUSQU ICI ELLES N ETAIENT PAS DECLAREES : le generateur cherchait la
// ligne « MUTUELLE » dans dsn_codes comme une cotisation URSSAF, ne la
// trouvait pas et repondait « Aucun code DSN… ⛔ NON DÉCLARÉE ». La premiere
// DSN d ATELIER HORIZON SAS (01/10) sortait avec cette anomalie pour chaque
// salarie.
//
// 🚨 UNE COTISATION D ORGANISME COMPLEMENTAIRE NE SE DECLARE PAS COMME UNE
// COTISATION URSSAF. Cahier technique 2026.1, lu le 05/10 :
//
//   S21.G00.15  ADHESION — un bloc par contrat collectif, sous
//               l etablissement, APRES le bloc 11 et AVANT le bloc 20
//                 15.001  reference du contrat            (1 a 30 caracteres)
//                 15.002  code de l organisme             (Pnnnn institution
//                         de prevoyance · 9 chiffres mutuelle · Axxxxx
//                         societe d assurance · 9 caracteres dont une lettre
//                         pour un organisme isole) — CRE-11 : valeur
//                         controlee dans les tables PREV, MUT, ASSU, OCI
//                 15.003  code delegataire — SEULEMENT sur instruction de
//                         l organisme
//                 15.004  personnel couvert : 01 oui, 02 non
//                 15.005  identifiant technique de l adhesion (1, 2, 3…)
//               CCH-13 : une adhesion « 01 » doit etre referencee par au
//               moins une affiliation ; CCH-14 : une adhesion « 02 » par
//               aucune.
//   S21.G00.70  AFFILIATION — sous le contrat, APRES le bloc 62 et AVANT le
//               bloc 71
//                 70.004  code option      } seulement a la demande de
//                 70.005  code population  } l organisme
//                 70.012  identifiant technique de l affiliation (unique
//                         pour le salarie)
//                 70.013  = 15.005 de son adhesion
//   S21.G00.78  BASE « 31 - Elements de cotisation Prevoyance, Sante,
//               retraite supplementaire », sous le versement
//                 78.004  TOUJOURS 0.00 (CCH-11)
//                 78.005  = 70.012 (obligatoire, et interdite ailleurs)
//                 78.002/003  dans le meme mois civil (SIG-11) et dans la
//                         periode d activite du contrat (SIG-17)
//   S21.G00.79  COMPOSANT — au moins un, de type 10 a 21, 23 ou 24 (CCH-12)
//   S21.G00.81  UNE SEULE cotisation, code « 059 » (CCH-15) ; 81.004 = part
//               salariale + part patronale (guide « cotisations OC en DSN »
//               du GIP-MDS) ; 81.002, 81.003 et 81.005 ne s ecrivent pas.
//
// ⚠️ LE TYPE DE COMPOSANT DEPEND DU MODE DE CALCUL DU CONTRAT :
//     forfait mensuel      → 20  Montant forfaitaire Prevoyance
//     % du salaire brut    → 10  Salaire brut Prevoyance
//     % de la tranche A    → 11  Tranche A Prevoyance
//     % du plafond         → 18  Base forfaitaire Prevoyance
// ⛔ LE DERNIER N EST PAS FIXE PAR LA NORME : c est la fiche de parametrage
// DSN de l organisme qui commande. Une reserve le dit a chaque generation.
//
// ⛔ CE QUI N EST PAS ECRIT, ET POURQUOI
//   · le PAIEMENT a l organisme (blocs 20 et 55) : facultatif, et il engage
//     un prelevement — il se regle hors DSN tant qu aucun client ne le
//     demande ;
//   · la date de debut d affiliation (70.014) : reservee a « certains cas
//     tres precis » listes sur net-entreprises, page non lue ;
//   · le composant « 04 - Contributions patronales de prevoyance » sous
//     l assiette CSG : aucun controle ne l exige, consigne non lue.
// ⛔ RIEN DE TOUT CECI N EST « FAIT » AVANT UN PASSAGE DANS dsn-val.
// ═══════════════════════════════════════════════════════════════════════
const BASE_PREVOYANCE = "31";
const COTISATION_PREVOYANCE = "059";
const COMPOSANT_PREVOYANCE: Record<string, string> = {
  forfait: "20",
  pct_brut: "10",
  pct_tranche_a: "11",
  pct_pmss: "18",
};

// Une ligne de bulletin est-elle une cotisation de complementaire sante ou
// de prevoyance ? Rend « sante », « prevoyance » ou « » (ni l une ni l autre).
// ⚠️ LA LIGNE NE PORTE PAS L IDENTIFIANT DE SON CONTRAT : seulement son code
// (« MUTUELLE », « PREVOYANCE ») et le drapeau `garantie_complementaire`.
function natureComplementaire(l: any): string {
  const c = q(l && l.code).toUpperCase();
  const marque = !!(l && l.garantie_complementaire === true);
  if (!marque && c.indexOf("MUTUELLE") !== 0 && c.indexOf("PREVOYANCE") !== 0) return "";
  if (c.indexOf("PREVOYANCE") === 0) return "prevoyance";
  if (c.indexOf("MUTUELLE") === 0) return "sante";
  return /pr[eé]voyance/i.test(q(l && l.libelle)) ? "prevoyance" : "sante";
}

// « Non cadre », « non_cadre », « NON-CADRE » → « noncadre ».
function categorieNormalisee(v: any): string {
  return q(v).toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
}

// La forme du code de l organisme, telle que la rubrique 15.002 la decrit.
// ⚠️ LA FORME SEULEMENT : que le code existe se verifie dans dsn-val.
function codeOrganismeValide(v: string): boolean {
  if (/^P[0-9]{4}$/.test(v)) return true;                 // institution de prevoyance
  if (/^[0-9]{9}$/.test(v)) return true;                  // mutuelle
  if (/^A[A-Z0-9]{5}$/.test(v)) return true;              // societe d assurance
  if (/^[A-Z0-9]{9}$/.test(v) && /[A-Z]/.test(v)) return true;   // organisme isole
  return false;
}

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
// 🆕 02/10 — LA MEME DATE, LISIBLE (JJ/MM/AAAA), pour les notes affichees.
function dateLisible(v: any): string {
  const d = dateDsn(v);
  return d.length === 8 ? d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4) : d;
}

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

// 🆕 06/10 — UN TAUX S ECRIT AVEC DEUX DECIMALES, OU TROIS QUAND IL EN A
// TROIS. Cahier technique, rubrique S21.G00.81.007 : deux ou trois chiffres
// apres le point. La contribution au dialogue social vaut 0,016 % : ecrite
// a deux decimales, elle deviendrait 0.02, un taux qui n existe pas.
function tauxDsn(v: any): string {
  const t = Number(v || 0);
  const centiemes = t * 100;
  return Math.abs(centiemes - Math.round(centiemes)) > 0.000001 ? t.toFixed(3) : t.toFixed(2);
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

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 05/10 — LA FIN D UN CDI : CONGES NON PRIS ET INDEMNITE DE RUPTURE
  //
  // Le moteur les range a part (`detail.iccp_cdi`, `detail.rupture`). Chaque
  // ligne dit ici combien d elle est DANS LE BRUT (`dansLeBrut`) : c est ce
  // montant-la qui sort de la remuneration 002, pas le montant declare.
  //   · conges non pris → 020, entierement dans le brut ;
  //   · rupture conventionnelle → 001, pour son montant TOTAL — seule sa
  //     part soumise a cotisations est dans le brut ;
  //   · licenciement → 007 jusqu au minimum legal calcule par le moteur, et
  //     021 (indemnite conventionnelle, en plus de l indemnite legale) pour
  //     ce qui le depasse.
  // ⚠️ `rupture.soumise_cotisations` n existe que si l indemnite a ete
  // PORTEE AU BULLETIN (elle ne l est pas sur un mandat ou un stage).
  // ═══════════════════════════════════════════════════════════════════
  for (const p of sortie) p.dansLeBrut = Number(p.montant || 0);

  const iccpCdi = detail && detail.iccp_cdi ? Number(detail.iccp_cdi.montant || 0) : 0;
  if (iccpCdi > 0 && !sortie.some(function (p: any) { return p.type === "020"; })) {
    sortie.push({ type: "020", montant: iccpCdi, dansLeBrut: iccpCdi,
      libelle: "Indemnité compensatrice de congés payés" });
  }

  const rup: any = detail && detail.rupture ? detail.rupture : null;
  if (rup && Number(rup.montant || 0) > 0 && typeof rup.soumise_cotisations === "number") {
    const total = Number(rup.montant);
    const soumise = Math.max(0, Math.min(total, Number(rup.soumise_cotisations) || 0));
    if (rup.rupture_conventionnelle === true) {
      sortie.push({ type: "001", montant: total, dansLeBrut: soumise,
        libelle: "Indemnité spécifique de rupture conventionnelle" });
    } else {
      const legal = Math.round(Math.max(0, Math.min(total, Number(rup.legal) || 0)) * 100) / 100;
      const enPlus = Math.round((total - legal) * 100) / 100;
      // La part soumise a cotisations est d abord celle qui depasse le legal.
      const soumiseEnPlus = Math.min(soumise, enPlus);
      if (legal > 0) {
        sortie.push({ type: "007", montant: legal,
          dansLeBrut: Math.round((soumise - soumiseEnPlus) * 100) / 100,
          libelle: "Indemnité légale de licenciement" });
      }
      if (enPlus > 0) {
        sortie.push({ type: "021", montant: enPlus, dansLeBrut: soumiseEnPlus,
          libelle: "Indemnité de licenciement au-delà du minimum légal" });
      }
    }
  }

  // L ordre des types, comme dans le fichier valide (001 avant 020).
  sortie.sort(function (x: any, y: any) {
    return String(x.type) < String(y.type) ? -1 : (String(x.type) > String(y.type) ? 1 : 0);
  });

  return { lignes: sortie, inconnues: inconnues };
}

// 🆕 05/10 — LES AVANTAGES EN NATURE DU MOIS, pour le bloc S21.G00.54.
// Le vehicule a son detail (`detail.vehicule`) ; les repas et le logement se
// reconnaissent a la ligne du brut que le moteur ecrit lui-meme (« Avantage
// en nature nourriture… », « … logement… »). La ligne « deduit du net », sous
// les cotisations, n est pas un second avantage : elle est ecartee.
function avantagesDsn(detail: any): { type: string; montant: number }[] {
  const cumul: Record<string, number> = {};
  const lignes: any[] = Array.isArray(detail && detail.lignes_brut) ? detail.lignes_brut : [];
  for (const l of lignes) {
    if (!l || l.hors_brut === true) continue;
    const montant = Number(l.montant || 0);
    if (!(montant > 0)) continue;
    const lib = q(l.libelle).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (lib.indexOf("avantage en nature") !== 0) continue;
    const type = lib.indexOf("nourriture") >= 0 || lib.indexOf("repas") >= 0 ? "02"
      : lib.indexOf("logement") >= 0 ? "03"
      : lib.indexOf("vehicule") >= 0 ? "04" : "";
    if (!type) continue;
    cumul[type] = (cumul[type] || 0) + montant;
  }
  return Object.keys(cumul).sort().map(function (type) {
    return { type: type, montant: Math.round(cumul[type] * 100) / 100 };
  });
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
        + "Le renseigner sur la fiche du dossier : « Mes dossiers » → « Sa fiche » → bloc « L'employeur — pour la paie et la DSN ».",
    }, { status: 400 });
  }

  // 🚨 LA CLE DU SIRET EST CONTROLEE AVANT TOUT. dsn-val la verifie, et un
  // SIRET dont la cle est fausse fait rejeter la declaration entiere —
  // deux fois plutot qu une, puisqu il figure comme emetteur ET comme
  // etablissement declarant.
  if (!cleLuhnValide(siret)) {
    return NextResponse.json({
      erreur: "le SIRET " + siret + " ne respecte pas la clé de Luhn. "
        + "⛔ LA DÉCLARATION SERAIT REJETÉE. Vérifier le numéro sur la fiche "
        + "du dossier (« Mes dossiers » → « Sa fiche » → bloc « L'employeur — pour la paie et la DSN ») — un chiffre a "
        + "probablement été mal saisi.",
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
  // 🆕 Ce qui doit se relire avant le depot, sans etre une anomalie. La liste
  // `avantDepot` n existe qu en fin de generation : on retient ici, on verse
  // la-bas.
  const notesArrets: string[] = [];
  // Dernier jour du mois declare, en ISO — sert a borner les periodes.
  const finMoisDecl = new Date(Number(periode.slice(0, 4)),
    Number(periode.slice(5, 7)), 0).toISOString().slice(0, 10);
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

        // ═══════════════════════════════════════════════════════════
        // 🆕🚨 20/09 — QUELS MOIS PORTENT UN ARRET ? LA REGLE EST LUE.
        //
        // Source : « Gestion des arrets de travail », GIP-MDS, mise a jour
        // du 17/02/2023 —
        // https://www.net-entreprises.fr/media/documentation/gestion-arret-de-travail-dsn.pdf
        //   · « Le bloc Arret de travail – S21.G00.60 doit etre vehicule
        //     sur TOUS LES MOIS DE L ABSENCE. »
        //   · la date et le motif de reprise sont portes par la mensuelle
        //     DU MOIS OU LA REPRISE A LIEU — dans tous les exemples, y
        //     compris pour une reprise a la date prevue.
        //
        // ⚠️ UN ARRET CONCERNE DONC LE MOIS s il a commence avant la fin du
        // mois ET si la reprise tombe le 1er du mois ou apres. La reprise
        // est celle qui est saisie (anticipee), sinon LE LENDEMAIN de la fin
        // prevue : tous les exemples du document font ainsi (fin le 08/10,
        // reprise le 09/10).
        // ⛔ L ANCIENNE REGLE (« clos avant le debut du mois ») AVAIT DEUX
        // TROUS : un salarie revenu par anticipation restait declare en
        // arret les mois suivants jusqu a la fin prevue ; et une reprise
        // tombant le 1er du mois n etait declaree nulle part.
        // ═══════════════════════════════════════════════════════════
        const finArret = q(ev.date_fin);
        let repriseEff = q((ev as any).reprise_date);
        if (!repriseEff && finArret) {
          const dFin = new Date(finArret + "T00:00:00Z");
          dFin.setUTCDate(dFin.getUTCDate() + 1);
          repriseEff = dFin.toISOString().slice(0, 10);
        }
        if (repriseEff && repriseEff < periode) continue;

        // 🆕🚨 20/09 — L ARRET ANNULE SE DECLARE UNE DERNIERE FOIS
        // « Il faudra dans la DSN mensuelle suivante generer un bloc Arret
        // de travail motif 99 - annulation, pour annuler l arret historise
        // en base de donnees DSN » (GIP-MDS).
        // ⛔ TANT QUE L ANNULATION N A PAS ETE DECLAREE, L ARRET RESTE DANS
        // LE SYSTEME de la CPAM, meme s il est efface de chez nous. L effacer
        // sans l annuler laisse le salarie avec un arret fantome.
        // ⚠️ UNE FOIS L ANNULATION DECLAREE, l arret ne revient plus : c est
        // le champ `annule_declare_le` qui le dit.
        if (q((ev as any).annule_le) && q((ev as any).annule_declare_le)) continue;

        (ev as any)._reprise_effective = repriseEff;
        (ev as any)._reprise_dans_le_mois = !!repriseEff && repriseEff <= finMoisIso;
        if (!arretsParContrat[cle]) arretsParContrat[cle] = [];
        arretsParContrat[cle].push(ev);
      }
    }
  }

  // ---- LE NUMERO D ORDRE ----
  // ⚠️ IL S INCREMENTE A CHAQUE DEPOT DU MEME MOIS : c est lui qui dit
  // quelle version fait foi.
  // 🆕🚨 01/10 — IL COMPTE LES DEPOTS, PAS LES GENERATIONS. Il comptait
  // chaque generation : regenerer un brouillon jamais depose donnait le
  // numero 2, donc le type « 03 — annule et remplace » (vu sur la DSN de
  // demonstration d ATELIER HORIZON SAS, le 01/10). Or on ne peut annuler
  // et remplacer qu une declaration DEJA DEPOSEE : net-entreprises n aurait
  // rien a remplacer. Meme regle que les signalements depuis le 20/09.
  // Une declaration compte comme deposee quand elle est « deposee » ou
  // « acceptee » ; un brouillon (ou un fichier seulement passe dans
  // dsn-val) est remplace par la nouvelle generation, sous le meme numero.
  const { data: precedentes } = await supabase
    .from("dsn_declarations")
    .select("numero_ordre, statut")
    .eq("societe_id", societeId)
    .eq("periode", periode)
    .eq("nature", "01")
    .order("numero_ordre", { ascending: false });

  const deposees = (precedentes || []).filter(function (x: any) {
    return x.statut === "deposee" || x.statut === "acceptee";
  });
  const ordre = deposees.length > 0
    ? Math.max.apply(null, deposees.map(function (x: any) { return Number(x.numero_ordre) || 0; })) + 1
    : 1;

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
  const typeDeclaration = deposees.length > 0 ? "03" : "01";

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
  // 🆕🚨 05/10 — LES CONTRATS DE MUTUELLE ET DE PREVOYANCE DE LA SOCIETE
  //
  // On lit ceux qui couvrent au moins un jour du mois declare. Un contrat
  // dont le code de l organisme et la reference sont renseignes devient une
  // ADHESION (bloc 15) ; les autres ne peuvent pas se declarer, et
  // l anomalie dit ou les completer.
  // 🚨 DEUX CONTRATS QUI PORTENT LE MEME ORGANISME ET LA MEME REFERENCE NE
  // FONT QU UNE ADHESION : le controle CCH-11 du bloc 15 interdit deux
  // blocs identiques sur ce couple.
  // ⚠️ LECTURE TOLERANTE : si la table n est pas lisible, la DSN se genere
  // quand meme et l anomalie le dit.
  // ═══════════════════════════════════════════════════════════════════
  const garantiesSociete: any[] = [];
  const adhesions: any[] = [];
  const adhesionDe: Record<string, any> = {};
  const garantiesIncompletes: Record<string, { quoi: string; nb: number; montant: number }> = {};
  const notesPrevoyance: string[] = [];
  let nbAffiliations = 0;
  // ⚠️ LE DERNIER JOUR DU MOIS, SANS PASSER PAR UNE DATE UTC : la borne ne
  // doit pas dependre du fuseau horaire du serveur.
  const finMoisPrev = periode.slice(0, 8) + finDeMois(periode).slice(0, 2);
  {
    const { data: gar, error: eGar } = await supabase
      .from("paie_garanties_societe")
      .select("*")
      .eq("societe_id", societeId)
      .lte("date_effet", finMoisPrev)
      .or("date_fin.is.null,date_fin.gte." + periode)
      .order("date_effet", { ascending: true });

    if (eGar) {
      anomalies.push("Les contrats de mutuelle et de prévoyance n'ont pas pu "
        + "être lus (" + eGar.message + ") : leurs cotisations NE SONT PAS "
        + "déclarées dans cette mensuelle.");
    } else {
      for (const g of (gar || [])) {
        garantiesSociete.push(g);
        const quoi = q(g.nature) === "prevoyance" ? "Prévoyance" : "Complémentaire santé";
        const codeOrg = q(g.organisme_code_dsn).replace(/\s/g, "").toUpperCase();
        const reference = latin(g.reference_contrat);
        if (!codeOrg || !reference) continue;

        if (!codeOrganismeValide(codeOrg)) {
          anomalies.push(quoi + " : le code de l'organisme « " + codeOrg
            + " » n'a pas une forme admise (S21.G00.15.002). ⛔ CONTRAT NON "
            + "DÉCLARÉ. Le corriger dans l'écran DSN : « Mutuelle et "
            + "prévoyance », bouton « pour la DSN ».");
          continue;
        }
        if (reference.length > 30) {
          anomalies.push(quoi + " : la référence du contrat dépasse 30 "
            + "caractères (S21.G00.15.001). ⛔ CONTRAT NON DÉCLARÉ.");
          continue;
        }

        const cle = codeOrg + "|" + reference;
        let adh: any = null;
        for (const a of adhesions) if (a.cle === cle) adh = a;
        if (!adh) {
          adh = {
            id: adhesions.length + 1, cle: cle, code: codeOrg, reference: reference,
            delegataire: q(g.delegataire_dsn).replace(/\s/g, "").toUpperCase(),
            couvert: false, quoi: quoi,
            nouveau: q(g.date_effet).slice(0, 10) >= periode,
          };
          adhesions.push(adh);
        }
        adhesionDe[String(g.id)] = adh;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 05/10 — LES CHANGEMENTS DE CONTRAT DU MOIS (bloc S21.G00.41)
  //
  // Quand une caracteristique d un contrat change — temps plein vers temps
  // partiel, passage cadre, nouvelle profession — la DSN du mois le dit, avec
  // l ANCIENNE valeur et la date du changement. Sans ce bloc, l organisme
  // voit un contrat dont la duree du travail change sans explication.
  // 🚨 LE CONTRAT NE GARDE PAS SON HISTOIRE : seule la valeur du jour y
  // figure. L ecran de paie (« modifier le contrat ») inscrit donc chaque
  // changement au journal, avec l ancienne valeur et sa date d effet ; c est
  // ce journal que l on relit ici.
  // ⚠️ LECTURE TOLERANTE : journal illisible, la DSN se genere quand meme et
  // le rappel le dit.
  // ═══════════════════════════════════════════════════════════════════
  const changementsParContrat: Record<string, any[]> = {};
  {
    const { data: chg, error: eChg } = await supabase
      .from("compta_audit")
      .select("reference, avant, apres, created_at")
      .eq("societe_id", societeId)
      .eq("action", "paie.changement_contrat")
      .order("created_at", { ascending: true });

    if (eChg) {
      notesArrets.push("Les changements de contrat du mois n'ont pas pu être "
        + "relus (" + eChg.message + ") : si la durée du travail, la catégorie "
        + "ou la profession d'un salarié a changé ce mois-ci, ce changement "
        + "n'est pas déclaré dans ce fichier. Régénérer.");
    } else {
      for (const ch of (chg || [])) {
        const apres: any = (ch as any).apres || {};
        const le = q(apres.a_compter_du).slice(0, 10) || q((ch as any).created_at).slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(le) || le < periode || le > finMoisPrev) continue;
        const cle = String((ch as any).reference);
        if (!changementsParContrat[cle]) changementsParContrat[cle] = [];
        changementsParContrat[cle].push({ le: le, avant: (ch as any).avant || {}, apres: apres });
      }
      for (const cle of Object.keys(changementsParContrat)) {
        changementsParContrat[cle].sort(function (a: any, b: any) {
          return a.le < b.le ? -1 : a.le > b.le ? 1 : 0;
        });
      }
    }
  }

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
      + "salarié. Le renseigner sur la fiche du dossier : « Mes dossiers » → « Sa fiche » → bloc « L'employeur — pour la paie et la DSN », « Téléphone ».");
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
        + "DÉCLARATION SERA REJETÉE. Le corriger sur la fiche du dossier "
        + "(« Mes dossiers » → « Sa fiche » → bloc « L'employeur — pour la paie et la DSN »)."
      : "Code APE absent. ⛔ Les rubriques S21.G00.06.003 (APEN) et "
        + "S21.G00.11.002 (APET) sont obligatoires : LA DÉCLARATION SERA "
        + "REJETÉE. Le renseigner sur la fiche du dossier "
        + "(« Mes dossiers » → « Sa fiche » → bloc « L'employeur — pour la paie et la DSN »).");
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
  // fichier.
  // 🆕 05/10 — LU AU CAHIER TECHNIQUE 2026.1 (page 245, S21.G00.50.007) :
  // « 01 - Taux transmis par la DGFIP ». La table reste la premiere source ;
  // la valeur du cahier technique sert si la table ne la porte pas.
  const codeTauxPersonnalise = (await code("S21.G00.50.007",
    "taux_pas_personnalise", periode)) || TYPE_TAUX_PERSONNALISE;

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
  // 🆕 22/09 — LA PART DES APPRENTIS SOUS LE SEUIL D EXONERATION, cumulee a
  // part : elle sort du CTP 100 pour aller au CTP 726, et du 772 pour aller
  // au 423. Vide tant qu aucun apprenti n est declare.
  const assiettesApprenti: Record<string, number> = {};
  // 🆕 05/10 — LES AUTRES PARTS QUI SORTENT DU CTP 100, cumulees a part :
  //   · le MANDATAIRE SOCIAL se declare au CTP 863, qui porte aussi ses
  //     complements maladie et allocations familiales (codes 907 et 102) ;
  //   · l APPRENTI DU SECTEUR PUBLIC : sa part sous le seuil au CTP 803, le
  //     reste au CTP 518 — et aucun complement, l employeur ne les doit pas.
  const assiettesMandat: Record<string, number> = {};
  const assiettesPublicSous: Record<string, number> = {};
  const assiettesPublicAuDela: Record<string, number> = {};
  // Les reductions et contributions qui ont leur propre ligne au bordereau.
  let reductionHsUrssaf = 0;      // somme des codes 114, en positif
  let deductionHsUrssaf = 0;      // somme des codes 021, en positif
  let assietteRuptureConv = 0;    // somme des assiettes du code 093
  // 🆕 06/10 — par CTP de formation (959, 971, 987, 992, 993, 027) : la somme
  // des assiettes des codes 128, 129, 130 et 100 ecrits au nominatif.
  const assiettesFormation: Record<string, number> = {};
  // 🆕 06/10 — les contributions conventionnelles (CTP 844 et 845) : la somme
  // des assiettes et le taux du bareme, qui se declare au bordereau.
  const assiettesConv: Record<string, { assiette: number; taux: number; quoi: string; tauxDivers: boolean }> = {};

  // 🆕 22/09 — CE QUI A ETE ECRIT, pour le confronter a la table DIDA en
  // fin de generation. `ctpDeclares` : les CTP portes au bordereau.
  // `codes81Ecrits` : les couples « base assujettie / code de cotisation »
  // rencontres au nominatif, tous salaries confondus.
  const ctpDeclares: Record<string, boolean> = {};
  const codes81Ecrits: Record<string, boolean> = {};
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

    // 🆕🚨 22/09 — LE SEUIL D EXONERATION VIENT DU BULLETIN, PAS D UN CALCUL
    // REFAIT ICI.
    //
    // 🚨 LE GENERATEUR NE RECALCULE JAMAIS UNE PAIE. Le moteur a deja
    // determine le seuil de cet apprenti — son age, l annee de son contrat,
    // sa quotite de travail, le SMIC du mois — et l a range dans le detail
    // du bulletin. Le refaire ici, c est ouvrir la porte a deux resultats
    // differents pour le meme salarie, et c est toujours la DSN qui aurait
    // tort. ⚠️ Nul sur tout autre contrat.
    const detailApprenti = (detail as any).apprentissage || null;
    const qui = q(s.prenom) + " " + q(s.nom);

    // 🆕 05/10 — CE QUE LE CONTRAT EST. Quatre formes ne se declarent pas
    // comme un salarie ordinaire (voir l en-tete des douze points).
    const typeCt = q(ct.type_contrat).toLowerCase();
    const estMandat = typeCt === "mandat_social";
    const estStagiaire = typeCt === "stage";
    const estContratPro = typeCt === "professionnalisation";
    const estApprentiPublic = typeCt === "apprentissage"
      && (ct as any).apprenti_public === true;

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 05/10 — LA PERIODE D EMPLOI DANS LE MOIS
    //
    // Un salarie entre le 10 n a pas ete paye du 1er au 9 : ses blocs de
    // remuneration (51) et ses bases assujetties (78) portent donc les dates
    // de sa periode d emploi, pas celles du mois — valide par dsn-val dans
    // les deux sens (entree le 10, sortie le 15).
    // ⚠️ MEME REGLE QUE LE MOTEUR DE PAIE : debut = date de debut du contrat
    // si elle tombe dans le mois ; fin = la plus proche de la date de fin et
    // de la date de rupture.
    // ═══════════════════════════════════════════════════════════════
    let debutEmploiIso = periode;
    let finEmploiIso = finMoisPrev;
    {
      const entree = q(ct.date_debut).slice(0, 10);
      if (entree > debutEmploiIso && entree <= finEmploiIso) debutEmploiIso = entree;
      for (const sortie of [q(ct.rompu_le).slice(0, 10), q(ct.date_fin).slice(0, 10)]) {
        if (sortie && sortie >= debutEmploiIso && sortie < finEmploiIso) finEmploiIso = sortie;
      }
    }
    const moisIncomplet = debutEmploiIso > periode || finEmploiIso < finMoisPrev;

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
    // 🆕🚨 05/10 — UN LIEU DE NAISSANCE ABSENT NE S OMET PLUS EN SILENCE.
    // dsn-val (S21.G00.30.007/CCH-11), premier dossier cree depuis l ecran :
    // « Vous avez renseigne la rubrique Code departement de naissance avec
    // une valeur differente de 99 sans renseigner la rubrique Lieu de
    // naissance ». La rubrique vide ne s ecrivait pas, et rien ne le disait.
    // ⚠️ TRENTE CARACTERES AU PLUS (cahier technique : X [1,30]).
    if (deptNaissance && deptNaissance !== "99") {
      const lieuNaissance = q(s.lieu_naissance).slice(0, 30).trim();
      if (lieuNaissance) ecrire("S21.G00.30.007", lieuNaissance);
      else {
        anomalies.push(qui + " : lieu de naissance absent (S21.G00.30.007). "
          + "⛔ RUBRIQUE OBLIGATOIRE pour une personne née en France — LA "
          + "DÉCLARATION SERA REJETÉE. Le renseigner sur la fiche du salarié : "
          + "écran de paie → « modifier le contrat » → « Lieu de naissance ».");
      }
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

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 22/09 — LE NIVEAU DE DIPLOME PREPARE (30.025), EXIGE DES
    // QU ON DECLARE UN APPRENTI
    //
    // 🚨 CONTROLE CCH-11, appris de dsn-val : des que la rubrique 40.008
    // porte « 64 » ou « 65 », cette rubrique-ci devient OBLIGATOIRE. Elle
    // etait absente, et c etait la seule anomalie bloquante du fichier.
    // ⚠️ ELLE VIT DANS LE BLOC INDIVIDU mais la donnee est portee par le
    // CONTRAT : c est le contrat d apprentissage qui prepare un diplome.
    // ⛔ ELLE NE SE DEDUIT DE RIEN. Ni l age, ni le poste, ni la convention
    // ne disent quel diplome l apprenti prepare au CFA : cela figure sur le
    // contrat signe avec l organisme de formation. Elle SE SAISIT, comme le
    // code risque AT.
    // ⛔ NE PAS CONFONDRE AVEC `paie_contrats.niveau`, qui est le niveau
    // CONVENTIONNEL de la grille de classification (Syntec 2.1, 2.3…) et
    // va avec le coefficient et la position. Les deux n ont rien a voir.
    //
    // L ENUMERATION, telle que dsn-val l a donnee :
    //   03  CAP, BEP
    //   04  bac, brevet de technicien, brevet professionnel
    //   05  bac+2 : licence 2, BTS, DUT
    //   06  bac+3 et bac+4 : licence 3, licence professionnelle, master 1
    //   07  bac+5 : master 2, diplome d ingenieur
    //   08  bac+8 : doctorat
    // ═══════════════════════════════════════════════════════════════
    const estApprentiInd = typeCt === "apprentissage";
    if (estApprentiInd) {
      const niveauDiplome = q((ct as any).niveau_diplome_prepare);
      if (niveauDiplome) ecrire("S21.G00.30.025", niveauDiplome);
      else {
        anomalies.push(qui + " : apprenti sans niveau de diplôme préparé "
          + "(S21.G00.30.025). ⛔ RUBRIQUE OBLIGATOIRE dès que le dispositif "
          + "« 64 » ou « 65 » est déclaré (contrôle CCH-11) — la déclaration "
          + "sera REJETÉE. Valeurs : 03 CAP-BEP · 04 bac · 05 bac+2 "
          + "(BTS, DUT) · 06 bac+3 et bac+4 · 07 bac+5 · 08 doctorat. "
          + "Elle figure sur le contrat signé avec le CFA.");
      }
    }
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

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 22/09 — L APPRENTISSAGE N EST PAS UNE NATURE DE CONTRAT
    //
    // ⛔ C EST LE PIEGE DE CE BLOC, et il vaut d etre lu en entier.
    // En DSN, la rubrique 40.007 ne connait que le CDI, le CDD, la mission
    // et quelques formes maritimes : « apprentissage » n y figure PAS.
    // Un apprenti est un CDD — ou un CDI — comme un autre, et c est la
    // rubrique 40.008 « dispositif de politique publique » qui le designe
    // comme apprenti.
    // 🚨 NOTRE `type_contrat` VAUT « apprentissage » ET ECRASE DONC
    // L INFORMATION CDD / CDI. On la retrouve sans rien saisir : un contrat
    // qui porte une date de fin est a duree determinee, sinon il est a
    // duree indeterminee. L apprentissage en CDI existe, c est pourquoi la
    // question se pose vraiment.
    // ⚠️ SANS CE BLOC, le generateur ne trouvait AUCUN code pour
    // « apprentissage » et ecrivait l anomalie « ⛔ NON DECLARE » : le
    // contrat partait sans nature, et dsn-val l aurait rejete.
    // ═══════════════════════════════════════════════════════════════
    // 🆕 05/10 — LE CONTRAT DE PROFESSIONNALISATION SUIT LA MEME REGLE : un
    // CDD ou un CDI, que le dispositif « 61 » designe. Le MANDAT SOCIAL
    // (« 80 ») et la CONVENTION DE STAGE (« 29 ») sont, eux, de vraies
    // natures de contrat.
    const estApprenti = typeCt === "apprentissage";
    const cleNature = (estApprenti || estContratPro)
      ? (ct.date_fin ? "cdd" : "cdi")
      : q(ct.type_contrat);

    const natureContrat = (await code("S21.G00.40.007", cleNature, periode))
      || NATURE_CONTRAT_REPLI[typeCt] || null;
    if (!natureContrat) {
      anomalies.push(qui + " : aucun code DSN pour le type de contrat « "
        + q(ct.type_contrat) + " » (S21.G00.40.007). ⛔ NON DÉCLARÉ.");
    }

    // 🚨 LE STATUT CONVENTIONNEL EST UNE CATEGORIE SOCIO-PROFESSIONNELLE,
    // pas « cadre / non-cadre » : 07 pour un ouvrier, 04 pour un cadre,
    // 03 pour un cadre dirigeant. Le « 03 » ecrit en dur auparavant
    // declarait donc tout le monde CADRE DIRIGEANT.
    let statutConv = q(ct.statut_conventionnel);
    // 🆕 05/10 — un dirigeant cadre est un « cadre dirigeant » (03) ; un
    // stagiaire est declare « 06 », la valeur du fichier valide.
    if (!statutConv && estMandat && q(ct.categorie) === "cadre") statutConv = "03";
    if (!statutConv && estStagiaire) statutConv = "06";
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
    // 🆕 05/10 — DEUX CAS SANS CADRE NI NON-CADRE :
    //   · le STAGIAIRE n a pas de retraite complementaire → « 99 » ;
    //   · l APPRENTI DU SECTEUR PUBLIC cotise a l Ircantec, qui ne connait
    //     pas ce statut → « 98 » (exige par dsn-val des que le bloc 71 porte
    //     « IRCANTEC »).
    let statutRc = await code("S21.G00.40.003",
      q(ct.categorie) === "cadre" ? "rc_cadre" : "rc_non_cadre", periode);
    if (estStagiaire) statutRc = "99";
    else if (estApprentiPublic) statutRc = "98";

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
    //
    // 🆕🚨 22/09 — POUR UN APPRENTI, C EST CETTE RUBRIQUE QUI LE DESIGNE,
    // et l URSSAF en fait un point de controle : son absence ou sa fausse
    // valeur est citee parmi les premiers motifs d anomalie sur les
    // contrats d apprentissage.
    //   64  entreprise artisanale ou de moins de 11 salaries (loi de 1979)
    //   65  entreprise d au moins 11 salaries (loi de 1987)
    //   81  secteur public (loi de 1992) — hors de notre perimetre
    // ⚠️ LE SEUIL SE LIT SUR L EFFECTIF DEJA EN BASE, exactement comme le
    // FNAL bascule du CTP 332 au 236 a cinquante salaries. Rien a saisir.
    // ⛔ LE CRITERE EXACT DU 64 EST « ARTISANALE **OU** DE MOINS DE 11 » :
    // une entreprise artisanale d au moins 11 salaries releve quand meme du
    // 64, et son inscription au repertoire des metiers ne figure nulle part
    // chez nous. On retient donc l effectif, et on le DIT — c est une
    // reserve, pas une certitude.
    // ⚠️ `dispositif_public` N EXISTE PAS dans paie_contrats : la lecture
    // ci-dessous rend toujours vide aujourd hui. Elle est conservee pour le
    // jour ou la colonne sera creee, et ne coute rien.
    let dispositif = q((ct as any).dispositif_public);
    // 🆕 05/10 — le secteur public (81) et le contrat de professionnalisation
    // (61) se lisent sur le contrat : rien a deduire de l effectif.
    if (!dispositif && estApprentiPublic) dispositif = "81";
    if (!dispositif && estContratPro) dispositif = "61";
    if (!dispositif && estApprenti) {
      const effectifSoc = Number(societe.effectif || 0);
      dispositif = effectifSoc >= 11 ? "65" : "64";
      // 🆕 01/10 — UN RAPPEL, PAS UNE ANOMALIE : le code est juste d apres
      // l effectif ; seule l inscription au repertoire des metiers, que nous
      // ne connaissons pas, pourrait le changer. Il se relit avant le depot
      // (« Avant tout dépôt réel ») au lieu de compter parmi les anomalies.
      notesArrets.push(qui + " : contrat d'apprentissage déclaré dans la "
        + "catégorie des entreprises " + (dispositif === "64"
          ? "de moins de 11 salariés" : "de 11 salariés et plus")
        + ", d'après l'effectif de la fiche du dossier (" + effectifSoc
        + "). À revoir seulement si l'entreprise est artisanale et compte "
        + "11 salariés ou plus : elle relève alors de la première catégorie.");
    }
    ecrire("S21.G00.40.008", dispositif || "99");

    ecrire("S21.G00.40.009", numeroContrat);
    if (ct.date_fin) ecrire("S21.G00.40.010", dateDsn(ct.date_fin));
    else if (estStagiaire) {
      // 🆕 05/10 — obligatoire sur une convention de stage (dsn-val).
      anomalies.push(qui + " : convention de stage sans date de fin. ⛔ LA "
        + "DÉCLARATION SERA REJETÉE. La renseigner : écran de paie → "
        + "« modifier le contrat » → « Fin prévue ».");
    }

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 22/09 — LE FORFAIT EN JOURS NE SE MESURE PAS EN HEURES
    //
    // 🚨 UN CADRE AU FORFAIT JOURS N A PAS D HORAIRE. Son contrat fixe un
    // NOMBRE DE JOURS travailles dans l annee — 218 au plus, articles
    // L3121-58 et suivants — et le code du travail lui retire expressement
    // les durees maximales quotidienne et hebdomadaire. Lui declarer
    // « 151,67 heures » est donc faux deux fois : l unite et la valeur.
    // ⚠️ LA RUBRIQUE 40.011 PORTE L UNITE : « 10 - heure » pour tout le
    // monde, « 20 - forfait jours » ici. Et la 40.013 porte alors le
    // NOMBRE DE JOURS DU MOIS, pas des heures.
    // ⛔ LA 40.012, duree de reference de l entreprise, reste en heures :
    // c est la reference de L ETABLISSEMENT, pas celle du salarie.
    // ═══════════════════════════════════════════════════════════════
    const forfaitJours = Number((ct as any).forfait_jours_annuel || 0) > 0;
    const joursAnnuels = forfaitJours
      ? Number((ct as any).forfait_jours_annuel) : 0;

    if (forfaitJours && joursAnnuels > 218) {
      anomalies.push(qui + " : forfait de " + joursAnnuels + " jours par an. "
        + "⚠️ LE PLAFOND LEGAL EST DE 218 JOURS (article L3121-64). Au-delà, "
        + "il faut un accord de renonciation à des jours de repos, et la "
        + "rémunération majorée d'au moins 10 %.");
    }

    // ⚠️ L UNITE DE MESURE EST UN CODE, LA QUOTITE UN NOMBRE. Le premier
    // fichier ecrivait « 35.00 » dans la rubrique de l unite.
    // ⚠️ « forfait_jour » AU SINGULIER : c est la correspondance qui existe
    // dans dsn_codes depuis l origine, verifiee. La chercher au pluriel ne
    // rendait rien et le contrat serait parti sans unite de mesure.
    // 🆕 05/10 — LE MANDATAIRE N A PAS DE DUREE DU TRAVAIL : unite « 99 -
    // salarie non concerne », les deux quotites a 0.00 et la modalite « 99 »
    // (fichier valide par dsn-val).
    const codeUniteHeure = await code("S21.G00.40.011", "heure", periode);
    const codeUniteForfait = await code("S21.G00.40.011", "forfait_jour", periode);
    const uniteQuotite = estMandat ? "99"
      : (forfaitJours ? codeUniteForfait : codeUniteHeure);
    if (uniteQuotite) ecrire("S21.G00.40.011", uniteQuotite);
    else if (forfaitJours) {
      anomalies.push(qui + " : aucun code DSN pour l'unité « forfait jours » "
        + "(S21.G00.40.011). ⛔ NON DÉCLARÉE — renseigner la correspondance "
        + "« forfait_jours » dans dsn_codes.");
    }
    // 🚨 LES DEUX QUOTITES SE MESURENT DANS LA MEME UNITE ET DEPUIS LA MEME
    // SOURCE. La reference de l entreprise vient de paie_parametres
    // (151,67 h) ; celle du contrat s en deduit au prorata de la duree
    // hebdomadaire. Calculer l une par 52/12 et l autre autrement ferait
    // diverger deux valeurs censees etre comparables — et la comparaison
    // est precisement ce que l organisme regarde pour savoir si le salarie
    // est a temps plein ou partiel.
    // 🆕 05/10 — la quotite d un contrat, pour un forfait ou une duree
    // hebdomadaire donnes : la meme regle sert a la valeur du jour (40.013)
    // et a l ANCIENNE valeur d un changement (41.007).
    const quotiteDe = function (forfaitAn: number, hebdoH: number): string {
      // 🚨 FORFAIT : LE NOMBRE DE JOURS DU MOIS, pas de l annee — on divise
      // le forfait annuel par douze.
      if (forfaitAn > 0) return montantDsn(Math.round(forfaitAn / 12 * 100) / 100);
      // ⚠️ 35 HEURES EST LA DUREE LEGALE : un contrat a 35 h est a temps
      // plein, donc sa quotite EGALE la reference. En dessous, elle est
      // proportionnelle.
      const h = hebdoH > 0 ? hebdoH : 35;
      return montantDsn(Math.round(dureeMensuelleRef * Math.min(h, 35) / 35 * 100) / 100);
    };
    const quotiteContrat = quotiteDe(joursAnnuels, ct.duree_hebdo ? Number(ct.duree_hebdo) : 35);

    if (estMandat) {
      ecrire("S21.G00.40.012", "0.00");
      ecrire("S21.G00.40.013", "0.00");
    } else if (dureeMensuelleRef > 0) {
      ecrire("S21.G00.40.012", montantDsn(dureeMensuelleRef));
      ecrire("S21.G00.40.013", quotiteContrat);
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
    // 🆕 22/09 — UN FORFAIT JOURS EST UN TEMPS PLEIN, quelle que soit la
    // duree hebdomadaire eventuellement saisie : le salarie n est pas
    // soumis a un horaire, donc jamais « a temps partiel » au sens de
    // cette rubrique.
    const tempsPlein = forfaitJours
      || !ct.duree_hebdo || Number(ct.duree_hebdo) >= 35;
    const modaliteTemps = estMandat ? "99" : (tempsPlein ? "10" : "20");
    ecrire("S21.G00.40.014", modaliteTemps);

    // ⚠️ COMPLEMENT DE BASE AU REGIME OBLIGATOIRE : 01 regime local
    // Alsace-Moselle, 99 non applicable.
    ecrire("S21.G00.40.016", q(ct.regime_alsace_moselle) || "99");

    // 🚨 L IDCC VA ICI, PAS EN 40.009.
    // 🆕 05/10 — un mandataire n est pas couvert par la convention
    // collective : « 9999 », quelle que soit celle des salaries.
    const idccContrat = (!estMandat && q(ct.idcc)) ? String(ct.idcc).padStart(4, "0") : "9999";
    ecrire("S21.G00.40.017", idccContrat);

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
      // 🆕 06/10 — le motif d un CDD se saisit desormais a l ecran, en CODE
      // (deux chiffres, liste du cahier technique) : il s ecrit tel quel.
      const codeMotif = /^\d{2}$/.test(q(ct.motif_recours)) ? q(ct.motif_recours)
        : await code("S21.G00.40.021", q(ct.motif_recours), periode);
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
    // 🆕 05/10 — « 99 - non concerne » pour un mandataire et un stagiaire.
    ecrire("S21.G00.40.026", q(ct.statut_emploi)
      || ((estMandat || estStagiaire) ? "99" : "04"));

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

        // ═══════════════════════════════════════════════════════════
        // 🆕🚨 20/09 — COTISER A L AT SANS CODE RISQUE EST INCOHERENT
        //
        // « 999ZZ » declare que l etablissement n a PAS de code risque.
        // Si le bulletin porte malgre tout une cotisation accident du
        // travail, les deux se contredisent : l URSSAF rapproche le code
        // risque du taux applique, et un taux sans code risque ne se
        // rattache a rien.
        // ⛔ LE CODE RISQUE NE S INVENTE PAS : il est notifie par la CARSAT,
        // comme le taux. On declare donc ce qu on sait — 999ZZ — et on dit
        // que la situation doit etre reglee avant le depot.
        // ═══════════════════════════════════════════════════════════
        const cotiseAt = (Array.isArray(detail && detail.lignes_cotisations)
          ? detail.lignes_cotisations : []).some(function (l: any) {
            return q(l && l.code).toUpperCase() === "AT_MP"
              && Number(l.part_patronale || 0) > 0;
          });

        if (cotiseAt) {
          anomalies.push(qui + " : le contrat déclare « 999ZZ — sans code "
            + "risque » alors que le bulletin porte une cotisation accident "
            + "du travail. ⛔ LES DEUX SE CONTREDISENT. Le code risque figure "
            + "sur la notification annuelle de la CARSAT, à côté du taux : "
            + "le saisir sur l'écran DSN, avec le taux accidents du travail "
            + "(« nouveau taux »).");
        }
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
    // 🆕🚨 05/10 — ══ S21.G00.41 — LES CHANGEMENTS DU CONTRAT ══
    //
    // 🚨 SA PLACE : juste apres le contrat, avant l arret de travail (60).
    // LES REGLES, lues au cahier technique (§ 4.4.14) et eprouvees :
    //   · UN BLOC PAR CARACTERISTIQUE CHANGEE : la quotite (41.007) et la
    //     modalite (41.008) d un passage a temps partiel font deux blocs ;
    //   · chaque bloc porte la date du changement (41.001), l ANCIENNE
    //     valeur, et la profondeur de recalcul de la paie (41.028) — le 1er
    //     jour du mois du changement, ou le debut du contrat s il est plus
    //     tardif. Declarer le 15 comme profondeur est refuse ;
    //   · la profondeur ne s ecrit que sur le PREMIER changement du mois
    //     d une meme caracteristique.
    // ⚠️ ON NE DECLARE QUE CE QUI A REELLEMENT CHANGE : l ancienne valeur
    // est comparee a la nouvelle, toutes deux traduites en codes DSN.
    // ⛔ PAS POUR UN MANDATAIRE : son contrat n a ni quotite ni convention.
    // ═══════════════════════════════════════════════════════════════
    if (!estMandat) {
      const profondeurVue: Record<string, boolean> = {};
      const debutCt = q(ct.date_debut).slice(0, 10);
      const statutDe = async function (cat: string): Promise<string> {
        return (await code("S21.G00.40.002", cat, periode)) || "";
      };
      const rcDe = async function (cat: string): Promise<string> {
        return (await code("S21.G00.40.003",
          cat === "cadre" ? "rc_cadre" : "rc_non_cadre", periode)) || "";
      };

      for (const ch of (changementsParContrat[String(ct.id)] || [])) {
        // Un « changement » date du premier jour du contrat n en est pas un.
        if (debutCt && ch.le <= debutCt) continue;
        const av: any = ch.avant || {};
        const ap: any = ch.apres || {};
        const anciens: { rub: string; val: string }[] = [];
        const a = function (k: string): boolean {
          return Object.prototype.hasOwnProperty.call(av, k);
        };
        const nouveau = function (k: string): any {
          return Object.prototype.hasOwnProperty.call(ap, k) ? ap[k] : (ct as any)[k];
        };

        // ---- la duree du travail ----
        if (a("duree_hebdo") || a("forfait_jours_annuel")) {
          const ancForfait = Number((a("forfait_jours_annuel") ? av.forfait_jours_annuel
            : nouveau("forfait_jours_annuel")) || 0);
          const ancHebdo = Number((a("duree_hebdo") ? av.duree_hebdo : nouveau("duree_hebdo")) || 35);
          const nvForfait = Number(nouveau("forfait_jours_annuel") || 0);
          const nvHebdo = Number(nouveau("duree_hebdo") || 35);

          const ancUnite = ancForfait > 0 ? codeUniteForfait : codeUniteHeure;
          const nvUnite = nvForfait > 0 ? codeUniteForfait : codeUniteHeure;
          if (ancUnite && ancUnite !== nvUnite) anciens.push({ rub: "S21.G00.41.006", val: ancUnite });

          if (dureeMensuelleRef > 0 || ancForfait > 0) {
            const ancQuotite = quotiteDe(ancForfait, ancHebdo);
            if (ancQuotite !== quotiteDe(nvForfait, nvHebdo)) {
              anciens.push({ rub: "S21.G00.41.007", val: ancQuotite });
            }
          }
          const ancModalite = (ancForfait > 0 || ancHebdo >= 35) ? "10" : "20";
          const nvModalite = (nvForfait > 0 || nvHebdo >= 35) ? "10" : "20";
          if (ancModalite !== nvModalite) anciens.push({ rub: "S21.G00.41.008", val: ancModalite });
        }

        // ---- la categorie : statut conventionnel et statut de retraite ----
        if (a("categorie") && q(av.categorie) && !q(ct.statut_conventionnel)
            && !estStagiaire && !estApprentiPublic) {
          const ancCat = q(av.categorie);
          const nvCat = q(nouveau("categorie"));
          const ancStatut = await statutDe(ancCat);
          if (ancStatut && ancStatut !== (await statutDe(nvCat))) {
            anciens.push({ rub: "S21.G00.41.002", val: ancStatut });
          }
          const ancRc = await rcDe(ancCat);
          if (ancRc && ancRc !== (await rcDe(nvCat))) {
            anciens.push({ rub: "S21.G00.41.003", val: ancRc });
          }
        }

        // ---- la convention collective ----
        if (a("idcc")) {
          const ancIdcc = q(av.idcc) ? String(av.idcc).padStart(4, "0") : "9999";
          const nvIdcc = q(nouveau("idcc")) ? String(nouveau("idcc")).padStart(4, "0") : "9999";
          if (ancIdcc !== nvIdcc) anciens.push({ rub: "S21.G00.41.011", val: ancIdcc });
        }

        // ---- la profession ----
        if (a("pcs_ese") && q(av.pcs_ese) && q(av.pcs_ese) !== q(nouveau("pcs_ese"))) {
          anciens.push({ rub: "S21.G00.41.019", val: q(av.pcs_ese) });
        }

        // ---- le code risque accidents du travail ----
        if (a("code_risque_at") && q(av.code_risque_at)
            && q(av.code_risque_at) !== q(nouveau("code_risque_at"))) {
          anciens.push({ rub: "S21.G00.41.024", val: q(av.code_risque_at) });
        }

        let profondeur = ch.le.slice(0, 8) + "01";
        if (debutCt && debutCt > profondeur) profondeur = debutCt;

        anciens.sort(function (x, y) { return x.rub < y.rub ? -1 : 1; });
        for (const anc of anciens) {
          ecrire("S21.G00.41.001", dateDsn(ch.le));
          ecrire(anc.rub, anc.val);
          if (!profondeurVue[anc.rub]) {
            ecrire("S21.G00.41.028", dateDsn(profondeur));
            profondeurVue[anc.rub] = true;
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ⚠️ LES DEUX BORNES DU MOIS, calculees ici parce que le bloc versement
    // et tous ses enfants en ont besoin.
    const debutPeriode = dateDsn(periode);
    const finPeriode = finDeMois(periode);
    // 🆕 05/10 — et celles de la PERIODE D EMPLOI, pour les remunerations et
    // les bases assujetties (voir plus haut). Egales au mois pour un salarie
    // present du premier au dernier jour.
    const debutRemu = dateDsn(debutEmploiIso);
    const finRemu = dateDsn(finEmploiIso);

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
    // 🆕🚨 20/09 — ══ S21.G00.60 — L ARRET DE TRAVAIL, DANS LA MENSUELLE ══
    //
    // 🚨 SA PLACE : enfant du contrat, AVANT le bloc 71 — entre freres, 60
    // precede 71. Validee par dsn-val (fichier de 587 lignes).
    //
    // CE QUE LA MENSUELLE PORTE — lu dans « Gestion des arrets de travail »
    // (GIP-MDS, 17/02/2023), et NON deduit du signalement :
    //     001 motif · 002 dernier jour travaille · 003 fin previsionnelle
    //     010 date de la reprise · 011 motif de la reprise — LE MOIS OU LA
    //         REPRISE A LIEU, meme quand elle se fait a la date prevue.
    //
    // ⛔ PAS DE SUBROGATION ICI. Le document est formel : les rubriques 004
    // a 008 « sont a renseigner uniquement dans le signalement ». Depuis la
    // norme P21V01 la mensuelle les ACCEPTE — c est pourquoi dsn-val n avait
    // rien dit sur notre premier jet — mais « cette possibilite ne doit etre
    // exploitee que dans le cadre d un temps partiel therapeutique ».
    // 🚨 LECON : dsn-val dit ce qui est PERMIS par la structure, pas ce qui
    // est ATTENDU par la consigne. Un fichier qui passe n est pas un fichier
    // juste.
    //
    // 🚨 LE DERNIER JOUR TRAVAILLE N EST PAS LE PREMIER JOUR DE L ARRET.
    // C est LA VEILLE (fiche 2694 : « le dernier jour travaille correspond a
    // la veille de la date de debut de la prescription »), sauf si le
    // salarie est venu travailler ce jour-la — et alors il se SAISIT. Le
    // premier jet ecrivait la date de debut : il declarait donc, pour chaque
    // arret, que le salarie avait travaille le jour meme. « Le dernier jour
    // travaille conditionne les 3, voire 12 mois de salaires pris en compte
    // pour le calcul de l IJ » — le corriger exige un annule et remplace.
    // ⛔ LA MENSUELLE ET LE SIGNALEMENT DOIVENT PORTER LA MEME DATE : la
    // meme regle est ecrite dans /api/dsn/evenement.
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

      // ---- LE DERNIER JOUR TRAVAILLE ----
      let djt = q(ev.dernier_jour_travaille);
      if (!djt) {
        const dDeb = new Date(debutArret + "T00:00:00Z");
        dDeb.setUTCDate(dDeb.getUTCDate() - 1);
        djt = dDeb.toISOString().slice(0, 10);
        // ⚠️ UN ARRET QUI COMMENCE LE PREMIER JOUR DU CONTRAT n a pas de
        // veille travaillee : la norme controle le dernier jour travaille
        // contre le debut du contrat. On retombe alors sur le jour meme.
        const debutContrat = q(ct.date_debut);
        if (debutContrat && djt < debutContrat) djt = debutArret;
        // 🆕 25/09 — la date se lit JJ/MM/AAAA : « 10092026 » est le format
        // du fichier, pas celui d un texte destine a un lecteur.
        notesArrets.push(qui + " : le dernier jour travaillé de l'arrêt du "
          + debutArret.split("-").reverse().join("/") + " n'est pas saisi — la VEILLE a été "
          + "déclarée. ⚠️ Si le salarié est venu travailler le jour où "
          + "l'arrêt commence, le saisir : cette date fixe le calcul des "
          + "indemnités journalières.");
      }

      // ═══════════════════════════════════════════════════════════
      // 🆕🚨 20/09 — L ANNULATION D UN ARRET (MOTIF 99)
      //
      // Deux blocs 60 de suite sous le meme contrat : l annulation de
      // l arret historise, puis l arret tel qu il doit etre. Valide par
      // dsn-val (fichier de 629 lignes, zero anomalie).
      // 🚨 LES DATES DE L ANNULATION SONT CELLES DE L ARRET DEJA DECLARE,
      // pas celles du nouveau : c est par elles que la CPAM retrouve
      // l arret a supprimer de sa base.
      // ⛔ UNE ERREUR SUR LE DERNIER JOUR TRAVAILLE NE SE CORRIGE PAS AINSI :
      // elle exige un signalement « annule et remplace ». Le motif 99 sert
      // a faire disparaitre un arret qui n aurait jamais du etre declare.
      // ═══════════════════════════════════════════════════════════
      const djtAnnule = q((ev as any).annule_djt);
      const finAnnule = q((ev as any).annule_fin);
      if (q((ev as any).annule_le) && djtAnnule && finAnnule) {
        ecrire("S21.G00.60.001", "99");
        ecrire("S21.G00.60.002", dateDsn(djtAnnule));
        ecrire("S21.G00.60.003", dateDsn(finAnnule));
        notesArrets.push(qui + " : l'arrêt déclaré du "
          + dateLisible(djtAnnule) + " au " + dateLisible(finAnnule)
          + " est ANNULÉ dans cette DSN (motif 99). ⚠️ C'est la seule "
          + "déclaration qui le retire de la base de la CPAM : après ce "
          + "dépôt, il ne sera plus répété.");
      }

      ecrire("S21.G00.60.001", motif);
      ecrire("S21.G00.60.002", dateDsn(djt));
      ecrire("S21.G00.60.003", dateDsn(finPrev));

      // ---- LA REPRISE, LE MOIS OU ELLE A LIEU ----
      if ((ev as any)._reprise_dans_le_mois) {
        const anticipee = !!q((ev as any).reprise_date);
        const motifRep = q((ev as any).reprise_motif);

        ecrire("S21.G00.60.010", dateDsn((ev as any)._reprise_effective));
        ecrire("S21.G00.60.011",
          (motifRep === "01" || motifRep === "02" || motifRep === "03")
            ? motifRep : "01");

        // 🚨 UNE REPRISE DEDUITE SE RELIT. Sans date saisie, on declare le
        // retour au lendemain de la fin prevue. Si l arret a ete PROLONGE et
        // que la prolongation n a pas ete saisie, on declare une reprise qui
        // n a pas eu lieu.
        if (!anticipee) {
          // 🆕 02/10 — la date LISIBLE (19/09/2026), pas la forme du
          // fichier DSN (19092026) : la note se lit a l ecran.
          notesArrets.push(qui + " : reprise déclarée le "
            + dateLisible((ev as any)._reprise_effective) + ", lendemain de la fin "
            + "prévue de l'arrêt. ⛔ SI L'ARRÊT A ÉTÉ PROLONGÉ, corriger sa "
            + "date de fin AVANT de déposer : la prolongation ne se signale "
            + "pas à part, elle passe par cette date.");
        }
      }

      // ═══════════════════════════════════════════════════════════
      // 🆕🚨 20/09 — ══ S21.G00.66 — LE TEMPS PARTIEL THERAPEUTIQUE ══
      //
      // Enfant de l arret, TROIS RUBRIQUES, toutes obligatoires — dsn-val
      // les a enumerees (CST-03 sur 002 et 003, CSL-03 sur le format de la
      // 001) et a valide le fichier complet a 629 lignes :
      //     001 date de debut du temps partiel dans le mois
      //     002 date de fin dans le mois
      //     003 MONTANT DE LA PERTE DE SALAIRE
      //
      // 🚨 C EST LA PERTE DE SALAIRE QUI COMPTE, pas le salaire verse : la
      // CNAM calcule l indemnite complementaire dessus. Sans elle, le
      // salarie ne touche rien.
      // 🚨 LE TPT SE DECLARE CHAQUE MOIS OU IL COURT, « meme s il n y a
      // qu un seul jour de TPT sur le mois » (fiche consigne 911), et les
      // dates sont BORNEES AU MOIS DECLARE.
      // ⚠️ SANS BLOC 66, LA CNAM NE RECOIT RIEN : la fiche 911 precise que
      // la declaration de l arret « ne declenche aucune transmission des
      // donnees a destination de la CNAM et de la MSA » s il n y a pas de
      // bloc 66 dessous. Un TPT sans perte de salaire renseignee est donc
      // inutile a declarer — mais il vaut mieux le dire que le taire.
      // ⛔ LA PERTE DE SALAIRE NE SE CALCULE PAS ICI : elle depend du
      // salaire qu aurait eu le salarie a temps plein, que le moteur de
      // paie ne reconstitue pas encore. Elle se saisit.
      // ═══════════════════════════════════════════════════════════
      const estTpt = motif === "15" || motif === "16" || motif === "17"
        || motif === "18" || q((ev as any).reprise_motif) === "02";

      if (estTpt) {
        const tptDeb = q((ev as any).tpt_debut) || debutArret;
        const tptFin = q((ev as any).tpt_fin) || finPrev;
        const perte = Number((ev as any).tpt_perte_salaire || 0);

        // Les dates sont bornees au mois declare.
        const dDeb = tptDeb < periode ? periode : tptDeb;
        const dFin = tptFin > finMoisDecl ? finMoisDecl : tptFin;

        if (perte > 0 && dDeb <= dFin) {
          ecrire("S21.G00.66.001", dateDsn(dDeb));
          ecrire("S21.G00.66.002", dateDsn(dFin));
          ecrire("S21.G00.66.003", montantDsn(perte));
        } else {
          anomalies.push(qui + " : temps partiel thérapeutique déclaré sans "
            + "MONTANT DE PERTE DE SALAIRE. ⛔ Le bloc S21.G00.66 n'est pas "
            + "écrit, et sans lui la CNAM ne reçoit rien : le salarié ne "
            + "touchera aucune indemnité complémentaire. Saisir la perte de "
            + "salaire du mois.");
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
      // 🆕🚨 05/10 — LA RUPTURE SAISIE SUR LE CONTRAT COMPTE AUSSI.
      // Jusqu ici la mensuelle ne declarait une fin de contrat que si un
      // signalement de fin de contrat existait. Un CDI rompu depuis l ecran
      // de paie (« modifier le contrat » : date et motif de rupture) sortait
      // donc sans bloc 62 — avec son indemnite, mais sans la rupture qui
      // l explique. Le signalement, quand il existe, garde la priorite.
      let rup: any = rupturesParContrat[String(ct.id)];
      const rompuLe = q(ct.rompu_le).slice(0, 10);
      if (!rup && rompuLe && rompuLe >= periode && rompuLe <= finMoisPrev) {
        rup = { date_fin: rompuLe, motif: q(ct.motif_rupture_dsn),
          dernier_jour_travaille: null };
      }
      // ⚠️ UN CONTRAT QUI ARRIVE A SON TERME CE MOIS-CI SANS RIEN D
      // ENREGISTRE : on ne devine pas le motif, on le dit.
      const termeLe = q(ct.date_fin).slice(0, 10);
      if (!rup && !estMandat && termeLe && termeLe >= periode && termeLe <= finMoisPrev) {
        notesArrets.push(qui + " : son contrat se termine le " + dateLisible(termeLe)
          + " et aucune fin de contrat n'est enregistrée. Elle n'est donc pas "
          + "déclarée dans ce fichier : l'enregistrer dans l'écran de paie "
          + "(« Documents de fin de contrat »), puis régénérer.");
      }
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
    // 🆕🚨 05/10 — ══ S21.G00.70 — L AFFILIATION PREVOYANCE ══
    //
    // 🚨 SA PLACE : SOUS LE CONTRAT, APRES LA FIN DE CONTRAT (62) ET AVANT
    // LA RETRAITE COMPLEMENTAIRE (71) — structure de la DSN mensuelle,
    // cahier technique 2026.1. Entre freres, l ordre est celui de la norme,
    // pas l ordre croissant des numeros : 70 passe avant 71.
    //
    // 🚨 ON PART DES LIGNES DU BULLETIN, PAS DES CONTRATS : le generateur ne
    // recalcule jamais une paie. Un salarie sans ligne de mutuelle sur son
    // bulletin (un stagiaire, un mandataire) n est pas affilie ici.
    // ⚠️ LA LIGNE NE DIT PAS A QUEL CONTRAT ELLE APPARTIENT. On la rattache
    // au contrat de la societe de meme nature qui couvre la categorie du
    // salarie. S il y en a plusieurs, on prend d abord celui dont le
    // forfait egale le montant de la ligne, sinon dans l ordre des dates
    // d effet — et une reserve demande de le relire.
    // ═══════════════════════════════════════════════════════════════
    const affiliations: any[] = [];
    {
      const catSal = categorieNormalisee(ct.categorie);
      const applicables: Record<string, any[]> = { sante: [], prevoyance: [] };
      for (const g of garantiesSociete) {
        const catG = categorieNormalisee(g.categorie) || "tous";
        if (catG !== "tous" && catG !== catSal) continue;
        applicables[q(g.nature) === "prevoyance" ? "prevoyance" : "sante"].push(g);
      }
      const pris: Record<string, boolean> = {};

      for (const l of (detail.lignes_cotisations || [])) {
        const nat = natureComplementaire(l);
        if (!nat) continue;
        const montantL = Math.round((Number(l.part_salariale || 0)
          + Number(l.part_patronale || 0)) * 100) / 100;
        if (montantL === 0) continue;

        const candidats = applicables[nat].filter(function (g: any) { return !pris[String(g.id)]; });
        let g: any = null;
        if (candidats.length === 1) g = candidats[0];
        else if (candidats.length > 1) {
          for (const cand of candidats) {
            if (!g && q(cand.mode) === "forfait"
                && Math.abs(Number(cand.montant || 0) - montantL) < 0.005) g = cand;
          }
          if (!g) g = candidats[0];
          const note = "Plusieurs contrats de " + (nat === "prevoyance" ? "prévoyance" : "complémentaire santé")
            + " couvrent les mêmes salariés : vérifier, avant le premier dépôt "
            + "réel, que chaque cotisation est déclarée sous le bon contrat.";
          if (notesPrevoyance.indexOf(note) < 0) notesPrevoyance.push(note);
        }

        if (!g) {
          anomalies.push(qui + " : cotisation « " + (q(l.libelle) || q(l.code))
            + " » (" + montantDsn(montantL) + " EUR) sans contrat de "
            + (nat === "prevoyance" ? "prévoyance" : "complémentaire santé")
            + " en vigueur ce mois-ci pour sa catégorie. ⛔ NON DÉCLARÉE.");
          continue;
        }
        pris[String(g.id)] = true;

        const adh = adhesionDe[String(g.id)];
        if (!adh) {
          // Le contrat existe, mais sans ses identifiants DSN : une seule
          // anomalie par contrat, ecrite apres la boucle des salaries.
          const cleG = String(g.id);
          if (!garantiesIncompletes[cleG]) {
            garantiesIncompletes[cleG] = {
              quoi: q(g.nature) === "prevoyance" ? "Prévoyance" : "Complémentaire santé",
              nb: 0, montant: 0,
            };
          }
          garantiesIncompletes[cleG].nb += 1;
          garantiesIncompletes[cleG].montant += montantL;
          continue;
        }

        // ---- LE COMPOSANT : ce qui a servi a calculer la cotisation ----
        const mode = q(g.mode) || "forfait";
        const typeComp = COMPOSANT_PREVOYANCE[mode] || "";
        const param = (detail as any).parametres || {};
        let montantComp = 0;
        if (mode === "forfait") {
          // Le forfait EST la cotisation du mois : on declare celle du
          // bulletin, pas celle du contrat (il a pu changer depuis).
          montantComp = montantL;
        } else if (Number(l.base || 0) > 0) {
          montantComp = Number(l.base);
        } else if (mode === "pct_brut") {
          montantComp = Number(b.brut || 0);
        } else if (mode === "pct_tranche_a") {
          const plaf = Number(param.plafond_contrat || param.plafond || 0);
          montantComp = plaf > 0 ? Math.min(Number(b.brut || 0), plaf) : 0;
        } else if (mode === "pct_pmss") {
          montantComp = Number(param.plafond || 0);
        }

        if (!typeComp || !(montantComp > 0)) {
          anomalies.push(qui + " : la base de calcul de la cotisation « "
            + (q(l.libelle) || q(l.code)) + " » (" + montantDsn(montantL)
            + " EUR) est introuvable sur le bulletin. ⛔ NON DÉCLARÉE : "
            + "sans composant (S21.G00.79), la base 31 est rejetée.");
          continue;
        }
        if (mode === "pct_pmss") {
          const note = "Une cotisation de mutuelle ou de prévoyance est "
            + "calculée en pourcentage du plafond de la Sécurité sociale : la "
            + "façon de la déclarer dépend de l'organisme. À confirmer avec sa "
            + "fiche de paramétrage DSN avant le premier dépôt réel.";
          if (notesPrevoyance.indexOf(note) < 0) notesPrevoyance.push(note);
        }

        // 🚨 UNE SEULE AFFILIATION PAR ADHESION ET PAR SALARIE : deux lignes
        // rattachees au meme contrat s additionnent sous la meme base 31
        // (controles CCH-12 du bloc 70 et SIG-23 du bloc 78).
        let aff: any = null;
        for (const a of affiliations) if (a.adhesion.id === adh.id) aff = a;
        if (!aff) {
          aff = {
            id: affiliations.length + 1, adhesion: adh,
            option: latin(g.option_dsn), population: latin(g.population_dsn),
            cotisation: 0, composants: [] as any[],
          };
          affiliations.push(aff);
        }
        aff.cotisation = Math.round((aff.cotisation + montantL) * 100) / 100;
        let dejaComp: any = null;
        for (const cp of aff.composants) if (cp.type === typeComp) dejaComp = cp;
        if (!dejaComp) aff.composants.push({ type: typeComp, montant: montantComp });
        else if (typeComp === "20") dejaComp.montant += montantComp;
        // ⚠️ Deux composants de meme type 10 ou 11 sont interdits (CCH-16) :
        // la base est la meme, on garde la premiere.
        adh.couvert = true;
      }

      for (const aff of affiliations) {
        if (aff.option) ecrire("S21.G00.70.004", aff.option);
        if (aff.population) ecrire("S21.G00.70.005", aff.population);
        ecrire("S21.G00.70.012", String(aff.id));
        ecrire("S21.G00.70.013", String(aff.adhesion.id));
        nbAffiliations += 1;

        // ⚠️ CONTRAT COLLECTIF OUVERT CE MOIS-CI, SALARIE DEJA EN POSTE : la
        // date de debut d affiliation differe de celle du contrat de
        // travail. La rubrique 70.014 est reservee a des cas listes sur
        // net-entreprises : on ne l ecrit pas sans les avoir lus.
        if (aff.adhesion.nouveau && q(ct.date_debut).slice(0, 10) < periode) {
          const note = aff.adhesion.quoi + " : le contrat prend effet ce mois-ci "
            + "alors que des salariés étaient déjà en poste. La date à "
            + "laquelle ils y entrent n'est pas déclarée : demander à "
            + "l'organisme s'il l'attend.";
          if (notesPrevoyance.indexOf(note) < 0) notesPrevoyance.push(note);
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
    // 🆕 05/10 — « 90000 » pour un stagiaire (pas de retraite
    // complementaire), « IRCANTEC » pour un apprenti du secteur public.
    ecrire("S21.G00.71.002", q(ct.regime_retraite_c)
      || (estStagiaire ? "90000" : (estApprentiPublic ? "IRCANTEC" : "RUAA")));

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

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 05/10 — LE BLOC 50 RELU AU CAHIER TECHNIQUE 2026.1, APRES LE
    // PREMIER PASSAGE DANS dsn-val D UN BULLETIN DONT LE PRELEVEMENT A LA
    // SOURCE N EST PAS NUL (S21.G00.50.009/CCH-11).
    //
    // Depuis le 27/09 le moteur CALCULE le prelevement (grille officielle
    // ou taux personnalise). Ce bloc, lui, declarait encore un taux de 0 —
    // et dsn-val refuse : le montant (50.009) doit etre egal au montant
    // soumis (50.013) multiplie par le taux (50.006), a un euro pres.
    //
    // QUATRE REGLES, lues pages 60, 244 et 245 :
    //
    //   50.002  LA REMUNERATION NETTE FISCALE NE COMPTE PAS LES INDEMNITES
    //           JOURNALIERES, meme versees par subrogation : « L employeur
    //           ne doit pas declarer les indemnites journalieres imposables.
    //           A defaut ces indemnites seraient prises en compte deux
    //           fois » (c est la caisse qui les declare). Le « net
    //           imposable » du bulletin, lui, les compte : c est l ASSIETTE
    //           DU PRELEVEMENT. On retire donc leur part imposable.
    //   50.004  LE MONTANT NET VERSE = la remuneration nette fiscale, moins
    //           la CSG non deductible, la CRDS et la part patronale « frais
    //           de sante » reintegree. « Le montant du prelevement a la
    //           source n est pas a deduire » — nous declarions le net a
    //           payer, donc APRES prelevement.
    //   50.006  LE TAUX REELLEMENT APPLIQUE : celui de la grille quand il
    //           n y a pas de taux personnalise, jamais zero par principe.
    //   50.013  LE MONTANT SOUMIS = l assiette reellement retenue : la
    //           remuneration nette fiscale, PLUS l avance d indemnites
    //           journalieres en subrogation, MOINS l abattement des
    //           contrats courts.
    //
    // 🚨 LE GENERATEUR NE RECALCULE PAS LA PAIE : taux, assiette et montant
    // se lisent dans le bulletin emis (`detail.prelevement`), qui dit ce
    // qui a REELLEMENT ete preleve. La fiche du salarie ne sert plus que
    // pour l identifiant du compte rendu, et pour les bulletins d avant le
    // 27/09, qui n ont pas ce detail.
    // ═══════════════════════════════════════════════════════════════
    const prel: any = (detail as any).prelevement || null;
    const netImposableBulletin = Number(b.net_imposable) || 0;
    const ijImposables = Math.max(0, Number((detail as any).ijss_imposables) || 0);
    const netFiscal = Math.round((netImposableBulletin - ijImposables) * 100) / 100;

    let csgCrdsNonDeductibles = 0;
    let patronalSanteReintegre = 0;
    for (const lc of (((detail as any).lignes_cotisations || []) as any[])) {
      const codeLc = q(lc && lc.code).toUpperCase();
      if (codeLc === "CSG_NON_DED" || codeLc === "CRDS") {
        csgCrdsNonDeductibles += Number(lc.part_salariale) || 0;
      }
      if (codeLc === "MUTUELLE") patronalSanteReintegre += Number(lc.part_patronale) || 0;
    }
    // ⚠️ REVENU ENTIEREMENT NON IMPOSABLE (cahier technique, 50.004) : le
    // net verse est alors le brut moins les cotisations du salarie.
    // 🆕 05/10 — LE STAGIAIRE : sa gratification en franchise de cotisations
    // n est pas dans le brut declare, mais elle lui est bien versee. Son net
    // verse est donc ce qu il a touche — le net avant impot du bulletin.
    const netAvantImpotBulletin = Number((b as any).net_avant_impot)
      || Number((detail as any).net_avant_impot) || 0;
    const netVerse = netFiscal > 0
      ? Math.round((netFiscal - csgCrdsNonDeductibles - patronalSanteReintegre) * 100) / 100
      : (estStagiaire && netAvantImpotBulletin > 0
        ? Math.round(netAvantImpotBulletin * 100) / 100
        : Math.round(((Number(b.brut) || 0) - (Number(b.total_salarial) || 0)) * 100) / 100);

    ecrire("S21.G00.50.002", montantDsn(netFiscal));
    ecrire("S21.G00.50.003", "01");
    ecrire("S21.G00.50.004", montantDsn(netVerse));

    // ── Le taux : ce que le bulletin a applique ──
    const pasFiche = tauxPasDe(s, periode);
    const bulletinDitLeTaux = !!prel
      && (prel.nature === "personnalise" || prel.nature === "non_personnalise");
    const tauxPersonnalise = bulletinDitLeTaux
      ? prel.nature === "personnalise" : pasFiche.personnalise;
    const tauxApplique = bulletinDitLeTaux
      ? Math.max(0, Number(prel.taux) || 0)
      : (pasFiche.personnalise ? pasFiche.taux : 0);
    const abattementCourt = bulletinDitLeTaux && !tauxPersonnalise
      ? Math.max(0, Number(prel.abattement) || 0) : 0;
    const montantPreleve = Math.max(0, Number(b.prelevement_source) || 0);

    // ── Le montant soumis : l assiette reellement retenue ──
    let montantSoumis = Math.max(0, netImposableBulletin);
    if (bulletinDitLeTaux && !tauxPersonnalise
        && prel.assiette_apres_abattement !== undefined
        && prel.assiette_apres_abattement !== null
        && isFinite(Number(prel.assiette_apres_abattement))) {
      montantSoumis = Math.max(0, Number(prel.assiette_apres_abattement));
    }

    ecrire("S21.G00.50.006", montantDsn(tauxApplique));

    if (tauxPersonnalise) {
      ecrire("S21.G00.50.007", codeTauxPersonnalise);

      // 🆕🚨 S21.G00.50.008 — L IDENTIFIANT DU COMPTE RENDU METIER.
      //
      // Elle dit DE QUEL compte rendu le taux a ete tire. C est ce qui
      // permet a la DGFiP de rattacher le prelevement a la transmission qui
      // l a fonde. 🚨 OBLIGATOIRE avec le type « 01 » (controle CCH-11).
      const identifiantCrm = pasFiche.identifiantCrm || q(s.taux_pas_identifiant_crm);
      if (identifiantCrm) {
        ecrire("S21.G00.50.008", identifiantCrm);
      } else {
        anomalies.push(qui + " : taux personnalisé de " + montantDsn(tauxApplique)
          + " % déclaré SANS l'identifiant du compte rendu métier "
          + "(S21.G00.50.008). ⛔ OBLIGATOIRE avec un taux transmis par "
          + "l'administration : LA DÉCLARATION SERA REJETÉE. Il figure dans le "
          + "compte rendu d'où le taux a été repris ; le saisir avec le taux, "
          + "écran de paie → ligne « Prélèvement à la source ».");
      }

      nbTauxPersonnalises++;
    } else {
      ecrire("S21.G00.50.007", TYPE_TAUX_NEUTRE);

      // ⚠️ CONTRAT COURT (deux mois au plus, abattement applique) : le
      // cahier technique demande « -1 » comme identifiant du taux.
      if (abattementCourt > 0) ecrire("S21.G00.50.008", "-1");

      // 🚨 UN TAUX ENREGISTRE APRES L EMISSION NE CHANGE PAS LE BULLETIN :
      // la DSN declare ce qui a ete preleve, et le dit.
      if (bulletinDitLeTaux && pasFiche.personnalise) {
        anomalies.push(qui + " : un taux personnalisé de " + montantDsn(pasFiche.taux)
          + " % est enregistré pour ce mois, mais le bulletin émis a prélevé "
          + "au taux de la grille (" + montantDsn(tauxApplique) + " %). La DSN "
          + "déclare ce qui a réellement été prélevé. ⚠️ Pour appliquer le "
          + "taux personnalisé à ce mois, ouvrir un bulletin rectificatif.");
      }

      // 🆕🚨 LE BAREME NEUTRE DEPEND DE LA SITUATION GEOGRAPHIQUE.
      //
      // « 13 » est le bareme de METROPOLE ; « 23 » celui de la Guadeloupe,
      // de la Reunion et de la Martinique ; « 33 » celui de la Guyane et de
      // Mayotte (cahier technique 2026.1, page 245).
      // ⚠️ LE MOTEUR DE PAIE N A QUE LA GRILLE DE METROPOLE : le bulletin a
      // donc ete calcule sur elle, et c est elle qui est declaree. On le dit.
      const cpSalarie = q(s.code_postal);
      if (cpSalarie.length >= 2 && (cpSalarie.slice(0, 2) === "97"
          || cpSalarie.slice(0, 2) === "98")) {
        anomalies.push(qui + " : adresse hors métropole (code postal "
          + cpSalarie + "). Le prélèvement à la source a été calculé et déclaré "
          + "sur la grille de métropole (« 13 »), la seule chargée. ⚠️ Les "
          + "grilles de la Guadeloupe, de la Réunion et de la Martinique "
          + "(« 23 ») et de la Guyane et de Mayotte (« 33 ») ne le sont pas "
          + "encore : à régler avant tout dépôt réel concernant ce salarié.");
      }
    }

    ecrire("S21.G00.50.009", montantDsn(montantPreleve));
    // 🚨 LE MONTANT SOUMIS AU PAS (50.013) EST OBLIGATOIRE, « meme s il est
    // egal a la remuneration nette fiscale ».
    ecrire("S21.G00.50.013", montantDsn(montantSoumis));

    // 🆕🚨 05/10 — LE GENERATEUR REFAIT LE CONTROLE DE dsn-val AVANT LUI
    // (S21.G00.50.009/CCH-11) : montant = montant soumis x taux, a un euro
    // pres. Un ecart se lit ici, pas a la Surface.
    const attenduPas = Math.round(montantSoumis * tauxApplique) / 100;
    if (Math.abs(montantPreleve - attenduPas) > 1) {
      anomalies.push(qui + " : le prélèvement à la source déclaré ("
        + montantDsn(montantPreleve) + " €) ne correspond pas au montant soumis ("
        + montantDsn(montantSoumis) + " €) multiplié par le taux ("
        + montantDsn(tauxApplique) + " %), soit " + montantDsn(attenduPas)
        + " €. ⛔ LA DÉCLARATION SERA REJETÉE (contrôle S21.G00.50.009/CCH-11). "
        + "Ressortir le bulletin du mois avant de régénérer.");
    }

    // ⚠️ LE BLOC S21.G00.58 (montant net social) EST ECRIT PLUS BAS, apres
    // la remuneration et les assiettes : les sous-groupes d un meme parent
    // se suivent dans l ordre croissant de leur numero — 50, puis 51, puis
    // 58, puis 78. Ecrit ici, il precedait le 51 et cassait cet ordre.

    // ══ S21.G00.51 — LA REMUNERATION ══
    const codeBrut = await code("S21.G00.51.011", "brut", periode);
    ecrire("S21.G00.51.001", debutRemu);
    ecrire("S21.G00.51.002", finRemu);
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
    // 🆕🚨 05/10 — LE MOIS INCOMPLET : LES JOURS CALENDAIRES DE PRESENCE
    //
    // Entree ou sortie en cours de mois : le plafond de la Securite sociale
    // se reduit aux jours calendaires de la periode d emploi (article R242-2
    // du code de la securite sociale). La DSN les declare dans un bloc
    // activite d unite « 40 », SOUS LA REMUNERATION 001 — c est le seul bloc
    // activite admis a cette place (valide par dsn-val, entree le 10 et
    // sortie le 15).
    // ⛔ PAS POUR UN MANDATAIRE : son fichier valide ne porte aucun bloc
    // activite. Le cas se relit avant le depot.
    // ═══════════════════════════════════════════════════════════════
    if (moisIncomplet) {
      if (estMandat) {
        notesArrets.push(qui + " : mandat commencé ou terminé en cours de mois. "
          + "Les jours de présence qui réduisent le plafond de la Sécurité "
          + "sociale ne sont pas déclarés pour un mandataire : cas à vérifier "
          + "dans dsn-val avant le premier dépôt réel.");
      } else {
        ecrire("S21.G00.53.001", "01");
        ecrire("S21.G00.53.002", montantDsn(compterJours(debutEmploiIso, finEmploiIso, null)));
        ecrire("S21.G00.53.003", "40");
      }
    }

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
    ecrire("S21.G00.51.001", debutRemu);
    ecrire("S21.G00.51.002", finRemu);
    ecrire("S21.G00.51.010", numeroContrat);
    ecrire("S21.G00.51.011", "003");
    // 🆕🚨 20/09 — LE SALAIRE RETABLI VIENT DU BULLETIN, PLUS DU BRUT.
    // Depuis que le moteur retient les arrets de travail, le bulletin porte
    // `salaire_retabli` : ce que le salarie aurait touche sans l absence.
    // ⚠️ UN BULLETIN D AVANT CETTE DATE N A PAS LA VALEUR : il n avait pas
    // d absence non plus, et son brut fait foi.
    // ⛔ JAMAIS INFERIEUR AU BRUT : un salaire « retabli » plus bas que le
    // salaire verse n a pas de sens, et ferait baisser les indemnites.
    const retabli = Number(detail && detail.salaire_retabli) || 0;
    ecrire("S21.G00.51.013",
      montantDsn(retabli > Number(b.brut) ? retabli : b.brut));

    // 🆕 05/10 — LE STAGIAIRE N A PAS DE « SALAIRE DE BASE » : sa premiere
    // ligne est la gratification entiere, franchise comprise. On declare ce
    // qui cotise — son brut — comme dans le fichier valide.
    const base010 = estStagiaire
      ? { montant: Number(b.brut) || 0, repli: "" }
      : salaireDeBaseDsn(detail, ct);
    if (base010) {
      ecrire("S21.G00.51.001", debutRemu);
      ecrire("S21.G00.51.002", finRemu);
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
    // 🆕 05/10 — CE QUI SORT DE LA 002 EST LA PART DE CHAQUE INDEMNITE QUI EST
    // DANS LE BRUT : une rupture conventionnelle de 500 EUR dont 450 sont
    // exclus des cotisations ne retire que 50 EUR du brut (valide : 1 610,00
    // de brut, 360,00 de conges, 50,00 soumis → 1 200,00).
    const totalPrimes = primes.lignes.reduce(function (s: number, p: any) {
      return s + Number(p.dansLeBrut !== undefined ? p.dansLeBrut : (p.montant || 0));
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

    // 🆕🚨 05/10 — NI MANDATAIRE NI STAGIAIRE N OUVRENT DE DROITS AU
    // CHOMAGE : leur remuneration 002 est a 0.00 (fichiers valides). Le
    // mandataire n a pas non plus de bloc activite — il n a pas d horaire.
    if (estMandat || estStagiaire) remu002 = 0;

    ecrire("S21.G00.51.001", debutRemu);
    ecrire("S21.G00.51.002", finRemu);
    ecrire("S21.G00.51.010", numeroContrat);
    ecrire("S21.G00.51.011", "002");
    ecrire("S21.G00.51.013", montantDsn(remu002));

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 05/10 — LES HEURES PAYEES DU MOIS (bloc activite, unite « 10 »)
    //
    // ⛔ ELLES VALAIENT 151,67 h POUR TOUT LE MONDE : un salarie a 24 heures
    // par semaine, ou entre le 10 du mois, etait declare a temps plein sur
    // le mois entier. France Travail calcule les droits sur ces heures.
    // Desormais :
    //   · la duree mensuelle DU CONTRAT, que le bulletin a retenue
    //     (`parametres.duree_mensuelle_contrat`) ; a defaut, la quotite ;
    //   · un salarie paye a l heure : les heures de sa ligne de salaire ;
    //   · un mois incomplet : au prorata des jours travailles de la periode
    //     d emploi, dans le meme rapport que le salaire ;
    //   · PLUS les heures supplementaires et complementaires du mois.
    // ⚠️ Le forfait en jours garde la duree de reference, comme avant.
    // ═══════════════════════════════════════════════════════════════
    const hs: any = (detail as any).heures_sup || null;
    const heuresHs = hs ? Math.max(0, Number(hs.heures) || 0) : 0;
    const brutHs = hs ? Math.max(0, Number(hs.brut) || 0) : 0;

    if (!estMandat && dureeMensuelleRef > 0) {
      let heuresMois = dureeMensuelleRef;
      if (!forfaitJours) {
        const param: any = (detail as any).parametres || {};
        const dureeContrat = Number(param.duree_mensuelle_contrat) > 0
          ? Number(param.duree_mensuelle_contrat) : Number(quotiteContrat);
        // La ligne de salaire d un salarie paye a l heure porte ses heures.
        let heuresLigne = 0;
        for (const l of (Array.isArray((detail as any).lignes_brut) ? (detail as any).lignes_brut : [])) {
          const lib = q(l && l.libelle).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          if ((lib.indexOf("salaire de base") === 0 || lib.indexOf("heures normales") === 0)
              && Number(l.quantite || 0) > 0 && Number(l.taux || 0) > 0) {
            heuresLigne = Number(l.quantite);
            break;
          }
        }
        if (heuresLigne > 0) heuresMois = heuresLigne;
        else {
          heuresMois = dureeContrat > 0 ? dureeContrat : dureeMensuelleRef;
          if (moisIncomplet) {
            const jt = joursTravailDsn(ct);
            const joursMois = compterJours(periode, finMoisPrev, jt);
            const joursEmploi = compterJours(debutEmploiIso, finEmploiIso, jt);
            if (joursMois > 0) heuresMois = heuresMois * Math.min(1, joursEmploi / joursMois);
          }
        }
        heuresMois = Math.round((heuresMois + heuresHs) * 100) / 100;
      }
      ecrire("S21.G00.53.001", "01");
      ecrire("S21.G00.53.002", montantDsn(heuresMois));
      ecrire("S21.G00.53.003", "10");
    }

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 05/10 — LES HEURES SUPPLEMENTAIRES ET COMPLEMENTAIRES
    //
    // Une remuneration de type « 017 - heures supplementaires ou
    // complementaires aleatoires », avec le nombre d heures (51.012) et ce
    // qu elles ont rapporte (51.013). C est elle que l URSSAF rapproche de
    // la reduction salariale (code 114) et de la deduction patronale (021) :
    // « les heures supplementaires sont a indiquer en bloc 51 » (tableur
    // d equivalence, CTP 004). ⚠️ Le montant reste aussi dans la 001 et la
    // 002 : le type 017 le detaille, il ne s y ajoute pas.
    // ═══════════════════════════════════════════════════════════════
    if (heuresHs > 0 && brutHs > 0) {
      ecrire("S21.G00.51.001", debutRemu);
      ecrire("S21.G00.51.002", finRemu);
      ecrire("S21.G00.51.010", numeroContrat);
      ecrire("S21.G00.51.011", "017");
      ecrire("S21.G00.51.012", montantDsn(heuresHs));
      ecrire("S21.G00.51.013", montantDsn(brutHs));
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
    // 🆕🚨 05/10 — ══ S21.G00.54 — LES AVANTAGES EN NATURE ══
    //
    // 🚨 SA PLACE : apres les primes (52), avant le net social (58). Deux
    // rubriques : le type et le montant. Valide par dsn-val pour le vehicule
    // (« 04 ») ; les repas (« 02 ») et le logement (« 03 ») ont la meme forme.
    // ⚠️ L avantage est DEJA dans le brut et dans les assiettes : ce bloc le
    // nomme, il ne l ajoute pas.
    // ═══════════════════════════════════════════════════════════════
    for (const av of avantagesDsn(detail)) {
      ecrire("S21.G00.54.001", av.type);
      ecrire("S21.G00.54.002", montantDsn(av.montant));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🆕 05/10 — ══ S21.G00.58 — LES HEURES EXONEREES D IMPOT ══
    //
    // Type « 01 » : la remuneration NETTE des heures supplementaires et
    // complementaires exoneree d impot sur le revenu, telle que le bulletin
    // l a retiree du net imposable. Avant le net social (valide).
    // ═══════════════════════════════════════════════════════════════
    const hsExonere = hs ? Math.max(0, Number(hs.exonere_ir) || 0) : 0;
    if (hsExonere > 0) {
      ecrire("S21.G00.58.001", debutRemu);
      ecrire("S21.G00.58.002", finPeriode);
      ecrire("S21.G00.58.003", "01");
      ecrire("S21.G00.58.004", montantDsn(hsExonere));
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
    // 🆕 05/10 — il commence avec la periode d emploi (valide : entree le 10).
    ecrire("S21.G00.58.001", debutRemu);
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
      // 🆕🚨 05/10 — LA MUTUELLE ET LA PREVOYANCE NE PASSENT PAS ICI. Elles
      // ne relevent d aucune assiette URSSAF et n ont pas de ligne dans
      // dsn_codes : elles se declarent plus bas, sous la base « 31 », a
      // partir des affiliations ecrites avant le bloc 71.
      if (natureComplementaire(l)) continue;

      const interne = q(l.code);
      const montant = Number(l.part_salariale || 0) + Number(l.part_patronale || 0);

      // ⚠️ UNE COTISATION A ZERO NE SE DECLARE PAS : l AT/MP sans taux
      // renseigne n a rien a dire a l URSSAF.
      if (montant === 0) continue;

      const { data: corrTable } = await supabase
        .from("dsn_codes")
        .select("code, base_rattachement")
        .eq("rubrique", "S21.G00.81.001")
        .eq("correspondance", interne)
        .lte("date_effet", periode)
        .or("date_fin.is.null,date_fin.gte." + periode)
        .order("date_effet", { ascending: false })
        .limit(1)
        .maybeSingle();

      // 🆕 05/10 — LA TABLE D ABORD, SINON LES CODES DES FICHIERS VALIDES
      // (reduction des heures supplementaires, contribution sur la rupture
      // conventionnelle, forfait social, Ircantec, Apec).
      const regleConv = regleConventionnelle(interne);
      const repli = COTISATION_REPLI[interne.toUpperCase()]
        || (regleConv ? { code: regleConv.code, base: regleConv.base } : undefined);
      const corr: any = (corrTable && corrTable.code)
        ? corrTable
        : (repli ? { code: repli.code, base_rattachement: repli.base } : null);

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

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 22/09 — L ASSIETTE DECLAREE EST CELLE QUI A PORTE LA COTISATION
      //
      // ⛔ DEFAUT TROUVE SUR LE PREMIER APPRENTI : la CSG de Camille portait
      // sur 201,78 EUR — la fraction excedant le seuil, apres abattement —
      // mais le fichier declarait une assiette de 1 118,95, le brut abattu.
      // Le montant etait juste, l assiette mentait, et c est exactement ce
      // que l URSSAF rapproche : assiette x taux = montant.
      // 🚨 QUAND UNE LIGNE N A QU UNE PART SALARIALE ET QUE L EXONERATION
      // APPRENTI L A REDUITE, C EST CETTE ASSIETTE-LA QU ON DECLARE. Le
      // moteur la range dans `base_salariale`, nulle partout ailleurs.
      // ⚠️ ON NE LE FAIT QUE POUR LES LIGNES PUREMENT SALARIALES (CSG, CRDS).
      // Sur une ligne a deux parts — la vieillesse plafonnee, par exemple —
      // l employeur cotise bien sur le brut entier : reduire l assiette
      // commune ferait disparaitre une cotisation patronale reellement due.
      // ═══════════════════════════════════════════════════════════════
      const partSalSeule = Number(l.part_salariale || 0) !== 0
        && Number(l.part_patronale || 0) === 0;
      const baseSalariale = (l as any).base_salariale;
      const baseLigne = (partSalSeule && baseSalariale !== null
        && baseSalariale !== undefined && Number(baseSalariale) > 0)
        ? Number(baseSalariale) : Number(l.base);

      // ⚠️ L ASSIETTE DE LA BASE EST LA PLUS GRANDE DE SES COTISATIONS :
      // 🆕 05/10 — sauf celles dont l « assiette » n est pas une part du brut
      // (heures supplementaires, part exoneree d une indemnite de rupture).
      if (baseLigne > parAssiette[bAss].assiette
          && CODES_HORS_ASSIETTE.indexOf(String(corr.code)) < 0) {
        parAssiette[bAss].assiette = baseLigne;
      }

      if (!parAssiette[bAss].codes[corr.code]) {
        parAssiette[bAss].codes[corr.code] = { montant: 0, base: baseLigne };
      }
      parAssiette[bAss].codes[corr.code].montant += montant;

      // 🆕 06/10 — CE QUI NOURRIT LES CTP DE FORMATION AU BORDEREAU : la
      // meme assiette que celle ecrite au nominatif pour ce salarie.
      {
        const regleF = CTP_FORMATION[interne.toUpperCase()];
        if (regleF && bAss === "03") {
          assiettesFormation[regleF.ctp] = (assiettesFormation[regleF.ctp] || 0) + baseLigne;
        }
        // 🆕 06/10 — et les contributions conventionnelles, avec leur taux.
        if (regleConv && bAss === "03") {
          const tx = Number(l.taux_patronal || 0);
          const deja = assiettesConv[regleConv.ctp];
          if (!deja) {
            assiettesConv[regleConv.ctp] = { assiette: baseLigne, taux: tx, quoi: regleConv.quoi, tauxDivers: false };
          } else {
            deja.assiette += baseLigne;
            if (Math.abs(deja.taux - tx) > 0.0000001) deja.tauxDivers = true;
          }
        }
      }
      // 🆕 20/09 — COMBIEN DE PARTS ALIMENTENT CE CODE ?
      //
      // 🚨 ON COMPTE LES PARTS, PAS LES LIGNES. Une seule ligne de bulletin
      // peut porter deux taux — la part salariale et la part patronale de la
      // vieillesse plafonnee, 6,90 et 8,55 — dont on somme les montants. Les
      // compter pour une donnait un taux de 15,45 %, qui n existe dans aucun
      // texte. Le taux au nominatif n a de sens que s il en reste UNE.
      const partsIci = (Number(l.part_salariale || 0) !== 0 ? 1 : 0)
        + (Number(l.part_patronale || 0) !== 0 ? 1 : 0);
      parAssiette[bAss].codes[corr.code].parts =
        (parAssiette[bAss].codes[corr.code].parts || 0) + (partsIci || 1);

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 22/09 — LE TAUX DU BAREME, GARDE A COTE DU MONTANT
      //
      // ⛔ DEFAUT TROUVE SUR LE PREMIER APPRENTI : plus bas, le taux
      // declare etait RECONSTRUIT en divisant le montant par l assiette.
      // Pour la CRDS de l apprenti — 1,01 EUR preleve sur 201,78 EUR, mais
      // une assiette declaree de 1 118,95 — le quotient donnait 0,09 %, et
      // comme 0,09 % de 1 118,95 retombe bien a 1,01, le garde-fou
      // « il retombe au centime » laissait passer. LE CONTROLE VERIFIAIT LA
      // COHERENCE DU QUOTIENT AVEC LUI-MEME, pas que le taux existe.
      // 🚨 UN TAUX DE COTISATION EST UNE DONNEE DE REFERENTIEL : il se LIT
      // dans le bareme, il ne se deduit jamais d une division. La CRDS vaut
      // 0,50 %, quelle que soit l assiette sur laquelle elle a ete calculee.
      // ⚠️ ON GARDE LE TAUX ET ON COMPTE LES VALEURS DISTINCTES : deux
      // lignes au meme taux restent declarables, deux taux differents non.
      const tauxLigne = Number(l.part_salariale || 0) !== 0
        ? Number(l.taux_salarial || 0)
        : Number(l.taux_patronal || 0);
      const dejaVu = parAssiette[bAss].codes[corr.code].tauxBareme;
      if (dejaVu === undefined) {
        parAssiette[bAss].codes[corr.code].tauxBareme = tauxLigne;
      } else if (Math.abs(dejaVu - tauxLigne) > 0.0001) {
        // Deux taux differents sous le meme code : aucun ne le represente.
        parAssiette[bAss].codes[corr.code].tauxBareme = -1;
      }

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

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 05/10 — LA DEDUCTION FORFAITAIRE PATRONALE SUR LES HEURES
    // SUPPLEMENTAIRES (code 021)
    //
    // Elle n est pas une ligne du bulletin : le moteur la range dans
    // `detail.deduction_hs`. Elle se declare sous l assiette deplafonnee, en
    // NEGATIF, avec pour assiette la remuneration des heures supplementaires
    // — pas des heures complementaires, qui n y ouvrent pas droit.
    // ═══════════════════════════════════════════════════════════════
    {
      const deduction = Math.max(0, Number((detail as any).deduction_hs) || 0);
      if (deduction > 0 && parAssiette["03"]) {
        const brutCompl = hs ? Math.max(0, Number(hs.brut_complementaires) || 0) : 0;
        parAssiette["03"].codes[CODE_DEDUCTION_HS] = {
          montant: -Math.round(deduction * 100) / 100,
          base: Math.round(Math.max(0, brutHs - brutCompl) * 100) / 100,
          parts: 1, tauxBareme: -1,
        };
      }
    }

    // ⚠️ L ORDRE DES ASSIETTES : la deplafonnee en premier, parce que c est
    // sous elle que se rattache la reduction generale (controle CCH-17).
    // 🆕 20/09 — « 57 - Assiette du versement mobilite » ferme la marche.
    // 🚨 ELLE EST PROPRE AU VERSEMENT MOBILITE : le guide Urssaf range
    // cette cotisation sous sa propre base assujettie, pas sous l assiette
    // brute deplafonnee. ⛔ SANS CETTE LIGNE, LE GROUPE « 57 » SERAIT
    // CALCULE PUIS JETE EN SILENCE — la cotisation disparaitrait du
    // nominatif sans aucun message.
    // 🆕 05/10 — puis « 13 - Assiette du forfait social a 8 % » et « 28 -
    // Base IRCANTEC cotisee » (apprenti du secteur public).
    const ordreAssiettes = ["03", "02", "04", "07", "57", "13", "28"];

    for (const bAss of ordreAssiettes) {
      const grp = parAssiette[bAss];
      if (!grp) continue;

      // 🆕 LE CUMUL QUI NOURRIT LE BORDEREAU : la meme valeur que celle
      // ecrite au nominatif, jamais un calcul parallele.
      assiettesCumulees[bAss] = (assiettesCumulees[bAss] || 0) + Number(grp.assiette || 0);

      // 🆕🚨 22/09 — LA PART DE L APPRENTI SOUS LE SEUIL PART AILLEURS.
      //
      // Elle reste dans `assiettesCumulees` — c est bien la meme base
      // assujettie — mais on la note a part pour que le bordereau la
      // retranche du CTP 100 et la porte au CTP 726, comme la table DIDA
      // l exige. ⚠️ LE SEUIL EST BORNE PAR L ASSIETTE : sur les bases
      // plafonnee et chomage, l assiette peut etre inferieure au seuil, et
      // declarer plus que ce qui existe fausserait tout le bordereau.
      // ⛔ LA CSG (base 04) EST EXCLUE : elle se declare au CTP 260 quelle
      // que soit la fraction, et la table DIDA ne rattache aucune CSG au
      // CTP 726.
      // 🆕 05/10 — L APPRENTI DU SECTEUR PUBLIC a ses propres CTP : la part
      // sous le seuil au 803, le reste au 518. Il ne passe ni par le 726 ni
      // par le 423 du secteur prive.
      if (estApprentiPublic) {
        if (bAss === "03" || bAss === "02") {
          const seuilPub = detailApprenti ? Math.max(0, Number(detailApprenti.seuil_exoneration) || 0) : 0;
          const sous = Math.min(Number(grp.assiette || 0), seuilPub);
          assiettesPublicSous[bAss] = (assiettesPublicSous[bAss] || 0) + sous;
          assiettesPublicAuDela[bAss] = (assiettesPublicAuDela[bAss] || 0)
            + Math.max(0, Number(grp.assiette || 0) - sous);
        }
      } else if (detailApprenti && Number(detailApprenti.seuil_exoneration) > 0
          && bAss !== "04") {
        const part = Math.min(Number(grp.assiette || 0),
          Number(detailApprenti.seuil_exoneration));
        if (part > 0) {
          assiettesApprenti[bAss] = (assiettesApprenti[bAss] || 0) + part;
        }
      }
      // 🆕 05/10 — LE MANDATAIRE : ses assiettes vont au CTP 863.
      if (estMandat && (bAss === "03" || bAss === "02")) {
        assiettesMandat[bAss] = (assiettesMandat[bAss] || 0) + Number(grp.assiette || 0);
      }

      // 🆕 05/10 — LES DATES SONT CELLES DE LA PERIODE D EMPLOI (controle
      // SIG-17 : la base tient dans la periode d activite du contrat).
      ecrire("S21.G00.78.001", bAss);
      ecrire("S21.G00.78.002", debutRemu);
      ecrire("S21.G00.78.003", finRemu);
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

        // 🆕🚨 22/09 — LA SCISSION REFAIT LES DEUX TAUX
        //
        // ⛔ REGRESSION TROUVEE LE JOUR MEME : depuis que le taux declare
        // est celui du bareme et non un quotient, les codes 074 et 075
        // n ecrivaient plus rien. La raison tient a la scission : la LIGNE
        // DU BULLETIN porte 13,00 % pour la maladie, que l on coupe ici en
        // 075 a 7,00 % et 907 a 6,00 %. Comparer 13,00 % au montant du code
        // scinde ne retombe evidemment pas, et le generateur s abstenait —
        // huit taux justes ont ainsi disparu d un coup.
        // 🚨 APRES UNE SCISSION, LE TAUX DE LA LIGNE N EST PLUS CELUI
        // D AUCUN DES DEUX CODES. Le complement prend le taux du CTP, et le
        // reste prend la difference : 13,26 - 6,00 = 7,26 pour la maladie
        // quand le bulletin porte le taux plein.
        // ⚠️ LE TAUX DU RESTE SE DEDUIT DU MONTANT ET DE LA BASE, mais ce
        // n est PAS un quotient arbitraire : c est le taux du bareme moins
        // celui du CTP, et le controle plus bas verifiera qu il retombe au
        // centime avant de l ecrire.
        const tauxAvant = Number(ligne.tauxBareme);
        grp.codes[sc.codeComplement].tauxBareme = tauxc;
        grp.codes[sc.codeComplement].parts = 1;
        if (tauxAvant > 0) {
          ligne.tauxBareme = Math.round((tauxAvant - tauxc) * 10000) / 10000;
        }
      }

      // ══ LES COTISATIONS DE CETTE ASSIETTE ══
      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 22/09 — L EXONERATION DE L APPRENTI AU NOMINATIF : CODE 001 OU 002
      //
      // La table DIDA rattache au CTP 726 les codes de cotisation
      // individuelle « 001 - exoneration de cotisations au titre de l emploi
      // d un apprenti (loi de 1979) » et « 002 - (loi de 1987) », sur les
      // bases 03 et 02 — et sa fiche precise : « il convient d utiliser le
      // code de cotisation individuelle 001 ou 002 en fonction de la
      // situation du salarie ». Le choix suit le dispositif du bloc 40 :
      // 64 → 001, 65 → 002.
      // 🚨 LE MONTANT EST CE QUE LE SALARIE N A PAS PAYE : la part salariale
      // des cotisations URSSAF sur la fraction sous le seuil. Seule la
      // vieillesse (code 076) en porte une ; la CSG est sur la base 04, que
      // la DIDA ne rattache pas au 726, et la retraite complementaire
      // releve de l Agirc-Arrco. Le montant se calcule ligne par ligne, au
      // taux du bareme, sur min(assiette, seuil) — jamais en devinant.
      // ⚠️ ECRIT EN NEGATIF, comme la reduction generale (code 018) que
      // dsn-val accepte ainsi depuis le 18/09 : c est un montant qui se
      // deduit. ⛔ Aucun taux en 81.007 : c est une exoneration, pas une
      // cotisation, et le guide les exclut expressement.
      // ═══════════════════════════════════════════════════════════════
      if (detailApprenti && Number(detailApprenti.seuil_exoneration) > 0
          && (bAss === "03" || bAss === "02")) {
        const seuilApp = Number(detailApprenti.seuil_exoneration);
        let exonere = 0;
        let assietteExo = 0;
        for (const l of (detail.lignes_cotisations || [])) {
          if ((l as any).exoneration_apprenti !== true) continue;
          if (Number(l.taux_salarial || 0) <= 0) continue;
          const codeInterne = q(l.code).toUpperCase();
          const surCetteBase = (bAss === "02" && codeInterne === "VIEILLESSE_PLAF")
            || (bAss === "03" && codeInterne === "VIEILLESSE_DEPLAF");
          if (!surCetteBase) continue;
          const assietteL = Math.min(Number(l.base || 0), seuilApp);
          if (assietteL <= 0) continue;
          exonere += Math.round(assietteL * Number(l.taux_salarial)) / 100;
          if (assietteL > assietteExo) assietteExo = assietteL;
        }
        if (exonere > 0 && !estApprentiPublic) {
          const codeExo = dispositif === "65" ? "002" : "001";
          grp.codes[codeExo] = {
            montant: -Math.round(exonere * 100) / 100,
            base: assietteExo, parts: 1, tauxBareme: -1,
          };
        }
        // ═══════════════════════════════════════════════════════════
        // 🆕🚨 05/10 — L APPRENTI DU SECTEUR PUBLIC : CODE 003 (loi de 1992)
        //
        // Le tableur d equivalence l attend sous les deux bases, 03 et 02,
        // aux CTP 803 et 518. 🚨 POUR UNE EXONERATION, L URSSAF N ATTEND QUE
        // L ASSIETTE (cahier technique, rubrique 81.004 : « a renseigner
        // pour une cotisation, reduction ») : c est la part du salaire sous
        // le seuil. Le montant ne s ecrit que si le bulletin permet de le
        // calculer — une part salariale reellement due au-dela du seuil.
        // Sous le seuil, le bulletin ne porte aucune ligne de vieillesse
        // (ni le salarie ni l employeur ne cotisent) : le bloc sort alors
        // avec son assiette seule.
        // ═══════════════════════════════════════════════════════════
        if (estApprentiPublic) {
          const assiette003 = assietteExo > 0
            ? assietteExo : Math.min(Number(grp.assiette || 0), seuilApp);
          if (assiette003 > 0) {
            grp.codes["003"] = {
              montant: -Math.round(exonere * 100) / 100,
              base: Math.round(assiette003 * 100) / 100,
              parts: 1, tauxBareme: -1, sansMontant: !(exonere > 0),
            };
          }
        }
      }

      const listeCodes = Object.keys(grp.codes).sort();
      for (const cd of listeCodes) {
        ecrire("S21.G00.81.001", cd);
        codes81Ecrits[bAss + "/" + cd] = true;
        ecrire("S21.G00.81.003", montantDsn(grp.codes[cd].base));
        if (!grp.codes[cd].sansMontant) {
          ecrire("S21.G00.81.004", montantDsn(grp.codes[cd].montant));
        }

        // 🆕 05/10 — CE QUI AURA SA PROPRE LIGNE AU BORDEREAU.
        if (cd === "114") reductionHsUrssaf += -Number(grp.codes[cd].montant || 0);
        if (cd === CODE_DEDUCTION_HS) deductionHsUrssaf += -Number(grp.codes[cd].montant || 0);
        if (cd === "093") assietteRuptureConv += Number(grp.codes[cd].base || 0);

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
        // ⚠️ LE TAUX S ECRIT PLUS BAS, APRES LE CODE INSEE : dans un bloc,
        // les rubriques se suivent EN ORDRE CROISSANT, et la 005 precede la
        // 007. Ecrit ici, il passait avant la commune du versement mobilite
        // et le fichier etait refuse.
        const baseCode = Number(grp.codes[cd].base || 0);
        const montantCode = Number(grp.codes[cd].montant || 0);
        const estReduction = CODES_SANS_TAUX.indexOf(cd) >= 0;

        // 🚨 UN CODE ALIMENTE PAR PLUSIEURS COTISATIONS N A PAS DE TAUX
        // UNIQUE. Le compteur `nb` comptait les LIGNES du bulletin — or une
        // seule ligne peut porter DEUX taux, la part salariale et la part
        // patronale, dont on somme les montants. Le 076 sortait ainsi a
        // 15,45 % : c est 6,90 + 8,55, un nombre qui n existe dans aucun
        // texte. On compte donc les PARTS, pas les lignes.
        const uneSeulePart = Number(grp.codes[cd].parts || 0) === 1;

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

        // ═══════════════════════════════════════════════════════════════
        // 🆕🚨 20/09 — LE TAUX AU NOMINATIF (S21.G00.81.007), EN DERNIER
        //
        // 🚨 dsn-val NE VERIFIE PAS QUE ASSIETTE × TAUX = MONTANT : il
        // accepterait n importe quel taux (essai de 611 lignes, zero
        // anomalie). C est l URSSAF qui rapproche les trois ensuite, et un
        // taux faux y declenche une anomalie A CHAQUE DEPOT, chez chaque
        // client.
        // ⛔ ON N ECRIT DONC LE TAUX QUE S IL RETOMBE AU CENTIME, et
        // seulement quand UNE SEULE PART alimente le code. Une rubrique
        // absente ne declenche rien ; un taux faux declenche a chaque fois.
        // ═══════════════════════════════════════════════════════════════
        if (uneSeulePart && !estReduction && baseCode > 0 && montantCode !== 0) {
          // 🆕🚨 22/09 — LE TAUX DECLARE EST CELUI DU BAREME, PAS UN QUOTIENT.
          //
          // On part du taux reel de la cotisation, puis on verifie qu il
          // retombe au centime SUR L ASSIETTE QU ON DECLARE. Les deux
          // conditions sont necessaires :
          //   · le taux doit exister dans un texte — sinon l URSSAF ne le
          //     reconnait pas ;
          //   · il doit s accorder avec l assiette declaree — sinon le
          //     rapprochement assiette x taux = montant echoue.
          // ⛔ QUAND LES DEUX NE S ACCORDENT PAS, ON S ABSTIENT. C est le
          // cas de l apprenti, dont l assiette declaree est le brut entier
          // alors que la cotisation n a porte que sur la fraction excedant
          // le seuil d exoneration : aucun taux ne peut relier les deux, et
          // en inventer un serait pire que de n en mettre aucun.
          const tauxBareme = Number(grp.codes[cd].tauxBareme);
          if (tauxBareme > 0) {
            const verif = Math.round(baseCode * tauxBareme) / 100;
            if (Math.abs(verif - montantCode) <= 0.01) {
              ecrire("S21.G00.81.007", tauxDsn(tauxBareme));
            }
          }
        }

        // 🆕 CE QUI EST DU A L URSSAF : tout sauf la retraite complementaire,
        // qui releve de l Agirc-Arrco et se verse ailleurs.
        // ⚠️ LE CODE 142 EST UNE PART DEJA COMPTEE DANS LE 131 : l ajouter
        // compterait deux fois la meme cotisation.
        // 🆕 05/10 — NI L APEC (132), NI L IRCANTEC (060, 061) : l Apec se
        // verse a l Agirc-Arrco, l Ircantec a sa propre caisse. L Apec etait
        // comptee a tort dans le prelevement de l URSSAF.
        // 🚨 NI L EXONERATION DE L APPRENTI (001, 002, 003). ⛔ DEFAUT TROUVE
        // LE 05/10 : son montant etait retranche du prelevement, alors que
        // la part salariale exoneree n est DEJA PAS dans la cotisation
        // declaree (le code 076 de l apprenti ne porte que ce qui est du).
        // L exoneration etait donc deduite deux fois : le prelevement
        // d ATELIER HORIZON SAS sortait a 1 091 EUR au lieu de 1 150. Ce code
        // nomme l exoneration, il ne la retire pas une seconde fois.
        if (CODES_HORS_URSSAF.indexOf(cd) < 0
            && CODES_EXONERATION_APPRENTI.indexOf(cd) < 0) {
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
    // 🆕🚨 05/10 — ══ LA BASE « 31 » : MUTUELLE ET PREVOYANCE ══
    //
    // Une base par affiliation, apres les assiettes URSSAF. Voir l en-tete
    // des constantes BASE_PREVOYANCE et COTISATION_PREVOYANCE.
    //   78.004 vaut TOUJOURS 0.00 ; 78.005 porte l identifiant de
    //   l affiliation ; un seul bloc 81, code 059, part salariale et part
    //   patronale reunies.
    // ⚠️ 78.006 (numero du contrat) NE S ECRIT PAS ICI : c est l affiliation
    // qui rattache la base au contrat.
    // 🚨 SIG-17 : la periode doit tenir dans la periode d activite du
    // contrat. Un salarie entre le 15 se declare du 15 a la fin du mois ;
    // un salarie sorti le 20, du 1er au 20.
    // ═══════════════════════════════════════════════════════════════
    if (affiliations.length > 0) {
      let debut31 = periode;
      let fin31 = finMoisPrev;
      const entree = q(ct.date_debut).slice(0, 10);
      if (entree > debut31 && entree <= fin31) debut31 = entree;
      for (const sortie of [q(ct.rompu_le).slice(0, 10), q(ct.date_fin).slice(0, 10)]) {
        if (sortie && sortie >= debut31 && sortie < fin31) fin31 = sortie;
      }

      for (const aff of affiliations) {
        ecrire("S21.G00.78.001", BASE_PREVOYANCE);
        ecrire("S21.G00.78.002", dateDsn(debut31));
        ecrire("S21.G00.78.003", dateDsn(fin31));
        ecrire("S21.G00.78.004", "0.00");
        ecrire("S21.G00.78.005", String(aff.id));
        for (const cp of aff.composants) {
          ecrire("S21.G00.79.001", cp.type);
          ecrire("S21.G00.79.004", montantDsn(cp.montant));
        }
        ecrire("S21.G00.81.001", COTISATION_PREVOYANCE);
        ecrire("S21.G00.81.004", montantDsn(aff.cotisation));
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

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 06/10 — LA TAXE D APPRENTISSAGE AU NIVEAU DE L ETABLISSEMENT
  // (bloc S21.G00.82, « cotisation etablissement »)
  //
  // DEUX DECLARATIONS QUI MANQUAIENT, lues au cahier technique 2026.1, au
  // tableau d equivalence de l URSSAF et dans la documentation d un editeur
  // de paie (Sage, « La taxe d apprentissage ») :
  //
  //   1. L EXONERATION DU MOIS — code « 074 ». Un employeur d apprenti dont
  //      la masse salariale ne depasse pas six fois le SMIC ne doit pas la
  //      taxe : cela se DECLARE, chaque mois, par un bloc 82 de code 074 et
  //      de valeur 0.00. ⛔ Depuis le 06/10 le bulletin ne comptait plus la
  //      taxe dans ce cas, mais la DSN ne le disait pas.
  //
  //   2. LE SOLDE ANNUEL — code « 076 », CTP 995. Dans la DSN d AVRIL
  //      (exigible le 5 ou le 15 mai) : 0,09 % de la masse salariale de
  //      l annee precedente. Bloc 82 : le MONTANT, les dates du 1er janvier
  //      au 31 decembre de l annee precedente. Bordereau : CTP 995,
  //      qualifiant 920, l ASSIETTE. Il n est pas du en Alsace-Moselle.
  //
  // LA MASSE DE L ANNEE PRECEDENTE = les bruts des bulletins EMIS ici, plus
  // les mois repris d un autre logiciel (`paie_reprises`). En sont exclus
  // les stagiaires et, dans une entreprise de moins de 11 salaries, les
  // apprentis. ⚠️ Si la paie de l annee precedente n a ete ni tenue ni
  // reprise ici en entier, la masse est INCOMPLETE : une reserve le dit.
  //   3. 🆕 06/10 — LES DEDUCTIONS DU SOLDE (table `paie_ta_deductions`,
  //      saisies a l ecran DSN, une ligne par societe et par annee) :
  //        · subventions en NATURE aux CFA — code « 077 », CTP 996 ;
  //        · creances « alternants » (250 salaries et plus) — code « 078 »,
  //          CTP 997.
  //      Au bloc 82 : le montant en NEGATIF, memes dates que le solde. Au
  //      bordereau : format « F », qualifiant 921, le montant SANS signe
  //      (table d equivalence de l URSSAF). Elles ne peuvent pas depasser
  //      le solde : au-dela, elles sont ECRETEES et une anomalie le dit.
  //      ⚠️ Le signe negatif au bloc 82 suit la regle des deductions de la
  //      taxe (code 075) : il n a jamais ete eprouve dans dsn-val.
  // ⛔ CE BLOC N EST JAMAIS PASSE DANS dsn-val.
  // ═══════════════════════════════════════════════════════════════════
  const C82: string[] = [];
  const notesTa: string[] = [];
  let soldeTa = 0;
  let masseSoldeTa = 0;
  let deducCfaTa = 0;
  let deducAltTa = 0;
  {
    const ecrire82 = function (ref: string, valeur: any) {
      const v = latin(valeur);
      if (v !== "") C82.push(ref + ",'" + v + "'");
    };
    const lieuTa = q(societe.code_insee) || q(societe.code_postal);
    const alsaceMoselleTa = /^(57|67|68)/.test(lieuTa);
    const effectifTa = Number(societe.effectif || 0);

    // La societe a-t-elle ete declaree « non redevable » (taux 0 a l ecran) ?
    let nonRedevableTa = false;
    {
      const { data: tx } = await supabase.from("paie_taux_societe")
        .select("taux, date_effet, date_fin").eq("societe_id", societeId)
        .eq("code", "TAXE_APPRENTISSAGE").lte("date_effet", periode)
        .order("date_effet", { ascending: false });
      for (const t of ((tx || []) as any[])) {
        const fin = t.date_fin ? String(t.date_fin).slice(0, 10) : "";
        if (fin && fin < periode) continue;
        nonRedevableTa = Number(t.taux) === 0;
        break;
      }
    }

    const lireSmic = async function (jour: string): Promise<number> {
      const { data: ps } = await supabase.from("paie_parametres")
        .select("valeur, date_effet, date_fin").eq("code", "SMIC_MENSUEL").lte("date_effet", jour)
        .order("date_effet", { ascending: false });
      for (const x of ((ps || []) as any[])) {
        const fin = x.date_fin ? String(x.date_fin).slice(0, 10) : "";
        if (fin && fin < jour) continue;
        return Number(x.valeur) || 0;
      }
      return 0;
    };

    // ---- 1. L EXONERATION DU MOIS ----
    {
      let aApprenti = false;
      let aLigneTa = false;
      for (const b of bulletins) {
        const ct: any = (b as any).paie_contrats || {};
        if (q(ct.type_contrat).toLowerCase() === "apprentissage") aApprenti = true;
        const lignes: any[] = ((b as any).detail && (b as any).detail.lignes_cotisations) || [];
        for (const l of lignes) {
          if (/^TAXE_APPRENTISSAGE/.test(q(l.code).toUpperCase()) && Number(l.part_patronale || 0) !== 0) aLigneTa = true;
        }
      }
      const smicMois = await lireSmic(periode);
      if (!nonRedevableTa && aApprenti && !aLigneTa && smicMois > 0 && totalBrut <= 6 * smicMois + 0.005) {
        ecrire82("S21.G00.82.001", "0.00");
        ecrire82("S21.G00.82.002", "074");
        ecrire82("S21.G00.82.003", debutMois);
        ecrire82("S21.G00.82.004", finMois);
        notesTa.push("Taxe d'apprentissage : exonération du mois déclarée (employeur d'apprenti, masse "
          + "salariale de " + montantDsn(totalBrut) + " EUR pour un seuil de " + montantDsn(6 * smicMois)
          + " EUR — bloc « cotisation établissement », code 074, valeur 0.00). ⛔ Ce bloc n'est jamais "
          + "passé dans dsn-val.");
      }
    }

    // ---- 2. LE SOLDE ANNUEL, DANS LA DSN D AVRIL ----
    if (periode.slice(5, 7) === "04") {
      const anPrec = String(Number(periode.slice(0, 4)) - 1);
      if (nonRedevableTa) {
        notesTa.push("Solde de la taxe d'apprentissage : non déclaré, la société est marquée « non redevable ».");
      } else if (alsaceMoselleTa) {
        notesTa.push("Solde de la taxe d'apprentissage : il n'est pas dû dans le Bas-Rhin, le Haut-Rhin et la Moselle.");
      } else {
        const { data: prec } = await supabase.from("paie_bulletins")
          .select("brut, periode, contrat_id, paie_contrats(type_contrat)")
          .eq("societe_id", societeId).eq("statut", "emis")
          .gte("periode", anPrec + "-01-01").lte("periode", anPrec + "-12-31").limit(10000);
        let masse = 0;
        let apprentiAnnee = false;
        const moisVus: any = {};
        for (const b of ((prec || []) as any[])) {
          const typeB = q(b.paie_contrats && b.paie_contrats.type_contrat).toLowerCase();
          moisVus[String(b.periode).slice(0, 7)] = true;
          if (typeB === "apprentissage") apprentiAnnee = true;
          if (typeB === "stage") continue;
          if (typeB === "apprentissage" && effectifTa < 11) continue;
          masse += Number(b.brut || 0);
        }
        // Les mois repris d un autre logiciel (table tolerante : elle peut manquer).
        {
          const { data: rep, error: eRep } = await supabase.from("paie_reprises")
            .select("brut, periode").eq("societe_id", societeId)
            .gte("periode", anPrec + "-01-01").lte("periode", anPrec + "-12-31").limit(10000);
          if (!eRep) {
            for (const r of ((rep || []) as any[])) {
              moisVus[String(r.periode).slice(0, 7)] = true;
              masse += Number(r.brut || 0);
            }
          }
        }
        masse = Math.round(masse * 100) / 100;
        let smicAnnuel = 0;
        for (let m = 1; m <= 12; m++) smicAnnuel += await lireSmic(anPrec + "-" + String(m).padStart(2, "0") + "-01");
        const nbMois = Object.keys(moisVus).length;

        if (masse <= 0) {
          notesTa.push("🚨 Solde de la taxe d'apprentissage (DSN d'avril) : aucune paie de " + anPrec
            + " n'est connue ici (ni bulletin émis, ni mois repris). Le solde — 0,09 % de la masse "
            + "salariale de " + anPrec + " — N'EST PAS DÉCLARÉ : le calculer et le déclarer à part, ou "
            + "saisir les mois de " + anPrec + " dans « Reprise d'un autre logiciel » puis régénérer.");
        } else if (apprentiAnnee && smicAnnuel > 0 && masse <= 6 * smicAnnuel) {
          notesTa.push("Solde de la taxe d'apprentissage : non dû — la société a employé un apprenti en "
            + anPrec + " et sa masse salariale (" + montantDsn(masse) + " EUR) ne dépasse pas six fois le "
            + "SMIC annuel (" + montantDsn(6 * smicAnnuel) + " EUR). Rien n'est déclaré à ce titre.");
        } else {
          let tauxSolde = 0.09;
          {
            const { data: pt } = await supabase.from("paie_parametres")
              .select("valeur, date_effet").eq("code", "TA_SOLDE_TAUX").lte("date_effet", periode)
              .order("date_effet", { ascending: false }).limit(1);
            const v = ((pt || []) as any[])[0];
            if (v && Number(v.valeur) > 0) tauxSolde = Number(v.valeur);
          }
          masseSoldeTa = masse;
          soldeTa = Math.round(masse * tauxSolde) / 100;
          ecrire82("S21.G00.82.001", montantDsn(soldeTa));
          ecrire82("S21.G00.82.002", "076");
          ecrire82("S21.G00.82.003", "0101" + anPrec);
          ecrire82("S21.G00.82.004", "3112" + anPrec);
          duUrssaf += soldeTa;
          // 🆕 06/10 — LES DEDUCTIONS DU SOLDE (table tolerante : elle peut manquer).
          {
            const { data: ded, error: eDed } = await supabase.from("paie_ta_deductions")
              .select("cfa, alternants").eq("societe_id", societeId).eq("annee", Number(anPrec)).limit(1);
            const d0 = !eDed ? ((ded || []) as any[])[0] : null;
            let cfa = d0 ? Math.max(0, Math.round(Number(d0.cfa || 0) * 100) / 100) : 0;
            let alt = d0 ? Math.max(0, Math.round(Number(d0.alternants || 0) * 100) / 100) : 0;
            if (alt > 0 && effectifTa < 250) {
              anomalies.push("Solde de la taxe d'apprentissage : une créance « alternants » de " + montantDsn(alt)
                + " EUR est saisie, mais elle est réservée aux entreprises de 250 salariés et plus (effectif de la "
                + "fiche : " + effectifTa + "). ⛔ ELLE N'EST PAS DÉDUITE : corriger l'effectif ou retirer la créance.");
              alt = 0;
            }
            if (cfa + alt > soldeTa + 0.001) {
              anomalies.push("Solde de la taxe d'apprentissage : les déductions saisies (" + montantDsn(cfa + alt)
                + " EUR) dépassent le solde (" + montantDsn(soldeTa) + " EUR). Elles sont ÉCRÊTÉES au montant du solde : "
                + "les subventions aux CFA d'abord, la créance « alternants » ensuite. Vérifier la saisie.");
              cfa = Math.min(cfa, soldeTa);
              alt = Math.min(alt, Math.round((soldeTa - cfa) * 100) / 100);
            }
            if (cfa > 0) {
              ecrire82("S21.G00.82.001", "-" + montantDsn(cfa));
              ecrire82("S21.G00.82.002", "077");
              ecrire82("S21.G00.82.003", "0101" + anPrec);
              ecrire82("S21.G00.82.004", "3112" + anPrec);
            }
            if (alt > 0) {
              ecrire82("S21.G00.82.001", "-" + montantDsn(alt));
              ecrire82("S21.G00.82.002", "078");
              ecrire82("S21.G00.82.003", "0101" + anPrec);
              ecrire82("S21.G00.82.004", "3112" + anPrec);
            }
            deducCfaTa = cfa; deducAltTa = alt;
            duUrssaf -= (cfa + alt);
            if (cfa + alt > 0) {
              notesTa.push("Déductions du solde de la taxe d'apprentissage : "
                + (cfa > 0 ? montantDsn(cfa) + " EUR de subventions en nature aux CFA (code 077, CTP 996)" : "")
                + (cfa > 0 && alt > 0 ? " et " : "")
                + (alt > 0 ? montantDsn(alt) + " EUR de créance « alternants » (code 078, CTP 997)" : "")
                + ". Reste dû : " + montantDsn(Math.round((soldeTa - cfa - alt) * 100) / 100) + " EUR. "
                + "⚠️ L'employeur garde les justificatifs (reçus des CFA). ⛔ Ces blocs ne sont jamais passés dans dsn-val.");
            }
          }
          notesTa.push("Solde de la taxe d'apprentissage déclaré : " + montantDsn(soldeTa) + " EUR, soit "
            + String(tauxSolde).replace(".", ",") + " % de la masse salariale de " + anPrec + " ("
            + montantDsn(masse) + " EUR, " + nbMois + " mois de paie connus ici). "
            + (nbMois < 12 ? "🚨 MOINS DE DOUZE MOIS sont connus : si la société a payé des salaires les "
              + "autres mois, la masse est incomplète — les saisir dans « Reprise d'un autre logiciel » "
              + "puis régénérer. " : "")
            + "Les déductions du solde (subventions en nature aux CFA, créance « alternants ») se saisissent "
            + "à l'écran DSN, bloc « Recouvrement URSSAF ». ⛔ Ce bloc et la ligne 995 du bordereau ne sont "
            + "jamais passés dans dsn-val.");
        }
      }
    }
  }

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
          + "société est introuvable dans la table officielle des URSSAF. ⛔ LE "
          + "BORDEREAU N'EST PAS DÉCLARÉ. Choisir à nouveau l'URSSAF de la "
          + "société : écran DSN → bloc « Recouvrement URSSAF » → « modifier ».");
      }
    } else {
      anomalies.push("L'URSSAF de rattachement de la société n'est pas renseignée "
        + "(écran DSN → bloc « Recouvrement URSSAF » → « renseigner »). "
        + "⛔ LE BORDEREAU N'EST PAS DÉCLARÉ : sans lui, la DSN "
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
          + "Renseigner l'IBAN et le BIC du compte à prélever (écran DSN → "
          + "bloc « Recouvrement URSSAF ») — "
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

      // 🆕 05/10 — UN CTP SE DECLARE S IL EXISTE ET N EST PAS CLOTURE A LA
      // PERIODE : la meme question pour chaque nouvelle ligne du bordereau.
      const ctpOuvert = async function (codeCtp: string): Promise<boolean> {
        const { data: ctp } = await supabase
          .from("urssaf_ctp")
          .select("code, libelle")
          .eq("code", codeCtp)
          .lte("date_effet", periode)
          .or("date_fin.is.null,date_fin.gte." + periode)
          .order("date_effet", { ascending: false })
          .limit(1)
          .maybeSingle();
        return !!ctp;
      };
      // Une ligne du bordereau, apres ce controle. `montant` pour les CTP de
      // deduction (le montant s ecrit en POSITIF : « le CTP porte le signe »),
      // `assiette` pour les autres.
      const ligneBordereau = async function (p: { ctp: string; qualifiant: string;
        assiette?: number; montant?: number; tauxAt?: boolean; taux?: number; quoi: string }): Promise<boolean> {
        const valeur = p.montant !== undefined ? p.montant : (p.assiette || 0);
        if (!(Math.round(valeur) > 0)) return false;
        if (!(await ctpOuvert(p.ctp))) {
          anomalies.push("Le code type de personnel " + p.ctp + " (" + p.quoi
            + ") n'existe pas dans la table officielle des codes de l'URSSAF "
            + "pour " + moisDsn(periode).slice(0, 2) + "/" + periode.slice(0, 4)
            + ", ou il est clôturé. ⛔ CETTE LIGNE DU BORDEREAU N'EST PAS "
            + "DÉCLARÉE.");
          return false;
        }
        ecrireB("S21.G00.23.001", p.ctp);
        ctpDeclares[p.ctp] = true;
        ecrireB("S21.G00.23.002", p.qualifiant);
        if (p.tauxAt && tauxAtSociete > 0) ecrireB("S21.G00.23.003", montantDsn(tauxAtSociete));
        // 🆕 06/10 — format « V » : le taux propre a la ligne se declare.
        if (p.taux !== undefined && p.taux > 0) ecrireB("S21.G00.23.003", tauxDsn(p.taux));
        if (p.montant !== undefined) ecrireB("S21.G00.23.005", euroDsn(p.montant));
        else ecrireB("S21.G00.23.004", euroDsn(p.assiette || 0));
        return true;
      };

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
        let assiette = assiettesCumulees[regle.assiette] || 0;

        // 🆕🚨 22/09 — CE QUI EST SOUS LE SEUIL SORT DES CTP ORDINAIRES.
        //
        // La table DIDA de l URSSAF place la fraction exoneree sur le
        // CTP 726 et son chomage sur le 423 : la laisser AUSSI sur le 100 et
        // le 772 la compterait deux fois, et le bordereau ne s accorderait
        // plus avec le nominatif. ⚠️ SEULS CES DEUX CTP SONT CONCERNES : le
        // FNAL, les complements 430 et 635, l AGS et la CSG restent dus sur
        // la totalite, sans distinguer la part exoneree — c est ce que dit
        // la fiche de chacun.
        if (regle.ctp === "100") {
          // 🚨 L ARRONDI SE FAIT UNE SEULE FOIS, SUR LE TOTAL. Arrondir
          // separement les deux parts donnait 934 + 6 979 = 7 913 pour un
          // total de 7 912 : UN EURO DE PLUS QUE LE NOMINATIF, et
          // l equivalence exigee par l URSSAF depuis 2022 tombait. On
          // arrondit donc le total et la part exoneree, puis on DEDUIT le
          // reste — la somme retombe alors exactement.
          // 🆕 05/10 — sortent aussi du CTP 100 : le mandataire (CTP 863) et
          // l apprenti du secteur public (CTP 803 et 518).
          assiette = Math.round(assiette)
            - Math.round(assiettesApprenti[regle.assiette] || 0)
            - Math.round(assiettesMandat[regle.assiette] || 0)
            - Math.round(assiettesPublicSous[regle.assiette] || 0)
            - Math.round(assiettesPublicAuDela[regle.assiette] || 0);
        } else if (regle.ctp === "430" || regle.ctp === "635") {
          // 🆕 05/10 — LES DEUX COMPLEMENTS NE CONCERNENT NI LE MANDATAIRE
          // (le CTP 863 porte deja ses codes 102 et 907) NI L APPRENTI DU
          // SECTEUR PUBLIC (l employeur ne doit ni maladie ni allocations
          // familiales pour lui).
          assiette = Math.round(assiette)
            - Math.round(assiettesMandat["03"] || 0)
            - Math.round(assiettesPublicSous["03"] || 0)
            - Math.round(assiettesPublicAuDela["03"] || 0);
        } else if (regle.ctp === "772") {
          assiette = Math.round(assiette) - Math.round(assiettesApprenti["07"] || 0);
        }
        if (assiette < 0) assiette = 0;

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
        ctpDeclares[regle.ctp] = true;
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
      // 🆕🚨 22/09 — LES LIGNES DE L APPRENTI : CTP 726 ET CTP 423
      //
      // 🚨 LES DEUX VONT ENSEMBLE, la fiche du CTP 423 est formelle : « Ce
      // CTP doit etre systematiquement renseigne des lors que le CTP 726 ou
      // le CTP 727 sont utilises. » On ne declare donc jamais l un sans
      // l autre, et une anomalie le dit si le chomage manque.
      // ⚠️ LE TAUX AT SE PORTE ICI AUSSI, sur la ligne 920 : la fiche du
      // CTP 726 precise que « le taux AT a utiliser est fixe par la CARSAT »,
      // exactement comme pour le CTP 100.
      // ⛔ CES LIGNES N EXISTENT QUE S IL Y A UN APPRENTI : le tableau reste
      // vide pour tout autre employeur, et rien ne s ecrit.
      // ═══════════════════════════════════════════════════════════════
      const lignesApprenti: { ctp: string; qualifiant: string;
        assiette: string; tauxAt?: boolean }[] = [
        { ctp: CTP_APPRENTI_SOUS_SEUIL, qualifiant: "920", assiette: "03", tauxAt: true },
        { ctp: CTP_APPRENTI_SOUS_SEUIL, qualifiant: "921", assiette: "02" },
        { ctp: CTP_APPRENTI_CHOMAGE, qualifiant: "920", assiette: "07" },
      ];

      let apprentiDeclare = false;
      let apprentiChomage = false;

      for (const regle of lignesApprenti) {
        const assiette = assiettesApprenti[regle.assiette] || 0;
        if (assiette <= 0) continue;

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
          anomalies.push("Le code type de personnel " + regle.ctp + " (apprenti) "
            + "n'existe pas dans urssaf_ctp à la période " + periode + ", ou il "
            + "est clôturé. ⛔ LA PART EXONÉRÉE DE L'APPRENTI N'EST PAS "
            + "DÉCLARÉE : importer la table des codes types de personnel.");
          continue;
        }

        ecrireB("S21.G00.23.001", regle.ctp);
        ctpDeclares[regle.ctp] = true;
        ecrireB("S21.G00.23.002", regle.qualifiant);
        if (regle.tauxAt && tauxAtSociete > 0) {
          ecrireB("S21.G00.23.003", montantDsn(tauxAtSociete));
        }
        ecrireB("S21.G00.23.004", euroDsn(assiette));

        if (regle.ctp === CTP_APPRENTI_SOUS_SEUIL) apprentiDeclare = true;
        if (regle.ctp === CTP_APPRENTI_CHOMAGE) apprentiChomage = true;
      }

      // 🚨 LE COUPLE EST OBLIGATOIRE. Si le 726 part sans le 423, l URSSAF
      // reclame la contribution chomage de l apprenti a l employeur.
      if (apprentiDeclare && !apprentiChomage) {
        anomalies.push("Le CTP " + CTP_APPRENTI_SOUS_SEUIL + " est déclaré sans "
          + "le CTP " + CTP_APPRENTI_CHOMAGE + " : l'URSSAF exige que les deux "
          + "aillent ensemble. ⛔ Vérifier que l'apprenti a bien une assiette "
          + "d'assurance chômage (base assujettie de type 07).");
      }

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 05/10 — LES LIGNES DES NOUVEAUX CAS
      //
      // Toutes lues dans le tableur d equivalence de l URSSAF, et presentes
      // dans le fichier de 1 831 lignes valide par dsn-val :
      //   863  mandataires sociaux — l equivalent du CTP 100 : la ligne 920
      //        porte le taux accidents du travail, la 921 l assiette plafonnee ;
      //   803  apprenti du secteur public, part sous le seuil : seule la
      //        cotisation accidents du travail est due ;
      //   518  apprenti du secteur public, part au-dela du seuil ;
      //   003  reduction salariale sur les heures supplementaires — MONTANT ;
      //   004  deduction patronale sur les heures supplementaires — MONTANT ;
      //   719  contribution patronale sur la rupture conventionnelle ;
      //   479  forfait social a 8 % sur la prevoyance.
      // ⚠️ ELLES N EXISTENT QUE SI LE CAS SE PRESENTE : pour un employeur
      // ordinaire, rien de tout cela ne s ecrit.
      // ═══════════════════════════════════════════════════════════════
      await ligneBordereau({ ctp: CTP_MANDATAIRE, qualifiant: "920", tauxAt: true,
        assiette: assiettesMandat["03"] || 0, quoi: "mandataires sociaux" });
      await ligneBordereau({ ctp: CTP_MANDATAIRE, qualifiant: "921",
        assiette: assiettesMandat["02"] || 0, quoi: "mandataires sociaux" });

      await ligneBordereau({ ctp: CTP_APPRENTI_PUBLIC_SOUS, qualifiant: "920", tauxAt: true,
        assiette: assiettesPublicSous["03"] || 0, quoi: "apprenti du secteur public" });
      await ligneBordereau({ ctp: CTP_APPRENTI_PUBLIC_AU_DELA, qualifiant: "920", tauxAt: true,
        assiette: assiettesPublicAuDela["03"] || 0, quoi: "apprenti du secteur public" });
      await ligneBordereau({ ctp: CTP_APPRENTI_PUBLIC_AU_DELA, qualifiant: "921",
        assiette: assiettesPublicAuDela["02"] || 0, quoi: "apprenti du secteur public" });

      await ligneBordereau({ ctp: CTP_REDUCTION_HS, qualifiant: "921",
        montant: reductionHsUrssaf, quoi: "réduction salariale sur les heures supplémentaires" });
      await ligneBordereau({ ctp: CTP_DEDUCTION_HS, qualifiant: "921",
        montant: deductionHsUrssaf, quoi: "déduction patronale sur les heures supplémentaires" });
      await ligneBordereau({ ctp: CTP_RUPTURE_CONV, qualifiant: "920",
        assiette: assietteRuptureConv, quoi: "contribution sur la rupture conventionnelle" });
      await ligneBordereau({ ctp: CTP_FORFAIT_SOCIAL_8, qualifiant: "920",
        assiette: assiettesCumulees["13"] || 0, quoi: "forfait social à 8 %" });

      // 🆕🚨 06/10 — FORMATION PROFESSIONNELLE, CPF-CDD, TAXE D APPRENTISSAGE,
      // DIALOGUE SOCIAL : une ligne par CTP, l assiette seule (format « E »).
      for (const ctpF of ORDRE_CTP_FORMATION) {
        let quoiF = "contribution de formation";
        for (const k of Object.keys(CTP_FORMATION)) {
          if (CTP_FORMATION[k].ctp === ctpF) quoiF = CTP_FORMATION[k].quoi;
        }
        await ligneBordereau({ ctp: ctpF, qualifiant: "920",
          assiette: assiettesFormation[ctpF] || 0, quoi: quoiF });
      }

      // 🆕🚨 06/10 — LE SOLDE DE LA TAXE D APPRENTISSAGE (DSN d avril) :
      // CTP 995, l assiette — la masse salariale de l annee precedente.
      if (soldeTa > 0) {
        await ligneBordereau({ ctp: "995", qualifiant: "920", assiette: masseSoldeTa,
          quoi: "solde de la taxe d'apprentissage" });
      }
      // 🆕 06/10 — SES DEDUCTIONS : format « F », le montant sans signe.
      if (deducCfaTa > 0) {
        await ligneBordereau({ ctp: "996", qualifiant: "921", montant: deducCfaTa,
          quoi: "déduction du solde de la taxe d'apprentissage, subventions aux CFA" });
      }
      if (deducAltTa > 0) {
        await ligneBordereau({ ctp: "997", qualifiant: "921", montant: deducAltTa,
          quoi: "déduction du solde de la taxe d'apprentissage, créance alternants" });
      }

      // 🆕🚨 06/10 — LES CONTRIBUTIONS CONVENTIONNELLES (CTP 844 et 845) :
      // le taux de la branche et l assiette (format « V »).
      for (const ctpC of ["844", "845"]) {
        const ac = assiettesConv[ctpC];
        if (!ac) continue;
        if (ac.tauxDivers) {
          anomalies.push("Contribution conventionnelle (CTP " + ctpC + ") : les salariés de l'établissement "
            + "ne portent pas tous le même taux — plusieurs conventions dans la même société. ⛔ Une seule "
            + "ligne est écrite, au taux " + tauxDsn(ac.taux) + " % : À VÉRIFIER avant dépôt.");
        }
        await ligneBordereau({ ctp: ctpC, qualifiant: "920", assiette: ac.assiette, taux: ac.taux, quoi: ac.quoi });
      }

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 22/09 — LE CONTROLE PAR LA TABLE DIDA DE L URSSAF
      //
      // 🚨 CE BLOC N ECRIT RIEN DANS LE FICHIER. Il compare ce que le
      // generateur vient de produire a ce que l URSSAF attend, et signale
      // les ecarts en anomalie. C est un garde-fou, pas une source.
      //
      // POURQUOI IL EXISTE : jusqu ici, chaque cas de paie nouveau —
      // l apprenti, demain le forfait jours ou une exoneration zonee —
      // revelait son manque au mieux dans dsn-val, au pire chez l URSSAF,
      // des mois plus tard, sous forme de redressement. La table DIDA dit
      // noir sur blanc, pour chaque CTP, quelles bases assujetties et quels
      // codes de cotisation individuelle doivent figurer en face. Autant
      // le lui demander a chaque generation.
      //
      // ⚠️ IL SIGNALE, IL NE CORRIGE PAS. Un code attendu peut manquer pour
      // une bonne raison — une cotisation a zero ne se declare pas, et
      // l exoneration de l apprenti remplace la part salariale qu il aurait
      // portee. C est au lecteur de trancher, pas au generateur.
      // ⛔ IL NE SE DECLENCHE QUE SI LA TABLE EST EN BASE : sans elle, rien
      // ne se passe et la generation suit son cours. On ne bloque jamais un
      // depot sur l absence d un referentiel de controle.
      // ═══════════════════════════════════════════════════════════════
      const listeCtp = Object.keys(ctpDeclares);
      if (listeCtp.length > 0) {
        const { data: attendu } = await supabase
          .from("urssaf_dida")
          .select("code_ctp, base_78, code_81, precisions")
          .in("code_ctp", listeCtp)
          .lte("date_effet", periode);

        if (attendu && attendu.length > 0) {
          const manques: string[] = [];
          const vus: Record<string, boolean> = {};

          for (const a of attendu) {
            const base = String((a as any).base_78 || "");
            const code = String((a as any).code_81 || "");
            if (!base || !code) continue;

            // ⛔ LES CODES D EXONERATION ET DE REDUCTION NE SE RECLAMENT
            // PAS : ils n existent que si le dispositif s applique, et leur
            // absence est la situation normale de la plupart des salaries.
            if (code === "001" || code === "002" || code === "003"
              || code === "018" || code === "106") continue;

            // 🆕 25/09 — NI LES CODES QUE LA TABLE RESERVE A UN CAS
            // PARTICULIER. Sa colonne « precisions » le dit en toutes
            // lettres : « Il convient d'utiliser le code de cotisation 073
            // en cas d'intéressement ». La table liste tout ce qui PEUT se
            // rattacher a un CTP, pas seulement ce qui DOIT y figurer : un
            // code conditionnel absent est la situation normale. Trouve le
            // 25/09 — l alerte du 073 etait une fausse alerte.
            const precision = String((a as any).precisions || "");
            if (/en cas d['’e]/i.test(precision)) continue;

            // 🆕 05/10 — LE FORFAIT SOCIAL (code 071) A DEUX BASES ADMISES :
            // la base propre a son taux (« 13 » pour 8 %) et, depuis 2023, la
            // base generale « 05 ». Le tableur liste les deux pour le meme
            // CTP : l une suffit, l autre n est pas un manque.
            if (code === "071" && (codes81Ecrits["13/071"] || codes81Ecrits["05/071"])) continue;

            const cle = base + "/" + code;
            if (codes81Ecrits[cle] || vus[cle]) continue;
            vus[cle] = true;
            manques.push("CTP " + (a as any).code_ctp + " → code " + code
              + " sur la base " + base);
          }

          if (manques.length > 0) {
            anomalies.push("⚠️ CONTRÔLE URSSAF (tableur d'équivalence DIDA) : "
              + manques.length + " code(s) de cotisation attendu(s) ne figurent "
              + "dans aucun bloc 81 — " + manques.slice(0, 8).join(" · ")
              + (manques.length > 8 ? " · …" : "")
              + ". ⚠️ CE N'EST PAS FORCÉMENT UNE ERREUR : une cotisation à zéro "
              + "ne se déclare pas, et une exonération remplace la part qu'elle "
              + "couvre. Mais c'est là que l'URSSAF regardera.");
          }
        }
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
  // 🆕🚨 05/10 — ══ S21.G00.15 — LES ADHESIONS PREVOYANCE ══
  //
  // 🚨 SA PLACE : sous l etablissement, APRES le bloc 11 et AVANT le
  // versement (20). On insere donc a la place reservee pour le bordereau,
  // APRES lui : inserees au meme endroit, ces lignes passent devant.
  // ⚠️ « PERSONNEL COUVERT » NE SE SAIT QU APRES LES SALARIES : « 01 » si au
  // moins une affiliation renvoie a l adhesion, « 02 » sinon (CCH-13 et
  // CCH-14). Une adhesion « 02 » se declare quand meme : c est elle qui
  // fait parvenir la DSN a l organisme un mois sans salarie couvert.
  // ═══════════════════════════════════════════════════════════════════
  {
    const A15: string[] = [];
    const ecrireA = function (ref: string, valeur: any) {
      const v = latin(valeur);
      if (v === "") return;
      A15.push(ref + ",'" + v + "'");
    };
    for (const adh of adhesions) {
      ecrireA("S21.G00.15.001", adh.reference);
      ecrireA("S21.G00.15.002", adh.code);
      if (adh.delegataire) ecrireA("S21.G00.15.003", adh.delegataire);
      ecrireA("S21.G00.15.004", adh.couvert ? "01" : "02");
      ecrireA("S21.G00.15.005", String(adh.id));
    }
    // 🆕 06/10 — le bloc 82 (cotisation etablissement) se place APRES les
    // adhesions (15) et AVANT le versement (20) : on l insere donc d abord.
    if (C82.length > 0) L.splice(posBordereau, 0, ...C82);
    if (A15.length > 0) L.splice(posBordereau, 0, ...A15);

    for (const cleG of Object.keys(garantiesIncompletes)) {
      const gi = garantiesIncompletes[cleG];
      anomalies.push(gi.quoi + " : le code de l'organisme et la référence du "
        + "contrat ne sont pas renseignés. ⛔ COTISATION NON DÉCLARÉE pour "
        + gi.nb + " salarié(s) (" + montantDsn(gi.montant) + " EUR). Les "
        + "saisir dans l'écran DSN : « Mutuelle et prévoyance », bouton "
        + "« pour la DSN », puis régénérer.");
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
        + "REJETÉ. Le renseigner sur la fiche du dossier "
        + "(« Mes dossiers » → « Sa fiche » → bloc « L'employeur — pour la paie et la DSN », « Code INSEE de la commune »).");
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

  // 🆕 01/10 — LES GENERATIONS NON DEPOSEES DU MEME MOIS SONT REMPLACEES :
  // la nouvelle porte le meme numero et prend leur place. On ne touche
  // jamais a une declaration deposee ou acceptee.
  // ⚠️ APRES l archivage du nouveau fichier, et juste avant de l enregistrer :
  // si la generation echouait plus haut, l ancien brouillon resterait.
  const { error: eRemp } = await supabase
    .from("dsn_declarations")
    .delete()
    .eq("societe_id", societeId)
    .eq("periode", periode)
    .eq("nature", "01")
    .in("statut", ["brouillon", "controlee"])
    .gte("numero_ordre", ordre);
  if (eRemp) {
    return NextResponse.json({ erreur: "le nouveau fichier est archivé (" + chemin
      + "), mais l'ancien brouillon du mois n'a pas pu être remplacé : " + eRemp.message }, { status: 500 });
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

  // 🆕 20/09 — ce que les arrets de travail demandent de relire.
  for (const n of notesArrets) avantDepot.push(n);

  // 🆕 05/10 — ce que la mutuelle et la prevoyance demandent de relire.
  // 🆕 05/10 — CES RAPPELS SONT REDIGES POUR CELUI QUI FAIT LA PAIE, PAS POUR
  // CELUI QUI LIT LA NORME : ni numero de rubrique, ni nom de bloc. Ce qui
  // doit se voir dans le fichier se dit dans une anomalie, pas ici.
  if (adhesions.length > 0) {
    avantDepot.push("Mutuelle et prévoyance : " + adhesions.length
      + (adhesions.length > 1 ? " contrats déclarés" : " contrat déclaré") + ", "
      + nbAffiliations + (nbAffiliations > 1 ? " salariés couverts" : " salarié couvert")
      + ". Avant le premier dépôt réel, comparer le code de l'organisme et la "
      + "référence du contrat avec la fiche de paramétrage DSN que l'organisme "
      + "vous a remise.");
    avantDepot.push("Cette déclaration ne paie pas la mutuelle ni la "
      + "prévoyance : leurs cotisations se règlent directement auprès de "
      + "l'organisme.");
  }
  for (const n of notesPrevoyance) avantDepot.push(n);

  avantDepot.push("Avant tout dépôt, passer le fichier dans dsn-val, l'outil "
    + "de contrôle officiel : il est gratuit, se télécharge sur "
    + "net-entreprises.fr et s'installe sur un ordinateur.");

  if (modeReel) {
    avantDepot.push("🚨 Ce fichier est un fichier RÉEL : une fois déposé, il "
      + "déclare pour de vrai.");
  } else {
    avantDepot.push("Ce fichier est un fichier d'essai : déposé, il est "
      + "contrôlé mais ne déclare rien, et peut l'être autant de fois que "
      + "voulu. Le mode réel s'active au moment du premier vrai dépôt.");
  }

  if (regimeAgricole) {
    avantDepot.push("Régime agricole : ce fichier se dépose auprès de la MSA.");
  }
  for (const n of notesTa) avantDepot.push(n);

  if (nbTauxPersonnalises === 0) {
    avantDepot.push("Prélèvement à la source : tous les salariés sont au taux "
      + "de la grille officielle. Les taux personnalisés arrivent dans le "
      + "compte rendu de l'administration après le premier dépôt ; ils se "
      + "reportent sur chaque salarié, avec leur date d'effet : écran de paie "
      + "→ ligne « Prélèvement à la source ».");
  } else {
    const nbGrille = bulletins.length - nbTauxPersonnalises;
    avantDepot.push("Prélèvement à la source : " + nbTauxPersonnalises
      + (nbTauxPersonnalises > 1 ? " salariés au taux personnalisé" : " salarié au taux personnalisé")
      + ", " + nbGrille + " au taux de la grille officielle.");
  }

  if (totalReductions > 0) {
    avantDepot.push("La réduction générale des cotisations patronales est "
      + "partagée entre l'URSSAF et la retraite complémentaire, au prorata "
      + "des cotisations qu'elle réduit : règle à confirmer auprès de "
      + "l'URSSAF avant le premier dépôt réel.");
  }
  avantDepot.push("Vérifier le code de profession (PCS-ESE) de chaque "
    + "salarié : un code faux n'empêche pas le dépôt, mais il classe le "
    + "salarié dans le mauvais métier.");
  // 🆕 25/09 — DEUX RESERVES PERIMEES RETIREES : elles affirmaient que les
  // primes n etaient pas declarees en bloc 52 et que le salaire retabli
  // valait le brut. Les deux sont faits depuis le 20/09 (bloc 52 lu dans
  // detail.lignes_mission, type 003 lu dans detail.salaire_retabli). Une
  // reserve fausse est pire que pas de reserve : elle fait douter du vrai.

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
