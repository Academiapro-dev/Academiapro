import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Campagne de prospection MYSTERLLC vers les CABINETS D EXPERTISE
// COMPTABLE — SECONDE VAGUE DE LA SEQUENCE CABINETS.
//
// ═══════════════════════════════════════════════════════════════════════
// LA SEQUENCE SUR prospects_cabinets, trente jours entre chaque :
//   vague 1  Mr Comptable   la corvee des justificatifs   10/jour
//   vague 2  MysterLLC      l ouverture a l international   5/jour  ← ICI
//   vague 3  Mr Comptable   les heures non facturees      10/jour
//
// 🚨 POURQUOI MYSTERLLC EN DEUXIEME. Jacques, 15/09 : « les
// experts-comptables ont aussi besoin d etendre leur reactivite a
// l international ». Le cabinet qui n a pas repondu sur la comptabilite
// peut repondre sur une offre qu il n a pas et que ses clients demandent.
//
// ⚠️ CE N EST PAS LA CIBLE PRINCIPALE DE MYSTERLLC. Le titulaire francais
// d une LLC en est une autre, et sa base — prospects_ecommerce, 20 000
// lignes — N A AUCUNE ADRESSE. Elle attend une collecte de sites web puis
// leur lecture. ⛔ NE PAS CROIRE QUE MYSTERLLC EST BRANCHE PARTOUT : il ne
// l est que sur les cabinets.
// ═══════════════════════════════════════════════════════════════════════

export const maxDuration = 300;

// L EXPEDITEUR EST LE SOUS-DOMAINE DE PROSPECTION, jamais mrcomptable.fr
// lui-meme : le domaine principal porte le transactionnel (liens de
// connexion, factures, relances clients). Une reputation abimee par la
// prospection empecherait un cabinet de recevoir son lien de connexion.
const EXPEDITEUR = "Jacques Lalou <jacques@contact-pro.mysterllc.com>";
const REPONSE = "contact@academiapro.fr";
const SITE = "https://www.mysterllc.com";

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
    + "Fondateur — MysterLLC<br/>"
    + "<a href=\"" + SITE + "\" style=\"color:#8a6d3b\">mysterllc.com</a>"
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
// LE MESSAGE — L OUVERTURE COMMERCIALE VERS L INTERNATIONAL.
//
// 🚨 CE TEXTE N A PAS ETE INVENTE ICI. Il reprend le message MysterLLC
// VERSION CABINETS, valide par Jacques le 13/09, qui vit dans le CRM
// LinkedIn (app/admin/linkedin/page.tsx, cle « mysterllc » quand la fiche
// est un cabinet). Transpose au format courriel.
//
// L ANGLE, ET POURQUOI IL EST JUSTE. On ne vend pas au cabinet un suivi
// pour LUI : on lui ouvre une offre a facturer A SES CLIENTS. Jacques,
// 13/09 : « permettre a un expert-comptable de lui donner une ouverture
// commerciale vers l international ».
//
// ⚠️ CHAQUE PHRASE DECRIT UNE FONCTION QUI EXISTE : qualification
// Carmejane, depenses par devise, 5472/1120 transmis par fax avec preuve,
// relances courriel et SMS, creation A→Z (EPROUVEE DE BOUT EN BOUT LE
// 15/09), marque blanche « sur demande ».
// ⚠️ MR COMPTABLE EN UNE PHRASE, pas un second argumentaire : le cabinet
// qui l a ecarte ne doit pas sentir qu on le lui revend.
// ⛔ JAMAIS « anonymat », « optimisation », « discretion », « echapper a
// l impot », « paradis fiscal ».
// ⛔ AUCUN PRIX.
// ─────────────────────────────────────────────────────────────────────
function messagePremiereVague(o: any): string {
  const texte =
    salutationDe(o) + "\n\n"
    + "Je vous avais écrit il y a quelques semaines au sujet de Mr. "
    + "Comptable. Je reviens vers vous sur un tout autre sujet.\n\n"
    + "Je vous présente MysterLLC : une plateforme conçue pour ceux qui "
    + "accompagnent des entrepreneurs — cabinets comptables, conseils, "
    + "agences — dont les clients envisagent de créer une société "
    + "américaine, ou en détiennent déjà une.\n\n"
    + "Pour le client qui veut se lancer : la création accompagnée de A à "
    + "Z — agent enregistré, statuts, demande du numéro fiscal transmise "
    + "par la plateforme, pacte de société signé électroniquement, "
    + "ouverture du compte bancaire suivie jusqu'au bout — avec, à chaque "
    + "étape, l'état du dossier et la preuve de ce qui a été fait.\n\n"
    + "Pour le client qui a déjà sa société : la qualification côté "
    + "français selon la jurisprudence récente, les dépenses et le compte "
    + "courant tenus par devise avec chaque justificatif rattaché, les "
    + "formulaires américains annuels préparés, signés et transmis par la "
    + "plateforme à l'administration américaine avec la preuve d'envoi "
    + "archivée, et les échéances des deux côtés rappelées par courriel et "
    + "par SMS.\n\n"
    + "Ce que ça change pour votre cabinet : vous accompagnez ces projets "
    + "sans embaucher ni vous former à la fiscalité américaine, vous "
    + "facturez une offre internationale, et vous gardez votre outil de "
    + "production pour le reste. Plusieurs sociétés sous un même accès, "
    + "présentation à vos couleurs sur demande.\n\n"
    + "Si vous souhaitez le voir sur un dossier, réel ou fictif, je vous "
    + "montre le parcours en une séance.";

  return habillage(o, texte);
}

// ⚠️ PAS DE SECONDE VAGUE POUR CE PRODUIT sur cette base.
function messageSecondeVague(o: any): string {
  return messagePremiereVague(o);
}

const SUJETS: any = {
  1: "Une offre internationale, sans vous former a la fiscalite americaine",
  2: "Une offre internationale, sans vous former a la fiscalite americaine",
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
    // 🚨 vague_envoi = 1 : QUE LES CABINETS DEJA CONTACTES PAR MR
    // COMPTABLE, apres le delai de trente jours.
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
    // contactees par Mr Comptable.
    const statutAttendu = "envoye";

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
          // 🚨 SECONDE VAGUE DE LA SEQUENCE CABINETS.
          vague_envoi: 2,
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
