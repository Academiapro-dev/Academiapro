"use client";
import { useState, useEffect } from "react";

const PORTES = [
  ["/admin/compliance/saisie", "Saisie"],
  ["/admin/compliance/comptes", "Plan comptable"],
  ["/admin/compliance/balance", "Balance"],
  ["/admin/compliance/lettrage", "Lettrage"],
  ["/admin/compliance/releve", "Releves"],
  ["/admin/compliance/rapprochement", "Rapprochement"],
  ["/admin/compliance/tva", "TVA"],
  ["/admin/compliance/immobilisations", "Immobilisations"],
  ["/admin/compliance/cloture", "Cloture"],
];

export default function PageSocietes() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [fiche, setFiche] = useState<any>({});

  const [neuf, setNeuf] = useState<any>({
    code: "", raison_sociale: "", siren: "", forme: "",
    regime_fiscal: "is", regime_tva: "reel_normal",
    exercice_debut: "", exercice_fin: "", expert_responsable: "",
  });

  useEffect(function () { charger(); }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/societes");
      const data = await r.json();
      if (!data.ok) { setErreur(data.erreur || "Lecture impossible."); setChargement(false); return; }
      setD(data);
      const f: any = {};
      for (const s of data.societes || []) {
        f[s.id] = {
          raison_sociale: s.raison_sociale || "", siren: s.siren || "", forme: s.forme || "",
          regime_fiscal: s.regime_fiscal || "a_determiner", regime_tva: s.regime_tva || "reel_normal",
          exercice_debut: s.exercice_debut || "", exercice_fin: s.exercice_fin || "",
          adresse: s.adresse || "", email_contact: s.email_contact || "",
          expert_responsable: s.expert_responsable || "", notes: s.notes || "",
        };
      }
      setFiche(f);
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function envoyer(corps: any, quoi: string) {
    setOccupe(quoi);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/societes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message || "Dossier enregistre.");
        if (!corps.id) {
          setNeuf({ code: "", raison_sociale: "", siren: "", forme: "", regime_fiscal: "is", regime_tva: "reel_normal", exercice_debut: "", exercice_fin: "", expert_responsable: "" });
          setFormulaire(false);
        }
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const LIEN: any = { color: "#c8a96e", fontSize: "12.5px", textDecoration: "none", border: "1px solid rgba(200,169,110,0.35)", padding: "6px 13px", borderRadius: "20px" };

  function ch(id: string, cle: string) { return (fiche[id] && fiche[id][cle]) || ""; }
  function poser(id: string, cle: string, v: string) {
    setFiche({ ...fiche, [id]: { ...(fiche[id] || {}), [cle]: v } });
  }
  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  const CHAMPS_FICHE = [
    ["raison_sociale", "Raison sociale"], ["siren", "SIREN"], ["forme", "Forme"],
    ["adresse", "Adresse"], ["email_contact", "Email de contact"],
    ["expert_responsable", "Expert responsable"],
  ];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/organismes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour a l administration
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Dossiers comptables</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Une societe, un dossier, des ecritures cloisonnees
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "22px 0" }}>
          {PORTES.map(function (p: any) {
            return <a key={p[0]} href={p[0]} style={{ ...LIEN, fontSize: "13.5px", padding: "10px 18px" }}>{p[1]} →</a>;
          })}
          <button
            onClick={() => setFormulaire(!formulaire)}
            style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "10px 20px", borderRadius: "20px", cursor: "pointer", fontSize: "13.5px", fontFamily: "Georgia,serif", fontWeight: "bold" }}
          >
            {formulaire ? "Annuler" : "Ouvrir un dossier"}
          </button>
        </div>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                <span style={LIBELLE}>Raison sociale</span>
                <input value={neuf.raison_sociale} onChange={(e) => setNeuf({ ...neuf, raison_sociale: e.target.value })} placeholder="Dupont Conseil SARL" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <span style={LIBELLE}>Code du dossier</span>
                <input value={neuf.code} onChange={(e) => setNeuf({ ...neuf, code: e.target.value })} placeholder="DUPONT" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>SIREN</span>
                <input value={neuf.siren} onChange={(e) => setNeuf({ ...neuf, siren: e.target.value })} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Forme</span>
                <input value={neuf.forme} onChange={(e) => setNeuf({ ...neuf, forme: e.target.value })} placeholder="SARL" style={CHAMP} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Regime fiscal</span>
                <select value={neuf.regime_fiscal} onChange={(e) => setNeuf({ ...neuf, regime_fiscal: e.target.value })} style={CHAMP}>
                  {Object.keys(d && d.regimes_fiscaux ? d.regimes_fiscaux : { is: "IS" }).map(function (k) {
                    return <option key={k} value={k}>{d.regimes_fiscaux[k]}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Regime de TVA</span>
                <select value={neuf.regime_tva} onChange={(e) => setNeuf({ ...neuf, regime_tva: e.target.value })} style={CHAMP}>
                  {Object.keys(d && d.regimes_tva ? d.regimes_tva : { reel_normal: "Reel normal" }).map(function (k) {
                    return <option key={k} value={k}>{d.regimes_tva[k]}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <span style={LIBELLE}>Ouverture</span>
                <input type="date" value={neuf.exercice_debut} onChange={(e) => setNeuf({ ...neuf, exercice_debut: e.target.value })} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <span style={LIBELLE}>Cloture</span>
                <input type="date" value={neuf.exercice_fin} onChange={(e) => setNeuf({ ...neuf, exercice_fin: e.target.value })} style={CHAMP} />
              </div>
            </div>

            <button
              onClick={() => envoyer(neuf, "creation")}
              disabled={occupe !== "" || neuf.raison_sociale.trim().length < 2}
              style={{ background: occupe !== "" || neuf.raison_sociale.trim().length < 2 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "creation" ? "Ouverture..." : "Ouvrir le dossier"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Ouverture des dossiers...</p></div>
        ) : !d ? null : (
          <>
            {d.ecritures_orphelines > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.55)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.ecritures_orphelines} ecriture(s) ne sont rattachees a aucun dossier : elles
                  n apparaitront dans aucun FEC ni aucune liasse.
                </p>
              </div>
            )}

            {d.societes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun dossier. Ouvrez-en un pour commencer.
                </p>
              </div>
            ) : (
              d.societes.map(function (s: any) {
                const estOuvert = ouvert[s.id] === true;
                const alerte = s.lignes > 0 && !s.equilibre;
                const q = "?societe_id=" + s.id;
                return (
                  <div key={s.id} style={{ ...CARTE, border: alerte ? "1px solid rgba(232,131,106,0.5)" : CARTE.border, opacity: s.actif ? 1 : 0.6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: "1 1 280px" }}>
                        <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                          {s.code}{s.siren ? " · SIREN " + s.siren : " · SIREN manquant"}
                          {s.forme ? " · " + s.forme : ""}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{s.raison_sociale}</h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {s.regime_fiscal_nom} · {s.regime_tva_nom}
                          {s.exercice_debut ? " · du " + new Date(s.exercice_debut).toLocaleDateString("fr-FR") : ""}
                          {s.exercice_fin ? " au " + new Date(s.exercice_fin).toLocaleDateString("fr-FR") : ""}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 2px" }}>{s.lignes}</p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>ecriture(s)</p>
                      </div>
                    </div>

                    {s.lignes > 0 && (
                      <p style={{ color: s.equilibre ? "#4caf50" : "#e8836a", fontSize: "13.5px", margin: "10px 0 0" }}>
                        {s.equilibre ? "Equilibre : " + euros(s.debit) : "DESEQUILIBRE : debit " + euros(s.debit) + " credit " + euros(s.credit)}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "7px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                      <button onClick={() => setOuvert({ ...ouvert, [s.id]: !estOuvert })} style={{ ...LIEN, background: "none", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                        {estOuvert ? "Fermer" : "Sa fiche"}
                      </button>
                      {PORTES.map(function (p: any) {
                        return <a key={p[0]} href={p[0] + q} style={LIEN}>{p[1]}</a>;
                      })}
                      <a href={"/api/compliance/fec?societe=" + s.code} style={LIEN}>FEC</a>
                      <a href={"/api/compliance/liasse/fiche?societe=" + s.code} style={LIEN}>Liasse</a>
                    </div>

                    {estOuvert && (
                      <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        {CHAMPS_FICHE.map(function (c: any) {
                          return (
                            <div key={c[0]}>
                              <span style={LIBELLE}>{c[1]}</span>
                              <input value={ch(s.id, c[0])} onChange={(e) => poser(s.id, c[0], e.target.value)} style={CHAMP} />
                            </div>
                          );
                        })}

                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <div style={{ flex: "1 1 200px" }}>
                            <span style={LIBELLE}>Regime fiscal</span>
                            <select value={ch(s.id, "regime_fiscal")} onChange={(e) => poser(s.id, "regime_fiscal", e.target.value)} style={CHAMP}>
                              {Object.keys(d.regimes_fiscaux).map(function (k) {
                                return <option key={k} value={k}>{d.regimes_fiscaux[k]}</option>;
                              })}
                            </select>
                          </div>
                          <div style={{ flex: "1 1 200px" }}>
                            <span style={LIBELLE}>Regime de TVA</span>
                            <select value={ch(s.id, "regime_tva")} onChange={(e) => poser(s.id, "regime_tva", e.target.value)} style={CHAMP}>
                              {Object.keys(d.regimes_tva).map(function (k) {
                                return <option key={k} value={k}>{d.regimes_tva[k]}</option>;
                              })}
                            </select>
                          </div>
                          <div style={{ flex: "1 1 150px" }}>
                            <span style={LIBELLE}>Ouverture</span>
                            <input type="date" value={ch(s.id, "exercice_debut")} onChange={(e) => poser(s.id, "exercice_debut", e.target.value)} style={CHAMP} />
                          </div>
                          <div style={{ flex: "1 1 150px" }}>
                            <span style={LIBELLE}>Cloture</span>
                            <input type="date" value={ch(s.id, "exercice_fin")} onChange={(e) => poser(s.id, "exercice_fin", e.target.value)} style={CHAMP} />
                          </div>
                        </div>

                        <span style={LIBELLE}>Notes du dossier</span>
                        <textarea value={ch(s.id, "notes")} onChange={(e) => poser(s.id, "notes", e.target.value)} rows={3} style={CHAMP} />

                        <button
                          onClick={() => envoyer({ id: s.id, ...(fiche[s.id] || {}) }, "maj-" + s.id)}
                          disabled={occupe !== ""}
                          style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                        >
                          {occupe === "maj-" + s.id ? "Enregistrement..." : "Enregistrer le dossier"}
                        </button>
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
