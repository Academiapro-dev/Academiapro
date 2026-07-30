import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];
const NIVEAUX = ["debutant", "notions", "intermediaire", "avance"];

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

    const url = new URL(req.url);

    // Le stagiaire relit le sien.
    if (url.searchParams.get("vue") === "mien") {
      const code = (url.searchParams.get("formation_code") || "").trim().toUpperCase();

      const { data } = await supabase
        .from("organisme_positionnements")
        .select("*")
        .eq("stagiaire_email", session.email)
        .eq("formation_code", code)
        .maybeSingle();

      return NextResponse.json({ ok: true, niveaux: NIVEAUX, positionnement: data || null });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("organisme_positionnements")
      .select("*")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // L ecart le plus frequent sur l indicateur 8 : un besoin recueilli
    // auquel l organisme n a jamais repondu par ecrit.
    const sansAdaptation = (data || []).filter(function (p: any) {
      return !p.adaptation_proposee;
    }).length;

    const avecBesoin = (data || []).filter(function (p: any) {
      return p.besoins_specifiques && p.besoins_specifiques.trim().length > 0;
    });

    const besoinSansReponse = avecBesoin.filter(function (p: any) {
      return !p.adaptation_proposee;
    }).length;

    return NextResponse.json({
      ok: true,
      niveaux: NIVEAUX,
      total: (data || []).length,
      sans_adaptation: sansAdaptation,
      avec_besoin_specifique: avecBesoin.length,
      besoin_sans_reponse: besoinSansReponse,
      positionnements: data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// DEPOT par le stagiaire lui-meme.
export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous pour repondre." }, { status: 401 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const code = String(b.formation_code || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, erreur: "Formation non precisee." }, { status: 400 });
    }

    const attentes = String(b.attentes || "").trim();
    if (attentes.length < 10) {
      return NextResponse.json(
        { ok: false, erreur: "Dites-nous en quelques mots ce que vous attendez de cette formation." },
        { status: 400 }
      );
    }

    const niveau = String(b.niveau_declare || "").trim().toLowerCase();
    if (niveau && NIVEAUX.indexOf(niveau) < 0) {
      return NextResponse.json({ ok: false, erreur: "Niveau inconnu." }, { status: 400 });
    }

    const fiche = {
      tenant_id: session.tenantId,
      stagiaire_email: session.email,
      formation_code: code,
      attentes: attentes,
      niveau_declare: niveau || null,
      experience: b.experience ? String(b.experience).trim() : null,
      objectif_professionnel: b.objectif_professionnel ? String(b.objectif_professionnel).trim() : null,
      contraintes: b.contraintes ? String(b.contraintes).trim() : null,
      besoins_specifiques: b.besoins_specifiques ? String(b.besoins_specifiques).trim() : null,
      statut: "depose",
    };

    const { error } = await supabase
      .from("organisme_positionnements")
      .upsert(fiche, { onConflict: "tenant_id,stagiaire_email,formation_code" });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// L ADAPTATION, ecrite par l organisme : c est elle qui prouve l indicateur 8.
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

    const adaptation = String(b.adaptation_proposee || "").trim();

    const m: any = {
      adaptation_proposee: adaptation || null,
      statut: adaptation ? "traite" : "depose",
    };

    if (adaptation) {
      m.adaptation_par = session.email;
      m.adaptation_le = new Date().toISOString();
    } else {
      m.adaptation_par = null;
      m.adaptation_le = null;
    }

    const { error } = await supabase
      .from("organisme_positionnements")
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
