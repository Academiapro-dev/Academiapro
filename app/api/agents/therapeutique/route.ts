import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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
      system: therapeute.prompt,
      messages: messages,
    }),
  });

  const data = await res.json();
  const reply = data.content?.[0]?.text || "Je suis là pour vous écouter. Continuez...";

  return NextResponse.json({ reply });
}
