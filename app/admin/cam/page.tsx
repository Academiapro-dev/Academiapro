"use client";
import { useState, useEffect, useRef } from "react";

export default function CAMDashboard() {
  const [statut, setStatut] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [codeManuel, setCodeManuel] = useState("F030");
  const [autoBatch, setAutoBatch] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const autoBatchRef = useRef(false);

  const chargerStatut = async () => {
    const r = await fetch("/api/cam");
    const data = await r.json();
    setStatut(data);
    return data;
  };

  useEffect(() => { chargerStatut(); }, []);

  const addLog = (msg: string) => {
    const heure = new Date().toLocaleTimeString("fr-FR");
    setLog(prev => [`[${heure}] ${msg}`, ...prev.slice(0, 49)]);
  };

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
    return data;
  };

  const demarrerAutoBatch = async () => {
    autoBatchRef.current = true;
    setAutoBatch(true);
    addLog("Auto-batch démarré — CAM génère les LMS complets...");

    while (autoBatchRef.current) {
      const statut = await chargerStatut();

      if (statut.sans_lms_complet === 0) {
        addLog("✅ Toutes les formations ont un LMS complet !");
        autoBatchRef.current = false;
        setAutoBatch(false);
        break;
      }

      addLog(`⚡ ${statut.avec_lms_complet}/${statut.total} — génération en cours...`);

      try {
        const r = await fetch("/api/cam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "batch10" }),
        });
        const data = await r.json();
        if (data.succes?.length > 0) addLog(`✅ Générés: ${data.succes.join(", ")}`);
        if (data.echecs?.length > 0) addLog(`❌ Échecs: ${data.echecs.join(", ")}`);
      } catch {
        addLog(`❌ Erreur réseau — on continue...`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  };

  const arreterAutoBatch = () => {
    autoBatchRef.current = false;
    setAutoBatch(false);
    addLog("⏹ Auto-batch arrêté.");
  };

  const progression = statut ? Math.round((statut.avec_lms_complet / statut.total) * 100) : 0;

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff", padding: "30px 20px", fontFamily: "Georgia, serif" }}>

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>⚡</div>
        <h1 style={{ color: "#c8a96e", fontSize: "24px", margin: "0 0 6px" }}>CAM — Chef Agent Maître</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>AcadémIA Pro · LMS Complet v6</p>
      </div>

      {statut && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "15px" }}>
            {[
              { label: "Total", value: statut.total, color: "#c8a96e" },
              { label: "LMS Complet ✅", value: statut.avec_lms_complet, color: "#00e676" },
              { label: "Restant ⏳", value: statut.sans_lms_complet, color: "#ff5252" },
            ].map(item => (
              <div key={item.label} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: item.color }}>{item.value}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "25px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Progression LMS complet</span>
              <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>{progression}%</span>
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: "10px", height: "10px", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(90deg,#c8a96e,#00e676)", height: "100%", width: `${progression}%`, transition: "width 0.5s ease", borderRadius: "10px" }} />
            </div>
          </div>
        </>
      )}

      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "#c8a96e", fontSize: "14px", marginBottom: "12px", letterSpacing: "2px" }}>AUTO-BATCH CAM v6</h2>
        {!autoBatch ? (
          <button onClick={demarrerAutoBatch} disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#050508", border: "none", borderRadius: "10px", padding: "18px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginBottom: "10px" }}>
            🚀 Lancer la génération automatique des 263 formations
          </button>
        ) : (
          <button onClick={arreterAutoBatch} style={{ width: "100%", background: "#ff5252", color: "#fff", border: "none", borderRadius: "10px", padding: "18px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginBottom: "10px" }}>
            ⏹ Arrêter l'auto-batch
          </button>
        )}
        {autoBatch && (
          <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", textAlign: "center", marginBottom: "10px" }}>
            <div style={{ color: "#c8a96e", fontSize: "13px" }}>⚡ CAM génère 3 formations toutes les 5 secondes...</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>Ne ferme pas cette page</div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "#c8a96e", fontSize: "14px", marginBottom: "12px", letterSpacing: "2px" }}>GÉNÉRATION MANUELLE</h2>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input value={codeManuel} onChange={e => setCodeManuel(e.target.value.toUpperCase())} placeholder="Code ex: F030" style={{ flex: 1, background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "15px" }} />
          <button onClick={() => action({ action: "generer", code: codeManuel })} disabled={loading || autoBatch} style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "12px 20px", fontWeight: "bold", cursor: "pointer" }}>
            ⚡ Générer
          </button>
        </div>
        <button onClick={chargerStatut} style={{ width: "100%", background: "transparent", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", fontSize: "13px", cursor: "pointer" }}>
          🔄 Rafraîchir
        </button>
      </div>

      {resultat && (
        <div style={{ background: "#1a1a2e", border: `1px solid ${resultat.succes ? "#00e676" : "#ff5252"}`, borderRadius: "10px", padding: "15px", marginBottom: "20px" }}>
          <div style={{ color: "#c8a96e", fontSize: "12px", marginBottom: "8px" }}>RÉSULTAT</div>
          {resultat.succes === true && (
            <div>
              <div style={{ color: "#00e676", fontWeight: "bold" }}>✅ LMS complet généré</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginTop: "4px" }}>{resultat.code} — {resultat.titre}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>5 chapitres · 15 modules · {resultat.formateur}</div>
            </div>
          )}
          {Array.isArray(resultat.succes) && (
            <div>
              <div style={{ color: "#00e676", fontWeight: "bold" }}>✅ {resultat.succes.join(", ")}</div>
              {resultat.echecs?.length > 0 && <div style={{ color: "#ff5252", marginTop: "4px" }}>❌ {resultat.echecs.join(", ")}</div>}
            </div>
          )}
          {resultat.erreur && <div style={{ color: "#ff5252" }}>❌ {resultat.erreur}</div>}
        </div>
      )}

      {log.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "14px", marginBottom: "10px", letterSpacing: "2px" }}>LOG CAM</h2>
          <div style={{ background: "#0a0a14", borderRadius: "10px", padding: "15px", maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(200,169,110,0.15)" }}>
            {log.map((entry, i) => (
              <div key={i} style={{ color: entry.includes("✅") ? "#00e676" : entry.includes("❌") ? "#ff5252" : "rgba(255,255,255,0.6)", fontSize: "11px", padding: "3px 0", fontFamily: "monospace" }}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {statut?.formations_sans_lms_complet?.length > 0 && (
        <div>
          <h2 style={{ color: "#c8a96e", fontSize: "14px", marginBottom: "10px", letterSpacing: "2px" }}>SANS LMS COMPLET ({statut.sans_lms_complet})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {statut.formations_sans_lms_complet.map((f: any) => (
              <div key={f.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a2e", borderRadius: "8px", padding: "10px 14px", border: "1px solid rgba(200,169,110,0.1)" }}>
                <div>
                  <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "12px", marginRight: "8px" }}>{f.code}</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>{f.titre?.slice(0, 35)}</span>
                </div>
                <button onClick={() => action({ action: "generer", code: f.code })} disabled={loading || autoBatch} style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                  ⚡
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
