import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix")
      .order("domaine", { ascending: true })
      .order("prix", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, formations: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, formations: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, formations: [], error: String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
