import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 05/10/2026 — LA VEILLE DE L OUTIL D ENRICHISSEMENT
//
// POURQUOI. Du vendredi 02/10 au lundi 05/10, l outil d enrichissement
// (trouver-sites + lire-sites) n a plus rien ecrit : un site qui ne
// finissait pas de repondre bloquait chaque passage. Vercel affichait des
// passages toutes les cinq minutes ; la base, elle, ne bougeait plus. TROIS
// JOURS, et rien ne l a signale : il a fallu une mesure a la main pour le
// voir. Jacques : « il faudrait que cela ne s arrete jamais de tourner ».
//
// CE QUE FAIT CETTE ROUTE, UNE FOIS PAR HEURE (vercel.json) :
//   1. elle compte ce qu il RESTE a chercher (cabinets, avocats) et a lire
//      (toutes les bases), et releve l heure du dernier travail ;
//   2. elle compare a son observation de l heure precedente, gardee dans la
//      table `outil_veille` ;
//   3. S IL RESTAIT DU TRAVAIL IL Y A UNE HEURE, QU IL EN RESTE, ET QUE RIEN
//      N A ETE FAIT DEPUIS : un courriel part a Jacques. Un rappel toutes les
//      douze heures tant que l arret dure ; un courriel quand c est reparti ;
//   4. elle relit les adresses ecrites depuis une heure et previent si l une
//      d elles n a pas la forme d une adresse (le 05/10, deux envois de
//      campagne ont ete refuses pour cela).
//
// ⚠️ ELLE NE REPARE RIEN ET NE TOUCHE A AUCUNE FICHE : elle regarde, et elle
// previent. Sa seule ecriture est sa propre ligne dans `outil_veille`.
//
// ⚠️ POURQUOI COMPARER A L HEURE PRECEDENTE, plutot que « rien depuis une
// heure » : apres une longue periode sans travail (tout est passe), une
// nouvelle base importee ferait croire a un arret alors que l outil n a pas
// encore eu son passage. Avec la comparaison, il faut que le travail ait
// ATTENDU une heure entiere sans que rien ne bouge.
//
// LES APPELS A LA MAIN :
//   ?voir=1    rend l observation, sans rien ecrire ni envoyer ;
//   ?essai=1   envoie un courriel d essai (pour verifier que l alerte arrive),
//              sans rien ecrire.
// ═══════════════════════════════════════════════════════════════════════

// 🚨 AUCUNE LECTURE GARDEE EN CACHE (regle du 02/10 : toute route qui lit la
// base refuse le cache, client compris).
const sansCache = function (entree: any, options?: any) {
  return fetch(entree, { ...(options || {}), cache: "no-store" });
};
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { global: { fetch: sansCache as any } }
);

// LES BASES — les memes que dans les deux routes de l outil.
// ⚠️ SI UNE BASE EST AJOUTEE A trouver-sites OU A lire-sites, L AJOUTER ICI.
// 🆕 07/10 — la recherche porte desormais sur les huit bases (elle ne
// portait que sur les cabinets et les avocats).
const RECHERCHE: any = {
  cabinets: "prospects_cabinets",
  avocats: "prospects_avocats",
  organismes: "prospects_organismes",
  immobilier: "prospects_immobilier",
  gros: "prospects_gros",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
  ecommerce: "prospects_ecommerce",
};
const LECTURE: any = {
  cabinets: "prospects_cabinets",
  avocats: "prospects_avocats",
  organismes: "prospects_organismes",
  immobilier: "prospects_immobilier",
  gros: "prospects_gros",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
  ecommerce: "prospects_ecommerce",
};
// 🆕 08/10 (soir) — LE CONTROLE DES SITES AVANT L ENVOI (controler-sites).
// ⚠️ LES MEMES BASES QUE `TABLES` DE controler-sites.
const CONTROLE: any = {
  cabinets: "prospects_cabinets",
};

