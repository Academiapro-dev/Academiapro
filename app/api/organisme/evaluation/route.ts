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

function note(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (isNaN(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

function moyenne(valeurs: number[]): number | null {
  const utiles = valeurs.filter(function (v) { return typeof v === "number"; });
  if (utiles.length === 0) return null;
  const s = utiles.reduce(function (a, b) { return a + b; }, 0);
  return Math.round((s / utiles.length) * 10) / 10;
}

// LECTURE. Deux usages : le stagiaire relit sa propre evaluation,
// l organisme lit les resultats agreges de tous ses stagiaires.
export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);
    const vue = url.searchParams.get("vue") || "";

    // Le stagiaire relit la sienne.
    if (vue === "mienne") {
      const code = (url.searchParams.get("formation_code") || "").trim().toUpperCase();
      const moment = (url.searchParams.get("moment") || "chaud").trim();

      const { data } = await supabase
        .from("organisme_evaluations")
        .select("*")
        .eq("stagiaire_email", session.email)
        .eq("formation_code", code)
        .eq("moment", moment)
        .maybeSingle();

      return NextResponse.json({ ok: true, evaluation: data || null });
    }

    // L organisme lit l ensemble.
    const admin = ADMINS.indexOf(session.email) >= 0;
    let tenant = session.tenantId;
    if (!tenant && admin) tenant = url.searchParams.get("tenant");
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data: lignes, error } = await supabase
      .from("organisme_evaluations")
      .select("*")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(3000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const chaud = (lignes || []).filter(function (l: any) { return l.moment === "chaud"; });
    const froid = (lignes || []).filter(function (l: any) { return l.moment === "froid"; });

    function synthese(ensemble: any[]) {
      return {
        nombre: ensemble.length,
        globale: moyenne(ensemble.map(function (l: any) { return l.note_globale; })),
        contenu: moyenne(ensemble.map(function (l: any) { return l.note_contenu; })),
        accompagnement: moyenne(ensemble.map(function (l: any) { return l.note_accompagnement; })),
        plateforme: moyenne(ensemble.map(function (l: any) { return l.note_plateforme; })),
        recommanderaient: ensemble.filter(function (l: any) { return l.recommanderait === true; }).length,
      };
    }

    // Le taux de retour, que l auditeur demande au titre de l indicateur 30.
    const { data: inscrits } = await supabase
      .from("organisme_apprenants")
      .select("email")
      .eq("tenant_id", tenant)
      .limit(5000);

    const total = (inscrits || []).length;
    const repondants = new Set(chaud.map(function (l: any) { return l.stagiaire_email; })).size;

    return NextResponse.json({
      ok: true,
      chaud: synthese(chaud),
      froid: synthese(froid),
      taux_retour: total > 0 ? Math.round((repondants / total) * 100) : null,
      inscrits: total,
      evaluations: lignes || [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// DEPOT par le stagiaire lui-meme : c est le sens de l indicateur 30.
// Le tenant vient de sa session, jamais du corps de la requete.
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

    const moment = String(b.moment || "chaud").trim().toLowerCase();
    if (moment !== "chaud" && moment !== "froid") {
      return NextResponse.json({ ok: false, erreur: "Moment inconnu." }, { status: 400 });
    }

    const globale = note(b.note_globale);
    if (globale === null) {
      return NextResponse.json(
        { ok: false, erreur: "Donnez au moins une appreciation globale, de 1 a 5." },
        { status: 400 }
      );
    }

    const fiche = {
      tenant_id: session.tenantId,
      stagiaire_email: session.email,
      formation_code: code,
      moment: moment,
      note_globale: globale,
      note_contenu: note(b.note_contenu),
      note_accompagnement: note(b.note_accompagnement),
      note_plateforme: note(b.note_plateforme),
      recommanderait: b.recommanderait === true ? true : b.recommanderait === false ? false : null,
      points_forts: b.points_forts ? String(b.points_forts).trim() : null,
      points_ameliorer: b.points_ameliorer ? String(b.points_ameliorer).trim() : null,
      commentaire_libre: b.commentaire_libre ? String(b.commentaire_libre).trim() : null,
      objectifs_atteints: b.objectifs_atteints ? String(b.objectifs_atteints).trim() : null,
      mise_en_pratique: b.mise_en_pratique ? String(b.mise_en_pratique).trim() : null,
    };

    const { error } = await supabase
      .from("organisme_evaluations")
      .upsert(fiche, { onConflict: "tenant_id,stagiaire_email,formation_code,moment" });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, moment: moment });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
