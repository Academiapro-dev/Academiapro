export default async function ReseauxSociauxPage() {

  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: platformsData } = await supabase
    .from("social_platforms")
    .select("*")
    .order("ca_genere", { ascending: false });

  const { data: tunnelsData } = await supabase
    .from("conversion_tunnels")
    .select("*")
    .order("taux_conversion", { ascending: false });

  const { data: globalKpis } = await supabase
    .from("global_social_kpis")
    .select("*")
    .single();

  const platforms = platformsData || [
    {
      id: 1,
      nom: "LinkedIn",
      couleur: "#0077B5",
      icone: "in",
      followers: 12400,
      followers_growth: 8.4,
      engagement_rate: 4.2,
      leads: 342,
      ca_genere: 48600,
      impressions: 284000,
      clics: 8900,
      partages: 1240,
      commentaires: 890,
    },
    {
      id: 2,
      nom: "Instagram",
      couleur: "#E1306C",
      icone: "ig",
      followers: 28700,
      followers_growth: 12.1,
      engagement_rate: 6.8,
      leads: 218,
      ca_genere: 31200,
      impressions: 520000,
      clics: 14200,
      partages: 3800,
      commentaires: 2100,
    },
    {
      id: 3,
      nom: "Facebook",
      couleur: "#1877F2",
      icone: "fb",
      followers: 19300,
      followers_growth: 2.3,
      engagement_rate: 2.9,
      leads: 156,
      ca_genere: 22800,
      impressions: 390000,
      clics: 7600,
      partages: 2100,
      commentaires: 980,
    },
    {
      id: 4,
      nom: "TikTok",
      couleur: "#010101",
      icone: "tt",
      followers: 54200,
      followers_growth: 31.7,
      engagement_rate: 9.4,
      leads: 189,
      ca_genere: 27400,
      impressions: 1200000,
      clics: 32000,
      partages: 18400,
      commentaires: 8900,
    },
    {
      id: 5,
      nom: "YouTube",
      couleur: "#FF0000",
      icone: "yt",
      followers: 8900,
      followers_growth: 5.6,
      engagement_rate: 5.1,
      leads: 124,
      ca_genere: 19800,
      impressions: 180000,
      clics: 6200,
      partages: 890,
      commentaires: 1240,
    },
  ];

  const tunnels = tunnelsData || [
    {
      id: 1,
      nom: "Découverte → Lead Magnet",
      plateforme: "LinkedIn",
      etape_1: 12400,
      etape_2: 3720,
      etape_3: 1116,
      etape_4: 334,
      taux_conversion: 2.69,
      ca_genere: 16700,
    },
    {
      id: 2,
      nom: "Reel → Page de vente",
      plateforme: "Instagram",
      etape_1: 28700,
      etape_2: 8610,
      etape_3: 2583,
      etape_4: 516,
      taux_conversion: 1.8,
      ca_genere: 12900,
    },
    {
      id: 3,
      nom: "Short → Webinaire",
      plateforme: "YouTube",
      etape_1: 8900,
      etape_2: 3560,
      etape_3: 1424,
      etape_4: 284,
      taux_conversion: 3.19,
      ca_genere: 14200,
    },
    {
      id: 4,
      nom: "Viral → Offre Flash",
      plateforme: "TikTok",
      etape_1: 54200,
      etape_2: 10840,
      etape_3: 2168,
      etape_4: 433,
      taux_conversion: 0.8,
      ca_genere: 10825,
    },
  ];

  const kpis = globalKpis || {
    total_followers: 123500,
    total_leads_mois: 1029,
    ca_total_mois: 149800,
    engagement_moyen: 5.68,
    portee_totale: 2574000,
    taux_conversion_global: 1.82,
  };

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const formatCurrency = (n: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  };

  const getPlatformIcon = (icone: string): string => {
    const icons: Record<string, string> = {
      in: "💼",
      ig: "📸",
      fb: "👥",
      tt: "🎵",
      yt: "▶️",
    };
    return icons[icone] || "🌐";
  };

  const getTunnelColor = (index: number): string => {
    const colors = ["#c8a96e", "#b8941e", "#d4b97e", "#e8c98e"];
    return colors[index % colors.length];
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        color: "#ffffff",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, #0a0a12 0%, #050508 50%, #0d0a05 100%)",
          borderBottom: "1px solid rgba(200,169,110,0.2)",
          padding: "24px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
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
              fontSize: "20px",
              boxShadow: "0 4px 20px rgba(200,169,110,0.3)",
            }}
          >
            📊
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #c8a96e, #f0d898)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}
            >
              AcadémIA Pro
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "rgba(200,169,110,0.6)",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Réseaux Sociaux Dashboard
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(200,169,110,0.1)",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: "20px",
              padding: "6px 14px",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "#4ade80",
                boxShadow: "0 0 8px #4ade80",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: "12px", color: "#c8a96e" }}>
              Live • Mis à jour il y a 2 min
            </span>
          </div>
          <div
            style={{
              background: "rgba(200,169,110,0.1)",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "13px",
              color: "#c8a96e",
              cursor: "pointer",
            }}
          >
            Exporter rapport
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              label: "Followers Totaux",
              value: formatNumber(kpis.total_followers),
              icon: "👥",
              sub: "+12.4% ce mois",
              positive: true,
            },
            {
              label: "Leads Générés",
              value: formatNumber(kpis.total_leads_mois),
              icon: "🎯",
              sub: "+24.8% vs M-1",
              positive: true,
            },
            {
              label: "CA Généré",
              value: formatCurrency(kpis.ca_total_mois),
              icon: "💰",
              sub: "+18.2% vs M-1",
              positive: true,
            },
            {
              label: "Engagement Moyen",
              value: kpis.engagement_moyen.toFixed(2) + "%",
              icon: "❤️",
              sub: "+1.2pt vs M-1",
              positive: true,
            },
            {
              label: "Portée Totale",
              value: formatNumber(kpis.portee_totale),
              icon: "📡",
              sub: "Impressions / mois",
              positive: true,
            },
            {
              label: "Taux Conversion",
              value: kpis.taux_conversion_global.toFixed(2) + "%",
              icon: "⚡",
              sub: "+0.4pt vs M-1",
              positive: true,
            },
          ].map((kpi, idx) => (
            <div
              key={idx}
              style={{
                background:
                  "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(5,5,8,0.95) 100%)",
                border: "1px solid rgba(200,169,110,0.2)",
                borderRadius: "16px",
                padding: "20px",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s, border-color 0.2s",
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
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "8px",
                  filter: "drop-shadow(0 2px 8px rgba(200,169,110,0.4))",
                }}
              >
                {kpi.icon}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(200,169,110,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "6px",
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#ffffff",
                  marginBottom: "6px",
                  letterSpacing: "-0.5px",
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: kpi.positive ? "#4ade80" : "#f87171",
                  fontWeight: 500,
                }}
              >
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#c8a96e",
            marginBottom: "20px",
            letterSpacing: "-0.3px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              width: "4px",
              height: "20px",
              background: "linear-gradient(180deg, #c8a96e, #8b6914)",
              borderRadius: "2px",
              display: "inline-block",
            }}
          />
          Performance par Plateforme
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {platforms.map((platform: any) => (
            <div
              key={platform.id}
              style={{
                background: "rgba(5,5,8,0.98)",
                border: "1px solid rgba(200,169,110,0.15)",
                borderRadius: "20px",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
              }}
            >
              <div