"use client";
import React from "react";

const CAS = [
  {
    titre: "Société de tête à l'étranger",
    sous: "Détient les parts de la société d'exploitation",
    valeur: "Cas type",
    detail: "Déclarations annuelles dans l'État d'immatriculation, formulaires fiscaux du pays de tête, déclaration des comptes détenus à l'étranger.",
  },
  {
    titre: "Société d'exploitation en France",
    sous: "Porte l'activité, les salariés et les clients",
    valeur: "Cas type",
    detail: "Liasse fiscale, TVA, cotisation foncière des entreprises, obligations sociales. Rien de tout cela ne disparaît par la présence d'une société de tête.",
  },
  {
    titre: "Licence de marque",
    sous: "La société de tête facture l'exploitation",
    valeur: "À justifier",
    detail: "Suppose une marque réellement déposée et un taux conforme aux prix de marché. Les prix de transfert doivent être documentés.",
  },
  {
    titre: "Prestations techniques",
    sous: "Refacturation de moyens réels",
    valeur: "À justifier",
    detail: "La prestation doit exister, être documentée et facturée à un prix comparable à celui pratiqué entre entreprises indépendantes.",
  },
  {
    titre: "Frais de direction",
    sous: "Refacturation d'une direction effective",
    valeur: "À justifier",
    detail: "Point le plus surveillé. Le lieu de direction effective détermine où la société est imposable, quel que soit son pays d'immatriculation.",
  },
  {
    titre: "Ce que l'outil fait",
    sous: "Et ce qu'il ne fait pas",
    valeur: "Obligations",
    detail: "Mr. Compliance établit la carte des obligations déclaratives qui découlent d'une situation donnée. Il ne recommande aucune structure et ne remplace pas un professionnel.",
  },
];

export default function StructuresInternationales() {
  const carte = {
    background: "#1a1a2e",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid rgba(200,169,110,0.3)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>MR. COMPLIANCE</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>Structures internationales</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0" }}>
            Cas types documentés et obligations déclaratives associées
          </p>
        </div>

        <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "12px", padding: "20px 24px", marginBottom: "32px" }}>
          <p style={{ color: "#c8a96e", fontWeight: "bold", margin: "0 0 8px", fontSize: "16px" }}>
            Ce que présente cette page
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
            Des cas types rencontrés par les entreprises détenues depuis l'étranger, et les obligations
            déclaratives que chacun entraîne. Ce document ne constitue ni un conseil fiscal ni un conseil
            juridique, et ne préconise aucune structure. Toute décision d'organisation relève d'un
            professionnel du chiffre ou du droit.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {CAS.map((c) => (
            <div key={c.titre} style={carte}>
              <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 8px" }}>{c.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 14px" }}>{c.sous}</p>
              <p style={{ color: "#fff", fontSize: "20px", fontWeight: "bold", margin: "0 0 12px" }}>{c.valeur}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: 0, lineHeight: "1.65" }}>{c.detail}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <a
            href="/admin/compliance"
            style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}
          >
            Établir la carte des obligations
          </a>
        </div>

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "40px", textAlign: "center", lineHeight: "1.7" }}>
          Le lieu de direction effective, et non le pays d'immatriculation, détermine où une société est
          imposable. C'est le point que tout projet d'organisation internationale doit examiner en premier.
        </p>

      </div>
    </div>
  );
}
