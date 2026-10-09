import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sessionCourante,
  fabriquerJetonSession,
  NOM_COOKIE_SESSION,
  DUREE_COOKIE_SECONDES,
} from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// L utilisateur vient du JETON SIGNE session_academia. Avec l ancien cookie
// sb_user, un cookie forge permettait de rattacher une societe au compte
// d un autre utilisateur. Le jeton ne portant que l email, l identifiant
// est retrouve en base via la fonction utilisateur_par_email.
//
// 🚨 23/09 — TROIS CAUSES, UN SEUL MESSAGE : C ETAIT LE DEFAUT.
// Sans session, avec une session dont l email ne correspond a aucun compte,
// ou sur une erreur de la base, la route repondait la meme chose :
// « Vous devez etre connecte ». L erreur de la base etait meme AVALEE.
// Jacques s est reconnecte et le message est revenu a l identique : il
// mentait, et rien ne permettait de savoir pourquoi.
// ✅ La fonction rend desormais la RAISON, et chaque cas a son message.
// ⛔ LES CODES DE STATUT NE CHANGENT PAS (401 partout, comme avant) : une
// page qui teste le statut continue de fonctionner a l identique.
type RaisonSansUtilisateur = "sans_session" | "compte_introuvable" | "erreur_base";
type UtilisateurSession = {
  id: string | null;
  tenantId: string | null;
  raison: RaisonSansUtilisateur | null;
  detail: string;
};

async function utilisateurDeLaSession(): Promise<UtilisateurSession> {
  const session = sessionCourante();
  if (!session || !session.email) {
    return { id: null, tenantId: null, raison: "sans_session", detail: "" };
  }

  const { data, error } = await supabase.rpc("utilisateur_par_email", {
    p_email: session.email,
  });

  if (error) {
    return { id: null, tenantId: session.tenantId, raison: "erreur_base", detail: error.message };
  }
  if (!data) {
    return { id: null, tenantId: session.tenantId, raison: "compte_introuvable", detail: session.email };
  }
  return { id: data as string, tenantId: session.tenantId, raison: null, detail: "" };
}

// Le message rendu a l utilisateur quand aucun compte n est reconnu.
function refusSession(u: UtilisateurSession, pour: string) {
  if (u.raison === "erreur_base") {
    return NextResponse.json(
      { error: "La vérification de votre compte a échoué (" + u.detail + "). Réessayez dans un instant." },
      { status: 401 }
    );
  }
  if (u.raison === "compte_introuvable") {
    return NextResponse.json(
      { error: "Vous êtes connecté avec l'adresse " + u.detail + ", mais aucun compte ne lui correspond. Contactez le support." },
      { status: 401 }
    );
  }
  return NextResponse.json(
    { error: "Votre session a expiré ou vous n'êtes pas connecté. Reconnectez-vous pour " + pour + "." },
    { status: 401 }
  );
}

// 🚨 23/09 — LE CUL-DE-SAC DU CLIENT QUI ARRIVE AVEC UNE ADRESSE NEUVE.
// La connexion ouvre une session signee pour l adresse qui a recu le lien,
// SANS creer de compte dans auth.users. Or l enregistrement de la societe
// exige ce compte (compliance_membres.user_id). Mesure du 23/09 :
// contact@mysterllc.com connecte, 0 ligne dans auth.users, enregistrement
// impossible. Tout nouveau client tombait dans ce trou.
// ✅ Le compte nait ICI, au moment ou le client declare sa societe. La
// session prouve deja que l adresse est la sienne : il a ouvert le lien
// envoye dans cette boite.
// ⚠️ Un compte cree entre-temps fait echouer createUser (« deja inscrit ») :
// on relit donc TOUJOURS apres, et c est la relecture qui fait foi.
async function creerCompte(email: string): Promise<{ id: string | null; erreur: string }> {
  const adresse = String(email || "").toLowerCase().trim();
  if (!adresse) return { id: null, erreur: "adresse absente de la session" };

  const { error: eCreation } = await supabase.auth.admin.createUser({
    email: adresse,
    email_confirm: true,
  });

  const { data, error: eLecture } = await supabase.rpc("utilisateur_par_email", {
    p_email: adresse,
  });
  if (eLecture) return { id: null, erreur: eLecture.message };
  if (data) return { id: data as string, erreur: "" };
  return { id: null, erreur: eCreation ? eCreation.message : "compte introuvable après création" };
}

// 🚨 23/09 — LE CLIENT ENFERME DANS LE FORMULAIRE.
// Le middleware renvoie toute page de l espace vers « Ma société » tant que
// la session ne porte pas de societe (charge.tid). Or la session avait ete
// ouverte AVANT que la societe existe : elle n en portait aucune. Apres
// l enregistrement, chaque bouton ramenait au formulaire, « Se déconnecter »
// compris, et la seule issue etait une reconnexion que rien n expliquait.
// Mesure du 23/09 : Jacques enferme, sur le parcours d un nouveau client.
// ✅ La session est REEMISE avec la societe : a l enregistrement (POST), et
// pour toute session deja coincee, a la prochaine ouverture de la page (GET).
// Le role porte est celui du rattachement (compliance_membres.role).
function poserSession(reponse: NextResponse, email: string, tenantId: string, role: string | null) {
  const jeton = fabriquerJetonSession(email, tenantId, role);
  reponse.cookies.set(NOM_COOKIE_SESSION, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_COOKIE_SECONDES,
  });
  return reponse;
}

// ---------------------------------------------------------------------------
// 🆕 09/10 — LA FICHE D UN CABINET FRANCAIS.
//
// Elle va dans la meme table que les societes suivies (compliance_tenants),
// parce que c est la que la signature electronique lit le nom et l adresse
// de celui qui fait signer. Mais ce n est PAS une LLC :
//   - elle est rattachee a l organisme de la SESSION (tenant_id impose,
//     jamais lu dans la demande) ;
//   - formation_state vaut « FR » : c est a ce code que la page reconnait
//     une fiche francaise ;
//   - ⛔ AUCUNE echeance n est generee (les regles sont americaines), et les
//     relances restent desarmees ;
//   - ni compte ni rattachement a creer, ni session a reemettre : le
//     cabinet est deja membre de son organisme.
// L adresse du siege est obligatoire : les lettres que le cabinet fait
// signer la portent.
// ---------------------------------------------------------------------------
async function creerFicheCabinet(tenantId: string, body: any) {
  const label = String(body.label || "").trim().slice(0, 120);
  const legalName = String(body.legal_name || "").trim().slice(0, 200);
  const siege = String(body.principal_office_address || "").trim().slice(0, 300);
  const siren = String(body.wy_filing_id || "").replace(/[^0-9]/g, "");
  const email = String(body.email_contact || "").toLowerCase().trim();

  if (label.length < 2) {
    return NextResponse.json({ error: "Le nom du cabinet est obligatoire." }, { status: 400 });
  }
  if (legalName.length < 2) {
    return NextResponse.json({ error: "La dénomination légale est obligatoire." }, { status: 400 });
  }
  if (siege.length < 8) {
    return NextResponse.json({ error: "L'adresse du siège est obligatoire : les documents à signer la portent." }, { status: 400 });
  }
  if (siren && siren.length !== 9 && siren.length !== 14) {
    return NextResponse.json({ error: "Le numéro SIREN compte 9 chiffres (ou 14 pour un SIRET)." }, { status: 400 });
  }
  if (email && (email.indexOf("@") < 1 || email.indexOf(".") < 3)) {
    return NextResponse.json({ error: "Adresse électronique illisible." }, { status: 400 });
  }

  const ligne: Record<string, unknown> = {
    tenant_id: tenantId,
    label,
    legal_name: legalName,
    formation_state: "FR",
    member_residence: "FR",
    fr_tax_resident: true,
    has_us_source_income: false,
    entity_type: "CABINET",
    principal_office_address: siege,
    relance_auto: false,
  };
  if (siren) ligne.wy_filing_id = siren;
  if (email) ligne.email_contact = email;
  const telephone = String(body.telephone_contact || "").replace(/[^0-9+ .\-()]/g, "").trim().slice(0, 30);
  if (telephone) ligne.telephone_contact = telephone;

  let { data: societe, error: eIns } = await supabase
    .from("compliance_tenants")
    .insert(ligne)
    .select()
    .single();

  // ⚠️ Si la base n admet qu une liste fermee de types (contrainte CHECK,
  // code 23514), la fiche est enregistree sous le type par defaut : c est
  // formation_state = « FR » qui la designe comme francaise, pas le type.
  if (eIns && String((eIns as any).code || "") === "23514") {
    ligne.entity_type = "LLC";
    const second = await supabase.from("compliance_tenants").insert(ligne).select().single();
    societe = second.data;
    eIns = second.error;
  }

  if (eIns || !societe) {
    return NextResponse.json(
      { error: "Création de la fiche : " + (eIns ? eIns.message : "aucune ligne rendue") },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    cabinet: true,
    tenant_id: societe.tenant_id,
    label: societe.label,
    legal_name: societe.legal_name,
    echeances: { tente: false },
    session_mise_a_jour: true,
  });
}

