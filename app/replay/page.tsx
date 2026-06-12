"use client";
import { useState } from "react";

export default function ReplaysPage() {
  const [filter, setFilter] = useState("tous");

  const replays = [
    {
      id: 1,
      titre: "Yoga Vinyasa Flow",
      specialite: "yoga",
      coach: "Sophie Martin",
      date: "2025-01-28",
      duree: "55 min",
      expiration: "2025-01-30",
      thumbnail: "🧘‍♀️",
      niveau: "Intermédiaire",
    },
    {
      id: 2,
      titre: "HIIT Cardio Intense",
      specialite: "cardio",
      coach: "Marc Dubois",
      date: "2025-01-27",
      duree: "40 min",
      expiration: "2025-01-29",
      thumbnail: "🔥",
      niveau: "Avancé",
    },
    {
      id: 3,
      titre: "Pilates Core & Équilibre",
      specialite: "pilates",
      coach: "Laura Petit",
      date: "2025-01-28",
      duree: "50 min",
      expiration: "2025-01-30",
      thumbnail: "⚖️",
      niveau: "Débutant",
    },
    {
      id: 4,
      titre: "Méditation Pleine Conscience",
      specialite: "meditation",
      coach: "Thomas Leroy",
      date: "2025-01-26",
      duree: "30 min",
      expiration: "2025-01-28",
      thumbnail: "🌿",
      niveau: "Tous niveaux",
    },
    {
      id: 5,
      titre: "Renforcement Musculaire",
      specialite: "musculation",
      coach: "Alex Bernard",
      date: "2025-01-27",
      duree: "60 min",
      expiration: "2025-01-29",
      thumbnail: "💪",
      niveau: "Intermédiaire",
    },
    {
      id: 6,
      titre: "Stretching & Récupération",
      specialite: "yoga",
      coach: "Sophie Martin",
      date: "2025-01-25",
      duree: "35 min",
      expiration: "2025-01-27",
      thumbnail: "🌸",
      niveau: "Débutant",
    },
  ];

  const specialites = ["tous", "yoga", "cardio", "pilates", "meditation", "musculation"];

  const labelSpecialite = {
    tous: "Tous",
    yoga: "Yoga",
    cardio: "Cardio",
    pilates: "Pilates",
    meditation: "Méditation",
    musculation: "Musculation",
  };

  const couleurSpecialite = {
    yoga: "#c8a96e",
    cardio: "#e05555",
    pilates: "#7eb8c9",
    meditation: "#9b8fc2",
    musculation: "#6db87a",
  };

  const now = new Date();

  const isExpired = (expiration) => {
    return new Date(expiration) < now;
  };

  const heuresRestantes = (expiration) => {
    const diff = new Date(expiration) - now;
    if (diff <= 0) return null;
    const heures = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (heures > 0) return heures + "h restantes";
    return minutes + "min restantes";
  };

  const filteredReplays = filter === "tous"
    ? replays
    : replays.filter((r) => r.specialite === filter);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050508", fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#ffffff" }}>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px 80px" }}>

        <div style={{ marginBottom: "56px" }}>
          <p style={{ color: "#c8a96e", fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "14px", fontWeight: "600" }}>
            Séances en différé
          </p>
          <h1 style={{ fontSize: "44px", fontWeight: "300", color: "#ffffff", margin: "0 0 16px", letterSpacing: "-0.5px", lineHeight: "1.1" }}>
            Replays
          </h1>
          <p style={{ color: "#8a8a9a", fontSize: "15px", lineHeight: "1.6", maxWidth: "480px", margin: "0" }}>
            Accédez à vos séances en replay. Chaque session est disponible <span style={{ color: "#c8a96e", fontWeight: "600" }}>48h</span> après la diffusion en direct.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "48px" }}>
          {specialites.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "9px 22px",
                borderRadius: "40px",
                border: filter === s ? "1.5px solid #c8a96e" : "1.5px solid #2a2a35",
                backgroundColor: filter === s ? "#c8a96e" : "transparent",
                color: filter === s ? "#050508" : "#8a8a9a",
                fontSize: "13px",
                fontWeight: filter === s ? "700" : "400",
                cursor: "pointer",
                letterSpacing: "0.5px",
                transition: "all 0.2s",
              }}
            >
              {labelSpecialite[s]}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {filteredReplays.map((replay) => {
            const expire = isExpired(replay.expiration);
            const restant = heuresRestantes(replay.expiration);
            const couleur = couleurSpecialite[replay.specialite] || "#c8a96e";

            return (
              <div
                key={replay.id}
                style={{
                  backgroundColor: "#0d0d12",
                  border: "1px solid #1e1e28",
                  borderRadius: "16px",
                  overflow: "hidden",
                  opacity: expire ? "0.45" : "1",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
              >

                <div style={{ backgroundColor: "#12121a", height: "160px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderBottom: "1px solid #1e1e28" }}>
                  <span style={{ fontSize: "64px" }}>{replay.thumbnail}</span>

                  <div style={{ position: "absolute", top: "14px", left: "14px" }}>
                    <span style={{ backgroundColor: couleur + "22", color: couleur, fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", padding: "5px 12px", borderRadius: "20px", border: "1px solid " + couleur + "44" }}>
                      {labelSpecialite[replay.specialite]}
                    </span>
                  </div>

                  <div style={{ position: "absolute", top: "14px", right: "14px" }}>
                    {expire ? (
                      <span style={{ backgroundColor: "#2a1515", color: "#e05555", fontSize: "11px", fontWeight: "600", padding: "5px 12px", borderRadius: "20px", border: "1px solid #e0555544" }}>
                        Expiré
                      </span>
                    ) : (
                      <span style={{ backgroundColor: "#1a2a15", color: "#6db87a", fontSize: "11px", fontWeight: "600", padding: "5px 12px", borderRadius: "20px", border: "1px solid #6db87a44" }}>
                        ● Disponible
                      </span>
                    )}
                  </div>

                  <div style={{ position: "absolute", bottom: "12px", right: "14px", backgroundColor: "#050508cc", borderRadius: "8px", padding: "4px 10px" }}>
                    <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: "600" }}>{replay.duree}</span>
                  </div>
                </div>

                <div style={{ padding: "22px 24px 24px" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: "600", color: "#ffffff", margin: "0 0 6px", letterSpacing: "-0.2px" }}>
                    {replay.titre}
                  </h3>

                  <p style={{ color: "#8a8a9a", fontSize: "13px", margin: "0 0 16px" }}>
                    avec <span style={{ color: "#c8a96e" }}>{replay.coach}</span>
                  </p>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#17171f", borderRadius: "8px", padding: "6px 12px" }}>
                      <span style={{ fontSize: "12px" }}>📅</span>
                      <span style={{ color: "#6a6a7a", fontSize: "12px" }}>{formatDate(replay.date)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#17171f", borderRadius: "8px", padding: "6px 12px" }}>
                      <span style={{ fontSize: "12px" }}>🎯</span>
                      <span style={{ color: "#6a6a7a", fontSize: "12px" }}>{replay.niveau}</span>
                    </div>
                  </div>

                  {!expire && restant && (
                    <div style={{ backgroundColor: "#1a1508", border: "1px solid #c8a96e33", borderRadius: "8px", padding: "10px 14px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px" }}>⏱</span>
                      <span style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "600" }}>Expire dans {restant}</span>
                    </div>
                  )}

                  <button
                    disabled={expire}
                    style={{
                      width: "100%",
                      padding: "13px 0",
                      borderRadius: "10px",
                      border: expire ? "1px solid #2a2a35" : "none",
                      backgroundColor: expire ? "transparent" : "#c8a96e",
                      color: expire ? "#3a3a4a" : "#050508",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: expire ? "not-allowed" : "pointer",
                      letterSpacing: "0.5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {expire ? (
                      "Replay expiré"
                    ) : (
                      <>
                        <span>▶</span>
                        <span>Regarder le replay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredReplays.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "48px", marginBottom: "16px" }}>📭</p>
            <p style={{ color: "#4a4a5a", fontSize: "16px" }}>Aucun replay disponible pour cette catégorie.</p>
          </div>
        )}

        <div style={{ marginTop: "64px", backgroundColor: "#0d0d12", border: "1px solid #1e1e28", borderRadius: "16px", padding: "28px 32px", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "48px", height: "48px", backgroundColor: "#c8a96e22", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
            <span style={{ fontSize: "22px" }}>ℹ️</span>
          </div>
          <div>
            <p style={{ color: "#ffffff", fontSize: "14px", fontWeight: "600", margin: "0 0 4px" }}>Disponibilité des replays</p>
            <p style={{ color: "#6a6a7a", fontSize: "13px", lineHeight: "1.6", margin: "0" }}>
              Les replays sont accessibles pendant <span style={{ color: "#c8a96e" }}>48 heures</span> après la fin de la séance en direct. Passé ce délai, la session n'est plus disponible au visionnage.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}