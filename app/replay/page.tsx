import React, { useState } from "react";

const replays = [
  {
    id: 1,
    titre: "Yoga du matin - Réveil en douceur",
    specialite: "Yoga",
    date: "2025-01-13",
    duree: "45 min",
    coach: "Sophie M.",
    disponibleJusqu: "2025-01-15",
    thumbnail: "🧘‍♀️",
  },
  {
    id: 2,
    titre: "HIIT Intensif - Cardio Power",
    specialite: "HIIT",
    date: "2025-01-13",
    duree: "30 min",
    coach: "Marc D.",
    disponibleJusqu: "2025-01-15",
    thumbnail: "🔥",
  },
  {
    id: 3,
    titre: "Pilates - Renforcement profond",
    specialite: "Pilates",
    date: "2025-01-12",
    duree: "60 min",
    coach: "Laura B.",
    disponibleJusqu: "2025-01-14",
    thumbnail: "⚡",
  },
  {
    id: 4,
    titre: "Méditation guidée - Pleine conscience",
    specialite: "Méditation",
    date: "2025-01-12",
    duree: "20 min",
    coach: "Thomas R.",
    disponibleJusqu: "2025-01-14",
    thumbnail: "🌿",
  },
  {
    id: 5,
    titre: "Stretching - Souplesse totale",
    specialite: "Stretching",
    date: "2025-01-11",
    duree: "35 min",
    coach: "Camille V.",
    disponibleJusqu: "2025-01-13",
    thumbnail: "🌸",
  },
  {
    id: 6,
    titre: "Boxe - Endurance et Punch",
    specialite: "Boxe",
    date: "2025-01-11",
    duree: "50 min",
    coach: "Antoine L.",
    disponibleJusqu: "2025-01-13",
    thumbnail: "🥊",
  },
];

const specialites = ["Toutes", "Yoga", "HIIT", "Pilates", "Méditation", "Stretching", "Boxe"];

const couleurSpecialite: Record<string, string> = {
  Yoga: "#7c6af5",
  HIIT: "#e85d4a",
  Pilates: "#4ab8e8",
  Méditation: "#6abf8a",
  Stretching: "#e8a84a",
  Boxe: "#c8a96e",
};

export default function ReplaySeances() {
  const [filtreActif, setFiltreActif] = useState("Toutes");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);
  const [hoveredFiltre, setHoveredFiltre] = useState<string | null>(null);

  const replaysFiltres =
    filtreActif === "Toutes"
      ? replays
      : replays.filter((r) => r.specialite === filtreActif);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getTempsRestant = (disponibleJusqu: string) => {
    const now = new Date();
    const fin = new Date(disponibleJusqu);
    const diff = fin.getTime() - now.getTime();
    if (diff <= 0) return "Expiré";
    const heures = Math.floor(diff / (1000 * 60 * 60));
    if (heures < 24) return "Expire dans " + heures + "h";
    const jours = Math.floor(heures / 24);
    return "Expire dans " + jours + "j";
  };

  const isExpired = (disponibleJusqu: string) => {
    return new Date(disponibleJusqu).getTime() < new Date().getTime();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', sans-serif",
        padding: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          padding: "32px 40px 28px",
          background: "linear-gradient(180deg, rgba(200,169,110,0.06) 0%, transparent 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            ▶
          </div>
          <h1
            style={{
              margin: "0",
              fontSize: "26px",
              fontWeight: "700",
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            Replays des séances
          </h1>
        </div>
        <p style={{ margin: "0", color: "rgba(200,169,110,0.7)", fontSize: "14px", paddingLeft: "54px" }}>
          Revivez vos séances préférées — disponibles pendant 48h
        </p>
      </div>

      {/* Contenu principal */}
      <div style={{ padding: "32px 40px" }}>
        {/* Badge info 48h */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(200,169,110,0.1)",
            border: "1px solid rgba(200,169,110,0.25)",
            borderRadius: "20px",
            padding: "8px 16px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#c8a96e",
              boxShadow: "0 0 8px #c8a96e",
            }}
          />
          <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "500" }}>
            Les replays sont accessibles pendant 48h après la séance en direct
          </span>
        </div>

        {/* Filtres spécialités */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "32px" }}>
          {specialites.map((spec) => (
            <button
              key={spec}
              onClick={() => setFiltreActif(spec)}
              onMouseEnter={() => setHoveredFiltre(spec)}
              onMouseLeave={() => setHoveredFiltre(null)}
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                border:
                  filtreActif === spec
                    ? "1px solid #c8a96e"
                    : "1px solid rgba(255,255,255,0.12)",
                backgroundColor:
                  filtreActif === spec
                    ? "rgba(200,169,110,0.15)"
                    : hoveredFiltre === spec
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                color: filtreActif === spec ? "#c8a96e" : "rgba(255,255,255,0.6)",
                fontSize: "13px",
                fontWeight: filtreActif === spec ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.2s ease",
                outline: "none",
              }}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Compteur résultats */}
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginBottom: "20px" }}>
          {replaysFiltres.length} replay{replaysFiltres.length > 1 ? "s" : ""} disponible{replaysFiltres.length > 1 ? "s" : ""}
        </p>

        {/* Grille de replays */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          {replaysFiltres.map((replay) => {
            const expired = isExpired(replay.disponibleJusqu);
            const tempsRestant = getTempsRestant(replay.disponibleJusqu);
            const couleur = couleurSpecialite[replay.specialite] || "#c8a96e";
            const isHovered = hoveredCard === replay.id;
            const isBtnHovered = hoveredBtn === replay.id;

            return (
              <div
                key={replay.id}
                onMouseEnter={() => setHoveredCard(replay.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: isHovered
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(255,255,255,0.025)",
                  border: isHovered
                    ? "1px solid rgba(200,169,110,0.3)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  transition: "all 0.25s ease",
                  transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                  boxShadow: isHovered
                    ? "0 12px 40px rgba(200,169,110,0.08)"
                    : "0 4px 20px rgba(0,0,0,0.3)",
                  opacity: expired ? 0.5 : 1,
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    height: "120px",
                    background: "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(5,5,8,0.9) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ fontSize: "48px" }}>{replay.thumbnail}</span>

                  {/* Badge spécialité */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      backgroundColor: couleur + "22",
                      border: "1px solid " + couleur + "55",
                      borderRadius: "8px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: couleur,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {replay.specialite}
                  </div>

                  {/* Icône play overlay */}
                  {!expired && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(200,169,110,0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: isHovered ? 1 : 0,
                        transition: "opacity 0.2s ease",
                        fontSize: "16px",
                        paddingLeft: "3px",
                      }}
                    >
                      ▶
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div style={{ padding: "18px 20px" }}>
                  <h3
                    style={{
                      margin: "0 0 6px",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#ffffff",
                      lineHeight: "1.4",
                    }}
                  >
                    {replay.titre}
                  </h3>

                  <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>
                    Coach : {replay.coach}
                  </p>

                  {/* Infos métadonnées */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    {/* Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "13px" }}>📅</span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>
                        {formatDate(replay.date)}
                      </span>
                    </div>

                    {/* Durée */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "13px" }}>⏱</span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>
                        {replay.duree}
                      </span>
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div
                    style={{
                      height: "1px",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      marginBottom: "16px",
                    }}
                  />

                  {/* Footer : temps restant + bouton */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {/* Temps restant */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          backgroundColor: expired ? "#666" : tempsRestant.includes("h") ? "#e8a84a" : "#6abf8a",
                          boxShadow: expired
                            ?