// GET : l'utilisateur connecte a-t-il deja une societe ?
export async function GET(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const u = await utilisateurDeLaSession();
  const { id, tenantId } = u;

  // 🆕 23/09 — une adresse verifiee sans compte, c est un client qui arrive :
  // il n a pas encore de societe. Ce n est PAS une erreur, et la page ne doit
  // pas l accueillir par un message rouge. Son compte naitra a l enregistrement.
  if (!id && !tenantId && u.raison === "compte_introuvable") {
    return NextResponse.json({ success: true, a_une_societe: false, societe: null });
  }

  if (!id) {
    return refusSession(u, "accéder à votre société");
  }

  if (!tenantId) {
    // 🆕 23/09 — LA SESSION OUVERTE AVANT LA SOCIETE SE REPARE ICI.
    // Un seul rattachement actif : c est sa societe, on la remet dans la
    // session. Plusieurs : on ne choisit pas a sa place, rien ne change.
    const { data: membres } = await supabase
      .from("compliance_membres")
      .select("tenant_id, role")
      .eq("user_id", id)
      .eq("actif", true)
      .limit(2);

    if (membres && membres.length === 1 && membres[0].tenant_id) {
      const tid = String(membres[0].tenant_id);
      const { data: soc, error: eSoc } = await supabase
        .from("compliance_tenants")
        .select("*")
        .eq("tenant_id", tid)
        .maybeSingle();

      if (!eSoc && soc) {
        const s = sessionCourante();
        const reponse = NextResponse.json({ success: true, a_une_societe: true, societe: soc, session_mise_a_jour: true });
        if (s && s.email) poserSession(reponse, s.email, tid, membres[0].role ? String(membres[0].role) : null);
        return reponse;
      }
    }

    return NextResponse.json({ success: true, a_une_societe: false, societe: null });
  }

  const { data, error } = await supabase
    .from("compliance_tenants")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Lecture de la société : " + error.message }, { status: 500 });
  }

  // 🆕 09/10 — LE CABINET INSCRIT PAR MR COMPTABLE N A PAS DE FICHE ICI.
  // Son compte porte deja un organisme (ne a l inscription, avec sa fiche
  // dans organismes_formation), mais aucune ligne dans compliance_tenants.
  // Or la signature electronique nomme et range chaque document par cette
  // ligne : sans elle, ni lettre de mission ni lettre de depart ne partent.
  // La page recoit donc « cabinet: true » et ce que l inscription sait deja,
  // pour proposer le formulaire FRANCAIS, prerempli. Rien d autre ne change.
  if (!data) {
    const { data: fiche } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, email_contact, siret")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    return NextResponse.json({
      success: true,
      a_une_societe: false,
      societe: null,
      cabinet: true,
      organisme: {
        raison_sociale: (fiche && fiche.raison_sociale) || "",
        email_contact: (fiche && fiche.email_contact) || "",
        siren: (fiche && fiche.siret) || "",
      },
    });
  }

  return NextResponse.json({ success: true, a_une_societe: true, societe: data });
}

