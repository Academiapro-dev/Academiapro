import React from "react";

interface FormationPageProps {
  params: {
    id: string;
  };
}

const formations = {
  "1": {
    titre: "Maîtrise de l'Intelligence Artificielle",
    description: "Devenez expert en IA et transformez votre carrière avec les technologies les plus avancées du marché. Une formation complète conçue par des experts de l'industrie pour vous amener du niveau débutant à expert.",
    prix: 1997,
    duree: "12 semaines",
    certification: true,
    programme: [
      "Introduction aux fondamentaux de l'IA",
      "Machine Learning et Deep Learning",
      "Traitement du langage naturel (NLP)",
      "Vision par ordinateur",
      "Déploiement de modèles en production",
      "Projets pratiques et cas d'usage réels",
      "Éthique et gouvernance de l'IA",
      "Préparation à la certification officielle"
    ]
  },
  "2": {
    titre: "Prompt Engineering Avancé",
    description: "Maîtrisez l'art de communiquer avec les LLMs et créez des applications IA révolutionnaires. Apprenez les techniques les plus avancées pour optimiser vos interactions avec ChatGPT, Claude et les autres modèles.",
    prix: 997,
    duree: "6 semaines",
    certification: true,
    programme: [
      "Fondamentaux du Prompt Engineering",
      "Techniques avancées de prompting",
      "Chain of Thought et raisonnement",
      "Agents IA et automatisation",
      "Intégration API et développement",
      "Optimisation et évaluation des prompts"
    ]
  },
  "3": {
    titre: "Automatisation Business avec l'IA",
    description: "Automatisez vos processus métier et multipliez votre productivité par 10 grâce à l'intelligence artificielle. Formation orientée résultats concrets pour entrepreneurs et professionnels.",
    prix: 1497,
    duree: "8 semaines",
    certification: true,
    programme: [
      "Audit et cartographie des processus",
      "Outils d'automatisation no-code",
      "Intégration des LLMs dans vos workflows",
      "Création d'agents autonomes",
      "ROI et métriques de performance",
      "Déploiement et maintenance",
      "Cas pratiques par secteur d'activité"
    ]
  }
};

const defaultFormation = {
  titre: "Formation AcadémIA Pro",
  description: "Une formation d'excellence pour maîtriser l'intelligence artificielle et propulser votre carrière vers de nouveaux sommets.",
  prix: 1997,
  duree: "10 semaines",
  certification: true,
  programme: [
    "Module 1 : Fondamentaux",
    "Module 2 : Pratique avancée",
    "Module 3 : Projets réels",
    "Module 4 : Certification"
  ]
};

