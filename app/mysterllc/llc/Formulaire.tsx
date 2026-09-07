"use client";

// ---------------------------------------------------------------------------
// LE FORMULAIRE DE LA LANDING PAGE LLC — 07/09.
//
// POURQUOI UN FICHIER SEPARE. La page qui l entoure est un composant
// serveur : elle porte les metadonnees et le contenu. Un formulaire a
// besoin d etat et d evenements, donc de "use client". Les deux ne peuvent
// pas cohabiter dans le meme fichier — une page qui declare "use client" ne
// peut plus exporter `metadata`.
//
// 🚨 TROIS CHAMPS, PAS UN DE PLUS. Chaque champ ajoute fait perdre des
// reponses. Le nom, le telephone, la raison sociale se demanderont plus
// tard, dans l echange qui suit.
//
// ⚠️ LE CHAMP `societe` EST UN PIEGE A ROBOTS. Il est invisible a l ecran
// et vide chez un humain : rempli, la route ignore l envoi en silence. Ne
// pas le retirer, ne pas le rendre visible, ne pas le renommer.
//
// ⚠️ LE BOUTON SE DESACTIVE PENDANT L ENVOI. Sans cela, un double clic
// envoie deux fois — et la table refuse la seconde ligne, ce qui affiche
// une erreur a quelqu un qui vient de reussir.
// ---------------------------------------------------------------------------

import { useState } from "react";

const OR = "#c8a96e";
const NUIT = "#050508";

// 🚨 CETTE LISTE DOIT RESTER IDENTIQUE A CELLE DE LA ROUTE
// app/api/llc/inscription/route.ts. Un Etat propose ici mais absent de la
// route donnerait un courriel sans aucune echeance d Etat, en silence.
const ETATS = [
  { code: "WY", nom: "Wyoming" },
  { code: "DE", nom: "Delaware" },
  { code: "NM", nom: "Nouveau-Mexique" },
  { code: "NV", nom: "Nevada" },
  { code: "FL", nom: "Floride" },
  { code: "TX", nom: "Texas" },
  { code: "MT", nom: "Montana" },
  { code: "AUTRE", nom: "Un autre État" },
];

export default function Formulaire() {
  const [dejaUne, setDejaUne] = useState<boolean | null>(null);
  const [etat, setEtat] = useState("");
  const [email, setEmail] = useState("");
  const [societe, setSociete] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);
  const [erreur, setErreur] = useState("");

  const champ: any = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(200,169,110,0.3)",
    borderRadius: "10px",
    padding: "14px 16px",
    color: "#fff",
    fontSize: "16px",
    boxSizing: "border-box",
  };

  const etiquette: any = {
    display: "block",
    color: "rgba(255,255,255,0.6)",
    fontSize: "13.5px",
    marginBottom: "9px",
  };

  function choix(valeur: boolean) {
    const actif = dejaUne === valeur;
    return {
      flex: 1,
      background: actif ? "rgba(200,169,110,0.16)" : "rgba(255,255,255,0.04)",
      border: "1px solid "
        + (actif ? "rgba(200,169,110,0.65)" : "rgba(200,169,110,0.22)"),
      borderRadius: "10px",
      padding: "14px 12px",
      color: actif ? OR : "rgba(255,255,255,0.65)",
      fontSize: "14.5px",
      cursor: "pointer",
      textAlign: "center",
    } as any;
  }

  async function envoyer() {
    setErreur("");

    if (!email.includes("@") || email.length < 6) {
      setErreur("Cette adresse ne semble pas valide.");
      return;
    }
    if (dejaUne === null) {
      setErreur("Dites-nous simplement où vous en êtes.");
      return;
    }
    if (dejaUne && !etat) {
      setErreur("Indiquez l'État de constitution.");
      return;
    }

    setEnvoi(true);

    try {
      const r = await fetch("/api/llc/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          etat: dejaUne ? etat : "",
          a_deja_une_llc: dejaUne,
          societe: societe,
          origine: "landing-llc",
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        setErreur(data?.erreur || "L'envoi n'a pas abouti. Réessayez.");
        setEnvoi(false);
        return;
      }

      setFait(true);
    } catch {
      setErreur("L'envoi n'a pas abouti. Réessayez.");
      setEnvoi(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // APRES L ENVOI.
  //
  // ⚠️ ON NE PROMET PAS UN DELAI. « Dans quelques minutes » devient faux
  // des que Resend prend du retard, et le visiteur qui attend se sent
  // trompe des la premiere minute.
  // ─────────────────────────────────────────────────────────────────────
  if (fait) {
    return (
      <div style={{
        background: "rgba(200,169,110,0.1)",
        border: "1px solid rgba(200,169,110,0.45)",
        borderRadius: "14px",
        padding: "34px 28px",
        textAlign: "center",
      }}>
        <p style={{ color: OR, fontSize: "19px", fontFamily: "Georgia,serif",
          margin: "0 0 12px" }}>
          C&apos;est noté.
        </p>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px",
          lineHeight: "1.8", margin: 0 }}>
          Le récapitulatif part à l&apos;adresse que vous venez d&apos;indiquer.
          Si vous ne le voyez pas, regardez dans les indésirables : un premier
          message venu d&apos;un expéditeur inconnu y atterrit souvent.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(200,169,110,0.28)",
      borderRadius: "14px",
      padding: "30px 26px",
    }}>

      <label style={etiquette}>Où en êtes-vous ?</label>
      <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
        <div
          onClick={function () { setDejaUne(true); }}
          style={choix(true)}
        >
          J&apos;ai déjà une LLC
        </div>
        <div
          onClick={function () { setDejaUne(false); setEtat(""); }}
          style={choix(false)}
        >
          J&apos;y réfléchis
        </div>
      </div>

      {dejaUne === true && (
        <div style={{ marginBottom: "22px" }}>
          <label style={etiquette}>Son État de constitution</label>
          <select
            value={etat}
            onChange={function (e: any) { setEtat(e.target.value); }}
            style={champ}
          >
            <option value="" style={{ color: NUIT }}>Choisissez</option>
            {ETATS.map(function (e) {
              return (
                <option key={e.code} value={e.code} style={{ color: NUIT }}>
                  {e.nom}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div style={{ marginBottom: "22px" }}>
        <label style={etiquette}>Votre adresse électronique</label>
        <input
          type="email"
          value={email}
          onChange={function (e: any) { setEmail(e.target.value); }}
          placeholder="vous@exemple.com"
          style={champ}
        />
      </div>

      {/* PIEGE A ROBOTS — invisible, doit rester vide. */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
        aria-hidden="true">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={societe}
          onChange={function (e: any) { setSociete(e.target.value); }}
        />
      </div>

      {erreur !== "" && (
        <p style={{ color: "#e0a458", fontSize: "14px", margin: "0 0 16px" }}>
          {erreur}
        </p>
      )}

      <button
        onClick={envoyer}
        disabled={envoi}
        style={{
          width: "100%",
          background: envoi
            ? "rgba(200,169,110,0.35)"
            : "linear-gradient(135deg,#c8a96e,#a07840)",
          color: NUIT,
          border: "none",
          padding: "16px",
          borderRadius: "10px",
          fontWeight: "bold",
          fontSize: "16px",
          cursor: envoi ? "default" : "pointer",
        }}
      >
        {envoi ? "Envoi en cours…" : "Recevoir le récapitulatif"}
      </button>

      <p style={{ color: "rgba(255,255,255,0.32)", fontSize: "12.5px",
        lineHeight: "1.7", margin: "16px 0 0", textAlign: "center" }}>
        Votre adresse sert à vous envoyer ce récapitulatif et, le cas échéant,
        à vous répondre. Chaque message porte un lien de désinscription.
      </p>
    </div>
  );
}
