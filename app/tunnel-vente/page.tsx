"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Votre Parcours AcadémIA Pro",
  sousTitre: "4 etapes pour transformer votre carriere",
  sections: [
    { titre: "Etape 1 · Lead Magnet Gratuit",
      corps: "Commencez gratuitement avec notre e-book · webinaire ou mini-cours. Decouvrez la puissance de l IA sans risque." },
    { titre: "Etape 2 · Starter Pack 47euro",
      corps: "100 prompts · guide PDF · module 1 F128 · acces communaute. Premiere valeur immediate pour 47euro seulement." },
    { titre: "Etape 3 · Formation Complete",
      corps: "Choisissez votre formation selon vos objectifs. De 290euro a 990euro · paiement 3x sans frais · garantie 30 jours." },
    { titre: "Etape 4 · Pack Premium",
      corps: "Maximisez votre investissement avec un pack complet. De 1490euro a 3990euro · les meilleures economies du catalogue." },
  ],
};

const carte = {
  background: "#1a1a2e", borderRadius: "16px",
  padding: "32px",
  border: "1px solid rgba(200,169,110,0.3)",
  marginBottom: "24px",
};

export default function TunnelVentePage() {
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