const HEURE = 3600 * 1000;
// Deux observations plus rapprochees que cela ne se comparent pas (un appel
// a la main entre deux passages ne doit ni alerter, ni effacer l observation
// de l heure precedente).
const ECART_MIN_MS = 45 * 60 * 1000;
// Tant que l arret dure, un rappel toutes les douze heures — pas un par heure.
const RAPPEL_MS = 12 * HEURE;
const CLE = "enrichissement";
const EXPEDITEUR = "AcadéMIA Pro <contact@academiapro.fr>";
const DESTINATAIRE = process.env.ALERTE_EMAIL || "contact@academiapro.fr";

function html(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// UNE HEURE EN CLAIR, A PARIS.
function heureDeParis(iso: any): string {
  if (!iso) return "jamais";
  const d = new Date(String(iso));
  if (!isFinite(d.getTime())) return "inconnue";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(d).replace(",", " à").replace(/\s+/g, " ");
  } catch {
    return d.toISOString();
  }
}

function nombre(n: any): string {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// LA MEME REGLE QUE lire-sites (`adresseValable`) : ce qui ne ressemble pas
// exactement a une adresse n en est pas une.
function adresseValable(brut: any): boolean {
  const a = String(brut || "").trim().toLowerCase();
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

// LA DATE LA PLUS RECENTE D UNE COLONNE, ou null. Une base sans la colonne
// rend une erreur : elle est notee, jamais fatale.
async function derniere(table: string, colonne: string): Promise<{ le: string | null; erreur: string }> {
  const { data, error } = await supabase.from(table)
    .select(colonne)
    .not(colonne, "is", null)
    .order(colonne, { ascending: false })
    .limit(1);
  if (error) return { le: null, erreur: String(error.message || error).slice(0, 160) };
  const ligne: any = (data || [])[0];
  return { le: ligne && ligne[colonne] ? String(ligne[colonne]) : null, erreur: "" };
}

function plusRecente(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

// CE QU IL RESTE A CHERCHER — le meme filtre que trouver-sites.
async function observerRecherche(): Promise<any> {
  const parBase: any = {};
  let reste = 0;
  let le: string | null = null;
  const erreurs: string[] = [];
  for (const nom of Object.keys(RECHERCHE)) {
    const table = RECHERCHE[nom];
    const { count, error } = await supabase.from(table)
      .select("id", { count: "exact", head: true })
      .is("site_cherche_le", null).is("email", null)
      // 🆕 07/10 — meme filtre que trouver-sites : une case « desabonne »
      // vide vaut « non ».
      .or("site_web.is.null,site_web.eq.").not("desabonne", "is", true)
      .neq("raison_sociale", "[ND]");
    if (error) { erreurs.push(nom + " : " + String(error.message || error).slice(0, 160)); continue; }
    const d = await derniere(table, "site_cherche_le");
    if (d.erreur) erreurs.push(nom + " : " + d.erreur);
    parBase[nom] = { reste: count || 0, derniere: d.le };
    reste += count || 0;
    le = plusRecente(le, d.le);
  }
  return { reste: reste, derniere: le, par_base: parBase, erreurs: erreurs };
}

// CE QU IL RESTE A LIRE — le meme filtre que lire-sites.
async function observerLecture(): Promise<any> {
  const parBase: any = {};
  let reste = 0;
  let le: string | null = null;
  const erreurs: string[] = [];
  for (const nom of Object.keys(LECTURE)) {
    const table = LECTURE[nom];
    const { count, error } = await supabase.from(table)
      .select("id", { count: "exact", head: true })
      .not("site_web", "is", null).neq("site_web", "")
      .is("email", null).is("site_lu_le", null);
    if (error) { erreurs.push(nom + " : " + String(error.message || error).slice(0, 160)); continue; }
    const d = await derniere(table, "site_lu_le");
    if (d.erreur) erreurs.push(nom + " : " + d.erreur);
    parBase[nom] = { reste: count || 0, derniere: d.le };
    reste += count || 0;
    le = plusRecente(le, d.le);
  }
  return { reste: reste, derniere: le, par_base: parBase, erreurs: erreurs };
}

// 🆕 08/10 (soir) — CE QU IL RESTE A CONTROLER : les fiches que
// controler-sites n a pas encore jugees (statut « a_controler »).
async function observerControle(): Promise<any> {
  const parBase: any = {};
  let reste = 0;
  let le: string | null = null;
  const erreurs: string[] = [];
  for (const nom of Object.keys(CONTROLE)) {
    const table = CONTROLE[nom];
    const { count, error } = await supabase.from(table)
      .select("id", { count: "exact", head: true })
      .eq("statut", "a_controler");
    if (error) { erreurs.push(nom + " : " + String(error.message || error).slice(0, 160)); continue; }
    const d = await derniere(table, "site_controle_le");
    if (d.erreur) erreurs.push(nom + " : " + d.erreur);
    parBase[nom] = { reste: count || 0, derniere: d.le };
    reste += count || 0;
    le = plusRecente(le, d.le);
  }
  return { reste: reste, derniere: le, par_base: parBase, erreurs: erreurs };
}

// LES ADRESSES ECRITES DEPUIS `depuis` QUI N ONT PAS LA FORME D UNE ADRESSE.
async function adressesMalFormees(depuis: string): Promise<{ base: string; email: string }[]> {
  const sortie: { base: string; email: string }[] = [];
  for (const nom of Object.keys(LECTURE)) {
    const { data, error } = await supabase.from(LECTURE[nom])
      .select("email, site_lu_le")
      .not("email", "is", null)
      .gte("site_lu_le", depuis)
      .limit(2000);
    if (error) continue;
    for (const l of ((data || []) as any[])) {
      if (!adresseValable(l.email) && sortie.length < 40) sortie.push({ base: nom, email: String(l.email).slice(0, 160) });
    }
  }
  return sortie;
}

// UNE PARTIE DE L OUTIL EST-ELLE A L ARRET ?
// Il restait du travail a l observation precedente, il en reste, et le
// dernier travail date d avant cette observation.
function aLArret(partie: any, avant: any, avantLe: string | null, maintenantMs: number): boolean {
  if (!partie || !avant || !avantLe) return false;
  if (!(Number(avant.reste) > 0) || !(Number(partie.reste) > 0)) return false;
  const t0 = new Date(avantLe).getTime();
  if (!isFinite(t0) || maintenantMs - t0 < ECART_MIN_MS) return false;
  if (!partie.derniere) return true;
  return new Date(String(partie.derniere)).getTime() < t0;
}

function tableauHtml(o: any): string {
  const lignes: string[] = [];
  const une = function (titre: string, partie: any, verbe: string) {
    for (const nom of Object.keys((partie && partie.par_base) || {})) {
      const b = partie.par_base[nom];
      if (!(b.reste > 0) && !b.derniere) continue;
      lignes.push("<tr><td style=\"padding:4px 10px;border-bottom:1px solid #eee\">" + html(titre) + " — " + html(nom)
        + "</td><td style=\"padding:4px 10px;border-bottom:1px solid #eee;text-align:right\">" + nombre(b.reste) + " à " + verbe
        + "</td><td style=\"padding:4px 10px;border-bottom:1px solid #eee\">dernier travail : " + html(heureDeParis(b.derniere)) + "</td></tr>");
    }
  };
  une("Recherche des sites", o.recherche, "chercher");
  une("Lecture des sites", o.lecture, "lire");
  une("Contrôle des sites", o.controle, "contrôler");
  return "<table style=\"border-collapse:collapse;font-size:14px\">" + lignes.join("") + "</table>";
}

function cadre(titre: string, corps: string): string {
  return '<div style="font-family:Georgia,serif;color:#222;max-width:640px;margin:0 auto;padding:20px">'
    + "<h2>" + html(titre) + "</h2>" + corps
    + '<p style="font-size:12px;color:#777">Message automatique de la veille de l\'outil d\'enrichissement (une vérification par heure).</p></div>';
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const secret = p.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  }
  const voir = p.get("voir") === "1";
  const essai = p.get("essai") === "1";

  const cleResend = process.env.RESEND_API_KEY || "";
  const resend = cleResend ? new Resend(cleResend) : null;
  const envois: string[] = [];
  const echecs: string[] = [];
  const envoyer = async function (sujet: string, corps: string): Promise<boolean> {
    if (!resend) { echecs.push("envoi de courriel indisponible (RESEND_API_KEY)"); return false; }
    const r: any = await resend.emails.send({
      from: EXPEDITEUR, to: DESTINATAIRE, subject: sujet, html: corps,
    } as any).catch(function (e: any) { return { error: e }; });
    if (r && r.error) { echecs.push(sujet + " : " + String(r.error.message || r.error)); return false; }
    envois.push(sujet);
    return true;
  };

  const maintenant = new Date();
  const maintenantMs = maintenant.getTime();
  const observation: any = {
    le: maintenant.toISOString(),
    recherche: await observerRecherche(),
    lecture: await observerLecture(),
    controle: await observerControle(),
  };

  // L ESSAI : un courriel, et rien d autre.
  if (essai) {
    await envoyer("Essai — la veille de l'outil d'enrichissement vous écrit bien",
      cadre("Ceci est un essai", "<p>Si vous lisez ce message, l'alerte fonctionne : elle vous écrira d'elle-même si l'outil "
        + "d'enrichissement s'arrête. Voici ce qu'elle voit en ce moment.</p>" + tableauHtml(observation)));
    return NextResponse.json({ mode: "essai, rien n est ecrit", envois: envois, echecs: echecs, observation: observation },
      { status: echecs.length > 0 ? 500 : 200 });
  }

  // L OBSERVATION PRECEDENTE.
  const { data: ligne, error: errEtat } = await supabase.from("outil_veille")
    .select("valeur").eq("cle", CLE).maybeSingle();
  if (errEtat) {
    return NextResponse.json({
      erreur: "table outil_veille illisible : " + String(errEtat.message || errEtat).slice(0, 200),
      observation: observation,
    }, { status: 500 });
  }
  const etat: any = (ligne && (ligne as any).valeur) || {};
  const avant: any = etat.observation || null;
  const avantLe: string | null = avant && avant.le ? String(avant.le) : null;

  const arrets: string[] = [];
  if (aLArret(observation.recherche, avant && avant.recherche, avantLe, maintenantMs)) arrets.push("recherche");
  if (aLArret(observation.lecture, avant && avant.lecture, avantLe, maintenantMs)) arrets.push("lecture");
  if (aLArret(observation.controle, avant && avant.controle, avantLe, maintenantMs)) arrets.push("controle");

  if (voir) {
    return NextResponse.json({
      mode: "mesure, rien n est ecrit ni envoye",
      a_l_arret: arrets, alerte_en_cours: etat.alerte || null,
      observation: observation, observation_precedente: avant,
    });
  }

  // ⚠️ DEUX OBSERVATIONS TROP RAPPROCHEES NE SE COMPARENT PAS : on garde
  // alors l ancienne comme reference, et on ne decide rien.
  const tropProche = !!avantLe && maintenantMs - new Date(avantLe).getTime() < ECART_MIN_MS;

  let alerte: any = etat.alerte || null;
  if (!tropProche) {
    const noms: any = { recherche: "la recherche des sites", lecture: "la lecture des sites", controle: "le contrôle des sites" };
    if (arrets.length > 0) {
      const dernierCourriel = alerte && alerte.dernier_courriel ? new Date(String(alerte.dernier_courriel)).getTime() : 0;
      if (!alerte || maintenantMs - dernierCourriel >= RAPPEL_MS) {
        const quoi = arrets.map(function (a) { return noms[a]; }).join(" et ");
        const depuis = alerte && alerte.depuis ? String(alerte.depuis) : String(avantLe);
        const ok = await envoyer(
          (alerte ? "Rappel — " : "") + "Enrichissement à l'arrêt : " + quoi
            + (arrets.length > 1 ? " n'avancent plus" : " n'avance plus"),
          cadre("L'outil d'enrichissement n'avance plus",
            "<p><strong>" + html(quoi.charAt(0).toUpperCase() + quoi.slice(1)) + "</strong> : il restait du travail à "
            + html(heureDeParis(avantLe)) + ", il en reste toujours, et rien n'a été fait depuis.</p>"
            + (alerte ? "<p>Cet arrêt dure depuis le " + html(heureDeParis(depuis)) + ".</p>" : "")
            + tableauHtml(observation)
            + "<p>Les passages peuvent continuer d'apparaître dans Vercel sans que rien ne s'écrive : "
            + "c'est la base qui fait foi. Transmettez ce message à Claude pour le diagnostic.</p>"));
        if (ok) alerte = { depuis: depuis, dernier_courriel: maintenant.toISOString(), quoi: arrets };
      } else {
        alerte.quoi = arrets;
      }
    } else if (alerte) {
      await envoyer("Enrichissement reparti",
        cadre("L'outil d'enrichissement est reparti",
          "<p>L'arrêt signalé le " + html(heureDeParis(alerte.depuis)) + " est terminé : les compteurs bougent de nouveau, "
          + "ou il ne reste plus rien à faire.</p>" + tableauHtml(observation)));
      alerte = null;
    }
  }

  // LES ADRESSES ECRITES DEPUIS LA DERNIERE OBSERVATION.
  const depuisAdresses = avantLe || new Date(maintenantMs - 2 * HEURE).toISOString();
  const malFormees = tropProche ? [] : await adressesMalFormees(depuisAdresses);
  if (malFormees.length > 0) {
    const nbMal = malFormees.length;
    const accord = nbMal > 1 ? " adresses mal formées écrites en base" : " adresse mal formée écrite en base";
    await envoyer("Enrichissement : " + nbMal + accord,
      cadre("Des adresses mal formées sont entrées en base",
        "<p>Depuis le " + html(heureDeParis(depuisAdresses)) + ", l'outil a écrit " + nbMal
        + (nbMal > 1 ? " adresses qui n'ont pas la forme d'une adresse. Elles seraient refusées"
          : " adresse qui n'a pas la forme d'une adresse. Elle serait refusée")
        + " à l'envoi d'une campagne.</p><ul>"
        + malFormees.map(function (m) { return "<li>" + html(m.base) + " : <code>" + html(m.email) + "</code></li>"; }).join("")
        + "</ul><p>Transmettez ce message à Claude : il faut les retirer de la base, et corriger la cause dans la lecture des sites.</p>"));
  }

  // L ETAT, POUR L HEURE PROCHAINE.
  const nouvelEtat: any = {
    observation: tropProche ? avant : observation,
    alerte: alerte,
    derniere_verification: maintenant.toISOString(),
  };
  const { error: errEcrit } = await supabase.from("outil_veille")
    .upsert({ cle: CLE, valeur: nouvelEtat, maj_le: maintenant.toISOString() }, { onConflict: "cle" });

  return NextResponse.json({
    success: !errEcrit && echecs.length === 0,
    a_l_arret: arrets,
    alerte_en_cours: alerte,
    adresses_mal_formees: malFormees,
    observation_trop_proche_de_la_precedente: tropProche,
    envois: envois,
    echecs: echecs,
    erreur_ecriture: errEcrit ? String(errEcrit.message || errEcrit).slice(0, 200) : null,
    observation: observation,
  }, { status: errEcrit || echecs.length > 0 ? 500 : 200 });
}
