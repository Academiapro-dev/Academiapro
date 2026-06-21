// app/api/cam/route.ts — v6 LMS COMPLET
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
    return nettoyer(data.content[0].text || "");
  } catch {
    return "";
  }
}

async function generer_chapitre(formation: any, num: number, formateur: string): Promise<any> {
  const titres_chapitres: Record<number, string> = {
    1: "Fondements theoriques et scientifiques",
    2: "Pratique guidee et protocoles",
    3: "Applications cliniques et cas pratiques",
    4: "Approfondissement et specialisation",
    5: "Integration et certification",
  };

  const titre_chapitre = titres_chapitres[num] || `Chapitre ${num}`;

  const [theorie, pratique, evaluation] = await Promise.all([
    appel_claude(
      `Tu es ${formateur}, expert en ${formation.domaine}. Redige un contenu theorique dense et professionnel. Pas de guillemets doubles.`,
      `Chapitre ${num} - ${titre_chapitre} pour: ${formation.titre}. Redige 4 paragraphes de theorie scientifique et conceptuelle.`,
      600
    ),
    appel_claude(
      `Tu es ${formateur}, expert en ${formation.domaine}. Decris des exercices pratiques concrets. Pas de guillemets doubles.`,
      `Chapitre ${num} - Exercices pratiques pour: ${formation.titre}. Redige 3 exercices etape par etape.`,
      600
    ),
    appel_claude(
      `Tu es un evaluateur Qualiopi expert. Redige des questions d evaluation. Pas de guillemets doubles.`,
      `Chapitre ${num} pour: ${formation.titre}. Redige 5 questions QCM format: Q: / A: / B: / C: / D: / Reponse: / Explication:`,
      500
    ),
  ]);

  return {
    numero: num,
    titre: titre_chapitre,
    modules: [
      { numero: 1, titre: "Fondements theoriques", type: "theorie", contenu: theorie || `Theorie chapitre ${num}.`, duree: "2h" },
      { numero: 2, titre: "Exercices pratiques", type: "pratique", contenu: pratique || `Pratique chapitre ${num}.`, duree: "2h" },
      { numero: 3, titre: "Auto-evaluation", type: "evaluation", contenu: evaluation || `Evaluation chapitre ${num}.`, duree: "1h" },
    ],
  };
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

  const chapitres = [];
  for (let i = 1; i <= 5; i++) {
    const chapitre = await generer_chapitre(f, i, agents.formateur);
    chapitres.push(chapitre);
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
  const { data: formations } = await supabase
    .from("formations").select("code,titre,domaine,niveau").eq("actif", true).order("code");
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
  return NextResponse.json(await cam_statut());
}
