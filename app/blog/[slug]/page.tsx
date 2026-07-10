import AiguillageLangueBlog from "../../../components/AiguillageLangueBlog";

async function getArticle(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/blog?slug=eq.${slug}&select=*`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch { return null; }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) return { title: "AcademIA Pro" };
  return {
    title: article.titre + " - AcademIA Pro",
    description: article.extrait || "",
    alternates: {
      canonical:
        "https://academiapro.fr/blog/" + params.slug,
      languages: {
        fr: "https://academiapro.fr/blog/" + params.slug,
        en: "https://academiapro.fr/en/blog",
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
    if (!l || l === "---") continue;
    if (l.startsWith("# ")) continue;
    if (l.startsWith("## ")) {
      html += "<h2 style=\"color:#c8a96e;font-size:22px;"
        + "margin:32px 0 14px\">" + l.slice(3) + "</h2>";
    } else {
      let p = l.replace(
        /\*\*([^*]+)\*\*/g,
        "<strong style=\"color:#fff\">$1</strong>");
      p = p.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      html += "<p style=\"color:rgba(255,255,255,0.75);"
        + "font-size:15px;line-height:1.9;"
        + "margin:0 0 16px\">" + p + "</p>";
    }
  }
  return html;
}

export default async function ArticlePage(
  { params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <div style={{ backgroundColor: "#050508",
        minHeight: "100vh", color: "#fff",
        display: "flex", alignItems: "center",
        justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "#c8a96e" }}>
            Article non trouve
          </h1>
          <a href="/blog" style={{ color: "#c8a96e" }}>
            Retour au blog
          </a>
        </div>
      </div>
    );
  }

  const corps = formaterContenu(article.contenu);

  return (
    <>
    <AiguillageLangueBlog languePage="fr" />
    <div style={{ backgroundColor: "#050508",
      minHeight: "100vh", color: "#fff",
      fontFamily: "Georgia, serif",
      padding: "60px 20px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href="/blog" style={{ color: "#c8a96e",
          fontSize: "13px", textDecoration: "none" }}>
          &larr; Retour au blog
        </a>
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
    </>
  );
}
