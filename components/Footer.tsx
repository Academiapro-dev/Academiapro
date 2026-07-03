import React from "react";
export default function Footer() {
  return (
    <footer style={{ background: "#050508", borderTop: "1px solid rgba(200,169,110,0.2)", padding: "40px 24px", marginTop: "auto" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px" }}>
        <div>
          <h3 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "12px" }}>AcadémIA Pro</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.6" }}>
            La plateforme de formation propulsée par l IA. 263 formations certifiantes.
          </p>
        </div>
        <div>
          <h4 style={{ color: "#fff", fontSize: "14px", marginBottom: "12px" }}>Formations</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <a href="/formations" style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textDecoration: "none" }}>Catalogue complet</a>
            <a href="/packs" style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textDecoration: "none" }}>Nos packs</a>
            <a href="/skills" style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textDecoration: "none" }}>Skills</a>
          </div>
        </div>
        <div>
          <h4 style={{ color: "#fff", fontSize: "14px", marginBottom: "12px" }}>Légal</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <a href="/cgv" style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textDecoration: "none" }}>CGV</a>
            <a href="/politique-confidentialite" style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textDecoration: "none" }}>Confidentialité</a>
            <a href="/mentions-legales" style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textDecoration: "none" }}>Mentions légales</a>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(200,169,110,0.1)" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>© AcadémIA Pro 2026 — Certification AcadémIA Pro — Tous droits réservés</p>
      </div>
    </footer>
  );
}
