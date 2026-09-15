import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Campagne de prospection MR CRM vers les AGENCES IMMOBILIERES.
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
// 🚨 L EXPEDITEUR EST LE DOMAINE PRINCIPAL, ET C EST UN COMPROMIS SUBI.
//
// Les campagnes organismes et cabinets partent d un SOUS-DOMAINE de
// prospection (contact-pro.academiapro.fr, contact-pro.mrcomptable.fr) :
// le domaine principal porte le transactionnel — liens de connexion,
// factures, relances clients — et une reputation abimee par la prospection
// empecherait un client de recevoir son lien de connexion.
//
// ⚠️ LE PLAFOND RESEND EST ATTEINT : dix domaines sur l offre Pro. Aucun
// sous-domaine contact-pro.mrcrm.fr ne peut donc etre cree aujourd hui.
// La prospection part de mrcrm.fr lui-meme.
// ⛔ SI UN JOUR UN CLIENT NE RECOIT PLUS SON LIEN DE CONNEXION, REGARDER
// ICI EN PREMIER. La parade : liberer un domaine chez Resend, creer
// contact-pro.mrcrm.fr, et changer les deux constantes ci-dessous.
// ═══════════════════════════════════════════════════════════════════════

export const maxDuration = 300;

const EXPEDITEUR = "Jacques Lalou <jacques@mrcrm.fr>";
const REPONSE = "contact@mrcrm.fr";

// 🚨 mrcrm.fr REDIRIGE VERS www — l adresse sans www ferait un saut
// supplementaire, et un lien qui rebondit est un signal de moins bonne
// qualite pour les filtres.
const SITE = "https://www.mrcrm.fr";

// LE LOT PAR DEFAUT COMMANDE LE CRON.
//
// Vercel appelle une adresse fixe : un cron ne peut pas porter de
// parametre. C est donc CETTE VALEUR qui decide du nombre d envois
// quotidiens, et c est ici qu on la monte quand la chauffe le permet.
//
// 🚨 CINQ POUR COMMENCER, ET CE N EST PAS NEGOCIABLE. Le domaine mrcrm.fr
// n a JAMAIS envoye un seul courriel de prospection. La regle de chauffe
// est ecrite dans campagne-organismes et elle ne se contourne pas : elle se
// mesure en JOURS D ENVOI, pas en volume cumule. On ne saute jamais un
// palier — 5 puis 10 puis 20 puis 50 — et on ne monte QUE si les echecs
// sont restes a zero.
// ⚠️ ACADEMIA A MIS DOUZE JOURS A PASSER DE 5 A 10, avec 42 messages
// partis et aucun echec. C est la mesure qui autorise, pas l envie.
const LOT_PAR_DEFAUT = 5;

// LE NOMBRE MAXIMUM DE SOLLICITATIONS PAR PROSPECT.
const PLAFOND_ENVOIS = 2;

// LE DELAI MINIMUM ENTRE DEUX VAGUES, EN JOURS.
//
// 🚨 QUATRE-VINGT-DIX JOURS. Revenir trop tot vers quelqu un qui n a pas
// repondu se lit comme de l insistance ; revenir trois mois plus tard se
// lit comme une nouvelle prise de contact.
// 🚨 TRENTE JOURS — DECISION DE JACQUES DU 15/09. C etait quatre-vingt-dix.
// Ses mots : « une fois dans le mois, c est pas derangeant ».
// ⚠️ CLAUDE A OBJECTE UNE FOIS : trois semaines a un mois est le rythme qui
// fait cliquer « spam » plutot que « se desinscrire », et une plainte pese
// bien plus lourd qu une desinscription — elle abime la reputation du
// domaine, donc aussi les liens de connexion qui partent du meme endroit.
// Jacques a tranche : « il faut vendre ». APPLIQUE, NE PAS ROUVRIR.
// ⚠️ CE QUI REND CE RYTHME TENABLE : chaque vague parle d un AUTRE PRODUIT.
// Ce n est pas une relance, c est une autre offre.
const DELAI_ENTRE_VAGUES = 30;

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

