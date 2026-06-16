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
  try {
    const email = req.nextUrl.searchParams.get("email") || "";

    const [profilRes, classRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/gamification?user_email=eq.${email}&select=*`, { headers: h }),
      fetch(`${SUPABASE_URL}/rest/v1/gamification?select=*&order=xp.desc&limit=10`, { headers: h }),
    ]);

    const profilData = await profilRes.json();
    const classData = await classRes.json();

    return NextResponse.json({
      profil: Array.isArray(profilData) && profilData.length > 0 ? profilData[0] : null,
      classement: Array.isArray(classData) ? classData : [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, xp_gagner, action } = await req.json();

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/gamification?user_email=eq.${email}&select=*`,
      { headers: h }
    );
    const data = await res.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, message: "Profil non trouve" });
    }

    const profil = data[0];
    const nouvelXP = (profil.xp || 0) + xp_gagner;
    const nouveauNiveau = nouvelXP < 500 ? 1 : nouvelXP < 1500 ? 2 : nouvelXP < 3000 ? 3 : nouvelXP < 6000 ? 4 : nouvelXP < 10000 ? 5 : 6;

    await fetch(
      `${SUPABASE_URL}/rest/v1/gamification?user_email=eq.${email}`,
      {
        method: "PATCH",
        headers: { ...h, Prefer: "return=minimal" },
        body: JSON.stringify({ xp: nouvelXP, niveau: nouveauNiveau }),
      }
    );

    return NextResponse.json({
      success: true,
      xp_avant: profil.xp,
      xp_apres: nouvelXP,
      niveau: nouveauNiveau,
      action,
      message: `+${xp_gagner} XP pour : ${action}`
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
