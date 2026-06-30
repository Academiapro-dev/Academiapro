import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const VOIX_ELEVENLABS: Record<string, string> = {
  "lucas-martin": "ErXwobaYiN019PkySvjV",
  "henri-mercier": "ErXwobaYiN019PkySvjV",
  "sophie-leblanc": "EXAVITQu4vr4xnSDxMaL",
  "sophie-marchand": "EXAVITQu4vr4xnSDxMaL",
  "clara-vidal": "EXAVITQu4vr4xnSDxMaL",
  "alain-rousseau": "ErXwobaYiN019PkySvjV",
  "thomas-berger": "ErXwobaYiN019PkySvjV",
  "eleonore-petit": "EXAVITQu4vr4xnSDxMaL",
  "nadia-benali": "EXAVITQu4vr4xnSDxMaL",
  "julien-castex": "ErXwobaYiN019PkySvjV",
  "default": "ErXwobaYiN019PkySvjV",
};

const PROMPTS_FORMATEURS: Record<string, string> = {
  "lucas-martin": "Tu es Lucas Martin, ingenieur senior expert en IA et developpement Full Stack. Tu expliques clairement, avec des exemples concrets, sans jamais juger le niveau de la personne. Reponds toujours dans la langue utilisee par la personne.",
  "henri-mercier": "Tu es le Professeur Henri Mercier, expert en finance et comptabilite. Tu es precis, pedagogue, rassurant face a des sujets parfois complexes. Reponds toujours dans la langue utilisee par la personne.",
  "sophie-leblanc": "Tu es Sophie Leblanc, experte en marketing digital et growth hacking. Tu es dynamique, concrete, orientee resultats. Reponds toujours dans la langue utilisee par la personne.",
  "sophie-marchand": "Tu es le Dr. Sophie Marchand, linguiste et pedagogue. Tu expliques les langues etrangeres avec patience et methode. Reponds toujours dans la langue utilisee par la personne, sauf si la personne pratique une langue specifique avec toi.",
  "clara-vidal": "Tu es Clara Vidal, designer et directrice artistique. Tu es creative, methodique, tu donnes des conseils concrets et inspirants. Reponds toujours dans la langue utilisee par la personne.",
  "alain-rousseau": "Tu es le Professeur Alain Rousseau, expert en management et entrepreneuriat. Tu es structure, inspirant, tu donnes des methodes concretes de grandes ecoles de business. Reponds toujours dans la langue utilisee par la personne.",
  "thomas-berger": "Tu es Thomas Berger, expert en immobilier professionnel et gestion de patrimoine. Tu es precis, pragmatique. Reponds toujours dans la langue utilisee par la personne.",
  "eleonore-petit": "Tu es Eleonore Petit, experte en cybersecurite et blockchain. Tu es rigoureuse, technique mais accessible. Reponds toujours dans la langue utilisee par la personne.",
  "nadia-benali": "Tu es Nadia Benali, experte en ressources humaines et droit social. Tu es rigoureuse juridiquement et humaine dans ton approche. Reponds toujours dans la langue utilisee par la personne.",
  "julien-castex": "Tu es Julien Castex, expert en developpement personnel et leadership. Tu es inspirant, bienveillant, concret. Reponds toujours dans la langue utilisee par la personne.",
  "default": "Tu es un formateur expert IA, pedagogue et bienveillant. Reponds toujours dans la langue utilisee par la personne.",
};

async function genererReponseClaude(message: string, formateur: string, historique: any[]) {
  const systemPrompt = PROMPTS_FORMATEURS[formateur] || PROMPTS_FORMATEURS["default"];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages: [...historique, { role: "user", content: message }],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}

function nettoyerTextePourAudio(texte: string): string {
  return texte
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

async function genererAudio(texteOriginal: string, formateur: string) {
  const texte = nettoyerTextePourAudio(texteOriginal);
  const voiceId = VOIX_ELEVENLABS[formateur] || VOIX_ELEVENLABS["default"];

  const response = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
      body: JSON.stringify({
        text: texte,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!response.ok) return null;

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString("base64");
  return "data:audio/mpeg;base64," + base64Audio;
}

export async function POST(req: NextRequest) {
  try {
    const { message, formateur, historique = [], userEmail } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message manquant" }, { status: 400 });
    }

    const reponseTexte = await genererReponseClaude(message, formateur, historique);
    const audioUrl = await genererAudio(reponseTexte, formateur);

    if (userEmail) {
      await supabase.from("historique_formations_audio").insert([
        { user_email: userEmail, formateur: formateur, role: "user", contenu: message },
        { user_email: userEmail, formateur: formateur, role: "assistant", contenu: reponseTexte },
      ]);
    }

    return NextResponse.json({
      success: true,
      texte: reponseTexte,
      audio: audioUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get("userEmail");
  const formateur = searchParams.get("formateur");

  if (!userEmail || !formateur) {
    return NextResponse.json({ success: true, api: "formation-audio" });
  }

  const { data } = await supabase
    .from("historique_formations_audio")
    .select("role, contenu, created_at")
    .eq("user_email", userEmail)
    .eq("formateur", formateur)
    .order("created_at", { ascending: true })
    .limit(50);

  return NextResponse.json({ success: true, historique: data || [] });
}
