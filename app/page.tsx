import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AcadémIA Pro - Centre de Formation 100% IA",
  description: "Formations professionnelles et séances thérapeutiques avec avatars IA",
};

export default function HomePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <header style={{ padding: "20px 40px", borderBottom: "1px solid rgba(200,169,110,0.3)" }}>
        <h1 style={{ color: "#c8a96e", margin: 0 }}>AcadémIA Pro</h1>
      </header>
      <main style={{ padding: "60px 40px", textAlign: "center" }}>
        <h2 style={{ color: "#c8a96e", fontSize: "2rem" }}>Centre de Formation 100% IA</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.2rem", marginTop: "20px" }}>
          131 formations professionnelles · Séances thérapeutiques avec avatars IA
        </p>
        <div style={{ marginTop: "40px", display: "flex", gap: "20px", justifyContent: "center" }}>
          <a href="/catalogue" style={{ background: "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
            Voir les formations
          </a>
          <a href="/seances" style={{ border: "1px solid #c8a96e", color: "#c8a96e", padding: "14px 28px", borderRadius: "8px", textDecoration: "none" }}>
            Séances thérapeutiques
          </a>
        </div>
      </main>
    </div>
  );
}
