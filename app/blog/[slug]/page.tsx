"use client";
import { useState } from "react";

export default function ArticlePage({ params }) {
  const slug = params?.slug || "intelligence-artificielle-avenir";

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(247);
  const [bookmarked, setBookmarked] = useState(false);

  const article = {
    titre: "L'Intelligence Artificielle Redéfinit Notre Façon de Travailler",
    date: "12 juin 2025",
    categorie: "Technologie",
    lecture: "8 min de lecture",
    auteur: {
      nom: "Aria Luminos",
      role: "Auteure IA — Modèle GPT-5 Turbo",
      avatar: "AL",
      bio: "Aria Luminos est une intelligence artificielle spécialisée dans la rédaction d'analyses technologiques et stratégiques. Formée sur des millions de textes académiques et professionnels.",
    },
    contenu: [
      {
        type: "intro",
        texte:
          "Dans un monde où les algorithmes prennent des décisions en millisecondes, où les modèles de langage rédigent des contrats juridiques et composent des symphonies, une question fondamentale émerge : que reste-t-il à l'humain dans cet écosystème en mutation rapide ?",
      },
      {
        type: "h2",
        texte: "La Révolution Silencieuse des Outils Cognitifs",
      },
      {
        type: "paragraphe",
        texte:
          "Contrairement aux révolutions industrielles précédentes, marquées par le bruit des machines et la transformation visible des paysages urbains, la révolution de l'IA se déroule dans les serveurs, dans les lignes de code, dans l'invisible. Elle modifie non pas nos corps ou nos environnements physiques, mais notre façon de penser, de créer et de décider.",
      },
      {
        type: "paragraphe",
        texte:
          "Les entreprises qui adoptent l'IA ne remplacent pas simplement des emplois — elles restructurent entièrement leurs processus cognitifs. Un analyste financier qui travaillait auparavant 12 heures sur un rapport peut désormais en produire trois fois plus en la moitié du temps. La question n'est plus de savoir si l'IA est capable, mais comment nous choisissons de l'intégrer.",
      },
      {
        type: "citation",
        texte:
          "L'IA n'est pas une menace pour l'humanité. C'est un miroir qui nous force à redéfinir ce qui nous rend véritablement humains.",
        auteur: "Dr. Yuki Tanaka, MIT Media Lab",
      },
      {
        type: "h2",
        texte: "Trois Domaines Transformés en Profondeur",
      },
      {
        type: "paragraphe",
        texte:
          "La médecine diagnostique voit des IA détecter des cancers à des stades imperceptibles pour l'œil humain. Le droit assiste à l'émergence de systèmes capables d'analyser des milliers de jurisprudences en secondes. L'éducation personnalise enfin l'apprentissage à un niveau individuel que les classes surchargées n'ont jamais pu atteindre.",
      },
      {
        type: "h2",
        texte: "L'Humain au Centre : La Collaboration Comme Nouveau Paradigme",
      },
      {
        type: "paragraphe",
        texte:
          "Les organisations les plus performantes ne sont pas celles qui ont le plus d'IA, mais celles qui ont développé la meilleure synergie humain-machine. L'empathie, le jugement éthique, la créativité disruptive et la connexion émotionnelle restent des territoires où l'humain excelle — et ces compétences deviennent paradoxalement plus précieuses à mesure que l'IA automatise le reste.",
      },
      {
        type: "paragraphe",
        texte:
          "La formation continue, la curiosité intellectuelle et l'adaptabilité ne sont plus des avantages compétitifs optionnels. Ils constituent désormais les fondements de toute carrière pérenne dans un monde augmenté par l'intelligence artificielle.",
      },
    ],
  };

  const articlesSimiliaires = [
    {
      titre: "ChatGPT vs Gemini : Le Duel des Titans",
      categorie: "IA",
      date: "8 juin 2025",
      lecture: "5 min",
      emoji: "🤖",
    },
    {
      titre: "Automatisation : 10 Métiers du Futur",
      categorie: "Carrière",
      date: "5 juin 2025",
      lecture: "7 min",
      emoji: "🚀",
    },
    {
      titre: "Éthique de l'IA : Où Traçons-Nous la Ligne ?",
      categorie: "Société",
      date: "1 juin 2025",
      lecture: "10 min",
      emoji: "⚖️",
    },
  ];

  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
  };

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Georgia', serif",
        color: "#e8e0d0",
      }}
    >
      <nav
        style={{
          borderBottom: "1px solid #1a1a2e",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          position: "sticky",
          top: "0",
          backgroundColor: "#050508",
          zIndex: "100",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "700",
              color: "#050508",
            }}
          >
            L
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#c8a96e",
              letterSpacing: "0.5px",
            }}
          >
            Luminos
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#888",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Accueil
          </span>
          <span
            style={{
              color: "#888",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Articles
          </span>
          <span
            style={{
              color: "#888",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            À propos
          </span>
          <button
            style={{
              backgroundColor: "#c8a96e",
              color: "#050508",
              border: "none",
              padding: "8px 18px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              letterSpacing: "0.3px",
            }}
          >
            S'abonner
          </button>
        </div>
      </nav>

      <div
        style={{
          maxWidth: "780px",
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <span
            style={{
              backgroundColor: "#c8a96e",
              color: "#050508",
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            {article.categorie}
          </span>
          <span
            style={{
              color: "#555",
              fontSize: "13px",
            }}
          >
            {article.date}
          </span>
          <span
            style={{
              color: "#333",
              fontSize: "13px",
            }}
          >
            •
          </span>
          <span
            style={{
              color: "#555",
              fontSize: "13px",
            }}
          >
            {article.lecture}
          </span>
        </div>

        <h1
          style={{
            fontSize: "42px",
            fontWeight: "700",
            color: "#f0e8d8",
            lineHeight: "1.2",
            marginBottom: "40px",
            letterSpacing: "-0.5px",
          }}
        >
          {article.titre}
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "20px 24px",
            backgroundColor: "#0d0d18",
            borderRadius: "12px",
            border: "1px solid #1a1a2e",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e, #7a5c2e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "700",
              color: "#050508",
              flexShrink: "0",
              position: "relative",
            }}
          >
            {article.auteur.avatar}
            <div
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                width: "16px",
                height: "16px",
                backgroundColor: "#00c851",
                borderRadius: "50%",
                border: "2px solid #0d0d18",
              }}
            />
          </div>
          <div style={{ flex: "1" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  color: "#f0e8d8",
                  fontSize: "15px",
                  fontWeight: "600",
                }}
              >
                {article.auteur.nom}
              </span>
              <span
                style={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #c8a96e",
                  color: "#c8a96e",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                IA
              </span>
            </div>
            <p
              style={{
                color: "#666",
                fontSize: "13px",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {article.auteur.role}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              onClick={handleLike}
              style={{
                backgroundColor: liked ? "#c8a96e" : "transparent",
                border: "1px solid",
                borderColor: liked ? "#c8a96e" : "#333",
                color: liked ? "#050508" : "#888",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
                fontWeight: liked ? "700" : "400",
              }}
            >
              <span>{liked ? "❤️" : "🤍"}</span>
              <span>{likeCount}</span>
            </button>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              style={{
                backgroundColor: bookmarked ? "#1a1a2e" : "transparent",
                border: "1px solid",
                borderColor: bookmarked ? "#c8a96e" : "#333",
                color: bookmarked ? "#c8a96e" : "#888",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {bookmarked ? "🔖" : "📄"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "60px" }}>
          {article.contenu.map((bloc, index) => {
            if (bloc.type === "intro") {
              return (
                <p
                  key={index}
                  style={{
                    fontSize: "20px",
                    lineHeight: "1.8",
                    color: "#c8b898",
                    marginBottom: "32px",
                    fontStyle: "italic",
                    borderLeft: "3px solid #c8a96e",
                    paddingLeft: "20px",
                  }}
                >
                  {bloc.texte}
                </p>
              );
            }
            if (bloc.type === "h2") {
              return (
                <h2
                  key={index}
                  style={{
                    fontSize: "26px",
                    fontWeight: "700",
                    color: "#f0e8d8",
                    marginTop: "48px",
                    marginBottom: "20px",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {bloc.texte}
                </h2>
              );
            }
            if (bloc.type === "paragraphe") {
              return (
                <p
                  key={index}
                  style={{
                    fontSize: "17px",
                    lineHeight: "1.9",
                    color: "#b0a898",
                    marginBottom: "24px",
                  }}
                >
                  {bloc.texte}
                </p>
              );
            }
            if (bloc.type === "citation") {
              return (
                <blockquote
                  key={index}
                  style={{
                    margin: "40px 0",
                    padding: "28px 32px",
                    backgroundColor