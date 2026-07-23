"use client";

import { useEffect, useState } from "react";

const STYLE_CHAMP = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 15,
  background: "#ffffff",
  color: "#1a1a1a",
  marginBottom: 16,
};

const STYLE_LIBELLE = {
  display: "block",
  fontWeight: "bold" as const,
  marginBottom: 6,
  color: "#0a3d2e",
};

const STYLE_BOUTON = {
  background: "#0a3d2e",
  color: "#ffffff",
  border: "none",
  padding: "12px 24px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 15,
};

const STYLE_CARTE = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
  background: "#ffffff",
};

export default function MonOrganisme() {
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [existe, setExiste] = useState(false);

  const [raisonSociale, setRaisonSociale] = useState("");
  const [numeroDa, setNumeroDa] = useState("");
  const [actionFormation, setActionFormation] = useState(true);
  const [actionApprentissage, setActionApprentissage] = useState(false);
  const [actionVae, setActionVae] = useState(false);
  const [actionBilan, setActionBilan] = useState(false);
  const [certifiantes, setCertifiantes] = useState(false);
  const [sousTraitance, setSousTraitance] = useState(false);
  const [afest, setAfest] = useState(false);
  const [dateAudit, setDateAudit] = useState("");
  const [certificateur, setCertificateur] = useState("");
  const [notes, setNotes] = useState("");

  async function charger() {
    setChargement(true);
    setErreur(null);
    try {
      const r = await fetch("/api/qualiopi/organisme");
      const data = await r.json();
      if (!data.ok) {
        setErreur(data.erreur || "Erreur de chargement");
      } else if (data.existe && data.organisme) {
        const o = data.organisme;
        setExiste(true);
        setRaisonSociale(o.raison_sociale || "");
        setNumeroDa(o.numero_da || "");
        setActionFormation(o.action_formation === true);
        setActionApprentissage(o.action_apprentissage === true);
        setActionVae(o.action_vae === true);
        setActionBilan(o.action_bilan === true);
        setCertifiantes(o.formations_certifiantes === true);
        setSousTraitance(o.recours_sous_traitance === true);
        setAfest(o.afest === true);
        setDateAudit(o.date_audit_prevue || "");
        setCertificateur(o.certificateur || "");
        setNotes(o.notes || "");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  async function enregistrer() {
    setEnregistrement(true);
    setMessage(null);
    setErreur(null);
    try {
      const r = await fetch("/api/qualiopi/organisme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raison_sociale: raisonSociale,
          numero_da: numeroDa,
          action_formation: actionFormation,
          action_apprentissage: actionApprentissage,
          action_vae: actionVae,
          action_bilan: actionBilan,
          formations_certifiantes: certifiantes,
          recours_sous_traitance: sousTraitance,
          afest: afest,
          date_audit_prevue: dateAudit || null,
          certificateur: certificateur,
          notes: notes,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setExiste(true);
        setMessage("Profil enregistre.");
      } else {
        setErreur(data.erreur || "Erreur inconnue");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setEnregistrement(false);
  }

  const ligneCase = (
    valeur: boolean,
    setter: (v: boolean) => void,
    texte: string,
    aide?: string
  ) => (
    <div style={{ marginBottom: 12 }}>
      <span
        onClick={() => setter(!valeur)}
        style={{ cursor: "pointer", display: "flex", alignItems: "flex-start" }}
      >
        <input
          type="checkbox"
          checked={valeur}
          onChange={() => setter(!valeur)}
          style={{ marginRight: 10, marginTop: 4, width: 18, height: 18 }}
        />
        <span>
          <strong>{texte}</strong>
          {aide && (
            <span style={{ display: "block", fontSize: 13, color: "#666" }}>
              {aide}
            </span>
          )}
        </span>
      </span>
    </div>
  );

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#ffffff",
        color: "#1a1a1a",
        minHeight: "100vh",
        colorScheme: "light",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
        <h1
          style={{
            color: "#0a3d2e",
            borderBottom: "3px solid #0a3d2e",
            paddingBottom: 10,
          }}
        >
          Mon organisme de formation
        </h1>

        <p style={{ fontSize: 15, color: "#555" }}>
          Ces informations determinent les indicateurs du referentiel qui vous
          seront presentes. Un organisme de formation classique en valide 23 ;
          un centre de formation d'apprentis peut aller jusqu'a 32.
        </p>

        {chargement && <p>Chargement...</p>}

        {!chargement && (
          <>
            <div style={STYLE_CARTE}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
                Identification
              </h2>

              <span style={STYLE_LIBELLE}>Raison sociale</span>
              <input
                type="text"
                value={raisonSociale}
                onChange={(e) => setRaisonSociale(e.target.value)}
                style={STYLE_CHAMP}
              />

              <span style={STYLE_LIBELLE}>
                Numero de declaration d'activite
              </span>
              <input
                type="text"
                value={numeroDa}
                onChange={(e) => setNumeroDa(e.target.value)}
                placeholder="11 chiffres"
                style={STYLE_CHAMP}
              />
            </div>

            <div style={STYLE_CARTE}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
                Types d'action realises
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginTop: 0 }}>
                Cochez tout ce qui s'applique. Au moins un choix est necessaire.
              </p>

              {ligneCase(
                actionFormation,
                setActionFormation,
                "Actions de formation continue",
                "Le cas le plus courant"
              )}
              {ligneCase(
                actionApprentissage,
                setActionApprentissage,
                "Formation par apprentissage",
                "Ajoute les indicateurs propres aux CFA : 13, 14, 15, 20, 28, 29"
              )}
              {ligneCase(
                actionVae,
                setActionVae,
                "Validation des acquis de l'experience"
              )}
              {ligneCase(
                actionBilan,
                setActionBilan,
                "Bilans de competences"
              )}
            </div>

            <div style={STYLE_CARTE}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
                Situations particulieres
              </h2>

              {ligneCase(
                certifiantes,
                setCertifiantes,
                "Vous preparez a des certifications",
                "Ajoute les indicateurs 3, 7 et 16"
              )}
              {ligneCase(
                sousTraitance,
                setSousTraitance,
                "Vous faites appel a des formateurs externes ou a la sous-traitance",
                "Ajoute l'indicateur 27"
              )}
              {ligneCase(
                afest,
                setAfest,
                "Vous realisez des actions de formation en situation de travail (AFEST)",
                "Ajoute les indicateurs 13 et 28"
              )}
            </div>

            <div style={STYLE_CARTE}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
                Audit (facultatif)
              </h2>

              <span style={STYLE_LIBELLE}>Date d'audit prevue</span>
              <input
                type="date"
                value={dateAudit}
                onChange={(e) => setDateAudit(e.target.value)}
                style={STYLE_CHAMP}
              />

              <span style={STYLE_LIBELLE}>Organisme certificateur</span>
              <input
                type="text"
                value={certificateur}
                onChange={(e) => setCertificateur(e.target.value)}
                style={STYLE_CHAMP}
              />

              <span style={STYLE_LIBELLE}>Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={STYLE_CHAMP}
              />
            </div>

            <button
              onClick={enregistrer}
              disabled={enregistrement}
              style={STYLE_BOUTON}
            >
              {enregistrement
                ? "Enregistrement..."
                : existe
                ? "Mettre a jour mon profil"
                : "Enregistrer mon profil"}
            </button>

            {message && (
              <p style={{ marginTop: 16, color: "#0a3d2e", fontWeight: "bold" }}>
                {message}
              </p>
            )}
            {erreur && (
              <p style={{ marginTop: 16, color: "#c62828" }}>{erreur}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
