import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// ══════════════════════════════════════════════════════════════════════════
// UN SITEMAP PAR DOMAINE — CORRIGE LE 03/09.
//
// 🚨 LE DEFAUT, CONSTATE DANS SEARCH CONSOLE. Ce fichier etait ecrit en dur
// sur academiapro.fr : `const SITE = "https://academiapro.fr"`. Or les trois
// marques partagent le meme depot, donc le meme sitemap.
//
// Consequence : https://www.mysterllc.com/sitemap.xml servait les 560 fiches
// de formation et tout le blog d AcadémIA Pro, et PAS UNE SEULE page
// MysterLLC. Google repondait « aucun sitemap referent detecte » sur les
// pages du domaine, et aurait ignore en bloc un sitemap ne contenant que des
// adresses hors domaine.
//
// LE DOMAINE EST DESORMAIS LU DANS L EN-TETE `host`, comme dans le layout.
// Chaque marque declare ses propres pages, et seulement les siennes.
//
// ⚠️ CE FICHIER DEVIENT DYNAMIQUE. `headers()` empeche la generation au
// build ; le cache d une heure est conserve par `revalidate`.
//
// ⚠️ NE JAMAIS DECLARER UNE PAGE DONT ON N EST PAS SUR QU ELLE EXISTE. Une
// adresse morte dans un sitemap se traduit par une erreur d exploration
// dans Search Console, ce qui est pire que de ne rien declarer.
// ══════════════════════════════════════════════════════════════════════════

export const revalidate = 3600;
export const dynamic = "force-dynamic";

function clientLecture() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
}

// LES PAGES VITRINES DES SOLUTIONS METIER figurent dans la liste AcadémIA.
//
// Ce sont elles qui doivent etre trouvees par un professionnel qui cherche
// « logiciel CRM organisme de formation » ou « LMS pour organisme ».
// L outil, lui, vit derriere la session et n a rien a faire dans un
// sitemap : une page que Google ne peut pas atteindre n a aucune raison
// d y figurer.
const PAGES_ACADEMIA = [
  "", "/a-propos", "/formations", "/catalogue", "/tarifs",
  "/packs", "/skills", "/starter-pack", "/abonnements",
  "/seances", "/communaute", "/b2b", "/affiliation",
  "/essai-gratuit", "/lead-magnets/ebook",
  "/lead-magnets/mini-cours", "/lead-magnets/webinaire",
  "/contact", "/garantie", "/financement", "/faq",
  "/inscription", "/login", "/blog", "/en/blog",
  "/es/blog", "/cgv", "/mentions-legales",
  "/politique-confidentialite", "/politique-cookies",
  "/pack", "/qualiopi", "/crm", "/plateforme-apprentissage",
];

// LES PAGES PUBLIQUES DE mrcomptable.fr.
//
// Liste reprise A L IDENTIQUE de PAGES_PUBLIQUES_COMPTABLE dans
// components/NavBar.tsx : ce sont exactement les chemins que le middleware
// sert sous ce domaine, donc les seuls dont l existence est certaine.
// ⚠️ TOUTE PAGE AJOUTEE LA-BAS DOIT L ETRE ICI.
const PAGES_MRCOMPTABLE = [
  "", "/inscription", "/facture-electronique",
  "/rapprochement-bancaire", "/lecture-des-pieces", "/tenue",
  "/declarations", "/relance-justificatifs", "/blog",
  "/contact", "/cgv", "/mentions",
];

// LES PAGES PUBLIQUES DE mrlms.fr.
//
// 🚨 UNE SEULE PAGE AUJOURD HUI : la vitrine. Les ecrans du produit vivent
// sous /organisme, derriere la session — une page que Google ne peut pas
// atteindre n a aucune raison d etre declaree, et la declarer produirait
// des erreurs d exploration dans la Search Console.
//
// ⚠️ A COMPLETER quand les autres pages publiques existeront (mentions,
// CGV, contact, blog). Ne pas les inscrire avant qu elles soient creees :
// une adresse morte dans un sitemap vaut moins que pas d adresse du tout.
const PAGES_MRLMS = [
  "",
];

// LES PAGES PUBLIQUES DE mrcrm.fr.
//
// 🚨 UNE SEULE PAGE : la vitrine. Le formulaire de devis /devis N EST PAS
// DECLARE, et ne doit pas l etre : il affiche des prix et n a de sens
// qu avec un jeton. Meme regle que pour Mr LMS.
const PAGES_MRCRM = [
  "",
];

