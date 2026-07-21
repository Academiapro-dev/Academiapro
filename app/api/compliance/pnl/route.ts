import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  const legitime =
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr")
    || origine.includes("vercel.app") || referent.includes("vercel.app")
    || origine.includes("localhost") || referent.includes("localhost");
  if (!legitime) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const year = parseInt(req.nextUrl.searchParams.get("year") || "", 10) || new Date().getFullYear();
  const debut = year + "-01-01";
  const fin = year + "-12-31";

  try {
    // ---- CHARGES : depenses de l'annee ----
    const { data: depenses, error: eDep } = await supabase
      .from("depenses")
      .select("montant_ttc, montant_ht, montant_tva, devise, categorie, date_depense")
      .gte("date_depense", debut)
      .lte("date_depense", fin);
    if (eDep) {
      return NextResponse.json({ error: "Lecture depenses: " + eDep.message }, { status: 500 });
    }

    // Agregation charges par devise, avec ventilation par categorie
    const charges: Record<string, { total: number; parCategorie: Record<string, number> }> = {};
    for (const d of depenses || []) {
      const dev = d.devise || "EUR";
      const montant = Number(d.montant_ttc ?? 0);
      if (!charges[dev]) charges[dev] = { total: 0, parCategorie: {} };
      charges[dev].total += montant;
      const cat = d.categorie || "Sans categorie";
      charges[dev].parCategorie[cat] = (charges[dev].parCategorie[cat] || 0) + montant;
    }

    // ---- PRODUITS : factures encaissees de l'annee ----
    // (table factures peut etre vide aujourd'hui)
    const produits: Record<string, number> = {};
    const { data: factures } = await supabase
      .from("factures")
      .select("montant_ttc, devise, date_emission, statut_paiement, est_avoir")
      .gte("date_emission", debut)
      .lte("date_emission", fin)
      .eq("statut_paiement", "payee")
      .eq("est_avoir", false);
    for (const f of factures || []) {
      const dev = f.devise || "EUR";
      produits[dev] = (produits[dev] || 0) + Number(f.montant_ttc ?? 0);
    }

    // ---- RESULTAT par devise ----
    const devises = Array.from(new Set([
      ...Object.keys(charges),
      ...Object.keys(produits),
    ]));
    const resultat: Record<string, { produits: number; charges: number; net: number }> = {};
    for (const dev of devises) {
      const p = produits[dev] || 0;
      const c = charges[dev]?.total || 0;
      resultat[dev] = { produits: p, charges: c, net: p - c };
    }

    return NextResponse.json({
      success: true,
      year,
      resultat,
      charges,
      produits,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
