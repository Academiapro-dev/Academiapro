"use client";
import { useState } from "react";

const OR = "#c8a96e";
const FOND = "#050508";
const CARTE = "#1a1a2e";

export default function EsnPage() {
  const [envoi, setEnvoi] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [nom, setNom] = useState("");
  const [societe, setSociete] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [effectif, setEffectif] = useState("");
  const [certifie, setCertifie] = useState("");
  const [texte, setTexte] = useState("");
  const [piege, setPiege] = useState("");

  async function envoyer() {
    setErreur("");
    setMessage("");
    if (!nom.trim()) { setErreur("Merci d indiquer votre nom."); return; }
    if (email.indexOf("@") < 1) { setErreur("Adresse electronique invalide."); return; }
    setEnvoi("1");
    try {
      const r = await fetch("/api/prospect-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom, email: email, telephone: telephone, societe: societe,
          effectif: effectif, certifie: certifie, message: texte,
          domaine: "ESN", formation_interesse: "Qualiopi et pack",
          source: "formulaire", societe_bis: piege,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message || "Merci, votre demande est enregistree.");
        setNom(""); setSociete(""); setEmail(""); setTelephone("");
        setEffectif(""); setCertifie(""); setTexte("");
      } else {
        setErreur(d.erreur || "Envoi impossible.");
      }
    } catch (e) {
      setErreur("Envoi impossible. Reessayez dans un instant.");
    }
    setEnvoi("");
  }

  const champ: any = {
    width: "100%", padding: "13px 15px", borderRadius: "9px",
    border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)",
    color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif",
    boxSizing: "border-box", marginBottom: "13px",
  };

  const lib: any = { display: "block", color: OR, fontSize: "13px", marginBottom: "5px" };

  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif" }}>

      <section style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "70px 24px", textAlign: "center" }}>
        <p style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>SOCIETES DE SERVICES DU NUMERIQUE</p>
        <h1 style={{ fontSize: "34px", margin: "0 0 18px", lineHeight: 1.3, maxWidth: "780px", marginLeft: "auto", marginRight: "auto" }}>
          Formez vos consultants avec<br />le budget qui existe deja
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", lineHeight: 1.75, maxWidth: "680px", margin: "0 auto 30px" }}>
          Votre branche cotise a l OPCO Atlas. Devenez votre propre organisme de
          formation, formez vos equipes en interne, et mobilisez ces fonds au lieu
          de les laisser dormir.
        </p>
        <a href="#rendez-vous" style={{ display: "inline-block", background: OR, color: FOND, padding: "15px 38px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
          Demander un rendez-vous
        </a>
      </section>

      <section style={{ maxWidth: "820px", margin: "0 auto", padding: "60px 24px 20px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 14px" }}>Le raisonnement</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15.5px", lineHeight: 1.85, margin: "0 0 16px" }}>
          Une entreprise ne peut pas mobiliser les fonds de la formation
          professionnelle pour ses propres actions internes sans etre elle-meme
          declaree comme organisme de formation, et certifiee Qualiopi.
        </p>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15.5px", lineHeight: 1.85, margin: "0 0 16px" }}>
          Les grandes structures l ont compris depuis longtemps : elles ont leur
          academie interne. Les plus petites y renoncent, parce que la certification
          demande un referentiel a tenir, des documents a produire et des audits a
          passer — un metier qui n est pas le leur.
        </p>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15.5px", lineHeight: 1.85, margin: 0 }}>
          C est exactement ce que nous portons pour vous.
        </p>
      </section>

      <section style={{ maxWidth: "820px", margin: "0 auto", padding: "30px 24px 20px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 24px" }}>En deux temps</h2>

        <div style={{ background: CARTE, border: "1px solid rgba(200,169,110,0.25)", borderRadius: "13px", padding: "24px", marginBottom: "16px" }}>
          <p style={{ color: OR, fontSize: "13px", letterSpacing: "2px", margin: "0 0 8px" }}>PREMIER TEMPS</p>
          <h3 style={{ color: "#fff", fontSize: "19px", margin: "0 0 12px" }}>Vous devenez organisme de formation</h3>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: 1.8, margin: 0 }}>
            Notre logiciel vous conduit indicateur par indicateur jusqu au dossier
            d audit : ce qu il faut produire, ce qu il faut prouver, ce qui manque
            encore. Vous gardez la main sur votre declaration d activite et sur votre
            certification.
          </p>
        </div>

        <div style={{ background: CARTE, border: "1px solid rgba(200,169,110,0.25)", borderRadius: "13px", padding: "24px" }}>
          <p style={{ color: OR, fontSize: "13px", letterSpacing: "2px", margin: "0 0 8px" }}>SECOND TEMPS</p>
          <h3 style={{ color: "#fff", fontSize: "19px", margin: "0 0 12px" }}>Vous formez vos consultants</h3>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: 1.8, margin: 0 }}>
            Plateforme complete sous votre marque, catalogue ouvert, creation de vos
            propres parcours metier, evaluations corrigees individuellement,
            conventions et attestations produites, bilan pedagogique prepare.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: "820px", margin: "0 auto", padding: "30px 24px 20px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 8px" }}>Ce que votre catalogue couvre deja</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 20px", lineHeight: 1.75 }}>
          Les axes sur lesquels votre branche concentre ses moyens en 2026.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
          {[
            { t: "Intelligence artificielle", d: "Claude et IA generative, no-code et automatisation, applications natives, IA appliquee aux metiers" },
            { t: "Cybersecurite", d: "Fondamentaux, preparation aux referentiels du marche, pratiques offensives et defensives" },
            { t: "Management", d: "Encadrement d equipe, conduite du changement, entretiens difficiles, management a distance" },
            { t: "Relation client et posture", d: "Savoir-etre en mission, conduite de reunion, communication professionnelle" },
          ].map(function (x) {
            return (
              <div key={x.t} style={{ background: CARTE, border: "1px solid rgba(200,169,110,0.15)", borderRadius: "11px", padding: "18px" }}>
                <h3 style={{ color: OR, margin: "0 0 7px", fontSize: "15px" }}>{x.t}</h3>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0, lineHeight: 1.7 }}>{x.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ maxWidth: "820px", margin: "0 auto", padding: "30px 24px 50px" }}>
        <div style={{ background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "13px", padding: "26px" }}>
          <h2 style={{ color: OR, fontSize: "20px", margin: "0 0 14px" }}>Ce qu il faut savoir avant de commencer</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: 1.8, margin: "0 0 14px" }}>
            La certification Qualiopi n est ni immediate ni gratuite : elle suppose un
            audit initial, un audit de surveillance et un renouvellement tous les trois
            ans, ainsi que des indicateurs a tenir dans la duree. Comptez plusieurs mois
            avant votre premiere prise en charge.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: 1.75, margin: 0 }}>
            AcadémIA Pro LLC n est pas certifiee Qualiopi et ses formations ne sont
            enregistrees ni au Repertoire national des certifications professionnelles
            ni au repertoire specifique. Nous fournissons le logiciel, le contenu et la
            plateforme ; la certification, la declaration d activite et la
            responsabilite pedagogique demeurent les votres. Nous ne garantissons
            aucune obtention de certification ni aucune prise en charge.
          </p>
        </div>
      </section>

      <section id="rendez-vous" style={{ maxWidth: "620px", margin: "0 auto", padding: "10px 24px 80px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 8px", textAlign: "center" }}>Parlons de votre structure</h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", textAlign: "center", margin: "0 0 28px", lineHeight: 1.75 }}>
          Nous vous rappelons sous quarante-huit heures ouvrees.
        </p>

        <div style={{ background: CARTE, borderRadius: "14px", padding: "28px", border: "1px solid rgba(200,169,110,0.3)" }}>
          <span style={lib}>Votre nom</span>
          <input value={nom} onChange={function (e) { setNom(e.target.value); }} style={champ} />

          <span style={lib}>Votre societe</span>
          <input value={societe} onChange={function (e) { setSociete(e.target.value); }} style={champ} />

          <span style={lib}>Adresse electronique</span>
          <input type="email" value={email} onChange={function (e) { setEmail(e.target.value); }} style={champ} />

          <span style={lib}>Telephone</span>
          <input value={telephone} onChange={function (e) { setTelephone(e.target.value); }} style={champ} />

          <span style={lib}>Combien de consultants</span>
          <select value={effectif} onChange={function (e) { setEffectif(e.target.value); }} style={champ}>
            <option value="">Choisir</option>
            <option value="moins de 50">Moins de 50</option>
            <option value="50 a 150">50 a 150</option>
            <option value="150 a 300">150 a 300</option>
            <option value="plus de 300">Plus de 300</option>
          </select>

          <span style={lib}>Etes-vous deja organisme de formation</span>
          <select value={certifie} onChange={function (e) { setCertifie(e.target.value); }} style={champ}>
            <option value="">Choisir</option>
            <option value="certifie Qualiopi">Oui, certifie Qualiopi</option>
            <option value="declare non certifie">Declare mais non certifie</option>
            <option value="non">Non, pas du tout</option>
          </select>

          <span style={lib}>Ce que vous cherchez (facultatif)</span>
          <textarea value={texte} onChange={function (e) { setTexte(e.target.value); }} rows={3} style={champ} />

          <input
            value={piege}
            onChange={function (e) { setPiege(e.target.value); }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}
          />

          <button onClick={envoyer} disabled={envoi !== ""}
            style={{ width: "100%", padding: "15px", background: envoi ? "rgba(200,169,110,0.4)" : OR, color: FOND, border: "none", borderRadius: "9px", fontSize: "16px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: envoi ? "default" : "pointer" }}>
            {envoi ? "Envoi en cours..." : "Demander un rendez-vous"}
          </button>

          {message && <p style={{ color: "#4caf50", fontSize: "15px", marginTop: "14px", textAlign: "center" }}>{message}</p>}
          {erreur && <p style={{ color: "#e8836a", fontSize: "15px", marginTop: "14px", textAlign: "center" }}>{erreur}</p>}

          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "16px", lineHeight: 1.7, textAlign: "center" }}>
            Vos coordonnees servent uniquement a vous recontacter. Aucune diffusion a des tiers.
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: "26px" }}>
          <a href="/b2b" style={{ color: OR, fontSize: "14px" }}>Nos conditions et nos tarifs</a>
        </p>
      </section>

    </div>
  );
}
