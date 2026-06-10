"use client";

import { useState } from "react";

// ============================================================
// TYPES
// ============================================================
interface MonthlyData {
  month: string;
  withoutStructure: number;
  withStructure: number;
}

interface ComplianceItem {
  id: string;
  entity: "LLC" | "SAS";
  type: string;
  dueDate: string;
  status: "ok" | "warning" | "urgent" | "pending";
  description: string;
}

// ============================================================
// MOCK DATA
// ============================================================
const MONTHLY_DATA: MonthlyData[] = [
  { month: "Jan", withoutStructure: 12000, withStructure: 7200 },
  { month: "Fév", withoutStructure: 15000, withStructure: 9000 },
  { month: "Mar", withoutStructure: 18000, withStructure: 10800 },
  { month: "Avr", withoutStructure: 14000, withStructure: 8400 },
  { month: "Mai", withoutStructure: 22000, withStructure: 13200 },
  { month: "Jun", withoutStructure: 28000, withStructure: 16800 },
  { month: "Jul", withoutStructure: 31000, withStructure: 18600 },
  { month: "Aoû", withoutStructure: 27000, withStructure: 16200 },
  { month: "Sep", withoutStructure: 35000, withStructure: 21000 },
  { month: "Oct", withoutStructure: 38000, withStructure: 22800 },
  { month: "Nov", withoutStructure: 42000, withStructure: 25200 },
  { month: "Déc", withoutStructure: 48000, withStructure: 28800 },
];

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: "1",
    entity: "LLC",
    type: "Annual Report",
    dueDate: "2025-03-01",
    status: "warning",
    description: "Rapport annuel Wyoming à déposer",
  },
  {
    id: "2",
    entity: "LLC",
    type: "Agent Renewal",
    dueDate: "2025-04-15",
    status: "ok",
    description: "Renouvellement agent enregistré",
  },
  {
    id: "3",
    entity: "SAS",
    type: "TVA Mensuelle",
    dueDate: "2025-02-20",
    status: "urgent",
    description: "Déclaration TVA CA3 - Janvier 2025",
  },
  {
    id: "4",
    entity: "SAS",
    type: "IS Acompte",
    dueDate: "2025-03-15",
    status: "pending",
    description: "Acompte IS 1er trimestre 2025",
  },
  {
    id: "5",
    entity: "SAS",
    type: "Liasse Fiscale",
    dueDate: "2025-05-15",
    status: "ok",
    description: "Déclaration annuelle résultats 2024",
  },
  {
    id: "6",
    entity: "LLC",
    type: "EIN Maintenance",
    dueDate: "2025-06-01",
    status: "ok",
    description: "Vérification conformité EIN IRS",
  },
];

// ============================================================
// HELPERS
// ============================================================
const formatEuro = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

// ============================================================
// SUB-COMPONENTS
// ============================================================

/** Gold gradient divider */
const GoldDivider = () => (
  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c8a96e] to-transparent opacity-40 my-6" />
);

/** Section title */
const SectionTitle = ({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-3 mb-6">
    <span className="text-2xl">{icon}</span>
    <div>
      <h2 className="text-[#c8a96e] font-bold text-lg tracking-wide uppercase">
        {title}
      </h2>
      {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

/** Metric card */
const MetricCard = ({
  label,
  value,
  sub,
  highlight,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  trend?: "up" | "down" | "neutral";
}) => (
  <div
    className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] ${
      highlight
        ? "bg-gradient-to-br from-[#1a1508] to-[#0d0c02] border-[#c8a96e]/50"
        : "bg-[#0a0a12] border-[#1a1a2e]"
    }`}
  >
    <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
      {label}
    </p>
    <p
      className={`text-xl font-bold ${highlight ? "text-[#c8a96e]" : "text-white"}`}
    >
      {value}
    </p>
    {sub && (
      <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
        {trend === "up" && <span className="text-emerald-400">↑</span>}
        {trend === "down" && <span className="text-red-400">↓</span>}
        {sub}
      </p>
    )}
  </div>
);

/** Status badge */
const StatusBadge = ({
  status,
}: {
  status: "Active" | "Inactive" | "Pending";
}) => {
  const colors = {
    Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Inactive: "bg-red-500/20 text-red-400 border-red-500/30",
    Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[status]}`}
    >
      {status}
    </span>
  );
};

