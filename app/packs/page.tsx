export default function PacksFormations() {
  const packs = [
    {
      name: "Starter Pack IA",
      price: 47,
      tag: "Découverte",
      color: "#c8a96e",
      popular: false,
      features: [
        "Accès aux modules fondamentaux IA",
        "Vidéos de formation HD",
        "Support par email",
        "Accès 6 mois",
        "Certificat de participation",
      ],
    },
    {
      name: "Pack Starter Complet",
      price: 97,
      tag: "Essentiel",
      color: "#c8a96e",
      popular: false,
      features: [
        "Tout le Starter Pack IA",
        "Exercices pratiques guidés",
        "Accès communauté privée",
        "Accès 12 mois",
        "Certification AcadémIA Pro",
        "Ressources téléchargeables",
      ],
    },
    {
      name: "Pack Skills IA",
      price: 597,
      tag: "Compétences",
      color: "#c8a96e",
      popular: false,
      features: [
        "Tout le Pack Starter Complet",
        "Formation avancée ChatGPT & Midjourney",
        "Automatisation & workflows IA",
        "Projets réels encadrés",
        "Accès à vie",
        "Certification AcadémIA Pro",
        "Mentorat en groupe mensuel",
      ],
    },
    {
      name: "Pack Marketing Digital",
      price: 1490,
      tag: "Marketing",
      color: "#d4af37",
      popular: false,
      features: [
        "Tout le Pack Skills IA",
        "Stratégie marketing digital complète",
        "Copywriting IA & SEO",
        "Publicité Facebook & Google Ads",
        "Création de contenu automatisée",
        "Accès à vie",
        "Certification AcadémIA Pro",
        "2 sessions mentorat individuel",
      ],
    },
    {
      name: "Pack IA Complet",
      price: 2690,
      tag: "Populaire",
      color: "#c8a96e",
      popular: true,
      features: [
        "Tout le Pack Marketing Digital",
        "Formation complète toutes IAs",
        "Création d'agents IA personnalisés",
        "Monétisation par l'IA",
        "Templates & prompts exclusifs",
        "Accès à vie + mises à jour",
        "Certification AcadémIA Pro",
        "4 sessions mentorat individuel",
        "Accès aux lives hebdomadaires",
      ],
    },
    {
      name: "Pack IA Skills",
      price: 2990,
      tag: "Expert",
      color: "#d4af37",
      popular: false,
      features: [
        "Tout le Pack IA Complet",
        "Maîtrise experte de l'écosystème IA",
        "Développement no-code & low-code",
        "Intégrations API avancées",
        "Formation vente de services IA",
        "Accès à vie + mises à jour",
        "Certification AcadémIA Pro Expert",
        "6 sessions mentorat individuel",
        "Accès prioritaire nouveaux modules",
      ],
    },
    {
      name: "Pack Entrepreneur Digital",
      price: 3490,
      tag: "Entrepreneur",
      color: "#c8a96e",
      popular: false,
      features: [
        "Tout le Pack IA Skills",
        "Création & lancement business digital",
        "Tunnel de vente automatisé",
        "Formation recrutement & délégation",
        "Stratégie de personal branding",
        "Accès à vie + mises à jour",
        "Certification AcadémIA Pro Business",
        "8 sessions mentorat individuel",
        "Accès au mastermind mensuel",
        "Revue de votre business plan",
      ],
    },
    {
      name: "Pack Entrepreneur Elite",
      price: 3990,
      tag: "Elite",
      color: "#d4af37",
      popular: false,
      features: [
        "Tout le Pack Entrepreneur Digital",
        "Programme Elite 12 semaines intensif",
        "Accompagnement personnalisé complet",
        "Accès direct au fondateur",
        "Partenariat & opportunités business",
        "Accès à vie + toutes mises à jour",
        "Certification AcadémIA Pro Elite",
        "Sessions mentorat illimitées",
        "Accès VIP tous événements live",
        "Réseau exclusif entrepreneurs Elite",
        "Garantie résultats ou remboursé",
      ],
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px 60px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            background:
              "radial-gradient(ellipse at center, rgba(200,169,110,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "inline-block",
            backgroundColor: "rgba(200,169,110,0.1)",
            border: "1px solid rgba(200,169,110,0.3)",
            borderRadius: "50px",
            padding: "8px 24px",
            marginBottom: "24px",
            fontSize: "13px",
            color: "#c8a96e",
            letterSpacing: "2px",
            textTransform: "uppercase" as const,
          }}
        >
          Formations Premium
        </div>
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: "800",
            margin: "0 0 20px",
            lineHeight: "1.1",
            background: "linear-gradient(135deg, #ffffff 0%, #c8a96e 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AcadémIA Pro
        </h1>
        <p
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "rgba(255,255,255,0.6)",
            maxWidth: "600px",
            margin: "0 auto 40px",
            lineHeight: "1.6",
          }}
        >
          Maîtrisez l'intelligence artificielle et transformez votre carrière ou
          votre business avec nos formations d'excellence.
        </p>

        {/* Badges */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap" as const,
            gap: "16px",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          {[
            { icon: "🏆", text: "Certification AcadémIA Pro" },
            { icon: "💳", text: "Paiement 3x sans frais" },
            { icon: "🛡️", text: "Garantie 30 jours" },
          ].map((badge, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(200,169,110,0.08)",
                border: "1px solid rgba(200,169,110,0.25)",
                borderRadius: "40px",
                padding: "10px 20px",
                fontSize: "14px",
                color: "#c8a96e",
                fontWeight: "500",
              }}
            >
              <span style={{ fontSize: "16px" }}>{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </div>
      </div>

      {/* Packs Grid */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 20px 100px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {packs.map((pack, index) => (
          <div
            key={index}
            style={{
              position: "relative",
              backgroundColor: pack.popular
                ? "rgba(200,169,110,0.06)"
                : "rgba(255,255,255,0.02)",
              border: pack.popular
                ? "1px solid rgba(200,169,110,0.5)"
                : "1px solid rgba(255,255,255,0.07)",
              borderRadius: "20px",
              padding: "32px",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              boxShadow: pack.popular
                ? "0 0 40px rgba(200,169,110,0.12), inset 0 1px 0 rgba(200,169,110,0.2)"
                : "0 4px 24px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column" as const,
              gap: "24px",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(-6px)";
              el.style.boxShadow = pack.popular
                ? "0 20px 60px rgba(200,169,110,0.2), inset 0 1px 0 rgba(200,169,110,0.2)"
                : "0 20px 60px rgba(200,169,110,0.1)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = pack.popular
                ? "0 0 40px rgba(200,169,110,0.12), inset 0 1px 0 rgba(200,169,110,0.2)"
                : "0 4px 24px rgba(0,0,0,0.3)";
            }}
          >
            {/* Popular badge */}
            {pack.popular && (
              <div
                style={{
                  position: "absolute",
                  top: "-14px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background:
                    "linear-gradient(135deg, #c8a96e 0%, #d4af37 100%)",
                  color: "#050508",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "2px",
                  textTransform: "uppercase" as const,
                  padding: "6px 20px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap" as const,
                }}
              >
                ⭐ Le Plus Choisi
              </div>
            )}

            {/* Header */}
            <div>
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: `rgba(200,169,110,0.12)`,
                  border: `1px solid rgba(200,169,110,0.2)`,
                  borderRadius: "20px",
                  padding: "4px 14px",
                  fontSize: "11px",
                  color: pack.color,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase" as const,
                  fontWeight: "600",
                  marginBottom: "12px",
                }}
              >
                {pack.tag}
              </div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                  color: "#ffffff",
                  lineHeight: "1.2",
                }}
              >
                {pack.name}
              </h2>
            </div>

            {/* Price */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "20px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "4px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "44px",
                    fontWeight: "800",
                    lineHeight: "1",
                    color: pack.color,
                    letterSpacing: "-2px",
                  }}
                >
                  {pack.price.toLocaleString("fr-FR")}€
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                ou{" "}
                <span style={{ color: pack.color, fontWeight: "600" }}>
                  3x {Math.round(pack.price / 3).toLocaleString("fr-FR")}€
                </span>{" "}
                sans frais
              </div>
            </div>

            {/* Features */}
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column" as const,
                gap: "10px",
                flex: 1,
              }}
            >
              {pack.features.map((feature, fi) => (
                <li
                  key={fi}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.75)",
                    lineHeight: "1.4",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(200,169,110,0.15)",
                      border: "1px solid rgba(200,169,110,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "1px",
                      fontSize: "10px",
                      color: "#c8a96e",
                    }}
                  >
                    ✓