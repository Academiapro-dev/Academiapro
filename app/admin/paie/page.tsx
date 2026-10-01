"use client";

// ═══════════════════════════════════════════════════════════════════════
// L ECRAN DE PAIE — 15/09/2026, corrige le 16/09
//
// Trois temps : choisir un contrat, saisir ce qui s est passe ce mois-ci,
// sortir le bulletin.
//
// 🚨 LE CALCUL S AFFICHE AVANT DE GENERER LE PDF. On regarde, on verifie,
// PUIS on sort le document. Un bulletin qu on decouvre en l ouvrant est un
// bulletin qu on corrige apres l avoir remis au salarie.
//
// 🚨 LE BULLETIN SORT EN BROUILLON. Il ne devient « emis » que par un geste
// separe, et ce geste est irreversible. C est la meme regle que le registre
// des mandats : ce qui est sorti est sorti.
//
// 🚨 UN SEUL BULLETIN PAR CONTRAT ET PAR MOIS (decision de Jacques,
// 16/09). Recalculer REECRIT le brouillon du mois ; si le mois est deja
// emis, le bouton ouvre un RECTIFICATIF qui annulera le precedent.
//
// ⚠️ LE SALAIRE DE BASE NE SE SAISIT PAS : il se calcule depuis le taux
// horaire du contrat et la duree mensuelle. On ne pose ici QUE ce qui sort
// de l ordinaire — heures supplementaires, primes, absences.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 17/09 — LES SIGNALEMENTS, APRES LEUR PASSAGE DANS dsn-val
//
// Les trois fichiers DSN passent l outil officiel. Mais l arret de travail
// n y est arrive qu avec trois donnees AJOUTEES A LA MAIN EN BASE, parce que
// cet ecran ne les demandait pas :
//   · la date de fin previsionnelle — le champ existait, il etait facultatif
//   · le BIC — le champ existait, il etait facultatif
//   · la date de fin de subrogation — LE CHAMP N EXISTAIT PAS
// ⚠️ LA MEME LECON QUE LE 16/09, mot pour mot : un champ absent de l ecran
// n existe pas, meme si la base et la route le prevoient. La route acceptait
// `subro_fin` depuis le premier jour.
//
// TROIS AUTRES DEFAUTS, TOUS VUS PAR JACQUES EN SE SERVANT DE L ECRAN :
//   1. LE FORMULAIRE VIDE, pose juste au-dessus de la liste, SEMBLAIT PILOTER
//      LES LIGNES DU DESSOUS. Il a cru qu une case decochee changeait un
//      arret deja enregistre. Le formulaire et la liste portent desormais
//      chacun leur titre, et une phrase dit que l un ne modifie pas l autre.
//   2. LA LISTE NE MONTRAIT PAS CE QUI AVAIT ETE ENREGISTRE : ni la fin de
//      l arret, ni celle de la subrogation. Impossible de verifier une saisie
//      sans aller lire la base. Chaque ligne dit maintenant ce qu elle porte,
//      et signale EN ROUGE ce qui lui manque.
//   3. LE FICHIER GENERE N AVAIT AUCUNE SORTIE : il fallait une requete SQL
//      pour le recuperer. Il se telecharge et se partage depuis sa ligne.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";

const OR = "#c8a96e";
const VERT = "#7fc97f";
const ROUGE = "#e57373";
// 🆕 28/09 — le troisieme feu de la validation.
const ORANGE = "#f0a860";
const FOND = "#0b0b10";
const CARTE = "rgba(255,255,255,0.04)";
const BORD = "1px solid rgba(255,255,255,0.10)";

const CADRE: any = {
  background: CARTE, border: BORD, borderRadius: "10px",
  padding: "18px", marginBottom: "18px",
};
const CHAMP: any = {
  // 🆕 01/10 — minWidth 0 : sur iPad, un champ date garde sinon une largeur
  // minimale propre et deborde de sa case (meme defaut que l ecran DSN).
  width: "100%", minWidth: 0, padding: "9px 11px", borderRadius: "7px",
  border: "1px solid rgba(255,255,255,0.16)", background: "rgba(0,0,0,0.30)",
  color: "#fff", fontSize: "14px", fontFamily: "Georgia,serif",
  boxSizing: "border-box",
};
const LIB: any = {
  display: "block", fontSize: "13.5px", color: "rgba(255,255,255,0.76)",
  marginBottom: "4px",
};
const BOUTON: any = {
  padding: "10px 18px", borderRadius: "7px", border: "none",
  background: OR, color: "#0b0b10", fontSize: "14px", fontWeight: "bold",
  fontFamily: "Georgia,serif", cursor: "pointer",
};
// 🆕 01/10 — LES BOUTONS SECONDAIRES SE VOIENT, comme sur l ecran DSN depuis
// le 30/09 (remarque de Jacques : « l ecriture grise sur fond noir, pas
// terrible, la preuve j ai eu du mal a trouver »). Fond dore leger, gras.
const SECOND: any = {
  ...BOUTON, background: "rgba(200,169,110,0.12)", color: OR,
  border: "1px solid " + OR, fontWeight: "bold",
};
const LIEN: any = {
  background: "none", border: "none", cursor: "pointer", fontSize: "13.5px",
  fontFamily: "Georgia,serif", padding: 0,
};

// Les six motifs legaux de recours au travail temporaire.
// 🚨 IL N EN EXISTE PAS D AUTRE (art. L1251-6). « Surcroit de travail »
// n en est pas un : c est « accroissement temporaire d activite ».
const MOTIFS = [
  "Remplacement d'un salarié absent",
  "Accroissement temporaire d'activité",
  "Emploi à caractère saisonnier",
  "Usage constant dans le secteur",
  "Remplacement d'un chef d'entreprise",
  "Complément de formation professionnelle",
];

const TYPES_ELEMENT = [
  { cle: "heures_sup_25", nom: "Heures supplémentaires 25 %", soumis: true },
  { cle: "heures_sup_50", nom: "Heures supplémentaires 50 %", soumis: true },
  // 🆕 28/09 — les heures complémentaires du temps partiel.
  { cle: "heures_comp_10", nom: "Heures complémentaires 10 % (temps partiel)", soumis: true },
  // 🆕 28/09 — cas rares : avantages evalues au montant.
  { cle: "avantage_logement_assurance", nom: "Assurance du logement de fonction payée par l'employeur", soumis: true },
  // 🆕 28/09 — le compteur des jours de repos du forfait en jours.
  { cle: "jours_repos_forfait", nom: "Jours de repos du forfait pris (forfait en jours)", soumis: true },
  { cle: "avantage_logement_reel", nom: "Avantage logement évalué au réel", soumis: true },
  { cle: "avantage_vehicule_reel", nom: "Avantage véhicule évalué au réel (remplace le forfait)", soumis: true },
  { cle: "heures_comp_25", nom: "Heures complémentaires 25 % (temps partiel)", soumis: true },
  { cle: "prime", nom: "Prime", soumis: true },
  { cle: "panier", nom: "Panier repas", soumis: false },
  { cle: "transport", nom: "Transport", soumis: false },
  { cle: "absence_maladie", nom: "Absence maladie", soumis: true },
  { cle: "absence_injustifiee", nom: "Absence injustifiée", soumis: true },
  // 🆕 20/09 — DEUX NATURES QUI NE SE SAISISSENT PAS COMME LES AUTRES :
  // leurs trois champs ne veulent pas dire la même chose, et l'écran le dit
  // sous le formulaire dès qu'elles sont choisies.
  { cle: "avantage_repas", nom: "Avantage en nature — repas", soumis: true },
  { cle: "titres_restaurant", nom: "Titres-restaurant", soumis: false },
  { cle: "avantage_logement", nom: "Avantage en nature — logement", soumis: true },
  // 🆕 27/09 — l'avance déjà versée au salarié, retenue sur le net.
  { cle: "acompte", nom: "Acompte déjà versé", soumis: false },
  // 🆕 27/09 — l'indemnité de licenciement ou de rupture conventionnelle.
  { cle: "indemnite_rupture", nom: "Indemnité de licenciement ou de rupture conventionnelle", soumis: false },
];

// 🚨 CE QUE CHAQUE CHAMP VEUT DIRE POUR CES DEUX NATURES. Sans cette aide,
// le même champ « Taux » signifierait la participation du salarié dans un
// cas et la valeur faciale du titre dans l'autre : personne ne peut le
// deviner, et une saisie inversée passe inaperçue sur le bulletin.
const AIDE_ELEMENT: any = {
  jours_repos_forfait: "Quantité = nombre de jours de repos du forfait pris ce mois. Taux et montant : "
    + "laisser vides — ce n'est pas une somme, le compteur de l'année s'affiche dans les notes.",
  avantage_logement_assurance: "Montant = part mensuelle de l'assurance du logement de fonction payée "
    + "par l'employeur. Elle s'ajoute à l'avantage logement : au brut, puis déduite du net.",
  avantage_logement_reel: "Montant = valeur locative mensuelle (valeur cadastrale / 12) + avantages "
    + "accessoires réels (eau, énergie, chauffage…), moins la participation du salarié. À la place "
    + "de l'élément « avantage logement » au forfait, jamais les deux.",
  avantage_vehicule_reel: "Montant = dépenses réelles du mois pour l'usage privé du véhicule. Le forfait "
    + "du véhicule porté sur le contrat ne s'applique pas ce mois-là.",
  heures_comp_10: "Temps partiel seulement. Quantité = nombre d'heures au-delà de la durée du "
    + "contrat, dans la limite du dixième de cette durée. Taux : laisser vide, il se calcule "
    + "(taux horaire majoré de 10 %). Montant : laisser vide.",
  heures_comp_25: "Temps partiel seulement. Quantité = heures au-delà du dixième de la durée du "
    + "contrat (un accord doit le permettre ; jamais plus du tiers). Taux : laisser vide "
    + "(majoré de 25 %). Montant : laisser vide.",
  avantage_repas: "Quantité = nombre de repas fournis dans le mois. "
    + "Taux = participation du salarié PAR REPAS (laisser vide s'il ne paie "
    + "rien). Montant : ne rien mettre, le barème URSSAF s'applique.",
  titres_restaurant: "Quantité = nombre de titres. Taux = valeur faciale "
    + "d'un titre. Montant = part patronale PAR TITRE. La part salariale se "
    + "déduit toute seule et se retient sur le net.",
  indemnite_rupture: "Montant = indemnité versée au départ (licenciement, ou indemnité "
    + "spécifique de rupture conventionnelle). Le moteur calcule le minimum légal, le signale "
    + "si le montant est inférieur, et applique le régime : exonérée de cotisations, CSG-CRDS "
    + "au-delà du minimum légal, contribution patronale de 40 % en rupture conventionnelle. "
    + "Le motif de rupture du contrat doit être renseigné. Quantité et taux : ne rien mettre.",
  acompte: "Montant = somme déjà versée au salarié ce mois-ci, en avance sur son "
    + "salaire. Elle se retient sur le net à payer ; elle ne change ni le brut, ni "
    + "les cotisations, ni le net imposable. Quantité et taux : ne rien mettre.",
  avantage_logement: "Quantité = nombre de PIÈCES PRINCIPALES (séjour et "
    + "chambres seulement ; cuisine, salle d'eau et WC sont exclus). "
    + "Taux = loyer versé par le salarié, s'il en paie un. Montant : ne rien "
    + "mettre, le barème URSSAF croise la tranche de salaire et les pièces.",
};

// 🆕 LE SIGNALEMENT VIDE, ECRIT UNE SEULE FOIS. Il etait recopie a deux
// endroits — a l ouverture et apres l enregistrement : ajouter un champ a
// l un sans l autre aurait laisse une valeur fantome dans le formulaire.
const EV_VIDE: any = {
  type_evenement: "arret", motif: "", date_debut: "", date_fin: "",
  dernier_jour_travaille: "", subrogation: false, iban: "", bic: "",
  subro_fin: "", date_notification: "", dernier_jour_paye: "",
  // 🆕 20/09 — LA REPRISE ANTICIPEE, PORTEE PAR L ARRET LUI-MEME.
  // ⛔ ELLE DOIT PASSER PAR LE FORMULAIRE : « modifier » est un retrait suivi
  // d une saisie. Un champ que le formulaire ne porte pas DISPARAIT a la
  // premiere modification, sans aucun message.
  reprise_date: "", reprise_motif: "",
};

function moisCourant(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01";
}

