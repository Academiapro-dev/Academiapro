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

// ---------------------------------------------------------------------------
// 🆕 28/09 — LES QUATRE DROITS DE PAIE
//
// Ils suivent exactement le meme chemin que les droits comptables : une
// colonne `peut_<droit>` dans compta_collaborateurs, lue par verifier().
//   · paie_contrats  la fiche du salarie et son contrat (embauche, salaire,
//                    horaire, taux de prelevement). Hors de portee de celui
//                    qui prepare le mois : c est la « saisie limitee ».
//   · paie_preparer  les elements du mois, les conges, les arrets, le
//                    calcul, le brouillon, la soumission a validation.
//   · paie_emettre   l emission du bulletin et les documents de fin de
//                    contrat.
//   · dsn_deposer    le depot des declarations sociales.
// Un associe les porte tous (SQL du 28/09).
// ---------------------------------------------------------------------------
export type Droit =
  | "saisir"
  | "valider"
  | "cloturer"
  | "declarer"
  | "gerer_plan"
  | "deposer_pieces"
  | "paie_contrats"
  | "paie_preparer"
  | "paie_emettre"
  | "dsn_deposer";

export type Verdict = {
  autorise: boolean;
  email: string | null;
  role: string | null;
  motif: string | null;
};

const LIBELLES: any = {
  saisir: "saisir des écritures",
  valider: "valider et lettrer",
  cloturer: "clôturer un exercice",
  declarer: "établir les déclarations",
  gerer_plan: "gérer le plan comptable",
  deposer_pieces: "déposer des pièces",
  paie_contrats: "modifier la fiche ou le contrat d'un salarié",
  paie_preparer: "préparer la paie",
  paie_emettre: "émettre des bulletins de paie",
  dsn_deposer: "déposer les déclarations sociales",
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

export function estAdmin(email: string | null | undefined): boolean {
  return ADMINS.indexOf(String(email || "").toLowerCase().trim()) >= 0;
}

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
        motif: "Ce dossier n'appartient pas à votre organisme.",
      };
    }
  }

  if (estAdmin(session.email)) {
    return { autorise: true, email: session.email, role: "administrateur", motif: null };
  }

  const collaborateur = await ficheCollaborateur(session.email);

  if (!collaborateur) {
    return {
      autorise: false, email: session.email, role: null,
      motif: "Votre compte n'est pas rattaché au cabinet.",
    };
  }

  if (collaborateur.actif === false) {
    return {
      autorise: false, email: session.email, role: collaborateur.role,
      motif: "Votre accès a été désactivé.",
    };
  }

  // Un tableau de dossiers vide signifie : tous les dossiers DE SON ORGANISME.
  const dossiers = collaborateur.dossiers || [];
  if (societeId && dossiers.length > 0 && dossiers.indexOf(societeId) < 0) {
    return {
      autorise: false, email: session.email, role: collaborateur.role,
      motif: "Ce dossier ne vous est pas confié.",
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
      motif: "Votre rôle ne vous permet pas de " + (LIBELLES[droit] || droit) + ".",
    };
  }

  return { autorise: true, email: session.email, role: collaborateur.role, motif: null };
}

function reponse(v: Verdict): Response {
  return new Response(
    JSON.stringify({ ok: false, success: false, erreur: v.motif || "Accès refusé." }),
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

  if (estAdmin(session.email)) return duTenant;

  const collaborateur = await ficheCollaborateur(session.email);
  if (!collaborateur || collaborateur.actif === false) return [];

  const dossiers = collaborateur.dossiers || [];
  if (dossiers.length === 0) return duTenant;

  return duTenant.filter(function (id: string) { return dossiers.indexOf(id) >= 0; });
}

// ---------------------------------------------------------------------------
// 🆕 28/09 — LA CARTE BLANCHE (l interrupteur de confiance de la paie)
//
// Decision de Jacques : celui qui prepare la paie passe d abord par une
// verification ; une fois qu il s est montre serieux et constant, on lui
// donne la carte blanche, dossier par dossier, et il emet seul.
//   · l administrateur et un ASSOCIE actif l ont d office, sur tous les
//     dossiers de leur organisme : ce sont eux qui valident ;
//   · un collaborateur ne l a que sur les dossiers listes dans
//     `compta_collaborateurs.paie_carte_blanche`.
// ⛔ La carte blanche ne donne AUCUN droit : il faut aussi `paie_emettre`.
// Elle dit seulement si l emission passe ou non par une validation.
// ---------------------------------------------------------------------------
export async function carteBlanche(societeId: string): Promise<boolean> {
  const session = sessionCourante();
  if (!session || !societeId) return false;

  const duTenant = await dossiersDuTenant();
  if (duTenant.indexOf(societeId) < 0) return false;

  if (estAdmin(session.email)) return true;

  const collaborateur = await ficheCollaborateur(session.email);
  if (!collaborateur || collaborateur.actif === false) return false;
  if (collaborateur.role === "associe") return true;

  const liste = collaborateur.paie_carte_blanche || [];
  return liste.indexOf(societeId) >= 0;
}

// Qui peut regler l equipe (droits, dossiers confies, carte blanche) :
// l administrateur, et les associes actifs de l organisme.
export async function peutGererEquipe(): Promise<boolean> {
  const session = sessionCourante();
  if (!session || !tenantCourant()) return false;
  if (estAdmin(session.email)) return true;

  const collaborateur = await ficheCollaborateur(session.email);
  return !!(collaborateur && collaborateur.actif !== false && collaborateur.role === "associe");
}

// Ce que la session peut faire en paie, dossier par dossier. Sert a l ecran,
// pour ne montrer que les boutons utilisables. ⚠️ L ECRAN NE PROTEGE RIEN :
// chaque action est de nouveau verifiee par la route.
export async function profilPaie(societeIds: string[]): Promise<any> {
  const session = sessionCourante();
  const vide = { email: null, role: null, admin: false, gerer_equipe: false, dossiers: {} as any };
  if (!session) return vide;

  const duTenant = await dossiersDuTenant();
  const admin = estAdmin(session.email);
  const collaborateur = admin ? null : await ficheCollaborateur(session.email);
  const actif = admin || !!(collaborateur && collaborateur.actif !== false);
  const associe = !!(collaborateur && collaborateur.role === "associe");
  const confies: string[] = (collaborateur && collaborateur.dossiers) || [];
  const cartes: string[] = (collaborateur && collaborateur.paie_carte_blanche) || [];

  const dossiers: any = {};
  for (const id of societeIds) {
    const visible = actif && duTenant.indexOf(id) >= 0
      && (admin || confies.length === 0 || confies.indexOf(id) >= 0);
    const droit = function (d: string): boolean {
      if (!visible) return false;
      if (admin) return true;
      return !!(collaborateur && collaborateur["peut_" + d] === true);
    };
    dossiers[id] = {
      voir: visible,
      contrats: droit("paie_contrats"),
      preparer: droit("paie_preparer"),
      emettre: droit("paie_emettre"),
      deposer: droit("dsn_deposer"),
      carte_blanche: visible && (admin || associe || cartes.indexOf(id) >= 0),
    };
  }

  return {
    email: session.email,
    role: admin ? "administrateur" : (collaborateur ? collaborateur.role : null),
    admin: admin,
    gerer_equipe: admin || (actif && associe),
    dossiers: dossiers,
  };
}
