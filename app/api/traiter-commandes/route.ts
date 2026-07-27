import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODELE = "claude-sonnet-4-6";
const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const SYSTEME =
  "Tu es un formateur expert de niveau universitaire. Tu rediges des manuels de formation professionnelle denses, " +
  "complets et de haute qualite academique, en francais. Tu n inventes aucune certification, aucun titre officiel " +
  "et aucun prix. Tu ne resumes jamais : tu developpes, tu illustres, tu approfondis.";

function consigne(partie: number, type: string): string {
  if (type === "evaluation") {
    if (partie === 1) return "PARTIE 1 sur 3 : 10 questions QCM, 4 options chacune, reponse correcte et explication detaillee d au moins 8 lignes.";
    if (partie === 2) return "PARTIE 2 sur 3 : 5 questions de cas pratique, enonce circonstancie et corrige complet d au moins 15 lignes.";
    return "PARTIE 3 sur 3 : 3 questions de reflexion professionnelle avec corrige argumente, grille d auto-evaluation, synthese des competences et ressources complementaires.";
  }
  if (type === "pratique") {
    if (partie === 1) return "PARTIE 1 sur 3 : au moins 6 exercices pratiques detailles, avec objectif, materiel, deroule minute par minute et points de vigilance.";
    if (partie === 2) return "PARTIE 2 sur 3 : au moins 6 exercices supplementaires et les scripts complets a lire pour guider une seance, mot a mot.";
    return "PARTIE 3 sur 3 : cas pratiques en situation reelle, protocoles adaptes a differents publics, fiches de suivi, erreurs frequentes et remedes.";
  }
  if (partie === 1) return "PARTIE 1 sur 3 : fondements du sujet, definitions, origines, cadre theorique, auteurs et recherches de reference, au moins 15 paragraphes denses.";
  if (partie === 2) return "PARTIE 2 sur 3 : mecanismes, modeles et distinctions fines, au moins 15 paragraphes denses avec encadres Points cles.";
  return "PARTIE 3 sur 3 : applications professionnelles, etudes de cas, limites et controverses, puis synthese, au moins 15 paragraphes denses.";
}

async function appeler(cle: string, invite: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": cle, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODELE, max_tokens: 4000, system: SYSTEME, messages: [{ role: "user", content: invite }] }),
  });
  if (!r.ok) throw new Error("Claude a repondu " + r.status);
  const rep = await r.json();
  return (rep.content || []).map(function (b: any) { return b && b.type === "text" ? b.text : ""; }).join("").trim();
}

