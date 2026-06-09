```tsx
// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// TYPES
// ============================================================
interface KPI {
  label: string;
  value: string;
  change: number;
  icon: string;
  prefix?: string;
  suffix?: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "error" | "maintenance";
  tasksToday: number;
  accuracy: number;
  lastAction: string;
  alert?: string;
}

interface Formation {
  id: string;
  title: string;
  revenue: number;
  students: number;
  abandonRate: number;
  trend: number;
  category: string;
}

interface CRMDeal {
  id: string;
  name: string;
  company: string;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed";
  value: number;
  probability: number;
  daysInStage: number;
}

interface ActivityItem {
  id: string;
  type: "enrollment" | "payment" | "agent" | "alert" | "completion" | "lead";
  message: string;
  time: string;
  avatar?: string;
  urgent?: boolean;
}

// ============================================================
// MOCK DATA
// ============================================================
const kpiData: KPI[] = [
  { label: "Chiffre d'affaires", value: "284 750", change: 18.4, icon: "💰", prefix: "", suffix: "€" },
  { label: "Apprenants actifs", value: "3 847", change: 12.1, icon: "🎓", suffix: "" },
  { label: "Prospects qualifiés", value: "642", change: 7.8, icon: "🎯", suffix: "" },
  { label: "Taux de conversion", value: "34.2", change: -2.1, icon: "📈", suffix: "%" },
];

const agentsData: Agent[] = [
  { id: "1", name: "AcadémIA Tutor", role: "Accompagnement pédagogique", status: "active", tasksToday: 847, accuracy: 96.3, lastAction: "Réponse apprenant #4821", },
  { id: "2", name: "LeadBot Pro", role: "Qualification prospects", status: "active", tasksToday: 234, accuracy: 89.7, lastAction: "Lead qualifié: Marie Dupont", },
  { id: "3", name: "ContentGenius", role: "Génération de contenu", status: "idle", tasksToday: 12, accuracy: 94.1, lastAction: "Module Python généré", },
  { id: "4", name: "SupportAI", role: "Support client automatisé", status: "error", tasksToday: 0, accuracy: 0, lastAction: "Erreur API détectée", alert: "Connexion Zendesk perdue — intervention requise" },
  { id: "5", name: "AnalyticsBot", role: "Rapports & insights", status: "active", tasksToday: 56, accuracy: 99.2, lastAction: "Rapport hebdo généré", },
  { id: "6", name: "CertifAI", role: "Évaluation & certification", status: "maintenance", tasksToday: 0, accuracy: 97.8, lastAction: "Mise à jour modèle", alert: "Maintenance programmée jusqu'à 18h00" },
];

const formationsData: Formation[] = [
  { id: "1", title: "IA & Machine Learning Bootcamp", revenue: 84200, students: 421, abandonRate: 8.2, trend: 23, category: "Tech" },
  { id: "2", title: "Marketing Digital Avancé", revenue: 62400, students: 312, abandonRate: 14.7, trend: 11, category: "Marketing" },
  { id: "3", title: "Leadership & Management 4.0", revenue: 48900, students: 163, abandonRate: 6.1, trend: 8, category: "Management" },
  { id: "4", title: "Dev Web Full-Stack React", revenue: 41700, students: 278, abandonRate: 22.3, trend: -4, category: "Tech" },
  { id: "5", title: "Finance & Investissement", revenue: 38600, students: 193, abandonRate: 11.8, trend: 16, category: "Finance" },
];

const crmDeals: CRMDeal[] = [
  { id: "1", name: "TechCorp Formation", company: "TechCorp SA", stage: "negotiation", value: 45000, probability: 75, daysInStage: 3 },
  { id: "2", name: "École Privée Lumière", company: "Groupe Lumière", stage: "proposal", value: 28000, probability: 55, daysInStage: 7 },
  { id: "3", name: "RH Solutions Pack", company: "Solutions RH", stage: "qualified", value: 18500, probability: 40, daysInStage: 2 },
  { id: "4", name: "StartupHub Academy", company: "StartupHub", stage: "closed", value: 32000, probability: 100, daysInStage: 0 },
  { id: "5", name: "Banque Centrale Training", company: "BanqueCentrale", stage: "lead", value: 120000, probability: 20, daysInStage: 1 },
];

const initialActivity: ActivityItem[] = [
  { id: "1", type: "enrollment", message: "Sarah M. s'est inscrite à IA & ML Bootcamp", time: "À l'instant", avatar: "SM" },
  { id: "2", type: "payment", message: "Paiement reçu — TechCorp SA — 45 000€", time: "2 min", urgent: false },
  { id: "3", type: "agent", message: "LeadBot Pro a qualifié 8 nouveaux prospects", time: "5 min" },
  { id: "4", type: "alert", message: "SupportAI hors ligne — 23 tickets en attente", time: "8 min", urgent: true },
  { id: "5", type: "completion", message: "Thomas R. a obtenu sa certification Dev React", time: "12 min", avatar: "TR" },
  { id: "6", type: "lead", message: "Nouveau lead entrant: BanqueCentrale (120k€)", time: "15 min", urgent: false },
  { id: "7", type: "enrollment", message: "Groupe de 15 apprenants — Leadership 4.0", time: "22 min" },
  { id: "8", type: "agent", message: "ContentGenius a généré 3 nouveaux modules", time: "31 min" },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const statusConfig = {
  active: { label: "Actif", color: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400" },
  idle: { label: "Inactif", color: "text-amber-400", bg: "bg-amber-400/10", dot: "bg-amber-400" },
  error: { label: "Erreur", color: "text-red-400", bg: "bg-red-400/10", dot: "bg-red-400" },
  maintenance: { label: "Maintenance", color: "text-blue-400", bg: "bg-blue-400/10", dot: "bg-blue-400" },
};

const stageConfig = {
  lead: { label: "Lead", color: "text-slate-400", bg: "bg-slate-700", width: "w-1/5" },
  qualified: { label: "Qualifié", color: "text-blue-400", bg: "bg-blue-900/50", width: "w-2/5" },
  proposal: { label: "Proposition", color: "text-purple-400", bg: "bg-purple-900/50", width: "w-3/5" },
  negotiation: { label: "Négociation", color: "text-amber-400", bg: "bg-amber-900/50", width: "w-4/5" },
  closed: { label: "Gagné ✓", color: "text-emerald-400", bg: "bg-emerald-900/50", width: "w-full" },
};

const activityIcons = {
  enrollment: "🎓",
  payment: "💳",
  agent: "🤖",
  alert: "🚨",
  completion: "🏆",
  lead: "🎯",
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

// Animated counter hook
function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// Gold gradient text
function GoldText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-[#c8a96e] via-[#e8d5a3] to-[#c8a96e] bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

// Card wrapper
function Card({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={`
      relative rounded-2xl border border-white/5 bg-[#0a0a0f]
      ${glow ? "shadow-[0_0_30px_rgba(200,169,110,0.08)]" : ""}
      ${className}
    `}>
      {glow && <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#c8a96e]/5 to-transparent pointer-events-none" />}
      {children}
    </div>
  );
}

// Pulse dot
function PulseDot({ color = "bg-emerald-400" }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

// KPI Card
function KPICard({ kpi, index }: { kpi: KPI; index: number }) {
  const numericValue = parseFloat(kpi.value.replace(/\s/g, ""));
  const isPositive = kpi.change >= 0;

  return (
    <Card glow className="p-6 hover:border-[#c8a96e]/20 transition-all duration-300 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="text-2xl">{kpi.icon}</div>
        