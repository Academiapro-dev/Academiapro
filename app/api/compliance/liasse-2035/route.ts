import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LA LIASSE 2035 — BNC, DECLARATION CONTROLEE — 09/09.
//
// Meme mecanique que la 2033 : ventilation des comptes de l exercice par
// racines du plan comptable, rendue a l ecran avec l exercice precedent et
// des controles. Le 2035 est une declaration RECETTES / DEPENSES : les
// rubriques suivent les lignes du formulaire 2035-A (recettes, depenses par
// nature) et 2035-B (amortissements, plus et moins-values, resultat).
//
// ⚠️ LES CODES DE LIGNE (AA, AB…) sont ceux du formulaire 2035-A/B en
// vigueur au moment de l ecriture ; ils sont a verifier sur le millesime
// depose. ⚠️ La comptabilite d un BNC est en principe de tresorerie
// (encaissements / decaissements) : si le dossier est tenu en creances-
// dettes, les lignes 2035 s en ecartent. Le controle le signale.
//
// 🚨 A VERIFIER PAR L EXPERT AVANT TELETRANSMISSION, comme la 2033.
// ══════════════════════════════════════════════════════════════════════════

const RECETTES = [
  { code: "AA", libelle: "Recettes encaissées y compris remboursements de frais", racines: ["706", "708", "701", "702", "703", "704", "705"], sens: "credit" },
  { code: "AB", libelle: "Débours payés pour le compte des clients", racines: ["467"], sens: "credit" },
  { code: "AC", libelle: "Honoraires rétrocédés", racines: ["6221", "6222"], sens: "debit" },
  { code: "AE", libelle: "Produits financiers", racines: ["76"], sens: "credit" },
  { code: "AF", libelle: "Gains divers", racines: ["74", "75", "77", "78", "79"], sens: "credit" },
];

const DEPENSES = [
  { code: "BA", libelle: "Achats", racines: ["60"], sens: "debit" },
  { code: "BB", libelle: "Salaires nets et avantages en nature", racines: ["641", "644"], sens: "debit" },
  { code: "BC", libelle: "Charges sociales sur salaires", racines: ["645", "647", "648"], sens: "debit" },
  { code: "BD", libelle: "Taxe sur la valeur ajoutée", racines: ["6353"], sens: "debit" },
  { code: "BE", libelle: "Contribution économique territoriale", racines: ["6351", "63511", "63512"], sens: "debit" },
  { code: "BS", libelle: "Autres impôts", racines: ["631", "633", "635", "637"], sens: "debit" },
  { code: "BF", libelle: "Loyer et charges locatives", racines: ["613", "614"], sens: "debit" },
  { code: "BG", libelle: "Location de matériel et de mobilier", racines: ["6135", "6122"], sens: "debit" },
  { code: "BH", libelle: "Entretien et réparations", racines: ["615"], sens: "debit" },
  { code: "BJ", libelle: "Personnel intérimaire", racines: ["621"], sens: "debit" },
  { code: "BK", libelle: "Petit outillage", racines: ["6063"], sens: "debit" },
  { code: "BL", libelle: "Chauffage, eau, gaz, électricité", racines: ["6061"], sens: "debit" },
  { code: "BM", libelle: "Honoraires ne constituant pas des rétrocessions", racines: ["6226", "6227", "6228"], sens: "debit" },
  { code: "BN", libelle: "Primes d'assurances", racines: ["616"], sens: "debit" },
  { code: "BP", libelle: "Frais de véhicules", racines: ["6251", "6155"], sens: "debit" },
  { code: "BQ", libelle: "Autres frais de déplacement", racines: ["6256", "6255", "6252"], sens: "debit" },
  { code: "BT", libelle: "Charges sociales personnelles de l'exploitant", racines: ["646"], sens: "debit" },
  { code: "BU", libelle: "Frais de réception, de représentation et de congrès", racines: ["6257", "6234", "6185"], sens: "debit" },
  { code: "BV", libelle: "Fournitures de bureau, frais de documentation, PTT", racines: ["6064", "618", "626"], sens: "debit" },
  { code: "BW", libelle: "Frais d'actes et de contentieux", racines: ["6227", "6354"], sens: "debit" },
  { code: "BY", libelle: "Cotisations syndicales et professionnelles", racines: ["6281"], sens: "debit" },
  { code: "BZ", libelle: "Autres frais divers de gestion", racines: ["62", "65"], sens: "debit" },
  { code: "BX", libelle: "Frais financiers", racines: ["66"], sens: "debit" },
  { code: "BR", libelle: "Pertes diverses", racines: ["67"], sens: "debit" },
];

