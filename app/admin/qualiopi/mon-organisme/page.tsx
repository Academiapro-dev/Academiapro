"use client";

import { useEffect, useState } from "react";
import Guide from "../../../../components/Guide";

const STYLE_CHAMP = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 15,
  background: "#ffffff",
  color: "#1a1a1a",
  marginBottom: 16,
  boxSizing: "border-box" as const,
};

const STYLE_LIBELLE = {
  display: "block",
  fontWeight: "bold" as const,
  marginBottom: 6,
  color: "#0a3d2e",
};

const STYLE_AIDE = {
  display: "block",
  fontSize: 13,
  color: "#666",
  marginTop: -12,
  marginBottom: 12,
  lineHeight: 1.6,
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
  const [dateDeclaration, setDateDeclaration] = useState("");

  // La fiche administrative. Sans SIRET ni adresse, aucune facture
  // reguliere n est possible ; sans representant legal, aucun document du
  // referentiel ne peut porter de signature.
  const [siret, setSiret] = useState("");
  const [numeroTva, setNumeroTva] = useState("");
  const [formeJuridique, setFormeJuridique] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [telephone, setTelephone] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [representantNom, setRepresentantNom] = useState("");
  const [representantQualite, setRepresentantQualite] = useState("");
  const [effectif, setEffectif] = useState("");

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
        setDateDeclaration(o.date_declaration || "");
        setSiret(o.siret || "");
        setNumeroTva(o.numero_tva || "");
        setFormeJuridique(o.forme_juridique || "");
        setAdresse(o.adresse || "");
        setCodePostal(o.code_postal || "");
        setVille(o.ville || "");
        setTelephone(o.telephone || "");
        setEmailContact(o.email_contact || "");
        setSiteWeb(o.site_web || "");
        setRepresentantNom(o.representant_nom || "");
        setRepresentantQualite(o.representant_qualite || "");
        setEffectif(o.effectif ? String(o.effectif) : "");
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
          date_declaration: dateDeclaration || null,
          siret: siret,
          numero_tva: numeroTva,
          forme_juridique: formeJuridique,
          adresse: adresse,
          code_postal: codePostal,
          ville: ville,
          pays: "FR",
          telephone: telephone,
          email_contact: emailContact,
          site_web: siteWeb,
          representant_nom: representantNom,
          representant_qualite: representantQualite,
          effectif: effectif ? Number(effectif) : null,
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
        setMessage("Profil enregistré.");
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

        {/* Ecran sur fond clair : le guide prend le vert de Mr. Qualiopi. */}
        <div style={{ marginTop: 20 }}>
          <Guide ecran="qualiopi.mon-organisme" couleur="#0a3d2e" fond="clair" />
        </div>

        <p style={{ fontSize: 15, color: "#555", lineHeight: 1.7 }}>
          Ces informations déterminent les indicateurs du référentiel qui vous
          seront présentés. Un organisme de formation classique en valide 23 ;
          un centre de formation d'apprentis peut aller jusqu'à 32.
        </p>

        {chargement && <p>Chargement…</p>}

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

              <span style={STYLE_LIBELLE}>Forme juridique</span>
              <input
                type="text"
                value={formeJuridique}
                onChange={(e) => setFormeJuridique(e.target.value)}
                placeholder="SARL, SAS, association, entreprise individuelle…"
                style={STYLE_CHAMP}
              />

              <span style={STYLE_LIBELLE}>SIRET</span>
              <input
                type="text"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                placeholder="14 chiffres"
                style={STYLE_CHAMP}
              />
              <span style={STYLE_AIDE}>
                Il figure sur vos documents contractuels et sur vos factures.
              </span>

              <span style={STYLE_LIBELLE}>Numéro de TVA intracommunautaire</span>
              <input
                type="text"
                value={numeroTva}
                onChange={(e) => setNumeroTva(e.target.value)}
                placeholder="FR00000000000"
                style={STYLE_CHAMP}
              />

              <span style={STYLE_LIBELLE}>Numéro de déclaration d'activité</span>
              <input
                type="text"
                value={numeroDa}
                onChange={(e) => setNumeroDa(e.target.value)}
                placeholder="11 chiffres"
                style={STYLE_CHAMP}
              />
              <span style={STYLE_AIDE}>
                Délivré par le préfet de région. Cet enregistrement ne vaut pas
                agrément de l'État, et cette mention doit figurer sur vos documents.
              </span>

              <span style={STYLE_LIBELLE}>Date de déclaration</span>
              <input
                type="date"
                value={dateDeclaration}
                onChange={(e) => setDateDeclaration(e.target.value)}
                style={STYLE_CHAMP}
              />

              <span style={STYLE_LIBELLE}>Effectif</span>
              <input
                type="number"
                value={effectif}
                onChange={(e) => setEffectif(e.target.value)}
                placeholder="Nombre de personnes"
                style={STYLE_CHAMP}
              />
            </div>

            <div style={STYLE_CARTE}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
                Adresse et contact
              </h2>

              <span style={STYLE_LIBELLE}>Adresse</span>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="12 rue de la Formation"
                style={STYLE_CHAMP}
              />

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: "0 0 140px" }}>
                  <span style={STYLE_LIBELLE}>Code postal</span>
                  <input
                    type="text"
                    value={codePostal}
                    onChange={(e) => setCodePostal(e.target.value)}
                    style={STYLE_CHAMP}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={STYLE_LIBELLE}>Ville</span>
                  <input
                    type="text"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    style={STYLE_CHAMP}
                  />
                </div>
              </div>

              <span style={STYLE_LIBELLE}>Téléphone</span>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                style={STYLE_CHAMP}
              />

              <span style={STYLE_LIBELLE}>Adresse électronique de contact</span>
              <input
                type="email"
                value={emailContact}
                onChange={(e) => setEmailContact(e.target.value)}
                style={STYLE_CHAMP}
              />

              <span style={STYLE_LIBELLE}>Site internet</span>
              <input
                type="text"
                value={siteWeb}
                onChange={(e) => setSiteWeb(e.target.value)}
                placeholder="monorganisme.fr"
                style={STYLE_CHAMP}
              />
              <span style={STYLE_AIDE}>
                L'auditeur ira le consulter : c'est là que se vérifie le critère 1.
              </span>
            </div>

            <div style={STYLE_CARTE}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
                Représentant légal
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginTop: 0, lineHeight: 1.7 }}>
                Le référentiel réclame plusieurs documents signés : règlement
                intérieur, procédure de réclamation, livret d'accueil. C'est ce nom
                qui y figurera.
              </p>

              <span style={STYLE_LIBELLE}>Nom et prénom</span>
              <input
                type="text"
                value={representantNom}
                onChange={(e) => setRepresentantNom(e.target.value)}
                style={STYLE_CHAMP}
              />

              <span style={STYLE_LIBELLE}>Qualité</span>
              <input
                type="text"
                value={representantQualite}
                onChange={(e) => setRepresentantQualite(e.target.value)}
                placeholder="Gérant, président, directeur…"
                style={STYLE_CHAMP}
              />
            </div>

            <div style={STYLE_CARTE}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
                Types d'action réalisés
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginTop: 0 }}>
                Cochez tout ce qui s'applique. Au moins un choix est nécessaire.
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
                "Validation des acquis de l'expérience"
              )}
              {ligneCase(
                actionBilan,
                setActionBilan,
                "Bilans de compétences"
              )}
            </div>

            <div style={STYLE_CARTE}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
                Situations particulières
              </h2>

              {ligneCase(
                certifiantes,
                setCertifiantes,
                "Vous préparez à des certifications",
                "Ajoute les indicateurs 3, 7 et 16"
              )}
              {ligneCase(
                sousTraitance,
                setSousTraitance,
                "Vous faites appel à des formateurs externes ou à la sous-traitance",
                "Ajoute l'indicateur 27"
              )}
              {ligneCase(
                afest,
                setAfest,
                "Vous réalisez des actions de formation en situation de travail (AFEST)",
                "Ajoute les indicateurs 13 et 28"
              )}
            </div>

            <div style={STYLE_CARTE}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
                Audit
              </h2>

              <span style={STYLE_LIBELLE}>Date d'audit prévue</span>
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
              <span style={STYLE_AIDE}>
                Celui que vous avez retenu parmi les organismes accrédités par le
                Comité français d'accréditation.
              </span>

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
                ? "Enregistrement…"
                : existe
                ? "Mettre à jour mon profil"
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
