import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const SITE = "https://academiapro.fr";
const REPOS_JOURS = 7;
const PLAFOND = 200;

// Seuls les prospects VENUS A NOUS peuvent etre relances en nombre : ceux qui
// ont rempli un formulaire, participe a un webinaire, ecrit par le chat ou ete
// recommandes. Une liste importee ou saisie a la main n entre pas la-dedans :
// elle n a pas sollicite l organisme.
const ORIGINES_SOLLICITEES = ["formulaire", "webinaire", "chat", "recommandation"];

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

function filtreTenant(requete: any, tenant: string | null) {
  return tenant ? requete.eq("tenant_id", tenant) : requete.is("tenant_id", null);
}

// Le lien de desinscription doit etre impossible a fabriquer par un tiers :
// on le signe avec le secret du site.
function jetonDesinscription(email: string): string {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex").slice(0, 32);
}

function echapper(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function relancables(tenant: string | null, seulement: string | null) {
  let requete = filtreTenant(
    supabase.from("crm").select("id, email, nom, formation_interesse, source, statut, score, relance_le, relances, desinscrit"),
    tenant
  );

  const { data } = await requete.limit(2000);

  const repos = Date.now() - REPOS_JOURS * 24 * 60 * 60 * 1000;
  const liste: any[] = [];

  for (const p of data || []) {
    if (!p.email || p.email.indexOf("@") < 1) continue;

    // Un prospect qui s est desinscrit ne recoit plus rien, jamais.
    if (p.desinscrit === true) continue;

    // Un client n est plus un prospect : il a son propre suivi.
    if (p.statut === "client") continue;

    // Un prospect perdu a dit non : on ne le poursuit pas.
    if (p.statut === "perdu") continue;

    if (seulement) {
      if (p.email.toLowerCase() !== seulement.toLowerCase()) continue;
    } else {
      // En nombre, on se limite a ceux qui sont venus d eux-memes.
      if (ORIGINES_SOLLICITEES.indexOf(String(p.source || "").toLowerCase()) < 0) continue;
    }

    // Deja relance il y a moins d une semaine : on ne harcele pas.
    if (p.relance_le && new Date(p.relance_le).getTime() > repos) continue;

    liste.push(p);
  }

  liste.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
  return liste.slice(0, PLAFOND);
}

// APERCU. On ne relance jamais sans avoir vu qui va recevoir le message.
export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    const liste = await relancables(tenant, null);

    return NextResponse.json({
      ok: true,
      nombre: liste.length,
      plafond: PLAFOND,
      repos_jours: REPOS_JOURS,
      candidats: liste.map(function (p: any) {
        return {
          email: p.email,
          nom: p.nom,
          score: p.score,
          source: p.source,
          formation: p.formation_interesse,
          relances: p.relances || 0,
        };
      }),
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

    const cle = process.env.RESEND_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "RESEND_API_KEY absente" }, { status: 500 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const unSeul = b.email ? String(b.email).trim().toLowerCase() : null;
    const texte = b.texte ? String(b.texte).trim() : "";

    // Envoi d un texte relu : c est le cas d une relance rédigée puis validee.
    if (unSeul && !texte) {
      return NextResponse.json(
        { ok: false, erreur: "Redigez la relance avant de l envoyer." },
        { status: 400 }
      );
    }

    const liste = await relancables(tenant, unSeul);

    if (liste.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur: unSeul
            ? "Ce prospect ne peut pas etre relance : desinscrit, deja client, ou relance il y a moins de " + REPOS_JOURS + " jours."
            : "Personne a relancer pour le moment.",
        },
        { status: 404 }
      );
    }

    const { data: org } = await filtreTenant(
      supabase.from("organismes_formation").select("raison_sociale, email_contact"),
      tenant
    ).maybeSingle();

    const nomOrganisme = (org && org.raison_sociale) || "Votre organisme de formation";
    const emailOrganisme = (org && org.email_contact) || "";

    const envoyes: string[] = [];
    const echecs: any[] = [];

    for (const p of liste) {
      const prenom = p.nom ? String(p.nom).split(" ")[0] : "";
      const lien = SITE + "/desinscription?e=" + encodeURIComponent(p.email) +
        "&j=" + jetonDesinscription(p.email);

      // Un texte fourni est celui que l organisme a relu. Sinon, un message
      // sobre et honnete : ni rarete inventee, ni promesse.
      const corps = texte
        ? '<div style="white-space:pre-wrap">' + echapper(texte) + "</div>"
        : "<p>Vous nous avez contactes au sujet de " +
          (p.formation_interesse ? "la formation " + echapper(p.formation_interesse) : "nos formations") +
          ", et nous n avons pas eu l occasion d en reparler depuis.</p>" +
          "<p>Si votre projet est toujours d actualite, repondez simplement a ce message : " +
          "nous vous rappellerons ce que la formation couvre, sa duree et son tarif, et " +
          "repondrons a vos questions.</p>" +
          "<p>Si ce n est plus le cas, vous pouvez ignorer ce message ou vous desinscrire " +
          "ci-dessous. Nous ne vous ecrirons plus.</p>";

      const html =
        '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.7">' +
        '<p style="color:#0a3d2e;font-size:13px;letter-spacing:2px;margin:0 0 6px">' +
        echapper(nomOrganisme.toUpperCase()) + "</p>" +
        '<h1 style="color:#0a3d2e;font-size:23px;margin:0 0 18px">Bonjour' +
        (prenom ? " " + echapper(prenom) : "") + ",</h1>" +
        corps +
        '<p style="margin:28px 0"><a href="' + SITE +
        '" style="background:#0a3d2e;color:#ffffff;padding:14px 28px;border-radius:6px;' +
        'text-decoration:none;font-size:16px;display:inline-block">Voir les formations</a></p>' +
        '<hr style="border:none;border-top:1px solid #e5e5e5;margin:26px 0">' +
        '<p style="font-size:12px;color:#888;line-height:1.6">' +
        "Vous recevez ce message parce que vous avez contacte " + echapper(nomOrganisme) +
        (emailOrganisme ? " (" + echapper(emailOrganisme) + ")" : "") + ". " +
        '<a href="' + lien + '" style="color:#888">Ne plus recevoir de messages</a>.</p>' +
        "</div>";

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "AcadeMIA Pro <contact@academiapro.fr>",
          to: [p.email],
          reply_to: emailOrganisme || undefined,
          subject: p.formation_interesse
            ? "Votre projet de formation " + p.formation_interesse
            : "Votre projet de formation",
          html: html,
        }),
      });

      if (!r.ok) {
        let detail = "code " + r.status;
        try {
          const err = await r.json();
          detail = err.message || detail;
        } catch (e) {}
        echecs.push({ email: p.email, erreur: detail });
        continue;
      }

      await supabase
        .from("crm")
        .update({
          relance_le: new Date().toISOString(),
          relances: (p.relances || 0) + 1,
          derniere_interaction: new Date().toISOString(),
        })
        .eq("id", p.id);

      envoyes.push(p.email);
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
