export default function SocialDashboard() {
  const platforms = [
    {
      name: "LinkedIn",
      color: "#0077B5",
      icon: "in",
      followers: 12450,
      followerGrowth: 8.2,
      engagement: 4.7,
      leads: 234,
      reach: 89000,
      posts: 24,
      conversionRate: 3.2,
      revenue: 45600,
    },
    {
      name: "Instagram",
      color: "#E1306C",
      icon: "IG",
      followers: 28900,
      followerGrowth: 12.5,
      engagement: 6.3,
      leads: 187,
      reach: 145000,
      posts: 38,
      conversionRate: 2.1,
      revenue: 28900,
    },
    {
      name: "Facebook",
      color: "#1877F2",
      icon: "FB",
      followers: 19200,
      followerGrowth: 3.1,
      engagement: 2.9,
      leads: 156,
      reach: 78000,
      posts: 31,
      conversionRate: 1.8,
      revenue: 19800,
    },
    {
      name: "TikTok",
      color: "#FF0050",
      icon: "TT",
      followers: 45600,
      followerGrowth: 24.8,
      engagement: 9.2,
      leads: 312,
      reach: 320000,
      posts: 52,
      conversionRate: 1.4,
      revenue: 22400,
    },
    {
      name: "YouTube",
      color: "#FF0000",
      icon: "YT",
      followers: 8750,
      followerGrowth: 6.4,
      engagement: 5.1,
      leads: 98,
      reach: 67000,
      posts: 12,
      conversionRate: 4.6,
      revenue: 38200,
    },
  ];

  const totalFollowers = platforms.reduce((acc, p) => acc + p.followers, 0);
  const totalPosts = platforms.reduce((acc, p) => acc + p.posts, 0);
  const totalReach = platforms.reduce((acc, p) => acc + p.reach, 0);
  const avgEngagement = (platforms.reduce((acc, p) => acc + p.engagement, 0) / platforms.length).toFixed(1);
  const totalLeads = platforms.reduce((acc, p) => acc + p.leads, 0);
  const totalRevenue = platforms.reduce((acc, p) => acc + p.revenue, 0);

  const formatNumber = (n: number) =>
    n >= 1000000
      ? (n / 1000000).toFixed(1) + "M"
      : n >= 1000
      ? (n / 1000).toFixed(1) + "k"
      : n.toString();

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const weeklyPosts = [
    { day: "Lun", platform: "LinkedIn", time: "08h30", content: "Étude de cas client", status: "planifié" },
    { day: "Mar", platform: "Instagram", time: "12h00", content: "Carousel conseils IA", status: "planifié" },
    { day: "Mar", platform: "TikTok", time: "18h30", content: "Tendances 2025", status: "planifié" },
    { day: "Mer", platform: "Facebook", time: "10h00", content: "Webinaire annonce", status: "planifié" },
    { day: "Jeu", platform: "LinkedIn", time: "09h00", content: "Article thought leadership", status: "planifié" },
    { day: "Jeu", platform: "YouTube", time: "16h00", content: "Tuto AcadémIA Pro", status: "planifié" },
    { day: "Ven", platform: "Instagram", time: "11h30", content: "Témoignage étudiant", status: "planifié" },
    { day: "Sam", platform: "TikTok", time: "14h00", content: "Behind the scenes", status: "planifié" },
  ];

  const platformColor = (name: string) => {
    const p = platforms.find((pl) => pl.name === name);
    return p ? p.color : "#c8a96e";
  };

  const kpiCards = [
    { label: "Followers Total", value: formatNumber(totalFollowers), icon: "👥", sub: "+8.4% ce mois", positive: true },
    { label: "Posts Publiés", value: totalPosts.toString(), icon: "📝", sub: "Ce mois", positive: true },
    { label: "Reach Total", value: formatNumber(totalReach), icon: "📡", sub: "+15.2% vs mois dernier", positive: true },
    { label: "Engagement Moyen", value: avgEngagement + "%", icon: "💬", sub: "+0.8pt vs mois dernier", positive: true },
    { label: "Leads Générés", value: totalLeads.toString(), icon: "🎯", sub: "987 leads ce mois", positive: true },
    { label: "CA Généré", value: formatCurrency(totalRevenue), icon: "💰", sub: "+22% vs mois dernier", positive: true },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e8e8f0",
        padding: "0",
        margin: "0",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a12 0%, #0d0d1a 50%, #050508 100%)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "900",
                color: "#050508",
                boxShadow: "0 4px 20px rgba(200, 169, 110, 0.4)",
              }}
            >
              A
            </div>
            <div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #c8a96e, #e8c88e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.3px",
                }}
              >
                AcadémIA Pro
              </div>
              <div style={{ fontSize: "11px", color: "rgba(200, 169, 110, 0.6)", marginTop: "1px" }}>
                Social Media Dashboard
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                background: "rgba(200, 169, 110, 0.1)",
                border: "1px solid rgba(200, 169, 110, 0.2)",
                fontSize: "12px",
                color: "#c8a96e",
              }}
            >
              Janvier 2025
            </div>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: "12px", color: "rgba(200, 169, 110, 0.7)" }}>Live</span>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "1px solid rgba(200, 169, 110, 0.3)",
                background: "transparent",
                color: "#c8a96e",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = "rgba(200, 169, 110, 0.1)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = "transparent";
              }}
            >
              📅 Calendrier
            </button>
            <button
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "1px solid rgba(200, 169, 110, 0.3)",
                background: "transparent",
                color: "#c8a96e",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = "rgba(200, 169, 110, 0.1)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = "transparent";
              }}
            >
              📊 Rapport
            </button>
            <button
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                color: "#050508",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(200, 169, 110, 0.3)",
              }}
            >
              ✨ Générer Posts
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "32px" }}>

        {/* SECTION TITRE */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#f0e8d8",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Vue d&apos;ensemble Réseaux Sociaux
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(200, 169, 110, 0.6)", margin: 0 }}>
            Performance consolidée de toutes vos plateformes · Mise à jour il y a 5 min
          </p>
        </div>

        {/* KPI CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {kpiCards.map((kpi, i) => (
            <div
              key={i}
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(200, 169, 110, 0.15)",
                borderRadius: "16px",
                padding: "20px",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(200, 169, 110, 0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "linear-gradient(90deg, #c8a96e, transparent)",
                }}
              />
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>{kpi.icon}</div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#f0e8d8",
                  marginBottom: "4px",
                  letterSpacing: "-0.5px",
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(200, 169, 110, 0.7)", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {kpi.label}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: kpi.positive ? "#22c55e" : "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{kpi.positive ? "↑" : "↓"}</span>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        {/* PAR PLATEFORME */}
        <div style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#f0e8d8",
              margin: "0 0 20px 0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "20px",