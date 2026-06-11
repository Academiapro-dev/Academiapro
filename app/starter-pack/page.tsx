import { useState } from "react";

const gold = "#c8a96e";
const dark = "#050508";
const darkCard = "#0d0d14";
const darkBorder = "#1a1a2e";

export default function StarterPack() {
  const [hoverMain, setHoverMain] = useState(false);
  const [hoverUpsell, setHoverUpsell] = useState(false);
  const [hoverItem1, setHoverItem1] = useState(false);
  const [hoverItem2, setHoverItem2] = useState(false);
  const [hoverItem3, setHoverItem3] = useState(false);
  const [hoverItem4, setHoverItem4] = useState(false);

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: dark,
    color: "#ffffff",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "40px 20px",
  };

  const headerStyle = {
    textAlign: "center" as const,
    marginBottom: "48px",
    maxWidth: "700px",
  };

  const badgeStyle = {
    display: "inline-block",
    backgroundColor: "rgba(200, 169, 110, 0.15)",
    border: "1px solid rgba(200, 169, 110, 0.4)",
    color: gold,
    fontSize: "12px",
    fontWeight: "700" as const,
    letterSpacing: "3px",
    textTransform: "uppercase" as const,
    padding: "8px 20px",
    borderRadius: "100px",
    marginBottom: "24px",
  };

  const h1Style = {
    fontSize: "clamp(32px, 5vw, 52px)",
    fontWeight: "800" as const,
    lineHeight: "1.15",
    margin: "0 0 16px 0",
    color: "#ffffff",
  };

  const goldText = {
    color: gold,
  };

  const subtitleStyle = {
    fontSize: "18px",
    color: "rgba(255,255,255,0.55)",
    lineHeight: "1.6",
    margin: "0",
  };

  const checkmarkStyle = {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "rgba(200, 169, 110, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "11px",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
    width: "100%",
    maxWidth: "900px",
    marginBottom: "40px",
  };

  const itemCardBase = {
    backgroundColor: darkCard,
    border: "1px solid",
    borderRadius: "16px",
    padding: "28px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    transition: "all 0.25s ease",
    cursor: "default",
  };

  const iconBoxStyle = {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    backgroundColor: "rgba(200, 169, 110, 0.12)",
    border: "1px solid rgba(200, 169, 110, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginBottom: "4px",
  };

  const itemTitleStyle = {
    fontSize: "18px",
    fontWeight: "700" as const,
    color: "#ffffff",
    margin: "0",
  };

  const itemDescStyle = {
    fontSize: "14px",
    color: "rgba(255,255,255,0.5)",
    margin: "0",
    lineHeight: "1.6",
  };

  const itemValueStyle = {
    fontSize: "13px",
    color: gold,
    fontWeight: "600" as const,
    marginTop: "auto",
    paddingTop: "12px",
    borderTop: "1px solid rgba(200, 169, 110, 0.15)",
  };

  const mainCTACard = {
    width: "100%",
    maxWidth: "900px",
    backgroundColor: darkCard,
    border: "2px solid",
    borderColor: hoverMain ? gold : "rgba(200, 169, 110, 0.4)",
    borderRadius: "20px",
    padding: "40px",
    marginBottom: "24px",
    transition: "all 0.25s ease",
    transform: hoverMain ? "translateY(-2px)" : "translateY(0)",
    boxShadow: hoverMain ? "0 20px 60px rgba(200, 169, 110, 0.15)" : "0 8px 32px rgba(0,0,0,0.4)",
  };

  const priceRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "20px",
    marginBottom: "28px",
  };

  const priceBlockStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  };

  const priceLabelStyle = {
    fontSize: "13px",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase" as const,
    letterSpacing: "2px",
    fontWeight: "600" as const,
  };

  const priceAmountStyle = {
    fontSize: "clamp(40px, 6vw, 64px)",
    fontWeight: "800" as const,
    color: gold,
    lineHeight: "1",
  };

  const priceSubStyle = {
    fontSize: "14px",
    color: "rgba(255,255,255,0.35)",
  };

  const featureListStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    marginBottom: "32px",
  };

  const featureItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "15px",
    color: "rgba(255,255,255,0.8)",
  };

  const btnMainStyle = {
    width: "100%",
    padding: "20px",
    backgroundColor: hoverMain ? "#d4b87a" : gold,
    color: dark,
    border: "none",
    borderRadius: "14px",
    fontSize: "18px",
    fontWeight: "800" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
    letterSpacing: "0.5px",
  };

  const upsellCard = {
    width: "100%",
    maxWidth: "900px",
    backgroundColor: "rgba(200, 169, 110, 0.05)",
    border: "1px solid",
    borderColor: hoverUpsell ? "rgba(200, 169, 110, 0.6)" : "rgba(200, 169, 110, 0.2)",
    borderRadius: "20px",
    padding: "32px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "24px",
    transition: "all 0.25s ease",
    transform: hoverUpsell ? "translateY(-1px)" : "translateY(0)",
  };

  const upsellLeftStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    flex: 1,
    minWidth: "220px",
  };

  const upsellBadgeStyle = {
    display: "inline-block",
    backgroundColor: "rgba(200, 169, 110, 0.2)",
    color: gold,
    fontSize: "11px",
    fontWeight: "700" as const,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    padding: "4px 12px",
    borderRadius: "100px",
    width: "fit-content",
  };

  const upsellTitleStyle = {
    fontSize: "20px",
    fontWeight: "700" as const,
    color: "#ffffff",
    margin: "0",
  };

  const upsellDescStyle = {
    fontSize: "14px",
    color: "rgba(255,255,255,0.45)",
    margin: "0",
    lineHeight: "1.5",
  };

  const upsellPriceBlockStyle = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: "8px",
  };

  const upsellPriceStyle = {
    fontSize: "36px",
    fontWeight: "800" as const,
    color: gold,
    lineHeight: "1",
  };

  const btnUpsellStyle = {
    padding: "14px 28px",
    backgroundColor: "transparent",
    color: gold,
    border: "1.5px solid",
    borderColor: gold,
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
    letterSpacing: "0.3px",
    whiteSpace: "nowrap" as const,
    ...(hoverUpsell ? { backgroundColor: "rgba(200, 169, 110, 0.1)" } : {}),
  };

  const footerStyle = {
    marginTop: "40px",
    textAlign: "center" as const,
    color: "rgba(255,255,255,0.25)",
    fontSize: "13px",
    lineHeight: "1.8",
    maxWidth: "500px",
  };

  const dividerStyle = {
    width: "60px",
    height: "2px",
    backgroundColor: gold,
    margin: "0 auto 32px auto",
    borderRadius: "2px",
    opacity: 0.6,
  };

  const items = [
    {
      icon: "🤖",
      title: "100 Prompts Claude",
      desc: "Bibliothèque exclusive de 100 prompts optimisés pour Claude. Productivité, création, business et bien plus.",
      value: "Valeur : indispensable pour débuter",
      hover: hoverItem1,
      setHover: setHoverItem1,
    },
    {
      icon: "📘",
      title: "Guide PDF Complet",
      desc: "Le guide ultime pour maîtriser l'IA dans votre quotidien. Méthodes, workflows et cas d'usage concrets.",
      value: "Guide structuré pas-à-pas",
      hover: hoverItem2,
      setHover: setHoverItem2,
    },
    {
      icon: "🎓",
      title: "Module 1 — Formation",
      desc: "Accès au premier module de la formation complète. Fondations solides pour exploiter l'IA au maximum.",
      value: "Aperçu de la formation F128",
      hover: hoverItem3,
      setHover: setHoverItem3,
    },
    {
      icon: "💬",
      title: "Accès Discord Privé",
      desc: "Rejoignez la communauté. Entraide, partage de prompts, Q&A live et mises à jour en temps réel.",
      value: "Communauté active et bienveillante",
      hover: hoverItem4,
      setHover: setHoverItem4,
    },
  ];

  const features = [
    "100 prompts Claude prêts à l'emploi",
    "Guide PDF téléchargeable immédiatement",
    "Module 1 de la formation F128 offert",
    "Accès Discord communauté privée",
    "Mises à jour incluses à vie",
    "Accès instantané après paiement",
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={badgeStyle}>Accès Immédiat</div>
        <h1 style={h1Style}>
          Votre <span style={goldText}>Starter Pack</span>
          <br />
          est prêt
        </h1>
        <div style={dividerStyle} />
        <p style={subtitleStyle}>
          Tout ce qu'il vous faut pour démarrer avec l'IA dès aujourd'hui.
          <br />
          Débloquez votre potentiel en moins de 5 minutes.
        </p>
      </div>

      <div style={gridStyle}>
        {items.map((item) => (
          <div
            key={item.title}
            style={{
              ...itemCardBase,
              borderColor: item.hover ? "rgba(200, 169, 110, 0.5)" : darkBorder,
              transform: item.hover ? "translateY(-3px)" : "translateY(0)",
              boxShadow: item.hover ? "0 12px 40px rgba(200, 169, 110, 0.08)" : "none",
            }}
            onMouseEnter={() => item.setHover(true)}
            onMouseLeave={() => item.setHover(false)}
          >
            <div style={iconBoxStyle}>{item.icon}</div>
            <p style={itemTitleStyle}>{item.title}</p>
            <p style={itemDescStyle}>{item.desc}</p>
            <p style={itemValueStyle}>✦ {item.value}</p>
          </div>
        ))}
      </div>

      <div
        style={mainCTACard}
        onMouseEnter={() => setHoverMain(true)}
        onMouseLeave={() => setHoverMain(false)}
      >
        <div style={priceRowStyle}>
          <div style={priceBlockStyle}>
            <span style={priceLabelStyle}>Starter Pack complet</span>
            <span style={priceAmountStyle}>128 €</span>
            <span style={priceSubStyle}>Paiement unique — Accès à vie</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", alignItems: "flex-end" }}>
            {["Téléchargement immédiat", "Satisfait ou remboursé 30j", "Support inclus"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={checkmarkStyle}>
                  <span style={{ color: gold }}>✓</span>
                </div>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={featureListStyle}>
          {features.map((f)