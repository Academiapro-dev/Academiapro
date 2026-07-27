import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("formations")
      .select("code, titre, prix")
      .like("code", "SK%")
      .order("code", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, ateliers: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ateliers: data || [] });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, ateliers: [], error: String(e) },
      { status: 500 }
    );
  }
}
