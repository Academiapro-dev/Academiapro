```typescript
// app/api/commercial-agent/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// ============================================================
// TYPES & INTERFACES
// ============================================================

type UserProfile =
  | "particulier"
  | "salarie"
  | "demandeur_emploi"
  | "entrepreneur";

type ObjectionType =
  | "trop_cher"
  | "pas_le_temps"
  | "pas_sur"
  | "veut_reflechir"
  | "autre";

type AccompagnementLevel = "essentiel" | "premium" | "vip";

type ConversionDay = "J0" | "J1" | "J3" | "J7";

interface ProspectSession {
  sessionId: string;
  userId?: string;
  profile?: UserProfile;
  visitCount: number;
  formationId?: string;
  formationName?: string;
  lastVisitTimestamp: number;
  firstVisitTimestamp: number;
  score: number;
  conversionDay: ConversionDay;
  detectedBudget?: "low" | "medium" | "high";
  company?: string;
  employeeCount?: number;
  actions: ProspectAction[];
}

interface ProspectAction {
  type: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface ScoringRule {
  action: string;
  points: number;
  description: string;
}

interface AccompagnementOffer {
  level: AccompagnementLevel;
  name: string;
  price: number;
  features: string[];
  idealFor: string;
}

interface ConversionMessage {
  subject: string;
  body: string;
  cta: string;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface AutoQuote {
  quoteNumber: string;
  company: string;
  date: string;
  validUntil: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentTerms: string;
  notes: string;
}

interface CommercialAgentRequest {
  action:
    | "chat"
    | "score_prospect"
    | "check_proactive_trigger"
    | "generate_quote"
    | "get_conversion_sequence"
    | "handle_objection"
    | "get_offers_by_profile";
  message?: string;
  session: ProspectSession;
  objectionType?: ObjectionType;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

interface CommercialAgentResponse {
  success: boolean;
  data?: {
    reply?: string;
    score?: number;
    scoreBreakdown?: Record<string, number>;
    shouldTriggerProactiveChat?: boolean;
    proactiveChatMessage?: string;
    quote?: AutoQuote;
    conversionSequence?: Record<ConversionDay, ConversionMessage>;
    objectionResponse?: string;
    offers?: AccompagnementOffer[];
    updatedSession?: ProspectSession;
    suggestedNextAction?: string;
  };
  error?: string;
  metadata?: {
    processingTime: number;
    model: string;
    tokensUsed?: number;
  };
}

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================

const SCORING_RULES: ScoringRule[] = [
  { action: "page_visit", points: 2, description: "Visite d'une page" },
  {
    action: "formation_view",
    points: 5,
    description: "Vue fiche formation",
  },
  {
    action: "formation_repeated_view",
    points: 15,
    description: "3+ vues même formation",
  },
  {
    action: "pricing_view",
    points: 10,
    description: "Vue page tarification",
  },
  {
    action: "chat_initiated",
    points: 8,
    description: "Initiation du chat",
  },
  {
    action: "demo_requested",
    points: 25,
    description: "Demande de démo",
  },
  {
    action: "brochure_downloaded",
    points: 12,
    description: "Téléchargement brochure",
  },
  {
    action: "video_watched_50",
    points: 8,
    description: "Vidéo visionnée à 50%",
  },
  {
    action: "video_watched_100",
    points: 15,
    description: "Vidéo visionnée en entier",
  },
  {
    action: "quiz_completed",
    points: 20,
    description: "Quiz de positionnement complété",
  },
  {
    action: "testimonial_read",
    points: 5,
    description: "Lecture témoignage",
  },
  {
    action: "comparison_page",
    points: 18,
    description: "Comparaison des offres",
  },
  {
    action: "faq_read",
    points: 7,
    description: "Lecture FAQ",
  },
  {
    action: "email_opened",
    points: 3,
    description: "Email ouvert",
  },
  {
    action: "email_clicked",
    points: 10,
    description: "Lien email cliqué",
  },
  {
    action: "profile_completed",
    points: 20,
    description: "Profil complété",
  },
  {
    action: "cart_added",
    points: 30,
    description: "Ajout au panier",
  },
  {
    action: "checkout_started",
    points: 40,
    description: "Paiement initié",
  },
  {
    action: "free_module_started",
    points: 25,
    description: "Module gratuit démarré",
  },
];

const ACCOMPAGNEMENT_OFFERS: AccompagnementOffer[] = [
  {
    level: "essentiel",
    name: "Essentiel",
    price: 297,
    features: [
      "Accès illimité à la formation",
      "Support email sous 48h",
      "Communauté privée en ligne",
      "Ressources pédagogiques téléchargeables",
      "Certificat de réussite",
    ],
    idealFor: "Profils autonomes avec budget maîtrisé",
  },
  {
    level: "premium",
    name: "Premium",
    price: 597,
    features: [
      "Tout l'Essentiel inclus",
      "2 sessions coaching individuel (1h)",
      "Correction personnalisée des exercices",
      "Support prioritaire sous 4h",
      "Accès aux sessions live mensuelles",
      "Groupe WhatsApp exclusif",
    ],
    idealFor: "Profils cherchant un encadrement personnalisé",
  },
  {
    level: "vip",
    name: "VIP Intensif",
    price: 1497,
    features: [
      "Tout le Premium inclus",
      "8 sessions coaching individuel (1h)",
      "Suivi hebdomadaire personnalisé",
      "Hotline directe formateur",
      "Plan d'action sur-mesure",
      "Garantie résultat ou remboursé",
      "Accès vie entière aux mises à jour",
    ],
    idealFor: "Profils cherchant les meilleurs résultats garantis",
  },
];

const PROFILE_DISCOUNT: Record<UserProfile, number> = {
  particulier: 0,
  salarie: 10,
  demandeur_emploi: 30,
  entrepreneur: 15,
};

const PROFILE_FINANCING: Record<UserProfile, string[]> = {
  particulier: [
    "Paiement en 3x sans frais",
    "Carte bancaire, virement, PayPal",
  ],
  salarie: [
    "CPF (Compte Personnel Formation)",
    "Prise en charge employeur possible",
    "Paiement en 3x sans frais",
  ],
  demandeur_emploi: [
    "Prise en charge Pôle Emploi / France Travail",
    "AIF (Aide Individuelle à la Formation)",
    "Paiement en 3x sans frais",
  ],
  entrepreneur: [
    "Déductible fiscalement",
    "OPCO (pour TNS éligibles)",
    "Paiement en 3x sans frais",
    "Facture entreprise disponible",
  ],
};

// ============================================================
// SYSTEM PROMPT BUILDER
// ============================================================

function buildSystemPrompt(session: ProspectSession): string {
  const profileContext = session.profile
    ? getProfileContext(session.profile)
    : "profil non défini";

  const urgencyLevel =
    session.score >= 70
      ? "ÉLEVÉE"
      : session.score >= 40
        ? "MODÉRÉE"
        : "FAIBLE";

  const financing = session.profile
    ? PROFILE_FINANCING[session.profile].join(", ")
    : "Paiement en 3x sans frais disponible";

  return `Tu es Alex, l'agent commercial expert d'AcadémIA Pro, une plateforme de formation professionnelle en ligne de premier plan. 
