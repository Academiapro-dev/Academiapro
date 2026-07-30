import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];
const STATUTS = ["ouverte", "en_cours", "traitee", "classee_sans_suite"];
const ORIGINES = ["stagiaire", "entreprise", "financeur", "formateur", "autre"];

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

    // Le stagiaire relit les siennes.
    if (url.searchParams.get("vue") === "miennes") {
      const { data } = await supabase
        .from("organisme_reclamations")
        .select("id, objet, message, statut, reponse, repondue_le, created_at")
        .eq("auteur_email", session.email)
        .order("created_at", { ascending: false })
        .limit(100);

      return NextResponse.json({ ok: true, reclamations: data || [] });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("organisme_reclamations")
      .select("*")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const ouvertes = (data || []).filter(function (r: any) {
      return r.statut === "ouverte" || r.statut === "en_cours";
    }).length;

    const traitees = (data || []).filter(function (r: any) { return r.statut === "traitee"; });

    // Delai moyen de traitement : l auditeur regarde la reactivite,
    // pas seulement l existence du registre.
    let delai: number | null = null;
    if (traitees.length > 0) {
      const jours = traitees
        .filter(function (r: any) { return r.repondue_le; })
        .map(function (r: any) {
          const d = new Date(r.repondue_le).getTime() - new Date(r.created_at).getTime();
          return Math.max(0, Math.round(d / 86400000));
        });
      if (jours.length > 0) {
        delai = Math.round((jours.reduce(function (a, b) { return a + b; }, 0) / jours.length) * 10) / 10;
      }
    }

    const avecAction = (data || []).filter(function (r: any) { return r.action_corrective; }).length;

    return NextResponse.json({
      ok: true,
      statuts: STATUTS,
      origines: ORIGINES,
      total: (data || []).length,
      ouvertes: ouvertes,
      delai_moyen_jours: delai,
      avec_action_corrective: avecAction,
      reclamations: data || [],
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

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const objet = String(b.objet || "").trim();
    const message = String(b.message || "").trim();

    if (objet.length < 3 || message.length < 10) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez un objet et decrivez votre reclamation." },
        { status: 400 }
      );
    }

    const admin = ADMINS.indexOf(session.email) >= 0;
    const pourAutrui = b.auteur_email && (session.tenantId || admin);

    // Soit le stagiaire depose pour lui-meme, soit l organisme consigne
    // une reclamation recue par un autre canal.
    const tenant = pourAutrui ? tenantDe(req, session) : session.tenantId;

    if (pourAutrui && !tenant) {
      return NextResponse.json({ ok: false, erreur: "Organisme non precise." }, { status: 400 });
    }

    const origine = String(b.origine || "stagiaire").trim().toLowerCase();
    if (ORIGINES.indexOf(origine) < 0) {
      return NextResponse.json({ ok: false, erreur: "Origine inconnue." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organisme_reclamations")
      .insert({
        tenant_id: tenant,
        auteur_email: pourAutrui ? String(b.auteur_email).trim().toLowerCase() : session.email,
        auteur_nom: b.auteur_nom ? String(b.auteur_nom).trim() : null,
        formation_code: b.formation_code ? String(b.formation_code).trim().toUpperCase() : null,
        objet: objet,
        message: message,
        origine: origine,
        statut: "ouverte",
      })
      .select("id, created_at")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, reclamation: (data || [])[0] || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Reponse et action corrective : reserve a l organisme.
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

    const modifications: any = {};

    if (b.reponse !== undefined) {
      const r = String(b.reponse || "").trim();
      modifications.reponse = r || null;
      if (r) modifications.repondue_le = new Date().toISOString();
    }

    if (b.action_corrective !== undefined) {
      modifications.action_corrective = b.action_corrective
        ? String(b.action_corrective).trim()
        : null;
    }

    if (b.statut !== undefined) {
      const s = String(b.statut || "").trim().toLowerCase();
      if (STATUTS.indexOf(s) < 0) {
        return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
      }
      modifications.statut = s;
    }

    if (Object.keys(modifications).length === 0) {
      return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_reclamations")
      .update(modifications)
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
