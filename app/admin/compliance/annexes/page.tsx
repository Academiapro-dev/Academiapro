"use client";
import { useState, useEffect } from "react";

export default function PageAnnexes() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [vue, setVue] = useState("2033c");

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
      const r = await fetch("/api/compliance/annexes?societe_id=" + dossier);
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
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "9px 17px", borderRadius: "20px", cursor: "pointer", fontSize: "13.5px", fontFamily: "Georgia,serif" };

  function euros(n: any) {
    const v = Number(n) || 0;
    if (v === 0) return "";
    return v.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  }

  function onglet(cle: string, texte: string) {
    const actif = vue === cle;
    return (
      <button
        onClick={() => setVue(cle)}
        style={{ ...BOUTON, background: actif ? "#c8a96e" : "none", color: actif ? "#050508" : "#c8a96e", border: actif ? "none" : BOUTON.border, fontWeight: actif ? "bold" : "normal" }}
      >
        {texte}
      </button>
    );
  }

  function Total({ texte, valeur }: any) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "rgba(200,169,110,0.12)", borderTop: "1px solid rgba(200,169,110,0.35)", fontSize: "14px", color: "#c8a96e", fontWeight: "bold" }}>
        <span>{texte}</span>
        <span>{euros(valeur) || "0,00"}</span>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Annexes de la liasse</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Immobilisations, provisions, echeances des creances et des dettes
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
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Preparation des annexes...</p></div>
        ) : !d ? null : (
          <>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 14px" }}>
              {d.dossier.raison_sociale} · exercice {d.annee} · du{" "}
              {new Date(d.periode.debut).toLocaleDateString("fr-FR")} au{" "}
              {new Date(d.periode.fin).toLocaleDateString("fr-FR")}
            </p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
              {onglet("2033c", "2033-C · Immobilisations")}
              {onglet("2033d", "2033-D · Provisions")}
              {onglet("2057", "2057 · Echeances")}
            </div>

            {vue === "2033c" && (
              <>
                <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.45)" }}>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0, lineHeight: "1.9" }}>
                    Valeur brute a l ouverture : <strong>{euros(d.annexe_2033_c.brut_debut) || "0,00"}</strong><br />
                    Acquisitions de l exercice : <strong>{euros(d.annexe_2033_c.entrees) || "0,00"}</strong><br />
                    Cessions de l exercice : <strong>{euros(d.annexe_2033_c.sorties) || "0,00"}</strong><br />
                    Valeur brute a la cloture : <strong>{euros(d.annexe_2033_c.brut_fin) || "0,00"}</strong><br />
                    Amortissements cumules : <strong>{euros(d.annexe_2033_c.amort_fin) || "0,00"}</strong><br />
                    Dotations de l exercice : <strong style={{ color: "#c8a96e" }}>{euros(d.annexe_2033_c.dotations) || "0,00"}</strong>
                  </p>
                </div>

                {d.annexe_2033_c.biens.length === 0 ? (
                  <div style={CARTE}>
                    <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                      Aucune immobilisation sur ce dossier.
                    </p>
                  </div>
                ) : (
                  <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", background: "rgba(200,169,110,0.12)", padding: "10px 14px", fontSize: "11.5px", color: "#c8a96e", fontWeight: "bold" }}>
                      <span>Bien</span>
                      <span style={{ textAlign: "right" }}>Brut</span>
                      <span style={{ textAlign: "right" }}>Amort. debut</span>
                      <span style={{ textAlign: "right" }}>Dotation</span>
                      <span style={{ textAlign: "right" }}>Valeur nette</span>
                    </div>
                    {d.annexe_2033_c.biens.map(function (b: any, i: number) {
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "rgba(255,255,255,0.8)", opacity: b.sorti ? 0.5 : 1 }}>
                          <span>
                            {b.designation}
                            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11.5px" }}>
                              {" "}· {b.compte} · {b.mode} · {b.duree} ans{b.sorti ? " · sorti" : ""}
                            </span>
                          </span>
                          <span style={{ textAlign: "right" }}>{euros(b.valeur_brute)}</span>
                          <span style={{ textAlign: "right", color: "rgba(255,255,255,0.55)" }}>{euros(b.amort_debut)}</span>
                          <span style={{ textAlign: "right", color: "#c8a96e" }}>{euros(b.dotation)}</span>
                          <span style={{ textAlign: "right" }}>{euros(b.valeur_nette)}</span>
                        </div>
                      );
                    })}
                    <Total texte="TOTAL" valeur={d.annexe_2033_c.valeur_nette} />
                  </div>
                )}
              </>
            )}

            {vue === "2033d" && (
              <>
                <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.45)" }}>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0, lineHeight: "1.9" }}>
                    Provisions a l ouverture : <strong>{euros(d.annexe_2033_d.montant_debut) || "0,00"}</strong><br />
                    Dotations de l exercice : <strong style={{ color: "#c8a96e" }}>{euros(d.annexe_2033_d.dotations) || "0,00"}</strong><br />
                    Reprises de l exercice : <strong>{euros(d.annexe_2033_d.reprises) || "0,00"}</strong><br />
                    Provisions a la cloture : <strong>{euros(d.annexe_2033_d.montant_fin) || "0,00"}</strong>
                  </p>
                </div>

                {d.annexe_2033_d.provisions.length === 0 ? (
                  <div style={CARTE}>
                    <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                      Aucune provision sur ce dossier.
                    </p>
                  </div>
                ) : (
                  <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "rgba(200,169,110,0.12)", padding: "10px 14px", fontSize: "11.5px", color: "#c8a96e", fontWeight: "bold" }}>
                      <span>Provision</span>
                      <span style={{ textAlign: "right" }}>Ouverture</span>
                      <span style={{ textAlign: "right" }}>Dotation</span>
                      <span style={{ textAlign: "right" }}>Cloture</span>
                    </div>
                    {d.annexe_2033_d.provisions.map(function (p: any, i: number) {
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                          <span>
                            {p.tiers || p.type}
                            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11.5px" }}> · {p.compte}</span>
                          </span>
                          <span style={{ textAlign: "right", color: "rgba(255,255,255,0.55)" }}>{euros(p.montant_debut)}</span>
                          <span style={{ textAlign: "right", color: "#c8a96e" }}>{euros(p.dotation)}</span>
                          <span style={{ textAlign: "right" }}>{euros(p.montant_fin)}</span>
                        </div>
                      );
                    })}
                    <Total texte="TOTAL A LA CLOTURE" valeur={d.annexe_2033_d.montant_fin} />
                  </div>
                )}
              </>
            )}

            {vue === "2057" && (
              <>
                {d.annexe_2057.creances_anciennes > 0 && (
                  <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.45)" }}>
                    <p style={{ color: "#e8a33d", fontSize: "14.5px", margin: 0, lineHeight: "1.8" }}>
                      {d.annexe_2057.creances_anciennes} creance(s) datent de plus d un an. Elles
                      se declarent a part, et meritent une depreciation si le recouvrement est
                      douteux.
                    </p>
                  </div>
                )}

                <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: "18px 0 10px" }}>
                  Creances · {euros(d.annexe_2057.total_creances) || "0,00"}
                </h2>
                {d.annexe_2057.creances.length === 0 ? (
                  <div style={CARTE}>
                    <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                      Aucune creance non lettree.
                    </p>
                  </div>
                ) : (
                  <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden", marginBottom: "18px" }}>
                    {d.annexe_2057.creances.map(function (t: any, i: number) {
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "0.9fr 2fr 1fr 1fr", padding: "10px 14px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                          <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{t.compte}</span>
                          <span>{t.libelle}</span>
                          <span style={{ textAlign: "right", color: t.a_un_an_au_plus ? "rgba(255,255,255,0.5)" : "#e8a33d" }}>
                            {t.a_un_an_au_plus ? "moins d un an" : "plus d un an"}
                          </span>
                          <span style={{ textAlign: "right" }}>{euros(t.solde)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: "18px 0 10px" }}>
                  Dettes · {euros(d.annexe_2057.total_dettes) || "0,00"}
                </h2>
                {d.annexe_2057.dettes.length === 0 ? (
                  <div style={CARTE}>
                    <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                      Aucune dette non lettree.
                    </p>
                  </div>
                ) : (
                  <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                    {d.annexe_2057.dettes.map(function (t: any, i: number) {
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "0.9fr 2fr 1fr 1fr", padding: "10px 14px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                          <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{t.compte}</span>
                          <span>{t.libelle}</span>
                          <span style={{ textAlign: "right", color: t.a_un_an_au_plus ? "rgba(255,255,255,0.5)" : "#e8a33d" }}>
                            {t.a_un_an_au_plus ? "moins d un an" : "plus d un an"}
                          </span>
                          <span style={{ textAlign: "right" }}>{euros(-t.solde)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
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
