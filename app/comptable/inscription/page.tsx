"use client";
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — UN CLIENT DEJA INSCRIT NE TOMBE PLUS SUR L INSCRIPTION
//
// Constat de Jacques sur mrcomptable.fr : le bouton du haut de la vitrine,
// « Ouvrir mon espace », menait ICI — le formulaire d inscription (nom du
// cabinet, SIREN) — y compris pour un client existant. Le lien « Se
// connecter » etait tout en bas, apres le formulaire.
// Le bouton est recopie dans chacune des 14 pages de la vitrine : plutot
// que de toucher 14 fichiers, c est cette page qui fait le tri.
//   · DEJA CONNECTE (session presente) : il part directement a l accueil
//     de son espace, le tableau de bord du cabinet.
//   · SINON : la CONNEXION d abord, en haut (le lien arrive par courriel et
//     ramene a l accueil), puis l inscription dessous pour un nouveau client.
// ⚠️ LA CONNEXION SE FAIT SUR mrcomptable.fr : la route /api/auth/demander
// renvoie le lien sur le domaine d ou il a ete demande, sous la marque
// Mr. Comptable. Une connexion faite sur academiapro.fr ne vaut pas ici
// (autre domaine, autre cookie).
// ═══════════════════════════════════════════════════════════════════════
const ACCUEIL = "/admin/compliance/tableau-de-bord";

