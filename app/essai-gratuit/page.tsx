"use client";
import { useState } from "react";

export default function EssaiGratuitPage() {
  const [email, setEmail] = useState("");
  const [prenom, setPrenom] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !prenom) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: "24px" }}>
        <div style={{ maxWidth: "560px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #c8a96e, #e8c98e)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px auto", fontSize: "32px" }}>
            ✓
          </div>
          <h1 style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "700", marginBottom: "16px", letterSpacing: "0.5px" }}>
            Accès envoyé, {prenom} !
          </h1>
          <p style={{ color: "#a89070", fontSize: "16px", lineHeight: "1.7", marginBottom: "12px" }}>
            Votre accès gratuit au <strong style={{ color: "#c8a96e" }}>Module 1 — F128</strong> vient d'être envoyé à
          </p>
          <p style={{ color: "#e8d8b8", fontSize: "17px", fontWeight: "600", marginBottom: "32px", background: "rgba(200,169,110,0.08)", padding: "12px 24px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.2)" }}>
            {email}
          </p>
          <p style={{ color: "#706050", fontSize: "14px", lineHeight: "1.6", marginBottom: "40px" }}>
            Consultez votre boîte mail (et vos spams) pour accéder immédiatement au module.
          </p>
          <div style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.06), rgba(200,169,110,0.12))", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "16px", padding: "32px" }}>
            <p style={{ color: "#908060", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>
              Après votre essai
            </p>
            <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>
              Starter Pack complet
            </p>
            <p style={{ color: "#e8d8b8", fontSize: "36px", fontWeight: "800", marginBottom: "8px" }}>
              47 €
            </p>
            <p style={{ color: "#706050", fontSize: "13px", marginBottom: "0" }}>
              Accès à tous les modules • Paiement unique • Sans abonnement
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "Georgia, serif", padding: "24px" }}>

      <div style={{ maxWidth: "640px", margin: "0 auto", paddingTop: "48px", paddingBottom: "80px" }}>

        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p style={{ color: "#c8a96e", fontSize: "11px", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "20px", opacity: "0.8" }}>
            Module 1 — F128
          </p>
          <h1 style={{ color: "#e8d8b8", fontSize: "38px", fontWeight: "700", lineHeight: "1.25", marginBottom: "20px", letterSpacing: "-0.5px" }}>
            Essayez gratuitement
          </h1>
          <div style={{ width: "48px", height: "2px", background: "linear-gradient(90deg, transparent, #c8a96e, transparent)", margin: "0 auto 24px auto" }}></div>
          <p style={{ color: "#908070", fontSize: "17px", lineHeight: "1.7", maxWidth: "480px", margin: "0 auto" }}>
            Accédez au premier module sans engagement et sans carte bancaire. Découvrez la méthode F128 dès aujourd'hui.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "48px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "40px", padding: "8px 16px" }}>
            <span style={{ color: "#c8a96e", fontSize: "14px" }}>✓</span>
            <span style={{ color: "#a09070", fontSize: "13px" }}>Sans carte bancaire</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "40px", padding: "8px 16px" }}>
            <span style={{ color: "#c8a96e", fontSize: "14px" }}>✓</span>
            <span style={{ color: "#a09070", fontSize: "13px" }}>Accès immédiat</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "40px", padding: "8px 16px" }}>
            <span style={{ color: "#c8a96e", fontSize: "14px" }}>✓</span>
            <span style={{ color: "#a09070", fontSize: "13px" }}>Zéro engagement</span>
          </div>
        </div>

        <div style={{ background: "linear-gradient(160deg, rgba(200,169,110,0.05), rgba(200,169,110,0.02))", border: "1px solid rgba(200,169,110,0.18)", borderRadius: "20px", padding: "48px 40px", marginBottom: "40px" }}>

          <h2 style={{ color: "#c8a96e", fontSize: "16px", fontWeight: "600", marginBottom: "32px", textAlign: "center", letterSpacing: "0.5px" }}>
            Recevoir mon accès gratuit
          </h2>

          <form onSubmit={handleSubmit}>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#806040", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>
                Prénom
              </label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                required
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "14px 18px", color: "#e8d8b8", fontSize: "16px", outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" }}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", color: "#806040", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "14px 18px", color: "#e8d8b8", fontSize: "16px", outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", background: loading ? "rgba(200,169,110,0.4)" : "linear-gradient(135deg, #c8a96e, #b8954a)", border: "none", borderRadius: "12px", padding: "18px 24px", color: "#050508", fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.5px", fontFamily: "Georgia, serif", transition: "opacity 0.2s" }}
            >
              {loading ? "Envoi en cours..." : "Accéder gratuitement au Module 1"}
            </button>

          </form>

          <p style={{ color: "#504030", fontSize: "12px", textAlign: "center", marginTop: "20px", lineHeight: "1.6" }}>
            En continuant, vous acceptez de recevoir votre accès par e-mail. Aucun paiement requis.
          </p>

        </div>

        <div style={{ background: "rgba(200,169,110,0.04)", border: "1px solid rgba(200,169,110,0.12)", borderRadius: "16px", padding: "28px 32px", textAlign: "center" }}>
          <p style={{ color: "#706050", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px" }}>
            Envie d'aller plus loin ?
          </p>
          <p style={{ color: "#c8a96e", fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>
            Starter Pack — Accès complet
          </p>
          <p style={{ color: "#e8d8b8", fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>
            47 €
          </p>
          <p style={{ color: "#605040", fontSize: "13px", lineHeight: "1.6" }}>
            Tous les modules débloqués • Paiement unique • Aucun abonnement
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", marginBottom: "16px" }}>
            <div style={{ height: "1px", width: "60px", background: "rgba(200,169,110,0.15)" }}></div>
            <span style={{ color: "#c8a96e", fontSize: "18px" }}>F128</span>
            <div style={{ height: "1px", width: "60px", background: "rgba(200,169,110,0.15)" }}></div>
          </div>
          <p style={{ color: "#403020", fontSize: "12px" }}>
            © 2024 — Tous droits réservés
          </p>
        </div>

      </div>
    </div>
  );
}