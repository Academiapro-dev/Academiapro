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

  // Optionnel : borner a une annee. Sinon, tout l'historique.
  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : null;

  try {
    // ---- ACTIF : creances = factures emises non payees ----
    let qFact = supabase
      .from("factures")
      .select("montant_ttc, devise, date_emission, statut_paiement, est_avoir")
      .neq("statut_paiement", "payee")
      .eq("est_avoir", false);
    if (year) {
      qFact = qFact.gte("date_emission", year + "-01-01").lte("date_emission", year + "-12-31");
    }
    const { data: factures, error: eFact } = await qFact;
    if (eFact) {
      return NextResponse.json({ error: "Lecture factures: " + eFact.message }, { status: 500 });
    }

    const creances: Record<string, number> = {};
    for (const f of factures || []) {
      const dev = f.devise || "EUR";
      creances[dev] = (creances[dev] || 0) + Number(f.montant_ttc ?? 0);
    }

    // ---- PASSIF : dettes envers le membre = avances perso non remboursees ----
    let qDep = supabase
      .from("depenses")
      .select("montant_ttc, devise, date_depense, avance_perso, rembourse")
      .eq("avance_perso", true)
      .eq("rembourse", false);
    if (year) {
      qDep = qDep.gte("date_depense", year + "-01-01").lte("date_depense", year + "-12-31");
    }
    const { data: depenses, error: eDep } = await qDep;
    if (eDep) {
      return NextResponse.json({ error: "Lecture depenses: " + eDep.message }, { status: 500 });
    }

    const dettesMembre: Record<string, number> = {};
    for (const d of depenses || []) {
      const dev = d.devise || "EUR";
      dettesMembre[dev] = (dettesMembre[dev] || 0) + Number(d.montant_ttc ?? 0);
    }

    // ---- Synthese par devise ----
    const devises = Array.from(new Set([
      ...Object.keys(creances),
      ...Object.keys(dettesMembre),
    ]));
    const bilan: Record<string, {
      actif: { creances: number; tresorerie: number | null };
      passif: { dettes_membre: number };
      situation_nette: number | null;
    }> = {};
    for (const dev of devises) {
      const cr = creances[dev] || 0;
      const de = dettesMembre[dev] || 0;
      bilan[dev] = {
        actif: { creances: cr, tresorerie: null }, // tresorerie via API Wise plus tard
        passif: { dettes_membre: de },
        situation_nette: null, // calculable seulement avec la tresorerie
      };
    }

    return NextResponse.json({
      success: true,
      year: year || "tout",
      bilan,
      note: "Bilan de gestion (interne). La tresorerie sera ajoutee via l'API Wise. Le bilan comptable normé releve de Mr. Comptable + expert-comptable.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
