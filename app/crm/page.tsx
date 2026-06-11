import React, { useState } from "react";

const data = {
  kpis: [
    { label: "Contacts", value: "2 847", delta: "+12%", icon: "👥", color: "#c8a96e" },
    { label: "Leads", value: "634", delta: "+8%", icon: "🎯", color: "#e8c98e" },
    { label: "Prospects", value: "218", delta: "+23%", icon: "🔍", color: "#c8a96e" },
    { label: "Clients", value: "89", delta: "+5%", icon: "⭐", color: "#e8c98e" },
    { label: "CA Total", value: "1.24M€", delta: "+18%", icon: "💰", color: "#c8a96e" },
    { label: "Pipeline", value: "487K€", delta: "+31%", icon: "📊", color: "#e8c98e" },
  ],
  pipeline: [
    {
      stage: "Nouveau",
      color: "#1a1a2e",
      border: "#c8a96e",
      cards: [
        { name: "Société Dupont", value: "12 000€", contact: "Marc D.", date: "Aujourd'hui" },
        { name: "TechVision SARL", value: "45 000€", contact: "Sophie L.", date: "Hier" },
        { name: "Groupe Mathieu", value: "8 500€", contact: "Pierre M.", date: "Il y a 2j" },
      ],
    },
    {
      stage: "Qualifié",
      color: "#1a1a2e",
      border: "#d4a843",
      cards: [
        { name: "InnovatePro", value: "67 000€", contact: "Alice R.", date: "Il y a 1j" },
        { name: "Médiax Group", value: "23 400€", contact: "Jean-Paul B.", date: "Il y a 3j" },
      ],
    },
    {
      stage: "Proposition",
      color: "#1a1a2e",
      border: "#b8943e",
      cards: [
        { name: "FinanceCore", value: "134 000€", contact: "Nathalie V.", date: "Il y a 2j" },
        { name: "LogiSmart", value: "89 000€", contact: "Thomas G.", date: "Il y a 4j" },
        { name: "RetailPlus", value: "15 600€", contact: "Emma S.", date: "Il y a 5j" },
      ],
    },
    {
      stage: "Négociation",
      color: "#1a1a2e",
      border: "#a07830",
      cards: [
        { name: "BuildCorp", value: "210 000€", contact: "Laurent F.", date: "Il y a 3j" },
        { name: "HealthNet", value: "78 500€", contact: "Carole N.", date: "Il y a 6j" },
      ],
    },
    {
      stage: "Conclu",
      color: "#1a1a2e",
      border: "#6db36d",
      cards: [
        { name: "DataSphere", value: "156 000€", contact: "Michel T.", date: "Aujourd'hui" },
        { name: "CloudBase", value: "43 200€", contact: "Isabelle P.", date: "Hier" },
      ],
    },
  ],
  activites: [
    { type: "📞", text: "Appel avec Marc Dupont - FinanceCore", time: "Il y a 10 min", tag: "Appel" },
    { type: "✉️", text: "Email envoyé à Sophie Laurent - TechVision", time: "Il y a 32 min", tag: "Email" },
    { type: "🤝", text: "Réunion conclue avec DataSphere", time: "Il y a 1h", tag: "Succès" },
    { type: "📝", text: "Proposition envoyée à LogiSmart", time: "Il y a 2h", tag: "Devis" },
    { type: "🔔", text: "Relance Thomas G. planifiée demain", time: "Il y a 3h", tag: "Relance" },
    { type: "📞", text: "Appel entrant BuildCorp - Laurent F.", time: "Il y a 4h", tag: "Appel" },
    { type: "✅", text: "Contrat signé CloudBase 43 200€", time: "Hier 16h30", tag: "Succès" },
    { type: "📊", text: "Présentation Groupe Mathieu validée", time: "Hier 14h00", tag: "Réunion" },
  ],
};

const tagColors: Record<string, string> = {
  Appel: "#1e3a5f",
  Email: "#2d1b4e",
  Succès: "#1a3d2b",
  Devis: "#3d2b1a",
  Relance: "#3d1a1a",
  Réunion: "#1a2d3d",
};

const tagTextColors: Record<string, string> = {
  Appel: "#7eb8f7",
  Email: "#b07ef7",
  Succès: "#6ddb8a",
  Devis: "#f7b07e",
  Relance: "#f77e7e",
  Réunion: "#7ec8f7",
};

export default function CRMDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  const navItems = ["Dashboard", "Contacts", "Leads", "Prospects", "Clients", "Rapports"];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#e8e0d0",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(200,169,110,0.2)",
          backgroundColor: "rgba(5,5,8,0.95)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#050508",
              }}
            >
              C
            </div>
            <span
              style={{
                fontSize: "20px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.5px",
              }}
            >
              CRM Pro
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", gap: "4px" }}>
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeNav === item ? "600" : "400",
                  backgroundColor: activeNav === item ? "rgba(200,169,110,0.15)" : "transparent",
                  color: activeNav === item ? "#c8a96e" : "#888",
                  transition: "all 0.2s",
                }}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#6ddb8a",
                boxShadow: "0 0 8px #6ddb8a",
              }}
            />
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #8a6430)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "600",
                color: "#050508",
                cursor: "pointer",
              }}
            >
              AD
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {/* Page Title */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#e8e0d0",
              margin: "0 0 6px 0",
            }}
          >
            Dashboard
          </h1>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
            Vue d'ensemble de votre pipeline commercial
          </p>
        </div>

        {/* KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {data.kpis.map((kpi, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#0d0d14",
                border: "1px solid rgba(200,169,110,0.15)",
                borderRadius: "16px",
                padding: "20px",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s, border-color 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(200,169,110,0.4)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(200,169,110,0.15)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
                  opacity: 0.6,
                }}
              />
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>{kpi.icon}</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#e8e0d0", marginBottom: "4px" }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>{kpi.label}</div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "rgba(109,219,138,0.1)",
                  color: "#6ddb8a",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "3px 8px",
                  borderRadius: "20px",
                }}
              >
                ↑ {kpi.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline + Activités */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>
          {/* Pipeline Kanban */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#e8e0d0", margin: 0 }}>
                Pipeline Commercial
              </h2>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(200,169,110,0.3)",
                    backgroundColor: "transparent",
                    color: "#c8a96e",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  + Nouvelle opportunité
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
              {data.pipeline.map((col, ci) => (
                <div key={ci}>
                  {/* Column Header */}
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px 10px 0 0",
                      backgroundColor: "#0d0d14",
                      borderTop: "3px solid " + col.border,
                      borderLeft: "1px solid rgba(200,169,110,0.1)",
                      borderRight: "1px solid rgba(200,169,110,0.1)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "2px",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: "600", color: col.border }}>
                      {col.stage}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: "10px",
                        padding: "2px 7px",
                      }}
                    >
                      {col.cards.length}
                    </span>
                  </div>

                  {/* Cards */}