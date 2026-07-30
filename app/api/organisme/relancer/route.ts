import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ADMINS = ["contact@academiapro.fr"];
const SITE = "https://academiapro.fr";
const JOURS_DEFAUT = 15;
const REPOS_JOURS = 7;

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

// Qui a decroche, et depuis quand. On distingue ceux qui n ont JAMAIS commence
// de ceux qui se sont arretes en route : le message ne peut pas etre le meme.
async function candidats(tenant: string, jours: number) {
  const { data: inscrits } = await supabase
    .from("organisme_apprenants")
    .select("id, email, nom, formation_code, statut, relance_le, relances, created_at")
    .eq("tenant_id", tenant)
    .neq("statut", "retire")
    .limit(2000);

  const { data: modules } = await supabase
    .from("progression_apprenants")
    .select("user_email, updated_at, created_at")
    .eq("tenant_id", tenant)
    .limit(10000);

  const { data: copies } = await supabase
    .from("qcm_reponses")
    .select("email, updated_at")
    .eq("tenant_id", tenant)
    .limit(10000);

  const derniere: any = {};

  function retenir(email: string, quand: any) {
    if (!quand) return;
    const t = new Date(quand).getTime();
    if (!t) return;
    if (!derniere[email] || t > derniere[email]) derniere[email] = t;
  }

  for (const m of modules || []) retenir(m.user_email, m.updated_at || m.created_at);
  for (const c of copies || []) retenir(c.email, c.updated_at);

  const maintenant = Date.now();
  const seuil = maintenant - jours * 24 * 60 * 60 * 1000;
  const repos = maintenant - REPOS_JOURS * 24 * 60 * 60 * 1000;

  const liste: any[] = [];

  for (const a of inscrits || []) {
    // Sans acces envoye, ce n est pas une relance qu il faut mais l invitation.
    if (a.statut === "invite") continue;

    const activite = derniere[a.email] || null;

    if (activite && activite > seuil) continue;

    // Deja relance recemment : on ne harcele pas.
    if (a.relance_le && new Date(a.relance_le).getTime() > repos) continue;

    const reference = activite || new Date(a.created_at).getTime();
    const jamais = !activite;

    liste.push({
      id: a.id,
      email: a.email,
      nom: a.nom,
      formation_code: a.formation_code,
      jamais_commence: jamais,
      jours_inactif: Math.floor((maintenant - reference) / 86400000),
      relances: a.relances || 0,
      derniere_relance: a.relance_le,
    });
  }

  liste.sort(function (x, y) { return y.jours_inactif - x.jours_inactif; });
  return liste;
}

// APERCU. On ne doit jamais ecrire a des stagiaires sans avoir vu la liste.
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

    const brut = new URL(req.url).searchParams.get("jours");
    const jours = brut && /^\d{1,3}$/.test(brut) ? parseInt(brut, 10) : JOURS_DEFAUT;

    const liste = await candidats(tenant, jours);

    return NextResponse.json({
      ok: true,
      jours: jours,
      nombre: liste.length,
      jamais_commence: liste.filter(function (c: any) { return c.jamais_commence; }).length,
      insistants: liste.filter(function (c: any) { return c.relances >= 2; }).length,
      candidats: liste,
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

    if (session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut relancer." },
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
    const jours = b && b.jours ? Number(b.jours) : JOURS_DEFAUT;

    let liste = await candidats(tenant, isNaN(jours) ? JOURS_DEFAUT : jours);

    // Relance d une seule personne, si demandee.
    if (b && b.id) {
      liste = liste.filter(function (c: any) { return c.id === b.id; });
    }

    if (liste.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Personne a relancer pour le moment." },
        { status: 404 }
      );
    }

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, email_contact")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const nomOrganisme = (org && org.raison_sociale) || "votre organisme de formation";

    const envoyes: string[] = [];
    const echecs: any[] = [];

    for (const c of liste) {
      const prenom = c.nom ? String(c.nom).split(" ")[0] : "";

      const corps = c.jamais_commence
        ? "<p>Votre parcours vous attend, et vous n avez pas encore ouvert votre premier module. " +
          "Le plus difficile est de commencer : accordez-vous vingt minutes, et vous verrez que " +
          "la suite vient plus facilement.</p>"
        : "<p>Vous avez commence votre formation il y a quelque temps, puis les journees ont " +
          "sans doute pris le dessus. Votre progression est intacte : vous reprendrez exactement " +
          "la ou vous vous etes arrete.</p>";

      const html =
        '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.7">' +
        '<p style="color:#0a3d2e;font-size:13px;letter-spacing:2px;margin:0 0 6px">VOTRE FORMATION</p>' +
        '<h1 style="color:#0a3d2e;font-size:23px;margin:0 0 18px">Bonjour' +
        (prenom ? " " + prenom : "") + ",</h1>" +
        corps +
        '<p style="margin:28px 0"><a href="' + SITE + '/stagiaire' +
        '" style="background:#0a3d2e;color:#ffffff;padding:14px 28px;border-radius:6px;' +
        'text-decoration:none;font-size:16px;display:inline-block">Reprendre ma formation</a></p>' +
        '<p style="font-size:14px;color:#666">Si vous rencontrez une difficulte, une question ou ' +
        "un empechement, ecrivez a " + nomOrganisme +
        (org && org.email_contact ? " : " + org.email_contact : "") +
        ". Mieux vaut le dire que renoncer.</p>" +
        "</div>";

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "AcadeMIA Pro <contact@academiapro.fr>",
          to: [c.email],
          subject: c.jamais_commence
            ? "Votre formation n a pas encore commence"
            : "Reprendre votre formation la ou vous en etiez",
          html: html,
        }),
      });

      if (!r.ok) {
        let detail = "code " + r.status;
        try {
          const err = await r.json();
          detail = err.message || detail;
        } catch (e) {}
        echecs.push({ email: c.email, erreur: detail });
        continue;
      }

      await supabase
        .from("organisme_apprenants")
        .update({
          relance_le: new Date().toISOString(),
          relances: (c.relances || 0) + 1,
        })
        .eq("id", c.id)
        .eq("tenant_id", tenant);

      envoyes.push(c.email);
    }

    return NextResponse.json({
      ok: envoyes.length > 0,
      envoyes: envoyes.length,
      echecs: echecs,
      erreur: envoyes.length === 0 ? "Aucun envoi n a abouti." : undefined,
      message:
        envoyes.length + " relance(s) envoyee(s)." +
        (echecs.length > 0 ? " " + echecs.length + " echec(s)." : ""),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
