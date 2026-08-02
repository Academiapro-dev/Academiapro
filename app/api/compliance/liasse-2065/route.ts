import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const SEUIL_TAUX_REDUIT = 42500;

// Postes de retraitement courants. Le montant lu en comptabilite n est
// qu une PROPOSITION : c est l expert-comptable qui valide.
const REINTEGRATIONS = [
  { code: "WE", libelle: "Amendes et penalites", racines: ["6712"] },
  { code: "WF", libelle: "Taxe sur les vehicules de societe", racines: ["63514"] },
  { code: "WG", libelle: "Charges somptuaires", racines: ["6234"] },
  { code: "WH", libelle: "Quote-part de frais sur dividendes", racines: [] },
  { code: "WI", libelle: "Impot sur les societes comptabilise", racines: ["695", "699"] },
  { code: "WJ", libelle: "Provisions non deductibles", racines: [] },
  { code: "WK", libelle: "Autres reintegrations", racines: [] },
];

const DEDUCTIONS = [
  { code: "XA", libelle: "Produits nets de participation", racines: [] },
  { code: "XB", libelle: "Reprises sur provisions non deduites", racines: [] },
  { code: "XC", libelle: "Plus-values a long terme", racines: [] },
  { code: "XD", libelle: "Autres deductions", racines: [] },
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

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

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

    let produits = 0;
    let charges = 0;
    const comptes: any = {};

    for (const l of lignes || []) {
      const n = String(l.compte_num || "");
      const d = Number(l.debit) || 0;
      const c = Number(l.credit) || 0;

      if (!comptes[n]) comptes[n] = { libelle: l.compte_lib, debit: 0, credit: 0 };
      comptes[n].debit = r2(comptes[n].debit + d);
      comptes[n].credit = r2(comptes[n].credit + c);

      if (n.charAt(0) === "7") produits = r2(produits + c - d);
      if (n.charAt(0) === "6") charges = r2(charges + d - c);
    }

    const resultatComptable = r2(produits - charges);

    function propose(racines: string[]): number {
      if (racines.length === 0) return 0;
      let total = 0;
      for (const n of Object.keys(comptes)) {
        for (const r of racines) {
          if (n.startsWith(r)) {
            total = r2(total + comptes[n].debit - comptes[n].credit);
            break;
          }
        }
      }
      return total > 0 ? total : 0;
    }

    // Deficits anterieurs : la somme des resultats negatifs des exercices
    // precedents, non encore imputes. On la propose, on ne l impose pas.
    const { data: anterieures } = await supabase
      .from("compta_ecritures")
      .select("compte_num, debit, credit, ecriture_date")
      .eq("societe_id", id)
      .lt("ecriture_date", debut)
      .limit(50000);

    let deficitAnterieur = 0;
    for (const l of anterieures || []) {
      const n = String(l.compte_num || "");
      if (n.startsWith("119") || n.startsWith("129")) {
        deficitAnterieur = r2(deficitAnterieur + (Number(l.debit) || 0) - (Number(l.credit) || 0));
      }
    }
    if (deficitAnterieur < 0) deficitAnterieur = 0;

    return NextResponse.json({
      ok: true,
      formulaire: "2065",
      dossier: {
        code: dossier.code, raison_sociale: dossier.raison_sociale,
        siren: dossier.siren, regime_fiscal: dossier.regime_fiscal,
      },
      periode: { debut: debut, fin: fin },
      soumis_is: dossier.regime_fiscal === "is",
      resultat_comptable: resultatComptable,
      produits: produits,
      charges: charges,
      reintegrations: REINTEGRATIONS.map(function (c: any) {
        return { code: c.code, libelle: c.libelle, propose: propose(c.racines) };
      }),
      deductions: DEDUCTIONS.map(function (c: any) {
        return { code: c.code, libelle: c.libelle, propose: 0 };
      }),
      deficit_anterieur_propose: deficitAnterieur,
      seuil_taux_reduit: SEUIL_TAUX_REDUIT,
      avertissement:
        "Les retraitements fiscaux ne sont pas calcules automatiquement : ils sont proposes "
        + "et doivent etre valides par l expert-comptable. Un logiciel qui deciderait seul "
        + "d une reintegration ferait courir un risque au client.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    function nombre(v: any): number {
      const n = Number(String(v || "0").replace(",", ".").replace(/\s/g, ""));
      return isNaN(n) ? 0 : r2(n);
    }

    const resultatComptable = nombre(b.resultat_comptable);

    const reint = Array.isArray(b.reintegrations) ? b.reintegrations : [];
    const ded = Array.isArray(b.deductions) ? b.deductions : [];

    const totalReint = r2(reint.reduce(function (s: number, x: any) { return s + nombre(x.montant); }, 0));
    const totalDed = r2(ded.reduce(function (s: number, x: any) { return s + nombre(x.montant); }, 0));

    const resultatFiscalBrut = r2(resultatComptable + totalReint - totalDed);

    // L imputation des deficits ne peut pas creer de resultat negatif.
    let deficit = nombre(b.deficit_impute);
    if (deficit < 0) deficit = 0;
    if (resultatFiscalBrut <= 0) deficit = 0;
    if (deficit > resultatFiscalBrut) deficit = resultatFiscalBrut;

    const resultatFiscal = r2(resultatFiscalBrut - deficit);
    const base = resultatFiscal > 0 ? resultatFiscal : 0;

    const tranche15 = Math.min(base, SEUIL_TAUX_REDUIT);
    const tranche25 = Math.max(base - SEUIL_TAUX_REDUIT, 0);

    // Le taux reduit suppose des conditions que le logiciel ne peut pas
    // verifier : capital libere, detention, chiffre d affaires.
    const tauxReduit = b.taux_reduit !== false;
    const is15 = tauxReduit ? r2(tranche15 * 0.15) : 0;
    const is25 = tauxReduit ? r2(tranche25 * 0.25) : r2(base * 0.25);
    const total = r2(is15 + is25);

    const deficitReportable = resultatFiscalBrut < 0
      ? r2(-resultatFiscalBrut + nombre(b.deficit_anterieur) - deficit)
      : r2(nombre(b.deficit_anterieur) - deficit);

    return NextResponse.json({
      ok: true,
      calcul: {
        resultat_comptable: resultatComptable,
        total_reintegrations: totalReint,
        total_deductions: totalDed,
        resultat_fiscal_avant_deficit: resultatFiscalBrut,
        deficit_impute: deficit,
        resultat_fiscal: resultatFiscal,
        base_imposable: base,
        tranche_15: tranche15,
        tranche_25: tranche25,
        is_15: is15,
        is_25: is25,
        is_total: total,
        taux_reduit_applique: tauxReduit,
        deficit_reportable: deficitReportable > 0 ? deficitReportable : 0,
      },
      message: base > 0
        ? "Impot sur les societes du : " + total.toFixed(2) + " EUR sur une base de "
          + base.toFixed(2) + " EUR."
        : "Aucun impot du : le resultat fiscal est de " + resultatFiscal.toFixed(2)
          + " EUR" + (deficitReportable > 0 ? ", " + deficitReportable.toFixed(2) + " EUR reportables." : "."),
      avertissement: tauxReduit
        ? "Le taux reduit de 15 % suppose un capital entierement libere, detenu a 75 % au moins "
          + "par des personnes physiques, et un chiffre d affaires inferieur au plafond legal. "
          + "Ces conditions ne sont pas verifiables par le logiciel."
        : "Taux normal applique sur la totalite du benefice.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
