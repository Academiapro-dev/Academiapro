```typescript
// app/api/commercial-agent/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// ============================================================
// TYPES & INTERFACES
// ============================================================

type UserProfile =
  | "particulier"
  | "salarié"
  | "demandeur_emploi"
  | "entrepreneur";

type ObjectionType =
  | "trop_cher"
  | "pas_le_temps"
  | "pas_sûr"
  | "veut_réfléchir"
  | "none";

type AccompagnementLevel = "essentiel" | "premium" | "elite";

type SequenceDay = "J0" | "J1" | "J3" | "J7";

interface ProspectData {
  prospectId: string;
  sessionId: string;
  profile: UserProfile;
  visitCount: number;
  formationId?: string;
  formationTitle?: string;
  budget?: number;
  message?: string;
  sequenceDay?: SequenceDay;
  previousObjections?: ObjectionType[];
  companyName?: string;
  employeeCount?: number;
  actions?: ProspectAction[];
}

interface ProspectAction {
  type:
    | "visit"
    | "video_watch"
    | "syllabus_download"
    | "demo_request"
    | "faq_read"
    | "pricing_view"
    | "testimonial_read"
    | "cart_abandon";
  timestamp: string;
  duration?: number;
}

interface ScoringResult {
  score: number;
  level: "cold" | "warm" | "hot" | "burning";
  triggers: string[];
  recommendedAction: string;
}

interface AccompagnementOffer {
  level: AccompagnementLevel;
  name: string;
  price: number;
  features: string[];
  bestFor: string;
}

interface ConversionSequence {
  day: SequenceDay;
  subject: string;
  content: string;
  cta: string;
  ctaUrl: string;
}

interface Quote {
  quoteId: string;
  companyName: string;
  employeeCount: number;
  formations: Formation[];
  totalPrice: number;
  discount: number;
  finalPrice: number;
  validUntil: string;
  paymentOptions: PaymentOption[];
}

interface Formation {
  id: string;
  title: string;
  pricePerSeat: number;
  seats: number;
}

interface PaymentOption {
  type: "comptant" | "3x" | "6x" | "cpf" | "opco";
  label: string;
  monthlyAmount?: number;
  details: string;
}

interface AgentResponse {
  success: boolean;
  prospectId: string;
  score: ScoringResult;
  proactiveChat?: ProactiveChatTrigger;
  message: string;
  objectionHandling?: ObjectionResponse;
  offers?: AccompagnementOffer[];
  sequence?: ConversionSequence;
  quote?: Quote;
  nextAction: string;
  metadata: ResponseMetadata;
}

interface ProactiveChatTrigger {
  shouldTrigger: boolean;
  triggerReason: string;
  openingMessage: string;
  delay: number;
}

interface ObjectionResponse {
  detectedObjection: ObjectionType;
  response: string;
  incentive: string;
  urgency: string;
}

interface ResponseMetadata {
  timestamp: string;
  processingTime: number;
  model: string;
  tokensUsed?: number;
}

// ============================================================
// CONFIGURATION & CONSTANTES
// ============================================================

const SCORING_WEIGHTS: Record<string, number> = {
  visit: 5,
  video_watch: 15,
  syllabus_download: 20,
  demo_request: 30,
  faq_read: 8,
  pricing_view: 25,
  testimonial_read: 10,
  cart_abandon: 35,
  multiple_visits: 20,
  return_visit: 15,
};

const PROFILE_MULTIPLIERS: Record<UserProfile, number> = {
  entrepreneur: 1.3,
  salarié: 1.1,
  particulier: 1.0,
  demandeur_emploi: 0.9,
};

const ACCOMPAGNEMENT_OFFERS: AccompagnementOffer[] = [
  {
    level: "essentiel",
    name: "Essentiel",
    price: 297,
    features: [
      "Accès complet à la formation",
      "Supports PDF téléchargeables",
      "Forum communautaire",
      "Certificat de completion",
      "Accès 12 mois",
    ],
    bestFor: "Apprenants autonomes avec budget limité",
  },
  {
    level: "premium",
    name: "Premium",
    price: 597,
    features: [
      "Tout Essentiel inclus",
      "4 sessions coaching individuel (1h)",
      "Révisions de projets personnalisées",
      "Accès groupe WhatsApp VIP",
      "Garantie satisfaction 30 jours",
      "Accès à vie",
    ],
    bestFor: "Professionnels souhaitant un suivi personnalisé",
  },
  {
    level: "elite",
    name: "Élite",
    price: 1497,
    features: [
      "Tout Premium inclus",
      "Coaching illimité 6 mois",
      "Plan d'action sur-mesure",
      "Accès réseau alumni exclusif",
      "Garantie résultat ou remboursé",
      "Sessions live hebdomadaires",
      "Placement professionnel assisté",
    ],
    bestFor: "Transformation complète garantie",
  },
];

const OBJECTION_HANDLERS: Record<
  ObjectionType,
  { response: string; incentive: string; urgency: string }
> = {
  trop_cher: {
    response:
      "Je comprends totalement cette préoccupation. Permettez-moi de vous montrer comment rendre cet investissement accessible.",
    incentive:
      "Paiement en 3x sans frais disponible. Pour la formule Essentiel : seulement 99€/mois. CPF mobilisable jusqu'à 100% pour les salariés.",
    urgency:
      "Offre de paiement facilité disponible jusqu'à dimanche minuit uniquement.",
  },
  pas_le_temps: {
    response:
      "Bonne nouvelle : notre formation est conçue pour les professionnels occupés !",
    incentive:
      "20 minutes par jour suffisent. Modules courts de 8-12 minutes. Apprenez dans le bus, à la pause déjeuner, le soir. Mobile-first.",
    urgency:
      "Démarrez aujourd'hui et terminez en 6 semaines à votre rythme. Pas de dates imposées.",
  },
  pas_sûr: {
    response:
      "Votre hésitation est tout à fait légitime. C'est pourquoi nous avons créé une option sans risque.",
    incentive:
      "Accédez GRATUITEMENT au Module 1 complet (valeur 97€). Testez la qualité avant tout engagement. Garantie satisfait ou remboursé 30 jours.",
    urgency:
      "Plus de 2 847 apprenants ont franchi le pas avec cette garantie. Rejoignez-les sans risque.",
  },
  veut_réfléchir: {
    response:
      "Absolument, prenez le temps qu'il vous faut. Je mets en place un suivi personnalisé pour vous.",
    incentive:
      "Séquence d'emails enrichis sur 30 jours. Témoignages, études de cas, FAQ. Votre conseiller dédié disponible par chat.",
    urgency:
      "Votre place est réservée 72h au tarif actuel. Les prix augmentent le 1er du mois prochain.",
  },
  none: {
    response: "Comment puis-je vous aider à prendre la meilleure décision ?",
    incentive: "Découvrez notre formation et ses avantages uniques.",
    urgency: "Places limitées disponibles ce mois-ci.",
  },
};

const CONVERSION_SEQUENCES: Record<
  SequenceDay,
  { subject: string; content: string; cta: string; ctaUrl: string }
> = {
  J0: {
    subject: "🎯 Vous avez consulté [Formation] — Un message de votre coach",
    content:
      "Bonjour ! J'ai remarqué votre intérêt pour notre formation. Je suis là pour répondre à toutes vos questions. Avez-vous eu le temps de consulter le programme complet ? Voici ce que nos apprenants disent après la première semaine...",
    cta: "Voir les témoignages →",
    ctaUrl: "/formations/[id]/testimonials",
  },
  J1: {
    subject: "💡 [Prénom], voici ce que vous manquez (Module 1 offert)",
    content:
      "24h se sont écoulées depuis votre visite. Pour vous permettre de juger sur pièce, nous vous offrons un accès gratuit au Module 1. Pas de carte bancaire requise. Découvrez notre méthode en 20 minutes.",
    cta: "Accéder au Module 1 GRATUIT →",
    ctaUrl: "/formations/[id]/module-1-gratuit",
  },
  J3: {
    subject: "⏰ Votre place est encore disponible (mais pour combien de temps ?)",
    content:
      "Bonne nouvelle : nous avons encore quelques places disponibles pour la prochaine session. Mauvaise nouvelle : elles partent vite. Notre taux de complétion de 94% n'est pas un hasard — c'est notre méthode pédagogique unique.",
    cta: "Sécuriser ma place maintenant →",
    ctaUrl: "/formations/[id]/inscription",
  },
  J7: {
    subject: "🚀 Dernière chance — Offre spéciale expire dans 48h",
    content:
      "Il y a 7 jours, vous avez montré de l'intérêt pour votre développement professionnel. C'est le bon moment pour agir. Offre exceptionnelle : -20% sur la formule Premium + 2 sessions coaching offertes. Code : DECISION7",
    cta: "Profiter de l'offre -20% →",
    ctaUrl: "/formations/[id]/offre-speciale?code=DECISION7",
  },
};

const PROFILE_MESSAGES: Record<UserProfile, string> = {
  particulier:
    "Investissez dans vous-même. Cette formation est un tremplin vers vos objectifs personnels et professionnels.",
  salarié:
    "Votre CPF peut financer jusqu'à 100% de cette formation. Montez en compétences sans débourser un centime.",
  demandeur_emploi:
    "Pôle Emploi et les OPCO peuvent financer votre formation. Transformez cette période en opportunité de montée en compétences.",
  entrepreneur:
    "ROI mesurable en 30 jours. Cette formation vous permettra d'augmenter votre chiffre d'affaires et d'optimiser vos process.",
};

// ============================================================
// FONCTIONS