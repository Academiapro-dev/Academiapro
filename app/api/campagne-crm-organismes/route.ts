import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Campagne de prospection MR CRM vers les ORGANISMES DE FORMATION.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 TROISIEME VAGUE DE LA SEQUENCE SUR prospects_organismes.
//
// LA SEQUENCE COMPLETE, trente jours entre chaque, portee par TROIS routes
// differentes parce que chacune a son expediteur et sa cadence :
//   vague 1  AcadeMIA Pro   le catalogue                  20/jour
//   vague 2  Mr LMS         la plateforme seule            5/jour
//   vague 3  Mr CRM         trouver les stagiaires         5/jour   ← ICI
//   vague 4  AcadeMIA Pro   le bilan pedagogique          20/jour
//
// 🚨 POURQUOI MR CRM A SA PLACE ICI. Jacques, 15/09 : « Mr CRM est
// egalement pour les organismes de formation aussi ». Un organisme suit
// des prospects stagiaires, des entreprises clientes, des dossiers de
// financement — exactement ce que fait l outil.
//
// ⚠️ LE FILTRE EXIGE vague_envoi = 2 : cette campagne ne parle QU A CEUX
// qui ont deja recu le catalogue PUIS la plateforme. Mettre 0 ou 1 la
// ferait doubler une campagne en cours.
// ═══════════════════════════════════════════════════════════════════════

export const maxDuration = 300;

// L EXPEDITEUR EST LE SOUS-DOMAINE DE PROSPECTION, jamais mrcomptable.fr
// lui-meme : le domaine principal porte le transactionnel (liens de
// connexion, factures, relances clients). Une reputation abimee par la
// prospection empecherait un cabinet de recevoir son lien de connexion.
const EXPEDITEUR = "Jacques Lalou <jacques@mrcrm.fr>";
const REPONSE = "contact@mrcrm.fr";
const SITE = "https://www.mrcrm.fr";

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
    + "Fondateur — Mr. CRM<br/>"
    + "<a href=\"" + SITE + "\" style=\"color:#8a6d3b\">mrcrm.fr</a>"
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
// LE MESSAGE — SAVOIR QUI RAPPELER, ET QUOI LUI DIRE.
//
// 🚨 CE TEXTE REPREND LE MESSAGE MR CRM du CRM LinkedIn
// (app/admin/linkedin/page.tsx, cle « mrcrm »), transpose au format
// courriel et oriente organisme de formation.
//
// L ANGLE. Les deux premieres vagues parlaient de FORMER. Celle-ci parle
// de TROUVER — le nerf de la guerre d un organisme, et un sujet que
// personne ne lui vend.
//
// ⚠️ ON NE CITE PAS LE CATALOGUE : il a deja ete propose en vague 1, le
// redire ressemble a de l insistance.
// ⚠️ AUCUN PRIX, AUCUN CONCURRENT NOMME.
// ⚠️ LA FONCTION TELEPHONE N EST PAS MENTIONNEE : Plivo n a pas encore ses
// identifiants, et crm_appels est vide. On ne promet pas ce qui n est pas
// branche dans un courriel de prospection.
// ─────────────────────────────────────────────────────────────────────
function messagePremiereVague(o: any): string {
  const texte =
    salutationDe(o) + "\n\n"
    + "Je vous ai écrit à deux reprises : une première fois au sujet d'un "
    + "catalogue de formations, une seconde au sujet de la plateforme qui "
    + "tient vos preuves. Je termine par ce qui vient avant les deux : "
    + "trouver les stagiaires.\n\n"
    + "J'ai développé un outil de suivi commercial pensé pour une question "
    + "précise : savoir qui rappeler aujourd'hui, et quoi lui dire.\n\n"
    + "Chaque contact suit un chemin simple — à contacter, contacté, "
    + "intéressé, inscrit — et vous le déplacez d'un geste. L'entreprise "
    + "qui demande un devis en janvier et rappelle en septembre, le "
    + "financement en cours d'instruction, le stagiaire qui hésite entre "
    + "deux sessions : tout reste sur sa fiche, avec ce qui s'est dit et la "
    + "date à laquelle revenir.\n\n"
    + "Les relances partent toutes seules tant que la personne n'a pas "
    + "répondu, et s'arrêtent dès qu'elle le fait. Le matin, l'écran vous "
    + "dit qui attend votre appel — vous n'avez plus à vous souvenir de "
    + "rien.\n\n"
    + "Il est fait aussi bien pour une personne seule que pour une équipe : "
    + "une licence, un utilisateur.\n\n"
    + "Si vous voulez voir à quoi cela ressemble, je vous montre en trente "
    + "minutes.";

  return habillage(o, texte);
}

// ⚠️ PAS DE SECONDE VAGUE POUR CE PRODUIT — voir le commentaire de
// campagne-lms. La fonction existe pour ne pas casser la mecanique
// partagee.
function messageSecondeVague(o: any): string {
  return messagePremiereVague(o);
}

const SUJETS: any = {
  1: "Savoir qui rappeler, et quoi lui dire",
  2: "Savoir qui rappeler, et quoi lui dire",
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
    // 🚨 vague_envoi = 2 : QUE CEUX QUI ONT RECU LE CATALOGUE PUIS LA
    // PLATEFORME. C est la troisieme vague de la sequence.
    sortie = sortie
      .eq("statut", "envoye")
      .eq("vague_envoi", 2)
      .lt("envoye_le", dateLimiteVagueDeux());
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
      .from("prospects_organismes")
      .select("id", { count: "exact", head: true });

    const { count: vague1 } = await appliquerFiltre(
      supabase.from("prospects_organismes")
        .select("id", { count: "exact", head: true }), 1);

    const { count: vague2 } = await appliquerFiltre(
      supabase.from("prospects_organismes")
        .select("id", { count: "exact", head: true }), 2);

    // Ceux qui ont recu le premier message mais dont le delai n est pas
    // encore ecoule : la reserve de demain, pour ainsi dire.
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
      total_prospects: total || 0,
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
      info: "aucun prospect a contacter en vague " + vague,
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
    // 🚨 TOUJOURS « envoye » : cette campagne ne prend que des lignes deja
    // contactees deux fois.
    const statutAttendu = "envoye";

    const { error: errMarque } = await supabase
      .from("prospects_organismes")
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
        .from("prospects_organismes")
        .update({
          statut: "envoye",
          envoye_le: new Date().toISOString(),
          // 🚨 TROISIEME VAGUE DE LA SEQUENCE.
          vague_envoi: 3,
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
    reste_a_contacter: restant || 0,
    premiers_echecs: details,
  });
}
