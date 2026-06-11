import React, { useState } from "react";

const gold = "#c8a96e";
const dark = "#050508";
const darkCard = "#0e0e14";
const darkBorder = "#1a1a24";
const darkHover = "#13131c";
const goldLight = "#e8c98e";
const goldDim = "#8a6a3e";
const textPrimary = "#f0e8d8";
const textSecondary = "#a09880";
const textMuted = "#5a5848";
const success = "#4caf7d";
const warning = "#e8a040";
const info = "#5b8dee";

const modules = [
  {
    id: 1,
    title: "Foundations of AI",
    lessons: 12,
    completed: 12,
    duration: "4h 30m",
    locked: false,
    certified: true,
  },
  {
    id: 2,
    title: "Machine Learning Core",
    lessons: 18,
    completed: 14,
    duration: "6h 15m",
    locked: false,
    certified: false,
  },
  {
    id: 3,
    title: "Neural Networks Deep Dive",
    lessons: 24,
    completed: 6,
    duration: "9h 00m",
    locked: false,
    certified: false,
  },
  {
    id: 4,
    title: "Generative AI Mastery",
    lessons: 20,
    completed: 0,
    duration: "7h 45m",
    locked: true,
    certified: false,
  },
  {
    id: 5,
    title: "AI Ethics & Deployment",
    lessons: 10,
    completed: 0,
    duration: "3h 20m",
    locked: true,
    certified: false,
  },
];

const quizzes = [
  { id: 1, title: "AI Foundations Quiz", score: 94, passed: true, attempts: 2 },
  { id: 2, title: "ML Algorithms Test", score: 78, passed: true, attempts: 3 },
  { id: 3, title: "Neural Net Assessment", score: null, passed: false, attempts: 0 },
  { id: 4, title: "Final Certification Exam", score: null, passed: false, attempts: 0 },
];

const certificates = [
  { id: 1, title: "AI Foundations", issued: "Jan 15, 2025", code: "CERT-AF-2025-0042" },
  { id: 2, title: "ML Professional", issued: null, code: null },
  { id: 3, title: "Deep Learning Expert", issued: null, code: null },
];

const replays = [
  { id: 1, title: "Live Q&A: Neural Networks", date: "Feb 10, 2025", duration: "1h 23m", views: 342 },
  { id: 2, title: "Workshop: Model Training", date: "Jan 28, 2025", duration: "2h 05m", views: 218 },
  { id: 3, title: "Expert Panel: AI Trends", date: "Jan 14, 2025", duration: "58m", views: 501 },
];

const aiMessages = [
  { role: "ai", text: "Hello! I'm your AI tutor. How can I help you today with your learning journey?" },
  { role: "user", text: "Can you explain backpropagation in simple terms?" },
  {
    role: "ai",
    text: "Of course! Backpropagation is how neural networks learn from mistakes. Think of it as a feedback loop — the network makes a prediction, calculates how wrong it was, then works backwards through each layer adjusting weights to reduce that error. Like tuning an instrument by ear!",
  },
];

type Tab = "modules" | "quiz" | "certificates" | "sessions" | "ai";

export default function LMSInterface() {
  const [activeTab, setActiveTab] = useState<Tab>("modules");
  const [aiInput, setAiInput] = useState("");
  const [messages, setMessages] = useState(aiMessages);
  const [aiTyping, setAiTyping] = useState(false);

  const overallProgress = Math.round(
    modules.reduce((acc, m) => acc + (m.completed / m.lessons) * 100, 0) / modules.length
  );

  const handleSendMessage = () => {
    if (!aiInput.trim()) return;
    const newMessages = [...messages, { role: "user", text: aiInput }];
    setMessages(newMessages);
    setAiInput("");
    setAiTyping(true);
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: "ai",
          text: "Great question! I am analyzing your learning history to give you a personalized explanation. Based on your progress in Module 3, let me connect this concept to what you already know about activation functions...",
        },
      ]);
      setAiTyping(false);
    }, 2000);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "modules", label: "Modules", icon: "▦" },
    { id: "quiz", label: "Quizzes", icon: "✎" },
    { id: "certificates", label: "Certificates", icon: "◈" },
    { id: "sessions", label: "Live Replays", icon: "▶" },
    { id: "ai", label: "AI Tutor", icon: "◉" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: dark,
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
        color: textPrimary,
      }}
    >
      {/* Top Nav */}
      <div
        style={{
          borderBottom: "1px solid " + darkBorder,
          backgroundColor: dark,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, " + gold + ", " + goldDim + ")",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: dark,
              }}
            >
              A
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                background: "linear-gradient(135deg, " + goldLight + ", " + gold + ")",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.3px",
              }}
            >
              AcademyAI
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Live badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(220,50,50,0.1)",
                border: "1px solid rgba(220,50,50,0.3)",
                borderRadius: 20,
                padding: "4px 12px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#e03c3c",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ fontSize: 12, color: "#e05050", fontWeight: 600 }}>LIVE NOW</span>
            </div>

            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, " + gold + ", " + goldDim + ")",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: dark,
                cursor: "pointer",
                marginLeft: 8,
              }}
            >
              JD
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "32px 32px",
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 24,
        }}
      >
        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Profile Card */}
          <div
            style={{
              backgroundColor: darkCard,
              border: "1px solid " + darkBorder,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, " + gold + ", " + goldDim + ")",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: dark,
                  flexShrink: 0,
                }}
              >
                JD
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>Jordan Davis</div>
                <div style={{ fontSize: 12, color: textSecondary }}>AI Practitioner Track</div>
              </div>
            </div>

            {/* Overall Progress */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 12, color: textSecondary }}>Overall Progress</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: gold }}>{overallProgress}%</span>
              </div>
              <div
                style={{
                  height: 6,
                  backgroundColor: darkBorder,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: overallProgress + "%",
                    background: "linear-gradient(90deg, " + gold + ", " + goldLight + ")",
                    borderRadius: 3,
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginTop: 16,
              }}
            >
              {[
                { label: "Modules", value: "3/5" },
                { label: "Quizzes", value: "2/4" },
                { label: "Certs", value: "1/3" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    backgroundColor: dark,
                    borderRadius: 8,
                    padding: "10px 6px",
                    textAlign: "center",
                    border: "1px solid " + darkBorder,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: gold }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div
            style={{
              backgroundColor: darkCard,
              border: "1px solid " + darkBorder,
              borderRadius: 16,
              padding: 8,
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeTab === tab.id ? "rgba(200,169,110,0.12)" : "transparent",
                  color: activeTab === tab.id ? gold : textSecondary,
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  textAlign: "left",
                  marginBottom: 2,
                  transition: "all 0.2s ease",
                  borderLeft: activeTab === tab.id ? "2px solid " + gold : "2px solid transparent",
                }}
              >
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                {tab.label}
                {tab.id === "ai" && (
                  <span
                    style={{
                      marginLeft: "auto",
                      backgroundColor: "rgba(200,169,110,0.2)",
                      color: gold,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    NEW
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Streak Card */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.02))",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: gold }}>12-Day Streak!</span>
            </div>
            <p style={{ fontSize: 12, color: textSecondary, margin: 0, lineHeight: 1.5 }}>
              Keep it up! Study at least 20 minutes today to extend your streak.
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 4 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,