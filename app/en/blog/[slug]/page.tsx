import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export const revalidate = 3600;

function clientLecture() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
}

async function chargerArticle(slug: string) {
  const supabase = clientLecture();
  const { data } = await supabase
    .from("blog_traductions")
    .select("*")
    .eq("langue", "en")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await chargerArticle(slug);
  if (!article) return { title: "AcademIA Pro" };
  return {
    title: article.meta_titre || article.titre,
    description: article.meta_description
      || article.extrait || "",
    alternates: {
      canonical: "https://academiapro.fr/en/blog/" + slug,
      languages: {
        en: "https://academiapro.fr/en/blog/" + slug,
        fr: "https://academiapro.fr/blog",
        es: "https://academiapro.fr/es/blog",
      },
    },
  };
}

function formaterContenu(contenu: string) {
  const lignes = (contenu || "").split("\n");
  let html = "";
  for (const ligne of lignes) {
    const l = ligne.trim();
    if (!l) continue;
    if (l.startsWith("## ")) {
      html += "<h2 style=\"color:#c8a96e;font-size:22px;"
        + "margin:32px 0 14px\">" + l.slice(3) + "</h2>";
    } else {
      let p = l.replace(
        /\*\*([^*]+)\*\*/g,
        "<strong style=\"color:#fff\">$1</strong>");
      html += "<p style=\"color:rgba(255,255,255,0.75);"
        + "font-size:15px;line-height:1.9;"
        + "margin:0 0 16px\">" + p + "</p>";
    }
  }
  return html;
}

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await chargerArticle(slug);

  if (!article) {
    return (
      <div style={{ minHeight: "100vh",
        background: "#050508", color: "#fff",
        display: "flex", alignItems: "center",
        justifyContent: "center" }}>
        <p>Article not found.</p>
      </div>
    );
  }

  const corps = formaterContenu(article.contenu);

  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "60px 20px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <Link href="/en/blog"
          style={{ color: "#c8a96e", fontSize: "13px",
            textDecoration: "none" }}>
          &larr; Blog
        </Link>
        <h1 style={{ color: "#fff", fontSize: "34px",
          margin: "20px 0 12px", lineHeight: "1.3" }}>
          {article.titre}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)",
          fontSize: "14px", margin: "0 0 32px" }}>
          {article.extrait}
        </p>
        <div dangerouslySetInnerHTML={{ __html: corps }} />
      </div>
    </div>
  );
}
