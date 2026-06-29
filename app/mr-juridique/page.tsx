"use client";
import { useState, useEffect, useRef } from "react";

export default function AgentPage() {
  const [message, setMessage] = useState("");

  const [showFleche, setShowFleche] = useState(false);

  useEffect(() => {
    const container = document.getElementById("chat-container");
    if (!container) return;
    const handleScroll = () => {
      setShowFleche(container.scrollHeight - container.scrollTop - container.clientHeight > 100);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollEnBas() {
    const container = document.getElementById("chat-container");
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }

  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fichierLoading, setFichierLoading] = useState(false);
  const [memoireOk, setMemoireOk] = useState(false);
  const [memoireLoading, setMemoireLoading] = useState(false);
  const [panelOuvert, setPanelOuvert] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [enBas, setEnBas] = useState(true);

  useEffect(() => {
    if (enBas) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historique, loading]);

  function handleScroll(e) {
    const el = e.target;
    const enBasDePage = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setEnBas(enBasDePage);
  }

  function scrollerEnBas() {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setEnBas(true);
  }

  useEffect(() => {
    async function chargerDerniereSession() {
      try {
        const res = await fetch("/api/memory/load?agent_id=juridique");
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const derniere = data.data[0];
          if (derniere.conversation && derniere.conversation.length > 0) {
            const normalises = derniere.conversation.map(m => ({
              role: m.role === "assistant" ? "agent" : m.role,
              text: m.content || m.text || "",
              content: m.content || m.text || ""
            }));
            setHistorique(normalises);
          }
        }
      } catch {}
    }
    chargerDerniereSession();
  }, []);

  async function analyserFichier(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setFichierLoading(true);
    const noms = files.map((f) => f.name).join(", ");
    setHistorique(prev => [...prev, { role: "user", text: "📎 " + files.length + " document(s) joint(s) : " + noms }]);
    try {
      const fichiersB64 = await Promise.all(files.map((file) => new Promise((resolve) => {
        const ext = file.name.split(".").pop().toLowerCase();
        const mediaType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
        const reader = new FileReader();
        reader.onload = (ev) => resolve({ base64: ev.target.result.split(",")[1], mediaType, nom: file.name });
        reader.readAsDataURL(file);
      })));
      const r = await fetch("/api/mr-juridique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Analyse ces " + files.length + " document(s).", contexte: "international", historique: historique.slice(-20), fichiers: fichiersB64 }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur lors de l analyse." }]);
    }
    setFichierLoading(false);
    e.target.value = "";
  }

  async function envoyer(msg) {
    const m = msg || message;
    if (!m || !m.trim()) return;
    if (!msg) setMessage("");
    setHistorique(prev => [...prev, { role: "user", text: m }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-juridique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: m, historique: historique.slice(-20) }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
  }

  async function sauvegarderMemoire() {
    if (historique.length === 0) return;
    setMemoireLoading(true);
    try {
      await fetch("/api/memory/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: "juridique",
          session_id: "juridique_" + Date.now(),
          session_label: "Session juridique",
          conversation: historique.map(m => ({ ...m, content: m.text || m.content || "" })),
          context_summary: "",
          key_decisions: []
        }),
      });
      setMemoireOk(true);
      setTimeout(() => setMemoireOk(false), 2000);
    } catch {}
    setMemoireLoading(false);
  }

  async function ouvrirRestauration() {
    setPanelOuvert(true);
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/memory/load?agent_id=juridique");
      const data = await res.json();
      setSessions(data.success ? data.data : []);
    } catch { setSessions([]); }
    setSessionsLoading(false);
  }

  function restaurerSession(conv) {
    setHistorique(conv.map(m => ({
      role: m.role === "assistant" ? "agent" : m.role,
      text: m.content || m.text || "",
      content: m.content || m.text || ""
    })));
    setPanelOuvert(false);
  }

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      {panelOuvert && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} onClick={() => setPanelOuvert(false)} />
          <div style={{ position: "relative", background: "#111827", border: "1px solid #374151", borderRadius: "16px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: "1px solid #374151" }}>
              <h2 style={{ color: "#fff", margin: 0 }}>🧠 Restaurer une session</h2>
              <button onClick={() => setPanelOuvert(false)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "24px", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "16px" }}>
              {sessionsLoading ? <p style={{ color: "#9ca3af", textAlign: "center" }}>Chargement...</p>
              : sessions.length === 0 ? <p style={{ color: "#6b7280", textAlign: "center" }}>Aucune session</p>
              : sessions.slice(0, 10).map((s, i) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "10px", border: "1px solid " + (i === 0 ? "rgba(139,92,246,0.5)" : "#374151"), background: i === 0 ? "rgba(139,92,246,0.1)" : "rgba(31,41,55,0.5)", marginBottom: "8px" }}>
                  <div>
                    {i === 0 && <span style={{ fontSize: "10px", background: "#7c3aed", color: "#fff", padding: "2px 8px", borderRadius: "20px", marginRight: "8px" }}>Dernière</span>}
                    <span style={{ color: "#fff", fontSize: "13px" }}>{s.session_label}</span>
                    <p style={{ color: "#9ca3af", fontSize: "11px", margin: "4px 0 0" }}>{new Date(s.updated_at).toLocaleString("fr-FR")} · {s.conversation?.length || 0} messages</p>
                  </div>
                  <button onClick={() => restaurerSession(s.conversation || [])}
                    style={{ padding: "6px 12px", background: "#374151", color: "#d1d5db", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                    ↩️ Restaurer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>AcademiA Pro · Admin</p>
          <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "28px", margin: "0 0 6px" }}>⚖️ Maitre Pierre Duval</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>Avocat et Juriste — France · Israel · USA · LLC Wyoming · Protection IP · Droit International</p>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        

        <div ref={chatContainerRef} onScroll={handleScroll} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", minHeight: "400px", maxHeight: "60vh", overflowY: "auto", padding: "20px", marginBottom: "20px", position: "relative" }}>
          {historique.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: "80px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>Posez votre question juridique...</p>
            </div>
          )}
          {historique.map((h, i) => (
            <div key={i} style={{ marginBottom: "16px", display: "flex", justifyContent: h.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ background: h.role === "user" ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)", border: "1px solid " + (h.role === "user" ? "rgba(200,169,110,0.3)" : "rgba(255,255,255,0.08)"), padding: "12px 16px", borderRadius: "12px", maxWidth: "85%", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {h.text}
              </div>
            </div>
          ))}
          {(loading || fichierLoading) && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: "12px" }}>
                <span style={{ color: "#c8a96e" }}>⏳ Analyse en cours...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {!enBas && (
          <button onClick={scrollerEnBas}
            style={{ position: "absolute", bottom: "80px", right: "30px", background: "rgba(200,169,110,0.9)", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", zIndex: 10 }}>
            ↓
          </button>
        )}

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={analyserFichier} />
          <button onClick={() => fileInputRef.current?.click()}
            style={{ padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "18px" }}>
            📎
          </button>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && envoyer()}
            placeholder="Posez votre question juridique..."
            style={{ flex: 1, padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none" }}
          />
          <button onClick={() => envoyer()} disabled={loading || !message.trim()}
            style={{ padding: "12px 24px", background: loading ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
            Envoyer
          </button>
          <button onClick={sauvegarderMemoire} disabled={memoireLoading || historique.length === 0}
            style={{ padding: "12px 16px", background: memoireOk ? "#22c55e" : "rgba(139,92,246,0.2)", color: memoireOk ? "#fff" : "#a78bfa", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
            {memoireOk ? "✅" : memoireLoading ? "⏳" : "💾 Sauvegarder"}
          </button>
          <button onClick={ouvrirRestauration}
            style={{ padding: "12px 16px", background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
            📂 Restaurer
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", margin: "8px 0 0" }}>📎 PDF · JPEG · PNG — Analyse directe</p>
      </div>
    
      {showFleche && (
        <button onClick={scrollEnBas} style={{
          position: "fixed", bottom: "100px", right: "20px", zIndex: 1000,
          background: "rgba(200,169,110,0.9)", border: "none", borderRadius: "50%",
          width: "44px", height: "44px", cursor: "pointer", fontSize: "20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)"
        }}>↓</button>
      )}
</div>
  );
}