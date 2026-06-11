"use client";
import React from "react";
import { useState } from "react";

const platforms = ["LinkedIn", "Instagram", "Facebook", "TikTok", "YouTube"];

const platformColors: Record<string, string> = {
  LinkedIn: "#0077B5",
  Instagram: "#E1306C",
  Facebook: "#1877F2",
  TikTok: "#FF0050",
  YouTube: "#FF0000",
};

const platformIcons: Record<string, string> = {
  LinkedIn: "in",
  Instagram: "ig",
  Facebook: "fb",
  TikTok: "tt",
  YouTube: "yt",
};

interface PlatformData {
  followers: number;
  followerGrowth: number;
  engagement: number;
  engagementRate: number;
  leads: number;
  leadGrowth: number;
  revenue: number;
  revenueGrowth: number;
  conversionRate: number;
  impressions: number;
  clicks: number;
  posts: number;
  tunnel: {
    awareness: number;
    interest: number;
    consideration: number;
    intent: number;
    conversion: number;
  };
}

const mockData: Record<string, PlatformData> = {
  LinkedIn: {
    followers: 48200,
    followerGrowth: 12.4,
    engagement: 3840,
    engagementRate: 7.96,
    leads: 284,
    leadGrowth: 18.2,
    revenue: 142000,
    revenueGrowth: 24.6,
    conversionRate: 3.8,
    impressions: 892000,
    clicks: 24600,
    posts: 48,
    tunnel: {
      awareness: 892000,
      interest: 124000,
      consideration: 48000,
      intent: 12400,
      conversion: 284,
    },
  },
  Instagram: {
    followers: 127500,
    followerGrowth: 8.7,
    engagement: 18200,
    engagementRate: 14.27,
    leads: 156,
    leadGrowth: 11.4,
    revenue: 68000,
    revenueGrowth: 16.8,
    conversionRate: 1.8,
    impressions: 2400000,
    clicks: 68000,
    posts: 92,
    tunnel: {
      awareness: 2400000,
      interest: 320000,
      consideration: 89000,
      intent: 18000,
      conversion: 156,
    },
  },
  Facebook: {
    followers: 89400,
    followerGrowth: 3.2,
    engagement: 6700,
    engagementRate: 7.49,
    leads: 198,
    leadGrowth: 6.8,
    revenue: 84000,
    revenueGrowth: 9.4,
    conversionRate: 2.4,
    impressions: 1680000,
    clicks: 42000,
    posts: 64,
    tunnel: {
      awareness: 1680000,
      interest: 218000,
      consideration: 72000,
      intent: 16000,
      conversion: 198,
    },
  },
  TikTok: {
    followers: 234000,
    followerGrowth: 31.8,
    engagement: 48600,
    engagementRate: 20.77,
    leads: 89,
    leadGrowth: 44.2,
    revenue: 32000,
    revenueGrowth: 58.4,
    conversionRate: 0.9,
    impressions: 4800000,
    clicks: 96000,
    posts: 38,
    tunnel: {
      awareness: 4800000,
      interest: 680000,
      consideration: 124000,
      intent: 28000,
      conversion: 89,
    },
  },
  YouTube: {
    followers: 32800,
    followerGrowth: 6.4,
    engagement: 4920,
    engagementRate: 15.0,
    leads: 312,
    leadGrowth: 22.6,
    revenue: 186000,
    revenueGrowth: 31.2,
    conversionRate: 4.8,
    impressions: 1240000,
    clicks: 68000,
    posts: 24,
    tunnel: {
      awareness: 1240000,
      interest: 186000,
      consideration: 82000,
      intent: 24000,
      conversion: 312,
    },
  },
};

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

function formatCurrency(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + "M€";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K€";
  return n + "€";
}

const totalStats = {
  followers: Object.values(mockData).reduce((a, b) => a + b.followers, 0),
  leads: Object.values(mockData).reduce((a, b) => a + b.leads, 0),
  revenue: Object.values(mockData).reduce((a, b) => a + b.revenue, 0),
  engagement: Object.values(mockData).reduce((a, b) => a + b.engagement, 0),
};

