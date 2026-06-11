export default async function SeancesPage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user ?? null;

  const specialties = [
    {
      id: 1,
      name: "Psychothérapie Cognitive",
      description: "Restructuration des schémas de pensée négatifs et développement de nouvelles perspectives mentales adaptatives.",
      icon: "🧠",
      duration: "50 min",
      category: "Cognition",
    },
    {
      id: 2,
      name: "Thérapie Comportementale",
      description: "Modification des comportements inadaptés par des techniques de conditionnement et d'exposition progressive.",
      icon: "🔄",
      duration: "45 min",
      category: "Comportement",
    },
    {
      id: 3,
      name: "Analyse Émotionnelle",
      description: "Identification et régulation des émotions complexes pour une meilleure intelligence émotionnelle quotidienne.",
      icon: "💫",
      duration: "55 min",
      category: "Émotions",
    },
    {
      id: 4,
      name: "Hypnothérapie Clinique",
      description: "Accès à l'inconscient profond pour débloquer des ressources intérieures et traiter des traumatismes enfouis.",
      icon: "🌀",
      duration: "60 min",
      category: "Inconscient",
    },
    {
      id: 5,
      name: "Thérapie EMDR",
      description: "Désensibilisation par mouvements oculaires pour le traitement des troubles post-traumatiques complexes.",
      icon: "👁️",
      duration: "75 min",
      category: "Trauma",
    },
    {
      id: 6,
      name: "Pleine Conscience",
      description: "Pratiques de mindfulness et méditation guidée pour ancrer la présence et réduire l'anxiété chronique.",
      icon: "🍃",
      duration: "40 min",
      category: "Méditation",
    },
    {
      id: 7,
      name: "Thérapie Systémique",
      description: "Analyse des dynamiques relationnelles familiales et sociales impactant l'équilibre psychologique individuel.",
      icon: "🕸️",
      duration: "60 min",
      category: "Relations",
    },
    {
      id: 8,
      name: "Psychanalyse Brève",
      description: "Exploration ciblée des conflits inconscients et des mécanismes de défense dans un cadre thérapeutique structuré.",
      icon: "🔍",
      duration: "50 min",
      category: "Inconscient",
    },
    {
      id: 9,
      name: "Gestion du Stress",
      description: "Techniques avancées de relaxation, biofeedback et restructuration cognitive pour neutraliser le stress chronique.",
      icon: "⚡",
      duration: "45 min",
      category: "Stress",
    },
    {
      id: 10,
      name: "Thérapie Narrative",
      description: "Réécriture de son histoire personnelle pour transformer les récits limitants en récits de croissance et de résilience.",
      icon: "📖",
      duration: "55 min",
      category: "Identité",
    },
    {
      id: 11,
      name: "Art-thérapie Digitale",
      description: "Expression créative assistée par IA pour extérioriser les émotions refoulées et reconstruire l'estime de soi.",
      icon: "🎨",
      duration: "60 min",
      category: "Créativité",
    },
    {
      id: 12,
      name: "Coaching Existentiel",
      description: "Questionnement philosophique profond sur le sens, les valeurs et la direction de vie pour une existence authentique.",
      icon: "🌟",
      duration: "50 min",
      category: "Sens",
    },
    {
      id: 13,
      name: "Thérapie Somatique",
      description: "Libération des tensions corporelles liées aux traumatismes psychologiques via des techniques corps-esprit intégrées.",
      icon: "🫀",
      duration: "65 min",
      category: "Corps",
    },
    {
      id: 14,
      name: "Neurofeedback IA",
      description: "Entraînement cérébral augmenté par intelligence artificielle pour optimiser les ondes cérébrales et la neuroplasticité.",
      icon: "🤖",
      duration: "70 min",
      category: "Neurosciences",
    },
  ];

  const pricingPlans = [
    {
      id: "decouverte",
      name: "Découverte",
      price: 29,
      color: "#a0a0b0",
      features: ["1 séance d'introduction", "Bilan initial IA", "Support email 48h", "Accès ressources de base"],
    },
    {
      id: "standard",
      name: "Standard",
      price: 59,
      color: "#c8a96e",
      features: ["4 séances par mois", "Suivi personnalisé IA", "Support prioritaire 24h", "Accès bibliothèque complète", "Rapport mensuel"],
      recommended: true,
    },
    {
      id: "expert",
      name: "Expert",
      price: 79,
      color: "#e8c97e",
      features: ["8 séances par mois", "Thérapeute dédié IA", "Support illimité 24/7", "Toutes spécialités incluses", "Rapport hebdomadaire", "Sessions groupe VIP"],
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e8e8f0",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "rgba(5, 5, 8, 0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
          padding: "0 2rem",
          height: "70px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#050508",
            }}
          >
            A
          </div>
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: "700",
              background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AcadémIA Pro
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <a
            href="/"
            style={{
              color: "rgba(232, 232, 240, 0.6)",
              textDecoration: "none",
              fontSize: "0.9rem",
              transition: "color 0.2s",
            }}
          >
            Accueil
          </a>
          <a
            href="/seances"
            style={{
              color: "#c8a96e",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            Séances
          </a>
          <a
            href="/about"
            style={{
              color: "rgba(232, 232, 240, 0.6)",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            À propos
          </a>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#050508",
                }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: "0.85rem", color: "rgba(232, 232, 240, 0.7)" }}>
                {user.email?.split("@")[0]}
              </span>
            </div>
          ) : (
            <a
              href="/login"
              style={{
                padding: "8px 20px",
                background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
                color: "#050508",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Connexion
            </a>
          )}
        </nav>
      </div>

      <div style={{ paddingTop: "70px" }}>
        <div
          style={{
            position: "relative",
            padding: "5rem 2rem 4rem",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "600px",
              height: "400px",
              background: "radial-gradient(ellipse, rgba(200, 169, 110, 0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "100px",
              border: "1px solid rgba(200, 169, 110, 0.3)",
              backgroundColor: "rgba(200, 169, 110, 0.05)",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "#c8a96e", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Thérapie Augmentée par IA
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: "800",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#e8e8f0" }}>Vos Séances</span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #e8c97e 50%, #c8a96e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Thérapeutiques
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "rgba(232, 232, 240, 0.55)",
              maxWidth: "600px",
              margin: "0 auto 2rem",
              lineHeight: 1.7,
            }}
          >
            14 spécialités thérapeutiques guidées par intelligence artificielle. 
            Un accompagnement personnalisé, confidentiel et disponible à tout moment.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
            {[
              { value: "14", label: "Spécialités" },
              { value: "98%", label: "Satisfaction" },
              { value: "24/7", label: "Disponibilité" },
              { value: "50K+", label: "Patients" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.8rem", color: "rgba(232, 232, 240, 0.45)", marginTop: "2px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "2rem 2rem 5rem", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: "700",
                color: "#e8e8f0",
                marginBottom: "0.75rem",
              }}
            >
              Nos Spécialités Thérapeutiques
            </h2>
            <p style={{ color: "rgba(232, 232, 240, 0.45)", fontSize: "0.95rem" }}>
              Choisissez la spécialité qui correspond à vos besoins
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap
}}}