import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Aucune lecture gardee en cache (meme regle que trouver-sites et lire-sites).
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const maxDuration = 300;

// ═══════════════════════════════════════════════════════════════════════
// CONTROLER UN SITE AVANT QUE SON ADRESSE NE PARTE EN CAMPAGNE — 08/10/2026
//
// POURQUOI. Le 08/10, le repassage des cabinets a trouve 518 nouveaux sites
// et 402 adresses. Controle a la main de 148 de ces sites : 8 etaient FAUX
// (hibou.fr, une societe d informatique de Nimes, pour un cabinet de
// Bordeaux ; gea.com, un industriel allemand ; agex.fr, cefico.fr, acg.fr :
// des cabinets homonymes, dans une autre region). L un d eux avait deja recu
// un courriel le matin meme : une adresse nouvelle entrait dans la campagne
// des le lendemain, sans aucun second regard. Jacques : « il faut controler
// [tous les sites] », et « pourquoi ne pas faire les reglages des maintenant ».
//
// CE QUE FAIT CETTE ROUTE. Elle prend les fiches en attente
// (statut = 'a_controler'), RELIT leur site (accueil, mentions legales,
// contact), interroge le REGISTRE OFFICIEL des entreprises, et tranche :
//   · le site est PROUVE      → statut 'enrichi' : la campagne peut l ecrire ;
//   · le site n est pas prouve → statut 'a_verifier' : il attend un regard.
// ⛔ Elle n efface rien : ni le site, ni l adresse. Elle ne fait que changer
// l etiquette, et ecrire ce qu elle a vu (site_controle, site_controle_le).
//
// CE QUI PROUVE UN SITE — volontairement plus strict que trouver-sites, dont
// les huit faux venaient de trois faiblesses : le nom de la ville cite
// n importe ou sur la page (« orange », « paris », « bordeaux ») ; le
// departement reduit a deux chiffres ; le metier reconnu au seul mot « audit ».
//   1. LE SIREN de la societe sur le site. Preuve absolue.
//   2. Sinon, les TROIS ensemble :
//      a. LE METIER, au sens strict (expert-comptable, expertise comptable,
//         commissaire aux comptes, gestion agreee, comptabilite…) ;
//      b. UN LIEU CERTAIN : le code postal exact de la fiche ou de l un des
//         etablissements que donne le registre ; a defaut, le nom de la
//         commune ET un code postal du meme departement sur le site ;
//      c. L IDENTITE : le prenom et le nom d un dirigeant ecrits ensemble ;
//         ou le nom complet de la societe ; ou un nom de la societe (son
//         nom, son enseigne, son nom commercial, son sigle — ceux du
//         REGISTRE compris) que le NOM DU SITE porte ET que la page ecrit.
//         Un sigle court (moins de cinq lettres) que nous avons forme
//         nous-memes sur les initiales ne vaut qu avec le code postal exact.
//
// 🚨 UN BON SITE QUE CES PREUVES NE SUFFISENT PAS A ETABLIR VA A
// 'a_verifier'. Il n est pas perdu : il attend. Mieux vaut cela qu ecrire a
// la mauvaise societe.
//
// LES MODES :
//   ?compter=1                    ce qui attend, sans rien controler ;
//   ?essai=1&lot=100&debut=0      controle 100 fiches et REND SON VERDICT
//                                 SANS RIEN ECRIRE (puis debut=100, 200…) ;
//   ?essai=1&statut=a_verifier    idem, sur les fiches deja mises de cote ;
//   sans rien                     controle et ecrit (c est la tache automatique).
// ⚠️ TOUTE BASE AJOUTEE A `TABLES` doit avoir les colonnes site_controle
// (text) et site_controle_le (timestamptz).
// ═══════════════════════════════════════════════════════════════════════

const TABLES: any = {
  cabinets: { table: "prospects_cabinets", metier: "comptable" },
};

// LE METIER, AU SENS STRICT (texte sans accents ni ponctuation).
// ⚠️ « audit » seul n y est pas : un audit energetique, un audit de site ou
// un audit qualite ne font pas un cabinet comptable (acee.fr : desamiantage).
const PREUVES_METIER: any = {
  comptable: ["expert comptable", "experts comptables", "expertise comptable", "expertises comptables",
    "commissaire aux comptes", "commissaires aux comptes", "commissariat aux comptes",
    "gestion agree", "association de gestion", "centre de gestion", "organisme de gestion",
    "organisme mixte de gestion", "cabinet comptable", "comptabilite"],
};

