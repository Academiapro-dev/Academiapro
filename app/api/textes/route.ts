import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const revalidate = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function GET() {
  try {
    const { data } = await supabase.from("textes_site").select("cle, valeur");

    const textes: any = {};
    for (const t of data || []) textes[t.cle] = t.valeur;

    return NextResponse.json({ ok: true, textes: textes });
  } catch (e: any) {
    return NextResponse.json({ ok: true, textes: {} });
  }
}
