"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQCategory = {
  category: string;
  icon: string;
  items: FAQItem[];
};

const faqData: FAQCategory[] = [
  {
    category: "Formations",
    icon: "🎓",
    items: [
      {
        question: "Comment accéder à mes formations après l'achat ?",
        answer:
          "Dès validation de votre paiement, vous recevez un email de confirmation avec vos identifiants d'accès. Connectez-vous sur votre espace personnel AcadémIA Pro et retrouvez toutes vos formations dans l'onglet 'Mes Formations'. L'accès est immédiat, 24h/24 et 7j/7.",
      },
      {
        question: "Quelle est la durée d'accès aux formations ?",
        answer:
          "Toutes nos formations sont accessibles à vie. Une fois achetée, vous pouvez revoir les modules autant de fois que vous le souhaitez, sans limite de temps. Les mises à jour de contenu sont incluses et automatiquement disponibles dans votre espace.",
      },
      {
        question: "Obtiendrai-je une certification à la fin de ma formation ?",
        answer:
          "Oui ! À l'issue de chaque formation, vous passez une évaluation finale. En cas de réussite (score minimum 70%), vous recevez un certificat de complétion numérique signé et daté, que vous pouvez partager sur LinkedIn ou intégrer à votre CV professionnel.",
      },
      {
        question: "Puis-je financer ma formation avec mon CPF ou une OPCO ?",
        answer:
          "Certaines de nos formations sont éligibles au financement CPF via Mon Compte Formation. Nous travaillons également avec de nombreuses OPCO pour la prise en charge employeur. Contactez notre service financement à financement@academia-pro.fr pour un accompagnement personnalisé.",
      },
    ],
  },
  {
    category: "Séances",
    icon: "📅",
    items: [
      {
        question: "Comment réserver une séance de coaching ?",
        answer:
          "La réservation s'effectue directement depuis votre tableau de bord. Cliquez sur 'Réserver une séance', choisissez votre coach, sélectionnez un créneau disponible dans le calendrier interactif et confirmez. Vous recevrez immédiatement un email de confirmation avec le lien de connexion.",
      },
      {
        question: "Quelle est la différence entre une séance visio et audio ?",
        answer:
          "La séance visio se déroule en vidéoconférence HD avec partage d'écran possible, idéale pour les démonstrations pratiques et le suivi de progression visuel. La séance audio est une communication téléphonique ou VoIP, parfaite si vous avez une connexion limitée ou préférez la discrétion. Les deux formats ont la même durée et le même tarif.",
      },
      {
        question: "Puis-je annuler ou reporter une séance réservée ?",
        answer:
          "Vous pouvez annuler ou reporter votre séance jusqu'à 24h avant l'heure prévue sans aucun frais. En dessous de ce délai, la séance est décomptée de votre crédit. En cas d'urgence avérée (maladie, accident), contactez notre support dans les 2h suivant la séance pour étude de votre dossier.",
      },
      {
        question: "Les séances sont-elles enregistrées et disponibles en replay ?",
        answer:
          "Avec votre accord explicite, les séances visio peuvent être enregistrées. Le replay est disponible dans votre espace personnel sous 24h après la séance et reste accessible pendant 90 jours. Les séances audio ne sont pas enregistrées pour des raisons de confidentialité.",
      },
    ],
  },
  {
    category: "Packs",
    icon: "📦",
    items: [
      {
        question: "Puis-je cumuler plusieurs packs AcadémIA Pro ?",
        answer:
          "Absolument ! Les packs sont conçus pour être cumulables. Si vous achetez le Pack Essentiel puis souhaitez évoluer vers le Pack Expert, vous bénéficiez d'une remise de fidélité sur la différence de prix. Vos crédits de séances s'additionnent et vos accès formations s'élargissent automatiquement.",
      },
      {
        question: "Quand les accès de mon pack sont-ils activés ?",
        answer:
          "L'activation est instantanée après confirmation du paiement. Vous recevez un récapitulatif détaillé de votre pack par email : formations débloquées, nombre de séances créditées, durée de validité des séances et tous les avantages inclus. Aucune attente, vous pouvez commencer immédiatement.",
      },
      {
        question: "Quelles économies réalisé-je en optant pour un pack ?",
        answer:
          "Les packs génèrent entre 25% et 45% d'économies par rapport aux achats à l'unité. Le Pack Starter offre 25% de réduction, le Pack Essentiel 35% et le Pack Expert jusqu'à 45%. Plus votre engagement est important, plus les économies sont significatives. Un simulateur de prix est disponible sur notre page Tarifs.",
      },
    ],
  },
  {
    category: "Technique",
    icon: "💻",
    items: [
      {
        question: "Sur quels appareils puis-je accéder à la plateforme ?",
        answer:
          "AcadémIA Pro est accessible sur tous vos appareils : ordinateur (Windows, macOS, Linux), tablette (iPad, Android) et smartphone (iOS, Android). L'interface est entièrement responsive et s'adapte automatiquement à la taille de votre écran pour une expérience optimale.",
      },
      {
        question: "Qu'est-ce que la PWA et comment l'installer ?",
        answer:
          "La Progressive Web App (PWA) vous permet d'installer AcadémIA Pro comme une application native sur votre appareil, sans passer par un store. Sur mobile, cliquez sur 'Ajouter à l'écran d'accueil' depuis votre navigateur. Sur desktop, cliquez sur l'icône d'installation dans la barre d'adresse. Profitez ainsi de l'accès hors-ligne aux contenus téléchargés.",
      },
      {
        question: "Quelle connexion internet est nécessaire pour les formations ?",
        answer:
          "Pour les vidéos en HD, une connexion de 10 Mbps minimum est recommandée. Pour les séances visio, comptez 5 Mbps en montant et descendant. En cas de connexion faible, la plateforme bascule automatiquement en mode basse résolution. Vous pouvez également télécharger les modules en avance pour un accès hors-ligne.",
      },
    ],
  },
  {
    category: "Paiement",
    icon: "💳",
    items: [
      {
        question: "Quels moyens de paiement acceptez-vous ?",
        answer:
          "Nous acceptons toutes les cartes bancaires (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay et les virements bancaires pour les montants supérieurs à 500€. Tous les paiements sont sécurisés par cryptage SSL 256 bits et traités via Stripe, certifié PCI-DSS niveau 1.",
      },
      {
        question: "Le paiement en 3x sans frais est-il disponible ?",
        answer:
          "Oui ! Le paiement en 3 fois sans frais est disponible pour tout achat entre 150€ et 2000€. Lors du règlement, sélectionnez l'option '3x sans frais'. Le premier tiers est prélevé immédiatement, puis les deux suivants à 30 et 60 jours. Aucun justificatif n'est requis, l'accord est instantané.",
      },
      {
        question: "Quelle est votre politique de remboursement ?",
        answer:
          "Nous offrons une garantie satisfait ou remboursé de 30 jours sur tous nos produits. Si vous n'êtes pas entièrement satisfait, contactez notre support à remboursement@academia-pro.fr dans les 30 jours suivant votre achat. Le remboursement intégral est effectué sous 5 à 10 jours ouvrés sur votre moyen de paiement initial, sans question posée.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string>("Formations");

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCategoryData = faqData.find((c) => c.category === activeCategory);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e8e0d0",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(200, 169, 110, 0.1)",
              border: "1px solid rgba(200, 169, 110, 0.3)",
              borderRadius: "50px",
              padding: "6px 20px",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                color: "#c8a96e",
                fontSize: "13px",
                fontWeight: "600",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Centre d'aide
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: "800",
              margin: "0 0 20px 0",
              lineHeight: "1.15",
              color: "#ffffff",
            }}
          >
            Questions{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              fréquentes
            </span>
          </h1>

          <p
            style={{
              fontSize: "17px",
              color: "#9a9080",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: "1.7",
            }}
          >
            Tout ce que vous devez savoir sur AcadémIA Pro. Vous ne trouvez pas
            votre réponse ?{" "}
            <span
              style={{
                color: "#c8a96e",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Contactez notre équipe
            </span>
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "48px",
          }}
        >
          {faqData.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                borderRadius: "50px",
                border:
                  activeCategory === cat.category
                    ? "1px solid #c8a96e"
                    : "1px solid rgba(255,255,255,0.08)",
                backgroundColor:
                  activeCategory === cat.category
                    ? "rgba(200, 169, 110, 0.15)"
                    : "rgba(255,255,255,0.03)",
                color:
                  activeCategory === cat.category ? "#c8a96e" : "#7a7060",
                fontSize: "14px",
                fontWeight: activeCategory === cat.category ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.2s ease",
                outline: "none",
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.category}</span>
            </button>
          ))}
        </div>

        {activeCategoryData && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "28px",
                paddingBottom: "20px",
                borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
              }}
            >
              <span style={{ fontSize: "28px" }}>{activeCategoryData.icon}</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#ffffff",
                }}
              >
                {activeCategoryData.category}
              </h2>
              <span
                style={{
                  marginLeft: "auto",
                  backgroundColor: "rgba(200, 169, 110, 0.1)",
                  color: "#c8a96e",
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  border: "1px solid rgba(200, 169, 110, 0.2)",
                }}
              >
                {activeCategoryData.items.length} questions
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activeCategoryData.items.map((item, index) => {
                const key = `${activeCategory}-${index}`;
                const isOpen = !!openItems[key];

                return (
                  <div
                    key={key}
                    style={{
                      border: isOpen
                        ? "1px solid rgba(200, 169, 110, 0.35)"
                        : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "14px",
                      backgroundColor: isOpen
                        ? "rgba(200, 169, 110, 0.04)"
                        : "rgba(255,255,255,0.02)",
                      overflow: "hidden",
                      transition: "border-color 0.25s ease, background-color 0.25s ease",
                    }}
                  >
                    <button
                      onClick={() => toggleItem(key)}