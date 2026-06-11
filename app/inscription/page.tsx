import React, { useState } from "react";

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    motDePasse: "",
    metier: "",
  });

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#050508",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      padding: "24px",
    },
    card: {
      backgroundColor: "#0e0e14",
      border: "1px solid #1e1e2e",
      borderRadius: "20px",
      padding: "48px 40px",
      width: "100%",
      maxWidth: "460px",
      boxShadow: "0 0 60px rgba(200,169,110,0.08), 0 20px 60px rgba(0,0,0,0.6)",
    },
    logoWrapper: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "8px",
    },
    logoIcon: {
      width: "44px",
      height: "44px",
      backgroundColor: "#c8a96e",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: {
      color: "#050508",
      fontWeight: "800",
      fontSize: "20px",
      letterSpacing: "-0.5px",
    },
    title: {
      color: "#ffffff",
      fontSize: "26px",
      fontWeight: "700",
      textAlign: "center",
      marginBottom: "6px",
      marginTop: "20px",
      letterSpacing: "-0.5px",
    },
    subtitle: {
      color: "#6b6b80",
      fontSize: "14px",
      textAlign: "center",
      marginBottom: "32px",
    },
    socialRow: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
    },
    socialButton: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px",
      backgroundColor: "#16161f",
      border: "1px solid #2a2a3a",
      borderRadius: "12px",
      color: "#d0d0e0",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    socialButtonHover: {
      backgroundColor: "#1e1e2e",
      borderColor: "#c8a96e",
      color: "#ffffff",
    },
    dividerRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "24px",
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      backgroundColor: "#1e1e2e",
    },
    dividerText: {
      color: "#6b6b80",
      fontSize: "12px",
      whiteSpace: "nowrap" as const,
    },
    row: {
      display: "flex",
      gap: "14px",
    },
    fieldWrapper: {
      marginBottom: "16px",
      flex: 1,
    },
    label: {
      display: "block",
      color: "#9090a8",
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "6px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.6px",
    },
    input: {
      width: "100%",
      backgroundColor: "#16161f",
      border: "1px solid #2a2a3a",
      borderRadius: "10px",
      padding: "12px 14px",
      color: "#ffffff",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.2s ease",
      boxSizing: "border-box" as const,
    },
    select: {
      width: "100%",
      backgroundColor: "#16161f",
      border: "1px solid #2a2a3a",
      borderRadius: "10px",
      padding: "12px 14px",
      color: "#ffffff",
      fontSize: "14px",
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box" as const,
      appearance: "none" as const,
    },
    submitButton: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#c8a96e",
      border: "none",
      borderRadius: "12px",
      color: "#050508",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      marginTop: "8px",
      marginBottom: "24px",
      letterSpacing: "0.2px",
      transition: "all 0.2s ease",
    },
    submitButtonHover: {
      backgroundColor: "#d4b87a",
      boxShadow: "0 4px 20px rgba(200,169,110,0.35)",
      transform: "translateY(-1px)",
    },
    loginRow: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "6px",
    },
    loginText: {
      color: "#6b6b80",
      fontSize: "14px",
    },
    loginLink: {
      color: "#c8a96e",
      fontSize: "14px",
      fontWeight: "600",
      textDecoration: "none",
      cursor: "pointer",
    },
    terms: {
      color: "#4a4a60",
      fontSize: "11px",
      textAlign: "center" as const,
      marginTop: "20px",
      lineHeight: "1.6",
    },
    termsLink: {
      color: "#c8a96e",
      textDecoration: "none",
    },
  };

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const getInputStyle = (name: string): React.CSSProperties => ({
    ...styles.input,
    borderColor: focusedField === name ? "#c8a96e" : "#2a2a3a",
    boxShadow: focusedField === name ? "0 0 0 3px rgba(200,169,110,0.1)" : "none",
  });

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logoWrapper}>
          <div style={styles.logoIcon}>
            <span style={styles.logoText}>A</span>
          </div>
        </div>

        <h1 style={styles.title}>Créer un compte</h1>
        <p style={styles.subtitle}>Rejoignez des milliers de professionnels</p>

        <div style={styles.socialRow}>
          <button
            style={
              hoveredButton === "google"
                ? { ...styles.socialButton, ...styles.socialButtonHover }
                : styles.socialButton
            }
            onMouseEnter={() => setHoveredButton("google")}
            onMouseLeave={() => setHoveredButton(null)}
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
            style={
              hoveredButton === "apple"
                ? { ...styles.socialButton, ...styles.socialButtonHover }
                : styles.socialButton
            }
            onMouseEnter={() => setHoveredButton("apple")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple
          </button>
        </div>

        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>ou continuer avec email</span>
          <div style={styles.dividerLine} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.fieldWrapper}>
              <label style={styles.label} htmlFor="prenom">Prénom</label>
              <input
                id="prenom"
                name="prenom"
                type="text"
                placeholder="Jean"
                value={formData.prenom}
                onChange={handleChange}
                onFocus={() => setFocusedField("prenom")}
                onBlur={() => setFocusedField(null)}
                style={getInputStyle("prenom")}
                required
              />
            </div>
            <div style={styles.fieldWrapper}>
              <label style={styles.label} htmlFor="nom">Nom</label>
              <input
                id="nom"
                name="nom"
                type="text"
                placeholder="Dupont"
                value={formData.nom}
                onChange={handleChange}
                onFocus={() => setFocusedField("nom")}
                onBlur={() => setFocusedField(null)}
                style={getInputStyle("nom")}
                required
              />
            </div>
          </div>

          <div style={styles.fieldWrapper}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="jean.dupont@email.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("email")}
              required
            />
          </div>

          <div style={styles.fieldWrapper}>
            <label style={styles.label} htmlFor="motDePasse">Mot de passe</label>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              placeholder="Minimum 8 caractères"
              value={formData.motDePasse}
              onChange={handleChange}
              onFocus={() => setFocusedField("motDePasse")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("motDePasse")}
              required
            />
          </div>

          <div style={styles.fieldWrapper}>
            <label style={styles.label} htmlFor="metier">Métier</label>
            <select
              id="metier"
              name="metier"
              value={formData.metier}
              onChange={handleChange}
              onFocus={() => setFocusedField("metier")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.select,
                borderColor: focusedField === "metier" ? "#c8a96e" : "#2a2a3a",
                boxShadow: focusedField === "metier" ? "0 0 0 3px rgba(200,169,110,0.1)" : "none",
              }}
              required
            >
              <option value="" disabled>Sélectionnez votre métier</option>
              <option value="developpeur">Développeur</option>
              <option value="designer">Designer</option>
              <option value="product_manager">Product Manager</option>
              <option value="marketing">Marketing</option>
              <option value="finance">Finance</option>
              <option value="consultant">Consultant</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="ingenieur">