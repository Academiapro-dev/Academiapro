"use client";
import { useState } from "react";

export default function MesSeancesPage() {
  const [activeTab, setActiveTab] = useState("prochaines");

  const seancesProchaines = [
    {
      id: 1,
      titre: "Coaching Performance Mentale",
      date: "Lundi 16 Juin 2025",
      heure: "10h00 - 11h00",
      coach: "Sophie Martin",
      statut: "confirme",
    },
    {
      id: 2,
      titre: "Stratégie & Leadership",
      date: "Mercredi 18 Juin 2025",
      heure: "14h30 - 15h30",
      coach: "Marc Dupont",
      statut: "confirme",
    },
    {
      id: 3,
      titre: "Gestion du Stress",
      date: "Vendredi 20 Juin 2025",
      heure: "09h00 - 10h00",
      coach: "Léa Bernard",
      statut: "en_attente",
    },
  ];

  const seancesPassees = [
    {
      id: 4,
      titre: "Coaching Performance Mentale",
      date: "Lundi 9 Juin 2025",
      heure: "10h00 - 11h00",
      coach: "Sophie Martin",
      hasReplay: true,
    },
    {
      id: 5,
      titre: "Vision & Objectifs",
      date: "Jeudi 5 Juin 2025",
      heure: "11h00 - 12h00",
      coach: "Marc Dupont",
      hasReplay: true,
    },
    {
      id: 6,
      titre: "Communication Assertive",
      date: "Mardi 3 Juin 2025",
      heure: "15h00 - 16h00",
      coach: "Léa Bernard",
      hasReplay: false,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', sans-serif",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "#c8a96e",
              fontWeight: "600",
            }}
          >
            Espace personnel
          </span>
        </div>

        <h1
          style={{
            fontSize: "38px",
            fontWeight: "700",
            color: "#ffffff",
            margin: "0 0 6px 0",
            letterSpacing: "-0.5px",
          }}
        >
          Mes Séances
        </h1>

        <p
          style={{
            color: "#7a7a8c",
            fontSize: "15px",
            margin: "0 0 40px 0",
          }}
        >
          Retrouvez toutes vos séances de coaching et accédez à vos replays.
        </p>

        <div
          style={{
            marginBottom: "36px",
          }}
        >
          <button
            onClick={() => {}}
            style={{
              backgroundColor: "#c8a96e",
              color: "#050508",
              border: "none",
              borderRadius: "8px",
              padding: "14px 28px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              letterSpacing: "0.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "18px" }}>＋</span>
            Réserver une nouvelle séance
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "4px",
            backgroundColor: "#0e0e14",
            borderRadius: "10px",
            padding: "5px",
            marginBottom: "32px",
            width: "fit-content",
            border: "1px solid #1c1c28",
          }}
        >
          <button
            onClick={() => setActiveTab("prochaines")}
            style={{
              backgroundColor: activeTab === "prochaines" ? "#c8a96e" : "transparent",
              color: activeTab === "prochaines" ? "#050508" : "#7a7a8c",
              border: "none",
              borderRadius: "7px",
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Prochaines
          </button>
          <button
            onClick={() => setActiveTab("passees")}
            style={{
              backgroundColor: activeTab === "passees" ? "#c8a96e" : "transparent",
              color: activeTab === "passees" ? "#050508" : "#7a7a8c",
              border: "none",
              borderRadius: "7px",
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Passées & Replays
          </button>
        </div>

        {activeTab === "prochaines" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {seancesProchaines.map((seance) => (
              <div
                key={seance.id}
                style={{
                  backgroundColor: "#0b0b10",
                  border: "1px solid #1c1c28",
                  borderRadius: "14px",
                  padding: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "22px",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      backgroundColor: "#13131f",
                      border: "1px solid #c8a96e30",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      flexShrink: 0,
                    }}
                  >
                    🎯
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        color: "#ffffff",
                        fontSize: "16px",
                        fontWeight: "600",
                        margin: "0 0 6px 0",
                      }}
                    >
                      {seance.titre}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        gap: "18px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "#7a7a8c",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>📅</span>
                        {seance.date}
                      </span>
                      <span
                        style={{
                          color: "#7a7a8c",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>🕐</span>
                        {seance.heure}
                      </span>
                      <span
                        style={{
                          color: "#7a7a8c",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>👤</span>
                        {seance.coach}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      backgroundColor: seance.statut === "confirme" ? "#0d2e1a" : "#1e1a08",
                      color: seance.statut === "confirme" ? "#4ade80" : "#c8a96e",
                      border: seance.statut === "confirme" ? "1px solid #4ade8040" : "1px solid #c8a96e40",
                      borderRadius: "20px",
                      padding: "5px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {seance.statut === "confirme" ? "✓ Confirmé" : "⏳ En attente"}
                  </span>

                  <button
                    style={{
                      backgroundColor: "transparent",
                      color: "#c8a96e",
                      border: "1px solid #c8a96e40",
                      borderRadius: "8px",
                      padding: "9px 18px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Rejoindre
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "passees" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {seancesPassees.map((seance) => (
              <div
                key={seance.id}
                style={{
                  backgroundColor: "#0b0b10",
                  border: "1px solid #1c1c28",
                  borderRadius: "14px",
                  padding: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "20px",
                  opacity: "0.9",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "22px",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      backgroundColor: "#13131f",
                      border: "1px solid #2a2a3a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      flexShrink: 0,
                    }}
                  >
                    ✅
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        color: "#b0b0c0",
                        fontSize: "16px",
                        fontWeight: "600",
                        margin: "0 0 6px 0",
                      }}
                    >
                      {seance.titre}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        gap: "18px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "#555566",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>📅</span>
                        {seance.date}
                      </span>
                      <span
                        style={{
                          color: "#555566",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>🕐</span>
                        {seance.heure}
                      </span>
                      <span
                        style={{
                          color: "#555566",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>👤</span>
                        {seance.coach}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {seance.hasReplay ? (
                    <button
                      style={{
                        backgroundColor: "#c8a96e15",
                        color: "#c8a96e",
                        border: "1px solid #c8a96e50",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>▶</span>
                      Voir le replay
                    </button>
                  ) : (
                    <span
                      style={{
                        color: "#3a3a4a",
                        fontSize: "13px",
                        fontStyle: "italic",
                      }}
                    >
                      Replay indisponible
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div
              style={{
                backgroundColor: "#0b0b10",
                border: "1px dashed #1c1c28",
                borderRadius: "14px",
                padding: "24px",
                textAlign: "center",
                marginTop: "8px",
              }}
            >
              <p
                style={{
                  color: "#3a3a4a",
                  fontSize: "13px",
                  margin: "0",
                }}
              >
                Les replays sont disponibles pendant 30 jours après chaque séance.
              </p>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "48px",
            backgroundColor: "#0b0b10",
            border: "1px solid #c8a96e20",
            borderRadius: "14px",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div>
            <h3
              style={{
                color: "#c8a96e",
                fontSize: "16px",
                fontWeight: "700",
                margin: "0 0 6px 0",