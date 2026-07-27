import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";
const LIMITE = 2000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Les fichiers ont ete generes avec des reglages d'encodage differents :
// certains sont doublement encodes, d'autres portent des accents combines.
function reparerEncodage(t: string): string {
  let s = String(t || "");
  if (s.indexOf("Ã") >= 0 || s.indexOf("â€") >= 0) {
    try {
      const octets = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) octets[i] = s.charCodeAt(i) & 0xff;
      s = new TextDecoder("utf-8").decode(octets);
    } catch (e) {}
  }
  try {
    s = s.normalize("NFC");
  } catch (e) {}
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

// Les supports portent des tarifs perimes : on les retire systematiquement.
function sansPrix(t: string): string {
  return String(t || "")
    .replace(/(Tarif|Prix)\s*:?\s*[^|.]{0,40}(euros?|EUR|€)/gi, " ")
    .replace(/\d[\d\s]{2,}(euros?|EUR|€)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
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

    // L'en-tete du document porte objectifs, prerequis et public cible.
    // On ne va JAMAIS chercher plus loin : au-dela commence le cours.
    const apercu = brut.slice(0, LIMITE);

    // Plan : uniquement les intitules suivis d'une duree, qui figurent
    // dans le sommaire. Les titres du corps du cours n'en portent pas.
    const modules: string[] = [];
    const motif = /([A-ZÀ-ÖØ-Þ][^·|()]{4,70}?)\s*\((\d{1,3})\s*h\)/g;
    let m;
    while ((m = motif.exec(brut)) !== null) {
      const titre = m[1].replace(/\s+/g, " ").trim();
      const heures = m[2];
      const ligne = titre + " (" + heures + " h)";
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
