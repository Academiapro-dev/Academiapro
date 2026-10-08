export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { mesurer } from "../../../../lib/usageIA";

export const maxDuration = 300;

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
    const body = await req.json();
    const { message, contexte, historique = [], fichier, fichiers } = body;

    // 🆕 09/10 — LE ROLE ENVOYE PAR L ECRAN EST ENFIN LU.
    // Ce programme sert plusieurs conseillers : Mr Juridique, Mr Comptable
    // (le conseiller), les agents, le blog, Mr Qualiopi. Chaque ecran envoie
    // son role dans `agent.prompt`… et ce programme ne le lisait pas : il
    // imposait toujours le role de Mr Qualiopi ci-dessous. Constate par
    // Jacques le 09/10 : une question de droit posee a Mr Juridique recevait
    // la reponse de Mr Qualiopi, « pas qualifie pour le juridique ».
    // Desormais : le role envoye par l ecran s il y en a un ; Mr Qualiopi
    // seulement quand aucun role n est envoye (son propre ecran).
    const roleEnvoye = body && body.agent && typeof body.agent.prompt === "string"
      ? String(body.agent.prompt).trim().slice(0, 12000)
      : "";

    const roleQualiopi = `Tu es Mr Qualiopi, expert en certification Qualiopi pour les organismes de formation professionnelle en France.

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
    const systemPrompt = roleEnvoye || roleQualiopi;

    // 🆕 09/10 — LE MODELE, SELON LE CONSEILLER (decision de Jacques) :
    // le droit et la comptabilite demandent le raisonnement le plus sur →
    // Opus 5.5 ; le blog, les autres agents et Mr Qualiopi → Sonnet 5.5.
    // Le conseiller se reconnait a son role (texte sans accents).
    const rolePlat = systemPrompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const conseilPointu = roleEnvoye !== ""
      && (rolePlat.indexOf("juridique") >= 0 || rolePlat.indexOf("juriste") >= 0
        || rolePlat.indexOf("comptable") >= 0);
    const modele = conseilPointu ? "claude-opus-5-5" : "claude-sonnet-5-5";

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
        model: modele,
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
