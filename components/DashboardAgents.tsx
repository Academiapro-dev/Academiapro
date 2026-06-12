"use client";
import React, { useState } from "react";

// ============================================================
// TYPES
// ============================================================
interface AgentKPI {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

interface AgentAction {
  time: string;
  description: string;
  type: "success" | "warning" | "info";
}

interface AgentAlert {
  level: "high" | "medium" | "low";
  message: string;
}

interface AgentData {
  name: string;
  role: string;
  avatarInitials: string;
  kpis: AgentKPI[];
  lastActions: AgentAction[];
  alerts: AgentAlert[];
}

interface CollaborationItem {
  time: string;
  description: string;
  agents: string[];
}

interface NightSummaryItem {
  category: string;
  actions: string[];
  requiresAction?: boolean;
}

interface DashboardProps {
  dataMrComptable?: Partial<AgentData>;
  dataMrJuridique?: Partial<AgentData>;
}

// ============================================================
// DEFAULT DATA
// ============================================================
const defaultComptableData: AgentData = {
  name: "Mr Comptable",
  role: "Agent Comptabilité & Finance",
  avatarInitials: "MC",
  kpis: [
    { label: "Factures traitées", value: "247", trend: "+12 aujourd'hui", trendUp: true },
    { label: "Rapprochement bancaire", value: "98.4%", trend: "+0.3%", trendUp: true },
    { label: "Déclarations TVA", value: "4/4", trend: "À jour", trendUp: true },
    { label: "Écritures en attente", value: "3", trend: "-8 vs hier", trendUp: true },
  ],
  lastActions: [
    { time: "08:42", description: "Lettrage automatique 34 écritures OFX", type: "success" },
    { time: "08:15", description: "Déclaration TVA T3 préparée — 12 847 €", type: "success" },
    { time: "07:58", description: "Facture fournisseur DELTA anormale détectée", type: "warning" },
    { time: "07:30", description: "Clôture journée comptable J-1 effectuée", type: "success" },
    { time: "06:15", description: "Synchronisation EBP Compta terminée", type: "info" },
  ],
  alerts: [
    { level: "high", message: "Facture DELTA GROUP — montant 3x supérieur à la moyenne" },
    { level: "medium", message: "Échéance règlement DUPONT & Associés — J+3" },
    { level: "low", message: "Provision amortissements Q4 à valider" },
  ],
};

const defaultJuridiqueData: AgentData = {
  name: "Mr Juridique",
  role: "Agent Juridique & Compliance",
  avatarInitials: "MJ",
  kpis: [
    { label: "Documents générés", value: "18", trend: "+5 ce mois", trendUp: true },
    { label: "Compliance Holding", value: "94%", trend: "+2%", trendUp: true },
    { label: "Veille réglementaire", value: "12 alertes", trend: "3 critiques", trendUp: false },
    { label: "Contrats actifs", value: "31", trend: "2 à renouveler", trendUp: false },
  ],
  lastActions: [
    { time: "08:38", description: "CGV e-commerce mises à jour — RGPD 2024", type: "success" },
    { time: "08:20", description: "Statuts SAS Jacques Martin — v3 finalisée", type: "success" },
    { time: "07:55", description: "Veille : nouvelle directive EU fiscalité numérique", type: "info" },
    { time: "07:40", description: "Contrat prestataire TECHSOFT analysé — 2 clauses suspectes", type: "warning" },
    { time: "06:00", description: "Registre des bénéficiaires effectifs synchronisé", type: "success" },
  ],
  alerts: [
    { level: "high", message: "Contrat TECHSOFT — clause limitation responsabilité abusive" },
    { level: "high", message: "Renouvellement bail commercial SCI MARTIN — expire dans 45 j" },
    { level: "medium", message: "Assemblée Générale Annuelle à planifier avant 30/06" },
  ],
};

const collaborationItems: CollaborationItem[] = [
  {
    time: "08:45",
    description: "Optimisation fiscale Q4 — montages holding SCI analysés conjointement",
    agents: ["MC", "MJ"],
  },
  {
    time: "08:10",
    description: "Contrat DELTA GROUP — vérification comptable + juridique simultanée",
    agents: ["MC", "MJ"],
  },
  {
    time: "07:30",
    description: "Plan d'intéressement salarié — simulation fiscale + rédaction accord",
    agents: ["MC", "MJ"],
  },
];

const nightSummary: NightSummaryItem[] = [
  {
    category: "Comptabilité",
    actions: [
      "247 écritures traitées et lettrées automatiquement",
      "Rapprochement bancaire 3 comptes validé à 98.4%",
      "Déclaration TVA T3 préparée — solde créditeur 2 341 €",
    ],
  },
  {
    category: "Juridique",
    actions: [
      "Mise à jour CGV suite nouvelle directive RGPD",
      "Analyse 3 nouveaux contrats fournisseurs",
      "Veille réglementaire : 12 nouvelles publications BOFIP",
    ],
  },
  {
    category: "Actions requises",
    requiresAction: true,
    actions: [
      "Valider facture DELTA GROUP — montant anormal 8 450 €",
      "Signer contrat TECHSOFT après correction clause 7.3",
      "Approuver déclaration TVA T3 avant envoi DGFiP",
    ],
  },
];

// ============================================================
// SUB-COMPONENTS
// ============================================================

const GoldBadge: React.FC<{ text: string }> = ({ text }) => (
  <span
    className="text-xs font-semibold px-2 py-0.5 rounded-full"
    style={{ backgroundColor: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)" }}
  >
    {text}
  </span>
);

const ActiveStatus: React.FC = () => (
  <div className="flex items-center gap-1.5">
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
    <span className="text-xs text-emerald-400 font-medium">Actif</span>
  </div>
);

const AlertDot: React.FC<{ level: "high" | "medium" | "low" }> = ({ level }) => {
  const colors = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-blue-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors[level]}`} />;
};

const ActionTypeDot: React.FC<{ type: "success" | "warning" | "info" }> = ({ type }) => {
  const colors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    info: "bg-blue-400",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${colors[type]}`} />;
};

