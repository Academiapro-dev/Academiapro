export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <a href="/blog" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "14px" }}>Retour au blog</a>
        <div style={{ marginTop: "32px", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ARTICLE BLOG</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 16px", lineHeight: "1.3" }}>Article AcadémIA Pro</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 32px" }}>Par Avatar IA AcadémIA Pro · Mis a jour en 2026</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "40px", border: "1px solid rgba(200,169,110,0.3)", lineHeight: "1.8" }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", margin: "0 0 24px" }}>Contenu de l article charge depuis Supabase selon le slug : {params.slug}</p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", margin: "0" }}>AcadémIA Pro vous accompagne dans votre developpement professionnel avec 131 formations certifiantes et un agent IA disponible 24h/24.</p>
        </div>
        <div style={{ marginTop: "48px", padding: "32px", background: "#1a1a2e", borderRadius: "16px", border: "1px solid #c8a96e", textAlign: "center" }}>
          <p style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 8px" }}>Cet article vous a interesse ?</p>
          <a href="/formations" style={{ display: "inline-block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "8px", padding: "12px 28px", textDecoration: "none", fontWeight: "bold", marginTop: "12px" }}>Voir les 131 formations</a>
        </div>
      </div>
    </div>
  );
}