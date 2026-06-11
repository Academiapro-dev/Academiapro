export default function VirtualClassPage({ params }: { params: { sessionId: string } }) {
  const [messages, setMessages] = React.useState<Array<{ id: number; author: string; text: string; time: string; isAI: boolean }>>([
    { id: 1, author: "AcadémIA", text: "Bienvenue dans votre classe virtuelle. La session commence maintenant.", time: "14:00", isAI: true },
    { id: 2, author: "Sophie M.", text: "Bonjour tout le monde !", time: "14:01", isAI: false },
    { id: 3, author: "AcadémIA", text: "Aujourd'hui nous allons explorer les fondamentaux de l'algèbre linéaire.", time: "14:02", isAI: true },
  ]);
  const [inputMessage, setInputMessage] = React.useState("");
  const [duration, setDuration] = React.useState(0);
  const [isConnected, setIsConnected] = React.useState(true);
  const [participants, setParticipants] = React.useState([
    { id: 1, name: "Sophie M.", role: "student", active: true },
    { id: 2, name: "Thomas K.", role: "student", active: true },
    { id: 3, name: "Leila R.", role: "student", active: false },
    { id: 4, name: "Marc D.", role: "student", active: true },
  ]);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newMessage = {
      id: messages.length + 1,
      author: "Vous",
      text: inputMessage,
      time,
      isAI: false,
    };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          author: "AcadémIA",
          text: "Excellente question. Permettez-moi d'élaborer sur ce point pour toute la classe.",
          time,
          isAI: true,
        },
      ]);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const handleQuit = () => {
    setIsConnected(false);
    alert(`Session ${params.sessionId} terminée. Durée : ${formatDuration(duration)}`);
  };

  const avatarPulseStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "2px solid #c8a96e",
    animation: "pulse 2s infinite",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        color: "#e8e0d0",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0% { box-shadow: 0 0 8px #c8a96e44; }
          50% { box-shadow: 0 0 22px #c8a96e88; }
          100% { box-shadow: 0 0 8px #c8a96e44; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d12; }
        ::-webkit-scrollbar-thumb { background: #c8a96e55; border-radius: 2px; }
      `}</style>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 28px",
          borderBottom: "1px solid #c8a96e22",
          backgroundColor: "#07070b",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #c8a96e, #e8d5a8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            AcadémIA Pro
          </div>
          <div
            style={{
              height: "16px",
              width: "1px",
              backgroundColor: "#c8a96e44",
            }}
          />
          <div style={{ fontSize: "12px", color: "#9990a0" }}>
            Session{" "}
            <span style={{ color: "#c8a96e", fontFamily: "monospace" }}>
              #{params.sessionId}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#0f0f16",
              border: "1px solid #c8a96e33",
              borderRadius: "20px",
              padding: "6px 14px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isConnected ? "#4ade80" : "#f87171",
                animation: isConnected ? "blink 2s infinite" : "none",
              }}
            />
            <span style={{ fontSize: "12px", color: "#a09898", fontVariantNumeric: "tabular-nums" }}>
              {formatDuration(duration)}
            </span>
          </div>

          <button
            onClick={handleQuit}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #ef444466",
              color: "#ef4444",
              padding: "7px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              letterSpacing: "0.3px",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ef444422";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef444466";
            }}
          >
            ✕ Quitter
          </button>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          gap: "0px",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: "#08080e",
              margin: "20px 20px 20px 20px",
              borderRadius: "16px",
              border: "1px solid #c8a96e1a",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              minHeight: "320px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "radial-gradient(ellipse at center, #c8a96e08 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                backgroundColor: "#c8a96e18",
                border: "1px solid #c8a96e44",
                borderRadius: "8px",
                padding: "5px 12px",
                fontSize: "11px",
                color: "#c8a96e",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              ● Live
            </div>

            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                backgroundColor: "#0f0f18",
                border: "1px solid #c8a96e22",
                borderRadius: "8px",
                padding: "5px 12px",
                fontSize: "11px",
                color: "#9990a0",
              }}
            >
              Daily.co — Intégration à venir
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
              <div style={{ position: "relative", width: "120px", height: "120px" }}>
                <div style={avatarPulseStyle} />
                <div
                  style={{
                    position: "absolute",
                    inset: "8px",
                    borderRadius: "50%",
                    border: "1px solid #c8a96e33",
                    animation: "pulse 2s infinite 0.3s",
                  }}
                />
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #1a1520 0%, #0d0d18 100%)",
                    border: "2px solid #c8a96e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "48px",
                    animation: "glow 3s infinite",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  🎓
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #c8a96e, #e8d5a8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: "6px",
                  }}
                >
                  AcadémIA — Professeur Virtuel
                </div>
                <div style={{ fontSize: "13px", color: "#706880", maxWidth: "340px", lineHeight: "1.6" }}>
                  Algèbre linéaire · Niveau Intermédiaire
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {["Micro", "Caméra", "Partage d'écran"].map(tool => (
                  <button
                    key={tool}
                    style={{
                      backgroundColor: "#0f0f18",
                      border: "1px solid #c8a96e33",
                      color: "#a09898",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#c8a96e77";
                      (e.currentTarget as HTMLButtonElement).style.color = "#c8a96e";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#c8a96e33";
                      (e.currentTarget as HTMLButtonElement).style.color = "#a09898";
                    }}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            width: "340px",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #c8a96e11",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #c8a96e11",
              backgroundColor: "#07070b",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#c8a96e",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Participants
              </span>
              <span
                style={{
                  backgroundColor: "#c8a96e22",
                  color: "#c8a96e",
                  borderRadius: "10px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 700,
}}}