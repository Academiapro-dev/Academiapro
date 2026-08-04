"use client";
import { useState, useEffect } from "react";

export default function Desinscription() {
  const [etat, setEtat] = useState("chargement");
  const [erreur, setErreur] = useState("");
  const [email, setEmail] = useState("");

  useEffect(function () {
    try {
      const p = new URLSearchParams(window.location.search);
      const e = p.get("e") || "";
      setEmail(e);
      setEtat(e ? "pret" : "invalide");
    } catch {
      setEtat("invalide");
    }
  }, []);

  async function confirmer() {
    setEtat("envoi");
    setErreur("");
    try {
      const p = new URLSearchParams(window.location.search);
      const r = await fetch("/api/desinscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: p.get("e"), jeton: p.get("j") }),
      });
      const data = await r.json();
      if (data.ok) setEtat("fait");
      else {
        setErreur(data.erreur || "Desinscription impossible.");
        setEtat("pret");
      }
    } catch (e: any) {
      setErreur("Desinscription impossible : " + String(e));
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
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 10px" }}>
          ACADEMIA PRO
        </p>

        {etat === "chargement" && (
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>Un instant...</p>
        )}

        {etat === "invalide" && (
          <>
            <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 12px" }}>Lien incomplet</h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.75" }}>
              Ce lien de desinscription n est pas valable. Utilisez celui qui figure au bas du
              message que vous avez recu.
            </p>
          </>
        )}

        {(etat === "pret" || etat === "envoi") && (
          <>
            <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 12px" }}>
              Ne plus recevoir de messages
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.75", marginTop: 0 }}>
              Confirmez et nous cesserons de vous ecrire a l adresse{" "}
              <span style={{ color: "#c8a96e" }}>{email}</span>. Cette decision est immediate et
              definitive.
            </p>

            {erreur && (
              <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.6" }}>{erreur}</p>
            )}

            <button
              onClick={confirmer}
              disabled={etat === "envoi"}
              style={{ background: etat === "envoi" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: etat === "envoi" ? "#8a8a8a" : "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: etat === "envoi" ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%", marginTop: "18px" }}
            >
              {etat === "envoi" ? "Enregistrement..." : "Confirmer ma desinscription"}
            </button>
          </>
        )}

        {etat === "fait" && (
          <>
            <h1 style={{ color: "#4caf50", fontSize: "24px", margin: "0 0 12px" }}>
              C est fait
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.75", marginTop: 0 }}>
              Vous ne recevrez plus de messages a cette adresse. Si vous changez d avis, il vous
              suffira de nous recontacter.
            </p>
            <a
              href="/"
              style={{ display: "inline-block", marginTop: "18px", color: "#c8a96e", fontSize: "15px", textDecoration: "none", border: "1px solid rgba(200,169,110,0.45)", padding: "12px 24px", borderRadius: "20px" }}
            >
              Retour a l accueil
            </a>
          </>
        )}
      </div>
    </div>
  );
}
