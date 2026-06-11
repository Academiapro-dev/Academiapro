export default function LinktreePage() {
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "40px 20px 60px 20px",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
  };

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0px",
  };

  const logoContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "20px",
  };

  const logoCircleStyle: React.CSSProperties = {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #c8a96e 0%, #f0d898 50%, #c8a96e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
    boxShadow: "0 0 30px rgba(200, 169, 110, 0.4), 0 0 60px rgba(200, 169, 110, 0.15)",
  };

  const logoTextInsideStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "900",
    color: "#050508",
    textAlign: "center",
    lineHeight: "1.1",
    letterSpacing: "-0.3px",
  };

  const brandNameStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "800",
    color: "#c8a96e",
    letterSpacing: "0.5px",
    marginBottom: "6px",
    textAlign: "center",
  };

  const taglineStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#a0956e",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "0px",
    textAlign: "center",
  };

  const dividerStyle: React.CSSProperties = {
    width: "60px",
    height: "1px",
    background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
    margin: "16px auto 18px auto",
  };

  const bioStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#c8c8c8",
    textAlign: "center",
    lineHeight: "1.7",
    marginBottom: "28px",
    padding: "0 10px",
  };

  const highlightStyle: React.CSSProperties = {
    color: "#c8a96e",
    fontWeight: "600",
  };

  const buttonsContainerStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "36px",
  };

  const getButtonStyle = (variant: "primary" | "secondary" | "outline" | "featured"): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: "100%",
      padding: "15px 20px",
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: "600",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      transition: "all 0.2s ease",
      boxSizing: "border-box",
      letterSpacing: "0.2px",
    };

    if (variant === "primary") {
      return {
        ...base,
        background: "linear-gradient(135deg, #c8a96e 0%, #f0d898 100%)",
        color: "#050508",
        boxShadow: "0 4px 20px rgba(200, 169, 110, 0.35)",
      };
    }

    if (variant === "featured") {
      return {
        ...base,
        background: "linear-gradient(135deg, #1a1200 0%, #2d1f00 100%)",
        color: "#c8a96e",
        border: "1.5px solid #c8a96e",
        boxShadow: "0 4px 24px rgba(200, 169, 110, 0.25), inset 0 1px 0 rgba(200, 169, 110, 0.1)",
      };
    }

    if (variant === "secondary") {
      return {
        ...base,
        background: "rgba(200, 169, 110, 0.08)",
        color: "#e8e0cc",
        border: "1px solid rgba(200, 169, 110, 0.2)",
      };
    }

    return {
      ...base,
      background: "rgba(255, 255, 255, 0.03)",
      color: "#c8c8c8",
      border: "1px solid rgba(255, 255, 255, 0.08)",
    };
  };

  const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "20px",
    backgroundColor: bg,
    color: color,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
  });

  const buttonLabelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const iconStyle: React.CSSProperties = {
    fontSize: "18px",
    minWidth: "24px",
    textAlign: "center",
  };

  const arrowStyle: React.CSSProperties = {
    fontSize: "16px",
    opacity: 0.7,
  };

  const socialSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
  };

  const socialLabelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#666",
    letterSpacing: "2px",
    textTransform: "uppercase",
  };

  const socialIconsRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  };

  const getSocialButtonStyle = (): React.CSSProperties => ({
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(200, 169, 110, 0.08)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s ease",
  });

  const footerStyle: React.CSSProperties = {
    marginTop: "36px",
    fontSize: "11px",
    color: "#333",
    textAlign: "center",
    letterSpacing: "1px",
  };

  const links = [
    {
      id: 1,
      label: "Voir les 131 formations",
      icon: "🎓",
      variant: "primary" as const,
      href: "#formations",
      badge: null,
      badgeColor: "",
      badgeBg: "",
    },
    {
      id: 2,
      label: "Réserver une séance",
      icon: "📅",
      variant: "secondary" as const,
      href: "#seance",
      badge: "Disponible",
      badgeColor: "#050508",
      badgeBg: "#c8a96e",
    },
    {
      id: 3,
      label: "E-book gratuit",
      icon: "📖",
      variant: "secondary" as const,
      href: "#ebook",
      badge: "Gratuit",
      badgeColor: "#050508",
      badgeBg: "#4caf84",
    },
    {
      id: 4,
      label: "Starter Pack — 47€",
      icon: "⚡",
      variant: "featured" as const,
      href: "#starter",
      badge: "47€",
      badgeColor: "#c8a96e",
      badgeBg: "rgba(200,169,110,0.15)",
    },
    {
      id: 5,
      label: "Pack IA Complet — 2 690€",
      icon: "🚀",
      variant: "featured" as const,
      href: "#pack-complet",
      badge: "2 690€",
      badgeColor: "#f0d898",
      badgeBg: "rgba(200,169,110,0.2)",
    },
    {
      id: 6,
      label: "Rejoindre la communauté",
      icon: "🤝",
      variant: "secondary" as const,
      href: "#communaute",
      badge: null,
      badgeColor: "",
      badgeBg: "",
    },
    {
      id: 7,
      label: "Webinaire gratuit",
      icon: "🎥",
      variant: "secondary" as const,
      href: "#webinaire",
      badge: "Live",
      badgeColor: "#fff",
      badgeBg: "#e53935",
    },
    {
      id: 8,
      label: "Mini-cours 3 jours gratuit",
      icon: "✨",
      variant: "secondary" as const,
      href: "#mini-cours",
      badge: "Gratuit",
      badgeColor: "#050508",
      badgeBg: "#4caf84",
    },
  ];

  const socialLinks = [
    {
      name: "LinkedIn",
      href: "#linkedin",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#c8a96e">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "#instagram",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#c8a96e">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: "#facebook",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#c8a96e">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "TikTok",
      href: "#tiktok",
      svg: (
        <svg width="18" height="18" viewBox="0 0
}}