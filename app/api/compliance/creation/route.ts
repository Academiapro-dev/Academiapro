import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LE DOSSIER DE CREATION DE LLC — 09/09 (chemin A→Z).
// GET  ?entite_id= : le dossier (cree vide s il n existe pas) + les agents
//                    partenaires de l Etat + l etat calcule du chemin.
// POST : enregistrer une etape ou des champs. Actions :
//   champs   : responsable_nom, nom_commercial, comte_etat, nb_membres,
//              type_activite, activite_code, activite_libelle, date_debut,
//              mois_cloture, telephone
//   agent    : agent_prestataire, agent_contrat_le → statut statuts_a_deposer
//   statuts  : statuts_numero, statuts_deposes_le (+ chemin PDF facultatif)
//              → statut ss4_a_generer
//   ein      : ein, ein_recu_le (saisie de secours si le fax entrant n est
//              pas encore branche) → statut oa_a_signer
//   oa       : oa_reference (SIG-…) → statut banque
//   banque   : banque_etablissement, banque_ouverte_le → statut active
// Le tenant vient de la session ; l entite est bornee au tenant.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const ETAPES = [
  { code: "agent_a_choisir", nom: "Agent enregistré", detail: "Choisir l'agent enregistré de l'État" },
  { code: "statuts_a_deposer", nom: "Statuts", detail: "Déposer les Articles of Organization auprès de l'État" },
  { code: "ss4_a_generer", nom: "SS-4", detail: "Générer la demande d'EIN" },
  { code: "ss4_genere", nom: "SS-4 à signer", detail: "Préparer l'accusé et le faire signer" },
  { code: "ss4_accuse_envoye", nom: "Signature en attente", detail: "Le titulaire signe l'accusé" },
  { code: "ss4_signe", nom: "SS-4 à transmettre", detail: "Faxer le SS-4 à l'IRS" },
  { code: "ss4_transmis", nom: "Attente de l'IRS", detail: "L'EIN revient par fax sous quelques jours ouvrés" },
  { code: "ein_recu", nom: "EIN reçu", detail: "Numéro d'identification obtenu" },
  { code: "oa_a_signer", nom: "Operating Agreement", detail: "Faire signer le pacte de la société" },
  { code: "banque", nom: "Compte bancaire", detail: "Ouvrir le compte, pièces et suivi" },
  { code: "active", nom: "Société active", detail: "Échéances générées, suivi en cours" },
];

function texte(v: any, max: number): string | null { if (v === null || v === undefined) return null; const t = String(v).trim(); return t ? t.slice(0, max) : null; }
function dateOuNull(v: any): string | null { const t = String(v || "").trim(); return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null; }

async function entiteDe(tenantId: string, entiteId: string) {
  let q = supabase.from("compliance_tenants").select("id, label, legal_name, formation_state, formation_date, registered_agent_name, principal_office_address, mailing_address, email_contact").eq("tenant_id", tenantId);
  if (entiteId) q = q.eq("id", entiteId);
  const { data } = await q.order("label").limit(1).maybeSingle();
  return data || null;
}

