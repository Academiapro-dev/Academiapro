import { mesurer } from "../../../lib/usageIA";
// app/api/marketing/route.ts — Agent Marketing connecté à CAM
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
  mesurer("marketing", data);
  return data.content[0].text || "";
}

const SYSTEM_MARKETING = `Tu es l Agent Marketing d AcadémIA Pro, plateforme de formation 100% IA. Tu crees du contenu marketing percutant et professionnel. Style direct et convincant. Pas de guillemets doubles. Pas de markdown.`;

async function generer_contenu(type: string, contexte: any): Promise<string> {
  const prompts: Record<string, string> = {
    landing_page: `Redige le texte complet d une landing page pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations IA"}
Public cible: ${contexte.cible || "professionnels"}
Inclus: headline percutant, sous-titre, 3 benefices cles, social proof, CTA fort, FAQ 3 questions.`,

    pub_google: `Redige 3 annonces Google Ads pour AcadémIA Pro.
Formation: ${contexte.formation || "formations IA"}
Budget: ${contexte.budget || "moyen"}
Format: Titre 1 (30 car max) | Titre 2 (30 car max) | Description (90 car max)`,

    pub_meta: `Redige 2 publicites Meta Ads pour AcadémIA Pro.
Formation: ${contexte.formation || "formations IA"}
Public: ${contexte.cible || "35-55 ans actifs"}
Inclus: accroche, texte principal, CTA. Ton emotionnel et percutant.`,

    article_seo: `Redige un article SEO optimise pour AcadémIA Pro.
Sujet: ${contexte.sujet || "formation IA professionnelle"}
Mot cle principal: ${contexte.mot_cle || "formation IA"}
Longueur: 600 mots. Structure: H1, introduction, 3 sections H2, conclusion, CTA.`,

    strategie: `Cree une strategie marketing complete pour AcadémIA Pro.
Objectif: ${contexte.objectif || "augmenter les inscriptions"}
Budget mensuel: ${contexte.budget || "500 EUR"}
Periode: ${contexte.periode || "3 mois"}
Inclus: canaux prioritaires, budget par canal, KPIs, planning mensuel, actions prioritaires.`,

    tunnel_vente: `Cree un tunnel de vente complet pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations"}
Prix: ${contexte.prix || "1400 EUR"}
Inclus: etape 1 attraction, etape 2 consideration, etape 3 decision, etape 4 fidelisation. Actions et messages pour chaque etape.`,
  };

  const prompt = prompts[type] || prompts.strategie;
  return await appel_claude(SYSTEM_MARKETING, prompt);
}

async function stats_marketing() {
  const { data } = await supabase.from("marketing").select("type,statut,canal");
  if (!data) return {};
  const total = data.length;
  const par_type = data.reduce((acc: any, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
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
      const contenu = await generer_contenu(type, contexte || {});

      await supabase.from("marketing").insert({
        type,
        titre: `${type} — ${new Date().toLocaleDateString("fr-FR")}`,
        contenu,
        canal: contexte?.canal || type,
        cible: contexte?.cible || "",
        statut: "brouillon",
      });

      return NextResponse.json({ succes: true, contenu });
    }

    if (action === "stats") return NextResponse.json(await stats_marketing());

    if (action === "liste") {
      const { data } = await supabase.from("marketing").select("*").order("created_at", { ascending: false }).limit(50);
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await stats_marketing());
}

