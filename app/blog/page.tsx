import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog AcadémIA Pro",
  description: "Articles sur l IA, la formation et le bien-etre.",
};

async function getArticles() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/blog?publie=eq.true&select=*&order=created_at.desc`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

const ARTICLES_PREVIEW = [
  { titre: "Comment l IA transforme la formation professionnelle", cat: "Intelligence Artificielle", emoji: "🤖", temps: "5 min" },
  { titre: "5 techniques PNL pour booster votre carriere", cat: "Bien-Etre", emoji: "🧠", temps: "7 min" },
  { titre: "Guide complet du Prompt Engineering en 2026", cat: "Tech", emoji: "💻", temps: "10 min" },
  { titre: "Pourquoi choisir une formation certifiante en IA", cat: "Formation Pro", emoji: "🎓", temps: "4 min" },
  { titre: "Meditation et productivite : le duo gagnant", cat: "Bien-Etre", emoji: "🧘", temps: "6 min" },
  { titre: "No-Code et IA : creez votre business en 2026", cat: "Tech", emoji: "🚀", temps: "8 min" },
];

export default async function BlogPage() {
  const articles = await getArticles();

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "80px 40px", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "4px", marginBottom: "15px" }}>BLOG ACADEMIAPRO</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.5rem", marginBottom: "15px" }}>
          Insights IA et Formation
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "600px", margin: "0 auto" }}>
          Articles sur l intelligence artificielle, la formation professionnelle et le bien-etre.
        </p>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "50px 20px" }}>
        {articles.length === 0 ? (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "25px" }}>Articles a venir</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {ARTICLES_PREVIEW.map((article, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ height: "150px", background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "50px" }}>
                    {article.emoji}
                  </div>
                  <div style={{ padding: "20px" }}>
                    <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>{article.cat}</span>
                    <h3 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "15px", margin: "12px 0 8px", lineHeight: "1.4" }}>{article.titre}</h3>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>Jacques Lalou · {article.temps}</span>
                      <span style={{ color: "#c8a96e", fontSize: "12px" }}>Bientot</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" }}>
            {articles.map((article: any) => (
              <a key={article.id} href={`/blog/${article.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ height: "180px", background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "50px" }}>
                    🤖
                  </div>
                  <div style={{ padding: "20px" }}>
                    <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>{article.categorie}</span>
                    <h2 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "18px", margin: "12px 0 8px" }}>{article.titre}</h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "15px" }}>{article.extrait}</p>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{article.auteur}</span>
                      <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "bold" }}>Lire →</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
