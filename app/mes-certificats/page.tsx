import React, { useState } from "react";

const certificates = [
  {
    id: 1,
    formation: "Machine Learning Specialization",
    niveau: 1,
    mention: "Distinction",
    date: "Mars 2024",
    organisme: "Coursera / Stanford",
    fichier: "ml-specialization.pdf",
    linkedin: "https://linkedin.com/in/yourprofile",
  },
  {
    id: 2,
    formation: "AWS Solutions Architect",
    niveau: 2,
    mention: "Excellence",
    date: "Janvier 2024",
    organisme: "Amazon Web Services",
    fichier: "aws-architect.pdf",
    linkedin: "https://linkedin.com/in/yourprofile",
  },
  {
    id: 3,
    formation: "React Advanced Patterns",
    niveau: 1,
    mention: "Très Bien",
    date: "Novembre 2023",
    organisme: "Frontend Masters",
    fichier: "react-advanced.pdf",
    linkedin: "https://linkedin.com/in/yourprofile",
  },
  {
    id: 4,
    formation: "Data Science Professional",
    niveau: 3,
    mention: "Excellence",
    date: "Septembre 2023",
    organisme: "IBM / Coursera",
    fichier: "data-science.pdf",
    linkedin: "https://linkedin.com/in/yourprofile",
  },
  {
    id: 5,
    formation: "Docker & Kubernetes Mastery",
    niveau: 2,
    mention: "Bien",
    date: "Juillet 2023",
    organisme: "Udemy",
    fichier: "docker-k8s.pdf",
    linkedin: "https://linkedin.com/in/yourprofile",
  },
  {
    id: 6,
    formation: "TypeScript Expert Certification",
    niveau: 4,
    mention: "Distinction",
    date: "Mai 2023",
    organisme: "Microsoft Learn",
    fichier: "typescript-expert.pdf",
    linkedin: "https://linkedin.com/in/yourprofile",
  },
  {
    id: 7,
    formation: "Cybersecurity Fundamentals",
    niveau: 1,
    mention: "Bien",
    date: "Février 2023",
    organisme: "CISCO Networking Academy",
    fichier: "cybersec.pdf",
    linkedin: "https://linkedin.com/in/yourprofile",
  },
  {
    id: 8,
    formation: "Full Stack Web Development",
    niveau: 3,
    mention: "Très Bien",
    date: "Décembre 2022",
    organisme: "OpenClassrooms",
    fichier: "fullstack.pdf",
    linkedin: "https://linkedin.com/in/yourprofile",
  },
];

const niveauLabels: Record<number, string> = {
  1: "Fondamental",
  2: "Intermédiaire",
  3: "Avancé",
  4: "Expert",
};

const niveauColors: Record<number, string> = {
  1: "#c8a96e",
  2: "#e0c080",
  3: "#f0d090",
  4: "#ffffff",
};

const mentionColors: Record<string, string> = {
  "Bien": "#c8a96e",
  "Très Bien": "#e0c080",
  "Distinction": "#f0d090",
  "Excellence": "#ffffff",
};

const gold = "#c8a96e";
const goldLight = "#e0c080";
const bg = "#050508";
const cardBg = "#0d0d14";
const borderColor = "#2a2520";

export default function Certifications() {
  const [filterNiveau, setFilterNiveau] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [hoveredFilter, setHoveredFilter] = useState<number | null>(null);

  const filtered = filterNiveau
    ? certificates.filter((c) => c.niveau === filterNiveau)
    : certificates;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: bg,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div
            style={{
              display: "inline-block",
              width: "48px",
              height: "2px",
              backgroundColor: gold,
              marginBottom: "20px",
            }}
          />
          <h1
            style={{
              color: "#ffffff",
              fontSize: "38px",
              fontWeight: "300",
              letterSpacing: "6px",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}
          >
            Mes Certifications
          </h1>
          <p
            style={{
              color: gold,
              fontSize: "14px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              margin: "0",
              fontWeight: "400",
            }}
          >
            Formations — Niveaux — Mentions
          </p>
          <div
            style={{
              display: "inline-block",
              width: "48px",
              height: "2px",
              backgroundColor: gold,
              marginTop: "20px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "48px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setFilterNiveau(null)}
            onMouseEnter={() => setHoveredFilter(0)}
            onMouseLeave={() => setHoveredFilter(null)}
            style={{
              padding: "8px 20px",
              backgroundColor: filterNiveau === null
                ? gold
                : hoveredFilter === 0 ? "#1a1a22" : "transparent",
              color: filterNiveau === null ? bg : gold,
              border: "1px solid " + gold,
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
          >
            Tous
          </button>
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setFilterNiveau(n)}
              onMouseEnter={() => setHoveredFilter(n)}
              onMouseLeave={() => setHoveredFilter(null)}
              style={{
                padding: "8px 20px",
                backgroundColor: filterNiveau === n
                  ? gold
                  : hoveredFilter === n ? "#1a1a22" : "transparent",
                color: filterNiveau === n ? bg : niveauColors[n],
                border: "1px solid " + niveauColors[n],
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              {niveauLabels[n]}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))",
            gap: "2px",
          }}
        >
          {filtered.map((cert) => (
            <div
              key={cert.id}
              onMouseEnter={() => setHoveredId(cert.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                backgroundColor: hoveredId === cert.id ? "#12121c" : cardBg,
                border: "1px solid " + (hoveredId === cert.id ? "#3a3028" : borderColor),
                padding: "28px 32px",
                transition: "all 0.25s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  width: hoveredId === cert.id ? "3px" : "0px",
                  height: "100%",
                  backgroundColor: niveauColors[cert.niveau],
                  transition: "width 0.25s",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      color: "#ffffff",
                      fontSize: "16px",
                      fontWeight: "500",
                      margin: "0 0 4px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {cert.formation}
                  </h3>
                  <span
                    style={{
                      color: "#888",
                      fontSize: "12px",
                      letterSpacing: "1px",
                    }}
                  >
                    {cert.organisme}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid " + niveauColors[cert.niveau],
                      color: niveauColors[cert.niveau],
                      padding: "3px 10px",
                      fontSize: "9px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      fontWeight: "600",
                      borderRadius: "1px",
                    }}
                  >
                    N{cert.niveau} — {niveauLabels[cert.niveau]}
                  </span>
                  <span
                    style={{
                      color: mentionColors[cert.mention] || gold,
                      fontSize: "10px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      fontWeight: "500",
                    }}
                  >
                    ✦ {cert.mention}
                  </span>
                </div>
              </div>

              <div
                style={{
                  height: "1px",
                  backgroundColor: borderColor,
                  marginBottom: "16px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#666",
                    fontSize: "12px",
                    letterSpacing: "1px",
                  }}
                >
                  <span style={{ color: gold, fontSize: "10px" }}>◈</span>
                  {cert.date}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <a
                    href={cert.fichier}
                    download
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      backgroundColor: "transparent",
                      border: "1px solid #2a2520",
                      color: gold,
                      fontSize: "10px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      borderRadius: "1px",
                      transition: "all 0.2s",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    PDF
                  </a>

                  <a
                    href={cert.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      backgroundColor: "transparent",
                      border: "1px solid #0077b5",
                      color: "#0077b5",
                      fontSize: "10px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      borderRadius: "1px",
                      transition: "all 0.2s",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "60px",
            padding: "24px 32px",
            backgroundColor: cardBg,
            border: "1px solid " + borderColor,
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "200",
                  color: niveauColors[n],
                  letterSpacing: "2px",
                }}
              >
                {certificates.filter((c) => c.niveau === n).length}
              </div>
              <div
                style={{
                  fontSize: