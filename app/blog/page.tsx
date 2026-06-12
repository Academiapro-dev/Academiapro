export default function BlogPage() {
  const items = [
    { code: "B01", titre: "10 prompts Claude pour automatiser sa comptabilite", prix: "Gratuit", desc: "IA · 5 min de lecture" },
    { code: "B02", titre: "Comment creer un chatbot en 24h sans coder", prix: "Gratuit", desc: "No-Code · 8 min de lecture" },
    { code: "B03", titre: "Les 5 meilleurs outils IA pour le marketing 2026", prix: "Gratuit", desc: "Marketing · 6 min de lecture" },
    { code: "B04", titre: "Sophrologie et IA : la combinaison gagnante", prix: "Gratuit", desc: "Bien-etre · 4 min de lecture" },
    { code: "B05", titre: "Apprendre l anglais avec Claude : methode complete", prix: "Gratuit", desc: "Langues · 7 min de lecture" },
    { code: "B06", titre: "No-Code et IA : creer son app en une semaine", prix: "Gratuit", desc: "Tech · 10 min de lecture" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Blog AcadémIA Pro</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>Articles · Conseils · Actualites IA et Formation</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {items.map((item) => (
            <div key={item.code} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "11px" }}>{item.code}</span>
                <span style={{ background: "#c8a96e", color: "#050508", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "bold" }}>ARTICLE</span>
              </div>
              <h3 style={{ color: "#fff", fontSize: "15px", margin: "0 0 8px", lineHeight: "1.4" }}>{item.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "0 0 16px" }}>{item.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold" }}>{item.prix}</span>
              </div>
              <a href="#" style={{ display: "block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "bold", textAlign: "center", textDecoration: "none" }}>Voir</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}