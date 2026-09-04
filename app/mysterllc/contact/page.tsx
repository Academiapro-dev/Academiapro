"use client";
import { useState } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LA PAGE DE CONTACT DE MYSTERLLC — 04/09.
//
// 🚨🚨 POURQUOI ELLE EXISTE, ET CE QUE SON ABSENCE A PU COUTER.
//
// Les deux boutons « Demander une presentation » de la vitrine ouvraient un
// lien `mailto:contact@mysterllc.com`. Sur un appareil sans messagerie
// configuree — un ordinateur de bureau, un navigateur qui n a pas de client
// mail associe — CE LIEN NE FAIT RIEN DU TOUT. Le visiteur clique, rien ne
// se passe, il repart.
//
// ⛔ NE JAMAIS REMETTRE DE `mailto:` COMME SEUL MOYEN DE CONTACT sur une
// vitrine. Un formulaire fonctionne partout, et il laisse une trace en base
// meme si le courriel echoue.
//
// 🚨 `produit: "mysterllc"` EST TRANSMIS A LA ROUTE. Le courriel part alors
// de contact@mysterllc.com — domaine verifie chez Resend — avec
// « [MysterLLC] » en sujet, et le message s enregistre avec sa marque dans
// `messages_contact`.
//
// ⚠️ CETTE PAGE PORTE SON PROPRE EN-TETE, comme la vitrine, le blog et les
// pages de fonction. Pour que la barre de travail ne s affiche pas
// par-dessus, /contact DOIT figurer dans PAGES_PUBLIQUES_MYSTERLLC de
// components/NavBar.tsx — livre avec ce fichier.
//
// ⚠️ PAS DE TRADUCTION AUTOMATIQUE ICI. La cible est francophone, meme si
// les societes sont americaines.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mysterllc.com, le middleware
// reecrit tout chemin non reserve vers /mysterllc.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";
const PRODUIT = "mysterllc";
const ADRESSE = "contact@mysterllc.com";

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

// ⚠️ VERIFIER LE NOM REEL AVANT DE LE CHANGER : le fichier s appelle
// IMG_4723.jpeg, il n a pas ete renomme.
const BANNIERE = "/IMG_4723.jpeg";

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

export default function ContactMysterLLC() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [societes, setSocietes] = useState("");
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
      // LE NOMBRE DE SOCIETES EST PLACE DANS LE SUJET. C est l information
      // qui compte le plus pour repondre : le prix se fixe au vu de la
      // taille du portefeuille. La route attend produit, prenom, nom,
      // email, sujet et message.
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produit: PRODUIT,
          prenom: prenom,
          nom: nom,
          email: email,
          sujet: societes ? "Demande — " + societes : "Demande de présentation",
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
              alt="MysterLLC"
              style={{ width: "520px", maxWidth: "58vw", height: "auto",
                display: "block", margin: "-4px", clipPath: "inset(4px)" }}
            />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "18px",
            flexShrink: 0 }}>
            <a href={SITE + "/fonctionnalites"} style={LIEN_ENTETE}>Fonctions</a>
            <a href={SITE + "/etats"} style={LIEN_ENTETE}>États</a>
            <a href={SITE + "/blog"} style={LIEN_ENTETE}>Blog</a>
            {/* 🆕 « CONTACT » FIGURE MEME SUR LA PAGE DE CONTACT — 04/09.
                Le menu est le meme sur toutes les pages, sans exception :
                une entree qui disparait selon l endroit ou l on se trouve
                donne l impression d un site incoherent. */}
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
            MYSTERLLC
          </p>
          <h1 style={{ color: "#fff", fontSize: "32px",
            margin: "0 0 12px", lineHeight: "1.3" }}>
            Demander une présentation
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px",
            margin: 0, lineHeight: "1.7" }}>
            Une heure, sur vos propres sociétés. Nous en déclarons une et
            déroulons ce qui en sort — agenda, formulaires, relances.
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
                <label style={labelStyle}>Combien de sociétés suivez-vous ?</label>
                <input type="text" style={champStyle} value={societes}
                  onChange={function (e) { setSocietes(e.target.value); }} />
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
            MysterLLC — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Accueil</a>
            {"  ·  "}
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Fonctions</a>
            {"  ·  "}
            <a href={SITE + "/etats"} style={{ color: OR_PALE,
              textDecoration: "none" }}>États</a>
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
