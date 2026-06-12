"use client";
import { useState } from "react";

export default function MentionsLegales() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const sections = [
    {
      title: "1. Éditeur du site",
      content: [
        "Nom de l'éditeur : AcadémIA Pro",
        "Responsable de la publication : Jacques Zenou",
        "Adresse e-mail : contact@academiapro.fr",
        "Statut : Éditeur professionnel de services numériques éducatifs",
      ],
    },
    {
      title: "2. Hébergement",
      content: [
        "Hébergeur : Vercel Inc.",
        "Adresse : 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis",
        "Site web : https://vercel.com",
        "Le site est déployé et hébergé via la plateforme Vercel, soumise à ses propres conditions générales d'utilisation.",
      ],
    },
    {
      title: "3. Droit applicable et juridiction",
      content: [
        "Le présent site est soumis au droit français.",
        "En cas de litige, les tribunaux français seront seuls compétents.",
        "Toute réclamation doit être adressée en priorité à l'éditeur par voie électronique à l'adresse contact@academiapro.fr avant toute action judiciaire.",
      ],
    },
    {
      title: "4. Propriété intellectuelle",
      content: [
        "L'ensemble des contenus présents sur ce site (textes, images, graphismes, logotypes, icônes, sons, logiciels) sont la propriété exclusive d'AcadémIA Pro ou de ses partenaires.",
        "Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces éléments est strictement interdite sans l'accord écrit préalable de l'éditeur.",
        "Toute violation de ces droits pourra faire l'objet de poursuites judiciaires conformément aux dispositions du Code de la propriété intellectuelle.",
      ],
    },
    {
      title: "5. Protection des données personnelles",
      content: [
        "Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données vous concernant.",
        "Pour exercer ces droits, contactez-nous à : contact@academiapro.fr",
        "Les données collectées via ce site sont utilisées exclusivement dans le cadre des services proposés par AcadémIA Pro et ne sont en aucun cas cédées à des tiers sans consentement explicite.",
      ],
    },
    {
      title: "6. Cookies",
      content: [
        "Ce site peut utiliser des cookies techniques nécessaires à son bon fonctionnement.",
        "Aucun cookie publicitaire ou de traçage commercial n'est déposé sans votre consentement préalable.",
        "Vous pouvez configurer votre navigateur pour refuser les cookies. Cela peut affecter certaines fonctionnalités du site.",
      ],
    },
    {
      title: "7. Limitation de responsabilité",
      content: [
        "AcadémIA Pro s'efforce de fournir des informations aussi précises et à jour que possible. Toutefois, l'éditeur ne saurait être tenu responsable des omissions, inexactitudes ou lacunes dans la mise à jour.",
        "Les liens hypertextes présents sur ce site peuvent renvoyer vers d'autres sites. AcadémIA Pro décline toute responsabilité quant au contenu de ces sites externes.",
      ],
    },
    {
      title: "8. Contact",
      content: [
        "Pour toute question relative aux présentes mentions légales ou à l'utilisation du site, vous pouvez nous contacter à l'adresse suivante :",
        "contact@academiapro.fr",
        "Nous nous engageons à répondre dans un délai de 72 heures ouvrées.",
      ],
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "#e8dfc8",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "60px 24px 80px 24px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "56px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: "#c8a96e",
              color: "#050508",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "3px",
              textTransform: "uppercase",
              padding: "6px 18px",
              borderRadius: "2px",
              marginBottom: "24px",
            }}
          >
            AcadémIA Pro
          </div>

          <h1
            style={{
              fontSize: "38px",
              fontWeight: "300",
              color: "#ffffff",
              margin: "0 0 16px 0",
              letterSpacing: "1px",
              lineHeight: "1.2",
            }}
          >
            Mentions{" "}
            <span
              style={{
                color: "#c8a96e",
                fontWeight: "600",
              }}
            >
              Légales
            </span>
          </h1>

          <p
            style={{
              color: "#8a7a5a",
              fontSize: "14px",
              margin: "0",
              letterSpacing: "0.5px",
            }}
          >
            Conformément aux articles 6-III et 19 de la Loi n°2004-575 du 21 juin 2004
            pour la Confiance dans l'Économie Numérique (LCEN)
          </p>

          <div
            style={{
              width: "60px",
              height: "2px",
              backgroundColor: "#c8a96e",
              margin: "28px auto 0 auto",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {sections.map((section, index) => (
            <div
              key={index}
              style={{
                backgroundColor: openSection === index ? "#0d0d14" : "#08080f",
                border: openSection === index ? "1px solid #c8a96e" : "1px solid #1a1a28",
                borderRadius: "6px",
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
            >
              <button
                onClick={() => toggle(index)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 24px",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: openSection === index ? "#c8a96e" : "#d4c4a0",
                  fontSize: "15px",
                  fontWeight: openSection === index ? "600" : "400",
                  letterSpacing: "0.3px",
                  transition: "color 0.2s ease",
                }}
              >
                <span>{section.title}</span>
                <span
                  style={{
                    fontSize: "20px",
                    color: "#c8a96e",
                    fontWeight: "300",
                    lineHeight: "1",
                    transform: openSection === index ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                    display: "inline-block",
                  }}
                >
                  +
                </span>
              </button>

              {openSection === index && (
                <div
                  style={{
                    padding: "0 24px 24px 24px",
                    borderTop: "1px solid #1a1a28",
                  }}
                >
                  <div style={{ paddingTop: "20px" }}>
                    {section.content.map((line, i) => (
                      <p
                        key={i}
                        style={{
                          color: "#a09070",
                          fontSize: "14px",
                          lineHeight: "1.75",
                          margin: "0 0 10px 0",
                          paddingLeft: "12px",
                          borderLeft: "2px solid #2a2010",
                        }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "56px",
            padding: "28px 32px",
            backgroundColor: "#08080f",
            border: "1px solid #1a1a28",
            borderRadius: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <p
            style={{
              color: "#c8a96e",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: "0",
            }}
          >
            Récapitulatif éditeur
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginTop: "8px",
            }}
          >
            <div>
              <p
                style={{
                  color: "#4a4030",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Éditeur
              </p>
              <p
                style={{
                  color: "#d4c4a0",
                  fontSize: "14px",
                  margin: "0",
                }}
              >
                AcadémIA Pro
              </p>
            </div>

            <div>
              <p
                style={{
                  color: "#4a4030",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Responsable
              </p>
              <p
                style={{
                  color: "#d4c4a0",
                  fontSize: "14px",
                  margin: "0",
                }}
              >
                Jacques Zenou
              </p>
            </div>

            <div>
              <p
                style={{
                  color: "#4a4030",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Hébergement
              </p>
              <p
                style={{
                  color: "#d4c4a0",
                  fontSize: "14px",
                  margin: "0",
                }}
              >
                Vercel Inc.
              </p>
            </div>

            <div>
              <p
                style={{
                  color: "#4a4030",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Contact
              </p>
              <p
                style={{
                  color: "#c8a96e",
                  fontSize: "14px",
                  margin: "0",
                }}
              >
                contact@academiapro.fr
              </p>
            </div>

            <div>
              <p
                style={{
                  color: "#4a4030",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Droit applicable
              </p>
              <p
                style={{
                  color: "#d4c4a0",
                  fontSize: "14px",
                  margin: "0",
                }}
              >
                Droit français
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "48px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "1px",
              backgroundColor: "#2a2010",
              margin: "0 auto 16px auto",
            }}
          />
          <p
            style={{
              color: "#3a3020",
              fontSize: "12px",
              letterSpacing: "0.5px",
              margin: "0",
            }}
          >
            © 2024 AcadémIA Pro — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}