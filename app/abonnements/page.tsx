"use client";

import { useState } from "react";

type TabType = "visio" | "audio";

interface Plan {
  name: string;
  price: number;
  bestSeller: boolean;
  features: string[];
}

const visioPlans: Plan[] = [
  {
    name: "Starter",
    price: 35,
    bestSeller: false,
    features: [
      "2 séances vidéo / mois",
      "Agent IA 24h/24",
      "Tableau de bord personnel",
      "Support par email",
    ],
  },
  {
    name: "Bien-être",
    price: 79,
    bestSeller: true,
    features: [
      "6 séances vidéo / mois",
      "Agent IA 24h/24 prioritaire",
      "Tableau de bord avancé",
      "Support prioritaire",
      "Ressources exclusives",
    ],
  },
  {
    name: "Intensif",
    price: 129,
    bestSeller: false,
    features: [
      "Séances vidéo illimitées",
      "Agent IA 24h/24 dédié",
      "Tableau de bord premium",
      "Support VIP 7j/7",
      "Ressources exclusives",
      "Bilan mensuel personnalisé",
    ],
  },
];

const audioPlans: Plan[] = [
  {
    name: "Starter",
    price: 25,
    bestSeller: false,
    features: [
      "2 séances audio / mois",
      "Agent IA 24h/24",
      "Tableau de bord personnel",
      "Support par email",
    ],
  },
  {
    name: "Bien-être",
    price: 55,
    bestSeller: true,
    features: [
      "6 séances audio / mois",
      "Agent IA 24h/24 prioritaire",
      "Tableau de bord avancé",
      "Support prioritaire",
      "Ressources exclusives",
    ],
  },
  {
    name: "Intensif",
    price: 89,
    bestSeller: false,
    features: [
      "Séances audio illimitées",
      "Agent IA 24h/24 dédié",
      "Tableau de bord premium",
      "Support VIP 7j/7",
      "Ressources exclusives",
      "Bilan mensuel personnalisé",
    ],
  },
];

