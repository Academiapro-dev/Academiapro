import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, AFRelationship } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const EXPEDITEUR = "Mr. Comptable <contact@academiapro.fr>";

function euros(n: any): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

function jolieDate(d: any): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch (e) {
    return "";
  }
}

function echapper(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// LE FORMAT AAAAMMJJ, seul accepte par le profil CII sous le code 102.
function dateFacturX(d: any): string {
  if (!d) return "";
  const t = String(d).slice(0, 10);
  return t.replace(/-/g, "");
}

// ---------------------------------------------------------------------------
// LES MENTIONS OBLIGATOIRES D UNE FACTURE FRANCAISE.
//
// Article 242 nonies A de l annexe II au CGI. Leur absence est sanctionnee
// par une amende de 15 euros PAR MENTION ET PAR FACTURE, plafonnee au quart
// du montant. Un cabinet qui verrait une facture incomplete fermerait le
// logiciel sans rien dire.
//
// 🚨 LA MENTION DES PENALITES DE RETARD ET DE L INDEMNITE DE 40 EUROS EST
// OBLIGATOIRE ENTRE PROFESSIONNELS. C est l article L441-10 du code de
// commerce, et c est la mention que les logiciels oublient le plus souvent.
// ---------------------------------------------------------------------------
function genererHTML(doc: any, lignes: any[], emetteur: any): string {
  const or = emetteur && emetteur.couleur ? emetteur.couleur : "#c8a96e";
  const estAvoir = doc.type === "avoir";
  const estDevis = doc.type === "devis";

  const titre = estDevis ? "DEVIS" : estAvoir ? "AVOIR" : "FACTURE";

  const rangs = lignes.map(function (l: any) {
    return "<tr>"
      + "<td class=\"g\">" + echapper(l.designation)
      + (l.detail ? "<div class=\"petit\">" + echapper(l.detail) + "</div>" : "")
      + "</td>"
      + "<td class=\"d\">" + (Number(l.quantite) || 0) + (l.unite ? " " + echapper(l.unite) : "") + "</td>"
      + "<td class=\"d\">" + euros(l.prix_unitaire) + "</td>"
      + "<td class=\"d\">" + ((Number(l.remise_pct) || 0) > 0 ? l.remise_pct + " %" : "—") + "</td>"
      + "<td class=\"d\">" + (Number(l.taux_tva) || 0) + " %</td>"
      + "<td class=\"d f\">" + euros(l.total_ht) + "</td>"
      + "</tr>";
  }).join("");

  // La ventilation de TVA par taux : obligatoire des qu il y a plusieurs
  // taux sur la meme facture.
  const parTaux: any = {};
  for (const l of lignes) {
    const t = String(Number(l.taux_tva) || 0);
    if (!parTaux[t]) parTaux[t] = { base: 0, tva: 0 };
    parTaux[t].base = parTaux[t].base + (Number(l.total_ht) || 0);
    parTaux[t].tva = parTaux[t].tva + (Number(l.total_tva) || 0);
  }

  const tauxLignes = Object.keys(parTaux).sort().map(function (t) {
    return "<tr><td>" + t + " %</td><td class=\"d\">" + euros(parTaux[t].base)
      + "</td><td class=\"d\">" + euros(parTaux[t].tva) + "</td></tr>";
  }).join("");

  return "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\">"
    + "<style>"
    + "@page { size: A4; margin: 14mm 15mm; }"
    + "* { box-sizing: border-box; }"
    + "body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; font-size: 10.5pt; line-height: 1.5; margin: 0; }"
    + ".tete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid " + or + "; padding-bottom: 12px; margin-bottom: 22px; }"
    + ".emet { max-width: 55%; }"
    + ".emet .nom { font-size: 15pt; font-weight: bold; color: " + or + "; margin-bottom: 4px; }"
    + ".emet .l { font-size: 9pt; color: #444; }"
    + ".doc { text-align: right; }"
    + ".doc .t { font-size: 22pt; font-weight: bold; color: " + or + "; letter-spacing: 2px; }"
    + ".doc .n { font-size: 13pt; margin-top: 3px; }"
    + ".doc .d { font-size: 9pt; color: #555; margin-top: 5px; }"
    + ".cadre { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }"
    + ".bloc { border: 1px solid #ddd; border-radius: 5px; padding: 11px 14px; width: 48%; }"
    + ".bloc .e { font-size: 8pt; letter-spacing: 1.5px; color: " + or + "; margin-bottom: 5px; }"
    + ".bloc .n { font-weight: bold; font-size: 11pt; margin-bottom: 3px; }"
    + ".bloc .l { font-size: 9pt; color: #444; }"
    + ".objet { margin-bottom: 16px; font-size: 10pt; }"
    + ".objet strong { color: " + or + "; }"
    + "table.lignes { width: 100%; border-collapse: collapse; margin-bottom: 18px; }"
    + "table.lignes th { background: " + or + "; color: #fff; font-size: 8.5pt; letter-spacing: 0.5px; padding: 7px 9px; text-align: left; }"
    + "table.lignes td { border-bottom: 1px solid #e5e5e5; padding: 8px 9px; font-size: 10pt; vertical-align: top; }"
    + "table.lignes td.d { text-align: right; white-space: nowrap; }"
    + "table.lignes td.f { font-weight: bold; }"
    + ".petit { font-size: 8.5pt; color: #666; margin-top: 2px; }"
    + ".bas { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 20px; }"
    + "table.tva { border-collapse: collapse; font-size: 9pt; }"
    + "table.tva td { border: 1px solid #ddd; padding: 5px 10px; }"
    + ".totaux { min-width: 230px; }"
    + ".totaux .l { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10.5pt; }"
    + ".totaux .ttc { border-top: 2px solid " + or + "; margin-top: 6px; padding-top: 8px; font-size: 13pt; font-weight: bold; color: " + or + "; }"
    + ".mentions { border-top: 1px solid #ddd; padding-top: 12px; font-size: 8pt; color: #555; line-height: 1.6; }"
    + ".mentions .g { font-weight: bold; color: #333; }"
    + "</style></head><body>"

    + "<div class=\"tete\">"
    + "<div class=\"emet\">"
    + "<div class=\"nom\">" + echapper(emetteur.raison_sociale || "Cabinet") + "</div>"
    + (emetteur.adresse ? "<div class=\"l\">" + echapper(emetteur.adresse) + "</div>" : "")
    + (emetteur.telephone ? "<div class=\"l\">Tél. " + echapper(emetteur.telephone) + "</div>" : "")
    + (emetteur.email_contact ? "<div class=\"l\">" + echapper(emetteur.email_contact) + "</div>" : "")
    + (emetteur.siret ? "<div class=\"l\">SIRET " + echapper(emetteur.siret) + "</div>" : "")
    + (emetteur.numero_tva ? "<div class=\"l\">TVA " + echapper(emetteur.numero_tva) + "</div>" : "")
    + "</div>"
    + "<div class=\"doc\">"
    + "<div class=\"t\">" + titre + "</div>"
    + "<div class=\"n\">" + echapper(doc.numero || "brouillon") + "</div>"
    + "<div class=\"d\">Émis" + (estDevis ? "" : "e") + " le " + jolieDate(doc.date_emission) + "</div>"
    + (doc.date_echeance && !estDevis
      ? "<div class=\"d\">Échéance le " + jolieDate(doc.date_echeance) + "</div>" : "")
    + "</div>"
    + "</div>"

    + "<div class=\"cadre\">"
    + "<div class=\"bloc\">"
    + "<div class=\"e\">ÉMETTEUR</div>"
    + "<div class=\"n\">" + echapper(emetteur.raison_sociale || "") + "</div>"
    + (emetteur.representant_nom
      ? "<div class=\"l\">" + echapper(emetteur.representant_nom)
        + (emetteur.representant_qualite ? ", " + echapper(emetteur.representant_qualite) : "")
        + "</div>" : "")
    + "</div>"
    + "<div class=\"bloc\">"
    + "<div class=\"e\">DESTINATAIRE</div>"
    + "<div class=\"n\">" + echapper(doc.client_nom) + "</div>"
    + (doc.client_adresse ? "<div class=\"l\">" + echapper(doc.client_adresse) + "</div>" : "")
    + ((doc.client_code_postal || doc.client_ville)
      ? "<div class=\"l\">" + echapper(doc.client_code_postal || "") + " "
        + echapper(doc.client_ville || "") + "</div>" : "")
    + (doc.client_siren ? "<div class=\"l\">SIREN " + echapper(doc.client_siren) + "</div>" : "")
    + (doc.client_tva ? "<div class=\"l\">TVA " + echapper(doc.client_tva) + "</div>" : "")
    + "</div>"
    + "</div>"

    + (doc.objet ? "<div class=\"objet\"><strong>Objet : </strong>" + echapper(doc.objet) + "</div>" : "")

    + "<table class=\"lignes\"><thead><tr>"
    + "<th>Désignation</th><th style=\"text-align:right\">Qté</th>"
    + "<th style=\"text-align:right\">P.U. HT</th><th style=\"text-align:right\">Remise</th>"
    + "<th style=\"text-align:right\">TVA</th><th style=\"text-align:right\">Total HT</th>"
    + "</tr></thead><tbody>" + rangs + "</tbody></table>"

    + "<div class=\"bas\">"
    + "<table class=\"tva\"><tr><td><strong>Base HT</strong></td><td><strong>Taux</strong></td>"
    + "<td><strong>TVA</strong></td></tr>" + tauxLignes + "</table>"
    + "<div class=\"totaux\">"
    + "<div class=\"l\"><span>Total HT</span><span>" + euros(doc.total_ht) + "</span></div>"
    + "<div class=\"l\"><span>TVA</span><span>" + euros(doc.total_tva) + "</span></div>"
    + "<div class=\"l ttc\"><span>Total TTC</span><span>" + euros(doc.total_ttc) + "</span></div>"
    + "</div></div>"

    + "<div class=\"mentions\">"
    + (doc.autoliquidation
      ? "<p class=\"g\">Autoliquidation de la TVA par le preneur — article 283-2 du code général des impôts.</p>"
      : "")
    + (doc.conditions ? "<p>" + echapper(doc.conditions) + "</p>" : "")
    + (estDevis
      ? "<p>Devis valable 30 jours. Bon pour accord, date et signature du client.</p>"
      : "<p><span class=\"g\">Pénalités de retard :</span> tout retard de paiement entraîne "
        + "de plein droit des pénalités calculées au taux d'intérêt appliqué par la Banque "
        + "centrale européenne à son opération de refinancement la plus récente, majoré de "
        + "10 points, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de "
        + "40 € (articles L441-10 et D441-5 du code de commerce). Aucun escompte pour "
        + "paiement anticipé.</p>")
    + "</div>"

    + "</body></html>";
}

// ---------------------------------------------------------------------------
// LE XML FACTUR-X, PROFIL MINIMUM.
//
// 🚨 A COMPTER DU 1er SEPTEMBRE 2026, une facture entre assujettis francais
// doit etre STRUCTUREE : un PDF seul n est plus une facture electronique au
// sens de la reforme. Le Factur-X repond aux deux besoins a la fois — un PDF
// que l humain lit, un XML que la machine lit, dans un seul fichier.
//
// LE PROFIL MINIMUM suffit a la reforme francaise : identification des
// parties, totaux, ventilation de TVA. Les profils superieurs ajoutent le
// detail des lignes, utile mais non exige.
//
// ⚠️ LE NOM DU FICHIER ATTACHE DOIT ETRE EXACTEMENT « factur-x.xml ». Les
// plateformes le cherchent par ce nom ; un autre nom rend la facture
// illisible pour elles, et elle repart en anomalie.
// ---------------------------------------------------------------------------
function genererFacturX(doc: any, lignes: any[], emetteur: any): string {
  const estAvoir = doc.type === "avoir";
  // 380 = facture, 381 = avoir. Codes de la liste UNTDID 1001.
  const typeCode = estAvoir ? "381" : "380";

  const parTaux: any = {};
  for (const l of lignes) {
    const t = String(Number(l.taux_tva) || 0);
    if (!parTaux[t]) parTaux[t] = { base: 0, tva: 0 };
    parTaux[t].base = parTaux[t].base + (Number(l.total_ht) || 0);
    parTaux[t].tva = parTaux[t].tva + (Number(l.total_tva) || 0);
  }

  const blocsTva = Object.keys(parTaux).map(function (t) {
    const taux = Number(t);
    // Categorie S = taux normal, AE = autoliquidation, Z = taux zero.
    const categorie = doc.autoliquidation ? "AE" : (taux > 0 ? "S" : "Z");
    return "<ram:ApplicableTradeTax>"
      + "<ram:CalculatedAmount>" + parTaux[t].tva.toFixed(2) + "</ram:CalculatedAmount>"
      + "<ram:TypeCode>VAT</ram:TypeCode>"
      + (doc.autoliquidation
        ? "<ram:ExemptionReason>Autoliquidation</ram:ExemptionReason>" : "")
      + "<ram:BasisAmount>" + parTaux[t].base.toFixed(2) + "</ram:BasisAmount>"
      + "<ram:CategoryCode>" + categorie + "</ram:CategoryCode>"
      + "<ram:RateApplicablePercent>" + taux.toFixed(2) + "</ram:RateApplicablePercent>"
      + "</ram:ApplicableTradeTax>";
  }).join("");

  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
    + "<rsm:CrossIndustryInvoice"
    + " xmlns:rsm=\"urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100\""
    + " xmlns:ram=\"urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100\""
    + " xmlns:udt=\"urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100\">"

    + "<rsm:ExchangedDocumentContext>"
    + "<ram:GuidelineSpecifiedDocumentContextParameter>"
    + "<ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>"
    + "</ram:GuidelineSpecifiedDocumentContextParameter>"
    + "</rsm:ExchangedDocumentContext>"

    + "<rsm:ExchangedDocument>"
    + "<ram:ID>" + echapper(doc.numero) + "</ram:ID>"
    + "<ram:TypeCode>" + typeCode + "</ram:TypeCode>"
    + "<ram:IssueDateTime><udt:DateTimeString format=\"102\">"
    + dateFacturX(doc.date_emission)
    + "</udt:DateTimeString></ram:IssueDateTime>"
    + "</rsm:ExchangedDocument>"

    + "<rsm:SupplyChainTradeTransaction>"
    + "<ram:ApplicableHeaderTradeAgreement>"
    + "<ram:SellerTradeParty>"
    + "<ram:Name>" + echapper(emetteur.raison_sociale || "") + "</ram:Name>"
    + "<ram:PostalTradeAddress>"
    + "<ram:CountryID>" + echapper(emetteur.pays || "FR") + "</ram:CountryID>"
    + "</ram:PostalTradeAddress>"
    + (emetteur.numero_tva
      ? "<ram:SpecifiedTaxRegistration><ram:ID schemeID=\"VA\">"
        + echapper(emetteur.numero_tva) + "</ram:ID></ram:SpecifiedTaxRegistration>" : "")
    + "</ram:SellerTradeParty>"
    + "<ram:BuyerTradeParty>"
    + "<ram:Name>" + echapper(doc.client_nom) + "</ram:Name>"
    + "<ram:PostalTradeAddress>"
    + "<ram:CountryID>" + echapper(doc.client_pays || "FR") + "</ram:CountryID>"
    + "</ram:PostalTradeAddress>"
    + (doc.client_tva
      ? "<ram:SpecifiedTaxRegistration><ram:ID schemeID=\"VA\">"
        + echapper(doc.client_tva) + "</ram:ID></ram:SpecifiedTaxRegistration>" : "")
    + "</ram:BuyerTradeParty>"
    + "</ram:ApplicableHeaderTradeAgreement>"

    + "<ram:ApplicableHeaderTradeDelivery/>"

    + "<ram:ApplicableHeaderTradeSettlement>"
    + "<ram:InvoiceCurrencyCode>" + echapper(doc.devise || "EUR") + "</ram:InvoiceCurrencyCode>"
    + blocsTva
    + "<ram:SpecifiedTradeSettlementHeaderMonetarySummation>"
    + "<ram:LineTotalAmount>" + (Number(doc.total_ht) || 0).toFixed(2) + "</ram:LineTotalAmount>"
    + "<ram:TaxBasisTotalAmount>" + (Number(doc.total_ht) || 0).toFixed(2) + "</ram:TaxBasisTotalAmount>"
    + "<ram:TaxTotalAmount currencyID=\"" + echapper(doc.devise || "EUR") + "\">"
    + (Number(doc.total_tva) || 0).toFixed(2) + "</ram:TaxTotalAmount>"
    + "<ram:GrandTotalAmount>" + (Number(doc.total_ttc) || 0).toFixed(2) + "</ram:GrandTotalAmount>"
    + "<ram:DuePayableAmount>" + (Number(doc.total_ttc) || 0).toFixed(2) + "</ram:DuePayableAmount>"
    + "</ram:SpecifiedTradeSettlementHeaderMonetarySummation>"
    + "</ram:ApplicableHeaderTradeSettlement>"
    + "</rsm:SupplyChainTradeTransaction>"
    + "</rsm:CrossIndustryInvoice>";
}

// LE PDF, par le Chromium de Vercel. Le meme moteur que le reste de la
// maison : inutile d en apprendre un second.
async function htmlVersPdf(html: string): Promise<Buffer> {
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = await import("puppeteer-core");

  const navigateur = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await navigateur.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await navigateur.close();
  }
}

