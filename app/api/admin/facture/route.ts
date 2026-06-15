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
  .totaux { width: 300px; margin-left: auto; margin-bottom: 20px; }
  .totaux table { margin-bottom: 0; }
  .totaux td { padding: 8px 12px; font-size: 14px; }
  .totaux tr:last-child td { font-size: 18px; font-weight: bold; color: #c8a96e; border-top: 2px solid #c8a96e; padding-top: 10px; }
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
      <p>SIRET : En cours d obtention</p>
      <p>contact@academiapro.fr</p>
      <p>academiapro.fr</p>
    </div>
    <div class="partie">
      <h3>Client</h3>
      <p><strong>${client}</strong></p>
      <p>Adresse : À compléter</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:50%;">Description</th>
        <th style="width:10%;">Qté</th>
        <th style="width:20%;">Prix unitaire HT</th>
        <th style="width:20%;">Total HT</th>
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

  <div class="totaux">
    <table>
      <tbody>
        <tr>
          <td style="color:#666;">Total HT :</td>
          <td style="text-align:right;">${montant.toFixed(2)} €</td>
        </tr>
        <tr>
          <td style="color:#666;">TVA (0%) :</td>
          <td style="text-align:right;">0,00 €</td>
        </tr>
        <tr>
          <td>TOTAL TTC :</td>
          <td style="text-align:right;">${montant.toFixed(2)} €</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="mention">
    ⚠️ <strong>TVA non applicable</strong> — article 293 B du Code Général des Impôts
  </div>

  <div class="mention" style="background:#f0f7ff;border-color:#3b82f6;">
    💳 <strong>Coordonnées bancaires :</strong><br/>
    Titulaire : Jacques Lalou — AcadémIA Pro<br/>
    IBAN : FR XX XXXX XXXX XXXX XXXX XXXX XXX<br/>
    Paiement accepté par virement bancaire ou Stripe
  </div>

  <div class="footer">
    <p>Pénalités de retard : 3x le taux d intérêt légal + indemnité forfaitaire de 40€ (art. L441-10 du Code de Commerce)</p>
    <p>Escompte pour paiement anticipé : aucun</p>
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
