import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";
import { PDFDocument, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";
const SOURCE = "ebook_guide_claude_ia_2026.html";
const SORTIE = "ebook_guide_claude_ia_2026.pdf";
const TITRE = "Guide Pratique Claude et IA Generative";
const SOUS_TITRE = "Edition 2026";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LARGEUR = 595.28;
const HAUTEUR = 841.89;
const MARGE = 62;
const UTILE = LARGEUR - MARGE * 2;
const BAS = 70;

const OR = rgb(0.706, 0.612, 0.365);
const ENCRE = rgb(0.13, 0.13, 0.13);
const GRIS = rgb(0.45, 0.45, 0.45);

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

function sansPrix(t: string): string {
  return String(t || "")
    .replace(/\d[\d\s]{1,6}\s*(EUR|euros?|\u20AC)/gi, " ")
    .replace(/(Tarif|Prix)\s*:?\s*[^|.]{0,30}/gi, " ");
}

function extraireBlocs(html: string): any[] {
  let t = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ");

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
    const brut = sansPrix(latin1(decoderEntites(ligne))).replace(/[ \t]+/g, " ").trim();
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

function centrer(page: any, texte: string, y: number, police: any, taille: number, couleur: any) {
  let l = 0;
  try { l = police.widthOfTextAtSize(texte, taille); } catch (e) { l = texte.length * taille * 0.5; }
  page.drawText(texte, { x: (LARGEUR - l) / 2, y: y, size: taille, font: police, color: couleur });
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const { data: fichier } = await supabase.storage.from(BUCKET).download(SOURCE);
    if (!fichier) {
      return NextResponse.json({ ok: false, erreur: "fichier source introuvable : " + SOURCE }, { status: 404 });
    }

    const blocs = extraireBlocs(await fichier.text());
    const titre = latin1(TITRE);

    const livre = await PDFDocument.create();
    const normal = await livre.embedFont("Times-Roman");
    const gras = await livre.embedFont("Times-Bold");

    let page = livre.addPage([LARGEUR, HAUTEUR]);
    let y = HAUTEUR - MARGE - 26;
    const pages: any[] = [page];
    const sommaire: any[] = [];
    let numChapitre = 0;
    let numSection = 0;

    function nouvellePage() {
      page = livre.addPage([LARGEUR, HAUTEUR]);
      pages.push(page);
      y = HAUTEUR - MARGE - 26;
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
        nouvellePage();
        numChapitre++;
        numSection = 0;
        const etiquette = String(numChapitre) + ". " + b.texte;
        page.drawRectangle({ x: MARGE, y: HAUTEUR - 132, width: UTILE, height: 1.5, color: OR });
        let yt = HAUTEUR - 118;
        for (const l of couper(etiquette, gras, 19, UTILE)) {
          page.drawText(l, { x: MARGE, y: yt, size: 19, font: gras, color: OR });
          yt = yt - 25;
        }
        sommaire.push({ niveau: 1, numero: String(numChapitre), titre: b.texte, page: pages.length });
        y = HAUTEUR - 180;
      } else if (b.type === "h2") {
        if (y < BAS + 80) nouvellePage();
        numSection++;
        const num = String(numChapitre || 1) + "." + String(numSection);
        y = y - 18;
        page.drawText(num, { x: MARGE, y: y, size: 13, font: gras, color: OR });
        const lignes = couper(b.texte, gras, 13, UTILE - 36);
        let ys = y;
        for (const l of lignes) {
          page.drawText(l, { x: MARGE + 34, y: ys, size: 13, font: gras, color: ENCRE });
          ys = ys - 18;
        }
        y = ys - 6;
        sommaire.push({ niveau: 2, numero: num, titre: b.texte, page: pages.length });
      } else if (b.type === "h3") {
        ecrire(couper(b.texte, gras, 11.5, UTILE), gras, 11.5, 16, OR, 12, 0);
      } else if (b.type === "li") {
        ecrire(couper("- " + b.texte, normal, 11, UTILE - 16), normal, 11, 16, ENCRE, 2, 16);
      } else {
        ecrire(couper(b.texte, normal, 11, UTILE), normal, 11, 16.5, ENCRE, 7, 0);
      }
    }

    const doc = await PDFDocument.create();
    const n2 = await doc.embedFont("Times-Roman");
    const g2 = await doc.embedFont("Times-Bold");

    // Couverture
    const cv = doc.addPage([LARGEUR, HAUTEUR]);
    cv.drawText("AcadeMIA Pro", { x: MARGE, y: HAUTEUR - 232, size: 12, font: n2, color: GRIS });
    cv.drawRectangle({ x: MARGE, y: HAUTEUR - 244, width: UTILE, height: 2, color: OR });

    centrer(cv, "Guide gratuit", HAUTEUR - 330, n2, 17, ENCRE);

    let yt2 = HAUTEUR - 390;
    for (const l of couper(titre, g2, 30, UTILE)) {
      centrer(cv, l, yt2, g2, 30, OR);
      yt2 = yt2 - 38;
    }

    centrer(cv, latin1(SOUS_TITRE), yt2 - 6, n2, 14, ENCRE);
    yt2 = yt2 - 30;

    cv.drawRectangle({ x: MARGE, y: yt2 - 40, width: UTILE, height: 2, color: OR });

    let yi = yt2 - 76;
    cv.drawText("AcadeMIA Pro - academiapro.fr", { x: MARGE, y: yi, size: 11, font: n2, color: ENCRE });
    yi = yi - 18;
    cv.drawText(
      String(sommaire.filter(function (s: any) { return s.niveau === 1; }).length) + " chapitres - " +
      String(sommaire.filter(function (s: any) { return s.niveau === 2; }).length) + " sections",
      { x: MARGE, y: yi, size: 11, font: n2, color: ENCRE }
    );

    const date = latin1(new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }));
    cv.drawText("Edition du " + date, { x: MARGE, y: 90, size: 10, font: n2, color: GRIS });

    // Table des matieres
    const parPage = 32;
    const nbSommaire = Math.max(1, Math.ceil(sommaire.length / parPage));
    const pagesSommaire: any[] = [];
    for (let i = 0; i < nbSommaire; i++) pagesSommaire.push(doc.addPage([LARGEUR, HAUTEUR]));
    const decalage = 1 + nbSommaire;

    for (let i = 0; i < nbSommaire; i++) {
      const p = pagesSommaire[i];
      let ys = HAUTEUR - 130;
      if (i === 0) {
        centrer(p, "Table des Matieres", HAUTEUR - 110, g2, 26, OR);
        p.drawRectangle({ x: MARGE, y: HAUTEUR - 126, width: UTILE, height: 1.5, color: OR });
        ys = HAUTEUR - 180;
      }
      for (const s of sommaire.slice(i * parPage, i * parPage + parPage)) {
        const numero = String(s.page + decalage);
        if (s.niveau === 1) {
          const t = couper(s.numero + ". " + s.titre, g2, 13, UTILE - 50)[0] || s.titre;
          p.drawText(t, { x: MARGE, y: ys, size: 13, font: g2, color: OR });
          p.drawText("p." + numero, { x: LARGEUR - MARGE - 34, y: ys, size: 12, font: g2, color: OR });
          ys = ys - 21;
        } else {
          const t = couper(s.numero + " " + s.titre, n2, 11, UTILE - 80)[0] || s.titre;
          p.drawText(t, { x: MARGE + 26, y: ys, size: 11, font: n2, color: ENCRE });
          p.drawText("p." + numero, { x: LARGEUR - MARGE - 34, y: ys, size: 10, font: n2, color: GRIS });
          ys = ys - 18;
        }
      }
    }

    const copiees = await doc.copyPages(livre, livre.getPageIndices());
    for (const p of copiees) doc.addPage(p);

    const toutes = doc.getPages();
    for (let i = decalage; i < toutes.length; i++) {
      toutes[i].drawText(titre.slice(0, 68), { x: MARGE, y: HAUTEUR - 44, size: 8, font: n2, color: GRIS });
      toutes[i].drawRectangle({ x: MARGE, y: HAUTEUR - 52, width: UTILE, height: 0.5, color: rgb(0.87, 0.87, 0.87) });
      centrer(toutes[i], String(i + 1), 40, n2, 9, GRIS);
    }

    const octets = await doc.save();

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(SORTIE, new Blob([octets], { type: "application/pdf" }), { upsert: true, cacheControl: "60" });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, erreur: ecriture.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      fichier: SORTIE,
      pages: toutes.length,
      chapitres: sommaire.filter(function (s: any) { return s.niveau === 1; }).length,
      sections: sommaire.filter(function (s: any) { return s.niveau === 2; }).length,
      octets: octets.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
