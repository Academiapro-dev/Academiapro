const ENTITE = {
  nom: "AcademiA Pro LLC",
  adresse1: "30 N Gould St, STE R",
  adresse2: "Sheridan, WY 82801",
  pays: "United States / Etats-Unis",
  ein: "32-0862305",
  numero_oss: "[NUMERO OSS non-Union - A COMPLETER]",
  email: "contact@academiapro.fr",
  site: "academiapro.fr",
  paiement: "Lien de paiement transmis avec la facture",
};

const LOGOS: Record<string, string> = {
  academia: "https://kpxrbwsbhmggoajtxzqn.supabase.co/storage/v1/object/public/assets-publics/IMG_2595.png",
  hebrewpro: "https://kpxrbwsbhmggoajtxzqn.supabase.co/storage/v1/object/public/assets-publics/IMG_2675.png",
};


type FactureData = {
  numero: string;
  projet: string;
  projet_nom?: string;
  client_nom: string;
  client_pays?: string | null;
  type_client?: string;
  numero_tva_client?: string | null;
  montant_ht: number;
  taux_tva: number;
  montant_tva: number;
  montant_ttc: number;
  devise: string;
  autoliquidation?: boolean;
  description: string;
  date_emission?: string;
};

export function genererFactureHTML(d: FactureData): string {
  const dateEmission = d.date_emission ? new Date(d.date_emission) : new Date();
  const dateStr = dateEmission.toLocaleDateString("fr-FR");
  const dateStrEn = dateEmission.toLocaleDateString("en-US");
  const echeance = new Date(dateEmission.getTime() + 14 * 24 * 60 * 60 * 1000);
  const echeanceStr = echeance.toLocaleDateString("fr-FR");
  const devise = d.devise || "EUR";
  const symbole = devise === "USD" ? "$" : devise === "EUR" ? "€" : devise;
  const projetNom = d.projet_nom || (d.projet === "hebrewpro" ? "HebrewPro AI" : "AcademIA Pro");
  const logoUrl = LOGOS[d.projet] || LOGOS.academia;
  const fmt = (n: number) => n.toFixed(2) + " " + symbole;

  let blocTVA = "";
  if (d.autoliquidation) {
    blocTVA = `<tr><td style="color:#666;">TVA / VAT (autoliquidation) :</td><td style="text-align:right;">0.00 ${symbole}</td></tr>`;
  } else if (d.taux_tva > 0) {
    blocTVA = `<tr><td style="color:#666;">TVA / VAT (${d.taux_tva}%) :</td><td style="text-align:right;">${fmt(d.montant_tva)}</td></tr>`;
  } else {
    blocTVA = `<tr><td style="color:#666;">TVA / VAT :</td><td style="text-align:right;">0.00 ${symbole}</td></tr>`;
  }

  let mentionTVA = "";
  if (d.autoliquidation) {
    mentionTVA = `TVA autoliquidee par le preneur (art. 196 Directive 2006/112/CE) — VAT reverse charge. N° TVA client : ${d.numero_tva_client || "-"}`;
  } else if (d.taux_tva > 0) {
    mentionTVA = `TVA collectee au titre du regime OSS non-Union — VAT collected under EU Non-Union OSS scheme. N° OSS : ${ENTITE.numero_oss}`;
  } else {
    mentionTVA = `TVA non applicable / VAT not applicable (hors champ / out of scope).`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture / Invoice ${d.numero} - ${projetNom}</title>
<style>
  body { font-family: Georgia, serif; max-width: 820px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; border-bottom: 3px solid #c8a96e; padding-bottom: 20px; }
  .logo-img { max-height: 90px; max-width: 220px; margin-bottom: 8px; }
  .sub { color:#666; font-size:13px; margin:3px 0; }
  .facture-title h1 { color: #050508; font-size: 30px; margin: 0; text-align: right; }
  .facture-title p { color: #666; margin: 4px 0; text-align: right; font-size: 14px; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 28px; }
  .partie { width: 46%; }
  .partie h3 { color: #c8a96e; border-bottom: 1px solid #c8a96e; padding-bottom: 5px; font-size:15px; }
  .partie p { margin: 4px 0; color: #444; font-size: 13px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table.items thead tr { background: #050508; color: #fff; }
  table.items thead th { padding: 11px 14px; text-align: left; font-size:13px; }
  table.items tbody td { padding: 11px 14px; font-size: 13px; border-bottom: 1px solid #eee; }
  .totaux { width: 320px; margin-left: auto; margin-bottom: 16px; }
  .totaux td { padding: 7px 12px; font-size: 14px; }
  .totaux tr:last-child td { font-size: 17px; font-weight: bold; color: #c8a96e; border-top: 2px solid #c8a96e; }
  .mention { background: #fff8e7; border-left: 4px solid #c8a96e; padding: 10px 14px; font-size: 12px; margin: 12px 0; }
  .footer { border-top: 1px solid #ddd; padding-top: 14px; font-size: 11px; color: #666; margin-top: 18px; line-height:1.5; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <img class="logo-img" src="${logoUrl}" alt="${projetNom}" />
      <p class="sub">${ENTITE.nom}</p>
      <p class="sub">${ENTITE.email}</p>
      <p class="sub">${ENTITE.site}</p>
    </div>
    <div class="facture-title">
      <h1>FACTURE / INVOICE</h1>
      <p><strong>N° ${d.numero}</strong></p>
      <p>Date : ${dateStr} (${dateStrEn})</p>
      <p>Echeance / Due : ${echeanceStr}</p>
    </div>
  </div>
  <div class="parties">
    <div class="partie">
      <h3>Emetteur / From</h3>
      <p><strong>${ENTITE.nom}</strong></p>
      <p>${ENTITE.adresse1}</p>
      <p>${ENTITE.adresse2}</p>
      <p>${ENTITE.pays}</p>
      <p>EIN : ${ENTITE.ein}</p>
      <p>${ENTITE.email}</p>
    </div>
    <div class="partie">
      <h3>Client / Bill to</h3>
      <p><strong>${d.client_nom}</strong></p>
      <p>${d.client_pays || "-"}</p>
      <p>Type : ${d.type_client || "B2C"}</p>
      ${d.numero_tva_client ? `<p>N° TVA : ${d.numero_tva_client}</p>` : ""}
    </div>
  </div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:55%;">Description</th>
        <th style="width:10%;">Qte / Qty</th>
        <th style="width:35%; text-align:right;">Total HT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${d.description}</td>
        <td>1</td>
        <td style="text-align:right;"><strong>${fmt(d.montant_ht)}</strong></td>
      </tr>
    </tbody>
  </table>
  <div class="totaux">
    <table>
      <tbody>
        <tr><td style="color:#666;">Total HT / Subtotal :</td><td style="text-align:right;">${fmt(d.montant_ht)}</td></tr>
        ${blocTVA}
        <tr><td>TOTAL TTC / Total :</td><td style="text-align:right;">${fmt(d.montant_ttc)}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="mention">${mentionTVA}</div>
  <div class="mention" style="background:#f0f7ff;border-color:#3b82f6;">
    <strong>Paiement / Payment :</strong> ${ENTITE.paiement}
  </div>
  <div class="footer">
    <p>Acompte / Deposit : les sommes versees a l'inscription constituent un acompte imputable sur le prix total (non des arrhes).</p>
    <p>Penalites de retard / Late penalties : 3x taux legal + indemnite forfaitaire 40€ (art. L441-10 C. commerce).</p>
    <p>Droit applicable / Governing law : droit francais pour consommateurs UE (Reglement Rome I) ; droit du Wyoming (USA) a titre suppletif hors UE.</p>
    <p>${ENTITE.nom} · ${ENTITE.email} · ${ENTITE.site}</p>
  </div>
</body>
</html>`;
}