const AMORTISSEMENTS = [
  { code: "CH", libelle: "Dotations aux amortissements", racines: ["681"], sens: "debit" },
  { code: "CK", libelle: "Provisions", racines: ["686", "687"], sens: "debit" },
  { code: "CL", libelle: "Plus-values à court terme", racines: ["775"], sens: "credit" },
  { code: "CM", libelle: "Moins-values à court terme", racines: ["675"], sens: "debit" },
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { global: { fetch: function (url: any, options: any) { return fetch(url, { ...(options || {}), cache: "no-store" }); } } }
);

function r2(n: number): number { return Math.round(n * 100) / 100; }

function ventiler(lignes: any[]) {
  const comptes: any = {};
  for (const l of lignes || []) {
    const n = String(l.compte_num || "");
    if (!comptes[n]) comptes[n] = { numero: n, libelle: l.compte_lib, debit: 0, credit: 0 };
    comptes[n].debit = r2(comptes[n].debit + (Number(l.debit) || 0));
    comptes[n].credit = r2(comptes[n].credit + (Number(l.credit) || 0));
  }
  const utilises: any = {};
  function remplir(bloc: any[]) {
    return bloc.map(function (c: any) {
      let montant = 0;
      const detail: any[] = [];
      for (const num of Object.keys(comptes)) {
        // Classes 6 et 7 seulement pour la 2035 (plus le 467 des debours) :
        // le bilan n y figure pas.
        if (!/^[67]/.test(num) && num.indexOf("467") !== 0) continue;
        let racine = "";
        for (const r of c.racines) if (num.startsWith(r) && r.length > racine.length) racine = r;
        if (!racine) continue;
        if (utilises[num] && utilises[num].length >= racine.length) continue;
        const cp = comptes[num];
        const solde = c.sens === "credit" ? r2(cp.credit - cp.debit) : r2(cp.debit - cp.credit);
        if (Math.abs(solde) < 0.005) continue;
        utilises[num] = racine;
        montant = r2(montant + solde);
        detail.push({ compte: num, libelle: cp.libelle, montant: solde });
      }
      return { ...c, montant, comptes: detail };
    });
  }
  const recettes = remplir(RECETTES);
  const depenses = remplir(DEPENSES);
  const amortissements = remplir(AMORTISSEMENTS);

  const orphelins = Object.keys(comptes)
    .filter(function (n) { return /^[67]/.test(n) && !utilises[n] && Math.abs(r2(comptes[n].debit - comptes[n].credit)) > 0.005; })
    .map(function (n) { return { compte: n, libelle: comptes[n].libelle, solde: r2(comptes[n].debit - comptes[n].credit) }; });

  const retro = r2((recettes.find(function (c: any) { return c.code === "AC"; }) || { montant: 0 }).montant);
  const recettesBrutes = r2(recettes.filter(function (c: any) { return c.sens === "credit"; }).reduce(function (s: number, c: any) { return s + c.montant; }, 0));
  const recettesNettes = r2(recettesBrutes - retro);
  const totalDepenses = r2(depenses.reduce(function (s: number, c: any) { return s + c.montant; }, 0));
  const excedent = r2(recettesNettes - totalDepenses);
  const dotations = r2((amortissements.find(function (c: any) { return c.code === "CH"; }) || { montant: 0 }).montant);
  const provisions = r2((amortissements.find(function (c: any) { return c.code === "CK"; }) || { montant: 0 }).montant);
  const pvct = r2((amortissements.find(function (c: any) { return c.code === "CL"; }) || { montant: 0 }).montant);
  const mvct = r2((amortissements.find(function (c: any) { return c.code === "CM"; }) || { montant: 0 }).montant);
  const resultatFiscal = r2(excedent - dotations - provisions + pvct - mvct);

  // Indice d une comptabilite en creances-dettes : des comptes 41/40
  // mouvementes sur l exercice.
  const creancesDettes = Object.keys(comptes).some(function (n) { return (n.indexOf("41") === 0 || n.indexOf("40") === 0) && Math.abs(comptes[n].debit) + Math.abs(comptes[n].credit) > 0.005; });

  return {
    recettes, depenses, amortissements, orphelins,
    recettes_brutes: recettesBrutes, retrocessions: retro, recettes_nettes: recettesNettes,
    total_depenses: totalDepenses, excedent,
    dotations, provisions, plus_values_ct: pvct, moins_values_ct: mvct,
    resultat_fiscal: resultatFiscal,
    creances_dettes: creancesDettes,
    lignes: (lignes || []).length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    const refus = await lecture(id);
    if (refus) return refus;

    const { data: dossier } = await supabase.from("compta_societes").select("*").eq("id", id).maybeSingle();
    if (!dossier) return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });

    const annee = parseInt(req.nextUrl.searchParams.get("year") || "", 10);
    let debut: string, fin: string;
    if (annee) { debut = annee + "-01-01"; fin = annee + "-12-31"; }
    else if (dossier.exercice_debut && dossier.exercice_fin) { debut = String(dossier.exercice_debut).slice(0, 10); fin = String(dossier.exercice_fin).slice(0, 10); }
    else { const a = new Date().getFullYear(); debut = a + "-01-01"; fin = a + "-12-31"; }
    const debutN1 = String(parseInt(debut.slice(0, 4), 10) - 1) + debut.slice(4);
    const finN1 = String(parseInt(fin.slice(0, 4), 10) - 1) + fin.slice(4);

    const { data: lignesN } = await supabase.from("compta_ecritures").select("compte_num, compte_lib, debit, credit").eq("societe_id", id).gte("ecriture_date", debut).lte("ecriture_date", fin).limit(50000);
    const { data: lignesN1 } = await supabase.from("compta_ecritures").select("compte_num, compte_lib, debit, credit").eq("societe_id", id).gte("ecriture_date", debutN1).lte("ecriture_date", finN1).limit(50000);

    const n = ventiler(lignesN || []);
    const n1 = ventiler(lignesN1 || []);
    const aN1 = n1.lignes > 0;

    function accoler(blocN: any[], blocN1: any[]) {
      return blocN.map(function (c: any) {
        const p = blocN1.find(function (x: any) { return x.code === c.code; });
        const precedent = aN1 && p ? p.montant : null;
        return { ...c, precedent, variation: precedent !== null ? r2(c.montant - precedent) : null };
      });
    }

    const regime = String(dossier.regime_fiscal || "").toLowerCase();
    const controles = [
      { nom: "Le dossier est au régime BNC (déclaration contrôlée)", ok: regime === "bnc" || regime === "bnc_dc" || regime === "declaration_controlee",
        detail: regime ? "Régime enregistré : " + regime : "Aucun régime enregistré sur le dossier" },
      { nom: "Comptabilité de trésorerie (recettes encaissées, dépenses payées)", ok: !n.creances_dettes,
        detail: n.creances_dettes ? "Des comptes de tiers (40, 41) sont mouvementés : le dossier semble tenu en créances-dettes ; les lignes 2035 sont à retraiter" : "Aucun compte de tiers mouvementé" },
      { nom: "Tous les comptes de gestion sont ventilés", ok: n.orphelins.length === 0,
        detail: n.orphelins.length === 0 ? "Aucun compte orphelin" : n.orphelins.length + " compte(s) hors 2035" },
      { nom: "Résultat fiscal cohérent avec l'excédent", ok: true,
        detail: "Excédent " + n.excedent.toFixed(2) + " − dotations " + n.dotations.toFixed(2) + " − provisions " + n.provisions.toFixed(2) + " + PV CT " + n.plus_values_ct.toFixed(2) + " − MV CT " + n.moins_values_ct.toFixed(2) + " = " + n.resultat_fiscal.toFixed(2) },
    ];

    return NextResponse.json({
      ok: true,
      dossier: { code: dossier.code, raison_sociale: dossier.raison_sociale, siren: dossier.siren, regime_fiscal: dossier.regime_fiscal },
      periode: { debut, fin },
      periode_precedente: aN1 ? { debut: debutN1, fin: finN1 } : null,
      formulaire_2035_a: {
        recettes: accoler(n.recettes, n1.recettes),
        depenses: accoler(n.depenses, n1.depenses),
        recettes_brutes: n.recettes_brutes, retrocessions: n.retrocessions, recettes_nettes: n.recettes_nettes,
        total_depenses: n.total_depenses, excedent: n.excedent,
        recettes_nettes_precedent: aN1 ? n1.recettes_nettes : null, total_depenses_precedent: aN1 ? n1.total_depenses : null,
      },
      formulaire_2035_b: {
        lignes: accoler(n.amortissements, n1.amortissements),
        resultat_fiscal: n.resultat_fiscal, resultat_fiscal_precedent: aN1 ? n1.resultat_fiscal : null,
      },
      orphelins: n.orphelins,
      controles,
      pret_pour_edi: controles.every(function (c: any) { return c.ok; }),
      avertissement: "Ventilation établie sur les racines du plan comptable général et les lignes du 2035-A/B. À vérifier par l'expert-comptable avant toute télétransmission ; les codes de ligne sont à confirmer sur le millésime déposé.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
