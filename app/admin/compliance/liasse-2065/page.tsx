"use client";
import { useState, useEffect } from "react"; 

export default function PageLiasse2065() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [calcul, setCalcul] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");

  const [reint, setReint] = useState<any>({});
  const [ded, setDed] = useState<any>({});
  const [deficit, setDeficit] = useState("");
  const [tauxReduit, setTauxReduit] = useState(true);

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
    setCalcul(null);
    try {
      const r = await fetch("/api/compliance/liasse-2065?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) {
        setD(data);
        const ri: any = {};
        for (const c of data.reintegrations) ri[c.code] = c.propose > 0 ? String(c.propose) : "";
        setReint(ri);
        setDed({});
        setDeficit(data.deficit_anterieur_propose > 0 ? String(data.deficit_anterieur_propose) : "");
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function calculer() {
    if (!d) return;
    setOccupe(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/liasse-2065", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultat_comptable: d.resultat_comptable,
          reintegrations: d.reintegrations.map(function (c: any) {
            return { code: c.code, montant: reint[c.code] || 0 };
          }),
          deductions: d.deductions.map(function (c: any) {
            return { code: c.code, montant: ded[c.code] || 0 };
          }),
          deficit_impute: deficit,
          deficit_anterieur: d.deficit_anterieur_propose,
          taux_reduit: tauxReduit,
        }),
      });
      const data = await r.json();
      if (data.ok) setCalcul(data);
      else setErreur(data.erreur || "Calcul impossible.");
    } catch (e: any) {
      setErreur("Calcul impossible : " + String(e));
    }
    setOccupe(false);
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  function Ligne({ c, valeur, onChange }: any) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
        <span style={{ color: "rgba(255,255,255,0.78)", fontSize: "14px", flex: "1 1 220px" }}>
          <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{c.code}</span> {c.libelle}
          {c.propose > 0 ? (
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px" }}>
              {" "}· lu en comptabilite : {euros(c.propose)}
            </span>
          ) : null}
        </span>
        <input
          value={valeur || ""}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          placeholder="0,00"
          style={{ ...CHAMP, width: "150px", textAlign: "right", padding: "9px 11px" }}
        />
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
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Liasse 2065 · impot sur les societes</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Du resultat comptable au resultat fiscal, puis a l impot
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

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture...</p></div>
        ) : !d ? null : (
          <>
            {!d.soumis_is && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.45)" }}>
                <p style={{ color: "#e8a33d", fontSize: "14.5px", margin: 0, lineHeight: "1.8" }}>
                  Ce dossier n est pas marque a l impot sur les societes. La 2065 ne s applique
                  qu aux societes qui y sont soumises.
                </p>
              </div>
            )}

            <div style={{ ...CARTE, border: "2px solid rgba(200,169,110,0.45)" }}>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 6px" }}>
                {d.dossier.raison_sociale}
                {d.dossier.siren ? " · SIREN " + d.dossier.siren : ""} · exercice du{" "}
                {new Date(d.periode.debut).toLocaleDateString("fr-FR")} au{" "}
                {new Date(d.periode.fin).toLocaleDateString("fr-FR")}
              </p>
              <p style={{ color: d.resultat_comptable >= 0 ? "#4caf50" : "#e8836a", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(d.resultat_comptable)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>
                Resultat comptable · {euros(d.produits)} de produits, {euros(d.charges)} de charges
              </p>
            </div>

            <div style={CARTE}>
              <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 4px" }}>Reintegrations</h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 10px", lineHeight: "1.7" }}>
                Ce qui a ete deduit en comptabilite mais ne l est pas fiscalement.
              </p>
              {d.reintegrations.map(function (c: any) {
                return (
                  <Ligne key={c.code} c={c} valeur={reint[c.code]}
                    onChange={(v: string) => setReint({ ...reint, [c.code]: v })} />
                );
              })}
            </div>

            <div style={CARTE}>
              <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 4px" }}>Deductions</h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 10px", lineHeight: "1.7" }}>
                Ce qui a ete impose en comptabilite mais ne l est pas fiscalement.
              </p>
              {d.deductions.map(function (c: any) {
                return (
                  <Ligne key={c.code} c={c} valeur={ded[c.code]}
                    onChange={(v: string) => setDed({ ...ded, [c.code]: v })} />
                );
              })}
            </div>

            <div style={CARTE}>
              <span style={LIBELLE}>Deficits anterieurs a imputer</span>
              <input
                value={deficit}
                onChange={(e) => setDeficit(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                style={{ ...CHAMP, textAlign: "right", marginBottom: "12px" }}
              />
              {d.deficit_anterieur_propose > 0 && (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 12px" }}>
                  Reports anterieurs lus en comptabilite : {euros(d.deficit_anterieur_propose)}
                </p>
              )}

              <div
                onClick={() => setTauxReduit(!tauxReduit)}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", background: tauxReduit ? "rgba(200,169,110,0.14)" : "rgba(255,255,255,0.04)", border: tauxReduit ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.12)" }}
              >
                <span style={{ width: "22px", height: "22px", flexShrink: 0, borderRadius: "5px", background: tauxReduit ? "#c8a96e" : "transparent", border: tauxReduit ? "2px solid #c8a96e" : "2px solid #888", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px" }}>
                  {tauxReduit ? "✓" : ""}
                </span>
                <span style={{ color: "rgba(255,255,255,0.82)", fontSize: "14.5px", lineHeight: "1.6" }}>
                  La societe remplit les conditions du taux reduit de 15 %
                </span>
              </div>
            </div>

            <button
              onClick={calculer}
              disabled={occupe}
              style={{ background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "15px 30px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%", marginBottom: "16px" }}
            >
              {occupe ? "Calcul..." : "Calculer l impot"}
            </button>

            {calcul && (
              <div style={{ ...CARTE, border: "2px solid rgba(200,169,110,0.5)" }}>
                <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(calcul.calcul.is_total)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0 0 14px" }}>
                  {calcul.message}
                </p>

                {[
                  ["Resultat comptable", calcul.calcul.resultat_comptable],
                  ["Reintegrations", calcul.calcul.total_reintegrations],
                  ["Deductions", -calcul.calcul.total_deductions],
                  ["Resultat fiscal avant deficit", calcul.calcul.resultat_fiscal_avant_deficit],
                  ["Deficit impute", -calcul.calcul.deficit_impute],
                  ["Base imposable", calcul.calcul.base_imposable],
                  ["IS a 15 %", calcul.calcul.is_15],
                  ["IS a 25 %", calcul.calcul.is_25],
                ].map(function (l: any, i: number) {
                  const fort = l[0] === "Base imposable";
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: fort ? "15px" : "14px" }}>
                      <span style={{ color: fort ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: fort ? "bold" : "normal" }}>{l[0]}</span>
                      <span style={{ color: fort ? "#c8a96e" : "rgba(255,255,255,0.85)", fontWeight: fort ? "bold" : "normal" }}>{euros(l[1])}</span>
                    </div>
                  );
                })}

                {calcul.calcul.deficit_reportable > 0 && (
                  <p style={{ color: "#e8a33d", fontSize: "14px", margin: "12px 0 0" }}>
                    Deficit reportable sur les exercices suivants : {euros(calcul.calcul.deficit_reportable)}
                  </p>
                )}

                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.8" }}>
                  {calcul.avertissement}
                </p>
              </div>
            )}

            <div style={{ ...CARTE, background: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.35)" }}>
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
