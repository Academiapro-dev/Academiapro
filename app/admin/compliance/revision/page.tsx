"use client";
import { useState, useEffect } from "react";

const VERDICTS: any = {
  sain: { texte: "Dossier sain", couleur: "#4caf50" },
  a_surveiller: { texte: "Quelques points à surveiller", couleur: "#c8a96e" },
  a_corriger: { texte: "Des corrections sont nécessaires", couleur: "#e8a33d" },
  bloquant: { texte: "Anomalies bloquantes", couleur: "#e8836a" },
};

const GRAVITES: any = {
  grave: { texte: "Bloquant", couleur: "#e8836a" },
  moyen: { texte: "À corriger", couleur: "#e8a33d" },
  faible: { texte: "À surveiller", couleur: "#c8a96e" },
};

// ══════════════════════════════════════════════════════════════════════════
// LE DOSSIER DE REVISION — 09/09.
//
// EN HAUT, CE QUI EXISTAIT : les controles automatiques
// (/api/compliance/revision, inchange). EN DESSOUS, CE QUI MANQUAIT : les
// diligences par cycle avec leur statut, et les points en suspens
// (/api/compliance/revision/dossier). C est ce qu un expert lit avant de
// signer : ce qui est verifie, ce qui reste, et pourquoi.
//
// Une diligence ne se supprime pas : elle se marque « sans objet ». Un
// point en suspens se regle, il ne disparait pas.
// ══════════════════════════════════════════════════════════════════════════
const LIBELLE_STATUT: any = {
  a_faire: { texte: "À faire", couleur: "rgba(255,255,255,0.45)" },
  en_cours: { texte: "En cours", couleur: "#e8a33d" },
  fait: { texte: "Fait", couleur: "#4caf50" },
  sans_objet: { texte: "Sans objet", couleur: "rgba(255,255,255,0.3)" },
};

