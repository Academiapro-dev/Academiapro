"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// PRODUIRE UN DOCUMENT — 14/09.
//
// Trois gestes, dans l ordre : le document, le client, les champs qui
// restent. Puis le PDF, et l envoi a signer.
//
// ⚠️ CE QUE LA FICHE REMPLIT EST AFFICHE, PAS CACHE. Le client voit ce qui
// vient du CRM et peut le corriger avant de produire : une adresse fausse
// dans un mandat se voit mieux ici que sur le document signe.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";

const CADRE: any = { minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
const CHAMP: any = { width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
const BOUTON: any = { background: OR, color: FOND, padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "9px 18px", borderRadius: "20px", cursor: "pointer", fontSize: "13.5px", fontFamily: "Georgia,serif" };

export default function PageProduire() {
  const [modeles, setModeles] = useState<any[]>([]);
  const [fiches, setFiches] = useState<any[]>([]);
  const [modele, setModele] = useState("");
  const [fiche, setFiche] = useState("");
  const [champs, setChamps] = useState<any[]>([]);
  const [valeurs, setValeurs] = useState<any>({});
  const [produit, setProduit] = useState<any>(null);

  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () { charger(); }, []);
  useEffect(function () { if (modele) preparer(); }, [modele, fiche]);

  function suffixe(q?: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      const base = q ? "?" + q : "";
      if (!t) return base;
      return base ? base + "&tenant=" + t : "?tenant=" + t;
    } catch { return q ? "?" + q : ""; }
  }

  async function charger() {
    setChargement(true);
    try {
      const r1 = await fetch("/api/organisme/modeles" + suffixe());
      const d1 = await r1.json();
      if (d1.ok) setModeles((d1.modeles || []).filter(function (m: any) { return m.actif; }));
      else setErreur(d1.erreur || "Lecture impossible.");

      // Les fiches du CRM du client. La route crm existe deja et rend la
      // liste bornee au tenant de la session.
      const r2 = await fetch("/api/organisme/crm" + suffixe());
      const d2 = await r2.json();
      if (d2.ok) setFiches(d2.fiches || d2.prospects || d2.lignes || []);
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function preparer() {
    setMessage(""); setErreur(""); setProduit(null);
    try {
      const r = await fetch("/api/organisme/modele-document" + suffixe("modele=" + encodeURIComponent(modele) + (fiche ? "&fiche=" + encodeURIComponent(fiche) : "")));
      const d = await r.json();
      if (d.ok) {
        setChamps(d.champs || []);
        const v: any = {};
        for (const c of d.champs || []) v[c.cle] = c.valeur || "";
        setValeurs(v);
      } else setErreur(d.erreur || "Préparation impossible.");
    } catch (e: any) {
      setErreur("Préparation impossible : " + String(e));
    }
  }

  async function produire() {
    setOccupe("produire"); setMessage(""); setErreur("");
    try {
      const r = await fetch("/api/organisme/modele-document" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modele_id: modele, fiche_id: fiche || undefined, valeurs: valeurs }),
      });
      const d = await r.json();
      if (d.ok) { setProduit(d); setMessage(d.message); }
      else setErreur(d.erreur || "Production impossible.");
    } catch (e: any) {
      setErreur("Production impossible : " + String(e));
    }
    setOccupe("");
  }

  async function faireSigner() {
    if (!produit || !produit.reference) return;
    const dest = produit.destinataire || valeurs.email || "";
    if (!dest) { setErreur("Aucune adresse pour envoyer la signature : renseignez le champ email."); return; }
    setOccupe("signer"); setMessage(""); setErreur("");
    try {
      const r = await fetch("/api/organisme/faire-signer" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_reference: produit.reference, email: dest }),
      });
      const d = await r.json();
      if (d.ok) setMessage("Demande de signature envoyée à " + (d.destinataire || dest) + ".");
      else setErreur(d.erreur || "Envoi impossible.");
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe("");
  }

  function nomFiche(f: any): string {
    const bouts = [f.nom || [f.dirigeant_prenom, f.dirigeant_nom].filter(Boolean).join(" "), f.organisme, f.email].filter(Boolean);
    return bouts.join(" · ") || "(sans nom)";
  }

  const aRemplir = champs.filter(function (c: any) { return !c.rempli; });
  const remplis = champs.filter(function (c: any) { return c.rempli; });

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>← Retour au CRM</a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>DOCUMENTS</p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Produire un document</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: 1.7 }}>
          Choisissez le document et le client : ce que la fiche connaît se remplit tout
          seul. Vous complétez le reste, et le document part à la signature.{" "}
          <a href="/organisme/modeles" style={{ color: OR }}>Gérer mes modèles</a>
        </p>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        <div style={CARTE}>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>1. Quel document ?</span>
          <select value={modele} onChange={(e) => setModele(e.target.value)} style={CHAMP}>
            <option value="">— choisir un document —</option>
            {modeles.map(function (m) {
              return <option key={m.id} value={m.id}>{m.titre}{m.categorie ? " (" + m.categorie + ")" : ""}</option>;
            })}
          </select>
          {modeles.length === 0 && !chargement && (
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
              Aucun modèle déposé. <a href="/organisme/modeles" style={{ color: OR }}>En déposer un</a>.
            </p>
          )}

          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>2. Pour quel client ?</span>
          <select value={fiche} onChange={(e) => setFiche(e.target.value)} style={CHAMP}>
            <option value="">— sans fiche, tout saisir à la main —</option>
            {fiches.map(function (f: any) {
              return <option key={f.id} value={f.id}>{nomFiche(f)}</option>;
            })}
          </select>
        </div>

        {modele && champs.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "18px", margin: "0 0 4px" }}>3. Les informations du document</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", margin: "0 0 16px", lineHeight: 1.7 }}>
              {remplis.length} champ(s) rempli(s) depuis la fiche, {aRemplir.length} à compléter.
              Vous pouvez tout corriger avant de produire.
            </p>

            {champs.map(function (c: any) {
              return (
                <div key={c.cle}>
                  <span style={{ fontSize: "13.5px", color: c.rempli ? VERT : "rgba(255,255,255,0.6)" }}>
                    {c.libelle}{c.rempli ? " · depuis la fiche" : ""}
                  </span>
                  <input
                    value={valeurs[c.cle] || ""}
                    onChange={(e) => setValeurs({ ...valeurs, [c.cle]: e.target.value })}
                    placeholder={c.libelle}
                    style={{ ...CHAMP, borderColor: c.rempli ? "rgba(76,175,80,0.35)" : CHAMP.border }}
                  />
                </div>
              );
            })}

            <button onClick={produire} disabled={occupe !== ""} style={BOUTON}>
              {occupe === "produire" ? "Production…" : "Produire le document"}
            </button>
          </div>
        )}

        {produit && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.4)" }}>
            <h2 style={{ color: VERT, fontSize: "18px", margin: "0 0 8px" }}>{produit.titre}</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: "0 0 16px" }}>
              Référence {produit.reference}
              {produit.champs_manquants && produit.champs_manquants.length > 0
                ? " · " + produit.champs_manquants.length + " champ(s) laissé(s) en blanc"
                : ""}
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {produit.url && (
                <a href={produit.url} target="_blank" rel="noreferrer" style={{ ...BOUTON, textDecoration: "none", display: "inline-block" }}>
                  Ouvrir le PDF
                </a>
              )}
              <button onClick={faireSigner} disabled={occupe !== ""} style={SECOND}>
                {occupe === "signer" ? "Envoi…" : "Envoyer à signer"}
              </button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "14px 0 0", lineHeight: 1.7 }}>
              Le document est archivé et inscrit au registre. La demande de signature part
              à {produit.destinataire || valeurs.email || "l'adresse du client"} ; la preuve
              est conservée dans vos signatures.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
