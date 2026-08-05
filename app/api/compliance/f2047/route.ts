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
      { error: "Session sans societe rattachee. Reconnectez-vous." },
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
<title>Fiche de travail 2047 — revenus de source americaine</title>
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
<p class="sous">Revenus de source americaine percus par un resident fiscal francais — etablie le ${new Date().toLocaleDateString("fr-FR")}</p>

<div class="bandeau">DOCUMENT DE TRAVAIL — Cas B de la cartographie (impot effectivement paye aux Etats-Unis). La methode conventionnelle applicable depend de la CATEGORIE de revenus (convention fiscale France–USA du 31 aout 1994) : les DEUX methodes sont presentees ci-dessous, le choix est A CONFIRMER par un professionnel avant tout report sur la declaration.</div>

<h2>Donnees saisies</h2>
<table>
<tr><td>Categorie de revenus declaree</td><td class="m">${categorie}</td></tr>
<tr><td>Revenus de source americaine (bruts, convertis en euros)</td><td class="m">${eur(revenus)}</td></tr>
<tr><td>Impot effectivement paye aux Etats-Unis</td><td class="m">${eur(impotUs)}</td></tr>
</table>
<p class="note">Pour modifier ces montants : ajouter a l'adresse ?revenus_us=...&amp;impot_us=...&amp;categorie=...</p>

<h2>Methode A — credit d'impot egal a l'impot FRANCAIS</h2>
<div class="methode">
<h3>Principe</h3>
<p>Le revenu americain est declare en France et impose au bareme, puis un credit d'impot egal a l'impot francais correspondant a ce revenu est accorde : le revenu compte pour le taux (taux effectif) mais n'est pas impose deux fois. C'est la methode de la convention FR-USA pour la plupart des revenus d'activite et immobiliers imposables aux USA.</p>
<h3>Reports indicatifs</h3>
<table>
<tr><td>2047 — revenu a declarer</td><td class="m">${eur(revenus)}</td></tr>
<tr><td>2042, case 8TK (revenus ouvrant droit a un credit egal a l'impot francais)</td><td class="m">${eur(revenus)}</td></tr>
<tr><td>Effet : impot francais neutralise sur ce revenu ; l'impot US de ${eur(impotUs)} n'est pas rembourse par la France</td><td class="m">—</td></tr>
</table>
</div>

<h2>Methode B — credit d'impot egal a l'impot AMERICAIN</h2>
<div class="methode">
<h3>Principe</h3>
<p>Le revenu americain est impose en France au bareme, et l'impot paye aux USA vient en deduction de l'impot francais, dans la limite de l'impot francais correspondant a ce revenu. C'est la methode de la convention FR-USA pour certains revenus passifs (dividendes, interets, redevances).</p>
<h3>Reports indicatifs</h3>
<table>
<tr><td>2047 — revenu a declarer</td><td class="m">${eur(revenus)}</td></tr>
<tr><td>Credit d'impot (plafonne a l'impot francais correspondant)</td><td class="m">${eur(impotUs)}</td></tr>
<tr><td>2042, cases 8VL / 8VM selon la nature du revenu</td><td class="m">—</td></tr>
</table>
</div>

<h2>Ce que cette fiche ne fait pas</h2>
<p class="note">Elle ne choisit pas la methode (cela depend de l'article conventionnel applicable a la categorie exacte du revenu), ne calcule pas l'impot francais final (bareme global du foyer), et ne remplace ni la declaration en ligne ni l'avis d'un professionnel. Elle prepare le dossier : montants convertis, deux chiffrages, cases cibles.</p>

<p class="pied">Document de travail etabli automatiquement — regle non validee par un professionnel (methode conventionnelle A CONFIRMER). Convention France–USA du 31 aout 1994 modifiee. Ne constitue pas un avis fiscal.</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