export default function SocialAdminPage() {
  const [activePlatform, setActivePlatform] = useState<string>("LinkedIn");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const data = mockData[activePlatform];
  const color = platformColors[activePlatform];

  const tunnelKeys = Object.keys(data.tunnel) as Array<keyof typeof data.tunnel>;
  const tunnelMax = data.tunnel.awareness;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        color: "#e8e8f0",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          borderBottom: "1px solid rgba(200,169,110,0.2)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
          position: "sticky",
          top: 0,
          backgroundColor: "rgba(5,5,8,0.95)",
          backdropFilter: "blur(20px)",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "900",
              color: "#050508",
            }}
          >
            A
          </div>
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#c8a96e",
                letterSpacing: "-0.3px",
              }}
            >
              AcadémIA Pro
            </div>
            <div style={{ fontSize: "11px", color: "#6b6b7e", marginTop: "-2px" }}>
              Social Media Command Center
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {["overview", "analytics", "content", "leads"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  backgroundColor: activeTab === tab ? "rgba(200,169,110,0.15)" : "transparent",
                  color: activeTab === tab ? "#c8a96e" : "#6b6b7e",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "rgba(200,169,110,0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(200,169,110,0.2)",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#4ade80",
                boxShadow: "0 0 8px #4ade80",
              }}
            />
            <span style={{ fontSize: "13px", color: "#c8a96e" }}>Live · Q4 2024</span>
          </div>

          <div
            style={{
              width: "36px",
              height: "36px",
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
            AP
          </div>
        </div>
      </div>

      <div style={{ padding: "32px" }}>
        {/* GLOBAL KPI ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              label: "Total Followers",
              value: formatNumber(totalStats.followers),
              sub: "+14.3% ce mois",
              icon: "👥",
              positive: true,
            },
            {
              label: "Total Engagement",
              value: formatNumber(totalStats.engagement),
              sub: "+9.8% ce mois",
              icon: "💬",
              positive: true,
            },
            {
              label: "Total Leads",
              value: formatNumber(totalStats.leads),
              sub: "+21.4% ce mois",
              icon: "🎯",
              positive: true,
            },
            {
              label: "Chiffre d'Affaires",
              value: formatCurrency(totalStats.revenue),
              sub: "+27.6% ce mois",
              icon: "💰",
              positive: true,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(200,169,110,0.15)",
                borderRadius: "16px",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "80px",
                  height: "80px",
                  background: "radial-gradient(circle at top right, rgba(200,169,110,0.08), transparent)",
                  borderRadius: "0 16px 0 0",
                }}
              />
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{kpi.icon}</div>
              <div style={{ fontSize: "11px", color: "#6b6b7e", textTransform: "uppercase", letterSpacing: "1px" }}>
                {kpi.label}
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#c8a96e",
                  margin: "4px 0",
                  letterSpacing: "-1px",
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: kpi.positive ? "#4ade80" : "#f87171",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{kpi.positive ? "▲" : "▼"}</span>
                <span>{kpi.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* PLATFORM SELECTOR */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "32px",
            flexWrap: "wrap",
          }}
        >
          {platforms.map((platform) => {
            const pColor = platformColors[platform];
            const isActive = activePlatform === platform;
            return (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: isActive
                    ? "1px solid " + pColor
                    : "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: isActive
                    ? "rgba(" +
                      parseInt(pColor.slice(1, 3), 16) +
                      "," +
                      parseInt(pColor.slice(3, 5), 16) +
                      "," +
                      parseInt(pColor.slice(5, 7), 16) +
                      ",0.12)"
                    : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    backgroundColor: pColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "800",
                    color: "#fff",
                    textTransform: "uppercase",
                  }}
                >
                  {platformIcons[platform]}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: isActive ? "#e8e8f0" : "#6b6b7e",
                    }}
                  >
                    {platform}
                  </div>
                  <div style={{