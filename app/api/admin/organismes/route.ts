import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

export async function GET() {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const { data: organismes, error } = await supabase
      .from("organismes_formation")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: apprenants } = await supabase
      .from("organisme_apprenants")
      .select("tenant_id")
      .limit(10000);

    const compte: any = {};
    for (const a of apprenants || []) {
      compte[a.tenant_id] = (compte[a.tenant_id] || 0) + 1;
    }

    const liste = (organismes || []).map(function (o: any) {
      return { ...o, stagiaires: compte[o.tenant_id] || 0 };
    });

    return NextResponse.json({ ok: true, nombre: liste.length, organismes: liste });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const corps = await req.json().catch(function () { return null; });
    if (!corps) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const raison = String(corps.raison_sociale || "").trim();
    const email = String(corps.email_contact || "").trim().toLowerCase();

    if (!raison || !email || email.indexOf("@") < 1) {
      return NextResponse.json(
        { ok: false, erreur: "La raison sociale et l email de contact sont obligatoires." },
        { status: 400 }
      );
    }

    const fiche = {
      raison_sociale: raison,
      siret: corps.siret ? String(corps.siret).trim() : null,
      numero_da: corps.numero_da ? String(corps.numero_da).trim() : null,
      email_contact: email,
      telephone: corps.telephone ? String(corps.telephone).trim() : null,
      adresse: corps.adresse ? String(corps.adresse).trim() : null,
      qualiopi: corps.qualiopi === true,
      certificateur: corps.certificateur ? String(corps.certificateur).trim() : null,
      formule: corps.formule ? String(corps.formule).trim() : "pack_lms_crm",
      statut: "actif",
      notes: corps.notes ? String(corps.notes).trim() : null,
    };

    const { data, error } = await supabase
      .from("organismes_formation")
      .insert(fiche)
      .select("id, tenant_id, raison_sociale, email_contact")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, organisme: (data || [])[0] || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const corps = await req.json().catch(function () { return null; });
    if (!corps || !corps.id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const modifications: any = { updated_at: new Date().toISOString() };
    if (corps.statut) modifications.statut = String(corps.statut).trim();
    if (corps.formule) modifications.formule = String(corps.formule).trim();
    if (corps.notes !== undefined) modifications.notes = corps.notes ? String(corps.notes).trim() : null;

    const { error } = await supabase
      .from("organismes_formation")
      .update(modifications)
      .eq("id", corps.id);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, modifie: corps.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
