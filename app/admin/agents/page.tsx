"use client";
import { useState } from "react";

const AGENTS = [
  {
    id: "comptable",
    nom: "Mr Comptable",
    specialite: "Expert-Comptable Senior",
    description: "Comptabilité · Fiscalité · Gestion financière · Micro-entreprise · TVA · Bilan",
    icon: "📊",
    prompt: "Tu es Mr Comptable, expert-comptable senior avec 20 ans d expérience en France. Tu conseilles Jacques Lalou, fondateur d AcadémIA Pro, une plateforme de formation et bien-être 100% IA en micro-entreprise. Tu maîtrises parfaitement la comptabilité française, la fiscalité des entreprises, la TVA, les cotisations URSSAF, les déclarations de revenus, la gestion de trésorerie et la transition vers une SAS ou SARL. Tu donnes des conseils pratiques, précis et adaptés à la situation de Jacques. Tu parles en français de manière claire et professionnelle. Tu rappelles toujours de consulter un vrai expert-comptable pour les décisions importantes."
  },
  {
    id: "juridique",
    nom: "Mr Juridique",
    specialite: "Juriste d Entreprise Senior",
    description: "Droit des sociétés · Contrats · CGV · Mentions légales · RGPD · Protection marque",
    icon: "⚖️",
    prompt: "Tu es Mr Juridique, juriste d entreprise senior avec 20 ans d expérience en droit français des affaires. Tu conseilles Jacques Lalou, fondateur d AcadémIA Pro, une plateforme de formation et bien-être 100% IA. Tu maîtrises le droit des sociétés, la création d entreprise, les contrats commerciaux, les CGV, les mentions légales, le RGPD, la protection de la marque INPI, le droit de la formation professionnelle et les aspects juridiques des plateformes IA. Tu donnes des conseils pratiques et précis adaptés à AcadémIA Pro. Tu rappelles toujours de consulter un avocat pour les décisions juridiques importantes."
  },
];

export default function AdminAgentsPage() {
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
      const res = await fetch("/api/admin/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          agent: selected,
          historique: chat
        }),
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
          <button onClick={() => { setSelected(null); setChat([]); }} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "20px" }}>
            ← Retour
          </button>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div style={{ fontSize: "50px", marginBottom: "10px" }}>{selected.icon}</div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif" }}>{selected.nom}</h2>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>{selected.specialite}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "350px", maxHeight: "450px", overflowY: "auto", marginBottom: "15px" }}>
            {chat.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "120px" }}>
                Bonjour Jacques · Je suis {selected.nom}. Comment puis-je vous aider ?
              </p>
            )}
            {chat.map((msg, i) => (
              <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)",
                  color: msg.role === "user" ? "#050508" : "#fff",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  maxWidth: "80%",
                  lineHeight: "1.7"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ color: "#c8a96e", textAlign: "center" }}>{selected.nom} analyse votre question...</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder={`Posez votre question à ${selected.nom}...`}
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
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "10px" }}>
        Agents Back-Office
      </h1>
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", marginBottom: "40px" }}>
        Vos experts IA dédiés · Disponibles 24h/24
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", maxWidth: "700px", margin: "0 auto" }}>
        {AGENTS.map((a) => (
          <div
            key={a.id}
            onClick={() => { setSelected(a); setChat([]); }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px", cursor: "pointer" }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>{a.icon}</div>
            <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "5px" }}>{a.nom}</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "10px" }}>{a.specialite}</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: "1.6" }}>{a.description}</p>
            <button style={{ marginTop: "15px", width: "100%", padding: "10px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Consulter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
