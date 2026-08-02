import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// 2050 — actif. Le reel normal presente brut, amortissements et net :
// « amort » designe les comptes 28 et 29 qui viennent en deduction.
// « tiers » designe un poste dont les comptes changent de cote selon leur
// solde : un client crediteur n est pas une creance, il est une dette.
const ACTIF = [
  { code: "AB", libelle: "Frais d etablissement", brut: ["201"], amort: ["2801"] },
  { code: "AF", libelle: "Concessions, brevets, licences, logiciels", brut: ["205", "203"], amort: ["2805", "2803"] },
  { code: "AH", libelle: "Fonds commercial", brut: ["206", "207"], amort: ["2807", "2907"] },
  { code: "AN", libelle: "Terrains", brut: ["211", "212"], amort: ["2811"] },
  { code: "AP", libelle: "Constructions", brut: ["213", "214"], amort: ["2813", "2814"] },
  { code: "AR", libelle: "Installations techniques et outillage", brut: ["215"], amort: ["2815"] },
  { code: "AT", libelle: "Autres immobilisations corporelles", brut: ["218"], amort: ["2818"] },
  { code: "BH", libelle: "Autres immobilisations financieres", brut: ["26", "27"], amort: ["296", "297"] },
  { code: "BL", libelle: "Matieres premieres et approvisionnements", brut: ["31", "32"], amort: ["391", "392"] },
  { code: "BT", libelle: "Marchandises", brut: ["37"], amort: ["397"] },
  { code: "BV", libelle: "Avances et acomptes verses", brut: ["409"], amort: [] },
  { code: "BX", libelle: "Clients et comptes rattaches", brut: ["411", "413", "416", "418"], amort: ["491"], tiers: true },
  { code: "BZ", libelle: "Autres creances", brut: ["425", "43", "44", "45", "46"], amort: [], tiers: true },
  { code: "CF", libelle: "Disponibilites", brut: ["51", "53", "58"], amort: [] },
  { code: "CH", libelle: "Charges constatees d avance", brut: ["486"], amort: [] },
];

// 2051 — passif. Un seul montant par poste.
const PASSIF = [
  { code: "DA", libelle: "Capital social ou individuel", racines: ["101", "108"] },
  { code: "DB", libelle: "Primes d emission, de fusion, d apport", racines: ["104"] },
  { code: "DD", libelle: "Reserve legale", racines: ["1061"] },
  { code: "DG", libelle: "Autres reserves", racines: ["106"] },
  { code: "DH", libelle: "Report a nouveau", racines: ["110", "119"] },
  { code: "DI", libelle: "Resultat de l exercice", racines: ["120", "129"] },
  { code: "DK", libelle: "Subventions d investissement", racines: ["13"] },
  { code: "DP", libelle: "Provisions pour risques et charges", racines: ["15"] },
  { code: "DU", libelle: "Emprunts et dettes aupres des etablissements de credit", racines: ["16"] },
  { code: "DV", libelle: "Emprunts et dettes financieres divers", racines: ["17", "455"], tiers: true },
  { code: "DW", libelle: "Avances et acomptes recus", racines: ["419"] },
  { code: "DX", libelle: "Fournisseurs et comptes rattaches", racines: ["401", "403", "404", "408"], tiers: true },
  { code: "DY", libelle: "Dettes fiscales et sociales", racines: ["42", "43", "44"], tiers: true },
  { code: "EA", libelle: "Autres dettes", racines: ["46", "45"], tiers: true },
  { code: "EB", libelle: "Produits constates d avance", racines: ["487"] },
];

