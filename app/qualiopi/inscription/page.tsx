"use client";
import { useState } from "react";
import Link from "next/link";

const VERT = "#3d9970";
const NOIR = "#050508";

// L INSCRIPTION.
//
// Trois champs obligatoires, pas un de plus : le nom, l adresse, et le
// numero de declaration d activite qui reste facultatif. Un organisme qui
// doit remplir un formulaire de vingt lignes avant d avoir rien vu s en va.
//
// LES CATEGORIES D ACTION, en revanche, se demandent tout de suite. Le
// Referentiel National Qualite n applique pas les memes indicateurs a un
// centre de formation, a un CFA ou a un centre de bilan de competences.
// Les connaitre des le depart evite de reclamer plus tard des preuves qui
// ne concernent pas l organisme — et c est ce qui fait perdre le plus de
// temps a ceux qui preparent leur audit.

const ACTIONS = [
  { cle: "action_formation", nom: "Actions de formation", defaut: true },
  { cle: "action_apprentissage", nom: "Apprentissage", defaut: false },
  { cle: "action_bilan", nom: "Bilans de compétences", defaut: false },
  { cle: "action_vae", nom: "Validation des acquis de l'expérience", defaut: false },
];

const PARTICULARITES = [
  { cle: "formations_certifiantes", nom: "Certaines de mes formations mènent à une certification" },
  { cle: "recours_sous_traitance", nom: "Je fais appel à des sous-traitants ou des formateurs externes" },
  { cle: "afest", nom: "Je pratique la formation en situation de travail" },
];

