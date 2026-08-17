import { createClient } from "@supabase/supabase-js";

// Blog Mr. Comptable. Ne lit QUE les articles de marque mrcomptable :
// le blog AcademIA Pro est ailleurs et les deux ne se melangent jamais.
//
// LA CANONIQUE EST ABSOLUE ET SANS PREFIXE. Le middleware sert cette page
// sous mrcomptable.fr/blog : c est cette adresse-la que le sitemap declare
// et que le visiteur voit. L absolu est indispensable ici — metadataBase
// pointe sur academiapro.fr, donc une canonique relative se resoudrait vers
// le mauvais domaine.
//
// 🚨 LES LIENS DES ARTICLES SONT ABSOLUS EUX AUSSI — corrige le 17/08.
//
// LE DEFAUT. Les cartes pointaient vers `/comptable/blog/<slug>`. Or le
// middleware ne reecrit PAS ce chemin sur mrcomptable.fr : `/comptable` fait
// partie de ses chemins RESERVES. Chaque article etait donc atteignable a
// DEUX adresses — mrcomptable.fr/blog/<slug>, celle du sitemap, et
// mrcomptable.fr/comptable/blog/<slug>, celle des liens internes.
//
// CE QUE GOOGLE EN A FAIT : « Page en double sans URL canonique selectionnee
// par l utilisateur ». Il suit les liens internes, arrive sur l adresse
// prefixee, et ne sait pas laquelle des deux retenir.
//
// POURQUOI ABSOLU ET NON PAS SIMPLEMENT `/blog/<slug>` : cette meme page est
// aussi servie depuis academiapro.fr/comptable/blog. Un lien relatif y
// menerait au blog AcadeMIA Pro, qui n a rien a voir. L absolu garantit que
// l article s ouvre toujours sur le bon domaine, quel que soit le point
// d entree.
//
// Consequence a connaitre : ces liens ne passent plus par le routeur interne
// de Next.js, donc chaque clic recharge la page. Sur un blog de quelques
// articles c est sans effet visible, et la coherence des adresses vaut
// largement cette milliseconde.

export const revalidate = 3600;

const SITE = "https://mrcomptable.fr";

export const metadata = {
  title: "Blog — Mr. Comptable | Facture électronique et tenue comptable",
  description:
    "Articles sur la facture électronique, la fiscalité et la tenue"
    + " comptable, écrits pour les cabinets d'expertise comptable.",
  alternates: {
    canonical: SITE + "/blog",
  },
  // LES BALISES SOCIALES DOIVENT PARLER DE MR. COMPTABLE, pas d AcadeMIA
  // Pro. Sans ces lignes, celles du layout racine s appliquent — le HTML
  // servi annoncait « AcadeMIA Pro, plateforme de formation » sur une page
  // destinee aux cabinets comptables.
  openGraph: {
    title: "Blog — Mr. Comptable",
    description:
      "Facture électronique, obligations déclaratives, tenue et révision :"
      + " des articles écrits pour les cabinets d'expertise comptable.",
    url: SITE + "/blog",
    siteName: "Mr. Comptable",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blog — Mr. Comptable",
    description:
      "Facture électronique, obligations déclaratives, tenue et révision.",
  },
};

const OR = "#c8a96e";
const NOIR = "#050508";

function clientLecture() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
}

function extraireTexte(contenu: string) {
  return (contenu || "")
    .replace(/[#*_>`-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export default async function BlogComptable() {
  const supabase = clientLecture();
  const { data } = await supabase
    .from("blog")
    .select("id, titre, slug, extrait, contenu, categorie, created_at")
    .eq("publie", true)
    .eq("marque", "mrcomptable")
    .order("created_at", { ascending: false });
  const articles = data || [];

  const section: any = {
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "0 24px",
  };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    overflow: "hidden",
    textDecoration: "none",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: "26px",
  };

  return (
    <main style={{ minHeight: "100vh", background: NOIR, color: "#fff",
      fontFamily: "Georgia, serif", paddingTop: "70px",
      paddingBottom: "90px" }}>

      <div style={section}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "0 0 18px" }}>
          MR. COMPTABLE
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25",
          margin: "0 0 18px", maxWidth: "760px" }}>
          Ce qui change pour les cabinets
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "17px",
          lineHeight: "1.75", maxWidth: "680px", margin: "0 0 44px" }}>
          Facture électronique, obligations déclaratives, tenue et
          révision. Des articles écrits pour ceux qui produisent la
          comptabilité, pas pour ceux qui la subissent.
        </p>

        {articles.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>
            Aucun article pour le moment.
          </p>
        )}

        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
          gap: "18px" }}>
          {articles.map((a: any) => (
            <a key={a.id} href={SITE + "/blog/" + a.slug} style={carte}>
              {a.categorie && (
                <span style={{ alignSelf: "flex-start",
                  background: "rgba(200,169,110,0.15)",
                  color: OR, borderRadius: "20px",
                  padding: "3px 12px", fontSize: "12px",
                  marginBottom: "14px" }}>
                  {a.categorie}
                </span>
              )}
              <h2 style={{ fontSize: "19px", margin: "0 0 12px",
                lineHeight: "1.4" }}>
                {a.titre}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)",
                fontSize: "15px", lineHeight: "1.7",
                margin: "0 0 18px", flex: 1 }}>
                {a.extrait || extraireTexte(a.contenu)}
              </p>
              <span style={{ color: OR, fontSize: "14px",
                fontWeight: "bold" }}>
                Lire &rarr;
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
