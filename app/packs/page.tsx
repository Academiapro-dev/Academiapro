import React, { useState } from "react";

const packs = [
  {
    name: "Starter",
    price: 47,
    color: "#c8a96e",
    features: ["Accès aux bases IA", "Support email", "1 module inclus"],
    popular: false,
  },
  {
    name: "Starter Complet",
    price: 97,
    color: "#c8a96e",
    features: ["Accès complet Starter", "2 modules inclus", "Support prioritaire"],
    popular: false,
  },
  {
    name: "Skills IA",
    price: 597,
    color: "#c8a96e",
    features: ["5 modules IA", "Projets pratiques", "Mentorat mensuel"],
    popular: false,
  },
  {
    name: "Marketing",
    price: 1490,
    color: "#c8a96e",
    features: ["Marketing digital IA", "Stratégies avancées", "Coaching hebdo"],
    popular: false,
  },
  {
    name: "IA Complet",
    price: 2690,
    color: "#d4af70",
    features: ["Formation complète IA", "Tous modules", "Certification incluse"],
    popular: true,
  },
  {
    name: "IA Skills",
    price: 2990,
    color: "#d4af70",
    features: ["IA + Skills avancés", "Projets réels", "Certification Pro"],
    popular: false,
  },
  {
    name: "Entrepreneur",
    price: 3490,
    color: "#d4af70",
    features: ["Formation entrepreneur", "Business model IA", "Suivi personnalisé"],
    popular: false,
  },
  {
    name: "Elite",
    price: 3990,
    color: "#f0c040",
    features: ["Accès total lifetime", "VIP coaching", "Réseau exclusif Elite"],
    popular: false,
  },
];

export default function FormationsPacks() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
        padding: "60px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "rgba(200,169,110,0.1)",
            border: "1px solid rgba(200,169,110,0.3)",
            borderRadius: "50px",
            padding: "8px 24px",
            marginBottom: "20px",
          }}
        >
          <span style={{ color: "#c8a96e", fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase" }}>
            Nos Formations
          </span>
        </div>
        <h1
          style={{
            color: "#ffffff",
            fontSize: "clamp(28px, 4vw, 52px)",
            fontWeight: "800",
            margin: "0 0 16px 0",
            lineHeight: "1.2",
          }}
        >
          Choisissez votre{" "}
          <span style={{ color: "#c8a96e" }}>Pack Formation</span>
        </h1>
        <p style={{ color: "#8888aa", fontSize: "16px", maxWidth: "520px", margin: "0 auto 8px auto" }}>
          De débutant à expert, trouvez la formation qui correspond à votre ambition.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "24px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "rgba(200,169,110,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#c8a96e", fontSize: "16px" }}>🏅</span>
            </div>
            <span style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "600" }}>Certification AcadémIA Pro</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "rgba(200,169,110,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#c8a96e", fontSize: "16px" }}>🛡️</span>
            </div>
            <span style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "600" }}>Garantie 30 jours satisfait</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "24px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        {packs.map((pack, index) => {
          const isHovered = hovered === index;
          const isPopular = pack.popular;

          return (
            <div
              key={index}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "relative",
                backgroundColor: isHovered
                  ? "rgba(200,169,110,0.08)"
                  : isPopular
                  ? "rgba(200,169,110,0.06)"
                  : "rgba(255,255,255,0.03)",
                border: isPopular
                  ? "2px solid rgba(200,169,110,0.7)"
                  : isHovered
                  ? "1px solid rgba(200,169,110,0.5)"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px",
                padding: "32px 24px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                boxShadow: isPopular
                  ? "0 0 40px rgba(200,169,110,0.15)"
                  : isHovered
                  ? "0 20px 40px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(0,0,0,0.2)",
              }}
            >
              {isPopular && (
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#c8a96e",
                    color: "#050508",
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    padding: "5px 18px",
                    borderRadius: "50px",
                    whiteSpace: "nowrap",
                  }}
                >
                  ⭐ Plus Populaire
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(200,169,110,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    fontSize: "22px",
                  }}
                >
                  {index === 0 ? "🚀" : index === 1 ? "⚡" : index === 2 ? "🤖" : index === 3 ? "📈" : index === 4 ? "🧠" : index === 5 ? "💡" : index === 6 ? "🏢" : "👑"}
                </div>
                <h2
                  style={{
                    color: "#ffffff",
                    fontSize: "20px",
                    fontWeight: "700",
                    margin: "0 0 8px 0",
                  }}
                >
                  {pack.name}
                </h2>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                  <span
                    style={{
                      color: pack.color,
                      fontSize: "38px",
                      fontWeight: "800",
                      lineHeight: "1",
                    }}
                  >
                    {pack.price}
                  </span>
                  <span style={{ color: pack.color, fontSize: "20px", fontWeight: "600", paddingBottom: "4px" }}>€</span>
                </div>
                <span style={{ color: "#666688", fontSize: "12px" }}>paiement unique</span>
              </div>

              <div
                style={{
                  height: "1px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  margin: "20px 0",
                }}
              />

              <ul style={{ listStyle: "none", padding: "0", margin: "0 0 24px 0" }}>
                {pack.features.map((feature, fi) => (
                  <li
                    key={fi}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#aaaacc",
                      fontSize: "14px",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(200,169,110,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: "0" as any,
                        fontSize: "10px",
                        color: "#c8a96e",
                      }}
                    >
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: isPopular ? "none" : "1px solid rgba(200,169,110,0.4)",
                  backgroundColor: isPopular
                    ? "#c8a96e"
                    : isHovered
                    ? "rgba(200,169,110,0.15)"
                    : "transparent",
                  color: isPopular ? "#050508" : "#c8a96e",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.5px",
                }}
              >
                {isPopular ? "Commencer maintenant" : "Choisir ce pack"}
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          maxWidth: "900px",
          margin: "64px auto 0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(200,169,110,0.06)",
            border: "1px solid rgba(200,169,110,0.2)",
            borderRadius: "16px",
            padding: "28px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏅</div>
          <h3 style={{ color: "#c8a96e", fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>
            Certification AcadémIA Pro
          </h3>
          <p style={{ color: "#8888aa", fontSize: "13px", margin: "0" }}>
            Obtenez votre certification reconnue à la fin de votre formation et valorisez vos compétences IA.
          </p>
        </div>
        <div
          style={{
            backgroundColor: "rgba(200,169,110,0.06)",
            border: "1px solid rgba(200,169,110,0.2)",
            borderRadius: "16px",
            padding: "28px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🛡️</div>
          <h3 style={{ color: "#c8a96e", fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>
            Garantie 30 jours
          </h3>
          <p style={{ color: "#8888aa", fontSize: "13px", margin: "0" }}>
            Satisfait ou remboursé. Si dans les 30 jours vous n'êtes pas convaincu, nous vous remboursons intégralement.
          </p>
        </div>
        <div
          style={{
            backgroundColor: "rgba(200,169,110,0.06)",
            border: "1px solid rgba(200,169,110,0.2)",
            borderRadius: "16px",
            padding: "28px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>💬</div>
          <h3 style={{ color: "#c8a96e", fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>
            Support dédié
          </h3>
          <p style={{ color: "#8888aa", fontSize: "13px", margin: "0" }}>
            Une équipe disponible pour vous accompagner tout au long de votre parcours de formation.
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "48px" }}>
        <p style={{ color: "#555577", fontSize: "12px" }}>
          Paiement sécurisé • Accès immédiat • Formation 100% en ligne
        </p>
      </div>
    </div>
  );
}