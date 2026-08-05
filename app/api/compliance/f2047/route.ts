import { NextRequest, NextResponse } from "next/server";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// L organisme vient du JETON SIGNE session_academia, et non plus du cookie
// sb_user qui n etait qu un objet JSON encode, forgeable par n importe qui.
function tenantDeLaSession(): string | null {
  const session = sessionCourante();
  return session ? session.tenantId : null;
}

function eur(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}

export async function GET(req: NextRequest) {
  const tenantId = tenantDeLaSession();
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans société rattachée. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const p = req.nextUrl.searchParams;
  const revenus = Math.max(0, parseFloat(p.get("revenus_us") || "10000") || 0);
  const impotUs = Math.max(0, parseFloat(p.get("impot_us") || "1500") || 0);
  const categorie = (p.get("categorie") || "Prestations de services (BIC)").slice(0, 120);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fiche de travail 2047 — revenus de source américaine</title>
<style>
  :root { color-scheme: light; }
  body { background:#fff; color:#1a1a1a; font-family: Georgia, 'Times New Roman', serif; margin:0; padding:32px 24px; max-width:820px; margin-left:auto; margin-right:auto; font-size:16px; line-height:1.55; }
  h1 { font-size:24px; margin:0 0 4px 0; }
  h2 { font-size:19px; margin:26px 0 8px 0; border-bottom:2px solid #1a1a1a; padding-bottom:4px; }
  .sous { color:#444; margin:0 0 16px 0; }
  .bandeau { background:#fff3cd; border:2px solid #b8860b; padding:12px 16px; margin:16px 0; font-weight:bold; }
  table { width:100%; border-collapse:collapse; margin:8px 0 14px 0; }
  td, th { border:1px solid #999; padding:8px 10px; text-align:left; vertical-align:top; }
  th { background:#f0ede4; }
  .m { text-align:right; white-space:nowrap; width:170px; }
  .methode { border:1px solid #999; border-left:4px solid #b8860b; padding:12px 14px; margin:12px 0; background:#faf8f2; }
  .methode h3 { margin:0 0 6px 0; font-size:17px; }
  .pied { margin-top:26px; font-size:13px; color:#555; border-top:1px solid #999; padding-top:10px; }
  .note { font-size:14px; color:#555; }
</style>
</head>
<body>
<h1>Fiche de travail — formulaire 2047</h1>
<p class="sous">Revenus de source américaine perçus par un résident fiscal français — établie le ${new Date().toLocaleDateString("fr-FR")}</p>

<div class="bandeau">DOCUMENT DE TRAVAIL — Cas B de la cartographie (impôt effectivement payé aux États-Unis). La méthode conventionnelle applicable dépend de la CATÉGORIE de revenus (convention fiscale France–USA du 31 août 1994) : les DEUX méthodes sont présentées ci-dessous, le choix est À CONFIRMER par un professionnel avant tout report sur la déclaration.</div>

<h2>Données saisies</h2>
<table>
<tr><td>Catégorie de revenus déclarée</td><td class="m">${categorie}</td></tr>
<tr><td>Revenus de source américaine (bruts, convertis en euros)</td><td class="m">${eur(revenus)}</td></tr>
<tr><td>Impôt effectivement payé aux États-Unis</td><td class="m">${eur(impotUs)}</td></tr>
</table>
<p class="note">Pour modifier ces montants : ajouter à l'adresse ?revenus_us=…&amp;impot_us=…&amp;categorie=…</p>

<h2>Méthode A — crédit d'impôt égal à l'impôt FRANÇAIS</h2>
<div class="methode">
<h3>Principe</h3>
<p>Le revenu américain est déclaré en France et imposé au barème, puis un crédit d'impôt égal à l'impôt français correspondant à ce revenu est accordé : le revenu compte pour le taux (taux effectif) mais n'est pas imposé deux fois. C'est la méthode de la convention FR-USA pour la plupart des revenus d'activité et immobiliers imposables aux USA.</p>
<h3>Reports indicatifs</h3>
<table>
<tr><td>2047 — revenu à déclarer</td><td class="m">${eur(revenus)}</td></tr>
<tr><td>2042, case 8TK (revenus ouvrant droit à un crédit égal à l'impôt français)</td><td class="m">${eur(revenus)}</td></tr>
<tr><td>Effet : impôt français neutralisé sur ce revenu ; l'impôt US de ${eur(impotUs)} n'est pas remboursé par la France</td><td class="m">—</td></tr>
</table>
</div>

<h2>Méthode B — crédit d'impôt égal à l'impôt AMÉRICAIN</h2>
<div class="methode">
<h3>Principe</h3>
<p>Le revenu américain est imposé en France au barème, et l'impôt payé aux USA vient en déduction de l'impôt français, dans la limite de l'impôt français correspondant à ce revenu. C'est la méthode de la convention FR-USA pour certains revenus passifs (dividendes, intérêts, redevances).</p>
<h3>Reports indicatifs</h3>
<table>
<tr><td>2047 — revenu à déclarer</td><td class="m">${eur(revenus)}</td></tr>
<tr><td>Crédit d'impôt (plafonné à l'impôt français correspondant)</td><td class="m">${eur(impotUs)}</td></tr>
<tr><td>2042, cases 8VL / 8VM selon la nature du revenu</td><td class="m">—</td></tr>
</table>
</div>

<h2>Ce que cette fiche ne fait pas</h2>
<p class="note">Elle ne choisit pas la méthode (cela dépend de l'article conventionnel applicable à la catégorie exacte du revenu), ne calcule pas l'impôt français final (barème global du foyer), et ne remplace ni la déclaration en ligne ni l'avis d'un professionnel. Elle prépare le dossier : montants convertis, deux chiffrages, cases cibles.</p>

<p class="pied">Document de travail établi automatiquement — règle non validée par un professionnel (méthode conventionnelle À CONFIRMER). Convention France–USA du 31 août 1994 modifiée. Ne constitue pas un avis fiscal.</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
