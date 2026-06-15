import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message, formation_code, formation_titre } = await req.json();

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
      system: `Tu es un agent tuteur expert d AcadémIA Pro, spécialisé dans la formation "${formation_titre || "professionnelle"}". 
Tu es bienveillant, pédagogue et expert dans ton domaine.
Tu réponds toujours en français de manière claire et structurée.
Tu encourages l apprenant et l aides à progresser.
Tu ne mentionnes jamais de certifications tierces comme RNCP, CPF, Qualiopi.
Tu parles uniquement de la Certification AcadémIA Pro.`,
      messages: [{ role: "user", content: message }],
    }),
  });

  const data = await res.json();
  const reply = data.content?.[0]?.text || "Je suis là pour vous aider. Posez-moi votre question.";

  return NextResponse.json({ reply });
}
