import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fabriquerJetonSession, NOM_COOKIE_SESSION, DUREE_COOKIE_SECONDES } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://academiapro.fr";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function echec(motif: string) {
  return NextResponse.redirect(SITE + "/connexion?erreur=" + encodeURIComponent(motif));
}

// Chaque profil entre chez lui. Un cabinet comptable qui atterrit sur
// l espace apprenant referme la page.
function accueilDuProfil(profil: string | null, role: string | null): string {
  if (role === "stagiaire") return "/dashboard";
  if (profil === "cabinet_comptable") return "/admin/compliance";
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

// ATTENTION : ne PAS chercher l utilisateur via /auth/v1/admin/users?email=,
// ce point d entree ne filtre pas et ne renvoie que la premiere page. Les
// comptes recents y sont invisibles. La fonction SQL, elle, resout l adresse.
async function organismeDe(email: string): Promise<{ tenantId: string | null; role: string | null; profil: string | null }> {
  const vide = { tenantId: null, role: null, profil: null };

  try {
    const { data: userId } = await supabase.rpc("utilisateur_par_email", { email });

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
  try {
    if (!process.env.SESSION_SECRET) {
      return echec("configuration");
    }

    const url = new URL(req.url);
    const jeton = String(url.searchParams.get("jeton") || "");
    if (!jeton) {
      return echec("lien_incomplet");
    }

    const demande = destination(url.searchParams.get("retour"));

    const { data: ligne, error } = await supabase
      .from("liens_magiques")
      .select("id, email, expire_le, utilise")
      .eq("jeton", jeton)
      .maybeSingle();

    if (error) {
      return echec("technique");
    }
    if (!ligne) {
      return echec("lien_inconnu");
    }
    if (ligne.utilise) {
      return echec("lien_deja_utilise");
    }
    if (new Date(ligne.expire_le).getTime() < Date.now()) {
      return echec("lien_expire");
    }

    const { error: erreurBrulure } = await supabase
      .from("liens_magiques")
      .update({ utilise: true })
      .eq("id", ligne.id)
      .eq("utilise", false);

    if (erreurBrulure) {
      return echec("technique");
    }

    const email = String(ligne.email || "").toLowerCase().trim();
    const organisme = await organismeDe(email);

    // Une destination explicite reste prioritaire ; sinon chacun rentre chez lui.
    const ou = demande || accueilDuProfil(organisme.profil, organisme.role);

    const reponse = NextResponse.redirect(SITE + ou);
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
    return echec("technique");
  }
}
