"use client";
import { useState, useEffect } from "react";

// Un exercice deja cloture n est pas une anomalie : c est un etat. Le dire en
// rouge apres une cloture reussie fait croire a une panne.
function parleDesANouveaux(texte: string): boolean {
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .indexOf("a-nouveaux") >= 0;
}

export default function PageCloture() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    (async function () {
      try {
        const r = await fetch("/api/compliance/societes");
        const data = await r.json();
        if (data.ok) {
          setSocietes(data.societes || []);
          if ((data.societes || []).length === 1) setDossier(data.societes[0].id);
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
    setConfirme(false);
    try {
      const r = await fetch("/api/compliance/cloture?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function cloturer() {
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/cloture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setConfirme(false);
        await charger();
      } else {
        setErreur(data.erreur || "Cloture impossible.");
      }
    } catch (e: any) {
      setErreur("Cloture impossible : " + String(e));
    }
    setOccupe(false);
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

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  const anomalies = d && d.anomalies ? d.anomalies : [];

  // Le report a-nouveaux existe et c est la SEULE reserve : l exercice est
  // simplement deja cloture. On le dit comme un fait, pas comme un echec.
  const dejaCloture = anomalies.length === 1 && parleDesANouveaux(anomalies[0]);

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Cloture de l exercice</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Solder les comptes de gestion et reporter les soldes de bilan
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

        {message && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "15.5px", margin: 0, lineHeight: "1.75" }}>{message}</p>
          </div>
        )}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Verification...</p></div>
        ) : !d ? null : (
          <>
            <div style={{ ...CARTE, border: "2px solid " + (d.resultat >= 0 ? "rgba(76,175,80,0.5)" : "rgba(232,131,106,0.5)") }}>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 6px" }}>
                {d.dossier.raison_sociale} · exercice du{" "}
                {new Date(d.exercice.debut).toLocaleDateString("fr-FR")} au{" "}
                {new Date(d.exercice.fin).toLocaleDateString("fr-FR")}
              </p>
              <p style={{ color: d.resultat >= 0 ? "#4caf50" : "#e8836a", fontSize: "30px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(d.resultat)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>
                {d.resultat >= 0 ? "Benefice de l exercice" : "Perte de l exercice"} ·{" "}
                {euros(d.produits)} de produits, {euros(d.charges)} de charges
              </p>
            </div>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>{d.nb_lignes}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Ligne(s) d ecriture</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>{d.comptes_gestion}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Comptes a solder</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>{d.comptes_bilan}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>A reporter</p>
              </div>
            </div>

            {dejaCloture ? (
              <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)" }}>
                <p style={{ color: "#4caf50", fontSize: "15.5px", fontWeight: "bold", margin: "0 0 10px" }}>
                  Exercice deja cloture
                </p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "0 0 6px", lineHeight: "1.8" }}>
                  Les comptes de gestion ont ete soldes et les soldes de bilan reportes a
                  l exercice suivant. Il n y a plus rien a cloturer ici.
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "10px 0 0", lineHeight: "1.7" }}>
                  Pour cloturer une seconde fois, il faudrait d abord supprimer le report
                  a-nouveaux — ce qui ne se fait pas a la legere.
                </p>
              </div>
            ) : anomalies.length > 0 ? (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.55)" }}>
                <p style={{ color: "#e8836a", fontSize: "15.5px", fontWeight: "bold", margin: "0 0 10px" }}>
                  La cloture n est pas possible en l etat
                </p>
                {anomalies.map(function (a: string, i: number) {
                  return (
                    <p key={i} style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "0 0 6px", lineHeight: "1.7" }}>
                      · {a}
                    </p>
                  );
                })}
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
                  Corrigez ces points, puis revenez : une cloture posee sur des comptes faux se
                  reporte sur tous les exercices suivants.
                </p>
              </div>
            ) : (
              <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)" }}>
                <p style={{ color: "#4caf50", fontSize: "15px", margin: "0 0 14px", lineHeight: "1.8" }}>
                  Tout est en ordre. La cloture soldera les {d.comptes_gestion} comptes de charges
                  et de produits par le resultat, puis reportera les {d.comptes_bilan} soldes de
                  bilan au premier jour de l exercice suivant.
                </p>

                {!confirme ? (
                  <button
                    onClick={() => setConfirme(true)}
                    style={{ background: "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                  >
                    Preparer la cloture
                  </button>
                ) : (
                  <div>
                    <p style={{ color: "#e8a33d", fontSize: "14.5px", margin: "0 0 12px", lineHeight: "1.8" }}>
                      Cette operation ecrit des ecritures definitives. Elle ne peut pas etre
                      annulee d un clic : il faudrait supprimer les ecritures a la main.
                      Confirmez-vous ?
                    </p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={cloturer}
                        disabled={occupe}
                        style={{ background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                      >
                        {occupe ? "Cloture en cours..." : "Oui, cloturer l exercice"}
                      </button>
                      <button
                        onClick={() => setConfirme(false)}
                        style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", padding: "14px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif" }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {d.bilan && d.bilan.length > 0 && (
              <>
                <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "24px 0 12px" }}>
                  {dejaCloture ? "Soldes reportes" : "Soldes qui seront reportes"}
                </h2>
                <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "0.9fr 2.4fr 1fr", background: "rgba(200,169,110,0.12)", padding: "12px 14px", fontSize: "12px", color: "#c8a96e", fontWeight: "bold" }}>
                    <span>Compte</span><span>Libelle</span>
                    <span style={{ textAlign: "right" }}>Solde</span>
                  </div>
                  {d.bilan.map(function (c: any) {
                    return (
                      <div key={c.numero} style={{ display: "grid", gridTemplateColumns: "0.9fr 2.4fr 1fr", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)" }}>
                        <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{c.numero}</span>
                        <span>{c.libelle}</span>
                        <span style={{ textAlign: "right", color: c.solde > 0 ? "#c8a96e" : "#e8a33d" }}>
                          {euros(c.solde)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