export default function FormationPage({ params }: FormationPageProps) {
  const formation = formations[params.id as keyof typeof formations] || defaultFormation;
  const prixMensuel = Math.ceil(formation.prix / 3);

  const niveaux = [
    {
      nom: "E-Learning",
      prix: formation.prix,
      couleur: "#c8a96e",
      features: [
        "Accès à vie aux contenus",
        "Vidéos HD téléchargeables",
        "Exercices pratiques",
        "Forum communautaire",
        formation.certification ? "Certificat de completion" : "Attestation de suivi"
      ],
      populaire: false
    },
    {
      nom: "Premium",
      prix: Math.ceil(formation.prix * 1.8),
      couleur: "#c8a96e",
      features: [
        "Tout E-Learning inclus",
        "4 sessions de coaching 1-to-1",
        "Accès au groupe privé Slack",
        "Révision de vos projets",
        "Certification officielle AcadémIA Pro",
        "Support prioritaire 48h"
      ],
      populaire: true
    },
    {
      nom: "Live",
      prix: Math.ceil(formation.prix * 2.5),
      couleur: "#c8a96e",
      features: [
        "Tout Premium inclus",
        "Sessions live hebdomadaires",
        "Coaching illimité 3 mois",
        "Accès aux futures mises à jour",
        "Placement en entreprise partenaire",
        "Garantie résultats ou remboursé",
        "Accès communauté VIP à vie"
      ],
      populaire: false
    }
  ];

  return (
    <div style={{
      backgroundColor: "#050508",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#ffffff",
      overflowX: "hidden"
    }}>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
        padding: "20px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{
          fontSize: "22px",
          fontWeight: "800",
          color: "#c8a96e",
          letterSpacing: "-0.5px"
        }}>
          Académ<span style={{ color: "#ffffff" }}>IA</span> Pro
        </div>
        <div style={{
          fontSize: "13px",
          color: "rgba(255,255,255,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            display: "inline-block",
            boxShadow: "0 0 8px #22c55e"
          }}></span>
          Formation #{params.id}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: "80px 40px 60px",
        maxWidth: "1100px",
        margin: "0 auto",
        textAlign: "center",
        position: "relative"
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "rgba(200, 169, 110, 0.1)",
          border: "1px solid rgba(200, 169, 110, 0.3)",
          borderRadius: "100px",
          padding: "8px 20px",
          marginBottom: "32px"
        }}>
          <span style={{ fontSize: "14px", color: "#c8a96e", fontWeight: "600" }}>
            ✦ Formation Certifiante AcadémIA Pro
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 5vw, 60px)",
          fontWeight: "900",
          lineHeight: "1.1",
          marginBottom: "28px",
          letterSpacing: "-2px",
          background: "linear-gradient(135deg, #ffffff 0%, #c8a96e 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          {formation.titre}
        </h1>

        <p style={{
          fontSize: "18px",
          lineHeight: "1.7",
          color: "rgba(255,255,255,0.65)",
          maxWidth: "700px",
          margin: "0 auto 48px"
        }}>
          {formation.description}
        </p>

        {/* Stats */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "48px",
          flexWrap: "wrap"
        }}>
          {[
            { label: "Durée", valeur: formation.duree, icon: "⏱" },
            { label: "Certification", valeur: "Officielle", icon: "🏆" },
            { label: "Modules", valeur: formation.programme.length + " modules", icon: "📚" },
            { label: "Satisfaction", valeur: "98%", icon: "⭐" }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>{stat.icon}</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#c8a96e" }}>{stat.valeur}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Programme Section */}
      <section style={{
        padding: "60px 40px",
        maxWidth: "1100px",
        margin: "0 auto"
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(200,169,110,0.06) 0%, rgba(200,169,110,0.02) 100%)",
          border: "1px solid rgba(200, 169, 110, 0.15)",
          borderRadius: "24px",
          padding: "48px"
        }}>
          <h2 style={{
            fontSize: "32px",
            fontWeight: "800",
            marginBottom: "8px",
            letterSpacing: "-1px"
          }}>
            Programme de la formation
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "40px", fontSize: "15px" }}>
            Un curriculum structuré pour des résultats concrets et mesurables
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px"
          }}>
            {formation.programme.map((module, index) => (
              <div key={index} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                padding: "20px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                transition: "all 0.2s"
              }}>
                <div style={{
                  minWidth: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #c8a96e, #a07840)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#050508"
                }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <span style={{
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: "1.4",
                  paddingTop: "4px"
                }}>
                  {module}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Niveaux Section */}
      <section style={{
        padding: "60px 40px",
        maxWidth: "1100px",
        margin: "0 auto"
      }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2 style={{
            fontSize: "38px",
            fontWeight: "900",
            marginBottom: "12px",
            letterSpacing: "-1.5px"
          }}>
            Choisissez votre niveau
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "16px" }}>
            3 formules adaptées à vos besoins et votre ambition
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
              position: "relative",
              background: niveau.populaire
                ? "linear-gradient(135deg, rgba(200,169,110,0.12) 0%, rgba(200,169,110,0.04) 100%)"
                : "rgba(255,255,255,0.02)",
              border: niveau.populaire
                ? "2px solid rgba(200, 169, 110, 0.6)"
                : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
              transform: niveau.populaire ? "scale(1.03)" : "scale(1)",
              boxShadow: niveau.populaire ? "0 0 60px rgba(200,169,110,0.15)" : "none"
            }}>
              {niveau.populaire && (
                <div style={{
                  position: "absolute",
                  top: "-14px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#c8a96e",
                  color: "#050508",
                  fontSize: "11px",
                  fontWeight: "800",
                  padding: "6px 18px",
                  borderRadius: "100px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap"
                }}>
                  ✦ Le Plus Populaire
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <div style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#c8a96e",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "8px"
                }}>
                  {niveau.nom}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px" }}>
                  <span style={{
                    fontSize: "48px",
                    fontWeight: "900",
                    color: "#ffffff",
                    letterSpacing: "-2px",
                    lineHeight: "1"
                  }}>
                    {niveau.prix.toLocaleString("fr-FR")}€
                  </span>
                </div>
                <div style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)"
                }}>
                  ou 3x {Math.ceil(niveau.prix