import React from "react";
"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  name: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    name: "Formations",
    items: [
      {
        question: "Quels types de formations proposez-vous ?",
        answer: "Nous proposons des formations en présentiel, en ligne et en format hybride. Nos programmes couvrent le développement personnel, le coaching sportif, la nutrition et le bien-être mental. Chaque formation est adaptée à votre niveau et vos objectifs."
      },
      {
        question: "Quelle est la durée moyenne d'une formation ?",
        answer: "La durée varie selon le programme choisi. Nos formations courtes durent entre 1 et 3 jours, tandis que nos programmes approfondis s'étendent sur 4 à 12 semaines. Vous pouvez consulter la durée exacte sur chaque fiche programme."
      },
      {
        question: "Les formations sont-elles certifiantes ?",
        answer: "Oui, la majorité de nos formations débouchent sur une certification reconnue. Un certificat de completion vous est délivré à l'issue de chaque programme validé. Certaines formations sont également éligibles au CPF."
      },
      {
        question: "Puis-je suivre une formation à mon rythme ?",
        answer: "Absolument. Nos formations en ligne sont disponibles 24h/24 et 7j/7. Vous accédez aux contenus à vie et pouvez progresser selon votre emploi du temps. Un suivi personnalisé est disponible en option."
      }
    ]
  },
  {
    name: "Séances",
    items: [
      {
        question: "Comment réserver une séance individuelle ?",
        answer: "Vous pouvez réserver votre séance directement via notre plateforme en choisissant le coach, le créneau horaire et le type de séance. Une confirmation par email vous est envoyée immédiatement après la réservation."
      },
      {
        question: "Quelle est la durée d'une séance standard ?",
        answer: "Une séance individuelle dure en général 60 minutes. Nous proposons également des formats de 30 minutes pour les séances de suivi et de 90 minutes pour les bilans approfondis. La durée est précisée lors de la réservation."
      },
      {
        question: "Puis-je annuler ou reporter une séance ?",
        answer: "Oui, toute annulation effectuée au moins 24 heures avant la séance est sans frais. En dessous de ce délai, la séance est due intégralement. Le report est possible jusqu'à 12 heures avant le début de la séance."
      },
      {
        question: "Les séances en ligne sont-elles aussi efficaces ?",
        answer: "Nos coachs sont formés spécifiquement pour les séances en ligne. La qualité de l'accompagnement est identique. Vous avez besoin d'une connexion internet stable, d'une webcam et d'un espace calme pour profiter pleinement de la séance."
      }
    ]
  },
  {
    name: "Packs",
    items: [
      {
        question: "Quels packs sont disponibles ?",
        answer: "Nous proposons trois gammes de packs : le Pack Découverte (3 séances), le Pack Essentiel (10 séances) et le Pack Premium (20 séances + formation incluse). Chaque pack offre une réduction significative par rapport aux séances à l'unité."
      },
      {
        question: "Les packs ont-ils une date d'expiration ?",
        answer: "Le Pack Découverte est valable 3 mois. Le Pack Essentiel est valable 6 mois. Le Pack Premium est valable 12 mois. Les séances non utilisées avant la date d'expiration sont perdues, sauf en cas de circonstances exceptionnelles."
      },
      {
        question: "Peut-on partager un pack entre plusieurs personnes ?",
        answer: "Les packs sont nominatifs et non cessibles. Ils sont strictement réservés à la personne qui en fait l'acquisition. Cependant, nous proposons des packs famille et entreprise spécifiques, veuillez nous contacter pour plus d'informations."
      },
      {
        question: "Comment activer mon pack après l'achat ?",
        answer: "Votre pack est automatiquement activé dès la confirmation de paiement. Vous recevez un email avec vos accès et votre espace personnel. La première séance peut être réservée immédiatement après réception de cet email."
      }
    ]
  },
  {
    name: "Technique",
    items: [
      {
        question: "Quels équipements sont nécessaires pour les séances en ligne ?",
        answer: "Vous avez besoin d'un ordinateur, d'une tablette ou d'un smartphone avec caméra et microphone. Une connexion internet d'au moins 5 Mbps est recommandée. Nous utilisons Zoom ou Google Meet selon les préférences du coach."
      },
      {
        question: "Comment accéder à mon espace personnel ?",
        answer: "Votre espace personnel est accessible via notre site web ou notre application mobile. Connectez-vous avec l'email et le mot de passe créés lors de votre inscription. En cas de difficulté, utilisez la fonction mot de passe oublié."
      },
      {
        question: "Les contenus de formation sont-ils téléchargeables ?",
        answer: "Certains contenus comme les PDF, fiches pratiques et supports de cours sont téléchargeables. Les vidéos de formation sont en streaming uniquement afin de protéger les droits d'auteur. Vous y accédez à vie depuis votre espace."
      },
      {
        question: "Que faire en cas de problème technique pendant une séance ?",
        answer: "En cas de coupure ou problème technique, contactez immédiatement votre coach via le chat de la plateforme ou par SMS. La séance peut être reprise ou un nouveau créneau est proposé sans frais supplémentaires si le problème est d'origine technique."
      }
    ]
  },
  {
    name: "Paiement",
    items: [
      {
        question: "Quels modes de paiement acceptez-vous ?",
        answer: "Nous acceptons les cartes bancaires Visa, Mastercard et American Express, ainsi que PayPal, les virements bancaires et le paiement en plusieurs fois sans frais pour les achats supérieurs à 300 euros."
      },
      {
        question: "Le paiement en plusieurs fois est-il possible ?",
        answer: "Oui, nous proposons le paiement en 3 ou 4 fois sans frais pour tout achat supérieur à 300 euros. Cette option est disponible lors du paiement par carte bancaire. La première échéance est prélevée immédiatement à la commande."
      },
      {
        question: "Comment obtenir une facture pour mon entreprise ?",
        answer: "Votre facture est générée automatiquement et disponible dans votre espace personnel sous la rubrique Mes Commandes. Pour une facture au nom de votre entreprise avec numéro de TVA, renseignez les informations lors de votre inscription ou contactez notre support."
      },
      {
        question: "Quelle est votre politique de remboursement ?",
        answer: "Vous bénéficiez d'un droit de rétractation de 14 jours pour tout achat en ligne. Les séances déjà consommées sont déduites du remboursement. Les formations dont vous avez accédé à plus de 20% du contenu ne sont pas remboursables. Contactez-nous pour toute demande."
      }
    ]
  }
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<string>("Formations");
  const [openItem, setOpenItem] = useState<number | null>(null);

  const gold = "#c8a96e";
  const darkBg = "#050508";

  const currentCategory = faqData.find(cat => cat.name === activeCategory);

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? null : index);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: darkBg,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "60px 20px"
    }}>
      <div style={{
        maxWidth: "860px",
        margin: "0 auto"
      }}>

        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <p style={{
            color: gold,
            fontSize: "13px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: "16px",
            fontWeight: "500"
          }}>
            Aide & Support
          </p>
          <h1 style={{
            color: "#ffffff",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: "700",
            margin: "0 0 20px 0",
            lineHeight: "1.2"
          }}>
            Questions Fréquentes
          </h1>
          <div style={{
            width: "60px",
            height: "2px",
            backgroundColor: gold,
            margin: "0 auto 24px auto"
          }} />
          <p style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "16px",
            maxWidth: "500px",
            margin: "0 auto",
            lineHeight: "1.7"
          }}>
            Retrouvez toutes les réponses à vos questions. Notre équipe reste disponible pour tout complément d information.
          </p>
        </div>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "center",
          marginBottom: "50px"
        }}>
          {faqData.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { setActiveCategory(cat.name); setOpenItem(null); }}
              style={{
                backgroundColor: activeCategory === cat.name ? gold : "transparent",
                color: activeCategory === cat.name ? darkBg : gold,
                border: "1px solid " + gold,
                padding: "10px 24px",
                borderRadius: "40px",
                fontSize: "13px",
                fontWeight: "600",
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.25s ease"
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          {currentCategory && currentCategory.items.map((item, index) => (
            <div
              key={index}
              style={{
                borderBottom: "1px solid rgba(200,169,110,0.15)",
                borderTop: index === 0 ? "1px solid rgba(200,169,110,0.15)" : "none"
              }}
            >
              <button
                onClick={() => toggleItem(index)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "26px 0",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: "20px"
                }}
              >
                <span style={{
                  color: openItem === index ? gold : "#ffffff",
                  fontSize: "16px",
                  fontWeight: "500",
                  lineHeight: "1.4",
                  transition: "color 0.25s ease"
                }}>
                  {item.question}
                </span>
                <span style={{
                  flexShrink: "0",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1px solid " + (openItem === index ? gold : "rgba(200,169,110,0.4)"),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: openItem === index ? gold : "transparent",
                  transition: "all 0.25s ease"
                }}>
                  <span style={{
                    color: openItem === index ? darkBg : gold,
                    fontSize: "18px",
                    lineHeight: "1",
                    fontWeight: "300",
                    transform: openItem === index ? "rotate(45deg)" : "rotate(0deg)",
                    display: "inline-block",
                    transition: "transform 0.25s ease"
                  }}>
                    +
                  </span>
                </span>
              </button>

              <div style={{
                maxHeight: openItem === index ? "400px" : "0",
                overflow: "hidden",
                transition: "max-height 0.4s ease"
              }}>
                <div style={{
                  paddingBottom: "28px",
                  paddingRight: "52px"
                }}>
                  <div style={{
                    width: "32px",
                    height: "2px",
                    backgroundColor: gold,
                    marginBottom: "16px",
                    opacity: "0.6"
                  }} />
                  <p style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: "15px",
                    lineHeight: "1.8",
                    margin: "0"
                  }}>
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: "70px",
          padding: "40px",
          border: "1px solid rgba(200,169,110,0.25)",
          borderRadius: "12px",
          backgroundColor: "rgba(200,169,110,0.04)",
          textAlign: "center"
        }}>
          <p style={{
            color: gold,
            fontSize: "12px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: "12px"
          }}>
            Besoin d aide
          </p>
          <h3 style={{
            color: "#ffffff",
            fontSize: "22px",
            fontWeight: "600",
            margin: "0 0 12px 0"
          }}>
            Vous n avez pas trouvé votre réponse ?
          </h3>
          <p style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
            margin: "0 0 28px 0",
            lineHeight: "1.7"
          }}>
            Notre équipe est disponible du lundi au vendredi de 9h à 18h pour vous accompagner.
          </p>
          <button style={{
            backgroundColor: gold,
            color: darkBg,
            border: "none",