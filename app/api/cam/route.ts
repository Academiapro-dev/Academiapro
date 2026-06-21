// app/api/cam/route.ts
// CAM — Chef Agent Maître · AcadémIA Pro

import { NextRequest, NextResponse } from "next/server";
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

async function appel_claude(system: string, user: string, max_tokens = 3000) {
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

function parse_json(texte: string) {
  try {
    return JSON.parse(texte);
  } catch {
    const propre = texte.trim()
      .replace(/^```json\n?/, "")
      .replace(/^```\n?/, "")
      .replace(/\n?```$/, "");
    return JSON.parse(propre);
  }
}

async function agent_formateur(formation: any, domaine: string) {
  const agents = AGENTS_DOMAINE[domaine] || AGENTS_DOMAINE["Business"];
  const nom = agents.formateur;
  const system = `Tu es ${nom}, Formateur Expert en ${domaine} sur AcadeMIA Pro. Reponds UNIQUEMENT en JSON valide sans markdown.`;
  const user = `Genere le contenu LMS pour:
Code: ${formation.code}
Titre: ${formation.titre}
Domaine: ${formation.domaine}
Niveau: ${formation.niveau}
Duree: ${formation.duree}
Objectifs: ${formation.objectifs || "Non defini"}
JSON: {"formateur":"${nom}","introduction":"3-4 phrases","modules":[{"numero":1,"titre":"titre","duree":"Xh","objectif":"objectif","contenu":"contenu","exercice":"exercice","ressources":["r1","r2"]}],"competences_acquises":["c1","c2","c3"],"methode_pedagogique":"methode"}`;
  const texte = await appel_claude(system, user, 3000);
  if (!texte) return null;
  return parse_json(texte);
}

async function agent_coach(formation: any, domaine: string) {
  const agents = AGENTS_DOMAINE[domaine] || AGENTS_DOMAINE["Business"];
  const nom = agents.coach;
  const system = `Tu es ${nom}, Coach ICF PCC sur AcadeMIA Pro. Reponds UNIQUEMENT en JSON valide sans markdown.`;
  const user = `Genere coaching pour: Code: ${formation.code} Titre: ${formation.titre}
JSON: {"coach":"${nom}","message_bienvenue":"message","points_vigilance":["p1","p2","p3"],"techniques_motivation":["t1","t2"],"message_encouragement":"message","celebration_reussite":"message"}`;
  const texte = await appel_claude(system, user, 2000);
  if (!texte) return {};
  try { return parse_json(texte); } catch { return {}; }
}

async function agent_qualiopi(formation: any) {
  const system = `Tu es Jean, Agent Qualiopi AcadeMIA Pro. Reponds UNIQUEMENT en JSON valide sans markdown.`;
  const user = `Genere examen blanc pour: Code: ${formation.code} Titre: ${formation.titre} Domaine: ${formation.domaine}
JSON: {"examen_blanc":{"titre":"Examen ${formation.titre}","duree":"45 minutes","questions":[{"numero":1,"question":"question","type":"QCM","options":["A.","B.","C.","D."],"reponse_correcte":"A","explication":"explication"}],"seuil_validation":"70%"}}
Genere 10 questions variees.`;
  const texte = await appel_claude(system, user, 3000);
  if (!texte) return {};
  try { return parse_json(texte); } catch { return {}; }
}

async function cam_generer_lms(code_formation: string) {
  const { data: formations } = await supabase
    .from("formations").select("*").eq("code", code_formation).limit(1);
  if (!formations || formations.length === 0)
    return { succes: false, erreur: `Formation ${code_formation} introuvable` };

  const formation = formations[0];
  const domaine = formation.domaine || "Business";
  const agents = AGENTS_DOMAINE[domaine] || AGENTS_DOMAINE["Business"];

  const pedagogique = await agent_formateur(formation, domaine);
  if (!pedagogique) return { succes: false, erreur: "Echec Agent Formateur" };

  const coaching = await agent_coach(formation, domaine);
  const evaluation = await agent_qualiopi(formation);

  const contenu_final = {
    meta: {
      code: code_formation,
      titre: formation.titre,
      domaine,
      genere_par: "CAM Chef Agent Maitre",
      date_generation: new Date().toISOString(),
      agents_utilises: [agents.formateur, agents.coach, "Jean Qualiopi"],
    },
    pedagogique,
    coaching,
    evaluation,
  };

  const { data: existant } = await supabase
    .from("formations_lms").select("id").eq("formation_code", code_formation).limit(1);

  const payload = { formation_code: code_formation, contenu: contenu_final, examen_blanc: JSON.stringify(evaluation) };

  if (existant && existant.length > 0) {
    await supabase.from("formations_lms").update(payload).eq("formation_code", code_formation);
  } else {
    await supabase.from("formations_lms").insert(payload);
  }

  return { succes: true, code: code_formation, titre: formation.titre, agents: contenu_final.meta.agents_utilises };
}

async function cam_statut() {
  const { data: formations } = await supabase
    .from("formations").select("code,titre,domaine,niveau").eq("actif", true).order("code");
  const { data: lms } = await supabase.from("formations_lms").select("formation_code");
  const lms_codes = (lms || []).map((x: any) => x.formation_code);
  const sans = (formations || []).filter((f: any) => !lms_codes.includes(f.code));
  return { total: formations?.length || 0, avec_lms: lms_codes.length, sans_lms: sans.length, formations_sans_lms: sans.slice(0, 50) };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, codes } = body;
    if (action === "statut") return NextResponse.json(await cam_statut());
    if (action === "generer" && code) return NextResponse.json(await cam_generer_lms(code.toUpperCase()));
    if (action === "batch" && codes) {
      const resultats = [];
      for (const c of codes) resultats.push(await cam_generer_lms(c.toUpperCase()));
      return NextResponse.json({ succes: resultats.filter(r => r.succes).map(r => r.code), echecs: resultats.filter(r => !r.succes).map(r => r.code) });
    }
    if (action === "batch10") {
      const statut = await cam_statut();
      const premiers = statut.formations_sans_lms.slice(0, 10).map((f: any) => f.code);
      const resultats = [];
      for (const c of premiers) resultats.push(await cam_generer_lms(c));
      return NextResponse.json({ succes: resultats.filter(r => r.succes).map(r => r.code), echecs: resultats.filter(r => !r.succes).map(r => r.code) });
    }
    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await cam_statut());
}
