"use client";
import { useState, useEffect } from "react";

export default function CAMDashboard() {
  const [statut, setStatut] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [codeManuel, setCodeManuel] = useState("F030");

  const chargerStatut = async () => {
    setLoading(true);
    const r = await fetch("/api/cam");
    const data = await r.json();
    setStatut(data);
    setLoading(false);
  };

  useEffect(() => { chargerStatut(); }, []);

  const action = async (body: any) => {
    setLoading(true);
    setResultat(null);
    const r = await fetch("/api/cam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    setResultat(data);
    await chargerStatut();
    setLoading(false);
  };

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff", padding: "30px 20px", fontFamily: "Georgia, serif" }}>
      
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>⚡</div>
        <h1 style={{ color: "#c8a96e", fontSize: "28px", margin: "0 0 8px" }}>CAM — Chef Agent Maître</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>AcadémIA Pro · Orchestrateur Central</p>
      </div>

      {/* STATUT */}
      {statut && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "30px" }}>
          {[
            { label: "Total formations", value: statut.total, color: "#c8a96e" },
            { label: "Avec LMS ✅", value: statut.avec_lms, color: "#00e676" },
            { label: "Sans LMS ⏳", value: statut.sans_lms, color: "#ff5252" },
          ].map(item => (
            <div key={item.label} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: item.color }}>{item.value}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginTop: "5px" }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* BOUTONS D'ACTION */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "15px", letterSpacing: "2px" }}>ACTIONS CAM</h2>
        
        {/* Batch 10 */}
        <button
          onClick={() => action({ action: "batch10" })}
          disabled={loading}
          style={{ width: "100%", background: loading ? "#333" : "linear-gradient(135deg,#c8a96e,#a07840)", color: "#050508", border: "none", borderRadius: "10px", padding: "18px", fontSize: "16px", fontWeight: "bold", cursor: loading ? "default" : "pointer", marginBottom: "12px" }}>
          {loading ? "⚡ CAM en action..." : "⚡ Générer les 10 prochaines formations"}
        </button>

        {/* Une formation */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <input
            value={codeManuel}
            onChange={e => setCodeManuel(e.target.value.toUpperCase())}
            placeholder="Code ex: F030"
            style={{ flex: 1, background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "14px", color: "#fff", fontSize: "16px" }}
          />
          <button
            onClick={() => action({ action: "generer", code: codeManuel })}
            disabled={loading}
            style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "14px 20px", fontSize: "14px", fontWeight: "bold", cursor: loading ? "default" : "pointer" }}>
            Générer
          </button>
        </div>

        {/* Statut */}
        <button
          onClick={chargerStatut}
          disabled={loading}
          style={{ width: "100%", background: "transparent", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "14px", fontSize: "14px", cursor: "pointer" }}>
          🔄 Rafraîchir le statut
        </button>
      </div>

      {/* RÉSULTAT */}
      {resultat && (
        <div style={{ background: "#1a1a2e", border: `1px solid ${resultat.succes || resultat.succes?.length > 0 ? "#00e676" : "#ff5252"}`, borderRadius: "12px", padding: "20px", marginBottom: "30px" }}>
          <h3 style={{ color: "#c8a96e", marginBottom: "10px", fontSize: "14px" }}>RÉSULTAT CAM</h3>
          {resultat.succes === true && (
            <div>
              <div style={{ color: "#00e676", fontWeight: "bold", marginBottom: "5px" }}>✅ LMS généré avec succès</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Formation: {resultat.code} — {resultat.titre}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "5px" }}>Agents: {resultat.agents?.join(" · ")}</div>
            </div>
          )}
          {Array.isArray(resultat.succes) && (
            <div>
              <div style={{ color: "#00e676", fontWeight: "bold", marginBottom: "8px" }}>✅ Succès: {resultat.succes.join(", ") || "aucun"}</div>
              {resultat.echecs?.length > 0 && <div style={{ color: "#ff5252" }}>❌ Échecs: {resultat.echecs.join(", ")}</div>}
            </div>
          )}
          {resultat.erreur && <div style={{ color: "#ff5252" }}>❌ Erreur: {resultat.erreur}</div>}
        </div>
      )}

      {/* LISTE FORMATIONS SANS LMS */}
      {statut?.formations_sans_lms?.length > 0 && (
        <div>
          <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "15px", letterSpacing: "2px" }}>
            FORMATIONS SANS LMS ({statut.sans_lms})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {statut.formations_sans_lms.map((f: any) => (
              <div key={f.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a2e", borderRadius: "8px", padding: "12px 16px", border: "1px solid rgba(200,169,110,0.15)" }}>
                <div>
                  <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px", marginRight: "10px" }}>{f.code}</span>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>{f.titre?.slice(0, 40)}</span>
                </div>
                <button
                  onClick={() => action({ action: "generer", code: f.code })}
                  disabled={loading}
                  style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>
                  ⚡ Générer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

