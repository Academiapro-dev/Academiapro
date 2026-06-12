"use client";
import { useState } from "react";

export default function ContactPage() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [focusField, setFocusField] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setEnvoye(true);
  }

  const inputStyle = {
    width: "100%",
    padding: "14px 18px",
    backgroundColor: "#0d0d14",
    border: "1px solid #2a2a3a",
    borderRadius: "8px",
    color: "#f0e6d3",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Georgia, serif",
    transition: "border-color 0.3s",
  };

  const inputFocusStyle = {
    width: "100%",
    padding: "14px 18px",
    backgroundColor: "#0d0d14",
    border: "1px solid #c8a96e",
    borderRadius: "8px",
    color: "#f0e6d3",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Georgia, serif",
    transition: "border-color 0.3s",
  };

  const labelStyle = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    fontFamily: "Georgia, serif",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: "8px",
    fontWeight: "600",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "Georgia, serif",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "320px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          paddingTop: "80px",
          paddingBottom: "80px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            background: "radial-gradient(ellipse at center top, #1a1408 0%, #050508 70%)",
            zIndex: "0",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "600px",
            background: "radial-gradient(ellipse, rgba(200,169,110,0.06) 0%, transparent 70%)",
            zIndex: "0",
          }}
        />
        <div style={{ position: "relative", zIndex: "1", textAlign: "center" }}>
          <p
            style={{
              color: "#c8a96e",
              fontSize: "12px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              marginBottom: "20px",
              margin: "0 0 20px 0",
            }}
          >
            Nous sommes à votre écoute
          </p>
          <h1
            style={{
              color: "#f0e6d3",
              fontSize: "56px",
              fontWeight: "300",
              margin: "0 0 24px 0",
              letterSpacing: "2px",
              lineHeight: "1.1",
            }}
          >
            Contactez-nous
          </h1>
          <div
            style={{
              width: "60px",
              height: "1px",
              backgroundColor: "#c8a96e",
              margin: "0 auto 28px auto",
            }}
          />
          <p
            style={{
              color: "#8a7a6a",
              fontSize: "17px",
              lineHeight: "1.7",
              maxWidth: "520px",
              margin: "0 auto",
              fontStyle: "italic",
            }}
          >
            Notre équipe vous répondra dans les plus brefs délais.
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "60px 24px 100px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "60px",
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              backgroundColor: "#0a0a0f",
              border: "1px solid #1e1e2a",
              borderRadius: "16px",
              padding: "40px 32px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "rgba(200,169,110,0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <span style={{ color: "#c8a96e", fontSize: "20px" }}>✉</span>
            </div>
            <p
              style={{
                color: "#c8a96e",
                fontSize: "11px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                margin: "0 0 10px 0",
                fontWeight: "600",
              }}
            >
              Email
            </p>
            <p
              style={{
                color: "#f0e6d3",
                fontSize: "15px",
                margin: "0",
                lineHeight: "1.5",
              }}
            >
              contact@academiapro.fr
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#0a0a0f",
              border: "1px solid #1e1e2a",
              borderRadius: "16px",
              padding: "40px 32px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "rgba(200,169,110,0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <span style={{ color: "#c8a96e", fontSize: "20px" }}>⏱</span>
            </div>
            <p
              style={{
                color: "#c8a96e",
                fontSize: "11px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                margin: "0 0 10px 0",
                fontWeight: "600",
              }}
            >
              Délai de réponse
            </p>
            <p
              style={{
                color: "#f0e6d3",
                fontSize: "15px",
                margin: "0",
                lineHeight: "1.5",
              }}
            >
              Réponse garantie sous 24h ouvrées
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#0a0a0f",
              border: "1px solid #1e1e2a",
              borderRadius: "16px",
              padding: "40px 32px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "rgba(200,169,110,0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <span style={{ color: "#c8a96e", fontSize: "20px" }}>◈</span>
            </div>
            <p
              style={{
                color: "#c8a96e",
                fontSize: "11px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                margin: "0 0 10px 0",
                fontWeight: "600",
              }}
            >
              AcademiaPro
            </p>
            <p
              style={{
                color: "#8a7a6a",
                fontSize: "14px",
                margin: "0",
                lineHeight: "1.7",
                fontStyle: "italic",
              }}
            >
              Excellence et accompagnement personnalisé pour chaque étudiant.
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#0a0a0f",
            border: "1px solid #1e1e2a",
            borderRadius: "16px",
            padding: "52px 48px",
          }}
        >
          {envoye ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  backgroundColor: "rgba(200,169,110,0.1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 28px auto",
                  border: "1px solid rgba(200,169,110,0.3)",
                }}
              >
                <span style={{ color: "#c8a96e", fontSize: "30px" }}>✓</span>
              </div>
              <h2
                style={{
                  color: "#f0e6d3",
                  fontSize: "28px",
                  fontWeight: "300",
                  margin: "0 0 16px 0",
                  letterSpacing: "1px",
                }}
              >
                Message envoyé
              </h2>
              <p
                style={{
                  color: "#8a7a6a",
                  fontSize: "16px",
                  lineHeight: "1.7",
                  margin: "0 0 32px 0",
                  fontStyle: "italic",
                }}
              >
                Merci de nous avoir contactés. Nous vous répondrons à l'adresse{" "}
                <span style={{ color: "#c8a96e" }}>{email}</span> dans un délai de 24h ouvrées.
              </p>
              <button
                onClick={() => {
                  setEnvoye(false);
                  setNom("");
                  setPrenom("");
                  setEmail("");
                  setSujet("");
                  setMessage("");
                }}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #c8a96e",
                  color: "#c8a96e",
                  padding: "12px 32px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "Georgia, serif",
                }}
              >
                Nouveau message
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "40px" }}>
                <h2
                  style={{
                    color: "#f0e6d3",
                    fontSize: "28px",
                    fontWeight: "300",
                    margin: "0 0 10px 0",
                    letterSpacing: "1px",
                  }}
                >
                  Envoyez-nous un message
                </h2>
                <div
                  style={{
                    width: "40px",
                    height: "1px",
                    backgroundColor: "#c8a96e",
                    margin: "0",
                  }}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Nom</label>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      onFocus={() => setFocusField("nom")}
                      onBlur={() => setFocusField("")}
                      placeholder="Votre nom"
                      required
                      style={focusField === "nom" ? inputFocusStyle : inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Prénom</label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      onFocus={() => setFocusField("prenom")}
                      onBlur={() => setFocusField("")}
                      placeholder="Votre prénom"
                      required
                      style={focusField === "prenom" ? inputFocusStyle : inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={labelStyle}>Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusField("email")}
                    onBlur={() => setFocusField("")}
                    placeholder="votre@email.com"
                    required
                    style={focusField === "email" ? inputFocusStyle : inputStyle}
                  />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={labelStyle}>Sujet</label>
                  <input
                    type="text"
                    value={sujet}
                    onChange={(e) => setSujet(e.target.value)}
                    onFocus={() => setFocusField("sujet")}
                    onBlur={() => setFocusField("")}
                    placeholder="Objet de votre demande"
                    required
                    style={focusField === "sujet" ? inputFocusStyle : inputStyle}
                  />
                </div>

                <div style={{ marginBottom: "36px" }}>
                  <label style={labelStyle}>Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => setFocusField("message")}
                    onBlur={() => setFocusField("")}
                    placeholder="Décrivez votre demande en détail..."
                    required
                    rows={6}
                    style={
                      focusField === "message"
                        ? {
                            width: "100%",
                            padding: "14px 18px",