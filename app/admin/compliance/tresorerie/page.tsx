"use client";
import { useState, useEffect } from "react";

// LE PREVISIONNEL DE TRESORERIE.
//
// 🚨 CE QUE CET ECRAN DOIT REPONDRE, ET RIEN D AUTRE : « est-ce que je
// pourrai payer mes salaires le mois prochain ? » C est la seule question
// qu un dirigeant pose vraiment, et aucun bilan n y repond.
//
// D OU LE CREUX EN HAUT DE PAGE. Le solde final n interesse personne : ce
// qui compte, c est le moment ou l on passe au plus bas, parce que c est la
// qu il faudra emprunter, relancer un client ou differer un paiement.
//
// ⚠️ LE CERTAIN ET L ESTIME NE SE MELANGENT PAS. Les factures et les dettes
// sont des faits ; les charges recurrentes sont une moyenne. L ecran les
// distingue — un previsionnel qui confond les deux fait prendre de mauvaises
// decisions, et c est le dirigeant qui paie l erreur.

export default function Tresorerie() {
  const [d, setD] = useState<any>(null);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [dossier, setDossier] = useState("");
  const [ouverte, setOuverte] = useState(0);

  useEffect(function () { charger(""); }, []);

  async function charger(id: string) {
    setCharge(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/tresorerie" + (id ? "?societe_id=" + id : ""), { cache: "no-store" });
      const data = await r.json();
      if (data.ok) {
        setD(data);
        if (data.dossier) setDossier(data.dossier.id);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  function jolieDate(x: any) {
    if (!x) return "";
    try {
      return new Date(x).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    } catch (e) { return ""; }
  }

  const OR = "#c8a96e";
  const BLEU = "#448aff";
  const VERT = "#00e676";
  const ORANGE = "#e8a33d";
  const ROUGE = "#e8836a";

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "30px 20px" };
  const CARTE: any = { background: "#1a1a2e", borderRadius: "10px", padding: "16px 18px", marginBottom: "12px", border: "1px solid rgba(200,169,110,0.15)" };
  const BOUTON: any = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,169,110,0.3)", color: OR, padding: "8px 15px", borderRadius: "18px", cursor: "pointer", fontSize: "12.5px", fontFamily: "Georgia,serif" };
  const CHAMP: any = { width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", fontSize: "14px", fontFamily: "Georgia,serif", boxSizing: "border-box" };

  const a = d && d.aujourd_hui ? d.aujourd_hui : null;
  const projection = d && d.projection ? d.projection : [];

  // L echelle de la courbe : du plus bas au plus haut, avec le zero visible.
  const soldes = projection.map(function (s: any) { return Number(s.solde) || 0; });
  const haut = Math.max.apply(null, soldes.concat([a ? a.tresorerie : 0, 0]));
  const bas = Math.min.apply(null, soldes.concat([a ? a.tresorerie : 0, 0]));
  const amplitude = Math.max(1, haut - bas);

  function hauteur(v: number) {
    return Math.round(((v - bas) / amplitude) * 100);
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        <a href="/admin/compliance/tableau-de-bord" style={{ color: OR, fontSize: "13px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "20px 0 8px" }}>
          TRÉSORERIE
        </p>
        <h1 style={{ color: "#fff", fontSize: "28px", margin: "0 0 6px" }}>Prévisionnel</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 20px" }}>
          Les douze prochaines semaines, d'après ce qui est engagé
        </p>

        {erreur && (
          <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: ROUGE, fontSize: "13px" }}>
            {erreur}
          </div>
        )}

        {d && d.tous && d.tous.length > 1 && (
          <div style={{ marginBottom: "18px" }}>
            <label style={{ color: OR, fontSize: "12px", display: "block", marginBottom: "6px" }}>Dossier</label>
            <select value={dossier} onChange={(e) => { setDossier(e.target.value); charger(e.target.value); }} style={CHAMP}>
              {d.tous.map(function (s: any) {
                return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
              })}
            </select>
          </div>
        )}

        {charge && !d ? (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Calcul en cours…</p>
        ) : !d || !a ? null : (
          <>
            {/* 🚨 L ALERTE PASSE AVANT TOUT LE RESTE. */}
            {d.creux ? (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.6)", background: "rgba(232,131,106,0.08)" }}>
                <div style={{ color: ROUGE, fontSize: "12px", letterSpacing: "2px", marginBottom: "8px" }}>
                  ⚠️ TRÉSORERIE NÉGATIVE PRÉVUE
                </div>
                <p style={{ color: "#fff", fontSize: "17px", lineHeight: "1.7", margin: "0 0 6px", fontWeight: "bold" }}>
                  Semaine du {jolieDate(d.creux.date)} : {euros(d.creux.solde)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
                  Il reste {d.creux.semaine - 1} semaine(s) pour agir : relancer un client,
                  différer un paiement, ou prévoir un financement.
                </p>
              </div>
            ) : d.plus_bas ? (
              <div style={{ ...CARTE, border: "1px solid rgba(0,230,118,0.4)" }}>
                <div style={{ color: VERT, fontSize: "12px", letterSpacing: "2px", marginBottom: "8px" }}>
                  POINT LE PLUS BAS
                </div>
                <p style={{ color: "#fff", fontSize: "17px", lineHeight: "1.7", margin: "0 0 6px", fontWeight: "bold" }}>
                  Semaine du {jolieDate(d.plus_bas.date)} : {euros(d.plus_bas.solde)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: 0 }}>
                  La trésorerie reste positive sur tout le trimestre.
                </p>
              </div>
            ) : null}

            {/* ---- LA SITUATION D AUJOURD HUI ---- */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", margin: "18px 0" }}>
              {[
                { v: euros(a.tresorerie), t: "En banque aujourd'hui", c: a.tresorerie >= 0 ? OR : ROUGE },
                { v: euros(a.creances), t: "Ce qu'on vous doit", c: VERT },
                { v: euros(a.dettes), t: "Ce que vous devez", c: ORANGE },
                { v: euros(a.tva_a_decaisser), t: "TVA à décaisser", c: ORANGE },
                { v: euros(d.solde_final), t: "Dans 12 semaines", c: d.solde_final >= 0 ? VERT : ROUGE },
              ].map(function (x) {
                return (
                  <div key={x.t} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: x.c }}>{x.v}</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "5px" }}>{x.t}</div>
                  </div>
                );
              })}
            </div>

            {/* ---- LA COURBE ---- */}
            <div style={{ ...CARTE, padding: "20px 18px" }}>
              <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "16px" }}>
                LES DOUZE PROCHAINES SEMAINES
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "160px", borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: "2px", position: "relative" }}>
                {/* La ligne du zero : un solde negatif se voit d un coup d oeil. */}
                {bas < 0 && (
                  <div style={{
                    position: "absolute", left: 0, right: 0,
                    bottom: hauteur(0) + "%",
                    borderTop: "1px dashed rgba(232,131,106,0.5)",
                    zIndex: 1,
                  }} />
                )}

                {projection.map(function (s: any) {
                  const h = Math.max(2, hauteur(s.solde));
                  const negatif = s.solde < 0;
                  const actif = ouverte === s.rang;
                  return (
                    <div
                      key={s.rang}
                      onClick={() => setOuverte(actif ? 0 : s.rang)}
                      style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", cursor: "pointer" }}
                    >
                      <div style={{
                        height: h + "%",
                        background: negatif ? ROUGE : (actif ? OR : "rgba(200,169,110,0.55)"),
                        borderRadius: "3px 3px 0 0",
                        transition: "background 0.2s",
                      }} />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                {projection.map(function (s: any) {
                  return (
                    <div key={s.rang} style={{ flex: 1, textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "9.5px" }}>
                      {jolieDate(s.debut)}
                    </div>
                  );
                })}
              </div>

              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.7", margin: "14px 0 0" }}>
                Touchez une semaine pour voir ce qui s'y passe.
              </p>
            </div>

            {/* ---- LE DETAIL DE LA SEMAINE CHOISIE ---- */}
            {ouverte > 0 && (function () {
              const s = projection.filter(function (x: any) { return x.rang === ouverte; })[0];
              if (!s) return null;
              return (
                <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.45)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                    <span style={{ color: OR, fontSize: "12px", letterSpacing: "2px" }}>
                      SEMAINE DU {jolieDate(s.debut).toUpperCase()}
                    </span>
                    <span style={{ color: s.solde >= 0 ? VERT : ROUGE, fontSize: "16px", fontWeight: "bold" }}>
                      {euros(s.solde)}
                    </span>
                  </div>

                  {s.details.length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                      Aucun mouvement prévu cette semaine.
                    </p>
                  ) : (
                    s.details.map(function (x: any, i: number) {
                      const entree = x.sens === "entree";
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "13px" }}>
                          <span style={{ color: "rgba(255,255,255,0.8)" }}>
                            {x.libelle}
                            {x.echu && <span style={{ color: ORANGE }}> · échu</span>}
                            {!x.certain && <span style={{ color: "rgba(255,255,255,0.35)" }}> · estimation</span>}
                          </span>
                          <span style={{ color: entree ? VERT : ROUGE, fontWeight: "bold", whiteSpace: "nowrap" }}>
                            {entree ? "+" : "−"} {euros(x.montant)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}

            {/* ---- CE QUI EST SUPPOSÉ ---- */}
            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)" }}>
              <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "10px" }}>
                CE QUI EST CERTAIN, CE QUI EST ESTIMÉ
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: "1.85", margin: "0 0 10px" }}>
                <strong style={{ color: VERT }}>Certain</strong> — vos factures émises avec leur
                échéance réelle, les créances et les dettes de la comptabilité, la TVA à
                décaisser. Ce sont des engagements, pas des hypothèses.
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: "1.85", margin: 0 }}>
                <strong style={{ color: ORANGE }}>Estimé</strong> — les charges qui reviennent
                chaque mois : {euros(d.hypotheses.charge_mensuelle_estimee)}, moyenne calculée sur{" "}
                {d.hypotheses.mois_observes} mois de loyers, salaires, assurances, abonnements et
                frais bancaires.
              </p>
            </div>

            <button onClick={() => charger(dossier)} style={{ ...BOUTON, width: "100%", padding: "12px", borderRadius: "8px" }}>
              🔄 Recalculer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
