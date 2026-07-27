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

    const reponse = NextResponse.redirect(SITE + "/dashboard");
    reponse.cookies.set({
      name: NOM_COOKIE_SESSION,
      value: fabriquerJetonSession(ligne.email),
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
