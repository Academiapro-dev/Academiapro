import { NextRequest, NextResponse } from "next/server";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const MODELE = "claude-sonnet-4-6";

// 🆕 LIRE UNE CAPTURE DE PROFIL LINKEDIN — cree le 18/08.
//
// POURQUOI. Jacques croise des profils au fil de son actualite LinkedIn et
// les ajoute a la main : nom, organisme, ville, adresse du profil. Quatre
// champs a recopier a chaque fois, sur un iPad, depuis une autre
// application — c'est long et c'est la que naissent les fautes de frappe.
//
// Cette route recoit la capture d'ecran du profil et en extrait les champs.
// Jacques photographie, depose, et le formulaire se remplit.
//
// ⚠️ ELLE NE CREE RIEN EN BASE. Elle LIT et RENVOIE, rien de plus. C'est
// delibere : une lecture automatique se trompe parfois, et Jacques doit
// pouvoir corriger avant d'enregistrer. La creation reste l'action
// « ajouter » de /api/admin/linkedin, declenchee par un bouton.
//
// 🚨 L'ADRESSE DU PROFIL EST RAREMENT LISIBLE SUR UNE CAPTURE. L'application
// LinkedIn ne l'affiche pas, et le navigateur ne la montre que si la barre
// d'adresse est dans le cadre. Le modele renvoie donc une chaine vide dans
// ce cas plutot que d'inventer une adresse — une adresse fausse enverrait
// l'invitation dans le vide.
//
// ══════════════════════════════════════════════════════════════════════════
// 🆕🆕 LA CAPTURE PROPOSE LA CAMPAGNE — 06/09.
//
// LE DEFAUT QU ELLE CORRIGE, decrit par Jacques : « des fois j oublie de
// selectionner si c est Monsieur comptable ou si c est AcadeMIA et je me
// suis fait avoir plusieurs fois ». Le formulaire demarrait sur
// « academiapro » et rien ne verifiait le choix : une fiche validee sans y
// toucher partait en AcadeMIA silencieusement, et l expert-comptable
// recevait le message des organismes de formation.
//
// La capture montre le metier de la personne — c est la meme image qui dit
// « expert-comptable » et qui donne son nom. Le modele lit donc les deux.
//
// 🚨 IL PROPOSE, IL NE DECIDE PAS. La proposition remplit le selecteur ;
// Jacques voit ce qui a ete retenu, et le corrige d un geste si c est faux.
// Un classement automatique et silencieux reproduirait le defaut qu on
// corrige, dans l autre sens.
//
// 🆕 ET DES PRODUITS SECONDAIRES. Un cabinet comptable achete Mr. Comptable,
// mais aussi Mr. CRM pour suivre ses clients, et MysterLLC s il a des
// expatries. La campagne PRINCIPALE decide du premier message ; les
// secondaires attendent leur tour — sept jours entre deux messages a la
// meme personne, envoyes par le cron du lundi 8 h.
//
// ⚠️ LES CLES SONT CELLES DE `PRODUITS` DANS app/admin/linkedin/page.tsx :
// academiapro, mrcomptable, mysterllc, mrcrm, mrlms. Une cle inconnue est
// ecartee ici plutot que de remonter jusqu a l ecran — c est le dernier
// endroit ou l on peut encore filtrer ce que le modele renvoie.
// ══════════════════════════════════════════════════════════════════════════

const PRODUITS_CONNUS = ["academiapro", "mrcomptable", "mysterllc", "mrcrm", "mrlms"];

function produitValide(brut: any): string {
  const c = String(brut || "").trim().toLowerCase();
  return PRODUITS_CONNUS.indexOf(c) >= 0 ? c : "";
}

// Les produits secondaires : on ecarte les inconnus, les doublons, et la
// campagne principale — elle n a rien a faire dans la liste des autres.
function produitsValides(brut: any, principale: string): string[] {
  if (!Array.isArray(brut)) return [];
  const vus: string[] = [];
  for (const x of brut) {
    const c = produitValide(x);
    if (!c) continue;
    if (c === principale) continue;
    if (vus.indexOf(c) >= 0) continue;
    vus.push(c);
  }
  return vus;
}

