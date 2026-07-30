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

const LIBELLE_TYPE: any = {
  convention: "convention de formation",
  devis: "devis",
  convocation: "convocation",
  programme: "programme de formation",
  attestation: "attestation de fin de formation",
  emargement: "attestation d assiduite",
  livret: "livret d accueil",
};

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

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    let tenant = session.tenantId;
    if (!tenant && ADMINS.indexOf(session.email) >= 0) {
      tenant = new URL(req.url).searchParams.get("tenant");
    }
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
    const reference = b ? String(b.document_reference || "").trim() : "";
    if (!reference) {
      return NextResponse.json({ ok: false, erreur: "Document non precise." }, { status: 400 });
    }

    const { data: doc } = await supabase
      .from("organisme_documents")
      .select("type, reference, stagiaire_email, tenant_id")
      .eq("reference", reference)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!doc) {
      return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
    }

    const destinataire = String(b.email || doc.stagiaire_email || "").trim().toLowerCase();
    if (!destinataire || destinataire.indexOf("@") < 1) {
      return NextResponse.json({ ok: false, erreur: "Destinataire inconnu." }, { status: 400 });
    }

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("raison_sociale")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const nomOrganisme = (org && org.raison_sociale) || "votre organisme de formation";

    // Le lien magique connecte le signataire : c est lui qui etablit son
    // identite, et c est cette identite qui donne sa valeur a la signature.
    const jeton = crypto.randomBytes(32).toString("base64url");
    const expire = new Date(Date.now() + JOURS_VALIDITE * 24 * 60 * 60 * 1000).toISOString();

    const { error: erreurLien } = await supabase.from("liens_magiques").insert({
      jeton: jeton,
      email: destinataire,
      expire_le: expire,
      utilise: false,
    });

    if (erreurLien) {
      return NextResponse.json({ ok: false, erreur: erreurLien.message }, { status: 500 });
    }

    const retour = encodeURIComponent("/signature/" + reference);
    const lien = SITE + "/api/auth/valider?jeton=" + jeton + "&retour=" + retour;
    const libelle = LIBELLE_TYPE[doc.type] || "document";

    const html =
      '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.7">' +
      '<p style="color:#0a3d2e;font-size:13px;letter-spacing:2px;margin:0 0 6px">DOCUMENT A SIGNER</p>' +
      '<h1 style="color:#0a3d2e;font-size:23px;margin:0 0 18px">Bonjour,</h1>' +
      "<p>" + nomOrganisme + " vous invite a signer electroniquement votre " + libelle +
      " (reference " + reference + ").</p>" +
      "<p>Le lien ci-dessous vous connecte directement, sans mot de passe. Vous pourrez relire " +
      "le document, puis apposer votre signature.</p>" +
      '<p style="margin:28px 0"><a href="' + lien +
      '" style="background:#0a3d2e;color:#ffffff;padding:14px 28px;border-radius:6px;' +
      'text-decoration:none;font-size:16px;display:inline-block">Relire et signer</a></p>' +
      '<p style="font-size:14px;color:#666">Ce lien est valable ' + JOURS_VALIDITE +
      " jours et ne fonctionne qu une seule fois. Au moment de votre signature, le document " +
      "est archive tel quel et son empreinte numerique conservee.</p>" +
      '<p style="font-size:12px;color:#999;margin-top:22px">Signature electronique simple au ' +
      "sens du reglement europeen eIDAS.</p>" +
      "</div>";

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "AcadeMIA Pro <contact@academiapro.fr>",
        to: [destinataire],
        subject: "Votre " + libelle + " a signer (" + reference + ")",
        html: html,
      }),
    });

    if (!r.ok) {
      let detail = "code " + r.status;
      try {
        const err = await r.json();
        detail = err.message || detail;
      } catch (e) {}
      return NextResponse.json({ ok: false, erreur: "Envoi impossible : " + detail }, { status: 500 });
    }

    return NextResponse.json({ ok: true, destinataire: destinataire, reference: reference });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
