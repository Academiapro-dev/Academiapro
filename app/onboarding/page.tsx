"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Bienvenue sur AcademIA Pro",
  sousTitre: "Configurons votre espace en 5 etapes",
  sections: [
    { titre: "Etape 1 · Bienvenue",
      corps: "Bienvenue dans votre espace AcademIA Pro. Votre agent IA personnel est pret a vous accompagner 24h/24." },
    { titre: "Etape 2 · Votre Profil",
      corps: "Completez votre profil : prenom · metier · objectif principal. Cela permet a votre agent IA de personnaliser votre parcours." },
    { titre: "Etape 3 · Vos Objectifs",
      corps: "Que souhaitez-vous accomplir ? Changer de metier · progresser · apprendre l IA · ameliorer votre bien-etre ?" },
    { titre: "Etape 4 · Recommandations",
      corps: "Basees sur votre profil · voici les formations et seances recommandees par votre agent IA." },
    { titre: "Etape 5 · Premier Acces",
      corps: "Votre espace est configure. Commencez par le module d introduction gratuit ou reservez votre premiere seance." },
  ],
};

export default function OnboardingPage() {
  const { txt } = useTraductionAuto(FR);
  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center",
          marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px",
            letterSpacing: "3px", margin: "0 0 12px" }}>
            {txt.surTitre}
          </p>
          <h1 style={{ color: "#fff", fontSize: "36px",
            margin: "0 0 12px" }}>{txt.titre}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)",
            fontSize: "16px", margin: "0" }}>
            {txt.sousTitre}
          </p>
        </div>
        {txt.sections.map((section, i) => (
          <div key={i} style={{ background: "#1a1a2e",
            borderRadius: "16px", padding: "32px",
            border: "1px solid rgba(200,169,110,0.3)",
            marginBottom: "24px" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "20px",
              margin: "0 0 16px" }}>{section.titre}</h2>
            <p style={{ color: "rgba(255,255,255,0.7)",
              fontSize: "14px", lineHeight: "1.8",
              margin: "0" }}>{section.corps}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
