import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Campagne de prospection vers les organismes de formation.
//
// LE MARQUAGE PRECEDE TOUT. Chaque ligne passe a 'envoi_en_cours' AVANT
// l appel a Resend : si la route est relancee ou coupee, cette ligne ne
// sera jamais reprise. Un doublon d envoi grille un prospect et abime la
// reputation du domaine — c est la seule faute qui ne se rattrape pas.
//
// PROSPECTION B2B : licite sans consentement prealable si l offre concerne
// l activite professionnelle du destinataire, a condition qu un moyen de
// s opposer figure dans chaque message.
//
// PAS D IMAGE DANS CE MESSAGE — decision du 24/08. Un premier contact a
// froid reste sobre : le rapport texte/image est un des signaux que pesent
// les filtres, et la signature decoree est reservee a la deuxieme touche.

export const maxDuration = 300;

const EXPEDITEUR = "Jacques Lalou <jacques@contact-pro.academiapro.fr>";
const REPONSE = "contact@academiapro.fr";
const SITE = "https://academiapro.fr";

// LE LOT PAR DEFAUT COMMANDE LE CRON.
//
// Vercel appelle une adresse fixe : un cron ne peut pas porter de
// parametre. C est donc CETTE VALEUR qui decide du nombre d envois
// quotidiens, et c est ici qu on la monte quand la chauffe le permet.
//
// Elle etait a 50 : un cron aurait vide la reserve entiere en une fois,
// sur un domaine qui n avait jamais envoye avant le 13 aout. Un passage de
// deux a cinquante messages est le signal exact d un domaine compromis, et
// une reputation abimee ne se repare pas.
//
// PALIERS : 5 par jour, puis 10, 20, 50. Modifier ce chiffre suffit.
//
// 🚨 PASSAGE A 10 LE 25/08, ET LA MESURE QUI L AUTORISE.
// Le domaine contact-pro.academiapro.fr envoie depuis le 13 aout. Au
// 25/08 : 42 messages partis, AUCUN echec, AUCUN rejet, aucune ligne
// bloquee en envoi_en_cours. Douze jours d envoi continu sans incident.
//
// LA REGLE, ET ELLE NE SE CONTOURNE PAS : la chauffe se mesure en JOURS
// D ENVOI, pas en volume cumule. On ne saute jamais un palier — 5 puis 10
// puis 20 puis 50 — et on ne monte que si les echecs sont restes a zero.
// PALIER SUIVANT : 20, vers le 10/09, et seulement apres la meme mesure.
const LOT_PAR_DEFAUT = 10;

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

function jetonDesinscription(email: string): string {
  const secret = process.env.SESSION_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret)
    .update(email.toLowerCase()).digest("hex").slice(0, 32);
}

function corpsMessage(o: any, nbFormations: number) {
  const jeton = jetonDesinscription(String(o.email).toLowerCase());
  const lien = SITE + "/desinscription?email="
    + encodeURIComponent(String(o.email).toLowerCase())
    + "&jeton=" + jeton;

  const salutation = o.dirigeant_nom
    ? "Bonjour " + String(o.dirigeant_nom).trim() + ","
    : "Bonjour,";

  // LE CORPS S ARRETE AVANT LA SIGNATURE : celle-ci est construite en HTML
  // plus bas, pour que l adresse du site soit cliquable. Un prospect ne
  // recopie pas une adresse a la main.
  const texte =
    salutation + "\n\n"
    + "Je m'appelle Jacques Lalou, je dirige AcadéMIA Pro.\n\n"
    + "Vous êtes certifié Qualiopi. Vous savez donc que le bilan "
    + "pédagogique et financier n'est pas une formalité de fin d'année : "
    + "c'est le moment où l'on vérifie que tout ce qui a été fait pendant "
    + "douze mois se tient. Et qu'un dossier incomplet peut coûter la "
    + "certification.\n\n"
    + "Notre plateforme produit ces éléments au fil de l'eau. Le registre, "
    + "les présences, les évaluations, le suivi des stagiaires s'alimentent "
    + "à mesure que vos sessions se déroulent. Au moment du bilan, les "
    + "données sont là — vous vérifiez et vous signez.\n\n"
    + "Elle donne aussi accès à un catalogue de " + nbFormations
    + " formations que vous pouvez proposer sous votre propre nom, en "
    + "marque blanche.\n\n"
    + "Si le sujet vous parle, répondez-moi simplement : je vous montre en "
    + "quinze minutes ce que ça donne sur un dossier réel.";

  const signature =
    "<br/><br/>"
    + "<p style=\"margin:0;line-height:1.5\">"
    + "Jacques Lalou<br/>"
    + "Fondateur — AcadéMIA Pro<br/>"
    + "<a href=\"" + SITE + "\" style=\"color:#8a6d3b\">academiapro.fr</a>"
    + "</p>";

  const html = texte.replace(/\n/g, "<br/>")
    + signature
    + "<br/><hr/>"
    + "<p style=\"font-size:12px;color:#888\">"
    + "Ce message vous est adressé dans le cadre de votre activité "
    + "professionnelle d'organisme de formation. "
    + "<a href=\"" + lien + "\">Ne plus recevoir de messages</a>."
    + "</p>";

  return html;
}

