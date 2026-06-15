import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
      body: JSON.stringify({ email, password }),
    }
  );

  const data = await res.json();

  if (data.access_token) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("sb_token", data.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.cookies.set("sb_user", JSON.stringify({
      id: data.user?.id,
      email: data.user?.email,
    }), {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  }

  return NextResponse.json(
    { success: false, message: "Email ou mot de passe incorrect" },
    { status: 401 }
  );
}
