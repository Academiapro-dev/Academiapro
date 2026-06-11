"use client"

import { useState } from "react"

const plans = {
  visio: [
    {
      name: "Starter",
      price: 35,
      sessions: 1,
      duration: "45 min",
      features: ["1 séance vidéo / mois", "Suivi IA personnalisé", "Accès espace membre", "Support email"],
      bestSeller: false,
      color: "#c8a96e"
    },
    {
      name: "Bien-être",
      price: 79,
      sessions: 3,
      duration: "60 min",
      features: ["3 séances vidéo / mois", "Suivi IA avancé", "Accès espace membre", "Support prioritaire", "Ressources exclusives"],
      bestSeller: true,
      color: "#c8a96e"
    },
    {
      name: "Intensif",
      price: 129,
      sessions: 6,
      duration: "60 min",
      features: ["6 séances vidéo / mois", "Suivi IA premium", "Accès espace membre VIP", "Support 24/7", "Ressources exclusives", "Bilan mensuel détaillé"],
      bestSeller: false,
      color: "#c8a96e"
    }
  ],
  audio: [
    {
      name: "Starter",
      price: 25,
      sessions: 1,
      duration: "30 min",
      features: ["1 séance audio / mois", "Suivi IA personnalisé", "Accès espace membre", "Support email"],
      bestSeller: false,
      color: "#c8a96e"
    },
    {
      name: "Bien-être",
      price: 55,
      sessions: 3,
      duration: "45 min",
      features: ["3 séances audio / mois", "Suivi IA avancé", "Accès espace membre", "Support prioritaire", "Ressources exclusives"],
      bestSeller: true,
      color: "#c8a96e"
    },
    {
      name: "Intensif",
      price: 89,
      sessions: 6,
      duration: "45 min",
      features: ["6 séances audio / mois", "Suivi IA premium", "Accès espace membre VIP", "Support 24/7", "Ressources exclusives", "Bilan mensuel détaillé"],
      bestSeller: false,
      color: "#c8a96e"
    }
  ]
}

