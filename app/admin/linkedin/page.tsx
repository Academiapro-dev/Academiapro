"use client";
import { useState, useEffect, useMemo, useRef } from "react";

// L ECRAN LINKEDIN — CINQ TEMPS, CINQ ONGLETS.
//
// INVITER : une fiche a la fois, le mot pre-redige, le profil qui s ouvre.
// EN ATTENTE D INVITATION : les profils enregistres mais pas encore invites.
// MES INVITATIONS : ce qui est parti et attend une reponse.
// A ECRIRE : les personnes qui ont accepte et n ont pas encore recu de mot.
// MESSAGES ENVOYES : ceux a qui l on a ecrit, du plus ancien au plus recent.
//
// 🚨🚨 LE DEFAUT DE CONCEPTION CORRIGE LE 18/08. Les deux seuls boutons
// d enregistrement etaient « Invitee avec une note » et « Invitee sans
// note ». ENREGISTRER UNE FICHE ET DECLARER UNE INVITATION ETAIENT DONC LA
// MEME ACTION. Ses mots : « envoyer une fiche sans invitation, pour moi ca
// ne veut pas dire enregistrer la fiche ».
//
// ⚠️ LECON GENERALE : toujours dérouler ce qui arrive AU BOUT — quand le
// quota est atteint, quand la liste est vide, quand un champ manque.
//
// 🚨🚨 LA MEME LECON, REJOUEE LE 25/08 SUR LA RECHERCHE. Le bloc
// « Chercher partout » a d abord ete livre en LECTURE SEULE. C etait faux :
// Jacques trouve un prospect ICI, au moment ou LinkedIn lui notifie une
// acceptation, et il doit pouvoir marquer SANS quitter l ecran.
//
// 🆕🆕 DEUX CAMPAGNES DANS UN SEUL ECRAN — 26/08.
//
// La prospection porte desormais sur DEUX produits : la plateforme de
// formation pour les organismes, et Mr. Comptable pour les cabinets
// d expertise comptable. Chacun a son message, et un cabinet ne doit
// JAMAIS recevoir celui des organismes.
//
// 🚨 POURQUOI UN SEUL ECRAN, ET PAS DEUX. Les invitations partent d un
// SEUL compte LinkedIn, celui de Jacques. Le plafond de vingt par jour
// porte donc sur le TOTAL. Deux ecrans separes auraient deux compteurs,
// et le total reel passerait a quarante sans que personne ne le voie.
// LE COMPTEUR EST GLOBAL, ET IL DOIT LE RESTER.
//
// 🚨 LE MESSAGE SUIT LA FICHE, PAS L ONGLET. Dans « A ecrire », les deux
// campagnes se melangent : la liste rend les acceptations de toutes les
// bases. C est donc l.base — la cle portee par CHAQUE ligne — qui decide
// du message, jamais la base selectionnee a l ecran.
//
// 🆕 LA REGULARISATION DATEE — 30/08.
//
// LE CAS REEL : la fiche de Franck Zemmour (Apertura Management) est
// reapparue dans la file comme jamais invitee, alors que l invitation
// etait partie. Sa declaration avait ete refusee a l epoque du plafond
// bloquant (le defaut Agnes Brunet, corrige le 27/08), et linkedin_le
// etait reste vide.
//
// L API accepte date_invitation depuis le 28/08, mais AUCUN bouton de
// l ecran ne le transmettait : les quatre gestes dataient tout
// d aujourd hui et consommaient le plafond du jour. Le geste ajoute dans
// l etape 3 de l onglet Inviter consigne l invitation A SA VRAIE DATE —
// la fiche quitte la file, le compteur du jour ne bouge pas.

const BASES = [
  { cle: "organismes", nom: "Organismes certifiés Qualiopi" },
  { cle: "qualiopi", nom: "Organismes NON certifiés" },
  { cle: "interim", nom: "Agences d'intérim" },
  { cle: "cabinets", nom: "Cabinets comptables" },
];

// LA BASE QUI RELEVE DE MR. COMPTABLE. Une seule pour l instant, mais la
// fonction existe pour que l ajout d une autre ne demande qu une ligne.
function estCabinet(base: any): boolean {
  return String(base || "") === "cabinets";
}

// LES CHAMPS DE LA FICHE COMPLETE, ET ILS DIFFERENT SELON LA TABLE.
const CHAMPS_PROSPECTS = [
  { cle: "dirigeant_prenom", nom: "Prénom du dirigeant", large: false },
  { cle: "dirigeant_nom", nom: "Nom du dirigeant", large: false },
  { cle: "raison_sociale", nom: "Raison sociale", large: true },
  { cle: "ville", nom: "Ville", large: false },
  { cle: "code_postal", nom: "Code postal", large: false },
  { cle: "email", nom: "Adresse électronique", large: true },
  { cle: "telephone", nom: "Téléphone", large: false },
  { cle: "siren", nom: "SIREN", large: false },
  { cle: "site_web", nom: "Site internet", large: true },
  { cle: "linkedin", nom: "Profil LinkedIn", large: true },
];

const CHAMPS_CRM = [
  { cle: "dirigeant_prenom", nom: "Prénom", large: false },
  { cle: "dirigeant_nom", nom: "Nom", large: false },
  { cle: "nom", nom: "Nom complet du contact", large: true },
  { cle: "organisme", nom: "Son organisme", large: true },
  { cle: "ville", nom: "Ville", large: false },
  { cle: "email", nom: "Adresse électronique", large: false },
  { cle: "telephone", nom: "Téléphone", large: false },
  { cle: "linkedin", nom: "Profil LinkedIn", large: true },
];

function champsDe(base: string) {
  return base === "manuel" ? CHAMPS_CRM : CHAMPS_PROSPECTS;
}

// 🚨 DEUX CENTS CARACTERES, PAS TROIS CENTS. LinkedIn n accorde 300
// caracteres QU AUX COMPTES PREMIUM. Au-dela de 200 en compte gratuit, le
// bouton « Ajouter une note » disparait — ce qui BRULE LA FICHE POUR TROIS
// SEMAINES si on ne voulait pas.
const LIMITE_NOTE = 200;

const JOURS_AVANT_RELANCE = 12;

// 🆕 LA CAPITALISATION — 25/08.
//
// Les bases d open data stockent TOUT EN CAPITALES : « BRUNO »,
// « ACTION PREVENTIVE FORMATIONS CONSEILS ». Une salutation en capitales
// est la premiere chose que lit le destinataire, et elle trahit un champ
// de base de donnees recopie tel quel.
//
// La regle : premiere lettre de chaque mot en majuscule, le reste en
// minuscules. Les particules courantes restent en minuscules, et les
// composes a trait d union sont traites mot par mot — « JEAN-LUC » devient
// « Jean-Luc », pas « Jean-luc ».
const PARTICULES = ["de", "du", "des", "le", "la", "les", "d", "l", "et", "en", "au", "aux"];

function capitaliser(v: any): string {
  const t = String(v === null || v === undefined ? "" : v).trim();
  if (!t) return "";
  // Un texte deja correctement casse n est pas retouche : on ne corrige
  // que ce qui est integralement en capitales.
  if (t !== t.toUpperCase()) return t;

  return t.toLowerCase().split(/\s+/).map(function (mot, rang) {
    if (rang > 0 && PARTICULES.indexOf(mot) >= 0) return mot;
    return mot.split("-").map(function (bout) {
      if (!bout) return bout;
      return bout.charAt(0).toUpperCase() + bout.slice(1);
    }).join("-");
  }).join(" ");
}

// LE MOT D INVITATION.
//
// ⚠️ EN COMPTE GRATUIT, CE MOT NE PART PRESQUE JAMAIS : les notes
// personnalisees sont plafonnees a quelques-unes par mois. Les invitations
// de Jacques partent SANS note. Ce texte reste disponible pour les rares
// cas ou une note se justifie, mais LE VRAI MESSAGE EST CELUI D APRES
// ACCEPTATION.
function motInvitation(prenom: string, base?: string) {
  const p = capitaliser(prenom);
  const civilite = p ? "Bonjour " + p : "Bonjour";

  if (estCabinet(base)) {
    return civilite + ", je construis un outil pour les cabinets comptables, "
      + "sur la relance des justificatifs et la facture électronique. "
      + "Ravi d'échanger avec vous.";
  }

  return civilite + ", j'ai dirigé un organisme de formation certifié, et c'est l'administratif "
    + "qui m'a coûté le plus de temps. J'en ai fait un outil qui le prend en charge. "
    + "Ravi d'échanger avec vous.";
}

// LE MESSAGE APRES ACCEPTATION — DEUX VERSIONS DEPUIS LE 26/08.
//
// CE QUI A CHANGE LE 25/08 SUR LA VERSION ORGANISMES :
//
// 1. LE DEUXIEME PARAGRAPHE EST DEVENU CONCRET. « Le bilan pedagogique et
//    financier, les preuves a reunir » enumerait des categories. Retrouver
//    un emargement de mars decrit une scene que le lecteur reconnait.
//
// 2. LE CHIFFRE EST EXACT ET CALCULE EN BASE. « Plus de trois cents » quand
//    le site en montre 560 : l ecart se voit, et il joue contre nous.
//
// 3. « CE QU AUCUN LOGICIEL DU MARCHE NE PROPOSE » A ETE RETIRE. Une
//    affirmation absolue est exactement la prise que cherche quelqu un qui
//    lit un message commercial.
//
// 🆕 CE QUI A CHANGE LE 26/08, SUR LES DEUX VERSIONS :
//
// « JE NE CHERCHE PAS A VOUS VENDRE QUOI QUE CE SOIT AUJOURD HUI » A ETE
// RETIRE. Ses mots : « ca fait tres commercial ». Il a raison — annoncer
// qu on ne vend pas est precisement ce que dit quelqu un qui vend. La
// phrase suivante, elle, pose une vraie question et se suffit.
//
// 🚨 LA VERSION CABINETS N ENUMERE AUCUNE FONCTIONNALITE. Une premiere
// redaction listait comptabilite, facturation, rapprochement, tresorerie
// et facture electronique. Son verdict : « il indique toutes les
// fonctionnalites comme si j avais peur que le lecteur ne voie pas a quel
// point mon logiciel est performant, donc c est purement commercial ».
// UN MESSAGE QUI POSE UNE QUESTION OBTIENT UNE REPONSE ; UN MESSAGE QUI
// EXPOSE OBTIENT UN SILENCE POLI. Le reste se decouvre sur le site.
//
// ⚠️ AUCUNE MENTION DE PRODUCTION SUR DEMANDE cote organismes. Le
// catalogue est evolutif, point. Decision du 17/08, a ne pas defaire.
// ⚠️ AUCUN CONCURRENT NOMME, dans aucune des deux versions.
function messageRelance(prenom: string, societe: string, nbFormations: number, base?: string) {
  const p = capitaliser(prenom);
  const s = capitaliser(societe);

  if (estCabinet(base)) {
    return (p ? "Bonjour " + p : "Bonjour") + ",\n\n"
      + "Merci d'avoir accepté ma demande.\n\n"
      + "Certaines tâches chronophages reviennent sans cesse dans les cabinets "
      + "comptables, et personne ne les a choisies : courir après des pièces "
      + "justificatives qui n'arrivent jamais à temps.\n\n"
      + "J'ai construit Mr. Comptable pour que ce soit lui qui coure. Il repère "
      + "les opérations sans justificatif et les pièces manquantes, puis relance "
      + "le client par courriel ou par SMS. Il relance aussi vos honoraires "
      + "impayés.\n\n"
      + "Ce qui m'intéresse, c'est de savoir ce qui vous prend le plus de temps "
      + "sans que cela vous rapporte quoi que ce soit"
      + (s ? " chez " + s : "") + ". Si le sujet vous parle, j'échange volontiers "
      + "un quart d'heure avec vous. L'outil s'est construit sur ce que les "
      + "cabinets signalent, et il continue d'évoluer.\n\n"
      + "Bien à vous,\nJacques Lalou\nmrcomptable.fr";
  }

  const combien = nbFormations > 0 ? String(nbFormations) : "plusieurs centaines de";

  return (p ? "Bonjour " + p : "Bonjour") + ",\n\n"
    + "Merci d'avoir accepté ma demande.\n\n"
    + "J'ai dirigé un organisme de formation certifié Qualiopi pendant quelques années. "
    + "Ce qui m'a coûté le plus de temps n'a jamais été de former. C'était de retrouver "
    + "un émargement de mars au moment du bilan, de reconstituer les évaluations qu'on "
    + "avait oublié d'envoyer, et de préparer un audit avec des preuves éparpillées dans "
    + "quatre classeurs.\n\n"
    + "J'en ai fait une plateforme qui consigne tout cela au fil de l'eau — évaluations "
    + "à chaud et à froid, registre des réclamations, dossiers des formateurs, bilan "
    + "prérempli cadre par cadre. Au moment du bilan pédagogique et financier, on vérifie "
    + "et on signe au lieu de reconstituer.\n\n"
    + "S'y ajoute un catalogue de " + combien + " formations que vous pouvez proposer sous "
    + "votre propre marque, quand un client vous demande un sujet qui n'est pas le vôtre.\n\n"
    + "Ce qui m'intéresse, c'est de savoir ce qui vous prend le plus de temps sur la partie "
    + "administrative" + (s ? " chez " + s : "") + " — c'est ce qui me dit si l'outil répond "
    + "à un vrai besoin ou pas.\n\n"
    + "Bien à vous,\nJacques Lalou\nacademiapro.fr";
}

// LA SECONDE RELANCE, elle aussi dans les deux voix.
function secondMessage(prenom: string, base?: string) {
  const p = capitaliser(prenom);

  if (estCabinet(base)) {
    return (p ? "Bonjour " + p : "Bonjour") + ",\n\n"
      + "Je me permets un mot, mon message précédent est peut-être passé inaperçu.\n\n"
      + "Si le sujet ne vous concerne pas, dites-le-moi simplement, je n'insisterai pas.\n\n"
      + "Et si vous êtes curieux de voir à quoi ressemble l'outil, je peux vous ouvrir "
      + "un accès pour que vous jugiez par vous-même — sans engagement d'aucune sorte.\n\n"
      + "Bien à vous,\nJacques Lalou\nmrcomptable.fr";
  }

  return (p ? "Bonjour " + p : "Bonjour") + ",\n\n"
    + "Je me permets un mot, mon message précédent est peut-être passé inaperçu.\n\n"
    + "Si le sujet ne vous concerne pas, dites-le-moi simplement, je n'insisterai pas.\n\n"
    + "Et si vous êtes curieux de voir à quoi ressemble la plateforme, je peux vous ouvrir "
    + "un accès pour que vous jugiez par vous-même — sans engagement d'aucune sorte.\n\n"
    + "Bien à vous,\nJacques Lalou\nacademiapro.fr";
}

