"use client";
import { useState } from "react";

export default function SessionAudioPage({ params }) {
  const sessionId = params?.sessionId || "SES-2024-001";

  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [messages, setMessages] = useState([
    { id: 1, role: "ai", text: "Bonjour, je suis prêt pour votre séance. Comment puis-je vous aider aujourd'hui ?", time: "14:00" },
    { id: 2, role: "user", text: "J'aimerais travailler sur ma gestion du stress.", time: "14:01" },
    { id: 3, role: "ai", text: "Parfait. Commençons par quelques exercices de respiration guidée. Installez-vous confortablement.", time: "14:01" },
  ]);
  const [notes, setNotes] = useState("Points clés abordés:\n- Respiration diaphragmatique\n- Ancrage corporel\n- Visualisation positive");
  const [inputMessage, setInputMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [audioLevel, setAudioLevel] = useState(65);

  const formatDuration = function(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return (h > 0 ? String(h).padStart(2, "0") + ":" : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  };

  const handleToggleLive = function() {
    setIsLive(!isLive);
  };

  const handleSendMessage = function() {
    if (!inputMessage.trim()) return;
    const newMsg = { id: messages.length + 1, role: "user", text: inputMessage, time: "14:05" };
    setMessages([...messages, newMsg]);
    setInputMessage("");
    setTimeout(function() {
      const aiReply = { id: messages.length + 2, role: "ai", text: "Je comprends. Continuons ensemble sur ce point important.", time: "14:05" };
      setMessages(function(prev) { return [...prev, aiReply]; });
    }, 1000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050508", fontFamily: "'Segoe UI', sans-serif", color: "#e8e0d0", display: "flex", flexDirection: "column" }}>

      <div style={{ backgroundColor: "#0a0a12", borderBottom: "1px solid #1a1a2e", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #c8a96e, #a07840)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
            ◎
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#c8a96e", letterSpacing: "0.5px" }}>SÉANCE AUDIO LIVE</div>
            <div style={{ fontSize: "11px", color: "#6a6a8a", marginTop: "1px" }}>Session ID: {sessionId}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isLive ? "#4ade80" : "#3a3a5a", boxShadow: isLive ? "0 0 8px #4ade80" : "none" }}></div>
            <span style={{ fontSize: "12px", color: isLive ? "#4ade80" : "#5a5a7a", fontWeight: "600" }}>{isLive ? "EN DIRECT" : "HORS LIGNE"}</span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: "300", color: "#c8a96e", fontVariantNumeric: "tabular-nums", letterSpacing: "2px" }}>
            {formatDuration(duration)}
          </div>
          <div style={{ fontSize: "11px", color: "#4a4a6a", backgroundColor: "#0f0f1a", padding: "4px 10px", borderRadius: "6px", border: "1px solid #1a1a2e" }}>
            HD · 48kHz
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        <div style={{ width: "320px", backgroundColor: "#070710", borderRight: "1px solid #111128", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px", gap: "28px" }}>

          <div style={{ position: "relative", width: "160px", height: "160px" }}>
            <div style={{ position: "absolute", inset: "-12px", borderRadius: "50%", border: "2px solid #c8a96e", opacity: isLive ? "0.3" : "0.08", animation: isLive ? "pulse 2s infinite" : "none" }}></div>
            <div style={{ position: "absolute", inset: "-6px", borderRadius: "50%", border: "1px solid #c8a96e", opacity: isLive ? "0.5" : "0.15" }}></div>
            <div style={{ width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #1a1a35, #050508)", border: "2px solid #c8a96e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: "52px", lineHeight: "1" }}>🤖</div>
              <div style={{ fontSize: "10px", color: "#c8a96e", fontWeight: "600", letterSpacing: "1.5px" }}>ARIA AI</div>
              {isLive && (
                <div style={{ position: "absolute", bottom: "18px", display: "flex", gap: "3px", alignItems: "flex-end" }}>
                  {[4, 8, 5, 10, 6, 9, 4].map(function(h, i) {
                    return (
                      <div key={i} style={{ width: "3px", backgroundColor: "#c8a96e", borderRadius: "2px", height: String(h) + "px", opacity: "0.8" }}></div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ width: "100%", backgroundColor: "#0a0a18", borderRadius: "12px", padding: "16px", border: "1px solid #1a1a2e" }}>
            <div style={{ fontSize: "11px", color: "#6a6a8a", marginBottom: "10px", fontWeight: "600", letterSpacing: "1px" }}>NIVEAU AUDIO</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px" }}>🎙</span>
              <div style={{ flex: 1, height: "6px", backgroundColor: "#1a1a2e", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: String(audioLevel) + "%", background: "linear-gradient(90deg, #4ade80, #c8a96e)", borderRadius: "3px", transition: "width 0.3s" }}></div>
              </div>
              <span style={{ fontSize: "11px", color: "#c8a96e", fontWeight: "600", minWidth: "32px" }}>{audioLevel}%</span>
            </div>
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px" }}>🔊</span>
              <div style={{ flex: 1, height: "6px", backgroundColor: "#1a1a2e", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "78%", background: "linear-gradient(90deg, #4ade80, #c8a96e)", borderRadius: "3px" }}></div>
              </div>
              <span style={{ fontSize: "11px", color: "#c8a96e", fontWeight: "600", minWidth: "32px" }}>78%</span>
            </div>
          </div>

          <div style={{ width: "100%", backgroundColor: "#0a0a18", borderRadius: "12px", padding: "16px", border: "1px solid #1a1a2e" }}>
            <div style={{ fontSize: "11px", color: "#6a6a8a", marginBottom: "12px", fontWeight: "600", letterSpacing: "1px" }}>INFOS SESSION</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#5a5a7a" }}>Modèle IA</span>
                <span style={{ fontSize: "12px", color: "#c8a96e", fontWeight: "600" }}>ARIA v3.2</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#5a5a7a" }}>Codec</span>
                <span style={{ fontSize: "12px", color: "#e8e0d0" }}>Opus 128k</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#5a5a7a" }}>Latence</span>
                <span style={{ fontSize: "12px", color: "#4ade80" }}>42 ms</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#5a5a7a" }}>Participants</span>
                <span style={{ fontSize: "12px", color: "#e8e0d0" }}>2</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#5a5a7a" }}>Chiffrement</span>
                <span style={{ fontSize: "12px", color: "#4ade80" }}>AES-256 ✓</span>
              </div>
            </div>
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={handleToggleLive}
              style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "13px", letterSpacing: "1px", background: isLive ? "linear-gradient(135deg, #7f1d1d, #991b1b)" : "linear-gradient(135deg, #c8a96e, #a07840)", color: isLive ? "#fca5a5" : "#050508", transition: "opacity 0.2s" }}
            >
              {isLive ? "⏹ TERMINER LA SÉANCE" : "▶ DÉMARRER LA SÉANCE"}
            </button>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={function() { setIsMuted(!isMuted); }}
                style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid #2a2a4a", cursor: "pointer", backgroundColor: isMuted ? "#2a1a1a" : "#0f0f1e", color: isMuted ? "#f87171" : "#8a8aaa", fontSize: "18px", transition: "all 0.2s" }}
              >
                {isMuted ? "🔇" : "🎙"}
              </button>
              <button
                style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid #2a2a4a", cursor: "pointer", backgroundColor: "#0f0f1e", color: "#8a8aaa", fontSize: "18px" }}
              >
                📹
              </button>
              <button
                style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid #2a2a4a", cursor: "pointer", backgroundColor: "#0f0f1e", color: "#8a8aaa", fontSize: "18px" }}
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          <div style={{ display: "flex", borderBottom: "1px solid #111128", backgroundColor: "#070710" }}>
            {["chat", "notes", "recap"].map(function(tab) {
              const labels = { chat: "💬 Chat", notes: "📝 Notes", recap: "📊 Récap" };
              return (
                <button
                  key={tab}
                  onClick={function() { setActiveTab(tab); }}
                  style={{ padding: "14px 28px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", backgroundColor: "transparent", color: activeTab === tab ? "#c8a96e" : "#4a4a6a", borderBottom: activeTab === tab ? "2px solid #c8a96e" : "2px solid transparent", transition: "all 0.2s", letterSpacing: "0.3px" }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {activeTab === "chat" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {messages.map(function(msg) {
                  return (
                    <div key={msg.id} style={{ display: "