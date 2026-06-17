"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default function DashboardPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [formationsReco, setFormationsReco] = useState<any[]>([]);
  const [mesFormations, setMesFormations] = useState<any[]>([]);
  const [profil, setProfil] = useState<any>(null);

  useEffect(() => {
    chargerProfil();
    chargerMesFormations();
  }, []);

  async function chargerProfil() {
    try {
      const res = await fetch("/api/gamification?email=contact@academiapro.fr");
      const data = await res.json();
      if (data.profil) setProfil(data.profil);
    } catch {}
  }

  async function chargerMesFormations() {
    try {
      const res = await fetch(
        SUPABASE_URL + "/rest/v1/formations?select=code,titre,prix&order=code&limit=4",
        { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY } }
      );
      const data = await res.json();
      if (Array.isArray(data)) setMesFormations(data);
    } catch {}
  }

  async function envoyerMessage() {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    setFormationsReco([]);
    try {
      const res = await fetch("/api/agent-tuteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, formation_titre: "Formation AcadémIA Pro", historique: chat }),
      });
      const data = await res.json();
      let replyTexte = data.reply || "";
      const SEP = "FORMATIONS_RECOMMANDEES:";
      const idx = replyTexte.indexOf(SEP);
      if (idx > -1) {
        const ligne = replyTexte.slice(idx + SEP.length).split("
")[0];
        const mots = ligne.split(",").map((m: string) => m.trim()).filter(Boolean);
        replyTexte = replyTexte.slice(0, idx).trim();
        try {
          const recoRes = await fetch("/api/catalogue");
          const catalogue = await recoRes.json();
          const reco = catalogue.filter((f: any) =>
            mots.some((mot: string) => f.titre?.toLowerCase().includes(mot.toLowerCase()))
          ).slice(0, 3);
          if (reco.length > 0) setFormationsReco(reco);
        } catch {}
      }
      setChat(prev => [...prev, { role: "agent", text: replyTexte }]);
    } catch {
      setChat(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "30px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "25px" }}>
          Mon Espace Apprenant
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "15px", marginBottom: "35px" }}>
          {[
            { titre: "Formations", valeur: mesFormations.length.toString(), icon: "🎓" },
            { titre: "Points XP", valeur: profil?.xp?.toLocaleString() || "0", icon: "⭐" },
            { titre: "Streak", valeur: (profil?.streak || 0) + "j", icon: "🔥" },
            { titre: "Badges", valeur: (profil?.badges?.length || 0).toString(), icon: "🏆" },
          ].map(item => (
            <div key={item.titre} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
              <div style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold" }}>{item.valeur}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>{item.titre}</div>
            </div>
          ))}
        </div>

        <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
          🤖 Mon Agent IA Tuteur
        </h2>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "280px", marginBottom: "15px", maxHeight: "400px", overflowY: "auto" }}>
          {chat.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "100px" }}>
              Posez une question a votre agent tuteur IA...
            </p>
          )}
          {chat.map((msg, i) => (
            <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "12px", maxWidth: "80%", lineHeight: "1.7", fontSize: "14px" }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ color: "#c8a96e", textAlign: "center", padding: "10px" }}>...</div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
          <input type="text"
            placeholder="Posez votre question a l agent tuteur..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && envoyerMessage()}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
          />
          <button onClick={envoyerMessage} disabled={loading}
            style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Envoyer
          </button>
        </div>

        {formationsReco.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "12px", fontSize: "16px" }}>
              Formations recommandees pour vous
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {formationsReco.map((f: any) => (
                <a key={f.code} href={"/formation/" + f.code}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "14px 18px", textDecoration: "none" }}>
                  <span style={{ color: "#fff", fontSize: "14px" }}>{f.titre}</span>
                  <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{f.prix}€ →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
            🎓 Mes Formations
          </h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {mesFormations.map((f: any) => (
              <div key={f.code} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>{f.code} — {f.titre}</span>
                <a href={"/formation/" + f.code}
                  style={{ background: "#c8a96e", color: "#050508", padding: "8px 16px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "bold" }}>
                  Acceder
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
