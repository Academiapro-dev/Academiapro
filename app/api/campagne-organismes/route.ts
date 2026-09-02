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
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕 LES VAGUES — 27/08.
//
// LE DEFAUT CORRIGE. La route lisait statut = 'enrichi' et le passait a
// 'envoye'. Une ligne contactee sortait donc DEFINITIVEMENT du circuit :
// aucun moyen de la reprendre plus tard, aucun moyen de savoir combien de
// fois elle avait ete sollicitee.
//
// COMMENT CA MARCHE :
//   vague_envoi = 0  jamais contacte
//   vague_envoi = 1  a recu le premier message
//   vague_envoi = 2  a recu le second
//   nb_envois        le compte, qui borne tout
//
// ⚠️ LE PLAFOND EST DE DEUX ENVOIS. Au-dela, on n insiste pas.
//
// ⚠️ LE SECOND MESSAGE DOIT VRAIMENT DIRE AUTRE CHOSE. Le premier parle du
// bilan pedagogique et financier ; le second parle de la demande qu on
// refuse faute de la couvrir — la marque blanche prise par le manque a
// gagner plutot que par la fonctionnalite.
// ═══════════════════════════════════════════════════════════════════════

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

// LE NOMBRE MAXIMUM DE SOLLICITATIONS PAR PROSPECT.
const PLAFOND_ENVOIS = 2;

// LE DELAI MINIMUM ENTRE DEUX VAGUES, EN JOURS.
//
// 🚨 QUATRE-VINGT-DIX JOURS. Revenir trop tot vers quelqu un qui n a pas
// repondu se lit comme de l insistance ; revenir trois mois plus tard se
// lit comme une nouvelle prise de contact.
const DELAI_ENTRE_VAGUES = 90;

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

// 🚨 LA SALUTATION UTILISAIT LE NOM DE FAMILLE — CORRIGE LE 02/09.
//
// CE QUI SE PASSAIT. La fonction lisait `dirigeant_nom`, pas le prenom.
// Virginie Bruno a donc recu « Bonjour BRUNO », et a repondu « STOP —
// merci de supprimer toutes nos coordonnees de vos bases de donnees ».
// Ce n etait pas un cas particulier : TOUT destinataire dont le nom etait
// connu recevait son patronyme en salutation. Rien ne signe un envoi
// automatise mal fait aussi surement.
//
// CE QUI EST FAIT MAINTENANT, dans cet ordre :
//   1. Le PRENOM s il existe — « Bonjour Virginie, ». C est la bonne
//      formule, et la seule qui vaille sur un premier courriel.
//   2. « Bonjour, » sinon. Neutre, jamais faux, parfaitement acceptable
//      en ouverture professionnelle.
//
// ⚠️ ON N ECRIT PLUS JAMAIS LE NOM DE FAMILLE SEUL. « Bonjour Bruno »
// fait passer un nom pour un prenom ; « Monsieur Bruno » suppose un genre
// que la base ne connait pas — et se tromper de civilite est pire que de
// n en mettre aucune.
//
// ⚠️ 3 145 FICHES DE prospects_organismes N ONT NI PRENOM NI NOM :
// elles partent donc avec « Bonjour, ». C est voulu.
function salutationDe(o: any): string {
  const prenom = String(o.dirigeant_prenom || "").trim();

  // Un prenom d une seule lettre est une initiale, pas un prenom :
  // « Bonjour V, » serait pire que « Bonjour, ».
  if (prenom.length >= 2) {
    const propre = prenom.charAt(0).toUpperCase()
      + prenom.slice(1).toLowerCase();
    return "Bonjour " + propre + ",";
  }

  return "Bonjour,";
}

// Le pied de page, identique aux deux vagues : signature et desinscription.
function habillage(o: any, texte: string): string {
  const jeton = jetonDesinscription(String(o.email).toLowerCase());
  const lien = SITE + "/desinscription?email="
    + encodeURIComponent(String(o.email).toLowerCase())
    + "&jeton=" + jeton;

  const signature =
    "<br/><br/>"
    + "<p style=\"margin:0;line-height:1.5\">"
    + "Jacques Lalou<br/>"
    + "Fondateur — AcadéMIA Pro<br/>"
    + "<a href=\"" + SITE + "\" style=\"color:#8a6d3b\">academiapro.fr</a>"
    + "</p>";

  return texte.replace(/\n/g, "<br/>")
    + signature
    + "<br/><hr/>"
    + "<p style=\"font-size:12px;color:#888\">"
    + "Ce message vous est adressé dans le cadre de votre activité "
    + "professionnelle d'organisme de formation. "
    + "<a href=\"" + lien + "\">Ne plus recevoir de messages</a>."
    + "</p>";
}