// L ATTACHEMENT DU XML AU PDF.
//
// ⚠️ LA RELATION DOIT ETRE « Data » : c est elle qui dit au lecteur que le
// fichier joint EST la facture sous forme structuree, et non une piece
// annexe quelconque.
async function attacherFacturX(pdf: Buffer, xml: string): Promise<Buffer> {
  const document = await PDFDocument.load(pdf);

  document.attach(Buffer.from(xml, "utf8"), "factur-x.xml", {
    mimeType: "application/xml",
    description: "Facture électronique Factur-X",
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Data,
  });

  const octets = await document.save();
  return Buffer.from(octets);
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.id) {
      return NextResponse.json({ ok: false, erreur: "Document non precise." }, { status: 400 });
    }

    const { data: doc } = await supabase
      .from("devis_factures")
      .select("*")
      .eq("id", b.id)
      .maybeSingle();

    if (!doc) {
      return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
    }
    if (doc.tenant_id !== session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Document d un autre cabinet." }, { status: 403 });
    }

    // 🚨 UN BROUILLON NE S IMPRIME PAS. Un PDF sans numero circule, se
    // classe, et finit par etre pris pour une facture. La numerotation est
    // ce qui distingue un document comptable d un brouillon.
    if (!doc.numero) {
      return NextResponse.json({
        ok: false,
        erreur: "Ce document n est pas encore émis : il n a pas de numéro.",
      }, { status: 409 });
    }

    const { data: lignes } = await supabase
      .from("devis_factures_lignes")
      .select("*")
      .eq("document_id", doc.id)
      .order("rang", { ascending: true });

    const { data: emetteur } = await supabase
      .from("organismes_formation")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .maybeSingle();

    if (!emetteur || !emetteur.raison_sociale) {
      return NextResponse.json({
        ok: false,
        erreur: "Les coordonnées de votre cabinet sont incomplètes : "
          + "renseignez-les dans « Mon cabinet » avant d'émettre une facture.",
      }, { status: 400 });
    }

    const html = genererHTML(doc, lignes || [], emetteur);
    let pdf = await htmlVersPdf(html);

    // LE FACTUR-X NE CONCERNE QUE LES FACTURES ET LES AVOIRS. Un devis n est
    // pas une facture : lui attacher un XML de facture serait une faute.
    let structure = false;
    if (doc.type !== "devis") {
      try {
        const xml = genererFacturX(doc, lignes || [], emetteur);
        pdf = await attacherFacturX(pdf, xml);
        structure = true;
      } catch (e) {
        // Le PDF reste valable meme si l attachement echoue : mieux vaut une
        // facture lisible sans XML qu aucune facture.
        structure = false;
      }
    }

    // ---------- L ENVOI ----------
    if (b.envoyer === true) {
      const destinataire = doc.client_email;
      if (!destinataire) {
        return NextResponse.json({
          ok: false, erreur: "Aucune adresse électronique pour ce client.",
        }, { status: 400 });
      }
      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ ok: false, erreur: "RESEND_API_KEY absente." }, { status: 500 });
      }

      const estDevis = doc.type === "devis";
      const objet = (estDevis ? "Devis " : doc.type === "avoir" ? "Avoir " : "Facture ")
        + doc.numero + " — " + emetteur.raison_sociale;

      const corps = "<p>Bonjour,</p>"
        + "<p>Vous trouverez en pièce jointe " + (estDevis ? "notre devis " : "notre facture ")
        + "<strong>" + echapper(doc.numero) + "</strong>"
        + (doc.objet ? " concernant " + echapper(doc.objet) : "")
        + ", d'un montant de <strong>" + euros(doc.total_ttc) + " TTC</strong>.</p>"
        + (estDevis
          ? "<p>Ce devis est valable 30 jours. Pour l'accepter, retournez-le-nous signé "
            + "avec la mention « bon pour accord ».</p>"
          : "<p>Règlement attendu " + (doc.date_echeance
            ? "avant le " + jolieDate(doc.date_echeance) : "à réception") + ".</p>")
        + "<p>Bien cordialement,<br/>" + echapper(emetteur.raison_sociale) + "</p>";

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EXPEDITEUR,
          to: destinataire,
          reply_to: emetteur.email_contact || undefined,
          subject: objet,
          html: corps,
          attachments: [{
            filename: doc.numero + ".pdf",
            content: pdf.toString("base64"),
          }],
        }),
      });

      if (!r.ok) {
        const detail = await r.text();
        return NextResponse.json({
          ok: false, erreur: "Envoi impossible : " + detail.slice(0, 200),
        }, { status: 500 });
      }

      await supabase
        .from("devis_factures")
        .update({ envoye_le: new Date().toISOString(), html: html })
        .eq("id", doc.id);

      return NextResponse.json({
        ok: true,
        envoye: true,
        destinataire: destinataire,
        structure: structure,
        message: "Envoyé à " + destinataire
          + (structure ? " au format Factur-X." : "."),
      });
    }

    // ---------- LE TELECHARGEMENT ----------
    //
    // Le HTML est fige en base au premier tirage : il temoigne de ce qui a
    // ete remis au client, meme si les coordonnees du cabinet changent plus
    // tard.
    if (!doc.html) {
      await supabase.from("devis_factures").update({ html: html }).eq("id", doc.id);
    }

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"" + doc.numero + ".pdf\"",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
