import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";
import { PDFDocument, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LARGEUR = 595.28;
const HAUTEUR = 841.89;
const MARGE = 60;
const UTILE = LARGEUR - MARGE * 2;
const BAS = 70;

const OR = rgb(0.784, 0.663, 0.431);
const NUIT = rgb(0.02, 0.02, 0.031);
const ENCRE = rgb(0.11, 0.11, 0.11);
const GRIS = rgb(0.45, 0.45, 0.45);
const CREME = rgb(0.98, 0.97, 0.94);

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
  return blocs.filter(function (b: any) { return b.texte.length > 2; });
}

function couper(texte: string, police: any, taille: number, largeur: number): string[] {
  const lignes: string[] = [];
  for (const paragraphe of String(texte).split("\n")) {
    const mots = paragraphe.split(/\s+/).filter(Boolean);
    let ligne = "";
    for (const mot of mots) {
      const essai = ligne ? ligne + " " + mot : mot;
      let l = 0;
      try { l = police.widthOfTextAtSize(essai, taille); } catch (e) { l = essai.length * taille * 0.5; }
      if (l > largeur && ligne) { lignes.push(ligne); ligne = mot; } else { ligne = essai; }
    }
    if (ligne) lignes.push(ligne);
  }
  return lignes;
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, duree")
      .eq("code", code)
      .maybeSingle();

    const { data: fichier } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    if (!fichier) {
      return NextResponse.json({ ok: false, code: code, erreur: "fichier source introuvable" }, { status: 404 });
    }

    const blocs = extraireBlocs(await fichier.text());
    const titre = latin1((fiche && fiche.titre) || code);

    // --- Corps du document, dans un premier livre ---
    const livre = await PDFDocument.create();
    const normal = await livre.embedFont("Times-Roman");
    const gras = await livre.embedFont("Times-Bold");
    const italique = await livre.embedFont("Times-Italic");

    let page = livre.addPage([LARGEUR, HAUTEUR]);
    let y = HAUTEUR - MARGE - 24;
    const pages: any[] = [page];
    const sommaire: any[] = [];

    function nouvellePage() {
      page = livre.addPage([LARGEUR, HAUTEUR]);
      pages.push(page);
      y = HAUTEUR - MARGE - 24;
    }

    function ecrire(lignes: string[], police: any, taille: number, interligne: number, couleur: any, avant: number, retrait: number) {
      y = y - avant;
      for (const l of lignes) {
        if (y < BAS + interligne) nouvellePage();
        page.drawText(l, { x: MARGE + retrait, y: y, size: taille, font: police, color: couleur });
        y = y - interligne;
      }
    }

    for (const b of blocs) {
      if (b.type === "h1") {
        if (pages.length > 1 || y < HAUTEUR - MARGE - 40) nouvellePage();
        page.drawRectangle({ x: 0, y: HAUTEUR - 150, width: LARGEUR, height: 90, color: NUIT });
        const lignes = couper(b.texte, gras, 20, UTILE);
        let yt = HAUTEUR - 100;
        for (const l of lignes) {
          page.drawText(l, { x: MARGE, y: yt, size: 20, font: gras, color: OR });
          yt = yt - 26;
        }
        sommaire.push({ titre: b.texte, page: pages.length });
        y = HAUTEUR - 190;
      } else if (b.type === "h2") {
        if (y < BAS + 70) nouvellePage();
        y = y - 16;
        page.drawRectangle({ x: MARGE - 8, y: y - 6, width: 4, height: 20, color: OR });
        ecrire(couper(b.texte, gras, 14, UTILE - 10), gras, 14, 19, ENCRE, 0, 6);
        y = y - 4;
      } else if (b.type === "h3") {
        ecrire(couper(b.texte, gras, 12, UTILE), gras, 12, 17, OR, 12, 0);
      } else if (b.type === "li") {
        ecrire(couper("- " + b.texte, normal, 11, UTILE - 16), normal, 11, 16, ENCRE, 2, 16);
      } else {
        ecrire(couper(b.texte, normal, 11, UTILE), normal, 11, 16.5, ENCRE, 7, 0);
      }
    }

    // --- Assemblage final : couverture + sommaire + corps ---
    const doc = await PDFDocument.create();
    const n2 = await doc.embedFont("Times-Roman");
    const g2 = await doc.embedFont("Times-Bold");
    const i2 = await doc.embedFont("Times-Italic");

    const couverture = doc.addPage([LARGEUR, HAUTEUR]);
    couverture.drawRectangle({ x: 0, y: 0, width: LARGEUR, height: HAUTEUR, color: NUIT });
    couverture.drawRectangle({ x: 0, y: HAUTEUR - 260, width: LARGEUR, height: 6, color: OR });
    couverture.drawText("AcademIA Pro", { x: MARGE, y: HAUTEUR - 220, size: 30, font: g2, color: OR });
    couverture.drawText("Manuel de formation", { x: MARGE, y: HAUTEUR - 300, size: 13, font: n2, color: CREME });

    let yc = HAUTEUR - 380;
    for (const l of couper(titre, g2, 26, UTILE)) {
      couverture.drawText(l, { x: MARGE, y: yc, size: 26, font: g2, color: CREME });
      yc = yc - 34;
    }

    const infos: string[] = [];
    if (fiche && fiche.code) infos.push("Code " + latin1(fiche.code));
    if (fiche && fiche.duree) infos.push(latin1(String(fiche.duree)));
    if (fiche && fiche.niveau) infos.push("Niveau " + latin1(String(fiche.niveau)));
    if (infos.length > 0) {
      couverture.drawText(infos.join("   -   "), { x: MARGE, y: yc - 24, size: 11, font: n2, color: OR });
    }

    const date = latin1(new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }));
    couverture.drawText("Edition du " + date, { x: MARGE, y: 130, size: 10, font: i2, color: GRIS });
    couverture.drawText("Document reserve a l apprenant", { x: MARGE, y: 108, size: 10, font: n2, color: GRIS });

    const parPage = 34;
    const nbSommaire = sommaire.length > 0 ? Math.ceil(sommaire.length / parPage) : 0;
    const decalage = 1 + nbSommaire;

    const pagesSommaire: any[] = [];
    for (let i = 0; i < nbSommaire; i++) pagesSommaire.push(doc.addPage([LARGEUR, HAUTEUR]));

    for (let i = 0; i < nbSommaire; i++) {
      const p = pagesSommaire[i];
      if (i === 0) {
        p.drawText("Table des matieres", { x: MARGE, y: HAUTEUR - 100, size: 20, font: g2, color: OR });
        p.drawRectangle({ x: MARGE, y: HAUTEUR - 116, width: 60, height: 2, color: OR });
      }
      let ys = HAUTEUR - (i === 0 ? 160 : 100);
      const debut = i * parPage;
      for (const s of sommaire.slice(debut, debut + parPage)) {
        const t = couper(s.titre, n2, 11, UTILE - 40)[0] || s.titre;
        p.drawText(t, { x: MARGE, y: ys, size: 11, font: n2, color: ENCRE });
        p.drawText(String(s.page + decalage), { x: LARGEUR - MARGE - 24, y: ys, size: 11, font: n2, color: GRIS });
        ys = ys - 19;
      }
    }

    const copiees = await doc.copyPages(livre, livre.getPageIndices());
    for (const p of copiees) doc.addPage(p);

    const toutes = doc.getPages();
    for (let i = 1; i < toutes.length; i++) {
      toutes[i].drawText(latin1(titre).slice(0, 70), { x: MARGE, y: HAUTEUR - 40, size: 8, font: i2, color: GRIS });
      toutes[i].drawRectangle({ x: MARGE, y: HAUTEUR - 48, width: UTILE, height: 0.5, color: rgb(0.85, 0.85, 0.85) });
      toutes[i].drawText(String(i + 1), { x: LARGEUR / 2 - 6, y: 36, size: 9, font: n2, color: GRIS });
    }

    const octets = await doc.save();
    const chemin = "manuels/" + code + "_manuel.pdf";

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(chemin, new Blob([octets], { type: "application/pdf" }), { upsert: true, cacheControl: "60" });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, code: code, erreur: ecriture.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      code: code,
      chemin: chemin,
      pages: toutes.length,
      chapitres: sommaire.length,
      octets: octets.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
