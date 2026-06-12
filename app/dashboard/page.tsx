"use client";
import { useState } from "react";

export default function DashboardApprenantPage() {
  const [connecte, setConnecte] = useState(true);
  const [ongletActif, setOngletActif] = useState("formations");

  const formations = [
    { id: 1, titre: "Intelligence Artificielle Fondamentaux", progression: 72, couleur: "#c8a96e", heures: 14, total: 20 },
    { id: 2, titre: "Prompt Engineering Avancé", progression: 45, couleur: "#a07840", heures: 9, total: 20 },
    { id: 3, titre: "Machine Learning Pratique", progression: 18, couleur: "#c8a96e", heures: 4, total: 22 },
  ];

  const certifications = [
    { id: 1, titre: "Certified AI Practitioner", statut: "obtenu", date: "12 Jan 2025", icone: "🏆" },
    { id: 2, titre: "Prompt Master Level 2", statut: "en cours", date: "~Mars 2025", icone: "🎯" },
    { id: 3, titre: "Data Science Essentials", statut: "verrouille", date: "", icone: "🔒" },
  ];

  const seances = [
    { id: 1, titre: "Introduction aux LLMs", duree: "45 min", date: "Aujourd'hui 14h00", type: "video" },
    { id: 2, titre: "Atelier Prompt Engineering", duree: "1h30", date: "Demain 10h00", type: "atelier" },
    { id: 3, titre: "Session Live avec Expert", duree: "2h00", date: "Ven 28 Fév 16h00", type: "live" },
  ];

  const badges = [
    { id: 1, nom: "Premier Pas", icone: "🌟", obtenu: true },
    { id: 2, nom: "Curieux", icone: "🔍", obtenu: true },
    { id: 3, nom: "Assidu", icone: "🔥", obtenu: true },
    { id: 4, nom: "Expert IA", icone: "🤖", obtenu: false },
    { id: 5, nom: "Certifié", icone: "📜", obtenu: true },
    { id: 6, nom: "Mentor", icone: "👑", obtenu: false },
  ];

  const xpTotal = 4820;
  const xpNiveau = 5000;
  const niveau = 12;
  const xpPourcentage = Math.round((xpTotal / xpNiveau) * 100);

  if (!connecte) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050508", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
        <div style={{ textAlign: "center", padding: "60px 40px", backgroundColor: "#0d0d15", border: "1px solid #c8a96e", borderRadius: "16px", maxWidth: "420px", width: "90%" }}>
          <div style={{ fontSize: "56px", marginBottom: "24px" }}>🎓</div>
          <h1 style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "700", marginBottom: "12px", letterSpacing: "1px" }}>Dashboard Apprenant</h1>
          <p style={{ color: "#888", fontSize: "15px", marginBottom: "36px", lineHeight: "1.6" }}>Connectez-vous pour accéder à vos formations, certifications et progressions.</p>
          <button
            onClick={() => setConnecte(true)}
            style={{ backgroundColor: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "14px 40px", fontSize: "16px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.5px", transition: "opacity 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Se connecter
          </button>
          <p style={{ color: "#555", fontSize: "13px", marginTop: "20px" }}>Pas encore de compte ? <span style={{ color: "#c8a96e", cursor: "pointer" }}>Créer un compte</span></p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050508", fontFamily: "Georgia, serif", color: "#e8e8e8" }}>

      {/* HEADER */}
      <div style={{ backgroundColor: "#07070f", borderBottom: "1px solid #1a1a2e", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "70px", position: "sticky", top: "0", zIndex: "100" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", backgroundColor: "#c8a96e", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🎓</div>
          <span style={{ color: "#c8a96e", fontSize: "18px", fontWeight: "700", letterSpacing: "1px" }}>AcademIA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: "20px", padding: "6px 14px" }}>
            <span style={{ fontSize: "14px" }}>⚡</span>
            <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "600" }}>{xpTotal} XP</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "#c8a96e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#050508", fontWeight: "700" }}>A</div>
            <div>
              <p style={{ color: "#e8e8e8", fontSize: "13px", fontWeight: "600", margin: "0" }}>Alex Martin</p>
              <p style={{ color: "#888", fontSize: "11px", margin: "0" }}>Niveau {niveau}</p>
            </div>
          </div>
          <button
            onClick={() => setConnecte(false)}
            style={{ backgroundColor: "transparent", color: "#555", border: "1px solid #1a1a2e", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", cursor: "pointer" }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>

        {/* BIENVENUE + XP */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "24px", alignItems: "start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ color: "#c8a96e", fontSize: "32px", fontWeight: "700", margin: "0 0 6px 0", letterSpacing: "0.5px" }}>Bonjour, Alex 👋</h1>
            <p style={{ color: "#888", fontSize: "15px", margin: "0" }}>Continuez votre progression — vous êtes sur la bonne voie !</p>
          </div>
          <div style={{ backgroundColor: "#0d0d15", border: "1px solid #1a1a2e", borderRadius: "12px", padding: "20px 28px", minWidth: "220px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "600" }}>Niveau {niveau}</span>
              <span style={{ color: "#888", fontSize: "12px" }}>{xpTotal} / {xpNiveau} XP</span>
            </div>
            <div style={{ backgroundColor: "#1a1a2e", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
              <div style={{ width: xpPourcentage + "%", height: "100%", backgroundColor: "#c8a96e", borderRadius: "6px", transition: "width 0.5s ease" }}></div>
            </div>
            <p style={{ color: "#555", fontSize: "11px", margin: "8px 0 0 0", textAlign: "right" }}>{xpNiveau - xpTotal} XP pour le niveau {niveau + 1}</p>
          </div>
        </div>

        {/* STATS RAPIDES */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Formations actives", valeur: "3", icone: "📚", couleur: "#c8a96e" },
            { label: "Certifications", valeur: "1", icone: "🏆", couleur: "#f0c040" },
            { label: "Séances à venir", valeur: "3", icone: "📅", couleur: "#6e9fc8" },
            { label: "Badges obtenus", valeur: "4", icone: "🎖️", couleur: "#c86e9f" },
          ].map(function(stat, i) {
            return (
              <div key={i} style={{ backgroundColor: "#0d0d15", border: "1px solid #1a1a2e", borderRadius: "12px", padding: "24px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ fontSize: "32px" }}>{stat.icone}</div>
                <div>
                  <p style={{ color: stat.couleur, fontSize: "28px", fontWeight: "700", margin: "0", lineHeight: "1" }}>{stat.valeur}</p>
                  <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0 0" }}>{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ONGLETS */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "28px", backgroundColor: "#0d0d15", borderRadius: "10px", padding: "6px", border: "1px solid #1a1a2e", width: "fit-content" }}>
          {[
            { id: "formations", label: "📚 Formations" },
            { id: "certifications", label: "🏆 Certifications" },
            { id: "seances", label: "📅 Séances" },
            { id: "badges", label: "🎖️ Badges" },
            { id: "agent", label: "🤖 Agent IA" },
          ].map(function(onglet) {
            return (
              <button
                key={onglet.id}
                onClick={() => setOngletActif(onglet.id)}
                style={{
                  backgroundColor: ongletActif === onglet.id ? "#c8a96e" : "transparent",
                  color: ongletActif === onglet.id ? "#050508" : "#888",
                  border: "none",
                  borderRadius: "7px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: ongletActif === onglet.id ? "700" : "400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {onglet.label}
              </button>
            );
          })}
        </div>

        {/* CONTENU FORMATIONS */}
        {ongletActif === "formations" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            {formations.map(function(f) {
              return (
                <div key={f.id} style={{ backgroundColor: "#0d0d15", border: "1px solid #1a1a2e", borderRadius: "14px", padding: "28px", transition: "border-color 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#c8a96e"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a2e"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div style={{ width: "44px", height: "44px", backgroundColor: "#1a1a2e", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>📚</div>
                    <span style={{ backgroundColor: "#1a1a2e", color: "#c8a96e", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" }}>{f.progression}%</span>
                  </div>
                  <h3 style={{ color: "#e8e8e8", fontSize: "16px", fontWeight: "600", margin: "0 0 12px 0", lineHeight: "1.4" }}>{f.titre}</h3>
                  <div style={{ backgroundColor: "#1a1a2e", borderRadius: "6px", height: "6px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ width: f.progression + "%", height: "100%", backgroundColor: f.couleur, borderRadius: "6px" }}></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#666", fontSize: "12px" }}>{f.heures}h / {f.total}h complétées</span>
                    <button style={{ backgroundColor: "#c8a96e", color: "#050508", border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                      Continuer →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CONTENU CERTIFICATIONS */}