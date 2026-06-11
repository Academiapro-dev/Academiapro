export default async function SeanceSpecialitePage({
  params,
}: {
  params: { specialite: string };
}) {
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const specialiteSlug = params.specialite;

  const fallbackData: Record<
    string,
    { titre: string; description: string; icon: string }
  > = {
    mathematiques: {
      titre: "Mathématiques",
      description:
        "Maîtrisez l'algèbre, la géométrie, l'analyse et les probabilités avec un accompagnement personnalisé adapté à votre niveau et vos objectifs académiques.",
      icon: "∑",
    },
    physique: {
      titre: "Physique",
      description:
        "Explorez la mécanique, l'électromagnétisme, la thermodynamique et la physique quantique grâce à des explications claires et des exercices pratiques.",
      icon: "⚛",
    },
    chimie: {
      titre: "Chimie",
      description:
        "Comprenez les réactions chimiques, la chimie organique et la chimie analytique avec des cours structurés et des expériences illustrées.",
      icon: "🧪",
    },
    biologie: {
      titre: "Biologie",
      description:
        "Approfondissez vos connaissances en biologie cellulaire, génétique, écologie et physiologie humaine avec des approches pédagogiques innovantes.",
      icon: "🧬",
    },
    histoire: {
      titre: "Histoire",
      description:
        "Analysez les grandes périodes historiques, développez votre esprit critique et maîtrisez les méthodes de dissertation et de commentaire de documents.",
      icon: "📜",
    },
    litterature: {
      titre: "Littérature",
      description:
        "Développez votre sens de l'analyse littéraire, enrichissez votre expression écrite et orale, et explorez les grands courants de la littérature française et mondiale.",
      icon: "📚",
    },
    philosophie: {
      titre: "Philosophie",
      description:
        "Construisez une argumentation rigoureuse, maîtrisez les grands auteurs et développez votre capacité à problématiser et à disserter avec méthode.",
      icon: "🔭",
    },
    anglais: {
      titre: "Anglais",
      description:
        "Améliorez votre compréhension, expression écrite et orale en anglais avec des méthodes immersives et des exercices adaptés à tous les niveaux.",
      icon: "🌐",
    },
  };

  let specialiteData = {
    titre: "Spécialité",
    description:
      "Bénéficiez d'un accompagnement personnalisé et adapté à vos besoins académiques pour progresser rapidement et atteindre vos objectifs.",
    icon: "🎓",
  };

  try {
    const { data, error } = await supabase
      .from("specialites")
      .select("titre, description, icon")
      .eq("slug", specialiteSlug)
      .single();

    if (data && !error) {
      specialiteData = {
        titre: data.titre || specialiteData.titre,
        description: data.description || specialiteData.description,
        icon: data.icon || specialiteData.icon,
      };
    } else {
      const fallback = fallbackData[specialiteSlug];
      if (fallback) {
        specialiteData = fallback;
      }
    }
  } catch {
    const fallback = fallbackData[specialiteSlug];
    if (fallback) {
      specialiteData = fallback;
    }
  }

  const tarifs = [
    {
      nom: "Découverte",
      prix: 29,
      duree: "45 min",
      description: "Idéal pour une première séance et évaluer votre niveau",
      features: [
        "Bilan initial",
        "Plan personnalisé",
        "Support de cours",
        "1 exercice corrigé",
      ],
      accent: false,
    },
    {
      nom: "Standard",
      prix: 59,
      duree: "60 min",
      description: "La formule équilibrée pour une progression régulière",
      features: [
        "Cours approfondi",
        "Exercices pratiques",
        "Corrections détaillées",
        "Suivi personnalisé",
        "Ressources exclusives",
      ],
      accent: true,
    },
    {
      nom: "Expert",
      prix: 79,
      duree: "90 min",
      description: "Pour une maîtrise complète et une préparation intensive",
      features: [
        "Séance intensive",
        "Préparation examens",
        "Exercices avancés",
        "Bilan détaillé",
        "Support illimité 24h",
        "Enregistrement séance",
      ],
      accent: false,
    },
  ];

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#ffffff",
  };

  const navStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 40px",
    borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
    backgroundColor: "rgba(5, 5, 8, 0.95)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(20px)",
  };

  const logoStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: 800,
    color: "#c8a96e",
    letterSpacing: "-0.5px",
    textDecoration: "none",
  };

  const navLinkStyle: React.CSSProperties = {
    color: "rgba(255, 255, 255, 0.65)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
    transition: "color 0.2s ease",
  };

  const heroSectionStyle: React.CSSProperties = {
    padding: "80px 40px 60px",
    maxWidth: "1200px",
    margin: "0 auto",
    textAlign: "center",
  };

  const breadcrumbStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.45)",
    marginBottom: "32px",
    padding: "8px 16px",
    backgroundColor: "rgba(200, 169, 110, 0.08)",
    borderRadius: "20px",
    border: "1px solid rgba(200, 169, 110, 0.15)",
  };

  const iconContainerStyle: React.CSSProperties = {
    width: "90px",
    height: "90px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(200, 169, 110, 0.2), rgba(200, 169, 110, 0.05))",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px",
    margin: "0 auto 28px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "clamp(36px, 6vw, 64px)",
    fontWeight: 800,
    letterSpacing: "-2px",
    lineHeight: 1.1,
    marginBottom: "20px",
    background: "linear-gradient(135deg, #ffffff 40%, #c8a96e 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "6px 16px",
    backgroundColor: "rgba(200, 169, 110, 0.12)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#c8a96e",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: "24px",
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: "18px",
    lineHeight: 1.75,
    color: "rgba(255, 255, 255, 0.65)",
    maxWidth: "680px",
    margin: "0 auto 48px",
  };

  const statsRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    flexWrap: "wrap",
    marginBottom: "0",
  };

  const statItemStyle: React.CSSProperties = {
    textAlign: "center",
  };

  const statNumberStyle: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: 800,
    color: "#c8a96e",
    display: "block",
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.45)",
    fontWeight: 500,
  };

  const sectionStyle: React.CSSProperties = {
    padding: "80px 40px",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: 800,
    textAlign: "center",
    marginBottom: "12px",
    letterSpacing: "-1px",
    color: "#ffffff",
  };

  const sectionSubtitleStyle: React.CSSProperties = {
    fontSize: "16px",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    marginBottom: "56px",
    maxWidth: "480px",
    margin: "0 auto 56px",
  };

  const tarifsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    alignItems: "start",
  };

  const cardBaseStyle: React.CSSProperties = {
    borderRadius: "20px",
    padding: "36px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.3s ease, border-color 0.3s ease",
  };

  const cardAccentStyle: React.CSSProperties = {
    ...cardBaseStyle,
    border: "1px solid rgba(200, 169, 110, 0.5)",
    backgroundColor: "rgba(200, 169, 110, 0.06)",
    transform: "scale(1.03)",
  };

  const popularBadgeStyle: React.CSSProperties = {
    position: "absolute",
    top: "16px",
    right: "16px",
    backgroundColor: "#c8a96e",
    color: "#050508",
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: "12px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "8px",
  };

  const cardDescStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: "24px",
    lineHeight: 1.6,
  };

  const priceContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
    marginBottom: "8px",
  };

  const priceStyle: React.CSSProperties = {
    fontSize: "52px",
    fontWeight: 800,
    color: "#c8a96e",
    lineHeight: 1,
    letterSpacing: "-2px",
  };

  const currencyStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    color: "#c8a96e",
    alignSelf: "flex-start",
    marginTop: "8px",
  };

  const durationStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: "28px",
    fontWeight: 500,
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    margin: "24px 0",
  };

  const featuresListStyle: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
    margin: "0 0 32px",
  };

  const featureItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 0",
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: 500,
  };

  const checkIconStyle: React.CSSProperties = {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "rgba(200, 169, 110, 0.15)",
    border: "1px solid rgba(200, 169, 110, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "11px",
    color: "#c8a96e",
  };

  const btnPrimaryStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "16px 24px",
    backgroundColor: "#c8a96e",
    color: "#050508",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    textAlign