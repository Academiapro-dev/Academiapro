"use client";
import { useState } from "react";

const SESSIONS = [
  { id: 1, titre: "Prompt Engineering Avance", date: "Mardi 17 juin 2026", heure: "20h00", formateur: "Agent Expert Claude", places: 12, niveau: "Intermediaire" },
  { id: 2, titre: "Automatisation No-Code avec IA", date: "Jeudi 19 juin 2026", heure: "20h00", formateur: "Agent Expert No-Code", places: 8, niveau: "Debutant" },
  { id: 3, titre: "Marketing Digital x IA", date: "Mardi 24 juin 2026", heure: "20h00", formateur: "Agent Expert Marketing", places: 15, niveau: "Tous niveaux" },
  { id: 4, titre: "Apps Natives avec IA", date: "Jeudi 26 juin 2026", heure: "20h00", formateur: "Agent Expert Dev", places: 10, niveau: "Avance" },
];

export default function ClasseVirtuellePage() {
  const [sessionActive, setSessionActive] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [participants] = useState(Math.floor(Math.random() * 8) + 3);

  async function envoyerMessage() {
    if (!message.trim() || !sessionActive) return;
    const userMsg = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/agent-tuteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          formation_titre: sessionActive.titre,
          formation_code: "CLASSE_VIRTUELLE"
        }),
      });
      const data = await res.json();
      setChat(prev => [...prev, { role: "agent", text: data.reply }]);
    } catch (e) {
      setChat(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
  }

  if (sessionActive) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
        <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(200,169,110,0.3)" }}>
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0, fontSize: "16px" }}>{sessionActive.titre}</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", margin: "3px 0 0", fontSize: "12px" }}>{sessionActive.date} - {sessionActive.heure}</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>
              LIVE - {participants} participants
            </span>
            <button
              onClick={() => { setSessionActive(null); setChat([]); }}
              style={{ background: "rgba(255,0,0,0.2)", color: "#ff6b6b", border: "1px solid rgba(255,0,0,0.3)", padding: "6px 14px", borderRadius: "8px", cursor: "pointer" }}
            >
              Quitter
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", height: "calc(100vh - 70px)" }}>
          <div style={{ display: "flex", flexDirection: "column", padding: "20px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", flex: 1, marginBottom: "15px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "linear-gradient(135deg,#c8a96e,#a07840)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "50px", marginBottom: "15px", border: "3px solid #c8a96e" }}>
                  🤖
                </div>
                <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 5px" }}>Avatar IA Formateur</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>{sessionActive.formateur}</p>
                <div style={{ marginTop: "15px", display: "flex", gap: "8px" }}>
                  <span style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>En direct</span>
                  <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>HeyGen bientot disponible</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Posez votre question en direct..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && envoyerMessage()}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
              />
              <button
                onClick={envoyerMessage}
                disabled={loading}
                style={{ padding: "12px 20px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Envoyer
              </button>
            </div>
          </div>

          <div style={{ borderLeft: "1px solid rgba(200,169,110,0.2)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "15px", borderBottom: "1px solid rgba(200,169,110,0.2)" }}>
              <h3 style={{ color: "#c8a96e", margin: 0, fontSize: "14px" }}>Chat de la classe</h3>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {chat.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center" }}>
                  Bienvenue dans la classe virtuelle. Posez vos questions !
                </p>
              )}
              {chat.map((msg, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "3px" }}>
                    {msg.role === "user" ? "Vous" : "Formateur IA"}
                  </span>
                  <div style={{
                    background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)",
                    color: msg.role === "user" ? "#050508" : "#fff",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    maxWidth: "85%",
                    fontSize: "13px",
                    lineHeight: "1.5"
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ color: "#c8a96e", fontSize: "12px", textAlign: "center" }}>
                  Formateur IA repond...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", marginBottom: "10px" }}>ACADEMIAPRO</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.5rem", marginBottom: "10px" }}>
          Classes Virtuelles Live
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)" }}>
          Sessions avec Avatar IA - Mardis et Jeudis a 20h
        </p>
        <div style={{ display: "inline-flex", gap: "20px", marginTop: "15px" }}>
          <span style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>
            Chat IA disponible
          </span>
          <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>
            Avatar HeyGen bientot
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", maxWidth: "1000px", margin: "0 auto 40px" }}>
        {SESSIONS.map(session => (
          <div key={session.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", padding: "15px 20px" }}>
              <h3 style={{ color: "#fff", fontFamily: "Georgia,serif", margin: 0, fontSize: "16px" }}>{session.titre}</h3>
            </div>
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
                <span style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>
                  {session.date}
                </span>
                <span style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>
                  {session.heure}
                </span>
                <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>
                  {session.niveau}
                </span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 15px" }}>
                Formateur : {session.formateur}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                  {session.places} places disponibles
                </span>
              </div>
              <button
                onClick={() => { setSessionActive(session); setChat([]); }}
                style={{ width: "100%", padding: "12px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Rejoindre la session
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0 }}>Comment ca marche ?</h2>
          <div style={{ display: "grid", gap: "15px" }}>
            {[
              { icon: "1", titre: "Choisissez une session", desc: "Selectionnez la classe virtuelle qui correspond a votre formation" },
              { icon: "2", titre: "Rejoignez en direct", desc: "Acces instantane depuis votre navigateur - aucune installation requise" },
              { icon: "3", titre: "Interagissez avec l avatar IA", desc: "Posez vos questions en direct - le formateur IA repond en temps reel" },
              { icon: "4", titre: "Replay disponible 48h apres", desc: "Toutes les sessions sont enregistrees et disponibles dans votre espace" },
            ].map(item => (
              <div key={item.icon} style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#c8a96e", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <h4 style={{ color: "#c8a96e", margin: "0 0 3px", fontSize: "14px" }}>{item.titre}</h4>
                  <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "13px" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
