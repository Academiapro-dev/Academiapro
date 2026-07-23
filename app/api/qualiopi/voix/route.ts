 import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const cle = process.env.DEEPGRAM_API_KEY;
    if (!cle) {
      return NextResponse.json(
        { ok: false, erreur: "Cle DEEPGRAM_API_KEY absente" },
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

    const reponse = await fetch(
      "https://api.deepgram.com/v1/speak?model=aura-2-hector-fr",
      {
        method: "POST",
        headers: {
          Authorization: "Token " + cle,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: texte }),
      }
    );

    if (!reponse.ok) {
      const detail = await reponse.text();
      return NextResponse.json(
        {
          ok: false,
          erreur: "Synthese vocale : code " + reponse.status,
          detail: detail.slice(0, 300),
        },
        { status: 500 }
      );
    }

    const audio = await reponse.arrayBuffer();

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
