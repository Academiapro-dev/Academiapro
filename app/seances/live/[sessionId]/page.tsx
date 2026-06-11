import React, { useState, useEffect, useRef } from "react";

interface VisioSessionProps {
  sessionId: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface Note {
  id: string;
  content: string;
  timestamp: Date;
}

const VisioSession: React.FC<VisioSessionProps> = ({ sessionId }) => {
  const [isLive, setIsLive] = useState(true);
  const [duration, setDuration] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Bonjour, je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date(),
    },
  ]);
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "notes" | "replay">("chat");
  const [showEndModal, setShowEndModal] = useState(false);
  const [avatarPulse, setAvatarPulse] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive]);

  useEffect(() => {
    pulseRef.current = setInterval(() => {
      setAvatarPulse((p) => !p);
    }, 2000);
    return () => {
      if (pulseRef.current) clearInterval(pulseRef.current);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: chatInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      const aiResponses = [
        "Je comprends votre question. Laissez-moi vous expliquer en détail.",
        "Excellente observation. Voici ce que je pense à ce sujet.",
        "Merci pour cette question pertinente. Voici ma réponse.",
        "Je vais analyser cela pour vous donner la meilleure réponse possible.",
      ];
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const addNote = () => {
    if (!noteInput.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      content: noteInput,
      timestamp: new Date(),
    };
    setNotes((prev) => [...prev, note]);
    setNoteInput("");
  };

  const endSession = () => {
    setIsLive(false);
    setShowEndModal(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const gold = "#c8a96e";
  const darkBg = "#050508";
  const cardBg = "rgba(255,255,255,0.04)";
  const borderColor = "rgba(200,169,110,0.25)";
  const textPrimary = "#f5f0e8";
  const textSecondary = "rgba(245,240,232,0.55)";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: darkBg,
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: textPrimary,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid " + borderColor,
          backgroundColor: "rgba(5,5,8,0.95)",
          backdropFilter: "blur(20px)",
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, " + gold + ", #a0834e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            ✦
          </div>
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: textPrimary,
                letterSpacing: "0.01em",
              }}
            >
              Session IA Live
            </div>
            <div
              style={{
                fontSize: "11px",
                color: textSecondary,
                letterSpacing: "0.05em",
                fontFamily: "monospace",
              }}
            >
              {sessionId}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Live indicator */}
          {isLive && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  boxShadow: "0 0 8px #ef4444",
                  animation: "none",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: "#ef4444",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                }}
              >
                LIVE
              </span>
            </div>
          )}
          {!isLive && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: textSecondary,
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: textSecondary,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                }}
              >
                TERMINÉE
              </span>
            </div>
          )}

          {/* Duration */}
          <div
            style={{
              backgroundColor: "rgba(200,169,110,0.1)",
              border: "1px solid " + borderColor,
              borderRadius: "8px",
              padding: "6px 14px",
              fontFamily: "monospace",
              fontSize: "15px",
              color: gold,
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            {formatDuration(duration)}
          </div>

          {/* End button */}
          {isLive && (
            <button
              onClick={() => setShowEndModal(true)}
              style={{
                backgroundColor: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: "8px",
                padding: "8px 18px",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.03em",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.22)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.12)";
              }}
            >
              ■ Terminer
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          gap: "0",
        }}
      >
        {/* Left: Avatar Zone */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            padding: "32px",
            background: "radial-gradient(ellipse at center, rgba(200,169,110,0.05) 0%, transparent 70%)",
          }}
        >
          {/* Avatar Container */}
          <div
            style={{
              position: "relative",
              width: "320px",
              height: "380px",
            }}
          >
            {/* Outer glow ring */}
            <div
              style={{
                position: "absolute",
                inset: "-20px",
                borderRadius: "50%",
                border: "1px solid rgba(200,169,110," + (avatarPulse ? "0.4" : "0.15") + ")",
                transition: "border-color 1s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "-10px",
                borderRadius: "50%",
                border: "1px solid rgba(200,169,110," + (avatarPulse ? "0.25" : "0.08") + ")",
                transition: "border-color 1s ease",
              }}
            />

            {/* Avatar screen */}
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "24px",
                border: "1px solid " + borderColor,
                overflow: "hidden",
                position: "relative",
                backgroundColor: "rgba(10,10,16,0.9)",
                boxShadow: "0 0 60px rgba(200,169,110,0.08), inset 0 0 40px rgba(0,0,0,0.5)",
              }}
            >
              {/* HeyGen Avatar placeholder */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(180deg, rgba(15,10,20,0.8) 0%, rgba(5,5,8,0.95) 100%)",
                  position: "relative",
                }}
              >
                {/* Avatar visual */}
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(200,169,110,0.3), rgba(160,131,78,0.15))",
                    border: "2px solid rgba(200,169,110,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "50px",
                    marginBottom: "20px",
                    boxShadow: "0 0 30px rgba(200,169,110,0.2)",
                  }}
                >
                  🤖
                </div>

                {/* Speaking waves */}
                {isLive && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginBottom: "16px",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: "4px",
                          backgroundColor: gold,
                          borderRadius: "2px",
                          height: avatarPulse ? (i % 2 === 0 ? "20px" : "12px") : (i % 2 === 0 ? "8px" : "16px"),
                          transition: "height 0.5s ease",
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </div>
                )}

                <div
                  style={{
                    fontSize: "13px",
                    color: gold,
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    marginBottom: "4px",
                  }}
                >
                  Assistant IA HeyGen
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: textSecondary,
                    letterSpacing: "0.03em",
                  }}
                >
                  {isLive ? (avatarPulse ? "En train de parler..." : "À l'écoute") : "Session terminée"}
                </div>

                {/* HeyGen badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    backgroundColor: "rgba(200,169,110,0.15)",
                    border: "1px solid rgba(200,169,110,0.3)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "10px",
                    color: gold,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                  }}
                >
                  HeyGen
                </div>
              </div>
            </div>
          </div>

          {/* Session info below avatar */}
          <div
            style={{