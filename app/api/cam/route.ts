import { mesurer } from "../../../lib/usageIA";
import { sessionCourante } from "../../../lib/session";
// app/api/cam/route.ts — v6 LMS COMPLET
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300;

// Cette route DEPENSE DE L ARGENT : chaque generation declenche une
// vingtaine d appels a Claude. Elle est donc reservee aux administrateurs,
// et le controle d origine ne suffit pas : les en-tetes se posent a la main.
const ADMINS = ["contact@academiapro.fr"];

function refuser() {
  return NextResponse.json({ erreur: "Acces refuse" }, { status: 403 });
}

function estAdministrateur(): boolean {
  const session = sessionCourante();
  if (!session || !session.email) return false;
  return ADMINS.indexOf(session.email) >= 0;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!;
const CLAUDE_MODEL = "claude-sonnet-4-6";

const AGENTS_DOMAINE: Record<string, { formateur: string; coach: string }> = {
  "IA":        { formateur: "Alex Bernard",    coach: "Isabelle Moreau" },
  "Business":  { formateur: "Thomas Martin",   coach: "Isabelle Moreau" },
  "Marketing": { formateur: "Nina Castillo",   coach: "Isabelle Moreau" },
  "Langues":   { formateur: "Sofia Durand",    coach: "Isabelle Moreau" },
  "Bien-etre": { formateur: "Claire Beaumont", coach: "Maya" },
  "Tech":      { formateur: "Karim Benzara",   coach: "Isabelle Moreau" },
  "Design":    { formateur: "Lucas Petit",     coach: "Isabelle Moreau" },
  "Finance":   { formateur: "Emma Lefebvre",   coach: "Isabelle Moreau" },
  "Droit":     { formateur: "Antoine Moreau",  coach: "Isabelle Moreau" },
  "Outils":    { formateur: "Thomas Martin",   coach: "Isabelle Moreau" },
};

function nettoyer(texte: string): string {
  return (texte || "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/\\/g, " ")
    .trim();
}

async function appel_claude(system: string, user: string, max_tokens = 800): Promise<string> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    mesurer("cam", data);
    return nettoyer(data.content[0].text || "");
  } catch {
    return "";
  }
}

async function appel_agent_architecte(formation: any): Promise<any[]> {
  try {
    const base_url = process.env.NEXT_PUBLIC_SITE_URL || "https://academiapro.fr";
    const r = await fetch(base_url + "/api/agent-architecte", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formation_code: formation.code,
        formation_titre: formation.titre,
        domaine: formation.domaine || "Business",
        niveau: formation.niveau || "Intermediaire",
        duree: formation.duree || "200h",
      }),
    });
    if (!r.ok) return [];
    const data = await r.json();
    if (!data.succes || !data.structure?.chapitres) return [];
    return data.structure.chapitres;
  } catch {
    return [];
  }
}

async function generer_contenu_module(formation: any, chapitre: any, module: any, formateur: string): Promise<string> {
  const type_map: Record<string, string> = {
    "theorie": "Redige 4 paragraphes de theorie scientifique et conceptuelle denses et professionnels.",
    "pratique": "Redige 3 exercices pratiques complets etape par etape avec objectifs et protocoles.",
    "evaluation": "Redige 5 questions QCM format strict: Q1. [question] A) B) C) D) Reponse : X - [explication]",
  };
  const instruction = type_map[module.type] || type_map["theorie"];
  return await appel_claude(
    `Tu es ${formateur}, expert en ${formation.domaine}. Redige du contenu professionnel dense. Pas de guillemets doubles.`,
    `Formation: ${formation.titre}. Chapitre ${chapitre.numero}: ${chapitre.titre}. Module ${module.numero}: ${module.titre}. ${instruction}`,
    800
  );
}

