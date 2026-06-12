"use client";
import { useState } from "react";

export default function AbonnementsPage() {
  const [onglet, setOnglet] = useState("visio");

  const plans = {
    visio: [
      {
        nom: "Starter",
        prix: "35",
        couleur: "#1a1a2e",
        bordure: "#c8a96e",
        badge: null,
        seances: "2 séances / mois",
        description: "Idéal pour débuter en douceur",
        inclus: ["2 séances vidéo HD", "Support par email", "Accès espace membre", "Annulation flexible"],
      },
      {
        nom: "Bien-être",
        prix: "79",
        couleur: "#1a1a2e",
        bordure: "#c8a96e",
        badge: "BEST-SELLER",
        seances: "5 séances / mois",
        description: "Le choix le plus populaire",
        inclus: ["5 séances vidéo HD", "Support prioritaire", "Accès espace membre", "Ressources exclusives", "Annulation flexible"],
      },
      {
        nom: "Intensif",
        prix: "129",
        couleur: "#1a1a2e",
        bordure: "#c8a96e",
        badge: null,
        seances: "10 séances / mois",
        description: "Pour une transformation profonde",
        inclus: ["10 séances vidéo HD", "Support 7j/7", "Accès espace membre", "Ressources exclusives", "Suivi personnalisé", "Annulation flexible"],
      },
    ],
    audio: [
      {
        nom: "Starter",
        prix: "25",
        couleur: "#1a1a2e",
        bordure: "#c8a96e",
        badge: null,
        seances: "2 séances / mois",
        description: "Idéal pour débuter en douceur",
        inclus: ["2 séances audio", "Support par email", "Accès espace membre", "Annulation flexible"],
      },
      {
        nom: "Bien-être",
        prix: "55",
        couleur: "#1a1a2e",
        bordure: "#c8a96e",
        badge: "BEST-SELLER",
        seances: "5 séances / mois",
        description: "Le choix le plus populaire",
        inclus: ["5 séances audio", "Support prioritaire", "Accès espace membre", "Ressources exclusives", "Annulation flexible"],
      },
      {
        nom: "Intensif",
        prix: "89",
        couleur: "#1a1a2e",
        bordure: "#c8a96e",
        badge: null,
        seances: "10 séances / mois",
        description: "Pour une transformation profonde",
        inclus: ["10 séances audio", "Support 7j/7", "Accès espace membre", "Ressources exclusives", "Suivi personnalisé", "Annulation flexible"],
      },
    ],
  };

  const planActuel = plans[onglet];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", padding: "60px 20px" }}>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "600", letterSpacing: "4px", textTransform: "uppercase" }}>
            Abonnements
          </span>
        </div>

        <h1 style={{ textAlign: "center", color: "#ffffff", fontSize: "42px", fontWeight: "700", margin: "0 0 16px 0", lineHeight: "1.2" }}>
          Choisissez votre formule
        </h1>

        <p style={{ textAlign: "center", color: "#8888aa", fontSize: "17px", margin: "0 0 48px 0", lineHeight: "1.6" }}>
          Sans engagement · Garantie satisfait ou remboursé 30 jours
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "56px" }}>
          <div style={{ backgroundColor: "#0e0e18", borderRadius: "50px", padding: "6px", display: "flex", border: "1px solid #1e1e30" }}>
            <button
              onClick={() => setOnglet("visio")}
              style={{
                backgroundColor: onglet === "visio" ? "#c8a96e" : "transparent",
                color: onglet === "visio" ? "#050508" : "#8888aa",
                border: "none",
                borderRadius: "50px",
                padding: "12px 36px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
                letterSpacing: "0.5px",
              }}
            >
              📹 Visio
            </button>
            <button
              onClick={() => setOnglet("audio")}
              style={{
                backgroundColor: onglet === "audio" ? "#c8a96e" : "transparent",
                color: onglet === "audio" ? "#050508" : "#8888aa",
                border: "none",
                borderRadius: "50px",
                padding: "12px 36px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
                letterSpacing: "0.5px",
              }}
            >
              🎧 Audio
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px", alignItems: "start" }}>
          {planActuel.map((plan, index) => (
            <div
              key={index}
              style={{
                backgroundColor: plan.badge ? "#0a0a14" : "#080810",
                border: plan.badge ? "2px solid #c8a96e" : "1px solid #1e1e2e",
                borderRadius: "24px",
                padding: "40px 32px",
                position: "relative",
                transform: plan.badge ? "scale(1.04)" : "scale(1)",
                boxShadow: plan.badge ? "0 0 60px rgba(200, 169, 110, 0.15)" : "none",
              }}
            >
              {plan.badge && (
                <div style={{
                  position: "absolute",
                  top: "-14px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#c8a96e",
                  color: "#050508",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "2px",
                  padding: "6px 20px",
                  borderRadius: "50px",
                  whiteSpace: "nowrap",
                }}>
                  ★ {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: "28px" }}>
                <h2 style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 10px 0" }}>
                  {plan.nom}
                </h2>
                <p style={{ color: "#666688", fontSize: "14px", margin: "0 0 20px 0" }}>
                  {plan.description}
                </p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", marginBottom: "8px" }}>
                  <span style={{ color: "#ffffff", fontSize: "52px", fontWeight: "800", lineHeight: "1" }}>
                    {plan.prix}€
                  </span>
                  <span style={{ color: "#666688", fontSize: "15px", marginBottom: "8px" }}>/mois</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#12121e", borderRadius: "20px", padding: "6px 14px" }}>
                  <span style={{ color: "#c8a96e", fontSize: "18px" }}>
                    {onglet === "visio" ? "📹" : "🎧"}
                  </span>
                  <span style={{ color: "#aaaacc", fontSize: "13px", fontWeight: "600" }}>
                    {plan.seances}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #1a1a28", paddingTop: "28px", marginBottom: "32px" }}>
                {plan.inclus.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#c8a96e22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                      <span style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "800" }}>✓</span>
                    </div>
                    <span style={{ color: "#aaaacc", fontSize: "14px" }}>{item}</span>
                  </div>
                ))}
              </div>

              <button style={{
                width: "100%",
                backgroundColor: plan.badge ? "#c8a96e" : "transparent",
                color: plan.badge ? "#050508" : "#c8a96e",
                border: plan.badge ? "none" : "1.5px solid #c8a96e",
                borderRadius: "14px",
                padding: "16px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}>
                Commencer maintenant →
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "64px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          <div style={{ backgroundColor: "#080810", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔓</div>
            <h3 style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>Sans engagement</h3>
            <p style={{ color: "#666688", fontSize: "13px", margin: "0", lineHeight: "1.5" }}>Résiliez à tout moment, sans frais ni justification</p>
          </div>
          <div style={{ backgroundColor: "#080810", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🛡️</div>
            <h3 style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>Garantie 30 jours</h3>
            <p style={{ color: "#666688", fontSize: "13px", margin: "0", lineHeight: "1.5" }}>Remboursement intégral si vous n'êtes pas satisfait</p>
          </div>
          <div style={{ backgroundColor: "#080810", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔒</div>
            <h3 style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>Paiement sécurisé</h3>
            <p style={{ color: "#666688", fontSize: "13px", margin: "0", lineHeight: "1.5" }}>Transactions chiffrées SSL, données protégées</p>
          </div>
          <div style={{ backgroundColor: "#080810", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>💬</div>
            <h3 style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>Support dédié</h3>
            <p style={{ color: "#666688", fontSize: "13px", margin: "0", lineHeight: "1.5" }}>Une équipe disponible pour vous accompagner</p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <p style={{ color: "#444466", fontSize: "13px", margin: "0" }}>
            Des questions ? <span style={{ color: "#c8a96e", cursor: "pointer" }}>Contactez-nous</span> · TVA incluse · Facturation mensuelle
          </p>
        </div>

      </div>
    </div>
  );
}