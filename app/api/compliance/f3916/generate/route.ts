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

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
}

function fr(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

function dateFR(v: unknown): string {
  if (!v) return "-";
  const s = String(v).slice(0, 10);
  const p = s.split("-");
  if (p.length !== 3) return s;
  return p[2] + "/" + p[1] + "/" + p[0];
}

function ficheHTML(comptes: any[], annee: number, tousValides: boolean): string {
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  const blocs = comptes.map((c, i) => `
<h2>Compte ${i + 1} : ${fr(c.designation)}</h2>
<table>
  <tr><td class="label">Designation du compte</td><td>${fr(c.designation)}</td></tr>
  <tr><td class="label">Type de compte</td><td>${fr(c.type_compte)}</td></tr>
  <tr><td class="label">Caractere</td><td>${fr(c.caractere)}</td></tr>
  <tr><td class="label">Organisme gestionnaire</td><td>${fr(c.organisme_nom)}</td></tr>
  <tr><td class="label">Adresse de l'organisme</td><td>${fr(c.organisme_adresse)}</td></tr>
  <tr><td class="label">Pays de l'organisme</td><td>${fr(c.organisme_pays)}</td></tr>
  <tr><td class="label">Numero de compte</td><td>${fr(c.numero_compte)}</td></tr>
  <tr><td class="label">Date d'ouverture</td><td>${dateFR(c.date_ouverture)}</td></tr>
  <tr><td class="label">Date de cloture</td><td>${dateFR(c.date_cloture)}</td></tr>
  <tr><td class="label">Devise</td><td>${fr(c.devise)}</td></tr>
  <tr><td class="label">Titulaire declare</td><td>${fr(c.titulaire)}</td></tr>
  <tr><td class="label">Precision sur le titulaire</td><td>${fr(c.titulaire_precision)}</td></tr>
  <tr><td class="label">Valide par un fiscaliste</td><td>${c.valide_par_fiscaliste ? "OUI" : "NON - a faire valider"}</td></tr>
  ${c.notes ? '<tr><td class="label">Notes</td><td>' + fr(c.notes) + "</td></tr>" : ""}
</table>`).join("\n");

  const avertissement = tousValides ? "" : `
<div class="alerte">
  <strong>A faire valider :</strong> au moins un compte n'a pas encore ete valide par un
  fiscaliste. Point de forme a confirmer : le formulaire distingue le compte
  <em>detenu</em> du compte <em>detenu par une entite dont vous etes beneficiaire</em>.
  Pour une Single-Member LLC transparente, l'administration accepte generalement le
  titulaire personne physique, mais faites confirmer avant depot.
</div>`;

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>
  body { font-family: Georgia, serif; color:#1a1a1a; padding:40px; max-width:800px; margin:0 auto; }
  h1 { color:#0a3d2e; border-bottom:3px solid #0a3d2e; padding-bottom:10px; }
  h2 { color:#0a3d2e; margin-top:28px; font-size:18px; }
  table { width:100%; border-collapse:collapse; margin:16px 0; }
  td { padding:10px; border:1px solid #ccc; vertical-align:top; }
  td.label { background:#f4f4f0; font-weight:bold; width:38%; }
  .alerte { background:#fff8e1; border-left:4px solid #c8a96e; padding:12px 16px; margin:16px 0; }
  .fondement { background:#f0f5f2; border-left:4px solid #0a3d2e; padding:12px 16px; margin:16px 0; }
  .etape { background:#f4f4f0; border-left:4px solid #0a3d2e; padding:12px 16px; margin:16px 0; }
  ol { line-height:1.8; }
  .footer { margin-top:40px; font-size:12px; color:#666; border-top:1px solid #eee; padding-top:12px; }
</style></head><body>

<h1>Fiche de preparation - Declaration 2042 et formulaire 3916 - ${annee}</h1>
<p>Document de preparation genere le ${date}. Recopiez ces informations dans votre
declaration de revenus sur impots.gouv.fr.</p>

<div class="fondement">
  <strong>Fondement de l'obligation - article 1649 A du CGI :</strong> les personnes
  physiques domiciliees en France doivent declarer l'ensemble des comptes ouverts,
  detenus, utilises ou sous procuration a l'etranger. Meme lorsque le compte est
  formellement au nom d'une LLC americaine, deux situations engagent le declarant a
  titre personnel : (1) une Single-Member LLC est generalement traitee comme une
  entite transparente par le droit fiscal francais, assimilant avoirs et activite
  directement a son proprietaire ; (2) le gerant / membre unique habilite a faire
  fonctionner le compte dispose d'un droit d'utilisation ou d'une procuration
  effective. Penalite en cas d'omission : 1 500 EUR par compte et par an.
</div>

<h2>Declaration 2042 - ce qui change</h2>

<div class="etape">
  <strong>Une seule case a cocher.</strong> Votre declaration de revenus reste
  celle d'un particulier. Le seul ajout lie a la societe est la case
  <strong>8UU</strong> de la 2042, qui ouvre l'annexe 3916.
</div>

<table>
  <tr><td class="label">Formulaire</td><td>2042 - declaration de revenus (particulier)</td></tr>
  <tr><td class="label">Case a cocher</td><td><strong>8UU</strong> - Comptes ouverts, utilises ou clos a l'etranger</td></tr>
  <tr><td class="label">Annexe declenchee</td><td>3916 / 3916-bis (detaillee ci-dessous)</td></tr>
  <tr><td class="label">Echeance</td><td>Mai ${annee + 1}</td></tr>
</table>

<h2>Comment declarer, etape par etape</h2>
<ol>
  <li>Ouvrir votre declaration de revenus sur impots.gouv.fr.</li>
  <li>Cocher la case <strong>8UU</strong> de la declaration principale 2042
      (&laquo; Comptes ouverts, utilises ou clos a l'etranger &raquo;).</li>
  <li>Remplir l'annexe <strong>n&deg; 3916 / 3916-bis</strong> pour chaque compte
      etranger, avec les informations du tableau ci-dessous.</li>
  <li>Indiquer que vous agissez au titre de representant legal / beneficiaire effectif
      ou titulaire d'un droit d'utilisation pour le compte de la societe.</li>
</ol>

<h2>Comptes a declarer pour ${annee} : ${comptes.length}</h2>
${comptes.length === 0 ? "<p>Aucun compte enregistre pour cet exercice.</p>" : blocs}

${avertissement}

<div class="footer">
  Module Compliance - Fiche de preparation 2042 + 3916 ${annee} - ${date}<br/>
  Ce document est une aide a la saisie et ne constitue pas un depot officiel.
</div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  // L organisme ET l adresse email viennent du JETON SIGNE session_academia.
  // Avec l ancien cookie sb_user, un cookie forge faisait generer la fiche
  // des comptes etrangers d un autre organisme ET l expediait a l attaquant.
  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  const emailSession = session ? session.email : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const { year } = await req.json();
    const annee = Number(year) || new Date().getFullYear();

    const { data: comptes, error: eLect } = await supabase
      .from("compliance_comptes_etrangers")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("exercice", annee)
      .order("date_ouverture", { ascending: true })
      .limit(500);

    if (eLect) {
      return NextResponse.json({ error: "Lecture comptes: " + eLect.message }, { status: 500 });
    }

    const liste = comptes ?? [];
    const tousValides = liste.length > 0 && liste.every((c: any) => c.valide_par_fiscaliste);
    const html = ficheHTML(liste, annee, tousValides);

    const { data: ver } = await supabase.rpc("compliance_next_doc_version", {
      p_tenant_id: tenantId,
      p_doc_type: "fiche_3916",
    });
    const version = ver || 1;

    const chemin = tenantId + "/3916_" + annee + "_v" + version + ".html";

    const { error: upErr } = await supabase.storage
      .from("compliance-docs")
      .upload(chemin, html, { contentType: "text/html", upsert: true });

    if (upErr) {
      return NextResponse.json({ error: "Upload coffre echoue: " + upErr.message }, { status: 500 });
    }

    await supabase.from("compliance_documents").insert({
      tenant_id: tenantId,
      rule_code: "FR_3916",
      doc_type: "fiche_3916",
      title: "Fiche 2042 + 3916 comptes etrangers " + annee,
      version: version,
      storage_path: "compliance-docs/" + chemin,
      mime_type: "text/html",
    });

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
            subject: "Fiche 2042 + 3916 " + annee + " - " + liste.length + " compte(s)",
            html: html,
          }),
        });
        const corps = await rMail.text();
        email.statut_http = rMail.status;
        if (rMail.ok) {
          email.envoye = true;
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

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      annee,
      version,
      nb_comptes: liste.length,
      tous_valides: tousValides,
      path: chemin,
      email,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