function echapper(t: string): string {
  return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret") || "";
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ ok: false, erreur: "acces refuse" }, { status: 403 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) return NextResponse.json({ ok: false, erreur: "cle absente" }, { status: 500 });

    const { data: commandes } = await supabase
      .from("commandes_lemonsqueezy")
      .select("identifiant_ls, formation, email")
      .eq("manuel_statut", "a_generer")
      .order("id", { ascending: true })
      .limit(1);

    if (!commandes || commandes.length === 0) {
      return NextResponse.json({ ok: true, rien_a_faire: true });
    }

    const cmd = commandes[0];
    const code = String(cmd.formation || "").toUpperCase();

    const { data: fiche } = await supabase.from("formations").select("code, titre").eq("code", code).maybeSingle();
    const { data: plan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", code)
      .gt("chapitre_num", 0)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    if (!fiche || !plan || plan.length === 0) {
      await supabase.from("commandes_lemonsqueezy").update({ manuel_statut: "sans_plan" }).eq("identifiant_ls", cmd.identifiant_ls);
      return NextResponse.json({ ok: false, code: code, erreur: "aucun plan pour cette formation" });
    }

    const { data: cache } = await supabase
      .from("lms_cache")
      .select("cache_key, contenu")
      .eq("formation_code", code)
      .eq("langue", "fr");

    const contenus: any = {};
    for (const c of cache || []) contenus[c.cache_key] = c.contenu || "";

    const manquants = plan.filter(function (l: any) {
      const t = contenus[code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_fr"];
      return t === undefined || t.length < 30000;
    });

    // Il reste des modules : on en produit un et on s arrete la.
    if (manquants.length > 0) {
      const l = manquants[0];
      const base =
        "Formation: " + fiche.titre + "\n" +
        "Chapitre " + l.chapitre_num + ": " + l.chapitre_titre + "\n" +
        "Module " + l.module_num + ": " + l.module_titre + "\n" +
        "Type de module: " + l.type + "\n";

      let complet = "";
      for (let partie = 1; partie <= 3; partie++) {
        const fin = complet.length > 2500 ? complet.slice(complet.length - 2500) : complet;
        const invite =
          base + "\n" + consigne(partie, l.type) + "\n\n" +
          (partie > 1 ? "Voici la fin de ce qui precede, enchaine sans repeter :\n---\n" + fin + "\n---\n" : "") +
          "Ecris uniquement le contenu du manuel, sans preambule.";
        const morceau = await appeler(cle, invite);
        complet = complet ? complet + "\n\n" + morceau : morceau;
      }

      const cleCache = code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_fr";
      await supabase.from("lms_cache").delete().eq("cache_key", cleCache);
      await supabase.from("lms_cache").insert({
        cache_key: cleCache,
        formation_code: code,
        chapitre_num: l.chapitre_num,
        module_num: l.module_num,
        langue: "fr",
        contenu: complet,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        ok: true,
        code: code,
        produit: "ch" + l.chapitre_num + "/mod" + l.module_num,
        taille: complet.length,
        restants: manquants.length - 1,
      });
    }

    // Tous les modules sont la : on assemble et on livre.
    let corps = "";
    let chapitreCourant = -1;
    for (const l of plan) {
      if (l.chapitre_num !== chapitreCourant) {
        chapitreCourant = l.chapitre_num;
        corps += '<h1 class="chapitre">Chapitre ' + l.chapitre_num + " - " + echapper(l.chapitre_titre) + "</h1>\n";
      }
      corps += "<h2>Module " + l.module_num + " - " + echapper(l.module_titre) + "</h2>\n";
      const texte = contenus[code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_fr"] || "";
      corps += texte.split(/\n{2,}/).map(function (b: string) {
        const x = b.trim();
        if (!x) return "";
        if (x.indexOf("## ") === 0) return "<h3>" + echapper(x.slice(3)) + "</h3>";
        if (x.indexOf("# ") === 0) return "<h3>" + echapper(x.slice(2)) + "</h3>";
        return "<p>" + echapper(x).replace(/\n/g, "<br>") + "</p>";
      }).join("\n") + "\n";
    }

    const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
    const html =
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>' + echapper(fiche.titre) + "</title>\n" +
      "<style>body{font-family:Georgia,serif;max-width:900px;margin:0 auto;padding:40px;line-height:1.8;color:#1a1a1a}" +
      ".couverture{background:#0a0a0a;color:#fff;padding:60px 40px;text-align:center;margin:-40px -40px 40px}" +
      ".marque{color:#c8a96e;font-size:26px;font-weight:bold;letter-spacing:2px}" +
      "h1.chapitre{color:#c8a96e;border-bottom:2px solid #c8a96e;padding-bottom:8px;margin-top:50px}" +
      "h2{margin-top:32px}h3{color:#a07840}p{text-align:justify;margin:0 0 14px}" +
      "</style></head><body>\n" +
      '<div class="couverture"><div class="marque">AcademIA Pro</div><p>Manuel de formation</p><h1>' +
      echapper(fiche.titre) + "</h1><p>Edition du " + date + "</p></div>\n" +
      corps + "</body></html>";

    const chemin = "manuels/" + code + "_manuel.html";
    await supabase.storage.from(BUCKET).upload(chemin, new Blob([html], { type: "text/html" }), { upsert: true, cacheControl: "60" });

    const { data: lien } = await supabase.storage.from(BUCKET).createSignedUrl(chemin, 60 * 60 * 24 * 365);
    const adresse = (lien && lien.signedUrl) || "https://academiapro.fr/dashboard";

    if (cmd.email && process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "AcademIA Pro <bienvenue@academiapro.fr>",
          to: cmd.email,
          subject: "Votre manuel " + fiche.titre + " est pret",
          html:
            '<div style="font-family:Georgia,serif;line-height:1.7">' +
            '<h1 style="color:#c8a96e">Votre manuel est pret</h1>' +
            "<p>Le manuel complet de votre formation <strong>" + echapper(fiche.titre) + "</strong> vous attend.</p>" +
            '<p><a href="' + adresse + '">Telecharger mon manuel</a></p>' +
            '<p><a href="https://academiapro.fr/dashboard">Acceder a mon espace de formation</a></p>' +
            "<p>L equipe AcademIA Pro</p></div>",
        }),
      });
    }

    await supabase
      .from("commandes_lemonsqueezy")
      .update({ manuel_statut: "pret", manuel_url: chemin })
      .eq("identifiant_ls", cmd.identifiant_ls);

    return NextResponse.json({ ok: true, code: code, livre: true, taille: html.length, email: cmd.email });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
