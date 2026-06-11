export default async function MarketingPage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const [
    postsResult,
    leadsResult,
    googleAdsResult,
    metaAdsResult,
    revenueResult,
    socialResult,
    campaignsResult,
    leadMagnetsResult,
  ] = await Promise.allSettled([
    supabase.from("posts").select("*"),
    supabase.from("leads").select("*"),
    supabase.from("google_ads").select("*"),
    supabase.from("meta_ads").select("*"),
    supabase.from("revenue").select("*"),
    supabase.from("social_accounts").select("*"),
    supabase.from("campaigns").select("*"),
    supabase.from("lead_magnets").select("*"),
  ]);

  const posts =
    postsResult.status === "fulfilled" ? postsResult.value.data || [] : [];
  const leads =
    leadsResult.status === "fulfilled" ? leadsResult.value.data || [] : [];
  const googleAds =
    googleAdsResult.status === "fulfilled"
      ? googleAdsResult.value.data || []
      : [];
  const metaAds =
    metaAdsResult.status === "fulfilled" ? metaAdsResult.value.data || [] : [];
  const revenue =
    revenueResult.status === "fulfilled" ? revenueResult.value.data || [] : [];
  const socialAccounts =
    socialResult.status === "fulfilled" ? socialResult.value.data || [] : [];
  const campaigns =
    campaignsResult.status === "fulfilled"
      ? campaignsResult.value.data || []
      : [];
  const leadMagnets =
    leadMagnetsResult.status === "fulfilled"
      ? leadMagnetsResult.value.data || []
      : [];

  const totalPosts = posts.length;
  const totalLeads = leads.length;

  const totalGoogleSpend = googleAds.reduce(
    (sum: number, ad: Record<string, unknown>) =>
      sum + (typeof ad.spend === "number" ? ad.spend : 0),
    0
  );
  const totalMetaSpend = metaAds.reduce(
    (sum: number, ad: Record<string, unknown>) =>
      sum + (typeof ad.spend === "number" ? ad.spend : 0),
    0
  );

  const totalRevenue = revenue.reduce(
    (sum: number, r: Record<string, unknown>) =>
      sum + (typeof r.amount === "number" ? r.amount : 0),
    0
  );

  const totalAdSpend = totalGoogleSpend + totalMetaSpend;
  const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

  const kpis = [
    {
      label: "Posts Publiés",
      value: totalPosts.toString(),
      icon: "✍️",
      sub: "contenus actifs",
      color: "#c8a96e",
    },
    {
      label: "Leads Générés",
      value: totalLeads.toString(),
      icon: "🎯",
      sub: "prospects qualifiés",
      color: "#c8a96e",
    },
    {
      label: "Google Ads",
      value: `${totalGoogleSpend.toFixed(0)}€`,
      icon: "🔍",
      sub: "dépenses totales",
      color: "#4285F4",
    },
    {
      label: "Meta Ads",
      value: `${totalMetaSpend.toFixed(0)}€`,
      icon: "📘",
      sub: "dépenses totales",
      color: "#1877F2",
    },
    {
      label: "Chiffre d'Affaires",
      value: `${totalRevenue.toFixed(0)}€`,
      icon: "💰",
      sub: "revenus générés",
      color: "#00C896",
    },
    {
      label: "ROAS Global",
      value: `${roas.toFixed(2)}x`,
      icon: "📈",
      sub: "retour sur invest.",
      color: roas >= 3 ? "#00C896" : roas >= 1 ? "#c8a96e" : "#FF6B6B",
    },
  ];

  const defaultSocials =
    socialAccounts.length > 0
      ? socialAccounts
      : [
          {
            platform: "Instagram",
            status: "actif",
            followers: 0,
            posts_count: 0,
          },
          {
            platform: "LinkedIn",
            status: "actif",
            followers: 0,
            posts_count: 0,
          },
          {
            platform: "TikTok",
            status: "inactif",
            followers: 0,
            posts_count: 0,
          },
          {
            platform: "YouTube",
            status: "actif",
            followers: 0,
            posts_count: 0,
          },
          {
            platform: "X / Twitter",
            status: "pause",
            followers: 0,
            posts_count: 0,
          },
          {
            platform: "Facebook",
            status: "actif",
            followers: 0,
            posts_count: 0,
          },
        ];

  const defaultCampaigns =
    campaigns.length > 0
      ? campaigns
      : [
          {
            name: "Campagne Notoriété",
            platform: "Google",
            status: "active",
            budget: 0,
            spend: 0,
            conversions: 0,
          },
          {
            name: "Retargeting Leads",
            platform: "Meta",
            status: "active",
            budget: 0,
            spend: 0,
            conversions: 0,
          },
          {
            name: "Search Intent",
            platform: "Google",
            status: "pause",
            budget: 0,
            spend: 0,
            conversions: 0,
          },
          {
            name: "Story Ads IA",
            platform: "Meta",
            status: "active",
            budget: 0,
            spend: 0,
            conversions: 0,
          },
        ];

  const defaultLeadMagnets =
    leadMagnets.length > 0
      ? leadMagnets
      : [
          {
            name: "Guide IA Marketing",
            downloads: 0,
            conversions: 0,
            status: "actif",
          },
          {
            name: "Checklist Automatisation",
            downloads: 0,
            conversions: 0,
            status: "actif",
          },
          {
            name: "Template Prompt GPT",
            downloads: 0,
            conversions: 0,
            status: "brouillon",
          },
          {
            name: "Webinaire AcadémIA",
            downloads: 0,
            conversions: 0,
            status: "actif",
          },
        ];

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "actif" || s === "active") return "#00C896";
    if (s === "pause" || s === "brouillon") return "#c8a96e";
    if (s === "inactif" || s === "inactive") return "#FF6B6B";
    return "#888";
  };

  const getStatusLabel = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "active") return "Actif";
    if (s === "pause") return "En pause";
    if (s === "inactive" || s === "inactif") return "Inactif";
    return status;
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform?.toLowerCase();
    if (p === "instagram") return "📸";
    if (p === "linkedin") return "💼";
    if (p === "tiktok") return "🎵";
    if (p === "youtube") return "▶️";
    if (p === "x / twitter" || p === "twitter" || p === "x") return "𝕏";
    if (p === "facebook") return "👥";
    if (p === "google") return "🔍";
    if (p === "meta") return "📘";
    return "🌐";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#e8e0d0",
        padding: "0",
      }}
    >
      <header
        style={{
          background:
            "linear-gradient(135deg, #0a0a0f 0%, #0f0e15 50%, #0a0a0f 100%)",
          borderBottom: "1px solid rgba(200,169,110,0.2)",
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "70px",
          position: "sticky",
          top: "0",
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 0 20px rgba(200,169,110,0.4)",
            }}
          >
            🧠
          </div>
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.5px",
              }}
            >
              AcadémIA Pro
            </div>
            <div
              style={{ fontSize: "11px", color: "#888", letterSpacing: "2px" }}
            >
              MARKETING DASHBOARD
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#00C896",
                borderRadius: "50%",
                boxShadow: "0 0 8px #00C896",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: "13px", color: "#888" }}>
              Données en direct
            </span>
          </div>
          <div
            style={{
              padding: "8px 18px",
              background: "linear-gradient(135deg, #c8a96e20, #c8a96e10)",
              border: "1px solid rgba(200,169,110,0.3)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#c8a96e",
              fontWeight: 600,
            }}
          >
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "40px 40px",
        }}
      >
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              margin: "0 0 8px 0",
              background: "linear-gradient(90deg, #ffffff, #c8a96e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Vue Marketing Globale
          </h1>
          <p style={{ color: "#666", margin: 0, fontSize: "15px" }}>
            Pilotez votre stratégie marketing IA en temps réel
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {kpis.map((kpi, i) => (
            <div
              key={i}
              style={{
                background:
                  "linear-gradient(135deg, #0d0d12 0%, #111118 100%)",
                border: `1px solid rgba(200,169,110,0.15)`,
                borderRadius: "16px",
                padding: "22px 20px",
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
                  background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "-30px",
                  right: "-30px",
                  width: "80px",
                  height: "80px",
                  background: `radial-gradient(circle, ${kpi.color}15, transparent)`,
                  borderRadius: "50%",
                }}
              />
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
                  fontSize: "26px",
                  fontWeight: 800,
                  color: kpi.color,
                  marginBottom: "4px",
                  lineHeight: 1,
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#e8e0d0",
                  marginBottom: "4px",
                }}
              >
                {kpi.label}
              </div>
              <div style={{ fontSize: "11px", color: "#555" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <div