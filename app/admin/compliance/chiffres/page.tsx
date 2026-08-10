"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const NOIR = "#050508";
const VERT = "#4caf50";
const ROUGE = "#e8836a";

// LE TABLEAU DE BORD.
//
// Ce que le comptable regarde AVANT d ouvrir un dossier : ce qui entre,
// ce qui sort, ce qui reste. L autre page — celle des alertes — dit ce
// qu il faut FAIRE ; celle-ci dit ou l on EN EST.
//
// Les deux ne se confondent pas, et les melanger produirait un ecran que
// personne ne lit.

export default function PageChiffres() {
  const [d, setD] = useState<any>(null);
  const [dossier, setDossier] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(function () { charger(dossier); }, [dossier]);

  async function charger(id: string) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/chiffres" + (id ? "?societe_id=" + id : ""), { cache: "no-store" });
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible.");
    }
    setChargement(false);
  }

  const CADRE: any = { minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "22px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }

  function moisLisible(m: string) {
    const noms = ["janv.", "févr.", "mars", "avril", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    const p = String(m).split("-");
    if (p.length < 2) return m;
    return noms[Number(p[1]) - 1] + " " + p[0].slice(2);
  }

  // Un chiffre isole ne dit rien : c est la couleur et le libelle qui le
  // rendent lisible d un coup d oeil.
  function Chiffre({ titre, valeur, couleur, note }: any) {
    return (
      <div style={{ ...CARTE, flex: "1 1 210px", marginBottom: 0 }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 8px" }}>{titre}</p>
        <p style={{ color: couleur || "#fff", fontSize: "26px", fontWeight: "bold", margin: 0, lineHeight: "1.2" }}>
          {euros(valeur)}
        </p>
        {note && (
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "8px 0 0", lineHeight: "1.6" }}>
            {note}
          </p>
        )}
      </div>
    );
  }

  const vue = d && d.dossiers && d.dossiers.length === 1 ? d.dossiers[0] : null;
  const chiffres = vue || (d && d.total) || null;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        <a href="/admin/compliance/tableau-de-bord" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Ce qui réclame votre attention
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Tableau de bord</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Ce qui entre, ce qui sort, ce qui reste
        </p>

        {d && d.tous && d.tous.length > 1 && (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: OR, fontSize: "13px", margin: "0 0 8px" }}>Dossier</p>
            <select value={dossier} onChange={function (e) { setDossier(e.target.value); }} style={CHAMP}>
              <option value="">Tous les dossiers — vue d'ensemble</option>
              {d.tous.map(function (s: any) {
                return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
              })}
            </select>
          </div>
        )}

        {erreur && <p style={{ color: ROUGE, fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Calcul en cours…</p>
          </div>
        ) : !chiffres ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun dossier actif. Ouvrez-en un pour commencer.
            </p>
          </div>
        ) : (
          <>
            {vue && (
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "24px 0 14px" }}>
                {vue.nom} · {vue.lignes} ligne(s) d'écriture
              </p>
            )}

            {/* CE QUI ENTRE, CE QUI SORT, CE QUI RESTE. */}
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "20px 0" }}>
              <Chiffre
                titre="Chiffre d'affaires"
                valeur={chiffres.chiffre_affaires}
                couleur={OR}
                note="Produits de l'exercice, comptes de classe 7"
              />
              <Chiffre
                titre="Charges"
                valeur={chiffres.charges}
                note="Dépenses de l'exercice, comptes de classe 6"
              />
              <Chiffre
                titre="Résultat"
                valeur={chiffres.resultat}
                couleur={chiffres.resultat >= 0 ? VERT : ROUGE}
                note={chiffres.resultat >= 0 ? "Bénéfice" : "Perte"}
              />
            </div>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "0 0 20px" }}>
              <Chiffre
                titre="Trésorerie"
                valeur={chiffres.tresorerie}
                couleur={chiffres.tresorerie >= 0 ? "#fff" : ROUGE}
                note="Solde des comptes de banque et de caisse"
              />
              <Chiffre
                titre="Créances clients"
                valeur={chiffres.clients}
                note="Ce qui reste à encaisser"
              />
              <Chiffre
                titre="Dettes fournisseurs"
                valeur={chiffres.fournisseurs}
                note="Ce qui reste à payer"
              />
            </div>

            {/* LE MOIS PAR MOIS. Un chiffre annuel ne montre pas une derive ;
                douze chiffres la rendent evidente. */}
            {vue && vue.mois && vue.mois.length > 0 && (
              <div style={CARTE}>
                <h2 style={{ color: "#fff", fontSize: "18px", margin: "0 0 4px" }}>Mois par mois</h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "0 0 18px" }}>
                  Les douze derniers mois mouvementés
                </p>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "460px" }}>
                    <thead>
                      <tr style={{ color: OR, fontSize: "12.5px" }}>
                        <th style={{ textAlign: "left", padding: "8px 10px 12px 0", fontWeight: "normal" }}>Mois</th>
                        <th style={{ textAlign: "right", padding: "8px 10px 12px", fontWeight: "normal" }}>Produits</th>
                        <th style={{ textAlign: "right", padding: "8px 10px 12px", fontWeight: "normal" }}>Charges</th>
                        <th style={{ textAlign: "right", padding: "8px 0 12px 10px", fontWeight: "normal" }}>Résultat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vue.mois.map(function (m: any) {
                        return (
                          <tr key={m.mois} style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                            <td style={{ padding: "11px 10px 11px 0", color: "rgba(255,255,255,0.75)" }}>
                              {moisLisible(m.mois)}
                            </td>
                            <td style={{ padding: "11px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>
                              {euros(m.produits)}
                            </td>
                            <td style={{ padding: "11px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>
                              {euros(m.charges)}
                            </td>
                            <td style={{ padding: "11px 0 11px 10px", textAlign: "right", color: m.resultat >= 0 ? VERT : ROUGE, fontWeight: "bold" }}>
                              {euros(m.resultat)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!vue && d.dossiers && d.dossiers.length > 1 && (
              <div style={CARTE}>
                <h2 style={{ color: "#fff", fontSize: "18px", margin: "0 0 18px" }}>Par dossier</h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "560px" }}>
                    <thead>
                      <tr style={{ color: OR, fontSize: "12.5px" }}>
                        <th style={{ textAlign: "left", padding: "8px 10px 12px 0", fontWeight: "normal" }}>Dossier</th>
                        <th style={{ textAlign: "right", padding: "8px 10px 12px", fontWeight: "normal" }}>Chiffre d'affaires</th>
                        <th style={{ textAlign: "right", padding: "8px 10px 12px", fontWeight: "normal" }}>Charges</th>
                        <th style={{ textAlign: "right", padding: "8px 10px 12px", fontWeight: "normal" }}>Résultat</th>
                        <th style={{ textAlign: "right", padding: "8px 0 12px 10px", fontWeight: "normal" }}>Trésorerie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.dossiers.map(function (s: any) {
                        return (
                          <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                            <td style={{ padding: "12px 10px 12px 0" }}>
                              <a href={"/admin/compliance/chiffres?societe_id=" + s.id} onClick={function (e) { e.preventDefault(); setDossier(s.id); }} style={{ color: "#fff", textDecoration: "none" }}>
                                {s.nom}
                              </a>
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>{euros(s.chiffre_affaires)}</td>
                            <td style={{ padding: "12px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>{euros(s.charges)}</td>
                            <td style={{ padding: "12px 10px", textAlign: "right", color: s.resultat >= 0 ? VERT : ROUGE, fontWeight: "bold" }}>{euros(s.resultat)}</td>
                            <td style={{ padding: "12px 0 12px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>{euros(s.tresorerie)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
                Ces montants sont calculés depuis les écritures saisies. Ils valent ce que
                vaut la saisie : une pièce non comptabilisée n'y figure pas. Ils ne
                remplacent ni la balance ni le compte de résultat définitif.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
