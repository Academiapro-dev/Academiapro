# API Route Next.js 14 - Intégration ManyChat AcadémIA Pro

## Structure des fichiers

```
app/api/manychat/
├── webhook/route.ts
├── sequence/route.ts
├── stats/route.ts
└── _lib/
    ├── triggers.ts
    ├── sequences.ts
    ├── supabase.ts
    ├── resend.ts
    └── types.ts
```

---

## `app/api/manychat/_lib/types.ts`

```typescript
export type TriggerWord =
  | "CLAUDE"
  | "FORMATION"
  | "IA"
  | "WEBINAIRE"
  | "PROMPT";

export type SequenceStep = {
  day: number;
  templateId: string;
  subject: string;
  description: string;
};

export type TriggerConfig = {
  trigger: TriggerWord;
  freeContent: {
    title: string;
    description: string;
    contentUrl?: string;
    templateId: string;
  };
  targetOffer: {
    name: string;
    price: number;
    url: string;
  };
  emailSequenceId: string;
  sequenceSteps: SequenceStep[];
};

export type ManyChatWebhookPayload = {
  subscriber_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  trigger_word: string;
  messenger_id?: string;
  custom_fields?: Record<string, string | number | boolean>;
  timestamp?: string;
};

export type ProspectRecord = {
  id?: string;
  manychat_subscriber_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  trigger_word: TriggerWord;
  source: string;
  score: number;
  sequence_id: string;
  sequence_step: number;
  status: "active" | "converted" | "unsubscribed" | "paused";
  offer_target: string;
  created_at?: string;
  updated_at?: string;
  last_email_sent_at?: string;
  converted_at?: string;
  conversion_offer?: string;
  conversion_amount?: number;
};

export type SequenceEmailPayload = {
  prospectId: string;
  email: string;
  firstName: string;
  triggerWord: TriggerWord;
  step: number;
  scheduledAt?: string;
};

export type StatsResponse = {
  period: string;
  triggers: TriggerStats[];
  totalProspects: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  topPerformingTrigger: string;
};

export type TriggerStats = {
  trigger: TriggerWord;
  prospects: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  emailOpenRate?: number;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
```

---

## `app/api/manychat/_lib/triggers.ts`

