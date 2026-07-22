import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
}

// Lit le cookie sb_user : identifiant, societe et adresse email du compte connecte.
function sessionDuCookie(req: NextRequest): { tenantId: string | null; email: string | null } {
  try {
    const brut = req.cookies.get("sb_user")?.value;
    if (!brut) return { tenantId: null, email: null };
    let texte = brut;
    try {
      texte = decodeURIComponent(brut);
    } catch {
      texte = brut;
    }
    const donnees = JSON.parse(texte);
    return { tenantId: donnees?.tenant_id || null, email: donnees?.email || null };
  } catch {
    return { tenantId: null, email: null };
  }
}

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
  Module Compliance - Fiche de preparation Annual Report ${year} - ${date}<br/>
  Ce document est une aide a la saisie et ne constitue pas un depot officiel.
</div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { tenantId, email: emailSession } = sessionDuCookie(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const { year } = await req.json();
    const annee = year || new Date().getFullYear() + 1;

    const { data: tenant, error: e1 } = await supabase
      .from("compliance_tenants")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();
    if (e1 || !tenant) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
    }

    const tax = licenseTax(Number(tenant.wy_assets_value ?? 0));
    const html = ficheHTML(tenant, annee, tax);

    const { data: ver } = await supabase.rpc("compliance_next_doc_version", {
      p_tenant_id: tenantId,
      p_doc_type: "fiche_annual_report",
    });
    const version = ver || 1;

    const path = tenantId + "/annual_report_" + annee + "_v" + version + ".html";

    const { error: upErr } = await supabase.storage
      .from("compliance-docs")
      .upload(path, html, {
        contentType: "text/html",
        upsert: true,
      });
    if (upErr) {
      return NextResponse.json({ error: "Upload coffre echoue: " + upErr.message }, { status: 500 });
    }

    await supabase.from("compliance_documents").insert({
      tenant_id: tenantId,
      rule_code: "WY_ANNUAL_REPORT",
      doc_type: "fiche_annual_report",
      title: "Fiche Annual Report Wyoming " + annee,
      version: version,
      storage_path: "compliance-docs/" + path,
      mime_type: "text/html",
    });

    // ---- ENVOI EMAIL vers l'adresse du COMPTE CONNECTE ----
    const email: Record<string, unknown> = { tente: true, destinataire: emailSession };

    if (!emailSession) {
      email.envoye = false;
      email.raison = "Aucune adresse email dans la session";
    } else if (!process.env.RESEND_API_KEY) {
      email.envoye = false;
      email.raison = "RESEND_API_KEY absente des variables d'environnement Vercel";
    } else {
      try {
        const rMail = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "Mr. Compliance <contact@hebrewproai.com>",
            to: [emailSession],
            subject: "Fiche Annual Report Wyoming " + annee + " - license tax " + tax.toFixed(2) + " USD",
            html: html,
          }),
        });

        const corps = await rMail.text();
        email.statut_http = rMail.status;

        if (rMail.ok) {
          email.envoye = true;
          email.reponse = corps.slice(0, 300);
        } else {
          email.envoye = false;
          email.raison = "Resend a refuse l'envoi";
          email.reponse = corps.slice(0, 500);
        }
      } catch (e: unknown) {
        email.envoye = false;
        email.raison = "Appel a Resend impossible";
        email.reponse = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({ success: true, tenant_id: tenantId, version, tax, path, email });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
