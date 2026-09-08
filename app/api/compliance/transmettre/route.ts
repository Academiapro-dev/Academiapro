import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// TRANSMETTRE LE 1120 PRO FORMA + 5472 A L IRS PAR FAX — 08/09.
//
// DECISION DE JACQUES DU 08/09 : la plateforme depose. Jusqu ici la regle
// etait « vous relisez, vous signez, vous deposez ». Elle devient « vous
// relisez, vous signez, l outil transmet ». ⚠️ La vitrine, la page
// Fonctions, les articles qui disent encore « vous deposez » sont a
// reprendre APRES que cette route a transmis un vrai fax — pas avant.
//
// CE QUE DIT L IRS (instruction du 5472, rev. 12-2024, verifiee le 08/09) :
//   - une entite disregarded detenue par un etranger NE PEUT PAS deposer
//     par voie electronique : fax ou courrier seulement ;
//   - fax 300 DPI minimum au 855-887-7737 (Ogden, PIN Unit) ;
//   - « Foreign-owned U.S. DE » ecrit en haut du 1120 ;
//   - le 5472 est ATTACHE au 1120 : un seul envoi, 1120 d abord.
//
// CE QUE DIT L IRS SUR LA SIGNATURE (IRM 3.11.16.11.7, maj 23/02/2026) :
// sur un 1120 ordinaire, les signatures electroniques ne sont pas
// valides ; la signature est manuscrite. Le trace que le titulaire
// dessine au doigt dans l outil est pose sur la ligne « Signature of
// officer ». Jacques, 08/09 : le client choisit en connaissance de cause,
// l ecran le lui dit. ⛔ SANS TRACE, RIEN NE PART : un 1120 sans
// signature est un depot incomplet.
//
// LES QUATRE GARDE-FOUS (Jacques, 08/09 : « il faut que le client ne se
// retourne pas contre nous ») :
//   1. rien ne part sans la signature electronique de l ACCUSE DE LECTURE
//      qui porte les empreintes SHA-256 exactes des deux PDF ;
//   2. les empreintes sont RECALCULEES au moment de l envoi et comparees a
//      celles de l accuse : ce qui part est ce qui a ete signe, prouvable ;
//   3. l accuse de transmission du prestataire est conserve avec le
//      document envoye et son empreinte ;
//   4. chaque depense de l exercice porte son justificatif, sinon refus.
//
// TROIS ACTIONS, PARCE QUE L ACCUSE DOIT PORTER LES EMPREINTES :
//   preparer    : hache les deux PDF deja generes, rend le texte de
//                 l accuse a faire signer (l ecran appelle ensuite
//                 /api/compliance/document-a-signer avec ce texte) ;
//   lier        : rattache a l accuse, par sa reference, les chemins et
//                 empreintes des deux PDF (donnees.depot) ;
//   transmettre : verifie, assemble, faxe, archive.
//
// ⚠️ CETTE ROUTE NE MODIFIE NI f5472/generate, NI f1120/generate, NI
// document-a-signer, NI signature. Elle travaille sur des COPIES.
//
// ⚠️ LE PRESTATAIRE : Phaxio (Sinch), API v2.1, 0,07 $ la page, sans
// abonnement. Sans PHAXIO_API_KEY et PHAXIO_API_SECRET dans Vercel, la
// route repond « transmission non configuree » et ne fait rien — comme
// Plivo pour la telephonie.
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_DOCS = "compliance-docs";
const FAX_IRS = "+18558877737";
const PHAXIO_URL = "https://api.phaxio.com/v2.1/faxes";
const DOC_TYPE_DEPOT = "depot_irs_fax";
const TYPE_ACCUSE = "accuse_lecture";

