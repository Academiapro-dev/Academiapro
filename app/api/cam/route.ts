// app/api/cam/route.ts — v5
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
 return texte.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").replace(/\\/g, " ").trim();
}

async function appel_claude(system: string, user: string, max_tokens = 500): Promise<string> {
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

async function cam_generer_lms(code_formation: string) {
 const { data: formations } = await supabase.from("formations").select("*").eq("code", code_formation).limit(1);
 if (!formations || formations.length === 0) return { succes: false, erreur: `Formation ${code_formation} introuvable` };

 const f = formations[0];
 const domaine = f.domaine || "Business";
 const agents = AGENTS_DOMAINE[domaine] || AGENTS_DOMAINE["Business"];
 const titre = (f.titre || code_formation).replace(/[^\w\s\-]/g, " ");

 const [intro, points, coaching, qcm] = await Promise.all([
   appel_claude(`Formateur ${agents.formateur} specialiste ${domaine}. 2 phrases max. Pas de guillemets.`, `Introduction formation: ${titre}`, 200),
   appel_claude(`Formateur ${agents.formateur}. Liste 5 competences en 5 lignes courtes. Pas de guillemets.`, `Competences formation: ${titre}`, 300),
   appel_claude(`Coach ${agents.coach}. 1 phrase motivation. Pas de guillemets.`, `Motivation pour: ${titre}`, 100),
   appel_claude(`Evaluateur Qualiopi. 2 questions courtes format Q:question R:reponse. Pas de guillemets.`, `Questions evaluation: ${titre}`, 200),
 ]);

 const contenu_final = {
   v: "5",
   code: code_formation,
   titre: titre,
   domaine: domaine,
   date: new Date().toISOString().split("T")[0],
   formateur: agents.formateur,
   coach: agents.coach,
   intro: intro || `Bienvenue dans la formation ${titre}.`,
   points: points || `Formation ${titre} - competences professionnelles.`,
   coaching: coaching || `Vous progresserez efficacement dans cette formation.`,
   qcm: qcm || `Q: Qu avez-vous appris ? R: Les fondamentaux de ${titre}.`,
 };

 const { data: existant } = await supabase.from("formations_lms").select("id").eq("formation_code", code_formation).limit(1);
 const payload = { formation_code: code_formation, contenu: contenu_final, examen_blanc: contenu_final.qcm };

 let err;
 if (existant && existant.length > 0) {
   const r = await supabase.from("formations_lms").update(payload).eq("formation_code", code_formation);
   err = r.error;
 } else {
   const r = await supabase.from("formations_lms").insert(payload);
   err = r.error;
 }

 if (err) return { succes: false, erreur: err.message };
 return { succes: true, code: code_formation, titre: titre, formateur: agents.formateur };
}

async function cam_statut() {
 const { data: formations } = await supabase.from("formations").select("code,titre,domaine,niveau").eq("actif", true).order("code");
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
     return NextResponse.json({ succes: resultats.filter((r: any) => r.succes).map((r: any) => r.code), echecs: resultats.filter((r: any) => !r.succes).map((r: any) => r.code) });
   }
   if (action === "batch10") {
     const statut = await cam_statut();
     const premiers = statut.formations_sans_lms.slice(0, 10).map((f: any) => f.code);
     const resultats = [];
     for (const c of premiers) resultats.push(await cam_generer_lms(c));
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
