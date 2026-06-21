// app/api/cam/route.ts — v6 LMS COMPLET MULTILINGUE
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

const LANGUES = ["fr", "en", "es", "pt", "de", "ar"];

const LANGUES_NOMS: Record<string, string> = {
  fr: "français",
  en: "English",
  es: "español",
  pt: "português",
  de: "Deutsch",
  ar: "العربية",
};

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
  return (texte || "").replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").replace(/\\/g, " ").trim();
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
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens, system, messages: [{ role: "user", content: user }] }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return nettoyer(data.content[0].text || "");
  } catch {
    return "";
  }
}

async function generer_contenu_langue(f: any, agents: any, langue: string): Promise<any> {
  const nom = LANGUES_NOMS[langue];
  const titre = (f.titre || f.code).replace(/[^\w\s\-]/g, " ");

  const [intro, coaching] = await Promise.all([
    appel_claude(`Tu es ${agents.formateur}, expert en ${f.domaine}. Reponds UNIQUEMENT en ${nom}. Pas de guillemets doubles.`, `Introduction 4 paragraphes en ${nom} pour: ${titre}`, 600),
    appel_claude(`Tu es ${agents.coach}, coach ICF. Reponds UNIQUEMENT en ${nom}. Pas de guillemets doubles.`, `Message d accompagnement en ${nom} pour: ${titre}`, 300),
  ]);

  const chapitres = [];
  const titres_ch: Record<string, string[]> = {
    fr: ["Fondements theoriques", "Pratique guidee", "Applications cliniques", "Approfondissement", "Integration et certification"],
    en: ["Theoretical Foundations", "Guided Practice", "Clinical Applications", "Advanced Topics", "Integration and Certification"],
    es: ["Fundamentos teoricos", "Practica guiada", "Aplicaciones clinicas", "Profundizacion", "Integracion y certificacion"],
    pt: ["Fundamentos teoricos", "Pratica guiada", "Aplicacoes clinicas", "Aprofundamento", "Integracao e certificacao"],
    de: ["Theoretische Grundlagen", "Geleitete Praxis", "Klinische Anwendungen", "Vertiefung", "Integration und Zertifizierung"],
    ar: ["الاسس النظرية", "الممارسة الموجهة", "التطبيقات السريرية", "التعمق", "الدمج والاعتماد"],
  };

  for (let i = 0; i < 5; i++) {
    const titre_ch = titres_ch[langue]?.[i] || `Chapitre ${i + 1}`;
    const [theorie, pratique, evaluation] = await Promise.all([
      appel_claude(`Tu es ${agents.formateur}, expert en ${f.domaine}. Reponds UNIQUEMENT en ${nom}. Pas de guillemets doubles.`, `Chapitre ${i + 1} - ${titre_ch} pour: ${titre}. 4 paragraphes de theorie.`, 600),
      appel_claude(`Tu es ${agents.formateur}, expert en ${f.domaine}. Reponds UNIQUEMENT en ${nom}. Pas de guillemets doubles.`, `Chapitre ${i + 1} - Exercices pratiques en ${nom} pour: ${titre}. 3 exercices etape par etape.`, 600),
      appel_claude(`Tu es un evaluateur Qualiopi. Reponds UNIQUEMENT en ${nom}. Pas de guillemets doubles.`, `Chapitre ${i + 1} pour: ${titre}. 5 questions QCM en ${nom}. Format: Q: / A: / B: / C: / D: / Reponse: / Explication:`, 500),
    ]);
    chapitres.push({
      numero: i + 1,
      titre: titre_ch,
      modules: [
        { numero: 1, type: "theorie", contenu: theorie || `Theorie chapitre ${i + 1}.`, duree: "2h" },
        { numero: 2, type: "pratique", contenu: pratique || `Pratique chapitre ${i + 1}.`, duree: "2h" },
        { numero: 3, type: "evaluation", contenu: evaluation || `Evaluation chapitre ${i + 1}.`, duree: "1h" },
      ],
    });
  }

  const [examen_blanc, bibliographie] = await Promise.all([
    appel_claude(`Tu es Jean, Agent Qualiopi. Reponds UNIQUEMENT en ${nom}. Pas de guillemets doubles.`, `Examen blanc 10 questions QCM en ${nom} pour: ${titre}. Format: Q: / A: / B: / C: / D: / Reponse: / Explication: Seuil: 70%`, 800),
    appel_claude(`Tu es ${agents.formateur}. Reponds UNIQUEMENT en ${nom}. Pas de guillemets doubles.`, `Bibliographie 8 references en ${nom} pour: ${titre}.`, 400),
  ]);

  return { langue, introduction: intro || `Bienvenue dans ${titre}.`, coaching: coaching || `Je suis la pour vous.`, chapitres, examen_blanc: examen_blanc || "", bibliographie: bibliographie || "" };
}

async function cam_generer_lms_complet(code_formation: string) {
  const { data: formations } = await supabase.from("formations").select("*").eq("code", code_formation).limit(1);
  if (!formations || formations.length === 0) return { succes: false, erreur: `Formation ${code_formation} introuvable` };

  const f = formations[0];
  const domaine = f.domaine || "Business";
  const agents = AGENTS_DOMAINE[domaine] || AGENTS_DOMAINE["Business"];
  const titre = (f.titre || code_formation).replace(/[^\w\s\-]/g, " ");

  const langues_contenu: any = {};
  for (const langue of LANGUES) {
    langues_contenu[langue] = await generer_contenu_langue(f, agents, langue);
  }

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
    langues: langues_contenu,
    meta: { nb_chapitres: 5, nb_modules: 15, nb_langues: 6, genere_par: "CAM v6 Multilingue", agents: [agents.formateur, agents.coach, "Jean Qualiopi"] },
  };

  const { data: existant } = await supabase.from("formations_lms").select("id").eq("formation_code", code_formation).limit(1);
  const payload = { formation_code: code_formation, contenu: contenu_final, examen_blanc: langues_contenu.fr?.examen_blanc || "" };

  let err;
  if (existant && existant.length > 0) {
    const r = await supabase.from("formations_lms").update(payload).eq("formation_code", code_formation);
    err = r.error;
  } else {
    const r = await supabase.from("formations_lms").insert(payload);
    err = r.error;
  }

  if (err) return { succes: false, erreur: err.message };
  return { succes: true, code: code_formation, titre, chapitres: 5, modules: 15, langues: 6, formateur: agents.formateur };
}

async function cam_statut() {
  const { data: formations } = await supabase.from("formations").select("code,titre,domaine,niveau").eq("actif", true).order("code");
  const { data: lms } = await supabase.from("formations_lms").select("formation_code,contenu");
  const lms_v6 = (lms || []).filter((x: any) => x.contenu?.v === "6").map((x: any) => x.formation_code);
  const lms_codes = (lms || []).map((x: any) => x.formation_code);
  const sans_v6 = (formations || []).filter((f: any) => !lms_v6.includes(f.code));
  return { total: formations?.length || 0, avec_lms_complet: lms_v6.length, avec_lms_minimal: lms_codes.length - lms_v6.length, sans_lms_complet: sans_v6.length, formations_sans_lms_complet: sans_v6.slice(0, 50) };
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
      const premiers = statut.formations_sans_lms_complet.slice(0, 1).map((f: any) => f.code);
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
