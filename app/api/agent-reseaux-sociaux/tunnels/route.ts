```typescript
// app/api/agent-reseaux-sociaux/tunnels/route.ts
// Routes principales - Stats et optimisation

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type Platform = "linkedin" | "instagram" | "tiktok" | "facebook" | "youtube";

export type TunnelStage =
  | "awareness"
  | "lead_captured"
  | "nurturing"
  | "starter_pack_47"
  | "formation_690"
  | "pack_complet_2690";

export type TriggerKeyword =
  | "CLAUDE"
  | "PROMPT"
  | "FORMATION"
  | "EBOOK"
  | "LINKTREE"
  | "TUTORIAL";

export interface ProspectProfile {
  id: string;
  email?: string;
  platform: Platform;
  source: string;
  engagementScore: number;
  currentStage: TunnelStage;
  triggers: TriggerKeyword[];
  entryDate: string;
  lastInteraction: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface TunnelConfig {
  platform: Platform;
  stages: TunnelStageConfig[];
  triggers: TriggerKeyword[];
  conversionGoals: ConversionGoal[];
  scoring: ScoringRule[];
}

export interface TunnelStageConfig {
  stage: TunnelStage;
  name: string;
  description: string;
  action: string;
  nextStage: TunnelStage | null;
  delay: number; // heures
  message: string;
  conversionValue: number;
}

export interface ConversionGoal {
  stage: TunnelStage;
  targetRate: number;
  currentRate: number;
  revenue: number;
}

export interface ScoringRule {
  action: string;
  points: number;
  description: string;
}

export interface TunnelTriggerPayload {
  platform: Platform;
  triggerType: TriggerKeyword;
  prospectData: {
    userId: string;
    username: string;
    email?: string;
    comment?: string;
    postId?: string;
    videoId?: string;
  };
  timestamp: string;
}

export interface TunnelStats {
  platform: Platform;
  period: string;
  totalProspects: number;
  stageBreakdown: Record<TunnelStage, number>;
  conversionRates: Record<string, number>;
  revenue: {
    starter_pack: number;
    formation: number;
    pack_complet: number;
    total: number;
  };
  engagementMetrics: {
    avgScore: number;
    topTriggers: Array<{ trigger: string; count: number }>;
    dropOffStages: Array<{ stage: TunnelStage; rate: number }>;
  };
  weeklyReport: WeeklyReport;
}

export interface WeeklyReport {
  week: string;
  newLeads: number;
  conversions: number;
  revenue: number;
  topPerformingPlatform: Platform;
  recommendations: string[];
}

export interface OptimizationRequest {
  platform: Platform;
  metric: "conversion_rate" | "engagement" | "revenue" | "all";
  currentPerformance: Record<string, number>;
}

export interface OptimizationResult {
  platform: Platform;
  suggestions: OptimizationSuggestion[];
  abTests: ABTest[];
  priorityActions: string[];
  estimatedImpact: {
    conversionIncrease: number;
    revenueIncrease: number;
  };
}

export interface OptimizationSuggestion {
  category: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
  estimatedImpact: string;
}

export interface ABTest {
  testId: string;
  element: string;
  variantA: string;
  variantB: string;
  hypothesis: string;
  duration: string;
}

// ============================================================
// CONFIGURATIONS DES TUNNELS PAR PLATEFORME
// ============================================================

const TUNNEL_CONFIGS: Record<Platform, TunnelConfig> = {
  linkedin: {
    platform: "linkedin",
    triggers: ["CLAUDE"],
    stages: [
      {
        stage: "awareness",
        name: "Post Conseil IA Gratuit",
        description: "Publication d'un conseil IA à haute valeur sur LinkedIn",
        action: "publish_linkedin_post",
        nextStage: "lead_captured",
        delay: 0,
        message:
          "🤖 Découvrez comment l'IA peut transformer votre productivité ! Commentez 'CLAUDE' pour recevoir votre e-book gratuit.",
        conversionValue: 0,
      },
      {
        stage: "lead_captured",
        name: "ManyChat CLAUDE → Email + E-book",
        description: "Capture email via commentaire CLAUDE + envoi e-book automatique",
        action: "manychat_trigger_claude",
        nextStage: "nurturing",
        delay: 0,
        message:
          "🎉 Voici votre e-book gratuit 'Maîtriser l'IA en 7 jours' ! Préparez-vous à découvrir des stratégies puissantes...",
        conversionValue: 0,
      },
      {
        stage: "nurturing",
        name: "Séquence Email 7 Jours",
        description: "7 emails de nurturing avec valeur progressive",
        action: "start_7day_sequence",
        nextStage: "starter_pack_47",
        delay: 24,
        message:
          "📧 Jour {day}/7 : Aujourd'hui, je vous révèle la technique {technique} utilisée par les pros de l'IA...",
        conversionValue: 0,
      },
      {
        stage: "starter_pack_47",
        name: "Offre Starter Pack 47€",
        description: "Présentation et vente du Starter Pack",
        action: "offer_starter_pack",
        nextStage: "formation_690",
        delay: 168, // 7 jours
        message:
          "🚀 Prêt à passer au niveau supérieur ? Le Starter Pack AcadémIA Pro est fait pour vous. 47€ seulement !",
        conversionValue: 47,
      },
      {
        stage: "formation_690",
        name: "Formation Complète 690€",
        description: "Upsell vers la formation complète",
        action: "offer_formation_complete",
        nextStage: "pack_complet_2690",
        delay: 48,
        message:
          "💡 Vous avez adoré le Starter Pack ? La Formation Complète va vous propulser vers l'excellence IA. 690€ investissement.",
        conversionValue: 690,
      },
      {
        stage: "pack_complet_2690",
        name: "Pack IA Complet 2690€",
        description: "Offre premium Pack IA Complet",
        action: "offer_pack_complet",
        nextStage: null,
        delay: 72,
        message:
          "🏆 Pour ceux qui veulent le meilleur : Pack IA Complet avec accompagnement personnalisé. 2 690€ - Places limitées !",
        conversionValue: 2690,
      },
    ],
    scoring: [
      { action: "comment_trigger", points: 15, description: "Commentaire CLAUDE" },
      { action: "email_open", points: 5, description: "Email ouvert" },
      { action: "email_click", points: 10, description: "Clic dans email" },
      { action: "ebook_downloaded", points: 20, description: "E-book téléchargé" },
      { action: "linkedin_profile_visit", points: 8, description: "Visite profil" },
      { action: "purchase_starter", points: 100, description: "Achat Starter Pack" },
    ],
    conversionGoals: [
      { stage: "lead_captured", targetRate: 0.35, currentRate: 0, revenue: 0 },
      { stage: "starter_pack_47", targetRate: 0.08, currentRate: 0, revenue: 47 },
      { stage: "formation_690", targetRate: 0.15, currentRate: 0, revenue: 690 },
      { stage: "pack_complet_2690", targetRate: 0.1, currentRate: 0, revenue: 2690 },
    ],
  },

  instagram: {
    platform: "instagram",
    triggers: ["LINKTREE"],
    stages: [
      {
        stage: "awareness",
        name: "Reel Viral Astuce IA 30s",
        description: "Reel court et viral démontrant une astuce IA impressionnante",
        action: "publish_instagram_reel",
        nextStage: "lead_captured",
        delay: 0,
        message:
          "✨ Cette astuce IA va vous faire gagner 2h par jour ! 👆 Lien en bio pour le mini-cours gratuit",
        conversionValue: 0,
      },
      {
        stage: "lead_captured",
        name: "Bio → Linktree → Lead Magnet",
        description: "Redirection bio vers Linktree puis page de capture",
        action: "redirect_linktree_leadmagnet",
        nextStage: "nurturing",
        delay: 0,
        message:
          "🎁 Accédez à votre mini-cours IA gratuit de 3 jours ! Entrez votre email pour commencer immédiatement.",
        conversionValue: 0,
      },
      {
        stage: "nurturing",
        name: "Mini-Cours 3 Jours",
        description: "Séquence mini-cours IA sur 3 jours",
        action: "start_3day_minicours",
        nextStage: "starter_pack_47",
        delay: 24,
        message:
          "📱 Jour {day}/3 du Mini-Cours IA : {content} - Partagez votre progression en story !",
        conversionValue: 0,
      },
      {
        stage: "starter_pack_47",
        name: "Starter Pack 47€",
        description: "Offre Starter Pack post mini-cours",
        action: "offer_starter_pack",
        nextStage: "formation_690",
        delay: 72,
        message:
          "🔥 Vous avez terminé le mini-cours ! Continuez avec le Starter Pack - 47€ pour aller 10x plus loin.",
        conversionValue: 47,
      },
      {
        stage: "formation_690",
        name: "Formation 690€",
        description: "Upsell formation complète",
        action: "offer_formation_complete",
        nextStage: "pack_complet_2690",
        delay: 48,
        message:
          "💪 Prêt pour la transformation complète ? Formation AcadémIA Pro complète - 690€ avec garantie résultats.",
        conversionValue: 690,
      },
      {
        stage: "pack_complet_2690",
        name: "Pack IA Complet 2690€",
        description: "Pack premium avec coaching",
        action: "offer_pack_complet",
        nextStage: null,
        delay: 48,
        message:
          "👑 Pack IA Complet + Coaching Personnalisé. Pour les entrepreneurs ambitieux. 2 690€.",
        conversionValue: 2690,
      },
    ],
    scoring: [
      { action: "reel_view", points: 2, description: "Vue Reel" },
      { action: "reel_save", points: 12, description: "Reel sauvegardé" },
      { action: "bio_link_click", points: 8, description: "Clic lien bio" },
      { action: "linktree_click", points: 10, description: "Clic Linktree" },
      { action: "email_signup", points: 25, description: "Inscription email" },
      { action: "story_reply", points: 15, description: "Réponse story" },
      { action: "purchase_starter", points: 100, description: "Achat Starter Pack" },
    ],
    conversionGoals: [
      { stage: "lead_captured", targetRate: 0.28, currentRate: 0, revenue: 0 },
      { stage: "starter_pack_47", targetRate: 0.07, currentRate: 0, revenue: 47 },
      { stage: "formation_690", targetRate: 0.12, currentRate: 0, revenue: 690 },
      { stage: "pack_complet_2690", targetRate: 0.08, currentRate: 0, revenue: 2690 },
    ],
  },

  tiktok: {
    platform: "tiktok",
    triggers: ["PROMPT"],
    stages: [
      {
        stage: "awareness",
        name: "Vidéo Choc Résultat IA",
        description: "Vidéo impressionnante montrant un résultat IA spectaculaire",
        action: "publish_tiktok_video",
        nextStage: "lead_captured",
        delay: 0,
        message:
          "😱 L'IA a fait ça en 30 secondes ! Commentez 'PROMPT' pour recevoir les 10 meilleurs prompts gratuits !",
        conversionValue: 0,
      },
      {
        stage: "lead_captured",
        name: "ManyChat PROMPT → Email + Prompts",
        description: "Trigger commentaire PROMPT, capture email, envoi prompts gratuits",
        action: "manychat_trigger_prompt",
        nextStage: "starter_pack_47",
        delay: 0,
        message:
          "🎯 Vos 10 prompts IA les plus puissants sont dans votre boîte mail ! Et ce n'est que le début...",
        conversionValue: 0,
      },
      {
        stage: "starter_pack_47",
        name: "Starter Pack 47€",
        description: "Offre directe Starter Pack après prompts gratuits",
        action: "offer_starter_pack",
        nextStage: "formation_690",
        delay: 48,
        message:
          "⚡ Ces 10 prompts vous ont plu ? Le Starter Pack contient 100+ prompts premium + formations. 47€ !",
        conversionValue: 47,
      },
      {
        stage: "formation_690",
        name: "Formation Complète 690€",
        description: "Upsell formation après Starter Pack",
        action: "offer_formation_complete",
        nextStage: "pack_complet_2690",
        delay: 48,
        message:
          "🚀 Niveau expert maintenant ! Formation Complète AcadémIA Pro - Maîtrisez l'IA à 100%. 690€",
        conversionValue: 690,
      },
      {
        stage: "pack_complet_2690",
        name: "Pack IA Complet 