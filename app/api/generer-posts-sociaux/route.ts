import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Genere les posts sociaux (LinkedIn + Facebook) pour le
// dernier article publie qui n en a pas encore.
// Associe une video marketing si les themes correspondent.

export const maxDuration = 300;

const URL_VIDEOS = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
  + "/storage/v1/object/public/videos_marketing/";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

async function genererPosts(titre: string, contenu: string) {
  const annee = new Date().getFullYear();
  const prompt = "Nous sommes en " + annee + ". Toute reference temporelle doit utiliser " + annee + " ou au-dela. N invente JAMAIS de chiffres sur AcademIA Pro (nombre de clients, de transitions accompagnees, etc.) : seul le chiffre de 263 formations est autorise. Tu es le community manager d AcademIA Pro, "
    + "plateforme francaise de formation professionnelle par IA "
    + "(263 formations). Voici un article de blog publie :\n\n"
    + "TITRE : " + titre + "\n\n"
    + contenu.substring(0, 6000)
    + "\n\nGenere DEUX posts pour promouvoir cet article :\n"
    + "1. LINKEDIN : ton professionnel mais humain, accroche forte "
    + "en premiere ligne, 3-5 paragraphes courts, 2-3 hashtags "
    + "pertinents, appel a lire l article sur academiapro.fr\n"
    + "2. FACEBOOK : ton chaleureux et direct, tutoiement, plus "
    + "court, question engageante a la fin, lien academiapro.fr\n\n"
    + "Reponds UNIQUEMENT en JSON valide, sans backticks :\n"
    + '{"linkedin": "...", "facebook": "..."}';

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await r.json();
  let texte = "";
  for (const bloc of data.content || []) {
    if (bloc.type === "text") texte += bloc.text;
  }
  texte = texte.replace(/```json|```/g, "").trim();
  return JSON.parse(texte);
}

function scoreVideo(themes: string, texteArticle: string) {
  let score = 0;
  const mots = themes.split(",").map((m) => m.trim().toLowerCase());
  const texte = texteArticle.toLowerCase();
  for (const mot of mots) {
    if (mot.length > 2 && texte.includes(mot)) score += 1;
  }
  return score;
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

  const { data: articles } = await supabase
    .from("blog")
    .select("id, titre, contenu")
    .eq("publie", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!articles || articles.length === 0) {
    return NextResponse.json({ info: "aucun article publie" });
  }

  let cible = null;
  for (const article of articles) {
    const { count } = await supabase
      .from("posts_sociaux")
      .select("id", { count: "exact", head: true })
      .eq("article_id", article.id);
    if (!count || count === 0) {
      cible = article;
      break;
    }
  }

  if (!cible) {
    return NextResponse.json(
      { info: "tous les articles recents ont deja leurs posts" });
  }

  const posts = await genererPosts(cible.titre, cible.contenu || "");

  const { data: videos } = await supabase
    .from("videos_marketing_index")
    .select("fichier, themes")
    .eq("actif", true);

  let meilleureVideo = null;
  let meilleurScore = 1;
  const texteRef = cible.titre + " " + (cible.contenu || "");
  for (const v of videos || []) {
    const s = scoreVideo(v.themes, texteRef);
    if (s > meilleurScore) {
      meilleurScore = s;
      meilleureVideo = v.fichier;
    }
  }
  const urlMedia = meilleureVideo
    ? URL_VIDEOS + meilleureVideo : null;

  const lignes = [
    {
      article_id: cible.id,
      plateforme: "linkedin",
      contenu: posts.linkedin,
      url_media: urlMedia
    },
    {
      article_id: cible.id,
      plateforme: "facebook",
      contenu: posts.facebook,
      url_media: urlMedia
    }
  ];

  const { error } = await supabase
    .from("posts_sociaux")
    .insert(lignes);

  if (error) {
    return NextResponse.json(
      { erreur: error.message }, { status: 500 });
  }

  return NextResponse.json({
    article: cible.titre,
    video: meilleureVideo || "aucune",
    posts_crees: 2
  });
}
