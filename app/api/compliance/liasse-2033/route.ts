import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const BILAN_ACTIF = [
  { code: "010", libelle: "Fonds commercial", racines: ["206", "207"], sens: "debit" },
  { code: "014", libelle: "Autres immobilisations incorporelles", racines: ["201", "203", "205", "208"], sens: "debit" },
  { code: "028", libelle: "Immobilisations corporelles", racines: ["21"], sens: "debit" },
  { code: "040", libelle: "Immobilisations financieres", racines: ["26", "27"], sens: "debit" },
  { code: "044", libelle: "Amortissements et depreciations", racines: ["28", "29"], sens: "credit" },
  { code: "050", libelle: "Stocks de matieres premieres", racines: ["31", "32"], sens: "debit" },
  { code: "060", libelle: "Stocks de marchandises", racines: ["37"], sens: "debit" },
  { code: "068", libelle: "Creances clients et comptes rattaches", racines: ["411", "413", "416", "418"], sens: "debit" },
  { code: "072", libelle: "Autres creances", racines: ["409", "425", "43", "44", "45", "46"], sens: "debit" },
  { code: "084", libelle: "Disponibilites", racines: ["51", "53", "58"], sens: "debit" },
  { code: "092", libelle: "Charges constatees d avance", racines: ["486"], sens: "debit" },
];

const BILAN_PASSIF = [
  { code: "120", libelle: "Capital social ou individuel", racines: ["101", "108"], sens: "credit" },
  { code: "126", libelle: "Reserves", racines: ["106"], sens: "credit" },
  { code: "130", libelle: "Report a nouveau", racines: ["110", "119"], sens: "credit" },
  { code: "136", libelle: "Resultat de l exercice", racines: ["120", "129"], sens: "credit" },
  { code: "154", libelle: "Provisions pour risques et charges", racines: ["15"], sens: "credit" },
  { code: "156", libelle: "Emprunts et dettes assimilees", racines: ["16", "17"], sens: "credit" },
  { code: "166", libelle: "Fournisseurs et comptes rattaches", racines: ["401", "403", "404", "408"], sens: "credit" },
  { code: "172", libelle: "Autres dettes", racines: ["419", "42", "43", "44", "45", "46"], sens: "credit" },
  { code: "174", libelle: "Produits constates d avance", racines: ["487"], sens: "credit" },
];

