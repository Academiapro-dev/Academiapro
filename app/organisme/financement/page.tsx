"use client";
import { useState, useEffect } from "react";
import Guide from "../../../components/Guide";

const OR = "#c8a96e";
const NOIR = "#050508";
const ROUGE = "#e8836a";
const ORANGE = "#e8a33d";
const VERT = "#4caf50";

// LES DOSSIERS DE FINANCEMENT.
//
// Un organisme de formation ne perd pas son argent parce qu on refuse ses
// dossiers : il le perd parce qu il oublie de declarer le service fait, ou
// parce qu un accord dort trois mois sans que personne ne relance.
//
// Cet ecran montre donc d abord CE QUI BLOQUE L ARGENT, et seulement
// ensuite la liste.

export default function PageFinancement() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [occupe, setOccupe] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [filtre, setFiltre] = useState("");

  const [n, setN] = useState<any>({
    stagiaire_nom: "",
    stagiaire_email: "",
    formation_code: "",
    financeur: "edof",
    reference_dossier: "",
    montant_demande: "",
  });

  useEffect(function () { charger(); }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/financement", { cache: "no-store" });
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible.");
    }
    setChargement(false);
  }

  async function creer() {
    if (!n.stagiaire_email || n.stagiaire_email.indexOf("@") < 1) {
      setErreur("Indiquez l'adresse du stagiaire.");
      return;
    }
    setOccupe("creation");
    setErreur("");
    setMessage("");
    try {
      const r = await fetch("/api/organisme/financement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Dossier créé.");
        setFormulaire(false);
        setN({ stagiaire_nom: "", stagiaire_email: "", formation_code: "", financeur: "edof", reference_dossier: "", montant_demande: "" });
        charger();
      } else {
        setErreur(data.erreur || "Création impossible.");
      }
    } catch (e: any) {
      setErreur("Création impossible.");
    }
    setOccupe("");
  }

  async function avancer(id: string, etape: string, champs?: any) {
    setOccupe(id);
    setErreur("");
    setMessage("");
    try {
      const r = await fetch("/api/organisme/financement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, etape: etape, ...(champs || {}) }),
      });
      const data = await r.json();
      if (data.ok) { setMessage("Dossier mis à jour."); charger(); }
      else setErreur(data.erreur || "Mise à jour impossible.");
    } catch (e: any) {
      setErreur("Mise à jour impossible.");
    }
    setOccupe("");
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer ce dossier ?")) return;
    setOccupe(id);
    try {
      await fetch("/api/organisme/financement?id=" + encodeURIComponent(id), { method: "DELETE" });
      charger();
    } catch (e) {}
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: OR, fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };
  const PLEIN: any = { ...BOUTON, background: OR, color: NOIR, border: "none", fontWeight: "bold" };

  function euros(v: any) {
    return (Number(v) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  function jour(v: any) {
    if (!v) return "";
    return new Date(v).toLocaleDateString("fr-FR");
  }

  // Depuis combien de temps un dossier dort a cette etape. C est ce chiffre
  // qui dit s il faut relancer.
  function depuis(v: any): number {
    if (!v) return 0;
    return Math.floor((Date.now() - new Date(v).getTime()) / 86400000);
  }

  const dossiers = d && d.dossiers ? d.dossiers : [];
  const affiches = filtre
    ? dossiers.filter(function (x: any) { return x.etape === filtre; })
    : dossiers;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        <a href="/organisme" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Mon organisme
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          GESTION ADMINISTRATIVE
        </p>
        <h1 style={{ fontSize: "29px", margin: "0 0 6px" }}>Dossiers de financement</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: "1.7", maxWidth: "680px" }}>
          Du dépôt au règlement. La déclaration de service fait est l'étape qu'on
          oublie : sans elle, le financeur ne paie jamais.
        </p>

        <div style={{ marginTop: "18px" }}>
          <Guide ecran="organisme.financement" />
        </div>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: ROUGE, fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture…</p>
          </div>
        ) : !d ? null : (
          <>
            {/* CE QUI BLOQUE L ARGENT. */}
            {(d.accorde_sans_service_fait > 0 || d.service_fait_non_regle > 0) && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)", marginTop: "24px" }}>
                <h2 style={{ fontSize: "18px", margin: "0 0 14px", color: ORANGE }}>
                  Ce qui bloque votre argent
                </h2>

                {d.accorde_sans_service_fait > 0 && (
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", lineHeight: "1.75", margin: "0 0 10px" }}>
                    <strong>{d.accorde_sans_service_fait} dossier(s) accordé(s)</strong> sans
                    déclaration de service fait, soit {euros(d.accorde_sans_service_fait_montant)}.
                    Le financeur attend cette déclaration pour payer.
                  </p>
                )}

                {d.service_fait_non_regle > 0 && (
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                    <strong>{d.service_fait_non_regle} dossier(s)</strong> avec service fait
                    déclaré mais non réglé, soit {euros(d.service_fait_non_regle_montant)}.
                    C'est ce qu'on vous doit.
                  </p>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "20px 0" }}>
              <button onClick={function () { setFiltre(""); }} style={filtre === "" ? PLEIN : BOUTON}>
                Tous · {d.total}
              </button>
              <button onClick={function () { setFiltre("a_deposer"); }} style={filtre === "a_deposer" ? PLEIN : BOUTON}>
                À déposer · {d.a_deposer}
              </button>
              <button onClick={function () { setFiltre("depose"); }} style={filtre === "depose" ? PLEIN : BOUTON}>
                En attente · {d.en_attente}
              </button>
              <button onClick={function () { setFormulaire(!formulaire); }} style={BOUTON}>
                {formulaire ? "Annuler" : "Nouveau dossier"}
              </button>
            </div>

            {formulaire && (
              <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
                <h2 style={{ fontSize: "18px", margin: "0 0 16px" }}>Nouveau dossier</h2>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 220px" }}>
                    <span style={LIBELLE}>Nom du stagiaire</span>
                    <input value={n.stagiaire_nom} onChange={function (e) { setN({ ...n, stagiaire_nom: e.target.value }); }} style={CHAMP} />
                  </div>
                  <div style={{ flex: "1 1 220px" }}>
                    <span style={LIBELLE}>Son adresse électronique</span>
                    <input type="email" value={n.stagiaire_email} onChange={function (e) { setN({ ...n, stagiaire_email: e.target.value }); }} style={CHAMP} />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIBELLE}>Code formation</span>
                    <input value={n.formation_code} onChange={function (e) { setN({ ...n, formation_code: e.target.value }); }} placeholder="F424" style={CHAMP} />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <span style={LIBELLE}>Financeur</span>
                    <select value={n.financeur} onChange={function (e) { setN({ ...n, financeur: e.target.value }); }} style={CHAMP}>
                      {Object.keys(d.financeurs).map(function (k) {
                        return <option key={k} value={k}>{d.financeurs[k]}</option>;
                      })}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 180px" }}>
                    <span style={LIBELLE}>Référence du dossier</span>
                    <input value={n.reference_dossier} onChange={function (e) { setN({ ...n, reference_dossier: e.target.value }); }} style={CHAMP} />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIBELLE}>Montant demandé</span>
                    <input value={n.montant_demande} onChange={function (e) { setN({ ...n, montant_demande: e.target.value }); }} placeholder="1200" style={CHAMP} />
                  </div>
                </div>

                <button onClick={creer} disabled={occupe !== ""} style={{ ...PLEIN, padding: "13px 26px", borderRadius: "8px", fontSize: "15px" }}>
                  {occupe === "creation" ? "Création…" : "Créer le dossier"}
                </button>
              </div>
            )}

            {affiches.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun dossier{filtre ? " à cette étape" : ""}.
                </p>
              </div>
            ) : (
              affiches.map(function (x: any) {
                const bloque = x.etape === "accorde" && !x.service_fait_le;
                const attendu = x.service_fait_le && !x.regle_le;

                const bordure = bloque || attendu
                  ? "1px solid rgba(232,163,61,0.5)"
                  : x.etape === "regle"
                    ? "1px solid rgba(76,175,80,0.35)"
                    : CARTE.border;

                return (
                  <div key={x.id} style={{ ...CARTE, border: bordure }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: "1 1 300px" }}>
                        <p style={{ color: OR, fontSize: "12.5px", margin: "0 0 3px" }}>
                          {d.financeurs[x.financeur] || x.financeur}
                          {x.reference_dossier ? " · " + x.reference_dossier : ""}
                          {x.formation_code ? " · " + x.formation_code : ""}
                        </p>
                        <h3 style={{ fontSize: "16px", margin: "0 0 4px" }}>
                          {x.stagiaire_nom || x.stagiaire_email}
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {d.etapes[x.etape] || x.etape}
                          {x.depose_le ? " · déposé le " + jour(x.depose_le) : ""}
                          {x.decision_le ? " · décision le " + jour(x.decision_le) : ""}
                          {x.service_fait_le ? " · service fait le " + jour(x.service_fait_le) : ""}
                          {x.regle_le ? " · réglé le " + jour(x.regle_le) : ""}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {x.montant_accorde ? (
                          <span style={{ color: "#fff", fontSize: "16px", fontWeight: "bold" }}>{euros(x.montant_accorde)}</span>
                        ) : x.montant_demande ? (
                          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px" }}>{euros(x.montant_demande)} demandés</span>
                        ) : null}
                      </div>
                    </div>

                    {bloque && (
                      <p style={{ color: ORANGE, fontSize: "13.5px", margin: "10px 0 0", lineHeight: "1.7" }}>
                        Accordé depuis {depuis(x.decision_le)} jour(s) sans service fait déclaré.
                        Tant qu'il ne l'est pas, le financeur ne paiera pas.
                      </p>
                    )}
                    {attendu && (
                      <p style={{ color: ORANGE, fontSize: "13.5px", margin: "10px 0 0", lineHeight: "1.7" }}>
                        Service fait déclaré depuis {depuis(x.service_fait_le)} jour(s), toujours
                        non réglé.
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "14px" }}>
                      {x.etape === "a_deposer" && (
                        <button onClick={function () { avancer(x.id, "depose"); }} disabled={occupe !== ""} style={PLEIN}>
                          Marquer déposé
                        </button>
                      )}
                      {x.etape === "depose" && (
                        <>
                          <button
                            onClick={function () {
                              const m = prompt("Montant accordé, en euros :", String(x.montant_demande || ""));
                              if (m !== null) avancer(x.id, "accorde", { montant_accorde: m });
                            }}
                            disabled={occupe !== ""}
                            style={PLEIN}
                          >
                            Accordé
                          </button>
                          <button onClick={function () { avancer(x.id, "refuse"); }} disabled={occupe !== ""} style={BOUTON}>
                            Refusé
                          </button>
                        </>
                      )}
                      {x.etape === "accorde" && (
                        <button onClick={function () { avancer(x.id, "service_fait"); }} disabled={occupe !== ""} style={PLEIN}>
                          Déclarer le service fait
                        </button>
                      )}
                      {x.etape === "service_fait" && (
                        <button onClick={function () { avancer(x.id, "regle"); }} disabled={occupe !== ""} style={PLEIN}>
                          Marquer réglé
                        </button>
                      )}
                      {x.etape !== "regle" && (
                        <button onClick={function () { supprimer(x.id); }} disabled={occupe !== ""} style={{ ...BOUTON, color: ROUGE, borderColor: "rgba(232,131,106,0.35)" }}>
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* PAR FINANCEUR. Un organisme doit savoir d ou vient son argent :
                c est ce que le bilan pedagogique et financier demandera. */}
            {d.par_financeur && Object.keys(d.par_financeur).length > 0 && (
              <div style={CARTE}>
                <h2 style={{ fontSize: "18px", margin: "0 0 16px" }}>Par financeur</h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "460px" }}>
                    <thead>
                      <tr style={{ color: OR, fontSize: "12.5px" }}>
                        <th style={{ textAlign: "left", padding: "8px 10px 12px 0", fontWeight: "normal" }}>Financeur</th>
                        <th style={{ textAlign: "right", padding: "8px 10px 12px", fontWeight: "normal" }}>Dossiers</th>
                        <th style={{ textAlign: "right", padding: "8px 10px 12px", fontWeight: "normal" }}>Demandé</th>
                        <th style={{ textAlign: "right", padding: "8px 10px 12px", fontWeight: "normal" }}>Accordé</th>
                        <th style={{ textAlign: "right", padding: "8px 0 12px 10px", fontWeight: "normal" }}>Réglé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(d.par_financeur).map(function (k) {
                        const f = d.par_financeur[k];
                        return (
                          <tr key={k} style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                            <td style={{ padding: "11px 10px 11px 0" }}>{d.financeurs[k] || k}</td>
                            <td style={{ padding: "11px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>{f.nombre}</td>
                            <td style={{ padding: "11px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>{euros(f.demande)}</td>
                            <td style={{ padding: "11px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>{euros(f.accorde)}</td>
                            <td style={{ padding: "11px 0 11px 10px", textAlign: "right", color: VERT }}>{euros(f.regle)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
