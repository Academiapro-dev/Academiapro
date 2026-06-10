```tsx
"use client";

import { useState } from "react";

const weeklyData = {
  week: "Semaine 47",
  period: "18 – 24 Nov 2024",
  global: {
    revenue: 28_450,
    leads: 1_247,
    acquisitionCost: 4_320,
    roas: 6.59,
    newLearners: 312,
    revenueGrowth: +18.4,
    leadsGrowth: +12.1,
    roasGrowth: +8.7,
    learnersGrowth: +22.3,
  },
  social: [
    {
      platform: "Instagram",
      icon: "📸",
      posts: 14,
      reach: 48_200,
      engagement: "6.8%",
      newFollowers: 423,
      clicks: 1_840,
      color: "#E1306C",
    },
    {
      platform: "TikTok",
      icon: "🎵",
      posts: 9,
      reach: 112_400,
      engagement: "9.2%",
      newFollowers: 1_102,
      clicks: 2_310,
      color: "#69C9D0",
    },
    {
      platform: "LinkedIn",
      icon: "💼",
      posts: 7,
      reach: 18_900,
      engagement: "4.1%",
      newFollowers: 187,
      clicks: 940,
      color: "#0A66C2",
    },
    {
      platform: "YouTube",
      icon: "▶️",
      posts: 3,
      reach: 31_700,
      engagement: "5.6%",
      newFollowers: 298,
      clicks: 1_450,
      color: "#FF0000",
    },
    {
      platform: "Facebook",
      icon: "👥",
      posts: 11,
      reach: 27_300,
      engagement: "3.4%",
      newFollowers: 134,
      clicks: 870,
      color: "#1877F2",
    },
  ],
  googleAds: {
    impressions: 284_000,
    clicks: 9_840,
    ctr: "3.46%",
    conversions: 198,
    cpa: 12.4,
    roas: 7.2,
    spend: 2_455,
  },
  metaAds: {
    reach: 94_200,
    clicks: 6_720,
    conversions: 134,
    cpa: 13.9,
    roas: 5.8,
    spend: 1_865,
  },
  budget: {
    spent: 4_320,
    planned: 4_500,
    utilization: 96,
  },
  leadMagnets: {
    ebook: { downloads: 834, conversionRate: "12.4%", revenue: 3_240 },
    webinar: { registrations: 267, conversionRate: "18.9%", revenue: 8_910 },
    miniCourse: { registrations: 146, conversionRate: "24.7%", revenue: 7_300 },
    email: {
      openRate: "38.2%",
      clickRate: "14.6%",
      conversionRate: "6.8%",
    },
  },
  topPerformances: {
    topFormation: {
      name: "Master IA Appliquée",
      sales: 87,
      revenue: 13_050,
      growth: "+34%",
    },
    topPack: {
      name: "Pack Entrepreneur Digital",
      sales: 43,
      revenue: 8_600,
      growth: "+28%",
    },
    topChannel: {
      name: "Google Ads",
      roas: 7.2,
      revenue: 17_664,
      label: "Canal le + rentable",
    },
    topAd: {
      name: '"Transformez votre carrière en 90 jours"',
      platform: "Meta Ads",
      ctr: "5.84%",
      conversions: 67,
      spend: 420,
    },
  },
  recommendations: [
    {
      priority: "HAUTE",
      title: "Amplifier le budget TikTok Ads",
      detail:
        "TikTok génère 9.2% d'engagement organique — un test paid de 800€ pourrait tripler les leads à coût réduit. Cibler les 25-35 ans intéressés par reconversion professionnelle.",
      icon: "🚀",
      color: "#22d3ee",
    },
    {
      priority: "MOYENNE",
      title: "Relancer les non-convertis du webinaire",
      detail:
        '267 inscrits webinaire dont 81% n\'ont pas acheté. Séquence email 3 étapes + offre "replay + bonus exclusif" peut générer +15K€ additionnels cette semaine.',
      icon: "📧",
      color: "#a78bfa",
    },
    {
      priority: "HAUTE",
      title: "Dupliquer l\'annonce top performer",
      detail:
        '"Transformez votre carrière en 90 jours" (CTR 5.84%) — créer 3 variantes A/B avec accroches différentes. Potentiel d\'atteindre 8%+ CTR et réduire CPA de 20%.',
      icon: "⚡",
      color: "#c8a96e",
    },
  ],
};

const formatNumber = (n: number) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1_000
    ? (n / 1_000).toFixed(1) + "K"
    : n.toString();

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export default function WeeklyMarketingReport() {
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);
  };

  const handleSendEmail = () => {
    setSending(true);
    setTimeout(() => setSending(false), 2500);
  };

  return (
    <div
      className="min-h-screen text-white font-sans"
      style={{ backgroundColor: "#050508" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(5,5,8,0.95)",
          borderColor: "rgba(200,169,110,0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: "#c8a96e", color: "#050508" }}
            >
              A
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-wide"
                style={{ color: "#c8a96e" }}
              >
                AcadémIA Pro
              </h1>
              <p className="text-xs text-gray-400">Rapport Marketing</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-sm text-gray-400">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: "rgba(200,169,110,0.15)",
                color: "#c8a96e",
                border: "1px solid rgba(200,169,110,0.3)",
              }}
            >
              {weeklyData.week}
            </span>
            <span>{weeklyData.period}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60"
              style={{
                backgroundColor: "rgba(200,169,110,0.15)",
                color: "#c8a96e",
                border: "1px solid rgba(200,169,110,0.4)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(200,169,110,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(200,169,110,0.15)";
              }}
            >
              {downloading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Génération…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  PDF
                </>
              )}
            </button>

            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60"
              style={{
                backgroundColor: "#c8a96e",
                color: "#050508",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#d4b87e";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#c8a96e";
              }}
            >
              {sending ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Envoi…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Email
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* Section 1 — Vue Globale */}
        <section>
          <SectionHeader
            number="01"
            title="Vue Globale Semaine"
            subtitle={weeklyData.period}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
            <KpiCard
              label="CA Généré"
              value={formatCurrency(weeklyData.global.revenue)}
              growth={weeklyData.global.revenueGrowth}
              icon="💰"
              highlight
            />
            <KpiCard
              label="Leads Capturés"
              value={formatNumber(weeklyData.global.leads)}
              growth={weeklyData.global.leadsGrowth}
              icon="🎯"
            />
            <KpiCard
              label="Coût Acquisition"
              value={formatCurrency(weeklyData.global.acquisitionCost)}
              growth={-3.2}
              icon="💸"
              invertGrowth
            />
            <KpiCard
              label="ROAS Global"
              value={`${weeklyData.global.roas}x`}
              growth={weeklyData.global.roasGrowth}
              icon="📈"
            />
            <KpiCard
              label="Nouveaux Apprenants"
              value={formatNumber(weeklyData.global.newLearners)}
              growth={weeklyData.global.learnersGrowth}
              icon="🎓"
            />
          </div>
        </section>

        {/* Section 2 — Réseaux Sociaux */}
        <section>
          <SectionHeader
            number="02"
            title="Réseaux Sociaux"
            subtitle="Performance par plateforme"
          />
          <div
            className="mt-6 rounded-2xl overflow-hidden border"
            style={{
              borderColor: "rgba(200,169,110,0.15)",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(200,169,110,0.15)",
                      backgroundColor: "rgba(200,169,110,0.05)",
                    }}
                  >
                    {[
                      "Plateforme",
                      "Posts",
                      "Reach",
                      