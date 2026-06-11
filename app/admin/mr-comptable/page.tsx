"use client";
import React from "react";

const Dashboard: React.FC = () => {
  const kpis = [
    { label: "Chiffre d'Affaires", value: "48 250 €", trend: "+12%", color: "#c8a96e" },
    { label: "Charges", value: "18 430 €", trend: "-3%", color: "#e05c5c" },
    { label: "Bénéfice Net", value: "29 820 €", trend: "+18%", color: "#5ce0a0" },
    { label: "TVA Collectée", value: "9 650 €", trend: "+12%", color: "#c8a96e" },
    { label: "URSSAF", value: "6 210 €", trend: "À jour", color: "#5ce0a0" },
  ];

  const invoices = [
    { id: "FAC-2024-089", client: "Acme Corp", amount: "3 400 €", date: "15/01/2025", status: "Payée" },
    { id: "FAC-2024-090", client: "Dupont SARL", amount: "1 800 €", date: "20/01/2025", status: "En attente" },
    { id: "FAC-2024-091", client: "TechStart SAS", amount: "5 200 €", date: "22/01/2025", status: "En retard" },
    { id: "FAC-2024-092", client: "Globe Media", amount: "2 750 €", date: "28/01/2025", status: "Payée" },
  ];

  const expenses = [
    { desc: "Abonnement logiciel", category: "IT", amount: "120 €", date: "05/01/2025" },
    { desc: "Déplacement client Lyon", category: "Transport", amount: "340 €", date: "10/01/2025" },
    { desc: "Fournitures bureau", category: "Bureau", amount: "85 €", date: "12/01/2025" },
    { desc: "Repas professionnel", category: "Restauration", amount: "95 €", date: "14/01/2025" },
  ];

  const deadlines = [
    { label: "Déclaration TVA mensuelle", date: "24 Jan 2025", urgent: true },
    { label: "Paiement URSSAF T4", date: "31 Jan 2025", urgent: true },
    { label: "Bilan comptable annuel", date: "15 Mar 2025", urgent: false },
    { label: "Déclaration IS", date: "30 Apr 2025", urgent: false },
  ];

  const reconciliation = [
    { ref: "VIR-001", bank: "3 400 €", book: "3 400 €", status: "OK" },
    { ref: "VIR-002", bank: "1 800 €", book: "1 800 €", status: "OK" },
    { ref: "CHQ-045", bank: "500 €", book: "550 €", status: "Écart" },
    { ref: "VIR-003", bank: "2 750 €", book: "—", status: "Manquant" },
  ];

  const statusColor = (s: string) => {
    if (s === "Payée" || s === "OK") return "#5ce0a0";
    if (s === "En attente") return "#c8a96e";
    if (s === "En retard" || s === "Écart" || s === "Manquant") return "#e05c5c";
    return "#ffffff";
  };

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "#e8e0d0",
        padding: "0",
        margin: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#0a0a10",
          borderBottom: "1px solid #c8a96e33",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          position: "sticky",
          top: "0",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #c8a96e, #9a7a40)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            ◈
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#c8a96e", letterSpacing: "0.5px" }}>
              Mr Comptable
            </div>
            <div style={{ fontSize: "10px", color: "#c8a96e99", letterSpacing: "2px", textTransform: "uppercase" }}>
              AcadémIA Pro
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ fontSize: "12px", color: "#888", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#5ce0a0", fontSize: "8px" }}>●</span>
            IA Active
          </div>
          <div
            style={{
              backgroundColor: "#c8a96e22",
              border: "1px solid #c8a96e55",
              borderRadius: "20px",
              padding: "6px 16px",
              fontSize: "12px",
              color: "#c8a96e",
              cursor: "pointer",
            }}
          >
            Exercice 2025
          </div>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e44, #c8a96e22)",
              border: "1px solid #c8a96e55",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            👤
          </div>
        </div>
      </div>

      {/* Nav */}
      <div
        style={{
          backgroundColor: "#080810",
          borderBottom: "1px solid #ffffff0a",
          padding: "0 32px",
          display: "flex",
          gap: "4px",
        }}
      >
        {["Tableau de bord", "Factures", "Charges", "Déclarations", "Rapports IA"].map((nav, i) => (
          <div
            key={nav}
            style={{
              padding: "14px 20px",
              fontSize: "13px",
              color: i === 0 ? "#c8a96e" : "#666",
              borderBottom: i === 0 ? "2px solid #c8a96e" : "2px solid transparent",
              cursor: "pointer",
              transition: "color 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {nav}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Title */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "600",
              color: "#e8e0d0",
              margin: "0 0 4px 0",
            }}
          >
            Tableau de bord
          </h1>
          <p style={{ margin: "0", fontSize: "13px", color: "#555" }}>
            Janvier 2025 · Synthèse comptable en temps réel
          </p>
        </div>

        {/* KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                backgroundColor: "#0d0d16",
                border: "1px solid #ffffff0d",
                borderRadius: "12px",
                padding: "20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  right: "0",
                  height: "2px",
                  background: kpi.color,
                  opacity: 0.8,
                }}
              />
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#e8e0d0", marginBottom: "8px" }}>
                {kpi.value}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: kpi.color + "18",
                  border: "1px solid " + kpi.color + "44",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  color: kpi.color,
                }}
              >
                {kpi.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Invoices + Deadlines */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {/* Invoices */}
          <div
            style={{
              backgroundColor: "#0d0d16",
              border: "1px solid #ffffff0d",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #ffffff08",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "#c8a96e", fontSize: "16px" }}>◎</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#e8e0d0" }}>Factures récentes</span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#c8a96e",
                  cursor: "pointer",
                  backgroundColor: "#c8a96e15",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  border: "1px solid #c8a96e33",
                }}
              >
                + Nouvelle facture
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#0a0a12" }}>
                  {["Référence", "Client", "Montant", "Date", "Statut"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 22px",
                        textAlign: "left",
                        fontSize: "11px",
                        color: "#555",
                        fontWeight: "500",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr
                    key={inv.id}
                    style={{
                      borderTop: "1px solid #ffffff06",
                      backgroundColor: i % 2 === 0 ? "transparent" : "#0a0a1000",
                    }}
                  >
                    <td style={{ padding: "13px 22px", fontSize: "12px", color: "#c8a96e", fontFamily: "monospace" }}>
                      {inv.id}
                    </td>
                    <td style={{ padding: "13px 22px", fontSize: "13px", color: "#ccc" }}>{inv.client}</td>
                    <td style={{ padding: "13px 22px", fontSize: "13px", color: "#e8e0d0", fontWeight: "600" }}>
                      {inv.amount}
                    </td>
                    <td style={{ padding: "13px 22px", fontSize: "12px", color: "#666" }}>{inv.date}</td>
                    <td style={{ padding: "13px 22px" }}>
                      <span
                        style={{
                          backgroundColor: statusColor(inv.status) + "18",
                          border: "1px solid " + statusColor(inv.status) + "44",
                          color: statusColor(inv.status),
                          fontSize: "11px",
                          padding: "3px 10px",
                          borderRadius: "20px",
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deadlines */}
          <div
            style={{
              backgroundColor: "#0d0d16",
              border: "1px solid #ffffff0d",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #ffffff08",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ color: "#e05c5c", fontSize: "16px" }}>⏰</span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#e8e0d0" }}>Échéances fiscales</span>
            </div>
            <div style={{ padding: "12px" }}>
              {deadlines.map((d) => (
                <div
                  key={d.label}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: d.urgent ? "#e05c5c08" : "transparent",
                    border: d.urgent ? "1px solid