import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// LE SITEMAP DE MR. COMPTABLE.
//
// Le sitemap principal ne liste que des adresses academiapro.fr : soumis
// tel quel a mrcomptable.fr, il ne lui servirait a rien. Celui-ci ne porte
// que les pages publiques du site comptable, a son propre domaine.
//
// L espace de travail — /admin/compliance — n y figure PAS : il est derriere
// une session, et une page que Google ne peut pas atteindre n a rien a faire
// dans un sitemap.

const PAGES = [
  { chemin: "/", priorite: "1.0" },
  { chemin: "/inscription", priorite: "0.9" },
  { chemin: "/cgv", priorite: "0.5" },
  { chemin: "/mentions", priorite: "0.5" },
];

export async function GET() {
  const le = new Date().toISOString().slice(0, 10);

  const urls = PAGES.map(function (p) {
    return "  <url>\n"
      + "    <loc>https://mrcomptable.fr" + p.chemin + "</loc>\n"
      + "    <lastmod>" + le + "</lastmod>\n"
      + "    <priority>" + p.priorite + "</priority>\n"
      + "  </url>";
  }).join("\n");

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls + "\n"
    + "</urlset>";

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
