```tsx
"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = "actif" | "pause" | "erreur";
type PostStatus = "planifié" | "publié" | "en attente";
type Platform = "LinkedIn" | "Instagram" | "Facebook" | "TikTok" | "YouTube";

interface PlatformData {
  name: Platform;
  icon: string;
  color: string;
  followers: number;
  growthWeek: number;
  postsPublished: number;
  avgEngagement: number;
  leadsGenerated: number;
  conversions: number;
  agentStatus: AgentStatus;
  revenue: number;
}

interface ScheduledPost {
  id: number;
  platform: Platform;
  content: string;
  date: string;
  time: string;
  status: PostStatus;
  reach?: number;
}

interface Tunnel {
  name: string;
  platform: Platform;
  conversionRate: number;
  leads: number;
  revenue: number;
  isBest?: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const platformsData: PlatformData[] = [
  {
    name: "LinkedIn",
    icon: "in",
    color: "#0077B5",
    followers: 12840,
    growthWeek: 3.2,
    postsPublished: 5,
    avgEngagement: 4.8,
    leadsGenerated: 47,
    conversions: 12,
    agentStatus: "actif",
    revenue: 8400,
  },
  {
    name: "Instagram",
    icon: "IG",
    color: "#E1306C",
    followers: 28650,
    growthWeek: 5.7,
    postsPublished: 9,
    avgEngagement: 6.2,
    leadsGenerated: 63,
    conversions: 18,
    agentStatus: "actif",
    revenue: 6200,
  },
  {
    name: "Facebook",
    icon: "FB",
    color: "#1877F2",
    followers: 9320,
    growthWeek: 1.1,
    postsPublished: 6,
    avgEngagement: 2.9,
    leadsGenerated: 21,
    conversions: 5,
    agentStatus: "pause",
    revenue: 1800,
  },
  {
    name: "TikTok",
    icon: "TK",
    color: "#FF0050",
    followers: 41200,
    growthWeek: 12.4,
    postsPublished: 14,
    avgEngagement: 9.1,
    leadsGenerated: 38,
    conversions: 9,
    agentStatus: "actif",
    revenue: 3100,
  },
  {
    name: "YouTube",
    icon: "YT",
    color: "#FF0000",
    followers: 7890,
    growthWeek: 2.3,
    postsPublished: 2,
    avgEngagement: 5.4,
    leadsGenerated: 29,
    conversions: 14,
    agentStatus: "erreur",
    revenue: 5600,
  },
];

const tunnelsData: Tunnel[] = [
  {
    name: "Formation Copywriting",
    platform: "LinkedIn",
    conversionRate: 18.4,
    leads: 47,
    revenue: 8400,
    isBest: true,
  },
  {
    name: "Masterclass IA",
    platform: "Instagram",
    conversionRate: 14.2,
    leads: 63,
    revenue: 6200,
  },
  {
    name: "Coaching 1:1",
    platform: "YouTube",
    conversionRate: 22.1,
    leads: 29,
    revenue: 5600,
  },
  {
    name: "Programme 90 jours",
    platform: "TikTok",
    conversionRate: 8.7,
    leads: 38,
    revenue: 3100,
  },
  {
    name: "Webinaire Gratuit",
    platform: "Facebook",
    conversionRate: 5.2,
    leads: 21,
    revenue: 1800,
  },
];

const scheduledPosts: ScheduledPost[] = [
  {
    id: 1,
    platform: "LinkedIn",
    content: "🎯 Les 5 erreurs qui tuent votre personal brand...",
    date: "Lun 13",
    time: "09:00",
    status: "publié",
    reach: 4200,
  },
  {
    id: 2,
    platform: "Instagram",
    content: "✨ Reel : Comment l'IA transforme le copywriting",
    date: "Lun 13",
    time: "11:30",
    status: "publié",
    reach: 8900,
  },
  {
    id: 3,
    platform: "TikTok",
    content: "🔥 POV : Tu utilises l'IA pour créer du contenu",
    date: "Mar 14",
    time: "18:00",
    status: "planifié",
  },
  {
    id: 4,
    platform: "LinkedIn",
    content: "📊 Étude de cas : +340% de leads en 30 jours",
    date: "Mer 15",
    time: "08:30",
    status: "planifié",
  },
  {
    id: 5,
    platform: "YouTube",
    content: "🎬 Tuto complet : Agent IA pour réseaux sociaux",
    date: "Mer 15",
    time: "16:00",
    status: "en attente",
  },
  {
    id: 6,
    platform: "Instagram",
    content: "💡 Carousel : 7 prompts IA pour votre marketing",
    date: "Jeu 16",
    time: "10:00",
    status: "planifié",
  },
  {
    id: 7,
    platform: "Facebook",
    content: "📢 Live annonce : Nouvelle formation disponible !",
    date: "Jeu 16",
    time: "20:00",
    status: "en attente",
  },
  {
    id: 8,
    platform: "TikTok",
    content: "🚀 Avant/Après : Mon contenu sans et avec IA",
    date: "Ven 17",
    time: "19:00",
    status: "planifié",
  },
  {
    id: 9,
    platform: "LinkedIn",
    content: "🧠 Thread : L'avenir du marketing avec l'IA générative",
    date: "Sam 18",
    time: "10:00",
    status: "planifié",
  },
];

// ─── Helper Components ────────────────────────────────────────────────────────

const formatNumber = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
};

const formatCurrency = (n: number): string =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const PlatformIcon = ({
  platform,
  size = "sm",
}: {
  platform: Platform;
  size?: "sm" | "md" | "lg";
}) => {
  const colors: Record<Platform, string> = {
    LinkedIn: "bg-[#0077B5]",
    Instagram: "bg-gradient-to-br from-[#833ab4] via-[#E1306C] to-[#fcb045]",
    Facebook: "bg-[#1877F2]",
    TikTok: "bg-black border border-[#FF0050]",
    YouTube: "bg-[#FF0000]",
  };
  const labels: Record<Platform, string> = {
    LinkedIn: "in",
    Instagram: "IG",
    Facebook: "f",
    TikTok: "TK",
    YouTube: "▶",
  };
  const sizes = { sm: "w-6 h-6 text-[9px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" };
  return (
    <div
      className={`${sizes[size]} ${colors[platform]} rounded-md flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {labels[platform]}
    </div>
  );
};

