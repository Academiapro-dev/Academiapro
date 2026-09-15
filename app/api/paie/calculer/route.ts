import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LE MOTEUR DE PAIE — 15/09/2026
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

  // Le salaire de base, s il n est pas deja dans les elements.
  const aDesHeures = (elements || []).some(function (e: any) {
    return String(e.type_element).indexOf("heures") === 0;
  });

  if (!aDesHeures) {
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
      libelle = "Salaire de base (" + quantite + " h)";
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

  if (contrat.type_contrat === "mission") {
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
          libelle: r.libelle + " — non due",
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
        libelle: r.libelle,
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

    const partSal = cts(base * Number(c.taux_salarial) / 100);
    const partPat = cts(base * Number(c.taux_patronal) / 100);

    if (partSal === 0 && partPat === 0) continue;

    totalSalarial += partSal;
    totalPatronal += partPat;

    // 🚨 ON GARDE LA CSG NON DEDUCTIBLE A PART : elle est retenue sur le
    // salaire mais reste imposable. C est elle qui fait que le net
    // imposable depasse le net verse.
    if (c.code === "CSG_NON_DED" || c.code === "CRDS") {
      csgNonDeductible += partSal;
    }

    lignesCotis.push({
      code: c.code,
      libelle: c.libelle,
      famille: c.famille,
      base: cts(base),
      taux_salarial: Number(c.taux_salarial),
      taux_patronal: Number(c.taux_patronal),
      part_salariale: partSal,
      part_patronale: partPat,
    });
  }

  totalSalarial = cts(totalSalarial);
  totalPatronal = cts(totalPatronal);
  csgNonDeductible = cts(csgNonDeductible);

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

      rgdu = cts(brutTotal * coef);

      rgduDetail = {
        coefficient: Math.round(coef * 10000) / 10000,
        smic_horaire_reference: smicRef,
        smic_mensuel_reference: cts(smicMensuelRef),
        plafond_eligibilite: cts(plafondEligibilite),
        effectif_retenu: effectif,
        tdelta_retenu: tdelta,
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
  // la DSN. Tant que la DSN n est pas branchee, il reste a zero et se
  // saisit a la main si besoin.
  const prelevementSource = 0;
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
    net_avant_impot: netAvantImpot,
    prelevement_source: prelevementSource,
    net_a_payer: netAPayer,
    cout_employeur: coutEmployeur,

    // ⚠️ CE QUI RESTE A FAIRE, DIT FRANCHEMENT PLUTOT QUE TU.
    // ⚠️ CE QUI RESTE A FAIRE, DIT FRANCHEMENT PLUTOT QUE TU.
    reserves: (function () {
      const r = [
        "Les taux doivent etre recoupes sur boss.gouv.fr avant tout bulletin reel.",
        "Le taux AT/MP n est pas applique : il est propre a chaque entreprise (notifie par la CARSAT).",
        "Le versement mobilite n est pas applique : il depend de la commune.",
        "Le prelevement a la source est a zero : son taux vient du retour DSN.",
        "Aucune convention collective n est traitee (paie_conventions).",
        "La RGDU est calculee sur le mois, pas sur le cumul annuel : sur un salaire variable, l approximation derive.",
        "Le montant net social ne reintegre aucune garantie complementaire : mutuelle et prevoyance n existent pas encore.",
      ];
      if (!effectifConnu) {
        r.unshift("🚨 EFFECTIF INCONNU pour cette societe : le FNAL et le Tdelta de la RGDU sont ceux des MOINS DE 50 SALARIES. Si l entreprise est plus grande, la cotisation est sous-evaluee et la reduction sur-evaluee.");
      }
      return r;
    })(),
  };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const secret = p.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const contratId = String(p.get("contrat") || "").trim();
  if (!contratId) {
    return NextResponse.json({
      erreur: "preciser ?contrat=<id> et ?periode=AAAA-MM-01",
      exemple: "/api/paie/calculer?contrat=<uuid>&periode=2026-09-01&secret=...",
    }, { status: 400 });
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
    }, { status: 400 });
  }

  try {
    const r = await calculer(contratId, periode);
    if (r.erreur) return NextResponse.json(r, { status: 400 });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
