import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export const revalidate = 3600;

export const metadata = {
  title: "Blog - AcademIA Pro | Blog",
  description: "AI, professional training and career insights",
  alternates: {
    canonical: "https://academiapro.fr/en/blog",
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

export default async function BlogListe() {
  const supabase = clientLecture();
  const { data: traductions } = await supabase
    .from("blog_traductions")
    .select("slug, titre, extrait, cree_le")
    .eq("langue", "en")
    .order("cree_le", { ascending: false });

  const articles = traductions || [];

  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "60px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center",
          marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px",
            letterSpacing: "3px", margin: "0 0 12px" }}>
            ACADEMIAPRO
          </p>
          <h1 style={{ color: "#fff", fontSize: "36px",
            margin: "0 0 12px" }}>Blog</h1>
          <p style={{ color: "rgba(255,255,255,0.6)",
            fontSize: "16px", margin: "0" }}>
            AI, professional training and career insights
          </p>
        </div>
        {articles.length === 0 && (
          <p style={{ textAlign: "center",
            color: "rgba(255,255,255,0.5)" }}>
            No articles yet.
          </p>
        )}
        {articles.map((a) => (
          <Link key={a.slug}
            href={"/en/blog/" + a.slug}
            style={{ textDecoration: "none" }}>
            <div style={{ background: "#1a1a2e",
              borderRadius: "16px", padding: "32px",
              border: "1px solid rgba(200,169,110,0.3)",
              marginBottom: "24px" }}>
              <h2 style={{ color: "#c8a96e",
                fontSize: "22px", margin: "0 0 12px" }}>
                {a.titre}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)",
                fontSize: "14px", lineHeight: "1.7",
                margin: "0 0 12px" }}>
                {a.extrait}
              </p>
              <span style={{ color: "#c8a96e",
                fontSize: "13px" }}>Read more</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