// LES PAGES PUBLIQUES DE mysterllc.com.
//
// 🚨 LISTE VOLONTAIREMENT COURTE. Seules figurent ici les pages dont
// l existence est verifiee : la vitrine servie a la racine du domaine et la
// liste du blog. Les articles sont ajoutes depuis la base, plus bas.
//
// ⚠️ A COMPLETER : les autres pages publiques de MysterLLC (mentions, CGV,
// contact, pages d Etat a venir) doivent etre ajoutees ICI au fur et a
// mesure de leur creation. Ne pas les inscrire avant qu elles existent.
const PAGES_MYSTERLLC = [
  "", "/blog",
];

// La marque, l adresse publique et les pages de chaque domaine.
// `marqueBlog` est la valeur de la colonne `marque` dans la table `blog`.
const MARQUES: any = {
  mrcrm: {
    site: "https://mrcrm.fr",
    pages: PAGES_MRCRM,
    marqueBlog: "mrcrm",
    formations: false,
    traductions: false,
  },
  mrlms: {
    site: "https://mrlms.fr",
    pages: PAGES_MRLMS,
    // ⚠️ AUCUN ARTICLE SOUS CETTE MARQUE AUJOURD HUI. La valeur est prete :
    // le jour ou un article Mr LMS est publie avec `marque = 'mrlms'`, il
    // apparaitra ici sans autre modification.
    marqueBlog: "mrlms",
    formations: false,
    traductions: false,
  },
  mysterllc: {
    site: "https://www.mysterllc.com",
    pages: PAGES_MYSTERLLC,
    marqueBlog: "mysterllc",
    formations: false,
    traductions: false,
  },
  mrcomptable: {
    site: "https://mrcomptable.fr",
    pages: PAGES_MRCOMPTABLE,
    marqueBlog: "mrcomptable",
    formations: false,
    traductions: false,
  },
  academia: {
    site: "https://academiapro.fr",
    pages: PAGES_ACADEMIA,
    marqueBlog: "academiapro",
    formations: true,
    traductions: true,
  },
};

async function marqueDemandee() {
  try {
    const entetes = await headers();
    const hote = (entetes.get("host") || "").toLowerCase();
    if (hote.indexOf("mysterllc.com") >= 0) return MARQUES.mysterllc;
    if (hote.indexOf("mrcomptable.fr") >= 0) return MARQUES.mrcomptable;
    if (hote.indexOf("mrlms.fr") >= 0) return MARQUES.mrlms;
    if (hote.indexOf("mrcrm.fr") >= 0) return MARQUES.mrcrm;
  } catch (e) {
    // Hote illisible : on retombe sur AcadémIA Pro, le domaine principal.
  }
  return MARQUES.academia;
}

export default async function sitemap() {
  const m = await marqueDemandee();

  const entrees: any[] = m.pages.map((p: string) => ({
    url: m.site + p,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  try {
    const supabase = clientLecture();

    // Fiches de formation : les pages produit d AcadémIA Pro uniquement.
    // Elles n existent sous aucun autre domaine.
    if (m.formations) {
      const { data: formations } = await supabase
        .from("formations")
        .select("code")
        .eq("actif", true)
        .eq("type_objet", "formation")
        .order("code", { ascending: true });

      for (const f of (formations || [])) {
        if (!f.code) continue;
        entrees.push({
          url: m.site + "/formation/" + f.code,
          changeFrequency: "weekly",
          priority: 0.9,
        });
      }
    }

    // LE BLOG EST FILTRE PAR MARQUE. Les articles Mr. Comptable relevent de
    // mrcomptable.fr, ceux de MysterLLC de mysterllc.com : melanger les
    // marques etait deja proscrit, ce filtre le rend impossible.
    const { data: articles } = await supabase
      .from("blog")
      .select("slug, created_at")
      .eq("publie", true)
      .eq("marque", m.marqueBlog);

    for (const a of (articles || [])) {
      if (!a.slug) continue;
      entrees.push({
        url: m.site + "/blog/" + a.slug,
        lastModified: a.created_at,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }

    // Les traductions n existent que pour AcadémIA Pro, sous /en et /es.
    if (m.traductions) {
      const { data: traductions } = await supabase
        .from("blog_traductions")
        .select("slug, langue, article_id, cree_le");

      for (const t of (traductions || [])) {
        if (!t.slug) continue;
        const prefixe = t.langue === "en" ? "/en" : "/es";
        entrees.push({
          url: m.site + prefixe + "/blog/" + t.slug,
          lastModified: t.cree_le,
          changeFrequency: "monthly",
          priority: 0.8,
        });
      }
    }
  } catch (e) {
    // En cas de panne base : sitemap des pages publiques seulement,
    // jamais d erreur.
  }

  return entrees;
}
