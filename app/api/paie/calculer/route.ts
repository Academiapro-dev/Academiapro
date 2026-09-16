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

// LIRE UN PARAMETRE A LA DATE DE LA PERIODE.
//
// 🚨 « A LA DATE », PAS « LA DERNIERE VALEUR ». Un bulletin de mars 2026 se
// calcule avec le SMIC de janvier (12,02), pas celui de juin (12,31). C est
// toute la raison d etre des dates d effet.
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
    .select("effectif")
    .eq("id", contrat.societe_id)
    .maybeSingle();

  const effectif = societe && societe.effectif ? Number(societe.effectif) : 0;
  const effectifConnu = !!(societe && societe.effectif);

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
    } else if (contrat.salaire_horaire && dureeMensuelle) {
      quantite = Number(dureeMensuelle);
      taux = Number(contrat.salaire_horaire);
      base = quantite * taux;
      // ⚠️ VIRGULE FRANCAISE, PAS POINT : ce libelle part sur le bulletin
      // remis au salarie. « 151.67 h » n est pas une ecriture francaise.
      libelle = "Salaire de base (" + quantite.toLocaleString("fr-FR",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " h)";
    }

    if (base > 0) {
      const m = cts(base);
      lignesBrut.push({ libelle: libelle, quantite: quantite, taux: taux, montant: m });
      brutSoumis += m;
    }
  }

  for (const e of (elements || [])) {
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

    const base = assiette(String(c.assiette_type), brutTotal, plafond);
    if (base <= 0) continue;

    // 🚨 L AT/MP ET LE VERSEMENT MOBILITE PORTENT UN TAUX A ZERO EN BASE :
    // le vrai taux est propre a la societe. On le substitue ici.
    let tPat = Number(c.taux_patronal);
    const tauxPropreManquant = (String(c.code) === "AT_MP"
      || String(c.code) === "VERSEMENT_MOBILITE")
      && tauxSociete[String(c.code)] === undefined;

    if (tauxSociete[String(c.code)] !== undefined) {
      tPat = tauxSociete[String(c.code)];
    }

    // ⚠️ LE VERSEMENT MOBILITE N EST DU QU A PARTIR DE ONZE SALARIES dans
    // le ressort de l autorite organisatrice. En dessous, il est nul meme
    // si un taux est renseigne.
    if (String(c.code) === "VERSEMENT_MOBILITE" && effectif < 11) tPat = 0;

    const partSal = cts(base * Number(c.taux_salarial) / 100);
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
      taux_salarial: Number(c.taux_salarial),
      taux_patronal: tPat,
      part_salariale: partSal,
      part_patronale: partPat,
      eligible_rgdu: ELIGIBLES_RGDU.indexOf(String(c.code)) >= 0,
      // 🆕 16/09 — L ALERTE VOYAGE AVEC LA LIGNE, pour que le bulletin et
      // l ecran disent la meme chose sans avoir a le redeviner chacun.
      alerte: tauxPropreManquant
        ? (String(c.code) === "AT_MP"
          ? "taux à renseigner — notification CARSAT"
          : "taux à renseigner — commune du lieu de travail")
        : null,
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

    const smicMensuelRef = smicRef * dureeMensuelle;
    const plafondEligibilite = smicMensuelRef * seuil;

    if (brutTotal > 0 && brutTotal < plafondEligibilite) {
      // Le crochet de la formule, borne entre 0 et 1.
      let crochet = 0.5 * (seuil * smicMensuelRef / brutTotal - 1);
      if (crochet < 0) crochet = 0;
      if (crochet > 1) crochet = 1;

      let coef = tmin + tdelta * Math.pow(crochet, expo);

      // ⚠️ LE COEFFICIENT NE PEUT PAS DEPASSER Tmin + Tdelta.
      const coefMax = tmin + tdelta;
      if (coef > coefMax) coef = coefMax;
      if (coef < 0) coef = 0;

      const calcule = cts(brutTotal * coef);

      // 🚨🚨 LE PLAFOND LEGAL : LA REDUCTION NE PEUT PAS DEPASSER LES
      // COTISATIONS QU ELLE REDUIT.
      //
      // Le coefficient s applique au brut, mais ce qu on deduit ne peut pas
      // exceder ce qui est reellement du sur les cotisations eligibles. Le
      // cas se produit sur les tres bas salaires, ou le coefficient est a
      // son maximum : sans ce plafond, on deduirait plus que ce qu on doit,
      // et l URSSAF reclamerait la difference — avec majorations.
      rgdu = Math.min(calcule, patronalEligible);

      rgduDetail = {
        coefficient: Math.round(coef * 10000) / 10000,
        smic_horaire_reference: smicRef,
        smic_mensuel_reference: cts(smicMensuelRef),
        plafond_eligibilite: cts(plafondEligibilite),
        effectif_retenu: effectif,
        tdelta_retenu: tdelta,
        calcule_sur_le_brut: calcule,
        cotisations_eligibles: patronalEligible,
        plafonne: calcule > patronalEligible,
        montant: rgdu,
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
  const netImposable = cts(brutTotal - totalSalarial + csgNonDeductible);
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
  // ⛔ CE CALCUL EST UNE APPROXIMATION TANT QUE LA MUTUELLE ET LA PREVOYANCE
  // NE SONT PAS GEREES : elles n existent pas encore dans paie_cotisations,
  // donc rien n est a reintegrer, et le montant coincide ici avec le net
  // avant impot hors elements non soumis. A REPRENDRE le jour ou une
  // garantie complementaire sera ajoutee.
  const netSocial = cts(brutTotal - totalSalarial);

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
    parametres: { plafond: plafond, duree_mensuelle: dureeMensuelle },

    lignes_brut: lignesBrut,
    brut_soumis: brutSoumis,
    non_soumis: nonSoumis,

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
    net_social: netSocial,
    conges: conges,
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
        "Aucune convention collective n'est traitée (paie_conventions).",
        "La RGDU est calculée sur le mois, pas sur le cumul annuel : sur un salaire variable, l'approximation dérive.",
        "Les congés payés sont comptés, mais leur VALORISATION À LA PRISE n'est pas calculée : il faudra comparer le maintien de salaire et la règle du dixième, et retenir le plus favorable (art. L3141-24).",
        "Le montant net social ne réintègre aucune garantie complémentaire : mutuelle et prévoyance n'existent pas encore.",
      ];
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
      if (effectif >= 11 && tauxSociete["VERSEMENT_MOBILITE"] === undefined) {
        r.unshift("⚠️ La société compte " + effectif + " salariés : le versement "
          + "mobilité est probablement dû, mais aucun taux n'est renseigné. "
          + "Il dépend de la COMMUNE DU LIEU DE TRAVAIL.");
      }
      if (!effectifConnu) {
        r.unshift("🚨 EFFECTIF INCONNU pour cette société : le FNAL et le Tdelta de la "
          + "RGDU sont ceux des MOINS DE 50 SALARIÉS. Si l'entreprise est plus grande, "
          + "la cotisation est sous-évaluée et la réduction sur-évaluée.");
      }
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
