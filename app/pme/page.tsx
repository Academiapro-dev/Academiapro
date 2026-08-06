"use client";
import { useState } from "react";

const OR = "#c8a96e";
const FOND = "#050508";
const CARTE = "#1a1a2e";

export default function PmePage() {
  const [envoi, setEnvoi] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [nom, setNom] = useState("");
  const [societe, setSociete] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [effectif, setEffectif] = useState("");
  const [secteur, setSecteur] = useState("");
  const [certifie, setCertifie] = useState("");
  const [texte, setTexte] = useState("");
  const [piege, setPiege] = useState("");

  async function envoyer() {
    setErreur("");
    setMessage("");
    if (!nom.trim()) { setErreur("Merci d'indiquer votre nom."); return; }
    if (email.indexOf("@") < 1) { setErreur("Adresse électronique invalide."); return; }
    setEnvoi("1");
    try {
      const r = await fetch("/api/prospect-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom, email: email, telephone: telephone, societe: societe,
          effectif: effectif, secteur: secteur, certifie: certifie, message: texte,
          domaine: "PME", formation_interesse: "Qualiopi et pack",
          source: "formulaire", pays: "FR", societe_bis: piege,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message || "Merci, votre demande est enregistrée.");
        setNom(""); setSociete(""); setEmail(""); setTelephone("");
        setEffectif(""); setSecteur(""); setCertifie(""); setTexte("");
      } else {
        setErreur(d.erreur || "Envoi impossible.");
      }
    } catch (e) {
      setErreur("Envoi impossible. Réessayez dans un instant.");
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
        <p style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>PETITES ET MOYENNES ENTREPRISES</p>
        <h1 style={{ fontSize: "34px", margin: "0 0 18px", lineHeight: 1.3, maxWidth: "780px", marginLeft: "auto", marginRight: "auto" }}>
          Votre budget formation existe.<br />Encore faut-il pouvoir l'employer.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", lineHeight: 1.75, maxWidth: "680px", margin: "0 auto 30px" }}>
          Vous cotisez chaque année à un opérateur de compétences. Devenez votre
          propre organisme de formation, formez vos équipes en interne, et
          mobilisez ces fonds au lieu de les laisser dormir.
        </p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/rejoindre?profil=devenir_of" style={{ display: "inline-block", background: OR, color: FOND, padding: "15px 38px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
            Ouvrir mon espace
          </a>
          <a href="#rendez-vous" style={{ display: "inline-block", background: "transparent", color: OR, padding: "15px 38px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "16px", border: "1px solid rgba(200,169,110,0.5)" }}>
            Demander un rendez-vous
          </a>
        </div>
      </section>

      <section style={{ maxWidth: "820px", margin: "0 auto", padding: "60px 24px 20px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 14px" }}>Le raisonnement</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15.5px", lineHeight: 1.85, margin: "0 0 16px" }}>
          Une entreprise ne peut pas mobiliser les fonds de la formation
          professionnelle pour ses propres actions internes sans être elle-même
          déclarée comme organisme de formation, et certifiée Qualiopi.
        </p>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15.5px", lineHeight: 1.85, margin: "0 0 16px" }}>
          Les grands groupes l'ont compris depuis longtemps : ils ont leur centre
          de formation interne. Les PME y renoncent, parce que la certification
          demande un référentiel à tenir, des documents à produire et des audits à
          passer — un métier qui n'est pas le leur.
        </p>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15.5px", lineHeight: 1.85, margin: 0 }}>
          C'est exactement ce que nous portons pour vous.
        </p>
      </section>

      <section style={{ maxWidth: "820px", margin: "0 auto", padding: "30px 24px 20px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 24px" }}>En deux temps</h2>

        <div style={{ background: CARTE, border: "1px solid rgba(200,169,110,0.25)", borderRadius: "13px", padding: "24px", marginBottom: "16px" }}>
          <p style={{ color: OR, fontSize: "13px", letterSpacing: "2px", margin: "0 0 8px" }}>PREMIER TEMPS</p>
          <h3 style={{ color: "#fff", fontSize: "19px", margin: "0 0 12px" }}>Vous devenez organisme de formation</h3>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: 1.8, margin: 0 }}>
            Notre logiciel vous conduit indicateur par indicateur jusqu'au dossier
            d'audit : ce qu'il faut produire, ce qu'il faut prouver, ce qui manque
            encore. Vous gardez la main sur votre déclaration d'activité et sur
            votre certification.
          </p>
        </div>

        <div style={{ background: CARTE, border: "1px solid rgba(200,169,110,0.25)", borderRadius: "13px", padding: "24px" }}>
          <p style={{ color: OR, fontSize: "13px", letterSpacing: "2px", margin: "0 0 8px" }}>SECOND TEMPS</p>
          <h3 style={{ color: "#fff", fontSize: "19px", margin: "0 0 12px" }}>Vous formez vos salariés</h3>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: 1.8, margin: 0 }}>
            Plateforme complète sous votre marque, catalogue ouvert, création de vos
            propres parcours métier, évaluations corrigées individuellement,
            conventions et attestations produites, bilan pédagogique préparé.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: "820px", margin: "0 auto", padding: "30px 24px 20px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 8px" }}>Ce que le catalogue couvre</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 20px", lineHeight: 1.75 }}>
          Plus de trois cents parcours, adaptables à vos métiers.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
          {[
            { t: "Sécurité et prévention", d: "Sécurité au poste et sur chantier, gestes et postures, risques chimiques, travail en hauteur" },
            { t: "Management et encadrement", d: "Encadrement d'équipe, conduite du changement, entretiens difficiles, motivation" },
            { t: "Numérique et intelligence artificielle", d: "Outils IA, automatisation, bureautique, cybersécurité" },
            { t: "Savoirs de base et intégration", d: "Lecture de consignes, calculs professionnels, accueil des nouveaux, savoir-être" },
            { t: "Commerce et relation client", d: "Vente, négociation, prospection, communication professionnelle" },
            { t: "Gestion et finance", d: "Comptabilité, fiscalité, tableaux de bord, pilotage de la performance" },
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
          <h2 style={{ color: OR, fontSize: "20px", margin: "0 0 14px" }}>Ce qu'il faut savoir avant de commencer</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: 1.8, margin: "0 0 14px" }}>
            La certification Qualiopi n'est ni immédiate ni gratuite : elle suppose
            un audit initial, un audit de surveillance et un renouvellement tous les
            trois ans, ainsi que des indicateurs à tenir dans la durée. Comptez
            plusieurs mois avant votre première prise en charge.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: 1.8, margin: "0 0 14px" }}>
            Les règles de prise en charge dépendent de votre branche et de votre
            opérateur de compétences. Nous vous aidons à y voir clair, mais la
            décision de financement leur appartient.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: 1.75, margin: 0 }}>
            AcadémIA Pro LLC n'est pas certifiée Qualiopi et ses formations ne sont
            enregistrées ni au Répertoire national des certifications
            professionnelles ni au répertoire spécifique. Nous fournissons le
            logiciel, le contenu et la plateforme ; la certification, la déclaration
            d'activité et la responsabilité pédagogique demeurent les vôtres. Nous
            ne garantissons aucune obtention de certification ni aucune prise en
            charge.
          </p>
        </div>
      </section>

      <section id="rendez-vous" style={{ maxWidth: "620px", margin: "0 auto", padding: "10px 24px 80px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 8px", textAlign: "center" }}>Parlons de votre entreprise</h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", textAlign: "center", margin: "0 0 28px", lineHeight: 1.75 }}>
          Nous vous rappelons sous quarante-huit heures ouvrées.
        </p>

        <div style={{ background: CARTE, borderRadius: "14px", padding: "28px", border: "1px solid rgba(200,169,110,0.3)" }}>
          <span style={lib}>Votre nom</span>
          <input value={nom} onChange={function (e) { setNom(e.target.value); }} style={champ} />

          <span style={lib}>Votre entreprise</span>
          <input value={societe} onChange={function (e) { setSociete(e.target.value); }} style={champ} />

          <span style={lib}>Adresse électronique</span>
          <input type="email" value={email} onChange={function (e) { setEmail(e.target.value); }} style={champ} />

          <span style={lib}>Téléphone</span>
          <input value={telephone} onChange={function (e) { setTelephone(e.target.value); }} style={champ} />

          <span style={lib}>Combien de salariés</span>
          <select value={effectif} onChange={function (e) { setEffectif(e.target.value); }} style={champ}>
            <option value="">Choisir</option>
            <option value="moins de 20">Moins de 20</option>
            <option value="20 a 50">20 à 50</option>
            <option value="50 a 250">50 à 250</option>
            <option value="plus de 250">Plus de 250</option>
          </select>

          <span style={lib}>Votre secteur</span>
          <select value={secteur} onChange={function (e) { setSecteur(e.target.value); }} style={champ}>
            <option value="">Choisir</option>
            <option value="BTP et travaux publics">BTP et travaux publics</option>
            <option value="Industrie">Industrie</option>
            <option value="Commerce et distribution">Commerce et distribution</option>
            <option value="Transport et logistique">Transport et logistique</option>
            <option value="Services et conseil">Services et conseil</option>
            <option value="Sante et social">Santé et social</option>
            <option value="Hotellerie et restauration">Hôtellerie et restauration</option>
            <option value="Autre">Autre</option>
          </select>

          <span style={lib}>Êtes-vous déjà organisme de formation</span>
          <select value={certifie} onChange={function (e) { setCertifie(e.target.value); }} style={champ}>
            <option value="">Choisir</option>
            <option value="certifie Qualiopi">Oui, certifié Qualiopi</option>
            <option value="declare non certifie">Déclaré mais non certifié</option>
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
            {envoi ? "Envoi en cours…" : "Demander un rendez-vous"}
          </button>

          {message && <p style={{ color: "#4caf50", fontSize: "15px", marginTop: "14px", textAlign: "center" }}>{message}</p>}
          {erreur && <p style={{ color: "#e8836a", fontSize: "15px", marginTop: "14px", textAlign: "center" }}>{erreur}</p>}

          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "16px", lineHeight: 1.7, textAlign: "center" }}>
            Vos coordonnées servent uniquement à vous recontacter. Aucune diffusion à des tiers.
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", margin: "0 0 14px" }}>
            Vous préférez commencer tout de suite ?
          </p>
          <a href="/rejoindre?profil=devenir_of" style={{ display: "inline-block", border: "1px solid rgba(200,169,110,0.5)", color: OR, padding: "13px 30px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}>
            Ouvrir mon espace
          </a>
        </div>

        <p style={{ textAlign: "center", marginTop: "26px" }}>
          <a href="/b2b" style={{ color: OR, fontSize: "14px" }}>Nos conditions et nos tarifs</a>
        </p>
      </section>

    </div>
  );
}
