import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  try {
    const { count } = await supabase
      .from("formations")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({ success: true, total: count || 0 });
  } catch (error: any) {
    return NextResponse.json({ success: false, total: 263 }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
