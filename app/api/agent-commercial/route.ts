import { mesurer } from "../../../lib/usageIA";
// app/api/agent-commercial/route.ts — Agent Commercial connecté à CAM
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!;
const CLAUDE_MODEL = "claude-sonnet-4-6";

async function appel_claude(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  mesurer("agent-commercial", data);
  return data.content[0].text || "";
}

// INTERDICTIONS AJOUTEES LE 05/08. Un temoignage invente, une statistique
// fabriquee ou un resultat promis constituent une pratique commerciale
// trompeuse au sens de l article L.121-2 du code de la consommation.
const SYSTEM_COMMERCIAL = `Tu es l Agent Commercial d AcademIA Pro, plateforme de formation qui s appuie sur l intelligence artificielle. Tu produis des arguments de vente clairs et des scripts commerciaux efficaces. Style direct, professionnel. Pas de guillemets doubles. Pas de markdown.

INTERDICTIONS ABSOLUES, sans exception :
- N invente AUCUN temoignage client, AUCUN nom de client, AUCUN avis, AUCUNE note ou etoile.
- N invente AUCUNE statistique, AUCUN pourcentage de reussite, AUCUN nombre d apprenants, AUCUN chiffre d affaires, AUCUN classement.
- N annonce AUCUNE certification, AUCUN enregistrement au Repertoire national des certifications professionnelles ni au repertoire specifique, AUCUNE eligibilite au compte personnel de formation ni a un operateur de competences.
- NE PROMETS AUCUN RESULTAT : ni emploi, ni reussite, ni retour sur investissement chiffre, ni delai garanti.
- N ecris aucune mention de type premier, leader, meilleur, numero un.

Si un element te manque pour argumenter, ecris explicitement A COMPLETER PAR JACQUES plutot que de l inventer. Un argument vrai et modeste vaut mieux qu une affirmation invendable en justice.`;

async function generer_contenu(type: string, contexte: any): Promise<string> {
  const prompts: Record<string, string> = {
    pitch: `Redige un pitch de vente complet pour AcademIA Pro.
Formation: ${contexte.formation || "nos formations"}
Public: ${contexte.cible || "professionnels"}
Duree: ${contexte.duree || "2 minutes"}
Inclus: accroche, probleme rencontre par le public, solution apportee, benefices concrets et verifiables, offre, appel a l action.
N inclus PAS de preuve sociale : il n y a pas encore de clients a citer.`,

    objections: `Redige les reponses aux 10 objections les plus courantes pour AcademIA Pro.
Formation: ${contexte.formation || "nos formations"}
Prix: ${contexte.prix || "a preciser"}
Format: Objection / Reponse argumentee.
Les reponses doivent s appuyer sur ce que le produit fait reellement, jamais sur des references clients ou des chiffres de resultats.`,

    proposition: `Redige une proposition commerciale complete pour AcademIA Pro.
Prospect: ${contexte.prospect || "entreprise"}
Formation: ${contexte.formation || "nos formations"}
Budget: ${contexte.budget || "a definir"}
Inclus: contexte du prospect, solution proposee, programme detaille, investissement, modalites, appel a l action.
N inclus NI retour sur investissement chiffre NI garantie de resultat.`,

    script_appel: `Redige un script d appel commercial pour AcademIA Pro.
Formation: ${contexte.formation || "nos formations"}
Prospect: ${contexte.prospect || "professionnel"}
Inclus: introduction, qualification, decouverte des besoins, presentation de la solution, traitement des objections, conclusion.`,

    devis: `Redige un devis professionnel pour AcademIA Pro.
Client: ${contexte.prospect || "client"}
Formation: ${contexte.formation || "formation"}
Prix: ${contexte.prix || "a preciser"}
Inclus: description de la formation, duree, modalites, prix hors taxes, conditions de paiement, validite 30 jours, droit de retractation de 14 jours.`,

    // REMPLACE l ancien type temoignage, qui faisait ecrire de faux avis.
    // Ici on redige le message qui SOLLICITE un temoignage reel.
    demande_temoignage: `Redige un message court pour DEMANDER un temoignage a un client qui vient de terminer sa formation.
Formation: ${contexte.formation || "sa formation"}
Prenom du client: ${contexte.prospect || "le client"}
Le message doit: remercier, expliquer en une phrase a quoi servira le temoignage, poser trois questions simples et ouvertes (ce qu il cherchait, ce qu il a obtenu, a qui il le conseillerait), preciser qu il pourra relire avant publication et refuser sans probleme.
N ECRIS PAS le temoignage a sa place : ecris seulement la demande.`,
  };

  const prompt = prompts[type] || prompts.pitch;
  return await appel_claude(SYSTEM_COMMERCIAL, prompt);
}

async function stats_commercial() {
  const { data } = await supabase.from("commercial").select("type,statut");
  if (!data) return { total: 0, par_type: {} };
  const total = data.length;
  const par_type = data.reduce((acc: any, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});
  return { total, par_type };
}

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
    const { action } = body;

    if (action === "generer") {
      const { type, contexte } = body;

      // L ancien type temoignage est refuse explicitement, au cas ou un
      // ecran ou un signet l appellerait encore.
      if (type === "temoignage") {
        return NextResponse.json(
          {
            erreur: "La generation de temoignages a ete retiree : un avis client invente est une pratique commerciale trompeuse. Utilisez le type demande_temoignage pour solliciter un vrai temoignage.",
          },
          { status: 400 },
        );
      }

      const contenu = await generer_contenu(type, contexte || {});

      await supabase.from("commercial").insert({
        type,
        titre: `${type} — ${new Date().toLocaleDateString("fr-FR")}`,
        contenu,
        prospect_email: contexte?.email || "",
        formation: contexte?.formation || "",
        statut: "brouillon",
      });

      return NextResponse.json({ succes: true, contenu });
    }

    if (action === "stats") return NextResponse.json(await stats_commercial());

    if (action === "liste") {
      const { data } = await supabase.from("commercial").select("*").order("created_at", { ascending: false }).limit(50);
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await stats_commercial());
}
