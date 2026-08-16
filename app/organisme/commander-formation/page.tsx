"use client";
import { useState } from "react";

// LA COMMANDE D UNE FORMATION SUR MESURE — LE GESTE QUI SERT LA STRATEGIE.
//
// Decision de Jacques le 16/08 : AcadeMIA Pro ne vend pas un outil de
// fabrication, elle DEVIENT LE CATALOGUE. Un client qui fabrique lui-meme
// fait de nous un concurrent de Digiforma sur son terrain ; un client qui
// NOUS COMMANDE ses formations fait grossir notre catalogue et ne peut plus
// partir.
//
// ON N INTERDIT RIEN, ON ORIENTE. La redaction assistee reste ouverte a
// cote. Les 90 EUR par formation redigee rendent la fabrication moins
// attirante ; cette page rend la commande plus simple.
//
// AUCUN PRIX ANNONCE, et c est volontaire : une formation sur mesure se
// chiffre apres avoir su ce que le client veut. Le devis part apres
// l echange, comme pour le pack et pour Mr. Comptable.
//
// LA PROMESSE EST TENABLE ET VERIFIABLE : « pas encore au catalogue, produite
// sur mesure dans la semaine ». Jacques voulait d abord dire qu elle existait
// deja — mais cela se dement en trois clics, alors que le sur-mesure est
// precisement ce qu aucun concurrent ne sait faire.

export default function PageCommanderFormation() {
  const [sujet, setSujet] = useState("");
  const [duree, setDuree] = useState("");
  const [echeance, setEcheance] = useState("");
  const [publicVise, setPublicVise] = useState("");
  const [objectifs, setObjectifs] = useState("");

  const [occupe, setOccupe] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  function suffixe(sep: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? sep + "tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function envoyer() {
    if (sujet.trim().length < 4) {
      setErreur("Indiquez le sujet de la formation souhaitée.");
      return;
    }
    setOccupe(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/commander-formation" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sujet: sujet,
          duree: duree,
          echeance: echeance,
          public_vise: publicVise,
          objectifs: objectifs,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message || "Votre demande est transmise.");
        setEnvoye(true);
      } else {
        setErreur(d.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe(false);
  }

  const OR = "#c8a96e";

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
    padding: "24px 26px",
    marginBottom: "16px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "14px",
    resize: "vertical",
  };

  const LIBELLE: any = {
    display: "block",
    color: OR,
    fontSize: "13px",
    marginBottom: "5px",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href={"/organisme" + suffixe("?")} style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          FORMATION SUR MESURE
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 10px", lineHeight: "1.3" }}>
          Dites-nous ce qu'il vous manque,<br />nous l'écrivons pour vous
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.8", marginTop: 0 }}>
          Vous cherchez une formation qui n'est pas encore à notre catalogue ? Nous la
          produisons sur mesure, avec ses modules, ses exercices corrigés, ses questionnaires
          et son manuel — comptez une semaine. Vous la validez avant publication, et elle
          apparaît sous votre marque.
        </p>

        {envoye ? (
          <div style={{ ...CARTE, borderColor: "rgba(76,175,80,0.45)" }}>
            <h2 style={{ color: "#4caf50", fontSize: "21px", margin: "0 0 10px" }}>
              C'est noté
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.8", margin: 0 }}>
              {message}
            </p>
            <a
              href={"/organisme" + suffixe("?")}
              style={{ display: "inline-block", marginTop: "20px", background: OR, color: "#050508", padding: "13px 26px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}
            >
              Retour à mon espace
            </a>
          </div>
        ) : (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Sujet de la formation *</span>
            <input
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Prévention des risques psychosociaux en entreprise"
              style={CHAMP}
            />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Durée souhaitée</span>
                <input
                  value={duree}
                  onChange={(e) => setDuree(e.target.value)}
                  placeholder="14 heures, 2 jours…"
                  style={CHAMP}
                />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Pour quand</span>
                <input
                  value={echeance}
                  onChange={(e) => setEcheance(e.target.value)}
                  placeholder="Session de novembre"
                  style={CHAMP}
                />
              </div>
            </div>

            <span style={LIBELLE}>Public visé</span>
            <input
              value={publicVise}
              onChange={(e) => setPublicVise(e.target.value)}
              placeholder="Encadrants intermédiaires, sans prérequis"
              style={CHAMP}
            />

            <span style={LIBELLE}>Ce que le stagiaire doit savoir faire à la fin</span>
            <textarea
              value={objectifs}
              onChange={(e) => setObjectifs(e.target.value)}
              rows={6}
              placeholder="Repérer les signaux d'alerte, conduire un entretien, orienter vers les bons relais…"
              style={CHAMP}
            />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-6px 0 16px", lineHeight: "1.7" }}>
              C'est le point le plus utile : plus vous êtes précis sur ce que la personne
              doit savoir faire, plus la formation tombera juste du premier coup.
            </p>

            {erreur && (
              <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>
            )}

            <button
              onClick={envoyer}
              disabled={occupe || sujet.trim().length < 4}
              style={{
                width: "100%",
                background: occupe || sujet.trim().length < 4 ? "rgba(200,169,110,0.3)" : OR,
                color: occupe || sujet.trim().length < 4 ? "#8a8a8a" : "#050508",
                padding: "15px 30px",
                borderRadius: "8px",
                border: "none",
                cursor: occupe || sujet.trim().length < 4 ? "default" : "pointer",
                fontWeight: "bold",
                fontSize: "16px",
                fontFamily: "Georgia,serif",
              }}
            >
              {occupe ? "Envoi…" : "Demander cette formation"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.7" }}>
              Nous revenons vers vous sous quarante-huit heures avec le contenu envisagé et son
              tarif. Rien n'est engagé tant que vous n'avez pas validé.
            </p>
          </div>
        )}

        <div style={{ ...CARTE, background: "rgba(255,255,255,0.015)" }}>
          <h2 style={{ color: OR, fontSize: "17px", margin: "0 0 10px" }}>
            Ou écrivez-la vous-même
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
            Vous préférez garder la main ? Créez votre formation depuis vos cours et rédigez
            vos modules, seul ou avec l'assistant. Vos formations vous appartiennent, et
            aucune part n'est due sur ce que vous en vendez.
          </p>
          <a
            href={"/organisme/cours" + suffixe("?")}
            style={{ display: "inline-block", marginTop: "16px", color: OR, fontSize: "15px", textDecoration: "none", border: "1px solid rgba(200,169,110,0.4)", padding: "11px 22px", borderRadius: "20px" }}
          >
            Créer une formation moi-même →
          </a>
        </div>
      </div>
    </div>
  );
}
