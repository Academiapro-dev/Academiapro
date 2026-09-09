import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../../lib/session";
import { origineLegitime } from "../../../../../lib/origine";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// TRANSMETTRE LE SS-4 A L IRS PAR FAX — 09/09. Jumelle de
// /api/compliance/transmettre (le 1120 + 5472), sur la meme chaine :
//   preparer    : hache le SS-4 genere, rend le texte de l accuse de
//                 lecture (l ecran appelle ensuite document-a-signer) ;
//   lier        : rattache la reference SIG-… au dossier de creation ;
//   transmettre : verifie la signature et l empreinte, pose le trace, la
//                 date et le numero de fax de retour sur le SS-4, aplatit,
//                 archive, faxe (Sinch v3), ecrit compliance_creations.
//   etat        : ou en est le SS-4 (pour le chemin d etapes).
//
// 🚨 LE NUMERO DE FAX DE RETOUR EST CELUI QUI RECOIT L EIN. C est
// SINCH_FAX_FROM : il DOIT etre configure en reception chez Sinch (webhook
// « fax recu ») avant le premier envoi reel, sinon l EIN part dans le
// vide et l IRS refuse une seconde demande. La route refuse d envoyer si
// SS4_FAX_RETOUR_ACTIF n est pas « 1 » (garde-fou, a poser dans Vercel
// une fois la reception verifiee).
// 🚨 JAMAIS DEUX ENVOIS pour la meme societe : ss4_fax_id bloque.
// ⚠️ FAX_NUMERO_TEST (s il existe) detourne l envoi vers la simulation,
// comme pour le 5472. A retirer avant un vrai envoi.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BUCKET = "compliance-docs";
const SINCH_URL = "https://fax.api.sinch.com/v3/projects/";
const TYPE_ACCUSE = "accuse_lecture";
const FAX_SS4_US = (process.env.FAX_SS4_US || "+18556416935").trim();
const FAX_SS4_INTL = (process.env.FAX_SS4_INTL || "+18552151627").trim();

// Positions mesurees sur le SS-4 rev. 12-2025 (612 x 792 pt) : la ligne
// « Signature » est en bas a gauche, « Date » au centre, « Applicant s fax
// number » a droite (pas de champ de formulaire pour ces trois-la).
const SIGN_X = 100, SIGN_Y = 44, SIGN_L = 150, SIGN_H = 26;
const DATE_X = 345, DATE_Y = 46;
const FAX_X = 436, FAX_Y = 38;

