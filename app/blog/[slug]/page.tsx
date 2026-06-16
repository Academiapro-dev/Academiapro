import { Metadata } from "next";

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

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "#c8a96e" }}>Article non trouve</h1>
          <a href="/blog" style={{ color: "#c8a96e" }}>Retour au blog</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <a href="/blog" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "13px" }}>← Retour au blog</a>
        <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", display: "block", width: "fit-content", margin: "15px auto" }}>{article.categorie}</span>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.2rem", maxWidth: "800px", margin: "0 auto 20px", lineHeight: "1.3" }}>{article.titre}</h1>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
          {article.auteur} · {new Date(article.created_at).toLocaleDateString("fr-FR")} · {article.vues} vues
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "50px 20px" }}>
        <div style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.9", fontSize: "16px", whiteSpace: "pre-wrap" }}>
          {article.contenu}
        </div>

        <div style={{ marginTop: "60px", background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "30px", textAlign: "center" }}>
          <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0 }}>Pret a vous former avec l IA ?</h3>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>235 formations certifiantes · Agent IA 24h/24 · Garantie 30 jours</p>
          <a href="/catalogue" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 30px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
            Voir le catalogue
          </a>
        </div>
      </div>
    </div>
  );
}
