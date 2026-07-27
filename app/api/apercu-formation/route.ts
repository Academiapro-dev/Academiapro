import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";
const LIMITE = 3500;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

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

function sansAccents(t: string): string {
  return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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

    const brut = sansPrix(texteBrut((await data.text()).slice(0, 120000)));
    const repere = sansAccents(brut);

    // On demarre a la premiere mention des objectifs, sinon au debut du document.
    let depart = repere.indexOf("objectif");
    if (depart < 0) depart = 0;

    const apercu = brut.slice(depart, depart + LIMITE);

    // Plan des modules : on ne donne que les intitules, jamais le contenu.
    const modules: string[] = [];
    const motif = /Module\s+\d+\s*[:\-–—]?\s*([^.;|]{4,90})/gi;
    let m;
    while ((m = motif.exec(brut)) !== null) {
      const titre = m[1].trim();
      if (titre && modules.indexOf(titre) < 0) modules.push(titre);
      if (modules.length >= 25) break;
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
