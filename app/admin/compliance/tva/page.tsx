"use client";
import { useState, useEffect } from "react";

export default function PageTVA() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [mois, setMois] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

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
  }, [dossier, mois]);

  async function charger() {
    setChargement(true);
    setErreur("");
    setD(null);
    try {
      const r = await fetch(
        "/api/compliance/tva?societe_id=" + dossier + (mois ? "&mois=" + mois : "")
      );
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function liquider() {
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/ecritures-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, type: "tva", mois: mois }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        await charger();
      } else {
        setErreur(data.erreur || "Liquidation impossible.");
      }
    } catch (e: any) {
      setErreur("Liquidation impossible : " + String(e));
    }
    setOccupe(false);
  }

  function decaler(pas: number) {
    const b = mois && /^\d{4}-\d{2}$/.test(mois)
      ? mois
      : (d && d.periode ? String(d.periode.debut).slice(0, 7) : "");
    if (!b) return;
    const a = parseInt(b.slice(0, 4), 10);
    const m = parseInt(b.slice(5, 7), 10);
    const s = new Date(Date.UTC(a, m - 1 + pas, 1));
    setMois(s.getUTCFullYear() + "-" + String(s.getUTCMonth() + 1).padStart(2, "0"));
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  function Ligne({ nom, montant, sens, fort }: any) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: "12px" }}>
        <span style={{ color: fort ? "#fff" : "rgba(255,255,255,0.72)", fontSize: fort ? "15.5px" : "14.5px", fontWeight: fort ? "bold" : "normal", lineHeight: "1.6" }}>{nom}</span>
        <span style={{ color: fort ? "#c8a96e" : "rgba(255,255,255,0.85)", fontSize: fort ? "16px" : "14.5px", fontWeight: fort ? "bold" : "normal", whiteSpace: "nowrap" }}>
          {sens === "moins" ? "− " : ""}{euros(montant)}
        </span>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Déclaration de TVA</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Calculée depuis les écritures du dossier
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
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Calcul en cours...</p></div>
        ) : !d ? null : d.declaration === null ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>{d.note}</p>
          </div>
        ) : (
          <>
            {d.formulaire === "CA3" && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "18px", flexWrap: "wrap" }}>
                <button onClick={() => decaler(-1)} style={BOUTON}>← mois précédent</button>
                <span style={{ color: "#c8a96e", fontSize: "17px", fontWeight: "bold" }}>{d.periode.libelle}</span>
                <button onClick={() => decaler(1)} style={BOUTON}>mois suivant →</button>
              </div>
            )}

            <div style={{ ...CARTE, border: "2px solid " + (d.tva.a_decaisser > 0 ? "rgba(232,163,61,0.5)" : "rgba(76,175,80,0.5)") }}>
              <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "2px", margin: "0 0 6px" }}>
                {d.formulaire} · {d.dossier.raison_sociale}
                {d.dossier.siren ? " · SIREN " + d.dossier.siren : ""}
              </p>
              <p style={{ color: d.tva.a_decaisser > 0 ? "#e8a33d" : "#4caf50", fontSize: "32px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(d.tva.a_decaisser > 0 ? d.tva.a_decaisser : d.tva.credit_a_reporter)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>
                {d.tva.a_decaisser > 0
                  ? "TVA à décaisser pour " + d.periode.libelle
                  : "Crédit de TVA à reporter"}
              </p>
            </div>

            <div style={CARTE}>
              <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 10px" }}>Le détail</h2>
              <Ligne nom="TVA collectée sur les ventes" montant={d.tva.collectee} />
              {d.tva.intracommunautaire_due > 0 && (
                <Ligne nom="TVA intracommunautaire due" montant={d.tva.intracommunautaire_due} />
              )}
              <Ligne nom="TVA déductible sur biens et services" montant={d.tva.deductible_biens_services} sens="moins" />
              <Ligne nom="TVA déductible sur immobilisations" montant={d.tva.deductible_immobilisations} sens="moins" />
              {d.tva.credit_anterieur_reporte > 0 && (
                <Ligne nom="Crédit antérieur reporté" montant={d.tva.credit_anterieur_reporte} sens="moins" />
              )}
              <Ligne
                nom={d.tva.a_decaisser > 0 ? "TVA À DÉCAISSER" : "CRÉDIT À REPORTER"}
                montant={d.tva.a_decaisser > 0 ? d.tva.a_decaisser : d.tva.credit_a_reporter}
                fort
              />
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.75" }}>
                Bases lues : {euros(d.bases.produits_ht)} de produits,{" "}
                {euros(d.bases.charges_et_immobilisations_ht)} de charges et immobilisations.
              </p>
            </div>

            {d.tva.a_decaisser > 0 && (
              <div style={{ ...CARTE, border: d.controle.liquidation_passee ? "1px solid rgba(76,175,80,0.4)" : "1px solid rgba(232,163,61,0.45)" }}>
                <p style={{ color: d.controle.liquidation_passee ? "#4caf50" : "#e8a33d", fontSize: "14.5px", margin: "0 0 12px", lineHeight: "1.8" }}>
                  {d.controle.liquidation_passee
                    ? "Écriture de liquidation passée : le compte 445510 porte bien " + euros(d.controle.solde_compte_445510) + "."
                    : "L'écriture de liquidation n'a pas été passée. Le compte 445510 porte "
                      + euros(d.controle.solde_compte_445510) + " alors que le calcul donne "
                      + euros(d.tva.a_decaisser) + "."}
                </p>

                {!d.controle.liquidation_passee && (
                  <button
                    onClick={liquider}
                    disabled={occupe}
                    style={{ background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                  >
                    {occupe ? "Passage de l'écriture..." : "Passer l'écriture de liquidation"}
                  </button>
                )}
              </div>
            )}

            {d.detail_comptes.length > 0 && (
              <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2.2fr 1fr 1fr", background: "rgba(200,169,110,0.12)", padding: "12px 16px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
                  <span>Compte</span><span>Libellé</span>
                  <span style={{ textAlign: "right" }}>Débit</span>
                  <span style={{ textAlign: "right" }}>Crédit</span>
                </div>
                {d.detail_comptes.map(function (c: any) {
                  return (
                    <div key={c.compte} style={{ display: "grid", gridTemplateColumns: "1fr 2.2fr 1fr 1fr", padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)" }}>
                      <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{c.compte}</span>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{c.libelle}</span>
                      <span style={{ textAlign: "right" }}>{c.debit > 0 ? euros(c.debit) : ""}</span>
                      <span style={{ textAlign: "right" }}>{c.credit > 0 ? euros(c.credit) : ""}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ ...CARTE, background: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.35)" }}>
              <p style={{ color: "#e8a33d", fontSize: "14px", margin: 0, lineHeight: "1.8" }}>{d.avertissement}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
