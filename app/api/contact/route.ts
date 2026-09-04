import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════════════════
// LA ROUTE DE CONTACT — RECONSTRUITE LE 04/09.
//
// 🚨🚨 CE QU IL Y AVAIT ICI, ET CE QUE CELA A COUTE.
//
// La route repondait « success: true » ET NE FAISAIT RIEN D AUTRE. Aucun
// courriel, aucun enregistrement. Le formulaire de la page /contact, de son
// cote, n avait meme pas de gestionnaire sur son bouton : les champs
// n etaient relies a rien.
//
// AUTREMENT DIT : TOUT MESSAGE ECRIT DEPUIS LA PAGE DE CONTACT A ETE PERDU,
// sans que le visiteur ni Jacques ne s en apercoivent. C est la seule porte
// d entree d un prospect qui ne veut pas telephoner.
//
// ⚠️ LECON A RETENIR : UNE ROUTE QUI REPOND « success » SANS RIEN FAIRE EST
// PIRE QU UNE ROUTE ABSENTE. Une absence produit une erreur visible ; une
// reponse vide produit un silence que personne ne remarque.
//
// CE QUE FAIT CETTE ROUTE MAINTENANT, DANS CET ORDRE :
//   1. Elle ENREGISTRE le message dans la table `messages_contact`. C est le
//      filet : meme si l envoi du courriel echoue, le message est garde.
//   2. Elle ENVOIE un courriel a l adresse de la marque, via Resend.
//   3. Elle rend `success: true` SI ET SEULEMENT SI l une des deux
//      operations a reussi. Jamais un succes de complaisance.
//
// 🚨 LE PRODUIT D ORIGINE EST TRANSMIS. Un message venu de mrlms.fr ne se
// traite pas comme un message venu d academiapro.fr : le sujet du courriel
// le dit, et l adresse de reponse suit la marque.
//
// ⚠️ LA TABLE `messages_contact` DOIT EXISTER. Le bloc SQL de creation est
// livre avec ce fichier. Si elle manque, l enregistrement echoue en
// silence mais le courriel part quand meme — le message n est pas perdu.
//
// ⚠️ RESEND_API_KEY DOIT ETRE DECLAREE DANS VERCEL. Sans elle, le courriel
// ne part pas, mais l enregistrement en base a lieu : rien n est perdu, et
// la reponse le dit.
// ⚠️ VERCEL AJOUTE DES ESPACES FANTOMES AUX VARIABLES : .trim() partout.
// ══════════════════════════════════════════════════════════════════════════

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// LES MARQUES. Chaque produit a son adresse d envoi verifiee chez Resend et
// son adresse de reception.
//
// ⚠️ L EXPEDITEUR DOIT ETRE UN DOMAINE VERIFIE CHEZ RESEND, sinon l envoi
// est refuse. contact@mrcomptable.fr et contact@mysterllc.com le sont ;
// mrlms.fr et mrcrm.fr NE LE SONT PAS ENCORE, donc leurs messages partent
// de l adresse AcadéMIA — le sujet, lui, porte bien la marque.
const MARQUES: any = {
  academiapro: {
    nom: "AcadéMIA Pro",
    expediteur: "contact@academiapro.fr",
    destinataire: "contact@academiapro.fr",
  },
  mrlms: {
    nom: "Mr LMS",
    expediteur: "contact@academiapro.fr",
    destinataire: "contact@academiapro.fr",
  },
  mrcrm: {
    nom: "Mr CRM",
    expediteur: "contact@academiapro.fr",
    destinataire: "contact@academiapro.fr",
  },
  mrcomptable: {
    nom: "Mr. Comptable",
    expediteur: "contact@mrcomptable.fr",
    destinataire: "contact@mrcomptable.fr",
  },
  mysterllc: {
    nom: "MysterLLC",
    expediteur: "contact@mysterllc.com",
    destinataire: "contact@academiapro.fr",
  },
};

function marqueDe(cle: any) {
  const c = String(cle || "").trim().toLowerCase();
  return MARQUES[c] || MARQUES.academiapro;
}

function propre(v: any, longueur: number) {
  return String(v || "").trim().slice(0, longueur);
}

function estCourriel(v: string) {
  return v.indexOf("@") > 0 && v.indexOf(".") > 0 && v.length >= 6;
}

// Echappement pour le corps HTML du courriel : un message qui contiendrait
// des balises ne doit pas les voir interpretees.
function echapper(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET() {
  return NextResponse.json({ success: true, api: "contact" });
}

export async function POST(req: NextRequest) {
  let corps: any = {};
  try {
    corps = await req.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Requête illisible." },
      { status: 400 }
    );
  }

  const prenom = propre(corps.prenom, 80);
  const nom = propre(corps.nom, 80);
  const email = propre(corps.email, 160);
  const sujet = propre(corps.sujet, 200);
  const message = propre(corps.message, 5000);
  const m = marqueDe(corps.produit);

  // VALIDATION MINIMALE. On ne demande que ce qui permet de repondre : une
  // adresse et un message. Exiger davantage ferait perdre des messages.
  if (!estCourriel(email)) {
    return NextResponse.json(
      { success: false, error: "Merci d'indiquer une adresse de courriel valide." },
      { status: 400 }
    );
  }
  if (message.length < 5) {
    return NextResponse.json(
      { success: false, error: "Merci d'écrire votre message." },
      { status: 400 }
    );
  }

  const nomComplet = (prenom + " " + nom).trim() || "(sans nom)";
  const sujetFinal = sujet || "(sans sujet)";

  let enregistre = false;
  let envoye = false;

  // ---- 1. LE FILET : enregistrer avant d envoyer -------------------------
  try {
    const supabase = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
    );
    const { error } = await supabase.from("messages_contact").insert({
      produit: String(corps.produit || "academiapro").trim().toLowerCase(),
      prenom: prenom,
      nom: nom,
      email: email,
      sujet: sujetFinal,
      message: message,
    });
    if (!error) enregistre = true;
  } catch (e) {
    enregistre = false;
  }

  // ---- 2. LE COURRIEL ----------------------------------------------------
  const cle = (process.env.RESEND_API_KEY || "").trim();
  if (cle) {
    try {
      const html =
        "<p><strong>" + echapper(nomComplet) + "</strong> — " + echapper(email) + "</p>" +
        "<p><strong>Produit :</strong> " + echapper(m.nom) + "</p>" +
        "<p><strong>Sujet :</strong> " + echapper(sujetFinal) + "</p>" +
        "<hr />" +
        "<p style=\"white-space:pre-wrap\">" + echapper(message) + "</p>";

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + cle,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: m.nom + " <" + m.expediteur + ">",
          to: [m.destinataire],
          reply_to: email,
          subject: "[" + m.nom + "] " + sujetFinal,
          html: html,
        }),
      });
      envoye = r.ok;
    } catch (e) {
      envoye = false;
    }
  }

  // ---- 3. LA REPONSE -----------------------------------------------------
  //
  // 🚨 PAS DE SUCCES DE COMPLAISANCE. Si NI l enregistrement NI l envoi n a
  // reussi, le message est perdu : il faut le dire au visiteur pour qu il
  // puisse ecrire directement a l adresse affichee, plutot que d attendre
  // une reponse qui ne viendra jamais.
  if (!enregistre && !envoye) {
    return NextResponse.json(
      {
        success: false,
        error: "Votre message n'a pas pu être transmis. Écrivez-nous directement à "
          + m.destinataire + ".",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, enregistre: enregistre, envoye: envoye });
}
