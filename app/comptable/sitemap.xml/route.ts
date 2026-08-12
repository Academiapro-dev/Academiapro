import { createClient } from "@supabase/supabase-js";

// Sitemap de mrcomptable.fr. Next ne sert qu un seul app/sitemap.ts par
// projet, et il est pris par academiapro.fr : celui-ci est donc servi par
// une route dediee. Il ne declare QUE la marque mrcomptable.

export const revalidate = 3600;

const SITE = "https://mrcomptable.fr";

function clientLecture() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
}

function echapper(texte: string) {
  return String(texte || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET() {
  const pages = [
    { chemin: "/comptable", priorite: "1.0" },
    { chemin: "/comptable/blog", priorite: "0.8" },
    { chemin: "/comptable/inscription", priorite: "0.9" },
    { chemin: "/comptable/cgv", priorite: "0.4" },
    { chemin: "/comptable/mentions", priorite: "0.4" },
  ];

  const entrees: string[] = [];

  for (const p of pages) {
    entrees.push(
      "  <url>\n"
      + "    <loc>" + SITE + p.chemin + "</loc>\n"
      + "    <changefreq>weekly</changefreq>\n"
      + "    <priority>" + p.priorite + "</priority>\n"
      + "  </url>");
  }

  try {
    const supabase = clientLecture();
    const { data: articles } = await supabase
      .from("blog")
      .select("slug, created_at")
      .eq("publie", true)
      .eq("marque", "mrcomptable");

    for (const a of (articles || [])) {
      if (!a.slug) continue;
      entrees.push(
        "  <url>\n"
        + "    <loc>" + SITE + "/comptable/blog/"
        + echapper(a.slug) + "</loc>\n"
        + (a.created_at
            ? "    <lastmod>"
              + new Date(a.created_at).toISOString() + "</lastmod>\n"
            : "")
        + "    <changefreq>monthly</changefreq>\n"
        + "    <priority>0.8</priority>\n"
        + "  </url>");
    }
  } catch (e) {
    // En cas de panne base : sitemap des pages fixes seulement,
    // jamais d erreur.
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + entrees.join("\n") + "\n"
    + "</urlset>";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
