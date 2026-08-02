"use client";
import { useState, useEffect } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FRT = {
  lancement: "RESTER INFORME",
  titre: "Les nouveautes d AcademIA Pro",
  sousTitre: "Laissez-nous votre adresse et vous serez prevenu des nouvelles formations, des nouveaux ateliers et des dates de classes virtuelles.",
  cadreTitre: "Votre inscription gratuite",
  votreNom: "Votre nom",
  votreEmail: "Votre email",
  interetPrincipal: "Votre interet principal",
  choisir: "Choisir...",
  bouton: "M inscrire aux nouveautes",
  enCours: "Inscription en cours...",
  mention: "Inscription gratuite - aucun paiement requis - desinscription a tout moment",
  erreurRemplir: "Veuillez remplir votre nom et email",
  erreurSurvenue: "Une erreur est survenue",
  erreurConnexion: "Erreur de connexion",
  interets: [
    "Formations professionnelles",
    "Seances d accompagnement",
    "Classe virtuelle",
    "Tout AcademIA Pro",
  ],
  succesTitre: "Vous etes inscrit",
  succesTexte: "merci. Vous recevrez nos nouveautes par email, et rien d autre.",
  attendTitre: "En attendant",
  attendTexte: "Le catalogue est deja ouvert : vous pouvez consulter les formations et vous inscrire des maintenant.",
  voirCatalogue: "Voir le catalogue",
  retourAccueil: "Retour a l accueil",
  stat1Vide: "Catalogue", stat1Desc: "Avec certificat AcadeMIA Pro",
  stat1Suffixe: "formations",
  stat2Label: "Agent IA", stat2Desc: "24h/24",
  stat3Label: "Accompagnants IA", stat3Desc: "Seances d accompagnement",
};

export default function InscriptionPage() {
  const { txt: txtT } = useTraductionAuto(FRT);
  const [form, setForm] = useState({ nom: "", email: "", interet: "" });
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");
  const [nbFormations, setNbFormations] = useState(0);

  // Le nombre de formations se lit, il ne s ecrit pas : il change des qu une
  // fiche est ajoutee au catalogue.
  useEffect(() => {
    fetch("/api/nombre-formations")
      .then(r => r.json())
      .then(d => {
        const n = (d && (d.total || d.nombre || d.count)) ||
          (d && Array.isArray(d.formations) ? d.formations.length : 0);
        if (Number(n) > 0) setNbFormations(Number(n));
      })
      .catch(() => {});
  }, []);

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
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>✉️</div>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
            {txtT.succesTitre}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8", marginBottom: "25px" }}>
            {form.nom}, {txtT.succesTexte}
          </p>
          <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "25px" }}>
            <h3 style={{ color: "#c8a96e", marginTop: 0 }}>{txtT.attendTitre}</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
              {txtT.attendTexte}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/formations" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 30px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
              {txtT.voirCatalogue}
            </a>
            <a href="/" style={{ display: "inline-block", background: "rgba(200,169,110,0.15)", color: "#c8a96e", padding: "12px 30px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", border: "1px solid rgba(200,169,110,0.3)" }}>
              {txtT.retourAccueil}
            </a>
          </div>
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
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
          {txtT.sousTitre}
        </p>
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
            { icon: "🎓", label: nbFormations > 0 ? nbFormations + " " + txtT.stat1Suffixe : txtT.stat1Vide, desc: txtT.stat1Desc },
            { icon: "🤖", label: txtT.stat2Label, desc: txtT.stat2Desc },
            { icon: "💬", label: txtT.stat3Label, desc: txtT.stat3Desc },
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
