import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";
import { marqueCompliance } from "../../../../lib/marque-compliance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// LA SIGNATURE ELECTRONIQUE DE MYSTERLLC — 01/09.
//
// DUPLICATION DU MECANISME EPROUVE d AcadeMIA Pro
// (/api/organisme/signature), adapte au module compliance. Le fond est
// identique : code par courriel, empreinte du document, sceau HMAC,
// chainage des preuves. Ce qui change, c est CE QU ON FAIT SIGNER.
//
// 🚨🚨 LES FORMULAIRES IRS NE SE SIGNENT PAS ICI, ET C EST UNE REGLE
// ABSOLUE.
//
// Le Form 5472, le 1120 et le 7004 exigent une signature manuscrite ou les
// procedures propres a l IRS. Une signature electronique simple n y serait
// PAS OPPOSABLE. Proposer de les signer ici serait mentir au client, et lui
// faire croire qu une obligation est remplie quand elle ne l est pas.
//
// CE QUI SE SIGNE, ET SEULEMENT CELA : les documents CONTRACTUELS entre le
// gestionnaire et son client.
//   - le mandat de gestion,
//   - la lettre de mission,
//   - l autorisation de deposer en son nom,
//   - et surtout L ACCUSE DE LECTURE AVANT DEPOT : le client atteste avoir
//     lu et approuve le formulaire qui va partir.
//
// ⚠️ CE DERNIER CAS EST LE COEUR DE L OFFRE. Il ne remplace pas la decision
// du client, IL LA PROUVE. C est la traduction technique de l argument de
// maitrise : rien ne part en son nom sans qu il l ait vu.
//
// ⚠️ NE JAMAIS ELARGIR LA LISTE DES TYPES SIGNABLES SANS VERIFIER
// L OPPOSABILITE. Un document ajoute par commodite, signe electroniquement
// alors que l administration exige autre chose, cree une fausse securite —
// et c est le client qui la paierait.
//
// 🆕 LE TRACE MANUSCRIT — 01/09. Le signataire peut dessiner sa signature
// au doigt ou au stylet. Observation de Jacques, en tant qu utilisateur :
// « je me laisse souvent entrainer par les apparences comme tout humain ».
// Cocher une case ne RESSEMBLE pas a signer.
//
// ⚠️ IL N AJOUTE RIEN JURIDIQUEMENT — la signature vaut deja sans lui — MAIS
// SON EMPREINTE ENTRE DANS LE SCEAU. Un trace hors du sceau serait
// decoratif et remplacable : on montrerait une signature sans pouvoir
// prouver que c est celle qui a ete apposee.
//
// ⚠️ SIGNATURE ELECTRONIQUE SIMPLE au sens du reglement eIDAS. Ni avancee,
// ni qualifiee. Elle est opposable ENTRE LES PARTIES ; elle ne vaut pas
// verification d identite. L ecran le dit, et cette route le repete dans sa
// reponse : mieux vaut le dire avant qu on ne le decouvre.
// ---------------------------------------------------------------------------

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";
const VALIDITE_CODE_MIN = 15;
const MAX_TENTATIVES = 5;
const VALIDITE_LECTURE_S = 3600;

// 🚨 LES SEULS TYPES SIGNABLES. Tout autre type est refuse, meme si la
// reference existe. C est le garde-fou contre l elargissement par
// commodite.
const TYPES_SIGNABLES = [
  "mandat",              // mandat de gestion du gestionnaire
  "lettre_mission",      // lettre de mission annuelle
  "autorisation_depot",  // autorisation de deposer au nom du client
  "accuse_lecture",      // le client atteste avoir lu ce qui va partir
  "convention",          // convention de prestation
  "devis",
];

// 🚨 CE TEXTE EST CELUI QUE LE SIGNATAIRE LIT A L ECRAN, AU CARACTERE PRES —
// aligne le 02/09. Il entre dans le sceau : ce qui est prouve doit etre
// exactement ce qui a ete accepte. La page de signature affiche la meme
// chaine ; toute modification se fait DES DEUX COTES.
//
// ⚠️ Les signatures deja posees restent valides : la verification relit le
// texte stocke dans chaque ligne, jamais cette constante.
const CONSENTEMENT =
  "En cochant cette case et en validant, je reconnais avoir lu le document, " +
  "j'en accepte les termes, et j'appose ma signature électronique. Je reconnais " +
  "que cette signature a la même valeur que ma signature manuscrite entre les parties. " +
  "Je confirme être le titulaire de l'adresse électronique à laquelle le code de " +
  "vérification a été adressé.";

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

function sceau(charge: string): string {
  const secret = process.env.SESSION_SECRET || "";
  return crypto.createHmac("sha256", secret).update(charge).digest("hex");
}

function empreinteTexte(t: string): string {
  return crypto.createHash("sha256").update(t).digest("hex");
}

async function documentDe(reference: string) {
  const { data } = await supabase
    .from("compliance_documents")
    .select("id, tenant_id, entite_id, doc_type, reference, signataire_email, "
      + "title, pdf_chemin, pdf_sha256, storage_path, file_hash, donnees")
    .eq("reference", reference)
    .maybeSingle();
  return data || null;
}

