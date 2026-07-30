"use client";
import { useState, useEffect } from "react";

export default function PageFinancement() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [brouillon, setBrouillon] = useState<any>({});

  const [email, setEmail] = useState("");
  const [nomStagiaire, setNomStagiaire] = useState("");
  const [code, setCode] = useState("");
  const [financeur, setFinanceur] = useState("edof");
  const [reference, setReference] = useState("");
  const [demande, setDemande] = useState("");

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
      const r = await fetch("/api/organisme/financement" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setD(data);
        const b: any = {};
        for (const x of data.dossiers || []) {
          b[x.id] = {
            reference: x.reference_dossier || "",
            accorde: x.montant_accorde !== null && x.montant_accorde !== undefined ? String(x.montant_accorde) : "",
            pieces: x.pieces_manquantes || "",
          };
        }
        setBrouillon(b);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function creer() {
    if (email.indexOf("@") < 1) {
      setErreur("Indiquez l email du stagiaire.");
      return;
    }
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/financement" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stagiaire_email: email,
          stagiaire_nom: nomStagiaire,
          formation_code: code,
          financeur: financeur,
          reference_dossier: reference,
          montant_demande: demande || null,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Dossier cree.");
        setEmail(""); setNomStagiaire(""); setCode(""); setReference(""); setDemande("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Creation impossible.");
      }
    } catch (e: any) {
      setErreur("Creation impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function modifier(id: string, corps: any) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/financement" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ...corps }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Enregistre.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  async function retirer(id: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch("/api/organisme/financement" + sep + "id=" + id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage("Dossier retire.");
        await charger();
      } else {
        setErreur(data.erreur || "Suppression impossible.");
      }
    } catch (e: any) {
      setErreur("Suppression impossible : " + String(e));
    }
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

  const CHAMP: any = {
    width: "100%",
    padding: "12px 14px",
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
    fontSize: "14px",
    marginBottom: "6px",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "7px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  // Etape suivante logique, pour n offrir qu un seul bouton d avancee.
  const SUITE: any = {
    a_deposer: "depose",
    depose: "accorde",
    accorde: "service_fait",
    service_fait: "regle",
  };

  function couleur(x: any) {
    if (x.etape === "regle") return "rgba(76,175,80,0.4)";
    if (x.etape === "refuse" || x.etape === "annule") return "rgba(255,255,255,0.12)";
    if (x.etape === "accorde" && !x.service_fait_le) return "rgba(232,131,106,0.55)";
    if (x.etape === "service_fait") return "rgba(232,163,61,0.45)";
    return "rgba(200,169,110,0.25)";
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          DOSSIERS DE FINANCEMENT
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes financements</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          EDOF, OPCO, France Travail et conseils regionaux
        </p>

        {d && (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0 16px" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.a_deposer}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>A deposer</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.en_attente}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>En attente de decision</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: d.accorde_sans_service_fait > 0 ? "#e8836a" : "#4caf50", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.accorde_sans_service_fait_montant)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Sans service fait · {d.accorde_sans_service_fait} dossier(s)
                </p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: d.service_fait_non_regle > 0 ? "#e8a33d" : "#4caf50", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.service_fait_non_regle_montant)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  En attente de reglement
                </p>
              </div>
            </div>

            {d.accorde_sans_service_fait > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.6)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {euros(d.accorde_sans_service_fait_montant)} sont accordes mais attendent votre
                  declaration de service fait. Tant qu elle n est pas faite, le financeur ne paie
                  pas — et c est la premiere cause des paiements qui n arrivent jamais.
                </p>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => setFormulaire(!formulaire)}
          style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", marginBottom: "20px" }}
        >
          {formulaire ? "Annuler" : "Ouvrir un dossier"}
        </button>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Financeur</span>
            <select value={financeur} onChange={(e) => setFinanceur(e.target.value)} style={CHAMP}>
              {Object.keys(d && d.financeurs ? d.financeurs : { edof: "EDOF" }).map(function (k) {
                return <option key={k} value={k}>{d.financeurs[k]}</option>;
              })}
            </select>

            <span style={LIBELLE}>Email du stagiaire</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={CHAMP} />

            <span style={LIBELLE}>Nom du stagiaire</span>
            <input value={nomStagiaire} onChange={(e) => setNomStagiaire(e.target.value)} style={CHAMP} />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Formation</span>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="F028" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Reference du dossier</span>
                <input value={reference} onChange={(e) => setReference(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Montant demande</span>
                <input value={demande} onChange={(e) => setDemande(e.target.value)} placeholder="1500" style={CHAMP} />
              </div>
            </div>

            <button
              onClick={creer}
              disabled={occupe}
              style={{ background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: occupe ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe ? "Creation..." : "Ouvrir le dossier"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d || d.dossiers.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun dossier de financement.
            </p>
          </div>
        ) : (
          d.dossiers.map(function (x: any) {
            const suite = SUITE[x.etape];
            return (
              <div key={x.id} style={{ ...CARTE, border: "1px solid " + couleur(x), opacity: x.etape === "refuse" || x.etape === "annule" ? 0.55 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 250px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 3px" }}>
                      {(d.financeurs && d.financeurs[x.financeur]) || x.financeur}
                      {x.reference_dossier ? " · " + x.reference_dossier : ""}
                    </p>
                    <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px", wordBreak: "break-all" }}>
                      {x.stagiaire_nom || x.stagiaire_email}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {x.formation_code || "—"}
                      {x.depose_le ? " · depose le " + new Date(x.depose_le).toLocaleDateString("fr-FR") : ""}
                      {x.service_fait_le ? " · service fait le " + new Date(x.service_fait_le).toLocaleDateString("fr-FR") : ""}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "#c8a96e", fontSize: "18px", fontWeight: "bold", margin: "0 0 2px" }}>
                      {x.montant_accorde ? euros(x.montant_accorde) : x.montant_demande ? euros(x.montant_demande) + " demandes" : "—"}
                    </p>
                    <p style={{ color: x.etape === "regle" ? "#4caf50" : x.etape === "accorde" && !x.service_fait_le ? "#e8836a" : "#e8a33d", fontSize: "13px", fontWeight: "bold", margin: 0 }}>
                      {(d.etapes && d.etapes[x.etape]) || x.etape}
                    </p>
                  </div>
                </div>

                {x.etape === "accorde" && !x.service_fait_le && (
                  <p style={{ color: "#e8836a", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.6" }}>
                    Declarez le service fait pour debloquer le paiement.
                  </p>
                )}

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                  {x.etape === "depose" && (
                    <input
                      value={(brouillon[x.id] && brouillon[x.id].accorde) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [x.id]: { ...(brouillon[x.id] || {}), accorde: e.target.value } })}
                      placeholder="Montant accorde"
                      style={{ ...CHAMP, width: "150px", marginBottom: 0, fontSize: "14px", padding: "8px 12px" }}
                    />
                  )}

                  {suite && (
                    <button
                      onClick={() => modifier(x.id, {
                        etape: suite,
                        montant_accorde: suite === "accorde" && brouillon[x.id] ? brouillon[x.id].accorde : undefined,
                        reference_dossier: brouillon[x.id] ? brouillon[x.id].reference : undefined,
                      })}
                      style={{ ...BOUTON, background: x.etape === "accorde" ? "#c8a96e" : "none", color: x.etape === "accorde" ? "#050508" : "#c8a96e", fontWeight: x.etape === "accorde" ? "bold" : "normal" }}
                    >
                      {(d.etapes && d.etapes[suite]) || suite} →
                    </button>
                  )}

                  {x.etape !== "refuse" && x.etape !== "regle" && (
                    <button
                      onClick={() => modifier(x.id, { etape: "refuse" })}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px", padding: "0 6px" }}
                    >
                      Refuse
                    </button>
                  )}

                  <button
                    onClick={() => retirer(x.id)}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
