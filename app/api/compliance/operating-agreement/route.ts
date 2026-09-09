import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// L OPERATING AGREEMENT — 09/09. Modele d une LLC a membre unique, rendu
// pret pour /api/compliance/document-a-signer (type « convention »), puis
// rattache au dossier de creation par creation?action=oa. Le texte est un
// MODELE d usage courant (Wyoming, single-member LLC, disregarded
// entity) : le titulaire le relit ; ce n est pas un avis juridique.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function dateLongue(d: any): string {
  return new Date(d || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function corpsOA(e: any, c: any): string {
  const nom = e.legal_name || e.label, etat = e.formation_state === "WY" ? "Wyoming" : (e.formation_state || "the State of formation");
  const membre = c.responsable_nom || "the Member";
  return [
    "OPERATING AGREEMENT OF " + String(nom).toUpperCase(),
    "A " + etat + " Single-Member Limited Liability Company",
    "",
    "This Operating Agreement (the \"Agreement\") is entered into as of " + dateLongue(c.statuts_deposes_le || e.formation_date) + " by " + membre + " (the \"Member\"), the sole member of " + nom + " (the \"Company\").",
    "",
    "1. Formation. The Company was formed as a limited liability company under the laws of the State of " + etat + " by the filing of Articles of Organization" + (c.statuts_numero ? " (filing number " + c.statuts_numero + ")" : "") + ". The rights and obligations of the Member are governed by this Agreement and by the " + etat + " Limited Liability Company Act.",
    "2. Name and principal office. The name of the Company is " + nom + ". Its principal office is located at " + (e.principal_office_address || e.mailing_address || "the address stated in the Articles of Organization") + ". Its registered agent is " + (c.agent_prestataire || e.registered_agent_name || "as stated in the Articles of Organization") + ".",
    "3. Purpose. The Company may engage in any lawful business" + (c.activite_libelle ? ", including " + c.activite_libelle : "") + ".",
    "4. Sole Member. The Member is the sole member of the Company and holds one hundred percent (100%) of the membership interest. No other person has any interest in the Company.",
    "5. Management. The Company is managed by its Member. The Member has full authority to act for and bind the Company, to open bank accounts, to sign contracts and to make all decisions concerning the Company.",
    "6. Capital contributions. The Member may make capital contributions in cash, property or services, and may advance funds to the Company on behalf of the Company. Advances made by the Member are recorded in the Company's books as contributions or loans, as the Member determines, and are reported as required by law.",
    "7. Distributions. Distributions are made to the Member at such times and in such amounts as the Member determines, provided the Company remains able to pay its debts as they become due.",
    "8. Tax classification. The Company, having a single member, is disregarded as an entity separate from its owner for United States federal income tax purposes unless it elects otherwise. The Member acknowledges the information-reporting obligations of a foreign-owned disregarded entity, including Form 5472 with a pro forma Form 1120.",
    "9. Limited liability. The Member is not personally liable for the debts, obligations or liabilities of the Company solely by reason of being a member.",
    "10. Books and records. The Company keeps complete books and records, including all contributions, distributions and transactions between the Company and the Member, and keeps them for the period required by law.",
    "11. Dissolution. The Company may be dissolved by the decision of the Member, or as otherwise provided by law. Upon dissolution, the Company's affairs are wound up, its debts paid and any remaining assets distributed to the Member.",
    "12. Entire agreement. This Agreement is the entire operating agreement of the Company and may be amended only in writing by the Member.",
    "",
    "IN WITNESS WHEREOF, the Member has executed this Agreement as of the date first written above. The electronic signature of this document by the Member constitutes execution.",
    "",
    "Member: " + membre,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    const session = sessionCourante();
    if (!session || !session.tenantId) return NextResponse.json({ error: "Session sans societe rattachee." }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    let q = supabase.from("compliance_tenants").select("id, label, legal_name, formation_state, formation_date, principal_office_address, mailing_address, registered_agent_name, email_contact").eq("tenant_id", session.tenantId);
    if (b.entite_id) q = q.eq("id", String(b.entite_id));
    const { data: e } = await q.order("label").limit(1).maybeSingle();
    if (!e) return NextResponse.json({ error: "Societe introuvable." }, { status: 404 });
    const { data: c } = await supabase.from("compliance_creations").select("*").eq("entite_id", e.id).maybeSingle();
    if (!c) return NextResponse.json({ error: "Aucun dossier de creation." }, { status: 404 });
    if (!e.email_contact) return NextResponse.json({ error: "Renseignez l'adresse de contact de la societe : c'est elle qui signe." }, { status: 400 });
    const corps = corpsOA(e, c);
    return NextResponse.json({
      success: true, corps,
      document_a_signer: { doc_type: "convention", titre: "Operating Agreement — " + (e.legal_name || e.label), corps, signataire_email: e.email_contact, entite_id: e.id },
    });
  } catch (ex: unknown) {
    return NextResponse.json({ error: ex instanceof Error ? ex.message : String(ex) }, { status: 500 });
  }
}
