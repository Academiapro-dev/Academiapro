"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function accepter() {
    localStorage.setItem("cookie_consent", "accepte");
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    setVisible(false);
  }

  function refuser() {
    localStorage.setItem("cookie_consent", "refuse");
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d0d1a", borderTop: "1px solid rgba(200,169,110,0.3)", padding: "20px", zIndex: 9999, boxShadow: "0 -4px 20px rgba(0,0,0,0.5)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0, flex: "1 1 400px" }}>
          Nous utilisons des cookies essentiels au fonctionnement du site (session, paiement) et, avec votre accord, des cookies de mesure d audience. En savoir plus dans notre{" "}
          <a href="/politique-cookies" style={{ color: "#c8a96e" }}>Politique de Cookies</a>.
        </p>
        <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={refuser} style={{ padding: "10px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
            Refuser
          </button>
          <button onClick={accepter} style={{ padding: "10px 20px", background: "#c8a96e", border: "none", color: "#050508", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
