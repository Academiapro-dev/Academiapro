"use client";
import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

const THERAPEUTES = [
  { id: 1, nom: "Dr. Sophie Martin", specialite: "Psychologue Clinicienne — TCC", icon: "🧠", color: "#c8a96e",
    prompt: "Tu es Dr. Sophie Martin, psychologue clinicienne specialisee en TCC. Tu aides avec anxiete, depression, phobies, burn-out. Tu ne fais jamais de diagnostic medical. Tu reponds toujours dans la langue du patient." },
  { id: 2, nom: "Dr. Michel Dreyfus", specialite: "Psychanalyste", icon: "🛋️", color: "#3b82f6",
    prompt: "Tu es Dr. Michel Dreyfus, psychanalyste. Approche psychanalytique profonde. Exploration de l inconscient. Tu reponds toujours dans la langue du patient." },
  { id: 3, nom: "Dr. Isabelle Laurent", specialite: "Hypnotherapeute Ericksonienne", icon: "🌀", color: "#8b5cf6",
    prompt: "Tu es Dr. Isabelle Laurent, hypnotherapeute. Hypnose pour anxiete, phobies, addictions. Tu parles avec un rythme lent et apaisant. Tu reponds toujours dans la langue du patient." },
  { id: 4, nom: "Marc Benoist", specialite: "Coach PNL — Maitre Praticien", icon: "🎯", color: "#ef4444",
    prompt: "Tu es Marc Benoist, coach PNL. Programmation Neuro-Linguistique pour reprogrammer les schemas limitants. Tu reponds toujours dans la langue du patient." },
  { id: 5, nom: "Sarah Dubois", specialite: "Coach de Vie — Certifiee ICF", icon: "✨", color: "#22c55e",
    prompt: "Tu es Sarah Dubois, coach de vie certifiee ICF. Coaching oriente objectifs. Tu guides le patient vers ses propres solutions. Tu reponds toujours dans la langue du patient." },
];

export default function SeancesPage() {
  const { t, langue } = useTranslation("seances");
  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  async function envoyerMessage() {
    if (!message.trim() || !selected) return;
    const userMsg = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/agents/therapeutique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, therapeute: selected, historique: chat }),
      });
      const data = await res.json();
      setChat(prev => [...prev, { role: "agent", text: data.reply }]);
    } catch (e) {
      setChat(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
  }

  if (selected) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <button onClick={() => { setSelected(null); setChat([]); }}
            style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "20px" }}>
            ← {t("changer")}
          </button>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div style={{ fontSize: "50px", marginBottom: "10px" }}>{selected.icon}</div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif" }}>{selected.nom}</h2>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>{selected.specialite}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "350px", maxHeight: "450px", overflowY: "auto", marginBottom: "15px" }}>
            {chat.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "120px" }}>
                {t("placeholder")} {selected.nom}...
              </p>
            )}
            {chat.map((msg, i) => (
              <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "12px", maxWidth: "80%", lineHeight: "1.7" }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: "#c8a96e", textAlign: "center" }}>...</div>}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input type="text"
              placeholder={`${t("placeholder")} ${selected.nom}...`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && envoyerMessage()}
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
            />
            <button onClick={envoyerMessage} disabled={loading}
              style={{ padding: "12px 20px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              {t("envoyer")}
            </button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textAlign: "center", marginTop: "10px" }}>
            ⚠️ {t("avertissement")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "2.2rem", marginBottom: "10px" }}>
          {t("titre")}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)" }}>{t("sous_titre")}</p>
      </div>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {THERAPEUTES.map(th => (
            <div key={th.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${th.color}40`, borderRadius: "12px", padding: "25px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>{th.icon}</div>
              <h3 style={{ color: th.color, fontFamily: "Georgia,serif", margin: "0 0 5px" }}>{th.nom}</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "15px" }}>{th.specialite}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                <span style={{ color: "#22c55e", fontSize: "12px" }}>{t("disponible")}</span>
              </div>
              <button onClick={() => { setSelected(th); setChat([]); }}
                style={{ width: "100%", padding: "12px", background: th.color, color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                {t("commencer")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
