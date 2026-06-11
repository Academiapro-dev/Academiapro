export default function AcademiaSalesTunnel() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [timeLeft, setTimeLeft] = React.useState(1800);
  const [spotsLeft, setSpotsLeft] = React.useState(7);
  const [selectedFormation, setSelectedFormation] = React.useState<"starter" | "pro">("pro");
  const [selectedPack, setSelectedPack] = React.useState<"essential" | "elite">("elite");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [emailError, setEmailError] = React.useState("");

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 1800;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const spotTimer = setInterval(() => {
      setSpotsLeft((prev) => {
        if (Math.random() < 0.1 && prev > 1) return prev - 1;
        return prev;
      });
    }, 30000);
    return () => clearInterval(spotTimer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleLeadSubmit = () => {
    if (!firstName.trim()) return;
    if (!validateEmail(email)) {
      setEmailError("Veuillez entrer un email valide");
      return;
    }
    setEmailError("");
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStep(1);
    }, 1200);
  };

  const goldGradient = "linear-gradient(135deg, #c8a96e 0%, #e8d5a3 50%, #c8a96e 100%)";
  const darkGold = "#c8a96e";
  const bgColor = "#050508";
  const cardBg = "#0d0d14";
  const cardBorder = "#1a1a2e";

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: bgColor,
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: "#ffffff",
    overflowX: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, #0a0a12 0%, transparent 100%)",
    borderBottom: `1px solid ${cardBorder}`,
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(20px)",
  };

  const logoStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "800",
    background: goldGradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  };

  const urgencyBarStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, #1a0a00 0%, #2a1500 50%, #1a0a00 100%)",
    border: `1px solid ${darkGold}40`,
    padding: "12px 24px",
    textAlign: "center",
    fontSize: "14px",
    color: darkGold,
    fontWeight: "600",
  };

  const stepIndicatorStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    padding: "24px",
  };

  const mainStyle: React.CSSProperties = {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "24px 16px 80px",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: cardBg,
    border: `1px solid ${cardBorder}`,
    borderRadius: "16px",
    padding: "40px 36px",
    marginBottom: "24px",
  };

  const goldCardStyle: React.CSSProperties = {
    ...cardStyle,
    border: `2px solid ${darkGold}`,
    background: `linear-gradient(135deg, #0d0d14 0%, #12100a 100%)`,
    boxShadow: `0 0 40px ${darkGold}20`,
  };

  const h1Style: React.CSSProperties = {
    fontSize: "clamp(28px, 5vw, 42px)",
    fontWeight: "900",
    lineHeight: "1.15",
    marginBottom: "16px",
    letterSpacing: "-1px",
  };

  const goldTextStyle: React.CSSProperties = {
    background: goldGradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const subTextStyle: React.CSSProperties = {
    color: "#8888aa",
    fontSize: "16px",
    lineHeight: "1.7",
    marginBottom: "24px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px 20px",
    backgroundColor: "#080810",
    border: `1px solid ${cardBorder}`,
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const primaryButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "20px",
    background: goldGradient,
    border: "none",
    borderRadius: "12px",
    color: "#050508",
    fontSize: "18px",
    fontWeight: "800",
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: `0 8px 30px ${darkGold}40`,
  };

  const secondaryButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px",
    background: "transparent",
    border: `1px solid ${cardBorder}`,
    borderRadius: "10px",
    color: "#666688",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "12px",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    background: `${darkGold}20`,
    border: `1px solid ${darkGold}40`,
    color: darkGold,
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "20px",
  };

  const strikethroughStyle: React.CSSProperties = {
    textDecoration: "line-through",
    color: "#555570",
    fontSize: "18px",
  };

  const priceStyle: React.CSSProperties = {
    fontSize: "48px",
    fontWeight: "900",
    background: goldGradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: "1",
  };

  const savingsBadgeStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#0a2a0a",
    border: "1px solid #2a5a2a",
    color: "#4aaa4a",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
    marginLeft: "12px",
  };

  const checkItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
    fontSize: "15px",
    color: "#ccccdd",
    lineHeight: "1.5",
  };

  const checkIconStyle: React.CSSProperties = {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: `${darkGold}20`,
    border: `1px solid ${darkGold}60`,
    color: darkGold,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    flexShrink: 0,
    marginTop: "2px",
  };

  const guaranteeBoxStyle: React.CSSProperties = {
    backgroundColor: "#080810",
    border: `1px solid ${cardBorder}`,
    borderRadius: "12px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "20px",
  };

  const dividerStyle: React.CSSProperties = {
    border: "none",
    borderTop: `1px solid ${cardBorder}`,
    margin: "24px 0",
  };

  const counterBoxStyle: React.CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0a0a14",
    border: `1px solid ${darkGold}40`,
    borderRadius: "10px",
    padding: "10px 16px",
    minWidth: "60px",
  };

  const timerContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "28px",
  };

  const timerSepStyle: React.CSSProperties = {
    color: darkGold,
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "16px",
  };

  const optionCardStyle = (selected: boolean): React.CSSProperties => ({
    backgroundColor: selected ? `${darkGold}10` : "#080810",
    border: `2px solid ${selected ? darkGold : cardBorder}`,
    borderRadius: "12px",
    padding: "20px",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  });

  const radioStyle = (selected: boolean): React.CSSProperties => ({
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: `2px solid ${selected ? darkGold : "#444460"}`,
    background: selected ? darkGold : "transparent",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  const progressBarContainerStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#1a1a2e",
    borderRadius: "4px",
    height: "4px",
    marginTop: "8px",
  };

  const socialProofStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#8888aa",
    marginTop: "16px",
  };

  const avatarsStyle: React.CSSProperties = {
    display: "flex",
  };

  const avatarStyle = (index: number): React.CSSProperties => ({
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: `2px solid ${bgColor}`,
    marginLeft: index > 0 ? "-8px" : "0",
    background: `linear-gradient(135deg, ${["#c8a96e", "#6e8ac8", "#c86e8a", "#6ec88a"][index % 4]} 0%, #333 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    color: "#fff",
  });

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "700",
    color: darkGold,
    textTransform: "uppercase" as const,
    letterSpacing: "2px",
    marginBottom: "8px",
  };

  const testimonialStyle: React.CSSProperties = {
    backgroundColor: "#080810",
    border: `1px solid ${cardBorder}`,
    borderRadius: "10px",
    padding: "16px 20px",
    marginBottom: "12px",
  };

  const starsStyle: React.CSSProperties = {
    color: darkGold,
    fontSize: "14px",
    marginBottom: "6px",
  };

  const steps = ["Accès Gratuit", "Starter Pack", "Formation", "Pack Expert"];

  const renderStepIndicator = () => (
    <div style={stepIndicatorStyle}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: i <= currentStep ? goldGradient : "#1a1a2e",
                border: `2px solid ${i <= currentStep ? darkGold : "#2a2a3e"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "700",
                color: i <= currentStep ? "#050508" : "#555570",
              }}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "10px", color: i <= currentStep ? darkGold : "#555570", fontWeight: "600", whiteSpace: "nowrap" as const }}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: "2px",
                background: i < currentStep ? goldGradient : "#1a1a2e",
                marginBottom: "16px",
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderTimer = () => {
    const minutes = Math.floor(timeLeft / 60