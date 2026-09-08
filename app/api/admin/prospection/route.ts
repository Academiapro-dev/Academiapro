import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LES QUATRE BASES DE PROSPECTION.
//
// Elles ne sont PAS dans la table crm : celle-ci est cloisonnee par tenant
// et appartient au client. Ces quatre-la sont la prospection de Jacques,
// et n ont jamais eu d ecran pour les consulter.
//
// PIEGE VERIFIE LE 14 AOUT : prospects_organismes n a PAS de colonne
// vague, contrairement aux trois autres. La demander la ferait echouer.
//
// 🚨 LE DRAPEAU linkedin DE cabinets ETAIT FAUX — corrige le 01/09 a 00h40.
//
// CE QUE DISAIT L ANCIEN COMMENTAIRE : « les colonnes linkedin existent sur
// les TROIS tables prospectables, mais PAS sur prospects_cabinets, qu on ne
// touche pas avant l accord BCSolutions ». Deux affirmations, toutes deux
// perimees :
//
//   1. TECHNIQUEMENT FAUX. Verifie en base le 01/09 : prospects_cabinets
//      porte bien linkedin, linkedin_le, linkedin_relance_le et
//      linkedin_statut. Et ces colonnes CONTIENNENT DES DONNEES — 353
//      profils, dont 118 deja invites.
//
//   2. COMMERCIALEMENT DEPASSE. La retenue datait d avant les corrections
//      de la prospection LinkedIn. Jacques a tranche : on ouvre.
//
// CE QUE LE DRAPEAU A FAIT ENTRE-TEMPS : le resume renvoyait zero sur les
// trois compteurs LinkedIn des cabinets SANS INTERROGER LA BASE, et
// l ecran n affichait ni la colonne ni le bouton d invitation. LES 118
// INVITATIONS DEJA PARTIES ETAIENT DONC INVISIBLES ET INSUIVIES — aucune
// acceptation, aucun refus ne pouvait etre marque.
//
// ⚠️ UN ZERO CALCULE SANS REQUETE EST UN MENSONGE, pas une optimisation.
// S il faut a nouveau desactiver une base, la retirer de la liste plutot
// que de lui faire rendre des chiffres faux.
const BASES: any = {
  organismes: {
    table: "prospects_organismes",
    titre: "Organismes certifies Qualiopi",
    cible: "Pack organisme",
    vague: false,
    linkedin: true,
  },
  qualiopi: {
    table: "prospects_qualiopi",
    titre: "Organismes NON certifies",
    cible: "Mr. Qualiopi",
    vague: true,
    linkedin: true,
  },
  interim: {
    table: "prospects_interim",
    titre: "Agences d interim",
    cible: "Formations securite",
    vague: true,
    linkedin: true,
  },
  cabinets: {
    table: "prospects_cabinets",
    titre: "Cabinets comptables",
    cible: "Mr. Comptable",
    vague: true,
    linkedin: true,
  },
};

// 🔎 LA RECHERCHE GLOBALE — ajoutee le 24/08.
//
// LE DEFAUT : il fallait SAVOIR dans quelle base se trouvait un prospect
// AVANT de pouvoir le chercher. Or c est precisement ce qu on ignore quand
// on cherche. Un nom entendu au telephone, une societe vue sur LinkedIn :
// on ne sait pas si elle est dans les organismes, les qualiopi, l interim
// ou les cabinets.
//
// La recherche par base reste en place, elle sert au travail au volume.
// Celle-ci repond a une autre question : « ou est cette entreprise ? »
//
// ELLE CHERCHE AUSSI PLUS LARGE. L ancienne recherche ne couvrait que la
// raison sociale, la ville, l adresse et le SIREN. Le nom du dirigeant en
// etait absent — alors que c est souvent la seule chose qu on retient d un
// echange. Le telephone et le profil LinkedIn manquaient aussi.
const COLONNES_GLOBALES = [
  "raison_sociale",
  "ville",
  "email",
  "siren",
  "dirigeant_nom",
  "dirigeant_prenom",
  "telephone",
];

