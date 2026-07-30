import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];
const RESERVES = ["admin", "api", "organisme", "stagiaire", "lms", "of", "pack", "connexion", "dashboard", "catalogue", "signature", "seance", "evaluation", "positionnement"];

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

// Une adresse de page doit etre lisible, stable et sans surprise : lettres,
// chiffres et tirets uniquement.
function fabriquerSlug(brut: string): string {
  return String(brut || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
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

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, slug, portail_actif, portail_presentation, numero_da, qualiopi")
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ ok: false, erreur: "Organisme introuvable." }, { status: 404 });
    }

    const { data: propres } = await supabase
      .from("organisme_cours")
      .select("id")
      .eq("tenant_id", tenant)
      .eq("publie", true)
      .limit(500);

    const { data: souscrites } = await supabase
      .from("organisme_catalogue")
      .select("formation_code, prix_vente_public")
      .eq("tenant_id", tenant)
      .eq("actif", true)
      .limit(1000);

    const sansPrix = (souscrites || []).filter(function (c: any) {
      return !c.prix_vente_public;
    }).length;

    return NextResponse.json({
      ok: true,
      organisme: org,
      suggestion: org.slug || fabriquerSlug(org.raison_sociale || ""),
      formations_publiables: (propres || []).length + (souscrites || []).length,
      sans_prix: sansPrix,
    });
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

    if (session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut modifier sa page." },
        { status: 403 }
      );
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

    const m: any = { updated_at: new Date().toISOString() };

    if (b.slug !== undefined) {
      const slug = fabriquerSlug(b.slug);

      if (slug.length < 3) {
        return NextResponse.json(
          { ok: false, erreur: "L adresse doit comporter au moins trois caracteres." },
          { status: 400 }
        );
      }

      if (RESERVES.indexOf(slug) >= 0) {
        return NextResponse.json(
          { ok: false, erreur: "Cette adresse est reservee. Choisissez-en une autre." },
          { status: 400 }
        );
      }

      const { data: prise } = await supabase
        .from("organismes_formation")
        .select("tenant_id")
        .eq("slug", slug)
        .maybeSingle();

      if (prise && prise.tenant_id !== tenant) {
        return NextResponse.json(
          { ok: false, erreur: "Cette adresse est deja utilisee par un autre organisme." },
          { status: 409 }
        );
      }

      m.slug = slug;
    }

    if (b.portail_presentation !== undefined) {
      m.portail_presentation = b.portail_presentation
        ? String(b.portail_presentation).slice(0, 4000).trim()
        : null;
    }

    // On n ouvre pas une page sans adresse : le visiteur tomberait sur rien.
    if (b.portail_actif !== undefined) {
      if (b.portail_actif === true) {
        const { data: org } = await supabase
          .from("organismes_formation")
          .select("slug")
          .eq("tenant_id", tenant)
          .maybeSingle();

        const slugFinal = m.slug || (org ? org.slug : null);

        if (!slugFinal) {
          return NextResponse.json(
            { ok: false, erreur: "Choisissez d abord l adresse de votre page." },
            { status: 400 }
          );
        }
      }
      m.portail_actif = b.portail_actif === true;
    }

    const { error } = await supabase
      .from("organismes_formation")
      .update(m)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, slug: m.slug });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
