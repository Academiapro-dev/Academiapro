import React, { useState } from "react";

const certifications = [
  {
    id: 1,
    formation: "React & TypeScript Avancé",
    niveau: "Master",
    mention: "Très Bien",
    date: "15 Mars 2024",
    pdf: "#",
    linkedin: "#",
  },
  {
    id: 2,
    formation: "Node.js & API REST",
    niveau: "Expert",
    mention: "Bien",
    date: "22 Janvier 2024",
    pdf: "#",
    linkedin: "#",
  },
  {
    id: 3,
    formation: "UX/UI Design Fondamentaux",
    niveau: "Certificat",
    mention: "Assez Bien",
    date: "10 Novembre 2023",
    pdf: "#",
    linkedin: "#",
  },
  {
    id: 4,
    formation: "Introduction au Cloud AWS",
    niveau: "Attestation",
    mention: "Passable",
    date: "05 Septembre 2023",
    pdf: "#",
    linkedin: "#",
  },
  {
    id: 5,
    formation: "Machine Learning avec Python",
    niveau: "Expert",
    mention: "Très Bien",
    date: "18 Juillet 2023",
    pdf: "#",
    linkedin: "#",
  },
  {
    id: 6,
    formation: "Cybersécurité Essentielle",
    niveau: "Master",
    mention: "Bien",
    date: "02 Mai 2023",
    pdf: "#",
    linkedin: "#",
  },
];

const niveauConfig: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Attestation: {
    bg: "rgba(100, 100, 120, 0.15)",
    text: "#a0a0b8",
    border: "rgba(100, 100, 120, 0.4)",
    icon: "◈",
  },
  Certificat: {
    bg: "rgba(200, 169, 110, 0.12)",
    text: "#c8a96e",
    border: "rgba(200, 169, 110, 0.4)",
    icon: "◆",
  },
  Expert: {
    bg: "rgba(180, 140, 80, 0.18)",
    text: "#e0b87a",
    border: "rgba(200, 169, 110, 0.6)",
    icon: "★",
  },
  Master: {
    bg: "rgba(200, 169, 110, 0.22)",
    text: "#f0d090",
    border: "rgba(220, 190, 120, 0.8)",
    icon: "♛",
  },
};

const mentionColors: Record<string, string> = {
  "Passable": "#a0a0b8",
  "Assez Bien": "#90b8d0",
  "Bien": "#90d0a8",
  "Très Bien": "#c8a96e",
};

const CertificationCard = ({ cert }: { cert: typeof certifications[0] }) => {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [cardHovered, setCardHovered] = useState(false);
  const config = niveauConfig[cert.niveau];

  return (
    <div
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
      style={{
        background: cardHovered
          ? "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(10,10,20,0.95) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(5,5,8,0.95) 100%)",
        border: cardHovered
          ? "1px solid rgba(200,169,110,0.35)"
          : "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        transition: "all 0.35s ease",
        cursor: "default",
        boxShadow: cardHovered
          ? "0 8px 40px rgba(200,169,110,0.12), inset 0 1px 0 rgba(200,169,110,0.1)"
          : "0 4px 20px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)",
          transition: "opacity 0.35s ease",
          opacity: cardHovered ? 1 : 0,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <h3
          style={{
            color: "#f0e8d8",
            fontSize: "15px",
            fontWeight: "600",
            margin: 0,
            lineHeight: "1.4",
            flex: 1,
            letterSpacing: "0.01em",
          }}
        >
          {cert.formation}
        </h3>
        <span
          style={{
            background: config.bg,
            color: config.text,
            border: "1px solid " + config.border,
            borderRadius: "8px",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            whiteSpace: "nowrap" as const,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "10px" }}>{config.icon}</span>
          {cert.niveau}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap" as const,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <span style={{ color: "#555570", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
            Mention
          </span>
          <span
            style={{
              color: mentionColors[cert.mention] || "#c8a96e",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            {cert.mention}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <span style={{ color: "#555570", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
            Date
          </span>
          <span style={{ color: "#8888a0", fontSize: "13px", fontWeight: "500" }}>
            {cert.date}
          </span>
        </div>
      </div>

      <div
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(200,169,110,0.2), transparent)",
        }}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <a
          href={cert.pdf}
          onMouseEnter={() => setHoveredBtn("pdf" + cert.id)}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "9px 16px",
            borderRadius: "9px",
            background: hoveredBtn === "pdf" + cert.id
              ? "linear-gradient(135deg, #c8a96e, #e0b87a)"
              : "rgba(200,169,110,0.1)",
            border: "1px solid rgba(200,169,110,0.3)",
            color: hoveredBtn === "pdf" + cert.id ? "#050508" : "#c8a96e",
            fontSize: "12px",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.25s ease",
            letterSpacing: "0.03em",
            cursor: "pointer",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Télécharger PDF
        </a>

        <a
          href={cert.linkedin}
          onMouseEnter={() => setHoveredBtn("li" + cert.id)}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "9px 16px",
            borderRadius: "9px",
            background: hoveredBtn === "li" + cert.id
              ? "rgba(10, 102, 194, 0.9)"
              : "rgba(10, 102, 194, 0.1)",
            border: "1px solid rgba(10,102,194,0.4)",
            color: hoveredBtn === "li" + cert.id ? "#ffffff" : "#5ba4e0",
            fontSize: "12px",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.25s ease",
            letterSpacing: "0.03em",
            cursor: "pointer",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
          </svg>
          Partager
        </a>
      </div>
    </div>
  );
};

const LevelFilter = ({
  levels,
  active,
  onChange,
}: {
  levels: string[];
  active: string;
  onChange: (l: string) => void;
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
      {["Tous", ...levels].map((level) => {
        const isActive = active === level;
        const isHov = hovered === level;
        const config = niveauConfig[level];

        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            onMouseEnter={() => setHovered(level)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: isActive
                ? "1px solid " + (config ? config.border : "rgba(200,169,110,0.6)")
                : "1px solid rgba(255,255,255,0.08)",
              background: isActive
                ? config
                  ? config.bg
                  : "rgba(200,169,110,0.15)"
                : isHov
                ? "rgba(255,255,255,0.05)"
                : "transparent",
              color: isActive
                ? config
                  ? config.text
                  : "#c8a96e"
                : isHov
                ? "#c8a96e"
                : "#666680",
              fontSize: "12px",
              fontWeight: isActive ? "700" : "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {config && (
              <span style={{ fontSize: "10px" }}>{config.icon}</span>
            )}
            {level}
          </button>
        );
      })}
    </div>
  );
};

export default function MesCertificats() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const levels = ["Attestation", "Certificat", "Expert", "Master"];

  const filtered =
    activeFilter === "Tous"
      ? certifications
      : certifications.filter((c) => c.niveau === activeFilter);

  const stats = levels.map((l) => ({
    niveau: l,
    count: certifications.filter((c) => c.niveau === l).length,
  }));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "3px",
                height: "32px",
                background: "linear-gradient(180deg, #c8a96e, #e0b87a)",
                borderRadius: "2px",
              }}
            />
            <h1
              style={{
                color: "#f0e8d8",
                fontSize: "28px",
                fontWeight: "700",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Mes Certificats
            </h1>
          </div>
          <p style={{ color: "#555570", fontSize: "14px", margin: "0 0 0 15px" }}>
            {certifications.length} certifications obtenues
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: