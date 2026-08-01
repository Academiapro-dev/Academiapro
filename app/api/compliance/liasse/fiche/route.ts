import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sessionPresente(req: NextRequest): boolean {
  try {
    return !!req.cookies.get("sb_user")?.value;
  } catch {
    return false;
  }
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function eur(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}

function jour(d: string): string {
  if (!d) return "";
  const p = String(d).slice(0, 10).split("-");
  if (p.length !== 3) return d;
  return p[2] + "/" + p[1] + "/" + p[0];
}

function echapper(s: any): string {
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
  if (!sessionPresente(req)) {
    return NextResponse.json(
      { error: "Connectez-vous pour produire une fiche." },
      { status: 401 }
    );
  }

  // CHOIX DU DOSSIER : jamais devine des qu il y en a plusieurs.
  const codeDemande = (req.nextUrl.searchParams.get("societe") || "").trim().toUpperCase();
  const idDemande = (req.nextUrl.searchParams.get("societe_id") || "").trim();

  const { data: dossiers, error: erreurDossiers } = await supabase
    .from("compta_societes")
    .select("id, code, raison_sociale, siren, forme, adresse, regime_fiscal, exercice_debut, exercice_fin")
    .eq("actif", true)
    .limit(500);

  if (erreurDossiers) {
    return NextResponse.json(
      { error: "Lecture des dossiers: " + erreurDossiers.message },
      { status: 500 }
    );
  }

  const liste = dossiers || [];

  if (liste.length === 0) {
    return NextResponse.json(
      { error: "Aucun dossier comptable. Ouvrez-en un avant de produire une fiche." },
      { status: 404 }
    );
  }

  let dossier: any = null;

  if (idDemande) {
    dossier = liste.find(function (s: any) { return s.id === idDemande; }) || null;
  } else if (codeDemande) {
    dossier = liste.find(function (s: any) { return s.code === codeDemande; }) || null;
  } else if (liste.length === 1) {
    dossier = liste[0];
  }

  if (!dossier) {
    if (!codeDemande && !idDemande) {
      return NextResponse.json(
        {
          error: "Precisez le dossier : ?societe=CODE",
          dossiers: liste.map(function (s: any) {
            return { code: s.code, raison_sociale: s.raison_sociale };
          }),
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  }

  const anneeDemandee = parseInt(req.nextUrl.searchParams.get("year") || "", 10);

  let debut: string;
  let fin: string;

  if (anneeDemandee) {
    debut = anneeDemandee + "-01-01";
    fin = anneeDemandee + "-12-31";
  } else if (dossier.exercice_debut && dossier.exercice_fin) {
    debut = String(dossier.exercice_debut).slice(0, 10);
    fin = String(dossier.exercice_fin).slice(0, 10);
  } else {
    const annee = new Date().getFullYear();
    debut = annee + "-01-01";
    fin = annee + "-12-31";
  }

  const { data: lignes, error } = await supabase
    .from("compta_ecritures")
    .select("compte_num, compte_lib, debit, credit")
    .eq("societe_id", dossier.id)
    .gte("ecriture_date", debut)
    .lte("ecriture_date", fin)
    .limit(50000);

  if (error) {
    return NextResponse.json({ error: "Lecture ecritures: " + error.message }, { status: 500 });
  }
  if (!lignes || lignes.length === 0) {
    return NextResponse.json(
      {
        error: "Aucune ecriture pour " + dossier.raison_sociale
          + " entre le " + debut + " et le " + fin + ".",
      },
      { status: 404 }
    );
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
  const regime = String(dossier.regime_fiscal || "a_determiner");
  const soumisIS = regime === "is";
  const impot = soumisIS ? calculIS(resultat) : { is_15: 0, is_25: 0, total: 0 };
  const deficit = resultat < 0 ? r2(-resultat) : 0;
  const totalActif = r2(immo + stocks + creances + tresoA);
  const capitaux = r2(capHors + resultat);
  const totalPassif = r2(capitaux + dettes + tresoP);

  const lignesCharges = detCharges
    .map(([lib, m]) => "<tr><td>" + echapper(lib) + "</td><td class='m'>" + eur(m) + "</td></tr>")
    .join("");
  const lignesProduits = detProduits.length
    ? detProduits.map(([lib, m]) => "<tr><td>" + echapper(lib) + "</td><td class='m'>" + eur(m) + "</td></tr>").join("")
    : "<tr><td>Aucun produit sur l'exercice</td><td class='m'>" + eur(0) + "</td></tr>";

  // Le bandeau d hypothese ne s affiche que si le regime n est pas tranche.
  const bandeau = regime === "a_determiner"
    ? "<div class='bandeau'>RÉGIME FISCAL NON TRANCHÉ pour ce dossier : aucun impôt n'est calculé. "
      + "Renseignez le régime sur la fiche du dossier. Document interne, ne vaut pas déclaration.</div>"
    : soumisIS
      ? "<div class='bandeau'>Document de travail. La liasse réelle (2065 + 2033) se télétransmet en EDI-TDFC. "
        + "Taux réduit 15 % supposé, conditions PME à vérifier.</div>"
      : "<div class='bandeau'>Société non soumise à l'impôt sur les sociétés : le résultat est imposé "
        + "entre les mains des associés. La liasse 2065/2033 ne s'applique pas en l'état.</div>";

  // Le bloc IS n a de sens que pour une societe a l IS.
  const blocIS = soumisIS
    ? `<h2>Impôt sur les sociétés (structure 2065)</h2>
<table>
<tr><td>Résultat fiscal (= résultat comptable, aucune réintégration à ce stade)</td><td class="m ${resultat < 0 ? "negatif" : ""}">${eur(resultat)}</td></tr>
<tr><td>Base imposable</td><td class="m">${eur(resultat > 0 ? resultat : 0)}</td></tr>
<tr><td>IS à 15 % (jusqu'à 42 500 &euro;, conditions PME supposées)</td><td class="m">${eur(impot.is_15)}</td></tr>
<tr><td>IS à 25 %</td><td class="m">${eur(impot.is_25)}</td></tr>
<tr class="total"><td>IS TOTAL DÛ</td><td class="m">${eur(impot.total)}</td></tr>
<tr><td>Déficit reportable sur les exercices suivants</td><td class="m">${eur(deficit)}</td></tr>
</table>`
    : `<h2>Imposition</h2>
<table>
<tr><td>Résultat de l'exercice</td><td class="m ${resultat < 0 ? "negatif" : ""}">${eur(resultat)}</td></tr>
<tr><td>Impôt sur les sociétés</td><td class="m">non applicable a ce dossier</td></tr>
<tr><td>Déficit reportable</td><td class="m">${eur(deficit)}</td></tr>
</table>`;

  const identite = echapper(dossier.raison_sociale)
    + (dossier.forme ? " — " + echapper(dossier.forme) : "")
    + (dossier.siren ? " — SIREN " + echapper(dossier.siren) : "");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Liasse de travail - ${echapper(dossier.raison_sociale)}</title>
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
  .m { text-align:right; white-space:nowrap; width:180px; }
  .total td { font-weight:bold; background:#f7f5ef; }
  .negatif { color:#8b0000; }
  .pied { margin-top:30px; font-size:14px; color:#555; border-top:1px solid #999; padding-top:10px; }
  @media print { body { padding:0; } .bandeau { border-width:1px; } }
</style>
</head>
<body>
<h1>Liasse fiscale — document de travail</h1>
<p class="sous">${identite}${dossier.adresse ? "<br>" + echapper(dossier.adresse) : ""}<br>Exercice du ${jour(debut)} au ${jour(fin)} — établi le ${new Date().toLocaleDateString("fr-FR")}</p>

${bandeau}

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

${blocIS}

<p class="pied">Établi automatiquement depuis les écritures du dossier ${echapper(dossier.code)} (${lignes.length} lignes). Contrôle d'équilibre : total actif ${eur(totalActif)} / total passif ${eur(totalPassif)}. Ce document ne préjuge pas de la qualification fiscale de la société.</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
