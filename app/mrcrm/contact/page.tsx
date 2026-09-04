"use client";
import { useState } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LA PAGE DE CONTACT DE MR CRM — 04/09.
//
// POURQUOI ELLE EXISTE. Le bouton « Demander une presentation » de la
// vitrine envoyait le prospect sur academiapro.fr/contact : autre marque,
// autre menu, « 560 formations » sous les yeux de quelqu un qui cherchait
// un CRM vendu seul. C est exactement ce que la separation des produits
// vise a eviter — le prospect Mr CRM reste chez Mr CRM.
//
// 🚨 `produit: "mrcrm"` EST TRANSMIS A LA ROUTE. Le sujet du courriel porte
// alors « [Mr CRM] », et le message s enregistre avec sa marque dans
// `messages_contact`. Sans ce champ, un message venu d ici serait
// indiscernable d un message AcadéMIA.
//
// ⚠️ CETTE PAGE PORTE SON PROPRE EN-TETE, comme la vitrine, le blog et les
// pages de fonction. Pour que la barre de travail ne s affiche pas
// par-dessus, /contact DOIT figurer dans PAGES_PUBLIQUES_MRCRM de
// components/NavBar.tsx — livre avec ce fichier.
//
// ⚠️ PAS DE TRADUCTION AUTOMATIQUE ICI, contrairement a la page AcadéMIA.
//
// ⚠️ LA TELEPHONIE N EST PROPOSEE QU AUX CLIENTS EUROPEENS. Ne rien
// promettre ici sur ce point : seul le devis en decide, selon le perimetre.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrcrm.fr, le middleware reecrit
// tout chemin non reserve vers /mrcrm.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mrcrm.fr";
const LEGAL = "https://academiapro.fr";
const PRODUIT = "mrcrm";
const ADRESSE = "contact@academiapro.fr";

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

// ⚠️ SANS ESPACE NI DOUBLE EXTENSION, contrairement au logo carre
// (« mrcrm-logo .png »). Verifier le nom reel dans public/.
const BANNIERE = "/mrcrm-banniere.png";

const SECTION: any = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "0 24px",
};

