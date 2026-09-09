import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// L utilisateur vient du JETON SIGNE session_academia. Avec l ancien cookie
// sb_user, un cookie forge permettait de rattacher une societe au compte
// d un autre utilisateur. Le jeton ne portant que l email, l identifiant
// est retrouve en base via la fonction utilisateur_par_email.
async function utilisateurDeLaSession(): Promise<{ id: string | null; tenantId: string | null }> {
  const session = sessionCourante();
  if (!session || !session.email) return { id: null, tenantId: null };

  const { data, error } = await supabase.rpc("utilisateur_par_email", {
    p_email: session.email,
  });

  if (error) return { id: null, tenantId: session.tenantId };
  return { id: (data as string) || null, tenantId: session.tenantId };
}

// GET : l'utilisateur connecte a-t-il deja une societe ?
export async function GET(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id, tenantId } = await utilisateurDeLaSession();

  if (!id) {
    return NextResponse.json(
      { error: "Vous devez etre connecte." },
      { status: 401 }
    );
  }

  if (!tenantId) {
    return NextResponse.json({ success: true, a_une_societe: false, societe: null });
  }

  const { data, error } = await supabase
    .from("compliance_tenants")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Lecture societe: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, a_une_societe: !!data, societe: data });
}

// POST : creation de la societe du nouveau client
export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id: userId, tenantId: tenantExistant } = await utilisateurDeLaSession();

  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez etre connecte pour enregistrer une societe." },
      { status: 401 }
    );
  }

  if (tenantExistant) {
    return NextResponse.json(
      { error: "Une societe est deja rattachee a ce compte." },
      { status: 409 }
    );
  }

  try {
    const body = await req.json();

    const label = String(body.label || "").trim();
    const legalName = String(body.legal_name || "").trim();
    const formationState = String(body.formation_state || "").trim();

    if (!label) {
      return NextResponse.json({ error: "Le nom d'usage est obligatoire." }, { status: 400 });
    }
    if (!legalName) {
      return NextResponse.json({ error: "La denomination legale est obligatoire." }, { status: 400 });
    }
    if (!formationState) {
      return NextResponse.json({ error: "L'Etat ou pays de constitution est obligatoire." }, { status: 400 });
    }

    const ligne: Record<string, unknown> = {
      label,
      legal_name: legalName,
      formation_state: formationState,
      member_residence: body.member_residence || "FR",
      fr_tax_resident: body.fr_tax_resident !== false,
      has_us_source_income: body.has_us_source_income === true,
      entity_type: body.entity_type || "LLC",
    };

    if (body.formation_date) ligne.formation_date = body.formation_date;
    if (body.wy_filing_id) ligne.wy_filing_id = body.wy_filing_id;
    if (body.registered_agent_name) ligne.registered_agent_name = body.registered_agent_name;
    if (body.mailing_address) ligne.mailing_address = body.mailing_address;
    if (body.principal_office_address) ligne.principal_office_address = body.principal_office_address;
    if (body.notes) ligne.notes = body.notes;
    // 🆕 09/09 : le contact des relances, saisi des la creation.
    if (body.email_contact) ligne.email_contact = String(body.email_contact).toLowerCase().trim();
    if (body.telephone_contact) ligne.telephone_contact = String(body.telephone_contact).replace(/[^0-9+ .\-()]/g, "").trim().slice(0, 30);

    if (body.formation_date) {
      const mois = Number(String(body.formation_date).slice(5, 7));
      if (mois >= 1 && mois <= 12) ligne.anniversary_month = mois;
    }

    const { data: societe, error: eIns } = await supabase
      .from("compliance_tenants")
      .insert(ligne)
      .select()
      .single();

    if (eIns) {
      return NextResponse.json(
        { error: "Creation de la societe: " + eIns.message },
        { status: 500 }
      );
    }

    const { error: eMembre } = await supabase.from("compliance_membres").insert({
      user_id: userId,
      tenant_id: societe.tenant_id,
      role: "proprietaire",
      actif: true,
    });

    if (eMembre) {
      return NextResponse.json(
        {
          error: "Societe creee mais rattachement echoue: " + eMembre.message,
          tenant_id: societe.tenant_id,
        },
        { status: 500 }
      );
    }

    // Generation des echeances.
    // Signature reelle verifiee : compliance_generate_deadlines(p_tenant_id uuid, p_year integer)
    const anneeCible = new Date().getFullYear() + 1;
    const echeances: Record<string, unknown> = { tente: true, annee: anneeCible };
    try {
      const { error: eGen } = await supabase.rpc("compliance_generate_deadlines", {
        p_tenant_id: societe.tenant_id,
        p_year: anneeCible,
      });
      if (eGen) {
        echeances.generees = false;
        echeances.raison = eGen.message;
      } else {
        echeances.generees = true;
      }
    } catch (e: unknown) {
      echeances.generees = false;
      echeances.raison = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({
      success: true,
      tenant_id: societe.tenant_id,
      label: societe.label,
      legal_name: societe.legal_name,
      echeances,
      note: "Reconnectez-vous pour que votre societe soit prise en compte dans votre session.",
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// 🆕 PATCH — 09/09 : LE CONTACT DES RELANCES, MODIFIABLE PAR LE TITULAIRE.
//
// Trois champs, et seulement ceux-la : email_contact (ou partent les
// courriels de relance et l accuse de lecture a signer), telephone_contact
// (ou partent les SMS a J-7 et J-1), relance_auto (l interrupteur). Le reste
// de la fiche (denomination, Etat, date) reste au support : ces valeurs
// pilotent les echeances et ne se changent pas d un clic.
//
// Le tenant vient de la session ; l entite modifiee est celle du tenant.
// Avec plusieurs societes, `entite_id` designe laquelle — et elle doit
// appartenir au tenant.
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }
  const { id: userId, tenantId } = await utilisateurDeLaSession();
  if (!userId || !tenantId) {
    return NextResponse.json({ error: "Vous devez etre connecte, avec une societe rattachee." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const modifications: Record<string, unknown> = {};

    if (body.email_contact !== undefined) {
      const e = String(body.email_contact || "").toLowerCase().trim();
      if (e && (e.indexOf("@") < 1 || e.indexOf(".") < 3)) {
        return NextResponse.json({ error: "Adresse electronique illisible." }, { status: 400 });
      }
      modifications.email_contact = e || null;
    }
    if (body.telephone_contact !== undefined) {
      const t = String(body.telephone_contact || "").replace(/[^0-9+ .\-()]/g, "").trim().slice(0, 30);
      modifications.telephone_contact = t || null;
    }
    if (body.relance_auto !== undefined) {
      modifications.relance_auto = body.relance_auto === true;
    }
    if (Object.keys(modifications).length === 0) {
      return NextResponse.json({ error: "Rien a modifier." }, { status: 400 });
    }

    let q = supabase.from("compliance_tenants").update(modifications).eq("tenant_id", tenantId);
    if (body.entite_id) q = q.eq("id", String(body.entite_id));
    const { data, error } = await q.select("id, email_contact, telephone_contact, relance_auto");

    if (error) return NextResponse.json({ error: "Modification: " + error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: "Societe introuvable." }, { status: 404 });

    return NextResponse.json({ success: true, societes: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
