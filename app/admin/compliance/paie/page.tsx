"use client";
import { useState, useEffect } from "react";

export default function PagePaie() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  // Tant que l utilisateur n a pas touche au net, c est nous qui le tenons a
  // jour. Des qu il y touche, il reprend la main et le controle d ecart
  // redevient utile : un bulletin peut porter une retenue que nous ignorons.
  const [netTouche, setNetTouche] = useState(false);

  // MEME PRINCIPE POUR LA REFERENCE. Elle se deduit du mois de la paie —
  // PAIE-2026-08 pour aout — et se met a jour quand la date change. Un
  // exemple fige comme PAIE-2026-03 se recopiait tel quel et datait
  // l ecriture de mars : le journal en devenait faux.
  const [refTouchee, setRefTouchee] = useState(false);

  const [f, setF] = useState<any>({
    date: new Date().toISOString().slice(0, 10),
    brut: "", cotisations_salariales: "", cotisations_patronales: "",
    impot_source: "", net_a_payer: "", effectif: "", reference: "",
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
      const r = await fetch("/api/compliance/paie?societe_id=" + dossier);
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
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };

  function nombre(v: any) {
    const n = Number(String(v || "0").replace(",", ".").replace(/\s/g, ""));
    return isNaN(n) ? 0 : n;
  }
  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }
  function virgule(n: number) {
    return (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
  }

  // La reference suit le format deja en base : PAIE-ANNEE-MOIS.
  function referenceDe(date: string): string {
    if (!date || date.length < 7) return "";
    return "PAIE-" + date.slice(0, 4) + "-" + date.slice(5, 7);
  }

  const referenceAuto = referenceDe(f.date);
  const referenceAffichee = refTouchee ? f.reference : referenceAuto;

  const brut = nombre(f.brut);
  const sal = nombre(f.cotisations_salariales);
  const pat = nombre(f.cotisations_patronales);
  const imp = nombre(f.impot_source);
  const netCalcule = Math.round((brut - sal - imp) * 100) / 100;

  // LE NET SE CALCULE : brut moins cotisations salariales moins prelevement
  // a la source. Le faire taper a la main, c est ouvrir la porte a une faute
  // de frappe qui desequilibre l ecriture.
  const netAffiche = netTouche ? f.net_a_payer : (brut > 0 ? virgule(netCalcule) : "");
  const netSaisi = nombre(netAffiche);

  const ecart = netSaisi > 0 ? Math.round((netCalcule - netSaisi) * 100) / 100 : 0;
  const juste = brut > 0 && (netSaisi === 0 || Math.abs(ecart) <= 0.02);
  const cout = Math.round((brut + pat) * 100) / 100;

  async function passer() {
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/paie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societe_id: dossier,
          ...f,
          reference: referenceAffichee,
          net_a_payer: netAffiche,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setNetTouche(false);
        setRefTouchee(false);
        setF({ ...f, brut: "", cotisations_salariales: "", cotisations_patronales: "", impot_source: "", net_a_payer: "", reference: "" });
        await charger();
      } else {
        setErreur(data.erreur || "Passage impossible.");
      }
    } catch (e: any) {
      setErreur("Passage impossible : " + String(e));
    }
    setOccupe(false);
  }

  const CHAMPS = [
    ["brut", "Salaire brut total", "3200,00"],
    ["cotisations_salariales", "Cotisations salariales", "704,00"],
    ["cotisations_patronales", "Cotisations patronales", "1280,00"],
    ["impot_source", "Prélèvement à la source", "0,00"],
  ];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Écritures de paie</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Le journal de paie du mois, passé en une fois
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

        {dossier && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Date de la paie</span>
                <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Effectif</span>
                <input value={f.effectif} onChange={(e) => setF({ ...f, effectif: e.target.value })} placeholder="3" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>
                  Référence {refTouchee ? "" : "· automatique"}
                </span>
                <input
                  value={referenceAffichee}
                  onChange={(e) => { setRefTouchee(true); setF({ ...f, reference: e.target.value }); }}
                  placeholder={referenceAuto}
                  style={{ ...CHAMP, color: refTouchee ? "#fff" : "#c8a96e" }}
                />
              </div>
            </div>

            {refTouchee && referenceAffichee !== referenceAuto && (
              <p style={{ margin: "-4px 0 12px" }}>
                <button
                  onClick={() => { setRefTouchee(false); setF({ ...f, reference: "" }); }}
                  style={{ background: "none", border: "none", color: "#c8a96e", fontSize: "13px", fontFamily: "Georgia,serif", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                >
                  Revenir à {referenceAuto}
                </button>
              </p>
            )}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {CHAMPS.map(function (c: any) {
                return (
                  <div key={c[0]} style={{ flex: "1 1 170px" }}>
                    <span style={LIBELLE}>{c[1]}</span>
                    <input
                      value={f[c[0]]}
                      onChange={(e) => setF({ ...f, [c[0]]: e.target.value })}
                      inputMode="decimal"
                      placeholder={c[2]}
                      style={{ ...CHAMP, textAlign: "right" }}
                    />
                  </div>
                );
              })}

              <div style={{ flex: "1 1 170px" }}>
                <span style={LIBELLE}>
                  Net à payer {netTouche ? "" : "· calculé"}
                </span>
                <input
                  value={netAffiche}
                  onChange={(e) => { setNetTouche(true); setF({ ...f, net_a_payer: e.target.value }); }}
                  inputMode="decimal"
                  placeholder="2496,00"
                  style={{ ...CHAMP, textAlign: "right", color: netTouche ? "#fff" : "#c8a96e" }}
                />
              </div>
            </div>

            {netTouche && (
              <p style={{ margin: "-4px 0 12px" }}>
                <button
                  onClick={() => { setNetTouche(false); setF({ ...f, net_a_payer: "" }); }}
                  style={{ background: "none", border: "none", color: "#c8a96e", fontSize: "13px", fontFamily: "Georgia,serif", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                >
                  Revenir au net calculé
                </button>
              </p>
            )}

            {brut > 0 && (
              <div style={{ background: juste ? "rgba(76,175,80,0.1)" : "rgba(232,163,61,0.1)", border: "1px solid " + (juste ? "rgba(76,175,80,0.4)" : "rgba(232,163,61,0.4)"), borderRadius: "10px", padding: "14px 16px", marginBottom: "14px" }}>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14.5px", margin: "0 0 6px", lineHeight: "1.7" }}>
                  Net calculé : <strong>{euros(netCalcule)}</strong>
                  {netTouche && netSaisi > 0 && !juste ? " — vous avez saisi " + euros(netSaisi) : ""}
                </p>
                <p style={{ color: juste ? "#4caf50" : "#e8a33d", fontSize: "14px", margin: "0 0 6px", fontWeight: "bold" }}>
                  {juste
                    ? "Le net tombe juste"
                    : "Écart de " + euros(Math.abs(ecart)) + " : une ligne du bulletin manque"}
                </p>
                <p style={{ color: "#c8a96e", fontSize: "15px", margin: 0 }}>
                  Coût total employeur : <strong>{euros(cout)}</strong>
                </p>
              </div>
            )}

            <button
              onClick={passer}
              disabled={occupe || !juste}
              style={{ background: occupe || !juste ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !juste ? "#8a8a8a" : "#050508", padding: "15px 30px", borderRadius: "8px", border: "none", cursor: occupe || !juste ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe ? "Passage de l'écriture…" : "Passer l'écriture de paie"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              L'écriture porte le brut et les charges patronales au débit, le net dû au personnel
              et les cotisations dues aux organismes au crédit.
            </p>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture…</p></div>
        ) : !d ? null : d.paies.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucune écriture de paie sur ce dossier.
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "24px 0 12px" }}>
              Paies déjà passées
            </h2>
            {d.paies.map(function (p: any) {
              return (
                <div key={p.ecriture_num} style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px" }}>
                        {p.ecriture_num} · {new Date(p.date).toLocaleDateString("fr-FR")}
                      </p>
                      <h3 style={{ color: "#fff", fontSize: "15.5px", margin: 0 }}>{p.libelle}</h3>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>
                      {euros(p.brut)} de brut
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
