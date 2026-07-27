import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Certains fichiers sont doublement encodes : leurs octets UTF-8 ont ete
// relus comme du latin-1 puis re-encodes. On refait le chemin inverse.
function reparerEncodage(s: string): string {
  let t = String(s || "");
  let tours = 0;
  while (tours < 3 && /[\u00C3\u00C2\u00E2]/.test(t)) {
    let possible = true;
    const octets = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) {
      const c = t.charCodeAt(i);
      if (c > 255) { possible = false; break; }
      octets[i] = c;
    }
    if (!possible) break;
    let decode = "";
    try {
      decode = new TextDecoder("utf-8").decode(octets);
    } catch (e) {
      break;
    }
    if (!decode || decode === t) break;
    t = decode;
    tours++;
  }
  try { t = t.normalize("NFC"); } catch (e) {}
  return t;
}

function texteBrut(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[\uD800-\uDFFF]/g, "")
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
      return NextResponse.json({ ok: false, version: 3, erreur: "code manquant" }, { status: 400 });
    }

    const { data } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    if (!data) {
      return NextResponse.json({ ok: true, version: 3, code: code, disponible: false });
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
      version: 3,
      code: code,
      disponible: true,
      apercu: apercu,
      modules: modules,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, version: 3, erreur: String(e) }, { status: 500 });
  }
}