const EN_ATTENTE = "a_controler";
const PROUVE = "enrichi";
const NON_PROUVE = "a_verifier";

const LOT = 100;
const PARALLELE = 8;
const DELAI_MS = 7000;
const DELAI_CORPS_MS = 8000;
const TAILLE_MAX = 400000;
const DUREE_MAX_MS = 200000;
const DUREE_FICHE_MS = 40000;
// Un site qui ne repond pas est retente aux passages suivants ; au
// troisieme echec, la fiche part a 'a_verifier' (elle ne bloque pas la file).
const ESSAIS_INJOIGNABLE = 3;
const PAGES_SUPPOSEES = ["/mentions-legales", "/contact"];

const FORMES = [
  "sarl", "sas", "sasu", "selarl", "selas", "selafa", "selca", "selurl", "sel",
  "scp", "eurl", "sa", "snc", "sci", "scm", "aarpi", "sc", "gie", "societe", "ste",
  "l", "d", "monsieur", "madame", "mademoiselle", "mme", "mlle", "mr", "ei", "eirl", "scop", "sasp", "scic",
];
const GENERIQUES = [
  "cabinet", "groupe", "et", "associes", "associe", "associees", "associee",
  "de", "du", "des", "la", "le", "les", "en", "me", "maitre",
  "avocat", "avocats", "avocate", "avocates",
  "expert", "experts", "expertise", "expertises", "comptable", "comptables", "comptabilite",
  "conseil", "conseils", "audit", "audits", "gestion", "france", "international",
  "office", "partners", "partenaires", "and", "law", "firm", "the", "fiduciaire",
  "fiscal", "fiscale", "juridique", "juridiques", "societe",
];
const PETITS = ["et", "de", "du", "des", "la", "le", "les", "en", "l", "d", "a", "au", "aux"];

const sansCache = function (entree: any, options?: any) {
  return fetch(entree, { ...(options || {}), cache: "no-store" });
};
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { global: { fetch: sansCache as any } }
);

// ─────────────────────────────────────────────────────────── LE TEXTE
// Un texte sans accents, en minuscules, sans ponctuation.
function plat(v: any): string {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " et ")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Les mots d un nom ; des lettres seules qui se suivent forment un sigle.
function mots(v: any): string[] {
  const p = plat(v);
  if (!p) return [];
  const sortie: string[] = [];
  let sigle = "";
  for (const m of p.split(" ")) {
    if (m.length === 1) { sigle += m; continue; }
    if (sigle) { sortie.push(sigle); sigle = ""; }
    sortie.push(m);
  }
  if (sigle) sortie.push(sigle);
  return sortie.filter(function (m) { return m.length >= 2; });
}

// Le nom hors parentheses, et ce qui est entre parentheses (les enseignes).
function decoupe(raisonSociale: any): { nom: string; enseignes: string[] } {
  const brut = String(raisonSociale || "");
  const enseignes: string[] = [];
  const nom = brut.replace(/\(([^()]*)\)/g, function (_tout: string, dedans: string) {
    const d = String(dedans || "").trim();
    if (d) enseignes.push(d);
    return " ";
  }).replace(/\s+/g, " ").trim();
  return { nom: nom || brut, enseignes: enseignes };
}

function contientMot(t: string, m: string): boolean {
  if (!m) return false;
  return (" " + t + " ").indexOf(" " + m + " ") >= 0;
}

// Les sigles formes sur les initiales du nom (trois a sept mots) : sans la
// forme juridique, et avec le mot « societe » quand le nom commence par lui
// (« SOCIETE FRANCILIENNE DE REVISION ET D EXPERTISE COMPTABLE » : SFREC).
function siglesDe(raisonSociale: any): string[] {
  const tous = mots(decoupe(raisonSociale).nom).filter(function (m) { return PETITS.indexOf(m) < 0; });
  const sortie: string[] = [];
  const ajouter = function (liste: string[]) {
    if (liste.length < 3 || liste.length > 7) return;
    const s = liste.map(function (m) { return m[0]; }).join("");
    if (sortie.indexOf(s) < 0) sortie.push(s);
  };
  ajouter(tous.filter(function (m) { return FORMES.indexOf(m) < 0; }));
  ajouter(tous.filter(function (m) { return FORMES.indexOf(m) < 0 || m === "societe" || m === "ste"; }));
  return sortie;
}

