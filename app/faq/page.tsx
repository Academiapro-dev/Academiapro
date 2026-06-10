```tsx
"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, BookOpen, Heart, Package, Monitor, CreditCard, GraduationCap, Sparkles } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    id: "formations",
    title: "Formations",
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      {
        question: "Comment accéder à ma formation après l'achat ?",
        answer:
          "Après votre achat, vous recevrez un email de confirmation contenant vos identifiants d'accès dans les 5 minutes suivant la transaction. Connectez-vous ensuite sur votre espace personnel AcadémIA Pro via le bouton « Mon Espace » en haut à droite de la plateforme. Votre formation apparaîtra directement dans votre tableau de bord sous la section « Mes Formations ». Si vous ne recevez pas l'email, vérifiez vos spams ou contactez notre support via le chat en bas à droite.",
      },
      {
        question: "Quelle est la durée d'accès à mes formations ?",
        answer:
          "Toutes nos formations sont accessibles à vie une fois achetées. Il n'y a aucune limite de temps pour visionner ou revoir les contenus. Vous pouvez progresser à votre rythme, revenir sur les modules autant de fois que nécessaire, et profiter des mises à jour gratuites du contenu. En cas de mise à jour majeure d'une formation, vous êtes automatiquement notifié par email.",
      },
      {
        question: "Puis-je télécharger les supports de cours ?",
        answer:
          "Oui, les supports de cours (PDF, fiches synthèse, exercices pratiques) sont téléchargeables directement depuis chaque module de formation. Cliquez sur l'icône de téléchargement située sous la vidéo du cours. Les vidéos, elles, ne sont pas téléchargeables mais accessibles en streaming HD depuis tous vos appareils, même en mode hors ligne via notre application mobile PWA pour les contenus mis en cache.",
      },
      {
        question: "Comment obtenir ma certification ?",
        answer:
          "Pour obtenir votre certificat AcadémIA Pro, vous devez compléter l'intégralité des modules d'une formation (100% de progression) et réussir l'évaluation finale avec un score minimum de 70%. Une fois ces conditions remplies, votre certificat est généré automatiquement et disponible en téléchargement PDF depuis votre tableau de bord. Il est également partageable directement sur LinkedIn via un lien de vérification unique.",
      },
      {
        question: "Les formations sont-elles finançables ?",
        answer:
          "Certaines de nos formations sont éligibles au CPF (Compte Personnel de Formation) et à d'autres dispositifs de financement. Pour vérifier l'éligibilité d'une formation spécifique, consultez la fiche détaillée de la formation ou contactez notre équipe formation à formation@academia-pro.fr. Nous pouvons également vous accompagner dans vos démarches OPCO pour les financements en entreprise.",
      },
    ],
  },
  {
    id: "seances",
    title: "Séances Thérapeutiques",
    icon: <Heart className="w-5 h-5" />,
    items: [
      {
        question: "Comment réserver une séance ?",
        answer:
          "La réservation d'une séance se fait en 3 étapes simples depuis votre espace personnel : (1) Accédez à la section « Séances » dans votre tableau de bord, (2) Choisissez votre thérapeute parmi nos praticiens certifiés selon leurs spécialités et disponibilités, (3) Sélectionnez un créneau horaire qui vous convient. Vous recevrez une confirmation par email avec le lien de connexion à la séance 24h et 1h avant le rendez-vous.",
      },
      {
        question: "Quelle différence entre séance visio et audio ?",
        answer:
          "La séance visio (vidéo) vous permet d'interagir avec votre thérapeute en face à face via caméra, ce qui favorise une connexion plus profonde et permet au praticien de percevoir les expressions non-verbales. La séance audio fonctionne comme un appel téléphonique, idéale si vous préférez plus d'anonymat ou si votre connexion internet est limitée. Les deux formats ont la même durée (50 minutes) et le même tarif. Vous pouvez choisir le format lors de la réservation.",
      },
      {
        question: "Comment annuler ou reporter une séance ?",
        answer:
          "L'annulation ou le report d'une séance est possible jusqu'à 24h avant l'heure prévue sans frais. Pour ce faire, accédez à « Mes Séances » dans votre espace personnel et cliquez sur « Modifier » à côté de la séance concernée. En cas d'annulation moins de 24h avant la séance, 50% du montant sera retenu. Pour les cas d'urgence, contactez directement notre support au +33 1 XX XX XX XX. Les séances annulées dans les délais sont remboursées sous 3-5 jours ouvrés.",
      },
      {
        question: "Le replay est-il disponible ?",
        answer:
          "Avec votre accord explicite signé avant la séance, un enregistrement peut être réalisé et mis à disposition dans votre espace personnel sous 48h. Sans votre consentement préalable, aucune séance n'est enregistrée pour respecter la confidentialité thérapeutique. Le replay, si activé, est accessible pendant 30 jours depuis votre espace « Mes Replays » et n'est visible que par vous.",
      },
      {
        question: "Comment fonctionne l'abonnement séances ?",
        answer:
          "L'abonnement séances vous permet de bénéficier d'un tarif préférentiel sur un pack de séances mensuelles. Trois formules sont disponibles : Essentiel (2 séances/mois), Sérénité (4 séances/mois) et Intensif (8 séances/mois). Les séances non utilisées dans le mois sont reportables sur le mois suivant (dans la limite de 2 séances). L'abonnement est sans engagement et résiliable à tout moment depuis vos paramètres de compte.",
      },
    ],
  },
  {
    id: "packs",
    title: "Packs et Skills",
    icon: <Package className="w-5 h-5" />,
    items: [
      {
        question: "Puis-je acheter des formations individuellement ?",
        answer:
          "Absolument ! Toutes nos formations sont disponibles à l'unité. Vous pouvez parcourir notre catalogue complet et acheter uniquement les formations qui correspondent à vos besoins. Cependant, nos packs thématiques regroupant plusieurs formations complémentaires offrent une réduction pouvant aller jusqu'à 40% par rapport au prix à l'unité. Consultez la page « Packs » pour comparer les offres.",
      },
      {
        question: "Les packs sont-ils cumulables ?",
        answer:
          "Les packs AcadémIA Pro ne sont pas cumulables entre eux (vous ne pouvez pas acheter deux fois le même pack). En revanche, vous pouvez parfaitement acheter plusieurs packs différents et des formations individuelles en complément. Si vous possédez déjà une formation incluse dans un pack que vous souhaitez acheter, contactez notre support : nous vous proposerons un tarif ajusté déduisant les formations déjà acquises.",
      },
      {
        question: "Comment accéder aux Skills achetées ?",
        answer:
          "Les Skills (micro-formations courtes de 15 à 30 minutes) sont accessibles depuis la section dédiée « Mes Skills » dans votre tableau de bord. Elles sont organisées par thématique et niveau. Contrairement aux formations complètes, les Skills ne génèrent pas de certificat mais contribuent à votre score de progression global visible sur votre profil. Vous pouvez filtrer vos Skills par catégorie, durée ou statut (en cours / terminée).",
      },
    ],
  },
  {
    id: "technique",
    title: "Technique",
    icon: <Monitor className="w-5 h-5" />,
    items: [
      {
        question: "Sur quels appareils puis-je accéder à la plateforme ?",
        answer:
          "AcadémIA Pro est accessible sur tous les appareils connectés : ordinateurs (Windows, macOS, Linux), tablettes et smartphones (iOS 14+ et Android 10+). La plateforme est optimisée pour les navigateurs Chrome (v90+), Firefox (v88+), Safari (v14+) et Edge (v90+). Pour une expérience optimale des séances vidéo, nous recommandons une connexion internet d'au moins 5 Mbps. L'application mobile PWA est disponible pour une expérience native.",
      },
      {
        question: "Comment installer l'application mobile PWA ?",
        answer:
          "L'installation de notre PWA (Progressive Web App) se fait directement depuis votre navigateur mobile : Sur iOS (Safari) : Ouvrez academia-pro.fr, appuyez sur l'icône de partage puis « Sur l'écran d'accueil ». Sur Android (Chrome) : Ouvrez le site, appuyez sur les 3 points en haut à droite puis « Ajouter à l'écran d'accueil ». L'application se comporte comme une app native, fonctionne en mode hors ligne pour les contenus mis en cache et ne nécessite pas de mise à jour manuelle.",
      },
      {
        question: "J'ai un problème de connexion, que faire ?",
        answer:
          "En cas de problème de connexion, suivez ces étapes : (1) Vérifiez que votre email/mot de passe sont corrects — cliquez sur « Mot de passe oublié » si nécessaire. (2) Videz le cache de votre navigateur (Ctrl+Shift+Delete). (3) Désactivez temporairement votre VPN ou extension bloquante. (4) Essayez un autre navigateur. Si le problème persiste, notre support technique est disponible 7j/7 via le chat en temps réel sur la plateforme, par email à support@academia-pro.fr, ou au +33 1 XX XX XX XX (lun-ven, 9h-19h).",
      },
    ],
  },
  {
    id: "paiement",
    title: "Paiement et Remboursement",
    icon: <CreditCard className="w-5 h-5" />,
    items: [
      {
        question: "Quels moyens de paiement acceptez-vous ?",
        answer:
          "AcadémIA Pro accepte les paiements par carte bancaire (Visa, Mastercard, American Express), PayPal, virement bancaire (pour les commandes entreprise), et certains financements CPF via Mon Compte Formation. Tous les paiements sont sécurisés par le protocole SSL et traités via Stripe, certifié PCI DSS niveau 1. Vos données bancaires ne sont jamais stockées sur nos serveurs.",
      },
      {
        question: "Comment fonctionne la garantie 30 jours ?",
        answer:
          "Nous offrons une garantie satisfait ou remboursé de 30 jours sur toutes nos formations individuelles et packs. Si pour quelque raison que ce soit vous n'êtes pas satisfait, envoyez simplement un email à remboursement@academia-pro.fr dans les 30 jours suivant votre achat avec votre numéro de commande. Le remboursement intégral sera traité sous 5-7 jours ouvrés sur votre moyen de paiement initial. Cette garantie ne s'applique pas aux séances thérapeutiques déjà réalisées.",
      },
      {
        question: "Le paiement en 3x est-il disponible ?",
        answer:
          "Oui, le paiement en 3 fois sans frais est disponible pour toute commande supérieure à 150€. Il suffit de sélectionner l'option « Payer en 3x » lors du checkout. Le premier versement est prélevé immédiatement, le deuxième à J+30 et le troisième à J+60. Cette option est proposée en partenariat avec Alma. Pour les formations entreprise, nous proposons également des facilités de paiement personnalisées sur devis.",
      },
    ],
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-300 ${
        isOpen
          ? "border-[#c8a96e]/60 shadow-[0_0_20px_rgba(200,169,110,0.1)]"
          : "border-white/5 hover:border-[#c8a96e]/30"
      }`}
      style={{ background: isOpen ? "rgba(200,169,110,0.04)" : "rgba(255,255,255,0.02)" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className={`font-medium text-base leading-snug transition-colors duration-200 ${
            isOpen ? "text-[#c8a96e]" : "text-white/90 group-hover:text-[#c8a96e]"
          }`}
        >
          {item.question}
        </span>
        <ChevronDown
          className={`flex-shrink-0 w-5 h-5 mt-0.5 transition-all duration-300 ${
            isOpen ? "rotate-180 text-[#c8a96e]" : "text-white/40 group-hover:text-[#c8a96e]/70"
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-5">
            <div className="w-full h-px bg-[#c8a96e]/15 mb-4" />
            <p className="text-white/60 text-sm leading-relaxed">{item.answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySection({ category }: {