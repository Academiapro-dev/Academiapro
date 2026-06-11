export default function VideoSessionPage({ params }: { params: { sessionId: string } }) {
  const [sessionTime, setSessionTime] = React.useState(0);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isCameraOff, setIsCameraOff] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<Array<{ id: string; sender: string; text: string; time: string }>>([
    { id: "1", sender: "IA", text: "Bonjour, je suis Dr. Aria. Comment vous sentez-vous aujourd'hui ?", time: "14:00" },
  ]);
  const [inputMessage, setInputMessage] = React.useState("");
  const [sessionNotes, setSessionNotes] = React.useState("");
  const [showReplay, setShowReplay] = React.useState(false);
  const [sessionEnded, setSessionEnded] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }, 2000);
    return () => {
      clearTimeout(timer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: "Vous",
      text: inputMessage,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    setTimeout(() => {
      const responses = [
        "Je comprends ce que vous ressentez. Pouvez-vous m'en dire plus ?",
        "C'est une observation très pertinente. Comment cela vous affecte-t-il au quotidien ?",
        "Nous allons explorer cela ensemble. Prenez votre temps.",
        "Votre ressenti est tout à fait valide. Continuons sur cette voie.",
      ];
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: "IA",
        text: responses[Math.floor(Math.random() * responses.length)],
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    }, 1500);
  };

  const handleEndSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionEnded(true);
    setIsRecording(false);
    setTimeout(() => setShowReplay(true), 1000);
  };

  if (sessionEnded) {
    return (
      React.createElement("div", {
        style: {
          minHeight: "100vh",
          backgroundColor: "#050508",
          color: "#ffffff",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }
      },
        React.createElement("div", {
          style: {
            width: "100%",
            maxWidth: "900px",
          }
        },
          React.createElement("div", {
            style: {
              textAlign: "center" as const,
              marginBottom: "48px",
            }
          },
            React.createElement("div", {
              style: {
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: "36px",
              }
            }, "✓"),
            React.createElement("h1", {
              style: {
                fontSize: "32px",
                fontWeight: "300",
                color: "#c8a96e",
                letterSpacing: "2px",
                marginBottom: "8px",
              }
            }, "SÉANCE TERMINÉE"),
            React.createElement("p", {
              style: { color: "rgba(255,255,255,0.5)", fontSize: "14px" }
            }, `Session ID: ${params.sessionId}`),
            React.createElement("div", {
              style: {
                display: "inline-block",
                marginTop: "16px",
                padding: "8px 24px",
                border: "1px solid rgba(200,169,110,0.3)",
                borderRadius: "20px",
                fontSize: "14px",
                color: "#c8a96e",
              }
            }, `Durée totale : ${formatTime(sessionTime)}`)
          ),

          React.createElement("div", {
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "32px",
            }
          },
            React.createElement("div", {
              style: {
                background: "rgba(200,169,110,0.05)",
                border: "1px solid rgba(200,169,110,0.15)",
                borderRadius: "16px",
                padding: "24px",
              }
            },
              React.createElement("h3", {
                style: {
                  color: "#c8a96e",
                  fontSize: "12px",
                  letterSpacing: "2px",
                  marginBottom: "16px",
                  fontWeight: "600",
                }
              }, "INFORMATIONS SÉANCE"),
              React.createElement("div", {
                style: { display: "flex", flexDirection: "column" as const, gap: "12px" }
              },
                React.createElement("div", {
                  style: { display: "flex", justifyContent: "space-between" }
                },
                  React.createElement("span", { style: { color: "rgba(255,255,255,0.5)", fontSize: "14px" } }, "Thérapeute IA"),
                  React.createElement("span", { style: { color: "#ffffff", fontSize: "14px" } }, "Dr. Aria Luminos")
                ),
                React.createElement("div", {
                  style: { display: "flex", justifyContent: "space-between" }
                },
                  React.createElement("span", { style: { color: "rgba(255,255,255,0.5)", fontSize: "14px" } }, "Spécialité"),
                  React.createElement("span", { style: { color: "#ffffff", fontSize: "14px" } }, "Psychologie Cognitive")
                ),
                React.createElement("div", {
                  style: { display: "flex", justifyContent: "space-between" }
                },
                  React.createElement("span", { style: { color: "rgba(255,255,255,0.5)", fontSize: "14px" } }, "Date"),
                  React.createElement("span", { style: { color: "#ffffff", fontSize: "14px" } }, new Date().toLocaleDateString("fr-FR"))
                ),
                React.createElement("div", {
                  style: { display: "flex", justifyContent: "space-between" }
                },
                  React.createElement("span", { style: { color: "rgba(255,255,255,0.5)", fontSize: "14px" } }, "Messages échangés"),
                  React.createElement("span", { style: { color: "#ffffff", fontSize: "14px" } }, chatMessages.length)
                )
              )
            ),

            React.createElement("div", {
              style: {
                background: "rgba(200,169,110,0.05)",
                border: "1px solid rgba(200,169,110,0.15)",
                borderRadius: "16px",
                padding: "24px",
              }
            },
              React.createElement("h3", {
                style: {
                  color: "#c8a96e",
                  fontSize: "12px",
                  letterSpacing: "2px",
                  marginBottom: "16px",
                  fontWeight: "600",
                }
              }, "NOTES DE SÉANCE"),
              sessionNotes ? (
                React.createElement("p", {
                  style: {
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }
                }, sessionNotes)
              ) : (
                React.createElement("p", {
                  style: { color: "rgba(255,255,255,0.3)", fontSize: "14px", fontStyle: "italic" }
                }, "Aucune note prise durant la séance.")
              )
            )
          ),

          showReplay && (
            React.createElement("div", {
              style: {
                background: "rgba(200,169,110,0.05)",
                border: "1px solid rgba(200,169,110,0.15)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "32px",
              }
            },
              React.createElement("h3", {
                style: {
                  color: "#c8a96e",
                  fontSize: "12px",
                  letterSpacing: "2px",
                  marginBottom: "20px",
                  fontWeight: "600",
                }
              }, "REPLAY DISPONIBLE"),
              React.createElement("div", {
                style: {
                  background: "#0a0a10",
                  borderRadius: "12px",
                  aspectRatio: "16/9",
                  display: "flex",
                  flexDirection: "column" as const,
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(200,169,110,0.1)",
                  cursor: "pointer",
                  position: "relative" as const,
                  overflow: "hidden",
                }
              },
                React.createElement("div", {
                  style: {
                    position: "absolute" as const,
                    inset: 0,
                    background: "radial-gradient(circle at center, rgba(200,169,110,0.08) 0%, transparent 70%)",
                  }
                }),
                React.createElement("div", {
                  style: {
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "rgba(200,169,110,0.15)",
                    border: "2px solid rgba(200,169,110,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    marginBottom: "16px",
                    zIndex: 1,
                  }
                }, "▶"),
                React.createElement("p", {
                  style: {
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "14px",
                    zIndex: 1,
                  }
                }, "Cliquez pour visionner l'enregistrement"),
                React.createElement("p", {
                  style: {
                    color: "rgba(200,169,110,0.5)",
                    fontSize: "12px",
                    marginTop: "8px",
                    zIndex: 1,
                  }
                }, `Durée : ${formatTime(sessionTime)}`)
              ),
              React.createElement("div", {
                style: {
                  display: "flex",
                  gap: "12px",
                  marginTop: "16px",
                }
              },
                React.createElement("button", {
                  style: {
                    flex: 1,
                    padding: "12px",
                    background: "rgba(200,169,110,0.1)",
                    border: "1px solid rgba(200,169,110,0.3)",
                    borderRadius: "8px",
                    color: "#c8a96e",
                    fontSize: "13px",
                    cursor: "pointer",
                    letterSpacing: "1px",
                  }
                }, "⬇ TÉLÉCHARGER"),
                React.createElement("button", {
                  style: {
                    flex: 1,
                    padding: "12px",
                    background: "rgba(200,169,110,0.1)",
                    border: "1px solid rgba(200,169,110,0.3)",
                    borderRadius: "8px",
                    color: "#c8a96e",
                    fontSize: "13px",
                    cursor: "pointer",
                    letterSpacing: "1px",
                  }
                }, "📤 PARTAGER"),
                React.createElement("button", {
                  style: {
                    flex: 1,
                    padding: "12px",
                    background: "rgba(200,169,110,0.1)",
                    border: "1px solid rgba(200,169,110,0.3)",
                    borderRadius: "8px",
                    color: "#c8a96e",
                    fontSize: "13px",
                    cursor: "pointer",
                    letterSpacing: "1px",
                  }
                }, "📋 TRANSCRIRE")
              )
            )
          ),

          React.createElement("div", {
            style: { display: "flex", gap: "16px", justifyContent: "center" }
          },
            React.createElement("button", {
              style: {
                padding: "14px 32px",
                background: "transparent",
                border: "1px solid rgba(200,169,110,0.4)",
                borderRadius: "8px",
                color: "#c8a96e",
                fontSize: "13px",
                letterSpacing: "2px",
                cursor: "pointer",
              }
            }, "NOUVELLE SÉANCE"),
            React.createElement("button", {
              style: {
                padding: "14px 32px",
                background: "linear-gradient(135deg, #c8a96e, #b8934e)",
                border: "none",
                borderRadius: "8px",
                color: "#050508",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "2px",
                cursor: "pointer",
              }
            }, "TABLEAU DE BORD")
          )
        )
      )
    );
  }

  return (
    React.createElement("div", {
      style: