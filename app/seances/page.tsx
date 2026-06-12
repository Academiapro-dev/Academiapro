export default function SeancesPage() {
  const items = [
    { code: "S01", titre: "Hypnose Ericksonienne", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S02", titre: "PNL Praticien", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S03", titre: "Sophrologie", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S04", titre: "Coaching Personnel", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S05", titre: "Meditation Pleine Conscience", prix: "29euro", desc: "Seance decouverte" },
    { code: "S06", titre: "Gestion du Stress", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S07", titre: "Burn-out Professionnel", prix: "79euro", desc: "Seance expert" },
    { code: "S08", titre: "Troubles du Sommeil", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S09", titre: "Confiance en Soi", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S10", titre: "Relations et Communication", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S11", titre: "Procrastination", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S12", titre: "Anxiete et Phobies", prix: "79euro", desc: "Seance expert" },
    { code: "S13", titre: "Developpement Personnel", prix: "59euro", desc: "Seance visio ou audio" },
    { code: "S14", titre: "Equilibre Vie Pro/Perso", prix: "59euro", desc: "Seance visio ou audio" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Seances Therapeutiques</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>14 specialites · Agent IA · Garantie 30 jours</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {items.map((item) => (
            <div key={item.code} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "11px" }}>{item.code}</span>
                <span style={{ background: "#c8a96e", color: "#050508", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "bold" }}>IA</span>
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