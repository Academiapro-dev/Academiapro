export default function AdminDashboard() {
  const kpis = [
    { label: "Chiffre d'Affaires Total", value: "€247,890", change: "+18.3%", icon: "💰" },
    { label: "Apprenants Actifs", value: "3,847", change: "+12.7%", icon: "🎓" },
    { label: "Formations Vendues", value: "1,293", change: "+9.4%", icon: "📚" },
    { label: "Agents IA Actifs", value: "7", change: "+2", icon: "🤖" },
  ];

  const agents = [
    {
      id: 1,
      name: "Mr Comptable",
      description: "Gestion comptable & fiscale automatisée",
      status: "Actif",
      users: 847,
      revenue: "€62,300",
      icon: "📊",
      color: "#c8a96e",
      href: "/admin/agents/mr-comptable",
    },
    {
      id: 2,
      name: "Mr Juridique",
      description: "Conseil juridique & conformité légale",
      status: "Actif",
      users: 634,
      revenue: "€48,900",
      icon: "⚖️",
      color: "#c8a96e",
      href: "/admin/agents/mr-juridique",
    },
    {
      id: 3,
      name: "Holding",
      description: "Structuration & gestion de holdings",
      status: "Actif",
      users: 312,
      revenue: "€71,200",
      icon: "🏛️",
      color: "#c8a96e",
      href: "/admin/holding",
    },
    {
      id: 4,
      name: "Marketing",
      description: "Stratégies marketing & acquisition",
      status: "Actif",
      users: 921,
      revenue: "€38,400",
      icon: "📣",
      color: "#c8a96e",
      href: "/admin/marketing",
    },
    {
      id: 5,
      name: "Certificats",
      description: "Génération & validation de certificats",
      status: "Actif",
      users: 1293,
      revenue: "€15,600",
      icon: "🎖️",
      color: "#c8a96e",
      href: "/admin/certificats",
    },
    {
      id: 6,
      name: "Réseaux Sociaux",
      description: "Automatisation & gestion des réseaux",
      status: "Actif",
      users: 756,
      revenue: "€11,490",
      icon: "🌐",
      color: "#c8a96e",
      href: "/admin/reseaux-sociaux",
    },
    {
      id: 7,
      name: "Agents IA",
      description: "Supervision globale des agents IA",
      status: "Actif",
      users: 84,
      revenue: "€0",
      icon: "🤖",
      color: "#c8a96e",
      href: "/admin/agents",
    },
  ];

  const recentActivities = [
    { time: "Il y a 2 min", event: "Nouveau certificat généré", user: "Marie Dupont", type: "success" },
    { time: "Il y a 8 min", event: "Formation vendue — Pack Holding Premium", user: "Thomas Bernard", type: "revenue" },
    { time: "Il y a 15 min", event: "Mr Juridique — Consultation terminée", user: "Sophie Laurent", type: "agent" },
    { time: "Il y a 23 min", event: "Nouveau apprenant inscrit", user: "Lucas Martin", type: "user" },
    { time: "Il y a 41 min", event: "Rapport mensuel généré", user: "Système", type: "system" },
    { time: "Il y a 1h", event: "Mr Comptable — Bilan fiscal créé", user: "Emma Rousseau", type: "agent" },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case "success": return "#22c55e";
      case "revenue": return "#c8a96e";
      case "agent": return "#818cf8";
      case "user": return "#38bdf8";
      default: return "#6b7280";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        color: "#ffffff",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "260px",
          height: "100vh",
          backgroundColor: "#08080d",
          borderRight: "1px solid rgba(200, 169, 110, 0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "28px 24px",
            borderBottom: "1px solid rgba(200, 169, 110, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🎓
            </div>
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #c8a96e, #e8d5a3)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.3px",
                }}
              >
                AcadémIA Pro
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(200, 169, 110, 0.6)",
                  fontWeight: 500,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Administration
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          <div
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              padding: "0 12px",
              marginBottom: "8px",
            }}
          >
            Navigation
          </div>

          {[
            { icon: "🏠", label: "Dashboard", href: "/admin", active: true },
            { icon: "🤖", label: "Agents IA", href: "/admin/agents", active: false },
            { icon: "📊", label: "Mr Comptable", href: "/admin/agents/mr-comptable", active: false },
            { icon: "⚖️", label: "Mr Juridique", href: "/admin/agents/mr-juridique", active: false },
            { icon: "🏛️", label: "Holding", href: "/admin/holding", active: false },
            { icon: "📣", label: "Marketing", href: "/admin/marketing", active: false },
            { icon: "🎖️", label: "Certificats", href: "/admin/certificats", active: false },
            { icon: "🌐", label: "Réseaux Sociaux", href: "/admin/reseaux-sociaux", active: false },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "2px",
                textDecoration: "none",
                backgroundColor: item.active ? "rgba(200, 169, 110, 0.12)" : "transparent",
                border: item.active ? "1px solid rgba(200, 169, 110, 0.2)" : "1px solid transparent",
                color: item.active ? "#c8a96e" : "rgba(255,255,255,0.55)",
                fontSize: "14px",
                fontWeight: item.active ? 600 : 400,
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label}
              {item.active && (
                <div
                  style={{
                    marginLeft: "auto",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#c8a96e",
                  }}
                />
              )}
            </a>
          ))}

          <div
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              padding: "0 12px",
              marginTop: "20px",
              marginBottom: "8px",
            }}
          >
            Paramètres
          </div>

          {[
            { icon: "👥", label: "Utilisateurs", href: "/admin/users" },
            { icon: "⚙️", label: "Configuration", href: "/admin/config" },
            { icon: "📈", label: "Analytiques", href: "/admin/analytics" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "2px",
                textDecoration: "none",
                backgroundColor: "transparent",
                border: "1px solid transparent",
                color: "rgba(255,255,255,0.55)",
                fontSize: "14px",
                fontWeight: 400,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* User profile bottom */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid rgba(200, 169, 110, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e, #6b4c20)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 700,
              color: "#050508",
              flexShrink: 0,
            }}
          >
            A
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>Admin Principal</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              admin@academia.pro
            </div>
          </div>
          <div style={{ fontSize: "16px", cursor: "pointer" }}>⚙️</div>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          marginLeft: "260px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            backgroundColor: "rgba(5, 5, 8, 0.92)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(200, 169, 110, 0.1)",
            padding: "0 32px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              Tableau de Bord
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              Vue d'ensemble — AcadémIA Pro
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(200, 169, 110, 0.15)",
                borderRadius: "8px",
                padding: "8px 14px",
                width: "220px",
              }}
            >
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)" }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontSize: "13px",
                  width: "100%",
                }}
              />
            </div>

            {/* Notification */}
            <div
              style={{
                position: "relative",
                width: "38px",
                height: "38px",
                borderRadius: "8px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(200, 169, 110, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              🔔
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "7