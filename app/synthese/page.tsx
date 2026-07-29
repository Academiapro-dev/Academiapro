"use client";
import { useState, useEffect } from "react";

const MINIMUM_MOTS = 150;

export default function PageSynthese() {
  const [code, setCode] = useState("");
  const [cible, setCible] = useState("");
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [statut, setStatut] = useState("");
  const [retour, setRetour] = useState("");
  const [note, setNote] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [charge, setCharge] = useState(false);

  useEffect(function () {
    const p = new URLSearchParams(window.location.search);
    const c = (p.get("code") || "").toUpperCase();
    const m = (p.get("cible") || "").toLowerCase();
    const t = p.get("titre") || "";
    setCode(c);
    setCible(m);
    setTitre(t);

    if (!c || !m) {
      setCharge(true);
      return;
    }

    fetch("/api/synthese?code=" + c + "&cible=" + m)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok && d.synthese) {
          setTexte(d.synthese.texte || "");
          setStatut(d.synthese.statut || "");
          setRetour(d.synthese.retour || "");
          setNote(typeof d.synthese.note === "number" ? d.synthese.note : null);
        } else if (d && d.erreur) {
          setMessage(d.erreur);
        }
        setCharge(true);
      })
      .catch(function () { setCharge(true); });
  }, []);

  const mots = texte.split(/\s+/).filter(Boolean).length;
  const assez = mots >= MINIMUM_MOTS;
  const evaluee = statut === "evaluee";

  async function envoyer() {
    if (occupe || !assez || evaluee) return;
    setOccupe(true);
    setMessage("");
    try {
      const r = await fetch("/api/synthese", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code, cible: cible, titre: titre, texte: texte }),
      });
      const d = await r.json();
      if (d && d.ok) {
        setStatut("deposee");
        setMessage("Votre synthese est enregistree. Vous recevrez son evaluation par email.");
      } else {
        setMessage((d && d.erreur) || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setMessage("Enregistrement impossible : " + String(e));
    }
    setOccupe(false);
  }

  const cadre: any = {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "32px 20px",
    fontFamily: "Georgia, serif",
  };

  const carte: any = {
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 30px rgba(0,0,0,0.12)",
    padding: "40px",
    maxWidth: "780px",
    margin: "0 auto",
  };

  if (!charge) {
    return (
      <div style={cadre}>
        <div style={carte}>
          <p style={{ color: "#888" }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!code || !cible) {
    return (
      <div style={cadre}>
        <div style={carte}>
          <h1 style={{ color: "#1a1a1a", fontSize: "22px" }}>Synthese de module</h1>
          <p style={{ color: "#666" }}>
            Ouvrez cette page depuis votre module, elle a besoin de savoir de quelle formation il s agit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={cadre}>
      <div style={carte}>
        <div style={{ borderBottom: "1px solid #f0e8d8", paddingBottom: "16px", marginBottom: "24px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "2px", margin: "0 0 6px" }}>
            VOTRE SYNTHESE PERSONNELLE
          </p>
          <h1 style={{ color: "#1a1a1a", fontSize: "22px", margin: 0 }}>
            {titre || code + " — " + cible}
          </h1>
        </div>

        {evaluee ? (
          <div>
            <p style={{ color: "#1a1a1a", lineHeight: "1.8" }}>
              Votre synthese a ete evaluee{typeof note === "number" ? " : " + note + " / 20" : ""}.
            </p>
            {retour && (
              <div style={{ background: "#faf7f0", border: "1px solid #f0e8d8", borderRadius: "8px", padding: "20px", marginTop: "16px" }}>
                <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "2px", margin: "0 0 10px" }}>
                  RETOUR DU FORMATEUR
                </p>
                <div style={{ whiteSpace: "pre-wrap", color: "#333", lineHeight: "1.8", fontSize: "15px" }}>{retour}</div>
              </div>
            )}
            <div style={{ marginTop: "24px" }}>
              <p style={{ color: "#888", fontSize: "13px", margin: "0 0 8px" }}>Votre texte</p>
              <div style={{ whiteSpace: "pre-wrap", color: "#444", lineHeight: "1.8", fontSize: "15px" }}>{texte}</div>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: "#444", lineHeight: "1.8", marginTop: 0 }}>
              Redigez votre synthese de ce module avec vos mots, sans recopier le cours : les notions cles telles
              que vous les avez comprises, la methode comme si vous l expliquiez a un confrere, deux situations ou
              vous comptez l appliquer, et ce qui reste flou pour vous.
            </p>

            <textarea
              value={texte}
              onChange={function (e) { setTexte(e.target.value); }}
              placeholder="Votre synthese..."
              style={{
                width: "100%",
                minHeight: "320px",
                padding: "18px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontFamily: "Georgia, serif",
                fontSize: "16px",
                lineHeight: "1.8",
                color: "#1a1a1a",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
              <span style={{ color: assez ? "#3a8f4a" : "#a06a2c", fontSize: "14px" }}>
                {mots} mots {assez ? "" : "— minimum " + MINIMUM_MOTS}
              </span>
              <button
                onClick={envoyer}
                disabled={occupe || !assez}
                style={{
                  background: occupe || !assez ? "#e3d9c2" : "#c8a96e",
                  color: occupe || !assez ? "#8a8a8a" : "#050508",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px 28px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  fontFamily: "Georgia, serif",
                  cursor: occupe || !assez ? "default" : "pointer",
                }}
              >
                {occupe ? "Envoi..." : statut === "deposee" ? "Mettre a jour" : "Deposer ma synthese"}
              </button>
            </div>

            {statut === "deposee" && (
              <p style={{ color: "#666", fontSize: "14px", marginTop: "16px" }}>
                Une synthese est deja enregistree pour ce module. Vous pouvez la modifier tant qu elle n a pas ete evaluee.
              </p>
            )}
          </div>
        )}

        {message && (
          <p style={{ marginTop: "18px", color: message.indexOf("enregistree") >= 0 ? "#3a8f4a" : "#a33", fontSize: "15px" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
