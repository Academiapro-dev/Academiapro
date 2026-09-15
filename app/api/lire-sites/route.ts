import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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

const TABLES: any = {
  immobilier: "prospects_immobilier",
  ecommerce: "prospects_ecommerce",
  gros: "prospects_gros",
  organismes: "prospects_organismes",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
  cabinets: "prospects_cabinets",
};

// COMBIEN DE SITES PAR PASSAGE.
// ⚠️ CHAQUE SITE DEMANDE DEUX A QUATRE LECTURES (l accueil, puis la page
// contact). A une seconde par site en moyenne, 200 sites tiennent dans les
// 270 secondes du garde-fou.
const LOT = 200;

// LES PAGES OU L ADRESSE SE TROUVE, DANS L ORDRE DE PROBABILITE.
// ⚠️ ON COMMENCE PAR L ACCUEIL : beaucoup de sites d agence mettent leur
// adresse dans le pied de page, present sur toutes les pages. Quand elle y
// est, on s arrete la et on economise trois lectures.
const CHEMINS = ["", "/contact", "/nous-contacter", "/contactez-nous", "/mentions-legales"];

// LE DELAI AVANT D ABANDONNER UN SITE, EN MILLISECONDES.
// 🚨 SANS CE DELAI, UN SEUL SITE MORT BLOQUE TOUT LE PASSAGE. Certains
// serveurs acceptent la connexion et ne repondent jamais : la lecture
// resterait ouverte jusqu a ce que Vercel coupe, et le compte rendu serait
// perdu avec elle.
const DELAI_MS = 6000;

