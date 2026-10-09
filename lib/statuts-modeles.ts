// ══════════════════════════════════════════════════════════════════════════
// LA CREATION DE SOCIETE — LES MODELES — 09/10/2026 (Mr Comptable, lot A).
//
// CE FICHIER NE LIT NI N ECRIT RIEN EN BASE. Il porte, en un seul endroit :
//   1. les cinq formes du premier lot (EURL, SARL, SASU, SAS, SCI) ;
//   2. le questionnaire, etape par etape, que l ecran affiche tel quel ;
//   3. les controles de chaque etape et les cas qui sortent du cadre ;
//   4. la lettre de depart (engagements, etapes, procuration) ;
//   5. les modeles de statuts, a clauses fixes ;
//   6. le recapitulatif reproduit a la suite des statuts signes.
//
// 🚨 LA REGLE DE JACQUES (09/10) : « SANS AUCUNE INTERPRETATION ».
// Le client fournit les informations et fait chaque choix DANS UNE LISTE.
// Le programme remplit des blancs dans des clauses ECRITES D AVANCE. Il ne
// redige rien sur mesure, ne recommande rien, ne coche rien a la place du
// client. Les textes d aide sont GENERAUX : jamais « dans votre cas ».
// ⛔ Aucun des mots « conseil », « juriste », « avocat », « nous redigeons »
// pour designer le service devant un client : on ecrit « modele », « outil ».
//
// 🚨 CES MODELES SONT A FAIRE RELIRE UNE FOIS PAR UN PROFESSIONNEL avant
// l ouverture du service (decide le 09/10). Toute retouche d une clause se
// fait ICI, et nulle part ailleurs.
//
// ⚠️ HORS CADRE (le parcours s arrete et renvoie vers un professionnel) :
// un associe qui n est pas une personne physique majeure, un apport autre
// qu en argent, une activite reglementee, un conjoint qui demande a etre
// associe. Laisses dehors : micro-entreprise, SA, SNC, professions
// reglementees.
//
// ⚠️ LES POLICES DU DOCUMENT SIGNE ne connaissent que les caracteres latins
// courants (voir document-a-signer) : pas de symbole exotique dans les
// clauses.
// ══════════════════════════════════════════════════════════════════════════

export type Reponses = Record<string, any>;

type Forme = {
  code: string;
  nom: string;
  enToutesLettres: string;
  famille: "sarl" | "sas" | "sci";
  unique: boolean;
  titres: string;
  titre: string;
  associesMin: number;
  associesMax: number;
  dirigeant: string;
  dirigeantsMax: number;
  liberations: string[];
  explication: string;
};

export const FORMES: Record<string, Forme> = {
  EURL: {
    code: "EURL", nom: "EURL", enToutesLettres: "société à responsabilité limitée à associé unique",
    famille: "sarl", unique: true, titres: "parts sociales", titre: "part sociale",
    associesMin: 1, associesMax: 1, dirigeant: "gérant", dirigeantsMax: 2,
    liberations: ["totalite", "moitie", "cinquieme"],
    explication: "Une société à responsabilité limitée qui n'a qu'un seul associé. Elle est dirigée par un ou plusieurs gérants.",
  },
  SARL: {
    code: "SARL", nom: "SARL", enToutesLettres: "société à responsabilité limitée",
    famille: "sarl", unique: false, titres: "parts sociales", titre: "part sociale",
    associesMin: 2, associesMax: 100, dirigeant: "gérant", dirigeantsMax: 2,
    liberations: ["totalite", "moitie", "cinquieme"],
    explication: "Une société à responsabilité limitée de 2 à 100 associés. Elle est dirigée par un ou plusieurs gérants.",
  },
  SASU: {
    code: "SASU", nom: "SASU", enToutesLettres: "société par actions simplifiée unipersonnelle",
    famille: "sas", unique: true, titres: "actions", titre: "action",
    associesMin: 1, associesMax: 1, dirigeant: "président", dirigeantsMax: 1,
    liberations: ["totalite", "moitie"],
    explication: "Une société par actions simplifiée qui n'a qu'un seul associé. Elle est représentée par un président.",
  },
  SAS: {
    code: "SAS", nom: "SAS", enToutesLettres: "société par actions simplifiée",
    famille: "sas", unique: false, titres: "actions", titre: "action",
    associesMin: 2, associesMax: 50, dirigeant: "président", dirigeantsMax: 1,
    liberations: ["totalite", "moitie"],
    explication: "Une société par actions simplifiée à partir de 2 associés. Elle est représentée par un président.",
  },
  SCI: {
    code: "SCI", nom: "SCI", enToutesLettres: "société civile immobilière",
    famille: "sci", unique: false, titres: "parts sociales", titre: "part sociale",
    associesMin: 2, associesMax: 50, dirigeant: "gérant", dirigeantsMax: 2,
    liberations: ["totalite", "sur_appel"],
    explication: "Une société civile qui détient et gère des biens immobiliers, à partir de 2 associés. Elle est dirigée par un ou plusieurs gérants.",
  },
};

// Les etapes du dossier. Celles du lot A s arretent aux statuts signes ; les
// suivantes sont annoncees dans la lettre de depart et s ouvriront ensuite.
export const ETAPES = [
  { code: "lettre", nom: "Lettre de départ", detail: "Vos engagements, les étapes et la procuration, signés avant tout", lot: "A" },
  { code: "societe", nom: "La société", detail: "Forme, nom, objet, siège, durée, exercice", lot: "A" },
  { code: "capital", nom: "Le capital", detail: "Montant, valeur d'un titre, libération", lot: "A" },
  { code: "associes", nom: "Les associés", detail: "Identité et apport de chacun", lot: "A" },
  { code: "direction", nom: "La direction", detail: "Qui dirige, pour combien de temps", lot: "A" },
  { code: "clauses", nom: "Les clauses", detail: "Les choix laissés aux associés", lot: "A" },
  { code: "statuts", nom: "Les statuts", detail: "Relecture et signature", lot: "A" },
  { code: "depot_capital", nom: "Dépôt du capital", detail: "Versement à votre banque, attestation à joindre", lot: "C" },
  { code: "annonce", nom: "Annonce légale", detail: "Publication de l'avis de constitution", lot: "C" },
  { code: "envoi", nom: "Envoi au guichet unique", detail: "Dépôt de la demande d'immatriculation", lot: "C" },
  { code: "immatriculation", nom: "Immatriculation", detail: "La société existe ; son dossier s'ouvre dans Mr Comptable", lot: "C" },
];

export const ORDRE_SECTIONS = ["societe", "capital", "associes", "direction", "clauses"];

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const OUI_NON: [string, string][] = [["oui", "Oui"], ["non", "Non"]];
const SARL_EURL = ["SARL", "EURL"];
const SAS_SASU = ["SAS", "SASU"];
const PLURI = ["SARL", "SAS", "SCI"];

// ──────────────────────────────────────────────────────────────────────────
// LE QUESTIONNAIRE. Une condition `si` est une liste de [chemin, valeurs] :
// toutes doivent etre vraies. Un chemin sans point se lit dans la meme
// ligne (ou la meme etape) ; « societe.forme » se lit dans une autre etape.
// L ecran applique la meme regle : elle est reprise mot pour mot la-bas.
// ⛔ AUCUNE VALEUR PAR DEFAUT : une liste s ouvre sur « — choisir — ».
// ──────────────────────────────────────────────────────────────────────────
const IDENTITE = [
  { code: "civilite", libelle: "Civilité", type: "liste", options: [["M", "Monsieur"], ["Mme", "Madame"]] },
  { code: "prenom", libelle: "Prénoms", type: "texte", exemple: "ex. : Claire, Marie" },
  { code: "nom", libelle: "Nom", type: "texte", exemple: "ex. : DURAND" },
  { code: "naissance_date", libelle: "Date de naissance", type: "date" },
  { code: "naissance_lieu", libelle: "Lieu de naissance (commune et département ou pays)", type: "texte", exemple: "ex. : Lyon (Rhône)" },
  { code: "nationalite", libelle: "Nationalité", type: "texte", exemple: "ex. : française" },
  { code: "adresse", libelle: "Adresse (numéro et rue)", type: "texte", exemple: "ex. : 8 rue des Tilleuls" },
  { code: "cp", libelle: "Code postal", type: "texte", exemple: "ex. : 69003" },
  { code: "ville", libelle: "Ville", type: "texte", exemple: "ex. : Lyon" },
];