const AgentAvatar: React.FC<{ initials: string; color: string }> = ({ initials, color }) => (
  <div
    className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg"
    style={{
      background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)`,
      border: `2px solid ${color}55`,
      color: color,
    }}
  >
    {initials}
  </div>
);

const SectionCard: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className = "",
  style,
}) => (
  <div
    className={`rounded-2xl p-5 ${className}`}
    style={{
      backgroundColor: "#0d0d14",
      border: "1px solid rgba(200,169,110,0.12)",
      ...style,
    }}
  >
    {children}
  </div>
);

const KPICard: React.FC<{ kpi: AgentKPI }> = ({ kpi }) => (
  <div
    className="rounded-xl p-3.5"
    style={{
      backgroundColor: "#070710",
      border: "1px solid rgba(200,169,110,0.08)",
    }}
  >
    <p className="text-xs text-gray-500 mb-1 font-medium">{kpi.label}</p>
    <p className="text-xl font-bold text-white mb-1">{kpi.value}</p>
    {kpi.trend && (
      <p className={`text-xs font-medium ${kpi.trendUp ? "text-emerald-400" : "text-amber-400"}`}>
        {kpi.trendUp ? "↑" : "↓"} {kpi.trend}
      </p>
    )}
  </div>
);

// ============================================================
// AGENT PANEL
// ============================================================
const AgentPanel: React.FC<{ data: AgentData; accentColor: string }> = ({ data, accentColor }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <SectionCard className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <AgentAvatar initials={data.avatarInitials} color={accentColor} />
          <div>
            <h3 className="text-white font-bold text-base leading-tight">{data.name}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{data.role}</p>
            <div className="mt-1.5">
              <ActiveStatus />
            </div>
          </div>
        </div>
        <GoldBadge text="IA Pro" />
      </div>

      {/* KPIs */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Indicateurs clés</p>
        <div className="grid grid-cols-2 gap-2">
          {data.kpis.map((kpi, i) => (
            <KPICard key={i} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* Last Actions */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Dernières actions</p>
        <div className="space-y-2">
          {data.lastActions.slice(0, expanded ? undefined : 3).map((action, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <ActionTypeDot type={action.type} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 leading-snug truncate">{action.description}</p>
              </div>
              <span className="text-xs text-gray-600 flex-shrink-0">{action.time}</span>
            </div>
          ))}
        </div>
        {data.lastActions.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs mt-2 font-medium transition-colors"
            style={{ color: accentColor }}
          >
            {expanded ? "Réduire ↑" : `+${data.lastActions.length - 3} actions ↓`}
          </button>
        )}
      </div>

      {/* Alerts */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Alertes{" "}
          {data.alerts.filter((a) => a.level === "high").length > 0 && (
            <span className="text-red-400">
              ({data.alerts.filter((a) => a.level === "high").length} critiques)
            </span>
          )}
        </p>
        <div className="space-y-2">
          {data.alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <AlertDot level={alert.level} />
              <p className="text-xs text-gray-400 leading-snug">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}11)`,
          border: `1px solid ${accentColor}44`,
          color: accentColor,
        }}
      >
        Voir dashboard complet →
      </button>
    </SectionCard>
  );
};

// ============================================================
// COLLABORATION FLUX
// ============================================================
const CollaborationFlux: React.FC = () => (
  <SectionCard>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "rgba(200,169,110,0.15)" }}
        >
          <span style={{ color: "#c8a96e" }}>⚡</span>
        </div>
        <h3 className="text-white font-bold text-sm">Collaboration Temps Réel</h3>
      </div>
      <span className="flex items-center gap-1.5">
        <span className="relative flex