// 🚨 LE PRENOM, JAMAIS LE NOM DE FAMILLE.
//
// Le 02/09, la campagne organismes ecrivait « Bonjour BRUNO » a Virginie
// Bruno, qui a repondu « STOP — merci de supprimer toutes nos coordonnees
// de vos bases ». Rien ne signe un envoi automatise mal fait aussi
// surement.
// ⚠️ « Bonjour, » tout court est neutre, jamais faux, et parfaitement
// acceptable en ouverture professionnelle. Une civilite supposee — Monsieur
// ou Madame — est pire que pas de civilite du tout.
function salutationDe(o: any): string {
  const prenom = String(o.dirigeant_prenom || "").trim();
  if (prenom.length > 1) {
    // ⚠️ L ANNUAIRE REND LES PRENOMS EN CAPITALES. « Bonjour JEAN-MARIE »
    // crie ; on remet la casse normale.
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
    + "Fondateur — Mr. CRM<br/>"
    + "<a href=\"" + SITE + "\" style=\"color:#8a6d3b\">mrcrm.fr</a>"
    + "</p>";

  return texte.replace(/\n/g, "<br/>")
    + signature
    + "<br/><hr/>"
    + "<p style=\"font-size:12px;color:#888\">"
    + "Ce message vous est adressé dans le cadre de votre activité "
    + "professionnelle de transaction immobilière. "
    + "<a href=\"" + lien + "\">Ne plus recevoir de messages</a>."
    + "</p>";
}

// ─────────────────────────────────────────────────────────────────────
// PREMIERE VAGUE — LES MANDATS, LES ACQUEREURS, LES RELANCES.
//
// 🚨 LA STRUCTURE EST CELLE QUE JACQUES A ARRETEE LE 14/09 : LE COMMUN
// D ABORD — ce que tout professionnel reconnait — LE METIER ENSUITE.
// Ses mots : « ratisser large sans tomber dans le piege de ne pas paraitre
// specifique aux agences immobilieres ». Un courriel qui ouvre sur le
// registre est jete par celui qui n en tient pas ; un courriel qui n en
// parle jamais n accroche personne.
//
// 🚨 LA DIFFUSION SE DIT « PROCHAINEMENT » — decision de Jacques du 14/09,
// apres une objection de Claude et un arbitrage clair : un editeur inconnu
// qui commence par enumerer ce qu il ne fait pas se fait classer en trois
// secondes. ⛔ JAMAIS DE DATE. ⛔ NE PAS ROUVRIR CE DEBAT.
//
// ⚠️ CHAQUE FONCTION CITEE EXISTE ET A ETE EPROUVEE A L ECRAN LE 14/09 :
// biens, mandats numerotes, registre chronologique, rapprochement
// acquereur, affaires chiffrees, taches, agenda.
// ⛔ AUCUN PRIX. Les tarifs ne s affichent nulle part publiquement.
// ⛔ AUCUN CONCURRENT NOMME, AUCUNE STATISTIQUE INVENTEE.
// ─────────────────────────────────────────────────────────────────────
function messagePremiereVague(o: any): string {
  const texte =
    salutationDe(o) + "\n\n"
    + "Je m'appelle Jacques Lalou, je dirige Mr. CRM, un outil de suivi "
    + "commercial dont une partie a été construite pour les agences "
    + "immobilières.\n\n"
    + "Le commun d'abord. Chaque contact suit un chemin simple — à "
    + "contacter, contacté, intéressé, client — et vous le déplacez d'un "
    + "geste. Ce qui s'est dit au téléphone, ce que vous avez promis, la "
    + "date à laquelle rappeler : tout reste sur sa fiche. Les relances "
    + "partent toutes seules tant que la personne n'a pas répondu, et "
    + "s'arrêtent dès qu'elle le fait. Le matin, l'écran vous dit qui "
    + "attend votre appel.\n\n"
    + "Le métier ensuite. Vos biens portent leurs diagnostics, et le DPE "
    + "qui approche de ses dix ans vous est signalé avant qu'un acquéreur "
    + "ne le remarque. Vos mandats sont numérotés par la plateforme, dans "
    + "l'ordre, sans trou — c'est le registre lui-même, pas une copie du "
    + "registre. L'irrévocabilité de plus de trois mois sur un exclusif est "
    + "refusée à la saisie, et le délai de rétractation est calculé quand "
    + "la signature a lieu hors de l'agence.\n\n"
    + "Et quand un acquéreur cherche quelque chose, l'outil vous dit quels "
    + "biens de votre portefeuille lui correspondent — et lesquels vous lui "
    + "avez déjà proposés, pour ne pas les lui présenter deux fois.\n\n"
    + "La diffusion vers les portails arrivera prochainement.\n\n"
    + "Si le sujet vous parle, répondez-moi simplement : je vous montre en "
    + "trente minutes ce que ça donne sur vos propres mandats.";

  return habillage(o, texte);
}

// ─────────────────────────────────────────────────────────────────────
// SECONDE VAGUE — CE QUE LE CONTROLE CHERCHE EN PREMIER.
//
// L ANGLE, ET POURQUOI IL EST DIFFERENT. La premiere vague decrit un
// outil. Celle-ci parle d un RISQUE que le lecteur connait et qu il a
// peut-etre repousse — le registre des mandats, sa numerotation continue,
// ce qu un controle regarde. Elle s adresse au titulaire de la carte
// professionnelle, pas au negociateur.
//
// ⚠️ AUCUNE ENUMERATION DE FONCTIONNALITES. Un message qui expose obtient
// un silence poli ; un message qui pose une question obtient une reponse.
// ⚠️ ON NE FAIT PAS PEUR AVEC DES SANCTIONS CHIFFREES : l article 14 de la
// loi Hoguet prevoit six mois d emprisonnement et 7 500 EUR, mais ecrire
// cela a un prospect est une menace, pas un argument.
// ─────────────────────────────────────────────────────────────────────
function messageSecondeVague(o: any): string {
  const texte =
    salutationDe(o) + "\n\n"
    + "Je vous avais écrit il y a quelques mois au sujet de Mr. CRM. Je "
    + "reviens vers vous sur un autre point.\n\n"
    + "Le registre des mandats est ce qu'un contrôle regarde en premier. "
    + "Numérotation continue, ordre chronologique, aucun blanc, aucune "
    + "rature. Un trou dans la suite, et c'est tout le registre qui devient "
    + "discutable — alors que le mandat lui-même était parfaitement "
    + "régulier.\n\n"
    + "Tenu à la main, sur un cahier ou dans un tableau, ce registre "
    + "dépend de la rigueur de celui qui le remplit un vendredi soir.\n\n"
    + "Dans Mr. CRM, le numéro n'est pas saisi : il est attribué par la "
    + "plateforme au moment où le mandat est établi. Un mandat ne se "
    + "supprime jamais — il se résilie, avec son motif et sa date. Le "
    + "registre n'est pas une table à part qu'il faudrait tenir à jour : "
    + "c'est la suite elle-même de vos mandats.\n\n"
    + "Et parce qu'un mandat sans mention obligatoire n'ouvre droit à aucun "
    + "honoraire, l'outil refuse à la saisie ce que la loi interdit plutôt "
    + "que de vous le signaler après coup.\n\n"
    + "Si le sujet vous parle, répondez-moi simplement : je vous montre en "
    + "trente minutes ce que ça donne sur vos propres mandats.";

  return habillage(o, texte);
}

// ⚠️ LES SUJETS SONT EN ASCII PUR — les accents dans un objet de courriel
// passent par un encodage que certains filtres notent mal.
const SUJETS: any = {
  1: "Vos mandats, vos acquereurs et vos relances au meme endroit",
  2: "Ce qu un controle regarde en premier",
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
// Vague 1 : jamais contacte — statut 'enrichi' et vague_envoi a 0.
// Vague 2 : a recu le premier message il y a plus de quatre-vingt-dix
// jours, et n a jamais ete recontacte.
//
// ⚠️ DANS LES DEUX CAS : desabonne = false. Une desinscription est
// definitive, et la respecter n est pas une courtoisie mais la loi.
function appliquerFiltre(q: any, vague: number): any {
  let sortie = q
    .eq("desabonne", false)
    .not("email", "is", null)
    .neq("email", "")
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
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ erreur: "RESEND_API_KEY absente" }, { status: 500 });
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
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true });

    const { count: avecEmail } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true })
      .not("email", "is", null).neq("email", "");

    const { count: vague1 } = await appliquerFiltre(
      supabase.from("prospects_immobilier")
        .select("id", { count: "exact", head: true }), 1);

    const { count: vague2 } = await appliquerFiltre(
      supabase.from("prospects_immobilier")
        .select("id", { count: "exact", head: true }), 2);

    const { count: enAttente } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true })
      .eq("vague_envoi", 1)
      .eq("desabonne", false)
      .gte("envoye_le", dateLimiteVagueDeux());

    const { count: epuises } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true })
      .gte("nb_envois", PLAFOND_ENVOIS);

    const { count: desabonnes } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true })
      .eq("desabonne", true);

    const { count: echecs } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true })
      .eq("statut", "echec");

    return NextResponse.json({
      mode: "mesure, aucun envoi",
      total_agences: total || 0,
      avec_adresse: avecEmail || 0,
      premiere_vague_a_faire: vague1 || 0,
      seconde_vague_a_faire: vague2 || 0,
      seconde_vague_en_attente_du_delai: enAttente || 0,
      delai_entre_vagues_jours: DELAI_ENTRE_VAGUES,
      plafond_atteint: epuises || 0,
      desabonnes: desabonnes || 0,
      en_echec: echecs || 0,
      lot_quotidien: LOT_PAR_DEFAUT,
    });
  }

  const demande = Number(req.nextUrl.searchParams.get("lot") || LOT_PAR_DEFAUT);
  const lot = demande > 0 && demande <= 500 ? demande : LOT_PAR_DEFAUT;

  const { data: cibles, error: errLecture } = await appliquerFiltre(
    supabase
      .from("prospects_immobilier")
      .select("id, email, raison_sociale, dirigeant_prenom, dirigeant_nom, nb_envois"),
    vague)
    .order("id", { ascending: true })
    .limit(lot);

  if (errLecture) {
    return NextResponse.json({ erreur: errLecture.message }, { status: 500 });
  }

  if (!cibles || cibles.length === 0) {
    return NextResponse.json({
      info: "aucune agence a contacter en vague " + vague,
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
      .from("prospects_immobilier")
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
        .from("prospects_immobilier")
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
        .from("prospects_immobilier")
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
    supabase.from("prospects_immobilier")
      .select("id", { count: "exact", head: true }), vague);

  return NextResponse.json({
    vague: vague,
    envoyes: envoyes,
    echecs: echecs,
    reste_a_contacter: restant || 0,
    premiers_echecs: details,
  });
}