// 🚨 LA FILE MANUELLE MANQUAIT A LA RECHERCHE — CORRIGE LE 02/09.
//
// LE DEFAUT, TROUVE PAR JACQUES : trois fiches saisies a la main le 02/09
// (Cecile Doronzo, Naim Riffi, Joris Shehadeh) etaient introuvables.
// « Chercher partout » n interrogeait QUE les quatre bases de prospection :
// la table crm — ou vivent TOUTES les fiches ajoutees depuis une capture
// d ecran LinkedIn — n en faisait pas partie.
//
// ⚠️ LES COLONNES DIFFERENT. La table crm porte `nom` et `organisme` la ou
// les bases portent `dirigeant_nom` et `raison_sociale`.
const COLONNES_GLOBALES_CRM = [
  "nom",
  "organisme",
  "ville",
  "email",
  "dirigeant_nom",
  "dirigeant_prenom",
  "telephone",
];

// ═══════════════════════════════════════════════════════════════════════
// 🚨🚨 LA RECHERCHE TROUVAIT UN MOT A L INTERIEUR D UN AUTRE — 08/09.
//
// LE DEFAUT, CONSTATE PAR JACQUES. Chercher « maine » pour trouver
// M. Maine rendait 93 resultats : « Activites HUMAINES et Organisations »,
// « Ressources HUMAINES », « DOMAINE du Lac », « SEMAINE ». La clause etait
// `colonne.ilike.%maine%` — elle attrape la suite de lettres N IMPORTE OU,
// y compris au milieu d un mot.
//
// 🚨 UN NOM COURT DEVENAIT DONC INUTILISABLE. Et plus le nom est court,
// plus le bruit est grand — c est exactement l inverse de ce qu on veut.
//
// LE SECOND DEFAUT, LIE. Chercher « pierre maine » ne rendait RIEN : le
// terme entier etait cherche dans CHAQUE colonne separement, et aucune
// colonne ne contient « pierre maine ». Or le prenom est dans
// `dirigeant_prenom` et le nom dans `dirigeant_nom` : c est justement la
// forme la plus naturelle de chercher quelqu un.
//
// LA CORRECTION, EN DEUX POINTS :
//
//   1. ON CHERCHE UN DEBUT DE MOT, pas une suite de lettres. « maine »
//      trouve « Maine » et « Maine-Dupont », mais plus « Humaines ».
//      ⚠️ Postgres n a pas de « limite de mot » en ilike : on enumere donc
//      les quatre facons dont un mot peut commencer — debut de champ,
//      apres une espace, apres un tiret, apres un point. C est verbeux et
//      c est previsible.
//
//   2. CHAQUE MOT DU TERME DOIT ETRE TROUVE, chacun pouvant l etre dans
//      une colonne differente. « pierre maine » exige « pierre » quelque
//      part ET « maine » quelque part.
//      ⚠️ L ORDRE N IMPORTE PAS : « maine pierre » donne le meme resultat.
//
// ⚠️ POURQUOI PLUSIEURS `.or()` ENCHAINES. PostgREST combine les `.or()`
// successifs par un ET. Un `.or()` par mot donne donc exactement
// « mot1 quelque part ET mot2 quelque part ». Les fusionner en un seul
// rendrait un OU, et « pierre maine » remonterait tous les Pierre.
//
// ⚠️ LES MOTS D UNE SEULE LETTRE SONT IGNORES : ils ne filtrent rien et
// alourdissent la requete.
//
// Rejoue en Node le 08/09 : « maine » passe de 5 a 2 resultats sur le jeu
// d essai, et « pierre maine » de 0 a 1.
// ═══════════════════════════════════════════════════════════════════════

