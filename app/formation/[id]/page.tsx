export default function FormationPage({ params }: { params: { id: string } }) {
  const formation = {
    id: params.id,
    titre: "Maîtrisez l'Intelligence Artificielle Générative",
    code: "AIA-2024-PRO",
    duree: "48 heures",
    prix: 1497,
    description: "Formation complète pour devenir expert en IA générative et automatisation intelligente",
    expert: {
      nom: "Dr. Alexandre Moreau",
      titre: "Expert IA & Data Science",
      experience: "15 ans d'expérience",
      avatar: "AM",
      bio: "Ancien chercheur au CNRS, formateur certifié par OpenAI et Google DeepMind. A accompagné plus de 2 400 professionnels dans leur transformation IA."
    },
    niveaux: [
      {
        id: "elearning",
        nom: "E-Learning",
        prix: 497,
        couleur: "#c8a96e",
        icone: "📚",
        description: "Accès illimité à tous les contenus vidéo et ressources pédagogiques",
        inclus: [
          "48h de vidéos HD en accès illimité",
          "Supports PDF téléchargeables",
          "Exercices pratiques corrigés",
          "Forum communauté apprenants",
          "Mises à jour gratuites 12 mois",
          "Certificat de complétion"
        ]
      },
      {
        id: "premium",
        nom: "Premium Agent IA 24/7",
        prix: 997,
        couleur: "#e8c97e",
        icone: "🤖",
        description: "E-Learning + Agent IA personnel disponible 24h/24 pour vous accompagner",
        inclus: [
          "Tout le contenu E-Learning",
          "Agent IA tuteur personnalisé 24/7",
          "Correction automatique IA des exercices",
          "Plan d'apprentissage adaptatif",
          "Sessions de révision IA illimitées",
          "Analyse de progression en temps réel",
          "Certification AcadémIA Pro",
          "Garantie 30 jours satisfait ou remboursé"
        ],
        recommande: true
      },
      {
        id: "live",
        nom: "Live Avatar IA",
        prix: 1497,
        couleur: "#f0d898",
        icone: "🎭",
        description: "Expérience immersive avec avatar IA interactif et sessions live personnalisées",
        inclus: [
          "Tout le contenu Premium",
          "Avatar IA interactif en temps réel",
          "8 sessions live avec l'expert attitré",
          "Simulation d'entretiens IA",
          "Coaching carrière personnalisé",
          "Accès réseau alumni VIP",
          "Certification AcadémIA Pro Gold",
          "Garantie 30 jours satisfait ou remboursé",
          "Support prioritaire 7j/7"
        ]
      }
    ],
    programme: [
      {
        chapitre: 1,
        titre: "Fondamentaux de l'IA Générative",
        duree: "8h",
        modules: [
          {
            titre: "Introduction aux LLMs et transformers",
            duree: "2h30",
            exercices: 3
          },
          {
            titre: "Architecture des modèles génératifs",
            duree: "3h",
            exercices: 4
          },
          {
            titre: "Écosystème des outils IA 2024",
            duree: "2h30",
            exercices: 2
          }
        ]
      },
      {
        chapitre: 2,
        titre: "Prompt Engineering Avancé",
        duree: "12h",
        modules: [
          {
            titre: "Techniques de prompting professionnel",
            duree: "4h",
            exercices: 6
          },
          {
            titre: "Chain-of-thought et few-shot learning",
            duree: "4h",
            exercices: 5
          },
          {
            titre: "Optimisation et itération des prompts",
            duree: "4h",
            exercices: 8
          }
        ]
      },
      {
        chapitre: 3,
        titre: "Automatisation et Agents IA",
        duree: "14h",
        modules: [
          {
            titre: "Construction d'agents autonomes",
            duree: "5h",
            exercices: 7
          },
          {
            titre: "Intégration APIs et workflows",
            duree: "5h",
            exercices: 6
          },
          {
            titre: "Déploiement en production",
            duree: "4h",
            exercices: 5
          }
        ]
      },
      {
        chapitre: 4,
        titre: "Applications Métier et ROI",
        duree: "14h",
        modules: [
          {
            titre: "IA dans le marketing et la vente",
            duree: "4h",
            exercices: 4
          },
          {
            titre: "Automatisation des processus RH",
            duree: "5h",
            exercices: 5
          },
          {
            titre: "Projet final et certification",
            duree: "5h",
            exercices: 10
          }
        ]
      }
    ]
  }

  const totalModules = formation.programme.reduce((acc, ch) => acc + ch.modules.length, 0)
  const totalExercices = formation.programme.reduce((acc, ch) => acc + ch.modules.reduce((a, m) => a + m.exercices, 0), 0)

  return (
    <div style={{
      backgroundColor: "#050508",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#ffffff"
    }}>

      {}
      <div style={{
        background: "linear-gradient(135deg, #0a0a12 0%, #050508 50%, #0d0a05 100%)",
        borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
        padding: "0 24px"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#050508"
            }}>A</div>
            <span style={{
              fontSize: "20px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>AcadémIA Pro</span>
          </div>
          <div style={{ display: "flex", gap: "8px", fontSize: "13px", color: "rgba(200, 169, 110, 0.7)" }}>
            <span>Formations</span>
            <span>›</span>
            <span>IA Générative</span>
            <span>›</span>
            <span style={{ color: "#c8a96e" }}>{formation.code}</span>
          </div>
        </div>
      </div>

      {}
      <div style={{
        background: "linear-gradient(180deg, #0d0a05 0%, #050508 100%)",
        borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
        padding: "60px 24px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <span style={{
              backgroundColor: "rgba(200, 169, 110, 0.15)",
              border: "1px solid rgba(200, 169, 110, 0.4)",
              color: "#c8a96e",
              padding: "4px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              letterSpacing: "1px",
              textTransform: "uppercase"
            }}>Bestseller</span>
            <span style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "rgba(255,255,255,0.6)",
              padding: "4px 14px",
              borderRadius: "20px",
              fontSize: "12px"
            }}>Code : {formation.code}</span>
          </div>

          <h1 style={{
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: "800",
            lineHeight: "1.15",
            marginBottom: "20px",
            maxWidth: "800px",
            background: "linear-gradient(135deg, #ffffff 0%, #e8d5b0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>{formation.titre}</h1>

          <p style={{
            fontSize: "18px",
            color: "rgba(255,255,255,0.6)",
            maxWidth: "650px",
            lineHeight: "1.7",
            marginBottom: "40px"
          }}>{formation.description}</p>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "32px",
            marginBottom: "48px"
          }}>
            {[
              { icone: "⏱", label: "Durée totale", valeur: formation.duree },
              { icone: "📖", label: "Chapitres", valeur: `${formation.programme.length} chapitres` },
              { icone: "🎯", label: "Modules", valeur: `${totalModules} modules` },
              { icone: "✏️", label: "Exercices", valeur: `${totalExercices} exercices` },
              { icone: "🏆", label: "Certification", valeur: "AcadémIA Pro" }
            ].map((stat, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>{stat.icone}</span>
                <div>
                  <div style={{ fontSize: "11px", color: "rgba(200, 169, 110, 0.7)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{stat.label}</div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#ffffff" }}>{stat.valeur}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            padding: "24px 32px",
            background: "rgba(200, 169, 110, 0.05)",
            border: "1px solid rgba(200, 169, 110, 0.2)",
            borderRadius: "16px",
            maxWidth: "500px"
          }}>
            <div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>À partir de</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{
                  fontSize: "48px",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #c8a96e, #f0d898)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>{formation.prix}€</span>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", textDecoration: "line-through" }}>2 994€</span>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(200, 169, 110, 0.7)" }}>Accès à vie · Garantie 30 jours</div>
            </div>
            <button style={{
              backgroundColor: "#c8a96e",
              color: "#050508",
              border: "none",
              borderRadius: "12px",
              padding: "16px 28px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              whiteSpace: "nowrap",
              background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
              boxShadow: "0 8px 30px rgba(200, 169, 110, 0.35)"
            }}>
              Acheter maintenant →
            </button>
          </div>
        </div>
      </div>

      {}
      <div style={{ padding: "80px 24px", backgroundColor: "#050508" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <div style={{
              display: "inline-block",
              backgroundColor: "rgba(200, 169, 110, 0.1)",
              border: "1px solid rgba(200, 169, 110, 0.3)",
              borderRadius: "20px",
              padding: "6px 20px",
              fontSize: "12px",
              color: "#c8a96e",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "16px"
            }}>Choisissez votre niveau</div>
            <h2 style={{
              fontSize: "clamp(24px, 4vw, 40px)",
              fontWeight: "800",
              color: "#ffffff",
              marginBottom: "12px"
            }}>3 niveaux d'accompagnement</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>
              Du e-learning autonome à l'expérience immersive avec avatar IA
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px"
          }}>
            {formation.niveaux.map((niveau, index) => (
              <div key={niveau.id} style={{
                position: "relative",
                backgroundColor: niveau.recommande ? "rgba(