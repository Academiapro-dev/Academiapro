"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Financement de votre Formation",
  sousTitre: "Plusieurs options disponibles · nous vous accompagnons",
  sections: [
    { titre: "Paiement Personnel",
      corps: "Paiement en 1 fois · 3 fois sans frais ou 10 fois avec frais. Carte bancaire · virement bancaire acceptes. Facture immediate." },
    { titre: "Financement Entreprise",
      corps: "Votre entreprise peut financer votre formation via son plan de formation annuel. Nous fournissons tous les documents necessaires." },
    { titre: "OPCO et Financement Pro",
      corps: "Selon votre situation · un OPCO peut financer tout ou partie de votre formation. Nous vous accompagnons dans les demarches." },
    { titre: "Garantie 30 Jours",
      corps: "Toutes nos formations sont garanties satisfait ou rembourse pendant 30 jours. Aucun risque · aucune question posee." },
  ],
};

const carte = {
  background: "#1a1a2e", borderRadius: "16px",
  padding: "32px",
  border: "1px solid rgba(200,169,110,0.3)",
  marginBottom: "24px",
};

export default function FinancementPage() {
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
