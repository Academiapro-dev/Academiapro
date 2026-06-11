export default function EbookLandingPage() {
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
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
              borderRadius: "8px",
              background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "16px",
              color: "#050508",
            }}
          >
            A
          </div>
          <span
            style={{
              fontSize: "20px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #c8a96e, #e8d4a8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AcadémIA Pro
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "80px 24px 60px",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(200, 169, 110, 0.12)",
            border: "1px solid rgba(200, 169, 110, 0.35)",
            borderRadius: "50px",
            padding: "8px 20px",
            marginBottom: "40px",
            fontSize: "13px",
            color: "#c8a96e",
            fontWeight: "600",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          <span style={{ fontSize: "16px" }}>🎁</span>
          Guide 100% Gratuit · Édition 2026
        </div>

        {/* Book Visual */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "220px",
              height: "280px",
            }}
          >
            {/* Book shadow */}
            <div
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "180px",
                height: "30px",
                background: "radial-gradient(ellipse, rgba(200, 169, 110, 0.3) 0%, transparent 70%)",
                filter: "blur(10px)",
              }}
            />
            {/* Book body */}
            <div
              style={{
                width: "200px",
                height: "270px",
                background: "linear-gradient(145deg, #1a1508, #0d0d15)",
                borderRadius: "4px 12px 12px 4px",
                border: "1px solid rgba(200, 169, 110, 0.4)",
                boxShadow:
                  "0 0 40px rgba(200, 169, 110, 0.15), inset 0 0 30px rgba(200, 169, 110, 0.05), -8px 8px 20px rgba(0,0,0,0.6)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Spine */}
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  bottom: "0",
                  width: "12px",
                  background: "linear-gradient(180deg, #c8a96e, #8a6d3e)",
                  borderRadius: "4px 0 0 4px",
                }}
              />
              {/* Decorative lines */}
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "12px",
                  right: "0",
                  height: "3px",
                  background: "linear-gradient(90deg, #c8a96e, transparent)",
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "12px",
                  right: "0",
                  height: "3px",
                  background: "linear-gradient(90deg, #c8a96e, transparent)",
                  opacity: 0.6,
                }}
              />
              {/* Icon */}
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "12px",
                  filter: "drop-shadow(0 0 12px rgba(200, 169, 110, 0.5))",
                }}
              >
                🤖
              </div>
              {/* Title on book */}
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  textAlign: "center",
                  color: "#c8a96e",
                  lineHeight: "1.4",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                Guide Pratique
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  textAlign: "center",
                  color: "#ffffff",
                  lineHeight: "1.4",
                  marginBottom: "12px",
                }}
              >
                Claude & IA Générative
              </div>
              <div
                style={{
                  width: "60px",
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
                  marginBottom: "12px",
                }}
              />
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "900",
                  color: "#c8a96e",
                  letterSpacing: "2px",
                }}
              >
                2026
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  fontSize: "9px",
                  color: "rgba(200, 169, 110, 0.6)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                AcadémIA Pro
              </div>
              {/* Pages effect */}
              <div
                style={{
                  position: "absolute",
                  right: "-6px",
                  top: "10px",
                  bottom: "10px",
                  width: "8px",
                  background: "repeating-linear-gradient(180deg, #e8e0d0 0px, #e8e0d0 1px, #d4c9b0 2px, #d4c9b0 3px)",
                  borderRadius: "0 2px 2px 0",
                  opacity: 0.8,
                }}
              />
            </div>
            {/* 50 pages badge */}
            <div
              style={{
                position: "absolute",
                top: "-15px",
                right: "-15px",
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(200, 169, 110, 0.4)",
              }}
            >
              <span style={{ fontSize: "16px", fontWeight: "900", color: "#050508", lineHeight: "1" }}>50</span>
              <span style={{ fontSize: "8px", fontWeight: "700", color: "#050508", letterSpacing: "0.5px" }}>PAGES</span>
            </div>
          </div>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: "900",
            lineHeight: "1.15",
            marginBottom: "24px",
            margin: "0 auto 24px",
            maxWidth: "800px",
          }}
        >
          Maîtrisez{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #c8a96e, #e8d4a8, #c8a96e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Claude & l'IA Générative
          </span>{" "}
          pour booster votre productivité en 2026
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "rgba(255,255,255,0.65)",
            lineHeight: "1.7",
            marginBottom: "48px",
            maxWidth: "620px",
            margin: "0 auto 48px",
          }}
        >
          Un guide de{" "}
          <strong style={{ color: "rgba(255,255,255,0.9)" }}>50 pages PDF</strong> avec les
          meilleures techniques de prompting, cas d'usage concrets et workflows
          pour professionnels — téléchargement immédiat et gratuit.
        </p>

        {/* Social Proof bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "64px",
          }}
        >
          {/* Avatars */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {["#c8a96e", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"].map(
              (color, i) => (
                <div
                  key={i}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: "2px solid #050508",
                    marginLeft: i === 0 ? "0" : "-10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#050508",
                    zIndex: 5 - i,
                    position: "relative",
                  }}
                >
                  {["M", "S", "J", "A", "L"][i]}
                </div>
              )
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ color: "#c8a96e", fontSize: "14px" }}>
                  ★
                </span>
              ))}
            </div>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>
              <strong style={{ color: "#c8a96e", fontWeight: "800" }}>1 247</strong>{" "}
              professionnels ont déjà téléchargé ce guide
            </span>
          </div>
        </div>
      </section>

      {/* Content + Form Section */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px 100px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "48px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "48px",
            alignItems: "start",
          }}
        >
          {/* What's inside */}
          <div>
            <h2
              style={{
                fontSize: "clamp(20px, 3vw, 28px)",
                fontWeight: "800",
                marginBottom: "32px",
                color: "#ffffff",
              }}
            >
              Ce que contient le guide{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #c8a96e, #e8d4a8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                50 pages
              </span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                {
                  icon: "🧠",
                  title: "Fondamentaux Claude 3.5+",
                  desc: "Comprendre l'architecture, les forces et limites du modèle pour l'exploiter au maximum.",
                },
                {
                  icon: "✍️",
                  title: "50 Prompts prêts à l'emploi",
                  desc: "Templates copiables pour rédaction, analyse, code, marketing et gestion de projet.",
                },
                {
                  icon: "⚡",
                  title: "Workflows d'automatisation",
                  desc: "Intégrer l'IA dans vos processus quotidiens pour gagner 3h minimum par jour.",
                },
                {
                  icon: "💼",
                  title: "Cas d'usage par métier",
                  desc: "Stratégies spécifiques pour consultants, développeurs, marketeurs et managers.",
                },
                {
                  icon: "🔐",
                  title: "Éthique & bonnes pratiques",
                  desc: "Utiliser l'IA responsablement tout en maximisant votre avantage compétitif
}}}