"use client";
import { useState, useEffect } from "react";

export default function PageDocuments() {
  const [types, setTypes] = useState<any>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [stagiaires, setStagiaires] = useState<any[]>([]);
  const [signees, setSignees] = useState<any>({});
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [choisi, setChoisi] = useState("");

  useEffect(function () {
    charger();
  }, []);

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "?tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r1 = await fetch("/api/organisme/document" + suffixe());
      const d1 = await r1.json();
      if (d1.ok) {
        setTypes(d1.types || {});
        setDocuments(d1.documents || []);
      } else {
        setErreur(d1.erreur || "Lecture impossible.");
      }

      const r2 = await fetch("/api/organisme/stagiaires" + suffixe());
      const d2 = await r2.json();
      if (d2.ok) setStagiaires(d2.apprenants || []);

      const r3 = await fetch("/api/organisme/signature" + suffixe());
      const d3 = await r3.json();
      if (d3.ok) {
        const s: any = {};
        for (const sig of d3.signatures || []) {
          if (!sig.annulee) s[sig.document_reference] = sig;
        }
        setSignees(s);
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function produire(type: string) {
    if (!choisi) {
      setErreur("Choisissez d'abord un stagiaire.");
      return;
    }
    setOccupe(type);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/document" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type, email: choisi }),
      });

      if (!r.ok) {
        let detail = "code " + r.status;
        try {
          const err = await r.json();
          detail = err.erreur || detail;
        } catch (e) {}
        setErreur("Document non produit : " + detail);
        setOccupe("");
        return;
      }

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = type + ".pdf";
      document.body.appendChild(lien);
      lien.click();
      document.body.removeChild(lien);
      window.URL.revokeObjectURL(url);

      setMessage((types[type] || type) + " produit et enregistr\u00e9 au registre.");
      await charger();
    } catch (e: any) {
      setErreur("Document non produit : " + String(e));
    }
    setOccupe("");
  }

  async function faireSigner(reference: string, email: string) {
    setOccupe("signer-" + reference);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/faire-signer" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_reference: reference, email: email }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Demande de signature envoy\u00e9e \u00e0 " + data.destinataire + ".");
      } else {
        setErreur(data.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "16px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "16px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "7px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  const AIDE: any = {
    convention: "\u00c0 signer avant le d\u00e9but de la formation. Indicateurs 4 et 9.",
    devis: "Proposition chiffr\u00e9e, valable trente jours. Indicateur 1.",
    convocation: "Confirme l'inscription et explique l'acc\u00e8s. Indicateur 9.",
    programme: "Les neuf \u00e9l\u00e9ments exig\u00e9s par le guide de lecture. Indicateur 1.",
    attestation: "\u00c0 remettre en fin de parcours. Article L. 6353-1 du Code du travail.",
    emargement: "Traces d'assiduit\u00e9 horodat\u00e9es, valables pour une formation \u00e0 distance.",
    livret: "R\u00e8glement, r\u00e9f\u00e9rent handicap, voie de r\u00e9clamation. Indicateurs 9, 26 et 31.",
  };

  const A_SIGNER = ["convention", "devis"];

  const ordre = ["programme", "devis", "convention", "convocation", "livret", "emargement", "attestation"];

  const nbSignes = Object.keys(signees).length;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          {"\u2190 Retour au tableau de bord"}
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          DOCUMENTS ADMINISTRATIFS
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes documents</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {documents.length}{" \u00e9mis \u00b7 "}{nbSignes}{" sign\u00e9(s) \u00e9lectroniquement"}
        </p>

        <div style={{ ...CARTE, marginTop: "26px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 12px" }}>Pour quel stagiaire ?</h2>
          <select value={choisi} onChange={(e) => setChoisi(e.target.value)} style={CHAMP}>
            <option value="">{"\u2014 choisir un stagiaire \u2014"}</option>
            {stagiaires.map(function (s) {
              return (
                <option key={s.id} value={s.email}>
                  {s.email}{s.nom ? " \u2014 " + s.nom : ""}{s.formation_code ? " (" + s.formation_code + ")" : ""}
                </option>
              );
            })}
          </select>
          {stagiaires.length === 0 && !chargement && (
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "12px 0 0" }}>
              {"Aucun stagiaire au registre. "}<a href="/organisme/stagiaires" style={{ color: "#c8a96e" }}>En inscrire un</a>.
            </p>
          )}
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "26px" }}>
          {ordre.filter(function (t) { return types[t]; }).map(function (t) {
            return (
              <div key={t} style={{ ...CARTE, flex: "1 1 280px", marginBottom: 0 }}>
                <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 6px" }}>{types[t]}</h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 14px", lineHeight: "1.6" }}>
                  {AIDE[t] || ""}
                </p>
                <button
                  onClick={() => produire(t)}
                  disabled={occupe !== "" || !choisi}
                  style={{ background: occupe !== "" || !choisi ? "rgba(200,169,110,0.25)" : "#c8a96e", color: occupe !== "" || !choisi ? "#8a8a8a" : "#050508", padding: "11px 22px", borderRadius: "8px", border: "none", cursor: occupe !== "" || !choisi ? "default" : "pointer", fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia,serif", width: "100%" }}
                >
                  {occupe === t ? "Production..." : "Produire le PDF"}
                </button>
              </div>
            );
          })}
        </div>

        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 14px" }}>{"Documents d\u00e9j\u00e0 \u00e9mis"}</h2>

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : documents.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              {"Aucun document \u00e9mis pour le moment."}
            </p>
          </div>
        ) : (
          documents.map(function (d) {
            const signature = signees[d.reference];
            const signable = A_SIGNER.indexOf(d.type) >= 0;
            return (
              <div key={d.id} style={{ ...CARTE, border: signature ? "1px solid rgba(76,175,80,0.4)" : CARTE.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px" }}>
                      {types[d.type] || d.type}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                      {d.reference}{" \u00b7 "}{d.stagiaire_email}
                      {" \u00b7 \u00e9mis le " + new Date(d.emis_le).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  {signature && (
                    <span style={{ color: "#4caf50", fontSize: "13px", fontWeight: "bold" }}>
                      {"Sign\u00e9 le " + new Date(signature.signe_le).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>

                {signature ? (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "10px 0 0", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {signature.empreinte_sha256}
                    {signature.intacte === false ? " \u2014 SCEAU ALT\u00c9R\u00c9" : ""}
                  </p>
                ) : signable ? (
                  <div style={{ marginTop: "12px" }}>
                    <button
                      onClick={() => faireSigner(d.reference, d.stagiaire_email)}
                      disabled={occupe !== ""}
                      style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                    >
                      {occupe === "signer-" + d.reference ? "Envoi..." : "Faire signer"}
                    </button>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginLeft: "10px" }}>
                      {"un lien de signature sera envoy\u00e9 au stagiaire"}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
