"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Mon LMS",
  sousTitre: "Votre espace d apprentissage AcademIA Pro",
  sections: [
    { titre: "Mes Modules",
      corps: "Acces a tous vos modules de formation · videos · exercices · quiz et ressources telechargeables." },
    { titre: "Ma Progression",
      corps: "Suivez votre avancement en temps reel · chapitres completes · score aux quiz · temps de formation." },
    { titre: "Prochaine Session Live",
      corps: "Rejoignez les classes virtuelles live avec avatar IA · posez vos questions en direct · replay disponible 48h." },
    { titre: "Agent IA Tuteur",
      corps: "Votre tuteur IA disponible 24h/24 · repond a vos questions de cours · vous aide sur les exercices." },
    { titre: "Mes Certificats",
      corps: "Generez et telechargez vos certificats AcademIA Pro apres validation de chaque formation." },
  ],
};

export default function LmsPage() {
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
