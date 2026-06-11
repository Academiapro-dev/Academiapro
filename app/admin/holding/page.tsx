export default function HoldingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>STRUCTURE INTERNATIONALE</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>Dashboard Holding</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0" }}>LLC Wyoming 95% · SAS AcadémIA Pro France · Jacques 5%</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          
          <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "28px", border: "1px solid #c8a96e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0" }}>LLC Wyoming</h2>
              <span style={{ background: "#0a2e0a", color: "#4caf50", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>Active ✅</span>
            </div>
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Parts SAS France</span>
                <span style={{ color: "#fff", fontWeight: "bold" }}>95%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Compliance</span>
                <span style={{ color: "#4caf50", fontSize: "13px" }}>À jour ✅</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Agent Wyoming</span>
                <span style={{ color: "#fff", fontSize: "13px" }}>52$/an</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Renouvellement</span>
                <span style={{ color: "#fff", fontSize: "13px" }}>Jan 2027</span>
              </div>
            </div>
          </div>

          <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "28px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0" }}>SAS France</h2>
              <span style={{ background: "#0a2e0a", color: "#4caf50", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>Active ✅</span>
            </div>
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>CA ce mois</span>
                <span style={{ color: "#fff", fontWeight: "bold" }}>-- €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Bénéfice net</span>
                <span style={{ color: "#4caf50", fontSize: "13px" }}>-- €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>IS estimé</span>
                <span style={{ color: "#fff", fontSize: "13px" }}>-- €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Jacques</span>
                <span style={{ color: "#fff", fontSize: "13px" }}>5% · Président</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "28px", marginBottom: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 20px" }}>Flux Inter-Sociétés ce mois</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#050508", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px" }}>LICENCE MARQUE 5%</p>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0" }}>-- €</p>
            </div>
            <div style={{ background: "#050508", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px" }}>SERVICES TECH 10%</p>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0" }}>-- €</p>
            </div>
            <div style={{ background: "#050508", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px" }}>MANAGEMENT FEES 3%</p>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0" }}>-- €</p>
            </div>
          </div>
        </div>

        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "28px", border: "1px solid rgba(200,169,110,0.3)" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 20px" }}>Optimisation Fiscale</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#050508", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px" }}>SANS MONTAGE</p>
              <p style={{ color: "#ef4444", fontSize: "20px", fontWeight: "bold", margin: "0" }}>-- €</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "4px 0 0" }}>impôts estimés</p>
            </div>
            <div style={{ background: "#050508", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px" }}>AVEC MONTAGE</p>
              <p style={{ color: "#4caf50", fontSize: "20px", fontWeight: "bold", margin: "0" }}>-- €</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "4px 0 0" }}>impôts optimisés</p>
            </div>
            <div style={{ background: "#050508", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px" }}>ÉCONOMIE</p>
              <p style={{ color: "#c8a96e", fontSize: "20px", fontWeight: "bold", margin: "0" }}>-- €</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "4px 0 0" }}>par an</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
