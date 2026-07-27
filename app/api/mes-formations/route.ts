import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = String(url.searchParams.get("email") || "").toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ success: false, formations: [], error: "email manquant" }, { status: 400 });
    }
    const { data: acces, error } = await supabase
      .from("acces_formations")
      .select("formation, formule, accorde_le")
      .ilike("email", email)
      .order("accorde_le", { ascending: false });
    if (error) {
      return NextResponse.json({ success: false, formations: [], error: error.message }, { status: 500 });
    }
    if (!acces || acces.length === 0) {
      return NextResponse.json({ success: true, formations: [] });
    }
    const codes = acces.map((a) => a.formation);
    const { data: fiches } = await supabase
      .from("formations")
      .select("code, titre")
      .in("code", codes);
    const titres: Record<string, string> = {};
    for (const f of fiches || []) titres[f.code] = f.titre;
    const liste = acces.map((a) => ({
      code: a.formation,
      titre: titres[a.formation] || a.formation,
      formule: a.formule,
    }));
    return NextResponse.json({ success: true, formations: liste });
  } catch (e: any) {
    return NextResponse.json({ success: false, formations: [], error: String(e) }, { status: 500 });
  }
}
