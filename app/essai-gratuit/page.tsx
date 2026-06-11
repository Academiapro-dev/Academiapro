import { useState } from "react";

const App = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"trial" | "offer">("trial");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setStep("offer");
      setSubmitted(true);
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "20px",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#0d0d14",
    border: "1px solid #c8a96e33",
    borderRadius: "16px",
    padding: "48px 40px",
    maxWidth: "520px",
    width: "100%",
    boxShadow: "0 0 60px #c8a96e18",
    textAlign: "center",
  };

  const goldStyle: React.CSSProperties = {
    color: "#c8a96e",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "8px",
    lineHeight: "1.2",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "16px",
    color: "#9999aa",
    marginBottom: "32px",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#c8a96e22",
    border: "1px solid #c8a96e55",
    color: "#c8a96e",
    borderRadius: "999px",
    padding: "6px 16px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "24px",
    letterSpacing: "0.5px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "10px",
    border: "1px solid #c8a96e44",
    backgroundColor: "#1a1a2e",
    color: "#ffffff",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "14px",
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
    color: "#050508",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    letterSpacing: "0.5px",
  };

  const freeNoteStyle: React.CSSProperties = {
    marginTop: "16px",
    fontSize: "13px",
    color: "#666677",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  };

  const moduleTagStyle: React.CSSProperties = {
    backgroundColor: "#c8a96e11",
    border: "1px solid #c8a96e33",
    borderRadius: "8px",
    padding: "10px 16px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  };

  const moduleTextStyle: React.CSSProperties = {
    color: "#ccccdd",
    fontSize: "14px",
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    backgroundColor: "#c8a96e22",
    margin: "32px 0",
  };

  const priceBigStyle: React.CSSProperties = {
    fontSize: "56px",
    fontWeight: "900",
    color: "#c8a96e",
    lineHeight: "1",
  };

  const priceSubStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#9999aa",
    marginTop: "4px",
    marginBottom: "28px",
  };

  const featureListStyle: React.CSSProperties = {
    textAlign: "left",
    marginBottom: "28px",
  };

  const featureItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
    color: "#ccccdd",
    fontSize: "15px",
  };

  const checkStyle: React.CSSProperties = {
    color: "#c8a96e",
    fontWeight: "bold",
    fontSize: "16px",
    flexShrink: 0,
    marginTop: "1px",
  };

  const skipStyle: React.CSSProperties = {
    marginTop: "14px",
    fontSize: "13px",
    color: "#555566",
    cursor: "pointer",
    textDecoration: "underline",
  };

  const successBadgeStyle: React.CSSProperties = {
    backgroundColor: "#1a2e1a",
    border: "1px solid #4caf5055",
    borderRadius: "10px",
    padding: "12px 20px",
    marginBottom: "28px",
    color: "#81c784",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
  };

  if (step === "offer") {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={successBadgeStyle}>
            <span>{"✓"}</span>
            <span>Accès essai activé pour {email}</span>
          </div>

          <div style={badgeStyle}>{"🚀 Offre spéciale"}</div>

          <h1 style={titleStyle}>
            Passez au niveau{" "}
            <span style={goldStyle}>supérieur</span>
          </h1>

          <p style={subtitleStyle}>
            Débloquez l'intégralité de la formation avec le Starter Pack
          </p>

          <div style={dividerStyle} />

          <div style={priceBigStyle}>47€</div>
          <p style={priceSubStyle}>paiement unique · accès à vie</p>

          <div style={featureListStyle}>
            {[
              "Tous les modules F128 complets (1 à 8)",
              "Fiches récapitulatives PDF téléchargeables",
              "Accès aux mises à jour futures inclus",
              "Communauté privée membres Starter",
              "Session Q&A mensuelle en direct",
              "Certificat de complétion officiel",
            ].map((feature, index) => (
              <div key={index} style={featureItemStyle}>
                <span style={checkStyle}>{"✓"}</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <button
            style={buttonStyle}
            onClick={() => alert("Redirection vers le paiement sécurisé...")}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "0.9";
              (e.target as HTMLButtonElement).style.transform = "scale(1.01)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
              (e.target as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            {"Obtenir le Starter Pack — 47€"}
          </button>

          <p style={skipStyle} onClick={() => alert("Continuer avec l'essai gratuit...")}>
            Non merci, continuer avec l'essai gratuit uniquement
          </p>

          <p style={{ ...freeNoteStyle, marginTop: "20px" }}>
            <span>{"🔒"}</span>
            Paiement sécurisé SSL · Remboursement 30 jours
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={badgeStyle}>{"✨ Essai Gratuit"}</div>

        <h1 style={titleStyle}>
          Commencez <span style={goldStyle}>gratuitement</span>
        </h1>

        <p style={subtitleStyle}>
          Accédez au Module 1 de la formation F128 sans engagement
        </p>

        <div style={moduleTagStyle}>
          <span style={{ fontSize: "20px" }}>{"📚"}</span>
          <span style={moduleTextStyle}>
            <strong style={{ color: "#c8a96e" }}>Module 1 — F128</strong>
            {" · Accès immédiat · 100% gratuit"}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Votre adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "#c8a96e";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "#c8a96e44";
            }}
          />

          <button
            type="submit"
            style={buttonStyle}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
            }}
          >
            {"Commencer mon essai gratuit →"}
          </button>
        </form>

        <div style={freeNoteStyle}>
          <span>{"🔒"}</span>
          <span>Sans carte bancaire · Aucun engagement</span>
        </div>

        <div style={dividerStyle} />

        <div style={{ display: "flex", gap: "24px", justifyContent: "center" }}>
          {[
            { icon: "⚡", label: "Accès immédiat" },
            { icon: "🎯", label: "Module 1 complet" },
            { icon: "🆓", label: "100% gratuit" },
          ].map((item, index) => (
            <div
              key={index}
              style={{ textAlign: "center", color: "#9999aa", fontSize: "13px" }}
            >
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{item.icon}</div>
              <div>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;