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

// ---------------------------------------------------------------------------
// LES FICHES DE PREPARATION — 31/08.
//
// 🚨 POURQUOI UNE FICHE ET NON UN FORMULAIRE PRE-REMPLI. Trois obligations
// du catalogue ne se deposent PAS sur un PDF :
//
//   FINCEN_BOI — le depot se fait exclusivement en ligne sur le portail de
//     FinCEN. Il n existe aucun formulaire papier a remplir.
//
//   US_W8BENE — le formulaire existe, mais il fait HUIT PAGES et son
//     remplissage depend du statut FATCA de l entite, qui n est pas une
//     donnee que l outil possede. Un W-8BEN-E pre-rempli a moitie faux est
//     PIRE qu un formulaire vierge : le client le signe sans relire, et
//     c est lui qui certifie sous peine de parjure.
//
//   WY_REGISTERED_AGENT — ce n est pas une declaration mais un contrat a
//     renouveler aupres du prestataire. Rien a deposer, tout a verifier.
//
// LA FICHE DIT DONC OU ALLER, QUOI PREPARER, ET CE QUI EST EN JEU. C est
// exactement ce dont un gestionnaire a besoin pour traiter le dossier de
// son client — et c est honnete, ce qui vaut mieux qu un document qui
// aurait l air complet sans l etre.
// ---------------------------------------------------------------------------

const TYPES = ["boi", "w8bene", "registered_agent"];

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
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function dateFR(v: unknown): string {
  if (!v) return "—";
  const s = String(v).slice(0, 10);
  const p = s.split("-");
  if (p.length !== 3) return s;
  return p[2] + "/" + p[1] + "/" + p[0];
}

const STYLE = `
  body { font-family: Georgia, serif; color:#1a1a1a; padding:40px; max-width:820px; margin:0 auto; }
  h1 { color:#0a3d2e; border-bottom:3px solid #0a3d2e; padding-bottom:10px; }
  h2 { color:#0a3d2e; margin-top:28px; font-size:18px; }
  table { width:100%; border-collapse:collapse; margin:16px 0; }
  td { padding:10px; border:1px solid #ccc; vertical-align:top; }
  td.label { background:#f4f4f0; font-weight:bold; width:38%; }
  .alerte { background:#fff4f4; border-left:4px solid #c62828; padding:12px 16px; margin:16px 0; }
  .fondement { background:#f0f5f2; border-left:4px solid #0a3d2e; padding:12px 16px; margin:16px 0; }
  .etape { background:#f4f4f0; border-left:4px solid #0a3d2e; padding:12px 16px; margin:16px 0; }
  .cta { display:inline-block; background:#0a3d2e; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; margin-top:12px; }
  ol, ul { line-height:1.8; }
  .footer { margin-top:40px; font-size:12px; color:#888; border-top:1px solid #eee; padding-top:12px; }
`;

