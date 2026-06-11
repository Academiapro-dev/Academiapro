import React, { useState } from "react";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    sujet: "",
    message: "",
  });

  const [focused, setFocused] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    padding: "14px 18px",
    backgroundColor: "rgba(200, 169, 110, 0.07)",
    border: focused === name ? "1.5px solid #c8a96e" : "1.5px solid rgba(200, 169, 110, 0.25)",
    borderRadius: "8px",
    color: "#f0e8d8",
    fontSize: "15px",
    fontFamily: "'Georgia', serif",
    outline: "none",
    transition: "border 0.3s ease, background-color 0.3s ease",
    boxSizing: "border-box",
    boxShadow: focused === name ? "0 0 12px rgba(200, 169, 110, 0.15)" : "none",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    color: "#c8a96e",
    fontSize: "13px",
    fontFamily: "'Georgia', serif",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  };

  const fieldGroup: React.CSSProperties = {
    marginBottom: "24px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "60px 20px 80px",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "60px", maxWidth: "640px" }}>
        <div
          style={{
            display: "inline-block",
            width: "50px",
            height: "2px",
            backgroundColor: "#c8a96e",
            marginBottom: "24px",
          }}
        />
        <h1
          style={{
            color: "#c8a96e",
            fontSize: "36px",
            fontWeight: "400",
            letterSpacing: "4px",
            textTransform: "uppercase",
            margin: "0 0 16px 0",
          }}
        >
          Contact
        </h1>
        <p
          style={{
            color: "rgba(240, 232, 216, 0.6)",
            fontSize: "15px",
            lineHeight: "1.8",
            margin: "0 0 8px 0",
          }}
        >
          Vous avez une question ou souhaitez en savoir plus ?
        </p>
        <p
          style={{
            color: "rgba(240, 232, 216, 0.5)",
            fontSize: "14px",
            margin: "0",
            letterSpacing: "0.5px",
          }}
        >
          Nous vous répondons sous{" "}
          <span style={{ color: "#c8a96e", fontStyle: "italic" }}>24 heures</span>
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          backgroundColor: "rgba(200, 169, 110, 0.04)",
          border: "1px solid rgba(200, 169, 110, 0.18)",
          borderRadius: "16px",
          padding: "48px 48px",
          boxSizing: "border-box",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
        }}
      >
        {sent ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                border: "2px solid #c8a96e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 28px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12l5 5L19 7"
                  stroke="#c8a96e"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              style={{
                color: "#c8a96e",
                fontSize: "22px",
                fontWeight: "400",
                letterSpacing: "2px",
                margin: "0 0 16px 0",
              }}
            >
              Message envoyé
            </h2>
            <p
              style={{
                color: "rgba(240, 232, 216, 0.6)",
                fontSize: "15px",
                lineHeight: "1.8",
                margin: "0 0 8px 0",
              }}
            >
              Merci de nous avoir contactés.
            </p>
            <p
              style={{
                color: "rgba(240, 232, 216, 0.5)",
                fontSize: "14px",
                margin: "0",
              }}
            >
              Notre équipe reviendra vers vous dans les{" "}
              <span style={{ color: "#c8a96e" }}>24 heures</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Nom & Prénom */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <div>
                <label style={labelStyle} htmlFor="nom">
                  Nom
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  placeholder="Votre nom"
                  value={formData.nom}
                  onChange={handleChange}
                  onFocus={() => setFocused("nom")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle("nom")}
                  required
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="prenom">
                  Prénom
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  placeholder="Votre prénom"
                  value={formData.prenom}
                  onChange={handleChange}
                  onFocus={() => setFocused("prenom")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle("prenom")}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div style={fieldGroup}>
              <label style={labelStyle} htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                style={inputStyle("email")}
                required
              />
            </div>

            {/* Sujet */}
            <div style={fieldGroup}>
              <label style={labelStyle} htmlFor="sujet">
                Sujet
              </label>
              <input
                id="sujet"
                name="sujet"
                type="text"
                placeholder="Objet de votre message"
                value={formData.sujet}
                onChange={handleChange}
                onFocus={() => setFocused("sujet")}
                onBlur={() => setFocused(null)}
                style={inputStyle("sujet")}
                required
              />
            </div>

            {/* Message */}
            <div style={fieldGroup}>
              <label style={labelStyle} htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Décrivez votre demande..."
                value={formData.message}
                onChange={handleChange}
                onFocus={() => setFocused("message")}
                onBlur={() => setFocused(null)}
                style={{
                  ...inputStyle("message"),
                  minHeight: "140px",
                  resize: "vertical",
                  lineHeight: "1.7",
                }}
                required
              />
            </div>

            {/* Bouton */}
            <div style={{ textAlign: "center" }}>
              <button
                type="submit"
                style={{
                  padding: "16px 56px",
                  backgroundColor: "transparent",
                  border: "1.5px solid #c8a96e",
                  borderRadius: "8px",
                  color: "#c8a96e",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#c8a96e";
                  (e.currentTarget as HTMLButtonElement).style.color = "#050508";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#c8a96e";
                }}
              >
                Envoyer
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Contact info */}
      <div
        style={{
          marginTop: "48px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="#c8a96e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <a
            href="mailto:contact@academiapro.fr"
            style={{
              color: "#c8a96e",
              fontSize: "14px",
              textDecoration: "none",
              letterSpacing: "0.5px",
            }}
          >
            contact@academiapro.fr
          </a>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#c8a96e" strokeWidth="1.5" />
            <path
              d="M12 6v6l4 2"
              stroke="#c8a96e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              color: "rgba(200, 169, 110, 0.6)",
              fontSize: "13px",
              letterSpacing: "0.5px",
            }}
          >
            Réponse sous 24 heures
          </span>
        </div>
      </div>

      {/* Séparateur bas */}
      <div
        style={{
          marginTop: "48px",
          display: "inline-block",
          width: "50px",
          height: "1px",
          backgroundColor: "rgba(200, 169, 110, 0.3)",
        }}
      />
    </div>
  );
};

export default ContactPage;