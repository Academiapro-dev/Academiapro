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
// ═══════════════════════════════════════════════════════════════════════
// 🆕 LE DECOUPAGE PAR DEPARTEMENT — 15/09. C est ce qui etait note ici
// comme « a decider » : c est decide, et c est fait.
//
// LE CONSTAT. La collecte nationale du 07/09 a rendu 10 000 agences sur les
// ~30 000 que compte le code 68.31Z. Ce n est pas un reglage : l annuaire
// plafonne a 10 000 resultats cumules par requete, page 400 comprise.
//
// LA SOLUTION, VERIFIEE LE 15/09 : le parametre `departement` accepte un
// code a deux ou trois chiffres, et CHAQUE DEPARTEMENT A SON PROPRE
// PLAFOND DE 10 000. Aucun departement francais n approche ce chiffre pour
// les agences immobilieres : la collecte devient complete.
//
// 🚨 LA ROUTE CHOISIT ELLE-MEME LE PROCHAIN DEPARTEMENT. Un cron Vercel
// appelle une adresse fixe et ne porte aucun parametre : si le departement
// devait etre passe a la main, il faudrait lancer cent adresses une par
// une. C est exactement ce que la doctrine interdit. La route prend donc le
// premier departement non termine de la liste, toute seule.
//
// 🚨 `zone` MEMORISE L ORIGINE DE CHAQUE LIGNE. La position de reprise vit
// dans `vague`, mais une page 3 du departement 75 n a rien a voir avec la
// page 3 de la collecte nationale. Sans `zone`, la reprise melangerait les
// deux et sauterait des pages entieres.
//   zone = null  → la collecte nationale du 07/09
//   zone = '75'  → la collecte du departement 75
//
// ⚠️ LES DOUBLONS SONT NORMAUX ET SANS DANGER : une agence deja collectee
// au national reviendra dans son departement. L upsert par SIREN avec
// `ignoreDuplicates` la reconnait et l ignore — et la ligne garde son
// adresse, donc aucun credit Dropcontact n est consomme deux fois.
//
// ⚠️ UN DEPARTEMENT EPUISE SE MARQUE. Quand une page ne rend plus rien, on
// pose `vague = PAGE_MAX` sur une ligne de la zone : le passage suivant
// voit le plafond et passe au departement d apres. SANS CE MARQUAGE, LA
// ROUTE RELIRAIT INDEFINIMENT LA PREMIERE PAGE DU MEME DEPARTEMENT — c est
// exactement le defaut n° 2 ci-dessus, sous une autre forme.
// ═══════════════════════════════════════════════════════════════════════

// LES DEPARTEMENTS, DANS L ORDRE DE COLLECTE.
//
// ⚠️ LA CORSE S ECRIT 2A ET 2B, jamais 20. Les DOM tiennent sur trois
// chiffres. Ecrire « 20 » ferait rater deux departements entiers sans que
// rien ne le signale.
// ⚠️ L ORDRE N EST PAS NEUTRE : les departements les plus denses en agences
// viennent d abord, pour que les premiers passages rapportent le plus.
const DEPARTEMENTS = [
  "75", "13", "69", "06", "33", "31", "44", "59", "34", "83",
  "92", "93", "94", "77", "78", "91", "95",
  "30", "35", "38", "42", "45", "49", "56", "57", "60", "62",
  "63", "64", "66", "67", "68", "74", "76", "80", "84", "85",
  "17", "21", "25", "26", "27", "28", "29", "2A", "2B",
  "01", "02", "03", "04", "05", "07", "08", "09", "10", "11",
  "12", "14", "15", "16", "18", "19", "22", "23", "24",
  "32", "36", "37", "39", "40", "41", "43", "46", "47", "48",
  "50", "51", "52", "53", "54", "55", "58", "61", "65", "70",
  "71", "72", "73", "79", "81", "82", "86", "87", "88", "89", "90",
  "971", "972", "973", "974", "976",
];

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
// rythme.
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

// 🆕 LA TAILLE DE L ENTREPRISE — 15/09.
//
// L annuaire rend `tranche_effectif_salarie`, un code officiel de l INSEE.
// On le garde TEL QUEL dans `effectif_code`, et on en tire une lecture
// simple dans `taille` — pour filtrer un envoi sans avoir a se souvenir des
// codes.
//
// 🚨 « 00 » SIGNIFIE ZERO SALARIE, PAS « INCONNU ». C est le cas le plus
// frequent chez les agents immobiliers independants. Le vrai « non
// renseigne » est « NN ».
// ⚠️ LE SEUIL PME S ARRETE A 249 SALARIES : definition europeenne, pas un
// choix. Au-dela commence l ETI.
// ⚠️ ON GARDE LES DEUX COLONNES : si la grille change un jour, `taille` se
// recalcule depuis `effectif_code` sans recollecter quoi que ce soit.
const TAILLES: any = {
  NN: "inconnu",
  "00": "independant", "01": "independant",
  "02": "tpe", "03": "tpe",
  "11": "pme", "12": "pme", "21": "pme", "22": "pme", "31": "pme",
  "32": "eti", "41": "eti", "42": "eti", "51": "eti",
  "52": "ge", "53": "ge",
};

