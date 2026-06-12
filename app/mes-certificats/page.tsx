"use client";
import { useState } from "react";

export default function CertificatsPage() {
  const [hoveredId, setHoveredId] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const certificats = [
    {
      id: 1,
      niveau: 1,
      niveauLabel: "Fondamental",
      formation: "Introduction au Machine Learning",
      mention: "Très Bien",
      date: "15 Mars 2022",
      pdf: "/certificats/ml-intro.pdf",
      linkedin: "https://linkedin.com/in/exemple",
    },
    {
      id: 2,
      niveau: 1,
      niveauLabel: "Fondamental",
      formation: "Bases de Python pour la Data Science",
      mention: "Bien",
      date: "28 Juin 2022",
      pdf: "/certificats/python-data.pdf",
      linkedin: "https://linkedin.com/in/exemple",
    },
    {
      id: 3,
      niveau: 2,
      niveauLabel: "Intermédiaire",
      formation: "Deep Learning Spécialisation",
      mention: "Très Bien",
      date: "10 Novembre 2022",
      pdf: "/certificats/deep-learning.pdf",
      linkedin: "https://linkedin.com/in/exemple",
    },
    {
      id: 4,
      niveau: 2,
      niveauLabel: "Intermédiaire",
      formation: "Data Engineering avec Apache Spark",
      mention: "Assez Bien",
      date: "03 Février 2023",
      pdf: "/certificats/spark.pdf",
      linkedin: "https://linkedin.com/in/exemple",
    },
    {
      id: 5,
      niveau: 3,
      niveauLabel: "Avancé",
      formation: "MLOps et Déploiement de Modèles",
      mention: "Très Bien",
      date: "22 Mai 2023",
      pdf: "/certificats/mlops.pdf",
      linkedin: "https://linkedin.com/in/exemple",
    },
    {
      id: 6,
      niveau: 3,
      niveauLabel: "Avancé",
      formation: "NLP et Transformers Avancés",
      mention: "Excellence",
      date: "14 Août 2023",
      pdf: "/certificats/nlp.pdf",
      linkedin: "https://linkedin.com/in/exemple",
    },
    {
      id: 7,
      niveau: 4,
      niveauLabel: "Expert",
      formation: "Architecture de Systèmes IA à Grande Échelle",
      mention: "Excellence",
      date: "30 Janvier 2024",
      pdf: "/certificats/ia-architecture.pdf",
      linkedin: "https://linkedin.com/in/exemple",
    },
    {
      id: 8,
      niveau: 4,
      niveauLabel: "Expert",
      formation: "Recherche en IA Générative et LLMs",
      mention: "Très Bien",
      date: "18 Avril 2024",
      pdf: "/certificats/llm-research.pdf",
      linkedin: "https://linkedin.com/in/exemple",
    },
  ];

  const niveaux = [1, 2, 3, 4];

  const niveauConfig = {
    1: {
      label: "Fondamental",
      color: "#6db8f2",
      bg: "rgba(109,184,242,0.08)",
      border: "rgba(109,184,242,0.25)",
      dot: "#6db8f2",
    },
    2: {
      label: "Intermédiaire",
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.25)",
      dot: "#a78bfa",
    },
    3: {
      label: "Avancé",
      color: "#c8a96e",
      bg: "rgba(200,169,110,0.08)",
      border: "rgba(200,169,110,0.25)",
      dot: "#c8a96e",
    },
    4: {
      label: "Expert",
      color: "#f97316",
      bg: "rgba(249,115,22,0.08)",
      border: "rgba(249,115,22,0.25)",
      dot: "#f97316",
    },
  };

  const mentionColor = (mention) => {
    if (mention === "Excellence") return "#c8a96e";
    if (mention === "Très Bien") return "#6db8f2";
    if (mention === "Bien") return "#a78bfa";
    return "#94a3b8";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        padding: "60px 24px 80px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
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
              backgroundColor: "rgba(200,169,110,0.1)",
              border: "1px solid rgba(200,169,110,0.3)",
              borderRadius: "100px",
              padding: "6px 20px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                color: "#c8a96e",
                fontSize: "13px",
                fontWeight: "600",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Parcours certifié
            </span>
          </div>

          <h1
            style={{
              color: "#f1f0ee",
              fontSize: "42px",
              fontWeight: "700",
              margin: "0 0 16px 0",
              letterSpacing: "-0.5px",
              lineHeight: "1.2",
            }}
          >
            Mes Certificats
          </h1>

          <p
            style={{
              color: "#64748b",
              fontSize: "16px",
              margin: "0",
              maxWidth: "480px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: "1.6",
            }}
          >
            Formations validées et certifications professionnelles organisées par niveau de compétence
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "56px",
            flexWrap: "wrap",
          }}
        >
          {niveaux.map((n) => (
            <div
              key={n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: niveauConfig[n].bg,
                border: "1px solid " + niveauConfig[n].border,
                borderRadius: "100px",
                padding: "8px 18px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: niveauConfig[n].dot,
                }}
              />
              <span
                style={{
                  color: niveauConfig[n].color,
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Niveau {n} — {niveauConfig[n].label}
              </span>
            </div>
          ))}
        </div>

        {niveaux.map((n) => (
          <div
            key={n}
            style={{
              marginBottom: "48px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: niveauConfig[n].bg,
                  border: "1px solid " + niveauConfig[n].border,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: niveauConfig[n].color,
                    fontSize: "14px",
                    fontWeight: "700",
                  }}
                >
                  {n}
                </span>
              </div>

              <div>
                <h2
                  style={{
                    color: niveauConfig[n].color,
                    fontSize: "18px",
                    fontWeight: "700",
                    margin: "0",
                    letterSpacing: "0.3px",
                  }}
                >
                  {niveauConfig[n].label}
                </h2>
              </div>

              <div
                style={{
                  flex: "1",
                  height: "1px",
                  backgroundColor: niveauConfig[n].border,
                  marginLeft: "4px",
                }}
              />

              <span
                style={{
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                {certificats.filter((c) => c.niveau === n).length} certificat
                {certificats.filter((c) => c.niveau === n).length > 1 ? "s" : ""}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {certificats
                .filter((c) => c.niveau === n)
                .map((cert) => (
                  <div
                    key={cert.id}
                    onMouseEnter={() => setHoveredId(cert.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      backgroundColor:
                        hoveredId === cert.id
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(255,255,255,0.02)",
                      border:
                        hoveredId === cert.id
                          ? "1px solid " + niveauConfig[n].border
                          : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      transition: "all 0.2s ease",
                      cursor: "default",
                    }}
                  >
                    <div
                      style={{
                        width: "4px",
                        height: "48px",
                        borderRadius: "4px",
                        backgroundColor: niveauConfig[n].dot,
                        flexShrink: "0",
                        opacity: hoveredId === cert.id ? "1" : "0.4",
                        transition: "opacity 0.2s ease",
                      }}
                    />

                    <div
                      style={{
                        flex: "1",
                        minWidth: "0",
                      }}
                    >
                      <h3
                        style={{
                          color: "#e2e0dc",
                          fontSize: "15px",
                          fontWeight: "600",
                          margin: "0 0 8px 0",
                          lineHeight: "1.4",
                        }}
                      >
                        {cert.formation}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={mentionColor(cert.mention)}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span
                            style={{
                              color: mentionColor(cert.mention),
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {cert.mention}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#475569"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span
                            style={{
                              color: "#475569",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {cert.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexShrink: "0",
                      }}
                    >
                      <a
                        href={cert.pdf}
                        download
                        onMouseEnter={() => setHoveredBtn("pdf-" + cert.id)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          backgroundColor:
                            hoveredBtn === "pdf-" + cert.id
                              ? "rgba(200,169,110,0.18)"
                              : "rgba(200,169,110,0.08)",
                          border: "1px solid rgba(200,169,110,0.3)",
                          borderRadius: "8px",
                          padding: "8px 14px",
                          textDecoration: "