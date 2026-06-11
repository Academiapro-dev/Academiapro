import React from "react";

const App: React.FC = () => {
  const bgColor = "#050508";
  const goldColor = "#c8a96e";
  const darkCard = "#0e0e14";
  const borderGold = "1px solid #c8a96e44";

  const links = [
    {
      id: 1,
      label: "131 Formations",
      emoji: "🎓",
      url: "#",
    },
    {
      id: 2,
      label: "Séance",
      emoji: "🎯",
      url: "#",
    },
    {
      id: 3,
      label: "Ebook",
      emoji: "📖",
      url: "#",
    },
    {
      id: 4,
      label: "Starter Pack",
      emoji: "🚀",
      url: "#",
    },
    {
      id: 5,
      label: "IA Complet",
      emoji: "🤖",
      url: "#",
    },
    {
      id: 6,
      label: "Communauté",
      emoji: "👥",
      url: "#",
    },
    {
      id: 7,
      label: "Webinaire",
      emoji: "🎙️",
      url: "#",
    },
    {
      id: 8,
      label: "Mini-Cours",
      emoji: "⚡",
      url: "#",
    },
  ];

  const socials = [
    {
      id: 1,
      label: "Instagram",
      url: "#",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={goldColor}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      id: 2,
      label: "TikTok",
      url: "#",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={goldColor}>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
        </svg>
      ),
    },
    {
      id: 3,
      label: "YouTube",
      url: "#",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={goldColor}>
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      id: 4,
      label: "Twitter / X",
      url: "#",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={goldColor}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.626L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
      ),
    },
    {
      id: 5,
      label: "LinkedIn",
      url: "#",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={goldColor}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ];

  const [hoveredBtn, setHoveredBtn] = React.useState<number | null>(null);
  const [hoveredSocial, setHoveredSocial] = React.useState<number | null>(null);

  return (
    <div
      style={{
        backgroundColor: bgColor,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        padding: "0 0 40px 0",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "0 20px",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER / BIO */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "44px",
            paddingBottom: "28px",
          }}
        >
          {/* Logo / Avatar */}
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e 0%, #f0d898 50%, #c8a96e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              boxShadow: "0 0 32px #c8a96e55",
            }}
          >
            <span style={{ fontSize: "38px" }}>✦</span>
          </div>

          {/* Name */}
          <h1
            style={{
              color: goldColor,
              fontSize: "22px",
              fontWeight: "700",
              margin: "0 0 6px 0",
              letterSpacing: "0.04em",
              textAlign: "center",
            }}
          >
            @VotreNom
          </h1>

          {/* Bio */}
          <p
            style={{
              color: "#999",
              fontSize: "13px",
              margin: "0",
              textAlign: "center",
              lineHeight: "1.6",
              maxWidth: "280px",
            }}
          >
            Coach · Formateur · Créateur de contenu
            <br />
            Je t&apos;aide à passer au niveau supérieur 🚀
          </p>

          {/* Gold divider */}
          <div
            style={{
              width: "48px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
              marginTop: "20px",
            }}
          />
        </div>

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
          }}
        >
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                backgroundColor: hoveredBtn === link.id ? "#1a1a24" : darkCard,
                border: hoveredBtn === link.id ? "1px solid #c8a96e99" : borderGold,
                borderRadius: "14px",
                padding: "16px 20px",
                textDecoration: "none",
                color: hoveredBtn === link.id ? "#f0d898" : goldColor,
                fontSize: "15px",
                fontWeight: "600",
                letterSpacing: "0.03em",
                transition: "all 0.2s ease",
                boxShadow: hoveredBtn === link.id ? "0 0 18px #c8a96e22" : "none",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredBtn(link.id)}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <span style={{ fontSize: "20px" }}>{link.emoji}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </div>

        {/* DIVIDER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "36px 0 28px 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "linear-gradient(90deg, transparent, #c8a96e44)",
            }}
          />
          <span style={{ color: "#c8a96e66", fontSize: "11px", letterSpacing: "0.15em" }}>
            RETROUVE-MOI
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "linear-gradient(90deg, #c8a96e44, transparent)",
            }}
          />
        </div>

        {/* SOCIAL ICONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {socials.map((social) => (
            <a
              key={social.id}
              href={social.url}
              title={social.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundColor: hoveredSocial === social.id ? "#1a1a24" : darkCard,
                border: hoveredSocial === social.id ? "1px solid #c8a96eaa" : borderGold,
                boxShadow: hoveredSocial === social.id ? "0 0 16px #c8a96e33" : "none",
                transition: "all 0.2s ease",
                cursor: "pointer",
                opacity: hoveredSocial === social.id ? 1 : 0.75,
              }}