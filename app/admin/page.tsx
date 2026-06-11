export default async function AdminPage() {

  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const [
    revenueResult,
    learnersResult,
    formationsResult,
    sessionsResult,
  ] = await Promise.all([
    supabase.from("transactions").select("amount"),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("formations").select("sales_count"),
    supabase.from("sessions").select("id", { count: "exact", head: true }),
  ]);

  const totalRevenue: number = (revenueResult.data ?? []).reduce(
    (acc: number, row: { amount: number }) => acc + (row.amount ?? 0),
    0
  );

  const totalLearners: number = learnersResult.count ?? 0;

  const totalFormationsSold: number = (formationsResult.data ?? []).reduce(
    (acc: number, row: { sales_count: number }) => acc + (row.sales_count ?? 0),
    0
  );

  const totalSessions: number = sessionsResult.count ?? 0;

  const stats: { label: string; value: string; icon: string }[] = [
    {
      label: "Chiffre d'Affaires",
      value: new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(totalRevenue),
      icon: "€",
    },
    {
      label: "Apprenants",
      value: new Intl.NumberFormat("fr-FR").format(totalLearners),
      icon: "🎓",
    },
    {
      label: "Formations Vendues",
      value: new Intl.NumberFormat("fr-FR").format(totalFormationsSold),
      icon: "📚",
    },
    {
      label: "Séances",
      value: new Intl.NumberFormat("fr-FR").format(totalSessions),
      icon: "🎯",
    },
  ];

  const agents: {
    label: string;
    href: string;
    icon: string;
    description: string;
  }[] = [
    {
      label: "Agent Comptable",
      href: "/admin/agents/comptable",
      icon: "🧾",
      description: "Gestion financière et fiscale",
    },
    {
      label: "Agent Juridique",
      href: "/admin/agents/juridique",
      icon: "⚖️",
      description: "Contrats et conformité légale",
    },
    {
      label: "Agent Holding",
      href: "/admin/agents/holding",
      icon: "🏛️",
      description: "Structure holding et participations",
    },
    {
      label: "Agent Marketing",
      href: "/admin/agents/marketing",
      icon: "📣",
      description: "Campagnes et acquisition clients",
    },
    {
      label: "Agent Certificats",
      href: "/admin/agents/certificats",
      icon: "🏆",
      description: "Émission et validation des certificats",
    },
    {
      label: "Agent Agents",
      href: "/admin/agents",
      icon: "🤖",
      description: "Vue d'ensemble de tous les agents",
    },
  ];

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    color: "#e8e0d0",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "0",
    margin: "0",
  };

  const headerStyle: React.CSSProperties = {
    background:
      "linear-gradient(135deg, #0a0a0f 0%, #0f0e18 50%, #0a0a0f 100%)",
    borderBottom: "1px solid rgba(200, 169, 110, 0.3)",
    padding: "28px 48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(20px)",
  };

  const logoContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  };

  const logoIconStyle: React.CSSProperties = {
    width: "44px",
    height: "44px",
    background: "linear-gradient(135deg, #c8a96e 0%, #e8c87a 50%, #c8a96e 100%)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    boxShadow: "0 4px 20px rgba(200, 169, 110, 0.4)",
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #c8a96e, #e8c87a, #c8a96e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  };

  const logoSubStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(200, 169, 110, 0.6)",
    letterSpacing: "3px",
    textTransform: "uppercase" as const,
    fontWeight: "500",
    marginTop: "2px",
  };

  const headerRightStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  };

  const statusBadgeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(200, 169, 110, 0.08)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "50px",
    padding: "8px 16px",
    fontSize: "12px",
    color: "#c8a96e",
    fontWeight: "600",
    letterSpacing: "0.5px",
  };

  const statusDotStyle: React.CSSProperties = {
    width: "7px",
    height: "7px",
    backgroundColor: "#4ade80",
    borderRadius: "50%",
    boxShadow: "0 0 8px #4ade80",
  };

  const adminBadgeStyle: React.CSSProperties = {
    backgroundColor: "rgba(200, 169, 110, 0.12)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    borderRadius: "50px",
    padding: "8px 20px",
    fontSize: "12px",
    color: "#c8a96e",
    fontWeight: "700",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
  };

  const mainStyle: React.CSSProperties = {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "48px 48px 80px",
  };

  const welcomeSectionStyle: React.CSSProperties = {
    marginBottom: "48px",
  };

  const welcomeTitleStyle: React.CSSProperties = {
    fontSize: "38px",
    fontWeight: "800",
    color: "#f0e8d8",
    lineHeight: "1.1",
    marginBottom: "12px",
    letterSpacing: "-1px",
  };

  const welcomeGoldStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #c8a96e, #e8c87a)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const welcomeSubStyle: React.CSSProperties = {
    fontSize: "16px",
    color: "rgba(232, 224, 208, 0.5)",
    fontWeight: "400",
    letterSpacing: "0.2px",
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "3px",
    textTransform: "uppercase" as const,
    color: "rgba(200, 169, 110, 0.5)",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const sectionLabelLineStyle: React.CSSProperties = {
    flex: 1,
    height: "1px",
    background:
      "linear-gradient(to right, rgba(200, 169, 110, 0.2), transparent)",
  };

  const statsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "56px",
  };

  const statCardStyle: React.CSSProperties = {
    background:
      "linear-gradient(145deg, rgba(200, 169, 110, 0.06) 0%, rgba(200, 169, 110, 0.02) 100%)",
    border: "1px solid rgba(200, 169, 110, 0.15)",
    borderRadius: "20px",
    padding: "28px 24px",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease",
  };

  const statCardGlowStyle: React.CSSProperties = {
    position: "absolute",
    top: "-40px",
    right: "-40px",
    width: "120px",
    height: "120px",
    background: "radial-gradient(circle, rgba(200, 169, 110, 0.08) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  };

  const statTopStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    color: "rgba(200, 169, 110, 0.6)",
  };

  const statIconStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    background: "rgba(200, 169, 110, 0.1)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    border: "1px solid rgba(200, 169, 110, 0.15)",
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: "800",
    color: "#f0e8d8",
    letterSpacing: "-1px",
    lineHeight: "1",
    marginBottom: "8px",
  };

  const statTrendStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#4ade80",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  };

  const statDividerStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "0",
    left: "0",
    right: "0",
    height: "2px",
    background:
      "linear-gradient(to right, transparent, rgba(200, 169, 110, 0.4), transparent)",
  };

  const agentsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "56px",
  };

  const agentCardStyle: React.CSSProperties = {
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
    border: "1px solid rgba(200, 169, 110, 0.12)",
    borderRadius: "20px",
    padding: "28px",
    display: "block",
    textDecoration: "none",
    color: "inherit",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease",
    cursor: "pointer",
  };

  const agentCardTopStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "16px",
  };

  const agentIconContainerStyle: React.CSSProperties = {
    width: "52px",
    height: "52px",
    background:
      "linear-gradient(135deg, rgba(200, 169, 110, 0.15), rgba(200, 169, 110, 0.05))",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    border: "1px solid rgba(200, 169, 110, 0.2)",
  };

  const agentArrowStyle: React.CSSProperties = {
    width: "28px",
    height: "28px",
    background: "rgba(200, 169, 110, 0.08)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    color: "#c8a96e",
    border: "1px solid rgba(200, 169, 110, 0.15)",
  };

  const agentLabelStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#f0e8d8",
    marginBottom: "6px",
    letterSpacing: "-0.3px",
  };

  const agentDescriptionStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(232, 224, 208, 0.4)",
    fontWeight: "400",
    lineHeight: "1.5",
  };

  const agentCardAccentStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "0",
    left: "0",
    right: "0",
    height: "1px",
    background:
      "linear-gradient(to right, transparent, rgba(200, 169, 110, 0.3), transparent)",
  };

  const quickActionsStyle: React.CSSProperties = {
    background:
      "linear