Tu combines empathie, expertise pédagogique et excellence commerciale.

═══════════════════════════════════════
CONTEXTE PROSPECT ACTUEL
═══════════════════════════════════════
• Session ID: ${session.sessionId}
• Score d'intérêt: ${session.score}/100 (urgence ${urgencyLevel})
• Profil détecté: ${profileContext}
• Formation consultée: ${session.formationName || "Non spécifiée"}
• Nombre de visites: ${session.visitCount}
• Phase séquence: ${session.conversionDay}
• Budget estimé: ${session.detectedBudget || "non détecté"}
${session.company ? `• Entreprise: ${session.company} (${session.employeeCount || "?"} employés)` : ""}

═══════════════════════════════════════
TA MISSION COMMERCIALE
═══════════════════════════════════════
1. QUALIFIER rapidement le besoin réel du prospect
2. CRÉER de la valeur avant de parler prix
3. TRAITER les objections avec empathie et preuves sociales
4. PROPOSER l'offre adaptée au profil et budget
5. CONVERTIR avec une offre limitée dans le temps (urgence éthique)

═══════════════════════════════════════
OFFRES DISPONIBLES
═══════════════════════════════════════
• Essentiel: 297€ → Formation complète + support email + communauté
• Premium: 597€ → + 2 coachings individuels + suivi personnalisé
• VIP Intensif: 1 497€ → + 8 coachings + garantie résultat + accès à vie

Options de financement pour ce profil: ${financing}

═══════════════════════════════════════
TRAITEMENT DES OBJECTIONS
═══════════════════════════════════════
❌ "Trop cher" → 
  - Ramener au coût par jour (ex: 297€ = 0,81€/jour sur 1 an)
  - Proposer le paiement en 3x SANS