async function envoyer(destinataire: string, sujet: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + (process.env.RESEND_API_KEY || ""),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EXPEDITEUR,
      reply_to: REPONSE,
      to: destinataire,
      subject: sujet,
      html: html,
    }),
  });

  const texte = await r.text();
  let data: any = null;
  try { data = texte ? JSON.parse(texte) : null; } catch { data = { brut: texte }; }

  return { ok: r.ok, statut: r.status, reponse: data };
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { erreur: "RESEND_API_KEY absente" }, { status: 500 });
  }

  const supabase = clientAdmin();

  const demande = Number(req.nextUrl.searchParams.get("lot") || LOT_PAR_DEFAUT);
  const lot = demande > 0 && demande <= 500 ? demande : LOT_PAR_DEFAUT;

  // 🚨 24/08 — LE COMPTAGE ANNONCAIT 580 FORMATIONS AU LIEU DE 560.
  //
  // La table formations contient DEUX familles : les 560 formations du
  // catalogue commercial ET les 20 ateliers, qui forment un domaine a part
  // et ne figurent nulle part au catalogue. Compter toutes les lignes
  // actives annoncait donc 580 a chaque prospect, alors que le site en
  // montre 560 : un destinataire qui verifie voit l ecart.
  //
  // On exclut le domaine « Ateliers ». Le chiffre reste calcule en base et
  // suivra les prochaines vagues de fiches, sans qu on ait a y toucher.
  const { count: nbFormations } = await supabase
    .from("formations")
    .select("code", { count: "exact", head: true })
    .eq("actif", true)
    .neq("domaine", "Ateliers");

  const { data: cibles, error: errLecture } = await supabase
    .from("prospects_organismes")
    .select("id, email, raison_sociale, dirigeant_nom")
    .eq("statut", "enrichi")
    .eq("desabonne", false)
    .not("email", "is", null)
    .order("id", { ascending: true })
    .limit(lot);

  if (errLecture) {
    return NextResponse.json(
      { erreur: errLecture.message }, { status: 500 });
  }

  if (!cibles || cibles.length === 0) {
    return NextResponse.json({ info: "aucun organisme a contacter" });
  }

  let envoyes = 0;
  let echecs = 0;
  const details: any[] = [];

  for (const o of cibles) {
    // MARQUAGE AVANT ENVOI. Si la suite echoue, la ligne porte deja un
    // statut qui l exclut des prochaines lectures : mieux vaut un envoi
    // manque qu un envoi double.
    const { error: errMarque } = await supabase
      .from("prospects_organismes")
      .update({ statut: "envoi_en_cours" })
      .eq("id", o.id)
      .eq("statut", "enrichi");

    if (errMarque) {
      echecs++;
      continue;
    }

    const html = corpsMessage(o, nbFormations || 0);
    const res = await envoyer(
      String(o.email),
      "Votre BPF de l'an prochain se prépare cette année",
      html);

    if (res.ok) {
      envoyes++;
      await supabase
        .from("prospects_organismes")
        .update({
          statut: "envoye",
          envoye_le: new Date().toISOString(),
          motif_echec: null,
        })
        .eq("id", o.id);
    } else {
      echecs++;
      await supabase
        .from("prospects_organismes")
        .update({
          statut: "echec",
          motif_echec: JSON.stringify(res.reponse).slice(0, 500),
        })
        .eq("id", o.id);
      if (details.length < 5) {
        details.push({ email: o.email, statut: res.statut, reponse: res.reponse });
      }
    }

    // Un envoi toutes les deux secondes : le rythme d une personne, pas
    // celui d une machine.
    await pause(2000);
  }

  const { count: restant } = await supabase
    .from("prospects_organismes")
    .select("id", { count: "exact", head: true })
    .eq("statut", "enrichi")
    .eq("desabonne", false)
    .not("email", "is", null);

  return NextResponse.json({
    envoyes: envoyes,
    echecs: echecs,
    formations_annoncees: nbFormations || 0,
    reste_a_contacter: restant || 0,
    premiers_echecs: details,
  });
}
