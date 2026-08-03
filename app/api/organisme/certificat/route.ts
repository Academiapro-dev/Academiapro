import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

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

function dateFr(v: any): string {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  } catch (e) {
    return String(v);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const reference = String(new URL(req.url).searchParams.get("reference") || "").trim();
    if (!reference) {
      return NextResponse.json({ ok: false, erreur: "Document non precise." }, { status: 400 });
    }

    const { data: sig } = await supabase
      .from("organisme_signatures")
      .select("*")
      .eq("document_reference", reference)
      .eq("annulee", false)
      .order("signe_le", { ascending: true })
      .limit(20);

    if (!sig || sig.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucune signature enregistree pour ce document." },
        { status: 404 }
      );
    }

    const { data: doc } = await supabase
      .from("organisme_documents")
      .select("tenant_id, type, donnees, pdf_sha256, pdf_octets")
      .eq("reference", reference)
      .maybeSingle();

    // Le certificat revient au signataire, a l organisme concerne, ou a
    // l administrateur. Personne d autre.
    const estAdmin = ADMINS.indexOf(session.email) >= 0;
    const estSignataire = sig.some(function (s: any) {
      return s.signataire_email === session.email;
    });
    const estLOrganisme = doc && session.tenantId && session.tenantId === doc.tenant_id;

    if (!estAdmin && !estSignataire && !estLOrganisme) {
      return NextResponse.json(
        { ok: false, erreur: "Ce document ne vous concerne pas." },
        { status: 403 }
      );
    }

    const donnees = doc && doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
    const titre = donnees.titre || "Document " + reference;
    const contrepartie = donnees.contrepartie || null;

    let expediteur = "AcadeMIA Pro LLC";
    if (doc && doc.tenant_id) {
      const { data: org } = await supabase
        .from("organismes_formation")
        .select("raison_sociale")
        .eq("tenant_id", doc.tenant_id)
        .maybeSingle();
      if (org && org.raison_sociale) expediteur = org.raison_sociale;
    }

    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
    const mono = await pdf.embedFont(StandardFonts.Courier);

    const vert = rgb(0.04, 0.24, 0.18);
    const noir = rgb(0.12, 0.12, 0.12);
    const gris = rgb(0.45, 0.45, 0.45);

    let page = pdf.addPage([595, 842]);
    let y = 790;

    function saut(besoin: number) {
      if (y - besoin < 70) {
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

    // Une ligne de fiche : libelle a gauche, valeur a droite.
    function champ(libelle: string, valeur: string) {
      saut(20);
      page.drawText(ascii(libelle), { x: 50, y: y, size: 9.5, font: normal, color: gris });
      page.drawText(ascii(valeur).slice(0, 62), {
        x: 210, y: y, size: 10.5, font: gras, color: noir,
      });
      y = y - 20;
    }

    // Une empreinte : longue, coupee en deux lignes lisibles.
    function empreinte(libelle: string, valeur: string) {
      if (!valeur) return;
      saut(34);
      page.drawText(ascii(libelle), { x: 50, y: y, size: 9.5, font: normal, color: gris });
      y = y - 14;
      const moitie = Math.ceil(valeur.length / 2);
      page.drawText(valeur.slice(0, moitie), { x: 50, y: y, size: 8.5, font: mono, color: noir });
      y = y - 12;
      page.drawText(valeur.slice(moitie), { x: 50, y: y, size: 8.5, font: mono, color: noir });
      y = y - 18;
    }

    function trait() {
      saut(16);
      page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 0.6, color: rgb(0.82, 0.82, 0.82) });
      y = y - 18;
    }

    ecrire("CERTIFICAT DE SIGNATURE ELECTRONIQUE", 16, gras, vert);
    ecrire("Etabli le " + dateFr(new Date().toISOString()) + " par " + expediteur, 9, normal, gris);
    y = y - 14;
    page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1.1, color: vert });
    y = y - 26;

    ecrire("Le document", 12, gras, vert);
    y = y - 4;
    champ("Intitule", titre);
    champ("Reference", reference);
    if (contrepartie) champ("Contrepartie", contrepartie);
    if (doc && doc.pdf_octets) champ("Taille du fichier", String(doc.pdf_octets) + " octets");
    empreinte("Empreinte SHA-256 du document", String((doc && doc.pdf_sha256) || sig[0].empreinte_sha256 || ""));

    y = y - 6;
    trait();

    ecrire(sig.length > 1 ? "Les signataires" : "Le signataire", 12, gras, vert);
    y = y - 4;

    for (let i = 0; i < sig.length; i = i + 1) {
      const s = sig[i];

      if (sig.length > 1) {
        saut(20);
        page.drawText(ascii("Signature " + (i + 1) + " sur " + sig.length), {
          x: 50, y: y, size: 10, font: gras, color: vert,
        });
        y = y - 20;
      }

      champ("Nom et prenom", s.signataire_nom || "-");
      champ("Qualite", s.signataire_qualite || "-");
      champ("Adresse electronique", s.signataire_email || "-");
      champ("Signe le", dateFr(s.signe_le));
      champ("Adresse de connexion", s.adresse_ip || "-");

      if (s.ouvert_le) champ("Document ouvert le", dateFr(s.ouvert_le));
      if (s.code_envoye_le) champ("Code envoye le", dateFr(s.code_envoye_le));
      if (s.code_verifie_le) champ("Code verifie le", dateFr(s.code_verifie_le));

      champ(
        "Identite verifiee",
        s.code_verifie_le ? "Oui, par code adresse a son email" : "Non"
      );

      y = y - 6;
    }

    trait();

    ecrire("Le consentement recueilli", 12, gras, vert);
    y = y - 4;
    ecrire(sig[0].texte_accepte || sig[0].consentement || "-", 10, normal, noir);

    y = y - 10;
    trait();

    ecrire("L integrite de la preuve", 12, gras, vert);
    y = y - 4;
    ecrire(
      "Chaque signature est scellee par un code d authentification calcule sur ses propres "
      + "elements, et reliee a la precedente : toute modification ulterieure, meme d un seul "
      + "caractere, rompt la chaine et devient detectable.",
      10, normal, noir
    );
    y = y - 8;
    empreinte("Empreinte de chainage", String(sig[sig.length - 1].empreinte_chaine || ""));
    empreinte("Empreinte precedente", String(sig[sig.length - 1].empreinte_precedente || ""));

    y = y - 6;
    trait();

    ecrire(
      "Signature electronique simple au sens du reglement (UE) n 910/2014 dit eIDAS. "
      + "Elle n est ni avancee ni qualifiee. Le document signe n a pas ete modifie par la "
      + "signature : son empreinte ci-dessus permet d en verifier l integrite a tout moment.",
      9, normal, gris
    );

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii("Certificat de signature - " + reference + " - page " + (i + 1) + "/" + pages.length),
        { x: 50, y: 36, size: 7.5, font: normal, color: gris }
      );
    }

    const octets = Buffer.from(await pdf.save());

    return new NextResponse(new Uint8Array(octets), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="certificat-' + reference + '.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
