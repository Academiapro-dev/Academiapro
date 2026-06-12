"use client";
import { useState } from "react";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [emailFocus, setEmailFocus] = useState(false);
  const [mdpFocus, setMdpFocus] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#0d0d14",
          borderRadius: "20px",
          border: "1px solid #1e1e2e",
          padding: "48px 40px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
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
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                fill="#050508"
              />
              <path
                d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z"
                fill="#050508"
              />
            </svg>
          </div>
          <h1
            style={{
              color: "#ffffff",
              fontSize: "26px",
              fontWeight: "700",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Connexion
          </h1>
          <p
            style={{
              color: "#6b6b8a",
              fontSize: "14px",
              margin: "0",
            }}
          >
            Bienvenue, connectez-vous à votre compte
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
          <button
            style={{
              width: "100%",
              padding: "13px 16px",
              backgroundColor: "#141420",
              border: "1px solid #2a2a3e",
              borderRadius: "12px",
              color: "#e0e0f0",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1c1c2e";
              e.currentTarget.style.borderColor = "#c8a96e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#141420";
              e.currentTarget.style.borderColor = "#2a2a3e";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuer avec Google
          </button>

          <button
            style={{
              width: "100%",
              padding: "13px 16px",
              backgroundColor: "#141420",
              border: "1px solid #2a2a3e",
              borderRadius: "12px",
              color: "#e0e0f0",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1c1c2e";
              e.currentTarget.style.borderColor = "#c8a96e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#141420";
              e.currentTarget.style.borderColor = "#2a2a3e";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Continuer avec Apple
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div style={{ flex: 1, height: "1px", backgroundColor: "#1e1e2e" }} />
          <span style={{ color: "#3a3a5c", fontSize: "12px", fontWeight: "500" }}>
            ou par email
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#1e1e2e" }} />
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                color: "#9090b0",
                fontSize: "13px",
                fontWeight: "600",
                letterSpacing: "0.3px",
              }}
            >
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              placeholder="vous@exemple.com"
              style={{
                padding: "13px 16px",
                backgroundColor: "#0a0a12",
                border: emailFocus ? "1px solid #c8a96e" : "1px solid #1e1e2e",
                borderRadius: "12px",
                color: "#e0e0f0",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                boxShadow: emailFocus ? "0 0 0 3px rgba(200,169,110,0.08)" : "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label
                style={{
                  color: "#9090b0",
                  fontSize: "13px",
                  fontWeight: "600",
                  letterSpacing: "0.3px",
                }}
              >
                Mot de passe
              </label>
              <a
                href="#"
                style={{
                  color: "#c8a96e",
                  fontSize: "12px",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                Mot de passe oublié ?
              </a>
            </div>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              onFocus={() => setMdpFocus(true)}
              onBlur={() => setMdpFocus(false)}
              placeholder="••••••••"
              style={{
                padding: "13px 16px",
                backgroundColor: "#0a0a12",
                border: mdpFocus ? "1px solid #c8a96e" : "1px solid #1e1e2e",
                borderRadius: "12px",
                color: "#e0e0f0",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                boxShadow: mdpFocus ? "0 0 0 3px rgba(200,169,110,0.08)" : "none",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: "8px",
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 100%)",
              border: "none",
              borderRadius: "12px",
              color: "#050508",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              letterSpacing: "0.2px",
              boxShadow: "0 4px 24px rgba(200,169,110,0.25)",
              transition: "opacity 0.2s, transform 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Se connecter
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "28px",
            color: "#6b6b8a",
            fontSize: "14px",
            margin: "28px 0 0 0",
          }}
        >
          Pas encore de compte ?{" "}
          <a
            href="#"
            style={{
              color: "#c8a96e",
              textDecoration: "none",
              fontWeight: "600",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  );
}