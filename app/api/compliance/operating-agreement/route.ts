import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// L OPERATING AGREEMENT — 09/09. Modele d une LLC a membre unique, rendu
// pret pour /api/compliance/document-a-signer (type « convention »), puis
// rattache au dossier de creation par creation?action=oa. Le texte est un
// MODELE d usage courant (Wyoming, single-member LLC, disregarded
// entity) : le titulaire le relit ; ce n est pas un avis juridique.
//
// 🆕 23/09 (soir) — LE PACTE DEVIENT UN DOCUMENT A PART ENTIERE. Il etait
// ecrit dans l habillage de nos attestations (« Document etabli le… ») :
// rien ne le distinguait d un formulaire maison, et il n avait AUCUNE LIGNE
// DE SIGNATURE. Jacques : « ca doit etre pareil pour tout ». La regle,
// commune a tous les documents :
//   ATTESTATION (notre page, en francais) → LE VRAI DOCUMENT joint →
//   la signature reportee sur LA LIGNE DE SIGNATURE DU VRAI DOCUMENT.
// Le pacte est donc produit ici en PDF, en anglais, au format lettre US,
// avec son bloc « MEMBER » ; il est range au coffre, puis joint a
// l attestation par document-a-signer. La piece jointe DECLARE ELLE-MEME ou
// se pose sa signature (annexes[].signature) : l affichage du document signe
// y reporte le trace et la date.
//
// 🆕 23/09 — LE LIBELLE. Le type « convention » reste (il entre dans le
// sceau de chaque signature, on n y touche pas), mais le document part avec
// le libelle « Operating Agreement » : il s affichait « Convention de
// prestation » sur la page de signature et en tete du PDF.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function dateLongue(d: any): string {
  return new Date(d || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function corpsOA(e: any, c: any): string {
  const nom = e.legal_name || e.label, etat = e.formation_state === "WY" ? "Wyoming" : (e.formation_state || "the State of formation");
  const membre = c.responsable_nom || "the Member";
  return [
    "OPERATING AGREEMENT OF " + String(nom).toUpperCase(),
    "A " + etat + " Single-Member Limited Liability Company",
    "",
    "This Operating Agreement (the \"Agreement\") is entered into as of " + dateLongue(c.statuts_deposes_le || e.formation_date) + " by " + membre + " (the \"Member\"), the sole member of " + nom + " (the \"Company\").",
    "",
    "1. Formation. The Company was formed as a limited liability company under the laws of the State of " + etat + " by the filing of Articles of Organization" + (c.statuts_numero ? " (filing number " + c.statuts_numero + ")" : "") + ". The rights and obligations of the Member are governed by this Agreement and by the " + etat + " Limited Liability Company Act.",
    "2. Name and principal office. The name of the Company is " + nom + ". Its principal office is located at " + (e.principal_office_address || e.mailing_address || "the address stated in the Articles of Organization") + ". Its registered agent is " + (c.agent_prestataire || e.registered_agent_name || "as stated in the Articles of Organization") + ".",
    "3. Purpose. The Company may engage in any lawful business" + (c.activite_libelle ? ", including " + c.activite_libelle : "") + ".",
    "4. Sole Member. The Member is the sole member of the Company and holds one hundred percent (100%) of the membership interest. No other person has any interest in the Company.",
    "5. Management. The Company is managed by its Member. The Member has full authority to act for and bind the Company, to open bank accounts, to sign contracts and to make all decisions concerning the Company.",
    "6. Capital contributions. The Member may make capital contributions in cash, property or services, and may advance funds to the Company on behalf of the Company. Advances made by the Member are recorded in the Company's books as contributions or loans, as the Member determines, and are reported as required by law.",
    "7. Distributions. Distributions are made to the Member at such times and in such amounts as the Member determines, provided the Company remains able to pay its debts as they become due.",
    "8. Tax classification. The Company, having a single member, is disregarded as an entity separate from its owner for United States federal income tax purposes unless it elects otherwise. The Member acknowledges the information-reporting obligations of a foreign-owned disregarded entity, including Form 5472 with a pro forma Form 1120.",
    "9. Limited liability. The Member is not personally liable for the debts, obligations or liabilities of the Company solely by reason of being a member.",
    "10. Books and records. The Company keeps complete books and records, including all contributions, distributions and transactions between the Company and the Member, and keeps them for the period required by law.",
    "11. Dissolution. The Company may be dissolved by the decision of the Member, or as otherwise provided by law. Upon dissolution, the Company's affairs are wound up, its debts paid and any remaining assets distributed to the Member.",
    "12. Entire agreement. This Agreement is the entire operating agreement of the Company and may be amended only in writing by the Member.",
    "",
    "IN WITNESS WHEREOF, the Member has executed this Agreement as of the date first written above. The electronic signature of this document by the Member constitutes execution.",
  ].join("\n");
}

// Les caracteres que la police standard du PDF ne sait pas ecrire deviennent
// « ? » plutot que de faire echouer le document.
function pourPdf(t: unknown): string {
  return String(t ?? "").replace(/[\u202F\u00A0]/g, " ").replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D]/g, "?");
}

