"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const TEMPLATES_INFO = [
  { id: "bienvenue", label: "Email Bienvenue", desc: "Envoyé après inscription", icon: "👋", champs: ["nom"] },
  { id: "rappel_classe", label: "Rappel Classe Virtuelle", desc: "1h avant la classe", icon: "🎥", champs: ["titre", "heure"] },
  { id: "certificat", label: "Email Certificat", desc: "Après obtention certificat", icon: "🏆", champs: ["nom", "formation"] },
  { id: "relance", label: "Email Relance", desc: "Après 7 jours inactif", icon: "💌", champs: ["nom"] },
  { id: "newsletter", label: "Newsletter Hebdo", desc: "Chaque lundi matin", icon: "📰", champs: ["date", "formation_semaine"] },
];

export default function EmailsAutoPage() {
  const [historique, setHistorique] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>({ destinataire: "contact@academiapro.fr" });
  const [message, setMessage] = useState("");

  useEffect(() => { chargerHistorique(); }, []);

  async function chargerHistorique() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/emails_automatiques?select=*&order=created_at.desc&limit=50`, { cache: "no-store",  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    setHistorique(Array.isArray(data) ? data : []);
  }

  async function envoyerTest() {
    if (!selected || !form.destinataire) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selected.id,
          destinataire: form.destinataire,
          data: form,
        }),
      });
      const data = await res.json();
      setMessage(data.success ? "Email envoye ✅" : "Erreur : " + data.message);
      chargerHistorique();
    } catch (e) {
      setMessage("Erreur connexion");
    }
    setLoading(false);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 40px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>📧 Emails Automatiques</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0" }}>
          5 templates · Bienvenue · Rappel · Certificat · Relance · Newsletter
        </p>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "30px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "30px" }}>

          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>Templates</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {TEMPLATES_INFO.map(t => (
                <div key={t.id}
                  onClick={() => { setSelected(t); setMessage(""); }}
                  style={{ background: selected?.id === t.id ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${selected?.id === t.id ? "#c8a96e" : "rgba(200,169,110,0.2)"}`, borderRadius: "10px", padding: "15px", cursor: "pointer", display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "25px" }}>{t.icon}</span>
                  <div>
                    <div style={{ color: "#fff", fontWeight: "bold", fontSize: "14px" }}>{t.label}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
              {selected ? `Tester : ${selected.label}` : "Sélectionnez un template"}
            </h2>
            {selected ? (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px" }}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Email destinataire</label>
                  <input type="email" value={form.destinataire}
                    onChange={e => setForm((p: any) => ({ ...p, destinataire: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
                </div>
                {selected.champs.map((champ: string) => (
                  <div key={champ} style={{ marginBottom: "15px" }}>
                    <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{champ}</label>
                    <input type="text" placeholder={champ} value={form[champ] || ""}
                      onChange={e => setForm((p: any) => ({ ...p, [champ]: e.target.value }))}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
                  </div>
                ))}
                <button onClick={envoyerTest} disabled={loading}
                  style={{ width: "100%", padding: "12px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                  {loading ? "Envoi..." : "Envoyer l email test"}
                </button>
                {message && (
                  <p style={{ color: message.includes("✅") ? "#22c55e" : "#ef4444", textAlign: "center", marginTop: "10px", fontWeight: "bold" }}>
                    {message}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.3)" }}>Cliquez sur un template pour le tester</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
            Historique ({historique.length} emails)
          </h2>
          {historique.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)" }}>Aucun email envoyé pour le moment</p>
          ) : (
            historique.map(e => (
              <div key={e.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)", borderRadius: "8px", padding: "12px 18px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ color: "#fff", fontSize: "14px" }}>{e.sujet}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginLeft: "10px" }}>{e.destinataire}</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ color: e.statut === "envoye" ? "#22c55e" : "#ef4444", fontSize: "11px", fontWeight: "bold" }}>
                    {e.statut === "envoye" ? "✅ Envoyé" : "❌ Erreur"}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
                    {new Date(e.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
