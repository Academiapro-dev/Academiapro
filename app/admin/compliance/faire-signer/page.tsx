"use client";
import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// PREPARER UN DOCUMENT A SIGNER — MYSTERLLC, 01/09.
//
// A QUOI SERT CET ECRAN. La route de signature et le registre existaient,
// mais RIEN NE PERMETTAIT DE CREER UN DOCUMENT SIGNABLE. Le mecanisme
// complet etait donc inutilisable — un outil qu on ne peut pas commencer a
// utiliser n existe pas.
//
// 🚨 CE QUI SE SIGNE, ET SEULEMENT CELA. Les formulaires IRS — 5472, 1120,
// 7004 — EXIGENT une signature manuscrite ou les procedures propres a
// l IRS. Ils ne figurent pas dans la liste ci-dessous, et la route les
// refuse meme si on l appelait directement.
//
// LE TYPE LE PLUS UTILE EST L ACCUSE DE LECTURE : le client atteste avoir
// lu et approuve le formulaire qui va partir en son nom. C est la
// traduction technique de l argument de maitrise — la signature ne
// remplace pas sa decision, ELLE LA PROUVE.
//
// ⚠️ LE DOCUMENT DOIT ETRE ARCHIVE AVANT D ETRE SIGNE. Une signature sans
// document archive prouverait un accord sans pouvoir montrer sur quoi il
// portait. La route le refuse, et cet ecran depose le PDF au coffre avant
// d envoyer le lien.
//
// ⚠️ LE LIEN PART A L ADRESSE DU CLIENT, JAMAIS A CELLE DU GESTIONNAIRE.
// C est ce qui fait que la preuve porte le nom de celui qui s engage.
// ---------------------------------------------------------------------------

const OR = "#c8a96e";
const VERT = "#0a3d2e";

// 🚨 LES SIX TYPES SIGNABLES, ET AUCUN AUTRE. Cette liste doit rester
// alignee sur TYPES_SIGNABLES dans /api/compliance/signature : un type
// present ici mais absent la-bas produirait un document qu on ne pourrait
// jamais signer.
const TYPES = [
  {
    cle: "accuse_lecture",
    nom: "Accusé de lecture avant dépôt",
    aquoi: "Le client atteste avoir lu et approuvé le formulaire qui va être "
      + "déposé en son nom. C'est ce qui prouve qu'il a décidé, et non pas subi.",
  },
  {
    cle: "mandat",
    nom: "Mandat de gestion",
    aquoi: "Vous autorise à administrer sa société : suivi des échéances, "
      + "préparation des formulaires, correspondance avec l'administration.",
  },
  {
    cle: "lettre_mission",
    nom: "Lettre de mission",
    aquoi: "Définit le périmètre de votre intervention pour l'exercice, "
      + "vos honoraires, et ce qui reste à sa charge.",
  },
  {
    cle: "autorisation_depot",
    nom: "Autorisation de dépôt",
    aquoi: "L'autorise expressément à déposer un formulaire précis en son nom, "
      + "à une date donnée.",
  },
  {
    cle: "convention",
    nom: "Convention de prestation",
    aquoi: "L'accord-cadre entre vous et votre client.",
  },
  {
    cle: "devis",
    nom: "Devis",
    aquoi: "Une proposition chiffrée, signée avant exécution.",
  },
];

