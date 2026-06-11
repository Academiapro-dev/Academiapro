"use client";
import React from "react";

type Agent = {
  id: number;
  name: string;
  role: string;
  status: "active" | "idle" | "offline";
  kpis: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: string;
  };
  lastAction: string;
  lastActionTime: string;
  icon: string;
};

const agents: Agent[] = [
  {
    id: 1,
    name: "Mr Comptable",
    role: "Gestion financière & comptabilité",
    status: "active",
    kpis: { tasksCompleted: 142, successRate: 98, avgResponseTime: "1.2s" },
    lastAction: "Génération bilan mensuel Q4 2024",
    lastActionTime: "il y a 3 min",
    icon: "📊",
  },
  {
    id: 2,
    name: "Mr Juridique",
    role: "Conseil juridique & conformité",
    status: "active",
    kpis: { tasksCompleted: 87, successRate: 96, avgResponseTime: "2.1s" },
    lastAction: "Rédaction contrat prestation de services",
    lastActionTime: "il y a 12 min",
    icon: "⚖️",
  },
  {
    id: 3,
    name: "Agent Marketing",
    role: "Stratégie marketing & communication",
    status: "active",
    kpis: { tasksCompleted: 203, successRate: 94, avgResponseTime: "0.9s" },
    lastAction: "Création campagne LinkedIn automne 2024",
    lastActionTime: "il y a 1 min",
    icon: "📣",
  },
  {
    id: 4,
    name: "Certificateur",
    role: "Certification & validation documents",
    status: "idle",
    kpis: { tasksCompleted: 56, successRate: 100, avgResponseTime: "3.4s" },
    lastAction: "Validation certificat ISO 9001 dossier #4421",
    lastActionTime: "il y a 45 min",
    icon: "🏅",
  },
  {
    id: 5,
    name: "INPI",
    role: "Propriété intellectuelle & dépôts",
    status: "idle",
    kpis: { tasksCompleted: 34, successRate: 99, avgResponseTime: "4.7s" },
    lastAction: "Dépôt marque AcadémIA Pro – classe 41",
    lastActionTime: "il y a 2h",
    icon: "🔏",
  },
  {
    id: 6,
    name: "Tuteur",
    role: "Formation & accompagnement pédagogique",
    status: "active",
    kpis: { tasksCompleted: 318, successRate: 97, avgResponseTime: "0.7s" },
    lastAction: "Session formation module IA générative – 12 apprenants",
    lastActionTime: "il y a 8 min",
    icon: "🎓",
  },
  {
    id: 7,
    name: "Commercial",
    role: "Prospection & gestion commerciale",
    status: "offline",
    kpis: { tasksCompleted: 91, successRate: 89, avgResponseTime: "1.8s" },
    lastAction: "Envoi proposition commerciale client Nextera SAS",
    lastActionTime: "il y a 6h",
    icon: "💼",
  },
];

const statusConfig = {
  active: { label: "Actif", color: "#22c55e", bg: "rgba(34,197,94,0.12)", dot: "#22c55e" },
  idle: { label: "En veille", color: "#c8a96e", bg: "rgba(200,169,110,0.12)", dot: "#c8a96e" },
  offline: { label: "Hors ligne", color: "#6b7280", bg: "rgba(107,114,128,0.12)", dot: "#6b7280" },
};

export default function AdminAgentsPage() {
  const [selected, setSelected] = React.useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null);
  const [hoveredBtn, setHoveredBtn] = React.useState<number | null>(null);

  const totalTasks = agents.reduce((sum, a) => sum + a.kpis.tasksCompleted, 0);
  const avgSuccess =
    Math.round(agents.reduce((sum, a) => sum + a.kpis.successRate, 0) / agents.length);
  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e8e4dc",
        padding: "0",
        margin: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(200,169,110,0.2)",
          background: "rgba(200,169,110,0.03)",
          padding: "24px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 0 20px rgba(200,169,110,0.3)",
            }}
          >
            🤖
          </div>
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#c8a96e",
                letterSpacing: "0.5px",
              }}
            >
              AcadémIA Pro
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
              Console Administration — Agents IA
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
            }}
          />
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>Système opérationnel</span>
        </div>
      </div>

      <div style={{ padding: "36px 40px" }}>
        {/* Page title */}
        <div style={{ marginBottom: "36px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#f5f0e8",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Gestion des Agents
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0" }}>
            Supervision en temps réel de vos 7 agents intelligents spécialisés
          </p>
        </div>

        {/* Global KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          {[
            { label: "Agents actifs", value: activeCount.toString(), suffix: "/ 7", icon: "⚡", color: "#22c55e" },
            { label: "Tâches totales", value: totalTasks.toString(), suffix: "complétées", icon: "✅", color: "#c8a96e" },
            { label: "Taux de succès", value: avgSuccess.toString(), suffix: "% moyen", icon: "📈", color: "#818cf8" },
            { label: "Agents en veille", value: agents.filter((a) => a.status === "idle").length.toString(), suffix: "en attente", icon: "💤", color: "#f59e0b" },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(200,169,110,0.15)",
                borderRadius: "14px",
                padding: "22px 24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: stat.color,
                  opacity: "0.05",
                  transform: "translate(20px, -20px)",
                }}
              />
              <div style={{ fontSize: "22px", marginBottom: "12px" }}>{stat.icon}</div>
              <div style={{ fontSize: "30px", fontWeight: "800", color: stat.color, lineHeight: "1" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{stat.suffix}</div>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "8px", fontWeight: "500" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Agents Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "24px",
          }}
        >
          {agents.map((agent) => {
            const sc = statusConfig[agent.status];
            const isSelected = selected === agent.id;
            const isHovered = hoveredCard === agent.id;

            return (
              <div
                key={agent.id}
                onClick={() => setSelected(isSelected ? null : agent.id)}
                onMouseEnter={() => setHoveredCard(agent.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: isSelected
                    ? "rgba(200,169,110,0.06)"
                    : isHovered
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(255,255,255,0.02)",
                  border: isSelected
                    ? "1px solid rgba(200,169,110,0.5)"
                    : isHovered
                    ? "1px solid rgba(200,169,110,0.3)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  padding: "26px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: isSelected
                    ? "0 0 30px rgba(200,169,110,0.1), inset 0 0 30px rgba(200,169,110,0.03)"
                    : "none",
                }}
              >
                {/* Accent top bar */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "0",
                      right: "0",
                      height: "2px",
                      background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
                    }}
                  />
                )}

                {/* Header Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "14px",
                        background: "rgba(200,169,110,0.1)",
                        border: "1px solid rgba(200,169,110,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "26px",
                        flexShrink: "0" as const,
                      }}
                    >
                      {agent.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#f5f0e8",
                          marginBottom: "4px",
                        }}
                      >
                        {agent.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.4" }}>
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: sc.bg,
                      border: "1px solid",
                      borderColor: sc.color + "30",
                      borderRadius: "20px",
                      padding: "5px 12px",
                      flexShrink: "0" as const,
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: sc.dot,
                        boxShadow: agent.status === "active" ? "0 0 6px " + sc.dot : "none",
                      }}
                    />
                    <span style={{ fontSize: "11px", fontWeight: "600", color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                </div>

                {/* KPIs Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  {[
                    { label: "Tâches", value: agent.kpis.tasksCompleted.toString(), unit: "" },
                    { label: "Succès", value: agent.kpis.successRate.toString(), unit: "%" },
                    { label: "Réponse", value: agent.