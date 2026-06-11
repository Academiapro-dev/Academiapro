import React, { useState, useEffect, useRef } from "react";

const gold = "#c8a96e";
const dark = "#050508";
const darkCard = "#0d0d14";
const darkBorder = "#1a1a2e";
const goldLight = "#e8c98e";
const goldDim = "#8a6d3e";
const textMuted = "#6b6b8a";
const online = "#4ade80";

interface Session {
  id: number;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: number;
  participants: number;
  maxParticipants: number;
  topic: string;
  level: string;
}

interface Message {
  id: number;
  user: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface Participant {
  id: number;
  name: string;
  role: string;
  online: boolean;
  avatar: string;
}

const sessions: Session[] = [
  {
    id: 1,
    title: "Architecture React Avancée",
    instructor: "Sophie Laurent",
    date: "Aujourd'hui",
    time: "14:00",
    duration: 90,
    participants: 12,
    maxParticipants: 20,
    topic: "Hooks & Context API",
    level: "Avancé",
  },
  {
    id: 2,
    title: "TypeScript Patterns",
    instructor: "Marc Dubois",
    date: "Demain",
    time: "10:00",
    duration: 60,
    participants: 8,
    maxParticipants: 15,
    topic: "Génériques & Utility Types",
    level: "Intermédiaire",
  },
  {
    id: 3,
    title: "Node.js Performance",
    instructor: "Emma Chen",
    date: "Ven 24 Jan",
    time: "16:30",
    duration: 120,
    participants: 5,
    maxParticipants: 25,
    topic: "Optimisation & Clustering",
    level: "Expert",
  },
  {
    id: 4,
    title: "CSS & Design Systems",
    instructor: "Alex Martin",
    date: "Sam 25 Jan",
    time: "11:00",
    duration: 75,
    participants: 18,
    maxParticipants: 20,
    topic: "Variables & Animations",
    level: "Débutant",
  },
];

const initialMessages: Message[] = [
  {
    id: 1,
    user: "Sophie L.",
    text: "Bonjour tout le monde, prêts pour la session?",
    time: "13:45",
    isMe: false,
  },
  {
    id: 2,
    user: "Marc D.",
    text: "Oui, j'ai préparé mes questions sur les hooks!",
    time: "13:47",
    isMe: false,
  },
  {
    id: 3,
    user: "Moi",
    text: "Super, j'arrive dans 5 minutes.",
    time: "13:52",
    isMe: true,
  },
  {
    id: 4,
    user: "Emma C.",
    text: "Le lien Zoom est actif, on peut rejoindre.",
    time: "13:58",
    isMe: false,
  },
];

const participants: Participant[] = [
  { id: 1, name: "Sophie Laurent", role: "Instructor", online: true, avatar: "SL" },
  { id: 2, name: "Marc Dubois", role: "Étudiant", online: true, avatar: "MD" },
  { id: 3, name: "Emma Chen", role: "Étudiant", online: true, avatar: "EC" },
  { id: 4, name: "Alex Martin", role: "Étudiant", online: false, avatar: "AM" },
  { id: 5, name: "Julie Bernard", role: "Étudiant", online: true, avatar: "JB" },
  { id: 6, name: "Thomas Petit", role: "Étudiant", online: false, avatar: "TP" },
];

export default function VirtualClassroom() {
  const [activeTab, setActiveTab] = useState<"sessions" | "chat" | "participants">("sessions");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [joinedSession, setJoinedSession] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (joinedSession !== null) {
      const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [joinedSession]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return (m < 10 ? "0" + m : m) + ":" + (sec < 10 ? "0" + sec : sec);
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const now = new Date();
    const time = now.getHours() + ":" + (now.getMinutes() < 10 ? "0" : "") + now.getMinutes();
    setMessages([
      ...messages,
      { id: messages.length + 1, user: "Moi", text: inputText, time, isMe: true },
    ]);
    setInputText("");
  };

  const getLevelColor = (level: string) => {
    if (level === "Débutant") return "#4ade80";
    if (level === "Intermédiaire") return gold;
    if (level === "Avancé") return "#f97316";
    return "#ef4444";
  };

  const activeSession = sessions.find((s) => s.id === joinedSession);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#e8e8f0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: darkCard,
          borderBottom: "1px solid " + darkBorder,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, " + gold + ", " + goldDim + ")",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            🎓
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "18px", color: gold, letterSpacing: "0.5px" }}>
              ClasseVirtuelle
            </div>
            <div style={{ fontSize: "11px", color: textMuted }}>Plateforme d'apprentissage</div>
          </div>
        </div>

        {joinedSession !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(200, 169, 110, 0.1)",
              border: "1px solid " + goldDim,
              borderRadius: "20px",
              padding: "6px 14px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                background: online,
                borderRadius: "50%",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: "13px", color: gold }}>En session</span>
            <span style={{ fontSize: "13px", color: goldLight, fontVariantNumeric: "tabular-nums" }}>
              {formatElapsed(elapsed)}
            </span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              background: "linear-gradient(135deg, #2a1f0e, #4a3520)",
              border: "2px solid " + gold,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 700,
              color: gold,
            }}
          >
            VF
          </div>
        </div>
      </div>

      {/* Live Banner */}
      {joinedSession !== null && activeSession && (
        <div
          style={{
            background: "linear-gradient(90deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05), rgba(200,169,110,0.15))",
            borderBottom: "1px solid rgba(200,169,110,0.3)",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, letterSpacing: "1px" }}>
              LIVE
            </span>
            <span style={{ color: goldLight, fontWeight: 600, fontSize: "14px" }}>{activeSession.title}</span>
            <span style={{ color: textMuted, fontSize: "13px" }}>avec {activeSession.instructor}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: textMuted, fontSize: "13px" }}>
              👥 {activeSession.participants} participants
            </span>
            <span style={{ color: textMuted, fontSize: "13px" }}>
              ⏱ {activeSession.duration} min
            </span>
            <button
              onClick={() => { setJoinedSession(null); setElapsed(0); }}
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#ef4444",
                padding: "4px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Quitter
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid " + darkBorder,
          background: darkCard,
          padding: "0 24px",
          gap: "4px",
        }}
      >
        {(["sessions", "chat", "participants"] as const).map((tab) => {
          const labels: Record<string, string> = {
            sessions: "📅 Sessions",
            chat: "💬 Chat",
            participants: "👥 Participants",
          };
          const isActive = activeTab === tab;
          const isHovered = hoveredTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              onMouseEnter={() => setHoveredTab(tab)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid " + gold : "2px solid transparent",
                color: isActive ? gold : isHovered ? goldLight : textMuted,
                padding: "14px 16px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.2s",
              }}
            >
              {labels[tab]}
              {tab === "chat" && messages.length > 0 && (
                <span
                  style={{
                    marginLeft: "6px",
                    background: gold,
                    color: dark,
                    borderRadius: "10px",
                    padding: "1px 6px",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {messages.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "24px", maxWidth: "960px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ color: goldLight, fontWeight: 700, fontSize: "20px", margin: "0 0 4px 0" }}>
                Prochaines Sessions
              </h2>
              <p style={{ color: textMuted, fontSize: "13px", margin: 0 }}>
                Rejoignez une session en direct ou planifiez votre apprentissage
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {sessions.map((session) => {
                const isJoined = joinedSession === session.id;
                const isHov = hoveredBtn === session.id;
                const pct = (session.participants / session.maxParticipants) * 100;

                return (
                  <div
                    key={session.id}
                    style={{
                      background: isJoined
                        ? "linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.03))"
                        : darkCard,
                      border: isJoined
                        ? "1px solid rgba(200,169,110,0.5)"
                        : "1px solid " + darkBorder,
                      borderRadius: "16px",
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "20px",
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px