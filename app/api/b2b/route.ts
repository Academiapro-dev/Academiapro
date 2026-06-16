import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const h = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

export async function GET() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/entreprises?select=*&order=created_at.desc`,
    { headers: h }
  );
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/entreprises`, {
      method: "POST",
      headers: { ...h, Prefer: "return=minimal" },
      body: JSON.stringify(body),
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
          to: ["contact@academiapro.fr"],
          subject: `Nouveau prospect B2B : ${body.nom_entreprise}`,
          html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;">
  <h1 style="color:#c8a96e;">Nouveau Prospect B2B</h1>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px;color:#666;">Entreprise</td><td style="padding:8px;font-weight:bold;">${body.nom_entreprise}</td></tr>
    <tr><td style="padding:8px;color:#666;">Contact</td><td style="padding:8px;">${body.contact_nom}</td></tr>
    <tr><td style="padding:8px;color:#666;">Email</td><td style="padding:8px;">${body.contact_email}</td></tr>
    <tr><td style="padding:8px;color:#666;">Secteur</td><td style="padding:8px;">${body.secteur}</td></tr>
    <tr><td style="padding:8px;color:#666;">Employes</td><td style="padding:8px;">${body.nb_employes}</td></tr>
    <tr><td style="padding:8px;color:#666;">Besoins</td><td style="padding:8px;">${body.besoins}</td></tr>
  </table>
</div>`,
        }),
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "AcadémIA Pro <contact@academiapro.fr>",
          to: [body.contact_email],
          subject: "Votre demande de devis AcadémIA Pro",
          html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;">
  <h1 style="color:#c8a96e;">AcadémIA Pro — Solutions Entreprises</h1>
  <p>Bonjour ${body.contact_nom},</p>
  <p>Nous avons bien recu votre demande de devis pour <strong>${body.nom_entreprise}</strong>.</p>
  <p>Notre equipe vous contactera sous <strong>24h</strong> avec une proposition personnalisee.</p>
  <div style="background:#f8f4ee;padding:20px;border-radius:8px;margin:20px 0;">
    <h3 style="color:#c8a96e;margin-top:0;">Prochaines etapes</h3>
    <ol>
      <li>Appel decouverte 30 min (offert)</li>
      <li>Devis personnalise sous 24h</li>
      <li>Demo de la plateforme</li>
      <li>Onboarding de vos equipes</li>
    </ol>
  </div>
  <p>A tres bientot,<br/><strong>Jacques Lalou — AcadémIA Pro</strong></p>
</div>`,
        }),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: "Erreur enregistrement" }, { status: 500 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
