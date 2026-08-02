"use client";
import { useState, useEffect } from "react";

export default function PageLettrage() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [compte, setCompte] = useState("");
  const [d, setD] = useState<any>(null);
  const [choix, setChoix] = useState<any>({});
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState("");
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
  }, [dossier, compte]);

  async function charger() {
    setChargement(true);
    setErreur("");
    setChoix({});
    try {
      const r = await fetch(
        "/api/compliance/lettrage?societe_id=" + dossier + (compte ? "&compte=" + compte : "")
      );
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function lettrer(ids: string[]) {
    setOccupe("lettrage");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/lettrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, ids: ids }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        await charger();
      } else {
        setErreur(data.erreur || "Lettrage impossible.");
      }
    } catch (e: any) {
      setErreur("Lettrage impossible : " + String(e));
    }
    setOccupe("");
  }

  async function delettrer(lettre: string) {
    setOccupe("del-" + lettre);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/lettrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societe_id: dossier, compte: compte, action: "delettrer", lettre: lettre,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        await charger();
      } else {
        setErreur(data.erreur || "Delettrage impossible.");
      }
    } catch (e: any) {
      setErreur("Delettrage impossible : " + String(e));
    }
    setOccupe("");
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

  const BOUTON: any = {
    background: "none", border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e", padding: "8px 16px", borderRadius: "20px",
    cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif",
  };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  const selection = d && d.vue === "compte"
    ? d.lignes.filter(function (l: any) { return choix[l.id]; })
    : [];
  const soldeSelection = selection.reduce(function (s: number, l: any) { return s + l.mouvement; }, 0);
  const pretALettrer = selection.length >= 2 && Math.abs(soldeSelection) < 0.005;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Lettrage</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Rapprocher les factures de leurs reglements, compte par compte
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => { setCompte(""); setDossier(e.target.value); }} style={{ ...CHAMP, marginBottom: 0 }}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture...</p></div>
        ) : !d ? null : d.vue === "comptes" ? (
          d.comptes.length === 0 ? (
            <div style={CARTE}>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                Aucun compte lettrable mouvemente sur ce dossier.
              </p>
            </div>
          ) : (
            d.comptes.map(function (c: any) {
              return (
                <div
                  key={c.numero}
                  onClick={() => setCompte(c.numero)}
                  style={{ ...CARTE, cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px", fontFamily: "monospace" }}>
                        {c.numero}
                      </p>
                      <h3 style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{c.libelle}</h3>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: c.a_lettrer > 0 ? "#e8a33d" : "#4caf50", fontSize: "18px", fontWeight: "bold", margin: "0 0 2px" }}>
                        {c.a_lettrer}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>
                        a lettrer sur {c.total}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "8px 0 0" }}>
                    Solde du compte : {euros(c.solde)}
                  </p>
                </div>
              );
            })
          )
        ) : (
          <>
            <div style={{ ...CARTE, border: "2px solid rgba(200,169,110,0.45)" }}>
              <button onClick={() => setCompte("")} style={{ ...BOUTON, marginBottom: "12px" }}>
                ← Tous les comptes
              </button>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px", fontFamily: "monospace" }}>
                {d.compte.numero}
              </p>
              <h2 style={{ color: "#fff", fontSize: "18px", margin: "0 0 8px" }}>{d.compte.libelle}</h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>
                {d.a_lettrer} ligne(s) a lettrer sur {d.total} · reste ouvert {euros(d.solde_ouvert)}
              </p>
            </div>

            {d.propositions.length > 0 && (
              <div style={CARTE}>
                <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>
                  Groupes qui s annulent
                </h2>
                {d.propositions.map(function (p: any, i: number) {
                  return (
                    <div key={i} style={{ background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: "10px", padding: "12px 14px", marginBottom: "10px" }}>
                      {p.lignes.map(function (l: any) {
                        return (
                          <p key={l.id} style={{ color: "rgba(255,255,255,0.78)", fontSize: "13.5px", margin: "0 0 4px" }}>
                            {new Date(l.ecriture_date).toLocaleDateString("fr-FR")} · {l.ecriture_lib}
                            <span style={{ color: l.mouvement > 0 ? "#c8a96e" : "#e8a33d" }}>
                              {" "}· {euros(l.mouvement)}
                            </span>
                          </p>
                        );
                      })}
                      <button
                        onClick={() => lettrer(p.lignes.map(function (l: any) { return l.id; }))}
                        disabled={occupe !== ""}
                        style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold", marginTop: "6px" }}
                      >
                        {occupe === "lettrage" ? "..." : "Lettrer ces deux lignes"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {selection.length > 0 && (
              <div style={{ ...CARTE, border: pretALettrer ? "1px solid rgba(76,175,80,0.5)" : "1px solid rgba(232,163,61,0.45)" }}>
                <p style={{ color: pretALettrer ? "#4caf50" : "#e8a33d", fontSize: "14.5px", margin: "0 0 10px" }}>
                  {selection.length} ligne(s) selectionnee(s) · solde {euros(soldeSelection)}
                  {pretALettrer ? " — elles s annulent" : " — elles ne s annulent pas encore"}
                </p>
                <button
                  onClick={() => lettrer(selection.map(function (l: any) { return l.id; }))}
                  disabled={occupe !== "" || !pretALettrer}
                  style={{ background: occupe !== "" || !pretALettrer ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" || !pretALettrer ? "#8a8a8a" : "#050508", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14.5px", fontFamily: "Georgia,serif" }}
                >
                  {occupe === "lettrage" ? "Lettrage..." : "Lettrer la selection"}
                </button>
              </div>
            )}

            <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "0.5fr 0.9fr 2.2fr 1fr 0.7fr", background: "rgba(200,169,110,0.12)", padding: "12px 14px", fontSize: "12px", color: "#c8a96e", fontWeight: "bold" }}>
                <span></span><span>Date</span><span>Libelle</span>
                <span style={{ textAlign: "right" }}>Mouvement</span>
                <span style={{ textAlign: "right" }}>Lettre</span>
              </div>
              {d.lignes.map(function (l: any) {
                const coche = !!choix[l.id];
                return (
                  <div key={l.id} style={{ display: "grid", gridTemplateColumns: "0.5fr 0.9fr 2.2fr 1fr 0.7fr", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center", background: coche ? "rgba(200,169,110,0.08)" : "transparent" }}>
                    <span>
                      {!l.lettrage && (
                        <span
                          onClick={() => setChoix({ ...choix, [l.id]: !coche })}
                          style={{ display: "inline-block", width: "20px", height: "20px", borderRadius: "5px", cursor: "pointer", background: coche ? "#c8a96e" : "transparent", border: coche ? "2px solid #c8a96e" : "2px solid #666", color: "#050508", textAlign: "center", fontWeight: "bold", lineHeight: "17px", fontSize: "13px" }}
                        >
                          {coche ? "✓" : ""}
                        </span>
                      )}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>
                      {new Date(l.ecriture_date).toLocaleDateString("fr-FR")}
                    </span>
                    <span>{l.ecriture_lib}</span>
                    <span style={{ textAlign: "right", color: l.mouvement > 0 ? "#c8a96e" : "#e8a33d" }}>
                      {euros(l.mouvement)}
                    </span>
                    <span style={{ textAlign: "right" }}>
                      {l.lettrage ? (
                        <span
                          onClick={() => delettrer(l.lettrage)}
                          style={{ color: "#4caf50", cursor: "pointer", fontSize: "13px" }}
                        >
                          {l.lettrage}
                        </span>
                      ) : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.7" }}>
              Cochez plusieurs lignes pour les lettrer ensemble — le bouton s active quand elles
              s annulent. Touchez une lettre verte pour delettrer le groupe.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
