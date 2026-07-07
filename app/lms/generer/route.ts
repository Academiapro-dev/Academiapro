import { mesurer } from "../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!;

const LANGUES: Record<string, string> = {
  fr: "français",
  en: "English",
  ar: "العربية",
  es: "español",
  pt: "português",
  de: "Deutsch",
};

const CHAPITRES_SOPHROLOGIE = [
  { numero: 1, titre: "Fondements Théoriques et Scientifiques de la Sophrologie Caycédienne", modules: [
    { numero: 1, titre: "Histoire et origines de la sophrologie caycédienne", type: "theorie" },
    { numero: 2, titre: "Neurobiologie et mécanismes physiologiques", type: "theorie" },
    { numero: 3, titre: "Protocoles d induction et sophronisation de base", type: "pratique" },
    { numero: 4, titre: "Evaluation et QCM Chapitre 1", type: "evaluation" },
  ]},
  { numero: 2, titre: "Les 12 Degrés Caycédiens — RD1 à RD4", modules: [
    { numero: 1, titre: "RD1 — Decontraction Musculaire Progressive", type: "theorie" },
    { numero: 2, titre: "RD2 — Sophro-Activation Positive", type: "theorie" },
    { numero: 3, titre: "RD3 — Sophro-Contemplation du Corps", type: "theorie" },
    { numero: 4, titre: "Pratique guidee RD1-RD4 et QCM", type: "pratique" },
  ]},
  { numero: 3, titre: "Les Degrés Supérieurs — RD5 à RD12", modules: [
    { numero: 1, titre: "RD5 a RD8 — Approfondissement et presence totale", type: "theorie" },
    { numero: 2, titre: "RD9 a RD12 — Contemplation de la conscience", type: "theorie" },
    { numero: 3, titre: "Applications cliniques et protocoles specialises", type: "pratique" },
    { numero: 4, titre: "Cas cliniques et QCM Chapitres 2-3", type: "evaluation" },
  ]},
  { numero: 4, titre: "Applications Professionnelles et Spécialisations", modules: [
    { numero: 1, titre: "Sophrologie perinatale et accompagnement naissance", type: "pratique" },
    { numero: 2, titre: "Sophrologie du sport de haut niveau", type: "pratique" },
    { numero: 3, titre: "Sophrologie oncologique et gestion douleur chronique", type: "pratique" },
    { numero: 4, titre: "Creation de protocoles personnalises et QCM", type: "evaluation" },
  ]},
  { numero: 5, titre: "Pratique Professionnelle et Certification", modules: [
    { numero: 1, titre: "Construction et gestion d un cabinet de sophrologie", type: "pratique" },
    { numero: 2, titre: "Ethique, deontologie et cadre legal du sophrologue", type: "theorie" },
    { numero: 3, titre: "Supervision, memoire professionnel et soutenance", type: "pratique" },
    { numero: 4, titre: "Examen blanc final — 20 questions", type: "evaluation" },
  ]},
];

async function generer_module(formation: any, chapitre: any, module: any, langue: string): Promise<string> {
  const langue_nom = LANGUES[langue] || "français";

  const prompts: Record<string, string> = {
    theorie: `Tu es Claire Beaumont, formatrice experte en sophrologie caycédienne pour AcadeMIA Pro.
Redige un contenu theorique COMPLET et DETAILLE de niveau professionnel.
Formation: ${formation.titre}
Chapitre ${chapitre.numero}: ${chapitre.titre}
Module ${module.numero}: ${module.titre}
Langue: ${langue_nom}
EXIGENCES: minimum 15 paragraphes denses - niveau academique - cite auteurs et recherches - inclus encadres Points cles et Applications pratiques - sous-titres clairs - equivalent 15 pages manuel professionnel - redige ENTIEREMENT en ${langue_nom}`,

    pratique: `Tu es Claire Beaumont, formatrice experte en sophrologie caycédienne pour AcadeMIA Pro.
Redige un guide pratique COMPLET et DETAILLE.
Formation: ${formation.titre}
Chapitre ${chapitre.numero}: ${chapitre.titre}
Module ${module.numero}: ${module.titre}
Langue: ${langue_nom}
EXIGENCES: minimum 10 exercices pratiques etape par etape - scripts complets pour guider les seances - fiches de suivi - cas pratiques situations reelles - protocoles adaptation differents publics - equivalent 15 pages manuel pratique - redige ENTIEREMENT en ${langue_nom}`,

    evaluation: `Tu es Claire Beaumont, formatrice experte en sophrologie caycédienne pour AcadeMIA Pro.
Redige une evaluation COMPLETE et RIGOUREUSE.
Formation: ${formation.titre}
Chapitre ${chapitre.numero}: ${chapitre.titre}
Module ${module.numero}: ${module.titre}
Langue: ${langue_nom}
EXIGENCES: 10 questions QCM avec 4 options reponse correcte et explication detaillee - 3 questions cas pratique avec reponse complete - 2 questions reflexion professionnelle - corrige complet avec justifications - ressources complementaires - redige ENTIEREMENT en ${langue_nom}`,
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: "Tu es un formateur expert de niveau universitaire specialise en formation professionnelle certifiante. Tu rediges des manuels complets denses et de haute qualite academique. Tu rediges toujours entierement dans la langue demandee.",
      messages: [{ role: "user", content: prompts[module.type] || prompts.theorie }],
    }),
  });

  if (!res.ok) return "Erreur generation contenu";
  const data = await res.json();
  mesurer("lms-generer", data);
  return data.content[0].text || "";
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
    const { formation_code, chapitre_num, module_num, langue = "fr" } = await req.json();

    if (formation_code !== "F030") {
      return NextResponse.json({ erreur: "Phase 1 : F030 uniquement" }, { status: 400 });
    }

    const { data: formations } = await supabase.from("formations").select("*").eq("code", formation_code).limit(1);
    if (!formations || formations.length === 0) return NextResponse.json({ erreur: "Formation introuvable" }, { status: 404 });

    const formation = formations[0];
    const chapitre = CHAPITRES_SOPHROLOGIE[chapitre_num - 1];
    if (!chapitre) return NextResponse.json({ erreur: "Chapitre introuvable" }, { status: 404 });

    const module = chapitre.modules[module_num - 1];
    if (!module) return NextResponse.json({ erreur: "Module introuvable" }, { status: 404 });

    const cache_key = `${formation_code}_ch${chapitre_num}_mod${module_num}_${langue}`;
    const { data: cache } = await supabase.from("lms_cache").select("contenu").eq("cache_key", cache_key).limit(1);

    if (cache && cache.length > 0) {
      return NextResponse.json({ succes: true, depuis_cache: true, chapitre, module, contenu: cache[0].contenu });
    }

    const contenu = await generer_module(formation, chapitre, module, langue);

    await supabase.from("lms_cache").insert({
      cache_key, formation_code, chapitre_num, module_num, langue, contenu,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ succes: true, depuis_cache: false, chapitre, module, contenu });

  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ chapitres: CHAPITRES_SOPHROLOGIE });
}

