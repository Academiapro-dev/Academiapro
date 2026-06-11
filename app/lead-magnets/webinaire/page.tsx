import React, { useState } from "react";

const WebinarePage: React.FC = () => {
  const [form, setForm] = useState({ prenom: "", email: "", telephone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.prenom && form.email) {
      setSubmitted(true);
    }
  };

  const gold = "#c8a96e";
  const darkGold = "#a8894e";
  const lightGold = "#e8c98e";

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    padding: "40px 20px",
    position: "relative",
    overflow: "hidden",
  };

  const glowStyle: React.CSSProperties = {
    position: "absolute",
    top: "10%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "rgba(200,169,110,0.12)",
    border: "1px solid rgba(200,169,110,0.4)",
    color: gold,
    fontSize: "11px",
    fontFamily: "'Arial', sans-serif",
    letterSpacing: "3px",
    textTransform: "uppercase" as const,
    padding: "8px 20px",
    borderRadius: "30px",
    marginBottom: "32px",
  };

  const titleStyle: React.CSSProperties = {
    color: "#ffffff",
    fontSize: "clamp(28px, 5vw, 52px)",
    fontWeight: "700",
    lineHeight: "1.2",
    textAlign: "center" as const,
    marginBottom: "8px",
    maxWidth: "800px",
  };

  const titleGoldStyle: React.CSSProperties = {
    color: gold,
    display: "block",
  };

  const subtitleStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.55)",
    fontSize: "clamp(14px, 2vw, 18px)",
    fontFamily: "'Arial', sans-serif",
    textAlign: "center" as const,
    maxWidth: "560px",
    lineHeight: "1.7",
    marginBottom: "48px",
    marginTop: "16px",
  };

  const infoBandStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "12px",
    justifyContent: "center",
    marginBottom: "52px",
  };

  const infoPillStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(200,169,110,0.08)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "40px",
    padding: "10px 20px",
    color: "rgba(255,255,255,0.85)",
    fontSize: "13px",
    fontFamily: "'Arial', sans-serif",
  };

  const iconStyle: React.CSSProperties = {
    color: gold,
    fontSize: "15px",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.2)",
    borderRadius: "20px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "480px",
    backdropFilter: "blur(10px)",
    position: "relative" as const,
  };

  const cardGlowStyle: React.CSSProperties = {
    position: "absolute",
    top: "-1px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "200px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, " + gold + ", transparent)",
    borderRadius: "2px",
  };

  const formTitleStyle: React.CSSProperties = {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "600",
    textAlign: "center" as const,
    marginBottom: "6px",
  };

  const formSubtitleStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.4)",
    fontSize: "13px",
    fontFamily: "'Arial', sans-serif",
    textAlign: "center" as const,
    marginBottom: "32px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "rgba(255,255,255,0.6)",
    fontSize: "12px",
    fontFamily: "'Arial', sans-serif",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
  };

  const getInputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    backgroundColor: focused === name ? "rgba(200,169,110,0.07)" : "rgba(255,255,255,0.04)",
    border: focused === name ? "1px solid rgba(200,169,110,0.6)" : "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "14px 16px",
    color: "#ffffff",
    fontSize: "15px",
    fontFamily: "'Arial', sans-serif",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box" as const,
  });

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: "20px",
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    background: "linear-gradient(135deg, " + gold + " 0%, " + darkGold + " 100%)",
    border: "none",
    borderRadius: "10px",
    padding: "16px",
    color: "#050508",
    fontSize: "15px",
    fontWeight: "700",
    fontFamily: "'Arial', sans-serif",
    letterSpacing: "1px",
    cursor: "pointer",
    marginTop: "8px",
    textTransform: "uppercase" as const,
    transition: "opacity 0.2s ease",
  };

  const guaranteeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    color: "rgba(255,255,255,0.3)",
    fontSize: "12px",
    fontFamily: "'Arial', sans-serif",
    marginTop: "20px",
  };

  const successStyle: React.CSSProperties = {
    textAlign: "center" as const,
    padding: "20px 0",
  };

  const successIconStyle: React.CSSProperties = {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "rgba(200,169,110,0.15)",
    border: "2px solid " + gold,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px auto",
    fontSize: "28px",
  };

  const successTitleStyle: React.CSSProperties = {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "600",
    marginBottom: "12px",
  };

  const successTextStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.5)",
    fontSize: "14px",
    fontFamily: "'Arial', sans-serif",
    lineHeight: "1.7",
  };

  const dividerStyle: React.CSSProperties = {
    width: "60px",
    height: "1px",
    backgroundColor: "rgba(200,169,110,0.3)",
    margin: "0 auto 48px auto",
  };

  const featuresStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
    marginBottom: "52px",
    maxWidth: "400px",
    width: "100%",
  };

  const featureRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  };

  const checkStyle: React.CSSProperties = {
    color: gold,
    fontSize: "16px",
    marginTop: "1px",
    flexShrink: 0,
  };

  const featureTextStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.65)",
    fontSize: "14px",
    fontFamily: "'Arial', sans-serif",
    lineHeight: "1.5",
  };

  const features = [
    "Les 3 outils IA indispensables pour automatiser vos tâches répétitives",
    "Comment créer votre premier workflow automatisé en moins d'une heure",
    "Les erreurs à éviter pour ne pas perdre de temps ni d'argent",
    "Un plan d'action concret sur 7 jours à appliquer dès le lendemain",
  ];

  return (
    <div style={containerStyle}>
      <div style={glowStyle} />

      <div style={badgeStyle}>
        Webinaire Gratuit — Chaque 1er Dimanche
      </div>

      <h1 style={titleStyle}>
        Automatiser son business
        <span style={titleGoldStyle}>avec l&apos;IA en 7 jours</span>
      </h1>

      <div style={dividerStyle} />

      <p style={subtitleStyle}>
        Rejoignez notre webinaire mensuel de 60 minutes et découvrez comment l&apos;intelligence artificielle peut transformer votre quotidien professionnel, sans compétences techniques requises.
      </p>

      <div style={infoBandStyle}>
        <div style={infoPillStyle}>
          <span style={iconStyle}>◷</span>
          <span>60 minutes</span>
        </div>
        <div style={infoPillStyle}>
          <span style={iconStyle}>◈</span>
          <span>1er dimanche du mois</span>
        </div>
        <div style={infoPillStyle}>
          <span style={iconStyle}>◷</span>
          <span>20h00 — heure française</span>
        </div>
        <div style={infoPillStyle}>
          <span style={iconStyle}>✦</span>
          <span>100% gratuit</span>
        </div>
      </div>

      <div style={featuresStyle}>
        {features.map((f, i) => (
          <div key={i} style={featureRowStyle}>
            <span style={checkStyle}>✓</span>
            <span style={featureTextStyle}>{f}</span>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <div style={cardGlowStyle} />

        {submitted ? (
          <div style={successStyle}>
            <div style={successIconStyle}>
              <span style={{ color: gold }}>✓</span>
            </div>
            <div style={successTitleStyle}>Vous êtes inscrit !</div>
            <p style={successTextStyle}>
              Un email de confirmation vient de vous être envoyé.<br />
              Rendez-vous le 1er dimanche du mois à 20h00.<br />
              <span style={{ color: gold }}>On a hâte de vous retrouver.</span>
            </p>
          </div>
        ) : (
          <>
            <div style={formTitleStyle}>Réserver ma place gratuite</div>
            <div style={formSubtitleStyle}>Places limitées — Inscription en 30 secondes</div>

            <form onSubmit={handleSubmit}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  placeholder="Votre prénom"
                  value={form.prenom}
                  onChange={handleChange}
                  onFocus={() => setFocused("prenom")}
                  onBlur={() => setFocused(null)}
                  style={getInputStyle("prenom")}
                  required
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Adresse email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  style={getInputStyle("email")}
                  required
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  Téléphone{" "}
                  <span style={{ color: "rgba(255,255,255,0.25)", textTransform: "none" as const, letterSpacing: "0" }}>
                    (optionnel)
                  </span>
                </label>
                <input
                  type="tel"
                  name="telephone"
                  placeholder="+33 6 00 00 00 00"
                  value={form.telephone}
                  onChange={handleChange}
                  onFocus={() => setFocused("telephone")}
                  onBlur={() => setFocused(null)}
                  style={getInputStyle("telephone")}
                />
              </div>

              <button type="submit" style={buttonStyle}>
                Je réserve ma place →
              </button>
            </form>

            <div style={guaranteeStyle}>
              <span>🔒</span>
              <span>Vos données sont protégées — Zéro spam, désinscription libre</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WebinarePage;