// ---- FICHE BOI FINCEN ------------------------------------------------------
function ficheBOI(e: any, m: any, annee: number): { titre: string; html: string } {
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  const titre = "Fiche BOI FinCEN " + annee + " — " + e.label;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${STYLE}</style></head><body>

<h1>Déclaration des bénéficiaires effectifs — FinCEN BOI</h1>
<p>Société : <strong>${fr(e.legal_name || e.label)}</strong><br/>
Fiche générée le ${date}.</p>

<div class="fondement">
  <strong>Ce que c'est.</strong> Le <em>Beneficial Ownership Information Report</em>
  identifie auprès du Trésor américain les personnes physiques qui contrôlent
  réellement la société. Il ne s'agit pas d'une déclaration fiscale : aucun montant
  n'y figure, aucun impôt n'en découle. C'est un registre de transparence.
</div>

<div class="alerte">
  <strong>Le cadre a beaucoup bougé.</strong> L'obligation a été suspendue, rétablie,
  puis restreinte à plusieurs reprises depuis 2024, et son périmètre a notamment été
  modifié pour les sociétés constituées aux États-Unis. <strong>Vérifiez l'état du
  droit sur fincen.gov avant tout dépôt</strong> : cette fiche ne peut pas se
  substituer à la règle en vigueur le jour où vous la lisez.
</div>

<h2>Informations de la société</h2>
<table>
  <tr><td class="label">Dénomination légale</td><td>${fr(e.legal_name)}</td></tr>
  <tr><td class="label">Nom d'usage</td><td>${fr(e.label)}</td></tr>
  <tr><td class="label">État de constitution</td><td>${fr(e.formation_state)}</td></tr>
  <tr><td class="label">Date de constitution</td><td>${dateFR(e.formation_date)}</td></tr>
  <tr><td class="label">Numéro d'immatriculation</td><td>${fr(e.wy_filing_id)}</td></tr>
  <tr><td class="label">EIN</td><td>${fr(m ? m.ri_ein : null)}</td></tr>
  <tr><td class="label">Adresse principale</td><td>${fr(e.principal_office_address || e.mailing_address)}</td></tr>
</table>

<h2>Ce que le portail demandera pour chaque bénéficiaire effectif</h2>
<p>Est bénéficiaire effectif toute personne physique qui détient au moins 25 % de la
société, ou qui exerce sur elle un contrôle substantiel — le gérant d'une
Single-Member LLC réunit généralement les deux critères.</p>
<ul>
  <li>Nom complet, tel qu'il figure sur la pièce d'identité</li>
  <li>Date de naissance</li>
  <li>Adresse personnelle complète — <strong>pas une adresse de domiciliation</strong></li>
  <li>Numéro d'un document d'identité en cours de validité (passeport ou permis)</li>
  <li>Une image lisible de ce document</li>
</ul>

<div class="alerte">
  <strong>Ces données sont personnelles.</strong> Elles ne transitent pas par cet
  outil et ne doivent pas y être stockées : elles se saisissent directement sur le
  portail de FinCEN, par la personne concernée ou avec son accord explicite.
</div>

<h2>Dépôt</h2>
<p>Le dépôt est gratuit et se fait uniquement en ligne :</p>
<a class="cta" href="https://boiefiling.fincen.gov">Ouvrir le portail BOI de FinCEN</a>

<div class="etape">
  <strong>Après le dépôt :</strong> conservez l'accusé de réception au coffre. Toute
  modification ultérieure — changement d'adresse, de gérant, de dénomination — doit
  être déclarée dans les trente jours.
</div>

<div class="footer">
  Fiche de préparation BOI ${annee} — ${date}<br/>
  Aide à la saisie. Ne constitue ni un dépôt, ni un conseil juridique.
</div>
</body></html>`;

  return { titre, html };
}

// ---- FICHE W-8BEN-E --------------------------------------------------------
function ficheW8(e: any, m: any, annee: number): { titre: string; html: string } {
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  const titre = "Fiche W-8BEN-E " + annee + " — " + e.label;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${STYLE}</style></head><body>

<h1>Certificat de statut du bénéficiaire effectif — W-8BEN-E</h1>
<p>Société : <strong>${fr(e.legal_name || e.label)}</strong><br/>
Fiche générée le ${date}.</p>

<div class="fondement">
  <strong>À qui il se donne.</strong> Le W-8BEN-E ne se dépose jamais auprès de
  l'IRS : il se remet à celui qui verse les fonds — banque, place de marché,
  plateforme de paiement, client américain. Sans lui, le payeur applique une retenue
  à la source de <strong>30 %</strong> sur les montants versés.
</div>

<h2>Informations à reporter — Partie I</h2>
<table>
  <tr><td class="label">Ligne 1 — Nom de l'organisation</td><td>${fr(e.legal_name || e.label)}</td></tr>
  <tr><td class="label">Ligne 2 — Pays de constitution</td><td>United States (${fr(e.formation_state)})</td></tr>
  <tr><td class="label">Ligne 6 — Adresse de résidence permanente</td><td>${fr(e.principal_office_address || e.mailing_address)}</td></tr>
  <tr><td class="label">Ligne 8 — EIN</td><td>${fr(m ? m.ri_ein : null)}</td></tr>
  <tr><td class="label">Résidence fiscale du membre</td><td>${fr(e.member_residence)}</td></tr>
</table>

<div class="alerte">
  <strong>Les cases de statut ne sont pas pré-remplies, et c'est volontaire.</strong>
  Les lignes 4 et 5 déterminent le statut de l'entité au regard des chapitres 3 et 4
  du code fiscal américain. Ce choix dépend de l'activité réelle, de la structure de
  détention et de la nature des revenus — trois éléments que cet outil ne connaît
  pas. Un statut coché à tort engage le signataire <em>sous peine de parjure</em> :
  il vaut mieux une case vide qu'une case fausse.
</div>

<h2>Les deux cases à déterminer</h2>

<div class="etape">
  <strong>Ligne 4 — Statut chapitre 3.</strong> Pour une LLC à membre unique traitée
  comme entité transparente, le choix se porte généralement sur
  <em>Disregarded entity</em> — mais une LLC ayant opté pour l'imposition comme
  société coche <em>Corporation</em>. L'option retenue lors de la demande d'EIN fait foi.
</div>

<div class="etape">
  <strong>Ligne 5 — Statut FATCA.</strong> Pour une société non financière exerçant
  une activité opérationnelle, le choix usuel est <em>Active NFFE</em> (partie XXV),
  qui suppose que moins de la moitié des revenus et des actifs sont passifs. Une
  société de portefeuille relève plutôt de <em>Passive NFFE</em> (partie XXVI), qui
  impose de déclarer les propriétaires américains substantiels.
</div>

<h2>Convention fiscale — Partie III</h2>
<p>Si le membre réside dans un pays lié aux États-Unis par une convention fiscale
${e.member_residence ? "(résidence déclarée : <strong>" + fr(e.member_residence) + "</strong>)" : ""},
la partie III permet de réduire ou d'annuler la retenue à la source. Elle exige
d'indiquer l'article invoqué et le taux demandé — à faire confirmer avant signature.</p>

<h2>Formulaire officiel</h2>
<p>Le formulaire vierge et ses instructions :</p>
<a class="cta" href="https://www.irs.gov/forms-pubs/about-form-w-8-ben-e">Form W-8BEN-E sur irs.gov</a>

<div class="etape">
  <strong>Validité :</strong> trois ans à compter de la signature, sauf changement de
  situation. Un nouveau formulaire doit être fourni dans les trente jours si l'une
  des certifications cesse d'être exacte.
</div>

<div class="footer">
  Fiche de préparation W-8BEN-E ${annee} — ${date}<br/>
  Aide à la saisie. Ne constitue ni un dépôt, ni un conseil fiscal.
</div>
</body></html>`;

  return { titre, html };
}

