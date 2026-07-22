"use client";

import { useState } from "react";

export default function Test5472Page() {
  const [tenantId, setTenantId] = useState("048da817-b4d1-40d8-9107-88fe87e600ee");
  const [year, setYear] = useState("2026");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  async function generer() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/compliance/f5472/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, year: Number(year) }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult("Erreur : " + String(e));
    }
    setLoading(false);
  }

  return (
    <main style={{ padding: 32, fontFamily: "system-ui", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ color: "#14532d" }}>Test generation Form 5472</h1>
      <p style={{ color: "#666" }}>
        Document fictif. Taux de change provisoire, qualification non validee par un fiscaliste.
      </p>

      <div style={{ marginTop: 24 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Tenant ID</label>
        <input
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Exercice</label>
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{ width: 120, padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
        />
      </div>

      <button
        onClick={generer}
        disabled={loading}
        style={{
          marginTop: 24,
          padding: "12px 24px",
          background: "#14532d",
          color: "#d4af37",
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        {loading ? "Generation en cours..." : "Generer le Form 5472"}
      </button>

      {result && (
        <pre
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f5f5f5",
            borderRadius: 6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            fontSize: 13,
          }}
        >
          {result}
        </pre>
      )}
    </main>
  );
}
