import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const OBJECTIFS: any = {
  rncp: "Titre enregistre au RNCP",
  rs: "Certification au repertoire specifique",
  cqp_non_enregistre: "CQP non enregistre",
  autre_formation: "Autre formation professionnelle",
  bilan_competences: "Bilan de competences",
  vae: "Accompagnement a la VAE",
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

    const { data: cours, error } = await supabase
      .from("organisme_cours")
      .select("*")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: modules } = await supabase
      .from("organisme_modules")
      .select("cours_id, contenu")
      .eq("tenant_id", tenant)
      .limit(5000);

    const compte: any = {};
    const rediges: any = {};
    for (const m of modules || []) {
      compte[m.cours_id] = (compte[m.cours_id] || 0) + 1;
      if (m.contenu && String(m.contenu).trim().length > 200) {
        rediges[m.cours_id] = (rediges[m.cours_id] || 0) + 1;
      }
    }

    const liste = (cours || []).map(function (c: any) {
      return {
        ...c,
        modules: compte[c.id] || 0,
        modules_rediges: rediges[c.id] || 0,
      };
    });

    return NextResponse.json({
      ok: true,
      objectifs: OBJECTIFS,
      total: liste.length,
      publies: liste.filter(function (c: any) { return c.publie; }).length,
      cours: liste,
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

    const titre = String(b.titre || "").trim();
    if (titre.length < 3) {
      return NextResponse.json({ ok: false, erreur: "Donnez un titre a votre formation." }, { status: 400 });
    }

    // Le code se fabrique tout seul s il n est pas fourni : l organisme n a pas
    // a inventer une nomenclature.
    let code = String(b.code || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!code) {
      const { data: dernier } = await supabase
        .from("organisme_cours")
        .select("code")
        .eq("tenant_id", tenant)
        .order("created_at", { ascending: false })
        .limit(50);

      let rang = 1;
      for (const c of dernier || []) {
        const m = String(c.code).match(/(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10) + 1;
          if (n > rang) rang = n;
        }
      }
      code = "C" + String(rang).padStart(3, "0");
    }

    const duree = b.duree ? Number(b.duree) : null;
    const prix = b.prix ? Number(b.prix) : null;

    if (duree !== null && (isNaN(duree) || duree < 0)) {
      return NextResponse.json({ ok: false, erreur: "Duree invalide." }, { status: 400 });
    }
    if (prix !== null && (isNaN(prix) || prix < 0)) {
      return NextResponse.json({ ok: false, erreur: "Prix invalide." }, { status: 400 });
    }

    const objectif = String(b.objectif || "autre_formation").trim().toLowerCase();
    if (!OBJECTIFS[objectif]) {
      return NextResponse.json({ ok: false, erreur: "Objectif inconnu." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organisme_cours")
      .insert({
        tenant_id: tenant,
        code: code,
        titre: titre,
        description: b.description ? String(b.description).trim() : null,
        objectifs: b.objectifs ? String(b.objectifs).trim() : null,
        prerequis: b.prerequis ? String(b.prerequis).trim() : null,
        public_cible: b.public_cible ? String(b.public_cible).trim() : null,
        duree: duree,
        prix: prix,
        domaine: b.domaine ? String(b.domaine).trim() : null,
        objectif: objectif,
        code_nsf: b.code_nsf ? String(b.code_nsf).trim() : null,
        publie: false,
      })
      .select("id, code, titre")
      .limit(1);

    if (error) {
      const doublon = String(error.message).indexOf("duplicate") >= 0;
      return NextResponse.json(
        { ok: false, erreur: doublon ? "Ce code est deja utilise dans votre catalogue." : error.message },
        { status: doublon ? 409 : 500 }
      );
    }

    return NextResponse.json({ ok: true, cours: (data || [])[0] || null });
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

    for (const c of ["titre", "description", "objectifs", "prerequis", "public_cible", "domaine", "code_nsf"]) {
      if (b[c] !== undefined) m[c] = b[c] ? String(b[c]).trim() : null;
    }

    if (b.duree !== undefined) {
      const d = b.duree === null || b.duree === "" ? null : Number(b.duree);
      if (d !== null && (isNaN(d) || d < 0)) {
        return NextResponse.json({ ok: false, erreur: "Duree invalide." }, { status: 400 });
      }
      m.duree = d;
    }

    if (b.prix !== undefined) {
      const p = b.prix === null || b.prix === "" ? null : Number(b.prix);
      if (p !== null && (isNaN(p) || p < 0)) {
        return NextResponse.json({ ok: false, erreur: "Prix invalide." }, { status: 400 });
      }
      m.prix = p;
    }

    if (b.objectif !== undefined) {
      const o = String(b.objectif).trim().toLowerCase();
      if (!OBJECTIFS[o]) {
        return NextResponse.json({ ok: false, erreur: "Objectif inconnu." }, { status: 400 });
      }
      m.objectif = o;
    }

    // On ne publie pas un cours vide : un stagiaire ne doit jamais tomber
    // sur un programme sans contenu.
    if (b.publie !== undefined) {
      if (b.publie === true) {
        const { data: modules } = await supabase
          .from("organisme_modules")
          .select("id, contenu")
          .eq("cours_id", b.id)
          .eq("tenant_id", tenant)
          .limit(500);

        const utiles = (modules || []).filter(function (x: any) {
          return x.contenu && String(x.contenu).trim().length > 200;
        });

        if (utiles.length === 0) {
          return NextResponse.json(
            {
              ok: false,
              erreur: "Redigez au moins un module avant de publier cette formation.",
            },
            { status: 400 }
          );
        }
      }
      m.publie = b.publie === true;
    }

    const { error } = await supabase
      .from("organisme_cours")
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

    await supabase
      .from("organisme_modules")
      .delete()
      .eq("cours_id", id)
      .eq("tenant_id", tenant);

    const { error } = await supabase
      .from("organisme_cours")
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
