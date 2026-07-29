import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function reparerAccents(s: string): string {
  let t = String(s || "");
  t = t.replace(/([A-Za-z])\u00CC([\u0080-\u00BF])/g, function (tout, lettre, marque) {
    try {
      const combinant = String.fromCharCode(0x0300 + (marque.charCodeAt(0) - 0x80));
      return (lettre + combinant).normalize("NFC");
    } catch (e) {
      return lettre;
    }
  });
  t = t.replace(/\u00E2\u0080\u0094/g, "-").replace(/\u00E2\u0080\u0099/g, "'");
  t = t.replace(/[\u0080-\u009F]/g, "");
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
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const { data: fichiers } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    const supports = new Set((fichiers || []).map((f) => f.name));

    // LIMITE EXPLICITE INDISPENSABLE : sans elle, Supabase plafonne a 1 000 lignes
    // et la route croit a tort que des formations deja traitees n ont pas de plan.
    const { data: plans } = await supabase
      .from("lms_plans")
      .select("formation_code")
      .limit(50000);
    const dejaPlan = new Set((plans || []).map((p: any) => p.formation_code));

    // Seules les formations ACTIVES : inutile de produire un plan pour une fiche retiree.
    const { data: formations } = await supabase
      .from("formations")
      .select("code, titre")
      .eq("actif", true)
      .order("code", { ascending: true });

    const candidates = (formations || []).filter(
      (f: any) =>
        String(f.code || "").indexOf("SK") !== 0 &&
        supports.has(f.code + "_support_cours.html") &&
        !dejaPlan.has(f.code)
    );

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, termine: true, restants: 0 });
    }

    const fiche = candidates[0];

    // Garde-fou : on verifie une derniere fois, pour cette formation precise,
    // qu aucun plan n existe deja. Empeche toute boucle sur la meme fiche.
    const { data: dejaCelle } = await supabase
      .from("lms_plans")
      .select("formation_code")
      .eq("formation_code", fiche.code)
      .limit(1);

    if (dejaCelle && dejaCelle.length > 0) {
      return NextResponse.json({
        ok: true,
        code: fiche.code,
        ignore: true,
        nb_modules: 0,
        restants: candidates.length - 1,
      });
    }

    const { data: fichier } = await supabase.storage
      .from(BUCKET)
      .download(fiche.code + "_support_cours.html");

    if (!fichier) {
      return NextResponse.json({ ok: false, code: fiche.code, erreur: "support illisible" }, { status: 404 });
    }

    const brut = reparerAccents(texteBrut((await fichier.text()).slice(0, 150000)));

    const titres: string[] = [];
    const motif = /Module\s*(\d{1,2})\s*[:\-\u2013\u2014]?\s*([^()\u00B7|]{3,70}?)\s*\((\d{1,3})\s*h\)/g;
    let m;
    while ((m = motif.exec(brut)) !== null) {
      const t = m[2].replace(/\s+/g, " ").trim();
      if (t && titres.indexOf(t) < 0) titres.push(t);
      if (titres.length >= 20) break;
    }

    if (titres.length < 4) {
      await supabase.from("lms_plans").upsert(
        {
          formation_code: fiche.code,
          chapitre_num: 0,
          chapitre_titre: "PLAN ILLISIBLE",
          module_num: 0,
          module_titre: "seulement " + titres.length + " modules lisibles",
          type: "theorie",
        },
        { onConflict: "formation_code,chapitre_num,module_num", ignoreDuplicates: true }
      );
      return NextResponse.json({
        ok: true,
        code: fiche.code,
        ignore: true,
        nb_modules: 0,
        restants: candidates.length - 1,
      });
    }

    const titreFiche = reparerAccents(String(fiche.titre || ""));
    const lignes: any[] = [];

    for (let i = 0; i < titres.length; i++) {
      const chapitre = Math.floor(i / 4) + 1;
      const position = (i % 4) + 1;
      const dernier = position === 4 || i === titres.length - 1;
      lignes.push({
        formation_code: fiche.code,
        chapitre_num: chapitre,
        chapitre_titre: titreFiche + " - Partie " + chapitre,
        module_num: position,
        module_titre: titres[i],
        type: dernier ? "evaluation" : (position === 3 ? "pratique" : "theorie"),
      });
    }

    const { error } = await supabase
      .from("lms_plans")
      .upsert(lignes, { onConflict: "formation_code,chapitre_num,module_num", ignoreDuplicates: true });

    if (error) {
      return NextResponse.json({ ok: false, code: fiche.code, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      code: fiche.code,
      titre: titreFiche,
      nb_modules: lignes.length,
      restants: candidates.length - 1,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
