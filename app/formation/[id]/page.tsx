export default function FormationPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/formations" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "14px" }}>Retour au catalogue</a>
        <div style={{ marginTop: "32px", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>FORMATION CERTIFIANTE</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 16px" }}>Formation {params.id.toUpperCase()}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>Certification AcadémIA Pro · Garantie 30 jours · Paiement 3x sans frais</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }}>
          <div>
            <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
              <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Description</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: "1.8", margin: "0" }}>Contenu de la formation charge depuis Supabase selon l ID : {params.id}. Cette formation vous permettra de maitriser les competences essentielles avec l aide de votre agent IA personnel 24h/24.</p>
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Programme</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: "1.8", margin: "0" }}>Programme detaille charge depuis Supabase. 5 chapitres minimum · 4 modules par chapitre · exercices avec corrections · certification finale.</p>
            </div>
          </div>
          <div>
            <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "2px solid #c8a96e", position: "sticky", top: "20px" }}>
              <h2 style={{ color: "#c8a96e", fontSize: "24px", margin: "0 0 8px" }}>A partir de</h2>
              <p style={{ color: "#fff", fontSize: "40px", fontWeight: "bold", margin: "0 0 24px" }}>490euro</p>
              <a href="#" style={{ display: "block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "10px", padding: "14px", fontSize: "16px", fontWeight: "bold", textAlign: "center", textDecoration: "none", marginBottom: "12px" }}>Acheter maintenant</a>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", textAlign: "center", margin: "0 0 16px" }}>Paiement 3x sans frais disponible</p>
              <div style={{ borderTop: "1px solid rgba(200,169,110,0.2)", paddingTop: "16px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 8px" }}>Certification AcadémIA Pro incluse</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 8px" }}>Agent IA tuteur 24h/24 inclus</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0" }}>Garantie 30 jours satisfait ou rembourse</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}