export async function POST(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const body = await req.json().catch(function () { return null; });
    if (!body || !body.image) {
      return NextResponse.json({ ok: false, erreur: "Aucune image recue." }, { status: 400 });
    }

    // L'image arrive en base64, precedee de son type : on separe les deux.
    // Format attendu : data:image/jpeg;base64,XXXXX
    const brut = String(body.image);
    const morceaux = brut.split(",");
    const donnees = morceaux.length > 1 ? morceaux[1] : morceaux[0];

    let typeImage = "image/jpeg";
    const entete = morceaux.length > 1 ? morceaux[0] : "";
    if (entete.indexOf("image/png") >= 0) typeImage = "image/png";
    else if (entete.indexOf("image/webp") >= 0) typeImage = "image/webp";
    else if (entete.indexOf("image/gif") >= 0) typeImage = "image/gif";

    if (!donnees || donnees.length < 100) {
      return NextResponse.json({ ok: false, erreur: "Image illisible." }, { status: 400 });
    }

    // Environ 5 Mo une fois decode : au-dela, l'API refuse.
    if (donnees.length > 7000000) {
      return NextResponse.json(
        { ok: false, erreur: "Image trop lourde. Recadrez la capture sur la partie haute du profil." },
        { status: 400 }
      );
    }

    const invite =
      "Tu lis la capture d'ecran d'un profil LinkedIn et tu en extrais les informations.\n\n" +
      "Reponds UNIQUEMENT par un objet JSON, sans aucun texte avant ou apres, sans balises " +
      "Markdown, avec exactement ces cles :\n\n" +
      "{\n" +
      '  "nom": "le prenom et le nom de la personne, tels qu affiches",\n' +
      '  "prenom": "le prenom seul",\n' +
      '  "patronyme": "le nom de famille seul",\n' +
      '  "organisme": "le nom de l entreprise ou de l organisation",\n' +
      '  "ville": "la ville seule, sans la region ni le pays",\n' +
      '  "fonction": "l intitule de poste affiche sous le nom",\n' +
      '  "linkedin": "l adresse complete du profil si elle est visible, sinon une chaine vide",\n' +
      '  "relation": "1er, 2e, 3e ou une chaine vide si non visible",\n' +
      '  "deja_invite": true si un bouton En attente est visible, false sinon,\n' +
      '  "campagne": "le produit le plus pertinent pour cette personne, une seule cle parmi celles listees plus bas, ou une chaine vide si la capture ne permet pas de trancher",\n' +
      '  "produits": ["les autres produits qui pourraient aussi l interesser, du plus au moins probable, sans repeter la campagne principale ; tableau vide si aucun"],\n' +
      '  "motif": "une phrase courte disant pourquoi ce produit a ete retenu, fondee sur ce que montre la capture",\n' +
      '  "observation": "deux a trois phrases resumant ce que la capture apprend d utile : son metier, son secteur, ce qu il recherche, le nombre de relations en commun. Redige en francais correct, avec les accents."\n' +
      "}\n\n" +
      "LES PRODUITS, ET A QUI ILS S ADRESSENT :\n" +
      '- "mrcomptable" : logiciel de production comptable, pour les CABINETS ' +
      "D EXPERTISE COMPTABLE. Expert-comptable, commissaire aux comptes, " +
      "collaborateur comptable, chef de mission, assistant comptable.\n" +
      '- "academiapro" : plateforme de formation AVEC un catalogue de formations ' +
      "a revendre, pour les ORGANISMES DE FORMATION. Formateur independant, " +
      "dirigeant d organisme, consultant-formateur, responsable pedagogique.\n" +
      '- "mrlms" : la meme plateforme SANS le catalogue, pour un organisme qui a ' +
      "DEJA ses propres formations et ne veut que l outil.\n" +
      '- "mrcrm" : suivi commercial — qui rappeler, quoi lui dire. Pour toute ' +
      "personne qui suit des clients ou des prospects : independant, commercial, " +
      "dirigeant de petite structure, agence.\n" +
      '- "mysterllc" : suivi des obligations administratives des LLC AMERICAINES, ' +
      "pour des francophones. Expatrie, e-commercant, freelance travaillant avec " +
      "les Etats-Unis, cabinet qui suit des clients ayant une societe americaine.\n\n" +
      "COMMENT CHOISIR :\n" +
      "- LA CAMPAGNE PRINCIPALE est le produit dont le METIER AFFICHE indique le " +
      "besoin le plus direct. Un expert-comptable donne \"mrcomptable\". Un " +
      "formateur independant donne \"academiapro\".\n" +
      "- LES PRODUITS SECONDAIRES sont ceux qu on pourrait lui proposer ENSUITE. Un " +
      "cabinet comptable peut aussi vouloir \"mrcrm\" pour suivre ses clients, et " +
      "\"mysterllc\" s il en a qui ont une societe americaine.\n" +
      "- SI LE METIER N EST PAS LISIBLE ou ne correspond a aucun produit, renvoie " +
      "une campagne VIDE et un tableau de produits VIDE. Ne devine pas : une fiche " +
      "mal classee recoit le message d un autre metier, ce qui se voit " +
      "immediatement et ne se rattrape pas.\n\n" +
      "Regles imperatives :\n" +
      "- N INVENTE RIEN. Un champ que la capture ne montre pas recoit une chaine vide.\n" +
      "- L ADRESSE DU PROFIL : ne la renvoie que si elle est REELLEMENT VISIBLE sur " +
      "l image, dans la barre d adresse du navigateur ou dans le texte. Ne la deduis " +
      "JAMAIS du nom de la personne — une adresse inventee enverrait l invitation dans le vide.\n" +
      "- LA VILLE : « Paris et peripherie » donne « Paris ». « Lyon, Auvergne-Rhone-Alpes » " +
      "donne « Lyon ».\n" +
      "- L OBSERVATION doit etre utile a un commercial : ce qu il fait, ce qu il cherche, " +
      "ce qui donnerait un angle d approche. Pas de flatterie, pas de generalites.\n" +
      "- Si la capture ne montre pas un profil LinkedIn, renvoie toutes les cles vides et " +
      'mets dans "observation" : « Cette image ne semble pas etre un profil LinkedIn. »';

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: typeImage, data: donnees },
              },
              { type: "text", text: invite },
            ],
          },
        ],
      }),
    });

    const reponse = await r.json();

    if (!r.ok) {
      const detail = reponse && reponse.error && reponse.error.message
        ? reponse.error.message
        : "code " + r.status;
      return NextResponse.json(
        { ok: false, erreur: "Lecture impossible : " + detail },
        { status: 500 }
      );
    }

    const texte = (reponse.content || [])
      .map(function (b: any) { return b && b.type === "text" ? b.text : ""; })
      .join("")
      .trim();

    // Le modele peut envelopper sa reponse dans des balises Markdown malgre
    // la consigne : on les retire avant d'analyser.
    const propre = texte.replace(/```json/g, "").replace(/```/g, "").trim();

    let lu: any = null;
    try {
      lu = JSON.parse(propre);
    } catch (e) {
      return NextResponse.json(
        { ok: false, erreur: "Reponse illisible du lecteur.", brut: propre.slice(0, 400) },
        { status: 500 }
      );
    }

    // 🚨 LA CAMPAGNE EST FILTREE ICI, ET NULLE PART AILLEURS. Le modele
    // repond en langue naturelle : rien ne garantit qu il rende une cle
    // connue. Une valeur inconnue devient une chaine vide, ce que l ecran
    // traite comme « aucun choix » — donc il demandera a Jacques.
    const campagne = produitValide(lu.campagne);
    const produits = produitsValides(lu.produits, campagne);

    return NextResponse.json({
      ok: true,
      nom: String(lu.nom || "").trim(),
      prenom: String(lu.prenom || "").trim(),
      patronyme: String(lu.patronyme || "").trim(),
      organisme: String(lu.organisme || "").trim(),
      ville: String(lu.ville || "").trim(),
      fonction: String(lu.fonction || "").trim(),
      linkedin: String(lu.linkedin || "").trim(),
      relation: String(lu.relation || "").trim(),
      deja_invite: lu.deja_invite === true,
      campagne: campagne,
      produits: produits,
      motif: String(lu.motif || "").trim(),
      observation: String(lu.observation || "").trim(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
