import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300;

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

async function appel_claude(system: string, user: string, max_tokens = 1000) {
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
  if (!res.ok) return null;
  const data = await res.json();
  return data.content[0].text as string;
}

async function cam_generer_lms(code_formation: string) {
  const { data: formations } = await supabase
    .from("formations").select("*").eq("code", code_formation).limit(1);
  if (!formations || formations.length === 0)
    return { succes: false, erreur: `Formation ${code_formation} introuvable` };

  const formation = formations[0];
  const domaine = formation.domaine || "Business";
  const agents = AGENTS_DOMAINE[domaine] || AGENTS_DOMAINE["Business"];
  const titre = formation.titre || code_formation;

  // Agent Formateur — texte libre, pas de JSON
  const intro = await appel_claude(
    `Tu es ${agents.formateur}, formateur expert en ${domaine}. Reponds en 3 phrases maximum en francais simple sans guillemets doubles.`,
    `Ecris une introduction de bienvenue pour la formation: ${titre}`,
    300
  ) || `Bienvenue dans la formation ${titre}.`;

  const contenu = await appel_claude(
    `Tu es ${agents.formateur}, formateur expert en ${domaine}. Reponds en 5 points courts en francais, un par ligne, sans guillemets doubles.`,
    `Donne 5 points cles a maitriser dans la formation: ${titre}`,
    400
  ) || `Points cles de la formation ${titre}.`;

  // Agent Coach — texte libre
  const coaching = await appel_claude(
    `Tu es ${agents.coach}, coach ICF. Reponds en 2 phrases en francais sans guillemets doubles.`,
    `Message de motivation pour un apprenant qui commence: ${titre}`,
    200
  ) || `Vous avez fait le bon choix en choisissant cette formation.`;

  // Agent Qualiopi — texte libre
  const qcm = await appel_claude(
    `Tu es Jean, agent Qualiopi. Ecris 3 questions QCM en francais, format: Q: question / A: bonne reponse, sans guillemets doubles.`,
    `3 questions QCM pour evaluer: ${titre}`,
    400
  ) || `Q: Qu'avez-vous appris ? / A: Les fondamentaux.`;

  // CAM assemble le JSON lui-meme — pas Claude
  const contenu_final = {
    meta: {
      code: code_formation,
      titre: titre,
      domaine: domaine,
      niveau: formation.niveau || "",
      duree: formation.duree || "",
      genere_par: "CAM Chef Agent Maitre v3",
      date_generation: new Date().toISOString(),
      agents_utilises: [agents.formateur, agents.coach, "Jean Qualiopi"],
    },
    pedagogique: {
      formateur: agents.formateur,
      introduction: intro.replace(/"/g, "'"),
      contenu_cle: contenu.replace(/"/g, "'"),
    },
    coaching: {
      coach: agents.coach,
      message: coaching.replace(/"/g, "'"),
    },
    evaluation: {
      evaluateur: "Jean Qualiopi",
      qcm: qcm.replace(/"/g, "'"),
      seuil_validation: "70%",
    },
  };

  const { data: existant } = await supabase
    .from("formations_lms").select("id").eq("formation_code", code_formation).limit(1);

  const payload = {
    formation_code: code_formation,
    contenu: contenu_final,
    examen_blanc: qcm.replace(/"/g, "'"),
  };

  if (existant && existant.length > 0) {
    await supabase.from("formations_lms").update(payload).eq("formation_code", code_formation);
  } else {
    await supabase.from("formations_lms").insert(payload);
  }

  return {
    succes: true,
    code: code_formation,
    titre: titre,
    agents: contenu_final.meta.agents_utilises,
  };
}

async function cam_statut() {
  const { data: formations } = await supabase
    .from("formations").select("code,titre,domaine,niveau").eq("actif", true).order("code");
  const { data: lms } = await supabase.from("formations_lms").select("formation_code");
  const lms_codes = (lms || []).map((x: any) => x.formation_code);
  const sans = (formations || []).filter((f: any) => !lms_codes.includes(f.code));
  return {
    total: formations?.length || 0,
    avec_lms: lms_codes.length,
    sans_lms: sans.length,
    formations_sans_lms: sans.slice(0, 50),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, codes } = body;

    if (action === "statut") return NextResponse.json(await cam_statut());

    if (action === "generer" && code)
      return NextResponse.json(await cam_generer_lms(code.toUpperCase()));

    if (action === "batch" && codes) {
      const resultats = [];
      for (const c of codes) resultats.push(await cam_generer_lms(c.toUpperCase()));
      return NextResponse.json({
        succes: resultats.filter(r => r.succes).map(r => r.code),
        echecs: resultats.filter(r => !r.succes).map(r => r.code),
      });
    }

    if (action === "batch10") {
      const statut = await cam_statut();
      const premiers = statut.formations_sans_lms.slice(0, 10).map((f: any) => f.code);
      const resultats = [];
      for (const c of premiers) resultats.push(await cam_generer_lms(c));
      return NextResponse.json({
        succes: resultats.filter(r => r.succes).map(r => r.code),
        echecs: resultats.filter(r => !r.succes).map(r => r.code),
        total: premiers.length,
      });
    }

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await cam_statut());
}
// app/api/cam/route.ts — v3
import { NextRequest, NextResponse } from "next/server";

