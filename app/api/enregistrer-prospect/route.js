import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Enregistre un prospect depuis le formulaire /interet et envoie l'email de bienvenue.

export async function POST(req) {
  let corps;
  try { corps = await req.json(); } catch { return NextResponse.json({ erreur: "requete invalide" }, { status: 400 }); }

  const email = (corps.email || "").trim().toLowerCase();
  const prenom = (corps.prenom || "").trim().slice(0, 80);
  const interet = (corps.interet || "").trim().slice(0, 120);
  const consentement = corps.consentement === true;

  if (!email || !email.includes("@") || email.length > 200) {
    return NextResponse.json({ erreur: "email invalide" }, { status: 400 });
  }
  if (!consentement) {
    return NextResponse.json({ erreur: "consentement requis" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.from("prospects").insert({
    email, prenom, interet,
    source: "formulaire",
    consentement_marketing: true,
    date_consentement: new Date().toISOString()
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, info: "deja inscrit" });
    }
    return NextResponse.json({ erreur: "enregistrement impossible" }, { status: 500 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const bonjour = prenom ? "Bonjour " + prenom : "Bonjour";
    await resend.emails.send({
      from: "AcademIA Pro <contact@academiapro.fr>",
      to: email,
      subject: "Bienvenue chez AcademIA Pro",
      html: "<p>" + bonjour + ",</p>" +
        "<p>Merci pour votre inscription ! Vous faites desormais partie des premiers informes.</p>" +
        "<p>AcademIA Pro, c'est 263 formations professionnelles avec IA integree" +
        (interet ? ", dont plusieurs dans le domaine qui vous interesse : <strong>" + interet + "</strong>" : "") +
        ".</p>" +
        "<p>Decouvrez le catalogue : <a href=\"https://academiapro.fr\">academiapro.fr</a></p>" +
        "<p>Au lancement, l'Offre Fondateur reservera un avantage exclusif aux 100 premiers inscrits &mdash; vous serez prevenu en priorite.</p>" +
        "<p>A tres vite,<br/>Jacques, fondateur<br/>AcademIA Pro</p>" +
        "<p style=\"font-size:12px;color:#888\">Vous recevez cet email car vous vous etes inscrit sur academiapro.fr/interet. Pour ne plus recevoir nos emails, repondez STOP.</p>"
    });
  } catch (e) {
    // L'inscription reste valide meme si l'email echoue.
  }

  return NextResponse.json({ ok: true });
}