```typescript
import type { TriggerConfig, TriggerWord } from "./types";

export const TRIGGER_CONFIGS: Record<TriggerWord, TriggerConfig> = {
  CLAUDE: {
    trigger: "CLAUDE",
    freeContent: {
      title: "10 Prompts Claude Gratuits",
      description:
        "Tes 10 prompts Claude optimisés pour booster ta productivité immédiatement",
      contentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/ressources/10-prompts-claude`,
      templateId: "claude_free_content",
    },
    targetOffer: {
      name: "Starter Pack AcadémIA Pro",
      price: 47,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/starter-pack`,
    },
    emailSequenceId: "seq_claude_to_starter",
    sequenceSteps: [
      {
        day: 0,
        templateId: "claude_j0_content_delivery",
        subject: "🎁 Tes 10 prompts Claude sont là !",
        description: "Livraison contenu promis",
      },
      {
        day: 1,
        templateId: "claude_j1_value",
        subject: "💡 Comment Claude 3.5 a changé ma façon de travailler",
        description: "Valeur complémentaire",
      },
      {
        day: 3,
        templateId: "claude_j3_testimonial",
        subject: "📣 Marie a économisé 15h/semaine avec Claude (son histoire)",
        description: "Témoignage apprenant",
      },
      {
        day: 5,
        templateId: "claude_j5_offer",
        subject: "⏰ [48h] Starter Pack à 47€ — Offre spéciale pour toi",
        description: "Offre Starter Pack 47€ - 48h",
      },
      {
        day: 7,
        templateId: "claude_j7_formation",
        subject: "🎓 La Formation IA complète qui transforme ta carrière",
        description: "Formation complète proposition",
      },
      {
        day: 14,
        templateId: "claude_j14_pack_complet",
        subject: "🚀 Pack IA Complet — Tout ce dont tu as besoin en 2026",
        description: "Pack IA Complet",
      },
    ],
  },

  FORMATION: {
    trigger: "FORMATION",
    freeContent: {
      title: "Module 1 Formation IA Gratuit",
      description:
        "Accès immédiat au Module 1 de la Formation AcadémIA Pro — F128",
      contentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/formation/module-1-gratuit`,
      templateId: "formation_free_module",
    },
    targetOffer: {
      name: "Formation Complète AcadémIA Pro",
      price: 690,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/formation-complete`,
    },
    emailSequenceId: "seq_formation_module1",
    sequenceSteps: [
      {
        day: 0,
        templateId: "formation_j0_module1",
        subject: "🎓 Ton accès Module 1 gratuit est activé !",
        description: "Accès module 1 gratuit F128",
      },
      {
        day: 1,
        templateId: "formation_j1_value",
        subject: "📚 Ce que tu vas apprendre dans les 8 modules suivants",
        description: "Aperçu formation complète",
      },
      {
        day: 3,
        templateId: "formation_j3_testimonial",
        subject: "🌟 Thomas a décroché +3 500€/mois après la formation",
        description: "Témoignage apprenant",
      },
      {
        day: 5,
        templateId: "formation_j5_offer",
        subject: "⏰ [48h] Formation complète à 690€ — Places limitées",
        description: "Offre formation 690€",
      },
      {
        day: 7,
        templateId: "formation_j7_urgency",
        subject: "⚠️ Dernière chance : 3 places restantes",
        description: "Urgence finale",
      },
      {
        day: 14,
        templateId: "formation_j14_pack",
        subject: "💼 Pack IA Complet — Formation + Outils + Coaching",
        description: "Pack IA Complet upsell",
      },
    ],
  },

  IA: {
    trigger: "IA",
    freeContent: {
      title: "E-book Guide IA 2026",
      description:
        "Le guide complet des 47 outils IA qui vont dominer 2026 — PDF offert",
      contentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/ebooks/guide-ia-2026`,
      templateId: "ia_ebook_delivery",
    },
    targetOffer: {
      name: "Starter Pack AcadémIA Pro",
      price: 47,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/starter-pack`,
    },
    emailSequenceId: "seq_ia_to_starter",
    sequenceSteps: [
      {
        day: 0,
        templateId: "ia_j0_ebook",
        subject: "📖 Ton Guide IA 2026 est disponible — Télécharge-le ici",
        description: "Livraison e-book",
      },
      {
        day: 1,
        templateId: "ia_j1_top5",
        subject: "🔥 Top 5 des outils IA du guide que tu dois tester MAINTENANT",
        description: "Top 5 outils IA",
      },
      {
        day: 3,
        templateId: "ia_j3_testimonial",
        subject: "💬 Comment Sophie a automatisé 80% de ses tâches avec l'IA",
        description: "Témoignage apprenant",
      },
      {
        day: 5,
        templateId: "ia_j5_starter",
        subject: "🎯 [48h] Starter Pack 47€ — Va plus loin que le guide",
        description: "Offre Starter Pack 47€",
      },
      {
        day: 7,
        templateId: "ia_j7_formation",
        subject: "📈 De débutant à expert IA en 90 jours — La méthode",
        description: "Formation complète proposition",
      },
      {
        day: 14,
        templateId: "ia_j14_pack",
        subject: "🏆 Pack IA Complet 2026 — L'arsenal complet",
        description: "Pack IA Complet",
      },
    ],
  },

  WEBINAIRE: {
    trigger: "WEBINAIRE",
    freeContent: {
      title: "Inscription Webinaire AcadémIA Pro",
      description: "Ta place au prochain webinaire est réservée !",
      contentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/webinaire/inscription`,
      templateId: "webinaire_confirmation",
    },
    targetOffer: {
      name: "Offre Post-Webinaire Exclusive",
      price: 297,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/offre-webinaire`,
    },
    emailSequenceId: "seq_webinaire_funnel",
    sequenceSteps: [
      {
        day: 0,
        templateId: "webinaire_j0_confirmation",
        subject: "✅ Inscription confirmée — Détails du webinaire",
        description: "Confirmation inscription",
      },
      {
        day: 1,
        templateId: "webinaire_j1_prepare",
        subject: "📋 Prépare-toi : ce que tu vas apprendre demain",
        description: "Préparation webinaire",
      },
      {
        day: 3,
        templateId: "webinaire_j3_replay",
        subject: "🎥 Le replay est disponible — 72h seulement",
        description: "Replay webinaire",
      },
      {
        day: 5,
        templateId: "webinaire_j5_offer",
        subject: "⚡ Offre exclusive webinaire — Expire dans 48h",
        description: "Offre post-webinaire",
      },
      {
        day: 7,
        templateId: "webinaire_j7_fomo",
        subject: "😮 Tu as manqué ça pendant le webinaire...",
        description: "FOMO et valeur manquée",
      },
      {
        day: 14,
        templateId: "webinaire_j14_pack",
        subject: "🚀 Pack IA Complet — L'étape suivante après le webinaire",
        description: "Upsell Pack IA Complet",
      },
    ],
  },

  PROMPT: {
    trigger: "PROMPT",
    freeContent: {
      title: "50 Prompts Métier",
      description:
        "50 prompts professionnels prêts à l'emploi pour ton secteur d'activité",
      contentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/ressources/50-prompts-metier`,
      templateId: "prompt_pack_delivery",
    },
    targetOffer: {
      name: "Starter Pack AcadémIA Pro",
      price: 47,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/starter-pack`,
    },
    emailSequenceId: "seq_prompt_to_starter",
    sequenceSteps: [
      {
        day: 0,
        templateId: "prompt_j0_pack",
        subject: "🎯 Tes 50 prompts métier sont prêts — Utilise-les dès maintenant",
        description: "Livraison 50 prompts",
      },
      {
        day: 1,
        templateId: "prompt_j1_howto",
        subject: "💡 Comment utiliser ces prompts pour 10x ta productivité",
        description: "Guide utilisation prompts",
      },
      {
        day: 3,
        templateId: "prompt_j3_testimonial",
        subject: "📣 Lucas facture 2x plus cher grâce aux bons prompts",
        description: "Témoignage apprenant",
      },
      {
        day: 5,
        templateId: "prompt_j5_starter",
        subject: "🔓 [48h] Starter Pack 47€ — 500+ prompts avancés t'attendent",
        description: "Offre Starter Pack 47€",
      },
      {
        day: 7,
        templateId: "prompt_j7_formation",
        subject: "🎓 Maîtrise le prompt engineering — Formation complète",
        description: "Formation complète",
      },
      {
        day: 14,
        templateId: "prompt_j14_pack",
        subject: "⚡ Pack IA Complet — La bibliothèque ultime de prompts",
        description: "Pack IA Complet",
      },
    ],
  },
};

export function identifyTrigger(word: string): TriggerWord | null {
  const normalized = word.toUpperCase().trim();
  const validTriggers: TriggerWord[] = [
    "CLAUDE",
    "FORMATION",
    "IA",
    "WEBINAIRE",
    "PROMPT",
  ];

  // Correspondance exacte
  if (validTriggers.includes(normalized as TriggerWord)) {
    return normalized as TriggerWord;
  }

  // Correspondance partielle pour flexibilité
  const partialMatch = validTriggers.find(
    