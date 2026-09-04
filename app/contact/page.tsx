"use client";
import { useState } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

// ══════════════════════════════════════════════════════════════════════════
// LA PAGE DE CONTACT — RENDUE FONCTIONNELLE LE 04/09.
//
// 🚨🚨 CE QU IL Y AVAIT ICI. Le formulaire etait un DECOR. Les quatre champs
// du haut etaient produits par une boucle `.map()` sans `value` ni
// `onChange` ; le bouton n avait AUCUN gestionnaire. Cliquer « Envoyer le
// message » ne faisait rien : ni erreur, ni confirmation, ni requete.
//
// TOUT MESSAGE ECRIT ICI A ETE PERDU, et le visiteur n avait aucun moyen de
// s en apercevoir. C est la seule porte d entree d un prospect qui ne veut
// pas telephoner.
//
// ⚠️ LA BOUCLE `.map()` EST LA CAUSE. Elle produisait quatre champs
// identiques et anonymes : rien ne rattachait un champ a une donnee. Les
// champs sont donc ecrits UN PAR UN, chacun avec son etat. C est plus long
// a lire, et c est la seule facon de savoir ce que contient chaque case.
//
// CE QUI SE PASSE MAINTENANT :
//   - chaque champ tient sa valeur ;
//   - le bouton appelle /api/contact ;
//   - la reponse de la route decide du message affiche — succes ou echec ;
//   - PENDANT L ENVOI le bouton est desactive, pour ne pas envoyer deux fois.
//
// 🚨 AUCUN SUCCES DE COMPLAISANCE. Si la route echoue, le visiteur le voit
// et l adresse de courriel lui est rappelee. Mieux vaut un echec annonce
// qu une confirmation fausse.
//
// ⚠️ `produit` EST TRANSMIS A LA ROUTE. Cette page est celle d AcadéMIA
// Pro : elle envoie « academiapro ». Les pages de contact des autres
// marques enverront la leur, et le sujet du courriel suivra.
// ══════════════════════════════════════════════════════════════════════════

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Nous Contacter",
  sousTitre: "Reponse sous 24h · contact@academiapro.fr",
  champs: { prenom: "Prenom", nom: "Nom",
    email: "Email", sujet: "Sujet",
    message: "Message" },
  bouton: "Envoyer le message",
  envoi: "Envoi en cours...",
  bas: "Reponse sous 24h · Agent IA disponible 24h/24",
  merci: "Merci, votre message est bien parti. Nous vous repondons sous 24 heures.",
};

const PRODUIT = "academiapro";

const champStyle = {
  width: "100%", background: "#050508",
  border: "1px solid rgba(200,169,110,0.3)",
  borderRadius: "8px", padding: "12px", color: "#fff",
  fontSize: "14px", boxSizing: "border-box" as const,
  fontFamily: "Georgia, serif",
};
const labelStyle = {
  color: "#c8a96e", fontSize: "13px",
  display: "block" as const, marginBottom: "8px",
};

export default function ContactPage() {
  const { txt } = useTraductionAuto(FR);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");

  const [envoi, setEnvoi] = useState(false);
  const [parti, setParti] = useState(false);
  const [erreur, setErreur] = useState("");

  async function envoyer() {
    setErreur("");

    // CONTROLE AVANT ENVOI. On ne demande que ce qui permet de repondre :
    // une adresse et un message. Exiger davantage ferait perdre des
    // messages, et la route controle de son cote.
    if (email.trim().indexOf("@") < 1) {
      setErreur("Merci d'indiquer une adresse de courriel valide.");
      return;
    }
    if (message.trim().length < 5) {
      setErreur("Merci d'ecrire votre message.");
      return;
    }

    setEnvoi(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produit: PRODUIT,
          prenom: prenom,
          nom: nom,
          email: email,
          sujet: sujet,
          message: message,
        }),
      });
      const d = await r.json();
      if (d && d.success) {
        setParti(true);
      } else {
        setErreur((d && d.error)
          || "Votre message n'a pas pu etre transmis. Ecrivez-nous a contact@academiapro.fr.");
      }
    } catch (e) {
      setErreur("Votre message n'a pas pu etre transmis. Ecrivez-nous a contact@academiapro.fr.");
    }
    setEnvoi(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "60px 20px" }}>
      <div style={{ maxWidth: "600px",
        margin: "0 auto" }}>
        <div style={{ textAlign: "center",
          marginBottom: "40px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px",
            letterSpacing: "3px", margin: "0 0 12px" }}>
            {txt.surTitre}
          </p>
          <h1 style={{ color: "#fff", fontSize: "32px",
            margin: "0 0 12px" }}>{txt.titre}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)",
            fontSize: "15px", margin: "0" }}>
            {txt.sousTitre}
          </p>
        </div>

        <div style={{ background: "#1a1a2e",
          borderRadius: "16px", padding: "40px",
          border: "1px solid rgba(200,169,110,0.3)" }}>

          {parti ? (
            // ---- LE MESSAGE EST PARTI ----
            // Le formulaire disparait : rien ne doit inviter a envoyer deux
            // fois le meme message.
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ color: "#c8a96e", fontSize: "18px",
                lineHeight: "1.7", margin: 0 }}>
                {txt.merci}
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>{txt.champs.prenom}</label>
                <input type="text" style={champStyle}
                  value={prenom}
                  onChange={function (e) { setPrenom(e.target.value); }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>{txt.champs.nom}</label>
                <input type="text" style={champStyle}
                  value={nom}
                  onChange={function (e) { setNom(e.target.value); }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>{txt.champs.email}</label>
                <input type="email" style={champStyle}
                  value={email}
                  onChange={function (e) { setEmail(e.target.value); }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>{txt.champs.sujet}</label>
                <input type="text" style={champStyle}
                  value={sujet}
                  onChange={function (e) { setSujet(e.target.value); }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>
                  {txt.champs.message}
                </label>
                <textarea style={{ ...champStyle, height: "120px" }}
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
                  color: "#050508", border: "none",
                  borderRadius: "8px", padding: "14px",
                  fontSize: "15px", fontWeight: "bold",
                  fontFamily: "Georgia, serif",
                  cursor: envoi ? "default" : "pointer" }}>
                {envoi ? txt.envoi : txt.bouton}
              </button>

              <p style={{ color: "rgba(255,255,255,0.4)",
                fontSize: "12px", textAlign: "center",
                marginTop: "16px" }}>
                {txt.bas}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
