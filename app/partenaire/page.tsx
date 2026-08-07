"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";
const CARTE = "#1a1a2e";

export default function PagePartenaire() {
  const [etat, setEtat] = useState<any>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [piege, setPiege] = useState("");

  useEffect(function () {
    try {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) return;
      fetch("/api/affiliation?etat=oui&code=" + encodeURIComponent(code))
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.ok) setEtat(d); })
        .catch(function () {});
    } catch (e) {}
  }, []);

  async function inscrire() {
    setErreur("");
    if (nom.trim().length < 2) { setErreur("Indiquez votre nom."); return; }
    if (email.indexOf("@") < 1) { setErreur("Adresse électronique invalide."); return; }
    setEnvoi(true);
    try {
      const r = await fetch("/api/affiliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom, email: email, societe_bis: piege }),
      });
      const d = await r.json();
      if (d.ok) {
        setEtat({ nom: nom, code: d.code, commission: d.commission, lien: d.lien, clics: 0, ventes: 0, gains: 0, deja: d.deja_inscrit });
      } else {
        setErreur(d.message || "Inscription impossible.");
      }
    } catch (e) {
      setErreur("Inscription impossible. Réessayez dans un instant.");
    }
    setEnvoi(false);
  }

  const champ: any = { width: "100%", padding: "13px 15px", borderRadius: "9px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "13px" };
  const lib: any = { display: "block", color: OR, fontSize: "13px", marginBottom: "5px" };
  const bloc: any = { background: CARTE, borderRadius: "14px", padding: "26px", border: "1px solid rgba(200,169,110,0.3)" };

  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif" }}>
      <section style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "70px 24px", textAlign: "center" }}>
        <p style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>PROGRAMME PARTENAIRE</p>
        <h1 style={{ fontSize: "33px", margin: "0 0 18px", lineHeight: 1.3, maxWidth: "720px", marginLeft: "auto", marginRight: "auto" }}>
          Recommandez nos formations,<br />touchez 15 % sur chaque vente
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", lineHeight: 1.75, maxWidth: "640px", margin: "0 auto" }}>
          Un lien à partager, une commission sur chaque achat des personnes que vous nous adressez.
          Sans engagement et sans exclusivité.
        </p>
      </section>

      <section style={{ maxWidth: "660px", margin: "0 auto", padding: "50px 24px 80px" }}>
        {etat ? (
          <div style={bloc}>
            <h2 style={{ color: OR, fontSize: "21px", margin: "0 0 8px" }}>
              {etat.deja ? "Vous êtes déjà partenaire" : "Bienvenue " + etat.nom}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0 0 20px", lineHeight: 1.7 }}>
              Voici votre lien. Toute personne qui l'utilise vous est rattachée pendant soixante jours,
              même si elle achète plus tard.
            </p>

            <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.35)", borderRadius: "9px", padding: "14px", marginBottom: "22px", wordBreak: "break-all", color: "#fff", fontSize: "14px" }}>
              {etat.lien}
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
              <div style={{ flex: "1 1 120px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "16px" }}>
                <p style={{ color: "#fff", fontSize: "22px", fontWeight: "bold", margin: "0 0 3px" }}>{etat.clics}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", margin: 0 }}>visites</p>
              </div>
              <div style={{ flex: "1 1 120px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "16px" }}>
                <p style={{ color: "#fff", fontSize: "22px", fontWeight: "bold", margin: "0 0 3px" }}>{etat.ventes}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", margin: 0 }}>ventes</p>
              </div>
              <div style={{ flex: "1 1 120px", background: "rgba(76,175,80,0.08)", borderRadius: "10px", padding: "16px" }}>
                <p style={{ color: "#4caf50", fontSize: "22px", fontWeight: "bold", margin: "0 0 3px" }}>{etat.gains} €</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", margin: 0 }}>gains</p>
              </div>
            </div>

            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, lineHeight: 1.75 }}>
              Votre commission est de {etat.commission} % du montant hors taxes, frais de paiement déduits,
              versée une seule fois par vente. Un remboursement l'annule. Conservez ce lien pour revenir
              consulter vos résultats.
            </p>
          </div>
        ) : (
          <div style={bloc}>
            <h2 style={{ color: OR, fontSize: "21px", margin: "0 0 18px" }}>Devenir partenaire</h2>

            <span style={lib}>Votre nom</span>
            <input value={nom} onChange={function (e) { setNom(e.target.value); }} style={champ} />

            <span style={lib}>Adresse électronique</span>
            <input type="email" value={email} onChange={function (e) { setEmail(e.target.value); }} style={champ} />

            <input value={piege} onChange={function (e) { setPiege(e.target.value); }} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />

            <button onClick={inscrire} disabled={envoi}
              style={{ width: "100%", padding: "15px", background: envoi ? "rgba(200,169,110,0.4)" : OR, color: FOND, border: "none", borderRadius: "9px", fontSize: "16px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: envoi ? "default" : "pointer" }}>
              {envoi ? "Création…" : "Obtenir mon lien"}
            </button>

            {erreur && <p style={{ color: "#e8836a", fontSize: "15px", marginTop: "14px", textAlign: "center" }}>{erreur}</p>}

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "18px", lineHeight: 1.75 }}>
              Vous recevez votre lien par courriel. Aucune obligation de volume, aucune exclusivité :
              vous partagez quand vous voulez, à qui vous voulez.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
