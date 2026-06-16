import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const h = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

export async function GET(req: NextRequest) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/blog?select=*&order=created_at.desc`,
    { headers: h }
  );
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog`, {
      method: "POST",
      headers: { ...h, Prefer: "return=minimal" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return NextResponse.json({ success: true });
    }
    const err = await res.text();
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...body } = await req.json();
    await fetch(`${SUPABASE_URL}/rest/v1/blog?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...h, Prefer: "return=minimal" },
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
