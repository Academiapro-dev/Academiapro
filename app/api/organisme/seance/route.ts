import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
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

function tenantDe(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    return new URL(req.url).searchParams.get("tenant");
  }
  return null;
}

// Le stagiaire ne cree rien, il ne fait que rejoindre. Seul un membre de
// l organisme organise une seance.
function estMembre(session: any): boolean {
  if (ADMINS.indexOf(session.email) >= 0) return true;
  return !!session.tenantId && session.role !== "stagiaire";
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

    const { data: seances, error } = await supabase
      .from("organisme_seances")
      .select("*")
      .eq("tenant_id", tenant)
      .order("debut", { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: presences } = await supabase
      .from("organisme_presences")
      .select("seance_id, participant_email, minutes_presence")
      .eq("tenant_id", tenant)
      .limit(5000);

    const compte: any = {};
    const minutes: any = {};
    for (const p of presences || []) {
      compte[p.seance_id] = (compte[p.seance_id] || 0) + 1;
      minutes[p.seance_id] = (minutes[p.seance_id] || 0) + (Number(p.minutes_presence) || 0);
    }

    const maintenant = Date.now();

    const liste = (seances || []).map(function (s: any) {
      const debut = new Date(s.debut).getTime();
      const fin = debut + (Number(s.duree_minutes) || 90) * 60000;
      return {
        ...s,
        participants: compte[s.id] || 0,
        minutes_cumulees: minutes[s.id] || 0,
        // Une salle n est ouverte qu un quart d heure avant et jusqu a la fin :
        // on n entre pas dans une classe trois jours a l avance.
        ouverte: maintenant >= debut - 15 * 60000 && maintenant <= fin + 15 * 60000,
        passee: maintenant > fin,
      };
    });

    return NextResponse.json({
      ok: true,
      membre: estMembre(session),
      total: liste.length,
      a_venir: liste.filter(function (s: any) { return !s.passee; }).length,
      seances: liste,
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

    if (!estMembre(session)) {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut programmer une seance." },
        { status: 403 }
      );
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json({ ok: false, erreur: "Organisme non precise." }, { status: 400 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const titre = String(b.titre || "").trim();
    if (titre.length < 3) {
      return NextResponse.json({ ok: false, erreur: "Donnez un titre a la seance." }, { status: 400 });
    }

    if (!b.debut) {
      return NextResponse.json({ ok: false, erreur: "Indiquez la date et l heure." }, { status: 400 });
    }

    const debut = new Date(b.debut);
    if (isNaN(debut.getTime())) {
      return NextResponse.json({ ok: false, erreur: "Date invalide." }, { status: 400 });
    }

    const duree = b.duree_minutes ? Number(b.duree_minutes) : 90;
    if (isNaN(duree) || duree < 15 || duree > 600) {
      return NextResponse.json({ ok: false, erreur: "Duree invalide." }, { status: 400 });
    }

    const code = b.formation_code ? String(b.formation_code).trim().toUpperCase() : null;

    // NOM DE SALLE. Toujours "academia-" suivi de caracteres imprevisibles :
    // c est ce nom que le formateur rejoint, et un inconnu ne peut pas le
    // deviner. La formation est portee par la seance, pas par le nom.
    const salle = "academia-" + crypto.randomBytes(9).toString("hex");

    const { data, error } = await supabase
      .from("organisme_seances")
      .insert({
        tenant_id: tenant,
        formation_code: code,
        titre: titre,
        description: b.description ? String(b.description).trim() : null,
        debut: debut.toISOString(),
        duree_minutes: duree,
        salle: salle,
        formateur: b.formateur ? String(b.formateur).trim() : null,
        statut: "prevue",
      })
      .select("id, titre, debut, salle")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, seance: (data || [])[0] || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// POINTAGE. C est lui qui constitue la preuve d assiduite : entree, sortie,
// et duree reelle de presence.
export async function PATCH(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.seance_id) {
      return NextResponse.json({ ok: false, erreur: "Seance non precisee." }, { status: 400 });
    }

    const { data: seance } = await supabase
      .from("organisme_seances")
      .select("id, tenant_id, debut, duree_minutes, salle, statut")
      .eq("id", b.seance_id)
      .maybeSingle();

    if (!seance) {
      return NextResponse.json({ ok: false, erreur: "Seance introuvable." }, { status: 404 });
    }

    const autorise =
      session.tenantId === seance.tenant_id || ADMINS.indexOf(session.email) >= 0;

    if (!autorise) {
      return NextResponse.json(
        { ok: false, erreur: "Cette seance ne concerne pas votre organisme." },
        { status: 403 }
      );
    }

    const action = String(b.action || "entrer").trim().toLowerCase();

    if (action === "entrer") {
      const debut = new Date(seance.debut).getTime();
      const fin = debut + (Number(seance.duree_minutes) || 90) * 60000;
      const maintenant = Date.now();

      if (maintenant < debut - 15 * 60000) {
        return NextResponse.json(
          { ok: false, erreur: "La salle ouvre un quart d heure avant le debut." },
          { status: 400 }
        );
      }
      if (maintenant > fin + 15 * 60000) {
        return NextResponse.json({ ok: false, erreur: "Cette seance est terminee." }, { status: 400 });
      }

      // Une entree deja ouverte n est pas dupliquee : on rejoint la meme.
      const { data: ouverte } = await supabase
        .from("organisme_presences")
        .select("id")
        .eq("seance_id", seance.id)
        .eq("participant_email", session.email)
        .is("sorti_le", null)
        .maybeSingle();

      if (!ouverte) {
        await supabase.from("organisme_presences").insert({
          tenant_id: seance.tenant_id,
          seance_id: seance.id,
          participant_email: session.email,
          participant_nom: b.nom ? String(b.nom).trim() : null,
        });
      }

      if (seance.statut === "prevue") {
        await supabase
          .from("organisme_seances")
          .update({ statut: "en_cours" })
          .eq("id", seance.id);
      }

      return NextResponse.json({ ok: true, salle: seance.salle });
    }

    if (action === "sortir") {
      const { data: ouverte } = await supabase
        .from("organisme_presences")
        .select("id, entre_le")
        .eq("seance_id", seance.id)
        .eq("participant_email", session.email)
        .is("sorti_le", null)
        .maybeSingle();

      if (ouverte) {
        const minutes = Math.max(
          0,
          Math.round((Date.now() - new Date(ouverte.entre_le).getTime()) / 60000)
        );
        await supabase
          .from("organisme_presences")
          .update({ sorti_le: new Date().toISOString(), minutes_presence: minutes })
          .eq("id", ouverte.id);
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "clore") {
      if (!estMembre(session)) {
        return NextResponse.json(
          { ok: false, erreur: "Seul votre organisme peut clore une seance." },
          { status: 403 }
        );
      }
      await supabase
        .from("organisme_seances")
        .update({ statut: "terminee" })
        .eq("id", seance.id)
        .eq("tenant_id", seance.tenant_id);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
