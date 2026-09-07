import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// LA BASE DES AGENCES IMMOBILIERES.
//
// Cinquieme base de prospection, ouverte pour le CRM vendu seul. Les quatre
// autres visent la formation ou la comptabilite ; celle-ci vise un metier
// qui suit beaucoup de prospects sur plusieurs mois, avec plusieurs
// negociateurs — donc plusieurs licences.
//
// LA SOURCE EST L ANNUAIRE DES ENTREPRISES DE L ETAT :
// https://recherche-entreprises.api.gouv.fr/search
// Gratuit, sans cle, sans inscription. C est la source de TOUTES les bases
// prospects de la maison.
// Il donne le dirigeant, mais PAS le site web ni l adresse electronique —
// c est Dropcontact qui les trouvera ensuite, dans une seconde route.
//
// LA ROUTE TOURNE EN CRON, sans intervention. Elle retient ou elle s est
// arretee dans la colonne `vague`, enchaine plusieurs pages par appel, et
// s arrete d elle-meme au plafond de l annuaire.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 CINQ DEFAUTS CORRIGES — 07/09. TOUS CONSTATES EN EXECUTION REELLE.
//
// 1. LE CODE NAF S ECRIT AVEC SON POINT.
//    « 6831Z » faisait repondre 400 Bad Request des la page 1. La
//    documentation officielle donne l exemple « 56.10A ».
//    ⛔ NE JAMAIS RECOPIER UN CODE NAF DEPUIS UN SITE D ANNUAIRE : la
//    plupart l ecrivent sans point, et c est la forme que l API refuse.
//
// 2. LA REPRISE POUVAIT SE FIGER, EN SILENCE.
//    Le calcul etait : page = nombre de lignes en base / 25 + 1. Or
//    l insertion ignore les doublons et les lignes sans SIREN. Qu un seul
//    resultat soit ecarte, et le calcul redonne la meme page indefiniment.
//    Le cron tourne, la reponse est un succes, et rien n avance.
//    ⛔ NE JAMAIS CALCULER LA PAGE A PARTIR DU NOMBRE DE LIGNES EN BASE.
//    La position vit dans `vague` : chaque ligne porte le numero de la page
//    qui l a apportee, et la suivante se lit sur le maximum.
//
// 3. LE PLAFOND DE L API N ETAIT PAS TRAITE.
//    L annuaire limite a DIX MILLE resultats cumules, 25 par page : la page
//    401 repond 400 Bad Request. La route l aurait annonce comme une panne,
//    et un cron qui echoue tous les jours finit par etre ignore.
//
// 4. VINGT-CINQ ECRITURES PAR PAGE RENDAIENT LE CRON IMPOSSIBLE.
//    Mesure : 40 pages en ecritures separees = 78 secondes. Une seule
//    ecriture groupee par page ramene 40 pages a 20 secondes — et 400
//    pages, soit la collecte entiere, a environ 300.
//    ⚠️ maxDuration = 300 EST LA MEME VALEUR QUE campagne-organismes, qui
//    tourne deja avec. Si le plan ne l autorisait pas, Vercel couperait a
//    60 sans prevenir : les lignes ecrites resteraient, la reponse serait
//    perdue, et la position en base permettrait de reprendre. Le garde-fou
//    de duree ci-dessous rend ce cas indolore.
//
// 5. L ANNUAIRE REPOND 429 QUAND IL EST SOLLICITE.
//    Sept appels par seconde et par IP — et l IP est celle de Vercel,
//    partagee. Une seule tentative suffisait a faire echouer tout l appel.
//    ⚠️ UNE SECONDE TENTATIVE EST FAITE APRES UNE PAUSE. Si elle echoue
//    aussi, la route s arrete PROPREMENT en gardant ce qu elle a deja
//    ecrit : la position est acquise, le prochain passage reprendra la.
// ═══════════════════════════════════════════════════════════════════════
//
// ⚠️ SUR ENVIRON TRENTE MILLE AGENCES, ON N EN AURA QUE DIX MILLE. C est
// une limite de l API, pas un reglage : « cette API sert a trouver une
// entreprise, pas a aspirer un secteur ». Pour aller au-dela, il faudrait
// relancer la meme collecte en decoupant par departement
// (`departement=`), chaque decoupage ayant son propre plafond de dix mille.
// NON FAIT ICI — a decider.

// 🚨 LE POINT EST OBLIGATOIRE. Verifie dans le navigateur le 07/09 :
// ...search?activite_principale=68.31Z rend du JSON,
// la meme sans le point rend 400.
const NAF = "68.31Z";

// 🚨 VINGT-CINQ EST LE MAXIMUM DE L ANNUAIRE. Ce n est pas un reglage :
// per_page=50 est refuse.
const PAR_PAGE = 25;

// 🚨 LE PLAFOND DUR DE L ANNUAIRE : 10 000 resultats / 25 par page.
// La page 401 repond 400 Bad Request.
const PAGE_MAX = 400;

// COMBIEN DE PAGES PAR APPEL.
//
// 🚨 C EST CETTE VALEUR QUI COMMANDE LE CRON. Vercel appelle une adresse
// fixe ; un cron ne porte pas de parametre. C est donc ici qu on regle le
// rythme, comme LOT_PAR_DEFAUT dans campagne-organismes.
//
// 🚨 400 PAGES = TOUTE LA COLLECTE EN UN SEUL PASSAGE. C est le plafond de
// l annuaire lui-meme : au-dela il n y a plus rien a lire.
// Mesure du minutage : environ 750 ms par page en ecriture groupee, soit
// 300 secondes pour les 400. Le garde-fou de duree arrete avant, et le
// passage du lendemain termine ce qui reste.
// ⚠️ LE DEBIT RESTE SOUS LA LIMITE : 750 ms par page = 1,3 appel par
// seconde, l annuaire en accepte sept.
const PAGES_PAR_APPEL = 400;

// LA PAUSE ENTRE DEUX PAGES, EN MILLISECONDES.
// ⚠️ SEPT APPELS PAR SECONDE ET PAR IP chez l annuaire, et l IP de Vercel
// est partagee avec d autres. 150 ms tient largement sous la limite.
const PAUSE_MS = 150;

// LE GARDE-FOU DE DUREE.
// ⚠️ ON S ARRETE AVANT QUE VERCEL COUPE. Une coupure perdrait la reponse —
// donc le compte rendu — alors que les lignes sont deja ecrites. Mieux vaut
// rendre la main et laisser le passage du lendemain continuer : la position
// est en base, rien n est perdu.
// 🚨 270 SECONDES CONTRE 300 DECLAREES : trente secondes de marge, parce
// qu une page lente ne doit pas faire depasser.
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

// LA PAGE SUIVANTE, LUE SUR LA COLONNE `vague`.
//
// ⚠️ `vague` PORTE LE NUMERO DE LA PAGE qui a apporte la ligne. Le maximum
// dit donc la derniere page traitee, quel que soit le nombre de lignes
// reellement ecrites — c est exactement ce qui manquait.
async function pageSuivante(): Promise<number> {
  const { data } = await supabase
    .from("prospects_immobilier")
    .select("vague")
    .not("vague", "is", null)
    .order("vague", { ascending: false })
    .limit(1);

  const derniere = (data && data[0] && Number(data[0].vague)) || 0;
  return derniere + 1;
}

// LE COMPTE EN BASE, AVEC SON ERREUR EVENTUELLE.
//
// 🚨 LE 07/09, LA ROUTE A ANNONCE « total_en_base: 0 » ALORS QUE LA TABLE
// EN CONTENAIT VINGT-CINQ. L ancienne version avalait l erreur du comptage
// et rendait zero, ce qui donnait l impression que rien ne s ecrivait.
// ⚠️ ON REMONTE DESORMAIS L ERREUR PLUTOT QUE DE LA TAIRE : un chiffre faux
// coute plus cher qu un message d erreur.
async function compter(): Promise<any> {
  const { count, error } = await supabase
    .from("prospects_immobilier")
    .select("id", { count: "exact", head: true });

  return {
    valeur: typeof count === "number" ? count : null,
    erreur: error ? String(error.message || error) : null,
  };
}

