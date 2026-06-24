import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    }
  );

  if (res.ok) {
    return NextResponse.json({ success: true });
  }

  const data = await res.json();
  return NextResponse.json(
    { success: false, message: data.message || "Erreur" },
    { status: 400 }
  );
}