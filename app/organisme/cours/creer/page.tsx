"use client";
import { useState } from "react";

const SPECIALITES = [
  { code: "", nom: "— choisir la specialite —" },
  { code: "326", nom: "Informatique, numerique, intelligence artificielle" },
  { code: "320", nom: "Communication, image, multimedia" },
  { code: "312", nom: "Commerce, vente, marketing" },
  { code: "310", nom: "Gestion, management, entreprise" },
  { code: "313", nom: "Finance, banque, assurance" },
  { code: "314", nom: "Comptabilite, gestion financiere" },
  { code: "315", nom: "Ressources humaines" },
  { code: "128", nom: "Droit, sciences politiques" },
  { code: "331", nom: "Sante, soins" },
  { code: "332", nom: "Travail social, accompagnement" },
  { code: "333", nom: "Enseignement, formation" },
  { code: "334", nom: "Accueil, hotellerie, tourisme, restauration" },
  { code: "336", nom: "Coiffure, esthetique, bien-etre corporel" },
  { code: "136", nom: "Langues vivantes" },
  { code: "413", nom: "Developpement personnel, relationnel, gestion du stress" },
  { code: "414", nom: "Organisation, gestion du temps, methodes de travail" },
  { code: "343", nom: "Nettoyage, securite, services aux personnes" },
  { code: "230", nom: "Batiment, travaux publics" },
  { code: "200", nom: "Technologies industrielles" },
];

export default function PageCreerCours() {
  const [titre, setTitre] = useState("");
  const [domaine, setDomaine] = useState("");
  const [duree, setDuree] = useState("14");
  const [prix, setPrix] = useState("");
  const [chapitres, setChapitres] = useState("4");
  const [publicCible, setPublicCible] = useState("");
  const [precisions, setPrecisions] = useState("");
  const [nsf, setNsf] = useState("");

  const [occupe, setOccupe] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [erreur, setErreur] = useState("");

  function suffixe(sep: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? sep + "tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function construire() {
    if (titre.trim().length < 5) {
      setErreur("Donnez un intitule un peu plus precis.");
      return;
    }
    setOccupe(true);
    setErreur("");
    setResultat(null);
    try {
      const r = await fetch("/api/organisme/generer-plan" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: titre,
          domaine: domaine,
          duree: duree,
          prix: prix,
          chapitres: chapitres,
          public_cible: publicCible,
          precisions: precisions,
          code_nsf: nsf,
        }),
      });
      const data = await r.json();
      if (data.ok) setResultat(data);
      else setErreur(data.erreur || "Construction impossible.");
    } catch (e: any) {
      setErreur("Construction impossible : " + String(e));
    }
    setOccupe(false);
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

  const CHAMP: any = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    lineHeight: "1.7",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "14px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "6px",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <a href={"/organisme/cours" + suffixe("?")} style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour a mes formations
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CREATION ASSISTEE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Construire une formation</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: "1.7" }}>
          Decrivez ce que vous voulez enseigner : le plan se construit, les modules apparaissent,
          vous n avez plus qu a les rediger — ou les faire rediger.
        </p>

        {resultat ? (
          <div style={{ ...CARTE, marginTop: "26px", border: "2px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "19px", fontWeight: "bold", margin: "0 0 10px" }}>
              {resultat.cours.code} · {resultat.cours.titre}
            </p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", margin: "0 0 18px", lineHeight: "1.75" }}>
              {resultat.chapitres} chapitres, {resultat.modules} modules. Les modules sont crees
              vides : ouvrez l editeur pour les rediger un par un, ou demandez a l assistant de le
              faire pour vous.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <a
                href={"/organisme/cours/" + resultat.cours.id + suffixe("?")}
                style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}
              >
                Ouvrir l editeur →
              </a>
              <button
                onClick={() => { setResultat(null); setTitre(""); setPrecisions(""); }}
                style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "13px 26px", borderRadius: "8px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif" }}
              >
                En construire une autre
              </button>
            </div>
          </div>
        ) : (
          <div style={{ ...CARTE, marginTop: "26px" }}>
            <span style={LIBELLE}>Que voulez-vous enseigner ?</span>
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Gestes et postures pour les operateurs de production"
              style={CHAMP}
            />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Domaine</span>
                <input value={domaine} onChange={(e) => setDomaine(e.target.value)} placeholder="Securite" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 110px" }}>
                <span style={LIBELLE}>Duree (h)</span>
                <input value={duree} onChange={(e) => setDuree(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 110px" }}>
                <span style={LIBELLE}>Chapitres</span>
                <input value={chapitres} onChange={(e) => setChapitres(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 110px" }}>
                <span style={LIBELLE}>Prix (EUR)</span>
                <input value={prix} onChange={(e) => setPrix(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <span style={LIBELLE}>Specialite · remplit le cadre F-4 de votre bilan</span>
            <select value={nsf} onChange={(e) => setNsf(e.target.value)} style={CHAMP}>
              {SPECIALITES.map(function (s) {
                return <option key={s.code} value={s.code}>{s.nom}</option>;
              })}
            </select>

            <span style={LIBELLE}>Pour qui ?</span>
            <input
              value={publicCible}
              onChange={(e) => setPublicCible(e.target.value)}
              placeholder="Interimaires affectes en atelier, sans experience prealable"
              style={CHAMP}
            />

            <span style={LIBELLE}>Ce que vous voulez absolument y voir figurer</span>
            <textarea
              value={precisions}
              onChange={(e) => setPrecisions(e.target.value)}
              rows={5}
              placeholder={"Vos contraintes, votre secteur, vos machines, vos procedures internes.\n\nPlus vous en dites, plus le plan vous ressemblera."}
              style={CHAMP}
            />

            <button
              onClick={construire}
              disabled={occupe || titre.trim().length < 5}
              style={{ background: occupe || titre.trim().length < 5 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || titre.trim().length < 5 ? "#8a8a8a" : "#050508", padding: "16px 30px", borderRadius: "8px", border: "none", cursor: occupe || titre.trim().length < 5 ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe ? "Construction du plan..." : "Construire le plan"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              Comptez une minute. Le plan reste modifiable ensuite : vous pouvez renommer,
              ajouter ou supprimer des modules avant de rediger.
            </p>
          </div>
        )}

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.55)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>{erreur}</p>
          </div>
        )}

        <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
            La formation est creee en brouillon : vos stagiaires ne la voient pas tant que vous ne
            l avez pas publiee. Le dernier module de chaque chapitre est une evaluation, avec son
            questionnaire.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.8" }}>
            Elle vous appartient entierement : aucune part n est due sur les formations que vous
            creez.
          </p>
        </div>
      </div>
    </div>
  );
}