// Les caracteres qui casseraient la syntaxe de PostgREST.
// ⚠️ LA VIRGULE SEPARE LES CONDITIONS d un `.or()` : la laisser passer
// couperait la clause en deux.
function nettoyer(mot: string): string {
  return mot.replace(/[,%()"']/g, " ").trim();
}

// Les quatre facons dont un mot peut COMMENCER dans un champ.
function formesDe(colonne: string, mot: string): string[] {
  return [
    colonne + ".ilike." + mot + "%",        // debut du champ
    colonne + ".ilike.% " + mot + "%",      // apres une espace
    colonne + ".ilike.%-" + mot + "%",      // apres un tiret
    colonne + ".ilike.%." + mot + "%",      // apres un point (adresses)
  ];
}

// Le decoupage du terme en mots utiles.
function motsDe(terme: string): string[] {
  return String(terme || "")
    .split(/\s+/)
    .map(nettoyer)
    .filter(function (m) { return m.length >= 2; });
}

// UNE CLAUSE PAR MOT. Chacune sera posee par un `.or()` distinct, et
// PostgREST les combinera par un ET.
function clausesOu(terme: string, avecLinkedin: boolean): string[] {
  const colonnes = avecLinkedin
    ? COLONNES_GLOBALES.concat(["linkedin"])
    : COLONNES_GLOBALES;

  return motsDe(terme).map(function (mot) {
    const formes: string[] = [];
    for (const c of colonnes) {
      for (const f of formesDe(c, mot)) formes.push(f);
    }
    return formes.join(",");
  });
}

function clausesOuCrm(terme: string): string[] {
  const colonnes = COLONNES_GLOBALES_CRM.concat(["linkedin"]);

  return motsDe(terme).map(function (mot) {
    const formes: string[] = [];
    for (const c of colonnes) {
      for (const f of formesDe(c, mot)) formes.push(f);
    }
    return formes.join(",");
  });
}

// Applique toutes les clauses a une requete : un `.or()` par mot.
function appliquer(q: any, clauses: string[]): any {
  let r = q;
  for (const c of clauses) r = r.or(c);
  return r;
}

// Le compte exact sans rapatrier les lignes : head true ne renvoie que le
// nombre. Sur 33 881 cabinets, la difference n est pas cosmetique.
async function compter(table: string, filtre: any): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filtre) q = filtre(q);
  const { count } = await q;
  return count || 0;
}

// Cherche le terme dans UNE base et rend au plus vingt lignes, avec le
// compte reel. Vingt suffit : au-dela, c est que le terme est trop vague
// et le compte le dit.
async function chercherDans(cle: string, terme: string): Promise<any> {
  const b = BASES[cle];

  const colonnes = "id, raison_sociale, siren, ville, code_postal, "
    + "dirigeant_prenom, dirigeant_nom, email, telephone, "
    + "statut, envoye_le, desabonne, dropcontact_le"
    + (b.linkedin ? ", linkedin, linkedin_le, linkedin_statut" : "");

  let q = supabase
    .from(b.table)
    .select(colonnes, { count: "exact" });

  q = appliquer(q, clausesOu(terme, !!b.linkedin));

  const { data, count, error } = await q
    .order("id", { ascending: true })
    .range(0, 19);

  if (error) {
    return {
      cle: cle,
      titre: b.titre,
      cible: b.cible,
      porte_linkedin: !!b.linkedin,
      trouves: 0,
      lignes: [],
      erreur: error.message,
    };
  }

  return {
    cle: cle,
    titre: b.titre,
    cible: b.cible,
    porte_linkedin: !!b.linkedin,
    trouves: count || 0,
    lignes: data || [],
    erreur: null,
  };
}

// LA FILE MANUELLE. Les fiches saisies depuis une capture d ecran
// LinkedIn : elles n ont pas de SIREN et portent d autres noms de
// colonnes, mais l ecran attend le meme format que les bases. On les
// uniformise ici plutot que de compliquer l affichage.
async function chercherDansCrm(terme: string): Promise<any> {
  let q = supabase
    .from("crm")
    .select(
      "id, nom, organisme, ville, dirigeant_prenom, dirigeant_nom, email, "
      + "telephone, campagne, statut, linkedin, linkedin_le, linkedin_statut",
      { count: "exact" }
    )
    .eq("source", "linkedin");

  q = appliquer(q, clausesOuCrm(terme));

  const { data, count, error } = await q
    .order("id", { ascending: true })
    .range(0, 19);

  if (error) {
    return {
      cle: "manuel",
      titre: "Ma file LinkedIn",
      cible: "Fiches saisies a la main",
      porte_linkedin: true,
      trouves: 0,
      lignes: [],
      erreur: error.message,
    };
  }

  const lignes = (data || []).map(function (l: any) {
    return {
      id: l.id,
      raison_sociale: l.organisme || l.nom || "-",
      siren: null,
      ville: l.ville,
      code_postal: null,
      dirigeant_prenom: l.dirigeant_prenom || l.nom,
      dirigeant_nom: l.dirigeant_nom || "",
      email: l.email,
      telephone: l.telephone,
      statut: l.statut,
      envoye_le: null,
      desabonne: false,
      dropcontact_le: null,
      linkedin: l.linkedin,
      linkedin_le: l.linkedin_le,
      linkedin_statut: l.linkedin_statut,
      campagne: l.campagne,
    };
  });

  return {
    cle: "manuel",
    titre: "Ma file LinkedIn",
    cible: "Fiches saisies a la main",
    porte_linkedin: true,
    trouves: count || 0,
    lignes: lignes,
    erreur: null,
  };
}

