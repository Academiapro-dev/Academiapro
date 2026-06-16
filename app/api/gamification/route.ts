import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, xp_gagner, action } = await req.json();

    const h = {
      "Content-Type": "application/json",
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    };

    // Lire le profil actuel
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/gamification?user_email=eq.${email}&select=*`,
      { headers: h }
    );
    const data = await res.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, message: "Profil non trouve" });
    }

    const profil = data[0];
    const nouvelXP = (profil.xp || 0) + xp_gagner;
    const nouveauNiveau = nouvelXP < 500 ? 1 : nouvelXP < 1500 ? 2 : nouvelXP < 3000 ? 3 : nouvelXP < 6000 ? 4 : nouvelXP < 10000 ? 5 : 6;

    // Mettre à jour
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/gamification?user_email=eq.${email}`,
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
