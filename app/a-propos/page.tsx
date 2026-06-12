"use client";
import { useState } from "react";

export default function AProposPage() {
  const [activeTab, setActiveTab] = useState("mission");

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "Georgia, serif", color: "#f0e6d3" }}>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 24px" }}>

        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <div style={{ display: "inline-block", backgroundColor: "#c8a96e", color: "#050508", fontSize: "11px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", padding: "6px 18px", borderRadius: "2px", marginBottom: "28px" }}>
            À PROPOS
          </div>
          <h1 style={{ fontSize: "52px", fontWeight: "300", letterSpacing: "2px", color: "#f0e6d3", margin: "0 0 24px 0", lineHeight: "1.2" }}>
            Qui sommes-nous
          </h1>
          <div style={{ width: "60px", height: "2px", backgroundColor: "#c8a96e", margin: "0 auto 28px auto" }}></div>
          <p style={{ fontSize: "18px", color: "#a09080", maxWidth: "620px", margin: "0 auto", lineHeight: "1.8", fontWeight: "300" }}>
            Une école nouvelle génération dédiée à l'intelligence artificielle, pensée pour tous ceux qui veulent comprendre, maîtriser et anticiper le monde de demain.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "0px", marginBottom: "64px", borderBottom: "1px solid #1a1a2e" }}>
          <button
            onClick={() => setActiveTab("mission")}
            style={{ backgroundColor: "transparent", border: "none", color: activeTab === "mission" ? "#c8a96e" : "#605040", fontSize: "13px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", padding: "16px 36px", cursor: "pointer", borderBottom: activeTab === "mission" ? "2px solid #c8a96e" : "2px solid transparent", transition: "color 0.3s" }}
          >
            Mission
          </button>
          <button
            onClick={() => setActiveTab("vision")}
            style={{ backgroundColor: "transparent", border: "none", color: activeTab === "vision" ? "#c8a96e" : "#605040", fontSize: "13px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", padding: "16px 36px", cursor: "pointer", borderBottom: activeTab === "vision" ? "2px solid #c8a96e" : "2px solid transparent", transition: "color 0.3s" }}
          >
            Vision
          </button>
          <button
            onClick={() => setActiveTab("chiffres")}
            style={{ backgroundColor: "transparent", border: "none", color: activeTab === "chiffres" ? "#c8a96e" : "#605040", fontSize: "13px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", padding: "16px 36px", cursor: "pointer", borderBottom: activeTab === "chiffres" ? "2px solid #c8a96e" : "2px solid transparent", transition: "color 0.3s" }}
          >
            Chiffres
          </button>
        </div>

        {activeTab === "mission" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-block", width: "4px", height: "40px", backgroundColor: "#c8a96e", verticalAlign: "middle", marginRight: "16px" }}></div>
              <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}>Notre Mission</span>
              <h2 style={{ fontSize: "38px", fontWeight: "300", color: "#f0e6d3", margin: "24px 0 20px 0", lineHeight: "1.3", letterSpacing: "1px" }}>
                Démocratiser la formation en intelligence artificielle
              </h2>
              <p style={{ fontSize: "16px", color: "#9080708", lineHeight: "1.9", marginBottom: "20px", color: "#a09080" }}>
                Nous croyons que l'IA ne doit pas rester le privilège des ingénieurs et des chercheurs. Notre mission est de rendre cette connaissance accessible à tous — entrepreneurs, créatifs, professionnels, étudiants.
              </p>
              <p style={{ fontSize: "16px", color: "#a09080", lineHeight: "1.9" }}>
                Chaque parcours est conçu pour transformer des concepts complexes en compétences concrètes, applicables immédiatement dans votre vie professionnelle.
              </p>
            </div>
            <div style={{ backgroundColor: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: "4px", padding: "48px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "3px", background: "linear-gradient(90deg, #c8a96e, transparent)" }}></div>
              <div style={{ fontSize: "64px", fontWeight: "100", color: "#c8a96e", opacity: "0.15", position: "absolute", top: "16px", right: "24px", lineHeight: "1" }}>IA</div>
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "13px", color: "#c8a96e", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Accessibilité</div>
                <p style={{ fontSize: "15px", color: "#a09080", lineHeight: "1.8", margin: "0" }}>Des formations pensées pour tous les niveaux, du débutant à l'expert confirmé.</p>
              </div>
              <div style={{ width: "40px", height: "1px", backgroundColor: "#1a1a2e", marginBottom: "32px" }}></div>
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "13px", color: "#c8a96e", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Praticité</div>
                <p style={{ fontSize: "15px", color: "#a09080", lineHeight: "1.8", margin: "0" }}>Chaque module est directement applicable à votre contexte professionnel réel.</p>
              </div>
              <div style={{ width: "40px", height: "1px", backgroundColor: "#1a1a2e", marginBottom: "32px" }}></div>
              <div>
                <div style={{ fontSize: "13px", color: "#c8a96e", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Progression</div>
                <p style={{ fontSize: "15px", color: "#a09080", lineHeight: "1.8", margin: "0" }}>Un chemin structuré pour monter en compétences à votre propre rythme.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "vision" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <div style={{ display: "inline-block", width: "4px", height: "40px", backgroundColor: "#c8a96e", verticalAlign: "middle", marginRight: "16px" }}></div>
              <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}>Notre Vision</span>
              <h2 style={{ fontSize: "38px", fontWeight: "300", color: "#f0e6d3", margin: "24px auto 20px auto", lineHeight: "1.3", letterSpacing: "1px", maxWidth: "680px" }}>
                Un agent IA disponible 24h/24 pour chaque apprenant
              </h2>
              <p style={{ fontSize: "16px", color: "#a09080", maxWidth: "620px", margin: "0 auto", lineHeight: "1.9" }}>
                Nous imaginons un futur où chaque apprenant dispose d'un assistant IA personnel, toujours disponible, capable de répondre à ses questions, de personnaliser son parcours et de l'accompagner à chaque étape de sa progression.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
              <div style={{ backgroundColor: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: "4px", padding: "36px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "0", left: "0", width: "3px", height: "100%", backgroundColor: "#c8a96e" }}></div>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>🤖</div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#f0e6d3", margin: "0 0 12px 0", letterSpacing: "1px" }}>Agent IA Personnel</h3>
                <p style={{ fontSize: "14px", color: "#a09080", lineHeight: "1.8", margin: "0" }}>Un compagnon d'apprentissage intelligent qui s'adapte à votre niveau et à vos objectifs.</p>
              </div>
              <div style={{ backgroundColor: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: "4px", padding: "36px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "0", left: "0", width: "3px", height: "100%", backgroundColor: "#c8a96e" }}></div>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏰</div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#f0e6d3", margin: "0 0 12px 0", letterSpacing: "1px" }}>Disponible 24h/24</h3>
                <p style={{ fontSize: "14px", color: "#a09080", lineHeight: "1.8", margin: "0" }}>Apprenez à votre rythme, quand vous voulez, où vous voulez, sans contrainte horaire.</p>
              </div>
              <div style={{ backgroundColor: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: "4px", padding: "36px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "0", left: "0", width: "3px", height: "100%", backgroundColor: "#c8a96e" }}></div>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>🎯</div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#f0e6d3", margin: "0 0 12px 0", letterSpacing: "1px" }}>Parcours Sur-Mesure</h3>
                <p style={{ fontSize: "14px", color: "#a09080", lineHeight: "1.8", margin: "0" }}>Des recommandations personnalisées basées sur vos progrès et vos ambitions.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "chiffres" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <div style={{ display: "inline-block", width: "4px", height: "40px", backgroundColor: "#c8a96e", verticalAlign: "middle", marginRight: "16px" }}></div>
              <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}>En Chiffres</span>
              <h2 style={{ fontSize: "38px", fontWeight: "300", color: "#f0e6d3", margin: "24px auto 20px auto", lineHeight: "1.3", letterSpacing: "1px" }}>
                L'école en données
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "48px" }}>
              <div style={{ backgroundColor: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: "4px", padding: "48px 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "2px", background: "linear-gradient(90deg, transparent, #c8a96e, transparent)" }}></div>
                <div style={{ fontSize: "72px", fontWeight: "100", color: "#c8a96e", lineHeight: "1", marginBottom: "8px" }}>131</div>
                <div style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", color: "#605040", marginBottom: "12px" }}>Formations</div>
                <p style={{ fontSize: "14px", color: "#a09080", lineHeight: "1.7", margin: "0" }}>Un catalogue complet couvrant tous les aspects de l'intelligence artificielle</p>
              </div>
              <div style={{ backgroundColor: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: "4px", padding: "48px 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "2px", background: "linear-gradient(90deg, transparent, #c8a96e, transparent)" }}></div>
                <div style={{ fontSize: "72px", fontWeight: "100", color: "#c8a96e", lineHeight: "1", marginBottom: "8px" }}>20</div>
                <div style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", color: "#605040", marginBottom: "12px" }}>Skills</div>
                <p style={{ fontSize: "14px", color: "#a09080", lineHeight: "1.7", margin: "0" }}>Des compétences concrètes et mesurables pour progresser sur le marché du travail</p>
              </div>
              <div style={{ backgroundColor: "#0d0d1a", border: "1px solid