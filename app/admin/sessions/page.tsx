"use client";
// v5 - securisee : mot de passe + route serveur, plus de cle dans le client
import { useState, useEffect } from "react";

const API = "/api/admin/sessions";

export default function SessionsPage() {
  const [autorise, setAutorise] = useState(false);
  const [mdp, setMdp] = useState("");
  const [voirLogin, setVoirLogin] = useState(false);
  const [onglet, setOnglet] = useState("sessions");
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionActive, setSessionActive] = useState<any>(null);
  const [fichiers, setFichiers] = useState<any[]>([]);
  const [filtreAgent, setFiltreAgent] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(false);
  const [filtreType, setFiltreType] = useState("tous");

  async function appel(corps: any) {
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json", "x-mdp-compta": mdp }, body: JSON.stringify(corps) });
    return r.json();
  }

  async function tenterConnexion() {
    setLoading(true);
    const d = await appel({ action: "lister_sessions" });
    setLoading(false);
    if (d && d.sessions) { setSessions(d.sessions); setAutorise(true); }
    else alert("Mot de passe incorrect");
  }

  useEffect(() => { if (autorise && onglet === "fichiers") chargerFichiers(); }, [onglet, autorise]);

  async function chargerSessions() {
    setLoading(true);
    const d = await appel({ action: "lister_sessions" });
    setSessions(d.sessions || []);
    setLoading(false);
  }

  async function chargerFichiers() {
    setLoading(true);
    const d = await appel({ action: "lister_fichiers" });
    setFichiers(d.fichiers || []);
    setLoading(false);
  }

  async function ouvrirSession(s: any) {
    setSessionActive(null);
    const d = await appel({ action: "ouvrir_session", id: s.id });
    if (d.session) setSessionActive(d.session);
  }

  async function supprimerSession(id: any) {
    if (!confirm("Supprimer cette session ?")) return;
    await appel({ action: "supprimer_session", id });
    if (sessionActive && sessionActive.id === id) setSessionActive(null);
    chargerSessions();
  }

  async function supprimerFichier(nom: string) {
    if (!confirm("Supprimer ce fichier ?")) return;
    await appel({ action: "supprimer_fichier", nom });
    chargerFichiers();
  }

  const agents = ["tous", ...Array.from(new Set(sessions.map((s) => s.agent_id)))];
  const sessionsFiltrees = sessions.filter((s) => {
    if (filtreAgent !== "tous" && s.agent_id !== filtreAgent) return false;
    if (recherche && !(s.session_label || "").toLowerCase().includes(recherche.toLowerCase())) return false;
    return true;
  });
  const EMOJIS: any = { cam: "🤖", juridique: "⚖️", comptable: "📊", qualiopi: "🎓" };
  const fichiersFiltres = fichiers.filter((f) => filtreType === "tous" || f.type === filtreType);

  if (!autorise) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif" }}>Memoire des Agents</h1>
        <input type={voirLogin?"text":"password"} placeholder="Mot de passe" value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tenterConnexion()}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #c8a96e", background: "rgba(255,255,255,0.05)", color: "#fff", width: "250px" }} />
        <button onClick={()=>setVoirLogin(!voirLogin)} style={{background:"transparent",border:"1px solid rgba(200,169,110,0.4)",color:"#c8a96e",borderRadius:"6px",padding:"6px 14px",cursor:"pointer",fontSize:"12px"}}>{voirLogin?"Masquer":"Afficher"}</button>
        <button onClick={tenterConnexion}
          style={{ padding: "12px 30px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
          {loading ? "Verification..." : "Acceder"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>AcademiA Pro - Admin</p>
          <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "24px", margin: "0 0 6px" }}>🧠 Memoire des Agents</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>{sessions.length} session(s) - {fichiers.length} fichier(s)</p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
          {[{ id: "sessions", label: "💬 Sessions" }, { id: "fichiers", label: "📎 Fichiers" }].map((o) => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{ padding: "10px 24px", borderRadius: "8px", border: "none", cursor: "pointer", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", fontWeight: onglet === o.id ? "bold" : "normal", fontSize: "14px" }}>
              {o.label}
            </button>
          ))}
        </div>

        {onglet === "sessions" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
                {agents.map((a) => (
                  <button key={a} onClick={() => setFiltreAgent(a)}
                    style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: filtreAgent === a ? "#c8a96e" : "rgba(255,255,255,0.08)", color: filtreAgent === a ? "#050508" : "#fff" }}>
                    {EMOJIS[a] || "📋"} {a}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Rechercher..." value={recherche} onChange={(e) => setRecherche(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "12px", boxSizing: "border-box" as any }} />
              {loading ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Chargement...</p> :
                sessionsFiltrees.map((s) => (
                  <div key={s.id} onClick={() => ouvrirSession(s)}
                    style={{ background: sessionActive && sessionActive.id === s.id ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.03)", border: "1px solid " + (sessionActive && sessionActive.id === s.id ? "#c8a96e" : "rgba(255,255,255,0.08)"), borderRadius: "10px", padding: "14px", marginBottom: "8px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "bold" }}>{EMOJIS[s.agent_id] || "📋"} {s.session_label || s.agent_id}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "3px" }}>
                          {new Date(s.created_at).toLocaleDateString("fr-FR")} {new Date(s.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); supprimerSession(s.id); }}
                        style={{ background: "rgba(255,0,0,0.15)", color: "#ff6b6b", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "11px" }}>🗑</button>
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", maxHeight: "80vh", overflowY: "auto" }}>
              {!sessionActive ? (
                <div style={{ textAlign: "center", paddingTop: "100px" }}>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "16px" }}>Selectionne une session</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "20px", borderBottom: "1px solid rgba(200,169,110,0.2)", paddingBottom: "15px" }}>
                    <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 5px" }}>{sessionActive.session_label}</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                      {sessionActive.agent_id} - {Array.isArray(sessionActive.conversation) ? sessionActive.conversation.length : 0} messages - {new Date(sessionActive.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {Array.isArray(sessionActive.conversation) && sessionActive.conversation.map((msg: any, i: number) => (
                    <div key={i} style={{ marginBottom: "12px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ background: msg.role === "user" ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid " + (msg.role === "user" ? "rgba(200,169,110,0.3)" : "rgba(255,255,255,0.08)"), padding: "10px 14px", borderRadius: "10px", maxWidth: "85%", fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                        {msg.role !== "user" && <div style={{ color: "#c8a96e", fontSize: "10px", marginBottom: "4px", fontWeight: "bold" }}>🤖 {(sessionActive.agent_id || "").toUpperCase()}</div>}
                        {msg.content || msg.text || ""}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {onglet === "fichiers" && (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
              {["tous", "image", "pdf"].map((t) => (
                <button key={t} onClick={() => setFiltreType(t)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", background: filtreType === t ? "#c8a96e" : "rgba(255,255,255,0.08)", color: filtreType === t ? "#050508" : "#fff" }}>
                  {t === "tous" ? "📋 Tous" : t === "image" ? "🖼️ Images" : "📄 PDFs"}
                </button>
              ))}
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginLeft: "auto" }}>{fichiersFiltres.length} fichier(s)</span>
              <button onClick={chargerFichiers} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "transparent", color: "#c8a96e", cursor: "pointer", fontSize: "13px" }}>🔄 Actualiser</button>
            </div>
            {loading ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "50px" }}>Chargement...</p>
              : fichiersFiltres.length === 0 ? <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "50px" }}>Aucun fichier</p>
              : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
                  {fichiersFiltres.map((f, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {f.type === "image" && f.url ? (
                        <img src={f.url} style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "8px" }} />
                      ) : (
                        <div style={{ width: "100%", height: "130px", background: "rgba(200,169,110,0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>📄</div>
                      )}
                      <div>
                        <div style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "bold", marginBottom: "3px" }}>{EMOJIS[f.agent] || "📋"} {f.agent}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>{f.date ? new Date(f.date).toLocaleString("fr-FR") : ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {f.url && <a href={f.url} target="_blank" rel="noopener noreferrer"
                          style={{ flex: 1, textAlign: "center", padding: "8px", background: "#c8a96e", color: "#050508", borderRadius: "6px", textDecoration: "none", fontSize: "12px", fontWeight: "bold" }}>👁 Voir</a>}
                        <button onClick={() => supprimerFichier(f.nom)}
                          style={{ padding: "8px", background: "rgba(255,0,0,0.15)", color: "#ff6b6b", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
