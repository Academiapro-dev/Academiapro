"use client";
import { useState, useEffect } from "react";

export default function PageDas2() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [annee, setAnnee] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<any>({});

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
  }, [dossier, annee]);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch(
        "/api/compliance/das2?societe_id=" + dossier + (annee ? "&year=" + annee : "")
      );
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  function decaler(pas: number) {
    const base = annee ? parseInt(annee, 10) : (d ? d.annee : new Date().getFullYear());
    setAnnee(String(base + pas));
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>DAS2 · honoraires verses</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Ce qui a ete verse a des tiers, par annee civile
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
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Analyse des versements...</p></div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "18px", flexWrap: "wrap" }}>
              <button onClick={() => decaler(-1)} style={BOUTON}>← {d.annee - 1}</button>
              <span style={{ color: "#c8a96e", fontSize: "18px", fontWeight: "bold" }}>
                Annee {d.annee}
              </span>
              <button onClick={() => decaler(1)} style={BOUTON}>{d.annee + 1} →</button>
            </div>

            <div style={{ ...CARTE, border: "2px solid rgba(200,169,110,0.45)" }}>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 6px" }}>
                {d.dossier.raison_sociale}
                {d.dossier.siren ? " · SIREN " + d.dossier.siren : " · SIREN manquant"}
              </p>
              <p style={{ color: "#fff", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(d.total_a_declarer)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                {d.nb_a_declarer} beneficiaire(s) a declarer
                {d.nb_sous_seuil > 0 ? " · " + d.nb_sous_seuil + " sous le seuil de " + euros(d.seuil) : ""}
              </p>
            </div>

            {d.nb_identification_incomplete > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.8" }}>
                  {d.nb_identification_incomplete} beneficiaire(s) a declarer ne sont pas
                  identifies precisement. Completez leur compte auxiliaire avant de deposer :
                  c est le premier motif de rejet.
                </p>
              </div>
            )}

            {d.beneficiaires.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun honoraire verse sur {d.annee}. Aucune DAS2 n est due.
                </p>
              </div>
            ) : (
              d.beneficiaires.map(function (b: any, i: number) {
                const estOuvert = ouvert[i] === true;
                return (
                  <div key={i} style={{ ...CARTE, opacity: b.a_declarer ? 1 : 0.55, border: b.a_declarer && b.identification_incomplete ? "1px solid rgba(232,131,106,0.4)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px" }}>
                          {b.beneficiaire}
                        </h3>
                        <p style={{ color: b.a_declarer ? (b.identification_incomplete ? "#e8836a" : "#4caf50") : "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {b.a_declarer
                            ? (b.identification_incomplete ? "A declarer · identite a completer" : "A declarer")
                            : "Sous le seuil"}
                          {b.identifiant ? " · " + b.identifiant : ""}
                          {" · " + b.lignes.length + " versement(s)"}
                        </p>
                      </div>
                      <span style={{ color: b.a_declarer ? "#c8a96e" : "rgba(255,255,255,0.4)", fontSize: "17px", fontWeight: "bold" }}>
                        {euros(b.montant)}
                      </span>
                    </div>

                    <button onClick={() => setOuvert({ ...ouvert, [i]: !estOuvert })} style={{ ...BOUTON, marginTop: "12px" }}>
                      {estOuvert ? "Masquer le detail" : "Voir les versements"}
                    </button>

                    {estOuvert && (
                      <div style={{ marginTop: "12px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", overflow: "hidden" }}>
                        {b.lignes.map(function (l: any, j: number) {
                          return (
                            <div key={j} style={{ display: "grid", gridTemplateColumns: "0.9fr 2.2fr 1fr", padding: "9px 12px", borderTop: j > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                              <span style={{ color: "rgba(255,255,255,0.5)" }}>
                                {new Date(l.date).toLocaleDateString("fr-FR")}
                              </span>
                              <span>
                                {l.libelle}
                                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11.5px" }}>
                                  {" "}· {l.compte}
                                </span>
                              </span>
                              <span style={{ textAlign: "right" }}>{euros(l.montant)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div style={{ ...CARTE, background: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.35)", marginTop: "20px" }}>
              <p style={{ color: "#e8a33d", fontSize: "14px", margin: 0, lineHeight: "1.8" }}>
                {d.avertissement}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
