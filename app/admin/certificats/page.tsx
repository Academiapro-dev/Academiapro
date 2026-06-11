export default function CertificatsDashboard() {
  const stats = {
    total: 1247,
    thiMonth: 89,
    byLevel: {
      Attestation: 312,
      Certificat: 445,
      Expert: 287,
      Master: 203,
    },
    qrVerifications: 156,
  };

  const certificates = [
    {
      id: "CERT-2024-001",
      learner: "Sophie Marchand",
      formation: "Intelligence Artificielle Fondamentaux",
      level: "Master",
      mention: "Très Bien",
      date: "2024-11-15",
      status: "active",
    },
    {
      id: "CERT-2024-002",
      learner: "Thomas Dubois",
      formation: "Machine Learning Avancé",
      level: "Expert",
      mention: "Bien",
      date: "2024-11-18",
      status: "active",
    },
    {
      id: "CERT-2024-003",
      learner: "Amira Benali",
      formation: "Python pour la Data Science",
      level: "Certificat",
      mention: "Excellent",
      date: "2024-11-20",
      status: "active",
    },
    {
      id: "CERT-2024-004",
      learner: "Lucas Petit",
      formation: "Introduction au Deep Learning",
      level: "Attestation",
      mention: "Passable",
      date: "2024-11-22",
      status: "active",
    },
    {
      id: "CERT-2024-005",
      learner: "Chloé Laurent",
      formation: "NLP et Traitement du Texte",
      level: "Expert",
      mention: "Très Bien",
      date: "2024-11-25",
      status: "revoked",
    },
    {
      id: "CERT-2024-006",
      learner: "Karim Mansouri",
      formation: "Vision par Ordinateur",
      level: "Master",
      mention: "Excellent",
      date: "2024-11-28",
      status: "active",
    },
    {
      id: "CERT-2024-007",
      learner: "Élise Fontaine",
      formation: "Éthique et IA Responsable",
      level: "Certificat",
      mention: "Bien",
      date: "2024-12-01",
      status: "active",
    },
  ];

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Attestation: "#6eb5c8",
      Certificat: "#6ec87a",
      Expert: "#c8a96e",
      Master: "#c86e6e",
    };
    return colors[level] || "#ffffff";
  };

  const getMentionColor = (mention: string) => {
    const colors: Record<string, string> = {
      Excellent: "#c8a96e",
      "Très Bien": "#6ec87a",
      Bien: "#6eb5c8",
      Passable: "#a0a0a0",
    };
    return colors[mention] || "#ffffff";
  };

  const levelData = Object.entries(stats.byLevel);
  const maxLevelValue = Math.max(...Object.values(stats.byLevel));

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e8e0d0",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, #0a0a12 0%, #050508 50%, #0a0806 100%)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              background:
                "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 0 20px rgba(200, 169, 110, 0.4)",
            }}
          >
            🎓
          </div>
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "700",
                background:
                  "linear-gradient(135deg, #c8a96e 0%, #e8d4a8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.5px",
              }}
            >
              AcadémIA Pro
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(200, 169, 110, 0.6)",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Gestion des Certificats
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(200, 169, 110, 0.08)",
              border: "1px solid rgba(200, 169, 110, 0.2)",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "13px",
              color: "rgba(200, 169, 110, 0.8)",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                backgroundColor: "#6ec87a",
                borderRadius: "50%",
                display: "inline-block",
                boxShadow: "0 0 6px #6ec87a",
              }}
            />
            Admin Dashboard
          </div>
          <div
            style={{
              width: "36px",
              height: "36px",
              background:
                "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "700",
              color: "#050508",
              cursor: "pointer",
            }}
          >
            A
          </div>
        </div>
      </div>

      <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "700",
                margin: "0 0 6px 0",
                color: "#e8e0d0",
                letterSpacing: "-0.5px",
              }}
            >
              Tableau de Bord Certificats
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "rgba(232, 224, 208, 0.4)",
              }}
            >
              Décembre 2024 — Vue d'ensemble & Administration
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                backgroundColor: "rgba(200, 169, 110, 0.1)",
                border: "1px solid rgba(200, 169, 110, 0.3)",
                borderRadius: "8px",
                color: "#c8a96e",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span>📄</span>
              Rapport Mensuel
            </button>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background:
                  "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#050508",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(200, 169, 110, 0.3)",
              }}
            >
              <span>✨</span>
              Générer Certificat
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {[
            {
              label: "Total Certificats",
              value: stats.total.toLocaleString(),
              icon: "🏆",
              sub: "+12% vs année précédente",
              accent: "#c8a96e",
              glow: "rgba(200, 169, 110, 0.15)",
            },
            {
              label: "Ce Mois",
              value: stats.thiMonth,
              icon: "📅",
              sub: "Novembre 2024",
              accent: "#6ec87a",
              glow: "rgba(110, 200, 122, 0.15)",
            },
            {
              label: "Vérifications QR",
              value: stats.qrVerifications,
              icon: "🔍",
              sub: "Ce mois",
              accent: "#6eb5c8",
              glow: "rgba(110, 181, 200, 0.15)",
            },
            {
              label: "Taux de Réussite",
              value: "94.2%",
              icon: "📈",
              sub: "Moyenne générale",
              accent: "#c86e6e",
              glow: "rgba(200, 110, 110, 0.15)",
            },
          ].map((card, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#0d0d15",
                border: `1px solid ${card.accent}30`,
                borderRadius: "14px",
                padding: "22px",
                position: "relative",
                overflow: "hidden",
                boxShadow: `0 4px 24px ${card.glow}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(232, 224, 208, 0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    fontWeight: "600",
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: `${card.accent}15`,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  {card.icon}
                </div>
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: card.accent,
                  marginBottom: "6px",
                  lineHeight: 1,
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(232, 224, 208, 0.35)",
                }}
              >
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              backgroundColor: "#0d0d15",
              border: "1px solid rgba(200, 169, 110, 0.15)",
              borderRadius: "14px",
              padding: "24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, #c8a96e, transparent)",
              }}
            />
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "15px",
                fontWeight: "600",
                color: "#e8e0d0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "rgba(200, 169, 110, 0.2)",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                }}
              >
                📊
              </span>
              Répartition par Niveau
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {levelData.map(([level, count]) => (
                <div key={level}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}