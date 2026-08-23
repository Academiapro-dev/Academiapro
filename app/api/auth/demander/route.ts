import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🚨 LE LIEN DE CONNEXION RENVOIE SUR LE DOMAINE D OU IL A ETE DEMANDE — 23/08.
//
// Le domaine d arrivee est lu dans l en-tete host. S il est connu, le lien
// y renvoie et le courriel porte la marque du produit. Sinon —
// previsualisation Vercel, localhost — academiapro.fr, comme avant.
//
// EXPEDITEURS — 23/08 : Mr. Comptable est une marque directe, son
// transactionnel part de contact@mrcomptable.fr (verifie chez Resend).
// espaces-formations.fr reste le domaine neutre de la marque blanche
// AcadeMIA, les sous-domaines contact-pro.* restent a la prospection.
const SITE_PAR_DEFAUT = "https://academiapro.fr";

const MARQUES: Record<string, { site: string; nom: string; expediteur: string; espace: string }> = {
  "academiapro.fr": {
    site: "https://academiapro.fr",
    nom: "AcadéMIA Pro",
    expediteur: "AcadéMIA Pro <contact@academiapro.fr>",
    espace: "votre espace de formation",
  },
  "www.academiapro.fr": {
    site: "https://academiapro.fr",
    nom: "AcadéMIA Pro",
    expediteur: "AcadéMIA Pro <contact@academiapro.fr>",
    espace: "votre espace de formation",
  },
  "mrcomptable.fr": {
    site: "https://mrcomptable.fr",
    nom: "Mr. Comptable",
    expediteur: "Mr. Comptable <contact@mrcomptable.fr>",
    espace: "votre espace de travail",
  },
  "www.mrcomptable.fr": {
    site: "https://mrcomptable.fr",
    nom: "Mr. Comptable",
    expediteur: "Mr. Comptable <contact@mrcomptable.fr>",
    espace: "votre espace de travail",
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function marqueDe(req: Request) {
  const hote = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  return MARQUES[hote] || MARQUES["academiapro.fr"];
}

export async function POST(req: Request) {
  try {
    const cle = process.env.RESEND_API_KEY || "";
    if (!cle) {
      const noms = Object.keys(process.env).filter((k) => k.indexOf("RESEND") >= 0);
      return NextResponse.json(
        { success: false, error: "RESEND_API_KEY absente", variables_resend_vues: noms },
        { status: 500 }
      );
    }

    const corps = await req.json().catch(() => ({}));
    const email = String(corps.email || "").toLowerCase().trim();
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 0) {
      return NextResponse.json({ success: false, error: "Adresse email invalide" }, { status: 400 });
    }

    const marque = marqueDe(req);
    const site = marque.site || SITE_PAR_DEFAUT;

    await supabase
      .from("liens_magiques")
      .update({ utilise: true })
      .eq("email", email)
      .eq("utilise", false);

    const jeton = crypto.randomBytes(32).toString("base64url");
    const expire = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    const { error: erreurInsert } = await supabase
      .from("liens_magiques")
      .insert({ email: email, jeton: jeton, expire_le: expire });

    if (erreurInsert) {
      return NextResponse.json({ success: false, error: erreurInsert.message }, { status: 500 });
    }

    const lien = site + "/api/auth/valider?jeton=" + encodeURIComponent(jeton);

    const resend = new Resend(cle);
    const envoi = await resend.emails.send({
      from: marque.expediteur,
      to: email,
      subject: "Votre lien de connexion " + marque.nom,
      html:
        '<div style="font-family:Georgia,serif;background:#050508;color:#fff;padding:40px 20px">' +
        '<div style="max-width:520px;margin:0 auto;background:rgba(255,255,255,0.03);' +
        'border:1px solid rgba(200,169,110,0.3);border-radius:16px;padding:32px">' +
        '<h1 style="color:#c8a96e;font-size:22px;margin:0 0 18px">Votre connexion à ' + marque.nom + "</h1>" +
        '<p style="color:rgba(255,255,255,0.75);line-height:1.7;margin:0 0 24px">' +
        "Cliquez sur le bouton ci-dessous pour accéder à " + marque.espace + ". " +
        "Ce lien est valable 20 minutes et ne peut servir qu'une seule fois.</p>" +
        '<p style="text-align:center;margin:0 0 24px">' +
        '<a href="' + lien + '" style="display:inline-block;background:#c8a96e;color:#050508;' +
        'padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Me connecter</a></p>' +
        '<p style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.6;margin:0">' +
        "Si vous n'avez pas demandé cette connexion, ignorez simplement ce courriel : " +
        "personne ne peut accéder à votre espace sans ce lien.</p>" +
        "</div></div>",
    });

    if ((envoi as any)?.error) {
      return NextResponse.json(
        { success: false, error: String((envoi as any).error?.message || (envoi as any).error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
