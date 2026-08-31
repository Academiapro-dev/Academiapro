import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";
import { limiter, ipDe } from "../../../../lib/limiteur";

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

// 🚨 LIMITE DE DEBIT — 31/08. SANS ELLE, N IMPORTE QUI POUVAIT APPELER
// CETTE ROUTE EN BOUCLE.
//
// LE DEFAUT, ET IL NE SE VOYAIT PAS : la route envoyait un courriel a
// chaque appel, sans compter. Deux consequences reelles, aucune visible
// depuis le site : la boite de la personne visee noyee sous des centaines
// de liens de connexion, et surtout LE QUOTA RESEND EPUISE — donc plus
// aucun courriel transactionnel qui part, y compris celui d un vrai
// client cabinet qui tente de se connecter au meme moment.
//
// DEUX COMPTEURS, ET LES DEUX SONT NECESSAIRES :
//   - par ADRESSE : empeche de noyer une personne precise, meme si
//     l attaquant change d adresse IP a chaque appel ;
//   - par IP : empeche d arroser des centaines d adresses differentes
//     depuis un seul poste.
//
// ⚠️ LE LIMITEUR VIT EN MEMOIRE : sur Vercel il ne couvre qu une instance
// a la fois. Il arrete le martelement ordinaire, pas une attaque
// distribuee. Le jour ou un vrai volume le justifiera, ce compteur devra
// passer en base ou chez un service dedie.
const MAX_PAR_EMAIL = 3;
const FENETRE_EMAIL_MS = 15 * 60 * 1000;
const MAX_PAR_IP = 10;
const FENETRE_IP_MS = 60 * 60 * 1000;

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
      // 🚨 LE DETAIL RESTE DANS LES JOURNAUX, JAMAIS DANS LA REPONSE — 31/08.
      // Cette route renvoyait au visiteur la LISTE DES NOMS DE VARIABLES
      // d environnement contenant « RESEND ». C est du renseignement offert
      // a qui sonde le site. Le detail se lit maintenant dans les journaux
      // Vercel, la reponse ne dit que l essentiel.
      console.error(
        "[auth/demander] RESEND_API_KEY absente. Variables vues :",
        Object.keys(process.env).filter((k) => k.indexOf("RESEND") >= 0)
      );
      return NextResponse.json(
        { success: false, error: "Envoi indisponible pour le moment" },
        { status: 500 }
      );
    }

    const corps = await req.json().catch(() => ({}));
    const email = String(corps.email || "").toLowerCase().trim();
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 0) {
      return NextResponse.json({ success: false, error: "Adresse email invalide" }, { status: 400 });
    }

    // LES DEUX COMPTEURS, APRES la validation de l adresse : une adresse
    // malformee ne doit pas consommer le quota d une adresse valide.
    if (!limiter(email, "demander_email", MAX_PAR_EMAIL, FENETRE_EMAIL_MS)) {
      return NextResponse.json(
        {
          success: false,
          error: "Trop de demandes pour cette adresse. Vérifiez votre boîte de réception, "
            + "puis réessayez dans un quart d'heure.",
        },
        { status: 429 }
      );
    }

    if (!limiter(ipDe(req), "demander_ip", MAX_PAR_IP, FENETRE_IP_MS)) {
      return NextResponse.json(
        { success: false, error: "Trop de demandes. Réessayez dans une heure." },
        { status: 429 }
      );
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
      console.error("[auth/demander] insertion liens_magiques :", erreurInsert.message);
      return NextResponse.json(
        { success: false, error: "Envoi impossible pour le moment" },
        { status: 500 }
      );
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
      console.error(
        "[auth/demander] Resend :",
        String((envoi as any).error?.message || (envoi as any).error)
      );
      return NextResponse.json(
        { success: false, error: "Envoi impossible pour le moment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[auth/demander] exception :", String(e));
    return NextResponse.json(
      { success: false, error: "Envoi impossible pour le moment" },
      { status: 500 }
    );
  }
}
