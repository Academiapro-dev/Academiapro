"use client";
import { useState } from "react";

export default function FinancementPage() {
  const [activeOption, setActiveOption] = useState("1x");
  const [montant, setMontant] = useState(1500);

  const options = [
    {
      id: "1x",
      label: "1x",
      description: "Paiement comptant",
      badge: null,
      calcul: (m) => ({ mensualite: m, frais: 0, total: m }),
    },
    {
      id: "3x",
      label: "3x",
      description: "Sans frais",
      badge: "SANS FRAIS",
      calcul: (m) => ({ mensualite: Math.round(m / 3), frais: 0, total: m }),
    },
    {
      id: "10x",
      label: "10x",
      description: "Sans frais",
      badge: "SANS FRAIS",
      calcul: (m) => ({ mensualite: Math.round(m / 10), frais: 0, total: m }),
    },
  ];

  const activeData = options.find((o) => o.id === activeOption);
  const result = activeData.calcul(montant);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#ffffff",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "64px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(200,169,110,0.12)",
              border: "1px solid rgba(200,169,110,0.3)",
              borderRadius: "50px",
              padding: "8px 20px",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                color: "#c8a96e",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Financement flexible
            </span>
          </div>

          <h1
            style={{
              fontSize: "48px",
              fontWeight: "800",
              margin: "0 0 16px 0",
              lineHeight: "1.1",
              letterSpacing: "-1px",
            }}
          >
            Investissez dans votre{" "}
            <span style={{ color: "#c8a96e" }}>succès</span>
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.55)",
              margin: "0",
              maxWidth: "500px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: "1.6",
            }}
          >
            Des solutions de paiement adaptées à chaque profil,
            sans frais cachés.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "rgba(200,169,110,0.06)",
            border: "1px solid rgba(200,169,110,0.2)",
            borderRadius: "20px",
            padding: "32px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <label
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "rgba(255,255,255,0.8)",
                letterSpacing: "0.5px",
              }}
            >
              Montant de votre formation
            </label>
            <div
              style={{
                backgroundColor: "rgba(200,169,110,0.15)",
                border: "1px solid rgba(200,169,110,0.4)",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "22px",
                fontWeight: "800",
                color: "#c8a96e",
              }}
            >
              {montant.toLocaleString("fr-FR")} €
            </div>
          </div>

          <input
            type="range"
            min="500"
            max="10000"
            step="100"
            value={montant}
            onChange={(e) => setMontant(Number(e.target.value))}
            style={{
              width: "100%",
              height: "6px",
              appearance: "none",
              backgroundColor: "rgba(200,169,110,0.2)",
              borderRadius: "3px",
              outline: "none",
              cursor: "pointer",
              accentColor: "#c8a96e",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
            }}
          >
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
              500 €
            </span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
              10 000 €
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {options.map((option) => {
            const isActive = activeOption === option.id;
            const res = option.calcul(montant);

            return (
              <button
                key={option.id}
                onClick={() => setActiveOption(option.id)}
                style={{
                  position: "relative",
                  backgroundColor: isActive
                    ? "rgba(200,169,110,0.14)"
                    : "rgba(255,255,255,0.03)",
                  border: isActive
                    ? "2px solid #c8a96e"
                    : "2px solid rgba(255,255,255,0.08)",
                  borderRadius: "18px",
                  padding: "28px 16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                  outline: "none",
                }}
              >
                {option.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#c8a96e",
                      color: "#050508",
                      fontSize: "9px",
                      fontWeight: "800",
                      letterSpacing: "1.5px",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {option.badge}
                  </div>
                )}

                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "900",
                    color: isActive ? "#c8a96e" : "rgba(255,255,255,0.7)",
                    lineHeight: "1",
                    marginBottom: "6px",
                  }}
                >
                  {option.label}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: isActive
                      ? "rgba(200,169,110,0.7)"
                      : "rgba(255,255,255,0.35)",
                    marginBottom: "20px",
                    fontWeight: "500",
                  }}
                >
                  {option.description}
                </div>

                <div
                  style={{
                    borderTop: isActive
                      ? "1px solid rgba(200,169,110,0.2)"
                      : "1px solid rgba(255,255,255,0.06)",
                    paddingTop: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {option.id === "1x" ? "Montant total" : "par mois"}
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "800",
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {res.mensualite.toLocaleString("fr-FR")} €
                  </div>
                </div>

                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      width: "20px",
                      height: "20px",
                      backgroundColor: "#c8a96e",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "#050508",
                        fontSize: "11px",
                        fontWeight: "900",
                      }}
                    >
                      ✓
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {activeOption !== "1x" && (
          <div
            style={{
              backgroundColor: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.25)",
              borderRadius: "14px",
              padding: "20px 28px",
              marginBottom: "40px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(200,169,110,0.15)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: "0",
                fontSize: "18px",
              }}
            >
              💳
            </div>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#c8a96e",
                  marginBottom: "3px",
                }}
              >
                Récapitulatif de votre échéancier
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {activeOption === "3x"
                  ? "3 prélèvements de "
                  : "10 prélèvements de "}
                <strong style={{ color: "#ffffff" }}>
                  {result.mensualite.toLocaleString("fr-FR")} €
                </strong>
                {" — Total : "}
                <strong style={{ color: "#c8a96e" }}>
                  {result.total.toLocaleString("fr-FR")} €
                </strong>
                {" — Frais : "}
                <strong style={{ color: "#4ade80" }}>0 €</strong>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            padding: "32px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: "rgba(200,169,110,0.12)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              🏢
            </div>
            <div>
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#ffffff",
                }}
              >
                Financement OPCO
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                Pour les entreprises et salariés
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
            }}
          >
            {[
              {
                icon: "✅",
                title: "Prise en charge totale",
                desc: "Formation 100% financée par votre OPCO selon votre convention collective",
              },
              {
                icon: "📋",
                title: "Dossier simplifié",
                desc: "Nous gérons l'intégralité des démarches administratives pour vous",
              },
              {
                icon: "⚡",
                title: "Réponse rapide",
                desc: "Accord de financement obtenu sous 5 à 10 jours ouvrés en moyenne",
              },
              {
                icon: "🤝",
                title: "Accompagnement dédié",
                desc: "Un conseiller vous guide de A à Z dans votre demande de prise en charge",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "rgba(200,169,110,0.05)",
                  border: "1px solid rgba(200,169,110,0.12)",
                  borderRadius: "12px",
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    marginBottom: "8px",
                  }}
                >
                  {item.icon}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#c8a96e",
                    marginBottom: "6px",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: "1.5",
                  }}
                >
                  {item.desc}
                </div>
              </div>
            ))}
          </div>