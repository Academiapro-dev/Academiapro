"use client";
import { useState } from "react";

export default function SeancesTherapeutiques() {
  const [activeSpecialite, setActiveSpecialite] = useState(null);
  const [activeTarif, setActiveTarif] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredTarif, setHoveredTarif] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(false);

  const specialites = [
    { id: 1, nom: "Hypnose", icon: "🌀", desc: "Accédez aux ressources profondes de votre inconscient pour transformer durablement vos schémas limitants." },
    { id: 2, nom: "PNL", icon: "🧠", desc: "Reprogrammez vos croyances et comportements grâce aux techniques de Programmation Neuro-Linguistique." },
    { id: 3, nom: "Sophrologie", icon: "🌿", desc: "Harmonisez corps et esprit par des techniques de relaxation dynamique et de visualisation positive." },
    { id: 4, nom: "Coaching", icon: "🎯", desc: "Définissez vos objectifs avec clarté et mettez en place des stratégies concrètes pour les atteindre." },
    { id: 5, nom: "Méditation", icon: "☯️", desc: "Cultivez la pleine conscience et retrouvez un état de paix intérieure durable au quotidien." },
    { id: 6, nom: "Stress", icon: "💆", desc: "Apprenez à gérer et dissoudre les tensions pour retrouver sérénité et équilibre dans votre vie." },
    { id: 7, nom: "Burn-out", icon: "🔥", desc: "Récupérez de l'épuisement professionnel et reconstruisez une relation saine avec votre énergie vitale." },
    { id: 8, nom: "Sommeil", icon: "🌙", desc: "Retrouvez un sommeil profond et réparateur en éliminant les causes profondes des insomnies." },
    { id: 9, nom: "Confiance", icon: "⭐", desc: "Développez une estime de soi solide et une confiance authentique en vos capacités et votre valeur." },
    { id: 10, nom: "Relations", icon: "💞", desc: "Améliorez la qualité de vos relations et créez des liens authentiques et épanouissants." },
    { id: 11, nom: "Procrastination", icon: "⏰", desc: "Surmontez les blocages qui vous empêchent d'agir et retrouvez motivation et élan naturel." },
    { id: 12, nom: "Anxiété", icon: "🕊️", desc: "Libérez-vous des angoisses et apprenez à naviguer la vie avec plus de légèreté et de sécurité intérieure." },
    { id: 13, nom: "Développement", icon: "🌱", desc: "Explorez votre plein potentiel et engagez-vous sur un chemin de croissance personnelle profonde." },
    { id: 14, nom: "Équilibre", icon: "⚖️", desc: "Retrouvez l'harmonie entre toutes les dimensions de votre vie pour un épanouissement global." }
  ];

  const tarifs = [
    {
      id: 1,
      nom: "Découverte",
      prix: 29,
      duree: "45 min",
      couleur: "#c8a96e",
      features: ["Bilan initial", "1 technique explorée", "Plan personnalisé", "Suivi par email"]
    },
    {
      id: 2,
      nom: "Standard",
      prix: 59,
      duree: "60 min",
      couleur: "#a07840",
      features: ["Séance complète", "2 à 3 techniques", "Exercices à domicile", "Suivi 7 jours", "Enregistrement audio"]
    },
    {
      id: 3,
      nom: "Expert",
      prix: 79,
      duree: "90 min",
      couleur: "#e8c97e",
      features: ["Séance approfondie", "Protocole sur mesure", "Ressources illimitées", "Suivi 30 jours", "Accès prioritaire", "Replay de séance"]
    }
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Georgia', serif", color: "#f0e8d8" }}>

      <div style={{ position: "relative", overflow: "hidden", padding: "100px 20px 80px", textAlign: "center", background: "linear-gradient(180deg, #0d0b10 0%, #050508 100%)" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", top: "30%", right: "8%", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }}></div>

        <div style={{ display: "inline-block", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "30px", padding: "6px 20px", marginBottom: "24px", fontSize: "12px", letterSpacing: "3px", color: "#c8a96e", textTransform: "uppercase" }}>
          Centre de Thérapie Holistique
        </div>

        <h1 style={{ fontSize: "clamp(32px, 6vw, 72px)", fontWeight: "300", letterSpacing: "2px", marginBottom: "20px", lineHeight: "1.2", color: "#f0e8d8" }}>
          Séances{" "}
          <span style={{ color: "#c8a96e", fontStyle: "italic" }}>Thérapeutiques</span>
        </h1>

        <p style={{ fontSize: "18px", color: "rgba(240,232,216,0.6)", maxWidth: "600px", margin: "0 auto 40px", lineHeight: "1.8", fontWeight: "300" }}>
          Un accompagnement professionnel et bienveillant pour transformer votre vie de l'intérieur
        </p>

        <div style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, transparent, #c8a96e, transparent)", margin: "0 auto" }}></div>
      </div>

      <div style={{ padding: "80px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 42px)", fontWeight: "300", color: "#f0e8d8", marginBottom: "16px", letterSpacing: "1px" }}>
            Nos <span style={{ color: "#c8a96e" }}>Spécialités</span>
          </h2>
          <p style={{ color: "rgba(240,232,216,0.5)", fontSize: "15px", letterSpacing: "2px", textTransform: "uppercase" }}>
            14 domaines d'expertise à votre service
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
          {specialites.map(function(s) {
            const isHovered = hoveredCard === s.id;
            const isActive = activeSpecialite === s.id;
            return (
              <div
                key={s.id}
                onClick={function() { setActiveSpecialite(isActive ? null : s.id); }}
                onMouseEnter={function() { setHoveredCard(s.id); }}
                onMouseLeave={function() { setHoveredCard(null); }}
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(200,169,110,0.15) 0%, rgba(200,169,110,0.05) 100%)"
                    : isHovered
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(255,255,255,0.02)",
                  border: isActive
                    ? "1px solid rgba(200,169,110,0.5)"
                    : isHovered
                    ? "1px solid rgba(200,169,110,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                  padding: "28px 22px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform: isHovered || isActive ? "translateY(-4px)" : "translateY(0)",
                  boxShadow: isActive ? "0 20px 40px rgba(200,169,110,0.1)" : isHovered ? "0 10px 30px rgba(0,0,0,0.3)" : "none"
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "14px" }}>{s.icon}</div>
                <h3 style={{ fontSize: "16px", fontWeight: "500", color: isActive ? "#c8a96e" : "#f0e8d8", marginBottom: "10px", letterSpacing: "0.5px" }}>
                  {s.nom}
                </h3>
                <div style={{
                  maxHeight: isActive ? "200px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.4s ease",
                  opacity: isActive ? 1 : 0
                }}>
                  <p style={{ fontSize: "13px", color: "rgba(240,232,216,0.65)", lineHeight: "1.7", marginTop: "8px" }}>
                    {s.desc}
                  </p>
                </div>
                {!isActive && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                    <div style={{ width: "16px", height: "1px", background: "#c8a96e", opacity: 0.5 }}></div>
                    <span style={{ fontSize: "11px", color: "rgba(200,169,110,0.6)", letterSpacing: "1px", textTransform: "uppercase" }}>Explorer</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "80px 20px", background: "linear-gradient(180deg, #050508 0%, #080610 50%, #050508 100%)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 42px)", fontWeight: "300", color: "#f0e8d8", marginBottom: "16px", letterSpacing: "1px" }}>
              Nos <span style={{ color: "#c8a96e" }}>Formules</span>
            </h2>
            <p style={{ color: "rgba(240,232,216,0.5)", fontSize: "15px", letterSpacing: "2px", textTransform: "uppercase" }}>
              Choisissez l'accompagnement qui vous correspond
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px", alignItems: "center" }}>
            {tarifs.map(function(t, index) {
              const isHov = hoveredTarif === t.id;
              const isAct = activeTarif === t.id;
              const isFeatured = index === 2;
              return (
                <div
                  key={t.id}
                  onClick={function() { setActiveTarif(isAct ? null : t.id); }}
                  onMouseEnter={function() { setHoveredTarif(t.id); }}
                  onMouseLeave={function() { setHoveredTarif(null); }}
                  style={{
                    position: "relative",
                    background: isFeatured
                      ? "linear-gradient(145deg, rgba(200,169,110,0.12) 0%, rgba(200,169,110,0.04) 100%)"
                      : "rgba(255,255,255,0.02)",
                    border: isFeatured
                      ? "1px solid rgba(200,169,110,0.4)"
                      : isHov || isAct
                      ? "1px solid rgba(200,169,110,0.25)"
                      : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "24px",
                    padding: isFeatured ? "48px 32px" : "40px 28px",
                    cursor: "pointer",
                    transition: "all 0.35s ease",
                    transform: isFeatured ? "scale(1.03)" : isHov ? "translateY(-6px)" : "none",
                    boxShadow: isFeatured ? "0 30px 60px rgba(200,169,110,0.12)" : isHov ? "0 15px 40px rgba(0,0,0,0.4)" : "none"
                  }}
                >
                  {isFeatured && (
                    <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg, #c8a96e, #e8c97e)", color: "#050508", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", padding: "6px 18px", borderRadius: "20px" }}>
                      Recommandé
                    </div>
                  )}

                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#c8a96e", letterSpacing: "3px", textTransform: "uppercase" }}>
                      {t.duree}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "24px", fontWeight: "400", color: "#f0e8d8", marginBottom: "24px", letterSpacing: "1px" }}>
                    {t.nom}
                  </h3>

                  <div style={{ marginBottom: "32px" }}>
                    <span style={{ fontSize: "54px", fontWeight: "300", color: "#c8a96e", lineHeight: "1" }}>
                      {t.prix}