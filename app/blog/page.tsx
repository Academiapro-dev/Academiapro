import React, { useState } from "react";

const articles = [
  {
    id: 1,
    titre: "Maîtriser les prompts Claude pour la comptabilité",
    date: "12 janvier 2025",
    categorie: "Comptabilité",
    extrait: "Découvrez comment rédiger des prompts efficaces pour automatiser vos tâches comptables avec Claude AI et gagner un temps précieux.",
    couleurCategorie: "#c8a96e"
  },
  {
    id: 2,
    titre: "Créer un chatbot client en moins de 24 heures",
    date: "18 janvier 2025",
    categorie: "Chatbot",
    extrait: "Guide complet pour déployer un chatbot intelligent capable de répondre à vos clients en continu, sans une ligne de code.",
    couleurCategorie: "#a07848"
  },
  {
    id: 3,
    titre: "Les meilleurs outils IA pour le marketing digital",
    date: "25 janvier 2025",
    categorie: "Marketing",
    extrait: "Tour d'horizon des outils d'intelligence artificielle qui révolutionnent les stratégies marketing en 2025.",
    couleurCategorie: "#c8a96e"
  },
  {
    id: 4,
    titre: "Sophrologie et IA : accompagner le bien-être autrement",
    date: "2 février 2025",
    categorie: "Sophrologie",
    extrait: "Comment les sophrologues intègrent l'intelligence artificielle dans leur pratique pour personnaliser l'accompagnement de leurs clients.",
    couleurCategorie: "#a07848"
  },
  {
    id: 5,
    titre: "Apprendre l'anglais avec Claude : méthode immersive",
    date: "10 février 2025",
    categorie: "Formation",
    extrait: "Utilisez Claude comme partenaire de conversation pour progresser rapidement en anglais grâce à des échanges personnalisés et adaptés.",
    couleurCategorie: "#c8a96e"
  },
  {
    id: 6,
    titre: "No-code et IA : créez des apps sans coder",
    date: "17 février 2025",
    categorie: "No-Code",
    extrait: "Les meilleures combinaisons no-code et IA pour créer des applications puissantes, des automatisations et des workflows intelligents.",
    couleurCategorie: "#a07848"
  }
];

const BlogCard = ({ article }: { article: typeof articles[0] }) => {
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? "#0d0d14" : "#08080f",
        border: hovered ? "1px solid #c8a96e" : "1px solid #1a1a2e",
        borderRadius: "12px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: hovered ? "0 8px 32px rgba(200, 169, 110, 0.15)" : "0 2px 12px rgba(0,0,0,0.4)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)"
      }}
    >
      <div
        style={{
          display: "inline-block",
          backgroundColor: "rgba(200, 169, 110, 0.12)",
          border: "1px solid rgba(200, 169, 110, 0.3)",
          borderRadius: "20px",
          padding: "4px 12px",
          alignSelf: "flex-start"
        }}
      >
        <span
          style={{
            color: article.couleurCategorie,
            fontSize: "11px",
            fontWeight: "600",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif"
          }}
        >
          {article.categorie}
        </span>
      </div>

      <h2
        style={{
          color: hovered ? "#c8a96e" : "#e8e0d0",
          fontSize: "18px",
          fontWeight: "700",
          lineHeight: "1.4",
          margin: "0",
          fontFamily: "Georgia, serif",
          transition: "color 0.3s ease"
        }}
      >
        {article.titre}
      </h2>

      <p
        style={{
          color: "#7a7a8c",
          fontSize: "13px",
          fontWeight: "400",
          margin: "0",
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.5px"
        }}
      >
        {article.date}
      </p>

      <div
        style={{
          width: "40px",
          height: "2px",
          backgroundColor: "#c8a96e",
          borderRadius: "2px",
          opacity: hovered ? 1 : 0.4,
          transition: "opacity 0.3s ease"
        }}
      />

      <p
        style={{
          color: "#9090a0",
          fontSize: "14px",
          lineHeight: "1.7",
          margin: "0",
          fontFamily: "system-ui, sans-serif",
          flexGrow: 1
        }}
      >
        {article.extrait}
      </p>

      <button
        onMouseEnter={() => setBtnHovered(true)}
        onMouseLeave={() => setBtnHovered(false)}
        style={{
          backgroundColor: btnHovered ? "#c8a96e" : "transparent",
          border: "1px solid #c8a96e",
          borderRadius: "6px",
          padding: "10px 20px",
          color: btnHovered ? "#050508" : "#c8a96e",
          fontSize: "13px",
          fontWeight: "600",
          letterSpacing: "0.8px",
          cursor: "pointer",
          alignSelf: "flex-start",
          transition: "all 0.25s ease",
          fontFamily: "system-ui, sans-serif",
          marginTop: "4px"
        }}
      >
        Lire la suite →
      </button>
    </div>
  );
};

export default function Blog() {
  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        padding: "60px 20px"
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto"
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "60px"
          }}
        >
          <p
            style={{
              color: "#c8a96e",
              fontSize: "12px",
              fontWeight: "600",
              letterSpacing: "3px",
              textTransform: "uppercase",
              fontFamily: "system-ui, sans-serif",
              marginBottom: "16px"
            }}
          >
            Intelligence Artificielle
          </p>
          <h1
            style={{
              color: "#e8e0d0",
              fontSize: "42px",
              fontWeight: "700",
              margin: "0 0 16px 0",
              fontFamily: "Georgia, serif",
              lineHeight: "1.2"
            }}
          >
            Le Blog de l'IA Pratique
          </h1>
          <p
            style={{
              color: "#6a6a7c",
              fontSize: "16px",
              fontFamily: "system-ui, sans-serif",
              maxWidth: "500px",
              margin: "0 auto",
              lineHeight: "1.6"
            }}
          >
            Guides concrets et stratégies pour intégrer l'IA dans votre quotidien professionnel
          </p>
          <div
            style={{
              width: "60px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
              margin: "24px auto 0 auto"
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px"
          }}
        >
          {articles.map((article) => (
            <BlogCard key={article.id} article={article} />
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "60px",
            paddingTop: "40px",
            borderTop: "1px solid #1a1a2e"
          }}
        >
          <p
            style={{
              color: "#3a3a4c",
              fontSize: "13px",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.5px"
            }}
          >
            © 2025 — Blog IA Pratique. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}