// POST : creation de la societe du nouveau client
export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const u = await utilisateurDeLaSession();
  let userId = u.id;
  const tenantExistant = u.tenantId;

  // 🆕 23/09 — le client qui arrive : son compte nait ici.
  if (!userId && u.raison === "compte_introuvable") {
    const cree = await creerCompte(u.detail);
    if (!cree.id) {
      return NextResponse.json(
        { error: "Votre compte n'a pas pu être créé (" + cree.erreur + "). Réessayez dans un instant." },
        { status: 500 }
      );
    }
    userId = cree.id;
  }

  if (!userId) {
    return refusSession(u, "enregistrer une société");
  }

  // 🚨 09/10 — LE CUL-DE-SAC DU CABINET.
  // « Un compte qui porte un organisme a deja sa societe » : vrai pour le
  // client d une LLC (son organisme NAIT ici, avec sa societe), FAUX pour un
  // cabinet inscrit par Mr Comptable (son organisme nait a l inscription,
  // SANS ligne dans compliance_tenants). Mesure du 09/10, Cabinet Essai
  // Deux : la page affichait le formulaire, et l enregistrement repondait
  // « Une société est déjà rattachée à ce compte ». Aucun document ne
  // pouvait donc partir a la signature dans un cabinet neuf.
  // ✅ Le refus ne tombe plus que si une fiche EXISTE vraiment. Sinon la
  // fiche est creee DANS l organisme de la session (modeCabinet).
  // ⛔ Pour le client d une LLC, rien ne change : il n a pas d organisme.
  let modeCabinet = false;
  if (tenantExistant) {
    const { data: deja, error: eDeja } = await supabase
      .from("compliance_tenants")
      .select("id")
      .eq("tenant_id", tenantExistant)
      .limit(1);
    if (eDeja) {
      return NextResponse.json({ error: "Lecture de la société : " + eDeja.message }, { status: 500 });
    }
    if (deja && deja.length > 0) {
      return NextResponse.json(
        { error: "Une société est déjà rattachée à ce compte." },
        { status: 409 }
      );
    }
    modeCabinet = true;
  }

  try {
    const body = await req.json();

    if (modeCabinet) {
      return await creerFicheCabinet(String(tenantExistant), body);
    }

    const label = String(body.label || "").trim();
    const legalName = String(body.legal_name || "").trim();
    const formationState = String(body.formation_state || "").trim();

    if (!label) {
      return NextResponse.json({ error: "Le nom d'usage est obligatoire." }, { status: 400 });
    }
    if (!legalName) {
      return NextResponse.json({ error: "La dénomination légale est obligatoire." }, { status: 400 });
    }
    if (!formationState) {
      return NextResponse.json({ error: "L'État ou pays de constitution est obligatoire." }, { status: 400 });
    }

    const ligne: Record<string, unknown> = {
      label,
      legal_name: legalName,
      formation_state: formationState,
      member_residence: body.member_residence || "FR",
      fr_tax_resident: body.fr_tax_resident !== false,
      has_us_source_income: body.has_us_source_income === true,
      entity_type: body.entity_type || "LLC",
    };

    if (body.formation_date) ligne.formation_date = body.formation_date;
    if (body.wy_filing_id) ligne.wy_filing_id = body.wy_filing_id;
    if (body.registered_agent_name) ligne.registered_agent_name = body.registered_agent_name;
    if (body.mailing_address) ligne.mailing_address = body.mailing_address;
    if (body.principal_office_address) ligne.principal_office_address = body.principal_office_address;
    if (body.notes) ligne.notes = body.notes;
    // 🆕 09/09 : le contact des relances, saisi des la creation.
    if (body.email_contact) ligne.email_contact = String(body.email_contact).toLowerCase().trim();
    if (body.telephone_contact) ligne.telephone_contact = String(body.telephone_contact).replace(/[^0-9+ .\-()]/g, "").trim().slice(0, 30);

    if (body.formation_date) {
      const mois = Number(String(body.formation_date).slice(5, 7));
      if (mois >= 1 && mois <= 12) ligne.anniversary_month = mois;
    }

    const { data: societe, error: eIns } = await supabase
      .from("compliance_tenants")
      .insert(ligne)
      .select()
      .single();

    if (eIns) {
      return NextResponse.json(
        { error: "Création de la société : " + eIns.message },
        { status: 500 }
      );
    }

    const { error: eMembre } = await supabase.from("compliance_membres").insert({
      user_id: userId,
      tenant_id: societe.tenant_id,
      role: "proprietaire",
      actif: true,
    });

    if (eMembre) {
      return NextResponse.json(
        {
          error: "Société créée, mais son rattachement à votre compte a échoué : " + eMembre.message,
          tenant_id: societe.tenant_id,
        },
        { status: 500 }
      );
    }

    // Generation des echeances.
    // 🚨 23/09 — L ANCIENNE FONCTION NE MARCHAIT PLUS.
    // compliance_generate_deadlines raisonne PAR CLIENT
    // (on conflict (tenant_id, rule_code, period_label)), or depuis le
    // portefeuille l unicite porte sur la SOCIETE (index
    // compliance_deadlines_entite_rule_period_key). PostgreSQL refusait :
    // « no unique or exclusion constraint matching the ON CONFLICT » — et
    // AUCUN nouveau client n obtenait d echeances. Elle n ecrivait meme pas
    // entite_id.
    // Mesure du 23/09 : les 33 echeances en base portent TOUTES une societe.
    // Elles viennent de la fonction par societe, deja en place : c est elle
    // qu on appelle.
    // Signature reelle verifiee : compliance_generer_echeances_entite(p_entite_id uuid, p_annee integer)
    const anneeCible = new Date().getFullYear() + 1;
    const echeances: Record<string, unknown> = { tente: true, annee: anneeCible };
    try {
      const { error: eGen } = await supabase.rpc("compliance_generer_echeances_entite", {
        p_entite_id: societe.id,
        p_annee: anneeCible,
      });
      if (eGen) {
        echeances.generees = false;
        echeances.raison = eGen.message;
      } else {
        echeances.generees = true;
      }
    } catch (e: unknown) {
      echeances.generees = false;
      echeances.raison = e instanceof Error ? e.message : String(e);
    }

    // 🆕 23/09 — la session porte desormais la societe : plus de reconnexion.
    const reponse = NextResponse.json({
      success: true,
      tenant_id: societe.tenant_id,
      label: societe.label,
      legal_name: societe.legal_name,
      echeances,
      session_mise_a_jour: true,
    });
    const s = sessionCourante();
    if (s && s.email) poserSession(reponse, s.email, String(societe.tenant_id), "proprietaire");
    return reponse;
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// 🆕 PATCH — 09/09 : LE CONTACT DES RELANCES, MODIFIABLE PAR LE TITULAIRE.
//
// Trois champs, et seulement ceux-la : email_contact (ou partent les
// courriels de relance et l accuse de lecture a signer), telephone_contact
// (ou partent les SMS a J-7 et J-1), relance_auto (l interrupteur). Le reste
// de la fiche (denomination, Etat, date) reste au support : ces valeurs
// pilotent les echeances et ne se changent pas d un clic.
//
// Le tenant vient de la session ; l entite modifiee est celle du tenant.
// Avec plusieurs societes, `entite_id` designe laquelle — et elle doit
// appartenir au tenant.
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const u = await utilisateurDeLaSession();
  const { id: userId, tenantId } = u;
  if (!userId) {
    return refusSession(u, "modifier votre contact");
  }
  if (!tenantId) {
    return NextResponse.json({ error: "Aucune société n'est encore rattachée à votre compte." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const modifications: Record<string, unknown> = {};

    if (body.email_contact !== undefined) {
      const e = String(body.email_contact || "").toLowerCase().trim();
      if (e && (e.indexOf("@") < 1 || e.indexOf(".") < 3)) {
        return NextResponse.json({ error: "Adresse électronique illisible." }, { status: 400 });
      }
      modifications.email_contact = e || null;
    }
    if (body.telephone_contact !== undefined) {
      const t = String(body.telephone_contact || "").replace(/[^0-9+ .\-()]/g, "").trim().slice(0, 30);
      modifications.telephone_contact = t || null;
    }
    if (body.relance_auto !== undefined) {
      modifications.relance_auto = body.relance_auto === true;
    }
    if (Object.keys(modifications).length === 0) {
      return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });
    }

    let q = supabase.from("compliance_tenants").update(modifications).eq("tenant_id", tenantId);
    if (body.entite_id) q = q.eq("id", String(body.entite_id));
    const { data, error } = await q.select("id, email_contact, telephone_contact, relance_auto");

    if (error) return NextResponse.json({ error: "Modification : " + error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: "Société introuvable." }, { status: 404 });

    return NextResponse.json({ success: true, societes: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
