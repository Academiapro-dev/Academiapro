import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const MODELE = "claude-sonnet-4-6";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LANGUES: any = { fr: "francais", en: "English", es: "espanol", pt: "portugues", de: "Deutsch" };

function invitePour(titreFormation: string, chapitre: any, module: any, langue: string): string {
  const n = LANGUES[langue] || "francais";
  const entete =
    "Formation: " + titreFormation + "\n" +
    "Chapitre " + chapitre.numero + ": " + chapitre.titre + "\n" +
    "Module " + module.numero + ": " + module.titre + "\n" +
    "Langue: " + n + "\n";

  if (module.type === "pratique") {
    return "Tu es formateur expert pour AcadeMIA Pro.\nRedige un guide pratique COMPLET et DETAILLE.\n" + entete +
      "EXIGENCES: minimum 10 exercices pratiques etape par etape - scripts complets - fiches de suivi - cas pratiques reels - protocoles adaptes a differents publics - equivalent 15 pages - redige ENTIEREMENT en " + n +
      "\nN invente aucune certification, aucun titre officiel, aucun prix.";
  }
  if (module.type === "evaluation") {
    return "Tu es formateur expert pour AcadeMIA Pro.\nRedige une evaluation COMPLETE et RIGOUREUSE.\n" + entete +
      "EXIGENCES: 10 questions QCM avec 4 options, reponse correcte et explication detaillee - 3 questions de cas pratique avec corrige - 2 questions de reflexion professionnelle - ressources complementaires - redige ENTIEREMENT en " + n +
      "\nN invente aucune certification, aucun titre officiel, aucun prix.";
  }
  return "Tu es formateur expert pour AcadeMIA Pro.\nRedige un contenu theorique COMPLET et DETAILLE de niveau professionnel.\n" + entete +
    "EXIGENCES: minimum 15 paragraphes denses - niveau academique - cite auteurs et recherches - encadres Points cles et Applications pratiques - sous-titres clairs - equivalent 15 pages - redige ENTIEREMENT en " + n +
    "\nN invente aucune certification, aucun titre officiel, aucun prix.";
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const langue = (url.searchParams.get("langue") || "fr").trim();
    const combien = Math.min(Number(url.searchParams.get("combien") || 3), 4);

    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre")
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
      return NextResponse.json({ ok: false, code: code, erreur: "aucun plan" }, { status: 404 });
    }

    const { data: cache } = await supabase
      .from("lms_cache")
      .select("cache_key")
      .eq("formation_code", code)
      .eq("langue", langue);

    const dejaLa = new Set((cache || []).map((c: any) => c.cache_key));

    const aFaire = plan.filter(function (l: any) {
      return !dejaLa.has(code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_" + langue);
    });

    if (aFaire.length === 0) {
      return NextResponse.json({ ok: true, code: code, termine: true, restants: 0, total: plan.length });
    }

    const lot = aFaire.slice(0, combien);
    const produits: string[] = [];

    for (const l of lot) {
      const chapitre = { numero: l.chapitre_num, titre: l.chapitre_titre };
      const module = { numero: l.module_num, titre: l.module_titre, type: l.type };

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cle,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODELE,
          max_tokens: 4000,
          system: "Tu es un formateur expert de niveau universitaire. Tu rediges des manuels denses, complets et de haute qualite academique, entierement dans la langue demandee.",
          messages: [{ role: "user", content: invitePour(fiche.titre, chapitre, module, langue) }],
        }),
      });

      if (!r.ok) {
        return NextResponse.json(
          { ok: false, code: code, erreur: "Claude a repondu " + r.status, produits: produits },
          { status: 500 }
        );
      }

      const reponse = await r.json();
      const texte = (reponse.content || [])
        .map(function (b: any) { return b && b.type === "text" ? b.text : ""; })
        .join("")
        .trim();

      if (texte.length < 800) {
        return NextResponse.json(
          { ok: false, code: code, erreur: "contenu trop court sur ch" + l.chapitre_num + "/mod" + l.module_num },
          { status: 500 }
        );
      }

      await supabase.from("lms_cache").insert({
        cache_key: code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_" + langue,
        formation_code: code,
        chapitre_num: l.chapitre_num,
        module_num: l.module_num,
        langue: langue,
        contenu: texte,
        created_at: new Date().toISOString(),
      });

      produits.push("ch" + l.chapitre_num + "/mod" + l.module_num + " (" + texte.length + ")");
    }

    return NextResponse.json({
      ok: true,
      code: code,
      titre: fiche.titre,
      produits: produits,
      restants: aFaire.length - lot.length,
      total: plan.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
