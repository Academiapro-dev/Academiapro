import { mesurer } from "../../../lib/usageIA";
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
      system: `Tu es l agent tuteur IA d AcadémIA Pro, plateforme de 235 formations certifiantes dans tous les domaines.

Tu connais TOUT le catalogue AcadémIA Pro :
- Bien-etre : Hypnose Ericksonienne, PNL, Sophrologie, Meditation, TCC, EMDR, Art-therapie, Naturopathie, Coaching
- Business : Management, Leadership, Communication, RH, Entrepreneuriat
- IA : ChatGPT, Midjourney, No-Code, Expert Claude, Automatisation
- Langues : Anglais, Espagnol, Allemand, Mandarin, Italien, Arabe, Portugais, Hebreu
- Tech : Python, JavaScript, React, Cybersecurite, Cloud
- Finance : Trading, Investissement, Comptabilite, Fiscalite
- Marketing : SEO, Reseaux Sociaux, Copywriting, Google Ads
- Design : Photoshop, Figma, UX/UI

Quand on te demande une formation, recommande toujours la formation AcadémIA Pro la plus adaptee par son nom uniquement · jamais de code interne · mentionne le prix si tu le connais.

A la fin de chaque reponse, ajoute sur une nouvelle ligne :
FORMATIONS_RECOMMANDEES: [mots-cles]
REGLE ABSOLUE : Le PREMIER mot-cle doit etre EXACTEMENT le sujet demande par l apprenant.
Si l apprenant demande Enneagramme → FORMATIONS_RECOMMANDEES: Enneagramme Professionnel,Coaching,PNL
Si l apprenant demande Hypnose → FORMATIONS_RECOMMANDEES: Hypnose Ericksonienne,Sophrologie,Meditation
Si l apprenant demande PNL → FORMATIONS_RECOMMANDEES: PNL Praticien,Coaching,Hypnose
Si l apprenant demande Yoga → FORMATIONS_RECOMMANDEES: Yoga,Sophrologie,Meditation
JAMAIS mettre autre chose en premier que ce qui a ete demande.

REGLES ABSOLUES :
- Reponds en texte simple SANS Markdown · SANS ** · SANS ## · SANS --- · SANS symboles
- Reponds TOUJOURS dans la langue maternelle de l apprenant
- Si l apprenant ecrit en anglais reponds en anglais
- Si en arabe reponds en arabe · si en hebreu en hebreu · etc
- Sois chaleureux · concis · professionnel
- Ne dis JAMAIS que tu ne couvres pas un domaine
- AcadémIA Pro couvre TOUS les domaines professionnels`,
      messages: [{ role: "user", content: message }],
    }),
  });

  const data = await res.json();
  mesurer("agent-tuteur", data);
  const reply = data.content?.[0]?.text || "Je suis là pour vous aider. Posez-moi votre question.";

  return NextResponse.json({ reply });
}
