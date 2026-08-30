import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Publie sur LinkedIn les posts en attente : statut a_publier,
// plateforme linkedin. La page visee depend de la marque du post.
//
// L IMAGE EST JOINTE SYSTEMATIQUEMENT. Dans un fil LinkedIn, un post sans
// visuel passe inapercu. LinkedIn n accepte pas une adresse d image : il
// faut d abord enregistrer le televersement, deposer les octets, puis
// attacher la reference obtenue. Si cette chaine echoue, on publie en
// texte seul plutot que de perdre le post.
//
// LE JETON. LINKEDIN_TOKEN doit porter la portee w_organization_social
// et l administration des pages visees.

export const maxDuration = 300;

// Les pages entreprise, par marque.
//
// 🆕 HEBREWPRO AJOUTE — 30/08/2026. C est ainsi que fonctionne la
// « signature automatique » que Jacques cherchait : elle n existe pas
// dans LinkedIn, elle est ICI. Toute marque declaree dans ces deux
// tables voit son logo joint a chaque post.
//
// ⚠️ DEUX TABLES A TENIR ENSEMBLE. Une marque presente dans PAGES mais
// absente de LOGOS publierait avec le logo d AcadeMIA — et une marque
// absente des deux publierait SUR LA PAGE D ACADEMIA, ce qui serait
// pire. Ajouter une marque, c est ajouter DEUX lignes.
const PAGES: Record<string, string> = {
  academiapro: "136105744",
  mrcomptable: "137943950",
  hebrewpro: "136175562",
};

// L image jointe par defaut, par marque : le logo. Un post qui ne porte
// aucune image propre prend celle-ci.
//
// ⚠️ L ADRESSE DOIT ETRE PUBLIQUE. LinkedIn ne recoit pas le fichier :
// cette route va le chercher elle-meme a cette adresse, puis en depose
// les octets. Un lien prive ou protege ferait echouer le televersement,
// et le post partirait sans image.
const LOGOS: Record<string, string> = {
  academiapro: "https://academiapro.fr/IMG_4100.jpeg",
  mrcomptable: "https://academiapro.fr/IMG_4158.jpeg",
  hebrewpro: "https://hebrewproai.com/IMG_4626.jpeg",
};

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function jeton() {
  return process.env.LINKEDIN_TOKEN || "";
}

// Etape 1 : demander a LinkedIn ou deposer l image.
// Etape 2 : y deposer les octets.
// Renvoie l URN de l image, ou null si quoi que ce soit echoue.
async function televerserImage(urlImage: string, auteur: string) {
  try {
    const enregistrement = await fetch(
      "https://api.linkedin.com/v2/assets?action=registerUpload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + jeton(),
          "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify({
          registerUploadRequest: {
            owner: auteur,
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            serviceRelationships: [{
              identifier: "urn:li:userGeneratedContent",
              relationshipType: "OWNER"
            }]
          }
        })
      });

    if (!enregistrement.ok) return null;

    const donnees = await enregistrement.json();
    const mecanisme = donnees?.value?.uploadMechanism;
    const cle = "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest";
    const urlDepot = mecanisme?.[cle]?.uploadUrl;
    const urn = donnees?.value?.asset;

    if (!urlDepot || !urn) return null;

    // Recuperer les octets de l image depuis notre propre domaine.
    const image = await fetch(urlImage);
    if (!image.ok) return null;
    const octets = await image.arrayBuffer();

    const depot = await fetch(urlDepot, {
      method: "PUT",
      headers: { "Authorization": "Bearer " + jeton() },
      body: octets
    });

    if (!depot.ok) return null;

    return urn;
  } catch {
    return null;
  }
}

async function publierSurLinkedin(
  contenu: string, marque: string, urlMedia: string | null) {

  const page = PAGES[marque] || PAGES.academiapro;
  const auteur = "urn:li:organization:" + page;

  const image = urlMedia || LOGOS[marque] || LOGOS.academiapro;
  const urnImage = await televerserImage(image, auteur);

  const partage: any = {
    shareCommentary: { text: contenu },
    shareMediaCategory: urnImage ? "IMAGE" : "NONE"
  };

  if (urnImage) {
    partage.media = [{
      status: "READY",
      media: urnImage
    }];
  }

  const corps = {
    author: auteur,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": partage
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
  };

  const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + jeton(),
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

  const idEntete = r.headers.get("x-restli-id");

  return {
    ok: r.status >= 200 && r.status < 300,
    statut: r.status,
    id: (data && data.id) || idEntete || null,
    image: urnImage ? "jointe" : "aucune",
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
    const res = await publierSurLinkedin(
      post.contenu, marque, post.url_media);

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
        image: res.image,
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
