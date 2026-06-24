import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, contexte, historique = [], fichier, fichiers } = body;

    const systemPrompt = `Tu es Maitre Pierre Duval, avocat et juriste expert en :
- Droit des societes francais (SASU, SAS, EURL)
- LLC Wyoming USA — creation, gestion, fiscalite pour non-residents
- Droit israelien — Olim Hadashim, fiscalite, creation societe
- Droit international des affaires et protection IP
- RGPD, CGV, mentions legales plateformes en ligne
- Protection marque : INPI France, USPTO USA, Israel, Systeme Madrid OMPI
- Strategie holding internationale France-Israel-USA

Contexte client : Jacques, entrepreneur franco-israelien, resident France depart Israel dans 6 mois, LLC Wyoming en cours de creation via Doola, plateforme AcademiA Pro (formation IA en ligne, clients internationaux).

Reponds toujours en francais. Sois precis, concret, avec des etapes numerotees quand pertinent. Mentionne les couts et delais reels. Indique si avocat obligatoire ou faisable seul.`;

    const messages: any[] = [];

    // Historique
    for (const h of historique) {
      if (h.role === "user") {
        messages.push({ role: "user", content: h.text });
      } else {
        messages.push({ role: "assistant", content: h.text });
      }
    }

    // Message actuel avec fichier eventuel
    const fichiersList = fichiers || (fichier ? [fichier] : []);
    if (fichiersList.length > 0) {
      const content: any[] = fichiersList.map((f: any) => {
        if (f.mediaType === "application/pdf") {
          return { type: "document", source: { type: "base64", media_type: "application/pdf", data: f.base64 } };
        } else {
          return { type: "image", source: { type: "base64", media_type: f.mediaType, data: f.base64 } };
        }
      });
      content.push({ type: "text", text: message + (contexte ? " [Contexte : " + contexte + "]" : "") });
      messages.push({ role: "user", content });
    } else {
      messages.push({ role: "user", content: message + (contexte ? " [Contexte : " + contexte + "]" : "") });
    }
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
