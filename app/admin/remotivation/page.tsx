"use client";
import { useState, useEffect } from "react";

export default function RemotivationPage() {
  const [stats, setStats] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inactifs, setInactifs] = useState<any[]>([]);
  const [onglet, setOnglet] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [contexte, setContexte] = useState({ prenom: "", email: "", formation: "", jours_inactif: "7", progression: "" });

  useEffect(() => { charger(); }, []);

  async function charger() {
    const [s, m] = await Promise.all([
      fetch("/api/remotivation").then(r => r.json()),
      fetch("/api/remotivation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "liste" }) }).then(r => r.json()),
    ]);
    setStats(s);
    setMessages(Array.isArray(m) ? m : []);
  }

  async function scanner() {
    setLoading(true);
    const r = await fetch("/api/remotivation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "scanner" }),
    });
    const data = await r.json();
    setInactifs(data.inactifs || []);
    setLoading(false);
  }

  async function generer() {
    setLoading(true);
    setResultat(null);
    const r = await fetch("/api/remotivation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generer", contexte: { ...contexte, jours_inactif: parseInt(contexte.jours_inactif) } }),
    });
    const data = await r.json();
    setResultat(data);
    await charger();
    setLoading(false);
  }

  async function remotiver(apprenant: any) {
    setLoading(true);
    const r = await fetch("/api/remotivation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generer", contexte: { prenom: apprenant.prenom, email: apprenant.email, formation: apprenant.formation_code, jours_inactif: apprenant.jours_inactif } }),
    });
    const data = await r.json();
    setResultat(data);
    setOnglet("generer");
    await charger();
    setLoading(false);
  }

  const onglets = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "scanner", label: "🔍 Scanner" },
    { id: "generer", label: "💪 Générer" },
    { id: "historique", label: "📋 Historique" },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <h1 style={{ color: "#c8a96e", margin: 0, fontSize: "24px" }}>💪 Agent Remotivation</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0", fontSize: "13px" }}>AcadémIA Pro · Piloté par CAM</p>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", whiteSpace: "nowrap", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "25px 20px", maxWidth: "900px", margin: "0 auto" }}>

        {onglet === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "25px" }}>
              <div style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#c8a96e" }}>{stats?.total || 0}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px" }}>Messages envoyés</div>
              </div>
              <div style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ff6b35" }}>{inactifs.length}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px" }}>Apprenants inactifs</div>
              </div>
            </div>

            <button onClick={scanner} disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#050508", border: "none", borderRadius: "10px", padding: "16px", fontWeight: "bold", cursor: "pointer", marginBottom: "12px", fontSize: "15px" }}>
              {loading ? "Scan en cours..." : "🔍 Scanner les apprenants inactifs"}
            </button>

            <button onClick={charger} style={{ width: "100%", background: "transparent", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
              🔄 Rafraîchir
            </button>
          </div>
        )}

        {onglet === "scanner" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "15px" }}>APPRENANTS INACTIFS</h2>
            <button onClick={scanner} disabled={loading} style={{ width: "100%", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "bold", cursor: "pointer", marginBottom: "20px" }}>
              {loading ? "Scan en cours..." : "🔍 Scanner maintenant"}
            </button>

            {inactifs.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>Lance le scan pour voir les apprenants inactifs.</p>
            ) : (
              inactifs.map((a, i) => (
                <div key={i} style={{ background: "#1a1a2e", borderRadius: "10px", padding: "15px", marginBottom: "10px", border: `1px solid ${a.jours_inactif > 30 ? "rgba(255,82,82,0.4)" : "rgba(200,169,110,0.15)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>{a.prenom} {a.nom}</span>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginLeft: "8px" }}>{a.email}</span>
                    </div>
                    <span style={{ color: a.jours_inactif > 30 ? "#ff5252" : "#ff6b35", fontWeight: "bold", fontSize: "12px" }}>
                      {a.jours_inactif}j inactif
                    </span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "10px" }}>
                    Formation: {a.formation_code}
                  </div>
                  <button onClick={() => remotiver(a)} disabled={loading} style={{ width: "100%", background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "6px", padding: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "bold" }}>
                    💪 Générer message remotivation
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {onglet === "generer" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "20px" }}>GÉNÉRER UN MESSAGE</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Prénom", key: "prenom", placeholder: "Marie" },
                { label: "Email", key: "email", placeholder: "marie@email.com" },
                { label: "Formation", key: "formation", placeholder: "Sophrologie Caycédienne" },
                { label: "Jours inactif", key: "jours_inactif", placeholder: "7" },
                { label: "Progression", key: "progression", placeholder: "Chapitre 2 module 3" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input value={(contexte as any)[f.key]} onChange={e => setContexte(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            <button onClick={generer} disabled={loading} style={{ width: "100%", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "14px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}>
              {loading ? "Génération en cours..." : "💪 Générer le message"}
            </button>

            {resultat && !loading && (
              <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", marginTop: "20px", border: "1px solid rgba(200,169,110,0.3)" }}>
                <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px", marginBottom: "12px" }}>MESSAGE REMOTIVATION</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{resultat.message}</div>
              </div>
            )}
          </div>
        )}

        {onglet === "historique" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "15px" }}>HISTORIQUE ({messages.length})</h2>
            {messages.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>Aucun message généré pour l instant.</p>
            ) : (
              messages.map(m => (
                <div key={m.id} style={{ background: "#1a1a2e", borderRadius: "10px", padding: "15px", marginBottom: "10px", border: "1px solid rgba(200,169,110,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>{m.apprenant_email}</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{new Date(m.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginBottom: "6px" }}>{m.formation} · {m.jours_inactif}j inactif</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{m.message?.slice(0, 120)}...</div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

