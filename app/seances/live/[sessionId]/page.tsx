"use client";
import { useState } from "react";

export default function VisioPage({ params }: { params: { sessionId: string } }) {
  const [messages, setMessages] = useState([
    { id: 1, from: "ai", text: "Bonjour, je suis votre assistant IA. La séance peut commencer.", time: "14:00" },
    { id: 2, from: "user", text: "Merci, je suis prêt.", time: "14:01" },
    { id: 3, from: "ai", text: "Parfait. Commençons par votre objectif principal pour aujourd'hui.", time: "14:01" },
  ]);
  const [input, setInput] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [duration, setDuration] = useState("00:42:17");
  const [activeTab, setActiveTab] = useState("chat");
  const [isRecording, setIsRecording] = useState(true);

  function sendMessage() {
    if (!input.trim()) return;
    const newMsg = { id: messages.length + 1, from: "user", text: input, time: "14:43" };
    setMessages([...messages, newMsg]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { id: prev.length + 1, from: "ai", text: "Je comprends. Pouvez-vous développer davantage cette idée ?", time: "14:43" }]);
    }, 1200);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050508", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div style={{ height: "56px", backgroundColor: "#0a0a0f", borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #c8a96e, #a07840)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "14px" }}>✦</span>
            </div>
            <span style={{ color: "#c8a96e", fontWeight: "700", fontSize: "15px", letterSpacing: "0.5px" }}>AURA</span>
          </div>
          <div style={{ width: "1px", height: "20px", backgroundColor: "#1a1a2e" }}></div>
          <span style={{ color: "#4a4a6a", fontSize: "12px" }}>Session</span>
          <span style={{ color: "#6a6a8a", fontSize: "12px", fontFamily: "monospace" }}>#{params?.sessionId || "VSN-2847"}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isLive && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#1a0808", border: "1px solid #5a1a1a", borderRadius: "20px", padding: "4px 12px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#ff4444", animation: "pulse 1.5s infinite" }}></div>
              <span style={{ color: "#ff6666", fontSize: "11px", fontWeight: "600", letterSpacing: "1px" }}>LIVE</span>
            </div>
          )}
          {isRecording && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: "20px", padding: "4px 12px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#c8a96e" }}></div>
              <span style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "600" }}>REC</span>
            </div>
          )}
          <div style={{ backgroundColor: "#0f0f1a", border: "1px solid #1a1a2e", borderRadius: "20px", padding: "4px 14px" }}>
            <span style={{ color: "#8888aa", fontSize: "12px", fontFamily: "monospace" }}>{duration}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#44ff88" }}></div>
          <span style={{ color: "#44ff88", fontSize: "12px" }}>Connecté</span>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #2a1a4a, #1a1a3a)", border: "2px solid #c8a96e", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "8px", cursor: "pointer" }}>
            <span style={{ fontSize: "13px" }}>👤</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: "0", overflow: "hidden", minWidth: 0 }}>

          <div style={{ flex: "1 1 0", position: "relative", backgroundColor: "#020205", overflow: "hidden", minHeight: 0 }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, #1a1030 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, #0a1528 0%, transparent 50%)" }}></div>

            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", width: "220px", height: "220px", borderRadius: "50%", border: "1px solid rgba(200,169,110,0.15)", animation: "spin 8s linear infinite" }}></div>
                <div style={{ position: "absolute", width: "180px", height: "180px", borderRadius: "50%", border: "1px solid rgba(200,169,110,0.1)", animation: "spin 5s linear infinite reverse" }}></div>
                <div style={{ position: "absolute", width: "260px", height: "260px", borderRadius: "50%", border: "1px solid rgba(100,80,200,0.08)" }}></div>

                <div style={{ width: "140px", height: "140px", borderRadius: "50%", background: "linear-gradient(135deg, #1a1035 0%, #0d0820 50%, #1a1035 100%)", border: "3px solid #c8a96e", boxShadow: "0 0 40px rgba(200,169,110,0.3), 0 0 80px rgba(200,169,110,0.1), inset 0 0 30px rgba(200,169,110,0.05)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #c8a96e22, #a0784022)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: "36px" }}>🤖</div>
                  </div>
                  {isLive && (
                    <div style={{ position: "absolute", bottom: "8px", right: "8px", display: "flex", gap: "2px", alignItems: "flex-end", height: "20px" }}>
                      {[4, 8, 6, 10, 5, 9, 3].map((h, i) => (
                        <div key={i} style={{ width: "3px", height: h + "px", backgroundColor: "#c8a96e", borderRadius: "2px", opacity: 0.8 }}></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", top: "20px", left: "20px", backgroundColor: "rgba(5,5,8,0.85)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "10px 16px" }}>
              <div style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "600" }}>Assistant IA</div>
              <div style={{ color: "#6a6a8a", fontSize: "11px", marginTop: "2px" }}>Modèle Aura v2.4</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#44ff88" }}></div>
                <span style={{ color: "#44ff88", fontSize: "10px" }}>En ligne</span>
              </div>
            </div>

            <div style={{ position: "absolute", bottom: "20px", right: "20px", width: "160px", height: "100px", backgroundColor: "#0a0a12", border: "1px solid #1a1a2e", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>
              {isCameraOn ? (
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0f0f20, #1a1a30)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "28px" }}>👤</div>
                  <span style={{ color: "#4a4a6a", fontSize: "10px" }}>Vous</span>
                </div>
              ) : (
                <div style={{ width: "100%", height: "100%", backgroundColor: "#0a0a12", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "22px" }}>📷</span>
                  <span style={{ color: "#3a3a5a", fontSize: "10px" }}>Caméra off</span>
                </div>
              )}
              <div style={{ position: "absolute", bottom: "6px", left: "6px", backgroundColor: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "2px 6px" }}>
                <span style={{ color: "#8888aa", fontSize: "9px" }}>Vous</span>
              </div>
            </div>

            <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "12px" }}>
              <button
                onClick={() => setIsMuted(!isMuted)}
                style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: isMuted ? "#5a1a1a" : "rgba(20,20,40,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", backdropFilter: "blur(10px)", transition: "all 0.2s", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
              >
                {isMuted ? "🔇" : "🎙️"}
              </button>
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: !isCameraOn ? "#5a1a1a" : "rgba(20,20,40,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", backdropFilter: "blur(10px)", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
              >
                {isCameraOn ? "📹" : "🚫"}
              </button>
              <button
                onClick={() => setIsLive(false)}
                style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: "#5a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 2px 12px rgba(180,0,0,0.3)" }}
              >
                📵
              </button>
            </div>
          </div>

          <div style={{ height: "120px", backgroundColor: "#06060c", borderTop: "1px solid #0f0f20", padding: "12px 20px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#4a4a6a", fontSize: "11px", letterSpacing: "0.5px" }}>REPLAY & TIMELINE</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={{ backgroundColor: "#0f0f1a", border: "1px solid #1a1a2e", borderRadius: "6px", color: "#8888aa", fontSize: "11px", padding: "3px 10px", cursor: "pointer" }}>◀◀</button>
                <button style={{ backgroundColor: "#0f0f1a", border: "1px solid #1a1a2e", borderRadius: "6px", color: "#8888aa", fontSize: "11px", padding: "3px 10px", cursor: "pointer" }}>▶</button>
                <button style={{ backgroundColor: "#0f0f1a", border: "1px solid #1a1a2e", borderRadius: "6px", color: "#8888aa", fontSize: "11px", padding: "3px 10px", cursor: "pointer" }}>▶▶</button>
                <button style={{ backgroundColor: "#0f0f1a", border: "1px solid #1a1a