const LIEN_ENTETE: any = {
  color: "rgba(255,255,255,0.75)",
  textDecoration: "none",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

const champStyle: any = {
  width: "100%",
  background: "#050508",
  border: "1px solid rgba(200,169,110,0.3)",
  borderRadius: "8px",
  padding: "12px",
  color: "#fff",
  fontSize: "14px",
  boxSizing: "border-box",
  fontFamily: "Georgia, serif",
};

const labelStyle: any = {
  color: OR,
  fontSize: "13px",
  display: "block",
  marginBottom: "8px",
};

export default function ContactMrCRM() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [societe, setSociete] = useState("");
  const [message, setMessage] = useState("");

  const [envoi, setEnvoi] = useState(false);
  const [parti, setParti] = useState(false);
  const [erreur, setErreur] = useState("");

  async function envoyer() {
    setErreur("");

    if (email.trim().indexOf("@") < 1) {
      setErreur("Merci d'indiquer une adresse de courriel valide.");
      return;
    }
    if (message.trim().length < 5) {
      setErreur("Merci d'écrire votre message.");
      return;
    }

    setEnvoi(true);
    try {
      // LA SOCIETE EST PLACEE DANS LE SUJET. La route attend produit,
      // prenom, nom, email, sujet et message. Le nom de la societe est ce
      // qui identifie le mieux un prospect, il tient donc lieu de sujet
      // plutot que de demander une ligne de plus.
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produit: PRODUIT,
          prenom: prenom,
          nom: nom,
          email: email,
          sujet: societe ? "Demande — " + societe : "Demande de présentation",
          message: message,
        }),
      });
      const d = await r.json();
      if (d && d.success) {
        setParti(true);
      } else {
        setErreur((d && d.error)
          || "Votre message n'a pas pu être transmis. Écrivez-nous à " + ADRESSE + ".");
      }
    } catch (e) {
      setErreur("Votre message n'a pas pu être transmis. Écrivez-nous à " + ADRESSE + ".");
    }
    setEnvoi(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- Identique aux autres pages du site. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000" }}>
        <div style={{ ...SECTION, display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "10px 24px", gap: "16px" }}>
          <a href={SITE + "/"} style={{ display: "block", lineHeight: 0,
            flexShrink: 0 }}>
            <img
              src={BANNIERE}
              alt="Mr CRM"
              style={{ width: "560px", maxWidth: "62vw", height: "auto",
                display: "block", margin: "-4px", clipPath: "inset(4px)" }}
            />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "18px",
            flexShrink: 0 }}>
            {/* ⚠️ PAS DE « FONCTIONS » : les pages de fonction de Mr CRM
                n existent pas encore. Un lien vers une page absente rend
                « page introuvable » a un prospect. */}
            <a href={SITE + "/blog"} style={LIEN_ENTETE}>Blog</a>
            <a href={SITE + "/contact"} style={LIEN_ENTETE}>Contact</a>
            <a href="/connexion" style={{ color: OR,
              border: "1px solid rgba(200,169,110,0.45)",
              padding: "9px 18px", borderRadius: "8px",
              textDecoration: "none", fontSize: "14px",
              whiteSpace: "nowrap" }}>
              Se connecter
            </a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "620px", margin: "0 auto",
        padding: "60px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
            margin: "0 0 12px" }}>
            MR CRM
          </p>
          <h1 style={{ color: "#fff", fontSize: "32px",
            margin: "0 0 12px", lineHeight: "1.3" }}>
            Demander une présentation
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px",
            margin: 0, lineHeight: "1.7" }}>
            Une heure, sur vos propres contacts. Nous suivons ensemble un
            client du premier appel au document signé.
          </p>
        </div>

        <div style={{ background: "#1a1a2e", borderRadius: "16px",
          padding: "36px 32px",
          border: "1px solid rgba(200,169,110,0.3)" }}>

          {parti ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ color: OR, fontSize: "18px", lineHeight: "1.7",
                margin: "0 0 12px" }}>
                Merci, votre message est bien parti.
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px",
                lineHeight: "1.7", margin: 0 }}>
                Nous vous répondons sous 24 heures.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Prénom</label>
                <input type="text" style={champStyle} value={prenom}
                  onChange={function (e) { setPrenom(e.target.value); }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Nom</label>
                <input type="text" style={champStyle} value={nom}
                  onChange={function (e) { setNom(e.target.value); }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Courriel</label>
                <input type="email" style={champStyle} value={email}
                  onChange={function (e) { setEmail(e.target.value); }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Votre société</label>
                <input type="text" style={champStyle} value={societe}
                  onChange={function (e) { setSociete(e.target.value); }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Votre message</label>
                <textarea style={{ ...champStyle, height: "130px" }}
                  value={message}
                  onChange={function (e) { setMessage(e.target.value); }} />
              </div>

              {erreur && (
                <p style={{ color: "#e8836a", fontSize: "14px",
                  lineHeight: "1.6", margin: "0 0 16px" }}>
                  {erreur}
                </p>
              )}

              <button
                onClick={envoyer}
                disabled={envoi}
                style={{ width: "100%",
                  background: envoi
                    ? "rgba(200,169,110,0.4)"
                    : "linear-gradient(135deg, #c8a96e, #a07840)",
                  color: FOND, border: "none", borderRadius: "8px",
                  padding: "14px", fontSize: "15px", fontWeight: "bold",
                  fontFamily: "Georgia, serif",
                  cursor: envoi ? "default" : "pointer" }}>
                {envoi ? "Envoi en cours..." : "Envoyer"}
              </button>

              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px",
                textAlign: "center", marginTop: "16px" }}>
                Réponse sous 24 heures · {ADRESSE}
              </p>
            </>
          )}
        </div>
      </main>

      {/* ---- PIED ---- Pages legales sur academiapro.fr, en absolu. */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)",
        padding: "26px 0" }}>
        <div style={{ ...SECTION, color: "rgba(255,255,255,0.4)",
          fontSize: "13px", lineHeight: "1.8" }}>
          <p style={{ margin: "0 0 6px" }}>
            Mr CRM — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Accueil</a>
            {"  ·  "}
            <a href={SITE + "/blog"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Blog</a>
            {"  ·  "}
            <a href={SITE + "/contact"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Contact</a>
            {"  ·  "}
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Mentions légales</a>
            {"  ·  "}
            <a href={LEGAL + "/cgv"} style={{ color: OR_PALE,
              textDecoration: "none" }}>CGV</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
