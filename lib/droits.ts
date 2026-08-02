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

// Un administrateur garde tous les droits, sur tous les dossiers. C est ce
// qui garantit que rien ne casse tant qu aucun collaborateur n est utilise.
export async function verifier(
  droit: Droit | null,
  societeId?: string | null
): Promise<Verdict> {
  const session = sessionCourante();

  if (!session) {
    return { autorise: false, email: null, role: null, motif: "Connectez-vous." };
  }

  if (ADMINS.indexOf(session.email) >= 0) {
    return { autorise: true, email: session.email, role: "administrateur", motif: null };
  }

  const { data: collaborateur } = await supabase
    .from("compta_collaborateurs")
    .select("*")
    .eq("email", session.email)
    .maybeSingle();

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

  // Un tableau de dossiers vide signifie : tous les dossiers.
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

// Les dossiers qu un utilisateur a le droit de voir. Rend null quand il les
// voit tous, ce qui evite de filtrer inutilement.
export async function dossiersAutorises(): Promise<string[] | null> {
  const session = sessionCourante();
  if (!session) return [];
  if (ADMINS.indexOf(session.email) >= 0) return null;

  const { data } = await supabase
    .from("compta_collaborateurs")
    .select("dossiers, actif")
    .eq("email", session.email)
    .maybeSingle();

  if (!data || data.actif === false) return [];
  const dossiers = data.dossiers || [];
  return dossiers.length === 0 ? null : dossiers;
}
