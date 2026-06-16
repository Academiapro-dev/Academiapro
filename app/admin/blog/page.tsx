"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [form, setForm] = useState({ titre: "", slug: "", extrait: "", contenu: "", categorie: "", publie: false });
  const [loading, setLoading] = useState(false);
  const [vue, setVue] = useState("liste");
  const [genLoading, setGenLoading] = useState(false);
  const [sujet, setSujet] = useState("");

  useEffect(() => { charger(); }, []);

  async function charger() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog?select=*&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    setArticles(Array.isArray(data) ? data : []);
  }

  async function genererArticle() {
    if (!sujet) return;
    setGenLoading(true);
    const res = await fetch("/api/admin/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Ecris un article de blog professionnel et SEO-optimise de 800 mots sur : ${sujet}. 
        Format : titre accrocheur, introduction, 3-4 sections avec sous-titres, conclusion avec CTA vers AcadémIA Pro.
        Ton : expert, accessible, engageant. Parle de l IA, de la formation professionnelle ou du bien-etre selon le sujet.`,
        agent: { prompt: "Tu es un expert en content marketing et SEO specialise dans l IA et la formation professionnelle. Tu ecris des articles de blog engageants, optimises SEO, qui apportent de la valeur aux lecteurs et positionnent AcadémIA Pro comme leader du secteur." },
        historique: []
      }),
    });
    const data = await res.json();
    const slug = sujet.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 50);
    setForm(p => ({ ...p, titre: sujet, slug, contenu: data.reply || "", extrait: data.reply?.slice(0, 150) + "..." || "", categorie: "Intelligence Artificielle" }));
    setVue("nouveau");
    setGenLoading(false);
  }

  async function sauvegarder() {
    setLoading(true);
    await fetch(`${SUPABASE_URL}/rest/v1/blog`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
      body: JSON.stringify(form),
    });
    setForm({ titre: "", slug: "", extrait: "", contenu: "", categorie: "", publie: false });
    setVue("liste");
    charger();
    setLoading(false);
  }

  async function togglePublie(id: string, publie: boolean) {
    await fetch(`${SUPABASE_URL}/rest/v1/blog?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
      body: JSON.stringify({ publie: !publie }),
    });
    charger();
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>Blog AcadémIA Pro</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0" }}>{articles.length} articles · {articles.filter(a => a.publie).length} publies</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setVue("generer")} style={{ padding: "10px 20px", background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Generer avec IA
          </button>
          <button onClick={() => setVue("nouveau")} style={{ padding: "10px 20px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Nouvel Article
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "30px 20px" }}>

        {vue === "generer" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "30px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0 }}>Generer un Article avec IA</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>Entrez un sujet et l IA redige un article SEO complet en 30 secondes</p>
            <input type="text" placeholder="Ex: Comment l IA va revolutionner la formation en 2026" value={sujet} onChange={e => setSujet(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "15px", boxSizing: "border-box" as any }} />
            <button onClick={genererArticle} disabled={genLoading || !sujet}
              style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>
              {genLoading ? "Generation en cours (30s)..." : "Generer l Article"}
            </button>
          </div>
        )}

        {vue === "nouveau" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>Nouvel Article</h2>
              <button onClick={() => setVue("liste")} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "6px 14px", borderRadius: "8px", cursor: "pointer" }}>Retour</button>
            </div>
            <div style={{ display: "grid", gap: "15px" }}>
              {[
                { label: "Titre", key: "titre", placeholder: "Titre de l article" },
                { label: "Slug URL", key: "slug", placeholder: "titre-de-l-article" },
                { label: "Categorie", key: "categorie", placeholder: "Intelligence Artificielle" },
                { label: "Extrait", key: "extrait", placeholder: "Resume court de l article..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
                </div>
              ))}
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Contenu</label>
                <textarea value={form.contenu} onChange={e => setForm(p => ({ ...p, contenu: e.target.value }))} rows={12}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <label style={{ color: "#c8a96e", fontSize: "13px" }}>Publier maintenant :</label>
                <input type="checkbox" checked={form.publie} onChange={e => setForm(p => ({ ...p, publie: e.target.checked }))} style={{ width: "18px", height: "18px" }} />
              </div>
            </div>
            <button onClick={sauvegarder} disabled={loading}
              style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "20px", fontSize: "16px" }}>
              {loading ? "Sauvegarde..." : "Sauvegarder l Article"}
            </button>
          </div>
        )}

        {vue === "liste" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>Tous les Articles ({articles.length})</h2>
            {articles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "40px", marginBottom: "15px" }}>✍️</div>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>Aucun article. Cliquez sur Generer avec IA pour commencer.</p>
              </div>
            ) : (
              articles.map(article => (
                <div key={article.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "18px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ color: "#fff", margin: "0 0 5px", fontFamily: "Georgia,serif", fontSize: "15px" }}>{article.titre}</h3>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{article.categorie}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>·</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{new Date(article.created_at).toLocaleDateString("fr-FR")}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>·</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{article.vues} vues</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ color: article.publie ? "#22c55e" : "#666", fontSize: "12px", fontWeight: "bold" }}>
                      {article.publie ? "Publie" : "Brouillon"}
                    </span>
                    <button onClick={() => togglePublie(article.id, article.publie)}
                      style={{ padding: "6px 12px", background: article.publie ? "rgba(255,0,0,0.2)" : "rgba(34,197,94,0.2)", color: article.publie ? "#ff6b6b" : "#22c55e", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                      {article.publie ? "Depublier" : "Publier"}
                    </button>
                    <a href={`/blog/${article.slug}`} target="_blank" style={{ padding: "6px 12px", background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", textDecoration: "none" }}>
                      Voir
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
