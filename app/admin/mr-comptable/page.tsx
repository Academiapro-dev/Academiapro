export default function DashboardComptable() {
  const gold = "#c8a96e";
  const darkBg = "#050508";
  const cardBg = "#0d0d14";
  const cardBorder = "#1a1a2e";
  const textMuted = "#8888aa";
  const textLight = "#e8e8f0";
  const successColor = "#4ade80";
  const dangerColor = "#f87171";
  const warningColor = "#fbbf24";

  const kpis = [
    {
      label: "CA ce mois",
      value: "24 850 €",
      sub: "+12% vs mois dernier",
      trend: "up",
      icon: "📈",
    },
    {
      label: "Charges",
      value: "8 320 €",
      sub: "-3% vs mois dernier",
      trend: "down",
      icon: "📉",
    },
    {
      label: "Bénéfice",
      value: "16 530 €",
      sub: "Marge 66.5%",
      trend: "up",
      icon: "💰",
    },
    {
      label: "TVA à payer",
      value: "3 210 €",
      sub: "Échéance 20 jan.",
      trend: "warn",
      icon: "🧾",
    },
    {
      label: "URSSAF à payer",
      value: "2 180 €",
      sub: "Échéance 15 jan.",
      trend: "warn",
      icon: "🏛️",
    },
  ];

  const factures = [
    {
      id: "FAC-2024-089",
      client: "TechVision SAS",
      montant: "4 200 €",
      statut: "Traitée",
      date: "02/01/2025",
    },
    {
      id: "FAC-2024-090",
      client: "MediaGroup SARL",
      montant: "1 850 €",
      statut: "En attente",
      date: "04/01/2025",
    },
    {
      id: "FAC-2024-091",
      client: "StartupXYZ",
      montant: "3 600 €",
      statut: "Traitée",
      date: "05/01/2025",
    },
    {
      id: "FAC-2024-092",
      client: "ConseilPro",
      montant: "980 €",
      statut: "En retard",
      date: "28/12/2024",
    },
  ];

  const notesfrais = [
    {
      description: "Déplacement Paris-Lyon",
      montant: "124 €",
      statut: "Validée",
      date: "03/01/2025",
    },
    {
      description: "Repas client TechVision",
      montant: "87 €",
      statut: "En attente",
      date: "04/01/2025",
    },
    {
      description: "Fournitures bureau",
      montant: "45 €",
      statut: "Validée",
      date: "05/01/2025",
    },
    {
      description: "Formation comptabilité",
      montant: "350 €",
      statut: "En attente",
      date: "06/01/2025",
    },
  ];

  const rapprochements = [
    {
      libelle: "Virement TechVision",
      montant: "+4 200 €",
      type: "credit",
      date: "02/01/2025",
      statut: "Rapproché",
    },
    {
      libelle: "Prélèvement loyer",
      montant: "-1 200 €",
      type: "debit",
      date: "03/01/2025",
      statut: "Rapproché",
    },
    {
      libelle: "CB Matériel info",
      montant: "-650 €",
      type: "debit",
      date: "04/01/2025",
      statut: "En attente",
    },
    {
      libelle: "Virement MediaGroup",
      montant: "+1 850 €",
      type: "credit",
      date: "05/01/2025",
      statut: "En attente",
    },
  ];

  const echeances = [
    {
      label: "TVA mensuelle",
      date: "20 janvier 2025",
      montant: "3 210 €",
      urgence: "high",
      jours: 14,
    },
    {
      label: "URSSAF trimestrielle",
      date: "15 janvier 2025",
      montant: "2 180 €",
      urgence: "critical",
      jours: 9,
    },
    {
      label: "IS acompte",
      date: "15 mars 2025",
      montant: "4 800 €",
      urgence: "low",
      jours: 68,
    },
  ];

  const getStatutColor = (statut: string) => {
    if (statut === "Traitée" || statut === "Validée" || statut === "Rapproché")
      return successColor;
    if (statut === "En retard") return dangerColor;
    return warningColor;
  };

  const getUrgenceColor = (urgence: string) => {
    if (urgence === "critical") return dangerColor;
    if (urgence === "high") return warningColor;
    return successColor;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "up") return successColor;
    if (trend === "down") return dangerColor;
    return warningColor;
  };

  return (
    <div
      style={{
        backgroundColor: darkBg,
        minHeight: "100vh",
        fontFamily:
          "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        color: textLight,
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, #0a0a12 0%, #050508 50%, #0a080e 100%)`,
          borderBottom: `1px solid ${cardBorder}`,
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: `linear-gradient(135deg, ${gold}, #a07840)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: `0 0 20px ${gold}44`,
              }}
            >
              🤖
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: gold,
                  letterSpacing: "0.5px",
                }}
              >
                Mr Comptable AcadémIA Pro
              </div>
              <div style={{ fontSize: "11px", color: textMuted }}>
                Intelligence Comptable Avancée
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: successColor,
                background: "#0d2010",
                padding: "5px 12px",
                borderRadius: "20px",
                border: "1px solid #1a4020",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: successColor,
                  display: "inline-block",
                }}
              ></span>
              IA Active
            </div>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${gold}33, ${gold}11)`,
                border: `1px solid ${gold}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              🔔
            </div>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${gold}, #a07840)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              👤
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "32px 32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                margin: "0 0 6px 0",
                color: textLight,
              }}
            >
              Tableau de bord comptable
            </h1>
            <p style={{ margin: 0, color: textMuted, fontSize: "14px" }}>
              Exercice Janvier 2025 · Dernière sync:{" "}
              <span style={{ color: gold }}>il y a 3 min</span>
            </p>
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${gold}22, ${gold}08)`,
              border: `1px solid ${gold}44`,
              borderRadius: "12px",
              padding: "10px 18px",
              fontSize: "13px",
              color: gold,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <span>✨</span>
            <span>Analyse IA en cours...</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {kpis.map((kpi, index) => (
            <div
              key={index}
              style={{
                background: `linear-gradient(145deg, ${cardBg}, #080810)`,
                border: `1px solid ${cardBorder}`,
                borderRadius: "16px",
                padding: "22px 20px",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: `linear-gradient(90deg, ${getTrendColor(kpi.trend)}66, transparent)`,
                }}
              ></div>
              <div
                style={{
                  fontSize: "24px",
                  marginBottom: "12px",
                }}
              >
                {kpi.icon}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: textLight,
                  marginBottom: "6px",
                  letterSpacing: "-0.5px",
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: getTrendColor(kpi.trend),
                  fontWeight: 500,
                }}
              >
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: `linear-gradient(145deg, ${cardBg}, #080810)`,
              border: `1px solid ${cardBorder}`,
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    margin: "0 0 4px 0",
                    color: textLight,
                  }}
                >
                  Factures reçues
                </h2>
                <p style={{ margin: 0, fontSize: "12px", color: textMuted }}>
                  4 factures ce mois
                </p>
              </div>
              <div
                style={{
                  background: `${gold}22`,
                  border: `1px solid ${gold}44`,
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  color: gold,
                  cursor: "pointer",
                }}
              >
                Voir tout
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {factures.map((facture, index) => (
                <div
                  key={index}
                  style={{
                    background: "#0a0a14",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    border: "1px solid #14142a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color