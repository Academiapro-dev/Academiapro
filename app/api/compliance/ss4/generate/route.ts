import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../../lib/session";
import { origineLegitime } from "../../../../../lib/origine";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LE FORMULAIRE SS-4 (DEMANDE D EIN) — 09/09. Premiere piece de la
// CREATION DE LLC A→Z (chantier de finition n°1, decision Jacques).
//
// CE QUE FAIT CETTE ROUTE : elle prerempli le SS-4 officiel (rev. 12-2025,
// public/forms/fss4.pdf, 89 champs cartographies le 09/09) depuis la
// societe (compliance_tenants) et le dossier de creation
// (compliance_creations), l archive au coffre et l inscrit dans
// compliance_documents (doc_type ss4). L ENVOI PAR FAX est une autre
// route, sur la chaine existante (accuse signe → trace → fax → retour).
//
// CE QUE DIT L IRS (instruction SS-4, rev. 12-2025 ; verifie le 09/09) :
//   - un titulaire etranger sans SSN ecrit « Foreign » en 7b ;
//   - une LLC unipersonnelle detenue par un etranger : 8a Oui, 8b 1,
//     8c Oui, 9a « Other » avec « Foreign-owned U.S. disregarded entity » ;
//   - le numero de fax depend du SIEGE de l entite : domestique si elle a
//     une adresse dans un Etat, international sinon. Les numeros changent
//     sans preavis : ils vivent en variables (FAX_SS4_US, FAX_SS4_INTL) et
//     la reponse dit lequel s applique.
//   - JAMAIS deux demandes pour la meme entite : un doublon est refuse.
//     compliance_creations garde la trace du SS-4 envoye.
//
// 🚨 MEMES REGLES QUE f5472/generate : session signee, origine partagee,
// entite bornee au tenant, pas de repli silencieux.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const P = "topmostSubform[0].Page1[0].";
const FAX_SS4_US = (process.env.FAX_SS4_US || "+18556416935").trim();
const FAX_SS4_INTL = (process.env.FAX_SS4_INTL || "+18552151627").trim();

// Codes des activites de la ligne 16 (cases c1_6[n]).
const ACTIVITES: Record<string, number> = {
  health: 0, wholesale_agent: 1, construction: 2, rental: 3, transport: 4, accommodation: 5,
  wholesale_other: 6, retail: 7, real_estate: 8, manufacturing: 9, finance: 10, other: 11,
};

function dateIRS(v: unknown): string {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  const p = s.split("-");
  return p.length === 3 ? p[1] + "/" + p[2] + "/" + p[0] : s;
}

function pourPdf(t: unknown): string {
  return String(t ?? "").replace(/[\u202F\u00A0]/g, " ").replace(/[^\x20-\x7E]/g, "?");
}

// Une adresse « rue » + « ville, Etat ZIP » : le SS-4 les separe (4a / 4b).
function coupe(adresse: unknown): { rue: string; reste: string } {
  const s = String(adresse ?? "").trim();
  const i = s.indexOf(",");
  return i < 0 ? { rue: s, reste: "" } : { rue: s.slice(0, i).trim(), reste: s.slice(i + 1).trim() };
}

