import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// Blog Mr. Comptable. Ne lit QUE les articles de marque mrcomptable :
// le blog AcademIA Pro est ailleurs et les deux ne se melangent jamais.
//
// LA CANONIQUE EST SANS PREFIXE. Le middleware sert cette page sous
// mrcomptable.fr/blog : c est cette adresse-la que le sitemap declare et
// que le visiteur voit. Declarer /comptable/blog creerait deux adresses
// pour une seule page.

export const revalidate = 3600;

export const metadata = {
  title: "Blog — Mr. Comptable | Facture électronique et tenue comptable",
  description:
    "Articles sur la facture électronique, la fiscalité et la tenue"
    + " comptable, écrits pour les cabinets d'expertise comptable.",
  alternates: {
    canonical: "https://mrcomptable.fr/blog",
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
            <Link key={a.id} href={"/comptable/blog/" + a.slug}
              style={carte}>
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
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
