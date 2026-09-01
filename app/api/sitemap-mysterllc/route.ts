import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// LE SITEMAP DE MYSTERLLC — 01/09.
//
// POURQUOI UN FICHIER SEPARE. Le sitemap principal (app/sitemap.ts) est
// celui d academiapro.fr : il liste des formations, des seances, des pages
// Qualiopi. Rien de tout cela n a sa place sur un site qui parle de
// conformite de societes americaines.
//
// ⚠️ IL SUIT LE MEME MECANISME QUE LE SITEMAP COMPTABLE : servi sous
// /sitemap-mysterllc.xml, reecrit par le middleware vers cette route. Un
// dossier portant un point dans son nom n est pas servi par Next, d ou ce
// detour.
//
// 🚨 CE QUI NE FIGURE PAS ICI, ET C EST VOULU :
//
//   - LES ECRANS DE TRAVAIL (/admin/compliance et ses enfants). Ils vivent
//     derriere la session. Une page que Google ne peut pas atteindre n a
//     aucune raison d etre declaree — et la declarer produirait des erreurs
//     d exploration dans la Search Console.
//
//   - LES PAGES DE SIGNATURE (/compliance/signature/...). Leurs adresses
//     portent une reference de document destine a UNE SEULE PERSONNE. Les
//     declarer exposerait a Google des documents contractuels. Le
//     robots.txt les interdit aussi, par precaution.
//
// ⚠️ LE SITEMAP NE LISTE QUE CE QUI EST PUBLIC ET UTILE A TROUVER : la
// vitrine, et les articles du blog. C est peu, et c est normal — un
// produit vendu par rendez-vous n a pas besoin de cent pages.
// ---------------------------------------------------------------------------

export const revalidate = 3600;
export const dynamic = "force-dynamic";

const SITE = "https://mysterllc.com";

function clientLecture() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
}

function entree(url: string, priorite: number, modifie?: string): string {
  const bouts = [
    "  <url>",
    "    <loc>" + url + "</loc>",
  ];
  if (modifie) {
    bouts.push("    <lastmod>" + String(modifie).slice(0, 10) + "</lastmod>");
  }
  bouts.push("    <changefreq>weekly</changefreq>");
  bouts.push("    <priority>" + priorite.toFixed(1) + "</priority>");
  bouts.push("  </url>");
  return bouts.join("\n");
}

export async function GET() {
  const lignes: string[] = [];

  // La vitrine et le blog. C est tout ce qui est public aujourd hui.
  lignes.push(entree(SITE + "/", 1.0));
  lignes.push(entree(SITE + "/blog", 0.8));

  try {
    const supabase = clientLecture();

    // ⚠️ LE FILTRE PAR MARQUE EST INDISPENSABLE. Sans lui, le sitemap de
    // MysterLLC declarerait les articles d AcadeMIA Pro et de Mr Comptable
    // sous le domaine mysterllc.com : Google indexerait des pages de
    // formation sur un site de conformite fiscale.
    const { data: articles } = await supabase
      .from("blog")
      .select("slug, created_at")
      .eq("publie", true)
      .eq("marque", "mysterllc")
      .order("created_at", { ascending: false })
      .limit(500);

    for (const a of (articles || [])) {
      if (!a.slug) continue;
      lignes.push(entree(SITE + "/blog/" + a.slug, 0.7, a.created_at));
    }
  } catch (e) {
    // En cas de panne base : la vitrine et le blog seulement, jamais
    // d erreur. Un sitemap incomplet vaut mieux qu un sitemap absent.
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + lignes.join("\n")
    + "\n</urlset>";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
