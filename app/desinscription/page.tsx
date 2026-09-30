"use client";
import { useState, useEffect } from "react";

// LA PAGE DE DESINSCRIPTION, COMMUNE A TOUS LES DOMAINES.
//
// 🚨 30/09 — ELLE NE LISAIT QUE « e » ET « j ». Les liens des relances du
// CRM portent ?e=...&j=..., mais ceux des SIX CAMPAGNES de prospection
// portent ?email=...&jeton=... : la page ne trouvait pas l adresse et
// repondait « Lien incomplet » a tout destinataire d une campagne. Elle
// lit desormais les deux formes.
//
// 🚨 30/09 — LA MARQUE SUIT LE DOMAINE. Le middleware sert cette page sur
// mrcomptable.fr, mrcrm.fr, mrlms.fr et mysterllc.com (reserve ajoutee le
// meme jour) : un cabinet contacte par Mr. Comptable ne doit pas lire
// « AcadeMIA Pro » en tete de la page ou il se desinscrit.

function marqueDuDomaine(hote: string): string {
  const h = (hote || "").toLowerCase();
  if (h.indexOf("mrcomptable.fr") >= 0) return "MR. COMPTABLE";
  if (h.indexOf("mysterllc.com") >= 0) return "MYSTERLLC";
  if (h.indexOf("mrlms.fr") >= 0) return "MR. LMS";
  if (h.indexOf("mrcrm.fr") >= 0) return "MR. CRM";
  return "ACADÉMIA PRO";
}

export default function Desinscription() {
  const [etat, setEtat] = useState("chargement");
  const [erreur, setErreur] = useState("");
  const [email, setEmail] = useState("");
  const [jeton, setJeton] = useState("");
  const [marque, setMarque] = useState("");

  useEffect(function () {
    try {
      setMarque(marqueDuDomaine(window.location.hostname));
      const p = new URLSearchParams(window.location.search);
      const e = (p.get("e") || p.get("email") || "").trim();
      const j = (p.get("j") || p.get("jeton") || "").trim();
      setEmail(e);
      setJeton(j);
      setEtat(e && j ? "pret" : "invalide");
    } catch {
      setEtat("invalide");
    }
  }, []);

  async function confirmer() {
    setEtat("envoi");
    setErreur("");
    try {
      const r = await fetch("/api/desinscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, jeton: jeton }),
      });
      const data = await r.json().catch(function () { return null; });
      if (data && data.ok) setEtat("fait");
      else {
        setErreur((data && data.erreur)
          || "La désinscription n'a pas pu être enregistrée. Réessayez dans un instant.");
        setEtat("pret");
      }
    } catch {
      setErreur("La désinscription n'a pas pu être enregistrée. Réessayez dans un instant.");
      setEtat("pret");
    }
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  };

  const BOITE: any = {
    maxWidth: "560px",
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "34px 36px",
  };

  return (
    <div style={CADRE}>
      <div style={BOITE}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 10px", minHeight: "15px" }}>
          {marque}
        </p>

        {etat === "chargement" && (
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>Un instant…</p>
        )}

        {etat === "invalide" && (
          <>
            <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 12px" }}>Lien incomplet</h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.75" }}>
              Ce lien de désinscription n'est pas complet. Utilisez celui qui figure au bas du
              message que vous avez reçu.
            </p>
          </>
        )}

        {(etat === "pret" || etat === "envoi") && (
          <>
            <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 12px" }}>
              Ne plus recevoir de messages
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.75", marginTop: 0 }}>
              Confirmez, et nous cesserons de vous écrire à l'adresse{" "}
              <span style={{ color: "#c8a96e" }}>{email}</span>. Cette décision est immédiate
              et définitive.
            </p>

            {erreur && (
              <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.6" }}>{erreur}</p>
            )}

            <button
              onClick={confirmer}
              disabled={etat === "envoi"}
              style={{ background: etat === "envoi" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: etat === "envoi" ? "#8a8a8a" : "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: etat === "envoi" ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%", marginTop: "18px" }}
            >
              {etat === "envoi" ? "Enregistrement…" : "Confirmer ma désinscription"}
            </button>
          </>
        )}

        {etat === "fait" && (
          <>
            <h1 style={{ color: "#4caf50", fontSize: "24px", margin: "0 0 12px" }}>
              C'est fait
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.75", marginTop: 0 }}>
              Vous ne recevrez plus de messages de notre part à cette adresse. Si vous changez
              d'avis, il vous suffira de nous recontacter.
            </p>
            <a
              href="/"
              style={{ display: "inline-block", marginTop: "18px", color: "#c8a96e", fontSize: "15px", textDecoration: "none", border: "1px solid rgba(200,169,110,0.45)", padding: "12px 24px", borderRadius: "20px" }}
            >
              Retour à l'accueil
            </a>
          </>
        )}
      </div>
    </div>
  );
}
