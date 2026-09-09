import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { lecture, dossiersAutorises } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// ══════════════════════════════════════════════════════════════════════════
// LES TEMPS PASSES — 09/09 (Mr Comptable, gestion interne).
//
// Ce que les leaders vendent sous « gestion interne » : le temps passe par
// dossier et par collaborateur, pour savoir ce qu un dossier coute et
// preparer la facturation des honoraires. Ici : une ligne par saisie
// (dossier, collaborateur = email de session, date, minutes, tache,
// facturable ou non, commentaire), et les totaux par dossier et par mois.
//
// 🚨 SAISIS, JAMAIS CALCULES : le temps est ce que le collaborateur declare.
// Aucun chronometre, aucune deduction depuis l activite.
// 🚨 Un collaborateur ne voit que les dossiers qui lui sont confies
// (dossiersAutorises) ; il ne modifie que ses propres lignes.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { global: { fetch: function (url: any, options: any) { return fetch(url, { ...(options || {}), cache: "no-store" }); } } }
);

const TACHES = ["saisie", "lettrage", "revision", "tva", "social", "liasse", "conseil", "rendez_vous", "administratif", "autre"];

function texte(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t ? t.slice(0, max) : null;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });

    const societeId = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    const mois = (req.nextUrl.searchParams.get("mois") || new Date().toISOString().slice(0, 7)).slice(0, 7);
    const autorises = await dossiersAutorises();
    if (autorises.length === 0) return NextResponse.json({ ok: false, erreur: "Aucun dossier ne vous est confié." }, { status: 403 });
    if (societeId && autorises.indexOf(societeId) < 0) return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });

    const debut = mois + "-01";
    const finDate = new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 0);
    const fin = mois + "-" + String(finDate.getDate()).padStart(2, "0");

    let q = supabase.from("compta_temps").select("*").in("societe_id", autorises).gte("date", debut).lte("date", fin).order("date", { ascending: false }).limit(2000);
    if (societeId) q = q.eq("societe_id", societeId);
    const { data: lignes, error } = await q;
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    const { data: societes } = await supabase.from("compta_societes").select("id, code, raison_sociale").in("id", autorises).limit(500);
    const nomDe: any = {};
    for (const s of societes || []) nomDe[s.id] = s.raison_sociale + " (" + s.code + ")";

    const parDossier: any = {};
    const parCollaborateur: any = {};
    let total = 0, facturable = 0;
    for (const l of lignes || []) {
      const m = Number(l.minutes) || 0;
      total += m;
      if (l.facturable) facturable += m;
      parDossier[l.societe_id] = (parDossier[l.societe_id] || 0) + m;
      parCollaborateur[l.collaborateur] = (parCollaborateur[l.collaborateur] || 0) + m;
    }

    return NextResponse.json({
      ok: true,
      mois,
      taches: TACHES,
      moi: session.email,
      total_minutes: total,
      facturable_minutes: facturable,
      par_dossier: Object.keys(parDossier).map(function (id) { return { societe_id: id, nom: nomDe[id] || id, minutes: parDossier[id] }; }).sort(function (a, b) { return b.minutes - a.minutes; }),
      par_collaborateur: Object.keys(parCollaborateur).map(function (c) { return { collaborateur: c, minutes: parCollaborateur[c] }; }).sort(function (a, b) { return b.minutes - a.minutes; }),
      lignes: (lignes || []).map(function (l: any) { return { ...l, dossier: nomDe[l.societe_id] || l.societe_id }; }),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    const refus = await lecture(String(b.societe_id));
    if (refus) return refus;

    const minutes = Math.round(Number(b.minutes) || 0);
    if (minutes <= 0 || minutes > 24 * 60) return NextResponse.json({ ok: false, erreur: "Indiquez une durée en minutes (1 à 1440)." }, { status: 400 });
    const tache = String(b.tache || "autre");
    if (TACHES.indexOf(tache) < 0) return NextResponse.json({ ok: false, erreur: "Tâche inconnue." }, { status: 400 });
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? String(b.date) : new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.from("compta_temps").insert({
      societe_id: b.societe_id, tenant_id: session.tenantId || null, collaborateur: session.email, date, minutes, tache,
      facturable: b.facturable !== false, commentaire: texte(b.commentaire, 500),
    }).select("id").maybeSingle();
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data ? data.id : null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, erreur: "Identifiant manquant." }, { status: 400 });
    // On n efface que SES lignes.
    const { error } = await supabase.from("compta_temps").delete().eq("id", id).eq("collaborateur", session.email);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
