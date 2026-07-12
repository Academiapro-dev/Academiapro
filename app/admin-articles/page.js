"use client";
import { useState } from "react";

const OR = "#c9a227";

export default function AdminArticlesPage() {
  const [secret, setSecret] = useState("");
  const [connecte, setConnecte] = useState(false);
  const [brouillons, setBrouillons] = useState([]);
  const [ouvert, setOuvert] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");

  async function charger(s) {
    setChargement(true);
    setMessage("");
    try {
      const r = await fetch(
        "/api/admin-articles?secret=" + encodeURIComponent(s));
      const d = await r.json();
      if (d.erreur) { setMessage("Code refuse."); }
      else {
        setBrouillons(d.brouillons || []);
        setConnecte(true);
      }
    } catch (e) { setMessage("Erreur reseau."); }
    setChargement(false);
  }

  async function agir(action, id) {
    setChargement(true);
    try {
      await fetch(
        "/api/admin-articles?secret="
        + encodeURIComponent(secret), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      setOuvert(null);
      await charger(secret);
      setMessage(action === "publier"
        ? "Article publie ! Traduction cette nuit a 3h."
        : "Brouillon supprime.");
    } catch (e) { setMessage("Erreur."); }
    setChargement(false);
  }

  if (!connecte) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: "380px", width: "100%", textAlign: "center" }}>
          <h1 style={{ color: OR, marginBottom: "8px" }}>Validation des articles</h1>
          <p style={{ opacity: 0.6, fontSize: "14px", marginBottom: "24px" }}>Entrez votre code d acces</p>
          <input type="password" value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && charger(secret)}
            placeholder="Code d acces"
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(201,162,39,0.4)", background: "rgba(255,255,255,0.05)", boxSizing: "border-box", marginBottom: "14px" }} />
          <button onClick={() => charger(secret)} disabled={chargement}
            style={{ width: "100%", padding: "13px", background: OR, color: "#0f1420", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            {chargement ? "..." : "Entrer"}
          </button>
          {message && <p style={{ color: "#ef4444", marginTop: "14px", fontSize: "13px" }}>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: OR, marginBottom: "6px" }}>Brouillons en attente</h1>
        <p style={{ opacity: 0.6, fontSize: "14px", marginBottom: "24px" }}>
          {brouillons.length} article(s) a valider
        </p>
        {message && <p style={{ color: "#22c55e", marginBottom: "16px", fontSize: "14px" }}>{message}</p>}
        {brouillons.length === 0 && (
          <p style={{ opacity: 0.5 }}>Aucun brouillon. Le redacteur repassera mercredi.</p>
        )}
        {brouillons.map((a) => (
          <div key={a.id} style={{ background: "rgba(245,239,224,0.04)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "12px", padding: "20px 22px", marginBottom: "16px" }}>
            <div style={{ color: OR, fontSize: "12px", marginBottom: "6px" }}>{a.categorie || ""}</div>
            <h2 style={{ fontSize: "17px", margin: "0 0 8px", lineHeight: 1.4 }}>{a.titre}</h2>
            <p style={{ opacity: 0.7, fontSize: "13px", lineHeight: 1.6, margin: "0 0 14px" }}>{a.extrait}</p>
            {ouvert === a.id && (
              <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: "8px", padding: "16px", marginBottom: "14px", maxHeight: "320px", overflowY: "auto", whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: 1.8, opacity: 0.9 }}>
                {a.contenu}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={() => setOuvert(ouvert === a.id ? null : a.id)}
                style={{ background: "none", border: "1px solid rgba(201,162,39,0.4)", color: OR, padding: "9px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                {ouvert === a.id ? "Fermer" : "Lire"}
              </button>
              <button onClick={() => agir("publier", a.id)} disabled={chargement}
                style={{ background: "#22c55e", border: "none", color: "#0f1420", padding: "9px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                Publier
              </button>
              <button onClick={() => agir("refuser", a.id)} disabled={chargement}
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444", padding: "9px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                Refuser
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
