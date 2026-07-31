"use client";
import { useState, useEffect } from "react";

export default function PageFacturation() {
  const [d, setD] = useState<any>(null);
  const [mois, setMois] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<any>({});

  useEffect(function () {
    charger("");
  }, []);

  async function charger(m: string) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/facturation" + (m ? "?mois=" + m : ""));
      const data = await r.json();
      if (data.ok) {
        setD(data);
        setMois(data.mois);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function decaler(pas: number) {
    if (!mois) return;
    const annee = parseInt(mois.slice(0, 4), 10);
    const m = parseInt(mois.slice(5, 7), 10);
    const d2 = new Date(Date.UTC(annee, m - 1 + pas, 1));
    charger(d2.getUTCFullYear() + "-" + String(d2.getUTCMonth() + 1).padStart(2, "0"));
  }

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR") + " EUR";
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

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "8px 18px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/organismes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux organismes
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CE QUE VOUS FACTUREZ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 16px" }}>Facturation</h1>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "22px", flexWrap: "wrap" }}>
          <button onClick={() => decaler(-1)} style={BOUTON}>← mois precedent</button>
          <span style={{ color: "#c8a96e", fontSize: "18px", fontWeight: "bold" }}>{mois}</span>
          <button onClick={() => decaler(1)} style={BOUTON}>mois suivant →</button>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Calcul en cours...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.total_abonnements)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Abonnements</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.total_prelevements)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Prelevements · {d.total_inscriptions} inscription(s)
                </p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0, border: "1px solid rgba(200,169,110,0.5)" }}>
                <p style={{ color: "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.total)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Total du mois</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: d.total_au_plancher > 0 ? "#e8a33d" : "rgba(255,255,255,0.4)", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.total_au_plancher}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Inscription(s) au plancher
                </p>
              </div>
            </div>

            {d.lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun client pour le moment.
                </p>
              </div>
            ) : (
              d.lignes.map(function (l: any) {
                const estOuvert = ouvert[l.id] === true;
                const beaucoupDePlancher = l.au_plancher > 0 && l.au_plancher >= l.au_taux;
                return (
                  <div key={l.id} style={{ ...CARTE, border: beaucoupDePlancher ? "1px solid rgba(232,163,61,0.5)" : CARTE.border, opacity: l.statut === "actif" ? 1 : 0.6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 3px" }}>
                          {l.raison_sociale}
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {euros(l.abonnement)} d abonnement
                          {l.en_lancement ? " (lancement, plein " + euros(l.abonnement_plein) + ")" : ""}
                          {" · " + l.taux + " % · plancher " + euros(l.plancher)}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "4px 0 0" }}>
                          {l.inscriptions} inscription(s) · {l.au_taux} au taux · {l.au_plancher} au plancher
                          {l.hors_catalogue > 0 ? " · " + l.hors_catalogue + " sur ses propres formations" : ""}
                        </p>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 2px" }}>
                          {euros(l.total)}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>
                          dont {euros(l.prelevement)} de prelevement
                        </p>
                      </div>
                    </div>

                    {beaucoupDePlancher && (
                      <p style={{ color: "#e8a33d", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
                        La majorite de ses inscriptions tombent au plancher : il inscrit beaucoup et
                        vend peu, ou vend a bas prix. C est la conversation a avoir avec lui.
                      </p>
                    )}

                    {l.inscriptions > 0 && (
                      <button
                        onClick={() => setOuvert({ ...ouvert, [l.id]: !estOuvert })}
                        style={{ ...BOUTON, marginTop: "14px" }}
                      >
                        {estOuvert ? "Fermer le detail" : "Detail des inscriptions"}
                      </button>
                    )}

                    {estOuvert && (
                      <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        {l.details.map(function (x: any, i: number) {
                          return (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", wordBreak: "break-all" }}>
                                {x.email}
                                {x.formation_code ? " · " + x.formation_code : ""}
                                <span style={{ color: "rgba(255,255,255,0.35)" }}> · {x.motif}</span>
                              </span>
                              <span style={{ color: x.du > 0 ? "#c8a96e" : "rgba(255,255,255,0.3)", fontSize: "13px", fontWeight: "bold" }}>
                                {x.prix !== null ? euros(x.prix) + " → " : ""}{euros(x.du)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
