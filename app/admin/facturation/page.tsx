"use client";
import { useState, useEffect } from "react";

export default function PageFacturation() {
  const [donnees, setDonnees] = useState<any>(null);
  const [mois, setMois] = useState("");
  const [ouvert, setOuvert] = useState<any>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

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
        setDonnees(data);
        setMois(data.mois);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function moisPrecedent() {
    if (!mois) return;
    const a = parseInt(mois.slice(0, 4), 10);
    const m = parseInt(mois.slice(5, 7), 10);
    const d = new Date(Date.UTC(a, m - 2, 1));
    charger(d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"));
  }

  function moisSuivant() {
    if (!mois) return;
    const a = parseInt(mois.slice(0, 4), 10);
    const m = parseInt(mois.slice(5, 7), 10);
    const d = new Date(Date.UTC(a, m, 1));
    charger(d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"));
  }

  function euros(n: number) {
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
    padding: "22px 26px",
    marginBottom: "18px",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "9px 20px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Georgia,serif",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/organismes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux organismes
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CE QUE VOS CLIENTS VOUS DOIVENT
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 18px" }}>Facturation</h1>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "26px", flexWrap: "wrap" }}>
          <button onClick={moisPrecedent} style={BOUTON}>← Mois precedent</button>
          <span style={{ color: "#c8a96e", fontSize: "17px", fontWeight: "bold" }}>{mois}</span>
          <button onClick={moisSuivant} style={BOUTON}>Mois suivant →</button>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Calcul en cours...</p>
          </div>
        ) : !donnees ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "26px" }}>
              <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(donnees.total)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Total du mois</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0 }}>
                <p style={{ color: "#fff", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(donnees.total_abonnements)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Abonnements</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0 }}>
                <p style={{ color: "#fff", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(donnees.total_prelevements)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Prelevements · {donnees.total_inscriptions} inscription(s)
                </p>
              </div>
            </div>

            {donnees.lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun organisme client pour le moment.
                </p>
              </div>
            ) : (
              donnees.lignes.map(function (l: any) {
                const estOuvert = ouvert[l.id] === true;
                return (
                  <div key={l.id} style={CARTE}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: "1 1 280px" }}>
                        <h3 style={{ color: "#fff", fontSize: "18px", margin: "0 0 4px" }}>{l.raison_sociale}</h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {l.email_contact}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "6px 0 0" }}>
                          Abonnement {euros(l.abonnement)}
                          {l.en_lancement ? " (lancement, plein tarif " + euros(l.abonnement_plein) + ")" : ""}
                          {" · prelevement " + l.taux + " % sur " + euros(l.assiette)}
                        </p>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 2px" }}>
                          {euros(l.total)}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {l.inscriptions} inscription(s)
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                      <span style={{ background: l.statut === "actif" ? "rgba(76,175,80,0.18)" : "rgba(232,131,106,0.18)", color: l.statut === "actif" ? "#4caf50" : "#e8836a", padding: "5px 14px", borderRadius: "20px", fontSize: "13px" }}>
                        {l.statut}
                      </span>

                      {l.en_lancement && (
                        <span style={{ background: "rgba(200,169,110,0.18)", color: "#c8a96e", padding: "5px 14px", borderRadius: "20px", fontSize: "13px" }}>
                          lancement jusqu au {new Date(l.lancement_jusqu_au).toLocaleDateString("fr-FR")}
                        </span>
                      )}

                      {l.sans_prix > 0 && (
                        <span style={{ background: "rgba(232,131,106,0.18)", color: "#e8836a", padding: "5px 14px", borderRadius: "20px", fontSize: "13px" }}>
                          {l.sans_prix} inscription(s) sans prix
                        </span>
                      )}

                      {l.inscriptions > 0 && (
                        <button
                          onClick={() => setOuvert({ ...ouvert, [l.id]: !estOuvert })}
                          style={BOUTON}
                        >
                          {estOuvert ? "Masquer le detail" : "Voir le detail"}
                        </button>
                      )}
                    </div>

                    {estOuvert && (
                      <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                        {l.details.map(function (d: any, i: number) {
                          return (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "14px", flexWrap: "wrap", gap: "8px" }}>
                              <span style={{ color: "rgba(255,255,255,0.75)", wordBreak: "break-all" }}>
                                {d.email}
                              </span>
                              <span style={{ color: "rgba(255,255,255,0.5)" }}>
                                {d.formation_code || "—"}
                                {d.payeur ? " · " + d.payeur : ""}
                              </span>
                              <span style={{ color: d.prix ? "#c8a96e" : "#e8836a", fontWeight: "bold" }}>
                                {d.prix ? euros(d.prix) : "prix manquant"}
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
