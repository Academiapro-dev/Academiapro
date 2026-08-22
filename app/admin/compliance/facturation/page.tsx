"use client";
import { useState, useEffect } from "react";

// LA FACTURATION DU CABINET — devis, factures, avoirs.
//
// 🚨 TROIS REGLES DE DROIT SONT VISIBLES A L ECRAN, et c est voulu : un
// expert-comptable qui essaie le logiciel les cherche.
//
//   1. LE NUMERO N EXISTE QU A L EMISSION. Un brouillon n a pas de numero,
//      il ne compte pas dans la serie. Reserver un numero puis abandonner
//      le document ferait un trou a justifier devant un controleur.
//   2. UNE FACTURE EMISE NE SE MODIFIE PLUS. L ecran grise tout. Une erreur
//      se corrige par un avoir.
//   3. UN DOCUMENT NUMEROTE NE SE SUPPRIME PAS. Seul un brouillon s efface.

const ETATS: any = {
  brouillon: { nom: "Brouillon", couleur: "#8a8a9a" },
  envoye: { nom: "Émis", couleur: "#448aff" },
  accepte: { nom: "Accepté", couleur: "#00e676" },
  refuse: { nom: "Refusé", couleur: "#e8836a" },
  partiel: { nom: "Partiellement réglé", couleur: "#e8a33d" },
  paye: { nom: "Réglé", couleur: "#00e676" },
  annule: { nom: "Annulé", couleur: "#e8836a" },
};

const TAUX = [20, 10, 5.5, 2.1, 0];

const MODES = ["Virement", "Chèque", "Carte", "Espèces", "Prélèvement"];

const FILTRES = [
  { cle: "", nom: "Tout" },
  { cle: "devis", nom: "Devis" },
  { cle: "facture", nom: "Factures" },
  { cle: "avoir", nom: "Avoirs" },
  { cle: "brouillon", nom: "Brouillons" },
  { cle: "impaye", nom: "Impayés" },
];

export default function Facturation() {
  const [d, setD] = useState<any>(null);
  const [ouvert, setOuvert] = useState<any>(null);
  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [filtre, setFiltre] = useState("");
  const [cherche, setCherche] = useState("");

  const [creation, setCreation] = useState<any>(null);
  const [ligne, setLigne] = useState<any>(null);
  const [reglement, setReglement] = useState<any>(null);

  useEffect(function () { charger(); }, []);

  async function charger() {
    setCharge(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/facturation", { cache: "no-store" });
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  async function ouvrir(id: any) {
    setOccupe("ouvrir");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/facturation?id=" + id, { cache: "no-store" });
      const data = await r.json();
      if (data.ok) setOuvert(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setOccupe("");
  }

  async function appeler(corps: any) {
    const r = await fetch("/api/compliance/facturation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return await r.json();
  }

  async function agir(corps: any, nom: string) {
    setOccupe(nom);
    setErreur("");
    setMessage("");
    try {
      const data = await appeler(corps);
      if (data.ok) {
        setMessage(data.message || "Enregistré.");
        await charger();
        if (data.document) await ouvrir(data.document.id);
        else if (ouvert) await ouvrir(ouvert.document.id);
      } else {
        setErreur(data.erreur || "Action impossible.");
      }
      setOccupe("");
      return data;
    } catch (e: any) {
      setErreur("Action impossible : " + String(e));
      setOccupe("");
      return null;
    }
  }

  async function creer() {
    if (!creation) return;
    const data = await agir({ action: "creer", ...creation }, "creer");
    if (data && data.ok) setCreation(null);
  }

  async function enregistrerLigne() {
    if (!ligne || !ouvert) return;
    const data = await agir({ action: "ligne", document_id: ouvert.document.id, ...ligne }, "ligne");
    if (data && data.ok) setLigne(null);
  }

  async function enregistrerReglement() {
    if (!reglement || !ouvert) return;
    const data = await agir({ action: "reglement", document_id: ouvert.document.id, ...reglement }, "regl");
    if (data && data.ok) setReglement(null);
  }

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  function jolieDate(x: any) {
    if (!x) return "";
    try { return new Date(x).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
  }

  function aplatir(v: any): string {
    return String(v === null || v === undefined ? "" : v)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  const OR = "#c8a96e";
  const BLEU = "#448aff";
  const VERT = "#00e676";
  const ORANGE = "#e8a33d";
  const ROUGE = "#e8836a";

  const CARTE: any = { background: "#1a1a2e", borderRadius: "10px", padding: "15px", marginBottom: "10px", border: "1px solid rgba(200,169,110,0.15)" };
  const BOUTON: any = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,169,110,0.3)", color: OR, padding: "8px 15px", borderRadius: "18px", cursor: "pointer", fontSize: "12.5px", fontFamily: "Georgia,serif" };
  const PLEIN: any = { background: OR, color: "#050508", border: "none", padding: "11px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif" };
  const CHAMP: any = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", fontSize: "13.5px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const TH: any = { position: "sticky", top: 0, background: "#12121f", color: OR, fontSize: "11.5px", fontWeight: "bold", textAlign: "left", padding: "9px 10px", borderBottom: "2px solid rgba(200,169,110,0.35)", whiteSpace: "nowrap", zIndex: 2 };
  const TD: any = { padding: "8px 10px", fontSize: "12.5px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)" };
  const LABEL: any = { color: OR, fontSize: "12px", display: "block", marginBottom: "5px" };

  const docs = d && d.documents ? d.documents : [];
  const c = d && d.compteurs ? d.compteurs : null;

  const listeFiltree = docs.filter(function (x: any) {
    if (filtre === "devis" && x.type !== "devis") return false;
    if (filtre === "facture" && x.type !== "facture") return false;
    if (filtre === "avoir" && x.type !== "avoir") return false;
    if (filtre === "brouillon" && x.statut !== "brouillon") return false;
    if (filtre === "impaye") {
      if (x.type !== "facture" || x.statut === "brouillon" || x.statut === "paye") return false;
      if ((Number(x.reste_du) || 0) <= 0) return false;
    }
    if (!cherche) return true;
    const q = aplatir(cherche);
    return aplatir((x.client_nom || "") + " " + (x.numero || "") + " " + (x.objet || "")).indexOf(q) >= 0;
  });

  // ═══════════ LE DOCUMENT OUVERT ═══════════
  if (ouvert) {
    const doc = ouvert.document;
    const fige = !!doc.numero;
    const etat = ETATS[doc.statut] || ETATS.brouillon;
    const type = ouvert.types[doc.type] || ouvert.types.facture;
    const paye = (ouvert.reglements || []).reduce(function (s: number, r: any) {
      return s + (Number(r.montant) || 0);
    }, 0);

    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif", padding: "30px 20px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

          <button onClick={() => { setOuvert(null); charger(); }} style={{ background: "none", border: "none", color: OR, fontSize: "14px", cursor: "pointer", padding: 0 }}>
            ← Retour à la liste
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", margin: "20px 0 6px", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 6px" }}>
                {type.nom.toUpperCase()}
              </p>
              <h1 style={{ color: "#fff", fontSize: "27px", margin: "0 0 4px" }}>
                {doc.numero || "Brouillon sans numéro"}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
                {doc.client_nom} · {jolieDate(doc.date_emission)}
                {doc.date_echeance ? " · échéance " + jolieDate(doc.date_echeance) : ""}
              </p>
            </div>
            <span style={{ color: etat.couleur, border: "1px solid " + etat.couleur + "70", padding: "6px 14px", borderRadius: "18px", fontSize: "13px", fontWeight: "bold" }}>
              {etat.nom}
            </span>
          </div>

          {message && (
            <div style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "12px", margin: "16px 0", color: VERT, fontSize: "13px", lineHeight: "1.7" }}>
              {message}
            </div>
          )}
          {erreur && (
            <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "8px", padding: "12px", margin: "16px 0", color: ROUGE, fontSize: "13px", lineHeight: "1.7" }}>
              {erreur}
            </div>
          )}

          {fige && (
            <div style={{ ...CARTE, border: "1px solid rgba(68,138,255,0.35)", marginTop: "16px" }}>
              <p style={{ color: BLEU, fontSize: "13px", lineHeight: "1.8", margin: 0 }}>
                Ce document est émis : il ne se modifie plus et ne se supprime pas.
                Une erreur se corrige par un avoir.
                {doc.hash_sha256 ? " Empreinte : " + String(doc.hash_sha256).slice(0, 16) + "…" : ""}
              </p>
            </div>
          )}

          {/* ---------- LES LIGNES ---------- */}
          <h2 style={{ color: OR, fontSize: "15px", letterSpacing: "2px", margin: "28px 0 12px" }}>
            LE DÉTAIL
          </h2>

          <div style={{ overflowX: "auto", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", background: "#12121f", marginBottom: "12px" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "760px" }}>
              <thead>
                <tr>
                  <th style={TH}>Désignation</th>
                  <th style={{ ...TH, textAlign: "right" }}>Qté</th>
                  <th style={{ ...TH, textAlign: "right" }}>P.U. HT</th>
                  <th style={{ ...TH, textAlign: "right" }}>Remise</th>
                  <th style={{ ...TH, textAlign: "right" }}>TVA</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total HT</th>
                  {!fige && <th style={TH}></th>}
                </tr>
              </thead>
              <tbody>
                {(ouvert.lignes || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...TD, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px" }}>
                      Aucune ligne. Ajoutez ce que vous facturez.
                    </td>
                  </tr>
                ) : (
                  (ouvert.lignes || []).map(function (l: any) {
                    return (
                      <tr key={l.id}>
                        <td style={{ ...TD, color: "#fff" }}>
                          {l.designation}
                          {l.detail && (
                            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", marginTop: "3px" }}>
                              {l.detail}
                            </div>
                          )}
                        </td>
                        <td style={{ ...TD, textAlign: "right" }}>{l.quantite}{l.unite ? " " + l.unite : ""}</td>
                        <td style={{ ...TD, textAlign: "right" }}>{euros(l.prix_unitaire)}</td>
                        <td style={{ ...TD, textAlign: "right", color: l.remise_pct > 0 ? ORANGE : "rgba(255,255,255,0.3)" }}>
                          {l.remise_pct > 0 ? l.remise_pct + " %" : "—"}
                        </td>
                        <td style={{ ...TD, textAlign: "right" }}>{l.taux_tva} %</td>
                        <td style={{ ...TD, textAlign: "right", color: "#fff", fontWeight: "bold" }}>{euros(l.total_ht)}</td>
                        {!fige && (
                          <td style={{ ...TD, textAlign: "right", whiteSpace: "nowrap" }}>
                            <button onClick={() => setLigne({ ...l })} style={{ background: "none", border: "none", color: OR, cursor: "pointer", fontSize: "12px" }}>
                              modifier
                            </button>
                            <button onClick={() => agir({ action: "supprimer_ligne", id: l.id }, "sl")} style={{ background: "none", border: "none", color: ROUGE, cursor: "pointer", fontSize: "12px" }}>
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!fige && (
            <button
              onClick={() => setLigne({ designation: "", detail: "", quantite: 1, unite: "", prix_unitaire: 0, remise_pct: 0, taux_tva: doc.autoliquidation ? 0 : 20, rang: (ouvert.lignes || []).length })}
              style={{ ...BOUTON, marginBottom: "18px" }}>
              ➕ Ajouter une ligne
            </button>
          )}

          {/* ---------- LES TOTAUX ---------- */}
          <div style={{ ...CARTE, maxWidth: "380px", marginLeft: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", padding: "5px 0" }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Total HT</span>
              <span style={{ color: "#fff" }}>{euros(doc.total_ht)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", padding: "5px 0" }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>TVA</span>
              <span style={{ color: "#fff" }}>{euros(doc.total_tva)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "17px", fontWeight: "bold", padding: "10px 0 5px", borderTop: "1px solid rgba(200,169,110,0.25)", marginTop: "6px" }}>
              <span style={{ color: OR }}>Total TTC</span>
              <span style={{ color: OR }}>{euros(doc.total_ttc)}</span>
            </div>
            {doc.autoliquidation && (
              <p style={{ color: ORANGE, fontSize: "12px", lineHeight: "1.7", margin: "10px 0 0" }}>
                Autoliquidation de la TVA par le preneur — article 283-2 du CGI.
              </p>
            )}
            {doc.type === "facture" && fige && (
              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Réglé</span>
                  <span style={{ color: VERT }}>{euros(paye)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold", padding: "4px 0" }}>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>Reste dû</span>
                  <span style={{ color: (Number(doc.reste_du) || 0) > 0 ? ROUGE : VERT }}>{euros(doc.reste_du)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ---------- LES ACTIONS ---------- */}
          <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginTop: "24px" }}>
            {!fige && (
              <button onClick={() => agir({ action: "emettre", id: doc.id }, "emettre")} disabled={occupe !== ""} style={PLEIN}>
                {occupe === "emettre" ? "Émission…" : "Émettre le " + type.nom.toLowerCase()}
              </button>
            )}
            {doc.type === "devis" && fige && doc.statut !== "refuse" && (
              <>
                <button onClick={() => agir({ action: "convertir", id: doc.id }, "conv")} disabled={occupe !== ""} style={PLEIN}>
                  Transformer en facture
                </button>
                <button onClick={() => agir({ action: "refuser", id: doc.id }, "ref")} style={BOUTON}>
                  Marquer refusé
                </button>
              </>
            )}
            {doc.type === "facture" && fige && doc.statut !== "paye" && (
              <button onClick={() => setReglement({ montant: doc.reste_du, mode: "Virement", reference: "" })} style={PLEIN}>
                Enregistrer un règlement
              </button>
            )}
            {doc.type === "facture" && fige && (
              <button onClick={() => agir({ action: "avoir", id: doc.id }, "av")} style={{ ...BOUTON, color: ROUGE, borderColor: "rgba(232,131,106,0.4)" }}>
                Établir un avoir
              </button>
            )}
            {!fige && (
              <button onClick={() => agir({ action: "supprimer", id: doc.id }, "sup").then(() => setOuvert(null))} style={{ ...BOUTON, color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                Supprimer le brouillon
              </button>
            )}
          </div>

          {/* ---------- LES REGLEMENTS ---------- */}
          {(ouvert.reglements || []).length > 0 && (
            <>
              <h2 style={{ color: OR, fontSize: "15px", letterSpacing: "2px", margin: "30px 0 12px" }}>
                LES RÈGLEMENTS
              </h2>
              {(ouvert.reglements || []).map(function (r: any) {
                return (
                  <div key={r.id} style={{ ...CARTE, padding: "11px 15px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.75)" }}>
                      {jolieDate(r.date_reglement)}
                      {r.mode ? " · " + r.mode : ""}
                      {r.reference ? " · " + r.reference : ""}
                    </span>
                    <span style={{ color: VERT, fontWeight: "bold" }}>{euros(r.montant)}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ---------- LA LIGNE EN SAISIE ---------- */}
        {ligne && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50 }}>
            <div style={{ background: "#12121f", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "12px", padding: "22px", maxWidth: "560px", width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
              <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "16px" }}>
                {ligne.id ? "MODIFIER LA LIGNE" : "NOUVELLE LIGNE"}
              </div>

              <label style={LABEL}>Désignation *</label>
              <input value={ligne.designation || ""} onChange={(e) => setLigne({ ...ligne, designation: e.target.value })}
                style={{ ...CHAMP, marginBottom: "12px" }} />

              <label style={LABEL}>Détail (facultatif)</label>
              <textarea value={ligne.detail || ""} onChange={(e) => setLigne({ ...ligne, detail: e.target.value })}
                rows={2} style={{ ...CHAMP, marginBottom: "12px", resize: "vertical" }} />

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 100px" }}>
                  <label style={LABEL}>Quantité</label>
                  <input type="number" step="0.01" value={ligne.quantite}
                    onChange={(e) => setLigne({ ...ligne, quantite: e.target.value })}
                    style={{ ...CHAMP, marginBottom: "12px" }} />
                </div>
                <div style={{ flex: "1 1 90px" }}>
                  <label style={LABEL}>Unité</label>
                  <input value={ligne.unite || ""} onChange={(e) => setLigne({ ...ligne, unite: e.target.value })}
                    placeholder="h, jour, pièce" style={{ ...CHAMP, marginBottom: "12px" }} />
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <label style={LABEL}>Prix unitaire HT</label>
                  <input type="number" step="0.01" value={ligne.prix_unitaire}
                    onChange={(e) => setLigne({ ...ligne, prix_unitaire: e.target.value })}
                    style={{ ...CHAMP, marginBottom: "12px" }} />
                </div>
                <div style={{ flex: "1 1 100px" }}>
                  <label style={LABEL}>Remise %</label>
                  <input type="number" step="0.01" value={ligne.remise_pct}
                    onChange={(e) => setLigne({ ...ligne, remise_pct: e.target.value })}
                    style={{ ...CHAMP, marginBottom: "12px" }} />
                </div>
              </div>

              <label style={LABEL}>Taux de TVA</label>
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "16px" }}>
                {TAUX.map(function (t) {
                  const actif = Number(ligne.taux_tva) === t;
                  return (
                    <button key={t} onClick={() => setLigne({ ...ligne, taux_tva: t })}
                      disabled={doc.autoliquidation}
                      style={{
                        ...BOUTON, padding: "7px 15px",
                        background: actif ? OR : BOUTON.background,
                        color: actif ? "#050508" : (doc.autoliquidation ? "rgba(255,255,255,0.3)" : OR),
                        border: actif ? "none" : BOUTON.border,
                        fontWeight: actif ? "bold" : "normal",
                        cursor: doc.autoliquidation ? "not-allowed" : "pointer",
                      }}>
                      {t} %
                    </button>
                  );
                })}
              </div>
              {doc.autoliquidation && (
                <p style={{ color: ORANGE, fontSize: "12px", lineHeight: "1.7", margin: "-8px 0 16px" }}>
                  Autoliquidation : la TVA reste à zéro, c'est le preneur qui la liquide.
                </p>
              )}

              <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                <button onClick={enregistrerLigne} disabled={occupe !== ""} style={{ ...PLEIN, flex: "2 1 180px" }}>
                  {occupe === "ligne" ? "Enregistrement…" : "Enregistrer la ligne"}
                </button>
                <button onClick={() => setLigne(null)} style={{ ...BOUTON, flex: "1 1 110px", borderRadius: "8px", padding: "12px" }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------- LE REGLEMENT ---------- */}
        {reglement && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50 }}>
            <div style={{ background: "#12121f", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "12px", padding: "22px", maxWidth: "460px", width: "100%" }}>
              <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "16px" }}>
                ENREGISTRER UN RÈGLEMENT
              </div>

              <label style={LABEL}>Montant</label>
              <input type="number" step="0.01" value={reglement.montant}
                onChange={(e) => setReglement({ ...reglement, montant: e.target.value })}
                style={{ ...CHAMP, marginBottom: "12px" }} />

              <label style={LABEL}>Mode de règlement</label>
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "12px" }}>
                {MODES.map(function (m) {
                  const actif = reglement.mode === m;
                  return (
                    <button key={m} onClick={() => setReglement({ ...reglement, mode: m })}
                      style={{
                        ...BOUTON, padding: "7px 14px",
                        background: actif ? OR : BOUTON.background,
                        color: actif ? "#050508" : OR,
                        border: actif ? "none" : BOUTON.border,
                        fontWeight: actif ? "bold" : "normal",
                      }}>
                      {m}
                    </button>
                  );
                })}
              </div>

              <label style={LABEL}>Référence (facultative)</label>
              <input value={reglement.reference || ""} onChange={(e) => setReglement({ ...reglement, reference: e.target.value })}
                style={{ ...CHAMP, marginBottom: "16px" }} />

              <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                <button onClick={enregistrerReglement} disabled={occupe !== ""} style={{ ...PLEIN, flex: "2 1 180px" }}>
                  {occupe === "regl" ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button onClick={() => setReglement(null)} style={{ ...BOUTON, flex: "1 1 110px", borderRadius: "8px", padding: "12px" }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════ LA LISTE ═══════════
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>

      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <a href="/admin/compliance/tableau-de-bord" style={{ color: OR, fontSize: "13px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>
        <h1 style={{ color: OR, margin: "12px 0 0", fontSize: "24px" }}>🧾 Devis et factures</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0", fontSize: "13px" }}>
          Établir · émettre · suivre les règlements
        </p>
      </div>

      <div style={{ padding: "25px 20px", maxWidth: "1200px", margin: "0 auto" }}>

        {message && (
          <div style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: VERT, fontSize: "13px" }}>
            {message}
          </div>
        )}
        {erreur && (
          <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: ROUGE, fontSize: "13px" }}>
            {erreur}
          </div>
        )}

        {c && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {[
              { v: nombre(c.factures), t: "Factures", col: OR },
              { v: nombre(c.devis), t: "Devis", col: BLEU },
              { v: nombre(c.devis_en_attente), t: "Devis en attente", col: ORANGE },
              { v: nombre(c.impayes), t: "Impayés", col: ROUGE },
              { v: euros(c.montant_impaye), t: "Montant impayé", col: ROUGE },
              { v: euros(c.chiffre_affaires), t: "Chiffre d'affaires HT", col: VERT },
            ].map(function (x) {
              return (
                <div key={x.t} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: x.col }}>{x.v}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>{x.t}</div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "16px" }}>
          <button onClick={() => setCreation({ type: "devis", client_nom: "", client_email: "", objet: "" })} style={PLEIN}>
            ➕ Nouveau devis
          </button>
          <button onClick={() => setCreation({ type: "facture", client_nom: "", client_email: "", objet: "" })} style={PLEIN}>
            ➕ Nouvelle facture
          </button>
        </div>

        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "12px" }}>
          {FILTRES.map(function (f) {
            const actif = filtre === f.cle;
            return (
              <button key={f.cle || "tout"} onClick={() => setFiltre(f.cle)}
                style={{
                  ...BOUTON, padding: "6px 13px",
                  background: actif ? OR : "rgba(255,255,255,0.06)",
                  color: actif ? "#050508" : "rgba(255,255,255,0.6)",
                  border: actif ? "none" : BOUTON.border,
                  fontWeight: actif ? "bold" : "normal",
                }}>
                {f.nom}
              </button>
            );
          })}
        </div>

        <input
          value={cherche}
          onChange={(e) => setCherche(e.target.value)}
          placeholder="Client, numéro ou objet"
          style={{ ...CHAMP, marginBottom: "14px" }}
        />

        {charge && !d ? (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
        ) : listeFiltree.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
              Aucun document. Créez votre premier devis ou votre première facture.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", background: "#12121f" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "900px" }}>
              <thead>
                <tr>
                  <th style={TH}>Numéro</th>
                  <th style={TH}>Type</th>
                  <th style={TH}>Client</th>
                  <th style={TH}>Objet</th>
                  <th style={TH}>Date</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total TTC</th>
                  <th style={{ ...TH, textAlign: "right" }}>Reste dû</th>
                  <th style={TH}>État</th>
                  <th style={TH}></th>
                </tr>
              </thead>
              <tbody>
                {listeFiltree.map(function (x: any, i: number) {
                  const etat = ETATS[x.statut] || ETATS.brouillon;
                  const t = d.types[x.type] || d.types.facture;
                  return (
                    <tr key={x.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.022)" }}>
                      <td style={{ ...TD, color: "#fff", fontWeight: "bold", whiteSpace: "nowrap" }}>
                        {x.numero || <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: "normal" }}>brouillon</span>}
                      </td>
                      <td style={{ ...TD, whiteSpace: "nowrap" }}>{t.nom}</td>
                      <td style={{ ...TD, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{x.client_nom}</td>
                      <td style={{ ...TD, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", color: "rgba(255,255,255,0.55)" }}>
                        {x.objet || "—"}
                      </td>
                      <td style={{ ...TD, whiteSpace: "nowrap", color: "rgba(255,255,255,0.55)" }}>{jolieDate(x.date_emission)}</td>
                      <td style={{ ...TD, textAlign: "right", whiteSpace: "nowrap", color: "#fff" }}>{euros(x.total_ttc)}</td>
                      <td style={{ ...TD, textAlign: "right", whiteSpace: "nowrap", color: (Number(x.reste_du) || 0) > 0 ? ROUGE : "rgba(255,255,255,0.3)" }}>
                        {x.type === "facture" && x.numero ? euros(x.reste_du) : "—"}
                      </td>
                      <td style={{ ...TD, whiteSpace: "nowrap", color: etat.couleur }}>{etat.nom}</td>
                      <td style={{ ...TD, textAlign: "right" }}>
                        <button onClick={() => ouvrir(x.id)} style={{ ...BOUTON, padding: "5px 13px", fontSize: "12px" }}>
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- LA CREATION ---------- */}
      {creation && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50 }}>
          <div style={{ background: "#12121f", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "12px", padding: "22px", maxWidth: "560px", width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "6px" }}>
              NOUVEAU {creation.type === "devis" ? "DEVIS" : "FACTURE"}
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 18px" }}>
              Le document naît en brouillon, sans numéro. Vous ajoutez les lignes, puis vous
              l'émettez — c'est à ce moment que le numéro s'attribue.
            </p>

            <label style={LABEL}>Nom du client *</label>
            <input value={creation.client_nom} onChange={(e) => setCreation({ ...creation, client_nom: e.target.value })}
              style={{ ...CHAMP, marginBottom: "12px" }} />

            <label style={LABEL}>Adresse électronique</label>
            <input value={creation.client_email || ""} onChange={(e) => setCreation({ ...creation, client_email: e.target.value })}
              style={{ ...CHAMP, marginBottom: "12px" }} />

            <label style={LABEL}>Adresse</label>
            <input value={creation.client_adresse || ""} onChange={(e) => setCreation({ ...creation, client_adresse: e.target.value })}
              style={{ ...CHAMP, marginBottom: "12px" }} />

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 110px" }}>
                <label style={LABEL}>Code postal</label>
                <input value={creation.client_code_postal || ""} onChange={(e) => setCreation({ ...creation, client_code_postal: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "12px" }} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <label style={LABEL}>Ville</label>
                <input value={creation.client_ville || ""} onChange={(e) => setCreation({ ...creation, client_ville: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "12px" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 140px" }}>
                <label style={LABEL}>SIREN</label>
                <input value={creation.client_siren || ""} onChange={(e) => setCreation({ ...creation, client_siren: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "12px" }} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <label style={LABEL}>N° de TVA</label>
                <input value={creation.client_tva || ""} onChange={(e) => setCreation({ ...creation, client_tva: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "12px" }} />
              </div>
            </div>

            <label style={LABEL}>Objet</label>
            <input value={creation.objet || ""} onChange={(e) => setCreation({ ...creation, objet: e.target.value })}
              style={{ ...CHAMP, marginBottom: "14px" }} />

            <button onClick={() => setCreation({ ...creation, autoliquidation: !creation.autoliquidation })}
              style={{ ...BOUTON, width: "100%", marginBottom: "8px", background: creation.autoliquidation ? "rgba(232,163,61,0.15)" : BOUTON.background, color: creation.autoliquidation ? ORANGE : OR }}>
              {creation.autoliquidation ? "✓ Autoliquidation de la TVA" : "TVA facturée normalement"}
            </button>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.7", margin: "0 0 16px" }}>
              L'autoliquidation ne s'applique qu'à un preneur assujetti, et son numéro de TVA
              devient obligatoire.
            </p>

            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              <button onClick={creer} disabled={occupe !== "" || !creation.client_nom} style={{ ...PLEIN, flex: "2 1 180px", opacity: creation.client_nom ? 1 : 0.4 }}>
                {occupe === "creer" ? "Création…" : "Créer le brouillon"}
              </button>
              <button onClick={() => setCreation(null)} style={{ ...BOUTON, flex: "1 1 110px", borderRadius: "8px", padding: "12px" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
