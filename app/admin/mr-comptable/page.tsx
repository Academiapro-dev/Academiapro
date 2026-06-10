```tsx
"use client";

import { useState, useEffect } from "react";

// ============================================================
// TYPES
// ============================================================
interface KPI {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

interface Invoice {
  id: string;
  vendor: string;
  amount: string;
  date: string;
  status: "traité" | "en attente" | "anomalie";
}

interface ExpenseNote {
  id: string;
  employee: string;
  description: string;
  amount: string;
  date: string;
  status: "validée" | "en cours" | "refusée";
}

interface Declaration {
  label: string;
  dueDate: string;
  daysLeft: number;
  status: "préparée" | "à valider" | "soumise";
  amount?: string;
}

// ============================================================
// MOCK DATA
// ============================================================
const kpisFinanciers: KPI[] = [
  { label: "CA ce mois", value: "48 750 €", trend: "up", trendValue: "+12.4%" },
  { label: "Charges", value: "21 340 €", trend: "down", trendValue: "-3.1%" },
  { label: "Bénéfice brut", value: "27 410 €", trend: "up", trendValue: "+18.2%" },
  { label: "Net disponible", value: "18 920 €", trend: "up", trendValue: "+9.7%" },
  { label: "TVA à payer", value: "4 875 €", trend: "neutral", trendValue: "Échéance J-8" },
  { label: "URSSAF à payer", value: "3 240 €", trend: "neutral", trendValue: "Échéance J-15" },
  { label: "IS estimé", value: "6 852 €", trend: "neutral", trendValue: "Prévisionnel" },
];

const invoices: Invoice[] = [
  { id: "FAC-2024-089", vendor: "AWS France SARL", amount: "1 240,00 €", date: "15/01/2025", status: "traité" },
  { id: "FAC-2024-090", vendor: "Loyer Bureau Paris 11e", amount: "2 800,00 €", date: "01/01/2025", status: "traité" },
  { id: "FAC-2024-091", vendor: "Orange Business Services", amount: "340,50 €", date: "10/01/2025", status: "en attente" },
  { id: "FAC-2024-092", vendor: "Fournisseur Matériel XYZ", amount: "4 560,00 €", date: "18/01/2025", status: "anomalie" },
  { id: "FAC-2024-093", vendor: "Abonnement Logiciel SaaS", amount: "189,00 €", date: "20/01/2025", status: "traité" },
  { id: "FAC-2024-094", vendor: "Prestation Conseil DEF", amount: "3 200,00 €", date: "22/01/2025", status: "en attente" },
];

const expenseNotes: ExpenseNote[] = [
  { id: "NDF-025", employee: "Marie Dupont", description: "Déplacement client Lyon", amount: "312,40 €", date: "14/01/2025", status: "validée" },
  { id: "NDF-026", employee: "Thomas Bernard", description: "Repas client + taxi", amount: "87,50 €", date: "16/01/2025", status: "validée" },
  { id: "NDF-027", employee: "Julie Martin", description: "Formation en ligne", amount: "490,00 €", date: "19/01/2025", status: "en cours" },
  { id: "NDF-028", employee: "Pierre Leclerc", description: "Hébergement déplacement", amount: "234,00 €", date: "21/01/2025", status: "validée" },
];

const declarations: Declaration[] = [
  { label: "TVA Mensuelle", dueDate: "23/01/2025", daysLeft: 8, status: "à valider", amount: "4 875 €" },
  { label: "URSSAF", dueDate: "15/02/2025", daysLeft: 31, status: "préparée", amount: "3 240 €" },
  { label: "IS Acompte", dueDate: "15/03/2025", daysLeft: 59, status: "préparée", amount: "6 852 €" },
  { label: "Impôt Personnel", dueDate: "15/05/2025", daysLeft: 120, status: "soumise", amount: "12 400 €" },
];

// ============================================================
// HELPER COMPONENTS
// ============================================================

const GoldDivider = () => (
  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c8a96e] to-transparent opacity-30 my-1" />
);

const StatusBadge = ({
  status,
}: {
  status: "traité" | "en attente" | "anomalie" | "validée" | "en cours" | "refusée" | "préparée" | "à valider" | "soumise";
}) => {
  const styles: Record<string, string> = {
    traité: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40",
    validée: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40",
    soumise: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40",
    "en attente": "bg-amber-900/40 text-amber-400 border border-amber-700/40",
    "en cours": "bg-amber-900/40 text-amber-400 border border-amber-700/40",
    "à valider": "bg-amber-900/40 text-amber-400 border border-amber-700/40",
    anomalie: "bg-rose-900/40 text-rose-400 border border-rose-700/40",
    refusée: "bg-rose-900/40 text-rose-400 border border-rose-700/40",
    préparée: "bg-sky-900/40 text-sky-400 border border-sky-700/40",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
};

const TrendIcon = ({ trend, value }: { trend: "up" | "down" | "neutral"; value?: string }) => {
  if (trend === "up")
    return (
      <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
        {value}
      </span>
    );
  if (trend === "down")
    return (
      <span className="flex items-center gap-1 text-rose-400 text-xs font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
        {value}
      </span>
    );
  return <span className="text-[#c8a96e]/80 text-xs font-medium">{value}</span>;
};

// ============================================================
// COUNTDOWN COMPONENT
// ============================================================
const CountdownBadge = ({ days }: { days: number }) => {
  let color = "bg-emerald-900/40 text-emerald-400 border-emerald-700/40";
  if (days <= 10) color = "bg-rose-900/40 text-rose-400 border-rose-700/40";
  else if (days <= 30) color = "bg-amber-900/40 text-amber-400 border-amber-700/40";
  return (
    <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      J-{days}
    </span>
  );
};

// ============================================================
// SECTION CARD WRAPPER
// ============================================================
const SectionCard = ({
  title,
  icon,
  children,
  className = "",
  headerRight,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}) => (
  <div
    className={`rounded-2xl border border-[#c8a96e]/15 bg-gradient-to-br from-[#0d0d12] to-[#0a0a0f] shadow-xl shadow-black/40 overflow-hidden ${className}`}
  >
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#c8a96e]/10 border border-[#c8a96e]/20 flex items-center justify-center text-[#c8a96e]">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-white/90 tracking-wide uppercase">{title}</h2>
      </div>
      {headerRight}
    </div>
    <GoldDivider />
    <div className="p-5">{children}</div>
  </div>
);

