"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Mentions Legales",
  sousTitre: "Derniere mise a jour : juillet 2026",
  sections: [
    { titre: "Editeur du site",
      corps: "AcadémIA Pro LLC · 30 N Gould St STE R · Sheridan WY 82801 · Etats-Unis d Amerique. Numero d immatriculation (EIN Wyoming) : en cours d obtention. Email : contact@academiapro.fr" },
    { titre: "Responsable de la publication",
      corps: "AcadémIA Pro LLC, en qualite d editeur du site." },
    { titre: "Nature du service",
      corps: "AcadémIA Pro est une plateforme de formation professionnelle et de developpement personnel utilisant exclusivement des technologies d intelligence artificielle. Aucun professionnel de sante humain n intervient sur la plateforme. Les formations ne sont pas certifiantes au sens du RNCP/RS et ne sont pas eligibles au CPF ni aux financements OPCO." },
    { titre: "Hebergement",
      corps: "Site heberge par Vercel Inc. · 440 N Barranca Ave 4133 · Covina CA 91723 · Etats-Unis. Contact : privacy@vercel.com" },
    { titre: "Propriete intellectuelle",
      corps: "L ensemble du contenu de ce site (textes · images · formations · logos) est la propriete exclusive de AcadémIA Pro LLC. Toute reproduction sans autorisation est interdite." },
    { titre: "Donnees personnelles",
      corps: "Les donnees collectees sont traitees conformement a notre Politique de Confidentialite et au RGPD. Vous disposez d un droit d acces · de rectification · de suppression · de portabilite et d opposition sur vos donnees, a exercer a contact@academiapro.fr." },
    { titre: "Conditions de vente",
      corps: "Toute vente est regie par nos Conditions Generales de Vente et d Utilisation (/cgv). Pour les inscriptions en prevente, l Avenant Prevente (/cgv-prevente) s applique en complement et prevaut en cas de contradiction." },
    { titre: "Contact",
      corps: "Pour toute question : contact@academiapro.fr · Reponse sous 24h ouvrables." },
  ],
};

const carte = {
  background: "#1a1a2e", borderRadius: "16px",
  padding: "32px",
  border: "1px solid rgba(200,169,110,0.3)",
  marginBottom: "24px",
};

export default function MentionsLegalesPage() {
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
