export default function AdminDashboard() {
  const stats = [
    { label: "Chiffre d'Affaires Total", value: "€ 284,750", change: "+12.4%", positive: true },
    { label: "Apprenants Actifs", value: "3,847", change: "+8.2%", positive: true },
    { label: "Formations Vendues", value: "1,293", change: "+15.7%", positive: true },
    { label: "Séances Réservées", value: "642", change: "-2.1%", positive: false },
  ];

  const modules = [
    { label: "Agents IA", href: "/agents", icon: "🤖", desc: "Gestion des agents intelligents" },
    { label: "Mr. Comptable", href: "/mr-comptable", icon: "📊", desc: "Comptabilité & finances" },
    { label: "Mr. Juridique", href: "/mr-juridique", icon: "⚖️", desc: "Droit & conformité" },
    { label: "Holding", href: "/holding", icon: "🏛️", desc: "Structure corporate" },
    { label: "Marketing", href: "/marketing", icon: "📣", desc: "Campagnes & acquisition" },
    { label: "Certificats", href: "/certificats", icon: "🎓", desc: "Délivrance & validation" },
    { label: "Réseaux Sociaux", href: "/reseaux-sociaux", icon: "🌐", desc: "Présence & engagement" },
  ];

  const alerts = [
    { type: "warning", message: "Paiement en attente - Formation Leadership Pro", time: "il y a 5 min", dot: "#f59e0b" },
    { type: "info", message: "Nouveau apprenant inscrit : Sophie M.", time: "il y a 12 min", dot: "#c8a96e" },
    { type: "success", message: "Certificat délivré automatiquement #CRT-2847", time: "il y a 28 min", dot: "#10b981" },
    { type: "warning", message: "Agent IA - Quota API à 87% de capacité", time: "il y a 45 min", dot: "#f59e0b" },
    { type: "error", message: "Échec de connexion répété - IP 185.234.xx.xx", time: "il y a 1h", dot: "#ef4444" },
    { type: "info", message: "Rapport mensuel généré par Mr. Comptable", time: "il y a 2h", dot: "#c8a96e" },
    { type: "success", message: "Campagne marketing activée - ROI +23%", time: "il y a 3h", dot: "#10b981" },
  ];

  const recentActivity = [
    { user: "Jean-Pierre D.", action: "Acheté", item: "Formation MBA Digital", amount: "€ 1,490", time: "09:14" },
    { user: "Amara K.", action: "Réservé", item: "Séance coaching 1-to-1", amount: "€ 350", time: "09:02" },
    { user: "Claire B.", action: "Certifié", item: "Management Agile Niveau 3", amount: "—", time: "08:47" },
    { user: "Théo M.", action: "Inscrit", item: "Parcours Entrepreneuriat", amount: "€ 890", time: "08:31" },
    { user: "Fatou S.", action: "Acheté", item: "Pack Juridique Starter", amount: "€ 299", time: "08:15" },
  ];

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
      {/* HEADER */}
      <div
        style={{
          borderBottom: "1px solid rgba(200,169,110,0.2)",
          background: "linear-gradient(180deg, rgba(200,169,110,0.05) 0%, transparent 100%)",
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #c8a96e, #8b6914)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "900",
              color: "#050508",
              boxShadow: "0 0 20px rgba(200,169,110,0.4)",
            }}
          >
            A
          </div>
          <div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "800",
                background: "linear-gradient(90deg, #c8a96e, #e8d5a0, #c8a96e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.5px",
              }}
            >
              AcadémIA Pro
            </div>
            <div style={{ fontSize: "12px", color: "rgba(200,169,110,0.6)", marginTop: "1px" }}>
              Tableau de bord administrateur
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "50px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)",
              fontSize: "13px",
              color: "#10b981",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                boxShadow: "0 0 8px #10b981",
                animation: "pulse 2s infinite",
              }}
            />
            Système opérationnel
          </div>

          <div
            style={{
              position: "relative",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(200,169,110,0.1)",
              border: "1px solid rgba(200,169,110,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            🔔
            <div
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                border: "2px solid #050508",
                fontSize: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 14px",
              borderRadius: "50px",
              background: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.2)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #8b6914)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
                color: "#050508",
              }}
            >
              AD
            </div>
            <span style={{ fontSize: "14px", color: "#c8a96e", fontWeight: "600" }}>Admin</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: "40px", maxWidth: "1600px", margin: "0 auto" }}>

        {/* PAGE TITLE */}
        <div style={{ marginBottom: "36px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#e8e0d0",
              margin: "0 0 8px 0",
              letterSpacing: "-0.8px",
            }}
          >
            Vue d&apos;ensemble
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(232,224,208,0.5)", margin: 0 }}>
            Lundi 13 janvier 2025 · Mise à jour en temps réel
          </p>
        </div>

        {/* STATS CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                padding: "28px",
                borderRadius: "20px",
                background: "linear-gradient(145deg, rgba(200,169,110,0.07) 0%, rgba(5,5,8,0.8) 100%)",
                border: "1px solid rgba(200,169,110,0.15)",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease",
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
                  background: "radial-gradient(circle, rgba(200,169,110,0.1) 0%, transparent 70%)",
                }}
              />
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(200,169,110,0.7)",
                  marginBottom: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: "34px",
                  fontWeight: "800",
                  color: "#e8e0d0",
                  marginBottom: "10px",
                  letterSpacing: "-1px",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "50px",
                  backgroundColor: stat.positive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${stat.positive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  fontSize: "12px",
                  fontWeight: "700",
                  color: stat.positive ? "#10b981" : "#ef4444",
                }}
              >
                {stat.positive ? "▲" : "▼"} {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* MODULES GRID */}
        <div style={{ marginBottom: "36px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#c8a96e",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "20px",
                borderRadius: "2px",
                background: "linear-gradient(180deg, #c8a96e, #8b6914)",
                display: "inline-block",
              }}
            />
            Modules de gestion
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "16px",
            }}
          >
            {modules.map((mod, i) => (
              <a
                key={i}
                href={mod.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "24px 16px",
                  borderRadius: "18px",
                  background: "linear-gradient(145deg, rgba(200,169,110,0.06) 0%, rgba(10,10,18,0.9) 100%)",
                  border: "1px solid rgba(200,169,110,0.12)",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    right: "0",
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
                    opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background: "rgba(200,169,110,0.1)",
                    border: "1px solid rgba(200,169,110,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    marginBottom: "12px",
                    boxShadow: "0 4px 16px rgba(200,169,110,0.1)",
                  }}
                >
                  {mod.icon}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#c8a96e",
                    marginBottom: "4px",