const StatusBadge = ({ status }: { status: AgentStatus }) => {
  const config = {
    actif: { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400", label: "Actif" },
    pause: { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-400", label: "Pause" },
    erreur: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400", label: "Erreur" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === "actif" ? "animate-pulse" : ""}`} />
      {config.label}
    </span>
  );
};

const PostStatusBadge = ({ status }: { status: PostStatus }) => {
  const config = {
    planifié: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Planifié" },
    publié: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Publié" },
    "en attente": { bg: "bg-amber-500/20", text: "text-amber-400", label: "En attente" },
  }[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const TrendArrow = ({ value }: { value: number }) => (
  <span className={`text-xs font-semibold ${value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
    {value >= 0 ? "↑" : "↓"} {Math.abs(value)}%
  </span>
);

const GoldDivider = () => (
  <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c8a96e]/40 to-transparent my-6" />
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: string;
  trend?: number;
  accent?: boolean;
}

const KPICard = ({ label, value, subValue, icon, trend, accent }: KPICardProps) => (
  <div
    className={`relative rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02] group
    ${accent
      ? "bg-gradient-to-br from-[#c8a96e]/20 to-[#c8a96e]/5 border-[#c8a96e]/40 shadow-[0_0_30px_rgba(200,169,110,0.1)]"
      : "bg-[#0d0d14] border-[#1a1a2e] hover:border-[#c8a96e]/30"
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl
        ${accent ? "bg-[#c8a96e]/20" : "bg-[#1a1a2e]"}`}
      >
        {icon}
      </div>
      {trend !== undefined && <TrendArrow value={trend} />}
    </div>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    {subValue && <p className="text-xs text-[#c8a96e] font-medium mb-1">{subValue}</p>}
    <p className="text-xs text-gray-500">{label}</p>
    <div
      className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-transparent via-[#c8a96e]/60 to-transparent
      opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
    />
  </div>
);

// ─── Platform Card ────────────────────────────────────────────────────────────

const PlatformCard = ({ data }: { data: PlatformData }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-[#0d0d14] rounded-2xl border border-[#1a1a2e] hover:border-[#c8a96e]/30 transition-all duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={data.name} size="md" />
            <div>
              <h3 className="text-white font-semibold">{data.name}</h3>
              <p className="text-xs text-gray-500">{formatNumber(data.followers)} followers</p>
            </div>
          </div>
          <StatusBadge status={data.agentStatus} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#0a0a10] rounded-xl p-3 border border-[#1a1a2e]">
            <p className="text-xs text-gray-500 mb-1">Croissance</p>
            <TrendArrow value={data.growthWeek} />
          </div>
          <div className="bg-[#0a0a10] rounded-xl p-3 border border-[#1a1a2e]">
            <p className="text-xs text-gray-500 mb-1">Engagement</p>
            <p className="text-sm font-bold text-[#c8a96e]">{data.avgEngagement}%</p>
          </div>
          <div className="bg-[#0a0a10] rounded-xl p-3 border border-[#