// ---- FICHE REGISTERED AGENT ------------------------------------------------
function ficheAgent(e: any, annee: number): { titre: string; html: string } {
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  const titre = "Fiche registered agent " + annee + " — " + e.label;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${STYLE}</style></head><body>

<h1>Maintien du registered agent — ${fr(e.formation_state)}</h1>
<p>Société : <strong>${fr(e.legal_name || e.label)}</strong><br/>
Fiche générée le ${date}.</p>

<div class="fondement">
  <strong>Ce qu'il est.</strong> Le registered agent est l'adresse officielle de la
  société dans son État de constitution. C'est là que sont adressés les courriers de
  l'administration et les actes de procédure. Sa présence est une
  <strong>condition de l'existence légale</strong> de la société, pas un service
  accessoire.
</div>

<div class="alerte">
  <strong>Ce qui arrive s'il lapse.</strong> Sans agent enregistré valide, l'État
  place la société en défaut administratif, puis prononce sa dissolution. Le
  rétablissement est possible mais payant, et la période de défaut reste inscrite au
  registre public — ce qu'une banque consulte avant d'ouvrir un compte.
</div>

<h2>Situation actuelle</h2>
<table>
  <tr><td class="label">Agent enregistré</td><td>${fr(e.registered_agent_name)}</td></tr>
  <tr><td class="label">État de constitution</td><td>${fr(e.formation_state)}</td></tr>
  <tr><td class="label">Numéro d'immatriculation</td><td>${fr(e.wy_filing_id)}</td></tr>
  <tr><td class="label">Adresse postale déclarée</td><td>${fr(e.mailing_address)}</td></tr>
  <tr><td class="label">Adresse du siège déclarée</td><td>${fr(e.principal_office_address)}</td></tr>
</table>

${e.registered_agent_name ? "" : `
<div class="alerte">
  <strong>Aucun agent n'est renseigné pour cette société.</strong> Vérifiez auprès du
  registre de l'État qui remplit ce rôle, puis complétez la fiche : sans cette
  information, aucune relance ne peut être utile.
</div>`}

<h2>À vérifier chaque année</h2>
<ol>
  <li>Le contrat avec l'agent est-il renouvelé et payé pour l'exercice à venir ?</li>
  <li>L'agent transfère-t-il effectivement le courrier reçu ? Un agent qui ne
      transmet pas est aussi dangereux qu'une absence d'agent.</li>
  <li>L'adresse figurant au registre de l'État correspond-elle à celle du contrat ?</li>
  <li>Le prélèvement automatique éventuel est-il toujours actif ?</li>
</ol>

<div class="etape">
  <strong>En cas de changement d'agent :</strong> le changement se déclare auprès de
  l'État, généralement contre une taxe modique. Ne pas résilier l'ancien contrat
  avant que le nouveau ne soit enregistré — une journée sans agent suffit à
  déclencher le défaut.
</div>

<div class="footer">
  Fiche de préparation registered agent ${annee} — ${date}<br/>
  Aide au suivi. Ne constitue pas un conseil juridique.
</div>
</body></html>`;

  return { titre, html };
}

export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const type = String(body.type || "").trim().toLowerCase();
    const annee = Number(body.year) || new Date().getFullYear();
    const entiteDemandee = String(body.entite_id || "").trim();

    if (TYPES.indexOf(type) < 0) {
      return NextResponse.json(
        { error: "Type de fiche inconnu. Attendu : " + TYPES.join(", ") },
        { status: 400 }
      );
    }

    // ---- LA SOCIETE CONCERNEE ----
    //
    // 🚨 L IDENTIFIANT RECU N EST PAS UNE AUTORISATION : il est cherche AVEC
    // le filtre tenant_id de la session.
    let requeteEntite = supabase
      .from("compliance_tenants")
      .select("*")
      .eq("tenant_id", tenantId);

    if (entiteDemandee) {
      requeteEntite = requeteEntite.eq("id", entiteDemandee);
    }

    const { data: entite, error: eEntite } = await requeteEntite
      .order("label", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eEntite) {
      console.error("[fiches] lecture entite :", eEntite.message);
      return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    }

    if (!entite) {
      return NextResponse.json(
        { error: entiteDemandee ? "Societe introuvable." : "Aucune societe enregistree." },
        { status: 404 }
      );
    }

    const entiteId = entite.id;

    // Le mapping porte l EIN, utile aux fiches BOI et W-8BEN-E. Son absence
    // n empeche pas la generation : la fiche le signale par un tiret.
    let mapping: any = null;
    const essai = await supabase
      .from("compliance_5472_mapping")
      .select("ri_ein")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entiteId)
      .eq("tax_year", annee)
      .maybeSingle();

    if (!essai.error && essai.data) {
      mapping = essai.data;
    } else {
      const { data: m2 } = await supabase
        .from("compliance_5472_mapping")
        .select("ri_ein")
        .eq("tenant_id", tenantId)
        .eq("tax_year", annee)
        .maybeSingle();
      mapping = m2;
    }

    let fiche: { titre: string; html: string };
    let ruleCode: string;
    let docType: string;

    if (type === "boi") {
      fiche = ficheBOI(entite, mapping, annee);
      ruleCode = "FINCEN_BOI";
      docType = "fiche_boi";
    } else if (type === "w8bene") {
      fiche = ficheW8(entite, mapping, annee);
      ruleCode = "US_W8BENE";
      docType = "fiche_w8bene";
    } else {
      // Le registered agent est une obligation d Etat : la generer pour une
      // societe constituee ailleurs n aurait pas de sens.
      fiche = ficheAgent(entite, annee);
      ruleCode = "WY_REGISTERED_AGENT";
      docType = "fiche_registered_agent";
    }

    const { data: ver } = await supabase.rpc("compliance_next_doc_version", {
      p_tenant_id: tenantId,
      p_doc_type: docType,
    });
    const version = ver || 1;

    const chemin = tenantId + "/" + entiteId + "/" + docType + "_" + annee
      + "_v" + version + ".html";

    const { error: upErr } = await supabase.storage
      .from("compliance-docs")
      .upload(chemin, fiche.html, { contentType: "text/html", upsert: true });

    if (upErr) {
      console.error("[fiches] depot au coffre :", upErr.message);
      return NextResponse.json({ error: "Depot au coffre impossible." }, { status: 500 });
    }

    // entite_id est indispensable : le tableau de bord filtre dessus.
    await supabase.from("compliance_documents").insert({
      tenant_id: tenantId,
      entite_id: entiteId,
      rule_code: ruleCode,
      doc_type: docType,
      title: fiche.titre,
      version: version,
      storage_path: "compliance-docs/" + chemin,
      mime_type: "text/html",
    });

    const { data: signed } = await supabase.storage
      .from("compliance-docs")
      .createSignedUrl(chemin, 3600);

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      entite_id: entiteId,
      societe: entite.label,
      type: type,
      annee: annee,
      version: version,
      path: chemin,
      url: signed?.signedUrl ?? null,
      titre: fiche.titre,
    });
  } catch (e: any) {
    console.error("[fiches] exception :", String(e && e.message ? e.message : e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
