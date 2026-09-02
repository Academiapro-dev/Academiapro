import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Campagne de prospection vers les CABINETS D EXPERTISE COMPTABLE.
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
// PAS D IMAGE : premier contact a froid, le rapport texte/image est un des
// signaux que pesent les filtres.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕 LES VAGUES — 27/08.
//
// LE DEFAUT CORRIGE. La route lisait statut = 'enrichi' et le passait a
// 'envoye'. Une ligne contactee sortait donc DEFINITIVEMENT du circuit :
// aucun moyen de la reprendre plus tard, aucun moyen de savoir combien de
// fois elle avait ete sollicitee.
//
// Or la reserve s epuise. Quand les 33 881 cabinets auront ete contactes
// une fois, il faudra pouvoir revenir vers ceux qui n ont pas repondu —
// avec un AUTRE message, pas le meme reformule.
//
// COMMENT CA MARCHE :
//   vague_envoi = 0  jamais contacte
//   vague_envoi = 1  a recu le premier message
//   vague_envoi = 2  a recu le second
//   nb_envois        le compte, qui borne tout
//
// ⚠️ LE PLAFOND EST DE DEUX ENVOIS. Au-dela, on n insiste pas : trois
// messages a quelqu un qui n a jamais repondu, c est du harcelement, et
// les filtres le lisent comme tel.
//
// ⚠️ LA COLONNE « vague » EXISTE DEJA ET NE VEUT PAS DIRE CA. Elle porte
// des lots d importation (1, 2, 3), pas des vagues d envoi. NE PAS LES
// CONFONDRE : d ou la colonne distincte vague_envoi.
//
// ⚠️ LE SECOND MESSAGE DOIT VRAIMENT DIRE AUTRE CHOSE. Le meme texte
// reformule se fait reperer et fait chuter la delivrabilite. Le premier
// parle de la corvee des justificatifs ; le second parle de ce que le
// cabinet ne facture jamais, et de ce qu il fait du temps rendu.
// ═══════════════════════════════════════════════════════════════════════

export const maxDuration = 300;

// L EXPEDITEUR EST LE SOUS-DOMAINE DE PROSPECTION, jamais mrcomptable.fr
// lui-meme : le domaine principal porte le transactionnel (liens de
// connexion, factures, relances clients). Une reputation abimee par la
// prospection empecherait un cabinet de recevoir son lien de connexion.
const EXPEDITEUR = "Jacques Lalou <jacques@contact-pro.mrcomptable.fr>";
const REPONSE = "contact@mrcomptable.fr";
const SITE = "https://mrcomptable.fr";

// PALIERS : 5 par jour, puis 10, 20, 50. Modifier ce chiffre suffit.
// Le domaine contact-pro.mrcomptable.fr n a JAMAIS envoye : on demarre bas.
const LOT_PAR_DEFAUT = 5;

// LE NOMBRE MAXIMUM DE SOLLICITATIONS PAR PROSPECT.
const PLAFOND_ENVOIS = 2;

// LE DELAI MINIMUM ENTRE DEUX VAGUES, EN JOURS.
//
// 🚨 QUATRE-VINGT-DIX JOURS, ET CE N EST PAS UN CHIFFRE ROND CHOISI AU
// HASARD. Revenir trop tot vers quelqu un qui n a pas repondu se lit comme
// de l insistance ; revenir trois mois plus tard se lit comme une nouvelle
// prise de contact. Entre-temps, sa situation a change — et l echeance de
// la facture electronique aussi.
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

// 🚨 LA SALUTATION — REVUE LE 02/09, APRES L INCIDENT DES ORGANISMES.
//
// CE QUI SE PASSAIT ICI. Deux formes, toutes deux fautives :
//   « Bonjour Virginie Bruno, » — le nom complet en salutation sonne
//   administratif, pas comme un courriel entre professionnels.
//   « Bonjour Bruno, » quand le prenom manquait — c est exactement la
//   formule qui a fait repondre « STOP » a Virginie Bruno le 02/09 : son
//   patronyme lui a ete servi comme un prenom.
//
// LA REGLE RETENUE, LA MEME QUE POUR LES ORGANISMES :
//   1. Le PRENOM SEUL s il existe — « Bonjour Virginie, ».
//   2. « Bonjour, » sinon. Neutre, jamais faux.
//
// ⚠️ ON N ECRIT JAMAIS LE NOM DE FAMILLE SEUL, et on ne devine JAMAIS la
// civilite : la base ne connait pas le genre du contact, et se tromper de
// « Monsieur » est pire que de n en mettre aucun.
//
// ⚠️ LA CAMPAGNE CABINETS PART LE 25 SEPTEMBRE, 5 courriels par jour.
// Ce defaut aurait touche chaque envoi.
function salutationDe(o: any): string {
  const prenom = String(o.dirigeant_prenom || "").trim();

  // Une initiale n est pas un prenom : « Bonjour V, » serait pire que
  // « Bonjour, ».
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
    + "Fondateur — Mr. Comptable<br/>"
    + "<a href=\"" + SITE + "\" style=\"color:#8a6d3b\">mrcomptable.fr</a>"
    + "</p>";

  return texte.replace(/\n/g, "<br/>")
    + signature
    + "<br/><hr/>"
    + "<p style=\"font-size:12px;color:#888\">"
    + "Ce message vous est adressé dans le cadre de votre activité "
    + "professionnelle d'expertise comptable. "
    + "<a href=\"" + lien + "\">Ne plus recevoir de messages</a>."
    + "</p>";
}

