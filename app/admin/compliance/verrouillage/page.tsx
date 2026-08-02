"use client";
import { useState, useEffect } from "react";

const ACTIONS: any = {
  verrouillage: { texte: "Verrouillage", couleur: "#4caf50" },
  deverrouillage: { texte: "Deverrouillage", couleur: "#e8836a" },
  contrepassation: { texte: "Contrepassation", couleur: "#e8a33d" },
};

// Seuls ces gestes exigent une raison. Reclamer un motif a un verrouillage
// afficherait un manque la ou il n y en a pas.
const EXIGENT_UN_MOTIF = ["deverrouillage", "contrepassation"];

export default function PageVerrouillage() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [motif, setMotif] = useState<any>({});
  const [cp, setCp] = useState<any>({ ecriture_num: "", motif: "" });

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
      const r = await fetch("/api/compliance/verrouillage?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function agir(corps: any, quoi: string) {
    setOccupe(quoi);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/verrouillage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, ...corps }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setCp({ ecriture_num: "", motif: "" });
        await charger();
      } else {
        setErreur(data.erreur || "Action impossible.");
      }
    } catch (e: any) {
      setErreur("Action impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "9px 17px", borderRadius: "20px", cursor: "pointer", fontSize: "13.5px", fontFamily: "Georgia,serif" };

  // Une contrepassation part seulement si elle est justifiee. La route l exige
  // aussi de son cote : ceci n est que le garde-fou visible.
  const cpPret = cp.ecriture_num.trim().length >= 4 && cp.motif.trim().length >= 3;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Verrouillage et piste d audit</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Une ecriture verrouillee ne se modifie plus : elle se contrepasse
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
            <p style={{ color: "#4caf50", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>{message}</p>
          </div>
        )}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture...</p></div>
        ) : !d ? null : (
          <>
            <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "22px 0 12px" }}>Exercices</h2>

            {d.exercices.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune ecriture sur ce dossier.
                </p>
              </div>
            ) : (
              d.exercices.map(function (e: any) {
                return (
                  <div key={e.annee} style={{ ...CARTE, border: e.verrouille ? "1px solid rgba(76,175,80,0.45)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 3px" }}>{e.annee}</h3>
                        <p style={{ color: e.verrouille ? "#4caf50" : e.partiel ? "#e8a33d" : "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: 0 }}>
                          {e.verrouille
                            ? "Verrouille · " + e.total + " ligne(s) d ecriture"
                            : e.partiel
                              ? e.verrouillees + " verrouillees sur " + e.total
                              : "Ouvert · " + e.total + " ligne(s) d ecriture"}
                        </p>
                      </div>
                    </div>

                    {!e.verrouille ? (
                      <button
                        onClick={() => agir({ action: "verrouiller", annee: e.annee }, e.annee)}
                        disabled={occupe !== ""}
                        style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold", marginTop: "12px" }}
                      >
                        {occupe === e.annee ? "..." : "Verrouiller " + e.annee}
                      </button>
                    ) : (
                      <div style={{ marginTop: "12px" }}>
                        <input
                          value={motif[e.annee] || ""}
                          onChange={(ev) => setMotif({ ...motif, [e.annee]: ev.target.value })}
                          placeholder="Motif du deverrouillage — il sera consigne"
                          style={CHAMP}
                        />
                        <button
                          onClick={() => agir({ action: "deverrouiller", annee: e.annee, motif: motif[e.annee] }, e.annee)}
                          disabled={occupe !== "" || (motif[e.annee] || "").trim().length < 3}
                          style={{ ...BOUTON, color: "#e8836a", borderColor: "rgba(232,131,106,0.45)" }}
                        >
                          {occupe === e.annee ? "..." : "Deverrouiller"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "26px 0 12px" }}>
              Contrepasser une ecriture
            </h2>
            <div style={CARTE}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: "0 0 12px", lineHeight: "1.75" }}>
                L ecriture d origine reste intacte au journal. Son miroir exact est ecrit a la
                date du jour, et la correction se voit. Le motif est obligatoire : il sera
                consigne dans la piste d audit.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 180px" }}>
                  <span style={LIBELLE}>Reference de l ecriture</span>
                  <input value={cp.ecriture_num} onChange={(e) => setCp({ ...cp, ecriture_num: e.target.value })} placeholder="AC2026-0012" style={CHAMP} />
                </div>
                <div style={{ flex: "1 1 240px" }}>
                  <span style={LIBELLE}>Motif — obligatoire</span>
                  <input value={cp.motif} onChange={(e) => setCp({ ...cp, motif: e.target.value })} placeholder="Erreur de compte de charge" style={CHAMP} />
                </div>
              </div>
              <button
                onClick={() => agir({ action: "contrepasser", ecriture_num: cp.ecriture_num, motif: cp.motif }, "cp")}
                disabled={occupe !== "" || !cpPret}
                style={{ background: occupe !== "" || !cpPret ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
              >
                {occupe === "cp" ? "Contrepassation..." : "Contrepasser"}
              </button>
            </div>

            <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "26px 0 12px" }}>
              Piste d audit
            </h2>

            {d.audit.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun evenement consigne sur ce dossier.
                </p>
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                {d.audit.map(function (a: any) {
                  const act = ACTIONS[a.action] || { texte: a.action, couleur: "rgba(255,255,255,0.6)" };
                  const leMotif = a.apres && a.apres.motif ? a.apres.motif : "";
                  const exigeUnMotif = EXIGENT_UN_MOTIF.indexOf(a.action) >= 0;
                  return (
                    <div key={a.id} style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ color: act.couleur, fontSize: "13.5px", fontWeight: "bold" }}>
                          {act.texte}
                          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: "normal" }}>
                            {" "}· {a.cible} {a.reference}
                          </span>
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px" }}>
                          {new Date(a.created_at).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: "4px 0 0", wordBreak: "break-all" }}>
                        {a.email}
                        {leMotif
                          ? " · motif : " + leMotif
                          : (exigeUnMotif ? " · motif non renseigne" : "")}
                        {a.apres && a.apres.lignes ? " · " + a.apres.lignes + " ligne(s)" : ""}
                        {a.apres && a.apres.ecriture_num ? " · devient " + a.apres.ecriture_num : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
                Le deverrouillage reste possible — un cabinet en a parfois besoin — mais il
                laisse une trace ici, avec son motif. C est ce qui distingue une correction
                assumee d une comptabilite refaite apres coup.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