// ============================================================
// MINI STAT BOX
// ============================================================
const MiniStat = ({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) => (
  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
    <span className="text-[11px] text-white/40 font-medium uppercase tracking-wider">{label}</span>
    <span className={`text-xl font-bold ${accent ? "text-[#c8a96e]" : "text-white"}`}>{value}</span>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function DashboardComptable() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"factures" | "notes">("factures");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Aggregated stats
  const invoiceStats = {
    received: invoices.length,
    treated: invoices.filter((i) => i.status === "traité").length,
    pending: invoices.filter((i) => i.status === "en attente").length,
    anomalies: invoices.filter((i) => i.status === "anomalie").length,
  };

  const expenseStats = {
    received: expenseNotes.length,
    validated: expenseNotes.filter((n) => n.status === "validée").length,
    totalDeductible: "1 123,90 €",
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans">
      {/* ── BACKGROUND AMBIANCE ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#c8a96e]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#c8a96e]/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ══════════════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════════════ */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c8a96e]/20 to-[#c8a96e]/5 border border-[#c8a96e]/30 flex items-center justify-center shadow-lg shadow-[#c8a96e]/10">
                <svg className="w-6 h-6 text-[#c8a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#c8a96e] shadow-sm shadow-[#c8a96e]/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#050508]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Mr Comptable</h1