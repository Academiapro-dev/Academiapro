"use client";
import { useState, useEffect } from "react";

const LIBELLE_STATUT: any = {
  a_engager: "A engager",
  en_cours: "En cours",
  close: "Close",
  abandonnee: "Abandonnee",
};

export default function PageAmelioration() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [brouillon, setBrouillon] = useState<any>({});

  const [origine, setOrigine] = useState("interne");
  const [constat, setConstat] = useState("");
  const [action, setAction] = useState("");
  const [responsable, setResponsable] = useState("");
  const [echeance, setEcheance] = useState("");

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
      const r = await fetch("/api/organisme/amelioration" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setD(data);
        const b: any = {};
        for (const a of data.ameliorations || []) {
          b[a.id] = {
            action: a.action_decidee || "",
            responsable: a.responsable || "",
            echeance: a.echeance || "",
            resultat: a.resultat_observe || "",
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

  async function ajouter() {
    if (constat.trim().length < 10) {
      setErreur("Decrivez le constat en une phrase au moins.");
      return;
    }
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/amelioration" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origine: origine,
          constat: constat,
          action_decidee: action,
          responsable: responsable,
          echeance: echeance || null,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Constat ajoute au plan.");
        setConstat(""); setAction(""); setResponsable(""); setEcheance("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Ajout impossible.");
      }
    } catch (e: any) {
      setErreur("Ajout impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function modifier(id: string, corps: any) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/amelioration" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ...corps }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Enregistre.");
        setOuvert({ ...ouvert, [id]: false });
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
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

  const CHAMP: any = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    lineHeight: "1.7",
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

  function enRetard(a: any) {
    if (a.statut === "close" || a.statut === "abandonnee") return false;
    if (!a.echeance) return false;
    return new Date(a.echeance).getTime() < Date.now();
  }

  function couleur(a: any) {
    if (a.statut === "close") return "rgba(76,175,80,0.35)";
    if (enRetard(a)) return "rgba(232,131,106,0.55)";
    if (a.statut === "abandonnee") return "rgba(255,255,255,0.12)";
    return "rgba(232,163,61,0.4)";
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          AMELIORATION CONTINUE
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mon plan d amelioration</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Indicateur 32 du referentiel national qualite
        </p>

        {d && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{d.total}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Constat(s)</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
              <p style={{ color: d.bouclees > 0 ? "#4caf50" : "rgba(255,255,255,0.4)", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.bouclees}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Boucle(s) fermee(s)</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
              <p style={{ color: d.en_retard > 0 ? "#e8836a" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.en_retard}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>En retard d echeance</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
              <p style={{ color: d.sans_action > 0 ? "#e8a33d" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.sans_action}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Sans action decidee</p>
            </div>
          </div>
        )}

        {d && d.total > 0 && d.bouclees === 0 && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
            <p style={{ color: "#e8a33d", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
              Aucune boucle fermee. L indicateur 32 ne demande pas une liste d actions mais la
              preuve qu au moins une a produit un effet constate. Cloturez-en une en decrivant
              ce qui a change.
            </p>
          </div>
        )}

        <button
          onClick={() => setFormulaire(!formulaire)}
          style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", marginBottom: "20px" }}
        >
          {formulaire ? "Annuler" : "Ajouter un constat"}
        </button>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>D ou vient ce constat ?</span>
            <select value={origine} onChange={(e) => setOrigine(e.target.value)} style={CHAMP}>
              {Object.keys(d && d.origines ? d.origines : { interne: "Constat interne" }).map(function (o) {
                return <option key={o} value={o}>{d.origines[o]}</option>;
              })}
            </select>

            <span style={LIBELLE}>Le constat</span>
            <textarea value={constat} onChange={(e) => setConstat(e.target.value)} rows={3} placeholder="Trois stagiaires ont signale que les consignes du module 4 manquaient de clarte." style={CHAMP} />

            <span style={LIBELLE}>L action decidee (facultatif pour l instant)</span>
            <textarea value={action} onChange={(e) => setAction(e.target.value)} rows={3} style={CHAMP} />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Responsable</span>
                <input value={responsable} onChange={(e) => setResponsable(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Echeance</span>
                <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <button
              onClick={ajouter}
              disabled={occupe}
              style={{ background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: occupe ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe ? "Ajout..." : "Ajouter au plan"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d || d.ameliorations.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
              Aucun constat enregistre. Vos evaluations et vos reclamations en fournissent
              naturellement : reprenez ce que vos stagiaires ont demande d ameliorer.
            </p>
          </div>
        ) : (
          d.ameliorations.map(function (a: any) {
            const estOuvert = ouvert[a.id] === true;
            return (
              <div key={a.id} style={{ ...CARTE, border: "1px solid " + couleur(a), opacity: a.statut === "abandonnee" ? 0.55 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ color: "#c8a96e", fontSize: "13px" }}>
                    {(d.origines && d.origines[a.origine]) || a.origine}
                    {a.echeance ? " · echeance " + new Date(a.echeance).toLocaleDateString("fr-FR") : ""}
                    {a.responsable ? " · " + a.responsable : ""}
                  </span>
                  <span style={{ color: a.statut === "close" ? "#4caf50" : enRetard(a) ? "#e8836a" : "#e8a33d", fontSize: "13px", fontWeight: "bold" }}>
                    {enRetard(a) ? "En retard" : LIBELLE_STATUT[a.statut] || a.statut}
                  </span>
                </div>

                <p style={{ color: "#fff", fontSize: "15px", margin: "0 0 12px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                  {a.constat}
                </p>

                {a.action_decidee && (
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 3px" }}>Action decidee</p>
                    <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "14px", margin: 0, lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                      {a.action_decidee}
                    </p>
                  </div>
                )}

                {a.resultat_observe && (
                  <div style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px" }}>
                    <p style={{ color: "#4caf50", fontSize: "13px", margin: "0 0 3px" }}>Resultat observe</p>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: 0, lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                      {a.resultat_observe}
                    </p>
                  </div>
                )}

                {estOuvert ? (
                  <div style={{ paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={LIBELLE}>Action decidee</span>
                    <textarea
                      value={(brouillon[a.id] && brouillon[a.id].action) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [a.id]: { ...(brouillon[a.id] || {}), action: e.target.value } })}
                      rows={3}
                      style={CHAMP}
                    />

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 180px" }}>
                        <span style={LIBELLE}>Responsable</span>
                        <input
                          value={(brouillon[a.id] && brouillon[a.id].responsable) || ""}
                          onChange={(e) => setBrouillon({ ...brouillon, [a.id]: { ...(brouillon[a.id] || {}), responsable: e.target.value } })}
                          style={CHAMP}
                        />
                      </div>
                      <div style={{ flex: "1 1 180px" }}>
                        <span style={LIBELLE}>Echeance</span>
                        <input
                          type="date"
                          value={(brouillon[a.id] && brouillon[a.id].echeance) || ""}
                          onChange={(e) => setBrouillon({ ...brouillon, [a.id]: { ...(brouillon[a.id] || {}), echeance: e.target.value } })}
                          style={CHAMP}
                        />
                      </div>
                    </div>

                    <span style={{ ...LIBELLE, color: "#4caf50" }}>
                      Resultat observe · indispensable pour clore
                    </span>
                    <textarea
                      value={(brouillon[a.id] && brouillon[a.id].resultat) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [a.id]: { ...(brouillon[a.id] || {}), resultat: e.target.value } })}
                      rows={3}
                      placeholder="Ce qui a change, et comment vous l avez constate."
                      style={CHAMP}
                    />

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => modifier(a.id, {
                          action_decidee: brouillon[a.id] ? brouillon[a.id].action : "",
                          responsable: brouillon[a.id] ? brouillon[a.id].responsable : "",
                          echeance: brouillon[a.id] && brouillon[a.id].echeance ? brouillon[a.id].echeance : null,
                          resultat_observe: brouillon[a.id] ? brouillon[a.id].resultat : "",
                          statut: "en_cours",
                        })}
                        style={{ background: "#c8a96e", color: "#050508", padding: "11px 22px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia,serif" }}
                      >
                        Enregistrer
                      </button>

                      <button
                        onClick={() => modifier(a.id, {
                          action_decidee: brouillon[a.id] ? brouillon[a.id].action : "",
                          resultat_observe: brouillon[a.id] ? brouillon[a.id].resultat : "",
                          statut: "close",
                        })}
                        style={{ background: "none", border: "1px solid rgba(76,175,80,0.5)", color: "#4caf50", padding: "11px 22px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif" }}
                      >
                        Clore avec ce resultat
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setOuvert({ ...ouvert, [a.id]: true })}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 18px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    {a.statut === "close" ? "Revoir" : "Renseigner"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
