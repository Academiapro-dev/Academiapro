"use client";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [formationsReco, setFormationsReco] = useState<any[]>([]);

  async function envoyerMessage() {
    if (!message.trim()) return;
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
          formation_titre: "Formation AcadémIA Pro"
        }),
      });
      const data = await res.json();
      // Extraire formations recommandees
      let replyTexte = data.reply || "";
      const recoMatch = replyTexte.match(/FORMATIONS_RECOMMANDEES:\s*(.+)/);
      if (recoMatch) {
        const mots = recoMatch[1].split(",").map((m: string) => m.trim());
        replyTexte = replyTexte.replace(/FORMATIONS_RECOMMANDEES:.+/, "").trim();
        // Chercher les formations correspondantes
        try {
          const recoRes = await fetch("/api/catalogue");
          const catalogue = await recoRes.json();
          const reco = catalogue.filter((f: any) =>
            mots.some((mot: string) => f.titre?.toLowerCase().includes(mot.toLowerCase()))
          ).slice(0, 3);
          setFormationsReco(reco);
        } catch {}
      }
      data.reply = replyTexte;
      setChat(prev => [...prev, { role: "agent", text: data.reply }]);
    } catch (e) {
      setChat(prev => [...prev, { role: "agent", text: "Erreur de connexion avec l agent." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "20px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "10px" }}>
        Mon Dashboard — AcadémIA Pro
      </h1>
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginBottom: "30px" }}>
        Bienvenue Jacques · Abonnement Premium ✅
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px", marginBottom: "40px" }}>
        {[
          { titre: "Formations achetées", valeur: "4", icon: "🎓" },
          { titre: "Points XP", valeur: "1500", icon: "⭐" },
          { titre: "Séances restantes", valeur: "10", icon: "💆" },
          { titre: "Badges", valeur: "2", icon: "🏆" },
        ].map((item) => (
          <div key={item.titre} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "30px", marginBottom: "8px" }}>{item.icon}</div>
            <div style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold" }}>{item.valeur}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "5px" }}>{item.titre}</div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>
          🤖 Mon Agent IA Tuteur
        </h2>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "300px", marginBottom: "15px", maxHeight: "400px", overflowY: "auto" }}>
          {chat.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "100px" }}>
              Posez une question à votre agent tuteur IA...
            </p>
          )}
          {chat.map((msg, i) => (
            <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)",
                color: msg.role === "user" ? "#050508" : "#fff",
                padding: "12px 16px",
                borderRadius: "12px",
                maxWidth: "75%",
                lineHeight: "1.6"
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ color: "#c8a96e", textAlign: "center" }}>Agent IA en train de répondre...</div>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Posez votre question à l agent tuteur..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
          />
          <button
            onClick={envoyerMessage}
            disabled={loading}
            style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
          >
            Envoyer
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "40px auto 0" }}>
        <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>
          🎓 Mes Formations
        </h2>
        <div style={{ display: "grid", gap: "15px" }}>
          {["F001 — Management et Leadership", "F128 — Expert Claude et IA Générative", "F129 — No-Code et Automatisation IA", "F130 — Apps Natives avec IA"].map((f) => (
            <div key={f} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.8)" }}>{f}</span>
              <a href={`/formation/${f.split(" ")[0]}`} style={{ background: "#c8a96e", color: "#050508", padding: "8px 16px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "bold" }}>
                Accéder
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
