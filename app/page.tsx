export default async function HomePage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  let statsFormations = 131;
  let statsApprenants = 20;
  let statsSeances = 14;

  try {
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { count: formationsCount } = await supabase
        .from("formations")
        .select("*", { count: "exact", head: true });

      const { count: apprenantsCount } = await supabase
        .from("apprenants")
        .select("*", { count: "exact", head: true });

      const { count: seancesCount } = await supabase
        .from("seances")
        .select("*", { count: "exact", head: true });

      if (formationsCount !== null) statsFormations = formationsCount;
      if (apprenantsCount !== null) statsApprenants = apprenantsCount;
      if (seancesCount !== null) statsSeances = seancesCount;
    }
  } catch {
    statsFormations = 131;
    statsApprenants = 20;
    statsSeances = 14;
  }

  const formations = [
    {
      id: 1,
      titre: "IA Générative & Prompt Engineering",
      niveau: "Intermédiaire",
      duree: "12h",
      prix: 297,
      badge: "Bestseller",
      description: "Maîtrisez ChatGPT, Claude et Midjourney pour transformer votre productivité professionnelle.",
    },
    {
      id: 2,
      titre: "AutoGPT & Agents IA Autonomes",
      niveau: "Avancé",
      duree: "18h",
      prix: 497,
      badge: "Nouveau",
      description: "Créez des agents IA capables d'exécuter des tâches complexes en totale autonomie.",
    },
    {
      id: 3,
      titre: "IA pour le Marketing Digital",
      niveau: "Débutant",
      duree: "8h",
      prix: 197,
      badge: "Populaire",
      description: "Automatisez votre contenu, analysez vos données et boostez vos conversions grâce à l'IA.",
    },
    {
      id: 4,
      titre: "Machine Learning Appliqué",
      niveau: "Avancé",
      duree: "24h",
      prix: 697,
      badge: "Expert",
      description: "Du concept au déploiement : construisez vos propres modèles de machine learning.",
    },
  ];

  const packs = [
    {
      id: 1,
      nom: "Starter",
      prix: 97,
      description: "Parfait pour débuter avec l'IA",
      couleur: "#1a1a2e",
      features: ["5 formations au choix", "Accès 6 mois", "Support email", "Certificat de completion"],
      populaire: false,
    },
    {
      id: 2,
      nom: "Pro",
      prix: 297,
      description: "Pour les professionnels ambitieux",
      couleur: "#0d0d1a",
      features: ["Toutes les formations", "Accès illimité", "Support prioritaire", "Certification AcadémIA Pro", "Sessions live mensuelles", "Communauté privée"],
      populaire: true,
    },
    {
      id: 3,
      nom: "Expert",
      prix: 697,
      description: "Maîtrise totale de l'écosystème IA",
      couleur: "#1a1a2e",
      features: ["Tout du pack Pro", "Coaching individuel 1h/mois", "Accès bêta nouveaux modules", "Badge Expert vérifié", "Réseau alumni exclusif"],
      populaire: false,
    },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#ffffff" }}>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "0 24px" }}>
        <nav style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
          
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #c8a96e, #e8c98e)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              🎓
            </div>
            <div>
              <span style={{ fontSize: "20px", fontWeight: 800, background: "linear-gradient(90deg, #c8a96e, #e8c98e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                AcadémIA
              </span>
              <span style={{ fontSize: "20px", fontWeight: 300, color: "#ffffff", marginLeft: "2px" }}>Pro</span>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {["Formations", "Parcours", "Certifications", "Tarifs", "Blog"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px", fontWeight: 500, transition: "color 0.2s", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#c8a96e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}>
                {item}
              </a>
            ))}
          </div>

          {/* CTA Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button style={{ padding: "8px 20px", background: "transparent", border: "1px solid rgba(200,169,110,0.5)", borderRadius: "8px", color: "#c8a96e", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
              Connexion
            </button>
            <button style={{ padding: "8px 20px", background: "linear-gradient(135deg, #c8a96e, #a8893e)", border: "none", borderRadius: "8px", color: "#050508", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              Commencer
            </button>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section style={{ position: "relative", padding: "120px 24px 100px", overflow: "hidden" }}>
        
        {/* Background effects */}
        <div style={{ position: "absolute", top: "10%", left: "10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(200,169,110,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
        
        <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "50px", padding: "8px 20px", marginBottom: "32px" }}>
            <span style={{ fontSize: "12px" }}>✨</span>
            <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px" }}>LA RÉFÉRENCE FORMATION IA EN FRANCE</span>
          </div>

          {/* Titre principal */}
          <h1 style={{ fontSize: "clamp(42px, 7vw, 84px)", fontWeight: 900, lineHeight: 1.05, marginBottom: "28px", letterSpacing: "-2px" }}>
            <span style={{ color: "#ffffff" }}>Devenez Expert</span>
            <br />
            <span style={{ background: "linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Intelligence Artificielle
            </span>
          </h1>

          {/* Sous-titre */}
          <p style={{ fontSize: "clamp(16px, 2.5vw, 22px)", color: "rgba(255,255,255,0.6)", maxWidth: "680px", margin: "0 auto 48px", lineHeight: 1.7, fontWeight: 400 }}>
            Formations certifiantes conçues par des experts IA. Maîtrisez les outils qui transforment les métiers de demain et obtenez votre certification reconnue par l'industrie.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "64px" }}>
            <button style={{ padding: "18px 40px", background: "linear-gradient(135deg, #c8a96e, #a8893e)", border: "none", borderRadius: "12px", color: "#050508", fontSize: "17px", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 32px rgba(200,169,110,0.3)" }}>
              Explorer les formations →
            </button>
            <button style={{ padding: "18px 40px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#ffffff", fontSize: "17px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #c8a96e, #a8893e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>▶</span>
              Voir la démo
            </button>
          </div>

          {/* Trust signals */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "32px", flexWrap: "wrap" }}>
            {[
              { icon: "🏆", text: "Certification reconnue" },
              { icon: "💳", text: "Paiement 3x sans frais" },
              { icon: "🔒", text: "Garantie 30 jours" },
              { icon: "⚡", text: "Accès immédiat" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section style={{ padding: "20px 24px 80px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            
            {[
              { valeur: statsFormations, label: "Formations disponibles", suffix: "+", icon: "📚", desc: "Modules constamment mis à jour" },
              { valeur: statsApprenants, label: "Skills enseignés", suffix: " Skills", icon: "🧠", desc: "Compétences opérationnelles" },
              { valeur: statsSeances, label: "Spécialités couvertes", suffix: " domaines", icon: "🎯", desc: "Du débutant à l'expert" },
              { valeur: 98, label: "Taux de satisfaction", suffix: "%", icon: "⭐", desc: "Basé sur 2000+ avis" },
            ].map((stat, i) => (
              <div key={i} style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.06), rgba(200,169,110,0.02))", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "20px", padding: "32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #c8a96e, transparent)" }} />
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>{stat.icon}</div>
                <div style={{ fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 900, background: "linear-gradient(135deg, #c8a96e, #e8c98e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>
                  {stat.valeur}{stat.suffix}
                </div>
                <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: 700, marginTop: "8px", marginBottom: "4px" }}>{stat.label}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMATIONS PHARES */}
      <section id="formations" style={{ padding: "80px 24px"
}}}