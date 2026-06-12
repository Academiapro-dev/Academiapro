"use client";
import { useState } from "react";

export default function WebinairePage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [inscrit, setInscrit] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!nom || !email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setInscrit(true);
    }, 1500);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#ffffff", padding: "0", margin: "0" }}>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px 80px 24px" }}>

        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.35)", borderRadius: "40px", padding: "8px 20px", marginBottom: "36px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#c8a96e", display: "inline-block", animation: "pulse 2s infinite" }}></span>
            <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "600", letterSpacing: "1.2px", textTransform: "uppercase" }}>Webinaire Gratuit Mensuel</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "800", lineHeight: "1.15", margin: "0 0 24px 0", letterSpacing: "-0.5px" }}>
            <span style={{ color: "#ffffff" }}>Automatiser Votre Business</span>
            <br />
            <span style={{ background: "linear-gradient(135deg, #c8a96e 0%, #f0d080 50%, #c8a96e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>avec l'Intelligence Artificielle</span>
            <br />
            <span style={{ color: "#ffffff" }}>en </span>
            <span style={{ background: "linear-gradient(135deg, #c8a96e 0%, #f0d080 50%, #c8a96e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>7 Jours</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", lineHeight: "1.7", maxWidth: "560px", margin: "0 auto 0 auto" }}>
            Découvrez comment des entrepreneurs comme vous utilisent l'IA pour automatiser leurs tâches répétitives, gagner du temps et scaler leur business — sans compétences techniques.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "14px 22px" }}>
            <span style={{ fontSize: "22px" }}>📅</span>
            <div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600" }}>Date</div>
              <div style={{ color: "#ffffff", fontSize: "15px", fontWeight: "700" }}>1er Dimanche du mois</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "14px 22px" }}>
            <span style={{ fontSize: "22px" }}>🕗</span>
            <div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600" }}>Heure</div>
              <div style={{ color: "#ffffff", fontSize: "15px", fontWeight: "700" }}>20h00 — Heure de Paris</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "14px 22px" }}>
            <span style={{ fontSize: "22px" }}>⏱️</span>
            <div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600" }}>Durée</div>
              <div style={{ color: "#ffffff", fontSize: "15px", fontWeight: "700" }}>60 minutes</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "56px" }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>🤖</div>
            <h3 style={{ color: "#c8a96e", fontSize: "15px", fontWeight: "700", margin: "0 0 8px 0" }}>Les bons outils IA</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.6", margin: "0" }}>Sélection des outils essentiels pour automatiser sans se perdre</p>
          </div>

          <div style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>⚡</div>
            <h3 style={{ color: "#c8a96e", fontSize: "15px", fontWeight: "700", margin: "0 0 8px 0" }}>Plan 7 jours</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.6", margin: "0" }}>Une feuille de route claire pour automatiser dès la première semaine</p>
          </div>

          <div style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>💰</div>
            <h3 style={{ color: "#c8a96e", fontSize: "15px", fontWeight: "700", margin: "0 0 8px 0" }}>ROI immédiat</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.6", margin: "0" }}>Comment mesurer et maximiser votre retour sur investissement</p>
          </div>

          <div style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>🎯</div>
            <h3 style={{ color: "#c8a96e", fontSize: "15px", fontWeight: "700", margin: "0 0 8px 0" }}>Cas concrets</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.6", margin: "0" }}>Exemples réels d'automatisations qui fonctionnent dans votre secteur</p>
          </div>
        </div>

        <div style={{ backgroundColor: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "24px", padding: "48px 40px", textAlign: "center" }}>

          {inscrit ? (
            <div>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎉</div>
              <h2 style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "800", margin: "0 0 12px 0" }}>Vous êtes inscrit !</h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0 0 8px 0" }}>Confirmez votre présence via l'email de confirmation.</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0" }}>Rendez-vous le 1er dimanche du mois à 20h00 🚀</p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ backgroundColor: "rgba(200,169,110,0.15)", color: "#c8a96e", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "6px 14px", borderRadius: "20px" }}>100% Gratuit — Aucune carte requise</span>
              </div>
              <h2 style={{ color: "#ffffff", fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: "800", margin: "20px 0 8px 0" }}>Réservez votre place maintenant</h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px", margin: "0 0 32px 0" }}>Les places sont limitées. Inscrivez-vous avant qu'il soit trop tard.</p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "420px", margin: "0 auto" }}>
                <div>
                  <input
                    type="text"
                    placeholder="Votre prénom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    style={{ width: "100%", padding: "16px 20px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#ffffff", fontSize: "16px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Votre adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: "100%", padding: "16px 20px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#ffffff", fontSize: "16px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", padding: "18px 32px", background: loading ? "rgba(200,169,110,0.4)" : "linear-gradient(135deg, #c8a96e 0%, #f0d080 50%, #b8943e 100%)", border: "none", borderRadius: "12px", color: "#050508", fontSize: "17px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.3px", transition: "opacity 0.2s" }}
                >
                  {loading ? "Inscription en cours..." : "Je Réserve Ma Place Gratuite →"}
                </button>
              </form>

              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px", marginTop: "20px", lineHeight: "1.5" }}>
                🔒 Vos données sont protégées. Aucun spam. Désinscription en 1 clic.
              </p>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "56px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px", margin: "0" }}>
            © 2025 — Webinaire IA Business · Tous droits réservés
          </p>
        </div>

      </div>
    </div>
  );
}