"use client";
import { useState, useEffect } from "react";

export default function PageLiasse2050() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
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
  }, [dossier]);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/liasse-2050?societe_id=" + dossier);
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

  function euros(n: any) {
    const v = Number(n) || 0;
    if (v === 0) return "";
    return v.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  }

  function Detail({ c }: any) {
    if (!(ouvert[c.code] === true) || !c.comptes || c.comptes.length === 0) return null;
    return (
      <>
        {c.comptes.map(function (x: any, i: number) {
          return (
            <div key={i} style={{ padding: "6px 14px 6px 30px", background: "rgba(200,169,110,0.06)", fontSize: "12.5px", color: "rgba(255,255,255,0.6)", display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <span><span style={{ fontFamily: "monospace" }}>{x.compte}</span> {x.libelle}</span>
              <span>{euros(x.montant)}</span>
            </div>
          );
        })}
      </>
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
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Liasse 2050 · reel normal</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Le bilan developpe, en brut, amortissements et net
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
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Ventilation en cours...</p></div>
        ) : !d ? null : (
          <>
            <div style={{ ...CARTE, border: "2px solid " + (d.pret_pour_edi ? "rgba(76,175,80,0.5)" : "rgba(232,163,61,0.5)") }}>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 6px" }}>
                {d.dossier.raison_sociale}
                {d.dossier.siren ? " · SIREN " + d.dossier.siren : ""} · exercice du{" "}
                {new Date(d.periode.debut).toLocaleDateString("fr-FR")} au{" "}
                {new Date(d.periode.fin).toLocaleDateString("fr-FR")}
              </p>
              <p style={{ color: d.pret_pour_edi ? "#4caf50" : "#e8a33d", fontSize: "17px", fontWeight: "bold", margin: "0 0 10px" }}>
                {d.pret_pour_edi ? "Liasse coherente" : "La liasse ne tombe pas juste"}
              </p>
              {d.controles.map(function (c: any, i: number) {
                return (
                  <p key={i} style={{ color: c.ok ? "rgba(255,255,255,0.6)" : "#e8836a", fontSize: "13.5px", margin: "0 0 4px", lineHeight: "1.7" }}>
                    {c.ok ? "· " : "✕ "}{c.nom} — {c.detail}
                  </p>
                );
              })}
            </div>

            <div style={{ ...CARTE, background: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.35)" }}>
              <p style={{ color: "#e8a33d", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
                Cette presentation est celle du reel normal. Si votre dossier releve du reel
                simplifie, c est la liasse 2033 qu il faut deposer.
              </p>
            </div>

            <h2 style={{ color: "#fff", fontSize: "19px", margin: "24px 0 12px" }}>2050 · Bilan actif</h2>
            <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "0.5fr 1.9fr 1fr 1fr 1fr", background: "rgba(200,169,110,0.12)", padding: "10px 14px", fontSize: "11.5px", color: "#c8a96e", fontWeight: "bold" }}>
                <span>Case</span><span>Poste</span>
                <span style={{ textAlign: "right" }}>Brut</span>
                <span style={{ textAlign: "right" }}>Amort.</span>
                <span style={{ textAlign: "right" }}>Net</span>
              </div>
              {d.bilan_actif.lignes.map(function (c: any) {
                const vide = c.brut === 0 && c.amortissements === 0;
                return (
                  <div key={c.code}>
                    <div
                      onClick={() => c.comptes.length > 0 && setOuvert({ ...ouvert, [c.code]: !ouvert[c.code] })}
                      style={{ display: "grid", gridTemplateColumns: "0.5fr 1.9fr 1fr 1fr 1fr", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "rgba(255,255,255,0.8)", cursor: c.comptes.length > 0 ? "pointer" : "default" }}
                    >
                      <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{c.code}</span>
                      <span style={{ color: vide ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)" }}>{c.libelle}</span>
                      <span style={{ textAlign: "right" }}>{euros(c.brut) || "—"}</span>
                      <span style={{ textAlign: "right", color: "#e8a33d" }}>{euros(c.amortissements) || "—"}</span>
                      <span style={{ textAlign: "right", color: "#fff" }}>{euros(c.net) || "—"}</span>
                    </div>
                    <Detail c={c} />
                  </div>
                );
              })}
              <div style={{ display: "grid", gridTemplateColumns: "0.5fr 1.9fr 1fr 1fr 1fr", padding: "13px 14px", borderTop: "1px solid rgba(200,169,110,0.35)", background: "rgba(200,169,110,0.12)", fontSize: "13.5px", color: "#c8a96e", fontWeight: "bold" }}>
                <span></span><span>TOTAL ACTIF</span>
                <span style={{ textAlign: "right" }}>{euros(d.bilan_actif.total_brut)}</span>
                <span style={{ textAlign: "right" }}>{euros(d.bilan_actif.total_amortissements)}</span>
                <span style={{ textAlign: "right" }}>{euros(d.bilan_actif.total_net)}</span>
              </div>
            </div>

            <h2 style={{ color: "#fff", fontSize: "19px", margin: "24px 0 12px" }}>2051 · Bilan passif</h2>
            <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
              {d.bilan_passif.lignes.map(function (c: any) {
                return (
                  <div key={c.code}>
                    <div
                      onClick={() => c.comptes.length > 0 && setOuvert({ ...ouvert, [c.code]: !ouvert[c.code] })}
                      style={{ display: "grid", gridTemplateColumns: "0.5fr 2.9fr 1.2fr", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "rgba(255,255,255,0.8)", cursor: c.comptes.length > 0 ? "pointer" : "default" }}
                    >
                      <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{c.code}</span>
                      <span style={{ color: c.montant === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)" }}>{c.libelle}</span>
                      <span style={{ textAlign: "right" }}>{euros(c.montant) || "—"}</span>
                    </div>
                    <Detail c={c} />
                  </div>
                );
              })}
              <div style={{ display: "grid", gridTemplateColumns: "0.5fr 2.9fr 1.2fr", padding: "13px 14px", borderTop: "1px solid rgba(200,169,110,0.35)", background: "rgba(200,169,110,0.12)", fontSize: "13.5px", color: "#c8a96e", fontWeight: "bold" }}>
                <span></span><span>TOTAL PASSIF</span>
                <span style={{ textAlign: "right" }}>{euros(d.bilan_passif.total)}</span>
              </div>
            </div>

            <h2 style={{ color: "#fff", fontSize: "19px", margin: "24px 0 12px" }}>
              2052 · Compte de resultat
            </h2>
            <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
              {d.compte_resultat.lignes.map(function (c: any) {
                return (
                  <div key={c.code}>
                    <div
                      onClick={() => c.comptes.length > 0 && setOuvert({ ...ouvert, [c.code]: !ouvert[c.code] })}
                      style={{ display: "grid", gridTemplateColumns: "0.5fr 2.9fr 1.2fr", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "rgba(255,255,255,0.8)", cursor: c.comptes.length > 0 ? "pointer" : "default" }}
                    >
                      <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{c.code}</span>
                      <span style={{ color: c.montant === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)" }}>
                        {c.libelle}
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11.5px" }}>
                          {" "}· {c.sens === "credit" ? "produit" : "charge"}
                        </span>
                      </span>
                      <span style={{ textAlign: "right", color: c.sens === "credit" ? "#4caf50" : "rgba(255,255,255,0.85)" }}>
                        {euros(c.montant) || "—"}
                      </span>
                    </div>
                    <Detail c={c} />
                  </div>
                );
              })}
              <div style={{ display: "grid", gridTemplateColumns: "0.5fr 2.9fr 1.2fr", padding: "13px 14px", borderTop: "1px solid rgba(200,169,110,0.35)", background: "rgba(200,169,110,0.12)", fontSize: "13.5px", color: "#c8a96e", fontWeight: "bold" }}>
                <span></span>
                <span>RESULTAT DE L EXERCICE</span>
                <span style={{ textAlign: "right", color: d.compte_resultat.resultat >= 0 ? "#4caf50" : "#e8836a" }}>
                  {euros(d.compte_resultat.resultat) || "0,00"}
                </span>
              </div>
            </div>

            {d.orphelins.length > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)", marginTop: "18px" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", fontWeight: "bold", margin: "0 0 10px" }}>
                  {d.orphelins.length} compte(s) ne rentrent dans aucune case
                </p>
                {d.orphelins.map(function (o: any, i: number) {
                  return (
                    <p key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", margin: "0 0 4px" }}>
                      <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{o.compte}</span>{" "}
                      {o.libelle} · {euros(o.solde)}
                    </p>
                  );
                })}
              </div>
            )}

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "16px 0 0", lineHeight: "1.7" }}>
              {d.avertissement}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
