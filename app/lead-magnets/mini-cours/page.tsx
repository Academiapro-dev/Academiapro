"use client";
import { useState } from "react";

export default function MiniCoursPage() {
  const [activeDay, setActiveDay] = useState(null);

  const days = [
    {
      number: "01",
      title: "Le Prompt Parfait",
      subtitle: "Jour 1",
      description: "Découvrez la structure exacte d'un prompt qui obtient des résultats professionnels. Fini les réponses vagues et décevantes.",
      points: [
        "La formule en 4 parties qui change tout",
        "Les mots déclencheurs qui activent le mode expert",
        "Exercice pratique : réécrire 3 prompts ratés"
      ],
      icon: "✦"
    },
    {
      number: "02",
      title: "Automatiser Sans Coder",
      subtitle: "Jour 2",
      description: "Transformez vos tâches répétitives en workflows automatiques. Gagnez 2 heures par jour dès cette semaine.",
      points: [
        "Créer une chaîne de prompts enchaînés",
        "Templates réutilisables pour votre métier",
        "Cas réel : automatiser un rapport hebdomadaire"
      ],
      icon: "⟳"
    },
    {
      number: "03",
      title: "Votre Premier Agent IA",
      subtitle: "Jour 3",
      description: "Construisez un agent qui travaille pour vous en autonomie. La frontière entre outil et collaborateur disparaît.",
      points: [
        "Donner une mission longue terme à l'IA",
        "Créer des boucles de vérification automatiques",
        "Déployer votre agent sur un cas concret"
      ],
      icon: "◈"
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#050508",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflowX: "hidden"
    }}>

      <div style={{
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "0",
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(200,169,110,0.08) 0%, transparent 70%)"
      }} />

      <div style={{
        position: "relative",
        zIndex: "1",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "0 24px"
      }}>

        <div style={{
          textAlign: "center",
          paddingTop: "80px",
          paddingBottom: "64px"
        }}>
          <div style={{
            display: "inline-block",
            border: "1px solid rgba(200,169,110,0.35)",
            borderRadius: "100px",
            padding: "6px 20px",
            marginBottom: "32px"
          }}>
            <span style={{
              color: "#c8a96e",
              fontSize: "11px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              fontWeight: "600"
            }}>Formation Gratuite · 3 Jours</span>
          </div>

          <h1 style={{
            color: "#f0e6d0",
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: "700",
            lineHeight: "1.1",
            margin: "0 0 8px 0",
            letterSpacing: "-1px"
          }}>
            Maîtrisez l'IA
          </h1>
          <h1 style={{
            color: "#c8a96e",
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: "700",
            lineHeight: "1.1",
            margin: "0 0 28px 0",
            letterSpacing: "-1px"
          }}>
            en 15 min par jour
          </h1>

          <p style={{
            color: "rgba(240,230,208,0.55)",
            fontSize: "18px",
            lineHeight: "1.7",
            maxWidth: "520px",
            margin: "0 auto 48px auto",
            fontWeight: "400"
          }}>
            Trois leçons concrètes pour passer de débutant à utilisateur avancé.
            Aucune connaissance technique requise.
          </p>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "32px",
            flexWrap: "wrap"
          }}>
            {["3 leçons vidéo", "Exercices pratiques", "100% gratuit"].map((item, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <div style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: "#c8a96e"
                }} />
                <span style={{
                  color: "rgba(240,230,208,0.5)",
                  fontSize: "13px",
                  letterSpacing: "0.5px"
                }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          marginBottom: "80px"
        }}>
          {days.map((day, index) => (
            <div
              key={index}
              onClick={() => setActiveDay(activeDay === index ? null : index)}
              style={{
                backgroundColor: activeDay === index ? "rgba(200,169,110,0.06)" : "rgba(255,255,255,0.02)",
                border: activeDay === index ? "1px solid rgba(200,169,110,0.3)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "32px 36px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                marginBottom: "12px"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "24px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "28px",
                  flex: "1"
                }}>
                  <div style={{
                    minWidth: "64px",
                    height: "64px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(200,169,110,0.08)",
                    border: "1px solid rgba(200,169,110,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "2px"
                  }}>
                    <span style={{
                      color: "#c8a96e",
                      fontSize: "20px",
                      lineHeight: "1"
                    }}>{day.icon}</span>
                    <span style={{
                      color: "rgba(200,169,110,0.5)",
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "1px"
                    }}>J{day.number}</span>
                  </div>

                  <div>
                    <div style={{
                      color: "rgba(200,169,110,0.6)",
                      fontSize: "11px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      fontWeight: "600",
                      marginBottom: "4px"
                    }}>{day.subtitle}</div>
                    <div style={{
                      color: "#f0e6d0",
                      fontSize: "22px",
                      fontWeight: "600",
                      letterSpacing: "-0.3px"
                    }}>{day.title}</div>
                  </div>
                </div>

                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1px solid rgba(200,169,110,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: "0",
                  transition: "all 0.3s ease",
                  transform: activeDay === index ? "rotate(45deg)" : "rotate(0deg)"
                }}>
                  <span style={{
                    color: "#c8a96e",
                    fontSize: "18px",
                    lineHeight: "1",
                    marginTop: "-1px"
                  }}>+</span>
                </div>
              </div>

              {activeDay === index && (
                <div style={{
                  marginTop: "28px",
                  paddingTop: "28px",
                  borderTop: "1px solid rgba(200,169,110,0.1)"
                }}>
                  <p style={{
                    color: "rgba(240,230,208,0.65)",
                    fontSize: "16px",
                    lineHeight: "1.7",
                    margin: "0 0 24px 0"
                  }}>{day.description}</p>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}>
                    {day.points.map((point, pi) => (
                      <div key={pi} style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px"
                      }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(200,169,110,0.12)",
                          border: "1px solid rgba(200,169,110,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: "0",
                          marginTop: "2px"
                        }}>
                          <span style={{
                            color: "#c8a96e",
                            fontSize: "9px",
                            fontWeight: "700"
                          }}>✓</span>
                        </div>
                        <span style={{
                          color: "rgba(240,230,208,0.7)",
                          fontSize: "15px",
                          lineHeight: "1.5"
                        }}>{point}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "24px",
                    backgroundColor: "rgba(200,169,110,0.08)",
                    border: "1px solid rgba(200,169,110,0.2)",
                    borderRadius: "8px",
                    padding: "8px 16px"
                  }}>
                    <span style={{ fontSize: "12px" }}>⏱</span>
                    <span style={{
                      color: "rgba(200,169,110,0.8)",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>Durée estimée : 15 minutes</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          backgroundColor: "rgba(200,169,110,0.05)",
          border: "1px solid rgba(200,169,110,0.2)",
          borderRadius: "20px",
          padding: "56px 48px",
          textAlign: "center",
          marginBottom: "80px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: "-60px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,169,110,0.1) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div style={{
            fontSize: "32px",
            marginBottom: "16px"
          }}>✦</div>

          <h2 style={{
            color: "#f0e6d0",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: "700",
            margin: "0 0 16px 0",
            letterSpacing: "-0.5px"
          }}>
            Commencez Maintenant
          </h2>

          <p style={{
            color: "rgba(240,230,208,0.5)",
            fontSize: "16px",
            lineHeight: "1.7",
            maxWidth: "400px",
            margin: "0 auto 36px auto"
          }}>
            Rejoignez les personnes qui utilisent déjà l'IA comme un vrai levier de productivité.
          </p>

          <div style={{
            display: "flex",
            gap: "12px",
            maxWidth: "480px",
            margin: "0 auto 16px auto",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            <input
              type="email"
              placeholder="votre@email.com"
              style={{
                flex: "1",
                minWidth: "220px",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(200,169,110,0.25)",
                borderRadius: "10px",
                padding: "14px 18px",
                color: "#f0e6d0",
                fontSize: "15px",
                outline: "none"
              }}
            />
            <button style={{
              backgroundColor: "#c8a96e",
              color: "#050508",
              border: "none",
              borderRadius: "10px",
              padding: "14px 28px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              letterSpacing: "0.3px",
              whiteSpace: "nowrap"
            }}>
              Démarrer →
            </button>
          </div>

          <p style={{
            color: "rgba(240,230,208,0.3)",
            fontSize: "12px",
            margin: "0"
          }}>
            Gratuit · Sans engagement · Premier email dans 5 minutes
          </p>
        </div>

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "32px",
          paddingBottom: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <span style={{
            color: "rgba(240,230,208,0.25)",
            fontSize: