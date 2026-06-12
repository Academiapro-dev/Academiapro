"use client";
import { useState } from "react";

export default function FormationsPage() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const packs = [
    {
      id: 1,
      name: "Starter",
      price: "47",
      tag: "Débutant",
      color: "#c8a96e",
      desc: "Posez les bases solides de votre transformation digitale avec les fondamentaux essentiels.",
      features: ["Accès aux modules intro", "Support email", "Certificat de completion"],
    },
    {
      id: 2,
      name: "Starter Complet",
      price: "97",
      tag: "Populaire",
      color: "#c8a96e",
      desc: "Le pack Starter enrichi avec des ressources complémentaires pour aller plus loin rapidement.",
      features: ["Tout le pack Starter", "Ressources bonus", "Communauté privée", "Mises à jour incluses"],
    },
    {
      id: 3,
      name: "Skills IA",
      price: "597",
      tag: "Compétences",
      color: "#d4b87e",
      desc: "Maîtrisez les outils IA incontournables et développez des compétences concrètes et monétisables.",
      features: ["Modules IA avancés", "Outils pratiques", "Projets guidés", "Support prioritaire", "Accès à vie"],
    },
    {
      id: 4,
      name: "Marketing",
      price: "1 490",
      tag: "Croissance",
      color: "#d4b87e",
      desc: "Stratégies marketing complètes pour attirer des clients, construire votre marque et scaler.",
      features: ["Stratégies avancées", "Tunnels de vente", "Copywriting", "Publicité payante", "Templates exclusifs", "Coaching mensuel"],
    },
    {
      id: 5,
      name: "IA Complet",
      price: "2 690",
      tag: "Maîtrise",
      color: "#e0c88e",
      desc: "Le programme IA le plus complet du marché pour automatiser, créer et dominer votre secteur.",
      features: ["Tout Skills IA", "Automatisation avancée", "IA generative", "Business IA", "Mentorat de groupe", "Accès communauté VIP"],
    },
    {
      id: 6,
      name: "IA Skills",
      price: "2 990",
      tag: "Expert",
      color: "#e0c88e",
      desc: "Combinez IA et compétences business pour devenir un expert reconnu et hautement employable.",
      features: ["IA Complet inclus", "Skills business", "Personal branding", "LinkedIn strategy", "Sessions Q&A live", "Certification expert"],
    },
    {
      id: 7,
      name: "Entrepreneur",
      price: "3 490",
      tag: "Business",
      color: "#ecd89e",
      desc: "Tout ce qu'il faut pour lancer, structurer et faire croître votre business en ligne de A à Z.",
      features: ["Tous les modules", "Stratégie business", "Mindset entrepreneur", "Coaching individuel", "Réseau partenaires", "Suivi 6 mois", "Accès illimité"],
    },
    {
      id: 8,
      name: "Elite",
      price: "3 990",
      tag: "Ultime",
      color: "#f5e8b8",
      desc: "L'expérience de formation la plus exclusive. Accompagnement total et résultats garantis.",
      features: ["Accès TOUT le catalogue", "Coaching 1-on-1 mensuel", "Réseau élite", "Mastermind trimestriel", "Support 7j/7", "Garantie résultats", "Statut membre fondateur"],
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "80px 24px 100px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(200,169,110,0.1)",
              border: "1px solid rgba(200,169,110,0.3)",
              borderRadius: "50px",
              padding: "8px 24px",
              marginBottom: "24px",
            }}
          >
            <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase" }}>
              Nos Formations
            </span>
          </div>

          <h1
            style={{
              color: "#ffffff",
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: "800",
              lineHeight: "1.1",
              margin: "0 0 24px",
              letterSpacing: "-1px",
            }}
          >
            Choisissez votre
            <br />
            <span style={{ color: "#c8a96e" }}>niveau de transformation</span>
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "18px",
              maxWidth: "560px",
              margin: "0 auto",
              lineHeight: "1.7",
            }}
          >
            8 programmes conçus pour chaque étape de votre parcours. De vos premiers pas à l'excellence entrepreneuriale.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {packs.map((pack) => (
            <div
              key={pack.id}
              onMouseEnter={() => setHoveredCard(pack.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: hoveredCard === pack.id ? "rgba(200,169,110,0.07)" : "rgba(255,255,255,0.03)",
                border: hoveredCard === pack.id ? "1px solid rgba(200,169,110,0.5)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: "20px",
                padding: "36px 32px",
                cursor: "pointer",
                transition: "all 0.35s ease",
                position: "relative",
                overflow: "hidden",
                transform: hoveredCard === pack.id ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hoveredCard === pack.id ? "0 24px 60px rgba(200,169,110,0.12)" : "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  right: "0",
                  height: "2px",
                  background: hoveredCard === pack.id
                    ? "linear-gradient(90deg, transparent, " + pack.color + ", transparent)"
                    : "transparent",
                  transition: "all 0.35s ease",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top: "-60px",
                  right: "-60px",
                  width: "160px",
                  height: "160px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <span
                  style={{
                    backgroundColor: "rgba(200,169,110,0.12)",
                    color: pack.color,
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    padding: "5px 12px",
                    borderRadius: "50px",
                    border: "1px solid rgba(200,169,110,0.2)",
                  }}
                >
                  {pack.tag}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.15)",
                    fontSize: "32px",
                    fontWeight: "800",
                    lineHeight: "1",
                  }}
                >
                  0{pack.id}
                </span>
              </div>

              <h2
                style={{
                  color: "#ffffff",
                  fontSize: "24px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                  letterSpacing: "-0.5px",
                }}
              >
                {pack.name}
              </h2>

              <div style={{ marginBottom: "20px" }}>
                <span style={{ color: pack.color, fontSize: "42px", fontWeight: "800", lineHeight: "1", letterSpacing: "-1px" }}>
                  {pack.price}
                  <span style={{ fontSize: "22px", fontWeight: "600" }}>€</span>
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginLeft: "8px" }}>
                  paiement unique
                </span>
              </div>

              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "14px",
                  lineHeight: "1.65",
                  margin: "0 0 24px",
                }}
              >
                {pack.desc}
              </p>

              <div
                style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  marginBottom: "24px",
                }}
              />

              <ul style={{ listStyle: "none", padding: "0", margin: "0 0 32px" }}>
                {pack.features.map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                      color: "rgba(255,255,255,0.65)",
                      fontSize: "14px",
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(200,169,110,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: "0",
                        color: pack.color,
                        fontSize: "10px",
                        fontWeight: "800",
                      }}
                    >
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onMouseEnter={() => setHoveredBtn(pack.id)}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: "100%",
                  padding: "15px 24px",
                  borderRadius: "12px",
                  border: hoveredBtn === pack.id ? "1px solid transparent" : "1px solid rgba(200,169,110,0.4)",
                  background: hoveredBtn === pack.id
                    ? "linear-gradient(135deg, #c8a96e 0%, #e0c88e 100%)"
                    : "transparent",
                  color: hoveredBtn === pack.id ? "#050508" : "#c8a96e",
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  textTransform: "uppercase",
                }}
              >
                {hoveredBtn === pack.id ? "Je commence maintenant →" : "Découvrir ce pack"}
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "80px",
            textAlign: "center",
            padding: "48px 40px",
            backgroundColor: "rgba(200,169,110,0.04)",
            border: "1px solid rgba(200,169,110,0.15)",
            borderRadius: "24px",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "2px" }}>
            Garantie satisfaction
          </p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.7" }}>
            Tous nos programmes incluent une{" "}
            <span style={{ color: "#c8a96e", fontWeight: "600" }}>garantie satisfait ou remboursé 30 jours</span>
            {". "}Vous prenez zéro risque. Résultats garantis ou remboursement intégral.
          </p>
        </div>
      </div>
    </div>
  );
}