"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "A Propos d AcadémIA Pro",
  sousTitre: "La plateforme de formation propulsee par l IA",
  sections: [
    { titre: "Notre Mission",
      corps: "Democratiser la formation professionnelle de qualite en la rendant accessible a tous · partout · a toute heure · grace a l intelligence artificielle." },
    { titre: "Notre Vision",
      corps: "Un monde ou chaque professionnel dispose de son agent IA personnel pour apprendre · progresser et s epanouir a son propre rythme." },
    { titre: "Nos Valeurs",
      corps: "Excellence · Innovation · Accessibilite · Exigence. Nous croyons que la formation de qualite doit etre accessible a tous, et qu un certificat se merite." },
    { titre: "Notre Plateforme",
      corps: "266 formations avec certificat AcadémIA Pro · 20 ateliers pratiques · 14 specialites d accompagnement · Agent IA tuteur 24h/24 · Evaluation exigeante avant toute delivrance de certificat." },
    { titre: "Le Fondateur",
      corps: "AcadémIA Pro a été fondée par Jacques Lalou, auteur et praticien expert en PNL, hypnose et psychanalyse, certifié enseignant en PNL et en hypnose. Chaque formation et chaque praticien IA de la plateforme naît de cette expertise de terrain, avec une conviction : la technologie n a de valeur que si elle transmet un savoir authentique et transforme réellement celui qui apprend." }
  ],
};

const carte = {
  background: "#1a1a2e",
  borderRadius: "16px",
  padding: "32px",
  border: "1px solid rgba(200,169,110,0.3)",
  marginBottom: "24px",
};

export default function AProposPage() {
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
            margin: "0 0 12px" }}>
            {txt.titre}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)",
            fontSize: "16px", margin: "0" }}>
            {txt.sousTitre}
          </p>
        </div>
        {txt.sections.map((section, i) => (
          <div key={i} style={carte}>
            <h2 style={{ color: "#c8a96e", fontSize: "20px",
              margin: "0 0 16px" }}>
              {section.titre}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)",
              fontSize: "14px", lineHeight: "1.8",
              margin: "0" }}>
              {section.corps}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
