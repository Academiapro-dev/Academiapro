import { mesurer } from "../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const EXPERTS = {
  "Langues": { nom: "Dr. Sophie Marchand", titre: "Linguiste & Pedagogue" },
  "IA": { nom: "Dr. Marc Fontaine", titre: "Expert IA & Data Science" },
  "Bien-etre": { nom: "Dr. Isabelle Morin", titre: "Therapeute & Coach certifiee" },
  "Business": { nom: "Prof. Alain Rousseau", titre: "Expert Management & Strategie" },
  "Tech": { nom: "Lucas Martin", titre: "Ingenieur & Developpeur Senior" },
  "Marketing": { nom: "Sophie Leblanc", titre: "Expert Marketing Digital" },
  "Finance": { nom: "Prof. Henri Mercier", titre: "Expert Finance & Gestion" },
  "Langues Anciennes": { nom: "Prof. David Cohen", titre: "Hebraiste & Helleniste" },
  "Design": { nom: "Clara Vidal", titre: "Designer & Directrice Artistique" },
  "Outils": { nom: "Thomas Berger", titre: "Expert Productivite & Outils" },
  "Droit": { nom: "Maitre Pierre Duval", titre: "Avocat & Juriste" },
};

const LANGUES = {
  fr: "francais", en: "English", ar: "العربية", es: "espanol", pt: "portugues", de: "Deutsch",
};

// Structure par defaut si non trouvee dans formations_structure
const CHAPITRES_DEFAUT = [
  { numero: 1, titre: "Fondements et Introduction", modules: [
    { numero: 1, titre: "Histoire et contexte", type: "theorie" },
    { numero: 2, titre: "Concepts fondamentaux", type: "theorie" },
    { numero: 3, titre: "Premiers exercices pratiques", type: "pratique" },
    { numero: 4, titre: "Evaluation Chapitre 1", type: "evaluation" },
  ]},
  { numero: 2, titre: "Approfondissement Theorique", modules: [
    { numero: 1, titre: "Theories avancees", type: "theorie" },
    { numero: 2, titre: "Methodes et approches", type: "theorie" },
    { numero: 3, titre: "Applications pratiques", type: "pratique" },
    { numero: 4, titre: "Evaluation Chapitre 2", type: "evaluation" },
  ]},
  { numero: 3, titre: "Pratique Professionnelle", modules: [
    { numero: 1, titre: "Cas concrets et exemples", type: "theorie" },
    { numero: 2, titre: "Outils et techniques", type: "theorie" },
    { numero: 3, titre: "Mise en situation", type: "pratique" },
    { numero: 4, titre: "Evaluation Chapitre 3", type: "evaluation" },
  ]},
  { numero: 4, titre: "Specialisation et Expertise", modules: [
    { numero: 1, titre: "Sujets avances", type: "theorie" },
    { numero: 2, titre: "Recherche et innovation", type: "theorie" },
    { numero: 3, titre: "Projet professionnel", type: "pratique" },
    { numero: 4, titre: "Evaluation Chapitre 4", type: "evaluation" },
  ]},
  { numero: 5, titre: "Certification et Bilan", modules: [
    { numero: 1, titre: "Synthese des acquis", type: "theorie" },
    { numero: 2, titre: "Ethique et deontologie", type: "theorie" },
    { numero: 3, titre: "Memoire et soutenance", type: "pratique" },
    { numero: 4, titre: "Examen blanc final", type: "evaluation" },
  ]},
];

async function getChapitres(formation_code: string) {
  const { data } = await supabase
    .from("formations_structure")
    .select("chapitres, expert, expert_titre, domaine")
    .eq("formation_code", formation_code)
    .limit(1);

  if (data && data.length > 0) {
    const chapitres = data[0].chapitres;
    return {
      chapitres: Array.isArray(chapitres) ? chapitres : JSON.parse(chapitres as string),
      expert: data[0].expert,
      expert_titre: data[0].expert_titre,
      domaine: data[0].domaine,
    };
  }
  return { chapitres: CHAPITRES_DEFAUT, expert: "Claire Beaumont", expert_titre: "Formatrice Expert", domaine: "Business" };
}

async function appel_claude(prompt: string, expert_nom: string, langue_nom: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: "Tu es " + expert_nom + ", auteur de manuels universitaires de formation professionnelle. Chaque module que tu rediges est equivalent a un chapitre complet d un livre de 300 pages. Tu developpes chaque point en profondeur avec des exemples concrets, des citations scientifiques et des applications pratiques detaillees. Tu rediges entierement en " + langue_nom + ".",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  mesurer("lms-generer", data);
  return data.content[0].text || "";
}