// ---------------------------------------------------------------------------
// 🚨 LA LENTEUR DE L ECRAN — DIAGNOSTIQUEE ET CORRIGEE LE 31/08 AU SOIR.
//
// CE QUI SE PASSAIT. Le resume des quatre bases lancait DIX COMPTAGES PAR
// BASE, LES UNS APRES LES AUTRES. Quarante comptages sequentiels sur des
// tables de dizaines de milliers de lignes.
//
// LES DEUX CORRECTIONS :
//   1. Les comptages partent TOUS EN MEME TEMPS (Promise.all).
//   2. Le resume ne se calcule QUE quand il sert (`&resume=0`).
//
// ⚠️ NE PAS REVENIR A UNE BOUCLE `for` AVEC `await` A L INTERIEUR.
// ---------------------------------------------------------------------------

// Les dix comptages d une base, lances ensemble.
async function resumeDe(cle: string): Promise<any> {
  const b = BASES[cle];

  const [
    total,
    avecEmail,
    avecTel,
    avecLinkedin,
    linkedinAFaire,
    linkedinInvites,
    envoyes,
    enrichis,
    soumis,
    desabonnes,
  ] = await Promise.all([
    compter(b.table, null),
    compter(b.table, function (q: any) { return q.not("email", "is", null); }),
    compter(b.table, function (q: any) { return q.not("telephone", "is", null); }),
    b.linkedin
      ? compter(b.table, function (q: any) { return q.not("linkedin", "is", null); })
      : Promise.resolve(0),
    b.linkedin
      ? compter(b.table, function (q: any) {
          return q.not("linkedin", "is", null).is("linkedin_le", null);
        })
      : Promise.resolve(0),
    b.linkedin
      ? compter(b.table, function (q: any) { return q.not("linkedin_le", "is", null); })
      : Promise.resolve(0),
    compter(b.table, function (q: any) { return q.eq("statut", "envoye"); }),
    compter(b.table, function (q: any) { return q.eq("statut", "enrichi"); }),
    compter(b.table, function (q: any) { return q.not("dropcontact_le", "is", null); }),
    compter(b.table, function (q: any) { return q.eq("desabonne", true); }),
  ]);

  return {
    cle: cle,
    titre: b.titre,
    cible: b.cible,
    total: total,
    enrichis: enrichis,
    avec_email: avecEmail,
    avec_telephone: avecTel,
    avec_linkedin: avecLinkedin,
    linkedin_a_faire: linkedinAFaire,
    linkedin_invites: linkedinInvites,
    porte_linkedin: !!b.linkedin,
    soumis_dropcontact: soumis,
    envoyes: envoyes,
    desabonnes: desabonnes,
    a_envoyer: Math.max(avecEmail - envoyes - desabonnes, 0),
  };
}

