import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🚨 L EXPEDITEUR NE DOIT PAS ETRE CELUI D UN AUTRE PRODUIT — 31/08.
//
// CE FICHIER ENVOYAIT DEPUIS contact@hebrewproai.com, le domaine du beit
// midrash. Une fiche fiscale qui arrive de la fait douter de tout le reste.
//
// ⚠️ RENSEIGNER COMPLIANCE_EXPEDITEUR DANS VERCEL des que le domaine du
// produit est verifie chez Resend.
const EXPEDITEUR = process.env.COMPLIANCE_EXPEDITEUR
  || "Suivi des echeances <contact@academiapro.fr>";

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
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

<h1>Fiche de préparation — Wyoming Annual Report ${year}</h1>
<p>Document de préparation généré le ${date}. Recopiez ces informations dans l'assistant en ligne du Wyoming Secretary of State, puis archivez l'accusé.</p>

<h2>Informations de l'entité</h2>
<table>
  <tr><td class="label">Legal name</td><td>${t.legal_name}</td></tr>
  <tr><td class="label">Wyoming Filing ID</td><td>${t.wy_filing_id || "— à renseigner —"}</td></tr>
  <tr><td class="label">Registered agent</td><td>${t.registered_agent_name || "—"}</td></tr>
  <tr><td class="label">Mailing address</td><td>${t.mailing_address || "—"}</td></tr>
  <tr><td class="label">Principal office</td><td>${t.principal_office_address || "—"}</td></tr>
  <tr><td class="label">Valeur des actifs situés au Wyoming</td><td>${(t.wy_assets_value ?? 0)} USD</td></tr>
</table>

<h2>License tax à payer</h2>
<p class="montant">${tax.toFixed(2)} USD</p>
<p>Calcul : maximum entre 60 USD et 0,0002 × valeur des actifs Wyoming.</p>

<div class="alerte">
  <strong>À vérifier avant dépôt :</strong> confirmez la valeur des actifs situés au Wyoming
  (pour une plateforme de services numériques sans biens physiques dans l'État, elle est
  généralement nulle, d'où la license tax minimale de 60 USD). Le Wyoming n'autorise pas
  la modification d'un rapport déjà déposé : vérifiez chaque champ avant validation.
</div>

<h2>Dépôt</h2>
<p>Le dépôt se fait en ligne via l'assistant du Wyoming Secretary of State :</p>
<a class="cta" href="https://wyobiz.wyo.gov/Business/AnnualReport.aspx">Ouvrir l'Annual Report Wizard</a>

<div class="footer">
  Fiche de préparation Annual Report ${year} — ${date}<br/>
  Ce document est une aide à la saisie et ne constitue pas un dépôt officiel.
</div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  // L organisme ET l adresse email viennent du JETON SIGNE session_academia.
  // Avec l ancien cookie sb_user, un cookie forge faisait generer la fiche
  // d un autre organisme ET l expediait a l adresse de l attaquant.
  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  const emailSession = session ? session.email : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans société rattachée. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const annee = Number(body.year) || new Date().getFullYear() + 1;
    const entiteDemandee = String(body.entite_id || "").trim();

    // ---- LA SOCIETE CONCERNEE ----
    //
    // 🚨 LE `.single()` D ORIGINE AURAIT CASSE A LA DEUXIEME SOCIETE.
    // PostgREST refuse de choisir quand plusieurs lignes correspondent : un
    // gestionnaire ayant deux LLC aurait vu la generation echouer, sans que
    // le message n indique pourquoi.
    //
    // 🚨 L IDENTIFIANT RECU N EST PAS UNE AUTORISATION : il est cherche AVEC
    // le filtre tenant_id de la session. Une societe d un autre
    // gestionnaire est simplement introuvable.
    let requeteEntite = supabase
      .from("compliance_tenants")
      .select("*")
      .eq("tenant_id", tenantId);

    if (entiteDemandee) {
      requeteEntite = requeteEntite.eq("id", entiteDemandee);
    }

    const { data: tenant, error: e1 } = await requeteEntite
      .order("label", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (e1) {
      console.error("[annual-report] lecture entite :", e1.message);
      return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    }

    if (!tenant) {
      return NextResponse.json(
        { error: entiteDemandee ? "Société introuvable." : "Aucune société enregistrée." },
        { status: 404 }
      );
    }

    const entiteId = tenant.id;

    // ⚠️ L ANNUAL REPORT EST UNE OBLIGATION DU WYOMING. Le generer pour une
    // societe constituee ailleurs produirait un document sans objet, avec
    // un montant de license tax qui ne veut rien dire.
    const etat = String(tenant.formation_state || "").toUpperCase();
    if (etat && etat !== "WY") {
      return NextResponse.json(
        {
          error: tenant.label + " est constituée en " + etat
            + " : l'Annual Report du Wyoming ne s'applique pas.",
        },
        { status: 400 }
      );
    }

    const tax = licenseTax(Number(tenant.wy_assets_value ?? 0));
    const html = ficheHTML(tenant, annee, tax);

    const { data: ver } = await supabase.rpc("compliance_next_doc_version", {
      p_tenant_id: tenantId,
      p_doc_type: "fiche_annual_report",
    });
    const version = ver || 1;

    // Le chemin porte l identifiant de la SOCIETE : sans cela, deux
    // societes d un meme gestionnaire ecraseraient mutuellement leur fiche,
    // upsert etant a true.
    const path = tenantId + "/" + entiteId + "/annual_report_" + annee + "_v" + version + ".html";

    const { error: upErr } = await supabase.storage
      .from("compliance-docs")
      .upload(path, html, {
        contentType: "text/html",
        upsert: true,
      });

    if (upErr) {
      console.error("[annual-report] depot au coffre :", upErr.message);
      return NextResponse.json({ error: "Dépôt au coffre impossible." }, { status: 500 });
    }

    // 🚨 entite_id EST INDISPENSABLE. Le tableau de bord filtre les
    // documents dessus depuis le 31/08 : une fiche enregistree sans lui
    // serait deposee au coffre mais INVISIBLE a l ecran.
    await supabase.from("compliance_documents").insert({
      tenant_id: tenantId,
      entite_id: entiteId,
      rule_code: "WY_ANNUAL_REPORT",
      doc_type: "fiche_annual_report",
      title: "Fiche Annual Report Wyoming " + annee + " — " + tenant.label,
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
            from: EXPEDITEUR,
            to: [emailSession],
            subject: "Annual Report Wyoming " + annee + " — " + tenant.label
              + " — license tax " + tax.toFixed(2) + " USD",
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
          email.raison = "Resend a refusé l'envoi";
          email.reponse = corps.slice(0, 500);
        }
      } catch (e: unknown) {
        email.envoye = false;
        email.raison = "Appel à Resend impossible";
        email.reponse = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      entite_id: entiteId,
      societe: tenant.label,
      version,
      tax,
      path,
      email,
    });
  } catch (e: any) {
    console.error("[annual-report] exception :", String(e && e.message ? e.message : e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