// LIRE N EST PAS SIGNER, et la distinction est essentielle.
//
// Le gestionnaire doit pouvoir CONSULTER le document : c est lui qui l a
// produit. Mais il ne doit EN AUCUN CAS pouvoir le signer a la place de son
// client — la preuve porterait alors le nom de celui qui a clique, et non
// celui qui s engage.
function peutLire(doc: any, session: any) {
  const estLeSignataire =
    String(doc.signataire_email || "").toLowerCase() === String(session.email || "").toLowerCase();
  const estLeGestionnaire = session.tenantId === doc.tenant_id;
  const estAdmin = ADMINS.indexOf(session.email) >= 0;
  return estLeSignataire || estLeGestionnaire || estAdmin;
}

// 🚨 SEUL LE SIGNATAIRE DESIGNE SIGNE. Sans exception, sans passe-droit
// administrateur. C est le verrou qui donne sa valeur a toute la chaine.
function peutSigner(doc: any, session: any) {
  return String(doc.signataire_email || "").toLowerCase()
    === String(session.email || "").toLowerCase();
}

function typeSignable(doc: any): boolean {
  return TYPES_SIGNABLES.indexOf(String(doc.doc_type || "")) >= 0;
}

// 🆕 23/09 — LE LIBELLE DU DOCUMENT. Le type (doc_type / document_type)
// entre dans le sceau de chaque signature : on n y touche jamais. Le libelle
// lisible — « Operating Agreement » plutot que « Convention de prestation » —
// est range par document-a-signer dans compliance_documents.donnees.libelle
// et rendu A COTE du type. Absent pour les documents plus anciens : la page
// retombe alors sur le libelle de son type, comme avant.
async function libellesDe(references: string[]): Promise<Record<string, string>> {
  const refs = Array.from(new Set(references.filter(function (r) { return !!r; })));
  const m: Record<string, string> = {};
  for (let i = 0; i < refs.length; i += 200) {
    const { data } = await supabase
      .from("compliance_documents")
      .select("reference, donnees")
      .in("reference", refs.slice(i, i + 200));
    for (const d of data || []) {
      const l = d && d.donnees && typeof d.donnees === "object" ? (d.donnees as any).libelle : null;
      if (l) m[String(d.reference)] = String(l);
    }
  }
  return m;
}

// ---------------------------------------------------------------------------
// 🆕 23/09 — VOIR LE DOCUMENT SIGNE. Demande de Jacques : apres le code, la
// signature restait abstraite pour le client — « il envoie le code, OK, mais
// ca reste abstrait ». Un bouton lui montre desormais ce qu il a signe.
//
// CE QUE PRODUIT ?vue=signe&reference=… : le PDF ARCHIVE, tel quel, suivi
// d une page « Certificat de signature » (trace, nom, date et heure, code
// verifie, empreinte). Il est fabrique A LA DEMANDE et n est jamais range :
// ⛔ L ORIGINAL ARCHIVE N EST PAS MODIFIE — son empreinte est celle de la
// preuve. Le certificat la CITE et verifie, a l ouverture, que le fichier
// archive est toujours identique a l octet pres a celui qui a ete signe.
// Memes droits que la lecture : le signataire, son gestionnaire, un admin.
//
// 🆕 23/09 (soir) — LE TRACE REPORTE LA OU IL SE POSE. Jacques : « la
// signature devrait etre egalement la », sur la ligne « Signature » du SS-4.
// Le document signe reporte desormais le trace :
//   - sur le SS-4 joint : ligne « Signature », date a cote — aux MEMES
//     coordonnees que la transmission (ss4/transmettre) ;
//   - sur le 1120 joint : ligne « Signature of officer », date et « Member »
//     — memes coordonnees que transmettre ;
//   - dans le cadre « Signature du titulaire » des documents qui en ont un
//     (donnees.zone_signature, pose par document-a-signer depuis le 23/09).
// Les pieces jointes se retrouvent par donnees.annexes (titres et nombres de
// pages, dans l ordre) : elles suivent les pages de l attestation.
// ⛔ Le report se fait sur une COPIE ; le certificat le dit, et verifie que
// le fichier archive est intact.
// ---------------------------------------------------------------------------

// Les coordonnees de la transmission — a garder identiques a ss4/transmettre
// et a transmettre (1120).
const SS4_SIGN = { x: 100, y: 44, l: 150, h: 26, dateX: 345, dateY: 46 };
const F1120_SIGN = { x: 100, y: 70, l: 150, h: 30, dateX: 274, dateY: 92, titreX: 330 };

// 🆕 23/09 (soir) — la date longue a l americaine : « September 23, 2026 ».
function dateUSLongue(v: unknown): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", month: "long", day: "numeric", year: "numeric" }).format(new Date(String(v)));
  } catch { return ""; }
}

function dateUS(v: unknown): string {
  try {
    const d = new Date(String(v));
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", month: "2-digit", day: "2-digit", year: "numeric" }).format(d);
    return p;
  } catch { return ""; }
}

