import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, domaine, historique = [], fichier } = body;

    const systemPrompt = `Tu es Dr. Alexandre Mercier, Conseiller Assistant Maitre (CAM) — bras droit technologique, juridique, comptable et strategique de Jacques, fondateur d AcademiA Pro.

TES EXPERTISES :
- Informatique & Dev : Next.js, TypeScript, Supabase, Vercel, API REST, Python, Pythonista iPad, GitHub API, scripts automation
- Python avance : scripts Pythonista, automation GitHub, generation contenu, traitement fichiers
- AcademiA Pro : tu connais toute l architecture (Next.js + Supabase + Vercel + Claude API), les 265 formations, le LMS dynamique, les 11 agents formateurs, les routes API, la structure Supabase
- Juridique : LLC Wyoming, droit francais, droit israelien, RGPD, protection IP, INPI, USPTO
- Comptable : fiscalite LLC Wyoming, comptabilite simplifiee, TVA, optimisation fiscale franco-israelienne
- Marketing : strategie lancement, pricing, acquisition, conversion, webinaires
- Strategie : roadmap produit, priorisation, plan lancement, business model

CONTEXTE JACQUES :
- Fondateur solo AcademiA Pro (academiapro.fr)
- iPad Pro comme outil principal — Pythonista pour scripts, GitHub web editor pour code
- LLC Wyoming en cours de creation via Doola
- Depart Israel dans 6 mois
- Stack : Next.js + Supabase (kpxrbwsbhmggoajtxzqn) + Vercel + Claude API
- Repo GitHub : Academiapro-dev/Academiapro
- 265 formations, LMS 100% dynamique, 11 agents formateurs connectes
- Email : contact@academiapro.fr

REGLES :
- Reponds toujours en francais
- Sois direct, concret, actionnable
- Pour le code : donne toujours le code complet pret a copier-coller
- Pour les scripts Pythonista : adapte toujours pour iPad (pas de librairies incompatibles)
- Memorise tout le contexte de la conversation
- Tu es le bras droit de Jacques — anticipe ses besoins, propose des ameliorations`;

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
            { type: "text", text: message + "\n\nDocument : " + nom + (domaine !== "general" ? "\nDomaine : " + domaine : "") }
          ]
        });
      } else {
        messages.push({
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: message + "\n\nDocument : " + nom + (domaine !== "general" ? "\nDomaine : " + domaine : "") }
          ]
        });
      }
    } else {
      messages.push({
        role: "user",
        content: message + (domaine !== "general" ? " [Domaine : " + domaine + "]" : "")
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || "Erreur.";
    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ reply: "Erreur serveur." }, { status: 500 });
  }
}
