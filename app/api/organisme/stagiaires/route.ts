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

// L organisme vient de la SESSION SIGNEE. L administrateur peut en designer
// un explicitement, uniquement pour les essais.
function organismeDeLaDemande(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    const demande = new URL(req.url).searchParams.get("tenant");
    if (demande) return demande;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = organismeDeLaDemande(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data: registre, error } = await supabase
      .from("organisme_apprenants")
      .select("id, email, nom, statut, created_at")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Nombre de modules valides pour chacun, pour que l organisme voie
    // immediatement qui a commence et qui n a rien fait.
    const { data: valides } = await supabase
      .from("progression_apprenants")
      .select("user_email")
      .eq("tenant_id", tenant)
      .eq("statut", "valide")
      .limit(5000);

    const compte: any = {};
    for (const v of valides || []) {
      compte[v.user_email] = (compte[v.user_email] || 0) + 1;
    }

    const liste = (registre || []).map(function (a: any) {
      return { ...a, modules_valides: compte[a.email] || 0 };
    });

    return NextResponse.json({ ok: true, tenant_id: tenant, nombre: liste.length, apprenants: liste });
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

    const tenant = organismeDeLaDemande(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const corps = await req.json().catch(function () { return null; });
    if (!corps) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    // On accepte une liste collee : emails separes par virgules, points-virgules,
    // espaces ou retours a la ligne. L organisme colle son fichier et c est fait.
    const brut = String(corps.emails || corps.email || "");
    const trouves = brut
      .split(/[\s,;]+/)
      .map(function (e) { return e.trim().toLowerCase(); })
      .filter(function (e) { return e.length > 4 && e.indexOf("@") > 0 && e.indexOf(".") > 0; });

    const uniques = Array.from(new Set(trouves));

    if (uniques.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Aucune adresse valable dans votre saisie." }, { status: 400 });
    }

    const lignes = uniques.map(function (email) {
      return {
        tenant_id: tenant,
        email: email,
        nom: uniques.length === 1 && corps.nom ? String(corps.nom).trim() : null,
        statut: "invite",
      };
    });

    const { error } = await supabase
      .from("organisme_apprenants")
      .upsert(lignes, { onConflict: "tenant_id,email", ignoreDuplicates: true });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ajoutes: uniques.length, emails: uniques });
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

    const tenant = organismeDeLaDemande(req, session);
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

    // Le filtre sur l organisme est indispensable : sans lui, un client
    // pourrait retirer le stagiaire d un autre en devinant un identifiant.
    const { error } = await supabase
      .from("organisme_apprenants")
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
