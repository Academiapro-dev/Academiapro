import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; 
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const langue = (url.searchParams.get("langue") || "fr").trim();

    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data: plan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre")
      .eq("formation_code", code)
      .gt("chapitre_num", 0)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    if (!plan || plan.length === 0) {
      return NextResponse.json({ ok: false, code: code, erreur: "aucun plan" }, { status: 404 });
    }

    const { data: cache } = await supabase
      .from("lms_cache")
      .select("cache_key, contenu")
      .eq("formation_code", code)
      .eq("langue", langue);

    const parCle: any = {};
    for (const c of cache || []) parCle[c.cache_key] = String(c.contenu || "");

    let conformes = 0;
    let enCours = 0;
    let anciens = 0;

    const modules = plan.map(function (l: any) {
      const cible = "ch" + l.chapitre_num + "_mod" + l.module_num;
      const contenu = parCle[code + "_" + cible + "_" + langue] || "";

      const aQcm = contenu.indexOf("## QCM du module") >= 0;
      const aSynthese = contenu.indexOf("## Votre synthese personnelle") >= 0;
      const aNouvelleNorme = contenu.indexOf("## Fondements et cadre conceptuel") >= 0;

      let statut = "ancien";
      if (aQcm && aSynthese) statut = "conforme";
      else if (aNouvelleNorme) statut = "en_cours";

      if (statut === "conforme") conformes++;
      else if (statut === "en_cours") enCours++;
      else anciens++;

      return {
        cible: cible,
        titre: l.module_titre,
        statut: statut,
        conforme: statut === "conforme",
        reprendre: statut === "en_cours",
        caracteres: contenu.length,
      };
    });

    return NextResponse.json({
      ok: true,
      code: code,
      total: modules.length,
      conformes: conformes,
      en_cours: enCours,
      anciens: anciens,
      a_traiter: enCours + anciens,
      modules: modules,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
