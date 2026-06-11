export default async function AgentsPage() {
  const agents = [
    {
      id: 1,
      name: "Mr Comptable",
      role: "Comptabilité & Finance",
      status: "active",
      emoji: "📊",
      kpis: {
        tasksCompleted: 142,
        successRate: 98.5,
        avgResponseTime: "1.2s",
        activeUsers: 34,
      },
      lastAction: "Génération bilan Q4 2024 pour client Dupont SARL",
      lastActionTime: "Il y a 3 minutes",
      color: "#4ade80",
    },
    {
      id: 2,
      name: "Mr Juridique",
      role: "Droit & Conformité",
      status: "active",
      emoji: "⚖️",
      kpis: {
        tasksCompleted: 89,
        successRate: 99.1,
        avgResponseTime: "2.1s",
        activeUsers: 21,
      },
      lastAction: "Rédaction contrat de prestation de services SAS TechVision",
      lastActionTime: "Il y a 7 minutes",
      color: "#60a5fa",
    },
    {
      id: 3,
      name: "Agent Marketing",
      role: "Stratégie & Communication",
      status: "active",
      emoji: "📣",
      kpis: {
        tasksCompleted: 203,
        successRate: 96.8,
        avgResponseTime: "0.9s",
        activeUsers: 58,
      },
      lastAction: "Création campagne LinkedIn pour lancement produit NovaTech",
      lastActionTime: "Il y a 1 minute",
      color: "#f472b6",
    },
    {
      id: 4,
      name: "Certificateur",
      role: "Validation & Certification",
      status: "idle",
      emoji: "🏅",
      kpis: {
        tasksCompleted: 67,
        successRate: 100,
        avgResponseTime: "3.4s",
        activeUsers: 12,
      },
      lastAction: "Validation certification ISO 9001 dossier entreprise Meridian",
      lastActionTime: "Il y a 22 minutes",
      color: "#c8a96e",
    },
    {
      id: 5,
      name: "INPI",
      role: "Propriété Intellectuelle",
      status: "processing",
      emoji: "🔏",
      kpis: {
        tasksCompleted: 45,
        successRate: 97.7,
        avgResponseTime: "4.8s",
        activeUsers: 9,
      },
      lastAction: "Dépôt marque en cours - Société Lumière Créative Paris",
      lastActionTime: "En cours maintenant",
      color: "#a78bfa",
    },
    {
      id: 6,
      name: "Tuteur",
      role: "Formation & Pédagogie",
      status: "active",
      emoji: "🎓",
      kpis: {
        tasksCompleted: 318,
        successRate: 95.2,
        avgResponseTime: "1.5s",
        activeUsers: 87,
      },
      lastAction: "Session formation comptabilité avancée - 12 apprenants actifs",
      lastActionTime: "Il y a 2 minutes",
      color: "#34d399",
    },
    {
      id: 7,
      name: "Commercial",
      role: "Vente & Développement",
      status: "active",
      emoji: "💼",
      kpis: {
        tasksCompleted: 176,
        successRate: 93.4,
        avgResponseTime: "1.1s",
        activeUsers: 43,
      },
      lastAction: "Proposition commerciale générée - Prospect GlobalEdge Consulting",
      lastActionTime: "Il y a 5 minutes",
      color: "#fb923c",
    },
  ];

  const totalTasks = agents.reduce((sum, a) => sum + a.kpis.tasksCompleted, 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const avgSuccess =
    agents.reduce((sum, a) => sum + a.kpis.successRate, 0) / agents.length;
  const totalUsers = agents.reduce((sum, a) => sum + a.kpis.activeUsers, 0);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { label: "Actif", bg: "rgba(74,222,128,0.15)", color: "#4ade80", dot: "#4ade80" };
      case "idle":
        return { label: "En veille", bg: "rgba(200,169,110,0.15)", color: "#c8a96e", dot: "#c8a96e" };
      case "processing":
        return { label: "En traitement", bg: "rgba(96,165,250,0.15)", color: "#60a5fa", dot: "#60a5fa" };
      default:
        return { label: "Inconnu", bg: "rgba(156,163,175,0.15)", color: "#9ca3af", dot: "#9ca3af" };
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e8e0d0",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(200,169,110,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(200,169,110,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <header
          style={{
            borderBottom: "1px solid rgba(200,169,110,0.15)",
            padding: "20px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(5,5,8,0.8)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 0 20px rgba(200,169,110,0.3)",
              }}
            >
              🤖
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #c8a96e, #e8d5a3)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.3px",
                }}
              >
                AcadémIA Pro
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "rgba(200,169,110,0.6)",
                  letterSpacing: "0.5px",
                }}
              >
                PANNEAU ADMINISTRATION AGENTS IA
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#4ade80",
                  boxShadow: "0 0 8px #4ade80",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ fontSize: "13px", color: "rgba(232,224,208,0.6)" }}>
                Supabase connecté
              </span>
            </div>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(200,169,110,0.3)",
                backgroundColor: "rgba(200,169,110,0.08)",
                fontSize: "13px",
                color: "#c8a96e",
                cursor: "pointer",
              }}
            >
              Admin ▾
            </div>
          </div>
        </header>

        <main style={{ padding: "40px" }}>
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <h2
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: "28px",
                    fontWeight: "800",
                    color: "#e8e0d0",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Vue d'ensemble des Agents
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "rgba(232,224,208,0.45)" }}>
                  Surveillance en temps réel · 7 agents intelligents déployés
                </p>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(200,169,110,0.5)",
                  letterSpacing: "0.5px",
                }}
              >
                DERNIÈRE MAJ : {new Date().toLocaleTimeString("fr-FR")}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            {[
              { label: "Tâches Complétées", value: totalTasks.toLocaleString(), icon: "✅", sub: "Total cumulé", change: "+12%" },
              { label: "Agents Actifs", value: `${activeAgents}/7`, icon: "🟢", sub: "En ce moment", change: "Optimal" },
              { label: "Taux de Succès", value: `${avgSuccess.toFixed(1)}%`, icon: "🎯", sub: "Moyenne globale", change: "+0.3%" },
              { label: "Utilisateurs Actifs", value: totalUsers.toString(), icon: "👥", sub: "Sessions en cours", change: "+8%" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(200,169,110,0.12)",
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
                    background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
                    opacity: 0.5,
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <span style={{ fontSize: "24px" }}>{stat.icon}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "20px",
                      backgroundColor: "rgba(74,222,128,0.1)",
                      color: "#4ade80",
                      fontWeight: "600",
                    }}
                  >
                    {stat.change}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "800",
                    color: "#c8a96e",
                    letterSpacing: "-1px",
                    marginBottom: "4px",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: "13px", color: "rgba(232,224,208,0.7)", fontWeight: "600", marginBottom: "2px" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(232,224,208,0.35)" }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: "20px",
            }}
          >
            {agents.map((agent) => {
              const statusConfig = getStatusConfig(agent.status);
              return (
                <div
                  key={agent.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(200,169,110,0.1)",
                    borderRadius: "20px",
                    padding: "0",
                    overflow: "hidden",
                    position: "relative",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "3px",
                      background: `linear-gradient(90deg, ${agent.color}60, ${agent.color}, ${agent.color}60)`,
                    }}
                  />

                  <div
                    style={{
                      padding: "24px 24px 20px 24px",
                      borderBottom: "1px solid rgba(200,169,110,0.06)",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "