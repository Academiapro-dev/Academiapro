"use client";
import { useState, useEffect } from "react";

// 🆕 30/09 — LES OUTILS RANGES EN CHAPITRES (decision de Jacques).
// Une rangee de chapitres ; on en touche un, ses outils se deroulent,
// par ordre alphabetique. « Controler » et « Arreter » ne font plus qu un
// chapitre : c est le meme travail de fin d exercice.
const CHAPITRES = [
  {
    titre: "Tenir",
    portes: [
      ["/admin/compliance/reprise", "Reprise de dossier"],
      ["/admin/compliance/saisie", "Saisie"],
      ["/admin/compliance/comptes", "Plan comptable"],
      ["/admin/compliance/releve", "Relevés"],
      ["/admin/compliance/rapprochement", "Rapprochement"],
      ["/admin/compliance/lettrage", "Lettrage"],
      ["/admin/compliance/pieces", "Pièces"],
    ],
  },
  {
    titre: "Paie",
    portes: [
      ["/admin/compliance/bulletins-paie", "Bulletins de paie"],
      ["/admin/compliance/dsn", "DSN"],
      ["/admin/compliance/paie", "Écriture de paie"],
    ],
  },
  {
    titre: "Contrôler et arrêter",
    portes: [
      ["/admin/compliance/revision", "Révision"],
      ["/admin/compliance/balance", "Balance et journal"],
      ["/admin/compliance/liasse-2033", "Liasse 2033"],
      ["/admin/compliance/liasse-2050", "Liasse 2050"],
      ["/admin/compliance/annexes", "Annexes"],
      ["/admin/compliance/immobilisations", "Immobilisations"],
      ["/admin/compliance/provisions", "Provisions"],
      ["/admin/compliance/cloture", "Clôture"],
      ["/admin/compliance/verrouillage", "Verrouillage et audit"],
    ],
  },
  {
    titre: "Déclarer",
    portes: [
      ["/admin/compliance/tva", "TVA"],
      ["/admin/compliance/liasse-2065", "Impôt sur les sociétés (2065)"],
      ["/admin/compliance/das2", "DAS2"],
    ],
  },
];

// L ordre alphabetique a l interieur d un chapitre (accents compris :
// « Écriture » se range a E).
function trier(portes: any[]) {
  return portes.slice().sort(function (a: any, b: any) {
    return String(a[1]).localeCompare(String(b[1]), "fr", { sensitivity: "base" });
  });
}

const EXPORTS = [
  ["balance", "Balance"],
  ["grand-livre", "Grand livre"],
  ["journal", "Journal"],
  ["plan", "Plan comptable"],
];

// Valeurs de secours utilisees TANT QUE les donnees ne sont pas chargees.
// Le formulaire d ouverture s affiche avant la garde de chargement : sans
// cela, l ecran casse des qu on l ouvre trop tot.
const FISCAUX_DEFAUT: any = { is: "IS" };
const TVA_DEFAUT: any = { reel_normal: "Réel normal" };
const PAYS_DEFAUT: any = { FR: "France" };

