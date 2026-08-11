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

// LE DOMAINE D EXPEDITION.
//
// academiapro.fr disait au stagiaire d un client en marque blanche le nom de
// son fournisseur — et lui donnait de quoi visiter le site pour y trouver le
// catalogue et les prix. espaces-formations.fr est neutre : il ne mene a rien
// et ne designe personne.
//
// LE DOMAINE CHAUFFE. Quelques envois par jour, en montant progressivement :
// un domaine neuf qui expedie d un coup part en indesirables.
const DOMAINE_ENVOI = "espaces-formations.fr";
const EXPEDITEUR_DEFAUT = "contact@academiapro.fr";

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

// Accents retires, tout ce qui n est pas lettre ou chiffre devient un tiret.
function normaliser(texte: string): string {
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// UNE ADRESSE PROPRE A CHAQUE ORGANISME.
//
// Le slug vient en premier : il est normalise et unique en base. Mais peu
// d organismes en ont un, et sans second recours ils partageaient TOUS la
// meme adresse — deux clients differents ecrivant depuis « formation@ », ce
// qui brouille la separation entre organismes et affaiblit la reputation du
// domaine. La raison sociale prend donc le relais.
function adresseEnvoi(slug: string | null, raisonSociale: string | null): string {
  if (DOMAINE_ENVOI === "academiapro.fr") return EXPEDITEUR_DEFAUT;

  const parSlug = normaliser(slug || "");
  if (parSlug) return parSlug + "@" + DOMAINE_ENVOI;

  const parNom = normaliser(raisonSociale || "");
  if (parNom) return parNom + "@" + DOMAINE_ENVOI;

  return "formation@" + DOMAINE_ENVOI;
}

// Le nom affiche est celui de l organisme : c est lui que le stagiaire a paye.
function expediteur(nomOrganisme: string, slug: string | null): string {
  const propre = String(nomOrganisme || "")
    .replace(/["<>]/g, "")
    .trim()
    .slice(0, 60);
  return (propre || "Votre organisme de formation")
    + " <" + adresseEnvoi(slug, nomOrganisme) + ">";
}

async function envoyerEmail(
  destinataire: string,
  sujet: string,
  html: string,
  de: string,
  repondreA: string | null
) {
  const cle = process.env.RESEND_API_KEY || "";
  if (!cle) return { ok: false, erreur: "RESEND_API_KEY absente" };

  const corps: any = {
    from: de,
    to: [destinataire],
    subject: sujet,
    html: html,
  };

  // LE STAGIAIRE REPONDRA. Sans cette ligne, sa reponse part vers une adresse
  // qui ne recoit rien, et personne ne le sait — ni lui, ni son organisme.
  if (repondreA) corps.reply_to = repondreA;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + cle,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corps),
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

    // Nom, slug et adresse de contact de l organisme : le premier pour que le
    // stagiaire reconnaisse l expediteur, le deuxieme pour fabriquer l adresse
    // d envoi, le troisieme pour qu une reponse arrive quelque part.
    const { data: fiche } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, slug, email_contact")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const nomOrganisme = (fiche && fiche.raison_sociale) || "votre organisme de formation";
    const de = expediteur(fiche && fiche.raison_sociale ? fiche.raison_sociale : "", fiche ? fiche.slug : null);
    const repondreA = fiche && fiche.email_contact ? String(fiche.email_contact).trim() : null;

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
        de,
        repondreA
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
