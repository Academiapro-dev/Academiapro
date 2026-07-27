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

function echapper(t: string): string {
  return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function enParagraphes(texte: string): string {
  return String(texte || "")
    .split(/\n{2,}/)
    .map(function (bloc) {
      const l = bloc.trim();
      if (!l) return "";
      if (l.indexOf("### ") === 0) return "<h3>" + echapper(l.slice(4)) + "</h3>";
      if (l.indexOf("## ") === 0) return "<h2>" + echapper(l.slice(3)) + "</h2>";
      if (l.indexOf("# ") === 0) return "<h2>" + echapper(l.slice(2)) + "</h2>";
      return "<p>" + echapper(l).replace(/\n/g, "<br>") + "</p>";
    })
    .join("\n");
}

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

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, erreur: "formation introuvable" }, { status: 404 });
    }

    const { data: plan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", code)
      .gt("chapitre_num", 0)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    if (!plan || plan.length === 0) {
      return NextResponse.json({ ok: false, code: code, erreur: "aucun plan pour cette formation" }, { status: 404 });
    }

    const { data: cache } = await supabase
      .from("lms_cache")
      .select("cache_key, contenu")
      .eq("formation_code", code)
      .eq("langue", langue);

    const contenus: any = {};
    for (const c of cache || []) contenus[c.cache_key] = c.contenu;

    let corps = "";
    let chapitreCourant = -1;
    let presents = 0;
    const manquants: string[] = [];

    for (const l of plan) {
      if (l.chapitre_num !== chapitreCourant) {
        chapitreCourant = l.chapitre_num;
        corps += '<h1 class="chapitre">Chapitre ' + l.chapitre_num + " - " + echapper(l.chapitre_titre) + "</h1>\n";
      }

      const cle = code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_" + langue;
      const texte = contenus[cle];

      corps += "<h2>Module " + l.module_num + " - " + echapper(l.module_titre) + "</h2>\n";

      if (texte) {
        corps += enParagraphes(texte) + "\n";
        presents++;
      } else {
        corps += '<p class="attente">Ce module est en cours de preparation.</p>\n';
        manquants.push("ch" + l.chapitre_num + "/mod" + l.module_num);
      }
    }

    if (presents === 0) {
      return NextResponse.json({
        ok: false,
        code: code,
        erreur: "aucun module genere pour cette formation",
        total_modules: plan.length,
      }, { status: 422 });
    }

    const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

    const html =
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">\n' +
      "<title>" + echapper(fiche.titre) + " - Manuel de formation</title>\n" +
      "<style>body{font-family:Georgia,serif;max-width:900px;margin:0 auto;padding:40px;color:#1a1a1a;line-height:1.8;}" +
      ".couverture{background:#0a0a0a;color:#fff;padding:60px 40px;text-align:center;margin:-40px -40px 40px;}" +
      ".couverture .marque{color:#c8a96e;font-size:26px;font-weight:bold;letter-spacing:2px;}" +
      "h1.chapitre{color:#c8a96e;border-bottom:2px solid #c8a96e;padding-bottom:8px;margin-top:50px;}" +
      "h2{color:#1a1a1a;margin-top:32px;}h3{color:#a07840;}" +
      "p{text-align:justify;margin:0 0 14px;}.attente{color:#888;font-style:italic;}" +
      ".pied{margin-top:60px;border-top:1px solid #ddd;padding-top:16px;font-size:12px;color:#888;text-align:center;}" +
      "</style></head><body>\n" +
      '<div class="couverture">' +
      '<div class="marque">AcademIA Pro</div>' +
      "<p>Manuel de formation</p>" +
      "<h1>" + echapper(fiche.titre) + "</h1>" +
      "<p>" + echapper(fiche.domaine || "") + " - " + echapper(fiche.niveau || "") + "</p>" +
      "<p>Edition du " + date + "</p>" +
      "</div>\n" +
      corps +
      '<div class="pied">AcademIA Pro - ' + echapper(fiche.titre) + " - " + date + " - contact@academiapro.fr</div>\n" +
      "</body></html>";

    const chemin = "manuels/" + code + "_manuel.html";

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(chemin, new Blob([html], { type: "text/html" }), { upsert: true, cacheControl: "60" });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, code: code, erreur: ecriture.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      code: code,
      titre: fiche.titre,
      chemin: chemin,
      total_modules: plan.length,
      modules_presents: presents,
      modules_manquants: manquants,
      taille: html.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
