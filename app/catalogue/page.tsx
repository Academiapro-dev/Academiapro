"use client";
import { useState, useEffect } from "react";

async function getFormations() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/formations?select=*&order=code&limit=1000`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  return res.json();
}

export default function CataloguePage() {
  const [formations, setFormations] = useState<any[]>([]);
  const [vueGrille, setVueGrille] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [domaine, setDomaine] = useState("Tous");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFormations().then(data => {
      setFormations(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const domaines = ["Tous", ...Array.from(new Set(formations.map((f: any) => f.domaine).filter(Boolean)))];

  const formationsFiltrees = formations.filter((f: any) => {
    const matchRecherche = f.titre?.toLowerCase().includes(recherche.toLowerCase()) || f.code?.toLowerCase().includes(recherche.toLowerCase());
    const matchDomaine = domaine === "Tous" || f.domaine === domaine;
    return matchRecherche && matchDomaine;
  });

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "2.2rem", marginBottom: "10px" }}>
          Catalogue AcadémIA Pro
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "0" }}>
          {formations.length} formations disponibles
        </p>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "25px 20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Rechercher une formation..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{ flex: 1, minWidth: "200px", padding: "10px 15px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px" }}
          />
          <select value={domaine} onChange={e => setDomaine(e.target.value)}
            style={{ padding: "10px 15px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", fontSize: "14px" }}>
            {domaines.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div style={{ display: "flex", gap: "5px" }}>
            <button onClick={() => setVueGrille(false)}
              style={{ padding: "10px 14px", borderRadius: "8px", border: "none", background: !vueGrille ? "#c8a96e" : "rgba(255,255,255,0.08)", color: !vueGrille ? "#050508" : "#fff", cursor: "pointer", fontSize: "16px" }}>
              ☰
            </button>
            <button onClick={() => setVueGrille(true)}
              style={{ padding: "10px 14px", borderRadius: "8px", border: "none", background: vueGrille ? "#c8a96e" : "rgba(255,255,255,0.08)", color: vueGrille ? "#050508" : "#fff", cursor: "pointer", fontSize: "16px" }}>
              ⊞
            </button>
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
            {formationsFiltrees.length} résultats
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#c8a96e" }}>Chargement...</div>
        ) : vueGrille ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {formationsFiltrees.map((f: any) => (
              <a key={f.code} href={`/formation/${f.code}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", height: "100%", boxSizing: "border-box" as any }}>
                  <div style={{ color: "#c8a96e", fontSize: "11px", marginBottom: "8px", fontWeight: "bold" }}>{f.code} · {f.domaine}</div>
                  <h3 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "15px", margin: "0 0 12px", lineHeight: "1.4" }}>{f.titre}</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{f.duree}</span>
                    {f.prix && <span style={{ background: "#c8a96e", color: "#050508", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>{f.prix}€</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {formationsFiltrees.map((f: any) => (
              <a key={f.code} href={`/formation/${f.code}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "8px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "15px", transition: "background 0.15s" }}>
                  <span style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "bold", minWidth: "50px", fontFamily: "monospace" }}>{f.code}</span>
                  <span style={{ color: "#fff", fontSize: "14px", flex: 1, lineHeight: "1.3" }}>{f.titre}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", minWidth: "60px", textAlign: "right" }}>{f.domaine}</span>
                  {f.duree && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", minWidth: "40px", textAlign: "right" }}>{f.duree}</span>}
                  {f.prix && <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "bold", minWidth: "55px", textAlign: "right" }}>{f.prix}€</span>}
                  <span style={{ color: "rgba(200,169,110,0.5)", fontSize: "14px" }}>→</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
