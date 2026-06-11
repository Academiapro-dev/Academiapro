export default function FormationPage({ params }: { params: { id: string } }) {
  const formations: Record<string, {
    titre: string;
    description: string;
    programme: string[];
    duree: string;
    prix: number;
    categorie: string;
  }> = {
    "marketing-ia": {
      titre: "Marketing IA Avancé",
      description: "Maîtrisez les outils d'intelligence artificielle pour révolutionner vos stratégies marketing. Apprenez à automatiser vos campagnes, analyser vos données en temps réel et créer du contenu personnalisé à grande échelle grâce aux dernières technologies IA.",
      programme: [
        "Introduction aux outils IA pour le marketing digital",
        "Automatisation des campagnes publicitaires avec l'IA",
        "Création de contenu assistée par IA (texte, image, vidéo)",
        "Analyse prédictive et segmentation intelligente",
        "Chatbots et personnalisation de l'expérience client",
        "SEO augmenté par l'intelligence artificielle",
        "Reporting automatisé et tableaux de bord IA",
        "Cas pratiques et projets réels"
      ],
      duree: "12 semaines",
      prix: 1490,
      categorie: "Marketing"
    },
    "data-science": {
      titre: "Data Science & Machine Learning",
      description: "Devenez expert en science des données et apprentissage automatique. Maîtrisez Python, les algorithmes de ML et les frameworks modernes pour extraire de la valeur de vos données et construire des modèles prédictifs performants.",
      programme: [
        "Fondamentaux Python pour la Data Science",
        "Statistiques et probabilités appliquées",
        "Exploration et visualisation des données",
        "Algorithmes de Machine Learning supervisé",
        "Deep Learning et réseaux de neurones",
        "Natural Language Processing (NLP)",
        "Computer Vision et traitement d'images",
        "Déploiement de modèles en production"
      ],
      duree: "16 semaines",
      prix: 1990,
      categorie: "Data Science"
    },
    "default": {
      titre: "Formation IA Professionnelle",
      description: "Une formation complète pour maîtriser l'intelligence artificielle dans votre domaine professionnel. Acquérez les compétences recherchées par les entreprises et transformez votre carrière grâce à notre programme certifiant.",
      programme: [
        "Fondamentaux de l'intelligence artificielle",
        "Outils et plateformes IA essentiels",
        "Applications pratiques en entreprise",
        "Automatisation des processus métier",
        "Éthique et responsabilité de l'IA",
        "Projets pratiques guidés",
        "Préparation à la certification",
        "Accompagnement post-formation"
      ],
      duree: "8 semaines",
      prix: 990,
      categorie: "IA Générale"
    }
  };

  const formation = formations[params.id] || formations["default"];

  const niveaux = [
    {
      nom: "E-Learning",
      prix: formation.prix,
      couleur: "#1a1a2e",
      bordure: "#333366",
      badge: "ESSENTIEL",
      badgeCouleur: "#4a4a8a",
      icone: "🎓",
      description: "Apprenez à votre rythme avec nos contenus premium",
      avantages: [
        "Accès illimité aux vidéos HD",
        "Supports PDF téléchargeables",
        "Exercices pratiques interactifs",
        "Forum communautaire",
        "Certification AcadémIA Pro",
        "Mises à jour du contenu incluses",
        "Accès mobile et desktop",
        "Support par email"
      ]
    },
    {
      nom: "Premium Agent IA 24/7",
      prix: Math.round(formation.prix * 1.8),
      couleur: "#1a0f00",
      bordure: "#c8a96e",
      badge: "POPULAIRE",
      badgeCouleur: "#c8a96e",
      icone: "🤖",
      description: "Un agent IA personnel disponible à toute heure",
      avantages: [
        "Tout le contenu E-Learning",
        "Agent IA personnel disponible 24h/24",
        "Réponses instantanées à vos questions",
        "Corrections automatiques de vos travaux",
        "Plan d'apprentissage personnalisé",
        "Rappels et suivi de progression",
        "Sessions de révision adaptatives",
        "Accès prioritaire aux nouvelles formations"
      ]
    },
    {
      nom: "Live Avatar IA",
      prix: Math.round(formation.prix * 2.8),
      couleur: "#0a0a1a",
      bordure: "#e8d4a0",
      badge: "PREMIUM",
      badgeCouleur: "#e8d4a0",
      icone: "✨",
      description: "L'expérience d'apprentissage la plus immersive",
      avantages: [
        "Tout le contenu Premium Agent IA",
        "Sessions live avec Avatar IA interactif",
        "Simulation de situations professionnelles",
        "Coaching personnalisé en temps réel",
        "Entretiens blancs avec évaluation IA",
        "Networking avec experts du secteur",
        "Certificat premium avec signature digitale",
        "Accompagnement carrière 6 mois"
      ]
    }
  ];

  return (
    <div style={{
      backgroundColor: "#050508",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#ffffff"
    }}>

      <div style={{
        background: "linear-gradient(135deg, #0a0a15 0%, #050508 50%, #0f0a00 100%)",
        borderBottom: "1px solid #c8a96e33",
        padding: "0 24px"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              background: "linear-gradient(135deg, #c8a96e, #e8d4a0)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "900",
              color: "#050508"
            }}>A</div>
            <span style={{
              fontSize: "20px",
              fontWeight: "800",
              background: "linear-gradient(135deg, #c8a96e, #e8d4a0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>AcadémIA Pro</span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#c8a96e15",
            border: "1px solid #c8a96e44",
            borderRadius: "20px",
            padding: "6px 14px"
          }}>
            <span style={{ fontSize: "12px", color: "#c8a96e" }}>●</span>
            <span style={{ fontSize: "13px", color: "#c8a96ecc", fontWeight: "500" }}>{formation.categorie}</span>
          </div>
        </div>
      </div>

      <div style={{
        background: "linear-gradient(180deg, #0a0a18 0%, #050508 100%)",
        padding: "80px 24px 60px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse, #c8a96e08 0%, transparent 70%)",
          pointerEvents: "none"
        }} />
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#c8a96e12",
          border: "1px solid #c8a96e40",
          borderRadius: "100px",
          padding: "8px 20px",
          marginBottom: "28px"
        }}>
          <span style={{ fontSize: "14px" }}>🏆</span>
          <span style={{ fontSize: "13px", color: "#c8a96e", fontWeight: "600", letterSpacing: "0.05em" }}>FORMATION CERTIFIANTE</span>
        </div>
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 58px)",
          fontWeight: "900",
          lineHeight: "1.1",
          marginBottom: "24px",
          background: "linear-gradient(135deg, #ffffff 0%, #c8a96e 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          maxWidth: "800px",
          margin: "0 auto 24px"
        }}>
          {formation.titre}
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#ffffffaa",
          maxWidth: "700px",
          margin: "0 auto 40px",
          lineHeight: "1.7"
        }}>
          {formation.description}
        </p>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "32px",
          flexWrap: "wrap"
        }}>
          {[
            { icone: "⏱️", label: "Durée", valeur: formation.duree },
            { icone: "📚", label: "Modules", valeur: `${formation.programme.length} modules` },
            { icone: "🎯", label: "Niveau", valeur: "Tous niveaux" },
            { icone: "🌐", label: "Format", valeur: "100% en ligne" }
          ].map((stat, i) => (
            <div key={i} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px"
            }}>
              <span style={{ fontSize: "24px" }}>{stat.icone}</span>
              <span style={{ fontSize: "13px", color: "#ffffff66", textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#c8a96e" }}>{stat.valeur}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "60px 24px"
      }}>

        <div style={{
          backgroundColor: "#0c0c18",
          border: "1px solid #c8a96e22",
          borderRadius: "20px",
          padding: "48px",
          marginBottom: "60px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px"
          }}>
            <div style={{
              width: "4px",
              height: "32px",
              background: "linear-gradient(180deg, #c8a96e, #e8d4a0)",
              borderRadius: "4px"
            }} />
            <h2 style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#ffffff"
            }}>Programme de la formation</h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "16px"
          }}>
            {formation.programme.map((module, index) => (
              <div key={index} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                backgroundColor: "#050508",
                border: "1px solid #ffffff0a",
                borderRadius: "12px",
                padding: "20px",
                transition: "border-color 0.2s"
              }}>
                <div style={{
                  minWidth: "32px",
                  height: "32px",
                  background: "linear-gradient(135deg, #c8a96e22, #c8a96e11)",
                  border: "1px solid #c8a96e44",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#c8a96e"
                }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <span style={{
                  fontSize: "15px",
                  color: "#ffffffcc",
                  lineHeight: "1.5",
                  fontWeight: "500"
                }}>{module}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "60px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{
              fontSize: "36px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #ffffff, #c8a96e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "12px"
            }}>Choisissez votre niveau d'accompagnement</h2>
            <p style={{ color: "#ffffff66", fontSize: "16px" }}>
              Sélectionnez la formule qui correspond à vos ambitions et à votre rythme d'apprentissage
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            alignItems: "stretch"
          }}>
            {niveaux.map((niveau, index) => (
              <div key={index} style={{
                backgroundColor: niveau.couleur,
                border: `2px solid ${niveau.bordure}`,
                borderRadius: "24px",
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,