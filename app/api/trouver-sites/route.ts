import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { promises as dnsPromises } from "dns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 🆕 01/10 (soir) — voir « AUCUNE LECTURE GARDEE EN CACHE » plus bas.
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const maxDuration = 300;

// ═══════════════════════════════════════════════════════════════════════
// TROUVER LE SITE D UN CABINET, SANS PRESTATAIRE — 01/10/2026
//
// POURQUOI. Dropcontact n a trouve d adresse que pour 2 a 3 % des cabinets
// d expertise comptable, et pour aucun des avocats qui n ont pas de
// presence nominative en ligne. Or la route lire-sites trouve l adresse
// sur le site dans environ la moitie des cas — A CONDITION D AVOIR LE SITE.
// Cette route fait l etape d avant : elle TROUVE le site. Jacques, 01/10 :
// « je veux pouvoir trouver les sites Web sans passer par Dropcontact ou un
// de ses concurrents ».
//
// COMMENT, EN TROIS TEMPS :
// 1. DEVINER. A partir du nom du cabinet et du dirigeant, on fabrique les
//    adresses de site les plus probables : dupont-avocats.fr,
//    cabinet-dupont.fr, alphaconseils.com...
// 2. ECARTER CE QUI N EXISTE PAS. Une question au DNS (l annuaire des noms
//    de domaine) dit en quelques millisecondes si le domaine existe. Seuls
//    les domaines qui existent sont ouverts.
// 3. VERIFIER. 🚨 C EST LA PARTIE QUI COMPTE. « dupont-avocats.fr » existe
//    peut-etre, mais c est peut-etre un autre Dupont, dans une autre ville.
//    On ne garde un site QUE si sa page porte :
//      · le SIREN du cabinet (la preuve absolue — les mentions legales
//        l imposent), ou
//      · le nom du dirigeant ou du cabinet, ET la ville ou le code postal,
//        ET le metier (avocat ; expert-comptable, comptabilite, audit).
//    ⛔ UN SITE QUI NE PASSE PAS LA VERIFICATION N EST JAMAIS ECRIT. Mieux
//    vaut ne rien trouver que prospecter le mauvais cabinet.
//
// ENSUITE, lire-sites prend le relais : elle lit le site trouve et en tire
// l adresse. Cette route n ecrit QUE le site (et le lien LinkedIn affiche
// sur l accueil, s il y en a un).
//
// C EST GRATUIT : des questions DNS et des pages publiques, lues par le
// serveur. Aucun prestataire, aucun credit.
//
// ⚠️ CE QU ON NE TROUVERA PAS : les cabinets dont le site ne porte ni leur
// nom, ni celui du dirigeant (un nom de marque sans rapport). Pour ceux-la,
// il faudrait un moteur de recherche — payant au-dela d un petit quota.
// ═══════════════════════════════════════════════════════════════════════

// LES BASES, ET LE METIER DE CHACUNE.
// 🚨 LE METIER SERT DEUX FOIS : pour fabriquer les adresses probables
// (dupont-avocats.fr / dupont-expertise.fr), et pour verifier la page.
const TABLES: any = {
  cabinets: {
    table: "prospects_cabinets",
    metier: "comptable",
    ordre: "id",
  },
  avocats: {
    table: "prospects_avocats",
    metier: "avocat",
    ordre: "priorite",
  },
  // 🆕 07/10 — LES SIX AUTRES BASES. Mesure du 07/10 : la recherche ne
  // portait que sur les cabinets et les avocats ; 81 924 fiches des six
  // autres bases n avaient ni site ni adresse, et n avaient jamais ete
  // cherchees (lire-sites n y lisait que les sites deja connus). Jacques :
  // « ne neglige rien […] il faudra creer des bases pour tous les secteurs ».
  // ⚠️ L ORDRE EST CELUI DU TRAVAIL : une base ne commence que lorsque la
  // precedente est finie. D abord celles qui ont une campagne ou un message
  // pret (organismes, immobilier, grands organismes), puis les autres.
  // ⚠️ TOUTE BASE AJOUTEE ICI S AJOUTE AUSSI DANS LA VEILLE
  // (app/api/cron/veille-enrichissement/route.ts, RECHERCHE).
  organismes: { table: "prospects_organismes", metier: "formation", ordre: "id" },
  immobilier: { table: "prospects_immobilier", metier: "immobilier", ordre: "id" },
  gros: { table: "prospects_gros", metier: "formation", ordre: "id" },
  qualiopi: { table: "prospects_qualiopi", metier: "formation", ordre: "id" },
  interim: { table: "prospects_interim", metier: "interim", ordre: "id" },
  ecommerce: { table: "prospects_ecommerce", metier: "ecommerce", ordre: "id" },
};

// LES MOTS QUI PROUVENT LE METIER SUR LA PAGE (texte sans accents).
// ⚠️ Ils se cherchent comme des morceaux de texte : « immobili » couvre
// « immobilier » et « immobiliere ».
const PREUVES_METIER: any = {
  avocat: ["avocat"],
  comptable: ["expert comptable", "expert-comptable", "expertise comptable", "comptab", "commissaire aux comptes", "audit"],
  formation: ["formation", "formateur", "formatrice", "qualiopi", "stagiaire", "apprentissage", "alternance",
    "coaching", "bilan de competences", "enseignement", "pedagogi", "e learning"],
  immobilier: ["immobili", "agence immo", "syndic", "gestion locative", "biens a vendre", "biens a louer",
    "estimation de votre bien", "mandat de vente"],
  interim: ["interim", "travail temporaire", "recrutement", "offres d emploi", "offre d emploi"],
  ecommerce: ["panier", "boutique", "livraison", "commande", "e commerce", "vente en ligne", "acheter", "shop"],
};

// 🆕 07/10 — LES TOURNURES DE CHAQUE METIER DANS UN NOM DE SITE.
// Un organisme de formation ne nomme pas son site comme une agence
// immobiliere : « dupont-formation.fr », « agence-dupont.fr »,
// « dupont-interim.fr », « dupont-shop.fr ».
//   suffixes / prefixes     autour du coeur du nom de la societe ;
//   suffixesNom / prefixesNom   autour du nom du dirigeant ;
//   generiques              les mots du metier, qui ne distinguent pas une
//                           societe d une autre (ils s ajoutent a GENERIQUES) ;
//   coeurDabord             le coeur seul passe EN PREMIER (un site marchand
//                           porte le nom de sa marque, sans mot de metier).
// ⚠️ Les cabinets comptables et les avocats gardent leurs tournures d
// origine, ecrites dans `candidats` : elles sont eprouvees, on n y touche pas.
const METIERS: any = {
  formation: {
    suffixes: ["-formation", "-formations", "formation", "-conseil", "-academy", "-institut", "-consulting"],
    prefixes: ["formation-", "institut-", "centre-", "ecole-"],
    suffixesNom: ["-formation", "-conseil", "-coaching", "-consulting"],
    prefixesNom: ["cabinet-"],
    generiques: ["formation", "formations", "formateur", "institut", "centre", "ecole", "academy", "academie",
      "consulting", "consultant", "consultants", "association", "ass", "asso", "organisme", "pour", "service",
      "services", "developpement", "competences", "apprentissage", "professionnelle", "professionnel",
      "school", "business", "training", "coaching"],
  },
  immobilier: {
    suffixes: ["-immobilier", "-immo", "immo", "immobilier", "-transactions", "-gestion", "-patrimoine"],
    prefixes: ["agence-", "immobilier-", "immo-", "cabinet-"],
    suffixesNom: ["-immobilier", "-immo", "immobilier"],
    prefixesNom: ["agence-", "cabinet-", "immobilier-"],
    generiques: ["immobilier", "immobiliere", "immobilieres", "immo", "agence", "agences", "transaction",
      "transactions", "patrimoine", "invest", "investissement", "investissements", "properties", "property",
      "home", "habitat", "location", "locations", "vente", "ventes", "syndic", "real", "estate", "imm",
      "developpement", "asset", "management", "expert"],
  },
  interim: {
    suffixes: ["-interim", "interim", "-emploi", "-rh", "-recrutement", "-travail-temporaire"],
    prefixes: ["interim-", "agence-"],
    suffixesNom: ["-interim", "-rh", "-recrutement"],
    prefixesNom: [],
    generiques: ["interim", "interimaire", "travail", "temporaire", "emploi", "rh", "recrutement", "agence",
      "ressources", "humaines", "medical", "consulting", "services", "service", "solutions"],
  },
  ecommerce: {
    suffixes: ["-shop", "shop", "-boutique", "-store", "store", "-paris", "-france"],
    prefixes: ["boutique-", "shop-", "la-boutique-"],
    suffixesNom: [],
    prefixesNom: [],
    generiques: ["shop", "boutique", "store", "www", "com", "fr", "net", "ltd", "co", "limited", "company",
      "trading", "technology", "youxian", "gongsi", "online", "vente", "ventes", "ligne", "distribution",
      "diffusion", "import", "export", "commerce", "ecommerce", "web"],
    coeurDabord: true,
  },
};

// LES MOTS GENERIQUES D UN METIER : la liste commune, plus les siens.
function generiquesDe(metier: string): string[] {
  const m = METIERS[metier];
  return m && m.generiques ? GENERIQUES.concat(m.generiques) : GENERIQUES;
}

// 🆕 07/10 — LE NOM, ET CE QUI EST ENTRE PARENTHESES.
// Dans les bases issues du registre, la parenthese porte l ENSEIGNE ou le
// nom d usage : « DANIEL ARZOINE (VOYAGEOSCOPE) », « HOUDA HERRY
// (ALKOUCH) », « REINE CODJOGAN (EKABERT) (REINARTDECO) » — et parfois le
// site lui-meme : « SAS MELINE (WWW.PARFUMDO.COM) ». C est souvent
// l enseigne, pas le nom de la personne, qui fait le nom du site.
//   nom         ce qui est hors parentheses ;
//   enseignes   chaque parenthese qui n est pas un site, ni la repetition
//               du nom ;
//   domaines    chaque parenthese qui est un nom de site.
// ⚠️ Une enseigne n est jamais crue sur parole : le site qu elle fait
// deviner passe la meme verification que les autres.
function decoupe(raisonSociale: any): { nom: string; enseignes: string[]; domaines: string[] } {
  const brut = String(raisonSociale || "");
  const enseignes: string[] = [];
  const domaines: string[] = [];
  const nom = brut.replace(/\(([^()]*)\)/g, function (_tout: string, dedans: string) {
    const d = String(dedans || "").trim();
    if (!d) return " ";
    if (/^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/.*)?$/i.test(d.replace(/\s+/g, ""))) {
      const dom = domaineDe(d);
      if (dom && domaines.indexOf(dom) < 0) domaines.push(dom);
      return " ";
    }
    enseignes.push(d);
    return " ";
  }).replace(/\s+/g, " ").trim();
  const nomPlat = plat(nom);
  const gardees = enseignes.filter(function (e, i) {
    const p = plat(e);
    return p.length >= 3 && p !== nomPlat && enseignes.indexOf(e) === i;
  });
  // Une societe dont tout le nom est entre parentheses garde ce nom.
  return { nom: nom || brut, enseignes: gardees.slice(0, 3), domaines: domaines.slice(0, 2) };
}

// COMBIEN DE LIGNES PAR LECTURE EN BASE, ET COMBIEN EN PARALLELE.
// ⚠️ EN PARALLELE, PAS PLUS DE SIX : chaque ligne interroge jusqu a vingt
// domaines et ouvre quelques pages. Au-dela, les delais d abandon se
// cumulent et le passage deborde.
// 🆕 01/10 (soir) — PREMIER PASSAGE REEL : 60 cabinets en cinq minutes, un
// seul passage par heure, soit trois semaines pour toute la base. Douze
// lignes a la fois au lieu de six (tout est attente du reseau, et les
// questions DNS restent limitees a huit par ligne) ; la tache passe aussi
// toutes les dix minutes (vercel.json).
const LOT = 120;
const PARALLELE = 12;

