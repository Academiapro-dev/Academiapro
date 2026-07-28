import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function GET() {
  try {
    // Les ateliers, dont le code commence par SK, ne sont pas des formations.
    const { count: formations } = await supabase
      .from("formations")
      .select("code", { count: "exact", head: true })
      .not("code", "like", "SK%");

    const { count: ateliers } = await supabase
      .from("formations")
      .select("code", { count: "exact", head: true })
      .like("code", "SK%");

    return NextResponse.json({
      success: true,
      total: formations || 0,
      ateliers: ateliers || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, erreur: String(e) }, { status: 500 });
  }
}
