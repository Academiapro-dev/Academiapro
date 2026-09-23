import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";
import { marqueCompliance, MarqueCompliance } from "../../../../lib/marque-compliance";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// CREER UN DOCUMENT A FAIRE SIGNER — MYSTERLLC, 01/09.
//
// CE QUI MANQUAIT. La route de signature, l ecran de signature et le
// registre existaient depuis ce matin. Mais RIEN NE CREAIT DE DOCUMENT
// SIGNABLE : le mecanisme complet etait inutilisable, faute de premiere
// etape.
//
// CE QUE FAIT CETTE ROUTE, DANS L ORDRE :
//   1. verifie que la societe appartient bien au gestionnaire,
//   2. fabrique le document en HTML,
//   3. L ARCHIVE AU COFFRE et calcule son empreinte SHA-256,
//   4. l enregistre dans compliance_documents avec une reference unique,
//   5. envoie le lien de signature a l adresse du CLIENT.
//
// 🚨 L ARCHIVAGE PRECEDE L ENVOI, ET CE N EST PAS UN DETAIL. La route de
// signature REFUSE de signer un document non archive : une signature sans
// document prouverait un accord sans pouvoir montrer sur quoi il portait.
// Si le depot echoue, rien n est envoye.
//
// 🚨 LES FORMULAIRES IRS NE PASSENT PAS PAR ICI. Le 5472, le 1120 et le
// 7004 exigent une signature manuscrite ou les procedures propres a l IRS.
// La liste des types signables est verifiee deux fois : ici, et dans la
// route de signature.
//
// ⚠️ LE LIEN PART A L ADRESSE DU CLIENT, JAMAIS A CELLE DE LA SESSION.
// C est ce qui fait que la preuve porte le nom de celui qui s engage, et
// non de celui qui a prepare le document.
//
// 🆕 23/09 — LES PIECES JOINTES. Jusqu ici, un accuse de lecture faisait
// ecrire au client « j atteste avoir examine le formulaire » en designant
// ce formulaire par sa seule empreinte : LE FORMULAIRE N ETAIT PAS DANS LE
// DOCUMENT SIGNE. Le client certifiait avoir examine ce qu on ne lui
// montrait pas. Vu par Jacques sur le SS-4, puis sur le 1120 et le 5472.
// Desormais l appelant passe `annexes` : [{ chemin, titre }]. Les PDF sont
// lus au coffre (compliance-docs), aplatis, et REPRODUITS A LA SUITE DE
// L ATTESTATION, dans un seul fichier. L empreinte conservee avec la
// signature couvre donc l attestation ET les formulaires.
// ⛔ Un chemin recu n est pas une autorisation : il doit commencer par
// tenant/societe de la session, finir en .pdf, et ne rien remonter.
// ⛔ Les formulaires IRS restent non signables ICI : ils sont joints pour
// etre LUS ; ce qui se signe, c est l attestation qui les precede.
//
// 🆕 23/09 — LE LIBELLE. Le pacte de la societe partait sous le type
// « convention » et s affichait « Convention de prestation ». L appelant
// peut desormais passer `libelle`, qui remplace celui du type dans le
// document et reste range dans donnees.libelle.
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "documents-signes";

// 🚨 MEME LISTE QUE DANS /api/compliance/signature. Un type present ici
// mais absent la-bas produirait un document impossible a signer.
const TYPES_SIGNABLES = [
  "mandat",
  "lettre_mission",
  "autorisation_depot",
  "accuse_lecture",
  "convention",
  "devis",
];

const LIBELLES: Record<string, string> = {
  mandat: "Mandat de gestion",
  lettre_mission: "Lettre de mission",
  autorisation_depot: "Autorisation de dépôt",
  accuse_lecture: "Accusé de lecture avant dépôt",
  convention: "Convention de prestation",
  devis: "Devis",
};

// 🆕 23/09 — LES PIECES JOINTES : ou elles se lisent, et leurs bornes.
const BUCKET_ANNEXES = "compliance-docs";
const ANNEXES_MAX = 4;
const ANNEXE_OCTETS_MAX = 8 * 1024 * 1024;
type Annexe = { chemin: string; titre: string; octets: Uint8Array; pages: number; sha256: string };

