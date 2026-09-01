import { NextRequest } from "next/server";

// robots.txt commun aux trois domaines. Un seul projet Vercel sert
// academiapro.fr, mrcomptable.fr et mysterllc.com : on lit l en-tete host
// pour declarer le sitemap qui correspond au domaine appele.
//
// Le sitemap comptable vit sous /sitemap-comptable.xml : le middleware
// le reecrit vers /api/sitemap-comptable, un dossier portant un point
// dans son nom n etant pas servi par Next.
//
// 🚨 MYSTERLLC AJOUTE LE 01/09, ET SON ABSENCE AURAIT ETE COUTEUSE.
//
// CE QUI SE SERAIT PASSE SANS CETTE LIGNE : mysterllc.com/robots.txt aurait
// declare le sitemap d ACADEMIAPRO. Google aurait suivi ce sitemap depuis
// le domaine MysterLLC et decouvert des dizaines de pages de formation —
// catalogue, seances, Qualiopi — sur un site cense parler de conformite de
// societes americaines.
//
// ⚠️ CE N EST PAS QU UN DEFAUT DE REFERENCEMENT. Un gestionnaire de LLC qui
// aurait cherche « Form 5472 » et serait tombe sur une page de formation
// hebergee sous mysterllc.com aurait doute de tout le reste. Le
// cloisonnement des marques vaut aussi pour ce que voit Google.
//
// ⚠️ TOUT NOUVEAU DOMAINE DOIT ETRE AJOUTE ICI **ET** avoir son propre
// sitemap. Un domaine absent de cette liste retombe silencieusement sur
// academiapro.fr — sans erreur, sans avertissement.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();

  const estComptable = host.indexOf("mrcomptable") >= 0;
  const estMysterLLC = host.indexOf("mysterllc") >= 0;

  const sitemap = estMysterLLC
    ? "https://mysterllc.com/sitemap-mysterllc.xml"
    : estComptable
      ? "https://mrcomptable.fr/sitemap-comptable.xml"
      : "https://academiapro.fr/sitemap.xml";

  const lignes = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    // ⚠️ L ECRAN DE SIGNATURE NE DOIT PAS ETRE INDEXE. Ses adresses portent
    // une reference de document : les laisser indexer exposerait a Google
    // des documents contractuels destines a une seule personne.
    "Disallow: /compliance/signature",
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
