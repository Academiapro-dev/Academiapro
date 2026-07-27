import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function reparerEncodage(s: string): string {
  let t = String(s || "");
  if (!/[\u00C3\u00C2\u00E2]/.test(t)) return t;
  t = t.replace(/[^\u0000-\u00FF]/g, "");
  const octets = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) {
    octets[i] = t.charCodeAt(i) & 0xff;
  }
  let decode = t;
  try {
    decode = new TextDecoder("utf-8").decode(octets);
  } catch (e) {
    return t;
  }
  try { decode = decode.normalize("NFC"); } catch (e) {}
  return decode;
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

function sansPrix(t: string): string {
  return String(t || "")
    .replace(/(Tarif|Prix)\s*:?\s*[^|.]{0,40}(euros?|EUR|\u20AC)/gi, " ")
    .replace(/\d[\d\s]{2,}(euros?|EUR|\u20AC)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sansCertification(t: string): string {
  return String(t || "")
    .replace(/Certification\s*:?[^|]{0,60}(\||$)/gi, " ")
    .replace(/\bRS\s+[A-Z\u00C0-\u00DC][\w\u00C0-\u00FF-]{2,30}/g, " ")
    .replace(/\bcertifi\u00E9\s+RS\b/gi, " ")
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
  for (let i = 0; i < bornes.length; i++) {
    const p = t.indexOf(bornes[i]);
    if (p > 60 && p < fin) fin = p;
  }
  return t.slice(0, Math.min(fin, 1200)).trim();
}

export async function GET(req: Request) {
  try {
    const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, version: 5, erreur: "code manquant" }, { status: 400 });
    }

    const { data } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    if (!data) {
      return NextResponse.json({ ok: true, version: 5, code: code, disponible: false });
    }

    const source = (await data.text()).slice(0, 150000);
    const brut = sansCertification(sansPrix(texteBrut(reparerEncodage(source))));
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
      version: 5,
      code: code,
      disponible: true,
      apercu: apercu,
      modules: modules,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, version: 5, erreur: String(e) }, { status: 500 });
  }
}
