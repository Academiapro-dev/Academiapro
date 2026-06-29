"use client";
import { useState } from "react";

const INTERETS = [
  "Formations professionnelles",
  "Pack IA Expert",
  "Séances thérapeutiques",
  "Classe virtuelle Live",
  "Tout AcadémIA Pro",
];

export default function InscriptionPage() {
  const [form, setForm] = useState({ nom: "", email: "", interet: "" });
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");
  const [compteur] = useState(Math.floor(Math.random() * 50) + 127);

  async function inscrire() {
    if (!form.nom || !form.email) {
      setErreur("Veuillez remplir votre nom et email");
      return;
    }
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "page_inscription" }),
      });
      const data = await res.json();
      if (data.success) {
        setSucces(true);
      } else {
        setErreur(data.message || "Une erreur est survenue");
      }
    } catch (e) {
      setErreur("Erreur de connexion");
    }
    setLoading(false);
  }

  if (succes) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: "500px", textAlign: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>🎉</div>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
            Bienvenue sur la liste prioritaire !
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8", marginBottom: "25px" }}>
            {form.nom}, vous etes parmi les premiers a rejoindre AcadémIA Pro.
            Vous serez contacte en priorite des l ouverture officielle avec une offre exclusive.
          </p>
          <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "25px" }}>
            <h3 style={{ color: "#c8a96e", marginTop: 0 }}>Ce qui vous attend</h3>
            {[
              "Acces prioritaire avant ouverture publique",
              "Tarif de lancement exclusif",
              "Formation offerte au choix",
              "Accompagnement personnalise",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ color: "#22c55e" }}>✓</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>{item}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 30px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
            Retour a l accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", marginBottom: "15px" }}>LANCEMENT IMMINENT</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.5rem", marginBottom: "15px" }}>
          Rejoignez la Liste Prioritaire
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", maxWidth: "600px", margin: "0 auto 25px" }}>
          Soyez parmi les premiers a acceder a AcadémIA Pro et beneficiez de tarifs de lancement exclusifs.
        </p>
        <div style={{ display: "inline-flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>
            {compteur} personnes deja inscrites
          </span>
          <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>
            Places limitees au lancement
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "50px 20px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "40px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0, marginBottom: "25px", textAlign: "center" }}>
            Votre inscription gratuite
          </h2>
          {erreur && (
            <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid red", borderRadius: "8px", padding: "10px", marginBottom: "20px", color: "#ff6b6b", textAlign: "center" }}>
              {erreur}
            </div>
          )}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>Votre nom</label>
            <input type="text" placeholder="Votre nom" value={form.nom}
              onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>Votre email</label>
            <input type="email" placeholder="vous@exemple.fr" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
          </div>
          <div style={{ marginBottom: "25px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>Votre interet principal</label>
            <select value={form.interet} onChange={e => setForm(p => ({ ...p, interet: e.target.value }))}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", boxSizing: "border-box" as any }}>
              <option value="">Choisir...</option>
              {INTERETS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <button onClick={inscrire} disabled={loading}
            style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Inscription en cours..." : "Rejoindre la liste prioritaire"}
          </button>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", marginTop: "15px" }}>
            Inscription gratuite - Aucun paiement requis - Vous serez contacte a l ouverture
          </p>
        </div>

        <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
          {[
            { icon: "🎓", label: "235 formations", desc: "Certifiantes" },
            { icon: "🤖", label: "Agent IA", desc: "24h/24" },
            { icon: "💆", label: "5 therapeutes", desc: "IA specialises" },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
              <div style={{ fontSize: "25px", marginBottom: "5px" }}>{item.icon}</div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>{item.label}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
