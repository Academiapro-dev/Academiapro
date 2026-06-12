"use client";
import { useState } from "react";

export default function TunnelVentePage() {
  const [etape, setEtape] = useState(1);
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [compteur1, setCompteur1] = useState(7);
  const [compteur2, setCompteur2] = useState(3);

  function handleEtape1() {
    if (prenom.trim() && email.trim()) {
      setEtape(2);
    }
  }

  function handleEtape2() {
    setEtape(3);
  }

  function handleEtape3() {
    setEtape(4);
  }

  function handleAchat() {
    setEtape(4);
  }

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "Georgia, serif",
        color: "#f0e6d3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 60px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          paddingTop: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "48px",
          }}
        >
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                width: "48px",
                height: "4px",
                borderRadius: "2px",
                backgroundColor: etape >= n ? "#c8a96e" : "#2a2a3a",
                transition: "background-color 0.4s ease",
              }}
            />
          ))}
        </div>

        {etape === 1 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "#c8a96e",
                color: "#050508",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "3px",
                textTransform: "uppercase",
                padding: "6px 18px",
                borderRadius: "20px",
                marginBottom: "28px",
              }}
            >
              Accès Gratuit Immédiat
            </div>

            <h1
              style={{
                fontSize: "clamp(26px, 5vw, 42px)",
                fontWeight: "700",
                textAlign: "center",
                lineHeight: "1.25",
                marginBottom: "16px",
                color: "#f0e6d3",
              }}
            >
              Télécharge le Guide Gratuit qui a Aidé{" "}
              <span style={{ color: "#c8a96e" }}>847 Entrepreneurs</span> à
              Doubler leurs Revenus en 90 Jours
            </h1>

            <p
              style={{
                fontSize: "17px",
                textAlign: "center",
                color: "#b0a090",
                lineHeight: "1.7",
                marginBottom: "36px",
                maxWidth: "540px",
              }}
            >
              Découvre la méthode exacte, étape par étape, pour passer de 0 à
              5 000€ par mois — même en partant de zéro et sans audience.
            </p>

            <div
              style={{
                backgroundColor: "#0e0e18",
                border: "1px solid #2a2a3a",
                borderRadius: "16px",
                padding: "32px",
                width: "100%",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "#c8a96e",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Ton Prénom
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Entre ton prénom..."
                    style={{
                      width: "100%",
                      backgroundColor: "#050508",
                      border: "1px solid #3a3a4a",
                      borderRadius: "8px",
                      padding: "14px 16px",
                      color: "#f0e6d3",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "#c8a96e",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Ton Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    style={{
                      width: "100%",
                      backgroundColor: "#050508",
                      border: "1px solid #3a3a4a",
                      borderRadius: "8px",
                      padding: "14px 16px",
                      color: "#f0e6d3",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleEtape1}
                style={{
                  width: "100%",
                  backgroundColor: "#c8a96e",
                  color: "#050508",
                  border: "none",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "17px",
                  fontWeight: "700",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                Oui, je veux mon guide gratuit →
              </button>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#605060",
                  marginTop: "12px",
                  marginBottom: "0",
                }}
              >
                🔒 100% gratuit. Zéro spam. Désabonnement en 1 clic.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                width: "100%",
              }}
            >
              {[
                "✓ La méthode des 3 piliers pour une offre irrésistible",
                "✓ Le script exact pour trouver tes 10 premiers clients",
                "✓ Le système d'automatisation qui travaille pendant que tu dors",
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    backgroundColor: "#0e0e18",
                    border: "1px solid #1a1a2a",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    fontSize: "14px",
                    color: "#c0b090",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {etape === 2 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "#1a0a0a",
                border: "1px solid #c8a96e",
                borderRadius: "12px",
                padding: "16px 24px",
                marginBottom: "32px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#c8a96e",
                  fontSize: "14px",
                  fontWeight: "700",
                  margin: "0",
                  letterSpacing: "1px",
                }}
              >
                ⚡ OFFRE RÉSERVÉE AUX NOUVEAUX INSCRITS UNIQUEMENT
              </p>
            </div>

            <h2
              style={{
                fontSize: "clamp(24px, 4.5vw, 38px)",
                fontWeight: "700",
                textAlign: "center",
                lineHeight: "1.25",
                marginBottom: "16px",
                color: "#f0e6d3",
              }}
            >
              Attends ! Avant d'accéder au guide, découvre notre{" "}
              <span style={{ color: "#c8a96e" }}>Starter Pack à 47€</span>
            </h2>

            <p
              style={{
                fontSize: "17px",
                textAlign: "center",
                color: "#b0a090",
                lineHeight: "1.7",
                marginBottom: "36px",
                maxWidth: "540px",
              }}
            >
              Le guide est puissant. Mais avec le Starter Pack, tu passes à
              l'action 10x plus vite avec des templates prêts à l'emploi et un
              plan d'action personnalisé.
            </p>

            <div
              style={{
                backgroundColor: "#0e0e18",
                border: "1px solid #2a2a3a",
                borderRadius: "16px",
                padding: "32px",
                width: "100%",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "28px",
                }}
              >
                {[
                  { icon: "📋", titre: "12 Templates Swipe-File", valeur: "97€" },
                  { icon: "🎯", titre: "Plan 90 Jours Personnalisé", valeur: "67€" },
                  { icon: "📊", titre: "Tableau de Bord Revenus", valeur: "47€" },
                  { icon: "🔥", titre: "Scripts de Vente Éprouvés", valeur: "77€" },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: "#050508",
                      border: "1px solid #2a2a3a",
                      borderRadius: "10px",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                      {item.icon}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#c0b090",
                        marginBottom: "6px",
                        lineHeight: "1.3",
                      }}
                    >
                      {item.titre}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#606070",
                        textDecoration: "line-through",
                      }}
                    >
                      {item.valeur}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  backgroundColor: "#0a0a14",
                  border: "1px solid #c8a96e",
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "center",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#808090",
                    marginBottom: "4px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                  }}
                >
                  Valeur totale : 288€
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "22px",
                      color: "#505060",
                      textDecoration: "line-through",
                    }}
                  >
                    97€
                  </span>
                  <span
                    style={{
                      fontSize: "48px",
                      fontWeight: "700",
                      color: "#c8a96e",
                    }}
                  >
                    47€
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: "#c8a96e",
                    color: "#050508",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "2px",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    display: "inline-block",
                    marginTop: "8px",
                  }}
                >
                  ÉCONOMISE 50€ AUJOURD'HUI SEULEMENT
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#1a0808",
                  border: "1px solid #4a1a1a",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "#e06060",
                    fontSize: "14px",
                    fontWeight: "600",
                    margin: "0",
                  }}
                >
                  🔴 Il ne reste que{" "}
                  <span style={{ color: "#ff7070", fontWeight: "700" }}>
                    {compteur1}
                  </span>{" "}
                  places à ce tarif réduit
                </p>
              </div>

              <button
                onClick={handleEtape2}
                style={{
                  width: "100%",
                  backgroundColor: "#c8a96e",
                  color: "#050508",
                  border: "none",
                  borderRadius: "8px",
                  padding: "18px",
                  fontSize: "17px",
                  fontWeight: "700",
                  cursor: "pointer",
                  marginBottom: "12px",
                  letterSpacing: "0.5px",
                }}
              >
                Oui ! Je prends le Starter Pack à 47€ →
              </button>

              <button
                onClick={() => setEtape(3)}