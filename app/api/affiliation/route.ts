import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const h = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

export async function POST(req: NextRequest) {
  try {
    const { nom, email, code_affiliation } = await req.json();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/affilies`, {
      method: "POST",
      headers: { ...h, Prefer: "return=minimal" },
      body: JSON.stringify({ nom, email, code_affiliation, commission_pct: 15, statut: "actif" }),
    });

    if (res.ok) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "AcadémIA Pro <contact@academiapro.fr>",
          to: [email],
          subject: "Bienvenue dans le Programme Affilié AcadémIA Pro",
          html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;">
  <h1 style="color:#c8a96e;">AcadémIA Pro — Programme Affilié</h1>
  <h2>Bienvenue ${nom} !</h2>
  <p>Votre compte affilié est créé. Voici votre lien unique :</p>
  <div style="background:#f8f4ee;padding:15px;border-radius:8px;margin:20px 0;">
    <strong>Lien :</strong> academiapro.vercel.app/?ref=${code_affiliation}<br/>
    <strong>Code :</strong> ${code_affiliation}<br/>
    <strong>Commission :</strong> 15% sur chaque vente
  </div>
  <p>Partagez votre lien et gagnez 15% sur chaque formation vendue.</p>
  <p>Bonne chance !<br/><strong>Jacques, fondateur — AcadémIA Pro</strong></p>
</div>`,
        }),
      });

      return NextResponse.json({ success: true, code: code_affiliation });
    }

    const err = await res.text();
    if (err.includes("duplicate")) {
      return NextResponse.json({ success: false, message: "Cet email est deja inscrit" });
    }
    return NextResponse.json({ success: false, message: "Erreur inscription" }, { status: 500 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
