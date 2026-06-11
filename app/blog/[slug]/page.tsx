export default function ArticlePage({ params }: { params: { slug: string } }) {
  const articles = {
    "ia-generative-revolution": {
      title: "La Révolution de l'IA Générative en 2024",
      author: "Dr. Sophie Marchand",
      date: "15 Janvier 2024",
      readTime: "8 min",
      category: "IA Générative",
      formation: "Maîtriser l'IA Générative",
      formationSlug: "ia-generative-masterclass",
      content: [
        {
          type: "intro",
          text: "L'intelligence artificielle générative a franchi en 2024 un cap décisif, transformant radicalement notre façon de créer, d'apprendre et d'innover. Des modèles de langage aux générateurs d'images, cette révolution silencieuse redessine les contours de l'économie numérique mondiale."
        },
        {
          type: "h2",
          text: "Qu'est-ce que l'IA Générative ?"
        },
        {
          type: "paragraph",
          text: "Contrairement aux systèmes d'IA traditionnels qui analysent et classifient des données existantes, l'IA générative crée du nouveau contenu : textes, images, sons, vidéos, codes informatiques. Elle s'appuie sur des architectures de réseaux de neurones profonds, notamment les Transformers et les Réseaux Adversariaux Génératifs (GAN), pour produire des outputs d'une sophistication croissante."
        },
        {
          type: "h2",
          text: "Les Chiffres qui Font Trembler"
        },
        {
          type: "paragraph",
          text: "En 2024, le marché mondial de l'IA générative a dépassé les 67 milliards de dollars, avec une croissance annuelle projetée de 35%. Plus de 1,8 milliard de personnes interagissent quotidiennement avec des outils basés sur cette technologie, souvent sans même le savoir."
        },
        {
          type: "quote",
          text: "L'IA générative n'est pas un outil de plus. C'est un changement de paradigme comparable à l'invention d'internet — peut-être même plus profond."
        },
        {
          type: "h2",
          text: "Les Domaines Transformés"
        },
        {
          type: "paragraph",
          text: "La médecine voit émerger des diagnostics assistés par IA capable de détecter des cancers avec une précision supérieure à celle des radiologues humains. L'éducation se réinvente autour de tuteurs personnalisés disponibles 24h/24. Le droit, la finance, l'architecture, le marketing — aucun secteur n'échappe à cette vague de fond."
        },
        {
          type: "h2",
          text: "Les Enjeux Éthiques et Réglementaires"
        },
        {
          type: "paragraph",
          text: "Cette puissance inédite soulève des questions fondamentales. Qui détient la propriété des créations générées par IA ? Comment distinguer le vrai du faux dans un monde où les deepfakes atteignent une perfection troublante ? L'Union Européenne a adopté l'AI Act, première réglementation majeure au monde, tentant de poser des garde-fous sans entraver l'innovation."
        },
        {
          type: "h2",
          text: "Se Former pour Ne Pas Subir"
        },
        {
          type: "paragraph",
          text: "Face à cette révolution, deux attitudes s'affrontent : la passivité qui mène à l'obsolescence, et la maîtrise active qui ouvre des opportunités sans précédent. Les professionnels qui comprennent profondément ces outils — pas seulement les utilisateurs superficiels — seront ceux qui façonneront le monde de demain."
        }
      ],
      similarArticles: [
        {
          slug: "prompt-engineering-avance",
          title: "Prompt Engineering Avancé : Les Techniques des Experts",
          category: "Technique",
          readTime: "6 min",
          date: "10 Janvier 2024"
        },
        {
          slug: "gpt-4-entreprise",
          title: "Intégrer GPT-4 dans Votre Entreprise : Guide Pratique",
          category: "Business",
          readTime: "10 min",
          date: "8 Janvier 2024"
        },
        {
          slug: "futur-travail-ia",
          title: "Le Futur du Travail à l'Ère de l'IA : Scénarios 2030",
          category: "Prospective",
          readTime: "12 min",
          date: "5 Janvier 2024"
        }
      ]
    }
  };

  const article = articles[params.slug as keyof typeof articles] || articles["ia-generative-revolution"];

  const containerStyle: React.CSSProperties = {
    backgroundColor: "#050508",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#e8e8f0"
  };

  const navStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "rgba(5, 5, 8, 0.92)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
    padding: "0 24px"
  };

  const navInnerStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "68px"
  };

  const logoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none"
  };

  const logoIconStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    background: "linear-gradient(135deg, #c8a96e 0%, #f0d090 50%, #c8a96e 100%)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "900",
    color: "#050508"
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.3px"
  };

  const logoSubStyle: React.CSSProperties = {
    color: "#c8a96e",
    fontStyle: "italic"
  };

  const navLinksStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "32px"
  };

  const navLinkStyle: React.CSSProperties = {
    color: "#a0a0b8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "color 0.2s"
  };

  const navCtaStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #c8a96e, #f0d090)",
    color: "#050508",
    padding: "8px 20px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "0.3px"
  };

  const heroSectionStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    padding: "80px 24px 60px"
  };

  const heroGlowStyle: React.CSSProperties = {
    position: "absolute",
    top: "-200px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "800px",
    height: "600px",
    background: "radial-gradient(ellipse, rgba(200, 169, 110, 0.08) 0%, transparent 70%)",
    pointerEvents: "none"
  };

  const heroInnerStyle: React.CSSProperties = {
    maxWidth: "860px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1
  };

  const categoryBadgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "rgba(200, 169, 110, 0.12)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    color: "#c8a96e",
    padding: "5px 14px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.8px",
    textTransform: "uppercase" as const,
    marginBottom: "24px"
  };

  const heroTitleStyle: React.CSSProperties = {
    fontSize: "clamp(32px, 5vw, 52px)",
    fontWeight: "800",
    lineHeight: "1.15",
    letterSpacing: "-1px",
    color: "#ffffff",
    marginBottom: "32px",
    margin: "0 0 32px 0"
  };

  const titleAccentStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #c8a96e, #f0d090)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  };

  const metaBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "20px",
    paddingTop: "28px",
    borderTop: "1px solid rgba(200, 169, 110, 0.1)"
  };

  const authorBlockStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  };

  const avatarStyle: React.CSSProperties = {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #c8a96e 0%, #f0d090 50%, #a07840 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    border: "2px solid rgba(200, 169, 110, 0.4)",
    boxShadow: "0 0 20px rgba(200, 169, 110, 0.2)",
    flexShrink: 0
  };

  const authorNameStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff"
  };

  const authorRoleStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#c8a96e",
    fontWeight: "500"
  };

  const metaDividerStyle: React.CSSProperties = {
    width: "1px",
    height: "32px",
    backgroundColor: "rgba(200, 169, 110, 0.15)"
  };

  const metaItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#7070a0"
  };

  const metaIconStyle: React.CSSProperties = {
    fontSize: "14px"
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(200, 169, 110, 0.15), transparent)",
    margin: "0 24px"
  };

  const mainLayoutStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "60px 24px",
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: "60px",
    alignItems: "start"
  };

  const articleBodyStyle: React.CSSProperties = {
    minWidth: 0
  };

  const contentCardStyle: React.CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(200, 169, 110, 0.08)",
    borderRadius: "20px",
    padding: "48px",
    lineHeight: "1.8"
  };

  const h2Style: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    marginTop: "40px",
    marginBottom: "16px",
    letterSpacing: "-0.3px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  };

  const h2AccentStyle: React.CSSProperties = {
    display: "inline-block",
    width: "4px",
    height: "22px",
    background: "linear-gradient(180deg, #c8a96e, #f0d090)",
    borderRadius: "2px",
    flexShrink: 0
  };

  const paragraphStyle: React.CSSProperties = {
    fontSize: "16px",
    lineHeight: "1.85",
    color: "#b0b0c8",
    marginBottom: "20px"
  };

  const introStyle: React.CSSProperties = {
    fontSize: "18px",
    lineHeight: "1.8",
    color: "#d0d0e8",
    fontWeight: "400",
    marginBottom: "32px",
    paddingBottom: "32px",
    borderBottom: "1px solid rgba(200, 169, 110, 0.1)"
  };

  const quoteStyle: React.CSSProperties = {
    position: "relative",
    margin: "32px 0",
    padding: "28px 32px",
    background: "linear-gradient(135deg, rgba(200, 169, 110, 0.06), rgba(200, 169, 110, 0.02))",
    borderLeft: "3px solid #c8a96e",
    borderRadius: "0 12px 12px 0"
  };

  const quoteTextStyle: React.CSSProperties = {
    fontSize: "17px",
    lineHeight: "1.7",
    color: "#d8c898",
    fontStyle: "italic",
    fontWeight: "500"
  };

  const quoteMarkStyle: React.CSSProperties = {
    position: "absolute",
    top: "12px",
    left: "16px",
    fontSize: "40px",
    color: "rgba(200, 169, 110, 0.3)",
    lineHeight: "1",
    fontFamily: "Georgia, serif"
  };

  const shareBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap