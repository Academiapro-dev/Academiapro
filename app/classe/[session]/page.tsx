"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
} from "@livekit/components-react";
import "@livekit/components-styles";

const styleSalle = `
  /* Masquer la tuile du cerveau (agent sans video) */
  .lk-participant-tile[data-lk-local-participant="false"]:has(
    .lk-participant-name[title^="agent-"]) {
    display: none;
  }
  /* Nom convivial sur la tuile de l'avatar */
  .lk-participant-name[title^="liveavatar"] {
    visibility: hidden;
    position: relative;
  }
  .lk-participant-name[title^="liveavatar"]::after {
    content: "Formateur AcadémIA";
    visibility: visible;
    position: absolute;
    left: 0;
  }
`;

export default function ClasseVirtuellePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const session = params.session as string;
  const prenom = searchParams.get("prenom") || "";

  const [token, setToken] = useState<string>("");
  const [erreur, setErreur] = useState<string>("");
  const [nom, setNom] = useState<string>(prenom);
  const [pret, setPret] = useState<boolean>(false);

  useEffect(() => {
    if (!pret || !nom) return;
    fetch(
      "/api/classe-token?session=" +
        encodeURIComponent(session) +
        "&identite=" +
        encodeURIComponent(nom)
    )
      .then((r) => {
        if (!r.ok) throw new Error("Erreur serveur " + r.status);
        return r.json();
      })
      .then((data) => setToken(data.token))
      .catch(() => setErreur("Impossible de rejoindre la classe."));
  }, [pret, nom, session]);

  // Ecran d'accueil : le stagiaire entre son prenom
  if (!pret) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#0f172a", color: "white", padding: 24,
      }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          Classe Virtuelle AcademIA Pro
        </h1>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>
          Session : {session}
        </p>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Votre prenom"
          style={{
            padding: "12px 16px", borderRadius: 8, border: "none",
            fontSize: 16, marginBottom: 16, width: 280,
          }}
        />
        <button
          onClick={() => nom.trim() && setPret(true)}
          style={{
            padding: "12px 32px", borderRadius: 8, border: "none",
            background: "#3b82f6", color: "white", fontSize: 16,
            cursor: "pointer",
          }}
        >
          Rejoindre la classe
        </button>
      </div>
    );
  }

  if (erreur) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#0f172a", color: "white",
      }}>
        <p>{erreur}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#0f172a", color: "white",
      }}>
        <p>Connexion a la classe...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      audio={true}
      video={false}
      data-lk-theme="default"
      style={{ height: "100vh", background: "#111" }}
    >
      <style>{styleSalle}</style>
      <VideoConference chatMessageFormatter={formatChatMessageLinks} />
    </LiveKitRoom>
  );
}
