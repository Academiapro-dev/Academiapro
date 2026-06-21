// app/api/lms/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const { data, error } = await supabase
    .from("formations_lms")
    .select("*")
    .eq("formation_code", code)
    .limit(1);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "LMS non disponible" }, { status: 404 });
  }

  return NextResponse.json(data[0]);
}