export default function AbonnementsPage() {
  const [activeTab, setActiveTab] = useState("visio")
  const [hoveredCard, setHoveredCard] = useState(null)
  const [hoveredBtn, setHoveredBtn] = useState(null)

  const currentPlans = plans[activeTab]

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#050508",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "60px 20px",
      boxSizing: "border-box"
    }}>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <span style={{
            display: "inline-block",
            fontSize: "11px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#c8a96e",
            fontWeight: "600",
            marginBottom: "20px"
          }}>
            AcadémIA Pro
          </span>
        </div>

        <h1 style={{
          textAlign: "center",
          fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: "700",
          color: "#ffffff",
          marginBottom: "16px",
          lineHeight: "1.2",
          letterSpacing: "-0.5px"
        }}>
          Choisissez votre formule
        </h1>

        <p style={{
          textAlign: "center",
          color: "#8a8a9a",
          fontSize: "16px",
          marginBottom: "48px",
          lineHeight: "1.6"
        }}>
          Des séances accompagnées par l'IA pour transformer votre quotidien
        </p>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "0px",
          marginBottom: "56px"
        }}>
          <div style={{
            display: "flex",
            backgroundColor: "#0e0e16",
            border: "1px solid #1e1e2e",
            borderRadius: "12px",
            padding: "4px",
            gap: "4px"
          }}>
            {["visio", "audio"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 32px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                  transition: "all 0.25s ease",
                  backgroundColor: activeTab === tab ? "#c8a96e" : "transparent",
                  color: activeTab === tab ? "#050508" : "#6a6a7a",
                  textTransform: "capitalize"
                }}
              >
                {tab === "visio" ? "Visio" : "Audio"}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "24px",
          justifyContent: "center",
          flexWrap: "wrap",
          alignItems: "flex-start"
        }}>
          {currentPlans.map((plan, index) => {
            const isHovered = hoveredCard === index
            const isBestSeller = plan.bestSeller

            return (
              <div
                key={plan.name + activeTab}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "320px",
                  backgroundColor: isBestSeller ? "#0d0d18" : "#0a0a12",
                  border: isBestSeller
                    ? "1.5px solid #c8a96e"
                    : isHovered
                    ? "1.5px solid #2a2a3e"
                    : "1.5px solid #16161f",
                  borderRadius: "20px",
                  padding: "32px 28px",
                  boxSizing: "border-box",
                  transform: isBestSeller
                    ? "scale(1.04)"
                    : isHovered
                    ? "translateY(-4px)"
                    : "translateY(0)",
                  transition: "all 0.3s ease",
                  boxShadow: isBestSeller
                    ? "0 0 40px rgba(200,169,110,0.12), 0 20px 60px rgba(0,0,0,0.5)"
                    : isHovered
                    ? "0 20px 60px rgba(0,0,0,0.4)"
                    : "0 8px 32px rgba(0,0,0,0.3)"
                }}
              >
                {isBestSeller && (
                  <div style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#c8a96e",
                    color: "#050508",
                    fontSize: "10px",
                    fontWeight: "800",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    padding: "5px 16px",
                    borderRadius: "20px",
                    whiteSpace: "nowrap"
                  }}>
                    Best-seller
                  </div>
                )}

                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{
                    color: isBestSeller ? "#c8a96e" : "#ffffff",
                    fontSize: "20px",
                    fontWeight: "700",
                    marginBottom: "6px",
                    letterSpacing: "0.3px"
                  }}>
                    {plan.name}
                  </h2>
                  <p style={{
                    color: "#5a5a6a",
                    fontSize: "13px",
                    margin: "0"
                  }}>
                    {plan.sessions} {plan.sessions > 1 ? "séances" : "séance"} / mois — {plan.duration}
                  </p>
                </div>

                <div style={{ marginBottom: "28px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{
                      fontSize: "48px",
                      fontWeight: "800",
                      color: "#ffffff",
                      lineHeight: "1",
                      letterSpacing: "-2px"
                    }}>
                      {plan.price}
                    </span>
                    <span style={{
                      fontSize: "22px",
                      color: "#c8a96e",
                      fontWeight: "600"
                    }}>
                      €
                    </span>
                    <span style={{
                      fontSize: "13px",
                      color: "#5a5a6a",
                      marginLeft: "4px"
                    }}>
                      / mois
                    </span>
                  </div>
                </div>

                <div style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: isBestSeller ? "rgba(200,169,110,0.2)" : "#16161f",
                  marginBottom: "24px"
                }} />

                <ul style={{
                  listStyle: "none",
                  padding: "0",
                  margin: "0 0 32px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  {plan.features.map((feature, fi) => (
                    <li key={fi} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#a0a0b0",
                      fontSize: "14px",
                      lineHeight: "1.4"
                    }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: isBestSeller ? "rgba(200,169,110,0.15)" : "rgba(200,169,110,0.08)",
                        flexShrink: "0"
                      }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onMouseEnter={() => setHoveredBtn(index)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: isBestSeller ? "none" : "1.5px solid #c8a96e",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "700",
                    letterSpacing: "0.5px",
                    transition: "all 0.25s ease",
                    backgroundColor: isBestSeller
                      ? hoveredBtn === index ? "#d4b878" : "#c8a96e"
                      : hoveredBtn === index ? "rgba(200,169,110,0.1)" : "transparent",
                    color: isBestSeller ? "#050508" : "#c8a96e",
                    transform: hoveredBtn === index ? "scale(0.98)" : "scale(1)"
                  }}
                >
                  Commencer maintenant
                </button>
              </div>
            )
          })}
        </div>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          marginTop: "64px",
          flexWrap: "wrap"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(200,169,110,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: "0"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p style={{ color: "#ffffff", fontSize: "13px", fontWeight: "600", margin: "0 0 2px 0" }}>
                Sans engagement
              </p>
              <p style={{ color: "#5a5a6a", fontSize: "12px", margin: "0" }}>
                Résiliez quand vous voulez
              </p>
            </div>
          </div>

          <div style={{
            width: "1px",
            backgroundColor: "#1a1a28",
            alignSelf: "stretch"
          }} />

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(200,169,110,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: "0"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#c8a96e" strokeWidth="2"/>