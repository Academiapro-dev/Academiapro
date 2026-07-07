import { mesurer } from "../../../lib/usageIA";
// app/api/commercial/route.ts — Agent Commercial connecté à CAM
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

const SYSTEM_COMMERCIAL = `Tu es l Agent Commercial d AcadémIA Pro, plateforme de formation 100% IA. Tu crees des arguments de vente percutants et des scripts commerciaux efficaces. Style direct, persuasif et professionnel. Pas de guillemets doubles. Pas de markdown.`;

async function generer_contenu(type: string, contexte: any): Promise<string> {
  const prompts: Record<string, string> = {
    pitch: `Redige un pitch de vente complet pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations IA"}
Public: ${contexte.cible || "professionnels"}
Duree: ${contexte.duree || "2 minutes"}
Inclus: accroche, probleme, solution, benefices, preuve sociale, offre, CTA.`,

    objections: `Redige les reponses aux 10 objections les plus courantes pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations"}
Prix: ${contexte.prix || "1400 EUR"}
Format: Objection / Reponse percutante`,

    proposition: `Redige une proposition commerciale complete pour AcadémIA Pro.
Prospect: ${contexte.prospect || "entreprise"}
Formation: ${contexte.formation || "nos formations"}
Budget: ${contexte.budget || "a definir"}
Inclus: contexte, solution proposee, programme detaille, investissement, ROI estime, garanties, CTA.`,

    script_appel: `Redige un script d appel commercial pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations"}
Prospect: ${contexte.prospect || "professionnel"}
Inclus: introduction, qualification, decouverte besoins, presentation solution, traitement objections, closing.`,

    devis: `Redige un devis professionnel pour AcadémIA Pro.
Client: ${contexte.prospect || "client"}
Formation: ${contexte.formation || "formation"}
Prix: ${contexte.prix || "1400 EUR"}
Inclus: description formation, duree, modalites, prix HT/TTC, conditions paiement, validite 30 jours.`,

    temoignage: `Redige 3 temoignages clients fictifs mais realistes pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations"}
Domaine: ${contexte.domaine || "professionnel"}
Format: Nom, poste, temoignage 3-4 phrases, note 5 etoiles.`,
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
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "generer") {
      const { type, contexte } = body;
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
