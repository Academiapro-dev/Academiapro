export default function MiniCoursPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 12px" }}>Mini-cours Gratuit 3 Jours</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>Maitriser Claude en 15 minutes par jour</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "40px", border: "1px solid rgba(200,169,110,0.3)" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>Prenom</label>
            <input type="text" style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>Email</label>
            <input type="text" style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>Metier</label>
            <input type="text" style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <button style={{ width: "100%", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", border: "none", borderRadius: "8px", padding: "14px", fontSize: "15px", fontWeight: "bold", cursor: "pointer" }}>Commencer le mini-cours gratuitement</button>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center", marginTop: "16px" }}>Jour 1 : premier prompt · Jour 2 : automatiser · Jour 3 : agent IA</p>
        </div>
      </div>
    </div>
  );
}