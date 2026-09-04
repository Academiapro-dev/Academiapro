import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fabriquerJetonSession, NOM_COOKIE_SESSION, DUREE_COOKIE_SECONDES } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🚨 LA CONNEXION RESTE SUR LE DOMAINE OU ELLE S EST FAITE — 23/08.
//
// Le domaine se lit dans l en-tete host. Connu : on y reste. Inconnu
// (previsualisation Vercel, localhost) : academiapro.fr. Le cookie n a
// volontairement AUCUN attribut domain : il vaut pour le domaine qui sert
// cette route.
const SITE_PAR_DEFAUT = "https://academiapro.fr";

// 🚨 MYSTERLLC AJOUTE LE 01/09.
//
// ⚠️ CETTE TABLE DOIT RESTER ALIGNEE SUR CELLE DE /api/auth/demander. Elles
// sont distinctes et rien ne les relie : n en corriger qu une deplace le
// defaut sans le supprimer. C est ce qui s est passe le 01/09 — le courriel
// serait parti aux couleurs de MysterLLC, et la validation aurait quand
// meme renvoye sur academiapro.fr.
const SITES: Record<string, string> = {
  "academiapro.fr": "https://academiapro.fr",
  "www.academiapro.fr": "https://academiapro.fr",
  "mrcomptable.fr": "https://mrcomptable.fr",
  "www.mrcomptable.fr": "https://mrcomptable.fr",
  "mysterllc.com": "https://mysterllc.com",
  "www.mysterllc.com": "https://mysterllc.com",

  // 🚨 MR LMS ET MR CRM AJOUTES LE 04/09, EN MEME TEMPS QUE DANS
  // /api/auth/demander. Les corriger separement deplacerait le defaut sans
  // le supprimer : le courriel partirait aux couleurs de Mr LMS, et la
  // validation renverrait quand meme sur academiapro.fr.
  // ⚠️ AVEC www : ces deux domaines redirigent vers www, et la valeur doit
  // correspondre EXACTEMENT a celle posee par /api/auth/demander.
  "mrlms.fr": "https://www.mrlms.fr",
  "www.mrlms.fr": "https://www.mrlms.fr",
  "mrcrm.fr": "https://www.mrcrm.fr",
  "www.mrcrm.fr": "https://www.mrcrm.fr",
};

// Les seuls domaines vers lesquels on accepte de rediriger. Sans cette
// liste, le parametre marque serait une redirection ouverte.
const SITES_CONNUS = [
  "https://academiapro.fr",
  "https://mrcomptable.fr",
  "https://mysterllc.com",
  // 🆕 04/09. ⚠️ SANS CES DEUX LIGNES, le parametre `marque` pose par
  // /api/auth/demander serait rejete et la validation retomberait sur
  // l en-tete host — donc sur academiapro.fr si le courriel est ouvert
  // depuis un navigateur qui n a pas garde le domaine d origine.
  "https://www.mrlms.fr",
  "https://www.mrcrm.fr",
];

function siteDe(req: Request): string {
  const url = new URL(req.url);

  // 🆕 LE DOMAINE PORTE PAR LE LIEN — 01/09. Il est pose par
  // /api/auth/demander et dit d ou venait la demande. Il prime sur l en-tete
  // host, qui pourrait differer si le courriel est ouvert autrement.
  const demande = String(url.searchParams.get("marque") || "").trim();
  if (demande && SITES_CONNUS.indexOf(demande) >= 0) return demande;

  const hote = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  return SITES[hote] || SITE_PAR_DEFAUT;
}

// L ADMINISTRATEUR N EST PAS UN CLIENT — 21/08. MEME LISTE QUE DANS
// middleware.ts : toute adresse ajoutee ici doit l etre la-bas aussi.
const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function echec(site: string, motif: string) {
  return NextResponse.redirect(site + "/connexion?erreur=" + encodeURIComponent(motif));
}

