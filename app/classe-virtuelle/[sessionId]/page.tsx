export default function ClasseVirtuelle({ params }: { params: { sessionId: string } }) {
  const [messages, setMessages] = React.useState<Array<{ id: number; auteur: string; texte: string; temps: string; estIA: boolean }>>([
    { id: 1, auteur: "AcadémIA Pro", texte: "Bienvenue dans cette session live. Aujourd'hui nous allons explorer les fondamentaux de l'algèbre linéaire.", temps: "14:02", estIA: true },
    { id: 2, auteur: "Sophie M.", texte: "Bonjour ! Très enthousiaste pour cette session.", temps: "14:03", estIA: false },
    { id: 3, auteur: "Thomas K.", texte: "Est-ce qu'on abordera les matrices de transformation ?", temps: "14:04", estIA: false },
    { id: 4, auteur: "AcadémIA Pro", texte: "Absolument Thomas. Les matrices de transformation seront au cœur de notre deuxième partie. Excellente anticipation.", temps: "14:04", estIA: true },
  ]);

  const [messageInput, setMessageInput] = React.useState("");
  const [statutSession] = React.useState<"en_cours" | "a_venir" | "terminee">("en_cours");
  const [duree, setDuree] = React.useState(2847);
  const [participants] = React.useState([
    { id: 1, nom: "Sophie M.", actif: true, avatar: "SM" },
    { id: 2, nom: "Thomas K.", actif: true, avatar: "TK" },
    { id: 3, nom: "Léa R.", actif: true, avatar: "LR" },
    { id: 4, nom: "Marc D.", actif: false, avatar: "MD" },
    { id: 5, nom: "Inès B.", actif: true, avatar: "IB" },
    { id: 6, nom: "Paul V.", actif: true, avatar: "PV" },
  ]);
  const [panneauActif, setPanneauActif] = React.useState<"chat" | "participants">("chat");
  const [iaSpeaking, setIaSpeaking] = React.useState(true);
  const [quitterConfirm, setQuitterConfirm] = React.useState(false);
  const chatRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (statutSession === "en_cours") {
        setDuree(d => d + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [statutSession]);

  React.useEffect(() => {
    const pulse = setInterval(() => {
      setIaSpeaking(s => !s);
    }, 1800);
    return () => clearInterval(pulse);
  }, []);

  React.useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const formaterDuree = (secondes: number) => {
    const h = Math.floor(secondes / 3600);
    const m = Math.floor((secondes % 3600) / 60);
    const s = secondes % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const envoyerMessage = () => {
    if (!messageInput.trim()) return;
    const nouveau = {
      id: messages.length + 1,
      auteur: "Vous",
      texte: messageInput,
      temps: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      estIA: false,
    };
    setMessages(prev => [...prev, nouveau]);
    setMessageInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        auteur: "AcadémIA Pro",
        texte: "Très bonne question. Laissez-moi vous expliquer ce concept avec précision.",
        temps: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        estIA: true,
      }]);
    }, 1500);
  };

  const statutConfig = {
    en_cours: { label: "En cours", couleur: "#22c55e", bg: "rgba(34,197,94,0.15)" },
    a_venir: { label: "À venir", couleur: "#c8a96e", bg: "rgba(200,169,110,0.15)" },
    terminee: { label: "Terminée", couleur: "#6b7280", bg: "rgba(107,114,128,0.15)" },
  };

  const statut = statutConfig[statutSession];

  return (
    React.createElement("div", {
      style: {
        minHeight: "100vh",
        backgroundColor: "#050508",
        color: "#e8e0d0",
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
      }
    },
      React.createElement("style", null, `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #c8a96e44; border-radius: 2px; }
        input::placeholder { color: #4a4a5a !important; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} }
        @keyframes wave1 { 0%,100%{height:8px} 50%{height:24px} }
        @keyframes wave2 { 0%,100%{height:16px} 50%{height:8px} }
        @keyframes wave3 { 0%,100%{height:12px} 50%{height:28px} }
        @keyframes wave4 { 0%,100%{height:20px} 50%{height:10px} }
        @keyframes wave5 { 0%,100%{height:8px} 50%{height:22px} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(200,169,110,0.3)} 50%{box-shadow:0 0 40px rgba(200,169,110,0.6)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbitSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.5);opacity:0} }
      `),

      React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "64px",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          backgroundColor: "rgba(5,5,8,0.95)",
          backdropFilter: "blur(20px)",
          position: "sticky" as const,
          top: 0,
          zIndex: 100,
          flexShrink: 0,
        }
      },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "16px" } },
          React.createElement("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }
          },
            React.createElement("div", {
              style: {
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #c8a96e, #8b6914)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "700",
                color: "#050508",
              }
            }, "A"),
            React.createElement("span", {
              style: { fontSize: "16px", fontWeight: "700", letterSpacing: "-0.3px", color: "#c8a96e" }
            }, "AcadémIA Pro"),
          ),
          React.createElement("div", { style: { width: "1px", height: "24px", backgroundColor: "rgba(200,169,110,0.2)" } }),
          React.createElement("div", {
            style: {
              fontSize: "13px",
              color: "#8a8090",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
            }
          }, `Session ${params.sessionId}`),
        ),

        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "12px" } },
          React.createElement("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "20px",
              backgroundColor: statut.bg,
              border: `1px solid ${statut.couleur}44`,
            }
          },
            statutSession === "en_cours" && React.createElement("div", {
              style: {
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: statut.couleur,
                animation: "pulse 1.5s ease-in-out infinite",
              }
            }),
            React.createElement("span", {
              style: { fontSize: "12px", fontWeight: "600", color: statut.couleur, letterSpacing: "0.5px" }
            }, statut.label),
          ),

          statutSession === "en_cours" && React.createElement("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "20px",
              backgroundColor: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.2)",
            }
          },
            React.createElement("span", { style: { fontSize: "11px", color: "#8a8090" } }, "⏱"),
            React.createElement("span", {
              style: { fontSize: "13px", fontWeight: "600", color: "#c8a96e", fontVariantNumeric: "tabular-nums" }
            }, formaterDuree(duree)),
          ),

          React.createElement("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "20px",
              backgroundColor: "rgba(200,169,110,0.06)",
              border: "1px solid rgba(200,169,110,0.15)",
            }
          },
            React.createElement("span", { style: { fontSize: "13px" } }, "👥"),
            React.createElement("span", {
              style: { fontSize: "13px", fontWeight: "500", color: "#b8a888" }
            }, participants.filter(p => p.actif).length),
          ),
        ),

        React.createElement("button", {
          onClick: () => setQuitterConfirm(true),
          style: {
            padding: "8px 18px",
            borderRadius: "10px",
            border: "1px solid rgba(239,68,68,0.4)",
            backgroundColor: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            letterSpacing: "0.2px",
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.2)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.7)";
          },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.1)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.4)";
          },
        }, "Quitter"),
      ),

      React.createElement("div", {
        style: {
          flex: 1,
          display: "flex",
          overflow: "hidden",
          height: "calc(100vh - 64px)",
        }
      },

        React.createElement("div", {
          style: {
            flex: 1,
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            justifyContent: "center",
            padding: "32px",
            position: "relative" as const,
            overflow: "hidden",
            background: "radial-gradient(ellipse at center, #0d0d14 0%, #050508 70%)",
          }
        },
          React.createElement("div", {
            style: {
              position: "absolute" as const,
              inset: 0,
              backgroundImage: "radial-gradient(rgba(200,169,110,0.03) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }
          }),

          React.createElement("div", {
            style: {
              position: "relative" as const,
              width: "200px",
              height: "200px",
              marginBottom: "32px",
            }
          },
            React.createElement("div", {
              style: {
                position: "absolute" as const,
                inset: "-20px",
                borderRadius: "50%",
                border: "1px solid rgba(200,169,110,0.1)",
                animation: "orbitSlow 12s linear infinite",
              }
            }),
            React.createElement("div", {
              style: {
                position: "absolute" as const,
                inset: "-40px",
                borderRadius: "50%",
                border: "1px solid rgba(200,169,110,0.06)",
                animation: "orbitSlow 20s linear infinite reverse",
              }
            }),

            iaSpeaking && React.createElement("div", {
              style: {
                position: "absolute" as const,
                inset: 0,
                borderRadius: "50%",
                border: "2px solid rgba(200,169,110,0.