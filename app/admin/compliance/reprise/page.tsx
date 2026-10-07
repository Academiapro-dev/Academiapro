"use client";
import { useState, useEffect } from "react";

export default function PageReprise() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [mode, setMode] = useState("fec");
  const [contenu, setContenu] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [occupe, setOccupe] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [rejets, setRejets] = useState<any[]>([]);

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

  async function reprendre(forcer: boolean) {
    setOccupe(true);
    setErreur("");
    setResultat(null);
    setRejets([]);
    try {
      const r = await fetch("/api/compliance/reprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societe_id: dossier, mode: mode, contenu: contenu,
          date: date, forcer: forcer,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setResultat(data);
        setContenu("");
        if (data.rejets) setRejets(data.rejets);
      } else {
        setErreur(data.erreur || "Reprise impossible.");
        if (data.rejets) setRejets(data.rejets);
      }
    } catch (e: any) {
      setErreur("Reprise impossible : " + String(e));
    }
    setOccupe(false);
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "9px 17px", borderRadius: "20px", cursor: "pointer", fontSize: "13.5px", fontFamily: "Georgia,serif" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
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
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Reprendre un dossier</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Récupérer l’historique d’un client venant d’un autre logiciel
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier de destination</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {dossier && (
          <>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                onClick={() => { setMode("fec"); setResultat(null); setErreur(""); }}
                style={{ ...BOUTON, background: mode === "fec" ? "#c8a96e" : "none", color: mode === "fec" ? "#050508" : "#c8a96e", border: mode === "fec" ? "none" : BOUTON.border, fontWeight: "bold" }}
              >
                Fichier des écritures (FEC)
              </button>
              <button
                onClick={() => { setMode("balance"); setResultat(null); setErreur(""); }}
                style={{ ...BOUTON, background: mode === "balance" ? "#c8a96e" : "none", color: mode === "balance" ? "#050508" : "#c8a96e", border: mode === "balance" ? "none" : BOUTON.border, fontWeight: "bold" }}
              >
                Balance d’ouverture
              </button>
            </div>

            <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
              {mode === "fec" ? (
                <>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.8" }}>
                    Collez le fichier des écritures comptables tel qu’il sort du logiciel
                    précédent : colonnes séparées par des barres verticales, avec sa ligne
                    d’en-tête. L’ordre des colonnes est lu depuis l’en-tête, rien n’est supposé.
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "0 0 14px", lineHeight: "1.7" }}>
                    Les écritures déjà présentes sont ignorées, les comptes inconnus sont ajoutés
                    au plan, et rien n’est écrit sur un exercice verrouillé.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.8" }}>
                    Collez la balance à la date de reprise : compte, libellé, débit, crédit.
                    Elle deviendra une écriture d’à-nouveaux.
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 14px", fontFamily: "monospace", lineHeight: "1.7" }}>
                    401000 ; Fournisseurs ; 0 ; 4200,00
                  </p>
                  <span style={LIBELLE}>Date de reprise</span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={CHAMP} />
                </>
              )}

              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                rows={10}
                placeholder={mode === "fec"
                  ? "JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|..."
                  : "411000 ; Clients ; 12500,00 ; 0"}
                style={{ ...CHAMP, fontFamily: "monospace", fontSize: "12.5px", lineHeight: "1.65" }}
              />

              <button
                onClick={() => reprendre(false)}
                disabled={occupe || contenu.trim().length < 20}
                style={{ background: occupe || contenu.trim().length < 20 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
              >
                {occupe ? "Reprise en cours…" : "Reprendre"}
              </button>
            </div>
          </>
        )}

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>{erreur}</p>
            {erreur.indexOf("ne tombe pas juste") >= 0 && (
              <button
                onClick={() => reprendre(true)}
                disabled={occupe}
                style={{ ...BOUTON, marginTop: "12px" }}
              >
                Reprendre quand même, le déséquilibre sera visible en balance
              </button>
            )}
          </div>
        )}

        {resultat && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "16px", fontWeight: "bold", margin: "0 0 10px" }}>
              {resultat.message}
            </p>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
              {resultat.lignes} {resultat.lignes > 1 ? "lignes écrites" : "ligne écrite"} · {euros(resultat.debit)} au débit
              {resultat.ignorees ? " · " + resultat.ignorees + " déjà présentes" : ""}
              {resultat.comptes_crees ? " · " + resultat.comptes_crees + (resultat.comptes_crees > 1 ? " comptes ajoutés au plan" : " compte ajouté au plan") : ""}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
              <a href={"/admin/compliance/balance?societe_id=" + dossier} style={{ ...BOUTON, textDecoration: "none" }}>
                Vérifier la balance →
              </a>
              <a href={"/admin/compliance/revision?societe_id=" + dossier} style={{ ...BOUTON, textDecoration: "none" }}>
                Réviser le dossier →
              </a>
            </div>
          </div>
        )}

        {rejets.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: "#e8a33d", fontSize: "16px", margin: "0 0 10px" }}>
              {rejets.length} {rejets.length > 1 ? "lignes écartées" : "ligne écartée"}
            </h2>
            {rejets.map(function (r: any, i: number) {
              return (
                <div key={i} style={{ padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Ligne {r.ligne} · </span>{r.valeur}
                  </p>
                  <p style={{ color: "#e8a33d", fontSize: "12.5px", margin: "3px 0 0" }}>{r.motif}</p>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
            Tout expert-comptable peut exiger le fichier des écritures du confrère qu’il remplace :
            c’est un document normalisé que tout logiciel doit savoir produire. C’est ce qui rend
            la reprise d’un client possible sans ressaisie.
          </p>
        </div>
      </div>
    </div>
  );
}
