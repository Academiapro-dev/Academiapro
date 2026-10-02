import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Publie sur la Page Facebook les posts en attente
// (statut a_publier, plateforme facebook) avec leur video.

// 🆕 02/10 — voir « AUCUNE LECTURE GARDEE EN CACHE » plus bas.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const maxDuration = 300;

const PAGE_ID_ACADEMIA = "1159563177248523";

// 🚨🆕 02/10 — AUCUNE LECTURE GARDEE EN CACHE. Le cache de Next.js garde
// les reponses des lectures `fetch` d une route : le 01/10, la route
// trouver-sites recevait a chaque passage la meme liste que le premier
// (« Using cache » dans les journaux de Vercel). Ici, une liste gardee en
// memoire ferait travailler cette tache sur l etat d un passage precedent.
function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      global: {
        fetch: function (url: any, options: any) {
          return fetch(url, { ...(options || {}), cache: "no-store" });
        },
      },
    });
}

async function publierSurFacebook(
  contenu: string, urlMedia: string | null) {
  const token = process.env.FB_PAGE_TOKEN_ACADEMIA || "";
  const base = "https://graph.facebook.com/v25.0/";

  const corps: Record<string, string> = {
    message: contenu,
    access_token: token
  };
  if (urlMedia) {
    corps.link = urlMedia;
  }
  const r = await fetch(base + PAGE_ID_ACADEMIA + "/feed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps)
  });
  return r.json();
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }

  const supabase = clientAdmin();

  const { data: posts } = await supabase
    .from("posts_sociaux")
    .select("id, contenu, url_media")
    .eq("plateforme", "facebook")
    .eq("statut", "a_publier")
    .order("cree_le", { ascending: true })
    .limit(3);

  if (!posts || posts.length === 0) {
    return NextResponse.json({ info: "aucun post a publier" });
  }

  const resultats = [];
  for (const post of posts) {
    const res = await publierSurFacebook(
      post.contenu, post.url_media);
    if (res.id) {
      await supabase
        .from("posts_sociaux")
        .update({
          statut: "publie",
          publie_le: new Date().toISOString()
        })
        .eq("id", post.id);
      resultats.push({ post: post.id, facebook_id: res.id });
    } else {
      resultats.push({ post: post.id, erreur: res });
    }
  }

  return NextResponse.json({ publies: resultats });
}
