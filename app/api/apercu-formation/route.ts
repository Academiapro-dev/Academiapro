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
  ["\u00C3\u00A9", "\u00E9"], ["\u00C3\u00A8", "\u00E8"], ["\u00C3\u00AA", "\u00EA"],
  ["\u00C3\u00AB", "\u00EB"], ["\u00C3\u00A0", "\u00E0"], ["\u00C3\u00A2", "\u00E2"],
  ["\u00C3\u00A4", "\u00E4"], ["\u00C3\u00AE", "\u00EE"], ["\u00C3\u00AF", "\u00EF"],
  ["\u00C3\u00B4", "\u00F4"], ["\u00C3\u00B6", "\u00F6"], ["\u00C3\u00B9", "\u00F9"],
  ["\u00C3\u00BB", "\u00FB"], ["\u00C3\u00BC", "\u00FC"], ["\u00C3\u00A7", "\u00E7"],
  ["\u00C3\u0089", "\u00C9"], ["\u00C3\u0088", "\u00C8"], ["\u00C3\u008A", "\u00CA"],
  ["\u00C3\u0080", "\u00C0"], ["\u00C3\u0082", "\u00C2"], ["\u00C3\u0087", "\u00C7"],
  ["\u00C3\u0094", "\u00D4"], ["\u00C3\u008E", "\u00CE"], ["\u00C3\u00B1", "\u00F1"],
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
  return t.trim();
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
      return NextResponse.json({ ok: false, version: 9, erreur: "code manquant" }, { status: 400 });
    }

    // La base est la seule source de verite du commercial : titre, prix ET duree.
    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix, duree")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, version: 9, erreur: "formation introuvable" }, { status: 404 });
    }

    const { data } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    let modules: string[] = [];

    if (data) {
      const brut = texteBrut((await data.text()).slice(0, 150000));
      const motif = /Module\s*(\d{1,2})\s*[:\-\u2013\u2014]?\s*([^()\u00B7|]{3,70}?)\s*\((\d{1,3})\s*h\)/g;
      let m;
      while ((m = motif.exec(brut)) !== null) {
        const ligne = reparer(m[2].replace(/\s+/g, " "));
        if (ligne && modules.indexOf(ligne) < 0) modules.push(ligne);
        if (modules.length >= 25) break;
      }
    }

    return NextResponse.json({
      ok: true,
      version: 9,
      code: fiche.code,
      titre: fiche.titre,
      domaine: fiche.domaine,
      niveau: fiche.niveau,
      prix: fiche.prix,
      support_disponible: data ? true : false,
      nb_modules: modules.length,
      heures_programme: heuresDeLaBase(fiche.duree),
      modules: modules,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, version: 9, erreur: String(e) }, { status: 500 });
  }
}
