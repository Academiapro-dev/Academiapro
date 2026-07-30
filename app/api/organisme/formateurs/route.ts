import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];
const STATUTS = ["interne", "externe", "sous_traitant"];

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

function tenantDe(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    return new URL(req.url).searchParams.get("tenant");
  }
  return null;
}

// Un formateur est en regle au sens des indicateurs 21 et 22 s il a une
// qualification connue, ses pieces deposees, et une action de developpement
// des competences datant de moins de trois ans.
function enRegle(f: any): boolean {
  if (!f.qualification) return false;
  if (!f.cv_depose) return false;
  if (!f.derniere_action_date) return false;
  const limite = Date.now() - 3 * 365 * 24 * 60 * 60 * 1000;
  return new Date(f.derniere_action_date).getTime() >= limite;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("organisme_formateurs")
      .select("*")
      .eq("tenant_id", tenant)
      .order("nom", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const liste = (data || []).map(function (f: any) {
      return { ...f, en_regle: enRegle(f) };
    });

    const actifs = liste.filter(function (f: any) { return f.actif; });
    const conformes = actifs.filter(function (f: any) { return f.en_regle; }).length;
    const sousTraitants = actifs.filter(function (f: any) { return f.statut === "sous_traitant"; }).length;

    return NextResponse.json({
      ok: true,
      statuts: STATUTS,
      total: liste.length,
      actifs: actifs.length,
      conformes: conformes,
      a_completer: actifs.length - conformes,
      sous_traitants: sousTraitants,
      formateurs: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const nom = String(b.nom || "").trim();
    if (nom.length < 2) {
      return NextResponse.json({ ok: false, erreur: "Indiquez le nom du formateur." }, { status: 400 });
    }

    const statut = String(b.statut || "interne").trim().toLowerCase();
    if (STATUTS.indexOf(statut) < 0) {
      return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
    }

    const annees = b.annees_experience !== undefined && b.annees_experience !== null && b.annees_experience !== ""
      ? Number(b.annees_experience)
      : null;

    if (annees !== null && (isNaN(annees) || annees < 0 || annees > 70)) {
      return NextResponse.json({ ok: false, erreur: "Nombre d annees invalide." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organisme_formateurs")
      .insert({
        tenant_id: tenant,
        nom: nom,
        email: b.email ? String(b.email).trim().toLowerCase() : null,
        telephone: b.telephone ? String(b.telephone).trim() : null,
        statut: statut,
        qualification: b.qualification ? String(b.qualification).trim() : null,
        annees_experience: annees,
        domaines: b.domaines ? String(b.domaines).trim() : null,
        formations_animees: b.formations_animees ? String(b.formations_animees).trim() : null,
        cv_depose: b.cv_depose === true,
        diplome_depose: b.diplome_depose === true,
        derniere_action_developpement: b.derniere_action_developpement
          ? String(b.derniere_action_developpement).trim()
          : null,
        derniere_action_date: b.derniere_action_date || null,
        notes: b.notes ? String(b.notes).trim() : null,
      })
      .select("id, nom")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, formateur: (data || [])[0] || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const m: any = { updated_at: new Date().toISOString() };

    const champsTexte = [
      "nom", "email", "telephone", "qualification", "domaines",
      "formations_animees", "derniere_action_developpement", "notes",
    ];

    for (const c of champsTexte) {
      if (b[c] !== undefined) m[c] = b[c] ? String(b[c]).trim() : null;
    }

    if (b.statut !== undefined) {
      const s = String(b.statut || "").trim().toLowerCase();
      if (STATUTS.indexOf(s) < 0) {
        return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
      }
      m.statut = s;
    }

    if (b.annees_experience !== undefined) {
      const a = b.annees_experience === null || b.annees_experience === "" ? null : Number(b.annees_experience);
      if (a !== null && (isNaN(a) || a < 0 || a > 70)) {
        return NextResponse.json({ ok: false, erreur: "Nombre d annees invalide." }, { status: 400 });
      }
      m.annees_experience = a;
    }

    if (b.derniere_action_date !== undefined) {
      m.derniere_action_date = b.derniere_action_date || null;
    }

    if (b.cv_depose !== undefined) m.cv_depose = b.cv_depose === true;
    if (b.diplome_depose !== undefined) m.diplome_depose = b.diplome_depose === true;
    if (b.actif !== undefined) m.actif = b.actif === true;

    const { error } = await supabase
      .from("organisme_formateurs")
      .update(m)
      .eq("id", b.id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, modifie: b.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_formateurs")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, supprime: id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
