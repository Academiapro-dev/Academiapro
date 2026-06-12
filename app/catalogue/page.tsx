export default function CataloguePage() {
  const items = [
    { code: "F128", titre: "Expert Claude et IA Generative", prix: "690euro", desc: "40h · IA" },
    { code: "F129", titre: "No-Code et Automatisation IA", prix: "790euro", desc: "45h · IA" },
    { code: "F130", titre: "Apps Natives avec IA", prix: "990euro", desc: "60h · IA" },
    { code: "F131", titre: "Marketing Digital x IA", prix: "890euro", desc: "50h · Marketing" },
    { code: "F001", titre: "Management et Leadership", prix: "490euro", desc: "30h · Business" },
    { code: "F002", titre: "Communication Professionnelle", prix: "390euro", desc: "25h · Business" },
    { code: "F003", titre: "Gestion du Stress", prix: "390euro", desc: "20h · Bien-etre" },
    { code: "F004", titre: "Anglais Professionnel", prix: "590euro", desc: "80h · Langues" },
    { code: "F005", titre: "Comptabilite et Gestion", prix: "490euro", desc: "35h · Business" },
    { code: "F006", titre: "Ressources Humaines", prix: "490euro", desc: "30h · Business" },
    { code: "F007", titre: "Excel Avance", prix: "290euro", desc: "20h · Outils" },
    { code: "F008", titre: "Reseaux Sociaux Pro", prix: "390euro", desc: "25h · Marketing" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Catalogue Complet</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>131 formations · Certification AcadémIA Pro · Paiement 3x · Garantie 30 jours</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {items.map((item) => (
            <div key={item.code} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "11px" }}>{item.code}</span>
                <span style={{ background: "#c8a96e", color: "#050508", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "bold" }}>CERTIFIANT</span>
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