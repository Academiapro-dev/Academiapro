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

function utilisateurDeLaSession(req: NextRequest): { id: string | null; tenantId: string | null } {
  try {
    const brut = req.cookies.get("sb_user")?.value;
    if (!brut) return { id: null, tenantId: null };
    let texte = brut;
    try {
      texte = decodeURIComponent(brut);
    } catch {
      texte = brut;
    }
    const donnees = JSON.parse(texte);
    return { id: donnees?.id || null, tenantId: donnees?.tenant_id || null };
  } catch {
    return { id: null, tenantId: null };
  }
}

// GET : l'utilisateur connecte a-t-il deja une societe ?
export async function GET(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id, tenantId } = utilisateurDeLaSession(req);

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

  const { id: userId, tenantId: tenantExistant } = utilisateurDeLaSession(req);

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
