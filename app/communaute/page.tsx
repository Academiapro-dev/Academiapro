import React, { useState } from "react";

const tiers = [
  {
    name: "Gratuit",
    price: "0€",
    color: "#c8a96e",
    bg: "#0d0d14",
    features: [
      "Accès aux ressources de base",
      "Forum communautaire",
      "Newsletter mensuelle",
      "1 prompt offert par mois",
    ],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  {
    name: "Premium",
    price: "19€",
    period: "/mois",
    color: "#050508",
    bg: "#c8a96e",
    features: [
      "Prompts exclusifs illimités",
      "Accès aux lives privés",
      "Avatar personnalisé",
      "Bibliothèque de ressources",
      "Networking membres Premium",
      "Support prioritaire",
    ],
    cta: "Rejoindre Premium",
    highlight: true,
  },
  {
    name: "VIP",
    price: "79€",
    period: "/mois",
    color: "#c8a96e",
    bg: "#0d0d14",
    features: [
      "Tout Premium inclus",
      "Accès VIP backstage lives",
      "Avatar VIP exclusif",
      "Sessions 1-on-1 mensuelles",
      "Masterminds privés",
      "Accès anticipé nouveautés",
      "Badge VIP communauté",
    ],
    cta: "Devenir VIP",
    highlight: false,
  },
];

const benefits = [
  {
    icon: "✦",
    title: "Prompts Exclusifs",
    desc: "Des centaines de prompts testés et optimisés pour booster votre productivité.",
  },
  {
    icon: "◈",
    title: "Lives Privés",
    desc: "Sessions live hebdomadaires avec experts et membres de la communauté.",
  },
  {
    icon: "◉",
    title: "Avatar Unique",
    desc: "Un avatar personnalisé qui reflète votre statut dans la communauté.",
  },
  {
    icon: "❋",
    title: "Ressources",
    desc: "Bibliothèque de ressources premium mise à jour chaque semaine.",
  },
  {
    icon: "◆",
    title: "Networking",
    desc: "Connectez-vous avec des professionnels partageant les mêmes objectifs.",
  },
  {
    icon: "✸",
    title: "Discord Privé",
    desc: "Accès au serveur Discord exclusif avec canaux thématiques dédiés.",
  },
];

export default function App() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [btnHovered, setBtnHovered] = useState(false);
  const [cardHovered, setCardHovered] = useState<number | null>(null);
  const [benefitHovered, setBenefitHovered] = useState<number | null>(null);

  return React.createElement(
    "div",
    {
      style: {
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Georgia', serif",
        color: "#f0e6d3",
        overflowX: "hidden",
      },
    },

    React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(200,169,110,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(200,169,110,0.03) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }
    ),

    React.createElement(
      "nav",
      {
        style: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(200,169,110,0.1)",
          backgroundColor: "rgba(5,5,8,0.95)",
          backdropFilter: "blur(10px)",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "3px",
            color: "#c8a96e",
          },
        },
        "ÉLITE CIRCLE"
      ),
      React.createElement(
        "a",
        {
          href: "https://discord.gg",
          target: "_blank",
          rel: "noopener noreferrer",
          style: {
            padding: "10px 24px",
            backgroundColor: btnHovered ? "#c8a96e" : "transparent",
            color: btnHovered ? "#050508" : "#c8a96e",
            border: "1px solid #c8a96e",
            fontSize: "12px",
            letterSpacing: "2px",
            cursor: "pointer",
            textDecoration: "none",
            fontWeight: "600",
            transition: "all 0.3s ease",
          },
          onMouseEnter: () => setBtnHovered(true),
          onMouseLeave: () => setBtnHovered(false),
        },
        "REJOINDRE DISCORD"
      )
    ),

    React.createElement(
      "section",
      {
        style: {
          position: "relative",
          zIndex: 1,
          paddingTop: "160px",
          paddingBottom: "100px",
          textAlign: "center",
          paddingLeft: "20px",
          paddingRight: "20px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            display: "inline-block",
            padding: "6px 20px",
            border: "1px solid rgba(200,169,110,0.4)",
            fontSize: "11px",
            letterSpacing: "4px",
            color: "#c8a96e",
            marginBottom: "32px",
            backgroundColor: "rgba(200,169,110,0.05)",
          },
        },
        "COMMUNAUTÉ PRIVÉE"
      ),
      React.createElement(
        "h1",
        {
          style: {
            fontSize: "clamp(42px, 7vw, 80px)",
            fontWeight: "700",
            lineHeight: "1.1",
            marginBottom: "28px",
            maxWidth: "900px",
            margin: "0 auto 28px",
            letterSpacing: "-1px",
          },
        },
        "Rejoignez l'élite",
        React.createElement("br"),
        React.createElement(
          "span",
          {
            style: {
              color: "#c8a96e",
            },
          },
          "qui avance différemment"
        )
      ),
      React.createElement(
        "p",
        {
          style: {
            fontSize: "18px",
            color: "rgba(240,230,211,0.6)",
            maxWidth: "560px",
            margin: "0 auto 48px",
            lineHeight: "1.8",
            fontStyle: "italic",
          },
        },
        "Une communauté d'exception réservée aux esprits ambitieux. Accédez à des ressources exclusives, des connexions précieuses et des outils qui transforment votre potentiel."
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            flexWrap: "wrap",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              textAlign: "center",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                fontSize: "36px",
                fontWeight: "700",
                color: "#c8a96e",
              },
            },
            "2,400+"
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: "12px",
                letterSpacing: "2px",
                color: "rgba(240,230,211,0.5)",
              },
            },
            "MEMBRES ACTIFS"
          )
        ),
        React.createElement(
          "div",
          {
            style: {
              width: "1px",
              height: "50px",
              backgroundColor: "rgba(200,169,110,0.2)",
            },
          }
        ),
        React.createElement(
          "div",
          {
            style: {
              textAlign: "center",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                fontSize: "36px",
                fontWeight: "700",
                color: "#c8a96e",
              },
            },
            "500+"
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: "12px",
                letterSpacing: "2px",
                color: "rgba(240,230,211,0.5)",
              },
            },
            "PROMPTS EXCLUSIFS"
          )
        ),
        React.createElement(
          "div",
          {
            style: {
              width: "1px",
              height: "50px",
              backgroundColor: "rgba(200,169,110,0.2)",
            },
          }
        ),
        React.createElement(
          "div",
          {
            style: {
              textAlign: "center",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                fontSize: "36px",
                fontWeight: "700",
                color: "#c8a96e",
              },
            },
            "52"
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: "12px",
                letterSpacing: "2px",
                color: "rgba(240,230,211,0.5)",
              },
            },
            "LIVES PAR AN"
          )
        )
      )
    ),

    React.createElement(
      "section",
      {
        style: {
          position: "relative",
          zIndex: 1,
          padding: "80px 40px",
          maxWidth: "1200px",
          margin: "0 auto",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            textAlign: "center",
            marginBottom: "60px",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              fontSize: "11px",
              letterSpacing: "4px",
              color: "#c8a96e",
              marginBottom: "16px",
            },
          },
          "CE QUE VOUS OBTENEZ"
        ),
        React.createElement(
          "h2",
          {
            style: {
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: "700",
            },
          },
          "Des avantages conçus pour",
          React.createElement("br"),
          "ceux qui visent l'excellence"
        )
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          },
        },
        benefits.map((b, i) =>
          React.createElement(
            "div",
            {
              key: i,
              onMouseEnter: () => setBenefitHovered(i),
              onMouseLeave: () => setBenefitHovered(null),
              style: {
                padding: "32px",
                border: benefitHovered === i
                  ? "1px solid rgba(200,169,110,0.5)"
                  : "1px solid rgba(200,169,110,0.15)",
                backgroundColor: benefitHovered === i
                  ? "rgba(200,169,110,0.06)"
                  : "rgba(13,13,20,0.5)",
                transition: "all 0.3s ease",
                cursor: "default",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "28px",
                  color: "#c8a96e",
                  marginBottom: "16px",
                },
              },
              b.icon
            ),
            React.createElement(
              "h3",
              {
                style: {
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "10px",
                  letterSpacing: "0.5px",
                },
              },
              b.title
            ),
            React.createElement(
              "p",
              {
                style: {
                  fontSize: "15px",
                  color: "rgba(240,230,211,0.55)",
                  lineHeight: "1.7",
                },
              },
              b.desc
            )
          )
        )
      )
    ),

    React.createElement(
      "section",
      {
        style: {
          position: "relative",
          zIndex: 1,
          padding: "80px 20px",
          maxWidth: "1100px",
          margin: "0 auto",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            textAlign: "center",
            marginBottom: "60px",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              fontSize: "11px",
              letterSpacing: "4px",
              color: "#c8a96e",
              marginBottom: "16px",
            },
          },
          "NOS FORMULES"
        ),
        React.createElement(
          "h2",
          {
            style: {
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: "700",
            },
          },
          "Choisissez votre niveau"
        )
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            alignItems: "start",
          },
        },
        tiers.map((tier, i) =>
          React.createElement(
            "div",
            {
              key: i,
              onMouseEnter: () => setCardHovered(i),
              onMouseLeave: () => setCardHovered(null),
              style: {
                backgroundColor: tier.bg,
                border: tier.highlight
                  ? "2px solid #c8a96e"
                  : cardHovered === i
                  ? "1px solid rgba(200,169,110,0.4)"
                  : "1px solid rgba(200,169,110,0.15)",
                padding: "40px 36px",
                position: "relative",
                transform: tier.highlight ? "scale(1.03)" : "scale(1)",