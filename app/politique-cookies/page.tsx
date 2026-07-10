"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Politique de Cookies",
  sousTitre: "Derniere mise a jour : juillet 2026",
  sections: [
    { titre: "Qu est-ce qu un cookie",
      corps: "Un cookie est un petit fichier texte depose sur votre appareil lors de votre visite. Il permet de memoriser vos preferences et d ameliorer votre experience." },
    { titre: "Cookies essentiels",
      corps: "Necessaires au fonctionnement du site : session de connexion · panier · preferences de langue. Ils ne peuvent pas etre desactives." },
    { titre: "Cookies de mesure d audience",
      corps: "Nous utilisons des outils de mesure pour comprendre l utilisation du site et l ameliorer. Ces donnees sont anonymisees." },
    { titre: "Gestion de vos preferences",
      corps: "Vous pouvez configurer vos preferences via le bandeau de consentement lors de votre premiere visite · ou dans les reglages de votre navigateur." },
    { titre: "Duree de conservation",
      corps: "Les cookies sont conserves 13 mois maximum. Votre consentement est redemande a expiration." },
    { titre: "Contact",
      corps: "Pour toute question sur nos cookies : contact@academiapro.fr" },
  ],
};

const carte = {
  background: "#1a1a2e", borderRadius: "16px",
  padding: "32px",
  border: "1px solid rgba(200,169,110,0.3)",
  marginBottom: "24px",
};

export default function PolitiqueCookiesPage() {
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