// Le detail d une base : la page demandee et son compte, en une requete.
async function detailDe(demandee: string, filtre: string, cherche: string, page: number, parPage: number) {
  const b = BASES[demandee];

  const colonnes = "id, raison_sociale, siren, ville, code_postal, "
    + "dirigeant_prenom, dirigeant_nom, email, telephone, site_web, "
    + "statut, envoye_le, desabonne, dropcontact_le, sms_accepte_le"
    + (b.vague ? ", vague" : "")
    + (b.linkedin ? ", linkedin, linkedin_le, linkedin_statut" : "");

  let q = supabase.from(b.table).select(colonnes, { count: "exact" });

  // Les filtres disent ce qu on cherche a faire, pas seulement ce qu on
  // veut voir : « a envoyer » et « LinkedIn a faire » sont des listes
  // de travail, pas des vues.
  if (filtre === "a_envoyer") {
    q = q.not("email", "is", null).neq("statut", "envoye").not("desabonne", "is", true);
  } else if (filtre === "envoyes") {
    q = q.eq("statut", "envoye");
  } else if (filtre === "avec_email") {
    q = q.not("email", "is", null);
  } else if (filtre === "avec_telephone") {
    q = q.not("telephone", "is", null);
  } else if (filtre === "avec_linkedin" && b.linkedin) {
    q = q.not("linkedin", "is", null);
  } else if (filtre === "linkedin_a_faire" && b.linkedin) {
    q = q.not("linkedin", "is", null).is("linkedin_le", null);
  } else if (filtre === "linkedin_invites" && b.linkedin) {
    q = q.not("linkedin_le", "is", null);
  } else if (filtre === "a_enrichir") {
    q = q.is("email", null).is("dropcontact_le", null)
      .not("dirigeant_nom", "is", null).not("dirigeant_prenom", "is", null);
  } else if (filtre === "desabonnes") {
    q = q.eq("desabonne", true);
  }

  // La recherche par base suit la meme regle que la recherche globale :
  // mot entier, et chaque mot doit etre trouve.
  if (cherche) {
    q = appliquer(q, clausesOu(cherche, !!b.linkedin));
  }

  const debut = page * parPage;
  const { data, count, error } = await q
    .order("id", { ascending: true })
    .range(debut, debut + parPage - 1);

  if (error) return { erreur: "Lecture de " + b.table + " : " + error.message };

  return {
    base: demandee,
    titre: b.titre,
    cible: b.cible,
    porte_vague: b.vague,
    porte_linkedin: !!b.linkedin,
    filtre: filtre,
    recherche: cherche,
    page: page,
    par_page: parPage,
    total_filtre: count || 0,
    pages: Math.ceil((count || 0) / parPage),
    lignes: data || [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const demandee = (url.searchParams.get("base") || "").trim();
    const filtre = (url.searchParams.get("filtre") || "").trim();
    const cherche = (url.searchParams.get("q") || "").trim();
    const global = (url.searchParams.get("global") || "").trim();
    const page = Math.max(0, parseInt(url.searchParams.get("page") || "0", 10) || 0);
    const parPage = 50;

    const veutResume = (url.searchParams.get("resume") || "1") !== "0";

    // ---- LA RECHERCHE GLOBALE ------------------------------------------
    //
    // Elle repond seule : ni resume ni detail ne sont calcules, ce qui la
    // rend rapide. Deux caracteres minimum, sans quoi elle rendrait la
    // moitie des bases.
    //
    // ⚠️ LES QUATRE BASES ET LA FILE MANUELLE SONT INTERROGEES ENSEMBLE.
    if (global) {
      if (global.length < 2) {
        return NextResponse.json({
          ok: false,
          erreur: "Deux caracteres au minimum pour la recherche globale.",
        });
      }

      // 🚨 UN TERME QUI NE LAISSE AUCUN MOT UTILE NE DOIT RIEN RENDRE.
      // Sans ce controle, `clausesOu` rendrait un tableau vide, aucun
      // `.or()` ne serait pose, et la recherche remonterait LES VINGT
      // PREMIERES LIGNES DE CHAQUE BASE comme si elles correspondaient.
      if (motsDe(global).length === 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Terme trop court : deux lettres au minimum par mot.",
        });
      }

      const resultats = await Promise.all(
        Object.keys(BASES)
          .map(function (cle) { return chercherDans(cle, global); })
          .concat([chercherDansCrm(global)])
      );

      const total = resultats.reduce(function (s: number, r: any) {
        return s + (r.trouves || 0);
      }, 0);

      return NextResponse.json({
        ok: true,
        mode: "global",
        terme: global,
        total_trouve: total,
        mots_cherches: motsDe(global),
        bases: resultats,
      });
    }

    // ---- LE RESUME ET LE DETAIL, CALCULES ENSEMBLE ----------------------
    const [resume, detail] = await Promise.all([
      veutResume
        ? Promise.all(Object.keys(BASES).map(function (cle) { return resumeDe(cle); }))
        : Promise.resolve(null),
      demandee && BASES[demandee]
        ? detailDe(demandee, filtre, cherche, page, parPage)
        : Promise.resolve(null),
    ]);

    if (detail && (detail as any).erreur) {
      return NextResponse.json({ ok: false, erreur: (detail as any).erreur }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      resume: resume,
      total_general: resume
        ? (resume as any[]).reduce(function (s: number, r: any) { return s + r.total; }, 0)
        : null,
      detail: detail,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