// ---- LE PACTE EN PDF, AVEC SON BLOC DE SIGNATURE ----
// Rend le fichier et l emplacement de la signature : page (dans le pacte),
// cadre du trace (x, y, l, h) et position de la date.
async function pactePDF(e: any, c: any): Promise<{ octets: Uint8Array; signature: any }> {
  const nom = e.legal_name || e.label;
  const membre = c.responsable_nom || "the Member";
  const pdf = await PDFDocument.create();
  pdf.setTitle(pourPdf("Operating Agreement — " + nom));
  const police = await pdf.embedFont(StandardFonts.TimesRoman);
  const gras = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const L = 612, H = 792, M = 72, UTILE = L - 2 * M;
  const NOIR = rgb(0, 0, 0);
  let page = pdf.addPage([L, H]);
  let y = H - M;
  const nouvelle = function () { page = pdf.addPage([L, H]); y = H - M; };
  const decoupe = function (texte: string, fonte: any, taille: number): string[] {
    const mots = pourPdf(texte).split(/\s+/).filter(function (m) { return m.length > 0; });
    const out: string[] = []; let l = "";
    for (const mot of mots) {
      const essai = l ? l + " " + mot : mot;
      if (fonte.widthOfTextAtSize(essai, taille) <= UTILE) l = essai; else { if (l) out.push(l); l = mot; }
    }
    if (l) out.push(l);
    return out;
  };
  const ecrire = function (texte: string, fonte: any, taille: number, centre?: boolean) {
    for (const l of decoupe(texte, fonte, taille)) {
      if (y < M + taille) nouvelle();
      const x = centre ? (L - fonte.widthOfTextAtSize(l, taille)) / 2 : M;
      page.drawText(l, { x: x, y: y, size: taille, font: fonte, color: NOIR });
      y = y - taille * 1.45;
    }
  };

  const lignes = corpsOA(e, c).split("\n");
  // Les deux premieres lignes sont le titre, centrees.
  ecrire(lignes[0], gras, 14, true);
  ecrire(lignes[1], police, 11.5, true);
  y = y - 14;
  for (const l of lignes.slice(2)) {
    if (!l.trim()) { y = y - 6; continue; }
    ecrire(l, police, 11.5);
    y = y - 4;
  }

  // ---- Le bloc de signature ----
  if (y < M + 150) nouvelle();
  y = y - 24;
  ecrire("MEMBER:", gras, 11.5);
  y = y - 40;
  const ligneY = y;
  page.drawLine({ start: { x: M, y: ligneY }, end: { x: M + 240, y: ligneY }, thickness: 0.8, color: NOIR });
  const signature = { page: pdf.getPageCount() - 1, x: M + 4, y: ligneY + 2, l: 220, h: 34, date_x: M + 36, date_y: 0, date_format: "us_long" };
  y = ligneY - 14;
  page.drawText(pourPdf("Name: " + membre), { x: M, y: y, size: 11, font: police, color: NOIR });
  y = y - 16;
  page.drawText("Title: Sole Member", { x: M, y: y, size: 11, font: police, color: NOIR });
  y = y - 16;
  page.drawText("Date:", { x: M, y: y, size: 11, font: police, color: NOIR });
  page.drawLine({ start: { x: M + 32, y: y - 2 }, end: { x: M + 240, y: y - 2 }, thickness: 0.6, color: NOIR });
  signature.date_y = y;

  return { octets: await pdf.save(), signature };
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const session = sessionCourante();
    if (!session || !session.tenantId) return NextResponse.json({ error: "Session sans société rattachée." }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    let q = supabase.from("compliance_tenants").select("id, label, legal_name, formation_state, formation_date, principal_office_address, mailing_address, registered_agent_name, email_contact").eq("tenant_id", session.tenantId);
    if (b.entite_id) q = q.eq("id", String(b.entite_id));
    const { data: e } = await q.order("label").limit(1).maybeSingle();
    if (!e) return NextResponse.json({ error: "Société introuvable." }, { status: 404 });
    const { data: c } = await supabase.from("compliance_creations").select("*").eq("entite_id", e.id).maybeSingle();
    if (!c) return NextResponse.json({ error: "Aucun dossier de création." }, { status: 404 });
    if (!e.email_contact) return NextResponse.json({ error: "Renseignez l'adresse de contact de la société : c'est elle qui signe." }, { status: 400 });
    // 🆕 23/09 (soir) — le pacte, produit et archive au coffre.
    const nom = e.legal_name || e.label;
    const membre = c.responsable_nom || "le membre";
    const { octets, signature } = await pactePDF(e, c);
    const sha = crypto.createHash("sha256").update(Buffer.from(octets)).digest("hex");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const chemin = session.tenantId + "/" + e.id + "/oa/operating-agreement-" + stamp + ".pdf";
    const { error: eUp } = await supabase.storage.from("compliance-docs").upload(chemin, Buffer.from(octets), { contentType: "application/pdf", upsert: false });
    if (eUp) return NextResponse.json({ error: "Archivage du pacte impossible. Rien n'a été envoyé." }, { status: 500 });

    // L attestation, en francais : ce qu on signe, et ce qui est joint.
    const corps =
      "Je soussigné(e), " + membre + ", membre unique de " + nom + ", déclare avoir lu l'Operating Agreement (le pacte de la société) "
      + "reproduit à la suite de cette page, et l'adopter tel qu'il est rédigé.\n\n"
      + "Le pacte est identifié par son empreinte SHA-256 : " + sha + "\n\n"
      + "Ma signature électronique vaut signature de l'Operating Agreement. Son tracé est reporté sur la ligne « Member » du pacte, "
      + "avec la date de signature.";
    return NextResponse.json({
      success: true, corps, pacte_chemin: chemin, pacte_sha256: sha,
      document_a_signer: {
        doc_type: "convention", libelle: "Operating Agreement", titre: "Operating Agreement — " + nom, corps,
        signataire_email: e.email_contact, entite_id: e.id,
        annexes: [{ chemin, titre: "Operating Agreement — " + nom, signature }],
      },
    });
  } catch (ex: unknown) {
    return NextResponse.json({ error: ex instanceof Error ? ex.message : String(ex) }, { status: 500 });
  }
}
