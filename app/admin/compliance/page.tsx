"use client";

import { useEffect, useState } from "react";

const TENANT_ID = "048da817-b4d1-40d8-9107-88fe87e600ee";

type Deadline = {
  id: string;
  rule_code: string;
  title: string;
  jurisdiction: string;
  channel: string;
  period_label: string;
  due_date: string;
  status: string;
  amount_due: number | null;
  currency: string;
};

type Doc = {
  id: string;
  doc_type: string;
  title: string;
  version: number;
  uploaded_at: string;
  download_url: string | null;
};

const STATUT_LABEL: Record<string, string> = {
  a_venir: "A venir",
  prepare: "Prepare",
  depose: "Depose",
  accuse_archive: "Accuse archive",
};

const STATUT_COLOR: Record<string, string> = {
  a_venir: "#888",
  prepare: "#c8a96e",
  depose: "#2e7d32",
  accuse_archive: "#0a3d2e",
};

function joursRestants(due: string): number {
  const d = new Date(due).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / 86400000);
}

export default function ComplianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  async function charger() {
    setLoading(true);
    setErreur(null);
    try {
      const r = await fetch("/api/compliance/dashboard?tenant_id=" + TENANT_ID);
      const data = await r.json();
      if (!data.success) {
        setErreur(data.error || "Erreur de chargement");
      } else {
        setTenant(data.tenant);
        setDeadlines(data.deadlines || []);
        setDocuments(data.documents || []);
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setLoading(false);
  }

  useEffect(() => {
    charger();
  }, []);

  async function genererAnnualReport() {
    setGenLoading(true);
    setGenMsg(null);
    try {
      const r = await fetch("/api/compliance/annual-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: TENANT_ID, year: 2027 }),
      });
      const data = await r.json();
      if (data.success) {
        setGenMsg("Fiche generee (version " + data.version + ", license tax " + data.tax + " USD). Envoyee par email et archivee.");
        charger();
      } else {
        setGenMsg("Erreur : " + (data.error || "inconnue"));
      }
    } catch (e: any) {
      setGenMsg("Erreur : " + String(e));
    }
    setGenLoading(false);
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", maxWidth: 1000, margin: "0 auto", padding: 32, color: "#1a1a1a" }}>
      <h1 style={{ color: "#0a3d2e", borderBottom: "3px solid #0a3d2e", paddingBottom: 10 }}>
        Tableau de bord Compliance
      </h1>

      {loading && <p>Chargement...</p>}
      {erreur && <p style={{ color: "#c62828" }}>Erreur : {erreur}</p>}

      {tenant && (
        <div style={{ background: "#f4f4f0", padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <strong>{tenant.legal_name}</strong><br />
          Wyoming Filing ID : {tenant.wy_filing_id || "-"}<br />
          Residence du fondateur : {tenant.member_residence || "-"}<br />
          Revenus de source US : {tenant.has_us_source_income ? "Oui" : "Non"}
        </div>
      )}

      <h2 style={{ color: "#0a3d2e", fontSize: 20 }}>Actions</h2>
      <button
        onClick={genererAnnualReport}
        disabled={genLoading}
        style={{ background: "#0a3d2e", color: "#fff", border: "none", padding: "12px 20px", borderRadius: 6, cursor: "pointer", fontSize: 15 }}
      >
        {genLoading ? "Generation..." : "Generer la fiche Annual Report 2027"}
      </button>
      {genMsg && <p style={{ marginTop: 10, color: "#0a3d2e" }}>{genMsg}</p>}

      <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>Calendrier des echeances</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#0a3d2e", color: "#fff" }}>
            <th style={{ padding: 8, textAlign: "left" }}>Echeance</th>
            <th style={{ padding: 8 }}>Date</th>
            <th style={{ padding: 8 }}>Dans</th>
            <th style={{ padding: 8 }}>Statut</th>
            <th style={{ padding: 8 }}>Montant</th>
            <th style={{ padding: 8 }}>Canal</th>
          </tr>
        </thead>
        <tbody>
          {deadlines.map((d) => {
            const jr = joursRestants(d.due_date);
            return (
              <tr key={d.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: 8 }}>{d.title}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{d.due_date}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{jr > 0 ? "J-" + jr : "echu"}</td>
                <td style={{ padding: 8, textAlign: "center", color: STATUT_COLOR[d.status] || "#000" }}>
                  {STATUT_LABEL[d.status] || d.status}
                </td>
                <td style={{ padding: 8, textAlign: "center" }}>
                  {d.amount_due ? d.amount_due + " " + d.currency : "-"}
                </td>
                <td style={{ padding: 8, textAlign: "center" }}>{d.channel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>Coffre documentaire</h2>
      {documents.length === 0 && <p>Aucun document archive.</p>}
      <ul>
        {documents.map((doc) => (
          <li key={doc.id} style={{ marginBottom: 8 }}>
            {doc.title} (v{doc.version}) - {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
            {doc.download_url && (
              <> - <a href={doc.download_url} target="_blank" rel="noreferrer" style={{ color: "#0a3d2e" }}>Telecharger</a></>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
