import { mesurer } from "../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const cache: Record<string, string> = {};

export async function POST(req: NextRequest) {
  // Garde-fou : n accepter que les appels du site
  const origineApp = req.headers.get("origin") || "";
  const referentApp = req.headers.get("referer") || "";
  const appelLegitime =
    origineApp.includes("academiapro.fr")
    || referentApp.includes("academiapro.fr")
    || origineApp.includes("vercel.app")
    || referentApp.includes("vercel.app")
    || origineApp.includes("localhost")
    || referentApp.includes("localhost");
  if (!appelLegitime) {
    return NextResponse.json(
      { error: "Acces refuse" },
      { status: 403 },
    );
  }

  try {
    const { texte, langue_cible } = await req.json();

    if (!texte || !langue_cible || langue_cible === "fr") {
      return NextResponse.json({ traduction: texte });
    }

    const cacheKey = `${langue_cible}:${texte.slice(0, 50)}`;
    if (cache[cacheKey]) {
      return NextResponse.json({ traduction: cache[cacheKey] });
    }

    const LANGUES: Record<string, string> = {
      en: "English",
      es: "Spanish",
      ar: "Arabic",
      he: "Hebrew",
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Translate this French text to ${LANGUES[langue_cible]}. Reply ONLY with the translation, nothing else: "${texte}"`
        }],
      }),
    });

    const data = await res.json();
    mesurer("traduire", data);
    const traduction = data?.content?.[0]?.text || texte;
    cache[cacheKey] = traduction;

    return NextResponse.json({ traduction });
  } catch {
    return NextResponse.json({ traduction: "" }, { status: 500 });
  }
}
