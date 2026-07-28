import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RESEND_KEY = process.env.RESEND_API_KEY || "";
const SITE = "https://academiapro.fr";

async function envoyerEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: "AcadémIA Pro <contact@academiapro.fr>",
      to: [to],
      subject,
      html,
    }),
  });

  await fetch(`${SUPABASE_URL}/rest/v1/emails_automatiques`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ type: subject, destinataire: to, sujet: subject, statut: res.ok ? "envoye" : "erreur" }),
  });

  return res.ok;
}

const TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  bienvenue: (d) => ({
    subject: "Bienvenue sur AcadémIA Pro !",
    html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;background:#050508;color:#fff;">
  <h1 style="color:#c8a96e;border-bottom:2px solid #c8a96e;padding-bottom:15px;">AcadémIA Pro</h1>
  <h2>Bienvenue ${d.nom} !</h2>
  <p style="color:rgba(255,255,255,0.8);line-height:1.8;">
    Votre compte AcadémIA Pro est activé. Vous avez maintenant accès à :
  </p>
  <div style="background:rgba(200,169,110,0.1);border:1px solid rgba(200,169,110,0.3);border-radius:8px;padding:20px;margin:20px 0;">
    <ul style="color:rgba(255,255,255,0.8);line-height:2;">
      <li>266 formations professionnelles</li>
      <li>Agent IA tuteur 24h/24</li>
      <li>5 accompagnants IA spécialisés</li>
      <li>Classes virtuelles live</li>
      <li>Certificat AcadémIA Pro après évaluation</li>
    </ul>
  </div>
  <a href="${SITE}/dashboard" style="display:inline-block;background:#c8a96e;color:#050508;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin:15px 0;">
    Accéder à mon espace
  </a>
  <p style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:30px;">
    Jacques · Fondateur AcadémIA Pro
  </p>
</div>`,
  }),

  rappel_classe: (d) => ({
    subject: `Rappel : Classe virtuelle dans 1h — ${d.titre}`,
    html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;background:#050508;color:#fff;">
  <h1 style="color:#c8a96e;">AcadémIA Pro — Classe Virtuelle</h1>
  <h2>Votre classe commence dans 1h !</h2>
  <div style="background:rgba(200,169,110,0.1);border:1px solid rgba(200,169,110,0.3);border-radius:8px;padding:20px;margin:20px 0;">
    <p style="color:#c8a96e;font-size:18px;font-weight:bold;margin:0 0 10px;">${d.titre}</p>
    <p style="color:rgba(255,255,255,0.7);margin:0;">Aujourd hui à ${d.heure}</p>
  </div>
  <a href="${SITE}/classe-virtuelle" style="display:inline-block;background:#c8a96e;color:#050508;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">
    Rejoindre la classe
  </a>
</div>`,
  }),

  certificat: (d) => ({
    subject: `Félicitations ! Vous avez obtenu votre certificat — ${d.formation}`,
    html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;background:#050508;color:#fff;">
  <h1 style="color:#c8a96e;">AcadémIA Pro — Certificat</h1>
  <h2>Félicitations ${d.nom} ! 🏆</h2>
  <p style="color:rgba(255,255,255,0.8);line-height:1.8;">
    Vous avez complété avec succès la formation <strong style="color:#c8a96e;">${d.formation}</strong>
    et obtenu votre certificat AcadémIA Pro.
  </p>
  <div style="background:linear-gradient(135deg,#0d0d2b,#1a1a2e);border:2px solid #c8a96e;border-radius:12px;padding:25px;margin:20px 0;text-align:center;">
    <div style="font-size:40px;margin-bottom:10px;">🏆</div>
    <div style="color:#c8a96e;font-size:20px;font-weight:bold;">Certificat AcadémIA Pro</div>
    <div style="color:#fff;font-size:16px;margin-top:5px;">${d.nom}</div>
    <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:5px;">${d.formation}</div>
  </div>
  <a href="${SITE}/mes-certificats" style="display:inline-block;background:#c8a96e;color:#050508;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">
    Télécharger mon certificat
  </a>
  <p style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:20px;">
    Partagez votre réussite sur LinkedIn avec le hashtag #AcademiaPro
  </p>
</div>`,
  }),

  relance: (d) => ({
    subject: "Vous nous manquez sur AcadémIA Pro !",
    html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;background:#050508;color:#fff;">
  <h1 style="color:#c8a96e;">AcadémIA Pro</h1>
  <h2>Bonjour ${d.nom},</h2>
  <p style="color:rgba(255,255,255,0.8);line-height:1.8;">
    Cela fait quelques jours que nous ne vous avons pas vu sur la plateforme.
    Votre agent IA tuteur est disponible et attend vos questions !
  </p>
  <div style="background:rgba(200,169,110,0.1);border:1px solid rgba(200,169,110,0.3);border-radius:8px;padding:20px;margin:20px 0;">
    <h3 style="color:#c8a96e;margin-top:0;">Ce qui vous attend</h3>
    <ul style="color:rgba(255,255,255,0.7);line-height:2;">
      <li>Reprenez votre formation là où vous l avez laissée</li>
      <li>Votre agent tuteur, disponible à toute heure</li>
      <li>Votre manuel complet, à télécharger quand vous voulez</li>
    </ul>
  </div>
  <a href="${SITE}/dashboard" style="display:inline-block;background:#c8a96e;color:#050508;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">
    Reprendre ma formation
  </a>
</div>`,
  }),

  newsletter: (d) => ({
    subject: `AcadémIA Pro — Actualités de la semaine`,
    html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;background:#050508;color:#fff;">
  <h1 style="color:#c8a96e;border-bottom:2px solid #c8a96e;padding-bottom:15px;">AcadémIA Pro Newsletter</h1>
  <p style="color:rgba(255,255,255,0.6);">Semaine du ${d.date}</p>

  <h2 style="color:#c8a96e;">Nouveautés cette semaine</h2>
  <ul style="color:rgba(255,255,255,0.8);line-height:2;">
    <li>Nouvelles formations ajoutées au catalogue</li>
    <li>Nouveau contenu blog disponible</li>
  </ul>

  <h2 style="color:#c8a96e;">Formation de la semaine</h2>
  <div style="background:rgba(200,169,110,0.1);border:1px solid rgba(200,169,110,0.3);border-radius:8px;padding:20px;margin:15px 0;">
    <h3 style="color:#fff;margin:0 0 8px;">${d.formation_semaine || "Expert Claude et IA Générative"}</h3>
    <p style="color:rgba(255,255,255,0.6);margin:0;font-size:13px;">Formation phare de la semaine · Certificat AcadémIA Pro inclus</p>
  </div>

  <a href="${SITE}/catalogue" style="display:inline-block;background:#c8a96e;color:#050508;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin:15px 0;">
    Voir toutes les formations
  </a>

  <p style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:30px;border-top:1px solid rgba(255,255,255,0.1);padding-top:15px;">
    AcadémIA Pro · contact@academiapro.fr ·
    <a href="${SITE}/desinscription" style="color:rgba(255,255,255,0.3);">Se désinscrire</a>
  </p>
</div>`,
  }),
};

export async function POST(req: NextRequest) {
  try {
    const { type, destinataire, data } = await req.json();

    if (!TEMPLATES[type]) {
      return NextResponse.json({ success: false, message: "Type email inconnu" }, { status: 400 });
    }

    const template = TEMPLATES[type](data || {});
    const ok = await envoyerEmail(destinataire, template.subject, template.html);

    return NextResponse.json({ success: ok, message: ok ? "Email envoye" : "Erreur envoi" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
