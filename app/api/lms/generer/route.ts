import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const LANGUES = {
  fr: "francais", en: "English", ar: "العربية", es: "espanol", pt: "portugues", de: "Deutsch",
};

const CHAPITRES = [
  { numero: 1, titre: "Fondements Theoriques et Scientifiques", modules: [
    { numero: 1, titre: "Histoire et origines", type: "theorie" },
    { numero: 2, titre: "Neurobiologie et mecanismes", type: "theorie" },
    { numero: 3, titre: "Protocoles d induction", type: "pratique" },
    { numero: 4, titre: "Evaluation QCM Chapitre 1", type: "evaluation" },
  ]},
  { numero: 2, titre: "Les 12 Degres Caycediens RD1 a RD4", modules: [
    { numero: 1, titre: "RD1 Decontraction Musculaire", type: "theorie" },
    { numero: 2, titre: "RD2 Sophro-Activation Positive", type: "theorie" },
    { numero: 3, titre: "RD3 Sophro-Contemplation", type: "theorie" },
    { numero: 4, titre: "Pratique guidee RD1-RD4", type: "pratique" },
  ]},
  { numero: 3, titre: "Les Degres Superieurs RD5 a RD12", modules: [
    { numero: 1, titre: "RD5 a RD8 Approfondissement", type: "theorie" },
    { numero: 2, titre: "RD9 a RD12 Contemplation", type: "theorie" },
    { numero: 3, titre: "Applications cliniques", type: "pratique" },
    { numero: 4, titre: "Cas cliniques et QCM", type: "evaluation" },
  ]},
  { numero: 4, titre: "Applications Professionnelles", modules: [
    { numero: 1, titre: "Sophrologie perinatale", type: "pratique" },
    { numero: 2, titre: "Sophrologie du sport", type: "pratique" },
    { numero: 3, titre: "Sophrologie oncologique", type: "pratique" },
    { numero: 4, titre: "Protocoles personnalises QCM", type: "evaluation" },
  ]},
  { numero: 5, titre: "Pratique Professionnelle et Certification", modules: [
    { numero: 1, titre: "Construction cabinet sophrologie", type: "pratique" },
    { numero: 2, titre: "Ethique et cadre legal", type: "theorie" },
    { numero: 3, titre: "Supervision et memoire", type: "pratique" },
    { numero: 4, titre: "Examen blanc final 20 questions", type: "evaluation" },
  ]},
];

async function generer(formation, chapitre, module, langue) {
  const langue_nom = LANGUES[langue] || "francais";
  const prompt = "Tu es Claire Beaumont, formatrice experte en sophrologie caycedienne pour AcadeMIA Pro. Redige un contenu COMPLET et DETAILLE de niveau professionnel pour ce module. Formation: " + formation.titre + ". Chapitre " + chapitre.numero + ": " + chapitre.titre + ". Module " + module.numero + ": " + module.titre + ". Type: " + module.type + ". Langue: " + langue_nom + ". EXIGENCES ABSOLUES: minimum 15 paragraphes denses - niveau academique - cite auteurs et recherches - inclus encadres Points cles - sous-titres clairs - equivalent 15 pages manuel professionnel - redige ENTIEREMENT en " + langue_nom + ".";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: "Tu es un formateur expert de niveau universitaire. Tu rediges des manuels complets et denses de haute qualite academique. Tu rediges toujours entierement dans la langue demandee.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return "Erreur generation";
  const data = await res.json();
  return data.content[0].text || "";
}

export async function POST(req) {
  try {
    const { formation_code, chapitre_num, module_num, langue = "fr" } = await req.json();

    const { data: formations } = await supabase.from("formations").select("*").eq("code", formation_code).limit(1);
    if (!formations || formations.length === 0) return NextResponse.json({ erreur: "Formation introuvable" }, { status: 404 });

    const formation = formations[0];
    const chapitre = CHAPITRES[chapitre_num - 1];
    if (!chapitre) return NextResponse.json({ erreur: "Chapitre introuvable" }, { status: 404 });

    const module = chapitre.modules[module_num - 1];
    if (!module) return NextResponse.json({ erreur: "Module introuvable" }, { status: 404 });

    const cache_key = formation_code + "_ch" + chapitre_num + "_mod" + module_num + "_" + langue;
    const { data: cache } = await supabase.from("lms_cache").select("contenu").eq("cache_key", cache_key).limit(1);

    if (cache && cache.length > 0) {
      return NextResponse.json({ succes: true, depuis_cache: true, chapitre, module, contenu: cache[0].contenu });
    }

    const contenu = await generer(formation, chapitre, module, langue);

    await supabase.from("lms_cache").insert({
      cache_key, formation_code, chapitre_num, module_num, langue, contenu,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ succes: true, depuis_cache: false, chapitre, module, contenu });

  } catch (err) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ chapitres: CHAPITRES, status: "ok" });
}
