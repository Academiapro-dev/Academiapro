import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Reparation minimale : lms_plans sort de Postgres en UTF-8 propre. Cette
// fonction ne sert plus qu au repli sur le manuel HTML.
function reparer(s: string): string {
  return String(s || "")
    .split("\u00C3\u00A9").join("\u00E9")
    .split("\u00C3\u00A8").join("\u00E8")
    .split("\u00C3\u00AA").join("\u00EA")
    .split("\u00C3\u00A0").join("\u00E0")
    .split("\u00C3\u00A7").join("\u00E7")
    .split("\u00C3\u00B4").join("\u00F4")
    .split("\u00C2\u00A0").join(" ")
    .normalize("NFC")
    .replace(/[\u0080-\u009F]/g, "")
    .trim();
}

function texteBrut(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function heuresDeLaBase(duree: any): number {
  const m = String(duree || "").match(/(\d{1,4})/);
  return m ? parseInt(m[1], 10) : 0;
}

export async function GET(req: Request) {
  try {
    const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix, duree")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, erreur: "formation introuvable" }, { status: 404 });
    }

    // LE PROGRAMME SE LIT DANS lms_plans, PAS DANS LE MANUEL HTML.
    // La route grattait le manuel a coups d expression reguliere, alors que
    // lms_plans porte le plan exact que sert le LMS. Le manuel n est plus
    // qu un repli pour les formations sans plan construit.
    const { data: plan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", code)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    const parNumero: any = {};
    const ordre: number[] = [];
    let modules: string[] = [];

    for (const l of plan || []) {
      const intitule = String(l.module_titre || "").trim();
      if (!intitule) continue;

      const num = Number(l.chapitre_num) || 1;
      if (!parNumero[num]) {
        parNumero[num] = { numero: num, titre: String(l.chapitre_titre || "").trim(), modules: [] };
        ordre.push(num);
      }
      parNumero[num].modules.push({
        numero: Number(l.module_num) || parNumero[num].modules.length + 1,
        titre: intitule,
        type: l.type || "theorie",
      });
      modules.push(intitule);
    }

    ordre.sort(function (a, b) { return a - b; });
    const chapitres = ordre.map(function (n) { return parNumero[n]; });

    const { data: manuel } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    if (modules.length === 0 && manuel) {
      const brut = texteBrut((await manuel.text()).slice(0, 150000));
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
      version: 10,
      code: fiche.code,
      titre: fiche.titre,
      domaine: fiche.domaine,
      niveau: fiche.niveau,
      prix: fiche.prix,
      support_disponible: manuel ? true : false,
      pdf_pret: manuel ? true : false,
      nb_chapitres: chapitres.length,
      nb_modules: modules.length,
      heures_programme: heuresDeLaBase(fiche.duree),
      chapitres: chapitres,
      modules: modules,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
