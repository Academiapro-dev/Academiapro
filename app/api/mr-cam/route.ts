import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, domaine, historique = [], fichier, fichiers } = body;

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

    const fichiersList = fichiers || (fichier ? [fichier] : []);
    if (fichiersList.length > 0) {
      const content: any[] = [
        { type: "text", text: message + (domaine !== "general" ? " [Domaine : " + domaine + "]" : "") },
        ...fichiersList.map((f: any) => {
          if (f.mediaType === "application/pdf") {
            return { type: "document", source: { type: "base64", media_type: "application/pdf", data: f.base64 } };
          } else {
            return { type: "image", source: { type: "base64", media_type: f.mediaType, data: f.base64 } };
          }
        })
      ];
      messages.push({ role: "user", content });
    } else {
      messages.push({ role: "user", content: message + (domaine !== "general" ? " [Domaine : " + domaine + "]" : "") });
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

    // Upload fichiers dans Supabase Storage avant de repondre
    if (fichiersList.length > 0) {
      await Promise.all(fichiersList.map(async (f: any) => {
        try {
          const ext = f.mediaType === "application/pdf" ? "pdf" : "jpg";
          const nomFichier = "cam_" + Date.now() + "_" + Math.random().toString(36).slice(2,7) + "." + ext;
          const bytes = Buffer.from(f.base64, "base64");
          const uploadRes = await fetch("https://kpxrbwsbhmggoajtxzqn.supabase.co/storage/v1/object/agent_documents/" + nomFichier, {
            method: "POST",
            headers: {
              "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweHJid3NiaG1nZ29hanR4enFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzM0NjIsImV4cCI6MjA5NjM0OTQ2Mn0.J45gFfkK7PHhpCFJ5ahRDbRSeGdG9YO1aa0rRZP_lks",
              "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweHJid3NiaG1nZ29hanR4enFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzM0NjIsImV4cCI6MjA5NjM0OTQ2Mn0.J45gFfkK7PHhpCFJ5ahRDbRSeGdG9YO1aa0rRZP_lks",
              "Content-Type": f.mediaType,
              "x-upsert": "true"
            },
            body: bytes
          });
          console.log("Upload result:", uploadRes.status, nomFichier);
        } catch (err) {
          console.error("Storage upload error:", err);
        }
      }));
    }

    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ reply: "Erreur serveur." }, { status: 500 });
  }
}
