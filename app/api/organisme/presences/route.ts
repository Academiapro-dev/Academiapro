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

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);
    const seanceId = url.searchParams.get("seance");
    if (!seanceId) {
      return NextResponse.json({ ok: false, erreur: "Seance non precisee." }, { status: 400 });
    }

    const { data: seance } = await supabase
      .from("organisme_seances")
      .select("id, tenant_id, titre, formation_code, debut, duree_minutes, formateur, statut")
      .eq("id", seanceId)
      .maybeSingle();

    if (!seance) {
      return NextResponse.json({ ok: false, erreur: "Seance introuvable." }, { status: 404 });
    }

    const estAdmin = ADMINS.indexOf(session.email) >= 0;
    if (session.tenantId !== seance.tenant_id && !estAdmin) {
      return NextResponse.json(
        { ok: false, erreur: "Cette seance ne concerne pas votre organisme." },
        { status: 403 }
      );
    }

    const { data: presences, error } = await supabase
      .from("organisme_presences")
      .select("participant_email, participant_nom, entre_le, sorti_le, minutes_presence")
      .eq("seance_id", seanceId)
      .order("entre_le", { ascending: true })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Un participant peut entrer et sortir plusieurs fois : on cumule par
    // personne, sinon la feuille compterait la meme presence deux fois.
    const parPersonne: any = {};

    for (const p of presences || []) {
      const cle = p.participant_email;
      if (!parPersonne[cle]) {
        parPersonne[cle] = {
          email: cle,
          nom: p.participant_nom || null,
          premiere_entree: p.entre_le,
          derniere_sortie: p.sorti_le,
          minutes: 0,
          passages: 0,
        };
      }
      parPersonne[cle].passages = parPersonne[cle].passages + 1;
      parPersonne[cle].minutes = parPersonne[cle].minutes + (Number(p.minutes_presence) || 0);
      if (p.nom && !parPersonne[cle].nom) parPersonne[cle].nom = p.participant_nom;
      if (p.sorti_le) parPersonne[cle].derniere_sortie = p.sorti_le;
    }

    const liste = Object.keys(parPersonne).map(function (k) { return parPersonne[k]; });

    const prevu = Number(seance.duree_minutes) || 90;

    const avecTaux = liste.map(function (p: any) {
      return {
        ...p,
        taux: prevu > 0 ? Math.min(100, Math.round((p.minutes / prevu) * 100)) : 0,
      };
    });

    const minutesTotal = avecTaux.reduce(function (s: number, p: any) { return s + p.minutes; }, 0);

    return NextResponse.json({
      ok: true,
      seance: seance,
      duree_prevue: prevu,
      participants: avecTaux.length,
      minutes_cumulees: minutesTotal,
      assidus: avecTaux.filter(function (p: any) { return p.taux >= 75; }).length,
      presences: avecTaux,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