export default function InscriptionComptable() {
  const [email, setEmail] = useState("");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [siren, setSiren] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [tva, setTva] = useState("");
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState(false);
  // 🆕 28/09 — la verification de session et la connexion en tete.
  const [verifie, setVerifie] = useState(false);
  const [emailConnexion, setEmailConnexion] = useState("");
  const [lienEnvoye, setLienEnvoye] = useState("");
  const [erreurConnexion, setErreurConnexion] = useState("");
  const [envoiLien, setEnvoiLien] = useState(false);

  useEffect(function () {
    fetch("/api/auth/session", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.connecte) window.location.replace(ACCUEIL);
        else setVerifie(true);
      })
      .catch(function () { setVerifie(true); });
  }, []);

  async function envoyerLien(adresse: string) {
    setErreurConnexion(""); setLienEnvoye("");
    const a = String(adresse || "").trim().toLowerCase();
    if (a.indexOf("@") < 1 || a.indexOf(".") < 0) {
      setErreurConnexion("Indiquez l'adresse électronique de votre espace.");
      return;
    }
    setEnvoiLien(true);
    try {
      const r = await fetch("/api/auth/demander", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: a, retour: ACCUEIL }),
      });
      const d = await r.json();
      if (d && d.success) {
        setLienEnvoye("Un lien de connexion vient de partir vers " + a
          + ". Il est valable 20 minutes et vous mène directement à votre espace.");
      } else {
        setErreurConnexion((d && (d.error || d.erreur)) || "Envoi impossible pour le moment.");
      }
    } catch (e: any) {
      setErreurConnexion("Envoi impossible : vérifiez votre connexion, puis réessayez.");
    }
    setEnvoiLien(false);
  }

  async function creer() {
    setErreur("");
    setMessage("");

    if (!email || email.indexOf("@") < 0) {
      setErreur("Indiquez une adresse électronique valide.");
      return;
    }
    if (raisonSociale.trim().length < 2) {
      setErreur("Indiquez le nom de votre cabinet ou de votre société.");
      return;
    }

    const chiffres = siren.replace(/\D/g, "");
    if (chiffres.length > 0 && chiffres.length < 9) {
      setErreur("Le SIREN compte neuf chiffres.");
      return;
    }

    setOccupe(true);
    try {
      const r = await fetch("/api/compliance/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          raison_sociale: raisonSociale,
          siren: chiffres,
          profil: "cabinet_comptable",
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message || "Compte créé.");
        setTva(d.numero_tva || "");
        setFait(true);
      } else {
        setErreur(d.erreur || "Création impossible.");
      }
    } catch (e: any) {
      setErreur("Création impossible : " + String(e));
    }
    setOccupe(false);
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(200,169,110,0.3)",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "460px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia, serif",
    boxSizing: "border-box",
    marginBottom: "16px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "6px",
  };

  if (!verifie) {
    return (
      <div style={CADRE}>
        <div style={CARTE}>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>…</p>
        </div>
      </div>
    );
  }

  if (fait) {
    return (
      <div style={CADRE}>
        <div style={CARTE}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>
            MR. COMPTABLE
          </p>
          <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 16px" }}>Votre espace est ouvert</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: "1.7" }}>
            {message}
          </p>
          {tva && (
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: "1.7" }}>
              Votre numéro de TVA intracommunautaire a été calculé depuis votre SIREN :
              <span style={{ color: "#c8a96e" }}> {tva}</span>. Vous pourrez le corriger
              depuis votre fiche s'il diffère.
            </p>
          )}
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: "1.7" }}>
            Il n'y a pas de mot de passe à retenir : vous recevrez un lien de connexion
            par courriel, valable quelques minutes.
          </p>
          {/* 🆕 28/09 — LE LIEN PART A L ADRESSE QUI VIENT D ETRE SAISIE, sans
              repasser par un autre ecran ou il faudrait la retaper. */}
          <button
            onClick={() => envoyerLien(email)}
            disabled={envoiLien || lienEnvoye !== ""}
            style={{ display: "block", width: "100%", textAlign: "center", background: lienEnvoye ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "14px", borderRadius: "8px", border: "none", fontWeight: "bold", fontSize: "15px", marginTop: "20px", cursor: "pointer", fontFamily: "Georgia, serif" }}
          >
            {envoiLien ? "Envoi…" : lienEnvoye ? "Lien envoyé" : "Recevoir mon lien de connexion"}
          </button>
          {lienEnvoye && (
            <p style={{ color: "#7fc97f", fontSize: "14px", lineHeight: "1.7", marginTop: "14px" }}>{lienEnvoye}</p>
          )}
          {erreurConnexion && (
            <p style={{ color: "#e8836a", fontSize: "14px", marginTop: "14px" }}>{erreurConnexion}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...CADRE, flexDirection: "column", gap: "18px" }}>
      {/* 🆕 28/09 — DEJA CLIENT : LA CONNEXION D ABORD. */}
      <div style={CARTE}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>
          MR. COMPTABLE
        </p>
        <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 8px" }}>Mon espace</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: "1.7", marginTop: 0, marginBottom: "18px" }}>
          Déjà client ? Indiquez votre adresse : vous recevez un lien de connexion qui vous mène
          directement à votre espace. Aucun mot de passe à retenir.
        </p>
        <span style={LIBELLE}>Votre adresse électronique</span>
        <input
          type="email"
          value={emailConnexion}
          onChange={(e) => setEmailConnexion(e.target.value)}
          placeholder="vous@exemple.fr"
          onKeyDown={(e) => e.key === "Enter" && envoyerLien(emailConnexion)}
          style={CHAMP}
        />
        {erreurConnexion && (
          <p style={{ color: "#e8836a", fontSize: "14px", margin: "0 0 14px" }}>{erreurConnexion}</p>
        )}
        {lienEnvoye && (
          <p style={{ color: "#7fc97f", fontSize: "14px", lineHeight: "1.7", margin: "0 0 14px" }}>{lienEnvoye}</p>
        )}
        <button
          onClick={() => envoyerLien(emailConnexion)}
          disabled={envoiLien}
          style={{ width: "100%", padding: "14px", background: envoiLien ? "rgba(200,169,110,0.3)" : "#c8a96e", color: envoiLien ? "#8a8a8a" : "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: envoiLien ? "default" : "pointer", fontFamily: "Georgia, serif" }}
        >
          {envoiLien ? "Envoi en cours…" : "Recevoir mon lien de connexion"}
        </button>
      </div>

      <div style={CARTE}>
        <h2 style={{ color: "#fff", fontSize: "20px", margin: "0 0 8px" }}>Créer mon espace</h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: "1.7", marginTop: 0, marginBottom: "28px" }}>
          Votre comptabilité, vos dossiers, vos déclarations — dans un espace qui
          n'appartient qu'à vous.
        </p>

        <span style={LIBELLE}>Nom de votre cabinet ou de votre société</span>
        <input
          value={raisonSociale}
          onChange={(e) => setRaisonSociale(e.target.value)}
          placeholder="Cabinet Durand"
          style={CHAMP}
        />

        <span style={LIBELLE}>SIREN</span>
        <input
          value={siren}
          onChange={(e) => setSiren(e.target.value)}
          placeholder="123 456 789"
          inputMode="numeric"
          style={CHAMP}
        />
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "-10px", marginBottom: "16px" }}>
          Neuf chiffres. Nous en déduisons votre numéro de TVA intracommunautaire,
          nécessaire à la facturation.
        </p>

        <span style={LIBELLE}>Votre adresse électronique</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          onKeyDown={(e) => e.key === "Enter" && creer()}
          style={CHAMP}
        />

        {erreur && (
          <p style={{ color: "#e8836a", fontSize: "14px", margin: "0 0 14px" }}>{erreur}</p>
        )}

        <button
          onClick={creer}
          disabled={occupe}
          style={{ width: "100%", padding: "14px", background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: occupe ? "default" : "pointer", fontFamily: "Georgia, serif" }}
        >
          {occupe ? "Création en cours…" : "Créer mon espace"}
        </button>

      </div>
    </div>
  );
}
