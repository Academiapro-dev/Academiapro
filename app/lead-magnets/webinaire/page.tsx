export default function WebinarPage() {
  const [firstName, setFirstName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [spotsLeft, setSpotsLeft] = React.useState(47);
  const [hoveredButton, setHoveredButton] = React.useState(false);
  const [hoveredFeature, setHoveredFeature] = React.useState<number | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSpotsLeft((prev) => {
        if (prev > 12) {
          const shouldDecrease = Math.random() > 0.7;
          return shouldDecrease ? prev - 1 : prev;
        }
        return prev;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  const gold = "#c8a96e";
  const goldLight = "#e8c98e";
  const bg = "#050508";
  const cardBg = "#0d0d14";
  const cardBorder = "1px solid rgba(200,169,110,0.2)";

  const features = [
    { icon: "🤖", title: "Automatisation IA", desc: "Découvrez comment déléguer 80% de vos tâches répétitives à l'IA dès la première semaine" },
    { icon: "⚡", title: "7 Jours Chrono", desc: "Un plan d'action concret et actionnable pour transformer votre business en une semaine" },
    { icon: "💰", title: "ROI Immédiat", desc: "Les outils gratuits et payants qui génèrent le meilleur retour sur investissement" },
    { icon: "🎯", title: "Cas Pratiques", desc: "Exemples réels d'entrepreneurs ayant multiplié leur productivité par 5 grâce à l'IA" },
    { icon: "🔧", title: "Outils Concrets", desc: "La stack complète d'outils IA utilisée par les business les plus performants en 2024" },
    { icon: "🚀", title: "Passage à l'Action", desc: "Repartez avec votre feuille de route personnalisée prête à déployer le lendemain" },
  ];

  const steps = [
    { num: "01", title: "Inscrivez-vous", desc: "Réservez votre place gratuite maintenant" },
    { num: "02", title: "Recevez le lien", desc: "Email de confirmation avec accès live" },
    { num: "03", title: "Participez live", desc: "1er dimanche du mois à 20h00" },
    { num: "04", title: "Transformez", desc: "Appliquez les stratégies dès le lendemain" },
  ];

  if (submitted) {
    return (
      React.createElement("div", {
        style: {
          minHeight: "100vh",
          backgroundColor: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          padding: "20px",
        }
      },
        React.createElement("div", {
          style: {
            textAlign: "center",
            maxWidth: "560px",
            padding: "60px 40px",
            background: cardBg,
            border: `1px solid rgba(200,169,110,0.4)`,
            borderRadius: "24px",
            boxShadow: "0 0 80px rgba(200,169,110,0.1)",
          }
        },
          React.createElement("div", {
            style: {
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${gold}, ${goldLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              margin: "0 auto 28px",
              boxShadow: `0 0 40px rgba(200,169,110,0.4)`,
            }
          }, "✓"),
          React.createElement("h2", {
            style: {
              fontSize: "32px",
              fontWeight: "700",
              color: "#ffffff",
              marginBottom: "16px",
              lineHeight: "1.2",
            }
          }, "Félicitations ! 🎉"),
          React.createElement("p", {
            style: {
              fontSize: "18px",
              color: gold,
              marginBottom: "12px",
              fontWeight: "600",
            }
          }, "Votre place est réservée !"),
          React.createElement("p", {
            style: {
              fontSize: "15px",
              color: "rgba(255,255,255,0.6)",
              lineHeight: "1.7",
              marginBottom: "32px",
            }
          }, "Un email de confirmation avec le lien d'accès au webinaire vous a été envoyé. Préparez-vous à transformer votre business avec l'IA !"),
          React.createElement("div", {
            style: {
              padding: "20px",
              background: "rgba(200,169,110,0.08)",
              borderRadius: "12px",
              border: `1px solid rgba(200,169,110,0.2)`,
            }
          },
            React.createElement("p", {
              style: { fontSize: "14px", color: gold, fontWeight: "600", marginBottom: "6px" }
            }, "📅 Rendez-vous le"),
            React.createElement("p", {
              style: { fontSize: "20px", color: "#ffffff", fontWeight: "700" }
            }, "1er Dimanche du mois · 20h00")
          )
        )
      )
    );
  }

  return (
    React.createElement("div", {
      style: {
        minHeight: "100vh",
        backgroundColor: bg,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        overflowX: "hidden",
      }
    },
      React.createElement("style", {
        dangerouslySetInnerHTML: {
          __html: `
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
            @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
            @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(200,169,110,0.3); } 50% { box-shadow: 0 0 40px rgba(200,169,110,0.6); } }
            @keyframes countPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            input::placeholder { color: rgba(255,255,255,0.3) !important; }
          `
        }
      }),

      React.createElement("div", {
        style: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(5,5,8,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200,169,110,0.1)",
        }
      },
        React.createElement("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }
        },
          React.createElement("div", {
            style: {
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${gold}, ${goldLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "900",
              color: bg,
            }
          }, "A"),
          React.createElement("span", {
            style: {
              fontSize: "18px",
              fontWeight: "700",
              background: `linear-gradient(135deg, ${gold}, ${goldLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }
          }, "AcadémIA Pro")
        ),
        React.createElement("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "rgba(200,169,110,0.1)",
            borderRadius: "20px",
            border: `1px solid rgba(200,169,110,0.3)`,
          }
        },
          React.createElement("div", {
            style: {
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#ff4444",
              animation: "pulse 2s infinite",
            }
          }),
          React.createElement("span", {
            style: { fontSize: "13px", color: gold, fontWeight: "600" }
          }, "GRATUIT • 1er Dimanche 20h")
        )
      ),

      React.createElement("section", {
        style: {
          position: "relative",
          paddingTop: "120px",
          paddingBottom: "80px",
          paddingLeft: "24px",
          paddingRight: "24px",
          textAlign: "center",
          overflow: "hidden",
        }
      },
        React.createElement("div", {
          style: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)`,
            pointerEvents: "none",
          }
        }),
        React.createElement("div", {
          style: {
            position: "absolute",
            top: "20%",
            left: "10%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(200,169,110,0.04) 0%, transparent 70%)`,
            pointerEvents: "none",
          }
        }),

        React.createElement("div", {
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            background: "rgba(200,169,110,0.1)",
            border: `1px solid rgba(200,169,110,0.35)`,
            borderRadius: "100px",
            marginBottom: "32px",
          }
        },
          React.createElement("span", { style: { fontSize: "14px" } }, "✨"),
          React.createElement("span", {
            style: { fontSize: "13px", color: gold, fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase" }
          }, "Webinaire 100% Gratuit")
        ),

        React.createElement("h1", {
          style: {
            fontSize: "clamp(32px, 5vw, 64px)",
            fontWeight: "800",
            lineHeight: "1.1",
            marginBottom: "24px",
            maxWidth: "900px",
            margin: "0 auto 24px",
          }
        },
          "Comment Automatiser Son Business",
          React.createElement("br", null),
          React.createElement("span", {
            style: {
              background: `linear-gradient(135deg, ${gold} 0%, ${goldLight} 50%, ${gold} 100%)`,
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s linear infinite",
            }
          }, "Avec L'IA en 7 Jours")
        ),

        React.createElement("p", {
          style: {
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "rgba(255,255,255,0.65)",
            maxWidth: "680px",
            margin: "0 auto 48px",
            lineHeight: "1.7",
          }
        }, "Rejoignez notre live mensuel exclusif et découvrez le plan d'action exact pour automatiser votre activité, récupérer votre temps et scaler sans recruter."),

        React.createElement("div", {
          style: {
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "60px",
          }
        },
          [
            { icon: "⏱", text: "60 min live" },
            { icon: "📅", text: "1er dimanche du mois" },
            { icon: "🕗", text: "20h00 précises" },
            { icon: "🎁", text: "100% gratuit" },
          ].map((item, i) =>
            React.createElement("div", {
              key: i,
              style: {
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "100px",
              }
            },
              React.createElement("span", { style: { fontSize: "16px" } }, item.icon),
              React.createElement("span", { style: { fontSize: "14px", color: "rgba(255,255,255,0.75)", fontWeight: "500" } }, item.text)
            )
          )
        ),

        React.createElement("div", {
          style: {
            position: "relative",
            display: "inline-block",
            marginBottom: "60px",
            animation: "float 4s ease-in-out infinite",
          }
        },
          React.createElement("div", {
            style: {
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.05))`,
              border: `2px solid rgba(200,169,110,0.4)`,
              display: "flex",
              alignItems: "center",
}}}