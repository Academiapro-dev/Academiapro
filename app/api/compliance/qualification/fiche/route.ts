import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function evalCondition(cond: any, reponses: Record<string, string>): boolean {
  if (!cond || typeof cond !== "object") return false;
  if (Array.isArray(cond.ou)) return cond.ou.some((c: any) => evalCondition(c, reponses));
  if (Array.isArray(cond.et)) return cond.et.every((c: any) => evalCondition(c, reponses));
  return Object.entries(cond).every(([q, v]) => reponses[q] === v);
}

function decrireCondition(cond: any): string {
  if (!cond || typeof cond !== "object") return "";
  if (Array.isArray(cond.ou)) return cond.ou.map(decrireCondition).join(" OU ");
  if (Array.isArray(cond.et)) return cond.et.map(decrireCondition).join(" ET ");
  return Object.entries(cond).map(([q, v]) => q + "=" + v).join(" ET ");
}

function libelle(opt: string): string {
  const table: Record<string, string> = {
    france: "France", autre: "Autre", usa: "USA",
    smllc: "LLC unipersonnelle (SMLLC)", llc_multi: "LLC multi-membres",
    corporation: "Corporation", oui: "Oui", non: "Non",
    remboursement_compte_courant: "Remboursement de compte courant",
    distributions: "Distributions", direct: "Oui, en direct",
    merchant_of_record: "Oui, via merchant of record",
    transparente: "Transparente", opaque_siege_france: "Opaque (siège en France)",
    non_tranchee: "Non tranchée",
  };
  return table[opt] || opt.replace(/_/g, " ");
}

function aConfirmer(consequence: string): boolean {
  return /A CONFIRMER/i.test(consequence || "");
}

function nettoyer(consequence: string): string {
  return (consequence || "").replace(/\s*(â€”|—|–|-)?\s*A CONFIRMER\s*$/i, "").trim();
}

export async function GET(req: NextRequest) {
  const tenantId = tenantDeLaSession(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const { data: tenant } = await supabase
      .from("compliance_tenants")
      .select("label, legal_name, formation_state, formation_date")
      .eq("tenant_id", tenantId)
      .limit(1)
      .maybeSingle();

    const { data: questions, error: eQ } = await supabase
      .from("compliance_qualif_questions")
      .select("code, ordre, question, options")
      .eq("actif", true)
      .order("ordre");
    if (eQ) return NextResponse.json({ error: eQ.message }, { status: 500 });

    const { data: lignesRep, error: eR } = await supabase
      .from("compliance_qualif_reponses")
      .select("question_code, reponse")
      .eq("tenant_id", tenantId);
    if (eR) return NextResponse.json({ error: eR.message }, { status: 500 });

    const reponses: Record<string, string> = {};
    for (const l of lignesRep || []) reponses[l.question_code] = l.reponse;

    const { data: regles, error: eG } = await supabase
      .from("compliance_qualif_regles")
      .select("document_code, document_lib, juridiction, condition, consequence, source")
      .eq("actif", true)
      .order("juridiction");
    if (eG) return NextResponse.json({ error: eG.message }, { status: 500 });

    const obligations: any[] = [];
    const ecartes: any[] = [];
    for (const r of regles || []) {
      if (evalCondition(r.condition, reponses)) obligations.push(r);
      else ecartes.push(r);
    }

    const { data: echeances } = await supabase
      .from("compliance_deadlines")
      .select("rule_code, period_label, due_date")
      .eq("tenant_id", tenantId)
      .gte("due_date", new Date().toISOString().slice(0, 10))
      .order("due_date")
      .limit(12);

    const nom = tenant?.legal_name || tenant?.label || "Client";
    const lignesQ = (questions || [])
      .map((q) => "<tr><td>" + q.question + "</td><td class='r'>" +
        (reponses[q.code] ? libelle(reponses[q.code]) : "<em>sans réponse</em>") + "</td></tr>")
      .join("");
    const lignesOb = obligations
      .map((o) => "<div class='ob'><div class='t'>" + o.document_lib + " <span class='j'>(" + o.juridiction + ")</span>" +
        (aConfirmer(o.consequence) ? " <span class='badge'>à confirmer</span>" : "") + "</div>" +
        "<div>" + nettoyer(o.consequence) + "</div>" +
        "<div class='src'>Source : " + o.source + "</div></div>")
      .join("");
    const lignesEc = ecartes
      .map((e) => "<div class='ec'><strong>" + e.document_lib + "</strong> — ne s'applique pas (condition : " +
        decrireCondition(e.condition) + ")</div>")
      .join("");
    const lignesEch = (echeances || [])
      .map((d) => "<tr><td>" + d.rule_code + "</td><td>" + d.period_label + "</td><td class='r'>" +
        new Date(d.due_date).toLocaleDateString("fr-FR") + "</td></tr>")
      .join("");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Carte d'obligations — ${nom}</title>
<style>
  :root { color-scheme: light; }
  body { background:#fff; color:#1a1a1a; font-family: Georgia, 'Times New Roman', serif; margin:0; padding:32px 24px; max-width:820px; margin-left:auto; margin-right:auto; font-size:16px; line-height:1.55; }
  h1 { font-size:24px; margin:0 0 4px 0; }
  h2 { font-size:19px; margin:28px 0 8px 0; border-bottom:2px solid #1a1a1a; padding-bottom:4px; }
  .sous { color:#444; margin:0 0 16px 0; }
  table { width:100%; border-collapse:collapse; margin:8px 0 14px 0; }
  td, th { border:1px solid #999; padding:7px 10px; text-align:left; vertical-align:top; }
  .r { text-align:right; white-space:nowrap; }
  .ob { border-left:4px solid #b8860b; padding:8px 12px; margin:8px 0; background:#faf8f2; }
  .ob .t { font-weight:bold; }
  .ob .j { color:#666; font-weight:normal; }
  .ob .src { font-size:13px; color:#666; margin-top:2px; }
  .badge { font-size:12px; background:#b8860b; color:#fff; padding:1px 8px; border-radius:10px; vertical-align:middle; }
  .ec { color:#555; margin:6px 0; }
  .pied { margin-top:28px; font-size:13px; color:#555; border-top:1px solid #999; padding-top:10px; }
  @media print { body { padding:0; } }
</style>
</head>
<body>
<h1>Carte d'obligations déclaratives</h1>
<p class="sous">${nom}${tenant?.formation_state ? " — structure " + tenant.formation_state + " (USA)" : ""} — établie le ${new Date().toLocaleDateString("fr-FR")}</p>

<h2>Votre situation déclarée</h2>
<table>${lignesQ}</table>

<h2>Vos obligations (${obligations.length})</h2>
${lignesOb}

<h2>Prochaines échéances</h2>
<table>
<tr><th>Obligation</th><th>Période</th><th class="r">Date limite</th></tr>
${lignesEch || "<tr><td colspan='3'>Aucune échéance générée</td></tr>"}
</table>

<h2>Ce qui ne vous concerne pas (${ecartes.length})</h2>
${lignesEc}

<p class="pied">Carte établie automatiquement à partir de vos réponses, par règles documentées non validées par un professionnel. Ce document ne constitue pas un avis fiscal ni juridique. Les règles marquées « à confirmer » signalent une incertitude connue.</p>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e && e.message ? e.message : e) },
      { status: 500 }
    );
  }
}
