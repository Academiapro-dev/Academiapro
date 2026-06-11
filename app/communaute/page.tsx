export default function CommunautePage() {
  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 20% 20%, rgba(200,169,110,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(200,169,110,0.04) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <nav
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(5,5,8,0.8)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#050508",
            }}
          >
            A
          </div>
          <span
            style={{
              fontSize: "20px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AcadémIA Pro
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <a
            href="#discord"
            style={{
              color: "#c8a96e",
              textDecoration: "none",
              fontSize: "14px",
              padding: "8px 16px",
              border: "1px solid rgba(200,169,110,0.3)",
              borderRadius: "8px",
              transition: "all 0.2s",
            }}
          >
            Discord
          </a>
          <a
            href="#rejoindre"
            style={{
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              color: "#050508",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              padding: "8px 18px",
              borderRadius: "8px",
            }}
          >
            Rejoindre
          </a>
        </div>
      </nav>

      <section
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "100px 24px 80px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(200,169,110,0.1)",
            border: "1px solid rgba(200,169,110,0.25)",
            borderRadius: "100px",
            padding: "6px 16px",
            marginBottom: "32px",
            fontSize: "13px",
            color: "#c8a96e",
            fontWeight: "500",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#c8a96e",
              display: "inline-block",
            }}
          />
          Communauté Privée · Accès Exclusif
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: "800",
            lineHeight: "1.1",
            marginBottom: "24px",
            letterSpacing: "-1px",
          }}
        >
          La Communauté{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AcadémIA Pro
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "rgba(255,255,255,0.6)",
            lineHeight: "1.7",
            maxWidth: "600px",
            margin: "0 auto 48px",
          }}
        >
          Rejoignez une communauté privée d'apprenants passionnés par l'IA.
          Accédez à des ressources exclusives, des lives mensuels et un réseau
          d'experts pour accélérer votre progression.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "60px",
          }}
        >
          <a
            href="#rejoindre"
            id="rejoindre"
            style={{
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              color: "#050508",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: "700",
              padding: "16px 36px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 32px rgba(200,169,110,0.3)",
            }}
          >
            ✦ Rejoindre Gratuitement
          </a>
          <a
            href="https://discord.gg"
            id="discord"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "rgba(88,101,242,0.15)",
              border: "1px solid rgba(88,101,242,0.4)",
              color: "#a5b4ff",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: "600",
              padding: "16px 36px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Rejoindre le Discord
          </a>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          {[
            { number: "2,400+", label: "Membres actifs" },
            { number: "48", label: "Ressources exclusives" },
            { number: "12", label: "Lives réalisés" },
            { number: "98%", label: "Satisfaction" },
          ].map((stat, index) => (
            <div key={index} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.number}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.45)",
                  marginTop: "4px",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: "700",
              marginBottom: "16px",
              letterSpacing: "-0.5px",
            }}
          >
            Tout ce que vous obtenez
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "16px",
              maxWidth: "500px",
              margin: "0 auto",
            }}
          >
            Des avantages exclusifs conçus pour accélérer votre maîtrise de
            l'intelligence artificielle.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              icon: "⚡",
              title: "Prompts Exclusifs Hebdo",
              description:
                "Chaque semaine, recevez des prompts avancés testés et optimisés par nos experts IA pour booster votre productivité.",
              tag: "Hebdomadaire",
            },
            {
              icon: "🎥",
              title: "Lives Mensuels Avatar IA",
              description:
                "Participez à des sessions live interactives avec notre avatar IA personnalisé, Q&A en temps réel et démonstrations exclusives.",
              tag: "Mensuel",
            },
            {
              icon: "📚",
              title: "Ressources Membres",
              description:
                "Accédez à une bibliothèque privée de guides, templates, workflows et outils IA soigneusement sélectionnés.",
              tag: "Illimité",
            },
            {
              icon: "🤝",
              title: "Networking IA",
              description:
                "Connectez-vous avec des professionnels et passionnés d'IA, collaborez sur des projets et développez votre réseau.",
              tag: "Communauté",
            },
            {
              icon: "🚀",
              title: "Avant-Première Formations",
              description:
                "Soyez les premiers à accéder aux nouvelles formations AcadémIA Pro avant leur sortie officielle, à tarif préférentiel.",
              tag: "Exclusif",
            },
            {
              icon: "🏆",
              title: "Défis & Challenges",
              description:
                "Participez à des défis hebdomadaires pour mettre en pratique vos compétences et gagner des badges de reconnaissance.",
              tag: "Gamification",
            },
          ].map((avantage, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(200,169,110,0.12)",
                borderRadius: "16px",
                padding: "28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(200,169,110,0.3), transparent)",
                }}
              />
              <div
                style={{
                  fontSize: "32px",
                  marginBottom: "16px",
                }}
              >
                {avantage.icon}
              </div>
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "rgba(200,169,110,0.1)",
                  color: "#c8a96e",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "3px 10px",
                  borderRadius: "100px",
                  marginBottom: "12px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {avantage.tag}
              </div>
              <h3
}}