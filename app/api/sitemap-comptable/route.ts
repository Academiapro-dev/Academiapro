import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// LE SITEMAP DE MR. COMPTABLE.
//
// Le sitemap principal ne liste que des adresses academiapro.fr : soumis a
// mrcomptable.fr, il ne lui servirait a rien. Celui-ci ne porte que les
// pages publiques du site comptable, a son propre domaine.
//
// POURQUOI SOUS /api ET SANS EXTENSION. Un dossier nomme
// « sitemap-comptable.xml » porte un point dans son nom : Next.js le traite
// comme un fichier et la route ne repond pas. La route vit donc sous /api,
// et une reecriture explicite l expose sous /sitemap-comptable.xml — c est
// cette adresse-la que Google verra, sur le bon domaine.
//
// LES ADRESSES SONT SANS PREFIXE. Le middleware sert /comptable/inscription
// sous mrcomptable.fr/inscription : declarer les deux formes creerait du
// contenu duplique. On ne declare que la forme visible par le visiteur.
//
// L espace de travail — /admin/compliance — n y figure PAS : il est derriere
// une session, et une page que Google ne peut pas atteindre n a rien a faire
// dans un sitemap.

const PAGES = [
  { chemin: "/", priorite: "1.0" },
  { chemin: "/inscription", priorite: "0.9" },
  { chemin: "/blog", priorite: "0.8" },
  { chemin: "/cgv", priorite: "0.5" },
  { chemin: "/mentions", priorite: "0.5" },
];

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
  const le = new Date().toISOString().slice(0, 10);

  const entrees: string[] = PAGES.map(function (p) {
    return "  <url>\n"
      + "    <loc>https://mrcomptable.fr" + p.chemin + "</loc>\n"
      + "    <lastmod>" + le + "</lastmod>\n"
      + "    <priority>" + p.priorite + "</priority>\n"
      + "  </url>";
  });

  // Les articles du blog Mr. Comptable. Ceux d AcademIA Pro portent une
  // autre marque et n ont rien a faire ici.
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
        + "    <loc>https://mrcomptable.fr/blog/"
        + echapper(a.slug) + "</loc>\n"
        + "    <lastmod>"
        + (a.created_at
            ? new Date(a.created_at).toISOString().slice(0, 10)
            : le)
        + "</lastmod>\n"
        + "    <priority>0.8</priority>\n"
        + "  </url>");
    }
  } catch (e) {
    // En cas de panne base : les pages fixes seulement, jamais d erreur.
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + entrees.join("\n") + "\n"
    + "</urlset>";

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
