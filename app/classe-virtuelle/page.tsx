export default function ClasseVirtuelle() {
  const sessions = [
    {
      id: 1,
      titre: "Mathématiques Avancées - Intégrales",
      professeur: "Prof. AcadémIA",
      date: "Aujourd'hui",
      heure: "14:00",
      duree: "90 min",
      participants: 24,
      statut: "live",
      matiere: "Mathématiques",
    },
    {
      id: 2,
      titre: "Physique Quantique - Introduction",
      professeur: "Prof. AcadémIA",
      date: "Demain",
      heure: "10:00",
      duree: "60 min",
      participants: 18,
      statut: "upcoming",
      matiere: "Physique",
    },
    {
      id: 3,
      titre: "Littérature Française - Analyse",
      professeur: "Prof. AcadémIA",
      date: "Mer 15 Jan",
      heure: "16:00",
      duree: "75 min",
      participants: 31,
      statut: "upcoming",
      matiere: "Littérature",
    },
    {
      id: 4,
      titre: "Chimie Organique - Molécules",
      professeur: "Prof. AcadémIA",
      date: "Jeu 16 Jan",
      heure: "09:00",
      duree: "90 min",
      participants: 22,
      statut: "upcoming",
      matiere: "Chimie",
    },
  ];

  const messages = [
    {
      id: 1,
      auteur: "Marie L.",
      texte: "Pouvez-vous réexpliquer la dérivée partielle ?",
      temps: "14:23",
      avatar: "M",
    },
    {
      id: 2,
      auteur: "Thomas R.",
      texte: "Je ne comprends pas l'étape 3 de l'exemple",
      temps: "14:25",
      avatar: "T",
    },
    {
      id: 3,
      auteur: "Prof. AcadémIA",
      texte: "Bien sûr ! La dérivée partielle traite les autres variables comme des constantes. Voici un exemple simplifié...",
      temps: "14:26",
      avatar: "AI",
      isAI: true,
    },
    {
      id: 4,
      auteur: "Sophie M.",
      texte: "Merci, c'est beaucoup plus clair maintenant !",
      temps: "14:27",
      avatar: "S",
    },
    {
      id: 5,
      auteur: "Lucas D.",
      texte: "Est-ce que cela s'applique aussi aux intégrales doubles ?",
      temps: "14:28",
      avatar: "L",
    },
  ];

  const participantsList = [
    { nom: "Marie L.", statut: "active", question: true },
    { nom: "Thomas R.", statut: "active", question: false },
    { nom: "Sophie M.", statut: "active", question: false },
    { nom: "Lucas D.", statut: "active", question: true },
    { nom: "Emma B.", statut: "idle", question: false },
    { nom: "Noah P.", statut: "active", question: false },
    { nom: "Chloé V.", statut: "active", question: false },
    { nom: "Antoine G.", statut: "idle", question: false },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        color: "#ffffff",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: "rgba(5, 5, 8, 0.95)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "70px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "800",
                color: "#050508",
              }}
            >
              A
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                AcadémIA Pro
              </div>
              <div style={{ fontSize: "11px", color: "rgba(200, 169, 110, 0.6)", letterSpacing: "2px" }}>
                CLASSE VIRTUELLE
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["Dashboard", "Mes Cours", "Planning", "Résultats"].map((item) => (
              <button
                key={item}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "14px",
                  cursor: "pointer",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "rgba(200, 169, 110, 0.1)",
                borderRadius: "20px",
                border: "1px solid rgba(200, 169, 110, 0.3)",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ fontSize: "12px", color: "#c8a96e" }}>Session Live</span>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
                color: "#050508",
              }}
            >
              É
            </div>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: "70px", maxWidth: "1400px", margin: "0 auto", padding: "90px 24px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", marginBottom: "24px" }}>
          <div
            style={{
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(200, 169, 110, 0.3)",
              position: "relative",
              background: "linear-gradient(135deg, rgba(200, 169, 110, 0.05), rgba(5, 5, 8, 0.8))",
              minHeight: "480px",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at 30% 50%, rgba(200, 169, 110, 0.08) 0%, transparent 70%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                right: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(5, 5, 8, 0.8)",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid rgba(200, 169, 110, 0.3)",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                  }}
                />
                <span style={{ fontSize: "12px", color: "#c8a96e", fontWeight: "600" }}>LIVE</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>• 00:47:23</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "rgba(5, 5, 8, 0.8)",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>👥 24 participants</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "480px",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "180px",
                  height: "180px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "-20px",
                    borderRadius: "50%",
                    border: "2px solid rgba(200, 169, 110, 0.2)",
                    animation: "spin 8s linear infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: "-10px",
                    borderRadius: "50%",
                    border: "1px solid rgba(200, 169, 110, 0.15)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(200, 169, 110, 0.15), rgba(200, 169, 110, 0.05))",
                    border: "2px solid rgba(200, 169, 110, 0.4)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #1a1408, #0d0b06)",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "60px", lineHeight: 1 }}>🧠</div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#c8a96e",
                        fontWeight: "600",
                        letterSpacing: "1px",
                        marginTop: "4px",
                      }}
                    >
                      AI PROF
                    </div>
                  </div>
                </div>

                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#c8a96e",
                      opacity: 0.6,
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${i * 60}deg) translateX(100px) translateY(-50%)`,
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  textAlign: "center",
                  maxWidth: "400px",
                  padding: "0 20px",
                }}
              >
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: "700",
                    color: "#ffffff",
                    marginBottom: "8px",
                    margin: "0 0 8px 0",
                  }}
                >
                  Prof. AcadémIA
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.5)",
                    margin: "0 0 16px 0",
                  }}
                >
                  Mathématiques Avancées — Intégrales doubles et applications
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {["∫∫ f(x,y)dxdy", "Théorème de Fubini", "Applications"].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "rgba(200, 169, 110, 0.1)",
                        border: "1px solid rgba(200, 169, 110, 0.3)",
                        borderRadius: "12px",
                        fontSize: "11px",
                        color: "#c8a96e",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "16px