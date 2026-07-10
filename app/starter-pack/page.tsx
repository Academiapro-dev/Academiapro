"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Bienvenue dans le Starter Pack IA",
  sousTitre: "Votre acces est active · Commencez maintenant",
  sections: [
    { titre: "100 Prompts Claude par Metier",
      corps: "Telechargez votre guide de 100 prompts professionnels adaptes a votre metier. Applicables immediatement." },
    { titre: "Guide de Demarrage PDF",
      corps: "Guide complet pour debuter avec Claude et l IA generative. 50 pages · exercices pratiques inclus." },
    { titre: "Module 1 de F128",
      corps: "Acces au premier module de la formation Expert Claude et IA Generative. 2 heures de contenu premium." },
    { titre: "Communaute Discord",
      corps: "Rejoignez notre communaute privee sur Discord · echangez avec d autres apprenants · posez vos questions." },
    { titre: "Passez a la Vitesse Superieure",
      corps: "Formation complete F128 Expert Claude disponible a 643euro au lieu de 690euro pour les membres Starter Pack." },
  ],
};

const carte = {
  background: "#1a1a2e", borderRadius: "16px",
  padding: "32px",
  border: "1px solid rgba(200,169,110,0.3)",
  marginBottom: "24px",
};

export default function StarterPackPage() {
  const { txt } = useTraductionAuto(FR);
  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px",
        margin: "0 auto" }}>
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
          <div key={i} style={carte}>
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
