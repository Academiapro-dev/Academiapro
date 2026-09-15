import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Campagne de prospection MR LMS vers les ORGANISMES DE FORMATION.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 POURQUOI UNE ROUTE SEPAREE DE campagne-organismes, QUI VISE LA MEME
// TABLE. Trois raisons, toutes decidees le 15/09 :
//
// 1. LA CADENCE DIFFERE. AcadeMIA envoie 20 par jour depuis un domaine
//    chauffe depuis aout ; mrlms.fr n a JAMAIS envoye. Une seule route ne
//    peut pas porter deux rythmes.
// 2. L EXPEDITEUR DIFFERE. Un courriel Mr LMS signe academiapro.fr
//    brouille la marque ; le destinataire doit voir mrlms.fr.
// 3. LES PRODUITS SE COMPLETENT, ILS NE SE REMPLACENT PAS. Jacques,
//    15/09 : « deux outils complementaires, et c est ce qui prouve que
//    tout est bien structure et organise, on ne met pas tout dans un meme
//    melange ». AcadeMIA propose SON catalogue ; Mr LMS propose la
//    plateforme a qui a DEJA ses formations.
//
// 🚨 LE SEQUENCEMENT, ET C EST LUI QUI EVITE LE DOUBLON. Cette campagne ne
// s adresse QU AUX ORGANISMES DEJA CONTACTES PAR ACADEMIA — vague_envoi
// vaut 1 — et apres le delai de trente jours. Un organisme qui n a jamais
// entendu parler de nous recoit d abord le catalogue, jamais la plateforme.
// ⛔ NE PAS METTRE vague_envoi = 0 DANS LE FILTRE : la campagne doublerait
// AcadeMIA sur les memes lignes, le meme jour.
//
// ⚠️ ELLE ECRIT vague_envoi = 2 : c est la SECONDE vague de la sequence,
// meme si c est la premiere de ce produit. La sequence compte pour le
// prospect, pas pour nous.
// ═══════════════════════════════════════════════════════════════════════

export const maxDuration = 300;

// L EXPEDITEUR EST LE SOUS-DOMAINE DE PROSPECTION, jamais mrcomptable.fr
// lui-meme : le domaine principal porte le transactionnel (liens de
// connexion, factures, relances clients). Une reputation abimee par la
// prospection empecherait un cabinet de recevoir son lien de connexion.
const EXPEDITEUR = "Jacques Lalou <jacques@mrlms.fr>";
const REPONSE = "contact@mrlms.fr";
const SITE = "https://www.mrlms.fr";

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
    + "Fondateur — Mr. LMS<br/>"
    + "<a href=\"" + SITE + "\" style=\"color:#8a6d3b\">mrlms.fr</a>"
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
// LE MESSAGE — LA PLATEFORME POUR QUI A DEJA SES FORMATIONS.
//
// 🚨 CE TEXTE N A PAS ETE INVENTE ICI. Il reprend le message Mr LMS
// travaille et valide dans le CRM LinkedIn (app/admin/linkedin/page.tsx,
// messageRelance, cle « mrlms »), transpose au format courriel.
// Jacques, 15/09 : « hors de question de les remplacer ».
//
// L ANGLE, ET POURQUOI IL EST JUSTE. Le destinataire vient de recevoir une
// offre de CATALOGUE. S il n a pas repondu, c est souvent qu il a deja ses
// propres formations. Ce message lui dit exactement cela : la plateforme
// seule, sans catalogue impose.
//
// ⚠️ « Attestation de fin de formation », JAMAIS « certificat ».
// ⚠️ AUCUN PRIX, AUCUN CONCURRENT NOMME, AUCUNE STATISTIQUE.
// ⚠️ LE CATALOGUE EST MENTIONNE COMME UNE OPTION, jamais mis en avant : un
// prospect venu pour la plateforme qui lit un argumentaire de catalogue
// comprend qu on lui vend autre chose.
// ─────────────────────────────────────────────────────────────────────
function messagePremiereVague(o: any): string {
  const texte =
    salutationDe(o) + "\n\n"
    + "Je vous avais écrit il y a quelques semaines au sujet d'un catalogue "
    + "de formations. Je reviens vers vous sur un autre sujet, qui concerne "
    + "les organismes qui ont déjà les leurs.\n\n"
    + "J'ai développé une plateforme pour les organismes de formation qui "
    + "ont leurs propres formations : les inscriptions, les documents qui "
    + "se signent, les évaluations, les réclamations et le bilan pédagogique "
    + "tenus au même endroit, à mesure que l'activité se fait.\n\n"
    + "L'idée est simple : que ce que vous devrez présenter un jour — à un "
    + "auditeur, à un financeur, à un stagiaire — existe déjà quand on vous "
    + "le demande.\n\n"
    + "Vos formations restent les vôtres. Vous les publiez sous votre "
    + "marque, avec vos contenus et vos tarifs. Le catalogue de l'Éditeur "
    + "peut s'y adosser si vous le souhaitez, mais rien ne vous y oblige.\n\n"
    + "Si c'est un sujet chez vous, je vous montre volontiers sur vos "
    + "propres cas, en trente minutes.";

  return habillage(o, texte);
}

// ─────────────────────────────────────────────────────────────────────
// SECONDE VAGUE DE CE PRODUIT — NON ECRITE.
//
// ⚠️ ELLE N EXISTE PAS ENCORE, ET C EST VOULU : la sequence complete sur
// prospects_organismes compte quatre vagues, portees par TROIS routes
// differentes (AcadeMIA, Mr LMS, Mr CRM). Ce produit n en porte qu une.
// Si une seconde etait ecrite un jour, elle irait ici et le plafond de la
// sequence devrait etre revu.
// ⛔ EN ATTENDANT, ?vague=2 SUR CETTE ROUTE RENVERRAIT LE MEME TEXTE. La
// fonction ci-dessous existe donc pour ne pas casser la mecanique
// partagee, et elle est IDENTIQUE a la premiere : il n y a rien de nouveau
// a dire tant que le second message n est pas ecrit.
// ─────────────────────────────────────────────────────────────────────
function messageSecondeVague(o: any): string {
  return messagePremiereVague(o);
}

// ⚠️ LES SUJETS SONT EN ASCII PUR — les accents dans un objet de courriel
// passent par un encodage que certains filtres notent mal.
const SUJETS: any = {
  1: "Et si vos formations sont deja les votres",
  2: "Et si vos formations sont deja les votres",
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
    // 🚨 vague_envoi = 1, PAS 0. Cette campagne ne s adresse QU AUX
    // ORGANISMES DEJA CONTACTES PAR ACADEMIA, apres le delai. Mettre 0
    // ferait doubler AcadeMIA sur les memes lignes le meme jour.
    sortie = sortie
      .eq("statut", "envoye")
      .eq("vague_envoi", 1)
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
    // 🚨 TOUJOURS « envoye » : cette campagne ne prend QUE des lignes deja
    // contactees par AcadeMIA. Filtrer sur « enrichi » ferait echouer tous
    // les marquages EN SILENCE, et la route rendrait zero envoi sans dire
    // pourquoi.
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
          // 🚨 ON ECRIT 2 : c est la SECONDE vague de la sequence vue par le
          // prospect, meme si c est la premiere de ce produit.
          vague_envoi: 2,
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
