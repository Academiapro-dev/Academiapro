"use client";
import { useState, useEffect } from "react";
import Guide from "../../../components/Guide";

const LIBELLE_C: any = {
  "1": "1 \u00b7 Entreprises pour la formation de leurs salari\u00e9s",
  "2a": "2a \u00b7 Contrats d'apprentissage",
  "2b": "2b \u00b7 Contrats de professionnalisation",
  "2c": "2c \u00b7 Promotion ou reconversion par alternance",
  "2d": "2d \u00b7 Projets de transition professionnelle",
  "2e": "2e \u00b7 Compte personnel de formation",
  "2f": "2f \u00b7 Dispositifs personnes en recherche d'emploi",
  "2g": "2g \u00b7 Dispositifs travailleurs non salari\u00e9s",
  "2h": "2h \u00b7 Plan de d\u00e9veloppement des comp\u00e9tences",
  "3": "3 \u00b7 Pouvoirs publics pour leurs agents",
  "4": "4 \u00b7 Instances europ\u00e9ennes",
  "5": "5 \u00b7 \u00c9tat",
  "6": "6 \u00b7 Conseils r\u00e9gionaux",
  "7": "7 \u00b7 France Travail",
  "8": "8 \u00b7 Autres ressources publiques",
  "9": "9 \u00b7 Personnes \u00e0 titre individuel et \u00e0 leurs frais",
  "10": "10 \u00b7 Autres organismes de formation",
  "11": "11 \u00b7 Autres produits",
};

const LIBELLE_F1: any = {
  a: "a \u00b7 Salari\u00e9s d'employeurs priv\u00e9s hors apprentis",
  b: "b \u00b7 Apprentis",
  c: "c \u00b7 Personnes en recherche d'emploi",
  d: "d \u00b7 Particuliers \u00e0 leurs propres frais",
  e: "e \u00b7 Autres stagiaires",
};

const LIBELLE_F3: any = {
  a: "a \u00b7 Formations visant un titre enregistr\u00e9 au RNCP",
  b: "b \u00b7 Formations visant une certification au r\u00e9pertoire sp\u00e9cifique",
  c: "c \u00b7 CQP non enregistr\u00e9",
  d: "d \u00b7 Autres formations professionnelles",
  e: "e \u00b7 Bilans de comp\u00e9tences",
  f: "f \u00b7 Accompagnement \u00e0 la VAE",
};

// LES SPECIALITES NSF DU CADRE F-4 — ajout du 01/09.
//
// Ce cadre etait le seul appele sans table de libelles : il affichait le
// code nu — « 413 » — au milieu de cadres qui donnent tous le code ET son
// intitule. L organisme qui recopie son bilan ne connait pas les codes par
// coeur : les nommer est precisement le service rendu. Meme table que
// l ecran « Mes formations », a l identique.
const LIBELLE_F4: any = {
  "326": "326 \u00b7 Informatique, num\u00e9rique, intelligence artificielle",
  "320": "320 \u00b7 Communication, image, multim\u00e9dia",
  "312": "312 \u00b7 Commerce, vente, marketing",
  "310": "310 \u00b7 Gestion, management, entreprise",
  "313": "313 \u00b7 Finance, banque, assurance",
  "314": "314 \u00b7 Comptabilit\u00e9, gestion financi\u00e8re",
  "315": "315 \u00b7 Ressources humaines",
  "128": "128 \u00b7 Droit, sciences politiques",
  "331": "331 \u00b7 Sant\u00e9, soins",
  "332": "332 \u00b7 Travail social, accompagnement",
  "333": "333 \u00b7 Enseignement, formation",
  "334": "334 \u00b7 Accueil, h\u00f4tellerie, tourisme, restauration",
  "336": "336 \u00b7 Coiffure, esth\u00e9tique, bien-\u00eatre corporel",
  "136": "136 \u00b7 Langues vivantes",
  "135": "135 \u00b7 Langues et civilisations anciennes",
  "413": "413 \u00b7 D\u00e9veloppement personnel, relationnel, gestion du stress",
  "414": "414 \u00b7 Organisation, gestion du temps, m\u00e9thodes de travail",
  "411": "411 \u00b7 Pratiques sportives",
  "343": "343 \u00b7 Nettoyage, s\u00e9curit\u00e9, services aux personnes",
  "230": "230 \u00b7 B\u00e2timent, travaux publics",
  "200": "200 \u00b7 Technologies industrielles",
};

