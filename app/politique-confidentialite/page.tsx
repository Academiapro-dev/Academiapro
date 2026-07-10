"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Politique de Confidentialite",
  sousTitre: "Derniere mise a jour : juillet 2026",
  sections: [
    { titre: "Responsable du traitement",
      corps: "AcadémIA Pro LLC · 30 N Gould St STE R · Sheridan WY 82801 · Etats-Unis." },
    { titre: "Donnees collectees",
      corps: "Nous collectons : prenom · nom · email · metier · progression de formation · historique d achat. Aucune donnee sensible n est collectee." },
    { titre: "Finalites du traitement",
      corps: "Vos donnees servent a : gerer votre compte et vos formations · emettre vos certificats · vous envoyer les communications liees a votre apprentissage · ameliorer nos services." },
    { titre: "Base legale",
      corps: "Le traitement repose sur l execution du contrat de formation et votre consentement pour les communications marketing." },
    { titre: "Duree de conservation",
      corps: "Vos donnees sont conservees pendant la duree de votre compte · puis 3 ans apres la derniere activite. Les certificats sont conserves 10 ans." },
    { titre: "Vos droits",
      corps: "Vous disposez des droits d acces · rectification · suppression · portabilite et opposition. Contactez contact@academiapro.fr pour les exercer." },
    { titre: "Sous-traitants",
      corps: "Nos prestataires : Vercel (hebergement) · Supabase (base de donnees) · Anthropic (IA) · Resend (emails) · Stripe (paiements). Tous conformes RGPD." },
    { titre: "Securite",
      corps: "Vos donnees sont chiffrees en transit et au repos. L acces est strictement limite et journalise." },
  ],
};

const carte = {
  background: "#1a1a2e", borderRadius: "16px",
  padding: "32px",
  border: "1px solid rgba(200,169,110,0.3)",
  marginBottom: "24px",
};

export default function PolitiqueConfidentialitePage() {
  const { txt } = useTraductionAuto(FR);
  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "40px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center",
          marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px",
            letterSpacing: "3px", margin: "0 0 12px" }}>
            {txt.surTitre}
          </p>
          <h1 style={{ color: "#fff", fontSize: "32px",
            margin: "0 0 12px" }}>{txt.titre}</h1>
          <p style={{ color: "rgba(255,255,255,0.5)",
            fontSize: "13px", margin: "0" }}>
            {txt.sousTitre}
          </p>
        </div>
        {txt.sections.map((section, i) => (
          <div key={i} style={carte}>
            <h2 style={{ color: "#c8a96e", fontSize: "18px",
              margin: "0 0 14px" }}>{section.titre}</h2>
            <p style={{ color: "rgba(255,255,255,0.7)",
              fontSize: "14px", lineHeight: "1.8",
              margin: "0", whiteSpace: "pre-line" }}>
              {section.corps}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
