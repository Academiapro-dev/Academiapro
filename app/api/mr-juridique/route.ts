import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const CONTEXTES: Record<string, string> = {
  france: "Tu exerces en droit francais. Tu maitrises le Code civil, le Code du travail, le droit des societes francais (SARL, SAS, SASU), la fiscalite francaise, le RGPD et la jurisprudence francaise.",
  israel: "Tu exerces en droit israelien. Tu maitrises le droit des societes israelien (Ltd, LLP), la fiscalite israelienne, la loi de retour, les avantages fiscaux pour nouveaux immigrants Olim Hadashim, le droit du travail israelien et les conventions France-Israel.",
  international: "Tu exerces en droit international. Tu maitrises les conventions internationales, le droit compare France-Israel, les traites de non-double imposition, le droit des affaires transfrontalier et la mobilite internationale des entrepreneurs.",
};

export async function POST(req: NextRequest) {
  try {
    const { message, contexte = "france", historique = [] } = await req.json();

    const ctx = CONTEXTES[contexte] || CONTEXTES.france;

    const messages = [
      ...historique.map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text,
      })),
      { role: "user", content: message },
    ];

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: "Tu es Maitre Pierre Duval, Avocat et Juriste senior specialise en droit des affaires et droit international. " + ctx + " Tu reponds de facon precise, structuree et professionnelle. Tu cites les textes de loi pertinents. Tu rappelles toujours que tes reponses sont a titre informatif et ne remplacent pas une consultation juridique formelle.",
        messages,
      }),
    });

    if (!r.ok) {
      const err = await r.json();
      return NextResponse.json({ erreur: err.error?.message || "Erreur API" }, { status: 500 });
    }

    const data = await r.json();
    const reply = data.content[0]?.text || "";

    return NextResponse.json({ succes: true, reply });

  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Maitre Pierre Duval - operationnel", contextes: ["france", "israel", "international"] });
}
