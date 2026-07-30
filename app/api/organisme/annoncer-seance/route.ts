import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const SITE = "https://academiapro.fr";

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

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    if (session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut annoncer une seance." },
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

    const cle = process.env.RESEND_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "RESEND_API_KEY absente" }, { status: 500 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.seance_id) {
      return NextResponse.json({ ok: false, erreur: "Seance non precisee." }, { status: 400 });
    }

    const { data: seance } = await supabase
      .from("organisme_seances")
      .select("id, titre, description, debut, duree_minutes, formateur, formation_code, tenant_id")
      .eq("id", b.seance_id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!seance) {
      return NextResponse.json({ ok: false, erreur: "Seance introuvable." }, { status: 404 });
    }

    // On previent les stagiaires de la formation concernee, ou tous si la
    // seance n est rattachee a aucune.
    let requete = supabase
      .from("organisme_apprenants")
      .select("email, nom, formation_code")
      .eq("tenant_id", tenant);

    if (seance.formation_code) {
      requete = requete.eq("formation_code", seance.formation_code);
    }

    const { data: stagiaires } = await requete.limit(500);

    if (!stagiaires || stagiaires.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun stagiaire a prevenir pour cette formation." },
        { status: 404 }
      );
    }

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("raison_sociale")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const nomOrganisme = (org && org.raison_sociale) || "votre organisme de formation";

    const quand = new Date(seance.debut).toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    const envoyes: string[] = [];
    const echecs: any[] = [];

    for (const s of stagiaires) {
      const html =
        '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.7">' +
        '<p style="color:#0a3d2e;font-size:13px;letter-spacing:2px;margin:0 0 6px">CLASSE EN DIRECT</p>' +
        '<h1 style="color:#0a3d2e;font-size:23px;margin:0 0 18px">Bonjour' +
        (s.nom ? " " + s.nom : "") + ",</h1>" +
        "<p>" + nomOrganisme + " vous convie a une seance en direct :</p>" +
        '<p style="background:#f6f4ef;border-left:4px solid #0a3d2e;padding:16px 18px;margin:20px 0">' +
        '<strong style="font-size:17px">' + seance.titre + "</strong><br>" +
        quand + " · " + seance.duree_minutes + " minutes" +
        (seance.formateur ? "<br>Avec " + seance.formateur : "") +
        "</p>" +
        (seance.description ? "<p>" + seance.description + "</p>" : "") +
        "<p>La salle s ouvre un quart d heure avant l heure prevue. Vous la rejoindrez depuis " +
        "votre espace, d un seul clic. Prevoyez un casque : la visio et le tableau blanc " +
        "fonctionnent directement dans votre navigateur.</p>" +
        '<p style="margin:28px 0"><a href="' + SITE + '/stagiaire' +
        '" style="background:#0a3d2e;color:#ffffff;padding:14px 28px;border-radius:6px;' +
        'text-decoration:none;font-size:16px;display:inline-block">Ouvrir mon espace</a></p>' +
        '<p style="font-size:14px;color:#666">Votre presence sera enregistree automatiquement, ' +
        "a votre entree et a votre sortie.</p>" +
        "</div>";

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "AcadeMIA Pro <contact@academiapro.fr>",
          to: [s.email],
          subject: "Classe en direct : " + seance.titre + " — " + quand,
          html: html,
        }),
      });

      if (!r.ok) {
        let detail = "code " + r.status;
        try {
          const err = await r.json();
          detail = err.message || detail;
        } catch (e) {}
        echecs.push({ email: s.email, erreur: detail });
        continue;
      }

      envoyes.push(s.email);
    }

    return NextResponse.json({
      ok: envoyes.length > 0,
      envoyes: envoyes.length,
      echecs: echecs,
      erreur: envoyes.length === 0 ? "Aucun envoi n a abouti." : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