// Sans accents et en minuscules : « Bousbia » retrouve « BOUSBIA ».
function aplatir(v: any): string {
  return String(v === null || v === undefined ? "" : v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function PageLinkedin() {
  const [onglet, setOnglet] = useState("inviter");
  const [base, setBase] = useState("organismes");

  const [fiche, setFiche] = useState<any>(null);
  const [restant, setRestant] = useState(0);
  const [epuise, setEpuise] = useState(false);
  const [texte, setTexte] = useState("");
  const [vu, setVu] = useState(false);

  const [lignes, setLignes] = useState<any[]>([]);
  const [ouverte, setOuverte] = useState<any>(null);
  const [texteLong, setTexteLong] = useState("");

  // 🆕 QUELLE FICHE EST EN COURS D ENREGISTREMENT — 27/08.
  //
  // Le drapeau « charge » grisait TOUS les boutons de la page pendant
  // l appel. Sur une liste de trois cents fiches, marquer la premiere
  // figeait les deux cent quatre-vingt-dix-neuf autres. On ne grise
  // desormais que la fiche concernee.
  const [enCours, setEnCours] = useState("");

  const [recherche, setRecherche] = useState("");

  // LA RECHERCHE PARTOUT.
  const [partoutOuvert, setPartoutOuvert] = useState(false);
  const [partoutTerme, setPartoutTerme] = useState("");
  const [partoutCharge, setPartoutCharge] = useState(false);
  const [partoutResultat, setPartoutResultat] = useState<any>(null);
  const [partoutErreur, setPartoutErreur] = useState("");
  const [partoutMessage, setPartoutMessage] = useState("");
  const [partoutOccupe, setPartoutOccupe] = useState("");

  // LA FICHE QUI VIENT D ETRE CREEE.
  const [creee, setCreee] = useState<any>(null);

  // LA FICHE COMPLETE.
  const [depliee, setDepliee] = useState("");
  const [brouillon, setBrouillon] = useState<any>({});
  const [enregistre, setEnregistre] = useState("");

  // LA LECTURE DE CAPTURE.
  const [litPour, setLitPour] = useState("");
  const champAjout = useRef<any>(null);
  const champFiche = useRef<any>(null);
  const [cibleFiche, setCibleFiche] = useState<any>(null);

  // LE MODE ENCHAINEMENT.
  const [serie, setSerie] = useState<any[] | null>(null);
  const [rang, setRang] = useState(0);
  const [texteSerie, setTexteSerie] = useState("");
  const [copieSerie, setCopieSerie] = useState(false);
  const [ouvertSerie, setOuvertSerie] = useState(false);
  const [faits, setFaits] = useState(0);

  const [ajout, setAjout] = useState(false);
  const [aNom, setANom] = useState("");
  const [aLien, setALien] = useState("");
  const [aOrganisme, setAOrganisme] = useState("");
  const [aVille, setAVille] = useState("");
  const [aNotes, setANotes] = useState("");
  // La campagne d une fiche saisie a la main. Elle decide du message qui
  // partira apres acceptation : il n existe aucun autre moyen de le savoir.
  const [aCampagne, setACampagne] = useState("academiapro");

  // 🆕 LA REGULARISATION DATEE — 30/08. Repliee par defaut ; la date
  // proposee est hier, le cas le plus frequent.
  const [regulOuverte, setRegulOuverte] = useState(false);
  const [dateRegul, setDateRegul] = useState(function () {
    const hier = new Date(Date.now() - 24 * 3600 * 1000);
    return hier.toISOString().slice(0, 10);
  });

  // 🆕 CE QUE CHAQUE MODE D ENREGISTREMENT VEUT DIRE — 27/08.
  //
  // Les trois premiers touchent au quota d invitation ; les trois derniers
  // non, puisqu ils consignent une relation qui existe deja.
  const MODES: any = {
    file: { quota: false, mot: "est enregistré, en attente d'invitation" },
    invite: { quota: true, mot: "est marqué invité, avec une note" },
    invite_nu: { quota: true, mot: "est marqué invité, sans note" },
    accepte_nu: { quota: false, mot: "est enregistré comme relation établie" },
    repondu: { quota: false, mot: "est enregistré : il a déjà répondu" },
    rendez_vous: { quota: false, mot: "est enregistré : rendez-vous pris" },
  };
  const [message, setMessage] = useState("");

  // 🆕 LES PROFILS LINKEDIN SAISIS DEPUIS LA RECHERCHE — 01/09.
  // Un objet par cle de fiche : la recherche affiche plusieurs resultats,
  // chacun doit garder sa propre saisie.
  const [profilSaisi, setProfilSaisi] = useState<any>({});

  // 🆕 LE RETOUR DE LA DERNIERE CORRECTION D ETAPE — 01/09.
  //
  // POURQUOI PAR FICHE. Les messages generaux s affichent en haut de la
  // page. Sur une liste longue, Jacques touche une etape a mille pixels
  // plus bas : le message apparait hors de son champ de vision, et de la
  // ou il est, RIEN NE SEMBLE SE PASSER. C est ce qui a fait croire que
  // les pastilles ne repondaient pas.
  //
  // ⚠️ LE RETOUR S AFFICHE DONC SOUS LES PASTILLES ELLES-MEMES, la ou le
  // regard se trouve deja.
  const [retourEtape, setRetourEtape] = useState<any>({});

  const [compteurs, setCompteurs] = useState<any>(null);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState("");

  // LE NOMBRE DE FORMATIONS, tenu a jour par les compteurs.
  const nbFormations = compteurs && compteurs.formations ? compteurs.formations : 0;

  useEffect(() => {
    if (onglet === "inviter") chargerSuivante();
    else chargerListe();
  }, [onglet, base]);

  async function appeler(corps: any) {
    const r = await fetch("/api/admin/linkedin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return await r.json();
  }

  function cleDe(l: any) {
    return l.base + "-" + l.id;
  }

  // ---------- LA RECHERCHE PARTOUT ----------

  async function chercherPartout(terme?: string) {
    const t = String(terme !== undefined ? terme : partoutTerme).trim();
    if (t.length < 2) {
      setPartoutErreur("Deux caractères au minimum.");
      setPartoutResultat(null);
      return;
    }
    setPartoutCharge(true);
    setPartoutErreur("");
    if (terme === undefined) setPartoutMessage("");
    try {
      const r = await fetch("/api/admin/prospection?global=" + encodeURIComponent(t));
      const d = await r.json();
      if (d.ok) setPartoutResultat(d);
      else { setPartoutErreur(d.erreur || "Recherche impossible."); setPartoutResultat(null); }
    } catch (e: any) {
      setPartoutErreur("Recherche impossible : " + String(e));
    }
    setPartoutCharge(false);
  }

  function viderPartout() {
    setPartoutTerme("");
    setPartoutResultat(null);
    setPartoutErreur("");
    setPartoutMessage("");
  }

  // MARQUER DEPUIS UN RESULTAT DE RECHERCHE.
  //
  // ⚠️ sans_suite EMPECHE LA FILE D INVITATION DE DEFILER. On agit sur une
  // fiche precise, pas dans un enchainement.
  // 🆕 MEME PRINCIPE QUE marquer() : l affichage precede l enregistrement.
  //
  // La ligne change d etat AVANT l appel, et l on ne relance NI la
  // recherche NI la liste. Relire les six bases apres chaque marquage
  // rendait la recherche inutilisable des qu on marquait deux fiches.
  // 🆕 REMETTRE UNE FICHE ECARTEE DANS LA FILE — 01/09.
  //
  // LE BESOIN : on ecarte par erreur, ou une societe redevient pertinente.
  // L ecran refusait toute action sur une fiche ecartee, ce qui la
  // condamnait pour toujours.
  //
  // ⚠️ AUCUNE INVITATION N EST ENVOYEE NI CONSOMMEE. La fiche repart a
  // l etat « jamais sollicitee » : statut vide, date d invitation effacee.
  // Elle ressortira dans l onglet Inviter comme si elle n avait jamais ete
  // touchee.
  //
  // ⚠️ C EST LE SEUL CAS OU linkedin_le EST EFFACEE. Ailleurs, une date
  // reelle ne se supprime jamais. Ici elle ne correspond a aucun envoi :
  // « ecarte » pose une date qui marque le geste d ecarter, pas une
  // invitation partie.
  // 🆕 ENREGISTRER UN PROFIL LINKEDIN SUR UNE FICHE DE PROSPECTION — 01/09.
  //
  // LE CAS REEL : Jacques invite quelqu un directement depuis LinkedIn,
  // puis retrouve sa fiche en base — sans profil enregistre. Rien ne
  // permettait de rattacher l un a l autre.
  //
  // ⚠️ CETTE ACTION N INVITE PERSONNE ET NE CONSOMME AUCUN QUOTA. Elle
  // renseigne une coordonnee, rien de plus. C est l action « modifier »,
  // celle-la meme qui sert a corriger un telephone.
  async function enregistrerProfil(cleBase: string, ligne: any) {
    const cle = cleBase + "-" + ligne.id;
    const valeur = String(profilSaisi[cle] || "").trim();

    if (valeur.indexOf("linkedin.com") < 0) {
      setPartoutErreur("Collez l'adresse complète du profil LinkedIn.");
      return;
    }

    setPartoutErreur("");
    setPartoutMessage("");
    setPartoutOccupe(cle);
    try {
      const d = await appeler({
        action: "modifier",
        base: cleBase,
        id: ligne.id,
        linkedin: valeur,
      });
      if (d.ok) {
        setPartoutMessage("Profil enregistré — vous pouvez maintenant l'inviter.");
        const reste: any = { ...profilSaisi };
        delete reste[cle];
        setProfilSaisi(reste);
        if (partoutTerme.trim().length >= 2) await chercherPartout();
      } else {
        setPartoutErreur(d.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setPartoutErreur("Enregistrement impossible : " + String(e));
    }
    setPartoutOccupe("");
  }

  async function remettreEnFile(cleBase: string, ligne: any) {
    setPartoutErreur("");
    setPartoutMessage("");
    const cle = cleBase + "-" + ligne.id;
    setPartoutOccupe(cle);
    try {
      const d = await appeler({
        action: "remettre_en_file",
        base: cleBase,
        id: ligne.id,
      });
      if (d.ok) {
        setPartoutMessage(d.message || "Fiche remise dans la file.");
        if (d.compteurs) setCompteurs(d.compteurs);
        // La recherche est relancee pour que la fiche affiche son nouvel
        // etat sans que Jacques ait a retaper son terme.
        if (partoutTerme.trim().length >= 2) await chercherPartout();
      } else {
        setPartoutErreur(d.erreur || "Opération impossible.");
      }
    } catch (e: any) {
      setPartoutErreur("Opération impossible : " + String(e));
    }
    setPartoutOccupe("");
  }

  async function marquerDepuisRecherche(cleBase: string, ligne: any, statut: string) {
    setPartoutErreur("");
    setPartoutMessage("");

    const nom = capitaliser((ligne.dirigeant_prenom || "") + " " + (ligne.dirigeant_nom || "")).trim()
      || capitaliser(ligne.raison_sociale) || "La fiche";

    // L etat d avant, pour pouvoir revenir en arriere.
    const avant = partoutResultat;

    // On met la ligne a jour dans le resultat affiche, sans rien relire.
    if (partoutResultat && Array.isArray(partoutResultat.bases)) {
      setPartoutResultat({
        ...partoutResultat,
        bases: partoutResultat.bases.map(function (b: any) {
          if (b.cle !== cleBase) return b;
          return {
            ...b,
            lignes: (b.lignes || []).map(function (x: any) {
              return x.id === ligne.id
                ? { ...x, linkedin_statut: statut }
                : x;
            }),
          };
        }),
      });
    }

    const mots: any = {
      accepte: " a été marqué comme ayant accepté. Sa fiche est dans « À écrire ».",
      accepte_nu: " a été marqué comme ayant accepté. Sa fiche est dans « À écrire ».",
      invite: " est marqué invité avec une note.",
      invite_nu: " est marqué invité sans note.",
      ecarte: " est écarté : il ne ressortira plus dans la file d'invitation.",
    };
    setPartoutMessage(nom + (mots[statut] || " est enregistré."));

    try {
      const d = await appeler({
        base: cleBase,
        id: ligne.id,
        statut: statut,
        sans_suite: true,
      });
      if (d.ok) {
        if (d.compteurs) setCompteurs(d.compteurs);
        if (d.avertissement) {
          setPartoutMessage(nom + (mots[statut] || " est enregistré.")
            + " " + d.avertissement);
        }
      } else {
        setPartoutResultat(avant);
        setPartoutMessage("");
        setPartoutErreur((d.erreur || "Enregistrement impossible.")
          + " La fiche est revenue à son état précédent.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setPartoutResultat(avant);
      setPartoutMessage("");
      setPartoutErreur("Enregistrement impossible : " + String(e));
    }
  }

  // ---------- FIN DE LA RECHERCHE PARTOUT ----------

  // ---------- LA LECTURE D UNE CAPTURE ----------

  function enBase64(fichier: File): Promise<string> {
    return new Promise(function (resoudre, rejeter) {
      const lecteur = new FileReader();
      lecteur.onload = function () { resoudre(String(lecteur.result || "")); };
      lecteur.onerror = function () { rejeter(new Error("Lecture du fichier impossible")); };
      lecteur.readAsDataURL(fichier);
    });
  }

  async function lireCapture(fichier: File, pour: string, ligne?: any) {
    if (!fichier) return;
    setLitPour(pour);
    setErreur("");
    setMessage("");
    try {
      const image = await enBase64(fichier);

      const r = await fetch("/api/admin/linkedin-lire-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image }),
      });
      const d = await r.json();

      if (!d.ok) {
        setErreur(d.erreur || "Lecture impossible.");
        setLitPour("");
        return;
      }

      if (pour === "ajout") {
        if (d.nom) setANom(d.nom);
        if (d.organisme) setAOrganisme(d.organisme);
        if (d.ville) setAVille(d.ville);
        if (d.linkedin) setALien(d.linkedin);
        if (d.observation) setANotes(d.observation);

        let mot = "Capture lue.";
        if (!d.linkedin) {
          mot += " L'adresse du profil n'était pas visible : touchez les trois points "
            + "sur LinkedIn, puis « Copier le lien vers le profil », et collez-la.";
        }
        if (d.deja_invite) {
          mot += " ⚠️ Ce profil porte déjà la mention « En attente » — vous l'avez "
            + "probablement invité depuis LinkedIn. Utilisez « Enregistrer seulement » "
            + "pour ne pas consommer une unité de quota inutilement.";
        }
        setMessage(mot);
      } else if (ligne) {
        // UNE FICHE EXISTANTE : on ne remplit que les champs VIDES, pour ne
        // jamais ecraser une donnee deja verifiee par une lecture d image.
        const cle = cleDe(ligne);
        const actuel = brouillon[cle] || {};
        const neuf: any = { ...actuel };
        const cible = ligne.base === "manuel" ? "crm" : "prospect";

        function poserSiVide(champ: string, valeur: string) {
          if (!valeur) return;
          if (!actuel[champ] || String(actuel[champ]).trim() === "") neuf[champ] = valeur;
        }

        poserSiVide("dirigeant_prenom", d.prenom);
        poserSiVide("dirigeant_nom", d.patronyme);
        poserSiVide("ville", d.ville);
        poserSiVide("linkedin", d.linkedin);
        if (cible === "crm") {
          poserSiVide("nom", d.nom);
          poserSiVide("organisme", d.organisme);
        } else {
          poserSiVide("raison_sociale", d.organisme);
        }

        if (d.observation) {
          const ancienne = String(actuel.notes || "").trim();
          neuf.notes = ancienne ? ancienne + "\n\n" + d.observation : d.observation;
        }

        setBrouillon({ ...brouillon, [cle]: neuf });
        setMessage("Capture lue. Les champs vides ont été remplis — relisez avant d'enregistrer.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e.message || e));
    }
    setLitPour("");
  }

  // ---------- FIN DE LA LECTURE ----------

  function poser(d: any) {
    setFiche(d.fiche || null);
    setRestant(d.restant || 0);
    setEpuise(!!d.epuise);
    setTexte(d.fiche ? motInvitation(d.fiche.dirigeant_prenom, d.fiche.base || base) : "");
    setCopie("");
    setVu(false);
    // La regularisation se replie a chaque nouvelle fiche.
    setRegulOuverte(false);
  }

  async function chargerSuivante() {
    setCharge(true);
    setErreur("");
    try {
      const d = await appeler({ action: "suivante", base: base });
      if (d.ok) { poser(d); setCompteurs(d.compteurs || null); }
      else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  async function chargerListe() {
    setCharge(true);
    setErreur("");
    setOuverte(null);
    setDepliee("");
    try {
      const action = onglet === "file" ? "en_file"
        : onglet === "attente" ? "en_attente"
        : onglet === "envoyes" ? "envoyes"
        : "a_relancer";
      const d = await appeler({ action: action });
      if (d.ok) {
        setLignes(d.lignes || []);
        setCompteurs(d.compteurs || null);
      } else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  function deplier(l: any) {
    const cle = cleDe(l);
    const vals: any = { notes: l.notes || "" };
    for (const c of champsDe(l.base)) vals[c.cle] = l[c.cle] || "";
    setBrouillon({ ...brouillon, [cle]: vals });
    setDepliee(cle);
    setErreur("");
    setMessage("");
  }

  function poserChamp(cle: string, champ: string, valeur: string) {
    const actuel = brouillon[cle] || {};
    setBrouillon({ ...brouillon, [cle]: { ...actuel, [champ]: valeur } });
  }

  // 🆕 SUPPRIMER UNE FICHE — 01/09.
  //
  // ⚠️ IRREVERSIBLE, d ou la confirmation. C est le seul geste de l ecran
  // qui ne se defait pas.
  async function supprimerFiche(l: any) {
    const nom = l.raison_sociale || l.nom || "cette fiche";
    if (!confirm("Supprimer définitivement « " + nom + " » ?\n\nCette action est irréversible.")) return;

    const cle = cleDe(l);
    setEnregistre(cle);
    setErreur("");
    setMessage("");
    try {
      const d = await appeler({ action: "supprimer", base: l.base || base, id: l.id });
      if (d.ok) {
        setMessage(d.message || "Fiche supprimée.");
        setDepliee("");
        if (d.compteurs) setCompteurs(d.compteurs);
        await chargerListe();
        if (partoutResultat && partoutTerme.trim().length >= 2) await chercherPartout();
      } else {
        setErreur(d.erreur || "Suppression impossible.");
      }
    } catch (e: any) {
      setErreur("Suppression impossible : " + String(e));
    }
    setEnregistre("");
  }

  async function enregistrerFiche(l: any) {
    const cle = cleDe(l);
    const vals = brouillon[cle] || {};
    setEnregistre(cle);
    setErreur("");
    setMessage("");
    try {
      const corps: any = { action: "modifier", base: l.base || base, id: l.id, notes: vals.notes || "" };
      for (const c of champsDe(l.base)) corps[c.cle] = vals[c.cle] || "";

      const d = await appeler(corps);
      if (d.ok) {
        setMessage(d.message || "Fiche enregistrée.");
        setDepliee("");
        if (d.fiche) {
          setLignes(lignes.map(function (x: any) {
            return cleDe(x) === cle ? { ...d.fiche, base: l.base } : x;
          }));
          if (creee && cleDe(creee) === cle) setCreee({ ...d.fiche, base: l.base });
        }

        // 🆕 LA RECHERCHE GLOBALE SE RAFRAICHIT AUSSI — 01/09.
        //
        // `lignes` ne contient QUE l onglet courant. Une fiche modifiee
        // depuis la recherche n y figure pas : l enregistrement reussissait
        // cote serveur mais l ecran gardait l ancienne valeur, ce qui
        // donnait l impression que rien ne s etait passe.
        //
        // ⚠️ ON NE RELANCE QUE SI UNE RECHERCHE EST EN COURS. Sinon on
        // declencherait une requete inutile a chaque enregistrement.
        if (partoutResultat && partoutTerme.trim().length >= 2) {
          await chercherPartout();
        }
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setEnregistre("");
  }

  const filtrees = useMemo(function () {
    const q = aplatir(recherche);
    if (!q) return lignes;
    const mots = q.split(/\s+/).filter(Boolean);
    return lignes.filter(function (l: any) {
      const foin = aplatir(
        (l.dirigeant_prenom || "") + " " +
        (l.dirigeant_nom || "") + " " +
        (l.raison_sociale || "") + " " +
        (l.ville || "") + " " +
        (l.email || "") + " " +
        (l.telephone || "") + " " +
        (l.linkedin || "") + " " +
        (l.notes || "")
      );
      return mots.every(function (m: string) { return foin.indexOf(m) >= 0; });
    });
  }, [lignes, recherche]);

  // ---------- LE MODE ENCHAINEMENT ----------

  // 🚨 LE MESSAGE SUIT LA FICHE. On passe l.base, pas la base selectionnee :
  // dans « A ecrire », les organismes et les cabinets se melangent.
  // 🚨 LE MESSAGE SUIT LA CAMPAGNE DE LA FICHE.
  //
  // Pour une fiche de prospection, la campagne se deduit de sa base. Pour
  // une fiche SAISIE A LA MAIN, la base est toujours « manuel » : c est la
  // colonne campagne qui tranche. Sans elle, un expert-comptable trouve
  // sur LinkedIn recevait le message des organismes.
  function texteDe(l: any, second: boolean) {
    const cle = campagneDe(l) === "mrcomptable" ? "cabinets" : "organismes";
    return second
      ? secondMessage(l.dirigeant_prenom, cle)
      : messageRelance(l.dirigeant_prenom, l.raison_sociale, nbFormations, cle);
  }

  function demarrerSerie() {
    if (filtrees.length === 0) return;
    const file = filtrees.slice();
    const second = onglet === "envoyes";
    setSerie(file);
    setRang(0);
    setFaits(0);
    setCopieSerie(false);
    setOuvertSerie(false);
    setTexteSerie(texteDe(file[0], second));
    setErreur("");
    setMessage("");
  }

  function quitterSerie() {
    setSerie(null);
    setRang(0);
    setTexteSerie("");
    setCopieSerie(false);
    setOuvertSerie(false);
  }

  function avancer(file: any[], prochain: number) {
    if (prochain >= file.length) {
      setSerie(null);
      setMessage(faits + 1 + " message(s) envoyé(s). La série est terminée.");
      chargerListe();
      return;
    }
    const second = onglet === "envoyes";
    setRang(prochain);
    setTexteSerie(texteDe(file[prochain], second));
    setCopieSerie(false);
    setOuvertSerie(false);
  }

  // ⚠️ L ouverture se fait AVANT toute attente : un window.open declenche
  // apres un await est bloque par le navigateur comme une fenetre
  // surgissante non sollicitee.
  function copierEtOuvrir(l: any) {
    try {
      navigator.clipboard.writeText(texteSerie);
      setCopieSerie(true);
    } catch (e) {
      setErreur("Copie impossible — sélectionnez le texte à la main.");
    }
    try { window.open(lien(l.linkedin), "_blank", "noopener"); } catch (e) { }
    setOuvertSerie(true);
  }

  // 🆕 LA SERIE AVANCE SANS ATTENDRE — 27/08.
  //
  // Trente messages a la suite, c est trente attentes du serveur. On passe
  // a la fiche suivante immediatement ; l enregistrement suit en
  // arriere-plan. Un echec s affiche sans interrompre la serie : la fiche
  // restera dans « A ecrire » et se retrouvera au prochain passage.
  async function envoyeEtSuivant(l: any) {
    if (!serie) return;
    setErreur("");
    setFaits(faits + 1);
    avancer(serie, rang + 1);

    try {
      const d = await appeler({ base: l.base || base, id: l.id, statut: "relance" });
      if (d.ok) {
        setCompteurs(d.compteurs || null);
      } else {
        setErreur("Une fiche n'a pas pu être enregistrée ("
          + (d.erreur || "cause inconnue")
          + "). Elle restera dans « À écrire ».");
      }
    } catch (e: any) {
      setErreur("Une fiche n'a pas pu être enregistrée : " + String(e)
        + " Elle restera dans « À écrire ».");
    }
  }

  function passerSuivant() {
    if (!serie) return;
    avancer(serie, rang + 1);
  }

  // ---------- FIN DU MODE ENCHAINEMENT ----------

  // 🚨 TROIS FACONS D ENREGISTRER — et « file » est toujours disponible,
  // meme quand le plafond du jour est atteint.
  async function ajouter(mode: string) {
    if (aNom.trim().length < 2) {
      setErreur("Indiquez le nom du contact.");
      return;
    }
    if (aLien.indexOf("linkedin.com") < 0) {
      setErreur("Collez l'adresse complète du profil LinkedIn.");
      return;
    }
    setCharge(true);
    setErreur("");
    setMessage("");
    try {
      const d = await appeler({
        action: "ajouter",
        mode: mode,
        nom: aNom,
        linkedin: aLien,
        organisme: aOrganisme,
        ville: aVille,
        notes: aNotes,
        campagne: aCampagne,
      });
      if (d.ok) {
        setMessage((d.message || "Profil enregistré.")
          + (d.avertissement ? " " + d.avertissement : ""));
        setCompteurs(d.compteurs || null);
        setCreee(d.ajoute || null);
        setANom(""); setALien(""); setAOrganisme(""); setAVille(""); setANotes("");
        setACampagne("academiapro");
        setAjout(false);
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setCharge(false);
  }

  // OUVRIR UN PROFIL — ET RIEN D AUTRE.
  function ouvrirProfil(l: any) {
    try { window.open(lien(l.linkedin), "_blank", "noopener"); } catch (e) { }
    setVu(true);
  }

  // 🚨🚨 LE MARQUAGE EST IMMEDIAT — corrige le 27/08, deux fois.
  //
  // PREMIER DEFAUT. Chaque marquage relancait chargerListe(), qui relit
  // les six tables et rend jusqu a mille lignes. Marquer trois personnes
  // demandait trois rechargements complets.
  //
  // SECOND DEFAUT, apres la premiere correction : l ecran attendait encore
  // la reponse du serveur avant de bouger. Ses mots : « trop d attente ».
  //
  // LA CORRECTION : L AFFICHAGE PRECEDE L ENREGISTREMENT.
  // Le bouton change d etat AVANT l appel. On enchaine sans rien attendre.
  // L appel part en arriere-plan ; s il echoue, on REVIENT EN ARRIERE et
  // on le dit.
  //
  // ⚠️ CE N EST PAS UN MENSONGE A L ECRAN. L etat precedent est conserve
  // et restaure en cas d echec, avec un message explicite. Ce qu on parie,
  // c est que l enregistrement va reussir — ce qui est le cas presque
  // toujours. Le rare echec est visible et rattrapable.
  //
  // ⚠️ NE PAS RETABLIR L ATTENTE. Marquer trente fiches a la suite doit
  // se faire au rythme du doigt, pas a celui du reseau.
  //
  // LES DEUX CAS OU L ON ATTEND QUAND MEME :
  //   - l onglet « Inviter », qui doit charger la fiche suivante
  //   - la recherche globale, ou la ligne vient d ailleurs
  //
  // 🆕 30/08 : le parametre extra transporte date_invitation pour la
  // regularisation datee. Il ne sert que depuis l onglet Inviter.
  async function marquer(l: any, statut: string, cleBase?: string, extra?: any) {
    setErreur("");

    // L onglet Inviter enchaine sur une autre fiche : il faut la reponse
    // du serveur pour savoir laquelle. On attend, mais c est le seul cas.
    if (onglet === "inviter") {
      setCharge(true);
      try {
        const d = await appeler({
          base: cleBase || l.base || base, id: l.id, statut: statut,
          ...(extra || {}),
        });
        if (d.ok) {
          setCompteurs(d.compteurs || null);
          if (d.avertissement) setMessage(d.avertissement);
          poser(d);
        } else {
          setErreur(d.erreur || "Enregistrement impossible.");
          if (d.compteurs) setCompteurs(d.compteurs);
        }
      } catch (e: any) {
        setErreur("Enregistrement impossible : " + String(e));
      }
      setCharge(false);
      return;
    }

    // ---- L AFFICHAGE, TOUT DE SUITE ----

    const cle = cleDe(l);
    const avant = lignes.slice();

    // La fiche quitte-t-elle l onglet ou elle se trouve ?
    const sort =
      (onglet === "attente" && statut !== "invite" && statut !== "invite_nu") ||
      (onglet === "relancer" && statut !== "accepte" && statut !== "accepte_nu") ||
      (onglet === "file") ||
      (onglet === "envoyes" && (statut === "refuse" || statut === "ecarte"));

    if (sort) {
      setLignes(lignes.filter(function (x: any) { return cleDe(x) !== cle; }));
    } else {
      setLignes(lignes.map(function (x: any) {
        return cleDe(x) === cle ? { ...x, linkedin_statut: statut } : x;
      }));
    }

    // ---- L ENREGISTREMENT, EN ARRIERE-PLAN ----

    try {
      const d = await appeler({
        base: cleBase || l.base || base, id: l.id, statut: statut,
      });

      if (d.ok) {
        setCompteurs(d.compteurs || null);
        if (d.avertissement) setMessage(d.avertissement);
      } else {
        // L enregistrement a echoue : on remet la liste comme elle etait.
        setLignes(avant);
        setErreur((d.erreur || "Enregistrement impossible.")
          + " La fiche est revenue à son état précédent.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setLignes(avant);
      setErreur("Enregistrement impossible : " + String(e)
        + " La fiche est revenue à son état précédent.");
    }
  }

  // Marquer la fiche qui vient d etre creee, sans quitter l ecran.
  async function marquerCreee(statut: string) {
    if (!creee) return;
    setCharge(true);
    setErreur("");
    setMessage("");
    try {
      const d = await appeler({ base: "manuel", id: creee.id, statut: statut, sans_suite: true });
      if (d.ok) {
        setCompteurs(d.compteurs || null);
        setCreee({ ...creee, linkedin_statut: statut });
        setMessage((statut === "ecarte"
          ? "Fiche écartée."
          : "Fiche mise à jour : " + statut + ".")
          + (d.avertissement ? " " + d.avertissement : ""));
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setCharge(false);
  }

  function copier(t: string, cle: string) {
    try {
      navigator.clipboard.writeText(t);
      setCopie(cle);
      setTimeout(() => setCopie(""), 2500);
    } catch (e) {
      setErreur("Copie impossible — sélectionnez le texte à la main.");
    }
  }

  function lien(v: string) {
    const t = String(v || "").trim();
    if (!t) return "";
    if (t.indexOf("http") === 0) return t;
    return "https://" + t.replace(/^\/+/, "");
  }

  function appelable(t: string) {
    return String(t || "").replace(/[^0-9+]/g, "");
  }

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  function jolieDate(d: any) {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
  }

  function joursDepuis(d: any) {
    if (!d) return null;
    try { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); } catch (e) { return null; }
  }

  function avecNoteDe(l: any) {
    return l.linkedin_statut === "invite" || l.linkedin_statut === "accepte";
  }

  // Le nom affiche partout : capitalise, jamais en capitales brutes.
  function nomDe(l: any) {
    const complet = ((l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || "")).trim();
    return capitaliser(complet || l.nom || "");
  }

  const OR = "#c8a96e";
  const BLEU = "#448aff";
  const VERT = "#00e676";
  const ORANGE = "#e8a33d";
  // La couleur qui signale une fiche Mr. Comptable dans une liste melangee.
  const COMPTABLE = "#4fc3f7";

  const CARTE: any = {
    background: "#1a1a2e",
    borderRadius: "12px",
    padding: "20px 22px",
    marginBottom: "14px",
    border: "1px solid rgba(200,169,110,0.2)",
  };

  const BOUTON: any = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(200,169,110,0.35)",
    color: OR,
    padding: "11px 20px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Georgia,serif",
  };

  const CHAMP: any = {
    width: "100%", padding: "13px", borderRadius: "9px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.04)", color: "#fff",
    fontSize: "14.5px", lineHeight: "1.75", fontFamily: "Georgia,serif",
    boxSizing: "border-box", resize: "vertical",
  };

  const LIBELLE: any = {
    display: "block", color: OR, fontSize: "12.5px", marginBottom: "5px",
  };

  const plafondJour = compteurs ? (compteurs.reste_jour || 0) <= 0 : false;
  const plafondSemaine = compteurs ? (compteurs.reste_semaine || 0) <= 0 : false;

  // 🚨🚨 LE PLAFOND AVERTIT, IL NE BLOQUE PLUS — corrige le 27/08.
  //
  // LE DEFAUT, ET IL A FAUSSE LES DONNEES. Quand les vingt du jour etaient
  // atteints, les boutons « Invite avec note » et « Invite sans note » se
  // grisaient. Jacques ne pouvait donc plus DECLARER une invitation qu il
  // venait pourtant d envoyer DEPUIS LINKEDIN.
  //
  // Or LinkedIn ne connait pas ce compteur. Une invitation envoyee la-bas
  // EXISTE, que cet ecran l accepte ou non. La refuser ne l annule pas :
  // elle laisse simplement la fiche vide, et le compteur ment dans l autre
  // sens. C est exactement ce qui est arrive a la fiche d Agnes Brunet.
  //
  // LA REGLE : le plafond dit QUAND S ARRETER D ENVOYER. Il n a pas a
  // interdire de consigner ce qui est deja parti. Un ecran qui refuse
  // d enregistrer la realite fabrique des donnees fausses.
  //
  // ⚠️ NE PAS RETABLIR LE BLOCAGE. L avertissement suffit : il est visible,
  // il rappelle le depassement, et il laisse Jacques juge.
  const depasse = plafondJour || plafondSemaine;
  const bloque = false;
  const trop = texte.length > LIMITE_NOTE;

  const ONGLETS = [
    { id: "inviter", nom: "Inviter" },
    { id: "file", nom: "En attente d'invitation" + (compteurs && compteurs.en_file ? " · " + compteurs.en_file : "") },
    { id: "attente", nom: "Mes invitations" + (compteurs && compteurs.en_attente ? " · " + compteurs.en_attente : "") },
    { id: "relancer", nom: "À écrire" + (compteurs && compteurs.en_attente_reponse ? " · " + compteurs.en_attente_reponse : "") },
    { id: "envoyes", nom: "Messages envoyés" + (compteurs && compteurs.relances ? " · " + compteurs.relances : "") },
  ];

  // 🆕 L ETIQUETTE DE CAMPAGNE — 26/08.
  //
  // Dans « A ecrire » et « Messages envoyes », les deux campagnes se
  // melangent. Sans marque visible, on ne sait pas quel message va partir
  // avant de l avoir lu. L etiquette le dit d un coup d oeil.
  // 🆕 CHAQUE FICHE ANNONCE SA CAMPAGNE — 27/08.
  //
  // LE DEFAUT. Seules les fiches cabinets portaient une pastille : la
  // campagne organismes etant la principale, on la tenait pour implicite.
  // Mais Jacques a bascule ses vingt invitations sur les cabinets — la
  // regle implicite s est donc inversee sans que rien ne le dise.
  //
  // LA CORRECTION : les DEUX campagnes sont etiquetees, chacune avec sa
  // couleur. Plus aucune regle a retenir, et l affichage reste juste quel
  // que soit le rapport entre les deux.
  //
  // ⚠️ UNE FICHE MANUELLE PORTE SA CAMPAGNE DANS LA COLONNE campagne de
  // la table crm — pas dans sa base d origine, qui est toujours « manuel ».
  // Sans cette colonne, un expert-comptable trouve sur LinkedIn recevait le
  // message des organismes : le bilan pedagogique et les 560 formations.
  function campagneDe(l: any): string {
    if (l.base === "manuel") {
      return String(l.campagne || "academiapro").toLowerCase();
    }
    return estCabinet(l.base) ? "mrcomptable" : "academiapro";
  }

  function etiquetteCampagne(l: any) {
    const c = campagneDe(l);
    const cab = c === "mrcomptable";
    const manuelle = l.base === "manuel";

    return (
      <span style={{
        display: "inline-block", marginLeft: "8px", padding: "2px 9px",
        borderRadius: "20px", fontSize: "11px", letterSpacing: "0.5px",
        background: cab ? "rgba(79,195,247,0.15)" : "rgba(200,169,110,0.15)",
        color: cab ? COMPTABLE : OR,
        // Le trait interrompu signale une fiche saisie a la main : elle
        // ne vient d aucune base de prospection.
        border: (manuelle ? "1px dashed " : "1px solid ")
          + (cab ? "rgba(79,195,247,0.55)" : "rgba(200,169,110,0.55)"),
        verticalAlign: "middle",
      }}>
        {cab ? "Mr. Comptable" : "AcadéMIA Pro"}
      </span>
    );
  }

  // LES BOUTONS D UN RESULTAT DE RECHERCHE.
  //
  // Ils ne s affichent QUE si la fiche porte un profil LinkedIn et n est
  // pas deja ecartee. Sur une fiche ecartee, on ne propose rien : c est
  // exactement le geste qui ressusciterait un doublon.
  // ---------------------------------------------------------------------------
  // 🆕 OU SE TROUVE CETTE FICHE — 01/09.
  //
  // LE BESOIN, DIT PAR JACQUES : « la recherche globale devrait m indiquer
  // ou se trouve la fiche et sur quelle categorie ». Elle disait la BASE
  // (organismes, cabinets) mais pas l ONGLET — donc pas ou la retrouver en
  // naviguant.
  //
  // ⚠️ L INFORMATION N EST PAS STOCKEE, ELLE SE DEDUIT. Aucune colonne ne
  // dit « cette fiche est dans A ecrire » : c est le statut LinkedIn qui
  // decide de l onglet ou elle apparait. La regle ci-dessous doit donc
  // rester alignee sur les actions en_attente, a_relancer et envoyes de la
  // route — si l une change, celle-ci change aussi.
  function ongletDe(l: any): { nom: string; teinte: string } {
    const statut = String(l.linkedin_statut || "");
    const aProfil = String(l.linkedin || "").trim().length > 0;

    if (statut === "ecarte") {
      return { nom: "Écartée — hors file", teinte: "rgba(255,255,255,0.4)" };
    }
    if (statut === "refuse") {
      return { nom: "Sans suite", teinte: "#e8836a" };
    }
    if (statut === "relance") {
      return { nom: "Messages envoyés", teinte: ORANGE };
    }
    if (statut === "accepte" || statut === "accepte_nu") {
      return { nom: "À écrire", teinte: VERT };
    }
    if (statut === "invite" || statut === "invite_nu") {
      return { nom: "Mes invitations", teinte: BLEU };
    }
    // Ni statut ni date : la fiche attend d etre invitee. Elle n apparait
    // dans l onglet Inviter QUE si elle porte un profil — sans profil,
    // elle n est nulle part et c est precisement ce qu il faut dire.
    if (aProfil) {
      return { nom: "Inviter — jamais sollicitée", teinte: OR };
    }
    return { nom: "Aucun onglet — profil LinkedIn manquant", teinte: "rgba(255,255,255,0.4)" };
  }

  function actionsRecherche(cleBase: string, l: any) {
    const cle = cleBase + "-" + l.id;
    const occupe = partoutOccupe === cle;
    const statut = String(l.linkedin_statut || "");

    // 🚨 UNE FICHE ECARTEE DOIT POUVOIR REVENIR — corrige le 01/09.
    //
    // CE QUI SE PASSAIT. L ecran affichait « aucune action proposee » et
    // enfermait la fiche pour toujours. Or on ecarte par erreur, ou on
    // ecarte a raison une societe qui redevient pertinente six mois plus
    // tard. Rien ne justifie que ce soit definitif.
    //
    // ⚠️ REMETTRE EN FILE N INVITE PERSONNE : la fiche repart a l etat
    // « jamais sollicitee », statut et date effaces. C est la route qui
    // s en charge, via l action remettre_en_file.
    if (statut === "ecarte") {
      return (
        <div style={{ marginTop: "9px" }}>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.7", margin: "0 0 8px" }}>
            Fiche écartée — elle ne ressort plus dans la file d'invitation.
          </p>
          <button
            onClick={() => remettreEnFile(cleBase, l)}
            disabled={occupe}
            style={{
              padding: "9px 15px", borderRadius: "8px", fontSize: "12.5px",
              fontFamily: "Georgia,serif", cursor: occupe ? "wait" : "pointer",
              background: "rgba(200,169,110,0.13)", color: OR,
              border: "1px solid rgba(200,169,110,0.4)",
            }}
          >
            {occupe ? "…" : "↺ Remettre dans la file"}
          </button>
        </div>
      );
    }

    const enAttente = statut === "invite" || statut === "invite_nu";
    const dejaAccepte = statut === "accepte" || statut === "accepte_nu" || statut === "relance";

    if (dejaAccepte) {
      return (
        <p style={{ color: VERT, fontSize: "12.5px", lineHeight: "1.7", margin: "9px 0 0" }}>
          A déjà accepté — sa fiche est dans « À écrire » ou « Messages envoyés ».
        </p>
      );
    }

    const petit: any = {
      padding: "9px 13px", borderRadius: "8px", fontSize: "12.5px",
      fontFamily: "Georgia,serif", cursor: occupe ? "wait" : "pointer",
      flex: "1 1 130px",
    };

    // ⚠️ SANS PROFIL LINKEDIN, ON NE PEUT PAS DECLARER UNE INVITATION —
    // il n y aurait rien a ouvrir. La fiche peut en revanche etre ecartee.
    const sansProfil = !String(l.linkedin || "").trim();

    return (
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "10px" }}>
        {enAttente && (
          <button
            onClick={() => marquerDepuisRecherche(cleBase, l, statut === "invite" ? "accepte" : "accepte_nu")}
            disabled={occupe}
            style={{ ...petit, background: "rgba(0,230,118,0.15)", color: VERT, border: "1px solid rgba(0,230,118,0.45)", fontWeight: "bold" }}
          >
            ✓ A accepté
          </button>
        )}
        {/* 🚨 LE CHAMP QUI MANQUAIT — 01/09.
            LE DEFAUT : le message renvoyait vers « la fiche complete »,
            qui n existait pas dans la recherche globale. On constatait
            l absence de profil sans pouvoir y remedier.
            LE CAS REEL : Jacques invite quelqu un DEPUIS LinkedIn, puis
            veut rattacher ce profil a la fiche de prospection qu il a en
            base. Sans ce champ, la fiche restait muette pour toujours. */}
        {!enAttente && sansProfil && (
          <div style={{ flex: "1 1 100%" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: "1.7", margin: "0 0 7px" }}>
              Aucun profil LinkedIn sur cette fiche. Collez son adresse pour
              pouvoir l&apos;inviter — ou déclarer qu&apos;elle l&apos;a déjà été.
            </p>
            <input
              value={profilSaisi[cle] !== undefined ? profilSaisi[cle] : ""}
              onChange={(e) => setProfilSaisi({ ...profilSaisi, [cle]: e.target.value })}
              placeholder="https://www.linkedin.com/in/…"
              style={{ ...CHAMP, marginBottom: "8px", fontSize: "13px", padding: "10px 12px" }}
            />
            <button
              onClick={() => enregistrerProfil(cleBase, l)}
              disabled={occupe || !String(profilSaisi[cle] || "").trim()}
              style={{
                ...petit, flex: "1 1 100%",
                background: String(profilSaisi[cle] || "").trim()
                  ? "rgba(200,169,110,0.18)" : "rgba(255,255,255,0.05)",
                color: String(profilSaisi[cle] || "").trim() ? OR : "rgba(255,255,255,0.3)",
                border: "1px solid " + (String(profilSaisi[cle] || "").trim()
                  ? "rgba(200,169,110,0.45)" : "rgba(255,255,255,0.12)"),
                fontWeight: "bold",
              }}
            >
              {occupe ? "…" : "Enregistrer le profil"}
            </button>
          </div>
        )}
        {!enAttente && !sansProfil && (
          <>
            <button
              onClick={() => marquerDepuisRecherche(cleBase, l, "invite")}
              disabled={occupe || bloque}
              style={{ ...petit, background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.4)") }}
            >
              Invité avec note
            </button>
            <button
              onClick={() => marquerDepuisRecherche(cleBase, l, "invite_nu")}
              disabled={occupe || bloque}
              style={{ ...petit, background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.4)") }}
            >
              Invité sans note
            </button>
          </>
        )}
        <button
          onClick={() => marquerDepuisRecherche(cleBase, l, "ecarte")}
          disabled={occupe}
          style={{ ...petit, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.15)", flex: "1 1 90px" }}
        >
          Écarter
        </button>
      </div>
    );
  }

  // LE BLOC « CHERCHER PARTOUT ».
  function blocPartout() {
    // Un meme dirigeant peut figurer dans plusieurs bases. On le signale :
    // c est ainsi qu on evite d inviter deux fois la meme personne.
    const compteParPersonne: any = {};
    if (partoutResultat) {
      for (const b of (partoutResultat.bases || [])) {
        for (const l of (b.lignes || [])) {
          const k = aplatir((l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || ""));
          if (k.length < 3) continue;
          compteParPersonne[k] = (compteParPersonne[k] || 0) + 1;
        }
      }
    }

    return (
      <div style={{ ...CARTE, borderColor: partoutOuvert ? "rgba(68,138,255,0.45)" : "rgba(255,255,255,0.12)", padding: partoutOuvert ? "20px 22px" : "14px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ flex: "1 1 220px" }}>
            <div style={{ color: partoutOuvert ? BLEU : "rgba(255,255,255,0.7)", fontSize: "14.5px", fontWeight: "bold" }}>
              🔎 Chercher partout
            </div>
            {partoutOuvert && (
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", marginTop: "3px", lineHeight: "1.7" }}>
                Un nom, une société, une ville, un SIREN, un téléphone. Votre file LinkedIn
                et les bases de prospection sont interrogées d'un coup.
              </div>
            )}
          </div>
          <button
            onClick={() => { setPartoutOuvert(!partoutOuvert); setPartoutErreur(""); }}
            style={{ ...BOUTON, padding: "9px 18px", fontSize: "13px", color: partoutOuvert ? "rgba(255,255,255,0.5)" : BLEU, borderColor: partoutOuvert ? "rgba(255,255,255,0.18)" : "rgba(68,138,255,0.45)" }}
          >
            {partoutOuvert ? "Replier" : "Ouvrir"}
          </button>
        </div>

        {partoutOuvert && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              <input
                value={partoutTerme}
                onChange={(e) => setPartoutTerme(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") chercherPartout(); }}
                placeholder="Alexandre Cocco, EDAA, Reims, 811616374…"
                style={{ ...CHAMP, flex: "1 1 240px", padding: "12px 14px" }}
              />
              <button
                onClick={() => chercherPartout()}
                disabled={partoutCharge}
                style={{ background: partoutCharge ? "rgba(255,255,255,0.06)" : BLEU, color: partoutCharge ? "rgba(255,255,255,0.4)" : "#fff", border: "none", borderRadius: "9px", padding: "12px 24px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: partoutCharge ? "wait" : "pointer" }}
              >
                {partoutCharge ? "Recherche…" : "Chercher"}
              </button>
              {(partoutResultat || partoutTerme) && (
                <button onClick={viderPartout} style={{ ...BOUTON, padding: "12px 20px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                  Effacer
                </button>
              )}
            </div>

            {partoutMessage && (
              <div style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.4)", borderRadius: "9px", padding: "12px", margin: "12px 0 0", color: VERT, fontSize: "13px", lineHeight: "1.7" }}>
                {partoutMessage}
              </div>
            )}

            {partoutErreur && (
              <p style={{ color: "#e8836a", fontSize: "13px", lineHeight: "1.7", margin: "11px 0 0" }}>
                {partoutErreur}
              </p>
            )}

            {partoutResultat && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: partoutResultat.total_trouve === 0 ? "#e8836a" : VERT, fontSize: "13.5px", lineHeight: "1.7", margin: "0 0 13px" }}>
                  {partoutResultat.total_trouve === 0
                    ? "Rien trouvé pour « " + partoutResultat.terme + " »."
                    : nombre(partoutResultat.total_trouve) + " résultat(s) pour « " + partoutResultat.terme + " »."}
                </p>

                {(partoutResultat.bases || []).map(function (b: any) {
                  if (!b.trouves && !b.erreur) return null;
                  return (
                    <div key={b.cle} style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid rgba(200,169,110,0.22)" }}>
                        <span style={{ color: OR, fontSize: "12.5px", letterSpacing: "1.5px" }}>
                          {String(b.titre || "").toUpperCase()}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                          {b.erreur ? "lecture impossible" : nombre(b.trouves) + " trouvé(s)"}
                          {b.trouves > 20 ? " · 20 affichés" : ""}
                        </span>
                      </div>

                      {b.erreur ? (
                        <p style={{ color: "#e8836a", fontSize: "12.5px", lineHeight: "1.7", margin: 0 }}>
                          {b.erreur}
                        </p>
                      ) : (
                        (b.lignes || []).map(function (l: any) {
                          const nomComplet = nomDe(l);
                          const k = aplatir((l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || ""));
                          const enDouble = k.length >= 3 && compteParPersonne[k] > 1;
                          return (
                            <div key={b.cle + "-" + l.id} style={{ padding: "11px 13px", background: "rgba(255,255,255,0.03)", border: "1px solid " + (enDouble ? "rgba(232,163,61,0.45)" : "rgba(255,255,255,0.08)"), borderRadius: "8px", marginBottom: "7px" }}>
                              <div style={{ color: "#fff", fontSize: "14.5px", fontWeight: "bold" }}>
                                {capitaliser(l.raison_sociale) || "—"}
                                {etiquetteCampagne({ base: b.cle })}
                              </div>
                              <div style={{ color: OR, fontSize: "13px", marginTop: "2px" }}>
                                {nomComplet || "dirigeant inconnu"}
                              </div>
                              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px", lineHeight: "1.7" }}>
                                {capitaliser(l.ville) || "ville inconnue"}
                                {l.code_postal ? " · " + l.code_postal : ""}
                                {l.siren ? " · SIREN " + l.siren : ""}
                                {l.statut === "envoye" ? " · courriel envoyé le " + jolieDate(l.envoye_le) : ""}
                                {l.desabonne ? " · DÉSABONNÉ" : ""}
                              </div>

                              {/* 🚨 LE MESSAGE CONSEILLAIT D ECARTER — corrige le 01/09.
                                  LE DEFAUT CONSTATE PAR JACQUES : Sebastien Forges dirige
                                  Noscome ET Cmexpert, deux SIREN differents, deux societes
                                  reelles. La detection ne compare QUE le prenom et le nom :
                                  elle criait au doublon et invitait a supprimer un prospect
                                  legitime.
                                  ⚠️ CE N EST PAS UN DOUBLON, C EST LA MEME PERSONNE DANS
                                  DEUX STRUCTURES. Le seul risque reel est de lui envoyer
                                  deux invitations LinkedIn — c est cela qu il faut dire, et
                                  rien de plus. */}
                              {enDouble && (
                                <div style={{ color: ORANGE, fontSize: "12px", marginTop: "6px", lineHeight: "1.7" }}>
                                  ⚠️ Ce dirigeant apparaît sur plusieurs fiches — souvent deux
                                  sociétés qu'il dirige. Vérifiez le SIREN : n'envoyez qu'une
                                  seule invitation LinkedIn, mais ne supprimez pas la seconde
                                  fiche, elle peut être un vrai prospect.
                                </div>
                              )}

                              {(l.email || l.telephone) && (
                                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "7px", fontSize: "12.5px" }}>
                                  {l.email && (
                                    <a href={"mailto:" + l.email} style={{ color: BLEU, textDecoration: "none" }}>
                                      ✉️ {l.email}
                                    </a>
                                  )}
                                  {l.telephone && (
                                    <a href={"tel:" + appelable(l.telephone)} style={{ color: BLEU, textDecoration: "none" }}>
                                      ☎️ {l.telephone}
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* 🚨 LE LIEN ET L ETAT NE S AFFICHENT QUE S IL Y A UN
                                  PROFIL. Sans adresse LinkedIn, il n y a rien a ouvrir. */}
                              {b.porte_linkedin && l.linkedin && (
                                <div style={{ marginTop: "8px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                                  <a href={lien(l.linkedin)} target="_blank" rel="noreferrer"
                                    style={{ color: BLEU, fontSize: "12.5px", textDecoration: "none" }}>
                                    Ouvrir le profil LinkedIn ↗
                                  </a>
                                  <span style={{ color: l.linkedin_statut ? VERT : "rgba(255,255,255,0.35)", fontSize: "12px" }}>
                                    {l.linkedin_statut
                                      ? l.linkedin_statut + (l.linkedin_le ? " le " + jolieDate(l.linkedin_le) : "")
                                      : "jamais sollicité"}
                                  </span>
                                </div>
                              )}

                              {/* 🆕 OU SE TROUVE CETTE FICHE — 01/09.
                                  Sans cette ligne, la recherche disait dans quelle
                                  BASE etait la fiche, mais pas dans quel ONGLET —
                                  donc pas ou la retrouver en naviguant. */}
                              {(() => {
                                const o = ongletDe(l);
                                return (
                                  <div style={{ marginTop: "7px", fontSize: "12px" }}>
                                    <span style={{ color: "rgba(255,255,255,0.35)" }}>Où : </span>
                                    <span style={{ color: o.teinte, fontWeight: "bold" }}>{o.nom}</span>
                                  </div>
                                );
                              })()}

                              {/* 🆕 LE PARCOURS, CLIQUABLE ICI AUSSI — 01/09.
                                  Il ne s affiche que sur les fiches deja engagees ;
                                  blocParcours rend null pour les autres. */}
                              {/* 🚨 PAS D APPEL DIRECT A blocParcours ICI —
                                  corrige le 01/09. blocFiche l affiche deja en
                                  tete de son bloc replie : appeler les deux
                                  faisait apparaitre LE PARCOURS EN DOUBLE sur
                                  chaque resultat de recherche. */}

                              {/* 🆕 LA FICHE COMPLETE, MODIFIABLE DEPUIS LA RECHERCHE
                                  — 01/09.
                                  LE BESOIN DE JACQUES : « la recherche globale devrait
                                  me donner la possibilite d atteindre la fiche
                                  concernee et de la modifier a partir de la recherche
                                  globale ».
                                  ⚠️ blocFiche EST LE MEME BLOC QUE DANS LES AUTRES
                                  ONGLETS. On le reutilise plutot que d en ecrire un
                                  second : deux blocs a maintenir finiraient par
                                  diverger. Il attend une ligne portant `base`, que la
                                  recherche ne pose pas — on l ajoute a la volee. */}
                              {/* Meme raison : une fiche se corrige quelle que
                                  soit la maniere dont on a contacte la personne. */}
                              {blocFiche({ ...l, base: b.cle })}

                              {/* 🚨 LES ACTIONS SONT SORTIES DE CETTE CONDITION —
                                  corrige le 01/09.
                                  LE DEFAUT CONSTATE PAR JACQUES : « impossible de
                                  modifier la fiche pour la passer en invitation
                                  acceptée ». Les boutons existaient, mais ils etaient
                                  enfermes dans la condition `l.linkedin` : une fiche
                                  SANS profil LinkedIn n en montrait aucun, donc rien
                                  ne pouvait etre corrige — pas meme un ecart a
                                  defaire.
                                  ⚠️ CE QUI RESTE CONDITIONNE : la base doit porter les
                                  colonnes LinkedIn (b.porte_linkedin). Sans elles, la
                                  route n aurait rien a ecrire. */}
                              {actionsRecherche(b.cle, l)}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // LA FICHE QUI VIENT D ETRE CREEE.
  function blocCreee() {
    if (!creee) return null;
    const statut = String(creee.linkedin_statut || "");
    const enAttente = statut === "invite" || statut === "invite_nu";
    return (
      <div style={{ ...CARTE, borderColor: "rgba(0,230,118,0.45)", background: "rgba(0,230,118,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          <span style={{ color: VERT, fontSize: "12px", letterSpacing: "2px" }}>
            FICHE ENREGISTRÉE
          </span>
          <button onClick={() => setCreee(null)}
            style={{ ...BOUTON, padding: "7px 14px", fontSize: "12px", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
            Fermer
          </button>
        </div>

        <div style={{ color: "#fff", fontSize: "17px", fontWeight: "bold" }}>
          {capitaliser(creee.nom) || nomDe(creee)}
        </div>
        <div style={{ color: OR, fontSize: "14px", marginTop: "2px" }}>
          {capitaliser(creee.raison_sociale || creee.organisme) || "—"}
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
          {capitaliser(creee.ville) || "ville inconnue"}
          {" · "}
          {statut ? statut : "en attente d'invitation"}
        </div>
        {coordonnees(creee)}

        <button
          onClick={() => { try { window.open(lien(creee.linkedin), "_blank", "noopener"); } catch (e) { } }}
          style={{ width: "100%", background: BLEU, color: "#fff", border: "none", borderRadius: "9px", padding: "13px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer", marginTop: "12px" }}>
          Ouvrir le profil LinkedIn ↗
        </button>

        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "9px" }}>
          {enAttente ? (
            <button onClick={() => marquerCreee(statut === "invite" ? "accepte" : "accepte_nu")} disabled={false}
              style={{ flex: "2 1 180px", background: "rgba(0,230,118,0.15)", color: VERT, border: "1px solid rgba(0,230,118,0.45)", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
              ✓ A accepté
            </button>
          ) : (
            <>
              <button onClick={() => marquerCreee("invite")} disabled={charge || bloque}
                style={{ flex: "1 1 150px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.4)"), borderRadius: "8px", padding: "11px", fontSize: "13px", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                Invité avec note
              </button>
              <button onClick={() => marquerCreee("invite_nu")} disabled={charge || bloque}
                style={{ flex: "1 1 150px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.4)"), borderRadius: "8px", padding: "11px", fontSize: "13px", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                Invité sans note
              </button>
            </>
          )}
        </div>

        {blocFiche(creee)}
      </div>
    );
  }

  function barreRecherche() {
    return (
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un nom, un organisme, une ville, une observation…"
            style={{ ...CHAMP, flex: "1 1 280px", padding: "12px 14px" }}
          />
          {recherche && (
            <button onClick={() => setRecherche("")} style={{ ...BOUTON, padding: "12px 20px" }}>
              Effacer
            </button>
          )}
        </div>
        {recherche && (
          <p style={{ color: filtrees.length === 0 ? "#e8836a" : "rgba(255,255,255,0.5)", fontSize: "13px", margin: "9px 0 0" }}>
            {filtrees.length === 0
              ? "Aucune fiche ne correspond à « " + recherche + " »."
              : filtrees.length + " fiche(s) sur " + lignes.length}
          </p>
        )}
      </div>
    );
  }

  function coordonnees(l: any) {
    const bouts: any[] = [];
    if (l.email) {
      bouts.push(
        <a key="m" href={"mailto:" + l.email} style={{ color: BLEU, textDecoration: "none" }}>
          ✉️ {l.email}
        </a>
      );
    }
    if (l.telephone) {
      bouts.push(
        <a key="t" href={"tel:" + appelable(l.telephone)} style={{ color: BLEU, textDecoration: "none" }}>
          ☎️ {l.telephone}
        </a>
      );
    }
    if (l.site_web) {
      bouts.push(
        <a key="s" href={lien(l.site_web)} target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
          🌐 {l.site_web}
        </a>
      );
    }
    if (bouts.length === 0) return null;
    return (
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "7px", fontSize: "12.5px" }}>
        {bouts}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 🆕 LE DEROULEMENT CHRONOLOGIQUE — 01/09.
  //
  // LE BESOIN, DIT PAR JACQUES : « un deroulement chronologique de
  // "invitation envoyee sans note" a "invitation acceptee", puis "message
  // envoye", puis "a repondu", ensuite "RDV pris" et "nouveau client" ».
  //
  // CE QUE CA CHANGE. Les deux encadres du haut donnent la vue d ensemble —
  // combien, quel taux. Celui-ci repond a une autre question, fiche par
  // fiche : OU EN EST CETTE PERSONNE ? On le lit d un coup d oeil au lieu
  // de reconstituer mentalement a partir d un statut et de deux dates.
  //
  // 🚨 LES SIX ETAPES NE SONT PAS SIX STATUTS EN BASE. LinkedIn n en connait
  // que quatre : invite, accepte, relance, refuse. Les trois derniers etats
  // — a repondu, rendez-vous, client — se deduisent du SCORE COMMERCIAL,
  // pose par les modes d enregistrement (70 pour une reponse, 85 pour un
  // rendez-vous) et par le statut CRM pour un client.
  //
  // ⚠️ NE PAS INVENTER DE STATUT LINKEDIN POUR CES TROIS ETAPES. Le statut
  // decrit la relation LinkedIn ; le score decrit l avancement commercial.
  // Les melanger fausserait les compteurs d acceptation.
  //
  // ⚠️ UNE ETAPE FRANCHIE NE SE DEFRANCHIT PAS. Le parcours est cumulatif :
  // qui a un rendez-vous a forcement repondu, donc recu un message, donc
  // accepte. On calcule le rang atteint, et tout ce qui precede est acquis.
  // Les deux premiers libelles changent selon le canal : « Invitation
  // envoyee » n a pas de sens pour quelqu un contacte par courriel.
  function etapesDe(l: any) {
    const parCourriel = !String(l.linkedin || "").trim() && !!l.envoye_le;
    if (!parCourriel) return ETAPES;
    return [
      { cle: "invite", nom: "Courriel envoyé" },
      { cle: "accepte", nom: "Premier échange" },
      { cle: "message", nom: "Relance envoyée" },
      { cle: "repondu", nom: "A répondu" },
      { cle: "rdv", nom: "Rendez-vous pris" },
      { cle: "client", nom: "Nouveau client" },
    ];
  }

  const ETAPES = [
    { cle: "invite", nom: "Invitation envoyée" },
    { cle: "accepte", nom: "Invitation acceptée" },
    { cle: "message", nom: "Message envoyé" },
    { cle: "repondu", nom: "A répondu" },
    { cle: "rdv", nom: "Rendez-vous pris" },
    { cle: "client", nom: "Nouveau client" },
  ];

  // Le rang atteint, de 0 (rien) a 6 (client). Chaque test remonte le rang :
  // on ne redescend jamais.
  function rangAtteint(l: any): number {
    const statut = String(l.linkedin_statut || "");
    const score = Number(l.score) || 0;
    const statutCrm = String(l.statut || "");

    let rang = 0;

    // 1. LE PREMIER CONTACT EST PARTI — par invitation LinkedIn OU par
    //    courriel. C est le second cas qui manquait : une fiche contactee
    //    par courriel restait au rang 0, donc sans parcours affiche.
    if (l.linkedin_le || l.envoye_le
        || statut === "invite" || statut === "invite_nu") rang = 1;

    // 2. Elle a ete acceptee. « relance » suppose l acceptation : on
    //    n ecrit qu a une relation etablie.
    if (statut === "accepte" || statut === "accepte_nu" || statut === "relance") rang = 2;

    // 3. Le message est parti — la date de relance en est la trace.
    if (l.linkedin_relance_le || statut === "relance") rang = 3;

    // 4, 5. La reponse et le rendez-vous se lisent dans le score, pose par
    //    les modes d enregistrement de l onglet Inviter.
    if (score >= 70) rang = 4;
    if (score >= 85) rang = 5;

    // 6. Client : c est le statut CRM qui fait foi, pas le score.
    if (statutCrm === "client") rang = 6;

    return rang;
  }

  // ⚠️ UN REFUS N EST PAS UNE ETAPE, C EST UNE SORTIE. L afficher comme un
  // rang intermediaire laisserait croire que le parcours continue.
  function estSorti(l: any): boolean {
    const statut = String(l.linkedin_statut || "");
    return statut === "refuse" || statut === "ecarte"
      || String(l.statut || "") === "perdu";
  }

  // ---------------------------------------------------------------------------
  // 🚨 CORRIGER L ETAPE — DANS LES DEUX SENS. 01/09.
  //
  // LE BESOIN DE JACQUES : le parcours doit AVANCER quand le contact
  // progresse, et RECULER quand on s est trompe de bouton. Un outil qui ne
  // sait aller que dans un sens finit par mentir.
  //
  // ⚠️ CETTE FONCTION A DEJA ETE PERDUE UNE FOIS, le 01/09, en
  // reconstruisant le fichier depuis une version anterieure. Si elle
  // disparait, le parcours redevient decoratif : les pastilles s affichent
  // mais aucun clic ne fait rien. VERIFIER SA PRESENCE APRES TOUTE
  // REECRITURE DU FICHIER.
  //
  // COMMENT ON DEPLACE, ET POURQUOI C EST PLUS QU UN STATUT. Les trois
  // dernieres etapes ne sont pas des statuts LinkedIn : elles se deduisent
  // du SCORE commercial. Deplacer suppose donc de reposer LES DEUX — le
  // statut ET le score — sinon la fiche saute d un cran a l ecran et
  // revient au prochain calcul.
  //
  // ⚠️ LES DATES REELLES NE SONT PAS EFFACEES. Une invitation partie le
  // 30/08 est partie : passer de « message envoye » a « invitation
  // acceptee » ne supprime pas linkedin_le. Effacer une date vraie serait
  // reecrire l histoire et fausserait les compteurs de la semaine.
  //
  // ⚠️ ON NE DESCEND PAS SOUS L INVITATION. Le rang 1 est le plancher :
  // une fiche invitee l a ete. Pour tout annuler, il y a « Ecarter ».
  async function corrigerEtape(l: any, rangVoulu: number) {
    if (rangVoulu < 1 || rangVoulu > 6) return;
    const cle = cleDe(l);

    // Le statut LinkedIn correspondant au rang vise. Les rangs 4, 5 et 6
    // restent en « relance » : cote LinkedIn la relation n a pas change,
    // c est le score qui porte l avancement commercial.
    const parRang: any = {
      1: { statut: avecNoteDe(l) ? "invite" : "invite_nu", score: 45 },
      2: { statut: avecNoteDe(l) ? "accepte" : "accepte_nu", score: 60 },
      3: { statut: "relance", score: 65 },
      4: { statut: "relance", score: 70 },
      5: { statut: "relance", score: 85 },
      6: { statut: "relance", score: 95 },
    };

    const cible = parRang[rangVoulu];
    if (!cible) return;

    setCharge(true);
    setErreur("");
    setMessage("");
    try {
      const d = await appeler({
        action: "corriger_etape",
        base: l.base || base,
        id: l.id,
        statut: cible.statut,
        score: cible.score,
        // 🚨 LE RANG EST TRANSMIS TEL QUEL. La route en a besoin pour poser
        // le statut CRM (« client » au rang 6) et pour savoir s il faut
        // effacer la date de message quand on redescend sous le rang 3.
        rang: rangVoulu,
      });

      if (d.ok) {
        setMessage(d.message || "Étape corrigée.");
        setRetourEtape({ [cle]: { ok: true, texte: d.message || "Étape enregistrée." } });
        if (d.compteurs) setCompteurs(d.compteurs);

        // 🚨 LA PASTILLE NE SUIVAIT PAS LE MESSAGE — corrige le 01/09.
        //
        // LE DEFAUT CONSTATE PAR JACQUES : « ca a bien indique en vert que
        // le rendez-vous a ete pris, mais la pastille est restee grisee ».
        // L enregistrement reussissait, l affichage ne se rafraichissait
        // pas.
        //
        // POURQUOI. chargerListe() etait appele meme depuis l onglet
        // « Inviter », qui n a pas de liste — il ne relisait donc rien. Et
        // la recherche n etait relancee que si un resultat existait deja :
        // la condition regardait partoutResultat, qui pouvait etre vide au
        // moment du test.
        //
        // LA CORRECTION : on relance CE QUI EST OUVERT. Une recherche en
        // cours se relit toujours ; la liste ne se relit que dans les
        // onglets qui en ont une.
        if (partoutTerme.trim().length >= 2) {
          await chercherPartout();
        }
        if (onglet !== "inviter") {
          await chargerListe();
        }
      } else {
        const t = d.erreur || "Correction impossible.";
        setErreur(t);
        setRetourEtape({ [cle]: { ok: false, texte: t } });
      }
    } catch (e: any) {
      const t = "Correction impossible : " + String(e);
      setErreur(t);
      setRetourEtape({ [cle]: { ok: false, texte: t } });
    }
    setCharge(false);
  }

  function blocParcours(l: any) {
    const rang = rangAtteint(l);
    const sorti = estSorti(l);

    // Une fiche jamais sollicitee n a pas de parcours a montrer : afficher
    // six pastilles grises n apprendrait rien.
    if (rang === 0 && !sorti) return null;

    const teinte = campagneDe(l) === "mrcomptable" ? COMPTABLE : OR;

    return (
      <div style={{
        marginTop: "12px", padding: "12px 14px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "9px",
      }}>
        <div style={{
          color: "rgba(255,255,255,0.4)", fontSize: "11px",
          letterSpacing: "1.5px", marginBottom: "10px",
        }}>
          OÙ EN EST CE CONTACT
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0" }}>
          {etapesDe(l).map(function (e, i) {
            const franchie = (i + 1) <= rang;
            const courante = (i + 1) === rang;
            const derniere = i === etapesDe(l).length - 1;

            return (
              <div key={e.cle} style={{
                display: "flex", alignItems: "center",
                flex: "0 0 auto", marginBottom: "6px",
              }}>
                {/* 🚨 CHAQUE ETAPE EST UN BOUTON, DANS LES DEUX SENS.
                    Toucher une etape y amene la fiche : en avant quand le
                    contact progresse, en arriere quand on s est trompe de
                    bouton. C est la demande explicite de Jacques.
                    ⚠️ SUR UNE FICHE SORTIE (refus, ecartee), le parcours
                    n est pas cliquable : la faire avancer n aurait pas de
                    sens, et la ressusciter par megarde non plus. */}
                {/* 🚨 CLIQUABLE MEME SUR UNE FICHE SORTIE — 01/09.
                    Un refus se defait comme le reste : toucher une etape
                    ramene la fiche dans le parcours. Le seul geste
                    irreversible de l ecran est la suppression. */}
                <button
                  onClick={() => corrigerEtape(l, i + 1)}
                  disabled={charge}
                  title="Amener la fiche à cette étape"
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: "transparent", border: "none",
                    padding: "3px 2px", margin: 0,
                    cursor: "pointer",
                    fontFamily: "Georgia,serif",
                  }}
                >
                  {/* La pastille : pleine si franchie, cerclee sinon. */}
                  <span style={{
                    width: "15px", height: "15px", borderRadius: "50%",
                    flexShrink: 0, display: "inline-block",
                    background: franchie ? (sorti ? "#e8836a" : teinte) : "transparent",
                    border: franchie
                      ? "none"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    boxShadow: courante && !sorti
                      ? "0 0 0 3px " + teinte + "33"
                      : "none",
                  }} />
                  <span style={{
                    fontSize: "12px", whiteSpace: "nowrap",
                    color: franchie
                      ? (sorti ? "#e8836a" : "rgba(255,255,255,0.85)")
                      : "rgba(255,255,255,0.3)",
                    fontWeight: courante ? "bold" : "normal",
                    textDecoration: "underline",
                    textDecorationColor: "rgba(255,255,255,0.12)",
                    textUnderlineOffset: "3px",
                  }}>
                    {e.nom}
                  </span>
                </button>

                {/* Le trait de liaison, absent apres la derniere etape. */}
                {!derniere && (
                  <span style={{
                    width: "18px", height: "1.5px", margin: "0 8px",
                    flexShrink: 0,
                    background: (i + 2) <= rang
                      ? (sorti ? "rgba(232,131,106,0.5)" : teinte + "88")
                      : "rgba(255,255,255,0.12)",
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Sans cette ligne, personne ne devine que les etapes sont
            cliquables. Masquee sur une fiche sortie, ou le parcours est
            fige. */}
        <div style={{
          color: "rgba(255,255,255,0.3)", fontSize: "11.5px",
          lineHeight: "1.7", marginTop: "6px",
        }}>
          {sorti
            ? "Touchez une étape pour rouvrir cette fiche."
            : "Touchez une étape pour y amener la fiche — en avant comme en arrière."}
        </div>

        {/* 🆕 LE RETOUR, SOUS LES PASTILLES — 01/09.
            Les messages generaux s affichent en haut de page : sur une
            liste longue, ils sont invisibles depuis la fiche. Celui-ci
            apparait la ou le regard se trouve deja. */}
        {retourEtape[cleDe(l)] && (
          <div style={{
            marginTop: "8px", padding: "8px 11px", borderRadius: "7px",
            fontSize: "12px", lineHeight: "1.6",
            background: retourEtape[cleDe(l)].ok
              ? "rgba(0,230,118,0.12)" : "rgba(232,131,106,0.12)",
            border: "1px solid " + (retourEtape[cleDe(l)].ok
              ? "rgba(0,230,118,0.4)" : "rgba(232,131,106,0.4)"),
            color: retourEtape[cleDe(l)].ok ? VERT : "#e8836a",
          }}>
            {retourEtape[cleDe(l)].texte}
          </div>
        )}

        {/* Les dates connues, sous le parcours. Elles disent QUAND, la ou
            les pastilles disent OU. */}
        {(l.linkedin_le || l.linkedin_relance_le) && (
          <div style={{
            color: "rgba(255,255,255,0.4)", fontSize: "11.5px",
            lineHeight: "1.8", marginTop: "8px",
            paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            {l.linkedin_le ? "Invitée le " + jolieDate(l.linkedin_le) : ""}
            {l.linkedin_le && l.linkedin_relance_le ? " · " : ""}
            {l.linkedin_relance_le ? "Message le " + jolieDate(l.linkedin_relance_le) : ""}
          </div>
        )}

        {/* 🆕 LA SORTIE, POSABLE ET REVERSIBLE — 01/09.
            Jacques : « il n y a meme pas de pastille que c est sans
            suite ». Un refus n est pas une etape du parcours, c est une
            sortie : il ne se place donc pas dans la ligne des six, mais a
            part, en rouge.
            ⚠️ ET IL SE DEFAIT : toucher une etape du parcours ramene la
            fiche dedans. Rien n est definitif sauf la suppression. */}
        {!sorti && (
          <div style={{ marginTop: "9px", paddingTop: "9px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => marquer(l, "refuse")}
              disabled={charge}
              style={{
                background: "transparent", border: "1px solid rgba(232,131,106,0.3)",
                color: "#e8836a", borderRadius: "7px", padding: "7px 14px",
                fontSize: "12px", fontFamily: "Georgia,serif", cursor: "pointer",
              }}
            >
              Sans suite — arrêter là
            </button>
          </div>
        )}

        {sorti && (
          <div style={{ color: "#e8836a", fontSize: "12px", lineHeight: "1.7", marginTop: "7px" }}>
            {String(l.linkedin_statut || "") === "ecarte"
              ? "Fiche écartée — elle ne ressortira plus dans la file."
              : "Sans suite."}
          </div>
        )}
      </div>
    );
  }

  function blocFiche(l: any) {
    const cle = cleDe(l);
    const ouvert = depliee === cle;
    const vals = brouillon[cle] || {};
    const occupe = enregistre === cle;
    const aNote = String(l.notes || "").trim().length > 0;
    const lit = litPour === cle;

    if (!ouvert) {
      return (
        <div style={{ marginTop: "12px" }}>
          {/* 🆕 LE PARCOURS, AU-DESSUS DE TOUT LE RESTE — 01/09. Place ici,
              il apparait sur les six ecrans qui appellent deja blocFiche,
              sans qu aucun d eux n ait a etre modifie. */}
          {blocParcours(l)}
          {aNote && (
            <div style={{ background: "rgba(200,169,110,0.07)", border: "1px solid rgba(200,169,110,0.22)", borderRadius: "8px", padding: "11px 13px", marginBottom: "9px" }}>
              <div style={{ color: OR, fontSize: "11.5px", letterSpacing: "1.5px", marginBottom: "5px" }}>
                VOTRE OBSERVATION
              </div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13.5px", lineHeight: "1.75", whiteSpace: "pre-wrap" }}>
                {l.notes}
              </div>
            </div>
          )}
          <button
            onClick={() => deplier(l)}
            style={{ ...BOUTON, width: "100%", padding: "10px", fontSize: "13px", color: aNote ? OR : "rgba(255,255,255,0.55)", borderColor: aNote ? BOUTON.border : "rgba(255,255,255,0.18)" }}
          >
            Voir la fiche complète
          </button>
        </div>
      );
    }

    const champs = champsDe(l.base);

    return (
      <div style={{ marginTop: "12px", padding: "16px", background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "9px" }}>
        <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "14px" }}>
          FICHE COMPLÈTE — TOUT EST MODIFIABLE
        </div>

        <div style={{ marginBottom: "16px", padding: "13px", background: "rgba(68,138,255,0.07)", border: "1px solid rgba(68,138,255,0.3)", borderRadius: "8px" }}>
          <button
            onClick={() => { setCibleFiche(l); if (champFiche.current) champFiche.current.click(); }}
            disabled={lit}
            style={{ width: "100%", background: lit ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.18)", color: lit ? "rgba(255,255,255,0.4)" : BLEU, border: "1px solid rgba(68,138,255,0.45)", borderRadius: "8px", padding: "12px", fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: lit ? "wait" : "pointer" }}
          >
            {lit ? "Lecture en cours…" : "📷 Compléter depuis une capture LinkedIn"}
          </button>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: "1.7", margin: "9px 0 0" }}>
            Seuls les champs <strong>vides</strong> seront remplis — ce que vous avez déjà
            vérifié ne sera pas écrasé. L'observation s'ajoute à la suite de l'existante.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {champs.map(function (c) {
            return (
              <div key={c.cle} style={{ flex: c.large ? "1 1 100%" : "1 1 180px" }}>
                <span style={LIBELLE}>{c.nom}</span>
                <input
                  value={vals[c.cle] !== undefined ? vals[c.cle] : ""}
                  onChange={(e) => poserChamp(cle, c.cle, e.target.value)}
                  style={{ ...CHAMP, marginBottom: "11px" }}
                />
              </div>
            );
          })}
        </div>

        <span style={LIBELLE}>Votre observation</span>
        <textarea
          value={vals.notes !== undefined ? vals.notes : ""}
          onChange={(e) => poserChamp(cle, "notes", e.target.value)}
          rows={4}
          placeholder="Dirige trois centres en Normandie. Rappeler en septembre, en vacances jusqu'au 5."
          style={{ ...CHAMP, marginBottom: "13px" }}
        />

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 13px" }}>
          Corriger une coordonnée ne fait rien avancer dans le parcours et ne consomme
          aucune invitation.
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => enregistrerFiche(l)}
            disabled={occupe}
            style={{ flex: "2 1 200px", background: "rgba(200,169,110,0.2)", color: OR, border: "1px solid rgba(200,169,110,0.5)", borderRadius: "8px", padding: "12px", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: occupe ? "wait" : "pointer" }}
          >
            {occupe ? "Enregistrement…" : "Enregistrer la fiche"}
          </button>
          <button
            onClick={() => setDepliee("")}
            style={{ ...BOUTON, flex: "1 1 110px", padding: "12px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}
          >
            Fermer
          </button>
        </div>

        {/* 🆕 LA SUPPRESSION — 01/09.
            ⚠️ SEUL GESTE IRREVERSIBLE DE L ECRAN. Ecarter se defait, un
            statut se corrige, une etape se deplace. Une ligne supprimee ne
            revient pas — d ou la confirmation, et la place a l ecart des
            autres boutons. */}
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(232,131,106,0.2)" }}>
          <button
            onClick={() => supprimerFiche(l)}
            disabled={occupe}
            style={{
              width: "100%", background: "transparent", color: "#e8836a",
              border: "1px solid rgba(232,131,106,0.35)", borderRadius: "8px",
              padding: "11px", fontSize: "13px", fontFamily: "Georgia,serif",
              cursor: occupe ? "wait" : "pointer",
            }}
          >
            Supprimer définitivement cette fiche
          </button>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11.5px", lineHeight: "1.7", margin: "8px 0 0" }}>
            Irréversible. Pour la retirer de la file sans la perdre, utilisez
            plutôt « Écarter ».
          </p>
        </div>
      </div>
    );
  }

  const enSerie = serie !== null && serie.length > 0 && rang < serie.length;
  const courante = enSerie ? serie![rang] : null;

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* LES DEUX CHAMPS DE FICHIER, invisibles, declenches par les boutons. */}
      <input
        ref={champAjout}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) lireCapture(f, "ajout");
          e.target.value = "";
        }}
      />
      <input
        ref={champFiche}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f && cibleFiche) lireCapture(f, cleDe(cibleFiche), cibleFiche);
          e.target.value = "";
        }}
      />

      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "26px 20px" }}>
        <a href="/admin/crm" style={{ color: OR, fontSize: "13px", textDecoration: "none" }}>
          ← Retour au CRM
        </a>
        <h1 style={{ color: OR, margin: "13px 0 4px", fontSize: "23px" }}>Prospection LinkedIn</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "13px" }}>
          Enregistrer · inviter · suivre · écrire · relancer
        </p>
      </div>

      <div style={{ display: "flex", gap: "6px", padding: "14px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {ONGLETS.map(function (o) {
          const actif = onglet === o.id;
          return (
            <button key={o.id} onClick={() => { setOnglet(o.id); setRecherche(""); quitterSerie(); }}
              style={{
                padding: "9px 17px", borderRadius: "8px", border: "none", cursor: "pointer",
                whiteSpace: "nowrap", fontSize: "13.5px", fontFamily: "Georgia,serif",
                background: actif ? OR : "rgba(255,255,255,0.08)",
                color: actif ? "#050508" : "#fff",
                fontWeight: actif ? "bold" : "normal",
              }}>
              {o.nom}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "22px 20px", maxWidth: "800px", margin: "0 auto" }}>

        {/* ---------- CHERCHER PARTOUT — au-dessus de tout le reste ---------- */}
        {!enSerie && blocPartout()}

        {/* ---------- LES COMPTEURS ---------- */}
        {compteurs && !enSerie && (
          <div style={{ ...CARTE, borderColor: bloque ? "rgba(232,131,106,0.5)" : "rgba(68,138,255,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <div style={{ color: plafondJour ? "#e8836a" : BLEU, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.jour)} / {compteurs.plafond_jour}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>aujourd'hui</div>
              </div>
              <div>
                <div style={{ color: plafondSemaine ? "#e8836a" : BLEU, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.semaine)} / {compteurs.plafond_semaine}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>cette semaine</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.en_attente)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>sans réponse</div>
              </div>
              <div>
                <div style={{ color: VERT, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.acceptes)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>acceptées</div>
              </div>
              <div>
                <div style={{ color: ORANGE, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.relances)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>messages envoyés</div>
              </div>
              <div>
                <div style={{ color: OR, fontSize: "19px", fontWeight: "bold" }}>
                  {compteurs.taux_global === null ? "—" : compteurs.taux_global + " %"}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>taux d'acceptation</div>
              </div>
            </div>

            {/* 🚨 LE PLAFOND EST GLOBAL. Les deux campagnes puisent dans le
                meme quota, parce qu elles partent du meme compte LinkedIn. */}
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.7", margin: "13px 0 0" }}>
              Ce plafond couvre les deux campagnes : les invitations partent d'un seul
              compte, organismes et cabinets confondus.
            </p>

            {/* \ud83c\udd95 LE BILAN DE CHAQUE CAMPAGNE, COTE A COTE — 27/08.

                LE BESOIN. Le taux d'acceptation global melangeait les deux
                campagnes. Tant qu'il n'y avait qu'AcadeMIA Pro, le chiffre
                disait quelque chose ; depuis que Mr. Comptable prospecte
                aussi, un bon taux d'un cote peut masquer un mauvais de
                l'autre.

                \u26a0\ufe0f LE TAUX SE CALCULE SUR CEUX QUI ONT REPONDU, pas
                sur les invites. Une invitation sans reponse n'est ni un
                succes ni un echec : elle n'a pas encore ete vue. Les
                premiers jours, le taux est donc peu significatif. */}
            {compteurs.campagnes && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap",
                marginTop: "16px", paddingTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                {[
                  { cle: "academiapro", nom: "AcadéMIA Pro", couleur: OR },
                  { cle: "mrcomptable", nom: "Mr. Comptable", couleur: COMPTABLE },
                ].map(function (c: any) {
                  const b = compteurs.campagnes[c.cle];
                  if (!b) return null;
                  return (
                    <div key={c.cle} style={{
                      flex: "1 1 240px", padding: "13px 15px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid " + c.couleur + "44",
                    }}>
                      <div style={{ color: c.couleur, fontSize: "13px",
                        fontWeight: "bold", marginBottom: "9px" }}>
                        {c.nom}
                      </div>
                      <div style={{ display: "flex", gap: "16px",
                        flexWrap: "wrap", alignItems: "baseline" }}>
                        <div>
                          <span style={{ color: "#fff", fontSize: "19px",
                            fontWeight: "bold" }}>
                            {b.taux === null ? "—" : b.taux + " %"}
                          </span>
                          <span style={{ color: "rgba(255,255,255,0.4)",
                            fontSize: "11.5px", marginLeft: "6px" }}>
                            d'acceptation
                          </span>
                        </div>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.5)",
                        fontSize: "12.5px", lineHeight: "1.8",
                        marginTop: "7px" }}>
                        {nombre(b.invitations)} invitation(s) ·{" "}
                        {nombre(b.acceptes)} acceptée(s) ·{" "}
                        {nombre(b.en_attente)} sans réponse
                        {b.refuses > 0 ? " · " + nombre(b.refuses) + " refus" : ""}
                      </div>

                      {/* L ENTONNOIR, DU MESSAGE AU CLIENT.
                          Il ne s affiche que si des messages sont partis :
                          avant, il n aurait que des zeros a montrer. */}
                      {b.messages_envoyes > 0 && (
                        <div style={{ marginTop: "9px", paddingTop: "9px",
                          borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                          <div style={{ color: "rgba(255,255,255,0.5)",
                            fontSize: "12.5px", lineHeight: "1.8" }}>
                            {nombre(b.messages_envoyes)} message(s) envoyé(s) ·{" "}
                            {nombre(b.repondus)} réponse(s)
                            {b.taux_reponse !== null
                              ? " (" + b.taux_reponse + " %)" : ""}
                          </div>
                          {(b.rendez_vous > 0 || b.clients > 0) && (
                            <div style={{ color: VERT, fontSize: "12.5px",
                              lineHeight: "1.8" }}>
                              {b.rendez_vous > 0
                                ? nombre(b.rendez_vous) + " rendez-vous" : ""}
                              {b.rendez_vous > 0 && b.clients > 0 ? " · " : ""}
                              {b.clients > 0
                                ? nombre(b.clients) + " client(s)" : ""}
                              {b.taux_concretisation
                                ? " · " + b.taux_concretisation
                                  + " % de concrétisation" : ""}
                            </div>
                          )}
                        </div>
                      )}

                      {b.a_ecrire > 0 && (
                        <div style={{ color: VERT, fontSize: "12.5px",
                          marginTop: "5px" }}>
                          {nombre(b.a_ecrire)} message(s) à écrire
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {compteurs.en_file > 0 && (
              <p style={{ color: BLEU, fontSize: "13px", lineHeight: "1.7", margin: "10px 0 0" }}>
                {nombre(compteurs.en_file)} profil(s) enregistré(s) en attente d'invitation.
              </p>
            )}

            {depasse && (
              <p style={{ color: ORANGE, fontSize: "13px", lineHeight: "1.7", margin: "13px 0 0" }}>
                {plafondJour
                  ? "Plafond du jour atteint (" + compteurs.plafond_jour + "). N'envoyez plus d'invitation aujourd'hui — mais si vous en avez déjà envoyé une depuis LinkedIn, marquez-la : une fiche non marquée fausse tous les comptes."
                  : "Plafond de la semaine atteint (" + compteurs.plafond_semaine + "). Laissez passer quelques jours avant d'en envoyer d'autres."}
              </p>
            )}
          </div>
        )}

        {message && (
          <div style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.4)", borderRadius: "9px", padding: "13px", marginBottom: "14px", color: VERT, fontSize: "13.5px", lineHeight: "1.7" }}>
            {message}
          </div>
        )}

        {erreur && (
          <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "9px", padding: "13px", marginBottom: "14px", color: "#e8836a", fontSize: "13.5px", lineHeight: "1.7" }}>
            {erreur}
          </div>
        )}

        {/* LA FICHE QUI VIENT D ETRE CREEE — visible partout. */}
        {!enSerie && blocCreee()}

        {/* ═══════════ ONGLET INVITER ═══════════ */}
        {onglet === "inviter" && (
          <>
            <div style={{ ...CARTE, borderColor: ajout ? "rgba(68,138,255,0.45)" : CARTE.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ color: BLEU, fontSize: "15px", fontWeight: "bold" }}>
                    Un profil croisé sur LinkedIn ?
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", marginTop: "3px", lineHeight: "1.7" }}>
                    Photographiez-le, les champs se remplissent seuls.
                  </div>
                </div>
                <button onClick={() => { setAjout(!ajout); setErreur(""); setMessage(""); }}
                  style={{ ...BOUTON, color: BLEU, borderColor: "rgba(68,138,255,0.45)" }}>
                  {ajout ? "Annuler" : "Ajouter un profil"}
                </button>
              </div>

              {ajout && (
                <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>

                  <button
                    onClick={() => { if (champAjout.current) champAjout.current.click(); }}
                    disabled={litPour === "ajout"}
                    style={{
                      width: "100%",
                      background: litPour === "ajout" ? "rgba(255,255,255,0.06)" : BLEU,
                      color: litPour === "ajout" ? "rgba(255,255,255,0.4)" : "#fff",
                      border: "none", borderRadius: "9px", padding: "15px",
                      fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif",
                      cursor: litPour === "ajout" ? "wait" : "pointer", marginBottom: "10px",
                    }}
                  >
                    {litPour === "ajout" ? "Lecture de la capture…" : "📷 Lire une capture du profil"}
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", lineHeight: "1.75", margin: "0 0 18px" }}>
                    Photographiez le haut du profil LinkedIn : le nom, l'organisme, la ville et
                    l'observation seront remplis automatiquement. <strong>L'adresse du profil
                    est rarement visible sur une capture</strong> — sur LinkedIn, touchez les
                    trois points puis « Copier le lien vers le profil », et collez-la ci-dessous.
                  </p>

                  {/* 🚨 LA CAMPAGNE SE CHOISIT AVANT TOUT LE RESTE.
                      C est elle qui decide du message envoye apres
                      acceptation. Un expert-comptable trouve dans les
                      relations d un autre expert-comptable ne doit jamais
                      recevoir le message des organismes de formation. */}
                  <span style={LIBELLE}>Pour quelle campagne ? *</span>
                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap",
                    marginBottom: "8px" }}>
                    <button onClick={() => setACampagne("academiapro")}
                      style={{
                        flex: "1 1 180px", padding: "12px", borderRadius: "9px",
                        fontSize: "13.5px", fontFamily: "Georgia,serif",
                        cursor: "pointer",
                        fontWeight: aCampagne === "academiapro" ? "bold" : "normal",
                        background: aCampagne === "academiapro" ? OR : "rgba(255,255,255,0.05)",
                        color: aCampagne === "academiapro" ? "#050508" : OR,
                        border: aCampagne === "academiapro" ? "none"
                          : "1px solid rgba(200,169,110,0.4)",
                      }}>
                      AcadéMIA Pro
                    </button>
                    <button onClick={() => setACampagne("mrcomptable")}
                      style={{
                        flex: "1 1 180px", padding: "12px", borderRadius: "9px",
                        fontSize: "13.5px", fontFamily: "Georgia,serif",
                        cursor: "pointer",
                        fontWeight: aCampagne === "mrcomptable" ? "bold" : "normal",
                        background: aCampagne === "mrcomptable" ? COMPTABLE : "rgba(255,255,255,0.05)",
                        color: aCampagne === "mrcomptable" ? "#050508" : COMPTABLE,
                        border: aCampagne === "mrcomptable" ? "none"
                          : "1px solid rgba(79,195,247,0.4)",
                      }}>
                      Mr. Comptable
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px",
                    lineHeight: "1.7", margin: "0 0 18px" }}>
                    {aCampagne === "mrcomptable"
                      ? "Cette fiche recevra le message sur la relance des justificatifs."
                      : "Cette fiche recevra le message sur le bilan pédagogique et le catalogue."}
                  </p>

                  <span style={LIBELLE}>Nom du contact *</span>
                  <input value={aNom} onChange={(e) => setANom(e.target.value)}
                    placeholder="Sarah Dupont" style={{ ...CHAMP, marginBottom: "12px" }} />

                  <span style={LIBELLE}>Adresse du profil LinkedIn *</span>
                  <input value={aLien} onChange={(e) => setALien(e.target.value)}
                    placeholder="https://www.linkedin.com/in/sarah-dupont"
                    style={{ ...CHAMP, marginBottom: "12px", borderColor: aLien ? "rgba(200,169,110,0.3)" : "rgba(232,163,61,0.5)" }} />

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <span style={LIBELLE}>Son organisme</span>
                      <input value={aOrganisme} onChange={(e) => setAOrganisme(e.target.value)}
                        placeholder="Formation Conseil" style={{ ...CHAMP, marginBottom: "12px" }} />
                    </div>
                    <div style={{ flex: "1 1 140px" }}>
                      <span style={LIBELLE}>Ville</span>
                      <input value={aVille} onChange={(e) => setAVille(e.target.value)}
                        placeholder="Lyon" style={{ ...CHAMP, marginBottom: "12px" }} />
                    </div>
                  </div>

                  <span style={LIBELLE}>Ce que vous voulez retenir</span>
                  <textarea value={aNotes} onChange={(e) => setANotes(e.target.value)} rows={4}
                    placeholder="Croisé sur un post à propos de Qualiopi."
                    style={{ ...CHAMP, marginBottom: "16px" }} />

                  {/* 🚨 LE BOUTON QUI MANQUAIT. Toujours actif, meme quand le
                      plafond du jour est atteint. */}
                  <button onClick={() => ajouter("file")} disabled={false}
                    style={{ width: "100%", background: "rgba(200,169,110,0.2)", color: OR, border: "1px solid rgba(200,169,110,0.5)", borderRadius: "9px", padding: "15px", fontSize: "14.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer", marginBottom: "8px" }}>
                    💾 Enregistrer seulement — je l'inviterai plus tard
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", lineHeight: "1.75", margin: "0 0 18px" }}>
                    La fiche est rangée dans « En attente d'invitation ». <strong>Aucune unité
                    de quota n'est consommée</strong> — vous l'inviterez quand vous voudrez.
                  </p>

                  {/* 🚨🚨 LES ETATS AVANCES — ajoutes le 27/08.

                      LE DEFAUT. Le formulaire ne proposait que trois etats,
                      tous lies a l invitation : ranger, invite avec note,
                      invite sans note. Or une relation ne commence pas
                      toujours par une invitation.

                      Eric, deja en relation, ayant deja repondu, avec un
                      rendez-vous en cours, n entrait dans aucun des trois.
                      Et le plafond du jour, atteint, grisait les deux seuls
                      boutons qui posaient un statut. Sa fiche etait donc
                      impossible a creer correctement.

                      ⚠️ CES TROIS ETATS NE CONSOMMENT AUCUN QUOTA. Aucune
                      invitation n est envoyee : on consigne une relation qui
                      existe deja. Le plafond ne les concerne pas, et ne doit
                      jamais les concerner. */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px", marginBottom: "18px" }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", lineHeight: "1.75", margin: "0 0 12px" }}>
                      Ou, si <strong>vous le connaissez déjà</strong> — relation
                      établie, échange en cours, rendez-vous pris — dites où
                      vous en êtes. Aucune invitation n'est envoyée, votre
                      quota n'est pas touché.
                    </p>
                    <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                      {[
                        { cle: "accepte_nu", nom: "Déjà en relation", couleur: OR },
                        { cle: "repondu", nom: "A déjà répondu", couleur: BLEU },
                        { cle: "rendez_vous", nom: "Rendez-vous pris", couleur: ORANGE },
                      ].map(function (e: any) {
                        return (
                          <button key={e.cle} onClick={() => ajouter(e.cle)}
                            style={{
                              flex: "1 1 160px", padding: "13px",
                              borderRadius: "9px", fontSize: "13px",
                              fontFamily: "Georgia,serif", cursor: "pointer",
                              background: "rgba(255,255,255,0.04)",
                              color: e.couleur,
                              border: "1px solid " + e.couleur + "55",
                            }}>
                            {e.nom}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", lineHeight: "1.75", margin: "0 0 12px" }}>
                      Ou, si vous <strong>venez de l'inviter sur LinkedIn</strong>, dites laquelle
                      des deux — la fiche entrera directement dans « Mes invitations ».
                    </p>
                    <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                      <button onClick={() => ajouter("invite")} disabled={charge || bloque}
                        style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.45)"), borderRadius: "9px", padding: "14px", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                        ✓ Invité avec une note
                      </button>
                      <button onClick={() => ajouter("invite_nu")} disabled={charge || bloque}
                        style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.45)"), borderRadius: "9px", padding: "14px", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                        ✓ Invité sans note
                      </button>
                    </div>
                    {depasse && (
                      <p style={{ color: ORANGE, fontSize: "12.5px", lineHeight: "1.7", margin: "10px 0 0" }}>
                        Plafond du jour atteint. Ces deux boutons restent actifs : si
                        l'invitation est <strong>déjà partie</strong> depuis LinkedIn,
                        marquez-la. Sinon, utilisez « Enregistrer seulement » ci-dessus.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 🆕 LE CHOIX DE LA BASE — quatre entrees depuis le 26/08.
                « Cabinets comptables » se distingue par sa couleur : c est
                l autre produit, et l autre message. */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {BASES.map(function (b) {
                const actif = base === b.cle;
                const cab = estCabinet(b.cle);
                return (
                  <button key={b.cle} onClick={() => setBase(b.cle)}
                    style={{
                      ...BOUTON, borderRadius: "20px", padding: "8px 16px", fontSize: "13px",
                      background: actif ? (cab ? COMPTABLE : OR) : "rgba(255,255,255,0.06)",
                      color: actif ? "#050508" : (cab ? COMPTABLE : "rgba(255,255,255,0.6)"),
                      border: actif ? "none" : "1px solid " + (cab ? "rgba(79,195,247,0.4)" : "rgba(200,169,110,0.35)"),
                      fontWeight: actif ? "bold" : "normal",
                    }}>
                    {b.nom}
                  </button>
                );
              })}
            </div>

            {/* Le rappel de la campagne en cours, pour qu on ne se trompe
                jamais de produit en ouvrant un profil. */}
            <p style={{
              color: estCabinet(base) ? COMPTABLE : OR,
              fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 16px",
            }}>
              {estCabinet(base)
                ? "Campagne Mr. Comptable — le message d'après acceptation parlera de la relance des justificatifs."
                : "Campagne plateforme de formation — le message d'après acceptation parlera du bilan pédagogique et du catalogue."}
            </p>

            {charge && !fiche ? (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
            ) : epuise || !fiche ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  Plus aucun profil à inviter dans cette base. Essayez-en une autre, ou
                  enrichissez de nouvelles fiches pour en récupérer.
                </p>
              </div>
            ) : (
              <>
                <div style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ color: "#fff", fontSize: "19px", fontWeight: "bold", marginBottom: "4px" }}>
                        {nomDe(fiche)}
                      </div>
                      <div style={{ color: OR, fontSize: "15px", marginBottom: "9px" }}>
                        {capitaliser(fiche.raison_sociale) || "—"}
                      </div>
                    </div>
                    <div style={{ color: OR, fontSize: "13px" }}>{nombre(restant)} restantes</div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.8" }}>
                    {capitaliser(fiche.ville) || "ville inconnue"}
                    {fiche.code_postal ? " · " + fiche.code_postal : ""}
                    {fiche.siren ? " · SIREN " + fiche.siren : ""}
                  </div>
                  {coordonnees(fiche)}
                </div>

                <div style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: OR, fontSize: "12px", letterSpacing: "2px" }}>1. SI VOUS METTEZ UNE NOTE, COPIEZ-LA</span>
                    <span style={{ color: trop ? "#e8836a" : "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                      {texte.length} / {LIMITE_NOTE}
                    </span>
                  </div>
                  <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={5}
                    style={{ ...CHAMP, borderColor: trop ? "rgba(232,131,106,0.6)" : "rgba(200,169,110,0.3)" }} />
                  {trop && (
                    <p style={{ color: "#e8836a", fontSize: "12.5px", margin: "8px 0 0", lineHeight: "1.6" }}>
                      Au-delà de {LIMITE_NOTE} caractères, LinkedIn retire le bouton « Ajouter une note » en compte gratuit.
                    </p>
                  )}
                  <button onClick={() => copier(texte, "note")} disabled={trop}
                    style={{ ...BOUTON, width: "100%", marginTop: "12px", opacity: trop ? 0.4 : 1, background: copie === "note" ? "rgba(0,230,118,0.15)" : BOUTON.background, color: copie === "note" ? VERT : OR, borderColor: copie === "note" ? "rgba(0,230,118,0.4)" : BOUTON.border }}>
                    {copie === "note" ? "✓ Copié" : "Copier le mot"}
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.7", margin: "10px 0 0" }}>
                    Les notes personnalisées sont plafonnées à quelques-unes par mois en compte
                    gratuit. Sans note, l'invitation part quand même — et le vrai message vient
                    après l'acceptation.
                  </p>
                </div>

                <div style={CARTE}>
                  <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" }}>
                    2. OUVREZ LE PROFIL ET INVITEZ SUR LINKEDIN
                  </p>
                  <button onClick={() => ouvrirProfil(fiche)}
                    style={{ width: "100%", background: vu ? "rgba(255,255,255,0.06)" : BLEU, color: vu ? "rgba(255,255,255,0.6)" : "#fff", border: vu ? "1px solid rgba(255,255,255,0.2)" : "none", borderRadius: "9px", padding: "15px", fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                    {vu ? "Rouvrir le profil" : "Ouvrir le profil LinkedIn"}
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "12px 0 0" }}>
                    Ce bouton n'enregistre rien — vous pouvez regarder et revenir sans conséquence.
                    Sur LinkedIn : <strong>⋯</strong> puis <strong>Se connecter</strong>.
                  </p>
                </div>

                <div style={{ ...CARTE, borderColor: vu ? "rgba(0,230,118,0.35)" : "rgba(200,169,110,0.2)" }}>
                  <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" }}>
                    3. DE RETOUR ICI — QU'AVEZ-VOUS ENVOYÉ ?
                  </p>
                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "9px" }}>
                    <button onClick={() => marquer(fiche, "invite", base)} disabled={charge || bloque}
                      style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.45)"), borderRadius: "9px", padding: "15px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                      ✓ Envoyée avec la note
                    </button>
                    <button onClick={() => marquer(fiche, "invite_nu", base)} disabled={charge || bloque}
                      style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.45)"), borderRadius: "9px", padding: "15px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                      ✓ Envoyée sans note
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                    <button onClick={() => marquer(fiche, "ecarte", base)} disabled={false}
                      style={{ ...BOUTON, flex: "1 1 150px", padding: "13px", fontSize: "13.5px", color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.18)" }}>
                      Écarter
                    </button>
                    <button onClick={chargerSuivante} disabled={false}
                      style={{ ...BOUTON, flex: "1 1 150px", padding: "13px", fontSize: "13.5px", color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.12)" }}>
                      Passer
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "12px 0 0" }}>
                    <strong>Écarter</strong> retire la fiche définitivement, <strong>Passer</strong> ne
                    touche à rien.
                  </p>

                  {/* 🆕 LA REGULARISATION DATEE — 30/08.

                      LE CAS : une fiche dont l invitation est partie AVANT
                      aujourd hui mais n a jamais ete consignee (defaut
                      Agnes Brunet / Franck Zemmour). Les boutons ci-dessus
                      dateraient l envoi d aujourd hui et consommeraient le
                      plafond du jour — a tort.

                      Ce geste transmet date_invitation a la route (acceptee
                      depuis le 28/08) : la fiche est marquee invitee A SA
                      VRAIE DATE, le compteur du jour ne bouge pas, la file
                      ne la represente plus. */}
                  <div style={{ borderTop: "1px solid rgba(200,169,110,0.18)", marginTop: "16px", paddingTop: "13px" }}>
                    {!regulOuverte ? (
                      <button
                        onClick={() => setRegulOuverte(true)}
                        style={{
                          background: "transparent", border: "none",
                          color: "rgba(255,255,255,0.45)", fontSize: "12.5px",
                          fontFamily: "Georgia,serif", cursor: "pointer",
                          padding: "4px 0", textDecoration: "underline",
                        }}>
                        Cette invitation était déjà partie un autre jour ? La consigner à sa vraie date
                      </button>
                    ) : (
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12.5px", lineHeight: "1.75", margin: "0 0 10px" }}>
                          La fiche sera marquée invitée <strong>à la date choisie</strong> —
                          le compteur d'aujourd'hui ne bouge pas.
                        </p>
                        <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", alignItems: "center" }}>
                          <input
                            type="date"
                            value={dateRegul}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setDateRegul(e.target.value)}
                            style={{ ...CHAMP, width: "auto", flex: "0 1 180px", padding: "11px 13px" }}
                          />
                          <button
                            onClick={() => marquer(fiche, "invite_nu", base, { date_invitation: dateRegul })}
                            disabled={charge || !dateRegul}
                            style={{ ...BOUTON, flex: "1 1 220px", padding: "12px", fontSize: "13.5px", fontWeight: "bold" }}>
                            ✓ Invitation déjà envoyée à cette date
                          </button>
                          <button
                            onClick={() => setRegulOuverte(false)}
                            style={{ ...BOUTON, flex: "0 1 110px", padding: "12px", fontSize: "13px", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════ ONGLET EN ATTENTE D'INVITATION ═══════════ */}
        {onglet === "file" && (
          <>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 16px" }}>
              Les profils que vous avez enregistrés sans les inviter. Ouvrez le profil, envoyez
              votre demande sur LinkedIn, puis marquez-la ici.
            </p>

            {lignes.length > 0 && barreRecherche()}

            {charge ? (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
            ) : lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  Aucun profil en attente. Ceux que vous enregistrez sans les inviter
                  apparaîtront ici.
                </p>
              </div>
            ) : (
              filtrees.map(function (l) {
                return (
                  <div key={cleDe(l)} style={{ ...CARTE, borderColor: "rgba(68,138,255,0.3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 240px" }}>
                        <div style={{ color: "#fff", fontSize: "15.5px", fontWeight: "bold" }}>
                          {capitaliser(l.nom) || nomDe(l)}
                          {etiquetteCampagne(l)}
                        </div>
                        <div style={{ color: OR, fontSize: "13.5px", marginTop: "2px" }}>
                          {capitaliser(l.raison_sociale) || "—"}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
                          {capitaliser(l.ville)}
                        </div>
                        {coordonnees(l)}
                      </div>
                    </div>

                    {blocFiche(l)}

                    <button
                      onClick={() => { try { window.open(lien(l.linkedin), "_blank", "noopener"); } catch (e) { } }}
                      style={{ width: "100%", background: BLEU, color: "#fff", border: "none", borderRadius: "9px", padding: "14px", fontSize: "14.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer", marginTop: "12px" }}>
                      Ouvrir le profil et inviter ↗
                    </button>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "9px" }}>
                      <button onClick={() => marquer(l, "invite")} disabled={charge || bloque}
                        style={{ flex: "1 1 160px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.4)"), borderRadius: "8px", padding: "11px", fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                        ✓ Invité avec note
                      </button>
                      <button onClick={() => marquer(l, "invite_nu")} disabled={charge || bloque}
                        style={{ flex: "1 1 160px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.4)"), borderRadius: "8px", padding: "11px", fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                        ✓ Invité sans note
                      </button>
                      <button onClick={() => marquer(l, "ecarte")} disabled={false}
                        style={{ ...BOUTON, flex: "1 1 120px", padding: "11px", fontSize: "13px", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
                        Écarter
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ═══════════ ONGLET MES INVITATIONS ═══════════ */}
        {onglet === "attente" && (
          <>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 16px" }}>
              Les invitations parties, en attente de réponse. Quand LinkedIn vous notifie une
              acceptation, marquez-la ici : la fiche passera dans « À écrire ».
            </p>

            {lignes.length > 0 && barreRecherche()}

            {charge ? (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
            ) : lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  Aucune invitation en attente. Elles apparaîtront ici dès que vous en aurez envoyé.
                </p>
              </div>
            ) : (
              filtrees.map(function (l) {
                const j = joursDepuis(l.linkedin_le);
                const note = avecNoteDe(l);
                return (
                  <div key={cleDe(l)} style={CARTE}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 240px" }}>
                        <div style={{ color: "#fff", fontSize: "15.5px", fontWeight: "bold" }}>
                          {nomDe(l)}
                          {etiquetteCampagne(l)}
                        </div>
                        <div style={{ color: OR, fontSize: "13.5px", marginTop: "2px" }}>
                          {capitaliser(l.raison_sociale) || "—"}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
                          {l.ville ? capitaliser(l.ville) + " · " : ""}
                          {jolieDate(l.linkedin_le)}
                          {j !== null ? " · il y a " + j + " jour" + (j > 1 ? "s" : "") : ""}
                          <span style={{ color: note ? OR : "rgba(255,255,255,0.3)" }}>
                            {note ? " · avec note" : " · sans note"}
                          </span>
                        </div>
                        {coordonnees(l)}
                      </div>
                      <a href={lien(l.linkedin)} target="_blank" rel="noreferrer"
                        style={{ color: BLEU, fontSize: "12.5px", textDecoration: "none", alignSelf: "center" }}>
                        Voir le profil ↗
                      </a>
                    </div>

                    {blocFiche(l)}

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                      <button onClick={() => marquer(l, note ? "accepte" : "accepte_nu")} disabled={false}
                        style={{ flex: "1 1 150px", background: "rgba(0,230,118,0.13)", color: VERT, border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "11px", fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                        ✓ A accepté
                      </button>
                      <button onClick={() => marquer(l, "refuse")} disabled={false}
                        style={{ ...BOUTON, flex: "1 1 150px", padding: "11px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                        Sans suite
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ═══════════ ONGLETS À ÉCRIRE ET MESSAGES ENVOYÉS ═══════════ */}
        {(onglet === "relancer" || onglet === "envoyes") && (
          <>
            {enSerie && courante ? (
              <>
                <div style={{ ...CARTE, borderColor: "rgba(0,230,118,0.45)", background: "#12121f" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                    <span style={{ color: VERT, fontSize: "12px", letterSpacing: "2px" }}>
                      {onglet === "envoyes" ? "SECONDE RELANCE" : "SÉRIE EN COURS"} · {rang + 1} / {serie!.length}
                    </span>
                    <button onClick={quitterSerie} style={{ ...BOUTON, padding: "8px 16px", fontSize: "12.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                      Quitter la série
                    </button>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "5px", overflow: "hidden", marginBottom: "18px" }}>
                    <div style={{ background: VERT, height: "100%", width: Math.round((rang / serie!.length) * 100) + "%" }} />
                  </div>

                  <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold", marginBottom: "3px" }}>
                    {nomDe(courante)}
                    {etiquetteCampagne(courante)}
                  </div>
                  <div style={{ color: OR, fontSize: "15px", marginBottom: "4px" }}>
                    {capitaliser(courante.raison_sociale) || "—"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                    {capitaliser(courante.ville)}
                  </div>
                  {coordonnees(courante)}

                  {courante.notes && (
                    <div style={{ background: "rgba(200,169,110,0.07)", border: "1px solid rgba(200,169,110,0.22)", borderRadius: "8px", padding: "11px 13px", marginTop: "13px" }}>
                      <div style={{ color: OR, fontSize: "11.5px", letterSpacing: "1.5px", marginBottom: "5px" }}>
                        VOTRE OBSERVATION
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13.5px", lineHeight: "1.75", whiteSpace: "pre-wrap" }}>
                        {courante.notes}
                      </div>
                    </div>
                  )}
                </div>

                <div style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: estCabinet(courante.base) ? COMPTABLE : OR, fontSize: "12px", letterSpacing: "2px" }}>
                      MESSAGE {estCabinet(courante.base) ? "MR. COMPTABLE" : "FORMATION"} — AU NOM DE {String(capitaliser(courante.dirigeant_prenom) || "CE CONTACT").toUpperCase()}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
                      {texteSerie.length} caractères
                    </span>
                  </div>
                  <textarea value={texteSerie} onChange={(e) => setTexteSerie(e.target.value)} rows={13} style={CHAMP} />
                </div>

                <div style={{ ...CARTE, borderColor: ouvertSerie ? "rgba(0,230,118,0.4)" : CARTE.border }}>
                  <button
                    onClick={() => copierEtOuvrir(courante)}
                    style={{
                      width: "100%",
                      background: copieSerie ? "rgba(0,230,118,0.15)" : BLEU,
                      color: copieSerie ? VERT : "#fff",
                      border: copieSerie ? "1px solid rgba(0,230,118,0.45)" : "none",
                      borderRadius: "9px", padding: "16px", fontSize: "15.5px",
                      fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer",
                    }}
                  >
                    {copieSerie ? "✓ Copié — collez dans la messagerie" : "Copier le message et ouvrir la messagerie"}
                  </button>

                  {blocFiche(courante)}

                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginTop: "16px" }}>
                    <button onClick={() => envoyeEtSuivant(courante)} disabled={false}
                      style={{ flex: "2 1 220px", background: "rgba(0,230,118,0.15)", color: VERT, border: "1px solid rgba(0,230,118,0.45)", borderRadius: "9px", padding: "15px", fontSize: "14.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                      ✓ Envoyé — au suivant
                    </button>
                    <button onClick={passerSuivant} disabled={false}
                      style={{ ...BOUTON, flex: "1 1 130px", padding: "15px", fontSize: "13.5px", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
                      Passer
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", lineHeight: "1.7", margin: "12px 0 0" }}>
                    <strong>Passer</strong> laisse la fiche dans la liste pour plus tard.
                    {faits > 0 ? " " + faits + " message(s) envoyé(s) dans cette série." : ""}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 16px" }}>
                  {onglet === "envoyes"
                    ? "Les personnes à qui vous avez déjà écrit, de la plus ancienne à la plus récente. Celles qui attendent depuis plus de " + JOURS_AVANT_RELANCE + " jours sont signalées."
                    : "Ces personnes ont accepté votre invitation et n'ont pas encore reçu de message. La messagerie est libre : aucune limite, aucun quota."}
                </p>

                {/* 🚨 LES DEUX CAMPAGNES SE MELANGENT ICI. Le message est
                    prepare d apres la fiche, pas d apres un reglage. */}
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 16px" }}>
                  Les deux campagnes se croisent dans cette liste. Chaque fiche reçoit le
                  message de son produit — les cabinets sont signalés par une pastille.
                </p>

                {lignes.length > 0 && barreRecherche()}

                {filtrees.length > 1 && (
                  <div style={{ ...CARTE, borderColor: "rgba(0,230,118,0.4)", background: "rgba(0,230,118,0.05)" }}>
                    <div style={{ color: VERT, fontSize: "15px", fontWeight: "bold", marginBottom: "5px" }}>
                      {onglet === "envoyes" ? "Relancer, l'un après l'autre" : "Écrire à tous, l'un après l'autre"}
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: "1.75", margin: "0 0 14px" }}>
                      {filtrees.length} personne(s). Le message est préparé à chaque prénom, dans
                      la voix du produit concerné, copié d'un clic, et la messagerie s'ouvre.
                    </p>
                    <button onClick={demarrerSerie}
                      style={{ width: "100%", background: VERT, color: "#050508", border: "none", borderRadius: "9px", padding: "15px", fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                      Démarrer la série — {filtrees.length} message(s)
                    </button>
                  </div>
                )}

                {charge ? (
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
                ) : lignes.length === 0 ? (
                  <div style={CARTE}>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                      {onglet === "envoyes"
                        ? "Aucun message envoyé pour l'instant."
                        : "Personne à qui écrire pour l'instant. Marquez vos acceptations dans « Mes invitations »."}
                    </p>
                  </div>
                ) : (
                  filtrees.map(function (l) {
                    const active = ouverte === cleDe(l);
                    const jr = onglet === "envoyes" ? joursDepuis(l.linkedin_relance_le) : null;
                    const aRelancer = jr !== null && jr >= JOURS_AVANT_RELANCE;
                    return (
                      <div key={cleDe(l)} style={{ ...CARTE, borderColor: active ? "rgba(0,230,118,0.4)" : aRelancer ? "rgba(232,163,61,0.45)" : CARTE.border }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                          <div style={{ flex: "1 1 240px" }}>
                            <div style={{ color: "#fff", fontSize: "15.5px", fontWeight: "bold" }}>
                              {nomDe(l)}
                              {etiquetteCampagne(l)}
                            </div>
                            <div style={{ color: OR, fontSize: "13.5px", marginTop: "2px" }}>
                              {capitaliser(l.raison_sociale) || "—"}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
                              {capitaliser(l.ville)}
                              {onglet === "envoyes" && l.linkedin_relance_le ? (
                                <span>
                                  {l.ville ? " · " : ""}
                                  écrit le {jolieDate(l.linkedin_relance_le)}
                                  {jr !== null ? " · il y a " + jr + " jour" + (jr > 1 ? "s" : "") : ""}
                                </span>
                              ) : ""}
                            </div>
                            {aRelancer && (
                              <div style={{ color: ORANGE, fontSize: "12.5px", marginTop: "6px", fontWeight: "bold" }}>
                                Sans réponse depuis {jr} jours — une seconde relance se justifie
                              </div>
                            )}
                            {coordonnees(l)}
                          </div>
                          <a href={lien(l.linkedin)} target="_blank" rel="noreferrer"
                            style={{ color: BLEU, fontSize: "12.5px", textDecoration: "none", alignSelf: "center" }}>
                            Ouvrir la messagerie ↗
                          </a>
                        </div>

                        {/* 🆕 LA SUITE DE LA CONVERSATION — 27/08.

                            LE MANQUE. Les statuts s arretaient au message
                            envoye : rien ne disait ce qui se passait
                            ensuite. Le taux de concretisation etait donc
                            incalculable — on savait combien de portes on
                            avait frappees, jamais combien s etaient
                            ouvertes.

                            ⚠️ CHAQUE ETAT COMPTE DANS TOUS CEUX QUI LE
                            PRECEDENT : un client a forcement repondu. La
                            fiche reste donc visible ici quel que soit son
                            avancement. */}
                        {onglet === "envoyes" && (
                          <div style={{ marginTop: "12px", paddingTop: "12px",
                            borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ color: OR, fontSize: "11.5px",
                              letterSpacing: "1.5px", marginBottom: "8px" }}>
                              OÙ EN EST LA CONVERSATION ?
                            </div>
                            <div style={{ display: "flex", gap: "7px",
                              flexWrap: "wrap" }}>
                              {[
                                { cle: "repondu", nom: "A répondu", couleur: BLEU },
                                { cle: "rendez_vous", nom: "Rendez-vous pris", couleur: ORANGE },
                                { cle: "client", nom: "Devenu client", couleur: VERT },
                              ].map(function (e: any) {
                                const actif = l.linkedin_statut === e.cle;
                                return (
                                  <button key={e.cle}
                                    onClick={() => marquer(l, e.cle)}
                                    disabled={false}
                                    style={{
                                      flex: "1 1 140px", padding: "10px",
                                      borderRadius: "8px", fontSize: "12.5px",
                                      fontFamily: "Georgia,serif",
                                      cursor: "pointer",
                                      fontWeight: actif ? "bold" : "normal",
                                      background: actif
                                        ? e.couleur
                                        : "rgba(255,255,255,0.04)",
                                      color: actif ? "#050508" : e.couleur,
                                      border: actif
                                        ? "none"
                                        : "1px solid " + e.couleur + "55",
                                    }}>
                                    {actif ? "✓ " : ""}{e.nom}
                                  </button>
                                );
                              })}
                            </div>
                            <p style={{ color: "rgba(255,255,255,0.35)",
                              fontSize: "12px", lineHeight: "1.7",
                              margin: "9px 0 0" }}>
                              C'est ce qui permet de savoir ce que rapporte
                              vraiment une invitation.
                            </p>
                          </div>
                        )}

                        {blocFiche(l)}

                        {/* 🆕 LE RETOUR EN ARRIERE — 28/08.

                            LE DEFAUT. Une fiche marquee « a accepte » par
                            erreur ne pouvait plus revenir a son etat
                            precedent : les seuls boutons disponibles la
                            faisaient AVANCER dans le parcours.

                            ⚠️ LA DATE D INVITATION EST CONSERVEE. Revenir
                            en arriere ne consomme aucun quota et ne
                            reecrit pas la date d origine. */}
                        {onglet === "relancer" && (
                          <div style={{ marginTop: "10px" }}>
                            <button
                              onClick={() => marquer(l, "invite_nu")}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "rgba(255,255,255,0.4)",
                                fontSize: "12.5px",
                                fontFamily: "Georgia,serif",
                                cursor: "pointer",
                                padding: "4px 0",
                                textDecoration: "underline",
                              }}>
                              Marqué par erreur ? Remettre en attente
                            </button>
                          </div>
                        )}

                        {!active ? (
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                            <button
                              onClick={() => {
                                setOuverte(cleDe(l));
                                setTexteLong(texteDe(l, onglet === "envoyes"));
                              }}
                              style={{ ...BOUTON, flex: "2 1 200px" }}>
                              {onglet === "envoyes" ? "Préparer une relance" : "Préparer le message"}
                            </button>
                            {onglet === "envoyes" && (
                              <button onClick={() => marquer(l, "refuse")} disabled={false}
                                style={{ ...BOUTON, flex: "1 1 130px", fontSize: "13px", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
                                Sans suite
                              </button>
                            )}
                            {/* Le retour en arriere : la fiche revient dans
                                « A ecrire » avec sa date d origine. */}
                            {onglet === "envoyes" && (
                              <button onClick={() => marquer(l, "accepte_nu")}
                                style={{ ...BOUTON, flex: "1 1 150px", fontSize: "13px", color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.12)" }}>
                                Message pas parti
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ marginTop: "14px" }}>
                            <textarea value={texteLong} onChange={(e) => setTexteLong(e.target.value)} rows={16} style={CHAMP} />

                            <button onClick={() => copier(texteLong, "long")}
                              style={{ ...BOUTON, width: "100%", marginTop: "11px", background: copie === "long" ? "rgba(0,230,118,0.15)" : BOUTON.background, color: copie === "long" ? VERT : OR, borderColor: copie === "long" ? "rgba(0,230,118,0.4)" : BOUTON.border }}>
                              {copie === "long" ? "✓ Copié — collez-le dans la messagerie" : "Copier le message"}
                            </button>

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "9px" }}>
                              <button
                                onClick={() => { setOuverte(null); marquer(l, "relance"); }}
                                style={{ flex: "2 1 200px", background: "rgba(0,230,118,0.13)", color: VERT, border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "13px", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                                ✓ Message envoyé
                              </button>
                              <button onClick={() => setOuverte(null)}
                                style={{ ...BOUTON, flex: "1 1 110px", padding: "13px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                                Fermer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