// Le texte qui se lit sur une page : sans scripts ni balises, mais AVEC le
// titre, la description et les donnees structurees (l adresse y est souvent).
function texteDe(html: string): string {
  const morceaux: string[] = [];
  const metas = html.match(/<meta[^>]+content=["'][^"']{3,400}["'][^>]*>/gi) || [];
  for (const m of metas.slice(0, 40)) {
    const c = m.match(/content=["']([^"']*)["']/i);
    if (c) morceaux.push(c[1]);
  }
  const structurees = html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const s of structurees.slice(0, 6)) morceaux.push(s.replace(/<[^>]+>/g, " ").slice(0, 6000));
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&[a-z]+;/gi, " ");
  return visible + " " + morceaux.join(" ");
}

// Le SIREN, ecrit d un bloc ou par groupes (« 123 456 789 », « 123.456.789 »).
function porteSiren(texte: string, siren: string): boolean {
  const s = String(siren || "").replace(/\D/g, "");
  if (s.length !== 9) return false;
  const motif = new RegExp("(^|[^0-9])" + s.split("").join("[\\s.\\u00a0-]?") + "([^0-9]|$)");
  return motif.test(texte);
}

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

// Le nom du site, sans son extension : « www.fnp-nord.fr » → « fnpnord ».
function nomDuSite(domaine: string): string {
  const parties = domaine.split(".");
  parties.pop();
  if (parties.length > 1 && ["co", "com", "asso", "gouv"].indexOf(parties[parties.length - 1]) >= 0) parties.pop();
  return parties.join("").replace(/[^a-z0-9]/g, "");
}

// ─────────────────────────────────────────────────────────── LES PAGES
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
  try { lecteur.cancel().catch(function () { return null; }); } catch (e) { /* rien */ }
  return texte.slice(0, limite);
}

// Lire une page. Le delai couvre la reponse ET la lecture de son contenu.
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
        "accept-language": "fr-FR,fr;q=0.9,en;q=0.5",
      },
    });
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { stop.abort(); }, DELAI_CORPS_MS);
    if (!r.ok) return { erreur: "http " + r.status };
    const type = String(r.headers.get("content-type") || "");
    if (type && type.indexOf("html") < 0) return { erreur: "pas une page" };
    const texte = await corpsBorne(r, TAILLE_MAX);
    if (!texte && stop.signal.aborted) return { erreur: "delai depasse" };
    return { html: texte, finale: r.url || url };
  } catch (e: any) {
    if (stop.signal.aborted) return { erreur: "delai depasse" };
    return { erreur: "connexion refusee" };
  } finally {
    clearTimeout(minuteur);
    try { stop.abort(); } catch (e) { /* rien */ }
  }
}

function estPage(x: any): x is { html: string; finale: string } {
  return x && typeof x.html === "string";
}

// Les liens de l accueil vers les mentions legales et la page de contact.
function liensAnnexes(html: string, base: string): string[] {
  const MOTS = ["mention", "legal", "contact", "coordonnees", "nous-trouver", "cabinet", "equipe", "qui-sommes",
    "a-propos", "apropos", "agence", "about"];
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
    if (/\.(pdf|jpg|jpeg|png|gif|svg|css|js|zip|doc|docx)$/.test(u.pathname.toLowerCase())) continue;
    const chemin = (u.pathname + u.search).toLowerCase();
    const rang = MOTS.findIndex(function (m) { return chemin.indexOf(m) >= 0; });
    if (rang < 0) continue;
    const propreUrl = u.origin + u.pathname + u.search;
    if (trouves.some(function (x) { return x.url === propreUrl; })) continue;
    trouves.push({ url: propreUrl, rang: rang });
  }
  trouves.sort(function (a, b) { return a.rang - b.rang; });
  return trouves.slice(0, 3).map(function (x) { return x.url; });
}