export default function AbonnementsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("visio");
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);

  const plans = activeTab === "visio" ? visioPlans : audioPlans;

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: "#ffffff",
    padding: "0 16px 80px",
  };

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    paddingTop: "64px",
    paddingBottom: "48px",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "rgba(200, 169, 110, 0.12)",
    border: "1px solid rgba(200, 169, 110, 0.35)",
    borderRadius: "999px",
    padding: "6px 18px",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "#c8a96e",
    marginBottom: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "clamp(28px, 5vw, 52px)",
    fontWeight: 800,
    lineHeight: 1.15,
    margin: "0 0 16px",
    background: "linear-gradient(135deg, #ffffff 0%, #c8a96e 60%, #e8c98e 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "16px",
    color: "rgba(255,255,255,0.55)",
    margin: "0 auto",
    maxWidth: "480px",
    lineHeight: 1.6,
  };

  const tabContainerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    marginBottom: "48px",
  };

  const tabWrapperStyle: React.CSSProperties = {
    display: "inline-flex",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "14px",
    padding: "5px",
    gap: "4px",
  };

  const getTabStyle = (tab: TabType): React.CSSProperties => ({
    padding: "10px 32px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
    transition: "all 0.25s ease",
    backgroundColor: activeTab === tab ? "#c8a96e" : "transparent",
    color: activeTab === tab ? "#050508" : "rgba(255,255,255,0.5)",
    boxShadow: activeTab === tab ? "0 4px 20px rgba(200,169,110,0.35)" : "none",
  });

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
  };

  const getCardStyle = (plan: Plan, index: number): React.CSSProperties => ({
    position: "relative",
    borderRadius: "20px",
    padding: "36px 28px",
    cursor: "pointer",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    transform: hoveredPlan === index ? "translateY(-6px)" : plan.bestSeller ? "translateY(-4px)" : "translateY(0)",
    backgroundColor: plan.bestSeller
      ? "rgba(200, 169, 110, 0.07)"
      : "rgba(255,255,255,0.025)",
    border: plan.bestSeller
      ? "1px solid rgba(200, 169, 110, 0.6)"
      : hoveredPlan === index
      ? "1px solid rgba(200, 169, 110, 0.3)"
      : "1px solid rgba(255,255,255,0.07)",
    boxShadow: plan.bestSeller
      ? "0 0 40px rgba(200,169,110,0.15), 0 20px 60px rgba(0,0,0,0.4)"
      : hoveredPlan === index
      ? "0 16px 40px rgba(0,0,0,0.35)"
      : "0 4px 20px rgba(0,0,0,0.2)",
  });

  const bestSellerBadgeStyle: React.CSSProperties = {
    position: "absolute",
    top: "-13px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#c8a96e",
    color: "#050508",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "5px 16px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 16px rgba(200,169,110,0.5)",
  };

  const planNameStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "#c8a96e",
    marginBottom: "16px",
  };

  const priceContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    gap: "4px",
    marginBottom: "8px",
  };

  const priceStyle: React.CSSProperties = {
    fontSize: "52px",
    fontWeight: 800,
    lineHeight: 1,
    color: "#ffffff",
  };

  const currencyStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: 700,
    color: "#c8a96e",
    marginBottom: "6px",
  };

  const periodStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "rgba(255,255,255,0.4)",
    marginBottom: "6px",
    paddingBottom: "2px",
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    backgroundColor: "rgba(255,255,255,0.07)",
    margin: "24px 0",
  };

  const featureListStyle: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
    margin: "0 0 28px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const featureItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "rgba(255,255,255,0.75)",
  };

  const checkIconStyle: React.CSSProperties = {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "rgba(200,169,110,0.15)",
    border: "1px solid rgba(200,169,110,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "10px",
    color: "#c8a96e",
  };

  const getButtonStyle = (plan: Plan, index: number): React.CSSProperties => ({
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: plan.bestSeller ? "none" : "1px solid rgba(200,169,110,0.4)",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 700,
    transition: "all 0.25s ease",
    backgroundColor: plan.bestSeller
      ? hoveredButton === index
        ? "#d4b87e"
        : "#c8a96e"
      : hoveredButton === index
      ? "rgba(200,169,110,0.12)"
      : "transparent",
    color: plan.bestSeller ? "#050508" : "#c8a96e",
    boxShadow: plan.bestSeller
      ? hoveredButton === index
        ? "0 8px 28px rgba(200,169,110,0.45)"
        : "0 4px 20px rgba(200,169,110,0.3)"
      : "none",
    letterSpacing: "0.5px",
  });

  const guaranteesStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "32px",
    maxWidth: "700px",
    margin: "56px auto 0",
  };

  const guaranteeItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
  };

  const guaranteeIconStyle: React.CSSProperties = {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "rgba(200,169,110,0.1)",
    border: "1px solid rgba(200,169,110,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  };

  const guaranteeLabelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
  };

  const guarantees = [
    { icon: "🔓", label: "Sans engagement" },
    { icon: "🛡️", label: "Garantie 30 jours" },
    { icon: "🤖", label: "Agent IA 24h/24" },
  ];

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={badgeStyle}>AcadémIA Pro</div>
        <h1 style={titleStyle}>
          Choisissez votre
          <br />
          formule d&apos;accompagnement
        </h1>
        <p style={subtitleStyle}>
          Des séances personnalisées adaptées à votre rythme, avec un agent IA disponible à tout moment.
        </p>
      </div>

      <div style={tabContainerStyle}>
        <div style={tabWrapperStyle}>
          <button
            style={getTabStyle("visio")}
            onClick={() => setActiveTab("visio")}
          >
            📹 Visio
          </button>
          <button
            style={getTabStyle("audio")}
            onClick={() => setActiveTab("audio")}
          >
            🎧 Audio
          </button>
        </div>
      </div>

      <div style={gridStyle}>
        {plans.map((plan, index) => (
          <div
            key={`${activeTab}-${plan.name}`}
            style={getCardStyle(plan, index)}
            onMouseEnter={() => setHoveredPlan(index)}
            onMouseLeave={() => setHoveredPlan(null)}
          >
            {plan.bestSeller && (
              <div style={bestSellerBadgeStyle}>⭐ Best-seller</div>
            )}

            <div style={planNameStyle}>{plan.name}</div>

            <div style={priceContainerStyle}>
              <span style={currencyStyle}>€</span>
              <span style={priceStyle}>{plan.price}</span>
              <span style={periodStyle}>/mois</span>
            </div>

            <div style={dividerStyle} />

            <ul style={featureListStyle}>
              {plan.features.map((feature, fIndex) => (
                <li key={fIndex} style={featureItemStyle}>
                  <span style={checkIconStyle}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              style={getButtonStyle(plan, index)}
              onMouseEnter={() => setHoveredButton(index)}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {plan.bestSeller ? "Commencer maint