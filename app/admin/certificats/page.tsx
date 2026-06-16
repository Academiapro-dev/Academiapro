"use client";
import { useState } from "react";

export default function CertificatsPage() {
  const [form, setForm] = useState({
    nom: "Jacques Lalou",
    formation: "Expert Claude et IA Generative",
    code: "F128",
    niveau: "Expert",
    date: new Date().toLocaleDateString("fr-FR"),
  });
  const [certifHtml, setCertifHtml] = useState("");
  const [loading, setLoading] = useState(false);

  async function genererCertificat() {
    setLoading(true);
    const res = await fetch("/api/admin/certificat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.certif_html) {
      setCertifHtml(data.certif_html);
    }
    setLoading(false);
  }

  function imprimer() {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(certifHtml);
      win.document.close();
      win.print();
    }
  }

  if (certifHtml) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", padding: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button onClick={() => setCertifHtml("")} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
            Retour
          </button>
          <button onClick={imprimer} style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Imprimer / Sauvegarder PDF
          </button>
          <button onClick={() => {
            const link = document.createElement("a");
            const blob = new Blob([certifHtml], { type: "text/html" });
            link.href = URL.createObjectURL(blob);
            link.download = "certificat_academiapro.html";
            link.click();
          }} style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", padding: "8px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Telecharger HTML
          </button>
        </div>
        <div dangerouslySetInnerHTML={{ __html: certifHtml }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "10px" }}>
          🏆 Certificats AcadémIA Pro
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: "40px" }}>
          Generez les certificats de reussite pour vos apprenants
        </p>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "35px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0 }}>Nouveau Certificat</h2>
          <div style={{ display: "grid", gap: "20px" }}>
            {[
              { label: "Nom du stagiaire", key: "nom", placeholder: "Prenom Nom" },
              { label: "Intitule de la formation", key: "formation", placeholder: "Expert Claude et IA Generative" },
              { label: "Code formation", key: "code", placeholder: "F128" },
              { label: "Niveau", key: "niveau", placeholder: "Debutant / Intermediaire / Expert" },
              { label: "Date d obtention", key: "date", placeholder: "16/06/2026" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>{f.label}</label>
                <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
              </div>
            ))}
          </div>
          <button onClick={genererCertificat} disabled={loading}
            style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "25px" }}>
            {loading ? "Generation..." : "Generer le Certificat"}
          </button>
        </div>
      </div>
    </div>
  );
}
