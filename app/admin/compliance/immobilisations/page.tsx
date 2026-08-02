"use client";
import { useState, useEffect } from "react";

export default function PageImmobilisations() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});

  const [f, setF] = useState<any>({
    designation: "", valeur_acquisition: "",
    date_acquisition: new Date().toISOString().slice(0, 10),
    duree_annees: "3", mode: "lineaire",
    compte_immo: "218300", compte_amort: "281830",
  });

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
      const r = await fetch("/api/compliance/immobilisations?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function enregistrer() {
    setOccupe("enr");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/immobilisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, ...f }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setF({ ...f, designation: "", valeur_acquisition: "" });
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

  async function passerDotation() {
    setOccupe("dotation");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/ecritures-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, type: "dotation", annee: d.annee }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        await charger();
      } else {
        setErreur(data.erreur || "Dotation impossible.");
      }
    } catch (e: any) {
      setErreur("Dotation impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  const CHAMPS = [
    ["valeur_acquisition", "Valeur d acquisition", "2400,00"],
    ["date_acquisition", "Date d acquisition", ""],
    ["duree_annees", "Duree (annees)", "3"],
    ["compte_immo", "Compte d immobilisation", "218300"],
    ["compte_amort", "Compte d amortissement", "281830"],
  ];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Immobilisations</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Les biens durables et leur plan d amortissement
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
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>}

        {dossier && (
          <button
            onClick={() => setFormulaire(!formulaire)}
            style={{ ...BOUTON, background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? BOUTON.border : "none", fontWeight: "bold", padding: "11px 22px", fontSize: "14px", marginBottom: "16px" }}
          >
            {formulaire ? "Annuler" : "Immobiliser un bien"}
          </button>
        )}

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Designation du bien</span>
            <input value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} placeholder="Ordinateur portable de direction" style={CHAMP} />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {CHAMPS.map(function (c: any) {
                return (
                  <div key={c[0]} style={{ flex: "1 1 150px" }}>
                    <span style={LIBELLE}>{c[1]}</span>
                    <input
                      type={c[0] === "date_acquisition" ? "date" : "text"}
                      value={f[c[0]]}
                      onChange={(e) => setF({ ...f, [c[0]]: e.target.value })}
                      placeholder={c[2]}
                      style={CHAMP}
                    />
                  </div>
                );
              })}
              <div style={{ flex: "1 1 150px" }}>
                <span style={LIBELLE}>Mode</span>
                <select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })} style={CHAMP}>
                  <option value="lineaire">Lineaire</option>
                  <option value="degressif">Degressif</option>
                </select>
              </div>
            </div>

            <button
              onClick={enregistrer}
              disabled={occupe !== "" || f.designation.trim().length < 2 || !f.valeur_acquisition}
              style={{ background: occupe !== "" || f.designation.trim().length < 2 || !f.valeur_acquisition ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "enr" ? "Enregistrement..." : "Enregistrer le bien"}
            </button>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture...</p></div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "20px", fontWeight: "bold", margin: "0 0 4px" }}>{euros(d.valeur_brute)}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Valeur brute</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#e8a33d", fontSize: "20px", fontWeight: "bold", margin: "0 0 4px" }}>{euros(d.amortissements_cumules)}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Amortissements</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#4caf50", fontSize: "20px", fontWeight: "bold", margin: "0 0 4px" }}>{euros(d.valeur_nette_totale)}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Valeur nette</p>
              </div>
            </div>

            {d.dotation_exercice > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
                <p style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 12px", lineHeight: "1.8" }}>
                  Dotation de l exercice {d.annee} : <strong>{euros(d.dotation_exercice)}</strong> sur{" "}
                  {d.en_service} bien(s) en service. Elle doit etre passee en ecriture avant la
                  cloture.
                </p>
                <button
                  onClick={passerDotation}
                  disabled={occupe !== ""}
                  style={{ background: occupe !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                >
                  {occupe === "dotation" ? "Passage de l ecriture..." : "Passer l ecriture de dotation"}
                </button>
              </div>
            )}

            {d.biens.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune immobilisation sur ce dossier.
                </p>
              </div>
            ) : (
              d.biens.map(function (b: any) {
                const estOuvert = ouvert[b.id] === true;
                return (
                  <div key={b.id} style={{ ...CARTE, opacity: b.sorti ? 0.55 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px" }}>
                          {b.compte_immo} · {b.mode} · en service le{" "}
                          {new Date(b.date_service).toLocaleDateString("fr-FR")}
                          {b.sorti ? " · SORTI" : ""}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "16.5px", margin: "0 0 4px" }}>{b.designation}</h3>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
                          {euros(b.valeur_acquisition)} sur {b.duree_annees} ans
                          {b.amorti ? " · entierement amorti" : ""}
                          {b.dotation_exercice > 0 ? " · dotation " + euros(b.dotation_exercice) : ""}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#4caf50", fontSize: "18px", fontWeight: "bold", margin: "0 0 2px" }}>{euros(b.valeur_nette)}</p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>valeur nette</p>
                      </div>
                    </div>

                    {b.plus_value_cession !== null && (
                      <p style={{ color: b.plus_value_cession >= 0 ? "#4caf50" : "#e8836a", fontSize: "13.5px", margin: "8px 0 0" }}>
                        Cede {euros(b.prix_cession)} ·{" "}
                        {b.plus_value_cession >= 0 ? "plus-value" : "moins-value"} de{" "}
                        {euros(Math.abs(b.plus_value_cession))}
                      </p>
                    )}

                    <button onClick={() => setOuvert({ ...ouvert, [b.id]: !estOuvert })} style={{ ...BOUTON, marginTop: "12px" }}>
                      {estOuvert ? "Masquer le plan" : "Voir le plan d amortissement"}
                    </button>

                    {estOuvert && (
                      <div style={{ marginTop: "12px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr 1fr", background: "rgba(200,169,110,0.1)", padding: "9px 12px", fontSize: "12px", color: "#c8a96e", fontWeight: "bold" }}>
                          <span>Annee</span>
                          <span style={{ textAlign: "right" }}>Dotation</span>
                          <span style={{ textAlign: "right" }}>Cumul</span>
                          <span style={{ textAlign: "right" }}>Valeur nette</span>
                        </div>
                        {b.plan.map(function (l: any) {
                          const courante = l.annee === d.annee;
                          return (
                            <div key={l.annee} style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr 1fr", padding: "9px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "13px", color: courante ? "#c8a96e" : "rgba(255,255,255,0.7)", fontWeight: courante ? "bold" : "normal" }}>
                              <span>{l.annee}</span>
                              <span style={{ textAlign: "right" }}>{euros(l.dotation)}</span>
                              <span style={{ textAlign: "right" }}>{euros(l.cumul)}</span>
                              <span style={{ textAlign: "right" }}>{euros(l.valeur_nette)}</span>
                            </div>
                          );
                        })}
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
