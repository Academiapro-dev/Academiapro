import { mesurer } from "../../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";

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

  const { message, therapeute, historique } = await req.json();

  const messages = [
    ...(historique || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text
    })),
    { role: "user", content: message }
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: therapeute.prompt + " Tu detectes automatiquement la langue du patient et tu reponds TOUJOURS dans sa langue.",
      messages: messages,
    }),
  });

  const data = await res.json();
  mesurer("agents-therapeutique", data);
  const reply = data.content?.[0]?.text || "Je suis là pour vous écouter. Continuez...";

  return NextResponse.json({ reply });
}
