"use client";
import { useState, useEffect } from "react";

const PROFILS: Record<string, { titre: string; sous: string; champ: string; exemple: string }> = {
  cabinet_comptable: {
    titre: "Ouvrir mon espace comptabilité",
    sous: "Vos dossiers, vos écritures, vos déclarations — dans un espace qui n'appartient qu'à vous.",
    champ: "Nom de votre cabinet",
    exemple: "Cabinet Durand",
  },
  forme_salaries: {
    titre: "Former mes salariés",
    sous: "Un catalogue prêt à l'emploi, le suivi de vos équipes et les attestations qui vont avec.",
    champ: "Nom de votre entreprise",
    exemple: "Durand et Fils",
  },
  vend_formations: {
    titre: "Ouvrir mon espace organisme",
    sous: "Votre catalogue, vos stagiaires, vos documents et votre facturation au même endroit.",
    champ: "Nom de votre organisme",
    exemple: "Formation Durand",
  },
  devenir_of: {
    titre: "Devenir organisme de formation",
    sous: "La préparation à la certification Qualiopi, indicateur par indicateur, avec vos preuves.",
    champ: "Nom de votre structure",
    exemple: "Durand Conseil",
  },
};

export default function RejoindrePage() {
  const [profil, setProfil] = useState("cabinet_comptable");
  const [email, setEmail] = useState("");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState(false);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("profil") || "";
      if (PROFILS[p]) setProfil(p);
    } catch (e) {}
  }, []);

  const textes = PROFILS[profil] || PROFILS.cabinet_comptable;

  async function creer() {
    setErreur("");
    setMessage("");

    if (!email || email.indexOf("@") < 1) {
      setErreur("Indiquez une adresse électronique valide.");
      return;
    }
    if (raisonSociale.trim().length < 2) {
      setErreur("Indiquez " + textes.champ.toLowerCase() + ".");
      return;
    }

    setOccupe(true);
    try {
      const r = await fetch("/api/compliance/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, raison_sociale: raisonSociale, profil: profil }),
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
    maxWidth: "470px",
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
            ACADÉMIA PRO
          </p>
          <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 16px" }}>Votre espace est ouvert</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: "1.7" }}>{message}</p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: "1.7" }}>
            Il n'y a pas de mot de passe à retenir : vous recevrez un lien de connexion
            par courriel, valable vingt minutes.
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
          ACADÉMIA PRO
        </p>
        <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 8px" }}>{textes.titre}</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: "1.7", marginTop: 0, marginBottom: "26px" }}>
          {textes.sous}
        </p>

        <span style={LIBELLE}>Je suis</span>
        <select
          value={profil}
          onChange={(e) => setProfil(e.target.value)}
          style={{ ...CHAMP, background: "#12121e" }}
        >
          <option value="cabinet_comptable">Un cabinet comptable</option>
          <option value="forme_salaries">Une entreprise qui forme ses salariés</option>
          <option value="vend_formations">Un organisme de formation</option>
          <option value="devenir_of">Une structure qui veut le devenir</option>
        </select>

        <span style={LIBELLE}>{textes.champ}</span>
        <input
          value={raisonSociale}
          onChange={(e) => setRaisonSociale(e.target.value)}
          placeholder={textes.exemple}
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

        {erreur && <p style={{ color: "#e8836a", fontSize: "14px", margin: "0 0 14px" }}>{erreur}</p>}

        <button
          onClick={creer}
          disabled={occupe}
          style={{ width: "100%", padding: "14px", background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: occupe ? "default" : "pointer", fontFamily: "Georgia, serif" }}
        >
          {occupe ? "Création en cours…" : "Ouvrir mon espace"}
        </button>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", marginTop: "18px", marginBottom: 0 }}>
          Vous avez déjà un compte ? <a href="/connexion" style={{ color: "#c8a96e" }}>Se connecter</a>
        </p>
      </div>
    </div>
  );
}
