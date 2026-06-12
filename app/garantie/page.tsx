import React from "react";
import { useState } from "react";

const App = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    orderNumber: "",
    reason: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const colors = {
    bg: "#050508",
    gold: "#c8a96e",
    goldLight: "#e8c98e",
    goldDark: "#a8894e",
    text: "#f0e6d3",
    textMuted: "#8a7a6a",
    cardBg: "#0d0d12",
    cardBorder: "#1a1a24",
    inputBg: "#080810",
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const navStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: "rgba(5, 5, 8, 0.95)",
    borderBottom: "1px solid " + colors.cardBorder,
    backdropFilter: "blur(10px)",
    padding: "0 40px",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const logoStyle = {
    fontSize: "22px",
    fontWeight: "700" as const,
    color: colors.gold,
    fontFamily: "Georgia, serif",
    letterSpacing: "2px",
    cursor: "pointer",
  };

  const navLinkStyle = (active: boolean) => ({
    color: active ? colors.gold : colors.textMuted,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Arial, sans-serif",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
    padding: "8px 16px",
    borderBottom: active ? "2px solid " + colors.gold : "2px solid transparent",
    transition: "all 0.2s",
  });

  const pageStyle = {
    background: colors.bg,
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    paddingTop: "70px",
  };

  const heroStyle = {
    background: "linear-gradient(135deg, #050508 0%, #0d0d18 50%, #050508 100%)",
    padding: "80px 40px",
    textAlign: "center" as const,
    borderBottom: "1px solid " + colors.cardBorder,
    position: "relative" as const,
    overflow: "hidden",
  };

  const heroBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(200, 169, 110, 0.1)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    borderRadius: "50px",
    padding: "8px 20px",
    marginBottom: "30px",
    color: colors.gold,
    fontSize: "13px",
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
  };

  const heroTitleStyle = {
    fontSize: "52px",
    fontWeight: "800" as const,
    color: colors.text,
    marginBottom: "20px",
    lineHeight: "1.1",
    fontFamily: "Georgia, serif",
  };

  const heroGoldStyle = {
    color: colors.gold,
    display: "block",
  };

  const heroSubStyle = {
    fontSize: "18px",
    color: colors.textMuted,
    maxWidth: "600px",
    margin: "0 auto 40px",
    lineHeight: "1.8",
  };

  const btnPrimaryStyle = {
    background: "linear-gradient(135deg, " + colors.gold + ", " + colors.goldDark + ")",
    color: colors.bg,
    border: "none",
    borderRadius: "8px",
    padding: "16px 36px",
    fontSize: "15px",
    fontWeight: "700" as const,
    cursor: "pointer",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
    marginRight: "16px",
  };

  const btnSecondaryStyle = {
    background: "transparent",
    color: colors.gold,
    border: "2px solid " + colors.gold,
    borderRadius: "8px",
    padding: "14px 36px",
    fontSize: "15px",
    fontWeight: "600" as const,
    cursor: "pointer",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
  };

  const sectionStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "80px 40px",
  };

  const sectionTitleStyle = {
    fontSize: "36px",
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: "center" as const,
    marginBottom: "12px",
    fontFamily: "Georgia, serif",
  };

  const sectionSubStyle = {
    color: colors.textMuted,
    textAlign: "center" as const,
    fontSize: "16px",
    marginBottom: "60px",
    lineHeight: "1.8",
  };

  const goldDividerStyle = {
    width: "60px",
    height: "3px",
    background: "linear-gradient(90deg, " + colors.gold + ", " + colors.goldDark + ")",
    margin: "16px auto 20px",
    borderRadius: "2px",
  };

  const cardStyle = {
    background: colors.cardBg,
    border: "1px solid " + colors.cardBorder,
    borderRadius: "16px",
    padding: "32px",
    flex: "1",
  };

  const cardIconStyle = {
    width: "60px",
    height: "60px",
    background: "rgba(200, 169, 110, 0.1)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    marginBottom: "20px",
  };

  const cardTitleStyle = {
    fontSize: "18px",
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: "12px",
  };

  const cardTextStyle = {
    color: colors.textMuted,
    fontSize: "14px",
    lineHeight: "1.8",
  };

  const stepStyle = (index: number) => ({
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
    padding: "32px",
    background: colors.cardBg,
    border: "1px solid " + colors.cardBorder,
    borderRadius: "16px",
    marginBottom: "16px",
  });

  const stepNumberStyle = {
    width: "50px",
    height: "50px",
    minWidth: "50px",
    background: "linear-gradient(135deg, " + colors.gold + ", " + colors.goldDark + ")",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "800" as const,
    color: colors.bg,
  };

  const formStyle = {
    background: colors.cardBg,
    border: "1px solid " + colors.cardBorder,
    borderRadius: "20px",
    padding: "48px",
    maxWidth: "700px",
    margin: "0 auto",
  };

  const inputStyle = {
    width: "100%",
    background: colors.inputBg,
    border: "1px solid " + colors.cardBorder,
    borderRadius: "10px",
    padding: "14px 18px",
    color: colors.text,
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "Arial, sans-serif",
  };

  const labelStyle = {
    display: "block",
    color: colors.gold,
    fontSize: "13px",
    fontWeight: "600" as const,
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
  };

  const fieldGroupStyle = {
    marginBottom: "24px",
  };

  const rowStyle = {
    display: "flex",
    gap: "20px",
  };

  const successStyle = {
    textAlign: "center" as const,
    padding: "60px 40px",
  };

  const checkIconStyle = {
    width: "80px",
    height: "80px",
    background: "rgba(200, 169, 110, 0.1)",
    border: "2px solid " + colors.gold,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    margin: "0 auto 24px",
  };

  const guaranteeBannerStyle = {
    background: "linear-gradient(135deg, rgba(200, 169, 110, 0.08), rgba(200, 169, 110, 0.03))",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "20px",
    padding: "48px",
    display: "flex",
    gap: "40px",
    alignItems: "center",
    maxWidth: "900px",
    margin: "0 auto",
  };

  const bigNumberStyle = {
    fontSize: "80px",
    fontWeight: "900" as const,
    color: colors.gold,
    lineHeight: "1",
    fontFamily: "Georgia, serif",
  };

  const renderHome = () => (
    <div>
      <div style={heroStyle}>
        <div style={heroBadgeStyle}>
          <span>★</span>
          <span>Protection Acheteur Premium</span>
        </div>
        <h1 style={heroTitleStyle}>
          Achetez en toute
          <span style={heroGoldStyle}>Confiance Absolue</span>
        </h1>
        <p style={heroSubStyle}>
          Nous croyons en nos produits. C'est pourquoi nous offrons une garantie satisfait ou remboursé de 30 jours, sans questions, sans conditions cachées.
        </p>
        <div>
          <button style={btnPrimaryStyle} onClick={() => setActiveSection("guarantee")}>
            Voir la garantie
          </button>
          <button style={btnSecondaryStyle} onClick={() => setActiveSection("comment")}>
            Comment ça marche
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Pourquoi nous faire confiance ?</h2>
        <div style={goldDividerStyle} />
        <p style={sectionSubStyle}>Trois piliers fondamentaux de notre engagement envers vous</p>

        <div style={{ display: "flex", gap: "24px" }}>
          <div style={cardStyle}>
            <div style={cardIconStyle}>🛡️</div>
            <h3 style={cardTitleStyle}>Garantie 30 jours</h3>
            <p style={cardTextStyle}>
              Profitez de 30 jours complets pour tester votre achat. Si vous n'êtes pas satisfait à 100%, nous vous remboursons intégralement.
            </p>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}>⚡</div>
            <h3 style={cardTitleStyle}>Remboursement rapide</h3>
            <p style={cardTextStyle}>
              Votre remboursement est traité en 3 à 5 jours ouvrables. Pas d'attente interminable, pas de procédures complexes.
            </p>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}>💬</div>
            <h3 style={cardTitleStyle}>Support dédié</h3>
            <p style={cardTextStyle}>
              Notre équipe est disponible 7j/7 pour répondre à vos questions et vous accompagner dans votre démarche.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGuarantee = () => (
    <div style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Garantie Satisfait ou Remboursé</h2>
      <div style={goldDividerStyle} />
      <p style={sectionSubStyle}>Notre promesse ferme et inconditionnelle</p>

      <div style={guaranteeBannerStyle}>
        <div style={{ textAlign: "center" as const, minWidth: "180px" }}>
          <div style={bigNumberStyle}>30</div>
          <div style={{ color: colors.gold, fontSize: "18px", fontWeight: "700" as const, letterSpacing: "3px", textTransform: "uppercase" as const }}>JOURS</div>
          <div style={{ color: colors.textMuted, fontSize: "13px", marginTop: "8px" }}>de garantie complète</div>
        </div>
        <div>
          <h3 style={{ fontSize: "24px", fontWeight: "700" as const, color: colors.text, marginBottom: "16px", fontFamily: "Georgia, serif" }}>
            Zéro risque pour vous
          </h3>
          <p style={{ color: colors.textMuted, lineHeight: "1.9", fontSize: "15px", marginBottom: "16px" }}>
            Nous sommes tellement confiants en la qualité de nos produits que nous vous offrons une garantie de remboursement total pendant 30 jours après votre achat. Aucune question gênante, aucune condition cachée.
          </p>
          <p style={{ color: colors.textMuted, lineHeight: "1.9", fontSize: "15px" }}>
            Si pour quelque raison que ce soit vous n'êtes pas pleinement satisfait, contactez-nous et nous vous remboursons le montant total de votre commande, frais de port inclus.
          </p>
        </div>
      </div>

      <div style={{ marginTop: "60px" }}>
        <h3 style={{ fontSize: "26px", fontWeight: "700" as const, color: colors.text, textAlign: "center" as const, marginBottom: "12px" }}>
          Ce que couvre notre garantie
        </h3>