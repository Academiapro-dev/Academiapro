"use client";
import React from "react";

export default function AdminPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ADMIN ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>Dashboard Holding</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0" }}>LLC Wyoming 95% · SAS AcadémIA Pro France · Jacques 5%</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>LLC Wyoming</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Parts SAS : 95% · Compliance : Active</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>Active</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>SAS France</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Jacques 5% · Président irrévocable</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>Active</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Licence Marque</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>LLC facture SAS · 5% du CA</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>5%</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Services Tech</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>LLC facture SAS · 10% du CA</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>10%</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Management Fees</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>LLC facture SAS · 3% du CA</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>3%</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Economie Fiscale</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Optimisation annuelle estimée</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>-- euro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
