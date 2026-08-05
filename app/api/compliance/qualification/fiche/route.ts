import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TITRES: Record<string, { titre: string; pourquoi: string }> = {
  US: {
    titre: "Obligations américaines",
    pourquoi: "Dues par toute LLC américaine, quel que soit le pays de résidence du dirigeant.",
  },
  FR: {
    titre: "Obligations françaises",
    pourquoi: "Dues parce que le dirigeant est résident fiscal en France (rattachement français de la structure et de son dirigeant).",
  },
  EU: {
    titre: "Obligations européennes",
    pourquoi: "Liées aux ventes B2C à des particuliers de l'Union européenne.",
  },
};

const ETIQUETTES: Record<string, string> = {
  Q1: "résidence fiscale",
  Q2: "pays de la structure",
  Q3: "forme de la structure",
  Q4: "impôt payé aux USA",
  Q5: "sommes perçues personnellement",
  Q6: "comptes à l'étranger",
  Q7: "détention d'au moins 10 %",
  Q8: "ventes B2C dans l'UE",
  Q9: "qualification française",
  Q10: "salariés ou rémunération",
};

// L organisme vient du JETON SIGNE session_academia. Avec l ancien cookie
// sb_user, un cookie forge permettait d editer la carte d obligations
// complete d un autre organisme.
function tenantDeLaSession(): string | null {
  const session = sessionCourante();
  return session ? session.tenantId : null;
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

function evalCondition(cond: any, reponses: Record<string, string>): boolean {
  if (!cond || typeof cond !== "object") return false;
  if (Array.isArray(cond.ou)) return cond.ou.some((c: any) => evalCondition(c, reponses));
  if (Array.isArray(cond.et)) return cond.et.every((c: any) => evalCondition(c, reponses));
  return Object.entries(cond).every(([q, v]) => reponses[q] === v);
}

function decrireCondition(cond: any): string {
  if (!cond || typeof cond !== "object") return "";
  if (Array.isArray(cond.ou)) return cond.ou.map(decrireCondition).join(", OU ");
  if (Array.isArray(cond.et)) return cond.et.map(decrireCondition).join(", ET ");
  return Object.entries(cond)
    .map(([q, v]) => (ETIQUETTES[q] || q) + " = " + libelle(String(v)))
    .join(", ET ");
}

function aConfirmer(consequence: string): boolean {
  return /A CONFIRMER/i.test(consequence || "");
}

function nettoyer(consequence: string): string {
  return (consequence || "").replace(/\s*(â€”|—|–|-)?\s*A CONFIRMER\s*$/i, "").trim();
}

export async function GET(req: NextRequest) {
  const tenantId = tenantDeLaSession();
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans société rattachée. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const { data: tenant } = await supabase
      .from("compliance_tenants")
      .select("label, legal_name, formation_state")
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
      .select("document_code, document_lib, juridiction, condition, consequence, source, echeance_rule_code")
      .eq("actif", true)
      .order("juridiction");
    if (eG) return NextResponse.json({ error: eG.message }, { status: 500 });

    const obligations: any[] = [];
    const ecartes: any[] = [];
    for (const r of regles || []) {
      if (evalCondition(r.condition, reponses)) obligations.push(r);
      else ecartes.push(r);
    }

    const codesEcheance = obligations.map((o) => o.echeance_rule_code).filter((c) => !!c);

    let echeances: any[] = [];
    if (codesEcheance.length > 0) {
      const { data: ech } = await supabase
        .from("compliance_deadlines")
        .select("rule_code, period_label, due_date")
        .eq("tenant_id", tenantId)
        .in("rule_code", codesEcheance)
        .gte("due_date", new Date().toISOString().slice(0, 10))
        .order("due_date")
        .limit(12);
      echeances = ech || [];
    }

    const nom = tenant?.legal_name || tenant?.label || "Client";

    const lignesQ = (questions || [])
      .map((q) => "<tr><td>" + q.question + "</td><td class='r'>" +
        (reponses[q.code] ? libelle(reponses[q.code]) : "<em>sans réponse</em>") + "</td></tr>")
      .join("");

    const blocs = ["US", "FR", "EU"]
      .map((jur) => {
        const liste = obligations.filter((o) => o.juridiction === jur);
        if (liste.length === 0) return "";
        const t = TITRES[jur];
        const cartes = liste
          .map((o) => "<div class='ob'><div class='t'>" + o.document_lib +
            (aConfirmer(o.consequence) ? " <span class='badge'>à confirmer</span>" : "") + "</div>" +
            "<div>" + nettoyer(o.consequence) + "</div>" +
            "<div class='src'>Source : " + o.source + "</div></div>")
          .join("");
        return "<h2>" + t.titre + " (" + liste.length + ")</h2>" +
          "<p class='pourquoi'>" + t.pourquoi + "</p>" + cartes;
      })
      .join("");

    const lignesEc = ecartes
      .map((e) => "<div class='ec'><strong>" + e.document_lib + "</strong> — ne vous concerne pas. S'appliquerait si : " +
        decrireCondition(e.condition) + ".</div>")
      .join("");

    const nomsDocs: Record<string, string> = {};
    for (const r of regles || []) {
      if (r.echeance_rule_code) nomsDocs[r.echeance_rule_code] = r.document_lib;
    }
    const lignesEch = echeances
      .map((d) => "<tr><td>" + (nomsDocs[d.rule_code] || d.rule_code) + "</td><td>" + d.period_label +
        "</td><td class='r'>" + new Date(d.due_date).toLocaleDateString("fr-FR") + "</td></tr>")
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
  h2 { font-size:19px; margin:28px 0 4px 0; border-bottom:2px solid #1a1a1a; padding-bottom:4px; }
  .sous { color:#444; margin:0 0 16px 0; }
  .pourquoi { color:#555; font-style:italic; margin:4px 0 10px 0; }
  table { width:100%; border-collapse:collapse; margin:8px 0 14px 0; }
  td, th { border:1px solid #999; padding:7px 10px; text-align:left; vertical-align:top; }
  .r { text-align:right; white-space:nowrap; }
  .ob { border-left:4px solid #b8860b; padding:8px 12px; margin:8px 0; background:#faf8f2; }
  .ob .t { font-weight:bold; }
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

${blocs}

<h2>Prochaines échéances</h2>
<table>
<tr><th>Obligation</th><th>Période</th><th class="r">Date limite</th></tr>
${lignesEch || "<tr><td colspan='3'>Aucune échéance à venir</td></tr>"}
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