// ─────────────────────────────────────────────────────────────────────
// PREMIERE VAGUE — LA CORVEE DES JUSTIFICATIFS.
// ─────────────────────────────────────────────────────────────────────
function messagePremiereVague(o: any): string {
  const texte =
    salutationDe(o) + "\n\n"
    + "Je m'appelle Jacques Lalou, je dirige Mr. Comptable, un logiciel de "
    + "comptabilité pour cabinets.\n\n"
    + "Une question simple : combien d'heures votre équipe passe-t-elle "
    + "chaque mois à réclamer des justificatifs ? Les écritures sans pièce, "
    + "les mêmes clients, les mêmes courriels écrits à la main. Et la "
    + "semaine perdue en fin d'exercice à courir après douze mois de "
    + "factures.\n\n"
    + "Mr. Comptable inverse la charge. Chaque mois, il repère les écritures "
    + "sans pièce, dossier par dossier, et écrit lui-même au client — avec "
    + "la liste exacte de ce qui manque et un lien pour déposer, sans compte "
    + "à créer. Le collaborateur ne relance plus : il regarde ce qui est "
    + "rentré.\n\n"
    + "La facture électronique est prise en charge. Les factures au format "
    + "Factur-X sont lues dans leur fichier structuré : le fournisseur, la "
    + "date, le montant hors taxes et la TVA sont repris tels qu'ils y "
    + "figurent, sans ressaisie. Et vos factures sortent au même format.\n\n"
    + "Le reste suit la même logique. Tenue, lettrage, rapprochement "
    + "bancaire, déclarations et liasse, facturation de vos honoraires et "
    + "prévisionnel de trésorerie sur douze semaines. Un seul prix, sans "
    + "module en supplément, sans engagement de durée.\n\n"
    + "Si le sujet vous parle, répondez-moi simplement : je vous montre en "
    + "quinze minutes ce que ça donne sur un dossier réel.";

  return habillage(o, texte);
}

// ─────────────────────────────────────────────────────────────────────
// SECONDE VAGUE — CE QUE LE CABINET NE FACTURE JAMAIS.
//
// L ANGLE, ET POURQUOI IL EST DIFFERENT. La premiere vague decrit une
// corvee que le lecteur connait deja. Celle-ci parle de ce qu il gagne,
// pas de ce qu on lui enleve — et elle s adresse a l associe qui pense a
// son cabinet, pas au collaborateur qui saisit.
//
// ⚠️ AUCUNE ENUMERATION DE FONCTIONNALITES. Un message qui expose obtient
// un silence poli ; un message qui pose une question obtient une reponse.
// ⚠️ AUCUN CONCURRENT NOMME, AUCUNE STATISTIQUE INVENTEE.
// ─────────────────────────────────────────────────────────────────────
function messageSecondeVague(o: any): string {
  const texte =
    salutationDe(o) + "\n\n"
    + "Je vous avais écrit il y a quelques mois au sujet de Mr. Comptable, "
    + "un logiciel de comptabilité pour cabinets. Je reviens vers vous sur "
    + "un autre angle.\n\n"
    + "Un cabinet vend des heures. Mais une partie de son travail ne se "
    + "facture jamais : le client qui appelle dix minutes pour une question "
    + "rapide, le classement, la vérification, les justificatifs qu'on "
    + "réclame trois fois. Sur cinquante dossiers, cela finit par "
    + "représenter un temps de travail entier chaque mois.\n\n"
    + "Ce travail est indispensable et personne ne l'a choisi en entrant "
    + "dans la profession.\n\n"
    + "Quand ce temps revient, il ne sert pas à travailler moins. Il sert "
    + "à ce qu'un client attend vraiment d'un expert-comptable : du "
    + "conseil, de l'anticipation, une réponse le jour même. C'est ce qui "
    + "fait qu'un cabinet se recommande.\n\n"
    + "C'est autour de cette idée que Mr. Comptable est construit : rendre "
    + "au cabinet les heures qu'il ne facture pas.\n\n"
    + "Si le sujet vous parle, répondez-moi simplement : je vous montre en "
    + "quinze minutes ce que ça donne sur un dossier réel.";

  return habillage(o, texte);
}

