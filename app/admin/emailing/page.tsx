"use client";
import { useState, useEffect } from "react";

const TYPES_EMAIL = [
  { id: "bienvenue", label: "🎉 Bienvenue", desc: "Nouvel inscrit" },
  { id: "relance", label: "🔥 Relance Prospect", desc: "Prospect inactif" },
  { id: "remotivation", label: "💪 Remotivation", desc: "Apprenant inactif" },
  { id: "certification", label: "🏆 Certification", desc: "Félicitations" },
  { id: "newsletter", label: "📰 Newsletter", desc: "Mensuelle" },
  { id: "rappel_classe", label: "📅 Rappel Classe", desc: "Avant séance" },
];

// Le produit commande l'expéditeur, l'adresse de réponse ET le contenu généré.
// Un cabinet comptable ne doit pas recevoir un message signé d'une académie.
const PRODUITS = [
  { id: "academia", label: "AcadémIA Pro", desc: "Formation professionnelle" },
  { id: "comptable", label: "Mr. Comptable", desc: "Cabinets comptables" },
];

export default function EmailingPage() {
  const [stats, setStats] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [onglet, setOnglet] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [typeSelectionne, setTypeSelectionne] = useState("bienvenue");
  const [produit, setProduit] = useState("academia");
  const [contexte, setContexte] = useState({ prenom: "", nom: "", email: "", formation: "", mois: "", date: "", heure: "", jours: "7", progression: "" });
  const [envoyer, setEnvoyer] = useState(false);

  useEffect(() => { charger(); }, []);

  async function charger() {
    const [s, e] = await Promise.all([
      fetch("/api/emailing").then(r => r.json()),
      fetch("/api/emailing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "liste" }) }).then(r => r.json()),
    ]);
    setStats(s);
    setEmails(Array.isArray(e) ? e : []);
  }

  async function genererEmail() {
    setLoading(true);
    setResultat(null);
    const r = await fetch("/api/emailing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generer", type: typeSelectionne, produit, contexte, envoyer }),
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

  const marque = produit === "comptable" ? "Mr. Comptable" : "AcadémIA Pro";

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <h1 style={{ color: "#c8a96e", margin: 0, fontSize: "24px" }}>📧 Agent Emailing</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0", fontSize: "13px" }}>{marque} · Piloté par CAM</p>
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
                { label: "Total Emails", value: stats.total || 0, color: "#c8a96e" },
                { label: "Envoyés ✅", value: stats.envoyes || 0, color: "#00e676" },
                { label: "En attente ⏳", value: stats.en_attente || 0, color: "#ff5252" },
              ].map(item => (
                <div key={item.label} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: item.color }}>{item.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {stats.par_type && (
              <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ color: "#c8a96e", marginTop: 0, fontSize: "14px" }}>PAR TYPE</h3>
                {Object.entries(stats.par_type).map(([type, count]: any) => (
                  <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{type}</span>
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

        {onglet === "generer" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "12px" }}>PRODUIT</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "25px" }}>
              {PRODUITS.map(p => (
                <button key={p.id} onClick={() => setProduit(p.id)}
                  style={{ padding: "12px", borderRadius: "8px", border: `1px solid ${produit === p.id ? "#c8a96e" : "rgba(255,255,255,0.1)"}`, background: produit === p.id ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.03)", color: produit === p.id ? "#c8a96e" : "rgba(255,255,255,0.6)", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontWeight: "bold", fontSize: "13px" }}>{p.label}</div>
                  <div style={{ fontSize: "11px", marginTop: "3px" }}>{p.desc}</div>
                </button>
              ))}
            </div>

            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "12px" }}>TYPE D'EMAIL</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {TYPES_EMAIL.map(t => (
                <button key={t.id} onClick={() => setTypeSelectionne(t.id)}
                  style={{ padding: "12px", borderRadius: "8px", border: `1px solid ${typeSelectionne === t.id ? "#c8a96e" : "rgba(255,255,255,0.1)"}`, background: typeSelectionne === t.id ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.03)", color: typeSelectionne === t.id ? "#c8a96e" : "rgba(255,255,255,0.6)", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontWeight: "bold", fontSize: "13px" }}>{t.label}</div>
                  <div style={{ fontSize: "11px", marginTop: "3px" }}>{t.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Prénom", key: "prenom", placeholder: "Marie" },
                { label: "Email destinataire", key: "email", placeholder: "marie@email.com" },
                { label: produit === "comptable" ? "Sujet d'intérêt" : "Formation", key: "formation", placeholder: produit === "comptable" ? "Tenue comptable et liasses" : "Sophrologie Caycédienne" },
                { label: "Nom", key: "nom", placeholder: "Dupont" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input value={(contexte as any)[f.key]} onChange={e => setContexte(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", background: "rgba(200,169,110,0.1)", padding: "15px", borderRadius: "8px" }}>
              <input type="checkbox" checked={envoyer} onChange={e => setEnvoyer(e.target.checked)} style={{ width: "18px", height: "18px" }} />
              <span style={{ color: "#c8a96e", fontSize: "13px" }}>Envoyer immédiatement via Resend</span>
            </div>

            <button onClick={genererEmail} disabled={loading}
              style={{ width: "100%", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "14px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}>
              {loading ? "Génération en cours..." : "✍️ Générer l'email"}
            </button>

            {resultat && !loading && (
              <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", marginTop: "20px", border: "1px solid rgba(200,169,110,0.3)" }}>
                {resultat.expediteur && (
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "12px", wordBreak: "break-all" }}>
                    Expéditeur : {resultat.expediteur}
                  </div>
                )}
                <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px", marginBottom: "8px" }}>SUJET</div>
                <div style={{ color: "#fff", marginBottom: "15px", fontSize: "14px" }}>{resultat.sujet}</div>
                <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px", marginBottom: "8px" }}>CORPS</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{resultat.corps}</div>
                {resultat.envoye && <div style={{ color: "#00e676", marginTop: "10px", fontWeight: "bold" }}>✅ Email envoyé via Resend</div>}
              </div>
            )}
          </div>
        )}

        {onglet === "historique" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "15px" }}>HISTORIQUE ({emails.length})</h2>
            {emails.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>Aucun email généré pour l instant.</p>
            ) : (
              emails.map(e => (
                <div key={e.id} style={{ background: "#1a1a2e", borderRadius: "10px", padding: "15px", marginBottom: "10px", border: "1px solid rgba(200,169,110,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>{e.sujet}</span>
                    <span style={{ color: e.envoye ? "#00e676" : "#ff5252", fontSize: "11px" }}>{e.envoye ? "✅ Envoyé" : "⏳ En attente"}</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                    {e.type} · {e.destinataire} · {new Date(e.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