const RESULTAT = [
  { code: "210", libelle: "Ventes de marchandises", racines: ["707"], sens: "credit" },
  { code: "214", libelle: "Production vendue - biens", racines: ["701", "702", "703"], sens: "credit" },
  { code: "218", libelle: "Production vendue - services", racines: ["704", "705", "706", "708"], sens: "credit" },
  { code: "222", libelle: "Production stockee et immobilisee", racines: ["71", "72"], sens: "credit" },
  { code: "224", libelle: "Subventions d exploitation", racines: ["74"], sens: "credit" },
  { code: "226", libelle: "Autres produits", racines: ["75", "78", "79"], sens: "credit" },
  { code: "234", libelle: "Achats de marchandises", racines: ["607"], sens: "debit" },
  { code: "238", libelle: "Achats de matieres premieres", racines: ["601", "602"], sens: "debit" },
  { code: "242", libelle: "Autres charges externes", racines: ["604", "605", "606", "61", "62"], sens: "debit" },
  { code: "244", libelle: "Impots, taxes et versements assimiles", racines: ["63"], sens: "debit" },
  { code: "250", libelle: "Salaires et traitements", racines: ["641", "644", "648"], sens: "debit" },
  { code: "252", libelle: "Charges sociales", racines: ["645", "646", "647"], sens: "debit" },
  { code: "254", libelle: "Dotations aux amortissements", racines: ["681"], sens: "debit" },
  { code: "262", libelle: "Autres charges", racines: ["65", "67", "69"], sens: "debit" },
  { code: "264", libelle: "Charges financieres", racines: ["66"], sens: "debit" },
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

// Ventile une periode dans les cases, et rend aussi les comptes orphelins.
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
        let racine = "";
        for (const r of c.racines) {
          if (num.startsWith(r) && r.length > racine.length) racine = r;
        }
        if (!racine) continue;
        if (utilises[num] && utilises[num].length >= racine.length) continue;

        const cp = comptes[num];
        const solde = c.sens === "credit" ? r2(cp.credit - cp.debit) : r2(cp.debit - cp.credit);
        if (Math.abs(solde) < 0.005) continue;

        utilises[num] = racine;
        montant = r2(montant + solde);
        detail.push({ compte: num, libelle: cp.libelle, montant: solde });
      }

      return { ...c, montant: montant, comptes: detail };
    });
  }

  const actif = remplir(BILAN_ACTIF);
  const passif = remplir(BILAN_PASSIF);
  const resultat = remplir(RESULTAT);

  const orphelins = Object.keys(comptes)
    .filter(function (n) {
      if (utilises[n]) return false;
      const c = comptes[n];
      return Math.abs(r2(c.debit - c.credit)) > 0.005;
    })
    .map(function (n) {
      return { compte: n, libelle: comptes[n].libelle, solde: r2(comptes[n].debit - comptes[n].credit) };
    });

  const amort = r2((actif.find(function (c: any) { return c.code === "044"; }) || { montant: 0 }).montant);
  const brut = r2(actif.filter(function (c: any) { return c.code !== "044"; })
    .reduce(function (s: number, c: any) { return s + c.montant; }, 0));

  const produits = r2(resultat.filter(function (c: any) { return c.sens === "credit"; })
    .reduce(function (s: number, c: any) { return s + c.montant; }, 0));
  const charges = r2(resultat.filter(function (c: any) { return c.sens === "debit"; })
    .reduce(function (s: number, c: any) { return s + c.montant; }, 0));

  return {
    actif: actif, passif: passif, resultat: resultat, orphelins: orphelins,
    total_actif: r2(brut - amort),
    total_passif: r2(passif.reduce(function (s: number, c: any) { return s + c.montant; }, 0)),
    produits: produits, charges: charges, resultat_exercice: r2(produits - charges),
    lignes: (lignes || []).length,
  };
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
      .from("compta_societes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

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

    // L exercice precedent : meme duree, decalee d un an.
    const debutN1 = String(parseInt(debut.slice(0, 4), 10) - 1) + debut.slice(4);
    const finN1 = String(parseInt(fin.slice(0, 4), 10) - 1) + fin.slice(4);

    const { data: lignesN } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, debit, credit")
      .eq("societe_id", id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .limit(50000);

    const { data: lignesN1 } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, debit, credit")
      .eq("societe_id", id)
      .gte("ecriture_date", debutN1)
      .lte("ecriture_date", finN1)
      .limit(50000);

    const n = ventiler(lignesN || []);
    const n1 = ventiler(lignesN1 || []);
    const aN1 = n1.lignes > 0;

    // On accole la colonne precedente a chaque case, avec sa variation.
    function accoler(blocN: any[], blocN1: any[]) {
      return blocN.map(function (c: any) {
        const p = blocN1.find(function (x: any) { return x.code === c.code; });
        const precedent = aN1 && p ? p.montant : null;
        const variation = precedent !== null ? r2(c.montant - precedent) : null;
        const pourcentage = precedent !== null && Math.abs(precedent) > 0.005
          ? Math.round((variation / Math.abs(precedent)) * 1000) / 10
          : null;
        return { ...c, precedent: precedent, variation: variation, pourcentage: pourcentage };
      });
    }

    const controles = [
      {
        nom: "Total actif egale total passif",
        ok: Math.abs(r2(n.total_actif - n.total_passif)) < 0.01,
        detail: "Actif " + n.total_actif.toFixed(2) + " · Passif " + n.total_passif.toFixed(2),
      },
      {
        nom: "Le resultat du compte de resultat se retrouve au bilan",
        ok: Math.abs(r2(n.resultat_exercice - (n.passif.find(function (c: any) { return c.code === "136"; }) || { montant: 0 }).montant)) < 0.01,
        detail: "Calcule " + n.resultat_exercice.toFixed(2),
      },
      {
        nom: "Tous les comptes sont ventiles",
        ok: n.orphelins.length === 0,
        detail: n.orphelins.length === 0 ? "Aucun compte orphelin" : n.orphelins.length + " compte(s) hors liasse",
      },
    ];

    return NextResponse.json({
      ok: true,
      dossier: {
        code: dossier.code, raison_sociale: dossier.raison_sociale,
        siren: dossier.siren, regime_fiscal: dossier.regime_fiscal,
      },
      periode: { debut: debut, fin: fin },
      periode_precedente: aN1 ? { debut: debutN1, fin: finN1 } : null,
      exercice_precedent_disponible: aN1,
      formulaire_2033_a: {
        actif: accoler(n.actif, n1.actif),
        passif: accoler(n.passif, n1.passif),
        total_actif: n.total_actif,
        total_passif: n.total_passif,
        total_actif_precedent: aN1 ? n1.total_actif : null,
        total_passif_precedent: aN1 ? n1.total_passif : null,
      },
      formulaire_2033_b: {
        lignes: accoler(n.resultat, n1.resultat),
        produits: n.produits, charges: n.charges, resultat: n.resultat_exercice,
        resultat_precedent: aN1 ? n1.resultat_exercice : null,
      },
      orphelins: n.orphelins,
      controles: controles,
      pret_pour_edi: controles.every(function (c: any) { return c.ok; }),
      avertissement:
        "Ventilation etablie sur les racines du plan comptable general. A verifier par "
        + "l expert-comptable avant toute teletransmission.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
