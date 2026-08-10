import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// LE VRAI RISQUE DE L INDICATEUR 31 N EST PAS DE MAL REPONDRE, C EST D OUBLIER.
// Jacques en a fait l experience : une reclamation deposee deux mois plus tot,
// jamais traitee, retrouvee par hasard. Cette tache relance tant que la
// reponse n est pas partie, avec une insistance croissante.
//
// PALIERS : 2 jours, 7 jours, puis chaque semaine. On ne relance qu une fois
// par palier grace a la colonne `derniere_relance_le`.
const PALIERS = [2, 7, 14, 21, 28, 35, 42, 49, 56];

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

function jours(depuis: any): number {
  return Math.floor((Date.now() - new Date(depuis).getTime()) / 86400000);
}

async function courriel(destinataire: string, sujet: string, html: string) {
  if (!destinataire || !process.env.RESEND_API_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AcadémIA Pro <contact@academiapro.fr>",
        reply_to: "contact@academiapro.fr",
        to: destinataire,
        subject: sujet,
        html: html,
      }),
    });
    return r.ok;
  } catch (e) {
    console.error("relance reclamation:", e);
    return false;
  }
}

function message(r: any, age: number, organisme: string): string {
  // Le ton durcit avec l age : une relance a deux jours rappelle, une relance
  // a deux mois avertit. C est le role de l outil de rendre l oubli inconfortable.
  const grave = age >= 14;

  return (
    '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.75">' +
    '<p style="color:' + (grave ? "#b03a2e" : "#c8a96e") + ';font-size:13px;letter-spacing:2px;margin:0 0 6px">' +
    (grave ? "RÉCLAMATION NON TRAITÉE DEPUIS " + age + " JOURS" : "RAPPEL") + "</p>" +
    '<h1 style="color:#0a3d2e;font-size:21px;margin:0 0 16px">' +
    (grave
      ? "Cette réclamation attend toujours votre réponse"
      : "Une réclamation attend votre réponse") +
    "</h1>" +
    "<p><strong>De :</strong> " + (r.auteur_nom || r.auteur_email) + "<br>" +
    "<strong>Objet :</strong> " + r.objet + "<br>" +
    "<strong>Déposée le :</strong> " + new Date(r.created_at).toLocaleDateString("fr-FR") +
    " — il y a " + age + " jours</p>" +
    '<p style="background:#f5f1e8;padding:14px 16px;border-left:4px solid ' +
    (grave ? "#b03a2e" : "#0a3d2e") + ';margin:20px 0">' +
    String(r.message || "").slice(0, 700) + "</p>" +
    (grave
      ? "<p>Une réclamation restée sans réponse écrite est l'écart le plus fréquemment " +
        "relevé lors d'un audit Qualiopi, au titre de l'indicateur 31. Le réclamant a reçu " +
        "un accusé de réception : il attend une réponse.</p>"
      : "<p>Le réclamant a reçu un accusé de réception. Il vous revient d'arbitrer, " +
        "puis d'écrire votre réponse et l'action corrective.</p>") +
    '<p><a href="https://academiapro.fr/organisme/reclamations" ' +
    'style="color:#0a3d2e;font-weight:bold">Ouvrir le registre des réclamations</a></p>' +
    '<p style="margin-top:26px;color:#555">' + organisme + "</p></div>"
  );
}

export async function GET(req: NextRequest) {
  // Garde-fou : seule la tache planifiee de Vercel, ou l administrateur.
  const secret = req.headers.get("authorization") || "";
  const attendu = "Bearer " + (process.env.CRON_SECRET || "");
  if (process.env.CRON_SECRET && secret !== attendu) {
    return NextResponse.json({ ok: false, erreur: "Acces refuse" }, { status: 401 });
  }

  try {
    // Toutes les reclamations ouvertes, sans reponse ecrite.
    const { data, error } = await supabase
      .from("organisme_reclamations")
      .select("id, tenant_id, auteur_email, auteur_nom, objet, message, statut, reponse, created_at, derniere_relance_le")
      .in("statut", ["ouverte", "en_cours"])
      .is("reponse", null)
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const enAttente = data || [];
    if (enAttente.length === 0) {
      return NextResponse.json({ ok: true, examinees: 0, relancees: 0 });
    }

    // Une seule lecture des organismes concernes.
    const tenants = Array.from(new Set(enAttente.map(function (r: any) { return r.tenant_id; })));
    const { data: organismes } = await supabase
      .from("organismes_formation")
      .select("tenant_id, raison_sociale, email_contact")
      .in("tenant_id", tenants);

    const parTenant: any = {};
    for (const o of organismes || []) parTenant[o.tenant_id] = o;

    let relancees = 0;
    const details: any[] = [];

    for (const r of enAttente) {
      const age = jours(r.created_at);

      // Quel palier est atteint ?
      let palier = 0;
      for (const p of PALIERS) {
        if (age >= p) palier = p;
      }
      if (palier === 0) continue;

      // Deja relance depuis ce palier ? On ne harcele pas.
      if (r.derniere_relance_le && jours(r.derniere_relance_le) < 7) continue;

      const o = parTenant[r.tenant_id];
      const destinataire = (o && o.email_contact) || "";
      if (!destinataire) {
        details.push({ id: r.id, ignoree: "organisme sans adresse de contact" });
        continue;
      }

      const nom = (o && o.raison_sociale) || "AcadémIA Pro";
      const envoye = await courriel(
        destinataire,
        (age >= 14 ? "Rappel urgent — " : "Rappel — ") + "réclamation non traitée : " + r.objet,
        message(r, age, nom)
      );

      if (envoye) {
        await supabase
          .from("organisme_reclamations")
          .update({ derniere_relance_le: new Date().toISOString() })
          .eq("id", r.id);

        relancees = relancees + 1;
        details.push({ id: r.id, age_jours: age, organisme: nom });
      }
    }

    return NextResponse.json({
      ok: true,
      examinees: enAttente.length,
      relancees: relancees,
      details: details,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
