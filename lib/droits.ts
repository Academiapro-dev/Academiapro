import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "./session";

const ADMINS = ["contact@academiapro.fr"];

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

export type Droit =
  | "saisir"
  | "valider"
  | "cloturer"
  | "declarer"
  | "gerer_plan"
  | "deposer_pieces";

export type Verdict = {
  autorise: boolean;
  email: string | null;
  role: string | null;
  motif: string | null;
};

const LIBELLES: any = {
  saisir: "saisir des ecritures",
  valider: "valider et lettrer",
  cloturer: "cloturer un exercice",
  declarer: "etablir les declarations",
  gerer_plan: "gerer le plan comptable",
  deposer_pieces: "deposer des pieces",
};

// ---------------------------------------------------------------------------
// DEUX QUESTIONS DISTINCTES, A NE JAMAIS CONFONDRE
//
// 1. L ORGANISME (tenant_id) : de quel cabinet parle-t-on ? C est l etage de
//    l immeuble. Aucun utilisateur ne doit jamais voir un dossier d un autre
//    organisme, quel que soit son role.
// 2. LES DROITS (compta_collaborateurs) : a l interieur d un organisme, qui
//    a la cle de quel bureau. Un collaborateur peut etre restreint a
//    certains dossiers et a certaines actions.
//
// Ce fichier ne traitait que la seconde question : « voit tous les dossiers »
// signifiait tous les dossiers DE LA BASE, tous cabinets confondus. Le tenant
// est desormais applique EN PREMIER, avant toute question de role, ET la
// fiche du collaborateur est cherchee DANS SON ORGANISME : deux cabinets
// peuvent employer la meme adresse email sans se voir.
// ---------------------------------------------------------------------------

// L organisme de la session, ou null si la session n en porte pas.
export function tenantCourant(): string | null {
  const session = sessionCourante();
  return session ? session.tenantId : null;
}

// Les identifiants des dossiers appartenant a l organisme de la session.
// Rend un tableau VIDE quand il n y a pas d organisme : dans ce cas rien
// n est visible, ce qui est le comportement sur lequel on veut se tromper.
async function dossiersDuTenant(): Promise<string[]> {
  const tenantId = tenantCourant();
  if (!tenantId) return [];

  const { data } = await supabase
    .from("compta_societes")
    .select("id")
    .eq("tenant_id", tenantId)
    .limit(2000);

  return (data || []).map(function (d: any) { return d.id; });
}

// La fiche du collaborateur, cherchee dans son organisme uniquement.
async function ficheCollaborateur(email: string): Promise<any | null> {
  const tenantId = tenantCourant();
  if (!tenantId) return null;

  const { data } = await supabase
    .from("compta_collaborateurs")
    .select("*")
    .eq("email", email)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return data || null;
}

// Un administrateur garde tous les droits, sur tous les dossiers DE SON
// ORGANISME. C est ce qui garantit que rien ne casse tant qu aucun
// collaborateur n est utilise.
export async function verifier(
  droit: Droit | null,
  societeId?: string | null
): Promise<Verdict> {
  const session = sessionCourante();

  if (!session) {
    return { autorise: false, email: null, role: null, motif: "Connectez-vous." };
  }

  // ---- BARRIERE D ORGANISME, appliquee a tout le monde, admins compris ----
  if (societeId) {
    const duTenant = await dossiersDuTenant();
    if (duTenant.indexOf(societeId) < 0) {
      return {
        autorise: false, email: session.email, role: null,
        motif: "Ce dossier n appartient pas a votre organisme.",
      };
    }
  }

  if (ADMINS.indexOf(session.email) >= 0) {
    return { autorise: true, email: session.email, role: "administrateur", motif: null };
  }

  const collaborateur = await ficheCollaborateur(session.email);

  if (!collaborateur) {
    return {
      autorise: false, email: session.email, role: null,
      motif: "Votre compte n est pas rattache au cabinet.",
    };
  }

  if (collaborateur.actif === false) {
    return {
      autorise: false, email: session.email, role: collaborateur.role,
      motif: "Votre acces a ete desactive.",
    };
  }

  // Un tableau de dossiers vide signifie : tous les dossiers DE SON ORGANISME.
  const dossiers = collaborateur.dossiers || [];
  if (societeId && dossiers.length > 0 && dossiers.indexOf(societeId) < 0) {
    return {
      autorise: false, email: session.email, role: collaborateur.role,
      motif: "Ce dossier ne vous est pas confie.",
    };
  }

  // Un droit nul signifie : simple consultation. Le rattachement au cabinet
  // et l acces au dossier suffisent.
  if (droit === null) {
    return { autorise: true, email: session.email, role: collaborateur.role, motif: null };
  }

  if (collaborateur["peut_" + droit] !== true) {
    return {
      autorise: false, email: session.email, role: collaborateur.role,
      motif: "Votre role ne vous permet pas de " + (LIBELLES[droit] || droit) + ".",
    };
  }

  return { autorise: true, email: session.email, role: collaborateur.role, motif: null };
}

function reponse(v: Verdict): Response {
  return new Response(
    JSON.stringify({ ok: false, erreur: v.motif || "Acces refuse." }),
    {
      status: v.email ? 403 : 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Pour les routes qui ECRIVENT : renvoie une reponse toute faite si le droit
// manque, ou null si la voie est libre.
export async function barrage(
  droit: Droit,
  societeId?: string | null
): Promise<Response | null> {
  const v = await verifier(droit, societeId);
  return v.autorise ? null : reponse(v);
}

// Pour les routes qui LISENT : un collaborateur restreint a certains dossiers
// ne doit pas pouvoir consulter les comptes des autres clients du cabinet.
export async function lecture(societeId?: string | null): Promise<Response | null> {
  const v = await verifier(null, societeId);
  return v.autorise ? null : reponse(v);
}

// Les dossiers qu un utilisateur a le droit de voir.
// ATTENTION : ne rend JAMAIS null. L ancienne version rendait null pour dire
// « voit tout », ce qui, faute de notion d organisme, voulait dire tous les
// dossiers de la base. Elle rend desormais TOUJOURS une liste, bornee a
// l organisme de la session — donc utilisable directement dans un .in().
export async function dossiersAutorises(): Promise<string[]> {
  const session = sessionCourante();
  if (!session) return [];

  const duTenant = await dossiersDuTenant();
  if (duTenant.length === 0) return [];

  if (ADMINS.indexOf(session.email) >= 0) return duTenant;

  const collaborateur = await ficheCollaborateur(session.email);
  if (!collaborateur || collaborateur.actif === false) return [];

  const dossiers = collaborateur.dossiers || [];
  if (dossiers.length === 0) return duTenant;

  return duTenant.filter(function (id: string) { return dossiers.indexOf(id) >= 0; });
}