// LE DELAI AVANT D ABANDONNER UNE PAGE, ET LE GARDE-FOU DE DUREE.
// 🚨 MEME REGLE QUE lire-sites : un serveur qui accepte la connexion sans
// jamais repondre bloquerait tout le passage.
// 🆕 01/10 (troisieme essai) — 4 SECONDES NE SUFFISAIENT PAS : trois sites
// tres probables (auditgestionconseil.fr, revision-et-finance-cogefor.fr,
// europeenne.fr) etaient « delai depasse ». Et un domaine existant
// (cabinet-camatte.fr) n etait pas vu d un essai sur l autre : le DNS
// repondait trop tard. Delais allonges, deux tentatives DNS.
const DELAI_MS = 7000;
const DELAI_DNS_MS = 2500;
// 🆕 02/10 — 250 s → 200 s. Un passage a dure 4 min 42 le 01/10 : le
// dernier paquet commence avant la limite et peut durer encore une minute.
// Au-dela de 300 s, Vercel coupe, et ce paquet est perdu (repris au
// passage suivant). 200 s laissent toujours la marge.
const DUREE_MAX_MS = 200000;

// 🚨🆕 05/10 — LA RECHERCHE N ECRIVAIT PLUS RIEN DEPUIS LE 02/10 A 9 H.
// Mesure en base : derniere recherche le 02/10 a 09h00 ; 14 127 cabinets
// restaient a chercher, et les 4 548 cabinets d avocats n avaient jamais
// commence. La meme panne que lire-sites, par le meme chemin : une ligne
// n etait marquee « cherchee » qu APRES le travail de tout son paquet de
// douze. Qu une seule des douze ne finisse pas (Vercel coupe a 300 s), et
// rien n etait ecrit ; les lignes etant prises dans l ordre, le passage
// suivant reprenait LES DOUZE MEMES, et ainsi de suite, sans aucune erreur
// visible.
//
// CE QUI CHANGE :
//  1. LE PAQUET EST MARQUE « CHERCHE » AVANT LE TRAVAIL (voir `traiter`),
//     et la base doit l avoir accepte : les memes lignes ne peuvent plus
//     revenir.
//  2. LE DELAI D UNE PAGE COUVRE AUSSI LA LECTURE DE SON CONTENU (il etait
//     leve des l arrivee de la reponse) ; de meme pour une reponse DNS.
//  3. UNE LIGNE A UN TEMPS : DUREE_LIGNE_MS, verifie entre deux domaines et
//     entre deux pages ; LIMITE_LIGNE_MS est le filet — au dela, le paquet
//     continue sans elle.
//  4. CE QUE LA BASE REFUSE D ECRIRE EST COMPTE ET DIT (aucune ecriture
//     n etait verifiee).
//
// LE DELAI POUR LIRE LE CORPS D UNE PAGE, une fois la reponse commencee.
const DELAI_CORPS_MS = 8000;
// LA TAILLE LUE, AU PLUS.
const TAILLE_MAX = 400000;
// LE TEMPS D UNE LIGNE. Mesure du 01/10 : un paquet de douze prenait
// environ 27 secondes ; 50 secondes laissent le double a la plus lente.
// 200 + 70 = 270 s : sous les 300 s ou Vercel coupe.
const DUREE_LIGNE_MS = 50000;
const LIMITE_LIGNE_MS = 70000;

// AU PLUS, COMBIEN DE DOMAINES OUVRIR POUR UNE LIGNE.
// Les questions DNS sont presque gratuites ; les pages, non.
const MAX_DOMAINES_OUVERTS = 4;

// 🆕 07/10 — A PARTIR DE COMBIEN DE FICHES UN MEME SITE EST CELUI D UN
// RESEAU (voir `traiter`).
// 🆕 07/10 (soir) — 3 → 1. Deux organismes differents avaient recu le meme
// site : l un des deux au moins etait faux. Un site deja porte par une autre
// fiche de la base n est plus ecrit une seconde fois. (La seconde fiche
// n aurait de toute facon pas pu recevoir la meme adresse : une adresse,
// une fiche.)
const SEUIL_RESEAU = 1;

// LES PAGES OU CHERCHER LE SIREN QUAND L ACCUEIL NE LE PORTE PAS.
// 🆕 01/10 — ET LA PAGE CONTACT : la ville y est presque toujours, meme
// quand l accueil ne la donne pas.
const PAGES_MENTIONS = ["/mentions-legales", "/mentions-legales/", "/mentions-legales.html", "/mentions_legales",
  "/mentions", "/informations-legales", "/contact", "/contact.html", "/nous-contacter", "/contactez-nous"];

// ⚠️ LES FORMES JURIDIQUES ET LES PETITS MOTS NE FONT PAS UN NOM DE DOMAINE.
// « SELARL DUPONT ET ASSOCIES » donne « dupont », et aussi « dupont-associes ».
const FORMES = [
  "sarl", "sas", "sasu", "selarl", "selas", "selafa", "selca", "selurl", "sel",
  "scp", "eurl", "sa", "snc", "sci", "scm", "aarpi", "sc", "gie", "societe", "ste",
  "l", "d",
  // 🆕 07/10 — les organismes de formation et les agents immobiliers sont
  // souvent des personnes : « Monsieur BERTRAND DORET », « EI AFFAF YAHI ».
  "monsieur", "madame", "mademoiselle", "mme", "mlle", "mr", "ei", "eirl", "scop", "sasp", "scic",
];
// Les mots generiques : ils ne distinguent pas un cabinet d un autre.
const GENERIQUES = [
  "cabinet", "groupe", "et", "associes", "associe", "associees", "associee",
  "de", "du", "des", "la", "le", "les", "en", "me", "maitre",
  "avocat", "avocats", "avocate", "avocates",
  "expert", "experts", "expertise", "expertises", "comptable", "comptables", "comptabilite",
  "conseil", "conseils", "audit", "audits", "gestion", "france", "international",
  "office", "partners", "partenaires", "and", "law", "firm", "the", "fiduciaire",
  "fiscal", "fiscale", "juridique", "juridiques", "societe",
];

// 🚨🆕 01/10 (soir) — AUCUNE LECTURE GARDEE EN CACHE. Les journaux de Vercel
// montraient « Using cache » sur la lecture de la base : chaque passage
// automatique recevait LA MEME liste de lignes que le premier, et retraitait
// sans fin les memes cabinets (180 cherches au bout de trois heures). Le
// cache de Next.js garde les reponses des appels `fetch` ; on le refuse ici,
// pour la base comme pour les pages et les questions DNS.
const sansCache = function (entree: any, options?: any) {
  return fetch(entree, { ...(options || {}), cache: "no-store" });
};
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { global: { fetch: sansCache as any } }
);

// LE RESOLVEUR DNS, AVEC UN DELAI COURT ET UNE SEULE TENTATIVE.
// ⚠️ ON N UTILISE PAS dns.lookup : il passe par une file de quatre fils
// partagee par tout le processus, et vingt questions a la fois y feraient
// la queue. Le Resolver interroge directement, en parallele.
const resolveur = new dnsPromises.Resolver({ timeout: DELAI_DNS_MS, tries: 2 });

// UN TEXTE SANS ACCENTS, EN MINUSCULES, SANS PONCTUATION.
function plat(v: any): string {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " et ")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function mots(v: any): string[] {
  const p = plat(v);
  if (!p) return [];
  // 🆕 01/10 — LES SIGLES : « L.D.S. » devenait « l d s », dont « l » et
  // « d » partaient avec les formes juridiques — et il restait « s », d ou
  // « sexpertise.fr ». Les lettres seules qui se suivent forment un mot.
  const brut = p.split(" ");
  const sortie: string[] = [];
  let sigle = "";
  for (const m of brut) {
    if (m.length === 1) { sigle += m; continue; }
    if (sigle) { sortie.push(sigle); sigle = ""; }
    sortie.push(m);
  }
  if (sigle) sortie.push(sigle);
  // Une lettre seule restee seule (le « l » de « l expert ») n est pas un mot.
  return sortie.filter(function (m) { return m.length >= 2; });
}

// UN MORCEAU DE NOM DE DOMAINE : lettres, chiffres, tirets, et pas trop long.
function propre(slug: string): string | null {
  const s = slug.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (s.length < 3 || s.length > 50) return null;
  if (!/^[a-z0-9-]+$/.test(s)) return null;
  return s;
}

// FABRIQUER LES ADRESSES DE SITE PROBABLES, DE LA PLUS A LA MOINS PROBABLE.
//
// 🚨 L ORDRE COMPTE : on n ouvrira que les premiers domaines qui existent.
// Le nom complet du cabinet passe d abord (c est le plus souvent le
// domaine), puis le nom sans les mots generiques, puis le dirigeant.
function candidats(l: any, metier: string): string[] {
  // 🆕 07/10 — le nom se lit sans ses parentheses (voir `decoupe`).
  const parts = decoupe(l.raison_sociale);
  const tournures: any = METIERS[metier] || null;
  const generiques = generiquesDe(metier);
  const raison = mots(parts.nom).filter(function (m) { return FORMES.indexOf(m) < 0; });
  // 🆕 07/10 — UN NOMBRE N EST PAS LE COEUR D UN NOM : « SUP INTERIM 81 »,
  // « ACTUAL SAUMUR 1096 ». On l ecarte du coeur (le nom entier, lui, est
  // deja essaye tel quel), sauf s il ne reste rien d autre.
  let coeur = raison.filter(function (m) { return generiques.indexOf(m) < 0; });
  const sansNombres = coeur.filter(function (m) { return !/^[0-9]+$/.test(m); });
  if (sansNombres.length > 0) coeur = sansNombres;
  const nom = mots(l.dirigeant_nom);
  const prenom = mots(l.dirigeant_prenom);

  const slugs: string[] = [];
  const ajouter = function (s: string) {
    const p = propre(s);
    if (p && slugs.indexOf(p) < 0) slugs.push(p);
  };

  // 1. Le nom du cabinet, tel quel (sans la forme juridique).
  if (raison.length > 0 && raison.length <= 5) {
    ajouter(raison.join("-"));
    ajouter(raison.join(""));
  }
  // 1 bis. 🆕 07/10 — L ENSEIGNE (la parenthese du nom), telle quelle, puis
  // avec les tournures du metier.
  for (const e of parts.enseignes) {
    const me = mots(e).filter(function (m) { return FORMES.indexOf(m) < 0; });
    if (me.length === 0 || me.length > 5) continue;
    ajouter(me.join("-"));
    ajouter(me.join(""));
    const ce = me.filter(function (m) { return generiques.indexOf(m) < 0; });
    if (tournures && ce.length > 0 && ce.length <= 3 && ce.length < me.length + 1) {
      const c = ce.join("-");
      for (const s of tournures.suffixes.slice(0, 3)) ajouter(c + s);
      for (const p of tournures.prefixes.slice(0, 2)) ajouter(p + c);
    }
  }
  // 2. Le coeur du nom, avec les tournures du metier.
  // ⚠️ LE COEUR SEUL VIENT EN DERNIER : « alpha.fr » ou « martin.com »
  // existent presque toujours et appartiennent a quelqu un d autre. Les
  // ouvrir en premier consommerait les quatre ouvertures permises.
  const coeurSeul: string[] = [];
  // 🆕 07/10 — UN NOM LONG (« AGENCE IMM MONT BLANC COTE D AZUR ») ne donnait
  // aucune adresse : plus de trois mots distinctifs, donc rien. Pour les
  // metiers a tournures, ses deux puis ses trois premiers mots distinctifs
  // sont essayes avec le mot du metier (« mont-blanc-immobilier.fr »).
  // ⚠️ Jamais seuls : « mont-blanc.fr » est a quelqu un d autre.
  if (tournures && coeur.length > 3) {
    for (const n of [2, 3]) {
      const c = coeur.slice(0, n).join("-");
      const cc = coeur.slice(0, n).join("");
      for (const s of tournures.suffixes.slice(0, 3)) ajouter((s.charAt(0) === "-" ? c : cc) + s);
      for (const pf of tournures.prefixes.slice(0, 2)) ajouter(pf + c);
    }
  }
  if (coeur.length > 0 && coeur.length <= 3) {
    const c = coeur.join("-");
    const cc = coeur.join("");
    coeurSeul.push(c);
    if (cc !== c) coeurSeul.push(cc);
    if (tournures) {
      // 🆕 07/10 — les tournures du metier (voir METIERS).
      // ⚠️ Pour un site marchand, la marque seule passe d abord.
      // ⚠️ Un coeur de moins de quatre lettres (« OR-SHOP » → « or ») ne
      // recoit pas de tournure : « or-boutique.fr » n a aucune chance d etre
      // le bon. Le nom entier, lui, est deja essaye.
      if (cc.length >= 4) {
        if (tournures.coeurDabord) { ajouter(c); ajouter(cc); }
        for (const s of tournures.suffixes) ajouter((s.charAt(0) === "-" ? c : cc) + s);
        for (const p of tournures.prefixes) ajouter(p + c);
      }
    } else if (metier === "avocat") {
      ajouter(c + "-avocats"); ajouter(c + "-avocat"); ajouter("cabinet-" + c);
      ajouter(cc + "avocats"); ajouter("avocat-" + c);
      ajouter(c + "-associes");
    } else {
      ajouter(c + "-expertise"); ajouter("cabinet-" + c); ajouter(c + "-expert-comptable");
      ajouter(c + "-conseil"); ajouter(c + "-audit"); ajouter(cc + "expertise");
      ajouter(c + "-associes");
    }
  }
  // 3. Le dirigeant.
  if (nom.length > 0 && nom.length <= 3) {
    const n = nom.join("-");
    if (tournures) {
      // 🆕 07/10 — le dirigeant, avec les tournures du metier, puis son
      // prenom et son nom (le site d une personne qui exerce seule).
      for (const s of tournures.suffixesNom) ajouter((s.charAt(0) === "-" ? n : nom.join("")) + s);
      for (const pf of tournures.prefixesNom) ajouter(pf + n);
      if (prenom.length > 0 && tournures.suffixesNom.length > 0) {
        const pn = prenom.join("-") + "-" + n;
        ajouter(pn + tournures.suffixesNom[0]);
        ajouter(pn);
        ajouter(prenom.join("") + nom.join(""));
      }
    } else if (metier === "avocat") {
      ajouter(n + "-avocat"); ajouter("maitre-" + n); ajouter(n + "-avocats");
      ajouter("avocat-" + n);
      if (prenom.length > 0) {
        ajouter(prenom.join("-") + "-" + n + "-avocat");
        ajouter(prenom.join("-") + "-" + n);
      }
    } else {
      ajouter("cabinet-" + n); ajouter(n + "-expert-comptable"); ajouter(n + "-expertise");
      ajouter(n + "-conseil");
    }
  }

  // 4. 🆕 01/10 — LE SIGLE DU NOM. « EXPERTISE ET TECHNIQUE COMPTABLES » se
  // presente sous « ETC » : son site ne porte aucun des trois mots. Le sigle
  // se forme sur les mots du nom (y compris les mots du metier), sans les
  // petits mots ni la forme juridique.
  const sigle = sigleDe(l.raison_sociale);
  if (sigle) {
    if (tournures) {
      for (const s of tournures.suffixes.slice(0, 3)) ajouter(sigle + s);
      for (const pf of tournures.prefixes.slice(0, 2)) ajouter(pf + sigle);
    } else if (metier === "avocat") {
      ajouter(sigle + "-avocats"); ajouter("cabinet-" + sigle); ajouter(sigle + "avocats");
    } else {
      ajouter(sigle + "-expertise"); ajouter(sigle + "-expert-comptable"); ajouter("cabinet-" + sigle);
      ajouter(sigle + "expertise"); ajouter(sigle + "-conseil");
    }
  }

  // Le coeur seul, en dernier (voir plus haut).
  const avantCoeur = slugs.length;
  for (const s of coeurSeul) ajouter(s);

  // ⚠️ .fr D ABORD : ce sont des cabinets francais.
  // ⚠️ UN COEUR SEUL DE MOINS DE SIX LETTRES N EST PAS ESSAYE EN .com :
  // « alpha.com » n est jamais le site d un cabinet francais.
  const domaines: string[] = [];
  for (const s of slugs) domaines.push(s + ".fr");
  slugs.forEach(function (s, i) {
    if (i >= avantCoeur && s.replace(/-/g, "").length < 6) return;
    domaines.push(s + ".com");
  });
  return domaines.slice(0, 40);
}

// LE DOMAINE EXISTE-T-IL ? Une question DNS, rien d autre.
// 🆕 01/10 (cinquieme essai) — LA QUESTION DNS PASSE PAR UN SERVICE PUBLIC
// EN HTTPS (Cloudflare, puis Google en secours). D un essai a l autre, les
// memes domaines apparaissaient ou disparaissaient (bakertillystrego.com,
// carre-expertise.fr, cabinet-camatte.fr) : le resolveur du serveur ne
// suivait pas deux cents questions a la fois. La reponse « ce domaine
// n existe pas » (code 3) est nette ; une erreur, elle, est retentee.
async function questionDns(nom: string, service: string): Promise<boolean | null> {
  const stop = new AbortController();
  const minuteur = setTimeout(function () { stop.abort(); }, DELAI_DNS_MS);
  try {
    const r = await fetch(service + "?name=" + encodeURIComponent(nom) + "&type=A", {
      signal: stop.signal,
      cache: "no-store",
      headers: { accept: "application/dns-json" },
    });
    if (!r.ok) return null;
    // 🆕 05/10 — le minuteur reste arme pendant la lecture de la reponse :
    // il etait arrete avant, et une reponse commencee mais jamais finie
    // faisait attendre sans limite.
    const j: any = await r.json();
    if (j.Status === 3) return false;
    if (j.Status !== 0) return null;
    return Array.isArray(j.Answer) && j.Answer.length > 0;
  } catch {
    return null;
  } finally {
    clearTimeout(minuteur);
    try { stop.abort(); } catch (e) { /* rien */ }
  }
}

async function resout(nom: string): Promise<boolean> {
  let r = await questionDns(nom, "https://cloudflare-dns.com/dns-query");
  if (r === null) r = await questionDns(nom, "https://dns.google/resolve");
  if (r === null) {
    try {
      const a = await resolveur.resolve4(nom);
      r = Array.isArray(a) && a.length > 0;
    } catch {
      r = false;
    }
  }
  return r === true;
}

async function existe(domaine: string): Promise<boolean> {
  if (await resout(domaine)) return true;
  // ⚠️ Certains sites ne repondent qu a « www. » : on lui pose la question.
  return await resout("www." + domaine);
}

// ⚠️ PAS PLUS DE HUIT QUESTIONS DNS A LA FOIS PAR LIGNE : c est l exces de
// questions simultanees qui faisait perdre des domaines.
// 🆕 05/10 — `limite` : l heure limite de la ligne ; passe cette heure, on
// ne pose plus de question.
async function existentTous(liste: string[], limite: number): Promise<boolean[]> {
  const sortie: boolean[] = new Array(liste.length).fill(false);
  let i = 0;
  const ouvriers = [];
  for (let k = 0; k < 8; k++) {
    ouvriers.push((async function () {
      while (i < liste.length && Date.now() < limite) {
        const n = i++;
        sortie[n] = await existe(liste[n]);
      }
    })());
  }
  await Promise.all(ouvriers);
  return sortie;
}

// LIRE UNE PAGE, AVEC UN DELAI D ABANDON. Rend le texte ET l adresse finale
// (apres redirections) : c est elle qui sera ecrite comme site.
// 🆕 01/10 (deuxieme essai) — LA RAISON DE L ECHEC EST RENDUE : sur 30
// cabinets, la moitie des domaines plausibles (« auditgestionconseil.fr »
// pour AUDIT GESTION CONSEIL) etaient « illisibles » sans qu on sache
// pourquoi. `erreur` dit maintenant : code HTTP, delai, ou refus de
// connexion (souvent un certificat invalide).
// 🚨🆕 05/10 — LE DELAI COUVRE MAINTENANT LA PAGE ENTIERE : DELAI_MS pour
// obtenir la reponse, puis DELAI_CORPS_MS pour lire son contenu. Il etait
// leve des l arrivee de la reponse : un serveur qui repond puis n envoie
// jamais la fin de sa page bloquait la lecture sans limite.
// ⚠️ Si le delai tombe pendant la lecture, la partie deja lue est rendue :
// le SIREN ou le nom y sont peut-etre. Rien de lu = « delai depasse ».
async function lire(url: string): Promise<{ html: string; finale: string } | { erreur: string }> {
  const stop = new AbortController();
  let minuteur: any = setTimeout(function () { stop.abort(); }, DELAI_MS);
  try {
    const r = await fetch(url, {
      signal: stop.signal,
      redirect: "follow",
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AcademiaPro-Contact/1.0; +https://www.academiapro.fr)",
        accept: "text/html,application/xhtml+xml",
        // ⚠️ Certains pare-feu refusent une requete sans langue.
        "accept-language": "fr-FR,fr;q=0.9,en;q=0.5",
      },
    });
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { stop.abort(); }, DELAI_CORPS_MS);
    if (!r.ok) return { erreur: "http " + r.status };
    const type = String(r.headers.get("content-type") || "");
    if (type && type.indexOf("html") < 0) return { erreur: "pas une page (" + type.split(";")[0] + ")" };
    const texte = await corpsBorne(r, TAILLE_MAX);
    if (!texte && stop.signal.aborted) return { erreur: "delai depasse" };
    return { html: texte, finale: r.url || url };
  } catch (e: any) {
    if (stop.signal.aborted) return { erreur: "delai depasse" };
    const cause = String((e && e.cause && (e.cause.code || e.cause.message)) || (e && e.message) || "inconnue");
    return { erreur: "connexion refusee (" + cause.slice(0, 60) + ")" };
  } finally {
    clearTimeout(minuteur);
    // La connexion est rendue dans tous les cas : sans cela, une reponse
    // non lue (page refusee, page trop longue) la garderait ouverte.
    try { stop.abort(); } catch (e) { /* rien */ }
  }
}

// 🆕 05/10 — LIRE LE CORPS D UNE REPONSE, MORCEAU PAR MORCEAU, ET S ARRETER
// A `limite` OCTETS. Avant, la page etait telechargee en entier puis
// coupee : une page de plusieurs dizaines de megaoctets, ou un serveur qui
// envoie sans fin, etait lu jusqu au bout.
// ⚠️ MEME DECODAGE QU AVANT (UTF-8, comme `r.text()`).
async function corpsBorne(r: any, limite: number): Promise<string> {
  const corps: any = r.body;
  if (!corps || typeof corps.getReader !== "function") {
    const entier = await r.text();
    return String(entier || "").slice(0, limite);
  }
  const lecteur = corps.getReader();
  const decodeur = new TextDecoder("utf-8");
  let texte = "";
  let octets = 0;
  try {
    while (octets < limite) {
      const morceau = await lecteur.read();
      if (morceau.done) break;
      if (morceau.value) {
        octets += morceau.value.byteLength;
        texte += decodeur.decode(morceau.value, { stream: true });
      }
    }
  } catch (e) {
    // Delai depasse ou connexion coupee : on rend ce qui est lu.
  }
  // On n attend pas la fermeture : un serveur muet ne la confirmerait jamais.
  try { lecteur.cancel().catch(function () { return null; }); } catch (e) { /* rien */ }
  return texte.slice(0, limite);
}

