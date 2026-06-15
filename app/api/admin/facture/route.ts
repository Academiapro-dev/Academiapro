import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { client, montant, description, numero } = await req.json();
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
  .facture-title { text-align: right; }
  .facture-title h1 { color: #050508; font-size: 32px; margin: 0; }
  .facture-title p { color: #666; margin: 5px 0; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .partie { width: 45%; }
  .partie h3 { color: #c8a96e; border-bottom: 1px solid #c8a96e; padding-bottom: 5px; }
  .partie p { margin: 5px 0; color: #444; font-size: 14px; }
  .infos { background: #f8f4ee; padding: 15px; border-radius: 8px; margin-bottom: 30px; display: flex; gap: 30px; }
  .info-item { flex: 1; }
  .info-item label { color: #c8a96e; font-size: 12px; text-transform: uppercase; }
  .info-item p { margin: 3px 0; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  thead tr { background: #050508; color: #fff; }
  thead th { padding: 12px 15px; text-align: left; font-size: 14px; }
  tbody tr { border-bottom: 1px solid #eee; }
  tbody td { padding: 12px 15px; font-size: 14px; }
  .total-section { text-align: right; margin-bottom: 30px; }
  .total-row { display: flex; justify-content: flex-end; gap: 20px; padding: 8px 0; }
  .total-row.final { font-size: 20px; font-weight: bold; color: #c8a96e; border-top: 2px solid #c8a96e; padding-top: 12px; }
  .footer { border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; }
  .tva-mention { background: #fff8e7; border-left: 4px solid #c8a96e; padding: 10px 15px; margin: 20px 0; font-size: 13px; }
  .conseils { background: #f0f7ff; border-left: 4px solid #3b82f6; padding: 10px 15px; margin: 20px 0; font-size: 13px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">AcadémIA Pro</div>
      <p style="color:#666;margin:5px 0;font-size:14px;">contact@academiapro.fr</p>
      <p style="color:#666;margin:5px 0;font-size:14px;">academiapro.fr</p>
      <p style="color:#666;margin:5px 0;font-size:14px;">Micro-entrepreneur</p>
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

  <div class="infos">
    <div class="info-item">
      <label>N° Facture</label>
      <p>${numero}</p>
    </div>
    <div class="info-item">
      <label>Date émission</label>
      <p>${date}</p>
    </div>
    <div class="info-item">
      <label>Échéance</label>
      <p>${echeance}</p>
    </div>
    <div class="info-item">
      <label>Statut</label>
      <p style="color:#c8a96e;">En attente</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qté</th>
        <th>Prix unitaire HT</th>
        <th>Total HT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${description}</td>
        <td>1</td>
        <td>${montant} €</td>
        <td><strong>${montant} €</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-row">
      <span>Total HT :</span>
      <span>${montant} €</span>
    </div>
    <div class="total-row">
      <span>TVA :</span>
      <span>0,00 €</span>
    </div>
    <div class="total-row final">
      <span>TOTAL TTC :</span>
      <span>${montant} €</span>
    </div>
  </div>

  <div class="tva-mention">
    ⚠️ TVA non applicable — article 293 B du Code Général des Impôts
  </div>

  <div class="conseils">
    💡 <strong>Coordonnées bancaires :</strong><br/>
    Titulaire : Jacques Lalou — AcadémIA Pro<br/>
    IBAN : FR XX XXXX XXXX XXXX XXXX XXXX XXX<br/>
    Paiement accepté par virement ou Stripe
  </div>

  <div class="footer">
    <p>Pénalités de retard : 3x le taux d intérêt légal + indemnité forfaitaire de 40€ (art. L441-10 du Code de Commerce)</p>
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
    return NextResponse.json({ error: "Erreur génération facture" }, { status: 500 });
  }
}
