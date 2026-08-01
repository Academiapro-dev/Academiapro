import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";
const SITE = "https://academiapro.fr";

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

function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\x7E]/g, " ");
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.modele_id) {
      return NextResponse.json({ ok: false, erreur: "Modele non precise." }, { status: 400 });
    }

    const { data: modele } = await supabase
      .from("modeles_contrats")
      .select("*")
      .eq("id", b.modele_id)
      .maybeSingle();

    if (!modele) {
      return NextResponse.json({ ok: false, erreur: "Modele introuvable." }, { status: 404 });
    }

    const valeurs = b.valeurs && typeof b.valeurs === "object" ? b.valeurs : {};

    const signataire = String(valeurs.email || b.email || "").trim().toLowerCase();
    if (!signataire || signataire.indexOf("@") < 1) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez l adresse email du signataire." },
        { status: 400 }
      );
    }

    // Les champs non remplis restent visibles en clair : mieux vaut un blanc
    // apparent qu une mention silencieusement absente du contrat signe.
    const manquants: string[] = [];
    let corps = String(modele.corps || "");

    for (const champ of modele.champs || []) {
      const valeur = String(valeurs[champ.cle] || "").trim();
      if (!valeur) manquants.push(champ.libelle || champ.cle);
      corps = corps.split("{{" + champ.cle + "}}").join(valeur || "[ A COMPLETER ]");
    }

    if (b.forcer !== true && manquants.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Champs non renseignes : " + manquants.join(", ") + ".",
          manquants: manquants,
        },
        { status: 400 }
      );
    }

    const reference = "CTR-" + Date.now().toString().slice(-8);
    const aujourdhui = new Date().toLocaleDateString("fr-FR");

    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
    const vert = rgb(0.04, 0.24, 0.18);
    const noir = rgb(0.12, 0.12, 0.12);
    const gris = rgb(0.45, 0.45, 0.45);

    let page = pdf.addPage([595, 842]);
    let y = 790;

    function saut(besoin: number) {
      if (y - besoin < 80) {
        page = pdf.addPage([595, 842]);
        y = 790;
      }
    }

    function ecrire(texte: string, taille: number, police: any, couleur: any) {
      const mots = ascii(texte).split(" ");
      let ligne = "";
      const largeurMax = 495;
      for (const mot of mots) {
        const essai = ligne ? ligne + " " + mot : mot;
        if (police.widthOfTextAtSize(essai, taille) > largeurMax) {
          saut(taille + 6);
          page.drawText(ligne, { x: 50, y: y, size: taille, font: police, color: couleur });
          y = y - taille - 6;
          ligne = mot;
        } else {
          ligne = essai;
        }
      }
      if (ligne) {
        saut(taille + 6);
        page.drawText(ligne, { x: 50, y: y, size: taille, font: police, color: couleur });
        y = y - taille - 6;
      }
    }

    ecrire(modele.titre.toUpperCase(), 17, gras, vert);
    ecrire("Reference " + reference + " - etabli le " + aujourdhui, 9, normal, gris);
    y = y - 16;
    page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1.1, color: vert });
    y = y - 22;

    for (const brute of corps.split("\n")) {
      const l = brute.trim();
      if (!l) {
        y = y - 8;
        continue;
      }
      if (/^#{1,6}\s/.test(l)) {
        y = y - 8;
        ecrire(l.replace(/^#{1,6}\s+/, ""), 12, gras, vert);
        y = y - 3;
        continue;
      }
      ecrire(l, 10.5, normal, noir);
      y = y - 3;
    }

    y = y - 30;
    saut(120);
    ecrire("Fait en deux exemplaires, le " + aujourdhui + ".", 10.5, normal, noir);
    y = y - 34;

    saut(70);
    page.drawText(ascii("Pour AcadeMIA Pro LLC"), { x: 50, y: y, size: 10, font: gras, color: noir });
    page.drawText(ascii("Pour " + (valeurs.contrepartie || "la contrepartie")).slice(0, 46), {
      x: 320, y: y, size: 10, font: gras, color: noir,
    });
    y = y - 50;
    page.drawLine({ start: { x: 50, y: y }, end: { x: 260, y: y }, thickness: 0.7, color: gris });
    page.drawLine({ start: { x: 320, y: y }, end: { x: 540, y: y }, thickness: 0.7, color: gris });

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii(modele.titre + " - " + reference + " - page " + (i + 1) + "/" + pages.length),
        { x: 50, y: 36, size: 7.5, font: normal, color: gris }
      );
    }

    const octets = Buffer.from(await pdf.save());
    const empreinte = crypto.createHash("sha256").update(octets).digest("hex");

    const tenant = b.tenant_id ? String(b.tenant_id) : null;
    const chemin = (tenant || "editeur") + "/" + reference + ".pdf";

    // ARCHIVAGE IMMEDIAT. C est ce qui permet a la route de signature de
    // trouver le fichier deja en place : elle ne cherchera jamais a le
    // reconstruire, ce qu elle ne saurait pas faire pour un contrat.
    const { error: erreurDepot } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, octets, { contentType: "application/pdf", upsert: true });

    if (erreurDepot) {
      return NextResponse.json(
        { ok: false, erreur: "Archivage impossible : " + erreurDepot.message },
        { status: 500 }
      );
    }

    const { error: erreurDoc } = await supabase.from("organisme_documents").insert({
      tenant_id: tenant,
      type: "contrat",
      stagiaire_email: signataire,
      formation_code: null,
      reference: reference,
      pdf_chemin: chemin,
      pdf_sha256: empreinte,
      pdf_octets: octets.length,
      donnees: {
        modele: modele.code,
        titre: modele.titre,
        contrepartie: valeurs.contrepartie || null,
        valeurs: valeurs,
      },
    });

    if (erreurDoc) {
      return NextResponse.json({ ok: false, erreur: erreurDoc.message }, { status: 500 });
    }

    await supabase.from("coffre_documents").insert({
      tenant_id: tenant,
      categorie: modele.categorie || "partenariat",
      titre: modele.titre + (valeurs.contrepartie ? " - " + valeurs.contrepartie : ""),
      contrepartie: valeurs.contrepartie || signataire,
      reference: reference,
      chemin: chemin,
      empreinte_sha256: empreinte,
      octets: octets.length,
      signe: false,
      depose_par: session.email,
      notes: "Genere depuis le modele " + modele.code,
    });

    return NextResponse.json({
      ok: true,
      reference: reference,
      empreinte: empreinte,
      signataire: signataire,
      lien_signature: SITE + "/signature/" + reference,
      manquants: manquants,
      message:
        "Contrat " + reference + " genere et archive. Envoyez le lien de signature a "
        + signataire + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
