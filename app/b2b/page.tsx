"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";
const CARTE = "#1a1a2e";

export default function B2BPage() {
  const [nb, setNb] = useState(0);
  const [envoi, setEnvoi] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [nom, setNom] = useState("");
  const [societe, setSociete] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [certifie, setCertifie] = useState("");
  const [stagiaires, setStagiaires] = useState("");
  const [texte, setTexte] = useState("");
  const [piege, setPiege] = useState("");

  useEffect(function () {
    fetch("/api/nombre-formations")
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.success) setNb(d.total); })
      .catch(function () {});
  }, []);

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
          certifie: certifie, stagiaires_an: stagiaires, message: texte,
          domaine: "Organisme de formation", formation_interesse: "Pack LMS et CRM",
          source: "formulaire", societe_bis: piege,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message || "Merci, votre demande est enregistrée.");
        setNom(""); setSociete(""); setEmail(""); setTelephone("");
        setCertifie(""); setStagiaires(""); setTexte("");
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

  const ligne = (gauche: string, droite: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14.5px" }}>{gauche}</span>
      <span style={{ color: "#fff", fontSize: "14.5px", fontWeight: "bold", textAlign: "right", whiteSpace: "nowrap" }}>{droite}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif" }}>

      <section style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "70px 24px", textAlign: "center" }}>
        <p style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>ORGANISMES DE FORMATION ET ENTREPRISES</p>
        <h1 style={{ fontSize: "34px", margin: "0 0 18px", lineHeight: 1.3, maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
          Votre plateforme de formation,<br />ouverte demain matin
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", lineHeight: 1.75, maxWidth: "680px", margin: "0 auto 30px" }}>
          {nb > 0 ? nb + " formations" : "Un catalogue complet"} prêtes à vendre sous votre marque, un espace
          apprenant, un suivi commercial, vos documents administratifs et votre bilan
          pédagogique préparé. Vous gardez votre numéro de déclaration, votre
          certification et votre responsabilité.
        </p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/rejoindre?profil=vend_formations" style={{ display: "inline-block", background: OR, color: FOND, padding: "15px 38px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
            Ouvrir mon espace
          </a>
          <a href="#rendez-vous" style={{ display: "inline-block", background: "transparent", color: OR, padding: "15px 38px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "16px", border: "1px solid rgba(200,169,110,0.5)" }}>
            Demander un rendez-vous
          </a>
        </div>
      </section>

      <section style={{ maxWidth: "980px", margin: "0 auto", padding: "60px 24px 20px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 26px" }}>Ce que vous obtenez</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" }}>
          {[
            { t: "Le catalogue sous votre marque", d: "Vous choisissez les formations que vous ouvrez, vous fixez librement vos prix de vente." },
            { t: "Vos propres formations", d: "Vous créez vos parcours à partir de vos supports. Ils vous appartiennent en propre." },
            { t: "Un espace apprenant complet", d: "Cours, exercices corrigés, questionnaires notés sur vingt, assistance pédagogique." },
            { t: "Vos documents administratifs", d: "Conventions, devis, convocations, programmes, attestations, feuilles d'assiduité." },
            { t: "Signature électronique", d: "Vos documents partent à la signature depuis la plateforme, avec archivage horodaté." },
            { t: "Suivi commercial", d: "Vos prospects, leur score, vos relances. Vos données restent les vôtres." },
          ].map(function (x) {
            return (
              <div key={x.t} style={{ background: CARTE, border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "22px" }}>
                <h3 style={{ color: OR, margin: "0 0 8px", fontSize: "16px" }}>{x.t}</h3>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: 0, lineHeight: 1.75 }}>{x.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 24px 20px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 8px" }}>Nos conditions</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 22px", lineHeight: 1.75 }}>
          Un seul abonnement, stagiaires illimités. Pas de palier, pas de surprise.
        </p>

        <div style={{ background: CARTE, border: "1px solid rgba(200,169,110,0.3)", borderRadius: "14px", padding: "26px" }}>
          {ligne("Mise en service, une seule fois", "1 500 € HT")}
          {ligne("Abonnement mensuel", "390 € HT")}
          {ligne("Part sur les formations de notre catalogue", "35 % du prix de vente HT")}
          {ligne("Minimum par stagiaire inscrit", "30 € HT")}
          {ligne("Sur vos propres formations", "aucune part due")}
          {ligne("Gestion administrative, en option", "180 € HT par stagiaire")}

          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: 1.8, margin: "20px 0 0" }}>
            La mise en service couvre l'ouverture du compte, la configuration du catalogue
            et des prix, la mise à vos couleurs, la reprise de vos données et
            l'accompagnement au démarrage.
          </p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: 1.8, margin: "12px 0 0" }}>
            Le minimum par stagiaire est dû pour chaque inscription sur une formation de
            notre catalogue, vendue ou non. Lorsque la part calculée au taux ci-dessus
            lui est supérieure, seule cette part est due. Le nombre d'inscriptions
            enregistré par la plateforme fait foi : vous n'avez aucune déclaration de
            chiffre d'affaires à fournir.
          </p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: 1.8, margin: "12px 0 0" }}>
            La gestion administrative est optionnelle et due seulement si vous la
            demandez. Elle remplace le minimum par stagiaire au lieu de s'y ajouter.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "30px 24px 50px" }}>
        <div style={{ background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "13px", padding: "26px" }}>
          <h2 style={{ color: OR, fontSize: "20px", margin: "0 0 14px" }}>Qui fait quoi</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: 1.8, margin: "0 0 14px" }}>
            Vous demeurez seul prestataire de formation : votre certification, votre
            numéro de déclaration, vos attestations, votre responsabilité. Nous
            fournissons le contenu, la plateforme, la correction des évaluations et
            les documents.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: 1.8, margin: "0 0 14px" }}>
            Toute intervention en présence, l'évaluation pratique, le recrutement des
            formateurs et la vérification de leurs habilitations relèvent
            exclusivement de vous.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: 1.75, margin: 0 }}>
            Les formations de notre catalogue ne sont enregistrées ni au Répertoire
            national des certifications professionnelles ni au répertoire spécifique.
            Elles ne sont éligibles à aucun financement au titre du compte personnel de
            formation ni par un opérateur de compétences. AcadémIA Pro LLC n'est pas
            certifiée Qualiopi : c'est votre propre certification qui ouvre, le cas
            échéant, l'accès aux financements.
          </p>
        </div>
      </section>

      <section id="rendez-vous" style={{ maxWidth: "620px", margin: "0 auto", padding: "10px 24px 80px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 8px", textAlign: "center" }}>Parlons de votre organisme</h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", textAlign: "center", margin: "0 0 28px", lineHeight: 1.75 }}>
          Nous vous rappelons sous quarante-huit heures ouvrées, avec une
          démonstration de la plateforme.
        </p>

        <div style={{ background: CARTE, borderRadius: "14px", padding: "28px", border: "1px solid rgba(200,169,110,0.3)" }}>
          <span style={lib}>Votre nom</span>
          <input value={nom} onChange={function (e) { setNom(e.target.value); }} style={champ} />

          <span style={lib}>Votre organisme</span>
          <input value={societe} onChange={function (e) { setSociete(e.target.value); }} style={champ} />

          <span style={lib}>Adresse électronique</span>
          <input type="email" value={email} onChange={function (e) { setEmail(e.target.value); }} style={champ} />

          <span style={lib}>Téléphone</span>
          <input value={telephone} onChange={function (e) { setTelephone(e.target.value); }} style={champ} />

          <span style={lib}>Êtes-vous certifié Qualiopi</span>
          <select value={certifie} onChange={function (e) { setCertifie(e.target.value); }} style={champ}>
            <option value="">Choisir</option>
            <option value="oui">Oui</option>
            <option value="en cours">Démarche en cours</option>
            <option value="non">Non</option>
            <option value="pas un organisme">Je ne suis pas un organisme de formation</option>
          </select>

          <span style={lib}>Combien de stagiaires par an</span>
          <select value={stagiaires} onChange={function (e) { setStagiaires(e.target.value); }} style={champ}>
            <option value="">Choisir</option>
            <option value="moins de 20">Moins de 20</option>
            <option value="20 a 100">20 à 100</option>
            <option value="100 a 500">100 à 500</option>
            <option value="plus de 500">Plus de 500</option>
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
          <a href="/rejoindre?profil=vend_formations" style={{ display: "inline-block", border: "1px solid rgba(200,169,110,0.5)", color: OR, padding: "13px 30px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}>
            Ouvrir mon espace
          </a>
        </div>

        <p style={{ textAlign: "center", marginTop: "26px" }}>
          <a href="/interim" style={{ color: OR, fontSize: "14px" }}>Vous êtes une agence d'intérim ?</a>
        </p>
      </section>

    </div>
  );
}
