"use client";
import { useState, useEffect } from "react";

export default function PageSocietes() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [fiche, setFiche] = useState<any>({});

  const [code, setCode] = useState("");
  const [raison, setRaison] = useState("");
  const [siren, setSiren] = useState("");
  const [forme, setForme] = useState("");
  const [regimeFiscal, setRegimeFiscal] = useState("is");
  const [regimeTva, setRegimeTva] = useState("reel_normal");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [expert, setExpert] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/societes");
      const data = await r.json();
      if (data.ok) {
        setD(data);
        const f: any = {};
        for (const s of data.societes || []) {
          f[s.id] = {
            raison_sociale: s.raison_sociale || "",
            siren: s.siren || "",
            forme: s.forme || "",
            regime_fiscal: s.regime_fiscal || "a_determiner",
            regime_tva: s.regime_tva || "reel_normal",
            exercice_debut: s.exercice_debut || "",
            exercice_fin: s.exercice_fin || "",
            adresse: s.adresse || "",
            email_contact: s.email_contact || "",
            expert_responsable: s.expert_responsable || "",
            notes: s.notes || "",
          };
        }
        setFiche(f);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function creer() {
    if (raison.trim().length < 2) {
      setErreur("Indiquez la raison sociale.");
      return;
    }
    setOccupe("creation");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/societes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          raison_sociale: raison,
          siren: siren,
          forme: forme,
          regime_fiscal: regimeFiscal,
          regime_tva: regimeTva,
          exercice_debut: debut || null,
          exercice_fin: fin || null,
          expert_responsable: expert,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setCode(""); setRaison(""); setSiren(""); setForme(""); setExpert("");
        setDebut(""); setFin("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Ouverture impossible.");
      }
    } catch (e: any) {
      setErreur("Ouverture impossible : " + String(e));
    }
    setOccupe("");
  }

  async function modifier(id: string) {
    setOccupe("maj-" + id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/societes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ...(fiche[id] || {}) }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Dossier enregistre.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
    setOccupe("");
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

  const CHAMP: any = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "5px",
  };

  const LIEN: any = {
    color: "#c8a96e",
    fontSize: "13px",
    textDecoration: "none",
    border: "1px solid rgba(200,169,110,0.35)",
    padding: "7px 15px",
    borderRadius: "20px",
  };

  function champ(id: string, cle: string) {
    return (fiche[id] && fiche[id][cle]) || "";
  }

  function poser(id: string, cle: string, v: string) {
    setFiche({ ...fiche, [id]: { ...(fiche[id] || {}), [cle]: v } });
  }

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  const PORTES = [
    ["/admin/compliance/comptes", "Plan comptable"],
    ["/admin/compliance/saisie", "Saisie des ecritures"],
    ["/admin/compliance/tva", "Declaration de TVA"],
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

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "22px 0" }}>
          {PORTES.map(function (p: any) {
            return (
              <a key={p[0]} href={p[0]} style={{ ...LIEN, fontSize: "14px", padding: "11px 20px" }}>
                {p[1]} →
              </a>
            );
          })}
          <button
            onClick={() => setFormulaire(!formulaire)}
            style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "11px 22px", borderRadius: "20px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif", fontWeight: "bold" }}
          >
            {formulaire ? "Annuler" : "Ouvrir un dossier"}
          </button>
        </div>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                <span style={LIBELLE}>Raison sociale</span>
                <input value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="Dupont Conseil SARL" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <span style={LIBELLE}>Code du dossier</span>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="DUPONT" style={CHAMP} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 150px" }}>
                <span style={LIBELLE}>SIREN</span>
                <input value={siren} onChange={(e) => setSiren(e.target.value)} placeholder="123456789" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <span style={LIBELLE}>Forme juridique</span>
                <input value={forme} onChange={(e) => setForme(e.target.value)} placeholder="SARL, SAS, EI..." style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Expert responsable</span>
                <input value={expert} onChange={(e) => setExpert(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <span style={LIBELLE}>Regime fiscal</span>
                <select value={regimeFiscal} onChange={(e) => setRegimeFiscal(e.target.value)} style={CHAMP}>
                  {Object.keys(d && d.regimes_fiscaux ? d.regimes_fiscaux : { is: "IS" }).map(function (k) {
                    return <option key={k} value={k}>{d.regimes_fiscaux[k]}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "1 1 220px" }}>
                <span style={LIBELLE}>Regime de TVA</span>
                <select value={regimeTva} onChange={(e) => setRegimeTva(e.target.value)} style={CHAMP}>
                  {Object.keys(d && d.regimes_tva ? d.regimes_tva : { reel_normal: "Reel normal" }).map(function (k) {
                    return <option key={k} value={k}>{d.regimes_tva[k]}</option>;
                  })}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Ouverture de l exercice</span>
                <input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Cloture de l exercice</span>
                <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <button
              onClick={creer}
              disabled={occupe !== ""}
              style={{ background: occupe !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" ? "#8a8a8a" : "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "creation" ? "Ouverture..." : "Ouvrir le dossier"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              Le code se retrouve dans les numeros d ecriture et le nom du fichier FEC :
              choisissez-le court et definitif. Laisse vide, il sera fabrique depuis la raison
              sociale.
            </p>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Ouverture des dossiers...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{d.total}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Dossier(s)</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#4caf50", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{d.actifs}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Actif(s)</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0, border: d.desequilibres > 0 ? "1px solid rgba(232,131,106,0.5)" : CARTE.border }}>
                <p style={{ color: d.desequilibres > 0 ? "#e8836a" : "rgba(255,255,255,0.4)", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.desequilibres}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Desequilibre(s)</p>
              </div>
            </div>

            {d.ecritures_orphelines > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.55)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.ecritures_orphelines} ecriture(s) ne sont rattachees a aucun dossier. Elles
                  n apparaitront dans aucun FEC ni aucune liasse : il faut les rattacher.
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
                return (
                  <div key={s.id} style={{ ...CARTE, border: alerte ? "1px solid rgba(232,131,106,0.5)" : CARTE.border, opacity: s.actif ? 1 : 0.6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: "1 1 280px" }}>
                        <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                          {s.code}
                          {s.siren ? " · SIREN " + s.siren : " · SIREN manquant"}
                          {s.forme ? " · " + s.forme : ""}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{s.raison_sociale}</h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {s.regime_fiscal_nom} · {s.regime_tva_nom}
                          {s.exercice_debut ? " · exercice du " + new Date(s.exercice_debut).toLocaleDateString("fr-FR") : ""}
                          {s.exercice_fin ? " au " + new Date(s.exercice_fin).toLocaleDateString("fr-FR") : ""}
                        </p>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 2px" }}>
                          {s.lignes}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>
                          ecriture(s)
                        </p>
                      </div>
                    </div>

                    {s.lignes > 0 && (
                      <p style={{ color: s.equilibre ? "#4caf50" : "#e8836a", fontSize: "13.5px", margin: "10px 0 0", lineHeight: "1.7" }}>
                        {s.equilibre
                          ? "Equilibre : debit = credit = " + euros(s.debit)
                          : "DESEQUILIBRE : debit " + euros(s.debit) + " contre credit " + euros(s.credit)}
                        {s.derniere_ecriture
                          ? " · derniere ecriture le " + new Date(s.derniere_ecriture).toLocaleDateString("fr-FR")
                          : ""}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setOuvert({ ...ouvert, [s.id]: !estOuvert })}
                        style={{ ...LIEN, background: "none", cursor: "pointer", fontFamily: "Georgia,serif" }}
                      >
                        {estOuvert ? "Fermer la fiche" : "Sa fiche"}
                      </button>
                      <a href={"/admin/compliance/saisie?societe_id=" + s.id} style={LIEN}>Saisir →</a>
                      <a href={"/admin/compliance/comptes?societe_id=" + s.id} style={LIEN}>Son plan →</a>
                      <a href={"/admin/compliance/tva?societe_id=" + s.id} style={LIEN}>Sa TVA →</a>
                      <a href={"/api/compliance/fec?societe=" + s.code} style={LIEN}>Son FEC →</a>
                      <a href={"/api/compliance/liasse/fiche?societe=" + s.code} style={LIEN}>Sa liasse →</a>
                    </div>

                    {estOuvert && (
                      <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <div style={{ flex: "1 1 240px" }}>
                            <span style={LIBELLE}>Raison sociale</span>
                            <input value={champ(s.id, "raison_sociale")} onChange={(e) => poser(s.id, "raison_sociale", e.target.value)} style={CHAMP} />
                          </div>
                          <div style={{ flex: "1 1 150px" }}>
                            <span style={LIBELLE}>SIREN</span>
                            <input value={champ(s.id, "siren")} onChange={(e) => poser(s.id, "siren", e.target.value)} style={CHAMP} />
                          </div>
                          <div style={{ flex: "1 1 150px" }}>
                            <span style={LIBELLE}>Forme</span>
                            <input value={champ(s.id, "forme")} onChange={(e) => poser(s.id, "forme", e.target.value)} style={CHAMP} />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <div style={{ flex: "1 1 220px" }}>
                            <span style={LIBELLE}>Regime fiscal</span>
                            <select value={champ(s.id, "regime_fiscal")} onChange={(e) => poser(s.id, "regime_fiscal", e.target.value)} style={CHAMP}>
                              {Object.keys(d.regimes_fiscaux).map(function (k) {
                                return <option key={k} value={k}>{d.regimes_fiscaux[k]}</option>;
                              })}
                            </select>
                          </div>
                          <div style={{ flex: "1 1 220px" }}>
                            <span style={LIBELLE}>Regime de TVA</span>
                            <select value={champ(s.id, "regime_tva")} onChange={(e) => poser(s.id, "regime_tva", e.target.value)} style={CHAMP}>
                              {Object.keys(d.regimes_tva).map(function (k) {
                                return <option key={k} value={k}>{d.regimes_tva[k]}</option>;
                              })}
                            </select>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <div style={{ flex: "1 1 180px" }}>
                            <span style={LIBELLE}>Ouverture</span>
                            <input type="date" value={champ(s.id, "exercice_debut")} onChange={(e) => poser(s.id, "exercice_debut", e.target.value)} style={CHAMP} />
                          </div>
                          <div style={{ flex: "1 1 180px" }}>
                            <span style={LIBELLE}>Cloture</span>
                            <input type="date" value={champ(s.id, "exercice_fin")} onChange={(e) => poser(s.id, "exercice_fin", e.target.value)} style={CHAMP} />
                          </div>
                          <div style={{ flex: "1 1 200px" }}>
                            <span style={LIBELLE}>Expert responsable</span>
                            <input value={champ(s.id, "expert_responsable")} onChange={(e) => poser(s.id, "expert_responsable", e.target.value)} style={CHAMP} />
                          </div>
                        </div>

                        <span style={LIBELLE}>Adresse</span>
                        <input value={champ(s.id, "adresse")} onChange={(e) => poser(s.id, "adresse", e.target.value)} style={CHAMP} />

                        <span style={LIBELLE}>Email de contact</span>
                        <input value={champ(s.id, "email_contact")} onChange={(e) => poser(s.id, "email_contact", e.target.value)} style={CHAMP} />

                        <span style={LIBELLE}>Notes du dossier</span>
                        <textarea value={champ(s.id, "notes")} onChange={(e) => poser(s.id, "notes", e.target.value)} rows={3} style={CHAMP} />

                        <button
                          onClick={() => modifier(s.id)}
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
