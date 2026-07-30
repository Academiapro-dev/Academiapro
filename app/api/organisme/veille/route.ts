import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const DOMAINES: any = {
  legale: { libelle: "Legale et reglementaire", indicateur: 23 },
  metier: { libelle: "Metier, emploi et competences", indicateur: 24 },
  innovations: { libelle: "Innovations pedagogiques et technologiques", indicateur: 25 },
  handicap: { libelle: "Handicap et accessibilite", indicateur: 26 },
};

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
      .from("organisme_veille")
      .select("*")
      .eq("tenant_id", tenant)
      .order("date_consultation", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Une veille est jugee vivante si elle a produit au moins deux entrees
    // dans l annee, dont une datant de moins de six mois. Un registre garni
    // une seule fois avant l audit ne trompe personne.
    const maintenant = Date.now();
    const anUn = maintenant - 365 * 24 * 60 * 60 * 1000;
    const sixMois = maintenant - 182 * 24 * 60 * 60 * 1000;

    const parDomaine: any = {};

    for (const cle of Object.keys(DOMAINES)) {
      const entrees = (data || []).filter(function (v: any) { return v.domaine === cle; });
      const surUnAn = entrees.filter(function (v: any) {
        return new Date(v.date_consultation).getTime() >= anUn;
      });
      const recente = entrees.some(function (v: any) {
        return new Date(v.date_consultation).getTime() >= sixMois;
      });
      const avecEffet = entrees.filter(function (v: any) { return v.effet_sur_prestations; }).length;

      parDomaine[cle] = {
        libelle: DOMAINES[cle].libelle,
        indicateur: DOMAINES[cle].indicateur,
        total: entrees.length,
        sur_un_an: surUnAn.length,
        recente: recente,
        avec_effet: avecEffet,
        vivante: surUnAn.length >= 2 && recente,
        derniere: entrees.length > 0 ? entrees[0].date_consultation : null,
      };
    }

    const vivantes = Object.keys(parDomaine).filter(function (k) {
      return parDomaine[k].vivante;
    }).length;

    return NextResponse.json({
      ok: true,
      domaines: DOMAINES,
      par_domaine: parDomaine,
      vivantes: vivantes,
      total: (data || []).length,
      entrees: data || [],
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

    const domaine = String(b.domaine || "").trim().toLowerCase();
    if (!DOMAINES[domaine]) {
      return NextResponse.json({ ok: false, erreur: "Domaine de veille inconnu." }, { status: 400 });
    }

    const titre = String(b.titre || "").trim();
    const source = String(b.source || "").trim();

    if (titre.length < 3 || source.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez au moins un titre et une source." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("organisme_veille")
      .insert({
        tenant_id: tenant,
        domaine: domaine,
        source: source,
        date_consultation: b.date_consultation || new Date().toISOString().slice(0, 10),
        titre: titre,
        ce_qui_est_retenu: b.ce_qui_est_retenu ? String(b.ce_qui_est_retenu).trim() : null,
        effet_sur_prestations: b.effet_sur_prestations ? String(b.effet_sur_prestations).trim() : null,
        action_engagee: b.action_engagee === true,
      })
      .select("id, titre")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, entree: (data || [])[0] || null });
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

    const m: any = {};

    if (b.ce_qui_est_retenu !== undefined) {
      m.ce_qui_est_retenu = b.ce_qui_est_retenu ? String(b.ce_qui_est_retenu).trim() : null;
    }
    if (b.effet_sur_prestations !== undefined) {
      m.effet_sur_prestations = b.effet_sur_prestations ? String(b.effet_sur_prestations).trim() : null;
    }
    if (b.action_engagee !== undefined) {
      m.action_engagee = b.action_engagee === true;
    }

    if (Object.keys(m).length === 0) {
      return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_veille")
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
      .from("organisme_veille")
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
