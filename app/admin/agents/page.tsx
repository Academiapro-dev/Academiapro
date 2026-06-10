"use client";

import { useState } from "react";

interface Agent {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  domains: string[];
  status: "active" | "idle" | "processing" | "alert";
  lastAction: string;
  kpis: { label: string; value: string }[];
  color: string;
}

const agents: Agent[] = [
  {
    id: "comptable",
    name: "Mr Comptable",
    subtitle: "Expert-Comptable IA",
    icon: "📊",
    domains: ["Comptabilité", "Fiscalité", "URSSAF", "Rapprochement bancaire"],
    status: "active",
    lastAction: "Rapprochement bancaire novembre — il y a 12 min",
    kpis: [
      { label: "Écritures ce mois", value: "1 247" },
      { label: "Économie fiscale", value: "€ 8 340" },
      { label: "Déclarations", value: "3 / 3" },
    ],
    color: "#4ade80",
  },
  {
    id: "juridique",
    name: "Mr Juridique",
    subtitle: "Avocat International IA",
    icon: "⚖️",
    domains: ["Holding LLC", "SAS", "Documents", "Compliance"],
    status: "processing",
    lastAction: "Rédaction statuts SAS filiale — en cours",
    kpis: [
      { label: "Documents générés", value: "34" },
      { label: "Contrats actifs", value: "12" },
      { label: "Compliance", value: "98 %" },
    ],
    color: "#60a5fa",
  },
  {
    id: "marketing",
    name: "Agent Marketing",
    subtitle: "Growth & Acquisition IA",
    icon: "📈",
    domains: ["Réseaux sociaux", "Google Ads", "Meta Ads", "Contenu"],
    status: "active",
    lastAction: "Campagne Meta optimisée — il y a 4 min",
    kpis: [
      { label: "CA généré", value: "€ 24 780" },
      { label: "ROAS moyen", value: "× 4.2" },
      { label: "Posts publiés", value: "18" },
    ],
    color: "#f472b6",
  },
  {
    id: "certificateur",
    name: "Agent Certificateur",
    subtitle: "Certification & Validation IA",
    icon: "🎓",
    domains: ["Certificats", "QR Codes", "LinkedIn", "Vérification"],
    status: "active",
    lastAction: "14 certificats émis — il y a 2 min",
    kpis: [
      { label: "Certificats délivrés", value: "1 892" },
      { label: "Vérifications", value: "347" },
      { label: "Taux validité", value: "100 %" },
    ],
    color: "#a78bfa",
  },
  {
    id: "inpi",
    name: "Agent INPI",
    subtitle: "Propriété Intellectuelle IA",
    icon: "🔏",
    domains: ["Surveillance marque", "Dépôts", "Renouvellements"],
    status: "alert",
    lastAction: "⚠ Alerte similarité marque détectée — 34 min",
    kpis: [
      { label: "Marques surveillées", value: "7" },
      { label: "Alertes actives", value: "1" },
      { label: "Renouvellements", value: "0 / 2" },
    ],
    color: "#fb923c",
  },
  {
    id: "tuteur",
    name: "Agent Tuteur IA",
    subtitle: "Accompagnement 24h/24",
    icon: "🤖",
    domains: ["Questions apprenants", "Progression", "Support"],
    status: "active",
    lastAction: "284 interactions aujourd'hui — continu",
    kpis: [
      { label: "Apprenants actifs", value: "1 340" },
      { label: "Satisfaction", value: "97 %" },
      { label: "Interactions/j", value: "284" },
    ],
    color: "#34d399",
  },
  {
    id: "commercial",
    name: "Agent Commercial",
    subtitle: "Sales & Conversion IA",
    icon: "💼",
    domains: ["Prospects", "Relances", "Upsell", "Tunnel vente"],
    status: "processing",
    lastAction: "Séquence relance J+3 envoyée — il y a 8 min",
    kpis: [
      { label: "Leads qualifiés", value: "89" },
      { label: "Taux conversion", value: "14.3 %" },
      { label: "CA généré", value: "€ 31 200" },
    ],
    color: "#fbbf24",
  },
];

