"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Financement de votre Formation",
  sousTitre: "Reglez en une fois ou en quatre mensualites",
  sections: [
    { titre: "Paiement en une fois",
      corps: "Reglement integral a l inscription, par carte bancaire. Facture adressee par courrier electronique dans les 24 heures." },
    { titre: "Paiement en quatre mensualites",
      corps: "Le montant de la formation est reparti en quatre echeances mensuelles egales, prelevees automatiquement. L acces a la formation est ouvert des la premiere echeance." },
    { titre: "Financement par votre entreprise",
      corps: "Votre employeur peut prendre en charge votre formation sur ses fonds propres. Nous fournissons devis, convention et facture a son nom, sur simple demande a contact@academiapro.fr." },
    { titre: "Absence de financement public",
      corps: "AcademIA Pro n est pas certifiee Qualiopi et ses formations ne sont enregistrees ni au RNCP ni au repertoire specifique. Elles ne sont donc eligibles ni au compte personnel de formation (CPF), ni a une prise en charge par un OPCO, ni a aucun autre financement public. La souscription se fait sur fonds propres." },
    { titre: "Retractation",
      corps: "Vous disposez de quatorze (14) jours pour vous retracter, tant que vous n avez accede a aucun contenu. Les modalites figurent sur la page consacree a la retractation." },
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
        <p style={{ textAlign: "center", marginTop: "16px" }}>
          <a href="/garantie" style={{ color: "#c8a96e", fontSize: "14px" }}>Droit de retractation</a>
          <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 10px" }}>·</span>
          <a href="/cgv" style={{ color: "#c8a96e", fontSize: "14px" }}>Conditions generales de vente</a>
        </p>
      </div>
    </div>
  );
}
