export default function SpecialitePage({ params }: { params: { specialite: string } }) {
  const specialite = params.specialite.replace(/-/g, " ");
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/seances" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "14px" }}>Retour aux seances</a>
        <div style={{ marginTop: "32px", marginBottom: "48px", textAlign: "center" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>SEANCE THERAPEUTIQUE</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 16px", textTransform: "capitalize" }}>{specialite}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>Seance avec Agent IA therapeute · Disponible 24h/24</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          {[
            { type: "Audio", prix: "20€", duree: "20 min", desc: "Seance audio avec votre therapeute IA" },
            { type: "Visio", prix: "30€", duree: "20 min", desc: "Bientot disponible — seance en visio interactive" },
          ].map((s) => (
            <div key={s.type} style={{ background: "#1a1a2e", borderRadius: "16px", padding: "28px", border: "1px solid rgba(200,169,110,0.3)", textAlign: "center" }}>
              <h3 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 8px" }}>{s.type}</h3>
              <p style={{ color: "#fff", fontSize: "32px", fontWeight: "bold", margin: "0 0 4px" }}>{s.prix}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 20px" }}>{s.duree} · {s.desc}</p>
              {s.type === "Audio" ? (
                <a href={"/seances/" + params.specialite + "/session"} style={{ display: "block", width: "100%", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", textDecoration: "none", boxSizing: "border-box" }}>Reserver</a>
              ) : (
                <button disabled style={{ width: "100%", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: "bold", cursor: "not-allowed" }}>Bientot disponible</button>
              )}
            </div>
          ))}
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", textAlign: "center" }}>
          <p style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 8px" }}>Pack Seances</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Rechargez autant de seances de 20 min que vous le souhaitez · Abonnement mensuel disponible</p>
          <a href="/abonnements" style={{ display: "inline-block", color: "#c8a96e", border: "1px solid #c8a96e", borderRadius: "8px", padding: "10px 24px", textDecoration: "none", fontSize: "14px" }}>Voir les abonnements</a>
        </div>
      </div>
    </div>
  );
}