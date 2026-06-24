"use client";
import { useState, useEffect } from "react";

export default function MrComptablePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contexte, setContexte] = useState("france");
  const [checklistLoading, setChecklistLoading] = useState(false);

  useEffect(() => {
    try {
      const sbUser = document.cookie.split("; ").find(r => r.startsWith("sb_user="));
      if (sbUser) {
        const user = JSON.parse(decodeURIComponent(sbUser.split("=")[1]));
        if (user.email === "contact@academiapro.fr") setIsAdmin(true);
      }
    } catch {}
    setChecking(false);
  }, []);

  async function envoyer(msg_override = "") {
    const msg = msg_override || message;
    if (!msg.trim()) return;
    if (!msg_override) setMessage("");
    setHistorique(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-comptable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, contexte, historique }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur de connexion." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
  }

  async function genererChecklist() {
    setChecklistLoading(true);
    setContexte("international");
    const question = `Genere ma checklist annuelle complete LLC Wyoming pour mon profil exact :
- Resident France actuellement, depart Israel dans 6 mois
- LLC Wyoming single-member (associe unique non-resident US)
- Activite : plateforme formation en ligne AcademiA Pro
- Clients internationaux, revenus hors USA uniquement
- Pas encore de revenus, lancement imminent

Pour chaque obligation donne moi :
1. Le nom exact du formulaire
2. La date limite precise
3. Les cases exactes a remplir pour mon profil
4. Le cout estime
5. Si je peux le faire seul ou si CPA obligatoire
6. Le lien ou portail officiel pour soumettre

Inclus aussi les obligations cote France (exit tax, declarations depart) et cote Israel (arrivee, statut Olim, premiere declaration).`;
    
    setHistorique(prev => [...prev, { role: "user", text: "Genere ma checklist annuelle complete LLC Wyoming pour mon profil (France → LLC Wyoming → Israel dans 6 mois, AcademiA Pro, clients internationaux)" }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-comptable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, contexte: "international", historique: [] }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
    setChecklistLoading(false);
  }

  if (checking) return (
    <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#c8a96e" }}>Vérification...</p>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#ff4444", fontSize: "18px" }}>Accès restreint</p>
        <a href="/login" style={{ color: "#c8a96e" }}>Se connecter</a>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>AcadémIA Pro · Admin</p>
          <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "24px", margin: "0 0 6px" }}>📊 Prof. Henri Mercier</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>Expert Comptable & Fiscaliste — France · Israël · USA · LLC Wyoming</p>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "30px" }}>
        
        <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ color: "#c8a96e", margin: "0 0 10px", fontSize: "16px" }}>🚀 Action rapide</h3>
          <button
            onClick={genererChecklist}
            disabled={checklistLoading || loading}
            style={{ background: checklistLoading ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "12px 24px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", width: "100%" }}>
            {checklistLoading ? "⏳ Génération en cours..." : "📋 Générer ma checklist complète LLC Wyoming → Israël"}
          </button>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "8px 0 0", textAlign: "center" }}>
            Formulaires · Dates limites · Cases à remplir · Coûts · France + USA + Israël
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          {["france", "israel", "international"].map(c => (
            <button key={c} onClick={() => setContexte(c)}
              style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", background: contexte === c ? "#c8a96e" : "rgba(255,255,255,0.05)", color: contexte === c ? "#050508" : "rgba(255,255,255,0.6)", fontWeight: contexte === c ? "bold" : "normal" }}>
              {c === "france" ? "🇫🇷 France" : c === "israel" ? "🇮🇱 Israël" : "🌍 International"}
            </button>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px", minHeight: "400px", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: "15px", maxHeight: "500px" }}>
            {historique.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: "60px" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "16px" }}>Bonjour. Je suis le Professeur Henri Mercier.</p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "14px" }}>Utilisez le bouton ci-dessus pour votre checklist complète,</p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "14px" }}>ou posez directement votre question comptable.</p>
              </div>
            )}
            {historique.map((msg, i) => (
              <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "10px", maxWidth: "90%", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                  {msg.role === "agent" && <div style={{ color: "#c8a96e", fontSize: "11px", marginBottom: "6px", fontWeight: "bold" }}>📊 Prof. Henri Mercier</div>}
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: "10px", color: "#c8a96e" }}>
                  <div style={{ fontSize: "11px", marginBottom: "4px" }}>📊 Prof. Henri Mercier</div>
                  Analyse en cours...
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input type="text" value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && envoyer()}
              placeholder="Posez votre question comptable ou financière..."
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px" }} />
            <button onClick={() => envoyer()} disabled={loading}
              style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}