const globalKPIs = [
  { label: "Actions aujourd'hui", value: "2 847", icon: "⚡", sub: "Toutes IA confondues" },
  { label: "CA total généré", value: "€ 64 320", icon: "💰", sub: "Agents IA ce mois" },
  { label: "Économie fiscale", value: "€ 8 340", icon: "🧾", sub: "Optimisation Mr Comptable" },
  { label: "Documents traités", value: "312", icon: "📁", sub: "Juridique + Certificateur" },
  { label: "Apprenants accompagnés", value: "1 340", icon: "🎓", sub: "Tuteur IA actif 24h/24" },
  { label: "Alertes actives", value: "1", icon: "🔔", sub: "INPI — action requise" },
];

const statusConfig = {
  active: { label: "Actif", color: "text-emerald-400", dot: "bg-emerald-400", ring: "ring-emerald-400/30" },
  idle: { label: "En veille", color: "text-gray-400", dot: "bg-gray-400", ring: "ring-gray-400/20" },
  processing: { label: "En cours", color: "text-blue-400", dot: "bg-blue-400 animate-pulse", ring: "ring-blue-400/30" },
  alert: { label: "Alerte", color: "text-orange-400", dot: "bg-orange-400 animate-pulse", ring: "ring-orange-400/30" },
};

export default function AgentsDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#050508", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── HEADER ── */}
      <header className="border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(5,5,8,0.92)" }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)" }}>
              A
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight leading-none">
                AcadémIA <span style={{ color: "#c8a96e" }}>Pro</span>
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "#c8a96e99" }}>
                Centre de Commande IA — Jacques
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ backgroundColor: "#0f0f14", border: "1px solid #c8a96e22", color: "#c8a96e" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              7 agents opérationnels
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border"
              style={{ backgroundColor: "#1a1408", borderColor: "#c8a96e44", color: "#c8a96e" }}>
              J
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-10">

        {/* ── PAGE TITLE ── */}
        <section className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Tableau de Bord{" "}
              <span style={{ color: "#c8a96e" }}>Central</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium"
              style={{ backgroundColor: "#c8a96e15", color: "#c8a96e", border: "1px solid #c8a96e30" }}>
              LIVE
            </span>
          </div>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Supervision et pilotage de tous vos agents IA en temps réel
          </p>
        </section>

        {/* ── GLOBAL KPIs ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#c8a96e" }} />
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
              Rapport Global Agents
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {globalKPIs.map((kpi, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 transition-all duration-300 hover:scale-105 cursor-default"
                style={{
                  backgroundColor: "#0a0a0f",
                  border: "1px solid #ffffff08",
                  boxShadow: "0 0 0 0 transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = "1px solid #c8a96e33";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 24px #c8a96e0a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = "1px solid #ffffff08";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 0 transparent";
                }}
              >
                <div className="text-2xl mb-2">{kpi.icon}</div>
                <div className="text-xl font-bold text-white leading-none mb-1">
                  {kpi.value}
                </div>
                <div className="text-xs font-medium mb-0.5" style={{ color: "#c8a96e" }}>
                  {kpi.label}
                </div>
                <div className="text-xs" style={{ color: "#4b5563" }}>
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── AGENTS GRID ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#c8a96e" }} />
              <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                Agents IA Actifs
              </h3>
            </div>
            <span className="text-xs" style={{ color: "#4b5563" }}>
              {agents.length} agents déployés
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {agents.map((agent) => {
              const st = statusConfig[agent.status];
              const isHovered = hoveredAgent === agent.id;
              return (
                <div
                  key={agent.id}
                  className="rounded-2xl p-5 cursor-pointer transition-all duration-300 group relative overflow-hidden"
                  style={{
                    backgroundColor: "#0a0a0f",
                    border: isHovered
                      ? `1px solid ${agent.color}44`
                      : "1px solid #ffffff08",
                    boxShadow: isHovered
                      ? `0 0 32px ${agent.color}0d, inset 0 0 32px ${agent.color}04`
                      : "none",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                  }}
                  onMouseEnter={() => setHoveredAgent(agent.id)}
                  onMouseLeave={() => setHoveredAgent(null)}
                  onClick={() => setSelectedAgent(agent)}
                >
                  {/* Glow orb background */}
                  <div
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ backgroundColor: `${agent.color}1a` }}
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 relative">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
                      >
                        {agent.icon}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm leading-tight">
                          {agent.name}
                        </h4>
                        <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>