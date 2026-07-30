import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];
const TYPES = ["theorie", "pratique", "evaluation"];

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

    const coursId = new URL(req.url).searchParams.get("cours");
    if (!coursId) {
      return NextResponse.json({ ok: false, erreur: "Formation non precisee." }, { status: 400 });
    }

    const { data: cours } = await supabase
      .from("organisme_cours")
      .select("id, code, titre, duree, publie")
      .eq("id", coursId)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!cours) {
      return NextResponse.json({ ok: false, erreur: "Formation introuvable." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("organisme_modules")
      .select("*")
      .eq("cours_id", coursId)
      .eq("tenant_id", tenant)
      .order("chapitre", { ascending: true })
      .order("numero", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Regroupement par chapitre, comme le lecteur du LMS l attend.
    const chapitres: any = {};
    for (const m of data || []) {
      const c = m.chapitre || 1;
      if (!chapitres[c]) {
        chapitres[c] = { numero: c, titre: m.chapitre_titre || "Chapitre " + c, modules: [] };
      }
      chapitres[c].modules.push({
        ...m,
        redige: !!(m.contenu && String(m.contenu).trim().length > 200),
        signes: m.contenu ? String(m.contenu).length : 0,
      });
    }

    const liste = Object.keys(chapitres)
      .map(function (k) { return chapitres[k]; })
      .sort(function (a: any, b: any) { return a.numero - b.numero; });

    const total = (data || []).length;
    const rediges = (data || []).filter(function (m: any) {
      return m.contenu && String(m.contenu).trim().length > 200;
    }).length;

    return NextResponse.json({
      ok: true,
      types: TYPES,
      cours: cours,
      total: total,
      rediges: rediges,
      chapitres: liste,
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
    if (!b || !b.cours_id) {
      return NextResponse.json({ ok: false, erreur: "Formation non precisee." }, { status: 400 });
    }

    const titre = String(b.titre || "").trim();
    if (titre.length < 3) {
      return NextResponse.json({ ok: false, erreur: "Donnez un titre au module." }, { status: 400 });
    }

    // Verification d appartenance : on n ajoute pas un module au cours d autrui.
    const { data: cours } = await supabase
      .from("organisme_cours")
      .select("id")
      .eq("id", b.cours_id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!cours) {
      return NextResponse.json({ ok: false, erreur: "Formation introuvable." }, { status: 404 });
    }

    const chapitre = b.chapitre ? Number(b.chapitre) : 1;
    if (isNaN(chapitre) || chapitre < 1 || chapitre > 50) {
      return NextResponse.json({ ok: false, erreur: "Numero de chapitre invalide." }, { status: 400 });
    }

    const type = String(b.type || "theorie").trim().toLowerCase();
    if (TYPES.indexOf(type) < 0) {
      return NextResponse.json({ ok: false, erreur: "Type de module inconnu." }, { status: 400 });
    }

    // Le numero suit dans le chapitre : l organisme n a pas a le calculer.
    const { data: freres } = await supabase
      .from("organisme_modules")
      .select("numero")
      .eq("cours_id", b.cours_id)
      .eq("tenant_id", tenant)
      .eq("chapitre", chapitre)
      .order("numero", { ascending: false })
      .limit(1);

    const numero = freres && freres[0] ? Number(freres[0].numero) + 1 : 1;

    const { data, error } = await supabase
      .from("organisme_modules")
      .insert({
        tenant_id: tenant,
        cours_id: b.cours_id,
        chapitre: chapitre,
        chapitre_titre: b.chapitre_titre ? String(b.chapitre_titre).trim() : null,
        numero: numero,
        titre: titre,
        type: type,
        contenu: b.contenu ? String(b.contenu) : null,
        ordre: chapitre * 100 + numero,
      })
      .select("id, chapitre, numero, titre")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, module: (data || [])[0] || null });
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

    if (b.titre !== undefined) {
      const t = String(b.titre || "").trim();
      if (t.length < 3) {
        return NextResponse.json({ ok: false, erreur: "Titre trop court." }, { status: 400 });
      }
      m.titre = t;
    }

    if (b.chapitre_titre !== undefined) {
      m.chapitre_titre = b.chapitre_titre ? String(b.chapitre_titre).trim() : null;
    }

    if (b.contenu !== undefined) {
      m.contenu = b.contenu ? String(b.contenu) : null;
    }

    if (b.type !== undefined) {
      const t = String(b.type).trim().toLowerCase();
      if (TYPES.indexOf(t) < 0) {
        return NextResponse.json({ ok: false, erreur: "Type inconnu." }, { status: 400 });
      }
      m.type = t;
    }

    if (b.chapitre !== undefined) {
      const c = Number(b.chapitre);
      if (isNaN(c) || c < 1 || c > 50) {
        return NextResponse.json({ ok: false, erreur: "Chapitre invalide." }, { status: 400 });
      }
      m.chapitre = c;
    }

    if (b.numero !== undefined) {
      const n = Number(b.numero);
      if (isNaN(n) || n < 1 || n > 100) {
        return NextResponse.json({ ok: false, erreur: "Numero invalide." }, { status: 400 });
      }
      m.numero = n;
    }

    if (m.chapitre !== undefined || m.numero !== undefined) {
      const { data: actuel } = await supabase
        .from("organisme_modules")
        .select("chapitre, numero")
        .eq("id", b.id)
        .eq("tenant_id", tenant)
        .maybeSingle();

      const ch = m.chapitre !== undefined ? m.chapitre : (actuel ? actuel.chapitre : 1);
      const nu = m.numero !== undefined ? m.numero : (actuel ? actuel.numero : 1);
      m.ordre = ch * 100 + nu;
    }

    const { error } = await supabase
      .from("organisme_modules")
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
      .from("organisme_modules")
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
