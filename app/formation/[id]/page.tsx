"use client";
import { useState } from "react";

export default function FormationPage({ params }) {
  const id = params ? params.id : "1";

  const [selectedLevel, setSelectedLevel] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [btnHovered, setBtnHovered] = useState(null);

  const formation = {
    titre: "Maîtrisez le Leadership Stratégique",
    description: "Une formation complète pour développer vos compétences en leadership, management d'équipe et prise de décision stratégique. Conçue pour les professionnels ambitieux qui souhaitent accélérer leur carrière et transformer leur organisation.",
    duree: "12 semaines",
    certification: "Certificat Professionnel de Leadership Stratégique — reconnu par +200 entreprises partenaires",
    programme: [
      "Fondamentaux du leadership moderne et intelligence émotionnelle",
      "Communication persuasive et gestion des conflits",
      "Prise de décision sous pression et gestion des risques",
      "Construction et animation d'équipes haute performance",
      "Vision stratégique et planification à long terme",
      "Leadership en période de transformation et changement",
      "Négociation avancée et influence organisationnelle",
      "Projet final : plan de transformation leadership",
    ],
  };

  const niveaux = [
    {
      nom: "E-Learning",
      emoji: "🎓",
      prix: "490",
      couleur: "#c8a96e",
      description: "Accès illimité à vie aux vidéos, exercices interactifs et ressources PDF. Apprenez à votre rythme.",
      inclus: [
        "80+ heures de vidéos HD",
        "Exercices et quiz interactifs",
        "Ressources PDF téléchargeables",
        "Accès communauté privée",
        "Certificat de completion",
        "Mises à jour gratuites à vie",
      ],
    },
    {
      nom: "Premium",
      emoji: "⭐",
      prix: "990",
      couleur: "#e8c97e",
      description: "Tout l'E-Learning plus un suivi personnalisé, des sessions de groupe et un coaching mensuel.",
      inclus: [
        "Tout le contenu E-Learning",
        "4 sessions de groupe live/mois",
        "1 coaching individuel/mois",
        "Feedback personnalisé sur vos projets",
        "Accès forum prioritaire",
        "Certificat Premium signé",
        "Réseau Alumni exclusif",
      ],
    },
    {
      nom: "Live",
      emoji: "🚀",
      prix: "2490",
      couleur: "#f0d090",
      description: "Expérience totale avec accompagnement intensif, sessions live quotidiennes et mentor dédié.",
      inclus: [
        "Tout le contenu Premium",
        "Sessions live quotidiennes",
        "Mentor dédié 5j/7",
        "Plan de développement sur-mesure",
        "Accès direct WhatsApp formateur",
        "Garantie résultats 90 jours",
        "Placement réseau partenaires",
        "Certificat Excellence",
      ],
    },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#f0e8d8" }}>

      <div style={{ background: "linear-gradient(135deg, #0a0a12 0%, #050508 50%, #0d0a06 100%)", borderBottom: "1px solid #2a2218", padding: "60px 20px 80px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>

          <div style={{ display: "inline-block", backgroundColor: "#1a1508", border: "1px solid #c8a96e", borderRadius: "20px", padding: "6px 18px", marginBottom: "28px" }}>
            <span style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>Formation Individuelle — ID {id}</span>
          </div>

          <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: "800", lineHeight: "1.15", marginBottom: "24px", background: "linear-gradient(135deg, #f0e8d8 0%, #c8a96e 50%, #f0d090 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {formation.titre}
          </h1>

          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", lineHeight: "1.8", color: "#b8a888", maxWidth: "700px", margin: "0 auto 36px" }}>
            {formation.description}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>⏱️</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "11px", color: "#7a6a4a", textTransform: "uppercase", letterSpacing: "1px" }}>Durée</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#c8a96e" }}>{formation.duree}</div>
              </div>
            </div>
            <div style={{ width: "1px", backgroundColor: "#2a2218" }}></div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>🏅</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "11px", color: "#7a6a4a", textTransform: "uppercase", letterSpacing: "1px" }}>Certification</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#d4b87a", maxWidth: "280px" }}>{formation.certification}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 20px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "700", color: "#f0e8d8", marginBottom: "8px" }}>
          Programme complet
        </h2>
        <p style={{ color: "#7a6a4a", marginBottom: "32px", fontSize: "14px" }}>8 modules intensifs — du fondamental à l'excellence</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
          {formation.programme.map((module, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: "flex", alignItems: "flex-start", gap: "14px", backgroundColor: hovered === i ? "#12100a" : "#0a0908", border: hovered === i ? "1px solid #c8a96e" : "1px solid #1e1a12", borderRadius: "10px", padding: "16px 18px", cursor: "default", transition: "all 0.2s ease" }}
            >
              <div style={{ minWidth: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#1a1508", border: "1px solid #c8a96e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", color: "#c8a96e" }}>
                {i + 1}
              </div>
              <span style={{ fontSize: "14px", color: hovered === i ? "#f0e8d8" : "#b8a888", lineHeight: "1.5", transition: "color 0.2s ease" }}>
                {module}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: "#070608", borderTop: "1px solid #1a1512", borderBottom: "1px solid #1a1512", padding: "70px 20px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 38px)", fontWeight: "800", color: "#f0e8d8", marginBottom: "12px" }}>
              Choisissez votre niveau d'accès
            </h2>
            <p style={{ color: "#7a6a4a", fontSize: "15px" }}>Trois formules adaptées à vos objectifs et votre budget</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {niveaux.map((niveau, i) => (
              <div
                key={i}
                onClick={() => setSelectedLevel(i)}
                style={{ backgroundColor: selectedLevel === i ? "#100e08" : "#0a0908", border: selectedLevel === i ? "2px solid " + niveau.couleur : "2px solid #1e1a12", borderRadius: "16px", padding: "32px 28px", cursor: "pointer", transition: "all 0.25s ease", position: "relative", transform: selectedLevel === i ? "translateY(-4px)" : "translateY(0)", boxShadow: selectedLevel === i ? "0 20px 60px rgba(200, 169, 110, 0.15)" : "none" }}
              >

                {i === 1 && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#c8a96e", borderRadius: "12px", padding: "4px 14px", fontSize: "11px", fontWeight: "800", color: "#050508", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                    POPULAIRE
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontSize: "28px" }}>{niveau.emoji}</span>
                    <h3 style={{ fontSize: "20px", fontWeight: "800", color: niveau.couleur, margin: "6px 0 0" }}>{niveau.nom}</h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "32px", fontWeight: "900", color: "#f0e8d8" }}>{niveau.prix}€</div>
                    <div style={{ fontSize: "11px", color: "#5a4a2a" }}>paiement unique</div>
                  </div>
                </div>

                <p style={{ fontSize: "13px", color: "#8a7a5a", lineHeight: "1.6", marginBottom: "24px", minHeight: "52px" }}>
                  {niveau.description}
                </p>

                <div style={{ marginBottom: "28px" }}>
                  {niveau.inclus.map((item, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                      <span style={{ color: niveau.couleur, fontSize: "14px", marginTop: "1px" }}>✓</span>
                      <span style={{ fontSize: "13px", color: "#c8b888", lineHeight: "1.4" }}>{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  onMouseEnter={() => setBtnHovered(i)}
                  onMouseLeave={() => setBtnHovered(null)}
                  style={{ width: "100%", padding: "14px 0", borderRadius: "10px", border: "none", backgroundColor: btnHovered === i ? niveau.couleur : selectedLevel === i ? niveau.couleur : "#1a1508", color: btnHovered === i ? "#050508" : selectedLevel === i ? "#050508" : niveau.couleur, fontSize: "14px", fontWeight: "800", cursor: "pointer", transition: "all 0.2s ease", letterSpacing: "0.5px", outline: selectedLevel === i ? "none" : "1px solid " + niveau.couleur }}
                >
                  Acheter — {niveau.prix}€
                </button>

              </div>
            ))}
          </div>

        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ backgroundColor: "#0a0908", border: "1px solid #2a2218", borderRadius: "16px", padding: "40px", textAlign: "center" }}>

          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🏅</div>
          <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#c8a96e", marginBottom: "12px" }}>
            Votre certification vous attend
          </h3>
          <p style={{ color: "#8a7a5a", fontSize: "14px", lineHeight: "1.8", marginBottom: "28px" }}>
            {formation.certification}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
            {["200+ Entreprises", "15 000+ Diplômés", "4.9/5 Satisfaction"].map((stat, i) => (
              <div key={i} style={{ backgroundColor: "#12100a", border: "1px solid #2a2218", borderRadius: "10px", padding: "14px 22px" }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#f0e8d8" }}>{stat.split(" ")[0]}</div>
                <div style={{ fontSize: "11px", color: "#5a4a2a", textTransform: "uppercase", letterSpacing: "1px" }}>{stat.split(" ").slice(1).join(" ")}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div style={{ backgroundColor: "#0a0806", borderTop: "1px solid #1a1512", padding: "50px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#f0e8d8", marginBottom: "12px" }}>
            Prêt à transformer votre carrière ?
          </h3>
          <p style={{ color