export async function GET(req: NextRequest) {
  try {
    if (!origineLegitime(req)) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    const session = sessionCourante();
    if (!session || !session.tenantId) return NextResponse.json({ error: "Session sans societe rattachee." }, { status: 401 });
    const entite = await entiteDe(session.tenantId, (req.nextUrl.searchParams.get("entite_id") || "").trim());
    if (!entite) return NextResponse.json({ error: "Societe introuvable." }, { status: 404 });

    let { data: cre } = await supabase.from("compliance_creations").select("*").eq("entite_id", entite.id).maybeSingle();
    if (!cre) {
      const ins = await supabase.from("compliance_creations").insert({ tenant_id: session.tenantId, entite_id: entite.id, agent_prestataire: entite.registered_agent_name || null, date_debut: entite.formation_date || null }).select("*").maybeSingle();
      cre = ins.data;
    }
    const { data: agents } = await supabase.from("agents_partenaires").select("*").eq("etat", entite.formation_state || "").eq("actif", true).order("tarif_achat_usd");
    const idx = ETAPES.findIndex(function (e) { return e.code === (cre ? cre.statut : "agent_a_choisir"); });
    return NextResponse.json({ success: true, entite, creation: cre, etapes: ETAPES, etape_index: idx < 0 ? 0 : idx, agents: agents || [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    const session = sessionCourante();
    if (!session || !session.tenantId) return NextResponse.json({ error: "Session sans societe rattachee." }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    const entite = await entiteDe(session.tenantId, String(b.entite_id || "").trim());
    if (!entite) return NextResponse.json({ error: "Societe introuvable." }, { status: 404 });
    const { data: cre } = await supabase.from("compliance_creations").select("*").eq("entite_id", entite.id).maybeSingle();
    if (!cre) return NextResponse.json({ error: "Ouvrez d'abord le dossier (GET)." }, { status: 404 });

    const m: Record<string, unknown> = {};
    const action = String(b.action || "champs");
    if (action === "champs") {
      for (const c of ["responsable_nom", "nom_commercial", "comte_etat", "type_activite", "activite_code", "activite_libelle", "mois_cloture", "telephone"]) if (b[c] !== undefined) m[c] = texte(b[c], 200);
      if (b.nb_membres !== undefined) m.nb_membres = Math.max(1, Number(b.nb_membres) || 1);
      if (b.date_debut !== undefined) m.date_debut = dateOuNull(b.date_debut);
    } else if (action === "agent") {
      m.agent_prestataire = texte(b.agent_prestataire, 200); m.agent_contrat_le = dateOuNull(b.agent_contrat_le) || new Date().toISOString().slice(0, 10);
      if (cre.statut === "agent_a_choisir") m.statut = "statuts_a_deposer";
      if (m.agent_prestataire) await supabase.from("compliance_tenants").update({ registered_agent_name: m.agent_prestataire }).eq("id", entite.id).eq("tenant_id", session.tenantId);
    } else if (action === "statuts") {
      m.statuts_numero = texte(b.statuts_numero, 60); m.statuts_deposes_le = dateOuNull(b.statuts_deposes_le) || new Date().toISOString().slice(0, 10);
      if (b.statuts_chemin) m.statuts_chemin = texte(b.statuts_chemin, 300);
      if (["agent_a_choisir", "statuts_a_deposer"].indexOf(cre.statut) >= 0) m.statut = "ss4_a_generer";
      if (m.statuts_numero) await supabase.from("compliance_tenants").update({ wy_filing_id: m.statuts_numero, formation_date: m.statuts_deposes_le }).eq("id", entite.id).eq("tenant_id", session.tenantId);
    } else if (action === "ein") {
      const ein = String(b.ein || "").replace(/\D/g, "");
      if (ein.length !== 9) return NextResponse.json({ error: "Un EIN a 9 chiffres." }, { status: 400 });
      m.ein = ein.slice(0, 2) + "-" + ein.slice(2); m.ein_recu_le = new Date().toISOString(); m.statut = "oa_a_signer";
      await supabase.from("compliance_5472_mapping").update({ ri_ein: m.ein, f1120_ein: m.ein }).eq("entite_id", entite.id).eq("tenant_id", session.tenantId);
    } else if (action === "oa") {
      m.oa_reference = texte(b.oa_reference, 60); m.oa_signe_le = new Date().toISOString(); m.statut = "banque";
    } else if (action === "banque") {
      m.banque_etablissement = texte(b.banque_etablissement, 120); m.banque_ouverte_le = dateOuNull(b.banque_ouverte_le) || new Date().toISOString().slice(0, 10); m.statut = "active";
    } else return NextResponse.json({ error: "Action inconnue." }, { status: 400 });

    m.maj_le = new Date().toISOString();
    const { data, error } = await supabase.from("compliance_creations").update(m).eq("id", cre.id).select("*").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, creation: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
