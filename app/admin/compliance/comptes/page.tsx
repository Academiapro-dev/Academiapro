"use client";
import { useState, useEffect } from "react";

export default function PageComptes() {
  const [d, setD] = useState<any>(null);
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [classe, setClasse] = useState("");
  const [recherche, setRecherche] = useState("");
  const [portee, setPortee] = useState("tous");

  const [numero, setNumero] = useState("");
  const [libelle, setLibelle] = useState("");
  const [type, setType] = useState("");
  const [lettrable, setLettrable] = useState(false);
  const [tauxTva, setTauxTva] = useState("");
  const [pourDossier, setPourDossier] = useState(false);
  const [modifie, setModifie] = useState("");

  useEffect(function () {
    chargerSocietes();
  }, []);

  useEffect(function () {
    charger();
  }, [dossier]);

  async function chargerSocietes() {
    try {
      const r = await fetch("/api/compliance/societes");
      const data = await r.json();
      if (data.ok) setSocietes(data.societes || []);
    } catch (e) {}
  }

  function suffixe(sep: string) {
    return dossier ? sep + "societe_id=" + dossier : "";
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/comptes" + suffixe("?"));
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function viderFormulaire() {
    setNumero(""); setLibelle(""); setType(""); setTauxTva("");
    setLettrable(false); setPourDossier(false); setModifie("");
  }

  // MODIFIER : le formulaire est rempli avec les valeurs DEJA en base.
  // Sans cela, un enregistrement effacerait le type et le taux de TVA,
  // puisque la route remplace la fiche entiere.
  function modifier(c: any) {
    setModifie(c.numero);
    setNumero(c.numero);
    setLibelle(c.libelle || "");
    setType(c.type || "");
    setTauxTva(c.taux_tva === null || c.taux_tva === undefined ? "" : String(c.taux_tva));
    setLettrable(c.lettrable === true);
    setPourDossier(c.origine === "dossier");
    setFormulaire(true);
    setMessage("");
    setErreur("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function basculerFormulaire() {
    if (formulaire) {
      setFormulaire(false);
      viderFormulaire();
    } else {
      viderFormulaire();
      setFormulaire(true);
    }
  }

  async function enregistrer() {
    if (numero.trim().length < 3 || libelle.trim().length < 2) {
      setErreur("Un numero d au moins trois chiffres et un libelle sont necessaires.");
      return;
    }
    setOccupe("enr");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/comptes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numero,
          libelle: libelle,
          type: type,
          lettrable: lettrable,
          taux_tva: tauxTva,
          societe_id: pourDossier && dossier ? dossier : null,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        viderFormulaire();
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  async function supprimer(c: any) {
    setOccupe("sup-" + c.id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/comptes?id=" + c.id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage("Compte " + data.supprime + " supprime.");
        await charger();
      } else {
        setErreur(data.erreur || "Suppression impossible.");
      }
    } catch (e: any) {
      setErreur("Suppression impossible : " + String(e));
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

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  const affiches = d
    ? d.comptes.filter(function (c: any) {
        if (classe && String(c.classe) !== classe) return false;
        if (portee === "dossier" && c.origine !== "dossier") return false;
        if (portee === "mouvementes" && !(c.mouvements > 0)) return false;
        const q = recherche.trim().toLowerCase();
        if (q) {
          const texte = (c.numero + " " + c.libelle).toLowerCase();
          if (texte.indexOf(q) < 0) return false;
        }
        return true;
      })
    : [];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Plan comptable</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Un socle commun, et les comptes propres a chaque dossier
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
            <option value="">Plan commun seul — aucun dossier</option>
            {societes.map(function (s) {
              return (
                <option key={s.id} value={s.id}>
                  {s.raison_sociale} ({s.code})
                </option>
              );
            })}
          </select>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture du plan...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{d.total}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Compte(s)</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{d.propres}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Propre(s) au dossier</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#4caf50", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{d.mouvementes}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Mouvemente(s)</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              <button
                onClick={() => setClasse("")}
                style={{ padding: "8px 15px", borderRadius: "20px", border: "none", cursor: "pointer", background: classe === "" ? "#c8a96e" : "rgba(255,255,255,0.06)", color: classe === "" ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "13px", fontFamily: "Georgia,serif" }}
              >
                Toutes
              </button>
              {Object.keys(d.classes).map(function (k) {
                const actif = classe === k;
                return (
                  <button
                    key={k}
                    onClick={() => setClasse(k)}
                    style={{ padding: "8px 15px", borderRadius: "20px", border: "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    {k} · {d.classes[k]}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {[["tous", "Tout le plan"], ["dossier", "Propres au dossier"], ["mouvementes", "Mouvementes"]].map(function (p: any) {
                const actif = portee === p[0];
                return (
                  <button
                    key={p[0]}
                    onClick={() => setPortee(p[0])}
                    style={{ ...BOUTON, background: actif ? "rgba(200,169,110,0.2)" : "none", fontWeight: actif ? "bold" : "normal" }}
                  >
                    {p[1]}
                  </button>
                );
              })}
              <button
                onClick={basculerFormulaire}
                style={{ ...BOUTON, background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", fontWeight: "bold" }}
              >
                {formulaire ? "Annuler" : "Ajouter un compte"}
              </button>
            </div>

            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Chercher un numero ou un libelle..."
              style={CHAMP}
            />

            {formulaire && (
              <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
                <p style={{ color: "#c8a96e", fontSize: "15px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {modifie ? "Modifier le compte " + modifie : "Nouveau compte"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 16px", lineHeight: "1.7" }}>
                  {modifie
                    ? "Les valeurs actuelles du compte sont reprises ci-dessous. Ce que vous laissez vide sera efface."
                    : "Un numero deja present au plan sera mis a jour plutot que cree une seconde fois."}
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIBELLE}>Numero</span>
                    <input
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      readOnly={modifie !== ""}
                      placeholder="622600"
                      style={{ ...CHAMP, opacity: modifie ? 0.6 : 1 }}
                    />
                  </div>
                  <div style={{ flex: "1 1 260px" }}>
                    <span style={LIBELLE}>Libelle</span>
                    <input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Honoraires" style={CHAMP} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 160px" }}>
                    <span style={LIBELLE}>Type</span>
                    <input value={type} onChange={(e) => setType(e.target.value)} placeholder="charge, produit, client..." style={CHAMP} />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIBELLE}>Taux de TVA (%)</span>
                    <input value={tauxTva} onChange={(e) => setTauxTva(e.target.value)} placeholder="20" style={CHAMP} />
                  </div>
                </div>

                <div
                  onClick={() => setLettrable(!lettrable)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", background: lettrable ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)", border: lettrable ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.12)", marginBottom: "12px" }}
                >
                  <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: lettrable ? "#c8a96e" : "transparent", border: lettrable ? "2px solid #c8a96e" : "2px solid #999", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {lettrable ? "✓" : ""}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px" }}>
                    Compte lettrable — on y rapproche les mouvements
                  </span>
                </div>

                {dossier && (
                  <div
                    onClick={() => setPourDossier(!pourDossier)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", background: pourDossier ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)", border: pourDossier ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.12)", marginBottom: "14px" }}
                  >
                    <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: pourDossier ? "#c8a96e" : "transparent", border: pourDossier ? "2px solid #c8a96e" : "2px solid #999", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      {pourDossier ? "✓" : ""}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", lineHeight: "1.6" }}>
                      Reserver ce compte a ce dossier — sinon il rejoint le plan commun
                    </span>
                  </div>
                )}

                <button
                  onClick={enregistrer}
                  disabled={occupe !== ""}
                  style={{ background: occupe !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
                >
                  {occupe === "enr" ? "Enregistrement..." : modifie ? "Enregistrer les modifications" : "Enregistrer le compte"}
                </button>
              </div>
            )}

            {affiches.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun compte ne correspond.
                </p>
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2.2fr 0.9fr 0.6fr 1fr", background: "rgba(200,169,110,0.12)", padding: "12px 16px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
                  <span>Numero</span>
                  <span>Libelle</span>
                  <span>Portee</span>
                  <span>Mouv.</span>
                  <span></span>
                </div>

                {affiches.map(function (c: any) {
                  return (
                    <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 2.2fr 0.9fr 0.6fr 1fr", padding: "11px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center", opacity: c.actif === false ? 0.45 : 1 }}>
                      <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{c.numero}</span>
                      <span>
                        {c.libelle}
                        {c.lettrable ? <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}> · lettrable</span> : null}
                        {c.taux_tva ? <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}> · TVA {c.taux_tva} %</span> : null}
                      </span>
                      <span style={{ color: c.origine === "dossier" ? "#4caf50" : "rgba(255,255,255,0.4)", fontSize: "12.5px" }}>
                        {c.origine === "dossier" ? "ce dossier" : "commun"}
                      </span>
                      <span style={{ color: c.mouvements > 0 ? "#c8a96e" : "rgba(255,255,255,0.25)" }}>
                        {c.mouvements}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => modifier(c)}
                          disabled={occupe !== ""}
                          style={{ background: "none", border: "none", color: "#c8a96e", cursor: "pointer", fontSize: "12.5px", padding: 0, fontFamily: "Georgia,serif", textDecoration: "underline" }}
                        >
                          modifier
                        </button>
                        {c.mouvements === 0 && c.origine === "dossier" && (
                          <button
                            onClick={() => supprimer(c)}
                            disabled={occupe !== ""}
                            style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "12px", padding: 0, fontFamily: "Georgia,serif" }}
                          >
                            suppr.
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
                Le plan commun sert de socle a tous les dossiers. Un compte cree pour un dossier
                precis le complete, et prime sur le compte commun de meme numero.
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.8" }}>
                Un compte deja mouvemente ne peut pas etre supprime : la piste d audit serait
                rompue. Rendez-le inactif si vous ne voulez plus l utiliser.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
