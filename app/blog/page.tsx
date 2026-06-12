"use client";
import { useState } from "react";

export default function BlogPage() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeFilter, setActiveFilter] = useState("Tous");

  const articles = [
    {
      id: 1,
      titre: "Maîtriser les prompts Claude pour la comptabilité",
      date: "12 janvier 2025",
      categorie: "Prompts Claude",
      description: "Découvrez comment rédiger des prompts efficaces pour automatiser vos tâches comptables avec Claude AI.",
      lecture: "5 min",
      couleur: "#c8a96e"
    },
    {
      id: 2,
      titre: "Créer un chatbot intelligent sans coder",
      date: "28 janvier 2025",
      categorie: "No-Code",
      description: "Guide complet pour construire votre propre assistant virtuel grâce aux outils no-code disponibles en 2025.",
      lecture: "8 min",
      couleur: "#a07850"
    },
    {
      id: 3,
      titre: "Les meilleurs outils IA pour le marketing digital",
      date: "5 février 2025",
      categorie: "Outils IA",
      description: "Sélection des outils d'intelligence artificielle indispensables pour booster votre stratégie marketing.",
      lecture: "6 min",
      couleur: "#c8a96e"
    },
    {
      id: 4,
      titre: "Sophrologie et bien-être au travail",
      date: "14 février 2025",
      categorie: "Sophrologie",
      description: "Comment intégrer des techniques de sophrologie dans votre quotidien professionnel pour réduire le stress.",
      lecture: "7 min",
      couleur: "#8a9e6e"
    },
    {
      id: 5,
      titre: "Apprendre l'anglais avec l'IA en 30 jours",
      date: "22 février 2025",
      categorie: "Anglais",
      description: "Programme intensif pour améliorer votre niveau d'anglais professionnel grâce aux assistants IA.",
      lecture: "10 min",
      couleur: "#6e8ea0"
    },
    {
      id: 6,
      titre: "No-code : automatisez votre business en 2025",
      date: "3 mars 2025",
      categorie: "No-Code",
      description: "Les plateformes no-code qui transforment la façon dont les entrepreneurs gèrent leur activité.",
      lecture: "9 min",
      couleur: "#a07850"
    }
  ];

  const categories = ["Tous", "Prompts Claude", "No-Code", "Outils IA", "Sophrologie", "Anglais"];

  const articlesFiltres = activeFilter === "Tous"
    ? articles
    : articles.filter(function(a) { return a.categorie === activeFilter; });

  function getBadgeColor(categorie) {
    if (categorie === "Prompts Claude") return "#c8a96e";
    if (categorie === "No-Code") return "#a07850";
    if (categorie === "Outils IA") return "#c8a96e";
    if (categorie === "Sophrologie") return "#8a9e6e";
    if (categorie === "Anglais") return "#6e8ea0";
    return "#c8a96e";
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Georgia', serif", padding: "0" }}>

      <div style={{ background: "linear-gradient(180deg, #0d0d14 0%, #050508 100%)", padding: "80px 20px 60px 20px", textAlign: "center", borderBottom: "1px solid #1a1a28" }}>
        <div style={{ display: "inline-block", backgroundColor: "#0f0f1a", border: "1px solid #c8a96e", borderRadius: "20px", padding: "6px 18px", marginBottom: "24px" }}>
          <span style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "'Arial', sans-serif" }}>Journal & Ressources</span>
        </div>
        <h1 style={{ color: "#f0e6d3", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: "300", margin: "0 0 20px 0", letterSpacing: "2px", lineHeight: "1.2" }}>
          Le Blog
        </h1>
        <p style={{ color: "#8a8a9a", fontSize: "18px", maxWidth: "560px", margin: "0 auto 40px auto", lineHeight: "1.8", fontWeight: "300" }}>
          Explorations autour de l'IA, du no-code, du bien-être et de l'apprentissage continu.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", maxWidth: "700px", margin: "0 auto" }}>
          {categories.map(function(cat) {
            return (
              <button
                key={cat}
                onClick={function() { setActiveFilter(cat); }}
                style={{
                  backgroundColor: activeFilter === cat ? "#c8a96e" : "transparent",
                  color: activeFilter === cat ? "#050508" : "#8a8a9a",
                  border: activeFilter === cat ? "1px solid #c8a96e" : "1px solid #2a2a3a",
                  borderRadius: "20px",
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontFamily: "'Arial', sans-serif",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontWeight: activeFilter === cat ? "600" : "400"
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 20px" }}>

        <div style={{ display: "flex", alignItems: "center", marginBottom: "40px", gap: "12px" }}>
          <span style={{ color: "#3a3a50", fontSize: "13px", fontFamily: "'Arial', sans-serif", letterSpacing: "2px", textTransform: "uppercase" }}>
            {articlesFiltres.length} article{articlesFiltres.length > 1 ? "s" : ""}
          </span>
          <div style={{ flex: "1", height: "1px", backgroundColor: "#1a1a28" }}></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "28px" }}>
          {articlesFiltres.map(function(article) {
            const isHovered = hoveredCard === article.id;
            return (
              <article
                key={article.id}
                onMouseEnter={function() { setHoveredCard(article.id); }}
                onMouseLeave={function() { setHoveredCard(null); }}
                style={{
                  backgroundColor: isHovered ? "#0d0d18" : "#080810",
                  border: isHovered ? "1px solid #c8a96e" : "1px solid #14141e",
                  borderRadius: "12px",
                  padding: "32px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform: isHovered ? "translateY(-4px)" : "translateY(0px)",
                  boxShadow: isHovered ? "0 20px 60px rgba(200, 169, 110, 0.08)" : "0 4px 20px rgba(0,0,0,0.3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <span style={{
                    backgroundColor: getBadgeColor(article.categorie) + "15",
                    color: getBadgeColor(article.categorie),
                    border: "1px solid " + getBadgeColor(article.categorie) + "40",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    fontSize: "11px",
                    fontFamily: "'Arial', sans-serif",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    fontWeight: "600"
                  }}>
                    {article.categorie}
                  </span>
                  <span style={{ color: "#3a3a50", fontSize: "11px", fontFamily: "'Arial', sans-serif", letterSpacing: "1px" }}>
                    {article.lecture}
                  </span>
                </div>

                <h2 style={{
                  color: isHovered ? "#f0e6d3" : "#c8c8d8",
                  fontSize: "20px",
                  fontWeight: "400",
                  lineHeight: "1.4",
                  margin: "0 0 16px 0",
                  letterSpacing: "0.3px",
                  transition: "color 0.3s ease"
                }}>
                  {article.titre}
                </h2>

                <p style={{
                  color: "#5a5a72",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  margin: "0 0 28px 0",
                  fontFamily: "'Arial', sans-serif",
                  fontWeight: "300",
                  flex: "1"
                }}>
                  {article.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "20px", borderTop: "1px solid #14141e" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2a2a3a" }}></div>
                    <time style={{ color: "#4a4a62", fontSize: "12px", fontFamily: "'Arial', sans-serif", letterSpacing: "0.5px" }}>
                      {article.date}
                    </time>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: isHovered ? "#c8a96e" : "#3a3a50", fontSize: "12px", fontFamily: "'Arial', sans-serif", letterSpacing: "1px", transition: "color 0.3s ease" }}>
                      Lire
                    </span>
                    <span style={{ color: isHovered ? "#c8a96e" : "#3a3a50", fontSize: "16px", transition: "all 0.3s ease", transform: isHovered ? "translateX(4px)" : "translateX(0px)" }}>
                      →
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {articlesFiltres.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ color: "#3a3a50", fontSize: "16px", fontFamily: "'Arial', sans-serif" }}>Aucun article dans cette catégorie.</p>
          </div>
        )}

      </div>

      <footer style={{ borderTop: "1px solid #0f0f1a", padding: "40px 20px", textAlign: "center" }}>
        <p style={{ color: "#2a2a3a", fontSize: "12px", fontFamily: "'Arial', sans-serif", letterSpacing: "2px", textTransform: "uppercase", margin: "0" }}>
          © 2025 — Tous droits réservés
        </p>
      </footer>

    </div>
  );
}