"use client";
import { useState } from "react";

type Plan = {
  name: string;
  price: number;
  sessions: number;
  features: string[];
  bestSeller?: boolean;
};

const visioPlans: Plan[] = [
  {
    name: "Starter",
    price: 35,
    sessions: 1,
    features: [
      "1 séance vidéo / mois",
      "Accès espace membre",
      "Support email",
      "Replay 7 jours",
    ],
  },
  {
    name: "Bien-être",
    price: 79,
    sessions: 4,
    bestSeller: true,
    features: [
      "4 séances vidéo / mois",
      "Accès espace membre premium",
      "Support prioritaire",
      "Replay illimité",
      "Ressources exclusives",
    ],
  },
  {
    name: "Intensif",
    price: 129,
    sessions: 8,
    features: [
      "8 séances vidéo / mois",
      "Accès espace membre VIP",
      "Support 24/7",
      "Replay illimité",
      "Ressources exclusives",
      "Suivi personnalisé IA",
    ],
  },
];

const audioPlans: Plan[] = [
  {
    name: "Starter",
    price: 25,
    sessions: 1,
    features: [
      "1 séance audio / mois",
      "Accès espace membre",
      "Support email",
      "Replay 7 jours",
    ],
  },
  {
    name: "Bien-être",
    price: 55,
    sessions: 4,
    bestSeller: true,
    features: [
      "4 séances audio / mois",
      "Accès espace membre premium",
      "Support prioritaire",
      "Replay illimité",
      "Ressources exclusives",
    ],
  },
  {
    name: "Intensif",
    price: 89,
    sessions: 8,
    features: [
      "8 séances audio / mois",
      "Accès espace membre VIP",
      "Support 24/7",
      "Replay illimité",
      "Ressources exclusives",
      "Suivi personnalisé IA",
    ],
  },
];

export default function AbonnementsPage() {
  const [activeTab, setActiveTab] = useState<"visio" | "audio">("visio");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = activeTab === "visio" ? visioPlans : audioPlans;

  const handleSubscribe = async (plan: Plan) => {
    setLoadingPlan(plan.name);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoadingPlan(null);
    alert(`Abonnement ${plan.name} ${activeTab} sélectionné — intégration Supabase à connecter`);
  };

  const gold = "#c8a96e";
  const goldLight = "#e2c99a";
  const bg = "#050508";
  const cardBg = "#0d0d14";
  const cardBorder = "#1e1e2e";
  const cardBorderGold = "#c8a96e";
  const textMuted = "#7a7a9a";
  const textLight = "#e8e8f0";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: bg,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: textLight,
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "60px 20px 80px",
        }}
      >

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "rgba(200,169,110,0.12)",
              color: gold,
              border: `1px solid rgba(200,169,110,0.3)`,
              borderRadius: "999px",
              padding: "6px 18px",
              fontSize: "12px",
              fontWeight: "600",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            AcadémIA Pro
          </span>
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: "800",
            marginBottom: "12px",
            lineHeight: "1.2",
            background: `linear-gradient(135deg, ${goldLight} 0%, ${gold} 50%, #a07840 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Abonnements Séances
        </h1>

        <p
          style={{
            textAlign: "center",
            color: textMuted,
            fontSize: "16px",
            marginBottom: "48px",
            lineHeight: "1.6",
          }}
        >
          Choisissez la formule qui vous correspond.{" "}
          <span style={{ color: gold }}>Sans engagement</span> · Garantie satisfait ou remboursé 30 jours.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "52px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: "14px",
              padding: "6px",
              gap: "4px",
            }}
          >
            {(["visio", "audio"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 32px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "14px",
                  letterSpacing: "0.5px",
                  textTransform: "capitalize",
                  transition: "all 0.25s ease",
                  backgroundColor: activeTab === tab ? gold : "transparent",
                  color: activeTab === tab ? "#050508" : textMuted,
                  boxShadow:
                    activeTab === tab
                      ? "0 4px 20px rgba(200,169,110,0.35)"
                      : "none",
                }}
              >
                {tab === "visio" ? "🎥 Visio" : "🎧 Audio"}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                position: "relative",
                backgroundColor: cardBg,
                border: `1px solid ${plan.bestSeller ? cardBorderGold : cardBorder}`,
                borderRadius: "20px",
                padding: plan.bestSeller ? "40px 28px 32px" : "32px 28px",
                display: "flex",
                flexDirection: "column",
                boxShadow: plan.bestSeller
                  ? "0 0 40px rgba(200,169,110,0.15), 0 8px 32px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(0,0,0,0.3)",
                transform: plan.bestSeller ? "scale(1.03)" : "scale(1)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {plan.bestSeller && (
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: gold,
                    color: "#050508",
                    fontWeight: "800",
                    fontSize: "11px",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    padding: "5px 16px",
                    borderRadius: "999px",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 16px rgba(200,169,110,0.5)",
                  }}
                >
                  ⭐ Best-Seller
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "rgba(200,169,110,0.08)",
                    border: `1px solid rgba(200,169,110,0.2)`,
                    borderRadius: "8px",
                    padding: "4px 12px",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ fontSize: "12px" }}>
                    {activeTab === "visio" ? "🎥" : "🎧"}
                  </span>
                  <span
                    style={{
                      color: gold,
                      fontSize: "11px",
                      fontWeight: "700",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    {activeTab === "visio" ? "Visio" : "Audio"}
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    color: textLight,
                    margin: "0 0 20px",
                  }}
                >
                  {plan.name}
                </h2>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "48px",
                      fontWeight: "900",
                      lineHeight: "1",
                      color: plan.bestSeller ? gold : textLight,
                    }}
                  >
                    {plan.price}€
                  </span>
                  <span
                    style={{
                      color: textMuted,
                      fontSize: "14px",
                      marginBottom: "8px",
                    }}
                  >
                    / mois
                  </span>
                </div>

                <p style={{ color: textMuted, fontSize: "13px", margin: "0" }}>
                  {plan.sessions} séance{plan.sessions > 1 ? "s" : ""} par mois
                </p>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: plan.bestSeller
                    ? "rgba(200,169,110,0.2)"
                    : cardBorder,
                  marginBottom: "24px",
                }}
              />

              <ul
                style={{
                  listStyle: "none",
                  padding: "0",
                  margin: "0 0 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  flex: "1",
                }}
              >
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "14px",
                      color: "#c8c8e0",
                      lineHeight: "1.4",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(200,169,110,0.15)",
                        color: gold,
                        fontSize: "10px",
                        fontWeight: "900",
                        flexShrink: "0",
                        marginTop: "1px",
                      }}
                    >
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.name}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: plan.bestSeller ? "none" : `1px solid ${gold}`,
                  cursor: loadingPlan === plan.name ? "not-allowed" : "pointer",
                  fontWeight: "700",
                  fontSize: "15px",
                  letterSpacing: "0.3px",
                  transition: "all 0.25s ease",
                  backgroundColor: plan.bestSeller
                    ? gold
                    : "rgba(200,169,110,0.06)",
                  color: plan.bestSeller ? "#050508" : gold,
                  opacity: loadingPlan === plan.name ? 0.7 : 1,
                  boxShadow: plan.bestSeller
                    ? "0 6px 24px rgba(200,169,110,0.4)"
                    : "none",
                }}
              >
                {loadingPlan === plan.name
                  ? "Chargement..."
                  : `Choisir ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "60px",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "32px",
          }}
        >
          {[
            { icon: "🔓", label: "Sans engagement" },
            { icon: "🛡️", label: "Garantie 30 jours" },
            { icon: "🔒", label: "Paiement sécurisé" },
            { icon: "⚡", label: "Accès immédiat" },
          ].map((badge) => (
            <div
              key={badge.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: textMuted,
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              <span style={{ fontSize: "16px" }}>{badge.icon}</span>
              {badge.label}
            </div>
          ))}
        </div>

        <p
          style={{
            textAlign: "center",
            color: "#3a3a5a",
            fontSize: "