// Chaque profil entre chez lui.
function accueilDuProfil(email: string, profil: string | null, role: string | null, site: string): string {
  // 🚨 SUR MYSTERLLC, TOUT LE MONDE ENTRE PAR LE PORTEFEUILLE — corrige le 02/09.
  //
  // CE QUI SE PASSAIT, CONSTATE EN TEST REEL : l administrateur atterrissait
  // sur /admin/compliance, l ancienne page « Conformite internationale »
  // d avant le portefeuille, qui reste sur « Chargement... ». Un signataire
  // sans societe tombait dans le cas generique, /dashboard — une page
  // AcadeMIA qui n existe pas sur mysterllc.com : 404. Aucun client ne
  // pouvait donc se connecter a MysterLLC, quel que soit le navigateur.
  //
  // MysterLLC n a qu un seul espace, le portefeuille. C est la porte pour
  // tous, gestionnaire comme client. Le parametre `retour` du lien, quand
  // il existe, reste prioritaire (voir GET plus bas).
  if (site === "https://mysterllc.com") return "/admin/compliance/entites";

  // 🚨 L ADMINISTRATEUR ENTRE PAR LA PORTE OU IL A FRAPPE — corrige le 01/09.
  //
  // LE DEFAUT : l administrateur etait renvoye sur /admin quel que soit le
  // domaine. Se connecter depuis mysterllc.com pour verifier le parcours
  // d un client ramenait donc sur le tableau de bord AcadeMIA — et rendait
  // TOUT TEST EN CONDITIONS REELLES IMPOSSIBLE.
  //
  // ⚠️ CE N EST PAS QU UN CONFORT DE TEST. Le meme code sert les clients :
  // ce qui empeche Jacques de verifier empeche aussi de voir ce qu ils
  // voient.
  if (ADMINS.indexOf(email) >= 0) {
    if (site === "https://mrcomptable.fr") return "/admin/compliance/tableau-de-bord";
    // 🆕 MR LMS ET MR CRM — 04/09. Sans ces deux lignes, Jacques se
    // connectant depuis mrlms.fr atterrissait sur /admin, le tableau de
    // bord AcadeMIA : impossible de verifier ce que voit un client, et
    // impossible de faire une demonstration sur le bon domaine. Meme
    // raison que pour Mr. Comptable juste au-dessus.
    if (site === "https://www.mrlms.fr") return "/organisme";
    if (site === "https://www.mrcrm.fr") return "/admin/linkedin";
    return "/admin";
  }
  if (role === "stagiaire") return "/dashboard";
  if (profil === "cabinet_comptable") return "/admin/compliance/tableau-de-bord";
  if (profil === "vend_formations") return "/organisme";
  if (profil === "forme_salaries") return "/organisme";
  if (profil === "devenir_of") return "/admin/qualiopi";

  // 🚨 SUR MR LMS ET MR CRM, PERSONNE NE TOMBE SUR /dashboard — 04/09.
  //
  // CE QUI SE PASSAIT, CONSTATE EN TEST REEL PAR JACQUES. Une adresse sans
  // profil renseigne — ni cabinet_comptable, ni vend_formations, ni
  // forme_salaries, ni devenir_of — tombait dans le cas generique et
  // atterrissait sur /dashboard. Or cette page est un ecran AcadeMIA : sur
  // mrlms.fr et mrcrm.fr elle N EXISTE PAS. Le client se connectait
  // correctement, la barre de travail s affichait, et le contenu rendait
  // « 404 — This page could not be found ».
  //
  // ⚠️ CE N EST PAS UN CAS DE BORD. Un organisme dont le profil n a pas
  // encore ete renseigne — le plus probable au tout premier client — passe
  // exactement par la. Il se serait connecte pour la premiere fois sur une
  // page introuvable.
  //
  // Chaque domaine a donc sa porte par defaut, et c est la meme que celle
  // de son administrateur plus haut : l espace unique du produit.
  // ⚠️ TOUT NOUVEAU DOMAINE DOIT AVOIR SA LIGNE ICI, sans quoi il
  // reproduira ce defaut. MysterLLC est traite tout en haut de la fonction,
  // avant meme le cas administrateur : sur ce domaine, tout le monde entre
  // par le portefeuille.
  if (site === "https://www.mrlms.fr") return "/organisme";
  if (site === "https://www.mrcrm.fr") return "/admin/linkedin";

  return "/dashboard";
}

// Seuls les chemins RELATIFS sont acceptes : sans ce controle, un lien
// forge serait une redirection ouverte, utile au hameconnage.
function destination(brut: string | null): string | null {
  if (!brut) return null;
  let chemin = brut;
  try {
    chemin = decodeURIComponent(brut);
  } catch (e) {
    return null;
  }
  if (chemin.charAt(0) !== "/") return null;
  if (chemin.indexOf("//") === 0) return null;
  if (chemin.indexOf("\\") >= 0) return null;
  return chemin;
}

// ATTENTION, DEUX PIEGES ICI :
// 1. ne PAS chercher via /auth/v1/admin/users?email= : ce point d entree ne
//    filtre pas et ne renvoie que la premiere page ;
// 2. 🚨 le parametre de la fonction SQL s appelle p_email — verifie dans
//    pg_proc le 23/08 (pg_get_function_identity_arguments : p_email text).
//    L API REST exige le nom exact. Le SQL Editor accepte l appel
//    positionnel sans nom et ne prouve RIEN : c est ce piege qui a fait
//    perdre une heure le 23/08 en faisant croire que le nom etait email.
async function organismeDe(email: string): Promise<{ tenantId: string | null; role: string | null; profil: string | null }> {
  const vide = { tenantId: null, role: null, profil: null };

  try {
    const { data: userId } = await supabase.rpc("utilisateur_par_email", { p_email: email });

    if (userId) {
      const { data: membre } = await supabase
        .from("compliance_membres")
        .select("tenant_id, role, profil")
        .eq("user_id", userId)
        .eq("actif", true)
        .limit(1)
        .maybeSingle();

      if (membre && membre.tenant_id) {
        return {
          tenantId: membre.tenant_id,
          role: membre.role || null,
          profil: membre.profil || null,
        };
      }
    }

    const { data: apprenant } = await supabase
      .from("organisme_apprenants")
      .select("tenant_id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (apprenant && apprenant.tenant_id) {
      return { tenantId: apprenant.tenant_id, role: "stagiaire", profil: null };
    }

    return vide;
  } catch (e) {
    return vide;
  }
}

export async function GET(req: Request) {
  const site = siteDe(req);

  try {
    if (!process.env.SESSION_SECRET) {
      return echec(site, "configuration");
    }

    const url = new URL(req.url);
    const jeton = String(url.searchParams.get("jeton") || "");
    if (!jeton) {
      return echec(site, "lien_incomplet");
    }

    const demande = destination(url.searchParams.get("retour"));

    const { data: ligne, error } = await supabase
      .from("liens_magiques")
      .select("id, email, expire_le, utilise")
      .eq("jeton", jeton)
      .maybeSingle();

    if (error) {
      return echec(site, "technique");
    }
    if (!ligne) {
      return echec(site, "lien_inconnu");
    }
    if (ligne.utilise) {
      return echec(site, "lien_deja_utilise");
    }
    if (new Date(ligne.expire_le).getTime() < Date.now()) {
      return echec(site, "lien_expire");
    }

    const { error: erreurBrulure } = await supabase
      .from("liens_magiques")
      .update({ utilise: true })
      .eq("id", ligne.id)
      .eq("utilise", false);

    if (erreurBrulure) {
      return echec(site, "technique");
    }

    const email = String(ligne.email || "").toLowerCase().trim();
    const organisme = await organismeDe(email);

    // Une destination explicite reste prioritaire ; sinon chacun rentre chez
    // lui — l administrateur compris, sur le domaine d ou il vient.
    const ou = demande || accueilDuProfil(email, organisme.profil, organisme.role, site);

    // 🚨 CHACUN ATTERRIT SUR SON DOMAINE — corrige le 01/09.
    //
    // CE QUI SE PASSAIT : une ligne renvoyait l administrateur sur
    // academiapro.fr quoi qu il arrive. Il ne pouvait donc JAMAIS voir ce
    // que voit un client MysterLLC, ni verifier le parcours avant un
    // rendez-vous.
    //
    // ⚠️ LA REGLE RESTE POUR LES CLIENTS : un cabinet comptable atterrit
    // chez Mr. Comptable meme s il a clique depuis ailleurs, parce que son
    // espace est la-bas et nulle part ailleurs. L administrateur, lui, n a
    // pas d espace unique : il a acces a tous, et doit pouvoir entrer par
    // celui qu il veut.
    let siteFinal = site;
    if (ADMINS.indexOf(email) < 0) {
      if (organisme.profil === "cabinet_comptable") siteFinal = "https://mrcomptable.fr";
    }

    const reponse = NextResponse.redirect(siteFinal + ou);
    reponse.cookies.set({
      name: NOM_COOKIE_SESSION,
      value: fabriquerJetonSession(email, organisme.tenantId, organisme.role),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: DUREE_COOKIE_SECONDES,
    });
    return reponse;
  } catch (e: any) {
    return echec(site, "technique");
  }
}