// Un travail avec une heure limite, sans qu une erreur ne remonte.
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

// Tout ce qui se lit sur le site : l accueil, puis trois pages annexes au plus.
async function lireLeSite(site: string, limite: number): Promise<{ texte: string; pages: number; erreur: string }> {
  const domaine = domaineDe(site) || "";
  let accueil: any = await lire(/^https?:\/\//i.test(site) ? site : "https://" + site);
  if (!estPage(accueil) && domaine && Date.now() < limite) accueil = await lire("https://www." + domaine);
  if (!estPage(accueil) && domaine && Date.now() < limite) accueil = await lire("http://" + domaine);
  if (!estPage(accueil)) return { texte: "", pages: 0, erreur: String(accueil.erreur || "illisible") };

  let texte = texteDe(accueil.html);
  let pages = 1;
  let annexes = liensAnnexes(accueil.html, accueil.finale);
  if (annexes.length === 0) {
    let origine = "";
    try { origine = new URL(accueil.finale).origin; } catch { origine = ""; }
    if (origine) annexes = PAGES_SUPPOSEES.map(function (c) { return origine + c; });
  }
  for (const u of annexes) {
    if (Date.now() > limite) break;
    const p = await lire(u);
    if (!estPage(p)) continue;
    texte += " " + texteDe(p.html);
    pages++;
  }
  return { texte: texte, pages: pages, erreur: "" };
}

// ─────────────────────────────────────────────────────────── LE REGISTRE
// https://recherche-entreprises.api.gouv.fr : public, gratuit, sans cle.
// Les demandes d un paquet sont espacees de 400 ms ; un refus « trop de
// demandes » est retente une fois. Sans reponse, le controle continue avec
// la fiche seule (il prouvera moins, il ne prouvera pas a tort).
const REGISTRE_URL = "https://recherche-entreprises.api.gouv.fr/search";
const registreEtat: any = { demandes: 0, reponses: 0, retenues: 0, sans_demande: 0, trop_de_demandes: 0, premier_refus: "" };

function nomRegistre(v: any): string {
  return mots(decoupe(v).nom).filter(function (m) { return FORMES.indexOf(m) < 0; }).join(" ");
}

async function registre(l: any, rang: number): Promise<any> {
  const siren = String(l.siren || "").replace(/\D/g, "");
  const cp = String(l.code_postal || "").replace(/\D/g, "");
  const nomFiche = nomRegistre(l.raison_sociale);
  let url = "";
  if (siren.length === 9) url = REGISTRE_URL + "?q=" + siren + "&per_page=1";
  else if (nomFiche.length >= 3 && cp.length === 5) {
    url = REGISTRE_URL + "?q=" + encodeURIComponent(decoupe(l.raison_sociale).nom.slice(0, 120))
      + "&code_postal=" + cp + "&per_page=10";
  } else { registreEtat.sans_demande++; return null; }

  if (rang > 0) await new Promise(function (ok) { setTimeout(ok, rang * 400); });
  const stop = new AbortController();
  const minuteur = setTimeout(function () { stop.abort(); }, 11000);
  let liste: any[] = [];
  try {
    const options: any = {
      cache: "no-store",
      signal: stop.signal,
      headers: { "User-Agent": "AcademIA-Pro-enrichissement/1.0 (contact@academiapro.fr)", "Accept": "application/json" },
    };
    let r = await fetch(url, options);
    registreEtat.demandes++;
    if (r.status === 429) {
      registreEtat.trop_de_demandes++;
      const dit = Number(r.headers.get("retry-after") || 0);
      const attente = Math.min(3000, Math.max(1000, (dit > 0 ? dit * 1000 : 1500))) + Math.floor(Math.random() * 500);
      await new Promise(function (ok) { setTimeout(ok, attente); });
      r = await fetch(url, options);
    }
    if (!r.ok) {
      if (!registreEtat.premier_refus) registreEtat.premier_refus = "http " + r.status;
      return null;
    }
    const j: any = await r.json();
    liste = Array.isArray(j && j.results) ? j.results : [];
    registreEtat.reponses++;
  } catch (e: any) {
    if (!registreEtat.premier_refus) registreEtat.premier_refus = String((e && e.message) || e).slice(0, 160);
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

  // Tous les etablissements que le registre detaille : le siege et les autres.
  const etablissements: any[] = [e.siege || {}].concat(Array.isArray(e.matching_etablissements) ? e.matching_etablissements : []);
  const noms: string[] = [];
  const lieux: { cp: string; commune: string }[] = [];
  const ajouterNom = function (v: any) {
    const t = String(v || "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
    if (t.length < 3 || t.length > 80) return;
    if (noms.some(function (x) { return plat(x) === plat(t); })) return;
    noms.push(t);
  };
  for (const s of etablissements) {
    // ⚠️ Un etablissement ferme ne prouve plus un lieu.
    if (String(s.etat_administratif || "A") === "F") continue;
    ajouterNom(s.nom_commercial);
    for (const x of (Array.isArray(s.liste_enseignes) ? s.liste_enseignes : [])) ajouterNom(x);
    const c = String(s.code_postal || "").replace(/\D/g, "");
    if (c.length === 5 && !lieux.some(function (x) { return x.cp === c; })) {
      lieux.push({ cp: c, commune: String(s.libelle_commune || "") });
    }
  }
  const sigle = String(e.sigle || "").trim();
  const personnes: { nom: string; prenom: string }[] = [];
  for (const d of (Array.isArray(e.dirigeants) ? e.dirigeants : [])) {
    if (!d || !d.nom || !d.prenoms) continue;
    // « GODEL (DOREY) » : le nom d usage est entre parentheses ; les deux valent.
    const nomsDe = String(d.nom).split(/[()]/).map(function (x) { return x.trim(); }).filter(function (x) { return x.length >= 3; });
    for (const n of nomsDe) personnes.push({ nom: n, prenom: String(d.prenoms).split(/[\s,]+/)[0] });
  }
  return {
    siren: String(e.siren || ""),
    fermee: String(e.etat_administratif || "") === "C",
    noms: noms.slice(0, 6),
    sigle: sigle.length >= 3 && sigle.length <= 12 ? sigle : "",
    lieux: lieux.slice(0, 12),
    personnes: personnes.slice(0, 8),
  };
}

// ─────────────────────────────────────────────────────────── LES PREUVES
// LE LIEU CERTAIN. `brut` : le texte tel qu il se lit ; `t` : le meme, plat.
function lieuCertain(brut: string, t: string, l: any, reg: any): string | null {
  const lieux: { cp: string; commune: string }[] = [];
  const cpFiche = String(l.code_postal || "").replace(/\D/g, "");
  if (cpFiche.length === 5) lieux.push({ cp: cpFiche, commune: String(l.ville || "") });
  for (const x of ((reg && reg.lieux) || [])) {
    if (!lieux.some(function (y) { return y.cp === x.cp; })) lieux.push(x);
  }
  // Le code postal est un nombre entier : « 54000 » dans un telephone n en est pas un.
  for (const x of lieux) {
    if (new RegExp("(^|[^0-9])" + x.cp + "([^0-9]|$)").test(brut)) return "code postal";
  }
  // A defaut : la commune ET un code postal du meme departement. Les petits
  // cabinets donnent parfois l adresse du bureau voisin.
  for (const x of lieux) {
    const commune = plat(x.commune).replace(/ [0-9]+(er|e|eme)? arrondissement$/, "").replace(/ [0-9]+$/, "");
    if (commune.length < 4 || !contientMot(t, commune)) continue;
    const dep = x.cp.slice(0, 2) === "97" ? x.cp.slice(0, 3) : x.cp.slice(0, 2);
    if (new RegExp("(^|[^0-9])" + dep + "[0-9]{" + (5 - dep.length) + "}([^0-9]|$)").test(brut)) return "commune et département";
  }
  return null;
}

// L IDENTITE. Rend { preuve, forte } ou null.
function identite(t: string, l: any, reg: any, domaine: string): { preuve: string; forte: boolean } | null {
  const tt = " " + t + " ";
  const site = nomDuSite(domaine);

  // 1. Un dirigeant : prenom et nom ecrits ensemble.
  const personnes: { nom: string; prenom: string }[] = [];
  for (const n of String(l.dirigeant_nom || "").split(/[()]/)) {
    if (n.trim().length >= 3) personnes.push({ nom: n.trim(), prenom: String(l.dirigeant_prenom || "") });
  }
  for (const p of ((reg && reg.personnes) || [])) personnes.push(p);
  for (const p of personnes) {
    const nn = mots(p.nom).join(" ");
    const pn = mots(p.prenom).join(" ");
    if (nn.length < 3 || pn.length < 3) continue;
    if (tt.indexOf(" " + pn + " " + nn + " ") >= 0 || tt.indexOf(" " + nn + " " + pn + " ") >= 0) {
      return { preuve: "prénom et nom du dirigeant", forte: true };
    }
  }

  // 2. Le nom complet de la societe, ecrit tel quel (deux mots au moins).
  const parts = decoupe(l.raison_sociale);
  const raison = mots(parts.nom).filter(function (m) { return FORMES.indexOf(m) < 0; });
  if (raison.length >= 2 && raison.join(" ").length >= 8 && tt.indexOf(" " + raison.join(" ") + " ") >= 0) {
    return { preuve: "nom complet de la société", forte: true };
  }

  // 3. Un nom de la societe que le NOM DU SITE porte et que la page ecrit.
  //    Les noms du registre et les enseignes d abord (ils sont officiels).
  const officiels: string[] = parts.enseignes.concat((reg && reg.noms) || []);
  if (reg && reg.sigle) officiels.push(reg.sigle);
  for (const n of officiels) {
    const colle = plat(n).replace(/ /g, "");
    if (colle.length < 3) continue;
    if (site.indexOf(colle) < 0) continue;
    if (contientMot(t, plat(n)) || tt.indexOf(" " + colle + " ") >= 0) {
      return { preuve: "enseigne ou nom commercial dans le nom du site", forte: colle.length >= 5 };
    }
  }
  //    Le nom de la societe sans ses mots generiques.
  const coeur = raison.filter(function (m) {
    return GENERIQUES.indexOf(m) < 0 && m.length >= 4 && !/^[0-9]+$/.test(m);
  });
  for (const m of coeur) {
    if (site.indexOf(m) >= 0 && contientMot(t, m)) return { preuve: "nom de la société dans le nom du site", forte: m.length >= 5 };
  }
  const tout = raison.join("");
  if (tout.length >= 6 && site.indexOf(tout) >= 0) return { preuve: "nom de la société dans le nom du site", forte: true };

  //    Le nom de famille d un dirigeant (cinq lettres au moins).
  for (const p of personnes) {
    const nn = mots(p.nom).join("");
    if (nn.length >= 5 && site.indexOf(nn) >= 0 && contientMot(t, mots(p.nom).join(" "))) {
      return { preuve: "nom du dirigeant dans le nom du site", forte: true };
    }
  }

  //    Le sigle forme sur les initiales : une preuve FAIBLE (voir `juger`).
  for (const sigle of siglesDe(l.raison_sociale)) {
    if (sigle.length >= 3 && site.indexOf(sigle) >= 0 && contientMot(t, sigle)) {
      return { preuve: "sigle dans le nom du site", forte: false };
    }
  }

  // 4. Le nom de famille d un dirigeant sur la page seulement : FAIBLE aussi.
  for (const p of personnes) {
    const nn = mots(p.nom);
    if (nn.length > 0 && nn.join("").length >= 4 && contientMot(t, nn.join(" "))) {
      return { preuve: "nom du dirigeant sur la page", forte: false };
    }
  }
  return null;
}

// LE VERDICT D UNE FICHE, a partir de ce qui a ete lu.
function juger(texte: string, l: any, reg: any, metier: string, domaine: string): { prouve: boolean; motif: string } {
  const siren = String(l.siren || "").replace(/\D/g, "").length === 9 ? String(l.siren).replace(/\D/g, "") : String((reg && reg.siren) || "");
  if (porteSiren(texte, siren)) return { prouve: true, motif: "SIREN sur le site" };

  const t = plat(texte);
  if (t.length < 200) return { prouve: false, motif: "page presque vide (site en construction, ou texte chargé par un programme)" };

  const metierOk = (PREUVES_METIER[metier] || []).some(function (p: string) { return t.indexOf(p) >= 0; });
  if (!metierOk) return { prouve: false, motif: "le métier n'est pas écrit sur le site" };

  const qui = identite(t, l, reg, domaine);
  if (!qui) return { prouve: false, motif: "ni le nom de la société, ni son enseigne, ni son dirigeant" };

  const lieu = lieuCertain(texte, t, l, reg);
  if (!lieu) return { prouve: false, motif: qui.preuve + ", mais aucun lieu certain (ni le code postal, ni la commune avec son département)" };

  // 🚨 UNE IDENTITE FAIBLE (un sigle court, un nom de famille seul) NE VAUT
  // QU AVEC LE CODE POSTAL EXACT. « acg.fr » : un autre cabinet ACG.
  if (!qui.forte && lieu !== "code postal") {
    return { prouve: false, motif: qui.preuve + " + " + lieu + " : trop faible sans le code postal exact" };
  }
  return { prouve: true, motif: qui.preuve + " + " + lieu + " + métier" };
}

// ─────────────────────────────────────────────────────────── UNE FICHE
async function controler(l: any, metier: string, rang: number): Promise<any> {
  const domaine = domaineDe(l.site_web);
  if (!domaine) return { prouve: false, motif: "adresse de site illisible", registre: false, pages: 0 };
  const limite = Date.now() + DUREE_FICHE_MS - 5000;
  const reg = await registre(l, rang);
  if (reg && reg.fermee) return { prouve: false, motif: "société fermée au registre", registre: true, pages: 0 };
  const lu = await lireLeSite(String(l.site_web), limite);
  if (lu.pages === 0) return { injoignable: true, motif: "site injoignable (" + lu.erreur + ")", registre: !!reg, pages: 0 };
  const v = juger(lu.texte, l, reg, metier, domaine);
  return { prouve: v.prouve, motif: v.motif, registre: !!reg, pages: lu.pages };
}

function autorise(req: NextRequest): boolean {
  const secret = req.nextUrl.searchParams.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!autorise(req)) return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  const p = req.nextUrl.searchParams;

  // MODE MESURE : ce qui attend, sans rien controler.
  if (p.get("compter") === "1") {
    const etat: any[] = [];
    for (const nom of Object.keys(TABLES)) {
      const conf = TABLES[nom];
      const compte = async function (statut: string) {
        const { count, error } = await supabase.from(conf.table).select("id", { count: "exact", head: true }).eq("statut", statut);
        return error ? "erreur : " + error.message : count;
      };
      etat.push({ base: nom, table: conf.table, en_attente: await compte(EN_ATTENTE), a_verifier: await compte(NON_PROUVE) });
    }
    return NextResponse.json({ mode: "mesure, aucun contrôle", tables: etat });
  }

  const depart = Date.now();
  // 🚨 ?essai=1 : on controle, on rend le verdict, et on N ECRIT RIEN.
  const essai = p.get("essai") === "1";
  const debut = Math.max(0, Number(p.get("debut") || 0) || 0);
  const demande = Number(p.get("lot") || 0);
  const combien = demande > 0 && demande <= 400 ? demande : LOT;
  const vise = String(p.get("table") || "").trim();
  const aTraiter = vise && TABLES[vise] ? [vise] : Object.keys(TABLES);
  // 🆕 ?statut=a_verifier (ESSAI SEULEMENT) : rendre le verdict sur les fiches
  // deja mises de cote. C est la mesure des « faux ecartes » : ces fiches
  // sont des sites reconnus faux a la main ; le controle doit les refuser.
  const lu = essai && p.get("statut") === NON_PROUVE ? NON_PROUVE : EN_ATTENTE;
  registreEtat.demandes = 0; registreEtat.reponses = 0; registreEtat.retenues = 0;
  registreEtat.sans_demande = 0; registreEtat.trop_de_demandes = 0; registreEtat.premier_refus = "";

  const resultats: any[] = [];
  let arret = "";
  for (const nom of aTraiter) {
    const conf = TABLES[nom];
    const bilan: any = {
      base: nom, table: conf.table, fiches_controlees: 0, prouvees: 0, non_prouvees: 0,
      injoignables: 0, trop_longues: 0, ecritures_refusees: 0, premier_refus: "", details: [],
    };
    // Les fiches jamais controlees d abord, puis celles dont le site n avait
    // pas repondu : une fiche qui echoue ne passe pas devant les autres.
    const { data: lignes, error } = await supabase
      .from(conf.table).select("*")
      .eq("statut", lu)
      .order("site_controle_le", { ascending: true, nullsFirst: true })
      .order("id", { ascending: true })
      .range(essai ? debut : 0, (essai ? debut : 0) + combien - 1);
    if (error) {
      resultats.push({ base: nom, erreur: "lecture impossible : " + error.message });
      arret = "lecture impossible";
      break;
    }
    const file: any[] = lignes || [];
    for (let i = 0; i < file.length; i += PARALLELE) {
      if (Date.now() - depart > DUREE_MAX_MS) { arret = "durée du passage atteinte"; break; }
      const paquet = file.slice(i, i + PARALLELE);
      const verdicts = await Promise.all(paquet.map(function (l: any, rang: number) {
        return avecLimite(
          function () { return controler(l, conf.metier, rang); },
          DUREE_FICHE_MS,
          function () { return { injoignable: true, trop_long: true, motif: "contrôle trop long", registre: false, pages: 0 }; },
          function (e: any) { return { injoignable: true, motif: "erreur : " + String((e && e.message) || e).slice(0, 120), registre: false, pages: 0 }; }
        );
      }));
      for (let k = 0; k < paquet.length; k++) {
        const l = paquet[k];
        const v = verdicts[k];
        bilan.fiches_controlees++;
        if (v.trop_long) bilan.trop_longues++;
        // Combien de fois ce site n a deja pas repondu (ecrit dans site_controle).
        const deja = Number((String(l.site_controle || "").match(/^injoignable \((\d+)\)/) || [])[1] || 0);
        let statut = EN_ATTENTE;
        let note = "";
        if (v.injoignable) {
          bilan.injoignables++;
          const fois = deja + 1;
          note = "injoignable (" + fois + ") — " + v.motif;
          if (fois >= ESSAIS_INJOIGNABLE) { statut = NON_PROUVE; bilan.non_prouvees++; }
        } else if (v.prouve) {
          statut = PROUVE; bilan.prouvees++;
          note = "prouvé — " + v.motif;
        } else {
          statut = NON_PROUVE; bilan.non_prouvees++;
          note = "non prouvé — " + v.motif;
        }
        bilan.details.push({
          id: l.id, societe: String(l.raison_sociale || "").slice(0, 70), ville: l.ville || "", site: l.site_web,
          verdict: v.injoignable ? "injoignable" : (v.prouve ? "prouvé" : "non prouvé"),
          motif: v.motif, registre: v.registre ? "oui" : "non", pages_lues: v.pages,
        });
        if (essai) continue;
        // ⚠️ `.eq("statut", EN_ATTENTE)` : on ne touche pas une fiche qu un
        // autre passage, ou Jacques, aurait changee entre-temps.
        const { error: refus } = await supabase.from(conf.table)
          .update({ statut: statut, site_controle: note.slice(0, 300), site_controle_le: new Date().toISOString() })
          .eq("id", l.id).eq("statut", EN_ATTENTE);
        if (refus) {
          bilan.ecritures_refusees++;
          if (!bilan.premier_refus) bilan.premier_refus = refus.message;
        }
      }
      // Ce que la base refuse d ecrire est une panne : on s arrete et on le dit.
      if (bilan.ecritures_refusees > 0) { arret = "écriture refusée par la base : " + bilan.premier_refus; break; }
    }
    // Hors essai, le detail n est garde que pour les fiches non prouvees.
    if (!essai) bilan.details = bilan.details.filter(function (d: any) { return d.verdict !== "prouvé"; }).slice(0, 60);
    resultats.push(bilan);
    if (arret || essai) break;
  }

  const enPanne = arret.indexOf("écriture refusée") === 0 || arret === "lecture impossible";
  return NextResponse.json({
    mode: essai ? "essai, rien n'est écrit (fiches « " + lu + " »)" : "contrôle des sites",
    registre_etat: registreEtat,
    resultats: resultats,
    arret: arret || null,
    duree_s: Math.round((Date.now() - depart) / 1000),
  }, { status: enPanne ? 500 : 200 });
}
