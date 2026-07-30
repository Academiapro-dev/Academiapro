"use client";
import { useState, useEffect } from "react";

export default function PageEvaluations() {
  const [d, setD] = useState<any>(null);
  const [moment, setMoment] = useState("chaud");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "?tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/evaluation" + suffixe());
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
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
    padding: "22px 26px",
    marginBottom: "18px",
  };

  function couleurNote(n: any) {
    if (n === null || n === undefined) return "rgba(255,255,255,0.35)";
    if (n >= 4) return "#4caf50";
    if (n >= 3) return "#e8a33d";
    return "#e8836a";
  }

  const s = d ? (moment === "chaud" ? d.chaud : d.froid) : null;
  const liste = d ? (d.evaluations || []).filter(function (e: any) { return e.moment === moment; }) : [];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          APPRECIATIONS DES STAGIAIRES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Evaluations</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Indicateurs 30 et 32 du referentiel national qualite
        </p>

        <div style={{ display: "flex", gap: "10px", margin: "24px 0 20px" }}>
          {[["chaud", "A chaud"], ["froid", "A froid"]].map(function (m) {
            const actif = moment === m[0];
            return (
              <button
                key={m[0]}
                onClick={() => setMoment(m[0])}
                style={{ padding: "11px 22px", borderRadius: "8px", border: "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: actif ? "bold" : "normal" }}
              >
                {m[1]}
              </button>
            );
          })}
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: couleurNote(s.globale), fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {s.globale !== null ? s.globale + "/5" : "—"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Satisfaction globale</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.taux_retour !== null ? d.taux_retour + " %" : "—"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Taux de retour · {s.nombre} sur {d.inscrits}
                </p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {s.recommanderaient}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Recommanderaient</p>
              </div>
            </div>

            <div style={CARTE}>
              <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 14px" }}>Par critere</h2>
              {[
                ["Contenu", s.contenu],
                ["Accompagnement et corrections", s.accompagnement],
                ["Plateforme", s.plateforme],
              ].map(function (x: any) {
                return (
                  <div key={x[0]} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px" }}>{x[0]}</span>
                    <span style={{ color: couleurNote(x[1]), fontSize: "15px", fontWeight: "bold" }}>
                      {x[1] !== null ? x[1] + "/5" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {d.taux_retour !== null && d.taux_retour < 50 && s.nombre > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
                  Votre taux de retour est de {d.taux_retour} %. Un auditeur ne se contente pas
                  d une moyenne flatteuse : il regarde combien de stagiaires ont repondu. Relancez
                  ceux qui n ont pas encore donne leur avis.
                </p>
              </div>
            )}

            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 14px" }}>
              Ce que disent vos stagiaires
            </h2>

            {liste.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune evaluation {moment === "chaud" ? "a chaud" : "a froid"} pour le moment.
                </p>
              </div>
            ) : (
              liste.map(function (e: any) {
                return (
                  <div key={e.id} style={CARTE}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", wordBreak: "break-all" }}>
                        {e.stagiaire_email}{e.formation_code ? " · " + e.formation_code : ""}
                      </span>
                      <span style={{ color: couleurNote(e.note_globale), fontSize: "16px", fontWeight: "bold" }}>
                        {e.note_globale}/5
                        {e.recommanderait === true ? " · recommande" : e.recommanderait === false ? " · ne recommande pas" : ""}
                      </span>
                    </div>

                    {[
                      ["Ce qui a servi", e.points_forts],
                      ["A ameliorer", e.points_ameliorer],
                      ["Objectifs atteints", e.objectifs_atteints],
                      ["Mis en pratique", e.mise_en_pratique],
                      ["Autre", e.commentaire_libre],
                    ].filter(function (x: any) { return x[1]; }).map(function (x: any) {
                      return (
                        <div key={x[0]} style={{ marginBottom: "10px" }}>
                          <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 3px" }}>{x[0]}</p>
                          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
                            {x[1]}
                          </p>
                        </div>
                      );
                    })}

                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: "10px 0 0" }}>
                      {new Date(e.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
