import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// LE GARDE-FOU DU TUNNEL D ACHAT.
//
// POURQUOI CETTE ROUTE EXISTE. Le 16/08 au soir, en essayant d acheter une
// formation pour la premiere fois depuis des jours, Jacques est tombe sur
// « formation introuvable: f005 ». La cause : /api/checkout cherchait le code
// TEL QUEL alors que le catalogue construit ses liens en minuscules et que la
// base porte les codes en MAJUSCULES. AUCUNE VENTE N ETAIT POSSIBLE, sur
// aucune formation, et rien ne l avait signale.
//
// Le defaut venait d un fichier reecrit sans qu on s en apercoive : le site
// se deployait sans erreur, la page s affichait, le bouton existait. Seul un
// achat reel le revelait — et personne n en faisait.
//
// CE QUE FAIT CETTE ROUTE, CHAQUE MATIN : elle appelle /api/checkout
// exactement comme un visiteur le ferait, AVEC LE CODE EN MINUSCULES, et
// verifie qu une redirection vers Lemon Squeezy revient. Elle n achete rien,
// ne paie rien : creer un lien de paiement ne coute pas un centime et
// n engage personne.
//
// SI CA ECHOUE, UN COURRIEL PART IMMEDIATEMENT. C est le seul controle qui
// protege la chaine qui rapporte de l argent.

const FORMATION_TEMOIN = "f005";
const DESTINATAIRE = "contact@academiapro.fr";
const EXPEDITEUR = "AcadeMIA Alerte <contact@academiapro.fr>";

function site(): string {
  const brut = process.env.NEXT_PUBLIC_SITE_URL || "https://academiapro.fr";
  return String(brut).replace(/\/+$/, "");
}

async function alerter(sujet: string, corps: string) {
  if (!process.env.RESEND_API_KEY) return false;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      from: EXPEDITEUR,
      to: [DESTINATAIRE],
      subject: sujet,
      html:
        '<div style="font-family:Georgia,serif;line-height:1.75;font-size:15px">' +
        corps.replace(/\n/g, "<br/>") +
        "</div>",
    }),
  });

  return r.ok;
}

export async function GET(req: NextRequest) {
  const debut = Date.now();

  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret") || "";
    const entete = req.headers.get("authorization") || "";

    const autorise = process.env.CRON_SECRET
      ? (secret === process.env.CRON_SECRET || entete === "Bearer " + process.env.CRON_SECRET)
      : false;

    if (!autorise) {
      return NextResponse.json({ ok: false, erreur: "acces refuse" }, { status: 403 });
    }

    const cible = site() + "/api/checkout?formation=" + FORMATION_TEMOIN;

    // `redirect: manual` est essentiel : on veut CONSTATER la redirection,
    // pas la suivre jusque chez Lemon Squeezy.
    let statut = 0;
    let destination = "";
    let corpsErreur = "";

    try {
      const r = await fetch(cible, { redirect: "manual", cache: "no-store" });
      statut = r.status;
      destination = r.headers.get("location") || "";

      if (statut !== 302 && statut !== 307 && statut !== 308) {
        corpsErreur = (await r.text().catch(function () { return ""; })).slice(0, 500);
      }
    } catch (e: any) {
      corpsErreur = String(e && e.message ? e.message : e);
    }

    const redirige = statut === 302 || statut === 307 || statut === 308;
    const versLemon = destination.indexOf("lemonsqueezy") >= 0;
    const sain = redirige && versLemon;
    const duree = Date.now() - debut;

    if (sain) {
      return NextResponse.json({
        ok: true,
        tunnel: "ouvert",
        formation: FORMATION_TEMOIN,
        statut: statut,
        duree_ms: duree,
      });
    }

    // LE DIAGNOSTIC EST DANS LE COURRIEL, pas seulement dans les journaux :
    // un journal ne se lit que si l on sait deja qu il y a un probleme.
    const quand = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

    const message =
      "<b style=\"color:#b3261e\">LE TUNNEL D'ACHAT NE REPOND PLUS.</b>\n\n" +
      "Personne ne peut acheter de formation sur academiapro.fr en ce moment.\n\n" +
      "Verification du " + quand + "\n" +
      "Adresse appelee : " + cible + "\n" +
      "Code HTTP obtenu : " + (statut || "aucune reponse") + "\n" +
      (destination ? "Redirection vers : " + destination + "\n" : "") +
      (corpsErreur ? "\nReponse :\n" + corpsErreur + "\n" : "") +
      "\n<b>Ce qu'il faut regarder en premier :</b>\n" +
      "1. app/api/checkout/route.ts — le code de formation doit etre mis en " +
      "MAJUSCULES avant la recherche en base. C'est exactement ce qui avait " +
      "casse le 16/08.\n" +
      "2. La variable LEMONSQUEEZY_API_KEY sur Vercel.\n" +
      "3. Que la formation " + FORMATION_TEMOIN.toUpperCase() + " soit toujours " +
      "active dans la table formations.\n\n" +
      "Essayez vous-meme : " + site() + "/formation/" + FORMATION_TEMOIN;

    await alerter("ALERTE - le tunnel d'achat est casse", message);

    return NextResponse.json(
      {
        ok: false,
        tunnel: "casse",
        formation: FORMATION_TEMOIN,
        statut: statut,
        destination: destination,
        detail: corpsErreur,
        alerte_envoyee: true,
        duree_ms: duree,
      },
      { status: 500 }
    );
  } catch (e: any) {
    await alerter(
      "ALERTE - la verification du tunnel d'achat a echoue",
      "La route de controle elle-meme est tombee.\n\nErreur : " + String(e)
    );
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
