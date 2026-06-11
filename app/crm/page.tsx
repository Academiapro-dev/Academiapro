export default function CRMDashboard() {
  const kpis = [
    { label: "Leads Totaux", value: "1,284", change: "+12%", icon: "👥" },
    { label: "Taux Conversion", value: "23.4%", change: "+3.2%", icon: "📈" },
    { label: "CA Pipeline", value: "€842,500", change: "+18%", icon: "💰" },
    { label: "Nouvelles Opportunités", value: "47", change: "+8", icon: "🎯" },
  ];

  const pipeline = [
    {
      stage: "Lead",
      count: 342,
      value: "€124,000",
      color: "#4a9eff",
      deals: [
        { name: "Institut Formation Pro", value: "€12,000", contact: "Marie Dupont" },
        { name: "École Supérieure Tech", value: "€18,500", contact: "Jean Martin" },
        { name: "Centre Formation Lyon", value: "€9,200", contact: "Sophie Bernard" },
      ],
    },
    {
      stage: "Qualifié",
      count: 198,
      value: "€215,000",
      color: "#a78bfa",
      deals: [
        { name: "Université Paris Est", value: "€32,000", contact: "Pierre Leroy" },
        { name: "Formation Continue SA", value: "€27,500", contact: "Claire Moreau" },
        { name: "EduTech Solutions", value: "€41,000", contact: "Marc Petit" },
      ],
    },
    {
      stage: "Proposition",
      count: 87,
      value: "€198,500",
      color: "#c8a96e",
      deals: [
        { name: "Campus Numérique", value: "€55,000", contact: "Laura Simon" },
        { name: "Pro Formation 360", value: "€38,200", contact: "Thomas Blanc" },
        { name: "Académie Digitale", value: "€29,800", contact: "Emma Richard" },
      ],
    },
    {
      stage: "Négociation",
      count: 43,
      value: "€189,000",
      color: "#f97316",
      deals: [
        { name: "Global Learn Corp", value: "€72,000", contact: "Nicolas Faure" },
        { name: "Skills Academy FR", value: "€48,500", contact: "Isabelle Roy" },
        { name: "NextGen Formation", value: "€35,000", contact: "Antoine Morel" },
      ],
    },
    {
      stage: "Fermé",
      count: 156,
      value: "€116,000",
      color: "#22c55e",
      deals: [
        { name: "Excellence Training", value: "€44,000", contact: "Céline Durand" },
        { name: "Alpha Formation", value: "€38,000", contact: "Julien Mercier" },
        { name: "ProSkills Institute", value: "€34,000", contact: "Virginie Garnier" },
      ],
    },
  ];

  const recentActivity = [
    { action: "Nouveau lead créé", entity: "TechLearn Paris", time: "Il y a 5 min", type: "lead", avatar: "TL" },
    { action: "Proposition envoyée", entity: "Campus Numérique", time: "Il y a 23 min", type: "proposal", avatar: "CN" },
    { action: "Appel programmé", entity: "Global Learn Corp", time: "Il y a 1h", type: "call", avatar: "GL" },
    { action: "Deal fermé ✓", entity: "Excellence Training", time: "Il y a 2h", type: "closed", avatar: "ET" },
    { action: "Email ouvert", entity: "EduTech Solutions", time: "Il y a 3h", type: "email", avatar: "ES" },
    { action: "Qualification mise à jour", entity: "Skills Academy FR", time: "Il y a 4h", type: "update", avatar: "SA" },
  ];

  const upcomingFollowUps = [
    { contact: "Nicolas Faure", company: "Global Learn Corp", date: "Aujourd'hui 14h00", priority: "haute", type: "Appel" },
    { contact: "Isabelle Roy", company: "Skills Academy FR", date: "Aujourd'hui 16h30", priority: "haute", type: "Démo" },
    { contact: "Laura Simon", company: "Campus Numérique", date: "Demain 10h00", priority: "moyenne", type: "Email" },
    { contact: "Thomas Blanc", company: "Pro Formation 360", date: "Demain 14h30", priority: "moyenne", type: "Appel" },
    { contact: "Marc Petit", company: "EduTech Solutions", date: "22 Jan 11h00", priority: "basse", type: "RDV" },
  ];

  const topFormations = [
    { name: "IA & Machine Learning", sales: 284, revenue: "€142,000", trend: "+24%", badge: "🔥" },
    { name: "Data Science Avancé", sales: 196, revenue: "€98,000", trend: "+18%", badge: "⭐" },
    { name: "Leadership Digital", sales: 167, revenue: "€83,500", trend: "+12%", badge: "📊" },
    { name: "Cybersécurité Pro", sales: 143, revenue: "€71,500", trend: "+31%", badge: "🔒" },
    { name: "Cloud Architecture", sales: 128, revenue: "€64,000", trend: "+9%", badge: "☁️" },
    { name: "Agilité & Scrum", sales: 112, revenue: "€56,000", trend: "+6%", badge: "🚀" },
  ];

  const activityTypeColors: Record<string, string> = {
    lead: "#4a9eff",
    proposal: "#c8a96e",
    call: "#a78bfa",
    closed: "#22c55e",
    email: "#f97316",
    update: "#6b7280",
  };

  const priorityColors: Record<string, string> = {
    haute: "#ef4444",
    moyenne: "#c8a96e",
    basse: "#22c55e",
  };

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e2e8f0",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a12 0%, #0f0f1a 50%, #050508 100%)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: "0",
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              boxShadow: "0 4px 20px rgba(200, 169, 110, 0.4)",
            }}
          >
            🎓
          </div>
          <div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "800",
                background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}
            >
              AcadémIA Pro
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase" }}>
              CRM Dashboard
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              background: "rgba(200, 169, 110, 0.08)",
              border: "1px solid rgba(200, 169, 110, 0.2)",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "13px",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "#c8a96e" }}>📅</span>
            Janvier 2025
          </div>
          <div
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "12px",
              color: "#22c55e",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                display: "inline-block",
                boxShadow: "0 0 6px #22c55e",
              }}
            />
            En direct
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #1e293b, #334155)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              border: "2px solid rgba(200, 169, 110, 0.3)",
              cursor: "pointer",
            }}
          >
            👤
          </div>
        </div>
      </div>

      <div style={{ padding: "32px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          {kpis.map((kpi, i) => (
            <div
              key={i}
              style={{
                background: "linear-gradient(135deg, rgba(15,15,28,0.9) 0%, rgba(20,20,35,0.9) 100%)",
                border: "1px solid rgba(200, 169, 110, 0.15)",
                borderRadius: "16px",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s ease",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-30px",
                  right: "-30px",
                  width: "100px",
                  height: "100px",
                  background: "radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "28px",
                    width: "52px",
                    height: "52px",
                    background: "rgba(200, 169, 110, 0.1)",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(200, 169, 110, 0.2)",
                  }}
                >
                  {kpi.icon}
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#22c55e",
                    background: "rgba(34, 197, 94, 0.1)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                  }}
                >
                  {kpi.change}
                </span>
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  color: "#f1f5f9",
                  letterSpacing: "-1px",
                  marginBottom: "6px",
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>{kpi.label}</div>
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  right: "0",
                  height: "3px",
                  background: "linear-gradient(90deg, #c8a96e, transparent)",
                  borderRadius: "0 0 16px 16px",
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div
              style={{
                width: "4px",
                height: "24px",
                background: "linear-gradient(180deg, #c8a96e, #a07840)",
                borderRadius: "2px",
              }}
            />
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#f1f5f9", margin: "0" }}>
              Pipeline Commercial
            </h2>
            <div
              style={{
                marginLeft: "auto",
                fontSize: "12px",
                color: "#64748b",
                background: "rgba(255,255,255,0.04)",
                padding: "4px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              826 opportunités actives
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "16px",
            }}
          >
            {pipeline.map((stage, i) => (
              <div
                key={i}
                style={{
                  background: "linear-gradient(180deg, rgba(12,12,22,0.95