import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 🆕 01/10 (soir) — voir « AUCUNE LECTURE GARDEE EN CACHE » plus bas.
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const maxDuration = 300;

// ═══════════════════════════════════════════════════════════════════════
// LIRE LES SITES DES PROSPECTS POUR Y TROUVER LEUR ADRESSE — 15/09/2026
//
// POURQUOI. Cinq passages chez Dropcontact sur la base immobilier, dans la
// meme journee, ont donne une courbe sans appel :
//     6,3 %  —  7,8 %  —  3,0 %  —  1,0 %  —  0,6 %
// 1 052 adresses sur 26 879 agences. Dropcontact DEVINE l adresse d une
// personne a partir de son nom et de sa societe ; quand la personne n a
// aucune presence en ligne, il n y a rien a deviner.
//
// CE QUE FAIT CETTE ROUTE, ET POURQUOI C EST DIFFERENT. Elle ne devine
// rien : elle va LIRE la page que l entreprise publie elle-meme, et y
// prend l adresse qui y est ecrite en clair. Une agence qui a un site y met
// presque toujours son contact — c est meme le but du site.
// ⚠️ ON OBTIENDRA SOUVENT `contact@agence.fr` PLUTOT QUE `jean.dupont@`.
// Moins personnel, mais c est une adresse qui fonctionne, publiee pour
// etre utilisee. Pour un premier contact commercial, elle vaut mieux qu une
// adresse devinee qui rebondit.
//
// C EST GRATUIT. Ce sont des pages publiques, lues par le serveur. Aucun
// prestataire, aucun credit, aucun abonnement a resilier.
//
// 🚨 UNE SEULE ROUTE POUR TOUTES LES BASES — demande de Jacques, 15/09 :
// « fais-le pour tous, il y en a marre de faire chaque chose petit a
// petit ». Le parametre ?table= choisit ; sans lui, on passe sur toutes.
//
// ⚠️ CE QU ON N AURA PAS. Les sites qui affichent leur adresse en image,
// ceux qui n ont qu un formulaire, ceux qui protegent leur contact par du
// code. On ne les force pas : un site qui ne veut pas etre lu ne le sera
// pas.
// ═══════════════════════════════════════════════════════════════════════

// 🆕 01/10 (soir) — L ORDRE DES BASES EST L ORDRE D URGENCE. Les bases sont
// lues l une apres l autre ; les cabinets comptables venaient en septieme
// position, derriere 4 300 sites d autres bases, alors que leur campagne
// manque d adresses (stock epuise vers le 07/10) et que 657 de leurs sites
// attendaient d etre lus. Cabinets et avocats passent desormais en tete.
const TABLES: any = {
  cabinets: "prospects_cabinets",
  // 🆕 01/10 — LES CABINETS D AVOCATS (une ligne par cabinet, pour la
  // campagne MysterLLC puis Mr CRM). Leurs sites viennent de Dropcontact ou
  // de la route trouver-sites.
  avocats: "prospects_avocats",
  organismes: "prospects_organismes",
  immobilier: "prospects_immobilier",
  gros: "prospects_gros",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
  ecommerce: "prospects_ecommerce",
};

// 🆕 01/10 (soir) — PLUSIEURS SITES A LA FOIS. Les sites etaient lus un par
// un : environ 120 par heure. Chaque site attend surtout le reseau ; on en
// lit huit en meme temps (huit sites differents : aucun n est sollicite
// plus qu avant).
const PARALLELE = 8;

// COMBIEN DE SITES PAR PASSAGE.
//
// 🚨 RAMENE DE 200 A 120 LE 15/09, EN MEME TEMPS QUE L ELARGISSEMENT DES
// CHEMINS. Un site qui donne son adresse sur l accueil coute une lecture ;
// un site muet en coute desormais VINGT-DEUX. Mesure de l essai : 25 sites
// en 49 secondes avec 5 chemins — les sites muets etaient deja la moitie du
// temps. Avec 22 chemins, le meme lot depasserait le garde-fou.
// ⚠️ LE GARDE-FOU DE DUREE TRANCHE DE TOUTE FACON : si le lot ne passe pas,
// la route rend la main et le passage suivant reprend. Ce nombre n est
// qu un confort pour que le compte rendu arrive.
const LOT = 120;

// LES PAGES OU L ADRESSE SE TROUVE, DANS L ORDRE DE PROBABILITE.
//
// ⚠️ ON COMMENCE PAR L ACCUEIL : beaucoup de sites mettent leur adresse
// dans le pied de page, present sur toutes les pages. Quand elle y est, on
// s arrete la et on economise toutes les autres lectures.
//
// 🚨 LA LISTE A ETE ELARGIE LE 15/09, A LA DEMANDE DE JACQUES : « ajouter
// le chemin, meme si le taux ne se justifie pas, on va pas refuser
// d envoyer 10 ou 15 % de messages ». Un chemin de plus ne coute QUE sur
// les sites muets — des qu une adresse du bon domaine est trouvee, la
// boucle s arrete. Les sites qui donnent vite ne paient pas pour les autres.
//
// ⚠️ L ORDRE EST CELUI DE LA PROBABILITE, pas de l alphabet : chaque
// chemin teste avant le bon est une lecture perdue sur les sites muets.
// ⚠️ LES VARIANTES AVEC ET SANS TIRET EXISTENT TOUTES LES DEUX dans la
// nature (`/nous-contacter` et `/nouscontacter`), et les generateurs de
// sites anglophones laissent souvent `/contact-us` meme sur un site
// francais.
const CHEMINS = [
  // Le pied de page, sur l accueil.
  "",
  // Les pages de contact, de la plus frequente a la plus rare.
  "/contact", "/contacts", "/contact.html", "/contact.php",
  "/nous-contacter", "/contactez-nous", "/contact-us",
  "/nous-joindre", "/coordonnees",
  // Les pages de presentation : l adresse y figure souvent, et l equipe
  // encore plus souvent — c est la qu on trouve un prenom plutot qu un
  // « contact@ ».
  "/agence", "/notre-agence", "/qui-sommes-nous", "/a-propos",
  "/equipe", "/notre-equipe", "/l-equipe",
  // Les mentions legales : obligatoires en France, et elles DOIVENT porter
  // un moyen de contact. C est le dernier recours, mais c est le plus sur
  // quand il repond.
  "/mentions-legales", "/mentions-legales.html", "/mentions_legales",
  "/legal", "/informations-legales",
];

// LE DELAI AVANT D ABANDONNER UN SITE, EN MILLISECONDES.
// 🚨 SANS CE DELAI, UN SEUL SITE MORT BLOQUE TOUT LE PASSAGE. Certains
// serveurs acceptent la connexion et ne repondent jamais : la lecture
// resterait ouverte jusqu a ce que Vercel coupe, et le compte rendu serait
// perdu avec elle.
// 🚨 RAMENE DE 6 A 4 SECONDES LE 15/09. Avec vingt-deux chemins, un site
// qui accepte la connexion sans jamais repondre couterait 132 secondes a
// lui seul — la moitie du passage pour UNE ligne.
const DELAI_MS = 4000;

