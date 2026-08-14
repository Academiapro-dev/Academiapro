import { createClient } from "@supabase/supabase-js";

// Sitemap dynamique : pages publiques + fiches de formation
// + blog en 3 langues. Genere a la demande, mis en cache 1h.
// Chaque nouvelle formation et chaque nouvel article
// apparaissent automatiquement.
//
// Ce sitemap est celui d academiapro.fr. Les articles Mr. Comptable
// relevent de mrcomptable.fr et n ont rien a faire ici.

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

    // LES PAGES VITRINES DES SOLUTIONS METIER.
    //
    // Ce sont elles qui doivent etre trouvees par un professionnel qui
    // cherche « logiciel CRM organisme de formation » ou « LMS pour
    // organisme ». L outil, lui, vit derriere la session et n a rien a
    // faire dans un sitemap : une page que Google ne peut pas atteindre
    // n a aucune raison d y figurer.
    "/pack", "/qualiopi", "/crm", "/plateforme-apprentissage",
  ];

  const entrees: any[] = pagesPubliques.map((p) => ({
    url: SITE + p,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  try {
    const supabase = clientLecture();

    // Fiches de formation : les pages produit du site.
    const { data: formations } = await supabase
      .from("formations")
      .select("code")
      .order("code", { ascending: true });

    for (const f of (formations || [])) {
      if (!f.code) continue;
      entrees.push({
        url: SITE + "/formation/" + f.code,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }

    const { data: articlesFr } = await supabase
      .from("blog")
      .select("slug, created_at")
      .eq("publie", true)
      .eq("marque", "academiapro");

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
