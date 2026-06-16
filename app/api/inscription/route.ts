import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { nom, email, interet, source } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: "Email requis" }, { status: 400 });
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/liste_attente`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ nom, email, interet, source }),
      }
    );

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
          subject: "Bienvenue sur la liste prioritaire AcadémIA Pro",
          html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;color:#1a1a1a;">
  <h1 style="color:#c8a96e;border-bottom:2px solid #c8a96e;padding-bottom:10px;">AcadémIA Pro</h1>
  <h2>Bienvenue ${nom} !</h2>
  <p>Vous etes officiellement sur la liste prioritaire d AcadémIA Pro.</p>
  <p>Vous serez parmi les premiers informes du lancement officiel avec une offre exclusive reservee aux membres fondateurs.</p>
  <div style="background:#f8f4ee;padding:20px;border-radius:8px;margin:20px 0;">
    <h3 style="color:#c8a96e;margin-top:0;">Ce qui vous attend</h3>
    <ul>
      <li>Acces prioritaire avant ouverture publique</li>
      <li>Tarif de lancement exclusif</li>
      <li>235 formations certifiantes avec agent IA 24h/24</li>
      <li>Seances therapeutiques avec 5 specialistes IA</li>
      <li>Classes virtuelles live mardis et jeudis</li>
    </ul>
  </div>
  <p style="color:#666;">A tres bientot,<br/><strong>Jacques Lalou</strong><br/>Fondateur AcadémIA Pro</p>
</div>
          `,
        }),
      });

      return NextResponse.json({ success: true });
    } else {
      const err = await res.text();
      if (err.includes("duplicate")) {
        return NextResponse.json({ success: false, message: "Cet email est deja inscrit" }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: "Erreur inscription" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
