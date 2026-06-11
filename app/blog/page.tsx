export default function BlogAcademiaPro() {
  const articles = [
    {
      id: 1,
      titre: "10 prompts Claude pour automatiser sa comptabilité",
      date: "12 janvier 2026",
      categorie: "Productivité",
      description: "Découvrez comment des prompts bien construits peuvent transformer votre gestion comptable quotidienne et vous faire gagner des heures précieuses.",
    },
    {
      id: 2,
      titre: "Comment créer un chatbot en 24h sans coder",
      date: "18 janvier 2026",
      categorie: "No-Code",
      description: "Un guide pas à pas pour concevoir, configurer et déployer votre propre chatbot intelligent en une seule journée, sans écrire une seule ligne de code.",
    },
    {
      id: 3,
      titre: "Les 5 meilleurs outils IA pour le marketing 2026",
      date: "25 janvier 2026",
      categorie: "Marketing",
      description: "Notre sélection des outils d'intelligence artificielle incontournables pour booster vos campagnes marketing et maximiser votre retour sur investissement.",
    },
    {
      id: 4,
      titre: "Sophrologie et IA : la combinaison gagnante",
      date: "2 février 2026",
      categorie: "Bien-être",
      description: "Comment les professionnels de la sophrologie utilisent l'IA pour personnaliser leurs séances, suivre leurs clients et développer leur activité sereinement.",
    },
    {
      id: 5,
      titre: "Apprendre l'anglais avec Claude : méthode complète",
      date: "9 février 2026",
      categorie: "Formation",
      description: "Une méthode structurée et éprouvée pour progresser en anglais grâce aux conversations avec Claude, des débutants aux niveaux avancés.",
    },
    {
      id: 6,
      titre: "No-Code et IA : créer son app en une semaine",
      date: "16 février 2026",
      categorie: "No-Code",
      description: "Suivez notre programme intensif de sept jours pour transformer votre idée en application fonctionnelle en combinant les meilleures plateformes no-code et l'IA.",
    },
  ];

  const categoriesCouleurs: Record<string, string> = {
    "Productivité": "#c8a96e",
    "No-Code": "#a87fce",
    "Marketing": "#6eafc8",
    "Bien-être": "#6ec88a",
    "Formation": "#c86e6e",
  };

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e8e0d0",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
          padding: "0 2rem",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(5, 5, 8, 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "800",
                color: "#050508",
              }}
            >
              A
            </div>
            <div>
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  color: "#c8a96e",
                  letterSpacing: "0.02em",
                }}
              >
                AcadémIA
              </span>
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "300",
                  color: "#e8e0d0",
                  marginLeft: "4px",
                }}
              >
                Pro
              </span>
            </div>
          </div>

          <nav style={{ display: "flex", gap: "2rem" }}>
            {["Blog", "Formations", "Outils", "À propos"].map((item) => (
              <a
                key={item}
                href="#"
                style={{
                  color: item === "Blog" ? "#c8a96e" : "#9a9080",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: item === "Blog" ? "600" : "400",
                  transition: "color 0.2s",
                  borderBottom: item === "Blog" ? "2px solid #c8a96e" : "2px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {item}
              </a>
            ))}
          </nav>

          <button
            style={{
              backgroundColor: "#c8a96e",
              color: "#050508",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            Commencer
          </button>
        </div>
      </header>

      <section
        style={{
          padding: "100px 2rem 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "300px",
            background: "radial-gradient(ellipse, rgba(200, 169, 110, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(200, 169, 110, 0.1)",
            border: "1px solid rgba(200, 169, 110, 0.3)",
            borderRadius: "50px",
            padding: "6px 16px",
            marginBottom: "28px",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#c8a96e", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ✦ Nouvelles ressources chaque semaine
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: "800",
            lineHeight: "1.15",
            margin: "0 0 20px",
            maxWidth: "700px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Le blog qui transforme{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #c8a96e, #f0d090)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            l'IA en avantage
          </span>{" "}
          concret
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            color: "#9a9080",
            maxWidth: "520px",
            margin: "0 auto 40px",
            lineHeight: "1.7",
          }}
        >
          Tutoriels pratiques, méthodes éprouvées et outils sélectionnés pour intégrer l'intelligence artificielle dans votre quotidien professionnel.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "10px 18px",
            }}
          >
            <span style={{ color: "#c8a96e", fontSize: "1rem" }}>📚</span>
            <span style={{ fontSize: "0.85rem", color: "#b0a898" }}>
              <strong style={{ color: "#e8e0d0" }}>50+</strong> articles
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "10px 18px",
            }}
          >
            <span style={{ color: "#c8a96e", fontSize: "1rem" }}>🎯</span>
            <span style={{ fontSize: "0.85rem", color: "#b0a898" }}>
              <strong style={{ color: "#e8e0d0" }}>100%</strong> pratique
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "10px 18px",
            }}
          >
            <span style={{ color: "#c8a96e", fontSize: "1rem" }}>⚡</span>
            <span style={{ fontSize: "0.85rem", color: "#b0a898" }}>
              <strong style={{ color: "#e8e0d0" }}>Mis à jour</strong> 2026
            </span>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "0 2rem 100px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "48px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.6rem",
                fontWeight: "700",
                margin: "0 0 6px",
                color: "#e8e0d0",
              }}
            >
              Articles récents
            </h2>
            <p style={{ margin: 0, color: "#6a6058", fontSize: "0.9rem" }}>
              6 articles · Janvier – Février 2026
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {["Tous", "No-Code", "Marketing", "Formation", "Bien-être"].map((filtre, i) => (
              <button
                key={filtre}
                style={{
                  backgroundColor: i === 0 ? "rgba(200, 169, 110, 0.15)" : "transparent",
                  border: i === 0 ? "1px solid rgba(200, 169, 110, 0.5)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "50px",
                  padding: "7px 16px",
                  fontSize: "0.8rem",
                  color: i === 0 ? "#c8a96e" : "#6a6058",
                  cursor: "pointer",
                  fontWeight: i === 0 ? "600" : "400",
                }}
              >
                {filtre}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "28px",
          }}
        >
          {articles.map((article, index) => (
            <article
              key={article.id}
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
                overflow: "hidden",
                transition: "transform 0.3s, border-color 0.3s, box-shadow 0.3s",
                cursor: "pointer",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(200, 169, 110, 0.35)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px rgba(200, 169, 110, 0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  height: "6px",
                  background: `linear-gradient(90deg, ${categoriesCouleurs[article.categorie] || "#c8a96e"}, transparent)`,
                }}
              />

              <div
                style={{
                  height: "160px",
                  background: `linear-gradient(135deg, rgba(${index % 2 === 0 ? "200, 169, 110" : "100, 120, 200"}, 0.06) 0%, rgba(5, 5, 8, 0) 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3.5rem",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {["🧮", "🤖", "📣", "🧘", "🌍", "📱"][index]}
              </div>

              <div style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
}}}}