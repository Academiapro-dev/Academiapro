// app/api/emailing/route.ts — Agent Emailing connecté à CAM
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!;
const CLAUDE_MODEL = "claude-sonnet-4-6";

async function appel_claude(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  return data.content[0].text || "";
}

async function envoyer_email(destinataire: string, sujet: string, corps: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AcadémIA Pro <contact@academiapro.fr>",
      to: destinataire,
      subject: sujet,
      html: corps.replace(/\n/g, "<br/>"),
    }),
  });
  return res.ok;
}

async function sauver_email(type: string, destinataire: string, sujet: string, corps: string) {
  await supabase.from("emails_automatiques").insert({
    type, destinataire, sujet, corps,
    envoye: false,
    created_at: new Date().toISOString(),
  });
}

async function generer_campagne(type: string, contexte: any): Promise<{ sujet: string; corps: string }> {
  const system = `Tu es l Agent Emailing d AcadémIA Pro. Tu rediges des emails professionnels et engageants. Style chaleureux et professionnel. Pas de guillemets doubles. Pas de markdown.`;

  const prompts: Record<string, string> = {
    bienvenue: `Redige un email de bienvenue pour un nouvel inscrit sur AcadémIA Pro.
Prenom: ${contexte.prenom || "cher apprenant"}
Formation: ${contexte.formation || "votre formation"}
Inclus: accueil chaleureux, acces plateforme, formateur assigne, prochaines etapes, contact support.
Format: SUJET: xxx\n\nCORPS: xxx`,

    relance: `Redige un email de relance pour un prospect qui n a pas encore achete.
Nom: ${contexte.nom || "cher prospect"}
Formation interessee: ${contexte.formation || "nos formations"}
Inclus: rappel valeur formation, offre speciale, urgence douce, CTA vers academiapro.fr.
Format: SUJET: xxx\n\nCORPS: xxx`,

    remotivation: `Redige un email de remotivation pour un apprenant inactif depuis ${contexte.jours || 7} jours.
Prenom: ${contexte.prenom || "cher apprenant"}
Formation: ${contexte.formation || "votre formation"}
Progression: ${contexte.progression || "en cours"}
Inclus: encouragement, rappel objectifs, offre aide formateur, CTA reprendre formation.
Format: SUJET: xxx\n\nCORPS: xxx`,

    certification: `Redige un email de felicitations pour un apprenant qui vient d obtenir sa certification.
Prenom: ${contexte.prenom || "cher apprenant"}
Formation: ${contexte.formation || "votre formation"}
Inclus: felicitations chaleureuses, valeur du certificat, prochaine formation recommandee, partage LinkedIn.
Format: SUJET: xxx\n\nCORPS: xxx`,

    newsletter: `Redige une newsletter mensuelle pour AcadémIA Pro.
Mois: ${contexte.mois || new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
Nouvelles formations: ${contexte.nouvelles_formations || "nouvelles formations disponibles"}
Inclus: actualites plateforme, formation du mois, conseil pratique IA, CTA catalogue.
Format: SUJET: xxx\n\nCORPS: xxx`,

    rappel_classe: `Redige un email de rappel pour une classe virtuelle.
Prenom: ${contexte.prenom || "cher apprenant"}
Formation: ${contexte.formation || "votre formation"}
Date: ${contexte.date || "demain"}
Heure: ${contexte.heure || "14h00"}
Inclus: rappel classe, lien connexion, preparation, contact formateur.
Format: SUJET: xxx\n\nCORPS: xxx`,
  };

  const prompt = prompts[type] || prompts.bienvenue;
  const texte = await appel_claude(system, prompt);

  const lignes = texte.split("\n");
  let sujet = "";
  let corps = "";
  let in_corps = false;

  for (const ligne of lignes) {
    if (ligne.startsWith("SUJET:")) {
      sujet = ligne.replace("SUJET:", "").trim();
    } else if (ligne.startsWith("CORPS:")) {
      corps = ligne.replace("CORPS:", "").trim();
      in_corps = true;
    } else if (in_corps) {
      corps += "\n" + ligne;
    }
  }

  if (!sujet) sujet = `AcadémIA Pro — ${type}`;
  if (!corps) corps = texte;

  return { sujet, corps: corps.trim() };
}

async function stats_emailing() {
  const { data } = await supabase.from("emails_automatiques").select("type,envoye");
  if (!data) return {};
  const total = data.length;
  const envoyes = data.filter(e => e.envoye).length;
  const par_type = data.reduce((acc: any, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  return { total, envoyes, en_attente: total - envoyes, par_type };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "generer") {
      const { type, contexte, envoyer } = body;
      const { sujet, corps } = await generer_campagne(type, contexte || {});
      await sauver_email(type, contexte?.email || "contact@academiapro.fr", sujet, corps);

      if (envoyer && contexte?.email) {
        const ok = await envoyer_email(contexte.email, sujet, corps);
        return NextResponse.json({ succes: true, sujet, corps, envoye: ok });
      }

      return NextResponse.json({ succes: true, sujet, corps, envoye: false });
    }

    if (action === "stats") return NextResponse.json(await stats_emailing());

    if (action === "liste") {
      const { data } = await supabase.from("emails_automatiques").select("*").order("created_at", { ascending: false }).limit(50);
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await stats_emailing());
}

