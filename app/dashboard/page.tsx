import React from "react";
import { useState } from "react";

const mockUser = {
  name: "Sophie Martin",
  avatar: "SM",
  xp: 3240,
  level: 12,
  connected: true,
};

const mockFormations = [
  { id: 1, title: "React Avancé", progress: 72, total: 24, done: 17, color: "#c8a96e" },
  { id: 2, title: "TypeScript Pro", progress: 45, total: 18, done: 8, color: "#9b7fd4" },
  { id: 3, title: "Node.js & API", progress: 90, total: 12, done: 11, color: "#4ecdc4" },
];

const mockCertifications = [
  { id: 1, title: "Développeur Frontend", date: "12 Jan 2025", icon: "🏆" },
  { id: 2, title: "Expert CSS", date: "03 Mar 2025", icon: "🎖️" },
];

const mockSeances = [
  { id: 1, title: "Hooks avancés React", date: "Aujourd'hui 14h00", status: "upcoming" },
  { id: 2, title: "Generics TypeScript", date: "Demain 10h00", status: "upcoming" },
  { id: 3, title: "REST vs GraphQL", date: "20 Juin 16h00", status: "scheduled" },
];

const mockBadges = [
  { id: 1, icon: "⚡", label: "Speed Coder" },
  { id: 2, icon: "🔥", label: "7 jours streak" },
  { id: 3, icon: "🧠", label: "Problem Solver" },
  { id: 4, icon: "🌟", label: "Top 10%" },
  { id: 5, icon: "🤝", label: "Collaborateur" },
];

const mockMessages = [
  { id: 1, from: "Agent IA", text: "Bravo Sophie ! Tu progresses très vite en React. Je recommande de pratiquer les custom hooks ce soir.", time: "Il y a 2h" },
  { id: 2, from: "Agent IA", text: "Nouvelle séance TypeScript disponible. Ton niveau actuel est parfait pour aborder les Generics.", time: "Hier" },
];

export default function Dashboard() {
  const [user] = useState(mockUser);
  const [aiInput, setAiInput] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [activeTab, setActiveTab] = useState("formations");

  const handleSendMessage = () => {
    if (!aiInput.trim()) return;
    setMessages([
      ...messages,
      { id: messages.length + 1, from: "Vous", text: aiInput, time: "À l'instant" },
      { id: messages.length + 2, from: "Agent IA", text: "Je prends en compte ta question et je prépare une réponse personnalisée pour toi.", time: "À l'instant" },
    ]);
    setAiInput("");
  };

  if (!user.connected) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎓</div>
          <h1 style={{ color: "#c8a96e", fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>LearnSpace</h1>
          <p style={{ color: "#888", marginBottom: "32px" }}>Votre plateforme d'apprentissage intelligente</p>
          <button style={{ background: "linear-gradient(135deg, #c8a96e, #a8853e)", color: "#050508", border: "none", borderRadius: "12px", padding: "14px 36px", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const xpPercent = ((user.xp % 500) / 500) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Segoe UI', sans-serif", color: "#e8e8e8" }}>

      {/* HEADER */}
      <div style={{ background: "rgba(200,169,110,0.06)", borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "0 24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🎓</span>
            <span style={{ color: "#c8a96e", fontSize: "20px", fontWeight: 700, letterSpacing: "1px" }}>LearnSpace</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#c8a96e", fontSize: "14px" }}>⚡</span>
              <span style={{ color: "#c8a96e", fontSize: "14px", fontWeight: 600 }}>{user.xp} XP</span>
            </div>
            <div style={{ background: "linear-gradient(135deg, #c8a96e, #a8853e)", borderRadius: "50%", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#050508", fontSize: "14px" }}>
              {user.avatar}
            </div>
            <span style={{ color: "#c8a96e", fontWeight: 600 }}>{user.name}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>

        {/* HERO STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>

          {/* XP / Level */}
          <div style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "1px" }}>Niveau</p>
                <p style={{ color: "#c8a96e", fontSize: "32px", fontWeight: 800, margin: 0 }}>{user.level}</p>
              </div>
              <span style={{ fontSize: "32px" }}>⚡</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", height: "6px", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(90deg, #c8a96e, #f0d090)", height: "100%", width: xpPercent + "%", borderRadius: "8px", transition: "width 0.5s ease" }} />
            </div>
            <p style={{ color: "#888", fontSize: "11px", margin: "6px 0 0 0" }}>{user.xp % 500}/500 XP vers niveau {user.level + 1}</p>
          </div>

          {/* Formations */}
          <div style={{ background: "linear-gradient(135deg, rgba(78,205,196,0.1), rgba(78,205,196,0.03))", border: "1px solid rgba(78,205,196,0.2)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "1px" }}>Formations</p>
                <p style={{ color: "#4ecdc4", fontSize: "32px", fontWeight: 800, margin: 0 }}>{mockFormations.length}</p>
              </div>
              <span style={{ fontSize: "32px" }}>📚</span>
            </div>
            <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>En cours d'apprentissage</p>
          </div>

          {/* Certifications */}
          <div style={{ background: "linear-gradient(135deg, rgba(155,127,212,0.1), rgba(155,127,212,0.03))", border: "1px solid rgba(155,127,212,0.2)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "1px" }}>Certifications</p>
                <p style={{ color: "#9b7fd4", fontSize: "32px", fontWeight: 800, margin: 0 }}>{mockCertifications.length}</p>
              </div>
              <span style={{ fontSize: "32px" }}>🏆</span>
            </div>
            <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>Diplômes obtenus</p>
          </div>

          {/* Badges */}
          <div style={{ background: "linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,107,107,0.03))", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "1px" }}>Badges</p>
                <p style={{ color: "#ff6b6b", fontSize: "32px", fontWeight: 800, margin: 0 }}>{mockBadges.length}</p>
              </div>
              <span style={{ fontSize: "32px" }}>🎖️</span>
            </div>
            <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>Récompenses débloquées</p>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* TABS */}
            <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
              {["formations", "seances", "certifications", "badges"].map(function(tab) {
                return (
                  <button
                    key={tab}
                    onClick={function() { setActiveTab(tab); }}
                    style={{
                      background: activeTab === tab ? "linear-gradient(135deg, #c8a96e, #a8853e)" : "transparent",
                      color: activeTab === tab ? "#050508" : "#888",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 18px",
                      fontSize: "13px",
                      fontWeight: activeTab === tab ? 700 : 400,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.2s",
                    }}
                  >
                    {tab === "formations" ? "📚 Formations" : tab === "seances" ? "📅 Séances" : tab === "certifications" ? "🏆 Certifications" : "🎖️ Badges"}
                  </button>
                );
              })}
            </div>

            {/* FORMATIONS TAB */}
            {activeTab === "formations" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {mockFormations.map(function(f) {
                  return (
                    <div key={f.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px", transition: "all 0.2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                          <h3 style={{ color: "#e8e8e8", fontSize: "16px", fontWeight: 700, margin: "0 0 4px 0" }}>{f.title}</h3>
                          <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>{f.done}/{f.total} modules terminés</p>
                        </div>
                        <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px", padding: "4px 12px" }}>
                          <span style={{ color: f.color, fontWeight: 700, fontSize: "14px" }}>{f.progress}%</span>
                        </div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", height: "8px", overflow: "hidden", marginBottom: "12px" }}>
                        <div style={{ background: "linear-gradient(90deg, " + f.color + ", " + f.color + "99)", height: "100%", width: f.progress + "%", borderRadius: "8px", transition: "width 0.8s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: