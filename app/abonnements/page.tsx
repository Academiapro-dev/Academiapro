"use client";

import { useState } from "react";

type Tab = "visio" | "audio";

interface Plan {
  name: string;
  price: number;
  sessions: number;
  badge?: string;
  features: string[];
}

const visioPlans: Plan[] = [
  {
    name: "Starter",
    price: 35,
    sessions: 1,
    features: [
      "1 seance visio par mois",
      "Choix libre de specialite",
      "Sans engagement",
      "Garantie 30 jours",
    ],
  },
  {
    name: "Bien-etre",
    price: 79,
    sessions: 2,
    badge: "BEST-SELLER",
    features: [
      "2 seances visio par mois",
      "2 specialites differentes",
      "Sans engagement",
      "Suivi personnalise inclus",
      "Garantie 30 jours",
    ],
  },
  {
    name: "Intensif",
    price: 129,
    sessions: 4,
    features: [
      "4 seances visio par mois",
      "4 specialites differentes",
      "Sans engagement",
      "Suivi personnalise inclus",
      "Acces prioritaire agenda",
      "Garantie 30 jours",
    ],
  },
];

const audioPlans: Plan[] = [
  {
    name: "Starter",
    price: 25,
    sessions: 1,
    features: [
      "1 seance audio par mois",
      "Choix libre de specialite",
      "Sans engagement",
      "Garantie 30 jours",
    ],
  },
  {
    name: "Bien-etre",
    price: 55,
    sessions: 2,
    badge: "BEST-SELLER",
    features: [
      "2 seances audio par mois",
      "2 specialites differentes",
      "Sans engagement",
      "Suivi personnalise inclus",
      "Garantie 30 jours",
    ],
  },
  {
    name: "Intensif",
    price: 89,
    sessions: 4,
    features: [
      "4 seances audio par mois",
      "4 specialites differentes",
      "Sans engagement",
      "Suivi personnalise inclus",
      "Acces prioritaire agenda",
      "Garantie 30 jours",
    ],
  },
];

export default function AbonnementsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("visio");
  const currentPlans = activeTab === "visio" ? visioPlans : audioPlans;

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>SEANCES THERAPEUTIQUES</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Abonnements Seances</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>
            Sans engagement · Garantie 30 jours · Agent IA 24h/24
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "40px" }}>
          <button
            onClick={() => setActiveTab("visio")}
            style={{
              background: activeTab === "visio" ? "#c8a96e" : "#1a1a2e",
              color: activeTab === "visio" ? "#050508" : "#fff",
              border: "1px solid #c8a96e",
              borderRadius: "8px",
              padding: "10px 24px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Seances Visio
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            style={{
              background: activeTab === "audio" ? "#c8a96e" : "#1a1a2e",
              color: activeTab === "audio" ? "#050508" : "#fff",
              border: "1px solid #c8a96e",
              borderRadius: "8px",
              padding: "10px 24px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Seances Audio
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {currentPlans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: "#1a1a2e",
                borderRadius: "16px",
                padding: "32px",
                border: plan.badge ? "2px solid #c8a96e" : "1px solid rgba(200,169,110,0.3)",
              }}
            >
              {plan.badge && (
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <span style={{ background: "#c8a96e", color: "#050508", padding: "4px 16px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" }}>
                    {plan.badge}
                  </span>
                </div>
              )}
              <h2 style={{ color: "#c8a96e", fontSize: "22px", margin: "0 0 8px" }}>{plan.name}</h2>
              <p style={{ color: "#fff", fontSize: "36px", fontWeight: "bold", margin: "0 0 4px" }}>
                {plan.price}euro
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: "normal" }}>/mois</span>
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 24px" }}>
                {plan.sessions} seance{plan.sessions > 1 ? "s" : ""} par mois
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    ✅ {f}
                  </li>
                ))}
              </ul>
              <button style={{
                width: "100%",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                color: "#050508",
                border: "none",
                borderRadius: "8px",
                padding: "14px",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: "pointer",
              }}>
                Choisir {plan.name} · {plan.price}euro/mois
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
