import React, { useState } from "react";

const PricingPage: React.FC = () => {
  const [billingType, setBillingType] = useState<"visio" | "audio">("visio");

  const gold = "#c8a96e";
  const darkBg = "#050508";
  const cardBg = "#0d0d12";
  const cardBorder = "#1e1a14";
  const textLight = "#f5f0e8";
  const textMuted = "#8a7d6b";
  const gradientGold = "linear-gradient(135deg, #c8a96e 0%, #f0d090 50%, #c8a96e 100%)";

  const plans = [
    {
      name: "E-Learning",
      subtitle: "Formation autonome",
      visioPrice: 29,
      audioPrice: 19,
      color: "#8a7d6b",
      highlight: false,
      description: "Accedez aux modules de formation en ligne a votre rythme",
      features: [
        "Acces aux cours pre-enregistres",
        "Quiz et evaluations interactives",
        "Certificat de completion",
        "Support par email",
        "Mises a jour du contenu",
        "Acces mobile inclus",
      ],
    },
    {
      name: "Premium Agent IA",
      subtitle: "Agent intelligent personnalise",
      visioPrice: 59,
      audioPrice: 39,
      color: "#c8a96e",
      highlight: true,
      description: "Beneficiez d un agent IA dedie a votre apprentissage",
      features: [
        "Tout le plan E-Learning",
        "Agent IA personnalise 24h/24",
        "Conversations illimitees",
        "Analyse de progression avancee",
        "Recommandations adaptatives",
        "Integrations API",
        "Support prioritaire",
        "Tableau de bord analytics",
      ],
    },
    {
      name: "Live Avatar IA",
      subtitle: "Experience immersive totale",
      visioPrice: 79,
      audioPrice: 55,
      color: "#e8d4a0",
      highlight: false,
      description: "Avatar IA en temps reel pour une immersion maximale",
      features: [
        "Tout le plan Premium Agent IA",
        "Avatar IA en temps reel",
        "Interaction visuelle live",
        "Emotions et expressions",
        "Studio virtuel personnalise",
        "Multi-langues en temps reel",
        "Enregistrements HD",
        "Manager de compte dedie",
      ],
    },
  ];

  const packs = [
    {
      name: "Pack Starter",
      price: 47,
      period: "unique",
      description: "Decouvrez l IA conversationnelle",
      features: ["5 sessions E-Learning", "1 mois Agent IA", "Support email"],
      badge: null,
    },
    {
      name: "Pack Business",
      price: 297,
      period: "mois",
      description: "Pour les professionnels exigeants",
      features: [
        "Acces complet E-Learning",
        "Agent IA illimite",
        "3 sessions Live Avatar",
        "Rapport mensuel",
        "Support prioritaire",
      ],
      badge: "Populaire",
    },
    {
      name: "Pack Enterprise",
      price: 990,
      period: "mois",
      description: "Solution complete pour equipes",
      features: [
        "Jusqu a 10 utilisateurs",
        "Tous les modules IA",
        "Live Avatar illimite",
        "API access complet",
        "Onboarding dedie",
        "SLA garanti 99.9%",
      ],
      badge: "Pro",
    },
    {
      name: "Pack Annuel Elite",
      price: 3990,
      period: "an",
      description: "La solution ultime pour votre organisation",
      features: [
        "Utilisateurs illimites",
        "Tous les acces Premium",
        "Avatar IA sur mesure",
        "Developpement custom",
        "Account manager dedie",
        "Formation equipe incluse",
        "Integrations sur mesure",
        "Support 24/7 prioritaire",
      ],
      badge: "Elite",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: darkBg,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: textLight,
        overflowX: "hidden",
      }}
    >
      {/* Header Hero */}
      <div
        style={{
          textAlign: "center",
          padding: "80px 24px 60px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            background:
              "radial-gradient(ellipse at center, rgba(200,169,110,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "inline-block",
            border: "1px solid rgba(200,169,110,0.4)",
            borderRadius: "20px",
            padding: "6px 20px",
            marginBottom: "24px",
            fontSize: "13px",
            color: gold,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Tarifs 2024
        </div>
        <h1
          style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: "800",
            margin: "0 0 16px",
            lineHeight: 1.1,
          }}
        >
          Investissez dans votre{" "}
          <span
            style={{
              background: gradientGold,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            intelligence
          </span>
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: textMuted,
            maxWidth: "560px",
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          Des solutions IA adaptees a chaque besoin, de la formation
          autonome a l avatar interactif en temps reel
        </p>

        {/* Toggle Visio / Audio */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: cardBg,
            border: "1px solid " + cardBorder,
            borderRadius: "12px",
            padding: "4px",
          }}
        >
          <button
            onClick={() => setBillingType("visio")}
            style={{
              padding: "10px 28px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              backgroundColor: billingType === "visio" ? gold : "transparent",
              color: billingType === "visio" ? darkBg : textMuted,
            }}
          >
            Visio
          </button>
          <button
            onClick={() => setBillingType("audio")}
            style={{
              padding: "10px 28px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              backgroundColor: billingType === "audio" ? gold : "transparent",
              color: billingType === "audio" ? darkBg : textMuted,
            }}
          >
            Audio
          </button>
        </div>
        <p
          style={{
            marginTop: "12px",
            fontSize: "13px",
            color: textMuted,
          }}
        >
          {billingType === "audio"
            ? "Prix reduits pour le mode audio uniquement"
            : "Prix complets avec video haute qualite"}
        </p>
      </div>

      {/* Plans principaux */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {plans.map((plan, index) => {
            const price =
              billingType === "visio" ? plan.visioPrice : plan.audioPrice;
            return (
              <div
                key={index}
                style={{
                  backgroundColor: cardBg,
                  border: plan.highlight
                    ? "1px solid rgba(200,169,110,0.6)"
                    : "1px solid " + cardBorder,
                  borderRadius: "20px",
                  padding: "32px",
                  position: "relative",
                  transform: plan.highlight ? "scale(1.03)" : "scale(1)",
                  boxShadow: plan.highlight
                    ? "0 0 60px rgba(200,169,110,0.15), 0 20px 40px rgba(0,0,0,0.4)"
                    : "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-14px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: gradientGold,
                      color: darkBg,
                      fontSize: "11px",
                      fontWeight: "800",
                      letterSpacing: "2px",
                      padding: "5px 18px",
                      borderRadius: "20px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Le Plus Populaire
                  </div>
                )}

                {/* Plan Header */}
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.05))",
                      border: "1px solid rgba(200,169,110,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                      fontSize: "20px",
                    }}
                  >
                    {index === 0 ? "📚" : index === 1 ? "🤖" : "🎭"}
                  </div>
                  <h3
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: plan.color,
                      margin: "0 0 4px",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: textMuted,
                      margin: "0 0 12px",
                    }}
                  >
                    {plan.subtitle}
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#9a8f80",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Prix */}
                <div
                  style={{
                    marginBottom: "28px",
                    padding: "20px",
                    backgroundColor: "rgba(200,169,110,0.04)",
                    borderRadius: "12px",
                    border: "1px solid rgba(200,169,110,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "48px",
                        fontWeight: "800",
                        color: plan.color,
                        lineHeight: 1,
                      }}
                    >
                      {price}
                    </span>
                    <span style={{ fontSize: "20px", color: plan.color }}>
                      euro
                    </span>
                    <span style={{ fontSize: "14px", color: textMuted }}>
                      / mois
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "12px",
                      color: textMuted,
                    }}
                  >
                    Mode {billingType === "visio" ? "Visio" : "Audio"} •
                    Facturation mensuelle
                  </p>
                </div>

                {/* Features */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {plan.features.map((feature, fi) => (
                    <li
                      key={fi}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "14px",
                        color: "#b8ac9a",
                      }}
                    >
                      <span
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(200,169,110,0.15)",
                          border: "1px solid rgba(200,169,110,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          color: gold,
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: plan.highlight ? "none" : "1px solid rgba(200,169,110,0.3)",
                    background: plan.highlight ? gradientGold : "transparent",
                    color: plan.highlight ? darkBg : gold,
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: "pointer",
                    letterSpacing: "0.5px",
                  }}
                >
                  {plan.highlight ? "Comm