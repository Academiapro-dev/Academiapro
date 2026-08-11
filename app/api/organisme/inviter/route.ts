import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const SITE = "https://academiapro.fr";
const JOURS_VALIDITE = 30;

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

function organismeDeLaDemande(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    const demande = new URL(req.url).searchParams.get("tenant");
    if (demande) return demande;
  }
  return null;
}

// LE STAGIAIRE A PAYE SON ORGANISME, PAS NOUS.
//
// L invitation partait signee « AcadeMIA Pro », et le corps du message
// nommait la plateforme : le stagiaire d un client en marque blanche
// decouvrait le fournisseur de son prestataire. Le nom affiche est desormais
// celui de l organisme.
//
// L ADRESSE, ELLE, RESTE LA NOTRE. Resend n expedie que depuis un domaine
// verifie : afficher l adresse de l organisme supposerait de faire verifier
// son domaine, un a un. Le nom suffit a ce que le stagiaire reconnaisse son
// interlocuteur ; l adresse ne se lit qu en depliant l en-tete.
function expediteur(nomOrganisme: string): string {
  const propre = String(nomOrganisme || "")
    .replace(/["<>]/g, "")
    .trim()
    .slice(0, 60);
  return (propre || "Votre organisme de formation") + " <contact@academiapro.fr>";
}

async function envoyerEmail(destinataire: string, sujet: string, html: string, de: string) {
  const cle = process.env.RESEND_API_KEY || "";
  if (!cle) return { ok: false, erreur: "RESEND_API_KEY absente" };

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + cle,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: de,
      to: [destinataire],
      subject: sujet,
      html: html,
    }),
  });

  if (!r.ok) {
    let detail = "code " + r.status;
    try {
      const err = await r.json();
      detail = err.message || detail;
    } catch (e) {}
    return { ok: false, erreur: detail };
  }

  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = organismeDeLaDemande(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const corps = await req.json().catch(function () { return null; });
    if (!corps) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    // Soit un stagiaire precis, soit tous ceux qui n ont pas encore ete invites.
    let requete = supabase
      .from("organisme_apprenants")
      .select("id, email, nom, formation_code, statut")
      .eq("tenant_id", tenant);

    if (corps.id) requete = requete.eq("id", String(corps.id));
    else requete = requete.eq("statut", "invite");

    const { data: cibles, error } = await requete.limit(200);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    if (!cibles || cibles.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun stagiaire a inviter." },
        { status: 404 }
      );
    }

    // Nom de l organisme, pour que le stagiaire reconnaisse l expediteur.
    const { data: fiche } = await supabase
      .from("organismes_formation")
      .select("raison_sociale")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const nomOrganisme = (fiche && fiche.raison_sociale) || "votre organisme de formation";
    const de = expediteur(fiche && fiche.raison_sociale ? fiche.raison_sociale : "");

    // Le titre de la formation, pour ne pas ecrire un code a un stagiaire qui
    // ne le connait pas : il a achete « Sophrologie Professionnelle », pas F030.
    const codes = Array.from(new Set(
      (cibles || [])
        .map(function (c: any) { return c.formation_code; })
        .filter(Boolean)
    ));

    const titres: any = {};
    if (codes.length > 0) {
      const { data: fiches } = await supabase
        .from("formations")
        .select("code, titre")
        .in("code", codes)
        .limit(200);
      for (const f of fiches || []) titres[f.code] = f.titre;
    }

    const envoyes: string[] = [];
    const echecs: any[] = [];

    for (const cible of cibles) {
      const jeton = crypto.randomBytes(32).toString("base64url");
      const expire = new Date(Date.now() + JOURS_VALIDITE * 24 * 60 * 60 * 1000).toISOString();

      const { error: erreurLien } = await supabase.from("liens_magiques").insert({
        jeton: jeton,
        email: cible.email,
        expire_le: expire,
        utilise: false,
      });

      if (erreurLien) {
        echecs.push({ email: cible.email, erreur: erreurLien.message });
        continue;
      }

      // Le stagiaire arrive DANS SON ESPACE, ou l attendent ses formations, ses
      // classes en direct et ses documents a signer — et non sur le tableau de
      // bord grand public, qui ne le concerne pas.
      const lien = SITE + "/api/auth/valider?jeton=" + jeton + "&retour=" + encodeURIComponent("/stagiaire");

      const laFormation = cible.formation_code
        ? (titres[cible.formation_code] || cible.formation_code)
        : null;

      const html =
        '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.7">' +
        '<p style="color:#0a3d2e;font-size:13px;letter-spacing:2px;margin:0 0 6px">ACCÈS À VOTRE FORMATION</p>' +
        '<h1 style="color:#0a3d2e;font-size:24px;margin:0 0 18px">Bonjour' +
        (cible.nom ? " " + cible.nom : "") + ",</h1>" +
        "<p>" + nomOrganisme + " vous a inscrit" +
        (laFormation ? " à la formation <strong>" + laFormation + "</strong>" : " à une formation") +
        ".</p>" +
        "<p>Votre espace vous attend : vos modules, vos questionnaires, et un correcteur qui " +
        "note vos réponses et vous explique chacune de vos erreurs.</p>" +
        '<p style="margin:28px 0"><a href="' + lien +
        '" style="background:#0a3d2e;color:#ffffff;padding:14px 28px;border-radius:6px;' +
        'text-decoration:none;font-size:16px;display:inline-block">Accéder à ma formation</a></p>' +
        '<p style="font-size:14px;color:#666">Ce lien vous connecte directement, sans mot de passe. ' +
        "Il est valable " + JOURS_VALIDITE + " jours et ne fonctionne qu'une seule fois. " +
        "Si vous ne l'utilisez pas, demandez-en un nouveau à " + nomOrganisme + ".</p>" +
        '<p style="font-size:13px;color:#999;margin-top:26px">' + nomOrganisme + "</p>" +
        "</div>";

      const envoi = await envoyerEmail(
        cible.email,
        "Votre accès à la formation" + (laFormation ? " " + laFormation : ""),
        html,
        de
      );

      if (!envoi.ok) {
        echecs.push({ email: cible.email, erreur: envoi.erreur });
        continue;
      }

      await supabase
        .from("organisme_apprenants")
        .update({ statut: "invitation_envoyee" })
        .eq("id", cible.id)
        .eq("tenant_id", tenant);

      envoyes.push(cible.email);
    }

    return NextResponse.json({
      ok: envoyes.length > 0,
      envoyes: envoyes.length,
      emails: envoyes,
      echecs: echecs,
      erreur: envoyes.length === 0 ? "Aucun envoi n a abouti." : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
