import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Genere les posts sociaux.
//
// DEUX MARQUES, DEUX REGIMES.
//
// academiapro : ALTERNANCE article de blog / formation, sur LinkedIn ET
//   Facebook. C est le fonctionnement historique, inchange.
//
// mrcomptable : articles de blog UNIQUEMENT, sur LinkedIn UNIQUEMENT. Un
//   cabinet d expertise comptable ne cherche pas son logiciel de production
//   sur Facebook. Le logo est joint au post : dans un fil blanc, le visuel
//   bleu marine porte la marque mieux qu une signature en fin de texte.
//
// UN SEUL LIEN PAR POST. Trois liens dans un message dispersent le lecteur
// et les reseaux penalisent la dispersion : on choisit la destination qui
// vend, et on s y tient.
//
// Le nombre de formations n est plus ecrit en dur : il se compte en base.
// Un chiffre faux dans un post public se remarque et ne se rattrape pas.

export const maxDuration = 300;

const URL_VIDEOS = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
  + "/storage/v1/object/public/videos_marketing/";

const SITE = "https://academiapro.fr";

const SITE_COMPTABLE = "https://mrcomptable.fr";

// Le logo Mr. Comptable, bleu marine sur fond blanc. Depose dans public/
// sous son nom d origine, faute de pouvoir le renommer depuis l iPad.
const LOGO_COMPTABLE = SITE + "/IMG_4158.jpeg";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

