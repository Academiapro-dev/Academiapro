"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";
const CARTE = "#1a1a2e";

const BLOCS = [
  { titre: "Securite au poste", codes: ["F424", "F425", "F426", "F427", "F428"] },
  { titre: "Securite sur chantier", codes: ["F429", "F430", "F431", "F432", "F433", "F434"] },
  { titre: "Accueil et integration", codes: ["F435", "F436", "F437"] },
  { titre: "Savoirs de base", codes: ["F438", "F439", "F440"] },
  { titre: "Encadrement", codes: ["F441", "F442"] },
];

export default function InterimPage() {
  const [formations, setFormations] = useState<any[]>([]);
  const [envoi, setEnvoi] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [nom, setNom] = useState("");
  const [societe, setSociete] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [effectif, setEffectif] = useState("");
  const [secteur, setSecteur] = useState("");
  const [texte, setTexte] = useState("");
  const [piege, setPiege] = useState("");

  useEffect(function () {
    fetch("/api/tarifs-formations")
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.success) setFormations(d.formations || []); })
      .catch(function () {});
  }, []);

  function titreDe(code: string): string {
    const f = formations.find(function (x: any) { return x.code === code; });
    return f ? f.titre : "";
  }

  async function envoyer() {
    setErreur("");
    setMessage("");
    if (!nom.trim()) { setErreur("Merci d indiquer votre nom."); return; }
    if (email.indexOf("@") < 1) { setErreur("Adresse electronique invalide."); return; }
    setEnvoi("1");
    try {
      const r = await fetch("/api/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom, email: email, telephone: telephone, societe: societe,
          effectif: effectif, secteur: secteur, message: texte,
          domaine: "Interim", formation_interesse: "Socle interim",
          societe_bis: piege,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message || "Demande enregistree.");
        setNom(""); setSociete(""); setEmail(""); setTelephone("");
        setEffectif(""); setSecteur(""); setTexte("");
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
        <p style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>AGENCES DE TRAVAIL TEMPORAIRE</p>
        <h1 style={{ fontSize: "34px", margin: "0 0 18px", lineHeight: 1.3, maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
          Formez vos interimaires avant la mission,<br />pas apres l accident
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", lineHeight: 1.75, maxWidth: "660px", margin: "0 auto 30px" }}>
          Dix-neuf formations concues pour l interim : securite au poste et sur chantier,
          accueil des nouveaux, savoirs de base, encadrement. Une journee a trois jours,
          entierement a distance, evaluation et attestation comprises.
        </p>
        <a href="#rendez-vous" style={{ display: "inline-block", background: OR, color: FOND, padding: "15px 38px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
          Demander un rendez-vous
        </a>
      </section>

      <section style={{ maxWidth: "980px", margin: "0 auto", padding: "60px 24px 20px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 10px" }}>Le socle interim</h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", margin: "0 0 34px", lineHeight: 1.75 }}>
          Dix-neuf parcours prets a ouvrir, adaptables a vos metiers. Vos interimaires
          se forment depuis leur telephone, a leur rythme, avant la prise de poste.
        </p>

        {BLOCS.map(function (b) {
          return (
            <div key={b.titre} style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 12px", paddingBottom: "8px", borderBottom: "1px solid rgba(200,169,110,0.25)" }}>
                {b.titre}
              </h3>
              {b.codes.map(function (c) {
                const t = titreDe(c);
                if (!t) return null;
                return (
                  <a key={c} href={"/formation/" + c.toLowerCase()}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", background: CARTE, borderRadius: "9px", padding: "13px 17px", marginBottom: "7px", textDecoration: "none", color: "#fff", border: "1px solid rgba(200,169,110,0.12)" }}>
                    <span style={{ fontSize: "14.5px" }}>{t}</span>
                    <span style={{ color: OR, fontSize: "18px" }}>&rsaquo;</span>
                  </a>
                );
              })}
            </div>
          );
        })}
      </section>

      <section style={{ maxWidth: "980px", margin: "0 auto", padding: "20px 24px 50px" }}>
        <div style={{ background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "13px", padding: "28px" }}>
          <h2 style={{ color: OR, fontSize: "20px", margin: "0 0 14px" }}>Ce que nous faisons, ce que vous gardez</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: 1.8, margin: "0 0 14px" }}>
            Nous fournissons l integralite du parcours : cours, exercices, questionnaires
            corriges individuellement, examen final et attestation de suivi.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: 1.8, margin: "0 0 14px" }}>
            Pour les formations qui exigent une validation pratique par un formateur
            habilite — conduite d engins, habilitation electrique, secourisme — vous
            mettez ce formateur a disposition pour la seule partie pratique. Nous
            prenons en charge toute la theorie a distance, avec examen a la cle.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: 1.75, margin: 0 }}>
            Nos parcours sont des formations de sensibilisation. Ils ne delivrent
            ni CACES, ni AIPR, ni habilitation electrique, ni certificat SST, et ne
            remplacent aucune formation reglementee.
          </p>
        </div>
      </section>

      <section id="rendez-vous" style={{ maxWidth: "620px", margin: "0 auto", padding: "10px 24px 80px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 8px", textAlign: "center" }}>Parlons de vos besoins</h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", textAlign: "center", margin: "0 0 28px", lineHeight: 1.75 }}>
          Dites-nous ce que vos interimaires doivent savoir. Nous vous rappelons
          sous quarante-huit heures ouvrees.
        </p>

        <div style={{ background: CARTE, borderRadius: "14px", padding: "28px", border: "1px solid rgba(200,169,110,0.3)" }}>
          <span style={lib}>Votre nom</span>
          <input value={nom} onChange={function (e) { setNom(e.target.value); }} style={champ} />

          <span style={lib}>Votre agence</span>
          <input value={societe} onChange={function (e) { setSociete(e.target.value); }} style={champ} />

          <span style={lib}>Adresse electronique</span>
          <input type="email" value={email} onChange={function (e) { setEmail(e.target.value); }} style={champ} />

          <span style={lib}>Telephone</span>
          <input value={telephone} onChange={function (e) { setTelephone(e.target.value); }} style={champ} />

          <span style={lib}>Combien d interimaires par an</span>
          <select value={effectif} onChange={function (e) { setEffectif(e.target.value); }} style={champ}>
            <option value="">Choisir</option>
            <option value="moins de 50">Moins de 50</option>
            <option value="50 a 200">50 a 200</option>
            <option value="200 a 1000">200 a 1000</option>
            <option value="plus de 1000">Plus de 1000</option>
          </select>

          <span style={lib}>Vos secteurs principaux</span>
          <select value={secteur} onChange={function (e) { setSecteur(e.target.value); }} style={champ}>
            <option value="">Choisir</option>
            <option value="BTP et travaux publics">BTP et travaux publics</option>
            <option value="Industrie et logistique">Industrie et logistique</option>
            <option value="Tertiaire">Tertiaire</option>
            <option value="Plusieurs secteurs">Plusieurs secteurs</option>
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
          <a href="/b2b" style={{ color: OR, fontSize: "14px" }}>Nos conditions pour les organismes et les entreprises</a>
        </p>
      </section>

    </div>
  );
}