function echappe(t: string): string {
  return String(t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// LE DOCUMENT EST UN PDF — 03/09, a la demande de Jacques.
//
// Jusqu ici le document a signer etait une page HTML. Un client qui
// l ouvrait voyait une page web ; un PDF se telecharge, s imprime et
// s archive tel quel chez lui, et c est ce qu il attend d un document
// contractuel. pdf-lib est deja dans le projet (CERFA 3916).
//
// ⚠️ LES POLICES STANDARD DU PDF (Helvetica) NE CONNAISSENT QUE LES
// CARACTERES LATINS COURANTS (WinAnsi) : accents, guillemets et tirets
// francais passent ; un emoji ou un caractere exotique ferait echouer la
// generation. Ils sont remplaces par un point d interrogation AVANT
// l ecriture, plutot que de perdre tout le document.
//
// Le corps est decoupe en lignes a la largeur de la page et pagine.
// ---------------------------------------------------------------------------

function pourPdf(t: string): string {
  return String(t || "").replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u2013\u2014\u2018\u2019\u201C\u201D\u2026\u20AC]/g, "?");
}

async function documentPDF(titre: string, corps: string, societe: string, libelle: string, marque: MarqueCompliance, pieces: { titre: string; pages: number }[]): Promise<Uint8Array> {
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  const pdf = await PDFDocument.create();
  pdf.setTitle(pourPdf(titre));
  pdf.setAuthor(pourPdf(marque.nom));
  pdf.setSubject(pourPdf(libelle + " — " + societe));

  const police = await pdf.embedFont(StandardFonts.Helvetica);
  const gras = await pdf.embedFont(StandardFonts.HelveticaBold);

  const LARGEUR = 595.28;   // A4
  const HAUTEUR = 841.89;
  const MARGE = 56;
  const LARGEUR_TEXTE = LARGEUR - 2 * MARGE;
  const OR = rgb(0.784, 0.663, 0.431);
  const NUIT = rgb(0.10, 0.10, 0.18);
  const GRIS = rgb(0.40, 0.40, 0.40);

  let page = pdf.addPage([LARGEUR, HAUTEUR]);
  let y = HAUTEUR - MARGE;

  function nouvellePage() {
    page = pdf.addPage([LARGEUR, HAUTEUR]);
    y = HAUTEUR - MARGE;
  }

  // Coupe un paragraphe en lignes tenant dans la largeur utile.
  function lignesDe(texte: string, fonte: any, taille: number, largeur: number): string[] {
    const mots = pourPdf(texte).split(/\s+/).filter(function (m) { return m.length > 0; });
    const lignes: string[] = [];
    let ligne = "";
    for (const mot of mots) {
      const essai = ligne ? ligne + " " + mot : mot;
      if (fonte.widthOfTextAtSize(essai, taille) <= largeur) {
        ligne = essai;
      } else {
        if (ligne) lignes.push(ligne);
        ligne = mot;
      }
    }
    if (ligne) lignes.push(ligne);
    return lignes;
  }

  function ecrire(texte: string, fonte: any, taille: number, couleur: any, interligne: number, largeur?: number, x?: number) {
    const l = largeur || LARGEUR_TEXTE;
    const gauche = x || MARGE;
    for (const ligne of lignesDe(texte, fonte, taille, l)) {
      if (y < MARGE + taille) nouvellePage();
      page.drawText(ligne, { x: gauche, y: y, size: taille, font: fonte, color: couleur });
      y = y - taille * interligne;
    }
  }

  // ---- Titre ----
  ecrire(titre, gras, 20, NUIT, 1.3);
  y = y - 4;
  page.drawLine({ start: { x: MARGE, y: y }, end: { x: LARGEUR - MARGE, y: y }, thickness: 2, color: OR });
  y = y - 18;

  // ---- Meta ----
  ecrire(libelle + " — " + societe, police, 10.5, GRIS, 1.4);
  ecrire("Document établi le " + date, police, 10.5, GRIS, 1.4);
  y = y - 16;

  // ---- Corps ----
  const paragraphes = String(corps || "").split(/\n\s*\n/);
  for (const p of paragraphes) {
    const sousLignes = p.split(/\n/);
    for (const s of sousLignes) {
      if (s.trim()) ecrire(s, police, 11.5, rgb(0.1, 0.1, 0.1), 1.5);
    }
    y = y - 8;
  }

  // ---- 🆕 23/09 — Les pieces jointes, annoncees avant la mention ----
  if (pieces.length > 0) {
    y = y - 6;
    ecrire("PIÈCES JOINTES", gras, 10, OR, 1.6);
    for (const p of pieces) {
      ecrire("— " + p.titre + " (" + (p.pages === 1 ? "1 page" : p.pages + " pages") + ")", police, 11, rgb(0.1, 0.1, 0.1), 1.5);
    }
    ecrire("Elles sont reproduites à la suite de ce document et en font partie : l'empreinte conservée avec la signature couvre l'ensemble.", police, 10, GRIS, 1.5);
    y = y - 8;
  }

  // ---- Mention eIDAS ----
  y = y - 10;
  if (y < MARGE + 80) nouvellePage();
  const mention = "Ce document est destiné à être signé électroniquement. La signature électronique simple, au sens du règlement européen eIDAS, est opposable entre les parties. Elle ne vaut pas vérification d'identité.";
  const lignesMention = lignesDe(mention, police, 9.5, LARGEUR_TEXTE - 24);
  const hauteurMention = lignesMention.length * 9.5 * 1.5 + 20;
  page.drawRectangle({ x: MARGE, y: y - hauteurMention + 12, width: LARGEUR_TEXTE, height: hauteurMention, color: rgb(0.961, 0.945, 0.910) });
  page.drawRectangle({ x: MARGE, y: y - hauteurMention + 12, width: 3, height: hauteurMention, color: OR });
  y = y - 6;
  ecrire(mention, police, 9.5, GRIS, 1.5, LARGEUR_TEXTE - 24, MARGE + 14);
  y = y - 24;

  // ---- Pied ----
  if (y < MARGE + 40) nouvellePage();
  page.drawLine({ start: { x: MARGE, y: y }, end: { x: LARGEUR - MARGE, y: y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
  y = y - 14;
  ecrire(marque.nom + " — document préparé le " + date + ".", police, 8.5, rgb(0.55, 0.55, 0.55), 1.5);
  ecrire("Une empreinte SHA-256 de ce fichier est conservée avec la signature : toute modification ultérieure la rendrait invalide.", police, 8.5, rgb(0.55, 0.55, 0.55), 1.5);

  return await pdf.save();
}

// 🆕 23/09 — REPRODUIRE LES PIECES A LA SUITE DE L ATTESTATION.
// Chaque formulaire est aplati avant la copie : ses champs deviennent du
// contenu de page, lisible dans toute visionneuse. Un formulaire sans champ,
// ou deja aplati, est copie tel quel.
async function joindreAnnexes(principal: Uint8Array, annexes: Annexe[]): Promise<Uint8Array> {
  if (annexes.length === 0) return principal;
  const doc = await PDFDocument.load(principal);
  for (const a of annexes) {
    const source = await PDFDocument.load(a.octets, { ignoreEncryption: true });
    try { source.getForm().flatten(); } catch (e) { /* sans champ ou non aplatissable : les apparences restent */ }
    const pages = await doc.copyPages(source, source.getPageIndices());
    for (const p of pages) doc.addPage(p);
  }
  return await doc.save();
}

export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans société rattachée. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    // 🚨 LA MARQUE VIENT DE L HOTE APPELANT — 03/09. Mr. Comptable et
    // MysterLLC partagent cette route. Le document, le lien et le courriel
    // portent la marque du site depuis lequel le gestionnaire ou le cabinet
    // travaille — jamais l autre.
    const marque = marqueCompliance(req);

    const b = await req.json().catch(function () { return {}; });

    const type = String(b.doc_type || "").trim();
    const titre = String(b.titre || "").trim();
    const corps = String(b.corps || "").trim();
    const emailSignataire = String(b.signataire_email || "").toLowerCase().trim();
    const entiteDemandee = String(b.entite_id || "").trim();

    // 🚨 LE PREMIER VERROU : LE TYPE.
    if (TYPES_SIGNABLES.indexOf(type) < 0) {
      return NextResponse.json(
        {
          error: "Ce type de document ne se signe pas électroniquement. Les"
            + " formulaires destinés à l'administration américaine exigent une"
            + " signature manuscrite ou la procédure propre à l'IRS.",
        },
        { status: 400 }
      );
    }

    if (!titre) {
      return NextResponse.json({ error: "Indiquez un titre." }, { status: 400 });
    }
    if (!emailSignataire || emailSignataire.indexOf("@") < 1) {
      return NextResponse.json(
        { error: "Indiquez l'adresse du signataire." },
        { status: 400 }
      );
    }

    // ---- LA SOCIETE CONCERNEE ----
    //
    // ⚠️ L IDENTIFIANT RECU N EST PAS UNE AUTORISATION. Il est cherche AVEC
    // le filtre tenant_id de la session : une societe d un autre
    // gestionnaire est simplement introuvable.
    let requeteEntite = supabase
      .from("compliance_tenants")
      .select("id, label, legal_name")
      .eq("tenant_id", tenantId);

    if (entiteDemandee) {
      requeteEntite = requeteEntite.eq("id", entiteDemandee);
    }

    const { data: entite, error: eEntite } = await requeteEntite
      .order("label", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eEntite) {
      console.error("[document-a-signer] lecture entite :", eEntite.message);
      return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    }

    if (!entite) {
      return NextResponse.json(
        { error: entiteDemandee ? "Société introuvable." : "Aucune société enregistrée." },
        { status: 404 }
      );
    }

    const entiteId = entite.id;
    const societe = entite.legal_name || entite.label;

    // ---- 🆕 23/09 — LES PIECES JOINTES ----
    // Lues et verifiees AVANT tout archivage : une piece refusee n envoie
    // rien, et le client ne recoit jamais une attestation amputee.
    const annexesDemandees: any[] = Array.isArray(b.annexes) ? b.annexes : [];
    if (annexesDemandees.length > ANNEXES_MAX) {
      return NextResponse.json({ error: "Trop de pièces jointes (" + ANNEXES_MAX + " au plus). Rien n'a été envoyé." }, { status: 400 });
    }
    const annexes: Annexe[] = [];
    const prefixe = tenantId + "/" + entiteId + "/";
    for (const a of annexesDemandees) {
      const chemin = String((a && a.chemin) || "").trim();
      const titreA = String((a && a.titre) || "").trim().slice(0, 120) || "Pièce jointe";
      if (!chemin.startsWith(prefixe) || !chemin.toLowerCase().endsWith(".pdf") || chemin.indexOf("..") >= 0) {
        return NextResponse.json({ error: "Pièce jointe refusée (" + titreA + ") : elle n'appartient pas à cette société. Rien n'a été envoyé." }, { status: 400 });
      }
      const { data: fichier, error: eLec } = await supabase.storage.from(BUCKET_ANNEXES).download(chemin);
      if (eLec || !fichier) {
        return NextResponse.json({ error: "Pièce jointe introuvable au coffre : " + titreA + ". Rien n'a été envoyé." }, { status: 404 });
      }
      const octetsA = new Uint8Array(await fichier.arrayBuffer());
      if (octetsA.length > ANNEXE_OCTETS_MAX) {
        return NextResponse.json({ error: "Pièce jointe trop lourde : " + titreA + ". Rien n'a été envoyé." }, { status: 400 });
      }
      let nbPages = 0;
      try {
        nbPages = (await PDFDocument.load(octetsA, { ignoreEncryption: true })).getPageCount();
      } catch (e) {
        return NextResponse.json({ error: "Pièce jointe illisible : " + titreA + ". Rien n'a été envoyé." }, { status: 400 });
      }
      annexes.push({ chemin, titre: titreA, octets: octetsA, pages: nbPages, sha256: crypto.createHash("sha256").update(octetsA).digest("hex") });
    }

    // 🆕 23/09 — le libelle passe par l appelant l emporte sur celui du type.
    const libelle = String(b.libelle || "").trim().slice(0, 80) || LIBELLES[type] || type;

    // ---- LA REFERENCE ----
    //
    // Elle identifie le document dans toute la chaine : le lien de
    // signature la porte, la preuve la cite, le registre la retrouve.
    // Un fragment aleatoire evite qu on devine les references voisines.
    const suffixe = crypto.randomBytes(4).toString("hex").toUpperCase();
    const reference = "SIG-" + new Date().toISOString().slice(0, 10).replace(/-/g, "")
      + "-" + suffixe;

    let pdfOctets: Uint8Array;
    try {
      const attestation = await documentPDF(titre, corps, societe, libelle, marque, annexes.map(function (a) { return { titre: a.titre, pages: a.pages }; }));
      pdfOctets = await joindreAnnexes(attestation, annexes);
    } catch (e: unknown) {
      console.error("[document-a-signer] assemblage :", e instanceof Error ? e.message : String(e));
      return NextResponse.json({ error: "Assemblage du document impossible. Rien n'a été envoyé." }, { status: 500 });
    }
    const octets = Buffer.from(pdfOctets);
    const empreinte = crypto.createHash("sha256").update(octets).digest("hex");
    const chemin = tenantId + "/" + entiteId + "/" + reference + ".pdf";

    // 🚨 L ARCHIVAGE D ABORD. Si le depot echoue, rien n est envoye : mieux
    // vaut aucun document qu un lien vers un fichier inexistant.
    const { error: eUp } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, octets, { contentType: "application/pdf", upsert: false });

    if (eUp) {
      console.error("[document-a-signer] depot :", eUp.message);
      return NextResponse.json(
        { error: "Archivage impossible. Le document n'a pas été envoyé." },
        { status: 500 }
      );
    }

    const { error: eDoc } = await supabase.from("compliance_documents").insert({
      tenant_id: tenantId,
      entite_id: entiteId,
      doc_type: type,
      title: titre,
      version: 1,
      reference: reference,
      signataire_email: emailSignataire,
      storage_path: chemin,
      pdf_chemin: chemin,
      pdf_sha256: empreinte,
      file_hash: empreinte,
      pdf_octets: octets.length,
      size_bytes: octets.length,
      mime_type: "application/pdf",
      donnees: {
        signataire_nom: String(b.signataire_nom || "").trim() || null,
        prepare_par: session ? session.email : null,
        libelle,
        annexes: annexes.map(function (a) { return { chemin: a.chemin, titre: a.titre, pages: a.pages, sha256: a.sha256 }; }),
      },
    });

    if (eDoc) {
      console.error("[document-a-signer] enregistrement :", eDoc.message);
      return NextResponse.json(
        { error: "Enregistrement impossible : " + eDoc.message },
        { status: 500 }
      );
    }

    // ---- LE LIEN DE SIGNATURE ----
    //
    // ⚠️ IL POINTE SUR LE SITE DE LA MARQUE APPELANTE. Un lien vers un
    // autre site enverrait le client d un cabinet chez un gestionnaire de
    // LLC, ou l inverse — le defaut corrige le 01/09 sur les liens de
    // connexion, puis le 03/09 ici.
    const lien = marque.site + "/compliance/signature/"
      + encodeURIComponent(reference);

    const cle = process.env.RESEND_API_KEY || "";
    const expediteur = marque.expediteur;

    const email: Record<string, unknown> = { destinataire: emailSignataire };

    if (!cle) {
      email.envoye = false;
      email.raison = "RESEND_API_KEY absente";
    } else {
      const corpsHtml =
        '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.75">' +
        '<p style="color:#a07840;font-size:13px;letter-spacing:2px;margin:0 0 6px">DOCUMENT À SIGNER</p>' +
        '<h1 style="color:#1a1a2e;font-size:22px;margin:0 0 16px">' + echappe(titre) + "</h1>" +
        "<p>Un document vous est soumis pour signature concernant <strong>" +
        echappe(societe) + "</strong>.</p>" +
        "<p>Vous pourrez le lire entièrement avant de signer. Un code de " +
        "vérification à six chiffres vous sera envoyé au moment de la signature.</p>" +
        (annexes.length > 0
          ? "<p>Il comprend, à sa suite, les pièces qu'il désigne : " + annexes.map(function (a) { return echappe(a.titre); }).join(", ") + ".</p>"
          : "") +
        '<p style="text-align:center;margin:28px 0">' +
        '<a href="' + lien + '" style="display:inline-block;background:#c8a96e;color:#050508;' +
        'padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">' +
        "Lire et signer</a></p>" +
        '<p style="font-size:13px;color:#666">Si vous n\'attendiez pas ce document, ' +
        "ignorez ce message : aucune signature ne sera enregistrée sans votre action.</p>" +
        '<p style="font-size:13px;color:#999;margin-top:26px">' + echappe(marque.signature) + "</p>" +
        "</div>";

      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + cle,
          },
          body: JSON.stringify({
            from: expediteur,
            to: [emailSignataire],
            subject: titre + " — document à signer",
            html: corpsHtml,
          }),
        });
        email.statut_http = r.status;
        email.envoye = r.ok;
        if (!r.ok) {
          email.raison = "Resend a refuse l'envoi";
          email.reponse = (await r.text()).slice(0, 400);
        }
      } catch (e: unknown) {
        email.envoye = false;
        email.raison = "Appel a Resend impossible";
        email.reponse = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({
      success: true,
      reference: reference,
      lien: lien,
      empreinte: empreinte,
      societe: entite.label,
      type: type,
      libelle: libelle,
      annexes: annexes.map(function (a) { return { titre: a.titre, pages: a.pages }; }),
      email: email,
    });
  } catch (e: unknown) {
    console.error("[document-a-signer] exception :",
      e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
