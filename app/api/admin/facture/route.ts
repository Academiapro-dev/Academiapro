import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = body.client || "";
    const montant = parseFloat(body.montant) || 0;
    const description = body.description || "";
    const numero = body.numero || "";
    const date = new Date().toLocaleDateString("fr-FR");
    const echeance = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR");

    const factureHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture ${numero} - AcadémIA Pro</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #c8a96e; padding-bottom: 20px; }
  .logo { color: #c8a96e; font-size: 28px; font-weight: bold; }
  .facture-title h1 { color: #050508; font-size: 32px; margin: 0; text-align: right; }
  .facture-title p { color: #666; margin: 5px 0; text-align: right; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .partie { width: 45%; }
  .partie h3 { color: #c8a96e; border-bottom: 1px solid #c8a96e; padding-bottom: 5px; }
  .partie p { margin: 5px 0; color: #444; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #050508; color: #fff; }
  thead th { padding: 12px 15px; text-align: left; }
  tbody tr { border-bottom: 1px solid #eee; }
  tbody td { padding: 12px 15px; font-size: 14px; }
  .total { text-align: right; margin-bottom: 20px; }
  .total-line { display: flex; justify-content: flex-end; gap: 30px; padding: 6px 0; font-size: 15px; }
  .total-final { font-size: 20px; font-weight: bold; color: #c8a96e; border-top: 2px solid #c8a96e; padding-top: 10px; }
  .mention { background: #fff8e7; border-left: 4px solid #c8a96e; padding: 10px 15px; font-size: 13px; margin: 15px 0; }
  .footer { border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #666; margin-top: 20px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">AcadémIA Pro</div>
      <p style="color:#666;font-size:14px;margin:5px 0;">contact@academiapro.fr</p>
      <p style="color:#666;font-size:14px;margin:5px 0;">academiapro.fr</p>
      <p style="color:#666;font-size:14px;margin:5px 0;">Micro-entrepreneur</p>
    </div>
    <div class="facture-title">
      <h1>FACTURE</h1>
      <p><strong>N° ${numero}</strong></p>
      <p>Date : ${date}</p>
      <p>Échéance : ${echeance}</p>
    </div>
  </div>
  <div class="parties">
    <div class="partie">
      <h3>Émetteur</h3>
      <p><strong>AcadémIA Pro</strong></p>
      <p>Jacques Lalou</p>
      <p>SIRET : En cours</p>
      <p>contact@academiapro.fr</p>
    </div>
    <div class="partie">
      <h3>Client</h3>
      <p><strong>${client}</strong></p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qté</th>
        <th>Prix HT</th>
        <th>Total HT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${description}</td>
        <td>1</td>
        <td>${montant.toFixed(2)} €</td>
        <td><strong>${montant.toFixed(2)} €</strong></td>
      </tr>
    </tbody>
  </table>
  <div class="total">
    <div class="total-line"><span>Total HT :</span><span>${montant.toFixed(2)} €</span></div>
    <div class="total-line"><span>TVA :</span><span>0,00 €</span></div>
    <div class="total-line total-final"><span>TOTAL TTC :</span><span>${montant.toFixed(2)} €</span></div>
  </div>
  <div class="mention">⚠️ TVA non applicable — article 293 B du CGI</div>
  <div class="mention" style="background:#f0f7ff;border-color:#3b82f6;">
    💳 Paiement par virement ou Stripe<br/>
    IBAN : FR XX XXXX XXXX XXXX XXXX XXXX XXX
  </div>
  <div class="footer">
    <p>Pénalités de retard : 3x le taux légal + 40€ forfaitaire (art. L441-10 du Code de Commerce)</p>
    <p>AcadémIA Pro · Micro-entrepreneur · contact@academiapro.fr · academiapro.fr</p>
  </div>
</body>
</html>`;

    return NextResponse.json({
      success: true,
      facture_html: factureHtml,
      numero,
      client,
      montant,
      date
    });

  } catch (error) {
    return NextResponse.json({ error: "Erreur generation facture" }, { status: 500 });
  }
}
