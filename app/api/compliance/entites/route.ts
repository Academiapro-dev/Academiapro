import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { limiter, ipDe } from "../../../../lib/limiteur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

// ---------------------------------------------------------------------------
// LES ENTITES DECLARANTES D UN ORGANISME — 31/08.
//
// 🚨 CE QUI CHANGE, ET POURQUOI. Jusqu ici le module compliance tenait pour
// acquis qu un organisme = UNE SEULE societe : /api/compliance/onboarding
// refuse explicitement la seconde (« Une societe est deja rattachee a ce
// compte »), et toutes les routes lisent « la societe du tenant » avec un
// maybeSingle().
//
// Ce modele convient a une entreprise qui declare pour elle-meme. Il ne
// convient PAS a un gestionnaire qui suit les obligations de centaines de
// LLC pour ses clients : il devrait creer un compte par dossier et changer
// de session a chaque fois.
//
// LA STRUCTURE ETAIT DEJA PRETE : compliance_tenants porte un `id` PROPRE
// et un `tenant_id` SEPARE. Le concept « un organisme, plusieurs entites »
// existe dans la base depuis le debut, personne n en avait eu l usage.
// Les colonnes entite_id de compliance_deadlines et compliance_documents,
// ajoutees le 31/08, completent le dispositif.
//
// ⚠️ LE PATRON EST CELUI DE /api/compliance/societes, qui resout le meme
// probleme cote comptabilite : un cabinet, plusieurs dossiers, un selecteur.
// Ne pas inventer un second mecanisme.
//
// ⚠️ AUCUN PLAFOND N EST SUPPOSE. La pagination est explicite et le
// comptage des echeances se fait EN BASE, jamais en parcourant les entites
// une par une. Trois cents ou dix mille dossiers se comportent pareil.
// ---------------------------------------------------------------------------

// 🚨 SUPABASE TRONQUE SILENCIEUSEMENT A 1000 OBJETS, SANS ERREUR. Une page
// de 50 reste tres en dessous ; le plafond ci-dessous existe pour qu un
// appelant ne puisse pas demander 5000 lignes d un coup et declencher la
// troncature sans s en apercevoir.
const PAR_PAGE_DEFAUT = 50;
const PAR_PAGE_MAX = 200;

// Ecrire coute : creation de la fiche, generation des echeances. Un
// compteur evite qu une boucle remplisse la base.
const MAX_CREATIONS = 60;
const FENETRE_CREATION_MS = 60 * 60 * 1000;

const CHAMPS_LISTE =
  "id, label, legal_name, entity_type, formation_state, formation_date, "
  + "anniversary_month, fr_tax_resident, member_residence, wy_filing_id, "
  + "registered_agent_name, email_contact, relance_auto, created_at";

// GET — la liste paginee des entites de l organisme.
//
// Parametres : q (recherche), page (1 par defaut), taille (50 par defaut),
// echeances=1 pour joindre le nombre d echeances a venir par entite.
export async function GET(req: NextRequest) {
  const session = sessionCourante();
  if (!session || !session.tenantId) {
    return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
  }

  const p = req.nextUrl.searchParams;
  const recherche = (p.get("q") || "").trim();

  const page = Math.max(1, Number(p.get("page")) || 1);
  const taille = Math.min(PAR_PAGE_MAX, Math.max(1, Number(p.get("taille")) || PAR_PAGE_DEFAUT));
  const debut = (page - 1) * taille;
  const fin = debut + taille - 1;

  // count: "exact" rend le total sans rapatrier les lignes : c est ce qui
  // permet d afficher « 1 a 50 sur 1 240 » sans tout charger.
  let requete = supabase
    .from("compliance_tenants")
    .select(CHAMPS_LISTE, { count: "exact" })
    .eq("tenant_id", session.tenantId)
    .order("label", { ascending: true })
    .range(debut, fin);

  if (recherche) {
    // Les caracteres % et , casseraient le filtre .or() de PostgREST.
    const propre = recherche.replace(/[%,]/g, " ").trim();
    if (propre) {
      requete = requete.or("label.ilike.%" + propre + "%,legal_name.ilike.%" + propre + "%");
    }
  }

  const { data, error, count } = await requete;

  if (error) {
    console.error("[compliance/entites] lecture :", error.message);
    return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
  }

  const entites: any[] = data || [];

  // ECHEANCES A VENIR, EN UNE SEULE REQUETE POUR TOUTE LA PAGE.
  //
  // ⚠️ NE JAMAIS BOUCLER SUR LES ENTITES POUR COMPTER : cinquante entites
  // feraient cinquante allers-retours, et mille en feraient mille. On lit
  // les echeances des entites AFFICHEES en un seul appel, puis on compte
  // en memoire.
  if (p.get("echeances") === "1" && entites.length > 0) {
    const ids = entites.map(function (e: any) { return e.id; });
    const aujourdhui = new Date().toISOString().slice(0, 10);

    const { data: ech, error: eEch } = await supabase
      .from("compliance_deadlines")
      .select("entite_id, due_date, status")
      .eq("tenant_id", session.tenantId)
      .in("entite_id", ids)
      .neq("status", "accuse_archive")
      .gte("due_date", aujourdhui)
      .order("due_date", { ascending: true })
      .limit(5000);

    if (eEch) {
      console.error("[compliance/entites] echeances :", eEch.message);
    } else {
      const parEntite: any = {};
      for (const l of ech || []) {
        const cle = l.entite_id;
        if (!cle) continue;
        if (!parEntite[cle]) parEntite[cle] = { nb: 0, prochaine: null };
        parEntite[cle].nb = parEntite[cle].nb + 1;
        // Les lignes arrivent triees par date : la premiere vue est la plus proche.
        if (!parEntite[cle].prochaine) parEntite[cle].prochaine = l.due_date;
      }
      for (const e of entites) {
        const info = parEntite[e.id] || { nb: 0, prochaine: null };
        e.echeances_a_venir = info.nb;
        e.prochaine_echeance = info.prochaine;
      }
    }
  }

  const total = count === null || count === undefined ? entites.length : count;

  return NextResponse.json({
    ok: true,
    entites: entites,
    page: page,
    taille: taille,
    total: total,
    pages: Math.max(1, Math.ceil(total / taille)),
  });
}

// POST — creation d une entite dans l organisme de la session.
export async function POST(req: NextRequest) {
  const session = sessionCourante();
  if (!session || !session.tenantId) {
    return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
  }

  if (!limiter(ipDe(req), "compliance_entites", MAX_CREATIONS, FENETRE_CREATION_MS)) {
    return NextResponse.json(
      { ok: false, erreur: "Trop de creations d'affilee. Reessayez dans un moment." },
      { status: 429 }
    );
  }

  const corps = await req.json().catch(() => ({} as any));

  const label = String(corps.label || "").trim();
  const legalName = String(corps.legal_name || "").trim();
  const formationState = String(corps.formation_state || "").trim().toUpperCase();

  if (label.length < 2) {
    return NextResponse.json(
      { ok: false, erreur: "Indiquez un nom d'usage." },
      { status: 400 }
    );
  }
  if (!formationState) {
    return NextResponse.json(
      { ok: false, erreur: "Indiquez l'Etat ou pays de constitution." },
      { status: 400 }
    );
  }

  // Le mois d anniversaire porte l echeance du rapport annuel Wyoming.
  // L oublier revient a ne jamais relancer le client : on le deduit de la
  // date de constitution quand il n est pas fourni.
  let mois = Number(corps.anniversary_month) || null;
  const dateFormation = String(corps.formation_date || "").trim() || null;
  if (!mois && dateFormation && dateFormation.length >= 7) {
    const m = parseInt(dateFormation.slice(5, 7), 10);
    if (m >= 1 && m <= 12) mois = m;
  }

  // 🚨 tenant_id EST IMPOSE PAR LA SESSION. C est ce qui rattache l entite
  // a l organisme qui la cree, et rien d autre ne doit pouvoir le decider.
  const champs: any = {
    tenant_id: session.tenantId,
    label: label,
    legal_name: legalName || label,
    entity_type: corps.entity_type || "LLC",
    formation_state: formationState,
    formation_date: dateFormation,
    anniversary_month: mois,
    member_residence: String(corps.member_residence || "").trim() || null,
    fr_tax_resident: corps.fr_tax_resident === true,
    has_us_source_income: corps.has_us_source_income === true,
    wy_filing_id: String(corps.wy_filing_id || "").trim() || null,
    registered_agent_name: String(corps.registered_agent_name || "").trim() || null,
    mailing_address: String(corps.mailing_address || "").trim() || null,
    principal_office_address: String(corps.principal_office_address || "").trim() || null,
    notes: String(corps.notes || "").trim() || null,
    email_contact: String(corps.email_contact || "").trim() || null,
    // ⚠️ LA RELANCE N EST JAMAIS ARMEE PAR DEFAUT. Le silence ne vaut pas
    // consentement : un courriel part au nom du gestionnaire, chez SON
    // client. Il doit l avoir voulu, societe par societe.
    relance_auto: corps.relance_auto === true,
  };

  const { data, error } = await supabase
    .from("compliance_tenants")
    .insert(champs)
    .select("id, label, legal_name, formation_state, anniversary_month")
    .single();

  if (error) {
    console.error("[compliance/entites] creation :", error.message);
    return NextResponse.json({ ok: false, erreur: "Creation impossible." }, { status: 500 });
  }

  // GENERATION DES ECHEANCES, comme le fait /api/compliance/onboarding.
  //
  // ⚠️ LA FONCTION SQL TRAVAILLE PAR TENANT, PAS PAR ENTITE : elle ecrit
  // des lignes sans entite_id. On les rattache donc juste apres, sinon
  // elles resteraient invisibles dans la fiche de l entite.
  //
  // Un echec ici NE DOIT PAS annuler la creation : l entite existe, ses
  // echeances se regenereront. Mais il est signale a l appelant, parce
  // qu une entite sans echeance ne declenche aucune relance — et c est
  // precisement ce que le client achete.
  const anneeCible = new Date().getFullYear() + 1;
  const echeances: any = { annee: anneeCible };

  try {
    const { error: eGen } = await supabase.rpc("compliance_generate_deadlines", {
      p_tenant_id: session.tenantId,
      p_year: anneeCible,
    });

    if (eGen) {
      echeances.generees = false;
      echeances.raison = eGen.message;
      console.error("[compliance/entites] generation echeances :", eGen.message);
    } else {
      const { error: eMaj, count: nb } = await supabase
        .from("compliance_deadlines")
        .update({ entite_id: data.id }, { count: "exact" })
        .eq("tenant_id", session.tenantId)
        .is("entite_id", null);

      if (eMaj) {
        echeances.generees = false;
        echeances.raison = "rattachement : " + eMaj.message;
        console.error("[compliance/entites] rattachement echeances :", eMaj.message);
      } else {
        echeances.generees = true;
        echeances.nombre = nb === null || nb === undefined ? 0 : nb;
      }
    }
  } catch (e: any) {
    echeances.generees = false;
    echeances.raison = String(e && e.message ? e.message : e);
    console.error("[compliance/entites] generation :", String(e));
  }

  return NextResponse.json({ ok: true, entite: data, echeances: echeances });
}

