import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function latin1(t: string): string {
  return String(t || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
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
  const blocs: any[] = [];
  const motif = /<(h1|h2|h3|p)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = motif.exec(html)) !== null) {
    const brut = String(m[2]).replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
    const texte = latin1(decoderEntites(brut)).replace(/[ \t]+/g, " ").trim();
    if (texte) blocs.push({ type: m[1].toLowerCase(), texte: texte });
  }
  return blocs;
}

function couper(texte: string, police: any, taille: number, largeur: number): string[] {
  const lignes: string[] = [];
  const paragraphes = texte.split("\n");
  for (const paragraphe of paragraphes) {
    const mots = paragraphe.split(/\s+/).filter(Boolean);
    let ligne = "";
    for (const mot of mots) {
      const essai = ligne ? ligne + " " + mot : mot;
      let l = 0;
      try {
        l = police.widthOfTextAtSize(essai, taille);
      } catch (e) {
        l = essai.length * taille * 0.5;
      }
      if (l > largeur && ligne) {
        lignes.push(ligne);
        ligne = mot;
      } else {
        ligne = essai;
      }
    }
    lignes.push(ligne);
  }
  return lignes;
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data: fichier } = await supabase.storage
      .from(BUCKET)
      .download("manuels/" + code + "_manuel.html");

    if (!fichier) {
      return NextResponse.json({ ok: false, code: code, erreur: "manuel HTML introuvable" }, { status: 404 });
    }

    const html = await fichier.text();
    const blocs = extraireBlocs(html);

    if (blocs.length === 0) {
      return NextResponse.json({ ok: false, code: code, erreur: "aucun contenu lisible" }, { status: 422 });
    }

    const doc = await PDFDocument.create();
    const normal = await doc.embedFont(StandardFonts.TimesRoman);
    const gras = await doc.embedFont(StandardFonts.TimesBold);

    const LARGEUR = 595.28;
    const HAUTEUR = 841.89;
    const MARGE = 56;
    const UTILE = LARGEUR - MARGE * 2;
    const BAS = 60;

    const or = rgb(0.63, 0.51, 0.31);
    const encre = rgb(0.1, 0.1, 0.1);

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
        if (y < HAUTEUR - MARGE - 10) nouvellePage();
        ecrire(couper(b.texte, gras, 18, UTILE), gras, 18, 24, or, 0);
        y = y - 10;
      } else if (b.type === "h2") {
        ecrire(couper(b.texte, gras, 14, UTILE), gras, 14, 19, encre, 14);
        y = y - 4;
      } else if (b.type === "h3") {
        ecrire(couper(b.texte, gras, 12, UTILE), gras, 12, 17, or, 10);
      } else {
        ecrire(couper(b.texte, normal, 11, UTILE), normal, 11, 16, encre, 6);
      }
    }

    for (let i = 0; i < pages.length; i++) {
      pages[i].drawText(String(i + 1) + " / " + pages.length, {
        x: LARGEUR / 2 - 20,
        y: 30,
        size: 9,
        font: normal,
        color: rgb(0.55, 0.55, 0.55),
      });
    }

    const octets = await doc.save();
    const chemin = "manuels/" + code + "_manuel.pdf";

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(chemin, new Blob([octets], { type: "application/pdf" }), {
        upsert: true,
        cacheControl: "60",
      });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, code: code, erreur: ecriture.error.message }, { status: 500 });
    }

    const { data: lien } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(chemin, 60 * 60 * 24 * 7);

    const adresse = lien ? lien.signedUrl : null;

    return NextResponse.json({
      ok: true,
      code: code,
      chemin: chemin,
      pages: pages.length,
      octets: octets.length,
      apercu: adresse,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
