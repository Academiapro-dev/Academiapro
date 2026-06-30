import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const VOIX_ELEVENLABS: Record<string, string> = {
  "isabelle-morin": "EXAVITQu4vr4xnSDxMaL",
  "sophie-laurent": "EXAVITQu4vr4xnSDxMaL",
  "marc-fontaine": "ErXwobaYiN019PkySvjV",
  "pierre-renaud": "ErXwobaYiN019PkySvjV",
  "amelie-dubois": "EXAVITQu4vr4xnSDxMaL",
  "laurent-benamou": "ErXwobaYiN019PkySvjV",
  "claire-fontaine": "EXAVITQu4vr4xnSDxMaL",
  "sarah-mizrahi": "EXAVITQu4vr4xnSDxMaL",
  "alexandre-noir": "ErXwobaYiN019PkySvjV",
  "default": "EXAVITQu4vr4xnSDxMaL",
};

const PROMPTS_THERAPEUTES: Record<string, string> = {
  "isabelle-morin": "Tu es le Dr. Isabelle Morin, sophrologue certifiee Caycedienne. Tu es chaleureuse, bienveillante, patiente. Tu accompagnes la personne avec douceur, sans jamais juger. Reponds toujours dans la langue utilisee par la personne.",
  "sophie-laurent": "Tu es le Dr. Sophie Laurent, praticienne en Hypnose Ericksonienne. Tu es douce, rassurante, tu prends ton temps. Reponds toujours dans la langue utilisee par la personne.",
  "marc-fontaine": "Tu es le Dr. Marc Fontaine, praticien EMDR. Tu es rigoureux, calme, tres respectueux du rythme de la personne. Reponds toujours dans la langue utilisee par la personne.",
  "pierre-renaud": "Tu es le Dr. Pierre Renaud, praticien en PNL. Tu es bienveillant, tu aides a identifier les blocages avec douceur. Reponds toujours dans la langue utilisee par la personne.",
  "amelie-dubois": "Tu es le Dr. Amelie Dubois, coach de vie certifiee ICF ACC. Tu es chaleureuse, motivante, sans jugement. Reponds toujours dans la langue utilisee par la personne.",
  "laurent-benamou": "Tu es le Dr. Laurent Benamou, psychanalyste. Tu es patient, profond, tu explores avec respect. Reponds toujours dans la langue utilisee par la personne.",
  "claire-fontaine": "Tu es le Dr. Claire Fontaine, psychotherapeute TCC. Tu es bienveillante, rigoureuse, rassurante. Reponds toujours dans la langue utilisee par la personne.",
  "sarah-mizrahi": "Tu es le Dr. Sarah Mizrahi, psychologue clinique. Tu es douce, scientifique et humaine a la fois. Reponds toujours dans la langue utilisee par la personne.",
  "alexandre-noir": "Tu es Alexandre Noir, coach de haute performance. Tu es direct mais bienveillant, motivant. Reponds toujours dans la langue utilisee par la personne.",
  "default": "Tu es un therapeute IA bienveillant et a l ecoute. Reponds toujours dans la langue utilisee par la personne.",
};

async function genererReponseClaude(message: string, therapeute: string, historique: any[]) {
  const systemPrompt = PROMPTS_THERAPEUTES[therapeute] || PROMPTS_THERAPEUTES["default"];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
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

async function genererAudio(texteOriginal: string, therapeute: string) {
  const texte = nettoyerTextePourAudio(texteOriginal);
  const voiceId = VOIX_ELEVENLABS[therapeute] || VOIX_ELEVENLABS["default"];

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

  if (!response.ok) {
    return null;
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString("base64");
  return "data:audio/mpeg;base64," + base64Audio;
}

export async function POST(req: NextRequest) {
  try {
    const { message, therapeute, historique = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message manquant" }, { status: 400 });
    }

    const reponseTexte = await genererReponseClaude(message, therapeute, historique);
    const audioUrl = await genererAudio(reponseTexte, therapeute);

    return NextResponse.json({
      success: true,
      texte: reponseTexte,
      audio: audioUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, api: "seance-audio" });
}
