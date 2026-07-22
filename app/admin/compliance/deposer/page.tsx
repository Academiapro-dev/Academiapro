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
        const champ = document.getElementById("champ-fichier") as HTMLInputElement | null;
        if (champ) champ.value = "";
      } else {
        setMsg("Erreur : " + (d.error || "inconnue"));
      }
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }

    setEnCours(false);
  }

  const champ = {
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

  const label = { display: "block", fontWeight: 600, fontSize: 14 };

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

        <div style={{ background: "#f0f5f2", borderLeft: "4px solid #0a3d2e", padding: 16, marginBottom: 24 }}>
          Le coffre conserve les pieces justificatives de maniere versionnee et horodatee,
          avec une empreinte SHA-256 qui prouve que le fichier n'a pas ete mod
