```tsx
"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface KPI {
  label: string;
  value: string | number;
  change: number;
  prefix?: string;
  suffix?: string;
  icon: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: PipelineStage;
  score: number;
  source: AcquisitionSource;
  lastContact: Date;
  value: number;
  avatar: string;
  tags: string[];
  nextFollowUp?: Date;
}

interface Alert {
  id: string;
  contactId: string;
  contactName: string;
  message: string;
  priority: "high" | "medium" | "low";
  dueDate: Date;
  type: "followup" | "renewal" | "upsell" | "welcome";
}

interface AcquisitionData {
  source: string;
  count: number;
  revenue: number;
  color: string;
}

type PipelineStage = "visiteur" | "prospect" | "lead" | "client" | "vip";
type AcquisitionSource =
  | "organic"
  | "paid"
  | "referral"
  | "social"
  | "email"
  | "direct";

// ============================================================
// MOCK DATA GENERATORS
// ============================================================

const generateContacts = (): Contact[] => {
  const names = [
    "Sophie Marchand",
    "Thomas Dupont",
    "Marie Laurent",
    "Lucas Bernard",
    "Emma Petit",
    "Antoine Moreau",
    "Camille Rousseau",
    "Julien Lefevre",
    "Alice Martin",
    "Hugo Dubois",
    "Léa Fontaine",
    "Nathan Girard",
    "Chloé Bonnet",
    "Maxime Legrand",
    "Inès Chevalier",
    "Raphaël Gauthier",
    "Manon Perrin",
    "Théo Lambert",
  ];
  const stages: PipelineStage[] = [
    "visiteur",
    "prospect",
    "lead",
    "client",
    "vip",
  ];
  const sources: AcquisitionSource[] = [
    "organic",
    "paid",
    "referral",
    "social",
    "email",
    "direct",
  ];
  const tagsList = [
    ["MBA", "Finance"],
    ["Tech", "AI"],
    ["Marketing", "Growth"],
    ["Leadership"],
    ["Data Science"],
    ["Entrepreneurship"],
    ["Design"],
    ["Product"],
  ];

  return names.map((name, i) => ({
    id: `contact-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@email.com`,
    phone: `+33 6 ${Math.floor(10000000 + Math.random() * 89999999)}`,
    stage: stages[Math.floor(Math.random() * stages.length)],
    score: Math.floor(20 + Math.random() * 80),
    source: sources[Math.floor(Math.random() * sources.length)],
    lastContact: new Date(
      Date.now() - Math.floor(Math.random() * 30) * 86400000
    ),
    value: Math.floor(500 + Math.random() * 9500),
    avatar: name
      .split(" ")
      .map((n) => n[0])
      .join(""),
    tags: tagsList[Math.floor(Math.random() * tagsList.length)],
    nextFollowUp:
      Math.random() > 0.4
        ? new Date(Date.now() + Math.floor(Math.random() * 7) * 86400000)
        : undefined,
  }));
};

const generateAlerts = (contacts: Contact[]): Alert[] => {
  const types: Alert["type"][] = [
    "followup",
    "renewal",
    "upsell",
    "welcome",
  ];
  const messages = {
    followup: "Relance nécessaire — dernier contact il y a plus de 7 jours",
    renewal: "Renouvellement de formation à proposer",
    upsell: "Candidat idéal pour une montée en gamme VIP",
    welcome: "Séquence de bienvenue à compléter",
  };
  const priorities: Alert["priority"][] = ["high", "medium", "low"];

  return contacts
    .slice(0, 8)
    .map((contact, i) => {
      const type = types[i % types.length];
      return {
        id: `alert-${i + 1}`,
        contactId: contact.id,
        contactName: contact.name,
        message: messages[type],
        priority: priorities[i % 3],
        dueDate: new Date(Date.now() + (i - 2) * 86400000),
        type,
      };
    })
    .sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });
};

const acquisitionData: AcquisitionData[] = [
  { source: "Organique", count: 142, revenue: 28400, color: "#c8a96e" },
  { source: "Publicité", count: 89, revenue: 22250, color: "#9f7f4f" },
  { source: "Référral", count: 67, revenue: 18760, color: "#e8c98e" },
  { source: "Réseaux", count: 54, revenue: 12600, color: "#7a6040" },
  { source: "Email", count: 38, revenue: 9500, color: "#b8994e" },
  { source: "Direct", count: 31, revenue: 7750, color: "#d4b47e" },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 0) return `Dans ${Math.abs(diff)}j`;
  return `Il y a ${diff}j`;
};

const getScoreColor = (score: number): string => {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
};

const getScoreBg = (score: number): string => {
  if (score >= 70) return "bg-emerald-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-400";
};

const stageConfig: Record<
  PipelineStage,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  visiteur: {
    label: "Visiteur",
    color: "text-slate-400",
    bg: "bg-slate-800",
    border: "border-slate-700",
    dot: "bg-slate-400",
  },
  prospect: {
    label: "Prospect",
    color: "text-blue-400",
    bg: "bg-blue-900/30",
    border: "border-blue-700/50",
    dot: "bg-blue-400",
  },
  lead: {
    label: "Lead",
    color: "text-amber-400",
    bg: "bg-amber-900/30",
    border: "border-amber-700/50",
    dot: "bg-amber-400",
  },
  client: {
    label: "Client",
    color: "text-emerald-400",
    bg: "bg-emerald-900/30",
    border: "border-emerald-700/50",
    dot: "bg-emerald-400",
  },
  vip: {
    label: "VIP",
    color: "text-[#c8a96e]",
    bg: "bg-[#c8a96e]/10",
    border: "border-[#c8a96e]/40",
    dot: "bg-[#c8a96e]",
  },
};

const alertPriorityConfig: Record<
  Alert["priority"],
  { color: string; bg: string; label: string }
> = {
  high: {
    color: "text-red-400",
    bg: "bg-red-900/30 border-red-700/40",
    label: "Urgent",
  },
  medium: {
    color: "text-amber-400",
    bg: "bg-amber-900/30 border-amber-700/40",
    label: "Modéré",
  },
  low: {
    color: "text-slate-400",
    bg: "bg-slate-800/50 border-slate-700/40",
    label: "Faible",
  },
};

const alertTypeIcon: Record<Alert["type"], string> = {
  followup: "🔔",
  renewal: "🔄",
  upsell: "⬆️",
  welcome: "👋",
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

// --- Live Indicator ---
const LiveIndicator = () => (
  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
    </span>
    LIVE
  </span>
);

// --- KPI Card ---
interface KPICardProps {
  kpi: KPI;
  loading?: boolean;
}

const KPICard = ({ kpi, loading }: KPICardProps) => {
  const isPositive = kpi.change >= 0;
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#c8a96e]/20 bg-gradient-to-br from-[#0d0d14] to-[#080810] p-5 group hover:border-[#c8a96e]/40 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-[#c8a96e]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="text-2xl">{kpi.icon}</div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive
                ? "bg-emerald-900/40 text-emerald-400"
                : "bg-red-900/40 text-red-400"
            }`}
          >
            {isPositive ? "+" : "