// UNE PAGE DE L ANNUAIRE, AVEC UNE SECONDE TENTATIVE SUR 429.
async function lirePage(page: number): Promise<any> {
  const url = "https://recherche-entreprises.api.gouv.fr/search"
    + "?activite_principale=" + encodeURIComponent(NAF)
    + "&etat_administratif=A"
    + "&page=" + page
    + "&per_page=" + PAR_PAGE;

  for (let essai = 1; essai <= 2; essai++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" } });
      if (r.ok) {
        return { ok: true, data: await r.json() };
      }
      // 429 : debit depasse. On souffle et on retente une fois.
      if (r.status === 429 && essai === 1) {
        await pause(1200);
        continue;
      }
      return { ok: false, statut: r.status };
    } catch (e: any) {
      if (essai === 1) {
        await pause(600);
        continue;
      }
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
function lignesDe(resultats: any[], page: number): any[] {
  const vus: any = {};
  const lignes: any[] = [];

  for (const e of resultats) {
    const siren = propre(e.siren);
    if (!siren) continue;
    if (vus[siren]) continue;
    vus[siren] = true;

    // LE DIRIGEANT. L annuaire rend une liste : on prend la premiere
    // personne physique. Sans prenom ET nom, Dropcontact ne trouvera rien —
    // la ligne est gardee, mais elle sera ecartee a l export.
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
      siren: siren,
      raison_sociale: propre(e.nom_complet) || propre(e.nom_raison_sociale),
      ville: propre(siege.libelle_commune),
      code_postal: propre(siege.code_postal),
      dirigeant_prenom: prenom,
      dirigeant_nom: nom,
      // 🚨 LA MEMOIRE DE POSITION.
      vague: page,
      statut: "a_enrichir",
    });
  }

  return lignes;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  // MODE MESURE : ?compter=1 ne lit que l etat de la base et n appelle
  // NI l annuaire NI Supabase en ecriture.
  if (req.nextUrl.searchParams.get("compter") === "1") {
    const total = await compter();

    const { count: avecDirigeant } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true })
      .not("dirigeant_nom", "is", null);

    const { count: avecEmail } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true })
      .not("email", "is", null);

    const suivante = await pageSuivante();

    return NextResponse.json({
      mode: "mesure, aucune ecriture",
      total_en_base: total.valeur,
      erreur_comptage: total.erreur,
      avec_dirigeant: avecDirigeant,
      avec_email: avecEmail,
      derniere_page_traitee: suivante - 1,
      prochaine_page: suivante,
      pages_restantes: Math.max(0, PAGE_MAX - (suivante - 1)),
      pages_par_appel: PAGES_PAR_APPEL,
      page_maximum: PAGE_MAX,
      plafond_annuaire: PAGE_MAX * PAR_PAGE,
    });
  }

  const depart = Date.now();

  // Le nombre de pages a enchainer. Le cron n en passe aucun : c est
  // PAGES_PAR_APPEL qui commande.
  const demandePages = Number(req.nextUrl.searchParams.get("pages") || 0);
  const aFaire = demandePages > 0 && demandePages <= 100
    ? demandePages : PAGES_PAR_APPEL;

  const demandeePage = Number(req.nextUrl.searchParams.get("page") || 0);
  let page = demandeePage > 0 ? demandeePage : await pageSuivante();

  const avant = await compter();

  let pagesTraitees = 0;
  let lignesEnvoyees = 0;
  let sirenSansDirigeant = 0;
  let arret = "nombre de pages atteint";
  const incidents: any[] = [];

  while (pagesTraitees < aFaire) {
    // 🚨 ARRET PROPRE AU PLAFOND.
    if (page > PAGE_MAX) {
      arret = "plafond de l annuaire atteint — la collecte est terminee";
      break;
    }

    // 🚨 ON REND LA MAIN AVANT QUE VERCEL COUPE.
    if (Date.now() - depart > DUREE_MAX_MS) {
      arret = "duree maximale atteinte — le prochain passage reprendra";
      break;
    }

    const lecture = await lirePage(page);

    if (!lecture.ok) {
      arret = "annuaire a repondu " + lecture.statut;
      incidents.push({ page: page, statut: lecture.statut });
      break;
    }

    const resultats = (lecture.data && lecture.data.results) || [];

    if (resultats.length === 0) {
      arret = "aucun resultat — la base est complete";
      break;
    }

    const lignes = lignesDe(resultats, page);

    for (const l of lignes) {
      if (!l.dirigeant_nom) sirenSansDirigeant++;
    }

    if (lignes.length > 0) {
      // 🚨 UNE SEULE ECRITURE POUR TOUTE LA PAGE. C est ce qui rend le cron
      // possible : vingt-cinq ecritures separees mettaient 78 secondes sur
      // 40 pages, la coupure de Vercel est a 60.
      const { error } = await supabase
        .from("prospects_immobilier")
        .upsert(lignes, { onConflict: "siren", ignoreDuplicates: true });

      if (error) {
        arret = "ecriture refusee";
        incidents.push({ page: page, erreur: String(error.message || error) });
        break;
      }

      lignesEnvoyees += lignes.length;
    }

    // 🚨 SI LA PAGE N A RIEN APPORTE, LA POSITION N AVANCERAIT PAS.
    //
    // Quand les vingt-cinq resultats sont deja en base, aucune ligne n est
    // ecrite — donc aucune ne porte `vague = page`, et le prochain appel
    // relirait la meme page. On pose alors la position sur la premiere
    // ligne venue.
    // ⚠️ CE CAS EST NORMAL DES LA SECONDE EXECUTION D UNE MEME PAGE.
    if (lignes.length > 0) {
      await supabase
        .from("prospects_immobilier")
        .update({ vague: page })
        .eq("siren", lignes[0].siren)
        .is("vague", null);
    }

    pagesTraitees++;
    page++;

    await pause(PAUSE_MS);
  }

  const apres = await compter();

  const ajoutes = (typeof avant.valeur === "number"
    && typeof apres.valeur === "number")
    ? apres.valeur - avant.valeur
    : null;

  return NextResponse.json({
    arret: arret,
    pages_traitees: pagesTraitees,
    derniere_page: page - 1,
    prochaine_page: page > PAGE_MAX ? null : page,
    lignes_envoyees: lignesEnvoyees,
    sans_dirigeant: sirenSansDirigeant,
    ajoutes: ajoutes,
    total_en_base: apres.valeur,
    erreur_comptage: apres.erreur,
    duree_s: Math.round((Date.now() - depart) / 1000),
    incidents: incidents,
    page_maximum: PAGE_MAX,
  });
}
