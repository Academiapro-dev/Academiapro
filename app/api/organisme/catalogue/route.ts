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

function contexte(req: NextRequest) {
  const session = sessionCourante();
  if (!session) return { session: null, tenant: null, admin: false };
  const admin = ADMINS.indexOf(session.email) >= 0;
  let tenant = session.tenantId;
  if (!tenant && admin) {
    tenant = new URL(req.url).searchParams.get("tenant");
  }
  return { session: session, tenant: tenant, admin: admin };
}

export async function GET(req: NextRequest) {
  try {
    const { session, tenant, admin } = contexte(req);
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data: ouvertes, error } = await supabase
      .from("organisme_catalogue")
      .select("id, formation_code, prix_vente_public, actif, created_at")
      .eq("tenant_id", tenant)
      .order("formation_code", { ascending: true })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Titres, duree et prix public d AcademIA, pour un affichage lisible.
    const { data: fiches } = await supabase
      .from("formations")
      .select("code, titre, domaine, duree, prix")
      .eq("actif", true)
      .limit(1000);

    const parCode: any = {};
    for (const f of fiches || []) parCode[f.code] = f;

    const liste = (ouvertes || []).map(function (o: any) {
      const f = parCode[o.formation_code] || {};
      return {
        ...o,
        titre: f.titre || o.formation_code,
        domaine: f.domaine || null,
        duree: f.duree || null,
        prix_academia: f.prix || null,
      };
    });

    // Nombre de stagiaires inscrits par formation, pour cet organisme.
    const { data: inscrits } = await supabase
      .from("organisme_apprenants")
      .select("formation_code")
      .eq("tenant_id", tenant)
      .limit(5000);

    const compte: any = {};
    for (const i of inscrits || []) {
      if (i.formation_code) compte[i.formation_code] = (compte[i.formation_code] || 0) + 1;
    }

    const avecCompte = liste.map(function (o: any) {
      return { ...o, stagiaires: compte[o.formation_code] || 0 };
    });

    // L administrateur recoit aussi le catalogue complet, pour choisir
    // ce qu il ouvre a ce client.
    let disponibles: any[] = [];
    if (admin) {
      const dejaOuvertes = new Set((ouvertes || []).map(function (o: any) { return o.formation_code; }));
      disponibles = (fiches || [])
        .filter(function (f: any) { return !dejaOuvertes.has(f.code); })
        .map(function (f: any) {
          return { code: f.code, titre: f.titre, domaine: f.domaine, prix: f.prix };
        });
    }

    return NextResponse.json({
      ok: true,
      tenant_id: tenant,
      admin: admin,
      nombre: avecCompte.length,
      formations: avecCompte,
      disponibles: disponibles,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Ouvrir des formations a un organisme : reserve a l administrateur,
// c est un acte contractuel.
export async function POST(req: NextRequest) {
  try {
    const { session, tenant, admin } = contexte(req);
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }
    if (!admin) {
      return NextResponse.json(
        { ok: false, erreur: "Seul l editeur peut ouvrir des formations a un organisme." },
        { status: 403 }
      );
    }
    if (!tenant) {
      return NextResponse.json({ ok: false, erreur: "Organisme non precise." }, { status: 400 });
    }

    const corps = await req.json().catch(function () { return null; });
    if (!corps) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    let codes: string[] = [];

    if (corps.tout === true) {
      const { data: fiches } = await supabase
        .from("formations")
        .select("code")
        .eq("actif", true)
        .limit(1000);
      codes = (fiches || []).map(function (f: any) { return String(f.code).toUpperCase(); });
    } else {
      const brut = String(corps.codes || corps.formation_code || "");
      codes = brut
        .split(/[\s,;]+/)
        .map(function (c) { return c.trim().toUpperCase(); })
        .filter(function (c) { return c.length > 1; });
    }

    codes = Array.from(new Set(codes));

    if (codes.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Aucun code de formation valable." }, { status: 400 });
    }

    const lignes = codes.map(function (code) {
      return {
        tenant_id: tenant,
        formation_code: code,
        prix_vente_public: corps.prix_vente_public ? Number(corps.prix_vente_public) : null,
        actif: true,
      };
    });

    const { error } = await supabase
      .from("organisme_catalogue")
      .upsert(lignes, { onConflict: "tenant_id,formation_code", ignoreDuplicates: true });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ouvertes: codes.length, codes: codes });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Le prix de vente est modifiable par l organisme lui-meme : c est SON prix.
// L activation ou la desactivation reste a l editeur.
export async function PATCH(req: NextRequest) {
  try {
    const { session, tenant, admin } = contexte(req);
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const corps = await req.json().catch(function () { return null; });
    if (!corps || !corps.id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const modifications: any = {};

    if (corps.prix_vente_public !== undefined) {
      const prix = corps.prix_vente_public === null || corps.prix_vente_public === ""
        ? null
        : Number(corps.prix_vente_public);
      if (prix !== null && (isNaN(prix) || prix < 0)) {
        return NextResponse.json({ ok: false, erreur: "Prix invalide." }, { status: 400 });
      }
      modifications.prix_vente_public = prix;
    }

    if (corps.actif !== undefined) {
      if (!admin) {
        return NextResponse.json(
          { ok: false, erreur: "Seul l editeur peut activer ou desactiver une formation." },
          { status: 403 }
        );
      }
      modifications.actif = corps.actif === true;
    }

    if (Object.keys(modifications).length === 0) {
      return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_catalogue")
      .update(modifications)
      .eq("id", corps.id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, modifie: corps.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session, tenant, admin } = contexte(req);
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }
    if (!admin) {
      return NextResponse.json(
        { ok: false, erreur: "Seul l editeur peut retirer une formation." },
        { status: 403 }
      );
    }
    if (!tenant) {
      return NextResponse.json({ ok: false, erreur: "Organisme non precise." }, { status: 400 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_catalogue")
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
