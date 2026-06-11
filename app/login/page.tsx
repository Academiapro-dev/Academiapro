import React, { useState } from "react";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [googleHovered, setGoogleHovered] = useState(false);
  const [appleHovered, setAppleHovered] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#050508",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      padding: "20px",
    },
    card: {
      width: "100%",
      maxWidth: "420px",
      backgroundColor: "#0d0d14",
      borderRadius: "20px",
      padding: "48px 40px",
      border: "1px solid rgba(200, 169, 110, 0.15)",
      boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(200, 169, 110, 0.04)",
    },
    logoWrapper: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "32px",
    },
    logoCircle: {
      width: "52px",
      height: "52px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 20px rgba(200, 169, 110, 0.35)",
    },
    logoText: {
      color: "#050508",
      fontWeight: "700",
      fontSize: "20px",
      letterSpacing: "-0.5px",
    },
    heading: {
      color: "#ffffff",
      fontSize: "26px",
      fontWeight: "700",
      textAlign: "center",
      marginBottom: "6px",
      letterSpacing: "-0.5px",
    },
    subheading: {
      color: "rgba(255,255,255,0.4)",
      fontSize: "14px",
      textAlign: "center",
      marginBottom: "36px",
    },
    socialRow: {
      display: "flex",
      gap: "12px",
      marginBottom: "28px",
    },
    socialButton: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid rgba(200, 169, 110, 0.2)",
      backgroundColor: "rgba(200, 169, 110, 0.05)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    socialButtonHovered: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid rgba(200, 169, 110, 0.5)",
      backgroundColor: "rgba(200, 169, 110, 0.1)",
      color: "#c8a96e",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    dividerRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "28px",
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      backgroundColor: "rgba(200, 169, 110, 0.12)",
    },
    dividerText: {
      color: "rgba(255,255,255,0.3)",
      fontSize: "12px",
      fontWeight: "500",
      letterSpacing: "0.5px",
    },
    fieldWrapper: {
      marginBottom: "18px",
    },
    label: {
      display: "block",
      color: "rgba(255,255,255,0.6)",
      fontSize: "12px",
      fontWeight: "600",
      letterSpacing: "0.8px",
      textTransform: "uppercase" as const,
      marginBottom: "8px",
    },
    input: {
      width: "100%",
      padding: "14px 16px",
      backgroundColor: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(200, 169, 110, 0.15)",
      borderRadius: "12px",
      color: "#ffffff",
      fontSize: "15px",
      outline: "none",
      transition: "border-color 0.2s ease, background-color 0.2s ease",
      boxSizing: "border-box" as const,
    },
    inputFocused: {
      width: "100%",
      padding: "14px 16px",
      backgroundColor: "rgba(200, 169, 110, 0.06)",
      border: "1px solid rgba(200, 169, 110, 0.5)",
      borderRadius: "12px",
      color: "#ffffff",
      fontSize: "15px",
      outline: "none",
      transition: "border-color 0.2s ease, background-color 0.2s ease",
      boxSizing: "border-box" as const,
    },
    forgotRow: {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "28px",
      marginTop: "-8px",
    },
    forgotLink: {
      color: "#c8a96e",
      fontSize: "13px",
      textDecoration: "none",
      fontWeight: "500",
      opacity: 0.8,
      cursor: "pointer",
    },
    submitButton: {
      width: "100%",
      padding: "15px",
      background: submitHovered
        ? "linear-gradient(135deg, #d4b87e 0%, #b08848 100%)"
        : "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
      border: "none",
      borderRadius: "12px",
      color: "#050508",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      letterSpacing: "0.3px",
      transition: "all 0.2s ease",
      boxShadow: submitHovered
        ? "0 8px 30px rgba(200, 169, 110, 0.5)"
        : "0 4px 20px rgba(200, 169, 110, 0.3)",
      transform: submitHovered ? "translateY(-1px)" : "translateY(0)",
    },
    registerRow: {
      display: "flex",
      justifyContent: "center",
      gap: "4px",
      marginTop: "28px",
    },
    registerText: {
      color: "rgba(255,255,255,0.4)",
      fontSize: "14px",
    },
    registerLink: {
      color: "#c8a96e",
      fontSize: "14px",
      fontWeight: "600",
      textDecoration: "none",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logoWrapper}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>A</span>
          </div>
        </div>

        <h1 style={styles.heading}>Bon retour</h1>
        <p style={styles.subheading}>Connectez-vous à votre compte</p>

        <div style={styles.socialRow}>
          <button
            style={googleHovered ? styles.socialButtonHovered : styles.socialButton}
            onMouseEnter={() => setGoogleHovered(true)}
            onMouseLeave={() => setGoogleHovered(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <button
            style={appleHovered ? styles.socialButtonHovered : styles.socialButton}
            onMouseEnter={() => setAppleHovered(true)}
            onMouseLeave={() => setAppleHovered(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple
          </button>
        </div>

        <div style={styles.dividerRow}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>OU</span>
          <div style={styles.dividerLine}></div>
        </div>

        <div style={styles.fieldWrapper}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            placeholder="votre@email.com"
            style={emailFocused ? styles.inputFocused : styles.input}
          />
        </div>

        <div style={styles.fieldWrapper}>
          <label style={styles.label}>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            placeholder="••••••••"
            style={passwordFocused ? styles.inputFocused : styles.input}
          />
        </div>

        <div style={styles.forgotRow}>
          <a href="#" style={styles.forgotLink}>
            Mot de passe oublié ?
          </a>
        </div>

        <button
          style={styles.submitButton}
          onMouseEnter={() => setSubmitHovered(true)}
          onMouseLeave={() => setSubmitHovered(false)}
        >
          Se connecter
        </button>

        <div style={styles.registerRow}>
          <span style={styles.registerText}>Pas encore de compte ?</span>
          <a href="#" style={styles.registerLink}>
            S'inscrire
          </a>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;