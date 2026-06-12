export default function MesCertificatsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Mes Certifications</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>Certification AcadémIA Pro · 4 niveaux · QR Code · LinkedIn</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Attestation de Suivi</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Niveau 1 · Obtenue apres completion du module d introduction. Telechargez en PDF et partagez sur LinkedIn.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Certificat de Formation</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Niveau 2 · Obtenu apres completion totale avec score 70% minimum. Verification par QR Code.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Certificat Expert</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Niveau 3 · Obtenu apres completion avec score 85% minimum. Mention sur profil AcadémIA Pro.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Certificat Master</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Niveau 4 · Obtenu apres completion d un pack complet avec scores 90% minimum. Mention Master AcadémIA Pro.</p>
        </div>
      </div>
    </div>
  );
}