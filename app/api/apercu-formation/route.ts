import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Table de correspondance directe : aucune logique d encodage, aucun echec possible.
const REMPLACEMENTS: [string, string][] = [
  // Accents COMBINANTS mal decodes : l accent est separe de sa lettre.
  ["\u00CC\u0081", "\u0301"], ["\u00CC\u0080", "\u0300"], ["\u00CC\u0082", "\u0302"],
  ["\u00CC\u0083", "\u0303"], ["\u00CC\u0088", "\u0308"], ["\u00CC\u00A7", "\u0327"],
  // Accents COMPOSES mal decodes, au cas ou les deux formes coexistent.
  ["\u00C3\u00A9", "\u00E9"], ["\u00C3\u00A8", "\u00E8"], ["\u00C3\u00AA", "\u00EA"],
  ["\u00C3\u00AB", "\u00EB"], ["\u00C3\u00A0", "\u00E0"], ["\u00C3\u00A2", "\u00E2"],
  ["\u00C3\u00A4", "\u00E4"], ["\u00C3\u00AE", "\u00EE"], ["\u00C3\u00AF", "\u00EF"],
  ["\u00C3\u00B4", "\u00F4"], ["\u00C3\u00B6", "\u00F6"], ["\u00C3\u00B9", "\u00F9"],
  ["\u00C3\u00BB", "\u00FB"], ["\u00C3\u00BC", "\u00FC"], ["\u00C3\u00A7", "\u00E7"],
  ["\u00C3\u0089", "\u00C9"], ["\u00C3\u0088", "\u00C8"], ["\u00C3\u008A", "\u00CA"],
  ["\u00C3\u0080", "\u00C0"], ["\u00C3\u0082", "\u00C2"], ["\u00C3\u0087", "\u00C7"],
  ["\u00C3\u0094", "\u00D4"], ["\u00C3\u008E", "\u00CE"], ["\u00C3\u00B1", "\u00F1"],
  // Ponctuation typographique et residus.
  ["\u00E2\u0080\u0099", "'"], ["\u00E2\u0080\u0098", "'"],
  ["\u00E2\u0080\u009C", "\""], ["\u00E2\u0080\u009D", "\""],
  ["\u00E2\u0080\u0093", "-"], ["\u00E2\u0080\u0094", "-"],
  ["\u00E2\u0080\u00A6", "..."], ["\u00C2\u00A0", " "], ["\u00C2", ""],
];

function reparer(s: string): string {
  let t = String(s || "");
  for (const [abime, correct] of REMPLACEMENTS) {
    t = t.split(abime).join(correct);
  }
  // On recolle les accents combinants a leur lettre.
  try { t = t.normalize("NFC"); } catch (e) {}
  return t.replace(/[\u0080-\u009F]/g, "").trim();
}

function texteBrut(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// La duree est stockee en base sous forme de texte : "130h", "100 h".
function heuresDeLaBase(duree: any): number {
  const m = String(duree || "").match(/(\d{1,4})/);
  return m ? parseInt(m[1], 10) : 0;
}

export async function GET(req: Request) {
  try {
    const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, version: 10, erreur: "code manquant" }, { status: 400 });
    }

    // La base est la seule source de verite du commercial : titre, prix ET duree.
    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix, duree")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, version: 10, erreur: "formation introuvable" }, { status: 404 });
    }

    // LE PROGRAMME SE LIT DANS lms_plans, PAS DANS LE MANUEL HTML.
    //
    // La route grattait le manuel a coups d expression reguliere pour en tirer
    // une liste plate d intitules. Or lms_plans porte deja le plan structure et
    // exact — chapitres, modules, type — celui-la meme que sert le LMS. Trois
    // consequences : les fiches sans manuel genere n affichaient aucun
    // programme ; les intitules dependaient du formatage du document ; et deux
    // fiches du catalogue se ressemblaient faute de montrer ce qui les
    // distingue. Le manuel ne sert plus que de repli.
    const { data: plan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", code)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    const chapitres: any[] = [];
    let modules: string[] = [];

    if (plan && plan.length > 0) {
      const parNumero = new Map();

      for (const ligne of plan) {
        const num = Number(ligne.chapitre_num) || 1;
        if (!parNumero.has(num)) {
          parNumero.set(num, {
            numero: num,
            titre: reparer(ligne.chapitre_titre || ("Chapitre " + num)),
            modules: [],
          });
        }
        const bloc = parNumero.get(num);
        const intitule = reparer(ligne.module_titre || "");
        if (!intitule) continue;

        bloc.modules.push({
          numero:
