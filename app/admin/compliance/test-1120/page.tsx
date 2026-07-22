"use client";

import { useState } from "react";

export default function Test1120() {
  const [tenantId, setTenantId] = useState("048da817-b4d1-40d8-9107-88fe87e600ee");
  const [year, setYear] = useState("2026");
  const [sortie, setSortie] = useState("");
  const [enCours, setEnCours] = useState(false);

  const lancer = async () => {
    setEnCours(true);
    setSortie("");
    try {
      const r = await fetch("/api/compliance/f1120/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, year: Number(year) }),
      });
      const j = await r.json();
      setSortie(JSON.stringify(j, null, 2));
    } catch (e) {
      setSortie("Erreur: " + String(e));
    }
    setEnCours(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ color: "#1f4d36" }}>Test generation Form 1120</h1>
      <p style={{ color: "#666" }}>
        Document fictif. Taux de change provisoire, qualification non validee par un fiscaliste.
      </p>

      <label style={{ display: "block", marginTop: 16, fontWeight: 600 }}>Tenant ID</label>
      <input
        value={tenantId}
        onChange={(e) => setTenantId(e.target.value)}
        style={{ width: "100%", padding: 10, fontSize: 15, marginTop: 4 }}
      />

      <label style={{ display: "block", marginTop: 16, fontWeight: 600 }}>Exercice</label>
      <input
        value={year}
        onChange={(e) => setYear(e.target.value)}
        style={{ width: 140, padding: 10, fontSize: 15, marginTop: 4 }}
      />

      <div style={{ marginTop: 20 }}>
        <button
          onClick={lancer}
          disabled={enCours}
          style={{
            padding: "14px 22px",
            fontSize: 16,
            background: "#1f4d36",
            color: "#d4af6a",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
          }}
        >
          {enCours ? "Generation en cours..." : "Generer le Form 1120"}
        </button>
      </div>

      {sortie && (
        <pre
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f4f4f4",
            color: "#111",
            fontSize: 13,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            borderRadius: 6,
          }}
        >
          {sortie}
        </pre>
      )}
    </div>
  );
}