function sha256(b: Buffer): string { return crypto.createHash("sha256").update(b).digest("hex"); }
function dateIRS(d: Date): string {
  return String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + String(d.getUTCDate()).padStart(2, "0") + "/" + d.getUTCFullYear();
}
function imageDuTrace(trace: string): { octets: Buffer; type: "png" | "jpg" } | null {
  const t = String(trace || "").trim(); if (!t) return null;
  let base64 = t; let type: "png" | "jpg" | null = null;
  const m = t.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (m) { type = m[1].toLowerCase() === "png" ? "png" : "jpg"; base64 = m[2]; }
  let octets: Buffer; try { octets = Buffer.from(base64, "base64"); } catch { return null; }
  if (octets.length < 16) return null;
  if (!type) { if (octets[0] === 0x89 && octets[1] === 0x50) type = "png"; else if (octets[0] === 0xff && octets[1] === 0xd8) type = "jpg"; else return null; }
  return { octets, type };
}
function siegeAuxEtatsUnis(adresse: unknown): boolean {
  const s = String(adresse ?? "").toUpperCase();
  return /\b(WY|DE|NM|NV|FL|TX|MT|CA|NY|USA|UNITED STATES)\b/.test(s) && !/FRANCE|BELGI|SUISSE|LUXEMBOURG/.test(s);
}
async function lireCoffre(chemin: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(chemin);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    const session = sessionCourante();
    const tenantId = session ? session.tenantId : null;
    if (!tenantId) return NextResponse.json({ error: "Session sans societe rattachee. Reconnectez-vous." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").trim();

    let q = supabase.from("compliance_tenants").select("id, label, legal_name, email_contact, principal_office_address, mailing_address").eq("tenant_id", tenantId);
    if (body.entite_id) q = q.eq("id", String(body.entite_id));
    const { data: entite } = await q.order("label").limit(1).maybeSingle();
    if (!entite) return NextResponse.json({ error: "Societe introuvable." }, { status: 404 });

    const { data: cre } = await supabase.from("compliance_creations").select("*").eq("tenant_id", tenantId).eq("entite_id", entite.id).maybeSingle();
    if (!cre) return NextResponse.json({ error: "Aucun dossier de creation pour cette societe." }, { status: 404 });

    // ---- ETAT ----
    if (action === "etat") {
      let statut = cre.statut;
      if (cre.ss4_reference_accuse && !cre.ss4_fax_id) {
        const { data: sig } = await supabase.from("compliance_signatures").select("id").eq("document_reference", cre.ss4_reference_accuse).eq("annulee", false).limit(1).maybeSingle();
        if (sig && statut !== "ss4_signe") { statut = "ss4_signe"; await supabase.from("compliance_creations").update({ statut, maj_le: new Date().toISOString() }).eq("id", cre.id); }
      }
      return NextResponse.json({ success: true, statut, ss4_chemin: cre.ss4_chemin, reference: cre.ss4_reference_accuse, fax_id: cre.ss4_fax_id, ein: cre.ein, transmis_le: cre.ss4_transmis_le });
    }

    // ---- PREPARER ----
    if (action === "preparer") {
      if (!cre.ss4_chemin) return NextResponse.json({ error: "Generez d'abord le SS-4." }, { status: 409 });
      if (cre.ss4_fax_id) return NextResponse.json({ error: "Le SS-4 a deja ete transmis (fax " + cre.ss4_fax_id + ")." }, { status: 409 });
      const pdf = await lireCoffre(cre.ss4_chemin);
      if (!pdf) return NextResponse.json({ error: "SS-4 introuvable au coffre." }, { status: 404 });
      const sha = sha256(pdf);
      const societe = entite.legal_name || entite.label;
      const corps =
        "Je soussigne(e), membre de " + societe + ", atteste avoir examine le formulaire SS-4 (demande de numero d'identification "
        + "d'employeur, EIN) prepare pour ma societe, et je declare que les informations qu'il contient sont, a ma connaissance, exactes et completes.\n\n"
        + "Le fichier examine est identifie par son empreinte SHA-256 : " + sha + "\n\n"
        + "J'autorise sa transmission a l'Internal Revenue Service par fax, au numero indique par l'instruction officielle du formulaire SS-4. "
        + "Je comprends que l'IRS repondra par fax au numero de retour indique sur le formulaire, sous quelques jours ouvres, et qu'une seconde "
        + "demande pour la meme societe serait refusee : je ne demanderai pas de nouvel envoi avant la reponse de l'IRS.\n\n"
        + "Le trace de signature que j'appose sera reproduit sur la ligne « Signature » du formulaire SS-4 transmis ; je choisis ce mode de signature en connaissance de cause.";
      return NextResponse.json({
        success: true, sha_ss4: sha, chemin_ss4: cre.ss4_chemin,
        document_a_signer: { doc_type: TYPE_ACCUSE, titre: "Accuse de lecture avant demande d'EIN — " + societe, corps, signataire_email: entite.email_contact || null, entite_id: entite.id },
        pret: !!entite.email_contact,
      });
    }

    // ---- LIER ----
    if (action === "lier") {
      const reference = String(body.reference || "").trim();
      if (!reference) return NextResponse.json({ error: "Reference manquante." }, { status: 400 });
      const pdf = cre.ss4_chemin ? await lireCoffre(cre.ss4_chemin) : null;
      if (!pdf) return NextResponse.json({ error: "SS-4 introuvable au coffre." }, { status: 404 });
      const { data: doc } = await supabase.from("compliance_documents").select("id, doc_type, donnees").eq("reference", reference).eq("tenant_id", tenantId).eq("entite_id", entite.id).maybeSingle();
      if (!doc || doc.doc_type !== TYPE_ACCUSE) return NextResponse.json({ error: "Accuse introuvable pour cette societe." }, { status: 404 });
      const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
      await supabase.from("compliance_documents").update({ donnees: { ...donnees, depot: { formulaire: "ss4", chemin_ss4: cre.ss4_chemin, sha_ss4: sha256(pdf), lie_le: new Date().toISOString() } } }).eq("id", doc.id);
      await supabase.from("compliance_creations").update({ ss4_reference_accuse: reference, ss4_sha256: sha256(pdf), statut: "ss4_accuse_envoye", maj_le: new Date().toISOString() }).eq("id", cre.id);
      return NextResponse.json({ success: true, reference });
    }

    // ---- TRANSMETTRE ----
    if (action === "transmettre") {
      const projet = (process.env.SINCH_PROJECT_ID || "").trim(), cle = (process.env.SINCH_ACCESS_KEY || "").trim(), secret = (process.env.SINCH_ACCESS_SECRET || "").trim();
      const jeton = (process.env.FAX_CALLBACK_TOKEN || "").trim(), emetteur = (process.env.SINCH_FAX_FROM || "").trim();
      if (!projet || !cle || !secret || !jeton || !emetteur) return NextResponse.json({ error: "Transmission non configuree (variables Sinch)." }, { status: 503 });
      const numeroTest = (process.env.FAX_NUMERO_TEST || "").trim();
      if (!numeroTest && (process.env.SS4_FAX_RETOUR_ACTIF || "").trim() !== "1") {
        return NextResponse.json({ error: "Le numero de fax de retour n'est pas encore configure en reception chez Sinch (SS4_FAX_RETOUR_ACTIF). Sans lui, l'EIN renvoye par l'IRS serait perdu. Rien n'est parti." }, { status: 503 });
      }
      if (cre.ss4_fax_id) return NextResponse.json({ error: "Deja transmis (fax " + cre.ss4_fax_id + "). L'IRS refuse les doublons." }, { status: 409 });
      const reference = String(cre.ss4_reference_accuse || body.reference || "").trim();
      if (!reference) return NextResponse.json({ error: "Aucun accuse rattache. Appelez d'abord « preparer » puis « lier »." }, { status: 409 });

      const { data: doc } = await supabase.from("compliance_documents").select("id, donnees, signataire_email, pdf_sha256").eq("reference", reference).eq("tenant_id", tenantId).maybeSingle();
      if (!doc) return NextResponse.json({ error: "Accuse introuvable." }, { status: 404 });
      const { data: sig } = await supabase.from("compliance_signatures").select("id, empreinte_sha256, trace_signature").eq("document_reference", reference).eq("annulee", false).order("signe_le", { ascending: false }).limit(1).maybeSingle();
      if (!sig) return NextResponse.json({ error: "L'accuse n'est pas signe. Rien ne part sans sa signature." }, { status: 409 });
      if (doc.pdf_sha256 && sig.empreinte_sha256 !== doc.pdf_sha256) return NextResponse.json({ error: "La signature ne porte pas sur la version archivee de l'accuse." }, { status: 409 });
      const trace = imageDuTrace(sig.trace_signature || "");
      if (!trace) return NextResponse.json({ error: "La signature ne comporte pas de trace manuscrit : signez a nouveau en dessinant." }, { status: 409 });

      const pdf = cre.ss4_chemin ? await lireCoffre(cre.ss4_chemin) : null;
      if (!pdf) return NextResponse.json({ error: "SS-4 introuvable au coffre." }, { status: 404 });
      if (cre.ss4_sha256 && sha256(pdf) !== cre.ss4_sha256) return NextResponse.json({ error: "Le SS-4 a change depuis la signature. Recommencez la preparation." }, { status: 409 });

      const d = await PDFDocument.load(pdf, { ignoreEncryption: true });
      const police = await d.embedFont(StandardFonts.Helvetica);
      const page = d.getPage(0);
      const img = trace.type === "png" ? await d.embedPng(trace.octets) : await d.embedJpg(trace.octets);
      const e = Math.min(SIGN_L / img.width, SIGN_H / img.height, 1);
      page.drawImage(img, { x: SIGN_X, y: SIGN_Y, width: img.width * e, height: img.height * e });
      page.drawText(dateIRS(new Date()), { x: DATE_X, y: DATE_Y, size: 9, font: police, color: rgb(0, 0, 0) });
      page.drawText(emetteur, { x: FAX_X, y: FAX_Y, size: 9, font: police, color: rgb(0, 0, 0) });
      const form = d.getForm(); form.updateFieldAppearances(police); form.flatten();
      const envoi = Buffer.from(await d.save());
      const shaEnvoi = sha256(envoi);

      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const cheminEnvoi = tenantId + "/" + entite.id + "/ss4/envoi/ss4-" + stamp + ".pdf";
      const { error: eUp } = await supabase.storage.from(BUCKET).upload(cheminEnvoi, envoi, { contentType: "application/pdf", upsert: false });
      if (eUp) return NextResponse.json({ error: "Archivage impossible : " + eUp.message }, { status: 500 });

      const destinataire = numeroTest || (siegeAuxEtatsUnis(entite.principal_office_address || entite.mailing_address) ? FAX_SS4_US : FAX_SS4_INTL);
      const hote = req.headers.get("host") || "";
      const callback = "https://" + hote + "/api/compliance/transmettre/statut?ref=" + encodeURIComponent(reference) + "&cle=" + encodeURIComponent(jeton);
      const fd = new FormData();
      fd.append("to", destinataire); fd.append("from", emetteur);
      fd.append("file", new Blob([envoi], { type: "application/pdf" }), "ss4.pdf");
      fd.append("callbackUrl", callback); fd.append("callbackUrlContentType", "application/json");

      let reponse: any = null, faxId: string | null = null;
      try {
        const r = await fetch(SINCH_URL + encodeURIComponent(projet) + "/faxes", { method: "POST", headers: { Authorization: "Basic " + Buffer.from(cle + ":" + secret).toString("base64") }, body: fd });
        const texte = await r.text().catch(() => ""); let json: any = null; try { json = texte ? JSON.parse(texte) : null; } catch { json = null; }
        reponse = { http: r.status, corps: json ?? texte.slice(0, 600) };
        if (r.ok && json && json.id) faxId = String(json.id);
      } catch (ex: unknown) { reponse = { erreur: ex instanceof Error ? ex.message : String(ex) }; }

      const transmission = { prestataire: "sinch_fax_v3", formulaire: "ss4", mode_test: !!numeroTest, fax_id: faxId, numero: destinataire, emetteur, fax_retour: emetteur, envoye_le: new Date().toISOString(), envoye_par: session ? session.email : "", chemin_envoi: cheminEnvoi, sha_envoi: shaEnvoi, statut: faxId ? "en_cours" : "echec_envoi", reponse_prestataire: reponse };
      const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
      await supabase.from("compliance_documents").update({ donnees: { ...donnees, transmission } }).eq("id", doc.id);
      await supabase.from("compliance_documents").insert({ tenant_id: tenantId, entite_id: entite.id, rule_code: "US_EIN", doc_type: "depot_irs_fax", title: "Demande d'EIN par fax — SS-4 — " + (entite.legal_name || entite.label), version: 1, reference, signataire_email: doc.signataire_email, storage_path: cheminEnvoi, pdf_chemin: cheminEnvoi, pdf_sha256: shaEnvoi, file_hash: shaEnvoi, pdf_octets: envoi.length, size_bytes: envoi.length, mime_type: "application/pdf", donnees: { transmission, accuse_reference: reference, signature_id: sig.id } });
      if (faxId) await supabase.from("compliance_creations").update({ ss4_fax_id: faxId, ss4_transmis_le: transmission.envoye_le, statut: "ss4_transmis", maj_le: new Date().toISOString() }).eq("id", cre.id);

      if (!faxId) return NextResponse.json({ error: "Le prestataire a refuse l'envoi (HTTP " + (reponse && reponse.http ? reponse.http : "?") + "). Rien n'est parti.", transmission }, { status: 502 });
      return NextResponse.json({ success: true, fax_id: faxId, numero: destinataire, mode_test: !!numeroTest, chemin_envoi: cheminEnvoi, message: (numeroTest ? "MODE TEST — envoye au numero de simulation " : "SS-4 transmis a l'IRS au ") + destinataire + ". L'EIN reviendra par fax au " + emetteur + " sous quelques jours ouvres." });
    }

    return NextResponse.json({ error: "Action inconnue : etat, preparer, lier ou transmettre." }, { status: 400 });
  } catch (e: unknown) {
    console.error("[ss4/transmettre] exception :", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
