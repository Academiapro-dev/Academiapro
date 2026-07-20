import { NextResponse } from "next/server";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const HD = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

export const dynamic = "force-dynamic";

function genCertifId() {
  const an = new Date().getFullYear();
  const alea = Math.random().toString(16).slice(2, 10).toUpperCase();
  return "CERT-" + an + "-" + alea;
}

export async function POST(req: Request) {
  const b = await req.json();
  const email = (b.email || "").toLowerCase().trim();
  const nom = (b.nom || email).trim();
  const formation = b.formation || "";
  const score = b.score; const total = b.total;
  if (!email || !formation) return NextResponse.json({ ok: false, erreur: "email et formation requis" }, { status: 400 });

  const certif_id = genCertifId();
  let insertion = true; let erreur_insertion = "";
  const ri = await fetch(SB_URL + "/rest/v1/certificats_delivres", {
    method: "POST",
    headers: { ...HD, Prefer: "return=minimal" },
    body: JSON.stringify({ certif_id, user_email: email, nom })
  });
  if (!ri.ok) { insertion = false; erreur_insertion = (await ri.text()).slice(0, 200); }

  let email_envoye = false; let erreur_email = "";
  const rk = process.env.RESEND_API_KEY || "";
  if (!rk) {
    erreur_email = "RESEND_API_KEY absente dans Vercel";
  } else {
    const lien = "https://academiapro.fr/attestation?nom=" + encodeURIComponent(nom) + "&formation=" + encodeURIComponent(formation) + (score != null ? "&score=" + score + "&total=" + total : "");
    const html = "<div style=\"font-family:Georgia,serif;max-width:600px;margin:auto;padding:24px;border:2px solid #1d4ed8\">" +
      "<p style=\"letter-spacing:3px;color:#1d4ed8;text-align:center\">ACADEMIA PRO</p>" +
      "<h1 style=\"text-align:center\">F&eacute;licitations " + nom + " !</h1>" +
      "<p>Vous avez valid&eacute; l &eacute;valuation finale de la formation <b>" + formation + "</b>" + (score != null ? " avec un score de <b>" + score + " / " + total + "</b>" : "") + ".</p>" +
      "<p>Votre certificat de r&eacute;alisation porte le num&eacute;ro <b>" + certif_id + "</b>.</p>" +
      "<p style=\"text-align:center;margin:28px 0\"><a href=\"" + lien + "\" style=\"background:#1d4ed8;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px\">Voir et imprimer mon certificat</a></p>" +
      "<p>Jacques Lalou<br/>Fondateur, Acad&eacute;mIA Pro LLC</p></div>";
    const re = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || "AcademIA Pro <contact@academiapro.fr>", to: [email], subject: "Votre certificat de realisation - " + formation, html })
    });
    if (re.ok) { email_envoye = true; } else { erreur_email = (await re.text()).slice(0, 200); }
  }

  return NextResponse.json({ ok: insertion && email_envoye, certif_id, insertion, erreur_insertion, email_envoye, erreur_email });
}

export async function GET() {
  return NextResponse.json({ ok: true, api: "generer", usage: "POST email, nom, formation, score, total" });
}
