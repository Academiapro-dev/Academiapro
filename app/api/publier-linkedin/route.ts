import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Publie sur LinkedIn les posts en attente : statut a_publier,
// plateforme linkedin. La page visee depend de la marque du post.
//
// POURQUOI CETTE ROUTE EXISTE. La publication passait par Make, qui a
// cesse de fonctionner sans erreur lisible. Ici tout est visible : la
// requete, la reponse, le statut ecrit.
//
// LE JETON. LINKEDIN_TOKEN doit porter la portee w_organization_social
// et l administration des deux pages.

export const maxDuration = 300;

// Les pages entreprise, par marque.
const PAGES: Record<string, string> = {
  academiapro: "136105744",
  mrcomptable: "137943950",
};

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

async function publierSurLinkedin(contenu: string, marque: string) {
  const token = process.env.LINKEDIN_TOKEN || "";
  const page = PAGES[marque] || PAGES.academiapro;
  const auteur = "urn:li:organization:" + page;

  const corps = {
    author: auteur,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: contenu },
        shareMediaCategory: "NONE"
      }
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
  };

  const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
      "X-Restli-Protocol-Version": "2.0.0"
    },
    body: JSON.stringify(corps)
  });

  const texte = await r.text();
  let data: any = null;
  try {
    data = texte ? JSON.parse(texte) : null;
  } catch {
    data = { brut: texte };
  }

  // LinkedIn renvoie l identifiant du post dans l en-tete, pas toujours
  // dans le corps.
  const idEntete = r.headers.get("x-restli-id");

  return {
    ok: r.status >= 200 && r.status < 300,
    statut: r.status,
    id: (data && data.id) || idEntete || null,
    reponse: data
  };
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }

  if (!process.env.LINKEDIN_TOKEN) {
    return NextResponse.json(
      { erreur: "LINKEDIN_TOKEN absent" }, { status: 500 });
  }

  const supabase = clientAdmin();

  // marque= restreint la publication a une seule marque. Sans ce
  // parametre, les deux sont traitees.
  const marqueDemandee = req.nextUrl.searchParams.get("marque");

  let requete = supabase
    .from("posts_sociaux")
    .select("id, contenu, url_media, marque")
    .eq("plateforme", "linkedin")
    .eq("statut", "a_publier");

  if (marqueDemandee) {
    requete = requete.eq("marque", marqueDemandee);
  }

  const { data: posts, error: errLecture } = await requete
    .order("cree_le", { ascending: true })
    .limit(3);

  if (errLecture) {
    return NextResponse.json(
      { erreur: errLecture.message }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ info: "aucun post a publier" });
  }

  const resultats = [];
  for (const post of posts) {
    const marque = post.marque || "academiapro";
    const res = await publierSurLinkedin(post.contenu, marque);

    if (res.ok) {
      await supabase
        .from("posts_sociaux")
        .update({
          statut: "publie",
          publie_le: new Date().toISOString()
        })
        .eq("id", post.id);
      resultats.push({
        post: post.id,
        marque: marque,
        linkedin_id: res.id
      });
    } else {
      resultats.push({
        post: post.id,
        marque: marque,
        statut_http: res.statut,
        erreur: res.reponse
      });
    }
  }

  return NextResponse.json({ publies: resultats });
}
