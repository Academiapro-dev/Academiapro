import { NextRequest } from "next/server";

// robots.txt commun aux deux domaines. Un seul projet Vercel sert
// academiapro.fr et mrcomptable.fr : on lit l en-tete host pour
// declarer le sitemap qui correspond au domaine appele.
//
// Le sitemap comptable vit sous /sitemap-comptable.xml : le middleware
// le reecrit vers /api/sitemap-comptable, un dossier portant un point
// dans son nom n etant pas servi par Next.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  const estComptable = host.indexOf("mrcomptable") >= 0;

  const sitemap = estComptable
    ? "https://mrcomptable.fr/sitemap-comptable.xml"
    : "https://academiapro.fr/sitemap.xml";

  const lignes = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    "",
    "Sitemap: " + sitemap,
    "",
  ];

  return new Response(lignes.join("\n"), {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
