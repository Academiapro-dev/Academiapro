"use client";
import { useState, useEffect } from "react";

export default function PageRapprochement() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    (async function () {
      try {
        const r = await fetch("/api/compliance/societes");
        const data = await r.json();
        if (data.ok) {
          setSocietes(data.societes || []);
          const p = new URLSearchParams(window.location.search).get("societe_id");
          if (p) setDossier(p);
          else if ((data.societes || []).length === 1) setDossier(data.societes[0].id);
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(function () {
    if (dossier) charger();
  }, [dossier]);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/rapprochement?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function agir(id: string, corps: any) {
    setOccupe(id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/rapprochement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ...corps }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        await charger();
      } else {
        setErreur(data.erreur || "Action impossible.");
      }
    } catch (e: any) {
      setErreur("Action impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = {
    minHeight: "100vh", background: "#050508", color: "#fff",
    fontFamily: "Georgia, serif", padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "20px 24px", marginBottom: "16px",
  };

  const CHAMP: any = {
    width: "100%", padding: "11px 13px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)",
    color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif",
    boxSizing: "border-box", marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px",
  };

  const BOUTON: any = {
    background: "none", border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e", padding: "8px 16px", borderRadius: "20px",
    cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif",
  };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/releve" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux releves
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Rapprochement bancaire</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Chaque ligne de releve en face de son ecriture
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Recherche des correspondances...</p></div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
              <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>{d.a_traiter}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>A traiter</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                <p style={{ color: "#4caf50", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>{d.certaines}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Correspondances sures</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                <p style={{ color: d.sans_candidat > 0 ? "#e8a33d" : "rgba(255,255,255,0.4)", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.sans_candidat}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Sans ecriture</p>
              </div>
            </div>

            {d.sans_candidat > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.45)" }}>
                <p style={{ color: "#e8a33d", fontSize: "14.5px", margin: 0, lineHeight: "1.8" }}>
                  {d.sans_candidat} ligne(s) n ont aucune ecriture correspondante : soit l ecriture
                  reste a saisir, soit le montant differe. Passez par la saisie, puis revenez ici.
                </p>
              </div>
            )}

            {d.propositions.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "#4caf50", margin: 0, fontSize: "15px", lineHeight: "1.75" }}>
                  Tout est rapproche. La banque tombe juste.
                </p>
              </div>
            ) : (
              d.propositions.map(function (p: any) {
                return (
                  <div key={p.id} style={{ ...CARTE, border: p.certaine ? "1px solid rgba(76,175,80,0.45)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", margin: "0 0 3px" }}>
                          Releve du {new Date(p.operation_date).toLocaleDateString("fr-FR")}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{p.libelle}</h3>
                      </div>
                      <span style={{ color: p.montant < 0 ? "#e8836a" : "#4caf50", fontSize: "17px", fontWeight: "bold" }}>
                        {euros(p.montant)}
                      </span>
                    </div>

                    {p.candidats.length === 0 ? (
                      <p style={{ color: "#e8a33d", fontSize: "13.5px", margin: "12px 0 0", lineHeight: "1.7" }}>
                        Aucune ecriture de ce montant dans les dix jours. Saisissez-la, ou ecartez
                        cette ligne si elle ne doit pas etre comptabilisee.
                      </p>
                    ) : (
                      <div style={{ marginTop: "12px" }}>
                        {p.candidats.map(function (c: any) {
                          return (
                            <div key={c.ecriture_num} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", marginBottom: "8px" }}>
                              <div style={{ flex: "1 1 240px" }}>
                                <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 2px" }}>
                                  {c.ecriture_num} · {new Date(c.date).toLocaleDateString("fr-FR")}
                                  {c.ecart_jours > 0 ? " · " + c.ecart_jours + " jour(s) d ecart" : " · meme jour"}
                                </p>
                                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: 0 }}>
                                  {c.libelle}
                                </p>
                              </div>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ color: c.note >= 80 ? "#4caf50" : "rgba(255,255,255,0.45)", fontSize: "12.5px" }}>
                                  {c.note} %
                                </span>
                                <button
                                  onClick={() => agir(p.id, { ecriture_num: c.ecriture_num })}
                                  disabled={occupe !== ""}
                                  style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                                >
                                  {occupe === p.id ? "..." : "Rapprocher"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => agir(p.id, { action: "ignorer" })}
                      disabled={occupe !== ""}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "13px", padding: "8px 0 0" }}
                    >
                      Ecarter cette ligne
                    </button>
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
