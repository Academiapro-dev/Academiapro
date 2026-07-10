import { createClient } from "@supabase/supabase-js";

// Sitemap dynamique : pages publiques + blog en 3 langues.
// Genere a la demande, mis en cache 1h. Chaque nouvel
// article (y compris du futur redacteur automatique)
// apparait automatiquement.

export const revalidate = 3600;

const SITE = "https://academiapro.fr";

function clientLecture() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
}

export default async function sitemap() {
  const pagesPubliques = [
    "", "/a-propos", "/formations", "/catalogue", "/tarifs",
    "/packs", "/skills", "/starter-pack", "/abonnements",
    "/seances", "/communaute", "/b2b", "/affiliation",
    "/essai-gratuit", "/lead-magnets/ebook",
    "/lead-magnets/mini-cours", "/lead-magnets/webinaire",
    "/contact", "/garantie", "/financement", "/faq",
    "/inscription", "/login", "/blog", "/en/blog",
    "/es/blog", "/cgv", "/mentions-legales",
    "/politique-confidentialite", "/politique-cookies",
  ];

  const entrees: any[] = pagesPubliques.map((p) => ({
    url: SITE + p,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  try {
    const supabase = clientLecture();

    const { data: articlesFr } = await supabase
      .from("blog")
      .select("slug, created_at")
      .eq("publie", true);

    const { data: traductions } = await supabase
      .from("blog_traductions")
      .select("slug, langue, article_id, cree_le");

    for (const a of (articlesFr || [])) {
      entrees.push({
        url: SITE + "/blog/" + a.slug,
        lastModified: a.created_at,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }

    for (const t of (traductions || [])) {
      const prefixe = t.langue === "en" ? "/en" : "/es";
      entrees.push({
        url: SITE + prefixe + "/blog/" + t.slug,
        lastModified: t.cree_le,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch (e) {
    // En cas de panne base : sitemap des pages publiques
    // seulement, jamais d erreur.
  }

  return entrees;
}
