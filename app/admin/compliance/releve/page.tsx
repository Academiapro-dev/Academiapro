"use client";
import { useState, useEffect } from "react";

export default function PageReleve() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [contenu, setContenu] = useState("");
  const [compte, setCompte] = useState("512000");
  const [ouvert, setOuvert] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [rejets, setRejets] = useState<any[]>([]);

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
  }, [dossier]);

  async function charger() {
    setErreur("");
    try {
      const r = await fetch("/api/compliance/releve?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
  }

  async function importer() {
    if (contenu.trim().length < 10) {
      setErreur("Collez votre releve.");
      return;
    }
    setOccupe("import");
    setMessage("");
    setErreur("");
    setRejets([]);
    try {
      const r = await fetch("/api/compliance/releve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, compte: compte, contenu: contenu }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setContenu("");
        setOuvert(false);
        if (data.rejets) setRejets(data.rejets);
        await charger();
      } else {
        setErreur(data.erreur || "Import impossible.");
        if (data.rejets) setRejets(data.rejets);
      }
    } catch (e: any) {
      setErreur("Import impossible : " + String(e));
    }
    setOccupe("");
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
    color: "#c8a96e", padding: "9px 18px", borderRadius: "20px",
    cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif",
  };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
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
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Releves bancaires</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Importez le releve, puis rapprochez-le des ecritures
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
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {dossier && (
          <>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                onClick={() => setOuvert(!ouvert)}
                style={{ ...BOUTON, background: ouvert ? "none" : "#c8a96e", color: ouvert ? "#c8a96e" : "#050508", border: ouvert ? BOUTON.border : "none", fontWeight: "bold" }}
              >
                {ouvert ? "Annuler" : "Importer un releve"}
              </button>
              <a href={"/admin/compliance/rapprochement?societe_id=" + dossier} style={{ ...BOUTON, textDecoration: "none" }}>
                Rapprocher →
              </a>
            </div>

            {ouvert && (
              <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
                <span style={LIBELLE}>Compte bancaire</span>
                <input value={compte} onChange={(e) => setCompte(e.target.value)} placeholder="512000" style={CHAMP} />

                <span style={LIBELLE}>Ordre des colonnes</span>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 6px", fontFamily: "monospace", lineHeight: "1.7" }}>
                  date ; libelle ; montant ; [credit] ; date de valeur ; reference ; solde
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 14px", lineHeight: "1.7" }}>
                  Le montant peut etre signe dans une seule colonne, ou reparti en debit et credit.
                  Les dates francaises et americaines sont acceptees, l en-tete est ignoree.
                </p>

                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  rows={9}
                  placeholder={"12/03/2026 ; VIR SEPA CLIENT DUPONT ; 1200,00\n14/03/2026 ; PRLV LOYER MARS ; -850,00"}
                  style={{ ...CHAMP, fontFamily: "monospace", fontSize: "13.5px", lineHeight: "1.7" }}
                />

                <button
                  onClick={importer}
                  disabled={occupe !== "" || contenu.trim().length < 10}
                  style={{ background: occupe !== "" || contenu.trim().length < 10 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" || contenu.trim().length < 10 ? "#8a8a8a" : "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
                >
                  {occupe === "import" ? "Import en cours..." : "Importer"}
                </button>

                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
                  Une ligne deja importee est ecartee automatiquement : reimporter le meme releve
                  ne double jamais la tresorerie.
                </p>
              </div>
            )}

            {rejets.length > 0 && (
              <div style={CARTE}>
                <h2 style={{ color: "#e8a33d", fontSize: "16px", margin: "0 0 10px" }}>
                  {rejets.length} ligne(s) ecartee(s)
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

            {d && (
              <>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                    <p style={{ color: "#c8a96e", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>{d.total}</p>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Ligne(s)</p>
                  </div>
                  <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                    <p style={{ color: d.a_traiter > 0 ? "#e8a33d" : "rgba(255,255,255,0.4)", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>
                      {d.a_traiter}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>A rapprocher</p>
                  </div>
                  <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                    <p style={{ color: "#4caf50", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>{d.rapprochees}</p>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Rapprochee(s)</p>
                  </div>
                </div>

                {d.lignes.length === 0 ? (
                  <div style={CARTE}>
                    <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                      Aucune ligne de releve. Importez-en un pour commencer.
                    </p>
                  </div>
                ) : (
                  <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "0.9fr 2.4fr 1fr 0.9fr", background: "rgba(200,169,110,0.12)", padding: "12px 14px", fontSize: "12px", color: "#c8a96e", fontWeight: "bold" }}>
                      <span>Date</span><span>Libelle</span>
                      <span style={{ textAlign: "right" }}>Montant</span>
                      <span style={{ textAlign: "right" }}>Etat</span>
                    </div>
                    {d.lignes.map(function (l: any) {
                      return (
                        <div key={l.id} style={{ display: "grid", gridTemplateColumns: "0.9fr 2.4fr 1fr 0.9fr", padding: "11px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", opacity: l.ignore ? 0.4 : 1 }}>
                          <span style={{ color: "rgba(255,255,255,0.55)" }}>
                            {new Date(l.operation_date).toLocaleDateString("fr-FR")}
                          </span>
                          <span>{l.libelle}</span>
                          <span style={{ textAlign: "right", color: Number(l.montant) < 0 ? "#e8836a" : "#4caf50" }}>
                            {euros(l.montant)}
                          </span>
                          <span style={{ textAlign: "right", fontSize: "12.5px", color: l.ecriture_num ? "#4caf50" : "rgba(255,255,255,0.4)" }}>
                            {l.ecriture_num ? l.ecriture_num : l.ignore ? "ignoree" : "a traiter"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
