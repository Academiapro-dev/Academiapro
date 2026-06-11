export default function SeancesTherapeutiques() {
  const specialites = [
    { nom: "Hypnose", emoji: "🌀", description: "Accédez à votre inconscient pour transformer vos schémas limitants" },
    { nom: "PNL", emoji: "🧠", description: "Reprogrammez vos pensées avec la Programmation Neuro-Linguistique" },
    { nom: "Sophrologie", emoji: "🌿", description: "Harmonisez corps et esprit par des techniques de relaxation" },
    { nom: "Coaching", emoji: "🎯", description: "Atteignez vos objectifs avec un accompagnement personnalisé" },
    { nom: "Méditation", emoji: "☯️", description: "Cultivez la pleine conscience et la sérénité intérieure" },
    { nom: "Gestion du stress", emoji: "💆", description: "Maîtrisez vos réactions face aux situations stressantes" },
    { nom: "Burn-out", emoji: "🔥", description: "Récupérez et reconstruisez après l'épuisement professionnel" },
    { nom: "Sommeil", emoji: "🌙", description: "Retrouvez un sommeil réparateur et des nuits paisibles" },
    { nom: "Confiance en soi", emoji: "⭐", description: "Développez une estime de soi solide et durable" },
    { nom: "Relations", emoji: "💞", description: "Améliorez vos relations personnelles et professionnelles" },
    { nom: "Procrastination", emoji: "⏰", description: "Passez à l'action et libérez-vous de la procrastination" },
    { nom: "Anxiété", emoji: "🕊️", description: "Apaisez vos angoisses et retrouvez la tranquillité" },
    { nom: "Développement personnel", emoji: "🌱", description: "Épanouissez-vous et réalisez votre plein potentiel" },
    { nom: "Équilibre vie pro/perso", emoji: "⚖️", description: "Trouvez l'harmonie entre vie professionnelle et personnelle" },
  ];

  const seancesIndividuelles = [
    {
      titre: "Séance Découverte",
      prix: "29",
      duree: "30 min",
      description: "Idéale pour une première approche et définir vos besoins",
      features: ["Bilan initial personnalisé", "Présentation des approches", "Plan d'accompagnement", "Support par email"],
      accentColor: "#a0845a",
      popular: false,
    },
    {
      titre: "Séance Standard",
      prix: "59",
      duree: "60 min",
      description: "La séance complète pour un travail en profondeur",
      features: ["Séance complète 60 min", "Techniques avancées", "Exercices personnalisés", "Suivi entre séances", "Enregistrement audio"],
      accentColor: "#c8a96e",
      popular: true,
    },
    {
      titre: "Séance Expert",
      prix: "79",
      duree: "90 min",
      description: "L'expérience premium pour une transformation profonde",
      features: ["Séance intensive 90 min", "Multi-approches combinées", "Plan de transformation", "Support prioritaire 7j/7", "Enregistrement + ressources", "Suivi personnalisé mensuel"],
      accentColor: "#e8c97e",
      popular: false,
    },
  ];

  const packs = [
    {
      titre: "Pack Essentiel",
      nombreSeances: "5 séances",
      prix: "249",
      prixParSeance: "49.80",
      economie: "46€ économisés",
      description: "Commencez votre transformation en profondeur",
      features: ["5 séances Standard (60 min)", "Planning flexible", "Suivi personnalisé", "Accès ressources exclusives", "Support email prioritaire"],
      gradient: "linear-gradient(135deg, #1a1508 0%, #2a1f0a 100%)",
    },
    {
      titre: "Pack Transformation",
      nombreSeances: "10 séances",
      prix: "449",
      prixParSeance: "44.90",
      economie: "141€ économisés",
      description: "Le programme complet pour une transformation durable",
      features: ["10 séances Standard (60 min)", "Planning ultra-flexible", "Suivi hebdomadaire", "Accès ressources VIP", "Support WhatsApp dédié", "Bilan mensuel approfondi", "2 séances Expert offertes"],
      gradient: "linear-gradient(135deg, #1a1205 0%, #3a2510 100%)",
    },
  ];

  const [specialiteActive, setSpecialiteActive] = React.useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: "#ffffff", overflowX: "hidden" }}>
      
      {/* Navigation */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, backgroundColor: "rgba(5, 5, 8, 0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(200, 169, 110, 0.15)", padding: "0 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #c8a96e, #a0845a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🎓</div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#c8a96e", letterSpacing: "0.5px" }}>AcadémIA Pro</div>
              <div style={{ fontSize: "11px", color: "rgba(200, 169, 110, 0.6)", letterSpacing: "1px", textTransform: "uppercase" }}>Séances Thérapeutiques</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <a href="#specialites" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px", padding: "8px 16px", borderRadius: "8px", transition: "color 0.2s" }}>Spécialités</a>
            <a href="#tarifs" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px", padding: "8px 16px", borderRadius: "8px" }}>Tarifs</a>
            <a href="#packs" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px", padding: "8px 16px", borderRadius: "8px" }}>Packs</a>
            <button style={{ backgroundColor: "#c8a96e", color: "#050508", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.3px" }}>
              Réserver
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: "140px", paddingBottom: "100px", paddingLeft: "24px", paddingRight: "24px", position: "relative", overflow: "hidden" }}>
        
        {/* Background decorations */}
        <div style={{ position: "absolute", top: "10%", left: "5%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200, 169, 110, 0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200, 169, 110, 0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "2px", background: "linear-gradient(90deg, transparent, rgba(200, 169, 110, 0.1), transparent)", pointerEvents: "none" }} />

        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(200, 169, 110, 0.1)", border: "1px solid rgba(200, 169, 110, 0.25)", borderRadius: "50px", padding: "8px 20px", marginBottom: "32px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#c8a96e", boxShadow: "0 0 8px #c8a96e" }} />
            <span style={{ fontSize: "13px", color: "#c8a96e", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "600" }}>Thérapie & Bien-être IA Augmenté</span>
          </div>

          <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: "800", lineHeight: "1.1", marginBottom: "24px", letterSpacing: "-1px" }}>
            <span style={{ color: "#ffffff" }}>Transformez votre</span>
            <br />
            <span style={{ background: "linear-gradient(135deg, #c8a96e, #e8c97e, #a0845a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>vie intérieure</span>
            <br />
            <span style={{ color: "#ffffff" }}>avec nos experts</span>
          </h1>

          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.55)", lineHeight: "1.7", maxWidth: "620px", margin: "0 auto 48px", fontWeight: "400" }}>
            14 spécialités thérapeutiques, des praticiens certifiés et une approche personnalisée augmentée par l'intelligence artificielle pour votre bien-être durable.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginBottom: "64px" }}>
            <button style={{ backgroundColor: "#c8a96e", color: "#050508", border: "none", borderRadius: "12px", padding: "16px 36px", fontSize: "16px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.3px", boxShadow: "0 0 30px rgba(200, 169, 110, 0.3)" }}>
              Commencer dès 29€ →
            </button>
            <button style={{ backgroundColor: "transparent", color: "#c8a96e", border: "1px solid rgba(200, 169, 110, 0.4)", borderRadius: "12px", padding: "16px 36px", fontSize: "16px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.3px" }}>
              Voir les spécialités
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "48px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { value: "2 400+", label: "patients accompagnés" },
              { value: "14", label: "spécialités thérapeutiques" },
              { value: "98%", label: "taux de satisfaction" },
              { value: "50+", label: "thérapeutes certifiés" },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#c8a96e", letterSpacing: "-0.5px" }}>{stat.value}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px", letterSpacing: "0.5px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialites Section */}
      <section id="specialites" style={{ padding: "100px 24px", position: "relative" }}>
        
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(200, 169, 110, 0.2), transparent)" }} />

        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(200, 169, 110, 0.08)", border: "1px solid rgba(200, 169, 110, 0.2)", borderRadius: "50px", padding: "6px 16px", marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", color: "#c8a96e", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "600" }}>Nos Spécialités</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "800", color: "#ffffff", marginBottom: "16px", letterSpacing: "-0.5px" }}>
              14 domaines d'expertise
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.45)", maxWidth: "520px", margin: "0 auto", lineHeight: "1.6" }}>
              Chaque spécialité est portée par des praticiens certifiés avec des années d'expérience clinique
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr