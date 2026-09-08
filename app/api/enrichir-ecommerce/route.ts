import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// LA BASE DES PROSPECTS E-COMMERCE.
//
// POURQUOI. Jacques, le 07/09 : « tous les e-commerce sont des profils
// tres receptifs a la LLC ». C est la premiere cible adressable de
// MysterLLC. On n ecrit pas a quelqu un QUI A une LLC — celui-la ne se
// signale pas — on ecrit a quelqu un QUI POURRAIT EN VOULOIR UNE.
//
// LA SOURCE EST L ANNUAIRE DES ENTREPRISES DE L ETAT :
// https://recherche-entreprises.api.gouv.fr/search
// Gratuit, sans cle, sans inscription.
// Il donne le dirigeant, mais PAS le site web ni l adresse electronique —
// c est Dropcontact qui les trouvera ensuite.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 DEUX CODES NAF, UNE SEULE TABLE, DEUX POSITIONS DISTINCTES.
//
// 47.91A — vente a distance sur catalogue general
// 47.91B — vente a distance sur catalogue specialise
//
// Chaque code a SON PROPRE PLAFOND de dix mille resultats, et donc SA
// PROPRE POSITION de reprise. La colonne `vague` porte le numero de page,
// et la lecture du maximum se fait TOUJOURS avec un filtre sur `naf`.
//
// ⛔ SANS CE FILTRE, la seconde collecte reprendrait la position de la
// premiere et sauterait des milliers de lignes sans que rien ne le
// signale. C est le genre de defaut qui ne se voit qu au comptage final.
//
// ⚠️ TROIS AUTRES CODES SONT IDENTIFIES ET NON COLLECTES : 62.01Z
// (programmation informatique), 70.22Z (conseil pour les affaires),
// 85.59A (formation continue d adultes). Pour les ajouter, il suffit de
// les inscrire dans CODES ci-dessous — le reste suit.
//
// ⚠️ LES YOUTUBEURS, TIKTOKEURS ET CREATEURS NE SE COLLECTENT PAS :
// beaucoup ne sont pas immatricules, et les autres se declarent sous des
// codes disperses. L annuaire ne les distingue pas.
// ═══════════════════════════════════════════════════════════════════════
//
// 🚨 LE CODE NAF S ECRIT AVEC SON POINT. « 4791A » fait repondre 400 Bad
// Request ; « 47.91A » fonctionne. La documentation officielle donne
// l exemple « 56.10A ».
// ⛔ NE JAMAIS RECOPIER UN CODE NAF DEPUIS UN SITE D ANNUAIRE : la
// plupart l ecrivent sans point.

const CODES = ["47.91A", "47.91B"];

// 🚨 VINGT-CINQ EST LE MAXIMUM DE L ANNUAIRE. per_page=50 est refuse.
const PAR_PAGE = 25;

// 🚨 LE PLAFOND DUR : 10 000 resultats / 25 par page = page 400.
// La page 401 repond 400 Bad Request.
const PAGE_MAX = 400;

// COMBIEN DE PAGES PAR APPEL ET PAR CODE.
// 400 = tout ce qui est accessible pour un code. Le garde-fou de duree
// arrete avant si l annuaire est lent.
const PAGES_PAR_APPEL = 400;

// ⚠️ SEPT APPELS PAR SECONDE ET PAR IP chez l annuaire, et l IP de Vercel
// est partagee. 150 ms tient largement sous la limite.
const PAUSE_MS = 150;

// ⚠️ ON REND LA MAIN AVANT QUE VERCEL COUPE. maxDuration vaut 300 ; on
// s arrete a 270 pour qu une page lente ne fasse pas perdre le compte
// rendu. La position est en base, le prochain passage reprendra.
const DUREE_MAX_MS = 270000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function propre(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// LA PAGE SUIVANTE POUR UN CODE DONNE.
//
// 🚨 LE FILTRE SUR `naf` EST INDISPENSABLE. Sans lui, le maximum lu
// serait celui de tous les codes confondus.
async function pageSuivante(naf: string): Promise<number> {
  const { data } = await supabase
    .from("prospects_ecommerce")
    .select("vague")
    .eq("naf", naf)
    .not("vague", "is", null)
    .order("vague", { ascending: false })
    .limit(1);

  const derniere = (data && data[0] && Number(data[0].vague)) || 0;
  return derniere + 1;
}

// LE COMPTE POUR UN CODE, AVEC SON ERREUR EVENTUELLE.
//
// ⚠️ ON REMONTE L ERREUR PLUTOT QUE DE LA TAIRE. Le 07/09, la route
// immobiliere a annonce « 0 en base » alors que la table en contenait
// vingt-cinq : le comptage avait echoue et l erreur etait avalee.
async function compter(naf: string | null): Promise<any> {
  let requete = supabase
    .from("prospects_ecommerce")
    .select("id", { count: "exact", head: true });

  if (naf) requete = requete.eq("naf", naf);

  const { count, error } = await requete;
  return {
    valeur: typeof count === "number" ? count : null,
    erreur: error ? String(error.message || error) : null,
  };
}

// UNE PAGE DE L ANNUAIRE, AVEC UNE SECONDE TENTATIVE SUR 429.
async function lirePage(naf: string, page: number): Promise<any> {
  const url = "https://recherche-entreprises.api.gouv.fr/search"
    + "?activite_principale=" + encodeURIComponent(naf)
    + "&etat_administratif=A"
    + "&page=" + page
    + "&per_page=" + PAR_PAGE;

  for (let essai = 1; essai <= 2; essai++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" } });
      if (r.ok) return { ok: true, data: await r.json() };
      if (r.status === 429 && essai === 1) { await pause(1200); continue; }
      return { ok: false, statut: r.status };
    } catch (e: any) {
      if (essai === 1) { await pause(600); continue; }
      return { ok: false, statut: 0, message: String(e) };
    }
  }
  return { ok: false, statut: 0 };
}

// LES LIGNES A ECRIRE POUR UNE PAGE.
//
// ⚠️ LE DEDOUBLONNAGE INTERNE EST NECESSAIRE : deux resultats de la meme
// page peuvent porter le meme SIREN, et Postgres refuse d affecter deux
// fois la meme ligne dans un seul INSERT.
function lignesDe(resultats: any[], naf: string, page: number): any[] {
  const vus: any = {};
  const lignes: any[] = [];

  for (const e of resultats) {
    const siren = propre(e.siren);
    if (!siren) continue;
    if (vus[siren]) continue;
    vus[siren] = true;

    // LE DIRIGEANT. L annuaire rend une liste : on prend la premiere
    // personne physique. Sans prenom ET nom, Dropcontact ne trouvera
    // rien — la ligne est gardee, mais elle sera ecartee a l export.
    let prenom = null;
    let nom = null;
    const dirigeants = e.dirigeants || [];
    for (const d of dirigeants) {
      if (d && d.type_dirigeant === "personne physique") {
        prenom = propre(d.prenoms) || propre(d.prenom);
        nom = propre(d.nom);
        if (prenom && nom) break;
      }
    }

    const siege = e.siege || {};

    lignes.push({
      naf: naf,
      siren: siren,
      siret: propre(siege.siret),
      raison_sociale: propre(e.nom_complet) || propre(e.nom_raison_sociale),
      dirigeant_prenom: prenom,
      dirigeant_nom: nom,
      adresse: propre(siege.adresse),
      code_postal: propre(siege.code_postal),
      ville: propre(siege.libelle_commune),
      tranche_effectif: propre(e.tranche_effectif_salarie),
      vague: page,
      statut: "a_enrichir",
    });
  }

  return lignes;
}

// LA COLLECTE D UN CODE, DU DEBUT DE SA POSITION JUSQU A EPUISEMENT.
async function collecter(naf: string, depart: number, pageDemandee: number): Promise<any> {
  let page = pageDemandee > 0 ? pageDemandee : await pageSuivante(naf);
  const avant = await compter(naf);

  let pagesTraitees = 0;
  let lignesEnvoyees = 0;
  let sansDirigeant = 0;
  let totalAnnonce: number | null = null;
  let arret = "nombre de pages atteint";
  const incidents: any[] = [];

  while (pagesTraitees < PAGES_PAR_APPEL) {
    if (page > PAGE_MAX) {
      arret = "plafond de l annuaire atteint — ce code est termine";
      break;
    }
    if (Date.now() - depart > DUREE_MAX_MS) {
      arret = "duree maximale atteinte — le prochain passage reprendra";
      break;
    }

    const lecture = await lirePage(naf, page);

    if (!lecture.ok) {
      arret = "annuaire a repondu " + lecture.statut;
      incidents.push({ page: page, statut: lecture.statut });
      break;
    }

    if (totalAnnonce === null && lecture.data) {
      totalAnnonce = lecture.data.total_results || null;
    }

    const resultats = (lecture.data && lecture.data.results) || [];
    if (resultats.length === 0) {
      arret = "aucun resultat — ce code est complet";
      break;
    }

    const lignes = lignesDe(resultats, naf, page);
    for (const l of lignes) {
      if (!l.dirigeant_nom) sansDirigeant++;
    }

    if (lignes.length > 0) {
      // 🚨 UNE SEULE ECRITURE POUR TOUTE LA PAGE. Vingt-cinq ecritures
      // separees mettaient 78 secondes sur 40 pages ; groupees, 20.
      const { error } = await supabase
        .from("prospects_ecommerce")
        .upsert(lignes, { onConflict: "siren", ignoreDuplicates: true });

      if (error) {
        arret = "ecriture refusee";
        incidents.push({ page: page, erreur: String(error.message || error) });
        break;
      }
      lignesEnvoyees += lignes.length;

      // 🚨 SI LA PAGE N APPORTE RIEN DE NEUF, LA POSITION N AVANCERAIT
      // PAS : aucune ligne ne porterait `vague = page`, et le prochain
      // appel relirait la meme page indefiniment. On pose alors la
      // position sur la premiere ligne venue.
      // ⚠️ CE CAS EST NORMAL DES LA SECONDE EXECUTION D UNE MEME PAGE.
      await supabase
        .from("prospects_ecommerce")
        .update({ vague: page })
        .eq("siren", lignes[0].siren)
        .is("vague", null);
    }

    pagesTraitees++;
    page++;
    await pause(PAUSE_MS);
  }

  const apres = await compter(naf);
  const ajoutes = (typeof avant.valeur === "number" && typeof apres.valeur === "number")
    ? apres.valeur - avant.valeur
    : null;

  return {
    naf: naf,
    arret: arret,
    pages_traitees: pagesTraitees,
    derniere_page: page - 1,
    prochaine_page: page > PAGE_MAX ? null : page,
    lignes_envoyees: lignesEnvoyees,
    sans_dirigeant: sansDirigeant,
    ajoutes: ajoutes,
    total_pour_ce_code: apres.valeur,
    erreur_comptage: apres.erreur,
    total_annonce_par_l_annuaire: totalAnnonce,
    incidents: incidents,
  };
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || (req.headers.get("authorization") || "").replace("Bearer ", "");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  // MODE MESURE : ?compter=1 n appelle NI l annuaire NI Supabase en
  // ecriture.
  if (req.nextUrl.searchParams.get("compter") === "1") {
    const total = await compter(null);
    const parCode: any[] = [];

    for (const naf of CODES) {
      const c = await compter(naf);
      const suivante = await pageSuivante(naf);
      parCode.push({
        naf: naf,
        lignes: c.valeur,
        erreur_comptage: c.erreur,
        derniere_page_traitee: suivante - 1,
        prochaine_page: suivante,
        pages_restantes: Math.max(0, PAGE_MAX - (suivante - 1)),
      });
    }

    const { count: avecDirigeant } = await supabase
      .from("prospects_ecommerce")
      .select("id", { count: "exact", head: true })
      .not("dirigeant_nom", "is", null);

    const { count: avecEmail } = await supabase
      .from("prospects_ecommerce")
      .select("id", { count: "exact", head: true })
      .not("email", "is", null);

    return NextResponse.json({
      mode: "mesure, aucune ecriture",
      total_en_base: total.valeur,
      erreur_comptage: total.erreur,
      avec_dirigeant: avecDirigeant,
      avec_email: avecEmail,
      par_code: parCode,
      page_maximum: PAGE_MAX,
      plafond_par_code: PAGE_MAX * PAR_PAGE,
    });
  }

  const depart = Date.now();

  // Un code precis peut etre demande a la main : ?naf=47.91B
  // Le cron, lui, ne passe aucun parametre et traite les deux.
  const nafDemande = (req.nextUrl.searchParams.get("naf") || "").trim().toUpperCase();
  const aTraiter = nafDemande !== "" ? [nafDemande] : CODES;

  for (const n of aTraiter) {
    if (CODES.indexOf(n) < 0) {
      return NextResponse.json(
        { erreur: "code NAF inconnu : " + n + " (attendus : " + CODES.join(", ") + ")" },
        { status: 400 });
    }
  }

  const pageDemandee = Number(req.nextUrl.searchParams.get("page") || 0);

  const resultats: any[] = [];
  for (const naf of aTraiter) {
    // 🚨 ON N ENTAME PAS UN SECOND CODE S IL NE RESTE PAS DE TEMPS.
    // Mieux vaut rendre un compte rendu complet sur un code que deux
    // comptes rendus tronques.
    if (Date.now() - depart > DUREE_MAX_MS) {
      resultats.push({ naf: naf, arret: "non entame — duree maximale atteinte" });
      continue;
    }
    resultats.push(await collecter(naf, depart, pageDemandee));
  }

  const total = await compter(null);

  return NextResponse.json({
    total_en_base: total.valeur,
    erreur_comptage: total.erreur,
    duree_s: Math.round((Date.now() - depart) / 1000),
    codes: resultats,
  });
}
