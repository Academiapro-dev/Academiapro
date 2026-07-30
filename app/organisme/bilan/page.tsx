"use client";
import { useState, useEffect } from "react";

const LIBELLE_C: any = {
  "1": "1 · Entreprises pour la formation de leurs salaries",
  "2a": "2a · Contrats d apprentissage",
  "2b": "2b · Contrats de professionnalisation",
  "2c": "2c · Promotion ou reconversion par alternance",
  "2d": "2d · Projets de transition professionnelle",
  "2e": "2e · Compte personnel de formation",
  "2f": "2f · Dispositifs personnes en recherche d emploi",
  "2g": "2g · Dispositifs travailleurs non salaries",
  "2h": "2h · Plan de developpement des competences",
  "3": "3 · Pouvoirs publics pour leurs agents",
  "4": "4 · Instances europeennes",
  "5": "5 · Etat",
  "6": "6 · Conseils regionaux",
  "7": "7 · France Travail",
  "8": "8 · Autres ressources publiques",
  "9": "9 · Personnes a titre individuel et a leurs frais",
  "10": "10 · Autres organismes de formation",
  "11": "11 · Autres produits",
};

const LIBELLE_F1: any = {
  a: "a · Salaries d employeurs prives hors apprentis",
  b: "b · Apprentis",
  c: "c · Personnes en recherche d emploi",
  d: "d · Particuliers a leurs propres frais",
  e: "e · Autres stagiaires",
};

const LIBELLE_F3: any = {
  a: "a · Formations visant un titre enregistre au RNCP",
  b: "b · Formations visant une certification au repertoire specifique",
  c: "c · CQP non enregistre",
  d: "d · Autres formations professionnelles",
  e: "e · Bilans de competences",
  f: "f · Accompagnement a la VAE",
};

const LIBELLE_MANQUE: any = {
  sans_dispositif: "sans dispositif de financement",
  sans_statut: "sans statut de stagiaire",
  sans_prix: "sans prix de vente",
  sans_formation: "sans formation rattachee",
  sans_duree: "sans duree connue",
  sans_code_nsf: "sans code de specialite",
};

export default function PageBilan() {
  const [d, setD] = useState<any>(null);
  const [annee, setAnnee] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger(0);
  }, []);

  function suffixe(a: number) {
    let s = "";
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      if (t) s = "tenant=" + t;
    } catch {}
    if (a) s = s ? s + "&annee=" + a : "annee=" + a;
    return s ? "?" + s : "";
  }

  async function charger(a: number) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/bilan" + suffixe(a));
      const data = await r.json();
      if (data.ok) {
        setD(data);
        setAnnee(data.annee);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function euros(n: number) {
    return (Number(n) || 0).toLocaleString("fr-FR") + " EUR";
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
    padding: "22px 26px",
    marginBottom: "18px",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "9px 20px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Georgia,serif",
  };

  function bloc(titre: string, contenu: any, libelles: any, avecMontant: boolean) {
    const cles = Object.keys(contenu || {}).sort();
    if (cles.length === 0) return null;
    return (
      <div style={CARTE}>
        <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 16px" }}>{titre}</h2>
        {cles.map(function (k) {
          const v = contenu[k];
          return (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", flex: "1 1 260px" }}>
                {libelles[k] || k}
              </span>
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>
                {v.stagiaires} stagiaire(s) · {v.heures} h
              </span>
              {avecMontant && (
                <span style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "bold", minWidth: "110px", textAlign: "right" }}>
                  {euros(v.montant)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const manques = d && d.a_completer
    ? Object.keys(d.a_completer).filter(function (k) { return d.a_completer[k] > 0; })
    : [];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CERFA 10443*17
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Bilan pedagogique et financier
        </h1>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", margin: "18px 0 24px", flexWrap: "wrap" }}>
          <button onClick={() => charger(annee - 1)} style={BOUTON}>← {annee - 1}</button>
          <span style={{ color: "#c8a96e", fontSize: "19px", fontWeight: "bold" }}>{annee}</span>
          <button onClick={() => charger(annee + 1)} style={BOUTON}>{annee + 1} →</button>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Calcul en cours...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ ...CARTE, background: "rgba(200,169,110,0.06)" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                {d.avertissement}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "10px 0 0" }}>
                Teledeclaration sur monactiviteformation.emploi.gouv.fr, avant le 30 avril.
              </p>
            </div>

            {manques.length > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
                <h2 style={{ color: "#e8836a", fontSize: "17px", margin: "0 0 12px" }}>
                  A completer avant de declarer
                </h2>
                {manques.map(function (k) {
                  return (
                    <p key={k} style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "0 0 6px" }}>
                      {d.a_completer[k]} inscription(s) {LIBELLE_MANQUE[k] || k}
                    </p>
                  );
                })}
                <a href="/organisme/stagiaires" style={{ color: "#c8a96e", fontSize: "14px" }}>
                  Completer le registre des stagiaires
                </a>
              </div>
            )}

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.stagiaires_distincts}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Stagiaires distincts</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.heures_total}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Heures suivies</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {euros(d.produits_total)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Total des produits (cadre C)
                </p>
              </div>
            </div>

            {bloc("Cadre C · Origine des produits hors taxes", d.cadre_c, LIBELLE_C, true)}

            {d.cadre_c_total_2 && d.cadre_c_total_2.montant > 0 && (
              <div style={{ ...CARTE, marginTop: "-6px" }}>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0 }}>
                  Ligne 2 · Total des produits provenant des organismes gestionnaires (lignes 2a a 2h) :{" "}
                  <strong style={{ color: "#c8a96e" }}>{euros(d.cadre_c_total_2.montant)}</strong>
                </p>
              </div>
            )}

            {bloc("Cadre F-1 · Type de stagiaires", d.cadre_f1, LIBELLE_F1, false)}
            {bloc("Cadre F-3 · Objectif general des prestations", d.cadre_f3, LIBELLE_F3, false)}
            {bloc("Cadre F-4 · Specialites de formation", d.cadre_f4, {}, false)}

            <div style={CARTE}>
              <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 12px" }}>
                Cadre B · Formation a distance
              </h2>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0 }}>
                Repondre OUI : les formations sont dispensees en ligne, en tout ou partie.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
