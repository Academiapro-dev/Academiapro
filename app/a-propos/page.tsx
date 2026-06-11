export default function AcademiaPro() {
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
      {/* Navigation */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 60px",
          borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
          position: "sticky",
          top: 0,
          backgroundColor: "rgba(5, 5, 8, 0.95)",
          backdropFilter: "blur(20px)",
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #c8a96e, #f0d49a)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: "bold",
              color: "#050508",
            }}
          >
            A
          </div>
          <span
            style={{
              fontSize: "22px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #c8a96e, #f0d49a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AcadémIA Pro
          </span>
        </div>

        <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
          {["Formations", "Spécialités", "Certifications", "À propos"].map(
            (item) => (
              <a
                key={item}
                href="#"
                style={{
                  color: "rgba(255,255,255,0.7)",
                  textDecoration: "none",
                  fontSize: "15px",
                  fontWeight: "500",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLAnchorElement).style.color = "#c8a96e")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLAnchorElement).style.color =
                    "rgba(255,255,255,0.7)")
                }
              >
                {item}
              </a>
            )
          )}
          <button
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              border: "none",
              borderRadius: "8px",
              color: "#050508",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Commencer
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          padding: "120px 60px 100px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(200, 169, 110, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            border: "1px solid rgba(200, 169, 110, 0.4)",
            borderRadius: "50px",
            fontSize: "13px",
            color: "#c8a96e",
            marginBottom: "32px",
            background: "rgba(200, 169, 110, 0.05)",
          }}
        >
          <span style={{ fontSize: "16px" }}>✦</span>
          Intelligence Artificielle au service de la formation
        </div>

        <h1
          style={{
            fontSize: "72px",
            fontWeight: "800",
            lineHeight: "1.1",
            marginBottom: "24px",
            maxWidth: "900px",
            margin: "0 auto 24px",
          }}
        >
          La formation professionnelle
          <span
            style={{
              display: "block",
              background: "linear-gradient(135deg, #c8a96e, #f0d49a, #c8a96e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            réinventée par l'IA
          </span>
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.6)",
            maxWidth: "600px",
            margin: "32px auto",
            lineHeight: "1.7",
          }}
        >
          Démocratiser la formation professionnelle grâce à l'intelligence
          artificielle. Chaque apprenant bénéficie de son propre agent IA
          personnel, disponible 24h/24 et 7j/7.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            marginTop: "48px",
          }}
        >
          <button
            style={{
              padding: "16px 40px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              border: "none",
              borderRadius: "12px",
              color: "#050508",
              fontWeight: "700",
              fontSize: "16px",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(200, 169, 110, 0.3)",
            }}
          >
            Découvrir nos formations →
          </button>
          <button
            style={{
              padding: "16px 40px",
              background: "transparent",
              border: "1px solid rgba(200, 169, 110, 0.4)",
              borderRadius: "12px",
              color: "#c8a96e",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Voir la démo ▶
          </button>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        style={{
          padding: "60px",
          borderTop: "1px solid rgba(200, 169, 110, 0.1)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.1)",
          background: "rgba(200, 169, 110, 0.02)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "40px",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {[
            {
              number: "131",
              label: "Formations",
              icon: "🎓",
              desc: "Programmes certifiants",
            },
            {
              number: "20",
              label: "Skills",
              icon: "⚡",
              desc: "Compétences clés",
            },
            {
              number: "14",
              label: "Spécialités",
              icon: "🏥",
              desc: "Thérapeutiques",
            },
            {
              number: "24/7",
              label: "Agent IA",
              icon: "🤖",
              desc: "Disponible en permanence",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                padding: "32px 24px",
                borderRadius: "16px",
                border: "1px solid rgba(200, 169, 110, 0.15)",
                background: "rgba(200, 169, 110, 0.03)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(200, 169, 110, 0.5)";
                el.style.background = "rgba(200, 169, 110, 0.07)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(200, 169, 110, 0.15)";
                el.style.background = "rgba(200, 169, 110, 0.03)";
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #c8a96e, #f0d49a)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: "1",
                  marginBottom: "8px",
                }}
              >
                {stat.number}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#ffffff",
                  marginBottom: "4px",
                }}
              >
                {stat.label}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                {stat.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={{ padding: "100px 60px" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
          }}
        >
          <div
            style={{
              padding: "48px",
              borderRadius: "20px",
              border: "1px solid rgba(200, 169, 110, 0.2)",
              background:
                "linear-gradient(135deg, rgba(200, 169, 110, 0.05), rgba(200, 169, 110, 0.01))",
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
                height: "3px",
                background: "linear-gradient(90deg, #c8a96e, transparent)",
              }}
            />
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "rgba(200, 169, 110, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "24px",
                border: "1px solid rgba(200, 169, 110, 0.2)",
              }}
            >
              🎯
            </div>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "#c8a96e",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Notre Mission
            </h2>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#ffffff",
                lineHeight: "1.3",
                marginBottom: "16px",
              }}
            >
              Démocratiser la formation professionnelle
            </h3>
            <p
              style={{
                fontSize: "16px",
                color: "rgba(255,255,255,0.6)",
                lineHeight: "1.7",
              }}
            >
              Rendre accessible à tous les professionnels une formation
              d'excellence grâce à l'intelligence artificielle. Briser les
              barrières géographiques, temporelles et financières pour offrir
              un apprentissage de qualité supérieure.
            </p>
          </div>

          <div
            style={{
              padding: "48px",
              borderRadius: "20px",
              border: "1px solid rgba(200, 169, 110, 0.2)",
              background:
                "linear-gradient(135deg, rgba(200, 169, 110, 0.05), rgba(200, 169, 110, 0.01))",
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
                height: "3px",
                background: "linear-gradient(90deg, #c8a96e, transparent)",
              }}
            />
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "rgba(200, 169, 110, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "24px",
                border: "1px solid rgba(200, 169, 110, 0.2)",
              }}
            >
              🔭
            </div>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "#c8a96e",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Notre Vision
            </h2>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#ffffff",
                lineHeight: "1.3",
                marginBottom: "16px",
              }}
            >
              Un agent IA personnel pour chaque apprenant
            </h3>
            <p
              style={{
                fontSize: "16px",
                color: "rgba(255,255,255,0.6)",
                lineHeight: "1.7",
              }}
            >
              Imaginer un monde où chaque professionnel dispose de son propre
              mentor IA, disponible 24h/24, adapté à son rythme d'apprentissage,
              à ses objectifs et à son secteur d'activité spécifique.
            </p>
          </div>
        </div>
      </section>