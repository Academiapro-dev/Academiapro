"use client";
import { useState } from "react";

export default function LinktreePage() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredSocial, setHoveredSocial] = useState(null);

  const buttons = [
    {
      id: 0,
      emoji: "🎓",
      label: "Formations Complètes",
      sublabel: "Accède à tous mes programmes",
      color: "#c8a96e",
    },
    {
      id: 1,
      emoji: "📅",
      label: "Séance Découverte",
      sublabel: "Réserve ta session gratuite",
      color: "#d4b87a",
    },
    {
      id: 2,
      emoji: "📖",
      label: "eBook Exclusif",
      sublabel: "Télécharge ton guide offert",
      color: "#c8a96e",
    },
    {
      id: 3,
      emoji: "🚀",
      label: "Starter Pack IA",
      sublabel: "Lance-toi avec l'intelligence artificielle",
      color: "#d4b87a",
    },
    {
      id: 4,
      emoji: "🤖",
      label: "Formation IA Complet",
      sublabel: "Maîtrise l'IA de A à Z",
      color: "#c8a96e",
    },
    {
      id: 5,
      emoji: "👥",
      label: "Communauté Privée",
      sublabel: "Rejoins notre groupe exclusif",
      color: "#d4b87a",
    },
    {
      id: 6,
      emoji: "🎥",
      label: "Webinaire Gratuit",
      sublabel: "Prochain live — inscris-toi",
      color: "#c8a96e",
    },
    {
      id: 7,
      emoji: "⚡",
      label: "Mini-Cours Offert",
      sublabel: "Commence à apprendre maintenant",
      color: "#d4b87a",
    },
  ];

  const socials = [
    { id: 0, label: "Instagram", emoji: "📸" },
    { id: 1, label: "TikTok", emoji: "🎵" },
    { id: 2, label: "YouTube", emoji: "▶️" },
    { id: 3, label: "LinkedIn", emoji: "💼" },
    { id: 4, label: "Twitter/X", emoji: "✖️" },
    { id: 5, label: "Telegram", emoji: "✈️" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px 60px 20px",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #c8a96e 0%, #f0d090 50%, #c8a96e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "38px",
          marginBottom: "16px",
          boxShadow: "0 0 30px rgba(200,169,110,0.4), 0 0 60px rgba(200,169,110,0.15)",
        }}
      >
        ✨
      </div>

      <h1
        style={{
          color: "#c8a96e",
          fontSize: "22px",
          fontWeight: "700",
          margin: "0 0 6px 0",
          letterSpacing: "1px",
          textAlign: "center",
        }}
      >
        @TonPseudo
      </h1>

      <p
        style={{
          color: "#888899",
          fontSize: "13px",
          textAlign: "center",
          margin: "0 0 6px 0",
          lineHeight: "1.5",
          maxWidth: "300px",
        }}
      >
        Coach IA • Formateur • Entrepreneur
      </p>

      <p
        style={{
          color: "#666677",
          fontSize: "12px",
          textAlign: "center",
          margin: "0 0 32px 0",
          lineHeight: "1.6",
          maxWidth: "320px",
        }}
      >
        J'aide les entrepreneurs à automatiser leur business grâce à l'intelligence artificielle 🤖
      </p>

      <div
        style={{
          width: "60px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
          marginBottom: "32px",
        }}
      />

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "40px",
        }}
      >
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onMouseEnter={() => setHoveredIndex(btn.id)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              width: "100%",
              padding: "16px 20px",
              backgroundColor: hoveredIndex === btn.id ? "rgba(200,169,110,0.12)" : "rgba(255,255,255,0.03)",
              border: hoveredIndex === btn.id ? "1px solid rgba(200,169,110,0.7)" : "1px solid rgba(200,169,110,0.2)",
              borderRadius: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              transition: "all 0.25s ease",
              transform: hoveredIndex === btn.id ? "translateY(-2px)" : "translateY(0px)",
              boxShadow: hoveredIndex === btn.id ? "0 8px 25px rgba(200,169,110,0.18)" : "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "rgba(200,169,110,0.1)",
                border: "1px solid rgba(200,169,110,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: "0",
              }}
            >
              {btn.emoji}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                flex: "1",
              }}
            >
              <span
                style={{
                  color: "#e8d4a8",
                  fontSize: "14px",
                  fontWeight: "600",
                  letterSpacing: "0.3px",
                  lineHeight: "1.3",
                }}
              >
                {btn.label}
              </span>
              <span
                style={{
                  color: "#666677",
                  fontSize: "11px",
                  marginTop: "2px",
                  lineHeight: "1.3",
                }}
              >
                {btn.sublabel}
              </span>
            </div>

            <div
              style={{
                color: hoveredIndex === btn.id ? "#c8a96e" : "#444455",
                fontSize: "16px",
                flexShrink: "0",
                transition: "color 0.25s ease",
              }}
            >
              →
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          width: "100%",
          marginBottom: "28px",
        }}
      >
        <p
          style={{
            color: "#555566",
            fontSize: "11px",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "16px",
          }}
        >
          Retrouve-moi sur
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          {socials.map((s) => (
            <button
              key={s.id}
              onMouseEnter={() => setHoveredSocial(s.id)}
              onMouseLeave={() => setHoveredSocial(null)}
              style={{
                padding: "10px 16px",
                backgroundColor: hoveredSocial === s.id ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.03)",
                border: hoveredSocial === s.id ? "1px solid rgba(200,169,110,0.6)" : "1px solid rgba(200,169,110,0.15)",
                borderRadius: "30px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
                transform: hoveredSocial === s.id ? "scale(1.05)" : "scale(1)",
              }}
            >
              <span style={{ fontSize: "14px" }}>{s.emoji}</span>
              <span
                style={{
                  color: hoveredSocial === s.id ? "#c8a96e" : "#777788",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "color 0.2s ease",
                }}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          width: "60px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
          marginBottom: "20px",
        }}
      />

      <p
        style={{
          color: "#333344",
          fontSize: "11px",
          textAlign: "center",
          letterSpacing: "0.5px",
        }}
      >
        © 2024 TonPseudo — Tous droits réservés
      </p>
    </div>
  );
}