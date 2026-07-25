import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SOCIETE = "ACADEMIA PRO LLC";
const ADRESSE = "30 N Gould St STE R, Sheridan, WY 82801, USA";

function tenantDeLaSession(req: NextRequest): string | null {
  try {
    const brut = req.cookies.get("sb_user")?.value;
    if (!brut) return null;
    const donnees = JSON.parse(decodeURIComponent(brut));
    return donnees?.tenant_id || null;
  } catch {
    return null;
  }
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function eur(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}

function calculIS(base: number): { is_15: number; is_25: number; total: number } {
  if (base <= 0) return { is_15: 0, is_25: 0, total: 0 };
  const t15 = Math.min(base, 42500);
  const t25 = Math.max(base - 42500, 0);
  const is_15 = r2(t15 * 0.15);
  const is_25 = r2(t25 * 0.25);
  return { is_15, is_25, total: r2(is_15 + is_25) };
}

export async function GET(req: NextRequest) {
  const tenantId = tenantDeLaSession(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const year =
    parseInt(req.nextUrl.searchParams.get("year") || "", 10) ||
    new Date().getFullYear();
  const debut = year + "-01-01";
  const fin = year + "-12-31";

  const { data: lignes, error } = await supabase
    .from("compta_ecritures")
    .select("compte_num, compte_lib, debit, credit")
    .eq("tenant_id", tenantId)
    .gte("ecriture_date", debut)
    .lte("ecriture_date", fin)
    .limit(50000);

  if (error) {
    return NextResponse.json({ error: "Lecture ecritures: " + error.message }, { status: 500 });
  }
  if (!lignes || lignes.length === 0) {
    return NextResponse.json({ error: "Aucune ecriture pour l'exercice " + year }, { status: 404 });
  }

  const comptes: Record<string, { lib: string; debit: number; credit: number }> = {};
  for (const l of lignes) {
    if (!comptes[l.compte_num]) comptes[l.compte_num] = { lib: l.compte_lib, debit: 0, credit: 0 };
    comptes[l.compte_num].debit += Number(l.debit || 0);
    comptes[l.compte_num].credit += Number(l.credit || 0);
  }

  let produits = 0, charges = 0;
  const detProduits: Array<[string, number]> = [];
  const detCharges: Array<[string, number]> = [];
  let immo = 0, stocks = 0, creances = 0, dettes = 0, tresoA = 0, tresoP = 0, capHors = 0;

  for (const num of Object.keys(comptes).sort()) {
    const c = comptes[num];
    const solde = r2(c.debit - c.credit);
    const cl = num.charAt(0);
    if (cl === "7") {
      const m = r2(c.credit - c.debit);
      produits = r2(produits + m);
      detProduits.push([num + " - " + c.lib, m]);
    } else if (cl === "6") {
      const m = r2(c.debit - c.credit);
      charges = r2(charges + m);
      detCharges.push([num + " - " + c.lib, m]);
    } else if (cl === "2") immo = r2(immo + solde);
    else if (cl === "3") stocks = r2(stocks + solde);
    else if (cl === "4") { if (solde >= 0) creances = r2(creances + solde); else dettes = r2(dettes - solde); }
    else if (cl === "5") { if (solde >= 0) tresoA = r2(tresoA + solde); else tresoP = r2(tresoP - solde); }
    else if (cl === "1") capHors = r2(capHors + (c.credit - c.debit));
  }

  const resultat = r2(produits - charges);
  const impot = calculIS(resultat);
  const deficit = resultat < 0 ? r2(-resultat) : 0;
  const totalActif = r2(immo + stocks + creances + tresoA);
  const capitaux = r2(capHors + resultat);
  const totalPassif = r2(capitaux + dettes + tresoP);

  const lignesCharges = detCharges
    .map(([lib, m]) => "<tr><td>" + lib + "</td><td class='m'>" + eur(m) + "</td></tr>")
    .join("");
  const lignesProduits = detProduits.length
    ? detProduits.map(([lib, m]) => "<tr><td>" + lib + "</td><td class='m'>" + eur(m) + "</td></tr>").join("")
    : "<tr><td>Aucun produit sur l'exercice</td><td class='m'>" + eur(0) + "</td></tr>";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Liasse de travail ${year} - ${SOCIETE}</title>
<style>
  :root { color-scheme: light; }
  body { background:#ffffff; color:#1a1a1a; font-family: Georgia, 'Times New Roman', serif; margin:0; padding:32px 24px; max-width:820px; margin-left:auto; margin-right:auto; font-size:17px; line-height:1.6; }
  h1 { font-size:26px; margin:0 0 4px 0; }
  h2 { font-size:20px; margin:34px 0 10px 0; border-bottom:2px solid #1a1a1a; padding-bottom:4px; }
  .sous { color:#444; margin:0 0 20px 0; }
  .bandeau { background:#fff3cd; border:2px solid #b8860b; padding:12px 16px; margin:18px 0; font-weight:bold; }
  table { width:100%; border-collapse:collapse; margin:8px 0 16px 0; }
  td, th { border:1px solid #999; padding:8px 10px; text-align:left; vertical-align:top; }
  th { background:#f0ede4; }
  .m { text-align:right; white-space:nowrap; width:160px; }
  .total td { font-weight:bold; background:#f7f5ef; }
  .negatif { color:#8b0000; }
  .pied { margin-top:30px; font-size:14px; color:#555; border-top:1px solid #999; padding-top:10px; }
  @media print { body { padding:0; } .bandeau { border-width:1px; } }
</style>
</head>
<body>
<h1>Liasse fiscale — document de travail</h1>
<p class="sous">${SOCIETE} — ${ADRESSE}<br>Exercice du 01/01/${year} au 31/12/${year} — établi le ${new Date().toLocaleDateString("fr-FR")}</p>

<div class="bandeau">HYPOTHÈSE DE TRAVAIL : LLC imposée à l'IS en France — qualification NON VALIDÉE par le fiscaliste. Document interne, ne vaut pas déclaration. La liasse réelle se télétransmet (EDI-TDFC).</div>

<h2>Compte de résultat simplifié (structure 2033-B)</h2>
<table>
<tr><th>Produits d'exploitation</th><th class="m">Montant</th></tr>
${lignesProduits}
<tr class="total"><td>Total des produits</td><td class="m">${eur(produits)}</td></tr>
</table>
<table>
<tr><th>Charges d'exploitation</th><th class="m">Montant</th></tr>
${lignesCharges}
<tr class="total"><td>Total des charges</td><td class="m">${eur(charges)}</td></tr>
</table>
<table>
<tr class="total"><td>RÉSULTAT COMPTABLE DE L'EXERCICE</td><td class="m ${resultat < 0 ? "negatif" : ""}">${eur(resultat)}</td></tr>
</table>

<h2>Bilan simplifié (structure 2033-A)</h2>
<table>
<tr><th colspan="2">ACTIF</th></tr>
<tr><td>Immobilisations</td><td class="m">${eur(immo)}</td></tr>
<tr><td>Stocks</td><td class="m">${eur(stocks)}</td></tr>
<tr><td>Créances</td><td class="m">${eur(creances)}</td></tr>
<tr><td>Trésorerie</td><td class="m">${eur(tresoA)}</td></tr>
<tr class="total"><td>TOTAL ACTIF</td><td class="m">${eur(totalActif)}</td></tr>
</table>
<table>
<tr><th colspan="2">PASSIF</th></tr>
<tr><td>Capitaux propres hors résultat</td><td class="m">${eur(capHors)}</td></tr>
<tr><td>Résultat de l'exercice</td><td class="m ${resultat < 0 ? "negatif" : ""}">${eur(resultat)}</td></tr>
<tr><td>Dettes (dont compte courant d'associé)</td><td class="m">${eur(dettes)}</td></tr>
<tr><td>Trésorerie passive</td><td class="m">${eur(tresoP)}</td></tr>
<tr class="total"><td>TOTAL PASSIF</td><td class="m">${eur(totalPassif)}</td></tr>
</table>

<h2>Impôt sur les sociétés (structure 2065)</h2>
<table>
<tr><td>Résultat fiscal (= résultat comptable, aucune réintégration à ce stade)</td><td class="m ${resultat < 0 ? "negatif" : ""}">${eur(resultat)}</td></tr>
<tr><td>Base imposable</td><td class="m">${eur(resultat > 0 ? resultat : 0)}</td></tr>
<tr><td>IS à 15 % (jusqu'à 42 500 &euro;, conditions PME supposées)</td><td class="m">${eur(impot.is_15)}</td></tr>
<tr><td>IS à 25 %</td><td class="m">${eur(impot.is_25)}</td></tr>
<tr class="total"><td>IS TOTAL DÛ</td><td class="m">${eur(impot.total)}</td></tr>
<tr><td>Déficit reportable sur les exercices suivants</td><td class="m">${eur(deficit)}</td></tr>
</table>

<p class="pied">Établi automatiquement depuis les écritures comptables (${lignes.length} lignes, journal AC). Taux de conversion USD provisoire noté dans les écritures, à remplacer par le taux officiel. Contrôle d'équilibre : total actif ${eur(totalActif)} / total passif ${eur(totalPassif)}. Ce document ne préjuge pas de la qualification fiscale de la société.</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
