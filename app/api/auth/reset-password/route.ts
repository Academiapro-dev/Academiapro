import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/recover`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
      body: JSON.stringify({ email }),
    }
  );

  if (res.ok) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, message: "Erreur lors de l envoi" },
    { status: 400 }
  );
}