export default function OnboardingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Bienvenue sur AcadémIA Pro</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>Configurons votre espace en 5 etapes</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Etape 1 · Bienvenue</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Bienvenue dans votre espace AcadémIA Pro. Votre agent IA personnel est pret a vous accompagner 24h/24.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Etape 2 · Votre Profil</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Completez votre profil : prenom · metier · objectif principal. Cela permet a votre agent IA de personnaliser votre parcours.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Etape 3 · Vos Objectifs</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Que souhaitez-vous accomplir ? Changer de metier · progresser · apprendre l IA · ameliorer votre bien-etre ?</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Etape 4 · Recommandations</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Basees sur votre profil · voici les formations et seances recommandees par votre agent IA.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Etape 5 · Premier Acces</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Votre espace est configure. Commencez par le module d introduction gratuit ou reservez votre premiere seance.</p>
        </div>
      </div>
    </div>
  );
}