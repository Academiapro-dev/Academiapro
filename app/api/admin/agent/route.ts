import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agent, historique } = body;

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
        max_tokens: 1500,
        system: agent?.prompt || "Tu es un expert conseil pour AcadémIA Pro.",
        messages: messages,
      }),
    });

    const data = await res.json();
    const reply = data?.content?.[0]?.text || "Je suis là pour vous conseiller.";

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ reply: "Une erreur est survenue. Veuillez réessayer." }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;
