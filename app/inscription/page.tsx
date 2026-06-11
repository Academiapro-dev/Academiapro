export default function RegisterPage() {
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: "40px 20px",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#0d0d14",
    borderRadius: "24px",
    border: "1px solid rgba(200, 169, 110, 0.15)",
    padding: "48px 40px",
    boxShadow: "0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(200, 169, 110, 0.04)",
  };

  const logoContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px",
    gap: "10px",
  };

  const logoIconStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #c8a96e, #a8843e)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "800",
    color: "#050508",
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  };

  const logoSpanStyle: React.CSSProperties = {
    color: "#c8a96e",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "rgba(200, 169, 110, 0.1)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    color: "#c8a96e",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "4px 10px",
    borderRadius: "20px",
    marginLeft: "8px",
    verticalAlign: "middle",
  };

  const headingStyle: React.CSSProperties = {
    textAlign: "center",
    marginTop: "28px",
    marginBottom: "6px",
    fontSize: "26px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.5px",
  };

  const subHeadingStyle: React.CSSProperties = {
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: "14px",
    marginBottom: "36px",
    lineHeight: "1.5",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    marginBottom: "0px",
  };

  const fieldGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    marginBottom: "16px",
    flex: 1,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    marginBottom: "8px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "13px 16px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
    width: "100%",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c8a96e' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    paddingRight: "40px",
  };

  const dividerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "24px 0",
  };

  const dividerLineStyle: React.CSSProperties = {
    flex: 1,
    height: "1px",
    backgroundColor: "rgba(255,255,255,0.07)",
  };

  const dividerTextStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.3)",
    fontSize: "12px",
    whiteSpace: "nowrap",
    fontWeight: "500",
  };

  const socialButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 20px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.03)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "12px",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
  };

  const primaryButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "15px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #c8a96e, #a8843e)",
    color: "#050508",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.3px",
    marginTop: "8px",
    transition: "opacity 0.2s ease, transform 0.1s ease",
    boxShadow: "0 8px 24px rgba(200, 169, 110, 0.25)",
  };

  const footerTextStyle: React.CSSProperties = {
    textAlign: "center",
    marginTop: "28px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.4)",
  };

  const linkStyle: React.CSSProperties = {
    color: "#c8a96e",
    textDecoration: "none",
    fontWeight: "600",
    marginLeft: "4px",
  };

  const termsStyle: React.CSSProperties = {
    textAlign: "center",
    fontSize: "11px",
    color: "rgba(255,255,255,0.25)",
    marginTop: "20px",
    lineHeight: "1.6",
  };

  const termsLinkStyle: React.CSSProperties = {
    color: "rgba(200, 169, 110, 0.6)",
    textDecoration: "underline",
    cursor: "pointer",
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(200, 169, 110, 0.5)";
    e.target.style.backgroundColor = "rgba(200, 169, 110, 0.04)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.08)";
    e.target.style.backgroundColor = "rgba(255,255,255,0.04)";
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>, hover: boolean) => {
    const btn = e.currentTarget;
    btn.style.opacity = hover ? "0.9" : "1";
    btn.style.transform = hover ? "translateY(-1px)" : "translateY(0)";
  };

  const handleSocialHover = (e: React.MouseEvent<HTMLButtonElement>, hover: boolean) => {
    const btn = e.currentTarget;
    btn.style.backgroundColor = hover ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)";
    btn.style.borderColor = hover ? "rgba(200, 169, 110, 0.25)" : "rgba(255,255,255,0.09)";
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoContainerStyle}>
          <div style={logoIconStyle}>A</div>
          <span style={logoTextStyle}>
            Académ<span style={logoSpanStyle}>IA</span>
          </span>
          <span style={badgeStyle}>Pro</span>
        </div>

        <h1 style={headingStyle}>Créer votre compte</h1>
        <p style={subHeadingStyle}>
          Rejoignez des milliers de professionnels qui<br />
          accélèrent leur carrière avec l&apos;IA
        </p>

        <button
          style={socialButtonStyle}
          onMouseEnter={(e) => handleSocialHover(e, true)}
          onMouseLeave={(e) => handleSocialHover(e, false)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.337 17.64 11.952 17.64 9.2z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>

        <button
          style={socialButtonStyle}
          onMouseEnter={(e) => handleSocialHover(e, true)}
          onMouseLeave={(e) => handleSocialHover(e, false)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <path d="M12.584 0c.173 1.548-.447 3.07-1.34 4.177-.894 1.107-2.32 1.97-3.75 1.858-.202-1.52.47-3.1 1.32-4.13C9.698.837 11.213.07 12.584 0zM17.07 13.3c-.56 1.24-1.23 2.37-2.16 3.22-.77.7-1.6 1.48-2.73 1.48-1.1 0-1.46-.68-2.72-.68-1.29 0-1.7.7-2.75.7-1.08 0-1.87-.74-2.68-1.48C2.6 15.3 1.41 12.86 1.08 10.3.64 7.08 1.64 4.5 3.35 2.93c1.15-1.05 2.73-1.73 4.23-1.73 1.17 0 2.2.71 2.96.71.73 0 2.1-.8 3.5-.68.6.02 2.27.24 3.34 1.82-.09.06-2 1.16-1.98 3.46.02 2.76 2.42 3.67 2.46 3.7-.03.09-.38 1.31-1.8 3.09z"/>
          </svg>
          Continuer avec Apple
        </button>

        <div style={dividerStyle}>
          <div style={dividerLineStyle} />
          <span style={dividerTextStyle}>ou créer avec votre email</span>
          <div style={dividerLineStyle} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={rowStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Prénom</label>
              <input
                type="text"
                placeholder="Marie"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Nom</label>
              <input
                type="text"
                placeholder="Dupont"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Adresse email</label>
            <input
              type="email"
              placeholder="marie.dupont@exemple.com"
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              placeholder="8 caractères minimum"
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}