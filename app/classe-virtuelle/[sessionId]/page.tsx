"use client";
import { useState } from "react";

export default function ClasseVirtuallePage({ sessionId = "SESSION-2024-001" }) {
  const [messages, setMessages] = useState([
    { id: 1, auteur: "IA Professeur", texte: "Bienvenue dans la session live. Posez vos questions.", type: "ia", temps: "14:02" },
    { id: 2, auteur: "Sophie M.", texte: "Bonjour à tous !", type: "participant", temps: "14:03" },
    { id: 3, auteur: "Thomas K.", texte: "Prêt pour le cours d'aujourd'hui.", type: "participant", temps: "14:03" },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [micActif, setMicActif] = useState(false);
  const [camActif, setCamActif] = useState(true);
  const [mainLevee, setMainLevee] = useState(false);

  const participants = [
    { id: 1, nom: "Sophie M.", initiales: "SM", actif: true, parle: false },
    { id: 2, nom: "Thomas K.", initiales: "TK", actif: true, parle: true },
    { id: 3, nom: "Amara D.", initiales: "AD", actif: false, parle: false },
    { id: 4, nom: "Lucas P.", initiales: "LP", actif: true, parle: false },
    { id: 5, nom: "Nina R.", initiales: "NR", actif: true, parle: false },
  ];

  function envoyerMessage() {
    if (!inputMessage.trim()) return;
    const nouveau = {
      id: messages.length + 1,
      auteur: "Vous",
      texte: inputMessage,
      type: "moi",
      temps: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, nouveau]);
    setInputMessage("");
  }

  function gererTouche(e) {
    if (e.key === "Enter") envoyerMessage();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>

      {/* BARRE SUPERIEURE */}
      <div style={{ background: "linear-gradient(90deg, #0d0d14, #12121e)", borderBottom: "1px solid rgba(200,169,110,0.25)", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #c8a96e, #a07840)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "16px" }}>🎓</span>
          </div>
          <div>
            <div style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>CLASSE VIRTUELLE LIVE</div>
            <div style={{ color: "rgba(200,169,110,0.5)", fontSize: "11px" }}>Session ID : {sessionId}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "8px", background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "20px", padding: "3px 10px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ff5050", boxShadow: "0 0 6px #ff5050", animation: "pulse 1.5s infinite" }} />
            <span style={{ color: "#ff5050", fontSize: "11px", fontWeight: "600" }}>EN DIRECT</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ color: "rgba(200,169,110,0.6)", fontSize: "12px" }}>
            <span style={{ marginRight: "4px" }}>⏱</span>
            <span>00:47:23</span>
          </div>
          <button
            style={{ background: "linear-gradient(135deg, #c8300a, #8b1a00)", border: "none", borderRadius: "8px", padding: "8px 18px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.5px" }}
          >
            <span>✕</span> Quitter
          </button>
        </div>
      </div>

      {/* CORPS PRINCIPAL */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ZONE VIDEO PRINCIPALE */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px", gap: "16px" }}>

          {/* VIDEO IA PROFESSEUR */}
          <div style={{ flex: 1, background: "linear-gradient(145deg, #0a0a12, #0f0f1a)", borderRadius: "16px", border: "1px solid rgba(200,169,110,0.2)", position: "relative", overflow: "hidden", minHeight: "300px" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(200,169,110,0.04) 0%, transparent 70%)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #1a1a2e, #16213e)", border: "3px solid rgba(200,169,110,0.5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontSize: "48px" }}>🤖</span>
                <div style={{ position: "absolute", inset: "-6px", borderRadius: "50%", border: "2px solid rgba(200,169,110,0.2)", animation: "none" }} />
                <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "16px", height: "16px", borderRadius: "50%", background: "#22c55e", border: "2px solid #050508" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#c8a96e", fontSize: "18px", fontWeight: "700" }}>IA Professeur</div>
                <div style={{ color: "rgba(200,169,110,0.5)", fontSize: "12px", marginTop: "4px" }}>Intelligence Artificielle — Enseignant Principal</div>
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                {[1,2,3,4,5].map(function(i) {
                  return (
                    <div key={i} style={{ width: "4px", background: "rgba(200,169,110,0.6)", borderRadius: "2px", height: String(8 + Math.random() * 20) + "px", alignSelf: "flex-end" }} />
                  );
                })}
              </div>
            </div>

            <div style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(0,0,0,0.6)", borderRadius: "8px", padding: "6px 12px", border: "1px solid rgba(200,169,110,0.2)" }}>
              <span style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "600" }}>🤖 IA Professeur</span>
            </div>

            <div style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(34,197,94,0.15)", borderRadius: "8px", padding: "5px 10px", border: "1px solid rgba(34,197,94,0.3)" }}>
              <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: "600" }}>● PRÉSENTATION</span>
            </div>
          </div>

          {/* GRILLE PARTICIPANTS VIDEO */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", flexShrink: 0 }}>
            {participants.map(function(p) {
              return (
                <div key={p.id} style={{ background: p.parle ? "rgba(200,169,110,0.08)" : "rgba(255,255,255,0.02)", borderRadius: "12px", border: p.parle ? "1.5px solid rgba(200,169,110,0.5)" : "1px solid rgba(255,255,255,0.07)", padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", position: "relative" }}>
                  {p.parle && (
                    <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "12px", height: "12px", borderRadius: "50%", background: "#c8a96e", border: "2px solid #050508" }} />
                  )}
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: p.actif ? "linear-gradient(135deg, #c8a96e, #8b6914)" : "linear-gradient(135deg, #333, #222)", display: "flex", alignItems: "center", justifyContent: "center", border: p.parle ? "2px solid #c8a96e" : "2px solid transparent" }}>
                    <span style={{ color: p.actif ? "#050508" : "#666", fontWeight: "800", fontSize: "13px" }}>{p.initiales}</span>
                  </div>
                  <span style={{ color: p.actif ? "rgba(200,169,110,0.9)" : "rgba(255,255,255,0.3)", fontSize: "11px", fontWeight: "500", textAlign: "center" }}>{p.nom}</span>
                  {!p.actif && (
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>hors ligne</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* BARRE DE CONTROLES */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexShrink: 0 }}>

            <button
              onClick={function() { setMicActif(!micActif); }}
              style={{ width: "50px", height: "50px", borderRadius: "50%", border: "none", background: micActif ? "linear-gradient(135deg, #c8a96e, #a07840)" : "rgba(255,80,80,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", border: micActif ? "none" : "1px solid rgba(255,80,80,0.4)" }}
            >
              {micActif ? "🎤" : "🔇"}
            </button>

            <button
              onClick={function() { setCamActif(!camActif); }}
              style={{ width: "50px", height: "50px", borderRadius: "50%", border: "none", background: camActif ? "linear-gradient(135deg, #c8a96e, #a07840)" : "rgba(255,80,80,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}
            >
              {camActif ? "📷" : "🚫"}
            </button>

            <button
              style={{ width: "50px", height: "50px", borderRadius: "50%", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(200,169,110,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}
            >
              🖥
            </button>

            <div style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.1)" }} />

            <button
              onClick={function() { setMainLevee(!mainLevee); }}
              style={{ padding: "12px 20px", borderRadius: "10px", border: mainLevee ? "1px solid rgba(200,169,110,0.6)" : "1px solid rgba(255,255,255,0.1)", background: mainLevee ? "rgba(200,169,110,0.15)" : "transparent", cursor: "pointer", color: mainLevee ? "#c8a96e" : "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
            >
              ✋ {mainLevee ? "Main levée" : "Lever la main"}
            </button>

            <button
              style={{ padding: "12px 20px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
            >
              📊 Sondage
            </button>

            <button
              style={{ padding: "12px 20px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
            >
              📝 Notes
            </button>

          </div>
        </div>

        {/* PANNEAU CHAT */}
        <div style={{ width: "320px", background: "rgba(255,255,255,0.015)", borderLeft: "1px solid rgba(200,169,110,0.15)", display: "flex", flexDirection: "column", flexShrink: 0 }}>