import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// LA BASE DES AGENCES IMMOBILIERES.
//
// Cinquieme base de prospection, ouverte pour le CRM vendu seul. Les quatre
// autres visent la formation ou la comptabilite ; celle-ci vise un metier
// qui suit beaucoup de prospects sur plusieurs mois, avec plusieurs
// negociateurs — donc plusieurs licences.
//
// LA SOURCE EST L ANNUAIRE DES ENTREPRISES DE L ETAT : gratuit, sans cle,
// sans quota annonce. C est la meme que pour les organismes.
// Il donne le dirigeant, mais PAS le site web ni l adresse electronique —
// c est Dropcontact qui les trouvera ensuite.
//
// CODE NAF 6831Z : agences immobilieres. Environ trente mille
// etablissements en France.
//
// LA ROUTE EST FAITE POUR TOURNER EN CRON, page par page. Elle retient ou
// elle s est arretee dans la colonne `vague`.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 DEUX DEFAUTS CORRIGES AVANT LA PREMIERE EXECUTION — 07/09.
//
// 1. LA REPRISE POUVAIT SE FIGER, EN SILENCE.
//
//    Le calcul etait : page = nombre de lignes en base / 25 + 1. Or
//    l insertion ignore les doublons ET les lignes sans SIREN. Qu un seul
//    resultat soit ecarte sur une page, et la base compte 24 lignes au lieu
//    de 25 : le calcul redonne page 1. Les 24 sont deja la, tout est
//    ignore, le compte ne bouge plus — et la route relit la page 1 a chaque
//    passage, indefiniment. Le cron tourne, la reponse est un succes, et
//    rien n avance.
//
//    ⚠️ LE COMMENTAIRE D ORIGINE ANNONCAIT DEJA `vague` COMME MEMOIRE DE
//    POSITION. Le code ne l ecrivait jamais. C est desormais le cas :
//    chaque ligne porte le numero de la page qui l a apportee, et la page
//    suivante se lit sur le maximum de cette colonne.
//
//    🚨 NE JAMAIS REVENIR A UN CALCUL DERIVE DU NOMBRE DE LIGNES. Toute
//    insertion qui peut ecarter un resultat rompt la correspondance entre
//    le compte et la position.
//
// 2. LE PLAFOND DE L API N ETAIT PAS TRAITE.
//
//    L Annuaire des Entreprises limite a DIX MILLE resultats cumules, par
//    tranches de vingt-cinq : au-dela de la page 400, il repond 400 Bad
//    Request. La route l aurait signale comme une panne de l annuaire.
//
//    ⚠️ SUR ENVIRON TRENTE MILLE AGENCES, ON N EN RECUPERERA DONC QUE DIX
//    MILLE. C est une limite de l API, pas un reglage : « cette API sert a
//    trouver une entreprise, pas a aspirer un secteur ». Pour aller
//    au-dela, il faudrait les fichiers SIRENE en telechargement.
//
//    ⚠️ POUR ELARGIR SANS CHANGER DE SOURCE : relancer la meme collecte en
//    decoupant par departement (`departement=`), chaque decoupage ayant son
//    propre plafond de dix mille. Ce n est pas fait ici — a decider.
// ═══════════════════════════════════════════════════════════════════════

// 🚨 LE POINT EST OBLIGATOIRE — CORRIGE LE 07/09.
//
// La route envoyait « 6831Z » et l annuaire repondait 400 Bad Request des
// la page 1. La documentation officielle donne l exemple « 56.10A » : le
// code NAF se transmet AVEC son point, comme l INSEE l ecrit.
//
// ⚠️ VERIFIE DIRECTEMENT DANS LE NAVIGATEUR avant correction :
// recherche-entreprises.api.gouv.fr/search?activite_principale=68.31Z
// rend du JSON, la meme sans le point rend 400.
//
// ⛔ NE JAMAIS RECOPIER UN CODE NAF DEPUIS UN SITE D ANNUAIRE : la plupart
// l ecrivent sans point (6831Z), et c est justement la forme que l API
// refuse.
const NAF = "68.31Z";
const PAR_PAGE = 25;

// 🚨 LE PLAFOND DUR DE L ANNUAIRE : 10 000 resultats / 25 par page.
// La page 401 repond 400 Bad Request.
const PAGE_MAX = 400;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function propre(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
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

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  // MODE MESURE : ?compter=1 ne lit que l etat de la base et n appelle
  // NI l annuaire NI Supabase en ecriture.
  if (req.nextUrl.searchParams.get("compter") === "1") {
    const { count: total } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true });

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
      total_en_base: total || 0,
      avec_dirigeant: avecDirigeant || 0,
      avec_email: avecEmail || 0,
      derniere_page_traitee: suivante - 1,
      prochaine_page: suivante,
      page_maximum: PAGE_MAX,
      plafond_annuaire: PAGE_MAX * PAR_PAGE,
    });
  }

  // La page demandee, ou la suivante d apres la colonne `vague`.
  const demandee = Number(req.nextUrl.searchParams.get("page") || 0);
  const page = demandee > 0 ? demandee : await pageSuivante();

  // 🚨 ARRET PROPRE AU PLAFOND. Sans ce test, l annuaire repondrait 400 et
  // la route l annoncerait comme une panne — un cron qui echoue tous les
  // jours pour une raison normale finit par etre ignore.
  if (page > PAGE_MAX) {
    const { count: total } = await supabase
      .from("prospects_immobilier")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      page: page,
      info: "plafond de l annuaire atteint — la collecte est terminee",
      total_en_base: total || 0,
      page_maximum: PAGE_MAX,
    });
  }

  const url = "https://recherche-entreprises.api.gouv.fr/search"
    + "?activite_principale=" + NAF
    + "&etat_administratif=A"
    + "&page=" + page
    + "&per_page=" + PAR_PAGE;

  let data: any = null;
  try {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) {
      return NextResponse.json(
        { erreur: "annuaire a repondu " + r.status, page: page },
        { status: 502 }
      );
    }
    data = await r.json();
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e), page: page }, { status: 502 });
  }

  const resultats = (data && data.results) || [];
  if (resultats.length === 0) {
    return NextResponse.json({
      page: page,
      info: "aucun resultat — la base est probablement complete",
      total_annonce: data ? data.total_results : null,
    });
  }

  // LE COMPTE AVANT, POUR SAVOIR CE QUI A REELLEMENT ETE AJOUTE.
  //
  // ⚠️ `ignoreDuplicates` NE LEVE PAS D ERREUR sur un doublon : l ancien
  // code comptait donc les doublons comme des ajouts. Le nombre annonce
  // etait faux, et c est precisement ce nombre qu on regarde pour savoir
  // si la collecte avance.
  const { count: avant } = await supabase
    .from("prospects_immobilier")
    .select("id", { count: "exact", head: true });

  let traites = 0;
  let ignores = 0;

  for (const e of resultats) {
    const siren = propre(e.siren);
    if (!siren) { ignores++; continue; }

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

    const { error } = await supabase
      .from("prospects_immobilier")
      .upsert({
        siren: siren,
        raison_sociale: propre(e.nom_complet) || propre(e.nom_raison_sociale),
        ville: propre(siege.libelle_commune),
        code_postal: propre(siege.code_postal),
        dirigeant_prenom: prenom,
        dirigeant_nom: nom,
        // 🚨 LA MEMOIRE DE POSITION. Sans elle, la reprise se calculait sur
        // le nombre de lignes et pouvait se figer sur une page.
        // ⚠️ `ignoreDuplicates` PROTEGE LES LIGNES DEJA PRESENTES : une
        // ligne apportee par la page 3 garde `vague = 3` meme si elle
        // reapparait plus tard.
        vague: page,
        statut: "a_enrichir",
      }, { onConflict: "siren", ignoreDuplicates: true });

    if (error) ignores++;
    else traites++;
  }

  const { count: total } = await supabase
    .from("prospects_immobilier")
    .select("id", { count: "exact", head: true });

  // 🚨 SI LA PAGE N A RIEN APPORTE, LA POSITION N AVANCERAIT PAS.
  //
  // Quand les vingt-cinq resultats sont deja en base, aucune ligne n est
  // ecrite — donc aucune ne porte `vague = page`, et le prochain appel
  // relirait la meme page. On pose alors la position sur la premiere ligne
  // venue, pour que la collecte continue.
  //
  // ⚠️ CE CAS ARRIVE DES LA SECONDE EXECUTION D UNE MEME PAGE. Il n est pas
  // exceptionnel, il est normal.
  const ajoutes = (total || 0) - (avant || 0);
  let positionForcee = false;

  if (ajoutes === 0 && resultats.length > 0) {
    const premier = propre(resultats[0].siren);
    if (premier) {
      await supabase
        .from("prospects_immobilier")
        .update({ vague: page })
        .eq("siren", premier);
      positionForcee = true;
    }
  }

  return NextResponse.json({
    page: page,
    lus: resultats.length,
    traites: traites,
    ajoutes: ajoutes,
    ignores: ignores,
    position_forcee: positionForcee,
    total_en_base: total || 0,
    total_annonce: data.total_results || null,
    page_maximum: PAGE_MAX,
  });
}
