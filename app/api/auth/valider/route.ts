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

// Recherche l organisme rattache a cet email, en deux temps : le PERSONNEL
// de l organisme, puis SES STAGIAIRES. Silencieuse par choix : UN LIEN MAGIQUE
// NE DOIT JAMAIS ECHOUER parce qu un utilisateur n a pas d organisme.
async function organismeDe(email: string): Promise<{ tenantId: string | null; role: string | null }> {
  const vide = { tenantId: null, role: null };

  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const cle = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!base || !cle) return vide;

    // 1. Le personnel de l organisme, retrouve par son identifiant de compte.
    const r = await fetch(base + "/auth/v1/admin/users?email=" + encodeURIComponent(email), {
      headers: { apikey: cle, Authorization: "Bearer " + cle },
      cache: "no-store",
    });

    if (r.ok) {
      const data = await r.json();
      const liste = Array.isArray(data) ? data : (data.users || []);
      const utilisateur = liste.find(function (u: any) {
        return String(u.email || "").toLowerCase() === email;
      });

      if (utilisateur && utilisateur.id) {
        const { data: membre } = await supabase
          .from("compliance_membres")
          .select("tenant_id, role")
          .eq("user_id", utilisateur.id)
          .eq("actif", true)
          .limit(1)
          .maybeSingle();

        if (membre && membre.tenant_id) {
          return { tenantId: membre.tenant_id, role: membre.role || null };
        }
      }
    }

    // 2. Les stagiaires de l organisme, retrouves par leur email.
    const { data: apprenant } = await supabase
      .from("organisme_apprenants")
      .select("tenant_id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (apprenant && apprenant.tenant_id) {
      return { tenantId: apprenant.tenant_id, role: "stagiaire" };
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

    const reponse = NextResponse.redirect(SITE + "/dashboard");
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
