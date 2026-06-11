export default function AgentsDashboard() {
  const agents = [
    {
      id: 1,
      name: "Mr Comptable",
      icon: "🧾",
      status: "actif",
      lastAction: "Génération bilan mensuel Q4",
      lastActionTime: "Il y a 3 min",
      kpis: [
        { label: "Factures traitées", value: "247", unit: "aujourd'hui" },
        { label: "CA analysé", value: "€124K", unit: "ce mois" },
        { label: "Écritures auto", value: "1.2K", unit: "total" },
      ],
      color: "#c8a96e",
      bgAccent: "rgba(200, 169, 110, 0.08)",
    },
    {
      id: 2,
      name: "Mr Juridique",
      icon: "⚖️",
      status: "actif",
      lastAction: "Rédaction contrat SaaS client Nexus",
      lastActionTime: "Il y a 11 min",
      kpis: [
        { label: "Contrats rédigés", value: "34", unit: "ce mois" },
        { label: "Conformités vérifiées", value: "89", unit: "total" },
        { label: "Alertes légales", value: "2", unit: "en cours" },
      ],
      color: "#a78bfa",
      bgAccent: "rgba(167, 139, 250, 0.08)",
    },
    {
      id: 3,
      name: "Agent Marketing",
      icon: "📣",
      status: "actif",
      lastAction: "Campagne email automatisée — segment B2B",
      lastActionTime: "Il y a 7 min",
      kpis: [
        { label: "Campagnes actives", value: "8", unit: "en cours" },
        { label: "Leads générés", value: "312", unit: "ce mois" },
        { label: "Taux conversion", value: "4.7%", unit: "moy." },
      ],
      color: "#34d399",
      bgAccent: "rgba(52, 211, 153, 0.08)",
    },
    {
      id: 4,
      name: "Agent Certificateur",
      icon: "🏅",
      status: "actif",
      lastAction: "Validation certification Qualiopi dossier #442",
      lastActionTime: "Il y a 22 min",
      kpis: [
        { label: "Dossiers validés", value: "56", unit: "ce mois" },
        { label: "En attente", value: "12", unit: "dossiers" },
        { label: "Taux réussite", value: "97.2%", unit: "" },
      ],
      color: "#f59e0b",
      bgAccent: "rgba(245, 158, 11, 0.08)",
    },
    {
      id: 5,
      name: "Agent INPI",
      icon: "🔏",
      status: "actif",
      lastAction: "Dépôt marque AcadémIA — classe 41 confirmée",
      lastActionTime: "Il y a 45 min",
      kpis: [
        { label: "Dépôts traités", value: "19", unit: "ce mois" },
        { label: "Marques protégées", value: "143", unit: "total" },
        { label: "Délai moyen", value: "2.3j", unit: "traitement" },
      ],
      color: "#60a5fa",
      bgAccent: "rgba(96, 165, 250, 0.08)",
    },
    {
      id: 6,
      name: "Agent Tuteur",
      icon: "🎓",
      status: "actif",
      lastAction: "Session live 38 apprenants — module IA avancée",
      lastActionTime: "Il y a 2 min",
      kpis: [
        { label: "Apprenants actifs", value: "1.4K", unit: "aujourd'hui" },
        { label: "Modules complétés", value: "287", unit: "ce mois" },
        { label: "Satisfaction", value: "4.9/5", unit: "" },
      ],
      color: "#f472b6",
      bgAccent: "rgba(244, 114, 182, 0.08)",
    },
    {
      id: 7,
      name: "Agent Commercial",
      icon: "💼",
      status: "actif",
      lastAction: "Proposition commerciale envoyée — prospect TechFlow",
      lastActionTime: "Il y a 18 min",
      kpis: [
        { label: "Devis générés", value: "73", unit: "ce mois" },
        { label: "Pipeline", value: "€890K", unit: "en cours" },
        { label: "Closing rate", value: "68%", unit: "" },
      ],
      color: "#fb923c",
      bgAccent: "rgba(251, 146, 60, 0.08)",
    },
  ];

  const globalStats = [
    {
      label: "Actions aujourd'hui",
      value: "2,847",
      icon: "⚡",
      sub: "+18% vs hier",
      color: "#c8a96e",
    },
    {
      label: "CA généré",
      value: "€47,320",
      icon: "💰",
      sub: "Ce mois: €312K",
      color: "#34d399",
    },
    {
      label: "Documents traités",
      value: "1,094",
      icon: "📄",
      sub: "Aujourd'hui",
      color: "#a78bfa",
    },
    {
      label: "Agents actifs",
      value: "7/7",
      icon: "🤖",
      sub: "100% opérationnels",
      color: "#60a5fa",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#ffffff",
        padding: "0",
        margin: "0",
      }}
    >
      {}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "rgba(5, 5, 8, 0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background:
                "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 0 20px rgba(200, 169, 110, 0.3)",
            }}
          >
            🎓
          </div>
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                background:
                  "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.3px",
              }}
            >
              AcadémIA Pro
            </div>
            <div
              style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "1px" }}
            >
              Centre de Contrôle IA
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              backgroundColor: "rgba(52, 211, 153, 0.1)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              borderRadius: "20px",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                backgroundColor: "#34d399",
                borderRadius: "50%",
                boxShadow: "0 0 8px #34d399",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: "12px", color: "#34d399", fontWeight: "600" }}>
              Tous systèmes opérationnels
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 16px 6px 10px",
              backgroundColor: "rgba(200, 169, 110, 0.08)",
              border: "1px solid rgba(200, 169, 110, 0.2)",
              borderRadius: "24px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              👤
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#c8a96e" }}>
                Admin
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
                Super Administrateur
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div style={{ paddingTop: "72px" }}>
        {}
        <div
          style={{
            padding: "48px 40px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-100px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "600px",
              height: "300px",
              background:
                "radial-gradient(ellipse, rgba(200, 169, 110, 0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "3px",
                  color: "#c8a96e",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  opacity: 0.8,
                }}
              >
                Tableau de bord
              </div>
              <h1
                style={{
                  fontSize: "36px",
                  fontWeight: "800",
                  margin: "0 0 8px 0",
                  letterSpacing: "-1px",
                  lineHeight: 1.1,
                }}
              >
                Dashboard Agents IA
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", margin: 0, fontSize: "15px" }}>
                Supervision et contrôle de vos 7 agents intelligents en temps réel
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div
                style={{
                  padding: "8px 16px",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                }}
              >
                📊 Exporter rapport
              </div>
              <div
                style={{
                  padding: "8px 20px",
                  background: "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#050508",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(200, 169, 110, 0.25)",
                }}
              >
                ⚙️ Configuration
              </div>
            </div>
          </div>
        </div>

        {}
        <div
          style={{
            padding: "0 40px 40px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          {globalStats.map((stat, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "rgba(255,255,255,0.025)",
                border: `1px solid rgba(255,255,255,0.07)`,
                borderRadius: "16px",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "-30px",
                  right: "-20px",
                  fontSize: "70px",
                  opacity: 0.04,
                  transform: "rotate(-15deg)",
                }}
              >
                {stat.icon}
              </div>

              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "8px",
                  filter: "drop-shadow(0 0 8px rgba(255,255,255,0.2))",
                }}
              >
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",