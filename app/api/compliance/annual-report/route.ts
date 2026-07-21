import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// License tax Wyoming : max(60, 0.0002 * valeur des actifs WY)
function licenseTax(assets: number): number {
  const calc = assets * 0.0002;
  return Math.max(60, Math.round(calc * 100) / 100);
}

function ficheHTML(t: any, year: number, tax: number): string {
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>
  body { font-family: Georgia, serif; color:#1a1a1a; padding:40px; max-width:800px; margin:0 auto; }
  h1 { color:#0a3d2e; border-bottom:3px solid #0a3d2e; padding-bottom:10px; }
  h2 { color:#0a3d2e; margin-top:28px; font-size:18px; }
  table { width:100%; border-collapse:collapse; margin:16px 0; }
  td { padding:10px; border:1px solid #ccc; vertical-align:top; }
  td.label { background:#f4f4f0; font-weight:bold; width:38%; }
  .montant { font-size:22px; color:#0a3d2e; font-weight:bold; }
  .alerte { background:#fff8e1; border-left:4px solid #c8a96e; padding:12px 16px; margin:16px 0; }
  .cta { display:inline-block; background:#0a3d2e; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; margin-top:12px; }
  .footer { margin-top:40px; font-size:12px; color:#888; border-top:1px solid #eee; padding-top:12px; }
</style></head><body>

<h1>Fiche de preparation - Wyoming Annual Report ${year}</h1>
<p>Document de preparation genere le ${date}. Recopiez ces informations dans l'assistant en ligne du Wyoming Secretary of State, puis archivez l'accuse.</p>

<h2>Informations de l'entite</h2>
<table>
  <tr><td class="label">Legal name</td><td>${t.legal_name}</td></tr>
  <tr><td class="label">Wyoming Filing ID</td><td>${t.wy_filing_id || "- a renseigner -"}</td></tr>
  <tr><td class="label">Registered agent</td><td>${t.registered_agent_name || "-"}</td></tr>
  <tr><td class="label">Mailing address</td><td>${t.mailing_address || "-"}</td></tr>
  <tr><td class="label">Principal office</td><td>${t.principal_office_address || "-"}</td></tr>
  <tr><td class="label">Valeur des actifs situes au Wyoming</td><td>${(t.wy_assets_value ?? 0)} USD</td></tr>
</table>

<h2>License tax a payer</h2>
<p class="montant">${tax.toFixed(2)} USD</p>
<p>Calcul : maximum entre 60 USD et 0,0002 x valeur des actifs Wyoming.</p>

<div class="alerte">
  <strong>A verifier avant depot :</strong> confirmez la valeur des actifs situes au Wyoming
  (pour une plateforme de services numeriques sans biens physiques dans l'Etat, elle est
  generalement nulle, d'ou la license tax minimale de 60 USD). Le Wyoming n'autorise pas
  la modification d'un rapport deja depose : verifiez chaque champ avant validation.
</div>

<h2>Depot</h2>
<p>Le depot se fait en ligne via l'assistant du Wyoming Secretary of State :</p>
<a class="cta" href="https://wyobiz.wyo.gov/Business/AnnualReport.aspx">Ouvrir l'Annual Report Wizard</a>

<div class="footer">
  AcademIA Pro - Module Compliance - Fiche de preparation Annual Report ${year} - ${date}<br/>
  Ce document est une aide a la saisie et ne constitue pas un depot officiel.
</div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  const legitime =
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr")
    || origine.includes("vercel.app") || referent.includes("vercel.app")
    || origine.includes("localhost") || referent.includes("localhost");
  if (!legitime) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  try {
    const { tenant_id, year } = await req.json();
    const annee = year || new Date().getFullYear() + 1;

    // Charger le profil du tenant
    const { data: tenant, error: e1 } = await supabase
      .from("compliance_tenants")
      .select("*")
      .eq("tenant_id", tenant_id)
      .single();
    if (e1 || !tenant) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
    }

    const tax = licenseTax(Number(tenant.wy_assets_value ?? 0));
    const html = ficheHTML(tenant, annee, tax);

    // Version suivante dans le coffre
    const { data: ver } = await supabase.rpc("compliance_next_doc_version", {
      p_tenant_id: tenant_id,
      p_doc_type: "fiche_annual_report",
    });
    const version = ver || 1;

    // Ranger dans le bucket compliance-docs
    const path = tenant_id + "/annual_report_" + annee + "_v" + version + ".html";
    const up = await fetch(
      process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/compliance-docs/" + path,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "text/html",
          "x-upsert": "true",
        },
        body: html,
      }
    );
    if (!up.ok) {
      const t = await up.text();
      return NextResponse.json({ error: "Upload coffre echoue: " + t }, { status: 500 });
    }

    // Indexer dans compliance_documents
    await supabase.from("compliance_documents").insert({
      tenant_id: tenant_id,
      rule_code: "WY_ANNUAL_REPORT",
      doc_type: "fiche_annual_report",
      title: "Fiche Annual Report Wyoming " + annee,
      version: version,
      storage_path: "compliance-docs/" + path,
      mime_type: "text/html",
    });

    // Envoyer par email
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "AcademIA Pro <contact@hebrewproai.com>",
        to: ["contact@academiapro.fr"],
        subject: "Fiche Annual Report Wyoming " + annee + " - license tax " + tax.toFixed(2) + " USD",
        html: html,
      }),
    });

    return NextResponse.json({ success: true, version, tax, path });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
