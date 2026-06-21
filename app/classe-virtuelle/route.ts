import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get("categorie");

  let query = supabase
    .from("classes_virtuelles")
    .select("*")
    .gte("date_session", "2026-01-01")
    .order("date_session", { ascending: true });

  if (categorie) {
    query = query.eq("categorie", categorie);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

