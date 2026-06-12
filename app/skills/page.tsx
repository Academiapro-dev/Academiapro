import React from "react";
import { useState } from "react";

const skills = [
  { id: "SK01", name: "Machine Learning Fondamentaux", category: "IA", price: 97, desc: "Maîtrisez les bases du ML avec Python et scikit-learn" },
  { id: "SK02", name: "Deep Learning & Réseaux de Neurones", category: "IA", price: 97, desc: "Construisez des architectures neuronales avancées" },
  { id: "SK03", name: "NLP & Traitement du Langage", category: "IA", price: 97, desc: "Analysez et générez du texte avec l'IA" },
  { id: "SK04", name: "Computer Vision", category: "IA", price: 97, desc: "Reconnaissance d'images et vidéos par l'IA" },
  { id: "SK05", name: "LLMs & Prompt Engineering", category: "IA", price: 97, desc: "Optimisez vos interactions avec les grands modèles" },
  { id: "SK06", name: "IA Générative & Diffusion", category: "IA", price: 97, desc: "Créez des contenus visuels et textuels par IA" },
  { id: "SK07", name: "MLOps & Déploiement IA", category: "IA", price: 97, desc: "Industrialisez vos modèles en production" },
  { id: "SK08", name: "Data Engineering", category: "IA", price: 97, desc: "Pipelines de données robustes et scalables" },
  { id: "SK09", name: "IA & Automatisation", category: "IA", price: 97, desc: "Automatisez vos processus métier avec l'IA" },
  { id: "SK10", name: "Éthique & IA Responsable", category: "IA", price: 97, desc: "Construisez une IA juste, transparente et sûre" },
  { id: "SK11", name: "Stratégie d'Entreprise", category: "Business", price: 97, desc: "Définissez et exécutez votre vision stratégique" },
  { id: "SK12", name: "Marketing Digital Avancé", category: "Business", price: 97, desc: "Acquisition, conversion et rétention clients" },
  { id: "SK13", name: "Leadership & Management", category: "Business", price: 97, desc: "Dirigez des équipes performantes et motivées" },
  { id: "SK14", name: "Finance & Investissement", category: "Business", price: 97, desc: "Maîtrisez la gestion financière et les marchés" },
  { id: "SK15", name: "Entrepreneuriat & Startup", category: "Business", price: 97, desc: "Lancez et scalez votre entreprise avec méthode" },
  { id: "SK16", name: "Méditation & Pleine Conscience", category: "Bien-être", price: 47, desc: "Cultivez la paix intérieure et la clarté mentale" },
  { id: "SK17", name: "Nutrition & Alimentation Saine", category: "Bien-être", price: 47, desc: "Optimisez votre énergie par l'alimentation" },
  { id: "SK18", name: "Gestion du Stress", category: "Bien-être", price: 47, desc: "Techniques pour un équilibre mental durable" },
  { id: "SK19", name: "Sommeil & Récupération", category: "Bien-être", price: 47, desc: "Améliorez la qualité de votre sommeil profondément" },
  { id: "SK20", name: "Mouvement & Performance Physique", category: "Bien-être", price: 47, desc: "Entraînement intelligent pour un corps optimal" },
];

const categories = ["Tous", "IA", "Business", "Bien-être"];

const categoryColors: Record<string, string> = {
  "IA": "#c8a96e",
  "Business": "#8bb8e8",
  "Bien-être": "#8be8b8",
};

export default function SkillsPage() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const filtered = activeFilter === "Tous" ? skills : skills.filter(s => s.category === activeFilter);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#050508",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#ffffff",
      padding: "0",
    }}>

      {/* Header */}
      <div style={{
        textAlign: "center",
        padding: "80px 24px 48px",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse, rgba(200,169,110,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-block",
          border: "1px solid rgba(200,169,110,0.4)",
          borderRadius: "20px",
          padding: "6px 18px",
          marginBottom: "24px",
          fontSize: "12px",
          letterSpacing: "3px",
          color: "#c8a96e",
          textTransform: "uppercase",
        }}>
          20 Compétences Premium
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: "800",
          margin: "0 0 20px",
          lineHeight: "1.1",
          letterSpacing: "-1px",
        }}>
          Maîtrisez les Skills
          <br />
          <span style={{
            background: "linear-gradient(135deg, #c8a96e, #f0d89a, #c8a96e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            qui transforment votre avenir
          </span>
        </h1>

        <p style={{
          fontSize: "18px",
          color: "rgba(255,255,255,0.5)",
          maxWidth: "560px",
          margin: "0 auto",
          lineHeight: "1.7",
        }}>
          Des formations ultra-ciblées pour progresser rapidement dans les domaines qui comptent vraiment.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        padding: "0 24px 56px",
        flexWrap: "wrap",
      }}>
        {categories.map(cat => {
          const isActive = activeFilter === cat;
          const isHov = hoveredFilter === cat;
          const col = cat === "Tous" ? "#c8a96e" : categoryColors[cat];

          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              onMouseEnter={() => setHoveredFilter(cat)}
              onMouseLeave={() => setHoveredFilter(null)}
              style={{
                padding: "10px 28px",
                borderRadius: "100px",
                border: isActive ? "1px solid " + col : "1px solid rgba(255,255,255,0.12)",
                background: isActive ? col + "18" : isHov ? "rgba(255,255,255,0.04)" : "transparent",
                color: isActive ? col : isHov ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)",
                fontSize: "14px",
                fontWeight: isActive ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.2s ease",
                letterSpacing: "0.5px",
              }}
            >
              {cat}
              {cat !== "Tous" && (
                <span style={{
                  marginLeft: "8px",
                  fontSize: "11px",
                  opacity: 0.7,
                }}>
                  {cat === "IA" ? "10" : cat === "Business" ? "5" : "5"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 24px 100px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
      }}>
        {filtered.map(skill => {
          const isHov = hoveredCard === skill.id;
          const catColor = categoryColors[skill.category];

          return (
            <div
              key={skill.id}
              onMouseEnter={() => setHoveredCard(skill.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: isHov
                  ? "linear-gradient(145deg, rgba(200,169,110,0.06), rgba(255,255,255,0.02))"
                  : "rgba(255,255,255,0.02)",
                border: isHov
                  ? "1px solid rgba(200,169,110,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
                padding: "28px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: isHov ? "translateY(-4px)" : "translateY(0)",
                boxShadow: isHov
                  ? "0 20px 60px rgba(200,169,110,0.08), 0 0 0 0 transparent"
                  : "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glow background */}
              {isHov && (
                <div style={{
                  position: "absolute",
                  top: "-50%",
                  right: "-50%",
                  width: "200px",
                  height: "200px",
                  background: "radial-gradient(circle, " + catColor + "08 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
              )}

              {/* Top row */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}>
                <div style={{
                  padding: "4px 12px",
                  borderRadius: "100px",
                  background: catColor + "15",
                  border: "1px solid " + catColor + "30",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: catColor,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}>
                  {skill.category}
                </div>

                <div style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.2)",
                  fontWeight: "500",
                  letterSpacing: "1px",
                }}>
                  {skill.id}
                </div>
              </div>

              {/* Content */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: isHov ? "#ffffff" : "rgba(255,255,255,0.88)",
                  margin: "0 0 10px",
                  lineHeight: "1.3",
                  transition: "color 0.2s ease",
                }}>
                  {skill.name}
                </h3>
                <p style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                  margin: "0",
                  lineHeight: "1.6",
                }}>
                  {skill.desc}
                </p>
              </div>

              {/* Divider */}
              <div style={{
                height: "1px",
                background: "rgba(255,255,255,0.06)",
                marginBottom: "20px",
              }} />

              {/* Bottom row */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <span style={{
                    fontSize: "26px",
                    fontWeight: "800",
                    color: "#c8a96e",
                    lineHeight: "1",
                  }}>
                    {skill.price}
                  </span>
                  <span style={{
                    fontSize: "14px",
                    color: "rgba(200,169,110,0.6)",
                    marginLeft: "2px",
                    fontWeight: "500",
                  }}>
                    €
                  </span>
                  <div style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.25)",
                    marginTop: "2px",
                  }}>
                    accès à vie
                  </div>
                </div>

                <button
                  onMouseEnter={() => setHoveredBtn(skill.id)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "100px",
                    border: "none",
                    background: hoveredBtn === skill.id
                      ? "linear-gradient(135deg, #d4b87a, #c8a96e)"
                      : "linear-gradient(135deg, #c8a96e, #b89458)",
                    color: "#050508",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.3px",
                    transform: hoveredBtn === skill.id ? "scale(1.04)" : "scale(1)",
                    boxShadow: hoveredBtn === skill.id
                      ? "0 8px 24px rgba(200,169,110,0.35)"
                      : "0 4px 12px rgba(200,169,110,0.15)",
                  }}
                >
                  Accéder
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats bar */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 24px",
        display: "flex",
        justifyContent: "center",
        gap: "60px",
        flexWrap