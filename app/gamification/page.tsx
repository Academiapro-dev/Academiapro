export default function GamificationPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Gamification AcadémIA Pro</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>XP · Badges · Streak · Classement</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Mes Points XP</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Gagnez des XP a chaque module complete · quiz reussi · seance effectuee · connexion quotidienne.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Mon Niveau</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Debutant · Apprenant · Confirme · Expert · Master. Debloquez des avantages a chaque niveau.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Mes Badges</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Premier module · Premiere certification · Streak 7 jours · Expert IA · Master AcadémIA Pro.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Mon Streak</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Jours consecutifs de connexion · record personnel · recompenses speciales tous les 7 jours.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Classement</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Top 100 apprenants du mois · points XP · formations completees · certifications obtenues.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Defis Hebdomadaires</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>3 defis par semaine · recompenses XP · badges exclusifs · acces anticipe aux nouvelles formations.</p>
        </div>
      </div>
    </div>
  );
}