export default function PageRevision() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  // Le dossier de revision (diligences et points).
  const [dr, setDr] = useState<any>(null);
  const [cycleOuvert, setCycleOuvert] = useState("");
  const [occupe, setOccupe] = useState("");
  const [messageDr, setMessageDr] = useState("");
  const [ligneOuverte, setLigneOuverte] = useState("");
  const [brouillon, setBrouillon] = useState<any>({});
  const [nvPointLibelle, setNvPointLibelle] = useState("");
  const [nvPointCompte, setNvPointCompte] = useState("");
  const [nvPointMontant, setNvPointMontant] = useState("");
  const [nvDiligence, setNvDiligence] = useState("");

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
      const r = await fetch("/api/compliance/revision?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    await chargerDossierRevision();
    setChargement(false);
  }

  async function chargerDossierRevision() {
    try {
      const r = await fetch("/api/compliance/revision/dossier?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setDr(data);
      else setDr(null);
    } catch (e) {
      setDr(null);
    }
  }

  async function modifierDiligence(id: string, champs: any) {
    setOccupe(id);
    setMessageDr("");
    try {
      const r = await fetch("/api/compliance/revision/dossier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, id: id, ...champs }),
      });
      const data = await r.json();
      if (data.ok) {
        await chargerDossierRevision();
        setLigneOuverte("");
        setBrouillon({});
      } else setMessageDr("Erreur : " + (data.erreur || "inconnue"));
    } catch (e: any) {
      setMessageDr("Erreur : " + String(e));
    }
    setOccupe("");
  }

  async function ajouterDiligence(cycle: string) {
    if (!nvDiligence.trim()) return;
    setOccupe("nv-" + cycle);
    setMessageDr("");
    try {
      const r = await fetch("/api/compliance/revision/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, cycle: cycle, diligence: nvDiligence }),
      });
      const data = await r.json();
      if (data.ok) { setNvDiligence(""); await chargerDossierRevision(); }
      else setMessageDr("Erreur : " + (data.erreur || "inconnue"));
    } catch (e: any) {
      setMessageDr("Erreur : " + String(e));
    }
    setOccupe("");
  }

  async function ajouterPoint() {
    if (!nvPointLibelle.trim()) return;
    setOccupe("nv-point");
    setMessageDr("");
    try {
      const r = await fetch("/api/compliance/revision/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, type: "point", libelle: nvPointLibelle, compte_num: nvPointCompte, montant: nvPointMontant }),
      });
      const data = await r.json();
      if (data.ok) { setNvPointLibelle(""); setNvPointCompte(""); setNvPointMontant(""); await chargerDossierRevision(); }
      else setMessageDr("Erreur : " + (data.erreur || "inconnue"));
    } catch (e: any) {
      setMessageDr("Erreur : " + String(e));
    }
    setOccupe("");
  }

  async function reglerPoint(id: string, statut: string) {
    setOccupe(id);
    setMessageDr("");
    try {
      const r = await fetch("/api/compliance/revision/dossier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, id: id, type: "point", statut: statut }),
      });
      const data = await r.json();
      if (data.ok) await chargerDossierRevision();
      else setMessageDr("Erreur : " + (data.erreur || "inconnue"));
    } catch (e: any) {
      setMessageDr("Erreur : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const PETIT: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  const v = d ? (VERDICTS[d.verdict] || VERDICTS.a_surveiller) : null;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Dossier de révision</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Les contrôles de cohérence, les diligences par cycle et les points en suspens, avant de clôturer ou de déclarer
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={CHAMP}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Contrôles en cours…</p></div>
        ) : !d ? null : (
          <>
            <div style={{ ...CARTE, border: "2px solid " + v.couleur }}>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 6px" }}>
                {d.dossier.raison_sociale} · exercice du{" "}
                {new Date(d.exercice.debut).toLocaleDateString("fr-FR")} au{" "}
                {new Date(d.exercice.fin).toLocaleDateString("fr-FR")}
              </p>
              <p style={{ color: v.couleur, fontSize: "24px", fontWeight: "bold", margin: "0 0 6px" }}>
                {v.texte}
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                {d.nb_lignes} écriture(s) sur {d.nb_comptes} compte(s) ·{" "}
                {d.equilibre ? "balance équilibrée à " + euros(d.debit) : "BALANCE DÉSÉQUILIBRÉE"}
                <br />
                {d.total === 0
                  ? "Aucune anomalie relevée."
                  : d.graves + " bloquante(s), " + d.moyennes + " à corriger, " + d.faibles + " à surveiller."}
                {dr && (
                  <>
                    <br />
                    Diligences : {dr.avancement.faites} sur {dr.avancement.total} ({dr.avancement.pourcent} %) ·{" "}
                    <span style={{ color: dr.reste_a_faire > 0 ? "#e8a33d" : "#4caf50" }}>
                      {dr.reste_a_faire > 0 ? dr.reste_a_faire + " à faire" : "tout est fait"}
                    </span>
                    {" · "}
                    <span style={{ color: dr.points_ouverts > 0 ? "#e8836a" : "#4caf50" }}>
                      {dr.points_ouverts > 0 ? dr.points_ouverts + " point(s) en suspens, " + euros(dr.montant_ouvert) : "aucun point en suspens"}
                    </span>
                  </>
                )}
              </p>
            </div>

            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 12px" }}>Les contrôles automatiques</h2>

            {d.anomalies.length === 0 ? (
              <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)" }}>
                <p style={{ color: "#4caf50", fontSize: "15px", margin: 0, lineHeight: "1.8" }}>
                  Les onze contrôles passent. Le dossier peut être clôturé ou déclaré en l'état.
                </p>
              </div>
            ) : (
              d.anomalies.map(function (a: any, i: number) {
                const g = GRAVITES[a.gravite] || GRAVITES.faible;
                return (
                  <div key={i} style={{ ...CARTE, borderLeft: "4px solid " + g.couleur }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <h3 style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{a.titre}</h3>
                      <span style={{ color: g.couleur, fontSize: "12.5px", fontWeight: "bold" }}>
                        {g.texte}
                      </span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "8px 0 0", lineHeight: "1.75" }}>
                      {a.detail}
                    </p>
                    <p style={{ color: "#c8a96e", fontSize: "13.5px", margin: "8px 0 0", lineHeight: "1.75" }}>
                      {a.geste}
                    </p>
                  </div>
                );
              })
            )}

            {/* ══════════ LES DILIGENCES PAR CYCLE — 09/09 ══════════ */}
            {dr && (
              <>
                <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "30px 0 12px" }}>
                  Les diligences, par cycle
                </h2>
                {messageDr && <p style={{ color: "#e8836a", fontSize: "14px" }}>{messageDr}</p>}

                {dr.cycles.map(function (c: any) {
                  const ouvert = cycleOuvert === c.code;
                  const complet = c.faites === c.total;
                  return (
                    <div key={c.code} style={{ ...CARTE, padding: "14px 20px", borderLeft: "4px solid " + (complet ? "#4caf50" : c.faites > 0 ? "#e8a33d" : "rgba(255,255,255,0.15)") }}>
                      <div
                        onClick={() => setCycleOuvert(ouvert ? "" : c.code)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: "10px" }}
                      >
                        <h3 style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{c.nom}</h3>
                        <span style={{ color: complet ? "#4caf50" : "#c8a96e", fontSize: "14px", whiteSpace: "nowrap" }}>
                          {c.faites} / {c.total} {ouvert ? "▴" : "▾"}
                        </span>
                      </div>

                      {ouvert && (
                        <div style={{ marginTop: "12px" }}>
                          {c.diligences.map(function (dg: any) {
                            const st = LIBELLE_STATUT[dg.statut] || LIBELLE_STATUT.a_faire;
                            const enEdition = ligneOuverte === dg.id;
                            return (
                              <div key={dg.id} style={{ padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                                  <span style={{ color: dg.statut === "sans_objet" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)", fontSize: "14.5px", textDecoration: dg.statut === "sans_objet" ? "line-through" : "none", flex: "1 1 320px" }}>
                                    {dg.diligence}
                                    {dg.responsable ? <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px" }}> · {dg.responsable}</span> : null}
                                  </span>
                                  <span style={{ color: st.couleur, fontSize: "12.5px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                                    {st.texte}{dg.fait_le ? " · " + new Date(dg.fait_le).toLocaleDateString("fr-FR") : ""}
                                  </span>
                                </div>
                                {dg.commentaire && !enEdition && (
                                  <p style={{ color: "#c8a96e", fontSize: "13px", margin: "6px 0 0", lineHeight: "1.6" }}>{dg.commentaire}</p>
                                )}
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                                  {dg.statut !== "fait" && (
                                    <button onClick={() => modifierDiligence(dg.id, { statut: "fait" })} disabled={occupe !== ""} style={{ ...PETIT, borderColor: "rgba(76,175,80,0.45)", color: "#4caf50" }}>Fait</button>
                                  )}
                                  {dg.statut === "a_faire" && (
                                    <button onClick={() => modifierDiligence(dg.id, { statut: "en_cours" })} disabled={occupe !== ""} style={PETIT}>En cours</button>
                                  )}
                                  {dg.statut !== "sans_objet" && dg.statut !== "fait" && (
                                    <button onClick={() => modifierDiligence(dg.id, { statut: "sans_objet" })} disabled={occupe !== ""} style={{ ...PETIT, color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.2)" }}>Sans objet</button>
                                  )}
                                  {(dg.statut === "fait" || dg.statut === "sans_objet") && (
                                    <button onClick={() => modifierDiligence(dg.id, { statut: "a_faire" })} disabled={occupe !== ""} style={PETIT}>Rouvrir</button>
                                  )}
                                  <button onClick={() => { setLigneOuverte(enEdition ? "" : dg.id); setBrouillon({ commentaire: dg.commentaire || "", responsable: dg.responsable || "" }); }} style={PETIT}>
                                    {enEdition ? "Fermer" : "Note / responsable"}
                                  </button>
                                </div>
                                {enEdition && (
                                  <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    <input value={brouillon.responsable} onChange={(e) => setBrouillon({ ...brouillon, responsable: e.target.value })} placeholder="Responsable" style={{ ...CHAMP, flex: "1 1 160px", width: "auto" }} />
                                    <input value={brouillon.commentaire} onChange={(e) => setBrouillon({ ...brouillon, commentaire: e.target.value })} placeholder="Ce qui a été vérifié, l'écart expliqué…" style={{ ...CHAMP, flex: "3 1 300px", width: "auto" }} />
                                    <button onClick={() => modifierDiligence(dg.id, { commentaire: brouillon.commentaire, responsable: brouillon.responsable })} disabled={occupe !== ""} style={{ ...PETIT, background: "#c8a96e", color: "#050508", borderRadius: "8px" }}>Enregistrer</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                            <input value={nvDiligence} onChange={(e) => setNvDiligence(e.target.value)} placeholder="Ajouter une diligence propre à ce dossier" style={{ ...CHAMP, flex: "1 1 300px", width: "auto" }} />
                            <button onClick={() => ajouterDiligence(c.code)} disabled={occupe !== "" || !nvDiligence.trim()} style={PETIT}>Ajouter</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ══════════ LES POINTS EN SUSPENS — 09/09 ══════════ */}
                <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "30px 0 6px" }}>
                  Les points en suspens
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 12px", lineHeight: "1.6" }}>
                  Ce qui reste à expliquer ou à obtenir avant de signer. Un point se règle, il ne s&apos;efface pas.
                </p>

                <div style={CARTE}>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <input value={nvPointCompte} onChange={(e) => setNvPointCompte(e.target.value)} placeholder="Compte" style={{ ...CHAMP, flex: "0 1 120px", width: "auto" }} />
                    <input value={nvPointLibelle} onChange={(e) => setNvPointLibelle(e.target.value)} placeholder="Ce qui manque ou ne colle pas (ex. facture Orange sans pièce)" style={{ ...CHAMP, flex: "3 1 300px", width: "auto" }} />
                    <input value={nvPointMontant} onChange={(e) => setNvPointMontant(e.target.value)} placeholder="Montant" style={{ ...CHAMP, flex: "0 1 120px", width: "auto" }} />
                    <button onClick={ajouterPoint} disabled={occupe !== "" || !nvPointLibelle.trim()} style={{ ...PETIT, background: "#c8a96e", color: "#050508", borderRadius: "8px" }}>
                      {occupe === "nv-point" ? "…" : "Noter"}
                    </button>
                  </div>
                </div>

                {dr.points.length === 0 ? (
                  <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.35)" }}>
                    <p style={{ color: "#4caf50", fontSize: "15px", margin: 0 }}>Aucun point en suspens.</p>
                  </div>
                ) : (
                  dr.points.map(function (p: any) {
                    const regle = p.statut === "regle";
                    return (
                      <div key={p.id} style={{ ...CARTE, padding: "14px 20px", opacity: regle ? 0.6 : 1, borderLeft: "4px solid " + (regle ? "#4caf50" : "#e8836a") }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "14.5px", flex: "1 1 300px" }}>
                            {p.compte_num ? <span style={{ color: "#c8a96e" }}>{p.compte_num} · </span> : null}
                            {p.libelle}
                            {p.commentaire ? <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px" }}> — {p.commentaire}</span> : null}
                          </span>
                          <span style={{ color: regle ? "#4caf50" : "#e8836a", fontSize: "14px", whiteSpace: "nowrap" }}>
                            {p.montant !== null && p.montant !== undefined ? euros(p.montant) : ""}
                            {regle ? " · réglé" + (p.regle_le ? " le " + new Date(p.regle_le).toLocaleDateString("fr-FR") : "") : " · ouvert"}
                          </span>
                        </div>
                        <div style={{ marginTop: "8px" }}>
                          {regle ? (
                            <button onClick={() => reglerPoint(p.id, "ouvert")} disabled={occupe !== ""} style={PETIT}>Rouvrir</button>
                          ) : (
                            <button onClick={() => reglerPoint(p.id, "regle")} disabled={occupe !== ""} style={{ ...PETIT, borderColor: "rgba(76,175,80,0.45)", color: "#4caf50" }}>Réglé</button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
                Ces contrôles ne remplacent pas le jugement de l'expert-comptable : ils repèrent
                ce qui se vérifie mécaniquement. La qualification d'une charge, l'appréciation
                d'une provision ou le rattachement d'un produit restent son affaire.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
