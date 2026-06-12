export default function PacksPage() {
  const items = [
    { code: "P01", titre: "Starter Pack IA", prix: "47euro", desc: "100 prompts · Guide PDF · Module 1 F128" },
    { code: "P02", titre: "Pack Starter Complet", prix: "97euro", desc: "P01 + 3 Skills IA + Acces communaute" },
    { code: "P03", titre: "Pack Skills IA", prix: "597euro", desc: "10 Skills IA + Communaute VIP" },
    { code: "P04", titre: "Pack Marketing Digital", prix: "1490euro", desc: "F010 + F043 + F131 + 5 Skills" },
    { code: "P05", titre: "Pack IA Complet", prix: "2690euro", desc: "F128 + F129 + F130 + F131" },
    { code: "P06", titre: "Pack IA et Skills", prix: "2990euro", desc: "Pack IA Complet + 10 Skills IA" },
    { code: "P07", titre: "Pack Entrepreneur Digital", prix: "3490euro", desc: "5 formations + 10 Skills + Seances" },
    { code: "P08", titre: "Pack Entrepreneur Elite", prix: "3990euro", desc: "7 formations + 15 Skills + Seances VIP" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Nos Packs Formations</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>Certification AcadémIA Pro · Paiement 3x · Garantie 30 jours</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {items.map((item) => (
            <div key={item.code} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "11px" }}>{item.code}</span>
                <span style={{ background: "#c8a96e", color: "#050508", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "bold" }}>PACK</span>
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