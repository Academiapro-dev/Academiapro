"use client";
import React from "react";

const Dashboard: React.FC = () => {
  const kpis = [
    { label: "Posts Publiés", value: "142", change: "+12%", icon: "📝", color: "#c8a96e" },
    { label: "Leads Générés", value: "1,847", change: "+23%", icon: "🎯", color: "#c8a96e" },
    { label: "Google Ads", value: "€4,200", change: "+8%", icon: "🔍", color: "#4285f4" },
    { label: "Meta Ads", value: "€3,650", change: "+15%", icon: "📘", color: "#0668e1" },
    { label: "Chiffre d'Affaires", value: "€48,900", change: "+31%", icon: "💰", color: "#c8a96e" },
    { label: "ROAS", value: "4.2x", change: "+0.8x", icon: "📈", color: "#22c55e" },
  ];

  const socialNetworks = [
    { name: "Instagram", followers: "12.4K", status: "Actif", posts: 48, engagement: "6.2%", color: "#e1306c", icon: "📸" },
    { name: "LinkedIn", followers: "8.9K", status: "Actif", posts: 32, engagement: "4.8%", color: "#0077b5", icon: "💼" },
    { name: "Facebook", followers: "21.3K", status: "Actif", posts: 28, engagement: "3.1%", color: "#1877f2", icon: "👥" },
    { name: "TikTok", followers: "5.6K", status: "En pause", posts: 14, engagement: "8.9%", color: "#69c9d0", icon: "🎵" },
    { name: "YouTube", followers: "3.2K", status: "Actif", posts: 12, engagement: "5.4%", color: "#ff0000", icon: "▶️" },
    { name: "Twitter/X", followers: "4.1K", status: "Limité", posts: 64, engagement: "2.3%", color: "#ffffff", icon: "✖" },
  ];

  const campaigns = [
    { name: "Formation IA Débutants", platform: "Google", budget: "€800", spent: "€612", leads: 142, cpl: "€4.31", status: "Active", progress: 76 },
    { name: "MBA Digital Pro", platform: "Meta", budget: "€1,200", spent: "€989", leads: 87, cpl: "€11.37", status: "Active", progress: 82 },
    { name: "Bootcamp Data Science", platform: "Google", budget: "€600", spent: "€421", leads: 63, cpl: "€6.68", status: "Active", progress: 70 },
    { name: "Leadership & IA", platform: "Meta", budget: "€900", spent: "€900", leads: 201, cpl: "€4.48", status: "Terminée", progress: 100 },
    { name: "UX/UI Avancé", platform: "Google", budget: "€500", spent: "€187", leads: 34, cpl: "€5.50", status: "En pause", progress: 37 },
  ];

  const leadMagnets = [
    { title: "Guide IA 2024 Gratuit", downloads: 847, conversions: 23.4, type: "PDF", status: "Actif" },
    { title: "Webinaire Marketing IA", registrations: 312, conversions: 41.2, type: "Webinaire", status: "Actif" },
    { title: "Checklist SEO Expert", downloads: 1243, conversions: 18.7, type: "PDF", status: "Actif" },
    { title: "Template LinkedIn Pro", downloads: 689, conversions: 29.1, type: "Template", status: "En test" },
    { title: "Mini-formation Gratuite", registrations: 456, conversions: 52.3, type: "Cours", status: "Actif" },
  ];

  const revenueData = [
    { month: "Juil", value: 32000 },
    { month: "Août", value: 28000 },
    { month: "Sep", value: 38000 },
    { month: "Oct", value: 41000 },
    { month: "Nov", value: 44000 },
    { month: "Déc", value: 48900 },
  ];

  const maxRevenue = Math.max(...revenueData.map((d) => d.value));

  const getStatusStyle = (status: string) => {
    if (status === "Actif" || status === "Active") {
      return { background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.3)" };
    }
    if (status === "En pause" || status === "Terminée") {
      return { background: "rgba(234, 179, 8, 0.15)", color: "#eab308", border: "1px solid rgba(234, 179, 8, 0.3)" };
    }
    if (status === "Limité" || status === "En test") {
      return { background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" };
    }
    return { background: "rgba(200, 169, 110, 0.15)", color: "#c8a96e", border: "1px solid rgba(200, 169, 110, 0.3)" };
  };

  const containerStyle: React.CSSProperties = {
    background: "#050508",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#ffffff",
    padding: "0",
  };

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0a0a12 0%, #0d0d18 50%, #050508 100%)",
    borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
    padding: "24px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(20px)",
  };

  const logoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const logoIconStyle: React.CSSProperties = {
    width: "42px",
    height: "42px",
    background: "linear-gradient(135deg, #c8a96e 0%, #a8843e 100%)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    boxShadow: "0 4px 20px rgba(200, 169, 110, 0.3)",
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  };

  const headerRightStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  };

  const dateStyle: React.CSSProperties = {
    color: "rgba(200, 169, 110, 0.7)",
    fontSize: "14px",
    background: "rgba(200, 169, 110, 0.08)",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(200, 169, 110, 0.15)",
  };

  const avatarStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #c8a96e 0%, #a8843e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 0 0 2px rgba(200, 169, 110, 0.3)",
  };

  const mainStyle: React.CSSProperties = {
    padding: "32px 40px",
    maxWidth: "1600px",
    margin: "0 auto",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "2px",
    color: "rgba(200, 169, 110, 0.6)",
    marginBottom: "16px",
  };

  const kpiGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "16px",
    marginBottom: "32px",
  };

  const kpiCardStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0d0d18 0%, #0a0a12 100%)",
    border: "1px solid rgba(200, 169, 110, 0.12)",
    borderRadius: "16px",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  const kpiGlowStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
    opacity: 0.6,
  };

  const kpiIconStyle: React.CSSProperties = {
    fontSize: "24px",
    marginBottom: "12px",
    display: "block",
  };

  const kpiValueStyle: React.CSSProperties = {
    fontSize: "26px",
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: "1",
    marginBottom: "6px",
    letterSpacing: "-1px",
  };

  const kpiLabelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: "10px",
  };

  const kpiChangeStyle = (positive: boolean): React.CSSProperties => ({
    fontSize: "11px",
    color: positive ? "#22c55e" : "#ef4444",
    background: positive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
    padding: "3px 8px",
    borderRadius: "20px",
    display: "inline-block",
    fontWeight: "600",
  });

  const gridTwoColStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "32px",
  };

  const gridThreeColStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px",
    marginBottom: "32px",
  };

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0d0d18 0%, #0a0a12 100%)",
    border: "1px solid rgba(200, 169, 110, 0.12)",
    borderRadius: "20px",
    padding: "28px",
    position: "relative",
    overflow: "hidden",
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const badgeStyle: React.CSSProperties = {
    background: "rgba(200, 169, 110, 0.1)",
    color: "#c8a96e",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
  };

  const socialGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  };

  const socialCardStyle = (color: string): React.CSSProperties => ({
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "12px",
    padding: "16px",
    borderLeft: "3px solid " + color,
    transition: "all 0.3s ease",
  });

  const socialNameStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const socialStatsStyle: React.CSSProperties = {
    display: "flex",
    gap: "16px",
    marginTop: "8px",
  };

  const socialStatItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const socialStatValueStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
  };

  const socialStatLabelStyle: React.CSSProperties = {
    fontSize: "10px",
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse" as const,
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left" as const,
    padding: "12px 16px",
    fontSize: "11px",
    fontWeight: "600",
    color: "rgba(200, 169, 110, 0.6)",
    textTransform: "uppercase" as