"use client";
import { useState } from "react";
import { useTraductionAuto } from "../../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "E-book Gratuit",
  sousTitre: "Guide Pratique Claude et IA Generative 2026 · 50 pages",
  prenom: "Prenom",
  email: "Adresse electronique",
  metier: "Votre metier",
  domaine: "Le domaine qui vous interesse",
  bouton: "Recevoir le guide",
  envoi: "Envoi en cours...",
  bas: "Acces immediat · le lien vous est envoye par courrier electronique",
  lire: "Lire le guide maintenant",
  merci: "Votre guide vous a ete envoye. Verifiez votre boite de reception.",
};

const DOMAINES = [
  "Intelligence artificielle",
  "Business et management",
  "Marketing et vente",
  "Bien-etre et developpement personnel",
  "Securite et prevention",
  "Comptabilite et finance",
  "Langues",
  "Technique et numerique",
  "Autre",
];

const OR = "#c8a96e";
const FOND = "#050508";

const champStyle: any = {
  width: "100%", background: FOND,
  border: "1px solid rgba(200,169,110,0.3)",
  borderRadius: "8px", padding: "12px", color: "#fff",
  fontSize: "15px", fontFamily: "Georgia,serif",
  boxSizing: "border-box",
};

const labelStyle: any = {
  color: OR, fontSize: "13px",
  display: "block", marginBottom: "8px",
};

export default function EbookPage() {
  const { txt } = useTraductionAuto(FR);

  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [metier, setMetier] = useState("");
  const [domaine, setDomaine] = useState("");
  const [piege, setPiege] = useState("");

  const [envoi, setEnvoi] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [lien, setLien] = useState("");

  async function envoyer() {
    setErreur("");
    setMessage("");
    if (email.indexOf("@") < 1) { setErreur("Adresse electronique invalide."); return; }
    setEnvoi("1");
    try {
      const r = await fetch("/api/ebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: prenom, email: email, metier: metier,
          domaine: domaine, pays: "FR", societe_bis: piege,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message || txt.merci);
        if (d.lien) setLien(d.lien);
        setPrenom(""); setEmail(""); setMetier(""); setDomaine("");
      } else {
        setErreur(d.erreur || "Envoi impossible.");
      }
    } catch (e) {
      setErreur("Envoi impossible. Reessayez dans un instant.");
    }
    setEnvoi("");
  }

  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>{txt.surTitre}</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 12px" }}>{txt.titre}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: 0 }}>{txt.sousTitre}</p>
        </div>

        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "36px", border: "1px solid rgba(200,169,110,0.3)" }}>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>{txt.prenom}</label>
            <input value={prenom} onChange={function (e) { setPrenom(e.target.value); }} style={champStyle} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>{txt.email}</label>
            <input type="email" value={email} onChange={function (e) { setEmail(e.target.value); }} style={champStyle} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>{txt.metier}</label>
            <input value={metier} onChange={function (e) { setMetier(e.target.value); }} style={champStyle} />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>{txt.domaine}</label>
            <select value={domaine} onChange={function (e) { setDomaine(e.target.value); }} style={champStyle}>
              <option value="">Choisir</option>
              {DOMAINES.map(function (d) {
                return <option key={d} value={d}>{d}</option>;
              })}
            </select>
          </div>

          <input
            value={piege}
            onChange={function (e) { setPiege(e.target.value); }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}
          />

          <button onClick={envoyer} disabled={envoi !== ""}
            style={{ width: "100%", background: envoi ? "rgba(200,169,110,0.4)" : "linear-gradient(135deg, #c8a96e, #a07840)", color: FOND, border: "none", borderRadius: "8px", padding: "15px", fontSize: "16px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: envoi ? "default" : "pointer" }}>
            {envoi ? txt.envoi : txt.bouton}
          </button>

          {message && (
            <div style={{ marginTop: "18px", textAlign: "center" }}>
              <p style={{ color: "#4caf50", fontSize: "15px", margin: "0 0 12px" }}>{message}</p>
              {lien && (
                <a href={lien} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", background: "transparent", color: OR, border: "1px solid " + OR, borderRadius: "8px", padding: "11px 22px", textDecoration: "none", fontSize: "14px" }}>
                  {txt.lire}
                </a>
              )}
            </div>
          )}

          {erreur && <p style={{ color: "#e8836a", fontSize: "15px", marginTop: "16px", textAlign: "center" }}>{erreur}</p>}

          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center", marginTop: "18px", lineHeight: 1.7 }}>
            {txt.bas}
          </p>

          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11.5px", textAlign: "center", marginTop: "12px", lineHeight: 1.7 }}>
            Vos coordonnees servent uniquement a vous envoyer ce guide et nos
            informations. Aucune diffusion a des tiers, desinscription a tout moment.
          </p>
        </div>

      </div>
    </div>
  );
}
