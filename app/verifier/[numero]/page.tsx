"use client";
import { useState } from "react";

export default function CertificatPage() {
  const [code, setCode] = useState("");
  const [resultat, setResultat] = useState(null);

  const certificats = {
    "CERT-2024-001": {
      nom: "Jean-Pierre Moreau",
      formation: "Excellence en Leadership",
      date: "15 Mars 2024",
      organisme: "Institut Prestige",
      mention: "Très Bien",
      valide: true,
    },
    "CERT-2024-002": {
      nom: "Sophie Durand",
      formation: "Management Avancé",
      date: "22 Avril 2024",
      organisme: "Institut Prestige",
      mention: "Excellent",
      valide: true,
    },
    "CERT-2024-003": {
      nom: "Marc Leblanc",
      formation: "Digital Strategy",
      date: "10 Mai 2024",
      organisme: "Institut Prestige",
      mention: "Bien",
      valide: true,
    },
  };

  function verifier() {
    if (!code.trim()) return;
    const trouve = certificats[code.trim().toUpperCase()];
    if (trouve) {
      setResultat({ ...trouve, code: code.trim().toUpperCase() });
    } else {
      setResultat({ valide: false, code: code.trim().toUpperCase() });
    }
  }

  function reset() {
    setCode("");
    setResultat(null);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "50px",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              border: "2px solid #c8a96e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px auto",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c8a96e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M9 12l-4 8 7-2 7 2-4-8" />
            </svg>
          </div>

          <div
            style={{
              fontSize: "11px",
              letterSpacing: "4px",
              color: "#c8a96e",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            Institut Prestige
          </div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "300",
              color: "#f5f0e8",
              margin: "0 0 12px 0",
              letterSpacing: "1px",
            }}
          >
            Vérification de Certificat
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "#7a7060",
              margin: "0",
              lineHeight: "1.7",
            }}
          >
            Entrez le numéro de certificat pour confirmer son authenticité
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#0d0d12",
            border: "1px solid #1e1c26",
            borderRadius: "12px",
            padding: "40px",
            marginBottom: "32px",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "11px",
              letterSpacing: "3px",
              color: "#c8a96e",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            Numéro de Certificat
          </label>

          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifier()}
              placeholder="Ex: CERT-2024-001"
              style={{
                flex: "1",
                backgroundColor: "#08080e",
                border: "1px solid #2a2630",
                borderRadius: "8px",
                padding: "14px 18px",
                color: "#f5f0e8",
                fontSize: "15px",
                fontFamily: "Georgia, serif",
                letterSpacing: "1px",
                outline: "none",
              }}
            />

            <button
              onClick={verifier}
              style={{
                backgroundColor: "#c8a96e",
                border: "none",
                borderRadius: "8px",
                padding: "14px 28px",
                color: "#050508",
                fontSize: "13px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "Georgia, serif",
                whiteSpace: "nowrap",
              }}
            >
              Vérifier
            </button>
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#3a3640",
                letterSpacing: "1px",
              }}
            >
              Exemples :
            </span>
            {["CERT-2024-001", "CERT-2024-002", "CERT-2024-003"].map((ex) => (
              <button
                key={ex}
                onClick={() => setCode(ex)}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #2a2630",
                  borderRadius: "4px",
                  padding: "3px 10px",
                  color: "#5a5560",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontFamily: "Georgia, serif",
                  letterSpacing: "1px",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {resultat && (
          <div
            style={{
              backgroundColor: "#0d0d12",
              border: resultat.valide ? "1px solid #1a3a1a" : "1px solid #3a1a1a",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: resultat.valide ? "#0a1f0a" : "#1f0a0a",
                padding: "20px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: resultat.valide ? "#0f2e0f" : "#2e0f0f",
                    border: resultat.valide ? "1px solid #2a6a2a" : "1px solid #6a2a2a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: "0",
                  }}
                >
                  {resultat.valide ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4caf50"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ef5350"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: resultat.valide ? "#4caf50" : "#ef5350",
                      letterSpacing: "1px",
                    }}
                  >
                    {resultat.valide ? "Certificat Authentique" : "Non Reconnu"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: resultat.valide ? "#2e6e2e" : "#6e2e2e",
                      marginTop: "2px",
                      letterSpacing: "1px",
                    }}
                  >
                    {resultat.code}
                  </div>
                </div>
              </div>

              <button
                onClick={reset}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #2a2630",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  color: "#5a5560",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontFamily: "Georgia, serif",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              >
                Nouveau
              </button>
            </div>

            {resultat.valide && (
              <div
                style={{
                  padding: "32px",
                }}
              >
                <div
                  style={{
                    borderBottom: "1px solid #1e1c26",
                    paddingBottom: "24px",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "3px",
                      color: "#c8a96e",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Titulaire
                  </div>
                  <div
                    style={{
                      fontSize: "26px",
                      color: "#f5f0e8",
                      fontWeight: "300",
                      letterSpacing: "1px",
                    }}
                  >
                    {resultat.nom}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "3px",
                        color: "#4a4650",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      Formation
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#c8baa0",
                      }}
                    >
                      {resultat.formation}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "3px",
                        color: "#4a4650",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      Date de Délivrance
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#c8baa0",
                      }}
                    >
                      {resultat.date}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "3px",
                        color: "#4a4650",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      Organisme
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#c8baa0",
                      }}
                    >
                      {resultat.organisme}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "3px",
                        color: "#4a4650",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      Mention
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#c8a96e",
                        fontWeight: "bold",
                      }}
                    >
                      {resultat.mention}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "28px",
                    paddingTop: "24px",
                    borderTop: "1px solid #1e1c26",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#4caf50",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#3a5a3a",
                      letterSpacing: "2px",
                    }}
                  >
                    Vérifié et validé par Institut Prestige
                  </span>
                </div>
              </div>
            )}

            {!resultat.valide && (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "#6a3a3a",
                    fontSize: "14px",
                    lineHeight: "1.8",
                    margin: "0 0 16px 0",
                  }}
                >
                  Le numéro <span style={{ color: