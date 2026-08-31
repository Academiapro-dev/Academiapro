import { mesurer } from "../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";
import { limiter, ipDe } from "../../../lib/limiteur";

export const runtime = "nodejs";

// 🚨 LIMITE DE DEBIT — 31/08. C ETAIT LA PORTE LA PLUS COUTEUSE DU SITE.
//
// LE DEFAUT, ET IL SE PAYAIT EN ARGENT REEL. Cette route est PUBLIQUE, et
// chaque appel declenche DEUX depenses : une generation de manuel complet
// par l IA (4000 jetons factures chez Anthropic) et un envoi de courriel
// (quota Resend). Aucun compteur ne les limitait.
//
// CE QU UN SCRIPT POUVAIT FAIRE EN QUELQUES MINUTES : mille appels avec
// mille adresses inventees, donc mille manuels factures, mille courriels
// partis, mille lignes dans liste_attente. Sans rien pirater.
//
// POURQUOI LE GARDE-FOU D ORIGINE NE SUFFISAIT PAS. Le controle ci-dessous
// lit les en-tetes origin et referer. Ces en-tetes sont ENVOYES PAR
// L APPELANT : n importe qui les fabrique en une ligne. Ils ecartent le
// robot le plus paresseux, rien de plus. Ils sont conserves — ils ne
// coutent rien — mais ILS NE SONT PAS LA SECURITE.
//
// LES SEUILS SONT VOLONTAIREMENT BAS. Une personne reelle s inscrit une
// fois. Trois inscriptions par heure depuis une meme adresse IP couvrent
// le partage de connexion d une entreprise ou d un lieu public ; au-dela,
// c est une machine.
const MAX_PAR_IP = 3;
const FENETRE_IP_MS = 60 * 60 * 1000;
const MAX_PAR_EMAIL = 2;
const FENETRE_EMAIL_MS = 24 * 60 * 60 * 1000;

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function generateManuel(formation: string, nom: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: "Tu es un expert pédagogique pour AcadémiA Pro. Génère un manuel complet pour la formation : " + formation + " pour l'apprenant : " + nom
      }]
    }),
  });
  const data = await response.json();
  mesurer("inscription", data);
  return data.content[0].text;
}

async function sendEmailFelicitations(email: string, nom: string, formation: string, contenuManuel: string): Promise<void> {
  const prenom = nom ? nom.split(" ")[0] : "cher apprenant";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "AcadémiA Pro <contact@academiapro.fr>",
      to: [email],
      subject: "Félicitations " + prenom + ", votre manuel est prêt !",
      html: "<div style='font-family:Georgia,serif;background:#0a0a0a;color:#f5f5f5;padding:40px;'><h1 style='color:#c8a96e;'>Félicitations " + prenom + " !</h1><div style='background:#ffffff;color:#1a1a1a;padding:32px;border-left:3px solid #c8a96e;border-radius:8px;'>" + contenuManuel + "</div><a href='https://academiapro.fr/espace-apprenant' style='display:block;background:#c8a96e;color:#0a0a0a;text-align:center;padding:15px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px;'>Accéder à mon Espace Apprenant</a><p style='color:#888;margin-top:20px;'>Jacques, fondateur<br/>Fondateur AcadémiA Pro</p></div>",
    }),
  });
}

export async function POST(req: NextRequest) {
  // PREMIER FILTRE : LE DEBIT PAR ADRESSE IP.
  //
  // Il vient AVANT tout le reste — avant meme la lecture du corps de la
  // requete. Un appel refuse ici ne consomme ni IA, ni courriel, ni base.
  if (!limiter(ipDe(req), "inscription_ip", MAX_PAR_IP, FENETRE_IP_MS)) {
    return NextResponse.json(
      { success: false, message: "Trop d'inscriptions depuis cet accès. Réessayez dans une heure." },
      { status: 429 }
    );
  }

  // Garde-fou : n accepter que les appels du site.
  //
  // ⚠️ CE CONTROLE NE PROTEGE DE RIEN A LUI SEUL — voir la note en tete de
  // fichier. Il est garde parce qu il ecarte les robots les plus simples
  // sans rien couter, mais c est le limiteur qui fait le travail.
  const origineApp = req.headers.get("origin") || "";
  const referentApp = req.headers.get("referer") || "";
  const appelLegitime =
    origineApp.includes("academiapro.fr")
    || referentApp.includes("academiapro.fr")
    || origineApp.includes("vercel.app")
    || referentApp.includes("vercel.app")
    || origineApp.includes("localhost")
    || referentApp.includes("localhost");
  if (!appelLegitime) {
    return NextResponse.json(
      { error: "Acces refuse" },
      { status: 403 },
    );
  }

  try {
    const { nom, email, interet, source, formation } = await req.json();

    if (!email) return NextResponse.json({ success: false, message: "Email requis" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ success: false, message: "Format email invalide" }, { status: 400 });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });

    // SECOND FILTRE : LE DEBIT PAR ADRESSE COURRIEL.
    //
    // Il complete le premier : sans lui, un attaquant changeant d IP a
    // chaque appel pourrait noyer une meme personne de manuels. Place
    // APRES la validation du format, pour qu une adresse malformee ne
    // consomme pas le quota d une adresse valide.
    const emailNormalise = String(email).toLowerCase().trim();
    if (!limiter(emailNormalise, "inscription_email", MAX_PAR_EMAIL, FENETRE_EMAIL_MS)) {
      return NextResponse.json(
        { success: false, message: "Cette adresse est déjà inscrite. Vérifiez votre boîte de réception." },
        { status: 429 }
      );
    }

    const res = await fetch(
      process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/liste_attente",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ nom, email, interet, source }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      if (err.includes("duplicate")) return NextResponse.json({ success: false, message: "Email déjà inscrit" }, { status: 400 });
      return NextResponse.json({ success: false, message: "Erreur inscription" }, { status: 500 });
    }

    const nomFormation = formation || interet || "Formation AcadémiA Pro";

    Promise.resolve().then(async () => {
      try {
        const contenuManuel = await generateManuel(nomFormation, nom || "");
        await sendEmailFelicitations(email, nom || "", nomFormation, contenuManuel);
        console.log("Manuel généré et envoyé à " + email);
      } catch (err) {
        console.error("Erreur génération manuel:", err);
      }
    });

    return NextResponse.json({ success: true, message: "Inscription confirmée ! Votre manuel arrive dans quelques instants." });

  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
