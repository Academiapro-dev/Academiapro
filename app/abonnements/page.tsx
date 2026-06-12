"use client";
import { useState } from "react";

export default function AbonnementsPage() {
  const [tab, setTab] = useState("visio");
  const plans1 = [
    { nom: "Starter", prix: "35euro", desc: "1 seance visio par mois", star: false },
    { nom: "Bien-etre", prix: "79euro", desc: "2 seances visio par mois", star: true },
    { nom: "Intensif", prix: "129euro", desc: "4 seances visio par mois", star: false },
  ];
  const plans2 = [
    { nom: "Starter", prix: "25euro", desc: "1 seance audio par mois", star: false },
    { nom: "Bien-etre", prix: "55euro", desc: "2 seances audio par mois", star: true },
    { nom: "Intensif", prix: "89euro", desc: "4 seances audio par mois", star: false },
  ];
  const plans = tab === "visio" ? plans1 : plans2;
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Abonnements Seances Therapeutiques</h1>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "40px" }}>
          <button onClick={() => setTab("visio")} style={{ background: tab === "visio" ? "#c8a96e" : "#1a1a2e", color: tab === "visio" ? "#050508" : "#fff", border: "1px solid #c8a96e", borderRadius: "8px", padding: "10px 24px", cursor: "pointer", fontWeight: "bold" }}>Visio</button>
          <button onClick={() => setTab("audio")} style={{ background: tab === "audio" ? "#c8a96e" : "#1a1a2e", color: tab === "audio" ? "#050508" : "#fff", border: "1px solid #c8a96e", borderRadius: "8px", padding: "10px 24px", cursor: "pointer", fontWeight: "bold" }}>Audio</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {plans.map((p) => (
            <div key={p.nom} style={{ background: "#1a1a2e", borderRadius: "16px", padding: "28px", border: p.star ? "2px solid #c8a96e" : "1px solid rgba(200,169,110,0.3)" }}>
              {p.star && <div style={{ textAlign: "center", marginBottom: "12px" }}><span style={{ background: "#c8a96e", color: "#050508", padding: "3px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>BEST-SELLER</span></div>}
              <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 8px" }}>{p.nom}</h2>
              <p style={{ color: "#fff", fontSize: "32px", fontWeight: "bold", margin: "0 0 8px" }}>{p.prix}<span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: "normal" }}>/mois</span></p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 20px" }}>{p.desc}</p>
              <button style={{ width: "100%", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>Choisir {p.nom}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}