export default function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 12px" }}>Nous Contacter</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>Reponse sous 24h · contact@academiapro.fr</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "40px", border: "1px solid rgba(200,169,110,0.3)" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>Prenom</label>
            <input type="text" style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>Nom</label>
            <input type="text" style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>Email</label>
            <input type="text" style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>Sujet</label>
            <input type="text" style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>Message</label>
            <textarea style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px", height: "120px", boxSizing: "border-box" }} />
          </div>
          <button style={{ width: "100%", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", border: "none", borderRadius: "8px", padding: "14px", fontSize: "15px", fontWeight: "bold", cursor: "pointer" }}>Envoyer le message</button>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center", marginTop: "16px" }}>Reponse sous 24h · Agent IA disponible 24h/24</p>
        </div>
      </div>
    </div>
  );
}