export default function PageSocietes() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [fiche, setFiche] = useState<any>({});
  const [deroule, setDeroule] = useState<any>({});

  const [neuf, setNeuf] = useState<any>({
    code: "", raison_sociale: "", siren: "", forme: "", pays: "FR",
    regime_fiscal: "is", regime_tva: "reel_normal",
    siret: "", code_ape: "", adresse: "", code_postal: "", ville: "", code_insee: "",
    effectif: "", idcc: "", spst_identifiant: "", contact_nom: "", contact_tel: "", contact_email: "",
    exercice_debut: "", exercice_fin: "", expert_responsable: "",
  });

  useEffect(function () { charger(); }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/societes");
      const data = await r.json();
      if (!data.ok) { setErreur(data.erreur || "Lecture impossible."); setChargement(false); return; }
      setD(data);
      const f: any = {};
      for (const s of data.societes || []) {
        f[s.id] = {
          raison_sociale: s.raison_sociale || "", siren: s.siren || "", forme: s.forme || "",
          pays: s.pays || "FR",
          regime_fiscal: s.regime_fiscal || "a_determiner", regime_tva: s.regime_tva || "reel_normal",
          exercice_debut: s.exercice_debut || "", exercice_fin: s.exercice_fin || "",
          adresse: s.adresse || "", email_contact: s.email_contact || "",
          expert_responsable: s.expert_responsable || "", notes: s.notes || "",
          siret: s.siret || "", code_ape: s.code_ape || "", code_postal: s.code_postal || "",
          ville: s.ville || "", code_insee: s.code_insee || "",
          effectif: s.effectif === null || s.effectif === undefined ? "" : String(s.effectif),
          idcc: s.idcc === null || s.idcc === undefined ? "" : String(s.idcc),
          spst_identifiant: s.spst_identifiant || "", contact_nom: s.contact_nom || "",
          contact_tel: s.contact_tel || "", contact_email: s.contact_email || "",
        };
      }
      setFiche(f);
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function envoyer(corps: any, quoi: string) {
    setOccupe(quoi);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/societes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message || "Dossier enregistré.");
        if (!corps.id) {
          setNeuf({ code: "", raison_sociale: "", siren: "", forme: "", pays: "FR", regime_fiscal: "is", regime_tva: "reel_normal", exercice_debut: "", exercice_fin: "", expert_responsable: "", siret: "", code_ape: "", adresse: "", code_postal: "", ville: "", code_insee: "", effectif: "", idcc: "", spst_identifiant: "", contact_nom: "", contact_tel: "", contact_email: "" });
          setFormulaire(false);
        }
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  // Une seule source pour les libelles ET pour les cles. Les listes
  // deroulantes ne lisent plus jamais d directement.
  const FISCAUX: any = (d && d.regimes_fiscaux) ? d.regimes_fiscaux : FISCAUX_DEFAUT;
  const TVA: any = (d && d.regimes_tva) ? d.regimes_tva : TVA_DEFAUT;
  const PAYS: any = (d && d.pays) ? d.pays : PAYS_DEFAUT;

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const LIEN: any = { color: "#c8a96e", fontSize: "12.5px", textDecoration: "none", border: "1px solid rgba(200,169,110,0.35)", padding: "6px 13px", borderRadius: "20px" };

  const CHAPITRE: any = { background: "none", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "9px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif" };
  const CHAPITRE_ACTIF: any = { ...CHAPITRE, background: "#c8a96e", color: "#050508", border: "1px solid #c8a96e", fontWeight: "bold" };
  const PANNEAU: any = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px", marginTop: "10px", padding: "10px", border: "1px solid rgba(200,169,110,0.35)", borderRadius: "10px", background: "rgba(200,169,110,0.05)" };
  const OUTIL: any = { display: "block", color: "#fff", fontSize: "14px", textDecoration: "none", padding: "11px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };

  // Une rangee de chapitres ; le chapitre touche se deroule dessous, un seul
  // a la fois. « cle » distingue le haut de page et chaque carte de dossier.
  function rangeeChapitres(cle: string, liste: any[], apres?: any) {
    const actif = deroule[cle] || "";
    const choisi = liste.find(function (c: any) { return c.titre === actif; });
    return (
      <div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {liste.map(function (c: any) {
            const estActif = c.titre === actif;
            return (
              <button
                key={c.titre}
                type="button"
                aria-expanded={estActif}
                onClick={() => setDeroule({ ...deroule, [cle]: estActif ? "" : c.titre })}
                style={estActif ? CHAPITRE_ACTIF : CHAPITRE}
              >
                {c.titre}
                <span aria-hidden="true" style={{ fontSize: "11px", marginLeft: "7px" }}>{estActif ? "▴" : "▾"}</span>
              </button>
            );
          })}
          {apres}
        </div>
        {choisi && (
          <div style={PANNEAU}>
            {trier(choisi.portes).map(function (p: any) {
              return <a key={p[0]} href={p[0]} style={OUTIL}>{p[1]}</a>;
            })}
          </div>
        )}
      </div>
    );
  }

  function ch(id: string, cle: string) { return (fiche[id] && fiche[id][cle]) || ""; }
  function poser(id: string, cle: string, v: string) {
    setFiche({ ...fiche, [id]: { ...(fiche[id] || {}), [cle]: v } });
  }
  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  const CHAMPS_FICHE = [
    ["raison_sociale", "Raison sociale"], ["siren", "SIREN (déduit du SIRET s'il est saisi)"], ["forme", "Forme"],
    ["email_contact", "Courriel du client"],
    ["expert_responsable", "Expert responsable"],
  ];

  // 🆕 29/09 — L IDENTITE D EMPLOYEUR, un seul bloc pour l ouverture et pour
  // la fiche. Le bulletin imprime le SIRET, le code APE et l adresse ; la DSN
  // ne se genere pas sans SIRET. La route controle chaque champ.
  const CHAMPS_EMPLOYEUR: any[] = [
    ["siret", "SIRET de l'établissement (14 chiffres)", "1 1 220px", ""],
    ["code_ape", "Code APE", "1 1 120px", "6920Z"],
    ["adresse", "Adresse (numéro et rue)", "1 1 100%", ""],
    ["code_postal", "Code postal", "1 1 110px", ""],
    ["ville", "Ville", "1 1 200px", ""],
    ["code_insee", "Code INSEE de la commune", "1 1 160px", "ce n'est pas le code postal"],
    ["effectif", "Effectif", "1 1 100px", ""],
    ["idcc", "Convention collective (IDCC)", "1 1 170px", "1486"],
    ["spst_identifiant", "Service de santé au travail (identifiant)", "1 1 240px", ""],
    ["contact_nom", "Contact pour la DSN : nom", "1 1 200px", ""],
    ["contact_tel", "Téléphone", "1 1 150px", ""],
    ["contact_email", "Courriel", "1 1 220px", ""],
  ];
  function blocEmployeur(valeur: (cle: string) => string, changer: (cle: string, v: string) => void) {
    return (
      <div style={{ margin: "4px 0 14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ color: "#c8a96e", fontSize: "11.5px", letterSpacing: "2px", margin: "0 0 4px" }}>
          L&apos;EMPLOYEUR — POUR LA PAIE ET LA DSN
        </p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", margin: "0 0 12px", lineHeight: 1.6 }}>
          Le bulletin imprime ces informations, et la DSN ne peut pas être produite sans le SIRET.
          Un dossier sans salarié peut les laisser vides.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {CHAMPS_EMPLOYEUR.map(function (c: any) {
            return (
              <div key={c[0]} style={{ flex: c[2] }}>
                <span style={LIBELLE}>{c[1]}</span>
                <input value={valeur(c[0])} placeholder={c[3]} style={CHAMP}
                  inputMode={c[0] === "siret" || c[0] === "code_postal" || c[0] === "effectif" || c[0] === "idcc" ? "numeric" : undefined}
                  onChange={(e) => changer(c[0], e.target.value)} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      {/* Sur iPad, un champ date garde une largeur minimale propre et deborde
          de sa colonne : on la leve, et on aligne la date a gauche comme les
          autres champs. */}
      <style>{`
        .mc-date { -webkit-appearance: none; appearance: none; min-width: 0; min-height: 41px; display: block; color-scheme: dark; }
        .mc-date::-webkit-date-and-time-value { text-align: left; margin: 0; }
      `}</style>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/tableau-de-bord" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Dossiers comptables</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Une société, un dossier, des écritures cloisonnées
        </p>

        <a
          href="/admin/compliance/tableau-de-bord"
          style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 24px", borderRadius: "20px", textDecoration: "none", fontSize: "14.5px", fontWeight: "bold", margin: "22px 0 8px" }}
        >
          Ce qui vous attend →
        </a>

        <div style={{ margin: "16px 0" }}>
          {rangeeChapitres(
            "haut",
            CHAPITRES,
            <a href="/admin/compliance/collaborateurs" style={{ ...CHAPITRE, textDecoration: "none", display: "inline-block" }}>Collaborateurs</a>
          )}

          <button
            onClick={() => setFormulaire(!formulaire)}
            style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "10px 20px", borderRadius: "20px", cursor: "pointer", fontSize: "13.5px", fontFamily: "Georgia,serif", fontWeight: "bold", marginTop: "18px" }}
          >
            {formulaire ? "Annuler" : "Ouvrir un dossier"}
          </button>
        </div>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                <span style={LIBELLE}>Raison sociale</span>
                <input value={neuf.raison_sociale} onChange={(e) => setNeuf({ ...neuf, raison_sociale: e.target.value })} placeholder="Dupont Conseil SARL" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <span style={LIBELLE}>Code du dossier</span>
                <input value={neuf.code} onChange={(e) => setNeuf({ ...neuf, code: e.target.value })} placeholder="DUPONT" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <span style={LIBELLE}>Pays</span>
                <select value={neuf.pays} onChange={(e) => setNeuf({ ...neuf, pays: e.target.value })} style={CHAMP}>
                  {Object.keys(PAYS).map(function (k) {
                    return <option key={k} value={k}>{PAYS[k]}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>SIREN</span>
                <input value={neuf.siren} placeholder="déduit du SIRET" onChange={(e) => setNeuf({ ...neuf, siren: e.target.value })} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Forme</span>
                <input value={neuf.forme} onChange={(e) => setNeuf({ ...neuf, forme: e.target.value })} placeholder="SARL" style={CHAMP} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Régime fiscal</span>
                <select value={neuf.regime_fiscal} onChange={(e) => setNeuf({ ...neuf, regime_fiscal: e.target.value })} style={CHAMP}>
                  {Object.keys(FISCAUX).map(function (k) {
                    return <option key={k} value={k}>{FISCAUX[k]}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Régime de TVA</span>
                <select value={neuf.regime_tva} onChange={(e) => setNeuf({ ...neuf, regime_tva: e.target.value })} style={CHAMP}>
                  {Object.keys(TVA).map(function (k) {
                    return <option key={k} value={k}>{TVA[k]}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "1 1 150px", minWidth: 0 }}>
                <span style={LIBELLE}>Ouverture</span>
                <input type="date" className="mc-date" value={neuf.exercice_debut} onChange={(e) => setNeuf({ ...neuf, exercice_debut: e.target.value })} style={{ ...CHAMP, minWidth: 0 }} />
              </div>
              <div style={{ flex: "1 1 150px", minWidth: 0 }}>
                <span style={LIBELLE}>Clôture</span>
                <input type="date" className="mc-date" value={neuf.exercice_fin} onChange={(e) => setNeuf({ ...neuf, exercice_fin: e.target.value })} style={{ ...CHAMP, minWidth: 0 }} />
              </div>
            </div>

            {blocEmployeur(
              function (cle: string) { return (neuf as any)[cle] || ""; },
              function (cle: string, v: string) { setNeuf({ ...neuf, [cle]: v }); }
            )}

            <button
              onClick={() => envoyer(neuf, "creation")}
              disabled={occupe !== "" || neuf.raison_sociale.trim().length < 2}
              style={{ background: occupe !== "" || neuf.raison_sociale.trim().length < 2 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "creation" ? "Ouverture…" : "Ouvrir le dossier"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Ouverture des dossiers…</p></div>
        ) : !d ? null : (
          <>
            {d.ecritures_orphelines > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.55)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.ecritures_orphelines} ligne(s) d&apos;écriture ne sont rattachées à aucun dossier :
                  elles n&apos;apparaîtront dans aucun FEC ni aucune liasse.
                </p>
              </div>
            )}

            {d.societes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun dossier. Ouvrez-en un pour commencer.
                </p>
              </div>
            ) : (
              d.societes.map(function (s: any) {
                const estOuvert = ouvert[s.id] === true;
                const alerte = s.lignes > 0 && !s.equilibre;
                const q = "?societe_id=" + s.id;
                const pays = s.pays || "FR";
                const francais = pays === "FR";
                return (
                  <div key={s.id} style={{ ...CARTE, border: alerte ? "1px solid rgba(232,131,106,0.5)" : CARTE.border, opacity: s.actif ? 1 : 0.6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: "1 1 280px" }}>
                        <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                          {s.code}
                          {!francais ? " · " + (s.pays_nom || pays) : ""}
                          {/* UN SIREN NE SE RECLAME QU A UNE SOCIETE FRANCAISE :
                              une LLC americaine n est pas au registre francais. */}
                          {s.siren ? " · SIREN " + s.siren : (francais ? " · SIREN manquant" : "")}
                          {s.forme ? " · " + s.forme : ""}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{s.raison_sociale}</h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {s.regime_fiscal_nom} · {s.regime_tva_nom}
                          {s.exercice_debut ? " · du " + new Date(s.exercice_debut).toLocaleDateString("fr-FR") : ""}
                          {s.exercice_fin ? " au " + new Date(s.exercice_fin).toLocaleDateString("fr-FR") : ""}
                        </p>
                        <div style={{ display: "flex", gap: "7px", marginTop: "10px", flexWrap: "wrap" }}>
                          <button onClick={() => setOuvert({ ...ouvert, [s.id]: !estOuvert })} style={{ ...LIEN, background: "none", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                            {estOuvert ? "Fermer la fiche" : "Sa fiche"}
                          </button>
                          <a href={"/admin/compliance/collaborateurs" + q} style={LIEN}>Collaborateurs</a>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 2px" }}>{s.lignes}</p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>ligne(s) d'écriture</p>
                      </div>
                    </div>

                    {s.lignes > 0 && (
                      <p style={{ color: s.equilibre ? "#4caf50" : "#e8836a", fontSize: "13.5px", margin: "10px 0 0" }}>
                        {s.equilibre ? "Équilibre : " + euros(s.debit) : "DÉSÉQUILIBRE : débit " + euros(s.debit) + ", crédit " + euros(s.credit)}
                      </p>
                    )}

                    <div style={{ marginTop: "16px" }}>
                      {rangeeChapitres(
                        s.id,
                        CHAPITRES.map(function (c: any) {
                          return { titre: c.titre, portes: c.portes.map(function (p: any) { return [p[0] + q, p[1]]; }) };
                        }).concat([{
                          titre: "Exporter",
                          portes: EXPORTS.map(function (x: any) {
                            return ["/api/compliance/export?societe_id=" + s.id + "&quoi=" + x[0], x[1]];
                          }).concat([["/api/compliance/fec?societe=" + s.code, "FEC"]]),
                        }])
                      )}
                    </div>

                    {estOuvert && (
                      <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        {CHAMPS_FICHE.map(function (c: any) {
                          return (
                            <div key={c[0]}>
                              <span style={LIBELLE}>{c[1]}</span>
                              <input value={ch(s.id, c[0])} onChange={(e) => poser(s.id, c[0], e.target.value)} style={CHAMP} />
                            </div>
                          );
                        })}

                        {blocEmployeur(
                          function (cle: string) { return ch(s.id, cle); },
                          function (cle: string, v: string) { poser(s.id, cle, v); }
                        )}

                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <div style={{ flex: "1 1 180px" }}>
                            <span style={LIBELLE}>Pays</span>
                            <select value={ch(s.id, "pays") || "FR"} onChange={(e) => poser(s.id, "pays", e.target.value)} style={CHAMP}>
                              {Object.keys(PAYS).map(function (k) {
                                return <option key={k} value={k}>{PAYS[k]}</option>;
                              })}
                            </select>
                          </div>
                          <div style={{ flex: "1 1 200px" }}>
                            <span style={LIBELLE}>Régime fiscal</span>
                            <select value={ch(s.id, "regime_fiscal")} onChange={(e) => poser(s.id, "regime_fiscal", e.target.value)} style={CHAMP}>
                              {Object.keys(FISCAUX).map(function (k) {
                                return <option key={k} value={k}>{FISCAUX[k]}</option>;
                              })}
                            </select>
                          </div>
                          <div style={{ flex: "1 1 200px" }}>
                            <span style={LIBELLE}>Régime de TVA</span>
                            <select value={ch(s.id, "regime_tva")} onChange={(e) => poser(s.id, "regime_tva", e.target.value)} style={CHAMP}>
                              {Object.keys(TVA).map(function (k) {
                                return <option key={k} value={k}>{TVA[k]}</option>;
                              })}
                            </select>
                          </div>
                          <div style={{ flex: "1 1 150px", minWidth: 0 }}>
                            <span style={LIBELLE}>Ouverture</span>
                            <input type="date" className="mc-date" value={ch(s.id, "exercice_debut")} onChange={(e) => poser(s.id, "exercice_debut", e.target.value)} style={{ ...CHAMP, minWidth: 0 }} />
                          </div>
                          <div style={{ flex: "1 1 150px", minWidth: 0 }}>
                            <span style={LIBELLE}>Clôture</span>
                            <input type="date" className="mc-date" value={ch(s.id, "exercice_fin")} onChange={(e) => poser(s.id, "exercice_fin", e.target.value)} style={{ ...CHAMP, minWidth: 0 }} />
                          </div>
                        </div>

                        <span style={LIBELLE}>Notes du dossier</span>
                        <textarea value={ch(s.id, "notes")} onChange={(e) => poser(s.id, "notes", e.target.value)} rows={3} style={CHAMP} />

                        <button
                          onClick={() => envoyer({ id: s.id, ...(fiche[s.id] || {}) }, "maj-" + s.id)}
                          disabled={occupe !== ""}
                          style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                        >
                          {occupe === "maj-" + s.id ? "Enregistrement…" : "Enregistrer le dossier"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
