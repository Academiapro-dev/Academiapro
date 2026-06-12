export default function SeanceAudioPage({ params }: { params: { sessionId: string } }) {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#0d0d14", borderBottom: "1px solid rgba(200,169,110,0.25)", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#c8a96e", fontWeight: "bold" }}>AcadémIA Pro · Seance Audio</span>
        <a href="/seances" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "6px 16px", textDecoration: "none", fontSize: "13px" }}>Terminer</a>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "120px", height: "120px", background: "linear-gradient(135deg, #c8a96e, #a07840)", borderRadius: "50%", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "48px" }}>A</span>
          </div>
          <h2 style={{ color: "#c8a96e", fontSize: "24px", margin: "0 0 8px" }}>Seance Audio en Cours</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0 0 8px" }}>Integration ElevenLabs en cours de configuration</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Session : {params.sessionId}</p>
        </div>
      </div>
    </div>
  );
}