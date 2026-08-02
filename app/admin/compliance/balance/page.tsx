"use client";
import { useState, useEffect } from "react";

export default function PageBalance() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [compte, setCompte] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
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
    try {
      const r = await fetch(
        "/api/compliance/balance?societe_id=" + dossier + (compte ? "&compte=" + compte : "")
      );
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
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
    const v = Number(n) || 0;
    if (v === 0) return "";
    return v.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
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
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>
          {compte ? "Grand livre" : "Balance generale"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {compte ? "Le detail d un compte, avec son solde progressif" : "Un compte par ligne, ses totaux et son solde"}
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

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture...</p></div>
        ) : !d ? null : d.vue === "grand_livre" ? (
          <>
            <div style={{ ...CARTE, border: "2px solid rgba(200,169,110,0.45)" }}>
              <button onClick={() => setCompte("")} style={{ ...BOUTON, marginBottom: "12px" }}>
                ← Revenir a la balance
              </button>
              <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 3px", fontFamily: "monospace" }}>
                {d.compte.numero}
              </p>
              <h2 style={{ color: "#fff", fontSize: "19px", margin: "0 0 8px" }}>{d.compte.libelle}</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14.5px", margin: 0 }}>
                Debit {euros(d.compte.debit) || "0,00"} · Credit {euros(d.compte.credit) || "0,00"} ·{" "}
                <strong style={{ color: d.compte.solde >= 0 ? "#c8a96e" : "#e8a33d" }}>
                  Solde {d.compte.solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                  {d.compte.solde >= 0 ? " debiteur" : " crediteur"}
                </strong>
              </p>
            </div>

            <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.9fr 0.8fr 0.8fr 0.9fr", background: "rgba(200,169,110,0.12)", padding: "12px 14px", fontSize: "12px", color: "#c8a96e", fontWeight: "bold" }}>
                <span>Date</span><span>Libelle</span>
                <span style={{ textAlign: "right" }}>Debit</span>
                <span style={{ textAlign: "right" }}>Credit</span>
                <span style={{ textAlign: "right" }}>Solde</span>
              </div>
              {d.mouvements.map(function (m: any, i: number) {
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "0.9fr 1.9fr 0.8fr 0.8fr 0.9fr", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>
                      {new Date(m.date).toLocaleDateString("fr-FR")}
                    </span>
                    <span>
                      {m.libelle}
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11.5px" }}>
                        {" "}· {m.journal} {m.ecriture}
                      </span>
                    </span>
                    <span style={{ textAlign: "right" }}>{euros(m.debit)}</span>
                    <span style={{ textAlign: "right" }}>{euros(m.credit)}</span>
                    <span style={{ textAlign: "right", color: "#c8a96e" }}>
                      {m.solde_progressif.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div style={{ ...CARTE, border: d.totaux.equilibre ? "1px solid rgba(76,175,80,0.45)" : "1px solid rgba(232,131,106,0.5)" }}>
              <p style={{ color: d.totaux.equilibre ? "#4caf50" : "#e8836a", fontSize: "16px", fontWeight: "bold", margin: "0 0 6px" }}>
                {d.totaux.equilibre ? "Balance equilibree" : "BALANCE DESEQUILIBREE"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                Debit {euros(d.totaux.debit)} · Credit {euros(d.totaux.credit)}
                {!d.totaux.equilibre ? " · ecart de " + euros(d.totaux.ecart) : ""}
                <br />
                {d.totaux.nb_comptes} compte(s) mouvemente(s) sur {d.totaux.nb_lignes} ligne(s),
                exercice du {new Date(d.periode.debut).toLocaleDateString("fr-FR")} au{" "}
                {new Date(d.periode.fin).toLocaleDateString("fr-FR")}
              </p>
            </div>

            {d.classes.length > 0 && (
              <div style={CARTE}>
                <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 10px" }}>Par classe</h2>
                {d.classes.map(function (c: any) {
                  return (
                    <div key={c.classe} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "14px" }}>
                      <span style={{ color: "rgba(255,255,255,0.75)" }}>
                        {c.classe} · {c.nom}
                        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px" }}>
                          {" "}· {c.comptes} compte(s)
                        </span>
                      </span>
                      <span style={{ color: "#c8a96e" }}>
                        {c.solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "0.9fr 2.2fr 0.9fr 0.9fr 1fr", background: "rgba(200,169,110,0.12)", padding: "12px 14px", fontSize: "12px", color: "#c8a96e", fontWeight: "bold" }}>
                <span>Compte</span><span>Libelle</span>
                <span style={{ textAlign: "right" }}>Debit</span>
                <span style={{ textAlign: "right" }}>Credit</span>
                <span style={{ textAlign: "right" }}>Solde</span>
              </div>
              {d.balance.map(function (c: any) {
                return (
                  <div
                    key={c.numero}
                    onClick={() => setCompte(c.numero)}
                    style={{ display: "grid", gridTemplateColumns: "0.9fr 2.2fr 0.9fr 0.9fr 1fr", padding: "11px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{c.numero}</span>
                    <span>{c.libelle}</span>
                    <span style={{ textAlign: "right" }}>{euros(c.debit)}</span>
                    <span style={{ textAlign: "right" }}>{euros(c.credit)}</span>
                    <span style={{ textAlign: "right", color: c.solde_debiteur > 0 ? "#c8a96e" : "#e8a33d" }}>
                      {c.solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.7" }}>
              Touchez une ligne pour ouvrir le grand livre du compte, avec le detail de ses
              mouvements et son solde progressif.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