export const SECTIONS: any[] = [
  {
    code: "societe", titre: "La société",
    intro: "Ces réponses s'inscrivent telles quelles dans les statuts. L'outil ne les interprète pas et ne les complète pas.",
    questions: [
      { code: "forme", libelle: "Forme de la société", type: "liste",
        options: Object.keys(FORMES).map(function (k) { return [k, FORMES[k].nom + " — " + FORMES[k].enToutesLettres]; }),
        aide: Object.keys(FORMES).map(function (k) { return FORMES[k].nom + " : " + FORMES[k].explication; }).join(" ") },
      { code: "denomination", libelle: "Nom de la société (dénomination sociale)", type: "texte", exemple: "ex. : ATELIER HORIZON",
        aide: "Le nom sous lequel la société sera immatriculée. La forme de la société (SARL, SAS…) n'en fait pas partie : elle est ajoutée par les statuts." },
      { code: "sigle", libelle: "Sigle (facultatif)", type: "texte", facultatif: true },
      { code: "activite_reglementee", libelle: "L'activité est-elle réglementée (diplôme, autorisation, carte professionnelle ou inscription à un ordre) ?", type: "liste", options: OUI_NON,
        aide: "Certaines activités ne peuvent s'exercer qu'avec un diplôme, une autorisation ou une inscription. Ces sociétés ne sont pas couvertes par cet outil." },
      { code: "objet_modele", libelle: "Objet de la société", type: "liste", si: [["forme", ["SCI"]]],
        options: [["immobilier", "Le texte du modèle : acquérir, détenir, administrer et louer des biens immobiliers"], ["libre", "Un texte que vous écrivez vous-même"]],
        aide: "L'objet décrit ce que la société a le droit de faire. Une société civile immobilière ne peut pas avoir une activité commerciale." },
      { code: "objet", libelle: "Objet de la société, dans vos mots", type: "zone", si: [["forme", ["EURL", "SARL", "SASU", "SAS"]]], exemple: "ex. : la fabrication et la vente de mobilier sur mesure",
        aide: "L'objet décrit l'activité de la société. Votre texte est repris mot pour mot dans les statuts." },
      { code: "objet", libelle: "Objet de la société, dans vos mots", type: "zone", si: [["forme", ["SCI"]], ["objet_modele", ["libre"]]],
        aide: "Votre texte est repris mot pour mot dans les statuts." },
      { code: "siege_adresse", libelle: "Siège social : adresse (numéro et rue)", type: "texte", exemple: "ex. : 25 cours Lafayette" },
      { code: "siege_cp", libelle: "Siège social : code postal", type: "texte", exemple: "ex. : 69003" },
      { code: "siege_ville", libelle: "Siège social : ville", type: "texte", exemple: "ex. : Lyon" },
      { code: "duree", libelle: "Durée de la société, en années (99 au plus)", type: "nombre", exemple: "ex. : 99",
        aide: "La durée court à compter de l'immatriculation. La loi la limite à 99 ans ; elle peut être prorogée." },
      { code: "cloture_mois", libelle: "Mois de clôture de l'exercice", type: "liste",
        options: MOIS.map(function (m, i) { return [String(i + 1), m]; }),
        aide: "L'exercice dure douze mois et se termine le dernier jour du mois choisi." },
      { code: "premier_exercice_fin", libelle: "Date de clôture du premier exercice", type: "date",
        aide: "Le premier exercice commence à l'immatriculation. Il se termine le dernier jour du mois de clôture, de cette année ou de la suivante." },
    ],
  },
  {
    code: "capital", titre: "Le capital",
    intro: "Le capital est la somme des apports des associés. Cet outil ne couvre que les apports en argent.",
    questions: [
      { code: "apports_argent", libelle: "Tous les apports sont-ils faits en argent ?", type: "liste", options: OUI_NON,
        aide: "Un apport peut aussi être un bien (apport en nature) ou un travail (apport en industrie). Ces apports demandent des formalités que cet outil ne couvre pas." },
      { code: "montant", libelle: "Montant du capital, en euros", type: "nombre", exemple: "ex. : 1000" },
      { code: "nominal", libelle: "Valeur d'un titre (part sociale ou action), en euros", type: "nombre", exemple: "ex. : 10",
        aide: "Le capital est divisé en titres de même valeur. Le montant du capital et l'apport de chaque associé doivent être des multiples de cette valeur." },
      { code: "liberation", libelle: "Part du capital versée à la constitution", type: "liste", si: [["societe.forme", SARL_EURL]],
        options: [["totalite", "La totalité"], ["moitie", "La moitié"], ["cinquieme", "Un cinquième"]],
        aide: "Dans une société à responsabilité limitée, la loi demande qu'un cinquième au moins des apports en argent soit versé à la constitution ; le reste est versé dans les cinq ans." },
      { code: "liberation", libelle: "Part du capital versée à la constitution", type: "liste", si: [["societe.forme", SAS_SASU]],
        options: [["totalite", "La totalité"], ["moitie", "La moitié"]],
        aide: "Dans une société par actions simplifiée, la loi demande que la moitié au moins des apports en argent soit versée à la constitution ; le reste est versé dans les cinq ans." },
      { code: "liberation", libelle: "Versement du capital", type: "liste", si: [["societe.forme", ["SCI"]]],
        options: [["totalite", "La totalité à la signature des statuts"], ["sur_appel", "Au fur et à mesure des demandes de la gérance"]],
        aide: "Dans une société civile, les statuts fixent librement le moment où les apports sont versés." },
      { code: "banque", libelle: "Banque où les fonds sont déposés (nom et agence)", type: "texte", si: [["societe.forme", ["EURL", "SARL", "SASU", "SAS"]]], exemple: "ex. : Banque Populaire, agence Lyon Part-Dieu",
        aide: "Les fonds sont déposés sur un compte ouvert au nom de la société en formation. La banque remet une attestation de dépôt." },
    ],
  },
  {
    code: "associes", titre: "Les associés",
    intro: "Chaque associé est décrit tel qu'il figurera en tête des statuts. La somme des apports doit être égale au capital.",
    questions: [
      { code: "personnes_physiques", libelle: "Tous les associés sont-ils des personnes physiques majeures ?", type: "liste", options: OUI_NON,
        aide: "Un associé peut aussi être une société, ou une personne mineure ou protégée. Ces cas demandent des clauses et des pièces que cet outil ne couvre pas." },
    ],
    groupe: {
      code: "liste", titre: "Associé", ajouter: "Ajouter un associé",
      questions: IDENTITE.concat([
        { code: "email", libelle: "Adresse de courriel (elle sert à la signature des statuts)", type: "courriel", exemple: "ex. : claire.durand@exemple.fr" },
        { code: "situation", libelle: "Situation de famille", type: "liste",
          options: [["celibataire", "Célibataire"], ["marie", "Marié(e)"], ["pacse", "Lié(e) par un pacte civil de solidarité"], ["divorce", "Divorcé(e)"], ["veuf", "Veuf ou veuve"]] },
        { code: "conjoint_nom", libelle: "Prénom et nom du conjoint ou du partenaire", type: "texte", si: [["situation", ["marie", "pacse"]]] },
        { code: "regime", libelle: "Régime matrimonial", type: "liste", si: [["situation", ["marie"]]],
          options: [["communaute", "Communauté de biens (régime légal, sans contrat de mariage)"], ["separation", "Séparation de biens"], ["participation", "Participation aux acquêts"], ["universelle", "Communauté universelle"]] },
        { code: "biens_communs", libelle: "L'apport est-il fait avec de l'argent commun aux deux époux ?", type: "liste", options: OUI_NON,
          si: [["situation", ["marie"]], ["regime", ["communaute", "universelle"]], ["societe.forme", ["EURL", "SARL", "SCI"]]],
          aide: "Quand un époux apporte de l'argent commun à une société dont les parts ne sont pas négociables, la loi demande que son conjoint en soit averti. Le conjoint peut demander à devenir lui-même associé pour la moitié des parts." },
        { code: "conjoint_averti_le", libelle: "Date à laquelle le conjoint a été averti de l'apport", type: "date", si: [["biens_communs", ["oui"]]] },
        { code: "conjoint_revendique", libelle: "Le conjoint demande-t-il à être associé pour la moitié des parts ?", type: "liste", options: OUI_NON, si: [["biens_communs", ["oui"]]] },
        { code: "apport", libelle: "Apport en argent, en euros", type: "nombre", exemple: "ex. : 500" },
      ] as any[]),
    },
  },
  {
    code: "direction", titre: "La direction",
    intro: "Le premier dirigeant est nommé dans les statuts. Cet outil ne couvre que les dirigeants personnes physiques.",
    questions: [
      { code: "duree_type", libelle: "Durée des fonctions", type: "liste",
        options: [["illimitee", "Sans limitation de durée"], ["limitee", "Pour une durée limitée, renouvelable"]] },
      { code: "duree_annees", libelle: "Durée des fonctions, en années", type: "nombre", si: [["duree_type", ["limitee"]]], exemple: "ex. : 3" },
      { code: "remuneration", libelle: "Rémunération du dirigeant", type: "liste",
        options: [["decision", "Elle sera fixée par une décision des associés"], ["aucune", "Les fonctions ne sont pas rémunérées, sauf décision contraire des associés"]],
        aide: "Les statuts ne fixent pas de montant. Une décision des associés peut le faire à tout moment." },
    ],
    groupe: {
      code: "liste", titre: "Dirigeant", ajouter: "Ajouter un second gérant",
      questions: ([
        { code: "qui", libelle: "Qui exerce cette fonction ?", type: "associe_ou_tiers",
          aide: "Le dirigeant peut être l'un des associés ou une autre personne." },
      ] as any[]).concat(IDENTITE.map(function (q) { return { ...q, si: [["qui", ["tiers"]]] }; })),
    },
  },
  {
    code: "clauses", titre: "Les clauses",
    intro: "La loi laisse ces points au choix des associés. Chaque explication est générale ; l'outil ne recommande aucun choix.",
    questions: [
      { code: "cession_proches", libelle: "Cession de parts entre associés, ou au conjoint, aux ascendants et aux descendants d'un associé", type: "liste", si: [["societe.forme", ["SARL"]]],
        options: [["libre", "Libre"], ["agrement", "Soumise à l'accord des associés (agrément)"]],
        aide: "Dans une société à responsabilité limitée, la cession de parts à une personne étrangère à la société demande toujours l'accord des associés. Entre associés et dans la famille proche, elle est libre, sauf si les statuts en décident autrement." },
      { code: "cession_actions", libelle: "Cession d'actions", type: "liste", si: [["societe.forme", SAS_SASU]],
        options: [["libre", "Libre"], ["agrement_tiers", "Libre entre associés ; soumise à l'accord des associés (agrément) quand l'acheteur n'est pas associé"], ["agrement_toutes", "Toujours soumise à l'accord des associés (agrément)"]],
        aide: "Dans une société par actions simplifiée, les actions se cèdent librement, sauf si les statuts soumettent la cession à l'accord des associés. Dans une société à associé unique, la clause ne joue que le jour où la société compte plusieurs associés." },
      { code: "cession_associes", libelle: "Cession de parts entre associés", type: "liste", si: [["societe.forme", ["SCI"]]],
        options: [["libre", "Libre"], ["agrement", "Soumise à l'accord des associés (agrément)"]],
        aide: "Dans une société civile, la cession de parts à une personne étrangère à la société demande l'accord des associés. Les statuts peuvent en dispenser les cessions entre associés." },
      { code: "cession_famille", libelle: "Cession de parts au conjoint, aux ascendants ou aux descendants d'un associé", type: "liste", si: [["societe.forme", ["SCI"]]],
        options: [["libre", "Libre"], ["agrement", "Soumise à l'accord des associés (agrément)"]],
        aide: "Les statuts d'une société civile peuvent laisser libres ces cessions ou les soumettre à l'accord des associés." },
      { code: "deces", libelle: "En cas de décès d'un associé", type: "liste", si: [["societe.forme", ["SARL", "SCI"]]],
        options: [["heritiers", "La société continue avec ses héritiers, sans accord à demander"], ["agrement", "Ses héritiers ne deviennent associés qu'avec l'accord des associés (agrément)"]],
        aide: "La société n'est pas dissoute par le décès d'un associé. Les statuts disent si les héritiers deviennent associés de plein droit ou s'ils doivent être acceptés ; s'ils ne le sont pas, la valeur des parts leur est payée." },
      { code: "majorite_extra", libelle: "Décisions qui modifient les statuts", type: "liste", si: [["societe.forme", ["SCI"]]],
        options: [["unanimite", "À l'unanimité des associés"], ["deux_tiers", "À la majorité des deux tiers des parts"]],
        aide: "Dans une société civile, les décisions se prennent à l'unanimité, sauf si les statuts fixent une autre majorité." },
      { code: "pouvoirs_gerant", libelle: "Achat, vente, emprunt et garanties portant sur un immeuble", type: "liste", si: [["societe.forme", ["SCI"]]],
        options: [["seul", "Le gérant les décide seul, dans la limite de l'objet de la société"], ["autorisation", "Le gérant doit y être autorisé par une décision des associés"]],
        aide: "Les statuts peuvent laisser tous les pouvoirs de gestion au gérant ou soumettre certains actes à l'autorisation des associés. Cette limite vaut entre les associés ; elle ne s'impose pas aux tiers." },
      { code: "actes_formation", libelle: "Des actes ont-ils déjà été passés pour le compte de la société en formation (bail, devis signé, ouverture de compte) ?", type: "liste", options: OUI_NON,
        aide: "Les actes passés avant l'immatriculation peuvent être repris par la société s'ils sont listés dans un état annexé aux statuts." },
      { code: "actes_liste", libelle: "Liste de ces actes, un par ligne (date, nature, montant, personne qui a signé)", type: "zone", si: [["actes_formation", ["oui"]]],
        aide: "Votre liste est annexée aux statuts, mot pour mot." },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────
// PETITS OUTILS
// ──────────────────────────────────────────────────────────────────────────
function t(v: any): string { return v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim(); }
function entier(v: any): number { const n = Number(String(v === null || v === undefined ? "" : v).replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : NaN; }
function estDate(v: any): boolean { const s = t(v); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const d = new Date(s + "T00:00:00Z"); return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; }
function majuscule(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export function dateFr(v: any): string {
  const s = t(v);
  if (!estDate(s)) return s;
  const j = Number(s.slice(8, 10));
  return (j === 1 ? "1er" : String(j)) + " " + MOIS[Number(s.slice(5, 7)) - 1] + " " + s.slice(0, 4);
}

export function euros(n: number): string {
  const v = Math.round(Number(n) * 100) / 100;
  const ent = Math.floor(v);
  const cents = Math.round((v - ent) * 100);
  const milliers = String(ent).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return milliers + (cents ? "," + (cents < 10 ? "0" : "") + cents : "") + (v < 2 ? " euro" : " euros");
}

function nombreFr(n: number): string { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

// Un nombre entier ecrit en toutes lettres (jusqu a 999 999 999).
export function enLettres(n: number): string {
  n = Math.round(n);
  if (n === 0) return "zéro";
  const U = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const D = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
  function sousCent(x: number, final: boolean): string {
    if (x < 20) return U[x];
    const d = Math.floor(x / 10), u = x % 10;
    if (d === 7 || d === 9) { const r = 10 + u; return D[d] + (d === 7 && u === 1 ? " et " : "-") + U[r]; }
    if (u === 0) return D[d] + (d === 8 && final ? "s" : "");
    if (u === 1 && d !== 8) return D[d] + " et un";
    return D[d] + "-" + U[u];
  }
  function sousMille(x: number, final: boolean): string {
    const c = Math.floor(x / 100), r = x % 100;
    let s = "";
    if (c === 1) s = "cent";
    else if (c > 1) s = U[c] + " cent" + (r === 0 && final ? "s" : "");
    if (r > 0) s = (s ? s + " " : "") + sousCent(r, final);
    return s;
  }
  const millions = Math.floor(n / 1000000), milliers = Math.floor((n % 1000000) / 1000), reste = n % 1000;
  const morceaux: string[] = [];
  if (millions > 0) morceaux.push(sousMille(millions, true) + " million" + (millions > 1 ? "s" : ""));
  if (milliers > 0) morceaux.push(milliers === 1 ? "mille" : sousMille(milliers, false) + " mille");
  if (reste > 0) morceaux.push(sousMille(reste, true));
  return morceaux.join(" ");
}

function somme(n: number): string {
  const ent = Math.floor(Math.round(n * 100) / 100);
  const cents = Math.round((n - ent) * 100);
  return euros(n) + " (" + enLettres(ent) + " euro" + (ent > 1 ? "s" : "") + (cents ? " et " + enLettres(cents) + " centime" + (cents > 1 ? "s" : "") : "") + ")";
}

// La forme choisie, ou null tant qu elle ne l est pas.
export function formeDe(r: Reponses): Forme | null {
  const code = t(r && r.societe && r.societe.forme);
  return FORMES[code] || null;
}

// Une question est-elle a poser ? Meme regle que sur l ecran.
export function visible(q: any, r: Reponses, section: string, ligne: any): boolean {
  const conditions: any[] = q.si || [];
  for (const c of conditions) {
    const chemin = String(c[0]);
    let valeur: any;
    if (chemin.indexOf(".") > 0) { const m = chemin.split("."); valeur = r && r[m[0]] ? r[m[0]][m[1]] : undefined; }
    else if (ligne) valeur = ligne[chemin];
    else valeur = r && r[section] ? r[section][chemin] : undefined;
    if ((c[1] as string[]).indexOf(t(valeur)) < 0) return false;
  }
  return true;
}

export function sectionDe(code: string): any { for (const s of SECTIONS) if (s.code === code) return s; return null; }

// ──────────────────────────────────────────────────────────────────────────
// NETTOYER CE QUE L ECRAN ENVOIE. Seules les questions posees sont gardees :
// une reponse a une question qui n est plus a poser (la forme a change, par
// exemple) disparait, pour ne jamais ressortir dans les statuts.
// ──────────────────────────────────────────────────────────────────────────
function valeurPropre(q: any, v: any, r: Reponses): any {
  if (q.type === "zone") return v === null || v === undefined ? "" : String(v).replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim().slice(0, 4000);
  if (q.type === "nombre") { const n = entier(v); return t(v) === "" || isNaN(n) ? "" : n; }
  if (q.type === "date") return estDate(v) ? t(v) : "";
  if (q.type === "courriel") return t(v).toLowerCase().slice(0, 200);
  if (q.type === "liste") { const s = t(v); return (q.options || []).some(function (o: any) { return o[0] === s; }) ? s : ""; }
  if (q.type === "associe_ou_tiers") {
    const s = t(v);
    if (s === "tiers") return s;
    const m = /^a(\d+)$/.exec(s);
    const liste = (r.associes && r.associes.liste) || [];
    return m && Number(m[1]) < liste.length ? s : "";
  }
  return t(v).slice(0, 300);
}

function lignePropre(questions: any[], brut: any, r: Reponses, section: string, enLigne: boolean): any {
  const propre: any = {};
  const source = brut && typeof brut === "object" ? brut : {};
  for (const q of questions) {
    const contexte: Reponses = enLigne ? r : { ...r, [section]: { ...(r[section] || {}), ...propre } };
    if (!visible(q, contexte, section, enLigne ? propre : null)) continue;
    propre[q.code] = valeurPropre(q, source[q.code], r);
  }
  return propre;
}

export function nettoyer(section: string, brut: any, r: Reponses): any {
  const s = sectionDe(section);
  if (!s) return {};
  const base: Reponses = { ...(r || {}) };
  const propre = lignePropre(s.questions, brut, { ...base, [section]: {} }, section, false);
  if (s.groupe) {
    const f = formeDe(section === "societe" ? { societe: propre } : base);
    const max = !f ? 1 : section === "direction" ? f.dirigeantsMax : f.associesMax;
    const lignes: any[] = Array.isArray(brut && brut[s.groupe.code]) ? brut[s.groupe.code] : [];
    propre[s.groupe.code] = lignes.slice(0, max).map(function (l) { return lignePropre(s.groupe.questions, l, { ...base, [section]: propre }, section, true); });
  }
  return propre;
}

function ageAu(naissance: string, jour: string): number {
  let a = Number(jour.slice(0, 4)) - Number(naissance.slice(0, 4));
  if (jour.slice(5) < naissance.slice(5)) a = a - 1;
  return a;
}

function dernierJour(annee: number, mois: number): string {
  const d = new Date(Date.UTC(annee, mois, 0));
  return d.toISOString().slice(0, 10);
}

// ──────────────────────────────────────────────────────────────────────────
// LES CONTROLES D UNE ETAPE. Ils disent ce qui manque ou ne tient pas
// debout ; ils ne jugent jamais un choix.
// ──────────────────────────────────────────────────────────────────────────
function manquants(questions: any[], ligne: any, r: Reponses, section: string, enLigne: boolean, prefixe: string): string[] {
  const erreurs: string[] = [];
  const vus: Record<string, boolean> = {};
  for (const q of questions) {
    if (!visible(q, r, section, enLigne ? ligne : null) || q.facultatif || vus[q.code]) continue;
    vus[q.code] = true;
    const v = ligne ? ligne[q.code] : undefined;
    if (v === "" || v === null || v === undefined) erreurs.push(prefixe + "« " + q.libelle + " » : la réponse manque.");
  }
  return erreurs;
}

export function controler(section: string, r: Reponses, aujourdhui?: string): string[] {
  const s = sectionDe(section);
  const jour = aujourdhui && estDate(aujourdhui) ? aujourdhui : new Date().toISOString().slice(0, 10);
  if (!s) return ["Étape inconnue."];
  const d: any = (r && r[section]) || {};
  const f = formeDe(r);
  if (section !== "societe" && !f) return ["Validez d'abord l'étape « La société »."];

  const erreurs = manquants(s.questions, d, r, section, false, "");
  const lignes: any[] = s.groupe ? (Array.isArray(d[s.groupe.code]) ? d[s.groupe.code] : []) : [];
  lignes.forEach(function (l, i) {
    manquants(s.groupe.questions, l, r, section, true, s.groupe.titre + " " + (i + 1) + " — ").forEach(function (e) { erreurs.push(e); });
  });
  if (erreurs.length > 0) return erreurs;

  if (section === "societe") {
    if (t(d.denomination).length < 2) erreurs.push("Le nom de la société est trop court.");
    if (!/^\d{5}$/.test(t(d.siege_cp))) erreurs.push("Le code postal du siège s'écrit en cinq chiffres.");
    const duree = Number(d.duree);
    if (!(duree >= 1 && duree <= 99 && Math.floor(duree) === duree)) erreurs.push("La durée de la société est un nombre entier d'années, de 1 à 99.");
    if (d.objet !== undefined && t(d.objet).length < 10) erreurs.push("L'objet de la société est trop court pour figurer dans des statuts.");
    const fin = t(d.premier_exercice_fin);
    const mois = Number(d.cloture_mois);
    if (fin && mois) {
      if (fin !== dernierJour(Number(fin.slice(0, 4)), mois)) erreurs.push("Le premier exercice se termine le dernier jour du mois de clôture (" + MOIS[mois - 1] + ") : la date saisie n'y correspond pas.");
      else if (fin <= jour) erreurs.push("La date de clôture du premier exercice est déjà passée.");
      else if (Number(fin.slice(0, 4)) > Number(jour.slice(0, 4)) + 1) erreurs.push("Le premier exercice se termine au plus tard à la fin de l'année qui suit celle de la création.");
    }
  }

  if (section === "capital" && f) {
    const montant = Number(d.montant), nominal = Number(d.nominal);
    if (!(montant >= 1 && Math.floor(montant) === montant)) erreurs.push("Le capital est un nombre entier d'euros, d'au moins 1 euro.");
    if (!(nominal >= 1 && Math.floor(nominal) === nominal)) erreurs.push("La valeur d'un titre est un nombre entier d'euros, d'au moins 1 euro.");
    if (erreurs.length === 0 && montant % nominal !== 0) erreurs.push("Le capital (" + euros(montant) + ") n'est pas un multiple de la valeur d'un titre (" + euros(nominal) + ").");
    if (erreurs.length === 0 && montant / nominal < f.associesMin) erreurs.push("Avec ces montants, la société n'aurait pas assez de titres pour ses associés.");
    if (f.liberations.indexOf(t(d.liberation)) < 0) erreurs.push("Le versement du capital n'est pas renseigné.");
  }

  if (section === "associes" && f) {
    const cap: any = r.capital || {};
    const montant = Number(cap.montant), nominal = Number(cap.nominal);
    if (!(montant >= 1) || !(nominal >= 1)) return ["Validez d'abord l'étape « Le capital »."];
    if (lignes.length < f.associesMin) erreurs.push(f.unique ? "Une " + f.nom + " a un associé : décrivez-le." : "Une " + f.nom + " compte au moins " + f.associesMin + " associés : il en manque.");
    if (lignes.length > f.associesMax) erreurs.push(f.unique ? "Une " + f.nom + " n'a qu'un seul associé." : "Une " + f.nom + " compte au plus " + f.associesMax + " associés.");
    let total = 0;
    const adresses: Record<string, number> = {};
    lignes.forEach(function (l, i) {
      const qui = "Associé " + (i + 1) + " — ";
      const apport = Number(l.apport);
      if (!(apport >= 1 && Math.floor(apport) === apport)) erreurs.push(qui + "l'apport est un nombre entier d'euros.");
      else if (apport % nominal !== 0) erreurs.push(qui + "l'apport (" + euros(apport) + ") n'est pas un multiple de la valeur d'un titre (" + euros(nominal) + ").");
      total = total + (apport || 0);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t(l.email))) erreurs.push(qui + "l'adresse de courriel n'a pas la forme d'une adresse.");
      else { if (adresses[l.email]) erreurs.push(qui + "cette adresse de courriel est déjà celle de l'associé " + adresses[l.email] + " : chacun signe avec la sienne."); else adresses[l.email] = i + 1; }
      if (estDate(l.naissance_date) && ageAu(l.naissance_date, jour) < 18) erreurs.push(qui + "la date de naissance est celle d'une personne mineure.");
      if (estDate(l.naissance_date) && l.naissance_date > jour) erreurs.push(qui + "la date de naissance est dans le futur.");
      if (l.conjoint_averti_le && l.conjoint_averti_le > jour) erreurs.push(qui + "la date à laquelle le conjoint a été averti est dans le futur.");
    });
    if (erreurs.length === 0 && total !== montant) erreurs.push("La somme des apports (" + euros(total) + ") n'est pas égale au capital (" + euros(montant) + ").");
  }

  if (section === "direction" && f) {
    const associes: any[] = (r.associes && r.associes.liste) || [];
    if (associes.length < f.associesMin) return ["Validez d'abord l'étape « Les associés »."];
    if (lignes.length < 1) erreurs.push("Désignez le " + f.dirigeant + ".");
    if (lignes.length > f.dirigeantsMax) erreurs.push(f.dirigeantsMax === 1 ? "Une " + f.nom + " n'a qu'un président." : "Ce modèle prévoit deux gérants au plus.");
    const pris: Record<string, boolean> = {};
    lignes.forEach(function (l, i) {
      const qui = "Dirigeant " + (i + 1) + " — ";
      if (l.qui !== "tiers") { if (pris[l.qui]) erreurs.push(qui + "cette personne est déjà désignée."); pris[l.qui] = true; }
      if (l.qui === "tiers" && estDate(l.naissance_date) && ageAu(l.naissance_date, jour) < 18) erreurs.push(qui + "la date de naissance est celle d'une personne mineure.");
    });
    if (d.duree_type === "limitee") { const n = Number(d.duree_annees); if (!(n >= 1 && n <= 99 && Math.floor(n) === n)) erreurs.push("La durée des fonctions est un nombre entier d'années."); }
  }

  if (section === "clauses" && d.actes_formation === "oui" && t(d.actes_liste).length < 10) erreurs.push("La liste des actes passés pour la société en formation est trop courte.");

  return erreurs;
}

// ──────────────────────────────────────────────────────────────────────────
// HORS CADRE. Le parcours s arrete ; il reprend si la reponse change.
// ──────────────────────────────────────────────────────────────────────────
export function horsCadre(r: Reponses): string | null {
  const motifs: string[] = [];
  if (r && r.societe && r.societe.activite_reglementee === "oui") motifs.push("l'activité est réglementée");
  if (r && r.capital && r.capital.apports_argent === "non") motifs.push("un apport n'est pas fait en argent");
  if (r && r.associes && r.associes.personnes_physiques === "non") motifs.push("un associé n'est pas une personne physique majeure");
  const liste: any[] = (r && r.associes && r.associes.liste) || [];
  if (liste.some(function (a) { return a && a.conjoint_revendique === "oui"; })) motifs.push("le conjoint d'un associé demande à être associé");
  if (motifs.length === 0) return null;
  return "Ce dossier sort du cadre de cet outil : " + motifs.join(" ; ") + ". Il demande l'intervention d'un professionnel (expert-comptable ou avocat). Le parcours est arrêté : rien n'est généré, rien n'est déposé.";
}

// Une ecriture stable des reponses d une etape : c est elle dont l empreinte
// est gardee avec chaque validation.
export function canonique(v: any): string {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return "[" + v.map(canonique).join(",") + "]";
  if (typeof v === "object") return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + canonique(v[k]); }).join(",") + "}";
  return JSON.stringify(v);
}

// ──────────────────────────────────────────────────────────────────────────
// LES PERSONNES
// ──────────────────────────────────────────────────────────────────────────
function f_(p: any): boolean { return p && p.civilite === "Mme"; }
function nomDe(p: any): string { return (f_(p) ? "Madame " : "Monsieur ") + t(p.prenom) + " " + t(p.nom).toUpperCase(); }
function nomCourt(p: any): string { return t(p.prenom).split(",")[0].trim() + " " + t(p.nom).toUpperCase(); }

function situationDe(p: any): string {
  const e = f_(p) ? "e" : "";
  if (p.situation === "marie") {
    const regimes: Record<string, string> = {
      communaute: "de la communauté de biens réduite aux acquêts", separation: "de la séparation de biens",
      participation: "de la participation aux acquêts", universelle: "de la communauté universelle",
    };
    return "marié" + e + " avec " + t(p.conjoint_nom) + " sous le régime " + (regimes[p.regime] || "");
  }
  if (p.situation === "pacse") return "lié" + e + " par un pacte civil de solidarité avec " + t(p.conjoint_nom);
  if (p.situation === "divorce") return "divorcé" + e;
  if (p.situation === "veuf") return f_(p) ? "veuve" : "veuf";
  return "célibataire";
}

function identite(p: any, avecSituation: boolean): string {
  return nomDe(p) + ", né" + (f_(p) ? "e" : "") + " le " + dateFr(p.naissance_date) + " à " + t(p.naissance_lieu)
    + ", de nationalité " + t(p.nationalite) + ", demeurant " + t(p.adresse) + ", " + t(p.cp) + " " + t(p.ville)
    + (avecSituation ? ", " + situationDe(p) : "");
}

// Les dirigeants, chacun ramene a une personne complete.
export function dirigeantsDe(r: Reponses): any[] {
  const associes: any[] = (r.associes && r.associes.liste) || [];
  const lignes: any[] = (r.direction && r.direction.liste) || [];
  return lignes.map(function (l) {
    const m = /^a(\d+)$/.exec(t(l.qui));
    if (m && associes[Number(m[1])]) return { ...associes[Number(m[1])], associe: true };
    return { ...l, associe: false };
  });
}

// Ceux qui signent les statuts : tous les associes.
export function signatairesDe(r: Reponses): { nom: string; email: string }[] {
  const associes: any[] = (r.associes && r.associes.liste) || [];
  return associes.map(function (a) { return { nom: nomCourt(a), email: t(a.email).toLowerCase() }; });
}

// ══════════════════════════════════════════════════════════════════════════
// LA LETTRE DE DEPART. Une seule lettre, signee avant tout (decision de
// Jacques, 09/10) : les engagements du client, toutes les etapes avec ce
// qu il valide a chacune, et la procuration. Sans elle, rien ne commence.
// ⛔ Pas de clause qui « degage de toute responsabilite » : elle ne tiendrait
// pas devant un consommateur, et ce n est pas ce que la lettre cherche. Elle
// dit qui fait quoi.
// ══════════════════════════════════════════════════════════════════════════
export function lettreDepart(dossier: any, prestataire: any): { titre: string; libelle: string; corps: string } {
  const client = t(dossier.client_nom);
  const projet = t(dossier.nom_projet);
  const mandataire = t(dossier.mandataire_nom) || t(prestataire && (prestataire.legal_name || prestataire.label));
  const nomPrestataire = t(prestataire && (prestataire.legal_name || prestataire.label));
  const adressePrestataire = t(prestataire && prestataire.principal_office_address);
  const corps = [
    "Je soussigné(e), " + client + " (" + t(dossier.client_email) + "), porte le projet de création de la société « " + projet + " ». Je m'adresse à " + nomPrestataire + (adressePrestataire ? ", " + adressePrestataire : "") + ", ci-après « le prestataire », qui met à ma disposition l'outil « Création de société ».",
    "",
    "1. Ce que fait l'outil",
    "L'outil assemble des statuts à partir de modèles dont les clauses sont écrites d'avance et des réponses que je donne à un questionnaire. Il reprend mes réponses telles quelles, sans les interpréter ni les compléter. Il prépare ensuite les formalités de constitution et les transmet en ligne aux organismes compétents, après mes validations.",
    "",
    "2. Ce que l'outil ne fait pas",
    "L'outil ne me donne aucun avis sur ma situation. Il ne me recommande ni une forme de société, ni une clause, ni un régime fiscal ou social. Les explications qu'il affiche sont générales : elles sont les mêmes pour tous. Le prestataire n'agit ici ni comme avocat ni comme expert-comptable. Je sais que je peux consulter un professionnel du droit ou du chiffre à tout moment ; si un tel professionnel m'accompagne, ses avis relèvent de sa propre mission.",
    "",
    "3. Mes engagements",
    "– Je fournis des informations exactes et complètes, et je réponds de leur sincérité.",
    "– Je fais moi-même chacun de mes choix, dans les listes qui me sont proposées.",
    "– Je relis les statuts avant de les signer. J'en suis l'auteur, avec mes associés : ils expriment notre volonté.",
    "– Chaque associé signe les statuts lui-même, avec sa propre adresse de courriel.",
    "",
    "4. Les étapes, et ce que je valide à chacune",
    "Étape 1 — La société. Je valide la forme, le nom, l'objet, le siège, la durée et l'exercice.",
    "Étape 2 — Le capital. Je valide le montant du capital, la valeur d'un titre et la part versée à la constitution.",
    "Étape 3 — Les associés. Je valide l'identité et l'apport de chaque associé.",
    "Étape 4 — La direction. Je valide le nom du ou des dirigeants, la durée de leurs fonctions et le principe de leur rémunération.",
    "Étape 5 — Les clauses. Je valide les choix que la loi laisse aux associés.",
    "Étape 6 — Les statuts. Je relis les statuts assemblés et je les signe électroniquement, ainsi que mes associés. Le récapitulatif de mes réponses et de mes validations est reproduit à leur suite.",
    "Étape 7 — Le dépôt du capital. Je verse moi-même les fonds à la banque de mon choix et je transmets l'attestation de dépôt qu'elle me remet, lorsque la loi la prévoit. Le prestataire ne reçoit et ne détient aucun fonds.",
    "Étape 8 — L'annonce légale. Je valide le texte de l'avis de constitution avant sa publication.",
    "Étape 9 — L'envoi. Je valide le dossier complet avant son dépôt au guichet unique des formalités d'entreprises.",
    "Étape 10 — L'immatriculation. Dès que la société est immatriculée, son dossier comptable est ouvert avec les informations déjà saisies.",
    "Aux étapes 1 à 5, 8 et 9, je valide par le bouton « Je valide ». Chaque validation est enregistrée avec sa date et l'adresse du compte qui l'a faite. Je reconnais qu'elle m'engage au même titre que ma signature. Une étape ne s'ouvre que lorsque la précédente est validée.",
    "",
    "5. Procuration",
    "Je donne pouvoir à " + mandataire + " d'accomplir en mon nom, pour le compte de la société en formation, les formalités de sa constitution : établir, signer et déposer la demande d'immatriculation au guichet unique des formalités d'entreprises ; faire publier l'avis de constitution dans un support habilité à recevoir les annonces légales ; déposer les pièces ; répondre aux demandes de régularisation ; recevoir les récépissés et l'extrait d'immatriculation. Ce pouvoir ne s'exerce qu'après mes validations. Il prend fin à l'immatriculation de la société et, au plus tard, douze mois après la signature de cette lettre.",
    "",
    "6. Frais",
    "Les frais dus aux organismes (greffe, registres, annonce légale) sont à ma charge. Leur montant m'est indiqué avant l'envoi du dossier, et rien n'est déposé avant leur règlement. Le prix du service m'est communiqué séparément.",
    "",
    "7. Délais",
    "Les délais dépendent de ma banque et des organismes. À titre indicatif, il faut compter d'une à trois semaines entre la signature des statuts et l'immatriculation. Aucun délai n'est garanti.",
    "",
    "8. Arrêt du parcours",
    "Je peux arrêter le parcours à tout moment avant l'envoi du dossier. Si l'une de mes réponses sort du cadre de l'outil (activité réglementée, apport autre qu'en argent, associé qui n'est pas une personne physique majeure, conjoint qui demande à être associé), le parcours s'arrête et je suis invité(e) à consulter un professionnel.",
    "",
    "9. Données personnelles",
    "Les informations que je saisis servent à établir les statuts et à accomplir les formalités. Elles sont conservées avec le dossier pendant la durée légale. Je dispose d'un droit d'accès et de rectification auprès du prestataire.",
    "",
    "La signature électronique de cette lettre vaut acceptation de l'ensemble de ses termes. Sans elle, rien ne commence.",
  ].join("\n");
  return { titre: "Lettre de départ — création de la société « " + projet + " »", libelle: "Lettre de départ et procuration", corps: corps };
}

// ══════════════════════════════════════════════════════════════════════════
// LES STATUTS. Trois familles de clauses (SARL, SAS, société civile), chacune
// avec sa variante a associe unique quand elle existe : cinq modeles.
// Chaque fonction rend des articles [titre, lignes] ; la numerotation se fait
// a la fin, pour qu un article ajoute ou retire ne decale rien a la main.
// ══════════════════════════════════════════════════════════════════════════
type Article = [string, string[]];

type Contexte = {
  f: Forme; s: any; c: any; k: any; associes: any[]; dirigeants: any[]; direction: any;
  nb: number; mandataire: string; den: string; un: boolean;
};

function contexteDe(r: Reponses, mandataire: string): Contexte {
  const f = formeDe(r) as Forme;
  const c = r.capital || {};
  return {
    f: f, s: r.societe || {}, c: c, k: r.clauses || {}, associes: (r.associes && r.associes.liste) || [],
    dirigeants: dirigeantsDe(r), direction: r.direction || {}, nb: Number(c.montant) / Number(c.nominal),
    mandataire: t(mandataire), den: t((r.societe || {}).denomination), un: f.unique,
  };
}

const FRACTIONS: Record<string, { part: number; texte: string }> = {
  totalite: { part: 1, texte: "intégralement" }, moitie: { part: 0.5, texte: "de moitié" },
  cinquieme: { part: 0.2, texte: "d'un cinquième" }, sur_appel: { part: 0, texte: "" },
};

function titresDe(x: Contexte, a: any): number { return Number(a.apport) / Number(x.c.nominal); }
function nTitres(x: Contexte, n: number): string { return nombreFr(n) + " " + (n > 1 ? x.f.titres : x.f.titre); }

function objetDe(x: Contexte): string[] {
  const civil = x.f.famille === "sci";
  const suite = "et, plus généralement, toutes opérations, de quelque nature qu'elles soient, se rattachant directement ou indirectement à cet objet et susceptibles d'en faciliter la réalisation" + (civil ? ", à la condition qu'elles ne modifient pas le caractère civil de la société." : ".");
  if (civil && x.s.objet_modele === "immobilier") {
    return ["La société a pour objet :", "l'acquisition, la propriété, l'administration et l'exploitation, par bail, location ou autrement, de tous biens et droits immobiliers ; l'emprunt de toutes sommes nécessaires à la réalisation de cet objet et la constitution de toutes garanties ;", suite];
  }
  // Le texte du client, mot pour mot ; seule sa ponctuation finale est unifiee.
  const texte = String(x.s.objet || "").split("\n").map(function (l) { return t(l); }).filter(Boolean).join(" ").replace(/[\s.;,]+$/, "");
  return ["La société a pour objet" + (civil ? "" : ", en France et à l'étranger") + " :", texte + " ;", suite];
}

function denominationDe(x: Contexte): string[] {
  const mention: Record<string, string> = {
    sarl: "« société à responsabilité limitée » ou des initiales « SARL »",
    sas: "« société par actions simplifiée » ou des initiales « SAS »",
    sci: "« société civile immobilière » ou des initiales « SCI »",
  };
  return [
    "La société a pour dénomination sociale : " + x.den + "." + (t(x.s.sigle) ? " Son sigle est : " + t(x.s.sigle) + "." : ""),
    "Dans tous les actes et documents émanant de la société et destinés aux tiers, la dénomination est précédée ou suivie immédiatement des mots " + mention[x.f.famille] + ", de l'énonciation du montant du capital social, ainsi que du lieu et du numéro d'immatriculation de la société au registre du commerce et des sociétés.",
  ];
}

function dureeDe(x: Contexte): string[] {
  const n = Number(x.s.duree);
  return ["La durée de la société est fixée à " + n + " année" + (n > 1 ? "s" : "") + " (" + enLettres(n) + ") à compter de la date de son immatriculation au registre du commerce et des sociétés, sauf dissolution anticipée ou prorogation."];
}

function exerciceDe(x: Contexte): string[] {
  const m = Number(x.s.cloture_mois);
  const debut = MOIS[m % 12];
  const fin = dernierJour(2027, m).slice(8, 10);
  return [
    "L'exercice social a une durée de douze mois. Il commence le 1er " + debut + " et se termine le " + (m === 2 ? "dernier jour de février" : Number(fin) + " " + MOIS[m - 1]) + (m === 12 ? " de chaque année." : " de l'année suivante."),
    "Par exception, le premier exercice commence à la date d'immatriculation de la société au registre du commerce et des sociétés et se termine le " + dateFr(x.s.premier_exercice_fin) + ".",
  ];
}

// Les apports, communs aux trois familles ; la liberation differe.
function apportsDe(x: Contexte): string[] {
  const lignes: string[] = [];
  if (x.un) lignes.push("L'associé unique, " + nomDe(x.associes[0]) + ", apporte à la société, en numéraire, la somme de " + somme(Number(x.c.montant)) + ", égale au montant du capital social.");
  else {
    lignes.push("Il est apporté à la société, en numéraire :");
    x.associes.forEach(function (a) { lignes.push("– par " + nomDe(a) + ", la somme de " + somme(Number(a.apport)) + " ;"); });
    lignes.push("soit, au total, la somme de " + somme(Number(x.c.montant)) + ", égale au montant du capital social.");
  }
  const lib = FRACTIONS[t(x.c.liberation)] || FRACTIONS.totalite;
  const organe = x.f.famille === "sas" ? "du président" : "de la gérance";
  if (x.f.famille === "sci") {
    if (x.c.liberation === "sur_appel") lignes.push("Ces apports sont libérés au fur et à mesure des besoins de la société, en une ou plusieurs fois, sur appel de la gérance. Chaque associé s'oblige à verser les sommes appelées dans le délai fixé par la gérance, qui ne peut être inférieur à quinze jours.");
    else lignes.push("Ces apports sont intégralement libérés : chaque associé verse à la société la somme qu'il apporte, à la signature des présents statuts.");
  } else {
    if (lib.part === 1) lignes.push(x.un ? "Cet apport est intégralement libéré." : "Ces apports sont intégralement libérés.");
    else lignes.push((x.un ? "Cet apport est libéré " + lib.texte + ", soit la somme de " : "Chaque apport est libéré " + lib.texte + ", soit au total la somme de ") + somme(Number(x.c.montant) * lib.part) + ". Le surplus sera libéré, en une ou plusieurs fois, sur appel " + organe + ", dans le délai maximum de cinq ans à compter de l'immatriculation de la société au registre du commerce et des sociétés.");
    lignes.push("Les fonds correspondant aux apports libérés sont déposés, pour le compte de la société en formation, sur un compte ouvert auprès de : " + t(x.c.banque) + ". Le dépositaire en délivre une attestation. Les fonds ne peuvent être retirés qu'après l'immatriculation de la société, sur présentation de la justification de cette immatriculation.");
  }
  if (x.f.famille !== "sas") {
    x.associes.forEach(function (a) {
      if (a.situation !== "marie" || (a.regime !== "communaute" && a.regime !== "universelle")) return;
      const e = f_(a) ? "elle" : "lui";
      if (a.biens_communs === "oui") lignes.push(nomDe(a) + " déclare que son apport est fait au moyen de fonds dépendant de la communauté de biens existant entre " + e + " et son conjoint, " + t(a.conjoint_nom) + ". Son conjoint a été averti de cet apport le " + dateFr(a.conjoint_averti_le) + ", conformément à l'article 1832-2 du Code civil, et n'a pas notifié son intention d'être personnellement associé.");
      else lignes.push(nomDe(a) + " déclare que son apport est fait au moyen de fonds qui lui sont propres.");
    });
  }
  return lignes;
}

function repartitionDe(x: Contexte): string[] {
  const lib = FRACTIONS[t(x.c.liberation)] || FRACTIONS.totalite;
  const numerotees = x.f.famille !== "sas";
  const etat = x.f.famille === "sci" ? "" : lib.part === 1 ? ", intégralement libérées" : ", libérées " + lib.texte;
  const lignes: string[] = [
    "Le capital social est fixé à la somme de " + somme(Number(x.c.montant)) + ".",
    "Il est divisé en " + nTitres(x, x.nb) + " de " + euros(Number(x.c.nominal)) + " de valeur nominale chacune" + (numerotees ? ", numérotées de 1 à " + nombreFr(x.nb) : ", toutes de même catégorie") + ", souscrites en totalité" + etat + (x.un ? " et attribuées en totalité à " + nomDe(x.associes[0]) + ", associé" + (f_(x.associes[0]) ? "e" : "") + " unique." : " et attribuées aux associés en proportion de leurs apports :"),
  ];
  if (!x.un) {
    let rang = 1;
    x.associes.forEach(function (a) {
      const n = titresDe(x, a);
      lignes.push("– à " + nomDe(a) + " : " + nTitres(x, n) + (numerotees ? (n > 1 ? ", numérotées de " + nombreFr(rang) + " à " + nombreFr(rang + n - 1) : ", numérotée " + nombreFr(rang)) : "") + " ;");
      rang = rang + n;
    });
    lignes.push("soit un total de " + nTitres(x, x.nb) + ", égal au nombre " + (x.f.famille === "sas" ? "d'actions" : "de parts sociales") + " composant le capital social.");
    if (x.f.famille === "sarl") lignes.push("Les soussignés déclarent que ces parts sont toutes souscrites et qu'elles sont réparties entre eux dans les proportions indiquées ci-dessus.");
  }
  lignes.push("Le capital social peut être augmenté ou réduit dans les conditions prévues par la loi.");
  return lignes;
}

function dureeFonctions(x: Contexte, titre: string): string {
  if (x.direction.duree_type === "limitee") { const n = Number(x.direction.duree_annees); return "Le " + titre + " est nommé pour une durée " + (n > 1 ? "de " + n + " années" : "d'une année") + ", renouvelable."; }
  return "Le " + titre + " est nommé sans limitation de durée.";
}

function remunerationDe(x: Contexte, titre: string, decision: string): string {
  if (x.direction.remuneration === "aucune") return "Les fonctions de " + titre + " ne sont pas rémunérées, à moins qu'une " + decision + " n'en décide autrement. Le " + titre + " a droit au remboursement de ses frais, sur justificatifs.";
  return "Le " + titre + " peut recevoir une rémunération, dont le montant et les modalités sont fixés par " + decision + ". Il a droit au remboursement de ses frais, sur justificatifs.";
}

const TIERS_ET_OBJET = "La société est engagée même par les actes qui ne relèvent pas de l'objet social, à moins qu'elle ne prouve que le tiers savait que l'acte dépassait cet objet ou qu'il ne pouvait l'ignorer compte tenu des circonstances.";
const RESERVE_LEGALE = "Sur le bénéfice de l'exercice, diminué le cas échéant des pertes antérieures, il est prélevé un vingtième au moins pour constituer la réserve légale. Ce prélèvement cesse d'être obligatoire lorsque la réserve atteint le dixième du capital social.";
const CONTESTATIONS = "Les contestations relatives aux affaires sociales, qui s'élèveraient pendant la durée de la société ou de sa liquidation entre les associés, ou entre un associé et la société, sont soumises aux tribunaux compétents du lieu du siège social.";

function finDe(x: Contexte): Article[] {
  const titreDirigeant = x.f.dirigeant;
  const plusieurs = x.dirigeants.length > 1;
  const soussignes = x.un ? "L'associé unique déclare" : "Les soussignés déclarent";
  const formation: string[] = ["La société jouit de la personnalité morale à compter de son immatriculation au registre du commerce et des sociétés."];
  if (x.k.actes_formation === "oui") formation.push("L'état des actes accomplis pour le compte de la société en formation, avec l'indication pour chacun d'eux de l'engagement qui en résulte pour la société, est annexé aux présents statuts. " + (x.un ? "L'associé unique en a eu connaissance avant de signer." : "Il a été présenté aux associés avant la signature.") + " La signature des statuts emporte reprise de ces engagements par la société lorsqu'elle aura été immatriculée.");
  else formation.push(soussignes + " qu'aucun acte n'a été accompli pour le compte de la société en formation avant la signature des présents statuts.");

  const nomination: string[] = [(plusieurs ? "Sont nommés premiers " + titreDirigeant + "s" : "Est nommé" + (f_(x.dirigeants[0]) ? "e" : "") + " premier " + titreDirigeant) + " de la société, dans les conditions fixées par les présents statuts :"];
  let tiers = false, internes = false;
  x.dirigeants.forEach(function (d, i) {
    nomination.push("– " + identite(d, false) + (d.associe ? ", associé" + (f_(d) ? "e" : "") + (x.un ? " unique" : "") : "") + (i < x.dirigeants.length - 1 ? " ;" : "."));
    if (d.associe) internes = true; else tiers = true;
  });
  if (internes) nomination.push((plusieurs && !tiers ? "Chacun d'eux déclare" : "Le " + titreDirigeant + " signataire des présents statuts déclare") + " accepter ces fonctions et n'être frappé d'aucune incompatibilité ni d'aucune interdiction de nature à l'empêcher de les exercer.");
  if (tiers) nomination.push("L'acceptation de ses fonctions par le " + titreDirigeant + " qui n'est pas associé, et sa déclaration de n'être frappé d'aucune incompatibilité ni d'aucune interdiction, sont établies par un acte séparé.");

  const pouvoirs = ["Tous pouvoirs sont donnés " + (x.mandataire ? "à " + x.mandataire + ", ainsi qu'" : "") + (plusieurs ? "à chacun des " + titreDirigeant + "s" : "au " + titreDirigeant) + " et au porteur d'un original ou d'une copie des présents statuts, pour accomplir les formalités de publicité, de dépôt et d'immatriculation prescrites par la loi.", "Les frais, droits et honoraires des présents statuts et de leurs suites sont pris en charge par la société."];

  const fin: Article[] = [
    ["Contestations", [CONTESTATIONS]],
    ["Personnalité morale — Actes accomplis pour la société en formation", formation],
    ["Nomination " + (plusieurs ? "des premiers " + titreDirigeant + "s" : "du premier " + titreDirigeant), nomination],
    ["Formalités — Frais", pouvoirs],
  ];
  return fin;
}

// ──────────────────────────────────────────────────────────────────────────
// SARL ET EURL
// ──────────────────────────────────────────────────────────────────────────
function articlesSarl(x: Contexte): Article[] {
  const un = x.un;
  const decisionOrd = un ? "décision de l'associé unique" : "décision collective ordinaire des associés";
  const a: Article[] = [];
  a.push(["Forme", un
    ? ["Il est formé par l'associé unique, propriétaire des parts ci-après créées, une société à responsabilité limitée régie par les lois et règlements en vigueur, notamment par les articles L. 223-1 et suivants du Code de commerce, et par les présents statuts.", "La société ne comprend qu'un seul associé. Elle peut, à tout moment, en comprendre plusieurs, sans que sa forme en soit modifiée."]
    : ["Il est formé, entre les propriétaires des parts ci-après créées et de celles qui pourraient l'être ultérieurement, une société à responsabilité limitée régie par les lois et règlements en vigueur, notamment par les articles L. 223-1 et suivants du Code de commerce, et par les présents statuts."]]);
  a.push(["Objet", objetDe(x)]);
  a.push(["Dénomination", denominationDe(x)]);
  a.push(["Siège social", ["Le siège social est fixé : " + t(x.s.siege_adresse) + ", " + t(x.s.siege_cp) + " " + t(x.s.siege_ville) + ".", "Il peut être transféré en tout autre lieu dans les conditions prévues par la loi."]]);
  a.push(["Durée", dureeDe(x)]);
  a.push(["Apports", apportsDe(x)]);
  a.push(["Capital social", repartitionDe(x)]);
  a.push(["Parts sociales", [
    "Les parts sociales ne peuvent pas être représentées par des titres négociables. Le titre de chaque associé résulte des présents statuts, des actes qui les modifient et des cessions régulièrement réalisées.",
    "Chaque part sociale donne droit à une voix dans les décisions et à une fraction des bénéfices et de l'actif social proportionnelle au nombre de parts existantes. " + (un ? "L'associé unique ne supporte les pertes qu'à concurrence de ses apports." : "Les associés ne supportent les pertes qu'à concurrence de leurs apports."),
    "Les parts sociales sont indivisibles à l'égard de la société. Les copropriétaires d'une part indivise se font représenter par l'un d'entre eux ou par un mandataire commun.",
  ]]);
  const forme = "Toute cession de parts sociales est constatée par écrit. Elle est rendue opposable à la société par le dépôt d'un original de l'acte au siège social contre remise par le gérant d'une attestation de ce dépôt, ou dans les formes prévues à l'article 1690 du Code civil. Elle n'est opposable aux tiers qu'après l'accomplissement de ces formalités et la publication des statuts modifiés au registre du commerce et des sociétés.";
  const agrementTiers = "Les parts sociales ne peuvent être cédées à des tiers étrangers à la société qu'avec le consentement de la majorité des associés représentant au moins la moitié des parts sociales. Le projet de cession est notifié à la société et à chacun des associés. Si la société n'a pas fait connaître sa décision dans le délai de trois mois à compter de la dernière des notifications, le consentement à la cession est réputé acquis. Si la société refuse de consentir à la cession, les associés sont tenus, dans le délai de trois mois à compter de ce refus, d'acquérir ou de faire acquérir les parts, à un prix fixé dans les conditions prévues à l'article 1843-4 du Code civil, sauf si le cédant renonce à la cession. La société peut également, avec le consentement de l'associé cédant, décider dans le même délai de réduire son capital du montant de la valeur nominale des parts de cet associé et de racheter ces parts au prix déterminé dans les mêmes conditions. Si, à l'expiration du délai imparti, aucune de ces solutions n'est intervenue, l'associé peut réaliser la cession initialement prévue, dans les conditions fixées par la loi.";
  if (un) {
    a.push(["Cession et transmission des parts sociales", [
      "1. " + forme,
      "2. Tant que la société ne comprend qu'un associé, les cessions de parts consenties par l'associé unique sont libres.",
      "3. Lorsque la société comprend plusieurs associés, les parts sociales sont librement cessibles entre associés, ainsi qu'entre conjoints et entre ascendants et descendants. " + agrementTiers,
      "4. La société n'est pas dissoute par le décès de l'associé unique : elle continue avec ses héritiers ou ayants droit. Elle n'est pas dissoute non plus par son incapacité, sa faillite personnelle ou l'interdiction de gérer prononcée contre lui.",
    ]]);
  } else {
    a.push(["Cession des parts sociales", [
      "1. Forme. " + forme,
      "2. Cession à des tiers. " + agrementTiers,
      "3. Cession entre associés, entre conjoints, entre ascendants et descendants. " + (x.k.cession_proches === "agrement"
        ? "Les cessions de parts entre associés, entre conjoints et entre ascendants et descendants sont soumises au consentement des associés, dans les conditions et selon la procédure prévues au paragraphe 2 ci-dessus."
        : "Les parts sociales sont librement cessibles entre associés, ainsi qu'entre conjoints et entre ascendants et descendants."),
    ]]);
    a.push(["Décès, incapacité ou faillite d'un associé", [
      x.k.deces === "agrement"
        ? "La société n'est pas dissoute par le décès d'un associé. Toutefois, le conjoint, les héritiers et les ayants droit de l'associé décédé ne deviennent associés qu'après avoir été agréés dans les conditions prévues pour les cessions à des tiers. S'ils ne sont pas agréés, les parts sont acquises ou rachetées dans les conditions et les délais prévus par la loi, à un prix fixé dans les conditions prévues à l'article 1843-4 du Code civil."
        : "La société n'est pas dissoute par le décès d'un associé. Les parts sociales sont librement transmissibles par voie de succession ou en cas de liquidation de communauté de biens entre époux : la société continue avec le conjoint, les héritiers et les ayants droit de l'associé décédé.",
      "La société n'est pas dissoute non plus par l'incapacité, la faillite personnelle ou l'interdiction de gérer frappant l'un des associés.",
    ]]);
  }
  a.push(["Gérance", [
    "1. Nomination. La société est gérée par un ou plusieurs gérants, personnes physiques, associés ou non, nommés par " + (un ? "l'associé unique." : "décision des associés représentant plus de la moitié des parts sociales.") + " " + dureeFonctions(x, "gérant"),
    "2. Pouvoirs. Dans les rapports avec les tiers, le gérant est investi des pouvoirs les plus étendus pour agir en toute circonstance au nom de la société, sous réserve des pouvoirs que la loi attribue expressément aux associés. " + TIERS_ET_OBJET + " Dans les rapports entre associés, le gérant peut faire tous les actes de gestion dans l'intérêt de la société. S'il existe plusieurs gérants, chacun détient séparément ces pouvoirs, sauf le droit pour chacun de s'opposer à toute opération avant qu'elle soit conclue.",
    "3. Rémunération. " + remunerationDe(x, "gérant", decisionOrd),
    "4. Fin des fonctions. Le gérant est révocable par " + (un ? "décision de l'associé unique" : "décision des associés représentant plus de la moitié des parts sociales") + ". Si la révocation est décidée sans juste motif, elle peut donner lieu à des dommages et intérêts. Le gérant peut démissionner de ses fonctions, à charge de prévenir " + (un ? "l'associé unique" : "les associés") + " trois mois au moins à l'avance.",
  ]]);
  a.push(["Conventions entre la société et un gérant ou un associé", un
    ? ["Les conventions conclues entre la société et l'associé unique ou le gérant sont mentionnées au registre des décisions, dans les conditions prévues par la loi. Cette règle ne s'applique pas aux conventions portant sur des opérations courantes et conclues à des conditions normales.", "Il est interdit au gérant et à l'associé unique, personnes physiques, de contracter sous quelque forme que ce soit des emprunts auprès de la société, de se faire consentir par elle un découvert, en compte courant ou autrement, et de faire cautionner ou avaliser par elle leurs engagements envers les tiers."]
    : ["Le gérant ou, s'il en existe un, le commissaire aux comptes présente à l'assemblée un rapport sur les conventions intervenues, directement ou par personne interposée, entre la société et l'un de ses gérants ou associés. L'assemblée statue sur ce rapport dans les conditions prévues par la loi. Cette règle ne s'applique pas aux conventions portant sur des opérations courantes et conclues à des conditions normales.", "Il est interdit aux gérants et aux associés, personnes physiques, de contracter sous quelque forme que ce soit des emprunts auprès de la société, de se faire consentir par elle un découvert, en compte courant ou autrement, et de faire cautionner ou avaliser par elle leurs engagements envers les tiers."]]);
  a.push(un
    ? ["Décisions de l'associé unique", ["L'associé unique exerce les pouvoirs que la loi attribue à la collectivité des associés. Il ne peut pas déléguer ses pouvoirs. Ses décisions sont répertoriées dans un registre.", "Lorsque la société vient à comprendre plusieurs associés, les décisions collectives sont prises dans les conditions de forme, de quorum et de majorité fixées par la loi pour les sociétés à responsabilité limitée."]]
    : ["Décisions collectives", [
      "1. Forme. Les décisions collectives sont prises en assemblée. Toutefois, à l'exception de l'approbation annuelle des comptes, elles peuvent être prises par consultation écrite des associés ou résulter du consentement de tous les associés exprimé dans un acte.",
      "2. Convocation. Les associés sont convoqués par le gérant quinze jours au moins avant la réunion, par lettre recommandée ou par voie électronique dans les conditions prévues par la réglementation. La convocation indique l'ordre du jour.",
      "3. Vote. Chaque associé a le droit de participer aux décisions et dispose d'un nombre de voix égal à celui des parts sociales qu'il possède. Un associé peut se faire représenter par son conjoint, à moins que la société ne comprenne que les deux époux. Sauf si les associés sont au nombre de deux, un associé peut se faire représenter par un autre associé. Il ne peut pas se faire représenter par une autre personne.",
      "4. Décisions ordinaires. Les décisions qui ne modifient pas les statuts sont adoptées par un ou plusieurs associés représentant plus de la moitié des parts sociales. Si cette majorité n'est pas obtenue, les associés sont convoqués ou consultés une seconde fois, et les décisions sont prises à la majorité des votes émis, quel que soit le nombre des votants.",
      "5. Décisions extraordinaires. Les décisions qui modifient les statuts ne sont valablement prises que si les associés présents ou représentés possèdent au moins, sur première convocation, le quart des parts sociales et, sur deuxième convocation, le cinquième de celles-ci. Les modifications sont décidées à la majorité des deux tiers des parts détenues par les associés présents ou représentés. Le changement de nationalité de la société, l'augmentation des engagements des associés et les autres décisions pour lesquelles la loi l'exige requièrent l'unanimité.",
      "6. Procès-verbaux. Chaque décision est constatée par un procès-verbal établi et conservé dans les conditions prévues par la réglementation.",
    ]]);
  a.push(["Exercice social", exerciceDe(x)]);
  a.push(["Comptes annuels", un
    ? ["À la clôture de chaque exercice, le gérant dresse l'inventaire, les comptes annuels et, lorsque la loi l'exige, le rapport de gestion.", "L'associé unique approuve les comptes dans le délai de six mois à compter de la clôture de l'exercice. Lorsque l'associé unique est seul gérant de la société, le dépôt au registre du commerce et des sociétés, dans le même délai, de l'inventaire et des comptes annuels dûment signés vaut approbation des comptes."]
    : ["À la clôture de chaque exercice, le gérant dresse l'inventaire, les comptes annuels et, lorsque la loi l'exige, le rapport de gestion.", "Ces documents sont soumis à l'approbation des associés réunis en assemblée dans le délai de six mois à compter de la clôture de l'exercice."]]);
  a.push(["Affectation et répartition du résultat", [RESERVE_LEGALE, "Le bénéfice distribuable est constitué par le bénéfice de l'exercice, diminué des pertes antérieures et des sommes portées en réserve en application de la loi, et augmenté du report bénéficiaire. " + (un ? "L'associé unique décide" : "Les associés décident") + " de le distribuer, de le porter en réserve ou de le reporter à nouveau, en tout ou en partie." + (un ? "" : " La part de chaque associé dans les bénéfices est proportionnelle au nombre de ses parts sociales.")]]);
  a.push(["Capitaux propres inférieurs à la moitié du capital social", ["Si, du fait de pertes constatées dans les documents comptables, les capitaux propres de la société deviennent inférieurs à la moitié du capital social, " + (un ? "l'associé unique décide" : "les associés décident") + ", dans les quatre mois qui suivent l'approbation des comptes ayant fait apparaître cette perte, s'il y a lieu à dissolution anticipée de la société. Si la dissolution n'est pas prononcée, la situation est régularisée dans les conditions et les délais prévus par la loi."]]);
  a.push(["Commissaires aux comptes", [(un ? "L'associé unique nomme" : "Les associés nomment") + " un ou plusieurs commissaires aux comptes lorsque la société dépasse les seuils fixés par la loi. Une telle nomination reste possible lorsque ces seuils ne sont pas atteints."]]);
  a.push(["Dissolution — Liquidation", ["La société est dissoute à l'arrivée de son terme, sauf prorogation, par " + (un ? "décision de l'associé unique" : "décision collective extraordinaire des associés") + " ou pour toute autre cause prévue par la loi.", "La dissolution entraîne la liquidation de la société, dans les conditions prévues par la loi. La personnalité morale de la société subsiste pour les besoins de la liquidation, jusqu'à la clôture de celle-ci. " + (un ? "L'associé unique nomme" : "Les associés nomment") + " un ou plusieurs liquidateurs, qui disposent des pouvoirs les plus étendus pour réaliser l'actif et acquitter le passif. Après le remboursement du montant nominal des parts sociales, le solde est " + (un ? "attribué à l'associé unique." : "réparti entre les associés en proportion du nombre de leurs parts.")]]);
  return a.concat(finDe(x));
}

// ──────────────────────────────────────────────────────────────────────────
// SAS ET SASU
// ──────────────────────────────────────────────────────────────────────────
function articlesSas(x: Contexte): Article[] {
  const un = x.un;
  const collectivite = un ? "l'associé unique" : "la collectivité des associés";
  const decisionOrd = un ? "décision de l'associé unique" : "décision collective ordinaire des associés";
  const a: Article[] = [];
  a.push(["Forme", [
    "Il est formé " + (un ? "par l'associé unique, propriétaire des actions ci-après créées," : "entre les propriétaires des actions ci-après créées et de celles qui pourraient l'être ultérieurement") + " une société par actions simplifiée régie par les lois et règlements en vigueur, notamment par les articles L. 227-1 et suivants du Code de commerce, et par les présents statuts.",
    "La société fonctionne sous la même forme avec un ou plusieurs associés. Elle ne peut pas offrir ses titres au public, sauf dans les cas où la loi le permet.",
  ]]);
  a.push(["Objet", objetDe(x)]);
  a.push(["Dénomination", denominationDe(x)]);
  a.push(["Siège social", ["Le siège social est fixé : " + t(x.s.siege_adresse) + ", " + t(x.s.siege_cp) + " " + t(x.s.siege_ville) + ".", "Il peut être transféré en tout autre lieu par " + (un ? "décision de l'associé unique." : "décision collective extraordinaire des associés.")]]);
  a.push(["Durée", dureeDe(x)]);
  a.push(["Apports", apportsDe(x)]);
  a.push(["Capital social", repartitionDe(x)]);
  a.push(["Actions", [
    "Les actions sont nominatives. Elles donnent lieu à une inscription en compte au nom de leur titulaire, dans les conditions prévues par la loi. Une attestation d'inscription en compte est remise à tout associé qui en fait la demande.",
    "Chaque action donne droit, dans les bénéfices et dans l'actif social, à une part proportionnelle à la fraction du capital qu'elle représente. Elle donne droit à une voix. " + (un ? "L'associé unique ne supporte les pertes qu'à concurrence de ses apports." : "Les associés ne supportent les pertes qu'à concurrence de leurs apports."),
    "Les actions sont indivisibles à l'égard de la société. Les copropriétaires d'actions indivises se font représenter par l'un d'entre eux ou par un mandataire commun.",
  ]]);
  const cession: string[] = ["1. Forme. Les actions ne sont négociables qu'après l'immatriculation de la société au registre du commerce et des sociétés. Leur cession s'opère, à l'égard de la société et des tiers, par un virement du compte du cédant au compte de l'acquéreur, sur production d'un ordre de mouvement. Ce mouvement est inscrit sur le registre des mouvements de titres."];
  if (x.k.cession_actions === "libre") cession.push("2. Les actions sont librement cessibles et transmissibles.");
  else {
    cession.push("2. Agrément. " + (x.k.cession_actions === "agrement_toutes"
      ? "Toute cession d'actions, même entre associés, est soumise à l'agrément préalable de la collectivité des associés."
      : "Les actions sont librement cessibles entre associés. Toute cession d'actions à une personne qui n'est pas associée est soumise à l'agrément préalable de la collectivité des associés.")
      + " Cette clause s'applique aux cessions à titre onéreux comme à titre gratuit. Elle ne s'applique pas tant que la société ne comprend qu'un seul associé.");
    cession.push("3. Procédure. Le cédant notifie son projet au président par lettre recommandée avec demande d'avis de réception, en indiquant le nombre d'actions concernées, le prix et l'identité de l'acquéreur. L'agrément résulte d'une décision collective ordinaire des associés, à laquelle le cédant prend part. La décision n'est pas motivée. Elle est notifiée au cédant. À défaut de notification dans les trois mois qui suivent la demande, l'agrément est réputé acquis.");
    cession.push("4. Refus d'agrément. En cas de refus, et si le cédant ne renonce pas à son projet, la société est tenue, dans le délai de trois mois à compter de la notification du refus, de faire acquérir les actions par un ou plusieurs associés ou par un tiers, ou, avec le consentement du cédant, de les acquérir elle-même en vue d'une réduction du capital. À défaut d'accord, le prix est déterminé dans les conditions prévues à l'article 1843-4 du Code civil. Si, à l'expiration de ce délai, l'achat n'est pas réalisé, l'agrément est considéré comme donné.");
    cession.push("5. Toute cession réalisée en violation de la présente clause est nulle.");
  }
  a.push(["Cession et transmission des actions", cession]);
  a.push(["Président", [
    "1. Nomination. La société est représentée, dirigée et administrée par un président, associé ou non, nommé par " + (un ? "l'associé unique." : "décision collective ordinaire des associés.") + " " + dureeFonctions(x, "président"),
    "2. Pouvoirs. Le président représente la société à l'égard des tiers. Il est investi des pouvoirs les plus étendus pour agir en toute circonstance au nom de la société, dans la limite de l'objet social et sous réserve des pouvoirs que la loi et les présents statuts attribuent " + (un ? "à l'associé unique" : "aux associés") + ". " + TIERS_ET_OBJET,
    "3. Rémunération. " + remunerationDe(x, "président", decisionOrd),
    "4. Fin des fonctions. Les fonctions du président prennent fin par l'arrivée de leur terme, par sa démission, à charge pour lui de prévenir " + (un ? "l'associé unique" : "les associés") + " trois mois au moins à l'avance, ou par sa révocation. La révocation peut être décidée à tout moment par " + decisionOrd + " ; elle n'a pas à être motivée et n'ouvre droit à aucune indemnité.",
  ]]);
  a.push(["Conventions entre la société et ses dirigeants ou associés", un
    ? ["Les conventions intervenues, directement ou par personne interposée, entre la société et son dirigeant ou son associé unique sont mentionnées au registre des décisions. Cette règle ne s'applique pas aux conventions portant sur des opérations courantes et conclues à des conditions normales."]
    : ["Le président ou, s'il en existe un, le commissaire aux comptes présente aux associés un rapport sur les conventions intervenues, directement ou par personne interposée, entre la société et son président, l'un de ses dirigeants ou l'un de ses associés disposant d'une fraction des droits de vote supérieure à dix pour cent. Les associés statuent sur ce rapport. Cette règle ne s'applique pas aux conventions portant sur des opérations courantes et conclues à des conditions normales."]]);
  const competence = "l'augmentation, l'amortissement ou la réduction du capital ; la fusion, la scission, la dissolution ou la transformation de la société ; la nomination des commissaires aux comptes ; l'approbation des comptes annuels et l'affectation du résultat ; la nomination, la rémunération et la révocation du président ; " + (x.k.cession_actions === "libre" ? "" : "l'agrément des cessions d'actions ; ") + "la modification des statuts ; et toute autre décision que la loi réserve aux associés";
  a.push(un
    ? ["Décisions de l'associé unique", [
      "L'associé unique exerce les pouvoirs attribués à la collectivité des associés. Il décide notamment : " + competence + ". Toutes les autres décisions relèvent du président.",
      "L'associé unique ne peut pas déléguer ses pouvoirs. Ses décisions sont répertoriées dans un registre.",
      "Lorsque la société vient à comprendre plusieurs associés, les décisions collectives sont prises, à l'initiative du président, en assemblée, par consultation écrite ou par un acte signé de tous les associés. Chaque action donne droit à une voix. Les décisions ordinaires sont adoptées par un ou plusieurs associés représentant plus de la moitié des voix attachées aux actions composant le capital ; les décisions qui modifient les statuts, par un ou plusieurs associés représentant au moins les deux tiers de ces voix ; les décisions pour lesquelles la loi l'exige, à l'unanimité.",
    ]]
    : ["Décisions collectives", [
      "1. Domaine. Sont prises par la collectivité des associés les décisions suivantes : " + competence + ". Toutes les autres décisions relèvent du président.",
      "2. Forme. Les décisions collectives sont prises, au choix du président, en assemblée, réunie au siège social ou par un moyen de visioconférence ou de télécommunication permettant d'identifier les participants, par consultation écrite, ou par un acte signé de tous les associés.",
      "3. Convocation. Les associés sont convoqués ou consultés par le président, par tout moyen écrit, huit jours au moins à l'avance. La convocation indique l'ordre du jour. Ce délai n'a pas à être respecté lorsque tous les associés sont présents ou représentés.",
      "4. Vote. Chaque action donne droit à une voix. Un associé peut se faire représenter par un autre associé ou par toute personne de son choix, munie d'un pouvoir écrit.",
      "5. Décisions ordinaires. Les décisions qui ne modifient pas les statuts sont adoptées par un ou plusieurs associés représentant plus de la moitié des voix attachées aux actions composant le capital social.",
      "6. Décisions extraordinaires. Les décisions qui modifient les statuts, ainsi que l'augmentation, l'amortissement ou la réduction du capital, la fusion, la scission, la dissolution et la transformation de la société, sont adoptées par un ou plusieurs associés représentant au moins les deux tiers des voix attachées aux actions composant le capital social.",
      "7. Unanimité. Les décisions pour lesquelles la loi l'exige, notamment celles qui augmentent les engagements des associés, sont prises à l'unanimité.",
      "8. Procès-verbaux. Chaque décision est constatée par un procès-verbal signé par le président et conservé dans un registre.",
    ]]);
  a.push(["Exercice social", exerciceDe(x)]);
  a.push(["Comptes annuels", un
    ? ["À la clôture de chaque exercice, le président dresse l'inventaire, les comptes annuels et, lorsque la loi l'exige, le rapport de gestion.", "L'associé unique approuve les comptes dans le délai de six mois à compter de la clôture de l'exercice. Lorsque l'associé unique, personne physique, assume personnellement la présidence de la société, le dépôt au registre du commerce et des sociétés, dans le même délai, de l'inventaire et des comptes annuels dûment signés vaut approbation des comptes."]
    : ["À la clôture de chaque exercice, le président dresse l'inventaire, les comptes annuels et, lorsque la loi l'exige, le rapport de gestion.", "Les associés statuent sur ces comptes dans le délai de six mois à compter de la clôture de l'exercice."]]);
  a.push(["Affectation et répartition du résultat", [RESERVE_LEGALE, "Le bénéfice distribuable est constitué par le bénéfice de l'exercice, diminué des pertes antérieures et des sommes portées en réserve en application de la loi, et augmenté du report bénéficiaire. " + (un ? "L'associé unique décide" : "Les associés décident") + " de le distribuer, de le porter en réserve ou de le reporter à nouveau, en tout ou en partie." + (un ? "" : " La part de chaque associé dans les bénéfices est proportionnelle au nombre de ses actions.")]]);
  a.push(["Capitaux propres inférieurs à la moitié du capital social", ["Si, du fait de pertes constatées dans les documents comptables, les capitaux propres de la société deviennent inférieurs à la moitié du capital social, " + (un ? "l'associé unique décide" : "les associés décident") + ", dans les quatre mois qui suivent l'approbation des comptes ayant fait apparaître cette perte, s'il y a lieu à dissolution anticipée de la société. Si la dissolution n'est pas prononcée, la situation est régularisée dans les conditions et les délais prévus par la loi."]]);
  a.push(["Commissaires aux comptes", [(un ? "L'associé unique nomme" : "Les associés nomment") + " un ou plusieurs commissaires aux comptes lorsque la société dépasse les seuils fixés par la loi. Une telle nomination reste possible lorsque ces seuils ne sont pas atteints."]]);
  a.push(["Représentation du personnel", ["S'il existe un comité social et économique, ses délégués exercent auprès du président les droits que la loi leur reconnaît."]]);
  a.push(["Dissolution — Liquidation", ["La société est dissoute à l'arrivée de son terme, sauf prorogation, par " + (un ? "décision de l'associé unique" : "décision collective extraordinaire des associés") + " ou pour toute autre cause prévue par la loi.", "La dissolution entraîne la liquidation de la société, dans les conditions prévues par la loi. La personnalité morale de la société subsiste pour les besoins de la liquidation, jusqu'à la clôture de celle-ci. " + (un ? "L'associé unique nomme" : "Les associés nomment") + " un ou plusieurs liquidateurs, qui disposent des pouvoirs les plus étendus pour réaliser l'actif et acquitter le passif. Après le remboursement du montant nominal des actions, le solde est " + (un ? "attribué à l'associé unique." : "réparti entre les associés en proportion du nombre de leurs actions.")]]);
  return a.concat(finDe(x));
}

// ──────────────────────────────────────────────────────────────────────────
// SOCIETE CIVILE IMMOBILIERE
// ──────────────────────────────────────────────────────────────────────────
function articlesSci(x: Contexte): Article[] {
  const extra = x.k.majorite_extra === "deux_tiers" ? "par un ou plusieurs associés représentant au moins les deux tiers des parts sociales" : "à l'unanimité des associés";
  const a: Article[] = [];
  a.push(["Forme", ["Il est formé, entre les propriétaires des parts ci-après créées et de celles qui pourraient l'être ultérieurement, une société civile immobilière régie par les articles 1832 et suivants du Code civil, par les textes pris pour leur application et par les présents statuts."]]);
  a.push(["Objet", objetDe(x)]);
  a.push(["Dénomination", denominationDe(x)]);
  a.push(["Siège social", ["Le siège social est fixé : " + t(x.s.siege_adresse) + ", " + t(x.s.siege_cp) + " " + t(x.s.siege_ville) + ".", "Il peut être transféré en tout autre lieu par décision collective extraordinaire des associés."]]);
  a.push(["Durée", dureeDe(x)]);
  a.push(["Apports", apportsDe(x)]);
  a.push(["Capital social", repartitionDe(x)]);
  a.push(["Parts sociales", [
    "Les parts sociales ne peuvent pas être représentées par des titres négociables. Le titre de chaque associé résulte des présents statuts, des actes qui les modifient et des cessions régulièrement réalisées.",
    "Chaque part sociale donne droit à une voix dans les décisions collectives et à une fraction des bénéfices et de l'actif social proportionnelle au nombre de parts existantes.",
    "À l'égard des tiers, les associés répondent indéfiniment des dettes sociales à proportion de leur part dans le capital social à la date de l'exigibilité ou au jour de la cessation des paiements. Les créanciers ne peuvent poursuivre le paiement des dettes sociales contre un associé qu'après avoir préalablement et vainement poursuivi la société.",
    "Les parts sociales sont indivisibles à l'égard de la société. Les copropriétaires d'une part indivise se font représenter par l'un d'entre eux ou par un mandataire commun.",
  ]]);
  const libres: string[] = [];
  const soumises: string[] = ["les cessions à des tiers étrangers à la société"];
  if (x.k.cession_associes === "agrement") soumises.push("les cessions entre associés"); else libres.push("entre associés");
  if (x.k.cession_famille === "agrement") soumises.push("les cessions au conjoint, aux ascendants ou aux descendants du cédant"); else libres.push("au profit du conjoint, des ascendants ou des descendants du cédant");
  a.push(["Cession des parts sociales", [
    "1. Forme. Toute cession de parts sociales est constatée par écrit. Elle est rendue opposable à la société dans les formes prévues à l'article 1690 du Code civil ou par un transfert sur les registres de la société. Elle n'est opposable aux tiers qu'après l'accomplissement de ces formalités et après publication au registre du commerce et des sociétés.",
    "2. Agrément. Sont soumises à l'agrément des associés, donné par décision collective extraordinaire : " + soumises.join(" ; ") + "." + (libres.length > 0 ? " Les parts sociales sont librement cessibles " + libres.join(" et ") + "." : ""),
    "3. Procédure. Le projet de cession est notifié, avec demande d'agrément, à la société et à chacun des associés. En cas de refus d'agrément, les associés peuvent acquérir les parts ou les faire acquérir par un tiers qu'ils agréent ; la société peut aussi les racheter en vue de leur annulation. Le nom du ou des acquéreurs proposés, ou l'offre de rachat par la société, ainsi que le prix offert, sont notifiés au cédant. En cas de contestation sur le prix, celui-ci est fixé dans les conditions prévues à l'article 1843-4 du Code civil.",
    "4. Défaut d'offre. Si aucune offre d'achat n'est faite au cédant dans le délai de six mois à compter de la dernière des notifications, l'agrément à la cession est réputé acquis, à moins que les autres associés ne décident, dans le même délai, la dissolution anticipée de la société. Le cédant peut alors rendre cette décision caduque en faisant connaître qu'il renonce à la cession, dans le délai d'un mois à compter de cette décision.",
  ]]);
  a.push(["Décès ou retrait d'un associé", [
    x.k.deces === "agrement"
      ? "La société n'est pas dissoute par le décès d'un associé. Toutefois, les héritiers et légataires de l'associé décédé ne deviennent associés qu'avec l'agrément des associés, donné par décision collective extraordinaire. Ceux qui ne sont pas agréés ont droit à la valeur des parts sociales de leur auteur. Cette valeur leur est payée par les nouveaux titulaires des parts ou par la société elle-même si elle les rachète en vue de leur annulation ; elle est déterminée au jour du décès dans les conditions prévues à l'article 1843-4 du Code civil."
      : "La société n'est pas dissoute par le décès d'un associé. Elle continue avec ses héritiers et légataires, qui deviennent associés sans avoir à être agréés.",
    "La société n'est pas dissoute non plus par l'incapacité, la déconfiture, la faillite personnelle ou la liquidation judiciaire d'un associé.",
    "Un associé peut se retirer de la société, en totalité ou en partie, avec l'autorisation donnée par décision collective extraordinaire des associés, ou pour justes motifs par décision de justice. Il a droit au remboursement de la valeur de ses droits sociaux, fixée, à défaut d'accord amiable, dans les conditions prévues à l'article 1843-4 du Code civil.",
  ]]);
  a.push(["Gérance", [
    "1. Nomination. La société est gérée par un ou plusieurs gérants, associés ou non, nommés par décision collective ordinaire des associés. " + dureeFonctions(x, "gérant"),
    "2. Pouvoirs. Dans les rapports avec les tiers, le gérant engage la société par les actes entrant dans l'objet social. S'il existe plusieurs gérants, chacun détient séparément ces pouvoirs ; l'opposition formée par un gérant aux actes d'un autre gérant est sans effet à l'égard des tiers, à moins qu'il ne soit établi qu'ils en ont eu connaissance. Dans les rapports entre associés, le gérant peut accomplir tous les actes de gestion que demande l'intérêt de la société."
      + (x.k.pouvoirs_gerant === "autorisation" ? " Toutefois, dans les rapports entre associés et sans que cette limite puisse être opposée aux tiers, le gérant ne peut pas, sans y avoir été autorisé par une décision collective ordinaire des associés : acquérir ou vendre un immeuble ; contracter un emprunt ; consentir une hypothèque ou toute autre garantie sur les biens de la société." : ""),
    "3. Rémunération. " + remunerationDe(x, "gérant", "décision collective ordinaire des associés"),
    "4. Fin des fonctions. Le gérant est révocable par décision des associés représentant plus de la moitié des parts sociales. Si la révocation est décidée sans juste motif, elle peut donner lieu à des dommages et intérêts. Le gérant est également révocable par les tribunaux pour cause légitime, à la demande de tout associé. Il peut démissionner de ses fonctions, à charge de prévenir les associés trois mois au moins à l'avance.",
  ]]);
  a.push(["Décisions collectives", [
    "1. Forme. Les décisions qui excèdent les pouvoirs de la gérance sont prises par les associés, en assemblée, par consultation écrite, ou par le consentement de tous les associés exprimé dans un acte.",
    "2. Convocation. Les associés sont convoqués par la gérance quinze jours au moins avant la réunion, par lettre recommandée. La convocation indique l'ordre du jour. Tout associé peut demander à la gérance de provoquer une délibération des associés sur une question déterminée.",
    "3. Vote. Chaque associé a le droit de participer aux décisions et dispose d'un nombre de voix égal à celui des parts sociales qu'il possède. Un associé peut se faire représenter par un autre associé ou par son conjoint.",
    "4. Décisions ordinaires. Les décisions qui ne modifient pas les statuts sont adoptées par un ou plusieurs associés représentant plus de la moitié des parts sociales.",
    "5. Décisions extraordinaires. Les décisions qui modifient les statuts, ainsi que celles que les présents statuts qualifient d'extraordinaires, sont adoptées " + extra + ".",
    "6. Procès-verbaux. Chaque décision est constatée par un procès-verbal établi et conservé dans les conditions prévues par la réglementation.",
  ]]);
  a.push(["Exercice social", exerciceDe(x)]);
  a.push(["Comptes — Information des associés", [
    "Il est tenu une comptabilité régulière des opérations de la société.",
    "La gérance rend compte de sa gestion aux associés au moins une fois par an. Dans les six mois qui suivent la clôture de chaque exercice, elle leur adresse un rapport écrit d'ensemble sur l'activité de la société au cours de l'exercice écoulé, qui indique les bénéfices réalisés ou prévisibles et les pertes encourues ou prévues. Les associés statuent sur les comptes de l'exercice dans le même délai.",
    "Les associés ont le droit d'obtenir, au moins une fois par an, communication des livres et des documents sociaux, et de poser par écrit des questions sur la gestion de la société, auxquelles il est répondu par écrit dans le délai d'un mois.",
  ]]);
  a.push(["Affectation et répartition du résultat", ["Le bénéfice de l'exercice est réparti entre les associés en proportion du nombre de leurs parts sociales, sauf décision collective ordinaire de le porter en réserve ou de le reporter à nouveau, en tout ou en partie. Les pertes, s'il en existe, sont supportées par les associés dans la même proportion."]]);
  a.push(["Dissolution — Liquidation", [
    "La société prend fin par l'expiration du temps pour lequel elle a été constituée, sauf prorogation, par la réalisation ou l'extinction de son objet, par la dissolution anticipée décidée par décision collective extraordinaire des associés, ou pour toute autre cause prévue par la loi. La réunion de toutes les parts sociales en une seule main n'entraîne pas la dissolution de plein droit de la société.",
    "La dissolution entraîne la liquidation de la société. La personnalité morale de la société subsiste pour les besoins de la liquidation, jusqu'à la publication de la clôture de celle-ci. Les associés nomment un ou plusieurs liquidateurs, qui disposent des pouvoirs les plus étendus pour réaliser l'actif et acquitter le passif. Après le paiement des dettes et le remboursement du capital social, l'actif net est partagé entre les associés en proportion du nombre de leurs parts.",
  ]]);
  return a.concat(finDe(x));
}

// ──────────────────────────────────────────────────────────────────────────
// L ASSEMBLAGE
// ──────────────────────────────────────────────────────────────────────────
export function statuts(r: Reponses, mandataire: string): { titre: string; libelle: string; corps: string; signataires: { nom: string; email: string }[] } {
  const x = contexteDe(r, mandataire);
  const articles = x.f.famille === "sarl" ? articlesSarl(x) : x.f.famille === "sas" ? articlesSas(x) : articlesSci(x);
  const feminin = x.un && f_(x.associes[0]);
  const tete: string[] = [
    x.den.toUpperCase(),
    majuscule(x.f.enToutesLettres) + " au capital de " + euros(Number(x.c.montant)),
    "Siège social : " + t(x.s.siege_adresse) + ", " + t(x.s.siege_cp) + " " + t(x.s.siege_ville),
    "",
    "STATUTS",
    "",
    x.un ? (feminin ? "LA SOUSSIGNÉE :" : "LE SOUSSIGNÉ :") : "LES SOUSSIGNÉS :",
  ];
  x.associes.forEach(function (a, i) { tete.push("– " + identite(a, true) + (i < x.associes.length - 1 ? " ;" : ",")); });
  tete.push(x.un
    ? "a établi ainsi qu'il suit les statuts de la " + x.f.enToutesLettres + " qu'" + (feminin ? "elle" : "il") + " a décidé de constituer."
    : "ont établi ainsi qu'il suit les statuts de la " + x.f.enToutesLettres + " qu'ils ont décidé de constituer entre eux.");
  const blocs: string[] = [tete.join("\n")];
  articles.forEach(function (art, i) { blocs.push("ARTICLE " + (i + 1) + " — " + art[0].toUpperCase() + "\n" + art[1].join("\n")); });
  blocs.push("Statuts établis à " + t(x.s.siege_ville) + " et signés électroniquement par " + (x.un ? (feminin ? "la soussignée" : "le soussigné") : "chacun des soussignés") + ", à la date portée par " + (x.un ? "sa" : "chaque") + " signature.");
  if (x.k.actes_formation === "oui") {
    blocs.push("ANNEXE — ÉTAT DES ACTES ACCOMPLIS POUR LE COMPTE DE LA SOCIÉTÉ EN FORMATION\n" + String(x.k.actes_liste || "").split("\n").map(function (l) { return t(l); }).filter(Boolean).map(function (l) { return "– " + l; }).join("\n"));
  }
  return { titre: "Statuts — " + x.den, libelle: "Statuts constitutifs", corps: blocs.join("\n\n"), signataires: signatairesDe(r) };
}

// ══════════════════════════════════════════════════════════════════════════
// LE RECAPITULATIF, reproduit a la suite des statuts : les reponses telles
// qu elles ont ete donnees, et la date de chaque validation. En signant les
// statuts, le client signe aussi ceci.
// ══════════════════════════════════════════════════════════════════════════
function valeurLisible(q: any, v: any, r: Reponses): string {
  if (v === "" || v === null || v === undefined) return "(sans réponse)";
  if (q.type === "liste") { for (const o of q.options || []) if (o[0] === v) return o[1]; return String(v); }
  if (q.type === "date") return dateFr(v);
  if (q.type === "zone") return String(v).split("\n").map(function (l) { return t(l); }).filter(Boolean).join(" / ");
  if (q.type === "associe_ou_tiers") {
    if (v === "tiers") return "Une personne qui n'est pas associée";
    const m = /^a(\d+)$/.exec(String(v));
    const liste: any[] = (r.associes && r.associes.liste) || [];
    return m && liste[Number(m[1])] ? "L'associé " + (Number(m[1]) + 1) + " (" + nomCourt(liste[Number(m[1])]) + ")" : String(v);
  }
  return String(v);
}

export function recapitulatif(r: Reponses, validations: Record<string, any>): string {
  const blocs: string[] = ["RÉCAPITULATIF DES RÉPONSES ET DES VALIDATIONS\nCe récapitulatif reproduit les réponses données au questionnaire, telles qu'elles ont été saisies, et la date de chaque validation. Il fait partie du document signé."];
  for (const code of ORDRE_SECTIONS) {
    const s = sectionDe(code);
    const d: any = (r && r[code]) || {};
    const v = validations && validations[code];
    let quand = "non validée";
    if (v && v.le) {
      const date = new Date(v.le);
      quand = "validée le " + date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) + " à " + date.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }) + " par " + t(v.par);
    }
    const lignes: string[] = ["Étape « " + s.titre + " » — " + quand];
    const vus: Record<string, boolean> = {};
    for (const q of s.questions) {
      if (!visible(q, r, code, null) || vus[q.code]) continue;
      vus[q.code] = true;
      lignes.push("– " + q.libelle + " : " + valeurLisible(q, d[q.code], r));
    }
    if (s.groupe) {
      const liste: any[] = Array.isArray(d[s.groupe.code]) ? d[s.groupe.code] : [];
      liste.forEach(function (l, i) {
        lignes.push(s.groupe.titre + " " + (i + 1) + " :");
        for (const q of s.groupe.questions) {
          if (!visible(q, r, code, l)) continue;
          lignes.push("– " + q.libelle + " : " + valeurLisible(q, l[q.code], r));
        }
      });
    }
    blocs.push(lignes.join("\n"));
  }
  return blocs.join("\n\n");
}

// Ce que l ecran recoit pour dessiner le questionnaire.
export function questionnaire(): any {
  return { formes: Object.keys(FORMES).map(function (k) { const f = FORMES[k]; return { code: f.code, nom: f.nom, unique: f.unique, associes_min: f.associesMin, associes_max: f.associesMax, dirigeant: f.dirigeant, dirigeants_max: f.dirigeantsMax, titres: f.titres }; }), etapes: ETAPES, sections: SECTIONS, ordre: ORDRE_SECTIONS };
}
