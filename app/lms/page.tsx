"use client";
import { useState } from "react";

export default function LMSPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [expandedModule, setExpandedModule] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "ai", text: "Bonjour ! Je suis votre tuteur IA. Comment puis-je vous aider aujourd'hui ?" }
  ]);

  const modules = [
    { id: 1, title: "Introduction au Machine Learning", lessons: 12, completed: 12, quiz: true, quizScore: 94 },
    { id: 2, title: "Réseaux de neurones profonds", lessons: 18, completed: 14, quiz: true, quizScore: 78 },
    { id: 3, title: "Traitement du langage naturel", lessons: 15, completed: 6, quiz: false, quizScore: null },
    { id: 4, title: "Vision par ordinateur", lessons: 20, completed: 0, quiz: false, quizScore: null },
    { id: 5, title: "Reinforcement Learning", lessons: 16, completed: 0, quiz: false, quizScore: null },
  ];

  const certificates = [
    { id: 1, title: "Machine Learning Fundamentals", date: "12 Jan 2025", badge: "🥇" },
    { id: 2, title: "Deep Learning Practitioner", date: "En cours", badge: "🔄" },
  ];

  const liveSessions = [
    { id: 1, title: "Workshop: Fine-tuning LLMs", date: "Aujourd'hui 18h00", live: true, replay: false },
    { id: 2, title: "Q&A: Computer Vision avancé", date: "Hier 18h00", live: false, replay: true },
    { id: 3, title: "Masterclass: MLOps en production", date: "15 Jan 2025", live: false, replay: true },
    { id: 4, title: "Atelier: Prompt Engineering", date: "10 Jan 2025", live: false, replay: true },
  ];

  const quizQuestions = [
    { q: "Qu'est-ce qu'un réseau de neurones convolutif ?", options: ["Un réseau pour le texte", "Un réseau pour les images", "Un réseau récurrent", "Un autoencoder"], correct: 1 },
  ];
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const totalProgress = Math.round(
    modules.reduce((acc, m) => acc + (m.completed / m.lessons) * 100, 0) / modules.length
  );

  function sendChat() {
    if (!chatMessage.trim()) return;
    const newHistory = [...chatHistory, { role: "user", text: chatMessage }];
    setChatHistory(newHistory);
    setChatMessage("");
    setTimeout(() => {
      setChatHistory([...newHistory, {
        role: "ai",
        text: "Excellente question ! Voici une explication détaillée de ce concept. Les réseaux de neurones apprennent par rétropropagation du gradient, ajustant leurs poids à chaque itération pour minimiser la fonction de perte."
      }]);
    }, 800);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Segoe UI', sans-serif", color: "#e8e0d0", display: "flex" }}>

      <div style={{ width: "240px", background: "linear-gradient(180deg, #0d0d14 0%, #080810 100%)", borderRight: "1px solid #1a1a2e", display: "flex", flexDirection: "column", padding: "0", position: "fixed", height: "100vh", zIndex: 100 }}>
        <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid #1a1a2e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #c8a96e, #e8c97e)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⚡</div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#c8a96e", letterSpacing: "0.5px" }}>LearnAI</div>
              <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1px", textTransform: "uppercase" }}>Platform</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {[
            { id: "dashboard", icon: "◉", label: "Tableau de bord" },
            { id: "modules", icon: "▦", label: "Modules" },
            { id: "quiz", icon: "◈", label: "Quiz" },
            { id: "certificates", icon: "✦", label: "Certificats" },
            { id: "live", icon: "◎", label: "Sessions Live" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "10px", border: "none", cursor: "pointer", marginBottom: "4px", background: activeTab === item.id ? "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.08))" : "transparent", color: activeTab === item.id ? "#c8a96e" : "#888", fontSize: "13px", fontWeight: activeTab === item.id ? "600" : "400", transition: "all 0.2s", textAlign: "left", borderLeft: activeTab === item.id ? "2px solid #c8a96e" : "2px solid transparent" }}
            >
              <span style={{ fontSize: "15px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid #1a1a2e" }}>
          <div style={{ background: "rgba(200,169,110,0.08)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(200,169,110,0.15)" }}>
            <div style={{ fontSize: "11px", color: "#c8a96e", fontWeight: "600", marginBottom: "8px", letterSpacing: "0.5px" }}>PROGRESSION GLOBALE</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#c8a96e", lineHeight: "1" }}>{totalProgress}%</div>
            <div style={{ marginTop: "8px", background: "#1a1a2e", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: totalProgress + "%", background: "linear-gradient(90deg, #c8a96e, #e8c97e)", borderRadius: "4px", transition: "width 0.5s" }}></div>
            </div>
            <div style={{ fontSize: "10px", color: "#666", marginTop: "6px" }}>3 modules en cours</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 8px 4px" }}>
            <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #c8a96e, #a07840)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "#050508" }}>A</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#e8e0d0" }}>Alex Martin</div>
              <div style={{ fontSize: "11px", color: "#666" }}>Pro Member</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginLeft: "240px", flex: 1, padding: "32px", minHeight: "100vh" }}>

        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#e8e0d0", margin: "0 0 6px" }}>Bonjour, Alex 👋</h1>
              <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>Continuez votre apprentissage — vous êtes à {totalProgress}% de votre objectif.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "Leçons complétées", value: "32", icon: "📚", color: "#c8a96e" },
                { label: "Heures d'étude", value: "47h", icon: "⏱", color: "#7e9fe8" },
                { label: "Score moyen quiz", value: "86%", icon: "🎯", color: "#7ee8a2" },
                { label: "Certificats", value: "1", icon: "🏅", color: "#e87e7e" },
              ].map((stat, i) => (
                <div key={i} style={{ background: "linear-gradient(135deg, #0d0d14, #0a0a12)", border: "1px solid #1a1a2e", borderRadius: "16px", padding: "20px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: "12px", right: "14px", fontSize: "24px", opacity: "0.6" }}>{stat.icon}</div>
                  <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{stat.label}</div>
                  <div style={{ fontSize: "32px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div style={{ background: "linear-gradient(135deg, #0d0d14, #0a0a12)", border: "1px solid #1a1a2e", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#c8a96e", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "1px" }}>Progression par module</h3>
                {modules.map(m => (
                  <div key={m.id} style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#aaa", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</span>
                      <span style={{ fontSize: "12px", color: "#c8a96e", fontWeight: "600" }}>{Math.round((m.completed / m.lessons) * 100)}%</span>
                    </div>
                    <div style={{ background: "#1a1a2e", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: Math.round((m.completed / m.lessons) * 100) + "%", background: m.completed === m.lessons ? "linear-gradient(90deg, #7ee8a2, #4ec87a)" : "linear-gradient(90deg, #c8a96e, #e8c97e)", borderRadius: "4px", transition: "width 0.5s" }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "linear-gradient(135deg, #0d0d14, #0a0a12)", border: "1px solid #1a1a2e", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#c8a96e", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "1px" }}>Sessions à venir & Replays</h3>
                {liveSessions.slice(0, 4).map(s => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #0d0d14" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", color: "#ddd", fontWeight: "500", marginBottom: "3px" }}>{s.title}</div>
                      <div style={{ fontSize: "11px", color: "#555" }}>{s.date}</div>
                    </div>
                    {s.live && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "20px", padding: "3px 10px" }}>
                        <div style={{ width: "6px", height: "6px", background: "#e74c3c", borderRadius: "50%", animation: "pulse 1s infinite" }}></div>
                        <span style={{ fontSize: "10px", color: "#e74c3c", fontWeight: "700" }}>LIVE</span>
                      </div>
                    )}
                    {s.replay && (
                      <button style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "20px", padding: "3px 10px", color: "#c8a96e", fontSize: "10px", cursor: "pointer", fontWeight: "600" }}>▶ Replay</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.1), rgba(200,169,110,0.05))", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between"