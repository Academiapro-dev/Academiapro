"use client";
import { useState, useEffect } from "react";

export default function PageFeuillePresence({ params }: { params: { id: string } }) {
  const seanceId = params.id;

  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  function suffixe(sep: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? sep + "tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/presences?seance=" + seanceId + suffixe("&"));
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function heure(v: any) {
    if (!v) return "—";
    return new Date(v).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function couleurTaux(t: number) {
    if (t >= 75) return "#4caf50";
    if (t >= 40) return "#e8a33d";
    return "#e8836a";
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "16px",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href={"/organisme/seances" + suffixe("?")} style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux seances
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          FEUILLE DE PRESENCE
        </p>
        <h1 style={{ color: "#fff", fontSize: "27px", margin: "0 0 6px" }}>
          {d && d.seance ? d.seance.titre : "Seance"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {d && d.seance ? new Date(d.seance.debut).toLocaleString("fr-FR") : ""}
          {d ? " · " + d.duree_prevue + " min prevues" : ""}
          {d && d.seance && d.seance.formateur ? " · " + d.seance.formateur : ""}
          {d && d.seance && d.seance.formation_code ? " · " + d.seance.formation_code : ""}
        </p>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.participants}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Participant(s)</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: d.assidus === d.participants && d.participants > 0 ? "#4caf50" : "#e8a33d", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.assidus}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Assidu(s) · plus de 75 %
                </p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.minutes_cumulees}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Minutes cumulees
                </p>
              </div>
            </div>

            {d.presences.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
                  Personne n a rejoint cette seance. Si elle a bien eu lieu, c est que les
                  participants sont entres par un autre moyen que la plateforme : dans ce cas,
                  aucune preuve d assiduite n a pu etre enregistree.
                </p>
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "13px", color: "#c8a96e", fontWeight: "bold" }}>
                  <span>Participant</span>
                  <span>Entree</span>
                  <span>Sortie</span>
                  <span>Duree</span>
                  <span>Presence</span>
                </div>

                {d.presences.map(function (p: any, i: number) {
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "13px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "14px", color: "rgba(255,255,255,0.8)", alignItems: "center" }}>
                      <span style={{ wordBreak: "break-all" }}>
                        {p.nom || p.email}
                        {p.passages > 1 ? (
                          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
                            {" "}· {p.passages} passages
                          </span>
                        ) : null}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{heure(p.premiere_entree)}</span>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{heure(p.derniere_sortie)}</span>
                      <span style={{ color: "rgba(255,255,255,0.7)" }}>{p.minutes} min</span>
                      <span style={{ color: couleurTaux(p.taux), fontWeight: "bold" }}>{p.taux} %</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ ...CARTE, marginTop: "20px", background: "rgba(200,169,110,0.06)" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0, lineHeight: "1.75" }}>
                Ces heures sont enregistrees automatiquement a l entree et a la sortie de la
                salle. Pour une formation dispensee a distance, ces traces tiennent lieu de
                justificatif d assiduite au sens de l article D. 6313-3-1 du Code du travail.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
