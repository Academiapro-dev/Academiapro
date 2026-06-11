import React, { useState } from "react";

const formations = [
  { id: "F128", title: "Expert Claude", price: 690, category: "IA Avancée" },
  { id: "F129", title: "No-Code", price: 790, category: "Développement" },
  { id: "F130", title: "Apps IA", price: 990, category: "Développement" },
  { id: "F131", title: "Marketing IA", price: 890, category: "Marketing" },
  { id: "F001", title: "Management", price: 490, category: "Leadership" },
  { id: "F003", title: "Bien-être", price: 390, category: "Bien-être" },
];

export default function Page131() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const gold = "#c8a96e";
  const darkBg = "#050508";
  const cardBg = "#0d0d14";
  const cardBorder = "#1e1e2e";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: darkBg,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#ffffff",
        padding: "0",
        margin: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #050508 0%, #0d0d1a 50%, #050508 100%)",
          borderBottom: "1px solid " + cardBorder,
          padding: "48px 40px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                backgroundColor: gold,
                color: darkBg,
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "2px",
                padding: "4px 12px",
                borderRadius: "20px",
                textTransform: "uppercase",
              }}
            >
              Page 131
            </span>
            <span
              style={{
                color: "rgba(200,169,110,0.6)",
                fontSize: "13px",
                letterSpacing: "1px",
              }}
            >
              AcadémIA Pro
            </span>
          </div>
          <h1
            style={{
              fontSize: "42px",
              fontWeight: "800",
              margin: "16px 0 8px",
              background: "linear-gradient(135deg, #ffffff 0%, " + gold + " 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: "1.1",
            }}
          >
            Formations Certifiantes
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "16px",
              margin: "0",
              maxWidth: "520px",
            }}
          >
            Développez vos compétences avec nos programmes d'excellence et obtenez votre certification reconnue.
          </p>
        </div>
      </div>

      {/* Badges garanties */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 40px 0",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {[
          { icon: "🏆", label: "Certification AcadémIA Pro" },
          { icon: "💳", label: "Paiement en 3x sans frais" },
          { icon: "🛡️", label: "Garantie satisfait 30 jours" },
        ].map((badge) => (
          <div
            key={badge.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(200,169,110,0.07)",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: "40px",
              padding: "10px 20px",
            }}
          >
            <span style={{ fontSize: "18px" }}>{badge.icon}</span>
            <span
              style={{
                color: gold,
                fontSize: "13px",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              {badge.label}
            </span>
          </div>
        ))}
      </div>

      {/* Grille formations */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 40px 60px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px",
        }}
      >
        {formations.map((f) => {
          const isHovered = hovered === f.id;
          const isSelected = selected === f.id;
          const monthly = Math.round(f.price / 3);

          return (
            <div
              key={f.id}
              onMouseEnter={() => setHovered(f.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(isSelected ? null : f.id)}
              style={{
                backgroundColor: isSelected ? "rgba(200,169,110,0.07)" : isHovered ? "#111118" : cardBg,
                border: isSelected
                  ? "1px solid " + gold
                  : isHovered
                  ? "1px solid rgba(200,169,110,0.35)"
                  : "1px solid " + cardBorder,
                borderRadius: "20px",
                padding: "32px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                position: "relative",
                overflow: "hidden",
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                boxShadow: isHovered
                  ? "0 20px 60px rgba(200,169,110,0.12)"
                  : "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {/* Glow top */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    right: "0",
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, " + gold + ", transparent)",
                  }}
                />
              )}

              {/* Badge ID */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "24px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "rgba(200,169,110,0.1)",
                    color: gold,
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(200,169,110,0.2)",
                  }}
                >
                  {f.id}
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {f.category}
                </span>
              </div>

              {/* Titre */}
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                  color: isSelected ? gold : "#ffffff",
                  transition: "color 0.2s",
                }}
              >
                {f.title}
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "13px",
                  margin: "0 0 28px",
                }}
              >
                Formation certifiante — Accès à vie
              </p>

              {/* Prix */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "40px",
                      fontWeight: "800",
                      color: gold,
                      lineHeight: "1",
                    }}
                  >
                    {f.price}
                  </span>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "rgba(200,169,110,0.7)",
                      marginLeft: "4px",
                    }}
                  >
                    €
                  </span>
                </div>
                <div
                  style={{
                    paddingBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "12px",
                    }}
                  >
                    ou
                  </div>
                  <div
                    style={{
                      color: "rgba(200,169,110,0.8)",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    3x {monthly}€
                  </div>
                </div>
              </div>

              {/* Features */}
              <div
                style={{
                  marginBottom: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {[
                  "Certificat AcadémIA Pro",
                  "Support instructeur dédié",
                  "Mises à jour incluses",
                ].map((feat) => (
                  <div
                    key={feat}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(200,169,110,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: gold,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "13px",
                      }}
                    >
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: isSelected ? "none" : "1px solid rgba(200,169,110,0.3)",
                  background: isSelected
                    ? "linear-gradient(135deg, " + gold + " 0%, #b8943e 100%)"
                    : "transparent",
                  color: isSelected ? darkBg : gold,
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {isSelected ? "✓ Sélectionnée" : "Choisir cette formation"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Section certification */}
      <div
        style={{
          borderTop: "1px solid " + cardBorder,
          background: "linear-gradient(180deg, #050508 0%, #0a0a12 100%)",
          padding: "60px 40px",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(200,169,110,0.2) 0%, rgba(200,169,110,0.05) 100%)",
              border: "1px solid rgba(200,169,110,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "32px",
            }}
          >
            🏆
          </div>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "800",
              margin: "0 0 16px",
              color: gold,
            }}
          >
            Certification AcadémIA Pro
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "16px",
              lineHeight: "1.7",
              margin: "0 0 40px",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Chaque formation est sanctionnée par un certificat officiel AcadémIA Pro, reconnu par les professionnels du secteur. Validez vos compétences et boostez votre carrière.
          </p>

          {/* 3 colonnes garanties */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                icon: "💳",
                title: "Paiement 3x",
                desc: "Sans frais supplémentaires. Étalez votre investissement sur 3 mois.",
              },