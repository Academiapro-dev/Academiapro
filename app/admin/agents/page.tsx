"use client";
import { useState } from "react";

function formatReponse(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/#{3} (.+)/g, "<h4 style=\"color:#c8a96e;margin:12px 0 6px;\">$1</h4>")
    .replace(/#{2} (.+)/g, "<h3 style=\"color:#c8a96e;margin:15px 0 8px;\">$1</h3>")
    .replace(/# (.+)/g, "<h2 style=\"color:#c8a96e;margin:18px 0 10px;\">$1</h2>")
    .replace(/^- (.+)/gm, "<li style=\"margin:4px 0;\">$1</li>")
    .replace(/---/g, "<hr style=\"border-color:rgba(200,169,110,0.2);margin:10px 0;\">")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

const AGENTS = [
  {
    id: "comptable",
    nom: "Mr Comptable",
    specialite: "Expert-Comptable Senior",
    description: "Comptabilite · Fiscalite · Micro-entreprise · TVA · URSSAF · Facturation",
    icon: "📊",
    prompt: "Tu es Mr Comptable, expert-comptable senior avec 20 ans d experience en France. Tu conseilles Jacques Lalou, fondateur d AcadémIA Pro. Tu maitrises la comptabilite francaise, la fiscalite, la TVA, les cotisations URSSAF et la facturation. Tu donnes des conseils pratiques et precis. Tu structures tes reponses avec des titres clairs.",
  },
  {
    id: "juridique",
    nom: "Mr Juridique",
    specialite: "Juriste d Entreprise Senior",
    description: "Droit des societes · Contrats · CGV · Mentions legales · RGPD · INPI",
    icon: "⚖️",
    prompt: "Tu es Mr Juridique, juriste d entreprise senior avec 20 ans d experience en droit francais des affaires. Tu conseilles Jacques Lalou, fondateur d AcadémIA Pro. Tu maitrises le droit des societes, les contrats, les CGV, les mentions legales, le RGPD et la protection de marque INPI. Tu donnes des conseils pratiques et precis.",
  },
];

export default function AdminAgentsPage() {
  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFacture, setShowFacture] = useState(false);
  const [facture, setFacture] = useState({ client: "", montant: "", description: "", numero: "" });
  const [factureHtml, setFactureHtml] = useState("");

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
        body: JSON.stringify({ message: userMsg, agent: selected, historique: chat }),
      });
      const data = await res.json();
      setChat(prev => [...prev, { role: "agent", text: data.reply }]);
    } catch (e) {
      setChat(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
  }

  async function genererFacture() {
    const res = await fetch("/api/admin/facture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facture),
    });
    const data = await res.json();
    if (data.facture_html) {
      setFactureHtml(data.facture_html);
    }
  }

  function imprimerFacture() {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(factureHtml);
      win.document.close();
      win.print();
    }
  }

  if (factureHtml) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", padding: "20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button onClick={() => setFactureHtml("")} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
              Retour
            </button>
            <button onClick={imprimerFacture} style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Imprimer / Sauvegarder PDF
            </button>
          </div>
          <div dangerouslySetInnerHTML={{ __html: factureHtml }} style={{ background: "#fff", borderRadius: "12px", padding: "20px" }} />
        </div>
      </div>
    );
  }

  if (showFacture && selected?.id === "comptable") {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <button onClick={() => setShowFacture(false)} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "20px" }}>
            Retour
          </button>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "25px" }}>
            📄 Nouvelle Facture
          </h2>
          {[
            { label: "Numéro de facture", key: "numero", placeholder: "F2026-001" },
            { label: "Nom du client", key: "client", placeholder: "Société ABC" },
            { label: "Description", key: "description", placeholder: "Formation Expert Claude et IA Générative" },
            { label: "Montant (€)", key: "montant", placeholder: "690" },
          ].map((field) => (
            <div key={field.key} style={{ marginBottom: "20px" }}>
              <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                {field.label}
              </label>
              <input
                type="text"
                placeholder={field.placeholder}
                value={(facture as any)[field.key]}
                onChange={(e) => setFacture(prev => ({ ...prev, [field.key]: e.target.value }))}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" }}
              />
            </div>
          ))}
          <button
            onClick={genererFacture}
            style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
          >
            Générer la facture PDF
          </button>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button onClick={() => { setSelected(null); setChat([]); }} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
              Retour
            </button>
            {selected.id === "comptable" && (
              <button onClick={() => setShowFacture(true)} style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Créer une facture
              </button>
            )}
          </div>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "50px" }}>{selected.icon}</div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif" }}>{selected.nom}</h2>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>{selected.specialite}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "350px", maxHeight: "500px", overflowY: "auto", marginBottom: "15px" }}>
            {chat.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "120px" }}>
                Bonjour Jacques. Je suis {selected.nom}. Comment puis-je vous aider ?
              </p>
            )}
            {chat.map((msg, i) => (
              <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "12px", maxWidth: "80%", lineHeight: "1.7" }}
                  dangerouslySetInnerHTML={msg.role === "agent" ? { __html: formatReponse(msg.text) } : undefined}
                >
                  {msg.role === "user" ? msg.text : undefined}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: "#c8a96e", textAlign: "center" }}>{selected.nom} analyse...</div>}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder={"Posez votre question a " + selected.nom + "..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
            />
            <button onClick={envoyerMessage} disabled={loading} style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
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
        Vos experts IA dedies · Disponibles 24h/24
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", maxWidth: "700px", margin: "0 auto" }}>
        {AGENTS.map((a) => (
          <div key={a.id} onClick={() => { setSelected(a); setChat([]); }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px", cursor: "pointer" }}>
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