// PATCH — modification d une entite.
//
// L identifiant vient de la requete, ce qui est normal : c est un choix
// dans une liste. La mise a jour est bornee au tenant de la session, donc
// un identifiant appartenant a un autre organisme ne correspond a aucune
// ligne et ne modifie rien.
export async function PATCH(req: NextRequest) {
  const session = sessionCourante();
  if (!session || !session.tenantId) {
    return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
  }

  const corps = await req.json().catch(() => ({} as any));
  const id = String(corps.id || "").trim();

  if (!id) {
    return NextResponse.json({ ok: false, erreur: "Entite non precisee." }, { status: 400 });
  }

  // Liste blanche : tenant_id n y figure PAS, une entite ne change jamais
  // d organisme par une requete.
  //
  // ⚠️ email_contact ET relance_auto SONT MODIFIABLES ICI, et c est par eux
  // que le gestionnaire arme le suivi depuis l agenda. Sans cette
  // possibilite, les deux colonnes ne se regleraient qu en SQL — autrement
  // dit la fonction n existerait pas pour le client.
  const modifiables = [
    "label", "legal_name", "entity_type", "formation_state", "formation_date",
    "anniversary_month", "member_residence", "fr_tax_resident",
    "has_us_source_income", "registered_agent_name", "mailing_address",
    "principal_office_address", "notes", "wy_filing_id", "wy_assets_value",
    "email_contact", "relance_auto",
  ];

  const champs: any = {};
  for (const cle of modifiables) {
    if (corps[cle] !== undefined) champs[cle] = corps[cle];
  }

  if (Object.keys(champs).length === 0) {
    return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("compliance_tenants")
    .update(champs)
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .select("id, label, legal_name")
    .maybeSingle();

  if (error) {
    console.error("[compliance/entites] modification :", error.message);
    return NextResponse.json({ ok: false, erreur: "Modification impossible." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, erreur: "Entite introuvable." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, entite: data });
}
