"use client";
import { useState } from "react";

export default function MonEspaceApprenantPage() {
  const [activeTab, setActiveTab] = useState("formations");

  const formations = [
    {
      id: 1,
      titre: "Maîtrise du Leadership",
      progression: 72,
      modules: 12,
      modulesTermines: 9,
      categorie: "Leadership",
      image: "🎯",
      statut: "en_cours",
    },
    {
      id: 2,
      titre: "Communication Stratégique",
      progression: 100,
      modules: 8,
      modulesTermines: 8,
      categorie: "Communication",
      image: "💬",
      statut: "termine",
    },
    {
      id: 3,
      titre: "Gestion du Stress & Performance",
      progression: 35,
      modules: 10,
      modulesTermines: 4,
      categorie: "Bien-être",
      image: "🧘",
      statut: "en_cours",
    },
    {
      id: 4,
      titre: "Intelligence Émotionnelle",
      progression: 0,
      modules: 6,
      modulesTermines: 0,
      categorie: "Développement",
      image: "❤️",
      statut: "nouveau",
    },
  ];

  const certifications = [
    {
      id: 1,
      titre: "Certification Leadership Niveau 2",
      date: "15 Mars 2025",
      formation: "Maîtrise du Leadership",
      statut: "obtenue",
      badge: "🏆",
    },
    {
      id: 2,
      titre: "Certificat Communication Pro",
      date: "02 Février 2025",
      formation: "Communication Stratégique",
      statut: "obtenue",
      badge: "🥇",
    },
    {
      id: 3,
      titre: "Certification Performance",
      date: "En cours",
      formation: "Gestion du Stress & Performance",
      statut: "en_attente",
      badge: "🎖️",
    },
  ];

  const seances = [
    {
      id: 1,
      titre: "Session de coaching individuel",
      date: "Lundi 24 Nov 2025",
      heure: "14h00 - 15h00",
      coach: "Marie Dupont",
      type: "coaching",
      statut: "confirmee",
    },
    {
      id: 2,
      titre: "Atelier Leadership Collectif",
      date: "Mercredi 26 Nov 2025",
      heure: "10h00 - 12h00",
      coach: "Jean Martin",
      type: "atelier",
      statut: "confirmee",
    },
    {
      id: 3,
      titre: "Suivi de progression",
      date: "Vendredi 28 Nov 2025",
      heure: "16h00 - 16h30",
      coach: "Marie Dupont",
      type: "suivi",
      statut: "en_attente",
    },
  ];

  const paiements = [
    {
      id: 1,
      formation: "Intelligence Émotionnelle",
      montant: "490€",
      date: "10 Nov 2025",
      methode: "Carte Visa ****4832",
      statut: "paye",
      facture: "#FAC-2025-089",
    },
    {
      id: 2,
      formation: "Maîtrise du Leadership",
      montant: "890€",
      date: "15 Sep 2025",
      methode: "Virement bancaire",
      statut: "paye",
      facture: "#FAC-2025-067",
    },
    {
      id: 3,
      formation: "Communication Stratégique",
      montant: "590€",
      date: "03 Jan 2025",
      methode: "Carte Visa ****4832",
      statut: "paye",
      facture: "#FAC-2025-012",
    },
  ];

  const tabs = [
    { id: "formations", label: "Formations", icon: "📚" },
    { id: "certifications", label: "Certifications", icon: "🏆" },
    { id: "seances", label: "Séances", icon: "📅" },
    { id: "paiements", label: "Paiements", icon: "💳" },
    { id: "profil", label: "Profil", icon: "👤" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0d0d14 0%, #050508 100%)",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          padding: "0 40px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "28px",
            paddingBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "3px",
                color: "#c8a96e",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Espace Apprenant
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "700",
                color: "#ffffff",
                letterSpacing: "-0.5px",
              }}
            >
              Bonjour, Sophie
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#4ade80",
                boxShadow: "0 0 8px rgba(74,222,128,0.6)",
              }}
            />
            <div
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              En ligne
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #a0845a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "700",
                color: "#050508",
                cursor: "pointer",
              }}
            >
              S
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            gap: "4px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id
                  ? "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))"
                  : "transparent",
                border: "none",
                borderBottom: activeTab === tab.id
                  ? "2px solid #c8a96e"
                  : "2px solid transparent",
                color: activeTab === tab.id ? "#c8a96e" : "rgba(255,255,255,0.45)",
                padding: "14px 20px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? "600" : "400",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                letterSpacing: "0.3px",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px",
        }}
      >
        {activeTab === "formations" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
                marginBottom: "40px",
              }}
            >
              {[
                { label: "Formations achetées", valeur: "4", icon: "📚", couleur: "#c8a96e" },
                { label: "En cours", valeur: "2", icon: "⚡", couleur: "#60a5fa" },
                { label: "Terminées", valeur: "1", icon: "✅", couleur: "#4ade80" },
                { label: "Progression globale", valeur: "52%", icon: "📈", couleur: "#a78bfa" },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                    border: "1px solid rgba(200,169,110,0.12)",
                    borderRadius: "16px",
                    padding: "24px",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "12px" }}>{stat.icon}</div>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "700",
                      color: stat.couleur,
                      marginBottom: "4px",
                    }}
                  >
                    {stat.valeur}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "20px",
                letterSpacing: "0.5px",
              }}
            >
              Mes formations
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {formations.map((f) => (
                <div
                  key={f.id}
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
                    border: "1px solid rgba(200,169,110,0.12)",
                    borderRadius: "16px",
                    padding: "28px",
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))",
                      border: "1px solid rgba(200,169,110,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      flexShrink: 0,
                    }}
                  >
                    {f.image}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#ffffff",
                        }}
                      >
                        {f.titre}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontWeight: "600",
                          letterSpacing: "0.5px",
                          backgroundColor:
                            f.statut === "termine"
                              ? "rgba(74,222,128,0.15)"
                              : f.statut === "nouveau"
                              ? "rgba(96,165,250,0.15)"
                              : "rgba(200,169,110,0.15)",
                          color:
                            f.statut === "termine"
                              ? "#4ade80"
                              : f.statut === "nouveau"
                              ? "#60a5fa"
                              : "#c8a96e",
                          border:
                            f.statut === "termine"
                              ? "1px solid rgba(74,222,128,0.3)"
                              : f.statut === "nouveau"
                              ? "1px solid rgba(96,165,250,0.3)"
                              : "1px solid rgba(200,169,110,0.3)",
                        }}
                      >
                        {f.statut === "termine"
                          ? "TERMINÉ"
                          : f.statut === "nouveau"
                          ? "NOUVEAU"
                          : "EN COURS"}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.4)",
                        marginBottom: "14px",
                      }}
                    >
                      {f.categorie} · {f.modulesTermines}/{f.modules} modules complétés
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: f.progression + "%",
                          background:
                            f.progression === 100
                              ? "linear-gradient(90deg, #4ade80, #22c55e)"
                              : "linear-gradient(90deg, #c8a96e, #a0845a)",
                          borderRadius: "3px",
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: "700",
                        color: f.progression