// Coordonnees mesurees le 08/09 sur le 1120 (rev. 2025) genere par
// f1120/generate : page 1, 612 x 792 pt.
//   ligne « Signature of officer » : x 75 -> 265, y ~ 90
//   « Date » : x 272
//   champ « Title » : topmostSubform[0].Page1[0].f1_58[0]
//   marge du haut, libre : y ~ 778
const SIGN_X = 78;
const SIGN_Y = 76;
const SIGN_LARGEUR_MAX = 180;
const SIGN_HAUTEUR_MAX = 22;
const DATE_X = 274;
const DATE_Y = 92;
const MENTION_Y = 778;
const CHAMP_TITLE = "topmostSubform[0].Page1[0].SignHere-ReadOrder[0].f1_58[0]";
const TITRE_SIGNATAIRE = "Member";

function sha256(b: Buffer): string {
  return crypto.createHash("sha256").update(b).digest("hex");
}

function dateIRS(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const jj = String(d.getUTCDate()).padStart(2, "0");
  return mm + "/" + jj + "/" + d.getUTCFullYear();
}

// Un chemin du coffre n est accepte que s il appartient a la societe de la
// session : tenant/entite/... . Un chemin recu n est jamais une autorisation.
function cheminAutorise(chemin: string, tenantId: string, entiteId: string, forme: "1120" | "5472"): boolean {
  const prefixe = tenantId + "/" + entiteId + "/" + forme + "/";
  return chemin.startsWith(prefixe) && chemin.endsWith(".pdf") && chemin.indexOf("..") < 0;
}