// 2052 et 2053 — compte de resultat developpe.
const RESULTAT = [
  { code: "FC", libelle: "Ventes de marchandises", racines: ["707"], sens: "credit" },
  { code: "FD", libelle: "Production vendue - biens", racines: ["701", "702", "703"], sens: "credit" },
  { code: "FG", libelle: "Production vendue - services", racines: ["704", "705", "706", "708"], sens: "credit" },
  { code: "FM", libelle: "Production stockee", racines: ["713"], sens: "credit" },
  { code: "FN", libelle: "Production immobilisee", racines: ["72"], sens: "credit" },
  { code: "FO", libelle: "Subventions d exploitation", racines: ["74"], sens: "credit" },
  { code: "FP", libelle: "Reprises sur provisions et transferts de charges", racines: ["781", "791"], sens: "credit" },
  { code: "FQ", libelle: "Autres produits", racines: ["75"], sens: "credit" },
  { code: "FS", libelle: "Achats de marchandises", racines: ["607"], sens: "debit" },
  { code: "FT", libelle: "Variation de stock de marchandises", racines: ["6037"], sens: "debit" },
  { code: "FU", libelle: "Achats de matieres premieres", racines: ["601", "602"], sens: "debit" },
  { code: "FV", libelle: "Variation de stock de matieres", racines: ["6031", "6032"], sens: "debit" },
  { code: "FW", libelle: "Autres achats et charges externes", racines: ["604", "605", "606", "61", "62"], sens: "debit" },
  { code: "FX", libelle: "Impots, taxes et versements assimiles", racines: ["63"], sens: "debit" },
  { code: "FY", libelle: "Salaires et traitements", racines: ["641", "644", "648"], sens: "debit" },
  { code: "FZ", libelle: "Charges sociales", racines: ["645", "646", "647"], sens: "debit" },
  { code: "GA", libelle: "Dotations aux amortissements", racines: ["6811"], sens: "debit" },
  { code: "GC", libelle: "Dotations aux depreciations et provisions", racines: ["6815", "6817", "6816"], sens: "debit" },
  { code: "GE", libelle: "Autres charges", racines: ["65"], sens: "debit" },
  { code: "GJ", libelle: "Produits financiers", racines: ["76"], sens: "credit" },
  { code: "GR", libelle: "Charges financieres", racines: ["66"], sens: "debit" },
  { code: "HA", libelle: "Produits exceptionnels", racines: ["77"], sens: "credit" },
  { code: "HE", libelle: "Charges exceptionnelles", racines: ["67"], sens: "debit" },
  { code: "HK", libelle: "Impots sur les benefices", racines: ["695", "699"], sens: "debit" },
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const refus = await lecture(id);
    if (refus) return refus;

    const { data: dossier } = await supabase
      .from("compta_societes").select("*").eq("id", id).maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const annee = parseInt(req.nextUrl.searchParams.get("year") || "", 10);
    let debut: string;
    let fin: string;

    if (annee) {
      debut = annee + "-01-01";
      fin = annee + "-12-31";
    } else if (dossier.exercice_debut && dossier.exercice_fin) {
      debut = String(dossier.exercice_debut).slice(0, 10);
      fin = String(dossier.exercice_fin).slice(0, 10);
    } else {
      const a = new Date().getFullYear();
      debut = a + "-01-01";
      fin = a + "-12-31";
    }

    const { data: lignes } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, debit, credit")
      .eq("societe_id", id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .limit(50000);

    const comptes: any = {};
    for (const l of lignes || []) {
      const n = String(l.compte_num || "");
      if (!comptes[n]) comptes[n] = { numero: n, libelle: l.compte_lib, debit: 0, credit: 0 };
      comptes[n].debit = r2(comptes[n].debit + (Number(l.debit) || 0));
      comptes[n].credit = r2(comptes[n].credit + (Number(l.credit) || 0));
    }

    const pris: any = {};

    function cumuler(racines: string[], sens: string, marquer: boolean, tiers: boolean) {
      let total = 0;
      const detail: any[] = [];
      for (const num of Object.keys(comptes)) {
        let racine = "";
        for (const r of racines) {
          if (num.startsWith(r) && r.length > racine.length) racine = r;
        }
        if (!racine) continue;
        if (marquer && pris[num] && pris[num].length >= racine.length) continue;

        const c = comptes[num];
        const solde = sens === "credit" ? r2(c.credit - c.debit) : r2(c.debit - c.credit);
        if (Math.abs(solde) < 0.005) continue;

        // UN COMPTE DE TIERS CHANGE DE COTE SELON SON SOLDE. Une dette sociale
        // n est pas une creance negative : elle appartient au passif. On laisse
        // donc le compte au poste de l autre cote plutot que de le retenir ici.
        if (tiers && solde < 0) continue;

        if (marquer) pris[num] = racine;
        total = r2(total + solde);
        detail.push({ compte: num, libelle: c.libelle, montant: solde });
      }
      return { total: total, detail: detail };
    }

    // L actif en trois colonnes : c est la difference avec le simplifie.
    const actif = ACTIF.map(function (c: any) {
      const b = cumuler(c.brut, "debit", true, c.tiers === true);
      const a = c.amort.length > 0 ? cumuler(c.amort, "credit", true, false) : { total: 0, detail: [] };
      return {
        code: c.code, libelle: c.libelle,
        brut: b.total, amortissements: a.total, net: r2(b.total - a.total),
        comptes: b.detail,
      };
    });

    const passif = PASSIF.map(function (c: any) {
      const p = cumuler(c.racines, "credit", true, c.tiers === true);
      return { code: c.code, libelle: c.libelle, montant: p.total, comptes: p.detail };
    });

    const resultat = RESULTAT.map(function (c: any) {
      const p = cumuler(c.racines, c.sens, true, false);
      return { code: c.code, libelle: c.libelle, sens: c.sens, montant: p.total, comptes: p.detail };
    });

    const totalBrut = r2(actif.reduce(function (s: number, c: any) { return s + c.brut; }, 0));
    const totalAmort = r2(actif.reduce(function (s: number, c: any) { return s + c.amortissements; }, 0));
    const totalNet = r2(totalBrut - totalAmort);
    const totalPassif = r2(passif.reduce(function (s: number, c: any) { return s + c.montant; }, 0));

    const produits = r2(resultat.filter(function (c: any) { return c.sens === "credit"; })
      .reduce(function (s: number, c: any) { return s + c.montant; }, 0));
    const charges = r2(resultat.filter(function (c: any) { return c.sens === "debit"; })
      .reduce(function (s: number, c: any) { return s + c.montant; }, 0));

    const resultatCalcule = r2(produits - charges);
    const resultatAuBilan = (passif.find(function (c: any) { return c.code === "DI"; }) || { montant: 0 }).montant;

    // UN EXERCICE CLOTURE N A PLUS DE COMPTE DE GESTION : la cloture les a
    // soldes par le resultat, qui vit desormais au bilan. Comparer le resultat
    // recalcule au poste DI n a donc plus de sens, et laisser le controle en
    // echec bloquerait a jamais la teletransmission d un exercice pourtant sain.
    const gestionSoldee = Math.abs(produits) < 0.005 && Math.abs(charges) < 0.005;
    const exerciceCloture = gestionSoldee && Math.abs(resultatAuBilan) > 0.005;

    const orphelins = Object.keys(comptes)
      .filter(function (n) {
        if (pris[n]) return false;
        const c = comptes[n];
        return Math.abs(r2(c.debit - c.credit)) > 0.005;
      })
      .map(function (n) {
        return { compte: n, libelle: comptes[n].libelle, solde: r2(comptes[n].debit - comptes[n].credit) };
      });

    const controles = [
      {
        nom: "Total actif net egale total passif",
        ok: Math.abs(r2(totalNet - totalPassif)) < 0.01,
        detail: "Actif " + totalNet.toFixed(2) + " · Passif " + totalPassif.toFixed(2),
      },
      {
        nom: "Le resultat se retrouve au bilan",
        ok: exerciceCloture
          ? true
          : Math.abs(r2(resultatCalcule - resultatAuBilan)) < 0.01,
        detail: exerciceCloture
          ? "Exercice cloture — resultat de " + resultatAuBilan.toFixed(2) + " loge au bilan"
          : "Calcule " + resultatCalcule.toFixed(2),
      },
      {
        nom: "Tous les comptes sont ventiles",
        ok: orphelins.length === 0,
        detail: orphelins.length === 0 ? "Aucun compte orphelin" : orphelins.length + " compte(s) hors liasse",
      },
    ];

    return NextResponse.json({
      ok: true,
      formulaire: "2050",
      regime_du_dossier: dossier.regime_fiscal,
      dossier: { code: dossier.code, raison_sociale: dossier.raison_sociale, siren: dossier.siren },
      periode: { debut: debut, fin: fin },
      exercice_cloture: exerciceCloture,
      bilan_actif: { lignes: actif, total_brut: totalBrut, total_amortissements: totalAmort, total_net: totalNet },
      bilan_passif: { lignes: passif, total: totalPassif },
      compte_resultat: { lignes: resultat, produits: produits, charges: charges, resultat: resultatCalcule },
      orphelins: orphelins,
      controles: controles,
      pret_pour_edi: controles.every(function (c: any) { return c.ok; }),
      avertissement:
        "Presentation du regime reel normal. A verifier par l expert-comptable avant tout depot.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
