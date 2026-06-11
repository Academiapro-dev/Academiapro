"use client";
import React from "react";

export default function AdminPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ADMIN ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>Certificats</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0" }}>Gestion certifications · 4 niveaux · QR Code · LinkedIn</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Total Certificats</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Délivrés depuis lancement</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Ce Mois</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Certificats délivrés ce mois</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Attestations</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Niveau 1</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Certifiés</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Niveau 2 · score 70%+</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Experts</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Niveau 3 · score 85%+</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0</p>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
            <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Masters</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>Niveau 4 · pack complet</p>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
