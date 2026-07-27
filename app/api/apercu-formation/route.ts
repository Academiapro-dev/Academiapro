import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Reparation du double encodage, ecrite en codes numeriques pour ne pas
// dependre de l'encodage de ce fichier source. Sequences longues d'abord.
const CORRECTIONS: [string, string][] = [
  ["\u00E2\u0080\u0099", "\u2019"],
  ["\u00E2\u0080\u009C", "\u201C"],
  ["\u00E2\u0080\u009D", "\u201D"],
  ["\u00E2\u0080\u0093", "\u2013"],
  ["\u00E2\u0080\u0094", "\u2014"],
  ["\u00E2\u0080\u00A6", "\u2026"],
  ["\u00C3\u00A9", "\u00E9"],
  ["\u00C3\u00A8", "\u00E8"],
  ["\u00C3\u00AA", "\u00EA"],
  ["\u00C3\u00AB", "\u00EB"],
  ["\u00C3\u00A0", "\u00E0"],
  ["\u00C3\u00A2", "\u00E2"],
  ["\u00C3\u00A4", "\u00E4"],
  ["\u00C3\u00AE", "\u00EE"],
  ["\u00C3\u00AF", "\u00EF"],
  ["\u00C3\u00B4", "\u00F4"],
  ["\u00C3\u00B6", "\u00F6"],
  ["\u00C3\u00B9", "\u00F9"],
  ["\u00C3\u00BB", "\u00FB"],
  ["\u00C3\u00BC", "\u00FC"],
  ["\u00C3\u00A7", "\u00E7"],
  ["\u00C3\u0089", "\u00C9"],
  ["\u00C3\u0088", "\u00C8"],
  ["\u00C3\u0080", "\u00C0"],
  ["\u00C3\u0087", "\u00C7"],
  ["\u00C5\u0093", "oe"],
  ["\u00C2\u00B7", "\u00B7"],
  ["\u00C2\u00AB", "\u00AB"],
  ["\u00C2\u00BB", "\u00BB"],
  ["\u00C2\u00B0", "\u00B0"],
  ["\u00C2\u00A0", " "],
  ["\u00C2", " "],
];

function reparerEncodage(t: string): string {
  let s = String(t || "");
  for (const paire of CORRECTIONS) {
    s = s.split(paire[0]).join(paire[1]);
  }
  s = s.replace(/[\uD800-\uDFFF]/g, "");
  s = s.replace(/\u00F0[\u0080-\u00FF]{0,3}/g, "");
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
    .replace(/(Tarif|Prix)\s*:?\s*[^|.]{0,40}(euros?|EUR|\u20AC)/gi, " ")
    .replace(/\d[\d\s]{2,}(euros?|EUR|\u20AC)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function couperAvantLeCours(t: string): string {
  const bornes = [
    "Programme complet",
    "Programme detaille",
    "Programme d\u00E9taill\u00E9",
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

    const modules: string[] = [];
    const motif = /Module\s*(\d{1,2})\s*[:\-\u2013\u2014]?\s*([^()\u00B7|]{3,70}?)\s*\((\d{1,3})\s*h\)/g;
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
