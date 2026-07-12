"use client";
import { useState, useEffect } from "react";

export default function AdminBlogPage() {
  const [secret, setSecret] = useState("");
  const [connecte, setConnecte] = useState(false);
  const [verifEnCours, setVerifEnCours] = useState(false);
  const [verifMessage, setVerifMessage] = useState("");

  async function verifierCode() {
    setVerifEnCours(true);
    setVerifMessage("");
    try {
      const r = await fetch(
        "/api/admin-articles?secret="
        + encodeURIComponent(secret));
      const d = await r.json();
      if (d.erreur) { setVerifMessage("Code refuse."); }
      else { setConnecte(true); }
    } catch (e) { setVerifMessage("Erreur reseau."); }
    setVerifEnCours(false);
  }
  const [articles, setArticles] = useState<any[]>([]);
  const [form, setForm] = useState({ titre: "", slug: "", extrait: "", contenu: "", categorie: "Intelligence Artificielle", publie: false });
  const [loading, setLoading] = useState(false);
  const [vue, setVue] = useState("liste");
  const [genLoading, setGenLoading] = useState(false);
  const [sujet, setSujet] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { charger(); }, []);

  async function charger() {
    const res = await fetch("/api/blog");
    const data = await res.json();
    setArticles(Array.isArray(data) ? data : []);
  }

  async function genererArticle() {
    if (!sujet.trim()) return;
    setGenLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Ecris un article de blog professionnel SEO de 600 mots sur : ${sujet}. Format : introduction, 3 sections avec sous-titres, conclusion. Ton expert et accessible.`,
          agent: { prompt: "Tu es expert en content marketing IA et formation professionnelle. Tu ecris des articles SEO engageants pour AcadémIA Pro." },
          historique: []
        }),
      });
      const data = await res.json();
      const slug = sujet.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").slice(0, 50);
      setForm({
        titre: sujet,
        slug,
        contenu: data.reply || "",
        extrait: (data.reply || "").slice(0, 200) + "...",
        categorie: "Intelligence Artificielle",
        publie: false
      });
      setVue("nouveau");
    } catch (e) {
      setMsg("Erreur generation");
    }
    setGenLoading(false);
  }

  async function sauvegarder() {
    if (!form.titre || !form.slug) {
      setMsg("Titre et slug requis");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Article sauvegarde ✅");
        setForm({ titre: "", slug: "", extrait: "", contenu: "", categorie: "Intelligence Artificielle", publie: false });
        setVue("liste");
        charger();
      } else {
        setMsg("Erreur : " + (data.error || "inconnue"));
      }
    } catch (e) {
      setMsg("Erreur connexion");
    }
    setLoading(false);
  }

  async function togglePublie(id: string, publie: boolean) {
    await fetch("/api/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, publie: !publie }),
    });
    charger();
  }

  if (!connecte) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: "380px", width: "100%", textAlign: "center" }}>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "8px" }}>Blog Admin</h1>
          <p style={{ opacity: 0.6, fontSize: "14px", marginBottom: "24px" }}>Entrez votre code d acces</p>
          <input type="password" value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifierCode()}
            placeholder="Code d acces"
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.4)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box", marginBottom: "14px" }} />
          <button onClick={verifierCode} disabled={verifEnCours}
            style={{ width: "100%", padding: "13px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            {verifEnCours ? "..." : "Entrer"}
          </button>
          {verifMessage && <p style={{ color: "#ff6b6b", marginTop: "14px", fontSize: "13px" }}>{verifMessage}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "25px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>Blog Admin</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: "3px 0 0", fontSize: "13px" }}>{articles.length} articles · {articles.filter(a => a.publie).length} publies</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => { setVue("generer"); setMsg(""); }} style={{ padding: "9px 18px", background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Generer IA
          </button>
          <button onClick={() => { setVue("nouveau"); setMsg(""); }} style={{ padding: "9px 18px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Nouveau
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.includes("✅") ? "rgba(34,197,94,0.2)" : "rgba(255,0,0,0.2)", color: msg.includes("✅") ? "#22c55e" : "#ff6b6b", padding: "12px 20px", textAlign: "center", fontWeight: "bold" }}>
          {msg}
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "30px 20px" }}>

        {vue === "generer" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "30px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0 }}>Generer un Article avec IA</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>L IA redige un article SEO complet en 30 secondes</p>
            <input type="text" placeholder="Ex: Comment l IA revolutionne la formation en 2026" value={sujet}
              onChange={e => setSujet(e.target.value)}
              onKeyDown={e => e.key === "Enter" && genererArticle()}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "15px", boxSizing: "border-box" as any }} />
            <button onClick={genererArticle} disabled={genLoading || !sujet.trim()}
              style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>
              {genLoading ? "Generation en cours..." : "Generer l Article"}
            </button>
          </div>
        )}

        {vue === "nouveau" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>Article</h2>
              <button onClick={() => setVue("liste")} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "6px 14px", borderRadius: "8px", cursor: "pointer" }}>Retour</button>
            </div>
            <div style={{ display: "grid", gap: "15px" }}>
              {[
                { label: "Titre", key: "titre" },
                { label: "Slug URL", key: "slug" },
                { label: "Categorie", key: "categorie" },
                { label: "Extrait (200 caracteres)", key: "extrait" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input type="text" value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
                </div>
              ))}
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>
                  Contenu ({form.contenu.length} caracteres)
                </label>
                <textarea
                  value={form.contenu}
                  onChange={e => setForm(p => ({ ...p, contenu: e.target.value }))}
                  rows={15}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any, resize: "vertical", fontFamily: "Georgia, serif", lineHeight: "1.7", fontSize: "14px" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" checked={form.publie} onChange={e => setForm(p => ({ ...p, publie: e.target.checked }))} style={{ width: "18px", height: "18px" }} />
                <label style={{ color: "#c8a96e", fontSize: "14px" }}>Publier maintenant</label>
              </div>
            </div>
            <button onClick={sauvegarder} disabled={loading}
              style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "20px", fontSize: "16px" }}>
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}

        {vue === "liste" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>Articles ({articles.length})</h2>
            {articles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "40px", marginBottom: "15px" }}>✍️</div>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>Aucun article. Cliquez sur Generer IA.</p>
              </div>
            ) : (
              articles.map(article => (
                <div key={article.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "18px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: "#fff", margin: "0 0 5px", fontFamily: "Georgia,serif", fontSize: "15px" }}>{article.titre}</h3>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{article.categorie} · {new Date(article.created_at).toLocaleDateString("fr-FR")} · {article.vues} vues</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ color: article.publie ? "#22c55e" : "#666", fontSize: "11px", fontWeight: "bold" }}>
                      {article.publie ? "PUBLIE" : "BROUILLON"}
                    </span>
                    <button onClick={() => togglePublie(article.id, article.publie)}
                      style={{ padding: "5px 10px", background: article.publie ? "rgba(255,0,0,0.15)" : "rgba(34,197,94,0.15)", color: article.publie ? "#ff6b6b" : "#22c55e", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }}>
                      {article.publie ? "Depublier" : "Publier"}
                    </button>
                    <a href={`/blog/${article.slug}`} target="_blank"
                      style={{ padding: "5px 10px", background: "rgba(200,169,110,0.15)", color: "#c8a96e", borderRadius: "6px", fontSize: "11px", textDecoration: "none" }}>
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