async function generer(formation: any, chapitre: any, module: any, langue: string, expert_nom: string) {
  const langue_nom = LANGUES[langue] || "francais";
  const contexte = "Formation: " + formation.titre + ". Chapitre " + chapitre.numero + ": " + chapitre.titre + ". Module " + module.numero + ": " + module.titre + ".";

  const prompts = {
    theorie: [
      contexte + " PARTIE 1/3 - INTRODUCTION ET FONDEMENTS. Redige minimum 10 paragraphes denses sur le contexte historique, les bases theoriques et les fondements scientifiques. Cite des auteurs reconnus. Langue: " + langue_nom,
      contexte + " PARTIE 2/3 - APPROFONDISSEMENT THEORIQUE. Redige minimum 10 paragraphes sur les mecanismes, les theories avancees, les etudes scientifiques et les applications. Langue: " + langue_nom,
      contexte + " PARTIE 3/3 - SYNTHESE ET RESSOURCES. Redige: points cles (10 items developpes), glossaire (15 termes), bibliographie commentee (8 references), conseils pour progresser. Langue: " + langue_nom,
    ],
    pratique: [
      contexte + " PARTIE 1/3 - PREPARATION ET EXERCICES 1-2. Objectifs pratiques, cadre de pratique, EXERCICE 1 complet avec protocole detaille etape par etape, EXERCICE 2 complet. Langue: " + langue_nom,
      contexte + " PARTIE 2/3 - EXERCICES 3-4-5. EXERCICE 3, 4 et 5 complets avec protocoles detailles. Script complet de seance guidee 30 minutes. Langue: " + langue_nom,
      contexte + " PARTIE 3/3 - ADAPTATION ET SUIVI. Adaptation differents publics, erreurs courantes, fiche de suivi 20 criteres, progression et niveaux, ressources. Langue: " + langue_nom,
    ],
    evaluation: [
      contexte + " PARTIE 1/3 - QCM 1 A 10. Redige exactement 10 questions QCM au FORMAT STRICT:\nQ1. [Question detaillee]\nA) [Option]\nB) [Option]\nC) [Option]\nD) [Option]\nReponse : A - [Explication 3 lignes]\n\nCommence par Q1. Langue: " + langue_nom,
      contexte + " PARTIE 2/3 - QCM 11 A 20. Redige exactement 10 questions QCM avancees au FORMAT STRICT:\nQ11. [Question]\nA) B) C) D)\nReponse : [lettre] - [explication]\n\nCommence par Q11. Langue: " + langue_nom,
      contexte + " PARTIE 3/3 - CAS PRATIQUES ET EXAMEN BLANC. 5 questions synthese format QCM (EB1-EB5), 3 cas cliniques detailles avec corrections, grille auto-evaluation 20 criteres, conseils progression. Langue: " + langue_nom,
    ],
  };

  const type_prompts = prompts[module.type as keyof typeof prompts] || prompts.theorie;
  const parties = await Promise.all(type_prompts.map(p => appel_claude(p, expert_nom, langue_nom)));
  return parties.join("\n\n---\n\n");
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

    const { data: formations } = await supabase
      .from("formations")
      .select("*")
      .eq("code", formation_code)
      .limit(1);

    if (!formations || formations.length === 0) {
      return NextResponse.json({ erreur: "Formation introuvable" }, { status: 404 });
    }

    const formation = formations[0];
    const { chapitres, expert, expert_titre, domaine } = await getChapitres(formation_code);

    const chapitre = chapitres[chapitre_num - 1];
    if (!chapitre) return NextResponse.json({ erreur: "Chapitre introuvable" }, { status: 404 });

    const module = chapitre.modules[module_num - 1];
    if (!module) return NextResponse.json({ erreur: "Module introuvable" }, { status: 404 });

    const cache_key = formation_code + "_ch" + chapitre_num + "_mod" + module_num + "_" + langue;
    const { data: cache } = await supabase
      .from("lms_cache")
      .select("contenu")
      .eq("cache_key", cache_key)
      .limit(1);

    if (cache && cache.length > 0) {
      return NextResponse.json({ succes: true, depuis_cache: true, chapitre, module, contenu: cache[0].contenu, expert, expert_titre });
    }

    const contenu = await generer(formation, chapitre, module, langue, expert);

    await supabase.from("lms_cache").insert({
      cache_key, formation_code, chapitre_num, module_num, langue, contenu,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ succes: true, depuis_cache: false, chapitre, module, contenu, expert, expert_titre });

  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "LMS Generer universel operationnel — 265 formations — 11 experts" });
}
