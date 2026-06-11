"use client";
import React from "react";

export default function AdminPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ADMIN ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>Mr Comptable</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0" }}>Agent IA Comptable · Fiscal · Bancaire · Automatique</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>CA Ce Mois</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Chiffre affaires mensuel</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0 euro</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Charges</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Total charges ce mois</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0 euro</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Bénéfice</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Bénéfice brut ce mois</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0 euro</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>TVA à Payer</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Prochaine échéance TVA</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0 euro</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>URSSAF</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Prochaine déclaration</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0 euro</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Factures</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Reçues et traitées ce mois</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
