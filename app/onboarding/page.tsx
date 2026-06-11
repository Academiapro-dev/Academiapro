export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    firstName: "",
    jobTitle: "",
    mainObjective: "",
    aiLevel: "",
    budget: "",
  });
  const [recommendations, setRecommendations] = React.useState<string[]>([]);

  const steps = [
    "Bienvenue",
    "Profil",
    "Objectifs",
    "Recommandations",
    "Premier Accès",
  ];

  const generateRecommendations = () => {
    const recs: string[] = [];

    if (formData.aiLevel === "debutant") {
      recs.push("🎯 Introduction à l'IA : Les fondamentaux expliqués simplement");
      recs.push("🤖 ChatGPT & LLMs : Maîtrisez les outils conversationnels");
    } else if (formData.aiLevel === "intermediaire") {
      recs.push("⚡ Prompt Engineering Avancé : Techniques expertes");
      recs.push("🔧 Automatisation avec l'IA : Workflows intelligents");
    } else if (formData.aiLevel === "avance") {
      recs.push("🧠 Fine-tuning de modèles : Personnalisez votre IA");
      recs.push("🚀 Déploiement MLOps : De la recherche à la production");
    }

    if (formData.mainObjective === "productivite") {
      recs.push("⏱️ IA & Productivité : Doublez votre efficacité au travail");
    } else if (formData.mainObjective === "reconversion") {
      recs.push("💼 Reconversion Tech : Devenez expert IA en 6 mois");
    } else if (formData.mainObjective === "entreprise") {
      recs.push("🏢 IA pour les entreprises : Stratégie et implémentation");
    } else if (formData.mainObjective === "creation") {
      recs.push("🎨 IA Créative : Images, vidéos et contenu génératif");
    }

    if (formData.budget === "gratuit") {
      recs.push("🆓 Parcours Gratuit Certifiant : 40h de contenu premium offert");
    } else if (formData.budget === "premium") {
      recs.push("👑 Accès Premium Total : Coaching 1-to-1 inclus");
    } else if (formData.budget === "entreprise") {
      recs.push("🏆 Licence Entreprise : Formation d'équipe sur mesure");
    }

    if (recs.length === 0) {
      recs.push("🌟 Parcours Découverte IA : Le meilleur point de départ");
      recs.push("📚 Bibliothèque complète : 200+ formations disponibles");
    }

    return recs;
  };

  const handleNext = () => {
    if (currentStep === 2) {
      const recs = generateRecommendations();
      setRecommendations(recs);
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return formData.firstName.trim() !== "" && formData.jobTitle.trim() !== "";
    }
    if (currentStep === 2) {
      return formData.mainObjective !== "" && formData.aiLevel !== "" && formData.budget !== "";
    }
    return true;
  };

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: "20px",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "680px",
    backgroundColor: "#0d0d14",
    borderRadius: "24px",
    border: "1px solid #1e1e2e",
    padding: "48px",
    boxShadow: "0 0 60px rgba(200, 169, 110, 0.08), 0 20px 60px rgba(0,0,0,0.5)",
  };

  const logoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "36px",
    justifyContent: "center",
  };

  const logoIconStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    background: "linear-gradient(135deg, #c8a96e, #a07840)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  };

  const logoAccentStyle: React.CSSProperties = {
    color: "#c8a96e",
  };

  const progressContainerStyle: React.CSSProperties = {
    marginBottom: "40px",
  };

  const stepsLabelStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  };

  const progressBarBgStyle: React.CSSProperties = {
    height: "4px",
    backgroundColor: "#1e1e2e",
    borderRadius: "2px",
    overflow: "hidden",
  };

  const progressBarFillStyle: React.CSSProperties = {
    height: "100%",
    width: `${((currentStep + 1) / steps.length) * 100}%`,
    background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
    borderRadius: "2px",
    transition: "width 0.4s ease",
  };

  const stepDotsStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "14px",
    position: "relative",
  };

  const getStepDotStyle = (index: number): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    flex: 1,
  });

  const getDotStyle = (index: number): React.CSSProperties => ({
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: index <= currentStep ? "#c8a96e" : "#1e1e2e",
    color: index <= currentStep ? "#050508" : "#555",
    border: index === currentStep ? "2px solid #e8c98e" : "2px solid transparent",
    transition: "all 0.3s ease",
    boxShadow: index === currentStep ? "0 0 12px rgba(200,169,110,0.5)" : "none",
  });

  const getDotLabelStyle = (index: number): React.CSSProperties => ({
    fontSize: "10px",
    color: index <= currentStep ? "#c8a96e" : "#444",
    fontWeight: index === currentStep ? "600" : "400",
    textAlign: "center",
    transition: "color 0.3s ease",
  });

  const titleStyle: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "8px",
    lineHeight: "1.2",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "15px",
    color: "#888",
    marginBottom: "32px",
    lineHeight: "1.5",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#c8a96e",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    backgroundColor: "#0a0a12",
    border: "1px solid #2a2a3e",
    borderRadius: "12px",
    color: "#ffffff",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    marginBottom: "20px",
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: "4px",
  };

  const radioGroupStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "20px",
  };

  const getRadioCardStyle = (value: string, field: string): React.CSSProperties => {
    const isSelected = formData[field as keyof typeof formData] === value;
    return {
      padding: "14px 16px",
      backgroundColor: isSelected ? "rgba(200, 169, 110, 0.12)" : "#0a0a12",
      border: isSelected ? "1px solid #c8a96e" : "1px solid #2a2a3e",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: isSelected ? "#c8a96e" : "#888",
      fontSize: "14px",
      fontWeight: isSelected ? "600" : "400",
    };
  };

  const radioIndicatorStyle = (value: string, field: string): React.CSSProperties => {
    const isSelected = formData[field as keyof typeof formData] === value;
    return {
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      border: isSelected ? "5px solid #c8a96e" : "2px solid #444",
      transition: "all 0.2s",
      flexShrink: 0,
    };
  };

  const buttonRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    marginTop: "32px",
  };

  const backButtonStyle: React.CSSProperties = {
    padding: "14px 24px",
    backgroundColor: "transparent",
    border: "1px solid #2a2a3e",
    borderRadius: "12px",
    color: "#888",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const nextButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: "14px 24px",
    background: isStepValid()
      ? "linear-gradient(135deg, #c8a96e, #a07840)"
      : "#1e1e2e",
    border: "none",
    borderRadius: "12px",
    color: isStepValid() ? "#050508" : "#555",
    fontSize: "15px",
    fontWeight: "700",
    cursor: isStepValid() ? "pointer" : "not-allowed",
    transition: "all 0.2s",
    letterSpacing: "0.2px",
  };

  const recCardStyle: React.CSSProperties = {
    padding: "18px 20px",
    backgroundColor: "rgba(200, 169, 110, 0.06)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "14px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const recTextStyle: React.CSSProperties = {
    color: "#e0e0e0",
    fontSize: "15px",
    fontWeight: "500",
    flex: 1,
  };

  const recBadgeStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "700",
    color: "#c8a96e",
    backgroundColor: "rgba(200, 169, 110, 0.15)",
    padding: "3px 10px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  };

  const welcomeIconStyle: React.CSSProperties = {
    width: "72px",
    height: "72px",
    background: "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.05))",
    border: "1px solid rgba(200,169,110,0.3)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    marginBottom: "24px",
  };

  const featureListStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "8px",
  };

  const featureItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    backgroundColor: "#0a0a12",
    border: "1px solid #1a1a2e",
    borderRadius: "12px",
  };

  const featureIconStyle: React.CSSProperties = {
    fontSize: "20px",
    width: "32px",
    textAlign: "center",
  };

  const featureTextStyle: React.CSSProperties = {
    color: "#c0c0c0",
    fontSize: "14px",
    fontWeight: "500",
  };

  const finalCardStyle: React.CSSProperties = {
    padding: "24px",
    backgroundColor: "rgba(200, 169, 110, 0.08)",
    border: "1px solid rgba(200, 169, 110, 0.25)",
    borderRadius: "16px",
    marginBottom: "24px",
    textAlign: "center",
  };

  const finalGreetingStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "800",
    color: "#c8a96e",
    marginBottom: "8px",
  };

  const finalSubStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#888",
    lineHeight: "1.5",
  };

  const