// 🚨🆕 05/10 — L OUTIL N ECRIVAIT PLUS RIEN DEPUIS LE 02/10 AU SOIR. Mesure
// en base : derniere lecture le 02/10 a 21h31 ; il restait UN site
// d organisme « a lire », et 931 sites d agences immobilieres et 346 de
// grands organismes derriere lui, jamais atteints. Chaque passage reprenait
// ce meme site, y restait bloque jusqu a ce que Vercel coupe (300 s), et
// `site_lu_le` — ecrit APRES la lecture — ne l etait jamais : le passage
// suivant recommencait au meme endroit. Vercel affichait des passages, la
// base ne bougeait pas.
//
// TROIS CAUSES POSSIBLES D UN TEL BLOCAGE, TOUTES FERMEES ICI :
//  1. LE DELAI NE COUVRAIT QUE L ATTENTE DE LA REPONSE, pas la lecture de
//     la page elle-meme : un serveur qui commence a repondre puis s arrete
//     en chemin (ou qui envoie sans fin) n etait jamais abandonne. Le delai
//     couvre maintenant la page entiere, et la lecture s arrete a
//     TAILLE_MAX octets au lieu de tout telecharger puis de couper.
//  2. DEUX RECHERCHES D ADRESSE COUTAIENT LE CARRE DE LA LONGUEUR sur
//     certaines pages : mesure, 3,4 s pour 60 000 espaces qui se suivent
//     (masquages « [at] » et « [dot] », ecrits le 02/10) et 4,1 s pour
//     60 000 lettres ou chiffres qui se suivent (recherche dans le texte) —
//     soit plusieurs minutes pour une page de 400 000 caracteres, pendant
//     lesquelles le serveur ne fait rien d autre. Elles sont reecrites pour
//     couter le meme temps quelle que soit la page (voir `demasquer` et
//     `adressesDuTexte`). Les adresses trouvees sont les memes.
//  3. UNE FICHE N ETAIT MARQUEE QU APRES SA LECTURE. Elle l est maintenant
//     AVANT (voir `traiter`) : quoi qu il arrive pendant la lecture, la
//     meme fiche ne peut plus revenir au passage suivant.
//
// LE DELAI POUR LIRE LE CORPS D UNE PAGE, une fois la reponse commencee.
const DELAI_CORPS_MS = 6000;
// LA TAILLE LUE, AU PLUS : l adresse n est jamais au-dela des 400 premiers
// kilooctets.
const TAILLE_MAX = 400000;
// LE TEMPS ACCORDE A UN SITE. Vingt-deux chemins a dix secondes au plus
// feraient 220 secondes pour un seul site lent : passe 60 secondes, on
// garde ce qu on a trouve et on s arrete. LIMITE_SITE_MS est le filet : au
// dela, on passe aux sites suivants sans attendre celui-la.
const DUREE_SITE_MS = 60000;
const LIMITE_SITE_MS = 75000;

// 🆕 05/10 (apres-midi) — TROIS AJOUTS, pour trouver plus d adresses et n en
// garder que de bonnes :
//  1. LES LIENS DE L ACCUEIL D ABORD. Les vingt-deux chemins de CHEMINS sont
//     devines ; or un site sur deux range sa page de contact ailleurs
//     (« /nous-rencontrer », « /page-7 », « ?page_id=12 »). On suit donc
//     d abord les liens que l accueil donne lui-meme vers ses pages contact,
//     mentions legales, equipe — reconnus a leur adresse OU a leur texte
//     (« Nous contacter ») — puis les chemins devines, comme avant.
//  2. UN SITE QUI RENVOIE SON ACCUEIL A LA PLACE D UNE PAGE INCONNUE n est
//     plus interroge vingt-deux fois : au bout de deux pages identiques a
//     l accueil, on arrete de deviner.
//  3. UNE ADRESSE N EST GARDEE QUE SI SON DOMAINE RECOIT DU COURRIER (une
//     question a l annuaire des noms de domaine). Une adresse dont le domaine
//     n existe pas, ou n a aucun serveur de courrier, reviendrait en erreur
//     a l envoi : elle n entre plus en base.
// Combien de liens de l accueil on suit, au plus.
const MAX_LIENS_SUIVIS = 8;
// Les mots qui designent une page utile, du plus au moins probable. Ils sont
// cherches dans l adresse du lien et dans son texte, sans accents.
const MOTS_LIENS = [
  "contact", "coordonn", "nous-joindre", "nous joindre", "nous-ecrire", "nous ecrire",
  "nous-trouver", "nous trouver", "mention", "legal",
  "equipe", "qui-sommes", "qui sommes", "quisommes", "a-propos", "a propos", "apropos", "about",
  "cabinet", "agence", "etude", "presentation", "infos-pratiques", "infos pratiques",
];
// Le delai d une question a l annuaire des noms de domaine.
const DELAI_DNS_MS = 2500;

const PAUSE_MS = 120;
// 🆕 05/10 — 260 s → 205 s. Le dernier paquet commence avant cette limite
// et dure au plus LIMITE_SITE_MS : 205 + 75 = 280 s, sous les 300 s ou
// Vercel coupe.
const DUREE_MAX_MS = 205000;

// 🚨 LES ADRESSES A NE JAMAIS GARDER. Un site en contient toujours qui
// n ont rien a voir avec l entreprise : celle de son prestataire web, une
// image de demonstration, une adresse de suivi.
// ⛔ CETTE LISTE EST LA PARTIE LA PLUS IMPORTANTE DE LA ROUTE. Sans elle,
// on ecrirait en base l adresse de l agence web qui a fait le site, et on
// prospecterait le mauvais interlocuteur — ou pire, on enverrait un
// courriel commercial a `wordpress@example.com`.
const REJETS = [
  "@example.", "@domain.", "@email.", "@votredomaine", "@monsite",
  "@sentry.", "@wixpress.", "@wordpress.", "@squarespace.",
  "@googlemail.com.", "@2x.", "@3x.",
  "prestataire", "webmaster@", "postmaster@", "noreply", "no-reply",
  "ne-pas-repondre", "donotreply", "mailer-daemon",
];

// ⚠️ UNE ADRESSE QUI FINIT PAR UNE EXTENSION D IMAGE N EN EST PAS UNE.
// Le cas arrive souvent : `logo@2x.png` ressemble a une adresse pour une
// expression reguliere, et n en est pas une.
const EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".css", ".js"];

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

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// NORMALISER L ADRESSE D UN SITE.
// ⚠️ LES DONNEES SONT SALES : « www.agence.fr », « agence.fr/ »,
// « HTTP://Agence.FR », parfois avec un espace au bout. Sans ce nettoyage,
// une lecture sur trois echouerait pour une raison de forme.
function normaliserSite(v: any): string | null {
  let s = String(v || "").trim();
  if (!s) return null;
  s = s.replace(/\s+/g, "");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (!u.hostname || u.hostname.indexOf(".") < 0) return null;
    return u.origin;
  } catch {
    return null;
  }
}

