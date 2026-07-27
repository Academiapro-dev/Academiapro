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
  fr: "francais",
  en: "English",
  ar: "arabe",
  es: "espanol",
  pt: "portugues",
  de: "Deutsch",
};

async function generer_module(formation: any, chapitre: any, module: any, langue: string): Promise<string> {
  const langue_nom = LANGUES[langue] || "francais";

  const prompts: Record<string, string> = {
    theorie:
      "Tu es formateur expert pour AcadeMIA Pro.\n" +
      "Redige un contenu theorique COMPLET et DETAILLE de niveau professionnel.\n" +
      "Formation: " + formation.titre + "\n" +
      "Chapitre " + chapitre.numero + ": " + chapitre.titre + "\n" +
      "Module " + module.numero + ": " + module.titre + "\n" +
      "Langue: " + langue_nom + "\n" +
      "EXIGENCES: minimum 15 paragraphes denses - niveau academique - cite auteurs et recherches - inclus encadres Points cles et Applications pratiques - sous-titres clairs - equivalent 15 pages manuel professionnel - redige ENTIEREMENT en " + langue_nom,

    pratique:
      "Tu es formateur expert pour AcadeMIA Pro.\n" +
      "Redige un guide pratique COMPLET et DETAILLE.\n" +
      "Formation: " + formation.titre + "\n" +
      "Chapitre " + chapitre.numero + ": " + chapitre.titre + "\n" +
      "Module " + module.numero + ": " + module.titre + "\n" +
      "Langue: " + langue_nom + "\n" +
      "EXIGENCES: minimum 10 exercices pratiques etape par etape - scripts complets pour guider les seances - fiches de suivi - cas pratiques situations reelles - protocoles adaptation differents publics - equivalent 15 pages manuel pratique - redige ENTIEREMENT en " + langue_nom,

    evaluation:
      "Tu es formateur expert pour AcadeMIA Pro.\n" +
      "Redige une evaluation COMPLETE et RIGOUREUSE.\n" +
      "Formation: " + formation.titre + "\n" +
      "Chapitre " + chapitre.numero + ": " + chapitre.titre + "\n" +
      "Module " + module.numero + ": " + module.titre + "\n" +
      "Langue: " + langue_nom + "\n" +
      "EXIGENCES: 10 questions QCM avec 4 options reponse correcte et explication detaillee - 3 questions cas pratique avec reponse complete - 2 questions reflexion professionnelle - corrige complet avec justifications - ressources complementaires - redige ENTIEREMENT en " + langue_nom,
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
      system: "Tu es un formateur expert de niveau universitaire specialise en formation professionnelle certifiante. Tu rediges des manuels complets denses et de haute qualite academique. Tu rediges toujours entierement dans la langue demandee. Tu n inventes aucune certification, aucun titre officiel et aucun prix.",
      messages: [{ role: "user", content: prompts[module.type] || prompts.theorie }],
    }),
  });

  if (!res.ok) return "Erreur generation contenu";
  const data = await res.json();
  mesurer("lms-generer", data);
  return data.content[0].text || "";
}

async function lirePlan(formation_code: string) {
  const { data } = await supabase
    .from("lms_plans")
    .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
    .eq("formation_code", formation_code)
    .order("chapitre_num", { ascending: true })
    .order("module_num", { ascending: true });

  const chapitres: any[] = [];
  for (const l of data || []) {
    let ch = chapitres.find((c) => c.numero === l.chapitre_num);
    if (!ch) {
      ch = { numero: l.chapitre_num, titre: l.chapitre_titre, modules: [] };
      chapitres.push(ch);
    }
    ch.modules.push({ numero: l.module_num, titre: l.module_titre, type: l.type });
  }
  return chapitres;
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  try {
    const corps = await req.json();
    const formation_code = corps.formation_code;
    const chapitre_num = corps.chapitre_num;
    const module_num = corps.module_num;
    const langue = corps.langue || "fr";

    if (!formation_code) {
      return NextResponse.json({ erreur: "formation_code manquant" }, { status: 400 });
    }

    const { data: formations } = await supabase
      .from("formations")
      .select("*")
      .eq("code", formation_code)
      .limit(1);

    if (!formations || formations.length === 0) {
      return NextResponse.json({ erreur: "Formation introuvable" }, { status: 404 });
    }

    const formation = formations[0];
    const plan = await lirePlan(formation_code);

    if (plan.length === 0) {
      return NextResponse.json({ erreur: "Aucun plan enregistre pour " + formation_code }, { status: 404 });
    }

    const chapitre = plan[chapitre_num - 1];
    if (!chapitre) {
      return NextResponse.json({ erreur: "Chapitre introuvable" }, { status: 404 });
    }

    const module = chapitre.modules[module_num - 1];
    if (!module) {
      return NextResponse.json({ erreur: "Module introuvable" }, { status: 404 });
    }

    const cache_key = formation_code + "_ch" + chapitre_num + "_mod" + module_num + "_" + langue;

    const { data: cache } = await supabase
      .from("lms_cache")
      .select("contenu")
      .eq("cache_key", cache_key)
      .limit(1);

    if (cache && cache.length > 0) {
      return NextResponse.json({ succes: true, depuis_cache: true, chapitre, module, contenu: cache[0].contenu });
    }

    const contenu = await generer_module(formation, chapitre, module, langue);

    await supabase.from("lms_cache").insert({
      cache_key: cache_key,
      formation_code: formation_code,
      chapitre_num: chapitre_num,
      module_num: module_num,
      langue: langue,
      contenu: contenu,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ succes: true, depuis_cache: false, chapitre, module, contenu });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const code = (new URL(req.url).searchParams.get("code") || "F030").toUpperCase();
  const chapitres = await lirePlan(code);
  return NextResponse.json({ formation_code: code, chapitres: chapitres });
}
