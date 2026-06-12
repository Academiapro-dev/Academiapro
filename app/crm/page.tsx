"use client";
import { useState } from "react";

export default function CRMDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredKanban, setHoveredKanban] = useState(null);

  const kpis = [
    { label: "Contacts", value: "4 821", delta: "+12%", icon: "👥", color: "#c8a96e" },
    { label: "Leads", value: "1 247", delta: "+8%", icon: "🎯", color: "#e8c98e" },
    { label: "Prospects", value: "389", delta: "+5%", icon: "🔍", color: "#c8a96e" },
    { label: "Clients", value: "156", delta: "+3%", icon: "⭐", color: "#e8c98e" },
    { label: "CA Pipeline", value: "2,4M €", delta: "+21%", icon: "💰", color: "#c8a96e" },
    { label: "CA Réalisé", value: "847K €", delta: "+15%", icon: "📈", color: "#e8c98e" },
  ];

  const pipeline = [
    {
      stage: "Nouveaux Leads",
      color: "#1a1a2e",
      border: "#c8a96e",
      count: 24,
      value: "120K €",
      cards: [
        { name: "Groupe Nexus SA", contact: "Marie Dupont", value: "45K €", days: 2 },
        { name: "TechFlow Industries", contact: "Paul Martin", value: "32K €", days: 1 },
        { name: "Meridian Corp", contact: "Sophie Leroy", value: "43K €", days: 3 },
      ],
    },
    {
      stage: "Qualification",
      color: "#1a1a2e",
      border: "#d4a843",
      count: 18,
      value: "340K €",
      cards: [
        { name: "Innovatech SARL", contact: "Jean Bernard", value: "85K €", days: 7 },
        { name: "Apex Solutions", contact: "Clara Morin", value: "120K €", days: 5 },
        { name: "DataSphere Ltd", contact: "Marc Petit", value: "135K €", days: 9 },
      ],
    },
    {
      stage: "Proposition",
      color: "#1a1a2e",
      border: "#b8972a",
      count: 11,
      value: "680K €",
      cards: [
        { name: "Stratégis Group", contact: "Anne Rousseau", value: "210K €", days: 14 },
        { name: "Fusion Dynamics", contact: "Luc Garnier", value: "470K €", days: 11 },
      ],
    },
    {
      stage: "Négociation",
      color: "#1a1a2e",
      border: "#a07820",
      count: 7,
      value: "890K €",
      cards: [
        { name: "Quantum Ventures", contact: "Isabelle Noel", value: "390K €", days: 21 },
        { name: "Pinnacle Holdings", contact: "Thomas Blanc", value: "500K €", days: 18 },
      ],
    },
    {
      stage: "Closing",
      color: "#1a1a2e",
      border: "#c8a96e",
      count: 4,
      value: "370K €",
      cards: [
        { name: "Elysian Partners", contact: "Camille Faure", value: "180K €", days: 30 },
        { name: "Vortex Capital", contact: "Nicolas Roy", value: "190K €", days: 28 },
      ],
    },
  ];

  const activities = [
    { type: "📞", text: "Appel avec Quantum Ventures", contact: "Isabelle Noel", time: "Il y a 12 min", status: "completed" },
    { type: "📧", text: "Email envoyé — proposition commerciale", contact: "Stratégis Group", time: "Il y a 45 min", status: "sent" },
    { type: "🤝", text: "Réunion closing planifiée", contact: "Elysian Partners", time: "Il y a 1h", status: "planned" },
    { type: "📝", text: "Devis mis à jour", contact: "Fusion Dynamics", time: "Il y a 2h", status: "updated" },
    { type: "⭐", text: "Nouveau client signé", contact: "Vortex Capital", time: "Il y a 3h", status: "signed" },
    { type: "🎯", text: "Lead qualifié entrant", contact: "TechFlow Industries", time: "Il y a 4h", status: "new" },
    { type: "📞", text: "Relance téléphonique", contact: "DataSphere Ltd", time: "Il y a 5h", status: "completed" },
    { type: "📧", text: "Suivi proposition en attente", contact: "Apex Solutions", time: "Il y a 6h", status: "pending" },
  ];

  const statusColor = {
    completed: "#c8a96e",
    sent: "#6ea8c8",
    planned: "#8ec86e",
    updated: "#c8a96e",
    signed: "#6ec89a",
    new: "#e8c98e",
    pending: "#c86e6e",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#f0e6d0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d0d18 0%, #0a0a14 100%)", borderBottom: "1px solid #c8a96e33", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #c8a96e, #a07820)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⚡</div>
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#c8a96e", letterSpacing: "0.05em" }}>AURUM CRM</span>
          <span style={{ fontSize: "11px", color: "#c8a96e66", marginLeft: "4px", letterSpacing: "0.1em" }}>ENTERPRISE</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {["dashboard", "contacts", "pipeline", "rapports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ background: activeTab === tab ? "linear-gradient(135deg, #c8a96e22, #c8a96e11)" : "transparent", border: activeTab === tab ? "1px solid #c8a96e55" : "1px solid transparent", color: activeTab === tab ? "#c8a96e" : "#888", padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: activeTab === tab ? "600" : "400", textTransform: "capitalize", letterSpacing: "0.03em", transition: "all 0.2s" }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #1a1a2e, #0d0d18)", border: "1px solid #c8a96e44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", cursor: "pointer" }}>🔔</div>
            <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "10px", height: "10px", background: "#c8a96e", borderRadius: "50%", border: "2px solid #050508" }}></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0d0d18", border: "1px solid #c8a96e22", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #c8a96e, #a07820)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#050508" }}>AD</div>
            <span style={{ fontSize: "13px", color: "#c8a96e" }}>Alexandre D.</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "32px" }}>

        {/* Page Title */}
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: "700", color: "#c8a96e" }}>Tableau de Bord</h1>
            <p style={{ margin: "0", fontSize: "13px", color: "#888", letterSpacing: "0.03em" }}>Vue globale de votre activité commerciale — Mis à jour il y a 3 min</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button style={{ background: "transparent", border: "1px solid #c8a96e44", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              📅 Ce trimestre
            </button>
            <button style={{ background: "linear-gradient(135deg, #c8a96e, #a07820)", border: "none", color: "#050508", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>
              + Nouveau Lead
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px", marginBottom: "28px" }}>
          {kpis.map((kpi, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ background: hoveredCard === i ? "linear-gradient(135deg, #111124 0%, #0d0d1e 100%)" : "linear-gradient(135deg, #0d0d1e 0%, #080810 100%)", border: hoveredCard === i ? "1px solid #c8a96e88" : "1px solid #c8a96e22", borderRadius: "12px", padding: "20px", cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: "0", right: "0", width: "60px", height: "60px", background: "radial-gradient(circle, #c8a96e08 0%, transparent 70%)", borderRadius: "0 12px 0 0" }}></div>
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>{kpi.icon}</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#f0e6d0", marginBottom: "4px" }}>{kpi.value}</div>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>{kpi.label}</div>
              <div style={{ display: "inline-block", fontSize: "11px", fontWeight: "600", color: "#6ec89a", background: "#6ec89a15", padding: "2px 8px", borderRadius: "20px" }}>{kpi.delta} vs trim. préc.</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", marginBottom: "28px" }}>

          {/* Pipeline Chart Visual */}
          <div style={{ background: "linear-gradient(135deg, #0d0d1e 0%, #080810 100%)", border: "1px solid #c8a96e22", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700", color: "#c8a96e" }}>Répartition du Pipeline</h2>
                <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>Valeur par étape de vente</p>
              </div>
              <div style={{ fontSize: "13px", color: "#888" }}>Total : <span style={{ color: "#c8a96e", fontWeight: "700" }}>2,4M €</span></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {pipeline.map((stage, i) => {
                const totalVal = 2400;
                const vals = [120, 340, 680, 890, 370];
                const pct = Math.round((vals[i] / totalVal) * 100);
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", color: "#ccc" }}>{stage.stage}</span>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <span style={{ fontSize: "12px", color: "#888" }}>{stage.count} deals</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#c8a96e" }}>{stage.value}</span>
                        <span style={{ fontSize: "12px", color: "#666" }}>{pct}%</span>
                      </div>
                    </div>