"use client";
import { useState } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FRT = {
  lancement: "LANCEMENT IMMINENT",
  titre: "Rejoignez la Liste Prioritaire",
  sousTitre: "Soyez parmi les premiers a acceder a AcademIA Pro et beneficiez de tarifs de lancement exclusifs.",
  dejaInscrites: "personnes deja inscrites",
  placesLimitees: "Places limitees au lancement",
  cadreTitre: "Votre inscription gratuite",
  votreNom: "Votre nom",
  votreEmail: "Votre email",
  interetPrincipal: "Votre interet principal",
  choisir: "Choisir...",
  bouton: "Rejoindre la liste prioritaire",
  enCours: "Inscription en cours...",
  mention: "Inscription gratuite - Aucun paiement requis - Vous serez contacte a l ouverture",
  erreurRemplir: "Veuillez remplir votre nom et email",
  erreurSurvenue: "Une erreur est survenue",
  erreurConnexion: "Erreur de connexion",
  interets: [
    "Formations professionnelles",
    "Pack IA Expert",
    "Seances therapeutiques",
    "Classe virtuelle Live",
    "Tout AcademIA Pro",
  ],
  succesTitre: "Bienvenue sur la liste prioritaire !",
  succesTexte: "vous etes parmi les premiers a rejoindre AcademIA Pro. Vous serez contacte en priorite des l ouverture officielle avec une offre exclusive.",
  attendTitre: "Ce qui vous attend",
  avantages: [
    "Acces prioritaire avant ouverture publique",
    "Tarif de lancement exclusif",
    "Formation offerte au choix",
    "Accompagnement personnalise",
  ],
  retourAccueil: "Retour a l accueil",
  stat1Label: "235 formations", stat1Desc: "Certifiantes",
  stat2Label: "Agent IA", stat2Desc: "24h/24",
  stat3Label: "5 therapeutes", stat3Desc: "IA specialises",
};

export default function InscriptionPage() {
  const { txt: txtT } = useTraductionAuto(FRT);
  const [form, setForm] = useState({ nom: "", email: "", interet: "" });
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");
  const [compteur] = useState(Math.floor(Math.random() * 50) + 127);

  async function inscrire() {
    if (!form.nom || !form.email) {
      setErreur(txtT.erreurRemplir);
      return;
    }
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "page_inscription" }),
      });
      const data = await res.json();
      if (data.success) {
        setSucces(true);
      } else {
        setErreur(data.message || txtT.erreurSurvenue);
      }
    } catch (e) {
      setErreur(txtT.erreurConnexion);
    }
    setLoading(false);
  }

  if (succes) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: "500px", textAlign: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>🎉</div>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
            {txtT.succesTitre}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8", marginBottom: "25px" }}>
            {form.nom}, {txtT.succesTexte}
          </p>
          <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "25px" }}>
            <h3 style={{ color: "#c8a96e", marginTop: 0 }}>{txtT.attendTitre}</h3>
            {txtT.avantages.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ color: "#22c55e" }}>✓</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>{item}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 30px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
            {txtT.retourAccueil}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", marginBottom: "15px" }}>{txtT.lancement}</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.5rem", marginBottom: "15px" }}>
          {txtT.titre}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", maxWidth: "600px", margin: "0 auto 25px" }}>
          {txtT.sousTitre}
        </p>
        <div style={{ display: "inline-flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>
            {compteur} {txtT.dejaInscrites}
          </span>
          <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>
            {txtT.placesLimitees}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "50px 20px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "40px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0, marginBottom: "25px", textAlign: "center" }}>
            {txtT.cadreTitre}
          </h2>
          {erreur && (
            <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid red", borderRadius: "8px", padding: "10px", marginBottom: "20px", color: "#ff6b6b", textAlign: "center" }}>
              {erreur}
            </div>
          )}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>{txtT.votreNom}</label>
            <input type="text" placeholder={txtT.votreNom} value={form.nom}
              onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>{txtT.votreEmail}</label>
            <input type="email" placeholder="vous@exemple.fr" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
          </div>
          <div style={{ marginBottom: "25px" }}>
            <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>{txtT.interetPrincipal}</label>
            <select value={form.interet} onChange={e => setForm(p => ({ ...p, interet: e.target.value }))}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", boxSizing: "border-box" as any }}>
              <option value="">{txtT.choisir}</option>
              {txtT.interets.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <button onClick={inscrire} disabled={loading}
            style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? txtT.enCours : txtT.bouton}
          </button>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", marginTop: "15px" }}>
            {txtT.mention}
          </p>
        </div>

        <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
          {[
            { icon: "🎓", label: txtT.stat1Label, desc: txtT.stat1Desc },
            { icon: "🤖", label: txtT.stat2Label, desc: txtT.stat2Desc },
            { icon: "💆", label: txtT.stat3Label, desc: txtT.stat3Desc },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
              <div style={{ fontSize: "25px", marginBottom: "5px" }}>{item.icon}</div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>{item.label}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
