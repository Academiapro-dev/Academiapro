"use client";
import { useState, useEffect } from "react";

export default function PageProvisions() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [reprise, setReprise] = useState<any>({});

  const [f, setF] = useState<any>({
    type: "creance_client", tiers: "", reference: "",
    montant_base: "", taux_depreciation: "100",
    date_constitution: new Date().toISOString().slice(0, 10), motif: "",
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
      const r = await fetch("/api/compliance/provisions?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function envoyer(corps: any, quoi: string) {
    setOccupe(quoi);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/provisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, ...corps }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setFormulaire(false);
        setReprise({});
        setF({ ...f, tiers: "", reference: "", montant_base: "", motif: "" });
        await charger();
      } else {
        setErreur(data.erreur || "Operation impossible.");
      }
    } catch (e: any) {
      setErreur("Operation impossible : " + String(e));
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

  const base = Number(String(f.montant_base || "").replace(",", ".")) || 0;
  const taux = Number(String(f.taux_depreciation || "").replace(",", ".")) || 0;
  const calcule = Math.round(base * (taux / 100) * 100) / 100;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Provisions et depreciations</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Ce qui est douteux ne doit pas rester compte a sa valeur nominale
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
            {formulaire ? "Annuler" : "Constituer une provision"}
          </button>
        )}

        {formulaire && d && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Nature de la provision</span>
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} style={CHAMP}>
              {d.types.map(function (t: any) {
                return <option key={t.code} value={t.code}>{t.nom}</option>;
              })}
            </select>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <span style={LIBELLE}>Tiers concerne</span>
                <input value={f.tiers} onChange={(e) => setF({ ...f, tiers: e.target.value })} placeholder="Dupont SARL" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <span style={LIBELLE}>Reference</span>
                <input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="FA-2026-018" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Date</span>
                <input type="date" value={f.date_constitution} onChange={(e) => setF({ ...f, date_constitution: e.target.value })} style={CHAMP} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Montant de base (HT)</span>
                <input value={f.montant_base} onChange={(e) => setF({ ...f, montant_base: e.target.value })} placeholder="1500,00" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Taux de depreciation (%)</span>
                <input value={f.taux_depreciation} onChange={(e) => setF({ ...f, taux_depreciation: e.target.value })} placeholder="100" style={CHAMP} />
              </div>
            </div>

            {calcule > 0 && (
              <p style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 12px" }}>
                Provision calculee : <strong>{euros(calcule)}</strong>
              </p>
            )}

            <span style={LIBELLE}>Motif</span>
            <textarea value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })} rows={2} placeholder="Relances restees sans reponse depuis six mois" style={CHAMP} />

            <button
              onClick={() => envoyer(f, "creation")}
              disabled={occupe !== "" || calcule <= 0}
              style={{ background: occupe !== "" || calcule <= 0 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "creation" ? "Constitution..." : "Constituer et passer l ecriture"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              Le montant de base se prend hors taxes : la TVA se recupere separement si la
              creance devient irrecouvrable.
            </p>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture...</p></div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "21px", fontWeight: "bold", margin: "0 0 4px" }}>{d.en_cours}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>En cours</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0 }}>
                <p style={{ color: "#e8a33d", fontSize: "21px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.montant_en_cours)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Montant provisionne</p>
              </div>
            </div>

            {d.provisions.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune provision sur ce dossier.
                </p>
              </div>
            ) : (
              d.provisions.map(function (p: any) {
                return (
                  <div key={p.id} style={{ ...CARTE, opacity: p.soldee ? 0.55 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px" }}>
                          {p.type_nom} · {new Date(p.date_constitution).toLocaleDateString("fr-FR")}
                          {p.ecriture_num ? " · " + p.ecriture_num : ""}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 4px" }}>
                          {p.tiers || p.reference || "Provision"}
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
                          Base {euros(p.montant_base)} · {p.taux_depreciation} %
                          {p.soldee ? " · REPRISE" : ""}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: p.soldee ? "rgba(255,255,255,0.4)" : "#e8a33d", fontSize: "18px", fontWeight: "bold", margin: "0 0 2px" }}>
                          {euros(p.montant_restant)}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>restant</p>
                      </div>
                    </div>

                    {p.motif && (
                      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", margin: "8px 0 0", lineHeight: "1.7" }}>
                        {p.motif}
                      </p>
                    )}

                    {!p.soldee && (
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginTop: "12px" }}>
                        <input
                          value={reprise[p.id] || ""}
                          onChange={(e) => setReprise({ ...reprise, [p.id]: e.target.value })}
                          placeholder={"Montant a reprendre (defaut : " + p.montant_restant.toFixed(2) + ")"}
                          style={{ ...CHAMP, flex: "1 1 200px", marginBottom: 0 }}
                        />
                        <button
                          onClick={() => envoyer({ action: "reprendre", id: p.id, montant: reprise[p.id] }, p.id)}
                          disabled={occupe !== ""}
                          style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                        >
                          {occupe === p.id ? "..." : "Reprendre"}
                        </button>
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
