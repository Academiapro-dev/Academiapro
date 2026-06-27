"use client";
// v2
import { useState, useEffect } from "react";

const SUPABASE_URL = "https://kpxrbwsbhmggoajtxzqn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweHJid3NiaG1nZ29hanR4enFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzM0NjIsImV4cCI6MjA5NjM0OTQ2Mn0.J45gFfkK7PHhpCFJ5ahRDbRSeGdG9YO1aa0rRZP_lks";

export default function MemoirePage() {
  const [sessions, setSessions] = useState([]);
  const [sessionActive, setSessionActive] = useState(null);
  const [filtreAgent, setFiltreAgent] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setLoading(true);
    const r = await fetch(SUPABASE_URL + "/rest/v1/agent_memories?select=id,agent_id,session_label,created_at,updated_at&order=created_at.desc&limit=100", {
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
    });
    const data = await r.json();
    setSessions(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function ouvrirSession(id) {
    const r = await fetch(SUPABASE_URL + "/rest/v1/agent_memories?id=eq." + id + "&select=*", {
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
    });
    const data = await r.json();
    if (data[0]) setSessionActive(data[0]);
  }

  async function supprimerSession(id) {
    if (!confirm("Supprimer cette session ?")) return;
    await fetch(SUPABASE_URL + "/rest/v1/agent_memories?id=eq." + id, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
    });
    if (sessionActive?.id === id) setSessionActive(null);
    charger();
  }

  const agents = ["tous", ...new Set(sessions.map(s => s.agent_id))];
  const sessionsFiltrees = sessions.filter(s => {
    if (filtreAgent !== "tous" && s.agent_id !== filtreAgent) return false;
    if (recherche && !s.session_label?.toLowerCase().includes(recherche.toLowerCase())) return false;
    return true;
  });

  const EMOJIS = { cam: "🤖", juridique: "⚖️", comptable: "📊", qualiopi: "🎓" };

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>AcademiA Pro · Admin</p>
          <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "24px", margin: "0 0 6px" }}>🧠 Mémoire des Agents</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>{sessions.length} session(s) sauvegardée(s)</p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>

        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
            {agents.map(a => (
              <button key={a} onClick={() => setFiltreAgent(a)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: filtreAgent === a ? "#c8a96e" : "rgba(255,255,255,0.08)", color: filtreAgent === a ? "#050508" : "#fff", fontWeight: filtreAgent === a ? "bold" : "normal" }}>
                {EMOJIS[a] || "📋"} {a}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Rechercher..." value={recherche} onChange={e => setRecherche(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "12px", boxSizing: "border-box" as any }} />

          {loading ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Chargement...</p> :
            sessionsFiltrees.map(s => (
              <div key={s.id}
                onClick={() => ouvrirSession(s.id)}
                style={{ background: sessionActive?.id === s.id ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.03)", border: "1px solid " + (sessionActive?.id === s.id ? "#c8a96e" : "rgba(255,255,255,0.08)"), borderRadius: "10px", padding: "14px", marginBottom: "8px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "bold" }}>{EMOJIS[s.agent_id] || "📋"} {s.session_label || s.agent_id}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "3px" }}>
                      {new Date(s.created_at).toLocaleDateString("fr-FR")} {new Date(s.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); supprimerSession(s.id); }}
                    style={{ background: "rgba(255,0,0,0.15)", color: "#ff6b6b", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "11px" }}>
                    🗑
                  </button>
                </div>
              </div>
            ))
          }
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", maxHeight: "85vh", overflowY: "auto" }}>
          {!sessionActive ? (
            <div style={{ textAlign: "center", paddingTop: "100px" }}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "16px" }}>Sélectionne une session</p>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>pour lire la conversation</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "20px", borderBottom: "1px solid rgba(200,169,110,0.2)", paddingBottom: "15px" }}>
                <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 5px" }}>{sessionActive.session_label}</h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                  Agent : {sessionActive.agent_id} · {Array.isArray(sessionActive.conversation) ? sessionActive.conversation.length : 0} messages · {new Date(sessionActive.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
              {Array.isArray(sessionActive.conversation) && sessionActive.conversation.map((msg, i) => (
                <div key={i} style={{ marginBottom: "12px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ background: msg.role === "user" ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid " + (msg.role === "user" ? "rgba(200,169,110,0.3)" : "rgba(255,255,255,0.08)"), padding: "10px 14px", borderRadius: "10px", maxWidth: "85%", fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {msg.role !== "user" && <div style={{ color: "#c8a96e", fontSize: "10px", marginBottom: "4px", fontWeight: "bold" }}>🤖 {sessionActive.agent_id?.toUpperCase()}</div>}
                    {msg.content || msg.text || ""}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
