import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fabriquerJetonSession, NOM_COOKIE_SESSION, DUREE_COOKIE_SECONDES } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🚨 LA CONNEXION RESTE SUR LE DOMAINE OU ELLE S EST FAITE — 23/08.
//
// LE DEFAUT. SITE valait "https://academiapro.fr" en dur : apres validation
// du lien, un cabinet arrive par mrcomptable.fr etait renvoye vers
// academiapro.fr/admin/compliance/..., et toute sa visite se passait sur le
// domaine d un autre produit. Meme chose pour les messages d erreur, qui
// ramenaient sur academiapro.fr/connexion.
//
// LA REGLE. Le domaine se lit dans l en-tete host. Connu : on y reste.
// Inconnu (previsualisation Vercel, localhost) : academiapro.fr, comme avant.
// Le cookie n a volontairement AUCUN attribut domain : il vaut pour le
// domaine qui sert cette route, et c est exactement ce qu on veut.
const SITE_PAR_DEFAUT = "https://academiapro.fr";

const SITES: Record<string, string> = {
  "academiapro.fr": "https://academiapro.fr",
  "www.academiapro.fr": "https://academiapro.fr",
  "mrcomptable.fr": "https://mrcomptable.fr",
  "www.mrcomptable.fr": "https://mrcomptable.fr",
};

function siteDe(req: Request): string {
  const hote = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  return SITES[hote] || SITE_PAR_DEFAUT;
}

// L ADMINISTRATEUR N EST PAS UN CLIENT — 21/08.
//
// LE DEFAUT. Jacques teste tous les produits de la maison : son compte
// figure dans compliance_membres avec un profil de cabinet comptable,
// laisse la par un essai. A chaque connexion, accueilDuProfil le prenait
// donc pour un client de Mr. Comptable et le deposait sur le tableau de
// bord comptable au lieu de l administration.
//
// La correction ne touche a rien d autre : le profil reste en base, les
// essais continuent de fonctionner, seule la porte d entree change.
//
// MEME LISTE QUE DANS middleware.ts. Si une adresse est ajoutee ici, elle
// doit l etre la-bas aussi, sans quoi elle arriverait sur une page a
// laquelle le middleware lui refuserait l acces.
const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function echec(site: string, motif: string) {
  return NextResponse.redirect(site + "/connexion?erreur=" + encodeURIComponent(motif));
}

// Chaque profil entre chez lui. Un cabinet comptable doit arriver sur ses
// DOSSIERS, pas sur le volet de conformite americaine.
function accueilDuProfil(email: string, profil: string | null, role: string | null): string {
  if (ADMINS.indexOf(email) >= 0) return "/admin";
  if (role === "stagiaire") return "/dashboard";
  if (profil === "cabinet_comptable") return "/admin/compliance/tableau-de-bord";
  if (profil === "vend_formations") return "/organisme";
  if (profil === "forme_salaries") return "/organisme";
  if (profil === "devenir_of") return "/admin/qualiopi";
  return "/dashboard";
}

// Seuls les chemins RELATIFS sont acceptes. Sans ce controle, un lien forge
// pourrait renvoyer le signataire vers un site etranger apres l avoir connecte :
// c est une redirection ouverte, et cela sert au hameconnage.
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
// 2. le parametre de la fonction SQL s appelle p_email, pas email. Un mauvais
//    nom fait echouer l appel EN SILENCE.
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

    // Une destination explicite reste prioritaire ; sinon chacun rentre chez lui.
    const ou = demande || accueilDuProfil(email, organisme.profil, organisme.role);

    const reponse = NextResponse.redirect(site + ou);
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