const SUJETS: any = {
  1: "La corvee que personne ne facture",
  2: "Les heures que votre cabinet ne facture pas",
};

function messageDe(o: any, vague: number): string {
  return vague === 2 ? messageSecondeVague(o) : messagePremiereVague(o);
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

// La date limite au-dela de laquelle une seconde vague se justifie.
function dateLimiteVagueDeux(): string {
  return new Date(Date.now() - DELAI_ENTRE_VAGUES * 86400000).toISOString();
}

// LE FILTRE, SELON LA VAGUE.
//
// Vague 1 : jamais contacte. Le statut 'enrichi' suffit, et vague_envoi
// vaut 0 — le rattrapage du 27/08 a pose 1 sur les lignes deja parties.
//
// Vague 2 : a recu le premier message, il y a plus de quatre-vingt-dix
// jours, et n a jamais ete recontacte.
//
// ⚠️ DANS LES DEUX CAS : desabonne = false. Une desinscription est
// definitive, et la respecter n est pas une courtoisie mais la loi.
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
  // La seconde se declenche a la main — ?vague=2 — le jour ou la reserve
  // de premiers contacts sera epuisee.
  const vagueDemandee = Number(req.nextUrl.searchParams.get("vague") || 1);
  const vague = vagueDemandee === 2 ? 2 : 1;

  // MODE MESURE : ?compter=1 ne lit que la reserve et n envoie RIEN.
  if (req.nextUrl.searchParams.get("compter") === "1") {
    const { count: total } = await supabase
      .from("prospects_cabinets")
      .select("id", { count: "exact", head: true });

    const { count: vague1 } = await appliquerFiltre(
      supabase.from("prospects_cabinets")
        .select("id", { count: "exact", head: true }), 1);

    const { count: vague2 } = await appliquerFiltre(
      supabase.from("prospects_cabinets")
        .select("id", { count: "exact", head: true }), 2);

    // Ceux qui ont recu le premier message mais dont le delai n est pas
    // encore ecoule : la reserve de demain, pour ainsi dire.
    const { count: enAttente } = await supabase
      .from("prospects_cabinets")
      .select("id", { count: "exact", head: true })
      .eq("vague_envoi", 1)
      .eq("desabonne", false)
      .gte("envoye_le", dateLimiteVagueDeux());

    const { count: epuises } = await supabase
      .from("prospects_cabinets")
      .select("id", { count: "exact", head: true })
      .gte("nb_envois", PLAFOND_ENVOIS);

    const { count: desabonnes } = await supabase
      .from("prospects_cabinets")
      .select("id", { count: "exact", head: true })
      .eq("desabonne", true);

    return NextResponse.json({
      mode: "mesure, aucun envoi",
      total_cabinets: total || 0,
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
      .from("prospects_cabinets")
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
      info: "aucun cabinet a contacter en vague " + vague,
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
    // ligne est en 'envoye' et non en 'enrichi' : filtrer sur 'enrichi'
    // ferait echouer tous les marquages en silence.
    const statutAttendu = vague === 2 ? "envoye" : "enrichi";

    const { error: errMarque } = await supabase
      .from("prospects_cabinets")
      .update({ statut: "envoi_en_cours" })
      .eq("id", o.id)
      .eq("statut", statutAttendu);

    if (errMarque) {
      echecs++;
      continue;
    }

    const html = messageDe(o, vague);
    const res = await envoyer(String(o.email), SUJETS[vague], html);

    if (res.ok) {
      envoyes++;
      await supabase
        .from("prospects_cabinets")
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
        .from("prospects_cabinets")
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
    supabase.from("prospects_cabinets")
      .select("id", { count: "exact", head: true }), vague);

  return NextResponse.json({
    vague: vague,
    envoyes: envoyes,
    echecs: echecs,
    reste_a_contacter: restant || 0,
    premiers_echecs: details,
  });
}