// ─────────────────────────────────────────────────────────────────────
// PREMIERE VAGUE — LE BILAN PEDAGOGIQUE ET FINANCIER.
// ─────────────────────────────────────────────────────────────────────
function messagePremiereVague(o: any, nbFormations: number): string {
  const texte =
    salutationDe(o) + "\n\n"
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

  return habillage(o, texte);
}

// ─────────────────────────────────────────────────────────────────────
// SECONDE VAGUE — LA DEMANDE QU ON REFUSE.
//
// L ANGLE, ET POURQUOI IL EST DIFFERENT. La premiere vague parle d une
// obligation administrative. Celle-ci parle d un manque a gagner : un
// client demande une formation hors du domaine de l organisme, il dit non,
// le client va ailleurs — et n en revient pas toujours.
//
// C est la marque blanche, prise par la perte plutot que par la
// fonctionnalite.
//
// ⚠️ LE SUJET EST TOUJOURS L ORGANISME CLIENT, JAMAIS L EDITEUR.
// ⚠️ AUCUNE statistique inventee, AUCUN temoignage, AUCUN concurrent nomme.
// ⚠️ « le catalogue de l Editeur est evolutif » est la SEULE formule
// autorisee : il n existe aucune production sur demande.
// ─────────────────────────────────────────────────────────────────────
function messageSecondeVague(o: any, nbFormations: number): string {
  const texte =
    salutationDe(o) + "\n\n"
    + "Je vous avais écrit il y a quelques mois au sujet d'AcadéMIA Pro. "
    + "Je reviens vers vous sur un autre sujet.\n\n"
    + "Un client vous appelle pour une formation qui n'est pas dans votre "
    + "domaine. Vous connaissez la suite : vous dites non, il cherche "
    + "ailleurs, il trouve — et il ne revient pas toujours vers vous pour "
    + "le reste.\n\n"
    + "C'est ce que nous proposons de changer. Le catalogue de l'Éditeur "
    + "compte " + nbFormations + " formations que vous pouvez porter sous "
    + "votre propre marque : votre nom, vos couleurs, vos tarifs. Le "
    + "stagiaire ne voit que vous, l'attestation de fin de formation porte "
    + "votre signature, et la relation client reste la vôtre.\n\n"
    + "Vous répondez oui sans rien avoir à produire, et sans faire sortir "
    + "votre client de chez vous.\n\n"
    + "Si le sujet vous parle, répondez-moi simplement : je vous montre en "
    + "quinze minutes ce que ça donne sur un cas réel.";

  return habillage(o, texte);
}

const SUJETS: any = {
  1: "Votre BPF de l'an prochain se prepare cette annee",
  2: "La demande que vous avez du refuser le mois dernier",
};