export default function PreparerSignature() {
  const [entites, setEntites] = useState<any[]>([]);
  const [entiteId, setEntiteId] = useState("");
  const [type, setType] = useState("accuse_lecture");
  const [titre, setTitre] = useState("");
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [corps, setCorps] = useState("");

  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const [resultat, setResultat] = useState<any>(null);

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/entites");
      const d = await r.json();
      if (d.success || d.ok) {
        const liste = d.entites || d.societes || [];
        setEntites(liste);
        if (liste.length === 1) setEntiteId(liste[0].id);
      } else {
        setErreur(d.error || d.erreur || "Lecture du portefeuille impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  // Le texte proposé selon le type. Il se modifie librement : c'est un
  // point de départ, pas un modèle imposé.
  useEffect(function () {
    const societe = entites.find(function (e: any) { return e.id === entiteId; });
    const label = societe ? (societe.legal_name || societe.label) : "votre société";

    if (type === "accuse_lecture") {
      setTitre("Accusé de lecture — formulaire à déposer pour " + label);
      setCorps(
        "Je soussigné(e), membre de " + label + ", reconnais avoir pris "
        + "connaissance du formulaire préparé pour cette société, en avoir "
        + "vérifié les informations, et en approuver le contenu.\n\n"
        + "J'autorise son dépôt auprès de l'administration compétente.\n\n"
        + "Je reste informé(e) que la responsabilité du dépôt et de "
        + "l'exactitude des informations déclarées m'incombe."
      );
    } else if (type === "mandat") {
      setTitre("Mandat de gestion — " + label);
      setCorps(
        "Je soussigné(e), membre de " + label + ", donne mandat pour :\n\n"
        + "— suivre les obligations déclaratives de la société,\n"
        + "— préparer les formulaires destinés à l'administration,\n"
        + "— m'alerter avant chaque échéance,\n"
        + "— assurer la correspondance courante liée à ces obligations.\n\n"
        + "Ce mandat ne comporte aucune délégation de signature : chaque "
        + "document destiné à l'administration me sera soumis avant dépôt."
      );
    } else if (type === "lettre_mission") {
      setTitre("Lettre de mission — " + label);
      setCorps(
        "Périmètre de la mission pour l'exercice en cours :\n\n"
        + "— [à compléter]\n\n"
        + "Honoraires : [à compléter]\n\n"
        + "Reste à la charge du client : la relecture, la signature et le "
        + "dépôt des formulaires auprès de l'administration."
      );
    } else if (type === "autorisation_depot") {
      setTitre("Autorisation de dépôt — " + label);
      setCorps(
        "J'autorise le dépôt du formulaire suivant, en mon nom et pour le "
        + "compte de " + label + " :\n\n"
        + "Formulaire : [à compléter]\n"
        + "Exercice : [à compléter]\n"
        + "Échéance : [à compléter]\n\n"
        + "J'ai pris connaissance de son contenu et j'en approuve les termes."
      );
    } else {
      setTitre("");
      setCorps("");
    }
  }, [type, entiteId, entites]);

  async function envoyer() {
    if (!entiteId) {
      setErreur("Choisissez la société concernée.");
      return;
    }
    if (!email.trim() || email.indexOf("@") < 1) {
      setErreur("Indiquez l'adresse du signataire.");
      return;
    }
    if (!titre.trim()) {
      setErreur("Indiquez un titre pour le document.");
      return;
    }

    setOccupe(true);
    setErreur("");
    setResultat(null);
    try {
      const r = await fetch("/api/compliance/document-a-signer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entite_id: entiteId,
          doc_type: type,
          titre: titre,
          corps: corps,
          signataire_email: email.trim().toLowerCase(),
          signataire_nom: nom.trim(),
        }),
      });
      const d = await r.json();
      if (d.success || d.ok) setResultat(d);
      else setErreur(d.error || d.erreur || "Préparation impossible.");
    } catch (e: any) {
      setErreur("Préparation impossible : " + String(e));
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
    padding: "22px 24px",
    marginBottom: "16px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: "14.5px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    lineHeight: "1.7",
  };

  const LIBELLE: any = {
    color: OR,
    fontSize: "12.5px",
    display: "block",
    marginBottom: "5px",
  };

  const BOUTON: any = {
    background: "linear-gradient(135deg,#c8a96e,#a07840)",
    color: "#050508",
    border: "none",
    borderRadius: "9px",
    padding: "15px 30px",
    fontSize: "15px",
    fontWeight: "bold",
    fontFamily: "Georgia,serif",
    cursor: "pointer",
    width: "100%",
  };

  const choisi = TYPES.find(function (t) { return t.cle === type; });

  // ---- LE DOCUMENT EST PARTI ----
  if (resultat) {
    return (
      <div style={CADRE}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ ...CARTE, border: "1px solid rgba(0,230,118,0.45)" }}>
            <p style={{ color: "#00e676", fontSize: "13px", letterSpacing: "2px", margin: "0 0 12px" }}>
              DOCUMENT ENVOYÉ
            </p>
            <h1 style={{ color: "#fff", fontSize: "23px", margin: "0 0 16px" }}>
              {email} a reçu le lien de signature.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: "1.85", margin: "0 0 18px" }}>
              Le document est archivé au coffre sous la référence
              <strong> {resultat.reference}</strong>. Le signataire recevra un
              code de vérification à six chiffres au moment de signer.
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", lineHeight: "1.8", margin: 0, wordBreak: "break-all" }}>
              Lien de signature<br />
              <span style={{ fontFamily: "monospace" }}>{resultat.lien}</span>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href="/admin/compliance/signatures" style={{ ...BOUTON, width: "auto", display: "inline-block", textDecoration: "none", textAlign: "center" }}>
              Voir le registre
            </a>
            <button
              onClick={() => { setResultat(null); setEmail(""); setNom(""); }}
              style={{
                background: "transparent",
                border: "1px solid rgba(200,169,110,0.4)",
                color: OR,
                borderRadius: "9px",
                padding: "15px 30px",
                fontSize: "15px",
                fontFamily: "Georgia,serif",
                cursor: "pointer",
              }}
            >
              Préparer un autre document
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <a href="/admin/compliance" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour au dossier
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          SIGNATURE ÉLECTRONIQUE
        </p>
        <h1 style={{ color: "#fff", fontSize: "28px", margin: "0 0 8px" }}>
          Préparer un document à signer
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: "1.8" }}>
          Le document est archivé, puis un lien part à votre client. Il le lit,
          trace sa signature, et saisit le code reçu par courriel.
        </p>

        {/* 🚨 L AVERTISSEMENT SUR LES FORMULAIRES IRS EST PLACE EN TETE,
            avant même le formulaire. Le découvrir après avoir tout rempli
            serait une perte de temps — et laisser croire un instant qu'un
            5472 peut se signer ici serait pire. */}
        <div style={{
          ...CARTE,
          border: "1px solid rgba(232,163,61,0.5)",
          marginTop: "22px",
        }}>
          <p style={{ color: "#e8a33d", fontSize: "14px", lineHeight: "1.85", margin: 0 }}>
            <strong>Les formulaires IRS ne se signent pas ici.</strong> Le
            5472, le 1120 et le 7004 exigent une signature manuscrite ou la
            procédure propre à l&apos;IRS. Ce qui se signe électroniquement,
            ce sont les documents contractuels entre vous et votre client —
            dont l&apos;accusé de lecture du formulaire avant son dépôt.
          </p>
        </div>

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "14.5px", lineHeight: "1.8", margin: 0 }}>
              {erreur}
            </p>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p>
          </div>
        ) : (
          <>
            <div style={CARTE}>
              <label style={LIBELLE}>Société concernée</label>
              <select
                value={entiteId}
                onChange={(e) => setEntiteId(e.target.value)}
                style={{ ...CHAMP, marginBottom: "16px" }}
              >
                <option value="">— choisir —</option>
                {entites.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.label || e.legal_name}</option>
                ))}
              </select>

              <label style={LIBELLE}>Type de document</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={CHAMP}
              >
                {TYPES.map((t) => (
                  <option key={t.cle} value={t.cle}>{t.nom}</option>
                ))}
              </select>

              {choisi && (
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.75", margin: "10px 0 0" }}>
                  {choisi.aquoi}
                </p>
              )}
            </div>

            <div style={CARTE}>
              <label style={LIBELLE}>Titre du document</label>
              <input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                style={{ ...CHAMP, marginBottom: "16px" }}
              />

              <label style={LIBELLE}>Texte à signer</label>
              <textarea
                value={corps}
                onChange={(e) => setCorps(e.target.value)}
                rows={12}
                style={{ ...CHAMP, resize: "vertical" }}
              />
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "10px 0 0" }}>
                Ce texte est un point de départ, pas un modèle imposé.
                Relisez-le : c&apos;est lui qui engage votre client.
              </p>
            </div>

            <div style={CARTE}>
              <label style={LIBELLE}>Adresse du signataire</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@exemple.com"
                style={{ ...CHAMP, marginBottom: "8px" }}
              />
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "0 0 16px" }}>
                Le lien et le code partiront à cette adresse. Seule cette
                personne pourra signer — vous ne pouvez pas signer à sa place.
              </p>

              <label style={LIBELLE}>Nom du signataire (facultatif)</label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Jean Dupont"
                style={CHAMP}
              />
            </div>

            <button onClick={envoyer} disabled={occupe} style={BOUTON}>
              {occupe ? "Préparation…" : "Archiver et envoyer à la signature"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", lineHeight: "1.8", textAlign: "center", marginTop: "18px" }}>
              Signature électronique simple au sens du règlement eIDAS. Elle
              est opposable entre les parties, elle ne vaut pas vérification
              d&apos;identité.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
