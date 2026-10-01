import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { promises as dnsPromises } from "dns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
};

// LES MOTS QUI PROUVENT LE METIER SUR LA PAGE (texte sans accents).
const PREUVES_METIER: any = {
  avocat: ["avocat"],
  comptable: ["expert comptable", "expert-comptable", "expertise comptable", "comptab", "commissaire aux comptes", "audit"],
};

// COMBIEN DE LIGNES PAR LECTURE EN BASE, ET COMBIEN EN PARALLELE.
// ⚠️ EN PARALLELE, PAS PLUS DE SIX : chaque ligne interroge jusqu a vingt
// domaines et ouvre quelques pages. Au-dela, les delais d abandon se
// cumulent et le passage deborde.
const LOT = 60;
const PARALLELE = 6;

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
const DUREE_MAX_MS = 250000;

// AU PLUS, COMBIEN DE DOMAINES OUVRIR POUR UNE LIGNE.
// Les questions DNS sont presque gratuites ; les pages, non.
const MAX_DOMAINES_OUVERTS = 4;

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
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
  const raison = mots(l.raison_sociale).filter(function (m) { return FORMES.indexOf(m) < 0; });
  const coeur = raison.filter(function (m) { return GENERIQUES.indexOf(m) < 0; });
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
  // 2. Le coeur du nom, avec les tournures du metier.
  // ⚠️ LE COEUR SEUL VIENT EN DERNIER : « alpha.fr » ou « martin.com »
  // existent presque toujours et appartiennent a quelqu un d autre. Les
  // ouvrir en premier consommerait les quatre ouvertures permises.
  const coeurSeul: string[] = [];
  if (coeur.length > 0 && coeur.length <= 3) {
    const c = coeur.join("-");
    const cc = coeur.join("");
    coeurSeul.push(c);
    if (cc !== c) coeurSeul.push(cc);
    if (metier === "avocat") {
      ajouter(c + "-avocats"); ajouter(c + "-avocat"); ajouter("cabinet-" + c);
      ajouter(cc + "avocats"); ajouter("avocat-" + c);
    } else {
      ajouter(c + "-expertise"); ajouter("cabinet-" + c); ajouter(c + "-expert-comptable");
      ajouter(c + "-conseil"); ajouter(c + "-audit"); ajouter(cc + "expertise");
    }
    ajouter(c + "-associes");
  }
  // 3. Le dirigeant.
  if (nom.length > 0 && nom.length <= 3) {
    const n = nom.join("-");
    if (metier === "avocat") {
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
    if (metier === "avocat") {
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
async function existe(domaine: string): Promise<boolean> {
  try {
    const r = await resolveur.resolve4(domaine);
    return Array.isArray(r) && r.length > 0;
  } catch {
    // ⚠️ Certains sites ne repondent qu a « www. » : on lui pose la question.
    try {
      const r = await resolveur.resolve4("www." + domaine);
      return Array.isArray(r) && r.length > 0;
    } catch {
      return false;
    }
  }
}

// LIRE UNE PAGE, AVEC UN DELAI D ABANDON. Rend le texte ET l adresse finale
// (apres redirections) : c est elle qui sera ecrite comme site.
// 🆕 01/10 (deuxieme essai) — LA RAISON DE L ECHEC EST RENDUE : sur 30
// cabinets, la moitie des domaines plausibles (« auditgestionconseil.fr »
// pour AUDIT GESTION CONSEIL) etaient « illisibles » sans qu on sache
// pourquoi. `erreur` dit maintenant : code HTTP, delai, ou refus de
// connexion (souvent un certificat invalide).
async function lire(url: string): Promise<{ html: string; finale: string } | { erreur: string }> {
  const stop = new AbortController();
  const minuteur = setTimeout(function () { stop.abort(); }, DELAI_MS);
  try {
    const r = await fetch(url, {
      signal: stop.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AcademiaPro-Contact/1.0; +https://www.academiapro.fr)",
        accept: "text/html,application/xhtml+xml",
        // ⚠️ Certains pare-feu refusent une requete sans langue.
        "accept-language": "fr-FR,fr;q=0.9,en;q=0.5",
      },
    });
    clearTimeout(minuteur);
    if (!r.ok) return { erreur: "http " + r.status };
    const type = String(r.headers.get("content-type") || "");
    if (type && type.indexOf("html") < 0) return { erreur: "pas une page (" + type.split(";")[0] + ")" };
    const texte = await r.text();
    return { html: texte.slice(0, 400000), finale: r.url || url };
  } catch (e: any) {
    clearTimeout(minuteur);
    if (stop.signal.aborted) return { erreur: "delai depasse" };
    const cause = String((e && e.cause && (e.cause.code || e.cause.message)) || (e && e.message) || "inconnue");
    return { erreur: "connexion refusee (" + cause.slice(0, 60) + ")" };
  }
}

function estPage(x: any): x is { html: string; finale: string } {
  return x && typeof x.html === "string";
}

// 🆕 OUVRIR UN DOMAINE : https, puis https://www., puis http:// — mais le
// repli en http ne se fait que si l echec N EST PAS un delai depasse (un
// serveur muet le resterait en http, et ce serait 4 secondes de plus).
// ⚠️ LE REPLI EN http EST REVENU : au premier essai, sans lui, des sites
// de petits cabinets au certificat expire etaient « illisibles ».
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

async function ouvrir(d: string): Promise<{ html: string; finale: string } | { erreur: string }> {
  const a = await lire("https://" + d);
  if (estPage(a)) return await suivreRenvoi(a);
  const b = await lire("https://www." + d);
  if (estPage(b)) return await suivreRenvoi(b);
  if ((a as any).erreur === "delai depasse" && (b as any).erreur === "delai depasse") return a;
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
  const raison = mots(raisonSociale).filter(function (m) { return FORMES.indexOf(m) < 0; });
  const pourSigle = raison.filter(function (m) { return PETITS.indexOf(m) < 0; });
  if (pourSigle.length < 3 || pourSigle.length > 6) return null;
  return pourSigle.map(function (m) { return m[0]; }).join("");
}

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
  if (cp.length === 5 && brut.indexOf(cp) >= 0) return "code postal";
  if (cp.length === 5) {
    const dep = cp.slice(0, 2);
    const motif = new RegExp("(^|[^0-9])" + dep + "[0-9]{3}([^0-9]|$)");
    if (motif.test(brut)) return "departement";
  }
  return null;
}

// L IDENTITE : c est bien CE cabinet.
// 🆕 01/10 — DEUX PREUVES DE PLUS : le nom complet du cabinet ecrit tel
// quel (« Audit Gestion Conseil » : trois mots generiques, donc aucun mot
// distinctif, et pourtant c est son nom) ; et le sigle, quand le domaine
// est forme sur ce sigle ET que la page l ecrit (agcexpertise.fr qui ecrit
// « AGC »).
function identiteDe(t: string, l: any, domaine: string): string | null {
  const nom = mots(l.dirigeant_nom).filter(function (m) { return m.length >= 3; });
  if (nom.length > 0 && nom.every(function (m) { return contientMot(t, m); })) return "nom";

  const raison = mots(l.raison_sociale).filter(function (m) { return FORMES.indexOf(m) < 0; });
  const coeur = raison
    .filter(function (m) { return GENERIQUES.indexOf(m) < 0; })
    .filter(function (m) { return m.length >= 3; });
  if (coeur.length > 0 && coeur.every(function (m) { return contientMot(t, m); })) return "cabinet";

  if (raison.length >= 2 && (" " + t + " ").indexOf(" " + raison.join(" ") + " ") >= 0) return "nom complet du cabinet";

  const sigle = sigleDe(l.raison_sociale);
  if (sigle && sigle.length >= 3 && domaine.replace(/[^a-z0-9]/g, "").indexOf(sigle) >= 0 && contientMot(t, sigle)) {
    return "sigle";
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

  const lieu = lieuDe(brut, t, l);
  if (!lieu) return null;

  const identite = identiteDe(t, l, domaine);
  if (!identite) return null;

  return identite + " + " + lieu;
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
  if (!identiteDe(t, l, domaine)) return "ni le nom du dirigeant, ni celui du cabinet, ni son sigle";
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

// CHERCHER LE SITE D UNE LIGNE.
async function chercher(l: any, metier: string): Promise<any> {
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
  if (liste.length === 0) return { site: null, raison: "aucun nom exploitable", testes: 0, existants: 0 };

  // Toutes les questions DNS en meme temps : elles coutent quelques
  // millisecondes, et la plupart des domaines devines n existent pas.
  const reponses = await Promise.all(liste.map(function (d) { return existe(d); }));
  const existants = liste.filter(function (_d, i) { return reponses[i]; });

  const journal: any[] = [];
  let ouverts = 0;
  for (const d of existants) {
    if (ouverts >= MAX_DOMAINES_OUVERTS) break;
    ouverts++;
    // ⚠️ PAS DE REPLI EN « http:// » : trois essais par domaine sur quatre
    // domaines, c etait jusqu a 48 secondes pour une seule ligne qui ne
    // repond pas. Les sites de cabinets sont aujourd hui en https.
    const ouvert = await ouvrir(d);
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
        // ⚠️ AU PLUS TROIS PAGES ANNEXES LUES : au-dela, une ligne muette
        // couterait trop cher au passage.
        let annexesLues = 0;
        for (const chemin of PAGES_MENTIONS) {
          if (annexesLues >= 3) break;
          const m = await lire(origineMentions + chemin);
          if (!estPage(m)) continue;
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
      };
    }
  }
  return {
    site: null,
    raison: existants.length === 0 ? "aucun domaine existant" : "aucun site verifie",
    testes: liste.length,
    existants: existants.length,
    domaines_existants: existants.slice(0, 8),
    journal: journal,
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
    .eq("desabonne", false)
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
  const exemples: any[] = [];
  // 🆕 EN ESSAI : le detail de chaque ligne ou un domaine existait.
  const details: any[] = [];

  for (let i = 0; i < lignes.length; i += PARALLELE) {
    // 🚨 ON REND LA MAIN AVANT QUE VERCEL COUPE : ce qui est ecrit est
    // acquis, le passage suivant reprend la.
    if (Date.now() - depart > DUREE_MAX_MS) break;
    const paquet = lignes.slice(i, i + PARALLELE);
    const resultats = await Promise.all(paquet.map(function (l: any) { return chercher(l, conf.metier); }));

    for (let k = 0; k < paquet.length; k++) {
      const l = paquet[k];
      const r = resultats[k];
      traites++;
      if (r.site) {
        trouves++;
        if (r.preuve === "siren") parSiren++; else parNom++;
        if (exemples.length < 12) {
          exemples.push({ cabinet: l.raison_sociale, ville: l.ville, site: r.site, preuve: r.preuve });
        }
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
        });
      }
      // ⛔ EN ESSAI, RIEN N EST ECRIT : on mesure seulement.
      if (essai) continue;
      const maj: any = { site_cherche_le: new Date().toISOString() };
      if (r.site) {
        maj.site_web = r.site;
        maj.site_trouve_par = "devine:" + r.preuve;
        if (r.linkedin && Object.prototype.hasOwnProperty.call(l, "linkedin") && !l.linkedin) {
          maj.linkedin = r.linkedin;
        }
      }
      await supabase.from(conf.table).update(maj).eq("id", l.id);
    }
  }

  return {
    table: conf.table,
    lignes_examinees: traites,
    sites_trouves: trouves,
    dont_par_siren: parSiren,
    dont_par_nom_et_ville: parNom,
    aucun_domaine_existant: sansDomaine,
    domaines_existants_mais_non_verifies: nonVerifies,
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
        .or("site_web.is.null,site_web.eq.").eq("desabonne", false);
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
  const debut = Math.max(0, Number(p.get("debut") || 0) || 0);
  const demande = Number(p.get("lot") || 0);
  const combien = demande > 0 && demande <= 500 ? demande : LOT;
  const vise = String(p.get("table") || "").trim();
  const aTraiter = vise && TABLES[vise] ? [vise] : Object.keys(TABLES);

  const resultats: any[] = [];
  for (const nom of aTraiter) {
    const cumul: any = {
      table: TABLES[nom].table, lignes_examinees: 0, sites_trouves: 0,
      dont_par_siren: 0, dont_par_nom_et_ville: 0, aucun_domaine_existant: 0,
      domaines_existants_mais_non_verifies: 0, exemples: [],
    };
    let vu = false;
    while (Date.now() - depart < DUREE_MAX_MS) {
      const r = await traiter(nom, combien, depart, essai, debut);
      if (r.info) break;
      if (r.erreur) { resultats.push(r); break; }
      vu = true;
      cumul.lignes_examinees += r.lignes_examinees;
      cumul.sites_trouves += r.sites_trouves;
      cumul.dont_par_siren += r.dont_par_siren;
      cumul.dont_par_nom_et_ville += r.dont_par_nom_et_ville;
      cumul.aucun_domaine_existant += r.aucun_domaine_existant;
      cumul.domaines_existants_mais_non_verifies += r.domaines_existants_mais_non_verifies;
      for (const e of r.exemples) if (cumul.exemples.length < 12) cumul.exemples.push(e);
      if (essai) cumul.details = r.details;
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
    if (Date.now() - depart > DUREE_MAX_MS) break;
  }

  return NextResponse.json({
    mode: essai ? "essai, rien n est ecrit" : "recherche des sites",
    resultats: resultats,
    duree_s: Math.round((Date.now() - depart) / 1000),
  });
}
