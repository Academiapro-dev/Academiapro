"use client";
import { useState } from "react";

export default function FormationsPage() {
  const [panier, setPanier] = useState([]);
  const [notification, setNotification] = useState("");

  const formations = [
    { id: "F128", titre: "Expert Claude", prix: 690, badge: "NOUVEAU", couleur: "#c8a96e" },
    { id: "F129", titre: "No-Code", prix: 790, badge: "POPULAIRE", couleur: "#a78bfa" },
    { id: "F130", titre: "Apps IA", prix: 990, badge: "PREMIUM", couleur: "#34d399" },
    { id: "F131", titre: "Marketing IA", prix: 890, badge: "TOP VENTE", couleur: "#f87171" },
    { id: "F001", titre: "Management", prix: 490, badge: "ESSENTIEL", couleur: "#60a5fa" },
    { id: "F003", titre: "Bien-être", prix: 390, badge: "ACCESSIBLE", couleur: "#fb923c" },
  ];

  const ajouterAuPanier = (formation) => {
    if (!panier.find((f) => f.id === formation.id)) {
      setPanier([...panier, formation]);
      setNotification(formation.titre + " ajouté au panier !");
      setTimeout(() => setNotification(""), 2500);
    }
  };

  const retirerDuPanier = (id) => {
    setPanier(panier.filter((f) => f.id !== id));
  };

  const total = panier.reduce((acc, f) => acc + f.prix, 0);
  const mensualite = Math.round(total / 3);

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: "#ffffff" }}>

      {/* NOTIFICATION */}
      {notification !== "" && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          backgroundColor: "#c8a96e",
          color: "#050508",
          padding: "14px 24px",
          borderRadius: "12px",
          fontWeight: "700",
          fontSize: "14px",
          zIndex: 9999,
          boxShadow: "0 8px 32px rgba(200,169,110,0.5)"
        }}>
          ✓ {notification}
        </div>
      )}

      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg, #0a0a12 0%, #111120 50%, #0a0a12 100%)",
        borderBottom: "1px solid rgba(200,169,110,0.2)",
        padding: "80px 24px 60px",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-block",
          backgroundColor: "rgba(200,169,110,0.12)",
          border: "1px solid rgba(200,169,110,0.4)",
          borderRadius: "100px",
          padding: "6px 20px",
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "2px",
          color: "#c8a96e",
          marginBottom: "28px",
          textTransform: "uppercase"
        }}>
          131 Formations Certifiantes
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 72px)",
          fontWeight: "900",
          margin: "0 0 16px 0",
          lineHeight: "1.1",
          background: "linear-gradient(135deg, #ffffff 0%, #c8a96e 50%, #ffffff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          AcadémIA Pro
        </h1>

        <p style={{
          fontSize: "clamp(16px, 2.5vw, 22px)",
          color: "rgba(255,255,255,0.6)",
          margin: "0 auto 40px",
          maxWidth: "600px",
          lineHeight: "1.6"
        }}>
          Maîtrisez l'intelligence artificielle avec des certifications reconnues par les professionnels
        </p>

        {/* BADGES GARANTIES */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "100px",
            padding: "8px 18px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.7)"
          }}>
            <span style={{ color: "#c8a96e", fontSize: "16px" }}>🛡️</span>
            Garantie 30 jours
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "100px",
            padding: "8px 18px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.7)"
          }}>
            <span style={{ color: "#c8a96e", fontSize: "16px" }}>💳</span>
            Paiement en 3x
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "100px",
            padding: "8px 18px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.7)"
          }}>
            <span style={{ color: "#c8a96e", fontSize: "16px" }}>🏆</span>
            Certification officielle
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 24px" }}>

        {/* TITRE SECTION */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: "800", margin: "0 0 12px 0", color: "#ffffff" }}>
            Formations en vedette
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", margin: "0" }}>
            Sélection premium pour développer vos compétences IA
          </p>
        </div>

        {/* GRILLE FORMATIONS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px",
          marginBottom: "60px"
        }}>
          {formations.map((f) => {
            const dansPanier = panier.find((p) => p.id === f.id);
            return (
              <div
                key={f.id}
                style={{
                  backgroundColor: "#0d0d1a",
                  border: dansPanier ? "1px solid " + f.couleur : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "20px",
                  padding: "32px",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s",
                  cursor: "default"
                }}
              >
                {/* FOND DECORATIF */}
                <div style={{
                  position: "absolute",
                  top: "-40px",
                  right: "-40px",
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  backgroundColor: f.couleur,
                  opacity: "0.06",
                  pointerEvents: "none"
                }} />

                {/* HEADER CARTE */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                  <div>
                    <span style={{
                      display: "inline-block",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      padding: "3px 10px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: "1px",
                      marginBottom: "10px"
                    }}>
                      {f.id}
                    </span>
                    <h3 style={{ margin: "0", fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>
                      {f.titre}
                    </h3>
                  </div>
                  <span style={{
                    backgroundColor: f.couleur + "22",
                    border: "1px solid " + f.couleur + "55",
                    color: f.couleur,
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "10px",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    whiteSpace: "nowrap"
                  }}>
                    {f.badge}
                  </span>
                </div>

                {/* BARRE COLOREE */}
                <div style={{
                  height: "3px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: "2px",
                  marginBottom: "24px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: "70%",
                    backgroundColor: f.couleur,
                    borderRadius: "2px"
                  }} />
                </div>

                {/* CERTIFICATION */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "24px"
                }}>
                  <span style={{ fontSize: "14px" }}>🎓</span>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                    Certification AcadémIA Pro incluse
                  </span>
                </div>

                {/* PRIX */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "38px", fontWeight: "900", color: "#ffffff" }}>
                      {f.prix}€
                    </span>
                    <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
                      ou {Math.round(f.prix / 3)}€/mois x3
                    </span>
                  </div>
                </div>

                {/* BOUTON */}
                <button
                  onClick={() => dansPanier ? retirerDuPanier(f.id) : ajouterAuPanier(f)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "700",
                    letterSpacing: "0.5px",
                    transition: "opacity 0.2s",
                    backgroundColor: dansPanier ? "rgba(200,169,110,0.15)" : f.couleur,
                    color: dansPanier ? f.couleur : "#050508",
                    border: dansPanier ? "1px solid " + f.couleur + "66" : "none"
                  }}
                >
                  {dansPanier ? "✓ Ajouté — Retirer" : "Ajouter au panier"}
                </button>
              </div>
            );
          })}
        </div>

        {/* PANIER */}
        {panier.length > 0 && (
          <div style={{
            backgroundColor: "#0d0d1a",
            border: "1px solid rgba(200,169,110,0.3)",
            borderRadius: "24px",
            padding: "40px",
            maxWidth: "800px",
            margin: "0 auto"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                backgroundColor: "rgba(200,169,110,0.15)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px"
              }}>
                🛒
              </div>
              <div>
                <h3 style={{ margin: "0", fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>
                  Votre sélection
                </h3>
                <p style={{ margin: "0", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                  {panier.length} formation{panier.length > 1 ? "s" : ""} sélectionnée{panier.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* LISTE PANIER */}
            <div style={{ marginBottom: "28px" }}>
              {panier.map((f, index) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 0",
                    borderBottom: index < panier.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: f.couleur + "22",
                      border: "1px solid " + f.couleur + "44",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "800",
                      color: f.couleur
                    }}>
                      {f.id.slice(0, 3)}
                    </div