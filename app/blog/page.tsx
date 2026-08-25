import { createClient } from "@supabase/supabase-js";
import AiguillageLangueBlog from "../../components/AiguillageLangueBlog";

export const revalidate = 3600;

// 🚨 LES ACCENTS ONT ETE RETABLIS LE 25/08.
//
// Ce fichier portait « AcademIA Pro » sans accent et « bien-etre » dans le
// TITRE et la DESCRIPTION de la page. Ces deux champs sont ce que Google
// affiche dans ses resultats et ce qui s inscrit dans l onglet du
// navigateur : c est le premier contact d un visiteur avec la marque.
//
// LA REGLE, ET ELLE NE SOUFFRE PAS D EXCEPTION : tout texte visible par un
// tiers est accentue. Le code peut rester en ASCII, pas ce qui s affiche.

export const metadata = {
  title: "Blog — AcadéMIA Pro | Intelligence artificielle, formation et bien-être",
  description:
    "Articles sur l'intelligence artificielle, la formation"
    + " professionnelle et le bien-être, par AcadéMIA Pro.",
  alternates: {
    canonical: "https://academiapro.fr/blog",
    languages: {
      fr: "https://academiapro.fr/blog",
      en: "https://academiapro.fr/en/blog",
      es: "https://academiapro.fr/es/blog",
    },
  },
};

function clientLecture() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
}

function extraireTexte(contenu) {
  return (contenu || "")
    .replace(/[#*_>`-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export default async function PageBlog() {
  const supabase = clientLecture();
  // Ce blog est celui d AcadeMIA Pro. Les articles Mr. Comptable ont
  // leur propre blog et ne doivent jamais paraitre ici.
  //
  // 🚨 publie = true RESTE LE CRITERE D AFFICHAGE. La colonne publier_le,
  // ajoutee le 25/08, ne se lit PAS ici : c est le cron /api/publier-blog
  // qui bascule publie a true quand la date arrive. Filtrer sur publier_le
  // dans cette page ferait doublon et compliquerait pour rien.
  const { data } = await supabase
    .from("blog")
    .select("id, titre, slug, extrait, contenu, categorie, created_at")
    .eq("publie", true)
    .eq("marque", "academiapro")
    .order("created_at", { ascending: false });
  const articles = data || [];

  return (
    <>
    <AiguillageLangueBlog languePage="fr" />
    <main style={{ maxWidth: 1000, margin: "0 auto",
      padding: "60px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <p style={{ color: "#c8a96e", fontSize: 12,
          letterSpacing: 3, margin: "0 0 12px" }}>
          BLOG ACADÉMIA PRO
        </p>
        <h1 style={{ fontSize: "2.4rem", margin: "0 0 12px" }}>
          Intelligence artificielle et formation
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>
          Articles sur l&apos;intelligence artificielle, la formation
          professionnelle et le bien-être.
        </p>
      </div>

      {articles.length === 0 && (
        <p style={{ textAlign: "center",
          color: "rgba(255,255,255,0.5)" }}>
          Aucun article pour le moment. Revenez bientôt.
        </p>
      )}

      <div style={{ display: "grid",
        gridTemplateColumns:
          "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 24 }}>
        {articles.map((a) => (
          <a key={a.id} href={"/blog/" + a.slug}
            style={{ background: "#12121f",
              border: "1px solid rgba(200,169,110,0.25)",
              borderRadius: 16, overflow: "hidden",
              textDecoration: "none", color: "#fff",
              display: "flex", flexDirection: "column" }}>
            <div style={{ height: 160,
              background:
                "linear-gradient(135deg,#1a1a2e 0%,#23233a 100%)",
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 48 }}>
              🤖
            </div>
            <div style={{ padding: 24, flex: 1,
              display: "flex", flexDirection: "column" }}>
              {a.categorie && (
                <span style={{ alignSelf: "flex-start",
                  background: "rgba(200,169,110,0.15)",
                  color: "#c8a96e", borderRadius: 20,
                  padding: "3px 12px", fontSize: 12,
                  marginBottom: 12 }}>
                  {a.categorie}
                </span>
              )}
              <h2 style={{ fontSize: "1.15rem",
                margin: "0 0 10px", lineHeight: 1.4 }}>
                {a.titre}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)",
                fontSize: 14, lineHeight: 1.6,
                margin: "0 0 16px", flex: 1 }}>
                {a.extrait || extraireTexte(a.contenu)}
              </p>
              <div style={{ display: "flex",
                justifyContent: "space-between",
                alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.4)",
                  fontSize: 13 }}>
                  AcadémIA Pro
                </span>
                <span style={{ color: "#c8a96e", fontSize: 14,
                  fontWeight: 700 }}>
                  Lire &rarr;
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
    </>
  );
}