// 🆕 `sans_plan` AJOUTE LE 03/09, EN MEME TEMPS QUE LE CALCUL DES HEURES.
//
// La route renvoie desormais cette cle quand une inscription porte sur une
// formation dont le plan de modules est vide : les heures suivies ne
// peuvent pas y etre mesurees, et c est la duree prevue qui est retenue.
// Sans libelle, l ecran aurait affiche « sans_plan » en brut.
//
// ⚠️ TOUTE NOUVELLE CLE DE `a_completer` DOIT ETRE AJOUTEE ICI, sans quoi
// elle s affichera telle quelle a l organisme.
const LIBELLE_MANQUE: any = {
  sans_dispositif: "sans dispositif de financement",
  sans_statut: "sans statut de stagiaire",
  sans_prix: "sans prix de vente",
  sans_formation: "sans formation rattach\u00e9e",
  sans_duree: "sans dur\u00e9e connue",
  sans_code_nsf: "sans code de sp\u00e9cialit\u00e9",
  sans_plan: "sur une formation sans plan de modules \u00b7 dur\u00e9e pr\u00e9vue retenue",
};

export default function PageBilan() {
  const [d, setD] = useState<any>(null);
  const [annee, setAnnee] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [pdfEnCours, setPdfEnCours] = useState(false);

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

  // LE PDF. Un organisme ne recopie pas des chiffres depuis un ecran : il
  // imprime son etat, le pose a cote du clavier, et remplit le formulaire
  // en ligne cadre par cadre.
  async function telecharger() {
    setPdfEnCours(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/bilan/pdf" + suffixe(annee));

      if (!r.ok) {
        let detail = "code " + r.status;
        try {
          const j = await r.json();
          detail = j.erreur || detail;
        } catch (e) {}
        setErreur("G\u00e9n\u00e9ration impossible : " + detail);
        setPdfEnCours(false);
        return;
      }

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bilan_pedagogique_" + annee + ".pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setErreur("G\u00e9n\u00e9ration impossible : " + String(e));
    }
    setPdfEnCours(false);
  }

  function euros(n: number) {
    return (Number(n) || 0).toLocaleString("fr-FR") + " \u20ac";
  }

  // Les heures peuvent porter une decimale depuis le 03/09 : le calcul
  // rapporte la duree aux modules valides. « 7,5 » et non « 7.5 ».
  function heures(n: any) {
    const v = Math.round((Number(n) || 0) * 10) / 10;
    return v.toLocaleString("fr-FR");
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

  const PLEIN: any = {
    background: "#c8a96e",
    color: "#050508",
    border: "none",
    padding: "13px 28px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
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
                {v.stagiaires}{" stagiaire(s) \u00b7 "}{heures(v.heures)}{" h"}
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

  // L ECART ENTRE PREVU ET SUIVI. Il n est montre que s il existe : sur un
  // organisme dont tous les parcours sont acheves, les deux chiffres sont
  // egaux et la mention n aurait rien a dire.
  const ecart = d
    && typeof d.heures_theoriques === "number"
    && d.heures_theoriques > (Number(d.heures_total) || 0);

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          {"\u2190 Retour au tableau de bord"}
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CERFA 10443*17
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          {"Bilan p\u00e9dagogique et financier"}
        </h1>

        <div style={{ marginTop: "18px" }}>
          <Guide ecran="organisme.bilan" />
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", margin: "18px 0 24px", flexWrap: "wrap" }}>
          <button onClick={() => charger(annee - 1)} style={BOUTON}>{"\u2190 "}{annee - 1}</button>
          <span style={{ color: "#c8a96e", fontSize: "19px", fontWeight: "bold" }}>{annee}</span>
          <button onClick={() => charger(annee + 1)} style={BOUTON}>{annee + 1}{" \u2192"}</button>

          <button onClick={telecharger} disabled={pdfEnCours || !d} style={{ ...PLEIN, opacity: pdfEnCours || !d ? 0.5 : 1 }}>
            {pdfEnCours ? "G\u00e9n\u00e9ration\u2026" : "T\u00e9l\u00e9charger le bilan"}
          </button>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>{"Calcul en cours\u2026"}</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ ...CARTE, background: "rgba(200,169,110,0.06)" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                {d.avertissement}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "10px 0 0" }}>
                {"T\u00e9l\u00e9d\u00e9claration sur monactiviteformation.emploi.gouv.fr, avant le 30 avril."}
              </p>
            </div>

            {manques.length > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
                <h2 style={{ color: "#e8836a", fontSize: "17px", margin: "0 0 12px" }}>
                  {"\u00c0 compl\u00e9ter avant de d\u00e9clarer"}
                </h2>
                {manques.map(function (k) {
                  return (
                    <p key={k} style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "0 0 6px" }}>
                      {d.a_completer[k]}{" inscription(s) "}{LIBELLE_MANQUE[k] || k}
                    </p>
                  );
                })}
                <a href="/organisme/stagiaires" style={{ color: "#c8a96e", fontSize: "14px" }}>
                  {"Compl\u00e9ter le registre des stagiaires"}
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
                  {heures(d.heures_total)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  {"Heures suivies"}
                </p>
                {ecart && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "6px 0 0" }}>
                    {heures(d.heures_theoriques)}{" h pr\u00e9vues au programme"}
                  </p>
                )}
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

            {/* 🆕 03/09 : LE SENS DU CHIFFRE, DIT A L ORGANISME.
                Les heures declarees sont celles reellement suivies, et non
                la duree des programmes. Sans cette phrase, un organisme qui
                voyait 3 h la ou sa formation en annonce 120 croyait a une
                panne, et aurait pu recopier la duree du programme dans sa
                declaration. */}
            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.75" }}>
                {"Les heures compt\u00e9es sont celles r\u00e9ellement suivies : la dur\u00e9e de chaque "}
                {"formation est rapport\u00e9e aux modules valid\u00e9s dans l'ann\u00e9e. Un parcours "}
                {"en cours ou interrompu ne compte donc que pour ce qui a \u00e9t\u00e9 fait \u2014 c'est "}
                {"ce que le formulaire attend."}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", margin: 0, lineHeight: "1.75" }}>
                {"Un parcours ouvert une ann\u00e9e et poursuivi la suivante appara\u00eet dans les "}
                {"deux bilans : ses heures dans celui o\u00f9 elles ont \u00e9t\u00e9 suivies, son produit "}
                {"dans celui de l'inscription."}
              </p>
            </div>

            {d.inscriptions_reportees > 0 && (
              <div style={{ ...CARTE, background: "rgba(76,175,80,0.05)", border: "1px solid rgba(76,175,80,0.3)" }}>
                <p style={{ color: "#4caf50", fontSize: "14px", margin: 0, lineHeight: "1.75" }}>
                  {d.inscriptions_reportees}
                  {" parcours ouvert(s) une ann\u00e9e ant\u00e9rieure ont \u00e9t\u00e9 poursuivis en "}
                  {annee}{". Leurs heures sont compt\u00e9es ici ; leur produit a \u00e9t\u00e9 d\u00e9clar\u00e9 "}
                  {"l'ann\u00e9e de l'inscription."}
                </p>
              </div>
            )}

            {bloc("Cadre C \u00b7 Origine des produits hors taxes", d.cadre_c, LIBELLE_C, true)}

            {d.cadre_c_total_2 && d.cadre_c_total_2.montant > 0 && (
              <div style={{ ...CARTE, marginTop: "-6px" }}>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0 }}>
                  {"Ligne 2 \u00b7 Total des produits provenant des organismes gestionnaires (lignes 2a \u00e0 2h) : "}
                  <strong style={{ color: "#c8a96e" }}>{euros(d.cadre_c_total_2.montant)}</strong>
                </p>
              </div>
            )}

            {bloc("Cadre F-1 \u00b7 Type de stagiaires", d.cadre_f1, LIBELLE_F1, false)}
            {bloc("Cadre F-3 \u00b7 Objectif g\u00e9n\u00e9ral des prestations", d.cadre_f3, LIBELLE_F3, false)}
            {bloc("Cadre F-4 \u00b7 Sp\u00e9cialit\u00e9s de formation", d.cadre_f4, LIBELLE_F4, false)}

            <div style={CARTE}>
              <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 12px" }}>
                {"Cadre B \u00b7 Formation \u00e0 distance"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0 }}>
                {"R\u00e9pondre OUI : les formations sont dispens\u00e9es en ligne, en tout ou partie."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
