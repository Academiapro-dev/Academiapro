export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { mesurer } from "../../../../lib/usageIA";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, contexte, historique = [], fichier, fichiers } = body;

    const systemPrompt = `Tu es Mr Qualiopi, expert en certification Qualiopi pour les organismes de formation professionnelle en France.

EXPERTISE :
- Certification Qualiopi : 7 criteres, 32 indicateurs obligatoires
- Processus d audit Qualiopi : preparation, deroulement, suivi
- Reglementation formation professionnelle : Loi du 5 septembre 2018
- Financement formation : CPF, OPCO, plan de developpement des competences
- RNCP et RS : processus de certification, dossiers, jury
- Ingenierie pedagogique : conception, evaluation, amelioration continue
- Documents qualite requis : livret accueil, reglement interieur, programme, feuilles presence
- Indicateurs de satisfaction : enquetes, taux completion, taux insertion

Tu aides les organismes de formation a obtenir et maintenir la certification Qualiopi. Tu donnes des conseils precis et operationnels uniquement sur la formation professionnelle en France.`;

    const messages: any[] = [];

    for (const h of historique) {
      // Format bloc sur TOUS les tours : le prefixe reste
      // identique d un appel a l autre (condition du cache)
      const bloc = [{ type: "text", text: h.text }];
      if (h.role === "user") {
        messages.push({ role: "user", content: bloc });
      } else {
        messages.push({ role: "assistant", content: bloc });
      }
    }

    // Cache conversationnel : marquer le dernier message
    // de l historique met tout le prefixe (system +
    // conversation) en cache pour les echanges suivants.
    if (messages.length > 0) {
      const dernier = messages[messages.length - 1];
      dernier.content[0].cache_control = {
        type: "ephemeral",
      };
    }

    const fichiersList = fichiers || (fichier ? [fichier] : []);
    if (fichiersList.length > 0) {
      const content: any[] = [
        { type: "text", text: message + (contexte ? " [Contexte : " + contexte + "]" : "") },
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
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system: [{ type: "text", text: systemPrompt,
          cache_control: { type: "ephemeral" } }],
        messages,
      }),
    });

    const data = await response.json();
    mesurer("admin-agent", data);
    const reply = data.content?.[0]?.text || "Erreur.";

    // Upload fichiers dans Supabase Storage
    if (fichiersList.length > 0) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      await Promise.all(fichiersList.map(async (f: any) => {
        try {
          const ext = f.mediaType === "application/pdf" ? "pdf" : f.mediaType === "image/png" ? "png" : "jpg";
          const nomFichier = "qualiopi_" + Date.now() + "_" + Math.random().toString(36).slice(2,7) + "." + ext;
          const bytes = Buffer.from(f.base64, "base64");
          const res = await fetch("https://kpxrbwsbhmggoajtxzqn.supabase.co/storage/v1/object/agent_documents/" + nomFichier, {
            method: "POST",
            headers: {
              "apikey": serviceKey,
              "Authorization": "Bearer " + serviceKey,
              "Content-Type": f.mediaType,
              "x-upsert": "true"
            },
            body: bytes
          });
          console.log("Upload result:", res.status, nomFichier);
        } catch (err) {
          console.error("Upload error:", err);
        }
      }));
    }


    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ reply: "Erreur serveur." }, { status: 500 });
  }
}