async function appelIA(prompt: string) {
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

// Les interdictions valent pour les deux types de posts. Elles sont les
// memes que celles de l agent commercial : ni statistique inventee, ni nom
// de client, ni promesse de resultat, ni certification.
function interdictions(annee: number, nbFormations: number) {
  return "Nous sommes en " + annee + ". Toute reference temporelle doit "
    + "utiliser " + annee + " ou au-dela.\n\n"
    + "INTERDICTIONS ABSOLUES :\n"
    + "- Ne jamais inventer de chiffre sur AcademIA Pro : ni nombre de "
    + "clients, ni transitions accompagnees, ni taux de satisfaction, ni "
    + "temoignage. Le SEUL chiffre autorise est " + nbFormations
    + " formations.\n"
    + "- Ne jamais citer de nom de client ni de temoignage.\n"
    + "- Ne jamais promettre un resultat ni une embauche.\n"
    + "- Ne jamais mentionner une certification, un agrement ou un "
    + "financement par le compte personnel de formation.\n"
    + "- N ecrire QU UN SEUL lien, celui qui est fourni.\n\n";
}

// Les interdictions propres a Mr. Comptable. Le sujet est reglementaire :
// une approximation se voit immediatement chez ce public.
function interdictionsComptable(annee: number) {
  return "Nous sommes en " + annee + ". Toute reference temporelle doit "
    + "utiliser " + annee + " ou au-dela.\n\n"
    + "INTERDICTIONS ABSOLUES :\n"
    + "- Ne JAMAIS ecrire que Mr. Comptable est une plateforme agreee : "
    + "c est une solution compatible au sens de la reforme.\n"
    + "- Ne jamais citer le nom d un prestataire, d un partenaire ni d un "
    + "editeur concurrent.\n"
    + "- Ne jamais inventer de chiffre sur Mr. Comptable : ni nombre de "
    + "cabinets, ni nombre de dossiers, ni gain de temps chiffre.\n"
    + "- Ne jamais donner de conseil fiscal ou juridique personnalise.\n"
    + "- N ecrire QU UN SEUL lien, celui qui est fourni.\n\n";
}

async function postsArticle(titre: string, contenu: string, lien: string, annee: number, nb: number) {
  const prompt = interdictions(annee, nb)
    + "Tu es le community manager d AcademIA Pro, plateforme francaise de "
    + "formation professionnelle par intelligence artificielle.\n\n"
    + "Voici un article de blog publie :\n\nTITRE : " + titre + "\n\n"
    + contenu.substring(0, 6000)
    + "\n\nGenere DEUX posts pour donner envie de le lire :\n"
    + "1. LINKEDIN : ton professionnel mais humain, accroche forte en "
    + "premiere ligne, 3 a 5 paragraphes courts, 2 ou 3 hashtags "
    + "pertinents. Termine par le lien " + lien + "\n"
    + "2. FACEBOOK : ton chaleureux et direct, tutoiement, plus court, "
    + "question engageante a la fin. Termine par le lien " + lien + "\n\n"
    + "Reponds UNIQUEMENT en JSON valide, sans backticks :\n"
    + '{"linkedin": "...", "facebook": "..."}';

  return appelIA(prompt);
}

async function postComptable(titre: string, contenu: string, lien: string, annee: number) {
  const prompt = interdictionsComptable(annee)
    + "Tu es le community manager de Mr. Comptable, logiciel de "
    + "comptabilite destine aux cabinets d expertise comptable francais.\n\n"
    + "Ton lecteur est expert-comptable ou collaborateur de cabinet. Il "
    + "connait son metier mieux que toi : tu ne lui expliques pas ce qu est "
    + "un lettrage, tu lui parles de ce qui change et de ce que cela lui "
    + "coute. VOUVOIEMENT, toujours. Aucun emoji.\n\n"
    + "Voici un article de blog publie :\n\nTITRE : " + titre + "\n\n"
    + contenu.substring(0, 6000)
    + "\n\nGenere UN SEUL post LinkedIn pour donner envie de le lire. "
    + "Accroche en premiere ligne sur l obligation ou le probleme concret. "
    + "3 a 5 paragraphes courts. 2 ou 3 hashtags du metier. Termine par le "
    + "lien " + lien + "\n\n"
    + "Reponds UNIQUEMENT en JSON valide, sans backticks :\n"
    + '{"linkedin": "..."}';

  return appelIA(prompt);
}

async function postsFormation(f: any, lien: string, annee: number, nb: number) {
  const prompt = interdictions(annee, nb)
    + "Tu es le community manager d AcademIA Pro, plateforme francaise de "
    + "formation professionnelle par intelligence artificielle.\n\n"
    + "Voici une formation du catalogue :\n\n"
    + "TITRE : " + f.titre + "\n"
    + "DOMAINE : " + (f.domaine || "") + "\n"
    + "DUREE : " + (f.duree || "") + "\n"
    + "OBJECTIFS : " + (f.objectifs || "") + "\n"
    + "PUBLIC : " + (f.public_cible || "") + "\n"
    + "DESCRIPTION : " + (f.description || "") + "\n\n"
    + "Genere DEUX posts qui donnent envie de suivre cette formation. "
    + "Parle de ce que la personne saura FAIRE a la fin, pas du programme. "
    + "N annonce pas le prix : la page s en charge.\n"
    + "1. LINKEDIN : ton professionnel, accroche sur un probleme concret du "
    + "metier, 3 a 4 paragraphes courts, 2 ou 3 hashtags. Termine par le "
    + "lien " + lien + "\n"
    + "2. FACEBOOK : ton chaleureux, tutoiement, court, une question a la "
    + "fin. Termine par le lien " + lien + "\n\n"
    + "Reponds UNIQUEMENT en JSON valide, sans backticks :\n"
    + '{"linkedin": "...", "facebook": "..."}';

  return appelIA(prompt);
}

function scoreVideo(themes: string, texteArticle: string) {
  let score = 0;
  const mots = String(themes || "").split(",").map((m) => m.trim().toLowerCase());
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
  const annee = new Date().getFullYear();

  const marque = req.nextUrl.searchParams.get("marque") === "mrcomptable"
    ? "mrcomptable" : "academiapro";

  // ------------------------------------------------------------------
  // BRANCHE MR. COMPTABLE : article de blog, LinkedIn seul, logo joint.
  // ------------------------------------------------------------------
  if (marque === "mrcomptable") {
    const { data: articles } = await supabase
      .from("blog")
      .select("id, titre, contenu")
      .eq("publie", true)
      .eq("marque", "mrcomptable")
      .order("created_at", { ascending: false })
      .limit(20);

    let cible: any = null;
    for (const article of articles || []) {
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
      return NextResponse.json({ info: "aucun article comptable a promouvoir" });
    }

    const posts = await postComptable(
      cible.titre, cible.contenu || "",
      SITE_COMPTABLE + "/blog", annee);

    if (!posts || !posts.linkedin) {
      return NextResponse.json({ info: "rien a publier" });
    }

    const { error } = await supabase
      .from("posts_sociaux")
      .insert([{
        article_id: cible.id,
        formation_code: null,
        plateforme: "linkedin",
        statut: "a_publier",
        contenu: posts.linkedin,
        url_media: LOGO_COMPTABLE,
        marque: "mrcomptable"
      }]);

    if (error) {
      return NextResponse.json(
        { erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      marque: "mrcomptable",
      type: "article",
      sujet: cible.titre,
      posts_crees: 1
    });
  }

  // ------------------------------------------------------------------
  // BRANCHE ACADEMIA PRO : alternance article / formation, deux reseaux.
  // ------------------------------------------------------------------

  // Le catalogue se compte, il ne se recopie pas.
  const { count: nbFormations } = await supabase
    .from("formations")
    .select("code", { count: "exact", head: true })
    .eq("actif", true);

  const nb = nbFormations || 0;

  // ALTERNANCE. On regarde ce qui a ete publie en dernier : si c etait un
  // article, on prend une formation, et reciproquement. Le parametre
  // type= force le choix.
  const force = req.nextUrl.searchParams.get("type");

  let type = force === "formation" ? "formation" : force === "article" ? "article" : "";

  if (!type) {
    const { data: dernier } = await supabase
      .from("posts_sociaux")
      .select("formation_code")
      .eq("marque", "academiapro")
      .order("cree_le", { ascending: false })
      .limit(1);

    const dernierEtaitFormation = dernier && dernier[0] && dernier[0].formation_code;
    type = dernierEtaitFormation ? "article" : "formation";
  }

  let posts: any = null;
  let urlMedia: string | null = null;
  let articleId: string | null = null;
  let formationCode: string | null = null;
  let sujet = "";

  if (type === "article") {
    const { data: articles } = await supabase
      .from("blog")
      .select("id, titre, contenu")
      .eq("publie", true)
      .eq("marque", "academiapro")
      .order("created_at", { ascending: false })
      .limit(10);

    let cible: any = null;
    for (const article of articles || []) {
      const { count } = await supabase
        .from("posts_sociaux")
        .select("id", { count: "exact", head: true })
        .eq("article_id", article.id);
      if (!count || count === 0) {
        cible = article;
        break;
      }
    }

    // Aucun article disponible : on bascule sur une formation plutot que
    // de ne rien publier.
    if (!cible) {
      type = "formation";
    } else {
      articleId = cible.id;
      sujet = cible.titre;
      posts = await postsArticle(cible.titre, cible.contenu || "", SITE + "/blog", annee, nb);

      const { data: videos } = await supabase
        .from("videos_marketing_index")
        .select("fichier, themes")
        .eq("actif", true);

      let meilleure = null;
      let meilleurScore = 1;
      const texteRef = cible.titre + " " + (cible.contenu || "");
      for (const v of videos || []) {
        const s = scoreVideo(v.themes, texteRef);
        if (s > meilleurScore) {
          meilleurScore = s;
          meilleure = v.fichier;
        }
      }
      if (meilleure) urlMedia = URL_VIDEOS + meilleure;
    }
  }

  if (type === "formation") {
    // Celle qui n a pas encore ete promue, ou la plus anciennement promue.
    const { data: dejaFaites } = await supabase
      .from("posts_sociaux")
      .select("formation_code")
      .not("formation_code", "is", null)
      .limit(2000);

    const promues: string[] = [];
    for (const p of dejaFaites || []) {
      if (p.formation_code && promues.indexOf(p.formation_code) < 0) {
        promues.push(p.formation_code);
      }
    }

    const { data: formations } = await supabase
      .from("formations")
      .select("code, titre, domaine, duree, prix, objectifs, public_cible, description")
      .eq("actif", true)
      .order("code", { ascending: true })
      .limit(1000);

    const jamais = (formations || []).filter(function (f: any) {
      return promues.indexOf(f.code) < 0;
    });

    // Toutes promues : on repart du debut.
    const pool = jamais.length > 0 ? jamais : (formations || []);

    if (pool.length === 0) {
      return NextResponse.json({ info: "aucune formation active" });
    }

    const cible = pool[Math.floor(Math.random() * pool.length)];
    formationCode = cible.code;
    sujet = cible.titre;

    posts = await postsFormation(cible, SITE + "/formation/" + cible.code, annee, nb);
  }

  if (!posts) {
    return NextResponse.json({ info: "rien a publier" });
  }

  const lignes = [
    {
      article_id: articleId,
      formation_code: formationCode,
      plateforme: "linkedin",
      statut: "a_publier",
      contenu: posts.linkedin,
      url_media: urlMedia,
      marque: "academiapro"
    },
    {
      article_id: articleId,
      formation_code: formationCode,
      plateforme: "facebook",
      statut: "a_publier",
      contenu: posts.facebook,
      url_media: urlMedia,
      marque: "academiapro"
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
    marque: "academiapro",
    type: type,
    sujet: sujet,
    formations_au_catalogue: nb,
    video: urlMedia ? "associee" : "aucune",
    posts_crees: lignes.length
  });
}
