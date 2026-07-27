import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// NFC d'abord : les accents combines deviennent des caracteres simples et
// survivent a la reconstruction. On ne retire que les paires d'emojis.
function reparerEncodage(s: string): string {
  let t = String(s || "");
  try { t = t.normalize("NFC"); } catch (e) {}
  if (!/\u00C3[\u0080-\u00BF]/.test(t)) return t;
  t = t.replace(/[\uD800-\uDFFF]/g, "");
  if (/[^\u0000-\u00FF]/.test(t)) return t;
  const octets = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) {
    octets[i] = t.charCodeAt(i) & 0xff;
  }
  try {
    return new TextDecoder("utf-8").decode(octets).normalize("NFC");
  } catch (e) {
    return t;
  }
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

export async function GET(req: Request) {
  try {
    const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, version: 6, erreur: "code manquant" }, { status: 400 });
    }

    // L'accroche vient de la base, seule source de verite du commercial.
    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, version: 6, erreur: "formation introuvable" }, { status: 404 });
    }

    const { data } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    let modules: string[] = [];
    let heures = 0;

    if (data) {
      const brut = texteBrut(reparerEncodage((await data.text()).slice(0, 150000)));
      const motif = /Module\s*(\d{1,2})\s*[:\-\u2013\u2014]?\s*([^()\u00B7|]{3,70}?)\s*\((\d{1,3})\s*h\)/g;
      let m;
      while ((m = motif.exec(brut)) !== null) {
        const duree = parseInt(m[3], 10);
        const ligne = m[2].replace(/\s+/g, " ").trim() + " (" + duree + " h)";
        if (modules.indexOf(ligne) < 0) {
          modules.push(ligne);
          heures = heures + duree;
        }
        if (modules.length >= 25) break;
      }
    }

    return NextResponse.json({
      ok: true,
      version: 6,
      code: fiche.code,
      titre: fiche.titre,
      domaine: fiche.domaine,
      niveau: fiche.niveau,
      prix: fiche.prix,
      support_disponible: data ? true : false,
      nb_modules: modules.length,
      heures_programme: heures,
      modules: modules,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, version: 6, erreur: String(e) }, { status: 500 });
  }
}

