"use client";

import { useState } from "react";

const TENANT_ID = "048da817-b4d1-40d8-9107-88fe87e600ee";

const TYPES = [
  { valeur: "convention_compte_courant", libelle: "Convention de compte courant d'associe" },
  { valeur: "lettre_irs", libelle: "Courrier ou lettre IRS (147C, CP575...)" },
  { valeur: "statuts", libelle: "Statuts / documents de constitution" },
  { valeur: "accuse_depot", libelle: "Accuse de depot d'une declaration" },
  { valeur: "releve_bancaire", libelle: "Releve bancaire" },
  { valeur: "piece_justificative", libelle: "Autre piece justificative" },
];

const STYLE_CHAMP = {
  width: "100%",
  padding: 10,
  fontSize: 15,
  marginTop: 4,
  marginBottom: 16,
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#ffffff",
  color: "#1a1a1a",
};

const STYLE_LIBELLE = {
  display: "block",
  fontWeight: 600,
  fontSize: 14,
};

export default function DeposerPiece() {
  const [fichier, setFichier] = useState<File | null>(null);
  const [titre, setTitre] = useState("");
  const [docType, setDocType] = useState("convention_compte_courant");
  const [notes, setNotes] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  async function deposer() {
    if (!fichier) {
      setMsg("Erreur : choisissez un fichier.");
      return;
    }
    if (!titre.trim()) {
      setMsg("Erreur : le titre est obligatoire.");
      return;
    }

    setEnCours(true);
    setMsg(null);
    setDetail(null);

    try {
      const donnees = new FormData();
      donnees.append("fichier", fichier);
      donnees.append("tenant_id", TENANT_ID);
      donnees.append("titre", titre.trim());
      donnees.append("doc_type", docType);
      donnees.append("notes", notes.trim());

      const r = await fetch("/api/compliance/upload", {
        method: "POST",
        body: donnees,
      });
      const d = await r.json();

      if (d.success) {
        const ko = Math.round(d.taille_octets / 1024);
        setMsg("Piece deposee au coffre (version " + d.version + ", " + ko + " Ko).");
        setDetail("Empreinte SHA-256 : " + d.hash_sha256);
        setFichier(null);
        setTitre("");
        setNotes("");
        const champFichier = document.getElementById("champ-fichier") as HTMLInputElement | null;
        if (champFichier) champFichier.value = "";
      } else {
        setMsg("Erreur : " + (d.error || "inconnue"));
      }
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }

    setEnCours(false);
  }

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
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
        <h1 style={{ color: "#0a3d2e", borderBottom: "3px solid #0a3d2e", paddingBottom: 10 }}>
          Deposer une piece au coffre
        </h1>

        <div
          style={{
            background: "#f0f5f2",
            borderLeft: "4px solid #0a3d2e",
            padding: 16,
            marginBottom: 24,
          }}
        >
          Le coffre conserve les pieces justificatives de maniere versionnee et horodatee,
          avec une empreinte SHA-256 qui prouve que le fichier n'a pas ete modifie apres
          son depot. Rien n'est jamais ecrase : chaque depot cree une nouvelle version.
        </div>

        <span style={STYLE_LIBELLE}>Type de piece</span>
        <select value={docType} onChange={(e) => setDocType(e.target.value)} style={STYLE_CHAMP}>
          {TYPES.map((t) => (
            <option key={t.valeur} value={t.valeur}>{t.libelle}</option>
          ))}
        </select>

        <span style={STYLE_LIBELLE}>Titre du document (obligatoire)</span>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Convention de compte courant d'associe signee - juillet 2026"
          style={STYLE_CHAMP}
        />

        <span style={STYLE_LIBELLE}>Fichier (PDF, image, maximum 20 Mo)</span>
        <input
          id="champ-fichier"
          type="file"
          onChange={(e) => setFichier(e.target.files ? e.target.files[0] : null)}
          style={STYLE_CHAMP}
        />

        {fichier && (
          <p style={{ marginTop: -8, marginBottom: 16, fontSize: 14, color: "#555" }}>
            Selectionne : {fichier.name} ({Math.round(fichier.size / 1024)} Ko)
          </p>
        )}

        <span style={STYLE_LIBELLE}>Notes (facultatif)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={STYLE_CHAMP}
        />

        <button
          onClick={deposer}
          disabled={enCours}
          style={{
            background: "#0a3d2e",
            color: "#ffffff",
            border: "none",
            padding: "14px 22px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {enCours ? "Depot en cours..." : "Deposer au coffre"}
        </button>

        {msg && (
          <p style={{ marginTop: 16, color: msg.indexOf("Erreur") === 0 ? "#c62828" : "#0a3d2e" }}>
            {msg}
          </p>
        )}

        {detail && (
          <p style={{ fontSize: 12, color: "#666", wordBreak: "break-all" }}>{detail}</p>
        )}

        <p style={{ marginTop: 32 }}>
          <a href="/admin/compliance" style={{ color: "#0a3d2e" }}>
            Retour au tableau de bord
          </a>
        </p>
      </div>
    </div>
  );
}