const PAUSE_MS = 120;
const DUREE_MAX_MS = 260000;

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
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
    if (vues[a]) return;
    vues[a] = true;
    sortie.push(a);
  };

  // 1. Les mailto, d abord : ce sont les plus sures.
  const liens = html.match(/mailto:[^"'\s>)]+/gi) || [];
  for (const l of liens) ajouter(l);

  // 2. Le texte.
  const brutes = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  for (const b of brutes) ajouter(b);

  return sortie;
}

// CHOISIR LA MEILLEURE ADRESSE QUAND IL Y EN A PLUSIEURS.
//
// 🚨 L ORDRE COMPTE. Une page de contact rend souvent trois adresses : le
// contact general, le service location, le webmaster. On prend celle qui
// parle a un dirigeant.
// ⚠️ ET ON PREFERE TOUJOURS UNE ADRESSE DU MEME DOMAINE QUE LE SITE : une
// agence dont le site est agence.fr et qui affiche un gmail est suspecte —
// c est souvent celle du prestataire, ou une adresse recopiee d ailleurs.
function meilleure(adresses: string[], domaine: string): string | null {
  if (adresses.length === 0) return null;

  const memeDomaine = adresses.filter(function (a) {
    return a.split("@")[1] === domaine;
  });
  const pool = memeDomaine.length > 0 ? memeDomaine : adresses;

  const PREFERES = ["contact@", "info@", "accueil@", "bonjour@", "hello@", "agence@", "direction@"];
  for (const p of PREFERES) {
    for (const a of pool) if (a.indexOf(p) === 0) return a;
  }
  return pool[0];
}

// LIRE UNE PAGE, AVEC UN DELAI D ABANDON.
async function lire(url: string): Promise<string | null> {
  const stop = new AbortController();
  const minuteur = setTimeout(function () { stop.abort(); }, DELAI_MS);
  try {
    const r = await fetch(url, {
      signal: stop.signal,
      redirect: "follow",
      headers: {
        // ⚠️ SANS EN-TETE D IDENTIFICATION, beaucoup de serveurs repondent
        // 403. On se presente honnetement : un lecteur, pas un navigateur
        // deguise.
        "user-agent": "Mozilla/5.0 (compatible; MrCRM-Contact/1.0; +https://www.mrcrm.fr)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(minuteur);
    if (!r.ok) return null;
    const type = String(r.headers.get("content-type") || "");
    if (type && type.indexOf("html") < 0) return null;
    const texte = await r.text();
    // ⚠️ ON BORNE LA TAILLE : certaines pages font plusieurs megaoctets, et
    // l adresse n est jamais au-dela des 400 premiers kilooctets.
    return texte.slice(0, 400000);
  } catch {
    clearTimeout(minuteur);
    return null;
  }
}

// TOUT CE QU ON PEUT TIRER D UN SITE.
async function explorer(origine: string): Promise<any> {
  let domaine = "";
  try { domaine = new URL(origine).hostname.replace(/^www\./, ""); } catch { domaine = ""; }

  const trouvees: string[] = [];
  let pagesLues = 0;

  for (const chemin of CHEMINS) {
    const html = await lire(origine + chemin);
    if (!html) continue;
    pagesLues++;

    for (const a of adressesDe(html)) {
      if (trouvees.indexOf(a) < 0) trouvees.push(a);
    }

    // 🚨 ON S ARRETE DES QU ON A UNE ADRESSE DU BON DOMAINE. Continuer
    // couterait trois lectures pour rien — et sur 2 855 sites, ces lectures
    // inutiles feraient la difference entre un passage et cinq.
    const bonne = trouvees.filter(function (a) { return a.split("@")[1] === domaine; });
    if (bonne.length > 0) break;
  }

  return {
    adresse: meilleure(trouvees, domaine),
    toutes: trouvees,
    pages_lues: pagesLues,
  };
}

async function traiter(nom: string, combien: number, depart: number): Promise<any> {
  const table = TABLES[nom];

  // 🚨 ON NE PREND QUE CE QUI A UN SITE ET PAS D ADRESSE. Et jamais deux
  // fois la meme ligne : `site_lu_le` marque ce qui est deja passe, qu on
  // ait trouve quelque chose ou non.
  const { data: lignes, error } = await supabase
    .from(table)
    .select("id, siren, site_web")
    .not("site_web", "is", null)
    .neq("site_web", "")
    .is("email", null)
    .is("site_lu_le", null)
    .limit(combien);

  if (error) return { table: table, erreur: error.message };
  if (!lignes || lignes.length === 0) return { table: table, info: "rien a lire" };

  let trouve = 0;
  let sansRien = 0;
  let injoignables = 0;
  const exemples: any[] = [];

  for (const l of lignes) {
    // 🚨 ON REND LA MAIN AVANT QUE VERCEL COUPE. Les lignes deja traitees
    // sont ecrites : le prochain passage reprend ou celui-ci s arrete.
    if (Date.now() - depart > DUREE_MAX_MS) break;

    const origine = normaliserSite(l.site_web);
    if (!origine) {
      await supabase.from(table)
        .update({ site_lu_le: new Date().toISOString() })
        .eq("id", l.id);
      injoignables++;
      continue;
    }

    const r = await explorer(origine);

    const maj: any = { site_lu_le: new Date().toISOString() };
    if (r.adresse) {
      maj.email = r.adresse;
      maj.statut = "enrichi";
      trouve++;
      if (exemples.length < 8) exemples.push({ siren: l.siren, email: r.adresse });
    } else {
      if (r.pages_lues === 0) injoignables++; else sansRien++;
    }

    await supabase.from(table).update(maj).eq("id", l.id);
    await pause(PAUSE_MS);
  }

  return {
    table: table,
    sites_examines: lignes.length,
    adresses_trouvees: trouve,
    sans_adresse_visible: sansRien,
    sites_injoignables: injoignables,
    taux: lignes.length > 0 ? Math.round(trouve * 1000 / lignes.length) / 10 + " %" : "—",
    exemples: exemples,
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

  const resultats: any[] = [];
  for (const nom of aTraiter) {
    if (Date.now() - depart > DUREE_MAX_MS) break;
    const r = await traiter(nom, combien, depart);
    if (!r.info) resultats.push(r);
    // Une base visee explicitement s arrete la ; sinon on enchaine.
    if (vise) break;
  }

  if (resultats.length === 0) {
    return NextResponse.json({
      mode: "lecture des sites",
      info: "plus aucun site a lire dans les bases demandees",
      duree_s: Math.round((Date.now() - depart) / 1000),
    });
  }

  return NextResponse.json({
    mode: "lecture des sites",
    resultats: resultats,
    duree_s: Math.round((Date.now() - depart) / 1000),
  });
}
