import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ erreur: "code requis" }, { status: 400 });

    const { data: formations } = await supabase
      .from("formations").select("*").eq("code", code.toUpperCase()).limit(1);
    if (!formations || formations.length === 0)
      return NextResponse.json({ erreur: "Formation introuvable" }, { status: 404 });

    const f = formations[0];
    const base_url = process.env.NEXT_PUBLIC_SITE_URL || "https://academiapro.fr";

    // Appel Agent Architecte
    const r = await fetch(base_url + "/api/agent-architecte", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formation_code: f.code,
        formation_titre: f.titre,
        domaine: f.domaine || "Business",
        niveau: f.niveau || "Intermediaire",
        duree: f.duree || "200h",
      }),
    });

    if (!r.ok) return NextResponse.json({ erreur: "Agent Architecte indisponible" }, { status: 500 });
    const data = await r.json();
    if (!data.succes || !data.structure?.chapitres)
      return NextResponse.json({ erreur: "Structure invalide" }, { status: 500 });

    const chapitres = data.structure.chapitres;
    const contenu_final = {
      v: "7",
      code: f.code,
      titre: f.titre,
      domaine: f.domaine,
      formateur: data.expert,
      coach: "Isabelle Moreau",
      chapitres,
      meta: {
        nb_chapitres: chapitres.length,
        nb_modules: chapitres.reduce((acc: number, ch: any) => acc + (ch.modules?.length || 0), 0),
        genere_par: "CAM v7 + Agent Architecte",
        expert: data.expert,
        expert_titre: data.expert_titre,
      }
    };

    const { data: existant } = await supabase
      .from("formations_lms").select("id").eq("formation_code", f.code).limit(1);

    const payload = { formation_code: f.code, contenu: contenu_final, examen_blanc: "" };

    if (existant && existant.length > 0) {
      await supabase.from("formations_lms").update(payload).eq("formation_code", f.code);
    } else {
      await supabase.from("formations_lms").insert(payload);
    }

    return NextResponse.json({
      succes: true,
      code: f.code,
      titre: f.titre,
      expert: data.expert,
      nb_chapitres: chapitres.length,
      nb_modules: contenu_final.meta.nb_modules,
    });

  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}
