import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
}

// Lit le tenant_id depuis le cookie de session sb_user.
// Retourne null si absent : la route doit alors refuser la requete.
function tenantDeLaSession(req: NextRequest): string | null {
  try {
    const brut = req.cookies.get("sb_user")?.value;
    if (!brut) return null;
    const donnees = JSON.parse(decodeURIComponent(brut));
    return donnees?.tenant_id || null;
  } catch {
    return null;
  }
}

function trimestreDe(dateStr: string): number {
  const m = new Date(dateStr).getMonth();
  return Math.floor(m / 3) + 1;
}

export async function GET(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = tenantDeLaSession(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const year = parseInt(req.nextUrl.searchParams.get("year") || "", 10) || new Date().getFullYear();
  const debut = year + "-01-01";
  const fin = year + "-12-31";

  try {
    // ---- CHARGES : depenses de l'annee, du tenant courant ----
    const { data: depenses, error: eDep } = await supabase
      .from("depenses")
      .select("montant_ttc, devise, categorie, date_depense, projet")
      .eq("tenant_id", tenantId)
      .gte("date_depense", debut)
      .lte("date_depense", fin)
      .limit(5000);
    if (eDep) {
      return NextResponse.json({ error: "Lecture depenses: " + eDep.message }, { status: 500 });
    }

    const charges: Record<string, { total: number; parCategorie: Record<string, number> }> = {};
    const trimestres: Record<string, Record<number, { produits: number; charges: number }>> = {};

    const parProjet: Record<string, Record<string, { produits: number; charges: number }>> = {};
    function ensureProjet(proj: string, dev: string) {
      if (!parProjet[proj]) parProjet[proj] = {};
      if (!parProjet[proj][dev]) parProjet[proj][dev] = { produits: 0, charges: 0 };
    }

    function ensureTrim(dev: string) {
      if (!trimestres[dev]) {
        trimestres[dev] = { 1: { produits: 0, charges: 0 }, 2: { produits: 0, charges: 0 }, 3: { produits: 0, charges: 0 }, 4: { produits: 0, charges: 0 } };
      }
    }

    for (const d of depenses || []) {
      const dev = d.devise || "EUR";
      const montant = Number(d.montant_ttc ?? 0);
      if (!charges[dev]) charges[dev] = { total: 0, parCategorie: {} };
      charges[dev].total += montant;
      const cat = d.categorie || "Sans categorie";
      charges[dev].parCategorie[cat] = (charges[dev].parCategorie[cat] || 0) + montant;
      ensureTrim(dev);
      const t = trimestreDe(d.date_depense);
      trimestres[dev][t].charges += montant;
      const proj = d.projet || "non_affecte";
      ensureProjet(proj, dev);
      parProjet[proj][dev].charges += montant;
    }

    // ---- PRODUITS : factures encaissees de l'annee, du tenant courant ----
    const produits: Record<string, number> = {};
    const { data: factures, error: eFact } = await supabase
      .from("factures")
      .select("montant_ttc, devise, date_emission, statut_paiement, est_avoir, projet")
      .eq("tenant_id", tenantId)
      .gte("date_emission", debut)
      .lte("date_emission", fin)
      .eq("statut_paiement", "payee")
      .eq("est_avoir", false)
      .limit(5000);
    if (eFact) {
      return NextResponse.json({ error: "Lecture factures: " + eFact.message }, { status: 500 });
    }

    for (const f of factures || []) {
      const dev = f.devise || "EUR";
      const montant = Number(f.montant_ttc ?? 0);
      produits[dev] = (produits[dev] || 0) + montant;
      ensureTrim(dev);
      const t = trimestreDe(f.date_emission);
      trimestres[dev][t].produits += montant;
      const proj = f.projet || "non_affecte";
      ensureProjet(proj, dev);
      parProjet[proj][dev].produits += montant;
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

    // ---- Resultat net par trimestre ----
    const trimestresNet: Record<string, Record<number, { produits: number; charges: number; net: number }>> = {};
    for (const dev of Object.keys(trimestres)) {
      trimestresNet[dev] = {} as any;
      for (const t of [1, 2, 3, 4]) {
        const bloc = trimestres[dev][t];
        trimestresNet[dev][t] = { produits: bloc.produits, charges: bloc.charges, net: bloc.produits - bloc.charges };
      }
    }

    // ---- Resultat net par projet ----
    const parProjetNet: Record<string, Record<string, { produits: number; charges: number; net: number }>> = {};
    for (const proj of Object.keys(parProjet)) {
      parProjetNet[proj] = {};
      for (const dev of Object.keys(parProjet[proj])) {
        const bloc = parProjet[proj][dev];
        parProjetNet[proj][dev] = { produits: bloc.produits, charges: bloc.charges, net: bloc.produits - bloc.charges };
      }
    }

    return NextResponse.json({
      success: true,
      year,
      tenant_id: tenantId,
      resultat,
      charges,
      produits,
      trimestres: trimestresNet,
      parProjet: parProjetNet,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
