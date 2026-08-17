"use client";
import { useState, useEffect } from "react";

// CE QUE VOUS FACTUREZ, MOIS PAR MOIS.
//
// 🚨 LA GRILLE DEFINITIVE, arretee le 17/08 :
//     390 EUR HT par mois (plateforme + suivi commercial)
//   + 40 % du prix de vente hors taxes de chaque formation
//   + 30 EUR HT PAR STAGIAIRE INSCRIT, QUI S'ADDITIONNENT a la part
//   = gestion administrative COMPRISE, bilan pedagogique annuel inclus.
//
// 🚨 CET ECRAN ETAIT RESTE SUR L'ANCIEN MODELE. Il affichait « plancher
// 0 EUR » alors que la redevance est de 30 EUR, « au taux · au plancher »
// sans les nombres, et une quatrieme carte vide — la route ne renvoie plus
// les champs qu'il lisait. Repris le 17/08 pour coller au calcul reel.
//
// LE MOT « PLANCHER » A DISPARU : ce n'est plus un minimum qui se substitue
// a la part quand elle est faible, c'est une REDEVANCE qui s'y ajoute
// toujours. Garder l'ancien mot entretiendrait la confusion que le bon de
// commande vient justement de lever.

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
            {/* QUATRE CARTES, ET LA PART EST SEPAREE DE LA REDEVANCE.
                Les voir cote a cote est ce qui permet de verifier d'un coup
                d'oeil que les deux se cumulent bien — le defaut repare
                aujourd'hui les faisait s'exclure. */}
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.total_abonnements)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Abonnements</p>
              </div>

              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.total_parts)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Part sur les ventes
                </p>
              </div>

              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.total_redevances)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Redevances · {d.total_inscriptions} inscription(s)
                </p>
              </div>

              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0, border: "1px solid rgba(200,169,110,0.5)" }}>
                <p style={{ color: "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.total)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Total du mois</p>
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
                return (
                  <div key={l.id} style={{ ...CARTE, opacity: l.statut === "actif" ? 1 : 0.6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 3px" }}>
                          {l.raison_sociale}
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {euros(l.abonnement)} d abonnement
                          {" · " + l.taux + " % sur les ventes"}
                          {" · " + euros(l.redevance_unitaire) + " par stagiaire"}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "4px 0 0" }}>
                          {l.inscriptions} inscription(s)
                          {l.facturees !== l.inscriptions
                            ? " · " + l.facturees + " facturee(s)"
                            : ""}
                          {l.hors_catalogue > 0
                            ? " · " + l.hors_catalogue + " sur ses propres formations"
                            : ""}
                        </p>
                        {l.facturees > 0 && (
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "4px 0 0" }}>
                            {euros(l.part_totale)} de part + {euros(l.redevance_totale)} de redevance
                          </p>
                        )}
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
                                {x.prix !== null && x.prix > 0 ? euros(x.prix) + " → " : ""}{euros(x.du)}
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
