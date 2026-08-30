"use client";
import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// LE « A VIE » EST RETIRE — 30/08. Cette page promettait « -10% a vie »,
// une formule que Jacques n avait jamais decidee. Le bandeau de la page
// d accueil a ete corrige le meme jour : les deux disent desormais la
// meme chose. Le pourcentage et le compteur de places restantes se lisent
// en base (textes_site : remise_fondateurs_pct, remise_fondateurs_places),
// jamais en dur. ⚠️ remise_fondateurs_places est un COMPTEUR DE PLACES
// RESTANTES, pas un total.
// ---------------------------------------------------------------------------
export default function Lancement() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState("");
  const [nbFormations, setNbFormations] = useState(0);
  const [pct, setPct] = useState("");
  const [places, setPlaces] = useState("");

  // Le nombre de formations et l offre fondateur ne sont jamais ecrits en
  // dur : ils sont lus en base.
  useEffect(() => {
    fetch("/api/nombre-formations")
      .then(r => r.json())
      .then(d => { if (d.success) setNbFormations(d.total); })
      .catch(() => {});
    fetch("/api/textes")
      .then(r => r.json())
      .then(d => {
        if (d && d.ok && d.textes) {
          if (d.textes["remise_fondateurs_pct"]) setPct(String(d.textes["remise_fondateurs_pct"]));
          if (d.textes["remise_fondateurs_places"]) setPlaces(String(d.textes["remise_fondateurs_places"]));
        }
      })
      .catch(() => {});
  }, []);

  async function inscrire() {
    if (!email.includes("@")) { setEtat("email_invalide"); return; }
    setEtat("envoi");
    try {
      const r = await fetch("/api/lancement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, projet: "academia" }),
      });
      const d = await r.json();
      if (d.success) setEtat(d.deja ? "deja" : "ok");
      else setEtat("erreur");
    } catch { setEtat("erreur"); }
  }

  const input = { width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #c8a96e", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "16px", boxSizing: "border-box" as const, marginBottom: "12px" };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "14px", letterSpacing: "4px", margin: "0 0 20px" }}>OUVERTURE IMMINENTE</p>
        <h1 style={{ fontSize: "38px", margin: "0 0 16px", lineHeight: 1.25 }}>{nbFormations > 0 ? nbFormations + " formations" : "Des formations"} propulsees par l IA.<br/>Soyez parmi les premiers.</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "17px", margin: "0 0 12px", lineHeight: 1.7 }}>Inscrivez-vous a la liste de lancement et beneficiez de l <b style={{color:"#c8a96e"}}>Offre Fondateur : -{pct || "10"}%</b>{places ? " pour les " + places + " places restantes" : ""}.</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0 0 32px" }}>Agent IA tuteur 24h/24 - Certificat AcademIA Pro - Retractation 14 jours</p>

        {etat === "ok" || etat === "deja" ? (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #22c55e", borderRadius: "12px", padding: "24px" }}>
            <p style={{ color: "#22c55e", fontSize: "18px", margin: 0 }}>
              {etat === "deja" ? "Vous etes deja sur la liste - votre place est reservee !" : "Votre place est reservee ! Verifiez votre boite mail."}
            </p>
          </div>
        ) : (
          <div>
            <input placeholder="Votre prenom (optionnel)" value={nom} onChange={e=>setNom(e.target.value)} style={input} />
            <input placeholder="Votre email" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&inscrire()} style={input} />
            <button onClick={inscrire} disabled={etat==="envoi"}
              style={{ width: "100%", padding: "16px", background: etat==="envoi" ? "rgba(200,169,110,0.4)" : "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", border: "none", borderRadius: "10px", fontSize: "17px", fontWeight: "bold", cursor: etat==="envoi" ? "default" : "pointer" }}>
              {etat === "envoi" ? "Inscription..." : "Devenir membre fondateur (-" + (pct || "10") + "%)"}
            </button>
            {etat === "email_invalide" && <p style={{ color: "#f59e0b", marginTop: "10px" }}>Merci d indiquer un email valide.</p>}
            {etat === "erreur" && <p style={{ color: "#ef4444", marginTop: "10px" }}>Une erreur est survenue, reessayez.</p>}
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "28px" }}>Zero spam - uniquement l annonce du lancement et votre avantage fondateur. <a href="/politique-confidentialite" style={{ color: "rgba(200,169,110,0.6)" }}>Confidentialite</a></p>
      </div>
    </div>
  );
}
