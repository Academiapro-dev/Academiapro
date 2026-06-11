export default function EssaiGratuit() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        color: "#ffffff",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 20px",
      }}
    >
      {/* Header */}
      <header
        style={{
          width: "100%",
          maxWidth: "1100px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "28px 0 24px 0",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          marginBottom: "0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #c8a96e 0%, #e8d4a0 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "800",
              color: "#050508",
            }}
          >
            A
          </div>
          <span
            style={{
              fontSize: "20px",
              fontWeight: "700",
              letterSpacing: "-0.3px",
              color: "#ffffff",
            }}
          >
            Académ<span style={{ color: "#c8a96e" }}>IA</span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#c8a96e",
                marginLeft: "6px",
                border: "1px solid #c8a96e",
                borderRadius: "4px",
                padding: "1px 6px",
                verticalAlign: "middle",
                letterSpacing: "0.5px",
              }}
            >
              PRO
            </span>
          </span>
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Propulsé par{" "}
          <span style={{ color: "#c8a96e", fontWeight: "600" }}>
            Expert Claude · F128
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          width: "100%",
          maxWidth: "760px",
          textAlign: "center",
          paddingTop: "72px",
          paddingBottom: "56px",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(200,169,110,0.1)",
            border: "1px solid rgba(200,169,110,0.3)",
            borderRadius: "50px",
            padding: "7px 18px",
            marginBottom: "36px",
          }}
        >
          <span style={{ fontSize: "14px" }}>✦</span>
          <span
            style={{
              fontSize: "13px",
              color: "#c8a96e",
              fontWeight: "600",
              letterSpacing: "0.4px",
            }}
          >
            ACCÈS GRATUIT · SANS CARTE BANCAIRE
          </span>
          <span style={{ fontSize: "14px" }}>✦</span>
        </div>

        {/* Titre principal */}
        <h1
          style={{
            fontSize: "clamp(38px, 6vw, 62px)",
            fontWeight: "800",
            lineHeight: "1.1",
            letterSpacing: "-1.5px",
            margin: "0 0 28px 0",
            color: "#ffffff",
          }}
        >
          Découvre le{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #c8a96e 0%, #e8d4a0 60%, #c8a96e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Module 1
          </span>
          <br />
          d'Expert Claude F128
        </h1>

        {/* Sous-titre */}
        <p
          style={{
            fontSize: "18px",
            lineHeight: "1.7",
            color: "rgba(255,255,255,0.6)",
            margin: "0 0 12px 0",
            maxWidth: "580px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Lance ton essai gratuit de{" "}
          <span style={{ color: "#ffffff", fontWeight: "600" }}>2 heures</span>{" "}
          et accède au premier module de la formation la plus avancée en
          intelligence artificielle appliquée.
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "rgba(200,169,110,0.7)",
            margin: "0 0 52px 0",
            fontWeight: "500",
          }}
        >
          Aucun engagement · Aucune carte bancaire requise
        </p>

        {/* Formulaire */}
        <EssaiForm />
      </section>

      {/* Divider */}
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(200,169,110,0.3), transparent)",
          margin: "0 0 72px 0",
        }}
      />

      {/* Ce que tu découvres */}
      <section
        style={{
          width: "100%",
          maxWidth: "1100px",
          paddingBottom: "80px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: "700",
              letterSpacing: "-0.8px",
              color: "#ffffff",
              margin: "0 0 14px 0",
            }}
          >
            Ce que tu{" "}
            <span style={{ color: "#c8a96e" }}>découvres</span> dans ce module
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.45)",
              margin: "0",
            }}
          >
            2 heures de contenu dense, structuré et immédiatement actionnable.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          <FeatureCard
            icon="⚡"
            number="01"
            title="Fondations Expert Claude"
            description="Comprends l'architecture de raisonnement avancé de Claude F128 et comment exploiter ses capacités à leur plein potentiel dès la première interaction."
          />
          <FeatureCard
            icon="🧠"
            number="02"
            title="Ingénierie du Prompt Avancée"
            description="Maîtrise les techniques de prompting de niveau expert : chaînes de pensée, méta-instructions et structures de contexte qui multiplient la qualité des résultats."
          />
          <FeatureCard
            icon="🎯"
            number="03"
            title="Cas d'Usage Professionnels"
            description="Applique immédiatement ce que tu apprends avec 12 cas d'usage réels issus des domaines : business, création de contenu, analyse et automatisation."
          />
          <FeatureCard
            icon="📐"
            number="04"
            title="Frameworks & Templates"
            description="Récupère 8 templates prêts à l'emploi et 3 frameworks propriétaires développés spécifiquement pour les utilisateurs d'AcadémIA Pro."
          />
          <FeatureCard
            icon="🔬"
            number="05"
            title="Analyse & Itération"
            description="Apprends à évaluer la qualité des outputs, identifier les axes d'amélioration et itérer rapidement pour des résultats toujours plus précis."
          />
          <FeatureCard
            icon="🚀"
            number="06"
            title="Passage à l'Action"
            description="Termine le module avec un plan d'action personnalisé de 7 jours et les premières briques de ton système IA adapté à ta situation."
          />
        </div>
      </section>

      {/* Durée + Stats */}
      <section
        style={{
          width: "100%",
          maxWidth: "1100px",
          marginBottom: "80px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(200,169,110,0.05)",
            border: "1px solid rgba(200,169,110,0.2)",
            borderRadius: "20px",
            padding: "48px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "32px",
            textAlign: "center",
          }}
        >
          <StatItem value="2h" label="Durée totale du module" />
          <StatItem value="6" label="Leçons structurées" />
          <StatItem value="8" label="Templates inclus" />
          <StatItem value="12" label="Cas d'usage réels" />
          <StatItem value="100%" label="Gratuit, sans CB" />
        </div>
      </section>

      {/* Divider */}
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(200,169,110,0.3), transparent)",
          margin: "0 0 80px 0",
        }}
      />

      {/* Après l'essai - Upsell Starter Pack */}
      <section
        style={{
          width: "100%",
          maxWidth: "680px",
          marginBottom: "100px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(200,169,110,0.08)",
            border: "1px solid rgba(200,169,110,0.2)",
            borderRadius: "50px",
            padding: "6px 16px",
            marginBottom: "28px",
          }}
        >
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
            APRÈS TON ESSAI GRATUIT
          </span>
        </div>

        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: "800",
            letterSpacing: "-1px",
            color: "#ffffff",
            margin: "0 0 20px 0",
            lineHeight: "1.15",
          }}
        >
          Continue avec le{" "}
          <span style={{ color: "#c8a96e" }}>Starter Pack</span>
        </h2>

        <p
          style={{
            fontSize: "17px",
            lineHeight: "1.65",
            color: "rgba(255,255,255,0.55)",
            margin: "0 0 44px 0",
          }}
        >
          Si tu veux aller plus loin après ton essai, accède à l'intégralité de
          la formation F128 Expert Claude, les modules avancés, la communauté
          privée et le suivi personnalisé.
        </p>

        {/* Carte Starter Pack */}
        <div
          style={{
            backgroundColor: "#0a0a0f",
            border: "1px solid rgba(200,169,110,0.35)",
            borderRadius: "20px",
            padding: "40px 44px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow effect */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "300px",
              height: "200px",
              background:
                "radial-gradient(ellipse, rgba(200,169,110,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(200,169,110,0.15)",
              borderRadius: "8px",
              padding: "5px 14px",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#c8a96e", fontWeight: "700", letterSpacing: "0.5px" }}>
              🎯 OFFRE POST-ESSAI
            </span>
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.4)",
              marginBottom: "8px",
              textDecoration: "line-through",
            }}
          >
            Valeur réelle : 197€
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "64px",
                fontWeight: "800",
                color: "#c8a96e",
                letterSpacing: "-2px",
                lineHeight: "1",
              }}
            >
              47€
            </span>
            <span
              style={{
                fontSize: "16px",
                color: "rgba(255,255,255,0.4)",
                fontWeight: "400",
              }}
            >
              accès complet
            </span>
          </div>

          <p
            style={{
              fontSize: "14px",
              color: "rgba(200,169,110,0.6)",
              margin: "0 0 32px 0",
              fontWeight: "500",
            }}
          >
            Paiement unique · Accès à vie · Satisfait ou remboursé 30 jours
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: "0",
              margin: "0 0 36px 0",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
}}}