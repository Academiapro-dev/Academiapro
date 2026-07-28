import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../lib/session";
import { PDFDocument, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODELE = "claude-sonnet-4-6";
const BUCKET = "formations-pdf";
const SEUIL_MANUEL = 100000;

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

function latin1(t: string): string {
  return String(t || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/([A-Za-z])\u00CC([\u0080-\u00BF])/g, "$1")
    .replace(/[^\u0000-\u00FF]/g, "");
}

function decoderEntites(t: string): string {
  return String(t || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extraireBlocs(html: string): any[] {
  let t = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ");

  t = t.replace(/Support de cours officiel/gi, "Manuel de formation");
  t = t.replace(/Document confidentiel/gi, "Document reserve a l apprenant");

  t = t.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n@@H1@@$1\n");
  t = t.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n@@H2@@$1\n");
  t = t.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n@@H3@@$1\n");
  t = t.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n@@H3@@$1\n");
  t = t.replace(/<li[^>]*>/gi, "\n@@LI@@");

  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/(p|div|tr|td|li|section|article|blockquote)>/gi, "\n");
  t = t.replace(/<[^>]+>/g, " ");

  const blocs: any[] = [];
  for (const ligne of t.split("\n")) {
    const brut = latin1(decoderEntites(ligne)).replace(/[ \t]+/g, " ").trim();
    if (!brut) continue;
    if (brut.indexOf("@@H1@@") === 0) blocs.push({ type: "h1", texte: brut.slice(6).trim() });
    else if (brut.indexOf("@@H2@@") === 0) blocs.push({ type: "h2", texte: brut.slice(6).trim() });
    else if (brut.indexOf("@@H3@@") === 0) blocs.push({ type: "h3", texte: brut.slice(6).trim() });
    else if (brut.indexOf("@@LI@@") === 0) blocs.push({ type: "li", texte: brut.slice(6).trim() });
    else blocs.push({ type: "p", texte: brut });
  }
  return blocs.filter(function (b: any) { return b.texte.length > 0; });
}

function couper(texte: string, police: any, taille: number, largeur: number): string[] {
  const lignes: string[] = [];
  for (const paragraphe of texte.split("\n")) {
    const mots = paragraphe.split(/\s+/).filter(Boolean);
    let ligne = "";
    for (const mot of mots) {
      const essai = ligne ? ligne + " " + mot : mot;
      let l = 0;
      try { l = police.widthOfTextAtSize(essai, taille); } catch (e) { l = essai.length * taille * 0.5; }
      if (l > largeur && ligne) { lignes.push(ligne); ligne = mot; } else { ligne = essai; }
    }
    lignes.push(ligne);
  }
  return lignes;
}

async function composerPdf(html: string, titre: string): Promise<Uint8Array> {
  const blocs = extraireBlocs(html);
  const doc = await PDFDocument.create();
  const normal = await doc.embedFont("Times-Roman");
  const gras = await doc.embedFont("Times-Bold");

  const LARGEUR = 595.28;
  const HAUTEUR = 841.89;
  const MARGE = 56;
  const UTILE = LARGEUR - MARGE * 2;
  const BAS = 60;

  const or = rgb(0.63, 0.51, 0.31);
  const encre = rgb(0.1, 0.1, 0.1);
  const gris = rgb(0.45, 0.45, 0.45);

  const titrePropre = latin1(String(titre || ""));
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  // Page de couverture
  const couverture = doc.addPage([LARGEUR, HAUTEUR]);
  couverture.drawText("AcademIA Pro", { x: MARGE, y: HAUTEUR - 200, size: 30, font: gras, color: or });
  couverture.drawText("Manuel de formation", { x: MARGE, y: HAUTEUR - 250, size: 15, font: normal, color: gris });

  let yc = HAUTEUR - 340;
  for (const l of couper(titrePropre, gras, 24, UTILE)) {
    couverture.drawText(l, { x: MARGE, y: yc, size: 24, font: gras, color: encre });
    yc = yc - 32;
  }

  couverture.drawText("Edition du " + latin1(date), { x: MARGE, y: yc - 20, size: 11, font: normal, color: gris });
  couverture.drawText("Document reserve a l apprenant", { x: MARGE, y: 90, size: 10, font: normal, color: gris });

  let page = doc.addPage([LARGEUR, HAUTEUR]);
  let y = HAUTEUR - MARGE;
  const pages: any[] = [page];

  function nouvellePage() {
    page = doc.addPage([LARGEUR, HAUTEUR]);
    pages.push(page);
    y = HAUTEUR - MARGE;
  }

  function ecrire(lignes: string[], police: any, taille: number, interligne: number, couleur: any, avant: number) {
    y = y - avant;
    for (const l of lignes) {
      if (y < BAS + interligne) nouvellePage();
      page.drawText(l, { x: MARGE, y: y, size: taille, font: police, color: couleur });
      y = y - interligne;
    }
  }

  for (const b of blocs) {
    if (b.type === "h1") {
      ecrire(couper(b.texte, gras, 17, UTILE), gras, 17, 23, or, 18);
      y = y - 6;
    } else if (b.type === "h2") {
      ecrire(couper(b.texte, gras, 14, UTILE), gras, 14, 19, encre, 14);
      y = y - 4;
    } else if (b.type === "h3") {
      ecrire(couper(b.texte, gras, 12, UTILE), gras, 12, 17, or, 10);
    } else if (b.type === "li") {
      ecrire(couper("- " + b.texte, normal, 11, UTILE), normal, 11, 16, encre, 2);
    } else {
      ecrire(couper(b.texte, normal, 11, UTILE), normal, 11, 16, encre, 6);
    }
  }

  for (let i = 0; i < pages.length; i++) {
    pages[i].drawText(String(i + 1) + " / " + pages.length, {
      x: LARGEUR / 2 - 20, y: 30, size: 9, font: normal, color: rgb(0.55, 0.55, 0.55),
    });
  }

  return await doc.save();
}

async function livrer(code: string, titre: string, html: string, email: string, identifiant: string) {
  const octets = await composerPdf(html, titre);
  const chemin = "manuels/" + code + "_manuel.pdf";

  await supabase.storage
    .from(BUCKET)
    .upload(chemin, new Blob([octets], { type: "application/pdf" }), { upsert: true, cacheControl: "60" });

  const { data: lien } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(chemin, 60 * 60 * 24 * 365);

  const adresse = (lien && lien.signedUrl) || "https://academiapro.fr/dashboard";

  if (email && process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "AcademIA Pro <bienvenue@academiapro.fr>",
        to: email,
        subject: "Votre manuel " + titre + " est pret",
        html:
          '<div style="font-family:Georgia,serif;line-height:1.7">' +
          '<h1 style="color:#c8a96e">Votre manuel est pret</h1>' +
          "<p>Le manuel complet de votre formation <strong>" + echapper(titre) + "</strong> vous attend au format PDF.</p>" +
          '<p><a href="' + adresse + '">Telecharger mon manuel</a></p>' +
          '<p><a href="https://academiapro.fr/dashboard">Acceder a mon espace de formation</a></p>' +
          "<p>L equipe AcademIA Pro</p></div>",
      }),
    });
  }

  await supabase
    .from("commandes_lemonsqueezy")
    .update({ manuel_statut: "pret", manuel_url: chemin })
    .eq("identifiant_ls", identifiant);

  return octets.length;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret") || "";
    const entete = req.headers.get("authorization") || "";
    const admin = emailDeSession() === "contact@academiapro.fr";
    const parSecret = process.env.CRON_SECRET
      ? (secret === process.env.CRON_SECRET || entete === "Bearer " + process.env.CRON_SECRET)
      : false;

    if (!admin && !parSecret) {
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
    if (!fiche) {
      await supabase.from("commandes_lemonsqueezy").update({ manuel_statut: "sans_fiche" }).eq("identifiant_ls", cmd.identifiant_ls);
      return NextResponse.json({ ok: false, code: code, erreur: "formation introuvable" });
    }

    const { data: existant } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    if (existant) {
      const html = await existant.text();
      if (html.length >= SEUIL_MANUEL) {
        const poids = await livrer(code, fiche.titre, html, cmd.email, cmd.identifiant_ls);
        return NextResponse.json({ ok: true, code: code, voie: "manuel existant", source: html.length, octets: poids, livre: true });
      }
    }

    const { data: plan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", code)
      .gt("chapitre_num", 0)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    if (!plan || plan.length === 0) {
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
        voie: "generation",
        produit: "ch" + l.chapitre_num + "/mod" + l.module_num,
        taille: complet.length,
        restants: manquants.length - 1,
      });
    }

    let corps = "";
    let chapitreCourant = -1;
    for (const l of plan) {
      if (l.chapitre_num !== chapitreCourant) {
        chapitreCourant = l.chapitre_num;
        corps += "<h1>Chapitre " + l.chapitre_num + " - " + echapper(l.chapitre_titre) + "</h1>\n";
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

    const html = "<html><body>" + corps + "</body></html>";
    const poids = await livrer(code, fiche.titre, html, cmd.email, cmd.identifiant_ls);

    return NextResponse.json({ ok: true, code: code, voie: "assemblage", octets: poids, livre: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
