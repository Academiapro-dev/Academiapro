"use client";
import { useState } from "react";

export default function TarifsPage() {
  const [visioSelected, setVisioSelected] = useState(true);

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "Georgia, serif", padding: "60px 20px" }}>

      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 style={{ color: "#c8a96e", fontSize: "42px", fontWeight: "700", letterSpacing: "3px", marginBottom: "12px", textTransform: "uppercase" }}>
          Nos Formules
        </h1>
        <p style={{ color: "#a0a0b0", fontSize: "16px", maxWidth: "560px", margin: "0 auto", lineHeight: "1.7" }}>
          Choisissez le format qui correspond à votre rythme d apprentissage
        </p>

        <div style={{ display: "inline-flex", backgroundColor: "#0f0f1a", borderRadius: "50px", padding: "6px", marginTop: "36px", border: "1px solid #1e1e35" }}>
          <button
            onClick={() => setVisioSelected(true)}
            style={{
              backgroundColor: visioSelected ? "#c8a96e" : "transparent",
              color: visioSelected ? "#050508" : "#a0a0b0",
              border: "none",
              borderRadius: "40px",
              padding: "12px 32px",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            Visio
          </button>
          <button
            onClick={() => setVisioSelected(false)}
            style={{
              backgroundColor: visioSelected ? "transparent" : "#c8a96e",
              color: visioSelected ? "#a0a0b0" : "#050508",
              border: "none",
              borderRadius: "40px",
              padding: "12px 32px",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            Audio
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "28px", maxWidth: "1100px", margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>

        <div style={{ flex: "1", minWidth: "300px", maxWidth: "340px", backgroundColor: "#0b0b14", border: "1px solid #1e1e35", borderRadius: "20px", padding: "44px 36px", display: "flex", flexDirection: "column", gap: "0px" }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ backgroundColor: "#1a1a2e", color: "#c8a96e", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", padding: "6px 14px", borderRadius: "20px", border: "1px solid #2a2a45" }}>
              Starter
            </span>
          </div>
          <h2 style={{ color: "#ffffff", fontSize: "24px", fontWeight: "700", marginTop: "20px", marginBottom: "8px", letterSpacing: "1px" }}>
            E-Learning Premium
          </h2>
          <p style={{ color: "#606075", fontSize: "13px", lineHeight: "1.6", marginBottom: "32px" }}>
            Accès illimité aux modules vidéo, quiz interactifs et ressources pédagogiques à votre rythme.
          </p>

          <div style={{ marginBottom: "36px" }}>
            <span style={{ color: "#c8a96e", fontSize: "46px", fontWeight: "800", letterSpacing: "-1px" }}>
              {visioSelected ? "29" : "19"}
            </span>
            <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "700" }}>€</span>
            <span style={{ color: "#606075", fontSize: "14px", marginLeft: "6px" }}>/mois</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Accès à tous les modules vidéo HD</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Quiz et exercices interactifs</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Certificat de complétion</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Forum communautaire privé</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Mises à jour de contenu incluses</span>
            </div>
          </div>

          <button style={{ backgroundColor: "transparent", color: "#c8a96e", border: "2px solid #c8a96e", borderRadius: "50px", padding: "15px 28px", fontSize: "13px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", width: "100%", marginTop: "auto" }}>
            Commencer
          </button>
        </div>

        <div style={{ flex: "1", minWidth: "300px", maxWidth: "340px", backgroundColor: "#0d0b16", border: "2px solid #c8a96e", borderRadius: "20px", padding: "44px 36px", display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 0 60px rgba(200,169,110,0.12)" }}>
          <div style={{ position: "absolute", top: "-16px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#c8a96e", color: "#050508", fontSize: "11px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase", padding: "6px 20px", borderRadius: "20px", whiteSpace: "nowrap" }}>
            Le plus populaire
          </div>

          <div style={{ marginBottom: "8px" }}>
            <span style={{ backgroundColor: "rgba(200,169,110,0.15)", color: "#c8a96e", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(200,169,110,0.35)" }}>
              Pro
            </span>
          </div>
          <h2 style={{ color: "#ffffff", fontSize: "24px", fontWeight: "700", marginTop: "20px", marginBottom: "8px", letterSpacing: "1px" }}>
            Agent IA
          </h2>
          <p style={{ color: "#808095", fontSize: "13px", lineHeight: "1.6", marginBottom: "32px" }}>
            Un agent IA dédié répond à vos questions en temps réel, personnalise votre parcours et vous accompagne 24h/24.
          </p>

          <div style={{ marginBottom: "36px" }}>
            <span style={{ color: "#c8a96e", fontSize: "46px", fontWeight: "800", letterSpacing: "-1px" }}>
              {visioSelected ? "59" : "39"}
            </span>
            <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "700" }}>€</span>
            <span style={{ color: "#606075", fontSize: "14px", marginLeft: "6px" }}>/mois</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Tout le contenu E-Learning Premium</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Agent IA disponible 24h/24 7j/7</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Parcours adaptatif intelligent</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Analyses de progression détaillées</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Sessions de révision automatisées</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Support prioritaire par chat</span>
            </div>
          </div>

          <button style={{ backgroundColor: "#c8a96e", color: "#050508", border: "none", borderRadius: "50px", padding: "15px 28px", fontSize: "13px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", width: "100%", marginTop: "auto" }}>
            Choisir ce plan
          </button>
        </div>

        <div style={{ flex: "1", minWidth: "300px", maxWidth: "340px", backgroundColor: "#0b0b14", border: "1px solid #1e1e35", borderRadius: "20px", padding: "44px 36px", display: "flex", flexDirection: "column", gap: "0px" }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ backgroundColor: "#1a1a2e", color: "#c8a96e", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", padding: "6px 14px", borderRadius: "20px", border: "1px solid #2a2a45" }}>
              Elite
            </span>
          </div>
          <h2 style={{ color: "#ffffff", fontSize: "24px", fontWeight: "700", marginTop: "20px", marginBottom: "8px", letterSpacing: "1px" }}>
            Live Avatar IA
          </h2>
          <p style={{ color: "#606075", fontSize: "13px", lineHeight: "1.6", marginBottom: "32px" }}>
            Expérience immersive avec un avatar IA en temps réel. Interactions naturelles, expressions faciales et voix synthétique haute fidélité.
          </p>

          <div style={{ marginBottom: "36px" }}>
            <span style={{ color: "#c8a96e", fontSize: "46px", fontWeight: "800", letterSpacing: "-1px" }}>
              {visioSelected ? "79" : "55"}
            </span>
            <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "700" }}>€</span>
            <span style={{ color: "#606075", fontSize: "14px", marginLeft: "6px" }}>/mois</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Tout le contenu Agent IA Pro</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#c8a96e", fontSize: "16px", marginTop: "1px" }}>✦</span>
              <span style={{ color: "#b0b0c5", fontSize: "14px", lineHeight: "1.5" }}>Avatar IA interactif en temps réel</span>
            </div>
            <div style={{ display: "