function euros(n: any): string {
  return Number(n || 0).toLocaleString("fr-FR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 🆕 UNE DATE DE LA BASE, RENDUE LISIBLE : « 2026-09-24 » devient
// « 24/09/2026 ». Vide quand il n y a rien — l appelant decide quoi dire.
function jma(d: any): string {
  const t = String(d || "");
  if (t.length < 10) return "";
  return t.slice(8, 10) + "/" + t.slice(5, 7) + "/" + t.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LES AIDES DE LA VALIDATION DU MOIS
// ═══════════════════════════════════════════════════════════════════════
function couleurPastille(c: any): string {
  if (c === "rouge") return ROUGE;
  if (c === "orange") return ORANGE;
  if (c === "vert") return VERT;
  return "rgba(255,255,255,0.25)";
}

function etatValidation(b: any): string {
  if (!b) return "";
  if (b.statut === "emis") return "émis" + (b.valide_par ? " par " + b.valide_par : "");
  if (b.validation === "a_valider") return "à valider (soumis par " + (b.soumis_par || "?") + ")";
  if (b.validation === "renvoye") return "renvoyé pour correction";
  return "brouillon";
}

function texteDroits(d: any): string {
  if (!d || !d.voir) return "aucun";
  const l: string[] = [];
  if (d.contrats) l.push("fiches et contrats");
  if (d.preparer) l.push("préparer la paie");
  if (d.emettre) l.push("émettre");
  if (d.deposer) l.push("déposer");
  return (l.length > 0 ? l.join(", ") : "consultation seule")
    + (d.carte_blanche ? " — carte blanche"
      : d.emettre ? " — sans carte blanche : vos bulletins passent par une validation" : "");
}

function texteRecap(r: any): string {
  if (!r) return "pas encore envoyé. Sans la confirmation du client, aucun bulletin du mois ne peut être émis.";
  const le = jma(String(r.envoye_le || "").slice(0, 10));
  if (r.statut === "envoye") return "envoyé à " + (r.destinataire || "?") + " le " + le + ", en attente de sa confirmation.";
  if (r.statut === "confirme") {
    return r.a_jour
      ? "confirmé par le client le " + jma(String(r.repondu_le || "").slice(0, 10)) + "."
      : "confirmé le " + jma(String(r.repondu_le || "").slice(0, 10)) + ", mais la paie a changé depuis : renvoyez-le.";
  }
  if (r.statut === "conteste") return "le client signale une erreur : « " + (r.remarque || "sans précision") + " ». Corrigez, puis renvoyez-le.";
  if (r.statut === "leve") return "attente du client levée par " + (r.envoye_par || "?") + " : « " + (r.remarque || "") + " ».";
  return String(r.statut || "");
}

// 🆕 29/09 — LE MOIS EN CLAIR, et LE STYLE D UN GESTE. Les gestes de la
// validation etaient de petits liens de texte, perdus entre les phrases :
// l editeur lui-meme devait les chercher. Ce sont maintenant de vrais
// boutons, a la couleur de leur consequence.
const NOMS_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
  "août", "septembre", "octobre", "novembre", "décembre"];
function libelleMois(p: string): string {
  const a = String(p || "").slice(0, 4);
  const m = Number(String(p || "").slice(5, 7));
  return (NOMS_MOIS[m - 1] || "") + " " + a;
}
function GESTE(couleur: string): any {
  return { background: "transparent", border: "1px solid " + couleur, color: couleur,
    borderRadius: "7px", padding: "6px 12px", fontSize: "14px", cursor: "pointer",
    fontFamily: "Georgia,serif", lineHeight: 1.2 };
}

// 🆕 28/09 — LA PIECE JUSTIFICATIVE PART LEGERE. Une photo d iPad pese
// plusieurs megaoctets ; la route n accepte que 3 Mo (la requete entiere
// est limitee a 4,5 Mo chez Vercel). On la redessine a 1 600 pixels au
// plus, en JPEG : largement lisible, dix fois plus legere.
function lireBase64(f: File): Promise<string> {
  return new Promise(function (ok, ko) {
    const r = new FileReader();
    r.onload = function () { ok(String(r.result || "").split(",")[1] || ""); };
    r.onerror = function () { ko(new Error("lecture impossible")); };
    r.readAsDataURL(f);
  });
}

async function fichierPourEnvoi(f: File): Promise<{ type: string; base64: string }> {
  const type = String(f.type || "").toLowerCase();
  if (type === "application/pdf") {
    if (f.size > 3 * 1024 * 1024) throw new Error("PDF trop lourd : 3 Mo au plus");
    return { type: type, base64: await lireBase64(f) };
  }
  if (type.indexOf("image/") === 0) {
    const url = URL.createObjectURL(f);
    try {
      const img: any = await new Promise(function (ok, ko) {
        const i = new Image();
        i.onload = function () { ok(i); };
        i.onerror = function () { ko(new Error("image illisible")); };
        i.src = url;
      });
      const k = Math.min(1, 1600 / Math.max(img.width || 1, img.height || 1));
      const toile = document.createElement("canvas");
      toile.width = Math.max(1, Math.round(img.width * k));
      toile.height = Math.max(1, Math.round(img.height * k));
      const g = toile.getContext("2d");
      if (!g) throw new Error("image illisible");
      g.drawImage(img, 0, 0, toile.width, toile.height);
      return { type: "image/jpeg", base64: toile.toDataURL("image/jpeg", 0.8).split(",")[1] || "" };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  throw new Error("format non accepté : un PDF ou une photo");
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 22/09 — UN MESSAGE D ERREUR NE SE RECOPIE PAS TEL QUEL A L ECRAN
//
// Dans la nuit du 21 au 22/09, Supabase est tombee. La route a relaye le
// corps de la reponse, et l ecran a affiche UNE PAGE CLOUDFLARE ENTIERE en
// rouge — balises comprises, sur quinze ecrans de haut. Jacques ne pouvait
// ni lire la cause, ni savoir s il devait reessayer ou appeler quelqu un.
//
// ⚠️ LE DEFAUT N ETAIT PAS LA PANNE : c est que l ecran ait pris pour un
// message ce qui etait un DOCUMENT. Un message d erreur est destine a etre
// LU : s il ne l est pas, il ne sert a rien.
//
// CE QUE FAIT CETTE FONCTION, dans l ordre :
//   1. elle reconnait une panne d infrastructure (HTML, 5xx, delai depasse,
//      connexion refusee) et la remplace par une phrase qui dit QUOI FAIRE ;
//   2. a defaut, elle coupe tout message demesure a 400 caracteres, parce
//      qu un message qu il faut faire defiler n est plus un message.
// ⛔ ELLE NE MASQUE JAMAIS UN MESSAGE METIER : « le bulletin est deja
// emis », « la date de reprise precede l arret » passent intacts. Ce sont
// eux qui disent a l utilisateur ce qu il a fait de travers.
// ═══════════════════════════════════════════════════════════════════════
const PANNE_BASE = "La base de données ne répond pas pour le moment. "
  + "Réessaie dans un instant — rien n'a été enregistré.";

function lisible(m: any): string {
  const t = String(m || "");
  if (!t) return "";
  const bas = t.toLowerCase();

  // 1. UNE PAGE HTML N EST PAS UN MESSAGE. Cloudflare, Vercel et les
  //    passerelles repondent par un document quand le serveur ne suit plus.
  if (bas.indexOf("<!doctype") >= 0 || bas.indexOf("<html") >= 0
    || bas.indexOf("<body") >= 0 || bas.indexOf("<head") >= 0) return PANNE_BASE;

  // 2. LES SIGNATURES D UNE PANNE D INFRASTRUCTURE. Elles remontent telles
  //    quelles depuis le reseau ou depuis la passerelle, en anglais, et ne
  //    veulent rien dire pour qui fait de la paie.
  const signes = [
    "connection timed out", "error code 522", "522:", "error 522",
    // ⛔ PAS DE CODE NU (« 502 », « 503 ») : un message metier porte des
    // montants, et « net a payer 1 502 € » deviendrait une panne. On ne
    // reconnait que des formes qui ne peuvent pas etre du francais.
    "gateway time-out", "gateway timeout", "bad gateway",
    "service unavailable", "cloudflare",
    "fetch failed", "failed to fetch", "networkerror", "network error",
    "econnrefused", "econnreset", "etimedout", "enotfound", "socket hang up",
    "upstream connect error", "timeout exceeded", "canceling statement due to",
    "too many connections", "remaining connection slots", "load failed",
  ];
  // ⛔ ON NE MET PAS « TypeError » DANS CETTE LISTE, meme si Safari en
  // produit pendant une coupure : un vrai defaut de programmation en produit
  // aussi, et il deviendrait invisible derriere « la base ne repond pas ».
  // Un message rassurant sur un defaut reel coute plus cher qu un message
  // technique sur une panne.
  for (let i = 0; i < signes.length; i++) {
    if (bas.indexOf(signes[i]) >= 0) return PANNE_BASE;
  }

  // 3. LE RESTE PASSE, MAIS SANS DEBORDER. Un message metier tient en deux
  //    lignes ; au-dela, c est une trace technique qu on n a pas reconnue.
  if (t.length > 400) return majuscule(t.slice(0, 400) + " […]");
  return majuscule(t);
}

// 🆕 01/10 — UN MESSAGE COMMENCE PAR UNE MAJUSCULE. Les refus de la route
// sont ecrits en minuscule (« le numéro de sécurité sociale… », « la clé… »)
// parce qu ils servent aussi au milieu d une phrase ; affiches seuls, en
// bas de l ecran, ils doivent commencer comme une phrase (vu a l ecran le
// 01/10, pendant le tournage de la video de la paie).
function majuscule(m: any): string {
  const t = String(m || "");
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨🚨 LE FICHIER SE TELECHARGE EN ISO 8859-1, PAS EN UTF-8
//
// C EST LE PIEGE LE PLUS COUTEUX DE LA DSN, et il se rejoue ICI : le
// navigateur, laisse a lui-meme, ecrit tout fichier texte en UTF-8. Un « é »
// y tient sur deux octets ; la norme n en attend qu un. « 12 rue de la
// République » suffit a faire REJETER LA DECLARATION ENTIERE.
//
// ⚠️ LE GENERATEUR MENSUEL LE FAIT COTE SERVEUR (Buffer « latin1 »). Le
// signalement, lui, est garde en base comme un texte : c est donc au moment
// de le sortir qu il faut le convertir, caractere par caractere.
//
// ⛔ LE GENERATEUR NE LAISSE PASSER QUE DES CARACTERES DE CETTE TABLE (sa
// fonction `latin`). Si l un d eux en sortait malgre tout, on ecrit « ? » :
// un caractere faux se voit, un octet en trop casse tout sans rien montrer.
// ═══════════════════════════════════════════════════════════════════════
function octetsLatin1(texte: string): any {
  const o = new Uint8Array(texte.length);
  for (let i = 0; i < texte.length; i++) {
    const c = texte.charCodeAt(i);
    o[i] = c <= 255 ? c : 63;
  }
  return o;
}

export default function PagePaie() {
  // 🆕🚨 28/09 — PLUS DE CLE. L ecran s ouvre avec la connexion : la route
  // sait qui regarde, borne tout a son organisme et verifie chaque geste.
  // Decision de Jacques : « libre acces » une fois connecte, et la paie
  // ouverte aux collaborateurs selon leurs droits.
  const [pret, setPret] = useState(false);
  const [connexionRequise, setConnexionRequise] = useState(false);
  const [profil, setProfil] = useState<any>(null);
  // 🆕 28/09 — la validation du mois, le recapitulatif, la mesure.
  const [mois, setMois] = useState<any>(null);
  const [recapDest, setRecapDest] = useState("");
  const [motifs, setMotifs] = useState<any>({});
  const [mesure, setMesure] = useState<any>(null);
  const [contrats, setContrats] = useState<any[]>([]);
  const [societes, setSocietes] = useState<any[]>([]);
  const [choisi, setChoisi] = useState<any>(null);
  const [periode, setPeriode] = useState(moisCourant());
  const [elements, setElements] = useState<any[]>([]);
  const [calcul, setCalcul] = useState<any>(null);
  // 🆕 27/09 — les jours travailles en cours de modification (null = ferme).
  const [joursSaisie, setJoursSaisie] = useState<number[] | null>(null);
  // 🆕 27/09 — le taux personnalise de prelevement en cours de saisie.
  const [pasSaisie, setPasSaisie] = useState<any>(null);
  const [bulletins, setBulletins] = useState<any[]>([]);
  // ⚠️ LES CONGES NE CONCERNENT QUE LE CDI : sur une mission ou un CDD ils
  // sont compenses par l ICCP, et ce bloc reste invisible.
  const [conges, setConges] = useState<any>(null);
  const [joursPris, setJoursPris] = useState("");

  // ⚠️ LES SIGNALEMENTS CONCERNENT TOUS LES CONTRATS, pas seulement le CDI :
  // un interimaire tombe malade comme un autre, et toute mission finit.
  const [evenements, setEvenements] = useState<any>(null);
  const [ev, setEv] = useState<any>(Object.assign({}, EV_VIDE));
  // 🆕🚨 18/09 — LE MESSAGE D ERREUR S AFFICHE A COTE DU BOUTON QUI L A
  // PROVOQUE. Jusqu ici il partait dans le bandeau du HAUT de la page, alors
  // que « Enregistrer ce signalement » est TOUT EN BAS : on touchait, rien ne
  // bougeait sous les yeux, et il fallait remonter pour comprendre. Jacques
  // l a vu a l ecran le 17/09 au soir.
  // ⚠️ LE BANDEAU DU HAUT RESTE POUR LE RESTE DE LA PAGE (calcul, bulletins,
  // conges) : c est ce bloc-ci qui etait trop loin, pas les autres.
  const [errEv, setErrEv] = useState("");
  // 🆕 LA LIGNE EN COURS DE MODIFICATION. Vide = on saisit un nouveau
  // signalement ; sinon, le formulaire corrige celui-la.
  const [modifie, setModifie] = useState<any>(null);
  // 🆕 LE PARTAGE N EXISTE PAS PARTOUT : iOS le propose, un navigateur de
  // bureau rarement. On ne montre le lien que la ou il marche.
  const [partagePossible, setPartagePossible] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [occupe, setOccupe] = useState("");
  // 🆕 28/09 — UN SEUL MESSAGE A LA FOIS : LE DERNIER. Essai du 28/09 :
  // « Justification enregistrée. » restait affiche a cote du refus qui a
  // suivi. Un message de reussite s efface seul apres dix secondes ; un
  // refus reste jusqu a ce qu on le ferme.
  const [seuilsVus, setSeuilsVus] = useState<any>(null);
  const [seuilsSaisie, setSeuilsSaisie] = useState<any>({});
  useEffect(function () { if (msg) setErr(""); }, [msg]);
  useEffect(function () { if (err) setMsg(""); }, [err]);
  useEffect(function () {
    if (!msg) return;
    const t = setTimeout(function () { setMsg(""); }, 10000);
    return function () { clearTimeout(t); };
  }, [msg]);
  // 🆕 28/09 — la modification du contrat, et la liste des motifs de rupture.
  const [contratSaisie, setContratSaisie] = useState<any>(null);
  const [motifsRupture, setMotifsRupture] = useState<any[]>([]);
  // 🆕 20/09 — la prime de vacances Syntec : une obligation d ENTREPRISE.
  const [prime, setPrime] = useState<any>(null);
  // 🆕 20/09 — les documents de fin de contrat.
  const [finDoc, setFinDoc] = useState<any>(null);
  const [nouveau, setNouveau] = useState(false);
  const [f, setF] = useState<any>({ type_contrat: "mission", categorie: "non_cadre", duree_hebdo: 35 });
  const [e, setE] = useState<any>({ type_element: "heures_sup_25" });

  // ⚠️ LE SECRET EST DEMANDE UNE FOIS ET GARDE DANS L ONGLET. Il ne part
  // pas en base et disparait a la fermeture.
  useEffect(function () {
    charger();
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    setPartagePossible(!!(nav && nav.share && nav.canShare));
  }, []);

  // 🆕🚨 22/09 — TOUT PASSE PAR ICI, DONC TOUT SE PROTEGE ICI.
  //
  // ⛔ AVANT : `return await r.json()`. Quand la base est tombee, la route a
  // repondu une PAGE HTML au lieu d un JSON ; `r.json()` a leve, et chaque
  // appelant s est arrete au milieu — l indicateur « … » restait allume, et
  // AUCUN MESSAGE n apparaissait. L ecran semblait mort.
  // ⚠️ ON REND TOUJOURS UN OBJET, jamais une exception : les appelants
  // testent `d.success` et `d.erreur`, ils n ont pas a se proteger chacun.
  async function appeler(corps: any): Promise<any> {
    try {
      const r = await fetch("/api/paie/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const texte = await r.text();
      try {
        return JSON.parse(texte);
      } catch (e) {
        // La reponse n est pas du JSON : c est une page d erreur servie a la
        // place de la route. `lisible` la traduira en phrase.
        return { success: false, erreur: texte || ("réponse illisible (" + r.status + ")") };
      }
    } catch (e: any) {
      return { success: false, erreur: String(e && e.message ? e.message : e) };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕 27/09 — LES JOURS TRAVAILLES DANS LA SEMAINE
  // 0 = dimanche … 6 = samedi, comme le moteur. Vide sur le contrat = du
  // lundi au vendredi.
  // ═══════════════════════════════════════════════════════════════════
  function joursDuContrat(c: any): number[] {
    const brut = String((c && c.jours_travailles) || "").trim();
    if (!brut) return [1, 2, 3, 4, 5];
    const l: number[] = [];
    for (const m of brut.split(/[^0-9]+/)) {
      if (m === "") continue;
      const n = Number(m);
      if (n >= 0 && n <= 6 && l.indexOf(n) < 0) l.push(n);
    }
    return l.length > 0 ? l.sort(function (a, b) { return a - b; }) : [1, 2, 3, 4, 5];
  }

  async function enregistrerJours() {
    if (!choisi || !joursSaisie) return;
    setErr(""); setMsg(""); setOccupe("jours");
    const d = await appeler({ action: "repartition", contrat_id: choisi.id, jours: joursSaisie });
    if (d && d.success) {
      setMsg(d.message || "Enregistré.");
      const maj = { ...choisi, jours_travailles: d.jours_travailles };
      setChoisi(maj);
      setContrats(contrats.map(function (x: any) { return x.id === maj.id ? maj : x; }));
      setJoursSaisie(null);
      setCalcul(null);
    } else {
      setErr(lisible(d && d.erreur ? d.erreur : "enregistrement impossible"));
    }
    setOccupe("");
  }

  // 🆕 27/09 — LE TAUX PERSONNALISE DE PRELEVEMENT A LA SOURCE (vide =
  // retour a la grille du taux non personnalise).
  async function enregistrerPas(effacer?: boolean) {
    if (!choisi || !pasSaisie) return;
    setErr(""); setMsg(""); setOccupe("pas");
    const d = await appeler({
      action: "taux_pas", contrat_id: choisi.id,
      taux: effacer ? "" : (pasSaisie.taux || ""),
      date_effet: pasSaisie.date_effet || "",
      identifiant_crm: pasSaisie.identifiant_crm || "",
    });
    if (d && d.success) {
      setMsg(d.message || "Enregistré.");
      const sal = { ...(choisi.paie_salaries || {}),
        taux_pas: effacer ? null : String(pasSaisie.taux || "").replace(",", "."),
        taux_pas_date_effet: effacer ? null : (pasSaisie.date_effet || null),
        taux_pas_identifiant_crm: effacer ? null : (pasSaisie.identifiant_crm || null) };
      const maj = { ...choisi, paie_salaries: sal };
      setChoisi(maj);
      setContrats(contrats.map(function (x: any) { return x.id === maj.id ? maj : x; }));
      setPasSaisie(null);
      setCalcul(null);
    } else {
      setErr(lisible(d && d.erreur ? d.erreur : "enregistrement impossible"));
    }
    setOccupe("");
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 28/09 — MODIFIER LE CONTRAT (salaire, heures, coefficient, lieu de
  // travail, fin prevue, rupture). Jusqu ici : SQL seulement.
  // ═══════════════════════════════════════════════════════════════════
  async function ouvrirContrat() {
    if (!choisi) return;
    if (contratSaisie) { setContratSaisie(null); return; }
    const v = function (x: any): string { return x === null || x === undefined ? "" : String(x); };
    setContratSaisie({
      intitule_poste: v(choisi.intitule_poste), pcs_ese: v(choisi.pcs_ese),
      categorie: v(choisi.categorie) || "non_cadre", idcc: v(choisi.idcc),
      coefficient: v(choisi.coefficient), position_conv: v(choisi.position_conv),
      lieu_travail_insee: v(choisi.lieu_travail_insee),
      salaire_mensuel: v(choisi.salaire_mensuel).replace(".", ","),
      salaire_horaire: v(choisi.salaire_horaire).replace(".", ","),
      duree_hebdo: v(choisi.duree_hebdo).replace(".", ","),
      forfait_jours_annuel: v(choisi.forfait_jours_annuel),
      date_fin: v(choisi.date_fin).slice(0, 10),
      rompu_le: v(choisi.rompu_le).slice(0, 10),
      motif_rupture_dsn: v(choisi.motif_rupture_dsn),
      // 🆕 28/09 — cas rares : code risque AT, plafond reduit au forfait.
      code_risque_at: v(choisi.code_risque_at),
      apprenti_public: choisi.apprenti_public === true,
      plafond_reduit_forfait: choisi.plafond_reduit_forfait === true,
      // 🆕 28/09 — le vehicule de fonction (null = aucun).
      vehicule: choisi.vehicule ? {
        mode: v(choisi.vehicule.mode) || "achat",
        valeur: v(choisi.vehicule.valeur).replace(".", ","),
        achat_le: v(choisi.vehicule.achat_le).slice(0, 10),
        mis_a_disposition_le: v(choisi.vehicule.mis_a_disposition_le).slice(0, 10),
        fin: v(choisi.vehicule.fin).slice(0, 10),
        carburant: choisi.vehicule.carburant === true,
        electrique: choisi.vehicule.electrique === true,
        eco_score: choisi.vehicule.eco_score === true,
        participation: v(choisi.vehicule.participation).replace(".", ","),
      } : null,
    });
    if (motifsRupture.length === 0) {
      const d = await appeler({ action: "motifs_rupture" });
      if (d && d.success) setMotifsRupture(d.motifs || []);
    }
  }

  async function enregistrerContrat() {
    if (!choisi || !contratSaisie) return;
    setErr(""); setMsg(""); setOccupe("contrat");
    const corps: any = { action: "modifier_contrat", contrat_id: choisi.id, ...contratSaisie };
    // 🆕 28/09 — un contrat non cadre n a pas de forfait en jours.
    if (corps.categorie !== "cadre") { corps.forfait_jours_annuel = ""; corps.plafond_reduit_forfait = false; }
    if (choisi.type_contrat === "mandat_social") delete corps.duree_hebdo;
    const d = await appeler(corps);
    if (d && d.success && d.contrat) {
      setMsg(d.message || "Contrat enregistré.");
      const maj = { ...choisi, ...d.contrat };
      setChoisi(maj);
      setContrats(contrats.map(function (x: any) { return x.id === maj.id ? maj : x; }));
      setContratSaisie(null);
      setCalcul(null);
    } else {
      setErr(lisible(d && d.erreur ? d.erreur : "enregistrement impossible"));
    }
    setOccupe("");
  }

  // 🆕 01/10 — `garder` : rechargement demande par un enregistrement, qui
  // garde son bouton sur « … » jusqu au bout.
  async function charger(garder?: any) {
    const garde = garder === true;
    setErr(""); if (!garde) setOccupe("charger");
    const d = await appeler({ action: "contrats" });
    if (d.success) {
      setContrats(d.contrats); setSocietes(d.societes);
      setProfil(d.profil || null);
      if (d.avertissement) setMsg(d.avertissement);
    } else if (d.connexion) {
      setConnexionRequise(true);
    } else setErr(d.erreur || "chargement impossible");
    setPret(true);
    if (!garde) setOccupe("");
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 28/09 — LA VALIDATION DU MOIS
  // Tous les salaries de la societe du contrat ouvert, avec leur feu
  // (vert, orange, rouge), l etat de leur bulletin, et le recapitulatif
  // envoye au client. La route refait chaque controle : l ecran ne fait
  // que montrer.
  // ═══════════════════════════════════════════════════════════════════
  // 🆕 29/09 — UNE REPONSE EN RETARD NE DOIT PAS ECRASER LA BONNE. Quand on
  // change de mois pendant que le mois precedent se charge encore, les deux
  // reponses arrivent l une apres l autre : la derniere arrivee l emportait,
  // meme celle de l ancien mois (l adresse de septembre revenait sur
  // octobre ; les chiffres auraient pu suivre). Chaque demande porte un
  // numero ; seule la plus recente est affichee.
  const demandeMois = useRef(0);
  async function chargerMois(ct?: any, p?: string) {
    const c0 = ct || choisi;
    if (!c0 || !c0.societe_id) return;
    const numero = ++demandeMois.current;
    const d = await appeler({ action: "tableau_mois", societe_id: c0.societe_id, periode: p || periode });
    if (numero !== demandeMois.current) return;
    if (d && d.success) {
      setMois(d);
      setRecapDest(function (v: string) { return v || d.destinataire_propose || ""; });
    } else {
      setMois(null);
      if (d && d.erreur) setErr(d.erreur);
    }
  }

  async function soumettre(contratId: string, bulletinId?: string) {
    setErr(""); setMsg(""); setOccupe("valider");
    const just = bulletinId ? String(motifs["m_" + bulletinId] || "").trim() : "";
    const d = await appeler({ action: "soumettre", contrat_id: contratId, periode: periode,
      justification: just || undefined });
    // 🆕 01/10 — ON RECHARGE D ABORD, LE MESSAGE ENSUITE (voir plus haut).
    if (choisi) {
      const b = await appeler({ action: "bulletins", contrat_id: choisi.id });
      if (b.success) setBulletins(b.bulletins);
    }
    await chargerMois();
    setOccupe("");
    if (d && d.success) setMsg(d.message); else setErr((d && d.erreur) || "soumission impossible");
  }

  // justifier (orange), renvoyer (motif), lever (rouge, motif)
  async function geste(action: string, b: any) {
    const texte = String(motifs["m_" + b.id] || "").trim();
    if (action !== "justifier" && !confirm(action === "renvoyer"
      ? "Renvoyer le bulletin " + b.numero + " à celui qui l'a préparé ?"
      : "Lever le point rouge du bulletin " + b.numero + " ? Votre motif sera inscrit au journal.")) return;
    setErr(""); setMsg(""); setOccupe("valider");
    const d = await appeler(action === "justifier"
      ? { action: action, id: b.id, texte: texte }
      : { action: action, id: b.id, motif: texte });
    if (d && d.success) setMotifs({ ...motifs, ["m_" + b.id]: "" });
    await chargerMois();
    setOccupe("");
    if (d && d.success) setMsg(d.message);
    else setErr((d && d.erreur) || "enregistrement impossible");
  }

  async function envoyerRecap() {
    if (!choisi) return;
    if (!confirm("Envoyer le récapitulatif de ce mois à " + (recapDest || "l'adresse du client") + " ?\n\n"
      + "Le client le vérifie et le confirme ; aucun bulletin du mois ne s'émet avant.")) return;
    setErr(""); setMsg(""); setOccupe("recap");
    const d = await appeler({ action: "envoyer_recap", societe_id: choisi.societe_id,
      periode: periode, destinataire: recapDest });
    await chargerMois();
    setOccupe("");
    if (d && d.success) setMsg(d.message); else setErr((d && d.erreur) || "envoi impossible");
  }

  async function leverRecap() {
    if (!choisi) return;
    if (!confirm("Émettre ce mois SANS la confirmation du client ?\n\nVotre motif est inscrit au journal.")) return;
    setErr(""); setMsg(""); setOccupe("recap");
    const d = await appeler({ action: "lever_recap", societe_id: choisi.societe_id,
      periode: periode, motif: String(motifs.recap || "").trim() });
    if (d && d.success) setMotifs({ ...motifs, recap: "" });
    await chargerMois();
    setOccupe("");
    if (d && d.success) setMsg(d.message);
    else setErr((d && d.erreur) || "levée impossible");
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕 28/09 — LES GESTES EN MASSE. Un cabinet qui paie cinquante salariés
  // ne sort pas cinquante brouillons un par un : un bouton sort tous les
  // brouillons manquants du mois, un autre émet tous les bulletins prêts.
  // Chaque bulletin passe par la même route, les mêmes contrôles et le
  // même verrou qu'un bulletin seul ; un refus n'arrête pas les suivants,
  // il est compté et dit à la fin.
  // ═══════════════════════════════════════════════════════════════════
  async function sortirTousLesBrouillons() {
    if (!mois || sansBulletin.length === 0) return;
    if (!confirm("Sortir le brouillon de " + sansBulletin.length + " salarié(s) pour ce mois ?")) return;
    setErr(""); setMsg(""); setOccupe("masse");
    let ok = 0;
    const refus: string[] = [];
    for (let i = 0; i < sansBulletin.length; i++) {
      const l = sansBulletin[i];
      setMsg("Brouillons : " + (i + 1) + " sur " + sansBulletin.length + " (" + l.salarie + ")…");
      const d = await appeler({ action: "sortir_bulletin", contrat_id: l.contrat_id, periode: periode });
      if (d && d.success) ok++;
      else refus.push(l.salarie + " : " + ((d && d.erreur) || "refusé"));
    }
    setOccupe("");
    await chargerMois();
    if (refus.length > 0) setErr(ok + " brouillon(s) sorti(s). Refusé(s) : " + refus.join(" · "));
    else setMsg(ok + " brouillon(s) sorti(s).");
  }

  async function emettreLesPrets() {
    if (!mois || prets.length === 0) return;
    if (!confirm("Émettre " + prets.length + " bulletin(s) de ce mois ?\n\nUn bulletin émis est définitif : "
      + "il ne se corrige plus que par un bulletin rectificatif.")) return;
    setErr(""); setMsg(""); setOccupe("masse");
    let ok = 0;
    const refus: string[] = [];
    for (let i = 0; i < prets.length; i++) {
      const l = prets[i];
      setMsg("Émission : " + (i + 1) + " sur " + prets.length + " (" + l.salarie + ")…");
      const d = await appeler({ action: "emettre", id: l.bulletin.id });
      if (d && d.success) ok++;
      else refus.push(l.salarie + " : " + ((d && d.erreur) || "refusé"));
    }
    setOccupe("");
    await chargerMois();
    if (choisi) {
      const b = await appeler({ action: "bulletins", contrat_id: choisi.id });
      if (b.success) setBulletins(b.bulletins);
    }
    if (refus.length > 0) setErr(ok + " bulletin(s) émis. Refusé(s) : " + refus.join(" · "));
    else setMsg(ok + " bulletin(s) émis.");
  }

  // 🆕 28/09 — les seuils du cabinet (associés et administrateur).
  async function chargerSeuils() {
    if (!choisi) return;
    setErr(""); setOccupe("seuils");
    const d = await appeler({ action: "seuils", societe_id: choisi.societe_id });
    setOccupe("");
    if (d && d.success) {
      setSeuilsVus(d.seuils);
      const s: any = {};
      for (const x of d.seuils) s[x.code] = x.cabinet === null ? "" : String(x.cabinet).replace(".", ",");
      setSeuilsSaisie(s);
    } else setErr((d && d.erreur) || "lecture impossible");
  }

  async function enregistrerSeuils() {
    if (!choisi) return;
    setErr(""); setMsg(""); setOccupe("seuils");
    const d = await appeler({ action: "regler_seuils", societe_id: choisi.societe_id, valeurs: seuilsSaisie });
    if (d && d.success) {
      setSeuilsVus(d.seuils);
      await chargerMois();
      setOccupe("");
      setMsg(d.message || "Seuils enregistrés.");
    } else {
      setOccupe("");
      setErr((d && d.erreur) || "enregistrement impossible");
    }
  }

  async function chargerMesure() {
    setErr(""); setOccupe("mesure");
    const d = await appeler({ action: "mesure" });
    setOccupe("");
    if (d && d.success) setMesure(d); else setErr((d && d.erreur) || "lecture impossible");
  }

  async function joindrePiece(el: any, fichier: File) {
    setErr(""); setMsg(""); setOccupe("piece");
    try {
      const prep = await fichierPourEnvoi(fichier);
      const d = await appeler({ action: "joindre_preuve", id: el.id, nom: fichier.name,
        type: prep.type, contenu: prep.base64 });
      if (d && d.success) {
        const l = await appeler({ action: "elements", contrat_id: choisi.id, periode: periode });
        if (l.success) setElements(l.elements);
        await chargerMois();
        setMsg(d.message);
      } else setErr((d && d.erreur) || "dépôt impossible");
    } catch (e: any) {
      setErr("pièce non envoyée : " + String(e && e.message ? e.message : e));
    }
    setOccupe("");
  }

  // 🆕 28/09 — l avis d arret de travail, piece exigee pour tout arret.
  async function joindreAvis(x: any, fichier: File) {
    setErr(""); setErrEv(""); setMsg(""); setOccupe("piece");
    try {
      const prep = await fichierPourEnvoi(fichier);
      const d = await appeler({ action: "joindre_avis", id: x.id, nom: fichier.name,
        type: prep.type, contenu: prep.base64 });
      if (d && d.success) {
        if (choisi) await chargerEvenements(choisi.id);
        await chargerMois();
        setMsg(d.message);
      } else setErrEv((d && d.erreur) || "dépôt impossible");
    } catch (e: any) {
      setErrEv("avis non envoyé : " + String(e && e.message ? e.message : e));
    }
    setOccupe("");
  }

  async function voirAvis(id: string) {
    const d = await appeler({ action: "voir_avis", id: id });
    if (d && d.success && d.url) window.open(d.url, "_blank");
    else setErrEv((d && d.erreur) || "ouverture impossible");
  }

  async function voirPiece(id: string) {
    const d = await appeler({ action: "voir_preuve", id: id });
    if (d && d.success && d.url) window.open(d.url, "_blank");
    else setErr((d && d.erreur) || "ouverture impossible");
  }

  async function ouvrir(c: any) {
    setChoisi(c); setCalcul(null); setMsg(""); setErr("");
    setMois(null); setMesure(null);
    if (!choisi || choisi.societe_id !== c.societe_id) setRecapDest("");
    setContratSaisie(null);
    setConges(null); setJoursPris("");
    setJoursSaisie(null);
    setPasSaisie(null);
    setEvenements(null);
    // 🆕 LE FORMULAIRE REPART A VIDE QUAND ON CHANGE DE SALARIE : sinon un
    // arret a moitie saisi pour l un s enregistrerait sur le contrat de
    // l autre.
    setEv(Object.assign({}, EV_VIDE));
    setErrEv(""); setModifie(null);
    const d = await appeler({ action: "elements", contrat_id: c.id, periode: periode });
    if (d.success) setElements(d.elements);
    const b = await appeler({ action: "bulletins", contrat_id: c.id });
    if (b.success) setBulletins(b.bulletins);
    // ⚠️ SEUL LE CDI A UN COMPTEUR : inutile d interroger la base pour les
    // autres, et le bloc resterait vide a l ecran.
    // 🆕🚨 22/09 — L APPRENTI A DES CONGES PAYES COMME TOUT SALARIE.
    // ⛔ IL N EN AVAIT AUCUN : le compteur etait reserve au CDI, et
    // l indemnite compensatrice au CDD et a la mission. Un apprenti n ayant
    // ni l un ni l autre, ses conges payes disparaissaient purement et
    // simplement. ⚠️ ET IL NE TOUCHE PAS D INDEMNITE DE PRECARITE : le
    // contrat d apprentissage en est expressement exclu. Son solde se paie
    // en indemnite compensatrice A LA FIN, pas mois par mois.
    if (c.type_contrat === "cdi" || c.type_contrat === "apprentissage" || c.type_contrat === "professionnalisation") {
      chargerConges(c.id);
    }
    chargerEvenements(c.id);
    chargerMois(c);
  }

  // 🆕🚨 22/09 — CHANGER DE MOIS EFFACE LES MESSAGES DU MOIS PRECEDENT.
  //
  // ⛔ LE DEFAUT, VU A L ECRAN : un refus obtenu sur SEPTEMBRE — « le
  // bulletin 2026-00004 de ce mois est déjà émis » — restait affiche en
  // rouge apres le passage a OCTOBRE, ou aucun bulletin n existe. Le message
  // parlait d un mois qu on ne regardait plus, et rien ne le disait.
  // ⚠️ UN MESSAGE EST ATTACHE A CE QU ON REGARDE : des que ce qu on regarde
  // change, il ne veut plus rien dire. Meme regle qu a l ouverture d un
  // autre salarie, ou le formulaire repart a vide.
  async function changerPeriode(p: string) {
    setPeriode(p); setCalcul(null); setMsg("");
    setErr(""); setErrEv(""); setFinDoc(null);
    if (!choisi) return;
    const d = await appeler({ action: "elements", contrat_id: choisi.id, periode: p });
    if (d.success) setElements(d.elements);
    setMois(null);
    // 🆕 29/09 — le destinataire du recapitulatif est propre a chaque mois :
    // le champ gardait l adresse du mois precedent, et un envoi est parti a
    // la mauvaise adresse. On le vide ; chargerMois y remet l adresse
    // proposee pour ce mois (la derniere utilisee, sinon celle de la fiche).
    setRecapDest("");
    chargerMois(choisi, p);
  }

  // 🆕 16/09 — LE TAUX MAJORE SE CALCULE TOUT SEUL.
  //
  // 🚨 DOCTRINE : ne jamais faire taper a la main ce que l application sait
  // calculer. Une heure supplementaire a 25 % vaut le taux horaire du
  // contrat majore d un quart — la machine connait les deux.
  // ⚠️ UN TAUX SAISI L EMPORTE TOUJOURS : certaines conventions majorent
  // autrement, et c est alors une negociation, pas un calcul.
  // 🆕 28/09 — AUSSI POUR UN SALARIE PAYE AU MOIS : le taux horaire vaut le
  // salaire mensuel divise par la duree mensuelle du contrat (heures par
  // semaine × 52 / 12). Et pour les heures complementaires (10 % et 25 %).
  function tauxMajore(): number | null {
    if (!choisi || choisi.type_contrat === "mandat_social" || choisi.forfait_jours_annuel) return null;
    let base = Number(choisi.salaire_horaire || 0);
    if (!(base > 0) && Number(choisi.salaire_mensuel) > 0) {
      const hebdo = Number(choisi.duree_hebdo) > 0 ? Number(choisi.duree_hebdo) : 35;
      base = Number(choisi.salaire_mensuel) / (Math.round(hebdo * 52 / 12 * 100) / 100);
    }
    if (!(base > 0)) return null;
    const maj: any = { heures_sup_25: 1.25, heures_sup_50: 1.5, heures_comp_10: 1.10, heures_comp_25: 1.25 };
    const k = maj[e.type_element];
    // ⚠️ QUATRE DECIMALES, comme avant : 8 h × 13,50 × 1,25 = 135,00 exactement.
    return k ? Math.round(base * k * 10000) / 10000 : null;
  }

  async function ajouterElement() {
    setErr(""); setOccupe("element");
    const t = TYPES_ELEMENT.filter(function (x) { return x.cle === e.type_element; })[0];

    // ⚠️ ON NE CALCULE QUE SI LE CHAMP EST VIDE.
    let taux = e.taux;
    if (!taux && !e.montant) {
      const auto = tauxMajore();
      if (auto !== null) taux = String(auto);
    }

    const d = await appeler({
      action: "ajouter_element",
      contrat_id: choisi.id, periode: periode,
      type_element: e.type_element,
      libelle: e.libelle || (t ? t.nom : "Élément"),
      quantite: e.quantite, taux: taux, montant: e.montant,
      soumis_cotisations: t ? t.soumis : true,
    });
    if (d.success) {
      // 🆕🚨 20/09 — LA NATURE RESTE CELLE QU ON VIENT D UTILISER.
      // ⛔ ELLE REVENAIT A « Heures supplementaires 25 % » apres chaque
      // ajout. Trois essais perdus le 20/09 : la valeur etait saisie dans
      // les bons champs, mais la nature avait deja change, et la ligne
      // s enregistrait en heures supplementaires. RIEN NE LE SIGNALAIT.
      // ⚠️ ON VIDE LES CHAMPS, PAS LA NATURE : on saisit rarement une seule
      // ligne d une nature, et jamais deux natures differentes d affilee.
      setE({ type_element: e.type_element });
      setCalcul(null);
      const l = await appeler({ action: "elements", contrat_id: choisi.id, periode: periode });
      if (l.success) setElements(l.elements);
      await chargerMois();
    } else setErr(d.erreur || "ajout impossible");
    setOccupe("");
  }

  async function retirer(id: string) {
    setErr(""); setOccupe("retirer");
    const d = await appeler({ action: "supprimer_element", id: id });
    if (!d.success) setErr(d.erreur || "suppression impossible");
    setCalcul(null);
    const l = await appeler({ action: "elements", contrat_id: choisi.id, periode: periode });
    if (l.success) setElements(l.elements);
    await chargerMois();
    setOccupe("");
  }

  // 🚨 LE CALCUL S AFFICHE AVANT LE PDF.
  // ⚠️ IL NE CREE RIEN : ni bulletin, ni rectificatif. Sinon chaque clic
  // fabriquerait un document de plus — le defaut du 16/09.
  async function calculer() {
    setErr(""); setMsg(""); setOccupe("calcul");
    // 🆕 22/09 — MEME PROTECTION QUE `appeler` : le calcul est l appel le
    // plus long de l ecran, donc le premier a souffrir d une passerelle qui
    // coupe. Sans ce garde-fou, l ecran restait sur « … » sans rien dire.
    // 🆕 28/09 — PAR LE RELAIS de la route dossier (droits verifies),
    // plus par un appel direct avec la cle.
    const d: any = await appeler({ action: "calculer", contrat_id: choisi.id, periode: periode });
    setOccupe("");
    if (d && d.erreur) setErr(d.erreur); else setCalcul(d);
  }

  // 🆕 16/09 — CE QUI EXISTE DEJA POUR LE MOIS AFFICHE, pour que le bouton
  // annonce ce qu il va faire AVANT d etre clique. Un bouton qui dit
  // « Sortir le PDF » alors qu il ouvre un rectificatif est un piege.
  const duMois = bulletins.filter(function (b: any) {
    return String(b.periode).slice(0, 7) === periode.slice(0, 7);
  });
  const brouillonDuMois = duMois.filter(function (b: any) {
    return b.statut === "brouillon";
  })[0] || null;
  const emisDuMois = duMois.filter(function (b: any) {
    return b.statut === "emis";
  })[0] || null;

  // 🆕 28/09 — ce que la session peut faire sur le dossier ouvert. Sert a
  // montrer les bons boutons ; la route reverifie chaque geste.
  const droitsIci: any = (mois && mois.droits)
    || (choisi && profil && profil.dossiers ? profil.dossiers[choisi.societe_id] : null) || {};
  // 🆕 28/09 — LES BOUTONS SUIVENT LES DROITS. Un collaborateur ne voit plus
  // les gestes qui lui seraient refuses (la route les refuse de toute facon).
  const peutCreer: boolean = !!(profil && (profil.admin || Object.keys(profil.dossiers || {})
    .some(function (k: string) { return profil.dossiers[k] && profil.dossiers[k].contrats; })));
  function cache(ok: any): any { return ok ? {} : { display: "none" }; }

  // 🆕 28/09 — les bulletins prets a emettre d un coup : brouillon, aucun
  // rouge non leve, les oranges justifies, et le recapitulatif confirme et
  // a jour (ou l attente levee).
  const recapOk: boolean = !!(mois && mois.recap
    && (mois.recap.statut === "leve" || (mois.recap.statut === "confirme" && mois.recap.a_jour)));
  const prets: any[] = !mois ? [] : mois.lignes.filter(function (l: any) {
    const b = l.bulletin;
    const ctl = l.controle;
    if (!b || b.statut !== "brouillon" || !ctl) return false;
    // 🆕 29/09 — renvoye pour correction : il n est pas pret tant qu il n est
    // pas corrige et soumis de nouveau.
    if (b.validation === "renvoye") return false;
    if (ctl.couleur === "rouge" && !b.levee_motif) return false;
    if (ctl.couleur === "orange" && !b.justification) return false;
    return true;
  });
  // Sans bulletin, ou avec un brouillon perime (une saisie posterieure).
  const sansBulletin: any[] = !mois ? [] : mois.lignes.filter(function (l: any) {
    if (!l.bulletin) return true;
    return l.bulletin.statut === "brouillon" && l.controle
      && l.controle.alertes.some(function (a: any) { return a.code === "PERIME"; });
  });

  // 🆕 29/09 — LA PROCHAINE ETAPE, DITE EN CLAIR. L ecran montrait tout a
  // la fois ; il dit maintenant, en une phrase, ce qu il faut faire ensuite,
  // dans l ordre d un mois de paie : les brouillons, les points rouges, les
  // points orange, la validation, le recapitulatif, l emission, la DSN.
  const prochaine: string | null = (function () {
    if (!mois || !mois.lignes || mois.lignes.length === 0) return null;
    const lignes = mois.lignes as any[];
    const noms = function (l: any[]): string {
      const n = l.map(function (x: any) { return x.salarie; });
      return n.slice(0, 3).join(", ") + (n.length > 3 ? "…" : "");
    };
    if (lignes.every(function (l: any) { return l.bulletin && l.bulletin.statut === "emis"; })) {
      return "Tous les bulletins du mois sont émis. Prochaine étape : la DSN du mois (Tous les outils → Paie → DSN).";
    }
    if (sansBulletin.length > 0) {
      return "Sortir " + sansBulletin.length + " brouillon(s) manquant(s) ou à refaire (" + noms(sansBulletin)
        + ") : bouton « Sortir les brouillons » juste en dessous.";
    }
    const brouillons = lignes.filter(function (l: any) { return l.bulletin && l.bulletin.statut === "brouillon" && l.controle; });
    const rouges = brouillons.filter(function (l: any) { return l.controle.couleur === "rouge" && !l.bulletin.levee_motif; });
    if (rouges.length > 0) {
      return "Traiter " + rouges.length + " point(s) rouge(s) (" + noms(rouges) + ") : corriger la saisie, joindre la pièce "
        + "ou l'avis d'arrêt, ou lever le rouge avec un motif.";
    }
    const renvoyes = brouillons.filter(function (l: any) { return l.bulletin.validation === "renvoye"; });
    if (renvoyes.length > 0) {
      return renvoyes.length + " bulletin(s) renvoyé(s) pour correction (" + noms(renvoyes) + ") : corriger, "
        + "puis soumettre de nouveau.";
    }
    const oranges = brouillons.filter(function (l: any) {
      return l.controle.couleur === "orange" && !l.bulletin.justification;
    });
    if (oranges.length > 0) {
      return "Justifier " + oranges.length + " point(s) orange (" + noms(oranges) + ") : écrire la raison sur la ligne, "
        + "puis « justifier ».";
    }
    const aValider = brouillons.filter(function (l: any) { return l.bulletin.validation === "a_valider"; });
    if (aValider.length > 0) {
      return aValider.length + " bulletin(s) attendent la validation d'un associé (" + noms(aValider) + ").";
    }
    if (!mois.recap) return "Envoyer le récapitulatif au client : son adresse, puis « Envoyer le récapitulatif ».";
    if (mois.recap.statut === "envoye") return "Attendre la confirmation du client, ou lever l'attente avec un motif.";
    if (mois.recap.statut === "conteste") return "Le client signale une erreur : corriger la paie, puis renvoyer le récapitulatif.";
    if (mois.recap.statut === "confirme" && !mois.recap.a_jour) {
      return "La paie a changé depuis la confirmation du client : renvoyer le récapitulatif.";
    }
    if (prets.length > 0) return "Émettre les " + prets.length + " bulletin(s) prêt(s).";
    return null;
  })();

  // 🆕 29/09 — LES AVERTISSEMENTS COMMUNS UNE SEULE FOIS. Le meme avertissement
  // (la mutuelle absente) etait ecrit en entier sur chaque ligne : il noyait
  // ce qui est propre a chacun. On l affiche une fois, en tete de liste.
  // Regroupe tout avertissement partage par AU MOINS DEUX salaries (la
  // mutuelle ne touche pas un stagiaire ni un mandataire : il ne faut donc
  // pas exiger qu il touche tout le monde), en les nommant une fois.
  const alertesCommunes: any[] = (function () {
    if (!mois || !mois.lignes) return [];
    const avec = (mois.lignes as any[]).filter(function (l: any) {
      return l.controle && l.bulletin && l.bulletin.statut === "brouillon";
    });
    const parTexte: any = {};
    const ordre: string[] = [];
    for (const l of avec) {
      for (const a of (l.controle.alertes || [])) {
        if (a.niveau === "info") continue;
        if (!parTexte[a.texte]) { parTexte[a.texte] = { texte: a.texte, niveau: a.niveau, salaries: [] }; ordre.push(a.texte); }
        if (parTexte[a.texte].salaries.indexOf(l.salarie) < 0) parTexte[a.texte].salaries.push(l.salarie);
      }
    }
    return ordre.map(function (t: string) { return parTexte[t]; })
      .filter(function (x: any) { return x.salaries.length >= 2; });
  })();
  const estCommune = function (a: any): boolean {
    return alertesCommunes.some(function (x: any) { return x.texte === a.texte; });
  };

  async function genererBulletin() {
    // ⚠️ ON PREVIENT AVANT D OUVRIR UN RECTIFICATIF : ce n est pas le meme
    // geste que sortir un premier bulletin, et il annulera un document deja
    // remis au salarie.
    if (!brouillonDuMois && emisDuMois) {
      if (!confirm("Le bulletin " + emisDuMois.numero + " de ce mois est déjà émis.\n\n"
        + "Un bulletin RECTIFICATIF va être ouvert. Il annulera et remplacera le "
        + emisDuMois.numero + " au moment de son émission.\n\nContinuer ?")) return;
    }
    setErr(""); setOccupe("bulletin");
    // 🆕 22/09 — MEME PROTECTION QUE `appeler`. Ici elle compte double : le
    // PDF est archive dans le bucket AVANT la reponse, donc une coupure de
    // reseau peut laisser un document ecrit sans que l ecran le sache. Le
    // message doit donc inviter a RECHARGER, pas a recliquer a l aveugle.
    // 🆕 28/09 — PAR LE RELAIS : la route verifie le droit de preparer, et
    // un brouillon ressorti repart de zero (il faudra le resoumettre).
    const d: any = await appeler({ action: "sortir_bulletin", contrat_id: choisi.id, periode: periode });
    if (d && d.success) {
      // ⚠️ LE PDF S OUVRE AUSSITOT : apres d autres attentes, le navigateur
      // pourrait bloquer la nouvelle fenetre.
      if (d.url) window.open(d.url, "_blank");
      const b = await appeler({ action: "bulletins", contrat_id: choisi.id });
      if (b.success) setBulletins(b.bulletins);
      await chargerMois();
      setOccupe("");
      setMsg(d.message);
    } else {
      setOccupe("");
      setErr((d && d.erreur) || "génération impossible");
    }
  }

  async function voir(id: string) {
    const d = await appeler({ action: "voir_bulletin", id: id });
    if (d.success && d.url) window.open(d.url, "_blank");
    else setErr(d.erreur || "ouverture impossible");
  }

  async function chargerEvenements(id: string) {
    const d = await appeler({ action: "evenements", contrat_id: id });
    if (d && d.success) setEvenements(d);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 CE QUE LA NORME EXIGE D UN ARRET SE RECLAME A LA SAISIE.
  //
  // dsn-val, 17/09 : la date de fin previsionnelle est OBLIGATOIRE, et en
  // subrogation l IBAN, le BIC et la date de fin de subrogation vont
  // ENSEMBLE. L arret d essai avait ete enregistre sans trois d entre eux,
  // et c est une requete SQL qui a du les ajouter.
  //
  // ⚠️ C EST AU MOMENT DE LA SAISIE QUE LE CABINET A L AVIS D ARRET ET LE
  // RELEVE D IDENTITE BANCAIRE SOUS LES YEUX. Le lui reclamer a la
  // generation, cinq jours plus tard, c est lui faire rechercher un papier.
  //
  // ⛔ CE CONTROLE-CI N EST QU UN CONFORT : il evite un aller-retour au
  // serveur. LE VRAI GARDE-FOU EST DANS LA ROUTE, qui refuse de son cote —
  // un ecran ne protege de rien, il se contourne.
  // ═══════════════════════════════════════════════════════════════════
  async function ajouterEvenement() {
    // 🆕 TOUS LES MESSAGES DE CE BLOC PASSENT PAR `errEv`, affiche juste
    // au-dessus du bouton. Aucun ne part plus dans le bandeau du haut.
    if (!ev.motif || !ev.date_debut) {
      setErrEv("Le motif et la date de début sont obligatoires."); return;
    }
    if (ev.type_evenement === "arret") {
      if (!ev.date_fin) {
        setErrEv("La date de fin prévisionnelle de l'arrêt est obligatoire : "
          + "c'est celle que porte l'avis d'arrêt du médecin. Sans elle, la "
          + "CPAM rejette le signalement.");
        return;
      }
      if (ev.subrogation && (!ev.iban || !ev.bic || !ev.subro_fin)) {
        setErrEv("En subrogation, l'IBAN, le BIC et la date de fin de "
          + "subrogation sont obligatoires tous les trois.");
        return;
      }
      // 🆕 20/09 — LA REPRISE NE SE SIGNALE QUE SI ELLE EST ANTICIPEE.
      // dsn-val, controle SIG-13 : une reprise posterieure a la fin prevue
      // de l arret est refusee. Reprendre a la date prevue n est pas un
      // evenement — il n y a rien a declarer.
      if (ev.reprise_date) {
        if (ev.reprise_date < ev.date_debut) {
          setErrEv("La reprise ne peut pas précéder le début de l'arrêt.");
          return;
        }
        if (ev.date_fin && ev.reprise_date > ev.date_fin) {
          setErrEv("La reprise est postérieure à la fin prévue de l'arrêt : il "
            + "n'y a rien à signaler. Une reprise ne se déclare que "
            + "lorsqu'elle est ANTICIPÉE. Videz la date de reprise.");
          return;
        }
      }
    }
    setErrEv(""); setErr(""); setMsg("");
    setOccupe("evenement");

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 18/09 — « MODIFIER » EST UN RETRAIT SUIVI D UNE SAISIE, FAIT PAR
    // LA MACHINE PLUTOT QUE PAR LA MAIN.
    //
    // ⚠️ LA ROUTE NE SAIT PAS METTRE A JOUR UN SIGNALEMENT : elle n a qu un
    // `ajouter_evenement` et un `supprimer_evenement`. Plutot que d inventer
    // une troisieme action non eprouvee, on enchaine les deux existantes —
    // celles qui sont deja passees par tous leurs controles.
    //
    // ⛔ L ORDRE COMPTE, ET IL EST CELUI-CI : ON ENREGISTRE D ABORD, ON
    // RETIRE ENSUITE. Dans l autre sens, une saisie refusee par la route
    // (IBAN faux, date incoherente) aurait deja fait disparaitre l ancien
    // signalement : on perdrait la donnee en croyant la corriger.
    // ⚠️ Pendant un instant les deux coexistent ; si le retrait echoue, on le
    // DIT et la liste montre les deux lignes — un doublon visible vaut mieux
    // qu une disparition silencieuse.
    // ⛔ UN SIGNALEMENT DEPOSE NE SE MODIFIE PAS : le bouton n existe pas sur
    // ces lignes-la, et la route refuserait le retrait de son cote.
    // ═══════════════════════════════════════════════════════════════════
    const aRetirer = modifie ? String(modifie.id) : "";

    const d = await appeler(Object.assign({
      action: "ajouter_evenement", contrat_id: choisi.id,
    }, ev));
    if (!d || d.erreur) {
      setOccupe("");
      if (d && d.erreur) setErrEv(d.erreur);
      return;
    }

    let message = d.message;
    if (aRetirer) {
      const r = await appeler({ action: "supprimer_evenement", id: aRetirer });
      if (r && r.erreur) {
        setErrEv("⛔ Le nouveau signalement est enregistré, mais l'ancien n'a "
          + "pas pu être retiré (" + r.erreur + "). LA LISTE EN CONTIENT DEUX : "
          + "retirez l'ancien à la main.");
      } else {
        message = "Signalement modifié. " + message;
      }
    }

    // 🆕 01/10 — la liste des signalements et la validation du mois se
    // rechargent AVANT le message (un arret change les feux du mois).
    setEv(Object.assign({}, EV_VIDE));
    setModifie(null);
    await chargerEvenements(choisi.id);
    await chargerMois();
    setOccupe("");
    setMsg(message);
  }

  // 🆕 REPRENDRE UN SIGNALEMENT DANS LE FORMULAIRE.
  //
  // ⚠️ LES DATES DE LA BASE ARRIVENT EN « 2026-09-24T00:00:00 » ou en
  // « 2026-09-24 » selon la colonne : un champ `type="date"` n accepte QUE
  // les dix premiers caracteres. Les passer tels quels laisserait le champ
  // vide sans rien dire, et la modification perdrait la date.
  function modifierEvenement(x: any) {
    const d10 = function (v: any) { return String(v || "").slice(0, 10); };
    setEv({
      type_evenement: String(x.type_evenement || "arret"),
      motif: String(x.motif || ""),
      date_debut: d10(x.date_debut),
      date_fin: d10(x.date_fin),
      dernier_jour_travaille: d10(x.dernier_jour_travaille),
      subrogation: x.subrogation === true,
      iban: String(x.iban || ""),
      bic: String(x.bic || ""),
      subro_fin: d10(x.subro_fin),
      date_notification: d10(x.date_notification),
      dernier_jour_paye: d10(x.dernier_jour_paye),
      reprise_date: d10(x.reprise_date),
      reprise_motif: String(x.reprise_motif || ""),
    });
    setModifie(x);
    setErrEv(""); setErr(""); setMsg("");
    // ⚠️ LE FORMULAIRE EST AU-DESSUS DE LA LISTE : sans cela, on touche
    // « modifier » et rien ne bouge a l ecran — le meme defaut que le message
    // d erreur perdu en haut de page.
    if (typeof document !== "undefined") {
      const cible = document.getElementById("nouveau-signalement");
      if (cible && cible.scrollIntoView) {
        cible.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function annulerModification() {
    setEv(Object.assign({}, EV_VIDE));
    setModifie(null);
    setErrEv("");
  }

  // 🆕 20/09 — LE MEME ARRET PRODUIT DEUX FICHIERS.
  //
  // Le signalement d arret part dans les cinq jours ; celui de la REPRISE
  // part ensuite, si le salarie revient AVANT la date prevue. Les deux se
  // generent depuis le meme evenement, qui porte la date et le motif de
  // reprise — c est le geste de l utilisateur qui choisit lequel.
  // ⚠️ `reprise` doit valoir exactement `true` : la route ne genere une
  // nature 05 qu a cette condition.
  async function genererSignalement(id: string, reprise?: boolean) {
    setErr(""); setErrEv(""); setMsg("");
    setOccupe(reprise ? "reprise" : "signalement");
    // 🆕 28/09 — PAR LE RELAIS de la route dossier, plus avec la cle.
    const d: any = await appeler({ action: "signalement", evenement_id: id,
      reprise: reprise === true });
    setOccupe("");
    if (!d) return;
    if (d.erreur) { setErrEv(d.erreur); return; }
    setMsg(d.message + " — " + d.nom_fichier + " (" + d.lignes + " lignes)");
    // ⚠️ LES ANOMALIES PASSENT EN ERREUR, pas en message : un signalement
    // avec anomalie ne doit pas ressembler a un succes.
    if (d.anomalies && d.anomalies.length > 0) setErrEv(d.anomalies.join(" · "));
    chargerEvenements(id && choisi ? choisi.id : id);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — MARQUER UN SIGNALEMENT DEPOSE
  //
  // 🚨 C EST CE GESTE QUI FAIT AVANCER LE NUMERO D ORDRE, et rien d autre.
  // Regenerer un signalement dix fois avant de l envoyer ne le fait pas
  // bouger : ce sont dix essais du MEME signalement. Des le premier depot,
  // le fichier suivant devient un « annule et remplace ».
  // ⚠️ L ARRET ET SA REPRISE SE DEPOSENT SEPAREMENT : deux natures, deux
  // compteurs, deux gestes.
  // ═══════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — LA PRIME DE VACANCES SYNTEC (article 31)
  //
  // ⛔ CE N EST PAS UNE LIGNE DE BULLETIN, et c est pour cela qu elle
  // s affiche ICI et non dans le calcul : l article 31 impose un montant
  // GLOBAL a l entreprise — au moins 10 % de la masse des indemnites de
  // conges payes de tous les salaries — et laisse la REPARTITION au choix
  // de l employeur. Un logiciel qui la repartirait tout seul deciderait a
  // sa place.
  // 🚨 LA DATE LIMITE EST LE 31 OCTOBRE : une prime versee apres ne remplit
  // pas l obligation, meme si le montant est bon.
  // ═══════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — LE CERTIFICAT DE TRAVAIL ET LE REÇU POUR SOLDE DE TOUT
  // COMPTE
  //
  // 🚨 ILS NE SE PRODUISENT QU UNE FOIS LE DERNIER BULLETIN EMIS : le reçu
  // inventorie LES SOMMES VERSEES, et une somme qui n y figure pas n est
  // pas couverte par l effet liberatoire de six mois.
  // ⚠️ LA ROUTE REFUSE d elle-meme s il n y a aucun bulletin emis, et
  // signale si le dernier n est pas celui du mois de la rupture.
  // ═══════════════════════════════════════════════════════════════════
  async function documentsFinContrat() {
    if (!choisi) return;
    setErr(""); setMsg(""); setFinDoc(null);
    setOccupe("findoc");
    // 🆕 28/09 — PAR LE RELAIS : le droit d emettre est verifie.
    const d: any = await appeler({ action: "fin_contrat", contrat_id: choisi.id });
    setOccupe("");
    if (!d) return;
    if (d.erreur) { setErr(d.erreur); return; }
    setFinDoc(d);
    setMsg(d.message || "");
  }

  async function chargerPrime() {
    if (!choisi || !choisi.societe_id) return;
    setErr(""); setMsg("");
    setOccupe("prime");
    const d = await appeler({
      action: "prime_vacances", societe_id: choisi.societe_id,
    });
    setOccupe("");
    if (!d) return;
    if (d.erreur) { setErr(d.erreur); return; }
    setPrime(d);
  }

  async function deposerSignalement(id: string, reprise?: boolean) {
    setErr(""); setErrEv(""); setMsg("");
    setOccupe(reprise ? "depot-reprise" : "depot");
    const d = await appeler({
      action: "deposer_evenement", id: id, reprise: reprise === true,
    });
    setOccupe("");
    if (!d) return;
    if (d.erreur) { setErrEv(d.erreur); return; }
    setMsg(d.message);
    chargerEvenements(choisi ? choisi.id : "");
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕 LE FICHIER D UN SIGNALEMENT, ENFIN SORTI DE LA BASE.
  //
  // Le generateur le gardait dans `paie_evenements.fichier` et rien ne le
  // rendait : le 17/09, chaque passage dans dsn-val a commence par une
  // requete SQL. La liste le recoit deja avec chaque evenement — il ne
  // manquait que le geste pour le sortir.
  //
  // ⚠️ SON NOM DIT CE QU IL EST : la nature, le salarie, la date. Le 17/09,
  // deux fichiers successifs portaient le meme nom et c est l ANCIEN qui est
  // reparti dans dsn-val — dix-sept anomalies deja corrigees, relues pour
  // rien.
  // ═══════════════════════════════════════════════════════════════════
  function nomSignalement(x: any): string {
    const s = choisi && choisi.paie_salaries ? String(choisi.paie_salaries.nom || "") : "";
    const nom = s.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "SALARIE";
    const arret = x.type_evenement === "arret";
    // 🆕 UN ARRET DONT LE FICHIER EST UNE REPRISE porte la nature 05 : on
    // le lit dans le fichier lui-meme plutot que de le deduire, pour que le
    // nom dise toujours ce que le fichier contient.
    const estRep = arret
      && String(x.fichier || "").indexOf("S20.G00.05.001,'05'") >= 0;
    const d = String((estRep ? x.reprise_date
      : (arret ? x.date_debut : (x.date_fin || x.date_debut))) || "")
      .slice(0, 10).replace(/-/g, "");
    return (estRep ? "REPRISE" : (arret ? "ARRET" : "FCTU"))
      + "-" + nom + "-" + d + ".txt";
  }

  function telechargerSignalement(x: any) {
    if (!x || !x.fichier) { setErrEv("Ce signalement n'a pas encore été généré."); return; }
    const blob = new Blob([octetsLatin1(String(x.fichier))], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomSignalement(x);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  // ⚠️ LE PARTAGE EST CE QUI MANQUAIT SUR UN IPAD : il ouvre la feuille
  // d iOS, et de la le fichier part dans Dropbox, WhatsApp ou un courriel —
  // donc vers l ordinateur ou tourne dsn-val, sans passer par « Fichiers ».
  // ⛔ S IL ECHOUE OU S IL N EXISTE PAS, ON RETOMBE SUR LE TELECHARGEMENT :
  // un geste qui ne fait rien est pire qu un geste plus lent.
  async function partagerSignalement(x: any) {
    if (!x || !x.fichier) { setErrEv("Ce signalement n'a pas encore été généré."); return; }
    const nav: any = navigator;
    try {
      const fichier: any = new File([octetsLatin1(String(x.fichier))],
        nomSignalement(x), { type: "text/plain" });
      if (nav.canShare && nav.canShare({ files: [fichier] })) {
        await nav.share({ files: [fichier], title: nomSignalement(x) });
        return;
      }
    } catch (e: any) {
      // ⚠️ FERMER LA FEUILLE DE PARTAGE N EST PAS UNE ERREUR : iOS la
      // signale comme un abandon, et il n y a rien a en dire.
      if (e && e.name === "AbortError") return;
    }
    telechargerSignalement(x);
  }

  async function retirerEvenement(id: string) {
    if (!confirm("Retirer ce signalement ?")) return;
    setErrEv(""); setOccupe("evenement");
    // ⚠️ SI ON RETIRE CELUI QU ON EST EN TRAIN DE MODIFIER, le formulaire
    // repart a vide : sans cela, « Enregistrer » recreerait la ligne qu on
    // vient de supprimer.
    if (modifie && String(modifie.id) === String(id)) annulerModification();
    const d = await appeler({ action: "supprimer_evenement", id: id });
    setOccupe("");
    if (d && d.success) { setMsg(d.message); chargerEvenements(choisi.id); }
    else if (d && d.erreur) setErrEv(d.erreur);
  }

  async function chargerConges(id: string) {
    const d = await appeler({ action: "conges", contrat_id: id });
    if (d && d.success) setConges(d);
  }

  async function poserConges() {
    const j = Number(String(joursPris).replace(",", "."));
    if (!(j > 0)) { setErr("Indiquez un nombre de jours supérieur à zéro."); return; }

    setOccupe("conges");
    const d = await appeler({
      action: "poser_conges",
      contrat_id: choisi.id,
      // 🚨 LA PERIODE PORTE DEJA SON JOUR : moisCourant() rend « 2026-09-01 ».
      // Y ajouter « -01 » donnait « 2026-09-01-01 », que Postgres refuse.
      // ⚠️ TOUTES LES AUTRES ACTIONS L ENVOIENT TELLE QUELLE — il suffisait
      // de regarder comment elles font plutot que de supposer.
      periode: periode,
      jours: j,
    });
    if (!d) { setOccupe(""); return; }
    if (d.erreur) { setOccupe(""); setErr(d.erreur); return; }
    setJoursPris("");
    await chargerConges(choisi.id);
    setOccupe("");
    setMsg(d.message);
  }

  async function retirerPrise(id: string) {
    if (!confirm("Retirer cette prise de congés ?")) return;
    setOccupe("conges");
    const d = await appeler({ action: "supprimer_conges", id: id });
    if (d && d.success) { await chargerConges(choisi.id); setOccupe(""); setMsg(d.message); }
    else { setOccupe(""); if (d && d.erreur) setErr(d.erreur); }
  }

  async function emettre(b: any) {
    // ⚠️ ON DEMANDE CONFIRMATION : le geste est irreversible.
    const avertissement = b.type_bulletin === "rectificatif" && b.rectifie_numero
      ? "Émettre le bulletin rectificatif " + b.numero + " ?\n\n"
        + "Il ANNULERA définitivement le bulletin " + b.rectifie_numero + "."
      : "Émettre le bulletin " + b.numero + " ?\n\n"
        + "Il ne pourra plus être modifié. Une correction se fera par un "
        + "bulletin rectificatif.";
    if (!confirm(avertissement)) return;

    setOccupe("emettre");
    // 🆕 28/09 — la justification des points orange part avec l emission.
    const just = String(motifs["m_" + b.id] || "").trim();
    const d = await appeler({ action: "emettre", id: b.id, justification: just || undefined });
    await chargerMois();
    if (d.success) {
      const l = await appeler({ action: "bulletins", contrat_id: choisi.id });
      if (l.success) setBulletins(l.bulletins);
      // 🆕🚨 22/09 — RECHARGER AUSSI LES CONGES.
      // L emission ACQUIERT des jours : les 2,5 mensuels, et une fois par
      // periode les jours d anciennete. Sans ce rappel, l ecran gardait
      // l ancien solde et il fallait recharger la page a la main pour voir
      // les jours arriver — on croyait le calcul rate alors qu il etait bon.
      if (choisi.type_contrat === "cdi"
        || choisi.type_contrat === "apprentissage" || choisi.type_contrat === "professionnalisation") await chargerConges(choisi.id);
      setOccupe("");
      setMsg(d.message);
    } else {
      setOccupe("");
      setErr(d.erreur || "émission impossible");
    }
  }

  async function creer() {
    setErr(""); setOccupe("creer");
    const d = await appeler({ action: "nouveau", ...f });
    if (d.success) {
      // 🆕 01/10 — LA LISTE SE RECHARGE D ABORD, le formulaire reste sur
      // « … » ; il se ferme quand le nouveau salarie est dans la liste, et
      // le message vient a ce moment-la.
      await charger(true);
      setNouveau(false);
      setF({ type_contrat: "mission", categorie: "non_cadre", duree_hebdo: 35 });
      setOccupe("");
      setMsg(d.message);
    } else {
      setOccupe("");
      setErr(d.erreur || "création impossible");
    }
  }

  // ---- L ECRAN D ENTREE ----
  // 🆕🚨 28/09 — PLUS DE CLE A TAPER. On attend la reponse de la route ;
  // si la session manque ou a expire, on le dit et on mene a la connexion.
  // ⚠️ UN CABINET SANS AUCUN CONTRAT ARRIVE SUR L ECRAN NORMAL : l ancien
  // ecran d entree s affichait tant qu il n y avait aucun contrat, et un
  // nouveau client n aurait jamais trouve « Nouveau salarié ».
  if (!pret || connexionRequise) {
    return (
      <div style={{ background: FOND, minHeight: "100vh", color: "#fff",
        fontFamily: "Georgia,serif", padding: "40px 20px" }}>
        <div style={{ maxWidth: "420px", margin: "60px auto" }}>
          <h1 style={{ color: OR, fontSize: "24px", marginBottom: "6px" }}>Paie</h1>
          <p style={{ color: "rgba(255,255,255,0.76)", fontSize: "14px",
            lineHeight: "1.6", marginBottom: "22px" }}>
            Bulletins de paie et déclarations sociales.
          </p>
          <div style={CADRE}>
            {connexionRequise ? (
              <>
                <p style={{ fontSize: "14px", lineHeight: 1.6, marginTop: 0 }}>
                  Votre session est absente ou a expiré. Connectez-vous pour
                  ouvrir la paie : vous recevrez un lien par courriel.
                </p>
                <a href="/connexion" style={{ ...BOUTON, display: "block", textAlign: "center",
                  textDecoration: "none" }}>
                  Se connecter
                </a>
              </>
            ) : (
              <p style={{ fontSize: "14px", margin: 0, color: "rgba(255,255,255,0.8)" }}>
                Lecture…
              </p>
            )}
          </div>
          {err && <p style={{ color: ROUGE, fontSize: "14px" }}>{lisible(err)}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: FOND, minHeight: "100vh", color: "#fff",
      fontFamily: "Georgia,serif", padding: "30px 20px" }}>
      {/* 🆕 01/10 — LES CHAMPS DATE SUR iPAD (meme correction que l ecran DSN
          et la fiche des dossiers) : sans elle, la date deborde de sa case,
          une bordure traine et la case est plus haute que les autres. */}
      <style>{`
        .mc-date { -webkit-appearance: none; appearance: none; min-width: 0; min-height: 41px; display: block; color-scheme: dark; }
        .mc-date::-webkit-date-and-time-value { text-align: left; margin: 0; }
      `}</style>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>

        <h1 style={{ color: OR, fontSize: "26px", marginBottom: "4px" }}>Paie</h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px",
          marginBottom: "22px" }}>
          {contrats.length} contrat{contrats.length > 1 ? "s" : ""} en cours
        </p>

        {/* 🆕 28/09 — LE MESSAGE SUIT L ECRAN. Il s affichait en haut de la
            page, loin du bouton qui l avait provoque : un refus d emission
            passait inapercu (essai du 28/09). Il s affiche desormais dans un
            bandeau fixe en bas de l ecran, la ou l on regarde. */}
        {(msg || err) && (
          <div style={{ position: "fixed", left: "50%", bottom: "18px", transform: "translateX(-50%)",
            zIndex: 3000, width: "min(92vw, 760px)", background: "#15151c",
            border: "1px solid " + (err ? ROUGE : VERT), borderRadius: "10px",
            padding: "12px 44px 12px 16px", boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
            fontSize: "14px", lineHeight: 1.6, color: err ? ROUGE : VERT }}>
            {err ? lisible(err) : majuscule(msg)}
            <button onClick={() => { setMsg(""); setErr(""); }} aria-label="fermer"
              style={{ position: "absolute", top: "6px", right: "10px", background: "none",
                border: "none", color: "rgba(255,255,255,0.8)", fontSize: "20px", cursor: "pointer" }}>
              ×
            </button>
          </div>
        )}

        {/* ---- LA LISTE DES CONTRATS ---- */}
        {!choisi && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <button onClick={() => setNouveau(!nouveau)} style={{ ...SECOND, ...cache(peutCreer) }}>
                {nouveau ? "Annuler" : "Nouveau salarié"}
              </button>
            </div>

            {nouveau && (
              <div style={CADRE}>
                <h2 style={{ color: OR, fontSize: "17px", marginTop: 0 }}>
                  Un salarié et son contrat
                </h2>
                {/* 🆕 01/10 — LES CASES D UNE MEME RANGEE S ALIGNENT EN BAS : un
                    libelle sur deux lignes (« Numéro de sécurité sociale… »)
                    poussait sa case plus bas que ses voisines. */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
                  <div style={{ flex: "1 1 100%" }}>
                    <span style={LIB}>Société qui emploie</span>
                    <select value={f.societe_id || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, societe_id: ev.target.value })}>
                      <option value="">Choisir…</option>
                      {societes.map(function (s: any) {
                        return <option key={s.id} value={s.id}>{s.raison_sociale}</option>;
                      })}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 180px" }}>
                    <span style={LIB}>Prénom</span>
                    <input value={f.prenom || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, prenom: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 180px" }}>
                    <span style={LIB}>Nom</span>
                    <input value={f.nom || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, nom: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    {/* 🚨 LA CLE EST CONTROLEE A L ENREGISTREMENT. Un numero
                        dont la cle est fausse fait REJETER la DSN entiere. */}
                    <span style={LIB}>Numéro de sécurité sociale (15 chiffres, clé comprise)</span>
                    <input value={f.numero_secu || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, numero_secu: ev.target.value })} />
                  </div>

                  {/* ═══════════════════════════════════════════════════
                      🆕🚨 16/09 — LES CHAMPS QUE LA DSN EXIGE ET QUE CET
                      ECRAN N AVAIT PAS.

                      Le premier fichier DSN est sorti sans date de
                      naissance ni adresse : rubriques OBLIGATOIRES, rejet
                      assure. La route les acceptait depuis le debut, mais
                      l ecran ne les demandait pas — on ne pouvait donc PAS
                      saisir ce que la declaration reclame.
                      ⚠️ LA LECON : un champ absent de l ecran n existe pas,
                      meme si la base et la route le prevoient.
                      ═══════════════════════════════════════════════════ */}
                  <div style={{ flex: "1 1 160px" }}>
                    <span style={LIB}>Date de naissance (obligatoire en DSN)</span>
                    <input type="date" className="mc-date" value={f.date_naissance || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, date_naissance: ev.target.value })} />
                  </div>
                  {/* 🆕 01/10 — assez large pour lire « Depuis le n° sécu » en entier. */}
                  <div style={{ flex: "0 1 185px" }}>
                    {/* ⚠️ LE SEXE SE DEDUIT DU PREMIER CHIFFRE DU NUMERO DE
                        SECURITE SOCIALE (1 homme, 2 femme). Le champ n est
                        la que pour les cas ou les deux different. */}
                    <span style={LIB}>Sexe</span>
                    <select value={f.sexe || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, sexe: ev.target.value })}>
                      <option value="">Depuis le n° sécu</option>
                      <option value="M">Homme</option>
                      <option value="F">Femme</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 240px" }}>
                    <span style={LIB}>Adresse (obligatoire en DSN)</span>
                    <input value={f.adresse || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, adresse: ev.target.value })} />
                  </div>
                  <div style={{ flex: "0 1 120px" }}>
                    <span style={LIB}>Code postal</span>
                    <input value={f.code_postal || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, code_postal: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 160px" }}>
                    <span style={LIB}>Ville</span>
                    <input value={f.ville || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, ville: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <span style={LIB}>Lieu de naissance</span>
                    <input value={f.lieu_naissance || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, lieu_naissance: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 160px" }}>
                    <span style={LIB}>Type de contrat</span>
                    {/* 🆕 28/09 — LE MANDAT SOCIAL passe la categorie en « cadre »
                        et vide la duree hebdomadaire : un mandataire n a pas de
                        duree du travail, et la retraite complementaire le traite
                        en principe comme un cadre. */}
                    <select value={f.type_contrat} style={CHAMP}
                      onChange={(ev) => setF(ev.target.value === "mandat_social"
                        ? { ...f, type_contrat: ev.target.value, categorie: "cadre", duree_hebdo: "" }
                        : { ...f, type_contrat: ev.target.value })}>
                      <option value="mission">Contrat de mission</option>
                      <option value="cdd">CDD</option>
                      <option value="cdi">CDI</option>
                      {/* 🆕 22/09 — L APPRENTISSAGE. Sur ce contrat, laisser
                          le salaire mensuel VIDE : le moteur applique le
                          barème légal (D6222-26) depuis la date de naissance,
                          la date de début et le SMIC. Un salaire saisi
                          l'emporte toujours — le barème est un minimum. */}
                      <option value="apprentissage">Apprentissage</option>
                      {/* 🆕 28/09 — LE DIRIGEANT ASSIMILE SALARIE : president de
                          SAS ou SASU, gerant minoritaire de SARL, remunere au
                          titre de son mandat. Ni chomage, ni AGS, ni reduction
                          generale, ni conges payes. */}
                      <option value="mandat_social">Mandat social (dirigeant assimilé salarié)</option>
                      {/* 🆕 28/09 — LE STAGIAIRE : la gratification se saisit en
                          « Salaire mensuel brut » ; la franchise de cotisations
                          se calcule sur les heures du mois. Date de fin
                          obligatoire (celle de la convention de stage). */}
                      <option value="stage">Convention de stage (gratification)</option>
                      {/* 🆕 28/09 — LE CONTRAT DE PROFESSIONNALISATION : salaire
                          mensuel vide = minimum légal (âge et qualification). */}
                      <option value="professionnalisation">Contrat de professionnalisation</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>Début</span>
                    <input type="date" className="mc-date" value={f.date_debut || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, date_debut: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>Fin</span>
                    <input type="date" className="mc-date" value={f.date_fin || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, date_fin: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <span style={LIB}>Poste</span>
                    <input value={f.intitule_poste || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, intitule_poste: ev.target.value })} />
                  </div>
                  <div style={{ flex: "0 1 150px" }}>
                    {/* 🚨 LE CODE PCS-ESE EST UNE RUBRIQUE OBLIGATOIRE DE LA
                        DSN (S21.G00.40.004). Il decrit le METIER selon la
                        nomenclature INSEE, independamment du nom qu on donne
                        au poste : « cariste » et « agent logistique » peuvent
                        etre le meme PCS-ESE.
                        ⚠️ IL EST SENSIBLE A LA CASSE : « 653a », pas « 653A ».
                        C est l une des deux seules rubriques de la norme dans
                        ce cas. */}
                    <span style={LIB}>Code PCS-ESE (INSEE, ex. 653a)</span>
                    <input value={f.pcs_ese || ""} style={CHAMP}
                      placeholder="653a"
                      onChange={(ev) => setF({ ...f, pcs_ese: ev.target.value })} />
                  </div>
                  {/* 🆕🚨 28/09 — LE SALAIRE MENSUEL ET LA DUREE SE SAISISSENT A
                      L ECRAN. Jusqu ici le formulaire n offrait que le taux
                      horaire : un CDI paye au mois (le cas le plus courant) et
                      un temps partiel ne se creaient que par SQL. Trouve en
                      preparant l essai du mandat social sur une fiche neuve.
                      ⚠️ L UN OU L AUTRE : un salaire mensuel l emporte sur le
                      taux horaire dans le moteur. */}
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>{f.type_contrat === "stage" ? "Gratification mensuelle" : "Salaire mensuel brut"}</span>
                    <input value={f.salaire_mensuel || ""} style={CHAMP} placeholder="ex. 2 400"
                      onChange={(ev) => setF({ ...f, salaire_mensuel: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>ou taux horaire</span>
                    <input value={f.salaire_horaire || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, salaire_horaire: ev.target.value })} />
                  </div>
                  {f.type_contrat !== "mandat_social" && (
                    <div style={{ flex: "1 1 120px" }}>
                      <span style={LIB}>Heures par semaine</span>
                      <input value={f.duree_hebdo === undefined || f.duree_hebdo === null ? "" : f.duree_hebdo}
                        style={CHAMP} placeholder="35"
                        onChange={(ev) => setF({ ...f, duree_hebdo: ev.target.value })} />
                    </div>
                  )}
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>Catégorie</span>
                    <select value={f.categorie} style={CHAMP}
                      onChange={(ev) => setF({ ...f, categorie: ev.target.value })}>
                      <option value="non_cadre">Non cadre</option>
                      <option value="cadre">Cadre</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>IDCC</span>
                    <input value={f.idcc || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, idcc: ev.target.value })} />
                  </div>
                </div>

                {/* 🆕🚨 22/09 — LE FORFAIT EN JOURS DES CADRES.
                    Un cadre au forfait jours n a pas d horaire : son contrat
                    fixe un nombre de jours travailles dans l annee, 218 au
                    plus. Renseigner ce champ change la DSN (unite « forfait
                    jours » en 40.011, un nombre de jours en 40.013) et le
                    bulletin, qui cesse de raisonner en heures.
                    ⛔ LAISSER VIDE pour tout salarie a l horaire. */}
                {(f.categorie === "cadre" || f.forfait_jours_annuel) && (
                  <div style={{ marginTop: "14px", paddingTop: "14px",
                    borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: "13.5px",
                      color: "rgba(255,255,255,0.76)", marginTop: 0,
                      lineHeight: "1.6" }}>
                      Forfait en jours : à ne remplir que si le contrat en
                      prévoit un. Le salarié n&apos;a alors pas d&apos;horaire,
                      et les heures supplémentaires n&apos;existent pas pour
                      lui. Laisser vide pour un cadre à l&apos;horaire.
                    </p>
                    <div style={{ maxWidth: "260px" }}>
                      <span style={LIB}>Jours travaillés par an (218 maximum)</span>
                      <input value={f.forfait_jours_annuel || ""} style={CHAMP}
                        inputMode="numeric" placeholder="ex. 218"
                        onChange={(ev) => setF({ ...f,
                          forfait_jours_annuel: ev.target.value })} />
                    </div>
                  </div>
                )}

                {/* 🆕🚨 22/09 — SANS CE CHAMP, LA DSN DE L APPRENTI EST REJETEE.
                    Controle CCH-11 : des que le dispositif « 64 » ou « 65 »
                    est declare, le niveau de diplome prepare devient
                    obligatoire. Il ne se deduit de rien — ni de l age, ni du
                    poste : il figure sur le contrat signe avec le CFA.
                    ⛔ A NE PAS CONFONDRE avec le « niveau » de la grille
                    conventionnelle, qui va avec le coefficient. */}
                {/* 🆕 28/09 — la qualification a l entree du contrat de
                    professionnalisation : elle releve le minimum legal. */}
                {f.type_contrat === "professionnalisation" && (
                  <label style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px", fontSize: "14px" }}>
                    <input type="checkbox" checked={!!f.qualification_niveau4}
                      onChange={(ev) => setF({ ...f, qualification_niveau4: ev.target.checked })} />
                    Titulaire d'un bac professionnel (ou d'un titre de même niveau) ou plus — laisser le salaire
                    mensuel vide pour appliquer le minimum légal
                  </label>
                )}
                {/* 🆕 28/09 — l apprenti d un employeur public : Ircantec et
                    exonerations propres. */}
                {f.type_contrat === "apprentissage" && (
                  <label style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px", fontSize: "14px" }}>
                    <input type="checkbox" checked={!!f.apprenti_public}
                      onChange={(ev) => setF({ ...f, apprenti_public: ev.target.checked })} />
                    Employeur du secteur public (État, collectivité, hôpital) : retraite complémentaire Ircantec
                  </label>
                )}
                {f.type_contrat === "apprentissage" && (
                  <div style={{ marginTop: "14px", paddingTop: "14px",
                    borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: "13.5px", color: OR,
                      marginTop: 0, lineHeight: "1.6" }}>
                      Le niveau de diplôme préparé est obligatoire en DSN pour
                      un apprenti : sans lui, la déclaration est rejetée. Il
                      figure sur le contrat signé avec le CFA.
                    </p>
                    <p style={{ fontSize: "13.5px",
                      color: "rgba(255,255,255,0.76)", lineHeight: "1.6" }}>
                      Laisser le salaire mensuel vide : le barème légal
                      s&apos;applique tout seul (article D6222-26), en
                      pourcentage du SMIC selon l&apos;âge et l&apos;année
                      d&apos;exécution. Un salaire saisi l&apos;emporte, car le
                      barème est un minimum.
                    </p>
                    <div style={{ maxWidth: "420px" }}>
                      <span style={LIB}>Niveau de diplôme préparé</span>
                      <select value={f.niveau_diplome_prepare || ""} style={CHAMP}
                        onChange={(ev) => setF({ ...f,
                          niveau_diplome_prepare: ev.target.value })}>
                        <option value="">— choisir —</option>
                        <option value="03">03 — CAP, BEP</option>
                        <option value="04">04 — Bac, brevet de technicien, brevet professionnel</option>
                        <option value="05">05 — Bac+2 : BTS, DUT, licence 2</option>
                        <option value="06">06 — Bac+3 et bac+4 : licence 3, licence pro, master 1</option>
                        <option value="07">07 — Bac+5 : master 2, diplôme d&apos;ingénieur</option>
                        <option value="08">08 — Bac+8 : doctorat</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 🚨 SANS CES DEUX CHAMPS, LE CONTRAT EST REQUALIFIABLE. */}
                {f.type_contrat === "mission" && (
                  <div style={{ marginTop: "14px", paddingTop: "14px",
                    borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.76)",
                      marginTop: 0, lineHeight: "1.6" }}>
                      L&apos;entreprise utilisatrice et le motif de recours sont
                      obligatoires. Sans eux, le contrat peut être requalifié en CDI.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <span style={LIB}>Entreprise utilisatrice</span>
                        <input value={f.eu_raison_sociale || ""} style={CHAMP}
                          onChange={(ev) => setF({ ...f, eu_raison_sociale: ev.target.value })} />
                      </div>
                      <div style={{ flex: "1 1 180px" }}>
                        <span style={LIB}>Son SIRET</span>
                        <input value={f.eu_siret || ""} style={CHAMP}
                          onChange={(ev) => setF({ ...f, eu_siret: ev.target.value })} />
                      </div>
                      <div style={{ flex: "1 1 100%" }}>
                        <span style={LIB}>Motif de recours</span>
                        <select value={f.motif_recours || ""} style={CHAMP}
                          onChange={(ev) => setF({ ...f, motif_recours: ev.target.value })}>
                          <option value="">Choisir…</option>
                          {MOTIFS.map(function (m) {
                            return <option key={m} value={m}>{m}</option>;
                          })}
                        </select>
                      </div>
                      <div style={{ flex: "1 1 100%" }}>
                        <span style={LIB}>Précision (nom du remplacé, nature du pic…)</span>
                        <input value={f.motif_detail || ""} style={CHAMP}
                          onChange={(ev) => setF({ ...f, motif_detail: ev.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={creer} disabled={occupe !== ""}
                  style={{ ...BOUTON, marginTop: "16px" }}>
                  {occupe === "creer" ? "…" : "Enregistrer"}
                </button>
              </div>
            )}

            {contrats.map(function (c: any) {
              const s = c.paie_salaries || {};
              return (
                <div key={c.id} style={{ ...CADRE, cursor: "pointer" }}
                  onClick={() => ouvrir(c)}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "16px" }}>
                        {s.prenom} {s.nom}
                      </strong>
                      <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px",
                        marginLeft: "10px" }}>
                        {c.intitule_poste}
                      </span>
                    </div>
                    <span style={{ fontSize: "13.5px", color: OR }}>
                      {c.type_contrat === "mission" ? "Contrat de mission"
                        : c.type_contrat === "apprentissage" ? "Apprentissage"
                        : c.type_contrat === "mandat_social" ? "Mandat social"
                        : c.type_contrat === "stage" ? "Stage"
                        : c.type_contrat === "professionnalisation" ? "Professionnalisation"
                        : c.type_contrat.toUpperCase()}
                    </span>
                  </div>
                  {c.eu_raison_sociale && (
                    <p style={{ margin: "6px 0 0", fontSize: "13.5px",
                      color: "rgba(255,255,255,0.72)" }}>
                      Chez {c.eu_raison_sociale}
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ---- LE DOSSIER D UN CONTRAT ---- */}
        {choisi && (
          <>
            <button onClick={() => { setChoisi(null); setCalcul(null); }}
              style={{ ...SECOND, marginBottom: "16px" }}>
              ← Tous les contrats
            </button>

            <div style={CADRE}>
              <h2 style={{ color: OR, fontSize: "19px", marginTop: 0, marginBottom: "4px" }}>
                {choisi.paie_salaries ? choisi.paie_salaries.prenom + " "
                  + choisi.paie_salaries.nom : ""}
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.76)" }}>
                {choisi.intitule_poste}
                {choisi.salaire_horaire ? " · " + euros(choisi.salaire_horaire) + " € de l'heure" : ""}
                {choisi.eu_raison_sociale ? " · chez " + choisi.eu_raison_sociale : ""}
              </p>

              <div style={{ marginTop: "14px", maxWidth: "200px" }}>
                <span style={LIB}>Mois de paie</span>
                <input type="month" value={periode.slice(0, 7)} style={CHAMP}
                  onChange={(ev) => changerPeriode(ev.target.value + "-01")} />
              </div>

              {/* ═══════════════════════════════════════════════════════
                  🆕🚨 28/09 — LE CONTRAT, MODIFIABLE A L ECRAN
                  Augmentation, passage a temps partiel, coefficient, lieu de
                  travail, fin prevue, rupture : tout passait par SQL. Un
                  bulletin deja emis ne change pas.
                  ═══════════════════════════════════════════════════════ */}
              {(function () {
                const typeLib = choisi.type_contrat === "mission" ? "Contrat de mission"
                  : choisi.type_contrat === "apprentissage" ? "Apprentissage"
                  : choisi.type_contrat === "mandat_social" ? "Mandat social"
                  : choisi.type_contrat === "stage" ? "Convention de stage"
                  : choisi.type_contrat === "professionnalisation" ? "Contrat de professionnalisation"
                  : String(choisi.type_contrat || "").toUpperCase();
                const dateFr = function (x: any): string { return String(x || "").slice(0, 10).split("-").reverse().join("/"); };
                const morceaux: string[] = [typeLib];
                if (Number(choisi.salaire_mensuel) > 0) morceaux.push(euros(choisi.salaire_mensuel) + " € par mois");
                else if (Number(choisi.salaire_horaire) > 0) morceaux.push(euros(choisi.salaire_horaire) + " € de l'heure");
                if (choisi.forfait_jours_annuel) morceaux.push("forfait de " + choisi.forfait_jours_annuel + " jours par an");
                else if (choisi.type_contrat !== "mandat_social") {
                  morceaux.push(String(Number(choisi.duree_hebdo) > 0 ? Number(choisi.duree_hebdo) : 35).replace(".", ",") + " h par semaine");
                }
                morceaux.push(choisi.categorie === "cadre" ? "cadre" : "non cadre");
                if (choisi.coefficient) morceaux.push("coefficient " + choisi.coefficient);
                if (choisi.code_risque_at) morceaux.push("risque AT " + choisi.code_risque_at);
                if (choisi.vehicule) morceaux.push("véhicule de fonction");
                if (choisi.lieu_travail_insee) morceaux.push("lieu de travail " + choisi.lieu_travail_insee);
                if (choisi.date_fin) morceaux.push("fin prévue le " + dateFr(choisi.date_fin));
                if (choisi.rompu_le) {
                  morceaux.push((choisi.type_contrat === "mandat_social" ? "fin du mandat le " : "rupture le ")
                    + dateFr(choisi.rompu_le) + (choisi.motif_rupture_dsn ? " (motif " + choisi.motif_rupture_dsn + ")" : ""));
                }
                const cs = contratSaisie;
                const champ = function (cle: string, libelle: string, largeur: string, attrs?: any) {
                  return (
                    <div style={{ flex: "1 1 " + largeur }}>
                      <span style={LIB}>{libelle}</span>
                      <input value={cs[cle] || ""} style={CHAMP} {...(attrs || {})}
                        onChange={(ev) => setContratSaisie({ ...cs, [cle]: ev.target.value })} />
                    </div>
                  );
                };
                return (
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.6",
                        color: "rgba(255,255,255,0.76)" }}>
                        Contrat : {morceaux.join(" · ")}
                      </p>
                      <button onClick={ouvrirContrat} style={{ ...LIEN, color: OR, ...cache(droitsIci.contrats) }}>
                        {cs ? "annuler" : "modifier le contrat"}
                      </button>
                    </div>
                    {cs && (
                      <div style={{ marginTop: "10px", padding: "12px",
                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          {champ("intitule_poste", "Poste", "200px")}
                          {champ("pcs_ese", "Code PCS-ESE", "120px")}
                          <div style={{ flex: "1 1 140px" }}>
                            <span style={LIB}>Catégorie</span>
                            <select value={cs.categorie} style={CHAMP}
                              onChange={(ev) => setContratSaisie(ev.target.value === "cadre"
                                ? { ...cs, categorie: ev.target.value }
                                // 🆕 28/09 — repasser en non cadre VIDE le forfait : le
                                // champ se cachait mais sa valeur restait enregistree
                                // (essai 10 du 28/09).
                                : { ...cs, categorie: ev.target.value, forfait_jours_annuel: "", plafond_reduit_forfait: false })}>
                              <option value="non_cadre">Non cadre</option>
                              <option value="cadre">Cadre</option>
                            </select>
                          </div>
                          {champ("idcc", "IDCC", "100px")}
                          {champ("coefficient", "Coefficient", "100px")}
                          {champ("position_conv", "Position", "100px")}
                          {champ("lieu_travail_insee", "Lieu de travail (code INSEE)", "170px", { placeholder: "ex. 69382" })}
                          {champ("code_risque_at", "Code risque AT (CARSAT)", "140px", { placeholder: "ex. 745BD" })}
                          {choisi.type_contrat === "apprentissage" && (
                            <label style={{ flex: "1 1 100%", display: "flex", gap: "8px", alignItems: "center", fontSize: "14px" }}>
                              <input type="checkbox" checked={!!cs.apprenti_public}
                                onChange={(ev) => setContratSaisie({ ...cs, apprenti_public: ev.target.checked })} />
                              Employeur du secteur public : retraite complémentaire Ircantec
                            </label>
                          )}
                          {champ("salaire_mensuel", "Salaire mensuel brut", "140px")}
                          {champ("salaire_horaire", "ou taux horaire", "120px")}
                          {choisi.type_contrat !== "mandat_social"
                            && champ("duree_hebdo", "Heures par semaine", "120px", { placeholder: "35" })}
                          {cs.categorie === "cadre" && choisi.type_contrat !== "mandat_social"
                            && champ("forfait_jours_annuel", "Forfait (jours par an)", "150px", { placeholder: "vide si à l'horaire" })}
                          {cs.categorie === "cadre" && choisi.type_contrat !== "mandat_social"
                            && Number(String(cs.forfait_jours_annuel || "").replace(",", ".")) > 0
                            && Number(String(cs.forfait_jours_annuel || "").replace(",", ".")) < 218 && (
                            <label style={{ flex: "1 1 100%", display: "flex", gap: "8px", alignItems: "center", fontSize: "14px" }}>
                              <input type="checkbox" checked={!!cs.plafond_reduit_forfait}
                                onChange={(ev) => setContratSaisie({ ...cs, plafond_reduit_forfait: ev.target.checked })} />
                              Plafond de Sécurité sociale réduit dans le même rapport (le salarié y a consenti)
                            </label>
                          )}
                          <div style={{ flex: "1 1 150px" }}>
                            <span style={LIB}>Fin prévue</span>
                            <input type="date" className="mc-date" value={cs.date_fin || ""} style={CHAMP}
                              onChange={(ev) => setContratSaisie({ ...cs, date_fin: ev.target.value })} />
                            {/* 🆕 28/09 — l iPad ne sait pas vider un champ date. */}
                            {cs.date_fin && (
                              <button onClick={() => setContratSaisie({ ...cs, date_fin: "" })}
                                style={{ ...LIEN, color: OR, marginTop: "4px" }}>effacer la date</button>
                            )}
                          </div>
                        </div>
                        {/* 🆕 28/09 — LE VEHICULE DE FONCTION : l avantage en
                            nature se calcule seul chaque mois (forfait de
                            l arrete du 25 fevrier 2025). */}
                        <p style={{ margin: "14px 0 6px", fontSize: "13.5px", color: OR }}>
                          Véhicule de fonction (usage privé)
                        </p>
                        <label style={{ fontSize: "14px", display: "flex", gap: "8px", alignItems: "center" }}>
                          <input type="checkbox" checked={!!cs.vehicule}
                            onChange={(ev) => setContratSaisie({ ...cs, vehicule: ev.target.checked
                              ? { mode: "achat", valeur: "", achat_le: "", mis_a_disposition_le: "", fin: "",
                                  carburant: false, electrique: false, eco_score: false, participation: "" }
                              : null })} />
                          Un véhicule est mis à disposition, avec usage privé
                        </label>
                        {cs.vehicule && (function () {
                          const vv = cs.vehicule;
                          const majV = function (k: string, val: any) {
                            setContratSaisie({ ...cs, vehicule: { ...vv, [k]: val } });
                          };
                          return (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                              <div style={{ flex: "1 1 130px" }}>
                                <span style={LIB}>Véhicule</span>
                                <select value={vv.mode} style={CHAMP} onChange={(ev) => majV("mode", ev.target.value)}>
                                  <option value="achat">Acheté par l'employeur</option>
                                  <option value="location">Loué par l'employeur</option>
                                </select>
                              </div>
                              <div style={{ flex: "1 1 170px" }}>
                                <span style={LIB}>{vv.mode === "location"
                                  ? "Coût global annuel TTC (loyers, entretien, assurance)" : "Prix d'achat TTC"}</span>
                                <input value={vv.valeur || ""} style={CHAMP} onChange={(ev) => majV("valeur", ev.target.value)} />
                              </div>
                              {vv.mode === "achat" && (
                                <div style={{ flex: "1 1 140px" }}>
                                  <span style={LIB}>Date d'achat</span>
                                  <input type="date" className="mc-date" value={vv.achat_le || ""} style={CHAMP} onChange={(ev) => majV("achat_le", ev.target.value)} />
                                </div>
                              )}
                              <div style={{ flex: "1 1 140px" }}>
                                <span style={LIB}>Mis à disposition le</span>
                                <input type="date" className="mc-date" value={vv.mis_a_disposition_le || ""} style={CHAMP}
                                  onChange={(ev) => majV("mis_a_disposition_le", ev.target.value)} />
                              </div>
                              <div style={{ flex: "1 1 140px" }}>
                                <span style={LIB}>Restitué le (vide sinon)</span>
                                <input type="date" className="mc-date" value={vv.fin || ""} style={CHAMP} onChange={(ev) => majV("fin", ev.target.value)} />
                                {vv.fin && (
                                  <button onClick={() => majV("fin", "")} style={{ ...LIEN, color: OR, marginTop: "4px" }}>
                                    effacer la date
                                  </button>
                                )}
                              </div>
                              <div style={{ flex: "1 1 150px" }}>
                                <span style={LIB}>Participation du salarié par mois</span>
                                <input value={vv.participation || ""} style={CHAMP} placeholder="0"
                                  onChange={(ev) => majV("participation", ev.target.value)} />
                              </div>
                              <div style={{ flex: "1 1 100%", display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "14px" }}>
                                <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <input type="checkbox" checked={!!vv.electrique} onChange={(ev) => majV("electrique", ev.target.checked)} />
                                  100 % électrique
                                </label>
                                {vv.electrique ? (
                                  <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                    <input type="checkbox" checked={!!vv.eco_score} onChange={(ev) => majV("eco_score", ev.target.checked)} />
                                    éco-scoré (éligible au bonus écologique)
                                  </label>
                                ) : (
                                  <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                    <input type="checkbox" checked={!!vv.carburant} onChange={(ev) => majV("carburant", ev.target.checked)} />
                                    carburant personnel payé par l'employeur
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        <p style={{ margin: "14px 0 6px", fontSize: "13.5px", color: OR }}>
                          {choisi.type_contrat === "mandat_social" ? "Fin du mandat" : "Rupture du contrat"}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          <div style={{ flex: "1 1 170px" }}>
                            <span style={LIB}>{choisi.type_contrat === "mandat_social"
                              ? "Fin du mandat le" : "Date de rupture (dernier jour du contrat)"}</span>
                            <input type="date" className="mc-date" value={cs.rompu_le || ""} style={CHAMP}
                              onChange={(ev) => setContratSaisie({ ...cs, rompu_le: ev.target.value })} />
                            {/* 🆕 28/09 — ANNULER LA RUPTURE : l iPad ne vide pas un
                                champ date (essai 2 du 28/09). Vide la date et le
                                motif ; il reste a enregistrer. */}
                            {cs.rompu_le && (
                              <button onClick={() => setContratSaisie({ ...cs, rompu_le: "", motif_rupture_dsn: "" })}
                                style={{ ...LIEN, color: OR, marginTop: "4px" }}>
                                {choisi.type_contrat === "mandat_social" ? "annuler la fin du mandat" : "annuler la rupture"}
                                {" "}(puis « Enregistrer le contrat »)
                              </button>
                            )}
                          </div>
                          {choisi.type_contrat !== "mandat_social" && (
                            <div style={{ flex: "2 1 260px" }}>
                              <span style={LIB}>Motif (il part dans la DSN)</span>
                              <select value={cs.motif_rupture_dsn || ""} style={CHAMP}
                                onChange={(ev) => setContratSaisie({ ...cs, motif_rupture_dsn: ev.target.value })}>
                                <option value="">— choisir —</option>
                                {motifsRupture.map(function (m: any) {
                                  return <option key={m.code} value={m.code}>{m.code} — {m.libelle}</option>;
                                })}
                              </select>
                            </div>
                          )}
                        </div>
                        <p style={{ margin: "10px 0 0", fontSize: "12.5px", lineHeight: "1.6",
                          color: "rgba(255,255,255,0.72)" }}>
                          Les bulletins déjà émis ne changent pas : les calculs à venir utilisent
                          ces valeurs. Pour annuler une rupture, vider sa date et enregistrer.
                        </p>
                        <button onClick={enregistrerContrat} disabled={occupe !== ""}
                          style={{ ...BOUTON, marginTop: "10px" }}>
                          {occupe === "contrat" ? "…" : "Enregistrer le contrat"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ═══════════════════════════════════════════════════════
                  🆕 27/09 — LES JOURS TRAVAILLES DANS LA SEMAINE
                  Les retenues d'absence se font aux heures réelles : pour un
                  temps partiel sur moins de cinq jours, ou un samedi
                  travaillé, il faut savoir quels jours le salarié travaille.
                  ═══════════════════════════════════════════════════════ */}
              {(function () {
                const noms = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
                const nomsLongs = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
                const ordre = [1, 2, 3, 4, 5, 6, 0];
                const actuels = joursDuContrat(choisi);
                const renseigne = !!String(choisi.jours_travailles || "").trim();
                const hebdo = Number(choisi.duree_hebdo) > 0 ? Number(choisi.duree_hebdo) : 35;
                const auForfait = !!choisi.forfait_jours_annuel;
                return (
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.6",
                        color: "rgba(255,255,255,0.76)" }}>
                        Jours travaillés dans la semaine :{" "}
                        {actuels.map(function (j) { return nomsLongs[j]; }).join(", ")}
                        {auForfait ? " — forfait en jours, sans effet sur le calcul"
                          : " — " + (Math.round(hebdo / actuels.length * 100) / 100)
                            .toLocaleString("fr-FR") + " h par jour"}
                        {renseigne ? "" : " (par défaut)"}
                      </p>
                      <button onClick={() => setJoursSaisie(joursSaisie ? null : actuels.slice())}
                        style={{ ...LIEN, color: OR, ...cache(droitsIci.contrats) }}>
                        {joursSaisie ? "annuler" : "modifier"}
                      </button>
                    </div>
                    {joursSaisie && (
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {ordre.map(function (j) {
                            const coche = joursSaisie.indexOf(j) >= 0;
                            return (
                              <button key={j}
                                onClick={() => setJoursSaisie(coche
                                  ? joursSaisie.filter(function (x) { return x !== j; })
                                  : joursSaisie.concat([j]))}
                                style={{ ...SECOND, padding: "6px 10px", fontSize: "14px",
                                  background: coche ? OR : "transparent",
                                  color: coche ? "#0b0b10" : OR }}>
                                {noms[j]}
                              </button>
                            );
                          })}
                        </div>
                        <p style={{ margin: "8px 0 0", fontSize: "12.5px", lineHeight: "1.6",
                          color: "rgba(255,255,255,0.72)" }}>
                          {joursSaisie.length > 0 && !auForfait
                            ? hebdo.toLocaleString("fr-FR") + " h réparties sur "
                              + joursSaisie.length + " jour(s), soit "
                              + (Math.round(hebdo / joursSaisie.length * 100) / 100)
                                .toLocaleString("fr-FR") + " h par jour. "
                            : ""}
                          Les absences se retiendront sur ces jours-là. Un bulletin
                          déjà émis ne change pas.
                        </p>
                        <button onClick={enregistrerJours}
                          disabled={occupe !== "" || joursSaisie.length === 0}
                          style={{ ...BOUTON, marginTop: "8px",
                            opacity: joursSaisie.length === 0 ? 0.4 : 1 }}>
                          {occupe === "jours" ? "…" : "Enregistrer les jours travaillés"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ═══════════════════════════════════════════════════════
                  🆕 27/09 — LE TAUX DE PRELEVEMENT A LA SOURCE
                  Sans taux personnalisé saisi, la grille officielle du taux
                  non personnalisé s'applique : le bulletin le dit.
                  ═══════════════════════════════════════════════════════ */}
              {(function () {
                const sal: any = choisi.paie_salaries || {};
                const perso = sal.taux_pas !== null && sal.taux_pas !== undefined && String(sal.taux_pas) !== "";
                return (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.6",
                        color: "rgba(255,255,255,0.76)" }}>
                        Prélèvement à la source :{" "}
                        {perso
                          ? "taux personnalisé " + Number(sal.taux_pas).toLocaleString("fr-FR") + " %"
                            + (sal.taux_pas_date_effet ? " depuis le "
                              + String(sal.taux_pas_date_effet).slice(0, 10).split("-").reverse().join("/") : "")
                          : "taux non personnalisé (grille officielle), faute de taux personnalisé saisi"}
                      </p>
                      <button onClick={() => setPasSaisie(pasSaisie ? null : {
                          taux: perso ? String(sal.taux_pas).replace(".", ",") : "",
                          date_effet: sal.taux_pas_date_effet ? String(sal.taux_pas_date_effet).slice(0, 10) : "",
                          identifiant_crm: sal.taux_pas_identifiant_crm || "" })}
                        style={{ ...LIEN, color: OR, ...cache(droitsIci.contrats) }}>
                        {pasSaisie ? "annuler" : (perso ? "modifier" : "saisir le taux personnalisé")}
                      </button>
                    </div>
                    {pasSaisie && (
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <div style={{ flex: "1 1 110px" }}>
                            <span style={LIB}>Taux (%)</span>
                            <input style={CHAMP} inputMode="decimal" placeholder="ex. 7,5"
                              value={pasSaisie.taux}
                              onChange={(ev) => setPasSaisie({ ...pasSaisie, taux: ev.target.value })} />
                          </div>
                          <div style={{ flex: "1 1 150px" }}>
                            <span style={LIB}>À compter du</span>
                            <input style={CHAMP} type="date" className="mc-date" value={pasSaisie.date_effet}
                              onChange={(ev) => setPasSaisie({ ...pasSaisie, date_effet: ev.target.value })} />
                          </div>
                          <div style={{ flex: "1 1 180px" }}>
                            <span style={LIB}>Identifiant du compte rendu (facultatif)</span>
                            <input style={CHAMP} value={pasSaisie.identifiant_crm}
                              onChange={(ev) => setPasSaisie({ ...pasSaisie, identifiant_crm: ev.target.value })} />
                          </div>
                        </div>
                        <p style={{ margin: "6px 0 0", fontSize: "12.5px", lineHeight: "1.6",
                          color: "rgba(255,255,255,0.72)" }}>
                          Le taux figure dans le compte rendu de la DSN, ou sur le tableau de
                          bord net-entreprises. Il s&apos;applique aux prochains calculs ; un
                          bulletin déjà émis ne change pas.
                        </p>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                          <button onClick={() => enregistrerPas(false)}
                            disabled={occupe !== "" || !String(pasSaisie.taux || "").trim()}
                            style={{ ...BOUTON, opacity: String(pasSaisie.taux || "").trim() ? 1 : 0.4 }}>
                            {occupe === "pas" ? "…" : "Enregistrer le taux"}
                          </button>
                          {perso && (
                            <button onClick={() => enregistrerPas(true)} disabled={occupe !== ""}
                              style={SECOND}>
                              Revenir à la grille
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 🆕 16/09 — CE QUI EXISTE DEJA POUR CE MOIS SE VOIT ICI,
                  avant tout clic. Un seul bulletin par mois : autant dire
                  tout de suite lequel c est. */}
              {emisDuMois && (
                <p style={{ margin: "12px 0 0", fontSize: "13.5px", color: VERT,
                  lineHeight: "1.6" }}>
                  Le bulletin {emisDuMois.numero} de ce mois est déjà émis. Les
                  éléments ne peuvent plus être modifiés — une correction passe
                  par un bulletin rectificatif.
                </p>
              )}
              {brouillonDuMois && (
                <p style={{ margin: "12px 0 0", fontSize: "13.5px", color: OR,
                  lineHeight: "1.6" }}>
                  Un brouillon existe pour ce mois ({brouillonDuMois.numero}) :
                  le recalcul le remplacera.
                </p>
              )}
            </div>

            {/* ---- LES ELEMENTS DU MOIS ---- */}
            <div style={CADRE}>
              <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                Ce qui s&apos;est passé ce mois-ci
              </h3>
              <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.72)",
                lineHeight: "1.6", marginTop: 0 }}>
                {/* 🚨 LE TEXTE SUIT LE CONTRAT. Il annoncait « depuis le taux
                    horaire » a un salarie paye au mois : celui qui lit croit
                    devoir saisir des heures, et se demande ou. Un CDI se paie
                    au mois, une mission a l heure — l ecran doit dire lequel. */}
                Le salaire de base se calcule tout seul depuis {choisi && Number(choisi.salaire_mensuel) > 0
                  ? "le salaire mensuel du contrat"
                  : "le taux horaire"}.
                N&apos;ajoutez ici que ce qui sort de l&apos;ordinaire.
              </p>

              {elements.length === 0 ? (
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.72)" }}>
                  Rien pour l&apos;instant.
                </p>
              ) : elements.map(function (el: any) {
                return (
                  <div key={el.id} style={{ display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: "13.5px" }}>
                      {el.libelle}
                      {el.soumis_cotisations === false && (
                        <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "12.5px",
                          marginLeft: "8px" }}>non soumis</span>
                      )}
                    </span>
                    <span>
                      <span style={{ fontSize: "13.5px", marginRight: "12px" }}>
                        {euros(el.montant)} €
                      </span>
                      <button onClick={() => retirer(el.id)}
                        style={{ background: "none", border: "none", color: ROUGE,
                          cursor: "pointer", fontSize: "13.5px", ...cache(droitsIci.preparer) }}>
                        retirer
                      </button>
                      {/* 🆕 28/09 — LA PIECE JUSTIFICATIVE. Exigee a partir
                          d un seuil (point rouge sinon) ; elle part au coffre. */}
                      {el.preuve_chemin ? (
                        <button onClick={() => voirPiece(el.id)}
                          style={{ ...LIEN, color: VERT, marginLeft: "10px" }}>
                          pièce ✓
                        </button>
                      ) : (
                        <label style={{ ...GESTE(OR), marginLeft: "10px", padding: "4px 10px",
                          fontSize: "13.5px", display: "inline-block", ...cache(droitsIci.preparer) }}>
                          {occupe === "piece" ? "…" : "joindre une pièce"}
                          <input type="file" accept="image/*,application/pdf"
                            style={{ display: "none" }}
                            onChange={(ev) => {
                              const fi = ev.target.files && ev.target.files[0];
                              if (fi) joindrePiece(el, fi);
                              ev.target.value = "";
                            }} />
                        </label>
                      )}
                    </span>
                  </div>
                );
              })}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px",
                marginTop: "16px", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <span style={LIB}>Nature</span>
                  <select value={e.type_element} style={CHAMP}
                    onChange={(ev) => setE({ ...e, type_element: ev.target.value })}>
                    {TYPES_ELEMENT.map(function (t) {
                      return <option key={t.cle} value={t.cle}>{t.nom}</option>;
                    })}
                  </select>
                </div>
                <div style={{ flex: "0 1 100px" }}>
                  <span style={LIB}>Quantité</span>
                  <input value={e.quantite || ""} style={CHAMP}
                    onChange={(ev) => setE({ ...e, quantite: ev.target.value })} />
                </div>
                <div style={{ flex: "0 1 130px" }}>
                  {/* ⚠️ L ETIQUETTE DIT CE QUE VAUDRA LE CHAMP LAISSE VIDE :
                      un calcul invisible inquiete plus qu il ne soulage. */}
                  <span style={LIB}>
                    Taux
                    {tauxMajore() !== null && !e.taux && (
                      <span style={{ color: OR }}> · {tauxMajore()}</span>
                    )}
                  </span>
                  <input value={e.taux || ""} style={CHAMP}
                    placeholder={tauxMajore() !== null ? String(tauxMajore()) : ""}
                    onChange={(ev) => setE({ ...e, taux: ev.target.value })} />
                </div>
                <div style={{ flex: "0 1 110px" }}>
                  <span style={LIB}>ou montant</span>
                  <input value={e.montant || ""} style={CHAMP}
                    onChange={(ev) => setE({ ...e, montant: ev.target.value })} />
                </div>
                <button onClick={ajouterElement} disabled={occupe !== ""} style={{ ...SECOND, ...cache(droitsIci.preparer) }}>
                  Ajouter
                </button>
              </div>

              {AIDE_ELEMENT[e.type_element] && (
                <p style={{ fontSize: "13.5px", color: OR, margin: "10px 0 0",
                  lineHeight: "1.6" }}>
                  {AIDE_ELEMENT[e.type_element]}
                </p>
              )}
            </div>

            {/* ---- LE CALCUL ---- */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
              <button onClick={calculer} disabled={occupe !== ""} style={BOUTON}>
                {occupe === "calcul" ? "…" : "Calculer le bulletin"}
              </button>
              {calcul && (
                <button onClick={genererBulletin} disabled={occupe !== ""} style={{ ...SECOND, ...cache(droitsIci.preparer) }}>
                  {occupe === "bulletin" ? "…"
                    : (!brouillonDuMois && emisDuMois) ? "Ouvrir un rectificatif"
                    : brouillonDuMois ? "Refaire le PDF du brouillon"
                    : "Sortir le PDF"}
                </button>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                🚨 UN BULLETIN SORTI N EST PAS UN BULLETIN EMIS.
                Defaut trouve a l essai du CDI le 16/09 : le bulletin porte
                un numero, il est imprime, il est remis — et il reste
                MODIFIABLE. Rien a l ecran ne disait qu une etape restait.
                ⚠️ CE QUI EN DEPEND : l acquisition des conges payes se pose
                A L EMISSION. Un bulletin qui reste en brouillon ne donne
                aucun jour au salarie, et personne ne s en apercoit avant
                qu il les reclame.
                ═══════════════════════════════════════════════════════════ */}
            {brouillonDuMois && (
              <div style={{ marginTop: "14px", padding: "12px 14px",
                border: "1px solid rgba(212,175,110,0.35)", borderRadius: "8px",
                background: "rgba(212,175,110,0.06)", fontSize: "14px",
                lineHeight: 1.55 }}>
                <strong style={{ color: OR }}>Ce bulletin est encore un brouillon.</strong>
                {" "}Il peut être recalculé autant que nécessaire. Tant qu&apos;il
                n&apos;est pas émis, il ne compte pas dans la DSN et
                {choisi && (choisi.type_contrat === "cdi"
                  || choisi.type_contrat === "apprentissage" || choisi.type_contrat === "professionnalisation")
                  ? " aucun jour de congé n'est acquis."
                  : " il n'est pas définitif."}
                {/* 🆕 28/09 — SANS LA CARTE BLANCHE, ON SOUMET. */}
                {(droitsIci.emettre && droitsIci.carte_blanche) ? (
                  <button onClick={() => emettre(brouillonDuMois)}
                    disabled={occupe !== ""}
                    style={{ marginLeft: "12px", background: "none",
                      border: "1px solid " + VERT, color: VERT, borderRadius: "6px",
                      padding: "5px 12px", cursor: "pointer", fontSize: "13.5px" }}>
                    {occupe === "emettre" ? "…" : "Émettre ce bulletin"}
                  </button>
                ) : droitsIci.preparer ? (
                  <button onClick={() => soumettre(choisi.id, brouillonDuMois.id)}
                    disabled={occupe !== ""}
                    style={{ marginLeft: "12px", background: "none",
                      border: "1px solid " + OR, color: OR, borderRadius: "6px",
                      padding: "5px 12px", cursor: "pointer", fontSize: "13.5px" }}>
                    {occupe === "valider" ? "…" : "Soumettre à validation"}
                  </button>
                ) : null}
                {/* 🆕 29/09 — RESSORTIR LE BROUILLON SANS CALCULER D ABORD. Le bouton
                    « Refaire le PDF » n apparaissait qu apres « Calculer le bulletin » :
                    il fallait le savoir. Il est maintenant la, a cote du brouillon. */}
                {droitsIci.preparer && (
                  <button onClick={genererBulletin} disabled={occupe !== ""}
                    style={{ ...GESTE(OR), marginLeft: "10px", padding: "5px 12px", fontSize: "13.5px" }}>
                    {occupe === "bulletin" ? "…" : "Ressortir ce brouillon"}
                  </button>
                )}
                <span style={{ display: "block", marginTop: "6px", fontSize: "13.5px",
                  color: "rgba(255,255,255,0.76)" }}>
                  Avant l&apos;émission : les contrôles et le récapitulatif client, dans
                  « Validation du mois » ci-dessous.
                </span>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                🆕🚨 28/09 — LA VALIDATION DU MOIS
                Tous les salaries de la societe, avec leur feu : vert (rien a
                signaler), orange (une justification est demandee), rouge
                (emission bloquee tant que ce n est pas corrige, ou leve avec
                un motif par qui a la carte blanche). Puis le recapitulatif
                que le client confirme avant toute emission.
                ═══════════════════════════════════════════════════════════ */}
            <div style={CADRE}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ color: OR, fontSize: "19px", margin: 0 }}>
                  Validation du mois — {libelleMois(periode)}
                </h3>
                <button onClick={() => chargerMois()} disabled={occupe !== ""}
                  style={{ ...GESTE(OR), padding: "4px 10px", fontSize: "13.5px" }}>
                  actualiser
                </button>
              </div>
              <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.76)",
                margin: "6px 0 12px", lineHeight: 1.6 }}>
                Vos droits sur ce dossier : {texteDroits(droitsIci)}.
              </p>

              {!mois ? (
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.72)" }}>Lecture…</p>
              ) : (
                <>
                  {prochaine && (
                    <div style={{ margin: "0 0 12px", padding: "10px 14px", borderRadius: "8px",
                      border: "1px solid " + OR, background: "rgba(200,169,110,0.08)",
                      fontSize: "14px", lineHeight: 1.55 }}>
                      <span style={{ color: OR, fontSize: "12px", letterSpacing: "2px", display: "block",
                        marginBottom: "3px" }}>PROCHAINE ÉTAPE</span>
                      {prochaine}
                    </div>
                  )}
                  <div style={{ padding: "10px 12px", borderRadius: "8px", border: BORD,
                    marginBottom: "12px", fontSize: "14px", lineHeight: 1.6 }}>
                    <strong style={{ color: OR }}>Récapitulatif client</strong>
                    {" — "}{texteRecap(mois.recap)}
                    {mois.recap_manquants && mois.recap_manquants.length > 0 && (
                      <div style={{ color: ROUGE, marginTop: "6px" }}>
                        Sans bulletin ce mois-ci : {mois.recap_manquants.join(", ")}.
                      </div>
                    )}
                    {mois.recap_perimes && mois.recap_perimes.length > 0 && (
                      <div style={{ color: ROUGE, marginTop: "6px" }}>
                        Brouillon à ressortir (saisie postérieure) : {mois.recap_perimes.join(", ")}.
                      </div>
                    )}
                    {droitsIci.preparer && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap",
                        marginTop: "8px", alignItems: "center" }}>
                        <input value={recapDest} placeholder="adresse électronique du client"
                          style={{ ...CHAMP, flex: "1 1 220px", width: "auto" }}
                          onChange={(ev) => setRecapDest(ev.target.value)} />
                        <button onClick={envoyerRecap} disabled={occupe !== ""} style={SECOND}>
                          {occupe === "recap" ? "…"
                            : mois.recap ? "Renvoyer le récapitulatif" : "Envoyer le récapitulatif"}
                        </button>
                      </div>
                    )}
                    {droitsIci.emettre && droitsIci.carte_blanche
                      && (!mois.recap || mois.recap.statut !== "leve") && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap",
                        marginTop: "8px", alignItems: "center" }}>
                        <input value={motifs.recap || ""}
                          placeholder="motif pour émettre sans la confirmation du client"
                          style={{ ...CHAMP, flex: "1 1 220px", width: "auto" }}
                          onChange={(ev) => setMotifs({ ...motifs, recap: ev.target.value })} />
                        <button onClick={leverRecap} disabled={occupe !== ""}
                          style={{ ...SECOND, borderColor: ROUGE, color: ROUGE }}>
                          Lever l&apos;attente
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 🆕 28/09 — les gestes en masse */}
                  {(sansBulletin.length > 0 && droitsIci.preparer)
                    || (prets.length > 0 && droitsIci.emettre && droitsIci.carte_blanche) ? (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {sansBulletin.length > 0 && droitsIci.preparer && (
                        <button onClick={sortirTousLesBrouillons} disabled={occupe !== ""} style={SECOND}>
                          {occupe === "masse" ? "…" : "Sortir les " + sansBulletin.length + " brouillon(s) manquant(s) ou périmé(s)"}
                        </button>
                      )}
                      {prets.length > 0 && droitsIci.emettre && droitsIci.carte_blanche && (
                        <button onClick={emettreLesPrets} disabled={occupe !== "" || !recapOk}
                          style={{ ...SECOND, borderColor: VERT, color: VERT, opacity: recapOk ? 1 : 0.45 }}>
                          {occupe === "masse" ? "…" : "Émettre les " + prets.length + " bulletin(s) prêt(s)"}
                        </button>
                      )}
                      {prets.length > 0 && droitsIci.emettre && droitsIci.carte_blanche && !recapOk && (
                        <span style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.72)", alignSelf: "center" }}>
                          en attente du récapitulatif confirmé par le client
                        </span>
                      )}
                    </div>
                  ) : null}

                  {mois.lignes.length === 0 && (
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.72)" }}>
                      Aucun salarié en poste ce mois-ci dans ce dossier.
                    </p>
                  )}
                  {alertesCommunes.length > 0 && (
                    <div style={{ margin: "0 0 10px", padding: "8px 12px", borderRadius: "8px",
                      border: "1px solid rgba(240,168,96,0.35)" }}>
                      {alertesCommunes.map(function (a: any, i: number) {
                        return (
                          <div key={i} style={{ margin: i === 0 ? "0" : "8px 0 0" }}>
                            <p style={{ margin: "0 0 2px", fontSize: "13.5px", color: "rgba(255,255,255,0.8)" }}>
                              Pour {a.salaries.length} salariés ({a.salaries.join(", ")}) :
                            </p>
                            <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.5,
                              color: a.niveau === "rouge" ? ROUGE : ORANGE }}>
                              ● {a.texte}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {mois.lignes.map(function (l: any) {
                    const b = l.bulletin;
                    const ctl = l.controle;
                    const coul = ctl ? ctl.couleur : null;
                    return (
                      <div key={l.contrat_id} style={{ padding: "10px 0",
                        borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between",
                          gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: "13.5px" }}>
                            <span style={{ display: "inline-block", width: "11px", height: "11px",
                              borderRadius: "50%", background: couleurPastille(coul),
                              marginRight: "8px", verticalAlign: "middle" }} />
                            {l.salarie}
                            {choisi && l.contrat_id === choisi.id ? " (ouvert)" : ""}
                          </span>
                          <span style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.82)" }}>
                            {!b ? "pas encore de bulletin"
                              : b.numero + " · net " + euros(b.net_a_payer) + " € · " + etatValidation(b)
                                + (coul === "orange" && b.justification ? " · justifié" : "")
                                + (coul === "rouge" && b.levee_motif ? " · rouge levé" : "")}
                          </span>
                        </div>
                        {ctl && ctl.alertes.filter(function (a: any) { return !estCommune(a); }).length > 0 && (
                          <div style={{ marginTop: "6px" }}>
                            {ctl.alertes.filter(function (a: any) { return !estCommune(a); }).map(function (a: any, i: number) {
                              return (
                                <p key={i} style={{ margin: "3px 0", fontSize: "13.5px", lineHeight: 1.5,
                                  color: a.niveau === "rouge" ? ROUGE
                                    : a.niveau === "orange" ? ORANGE : "rgba(255,255,255,0.72)" }}>
                                  {a.niveau === "info" ? "○ " : "● "}{a.texte}
                                </p>
                              );
                            })}
                          </div>
                        )}
                        {b && b.justification && (
                          <p style={{ margin: "4px 0", fontSize: "13.5px", color: "rgba(255,255,255,0.8)" }}>
                            Justification : {b.justification}
                          </p>
                        )}
                        {b && b.levee_motif && (
                          <p style={{ margin: "4px 0", fontSize: "13.5px", color: "rgba(255,255,255,0.8)" }}>
                            Point rouge levé par {b.levee_par || "?"} : {b.levee_motif}
                          </p>
                        )}
                        {b && b.validation === "renvoye" && b.renvoi_motif && (
                          <p style={{ margin: "4px 0", fontSize: "13.5px", color: ROUGE }}>
                            Renvoyé pour correction : {b.renvoi_motif}
                          </p>
                        )}
                        {b && b.statut === "brouillon" && (droitsIci.preparer || droitsIci.emettre) && (
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap",
                            marginTop: "8px", alignItems: "center" }}>
                            <input value={motifs["m_" + b.id] || ""}
                              placeholder="justification, ou motif du renvoi ou de la levée"
                              style={{ ...CHAMP, flex: "1 1 220px", width: "auto" }}
                              onChange={(ev) => setMotifs({ ...motifs, ["m_" + b.id]: ev.target.value })} />
                            {droitsIci.preparer && coul === "orange" && (
                              <button onClick={() => geste("justifier", b)} disabled={occupe !== ""}
                                style={GESTE(ORANGE)}>justifier</button>
                            )}
                            {droitsIci.preparer && b.validation !== "a_valider" && (
                              <button onClick={() => soumettre(l.contrat_id, b.id)} disabled={occupe !== ""}
                                style={GESTE(OR)}>soumettre</button>
                            )}
                            {droitsIci.emettre && droitsIci.carte_blanche && (
                              <>
                                <button onClick={() => geste("renvoyer", b)} disabled={occupe !== ""}
                                  style={GESTE(ROUGE)}>renvoyer</button>
                                {coul === "rouge" && !b.levee_motif && (
                                  <button onClick={() => geste("lever", b)} disabled={occupe !== ""}
                                    style={GESTE(ROUGE)}>lever le rouge</button>
                                )}
                                <button onClick={() => emettre(b)} disabled={occupe !== ""}
                                  style={GESTE(VERT)}>émettre</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {profil && profil.gerer_equipe && (
                    <div style={{ marginTop: "14px", borderTop: BORD, paddingTop: "10px" }}>
                      <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 8px" }}>
                        OUTILS DU CABINET
                      </p>
                      <button onClick={chargerMesure} disabled={occupe !== ""}
                        style={GESTE(OR)}>
                        {occupe === "mesure" ? "…" : "Suivi des corrections par personne (six mois)"}
                      </button>
                      {mesure && (mesure.personnes.length === 0 ? (
                        <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.72)", margin: "6px 0 0" }}>
                          Aucune soumission sur la période.
                        </p>
                      ) : mesure.personnes.map(function (p: any) {
                        return (
                          <p key={p.email} style={{ fontSize: "13.5px", margin: "5px 0 0", lineHeight: 1.5 }}>
                            {p.email} : {p.soumis} soumis, {p.renvoyes} renvoyé(s), {p.leves} levée(s),
                            {" "}{p.emis} émis
                            {p.taux_corrections !== null
                              ? " — " + Number(p.taux_corrections).toLocaleString("fr-FR") + " % de corrections" : ""}
                          </p>
                        );
                      }))}
                      <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.72)", margin: "8px 0 0" }}>
                        La carte blanche se donne dossier par dossier, dans l&apos;écran des{" "}
                        <a href="/admin/compliance/collaborateurs" style={{ color: OR }}>collaborateurs</a>.
                      </p>

                      {/* 🆕 28/09 — LES SEUILS DU CABINET */}
                      <button onClick={() => seuilsVus ? setSeuilsVus(null) : chargerSeuils()}
                        disabled={occupe !== ""} style={{ ...GESTE(OR), marginTop: "12px", display: "block" }}>
                        {occupe === "seuils" ? "…" : seuilsVus ? "Fermer les seuils des contrôles" : "Régler les seuils des contrôles"}
                      </button>
                      {seuilsVus && (
                        <div style={{ marginTop: "8px" }}>
                          <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.72)", lineHeight: 1.6, margin: "0 0 8px" }}>
                            Ils valent pour tous les dossiers de votre cabinet. Une case vide reprend la valeur commune.
                          </p>
                          {seuilsVus.map(function (x: any) {
                            return (
                              <div key={x.code} style={{ display: "flex", gap: "10px", alignItems: "center",
                                flexWrap: "wrap", padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                <span style={{ flex: "1 1 300px", fontSize: "13.5px", lineHeight: 1.5,
                                  color: x.niveau === "rouge" ? ROUGE : ORANGE }}>
                                  {x.libelle} <span style={{ color: "rgba(255,255,255,0.72)" }}>
                                    (commun : {String(x.commun).replace(".", ",")} {x.unite || ""})</span>
                                </span>
                                <input value={seuilsSaisie[x.code] || ""} placeholder={String(x.commun).replace(".", ",")}
                                  onChange={(ev) => setSeuilsSaisie({ ...seuilsSaisie, [x.code]: ev.target.value })}
                                  style={{ ...CHAMP, width: "110px" }} />
                                <span style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.72)" }}>{x.unite || ""}</span>
                              </div>
                            );
                          })}
                          <button onClick={enregistrerSeuils} disabled={occupe !== ""} style={{ ...SECOND, marginTop: "8px" }}>
                            {occupe === "seuils" ? "…" : "Enregistrer les seuils du cabinet"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {calcul && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                  Le calcul, avant de sortir le document
                </h3>

                {/* 🆕 27/09 soir — LES LIGNES QUI N ENTRENT PAS DANS LE BRUT
                    (acompte, retenue des titres-restaurant, avantage deduit du
                    net, indemnites non soumises, IJ reversees) s affichent SOUS
                    les cotisations. Au-dessus du « Salaire brut », l acompte
                    faisait lire 2 400 − 300 = 2 400 (essai 5 du 27/09). */}
                {(calcul.lignes_brut || []).filter(function (l: any) { return !l.hors_brut; })
                  .map(function (l: any, i: number) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between",
                      padding: "4px 0", fontSize: "13.5px" }}>
                      <span>{l.libelle}</span>
                      <span>{euros(l.montant)} €</span>
                    </div>
                  );
                })}

                {(calcul.lignes_mission || []).map(function (l: any, i: number) {
                  return (
                    <div key={"m" + i} style={{ display: "flex",
                      justifyContent: "space-between", padding: "4px 0", fontSize: "13.5px" }}>
                      <span>{l.libelle}
                        {l.taux ? <span style={{ color: "rgba(255,255,255,0.72)",
                          marginLeft: "8px", fontSize: "13.5px" }}>
                          {l.taux} % de {euros(l.base)}</span> : null}
                      </span>
                      <span>{euros(l.montant)} €</span>
                    </div>
                  );
                })}

                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "10px 0", marginTop: "6px", fontWeight: "bold",
                  borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <span>Salaire brut</span>
                  <span>{euros(calcul.brut_total)} €</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "4px 0", fontSize: "13.5px" }}>
                  <span>Cotisations salariales</span>
                  <span>− {euros(calcul.total_salarial)} €</span>
                </div>

                {/* 🆕 27/09 soir — les sommes hors brut, entre les cotisations
                    et le net : brut − cotisations + ces lignes = net avant impôt. */}
                {(calcul.lignes_brut || []).filter(function (l: any) { return !!l.hors_brut; })
                  .map(function (l: any, i: number) {
                  return (
                    <div key={"h" + i} style={{ display: "flex", justifyContent: "space-between",
                      padding: "4px 0", fontSize: "13.5px" }}>
                      <span>{l.libelle}</span>
                      <span>{euros(l.montant)} €</span>
                    </div>
                  );
                })}

                {/* 🚨🚨 LA REDUCTION PATRONALE N EST PLUS ICI — 16/09.
                    DEFAUT TROUVE A L ESSAI : elle etait affichee entre les
                    cotisations salariales et le net a payer, comme si elle
                    entrait dans le calcul du net. Un salarie qui soustrayait
                    les deux lignes du brut trouvait 1 360,66 EUR au lieu de
                    1 995,24. Elle appartient au bloc employeur, et a lui
                    seul : elle diminue le cout de l entreprise, jamais le
                    net du salarie. */}

                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "12px 0", marginTop: "8px", fontSize: "17px",
                  fontWeight: "bold", color: OR,
                  borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <span>Net à payer</span>
                  <span>{euros(calcul.net_a_payer)} €</span>
                </div>

                {/* 🆕 27/09 — le prelevement a la source, calcule desormais. */}
                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: "13.5px", color: "rgba(255,255,255,0.72)", gap: "12px" }}>
                  <span>Prélèvement à la source, déjà déduit du net à payer
                    {calcul.prelevement_mention ? " — " + calcul.prelevement_mention : ""}</span>
                  <span>{euros(calcul.prelevement_source || 0)} €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: "13.5px", color: "rgba(255,255,255,0.72)" }}>
                  <span>Net à payer avant impôt</span>
                  <span>{euros(calcul.net_avant_impot)} €</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: "13.5px", color: "rgba(255,255,255,0.72)" }}>
                  <span>Montant net social</span>
                  <span>{euros(calcul.net_social)} €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: "13.5px", color: "rgba(255,255,255,0.72)" }}>
                  <span>Net imposable</span>
                  <span>{euros(calcul.net_imposable)} €</span>
                </div>

                {/* ---- CE QUE PAIE L EMPLOYEUR, A PART ---- */}
                <div style={{ marginTop: "16px", paddingTop: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <p style={{ fontSize: "13.5px", color: OR, margin: "0 0 6px" }}>
                    Côté employeur
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    padding: "3px 0", fontSize: "14px" }}>
                    <span>Cotisations patronales</span>
                    <span>{euros(calcul.total_patronal)} €</span>
                  </div>
                  {calcul.rgdu > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between",
                      padding: "3px 0", fontSize: "14px", color: VERT }}>
                      <span>Réduction générale dégressive unique
                        {calcul.rgdu_detail && calcul.rgdu_detail.coefficient ? (
                          <span style={{ color: "rgba(255,255,255,0.72)",
                            marginLeft: "8px", fontSize: "12.5px" }}>
                            coef. {calcul.rgdu_detail.coefficient}
                          </span>
                        ) : null}
                      </span>
                      <span>− {euros(calcul.rgdu)} €</span>
                    </div>
                  )}
                  {/* 🆕 27/09 — la deduction forfaitaire sur heures supplementaires. */}
                  {calcul.deduction_hs > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between",
                      padding: "3px 0", fontSize: "14px", color: VERT }}>
                      <span>Déduction forfaitaire sur heures supplémentaires</span>
                      <span>− {euros(calcul.deduction_hs)} €</span>
                    </div>
                  )}
                  {/* 🆕 27/09 soir — ce que l employeur paie hors brut (indemnite
                      de rupture non soumise, panier, transport) : le cout total
                      le compte, la ligne le montre. */}
                  {calcul.non_soumis_employeur > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between",
                      padding: "3px 0", fontSize: "14px" }}>
                      <span>Indemnités et frais non soumis versés</span>
                      <span>{euros(calcul.non_soumis_employeur)} €</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between",
                    padding: "6px 0 0", fontSize: "14px", fontWeight: "bold",
                    borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "6px" }}>
                    <span>Coût total employeur</span>
                    <span>{euros(calcul.cout_employeur)} €</span>
                  </div>
                </div>

                {/* 🚨 LES RESERVES S AFFICHENT. Un calcul qui tait ce qu il ne
                    fait pas est plus dangereux qu un calcul absent. */}
                {(calcul.reserves || []).length > 0 && (
                  <div style={{ marginTop: "16px", paddingTop: "12px",
                    borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: "13.5px", color: OR, margin: "0 0 6px" }}>
                      Ce que ce calcul ne fait pas encore
                    </p>
                    {calcul.reserves.map(function (r: string, i: number) {
                      return (
                        <p key={i} style={{ fontSize: "12.5px", lineHeight: "1.6",
                          color: "rgba(255,255,255,0.72)", margin: "0 0 3px" }}>
                          {r}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                ══ LES CONGES PAYES ══
                🚨 LE COMPTEUR NE SAVAIT QU ACQUERIR. Un salarie qui pose
                une semaine n avait aucun endroit ou etre saisi : le solde
                montait indefiniment et le bulletin annoncait des droits
                deja consommes.
                ⚠️ LA VALORISATION EST AFFICHEE EN ENTIER — maintien,
                dixieme, et celle qui est retenue. La loi impose de retenir
                la plus favorable (art. L3141-24) ; montrer les deux permet
                au cabinet de le verifier plutot que de nous croire.
                ═══════════════════════════════════════════════════════ */}
            {choisi && (choisi.type_contrat === "cdi"
              || choisi.type_contrat === "apprentissage" || choisi.type_contrat === "professionnalisation") && conges && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                  Congés payés
                </h3>

                {conges.solde ? (
                  <p style={{ fontSize: "14px", marginTop: 0 }}>
                    Période ouverte le {String(conges.solde.periode_ref).slice(8, 10)
                      + "/" + String(conges.solde.periode_ref).slice(5, 7)
                      + "/" + String(conges.solde.periode_ref).slice(0, 4)}
                    {" — "}
                    <strong>{Number(conges.solde.acquis).toFixed(2)}</strong> acquis,{" "}
                    <strong>{Number(conges.solde.pris).toFixed(2)}</strong> pris,{" "}
                    solde <strong style={{ color: OR }}>
                      {Number(conges.solde.solde).toFixed(2)}
                    </strong> jour(s) ouvrable(s).
                  </p>
                ) : (
                  <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.76)",
                    marginTop: 0 }}>
                    Aucun droit acquis pour l&apos;instant. Les congés s&apos;acquièrent
                    à l&apos;émission de chaque bulletin, à raison de 2,5 jours
                    ouvrables par mois.
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end",
                  flexWrap: "wrap", marginTop: "12px" }}>
                  <div>
                    {/* ⚠️ LE MOIS S AFFICHE EN CLAIR : « 2026-09-01 » est un
                        format de base de donnees, pas une date qu on lit. */}
                    <span style={LIB}>Jours pris en {String(periode).slice(0, 7)}</span>
                    <input value={joursPris}
                      onChange={(e: any) => setJoursPris(e.target.value)}
                      placeholder="ex. 5" style={{ ...CHAMP, width: "120px" }} />
                  </div>
                  <button onClick={poserConges} disabled={occupe !== ""}
                    style={{ ...SECOND, ...cache(droitsIci.preparer) }}>
                    {occupe === "conges" ? "…" : "Poser ces congés"}
                  </button>
                </div>

                {conges.mouvements && conges.mouvements.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    {conges.mouvements.map(function (m: any) {
                      const prise = m.type_mouvement === "prise";
                      return (
                        <div key={m.id} style={{ display: "flex",
                          justifyContent: "space-between", padding: "7px 0",
                          borderTop: "1px solid rgba(255,255,255,0.07)",
                          fontSize: "14px" }}>
                          <span>
                            <span style={{ color: prise ? ROUGE : VERT }}>
                              {prise ? "−" : "+"}{Number(m.jours).toFixed(2)} j
                            </span>
                            <span style={{ marginLeft: "10px",
                              color: "rgba(255,255,255,0.76)" }}>
                              {String(m.periode).slice(0, 7)}
                              {" · "}{prise ? "prise" : "acquisition"}
                            </span>
                            {/* 🆕 22/09 — D OU VIENNENT CES JOURS.
                                Une acquisition d anciennete ne se distingue
                                pas d une acquisition mensuelle par son seul
                                montant : un cabinet qui justifie un solde
                                doit voir la difference sans ouvrir la base. */}
                            {!prise
                              && String(m.notes || "").indexOf("anciennete") >= 0 && (
                              <span style={{ marginLeft: "10px", fontSize: "13.5px",
                                color: OR }}>
                                ancienneté (Syntec art. 5.1)
                              </span>
                            )}
                            {/* ⚠️ LES DEUX METHODES SONT MONTREES, pas
                                seulement le resultat : c est ce qui permet
                                de justifier le montant devant un controle. */}
                            {prise && m.valeur_retenue != null && (
                              <span style={{ marginLeft: "10px", fontSize: "13.5px",
                                color: "rgba(255,255,255,0.72)" }}>
                                maintien {Number(m.valeur_maintien).toFixed(2)} €
                                {" · "}dixième {Number(m.valeur_dixieme).toFixed(2)} €
                                {" · retenu "}
                                <strong style={{ color: OR }}>
                                  {Number(m.valeur_retenue).toFixed(2)} €
                                </strong>
                              </span>
                            )}
                          </span>
                          {prise && (
                            <button onClick={() => retirerPrise(m.id)}
                              style={{ background: "none", border: "none",
                                color: ROUGE, cursor: "pointer", fontSize: "13.5px" }}>
                              retirer
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                ══ LES SIGNALEMENTS D EVENEMENT ══
                🚨 CINQ JOURS POUR LES DEUX. Un arret signale en retard,
                c est un salarie qui n est pas paye ; une fin de contrat
                en retard, c est un chomage qui ne s ouvre pas.
                ⚠️ LE MOTIF VIENT DE LA BASE, avec son code de la norme :
                une fin de CDD declaree en licenciement economique ouvre
                les mauvais droits.
                ═══════════════════════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════
                🆕 LES DOCUMENTS DE FIN DE CONTRAT
                ⚠️ LE BLOC N APPARAIT QUE SUR UN CONTRAT QUI A UNE FIN :
                sur un CDI en cours, il n y a rien a remettre.
                ═══════════════════════════════════════════════════════ */}
            {/* 🆕 28/09 — pas de certificat de travail ni de reçu pour solde
                de tout compte pour un mandataire : il n a pas de contrat de
                travail. */}
            {choisi && (choisi.rompu_le || choisi.date_fin) && choisi.type_contrat !== "mandat_social"
              && choisi.type_contrat !== "stage" && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                  Documents de fin de contrat
                </h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.76)",
                  marginTop: 0, lineHeight: "1.6" }}>
                  Certificat de travail et reçu pour solde de tout compte, en un
                  PDF de deux pages. Le reçu inventorie les sommes versées :
                  émettre le dernier bulletin AVANT de le produire, car une
                  somme qui n&apos;y figure pas n&apos;est pas couverte par
                  l&apos;effet libératoire de six mois.
                </p>

                <button onClick={documentsFinContrat} disabled={occupe !== ""}
                  style={{ ...BOUTON, marginTop: "4px", ...cache(droitsIci.emettre) }}>
                  {occupe === "findoc" ? "…" : "Produire les documents"}
                </button>

                {finDoc && (
                  <div style={{ marginTop: "14px" }}>
                    <p style={{ fontSize: "14px",
                      color: "rgba(255,255,255,0.76)", margin: "0 0 10px" }}>
                      {finDoc.salarie} · du {jma(finDoc.date_entree)} au{" "}
                      {jma(finDoc.date_sortie)} · inventaire du bulletin{" "}
                      {finDoc.bulletin_inventorie}
                    </p>

                    {(finDoc.postes || []).map((p: any, i: number) => (
                      <div key={i} style={{ display: "flex",
                        justifyContent: "space-between", padding: "5px 0",
                        fontSize: "14px" }}>
                        <span>{p.libelle}</span>
                        <span>{euros(p.montant)}</span>
                      </div>
                    ))}
                    {(finDoc.pour_memoire || []).map((p: any, i: number) => (
                      <div key={"m" + i} style={{ display: "flex",
                        justifyContent: "space-between", padding: "4px 0",
                        fontSize: "13.5px", color: "rgba(255,255,255,0.72)" }}>
                        <span>{p.libelle}</span>
                        <span>{euros(p.montant)}</span>
                      </div>
                    ))}

                    <div style={{ display: "flex",
                      justifyContent: "space-between", padding: "8px 0",
                      borderTop: "1px solid rgba(255,255,255,0.12)",
                      marginTop: "6px", fontSize: "15px", color: OR }}>
                      <span>Total net versé</span>
                      <span>{euros(finDoc.total)}</span>
                    </div>

                    {/* 🚨 LA DATE AU-DELA DE LAQUELLE LE REÇU LIBERE : elle
                        ne court qu a compter de la SIGNATURE du salarie. */}
                    <p style={{ fontSize: "13.5px",
                      color: "rgba(255,255,255,0.72)", marginTop: "8px",
                      lineHeight: "1.6" }}>
                      Libératoire six mois après la signature du salarié, soit
                      vers le {jma(finDoc.liberatoire_le)} si elle intervient le
                      jour de la sortie.
                    </p>

                    {finDoc.url && (
                      <p style={{ marginTop: "10px" }}>
                        <a href={finDoc.url} target="_blank" rel="noreferrer"
                          style={{ ...LIEN, color: VERT, fontSize: "14px" }}>
                          ouvrir le PDF
                        </a>
                      </p>
                    )}

                    {(finDoc.anomalies || []).map((a: string, i: number) => (
                      <p key={"a" + i} style={{ fontSize: "13.5px",
                        color: "rgba(255,255,255,0.72)", margin: "6px 0",
                        lineHeight: "1.6" }}>{a}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                🆕 LA PRIME DE VACANCES — AU NIVEAU DE LA SOCIETE
                ⚠️ Elle ne depend pas du contrat ouvert : elle est affichee
                depuis cette fiche parce que c est de la qu on travaille,
                mais le montant porte sur TOUS les salaries de la societe.
                ═══════════════════════════════════════════════════════ */}
            {choisi && Number(choisi.idcc) === 1486 && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                  Prime de vacances (convention Syntec, article 31)
                </h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.76)",
                  marginTop: 0, lineHeight: "1.6" }}>
                  Obligation de l&apos;entreprise, pas du bulletin : au moins
                  10 % de la masse des indemnités de congés payés de
                  l&apos;ensemble des salariés, dont une partie versée entre le
                  1er mai et le 31 octobre. La répartition entre les salariés
                  est libre.
                </p>

                <button onClick={chargerPrime} disabled={occupe !== ""}
                  style={{ ...BOUTON, marginTop: "4px" }}>
                  {occupe === "prime" ? "…" : "Calculer l'obligation"}
                </button>

                {prime && (
                  <div style={{ marginTop: "14px" }}>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.76)",
                      margin: "0 0 10px" }}>
                      Exercice {prime.exercice ? prime.exercice.libelle : ""}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between",
                      padding: "6px 0", fontSize: "14px" }}>
                      <span>Congés pris ({prime.jours_pris} j)</span>
                      <span>{euros(prime.masse_conges_pris)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      padding: "6px 0", fontSize: "14px" }}>
                      <span>Indemnités compensatrices</span>
                      <span>{euros(prime.masse_indemnites_compensatrices)}</span>
                    </div>

                    {/* 🚨 LES DEUX ASSIETTES COTE A COTE : la jurisprudence
                        n est pas unanime, et l ecart se voit. */}
                    <div style={{ display: "flex", justifyContent: "space-between",
                      padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.12)",
                      marginTop: "6px", fontSize: "15px", color: OR }}>
                      <span>Obligation, assiette large (Cass. 2023)</span>
                      <span>{euros(prime.obligation_10_pct)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      padding: "6px 0", fontSize: "14px",
                      color: "rgba(255,255,255,0.82)" }}>
                      <span>Obligation, hors compensatrices</span>
                      <span>{euros(prime.obligation_hors_compensatrices)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between",
                      padding: "6px 0", fontSize: "14px" }}>
                      <span>Déjà versé entre mai et octobre</span>
                      <span>{euros(prime.verse_entre_mai_et_octobre)}</span>
                    </div>

                    <p style={{ fontSize: "14px", marginTop: "12px",
                      color: prime.reste_a_verser > 0 ? ROUGE : VERT,
                      lineHeight: "1.6" }}>
                      {prime.verdict}
                    </p>

                    {(prime.reserves || []).map((r: string, i: number) => (
                      <p key={i} style={{ fontSize: "13.5px",
                        color: "rgba(255,255,255,0.72)", margin: "6px 0",
                        lineHeight: "1.6" }}>{r}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {choisi && evenements && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                  Signalements d&apos;événement
                </h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.76)",
                  marginTop: 0 }}>
                  Arrêt de travail et fin de contrat se déposent dans les
                  cinq jours. Le premier déclenche les indemnités
                  journalières, le second remplace l&apos;attestation employeur.
                </p>

                {/* 🆕 LE FORMULAIRE PORTE SON NOM. Pose sans titre au-dessus
                    de la liste, il semblait piloter les lignes du dessous :
                    Jacques a cru qu une case decochee ici changeait un arret
                    deja enregistre. */}
                {/* 🆕 LE TITRE DIT CE QUE FAIT LE FORMULAIRE. En modification,
                    il change de couleur et de mot : c est le seul endroit ou
                    l on peut voir, d un coup d oeil, qu on corrige une ligne
                    existante au lieu d en creer une. */}
                <p id="nouveau-signalement"
                  style={{ fontSize: "14px", color: modifie ? VERT : OR,
                    margin: "16px 0 0", fontWeight: "bold" }}>
                  {modifie
                    ? "Modification du signalement « "
                      + (modifie.type_evenement === "arret" ? "Arrêt" : "Fin de contrat")
                      + " " + jma(modifie.type_evenement === "arret"
                        ? modifie.date_debut : (modifie.date_fin || modifie.date_debut))
                      + " »"
                    : "Nouveau signalement"}
                </p>
                {modifie && (
                  <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.72)",
                    margin: "4px 0 0", lineHeight: "1.6" }}>
                    Les champs sont remplis avec ce qui a été enregistré.
                    Corrigez ce qu&apos;il faut, puis validez : l&apos;ancien
                    signalement sera retiré et remplacé par celui-ci.
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap",
                  alignItems: "flex-end", marginTop: "10px" }}>
                  <div>
                    <span style={LIB}>Nature</span>
                    <select value={ev.type_evenement} style={CHAMP}
                      onChange={(x: any) => setEv(Object.assign({}, ev, {
                        type_evenement: x.target.value, motif: "" }))}>
                      <option value="arret">Arrêt de travail</option>
                      <option value="fin_contrat">Fin de contrat</option>
                    </select>
                  </div>

                  <div>
                    <span style={LIB}>Motif</span>
                    <select value={ev.motif} style={CHAMP}
                      onChange={(x: any) => setEv(Object.assign({}, ev,
                        { motif: x.target.value }))}>
                      <option value="">— choisir —</option>
                      {(ev.type_evenement === "arret"
                        ? evenements.motifs_arret
                        : evenements.motifs_fin || []).map(function (m: any) {
                        return (
                          <option key={m.code} value={m.correspondance}>
                            {m.libelle}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <span style={LIB}>
                      {ev.type_evenement === "arret"
                        ? "Début de l'arrêt" : "Date de fin"}
                    </span>
                    <input type="date" className="mc-date" value={ev.date_debut} style={CHAMP}
                      onChange={(x: any) => setEv(Object.assign({}, ev,
                        { date_debut: x.target.value }))} />
                  </div>

                  {ev.type_evenement === "arret" && (
                    <div>
                      {/* ⚠️ CE N EST PAS TOUJOURS LA VEILLE DE L ARRET : le
                          salarie peut avoir travaille le matin. C est ce
                          jour qui fixe le depart du delai de carence. */}
                      <span style={LIB}>Dernier jour travaillé</span>
                      <input type="date" className="mc-date" value={ev.dernier_jour_travaille}
                        style={CHAMP}
                        onChange={(x: any) => setEv(Object.assign({}, ev,
                          { dernier_jour_travaille: x.target.value }))} />
                    </div>
                  )}

                  {ev.type_evenement === "arret" && (
                    <div>
                      {/* 🆕🚨 OBLIGATOIRE — dsn-val, 17/09 : « absence de la
                          rubrique S21.G00.60.003 ». C est la date que porte
                          l avis d arret du medecin. ELLE NE SE DEVINE PAS :
                          on ne prolonge ni ne raccourcit un arret a sa
                          place. */}
                      <span style={LIB}>Fin prévisionnelle (obligatoire)</span>
                      <input type="date" className="mc-date" value={ev.date_fin} style={CHAMP}
                        onChange={(x: any) => setEv(Object.assign({}, ev,
                          { date_fin: x.target.value }))} />
                    </div>
                  )}

                  {ev.type_evenement === "fin_contrat" && (
                    <div>
                      <span style={LIB}>Date de notification</span>
                      <input type="date" className="mc-date" value={ev.date_notification}
                        style={CHAMP}
                        onChange={(x: any) => setEv(Object.assign({}, ev,
                          { date_notification: x.target.value }))} />
                    </div>
                  )}
                </div>

                {/* 🚨 LA SUBROGATION DECIDE QUI TOUCHE LES INDEMNITES.
                    Quand l employeur maintient le salaire, il les percoit
                    a la place du salarie — et doit donner son IBAN. */}
                {ev.type_evenement === "arret" && (
                  <div style={{ marginTop: "12px", display: "flex",
                    gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <label style={{ fontSize: "14px", display: "flex",
                      alignItems: "center", gap: "7px", cursor: "pointer" }}>
                      <input type="checkbox" checked={ev.subrogation}
                        onChange={(x: any) => setEv(Object.assign({}, ev,
                          { subrogation: x.target.checked }))} />
                      L&apos;employeur maintient le salaire (subrogation)
                    </label>
                    {ev.subrogation && (
                      <>
                        {/* 🆕🚨 EN SUBROGATION, TROIS DONNEES VONT ENSEMBLE —
                            dsn-val, controle CCH-11 : l IBAN, le BIC et la
                            date de fin. Les deux premieres sont sur le meme
                            releve d identite bancaire. */}
                        <div>
                          <span style={LIB}>IBAN de l&apos;employeur (obligatoire)</span>
                          <input value={ev.iban}
                            placeholder="FR76 …"
                            style={{ ...CHAMP, minWidth: "240px" }}
                            onChange={(x: any) => setEv(Object.assign({}, ev,
                              { iban: x.target.value }))} />
                        </div>
                        <div>
                          <span style={LIB}>BIC (obligatoire)</span>
                          <input value={ev.bic} style={CHAMP}
                            onChange={(x: any) => setEv(Object.assign({}, ev,
                              { bic: x.target.value }))} />
                        </div>
                        <div>
                          {/* ⚠️ CE N EST PAS LA FIN DE L ARRET : c est la fin
                              de la periode pendant laquelle l employeur
                              MAINTIENT LE SALAIRE, que fixe la convention
                              collective — souvent moins longtemps que
                              l arret. Passee cette date, la CPAM verse au
                              salarie.
                              ⛔ ON NE LA PRE-REMPLIT PAS avec la fin de
                              l arret : declarer une subrogation trop
                              longue, c est percevoir des indemnites qui
                              reviennent au salarie. */}
                          <span style={LIB}>Fin de subrogation (obligatoire)</span>
                          <input type="date" className="mc-date" value={ev.subro_fin} style={CHAMP}
                            onChange={(x: any) => setEv(Object.assign({}, ev,
                              { subro_fin: x.target.value }))} />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {ev.type_evenement === "arret" && ev.subrogation && (
                  <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.72)",
                    margin: "8px 0 0", lineHeight: "1.6" }}>
                    La fin de subrogation est la fin du maintien de salaire prévu
                    par la convention collective, pas forcément celle de
                    l&apos;arrêt. Passé cette date, la CPAM verse les indemnités
                    au salarié.
                  </p>
                )}

                {/* ═══════════════════════════════════════════════════════
                    🆕 20/09 — LA REPRISE ANTICIPEE

                    Elle se saisit SUR L ARRET : une reprise n existe pas
                    sans lui, et la rattacher evite de recopier le salarie,
                    le contrat et les dates dans un second evenement.
                    ⚠️ FACULTATIVE : la plupart des arrets vont a leur terme,
                    et il n y a alors rien a signaler.
                    🚨 LES TROIS MOTIFS SONT CEUX QUE dsn-val A AFFICHES.
                    ═══════════════════════════════════════════════════════ */}
                {ev.type_evenement === "arret" && (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap",
                    marginTop: "12px" }}>
                    {/* ⚠️ LARGEUR BORNEE : sans `maxWidth`, le champ seul
                        s etirait sur toute la ligne tant que le motif n etait
                        pas affiche. */}
                    <div style={{ flex: "1 1 200px", maxWidth: "260px" }}>
                      <span style={LIB}>Reprise anticipée le (facultatif)</span>
                      <input type="date" className="mc-date" value={ev.reprise_date} style={CHAMP}
                        onChange={(x: any) => setEv(Object.assign({}, ev,
                          { reprise_date: x.target.value,
                            reprise_motif: x.target.value
                              ? (ev.reprise_motif || "01") : "" }))} />
                    </div>
                    {ev.reprise_date && (
                      <div style={{ flex: "2 1 260px" }}>
                        <span style={LIB}>Motif de la reprise</span>
                        <select value={ev.reprise_motif || "01"} style={CHAMP}
                          onChange={(x: any) => setEv(Object.assign({}, ev,
                            { reprise_motif: x.target.value }))}>
                          <option value="01">Reprise normale</option>
                          <option value="02">Reprise à temps partiel thérapeutique</option>
                          <option value="03">Reprise à temps partiel pour raison personnelle</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
                {/* ⚠️ L EXPLICATION NE S AFFICHE QU UNE FOIS LA DATE SAISIE :
                    sur un formulaire vide, elle encombrait sans rien apprendre
                    — la plupart des arrets vont a leur terme. */}
                {ev.type_evenement === "arret" && ev.reprise_date && (
                  <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.72)",
                    margin: "8px 0 0", lineHeight: "1.6" }}>
                    La reprise se signale à part, par « générer la reprise »,
                    et seulement parce qu&apos;elle est ANTICIPÉE. Un arrêt qui
                    va à son terme ne se signale pas.
                  </p>
                )}

                {/* 🆕🚨 LE MESSAGE EST ICI, AU-DESSUS DU BOUTON — 18/09.
                    Il partait dans le bandeau du haut de la page : on touchait
                    « Enregistrer », rien ne bougeait sous les yeux, et il
                    fallait remonter toute la fiche pour lire le refus. */}
                {errEv && (
                  <p style={{ color: ROUGE, fontSize: "14px", lineHeight: "1.6",
                    margin: "14px 0 0", padding: "10px 12px",
                    border: "1px solid rgba(229,115,115,0.4)", borderRadius: "8px",
                    background: "rgba(229,115,115,0.07)" }}>
                    {lisible(errEv)}
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", alignItems: "center",
                  flexWrap: "wrap", marginTop: "12px" }}>
                  <button onClick={ajouterEvenement} disabled={occupe !== ""}
                    style={{ ...SECOND, ...cache(droitsIci.preparer) }}>
                    {occupe === "evenement" ? "…"
                      : modifie ? "Enregistrer la modification"
                      : "Enregistrer ce signalement"}
                  </button>
                  {modifie && (
                    <button onClick={annulerModification} disabled={occupe !== ""}
                      style={{ ...LIEN, color: "rgba(255,255,255,0.76)" }}>
                      annuler la modification
                    </button>
                  )}
                </div>

                {evenements.evenements && evenements.evenements.length > 0 && (
                  <div style={{ marginTop: "22px", paddingTop: "14px",
                    borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                    {/* 🆕 LA LISTE PORTE SON NOM ELLE AUSSI, et dit que le
                        formulaire du dessus ne la modifie pas. */}
                    <p style={{ fontSize: "14px", color: OR, margin: 0,
                      fontWeight: "bold" }}>
                      Signalements enregistrés
                    </p>
                    <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.72)",
                      margin: "4px 0 8px", lineHeight: "1.6" }}>
                      Le formulaire ci-dessus sert à en saisir un nouveau : il ne
                      modifie pas ceux de cette liste, sauf si vous touchez
                      « modifier » sur l&apos;un d&apos;eux.
                    </p>
                    {evenements.evenements.map(function (x: any) {
                      const arret = x.type_evenement === "arret";
                      const depose = x.statut === "depose";
                      // 🆕🚨 CE QUI MANQUE A UN ARRET SE VOIT SUR SA LIGNE, EN
                      // ROUGE, avant meme de le generer. Un arret saisi avant
                      // le 17/09 peut encore etre incomplet : la liste le
                      // dit, au lieu de laisser la CPAM le decouvrir.
                      const manques: string[] = [];
                      if (arret && !x.date_fin) manques.push("fin prévisionnelle");
                      if (arret && x.subrogation && !x.subro_fin) manques.push("fin de subrogation");
                      if (arret && x.subrogation && !x.iban) manques.push("IBAN");
                      if (arret && x.subrogation && !x.bic) manques.push("BIC");
                      return (
                        <div key={x.id} style={{
                          padding: "9px 0", fontSize: "14px",
                          borderTop: "1px solid rgba(255,255,255,0.07)",
                          display: "flex", justifyContent: "space-between",
                          gap: "10px", flexWrap: "wrap" }}>
                          <span>
                            <strong style={{ color: arret ? ROUGE : OR }}>
                              {arret ? "Arrêt" : "Fin de contrat"}
                            </strong>
                            <span style={{ marginLeft: "10px" }}>
                              {arret
                                ? "du " + jma(x.date_debut)
                                  + (x.date_fin ? " au " + jma(x.date_fin) : "")
                                : "le " + jma(x.date_fin || x.date_debut)}
                            </span>
                            {/* 🆕 28/09 — l affection de longue duree : ses IJ
                                ne sont pas imposables. */}
                            {/* 🆕 28/09 — UNE VRAIE CASE, et SEULEMENT pour un arret
                                maladie (le moteur n applique l ALD qu a la maladie).
                                Le texte gris « ALD : non » ne se devinait pas. */}
                            {arret && /^(01|maladie)$/i.test(String(x.motif || "").trim()) && (
                              <label style={{ marginLeft: "10px", display: "inline-flex", gap: "6px",
                                alignItems: "center", color: x.ald ? OR : "rgba(255,255,255,0.75)" }}>
                                <input type="checkbox" checked={!!x.ald} onChange={async () => {
                                  const d = await appeler({ action: "arret_ald", evenement_id: x.id, ald: !x.ald });
                                  if (d && d.success) { setMsg(d.message || ""); setCalcul(null); if (choisi) chargerEvenements(choisi.id); }
                                  else setErr(lisible(d && d.erreur ? d.erreur : "enregistrement impossible"));
                                }} />
                                Affection de longue durée (indemnités non imposables)
                              </label>
                            )}
                            {/* 🆕 28/09 — L AVIS D ARRET : piece exigee, point rouge
                                dans « Validation du mois » tant qu il manque. */}
                            {arret && (x.preuve_chemin ? (
                              <button onClick={() => voirAvis(x.id)}
                                style={{ ...LIEN, color: VERT, marginLeft: "10px" }}>
                                avis d&apos;arrêt ✓
                              </button>
                            ) : (
                              <label style={{ ...GESTE(ORANGE), marginLeft: "10px", padding: "4px 10px",
                                fontSize: "13.5px", display: "inline-block", ...cache(droitsIci.preparer) }}>
                                {occupe === "piece" ? "…" : "joindre l'avis d'arrêt"}
                                <input type="file" accept="image/*,application/pdf"
                                  style={{ display: "none" }}
                                  onChange={(ev) => {
                                    const fi = ev.target.files && ev.target.files[0];
                                    if (fi) joindreAvis(x, fi);
                                    ev.target.value = "";
                                  }} />
                              </label>
                            ))}
                            <span style={{ marginLeft: "10px",
                              color: "rgba(255,255,255,0.76)" }}>
                              {x.motif}
                              {x.subrogation
                                ? " · subrogation"
                                  + (x.subro_fin ? " jusqu'au " + jma(x.subro_fin) : "")
                                : (arret ? " · sans subrogation" : "")}
                              {arret && x.reprise_date
                                ? " · reprise le " + jma(x.reprise_date)
                                : ""}
                              {" · "}{x.statut}
                              {/* 🚨 LE NUMERO D ORDRE SE VOIT : c est lui qui
                                  dit si le prochain fichier sera un « annule
                                  et remplace ». */}
                              {Number(x.numero_ordre || 0) > 0
                                ? " · déposé " + x.numero_ordre + " fois"
                                : ""}
                              {Number(x.numero_ordre_reprise || 0) > 0
                                ? " · reprise déposée "
                                  + x.numero_ordre_reprise + " fois"
                                : ""}
                            </span>
                            {manques.length > 0 && (
                              <span style={{ display: "block", marginTop: "3px",
                                color: ROUGE, fontSize: "13.5px" }}>
                                Il manque : {manques.join(", ")}. La CPAM rejettera
                                ce signalement — retirez-le et saisissez-le de
                                nouveau.
                              </span>
                            )}
                          </span>
                          <span style={{ display: "flex", gap: "12px",
                            alignItems: "baseline", flexWrap: "wrap" }}>
                            <button onClick={() => genererSignalement(x.id)}
                              disabled={occupe !== ""}
                              style={{ ...LIEN, color: VERT }}>
                              {occupe === "signalement" ? "…" : "générer"}
                            </button>
                            {/* 🆕 20/09 — LA REPRISE.
                                ⚠️ LE BOUTON N APPARAIT QUE SI LA REPRISE EST
                                RENSEIGNEE sur l arret : sans date, il n y a
                                rien a signaler, et un bouton qui refuse est
                                pire qu un bouton absent.
                                🚨 LA REPRISE NE SE SIGNALE QUE SI ELLE EST
                                ANTICIPEE — reprendre a la date prevue n est
                                pas un evenement. */}
                            {arret && x.reprise_date && (
                              <button onClick={() => genererSignalement(x.id, true)}
                                disabled={occupe !== ""}
                                style={{ ...LIEN, color: VERT }}>
                                {occupe === "reprise"
                                  ? "…" : "générer la reprise"}
                              </button>
                            )}
                            {/* 🆕 20/09 — « DÉPOSÉ » FAIT AVANCER LE NUMERO
                                D ORDRE. Le bouton n apparait qu une fois le
                                fichier genere : sans lui, il n y a rien a
                                transmettre. */}
                            {/* 🚨 ON NE MARQUE PAS DEPOSE CE QU ON SAIT FAUX.
                                `manques` porte les defauts visibles d un arret
                                — IBAN, BIC, fin de subrogation.
                                ⚠️ IL NE COUVRE PAS LA FIN DE CONTRAT : son
                                defaut (aucun bulletin emis pour le mois de la
                                rupture) n apparait qu a la generation. C est
                                la ROUTE qui le refuse, et c est la bonne
                                place — un controle d ecran s oublie. */}
                            {x.fichier && manques.length === 0 && (
                              <button onClick={() => deposerSignalement(x.id)}
                                disabled={occupe !== ""}
                                style={{ ...LIEN, color: OR, ...cache(droitsIci.deposer) }}>
                                {occupe === "depot" ? "…" : "déposé"}
                              </button>
                            )}
                            {arret && x.reprise_date
                              && Number(x.numero_ordre_reprise || 0) === 0
                              && Number(x.numero_ordre || 0) > 0 && (
                              <button onClick={() => deposerSignalement(x.id, true)}
                                disabled={occupe !== ""}
                                style={{ ...LIEN, color: OR, ...cache(droitsIci.deposer) }}>
                                {occupe === "depot-reprise"
                                  ? "…" : "reprise déposée"}
                              </button>
                            )}
                            {/* 🆕 LE FICHIER SORT D ICI. Les deux liens
                                n apparaissent qu une fois le signalement
                                genere : avant, il n y a rien a sortir. */}
                            {x.fichier && (
                              <button onClick={() => telechargerSignalement(x)}
                                style={{ ...LIEN, color: OR }}>
                                télécharger
                              </button>
                            )}
                            {x.fichier && partagePossible && (
                              <button onClick={() => partagerSignalement(x)}
                                style={{ ...LIEN, color: OR }}>
                                partager
                              </button>
                            )}
                            {/* 🆕 « MODIFIER » — Jacques l a cherche le 17/09.
                                ⛔ PAS SUR UN SIGNALEMENT DEPOSE : il a ete
                                transmis a l organisme, le corriger ici ne le
                                corrigerait pas la-bas. */}
                            {!depose && (
                              <button onClick={() => modifierEvenement(x)}
                                disabled={occupe !== ""}
                                style={{ ...LIEN,
                                  color: modifie && String(modifie.id) === String(x.id)
                                    ? VERT : OR }}>
                                {modifie && String(modifie.id) === String(x.id)
                                  ? "en cours de modification" : "modifier"}
                              </button>
                            )}
                            {!depose && (
                              <button onClick={() => retirerEvenement(x.id)}
                                style={{ ...LIEN, color: ROUGE }}>
                                retirer
                              </button>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---- LES BULLETINS DEJA SORTIS ---- */}
            {bulletins.length > 0 && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>Bulletins</h3>
                {bulletins.map(function (b: any) {
                  const annule = b.statut === "annule";
                  return (
                    <div key={b.id} style={{ display: "flex",
                      justifyContent: "space-between", alignItems: "center",
                      flexWrap: "wrap", gap: "8px", padding: "9px 0",
                      opacity: annule ? 0.55 : 1,
                      borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: "13.5px" }}>
                        <span style={{ textDecoration: annule ? "line-through" : "none" }}>
                          {b.numero}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.72)",
                          marginLeft: "10px", fontSize: "13.5px" }}>
                          {String(b.periode).slice(0, 7)}
                        </span>
                        <span style={{ marginLeft: "10px", fontSize: "12.5px",
                          color: b.statut === "emis" ? VERT
                            : annule ? ROUGE : OR }}>
                          {b.statut === "emis" ? "émis"
                            : annule ? "annulé et remplacé" : "brouillon"}
                        </span>
                        {b.type_bulletin === "rectificatif" && (
                          <span style={{ marginLeft: "10px", fontSize: "12.5px",
                            color: "rgba(255,255,255,0.72)" }}>
                            rectificatif{b.rectifie_numero ? " du " + b.rectifie_numero : ""}
                          </span>
                        )}
                      </span>
                      <span>
                        <span style={{ fontSize: "13.5px", marginRight: "12px" }}>
                          {euros(b.net_a_payer)} €
                        </span>
                        <button onClick={() => voir(b.id)}
                          style={{ background: "none", border: "none", color: OR,
                            cursor: "pointer", fontSize: "13.5px" }}>
                          ouvrir
                        </button>
                        {/* ⚠️ NI UN BULLETIN EMIS NI UN BULLETIN ANNULE NE
                            PEUVENT ETRE EMIS : le bouton disparait, et la
                            route refuse de son cote. */}
                        {/* 🆕 28/09 (essai C) — comme partout ailleurs, le lien
                            ne s affiche qu a qui peut emettre SANS validation :
                            un collaborateur sans carte blanche le voyait. */}
                        {b.statut === "brouillon" && droitsIci.emettre && droitsIci.carte_blanche && (
                          <button onClick={() => emettre(b)}
                            style={{ background: "none", border: "none", color: VERT,
                              cursor: "pointer", fontSize: "13.5px", marginLeft: "10px" }}>
                            émettre
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
