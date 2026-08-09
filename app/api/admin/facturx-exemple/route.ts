import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, AFRelationship } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fabrique une facture Factur-X d exemple : un PDF qui porte le XML
// structure en piece jointe. Sert UNIQUEMENT a eprouver la lecture.
// Montants connus d avance : 1000.00 HT + 200.00 TVA = 1200.00 TTC.
export async function GET(req: NextRequest) {
  try {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocument>
    <ram:ID>FA-2026-0042</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20260805</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>PAPETERIE DURAND SARL</ram:Name>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>CLIENT ESSAI</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>200.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>1000.00</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">200.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>1200.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);

    page.drawText("FACTURE FA-2026-0042", { x: 60, y: 760, size: 18 });
    page.drawText("PAPETERIE DURAND SARL", { x: 60, y: 720, size: 12 });
    page.drawText("Date : 05/08/2026", { x: 60, y: 700, size: 11 });
    page.drawText("Fournitures de bureau", { x: 60, y: 640, size: 11 });
    page.drawText("Total HT ......... 1 000,00 EUR", { x: 60, y: 580, size: 11 });
    page.drawText("TVA 20% .......... 200,00 EUR", { x: 60, y: 560, size: 11 });
    page.drawText("Total TTC ........ 1 200,00 EUR", { x: 60, y: 540, size: 12 });
    page.drawText("Facture electronique - exemple d essai", { x: 60, y: 100, size: 9 });

    // La piece jointe normalisee : c est elle qui fait le Factur-X.
    await pdf.attach(Buffer.from(xml, "utf8"), "factur-x.xml", {
      mimeType: "application/xml",
      description: "Factur-X invoice data",
      afRelationship: AFRelationship.Alternative,
    });

    const octets = await pdf.save();

    return new NextResponse(Buffer.from(octets), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=facture-exemple-facturx.pdf",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