function siegeAuxEtatsUnis(adresse: unknown): boolean {
  const s = String(adresse ?? "").toUpperCase();
  return /\b(WY|DE|NM|NV|FL|TX|MT|CA|NY|USA|UNITED STATES)\b/.test(s) && !/FRANCE|BELGI|SUISSE|LUXEMBOURG/.test(s);
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    const session = sessionCourante();
    const tenantId = session ? session.tenantId : null;
    if (!tenantId) return NextResponse.json({ error: "Session sans societe rattachee. Reconnectez-vous." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const entiteDemandee = String(body.entite_id || "").trim();

    // ---- LA SOCIETE, BORNEE AU TENANT ----
    let q = supabase
      .from("compliance_tenants")
      .select("id, label, legal_name, formation_state, formation_date, mailing_address, principal_office_address, registered_agent_name, email_contact, telephone_contact")
      .eq("tenant_id", tenantId);
    if (entiteDemandee) q = q.eq("id", entiteDemandee);
    const { data: entite, error: eEnt } = await q.order("label").limit(1).maybeSingle();
    if (eEnt) return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    if (!entite) return NextResponse.json({ error: entiteDemandee ? "Societe introuvable." : "Aucune societe enregistree." }, { status: 404 });

    // ---- LE DOSSIER DE CREATION (ce que le SS-4 demande en plus) ----
    const { data: cre, error: eCre } = await supabase
      .from("compliance_creations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entite.id)
      .maybeSingle();
    if (eCre) return NextResponse.json({ error: "Lecture du dossier de creation impossible." }, { status: 500 });
    if (!cre) {
      return NextResponse.json({ error: "Aucun dossier de creation pour " + entite.label + ". Renseignez le responsable et l'activite avant de generer le SS-4." }, { status: 404 });
    }
    if (!cre.responsable_nom) return NextResponse.json({ error: "Le nom du responsable (ligne 7a) est obligatoire." }, { status: 400 });
    if (cre.ss4_fax_id) {
      return NextResponse.json({ error: "Un SS-4 a deja ete transmis pour cette societe (fax " + cre.ss4_fax_id + "). L'IRS refuse les doublons : attendez sa reponse." }, { status: 409 });
    }

    const res = await fetch("https://academiapro.fr/forms/fss4.pdf");
    if (!res.ok) return NextResponse.json({ error: "PDF source introuvable (public/forms/fss4.pdf)." }, { status: 500 });
    const doc = await PDFDocument.load(await res.arrayBuffer(), { updateMetadata: false, ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const form = doc.getForm();
    const manques: string[] = [];
    const setText = (c: string, v: unknown) => {
      if (v === null || v === undefined || v === "") return;
      try { form.getTextField(P + c).setText(pourPdf(v)); } catch { manques.push(c); }
    };
    const check = (c: string) => { try { form.getCheckBox(P + c).check(); } catch { manques.push(c); } };

    const postale = coupe(entite.mailing_address || entite.principal_office_address);
    const siege = coupe(entite.principal_office_address);

    // 1-3 : identite
    setText("f1_2[0]", entite.legal_name);
    setText("f1_3[0]", cre.nom_commercial);
    // 4a/4b : adresse postale ; 5a/5b : siege si different
    setText("Line4ReadOrder[0].f1_5[0]", postale.rue);
    setText("Line4ReadOrder[0].f1_6[0]", postale.reste);
    if (entite.principal_office_address && entite.principal_office_address !== entite.mailing_address) {
      setText("f1_7[0]", siege.rue);
      setText("f1_8[0]", siege.reste);
    }
    // 6 : comte et Etat
    setText("f1_9[0]", cre.comte_etat || (entite.formation_state ? entite.formation_state : ""));
    // 7a/7b : responsable, « Foreign » sans SSN
    setText("f1_10[0]", cre.responsable_nom);
    setText("f1_11[0]", cre.responsable_ssn || "Foreign");
    // 8a Oui, 8b nombre de membres, 8c Oui (organisee aux Etats-Unis)
    check("c1_1[0]");
    setText("f1_12[0]", String(cre.nb_membres || 1));
    check("c1_2[0]");
    // 9a : Other → « Foreign-owned U.S. disregarded entity » (LLC unipersonnelle)
    // ou Partnership si plusieurs membres.
    if (Number(cre.nb_membres || 1) > 1) check("c1_3[2]");
    else { check("c1_3[15]"); setText("f1_19[0]", "Foreign-owned U.S. disregarded entity"); }
    // 10 : raison — nouvelle activite, type precise
    check("c1_4[0]");
    setText("f1_25[0]", cre.type_activite || cre.activite_libelle);
    // 11 : date de debut ; 12 : cloture de l exercice (December par defaut)
    setText("f1_31[0]", dateIRS(cre.date_debut || entite.formation_date));
    setText("f1_32[0]", cre.mois_cloture || "December");
    // 13 : salaries attendus — 0 partout ; 15 : N/A
    setText("f1_33[0]", "0"); setText("f1_34[0]", "0"); setText("f1_35[0]", "0");
    setText("f1_36[0]", "N/A");
    // 16 : activite principale ; 17 : ligne d activite
    const idx = ACTIVITES[String(cre.activite_code || "other")];
    check("c1_6[" + (idx === undefined ? 11 : idx) + "]");
    if (idx === undefined || idx === 11) setText("f1_37[0]", cre.activite_libelle);
    setText("f1_38[0]", cre.activite_libelle);
    // 18 : jamais eu d EIN
    check("c1_7[1]");
    // Signataire : nom et titre, telephone
    setText("f1_44[0]", String(cre.responsable_nom) + ", Member");
    setText("f1_45[0]", cre.telephone || entite.telephone_contact || "");
    // Le numero de fax de retour (celui qui recoit l EIN) est dessine par la
    // route de transmission, avec la signature et la date, au moment de l envoi.

    form.updateFieldAppearances(font);
    const octets = Buffer.from(await doc.save());
    const sha = crypto.createHash("sha256").update(octets).digest("hex");

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const chemin = tenantId + "/" + entite.id + "/ss4/fss4-" + stamp + ".pdf";
    const { error: eUp } = await supabase.storage.from("compliance-docs").upload(chemin, octets, { contentType: "application/pdf", upsert: false });
    if (eUp) return NextResponse.json({ error: "Depot au coffre impossible." }, { status: 500 });

    await supabase.from("compliance_documents").insert({
      tenant_id: tenantId, entite_id: entite.id, rule_code: "US_EIN", doc_type: "ss4",
      title: "Form SS-4 — demande d'EIN — " + (entite.legal_name || entite.label), version: 1,
      storage_path: chemin, pdf_chemin: chemin, pdf_sha256: sha, file_hash: sha, pdf_octets: octets.length, size_bytes: octets.length,
      mime_type: "application/pdf", donnees: { manques },
    });

    const auxEtatsUnis = siegeAuxEtatsUnis(entite.principal_office_address || entite.mailing_address);
    await supabase.from("compliance_creations").update({
      ss4_chemin: chemin, ss4_sha256: sha, ss4_genere_le: new Date().toISOString(), statut: "ss4_genere", maj_le: new Date().toISOString(),
    }).eq("id", cre.id);

    const { data: signed } = await supabase.storage.from("compliance-docs").createSignedUrl(chemin, 3600);
    return NextResponse.json({
      success: true, entite_id: entite.id, societe: entite.label, path: chemin, sha256: sha, url: signed?.signedUrl ?? null,
      fax_destination: auxEtatsUnis ? FAX_SS4_US : FAX_SS4_INTL,
      fax_motif: auxEtatsUnis ? "siege aux Etats-Unis : numero domestique" : "aucune adresse aux Etats-Unis : numero international",
      champs_absents: manques,
      note: "SS-4 prerempli. A relire, signer (trace) et transmettre par fax ; l'IRS repond par fax sous ~4 jours ouvres.",
    });
  } catch (e: unknown) {
    console.error("[ss4] exception :", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
