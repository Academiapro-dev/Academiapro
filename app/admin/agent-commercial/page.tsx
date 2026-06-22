"use client";
import { useState, useEffect } from "react";

const TYPES_CONTENU = [
  { id: "pitch", label: "🎯 Pitch de Vente", desc: "Script 2 minutes" },
  { id: "objections", label: "💬 Objections", desc: "10 réponses clés" },
  { id: "proposition", label: "📄 Proposition", desc: "Offre commerciale" },
  { id: "script_appel", label: "📞 Script Appel", desc: "Guide téléphonique" },
  { id: "devis", label: "💰 Devis", desc: "Devis professionnel" },
  { id: "temoignage", label: "⭐ Témoignages", desc: "Preuves sociales" },
];

export default function AgentCommercialPage() {
  const [stats, setStats] = useState<any>(null);
  const [contenus, setContenus] = useState<any[]>([]);
  const [onglet, setOnglet] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [typeSelectionne, setTypeSelectionne] = useState("pitch");
  const [contexte, setContexte] = useState({ formation: "", cible: "", prix: "", prospect: "", budget: "", domaine: "", duree: "2 minutes" });

  useEffect(() => { charger(); }, []);

  async function charger() {
    const [s, c] = await Promise.all([
      fetch("/api/agent-commercial").then(r => r.json()),
      fetch("/api/agent-commercial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "liste" }) }).then(r => r.json()),
    ]);
    setStats(s);
    setContenus(Array.isArray(c) ? c : []);
  }

  async function generer() {
    setLoading(true);
    setResultat(null);
    const r = await fetch("/api/agent-commercial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generer", type: typeSelectionne, contexte }),
    });
    const data = await r.json();
    setResultat(data);
    await charger();
    setLoading(false);
  }

  const onglets = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "generer", label: "✍️ Générer" },
    { id: "historique", label: "📋 Historique" },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <h1 style={{ color: "#c8a96e", margin: 0, fontSize: "24px" }}>💼 Agent Commercial</h1>
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
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px" }}>Contenus générés</div>
              </div>
              <div style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#00e676" }}>{Object.keys(stats?.par_type || {}).length}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px" }}>Types utilisés</div>
              </div>
            </div>
            <button onClick={charger} style={{ width: "100%", background: "transparent", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
              🔄 Rafraîchir
            </button>
          </div>
        )}

        {onglet === "generer" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "20px" }}>GÉNÉRER DU CONTENU COMMERCIAL</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {TYPES_CONTENU.map(t => (
                <button key={t.id} onClick={() => setTypeSelectionne(t.id)}
                  style={{ padding: "12px", borderRadius: "8px", border: `1px solid ${typeSelectionne === t.id ? "#c8a96e" : "rgba(255,255,255,0.1)"}`, background: typeSelectionne === t.id ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.03)", color: typeSelectionne === t.id ? "#c8a96e" : "rgba(255,255,255,0.6)", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontWeight: "bold", fontSize: "13px" }}>{t.label}</div>
                  <div style={{ fontSize: "11px", marginTop: "3px" }}>{t.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Formation", key: "formation", placeholder: "Sophrologie Caycédienne" },
                { label: "Public cible", key: "cible", placeholder: "Professionnels RH" },
                { label: "Prix", key: "prix", placeholder: "2800 EUR" },
                { label: "Prospect", key: "prospect", placeholder: "Entreprise ou particulier" },
                { label: "Budget", key: "budget", placeholder: "3000 EUR" },
                { label: "Domaine", key: "domaine", placeholder: "Bien-être" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input value={(contexte as any)[f.key]} onChange={e => setContexte(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            <button onClick={generer} disabled={loading}
              style={{ width: "100%", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "14px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}>
              {loading ? "Génération en cours..." : "✍️ Générer le contenu"}
            </button>

            {resultat && !loading && (
              <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", marginTop: "20px", border: "1px solid rgba(200,169,110,0.3)" }}>
                <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px", marginBottom: "12px" }}>CONTENU GÉNÉRÉ</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{resultat.contenu}</div>
              </div>
            )}
          </div>
        )}

        {onglet === "historique" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "15px" }}>HISTORIQUE ({contenus.length})</h2>
            {contenus.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>Aucun contenu généré pour l instant.</p>
            ) : (
              contenus.map(c => (
                <div key={c.id} style={{ background: "#1a1a2e", borderRadius: "10px", padding: "15px", marginBottom: "10px", border: "1px solid rgba(200,169,110,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>{c.titre}</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginBottom: "8px" }}>{c.type} · {c.formation}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{c.contenu?.slice(0, 150)}...</div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

