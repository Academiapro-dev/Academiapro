import React, { useState } from "react";

const FinancementPage: React.FC = () => {
  const [selected, setSelected] = useState<string>("1x");

  const dark = "#050508";
  const gold = "#c8a96e";
  const goldLight = "#e8c98e";
  const goldDark = "#a08848";
  const white = "#ffffff";
  const grayLight = "#1a1a2e";
  const grayMid = "#12121f";
  const textMuted = "#8888aa";

  const options = [
    {
      id: "1x",
      label: "1x",
      sublabel: "Paiement comptant",
      desc: "Règlement immédiat en une seule fois",
      badge: null,
      frais: "Sans frais",
      example: "1 000 € → 1 000 €",
    },
    {
      id: "3x",
      label: "3x",
      sublabel: "Sans frais",
      desc: "3 mensualités égales, aucun intérêt",
      badge: "POPULAIRE",
      frais: "0% de frais",
      example: "1 000 € → 3 × 333 €",
    },
    {
      id: "10x",
      label: "10x",
      sublabel: "Avec frais",
      desc: "10 mensualités avec frais de dossier",
      badge: null,
      frais: "1,5% de frais",
      example: "1 000 € → 10 × 101,50 €",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: dark,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: white,
        padding: "0",
        margin: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid",
          borderColor: goldDark,
          padding: "24px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: grayMid,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: dark,
            }}
          >
            F
          </div>
          <span
            style={{ fontSize: "20px", fontWeight: "700", color: gold }}
          >
            FormaPro
          </span>
        </div>
        <div
          style={{
            fontSize: "13px",
            color: textMuted,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#4caf50",
              display: "inline-block",
            }}
          />
          Paiement 100% sécurisé
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          textAlign: "center",
          padding: "64px 40px 48px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: "rgba(200,169,110,0.12)",
            border: "1px solid",
            borderColor: goldDark,
            borderRadius: "100px",
            padding: "6px 20px",
            fontSize: "12px",
            letterSpacing: "2px",
            color: gold,
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          Options de financement
        </div>
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "800",
            margin: "0 0 16px",
            lineHeight: "1.1",
            color: white,
          }}
        >
          Choisissez votre{" "}
          <span style={{ color: gold }}>mode de paiement</span>
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: textMuted,
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          Flexibilité totale pour accéder à votre formation. Toutes les options
          sont disponibles sans justificatif.
        </p>
      </div>

      {/* Options de paiement */}
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 40px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              style={{
                position: "relative",
                backgroundColor: isSelected
                  ? "rgba(200,169,110,0.08)"
                  : grayMid,
                border: "2px solid",
                borderColor: isSelected ? gold : "#2a2a3e",
                borderRadius: "20px",
                padding: "32px 28px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                transform: isSelected ? "translateY(-4px)" : "translateY(0)",
                boxShadow: isSelected
                  ? "0 20px 40px rgba(200,169,110,0.15)"
                  : "none",
              }}
            >
              {opt.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: gold,
                    color: dark,
                    fontSize: "10px",
                    fontWeight: "800",
                    letterSpacing: "1.5px",
                    padding: "4px 14px",
                    borderRadius: "100px",
                  }}
                >
                  {opt.badge}
                </div>
              )}

              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: gold,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    color: dark,
                    fontWeight: "bold",
                  }}
                >
                  ✓
                </div>
              )}

              <div
                style={{
                  fontSize: "52px",
                  fontWeight: "900",
                  color: isSelected ? gold : white,
                  lineHeight: "1",
                  marginBottom: "4px",
                }}
              >
                {opt.label}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: isSelected ? goldLight : textMuted,
                  marginBottom: "16px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {opt.sublabel}
              </div>

              <div
                style={{
                  width: "40px",
                  height: "2px",
                  backgroundColor: isSelected ? gold : "#2a2a3e",
                  marginBottom: "20px",
                  borderRadius: "2px",
                }}
              />

              <p
                style={{
                  fontSize: "14px",
                  color: textMuted,
                  lineHeight: "1.5",
                  margin: "0 0 20px",
                }}
              >
                {opt.desc}
              </p>

              <div
                style={{
                  backgroundColor: isSelected
                    ? "rgba(200,169,110,0.12)"
                    : "rgba(255,255,255,0.03)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: textMuted,
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Exemple
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: isSelected ? gold : white,
                    fontFamily: "monospace",
                  }}
                >
                  {opt.example}
                </div>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: opt.id === "10x" ? "#ff9966" : "#66cc88",
                  fontWeight: "600",
                }}
              >
                <span>{opt.id === "10x" ? "⚠" : "✓"}</span>
                {opt.frais}
              </div>
            </div>
          );
        })}
      </div>

      {/* OPCO Section */}
      <div
        style={{
          maxWidth: "900px",
          margin: "40px auto 0",
          padding: "0 40px",
        }}
      >
        <div
          style={{
            backgroundColor: grayMid,
            border: "1px solid",
            borderColor: "#2a2a3e",
            borderRadius: "20px",
            padding: "32px 36px",
            display: "flex",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              backgroundColor: "rgba(200,169,110,0.1)",
              border: "1px solid",
              borderColor: goldDark,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              flexShrink: "0" as any,
            }}
          >
            🏛
          </div>
          <div style={{ flex: "1" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <h3
                style={{
                  margin: "0",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: white,
                }}
              >
                Financement OPCO
              </h3>
              <span
                style={{
                  backgroundColor: "rgba(200,169,110,0.15)",
                  border: "1px solid",
                  borderColor: goldDark,
                  color: gold,
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "100px",
                  letterSpacing: "0.5px",
                }}
              >
                ENTREPRISE
              </span>
            </div>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "14px",
                color: textMuted,
                lineHeight: "1.6",
              }}
            >
              Votre entreprise peut financer intégralement cette formation via
              votre OPCO (Opérateur de Compétences). Nous gérons les démarches
              administratives pour vous. Prise en charge jusqu'à 100%.
            </p>
            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap" as any,
              }}
            >
              {["Qualiopi certifié", "Dossier géré pour vous", "Réponse sous 48h"].map(
                (item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: gold,
                      fontWeight: "500",
                    }}
                  >
                    <span style={{ color: "#66cc88" }}>✓</span>
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
          <button
            style={{
              flexShrink: "0" as any,
              backgroundColor: "transparent",
              border: "1px solid",
              borderColor: gold,
              color: gold,
              padding: "12px 24px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap" as any,
            }}
          >
            En savoir plus →
          </button>
        </div>
      </div>

      {/* Garantie 30 jours */}
      <div
        style={{
          maxWidth: "900px",
          margin: "32px auto 0",
          padding: "0 40px",
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(200,169,110,0.1) 0%, rgba(200,169,110,0.03) 100%)",
            border: "1px solid",
            borderColor: goldDark,
            borderRadius: "20px",
            padding: "32px 36px",
            display: "flex",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "80px",
              height: "80px",
              flexShrink: "0" as any,
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "3px solid",
                borderColor: gold,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column" as any,
                textAlign: "center" as any,
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "900",
                  color: gold,
                  lineHeight: "1",
                }}
              >
                30
              </div>
              <div
                style={{
                  fontSize: "9px",
                  color: gold,
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                JOURS
              </div>
            </div>
          </div>
          <div>