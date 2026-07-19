import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Cron quotidien : envoie aux prospects consentis l'etape de sequence due selon leur anciennete.

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (auth !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: etapes } = await supabase
    .from("sequences_emails")
    .select("*")
    .eq("actif", true)
    .order("etape", { ascending: true });

  if (!etapes || etapes.length === 0) {
    return NextResponse.json({ info: "aucune sequence active" });
  }

  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, email, prenom, interet, cree_le, derniere_etape_envoyee")
    .eq("consentement_marketing", true);

  let envoyes = 0;
  const maintenant = Date.now();

  for (const p of prospects || []) {
    const anciennete = (maintenant - new Date(p.cree_le).getTime()) / 86400000;
    const prochaine = etapes.find(function (e) {
      return e.etape === (p.derniere_etape_envoyee || 0) + 1 && anciennete >= e.jours_apres;
    });
    if (!prochaine) continue;

    const bonjour = p.prenom ? "Bonjour " + p.prenom : "Bonjour";
    const interetBloc = p.interet ? " (notamment en " + p.interet + ")" : "";
    const corps = prochaine.corps_html
      .split("{bonjour}").join(bonjour)
      .split("{interet_bloc}").join(interetBloc) +
      '<p style="font-size:12px;color:#888">Pour ne plus recevoir nos emails, repondez STOP.</p>';

    try {
      await resend.emails.send({
        from: "AcademIA Pro <contact@academiapro.fr>",
        to: p.email,
        subject: prochaine.sujet,
        html: corps
      });
      await supabase
        .from("prospects")
        .update({ derniere_etape_envoyee: prochaine.etape })
        .eq("id", p.id);
      envoyes = envoyes + 1;
    } catch (e) {
      // On n'avance pas le compteur : retentative demain.
    }
  }

  return NextResponse.json({ marque: "academia", envoyes: envoyes });
}
