"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Communaute AcadémIA Pro",
  sousTitre: "Rejoignez des milliers d apprenants passionnes",
  sections: [
    { titre: "Prompts Exclusifs Hebdo",
      corps: "Chaque semaine · recevez des prompts Claude exclusifs testes et valides par notre equipe. Applicable immediatement dans votre metier." },
    { titre: "Lives Mensuels Avatar IA",
      corps: "Un live mensuel avec notre avatar IA pour repondre a vos questions · presenter les nouveautes et partager les meilleures pratiques." },
    { titre: "Ressources Membres",
      corps: "Acces a une bibliotheque de ressources exclusives : templates · guides · scripts · workflows partages par la communaute." },
    { titre: "Networking",
      corps: "Echangez avec des professionnels de votre secteur · trouvez des partenaires · partagez vos reussites et progressez ensemble." },
    { titre: "Rejoindre la Communaute",
      corps: "Gratuit pour tous les apprenants · Premium inclus dans les formations · VIP inclus dans les packs. Acces Discord immediat." },
  ],
};

const carte = {
  background: "#1a1a2e", borderRadius: "16px",
  padding: "32px",
  border: "1px solid rgba(200,169,110,0.3)",
  marginBottom: "24px",
};

export default function CommunautePage() {
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
