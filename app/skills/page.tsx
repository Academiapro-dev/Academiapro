"use client";
import { useState } from "react";

export default function SkillsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const skills = [
    { id: "SK01", name: "Machine Learning Fondamentaux", category: "ia", price: 97, desc: "Algorithmes supervisés et non supervisés" },
    { id: "SK02", name: "Deep Learning & Réseaux de Neurones", category: "ia", price: 97, desc: "CNN, RNN, Transformers" },
    { id: "SK03", name: "Natural Language Processing", category: "ia", price: 97, desc: "Traitement du langage naturel avancé" },
    { id: "SK04", name: "Computer Vision", category: "ia", price: 97, desc: "Détection et reconnaissance d'images" },
    { id: "SK05", name: "Prompt Engineering", category: "ia", price: 97, desc: "Maîtrise des LLMs et GPT" },
    { id: "SK06", name: "Data Science & Analyse", category: "ia", price: 97, desc: "Python, Pandas, visualisation" },
    { id: "SK07", name: "MLOps & Déploiement", category: "ia", price: 97, desc: "Pipeline ML en production" },
    { id: "SK08", name: "IA Générative", category: "ia", price: 97, desc: "DALL-E, Stable Diffusion, Midjourney" },
    { id: "SK09", name: "Automatisation IA", category: "ia", price: 97, desc: "Workflows intelligents no-code" },
    { id: "SK10", name: "Éthique & IA Responsable", category: "ia", price: 97, desc: "Biais, fairness, gouvernance IA" },
    { id: "SK11", name: "Stratégie Digitale", category: "business", price: 97, desc: "Transformation numérique d'entreprise" },
    { id: "SK12", name: "Marketing IA-Driven", category: "business", price: 97, desc: "Campagnes augmentées par l'IA" },
    { id: "SK13", name: "Finance & Investissement", category: "business", price: 97, desc: "Analyse financière et ROI" },
    { id: "SK14", name: "Leadership & Management", category: "business", price: 97, desc: "Diriger les équipes tech" },
    { id: "SK15", name: "Entrepreneuriat Tech", category: "business", price: 97, desc: "Créer et scaler une startup IA" },
    { id: "SK16", name: "Mindfulness & Focus", category: "bienetre", price: 47, desc: "Concentration et pleine conscience" },
    { id: "SK17", name: "Gestion du Stress", category: "bienetre", price: 47, desc: "Techniques de régulation émotionnelle" },
    { id: "SK18", name: "Sommeil & Performance", category: "bienetre", price: 47, desc: "Optimiser récupération et énergie" },
    { id: "SK19", name: "Nutrition & Cognition", category: "bienetre", price: 47, desc: "Alimentation pour la performance mentale" },
    { id: "SK20", name: "Sport & Biohacking", category: "bienetre", price: 47, desc: "Optimisation physique et mentale" },
  ];

  const filtered = activeFilter === "all" ? skills : skills.filter(function(s) { return s.category === activeFilter; });

  const categoryColors = {
    ia: { bg: "rgba(200,169,110,0.12)", border: "rgba(200,169,110,0.5)", badge: "#c8a96e", text: "IA" },
    business: { bg: "rgba(120,160,255,0.10)", border: "rgba(120,160,255,0.4)", badge: "#78a0ff", text: "Business" },
    bienetre: { bg: "rgba(100,220,160,0.10)", border: "rgba(100,220,160,0.4)", badge: "#64dcA0", text: "Bien-être" },
  };

  const filters = [
    { key: "all", label: "Tous les Skills", count: 20 },
    { key: "ia", label: "Intelligence Artificielle", count: 10 },
    { key: "business", label: "Business", count: 5 },
    { key: "bienetre", label: "Bien-être", count: 5 },
  ];

  return (
    <div style={{ background: "#050508", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", padding: "0 0 80px 0" }}>

      <div style={{ background: "linear-gradient(180deg, #0d0d12 0%, #050508 100%)", borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "60px 20px 50px 20px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px", padding: "6px 18px", marginBottom: "20px" }}>
          <span style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase" }}>Catalogue de Formation</span>
        </div>
        <h1 style={{ color: "#ffffff", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "800", margin: "0 0 16px 0", letterSpacing: "-1px", lineHeight: "1.1" }}>
          Maîtrisez les <span style={{ color: "#c8a96e" }}>20 Skills</span>
        </h1>
        <h2 style={{ color: "#ffffff", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "800", margin: "0 0 24px 0", letterSpacing: "-1px", lineHeight: "1.1" }}>
          du Futur
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", maxWidth: "520px", margin: "0 auto", lineHeight: "1.7" }}>
          IA, Business & Bien-être — Trois piliers pour performer dans un monde en mutation rapide
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "40px", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "800" }}>10</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "1px" }}>Skills IA</div>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.1)", height: "50px" }}></div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#78a0ff", fontSize: "28px", fontWeight: "800" }}>5</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "1px" }}>Skills Business</div>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.1)", height: "50px" }}></div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#64dcA0", fontSize: "28px", fontWeight: "800" }}>5</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "1px" }}>Skills Bien-être</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", padding: "40px 0 48px 0", flexWrap: "wrap" }}>
          {filters.map(function(f) {
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={function() { setActiveFilter(f.key); }}
                style={{
                  background: isActive ? "#c8a96e" : "rgba(255,255,255,0.04)",
                  border: isActive ? "1px solid #c8a96e" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "30px",
                  color: isActive ? "#050508" : "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: isActive ? "700" : "500",
                  padding: "10px 22px",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {f.label}
                <span style={{
                  background: isActive ? "rgba(5,5,8,0.2)" : "rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "2px 7px",
                }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {filtered.map(function(skill) {
            const cat = categoryColors[skill.category];
            return (
              <div
                key={skill.id}
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  padding: "28px",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s, border-color 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={function(e) {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = cat.border;
                }}
                onMouseLeave={function(e) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, " + cat.badge + ", transparent)" }}></div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: cat.bg, border: "1px solid " + cat.border, borderRadius: "10px", padding: "8px 12px" }}>
                      <span style={{ color: cat.badge, fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>{skill.id}</span>
                    </div>
                    <span style={{ background: cat.bg, border: "1px solid " + cat.border, borderRadius: "20px", color: cat.badge, fontSize: "11px", fontWeight: "600", padding: "3px 10px", letterSpacing: "0.5px" }}>
                      {cat.text}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "800" }}>{skill.price}€</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", marginTop: "2px" }}>accès à vie</div>
                  </div>
                </div>

                <h3 style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0", lineHeight: "1.4" }}>
                  {skill.name}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
                  {skill.desc}
                </p>

                <button
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid " + cat.border,
                    borderRadius: "10px",
                    color: cat.badge,
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    padding: "11px",
                    transition: "all 0.2s",
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={function(e) {
                    e.currentTarget.style.background = cat.bg;
                    e.currentTarget.style.letterSpacing = "1px";
                  }}
                  onMouseLeave={function(e) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.letterSpacing = "0.5px";
                  }}
                >
                  Accéder au skill →
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "64px", background: "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(200,169,110,0.03) 100%)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "24px", padding: "48px 40px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px", padding: "6px 18px", marginBottom: "20px" }}>
            <span style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>Offre Complète</span>
          </div>
          <h3 style={{ color: "#ffffff", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "800", margin: "0 0 12px 0" }}>
            Pack des 20 Skills
          </h3>
          <p style={{