function pourPdfCertificat(t: unknown): string {
  return String(t ?? "").replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u2013\u2014\u2018\u2019\u201C\u201D\u2026\u20AC]/g, "?");
}

function dateHeureParis(v: unknown): string {
  if (!v) return "—";
  try {
    return new Date(String(v)).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " (heure de Paris)";
  } catch { return String(v); }
}

async function documentSigne(doc: any, sig: any, original: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(original, { ignoreEncryption: true });
  const nbPagesDocument = pdf.getPageCount();
  const police = await pdf.embedFont(StandardFonts.Helvetica);
  const gras = await pdf.embedFont(StandardFonts.HelveticaBold);

  // ---- 🆕 23/09 (soir) — LE TRACE, REPORTE LA OU IL SE POSE ----
  const donneesDoc = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
  const traceBrut = String(sig.trace_signature || "");
  const mTrace = traceBrut.match(/^data:image\/png;base64,(.+)$/);
  let imageTrace: any = null;
  if (mTrace) { try { imageTrace = await pdf.embedPng(Buffer.from(mTrace[1], "base64")); } catch { imageTrace = null; } }
  const reports: string[] = [];
  function poser(page: any, x: number, y: number, l: number, h: number) {
    if (!imageTrace) return;
    const e = Math.min(l / imageTrace.width, h / imageTrace.height, 1);
    page.drawImage(imageTrace, { x: x, y: y, width: imageTrace.width * e, height: imageTrace.height * e });
  }
  // a. le cadre « Signature du titulaire » du document lui-meme
  const zone = donneesDoc.zone_signature;
  if (zone && typeof zone.page === "number" && zone.page >= 0 && zone.page < nbPagesDocument) {
    const p = pdf.getPage(zone.page);
    if (imageTrace) poser(p, zone.x + 8, zone.y + 16, zone.largeur - 16, zone.hauteur - 24);
    p.drawText(pourPdfCertificat("Signé électroniquement le " + dateHeureParis(sig.signe_le).replace(" (heure de Paris)", "")), { x: zone.x + 8, y: zone.y + 5, size: 7.5, font: police, color: rgb(0.35, 0.35, 0.35) });
    reports.push("le cadre « Signature du titulaire »");
  }
  // b. les formulaires joints, sur leur propre ligne de signature
  const annexes: any[] = Array.isArray(donneesDoc.annexes) ? donneesDoc.annexes : [];
  const pagesAnnexes = annexes.reduce(function (t: number, a: any) { return t + (Number(a && a.pages) || 0); }, 0);
  let debut = nbPagesDocument - pagesAnnexes;
  if (debut >= 1) {
    for (const a of annexes) {
      const n = Number(a && a.pages) || 0;
      const titreA = String((a && a.titre) || "");
      const declaree = a && a.signature && typeof a.signature === "object" ? a.signature : null;
      if (n > 0 && declaree && Number.isInteger(declaree.page) && declaree.page >= 0 && declaree.page < n && debut + declaree.page < nbPagesDocument) {
        // 🆕 23/09 (soir) — LA PIECE A DECLARE OU SE POSE SA SIGNATURE : c est
        // la regle generale, valable pour toute piece jointe future.
        const pd = pdf.getPage(debut + declaree.page);
        poser(pd, Number(declaree.x), Number(declaree.y), Number(declaree.l), Number(declaree.h));
        if (typeof declaree.date_x === "number" && typeof declaree.date_y === "number") {
          pd.drawText(declaree.date_format === "us" ? dateUS(sig.signe_le) : dateUSLongue(sig.signe_le), { x: declaree.date_x, y: declaree.date_y, size: 11, font: police, color: rgb(0, 0, 0) });
        }
        reports.push("la ligne de signature de « " + titreA + " »");
      } else if (n > 0 && debut < nbPagesDocument) {
        // Les pieces plus anciennes, sans declaration : SS-4 et 1120 reconnus
        // a leur titre, aux coordonnees de la transmission.
        const p = pdf.getPage(debut);
        if (/SS-4/i.test(titreA)) {
          poser(p, SS4_SIGN.x, SS4_SIGN.y, SS4_SIGN.l, SS4_SIGN.h);
          p.drawText(dateUS(sig.signe_le), { x: SS4_SIGN.dateX, y: SS4_SIGN.dateY, size: 9, font: police, color: rgb(0, 0, 0) });
          reports.push("la ligne « Signature » du SS-4");
        } else if (/1120/.test(titreA)) {
          poser(p, F1120_SIGN.x, F1120_SIGN.y, F1120_SIGN.l, F1120_SIGN.h);
          p.drawText(dateUS(sig.signe_le), { x: F1120_SIGN.dateX, y: F1120_SIGN.dateY, size: 9, font: police, color: rgb(0, 0, 0) });
          p.drawText("Member", { x: F1120_SIGN.titreX, y: F1120_SIGN.dateY, size: 9, font: police, color: rgb(0, 0, 0) });
          reports.push("la ligne « Signature of officer » du 1120");
        }
      }
      debut = debut + n;
    }
  }
  const LARGEUR = 595.28, HAUTEUR = 841.89, MARGE = 56, UTILE = LARGEUR - 2 * MARGE;
  const OR = rgb(0.784, 0.663, 0.431), NUIT = rgb(0.10, 0.10, 0.18), GRIS = rgb(0.40, 0.40, 0.40), VERT = rgb(0.0, 0.50, 0.25), ROUGE = rgb(0.78, 0.16, 0.16);
  const page = pdf.addPage([LARGEUR, HAUTEUR]);
  let y = HAUTEUR - MARGE;

  function lignes(texte: string, fonte: any, taille: number, largeur: number): string[] {
    const mots = pourPdfCertificat(texte).split(/\s+/).filter(function (m) { return m.length > 0; });
    const out: string[] = []; let l = "";
    for (const mot of mots) {
      const essai = l ? l + " " + mot : mot;
      if (fonte.widthOfTextAtSize(essai, taille) <= largeur) l = essai;
      else {
        if (l) out.push(l);
        // un mot plus large que la ligne (une empreinte) se coupe au caractere
        let reste = mot;
        while (fonte.widthOfTextAtSize(reste, taille) > largeur) {
          let n = reste.length;
          while (n > 1 && fonte.widthOfTextAtSize(reste.slice(0, n), taille) > largeur) n--;
          out.push(reste.slice(0, n)); reste = reste.slice(n);
        }
        l = reste;
      }
    }
    if (l) out.push(l);
    return out;
  }
  function ecrire(texte: string, fonte: any, taille: number, couleur: any, interligne?: number) {
    for (const l of lignes(texte, fonte, taille, UTILE)) {
      page.drawText(l, { x: MARGE, y: y, size: taille, font: fonte, color: couleur });
      y = y - taille * (interligne || 1.5);
    }
  }
  function rubrique(libelle: string, valeur: string) {
    ecrire(libelle.toUpperCase(), gras, 8.5, OR, 1.5);
    ecrire(valeur || "—", police, 11, NUIT, 1.45);
    y = y - 6;
  }

  const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
  const libelle = donnees.libelle || LIBELLES_CERTIFICAT[String(doc.doc_type || "")] || "Document";

  ecrire("CERTIFICAT DE SIGNATURE", gras, 18, NUIT, 1.3);
  y = y - 2;
  page.drawLine({ start: { x: MARGE, y: y }, end: { x: LARGEUR - MARGE, y: y }, thickness: 2, color: OR });
  y = y - 20;

  rubrique("Document signé", (doc.title || libelle) + " (" + (nbPagesDocument === 1 ? "1 page" : nbPagesDocument + " pages") + ", reproduites avant ce certificat)");
  rubrique("Référence", String(doc.reference || ""));
  const qui = [sig.signataire_nom, sig.signataire_qualite].filter(function (x: any) { return !!x; }).join(", ");
  rubrique("Signataire", (qui ? qui + " — " : "") + String(sig.signataire_email || ""));
  rubrique("Signé le", dateHeureParis(sig.signe_le));
  rubrique("Code de vérification", sig.code_verifie_le ? "envoyé à l'adresse du signataire et vérifié le " + dateHeureParis(sig.code_verifie_le) : "—");
  rubrique("Empreinte SHA-256 du document signé", String(sig.empreinte_sha256 || ""));

  const empreinteArchive = crypto.createHash("sha256").update(original).digest("hex");
  const conforme = empreinteArchive === String(sig.empreinte_sha256 || "") && empreinteArchive === String(doc.pdf_sha256 || doc.file_hash || "");
  ecrire("CONTRÔLE À L'OUVERTURE", gras, 8.5, OR, 1.5);
  ecrire(conforme
    ? "Conforme : le fichier archivé est identique, à l'octet près, à celui qui a été signé."
    : "NON CONFORME : le fichier archivé ne correspond plus à l'empreinte signée. Prévenez le support.",
    gras, 10.5, conforme ? VERT : ROUGE, 1.45);
  if (reports.length > 0) {
    ecrire("Pour la lecture, le tracé de signature est reporté sur " + reports.join(" et sur ") + ", là où il est apposé à la transmission. L'empreinte ci-dessus est celle du fichier signé, avant ce report.", police, 9.5, GRIS, 1.45);
  }
  y = y - 10;

  ecrire("TRACÉ DE SIGNATURE", gras, 8.5, OR, 1.5);
  if (imageTrace) {
    try {
      const image = imageTrace;
      const echelle = Math.min(260 / image.width, 110 / image.height, 1);
      const w = image.width * echelle, h = image.height * echelle;
      page.drawRectangle({ x: MARGE, y: y - h - 8, width: w + 16, height: h + 16, color: rgb(0.99, 0.98, 0.96), borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5 });
      page.drawImage(image, { x: MARGE + 8, y: y - h, width: w, height: h });
      y = y - h - 26;
    } catch {
      ecrire("(tracé enregistré, illisible pour l'affichage)", police, 10, GRIS);
    }
  } else {
    ecrire("Aucun tracé : la signature a été donnée par le code de vérification seul.", police, 10, GRIS);
  }
  y = y - 8;

  ecrire("Signature électronique simple au sens du règlement européen eIDAS. Elle n'est ni avancée ni qualifiée : elle est opposable entre les parties, elle ne vaut pas vérification d'identité.", police, 9, GRIS, 1.5);
  y = y - 6;
  ecrire("Ce certificat est établi à la demande, le " + dateHeureParis(new Date().toISOString()) + ". Il n'entre pas dans l'empreinte : il la cite. L'original signé reste archivé tel quel.", police, 8.5, rgb(0.55, 0.55, 0.55), 1.5);

  return await pdf.save();
}

