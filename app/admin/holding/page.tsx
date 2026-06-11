"use client";

export default async function HoldingPage() {
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    color: "#e8e0d0",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: "0",
    margin: "0",
  };

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0a0a12 0%, #0f0f1a 50%, #050508 100%)",
    borderBottom: "1px solid rgba(200, 169, 110, 0.3)",
    padding: "24px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const logoStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#c8a96e",
    letterSpacing: "2px",
    textTransform: "uppercase",
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: "rgba(200, 169, 110, 0.15)",
    border: "1px solid rgba(200, 169, 110, 0.4)",
    color: "#c8a96e",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "1px",
  };

  const mainStyle: React.CSSProperties = {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "40px 40px",
  };

  const titleSectionStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "60px",
  };

  const mainTitleStyle: React.CSSProperties = {
    fontSize: "48px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #c8a96e 0%, #f0d898 50%, #c8a96e 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "12px",
    letterSpacing: "-1px",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "18px",
    color: "rgba(232, 224, 208, 0.6)",
    fontWeight: "300",
    letterSpacing: "3px",
    textTransform: "uppercase",
  };

  const gridThreeStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
    marginBottom: "40px",
  };

  const gridTwoStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    marginBottom: "40px",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "16px",
    padding: "28px",
    position: "relative",
    overflow: "hidden",
  };

  const cardGlowStyle: React.CSSProperties = {
    ...cardStyle,
    background: "linear-gradient(135deg, rgba(200, 169, 110, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
    border: "1px solid rgba(200, 169, 110, 0.35)",
    boxShadow: "0 0 40px rgba(200, 169, 110, 0.08), inset 0 1px 0 rgba(200, 169, 110, 0.1)",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "700",
    color: "rgba(200, 169, 110, 0.7)",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "16px",
  };

  const cardValueStyle: React.CSSProperties = {
    fontSize: "36px",
    fontWeight: "800",
    color: "#c8a96e",
    marginBottom: "8px",
    lineHeight: "1",
  };

  const cardSubStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(232, 224, 208, 0.5)",
    lineHeight: "1.5",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: "700",
    color: "#c8a96e",
    marginBottom: "24px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const structureCardStyle: React.CSSProperties = {
    ...cardGlowStyle,
    padding: "32px",
  };

  const entityRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid rgba(200, 169, 110, 0.1)",
  };

  const entityNameStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#e8e0d0",
  };

  const entityTypeStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(200, 169, 110, 0.6)",
    letterSpacing: "1px",
    marginTop: "4px",
  };

  const percentBadgeStyle: React.CSSProperties = {
    backgroundColor: "rgba(200, 169, 110, 0.15)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    color: "#c8a96e",
    padding: "8px 20px",
    borderRadius: "30px",
    fontSize: "18px",
    fontWeight: "800",
  };

  const fluxCardStyle: React.CSSProperties = {
    ...cardStyle,
    padding: "32px",
  };

  const fluxRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  };

  const fluxLabelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "rgba(232, 224, 208, 0.8)",
  };

  const fluxIconStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "rgba(200, 169, 110, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  };

  const fluxRateStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: "700",
    color: "#c8a96e",
  };

  const taxCardStyle: React.CSSProperties = {
    ...cardGlowStyle,
    padding: "32px",
    gridColumn: "1 / -1",
  };

  const savingsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginTop: "24px",
  };

  const savingItemStyle: React.CSSProperties = {
    backgroundColor: "rgba(200, 169, 110, 0.08)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  };

  const savingValueStyle: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: "800",
    color: "#c8a96e",
    marginBottom: "8px",
  };

  const savingLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(232, 224, 208, 0.5)",
    letterSpacing: "1px",
    textTransform: "uppercase",
    lineHeight: "1.4",
  };

  const progressBarContainerStyle: React.CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: "4px",
    height: "6px",
    marginTop: "16px",
    overflow: "hidden",
  };

  const progressFillStyle = (width: string): React.CSSProperties => ({
    height: "100%",
    background: "linear-gradient(90deg, #c8a96e, #f0d898)",
    borderRadius: "4px",
    width: width,
  });

  const statusDotStyle = (color: string): React.CSSProperties => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: color,
    display: "inline-block",
    marginRight: "8px",
    boxShadow: `0 0 6px ${color}`,
  });

  const dividerStyle: React.CSSProperties = {
    borderColor: "rgba(200, 169, 110, 0.15)",
    margin: "0 0 16px 0",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "700",
    color: "rgba(200, 169, 110, 0.6)",
    letterSpacing: "2px",
    textTransform: "uppercase",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: "14px",
    color: "rgba(232, 224, 208, 0.85)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  };

  const tdGoldStyle: React.CSSProperties = {
    ...tdStyle,
    color: "#c8a96e",
    fontWeight: "700",
  };

  const footerStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(200, 169, 110, 0.15)",
    padding: "24px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "40px",
  };

  const footerTextStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "rgba(232, 224, 208, 0.3)",
    letterSpacing: "1px",
  };

  const connectedBadgeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    color: "rgba(34, 197, 94, 0.9)",
    fontWeight: "600",
  };

  const arrowStyle: React.CSSProperties = {
    textAlign: "center",
    color: "rgba(200, 169, 110, 0.5)",
    fontSize: "20px",
    padding: "8px 0",
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={logoStyle}>AcadémIA Pro</div>
          <div style={badgeStyle}>HOLDING DASHBOARD</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={connectedBadgeStyle}>
            <span style={statusDotStyle("#22c55e")}></span>
            Supabase Connected
          </div>
          <div style={{ fontSize: "12px", color: "rgba(232, 224, 208, 0.4)", letterSpacing: "1px" }}>
            Dernière sync: {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      </header>

      <main style={mainStyle}>
        <div style={titleSectionStyle}>
          <h1 style={mainTitleStyle}>Structure Holding</h1>
          <p style={subtitleStyle}>Optimisation Fiscale Internationale · Groupe AcadémIA</p>
        </div>

        <div style={gridThreeStyle}>
          <div style={cardGlowStyle}>
            <div style={cardTitleStyle}>Économie Fiscale Annuelle</div>
            <div style={cardValueStyle}>€127,400</div>
            <div style={cardSubStyle}>Estimée sur base revenus 2024</div>
            <div style={progressBarContainerStyle}>
              <div style={progressFillStyle("78%")}></div>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(200, 169, 110, 0.5)", marginTop: "8px" }}>78% optimisation atteinte</div>
          </div>

          <div style={cardGlowStyle}>
            <div style={cardTitleStyle}>Taux IS Effectif Groupe</div>
            <div style={cardValueStyle}>12.4%</div>
            <div style={cardSubStyle}>vs 25% IS France standard</div>
            <div style={progressBarContainerStyle}>
              <div style={progressFillStyle("50%")}></div>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(200, 169, 110, 0.5)", marginTop: "8px" }}>Différentiel: -12.6 pts</div>
          </div>

          <div style={cardGlowStyle}>
            <div style={cardTitleStyle}>Flux Inter-Entités / An</div>
            <div style={cardValueStyle}>€842,000</div>
            <div style={cardSubStyle}>Total transactions intragroupe</div>
            <div style={progressBarContainerStyle}>
              <div style={progressFillStyle("91%")}></div>
            </div>
            <div style={{ fontSize: "11px