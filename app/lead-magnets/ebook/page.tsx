import { useState } from "react";

export default function EbookLandingPage() {
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [metier, setMetier] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prenom && email && metier) {
      setSubmitted(true);
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    overflowX: "hidden",
  };

  const glowStyle: React.CSSProperties = {
    position: "fixed",
    top: "0",
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "400px",
    background: "radial-gradient(ellipse, rgba(200, 169, 110, 0.12) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  };

  const wrapperStyle: React.CSSProperties = {
    maxWidth: "680px",
    width: "100%",
    position: "relative",
    zIndex: 1,
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(200, 169, 110, 0.1)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    borderRadius: "100px",
    padding: "6px 16px",
    marginBottom: "32px",
    color: "#c8a96e",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  };

  const dotStyle: React.CSSProperties = {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#c8a96e",
    animation: "pulse 2s infinite",
  };

  const headlineStyle: React.CSSProperties = {
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.15",
    marginBottom: "8px",
    letterSpacing: "-0.02em",
  };

  const headlineGoldStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #c8a96e 0%, #e8d4a0 50%, #c8a96e 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "18px",
    color: "rgba(255,255,255,0.55)",
    marginBottom: "40px",
    lineHeight: "1.6",
    fontWeight: "400",
  };

  const bookCardStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "20px",
    padding: "32px",
    marginBottom: "32px",
    display: "flex",
    gap: "28px",
    alignItems: "flex-start",
    backdropFilter: "blur(10px)",
  };

  const bookCoverStyle: React.CSSProperties = {
    minWidth: "120px",
    height: "160px",
    background: "linear-gradient(145deg, #1a1508 0%, #2d2010 50%, #1a1508 100%)",
    border: "1px solid rgba(200, 169, 110, 0.4)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    boxShadow: "4px 4px 20px rgba(0,0,0,0.6), -1px -1px 0px rgba(200,169,110,0.1)",
    position: "relative",
    overflow: "hidden",
  };

  const bookSpineStyle: React.CSSProperties = {
    position: "absolute",
    left: "0",
    top: "0",
    bottom: "0",
    width: "4px",
    background: "linear-gradient(180deg, #c8a96e, #8a6a30)",
  };

  const bookTitleCoverStyle: React.CSSProperties = {
    color: "#c8a96e",
    fontSize: "10px",
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    lineHeight: "1.4",
    marginTop: "8px",
  };

  const bookYearStyle: React.CSSProperties = {
    color: "rgba(200,169,110,0.7)",
    fontSize: "18px",
    fontWeight: "800",
    marginTop: "8px",
  };

  const pagesTagStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    backgroundColor: "rgba(200,169,110,0.15)",
    border: "1px solid rgba(200,169,110,0.3)",
    borderRadius: "4px",
    padding: "2px 6px",
    color: "#c8a96e",
    fontSize: "9px",
    fontWeight: "700",
  };

  const bookInfoStyle: React.CSSProperties = {
    flex: 1,
  };

  const bookTitleStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "4px",
    lineHeight: "1.3",
  };

  const bookSubtitleStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#c8a96e",
    marginBottom: "16px",
    fontWeight: "500",
  };

  const featureListStyle: React.CSSProperties = {
    listStyle: "none",
    padding: "0",
    margin: "0",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const featureItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
  };

  const checkStyle: React.CSSProperties = {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "rgba(200,169,110,0.15)",
    border: "1px solid rgba(200,169,110,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "18px",
    color: "#c8a96e",
    fontSize: "10px",
    fontWeight: "700",
  };

  const downloadsBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "rgba(200,169,110,0.06)",
    border: "1px solid rgba(200,169,110,0.15)",
    borderRadius: "12px",
    padding: "14px 20px",
    marginBottom: "32px",
  };

  const downloadsNumberStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: "800",
    color: "#c8a96e",
  };

  const downloadsTextStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(255,255,255,0.5)",
    lineHeight: "1.4",
  };

  const avatarGroupStyle: React.CSSProperties = {
    display: "flex",
    marginRight: "4px",
  };

  const avatarStyle = (index: number): React.CSSProperties => ({
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "2px solid #050508",
    marginLeft: index === 0 ? "0" : "-8px",
    background: index === 0
      ? "linear-gradient(135deg, #c8a96e, #8a6a30)"
      : index === 1
      ? "linear-gradient(135deg, #7a9e7e, #4a6e4e)"
      : "linear-gradient(135deg, #6e7aa9, #3e4a7a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    color: "white",
    fontWeight: "700",
  });

  const formCardStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200, 169, 110, 0.25)",
    borderRadius: "20px",
    padding: "36px",
    backdropFilter: "blur(10px)",
  };

  const formTitleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "6px",
    textAlign: "center",
  };

  const formSubtitleStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    marginBottom: "28px",
  };

  const fieldGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const labelTextStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(200,169,110,0.2)",
    borderRadius: "10px",
    padding: "14px 16px",
    fontSize: "15px",
    color: "#ffffff",
    outline: "none",
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    backgroundColor: "rgba(10,8,4,0.95)",
    border: "1px solid rgba(200,169,110,0.2)",
    borderRadius: "10px",
    padding: "14px 16px",
    fontSize: "15px",
    color: "#ffffff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c8a96e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px",
    background: hoveredButton
      ? "linear-gradient(135deg, #d4b87a 0%, #c8a96e 100%)"
      : "linear-gradient(135deg, #c8a96e 0%, #a8894e 100%)",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    color: "#050508",
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "all 0.2s",
    boxShadow: hoveredButton
      ? "0 8px 32px rgba(200,169,110,0.4)"
      : "0 4px 20px rgba(200,169,110,0.25)",
    transform: hoveredButton ? "translateY(-1px)" : "translateY(0)",
  };

  const privacyStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
    marginTop: "16px",
    color: "rgba(255,255,255,0.3)",
    fontSize: "12px",
  };

  const successStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "40px 20px",
  };

  const successIconStyle: React.CSSProperties = {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.05))",
    border: "2px solid rgba(200,169,110,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: "28px",
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(200,169,110,0.2), transparent)",
    margin: "32px 0",
  };

  const socialProofStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "32px",
  };

  const statCardStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "16px 8px",
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(200,169,110,0.1)",
    borderRadius: "12px",
  };

  const statNumberStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "800",
    color: "#c8a96e",
    display: "block",
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(255,