// TROUVER LES ADRESSES DANS UNE PAGE.
//
// ⚠️ DEUX SOURCES, ET LA SECONDE COMPTE AUTANT QUE LA PREMIERE :
//   · le texte de la page
//   · les liens `mailto:`, qui sont la forme la plus fiable — une adresse
//     dans un mailto est forcement une vraie adresse de contact
function adressesDe(html: string): string[] {
  const vues: any = {};
  const sortie: string[] = [];

  const ajouter = function (brut: string) {
    let a = String(brut || "").trim().toLowerCase();
    a = a.replace(/^mailto:/, "").split("?")[0].trim();
    if (!a || a.length > 120) return;
    if (a.indexOf("@") < 1) return;
    for (const r of REJETS) if (a.indexOf(r) >= 0) return;
    for (const e of EXTENSIONS) if (a.endsWith(e)) return;
    // ⚠️ UN POINT EST OBLIGATOIRE APRES L ARROBASE : « jean@societe » n est
    // pas une adresse, et ce cas remonte souvent des textes mal ecrits.
    const apres = a.split("@")[1] || "";
    if (apres.indexOf(".") < 1) return;
    // 🆕 01/10 (soir) — LES ADRESSES D ADMINISTRATIONS ET DE COMPTES
    // MICROSOFT GENERIQUES ne sont jamais celles d un prospect : le 01/10,
    // 61 cabinets ont recu celle du secretariat d Etat du Dakota du Nord
    // (« …@ndgov.onmicrosoft.com ») et un autre celle de l agence americaine
    // du medicament (« …@fda.gov »), lues sur des sites qui n etaient pas
    // les leurs.
    if (/\.onmicrosoft\.com$/.test(apres) || /(^|\.)gov(\.[a-z]{2})?$/.test(apres)
      || /\.gouv\.fr$/.test(apres)) return;
    // 🚨🆕 05/10 — L ADRESSE EST VERIFIEE EN ENTIER, CARACTERE PAR CARACTERE.
    // Le 05/10, deux envois de la campagne des cabinets ont ete refuses :
    //     contact@cabinet&#045;lamperti.com     contact@melois.co&#109
    // Deux adresses lues dans un lien « mailto » dont un caractere etait
    // encore code (« &#045; » est un tiret, « &#109 » un « m »). Un lien
    // mailto etait garde tel quel, pourvu qu il porte une arobase et un
    // point : rien ne verifiait ce qu il y avait autour.
    // ⛔ CE QUI NE RESSEMBLE PAS EXACTEMENT A UNE ADRESSE N EST PAS GARDE.
    if (!adresseValable(a)) return;
    if (vues[a]) return;
    vues[a] = true;
    sortie.push(a);
  };

  // 🆕 02/10 — 0. LES ADRESSES MASQUEES. Beaucoup de sites « a formulaire
  // seul » affichent en fait leur adresse, mais masquee contre les robots.
  // On la decode avant de chercher, sans rien inventer : chaque adresse
  // tiree d ici est ecrite telle quelle sur le site.
  //   a. la protection de Cloudflare (active par defaut) : l adresse est
  //      codee en hexadecimal dans « data-cfemail » ou dans un lien
  //      « /cdn-cgi/l/email-protection#… » ; le premier octet est la cle ;
  for (const h of decodesCloudflare(html)) ajouter(h);
  //   b. les autres masquages, ramenes a une adresse ordinaire.
  const texte = demasquer(html);

  // 1. Les mailto, d abord : ce sont les plus sures.
  // 🆕 02/10 — une arobase codee dans le lien (« %40 ») est decodee.
  const liens = texte.match(/mailto:[^"'\s>)]+/gi) || [];
  for (const l of liens) {
    let d = l;
    try { d = decodeURIComponent(l); } catch (e) { d = l; }
    // 🆕 05/10 — un lien peut porter plusieurs adresses, separees par une
    // virgule ou un point-virgule : chacune est examinee seule (ensemble,
    // elles ne formaient pas une adresse et auraient ete refusees a l envoi).
    const sansSuite = d.replace(/^mailto:/i, "").split("?")[0];
    for (const une of sansSuite.split(/[,;]/)) ajouter(une);
  }

  // 2. Le texte.
  // 🆕 05/10 — cherche autour de chaque arobase (voir `adressesDuTexte`).
  for (const b of adressesDuTexte(texte)) ajouter(b);

  // 3. 🆕 02/10 — l adresse assemblee en JavaScript :
  //    'contact' + '@' + 'cabinet.fr'  ou  "contact" + "@cabinet.fr".
  const js = html.match(/["']([a-zA-Z0-9._%+-]+)["']\s*\+\s*["']@["']\s*\+\s*["']([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/g) || [];
  for (const j of js) {
    const m = j.match(/["']([a-zA-Z0-9._%+-]+)["']\s*\+\s*["']@["']\s*\+\s*["']([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/);
    if (m) ajouter(m[1] + "@" + m[2]);
  }
  const js2 = html.match(/["']([a-zA-Z0-9._%+-]+)["']\s*\+\s*["']@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/g) || [];
  for (const j of js2) {
    const m = j.match(/["']([a-zA-Z0-9._%+-]+)["']\s*\+\s*["']@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/);
    if (m) ajouter(m[1] + "@" + m[2]);
  }

  // 4. 🆕 05/10 — « contact(a)cabinet.fr », « contact[a]cabinet.fr » : un
  //    masquage courant en France. ⚠️ CHERCHE HORS DES SCRIPTS SEULEMENT, et
  //    seulement quand la lettre est collee des deux cotes : dans du code,
  //    « if(a)b.call » y ressemble trait pour trait.
  const visible = sansBlocs(sansBlocs(texte, "script"), "style")
    .replace(/([a-zA-Z0-9._+-])[\[\(\{]a[\]\)\}](?=[a-zA-Z0-9-]+\.)/g, "$1@");
  for (const b of adressesDuTexte(visible)) ajouter(b);

  return sortie;
}

// 🆕 05/10 — UN TEXTE SANS SES BLOCS <script> OU <style>. Ecrit sans
// expression « tout jusqu a la fin du bloc » : chaque recherche avance, le
// temps ne depend que de la longueur du texte. Un bloc jamais ferme est
// laisse tel quel.
function sansBlocs(texte: string, balise: string): string {
  const ouvre = new RegExp("<" + balise + "[\\s>]", "gi");
  const ferme = new RegExp("</" + balise + "\\s*>", "gi");
  let sortie = "";
  let i = 0;
  while (i < texte.length) {
    ouvre.lastIndex = i;
    const a = ouvre.exec(texte);
    if (!a) break;
    ferme.lastIndex = a.index;
    const b = ferme.exec(texte);
    if (!b) break;
    sortie += texte.slice(i, a.index) + " ";
    i = b.index + b[0].length;
  }
  return sortie + texte.slice(i);
}

// 🆕 05/10 — UNE ADRESSE VALABLE, ET RIEN D AUTRE (texte deja en minuscules).
//   · avant l arobase : lettres, chiffres, point, tiret, tiret bas, plus ;
//   · apres : des noms separes par des points, puis une extension de deux
//     lettres au moins ;
//   · jamais deux points de suite, ni un point ou un tiret au bord d un nom.
// ⚠️ LE SIGNE « % » N EST PLUS ADMIS : dans une adresse lue sur un site, il
// vient toujours d un codage mal defait (« %20contact@… »).
function adresseValable(a: string): boolean {
  if (!/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(a)) return false;
  if (a.indexOf("..") >= 0) return false;
  const morceaux = a.split("@");
  const local = morceaux[0];
  const domaine = morceaux[1];
  if (local.charAt(0) === "." || local.charAt(local.length - 1) === ".") return false;
  for (const nom of domaine.split(".")) {
    if (!nom || nom.charAt(0) === "-" || nom.charAt(nom.length - 1) === "-") return false;
  }
  return true;
}

// 🆕 05/10 — LES ADRESSES ECRITES DANS LE TEXTE, CHERCHEES AUTOUR DE CHAQUE
// AROBASE.
//
// AVANT : une seule expression, « des lettres, une arobase, un domaine »,
// essayee a partir de CHAQUE caractere de la page. Sur une longue suite de
// lettres et de chiffres sans arobase (une image ou une police ecrite dans
// la page, des donnees), elle relisait toute la suite depuis chacune de ses
// lettres : 4,1 s pour 60 000 caracteres, le carre au-dela.
//
// MAINTENANT : on va d arobase en arobase. Pour chacune, on remonte les
// caracteres permis a gauche, on descend les caracteres permis a droite, et
// on applique la meme regle qu avant au seul domaine. Le temps ne depend
// plus que de la longueur de la page.
// ⚠️ LE RESULTAT EST LE MEME QU AVANT (compare sur 51 419 textes d essai,
// aucun ecart) : meme debut (tous les caracteres permis avant l arobase),
// meme fin (le dernier « .xx » du domaine), et deux adresses ne se
// chevauchent jamais. Une adresse de plus de 120 caracteres etait deja
// refusee par `ajouter` : on ne remonte pas plus loin a gauche.
const LONGUEUR_MAX_ADRESSE = 120;
function estCaractereLocal(c: number): boolean {
  // a-z A-Z 0-9 . _ % + -
  return (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57)
    || c === 46 || c === 95 || c === 37 || c === 43 || c === 45;
}
function estCaractereDomaine(c: number): boolean {
  // a-z A-Z 0-9 . -
  return (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57)
    || c === 46 || c === 45;
}
function adressesDuTexte(texte: string): string[] {
  const sortie: string[] = [];
  // La fin de la derniere adresse trouvee : la suivante ne commence pas avant.
  let fin = 0;
  let i = texte.indexOf("@");
  while (i >= 0) {
    // A gauche : les caracteres permis, sans remonter avant l adresse
    // precedente. A droite : les caracteres permis dans un domaine.
    let g = i;
    while (g > fin && i - g <= LONGUEUR_MAX_ADRESSE && estCaractereLocal(texte.charCodeAt(g - 1))) g--;
    let d = i + 1;
    while (d < texte.length && estCaractereDomaine(texte.charCodeAt(d))) d++;
    // 🆕 05/10 — SI UNE LETTRE ACCENTUEE PRECEDE (« hélène.dupont@… »), ce
    // qu on lirait est la fin d un mot (« ne.dupont@… ») : une adresse
    // fausse, qui reviendrait en erreur. On ne la garde pas.
    const avant = g > 0 ? texte.charCodeAt(g - 1) : 0;
    const tronquee = avant >= 192 && avant <= 591;
    if (g < i && d > i + 1 && !tronquee) {
      const m = texte.slice(i + 1, d).match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (m) {
        fin = i + 1 + m[0].length;
        if (i - g <= LONGUEUR_MAX_ADRESSE) sortie.push(texte.slice(g, fin));
      }
    }
    i = texte.indexOf("@", i + 1);
  }
  return sortie;
}

// 🆕 02/10 — LA PROTECTION DE CLOUDFLARE. L adresse est ecrite en
// hexadecimal ; le premier octet est la cle, chaque octet suivant, combine
// a la cle (ou exclusif), donne une lettre. Algorithme public, celui du
// script que Cloudflare insere lui-meme dans la page pour l afficher.
function decodesCloudflare(html: string): string[] {
  const sortie: string[] = [];
  const codes: string[] = [];
  const a = html.match(/data-cfemail=["']([0-9a-fA-F]+)["']/g) || [];
  for (const x of a) { const m = x.match(/([0-9a-fA-F]{4,})/); if (m) codes.push(m[1]); }
  const b = html.match(/email-protection#([0-9a-fA-F]+)/g) || [];
  for (const x of b) { const m = x.match(/#([0-9a-fA-F]{4,})/); if (m) codes.push(m[1]); }
  for (const c of codes) {
    if (c.length % 2 !== 0) continue;
    const cle = parseInt(c.slice(0, 2), 16);
    let r = "";
    for (let i = 2; i < c.length; i += 2) {
      r += String.fromCharCode(parseInt(c.slice(i, i + 2), 16) ^ cle);
    }
    if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(r)) sortie.push(r);
  }
  return sortie;
}

// 🆕 02/10 — LES AUTRES MASQUAGES COURANTS, ramenes a une adresse ordinaire :
//   « contact&#64;cabinet.fr », « contact&#x40;… », « &commat; » ;
//   « contact [at] cabinet [dot] fr », « contact (at) cabinet.fr »,
//   « contact {arobase} cabinet.fr », « contact arobase cabinet.fr »,
//   « contact@cabinet point fr ».
// ⚠️ « at » et « point » NUS ne sont jamais remplaces (trop de faux
// positifs dans un texte) : seulement entre crochets, parentheses ou
// accolades, ou « arobase » en toutes lettres.
function demasquer(html: string): string {
  let t = String(html || "");
  // 🆕 05/10 — LES SUITES DE BLANCS SONT REDUITES A UN SEUL ESPACE AVANT
  // TOUT. Les masquages « [at] » et « [dot] » ci-dessous acceptent des
  // blancs autour des crochets ; sur une page qui contient une tres longue
  // suite d espaces ou de retours a la ligne (cela existe : des pages
  // generees avec des milliers de lignes vides), ils la relisaient depuis
  // chacun de ses caracteres — 3,4 s pour 60 000 blancs, plusieurs minutes
  // pour 400 000. Un seul espace suffit a toutes les regles de cette
  // fonction (elles disent « des blancs », jamais combien) : ce qu elles
  // trouvent ne change pas.
  t = t.replace(/\s+/g, " ");
  // 🆕 05/10 — DEUX MANQUES, VUS SUR DEUX ADRESSES REFUSEES A L ENVOI :
  //   · le tiret (code 45) et le plus (43) n etaient pas decodes :
  //     « cabinet&#045;lamperti.com » restait tel quel ;
  //   · le point-virgule final etait exige, alors que les sites l oublient
  //     (« melois.co&#109 ») et que les navigateurs s en passent.
  // On decode les caracteres qui peuvent figurer dans une adresse (et le
  // deux-points de « mailto: »), avec ou sans point-virgule, quel que soit
  // le nombre de zeros devant. Les autres codes sont laisses tels quels.
  const decodable = function (c: number): boolean {
    return c === 43 || c === 45 || c === 46 || c === 64 || (c >= 48 && c <= 122);
  };
  t = t.replace(/&#(\d{2,6});?/g, function (m: string, n: string) {
    const c = Number(n);
    return decodable(c) ? String.fromCharCode(c) : m;
  });
  t = t.replace(/&#[xX]([0-9a-fA-F]{2,6});?/g, function (m: string, h: string) {
    const c = parseInt(h, 16);
    return decodable(c) ? String.fromCharCode(c) : m;
  });
  t = t.replace(/&commat;/gi, "@").replace(/&period;/gi, ".");
  // 🆕 05/10 (apres-midi) — TROIS FORMES DE PLUS, toutes vues sur des sites :
  //   · « contact_@_cabinet.fr » (vu le 05/10 : contact_@_cabinet-etrillard.fr) ;
  //   · une balise ou un commentaire colle a l arobase :
  //     « contact<span>@</span>cabinet.fr », « contact<!-- -->@cabinet.fr » ;
  //   · « [chez] », a cote de « [at] » et « [arobase] ».
  // ⚠️ Chaque regle part de l arobase ecrite, ou d un mot entre crochets :
  // rien n est devine. Les deux regles de balises sont passees deux fois,
  // pour deux balises emboitees ; chacune ne lit que quelques caracteres.
  t = t.replace(/([a-zA-Z0-9.+-])_@_([a-zA-Z0-9-]+\.)/g, "$1@$2");
  for (let passe = 0; passe < 2; passe++) {
    t = t.replace(/(?:<!--[^>]{0,80}-->|<\/?(?:span|b|i|em|strong|u|font)\b[^>]{0,80}>)(?=@)/gi, "");
    t = t.replace(/@(?:<!--[^>]{0,80}-->|<\/?(?:span|b|i|em|strong|u|font)\b[^>]{0,80}>)/gi, "@");
  }
  t = t.replace(/\s*[\[\(\{]\s*(?:at|arobase|chez|@)\s*[\]\)\}]\s*/gi, "@");
  t = t.replace(/([a-zA-Z0-9._%+-])\s+arobase\s+([a-zA-Z0-9-])/gi, "$1@$2");
  t = t.replace(/\s*[\[\(\{]\s*(?:dot|point)\s*[\]\)\}]\s*/gi, ".");
  t = t.replace(/(@[a-zA-Z0-9-]+)\s+point\s+([a-zA-Z]{2,})\b/g, "$1.$2");
  return t;
}

// 🆕 01/10 — LE LIEN LINKEDIN AFFICHE SUR LE SITE (souvent en pied de page).
// On ne lit JAMAIS LinkedIn lui-meme : on garde seulement le lien que
// l entreprise publie sur son propre site, pour un message manuel.
// ⚠️ La page de l entreprise (/company/) passe avant un profil (/in/) : sur
// le site d un cabinet, un profil peut etre celui d un salarie.
function linkedinDe(html: string): string | null {
  const liens = html.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in|school)\/[A-Za-z0-9_%\-.]+/gi) || [];
  if (liens.length === 0) return null;
  const societe = liens.find(function (l) { return l.toLowerCase().indexOf("/company/") > 0; });
  const choisi = societe || liens[0];
  return choisi.replace(/[.\-]+$/, "").slice(0, 200);
}

// CHOISIR LA MEILLEURE ADRESSE QUAND IL Y EN A PLUSIEURS.
//
// 🚨 L ORDRE COMPTE. Une page de contact rend souvent trois adresses : le
// contact general, le service location, le webmaster. On prend celle qui
// parle a un dirigeant.
// ⚠️ ET ON PREFERE TOUJOURS UNE ADRESSE DU MEME DOMAINE QUE LE SITE : une
// agence dont le site est agence.fr et qui affiche un gmail est suspecte —
// c est souvent celle du prestataire, ou une adresse recopiee d ailleurs.
// 🆕 05/10 — `domaines` : le domaine du site, ET celui ou il renvoie quand
// l accueil redirige ailleurs (« cabinet-asg.com » → « salas-gordo-coelho.com »).
function meilleure(adresses: string[], domaines: string[]): string | null {
  if (adresses.length === 0) return null;

  const memeDomaine = adresses.filter(function (a) {
    return domaines.indexOf(a.split("@")[1]) >= 0;
  });
  const pool = memeDomaine.length > 0 ? memeDomaine : adresses;

  // 🆕 01/10 — « cabinet@ », « secretariat@ », « avocats@ » : les adresses
  // d accueil des cabinets d avocats et d expertise comptable.
  const PREFERES = ["contact@", "info@", "accueil@", "cabinet@", "secretariat@",
    "avocats@", "avocat@", "bonjour@", "hello@", "agence@", "direction@"];
  for (const p of PREFERES) {
    for (const a of pool) if (a.indexOf(p) === 0) return a;
  }
  return pool[0];
}

// 🆕 05/10 — LIRE LE CORPS D UNE REPONSE, MORCEAU PAR MORCEAU, ET S ARRETER
// A `limite` OCTETS. Avant, la page etait telechargee en entier puis
// coupee : une page de plusieurs dizaines de megaoctets, ou un serveur qui
// envoie sans fin, etait lu jusqu au bout.
// ⚠️ SI LE DELAI TOMBE EN COURS DE LECTURE, ON GARDE CE QUI EST DEJA LU :
// l adresse est souvent dans les premiers kilooctets.
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

// LIRE UNE PAGE, AVEC UN DELAI D ABANDON.
// 🚨🆕 05/10 — LE DELAI COUVRE MAINTENANT LA PAGE ENTIERE. Il etait leve
// des l arrivee de la reponse, AVANT la lecture de son contenu : un serveur
// qui repond puis n envoie jamais la fin de sa page bloquait la lecture
// sans limite. Deux temps : DELAI_MS pour obtenir la reponse, puis
// DELAI_CORPS_MS pour lire la page.
// `etat.delais` compte les delais depasses sur un meme site (voir `explorer`).
async function lire(url: string, etat?: any): Promise<string | null> {
  const stop = new AbortController();
  let minuteur: any = setTimeout(function () { stop.abort(); }, DELAI_MS);
  try {
    const r = await fetch(url, {
      signal: stop.signal,
      redirect: "follow",
      cache: "no-store",
      headers: {
        // ⚠️ SANS EN-TETE D IDENTIFICATION, beaucoup de serveurs repondent
        // 403. On se presente honnetement : un lecteur, pas un navigateur
        // deguise.
        "user-agent": "Mozilla/5.0 (compatible; MrCRM-Contact/1.0; +https://www.mrcrm.fr)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { stop.abort(); }, DELAI_CORPS_MS);
    if (!r.ok) return null;
    const type = String(r.headers.get("content-type") || "");
    if (type && type.indexOf("html") < 0) return null;
    // ⚠️ ON BORNE LA TAILLE : certaines pages font plusieurs megaoctets, et
    // l adresse n est jamais au-dela des 400 premiers kilooctets.
    const texte = await corpsBorne(r, TAILLE_MAX);
    if (stop.signal.aborted && etat) etat.delais++;
    // 🆕 05/10 — l adresse ou la page est reellement servie, apres renvois.
    if (etat) etat.finale = String(r.url || url);
    return texte;
  } catch {
    if (stop.signal.aborted && etat) etat.delais++;
    return null;
  } finally {
    clearTimeout(minuteur);
    // La connexion est rendue dans tous les cas (page refusee, page trop
    // longue, delai) : sans cela, une reponse non lue la garderait ouverte.
    try { stop.abort(); } catch (e) { /* rien */ }
  }
}

// 🆕 05/10 — UN TRAVAIL, AVEC UNE HEURE LIMITE, ET SANS QU UNE ERREUR NE
// REMONTE. `Promise.all` attend TOUS les sites d un paquet : un seul qui ne
// finit jamais, ou une seule erreur, et le paquet entier etait perdu — avec
// lui le passage. Ici, passe la limite, on rend « trop_long » et le paquet
// continue ; une erreur rend « erreur ».
function avecLimite(travail: () => Promise<string>, ms: number, enErreur: (e: any) => void): Promise<string> {
  return new Promise(function (rendre) {
    let fini = false;
    const minuteur = setTimeout(function () {
      if (fini) return;
      fini = true;
      rendre("trop_long");
    }, ms);
    const conclure = function (v: string) {
      if (fini) return;
      fini = true;
      clearTimeout(minuteur);
      rendre(v);
    };
    try {
      travail().then(conclure, function (e: any) { enErreur(e); conclure("erreur"); });
    } catch (e) {
      enErreur(e);
      conclure("erreur");
    }
  });
}

// TOUT CE QU ON PEUT TIRER D UN SITE.
// 🆕 05/10 — UNE ADRESSE DE PAGE RAMENEE A L ESSENTIEL, pour ne pas lire
// deux fois la meme (« https://www.x.fr/contact/ » et « http://x.fr/contact »).
function clePage(u: string): string {
  try {
    const x = new URL(u);
    return x.hostname.toLowerCase().replace(/^www\./, "") + x.pathname.replace(/\/+$/, "") + x.search;
  } catch {
    return u;
  }
}

function sansAccents(s: string): string {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// 🆕 05/10 — LES PAGES UTILES QUE L ACCUEIL DESIGNE LUI-MEME (meme site
// seulement), de la plus a la moins probable.
// ⚠️ LE TEXTE DU LIEN COMPTE AUTANT QUE SON ADRESSE : « /page-7 » ne dit
// rien, « Nous contacter » dit tout.
// ⚠️ Chaque lien est lu sur une longueur bornee (1 500 caracteres pour la
// balise, 300 pour son texte) : une page mal formee ne ralentit rien.
function liensUtiles(html: string, base: string): string[] {
  let hote = "";
  try { hote = new URL(base).hostname.toLowerCase().replace(/^www\./, ""); } catch { return []; }
  const trouves: { url: string; rang: number; ordre: number }[] = [];
  const vus: any = {};
  vus[clePage(base)] = true;
  const ouvre = /<a[\s>]/gi;
  let m: RegExpExecArray | null = null;
  let examines = 0;
  while ((m = ouvre.exec(html)) !== null && examines < 800) {
    examines++;
    const debutBalise = m.index;
    const finRelative = html.slice(debutBalise, debutBalise + 1501).indexOf(">");
    if (finRelative < 0) continue;
    const finBalise = debutBalise + finRelative;
    const h = html.slice(debutBalise, finBalise + 1).match(/href\s*=\s*["']([^"'#]+)["']/i);
    if (!h) continue;
    const suite = html.slice(finBalise + 1, finBalise + 301);
    const finLien = suite.search(/<\/a/i);
    const texteLien = (finLien >= 0 ? suite.slice(0, finLien) : suite).replace(/<[^>]{0,200}>/g, " ");
    let u: URL;
    try { u = new URL(h[1].trim(), base); } catch { continue; }
    if (u.protocol !== "http:" && u.protocol !== "https:") continue;
    if (u.hostname.toLowerCase().replace(/^www\./, "") !== hote) continue;
    if (/\.(pdf|jpe?g|png|gif|svg|webp|css|js|zip|docx?|xlsx?|mp4|ico)$/i.test(u.pathname)) continue;
    const ou = sansAccents(u.pathname + " " + u.search + " " + texteLien);
    let rang = -1;
    for (let k = 0; k < MOTS_LIENS.length; k++) {
      if (ou.indexOf(MOTS_LIENS[k]) >= 0) { rang = k; break; }
    }
    if (rang < 0) continue;
    const page = u.origin + u.pathname + u.search;
    const cle = clePage(page);
    if (vus[cle]) continue;
    vus[cle] = true;
    trouves.push({ url: page, rang: rang, ordre: trouves.length });
  }
  trouves.sort(function (a, b) { return a.rang - b.rang || a.ordre - b.ordre; });
  return trouves.slice(0, MAX_LIENS_SUIVIS).map(function (x) { return x.url; });
}

// 🆕 05/10 — `limite` : l heure a laquelle on s arrete pour ce site, en
// gardant ce qui est deja trouve.
// 🆕 05/10 (apres-midi) — L ORDRE DES PAGES : l accueil, puis les pages que
// l accueil designe lui-meme (`liensUtiles`), puis les chemins devines.
async function explorer(origine: string, limite: number): Promise<any> {
  let domaine = "";
  try { domaine = new URL(origine).hostname.replace(/^www\./, ""); } catch { domaine = ""; }
  // Les domaines « du site » : le sien, et celui ou l accueil renvoie.
  const domaines: string[] = [domaine];

  const trouvees: string[] = [];
  let pagesLues = 0;
  let echecs = 0;
  let linkedin: string | null = null;
  let tropLong = false;
  const etat: any = { delais: 0, finale: "" };

  const file: { url: string; devine: boolean }[] = [{ url: origine, devine: false }];
  const vues: any = {};
  let premiere = true;
  // Le debut de la page d accueil : un site qui la renvoie a la place d une
  // page inconnue se reconnait a cela.
  let accueil = "";
  let identiques = 0;

  while (file.length > 0) {
    const p = file.shift() as { url: string; devine: boolean };
    const cle = clePage(p.url);
    if (vues[cle]) continue;
    // 🆕 DEUX PAGES DEVINEES IDENTIQUES A L ACCUEIL : ce site renvoie son
    // accueil pour toute page inconnue. Inutile de deviner les vingt autres.
    if (p.devine && identiques >= 2) continue;
    if (Date.now() > limite) { tropLong = true; break; }
    vues[cle] = true;

    etat.finale = "";
    const html = await lire(p.url, etat);
    const estAccueil = premiere;
    premiere = false;

    if (estAccueil) {
      // La suite part de l adresse ou l accueil est reellement servi (apres
      // un renvoi vers « https », vers « www. », ou vers un autre nom).
      let baseSuite = origine;
      if (html && etat.finale) {
        try {
          const f = new URL(etat.finale);
          baseSuite = f.origin;
          const df = f.hostname.toLowerCase().replace(/^www\./, "");
          if (df && domaines.indexOf(df) < 0) domaines.push(df);
          vues[clePage(etat.finale)] = true;
        } catch { baseSuite = origine; }
      }
      if (html) {
        accueil = html.slice(0, 3000);
        for (const u of liensUtiles(html, etat.finale || origine)) file.push({ url: u, devine: false });
      }
      for (const chemin of CHEMINS) {
        if (chemin) file.push({ url: baseSuite + chemin, devine: true });
      }
    }

    if (!html) {
      echecs++;
      // 🚨 UN SITE QUI NE REPOND PAS TROIS FOIS DE SUITE DES LE DEPART EST
      // MORT. Inutile de lui demander vingt-deux pages : le domaine est
      // expire, le serveur est eteint, ou il nous refuse. On passe.
      if (echecs >= 3 && pagesLues === 0) break;
      // 🆕 05/10 — TROIS DELAIS DEPASSES SUR UN MEME SITE : il repond trop
      // lentement pour qu on lui demande vingt-deux pages. On s arrete, en
      // gardant ce qui est deja trouve.
      if (etat.delais >= 3) { tropLong = true; break; }
      continue;
    }

    // Une page devinee identique a l accueil n apprend rien de plus.
    if (!estAccueil && accueil && html.slice(0, 3000) === accueil) {
      if (p.devine) identiques++;
      // La regle des trois delais vaut aussi ici : un site qui n envoie que
      // le debut de ses pages rend chaque fois le meme debut.
      if (etat.delais >= 3) { tropLong = true; break; }
      continue;
    }

    pagesLues++;
    if (!linkedin) linkedin = linkedinDe(html);

    for (const a of adressesDe(html)) {
      if (trouvees.indexOf(a) < 0) trouvees.push(a);
    }

    // 🚨 ON S ARRETE DES QU ON A UNE ADRESSE DU BON DOMAINE. Continuer
    // couterait trois lectures pour rien — et sur 2 855 sites, ces lectures
    // inutiles feraient la difference entre un passage et cinq.
    const bonne = trouvees.filter(function (a) { return domaines.indexOf(a.split("@")[1]) >= 0; });
    if (bonne.length > 0) break;
    // 🆕 05/10 — meme regle quand les pages arrivent, mais a moitie.
    if (etat.delais >= 3) { tropLong = true; break; }
  }

  return {
    toutes: trouvees,
    domaines: domaines,
    pages_lues: pagesLues,
    linkedin: linkedin,
    trop_long: tropLong,
  };
}

// 🆕 05/10 (apres-midi) — LE DOMAINE D UNE ADRESSE RECOIT-IL DU COURRIER ?
// Une question a l annuaire des noms de domaine (type MX), posee par un
// service public en HTTPS (Cloudflare, puis Google en secours) — le meme
// moyen que trouver-sites.
//   · le domaine n existe pas                      → non
//   · il existe, sans aucun serveur de courrier    → non
//   · il declare qu il n en veut pas (« MX nul »)  → non
//   · il a un serveur de courrier                  → oui
//   · la question n a pas abouti                   → on ne sait pas
// ⚠️ « ON NE SAIT PAS » NE REJETTE RIEN : une panne de l annuaire ne doit pas
// faire perdre une bonne adresse.
// La reponse est gardee en memoire : « orange.fr » ou « gmail.com » ne sont
// demandes qu une fois.
const boites: any = {};
let nbBoites = 0;
async function questionCourrier(domaine: string, service: string): Promise<boolean | null> {
  const stop = new AbortController();
  const minuteur = setTimeout(function () { stop.abort(); }, DELAI_DNS_MS);
  try {
    const r = await fetch(service + "?name=" + encodeURIComponent(domaine) + "&type=MX", {
      signal: stop.signal,
      cache: "no-store",
      headers: { accept: "application/dns-json" },
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    if (j.Status === 3) return false;
    if (j.Status !== 0) return null;
    const mx = (Array.isArray(j.Answer) ? j.Answer : []).filter(function (a: any) { return a && a.type === 15; });
    if (mx.length === 0) return false;
    const nuls = mx.filter(function (a: any) { return /^\d+\s+\.?$/.test(String(a.data || "").trim()); });
    return nuls.length < mx.length;
  } catch {
    return null;
  } finally {
    clearTimeout(minuteur);
    try { stop.abort(); } catch (e) { /* rien */ }
  }
}
async function recoitDuCourrier(domaine: string): Promise<boolean | null> {
  if (Object.prototype.hasOwnProperty.call(boites, domaine)) return boites[domaine];
  let r = await questionCourrier(domaine, "https://cloudflare-dns.com/dns-query");
  if (r === null) r = await questionCourrier(domaine, "https://dns.google/resolve");
  if (r !== null && nbBoites < 5000) { boites[domaine] = r; nbBoites++; }
  return r;
}

// 🆕 05/10 (apres-midi) — LA MEILLEURE ADRESSE DONT LE DOMAINE RECOIT DU
// COURRIER. Si le domaine de la premiere ne recoit rien, toutes ses adresses
// sont ecartees et on prend la suivante (quatre domaines au plus).
async function choisir(toutes: string[], domaines: string[]): Promise<{ adresse: string | null; ecartees: number }> {
  let reste = toutes.slice();
  let ecartees = 0;
  for (let essai = 0; essai < 4 && reste.length > 0; essai++) {
    const a = meilleure(reste, domaines);
    if (!a) break;
    const d = a.split("@")[1];
    const recoit = await recoitDuCourrier(d);
    if (recoit !== false) return { adresse: a, ecartees: ecartees };
    const avant = reste.length;
    reste = reste.filter(function (x) { return x.split("@")[1] !== d; });
    ecartees += avant - reste.length;
  }
  return { adresse: null, ecartees: ecartees };
}

async function traiter(nom: string, combien: number, depart: number): Promise<any> {
  const table = TABLES[nom];

  // 🚨 ON NE PREND QUE CE QUI A UN SITE ET PAS D ADRESSE. Et jamais deux
  // fois la meme ligne : `site_lu_le` marque ce qui est deja passe, qu on
  // ait trouve quelque chose ou non.
  const { data: lignes, error } = await supabase
    .from(table)
    // 🆕 01/10 — TOUTES LES COLONNES, pour savoir si la base a une colonne
    // `linkedin` : demander une colonne qui n existe pas ferait echouer la
    // lecture de toute la base. Une cle presente = une colonne presente.
    .select("*")
    .not("site_web", "is", null)
    .neq("site_web", "")
    .is("email", null)
    .is("site_lu_le", null)
    // 🆕 05/10 — TOUJOURS DANS LE MEME ORDRE : un site qui pose probleme se
    // retrouve, au lieu de changer de place d un passage a l autre.
    .order("id", { ascending: true })
    .limit(combien);

  if (error) return { table: table, erreur: error.message };
  if (!lignes || lignes.length === 0) return { table: table, info: "rien a lire" };

  let trouve = 0;
  let sansRien = 0;
  let injoignables = 0;
  let traites = 0;
  let doublons = 0;
  // 🆕 05/10 — ce qui ne se voyait pas : les sites abandonnes parce que trop
  // longs, les ecritures que la base a refusees, les erreurs.
  let tropLongs = 0;
  let refus = 0;
  let erreurs = 0;
  let premierRefus = "";
  let premiereErreur = "";
  let arret = "";
  // 🆕 05/10 (apres-midi) — les adresses ecartees parce que leur domaine ne
  // recoit pas de courrier.
  let sansBoite = 0;
  const exemples: any[] = [];

  // UN SITE : le lire, puis ecrire ce qu on en tire. Rend ce qui s est passe.
  async function unSite(l: any): Promise<string> {
    // 🆕 01/10 (soir) — UNE FICHE « [ND] » (non diffusible) n a pas de nom :
    // son site, venu de Dropcontact, ne peut pas etre verifie (c etait celui
    // du Dakota du Nord). On la marque lue, sans rien en tirer.
    // 🆕 05/10 — la fiche est deja marquee lue (voir le paquet, plus bas).
    if (String(l.raison_sociale || "").trim() === "[ND]") return "rien";
    const origine = normaliserSite(l.site_web);
    if (!origine) return "injoignable";

    const r = await explorer(origine, Date.now() + DUREE_SITE_MS);
    // 🆕 05/10 (apres-midi) — l adresse n est retenue que si son domaine
    // recoit du courrier (voir `choisir`).
    const choix = await choisir(r.toutes, r.domaines);
    r.adresse = choix.adresse;
    sansBoite += choix.ecartees;

    // 🆕 05/10 — `site_lu_le` n est plus ecrit ici : il l est AVANT la
    // lecture. Il ne reste a ecrire que ce qu on a trouve.
    const maj: any = {};
    let issue = "";
    if (r.adresse) {
      maj.email = r.adresse;
      maj.statut = "enrichi";
      issue = "trouve";
    } else if (r.trop_long) {
      issue = "trop_long";
      console.log("lire-sites : site trop long, abandonne", table, l.id, origine);
    } else {
      issue = r.pages_lues === 0 ? "injoignable" : "rien";
    }

    // 🆕 01/10 — LE LIEN LINKEDIN DU SITE, seulement si la base a la colonne
    // et que la fiche n en a pas deja un (Dropcontact peut l avoir trouve).
    if (r.linkedin && Object.prototype.hasOwnProperty.call(l, "linkedin") && !l.linkedin) {
      maj.linkedin = r.linkedin;
    }
    if (Object.keys(maj).length === 0) return issue;

    const { error: errMaj } = await supabase.from(table).update(maj).eq("id", l.id);
    if (errMaj) {
      // 🚨 01/10 — UNE ADRESSE DEJA PRESENTE DANS LA BASE (index unique sur
      // l adresse) fait echouer la mise a jour : on garde le lien LinkedIn
      // seul, et on le compte.
      // 🆕 05/10 — ON DISTINGUE CE REFUS-LA DES AUTRES. Tout refus de la
      // base etait compte « adresse deja en base », meme quand la cause
      // etait ailleurs, et la seconde ecriture n etait pas verifiee.
      const dejaLa = String((errMaj as any).code || "") === "23505"
        || /duplicate|unique/i.test(String(errMaj.message || ""));
      if (dejaLa) {
        if (maj.linkedin) await supabase.from(table).update({ linkedin: maj.linkedin }).eq("id", l.id);
        if (r.adresse) issue = "doublon";
      } else {
        // Un autre refus : on reessaie sans le lien LinkedIn (c est la seule
        // colonne facultative) ; s il persiste, on le compte et on le dit.
        let reste: any = errMaj;
        if (maj.linkedin && (maj.email || maj.statut)) {
          const sansLien: any = Object.assign({}, maj);
          delete sansLien.linkedin;
          const { error: err2 } = await supabase.from(table).update(sansLien).eq("id", l.id);
          reste = err2;
        }
        if (reste) {
          if (!premierRefus) premierRefus = String(reste.message || reste).slice(0, 200);
          console.log("lire-sites : ecriture refusee", table, l.id, String(reste.message || reste).slice(0, 200));
          return "refus";
        }
      }
    }
    if (issue === "trouve" && exemples.length < 8) exemples.push({ siren: l.siren, email: r.adresse });
    return issue;
  }

  for (let i = 0; i < lignes.length; i += PARALLELE) {
    // 🚨 ON REND LA MAIN AVANT QUE VERCEL COUPE. Les lignes deja traitees
    // sont ecrites : le prochain passage reprend ou celui-ci s arrete.
    if (Date.now() - depart > DUREE_MAX_MS) break;
    const paquet = lignes.slice(i, i + PARALLELE);

    // 🚨🆕 05/10 — ON MARQUE LE PAQUET « LU » AVANT DE LE LIRE, ET ON VERIFIE
    // QUE LA BASE L A ACCEPTE.
    // AVANT : `site_lu_le` etait ecrit apres la lecture de chaque site. Si
    // la lecture ne finissait pas (Vercel coupe a 300 s), rien n etait
    // ecrit, et le passage suivant reprenait LE MEME paquet : un seul site
    // suffisait a arreter tout l outil, sans aucune erreur visible. C est
    // ce qui s est passe du 02/10 au 05/10.
    // MAINTENANT : quoi qu il arrive ensuite, ces fiches ne reviendront pas.
    // ⚠️ LE PRIX : si Vercel coupe quand meme au milieu d un paquet, ses
    // huit sites au plus sont marques sans avoir ete lus. C est le choix
    // fait : perdre huit sites plutot qu arreter toutes les bases.
    // ⛔ SI LE MARQUAGE EST REFUSE, ON NE LIT RIEN : lire sans pouvoir
    // marquer, c est relire les memes sites sans fin.
    const { error: errMarque } = await supabase.from(table)
      .update({ site_lu_le: new Date().toISOString() })
      .in("id", paquet.map(function (l: any) { return l.id; }));
    if (errMarque) {
      arret = "marquage impossible : " + String(errMarque.message || errMarque).slice(0, 200);
      break;
    }

    const issues = await Promise.all(paquet.map(function (l: any) {
      return avecLimite(function () { return unSite(l); }, LIMITE_SITE_MS, function (e: any) {
        const texteErreur = String((e && e.message) || e).slice(0, 200);
        if (!premiereErreur) premiereErreur = texteErreur;
        console.log("lire-sites : erreur sur un site", table, l.id, texteErreur);
      });
    }));
    let longsDuPaquet = 0;
    for (const x of issues) {
      traites++;
      if (x === "trouve") trouve++;
      else if (x === "injoignable") injoignables++;
      else if (x === "doublon") doublons++;
      else if (x === "trop_long") { tropLongs++; longsDuPaquet++; }
      else if (x === "refus") refus++;
      else if (x === "erreur") erreurs++;
      else sansRien++;
    }
    // 🆕 05/10 — LA MOITIE D UN PAQUET TROP LONGUE, CE N EST PLUS UN SITE,
    // C EST LE RESEAU. On arrete ce passage plutot que de marquer « lus »,
    // paquet apres paquet, des sites qu on n arrive pas a lire ; le passage
    // suivant (cinq minutes plus tard) continue avec les sites suivants.
    if (longsDuPaquet >= 3 && longsDuPaquet * 2 >= paquet.length) {
      arret = "trop de sites trop longs dans un meme paquet (" + longsDuPaquet + " sur " + paquet.length
        + ") : passage arrete, le suivant continue";
      break;
    }
    await pause(PAUSE_MS);
  }

  if (arret && traites === 0) return { table: table, erreur: arret, arret: arret };

  return {
    table: table,
    sites_examines: traites,
    adresses_trouvees: trouve,
    sans_adresse_visible: sansRien,
    sites_injoignables: injoignables,
    adresses_deja_en_base: doublons,
    sites_trop_longs: tropLongs,
    ecritures_refusees: refus,
    erreurs: erreurs,
    adresses_sans_boite: sansBoite,
    premier_refus: premierRefus,
    premiere_erreur: premiereErreur,
    arret: arret,
    taux: traites > 0 ? Math.round(trouve * 1000 / traites) / 10 + " %" : "—",
    exemples: exemples,
    epuise: lignes.length < combien,
  };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const secret = p.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  // MODE MESURE : ce qu il y a a lire, sans rien lire.
  if (p.get("compter") === "1") {
    const etat: any[] = [];
    for (const nom of Object.keys(TABLES)) {
      const table = TABLES[nom];

      const { count: aLire, error } = await supabase
        .from(table).select("id", { count: "exact", head: true })
        .not("site_web", "is", null).neq("site_web", "")
        .is("email", null).is("site_lu_le", null);

      if (error) { etat.push({ table: table, erreur: error.message }); continue; }

      const { count: deja } = await supabase
        .from(table).select("id", { count: "exact", head: true })
        .not("site_lu_le", "is", null);

      const { count: avecEmail } = await supabase
        .from(table).select("id", { count: "exact", head: true })
        .not("email", "is", null);

      etat.push({
        base: nom, table: table,
        a_lire: aLire, deja_lus: deja, avec_email: avecEmail,
      });
    }
    return NextResponse.json({ mode: "mesure, aucune lecture", lot: LOT, tables: etat });
  }

  const depart = Date.now();

  const demande = Number(p.get("lot") || 0);
  const combien = demande > 0 && demande <= 1000 ? demande : LOT;

  // ?table= vise une base ; sans lui, on passe sur toutes, dans l ordre.
  const vise = String(p.get("table") || "").trim();
  const aTraiter = vise && TABLES[vise] ? [vise] : Object.keys(TABLES);

  // ON ENCHAINE LES LOTS TANT QU IL RESTE DU TEMPS - CORRIGE LE 15/09.
  //
  // LE DEFAUT : la route traitait UN lot de 120 sites et rendait la main.
  // Sur 5 341 sites a lire, a raison d un passage par nuit, la collecte
  // aurait pris SIX SEMAINES. Le calcul n avait jamais ete fait : le lot
  // avait ete regle sur la duree d un passage, sans le rapporter au total.
  //
  // C EST LA MEME ERREUR QUE SUR LA COLLECTE DEPARTEMENTALE, CORRIGEE DEUX
  // HEURES PLUS TOT LE MEME JOUR - « un departement par nuit, c est 99
  // nuits ». Le raisonnement etait fait, ecrit en commentaire dans un
  // fichier livre le matin meme, et il n a pas ete rejoue ici.
  //
  // LA REGLE, DESORMAIS : QUAND UNE ROUTE TRAITE UNE FILE, ELLE VIDE LA
  // FILE TANT QU ELLE A DU TEMPS. Le garde-fou de duree commande, jamais un
  // compteur de lots.
  const resultats: any[] = [];
  const cumul: any = {};
  // 🆕 05/10 — un arret demande par `traiter` (marquage refuse, reseau
  // malade) arrete le passage entier, pas seulement la base en cours.
  let arretDuPassage = "";

  for (const nom of aTraiter) {
    while (Date.now() - depart < DUREE_MAX_MS) {
      const r = await traiter(nom, combien, depart);
      if (r.info) break;
      if (r.erreur) { resultats.push(r); if (r.arret) arretDuPassage = r.arret; break; }

      // On additionne les lots d une meme base plutot que d empiler dix
      // lignes de compte rendu identiques.
      if (!cumul[nom]) {
        cumul[nom] = {
          table: r.table, sites_examines: 0, adresses_trouvees: 0,
          sans_adresse_visible: 0, sites_injoignables: 0,
          adresses_deja_en_base: 0, sites_trop_longs: 0,
          ecritures_refusees: 0, erreurs: 0, adresses_sans_boite: 0, exemples: [],
        };
      }
      const c = cumul[nom];
      c.sites_examines += r.sites_examines;
      c.adresses_trouvees += r.adresses_trouvees;
      c.sans_adresse_visible += r.sans_adresse_visible;
      c.sites_injoignables += r.sites_injoignables;
      c.adresses_deja_en_base += r.adresses_deja_en_base || 0;
      c.sites_trop_longs += r.sites_trop_longs || 0;
      c.ecritures_refusees += r.ecritures_refusees || 0;
      c.erreurs += r.erreurs || 0;
      c.adresses_sans_boite += r.adresses_sans_boite || 0;
      if (r.premier_refus && !c.premier_refus) c.premier_refus = r.premier_refus;
      if (r.premiere_erreur && !c.premiere_erreur) c.premiere_erreur = r.premiere_erreur;
      for (const e of (r.exemples || [])) {
        if (c.exemples.length < 10) c.exemples.push(e);
      }
      if (r.arret) { c.arret = r.arret; arretDuPassage = r.arret; break; }

      // Rien n a ete traite, ou la base est finie : on sort.
      if (r.sites_examines === 0 || r.epuise) break;
    }

    if (cumul[nom]) {
      const c = cumul[nom];
      c.taux = c.sites_examines > 0
        ? Math.round(c.adresses_trouvees * 1000 / c.sites_examines) / 10 + " %"
        : "—";
      resultats.push(c);
    }

    // Une base visee explicitement s arrete la ; sinon on enchaine.
    if (vise) break;
    if (arretDuPassage) break;
    if (Date.now() - depart > DUREE_MAX_MS) break;
  }

  if (resultats.length === 0) {
    return NextResponse.json({
      mode: "lecture des sites",
      info: "plus aucun site a lire dans les bases demandees",
      duree_s: Math.round((Date.now() - depart) / 1000),
    });
  }

  // 🆕 05/10 — UN MARQUAGE REFUSE PAR LA BASE EST UNE PANNE, ET ELLE DOIT SE
  // VOIR : la reponse passe en erreur (500), que Vercel affiche en rouge
  // dans la liste des passages. Jusqu ici, tout passage repondait « 200 »,
  // qu il ait travaille ou non.
  const enPanne = arretDuPassage.indexOf("marquage impossible") === 0;
  return NextResponse.json({
    mode: "lecture des sites",
    resultats: resultats,
    arret: arretDuPassage || null,
    duree_s: Math.round((Date.now() - depart) / 1000),
  }, { status: enPanne ? 500 : 200 });
}
