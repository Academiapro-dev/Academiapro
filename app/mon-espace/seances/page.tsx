import React, { useState } from "react";

const gold = "#c8a96e";
const dark = "#050508";
const darkCard = "#0d0d14";
const darkBorder = "#1a1a28";
const textMuted = "#7a7a9a";
const textLight = "#e8e0d0";

const sessions = [
  {
    id: 1,
    type: "Coaching Individuel",
    coach: "Sophie Laurent",
    date: "2025-01-28",
    time: "14:00",
    duration: "60 min",
    status: "upcoming",
    avatar: "SL",
  },
  {
    id: 2,
    type: "Session Stratégie",
    coach: "Marc Dubois",
    date: "2025-02-03",
    time: "10:30",
    duration: "90 min",
    status: "upcoming",
    avatar: "MD",
  },
  {
    id: 3,
    type: "Coaching Bien-être",
    coach: "Isabelle Morel",
    date: "2025-02-10",
    time: "16:00",
    duration: "60 min",
    status: "upcoming",
    avatar: "IM",
  },
  {
    id: 4,
    type: "Coaching Individuel",
    coach: "Sophie Laurent",
    date: "2025-01-15",
    time: "14:00",
    duration: "60 min",
    status: "past",
    avatar: "SL",
  },
  {
    id: 5,
    type: "Session Leadership",
    coach: "Marc Dubois",
    date: "2025-01-08",
    time: "11:00",
    duration: "90 min",
    status: "past",
    avatar: "MD",
  },
  {
    id: 6,
    type: "Atelier Mindfulness",
    coach: "Isabelle Morel",
    date: "2024-12-20",
    time: "09:00",
    duration: "120 min",
    status: "past",
    replay: true,
    avatar: "IM",
  },
  {
    id: 7,
    type: "Coaching Individuel",
    coach: "Sophie Laurent",
    date: "2024-12-10",
    time: "14:00",
    duration: "60 min",
    status: "past",
    replay: true,
    avatar: "SL",
  },
];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getDaysUntil = (dateStr: string) => {
  const today = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
};

export default function MesSeances() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "replay">(
    "upcoming"
  );
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");
  const pastSessions = sessions.filter((s) => s.status === "past" && !s.replay);
  const replaySessions = sessions.filter((s) => s.replay);

  const currentSessions =
    activeTab === "upcoming"
      ? upcomingSessions
      : activeTab === "past"
      ? pastSessions
      : replaySessions;

  return (
    <div
      style={{
        backgroundColor: dark,
        minHeight: "100vh",
        fontFamily: "'Georgia', serif",
        color: textLight,
        padding: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid " + darkBorder,
          padding: "32px 40px 0",
          backgroundColor: dark,
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "32px",
            }}
          >
            <div>
              <p
                style={{
                  color: gold,
                  fontSize: "11px",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  margin: "0 0 8px 0",
                }}
              >
                Espace Personnel
              </p>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "300",
                  color: textLight,
                  margin: "0",
                  letterSpacing: "1px",
                }}
              >
                Mes Séances
              </h1>
            </div>

            {/* Bouton Réserver */}
            <button
              onClick={() => setShowModal(true)}
              onMouseEnter={() => setHoveredBtn("reserve")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                backgroundColor:
                  hoveredBtn === "reserve" ? gold : "transparent",
                color: hoveredBtn === "reserve" ? dark : gold,
                border: "1px solid " + gold,
                padding: "12px 28px",
                fontSize: "12px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontFamily: "'Georgia', serif",
              }}
            >
              + Réserver une séance
            </button>
          </div>

          {/* Stats rapides */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginBottom: "32px",
            }}
          >
            {[
              { label: "Prochaines", value: upcomingSessions.length },
              { label: "Effectuées", value: pastSessions.length },
              { label: "Replays dispo.", value: replaySessions.length },
            ].map((stat) => (
              <div key={stat.label}>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "300",
                    color: gold,
                    display: "block",
                    lineHeight: "1",
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: textMuted,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0" }}>
            {(
              [
                { key: "upcoming", label: "Prochaines séances" },
                { key: "past", label: "Séances passées" },
                { key: "replay", label: "Replays" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab.key
                      ? "2px solid " + gold
                      : "2px solid transparent",
                  color: activeTab === tab.key ? gold : textMuted,
                  padding: "12px 24px",
                  fontSize: "13px",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  fontFamily: "'Georgia', serif",
                  transition: "all 0.2s ease",
                  marginBottom: "-1px",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 40px",
        }}
      >
        {currentSessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: textMuted,
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "1px solid " + darkBorder,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "24px",
              }}
            >
              ◎
            </div>
            <p style={{ fontSize: "14px", letterSpacing: "1px" }}>
              Aucune séance dans cette catégorie
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {currentSessions.map((session) => {
              const daysUntil =
                session.status === "upcoming"
                  ? getDaysUntil(session.date)
                  : null;
              const isHovered = hoveredCard === session.id;

              return (
                <div
                  key={session.id}
                  onMouseEnter={() => setHoveredCard(session.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    backgroundColor: isHovered ? "#0f0f1a" : darkCard,
                    border:
                      "1px solid " + (isHovered ? "#2a2a3a" : darkBorder),
                    padding: "28px 32px",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                    cursor: "default",
                  }}
                >
                  {/* Avatar coach */}
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      backgroundColor: "transparent",
                      border: "1px solid " + gold,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      color: gold,
                      letterSpacing: "1px",
                      flexShrink: "0" as any,
                    }}
                  >
                    {session.avatar}
                  </div>

                  {/* Info principale */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "400",
                          color: textLight,
                          margin: "0",
                        }}
                      >
                        {session.type}
                      </h3>
                      {session.replay && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: gold,
                            border: "1px solid " + gold,
                            padding: "2px 8px",
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
                          }}
                        >
                          Replay
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: textMuted,
                        margin: "0 0 8px 0",
                      }}
                    >
                      avec {session.coach}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{ fontSize: "13px", color: textLight }}
                      >
                        {formatDate(session.date)}
                      </span>
                      <span
                        style={{
                          width: "3px",
                          height: "3px",
                          borderRadius: "50%",
                          backgroundColor: textMuted,
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontSize: "13px", color: textMuted }}>
                        {session.time}
                      </span>
                      <span
                        style={{
                          width: "3px",
                          height: "3px",
                          borderRadius: "50%",
                          backgroundColor: textMuted,
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontSize: "13px", color: textMuted }}>
                        {session.duration}
                      </span>
                    </div>
                  </div>

                  {/* Droite */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "12px",
                      flexShrink: "0" as any,
                    }}
                  >
                    {daysUntil !== null && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: daysUntil <= 3 ? "#e8a06e" : textMuted,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                        }}
                      >
                        {daysUntil === 0
                          ? "Aujourd'hui"
                          : daysUntil === 1
                          ? "Demain"
                          : "Dans " + daysUntil + " jours"}
                      </span>
                    )}

                    {session.status === "upcoming" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onMouseEnter={() =>
                            setHoveredBtn("join-" + session.id)
                          }
                          onMouseLeave={() => setHoveredBtn(null)}
                          style={{
                            backgroundColor:
                              hoveredBtn === "join-" + session.id
                                ? gold
                                : "transparent",
                            color:
                              hoveredBtn === "join-" + session.id
                                ? dark
                                : gold,
                            border: "1px solid " + gold,
                            padding: "8px 20px",
                            fontSize: "11px",
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            fontFamily: "'Georgia', serif",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Rejoindre