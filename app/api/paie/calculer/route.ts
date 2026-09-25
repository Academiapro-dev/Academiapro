import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 16/09 — LE CALCUL NE SE MET JAMAIS EN RESERVE
//
// DEFAUT TROUVE A L ESSAI, ET IL EST PLUS GRAVE QU IL N EN A L AIR : apres
// avoir corrige les libelles EN BASE, l ecran continuait de rendre les
// anciens. La base etait juste, le code etait juste — c est la couche de
// cache de Vercel, DEVANT la fonction, qui resservait une reponse calculee
// avant la correction.
//
// ⚠️ `force-dynamic` NE SUFFIT PAS : il empeche Next de pre-rendre la
// route, il n empeche pas un intermediaire de garder sa reponse. Il faut
// le dire dans les EN-TETES de la reponse elle-meme.
// ⚠️ AJOUTER `?v=2` A L ADRESSE NE CONTOURNE QUE SAFARI. Sur un cache
// serveur, la nouvelle adresse est simplement mise en reserve a son tour :
// c est ce qui a fait perdre trois essais.
//
// 🚨 LES LIBELLES N ETAIENT QUE LA PARTIE VISIBLE. Le meme cache aurait
// resservi un MONTANT : changer un taux en base et recalculer aurait rendu
// l ancien bulletin, sans qu aucun ecran ne le signale. Sur une paie, c est
// un redressement.
//
// ⛔ CES QUATRE LIGNES ET LES EN-TETES `sansCache()` NE SE RETIRENT PAS.
// ═══════════════════════════════════════════════════════════════════════

// ⚠️ TROIS EN-TETES, PAS UN : `Cache-Control` pour ce qui respecte la norme
// actuelle, `Pragma` et `Expires` pour les intermediaires plus anciens qui
// l ignorent. Un seul des trois laisse passer certains caches.
const SANS_CACHE: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

// ═══════════════════════════════════════════════════════════════════════
// LE MOTEUR DE PAIE — 15/09/2026, corrige le 16/09
//
// Il prend un contrat et une periode, et rend un bulletin : le brut, chaque
// ligne de cotisation avec son assiette et son taux, le net imposable, le
// net a payer, le cout employeur.
//
// 🚨 IL NE CONNAIT AUCUN TAUX. Tout vient de la base — paie_parametres,
// paie_cotisations, paie_regles_mission — LUES A LA DATE DE LA PERIODE.
// C est la decision du 08/09 : « ca change tout le temps » (Didier). Un
// taux ecrit en dur ici obligerait a redeployer pour le corriger, et
// rendrait impossible de recalculer un bulletin de l an dernier.
//
// 🚨 LE CONTRAT DE MISSION EST TRAITE EN PREMIER — arbitrage de Jacques.
// C est la brique de Mr Interim (C001), et elle sert ensuite Mr Comptable.
//
// ⛔ AUCUN BULLETIN NE PART CHEZ UN CLIENT tant qu il n a pas ete controle
// AU CENTIME contre un bulletin reel. Cette route calcule ; elle ne
// certifie rien.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 LES CINQ PIEGES DE LA PAIE, ET COMMENT ILS SONT TRAITES ICI
//
// 1. L ASSIETTE N EST PAS TOUJOURS LE BRUT.
//    La vieillesse plafonnee s arrete au plafond. La CSG porte sur 98,25 %
//    du brut. La tranche 2 commence au plafond et s arrete a huit fois.
//    ⚠️ SE TROMPER D ASSIETTE DONNE UN BULLETIN FAUX QUI A L AIR JUSTE :
//    les montants sont plausibles, rien ne saute aux yeux, et l erreur se
//    decouvre au controle trois ans plus tard.
//
// 2. L ORDRE DE CALCUL COMPTE.
//    L ICCP se calcule sur un total QUI INCLUT L IFM. Inverser les deux
//    donne un ecart de 1 % sur l indemnite — invisible a l oeil.
//
// 3. LE NET IMPOSABLE N EST PAS LE NET A PAYER.
//    La CSG non deductible (2,40 %) et la CRDS (0,50 %) sont retenues sur
//    le salaire MAIS restent imposables. C est pourquoi le net imposable
//    est SUPERIEUR au net verse. Un salarie qui declare son net a payer
//    sous-declare ses revenus.
//
// 4. CERTAINS ELEMENTS NE SONT PAS SOUMIS A COTISATIONS.
//    Un remboursement de frais reels, un panier dans la limite du bareme.
//    Ils entrent dans le net a payer sans passer par le brut soumis.
//
// 5. LES ARRONDIS.
//    🚨 ON ARRONDIT CHAQUE LIGNE AU CENTIME, PAS SEULEMENT LE TOTAL. C est
//    ainsi que le fait un bulletin officiel : le total imprime doit etre
//    exactement la somme des lignes imprimees. Arrondir a la fin donne un
//    total qui ne correspond pas a l addition visible — et c est la
//    premiere chose qu un salarie mefiant recalcule.
// ═══════════════════════════════════════════════════════════════════════

// LES COTISATIONS QUE LA RGDU PEUT REDUIRE.
//
// 🚨 LA REDUCTION NE PEUT PAS DEPASSER CE QUI EST EFFECTIVEMENT DU SUR CES
// COTISATIONS-LA. C est une limite legale, pas un garde-fou de confort :
// une reduction superieure est un trop-deduit que l URSSAF reclame.
//
// ⚠️ CE QUI N EST PAS DANS LA LISTE, ET POURQUOI :
//   · AGS         hors champ
//   · CSA         hors champ
//   · CET, APEC   hors champ
//   · AT/MP       hors champ — la RGDU ne le reduit pas
//   · CSG, CRDS   ce sont des contributions SALARIALES
// ⚠️ LE FNAL Y EST, ainsi que la retraite complementaire (part patronale) :
// c est la nouveaute de la RGDU par rapport a l ancienne reduction Fillon.
const ELIGIBLES_RGDU = [
  "MALADIE",
  "VIEILLESSE_PLAF",
  "VIEILLESSE_DEPLAF",
  "ALLOC_FAM",
  "CHOMAGE",
  "FNAL_MOINS50",
  "FNAL_50PLUS",
  "RETRAITE_C_T1",
  "RETRAITE_C_T2",
  "CEG_T1",
  "CEG_T2",
];

// 🆕 16/09 — LES COTISATIONS QUI S AFFICHENT MEME A ZERO.
//
// 🚨 DEFAUT TROUVE A L ESSAI : l AT/MP DISPARAISSAIT PUREMENT ET SIMPLEMENT
// du bulletin quand aucun taux n etait renseigne, parce que la ligne valait
// zero des deux cotes. Un bulletin francais sans ligne accidents du travail
// n est pas un bulletin incomplet a l oeil : il est SILENCIEUX. Personne ne
// cherche une ligne qu il ne sait pas manquante.
// ⚠️ ELLE S AFFICHE DONC A ZERO, AVEC SON ALERTE, jusqu a ce que le taux
// CARSAT soit renseigne dans paie_taux_societe.
const TOUJOURS_VISIBLES = ["AT_MP"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// 🚨 L ARRONDI AU CENTIME, PARTOUT ET TOUJOURS.
// ⚠️ `Math.round(x * 100) / 100` seul souffre des erreurs de virgule
// flottante : 1.005 * 100 vaut 100.49999999999999 en JavaScript, et
// l arrondi rend 1,00 au lieu de 1,01. Le passage par une chaine corrige
// ce cas, qui arrive sur des montants parfaitement ordinaires.
function cts(x: number): number {
  return Math.round(Number((x + Number.EPSILON).toFixed(4)) * 100) / 100;
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 22/09 — L APPRENTISSAGE
//
// Trois fonctions PURES : elles ne lisent rien, elles calculent. C est ce
// qui permet de les eprouver sur des cas chiffres sans toucher a la base.
//
// 🚨 CE QU IL FAUT SAVOIR AVANT DE TOUCHER A CE BLOC, parce que trois
// idees repandues sont FAUSSES depuis 2019 :
//   ⛔ L ASSIETTE FORFAITAIRE N EXISTE PLUS. Depuis le 1er janvier 2019 les
//      cotisations sont calculees sur le SALAIRE REEL de l apprenti.
//   ⛔ L EMPLOYEUR N A PLUS D EXONERATION PROPRE (secteur prive). Il cotise
//      comme pour n importe quel salarie et beneficie de la reduction
//      generale — que le moteur calcule deja. RIEN A FAIRE COTE PATRONAL.
//   ⛔ L EXONERATION SALARIALE N EST PLUS DE 79 %. Elle est de 50 % du SMIC
//      pour tout contrat dont le PREMIER JOUR D EXECUTION est le 01/03/2025
//      ou apres, et la CSG-CRDS est alors due sur la fraction excedentaire.
//      Les contrats anterieurs gardent 79 % et une exoneration TOTALE de
//      CSG-CRDS.
// ═══════════════════════════════════════════════════════════════════════

// ⚠️ LA DATE A PARTIR DE LAQUELLE LE SEUIL EST TOMBE A 50 %. Elle est en
// dur parce que c est une date de reforme, pas un reglage : elle ne bougera
// que si la loi change, et alors le code changera avec elle.
const APPRENTI_BASCULE_50 = "2025-03-01";

// L AGE RETENU POUR LE MOIS.
//
// 🚨 ARTICLE D6222-31 : la majoration liee a l age prend effet LE PREMIER
// JOUR DU MOIS SUIVANT l anniversaire des 18, 21 ou 26 ans. Un apprenti qui
// a 18 ans le 15 mars reste donc paye au taux des moins de 18 ans pour tout
// le mois de mars, et passe au taux superieur le 1er avril.
// ⚠️ CELA REVIENT EXACTEMENT A PRENDRE L AGE REVOLU AU PREMIER JOUR DU
// MOIS — et c est pour cela que la regle, qui a l air compliquee, tient en
// une ligne.
function ageApprentiAuMois(dateNaissance: string, periode: string): number | null {
  const n = String(dateNaissance || "");
  const p = String(periode || "");
  if (n.length < 10 || p.length < 10) return null;
  const an = Number(n.slice(0, 4));
  const mo = Number(n.slice(5, 7));
  const jo = Number(n.slice(8, 10));
  const ap = Number(p.slice(0, 4));
  const mp = Number(p.slice(5, 7));
  if (!an || !mo || !jo || !ap || !mp) return null;
  // Le premier jour du mois de paie.
  let age = ap - an;
  if (mp < mo || (mp === mo && 1 < jo)) age -= 1;
  return age >= 0 ? age : null;
}

// L ANNEE D EXECUTION DU CONTRAT.
//
// 🚨 ELLE AVANCE A LA DATE ANNIVERSAIRE DU CONTRAT, pas au 1er janvier ni a
// la rentree scolaire. Un contrat commence le 01/09/2026 est en 1re annee
// jusqu au 31/08/2027.
// ⚠️ RETENUE AU PREMIER JOUR DU MOIS, deliberement. Quand l anniversaire du
// contrat tombe en cours de mois, le mois est a cheval sur deux annees
// d execution : le moteur ne tranche pas seul et POSE UNE RESERVE — un
// prorata se decide, il ne se devine pas.
// ⚠️ PLAFONNEE A 3 : le bareme legal ne va pas au-dela. Une quatrieme annee
// (redoublement, cursus long) se paie au taux de la troisieme.
function anneeExecutionApprenti(dateDebut: string, periode: string): number | null {
  const d = String(dateDebut || "");
  const p = String(periode || "");
  if (d.length < 10 || p.length < 10) return null;
  const ad = Number(d.slice(0, 4));
  const md = Number(d.slice(5, 7));
  const ap = Number(p.slice(0, 4));
  const mp = Number(p.slice(5, 7));
  if (!ad || !md || !ap || !mp) return null;
  const moisEcoules = (ap - ad) * 12 + (mp - md);
  if (moisEcoules < 0) return null;
  const annee = Math.floor(moisEcoules / 12) + 1;
  return Math.min(3, annee);
}

// L ANNIVERSAIRE DU CONTRAT TOMBE-T-IL EN COURS DE MOIS ?
// Sert uniquement a poser la reserve : le mois est alors a cheval sur deux
// taux, et le bulletin le dit plutot que de choisir en silence.
function changementAnneeDansLeMois(dateDebut: string, periode: string): boolean {
  const d = String(dateDebut || "");
  const p = String(periode || "");
  if (d.length < 10 || p.length < 10) return false;
  const jd = Number(d.slice(8, 10));
  if (jd <= 1) return false;
  const md = Number(d.slice(5, 7));
  const ad = Number(d.slice(0, 4));
  const mp = Number(p.slice(5, 7));
  const ap = Number(p.slice(0, 4));
  // Meme mois calendaire que le debut, mais une annee au moins plus tard.
  return mp === md && ap > ad;
}

// LE SEUIL D EXONERATION DU MOIS.
//
// 🚨 IL SE PRORATISE A LA DUREE DU TRAVAIL (BOSS, paragraphe 120) : un
// apprenti a mi-temps n a pas droit au meme seuil en euros qu un apprenti a
// plein temps, sans quoi il serait exonere sur la totalite de son salaire.
// ⚠️ LE SMIC RETENU EST CELUI QUI PAIE (12,31 depuis juin 2026), PAS celui
// de la reduction generale, gele a 12,02 pour l annee. Les deux coexistent
// en base et les confondre fausserait le seuil de plusieurs dizaines
// d euros.
function seuilExoApprenti(p: {
  smic_mensuel: number;
  taux: number;
  proportion_temps: number;
}): number {
  const s = Number(p.smic_mensuel || 0);
  const t = Number(p.taux || 0);
  const q = Number(p.proportion_temps || 1);
  if (s <= 0 || t <= 0) return 0;
  return cts(s * (t / 100) * (q > 0 ? q : 1));
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕 20/09 — LE TAUX DE VERSEMENT MOBILITE, LU PAR COMMUNE
//
// Jusqu ici il fallait le taper a la main dans `paie_taux_societe`. La
// table des taux transport de l URSSAF le donne, commune par commune : la
// doctrine est de le lire, pas de le faire saisir.
//
// 🚨 UNE COMMUNE PEUT AVOIR PLUSIEURS AUTORITES. Mesure du 19/09 : 76
// communes portent deux lignes a la meme date, l une pour l autorite
// organisatrice, l autre pour le syndicat mixte. LE TAUX APPLICABLE EST LA
// SOMME. Exemple mesure : la commune 60002 porte 0,6 et 0,2 au 01/03/2019.
//
// ⚠️ ON NE PREND PAS SIMPLEMENT LA LIGNE LA PLUS RECENTE. Si l autorite a
// change son taux en 2024 et le syndicat en 2019, ne garder que 2024
// ferait disparaitre le syndicat. On regroupe donc PAR AUTORITE (le
// libelle), on garde pour chacune sa ligne en vigueur a la periode, et on
// additionne.
//
// 🚨 « A LA DATE DE LA PERIODE », comme partout ailleurs : un bulletin de
// mars se calcule avec le taux de mars, pas avec celui d aujourd hui.
// ═══════════════════════════════════════════════════════════════════════
async function tauxVersementMobilite(insee: string, periode: string): Promise<any> {
  if (!insee) return { taux: null, detail: [] };

  const { data, error } = await supabase
    .from("urssaf_vm_communes")
    .select("code_insee, libelle, taux_aot, taux_syndicat, date_effet")
    .eq("code_insee", insee)
    .lte("date_effet", periode)
    .order("date_effet", { ascending: false });

  // ⚠️ UNE LECTURE QUI ECHOUE N EST PAS UN TAUX A ZERO. On rend `null` :
  // le calcul s abstient et la reserve le dit, au lieu de facturer zero
  // en silence.
  if (error) return { taux: null, erreur: error.message, detail: [] };
  if (!data || data.length === 0) return { taux: 0, detail: [], aucune: true };

  // Pour chaque autorite, la ligne la plus recente qui precede la periode.
  const parAutorite: any = {};
  for (const l of data) {
    const cle = String(l.libelle || "(sans libellé)");
    if (!parAutorite[cle]) parAutorite[cle] = l;
  }

  let total = 0;
  const detail: any[] = [];
  for (const cle of Object.keys(parAutorite)) {
    const l = parAutorite[cle];
    const t = Number(l.taux_aot || 0) + Number(l.taux_syndicat || 0);
    total += t;
    detail.push({
      autorite: cle,
      taux: t,
      depuis: String(l.date_effet).slice(0, 10),
    });
  }

  return { taux: Math.round(total * 10000) / 10000, detail: detail };
}

// LIRE UN PARAMETRE A LA DATE DE LA PERIODE.
//
// 🚨 « A LA DATE », PAS « LA DERNIERE VALEUR ». Un bulletin de mars 2026 se
// calcule avec le SMIC de janvier (12,02), pas celui de juin (12,31). C est
// toute la raison d etre des dates d effet.
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 20/09 — LE MAINTIEN DE SALAIRE EN MALADIE : LE CALCUL, SANS LA BASE
//
// Fonction PURE : elle ne lit rien, elle calcule. C est ce qui permet de
// l eprouver sur des cas chiffres sans toucher a un seul bulletin.
//
// LE PRINCIPE, commun a la loi et aux conventions :
//   1. l employeur maintient un POURCENTAGE du salaire que l absence a
//      retire — 100 % puis 80 % en Syntec, 90 % puis 66,66 % selon la loi ;
//   2. ce pourcentage s entend INDEMNITES JOURNALIERES COMPRISES : on en
//      deduit donc les IJSS brutes des jours couverts ;
//   3. le salarie ne peut jamais toucher plus qu en travaillant : la
//      deduction est bornee par le maintien, jamais l inverse.
//
// 🚨 DEUX CALENDRIERS SE CROISENT. Le salaire se retient en jours
// TRAVAILLES (lundi-vendredi), les IJSS se versent en jours CALENDAIRES,
// samedi et dimanche compris. Le rang d un jour dans l arret — qui decide
// de la carence et du palier — se compte en jours calendaires depuis le
// PREMIER JOUR DE L ARRET, pas depuis le debut du mois.
// ═══════════════════════════════════════════════════════════════════════
type RegleMaintien = {
  ancienneteMois: number; carenceJours: number;
  jours1: number; taux1: number; jours2: number; taux2: number;
  origine: string;
};

function maintienSalaire(p: {
  debutArret: string; d1: string; d2: string;
  retenue: number; joursAbs: number; ancienneteMois: number;
  regle: RegleMaintien; ijJour: number; ijssCarence: number;
}) {
  const res = { droit: false, raison: "", maintien: 0, ijss: 0,
    joursIjss: 0, jours1: 0, jours2: 0 };

  if (p.ancienneteMois < p.regle.ancienneteMois) {
    res.raison = "ancienneté de " + p.ancienneteMois + " mois à la date de "
      + "l'arrêt, " + p.regle.ancienneteMois + " exigés (" + p.regle.origine + ")";
    return res;
  }
  if (p.joursAbs <= 0 || p.retenue <= 0) return res;
  res.droit = true;

  const parJour = p.retenue / p.joursAbs;
  const t0 = new Date(p.debutArret + "T00:00:00Z").getTime();
  const d = new Date(p.d1 + "T00:00:00Z");
  const f = new Date(p.d2 + "T00:00:00Z").getTime();
  let maintien = 0;
  let ijss = 0;

  while (d.getTime() <= f) {
    const rang = Math.round((d.getTime() - t0) / 86400000);   // 0 = 1er jour
    let taux = 0;
    const r = rang - p.regle.carenceJours;
    if (r >= 0 && r < p.regle.jours1) taux = p.regle.taux1;
    else if (r >= p.regle.jours1 && r < p.regle.jours1 + p.regle.jours2) taux = p.regle.taux2;

    const jour = d.getUTCDay();
    if (taux > 0 && jour >= 1 && jour <= 5) {
      maintien += parJour * taux / 100;
      if (taux === p.regle.taux1) res.jours1 += 1; else res.jours2 += 1;
    }
    // Les IJSS des jours COUVERTS par le maintien se deduisent, week-end
    // compris ; celles des jours non couverts restent au salarie.
    if (taux > 0 && rang >= p.ijssCarence) {
      ijss += p.ijJour;
      res.joursIjss += 1;
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }

  res.maintien = Math.round(maintien * 100) / 100;
  // ⛔ LA DEDUCTION NE DEPASSE JAMAIS LE MAINTIEN : le complement de
  // l employeur peut etre nul, il n est jamais negatif.
  res.ijss = Math.min(Math.round(ijss * 100) / 100, res.maintien);
  return res;
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕 25/09 — LES ARRETS DEJA INDEMNISES SUR DOUZE MOIS
//
// Article D1226-4 du code du travail : pour le calcul des indemnites, « il
// est tenu compte des indemnites deja percues par l interesse durant les
// douze mois anterieurs, de telle sorte que, si plusieurs absences pour
// maladie ou accident ont ete indemnisees au cours de ces douze mois, la
// duree totale d indemnisation ne depasse pas celle applicable ».
// Jusqu au 25/09, chaque arret repartait de zero : un salarie arrete trois
// fois dans l annee touchait trois fois la duree pleine.
//
// FONCTION PURE : on lui donne les arrets precedents (debut, fin, et si le
// salarie avait droit au maintien a leur date) et elle rend le nombre de
// jours CALENDAIRES deja indemnises dans les douze mois qui precedent le
// premier jour de l arret en cours. Chaque arret subit sa propre carence ;
// le total ne depasse jamais la duree totale de la regle.
// ⚠️ Seuls les arrets du MEME CONTRAT sont lus : un arret indemnise sous
// un contrat precedent chez le meme employeur n est pas compte (reserve).
// ═══════════════════════════════════════════════════════════════════════
function joursDejaIndemnises(p: {
  debutArret: string;
  anterieurs: { debut: string; fin: string; droit: boolean }[];
  carenceJours: number;
  total: number;
}): number {
  const jour = 86400000;
  const tArret = new Date(p.debutArret + "T00:00:00Z").getTime();
  const fenetre = new Date(p.debutArret + "T00:00:00Z");
  fenetre.setUTCFullYear(fenetre.getUTCFullYear() - 1);
  const tFenetre = fenetre.getTime();
  const tries = p.anterieurs.slice().sort(function (a, b) { return a.debut < b.debut ? -1 : 1; });
  let consommes = 0;
  for (const a of tries) {
    if (!a.droit || !a.debut || !a.fin) continue;
    const t0 = new Date(a.debut + "T00:00:00Z").getTime();
    let tf = new Date(a.fin + "T00:00:00Z").getTime();
    if (isNaN(t0) || isNaN(tf)) continue;
    if (tf >= tArret) tf = tArret - jour;          // jamais au-dela de la veille de l arret en cours
    for (let t = t0; t <= tf; t += jour) {
      if (consommes >= p.total) return consommes;
      const rang = Math.round((t - t0) / jour);
      if (rang < p.carenceJours) continue;          // la carence de CET arret
      if (t < tFenetre) continue;                   // hors des douze mois
      consommes += 1;
    }
  }
  return Math.min(consommes, p.total);
}

async function parametre(code: string, periode: string): Promise<number | null> {
  const { data } = await supabase
    .from("paie_parametres")
    .select("valeur")
    .eq("code", code)
    .lte("date_effet", periode)
    .or("date_fin.is.null,date_fin.gte." + periode)
    .order("date_effet", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? Number(data.valeur) : null;
}

// L ASSIETTE D UNE COTISATION.
//
// 🚨 C EST LA FONCTION LA PLUS DELICATE DU MOTEUR. Chaque type d assiette
// est une regle differente, et il n y a aucun moyen de deviner : il faut
// les connaitre.
function assiette(type: string, brut: number, plafond: number): number {
  switch (type) {
    // La totalite du brut soumis.
    case "brut":
      return brut;

    // ⚠️ PLAFONNEE : ce qui depasse le plafond n est PAS cotise.
    case "plafonne":
    case "tranche_a":
      return Math.min(brut, plafond);

    // ⚠️ TRANCHE 2 : de 1 a 8 plafonds. Elle vaut ZERO tant que le brut
    // n atteint pas le plafond — et c est normal, pas un defaut.
    case "tranche_b":
      if (brut <= plafond) return 0;
      return Math.min(brut, plafond * 8) - plafond;

    // 🚨 CSG : 98,25 % du brut dans la limite de 4 plafonds, 100 % au-dela.
    // L abattement de 1,75 % represente les frais professionnels.
    case "csg": {
      const limite = plafond * 4;
      if (brut <= limite) return brut * 0.9825;
      return limite * 0.9825 + (brut - limite);
    }

    default:
      return brut;
  }
}

// LE CALCUL COMPLET.
async function calculer(contratId: string, periode: string): Promise<any> {
  // ---- LE CONTRAT ----
  const { data: contrat, error: errC } = await supabase
    .from("paie_contrats")
    .select("*, paie_salaries(*)")
    .eq("id", contratId)
    .maybeSingle();

  if (errC) return { erreur: errC.message };
  if (!contrat) return { erreur: "contrat introuvable" };

  // ---- LA SOCIETE ----
  // 🚨 L EFFECTIF COMMANDE DEUX CHOSES : le taux et l assiette du FNAL, et
  // le Tdelta de la RGDU. Inconnu, il vaut 0 — donc « moins de 50 » — et
  // la reserve le dit franchement.
  const { data: societe } = await supabase
    .from("compta_societes")
    .select("effectif, code_insee")
    .eq("id", contrat.societe_id)
    .maybeSingle();

  const effectif = societe && societe.effectif ? Number(societe.effectif) : 0;
  const effectifConnu = !!(societe && societe.effectif);

  // ═════════════════════════════════════════════════════════════════════
  // 🆕 20/09 — L ASSUJETTISSEMENT AU VERSEMENT MOBILITE
  //
  // 🚨 IL NE SE CALCULE PAS. Le versement mobilite est du par les
  // employeurs de onze salaries et plus dans le ressort d une autorite
  // organisatrice — mais l effectif retenu est la MOYENNE ANNUELLE DE
  // L ANNEE PRECEDENTE, et depuis 2020 le franchissement du seuil ne
  // produit effet que s il est atteint CINQ ANNEES CIVILES CONSECUTIVES :
  // l employeur devient redevable au 1er janvier de la sixieme.
  // ⛔ NOUS N AVONS NI LA MOYENNE ANNUELLE NI CINQ ANS D HISTORIQUE. Un
  // effectif instantane de douze ne prouve donc RIEN — ni dans un sens ni
  // dans l autre.
  //
  // C est l employeur qui sait, comme pour l URSSAF de rattachement. Tant
  // qu il n a pas repondu, la cotisation vaut ZERO et la reserve le dit :
  // facturer un versement qui n est pas du coute de l argent au client,
  // l oublier se rattrape par une regularisation.
  //
  // ⚠️ LECTURE SEPAREE ET TOLERANTE : si la colonne n existe pas encore,
  // le calcul de paie continue. ⛔ NE JAMAIS METTRE CETTE COLONNE DANS LE
  // SELECT PRINCIPAL : une colonne absente ferait echouer toute la lecture
  // de la societe, donc tout le bulletin.
  // ═════════════════════════════════════════════════════════════════════
  let vmAssujetti: any = null;
  let vmColonneAbsente = false;
  {
    const { data: vmSoc, error: eVm } = await supabase
      .from("compta_societes")
      .select("vm_assujetti")
      .eq("id", contrat.societe_id)
      .maybeSingle();
    if (eVm) vmColonneAbsente = true;
    else if (vmSoc && vmSoc.vm_assujetti !== null
      && vmSoc.vm_assujetti !== undefined) {
      vmAssujetti = vmSoc.vm_assujetti === true;
    }
  }

  // ---- LA COMMUNE QUI COMMANDE LE TAUX ----
  //
  // 🚨 C EST LE LIEU DE TRAVAIL REEL, PAS LE SIEGE. La Cour de cassation
  // l a rappele en 2025 sur les salaries itinerants : le rattachement
  // administratif au siege ne vaut pas.
  // ⚠️ TROIS SOURCES, DANS CET ORDRE, ET ON DIT LAQUELLE A SERVI : le
  // contrat d abord, l entreprise utilisatrice ensuite pour une mission,
  // l etablissement employeur en dernier recours.
  let inseeVm = String(contrat.lieu_travail_insee || "").trim();
  let origineInsee = "lieu de travail du contrat";
  if (!inseeVm) {
    inseeVm = String(contrat.eu_code_insee || "").trim();
    origineInsee = "commune de l'entreprise utilisatrice";
  }
  if (!inseeVm) {
    inseeVm = String((societe && societe.code_insee) || "").trim();
    origineInsee = "commune de l'établissement employeur, faute de mieux";
  }
  if (!inseeVm) origineInsee = "";

  const vmLu = await tauxVersementMobilite(inseeVm, periode);

  // ---- LES TAUX PROPRES A CETTE SOCIETE ----
  //
  // 🚨 L AT/MP ET LE VERSEMENT MOBILITE NE SONT PAS LES MEMES POUR TOUT LE
  // MONDE. L AT/MP est notifie chaque annee par la CARSAT selon l activite
  // et la sinistralite ; le versement mobilite depend de la commune du lieu
  // de travail et n est du qu a partir de onze salaries dans le ressort.
  // ⛔ AUCUNE VALEUR PAR DEFAUT N EST APPLIQUEE : un taux invente, meme
  // plausible, donne un bulletin faux et un redressement. Quand le taux
  // manque, la cotisation vaut zero et la reserve le dit.
  const tauxSociete: any = {};
  const { data: tauxPropres } = await supabase
    .from("paie_taux_societe")
    .select("code, taux, ressort")
    .eq("societe_id", contrat.societe_id)
    .lte("date_effet", periode)
    .or("date_fin.is.null,date_fin.gte." + periode)
    .order("date_effet", { ascending: false });

  for (const t of (tauxPropres || [])) {
    // ⚠️ LE PREMIER GAGNE : la requete est triee par date d effet
    // decroissante, donc c est le taux en vigueur a la periode.
    if (!tauxSociete[String(t.code)]) {
      tauxSociete[String(t.code)] = Number(t.taux);
    }
  }

  // ---- LES PARAMETRES DE LA PERIODE ----
  const plafond = await parametre("PMSS", periode);
  const dureeMensuelle = await parametre("DUREE_MENSUELLE", periode);

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — LE TEMPS PARTIEL
  //
  // ⛔ JUSQU ICI LE MOTEUR SUPPOSAIT 35 HEURES A TOUT LE MONDE. Un salarie
  // a 24 heures voyait son salaire de base calcule sur 151,67 h, et son
  // SMIC de reference — celui de la reduction generale — pris a taux plein :
  // paye moitie moins que le SMIC mensuel, il recevait le coefficient
  // MAXIMAL de reduction. L URSSAF reclame la difference.
  //
  // 🚨 LA DUREE DU CONTRAT EST DANS `duree_hebdo`. La duree mensuelle
  // correspondante vaut duree_hebdo x 52 / 12 — c est la conversion legale,
  // celle qui donne 151,67 h pour 35 h.
  // ⚠️ `quotite_travail` EXISTE AUSSI SUR LE CONTRAT : c est la quotite
  // DECLAREE EN DSN (rubrique 40.013). On ne s en sert pas pour payer, elle
  // peut etre renseignee sans que la duree le soit.
  //
  // 🚨 LA PROPORTION SERT PARTOUT OU LE PLEIN TEMPS SERT DE REFERENCE : le
  // SMIC de la reduction generale, le plafond de securite sociale, le
  // salaire minimum conventionnel. ⛔ ELLE NE S APPLIQUE PAS au salaire lui-
  // meme quand il est deja mensuel : un temps partiel a 1 400 EUR est paye
  // 1 400 EUR, pas 1 400 x 0,686.
  // ═══════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 22/09 — LE FORFAIT EN JOURS
  //
  // 🚨 UN CADRE AU FORFAIT JOURS N A PAS D HORAIRE. Les articles L3121-58
  // et suivants lui retirent les durees maximales quotidienne et
  // hebdomadaire : son contrat fixe un NOMBRE DE JOURS travailles dans
  // l annee, 218 au plus. Lui appliquer 151,67 heures n a aucun sens.
  //
  // CE QUE CELA CHANGE, ET CE QUE CELA NE CHANGE PAS :
  //   · LE SALAIRE est forfaitaire et se paie en entier — on ne le calcule
  //     pas par un taux horaire ;
  //   · LE SMIC DE LA REDUCTION GENERALE ET LE PLAFOND restent ceux d un
  //     TEMPS PLEIN : le forfait jours n est pas un temps partiel, et le
  //     proratiser donnerait au cadre une reduction qu il n a pas ;
  //   · LES HEURES SUPPLEMENTAIRES N EXISTENT PAS : une reserve le dit.
  // ⚠️ IL EXISTE DES FORFAITS JOURS REDUITS (180 jours au lieu de 218).
  // Le salaire y est proportionnellement plus bas, mais le plafond de
  // securite sociale se proratise alors sur les JOURS, pas sur des heures
  // que le contrat n a pas. Le moteur le signale et ne proratise rien :
  // se tromper de sens ferait perdre des droits au salarie.
  // ═══════════════════════════════════════════════════════════════════
  const forfaitJoursAn = Number((contrat as any).forfait_jours_annuel || 0);
  const auForfaitJours = forfaitJoursAn > 0;

  const dureeHebdo = Number(contrat.duree_hebdo) > 0
    ? Number(contrat.duree_hebdo) : 0;
  const dureeContratMois = (auForfaitJours || dureeHebdo <= 0)
    ? Number(dureeMensuelle || 0)
    : Math.round(dureeHebdo * 52 / 12 * 100) / 100;
  // La proportion par rapport au plein temps, bornee : un forfait a 39 h ne
  // doit pas majorer le SMIC de reference.
  // ⚠️ UN FORFAIT JOURS VAUT TOUJOURS 1 : voir ci-dessus.
  const proportionTemps = auForfaitJours ? 1
    : ((dureeMensuelle && dureeContratMois > 0)
      ? Math.min(1, dureeContratMois / Number(dureeMensuelle))
      : 1);
  const tempsPartiel = proportionTemps < 0.999;

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 22/09 — L APPRENTI : SON MINIMUM LEGAL ET SON SEUIL D EXONERATION
  //
  // Tout ce qui suit ne sert QUE si le contrat est un apprentissage. Sur
  // tout autre contrat, `appr` reste nul et rien ne change.
  //
  // 🚨 DEUX CHOSES SE DECIDENT ICI, ET ELLES SONT INDEPENDANTES :
  //   1. COMBIEN IL DOIT ETRE PAYE — le bareme de l article D6222-26, en
  //      pourcentage du SMIC selon l age et l annee d execution ;
  //   2. CE QUI EST EXONERE — la fraction du salaire sous 50 % du SMIC
  //      (79 % pour les contrats commences avant le 01/03/2025).
  // ⛔ NE PAS LES CONFONDRE : un apprenti de 26 ans touche 100 % du SMIC et
  // cotise pourtant sur la moitie de son salaire.
  // ═══════════════════════════════════════════════════════════════════
  const estApprenti = String(contrat.type_contrat || "") === "apprentissage";
  let appr: any = null;
  const notesApprenti: string[] = [];

  if (estApprenti) {
    const naissance = contrat.paie_salaries
      ? String((contrat.paie_salaries as any).date_naissance || "") : "";
    const age = ageApprentiAuMois(naissance, periode);
    const annee = anneeExecutionApprenti(String(contrat.date_debut || ""), periode);
    const smicMensuelCourant = Number(await parametre("SMIC_MENSUEL", periode)) || 0;

    // ⚠️ LE SEUIL DEPEND DU CONTRAT, PAS DU MOIS DECLARE. Deux apprentis du
    // meme employeur, le meme mois, peuvent avoir deux seuils differents
    // selon la date a laquelle leur contrat a commence.
    const ancienRegime = String(contrat.date_debut || "") < APPRENTI_BASCULE_50;
    const tauxExo = Number(await parametre(
      ancienRegime ? "APPRENTI_EXO_TAUX_AVANT_MARS_2025" : "APPRENTI_EXO_TAUX",
      periode)) || 0;

    let pourcentage: number | null = null;
    let refConv = false;

    if (age !== null && annee !== null) {
      const { data: bareme } = await supabase
        .from("paie_bareme_apprentissage")
        .select("*")
        .lte("date_effet", periode)
        .or("date_fin.is.null,date_fin.gte." + periode)
        .eq("annee_contrat", annee)
        .order("age_min", { ascending: false });

      for (const b of (bareme || [])) {
        const mn = Number((b as any).age_min);
        const mx = (b as any).age_max;
        if (age < mn) continue;
        if (mx !== null && mx !== undefined && age > Number(mx)) continue;
        pourcentage = Number((b as any).pourcentage);
        refConv = (b as any).reference_conventionnelle === true;
        break;
      }
    }

    // 🚨 LE POURCENTAGE PORTE SUR LE SMIC PRORATISE A LA DUREE DU CONTRAT.
    // Un apprenti a 24 heures ne touche pas 53 % d un plein temps.
    const assietteBareme = cts(smicMensuelCourant * proportionTemps);
    const minimumLegal = pourcentage !== null
      ? cts(assietteBareme * pourcentage / 100) : null;

    appr = {
      age: age,
      annee_execution: annee,
      pourcentage: pourcentage,
      reference_conventionnelle: refConv,
      smic_mensuel: smicMensuelCourant,
      assiette_bareme: assietteBareme,
      minimum_legal: minimumLegal,
      ancien_regime: ancienRegime,
      taux_exoneration: tauxExo,
      seuil_exoneration: seuilExoApprenti({
        smic_mensuel: smicMensuelCourant,
        taux: tauxExo,
        proportion_temps: proportionTemps,
      }),
      // Rempli plus bas, quand le brut est connu.
      fraction_soumise: 0,
      base_csg: 0,
    };

    if (age === null) {
      notesApprenti.push("⛔ APPRENTI SANS DATE DE NAISSANCE : le barème "
        + "légal ne peut pas être appliqué. Renseigner la date de naissance "
        + "du salarié.");
    }
    if (annee === null) {
      notesApprenti.push("⛔ APPRENTI SANS DATE DE DÉBUT DE CONTRAT "
        + "exploitable : l'année d'exécution ne peut pas être déterminée.");
    }
    if (pourcentage === null && age !== null && annee !== null) {
      notesApprenti.push("⛔ AUCUNE LIGNE DE BARÈME pour " + age + " ans en "
        + "année " + annee + " : vérifier paie_bareme_apprentissage.");
    }
    if (tauxExo <= 0) {
      notesApprenti.push("⛔ SEUIL D'EXONÉRATION APPRENTI ABSENT de "
        + "paie_parametres pour cette période : aucune exonération n'a été "
        + "appliquée, toutes les cotisations salariales sont comptées.");
    }
    if (changementAnneeDansLeMois(String(contrat.date_debut || ""), periode)) {
      notesApprenti.push("⚠️ L'ANNIVERSAIRE DU CONTRAT TOMBE EN COURS DE "
        + "MOIS : le mois est à cheval sur deux années d'exécution. Le "
        + "moteur a retenu la situation du 1er du mois (année "
        + annee + "). Un prorata entre les deux taux se décide, il ne se "
        + "devine pas — l'ajuster à la main si l'employeur le pratique.");
    }
    if (refConv) {
      notesApprenti.push("⚠️ À PARTIR DE 21 ANS le pourcentage porte sur le "
        + "SMIC OU sur le salaire minimum conventionnel de l'emploi occupé "
        + "s'il est supérieur (D6222-26). Le contrôle ci-dessous compare au "
        + "SMIC : si la branche prévoit mieux, le minimum réel est plus "
        + "élevé.");
    }
  }

  if (!plafond) {
    return {
      erreur: "aucun plafond de securite sociale connu pour " + periode
        + ". ⛔ AJOUTER LA LIGNE DANS paie_parametres AVANT DE CALCULER : "
        + "sans plafond, aucune cotisation plafonnee n est calculable.",
    };
  }

  // ---- LES ELEMENTS DU MOIS ----
  const { data: elements } = await supabase
    .from("paie_elements")
    .select("*")
    .eq("contrat_id", contratId)
    .eq("periode", periode);

  const lignesBrut: any[] = [];
  let brutSoumis = 0;
  let nonSoumis = 0;

  // ═══════════════════════════════════════════════════════════════════
  // LE SALAIRE DE BASE
  //
  // 🚨🚨 DEFAUT TROUVE A L ESSAI DU 16/09, ET C EST LE PLUS GRAVE DU
  // MOTEUR : le test portait sur `indexOf("heures") === 0`, donc AJOUTER
  // DES HEURES SUPPLEMENTAIRES SUPPRIMAIT LE SALAIRE NORMAL DU MOIS.
  // Julien DUBOIS, 151,67 h a 13,50 EUR, sortait a 163,35 EUR de brut au
  // lieu de 2 210,90 : ses 2 047,55 EUR de salaire avaient disparu.
  //
  // ⚠️ ET LE BULLETIN AVAIT L AIR JUSTE. Toutes les lignes etaient
  // coherentes entre elles, les cotisations calculees sur le bon brut, le
  // net egal au brut moins les retenues. Seul le salaire manquait. C est
  // exactement le genre de defaut qu on ne voit pas en relisant, seulement
  // en comparant a ce qu on attendait.
  //
  // ⚠️ POURQUOI IL NE S ETAIT PAS VU SUR THOMAS MARTIN : ses heures
  // normales avaient ete saisies A LA MAIN dans les elements, donc le
  // salaire de base etait bien la — pose par la saisie, pas par le moteur.
  //
  // LA REGLE JUSTE : le salaire de base se pose des qu aucun element ne
  // represente les HEURES NORMALES du mois. Une heure supplementaire, une
  // absence, une prime ne le remplacent pas — elles s y ajoutent ou s en
  // retranchent. C est ainsi que fonctionne tout bulletin.
  // ═══════════════════════════════════════════════════════════════════
  const aDesHeuresNormales = (elements || []).some(function (e: any) {
    const t = String(e.type_element || "");
    // ⚠️ ON RECONNAIT LES HEURES NORMALES, PAS « TOUT CE QUI COMMENCE PAR
    // HEURES » : heures_sup_25, heures_sup_50, heures_absence ne sont PAS
    // le salaire du mois.
    return t === "heures" || t === "heures_normales" || t === "salaire_base";
  });

  if (!aDesHeuresNormales) {
    // ⚠️ MENSUEL D ABORD, HORAIRE ENSUITE. Un contrat porte l un ou
    // l autre ; en interim c est presque toujours l horaire.
    let base = 0;
    let libelle = "Salaire de base";
    let quantite = null;
    let taux = null;

    if (contrat.salaire_mensuel) {
      base = Number(contrat.salaire_mensuel);
    } else if (auForfaitJours) {
      // ⛔ PAS DE TAUX HORAIRE SUR UN FORFAIT JOURS : le salaire est
      // forfaitaire par definition. S il n est pas saisi, on ne l invente
      // pas — la reserve le dit et le bulletin sort a zero, ce qui se voit.
      base = 0;
      libelle = "Salaire de base (forfait de " + forfaitJoursAn
        + " jours par an)";
    } else if (contrat.salaire_horaire && dureeContratMois > 0) {
      // 🚨 LA DUREE DU CONTRAT, PAS 151,67 h. Un contrat a 24 h payait
      // 151,67 h : le salarie touchait un plein temps.
      quantite = dureeContratMois;
      taux = Number(contrat.salaire_horaire);
      base = quantite * taux;
      // ⚠️ VIRGULE FRANCAISE, PAS POINT : ce libelle part sur le bulletin
      // remis au salarie. « 151.67 h » n est pas une ecriture francaise.
      libelle = "Salaire de base (" + quantite.toLocaleString("fr-FR",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " h)";
    } else if (appr && appr.minimum_legal !== null && appr.minimum_legal > 0) {
      // 🆕🚨 22/09 — L APPRENTI SANS SALAIRE SAISI EST PAYE AU BAREME.
      //
      // 🚨 DOCTRINE : ne jamais faire taper a la main ce que l application
      // sait calculer. Le minimum legal d un apprenti se deduit entierement
      // de sa date de naissance, de la date de debut du contrat et du SMIC
      // — la machine connait les trois.
      // ⚠️ UN SALAIRE SAISI L EMPORTE TOUJOURS : le bareme est un MINIMUM,
      // et un employeur peut payer davantage. C est pour cela que ce cas
      // vient en DERNIER, apres le mensuel et l horaire.
      base = Number(appr.minimum_legal);
      libelle = "Salaire de base apprenti (" + appr.pourcentage + " % du SMIC"
        + (appr.annee_execution ? ", année " + appr.annee_execution : "")
        + (appr.age !== null ? ", " + appr.age + " ans" : "") + ")";
    }

    if (base > 0) {
      const m = cts(base);
      lignesBrut.push({ libelle: libelle, quantite: quantite, taux: taux, montant: m });
      brutSoumis += m;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — LES AVANTAGES EN NATURE ET LES TITRES-RESTAURANT
  //
  // Les parametres viennent de la base (`paie_parametres`), avec leur
  // source et leur date : un barème qui change au 1er janvier ne doit pas
  // se chercher dans le code.
  //
  // ⚠️ CE SONT DEUX MECANIQUES OPPOSEES, et les confondre est la faute la
  // plus frequente sur un bulletin :
  //
  //   L AVANTAGE EN NATURE s AJOUTE au brut — il est du salaire, cotise et
  //   imposable — puis se RETIRE du net, parce que le salarie l a recu en
  //   repas et non en argent. Il monte donc les cotisations sans monter le
  //   net a payer.
  //
  //   LE TITRE-RESTAURANT fait l inverse : la part patronale n est PAS du
  //   salaire tant qu elle reste dans les limites, et seule la part
  //   SALARIALE se retire du net. Hors des limites, la part patronale
  //   redevient du salaire et rejoint le brut.
  // ═══════════════════════════════════════════════════════════════════
  const pAvRepas = await parametre("AVANTAGE_REPAS", periode);
  const pAvNeglige = await parametre("AVANTAGE_REPAS_NEGLIGEABLE", periode);
  const pTrPlafond = await parametre("TR_PLAFOND_EXO", periode);
  const pTrMin = await parametre("TR_PART_MIN", periode);
  const pTrMax = await parametre("TR_PART_MAX", periode);

  const notesAvantages: string[] = [];

  for (const e of (elements || [])) {
    const t = String(e.type_element || "");

    // ─────────── L AVANTAGE EN NATURE NOURRITURE ───────────
    if (t === "avantage_repas") {
      if (pAvRepas === null) {
        notesAvantages.push("⛔ AVANTAGE EN NATURE REPAS NON CALCULÉ : le "
          + "barème AVANTAGE_REPAS est absent de la base pour cette période. "
          + "La ligne n'a PAS été portée au bulletin.");
        continue;
      }
      const nbRepas = Number(e.quantite || 0);
      if (nbRepas <= 0) {
        notesAvantages.push("⛔ AVANTAGE EN NATURE REPAS sans nombre de "
          + "repas : la ligne n'a PAS été portée au bulletin.");
        continue;
      }

      // La participation du salarie, saisie dans `taux` (par repas).
      const partSalarie = Number(e.taux || 0);
      const forfait = Number(pAvRepas);

      // 🚨 L AVANTAGE PEUT ETRE NEGLIGE si le salarie paie au moins la
      // moitie du forfait (URSSAF) : rien n est alors reintegre.
      const seuilNeglige = forfait * (Number(pAvNeglige || 0) / 100);
      if (partSalarie > 0 && partSalarie >= seuilNeglige) {
        notesAvantages.push("Avantage en nature repas négligé : le salarié "
          + "participe à hauteur de " + partSalarie.toLocaleString("fr-FR",
            { minimumFractionDigits: 2 }) + " € par repas, soit au moins "
          + "la moitié du forfait (" + seuilNeglige.toLocaleString("fr-FR",
            { minimumFractionDigits: 2 }) + " €). Rien n'est réintégré, "
          + "conformément à la doctrine URSSAF.");
        continue;
      }

      // 🚨 LA PARTICIPATION DU SALARIE VIENT EN DEDUCTION DU FORFAIT.
      const parRepas = Math.max(0, forfait - partSalarie);
      const montantAv = cts(parRepas * nbRepas);
      if (montantAv <= 0) continue;

      lignesBrut.push({
        libelle: "Avantage en nature nourriture (" + nbRepas + " repas à "
          + parRepas.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
          + " EUR)",
        quantite: nbRepas, taux: parRepas, montant: montantAv,
      });
      brutSoumis += montantAv;

      // ⛔ ET ON LE RETIRE DU NET : le salarie a recu des repas, pas de
      // l argent. Sans cette ligne, il serait paye deux fois.
      lignesBrut.push({
        libelle: "Avantage en nature nourriture, déduit du net",
        quantite: null, taux: null, montant: -montantAv,
      });
      nonSoumis -= montantAv;

      notesAvantages.push("Avantage en nature nourriture : " + nbRepas
        + " repas à " + forfait.toLocaleString("fr-FR",
          { minimumFractionDigits: 2 }) + " € (barème URSSAF "
        + periode.slice(0, 4) + ")"
        + (partSalarie > 0 ? ", moins " + partSalarie.toLocaleString("fr-FR",
          { minimumFractionDigits: 2 }) + " € de participation du salarié" : "")
        + ". ⚠️ LE FORFAIT EST UN MINIMUM : si la convention collective "
        + "prévoit mieux, c'est elle qui sert d'assiette. L'avantage entre "
        + "aussi dans l'indemnité de congés payés (L3141-25) : il est ajouté "
        + "au maintien de salaire au moment où les congés sont posés.");
      continue;
    }

    // ─────────── L AVANTAGE EN NATURE LOGEMENT ───────────
    //
    // 🚨 LE BAREME CROISE DEUX ENTREES : la remuneration brute du mois et
    // le nombre de PIECES PRINCIPALES. Huit tranches, deux colonnes — une
    // pour un logement d une seule piece, une par piece quand il y en a
    // plusieurs. Les tranches valent 0,5 / 0,6 / 0,7 / 0,9 / 1,1 / 1,3 /
    // 1,5 fois le plafond de securite sociale.
    //
    // ⚠️ SEULES LES PIECES DESTINEES AU SEJOUR OU AU SOMMEIL COMPTENT :
    // salon et chambres. La cuisine, la salle d eau, les toilettes, les
    // couloirs et les annexes sont EXCLUS. Une cuisine ouverte sur le
    // sejour ne fait pas une piece de plus.
    //
    // 🚨 LA REMUNERATION DE REFERENCE EST LE BRUT HORS AVANTAGE EN NATURE.
    // ⛔ SINON LE CALCUL TOURNE EN ROND : l avantage entre dans le brut, le
    // brut determine la tranche, la tranche change l avantage.
    //
    // ⚠️ L EVALUATION PEUT CHANGER CHAQUE MOIS avec la remuneration. On ne
    // prend PAS une moyenne annuelle avec regularisation : la doctrine
    // l interdit expressement.
    // ⚠️ LE FORFAIT COMPREND DEJA l eau, le gaz, l electricite, le
    // chauffage et le garage (BOSS). La taxe d habitation et l assurance,
    // elles, s AJOUTENT si l employeur les prend en charge — ce que ce
    // calcul ne fait pas, et qu il signale.
    if (t === "avantage_logement") {
      const nbPieces = Number(e.quantite || 0);
      if (nbPieces <= 0) {
        notesAvantages.push("⛔ AVANTAGE EN NATURE LOGEMENT sans nombre de "
          + "pièces principales : la ligne n'a PAS été portée au bulletin. "
          + "Seules les pièces de séjour ou de sommeil comptent — cuisine, "
          + "salle d'eau et WC sont exclus.");
        continue;
      }

      // 🚨 LE BRUT DE REFERENCE : celui deja accumule, AVANT cet avantage.
      const brutRef = cts(brutSoumis);

      const { data: bareme } = await supabase
        .from("paie_bareme_logement")
        .select("*")
        .lte("date_effet", periode)
        .or("date_fin.is.null,date_fin.gte." + periode)
        .lte("brut_min", brutRef)
        .order("brut_min", { ascending: false })
        .limit(1);

      const tranche: any = (bareme || [])[0] || null;

      if (!tranche) {
        notesAvantages.push("⛔ AVANTAGE EN NATURE LOGEMENT NON CALCULÉ : "
          + "aucune tranche du barème URSSAF ne correspond à un brut de "
          + brutRef.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
          + " € pour cette période. La ligne n'a PAS été portée au bulletin.");
        continue;
      }

      // ⚠️ UNE SEULE PIECE : la colonne « 1 piece ». PLUSIEURS : le montant
      // par piece, MULTIPLIE par le nombre de pieces — pas la premiere
      // colonne plus les suivantes.
      const forfaitLog = nbPieces === 1
        ? Number(tranche.montant_une_piece)
        : cts(Number(tranche.montant_par_piece) * nbPieces);

      // La participation du salarie (loyer verse), saisie dans `taux`.
      const loyer = Number(e.taux || 0);
      const montantLog = cts(Math.max(0, forfaitLog - loyer));

      if (montantLog <= 0) {
        notesAvantages.push("Avantage en nature logement négligé : le loyer "
          + "versé par le salarié (" + loyer.toLocaleString("fr-FR",
            { minimumFractionDigits: 2 }) + " €) atteint ou dépasse "
          + "l'évaluation forfaitaire (" + forfaitLog.toLocaleString("fr-FR",
            { minimumFractionDigits: 2 }) + " €). Rien n'est réintégré.");
        continue;
      }

      lignesBrut.push({
        libelle: "Avantage en nature logement (" + nbPieces + " pièce"
          + (nbPieces > 1 ? "s" : "") + " principale"
          + (nbPieces > 1 ? "s" : "") + ")",
        quantite: nbPieces,
        taux: nbPieces === 1 ? Number(tranche.montant_une_piece)
          : Number(tranche.montant_par_piece),
        montant: montantLog,
      });
      brutSoumis += montantLog;

      // ⛔ ET ON LE RETIRE DU NET : le salarie a recu un logement, pas de
      // l argent — meme mecanique que les repas.
      lignesBrut.push({
        libelle: "Avantage en nature logement, déduit du net",
        quantite: null, taux: null, montant: -montantLog,
      });
      nonSoumis -= montantLog;

      notesAvantages.push("Avantage en nature logement : "
        + nbPieces + " pièce(s) principale(s), tranche " + tranche.rang
        + " du barème URSSAF (brut de référence "
        + brutRef.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
        + " €, hors avantages en nature), soit "
        + forfaitLog.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
        + " €"
        + (loyer > 0 ? " moins " + loyer.toLocaleString("fr-FR",
          { minimumFractionDigits: 2 }) + " € de loyer versé" : "")
        + ". ⚠️ LE FORFAIT COMPREND l'eau, le gaz, l'électricité, le "
        + "chauffage et le garage. La taxe d'habitation et l'assurance, si "
        + "l'employeur les prend en charge, S'AJOUTENT — ce n'est PAS "
        + "calculé ici. ⚠️ L'évaluation au réel (valeur locative cadastrale) "
        + "peut être plus avantageuse pour un logement de standing : elle "
        + "n'est pas proposée.");
      continue;
    }

    // ─────────── LES TITRES-RESTAURANT ───────────
    if (t === "titres_restaurant") {
      const nbTitres = Number(e.quantite || 0);
      const valeurFaciale = Number(e.taux || 0);
      // La part patronale par titre est saisie dans `montant`.
      const partPatronale = Number(e.montant || 0);

      if (nbTitres <= 0 || valeurFaciale <= 0 || partPatronale <= 0) {
        notesAvantages.push("⛔ TITRES-RESTAURANT INCOMPLETS : il faut le "
          + "nombre de titres, la valeur faciale et la part patronale par "
          + "titre. La ligne n'a PAS été portée au bulletin.");
        continue;
      }

      const pct = partPatronale / valeurFaciale * 100;
      const partSalariale = cts((valeurFaciale - partPatronale) * nbTitres);

      // 🚨 DEUX CONDITIONS CUMULATIVES : la part patronale doit rester dans
      // la fourchette 50-60 % ET sous le plafond par titre. Si l une des
      // deux tombe, la part patronale redevient du salaire.
      let aReintegrer = 0;
      if (pTrMin !== null && pTrMax !== null
          && (pct < Number(pTrMin) || pct > Number(pTrMax))) {
        // ⛔ HORS FOURCHETTE : la TOTALITE devient du salaire.
        aReintegrer = cts(partPatronale * nbTitres);
        notesAvantages.push("⛔ TITRES-RESTAURANT : la part patronale "
          + "représente " + (Math.round(pct * 10) / 10).toLocaleString("fr-FR")
          + " % de la valeur faciale, hors de la fourchette "
          + pTrMin + "-" + pTrMax + " % exigée. LA TOTALITÉ de la "
          + "participation patronale est réintégrée dans le brut et cotise.");
      } else if (pTrPlafond !== null && partPatronale > Number(pTrPlafond)) {
        // ⚠️ AU-DELA DU PLAFOND : seul l EXCEDENT est reintegre.
        aReintegrer = cts((partPatronale - Number(pTrPlafond)) * nbTitres);
        notesAvantages.push("⚠️ TITRES-RESTAURANT : la part patronale de "
          + partPatronale.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
          + " € dépasse le plafond d'exonération de "
          + Number(pTrPlafond).toLocaleString("fr-FR",
            { minimumFractionDigits: 2 }) + " €. L'excédent ("
          + aReintegrer.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
          + " €) est réintégré dans le brut.");
      } else {
        notesAvantages.push("Titres-restaurant : " + nbTitres + " titres de "
          + valeurFaciale.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
          + " €, part patronale " + partPatronale.toLocaleString("fr-FR",
            { minimumFractionDigits: 2 }) + " € ("
          + (Math.round(pct * 10) / 10).toLocaleString("fr-FR")
          + " %) — exonérée. Seule la part salariale est retenue sur le net.");
      }

      if (aReintegrer > 0) {
        lignesBrut.push({
          libelle: "Titres-restaurant, part patronale réintégrée",
          quantite: nbTitres, taux: null, montant: aReintegrer,
        });
        brutSoumis += aReintegrer;
      }

      // 🚨 LA PART SALARIALE SE RETIENT SUR LE NET, jamais sur le brut :
      // ce n est pas une cotisation, c est le prix des titres.
      if (partSalariale > 0) {
        lignesBrut.push({
          libelle: "Titres-restaurant, part salariale (" + nbTitres
            + " titres)",
          quantite: nbTitres, taux: cts(valeurFaciale - partPatronale),
          montant: -partSalariale,
        });
        nonSoumis -= partSalariale;
      }
      continue;
    }

    // ─────────── TOUS LES AUTRES ELEMENTS ───────────
    const m = cts(Number(e.montant || 0));
    lignesBrut.push({
      libelle: e.libelle,
      quantite: e.quantite ? Number(e.quantite) : null,
      taux: e.taux ? Number(e.taux) : null,
      montant: m,
    });
    // 🚨 UN ELEMENT NON SOUMIS N ENTRE PAS DANS LE BRUT COTISE, mais il
    // entre dans le net a payer. Confondre les deux donne un redressement.
    if (e.soumis_cotisations === false) nonSoumis += m;
    else brutSoumis += m;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ══ LES CONGES PRIS DANS LE MOIS ══
  //
  // 🚨 DEUX LIGNES, PAS UNE. Un bulletin qui porte des conges affiche
  // toujours la RETENUE pour absence et l INDEMNITE qui la remplace :
  //   · en maintien de salaire, les deux s annulent exactement, et le
  //     salarie voit qu il n a rien perdu ;
  //   · quand la regle du dixieme est plus favorable, l indemnite depasse
  //     la retenue, et la difference apparait a l ecran.
  //
  // ⚠️ N AFFICHER QUE LE SOLDE NET RENDRAIT LA REGLE INVISIBLE. Or c est
  // precisement ce qu un salarie et un controleur veulent verifier : que
  // la methode la plus favorable a bien ete retenue (art. L3141-24).
  //
  // ⚠️ LE MONTANT VIENT DE paie_conges, CALCULE A LA SAISIE. Le recalculer
  // ici ferait diverger le bulletin de ce qui est en base — et c est la
  // base qui fait foi, puisqu elle garde les deux methodes.
  // ═══════════════════════════════════════════════════════════════════
  let congesDuMois = 0;
  let indemniteConges = 0;

  // 🆕🚨 25/09 — L APPRENTI AUSSI. Depuis le 22/09, la route dossier lui
  // fait acquerir ET poser des conges, mais le bulletin ne lisait que ceux
  // d un CDI : ses conges poses n apparaissaient nulle part. Trouve le
  // 25/09 en relisant la pose des conges.
  if (contrat.type_contrat === "cdi" || contrat.type_contrat === "apprentissage") {
    const { data: prises } = await supabase
      .from("paie_conges")
      .select("jours, valeur_retenue, valeur_maintien, valeur_dixieme")
      .eq("contrat_id", contratId)
      .eq("periode", periode)
      .eq("type_mouvement", "prise");

    let joursPris = 0;
    let methodeDixieme = false;
    let avecAvantage = false;
    let maintienStocke = 0;

    for (const pr of (prises || [])) {
      joursPris += Number((pr as any).jours || 0);
      indemniteConges += Number((pr as any).valeur_retenue || 0);
      // 🚨 LA RETENUE SE LIT EN BASE, ELLE NE SE RECALCULE PAS.
      // `valeur_maintien` EST le montant du maintien de salaire, fige au
      // moment de la prise. C est exactement ce qu il faut retenir.
      maintienStocke += Number((pr as any).valeur_maintien || 0);
      // 🆕 25/09 — LA METHODE SE LIT SUR LA VALEUR RETENUE. Depuis que
      // l avantage nourriture s ajoute au maintien (L3141-25), le maintien
      // stocke est le salaire SEUL : un dixieme superieur au salaire seul
      // ne veut plus dire que c est lui qui a ete retenu.
      const vr = Number((pr as any).valeur_retenue || 0);
      const vm = Number((pr as any).valeur_maintien || 0);
      const vd = Number((pr as any).valeur_dixieme || 0);
      if (vd > vm && Math.abs(vr - vd) < 0.01) methodeDixieme = true;
      if (vr > Math.max(vm, vd) + 0.005) avecAvantage = true;
    }

    if (joursPris > 0) {
      congesDuMois = joursPris;

      // ═══════════════════════════════════════════════════════════════
      // 🚨🚨 DEFAUT TROUVE A L ESSAI DU 17/09, ET IL COUTAIT DE L ARGENT.
      //
      // La retenue etait RECALCULEE au salaire courant, tandis que
      // l indemnite venait de la base, figee a la saisie de la prise. Des
      // que le salaire du contrat changeait, les deux ne s annulaient plus.
      //
      // MESURE : salaire passe de 2 400 a 1 700 EUR, un jour pris —
      // retenue 65,38, indemnite 92,31. VINGT-SIX EUROS VERSES SANS
      // RAISON, sur une ligne que personne ne relit.
      //
      // ⚠️ LA CORRECTION EST DE LIRE, PAS DE CALCULER : `valeur_maintien`
      // EST le maintien de salaire, fige au moment de la prise. Les deux
      // lignes viennent donc de la meme source et de la meme date.
      //   · en maintien : retenue = indemnite, elles s annulent exactement
      //   · avec le dixieme : l indemnite depasse, et la difference se voit
      //
      // ⛔ ET UNE PRISE DE JANVIER GARDE SA VALEUR DE JANVIER, ce qui est
      // la regle : on ne revalorise pas un conge deja pris parce que le
      // salaire a augmente depuis.
      // ═══════════════════════════════════════════════════════════════
      const retenue = cts(maintienStocke);

      lignesBrut.push({
        libelle: "Absence congés payés",
        quantite: joursPris,
        taux: null,
        montant: -retenue,
      });
      lignesBrut.push({
        libelle: "Indemnité de congés payés"
          + (methodeDixieme ? " (règle du dixième)"
            : avecAvantage ? " (maintien de salaire, avantage nourriture compris)"
            : " (maintien de salaire)"),
        quantite: joursPris,
        taux: null,
        montant: cts(indemniteConges),
      });

      // 🚨 L INDEMNITE EST SOUMISE A COTISATIONS, comme le salaire qu elle
      // remplace. Seule la DIFFERENCE modifie le brut : en maintien, elle
      // est nulle et le brut ne bouge pas.
      brutSoumis += cts(indemniteConges) - retenue;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — ══ L ARRET DE TRAVAIL ENTRE DANS LA PAIE ══
  //
  // Jusqu ici l arret se SIGNALAIT et se DECLARAIT, mais le bulletin
  // l ignorait : un salarie arrete dix jours etait paye son mois entier.
  // L absence se saisissait a la main (« Absence maladie », un montant) —
  // alors que l arret est deja en base, avec ses dates.
  // ⛔ NE JAMAIS FAIRE TAPER CE QUE LA BASE SAIT DEJA.
  //
  // 🚨 LA METHODE : LES HEURES REELLES DU MOIS. La retenue vaut
  //     salaire du mois × heures d absence / heures que le salarie aurait
  //     travaillees ce mois-la
  // C est la seule methode que la Cour de cassation tient pour exacte
  // (Cass. soc., 11 fevrier 1982) : le trentieme ou les jours ouvres
  // moyens retiennent trop certains mois et pas assez d autres.
  //
  // ⚠️ L HORAIRE EST SUPPOSE REPARTI DU LUNDI AU VENDREDI, a parts egales.
  // Un temps partiel sur trois jours ou un travail du samedi demanderait un
  // planning que le contrat ne porte pas : la reserve le dit.
  // ⚠️ UN JOUR FERIE CHOME COMPTE COMME UN JOUR DU MOIS : il est paye comme
  // s il avait ete travaille.
  //
  // 🚨 LA FIN DE L ABSENCE EST LA VEILLE DE LA REPRISE quand elle est
  // saisie, sinon la fin prevue de l arret — la meme regle que la DSN, pour
  // que le bulletin et la declaration parlent du meme arret.
  //
  // ⛔ LE MAINTIEN DE SALAIRE N EST PAS CALCULE ICI. Il depend de
  // l anciennete (un an, article L1226-1), d un delai de carence, et de la
  // convention collective qui fait souvent mieux. Le taire ferait croire le
  // bulletin complet : la reserve le dit a chaque arret.
  // ═══════════════════════════════════════════════════════════════════
  const absencesArret: any[] = [];
  let retenueArrets = 0;
  const notesArret: string[] = [];

  {
    const an = Number(String(periode).slice(0, 4));
    const mo = Number(String(periode).slice(5, 7));
    const premierIso = String(periode).slice(0, 7) + "-01";
    const dernierJour = new Date(Date.UTC(an, mo, 0)).getUTCDate();
    const dernierIso = String(periode).slice(0, 7) + "-"
      + (dernierJour < 10 ? "0" : "") + dernierJour;

    const { data: arrets, error: eArr } = await supabase
      .from("paie_evenements")
      .select("*")
      .eq("contrat_id", contratId)
      .eq("type_evenement", "arret")
      .lte("date_debut", dernierIso);

    if (eArr) {
      notesArret.push("🚨 Les arrêts de travail n'ont pas pu être lus ("
        + eArr.message + ") : AUCUNE ABSENCE n'est retenue sur ce bulletin.");
    }

    // Les jours du lundi au vendredi entre deux dates ISO, bornes comprises.
    const joursOuvres = function (deb: string, fin: string): number {
      let n = 0;
      const d = new Date(deb + "T00:00:00Z");
      const f = new Date(fin + "T00:00:00Z");
      while (d.getTime() <= f.getTime()) {
        const j = d.getUTCDay();
        if (j >= 1 && j <= 5) n += 1;
        d.setUTCDate(d.getUTCDate() + 1);
      }
      return n;
    };
    const jjmm = function (iso: string): string {
      return iso.slice(8, 10) + "/" + iso.slice(5, 7);
    };

    const saisieMain = (elements || []).some(function (e: any) {
      return String(e.type_element || "") === "absence_maladie";
    });

    let baseMois = 0;
    if (contrat.salaire_mensuel) baseMois = Number(contrat.salaire_mensuel);
    else if (contrat.salaire_horaire && dureeMensuelle) {
      baseMois = Number(contrat.salaire_horaire) * Number(dureeMensuelle);
    }
    // 🆕🚨 25/09 — L APPRENTI PAYE AU BAREME N A NI SALAIRE MENSUEL NI
    // SALAIRE HORAIRE SUR SON CONTRAT : baseMois restait a zero, et ses
    // arrets de travail etaient IGNORES EN SILENCE (ni retenue, ni maintien,
    // ni indemnites journalieres). Trouve le 25/09 en eprouvant le maintien
    // sur Camille. Son salaire de reference est le minimum du bareme.
    if (baseMois <= 0 && appr && appr.minimum_legal !== null && Number(appr.minimum_legal) > 0) {
      baseMois = Number(appr.minimum_legal);
    }

    // ⚠️ REPARTITION SUPPOSEE EGALE SUR CINQ JOURS. Un temps partiel
    // reparti sur trois jours demanderait un planning que le contrat ne
    // porte pas : la reserve le dit.
    const heuresJour = (dureeHebdo > 0 ? dureeHebdo : 35) / 5;
    const joursDuMois = joursOuvres(premierIso, dernierIso);

    for (const a of (arrets || [])) {
      // Un arret annule ne retient rien.
      if ((a as any).annule_le) continue;

      const debA = String((a as any).date_debut || "").slice(0, 10);
      let finA = String((a as any).date_fin || "").slice(0, 10);
      const rep = String((a as any).reprise_date || "").slice(0, 10);
      if (rep) {
        const dr = new Date(rep + "T00:00:00Z");
        dr.setUTCDate(dr.getUTCDate() - 1);
        finA = dr.toISOString().slice(0, 10);
      }
      if (!debA || !finA) continue;

      // La part de l arret qui tombe dans le mois.
      const d1 = debA < premierIso ? premierIso : debA;
      const d2 = finA > dernierIso ? dernierIso : finA;
      if (d1 > d2) continue;

      const joursAbs = joursOuvres(d1, d2);
      if (joursAbs === 0) continue;

      // ⛔ PAS DE DOUBLE RETENUE : une absence maladie tapee a la main ce
      // mois-ci a deja retire le salaire.
      if (saisieMain) {
        notesArret.push("⚠️ Un arrêt de travail du " + jjmm(d1) + " au "
          + jjmm(d2) + " est en base, mais une « Absence maladie » a été "
          + "saisie à la main ce mois-ci : la retenue automatique n'a PAS été "
          + "appliquée, pour ne pas retenir deux fois. Retirer la saisie "
          + "manuelle pour laisser le calcul se faire.");
        continue;
      }
      // ⚠️ PAYE AUX HEURES SAISIES : l absence ne se retient pas, elle n est
      // simplement pas payee.
      if (aDesHeuresNormales || joursDuMois === 0) continue;
      // ⛔ PLUS JAMAIS EN SILENCE : un arret en base sans salaire de
      // reference pour le retenir, cela se dit sur le bulletin.
      if (baseMois <= 0) {
        notesArret.push("🚨 Un arrêt de travail du " + jjmm(d1) + " au " + jjmm(d2)
          + " est en base, mais le contrat ne porte aucun salaire de référence "
          + "(ni mensuel, ni horaire) : la retenue et le maintien n'ont PAS été "
          + "calculés. Renseigner le salaire du contrat.");
        continue;
      }

      const heuresAbs = cts(joursAbs * heuresJour);
      const heuresMois = cts(joursDuMois * heuresJour);
      const retenue = joursAbs >= joursDuMois
        ? cts(baseMois)
        : cts(baseMois * heuresAbs / heuresMois);

      lignesBrut.push({
        libelle: "Absence — arrêt de travail ("
          + String((a as any).motif || "").replace(/_/g, " ") + ") du "
          + jjmm(d1) + " au " + jjmm(d2),
        quantite: heuresAbs,
        taux: Math.round((baseMois / heuresMois) * 10000) / 10000,
        montant: -retenue,
      });
      brutSoumis -= retenue;
      retenueArrets += retenue;

      absencesArret.push({
        evenement_id: (a as any).id, motif: (a as any).motif,
        debut: d1, fin: d2, jours: joursAbs, heures: heuresAbs,
        heures_du_mois: heuresMois, retenue: retenue,
        debut_arret: debA, subrogation: (a as any).subrogation === true,
      });

      notesArret.push("Arrêt de travail du " + jjmm(d1) + " au " + jjmm(d2)
        + " : " + heuresAbs.toLocaleString("fr-FR") + " h retenues sur "
        + heuresMois.toLocaleString("fr-FR") + " h (méthode des heures "
        + "réelles, horaire supposé réparti du lundi au vendredi).");
    }
    retenueArrets = cts(retenueArrets);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — ══ LE MAINTIEN DE SALAIRE ══
  //
  // LA REGLE VIENT DE LA BASE quand la convention en porte une
  // (`paie_conventions_regles`, regles `maintien_*`), SINON DE LA LOI :
  // articles L1226-1 et D1226-1 a D1226-8 du code du travail — un an
  // d anciennete, sept jours de carence, 90 % pendant 30 jours puis les
  // deux tiers pendant 30 jours, chaque duree allongee de dix jours par
  // periode entiere de cinq ans d anciennete, dans la limite de 90 jours.
  //
  // CE QUE CE CALCUL NE FAIT PAS, ET QU IL DIT :
  //   · il ne traite que la MALADIE ORDINAIRE. L accident du travail, la
  //     maladie professionnelle, la maternite et la paternite ont d autres
  //     indemnites journalieres et d autres conditions ;
  //   · 🆕 25/09 — les arrets DEJA INDEMNISES sur douze mois sont desormais
  //     imputes sur les durees (article D1226-4), mais seulement ceux du
  //     MEME contrat ;
  //   · il maintient le BRUT. La Syntec garantit le NET habituel : l ecart
  //     est faible mais il existe, et il se regle par iteration ;
  //   · LES IJSS SONT ESTIMEES. Leur montant exact est notifie par la
  //     caisse : l ecart se regularise sur le bulletin suivant.
  // ═══════════════════════════════════════════════════════════════════
  const maintiens: any[] = [];
  // 🆕 25/09 — LA PART IMPOSABLE DES IJSS VERSEES PAR SUBROGATION, qui entre
  // dans le net imposable (voir plus bas, et les totaux).
  let ijssImposables = 0;

  if (absencesArret.length > 0) {
    const catM = String(contrat.categorie) === "cadre" ? "cadre" : "etam";

    const { data: reglesM } = await supabase
      .from("paie_conventions_regles")
      .select("*")
      .eq("idcc", Number(contrat.idcc) || 0)
      .like("regle", "maintien%")
      .lte("date_effet", periode)
      .or("date_fin.is.null,date_fin.gte." + periode);

    const lireM = function (nom: string): number | null {
      for (const r of (reglesM || [])) {
        if (String((r as any).regle) !== nom) continue;
        const c = (r as any).categorie;
        if (c === null || c === undefined || String(c) === catM) {
          return Number((r as any).valeur_num);
        }
      }
      return null;
    };

    const ijssTaux = (await parametre("IJSS_TAUX", periode)) || 0;
    const ijssPlafond = (await parametre("IJSS_PLAFOND_SMIC", periode)) || 0;
    const ijssCarenceP = await parametre("IJSS_CARENCE_JOURS", periode);
    const smicMens = (await parametre("SMIC_MENSUEL", periode)) || 0;

    for (const ab of absencesArret) {
      const motifAb = String(ab.motif || "");
      if (motifAb !== "maladie" && motifAb !== "01") {
        notesArret.push("⛔ MAINTIEN DE SALAIRE NON CALCULÉ pour l'arrêt du "
          + ab.debut.slice(8, 10) + "/" + ab.debut.slice(5, 7) + " (motif « "
          + motifAb.replace(/_/g, " ") + " ») : seule la maladie ordinaire "
          + "est traitée. Accident du travail, maladie professionnelle, "
          + "maternité et paternité obéissent à d'autres règles — le "
          + "complément de l'employeur MANQUE sur ce bulletin s'il est dû.");
        continue;
      }

      // ---- L ANCIENNETE, EN MOIS ENTIERS, A LA DATE DE L ARRET ----
      const dc = String(contrat.date_debut || "").slice(0, 10);
      let anc = 0;
      if (dc) {
        anc = (Number(ab.debut_arret.slice(0, 4)) - Number(dc.slice(0, 4))) * 12
          + (Number(ab.debut_arret.slice(5, 7)) - Number(dc.slice(5, 7)));
        if (Number(ab.debut_arret.slice(8, 10)) < Number(dc.slice(8, 10))) anc -= 1;
        if (anc < 0) anc = 0;
      }

      // ---- LA REGLE : LA CONVENTION SI ELLE EN PORTE UNE, SINON LA LOI ----
      let regle: RegleMaintien;
      const convAnc = lireM("maintien_anciennete_mois");
      if (convAnc !== null && lireM("maintien_100_jours") !== null) {
        let j1 = lireM("maintien_100_jours") || 0;
        let j2 = lireM("maintien_80_jours") || 0;
        // ⚠️ SYNTEC, ETAM DE PLUS DE CINQ ANS : les durees s inversent
        // (60 jours a 100 %, 30 a 80 %). Le total reste de 90 jours.
        if (Number(contrat.idcc) === 1486 && catM === "etam" && anc >= 60) {
          const t = j1; j1 = j2; j2 = t;
        }
        regle = { ancienneteMois: convAnc, carenceJours: lireM("maintien_carence_jours") || 0,
          jours1: j1, taux1: 100, jours2: j2, taux2: 80,
          origine: "convention " + contrat.idcc };
        if (catM === "cadre") {
          notesArret.push("⚠️ MAINTIEN DE SALAIRE D'UN CADRE : les durées "
            + "appliquées (" + j1 + " jours à 100 %, " + j2 + " à 80 %) "
            + "viennent d'une source secondaire et ne sont PAS vérifiées. "
            + "Les lire dans le texte de la convention avant d'émettre.");
        }
      } else {
        const tranches = Math.floor(Math.max(0, anc - 12) / 60);
        const duree = Math.min(90, 30 + 10 * tranches);
        regle = { ancienneteMois: 12, carenceJours: 7,
          jours1: duree, taux1: 90, jours2: duree, taux2: 66.66,
          origine: "régime légal, article L1226-1" };
      }

      // ---- 🆕 25/09 — LES ARRETS DEJA INDEMNISES SUR DOUZE MOIS ----
      // (article D1226-4, voir joursDejaIndemnises). Ils s imputent d abord
      // sur le premier palier, puis sur le second.
      {
        const { data: anterieurs } = await supabase
          .from("paie_evenements")
          .select("id, motif, date_debut, date_fin, reprise_date, annule_le")
          .eq("contrat_id", contratId)
          .eq("type_evenement", "arret")
          .lt("date_debut", ab.debut_arret)
          .order("date_debut", { ascending: true });
        const liste: { debut: string; fin: string; droit: boolean }[] = [];
        for (const a0 of (anterieurs || [])) {
          if ((a0 as any).annule_le) continue;
          if ((a0 as any).id === ab.evenement_id) continue;
          const mot0 = String((a0 as any).motif || "");
          if (mot0 !== "maladie" && mot0 !== "01") continue;
          const deb0 = String((a0 as any).date_debut || "").slice(0, 10);
          let fin0 = String((a0 as any).date_fin || "").slice(0, 10);
          if ((a0 as any).reprise_date) {
            const r0 = new Date(String((a0 as any).reprise_date).slice(0, 10) + "T00:00:00Z");
            r0.setUTCDate(r0.getUTCDate() - 1);
            const veille = r0.toISOString().slice(0, 10);
            if (!fin0 || veille < fin0) fin0 = veille;
          }
          // Le salarie avait-il droit au maintien a la date de CET arret ?
          let anc0 = 0;
          if (dc && deb0) {
            anc0 = (Number(deb0.slice(0, 4)) - Number(dc.slice(0, 4))) * 12
              + (Number(deb0.slice(5, 7)) - Number(dc.slice(5, 7)));
            if (Number(deb0.slice(8, 10)) < Number(dc.slice(8, 10))) anc0 -= 1;
          }
          liste.push({ debut: deb0, fin: fin0, droit: anc0 >= regle.ancienneteMois });
        }
        const consommes = joursDejaIndemnises({
          debutArret: ab.debut_arret, anterieurs: liste,
          carenceJours: regle.carenceJours, total: regle.jours1 + regle.jours2,
        });
        if (consommes > 0) {
          const pris1 = Math.min(regle.jours1, consommes);
          const pris2 = Math.min(regle.jours2, consommes - pris1);
          regle = { ...regle, jours1: regle.jours1 - pris1, jours2: regle.jours2 - pris2 };
          notesArret.push("Arrêts de maladie déjà indemnisés dans les douze mois "
            + "précédant celui du " + ab.debut_arret.slice(8, 10) + "/"
            + ab.debut_arret.slice(5, 7) + "/" + ab.debut_arret.slice(0, 4) + " : "
            + consommes + " jour(s) imputé(s) sur les durées de maintien (article "
            + "D1226-4 du code du travail). Il reste " + regle.jours1 + " jour(s) à "
            + regle.taux1 + " % et " + regle.jours2 + " à "
            + String(regle.taux2).replace(".", ",") + " %. ⚠️ Seuls les arrêts de "
            + "ce contrat sont comptés.");
        }
      }

      // ---- LES IJSS, ESTIMEES ----
      // Salaire journalier de base = trois derniers bruts / 91,25, plafonne.
      const { data: derniers } = await supabase
        .from("paie_bulletins")
        .select("brut, periode")
        .eq("contrat_id", contratId)
        .eq("statut", "emis")
        .lt("periode", ab.debut_arret.slice(0, 7) + "-01")
        .order("periode", { ascending: false })
        .limit(3);

      let troisMois = 0;
      let estimeContrat = false;
      if ((derniers || []).length === 3) {
        for (const b of (derniers || [])) troisMois += Number((b as any).brut || 0);
      } else {
        let bm = contrat.salaire_mensuel ? Number(contrat.salaire_mensuel)
          : Number(contrat.salaire_horaire || 0) * Number(dureeMensuelle || 0);
        // 🆕 25/09 — l apprenti paye au bareme : son minimum legal.
        if (bm <= 0 && appr && appr.minimum_legal !== null && Number(appr.minimum_legal) > 0) {
          bm = Number(appr.minimum_legal);
        }
        troisMois = bm * 3;
        estimeContrat = true;
      }
      const plafond3 = ijssPlafond * smicMens * 3;
      if (plafond3 > 0 && troisMois > plafond3) troisMois = plafond3;
      const ijJour = cts((troisMois / 91.25) * ijssTaux / 100);

      const m = maintienSalaire({
        debutArret: ab.debut_arret, d1: ab.debut, d2: ab.fin,
        retenue: Number(ab.retenue), joursAbs: Number(ab.jours),
        ancienneteMois: anc, regle: regle, ijJour: ijJour,
        ijssCarence: ijssCarenceP === null ? 3 : ijssCarenceP,
      });

      if (!m.droit) {
        notesArret.push("Pas de maintien de salaire pour l'arrêt du "
          + ab.debut.slice(8, 10) + "/" + ab.debut.slice(5, 7) + " : "
          + (m.raison || "aucun jour couvert") + ". Le salarié perçoit les "
          + "seules indemnités journalières de la Sécurité sociale.");
        continue;
      }
      if (m.maintien <= 0) {
        notesArret.push("Maintien de salaire ouvert pour l'arrêt du "
          + ab.debut.slice(8, 10) + "/" + ab.debut.slice(5, 7) + ", mais aucun "
          + "jour du mois n'est couvert (carence de " + regle.carenceJours
          + " jours, ou durée épuisée).");
        continue;
      }

      lignesBrut.push({
        libelle: "Maintien de salaire maladie (" + m.jours1 + " j à "
          + regle.taux1 + " %" + (m.jours2 > 0
            ? ", " + m.jours2 + " j à " + String(regle.taux2).replace(".", ",") + " %" : "")
          + ")",
        quantite: null, taux: null, montant: m.maintien,
      });
      lignesBrut.push({
        libelle: "Indemnités journalières de Sécurité sociale déduites ("
          + m.joursIjss + " j × " + ijJour.toLocaleString("fr-FR",
            { minimumFractionDigits: 2 }) + " €, estimées)",
        quantite: m.joursIjss, taux: ijJour, montant: -m.ijss,
      });
      brutSoumis += m.maintien - m.ijss;

      // 🚨 EN SUBROGATION, L EMPLOYEUR AVANCE LES IJSS : il les percoit de la
      // caisse et les reverse au salarie, NETTES de CSG (6,20 %) et de CRDS
      // (0,50 %) que la caisse a deja prelevees. Elles ne sont pas du
      // salaire : elles entrent dans le net, pas dans le brut cotise.
      let ijssNettes = 0;
      // 🆕 25/09 — LEUR PART IMPOSABLE. Les IJSS maladie sont imposables pour
      // leur montant BRUT diminue de la seule CSG deductible (3,80 %), soit
      // 96,2 % du brut (la CSG non deductible, 2,40 %, et la CRDS, 0,50 %,
      // restent imposables). En subrogation, c est l EMPLOYEUR qui les verse :
      // elles entrent donc dans le net imposable du bulletin. Sans
      // subrogation, la caisse les declare elle-meme : on n y touche pas.
      // Source : assurance maladie (ameli), « somme a declarer = brut des IJ
      // × 96,2 % ». ⚠️ Exception : les IJ d une affection de longue duree
      // (ALD) ne sont pas imposables — le moteur ne le sait pas, une reserve
      // le dit.
      let ijssImposablesArret = 0;
      if (ab.subrogation) {
        ijssNettes = cts(m.ijss * (1 - 0.067));
        lignesBrut.push({
          libelle: "Indemnités journalières reversées (subrogation), nettes "
            + "de CSG et de CRDS",
          quantite: null, taux: null, montant: ijssNettes,
        });
        nonSoumis += ijssNettes;
        ijssImposablesArret = cts(m.ijss * 0.962);
        ijssImposables += ijssImposablesArret;
      }

      maintiens.push({
        evenement_id: ab.evenement_id, regle: regle.origine,
        anciennete_mois: anc, maintien: m.maintien, ijss_brutes: m.ijss,
        ijss_nettes_reversees: ijssNettes, ij_jour: ijJour,
        ijss_imposables: ijssImposablesArret,
        jours_ijss: m.joursIjss, subrogation: ab.subrogation,
      });

      notesArret.push("Maintien de salaire (" + regle.origine + ", "
        + anc + " mois d'ancienneté) : " + m.maintien.toLocaleString("fr-FR",
          { minimumFractionDigits: 2 }) + " € maintenus, "
        + m.ijss.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
        + " € d'indemnités journalières déduites. ⚠️ LES IJSS SONT ESTIMÉES"
        + (estimeContrat ? " SUR LE SALAIRE DU CONTRAT, faute de trois "
          + "bulletins émis avant l'arrêt" : " sur les trois derniers bulletins")
        + " : le décompte de la caisse fait foi, l'écart se régularise le "
        + "mois suivant."
        + (ab.subrogation ? " Subrogation : les indemnités reversées sont "
          + "ajoutées au net à payer, et leur part imposable ("
          + ijssImposablesArret.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
          + " €, soit le brut diminué de la CSG déductible de 3,80 %) est "
          + "ajoutée au net imposable. ⚠️ Si l'arrêt relève d'une affection de "
          + "longue durée (ALD), ces indemnités ne sont pas imposables : la "
          + "part imposable est alors à retirer." : ""));
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — L ABSENCE CORRIGE LE SMIC DE LA REDUCTION GENERALE
  //
  // BOSS, allegements generaux, §850 : « la valeur du SMIC retenue pour les
  // periodes au cours desquelles a lieu une absence est corrigee du rapport
  // entre la remuneration due par l employeur au titre de ce mois et celle
  // qui aurait ete due si le salarie n avait pas ete absent, apres
  // deduction des elements de remuneration dont le montant n est pas
  // proratise pour tenir compte de l absence. Les indemnites journalieres
  // de securite sociale versees par subrogation ne sont pas prises en
  // compte dans ce rapport. »
  //
  // 🚨 SANS CETTE CORRECTION, LA REDUCTION EXPLOSE. Un salarie a 2 100 EUR
  // absent sept jours tombe a 1 732 EUR de brut : compare a un SMIC ENTIER,
  // il semble paye sous le SMIC et recoit le coefficient MAXIMAL — 676 EUR
  // de reduction au lieu de 284. L URSSAF reclame la difference, avec
  // majorations. C est l absence qui a fait apparaitre ce defaut : avant
  // elle, le moteur ne retenait jamais rien.
  //
  // LE RAPPORT SE PREND SUR LE SALAIRE DE BASE, le seul element ici que
  // l absence proratise directement :
  //     (base − retenue + maintien − IJSS deduites) / base
  // Les IJSS sortent du numerateur parce qu elles ne sont pas une
  // remuneration due par l employeur. La precarite et l indemnite de
  // conges, proportionnelles au brut, suivent d elles-memes.
  // ⚠️ MAINTIEN TOTAL SANS IJSS DEDUITES : le rapport vaut 1, rien ne bouge.
  // ═══════════════════════════════════════════════════════════════════
  let ratioAbsence = 1;
  {
    let baseRef = 0;
    if (contrat.salaire_mensuel) baseRef = Number(contrat.salaire_mensuel);
    else if (contrat.salaire_horaire && dureeMensuelle) {
      baseRef = Number(contrat.salaire_horaire) * Number(dureeMensuelle);
    }
    if (baseRef > 0 && retenueArrets > 0) {
      let du = baseRef - retenueArrets;
      for (const mt of maintiens) {
        du += Number(mt.maintien || 0) - Number(mt.ijss_brutes || 0);
      }
      ratioAbsence = Math.max(0, Math.min(1, du / baseRef));
    }
  }

  brutSoumis = cts(brutSoumis);

  // ---- LES INDEMNITES DE FIN DE MISSION ----
  //
  // 🚨 L ORDRE EST COMMANDE PAR `rang` EN BASE : IFM (10) puis ICCP (20),
  // parce que la base de l ICCP INCLUT l IFM.
  let ifm = 0;
  let iccp = 0;
  const lignesMission: any[] = [];

  // 🚨 LE CDD A DROIT LUI AUSSI A UNE INDEMNITE DE FIN DE CONTRAT — 10 % de
  // la remuneration totale brute, article L1243-8 du code du travail. Elle
  // porte un autre nom (« prime de precarite ») mais elle obeit a la meme
  // regle que l IFM de l interim, et l ICCP la suit de la meme facon.
  //
  // ⚠️ LES CAS OU ELLE N EST PAS DUE DIFFERENT UN PEU DE CEUX DE L INTERIM :
  // emploi saisonnier ou d usage, contrat conclu avec un jeune pendant ses
  // vacances scolaires, refus par le salarie d un CDI au meme poste,
  // rupture anticipee a son initiative, faute grave, force majeure.
  // C est `ifm_due` qui porte la decision, et le motif est ecrit a cote.
  //
  // 🚨 LE CDI N A NI L UNE NI L AUTRE : pas d indemnite de precarite, et
  // les conges payes sont pris, pas compenses mois par mois.
  const aIndemnitesFinContrat = contrat.type_contrat === "mission"
    || contrat.type_contrat === "cdd";

  // 🆕🚨 16/09 — LE LIBELLE DE L INDEMNITE SE DECIDE ICI, PAS EN BASE.
  //
  // DEFAUT TROUVE A L ESSAI : le bulletin d un INTERIMAIRE portait
  // « Indemnite de fin de mission (prime de precarite) ». La prime de
  // precarite est le vocabulaire du CDD ; sur une mission, c est
  // l indemnite de fin de mission, et rien d autre.
  // ⚠️ POURQUOI ICI ET PAS EN BASE : la regle de calcul est commune aux
  // deux contrats (10 % du brut), seul le MOT change — et le mot depend du
  // contrat, que seule cette fonction connait. La base garde donc un
  // libelle neutre.
  // 🚨 UN BULLETIN QUI SE TROMPE DE VOCABULAIRE FAIT DOUTER DU RESTE.
  function libelleIndemnite(code: string, defaut: string): string {
    if (code !== "IFM") return defaut;
    return contrat.type_contrat === "cdd"
      ? "Indemnité de fin de contrat (prime de précarité)"
      : "Indemnité de fin de mission";
  }

  if (aIndemnitesFinContrat) {
    const { data: regles } = await supabase
      .from("paie_regles_mission")
      .select("*")
      .lte("date_effet", periode)
      .or("date_fin.is.null,date_fin.gte." + periode)
      .order("rang", { ascending: true });

    for (const r of (regles || [])) {
      // ⚠️ L IFM N EST PAS TOUJOURS DUE : embauche en CDI a l issue de la
      // mission, contrat saisonnier, faute grave… Le contrat le dit.
      if (r.code === "IFM" && contrat.ifm_due === false) {
        lignesMission.push({
          code: r.code,
          libelle: libelleIndemnite(r.code, r.libelle) + " — non due",
          montant: 0,
          motif: contrat.ifm_motif_non_due || "non due",
        });
        continue;
      }

      let base = brutSoumis;
      if (r.base_calcul === "brut_total_avec_ifm") base = cts(brutSoumis + ifm);

      const montant = cts(base * Number(r.taux) / 100);

      if (r.code === "IFM") ifm = montant;
      if (r.code === "ICCP") iccp = montant;

      lignesMission.push({
        code: r.code,
        libelle: libelleIndemnite(r.code, r.libelle),
        base: base,
        taux: Number(r.taux),
        montant: montant,
      });
    }
  }

  // 🚨 LES INDEMNITES SONT SOUMISES A COTISATIONS. L IFM et l ICCP entrent
  // dans le brut cotise — ce ne sont pas des remboursements de frais.
  const brutTotal = cts(brutSoumis + ifm + iccp);

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — LE SALAIRE RETABLI : CE QUE LE SALARIE AURAIT TOUCHE SANS
  // L ABSENCE
  //
  // La DSN le declare chaque mois (remuneration de type 003), et
  // l assurance maladie calcule les indemnites journalieres dessus. Sans
  // absence il egale le brut ; le mois de l absence, il s en ecarte — et
  // c est ce mois-la qu il sert.
  // ⚠️ LA PRECARITE ET L INDEMNITE DE CONGES SUIVENT LE BRUT : on retablit
  // donc dans la meme proportion, pour retrouver AU CENTIME le brut du mois
  // complet (2 541,00 pour un salaire de 2 100 en CDD).
  // ═══════════════════════════════════════════════════════════════════
  let effetAbsence = retenueArrets;
  for (const mt of maintiens) {
    effetAbsence -= Number(mt.maintien || 0) - Number(mt.ijss_brutes || 0);
  }
  effetAbsence = cts(effetAbsence);
  const salaireRetabli = effetAbsence <= 0
    ? brutTotal
    : (brutSoumis > 0
      ? cts((brutSoumis + effetAbsence) * brutTotal / brutSoumis)
      : effetAbsence);

  // ---- LES COTISATIONS ----
  const { data: cotisations } = await supabase
    .from("paie_cotisations")
    .select("*")
    .eq("active", true)
    .lte("date_effet", periode)
    .or("date_fin.is.null,date_fin.gte." + periode)
    .order("rang", { ascending: true });

  const lignesCotis: any[] = [];
  let totalSalarial = 0;
  let totalPatronal = 0;
  let csgNonDeductible = 0;
  let patronalEligible = 0;

  for (const c of (cotisations || [])) {
    // ⚠️ CERTAINES COTISATIONS NE CONCERNENT QU UNE CATEGORIE (APEC pour
    // les cadres) ou QU UN TYPE DE CONTRAT.
    if (c.categorie && c.categorie !== contrat.categorie) continue;
    if (c.type_contrat && c.type_contrat !== contrat.type_contrat) continue;

    // 🚨 LES DEUX LIGNES FNAL SONT EXCLUSIVES : l effectif tranche.
    // ⚠️ SANS EFFECTIF CONNU, on prend celle des moins de 50 — et on le
    // SIGNALE dans les reserves plutot que de le taire : sur une entreprise
    // plus grande, la cotisation serait sous-evaluee et l URSSAF
    // reclamerait la difference.
    if (c.code === "FNAL_MOINS50" && effectif >= 50) continue;
    if (c.code === "FNAL_50PLUS" && effectif < 50) continue;

    // ⚠️ LA CET N EST DUE QUE SI LA REMUNERATION DEPASSE UN PLAFOND.
    if (c.code === "CET" && brutTotal <= plafond) continue;

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 20/09 — LE PLAFOND DE SECURITE SOCIALE SUIT LE TEMPS PARTIEL
    //
    // Article R242-10 du code de la securite sociale : pour un salarie a
    // temps partiel, le plafond est reduit dans la proportion de la duree
    // du travail par rapport a la duree legale.
    // ⛔ SANS CETTE REDUCTION, un temps partiel bien paye cotise a tort en
    // tranche 1 sur la totalite de son salaire au lieu de basculer en
    // tranche 2 : la retraite complementaire et la vieillesse plafonnee
    // sont fausses dans les deux sens.
    // ⚠️ CELA NE CONCERNE QUE LE PLAFOND : les assiettes deplafonnees ne
    // bougent pas.
    // ═══════════════════════════════════════════════════════════════
    const plafondContrat = Number(plafond) * proportionTemps;
    const base = assiette(String(c.assiette_type), brutTotal, plafondContrat);
    if (base <= 0) continue;

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 22/09 — L EXONERATION DE L APPRENTI NE TOUCHE QUE LE SALARIE
    //
    // 🚨 L EMPLOYEUR COTISE SUR LA TOTALITE DU BRUT. Depuis le 1er janvier
    // 2019 il n a plus aucune exoneration propre dans le secteur prive :
    // sa contrepartie est la reduction generale, calculee plus bas. C est
    // pour cela qu il faut DEUX assiettes ici, et non une base reduite
    // pour tout le monde — reduire la base commune ferait disparaitre des
    // cotisations patronales reellement dues.
    //
    // LA REGLE SALARIALE : la fraction du brut inferieure ou egale au
    // seuil est exoneree ; seul l excedent est cotise.
    //   assiette salariale = brut - seuil, plancher zero
    //   assiette CSG-CRDS  = (brut - seuil) x 98,25 %
    // ⚠️ L ABATTEMENT DE 1,75 % S APPLIQUE A L EXCEDENT, PAS AU BRUT. Une
    // source repandue donne (brut x 98,25 %) - seuil : c est FAUX et cela
    // sur-evalue l assiette. Le BOSS, l Opco EP et la doctrine comptable
    // donnent tous l autre ordre.
    //
    // ⛔ TROIS COTISATIONS NE SONT JAMAIS COUVERTES par l exoneration :
    // la complementaire sante, la prevoyance et l APEC. Elles restent dues
    // en entier, meme sous le seuil — c est pourquoi le net d un apprenti
    // n egale pas toujours son brut.
    // ⚠️ POUR LES CONTRATS COMMENCES AVANT LE 01/03/2025, la CSG et la
    // CRDS sont TOTALEMENT exonerees, quel que soit le salaire.
    // ═══════════════════════════════════════════════════════════════
    let baseSal = base;
    let exoApprentiLigne = false;

    if (appr && appr.seuil_exoneration > 0 && Number(c.taux_salarial) !== 0) {
      const horsExoneration = (c as any).garantie_complementaire === true
        || String(c.code) === "APEC";

      if (!horsExoneration) {
        const excedent = Math.max(0, brutTotal - Number(appr.seuil_exoneration));
        const estCsg = String(c.assiette_type) === "csg";

        if (estCsg && appr.ancien_regime) {
          // Ancien regime : CSG et CRDS entierement exonerees.
          baseSal = 0;
        } else if (estCsg) {
          baseSal = assiette("csg", excedent, plafondContrat);
        } else {
          // ⚠️ SUR UN APPRENTI LE BRUT RESTE TOUJOURS TRES EN DESSOUS DU
          // PLAFOND, donc `base` vaut le brut pour les assiettes plafonnees
          // et zero en tranche 2 : retrancher le seuil de la base donne le
          // meme resultat que de le retrancher du brut. Le jour ou un
          // apprenti depasserait le plafond, la repartition exacte entre
          // tranches n est pas tranchee par le BOSS — la reserve le dit.
          baseSal = Math.max(0, base - Number(appr.seuil_exoneration));
        }
        exoApprentiLigne = true;
      }
    }

    // 🚨 L AT/MP ET LE VERSEMENT MOBILITE PORTENT UN TAUX A ZERO EN BASE :
    // le vrai taux est propre a la societe. On le substitue ici.
    let tPat = Number(c.taux_patronal);

    // ⚠️ L AT/MP RESTE UNE SAISIE : il est notifie par la CARSAT selon la
    // sinistralite de l etablissement, aucune table ne le donne.
    const tauxPropreManquant = String(c.code) === "AT_MP"
      && tauxSociete["AT_MP"] === undefined;

    if (tauxSociete[String(c.code)] !== undefined) {
      tPat = tauxSociete[String(c.code)];
    }

    // ═════════════════════════════════════════════════════════════════
    // 🆕 20/09 — LE VERSEMENT MOBILITE
    //
    // DEUX QUESTIONS DISTINCTES, ET IL FAUT LES DEUX :
    //   1. la societe est-elle assujettie ? — elle seule le sait ;
    //   2. quel est le taux ? — la table des communes le dit.
    //
    // ⚠️ UN TAUX SAISI DANS `paie_taux_societe` PRIME SUR LA TABLE : il
    // couvre les cas que la table ne connait pas (taux notifie a part,
    // situation derogatoire). C est la seule exception.
    // ⛔ SANS REPONSE SUR L ASSUJETTISSEMENT, LA COTISATION VAUT ZERO :
    // facturer un versement qui n est pas du coute de l argent au client ;
    // l oublier se rattrape par une regularisation.
    // ═════════════════════════════════════════════════════════════════
    let alerteVm: string | null = null;

    if (String(c.code) === "VERSEMENT_MOBILITE") {
      const taille = effectifConnu ? effectif + " salarié(s) connus" : "effectif inconnu";

      if (tauxSociete["VERSEMENT_MOBILITE"] === undefined) {
        if (vmLu.taux === null) {
          tPat = 0;
          alerteVm = inseeVm
            ? "taux introuvable — table des communes illisible"
            : "aucune commune de travail connue — taux introuvable";
        } else {
          tPat = vmLu.taux;
          if (vmLu.aucune) {
            alerteVm = "commune " + inseeVm + " hors périmètre : aucun versement dû";
          }
        }
      }

      // L assujettissement tranche EN DERNIER : un taux existe toujours
      // pour une commune desservie, mais il n est du que si la societe
      // franchit le seuil dans la duree.
      if (vmAssujetti !== true) {
        tPat = 0;
        alerteVm = vmAssujetti === false
          ? "société non assujettie"
          : "assujettissement non confirmé (" + taille + ")";
      }
    }

    const partSal = cts(baseSal * Number(c.taux_salarial) / 100);
    const partPat = cts(base * tPat / 100);

    // 🆕 16/09 — UNE LIGNE A ZERO DES DEUX COTES DISPARAIT, SAUF CELLES QUI
    // DOIVENT SE VOIR MEME VIDES. Voir TOUJOURS_VISIBLES en tete de
    // fichier : l AT/MP absente du bulletin ne se remarque pas.
    if (partSal === 0 && partPat === 0
        && TOUJOURS_VISIBLES.indexOf(String(c.code)) < 0) continue;

    totalSalarial += partSal;
    totalPatronal += partPat;

    // 🚨 ON GARDE LA CSG NON DEDUCTIBLE A PART : elle est retenue sur le
    // salaire mais reste imposable. C est elle qui fait que le net
    // imposable depasse le net verse.
    if (c.code === "CSG_NON_DED" || c.code === "CRDS") {
      csgNonDeductible += partSal;
    }

    // 🚨 LES COTISATIONS DANS LE CHAMP DE LA RGDU. La reduction ne peut pas
    // depasser ce qui est effectivement du sur CES cotisations-la.
    // ⚠️ L AGS N EN FAIT PAS PARTIE, ni la CSA, ni la CET, ni l APEC, ni
    // l AT/MP. Les inclure gonflerait le plafond et laisserait passer une
    // reduction superieure a ce que la loi autorise.
    if (ELIGIBLES_RGDU.indexOf(String(c.code)) >= 0) {
      patronalEligible += partPat;
    }

    lignesCotis.push({
      code: c.code,
      libelle: c.libelle,
      famille: c.famille,
      base: cts(base),
      // 🆕 22/09 — L ASSIETTE SALARIALE QUAND ELLE DIFFERE DE L ASSIETTE
      // PATRONALE. Sur un apprenti, le bulletin doit montrer les deux :
      // une ligne ou l employeur cotise sur 1 200 EUR et le salarie sur
      // 266 EUR est juste, mais elle est incomprehensible si l on n affiche
      // qu un seul chiffre. Nulle partout ailleurs.
      base_salariale: exoApprentiLigne ? cts(baseSal) : null,
      exoneration_apprenti: exoApprentiLigne,
      taux_salarial: Number(c.taux_salarial),
      taux_patronal: tPat,
      part_salariale: partSal,
      part_patronale: partPat,
      eligible_rgdu: ELIGIBLES_RGDU.indexOf(String(c.code)) >= 0,
      // ⚠️ LE MARQUEUR SUIT LA LIGNE JUSQU AU NET SOCIAL : c est lui qui
      // dit ce qui se reintegre, plutot qu une reconnaissance au libelle.
      garantie_complementaire: (c as any).garantie_complementaire === true,
      // 🆕 16/09 — L ALERTE VOYAGE AVEC LA LIGNE, pour que le bulletin et
      // l ecran disent la meme chose sans avoir a le redeviner chacun.
      alerte: alerteVm
        ? alerteVm
        : (tauxPropreManquant
          ? "taux à renseigner — notification CARSAT"
          : null),
      // 🆕 20/09 — LE CODE INSEE SUIT LA LIGNE DU VERSEMENT MOBILITE.
      // 🚨 LA DSN LE RECLAMERA DEUX FOIS : en S21.G00.23.006 au bordereau
      // et en S21.G00.81.005 au nominatif, obligatoirement, pour chaque
      // commune au titre de laquelle le versement est du — « y compris en
      // cas de similarite de taux » (guide Urssaf). Le porter ici evite
      // d avoir a le retrouver au moment d ecrire le fichier.
      insee: String(c.code) === "VERSEMENT_MOBILITE" && inseeVm ? inseeVm : null,
    });
  }

  totalSalarial = cts(totalSalarial);
  totalPatronal = cts(totalPatronal);
  csgNonDeductible = cts(csgNonDeductible);
  patronalEligible = cts(patronalEligible);

  // ═══════════════════════════════════════════════════════════════════
  // ---- LA REDUCTION GENERALE DEGRESSIVE UNIQUE (RGDU) ----
  //
  // 🚨 DEPUIS LE 1er JANVIER 2026, elle remplace l ancienne reduction
  // Fillon ET les deux bandeaux maladie et famille. C est pourquoi les taux
  // reduits de maladie (7 %) et d allocations familiales (3,45 %) ont
  // disparu : ils sont absorbes ici.
  //
  // LA FORMULE :
  //   C = Tmin + ( Tdelta x [ (1/2) x (3 x SMIC annuel / remuneration
  //       annuelle brute - 1) ] ^ P )
  //
  // 🚨🚨 LE SMIC DE REFERENCE EST GELE A SA VALEUR DU 1er JANVIER, pour
  // toute l annee, MEME APRES LA REVALORISATION DE JUIN. Deux valeurs de
  // SMIC coexistent donc sur le meme bulletin : 12,31 pour payer le
  // salarie, 12,02 pour calculer la reduction.
  // ⛔ UTILISER LE SMIC COURANT ICI SUR-EVALUE LA REDUCTION, et l URSSAF
  // reclame la difference. C est l une des deux premieres causes de
  // redressement sur ce dispositif.
  //
  // ⚠️ LE CALCUL EST ANNUEL PAR NATURE, mais s applique mois par mois. Ici
  // on raisonne SUR LE MOIS, en comparant au SMIC mensuel de reference :
  // c est l approximation retenue tant que le cumul annuel n est pas tenu.
  // ⛔ SUR UN SALAIRE VARIABLE, CETTE APPROXIMATION DERIVE. Le cumul annuel
  // est a construire avant le premier bulletin reel.
  // ═══════════════════════════════════════════════════════════════════
  let rgdu = 0;
  let rgduDetail: any = null;

  const tmin = await parametre("RGDU_TMIN", periode);
  const tdelta = await parametre(
    effectif >= 50 ? "RGDU_TDELTA_50PLUS" : "RGDU_TDELTA_MOINS50", periode);
  const expo = await parametre("RGDU_P", periode);
  const seuil = await parametre("RGDU_SEUIL_SMIC", periode);
  const smicRef = await parametre("RGDU_SMIC_REFERENCE", periode);

  if (tmin !== null && tdelta !== null && expo !== null
      && seuil !== null && smicRef !== null && dureeMensuelle) {

    // 🚨 LE SMIC DE REFERENCE SUIT LA DUREE DU CONTRAT (BOSS, allegements
    // generaux) : pour un temps partiel, il est proratise. Sans cela un
    // salarie a mi-temps paraitrait paye sous le SMIC et recevrait le
    // coefficient maximal.
    const smicMensuelRef = smicRef * dureeContratMois;
    const plafondEligibilite = smicMensuelRef * seuil;

    // ═══════════════════════════════════════════════════════════════════
    // 🚨🚨 LA REGULARISATION PROGRESSIVE — LE CALCUL SUR CUMUL ANNUEL
    //
    // ⚠️ LA REDUCTION EST ANNUELLE PAR NATURE, meme si elle se verse chaque
    // mois. La calculer mois par mois est une approximation qui DERIVE des
    // que le salaire varie : une prime en decembre fait perdre en une fois
    // une reduction accordee tout au long de l annee, et l URSSAF reclame
    // la difference avec majorations. C est l une des deux premieres causes
    // de redressement sur ce dispositif.
    //
    // LA METHODE, celle que l URSSAF recommande :
    //   1. cumuler le brut depuis le debut de l annee (ou de l embauche)
    //   2. cumuler le SMIC de reference sur le meme nombre de mois
    //   3. appliquer la formule a ces CUMULS — on obtient la reduction
    //      due depuis le debut
    //   4. en retrancher ce qui a deja ete accorde : le reste est la
    //      reduction du mois
    //
    // 🚨 LA REDUCTION DU MOIS PEUT ETRE NEGATIVE, et c est voulu. Quand un
    // salarie touche une prime qui le fait sortir du champ, on reprend le
    // trop-percu du mois meme plutot que d attendre un controle. Une
    // regularisation a la baisse coute moins cher qu un redressement.
    //
    // ⚠️ LE CUMUL NE COMPTE QUE LES BULLETINS EMIS : un brouillon n a pas
    // ete remis au salarie, il ne peut pas fonder un droit.
    // ═══════════════════════════════════════════════════════════════════
    const anneeCourante = periode.slice(0, 4);
    const debutAnnee = anneeCourante + "-01-01";

    const { data: anterieurs } = await supabase
      .from("paie_bulletins")
      .select("brut, periode, detail")
      .eq("contrat_id", contratId)
      .eq("statut", "emis")
      .gte("periode", debutAnnee)
      .lt("periode", periode)
      .order("periode", { ascending: true });

    let brutCumul = brutTotal;
    let rgduDejaAccordee = 0;
    let moisCumules = 1;

    // 🆕 LE SMIC DE CE MOIS, corrige de l absence (BOSS §850).
    const smicDuMois = cts(smicMensuelRef * ratioAbsence);
    let smicAnterieurs = 0;

    for (const ant of (anterieurs || [])) {
      brutCumul += Number((ant as any).brut || 0);
      const d: any = (ant as any).detail;
      rgduDejaAccordee += Number((d && d.rgdu) || 0);
      moisCumules += 1;
      // 🚨 CHAQUE MOIS PASSE GARDE LE SMIC QU IL A RETENU. Un mois d absence
      // en mars doit peser son SMIC REDUIT dans le cumul de septembre, pas
      // un SMIC entier. Les bulletins d avant cette correction n ont pas la
      // valeur : ils comptent pour un SMIC plein, comme ils ont ete calcules.
      const sm = d && d.rgdu_detail ? Number(d.rgdu_detail.smic_mensuel_reference || 0) : 0;
      smicAnterieurs += sm > 0 ? sm : smicMensuelRef;
    }

    brutCumul = cts(brutCumul);
    rgduDejaAccordee = cts(rgduDejaAccordee);

    // ⚠️ LE SMIC DE REFERENCE SE CUMULE SUR LE MEME NOMBRE DE MOIS que le
    // brut : comparer un brut de neuf mois a un SMIC d un mois n aurait
    // aucun sens et rendrait tout le monde ineligible.
    const smicCumul = smicDuMois + smicAnterieurs;
    const plafondCumul = smicCumul * seuil;

    if (brutCumul > 0 && brutCumul < plafondCumul) {
      // Le crochet de la formule, borne entre 0 et 1.
      let crochet = 0.5 * (seuil * smicCumul / brutCumul - 1);
      if (crochet < 0) crochet = 0;
      if (crochet > 1) crochet = 1;

      let coef = tmin + tdelta * Math.pow(crochet, expo);

      // ⚠️ LE COEFFICIENT NE PEUT PAS DEPASSER Tmin + Tdelta.
      const coefMax = tmin + tdelta;
      if (coef > coefMax) coef = coefMax;
      if (coef < 0) coef = 0;

      // La reduction due depuis le debut de l annee, puis celle du mois.
      const dueDepuisDebut = cts(brutCumul * coef);
      const calcule = cts(dueDepuisDebut - rgduDejaAccordee);

      // 🚨🚨 LE PLAFOND LEGAL : LA REDUCTION NE PEUT PAS DEPASSER LES
      // COTISATIONS QU ELLE REDUIT.
      //
      // Le coefficient s applique au brut, mais ce qu on deduit ne peut pas
      // exceder ce qui est reellement du sur les cotisations eligibles. Le
      // cas se produit sur les tres bas salaires, ou le coefficient est a
      // son maximum : sans ce plafond, on deduirait plus que ce qu on doit,
      // et l URSSAF reclamerait la difference — avec majorations.
      // ⚠️ LE PLAFOND NE JOUE QUE SUR UNE REDUCTION POSITIVE : une
      // regularisation a la baisse n est pas une deduction, c est une
      // reprise, et elle n a pas de plafond.
      rgdu = calcule > 0 ? Math.min(calcule, patronalEligible) : calcule;

      rgduDetail = {
        coefficient: Math.round(coef * 10000) / 10000,
        smic_horaire_reference: smicRef,
        // 🚨 C EST LE SMIC RETENU POUR CE MOIS, corrige de l absence : la DSN
        // le declare tel quel en S21.G00.79.004, et le cumul des mois
        // suivants le relit ici.
        smic_mensuel_reference: smicDuMois,
        smic_mensuel_plein: cts(smicMensuelRef),
        ratio_absence: Math.round(ratioAbsence * 10000) / 10000,
        plafond_eligibilite: cts(plafondEligibilite),
        effectif_retenu: effectif,
        tdelta_retenu: tdelta,
        calcule_sur_le_brut: calcule,
        cotisations_eligibles: patronalEligible,
        plafonne: calcule > patronalEligible,
        montant: rgdu,
        // ⚠️ LA PHOTOGRAPHIE DU CUMUL : elle permet de refaire le calcul
        // devant un controleur sans rouvrir les bulletins precedents.
        methode: "régularisation progressive (cumul annuel)",
        mois_cumules: moisCumules,
        brut_cumule: brutCumul,
        smic_cumule: cts(smicCumul),
        due_depuis_debut: dueDepuisDebut,
        deja_accordee: rgduDejaAccordee,
        regularisation: calcule < 0,
      };
    } else {
      rgduDetail = {
        coefficient: 0,
        motif: brutTotal >= plafondEligibilite
          ? "remuneration superieure a " + seuil + " SMIC de reference ("
            + cts(plafondEligibilite) + " EUR)"
          : "brut nul",
        plafond_eligibilite: cts(plafondEligibilite),
      };
    }
  }

  // 🚨 LA REDUCTION S IMPUTE SUR LES COTISATIONS PATRONALES, jamais sur les
  // salariales. Elle diminue le cout employeur, pas le net du salarie.
  const totalPatronalApresRgdu = cts(totalPatronal - rgdu);

  // ═══════════════════════════════════════════════════════════════════
  // ---- LES CONGES PAYES ----
  //
  // 🚨 MENTION OBLIGATOIRE SUR LE BULLETIN (art. R3243-1) : le salarie doit
  // voir ce qu il a acquis et ce qu il lui reste. C est la premiere chose
  // qu il regarde apres son net.
  //
  // ⚠️ SEUL LE CDI EST CONCERNE. Sur un contrat de mission ou un CDD, les
  // conges ne sont pas pris : ils sont COMPENSES mois par mois par l ICCP.
  // Afficher un compteur sur ces contrats serait faux.
  //
  // ⚠️ ON LIT LE SOLDE, ON NE L ECRIT PAS ICI. L acquisition du mois est
  // posee au moment ou le bulletin est EMIS, pas a chaque calcul : sinon
  // un recalcul doublerait les droits du salarie.
  // ═══════════════════════════════════════════════════════════════════
  let conges: any = null;

  if (contrat.type_contrat === "cdi") {
    // La periode de reference court du 1er juin au 31 mai.
    const annee = Number(periode.slice(0, 4));
    const mois = Number(periode.slice(5, 7));
    const debutRef = (mois >= 6 ? annee : annee - 1) + "-06-01";

    const { data: solde } = await supabase
      .from("paie_conges_solde")
      .select("acquis, pris, payes, solde, unite")
      .eq("contrat_id", contratId)
      .eq("periode_ref", debutRef)
      .maybeSingle();

    conges = {
      periode_reference: debutRef,
      unite: solde ? solde.unite : "ouvrables",
      acquis: solde ? Number(solde.acquis) : 0,
      pris: solde ? Number(solde.pris) : 0,
      solde: solde ? Number(solde.solde) : 0,
      // 🚨 2,5 JOURS OUVRABLES PAR MOIS TRAVAILLE — soit 30 jours, cinq
      // semaines, sur une annee complete.
      acquisition_du_mois: 2.5,
    };
  }

  // ---- LES TOTAUX ----
  //
  // 🚨 LE NET IMPOSABLE REPREND LA CSG NON DEDUCTIBLE ET LA CRDS. Elles
  // sont retenues sur le salaire mais restent imposables : c est pourquoi
  // le net imposable est SUPERIEUR au net avant impot.
  const netAvantImpot = cts(brutTotal - totalSalarial + nonSoumis);
  // 🆕 25/09 — ET LA PART IMPOSABLE DES IJSS VERSEES PAR SUBROGATION.
  ijssImposables = cts(ijssImposables);
  const netImposable = cts(brutTotal - totalSalarial + csgNonDeductible + ijssImposables);
  // ⚠️ LE COUT EMPLOYEUR EST NET DE LA REDUCTION : c est ce que l entreprise
  // debourse reellement.
  const coutEmployeur = cts(brutTotal + totalPatronalApresRgdu);

  // ⚠️ LE PRELEVEMENT A LA SOURCE N EST PAS CALCULE ICI : son taux est
  // transmis par l administration fiscale dans le compte rendu metier de
  // la DSN. Tant que la DSN n est pas branchee, il reste a zero.
  // 🆕 16/09 — ET LE BULLETIN LE DIT. Une ligne « Prelevement a la source
  // 0,00 » sans explication laisse croire a un salarie non imposable ;
  // c est un taux NEUTRE en attente du retour de l administration.
  const prelevementSource = 0;
  const prelevementMention = "taux neutre — en attente du retour DSN";
  const netAPayer = cts(netAvantImpot - prelevementSource);

  // ---- LE MONTANT NET SOCIAL ----
  //
  // 🚨 MENTION OBLIGATOIRE SUR LE BULLETIN DEPUIS 2023, et declaree en DSN
  // depuis 2024. Il sert de reference aux prestations sociales : RSA, prime
  // d activite. Un salarie qui declare un mauvais montant net social voit
  // ses droits mal calcules.
  //
  // ⚠️ IL NE SE CONFOND NI AVEC LE NET IMPOSABLE NI AVEC LE NET A PAYER.
  // Sa definition : le brut, diminue des cotisations et contributions
  // SOCIALES OBLIGATOIRES a la charge du salarie. Il n en deduit pas le
  // prelevement a la source, et il REINTEGRE la part patronale des
  // garanties complementaires (mutuelle, prevoyance).
  //
  // ═══════════════════════════════════════════════════════════════════
  // 🚨🚨 LA REINTEGRATION DES GARANTIES COMPLEMENTAIRES
  //
  // L arrete du 31 janvier 2023 donne la formule exacte :
  //
  //   MNS = brut
  //       + part PATRONALE des garanties complementaires
  //       − cotisations sociales obligatoires salariales
  //       − part SALARIALE des garanties complementaires
  //
  // ⚠️ LA PART PATRONALE S AJOUTE AU BRUT, ce qui surprend au premier
  // regard. La raison : elle est un avantage reellement percu par le
  // salarie — l employeur paie a sa place une couverture dont il
  // beneficie. Les prestations sociales en tiennent compte.
  //
  // ⛔ SANS CETTE REINTEGRATION, LE NET SOCIAL EST FAUX des qu une
  // entreprise a une mutuelle — c est-a-dire presque toujours, la
  // complementaire sante etant obligatoire depuis 2016. Et un net social
  // faux fait mal calculer le RSA et la prime d activite du salarie, sans
  // que personne ne s en apercoive avant qu il en fasse la demande.
  //
  // 🚨 LES DEUX PARTS SE COMPENSENT EN PARTIE : sur une mutuelle partagee
  // a parts egales, l effet net est proche de zero. Ce n est pas une
  // raison de les omettre — des que le partage est inegal, l ecart
  // apparait, et c est le cas de la plupart des contrats collectifs.
  // ═══════════════════════════════════════════════════════════════════
  let complementairePatronale = 0;
  let complementaireSalariale = 0;

  for (const l of lignesCotis) {
    if ((l as any).garantie_complementaire === true) {
      complementairePatronale += Number((l as any).part_patronale || 0);
      complementaireSalariale += Number((l as any).part_salariale || 0);
    }
  }

  // ⚠️ LA PART SALARIALE N EST PAS RETRANCHEE UNE SECONDE FOIS : elle est
  // deja comprise dans `totalSalarial`, comme toute cotisation salariale.
  // La sortir du total puis la rededuire donnerait le meme resultat par un
  // chemin plus long — et le jour ou quelqu un modifie l un sans l autre,
  // le montant devient faux.
  // ═══════════════════════════════════════════════════════════════════
  // ══ LE SALAIRE MINIMUM CONVENTIONNEL ══
  //
  // 🚨 C EST UN CONTROLE, PAS UN CALCUL : il ne modifie aucun montant, il
  // signale. Un salaire sous le minimum de branche est un rappel de
  // salaire assorti de dommages-interets, et il se decouvre des annees
  // plus tard — souvent au depart du salarie.
  //
  // ⚠️ LE SMIC PRIME TOUJOURS. Quand le minimum conventionnel lui est
  // inferieur, c est le SMIC qui s applique : un minimum de branche ne
  // descend jamais en dessous. Le controle retient donc LE PLUS ELEVE
  // DES DEUX.
  //
  // ⛔ CE QUE CE CONTROLE NE FAIT PAS : il compare le SALAIRE DE BASE, pas
  // le brut. Les primes exceptionnelles, les heures supplementaires et
  // les avantages en nature n entrent pas dans l assiette du minimum
  // conventionnel — les y inclure masquerait un salaire insuffisant.
  // ═══════════════════════════════════════════════════════════════════
  let minimumConventionnel: any = null;

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 22/09 — L APPRENTI A SON PROPRE PLANCHER, ET CE N EST PAS LE SMIC
  //
  // ⛔ SANS CE BLOC, LE CONTROLE CI-DESSOUS AURAIT ALERTE SUR TOUS LES
  // APPRENTIS : un apprenti de 17 ans touche legalement 27 % du SMIC, et
  // le comparer au SMIC entier aurait affiche « SALAIRE INFERIEUR AU
  // MINIMUM » sur chaque bulletin. Une alerte qui se declenche toujours est
  // une alerte que personne ne lit — et le jour ou un vrai sous-paiement
  // arrive, il passe inapercu.
  // ⚠️ LE CONTROLE RESTE UN CONTROLE : il n ajuste aucun montant, il
  // signale. Quand le contrat porte un salaire inferieur au bareme legal,
  // c est un rappel de salaire exigible.
  // ═══════════════════════════════════════════════════════════════════
  if (appr && appr.minimum_legal !== null) {
    const baseApp = Number(contrat.salaire_mensuel || 0) > 0
      ? Number(contrat.salaire_mensuel)
      : Number(appr.minimum_legal);
    const planche = Number(appr.minimum_legal);

    minimumConventionnel = {
      idcc: contrat.idcc || null,
      apprentissage: true,
      age: appr.age,
      annee_execution: appr.annee_execution,
      pourcentage: appr.pourcentage,
      smic_mensuel: appr.smic_mensuel,
      minimum_conventionnel: null,
      plancher_retenu: cts(planche),
      salaire_de_base: cts(baseApp),
      respecte: cts(baseApp) >= cts(planche),
      ecart: cts(baseApp - planche),
    };

    if (cts(baseApp) < cts(planche)) {
      minimumConventionnel.alerte = "⛔ SALAIRE D'APPRENTI INFÉRIEUR AU "
        + "MINIMUM LÉGAL : " + cts(baseApp).toFixed(2) + " € pour un "
        + "plancher de " + cts(planche).toFixed(2) + " € ("
        + appr.pourcentage + " % du SMIC, "
        + appr.age + " ans, année " + appr.annee_execution
        + ", article D6222-26). Écart de "
        + cts(planche - baseApp).toFixed(2) + " € par mois. ⚠️ RAPPEL DE "
        + "SALAIRE EXIGIBLE, avec les cotisations recalculées dessus.";
    }
  } else if (contrat.idcc && contrat.coefficient) {
    const { data: regles } = await supabase
      .from("paie_conventions_regles")
      .select("*")
      .eq("idcc", Number(contrat.idcc))
      .lte("date_effet", periode)
      .or("date_fin.is.null,date_fin.gte." + periode);

    // ⚠️ LA CATEGORIE COMMANDE LA FORMULE : un ETAM a une indemnite
    // speciale que le cadre n a pas. Se tromper de categorie fausse le
    // minimum de plusieurs centaines d euros.
    const cat = String(contrat.categorie) === "cadre" ? "cadre" : "etam";
    const lire = function (nom: string): number | null {
      for (const r of (regles || [])) {
        if (String((r as any).regle) !== nom) continue;
        const c = (r as any).categorie;
        if (c === null || c === undefined || String(c) === cat) {
          return Number((r as any).valeur_num);
        }
      }
      return null;
    };

    const valeurPoint = lire("valeur_point");
    const indemniteSpec = lire("indemnite_speciale") || 0;

    if (valeurPoint !== null) {
      const minConv = cts(Number(contrat.coefficient) * valeurPoint
        + (cat === "etam" ? indemniteSpec : 0));

      // ⚠️ LE SMIC MENSUEL COURANT — celui qui paie (12,31 depuis juin),
      // PAS celui de la RGDU, gele a 12,02 pour toute l annee. Les deux
      // coexistent en base, et les confondre fausserait le plancher.
      const smicMensuel = cts(await parametre("SMIC_MENSUEL", periode) || 0);

      const planche = Math.max(minConv, smicMensuel);
      const base = Number(contrat.salaire_mensuel || 0);

      minimumConventionnel = {
        idcc: contrat.idcc,
        coefficient: contrat.coefficient,
        position: contrat.position_conv || null,
        categorie: cat,
        valeur_point: valeurPoint,
        indemnite_speciale: cat === "etam" ? indemniteSpec : 0,
        minimum_conventionnel: minConv,
        smic_mensuel: smicMensuel,
        plancher_retenu: planche,
        salaire_de_base: cts(base),
        respecte: base >= planche,
        ecart: cts(base - planche),
      };

      // 🚨 L ALERTE VOYAGE AVEC LE RESULTAT, dans `minimumConventionnel`.
      // L ecran et le bulletin la lisent de la : un calculateur ne doit pas
      // dependre d une liste d anomalies qui vit ailleurs.
      if (base > 0 && base < planche) {
        minimumConventionnel.alerte = "⛔ SALAIRE INFÉRIEUR AU MINIMUM : "
          + cts(base).toFixed(2) + " € pour un plancher de "
          + planche.toFixed(2) + " € (coefficient "
          + contrat.coefficient + ", IDCC " + contrat.idcc
          + "). Écart de " + (planche - base).toFixed(2)
          + " € par mois. ⚠️ RAPPEL DE SALAIRE EXIGIBLE, avec les "
          + "cotisations et les congés payés recalculés dessus.";
      }
    }
  }

  // 🆕 22/09 — CE QUE L APPRENTI A REELLEMENT COTISE, une fois le brut
  // connu. La DSN le relira : la fraction soumise est l assiette des
  // cotisations salariales, et la base CSG celle du bloc 78 de type 04.
  if (appr) {
    appr.fraction_soumise = cts(Math.max(0,
      brutTotal - Number(appr.seuil_exoneration)));
    appr.base_csg = appr.ancien_regime
      ? 0 : cts(appr.fraction_soumise * 0.9825);
    appr.brut_retenu = cts(brutTotal);
  }

  const netSocial = cts(
    brutTotal
    + complementairePatronale
    - totalSalarial
  );

  return {
    contrat: {
      id: contrat.id,
      type: contrat.type_contrat,
      salarie: (contrat.paie_salaries ? contrat.paie_salaries.prenom + " " + contrat.paie_salaries.nom : ""),
      poste: contrat.intitule_poste,
      categorie: contrat.categorie,
      idcc: contrat.idcc,
    },
    periode: periode,
    parametres: { plafond: plafond, duree_mensuelle: dureeMensuelle,
      // 🆕 Ce que le contrat retient vraiment, une fois le temps partiel
      // pris en compte. La DSN et un contrôle URSSAF le relisent ici.
      plafond_contrat: Math.round(Number(plafond) * proportionTemps * 100) / 100,
      duree_hebdo: dureeHebdo,
      duree_mensuelle_contrat: dureeContratMois,
      proportion_temps: Math.round(proportionTemps * 10000) / 10000 },

    lignes_brut: lignesBrut,
    brut_soumis: brutSoumis,
    non_soumis: nonSoumis,

    // 🆕 20/09 — CE QUE L ARRET DE TRAVAIL A RETENU. La DSN en a besoin : la
    // remuneration de type 003 est le salaire RETABLI, c est-a-dire celui
    // que le salarie aurait touche sans l absence. L assurance maladie
    // calcule les indemnites journalieres dessus.
    absences: absencesArret,
    retenue_absences: retenueArrets,
    maintiens: maintiens,
    ijss_imposables: ijssImposables,
    salaire_retabli: salaireRetabli,

    lignes_mission: lignesMission,
    ifm: ifm,
    iccp: iccp,

    brut_total: brutTotal,
    lignes_cotisations: lignesCotis,

    total_salarial: totalSalarial,
    total_patronal: totalPatronal,
    rgdu: rgdu,
    rgdu_detail: rgduDetail,
    total_patronal_apres_rgdu: totalPatronalApresRgdu,
    net_imposable: netImposable,
    minimum_conventionnel: minimumConventionnel,
    // 🆕 22/09 — LE DETAIL DE L APPRENTISSAGE. Nul sur tout autre contrat.
    apprentissage: appr,
    net_social: netSocial,
    // ⚠️ LA PHOTOGRAPHIE DE LA REINTEGRATION : elle permet de justifier le
    // montant net social devant un salarie qui demande pourquoi il differe
    // de son net a payer.
    net_social_detail: {
      brut: brutTotal,
      complementaire_patronale_reintegree: cts(complementairePatronale),
      complementaire_salariale: cts(complementaireSalariale),
      cotisations_salariales: totalSalarial,
      montant: netSocial,
    },
    conges: conges,
    conges_pris_du_mois: congesDuMois,
    indemnite_conges: cts(indemniteConges),
    net_avant_impot: netAvantImpot,
    prelevement_source: prelevementSource,
    prelevement_mention: prelevementMention,
    net_a_payer: netAPayer,
    cout_employeur: coutEmployeur,

    // ⚠️ CE QUI RESTE A FAIRE, DIT FRANCHEMENT PLUTOT QUE TU.
    // 🆕 16/09 — LES RESERVES SONT ACCENTUEES ET DEDOUBLONNEES : la
    // valorisation des conges y figurait DEUX FOIS, en court puis en long.
    // Une liste qui se repete est une liste qu on cesse de lire.
    reserves: (function () {
      const r = [
        "Les taux doivent être recoupés sur boss.gouv.fr avant tout bulletin réel.",
        "Le prélèvement à la source est à zéro : son taux vient du retour DSN.",
        "Le salaire minimum conventionnel est contrôlé quand le contrat porte un coefficient. ⚠️ Les valeurs de point ne sont pas encore recoupées sur Légifrance, et une règle de branche — la prime de vacances — n'est pas appliquée au bulletin. ⚠️ ELLE EST UNE OBLIGATION D'ENTREPRISE : la calculer depuis le bloc « Prime de vacances ». Le maintien de salaire en maladie et les congés d'ancienneté, eux, sont appliqués.",
        "La RGDU est calculée en régularisation progressive sur le cumul annuel, méthode recommandée par l'URSSAF : une prime en fin d'année est régularisée le mois même plutôt que de créer un rappel.",
        "Le montant net social réintègre la part patronale des garanties complémentaires (arrêté du 31 janvier 2023). ⚠️ Les taux de mutuelle et de prévoyance sont propres à chaque contrat collectif : tant qu'ils ne sont pas renseignés pour la société, ces lignes n'apparaissent pas.",
      ];

      // 🚨 UNE ALERTE DE MINIMUM CONVENTIONNEL PASSE EN TETE DES RESERVES.
      // Ce n est pas une reserve parmi d autres : c est un salaire
      // illegal, et il doit se voir avant tout le reste.
      if (minimumConventionnel && minimumConventionnel.alerte) {
        r.unshift(minimumConventionnel.alerte);
      }

      // 🆕 22/09 — CE QUE LE FORFAIT JOURS APPORTE, ET CE QU IL NE FAIT PAS.
      if (auForfaitJours) {
        r.push("Forfait en jours : " + forfaitJoursAn + " jours par an. Le "
          + "salaire est forfaitaire — il ne se calcule pas à l'heure — et le "
          + "salarié n'est soumis à aucune durée maximale quotidienne ou "
          + "hebdomadaire (L3121-58 et suivants). ⚠️ LES HEURES "
          + "SUPPLÉMENTAIRES N'EXISTENT PAS sur un forfait jours : en saisir "
          + "serait une erreur, et leur paiement ne régulariserait pas un "
          + "forfait dépassé. Le SMIC de la réduction générale et le plafond "
          + "de Sécurité sociale restent ceux d'un temps plein.");
        if (forfaitJoursAn > 218) {
          r.push("⛔ FORFAIT SUPÉRIEUR À 218 JOURS : le plafond légal est "
            + "dépassé (L3121-64). Il faut un accord écrit de renonciation à "
            + "des jours de repos et une majoration de salaire d'au moins "
            + "10 % sur les jours excédentaires — non calculée ici.");
        }
        if (forfaitJoursAn < 218) {
          r.push("⚠️ FORFAIT RÉDUIT (" + forfaitJoursAn + " jours) : le "
            + "plafond de Sécurité sociale se proratise alors sur les JOURS, "
            + "pas sur des heures que le contrat ne porte pas. Le moteur ne "
            + "le proratise PAS et retient un plafond plein : faire vérifier "
            + "ce bulletin.");
        }
        r.push("⚠️ LES JOURS DE REPOS (RTT) du forfait ne sont pas décomptés : "
          + "le contrat ne porte pas de compteur. Un forfait dépassé se "
          + "régularise par des jours de repos, jamais par un paiement.");
      }

      // 🆕 22/09 — CE QUE L APPRENTISSAGE APPORTE, ET CE QU IL NE FAIT PAS.
      if (appr) {
        r.push("Apprenti : "
          + (appr.pourcentage !== null
            ? appr.pourcentage + " % du SMIC (" + appr.age + " ans, année "
              + appr.annee_execution + ", article D6222-26), soit "
              + Number(appr.minimum_legal || 0).toFixed(2) + " € de minimum légal. "
            : "")
          + "Exonération de cotisations salariales sur la fraction jusqu'à "
          + Number(appr.seuil_exoneration).toFixed(2) + " € ("
          + appr.taux_exoneration + " % du SMIC"
          + (appr.ancien_regime
            ? ", contrat commencé avant le 01/03/2025"
            : "") + ")"
          + (appr.fraction_soumise > 0
            ? " ; " + Number(appr.fraction_soumise).toFixed(2)
              + " € restent soumis."
            : " ; rien ne dépasse ce seuil, aucune cotisation salariale n'est due.")
          + " ⚠️ L'employeur, lui, cotise sur la TOTALITÉ du brut : "
          + "l'exonération patronale propre à l'apprentissage est supprimée "
          + "depuis 2019, sa contrepartie est la réduction générale.");

        r.push("⚠️ CE QUE LE CALCUL DE L'APPRENTI NE FAIT PAS : la "
          + "majoration de 15 points d'un contrat court préparant un diplôme "
          + "de même niveau (D6222-30), le maintien de la rémunération entre "
          + "deux contrats successifs (D6222-29) et la base de 2e année d'une "
          + "licence professionnelle en un an (D6222-32) ne sont pas "
          + "appliqués : ils dépendent du parcours du salarié, que le "
          + "contrat ne porte pas. Les saisir comme salaire mensuel sur le "
          + "contrat s'ils s'appliquent.");

        r.push("⚠️ LA COMPLÉMENTAIRE SANTÉ, LA PRÉVOYANCE ET L'APEC ne sont "
          + "jamais couvertes par l'exonération : elles restent dues en "
          + "entier, même sous le seuil. C'est pourquoi le net d'un apprenti "
          + "n'égale pas toujours son brut.");

        if (Number(appr.seuil_exoneration) > 0
            && brutTotal > Number(plafond) * proportionTemps) {
          r.push("⚠️ CE BRUT DÉPASSE LE PLAFOND DE SÉCURITÉ SOCIALE, ce qui "
            + "est très inhabituel pour un apprenti : la répartition de la "
            + "fraction exonérée entre la tranche 1 et la tranche 2 n'est pas "
            + "tranchée par le BOSS. Faire vérifier ce bulletin.");
        }
      }

      // 🆕 Les anomalies de saisie de l apprentissage, remontees telles
      // quelles : elles disent ce qui manque en base.
      for (const n of notesApprenti) r.push(n);

      // ✅ LA VALORISATION DES CONGES EST CALCULEE DEPUIS LE 16/09 : les
      // deux methodes — maintien de salaire et regle du dixieme — sont
      // comparees a chaque prise, et la plus favorable est retenue, comme
      // l impose l article L3141-24. La reserve qui disait le contraire a
      // ete retiree.
      //
      // ⚠️ CE QUI RESTE VRAI, ET QUI MERITE D ETRE DIT : la regle du
      // dixieme se calcule sur la remuneration de la periode de reference,
      // donc sur les BULLETINS DEJA EMIS. Sur un salarie entre en cours
      // d annee, ou dont les premiers bulletins ont ete produits ailleurs,
      // elle est sous-evaluee tant que l historique n est pas complet.
      if (contrat.type_contrat === "cdi") {
        r.push("Les congés sont valorisés en comparant le maintien de salaire "
          + "et la règle du dixième, la plus favorable étant retenue. ⚠️ Le "
          + "dixième se calcule sur les bulletins déjà émis : il est "
          + "sous-évalué tant que l'historique de la période de référence "
          + "est incomplet.");
      }
      // 🚨 LE CDI N A PAS D INDEMNITE DE PRECARITE — c est normal, et c est
      // dit pour que personne ne cherche une ligne manquante. En revanche,
      // ses conges payes s acquierent mois par mois et se valorisent a la
      // prise : ce suivi n existe pas encore.
      if (contrat.type_contrat === "cdi") {
        r.unshift("CDI : aucune indemnité de précarité, c'est normal — "
          + "les congés se prennent au lieu d'être compensés.");
      }
      // 🚨 LES DEUX TAUX PROPRES A LA SOCIETE, DITS FRANCHEMENT QUAND ILS
      // MANQUENT : leur absence n est pas visible sur le bulletin — la
      // ligne vaut simplement zero — et c est exactement ce qui se
      // decouvre au controle.
      if (tauxSociete["AT_MP"] === undefined) {
        r.unshift("🚨 AUCUN TAUX AT/MP pour cette société : la cotisation vaut ZÉRO. "
          + "Elle est OBLIGATOIRE. Le taux se lit sur la notification annuelle de la "
          + "CARSAT ou sur le compte AT/MP de net-entreprises, puis se renseigne dans "
          + "paie_taux_societe. ⛔ NE JAMAIS INVENTER UNE VALEUR.");
      }
      // ═══════════════════════════════════════════════════════════════
      // 🆕 20/09 — CE QUI SE DIT SUR LE VERSEMENT MOBILITE
      //
      // ⚠️ LA COTISATION VAUT ZERO DANS TROIS CAS TRES DIFFERENTS : la
      // societe n est pas assujettie, elle l est mais personne ne l a
      // confirme, ou la commune n est pas desservie. Un bulletin qui les
      // confond ne permet pas de savoir s il faut agir.
      // ═══════════════════════════════════════════════════════════════
      if (vmColonneAbsente) {
        r.unshift("⚠️ L'assujettissement au versement mobilité ne peut pas être "
          + "lu (colonne vm_assujetti absente) : la cotisation vaut ZÉRO.");
      } else if (vmAssujetti === null) {
        r.unshift("⚠️ VERSEMENT MOBILITÉ NON CONFIRMÉ pour cette société : la "
          + "cotisation vaut ZÉRO. Il est dû à partir de 11 salariés dans le "
          + "ressort d'une autorité organisatrice, mais l'effectif retenu est la "
          + "moyenne de l'année précédente, et le seuil doit être franchi cinq "
          + "années de suite. "
          + (effectifConnu ? "Effectif connu : " + effectif + ". " : "")
          + "⛔ Cela ne se déduit pas : c'est à l'employeur de répondre.");
      } else if (vmAssujetti === true) {
        if (!inseeVm) {
          r.unshift("🚨 SOCIÉTÉ ASSUJETTIE AU VERSEMENT MOBILITÉ, mais AUCUNE "
            + "COMMUNE DE TRAVAIL n'est connue : la cotisation vaut ZÉRO. "
            + "Renseigner le code INSEE du lieu de travail sur le contrat.");
        } else if (vmLu.erreur) {
          r.unshift("🚨 Versement mobilité : la table des taux par commune n'a "
            + "pas pu être lue (" + vmLu.erreur + "). La cotisation vaut ZÉRO.");
        } else if (vmLu.aucune) {
          r.unshift("La commune " + inseeVm + " n'est dans aucun périmètre de "
            + "versement mobilité : aucune cotisation n'est due. "
            + "Source : table des taux transport de l'Urssaf.");
        } else if (tauxSociete["VERSEMENT_MOBILITE"] !== undefined) {
          r.unshift("Versement mobilité au taux saisi pour la société ("
            + tauxSociete["VERSEMENT_MOBILITE"] + " %), qui prime sur la table "
            + "des communes.");
        } else {
          const noms = (vmLu.detail || []).map(function (d: any) {
            return d.autorite + " " + d.taux + " %";
          }).join(" + ");
          r.unshift("Versement mobilité : " + vmLu.taux + " % pour la commune "
            + inseeVm + " (" + origineInsee + ")"
            + (noms ? " — " + noms : "") + ".");
        }
      }
      if (!effectifConnu) {
        r.unshift("🚨 EFFECTIF INCONNU pour cette société : le FNAL et le Tdelta de la "
          + "RGDU sont ceux des MOINS DE 50 SALARIÉS. Si l'entreprise est plus grande, "
          + "la cotisation est sous-évaluée et la réduction sur-évaluée.");
      }
      if (tempsPartiel) {
        r.unshift("Temps partiel : " + dureeHebdo.toLocaleString("fr-FR")
          + " h par semaine, soit " + dureeContratMois.toLocaleString("fr-FR")
          + " h par mois (" + Math.round(proportionTemps * 1000) / 10
          + " % d'un temps plein). Le SMIC de référence de la réduction "
          + "générale et le plafond de Sécurité sociale sont proratisés "
          + "d'autant. ⚠️ L'horaire est supposé réparti également sur cinq "
          + "jours : une répartition sur trois jours fausserait les retenues "
          + "d'absence.");
      }
      if (ratioAbsence < 1) {
        r.unshift("Réduction générale : le SMIC du mois est corrigé de "
          + "l'absence (rapport " + (Math.round(ratioAbsence * 10000) / 100)
            .toLocaleString("fr-FR") + " %, BOSS §850). Sans cette "
          + "correction, un salarié absent paraît payé sous le SMIC et "
          + "reçoit une réduction trop forte.");
      }
      for (const n of notesAvantages) r.unshift(n);
      for (const n of notesArret) r.unshift(n);
      return r;
    })(),
  };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const secret = p.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" },
      { status: 401, headers: SANS_CACHE });
  }

  const contratId = String(p.get("contrat") || "").trim();
  if (!contratId) {
    return NextResponse.json({
      erreur: "preciser ?contrat=<id> et ?periode=AAAA-MM-01",
      exemple: "/api/paie/calculer?contrat=<uuid>&periode=2026-09-01&secret=...",
    }, { status: 400, headers: SANS_CACHE });
  }

  // ⚠️ LA PERIODE EST TOUJOURS LE PREMIER DU MOIS : deux bulletins du meme
  // mois ne doivent pas pouvoir coexister par accident de date.
  let periode = String(p.get("periode") || "").trim();
  if (!periode) {
    const d = new Date();
    periode = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01";
  }
  if (!/^\d{4}-\d{2}-01$/.test(periode)) {
    return NextResponse.json({
      erreur: "la periode doit etre le premier du mois, au format AAAA-MM-01",
    }, { status: 400, headers: SANS_CACHE });
  }

  try {
    const r = await calculer(contratId, periode);
    if (r.erreur) return NextResponse.json(r, { status: 400, headers: SANS_CACHE });
    // 🚨 LA REPONSE QUI COMPTE : c est celle-la qu un cache garderait, et
    // c est un bulletin de paie. Elle ne se met jamais en reserve.
    return NextResponse.json(r, { headers: SANS_CACHE });
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) },
      { status: 500, headers: SANS_CACHE });
  }
}

