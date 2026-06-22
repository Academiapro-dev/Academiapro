"use client";
import { useState, useEffect } from "react";

export default function CRMPage() {
  const [stats, setStats] = useState<any>(null);
  const [prospects, setProspects] = useState<any[]>([]);
  const [onglet, setOnglet] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", source: "formulaire", statut: "prospect", formation_interesse: "", domaine: "", notes: "" });

  useEffect(() => { charger(); }, []);

  async function charger() {
    const [s, p] = await Promise.all([
      fetch("/api/crm").then(r => r.json()),
      fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "prospects" }) }).then(r => r.json()),
    ]);
    setStats(s);
    setProspects(Array.isArray(p) ? p : []);
  }

  async function ajouterProspect() {
    setLoading(true);
    const r = await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upsert", data: form }) });
    const data = await r.json();
    setResultat(data);
    await charger();
    setLoading(false);
    setForm({ nom: "", email: "", telephone: "", source: "formulaire", statut: "prospect", formation_interesse: "", domaine: "", notes: "" });
  }

  async function analyser(email: string) {
    setLoading(true);
    const r = await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "analyser", email }) });
    const data = await r.json();
    setResultat(data);
    setLoading(false);
  }

  async function relancer(email: string) {
    setLoading(true);
    const r = await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "relance", email }) });
    const data = await r.json();
    setResultat(data);
    setLoading(false);
  }

  const onglets = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "prospects", label: "👥 Prospects" },
    { id: "ajouter", label: "➕ Ajouter" },
    { id: "resultat", label: "🤖 Résultat IA" },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <h1 style={{ color: "#c8a96e", margin: 0, fontSize: "24px" }}>🎯 Agent CRM</h1>
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

        {onglet === "dashboard" && stats && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "25px" }}>
              {[
                { label: "Total Prospects", value: stats.total || 0, color: "#c8a96e" },
                { label: "Prospects Chauds 🔥", value: stats.chauds || 0, color: "#ff6b35" },
                { label: "Clients ✅", value: stats.clients || 0, color: "#00e676" },
                { label: "Score Moyen", value: `${stats.score_moyen || 0}%`, color: "#448aff" },
                { label: "Actifs", value: stats.prospects || 0, color: "#c8a96e" },
                { label: "Taux Conversion", value: stats.total > 0 ? `${Math.round((stats.clients / stats.total) * 100)}%` : "0%", color: "#00e676" },
              ].map(item => (
                <div key={item.label} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: item.color }}>{item.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {stats.par_domaine && Object.keys(stats.par_domaine).length > 0 && (
              <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ color: "#c8a96e", marginTop: 0, fontSize: "14px" }}>PAR DOMAINE</h3>
                {Object.entries(stats.par_domaine).map(([domaine, count]: any) => (
                  <div key={domaine} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{domaine}</span>
                    <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{count}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={charger} style={{ width: "100%", background: "transparent", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
              🔄 Rafraîchir
            </button>
          </div>
        )}

        {onglet === "prospects" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "15px" }}>PROSPECTS ({prospects.length})</h2>
            {prospects.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>Aucun prospect — ajoutez le premier !</p>
            ) : (
              prospects.map(p => (
                <div key={p.id} style={{ background: "#1a1a2e", borderRadius: "10px", padding: "15px", marginBottom: "10px", border: "1px solid rgba(200,169,110,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{p.nom || "Sans nom"}</span>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginLeft: "10px" }}>{p.email}</span>
                    </div>
                    <div style={{ background: p.score >= 60 ? "#ff6b35" : "rgba(200,169,110,0.2)", color: p.score >= 60 ? "#fff" : "#c8a96e", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                      {p.score}pts
                    </div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginBottom: "10px" }}>
                    {p.formation_interesse && <span style={{ marginRight: "10px" }}>📚 {p.formation_interesse}</span>}
                    {p.domaine && <span style={{ marginRight: "10px" }}>🏷️ {p.domaine}</span>}
                    {p.source && <span>📍 {p.source}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { analyser(p.email); setOnglet("resultat"); }} disabled={loading} style={{ flex: 1, background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "6px", padding: "8px", fontSize: "12px", cursor: "pointer" }}>
                      🤖 Analyser
                    </button>
                    <button onClick={() => { relancer(p.email); setOnglet("resultat"); }} disabled={loading} style={{ flex: 1, background: "rgba(0,230,118,0.1)", color: "#00e676", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "6px", padding: "8px", fontSize: "12px", cursor: "pointer" }}>
                      📧 Relancer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {onglet === "ajouter" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "20px" }}>AJOUTER UN PROSPECT</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Nom", key: "nom", placeholder: "Jean Dupont" },
                { label: "Email *", key: "email", placeholder: "jean@email.com" },
                { label: "Téléphone", key: "telephone", placeholder: "+33 6 00 00 00 00" },
                { label: "Formation intéressée", key: "formation_interesse", placeholder: "Sophrologie Caycédienne" },
                { label: "Notes", key: "notes", placeholder: "A contacté via le chat..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Source</label>
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                  style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff" }}>
                  <option value="formulaire">Formulaire</option>
                  <option value="chat">Chat IA</option>
                  <option value="webinaire">Webinaire</option>
                  <option value="referral">Recommandation</option>
                  <option value="publicite">Publicité</option>
                  <option value="reseaux_sociaux">Réseaux sociaux</option>
                </select>
              </div>
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Domaine</label>
                <select value={form.domaine} onChange={e => setForm(p => ({ ...p, domaine: e.target.value }))}
                  style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff" }}>
                  <option value="">Choisir...</option>
                  {["IA", "Business", "Marketing", "Langues", "Bien-etre", "Tech", "Design", "Finance", "Droit", "Outils"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <button onClick={ajouterProspect} disabled={loading || !form.email}
                style={{ width: "100%", background: form.email ? "#c8a96e" : "rgba(200,169,110,0.3)", color: "#050508", border: "none", borderRadius: "8px", padding: "14px", fontWeight: "bold", cursor: form.email ? "pointer" : "not-allowed", fontSize: "15px" }}>
                {loading ? "Ajout en cours..." : "➕ Ajouter le prospect"}
              </button>
              {resultat?.succes && <div style={{ color: "#00e676", textAlign: "center", fontSize: "13px" }}>✅ Prospect ajouté — Score: {resultat.score}pts</div>}
            </div>
          </div>
        )}

        {onglet === "resultat" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "20px" }}>RÉSULTAT IA</h2>
            {loading && <div style={{ color: "#c8a96e", textAlign: "center", padding: "40px" }}>Agent CRM en action...</div>}
            {resultat && !loading && (
              <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200,169,110,0.3)" }}>
                {resultat.analyse && (
                  <div>
                    <div style={{ color: "#c8a96e", fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>🤖 ANALYSE CAM</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.7", fontSize: "13px" }}>{resultat.analyse}</div>
                  </div>
                )}
                {resultat.email_relance && (
                  <div>
                    <div style={{ color: "#00e676", fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>📧 EMAIL DE RELANCE</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.7", fontSize: "13px", whiteSpace: "pre-wrap" }}>{resultat.email_relance}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