export default function InscriptionQualiopi() {
  const [raisonSociale, setRaisonSociale] = useState("");
  const [email, setEmail] = useState("");
  const [numeroDa, setNumeroDa] = useState("");
  const [piege, setPiege] = useState("");
  const [choix, setChoix] = useState<any>({ action_formation: true });
  const [etat, setEtat] = useState("");
  const [message, setMessage] = useState("");

  function bascule(cle: string) {
    setChoix({ ...choix, [cle]: !choix[cle] });
  }

  async function envoyer() {
    if (!raisonSociale || raisonSociale.trim().length < 2) {
      setEtat("erreur");
      setMessage("Indiquez le nom de votre organisme.");
      return;
    }
    if (!email || email.indexOf("@") < 1) {
      setEtat("erreur");
      setMessage("Indiquez une adresse électronique valable.");
      return;
    }

    setEtat("envoi");
    setMessage("");

    try {
      const r = await fetch("/api/qualiopi/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raison_sociale: raisonSociale,
          email: email,
          numero_da: numeroDa,
          societe_bis: piege,
          ...choix,
        }),
      });
      const d = await r.json();

      if (d.ok) {
        setEtat("merci");
        setMessage(d.message || "Votre espace est ouvert.");
      } else {
        setEtat("erreur");
        setMessage(d.erreur || "L'ouverture n'a pas abouti.");
      }
    } catch (e: any) {
      setEtat("erreur");
      setMessage("L'ouverture n'a pas abouti. Réessayez dans un instant.");
    }
  }

  const section: any = { maxWidth: "640px", margin: "0 auto", padding: "0 24px" };

  const champ: any = {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "9px",
    border: "1px solid rgba(61,153,112,0.32)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "16px",
    fontFamily: "Georgia, serif",
    boxSizing: "border-box",
    marginBottom: "6px",
  };

  const libelle: any = { display: "block", color: VERT, fontSize: "13.5px", margin: "18px 0 6px" };
  const aide: any = { color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "0 0 4px", lineHeight: "1.6" };

  function Case({ cle, nom }: any) {
    const actif = choix[cle] === true;
    return (
      <div
        onClick={function () { bascule(cle); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "13px 15px",
          marginBottom: "8px",
          borderRadius: "9px",
          border: "1px solid " + (actif ? "rgba(61,153,112,0.6)" : "rgba(255,255,255,0.12)"),
          background: actif ? "rgba(61,153,112,0.1)" : "rgba(255,255,255,0.02)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "5px",
            border: "1px solid " + (actif ? VERT : "rgba(255,255,255,0.3)"),
            background: actif ? VERT : "transparent",
            color: "#fff",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {actif ? "✓" : ""}
        </span>
        <span style={{ fontSize: "15px", color: actif ? "#fff" : "rgba(255,255,255,0.7)" }}>{nom}</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <header style={{ borderBottom: "1px solid rgba(61,153,112,0.2)", padding: "22px 0" }}>
        <div style={{ ...section, maxWidth: "1080px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <Link href="/qualiopi" style={{ color: VERT, fontSize: "21px", fontWeight: "bold", textDecoration: "none" }}>
            Mr. Qualiopi
          </Link>
          <Link href="/qualiopi" style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", textDecoration: "none" }}>
            ← Retour
          </Link>
        </div>
      </header>

      <div style={{ ...section, paddingTop: "60px", paddingBottom: "90px" }}>

        {etat === "merci" ? (
          <div style={{ textAlign: "center", paddingTop: "40px" }}>
            <h1 style={{ fontSize: "28px", margin: "0 0 16px" }}>C'est ouvert</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16.5px", lineHeight: "1.8", margin: "0 0 28px" }}>
              {message}
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14.5px", lineHeight: "1.8" }}>
              Vous recevez un lien de connexion par courriel. Aucun mot de passe à retenir.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: "30px", margin: "0 0 12px", lineHeight: "1.3" }}>
              Ouvrez votre espace
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.75", margin: "0 0 34px" }}>
              Une minute. Vous verrez ensuite, indicateur par indicateur, ce que
              l'auditeur attend de vous et ce qu'il vous manque.
            </p>

            <label style={libelle}>Le nom de votre organisme</label>
            <input
              value={raisonSociale}
              onChange={function (e) { setRaisonSociale(e.target.value); }}
              placeholder="Centre de formation Dupont"
              style={champ}
            />

            <label style={libelle}>Votre adresse électronique</label>
            <input
              type="email"
              value={email}
              onChange={function (e) { setEmail(e.target.value); }}
              placeholder="contact@monorganisme.fr"
              style={champ}
            />

            <label style={libelle}>Votre numéro de déclaration d'activité</label>
            <p style={aide}>Facultatif. Vous pourrez le renseigner plus tard.</p>
            <input
              value={numeroDa}
              onChange={function (e) { setNumeroDa(e.target.value); }}
              placeholder="11 75 12345 75"
              style={champ}
            />

            {/* Champ piege : un robot le remplit, un humain ne le voit pas. */}
            <input
              value={piege}
              onChange={function (e) { setPiege(e.target.value); }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}
            />

            <label style={{ ...libelle, marginTop: "30px" }}>Ce que vous faites</label>
            <p style={aide}>
              Tous les indicateurs ne s'appliquent pas à tous. C'est ce choix qui
              détermine ce que l'auditeur vous demandera.
            </p>
            {ACTIONS.map(function (a) {
              return <Case key={a.cle} cle={a.cle} nom={a.nom} />;
            })}

            <label style={{ ...libelle, marginTop: "26px" }}>Vos particularités</label>
            <p style={aide}>
              Chacune ajoute des indicateurs spécifiques. Mieux vaut le dire maintenant
              que le découvrir en audit.
            </p>
            {PARTICULARITES.map(function (p) {
              return <Case key={p.cle} cle={p.cle} nom={p.nom} />;
            })}

            <button
              onClick={envoyer}
              disabled={etat === "envoi"}
              style={{
                width: "100%",
                marginTop: "30px",
                background: etat === "envoi" ? "rgba(61,153,112,0.35)" : VERT,
                color: "#fff",
                border: "none",
                borderRadius: "9px",
                padding: "17px 24px",
                fontSize: "16.5px",
                fontWeight: "bold",
                fontFamily: "Georgia, serif",
                cursor: etat === "envoi" ? "default" : "pointer",
              }}
            >
              {etat === "envoi" ? "Ouverture en cours…" : "Ouvrir mon espace"}
            </button>

            {etat === "erreur" && (
              <p style={{ color: "#e8836a", fontSize: "14.5px", margin: "14px 0 0", lineHeight: "1.7" }}>
                {message}
              </p>
            )}

            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", lineHeight: "1.8", margin: "24px 0 0" }}>
              En ouvrant un espace, vous acceptez les{" "}
              <Link href="/qualiopi/cgv" style={{ color: VERT }}>conditions générales de vente</Link>.
              Mr. Qualiopi n'est pas un organisme certificateur et ne délivre aucune
              certification.
            </p>
          </>
        )}

      </div>

      <footer style={{ borderTop: "1px solid rgba(61,153,112,0.2)", padding: "30px 0" }}>
        <div style={{ ...section, maxWidth: "1080px" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
            AcadéMIA Pro LLC · 30 N Gould St, STE R, Sheridan WY 82801, États-Unis ·
            contact@academiapro.fr
          </p>
        </div>
      </footer>

    </div>
  );
}
