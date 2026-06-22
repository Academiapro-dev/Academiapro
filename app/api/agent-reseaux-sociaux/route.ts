// app/api/agent-reseaux-sociaux/route.ts — Agent Réseaux Sociaux connecté à CAM
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

const SYSTEM_RS = `Tu es l Agent Reseaux Sociaux d AcadémIA Pro. Tu crees du contenu engageant et professionnel pour les reseaux sociaux. Style dynamique et authentique. Pas de guillemets doubles. Pas de markdown.`;

async function generer_post(plateforme: string, type: string, contexte: any): Promise<{ contenu: string; hashtags: string }> {
  const prompts: Record<string, string> = {
    linkedin_formation: `Redige un post LinkedIn professionnel pour promouvoir la formation.
Formation: ${contexte.formation || "nos formations IA"}
Benefice cle: ${contexte.benefice || "transformation professionnelle"}
Longueur: 150 mots max. Inclus: accroche forte, valeur, CTA, emojis professionnels.
Puis sur une nouvelle ligne: HASHTAGS: #hashtag1 #hashtag2 #hashtag3`,

    linkedin_temoignage: `Redige un post LinkedIn avec temoignage client pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations"}
Resultat obtenu: ${contexte.resultat || "transformation professionnelle"}
Longueur: 120 mots. Inclus: citation apprenant, resultat concret, CTA.
Puis: HASHTAGS: #hashtag1 #hashtag2 #hashtag3`,

    instagram_inspiration: `Redige un post Instagram inspirant pour AcadémIA Pro.
Theme: ${contexte.theme || "formation IA et bien-etre"}
Ton: inspirant et bienveillant
Longueur: 100 mots. Inclus: phrase d accroche, message fort, CTA.
Puis: HASHTAGS: #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5`,

    instagram_formation: `Redige un post Instagram pour promouvoir une formation.
Formation: ${contexte.formation || "nos formations"}
Domaine: ${contexte.domaine || "bien-etre"}
Longueur: 80 mots. Style visuel et dynamique. Emojis.
Puis: HASHTAGS: #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5`,

    facebook_evenement: `Redige un post Facebook pour annoncer un evenement AcadémIA Pro.
Evenement: ${contexte.evenement || "webinaire gratuit"}
Date: ${contexte.date || "prochainement"}
Longueur: 150 mots. Inclus: description, valeur, lien inscription, CTA fort.
Puis: HASHTAGS: #hashtag1 #hashtag2 #hashtag3`,

    planning_semaine: `Cree un planning de posts reseaux sociaux pour une semaine pour AcadémIA Pro.
Theme semaine: ${contexte.theme || "formation IA"}
Format: Lundi LinkedIn / Mardi Instagram / Mercredi Facebook / Jeudi LinkedIn / Vendredi Instagram
Pour chaque jour: plateforme, sujet, resume du contenu en 2 lignes.`,
  };

  const prompt = prompts[type] || prompts.linkedin_formation;
  const texte = await appel_claude(SYSTEM_RS, prompt);

  let contenu = texte;
  let hashtags = "";

  if (texte.includes("HASHTAGS:")) {
    const parties = texte.split("HASHTAGS:");
    contenu = parties[0].trim();
    hashtags = parties[1]?.trim() || "";
  }

  return { contenu, hashtags };
}

async function stats_rs() {
  const { data } = await supabase.from("reseaux_sociaux").select("plateforme,type,statut");
  if (!data) return { total: 0, par_plateforme: {} };
  const total = data.length;
  const par_plateforme = data.reduce((acc: any, p) => {
    acc[p.plateforme] = (acc[p.plateforme] || 0) + 1;
    return acc;
  }, {});
  return { total, par_plateforme };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "generer") {
      const { plateforme, type, contexte } = body;
      const { contenu, hashtags } = await generer_post(plateforme || "linkedin", type, contexte || {});

      await supabase.from("reseaux_sociaux").insert({
        type,
        plateforme: plateforme || "linkedin",
        titre: `${plateforme} ${type} — ${new Date().toLocaleDateString("fr-FR")}`,
        contenu,
        hashtags,
        statut: "brouillon",
      });

      return NextResponse.json({ succes: true, contenu, hashtags });
    }

    if (action === "stats") return NextResponse.json(await stats_rs());

    if (action === "liste") {
      const { data } = await supabase.from("reseaux_sociaux").select("*").order("created_at", { ascending: false }).limit(50);
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await stats_rs());
}
