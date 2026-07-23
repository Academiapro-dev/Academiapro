import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VOIX_CARTESIA = "faa75703-00e3-4a57-9955-0703001e3231";
const MODELE_CARTESIA = "sonic-2";

function nettoyerPourVoix(texte: string): string {
  return texte
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const cle = process.env.CARTESIA_API_KEY;
    if (!cle) {
      return NextResponse.json(
        { ok: false, erreur: "Cle CARTESIA_API_KEY absente des variables Vercel" },
        { status: 500 }
      );
    }

    let corps: any = {};
    try {
      corps = await req.json();
    } catch (e) {
      return NextResponse.json(
        { ok: false, erreur: "Corps de requete illisible" },
        { status: 400 }
      );
    }

    const brut = corps.texte;
    if (!brut) {
      return NextResponse.json(
        { ok: false, erreur: "Texte manquant" },
        { status: 400 }
      );
    }

    const texte = nettoyerPourVoix(String(brut)).slice(0, 1800);

    const reponse = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "X-API-Key": cle,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: MODELE_CARTESIA,
        transcript: texte,
        voice: {
          mode: "id",
          id: VOIX_CARTESIA,
        },
        language: "fr",
        output_format: {
          container: "mp3",
          encoding: "mp3",
          sample_rate: 44100,
        },
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      return NextResponse.json(
        {
          ok: false,
          erreur: "Cartesia : code " + reponse.status,
          detail: detail.slice(0, 400),
        },
        { status: 500 }
      );
    }

    const audio = await reponse.arrayBuffer();

    if (!audio || audio.byteLength < 100) {
      return NextResponse.json(
        { ok: false, erreur: "Audio vide renvoye par Cartesia" },
        { status: 500 }
      );
    }

    return new NextResponse(Buffer.from(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: e.message }, { status: 500 });
  }
}
