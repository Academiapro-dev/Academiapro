"use client";
import React from "react";

export default function HoldingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>STRUCTURE INTERNATIONALE</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>Dashboard Holding</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0" }}>LLC Wyoming 95% · SAS AcadémIA Pro France · Jacques 5%</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "28px", border: "1px solid #c8a96e" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 20px" }}>LLC Wyoming</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 8px" }}>Parts SAS France : <strong style={{ color: "#fff" }}>95%</strong></p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 8px" }}>Compliance : <strong style={{ color: "#4caf50" }}>Active</strong></p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0" }}>Agent Wyoming : <strong style={{ color: "#fff" }}>52$/an</strong></p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "28px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 20px" }}>SAS France</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 8px" }}>CA ce mois : <strong style={{ color: "#fff" }}>-- euro</strong></p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 8px" }}>IS estimé : <strong style={{ color: "#fff" }}>-- euro</strong></p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0" }}>Jacques : <strong style={{ color: "#fff" }}>5% · Président</strong></p>
          </div>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "28px", border: "1px solid rgba(200,169,110,0.3)" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 20px" }}>Flux Inter-Sociétés</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#050508", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px" }}>LICENCE MARQUE 5%</p>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0" }}>-- euro</p>
            </div>
            <div style={{ background: "#050508", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px" }}>SERVICES TECH 10%</p>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0" }}>-- euro</p>
            </div>
            <div style={{ background: "#050508", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px" }}>MANAGEMENT FEES 3%</p>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0" }}>-- euro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}