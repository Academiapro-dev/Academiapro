"use client";
import { useState, useEffect } from "react";

// LA LIASSE 2035 (BNC) — 09/09. Meme ecran que la 2033 : ventilation,
// exercice precedent, controles. Voir la route.
export default function PageLiasse2035() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [detail, setDetail] = useState("");

  useEffect(function () {
    (async function () {
      try {
        const r = await fetch("/api/compliance/societes");
        const data = await r.json();
        if (data.ok) {
          setSocietes(data.societes || []);
          const p = new URLSearchParams(window.location.search).get("societe_id");
          if (p) setDossier(p); else if ((data.societes || []).length === 1) setDossier(data.societes[0].id);
        }
      } catch (e) {}
    })();
  }, []);
  useEffect(function () { if (dossier) charger(); }, [dossier]);

  async function charger() {
    setChargement(true); setErreur(""); setD(null);
    try {
      const r = await fetch("/api/compliance/liasse-2035?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data); else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
    setChargement(false);
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  function euros(n: any) { return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €"; }

  function bloc(titre: string, lignes: any[], total: { libelle: string; montant: number; precedent: number | null } | null) {
    return (
      <div style={CARTE}>
        <h3 style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 10px" }}>{titre}</h3>
        {lignes.map(function (l: any) {
          if (Math.abs(Number(l.montant) || 0) < 0.005 && (l.precedent === null || Math.abs(l.precedent) < 0.005)) return null;
          const ouvert = detail === l.code;
          return (
            <div key={l.code} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "6px 0" }}>
              <div onClick={() => setDetail(ouvert ? "" : l.code)} style={{ display: "flex", justifyContent: "space-between", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                <span style={{ color: "rgba(255,255,255,0.8)" }}><span style={{ color: "#c8a96e", fontSize: "12px" }}>{l.code}</span> {l.libelle}</span>
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: "#c8a96e" }}>{euros(l.montant)}</span>
                  {l.precedent !== null && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px" }}> · N-1 {euros(l.precedent)}</span>}
                </span>
              </div>
              {ouvert && (l.comptes || []).map(function (c: any) {
                return <p key={c.compte} style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", margin: "4px 0 0 18px" }}>{c.compte} {c.libelle} · {euros(c.montant)}</p>;
              })}
            </div>
          );
        })}
        {total && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontWeight: "bold", fontSize: "14px" }}>
            <span>{total.libelle}</span>
            <span style={{ color: "#c8a96e" }}>{euros(total.montant)}{total.precedent !== null ? <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: "normal", fontSize: "12.5px" }}> · N-1 {euros(total.precedent)}</span> : null}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/tableau-de-bord" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>← Retour aux outils</a>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>LIASSE FISCALE</p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Liasse 2035 — BNC</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>Déclaration contrôlée : recettes, dépenses, amortissements et résultat fiscal, ventilés depuis la comptabilité</p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={CHAMP}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) { return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>; })}
          </select>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}
        {chargement && <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Ventilation…</p></div>}

        {d && (
          <>
            <div style={{ ...CARTE, border: "2px solid " + (d.pret_pour_edi ? "#4caf50" : "#e8a33d") }}>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 6px" }}>
                {d.dossier.raison_sociale} · du {new Date(d.periode.debut).toLocaleDateString("fr-FR")} au {new Date(d.periode.fin).toLocaleDateString("fr-FR")}
              </p>
              <p style={{ color: d.formulaire_2035_b.resultat_fiscal >= 0 ? "#4caf50" : "#e8836a", fontSize: "24px", fontWeight: "bold", margin: "0 0 10px" }}>
                Résultat fiscal : {euros(d.formulaire_2035_b.resultat_fiscal)}
              </p>
              {d.controles.map(function (c: any, i: number) {
                return (
                  <p key={i} style={{ color: c.ok ? "#4caf50" : "#e8a33d", fontSize: "13.5px", margin: "0 0 4px", lineHeight: "1.6" }}>
                    {c.ok ? "✓" : "!"} {c.nom} — <span style={{ color: "rgba(255,255,255,0.55)" }}>{c.detail}</span>
                  </p>
                );
              })}
            </div>

            {bloc("2035-A · Recettes", d.formulaire_2035_a.recettes, { libelle: "Recettes nettes (après rétrocessions)", montant: d.formulaire_2035_a.recettes_nettes, precedent: d.formulaire_2035_a.recettes_nettes_precedent })}
            {bloc("2035-A · Dépenses professionnelles", d.formulaire_2035_a.depenses, { libelle: "Total des dépenses", montant: d.formulaire_2035_a.total_depenses, precedent: d.formulaire_2035_a.total_depenses_precedent })}
            <div style={{ ...CARTE, display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "15px" }}>
              <span>Excédent (ou insuffisance) des recettes sur les dépenses</span>
              <span style={{ color: d.formulaire_2035_a.excedent >= 0 ? "#4caf50" : "#e8836a" }}>{euros(d.formulaire_2035_a.excedent)}</span>
            </div>
            {bloc("2035-B · Amortissements, provisions, plus et moins-values", d.formulaire_2035_b.lignes, { libelle: "Résultat fiscal", montant: d.formulaire_2035_b.resultat_fiscal, precedent: d.formulaire_2035_b.resultat_fiscal_precedent })}

            {d.orphelins.length > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
                <h3 style={{ color: "#e8a33d", fontSize: "15px", margin: "0 0 10px" }}>Comptes non ventilés</h3>
                {d.orphelins.map(function (o: any) {
                  return <p key={o.compte} style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", margin: "0 0 4px" }}>{o.compte} {o.libelle} · {euros(o.solde)}</p>;
                })}
              </div>
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>{d.avertissement}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
