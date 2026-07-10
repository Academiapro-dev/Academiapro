"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Mes Certifications",
  sousTitre: "Certification AcademIA Pro · 4 niveaux · QR Code · LinkedIn",
  sections: [
    { titre: "Attestation de Suivi",
      corps: "Niveau 1 · Obtenue apres completion du module d introduction. Telechargez en PDF et partagez sur LinkedIn." },
    { titre: "Certificat de Formation",
      corps: "Niveau 2 · Obtenu apres completion totale avec score 70% minimum. Verification par QR Code." },
    { titre: "Certificat Expert",
      corps: "Niveau 3 · Obtenu apres completion avec score 85% minimum. Mention sur profil AcademIA Pro." },
    { titre: "Certificat Master",
      corps: "Niveau 4 · Obtenu apres completion d un pack complet avec scores 90% minimum. Mention Master AcademIA Pro." },
  ],
};

export default function MesCertificatsPage() {
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
