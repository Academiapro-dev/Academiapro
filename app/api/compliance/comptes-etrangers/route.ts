import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
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

function tenantDeLaSession(req: NextRequest): string | null {
  try {
    const brut = req.cookies.get("sb_user")?.value;
    if (!brut) return null;
    const donnees = JSON.parse(decodeURIComponent(brut));
    return donnees?.tenant_id || null;
  } catch {
    return null;
  }
}

// Liste des comptes d'un exercice
export async function GET(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = tenantDeLaSession(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const annee = Number(searchParams.get("year")) || new Date().getFullYear();

    const { data, error } = await supabase
      .from("compliance_comptes_etrangers")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("exercice", annee)
      .order("date_ouverture", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, annee, tenant_id: tenantId, comptes: data ?? [] });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

// Ajout d'un compte
export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = tenantDeLaSession(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    if (!body.designation) {
      return NextResponse.json({ error: "La designation est obligatoire" }, { status: 400 });
    }
    if (!body.organisme_nom) {
      return NextResponse.json({ error: "Le nom de l'organisme est obligatoire" }, { status: 400 });
    }

    const ligne = {
      tenant_id: tenantId,
      designation: body.designation,
      type_compte: body.type_compte || null,
      caractere: body.caractere || null,
      organisme_nom: body.organisme_nom,
      organisme_adresse: body.organisme_adresse || null,
      organisme_pays: body.organisme_pays || null,
      numero_compte: body.numero_compte || null,
      date_ouverture: body.date_ouverture || null,
      date_cloture: body.date_cloture || null,
      devise: body.devise || null,
      titulaire: body.titulaire || null,
      titulaire_precision: body.titulaire_precision || null,
      valide_par_fiscaliste: body.valide_par_fiscaliste === true,
      notes: body.notes || null,
      exercice: Number(body.exercice) || new Date().getFullYear(),
    };

    const { data, error } = await supabase
      .from("compliance_comptes_etrangers")
      .insert(ligne)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Insertion: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, compte: data });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

// Suppression d'un compte
export async function DELETE(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = tenantDeLaSession(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    // Le filtre tenant_id empeche de supprimer le compte d'un autre client
    const { error } = await supabase
      .from("compliance_comptes_etrangers")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