// 🆕 05/10 — UN TRAVAIL, AVEC UNE HEURE LIMITE, ET SANS QU UNE ERREUR NE
// REMONTE. `Promise.all` attend TOUTES les lignes d un paquet : une seule
// qui ne finit jamais, ou une seule erreur, et le paquet entier etait perdu
// — avec lui le passage. Ici, passe la limite, on rend `siTropLong()` et le
// paquet continue ; une erreur rend `siErreur(e)`.
function avecLimite(travail: () => Promise<any>, ms: number, siTropLong: () => any, siErreur: (e: any) => any): Promise<any> {
  return new Promise(function (rendre) {
    let fini = false;
    const minuteur = setTimeout(function () {
      if (fini) return;
      fini = true;
      rendre(siTropLong());
    }, ms);
    const conclure = function (v: any) {
      if (fini) return;
      fini = true;
      clearTimeout(minuteur);
      rendre(v);
    };
    try {
      travail().then(conclure, function (e: any) { conclure(siErreur(e)); });
    } catch (e) {
      conclure(siErreur(e));
    }
  });
}

function estPage(x: any): x is { html: string; finale: string } {
  return x && typeof x.html === "string";
}

// 🆕 OUVRIR UN DOMAINE : https, puis https://www., puis http:// — mais le
// repli en http ne se fait que si l echec N EST PAS un delai depasse (un
// serveur muet le resterait en http, et ce serait 4 secondes de plus).
// ⚠️ LE REPLI EN http EST REVENU : au premier essai, sans lui, des sites
// de petits cabinets au certificat expire etaient « illisibles ».
// 🆕 01/10 — LES LIENS DE L ACCUEIL VERS LES PAGES OU FIGURENT L ADRESSE ET
// LES MENTIONS LEGALES (meme site seulement), dans l ordre d utilite.
function liensAnnexes(html: string, base: string): string[] {
  const MOTS = ["mention", "legal", "contact", "cabinet", "equipe", "qui-sommes", "quisommes",
    "a-propos", "apropos", "agence", "nous-trouver", "acces", "coordonnees", "about"];
  let hote = "";
  try { hote = new URL(base).hostname.replace(/^www\./, ""); } catch { return []; }
  const trouves: { url: string; rang: number }[] = [];
  const liens = html.match(/href=["']([^"'#]+)["']/gi) || [];
  for (const brut of liens) {
    const v = brut.replace(/^href=["']/i, "").replace(/["']$/, "");
    let u: URL;
    try { u = new URL(v, base); } catch { continue; }
    if (u.protocol !== "http:" && u.protocol !== "https:") continue;
    if (u.hostname.replace(/^www\./, "") !== hote) continue;
    const chemin = (u.pathname + u.search).toLowerCase();
    if (/\.(pdf|jpg|jpeg|png|gif|svg|css|js|zip|doc|docx)$/.test(u.pathname.toLowerCase())) continue;
    const rang = MOTS.findIndex(function (m) { return chemin.indexOf(m) >= 0; });
    if (rang < 0) continue;
    const propreUrl = u.origin + u.pathname + u.search;
    if (trouves.some(function (x) { return x.url === propreUrl; })) continue;
    trouves.push({ url: propreUrl, rang: rang });
  }
  trouves.sort(function (a, b) { return a.rang - b.rang; });
  return trouves.slice(0, 6).map(function (x) { return x.url; });
}

// 🆕 01/10 — LES PAGES QUI RENVOIENT AILLEURS SANS LE DIRE AU SERVEUR.
// Plusieurs accueils « presque vides » (cegec.fr, lds39.com) sont des pages
// de renvoi : une balise meta refresh, un script, ou un cadre qui charge le
// vrai site. On suit ce renvoi UNE fois.
function renvoiDe(html: string, base: string): string | null {
  const m = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url\s*=\s*([^"'>\s]+)/i)
    || html.match(/(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i)
    || html.match(/<i?frame[^>]+src=["']([^"']+)["']/i);
  if (!m) return null;
  try {
    const u = new URL(m[1], base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function suivreRenvoi(p: { html: string; finale: string }): Promise<{ html: string; finale: string }> {
  if (plat(texteDe(p.html)).length >= 200) return p;
  const cible = renvoiDe(p.html, p.finale);
  if (!cible || cible === p.finale) return p;
  const r = await lire(cible);
  return estPage(r) ? r : p;
}

// 🆕 05/10 — `limite` : passe l heure limite de la ligne, on ne tente pas
// l adresse suivante.
async function ouvrir(d: string, limite: number): Promise<{ html: string; finale: string } | { erreur: string }> {
  const a = await lire("https://" + d);
  if (estPage(a)) return await suivreRenvoi(a);
  if (Date.now() > limite) return a;
  const b = await lire("https://www." + d);
  if (estPage(b)) return await suivreRenvoi(b);
  if ((a as any).erreur === "delai depasse" && (b as any).erreur === "delai depasse") return a;
  if (Date.now() > limite) return b;
  const c = await lire("http://" + d);
  if (estPage(c)) return await suivreRenvoi(c);
  return { erreur: (a as any).erreur + " / www : " + (b as any).erreur + " / http : " + (c as any).erreur };
}

// LE TEXTE VISIBLE D UNE PAGE, sans scripts ni balises.
function texteDe(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&[a-z]+;/gi, " ");
}

// LE SIREN, ECRIT D UN BLOC OU PAR GROUPES (« 123 456 789 », « 123.456.789 »).
function porteSiren(texte: string, siren: string): boolean {
  const s = String(siren || "").replace(/\D/g, "");
  if (s.length !== 9) return false;
  const motif = new RegExp(s.split("").join("[\\s.\\u00a0-]?"));
  return motif.test(texte);
}

// UN MOT ENTIER DANS UN TEXTE « plat ».
function contientMot(t: string, m: string): boolean {
  if (!m) return false;
  return (" " + t + " ").indexOf(" " + m + " ") >= 0;
}

// 🆕 01/10 (quatrieme essai) — LE SIGLE DU NOM, partage entre la
// fabrication des adresses et la verification.
const PETITS = ["et", "de", "du", "des", "la", "le", "les", "en", "l", "d", "a", "au", "aux"];
function sigleDe(raisonSociale: any): string | null {
  const raison = mots(decoupe(raisonSociale).nom).filter(function (m) { return FORMES.indexOf(m) < 0; });
  const pourSigle = raison.filter(function (m) { return PETITS.indexOf(m) < 0; });
  if (pourSigle.length < 3 || pourSigle.length > 6) return null;
  return pourSigle.map(function (m) { return m[0]; }).join("");
}

// 🆕 01/10 (sixieme essai) — LE DEPARTEMENT PAR SON NOM ET SES GRANDES VILLES.
// agcexpertise.fr, fcaexpertise.com, carre-expertise.fr restaient refuses
// meme apres lecture de leur page contact : ces sites disent « Dijon »,
// « Agen », « Dole », sans code postal. Pour chaque departement : son nom
// et sa ou ses grandes villes (prefecture, et les sous-prefectures les plus
// citees).
// ⚠️ LES NOMS QUI SONT AUSSI DES MOTS COURANTS SONT VOLONTAIREMENT ABSENTS
// (Nord, Var, Lot, Somme, Manche, Tours, Gap, Nice, Laval...) : « la
// somme », « le nord », « nice to meet you » feraient croire au bon lieu.
const NOMS_DEPARTEMENT: any = {
  "01": ["bourg en bresse"], "02": ["laon"], "03": ["moulins"], "04": ["alpes de haute provence", "digne les bains"],
  "05": ["hautes alpes"], "06": ["alpes maritimes"], "07": ["ardeche", "privas"], "08": ["ardennes", "charleville mezieres"],
  "09": ["ariege"], "10": ["troyes"], "11": ["carcassonne"], "12": ["aveyron", "rodez"],
  "13": ["bouches du rhone", "marseille", "aix en provence"], "14": ["calvados", "caen"], "15": ["cantal", "aurillac"], "16": ["charente", "angouleme"],
  "17": ["charente maritime", "la rochelle"], "18": ["bourges"], "19": ["correze", "tulle"], "20": ["corse", "ajaccio", "bastia"],
  "21": ["cote d or", "dijon"], "22": ["cotes d armor", "saint brieuc"], "23": ["gueret"], "24": ["dordogne", "perigueux"],
  "25": ["besancon"], "26": ["drome", "valence"], "27": ["evreux"], "28": ["eure et loir", "chartres"],
  "29": ["finistere", "quimper", "brest"], "30": ["nimes"], "31": ["haute garonne", "toulouse"], "32": ["gers"],
  "33": ["gironde", "bordeaux"], "34": ["herault", "montpellier"], "35": ["ille et vilaine", "rennes"], "36": ["chateauroux"],
  "37": ["indre et loire"], "38": ["isere", "grenoble"], "39": ["jura", "lons le saunier", "dole"], "40": ["mont de marsan"],
  "41": ["loir et cher", "blois"], "42": ["saint etienne"], "43": ["haute loire", "le puy en velay"], "44": ["loire atlantique", "nantes"],
  "45": ["loiret", "orleans"], "46": ["cahors"], "47": ["lot et garonne", "agen"], "48": ["lozere"],
  "49": ["maine et loire", "angers"], "50": ["saint lo", "cherbourg"], "51": ["chalons en champagne", "reims"], "52": ["haute marne"],
  "53": ["mayenne"], "54": ["meurthe et moselle", "nancy"], "55": ["bar le duc"], "56": ["morbihan", "vannes", "lorient"],
  "57": ["moselle", "metz"], "58": ["nievre", "nevers"], "59": ["lille"], "60": ["beauvais"],
  "61": ["alencon"], "62": ["pas de calais", "arras"], "63": ["puy de dome", "clermont ferrand"], "64": ["pyrenees atlantiques", "bayonne"],
  "65": ["hautes pyrenees", "tarbes"], "66": ["pyrenees orientales", "perpignan"], "67": ["bas rhin", "strasbourg"], "68": ["haut rhin", "colmar", "mulhouse"],
  "69": ["lyon"], "70": ["haute saone", "vesoul"], "71": ["saone et loire", "macon", "chalon sur saone"], "72": ["sarthe", "le mans"],
  "73": ["savoie", "chambery"], "74": ["haute savoie", "annecy"], "75": ["paris"], "76": ["seine maritime", "rouen", "le havre"],
  "77": ["seine et marne", "melun"], "78": ["yvelines", "versailles"], "79": ["deux sevres", "niort"], "80": ["amiens"],
  "81": ["albi"], "82": ["tarn et garonne", "montauban"], "83": ["toulon"], "84": ["vaucluse", "avignon"],
  "85": ["vendee", "la roche sur yon"], "86": ["poitiers"], "87": ["haute vienne", "limoges"], "88": ["vosges", "epinal"],
  "89": ["yonne", "auxerre"], "90": ["belfort"], "91": ["essonne", "evry"], "92": ["hauts de seine", "nanterre"],
  "93": ["seine saint denis", "bobigny"], "94": ["val de marne", "creteil"], "95": ["val d oise", "cergy", "pontoise"], "971": ["guadeloupe"],
  "972": ["martinique"], "973": ["guyane"], "974": ["la reunion"], "976": ["mayotte"],
};

// LE LIEU. 🆕 01/10 — LE DEPARTEMENT SUFFIT DESORMAIS. Le quatrieme essai
// a montre trois sites tres probables refuses pour « ville absente » :
// FIDUCIE CONSULTANTS AGEN, inscrit a Boe (commune voisine d Agen), dont
// le site parle d Agen ; LDS 39, inscrit a Foucherans, a cote de Dole ;
// AUDIT GESTION CONSEIL, a Saint-Apollinaire, a cote de Dijon. Les petits
// cabinets donnent la grande ville voisine, pas leur commune. Un code
// postal du meme departement sur la page vaut donc lieu.
function lieuDe(brut: string, t: string, l: any): string | null {
  const ville = plat(l.ville);
  const cp = String(l.code_postal || "").replace(/\D/g, "");
  if (ville.length >= 3 && (" " + t + " ").indexOf(" " + ville + " ") >= 0) return "ville";
  // 🆕 08/10 — le code postal est un nombre entier : « 54000 » dans
  // « 0354000112 » (un telephone) n est pas un code postal.
  if (cp.length === 5 && new RegExp("(^|[^0-9])" + cp + "([^0-9]|$)").test(brut)) return "code postal";
  if (cp.length === 5) {
    const dep = cp.slice(0, 2);
    const motif = new RegExp("(^|[^0-9])" + dep + "[0-9]{3}([^0-9]|$)");
    if (motif.test(brut)) return "departement";
    const cle = dep === "97" ? cp.slice(0, 3) : dep;
    const noms: string[] = NOMS_DEPARTEMENT[cle] || [];
    for (const n of noms) {
      if ((" " + t + " ").indexOf(" " + n + " ") >= 0) return "departement (" + n + ")";
    }
  }
  return null;
}

// L IDENTITE : c est bien CE cabinet.
// 🆕 01/10 — DEUX PREUVES DE PLUS : le nom complet du cabinet ecrit tel
// quel (« Audit Gestion Conseil » : trois mots generiques, donc aucun mot
// distinctif, et pourtant c est son nom) ; et le sigle, quand le domaine
// est forme sur ce sigle ET que la page l ecrit (agcexpertise.fr qui ecrit
// « AGC »).
function identiteDe(t: string, l: any, domaine: string, metier?: string): string | null {
  const nom = mots(l.dirigeant_nom).filter(function (m) { return m.length >= 3; });
  if (nom.length > 0 && nom.every(function (m) { return contientMot(t, m); })) return "nom";

  // 🆕 07/10 — le nom sans ses parentheses, et les mots generiques du metier.
  const parts = decoupe(l.raison_sociale);
  const generiques = generiquesDe(metier || "");
  const raison = mots(parts.nom).filter(function (m) { return FORMES.indexOf(m) < 0; });
  const coeur = raison
    .filter(function (m) { return generiques.indexOf(m) < 0; })
    .filter(function (m) { return m.length >= 3; })
    // 🆕 07/10 — un nombre seul ne prouve rien (« 81 », « 2000 »).
    .filter(function (m) { return !/^[0-9]+$/.test(m); });
  // 🚨🆕 07/10 (soir) — DES MOTS COURANTS NE FONT PAS UNE IDENTITE. Mesure
  // sur les organismes : « ASSOCIATION CONTACT PLUS » (Colmar) et « AS
  // CONDUITE PARIS 2 » ont recu le meme site, acp-formation.fr. Pour le
  // premier, les mots « contact » et « plus » etaient sur la page — comme
  // sur n importe quelle page. Tous les mots distinctifs sur la page ne
  // suffisent donc plus : il faut en plus que le NOM DU SITE porte l un
  // d eux (quatre lettres au moins), ou qu ils soient ecrits a la suite
  // (« contact plus »), s ils sont au moins deux.
  if (coeur.length > 0 && coeur.every(function (m) { return contientMot(t, m); })) {
    const nomSite = domaine.replace(/[^a-z0-9]/g, "");
    const dansLeSite = coeur.some(function (m) { return m.length >= 4 && nomSite.indexOf(m) >= 0; });
    const aLaSuite = coeur.length >= 2 && (" " + t + " ").indexOf(" " + coeur.join(" ") + " ") >= 0;
    if (dansLeSite || aLaSuite) return "cabinet";
  }

  if (raison.length >= 2 && (" " + t + " ").indexOf(" " + raison.join(" ") + " ") >= 0) return "nom complet du cabinet";

  // 🆕 07/10 — L ENSEIGNE (la parenthese du nom) : tous ses mots distinctifs
  // sur la page, ou l enseigne ecrite telle quelle.
  for (const e of parts.enseignes) {
    const me = mots(e).filter(function (m) { return FORMES.indexOf(m) < 0; });
    const ce = me
      .filter(function (m) { return generiques.indexOf(m) < 0; })
      .filter(function (m) { return m.length >= 4 && !/^[0-9]+$/.test(m); });
    if (ce.length > 0 && ce.every(function (m) { return contientMot(t, m); })) return "enseigne";
    if (me.length >= 2 && (" " + t + " ").indexOf(" " + me.join(" ") + " ") >= 0) return "enseigne complete";
  }

  const sigle = sigleDe(l.raison_sociale);
  if (sigle && sigle.length >= 3 && domaine.replace(/[^a-z0-9]/g, "").indexOf(sigle) >= 0 && contientMot(t, sigle)) {
    return "sigle";
  }

  // 🆕 01/10 (essai avocats) — UN MOT DISTINCTIF DU NOM, A LA FOIS DANS LE
  // DOMAINE ET SUR LA PAGE. « SAS LEGALPS AVOCATS-HERLEMONT ET ASSOCIES »
  // a pour site legalps-avocats.com, qui ecrit « Legalps » partout mais pas
  // « Herlemont » : exiger tous les mots du nom le faisait refuser. Le mot
  // doit avoir au moins cinq lettres, et le metier et le lieu restent exiges.
  const nomDomaine = domaine.replace(/[^a-z0-9]/g, "");
  const distinctifs = coeur.concat(mots(l.dirigeant_nom))
    .filter(function (m) { return m.length >= 5; });
  for (const m of distinctifs) {
    if (nomDomaine.indexOf(m) >= 0 && contientMot(t, m)) return "nom du domaine";
  }
  return null;
}

// 🚨 LA VERIFICATION. Rend la preuve trouvee, ou null.
// La regle ne change pas : SIREN, ou bien METIER + LIEU + IDENTITE. Seuls
// le lieu (departement admis) et l identite (nom complet, sigle) s elargissent.
function verifier(html: string, l: any, metier: string, domaine: string): string | null {
  const brut = texteDe(html);
  if (porteSiren(brut, l.siren)) return "siren";

  // 🆕 01/10 — LE TEXTE VISIBLE ET LE CODE DE LA PAGE ENSEMBLE : beaucoup de
  // sites recents (Wix, React) ont leur texte dans des scripts, que
  // texteDe retire. Le titre et la description y sont aussi.
  const t = plat(brut + " " + html.slice(0, 200000));
  const metierOk = (PREUVES_METIER[metier] || []).some(function (p: string) {
    return t.indexOf(plat(p)) >= 0 || t.indexOf(p) >= 0;
  });
  if (!metierOk) return null;

  const identite = identiteDe(t, l, domaine, metier);
  if (!identite) return null;

  const lieu = lieuDe(brut, t, l);
  // 🚨🆕 08/10 — LE NOM DE FAMILLE SEUL, AVEC UN LIEU QUI N EST PAS LA VILLE.
  // Mesure du 07/10 au soir, sites ouverts un a un : parmi les sites
  // retenus sur « nom + code postal » ou « nom + departement » dont le nom
  // ne porte pas celui de la societe, UN SUR DEUX etait un homonyme —
  // « FGB » (Melun) → bureau-avocat.com, un cabinet du Maroc ; Maitre
  // Olivier BAUER (Nancy) → camillebauer-avocats.fr (Paris) ; LINDE FRANCE
  // → fayolle-conseil.fr, un conseiller en patrimoine ; COFIVA (Aube) →
  // cabinet-roux.com (pres de Nantes).
  // ⚠️ AVEC LA VILLE EXACTE, RIEN NE CHANGE : controle sur 30 sites tires
  // au hasard, les 30 etaient bons.
  // Dans ce seul cas (nom seul, lieu = code postal ou departement), il faut
  // une preuve de plus : voir `preuveDeLaPersonne`.
  if (lieu && identite === "nom" && lieu !== "ville") {
    const plus = preuveDeLaPersonne(t, l, metier, domaine, lieu);
    if (plus) return identite + " + " + lieu + " + " + plus;
  } else if (lieu) {
    return identite + " + " + lieu;
  }

  // 🆕 01/10 — SANS LIEU, DEUX IDENTITES INDEPENDANTES SUFFISENT : le nom du
  // dirigeant ET (le nom distinctif du cabinet, son nom complet ou son
  // sigle). Deux cabinets homonymes ont rarement le meme dirigeant.
  // 🚨🆕 07/10 — « INDEPENDANTES » N ETAIT PAS VERIFIE. Premiere mesure sur
  // les organismes de formation : « ABDOU FORMATION » retenait
  // cabinet-abdou.fr (le nom de la societe EST le nom du dirigeant : une
  // seule preuve, comptee deux fois), et « 3 2 1... PERMIS » retenait
  // stephanedavid.fr (un nom tres courant, et le mot « permis » sur la
  // page). Sans lieu, la seconde preuve doit desormais tenir a un mot de la
  // societe qui n est PAS le nom du dirigeant, et que le NOM DU SITE porte
  // lui-meme (voir `secondePreuve`).
  if (identite !== "nom") {
    const nom = mots(l.dirigeant_nom).filter(function (m) { return m.length >= 3; });
    if (nom.length > 0 && nom.every(function (m) { return contientMot(t, m); })) {
      const seconde = secondePreuve(t, l, domaine, metier);
      if (seconde) return "nom + " + seconde;
    }
  } else {
    const seconde = secondePreuve(t, l, domaine, metier);
    if (seconde) return "nom + " + seconde;
  }
  return null;
}

// 🆕 08/10 — CE QUI DISTINGUE UNE PERSONNE DE SES HOMONYMES (voir `verifier`).
// L une de ces deux preuves, lues sur la page :
//   · tous les autres mots du nom de la societe (ceux qui ne sont ni le nom
//     du dirigeant, ni un mot du metier, ni une forme juridique) : « CHABERT
//     PATRICK » demande « patrick », « MANUEL GROS, HELOISE HICTER &
//     ASSOCIES » demande « manuel », « heloise » et « hicter » ;
//   · ou le prenom et le nom du dirigeant, ecrits ensemble ;
//   · ou, pour une societe qui ne porte que le nom de son dirigeant : ce
//     nom dans le nom du site ET le code postal exact sur la page.
// MESURE (07/10, 60 sites ouverts un a un, 32 faux et 28 bons) : la regle
// ecarte les 32 faux ; elle perd 4 bons (BAUBET, MANDIN, DIAKOK, ARTHAUD),
// dont la page ne nomme personne.
function preuveDeLaPersonne(t: string, l: any, metier: string, domaine: string, lieu: string): string | null {
  const parts = decoupe(l.raison_sociale);
  const generiques = generiquesDe(metier);
  const nomFamille = mots(l.dirigeant_nom);
  const autres = mots(parts.nom)
    .filter(function (m) { return FORMES.indexOf(m) < 0 && generiques.indexOf(m) < 0 && PETITS.indexOf(m) < 0; })
    .filter(function (m) { return m.length >= 3 && !/^[0-9]+$/.test(m) && nomFamille.indexOf(m) < 0; });
  if (autres.length > 0 && autres.every(function (m) { return contientMot(t, m); })) return "societe sur la page";
  const pn = mots(l.dirigeant_prenom).join(" ");
  const nn = nomFamille.join(" ");
  if (pn.length >= 3 && nn.length >= 3) {
    const tt = " " + t + " ";
    if (tt.indexOf(" " + pn + " " + nn + " ") >= 0 || tt.indexOf(" " + nn + " " + pn + " ") >= 0) return "prenom et nom";
  }
  // La societe ne porte QUE le nom de son dirigeant (« FORNES EXPERTISE ET
  // CONSEIL », « GERAY AVOCATS »), le nom du site porte ce nom, et la page
  // ecrit le CODE POSTAL EXACT de la fiche : c est le site du cabinet.
  // ⚠️ Avec le seul departement, non : « CABINET S. LESAGE » (Mons-en-
  // Baroeul) retenait cabinet-lesage.fr, un autre expert-comptable du Nord.
  if (autres.length === 0 && lieu === "code postal" && nn.length >= 4
    && domaine.replace(/[^a-z0-9]/g, "").indexOf(nomFamille.join("")) >= 0) return "nom du site";
  return null;
}

// 🆕 07/10 — LA SECONDE PREUVE, QUAND LA PAGE NE DIT PAS LE LIEU.
// Un mot distinctif de la societe ou de son enseigne (quatre lettres au
// moins, ni un nombre, ni un mot du metier, ni le nom ou le prenom du
// dirigeant), ecrit sur la page ET dans le nom du site. Ou le sigle, forme
// sur le nom du site et ecrit sur la page.
function secondePreuve(t: string, l: any, domaine: string, metier: string): string | null {
  const parts = decoupe(l.raison_sociale);
  const generiques = generiquesDe(metier);
  const personne = mots(l.dirigeant_nom).concat(mots(l.dirigeant_prenom));
  const nomDomaine = domaine.replace(/[^a-z0-9]/g, "");
  const distinctif = function (texte: string): boolean {
    return mots(texte)
      .filter(function (m) { return FORMES.indexOf(m) < 0 && generiques.indexOf(m) < 0; })
      .filter(function (m) { return m.length >= 4 && !/^[0-9]+$/.test(m) && personne.indexOf(m) < 0; })
      .some(function (m) { return nomDomaine.indexOf(m) >= 0 && contientMot(t, m); });
  };
  if (distinctif(parts.nom)) return "nom du domaine";
  for (const e of parts.enseignes) {
    if (distinctif(e)) return "enseigne dans le domaine";
  }
  const sigle = sigleDe(l.raison_sociale);
  if (sigle && sigle.length >= 3 && nomDomaine.indexOf(sigle) >= 0 && contientMot(t, sigle)) return "sigle";
  // 🆕 07/10 — LE PRENOM ET LE NOM DU DIRIGEANT, ECRITS ENSEMBLE. Mesure du
  // 07/10 sur les avocats : « WATRIN DIDIER » sur watrin-avocat.fr est tres
  // probablement le bon, mais « FONTAINE » sur fontaine-avocat.fr, sans la
  // ville, peut etre n importe quel Maitre Fontaine. Le nom seul ne suffit
  // plus ; « Didier Watrin » (ou « Watrin Didier ») sur la page, oui.
  const pn = mots(l.dirigeant_prenom).join(" ");
  const nn = mots(l.dirigeant_nom).join(" ");
  // ⚠️ SEULEMENT POUR LES METIERS DONT LA PREUVE EST NETTE (avocat,
  // expert-comptable). « Formation », « boutique », « recrutement » se lisent
  // sur le site personnel de n importe quel homonyme : pour ces metiers, le
  // prenom et le nom ne suffisent pas sans le lieu.
  if (!METIERS[metier] && pn.length >= 3 && nn.length >= 3) {
    const tt = " " + t + " ";
    if (tt.indexOf(" " + pn + " " + nn + " ") >= 0 || tt.indexOf(" " + nn + " " + pn + " ") >= 0) return "prenom et nom";
  }
  return null;
}

// 🆕 01/10 — POURQUOI UNE PAGE A ETE REFUSEE (mode essai seulement).
// Le premier essai a montre 11 cabinets sur 30 dont un domaine devine
// existait sans etre retenu : sans la raison, on reglerait a l aveugle.
function pourquoiRefuse(html: string, l: any, metier: string, domaine: string): string {
  const brut = texteDe(html);
  if (plat(brut).length < 200) return "page presque vide (site en construction, redirection, ou lecture bloquee)";
  const t = plat(brut + " " + html.slice(0, 200000));
  const metierOk = (PREUVES_METIER[metier] || []).some(function (p: string) {
    return t.indexOf(plat(p)) >= 0;
  });
  if (!metierOk) return "metier absent de la page";
  if (!lieuDe(brut, t, l)) return "ni la ville, ni le code postal, ni le departement";
  if (!identiteDe(t, l, domaine, metier)) return "ni le nom du dirigeant, ni celui du cabinet, ni son enseigne, ni son sigle";
  return "refus sans raison connue";
}

// 🆕 LE LIEN LINKEDIN AFFICHE SUR LE SITE (meme regle que lire-sites : on
// ne lit jamais LinkedIn, on garde le lien que le cabinet publie).
function linkedinDe(html: string): string | null {
  const liens = html.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in|school)\/[A-Za-z0-9_%\-.]+/gi) || [];
  if (liens.length === 0) return null;
  const societe = liens.find(function (x) { return x.toLowerCase().indexOf("/company/") > 0; });
  return (societe || liens[0]).replace(/[.\-]+$/, "").slice(0, 200);
}

// LE DOMAINE D UN SITE SUGGERE (« www.cabinet.fr/contact » → « cabinet.fr »).
function domaineDe(v: any): string | null {
  let s = String(v || "").trim().replace(/\s+/g, "");
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const h = new URL(s).hostname.toLowerCase().replace(/^www\./, "");
    return h.indexOf(".") > 0 ? h : null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕 08/10 — LE REGISTRE OFFICIEL DES ENTREPRISES.
// Demande de Jacques (07/10) : « passer par l equivalent de societe.com en
// fonction du SIREN, du nom et prenom du gerant ou du nom de la societe,
// pour recouper les bonnes informations ».
// L API publique « recherche d entreprises » (api.gouv.fr) est gratuite et
// sans cle. Elle ne donne NI adresse de courriel, NI telephone, NI site :
// elle donne ce qui AIDE A TROUVER LE SITE ET A LE RECONNAITRE —
//   · le nom commercial et les enseignes (souvent le nom du site) ;
//   · le dirigeant (nom et prenom), la commune et le code postal du siege ;
//   · le SIREN, que les mentions legales du bon site portent (la preuve la
//     plus sure) ;
//   · l etat de la societe : une societe FERMEE n est plus cherchee.
// ⛔ RIEN N EST ECRIT EN BASE : ce que le registre apporte complete la
// fiche LE TEMPS DE LA RECHERCHE, sans jamais remplacer ce qu elle porte
// deja (un champ deja rempli n est pas touche).
// ⛔ SANS SIREN SUR LA FICHE, la societe du registre n est retenue que si
// son nom est EXACTEMENT celui de la fiche, dans le MEME code postal, et
// qu elle est LA SEULE dans ce cas. Un homonyme donnerait le SIREN d un
// autre, donc le site d un autre.
// ⚠️ Cadence lue le 07/10 : 7 demandes par seconde et par adresse. Les
// lignes d un paquet partent ensemble : chaque demande est donc decalee
// de 200 ms selon son rang. Une reponse 429 (trop de demandes), une erreur
// ou un delai depasse : on continue SANS le registre, comme avant.
// ⚠️ ?registre=non : la recherche se fait sans le registre (pour comparer).
const REGISTRE_URL = "https://recherche-entreprises.api.gouv.fr/search";
const DELAI_REGISTRE_MS = 4000;
let registreActif = true;
// 🆕 08/10 (2) — CE QUE LE REGISTRE A REPONDU PENDANT CE PASSAGE. Premier
// essai en ligne : 40 fiches, aucune completee, et rien ne disait pourquoi
// (une erreur du registre etait avalee en silence). Desormais la reponse
// du passage le dit : demandes parties, reponses lues, societes retenues,
// fiches sans SIREN ni code postal, et le premier refus rencontre.
const registreEtat: any = { demandes: 0, reponses: 0, retenues: 0, sans_demande: 0, premier_refus: "" };

function nomRegistre(v: any): string {
  return mots(decoupe(v).nom).filter(function (m) { return FORMES.indexOf(m) < 0; }).join(" ");
}

async function registre(l: any, rang: number): Promise<any> {
  if (!registreActif) return null;
  const siren = String(l.siren || "").replace(/\D/g, "");
  const cp = String(l.code_postal || "").replace(/\D/g, "");
  const nomFiche = nomRegistre(l.raison_sociale);
  let url = "";
  if (siren.length === 9) url = REGISTRE_URL + "?q=" + siren + "&per_page=1";
  else if (nomFiche.length >= 3 && cp.length === 5) {
    url = REGISTRE_URL + "?q=" + encodeURIComponent(decoupe(l.raison_sociale).nom.slice(0, 120))
      + "&code_postal=" + cp + "&per_page=10";
  } else { registreEtat.sans_demande++; return null; }

  if (rang > 0) await new Promise(function (ok) { setTimeout(ok, rang * 200); });
  const stop = new AbortController();
  const minuteur = setTimeout(function () { stop.abort(); }, DELAI_REGISTRE_MS);
  let liste: any[] = [];
  try {
    const r = await fetch(url, {
      cache: "no-store",
      signal: stop.signal,
      headers: { "User-Agent": "AcademIA-Pro-enrichissement/1.0 (contact@academiapro.fr)", "Accept": "application/json" },
    });
    registreEtat.demandes++;
    if (!r.ok) {
      if (!registreEtat.premier_refus) registreEtat.premier_refus = "http " + r.status;
      return null;
    }
    const j: any = await r.json();
    liste = Array.isArray(j && j.results) ? j.results : [];
    registreEtat.reponses++;
  } catch (e: any) {
    if (!registreEtat.premier_refus) {
      const cause = e && e.cause ? " (" + String(e.cause.code || e.cause.message || e.cause).slice(0, 80) + ")" : "";
      registreEtat.premier_refus = String((e && (e.name + " : " + e.message)) || e).slice(0, 160) + cause;
    }
    return null;
  } finally {
    clearTimeout(minuteur);
  }

  let e: any = null;
  if (siren.length === 9) {
    e = liste.find(function (x: any) { return String(x.siren || "") === siren; }) || null;
  } else {
    const memes = liste.filter(function (x: any) {
      const s = x.siege || {};
      if (String(s.code_postal || "") !== cp) return false;
      return nomRegistre(x.nom_raison_sociale) === nomFiche || nomRegistre(x.nom_complet) === nomFiche;
    });
    if (memes.length === 1) e = memes[0];
  }
  if (!e) return null;
  registreEtat.retenues++;

  const s = e.siege || {};
  const enseignes: string[] = [];
  const ajouter = function (v: any) {
    const t = String(v || "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
    if (t.length < 3 || t.length > 80) return;
    const p = plat(t);
    if (!p || p === plat(decoupe(l.raison_sociale).nom)) return;
    if (enseignes.some(function (x) { return plat(x) === p; })) return;
    enseignes.push(t);
  };
  ajouter(s.nom_commercial);
  for (const x of (Array.isArray(s.liste_enseignes) ? s.liste_enseignes : [])) ajouter(x);
  ajouter(e.sigle);

  // Le premier dirigeant qui est une personne (il porte un nom et un prenom).
  const personne = (Array.isArray(e.dirigeants) ? e.dirigeants : []).find(function (d: any) {
    return d && d.nom && d.prenoms;
  }) || null;

  return {
    siren: String(e.siren || ""),
    fermee: String(e.etat_administratif || "") === "C",
    enseignes: enseignes.slice(0, 3),
    dirigeant_nom: personne ? String(personne.nom) : "",
    dirigeant_prenom: personne ? String(personne.prenoms).split(/[\s,]+/)[0] : "",
    ville: String(s.libelle_commune || ""),
    code_postal: String(s.code_postal || ""),
  };
}

// LA FICHE, COMPLETEE PAR LE REGISTRE POUR LA DUREE DE LA RECHERCHE.
// ⛔ Un champ deja rempli sur la fiche n est jamais remplace. Les enseignes
// s ajoutent entre parentheses a la suite du nom : c est la forme que
// `decoupe` lit deja (« DANIEL ARZOINE (VOYAGEOSCOPE) »). Une enseigne
// n est jamais crue sur parole : le site qu elle fait deviner passe la meme
// verification que les autres.
function completer(l: any, reg: any): any {
  if (!reg) return l;
  const c: any = Object.assign({}, l);
  const vide = function (v: any) { return String(v == null ? "" : v).trim() === ""; };
  if (String(c.siren || "").replace(/\D/g, "").length !== 9 && reg.siren.length === 9) c.siren = reg.siren;
  if (vide(c.dirigeant_nom) && reg.dirigeant_nom) {
    c.dirigeant_nom = reg.dirigeant_nom;
    if (vide(c.dirigeant_prenom) && reg.dirigeant_prenom) c.dirigeant_prenom = reg.dirigeant_prenom;
  }
  if (vide(c.ville) && reg.ville) c.ville = reg.ville;
  if (vide(c.code_postal) && reg.code_postal) c.code_postal = reg.code_postal;
  const dejaLa = decoupe(c.raison_sociale);
  const connues = [plat(dejaLa.nom)].concat(dejaLa.enseignes.map(function (x) { return plat(x); }));
  let nom = String(c.raison_sociale || "");
  for (const e of reg.enseignes) {
    if (connues.indexOf(plat(e)) >= 0) continue;
    connues.push(plat(e));
    nom += " (" + e + ")";
  }
  c.raison_sociale = nom;
  return c;
}

// CHERCHER LE SITE D UNE LIGNE.
// 🆕 05/10 — `limite` : l heure a laquelle on s arrete pour cette ligne.
// Elle est verifiee avant chaque domaine et avant chaque page annexe.
async function chercher(ligne: any, metier: string, limite: number, rang?: number): Promise<any> {
  // 🆕 08/10 — LE REGISTRE D ABORD (voir `registre`). Une societe fermee
  // n est pas cherchee ; sinon la fiche est completee pour cette recherche.
  const reg = await registre(ligne, rang || 0);
  if (reg && reg.fermee) {
    return { site: null, raison: "societe fermee au registre", testes: 0, existants: 0, fermee: true, registre: reg };
  }
  const l = completer(ligne, reg);
  const liste = candidats(l, metier);
  // 🚨 LE SITE SUGGERE PASSE EN PREMIER, MAIS IL EST VERIFIE COMME LES AUTRES.
  // Dropcontact a donne un site a certains cabinets sans trouver d adresse :
  // verifie le 01/10, le tout premier etait celui d une societe
  // neerlandaise homonyme (« R.M.C. » d Agen → aukjereinders.nl). Un site
  // suggere n est donc qu un candidat de plus, jamais une verite.
  const suggere = domaineDe(l.site_suggere);
  if (suggere) {
    const i = liste.indexOf(suggere);
    if (i >= 0) liste.splice(i, 1);
    liste.unshift(suggere);
  }
  // 🆕 07/10 — LE SITE ECRIT DANS LE NOM (« SAS MELINE (WWW.PARFUMDO.COM) »)
  // passe en tout premier. Lui aussi est verifie comme les autres.
  const ecrits = decoupe(l.raison_sociale).domaines;
  for (let k = ecrits.length - 1; k >= 0; k--) {
    const i = liste.indexOf(ecrits[k]);
    if (i >= 0) liste.splice(i, 1);
    liste.unshift(ecrits[k]);
  }
  if (liste.length === 0) return { site: null, raison: "aucun nom exploitable", testes: 0, existants: 0, registre: reg };

  // Toutes les questions DNS en meme temps : elles coutent quelques
  // millisecondes, et la plupart des domaines devines n existent pas.
  const reponses = await existentTous(liste, limite);
  const existants = liste.filter(function (_d, i) { return reponses[i]; });

  const journal: any[] = [];
  let ouverts = 0;
  let tropLong = false;
  for (const d of existants) {
    if (ouverts >= MAX_DOMAINES_OUVERTS) break;
    if (Date.now() > limite) { tropLong = true; break; }
    ouverts++;
    // ⚠️ PAS DE REPLI EN « http:// » : trois essais par domaine sur quatre
    // domaines, c etait jusqu a 48 secondes pour une seule ligne qui ne
    // repond pas. Les sites de cabinets sont aujourd hui en https.
    const ouvert = await ouvrir(d, limite);
    if (!estPage(ouvert)) { journal.push({ domaine: d, refus: "page illisible : " + ouvert.erreur }); continue; }
    const page = ouvert;

    let preuve = verifier(page.html, l, metier, d);
    // ⚠️ L ACCUEIL NE PORTE PAS TOUJOURS LE SIREN : les mentions legales,
    // oui. On ne les ouvre que si l accueil parle deja du metier — sinon,
    // c est un autre site, inutile de chercher plus loin.
    if (!preuve) {
      const t = plat(texteDe(page.html) + " " + page.html.slice(0, 200000));
      const parleMetier = (PREUVES_METIER[metier] || []).some(function (p: string) {
        return t.indexOf(plat(p)) >= 0;
      });
      if (parleMetier) {
        let origineMentions = "";
        try { origineMentions = new URL(page.finale).origin; } catch { origineMentions = "https://" + d; }
        // 🆕 01/10 (cinquieme essai) — LES LIENS DE L ACCUEIL D ABORD. Les
        // chemins devines (« /mentions-legales ») renvoyaient souvent
        // l accueil lui-meme (un site qui ne connait pas la page renvoie sa
        // page d accueil au lieu d une erreur) : trois « lectures » pour
        // rien, et la page contact n etait jamais atteinte. On suit
        // maintenant les liens que l accueil donne lui-meme vers ses pages
        // contact, mentions, cabinet, equipe — puis les chemins devines.
        // ⚠️ Une page identique a l accueil ne compte pas.
        const urls = liensAnnexes(page.html, page.finale)
          .concat(PAGES_MENTIONS.map(function (c) { return origineMentions + c; }));
        const vues: any = {};
        const debutAccueil = page.html.slice(0, 3000);
        let annexesLues = 0;
        for (const u of urls) {
          if (annexesLues >= 4) break;
          if (Date.now() > limite) break;
          if (vues[u]) continue;
          vues[u] = true;
          const m = await lire(u);
          if (!estPage(m)) continue;
          if (m.html.slice(0, 3000) === debutAccueil) continue;
          annexesLues++;
          if (porteSiren(texteDe(m.html), l.siren)) { preuve = "siren"; break; }
          // 🆕 LA PAGE ANNEXE COMPLETE L ACCUEIL : le metier et le nom peuvent
          // etre sur l accueil, la ville sur la page contact.
          const v = verifier(page.html + " " + m.html, l, metier, d);
          if (v) { preuve = v; break; }
        }
      }
    }
    if (!preuve) {
      let finale = d;
      try { finale = new URL(page.finale).hostname; } catch { finale = d; }
      journal.push({ domaine: d, arrive_sur: finale, refus: pourquoiRefuse(page.html, l, metier, d) });
    }
    if (preuve) {
      let origine = "";
      try { origine = new URL(page.finale).origin; } catch { origine = "https://" + d; }
      return {
        site: origine,
        preuve: preuve,
        linkedin: linkedinDe(page.html),
        testes: liste.length,
        existants: existants.length,
        domaines_existants: existants.slice(0, 8),
        journal: journal,
        registre: reg,
      };
    }
  }
  // 🆕 05/10 — l heure limite est aussi verifiee en sortie : les questions
  // DNS ont pu s arreter avant d avoir tout demande.
  if (Date.now() > limite) tropLong = true;
  return {
    site: null,
    raison: tropLong ? "delai depasse pour cette ligne"
      : (existants.length === 0 ? "aucun domaine existant" : "aucun site verifie"),
    testes: liste.length,
    existants: existants.length,
    domaines_existants: existants.slice(0, 8),
    journal: journal,
    trop_long: tropLong,
    registre: reg,
  };
}

// LES LIGNES A TRAITER : sans site, sans adresse, jamais cherchees.
async function aChercher(conf: any, combien: number, debut: number): Promise<any> {
  return await supabase
    .from(conf.table)
    .select("*")
    .is("site_cherche_le", null)
    .is("email", null)
    .or("site_web.is.null,site_web.eq.")
    // 🆕 07/10 — « n est pas desabonne » : une case vide vaut « non ». Avec
    // « = faux », une fiche dont la case est vide n aurait jamais ete cherchee.
    .not("desabonne", "is", true)
    // 🆕 01/10 (soir) — LES CABINETS « [ND] » (non diffusibles : l INSEE ne
    // publie pas leur nom) sont ecartes. Sans nom, aucun site ne peut se
    // deviner, et Dropcontact leur avait attribue celui du « ND »… du
    // Dakota du Nord.
    .neq("raison_sociale", "[ND]")
    .order(conf.ordre, { ascending: true })
    .order("id", { ascending: true })
    // 🆕 ?debut= (essai seulement) : mesurer sur un autre echantillon que
    // les trente premieres lignes, qui sont les plus gros cabinets.
    .range(debut, debut + combien - 1);
}

async function traiter(nom: string, combien: number, depart: number, essai: boolean, debut: number): Promise<any> {
  const conf = TABLES[nom];
  const { data: lignes, error } = await aChercher(conf, combien, essai ? debut : 0);
  if (error) return { table: conf.table, erreur: error.message };
  if (!lignes || lignes.length === 0) return { table: conf.table, info: "rien a chercher" };

  let trouves = 0;
  let parSiren = 0;
  let parNom = 0;
  let sansDomaine = 0;
  let nonVerifies = 0;
  let traites = 0;
  // 🆕 05/10 — ce qui ne se voyait pas : les lignes abandonnees parce que
  // trop longues, les erreurs, les ecritures que la base a refusees.
  let tropLongues = 0;
  let erreurs = 0;
  let reseaux = 0;
  // 🆕 08/10 — le registre : societes fermees (non cherchees), fiches que
  // le registre a completees, sites trouves sur une fiche completee.
  let fermees = 0;
  let avecRegistre = 0;
  let trouvesAvecRegistre = 0;
  let refus = 0;
  let premierRefus = "";
  let premiereErreur = "";
  let arret = "";
  const exemples: any[] = [];
  // 🆕 EN ESSAI : le detail de chaque ligne ou un domaine existait.
  const details: any[] = [];

  for (let i = 0; i < lignes.length; i += PARALLELE) {
    // 🚨 ON REND LA MAIN AVANT QUE VERCEL COUPE : ce qui est ecrit est
    // acquis, le passage suivant reprend la.
    if (Date.now() - depart > DUREE_MAX_MS) break;
    const paquet = lignes.slice(i, i + PARALLELE);

    // 🚨🆕 05/10 — ON MARQUE LE PAQUET « CHERCHE » AVANT DE CHERCHER, ET ON
    // VERIFIE QUE LA BASE L A ACCEPTE.
    // AVANT : `site_cherche_le` etait ecrit apres le travail de tout le
    // paquet. Si une seule ligne ne finissait pas, rien n etait ecrit, et le
    // passage suivant reprenait les memes lignes — c est ce qui a arrete la
    // recherche du 02/10 au 05/10.
    // ⚠️ LE PRIX : si Vercel coupe quand meme au milieu d un paquet, ses
    // douze lignes au plus sont marquees sans avoir ete cherchees. C est le
    // choix fait : perdre douze lignes plutot qu arreter toute la recherche.
    // ⛔ SI LE MARQUAGE EST REFUSE, ON NE CHERCHE RIEN : chercher sans
    // pouvoir marquer, c est rechercher les memes lignes sans fin.
    // ⛔ EN ESSAI, RIEN N EST MARQUE.
    if (!essai) {
      const { error: errMarque } = await supabase.from(conf.table)
        .update({ site_cherche_le: new Date().toISOString() })
        .in("id", paquet.map(function (l: any) { return l.id; }));
      if (errMarque) {
        arret = "marquage impossible : " + String(errMarque.message || errMarque).slice(0, 200);
        break;
      }
    }

    const resultats = await Promise.all(paquet.map(function (l: any, rang: number) {
      return avecLimite(
        function () { return chercher(l, conf.metier, Date.now() + DUREE_LIGNE_MS, rang); },
        LIMITE_LIGNE_MS,
        function () {
          console.log("trouver-sites : ligne trop longue, abandonnee", conf.table, l.id);
          return { site: null, raison: "delai depasse pour cette ligne", testes: 0, existants: 0, trop_long: true };
        },
        function (e: any) {
          const texteErreur = String((e && e.message) || e).slice(0, 200);
          if (!premiereErreur) premiereErreur = texteErreur;
          console.log("trouver-sites : erreur sur une ligne", conf.table, l.id, texteErreur);
          return { site: null, raison: "erreur", testes: 0, existants: 0, en_erreur: true };
        }
      );
    }));

    let longuesDuPaquet = 0;
    for (let k = 0; k < paquet.length; k++) {
      const l = paquet[k];
      const r = resultats[k];
      traites++;
      if (r.registre && !r.fermee) avecRegistre++;

      // 🆕 05/10 — L ECRITURE D ABORD, ET VERIFIEE : un site n est compte
      // « trouve » que si la base l a enregistre. `site_cherche_le` est deja
      // ecrit (le paquet est marque) : il ne reste que le site.
      let ecrit = true;
      // 🚨🆕 07/10 — LE SITE D UN RESEAU N EST PAS LE SITE D UNE AGENCE.
      // « ACTUAL SAUMUR 1096 », « SUP INTERIM 81 », une agence d une
      // enseigne immobiliere : le site trouve est celui du reseau, et il
      // passe la verification (le nom du reseau, la ville, le metier). Ecrit
      // sur chaque agence, il donnerait a des centaines de fiches la meme
      // adresse generique du siege. Un site deja porte par une autre fiche
      // de la base n est donc plus ecrit (SEUIL_RESEAU).
      if (r.site) {
        const { count: dejaPorte, error: errReseau } = await supabase.from(conf.table)
          .select("id", { count: "exact", head: true }).eq("site_web", r.site);
        if (!errReseau && (dejaPorte || 0) >= SEUIL_RESEAU) {
          r.site = null;
          r.reseau = true;
        }
      }
      if (r.site && !essai) {
        const maj: any = { site_web: r.site, site_trouve_par: "devine:" + r.preuve };
        if (r.linkedin && Object.prototype.hasOwnProperty.call(l, "linkedin") && !l.linkedin) {
          maj.linkedin = r.linkedin;
        }
        let reste: any = (await supabase.from(conf.table).update(maj).eq("id", l.id)).error;
        if (reste && maj.linkedin) {
          // Le lien LinkedIn est la seule colonne facultative : sans lui.
          delete maj.linkedin;
          reste = (await supabase.from(conf.table).update(maj).eq("id", l.id)).error;
        }
        if (reste) {
          ecrit = false;
          refus++;
          if (!premierRefus) premierRefus = String(reste.message || reste).slice(0, 200);
          console.log("trouver-sites : ecriture refusee", conf.table, l.id, String(reste.message || reste).slice(0, 200));
        }
      }

      if (r.site && ecrit) {
        trouves++;
        if (r.registre) trouvesAvecRegistre++;
        if (r.preuve === "siren") parSiren++; else parNom++;
        if (exemples.length < 12) {
          exemples.push({ cabinet: l.raison_sociale, ville: l.ville, site: r.site, preuve: r.preuve });
        }
      } else if (r.site) {
        // trouve, mais non enregistre : compte dans `ecritures_refusees`.
      } else if (r.reseau) {
        reseaux++;
      } else if (r.fermee) {
        fermees++;
      } else if (r.en_erreur) {
        erreurs++;
      } else if (r.trop_long) {
        tropLongues++;
        longuesDuPaquet++;
      } else if (r.existants === 0) {
        sansDomaine++;
      } else {
        nonVerifies++;
      }
      if (essai && r.existants > 0 && details.length < 40) {
        details.push({
          cabinet: l.raison_sociale,
          dirigeant: [l.dirigeant_prenom, l.dirigeant_nom].filter(Boolean).join(" "),
          ville: l.ville,
          site_retenu: r.site || null,
          domaines_existants: r.domaines_existants,
          refus: r.journal,
          registre: r.registre || null,
        });
      }
    }

    // 🆕 05/10 — LA MOITIE D UN PAQUET TROP LONGUE, CE N EST PLUS UNE LIGNE,
    // C EST LE RESEAU (ou le service DNS). On arrete ce passage plutot que
    // de marquer « cherchees », paquet apres paquet, des lignes qu on
    // n arrive pas a chercher ; le passage suivant continue avec les
    // suivantes.
    if (longuesDuPaquet >= 3 && longuesDuPaquet * 2 >= paquet.length) {
      arret = "trop de lignes trop longues dans un meme paquet (" + longuesDuPaquet + " sur " + paquet.length
        + ") : passage arrete, le suivant continue";
      break;
    }
  }

  if (arret && traites === 0) return { table: conf.table, erreur: arret, arret: arret };

  return {
    table: conf.table,
    lignes_examinees: traites,
    sites_trouves: trouves,
    dont_par_siren: parSiren,
    dont_par_nom_et_ville: parNom,
    aucun_domaine_existant: sansDomaine,
    domaines_existants_mais_non_verifies: nonVerifies,
    sites_de_reseau_ecartes: reseaux,
    societes_fermees_au_registre: fermees,
    fiches_completees_par_le_registre: avecRegistre,
    sites_trouves_sur_fiche_completee: trouvesAvecRegistre,
    lignes_trop_longues: tropLongues,
    erreurs: erreurs,
    ecritures_refusees: refus,
    premier_refus: premierRefus,
    premiere_erreur: premiereErreur,
    arret: arret,
    taux: traites > 0 ? Math.round(trouves * 1000 / traites) / 10 + " %" : "—",
    exemples: exemples,
    details: details,
    epuise: lignes.length < combien,
  };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const secret = p.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  // MODE MESURE : ce qu il reste a chercher, sans rien chercher.
  if (p.get("compter") === "1") {
    const etat: any[] = [];
    for (const nom of Object.keys(TABLES)) {
      const conf = TABLES[nom];
      const { count: aFaire, error } = await supabase
        .from(conf.table).select("id", { count: "exact", head: true })
        .is("site_cherche_le", null).is("email", null)
        .or("site_web.is.null,site_web.eq.").not("desabonne", "is", true)
        .neq("raison_sociale", "[ND]");
      if (error) { etat.push({ table: conf.table, erreur: error.message }); continue; }
      const { count: cherches } = await supabase
        .from(conf.table).select("id", { count: "exact", head: true })
        .not("site_cherche_le", "is", null);
      const { count: trouves } = await supabase
        .from(conf.table).select("id", { count: "exact", head: true })
        .like("site_trouve_par", "devine%");
      etat.push({ base: nom, table: conf.table, a_chercher: aFaire, deja_cherches: cherches, sites_trouves: trouves });
    }
    return NextResponse.json({ mode: "mesure, aucune recherche", tables: etat });
  }

  const depart = Date.now();
  // 🚨 ?essai=1 : on cherche, on rend le resultat, et on N ECRIT RIEN.
  // C est le mode de la premiere mesure, sur un echantillon (?lot=30).
  const essai = p.get("essai") === "1";
  // 🆕 08/10 — ?registre=non : sans le registre officiel (pour comparer).
  registreActif = p.get("registre") !== "non";
  registreEtat.demandes = 0; registreEtat.reponses = 0; registreEtat.retenues = 0;
  registreEtat.sans_demande = 0; registreEtat.premier_refus = "";
  const debut = Math.max(0, Number(p.get("debut") || 0) || 0);
  const demande = Number(p.get("lot") || 0);
  const combien = demande > 0 && demande <= 500 ? demande : LOT;
  const vise = String(p.get("table") || "").trim();
  const aTraiter = vise && TABLES[vise] ? [vise] : Object.keys(TABLES);

  const resultats: any[] = [];
  // 🆕 05/10 — un arret demande par `traiter` (marquage refuse, reseau
  // malade) arrete le passage entier, pas seulement la base en cours.
  let arretDuPassage = "";
  for (const nom of aTraiter) {
    const cumul: any = {
      table: TABLES[nom].table, lignes_examinees: 0, sites_trouves: 0,
      dont_par_siren: 0, dont_par_nom_et_ville: 0, aucun_domaine_existant: 0,
      domaines_existants_mais_non_verifies: 0, sites_de_reseau_ecartes: 0,
      societes_fermees_au_registre: 0, fiches_completees_par_le_registre: 0,
      sites_trouves_sur_fiche_completee: 0, lignes_trop_longues: 0,
      erreurs: 0, ecritures_refusees: 0, exemples: [],
    };
    let vu = false;
    while (Date.now() - depart < DUREE_MAX_MS) {
      const r = await traiter(nom, combien, depart, essai, debut);
      if (r.info) break;
      if (r.erreur) { resultats.push(r); if (r.arret) arretDuPassage = r.arret; break; }
      vu = true;
      cumul.lignes_examinees += r.lignes_examinees;
      cumul.sites_trouves += r.sites_trouves;
      cumul.dont_par_siren += r.dont_par_siren;
      cumul.dont_par_nom_et_ville += r.dont_par_nom_et_ville;
      cumul.aucun_domaine_existant += r.aucun_domaine_existant;
      cumul.domaines_existants_mais_non_verifies += r.domaines_existants_mais_non_verifies;
      cumul.sites_de_reseau_ecartes += r.sites_de_reseau_ecartes || 0;
      cumul.societes_fermees_au_registre += r.societes_fermees_au_registre || 0;
      cumul.fiches_completees_par_le_registre += r.fiches_completees_par_le_registre || 0;
      cumul.sites_trouves_sur_fiche_completee += r.sites_trouves_sur_fiche_completee || 0;
      cumul.lignes_trop_longues += r.lignes_trop_longues || 0;
      cumul.erreurs += r.erreurs || 0;
      cumul.ecritures_refusees += r.ecritures_refusees || 0;
      if (r.premier_refus && !cumul.premier_refus) cumul.premier_refus = r.premier_refus;
      if (r.premiere_erreur && !cumul.premiere_erreur) cumul.premiere_erreur = r.premiere_erreur;
      for (const e of r.exemples) if (cumul.exemples.length < 12) cumul.exemples.push(e);
      if (essai) cumul.details = r.details;
      if (r.arret) { cumul.arret = r.arret; arretDuPassage = r.arret; break; }
      // ⚠️ EN ESSAI, UN SEUL LOT : rien n etant ecrit, le lot suivant
      // reprendrait les memes lignes.
      if (essai || r.lignes_examinees === 0 || r.epuise) break;
    }
    if (vu) {
      cumul.taux = cumul.lignes_examinees > 0
        ? Math.round(cumul.sites_trouves * 1000 / cumul.lignes_examinees) / 10 + " %"
        : "—";
      resultats.push(cumul);
    }
    if (vise || essai) break;
    if (arretDuPassage) break;
    if (Date.now() - depart > DUREE_MAX_MS) break;
  }

  // 🆕 05/10 — UN MARQUAGE REFUSE PAR LA BASE EST UNE PANNE, ET ELLE DOIT SE
  // VOIR : la reponse passe en erreur (500), que Vercel affiche en rouge
  // dans la liste des passages. Jusqu ici, tout passage repondait « 200 »,
  // qu il ait travaille ou non.
  const enPanne = arretDuPassage.indexOf("marquage impossible") === 0;
  return NextResponse.json({
    mode: essai ? "essai, rien n est ecrit" : "recherche des sites",
    registre: registreActif ? "interroge" : "non interroge (?registre=non)",
    registre_etat: registreEtat,
    resultats: resultats,
    arret: arretDuPassage || null,
    duree_s: Math.round((Date.now() - depart) / 1000),
  }, { status: enPanne ? 500 : 200 });
}
