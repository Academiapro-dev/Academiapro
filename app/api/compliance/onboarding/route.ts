import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
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

  return NextResponse.json({ success: true, a_une_societe: !!data, societe: data });
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

  if (tenantExistant) {
    return NextResponse.json(
      { error: "Une société est déjà rattachée à ce compte." },
      { status: 409 }
    );
  }

  try {
    const body = await req.json();

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
    // Signature reelle verifiee : compliance_generate_deadlines(p_tenant_id uuid, p_year integer)
    const anneeCible = new Date().getFullYear() + 1;
    const echeances: Record<string, unknown> = { tente: true, annee: anneeCible };
    try {
      const { error: eGen } = await supabase.rpc("compliance_generate_deadlines", {
        p_tenant_id: societe.tenant_id,
        p_year: anneeCible,
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

    return NextResponse.json({
      success: true,
      tenant_id: societe.tenant_id,
      label: societe.label,
      legal_name: societe.legal_name,
      echeances,
      note: "Reconnectez-vous pour que votre société soit prise en compte dans votre session.",
    });
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