function messageDe(o: any, vague: number, nbFormations: number): string {
  return vague === 2
    ? messageSecondeVague(o, nbFormations)
    : messagePremiereVague(o, nbFormations);
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

function dateLimiteVagueDeux(): string {
  return new Date(Date.now() - DELAI_ENTRE_VAGUES * 86400000).toISOString();
}

// LE FILTRE, SELON LA VAGUE. Voir le commentaire de la campagne cabinets :
// la mecanique est identique, seule la table change.
//
// ⚠️ prospects_organismes N A PAS de colonne « vague » (lot d importation).
// Elle a en revanche vague_envoi et nb_envois depuis le 27/08.
function appliquerFiltre(q: any, vague: number): any {
  let sortie = q
    .eq("desabonne", false)
    .not("email", "is", null)
    .lt("nb_envois", PLAFOND_ENVOIS);

  if (vague === 2) {
    sortie = sortie
      .eq("vague_envoi", 1)
      .eq("statut", "envoye")
      .lt("envoye_le", dateLimiteVagueDeux());
  } else {
    sortie = sortie
      .eq("statut", "enrichi")
      .eq("vague_envoi", 0);
  }

  return sortie;
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

  // LA VAGUE. Par defaut 1 : le cron quotidien reste sur la premiere.
  const vagueDemandee = Number(req.nextUrl.searchParams.get("vague") || 1);
  const vague = vagueDemandee === 2 ? 2 : 1;

  // 🚨 24/08 — LE COMPTAGE ANNONCAIT 580 FORMATIONS AU LIEU DE 560.
  //
  // La table formations contient DEUX familles : les 560 formations du
  // catalogue commercial ET les 20 ateliers, qui forment un domaine a part
  // et ne figurent nulle part au catalogue. Compter toutes les lignes
  // actives annoncait donc 580 a chaque prospect, alors que le site en
  // montre 560 : un destinataire qui verifie voit l ecart.
  const { count: nbFormations } = await supabase
    .from("formations")
    .select("code", { count: "exact", head: true })
    .eq("actif", true)
    .neq("domaine", "Ateliers");

  // MODE MESURE : ?compter=1 ne lit que la reserve et n envoie RIEN.
  if (req.nextUrl.searchParams.get("compter") === "1") {
    const { count: total } = await supabase
      .from("prospects_organismes")
      .select("id", { count: "exact", head: true });

    const { count: vague1 } = await appliquerFiltre(
      supabase.from("prospects_organismes")
        .select("id", { count: "exact", head: true }), 1);

    const { count: vague2 } = await appliquerFiltre(
      supabase.from("prospects_organismes")
        .select("id", { count: "exact", head: true }), 2);

    const { count: enAttente } = await supabase
      .from("prospects_organismes")
      .select("id", { count: "exact", head: true })
      .eq("vague_envoi", 1)
      .eq("desabonne", false)
      .gte("envoye_le", dateLimiteVagueDeux());

    const { count: epuises } = await supabase
      .from("prospects_organismes")
      .select("id", { count: "exact", head: true })
      .gte("nb_envois", PLAFOND_ENVOIS);

    const { count: desabonnes } = await supabase
      .from("prospects_organismes")
      .select("id", { count: "exact", head: true })
      .eq("desabonne", true);

    return NextResponse.json({
      mode: "mesure, aucun envoi",
      total_organismes: total || 0,
      formations_annoncees: nbFormations || 0,
      premiere_vague_a_faire: vague1 || 0,
      seconde_vague_a_faire: vague2 || 0,
      seconde_vague_en_attente_du_delai: enAttente || 0,
      delai_entre_vagues_jours: DELAI_ENTRE_VAGUES,
      plafond_atteint: epuises || 0,
      desabonnes: desabonnes || 0,
    });
  }

  const demande = Number(req.nextUrl.searchParams.get("lot") || LOT_PAR_DEFAUT);
  const lot = demande > 0 && demande <= 500 ? demande : LOT_PAR_DEFAUT;

  const { data: cibles, error: errLecture } = await appliquerFiltre(
    supabase
      .from("prospects_organismes")
      // ⚠️ `dirigeant_prenom` EST INDISPENSABLE ICI — 02/09. Sans lui, la
      // salutation retombe sur « Bonjour, » pour TOUT LE MONDE, meme quand
      // le prenom existe en base. La colonne n etait pas demandee.
      .select("id, email, raison_sociale, dirigeant_prenom, dirigeant_nom, nb_envois"),
    vague)
    .order("id", { ascending: true })
    .limit(lot);

  if (errLecture) {
    return NextResponse.json(
      { erreur: errLecture.message }, { status: 500 });
  }

  if (!cibles || cibles.length === 0) {
    return NextResponse.json({
      info: "aucun organisme a contacter en vague " + vague,
      vague: vague,
    });
  }

  let envoyes = 0;
  let echecs = 0;
  const details: any[] = [];

  for (const o of cibles) {
    // MARQUAGE AVANT ENVOI. Si la suite echoue, la ligne porte deja un
    // statut qui l exclut des prochaines lectures : mieux vaut un envoi
    // manque qu un envoi double.
    //
    // ⚠️ LA CONDITION SUR LE STATUT EST CELLE DE LA VAGUE. En vague 2, la
    // ligne est en 'envoye' et non en 'enrichi'.
    const statutAttendu = vague === 2 ? "envoye" : "enrichi";

    const { error: errMarque } = await supabase
      .from("prospects_organismes")
      .update({ statut: "envoi_en_cours" })
      .eq("id", o.id)
      .eq("statut", statutAttendu);

    if (errMarque) {
      echecs++;
      continue;
    }

    const html = messageDe(o, vague, nbFormations || 0);
    const res = await envoyer(String(o.email), SUJETS[vague], html);

    if (res.ok) {
      envoyes++;
      await supabase
        .from("prospects_organismes")
        .update({
          statut: "envoye",
          envoye_le: new Date().toISOString(),
          vague_envoi: vague,
          nb_envois: (Number(o.nb_envois) || 0) + 1,
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

  const { count: restant } = await appliquerFiltre(
    supabase.from("prospects_organismes")
      .select("id", { count: "exact", head: true }), vague);

  return NextResponse.json({
    vague: vague,
    envoyes: envoyes,
    echecs: echecs,
    formations_annoncees: nbFormations || 0,
    reste_a_contacter: restant || 0,
    premiers_echecs: details,
  });
}
