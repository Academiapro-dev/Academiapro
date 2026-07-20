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

async function delivrer(email: string, nom: string, formation: string, score: any, total: any) {
  const certif_id = genCertifId();
  let insertion = false; let erreur_insertion = "";
  try {
    const ri = await fetch(SB_URL + "/rest/v1/certificats_delivres", {
      method: "POST",
      headers: { ...HD, Prefer: "return=minimal" },
      body: JSON.stringify({ certif_id, user_email: email, nom, formation_code: formation })
    });
    if (ri.ok) { insertion = true; } else { erreur_insertion = (await ri.text()).slice(0, 300); }
  } catch (e: any) { erreur_insertion = String(e).slice(0, 300); }

  let email_envoye = false; let erreur_email = "";
  const rk = process.env.RESEND_API_KEY || "";
  if (!rk) {
    erreur_email = "Variable RESEND_API_KEY absente ou nommee autrement dans Vercel";
  } else {
    try {
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
      const rtxt = await re.text();
      if (re.ok) { email_envoye = true; } else { erreur_email = rtxt.slice(0, 300); }
    } catch (e: any) { erreur_email = String(e).slice(0, 300); }
  }
  return { ok: insertion && email_envoye, certif_id, insertion, erreur_insertion, email_envoye, erreur_email };
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const email = (u.searchParams.get("email") || "").toLowerCase().trim();
  const nom = u.searchParams.get("nom") || email;
  const formation = u.searchParams.get("formation") || "";
  if (!email || !formation) return NextResponse.json({ ok: true, api: "generer", usage: "GET ?email=...&nom=...&formation=...&score=2&total=2 pour un test direct" });
  const res = await delivrer(email, nom, formation, u.searchParams.get("score"), u.searchParams.get("total"));
  return NextResponse.json(res);
}

export async function POST(req: Request) {
  const b = await req.json();
  const email = (b.email || "").toLowerCase().trim();
  if (!email || !b.formation) return NextResponse.json({ ok: false, erreur: "email et formation requis" }, { status: 400 });
  const res = await delivrer(email, (b.nom || email).trim(), b.formation, b.score, b.total);
  return NextResponse.json(res);
}
