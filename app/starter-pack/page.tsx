"use client";
import { useState } from "react";

export default function StarterPackPage() {
  const [hovered1, setHovered1] = useState(false);
  const [hovered2, setHovered2] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: "#ffffff" }}>

      {/* HERO */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "80px 24px 60px 24px", textAlign: "center" }}>
        <div style={{ display: "inline-block", backgroundColor: "#c8a96e22", border: "1px solid #c8a96e55", borderRadius: "40px", padding: "6px 20px", marginBottom: "28px" }}>
          <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase" }}>Accès immédiat après achat</span>
        </div>

        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: "800", lineHeight: "1.1", margin: "0 0 24px 0", letterSpacing: "-1px" }}>
          Le <span style={{ color: "#c8a96e" }}>Starter Pack</span> qui t'évite<br />6 mois d'erreurs
        </h1>

        <p style={{ fontSize: "18px", color: "#aaaaaa", lineHeight: "1.7", maxWidth: "620px", margin: "0 auto 48px auto" }}>
          Tout ce qu'il te faut pour démarrer avec méthode, clarté et vitesse — sans te perdre dans l'infini du web.
        </p>

        {/* CARDS PACK */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "60px" }}>

          <div style={{ backgroundColor: "#0e0e14", border: "1px solid #c8a96e33", borderRadius: "16px", padding: "32px 24px", textAlign: "left" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>📄</div>
            <div style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Inclus #1</div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 10px 0", color: "#ffffff" }}>Guide PDF — 100 Prompts</h3>
            <p style={{ fontSize: "14px", color: "#888888", lineHeight: "1.6", margin: "0" }}>100 prompts classés, testés, prêts à l'emploi. Pour travailler plus vite et mieux avec l'IA dès aujourd'hui.</p>
          </div>

          <div style={{ backgroundColor: "#0e0e14", border: "1px solid #c8a96e33", borderRadius: "16px", padding: "32px 24px", textAlign: "left" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🎓</div>
            <div style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Inclus #2</div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 10px 0", color: "#ffffff" }}>Module 1 — Formation F128</h3>
            <p style={{ fontSize: "14px", color: "#888888", lineHeight: "1.6", margin: "0" }}>Le premier module de la formation complète. Tu poses les bases solides de ta stratégie IA.</p>
          </div>

          <div style={{ backgroundColor: "#0e0e14", border: "1px solid #c8a96e33", borderRadius: "16px", padding: "32px 24px", textAlign: "left" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>💬</div>
            <div style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Inclus #3</div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 10px 0", color: "#ffffff" }}>Accès Discord privé</h3>
            <p style={{ fontSize: "14px", color: "#888888", lineHeight: "1.6", margin: "0" }}>Rejoins la communauté, pose tes questions, avance entouré de gens qui bossent vraiment.</p>
          </div>

        </div>

        {/* CTA PRINCIPAL */}
        <div style={{ backgroundColor: "#0e0e14", border: "1px solid #c8a96e44", borderRadius: "20px", padding: "48px 40px", marginBottom: "60px" }}>
          <p style={{ fontSize: "13px", color: "#c8a96e", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 12px 0" }}>Offre de lancement</p>
          <div style={{ fontSize: "clamp(48px, 8vw, 80px)", fontWeight: "900", color: "#ffffff", lineHeight: "1", margin: "0 0 8px 0" }}>
            F128
          </div>
          <p style={{ fontSize: "15px", color: "#666666", margin: "0 0 32px 0" }}>Paiement unique — Accès immédiat</p>

          <button
            onMouseEnter={() => setHovered1(true)}
            onMouseLeave={() => setHovered1(false)}
            style={{
              backgroundColor: hovered1 ? "#d4b87a" : "#c8a96e",
              color: "#050508",
              border: "none",
              borderRadius: "12px",
              padding: "18px 48px",
              fontSize: "17px",
              fontWeight: "800",
              cursor: "pointer",
              letterSpacing: "0.5px",
              transition: "all 0.2s ease",
              display: "inline-block",
              width: "100%",
              maxWidth: "400px"
            }}
          >
            Obtenir le Starter Pack →
          </button>

          <p style={{ fontSize: "13px", color: "#555555", margin: "16px 0 0 0" }}>✓ Livraison instantanée &nbsp;·&nbsp; ✓ PDF + accès plateforme &nbsp;·&nbsp; ✓ Discord inclus</p>
        </div>

      </div>

      {/* CE QUE TU REÇOIS */}
      <div style={{ backgroundColor: "#08080f", borderTop: "1px solid #1a1a2e", borderBottom: "1px solid #1a1a2e", padding: "72px 24px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "800", textAlign: "center", margin: "0 0 48px 0" }}>
            Ce que tu reçois <span style={{ color: "#c8a96e" }}>exactement</span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {[
              ["📘", "100 prompts organisés par usage", "Copywriting, stratégie, code, contenus, recherche — tout y est, classé et prêt."],
              ["🧠", "Module 1 de F128 complet", "Le module d'entrée de la formation à 643€, offert dans ce pack d'accès."],
              ["🔐", "Accès Discord communauté privée", "Un espace actif avec des gens sérieux. Pas un Discord fantôme."],
              ["⚡", "Livraison en moins de 5 minutes", "Lien d'accès envoyé par email dès la confirmation de paiement."],
              ["🗺️", "Roadmap personnelle incluse", "Un guide pour savoir par où commencer selon ton profil et tes objectifs."],
              ["🔄", "Mises à jour gratuites à vie", "Le contenu évolue. Tu reçois toutes les nouvelles versions sans rien payer de plus."]
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: "#0c0c18", border: "1px solid #1e1e3a", borderRadius: "14px", padding: "24px 20px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px", flexShrink: "0" }}>{item[0]}</span>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", margin: "0 0 6px 0" }}>{item[1]}</p>
                  <p style={{ fontSize: "13px", color: "#777777", lineHeight: "1.5", margin: "0" }}>{item[2]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* UPSELL F128 */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ background: "linear-gradient(135deg, #0e0e14 0%, #12101a 100%)", border: "1px solid #c8a96e55", borderRadius: "20px", padding: "48px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>

          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", backgroundColor: "#c8a96e08", borderRadius: "50%" }}></div>
          <div style={{ position: "absolute", bottom: "-60px", left: "-30px", width: "160px", height: "160px", backgroundColor: "#c8a96e06", borderRadius: "50%" }}></div>

          <div style={{ position: "relative", zIndex: "1" }}>
            <div style={{ display: "inline-block", backgroundColor: "#c8a96e22", border: "1px solid #c8a96e66", borderRadius: "40px", padding: "6px 20px", marginBottom: "24px" }}>
              <span style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>Passer à la vitesse supérieure</span>
            </div>

            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: "800", margin: "0 0 16px 0", lineHeight: "1.2" }}>
              Tu veux aller jusqu'au bout ?<br />
              <span style={{ color: "#c8a96e" }}>La formation complète F128</span>
            </h2>

            <p style={{ fontSize: "16px", color: "#999999", lineHeight: "1.7", maxWidth: "560px", margin: "0 auto 32px auto" }}>
              Le Starter Pack est ton point d'entrée. La formation F128 complète, c'est les 12 modules, le système entier, et un accompagnement qui te mène au résultat.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", marginBottom: "36px" }}>
              {["12 modules complets", "Communauté & suivi", "Méthode terrain testée", "Accès à vie"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#c8a96e", fontSize: "16px" }}>✓</span>
                  <span style={{ color: "#cccccc", fontSize: "14px", fontWeight: "600" }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "28px" }}>
              <span style={{ fontSize: "14px", color: "#666666", textDecoration: "line-through", marginRight: "12px" }}>Valeur estimée 900€</span>
              <span style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "900", color: "#c8a96e" }}>643€</span>
              <span style={{ fontSize: "15px", color: "#888888", marginLeft: "8px" }}>accès complet</span>
            </div>

            <button
              onMouseEnter={() => setHovered2(true)}
              onMouseLeave={() => setHovered2(false)}
              style={{
                backgroundColor: hovered2 ? "#050508" : "transparent",
                color: "#c8a96e",
                border: "2px solid #c8a96e",
                borderRadius: "12px",
                padding: "16px 44px",
                fontSize: "16px",
                fontWeight: "800",
                cursor: "pointer",
                letterSpacing: "0.5px",
                transition: "all 0.2s ease"
              }}
            >
              Rejoindre la formation F128 — 643€ →
            </button>

            <p style={{ fontSize: "13px", color: "#444444", margin: "16px 0 0 0" }}>Le Module 1 de ton Starter Pack est déjà inclus dans F128</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ backgroundColor: "#08080f", borderTop: "1px solid #1a1a2e", padding: "72px 24px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: "800", textAlign: "center", margin: "0 0 48px 0" }}>
            Questions <span style={{ color: "#c8a96e" }}>fréquentes</span>
          </h2>

          {[
            ["Je reçois quoi exactement après l'achat ?", "Un email avec : le lien de téléchargement du PDF 100 prompts, l'accès au Module 1 sur la plateforme, et l'invitation Discord privée. Tout en moins de 5 minutes."],
            ["C'est quoi F128 exactement ?", "F128 est la formation complète. Le Starter Pack te donne le Module 1 pour que tu puisses tester