function tailleDe(code: any): string {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return "inconnu";
  return TAILLES[c] || "inconnu";
}

function propre(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// LA PAGE SUIVANTE, LUE SUR LA COLONNE `vague` DANS SA ZONE.
//
// ⚠️ `vague` PORTE LE NUMERO DE LA PAGE qui a apporte la ligne. Le maximum
// dit donc la derniere page traitee, quel que soit le nombre de lignes
// reellement ecrites.
// 🚨 LA POSITION SE LIT DANS SA PROPRE ZONE : `is null` pour la collecte
// nationale, `eq` pour un departement. Melanger les deux ferait sauter des
// pages entieres.
async function pageSuivante(zone: string | null): Promise<number> {
  let q = supabase
    .from("prospects_immobilier")
    .select("vague")
    .not("vague", "is", null);

  q = zone ? q.eq("zone", zone) : q.is("zone", null);

  const { data } = await q.order("vague", { ascending: false }).limit(1);

  const derniere = (data && data[0] && Number(data[0].vague)) || 0;
  return derniere + 1;
}

// LE PROCHAIN DEPARTEMENT A TRAITER.
//
// 🚨 C EST CE QUI PERMET AU CRON DE TOURNER SEUL : on prend le premier
// departement dont la collecte n est pas terminee.
async function prochainDepartement(): Promise<string | null> {
  for (const dep of DEPARTEMENTS) {
    const suivante = await pageSuivante(dep);
    if (suivante <= PAGE_MAX) return dep;
  }
  return null;
}

// MARQUER UN DEPARTEMENT COMME EPUISE.
//
// 🚨 SANS CELA, LA ROUTE RELIT LA MEME PAGE INDEFINIMENT. Quand une page ne
// rend plus rien, aucune ligne nouvelle ne porte la position : on la pose
// donc a la main, au plafond, sur une ligne de la zone.
// ⚠️ SI LA ZONE N A AUCUNE LIGNE (departement sans aucune agence, cas des
// tres petits DOM), on ecrit une ligne temoin : sans elle, la position ne
// pourrait pas se poser et le departement bloquerait la file.
async function marquerEpuise(zone: string): Promise<void> {
  const { data } = await supabase
    .from("prospects_immobilier")
    .select("siren")
    .eq("zone", zone)
    .limit(1);

  if (data && data[0]) {
    await supabase
      .from("prospects_immobilier")
      .update({ vague: PAGE_MAX })
      .eq("siren", data[0].siren);
    return;
  }

  await supabase.from("prospects_immobilier").upsert([{
    siren: "ZONE-" + zone,
    raison_sociale: "(zone sans resultat — temoin de position)",
    zone: zone,
    vague: PAGE_MAX,
    statut: "sans_email",
  }], { onConflict: "siren", ignoreDuplicates: true });
}

// LA REPARTITION PAR TAILLE — pour savoir a qui on parle avant d ecrire.
// ⚠️ Une base majoritairement « independant » ne justifie pas un message qui
// parle d equipe : c est ce que ce compte rend visible.
async function repartitionTaille(): Promise<any> {
  const sortie: any = {};
  for (const t of ["independant", "tpe", "pme", "eti", "ge", "inconnu"]) {
    const { count } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true })
      .eq("taille", t);
    if (count) sortie[t] = count;
  }
  return sortie;
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
//
// ⚠️ `departement` EST LE NOM EXACT DU PARAMETRE, verifie le 15/09 dans la
// documentation de l API. Il accepte deux ou trois chiffres, et une liste
// separee par des virgules — on n en passe qu un a la fois, pour que chacun
// ait son propre plafond de 10 000.
async function lirePage(page: number, departement: string | null): Promise<any> {
  const url = "https://recherche-entreprises.api.gouv.fr/search"
    + "?activite_principale=" + encodeURIComponent(NAF)
    + "&etat_administratif=A"
    + (departement ? "&departement=" + encodeURIComponent(departement) : "")
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
function lignesDe(resultats: any[], page: number, zone: string | null): any[] {
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

    // 🚨 LA TRANCHE D EFFECTIF ARRIVE AVEC LE RESULTAT, GRATUITEMENT. Elle
    // ne coute rien de plus a collecter, et elle evite a Jacques de taper
    // une etiquette « PME » a la main sur des milliers de fiches.
    // ⚠️ ELLE PEUT ETRE SUR L UNITE LEGALE OU SUR LE SIEGE selon les
    // enregistrements : on prend la premiere des deux qui reponde.
    const effectif = propre(e.tranche_effectif_salarie)
      || propre(siege.tranche_effectif_salarie);

    lignes.push({
      siren: siren,
      raison_sociale: propre(e.nom_complet) || propre(e.nom_raison_sociale),
      ville: propre(siege.libelle_commune),
      code_postal: propre(siege.code_postal),
      dirigeant_prenom: prenom,
      dirigeant_nom: nom,
      effectif_code: effectif,
      taille: tailleDe(effectif),
      // 🚨 LA MEMOIRE DE POSITION — page ET zone. L une sans l autre ne veut
      // rien dire : la page 3 du 75 n est pas la page 3 du national.
      vague: page,
      zone: zone,
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

    // Ou en est la collecte par departement.
    const dep = await prochainDepartement();
    const faits: string[] = [];
    for (const d of DEPARTEMENTS) {
      const s = await pageSuivante(d);
      if (s > 1) faits.push(d + " (page " + (s - 1) + ")");
    }

    return NextResponse.json({
      mode: "mesure, aucune ecriture",
      total_en_base: total.valeur,
      erreur_comptage: total.erreur,
      avec_dirigeant: avecDirigeant,
      avec_email: avecEmail,
      collecte_nationale_derniere_page: (await pageSuivante(null)) - 1,
      prochain_departement: dep,
      departements_commences: faits,
      departements_restants: dep ? DEPARTEMENTS.length - DEPARTEMENTS.indexOf(dep) : 0,
      page_maximum: PAGE_MAX,
      plafond_par_zone: PAGE_MAX * PAR_PAGE,
      repartition_taille: await repartitionTaille(),
    });
  }

  const depart = Date.now();

  // Le nombre de pages a enchainer. Le cron n en passe aucun : c est
  // PAGES_PAR_APPEL qui commande.
  const demandePages = Number(req.nextUrl.searchParams.get("pages") || 0);
  const aFaire = demandePages > 0 && demandePages <= 400
    ? demandePages : PAGES_PAR_APPEL;

  // 🚨 LE DEPARTEMENT : celui demande, sinon le premier non termine.
  // `?departement=national` force la reprise de la collecte sans filtre —
  // elle est terminee, mais on garde la porte.
  const demandeDep = (req.nextUrl.searchParams.get("departement") || "").trim();
  let zone: string | null;
  if (demandeDep === "national") {
    zone = null;
  } else if (demandeDep) {
    zone = demandeDep;
  } else {
    zone = await prochainDepartement();
    if (!zone) {
      return NextResponse.json({
        arret: "tous les departements sont collectes — il n y a plus rien a lire",
        total_en_base: (await compter()).valeur,
      });
    }
  }

  const demandeePage = Number(req.nextUrl.searchParams.get("page") || 0);
  let page = demandeePage > 0 ? demandeePage : await pageSuivante(zone);

  const avant = await compter();

  let pagesTraitees = 0;
  let lignesEnvoyees = 0;
  let effectifsEcrits = 0;
  let sirenSansDirigeant = 0;
  let arret = "nombre de pages atteint";
  const incidents: any[] = [];

  while (pagesTraitees < aFaire) {
    // 🚨 ARRET PROPRE AU PLAFOND.
    if (page > PAGE_MAX) {
      arret = "plafond de la zone atteint";
      break;
    }

    // 🚨 ON REND LA MAIN AVANT QUE VERCEL COUPE.
    if (Date.now() - depart > DUREE_MAX_MS) {
      arret = "duree maximale atteinte — le prochain passage reprendra";
      break;
    }

    const lecture = await lirePage(page, zone);

    if (!lecture.ok) {
      arret = "annuaire a repondu " + lecture.statut;
      incidents.push({ page: page, statut: lecture.statut });
      break;
    }

    const resultats = (lecture.data && lecture.data.results) || [];

    if (resultats.length === 0) {
      // 🚨 LA ZONE EST EPUISEE : on le marque, sinon le prochain passage
      // relirait la meme page indefiniment.
      if (zone) await marquerEpuise(zone);
      arret = "aucun resultat — la zone " + (zone || "nationale") + " est complete";
      break;
    }

    const lignes = lignesDe(resultats, page, zone);

    for (const l of lignes) {
      if (!l.dirigeant_nom) sirenSansDirigeant++;
    }

    if (lignes.length > 0) {
      // 🚨 UNE SEULE ECRITURE POUR TOUTE LA PAGE. C est ce qui rend le cron
      // possible : vingt-cinq ecritures separees mettaient 78 secondes sur
      // 40 pages, la coupure de Vercel est a 60.
      //
      // ⚠️ `ignoreDuplicates: true` PROTEGE L EXISTANT : une ligne deja en
      // base garde son adresse, son site, son LinkedIn — tout ce que
      // Dropcontact a coute. On ne la reecrit JAMAIS avec des colonnes
      // vides venues de l annuaire.
      const { error } = await supabase
        .from("prospects_immobilier")
        .upsert(lignes, { onConflict: "siren", ignoreDuplicates: true });

      if (error) {
        arret = "ecriture refusee";
        incidents.push({ page: page, erreur: String(error.message || error) });
        break;
      }

      lignesEnvoyees += lignes.length;

      // 🚨🚨 L EFFECTIF DOIT ETRE ECRIT MEME SUR UNE LIGNE DEJA CONNUE.
      //
      // LE DEFAUT CONSTATE LE 15/09 : l upsert ci-dessus ignore les lignes
      // existantes — c est ce qu on veut pour les adresses — mais du coup
      // AUCUNE des 23 184 lignes deja collectees ne recevait sa tranche
      // d effectif. L essai sur le 69 a rendu « ajoutes: 0 » et zero taille
      // ecrite : la donnee arrivait de l annuaire et se perdait.
      //
      // ⚠️ POURQUOI C EST SANS DANGER : `effectif_code` et `taille` viennent
      // EXCLUSIVEMENT de l annuaire. Aucune autre source ne les alimente,
      // rien de paye ne peut etre ecrase, et une entreprise qui grandit doit
      // justement voir sa tranche changer.
      // ⚠️ ON N ECRIT QUE LES LIGNES QUI ONT UN EFFECTIF : inutile de poser
      // « inconnu » sur une ligne qui l est deja.
      // 🚨 GROUPE PAR TRANCHE, PAS UNE ECRITURE PAR LIGNE. Vingt-cinq
      // ecritures par page feraient 10 000 ecritures par departement : le
      // cron ne tiendrait pas, exactement comme le defaut n° 4 plus haut.
      // Il n existe que seize codes d effectif : une page ne demande donc
      // JAMAIS plus de seize ecritures, et le plus souvent trois ou quatre.
      const parTranche: any = {};
      for (const l of lignes) {
        if (!l.effectif_code) continue;
        const k = String(l.effectif_code);
        if (!parTranche[k]) parTranche[k] = { taille: l.taille, sirens: [] };
        parTranche[k].sirens.push(l.siren);
      }

      for (const code of Object.keys(parTranche)) {
        const g = parTranche[code];
        await supabase
          .from("prospects_immobilier")
          .update({ effectif_code: code, taille: g.taille })
          .in("siren", g.sirens);
        effectifsEcrits += g.sirens.length;
      }
    }

    // 🚨 SI LA PAGE N A RIEN APPORTE, LA POSITION N AVANCERAIT PAS.
    //
    // Quand les vingt-cinq resultats sont deja en base — cas TRES frequent
    // sur les departements, puisque la collecte nationale les a deja vus —
    // aucune ligne n est ecrite, donc aucune ne porte `vague = page`, et le
    // prochain appel relirait la meme page.
    // ⚠️ ON POSE DONC LA POSITION SUR LA PREMIERE LIGNE DE LA PAGE, meme si
    // elle vient du national : c est sa zone et sa vague qu on met a jour.
    if (lignes.length > 0) {
      await supabase
        .from("prospects_immobilier")
        .update({ vague: page, zone: zone })
        .eq("siren", lignes[0].siren);
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
    zone: zone || "nationale",
    arret: arret,
    pages_traitees: pagesTraitees,
    derniere_page: page - 1,
    prochaine_page: page > PAGE_MAX ? null : page,
    lignes_envoyees: lignesEnvoyees,
    effectifs_ecrits: effectifsEcrits,
    sans_dirigeant: sirenSansDirigeant,
    ajoutes: ajoutes,
    total_en_base: apres.valeur,
    erreur_comptage: apres.erreur,
    duree_s: Math.round((Date.now() - depart) / 1000),
    incidents: incidents,
    page_maximum: PAGE_MAX,
  });
}