/** Compliance status badge */
const ComplianceBadge = ({
  status,
}: {
  status: ComplianceItem["status"];
}) => {
  const config = {
    ok: { cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "OK" },
    warning: { cls: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Attention" },
    urgent: { cls: "bg-red-500/20 text-red-400 border-red-500/30", label: "Urgent" },
    pending: { cls: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "En attente" },
  };
  const { cls, label } = config[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
};

/** Progress bar */
const ProgressBar = ({
  value,
  max = 100,
  color = "#c8a96e",
}: {
  value: number;
  max?: number;
  color?: string;
}) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-[#1a1a2e] rounded-full h-1.5 mt-2">
      <div
        className="h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
};

// ============================================================
// 5-YEAR CHART (SVG based, no external lib)
// ============================================================
const FiveYearChart = ({
  residence,
}: {
  residence: "France" | "Portugal" | "Dubai";
}) => {
  const residenceMultiplier = {
    France: 1,
    Portugal: 0.82,
    Dubai: 0.65,
  }[residence];

  const years = ["2024", "2025", "2026", "2027", "2028"];
  const baseWithout = [85000, 102000, 124000, 149000, 180000];
  const baseWith = [51000, 61200, 74400, 89400, 108000];

  const withoutData = baseWithout.map((v) =>
    Math.round(v * residenceMultiplier)
  );
  const withData = baseWith.map((v) => Math.round(v * residenceMultiplier));
  const savings = withoutData.map((v, i) => v - withData[i]);

  const maxVal = Math.max(...withoutData);
  const chartH = 160;
  const chartW = 520;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const toX = (i: number) => padL + (i / (years.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - (v / maxVal) * plotH;

  const pathWithout = withoutData
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`)
    .join(" ");
  const pathWith = withData
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`)
    .join(" ");

  // Area fill for "with"
  const areaWith =
    `M ${toX(0)} ${toY(withData[0])} ` +
    withData
      .slice(1)
      .map((v, i) => `L ${toX(i + 1)} ${toY(v)}`)
      .join(" ") +
    ` L ${toX(years.length - 1)} ${padT + plotH} L ${toX(0)} ${padT + plotH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full"
        style={{ minWidth: 300 }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8a96e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c8a96e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={padL}
            y1={padT + plotH * (1 - p)}
            x2={padL + plotW}
            y2={padT + plotH * (1 - p)}
            stroke="#1a1a2e"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaWith} fill="url(#areaGrad)" />

        {/* Without structure */}
        <path
          d={pathWithout}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="6 3"
          opacity="0.7"
        />

        {/* With structure */}
        <path
          d={pathWith}
          fill="none"
          stroke="#c8a96e"
          strokeWidth="2.5"
        />

        {/* Points */}
        {withoutData.map((v, i) => (
          <circle
            key={`wo-${i}`}
            cx={toX(i)}
            cy={toY(v)}
            r="4"
            fill="#ef4444"
            opacity="0.8"
          />
        ))}
        {withData.map((v, i) => (
          <circle
            key={`w-${i}`}
            cx={toX(i)}
            cy={toY(v)}
            r="4"
            fill="#c8a96e"
          />
        ))}

        {/* Savings labels */}
        {savings.map((s, i) => (
          <text
            key={`s-${i}`}
            x={toX(i)}
            y={toY(withData[i]) - 10}
            textAnchor="middle"
            fontSize="9"
            fill="#c8a96e"
            opacity="0.9"
          >
            -{formatEuro(s).replace("€", "€")}
          </text>
        ))}

        {/* X axis labels */}
        {years.map((y, i) => (
          <text
            key={`y-${i}`}
            x={toX(i)}
            y={chartH - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {y}
          </text>
        ))}

        {/* Y axis labels */}
        {[0, 0.5, 1].map((p) => (
          <text
            key={`ya-${p}`}
            x={padL - 4}
            y={padT + plotH * (1 - p) + 4}
            textAnchor="end"
            fontSize="9"
            fill="#6b7280"
          >
            {Math.round((maxVal * p) / 1000)}k
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-[#c8a96e]" />
          <span className="text-xs text-gray-400">Avec montage</span>