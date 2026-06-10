"use client";

import { useState, useEffect } from "react";

// ============================================================
// TYPES
// ============================================================
interface KPI {
  label: string;
  value: string | number;
  change: number;
  icon: string;
  prefix?: string;
  suffix?: string;
}

interface SocialNetwork {
  name: string;
  icon: string;
  status: "active" | "inactive" | "scheduled";
  posts: number;
  engagement: number;
  followers: number;
  followersGrowth: number;
}

interface AdCampaign {
  platform: string;
  icon: string;
  budgetSpent: number;
  budgetTotal: number;
  clicks: number;
  conversions: number;
  cpa: number;
  roas: number;
  status: "active" | "paused";
}

interface LeadMagnet {
  name: string;
  icon: string;
  count: number;
  change: number;
  openRate?: number;
  conversionRate: number;
}

interface ActivityItem {
  id: number;
  type: "lead" | "publication" | "conversion";
  message: string;
  time: string;
  value?: string;
}

// ============================================================
// MOCK DATA
// ============================================================
const kpiData: KPI[] = [
  { label: "Posts Publiés", value: 7, change: 2, icon: "📝", suffix: " today" },
  { label: "Leads Capturés", value: 43, change: 18, icon: "🎯" },
  { label: "Clics Google Ads", value: "1 284", change: 12, icon: "🔍" },
  { label: "Clics Meta Ads", value: "2 891", change: 8, icon: "📘" },
  { label: "E-books Téléchargés", value: 156, change: 23, icon: "📚" },
  { label: "Inscrits Webinaire", value: 89, change: 31, icon: "🎥" },
  { label: "CA Généré", value: "12 480", change: 15, icon: "💰", prefix: "€" },
  { label: "Coût Pub", value: "1 240", change: -5, icon: "📊", prefix: "€" },
  { label: "ROAS Global", value: "10.06x", change: 22, icon: "🚀" },
];

const socialNetworks: SocialNetwork[] = [
  { name: "LinkedIn", icon: "💼", status: "active", posts: 3, engagement: 4.8, followers: 12400, followersGrowth: 2.3 },
  { name: "Instagram", icon: "📸", status: "active", posts: 5, engagement: 6.2, followers: 8900, followersGrowth: 3.1 },
  { name: "Facebook", icon: "👥", status: "scheduled", posts: 2, engagement: 3.4, followers: 15600, followersGrowth: 0.8 },
  { name: "TikTok", icon: "🎵", status: "active", posts: 4, engagement: 9.7, followers: 5200, followersGrowth: 8.4 },
  { name: "YouTube", icon: "▶️", status: "scheduled", posts: 1, engagement: 5.1, followers: 3800, followersGrowth: 1.9 },
];

const adCampaigns: AdCampaign[] = [
  { platform: "Google Ads", icon: "🔍", budgetSpent: 620, budgetTotal: 1000, clicks: 1284, conversions: 38, cpa: 16.3, roas: 9.8, status: "active" },
  { platform: "Meta Ads", icon: "📘", budgetSpent: 620, budgetTotal: 1000, clicks: 2891, conversions: 61, cpa: 10.2, roas: 12.4, status: "active" },
];

const leadMagnets: LeadMagnet[] = [
  { name: "E-book IA Marketing", icon: "📗", count: 156, change: 23, openRate: 42.3, conversionRate: 8.9 },
  { name: "Webinaire AcadémIA", icon: "🎬", count: 89, change: 31, openRate: 67.8, conversionRate: 14.2 },
  { name: "Mini-cours Gratuit", icon: "🎓", count: 234, change: 17, openRate: 38.9, conversionRate: 6.4 },
];

const activityFeed: ActivityItem[] = [
  { id: 1, type: "lead", message: "Nouveau lead : Marie D. — E-book IA Marketing", time: "Il y a 2 min", value: "Paris" },
  { id: 2, type: "publication", message: "Post LinkedIn publié : « 5 erreurs marketing à éviter »", time: "Il y a 8 min" },
  { id: 3, type: "conversion", message: "Conversion : Thomas L. → Formation Pro (997€)", time: "Il y a 15 min", value: "997€" },
  { id: 4, type: "lead", message: "Nouveau lead : Sophie M. — Webinaire inscrite", time: "Il y a 22 min", value: "Lyon" },
  { id: 5, type: "publication", message: "Reels Instagram publié : Témoignage client", time: "Il y a 31 min" },
  { id: 6, type: "conversion", message: "Conversion : Julie R. → Mini-cours (47€)", time: "Il y a 45 min", value: "47€" },
  { id: 7, type: "lead", message: "Nouveau lead : Marc B. — Mini-cours inscrit", time: "Il y a 52 min", value: "Bordeaux" },
  { id: 8, type: "publication", message: "Thread Twitter/X publié : IA & copywriting", time: "Il y a 1h" },
];

// ============================================================
// SUB COMPONENTS
// ============================================================

const GoldBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)" }}>
    {children}
  </span>
);

const StatusDot = ({ status }: { status: "active" | "inactive" | "scheduled" }) => {
  const colors = {
    active: "bg-emerald-400 shadow-emerald-400",
    inactive: "bg-red-400 shadow-red-400",
    scheduled: "bg-amber-400 shadow-amber-400",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} shadow-[0_0_6px_currentColor]`} />
  );
};

const ProgressBar = ({ value, max, color = "#c8a96e" }: { value: number; max: number; color?: string }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

const ChangeIndicator = ({ value }: { value: number }) => {
  const positive = value >= 0;
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${positive ? "text-emerald-400" : "text-red-400"}`}>
      {positive ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
};

// ============================================================
// SECTION: KPI CARDS
// ============================================================
const KPISection = ({ kpis }: { kpis: KPI[] }) => (
  <section>
    <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#c8a96e" }}>
      ⚡ KPIs Temps Réel
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {kpis.map((kpi, i) => (
        <div key={i}
          className="relative overflow-hidden rounded-xl p-4 flex flex-col gap-2 group hover:scale-[1.02] transition-transform duration-200"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.12)" }}>
          {/* glow top-right */}
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
            style={{ background: "#c8a96e", filter: "blur(20px)" }} />
          <div className="flex items-start justify-between">
            <span className="text-2xl">{kpi.icon}</span>
            <ChangeIndicator value={kpi.change} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">{kpi.label}</p>
            <p className="text-xl font-bold text-white">
              {kpi.prefix}{kpi.value}{kpi.suffix}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// ============================================================
// SECTION: SOCIAL NETWORKS
// ============================================================
const SocialSection = ({ networks }: { networks: SocialNetwork[] }) => (
  <section>
    <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#c8a96e" }}>
      📡 Réseaux Sociaux
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {networks.map((net, i) => (
        <div key={i}
          className="rounded-xl p-4 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-200"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.12)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{net.icon}</span>
              <span className="font-semibold text-white text-sm">{net.name}</span>
            </div>
            <StatusDot status={net.status} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Followers</p>
              <p className="text-sm font-bold text-white">
                {net.followers >= 1000 ? `${(net.followers / 1000).toFixed(1)}k` : net.followers}
              </p>
              <ChangeIndicator value={net.followersGrowth} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Engagement</p>
              <p className="text-sm font-bold" style={{ color: "#c8a96e" }}>{net.engagement}%</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Posts programmés</span>
              <span className="text-white font-medium">{net.posts}</span>
            </div>
            <ProgressBar value={net.posts} max={7} />
          </div>
          <div className="text-center">
            <GoldBadge>
              {net.status === "active" ? "✓ Actif" : net.status === "scheduled" ? "⏱ Programmé" : "✗ Inactif"}
            </GoldBadge>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// ============================================================
// SECTION: AD CAMPAIGNS
// ============================================================
const CampaignsSection = ({ campaigns }: { campaigns: AdCampaign[] }) => (
  <section>
    <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#c8a96e" }}>
      🎯 Campagnes Publicitaires
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {campaigns.map((camp, i) => (
        <div key={i}
          className="rounded-xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.12)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{camp.icon}</span>
              <div>
                <h3 className="font-bold text-white">{camp.platform}</h3>
                <GoldBadge>{camp.status === "active" ? "✓ Campagne active" : "⏸ En pause"}</GoldBadge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "#c8a96e" }}>{camp.roas}x</p>
              <p className="text-xs text-gray-500">ROAS</p>
            </div>
          </div>

          {/* Budget */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Budget dépensé</span>
              <span className="text-white font-medium">{camp.budgetSpent}€ / {camp.budgetTotal}€</span>
            </div>
            <ProgressBar value={camp.budgetSpent} max={camp.budgetTotal} color="#c8a96e" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Clics", value: camp.clicks.toLocaleString("fr-FR") },
              { label: "Conversions", value: camp.conversions },
              { label: "CPA", value: `${camp.cpa}€` },
            ].map((stat, j) => (
              <div key={j} className="text-center rounded-lg p-2"
                style={{ background: "rgba(200,169,110,0.06)" }}>
                <p className="text-lg font-bold text