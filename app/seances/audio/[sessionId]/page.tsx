import React, { useState, useEffect, useRef } from "react";

interface LiveAudioSessionProps {
  sessionId: string;
}

const LiveAudioSession: React.FC<LiveAudioSessionProps> = ({ sessionId }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [messages, setMessages] = useState<{ role: string; text: string; time: string }[]>([]);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [waveValues, setWaveValues] = useState<number[]>(Array(12).fill(4));
  const [avatarPulse, setAvatarPulse] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      waveRef.current = setInterval(() => {
        setWaveValues(Array(12).fill(0).map(() => Math.floor(Math.random() * 28) + 4));
      }, 120);
    } else {
      if (waveRef.current) clearInterval(waveRef.current);
      setWaveValues(Array(12).fill(4));
    }
    return () => {
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, [isSpeaking]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");
  };

  const handleMicToggle = () => {
    const next = !isListening;
    setIsListening(next);
    if (next) {
      setTimeout(() => {
        setMessages((m) => [...m, { role: "user", text: "Bonjour, je suis prêt pour la séance.", time: getCurrentTime() }]);
        setIsListening(false);
        setIsSpeaking(true);
        setAvatarPulse(true);
        setTimeout(() => {
          setMessages((m) => [...m, { role: "ai", text: "Parfait, je vous écoute. Prenons le temps qu'il faut pour cette session.", time: getCurrentTime() }]);
          setIsSpeaking(false);
          setAvatarPulse(false);
        }, 2800);
      }, 2000);
    }
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      setNotes((n) => [...n, noteText.trim()]);
      setNoteText("");
    }
  };

  const handleEnd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    alert("Séance " + sessionId + " terminée. Durée : " + formatTime(duration));
  };

  const gold = "#c8a96e";
  const darkBg = "#050508";
  const cardBg = "#0d0d14";
  const borderColor = "rgba(200,169,110,0.18)";
  const textMuted = "rgba(200,169,110,0.55)";

  return (
    <div style={{ minHeight: "100vh", background: darkBg, color: gold, fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: "900px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: textMuted, textTransform: "uppercase", marginBottom: "4px" }}>Séance Live</div>
          <div style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "1px" }}>Session #{sessionId}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e05c5c", boxShadow: "0 0 8px #e05c5c", animation: "blink 1.2s infinite" }} />
          <div style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "2px", color: gold }}>{formatTime(duration)}</div>
          <button
            onClick={handleEnd}
            style={{ background: "transparent", border: "1px solid rgba(224,92,92,0.5)", color: "#e05c5c", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", cursor: "pointer", letterSpacing: "1px", transition: "all 0.2s" }}
          >
            Terminer
          </button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: "900px", display: "flex", gap: "20px", flexWrap: "wrap" }}>

        {/* Left column */}
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Avatar IA */}
          <div style={{ background: cardBg, border: "1px solid " + borderColor, borderRadius: "16px", padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative", width: "96px", height: "96px" }}>
              {avatarPulse && (
                <div style={{ position: "absolute", inset: "-10px", borderRadius: "50%", border: "2px solid " + gold, opacity: 0.35, animation: "ping 1s infinite" }} />
              )}
              {avatarPulse && (
                <div style={{ position: "absolute", inset: "-20px", borderRadius: "50%", border: "1px solid " + gold, opacity: 0.15, animation: "ping 1.4s infinite" }} />
              )}
              <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "linear-gradient(135deg, #1a1520 0%, #0d0d14 100%)", border: "2px solid " + gold, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="18" r="10" fill={gold} opacity="0.9" />
                  <path d="M6 42c0-9.94 8.06-18 18-18s18 8.06 18 18" stroke={gold} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
                </svg>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>ARIA</div>
              <div style={{ fontSize: "11px", color: textMuted, letterSpacing: "2px" }}>ASSISTANT IA</div>
            </div>
            <div style={{ fontSize: "12px", color: isSpeaking ? gold : textMuted, letterSpacing: "1.5px", textTransform: "uppercase", transition: "color 0.3s" }}>
              {isSpeaking ? "● En train de parler" : isListening ? "● En écoute" : "○ En attente"}
            </div>

            {/* Wave visualizer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", height: "36px" }}>
              {waveValues.map((h, i) => (
                <div
                  key={i}
                  style={{ width: "4px", height: h + "px", borderRadius: "2px", background: gold, opacity: isSpeaking ? 0.9 : 0.25, transition: "height 0.1s ease, opacity 0.3s" }}
                />
              ))}
            </div>
          </div>

          {/* Micro control */}
          <div style={{ background: cardBg, border: "1px solid " + borderColor, borderRadius: "16px", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "2px", color: textMuted, textTransform: "uppercase" }}>Contrôle Audio</div>
            <button
              onClick={handleMicToggle}
              style={{ width: "72px", height: "72px", borderRadius: "50%", border: "2px solid " + (isListening ? gold : borderColor), background: isListening ? "rgba(200,169,110,0.12)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", boxShadow: isListening ? "0 0 24px rgba(200,169,110,0.25)" : "none" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="11" rx="3" fill={isListening ? gold : "rgba(200,169,110,0.4)"} />
                <path d="M5 10a7 7 0 0 0 14 0" stroke={isListening ? gold : "rgba(200,169,110,0.4)"} strokeWidth="2" strokeLinecap="round" fill="none" />
                <line x1="12" y1="17" x2="12" y2="21" stroke={isListening ? gold : "rgba(200,169,110,0.4)"} strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="21" x2="15" y2="21" stroke={isListening ? gold : "rgba(200,169,110,0.4)"} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div style={{ fontSize: "12px", color: isListening ? gold : textMuted }}>
              {isListening ? "Parlez maintenant…" : "Appuyez pour parler"}
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: cardBg, border: "1px solid " + borderColor, borderRadius: "16px", padding: "20px", flex: 1 }}>
            <div style={{ fontSize: "11px", letterSpacing: "2px", color: textMuted, textTransform: "uppercase", marginBottom: "14px" }}>Notes de séance</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                placeholder="Ajouter une note…"
                style={{ flex: 1, background: "rgba(200,169,110,0.05)", border: "1px solid " + borderColor, borderRadius: "8px", padding: "8px 12px", color: gold, fontSize: "13px", outline: "none" }}
              />
              <button
                onClick={handleAddNote}
                style={{ background: "rgba(200,169,110,0.1)", border: "1px solid " + borderColor, borderRadius: "8px", padding: "8px 12px", color: gold, cursor: "pointer", fontSize: "16px" }}
              >
                +
              </button>
            </div>
            <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {notes.length === 0 && (
                <div style={{ fontSize: "12px", color: textMuted, textAlign: "center", padding: "12px" }}>Aucune note</div>
              )}
              {notes.map((note, i) => (
                <div key={i} style={{ background: "rgba(200,169,110,0.06)", border: "1px solid " + borderColor, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: gold, opacity: 0.4, fontSize: "10px", marginTop: "2px" }}>◆</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div style={{ flex: "2 1 380px", background: cardBg, border: "1px solid " + borderColor, borderRadius: "16px", display: "flex", flexDirection: "column", minHeight: "600px" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid " + borderColor, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "11px", letterSpacing: "2px", color: textMuted, textTransform: "uppercase" }}>Transcription Live</div>
            <div style={{ fontSize: "11px", color: textMuted }}>{messages.length} message{messages.length !== 1 ? "s" : ""}</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", opacity: 0.4 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2