async function cam_generer_lms_complet(code_formation: string) {
  const { data: formations } = await supabase
    .from("formations").select("*").eq("code", code_formation).limit(1);
  if (!formations || formations.length === 0)
    return { succes: false, erreur: `Formation ${code_formation} introuvable` };

  const f = formations[0];
  const domaine = f.domaine || "Business";
  const agents = AGENTS_DOMAINE[domaine] || AGENTS_DOMAINE["Business"];
  const titre = (f.titre || code_formation).replace(/[^\w\s\-]/g, " ");

  const [intro, coaching] = await Promise.all([
    appel_claude(
      `Tu es ${agents.formateur}, formateur expert en ${domaine}. Pas de guillemets doubles.`,
      `Introduction complete pour: ${titre}. 4 paragraphes: contexte, importance, competences acquises, debouches.`,
      600
    ),
    appel_claude(
      `Tu es ${agents.coach}, coach ICF PCC. Pas de guillemets doubles.`,
      `Message d accompagnement pour un apprenant qui commence: ${titre}. Chaleureux et motivant.`,
      300
    ),
  ]);

  // Agent Architecte genere la structure chapitres/modules
  let chapitres_structure = await appel_agent_architecte(f);

  // Fallback si Agent Architecte echoue
  if (!chapitres_structure || chapitres_structure.length === 0) {
    chapitres_structure = [1,2,3,4,5].map(num => ({
      numero: num,
      titre: ["Fondements theoriques", "Pratique et protocoles", "Applications cliniques", "Approfondissement", "Integration et certification"][num-1],
      modules: [
        { numero: 1, titre: "Theorie fondamentale", type: "theorie" },
        { numero: 2, titre: "Theorie approfondie", type: "theorie" },
        { numero: 3, titre: "Pratique et exercices", type: "pratique" },
        { numero: 4, titre: "Evaluation et QCM", type: "evaluation" },
      ],
    }));
  }

  // Generer le contenu de chaque module
  const chapitres = [];
  for (const ch of chapitres_structure) {
    const modules_avec_contenu = [];
    for (const mod of (ch.modules || [])) {
      const contenu_mod = await generer_contenu_module(f, ch, mod, agents.formateur);
      modules_avec_contenu.push({
        ...mod,
        contenu: contenu_mod || `Contenu ${mod.titre}.`,
        duree: mod.type === "evaluation" ? "1h" : "2h",
      });
    }
    chapitres.push({ ...ch, modules: modules_avec_contenu });
  }

  const [examen_blanc, bibliographie] = await Promise.all([
    appel_claude(
      `Tu es Jean, Agent Qualiopi. Pas de guillemets doubles.`,
      `Examen blanc 10 questions pour: ${titre}. Format: Q: / A: / B: / C: / D: / Reponse: / Explication: Seuil 70%.`,
      800
    ),
    appel_claude(
      `Tu es ${agents.formateur}. Pas de guillemets doubles.`,
      `Bibliographie 8 references pour: ${titre}. Format: Titre - Auteur - Description courte.`,
      400
    ),
  ]);

  const contenu_final = {
    v: "6",
    code: code_formation,
    titre,
    domaine,
    niveau: f.niveau || "",
    duree: f.duree || "",
    date: new Date().toISOString().split("T")[0],
    formateur: agents.formateur,
    coach: agents.coach,
    introduction: intro || `Bienvenue dans la formation ${titre}.`,
    coaching: coaching || `Je suis la pour vous accompagner.`,
    chapitres,
    examen_blanc: examen_blanc || `Examen blanc de ${titre}.`,
    bibliographie: bibliographie || `Ressources de ${titre}.`,
    meta: {
      nb_chapitres: 5,
      nb_modules: 15,
      genere_par: "CAM v6",
      agents: [agents.formateur, agents.coach, "Jean Qualiopi"],
    }
  };

  const { data: existant } = await supabase
    .from("formations_lms").select("id").eq("formation_code", code_formation).limit(1);

  const payload = { formation_code: code_formation, contenu: contenu_final, examen_blanc: examen_blanc || "" };

  let err;
  if (existant && existant.length > 0) {
    const r = await supabase.from("formations_lms").update(payload).eq("formation_code", code_formation);
    err = r.error;
  } else {
    const r = await supabase.from("formations_lms").insert(payload);
    err = r.error;
  }

  if (err) return { succes: false, erreur: err.message };
  return { succes: true, code: code_formation, titre, chapitres: 5, modules: 15, formateur: agents.formateur };
}

async function cam_statut() {
  // Les ateliers (codes SK) ne sont pas des formations : ils n ont pas
  // vocation a recevoir un LMS et fausseraient le compte.
  const { data: formations } = await supabase
    .from("formations").select("code,titre,domaine,niveau")
    .eq("actif", true)
    .eq("type_objet", "formation")
    .order("code");
  const { data: lms } = await supabase.from("formations_lms").select("formation_code,contenu");
  const lms_v6 = (lms || []).filter((x: any) => x.contenu?.v === "6").map((x: any) => x.formation_code);
  const lms_codes = (lms || []).map((x: any) => x.formation_code);
  const sans_v6 = (formations || []).filter((f: any) => !lms_v6.includes(f.code));
  return {
    total: formations?.length || 0,
    avec_lms_complet: lms_v6.length,
    avec_lms_minimal: lms_codes.length - lms_v6.length,
    sans_lms_complet: sans_v6.length,
    formations_sans_lms_complet: sans_v6.slice(0, 50),
  };
}

export async function POST(req: NextRequest) {
  if (!estAdministrateur()) return refuser();

  try {
    const body = await req.json();
    const { action, code, codes } = body;
    if (action === "statut") return NextResponse.json(await cam_statut());
    if (action === "generer" && code) return NextResponse.json(await cam_generer_lms_complet(code.toUpperCase()));
    if (action === "batch" && codes) {
      const resultats = [];
      for (const c of codes) resultats.push(await cam_generer_lms_complet(c.toUpperCase()));
      return NextResponse.json({ succes: resultats.filter((r: any) => r.succes).map((r: any) => r.code), echecs: resultats.filter((r: any) => !r.succes).map((r: any) => r.code) });
    }
    if (action === "batch10") {
      const statut = await cam_statut();
      const premiers = statut.formations_sans_lms_complet.slice(0, 3).map((f: any) => f.code);
      const resultats = [];
      for (const c of premiers) resultats.push(await cam_generer_lms_complet(c));
      return NextResponse.json({ succes: resultats.filter((r: any) => r.succes).map((r: any) => r.code), echecs: resultats.filter((r: any) => !r.succes).map((r: any) => r.code), total: premiers.length });
    }
    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  if (!estAdministrateur()) return refuser();
  return NextResponse.json(await cam_statut());
}
