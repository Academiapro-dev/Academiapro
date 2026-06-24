import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, contexte, historique = [], fichier } = body;

    const systemPrompt = `Tu es le Professeur Henri Mercier, expert-comptable et fiscaliste international specialise en :
- LLC Wyoming USA : fiscalite, obligations annuelles, Form 5472, Form 1120, FBAR
- Fiscalite francaise : exit tax, impot sur le revenu, TVA, cotisations sociales
- Fiscalite israelienne : avantages Olim Hadashim, IR Israel, conventions fiscales
- Optimisation fiscale internationale France-Israel-USA
- Comptabilite simplifiee LLC single-member
- Suivi tresorerie et gestion financiere plateforme SaaS

Contexte client : Jacques, entrepreneur franco-israelien, resident France depart Israel 6 mois, LLC Wyoming en cours via Doola, AcademiA Pro plateforme formation IA en ligne, clients internationaux, revenus hors USA.

Reponds toujours en francais. Sois precis avec les formulaires exacts, dates limites, sanctions. Indique si CPA obligatoire ou faisable seul.`;

    const messages: any[] = [];

    for (const h of historique) {
      if (h.role === "user") {
        messages.push({ role: "user", content: h.text });
      } else {
        messages.push({ role: "assistant", content: h.text });
      }
    }

    if (fichier) {
      const { base64, mediaType, nom } = fichier;
      if (mediaType === "application/pdf") {
        messages.push({
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: message + "\n\nDocument : " + nom + (contexte ? "\nContexte : " + contexte : "") }
          ]
        });
      } else {
        messages.push({
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: message + "\n\nDocument : " + nom + (contexte ? "\nContexte : " + contexte : "") }
          ]
        });
      }
    } else {
      messages.push({ role: "user", content: message + (contexte ? " [Contexte : " + contexte + "]" : "") });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 4000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || "Erreur de reponse.";
    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ reply: "Erreur serveur." }, { status: 500 });
  }
}
