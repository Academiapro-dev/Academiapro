"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Mon Espace",
  sousTitre: "Votre espace personnel AcademIA Pro",
  sections: [
    { titre: "Mes Formations",
      corps: "Toutes les formations achetees · progression · acces direct aux modules · certifications." },
    { titre: "Mes Seances",
      corps: "Prochaines seances reservees · historique · replays disponibles · reserver une nouvelle seance." },
    { titre: "Mes Paiements",
      corps: "Historique des paiements · factures telechargeables · abonnements actifs · prochains prelevements." },
    { titre: "Mon Profil",
      corps: "Informations personnelles · photo · metier · objectifs · preferences de formation · notifications." },
    { titre: "Mes Certifications",
      corps: "Certifications obtenues · en cours · a venir. Telechargez et partagez sur LinkedIn." },
  ],
};

export default function MonEspacePage() {
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
