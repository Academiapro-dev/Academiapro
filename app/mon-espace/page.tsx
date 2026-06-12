export default function MonEspacePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Mon Espace</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>Votre espace personnel AcadémIA Pro</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Mes Formations</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Toutes les formations achetees · progression · acces direct aux modules · certifications.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Mes Seances</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Prochaines seances reservees · historique · replays disponibles · reserver une nouvelle seance.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Mes Paiements</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Historique des paiements · factures telechargeable · abonnements actifs · prochains prelevements.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Mon Profil</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Informations personnelles · photo · metier · objectifs · preferences de formation · notification.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Mes Certifications</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Certifications obtenues · en cours · a venir. Telechargez et partagez sur LinkedIn.</p>
        </div>
      </div>
    </div>
  );
}