async function lireCoffre(chemin: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(BUCKET_DOCS).download(chemin);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

// Le trace est stocke tel que l ecran de signature l a envoye. On accepte
// une image PNG ou JPEG, en data URL ou en base64 nu. Tout autre format
// est refuse : on ne devine pas une signature.
function imageDuTrace(trace: string): { octets: Buffer; type: "png" | "jpg" } | null {
  const t = String(trace || "").trim();
  if (!t) return null;
  let base64 = t;
  let type: "png" | "jpg" | null = null;
  const m = t.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (m) {
    type = m[1].toLowerCase() === "png" ? "png" : "jpg";
    base64 = m[2];
  }
  let octets: Buffer;
  try {
    octets = Buffer.from(base64, "base64");
  } catch {
    return null;
  }
  if (octets.length < 16) return null;
  if (!type) {
    if (octets[0] === 0x89 && octets[1] === 0x50) type = "png";
    else if (octets[0] === 0xff && octets[1] === 0xd8) type = "jpg";
    else return null;
  }
  return { octets, type };
}

// ---- LA SOCIETE DE LA SESSION ----
async function entiteDeLaSession(tenantId: string, entiteDemandee: string) {
  let q = supabase
    .from("compliance_tenants")
    .select("id, label, legal_name, email_contact")
    .eq("tenant_id", tenantId);
  if (entiteDemandee) q = q.eq("id", entiteDemandee);
  const { data, error } = await q.order("label", { ascending: true }).limit(1).maybeSingle();
  if (error) throw new Error("Lecture entite : " + error.message);
  return data || null;
}

// ---- ACTION 1 : PREPARER ----
//
// Hache les deux PDF et rend le texte de l accuse de lecture. Le texte
// contient les empreintes : ce que le client signe designe sans ambiguite
// les deux fichiers qui partiront.
async function preparer(tenantId: string, entite: any, body: any) {
  const year = Number(body.year) || new Date().getFullYear();
  const chemin1120 = String(body.chemin_1120 || "").trim();
  const chemin5472 = String(body.chemin_5472 || "").trim();

  if (!cheminAutorise(chemin1120, tenantId, entite.id, "1120")) {
    return NextResponse.json({ error: "Chemin du 1120 invalide pour cette societe." }, { status: 400 });
  }
  if (!cheminAutorise(chemin5472, tenantId, entite.id, "5472")) {
    return NextResponse.json({ error: "Chemin du 5472 invalide pour cette societe." }, { status: 400 });
  }

  const [o1120, o5472] = await Promise.all([lireCoffre(chemin1120), lireCoffre(chemin5472)]);
  if (!o1120) return NextResponse.json({ error: "Le 1120 est introuvable au coffre." }, { status: 404 });
  if (!o5472) return NextResponse.json({ error: "Le 5472 est introuvable au coffre." }, { status: 404 });

  const sha1120 = sha256(o1120);
  const sha5472 = sha256(o5472);

  // GARDE-FOU 4 : chaque depense de l exercice porte son justificatif.
  const { data: sansPiece, error: eDep } = await supabase
    .from("depenses")
    .select("id, fournisseur, date_depense")
    .eq("tenant_id", tenantId)
    .eq("entite_id", entite.id)
    .gte("date_depense", year + "-01-01")
    .lte("date_depense", year + "-12-31")
    .is("pdf_url", null)
    .limit(50);

  if (eDep) {
    return NextResponse.json({ error: "Lecture des depenses : " + eDep.message }, { status: 500 });
  }

  const societe = entite.legal_name || entite.label;
  const corps =
    "Je soussigne(e), membre de " + societe + ", atteste avoir examine le formulaire 1120 pro forma "
    + "et le formulaire 5472 prepares pour l'exercice " + year + ", et je declare que les informations "
    + "qu'ils contiennent sont, a ma connaissance, exactes et completes.\n\n"
    + "Les fichiers que j'ai examines sont identifies par leur empreinte SHA-256 :\n"
    + "Form 1120 pro forma : " + sha1120 + "\n"
    + "Form 5472 : " + sha5472 + "\n\n"
    + "J'autorise la transmission de ces deux formulaires, tels quels, a l'Internal Revenue Service "
    + "par fax au numero indique dans l'instruction officielle du Form 5472 (855-887-7737, Ogden, PIN Unit). "
    + "La plateforme transmet les documents tels que je les ai signes, sans en verifier le fond. "
    + "La responsabilite de leur contenu m'appartient.\n\n"
    + "Le trace de signature que j'appose sera reproduit sur la ligne « Signature of officer » du "
    + "formulaire 1120 transmis. L'administration americaine indique qu'une signature manuscrite est "
    + "attendue sur ce formulaire ; je choisis ce mode de signature en connaissance de cause.";

  return NextResponse.json({
    success: true,
    societe: entite.label,
    year,
    chemin_1120: chemin1120,
    sha_1120: sha1120,
    chemin_5472: chemin5472,
    sha_5472: sha5472,
    // Ce que l ecran passe a /api/compliance/document-a-signer.
    document_a_signer: {
      doc_type: TYPE_ACCUSE,
      titre: "Accuse de lecture avant depot IRS " + year + " — " + societe,
      corps,
      signataire_email: entite.email_contact || null,
      entite_id: entite.id,
    },
    // S il en reste, l ecran ne propose pas la signature.
    depenses_sans_justificatif: (sansPiece || []).length,
    depenses_sans_justificatif_detail: sansPiece || [],
    pret: (sansPiece || []).length === 0,
  });
}

// ---- ACTION 2 : LIER ----
//
// L accuse vient d etre cree par document-a-signer, avec une reference. On
// lui rattache les deux PDF. Les empreintes sont RECALCULEES ici, jamais
// prises dans le corps de la requete.
async function lier(tenantId: string, entite: any, body: any) {
  const reference = String(body.reference || "").trim();
  const chemin1120 = String(body.chemin_1120 || "").trim();
  const chemin5472 = String(body.chemin_5472 || "").trim();
  const year = Number(body.year) || new Date().getFullYear();

  if (!reference) return NextResponse.json({ error: "Reference de l'accuse manquante." }, { status: 400 });
  if (!cheminAutorise(chemin1120, tenantId, entite.id, "1120") || !cheminAutorise(chemin5472, tenantId, entite.id, "5472")) {
    return NextResponse.json({ error: "Chemins invalides pour cette societe." }, { status: 400 });
  }

  const { data: doc, error: eDoc } = await supabase
    .from("compliance_documents")
    .select("id, doc_type, donnees, entite_id")
    .eq("reference", reference)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (eDoc) return NextResponse.json({ error: "Lecture de l'accuse : " + eDoc.message }, { status: 500 });
  if (!doc || doc.doc_type !== TYPE_ACCUSE || doc.entite_id !== entite.id) {
    return NextResponse.json({ error: "Accuse de lecture introuvable pour cette societe." }, { status: 404 });
  }

  const [o1120, o5472] = await Promise.all([lireCoffre(chemin1120), lireCoffre(chemin5472)]);
  if (!o1120 || !o5472) return NextResponse.json({ error: "Un des deux PDF est introuvable au coffre." }, { status: 404 });

  const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
  const depot = {
    year,
    chemin_1120: chemin1120,
    sha_1120: sha256(o1120),
    chemin_5472: chemin5472,
    sha_5472: sha256(o5472),
    lie_le: new Date().toISOString(),
  };

  const { error: eUp } = await supabase
    .from("compliance_documents")
    .update({ donnees: { ...donnees, depot } })
    .eq("id", doc.id);

  if (eUp) return NextResponse.json({ error: "Enregistrement : " + eUp.message }, { status: 500 });

  return NextResponse.json({ success: true, reference, depot });
}

// ---- ACTION 3 : TRANSMETTRE ----
async function transmettre(req: NextRequest, tenantId: string, entite: any, body: any, sessionEmail: string) {
  const cle = process.env.PHAXIO_API_KEY || "";
  const secret = process.env.PHAXIO_API_SECRET || "";
  if (!cle || !secret) {
    return NextResponse.json(
      { error: "Transmission non configuree : PHAXIO_API_KEY et PHAXIO_API_SECRET absentes." },
      { status: 503 }
    );
  }

  const reference = String(body.reference || "").trim();
  if (!reference) return NextResponse.json({ error: "Reference de l'accuse manquante." }, { status: 400 });

  // L accuse, borne au tenant et a la societe.
  const { data: doc, error: eDoc } = await supabase
    .from("compliance_documents")
    .select("id, doc_type, donnees, entite_id, signataire_email, pdf_sha256")
    .eq("reference", reference)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (eDoc) return NextResponse.json({ error: "Lecture de l'accuse : " + eDoc.message }, { status: 500 });
  if (!doc || doc.doc_type !== TYPE_ACCUSE || doc.entite_id !== entite.id) {
    return NextResponse.json({ error: "Accuse de lecture introuvable pour cette societe." }, { status: 404 });
  }

  const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
  const depot = donnees.depot;
  if (!depot || !depot.chemin_1120 || !depot.chemin_5472) {
    return NextResponse.json({ error: "Cet accuse n'est rattache a aucun formulaire. Appelez d'abord « lier »." }, { status: 409 });
  }

  // Deja transmis ? On ne faxe pas deux fois le meme accuse.
  if (donnees.transmission && donnees.transmission.fax_id) {
    return NextResponse.json(
      { error: "Ces formulaires ont deja ete transmis (fax " + donnees.transmission.fax_id + ").", transmission: donnees.transmission },
      { status: 409 }
    );
  }

  // GARDE-FOU 1 : la signature de l accuse, non annulee.
  const { data: sig, error: eSig } = await supabase
    .from("compliance_signatures")
    .select("id, signe_le, empreinte_sha256, trace_signature, signataire_email, jeton_preuve")
    .eq("document_reference", reference)
    .eq("annulee", false)
    .order("signe_le", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (eSig) return NextResponse.json({ error: "Lecture de la signature : " + eSig.message }, { status: 500 });
  if (!sig) return NextResponse.json({ error: "L'accuse de lecture n'est pas signe. Rien ne part sans sa signature." }, { status: 409 });
  if (doc.pdf_sha256 && sig.empreinte_sha256 !== doc.pdf_sha256) {
    return NextResponse.json({ error: "La signature ne porte pas sur la version archivee de l'accuse." }, { status: 409 });
  }

  const trace = imageDuTrace(sig.trace_signature || "");
  if (!trace) {
    return NextResponse.json(
      { error: "La signature ne comporte pas de trace manuscrit. Le 1120 exige une signature sur la ligne « Signature of officer » : signez a nouveau en dessinant votre signature." },
      { status: 409 }
    );
  }

  // GARDE-FOU 2 : les fichiers qui partent sont ceux qui ont ete signes.
  const [o1120, o5472] = await Promise.all([lireCoffre(depot.chemin_1120), lireCoffre(depot.chemin_5472)]);
  if (!o1120 || !o5472) return NextResponse.json({ error: "Un des deux PDF est introuvable au coffre." }, { status: 404 });
  if (sha256(o1120) !== depot.sha_1120 || sha256(o5472) !== depot.sha_5472) {
    return NextResponse.json(
      { error: "Les formulaires ont change depuis la signature. Regenerez l'accuse et faites-le signer a nouveau." },
      { status: 409 }
    );
  }

  // ---- ASSEMBLAGE, SUR COPIE ----
  const doc1120 = await PDFDocument.load(o1120);
  const gras = await doc1120.embedFont(StandardFonts.HelveticaBold);
  const police = await doc1120.embedFont(StandardFonts.Helvetica);
  const page1 = doc1120.getPage(0);
  const form1120 = doc1120.getForm();

  // La mention exigee par l instruction, en haut de la page 1.
  page1.drawText("Foreign-owned U.S. DE", { x: 200, y: MENTION_Y, size: 12, font: gras, color: rgb(0, 0, 0) });

  // Le trace signe, sur la ligne « Signature of officer ».
  const img = trace.type === "png" ? await doc1120.embedPng(trace.octets) : await doc1120.embedJpg(trace.octets);
  const echelle = Math.min(SIGN_LARGEUR_MAX / img.width, SIGN_HAUTEUR_MAX / img.height, 1);
  page1.drawImage(img, { x: SIGN_X, y: SIGN_Y, width: img.width * echelle, height: img.height * echelle });

  // La date du jour et le titre du signataire.
  page1.drawText(dateIRS(new Date()), { x: DATE_X, y: DATE_Y, size: 9, font: police, color: rgb(0, 0, 0) });
  try {
    form1120.getTextField(CHAMP_TITLE).setText(TITRE_SIGNATAIRE);
  } catch {
    page1.drawText(TITRE_SIGNATAIRE, { x: 330, y: DATE_Y, size: 9, font: police, color: rgb(0, 0, 0) });
  }

  // Aplatir : les champs deviennent du dessin, aucun service de fax ne
  // peut les perdre.
  form1120.updateFieldAppearances(police);
  form1120.flatten();

  const doc5472 = await PDFDocument.load(o5472);
  const police5472 = await doc5472.embedFont(StandardFonts.Helvetica);
  const form5472 = doc5472.getForm();
  form5472.updateFieldAppearances(police5472);
  form5472.flatten();

  // Un seul document : 1120 d abord, 5472 attache derriere.
  const envoi = await PDFDocument.create();
  const pages1120 = await envoi.copyPages(doc1120, doc1120.getPageIndices());
  for (const p of pages1120) envoi.addPage(p);
  const pages5472 = await envoi.copyPages(doc5472, doc5472.getPageIndices());
  for (const p of pages5472) envoi.addPage(p);
  envoi.setTitle("Form 1120 pro forma + Form 5472 — " + (entite.legal_name || entite.label) + " — " + depot.year);

  const octetsEnvoi = Buffer.from(await envoi.save());
  const shaEnvoi = sha256(octetsEnvoi);
  const nbPages = envoi.getPageCount();

  // ---- ARCHIVAGE DE CE QUI PART, AVANT L ENVOI ----
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const cheminEnvoi = tenantId + "/" + entite.id + "/depot/" + depot.year + "/depot-1120-5472-" + stamp + ".pdf";
  const { error: eUp } = await supabase.storage
    .from(BUCKET_DOCS)
    .upload(cheminEnvoi, octetsEnvoi, { contentType: "application/pdf", upsert: false });
  if (eUp) return NextResponse.json({ error: "Archivage du document a transmettre impossible : " + eUp.message }, { status: 500 });

  // ---- L ENVOI ----
  const hote = req.headers.get("host") || "";
  const callback = "https://" + hote + "/api/compliance/transmettre/statut?ref=" + encodeURIComponent(reference);

  const fd = new FormData();
  fd.append("to", FAX_IRS);
  fd.append("file", new Blob([octetsEnvoi], { type: "application/pdf" }), "depot-1120-5472.pdf");
  fd.append("callback_url", callback);
  fd.append("header_text", "Foreign-owned U.S. DE - " + (entite.legal_name || entite.label));
  fd.append("tag[reference]", reference);

  let reponse: any = null;
  let faxId: string | null = null;
  try {
    const r = await fetch(PHAXIO_URL, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(cle + ":" + secret).toString("base64") },
      body: fd,
    });
    reponse = await r.json().catch(() => null);
    if (r.ok && reponse && reponse.success && reponse.data && reponse.data.id) {
      faxId = String(reponse.data.id);
    }
  } catch (e: unknown) {
    reponse = { erreur: e instanceof Error ? e.message : String(e) };
  }

  const transmission = {
    prestataire: "phaxio",
    fax_id: faxId,
    numero: FAX_IRS,
    envoye_le: new Date().toISOString(),
    envoye_par: sessionEmail,
    chemin_envoi: cheminEnvoi,
    sha_envoi: shaEnvoi,
    pages: nbPages,
    statut: faxId ? "en_cours" : "echec_envoi",
    reponse_prestataire: reponse,
  };

  // L accuse de lecture porte la transmission ; une ligne DOC_TYPE_DEPOT
  // range le document envoye lui-meme.
  await supabase
    .from("compliance_documents")
    .update({ donnees: { ...donnees, transmission } })
    .eq("id", doc.id);

  await supabase.from("compliance_documents").insert({
    tenant_id: tenantId,
    entite_id: entite.id,
    rule_code: "US_5472_1120",
    doc_type: DOC_TYPE_DEPOT,
    title: "Depot IRS par fax — 1120 pro forma + 5472 — " + depot.year,
    version: 1,
    reference: reference,
    signataire_email: doc.signataire_email,
    storage_path: cheminEnvoi,
    pdf_chemin: cheminEnvoi,
    pdf_sha256: shaEnvoi,
    file_hash: shaEnvoi,
    pdf_octets: octetsEnvoi.length,
    size_bytes: octetsEnvoi.length,
    mime_type: "application/pdf",
    donnees: { transmission, accuse_reference: reference, signature_id: sig.id },
  });

  if (!faxId) {
    return NextResponse.json(
      { error: "Le prestataire de fax a refuse l'envoi. Le document assemble est archive ; rien n'est parti.", transmission },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    reference,
    fax_id: faxId,
    pages: nbPages,
    chemin_envoi: cheminEnvoi,
    sha_envoi: shaEnvoi,
    message: "Transmis au " + FAX_IRS + ". L'accuse de transmission sera enregistre a la reception du statut.",
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    const session = sessionCourante();
    const tenantId = session ? session.tenantId : null;
    if (!tenantId) {
      return NextResponse.json({ error: "Session sans societe rattachee. Reconnectez-vous." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").trim();
    const entite = await entiteDeLaSession(tenantId, String(body.entite_id || "").trim());
    if (!entite) return NextResponse.json({ error: "Societe introuvable." }, { status: 404 });

    if (action === "preparer") return await preparer(tenantId, entite, body);
    if (action === "lier") return await lier(tenantId, entite, body);
    if (action === "transmettre") return await transmettre(req, tenantId, entite, body, session ? session.email : "");

    return NextResponse.json({ error: "Action inconnue : preparer, lier ou transmettre." }, { status: 400 });
  } catch (e: unknown) {
    console.error("[transmettre] exception :", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
