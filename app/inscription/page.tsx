"use client";
import { useState } from "react";

export default function InscriptionPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [metier, setMetier] = useState("");
  const [focusField, setFocusField] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    console.log({ prenom, nom, email, motDePasse, metier });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 100%)",
              margin: "0 auto 20px auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "22px" }}>✦</span>
          </div>
          <h1
            style={{
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: "700",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Créer un compte
          </h1>
          <p
            style={{
              color: "#6b6b7a",
              fontSize: "15px",
              margin: "0",
            }}
          >
            Rejoignez-nous dès aujourd'hui
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            style={{
              flex: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "12px 16px",
              backgroundColor: "#0f0f14",
              border: "1px solid #1e1e28",
              borderRadius: "12px",
              color: "#e0e0e8",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={function(e) {
              e.currentTarget.style.backgroundColor = "#16161e";
              e.currentTarget.style.borderColor = "#2a2a38";
            }}
            onMouseLeave={function(e) {
              e.currentTarget.style.backgroundColor = "#0f0f14";
              e.currentTarget.style.borderColor = "#1e1e28";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          <button
            type="button"
            style={{
              flex: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "12px 16px",
              backgroundColor: "#0f0f14",
              border: "1px solid #1e1e28",
              borderRadius: "12px",
              color: "#e0e0e8",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            onMouseEnter={function(e) {
              e.currentTarget.style.backgroundColor = "#16161e";
              e.currentTarget.style.borderColor = "#2a2a38";
            }}
            onMouseLeave={function(e) {
              e.currentTarget.style.backgroundColor = "#0f0f14";
              e.currentTarget.style.borderColor = "#1e1e28";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Apple
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div style={{ flex: "1", height: "1px", backgroundColor: "#1a1a24" }} />
          <span style={{ color: "#3a3a4a", fontSize: "13px" }}>ou</span>
          <div style={{ flex: "1", height: "1px", backgroundColor: "#1a1a24" }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div style={{ flex: "1" }}>
              <label
                style={{
                  display: "block",
                  color: "#8888a0",
                  fontSize: "13px",
                  fontWeight: "500",
                  marginBottom: "6px",
                  letterSpacing: "0.3px",
                }}
              >
                Prénom
              </label>
              <input
                type="text"
                value={prenom}
                onChange={function(e) { setPrenom(e.target.value); }}
                onFocus={function() { setFocusField("prenom"); }}
                onBlur={function() { setFocusField(""); }}
                placeholder="Jean"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  backgroundColor: "#0a0a10",
                  border: focusField === "prenom" ? "1px solid #c8a96e" : "1px solid #1a1a24",
                  borderRadius: "10px",
                  color: "#e8e8f0",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
              />
            </div>
            <div style={{ flex: "1" }}>
              <label
                style={{
                  display: "block",
                  color: "#8888a0",
                  fontSize: "13px",
                  fontWeight: "500",
                  marginBottom: "6px",
                  letterSpacing: "0.3px",
                }}
              >
                Nom
              </label>
              <input
                type="text"
                value={nom}
                onChange={function(e) { setNom(e.target.value); }}
                onFocus={function() { setFocusField("nom"); }}
                onBlur={function() { setFocusField(""); }}
                placeholder="Dupont"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  backgroundColor: "#0a0a10",
                  border: focusField === "nom" ? "1px solid #c8a96e" : "1px solid #1a1a24",
                  borderRadius: "10px",
                  color: "#e8e8f0",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                color: "#8888a0",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "6px",
                letterSpacing: "0.3px",
              }}
            >
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={function(e) { setEmail(e.target.value); }}
              onFocus={function() { setFocusField("email"); }}
              onBlur={function() { setFocusField(""); }}
              placeholder="jean.dupont@email.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                backgroundColor: "#0a0a10",
                border: focusField === "email" ? "1px solid #c8a96e" : "1px solid #1a1a24",
                borderRadius: "10px",
                color: "#e8e8f0",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                color: "#8888a0",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "6px",
                letterSpacing: "0.3px",
              }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              value={motDePasse}
              onChange={function(e) { setMotDePasse(e.target.value); }}
              onFocus={function() { setFocusField("mdp"); }}
              onBlur={function() { setFocusField(""); }}
              placeholder="Minimum 8 caractères"
              style={{
                width: "100%",
                padding: "12px 14px",
                backgroundColor: "#0a0a10",
                border: focusField === "mdp" ? "1px solid #c8a96e" : "1px solid #1a1a24",
                borderRadius: "10px",
                color: "#e8e8f0",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                color: "#8888a0",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "6px",
                letterSpacing: "0.3px",
              }}
            >
              Métier
            </label>
            <select
              value={metier}
              onChange={function(e) { setMetier(e.target.value); }}
              onFocus={function() { setFocusField("metier"); }}
              onBlur={function() { setFocusField(""); }}
              style={{
                width: "100%",
                padding: "12px 14px",
                backgroundColor: "#0a0a10",
                border: focusField === "metier" ? "1px solid #c8a96e" : "1px solid #1a1a24",
                borderRadius: "10px",
                color: metier === "" ? "#3a3a52" : "#e8e8f0",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                cursor: "pointer",
                appearance: "none",
              }}
            >
              <option value="" disabled>Sélectionnez votre métier</option>
              <option value="developpeur" style={{ backgroundColor: "#0a0a10", color: "#e8e8f0" }}>Développeur</option>
              <option value="designer" style={{ backgroundColor: "#0a0a10", color: "#e8e8f0" }}>Designer</option>
              <option value="marketing" style={{ backgroundColor: "#0a0a10", color: "#e8e8f0" }}>Marketing</option>
              <option value="entrepreneur" style={{ backgroundColor: "#0a0a10", color: "#e8e8f0" }}>Entrepreneur</option>
              <option value="consultant" style={{ backgroundColor: "#0a0a10", color: "#e8e8f0" }}>Consultant</option>
              <option value