"use client";

import { useEffect, useState } from "react";

type Doc = {
  id: string;
  doc_type: string;
  title: string;
  version: number;
  uploaded_at: string;
  download_url: string | null;
};

const TYPES = [
  "Statuts et documents de constitution",
  "Déclaration fiscale",
  "Attestation administrative",
  "Contrat",
  "Facture ou justificatif",
  "Correspondance officielle",
  "Autre",
];

export default function DeposerAuCoffre() {
  // L organisme vient de la session, JAMAIS d une constante ecrite en dur.
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [fichier, setFichier] = useState<File | null>(null);
  const [titre, setTitre] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function charger(id: string) {
    setChargement(true);
    try {
      const r = await fetch("/api/compliance/dashboard?tenant_id=" + id);
      const d = await r.json();
      if (d.success) setDocuments(d.documents || []);
      else setMsg("Erreur : " + (d.error || "inconnue"));
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }
    setChargement(false);
  }

  useEffect(() => {
    async function demarrer() {
      try {
        const r = await fetch("/api/compliance/moi", { cache: "no-store" });
        const d = await r.json();
        if (!d.ok || !d.tenant_id) {
          setMsg("Connectez-vous pour accéder à votre coffre.");
          setChargement(false);
          return;
        }
        setTenantId(d.tenant_id);
        charger(d.tenant_id);
      } catch (e: any) {
        setMsg("Erreur : " + String(e));
        setChargement(false);
      }
    }
    demarrer();
  }, []);

  async function deposer() {
    if (!tenantId) return;
    if (!fichier) {
      setMsg("Choisissez un fichier.");
      return;
    }
    if (titre.trim().length < 2) {
      setMsg("Donnez un titre au document.");
      return;
    }

    setEnCours(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", fichier);
      fd.append("tenant_id", tenantId);
      fd.append("title", titre.trim());
      fd.append("doc_type", type);

      const r = await fetch("/api/compliance/upload", { method: "POST", body: fd });
      const d = await r.json();

      if (d.success) {
        setMsg("Document déposé, versionné et scellé.");
        setFichier(null);
        setTitre("");
        charger(tenantId);
      } else {
        setMsg("Erreur : " + (d.error || d.erreur || "inconnue"));
      }
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }
    setEnCours(false);
  }

  const champ: any = {
    width: "100%",
    padding: 10,
    fontSize: 15,
    marginTop: 4,
    marginBottom: 14,
    border: "1px solid #ccc",
    borderRadius: 4,
    background: "#ffffff",
    color: "#1a1a1a",
    boxSizing: "border-box",
  };

  const label: any = { display: "block", fontWeight: 600, fontSize: 14 };

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#ffffff",
        color: "#1a1a1a",
        minHeight: "100vh",
        colorScheme: "light",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
        <a href="/admin/compliance" style={{ color: "#0a3d2e", fontSize: 14, textDecoration: "none" }}>
          ← Retour
        </a>

        <h1 style={{ color: "#0a3d2e", borderBottom: "3px solid #0a3d2e", paddingBottom: 10, marginTop: 18 }}>
          Déposer une pièce au coffre
        </h1>

        <div style={{ background: "#f0f5f2", borderLeft: "4px solid #0a3d2e", padding: 16, marginBottom: 24 }}>
          Chaque dépôt est <strong>versionné, horodaté et scellé par une empreinte SHA-256</strong>.
          Déposer deux fois le même document ne l'écrase pas : il crée une nouvelle version, et
          l'ancienne reste consultable.
        </div>

        <label style={label}>Titre du document (obligatoire)</label>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Attestation de dépôt 2026"
          style={champ}
        />

        <label style={label}>Nature du document</label>
        <select value={type} onChange={(e) => setType(e.target.value)} style={champ}>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <label style={label}>Fichier (PDF, image)</label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => setFichier(e.target.files ? e.target.files[0] : null)}
          style={{ ...champ, padding: 8 }}
        />
        {fichier && (
          <p style={{ color: "#0a3d2e", fontSize: 13, marginTop: -8 }}>
            {fichier.name}
          </p>
        )}

        <button
          onClick={deposer}
          disabled={enCours || !tenantId}
          style={{
            background: enCours ? "#7a9a8e" : "#0a3d2e",
            color: "#ffffff",
            border: "none",
            padding: "14px 22px",
            borderRadius: 6,
            cursor: enCours ? "default" : "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {enCours ? "Dépôt en cours…" : "Déposer au coffre"}
        </button>

        {msg && (
          <p style={{ marginTop: 14, color: msg.indexOf("Erreur") === 0 ? "#c62828" : "#0a3d2e" }}>
            {msg}
          </p>
        )}

        <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 36 }}>
          Documents archivés
        </h2>

        {chargement && <p>Chargement…</p>}

        {!chargement && documents.length === 0 && (
          <p style={{ color: "#666" }}>Aucun document au coffre pour l'instant.</p>
        )}

        {documents.map((doc) => (
          <div
            key={doc.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              background: "#ffffff",
            }}
          >
            <strong style={{ color: "#0a3d2e", fontSize: 16 }}>{doc.title}</strong>
            <span style={{ color: "#666", fontSize: 13, marginLeft: 10 }}>version {doc.version}</span>
            <br />
            <span style={{ color: "#666", fontSize: 14 }}>
              {doc.doc_type} — déposé le {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
            </span>
            {doc.download_url && (
              <>
                <br />
                <a
                  href={doc.download_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#0a3d2e", fontSize: 14 }}
                >
                  Télécharger
                </a>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
