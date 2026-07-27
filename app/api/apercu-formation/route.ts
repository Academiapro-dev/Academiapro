import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Table de correspondance du double encodage constate dans les fichiers.
const CORRECTIONS: [string, string][] = [
  ["â€™", "'"], ["â€œ", "\""], ["â€\u009d", "\""], ["â€“", "-"], ["â€”", "-"],
  ["â€¦", "..."], ["Ã©", "é"], ["Ã¨", "è"], ["Ãª", "ê"], ["Ã«", "ë"],
  ["Ã ", "à"], ["Ã¢", "â"], ["Ã¤", "ä"], ["Ã®", "î"], ["Ã¯", "ï"],
  ["Ã´", "ô"], ["Ã¶", "ö"], ["Ã¹", "ù"], ["Ã»", "û"], ["Ã¼", "ü"],
  ["Ã§", "ç"], ["Ã‰", "É"], ["Ãˆ", "È"], ["Ã€", "À"], ["Ã‡", "Ç"],
  ["Å“", "oe"], ["Â·", "·"], ["Â»", "»"], ["Â«", "«"], ["Â°", "°"],
  ["Â", " "],
];

function reparerEncodage(t: string): string {
  let s = String(t || "");
  for (const paire of CORRECTIONS) {
    s = s.split(paire[0]).join(paire[1]);
  }
  // Emojis et symboles residuels issus du mauvais encodage.
  s = s.replace(/[\uD800-\uDFFF]/g, "").replace(/ð[\u0080-\u00FF]{0,3}/g, "");
  try { s = s.normalize("NFC"); } catch (e) {}
  return s;
}

function texteBrut(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function sansPrix(t: string): string {
  return String(t || "")
    .replace(/(Tarif|Prix)\s*:?\s*[^|.]{0,40}(euros?|EUR|€)/gi, " ")
    .replace(/\d[\d\s]{2,}(euros?|EUR|€)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// On s'arrete des que le document entre dans le contenu.
function couperAvantLeCours(t: string): string {
  const bornes = [
    "Programme complet",
    "Programme detaille",
    "Programme détaillé",
    "Chapitre 1",
    "Module 1",
  ];
  let fin = t.length;
  for (const b of bornes) {
    const i = t.indexOf(b);
    if (i > 60 && i < fin) fin = i;
  }
  return t.slice(0, Math.min(fin, 1200)).trim();
}

export async function GET(req: Request) {
  try {
    const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    if (!data) {
      return NextResponse.json({ ok: true, code: code, disponible: false });
    }

    const brut = sansPrix(texteBrut(reparerEncodage((await data.text()).slice(0, 150000))));

    const apercu = couperAvantLeCours(brut);

    // Uniquement les intitules ancres sur « Module N » et suivis d'une duree.
    const modules: string[] = [];
    const motif = /Module\s*(\d{1,2})\s*[:\-–—]?\s*([^()·|]{3,70}?)\s*\((\d{1,3})\s*h\)/g;
    let m;
    while ((m = motif.exec(brut)) !== null) {
      const ligne = m[2].replace(/\s+/g, " ").trim() + " (" + m[3] + " h)";
      if (modules.indexOf(ligne) < 0) modules.push(ligne);
      if (modules.length >= 20) break;
    }

    return NextResponse.json({
      ok: true,
      code: code,
      disponible: true,
      apercu: apercu,
      modules: modules,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