const LIBELLES_CERTIFICAT: Record<string, string> = {
  mandat: "Mandat de gestion",
  lettre_mission: "Lettre de mission",
  autorisation_depot: "Autorisation de dépôt",
  accuse_lecture: "Accusé de lecture avant dépôt",
  convention: "Convention de prestation",
  devis: "Devis",
};

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);

    // 🆕 23/09 — LE DOCUMENT SIGNE, AVEC SON CERTIFICAT (voir plus haut).
    if (url.searchParams.get("vue") === "signe") {
      const reference = String(url.searchParams.get("reference") || "").trim();
      if (!reference) {
        return NextResponse.json({ ok: false, erreur: "Document non précisé." }, { status: 400 });
      }
      const doc = await documentDe(reference);
      if (!doc) {
        return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
      }
      if (!peutLire(doc, session)) {
        return NextResponse.json({ ok: false, erreur: "Ce document ne vous concerne pas." }, { status: 403 });
      }
      const { data: sig } = await supabase
        .from("compliance_signatures")
        .select("*")
        .eq("document_reference", reference)
        .eq("annulee", false)
        .order("signe_le", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!sig) {
        return NextResponse.json({ ok: false, erreur: "Ce document n'est pas encore signé." }, { status: 404 });
      }
      const chemin = doc.pdf_chemin || doc.storage_path || "";
      const { data: fichier } = chemin ? await supabase.storage.from(BUCKET).download(chemin) : { data: null };
      if (!fichier) {
        return NextResponse.json({ ok: false, erreur: "Le document archivé est introuvable." }, { status: 404 });
      }
      const original = new Uint8Array(await fichier.arrayBuffer());
      const octets = await documentSigne(doc, sig, original);
      return new NextResponse(Buffer.from(octets), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline; filename=\"" + reference + "-signe.pdf\"",
          "Cache-Control": "no-store",
        },
      });
    }

    // LECTURE DU DOCUMENT AVANT SIGNATURE. On ne peut pas demander a
    // quelqu un de reconnaitre avoir lu un texte qu on ne lui montre pas :
    // la case de consentement se retournerait contre nous. Le lien rendu
    // est temporaire et ne donne acces qu a ce seul fichier.
    if (url.searchParams.get("vue") === "document") {
      const reference = String(url.searchParams.get("reference") || "").trim();
      if (!reference) {
        return NextResponse.json({ ok: false, erreur: "Document non précisé." }, { status: 400 });
      }

      const doc = await documentDe(reference);
      if (!doc) {
        return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
      }

      if (!peutLire(doc, session)) {
        return NextResponse.json(
          { ok: false, erreur: "Ce document ne vous concerne pas." },
          { status: 403 }
        );
      }

      const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
      const chemin = doc.pdf_chemin || doc.storage_path || "";

      let lien = "";
      if (chemin) {
        const { data: signe } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(chemin, VALIDITE_LECTURE_S);
        if (signe && signe.signedUrl) lien = signe.signedUrl;
      }

      // 🆕 23/09 — DEJA SIGNE ? Un client qui rouvre le lien du courriel
      // retombait sur le formulaire de signature. La page affiche desormais
      // l ecran « signe » avec le bouton du document signe.
      const { data: dejaSigne } = await supabase
        .from("compliance_signatures")
        .select("signe_le, empreinte_sha256")
        .eq("document_reference", doc.reference)
        .eq("signataire_email", String(session.email || "").toLowerCase())
        .eq("annulee", false)
        .order("signe_le", { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        deja_signe: !!dejaSigne,
        signe_le: dejaSigne ? dejaSigne.signe_le : null,
        reference: doc.reference,
        type: doc.doc_type,
        libelle: donnees.libelle || null,
        titre: doc.title || donnees.titre || null,
        empreinte: doc.pdf_sha256 || doc.file_hash || null,
        lien_lecture: lien || null,
        signataire: doc.signataire_email,
        signable: typeSignable(doc),
        vous_pouvez_signer: peutSigner(doc, session) && typeSignable(doc),
        // ⚠️ DIT AVANT LA SIGNATURE, PAS APRES.
        avertissement: typeSignable(doc)
          ? "Signature électronique simple au sens du règlement eIDAS."
          : "Ce type de document ne se signe pas électroniquement : il exige"
            + " une signature manuscrite ou la procédure propre à"
            + " l'administration concernée.",
      });
    }

    // LES SIGNATURES DU SIGNATAIRE LUI-MEME.
    if (url.searchParams.get("vue") === "miennes") {
      const { data } = await supabase
        .from("compliance_signatures")
        .select("document_type, document_reference, signe_le, empreinte_sha256, annulee, code_verifie_le")
        .eq("signataire_email", session.email)
        .order("signe_le", { ascending: false })
        .limit(200);

      const libellesMiennes = await libellesDe((data || []).map(function (s: any) { return s.document_reference; }));
      return NextResponse.json({
        ok: true,
        consentement: CONSENTEMENT,
        email: session.email,
        signatures: (data || []).map(function (s: any) { return { ...s, libelle: libellesMiennes[s.document_reference] || null }; }),
      });
    }

    // LE REGISTRE DU GESTIONNAIRE.
    let tenant = session.tenantId;
    if (!tenant && ADMINS.indexOf(session.email) >= 0) {
      tenant = url.searchParams.get("tenant");
    }
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun portefeuille rattaché à votre compte." },
        { status: 403 }
      );
    }

    // Le filtre par societe, quand on regarde le dossier d une seule.
    const entite = String(url.searchParams.get("entite") || "").trim();

    let q = supabase
      .from("compliance_signatures")
      .select("*")
      .eq("tenant_id", tenant);

    if (entite) q = q.eq("entite_id", entite);

    const { data, error } = await q
      .order("signe_le", { ascending: true })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // 🚨 VERIFICATION EN DEUX TEMPS, et les deux comptent.
    //
    // LE SCEAU verifie chaque signature prise isolement : si une ligne a ete
    // modifiee en base apres coup, son HMAC ne correspond plus.
    //
    // LE CHAINAGE relie chaque preuve a la precedente : il detecte ce que le
    // sceau ne voit pas — la SUPPRESSION d une signature du milieu, qui ne
    // laisse aucune trace sur les lignes restantes.
    let precedente = "";
    const liste = (data || []).map(function (s: any) {
      // 🚨 LE TRACE ENTRE DANS LE SCEAU — 01/09.
      //
      // Sans lui, on afficherait une signature manuscrite qui ne ferait
      // PAS PARTIE DE LA PREUVE : quelqu un pourrait la remplacer en base
      // sans que le sceau bronche. Le trace serait alors decoratif, et
      // trompeur.
      //
      // ⚠️ L ABSENCE DE TRACE VAUT CHAINE VIDE. Ainsi une signature posee
      // avant l ajout de cette colonne reste valide : son sceau a ete
      // calcule avec le meme "" a cette position.
      const charge = [
        s.tenant_id, s.document_type, s.document_reference, s.empreinte_sha256,
        s.signataire_email, s.consentement, new Date(s.signe_le).toISOString(),
        s.trace_sha256 || "",
      ].join("|");

      const intacte = sceau(charge) === s.jeton_preuve;
      const attendue = empreinteTexte(precedente + "|" + charge);
      const chaineIntacte = !s.empreinte_chaine || s.empreinte_chaine === attendue;

      precedente = s.empreinte_chaine || attendue;

      return { ...s, intacte: intacte, chaine_intacte: chaineIntacte };
    });

    liste.reverse();

    // 🆕 23/09 — le libelle s ajoute APRES le controle du sceau : il n y entre pas.
    const libellesRegistre = await libellesDe(liste.map(function (s: any) { return s.document_reference; }));
    for (const s of liste as any[]) s.libelle = libellesRegistre[s.document_reference] || null;

    return NextResponse.json({
      ok: true,
      consentement: CONSENTEMENT,
      total: liste.length,
      alterees: liste.filter(function (s: any) { return !s.intacte; }).length,
      chaine_rompue: liste.filter(function (s: any) { return !s.chaine_intacte; }).length,
      verifiees_par_code: liste.filter(function (s: any) { return !!s.code_verifie_le; }).length,
      signatures: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// ENVOI DU CODE. C est ce qui fait passer la preuve de « quelqu un a
// clique » a « le titulaire de cette adresse a clique ». On ne conserve que
// l EMPREINTE du code, jamais le code lui-meme.
//
// 🚨 LE CODE PART A L ADRESSE INSCRITE SUR LE DOCUMENT, jamais a celle de
// la session. Autrement, le gestionnaire recevrait les codes de ses propres
// clients — et pourrait signer a leur place.
async function envoyerCode(req: NextRequest, doc: any) {
  const cle = process.env.RESEND_API_KEY || "";
  if (!cle) {
    return NextResponse.json({ ok: false, erreur: "RESEND_API_KEY absente" }, { status: 500 });
  }

  const destinataire = String(doc.signataire_email || "").toLowerCase().trim();
  if (!destinataire) {
    return NextResponse.json(
      { ok: false, erreur: "Ce document ne porte aucune adresse de signataire." },
      { status: 400 }
    );
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expire = new Date(Date.now() + VALIDITE_CODE_MIN * 60000).toISOString();

  const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
  const codes = donnees.codes_signature && typeof donnees.codes_signature === "object"
    ? donnees.codes_signature
    : {};

  codes[destinataire] = {
    empreinte: empreinteTexte(code + "|" + destinataire),
    envoye_le: new Date().toISOString(),
    expire_le: expire,
    tentatives: 0,
  };

  const { error } = await supabase
    .from("compliance_documents")
    .update({ donnees: { ...donnees, codes_signature: codes } })
    .eq("id", doc.id);

  if (error) {
    return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  }

  // ⚠️ LA MARQUE VIENT DE L HOTE APPELANT — 03/09. Mr. Comptable et
  // MysterLLC partagent cette route : un client de cabinet recoit son code
  // aux couleurs de Mr. Comptable, un gestionnaire de LLC aux couleurs de
  // MysterLLC. Aucune mention d AcadeMIA sur aucune des deux.
  const marque = marqueCompliance(req);
  const html =
    '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.7">' +
    '<p style="color:#a07840;font-size:13px;letter-spacing:2px;margin:0 0 6px">SIGNATURE ÉLECTRONIQUE</p>' +
    '<h1 style="color:#1a1a2e;font-size:22px;margin:0 0 16px">Votre code de vérification</h1>' +
    "<p>Vous vous apprêtez à signer le document <strong>" + doc.reference +
    "</strong>. Saisissez ce code sur la page de signature :</p>" +
    '<p style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#1a1a2e;' +
    'background:#f5f1e8;padding:18px 24px;border-radius:8px;text-align:center;margin:24px 0">' +
    code + "</p>" +
    "<p>Ce code est valable " + VALIDITE_CODE_MIN + " minutes et ne sert qu'une fois.</p>" +
    '<p style="font-size:14px;color:#666">Si vous n\'êtes pas à l\'origine de cette demande, ' +
    "ignorez ce message : aucune signature ne sera enregistrée sans ce code.</p>" +
    '<p style="font-size:13px;color:#999;margin-top:26px">' + marque.signature + "</p>" +
    "</div>";

  const expediteur = marque.expediteur;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: expediteur,
      to: [destinataire],
      subject: "Code de vérification — signature du document " + doc.reference,
      html: html,
    }),
  });

  if (!r.ok) {
    return NextResponse.json(
      { ok: false, erreur: "L'envoi du code a échoué. Réessayez." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    envoye: true,
    email: destinataire,
    validite_minutes: VALIDITE_CODE_MIN,
    message: "Un code à six chiffres vient d'être envoyé à " + destinataire + ".",
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous pour signer." }, { status: 401 });
    }

    // ⚠️ SANS SESSION_SECRET, LE SCEAU NE VAUT RIEN. On refuse de signer
    // plutot que de produire une preuve invalidable.
    if (!process.env.SESSION_SECRET) {
      return NextResponse.json({ ok: false, erreur: "Configuration incomplète." }, { status: 500 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requête illisible." }, { status: 400 });
    }

    const reference = String(b.document_reference || "").trim();
    if (!reference) {
      return NextResponse.json({ ok: false, erreur: "Document non précisé." }, { status: 400 });
    }

    const doc = await documentDe(reference);
    if (!doc) {
      return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
    }

    // 🚨 LE PREMIER VERROU : LE TYPE. Un formulaire IRS ne passe pas ici,
    // meme demande par le signataire lui-meme.
    if (!typeSignable(doc)) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Ce document ne se signe pas électroniquement. Les formulaires"
            + " destinés à l'administration américaine exigent une signature"
            + " manuscrite ou la procédure propre à l'IRS : imprimez-le, signez-le,"
            + " et déposez-le selon la voie prévue.",
          type: doc.doc_type,
        },
        { status: 400 }
      );
    }

    // 🚨 LE SECOND VERROU : LA PERSONNE. Le gestionnaire lit, il ne signe
    // pas a la place de son client.
    if (!peutSigner(doc, session)) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Seul le signataire désigné peut signer ce document. Il est établi"
            + " au nom de " + doc.signataire_email
            + " : connectez-vous avec ce compte pour le signer.",
          signataire: doc.signataire_email,
        },
        { status: 403 }
      );
    }

    if (b.action === "code") {
      return await envoyerCode(req, doc);
    }

    if (b.accepte !== true) {
      return NextResponse.json(
        { ok: false, erreur: "Vous devez accepter les termes pour signer." },
        { status: 400 }
      );
    }

    const signataire = String(doc.signataire_email || "").toLowerCase().trim();

    const { data: deja } = await supabase
      .from("compliance_signatures")
      .select("id")
      .eq("document_reference", reference)
      .eq("signataire_email", signataire)
      .eq("annulee", false)
      .maybeSingle();

    if (deja) {
      return NextResponse.json(
        { ok: false, erreur: "Vous avez déjà signé ce document." },
        { status: 409 }
      );
    }

    const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
    const codes = donnees.codes_signature && typeof donnees.codes_signature === "object"
      ? donnees.codes_signature
      : {};
    const attendu = codes[signataire] || null;

    const codeSaisi = String(b.code || "").trim();
    const tentatives = attendu ? Number(attendu.tentatives) || 0 : 0;

    if (!attendu) {
      return NextResponse.json(
        { ok: false, erreur: "Demandez d'abord votre code de vérification." },
        { status: 400 }
      );
    }

    if (tentatives >= MAX_TENTATIVES) {
      return NextResponse.json(
        { ok: false, erreur: "Trop de tentatives. Demandez un nouveau code." },
        { status: 429 }
      );
    }

    if (new Date(attendu.expire_le).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, erreur: "Ce code a expiré. Demandez-en un nouveau." },
        { status: 400 }
      );
    }

    if (empreinteTexte(codeSaisi + "|" + signataire) !== attendu.empreinte) {
      codes[signataire] = { ...attendu, tentatives: tentatives + 1 };
      await supabase
        .from("compliance_documents")
        .update({ donnees: { ...donnees, codes_signature: codes } })
        .eq("id", doc.id);

      return NextResponse.json(
        {
          ok: false,
          erreur: "Code incorrect. Il vous reste "
            + (MAX_TENTATIVES - tentatives - 1) + " tentative(s).",
        },
        { status: 400 }
      );
    }

    const codeEnvoyeLe = attendu.envoye_le;
    const codeVerifieLe = new Date().toISOString();

    // 🚨 L ARCHIVAGE A VALEUR PROBANTE. C est ce fichier-la qui sera montre
    // en cas de contestation. Sans lui, on prouverait un accord SANS POUVOIR
    // MONTRER SUR QUEL TEXTE IL PORTAIT — une preuve sans objet.
    const empreinte = doc.pdf_sha256 || doc.file_hash || "";
    const chemin = doc.pdf_chemin || doc.storage_path || "";

    if (!empreinte || !chemin) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Le document n'a pas encore été archivé. Générez-le et déposez-le"
            + " avant de le faire signer : une signature sans document archivé ne"
            + " prouverait rien.",
        },
        { status: 409 }
      );
    }

    const signeLe = new Date().toISOString();

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    const navigateur = req.headers.get("user-agent") || null;

    // 🚨 LE TRACE MANUSCRIT, S IL EXISTE, ENTRE DANS LE SCEAU.
    // Il est facultatif : la signature vaut sans lui. Mais s il est
    // present, il devient indissociable de la preuve.
    const trace = b.trace ? String(b.trace).trim() : "";
    const traceEmpreinte = trace ? empreinteTexte(trace) : "";

    // ⚠️ UNE BORNE DE TAILLE. Un trace au doigt tient dans quelques
    // kilo-octets ; au-dela, c est qu on tente d y glisser autre chose.
    if (trace && trace.length > 400000) {
      return NextResponse.json(
        { ok: false, erreur: "Le tracé de signature est trop volumineux." },
        { status: 400 }
      );
    }

    const charge = [
      doc.tenant_id, doc.doc_type, reference, empreinte,
      signataire, CONSENTEMENT, signeLe,
      traceEmpreinte,
    ].join("|");

    // 🚨 LE CHAINAGE : chaque preuve porte l empreinte de la precedente.
    // Il detecte ce que le sceau ne voit pas — la suppression d une
    // signature du milieu.
    const { data: derniere } = await supabase
      .from("compliance_signatures")
      .select("empreinte_chaine")
      .eq("tenant_id", doc.tenant_id)
      .order("signe_le", { ascending: false })
      .limit(1)
      .maybeSingle();

    const precedente = (derniere && derniere.empreinte_chaine) || "";
    const chaine = empreinteTexte(precedente + "|" + charge);

    const { data, error } = await supabase
      .from("compliance_signatures")
      .insert({
        tenant_id: doc.tenant_id,
        entite_id: doc.entite_id || null,
        document_type: doc.doc_type,
        document_reference: reference,
        empreinte_sha256: empreinte,
        signataire_email: signataire,
        signataire_nom: b.signataire_nom ? String(b.signataire_nom).trim() : null,
        signataire_qualite: b.signataire_qualite ? String(b.signataire_qualite).trim() : null,
        consentement: CONSENTEMENT,
        texte_accepte: CONSENTEMENT,
        signe_le: signeLe,
        adresse_ip: ip ? String(ip).split(",")[0].trim() : null,
        navigateur: navigateur,
        jeton_preuve: sceau(charge),
        code_envoye_le: codeEnvoyeLe,
        code_verifie_le: codeVerifieLe,
        tentatives: tentatives,
        empreinte_precedente: precedente || null,
        empreinte_chaine: chaine,
        trace_signature: trace || null,
        trace_sha256: traceEmpreinte || null,
        ouvert_le: b.ouvert_le || null,
      })
      .select("id, empreinte_sha256, signe_le, empreinte_chaine")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // ⚠️ LE CODE EST CONSOMME : il ne doit plus jamais resservir.
    delete codes[signataire];
    await supabase
      .from("compliance_documents")
      .update({ donnees: { ...donnees, codes_signature: codes } })
      .eq("id", doc.id);

    return NextResponse.json({
      ok: true,
      signature: (data || [])[0] || null,
      empreinte: empreinte,
      archive: chemin,
      signataire: signataire,
      verifie_par_code: true,
      avertissement:
        "Signature électronique simple au sens du règlement eIDAS. Elle n'est ni"
        + " avancée ni qualifiée : elle est opposable entre les parties, elle ne"
        + " vaut pas vérification d'identité.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
