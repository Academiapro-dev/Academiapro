"use client";
import { useState } from "react";

export default function InscriptionComptable() {
  const [email, setEmail] = useState("");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState(false);

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

    setOccupe(true);
    try {
      const r = await fetch("/api/compliance/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, raison_sociale: raisonSociale }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message || "Compte créé.");
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
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: "1.7" }}>
            Il n'y a pas de mot de passe à retenir : vous recevrez un lien de connexion
            par courriel, valable quelques minutes.
          </p>
          <a
            href="/connexion"
            style={{ display: "block", textAlign: "center", background: "#c8a96e", color: "#050508", padding: "14px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "15px", marginTop: "20px" }}
          >
            Recevoir mon lien de connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={CARTE}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>
          MR. COMPTABLE
        </p>
        <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 8px" }}>Ouvrir mon espace</h1>
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
          {occupe ? "Création en cours…" : "Ouvrir mon espace"}
        </button>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", marginTop: "18px", marginBottom: 0 }}>
          Vous avez déjà un compte ?{" "}
          <a href="/connexion" style={{ color: "#c8a96e" }}>Se connecter</a>
        </p>
      </div>
    </div>
  );
}
