import { useState } from "react";

const gold = "#c8a96e";
const dark = "#050508";
const darkCard = "#0d0d14";
const darkBorder = "#1a1a2e";

export default function MiniCours() {
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [metier, setMetier] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState("");

  const jours = [
    {
      numero: "01",
      titre: "Le Prompt Parfait",
      description:
        "Apprenez à formuler des prompts précis qui donnent des résultats professionnels dès la première tentative.",
      icone: "✦",
    },
    {
      numero: "02",
      titre: "Automatiser vos Tâches",
      description:
        "Créez vos premiers flux automatisés et gagnez 2h par jour sur vos tâches répétitives.",
      icone: "⟳",
    },
    {
      numero: "03",
      titre: "Votre Agent IA",
      description:
        "Construisez un agent IA qui travaille pour vous, même quand vous dormez.",
      icone: "◈",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prenom && email && metier) {
      setSubmitted(true);
    }
  };

  const inputStyle = (name: string) => ({
    width: "100%",
    padding: "14px 18px",
    background: focused === name ? "#0f0f1a" : "#080810",
    border: focused === name ? "1px solid " + gold : "1px solid " + darkBorder,
    borderRadius: "8px",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark,
        fontFamily:
          "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#fff",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid " + darkBorder,
          padding: "18px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: gold,
            fontSize: "13px",
            letterSpacing: "3px",
            textTransform: "uppercase" as const,
            fontWeight: 600,
          }}
        >
          IA Maîtrise
        </span>
      </div>

      {/* Hero */}
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "72px 24px 40px",
          textAlign: "center" as const,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(200,169,110,0.08)",
            border: "1px solid rgba(200,169,110,0.25)",
            borderRadius: "100px",
            padding: "6px 18px",
            fontSize: "12px",
            letterSpacing: "2px",
            textTransform: "uppercase" as const,
            color: gold,
            marginBottom: "32px",
            fontWeight: 600,
          }}
        >
          100% Gratuit · 3 Jours · 15 min/jour
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 56px)",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: "0 0 24px",
            letterSpacing: "-1px",
          }}
        >
          Maîtrisez l{"'"}IA en
          <br />
          <span style={{ color: gold }}>3 jours chrono</span>
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.7,
            margin: "0 0 48px",
            maxWidth: "520px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Un mini-cours intensif pour passer de débutant à opérationnel.
          Prompts, automatisation, agents — tout en 45 minutes.
        </p>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "48px",
            marginBottom: "64px",
            flexWrap: "wrap" as const,
          }}
        >
          {[
            { val: "3", label: "Jours" },
            { val: "15min", label: "Par jour" },
            { val: "0€", label: "Gratuit" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" as const }}>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: gold,
                  lineHeight: 1,
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                  marginTop: "4px",
                  letterSpacing: "1px",
                  textTransform: "uppercase" as const,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Programme */}
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <p
          style={{
            textAlign: "center" as const,
            fontSize: "12px",
            letterSpacing: "3px",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,0.3)",
            marginBottom: "40px",
          }}
        >
          Le Programme
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {jours.map((jour, i) => (
            <div
              key={i}
              style={{
                background: darkCard,
                border: "1px solid " + darkBorder,
                borderRadius: "16px",
                padding: "32px 28px",
                position: "relative" as const,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute" as const,
                  top: "24px",
                  right: "24px",
                  fontSize: "28px",
                  color: "rgba(200,169,110,0.15)",
                  fontWeight: 800,
                }}
              >
                {jour.numero}
              </div>

              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "rgba(200,169,110,0.08)",
                  border: "1px solid rgba(200,169,110,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  marginBottom: "20px",
                  color: gold,
                }}
              >
                {jour.icone}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "2px",
                  color: gold,
                  textTransform: "uppercase" as const,
                  marginBottom: "10px",
                  fontWeight: 600,
                }}
              >
                Jour {i + 1}
              </div>

              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "12px",
                  color: "#fff",
                }}
              >
                {jour.titre}
              </h3>

              <p
                style={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {jour.description}
              </p>

              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: gold,
                    opacity: 0.7,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  15 minutes
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "0 24px 100px",
        }}
      >
        <div
          style={{
            background: darkCard,
            border: "1px solid " + darkBorder,
            borderRadius: "20px",
            padding: "40px 36px",
          }}
        >
          {!submitted ? (
            <>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  textAlign: "center" as const,
                }}
              >
                Rejoindre le mini-cours
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.4)",
                  textAlign: "center" as const,
                  marginBottom: "32px",
                }}
              >
                Accès immédiat. Gratuit. Sans CB.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      letterSpacing: "1px",
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase" as const,
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    onFocus={() => setFocused("prenom")}
                    onBlur={() => setFocused("")}
                    placeholder="Votre prénom"
                    required
                    style={inputStyle("prenom")}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      letterSpacing: "1px",
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase" as const,
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    placeholder="votre@email.com"
                    required
                    style={inputStyle("email")}
                  />
                </div>

                <div style={{ marginBottom: "28px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      letterSpacing: "1px",
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase" as const,
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Votre métier
                  </label>
                  <input
                    type="text"
                    value={metier}
                    onChange={(e) => setMetier(e.target.value)}
                    onFocus={() => setFocused("metier")}
                    onBlur={() => setFocused("")}
                    placeholder="Ex: Consultant, Designer, Coach..."
                    required
                    style={inputStyle("metier")}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: gold,
                    color: dark,
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: "0.5px",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background =
                      "#d4b87a";
                    (e.target as HTMLButtonElement).style.transform =
                      "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = gold;
                    (e.target as HTMLButtonElement).style.transform =
                      "translateY(0)";
                  }}
                >
                  Démarrer le mini-cours →
                </button>

                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.25)",
                    textAlign: "center" as const,
                    marginTop: "16px",
                    marginBottom: 0,
                  }}
                >
                  Pas de spam. Désabonnement en 1 clic.
                </p>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: "rgba(200,169,110,0.1)",
                  border: "1px solid rgba(200,169,110,0.3)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",