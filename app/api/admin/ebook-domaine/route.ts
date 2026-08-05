import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";
import { PDFDocument, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";
const MODELE = "claude-sonnet-4-6";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Les neuf domaines proposes sur /lead-magnets/ebook. Le slug sert de nom
// de fichier : ebook_<slug>.pdf. C est /api/ebook qui choisira le bon.
const DOMAINES: any = {
  "ia": { nom: "Intelligence artificielle", titre: "Guide Pratique de l Intelligence Artificielle" },
  "business": { nom: "Business et management", titre: "Guide Pratique du Management" },
  "marketing": { nom: "Marketing et vente", titre: "Guide Pratique du Marketing et de la Vente" },
  "bien-etre": { nom: "Bien-etre et developpement personnel", titre: "Guide Pratique du Bien-etre au Travail" },
  "securite": { nom: "Securite et prevention", titre: "Guide Pratique de la Prevention des Risques" },
  "finance": { nom: "Comptabilite et finance", titre: "Guide Pratique de la Gestion et des Chiffres" },
  "langues": { nom: "Langues", titre: "Guide Pratique de l Apprentissage des Langues" },
  "technique": { nom: "Technique et numerique", titre: "Guide Pratique des Outils Numeriques" },
};

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
    .replace(/[^\u0000-\u00FF]/g, "");
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

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const slug = (new URL(req.url).searchParams.get("domaine") || "").trim().toLowerCase();
    const d = DOMAINES[slug];
    if (!d) {
      return NextResponse.json(
        { ok: false, erreur: "domaine inconnu", disponibles: Object.keys(DOMAINES) },
        { status: 400 }
      );
    }

    const invite =
      "Tu rediges un guide gratuit offert par un organisme de formation francais, destine "
      + "a des professionnels qui envisagent de se former.\n\n"
      + "Domaine : " + d.nom + "\n"
      + "Titre : " + d.titre + "\n\n"
      + "Produis un guide structure en francais, d environ six chapitres, chacun "
      + "comportant deux a trois sections. Ecris du contenu reellement utile : des "
      + "reperes, des methodes, des erreurs courantes, des exemples concrets. Compte "
      + "environ quatre mille mots au total.\n\n"
      + "FORMAT EXACT, sans aucune balise ni Markdown :\n"
      + "Une ligne de chapitre commence par CHAPITRE: suivi du titre.\n"
      + "Une ligne de section commence par SECTION: suivi du titre.\n"
      + "Une ligne de liste commence par - suivi du texte.\n"
      + "Tout le reste est du paragraphe ordinaire, une ligne par paragraphe.\n\n"
      + "Regles imperatives :\n"
      + "- N invente aucune statistique, aucun chiffre d etude, aucun nom d entreprise cliente.\n"
      + "- N indique aucun prix et ne cite aucune formation par son code.\n"
      + "- Ne promets aucun resultat et ne mentionne aucune certification.\n"
      + "- Ne parle jamais de toi ni de la facon dont ce texte a ete produit.";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 8000,
        messages: [{ role: "user", content: invite }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return NextResponse.json(
        { ok: false, erreur: "Claude a repondu " + r.status + " : " + detail.slice(0, 200) },
        { status: 500 }
      );
    }

    const reponse = await r.json();
    const texte = (reponse.content || [])
      .map(function (b: any) { return b && b.type === "text" ? b.text : ""; })
      .join("\n")
      .trim();

    if (texte.length < 2000) {
      return NextResponse.json(
        { ok: false, erreur: "reponse trop courte (" + texte.length + " caracteres)" },
        { status: 500 }
      );
    }

    const blocs: any[] = [];
    for (const ligne of texte.split("\n")) {
      const brut = latin1(ligne).replace(/[ \t]+/g, " ").trim();
      if (!brut || brut.length < 3) continue;
      if (/^CHAPITRE\s*:/i.test(brut)) blocs.push({ type: "h1", texte: brut.replace(/^CHAPITRE\s*:/i, "").trim() });
      else if (/^SECTION\s*:/i.test(brut)) blocs.push({ type: "h2", texte: brut.replace(/^SECTION\s*:/i, "").trim() });
      else if (/^[-\u2022]\s+/.test(brut)) blocs.push({ type: "li", texte: brut.replace(/^[-\u2022]\s+/, "").trim() });
      else blocs.push({ type: "p", texte: brut });
    }

    const titre = latin1(d.titre);

    const livre = await PDFDocument.create();
    const normal = await livre.embedFont("Times-Roman");
    const gras = await livre.embedFont("Times-Bold");

    let page = livre.addPage([LARGEUR, HAUTEUR]);
    let y = HAUTEUR - MARGE - 26;
    const pages: any[] = [page];
    const sommaire: any[] = [];
    let numChapitre = 0;
    let numSection = 0;
    let premier = true;

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
        // Le premier chapitre reste sur la page deja ouverte : sinon elle
        // resterait vide au milieu du document.
        if (!premier) nouvellePage();
        premier = false;
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
      } else if (b.type === "li") {
        ecrire(couper("- " + b.texte, normal, 11, UTILE - 16), normal, 11, 16, ENCRE, 2, 16);
      } else {
        ecrire(couper(b.texte, normal, 11, UTILE), normal, 11, 16.5, ENCRE, 7, 0);
      }
    }

    const doc = await PDFDocument.create();
    const n2 = await doc.embedFont("Times-Roman");
    const g2 = await doc.embedFont("Times-Bold");

    const cv = doc.addPage([LARGEUR, HAUTEUR]);
    cv.drawText("AcadeMIA Pro", { x: MARGE, y: HAUTEUR - 232, size: 12, font: n2, color: GRIS });
    cv.drawRectangle({ x: MARGE, y: HAUTEUR - 244, width: UTILE, height: 2, color: OR });

    centrer(cv, "Guide gratuit", HAUTEUR - 330, n2, 17, ENCRE);

    let yt2 = HAUTEUR - 390;
    for (const l of couper(titre, g2, 28, UTILE)) {
      centrer(cv, l, yt2, g2, 28, OR);
      yt2 = yt2 - 36;
    }

    centrer(cv, latin1(d.nom), yt2 - 6, n2, 14, ENCRE);
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
    const sortie = "ebook_" + slug + ".pdf";

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(sortie, new Blob([octets], { type: "application/pdf" }), { upsert: true, cacheControl: "60" });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, erreur: ecriture.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      domaine: d.nom,
      fichier: sortie,
      pages: toutes.length,
      chapitres: sommaire.filter(function (s: any) { return s.niveau === 1; }).length,
      sections: sommaire.filter(function (s: any) { return s.niveau === 2; }).length,
      octets: octets.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
