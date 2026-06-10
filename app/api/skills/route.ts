# API Route Next.js 14 TypeScript - Gestion Skills AcadémIA Pro

## Structure des fichiers

```
app/api/skills/
├── acheter/route.ts
├── acces/route.ts
├── progression/route.ts
├── recommandations/route.ts
└── _lib/
    ├── skills.config.ts
    ├── stripe.ts
    ├── db.ts
    └── types.ts
```

---

## `app/api/skills/_lib/types.ts`

```typescript
export type SkillCategory = "IA" | "Business" | "Bien-être";

export interface Skill {
  id: string;
  nom: string;
  description: string;
  categorie: SkillCategory;
  prix: number;
  dureeMinutes: number;
  niveau: "Débutant" | "Intermédiaire" | "Avancé";
  formationAssocieeId?: string;
  formationAssocieeNom?: string;
  formationAssocieeUpsellPrix?: number;
  prerequis?: string[];
  tags: string[];
  stripePriceId: string;
  ordre: number;
}

export interface Pack {
  id: string;
  nom: string;
  description: string;
  skillIds: string[];
  prix: number;
  economie: number;
  stripePriceId: string;
}

export interface SkillAcces {
  userId: string;
  skillId: string;
  acheteLe: Date;
  source: "achat_individuel" | "pack" | "formation" | "offert";
  packId?: string;
}

export interface SkillProgression {
  userId: string;
  skillId: string;
  progression: number; // 0-100
  moduleActuel: number;
  totalModules: number;
  tempsPasseMinutes: number;
  debuteeLe: Date;
  dernierAccesLe: Date;
  completeLe?: Date;
  certificatEmis: boolean;
  certificatUrl?: string;
  quizScores: QuizScore[];
}

export interface QuizScore {
  moduleId: string;
  score: number;
  maxScore: number;
  tentatives: number;
  reussiLe?: Date;
}

export interface Certificat {
  id: string;
  userId: string;
  skillId: string;
  nomApprenant: string;
  nomSkill: string;
  emisLe: Date;
  url: string;
  code: string;
}

export interface ProfilApprenant {
  userId: string;
  categoriesInterets: SkillCategory[];
  niveau: "Débutant" | "Intermédiaire" | "Avancé";
  skillsAchetees: string[];
  skillsCompletes: string[];
  objectifs: string[];
}

export interface AchatRequest {
  type: "skill" | "pack";
  itemId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  couponCode?: string;
}

export interface AchatResponse {
  sessionId: string;
  sessionUrl: string;
  montant: number;
  itemsDebloqués: string[];
}

export interface AccesResponse {
  aAcces: boolean;
  skill?: Skill;
  progression?: SkillProgression;
  raisonRefus?: string;
}

export interface ProgressionRequest {
  userId: string;
  skillId: string;
  moduleId: string;
  action:
    | "debut_module"
    | "fin_module"
    | "quiz_complete"
    | "skill_complete";
  donnees?: {
    quizScore?: number;
    quizMaxScore?: number;
    tempsMinutes?: number;
  };
}

export interface ProgressionResponse {
  progression: SkillProgression;
  certificat?: Certificat;
  upsell?: UpsellData;
  prochainModule?: string;
}

export interface UpsellData {
  formationId: string;
  formationNom: string;
  prixNormal: number;
  prixUpsell: number;
  economie: number;
  message: string;
  ctaUrl: string;
}

export interface RecommandationResponse {
  recommandations: RecommandationSkill[];
  raisonLogique: string;
}

export interface RecommandationSkill {
  skill: Skill;
  score: number;
  raison: string;
  priorite: "haute" | "moyenne" | "faible";
  upsellDisponible: boolean;
}

export interface StatistiquesAdmin {
  totalVentes: number;
  chiffreAffaires: number;
  skillsLesPlusVendues: { skillId: string; nom: string; ventes: number }[];
  ventesPacks: number;
  tauxCompletion: number;
  certificatsEmis: number;
  revenusParCategorie: Record<SkillCategory, number>;
  evolutionMensuelle: { mois: string; revenus: number; ventes: number }[];
}
```

---

## `app/api/skills/_lib/skills.config.ts`

```typescript
import { Pack, Skill } from "./types";

export const SKILLS: Skill[] = [
  // ═══════════════════════════════════════
  // SKILLS IA — SK01 → SK10 — 97€ chacune
  // ═══════════════════════════════════════
  {
    id: "SK01",
    nom: "Prompt Engineering Maîtrisé",
    description:
      "Rédiger des prompts précis pour obtenir des résultats IA optimaux",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 120,
    niveau: "Débutant",
    formationAssocieeId: "FORM-IA-COMPLETE",
    formationAssocieeNom: "Formation IA Complète AcadémIA Pro",
    formationAssocieeUpsellPrix: 497,
    tags: ["chatgpt", "prompts", "productivité"],
    stripePriceId: process.env.STRIPE_PRICE_SK01!,
    ordre: 1,
  },
  {
    id: "SK02",
    nom: "Automatisation IA No-Code",
    description: "Créer des workflows automatisés avec Make, Zapier et l'IA",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 150,
    niveau: "Intermédiaire",
    prerequis: ["SK01"],
    formationAssocieeId: "FORM-IA-COMPLETE",
    formationAssocieeNom: "Formation IA Complète AcadémIA Pro",
    formationAssocieeUpsellPrix: 497,
    tags: ["automation", "nocode", "make", "zapier"],
    stripePriceId: process.env.STRIPE_PRICE_SK02!,
    ordre: 2,
  },
  {
    id: "SK03",
    nom: "Création Contenu IA",
    description:
      "Générer articles, posts et scripts avec l'IA de façon authentique",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 90,
    niveau: "Débutant",
    formationAssocieeId: "FORM-IA-COMPLETE",
    formationAssocieeNom: "Formation IA Complète AcadémIA Pro",
    formationAssocieeUpsellPrix: 497,
    tags: ["contenu", "copywriting", "marketing"],
    stripePriceId: process.env.STRIPE_PRICE_SK03!,
    ordre: 3,
  },
  {
    id: "SK04",
    nom: "Analyse Données avec IA",
    description: "Interpréter et visualiser des données complexes via l'IA",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 180,
    niveau: "Intermédiaire",
    prerequis: ["SK01"],
    formationAssocieeId: "FORM-IA-COMPLETE",
    formationAssocieeNom: "Formation IA Complète AcadémIA Pro",
    formationAssocieeUpsellPrix: 497,
    tags: ["data", "analyse", "excel", "python"],
    stripePriceId: process.env.STRIPE_PRICE_SK04!,
    ordre: 4,
  },
  {
    id: "SK05",
    nom: "Agents IA Personnels",
    description: "Configurer et déployer des agents IA pour ses propres tâches",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 200,
    niveau: "Avancé",
    prerequis: ["SK01", "SK02"],
    formationAssocieeId: "FORM-IA-COMPLETE",
    formationAssocieeNom: "Formation IA Complète AcadémIA Pro",
    formationAssocieeUpsellPrix: 497,
    tags: ["agents", "langchain", "autonomie"],
    stripePriceId: process.env.STRIPE_PRICE_SK05!,
    ordre: 5,
  },
  {
    id: "SK06",
    nom: "IA pour le Recrutement",
    description: "Optimiser le sourcing et l'évaluation candidats avec l'IA",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 120,
    niveau: "Intermédiaire",
    formationAssocieeId: "FORM-IA-RH",
    formationAssocieeNom: "Formation IA & RH",
    formationAssocieeUpsellPrix: 397,
    tags: ["rh", "recrutement", "talent"],
    stripePriceId: process.env.STRIPE_PRICE_SK06!,
    ordre: 6,
  },
  {
    id: "SK07",
    nom: "IA Générative pour Designers",
    description: "Midjourney, DALL-E et Stable Diffusion pour les pros du design",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 160,
    niveau: "Débutant",
    formationAssocieeId: "FORM-IA-DESIGN",
    formationAssocieeNom: "Formation IA Créative",
    formationAssocieeUpsellPrix: 347,
    tags: ["design", "image", "midjourney", "créatif"],
    stripePriceId: process.env.STRIPE_PRICE_SK07!,
    ordre: 7,
  },
  {
    id: "SK08",
    nom: "Chatbots & IA Conversationnelle",
    description: "Créer des chatbots intelligents pour le service client",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 180,
    niveau: "Intermédiaire",
    prerequis: ["SK01"],
    formationAssocieeId: "FORM-IA-COMPLETE",
    formationAssocieeNom: "Formation IA Complète AcadémIA Pro",
    formationAssocieeUpsellPrix: 497,
    tags: ["chatbot", "service client", "conversation"],
    stripePriceId: process.env.STRIPE_PRICE_SK08!,
    ordre: 8,
  },
  {
    id: "SK09",
    nom: "SEO Augmenté par l'IA",
    description: "Stratégies SEO avancées en exploitant la puissance de l'IA",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 140,
    niveau: "Intermédiaire",
    formationAssocieeId: "FORM-MARKETING-IA",
    formationAssocieeNom: "Formation Marketing IA",
    formationAssocieeUpsellPrix: 447,
    tags: ["seo", "google", "trafic", "contenu"],
    stripePriceId: process.env.STRIPE_PRICE_SK09!,
    ordre: 9,
  },
  {
    id: "SK10",
    nom: "Fine-tuning Modèles IA",
    description:
      "Personnaliser des LLMs sur ses propres données métier",
    categorie: "IA",
    prix: 97,
    dureeMinutes: 240,
    niveau: "Avancé",
    prerequis: ["SK01", "SK04", "SK05"],
    formationAssocieeId: "FORM-IA-EXPERT",
    formationAssocieeNom: "Formation IA Expert",
    formationAssocieeUpsellPrix: 697,
    tags: ["llm", "openai", "fine-tuning", "expert"],
    stripePriceId: process.env.STRIPE_PRICE_SK10!,
    ordre: 10,
  },

  // ═══════════════════════════════════════════════
  // SKILLS BUSINESS — SK11 → SK15 — 97€ chacune
  // ═══════════════════════════════════════════════
  {
    id: "SK11",
    nom: "Stratégie Business avec IA",
    description: "Analyser marchés et concurrents, piloter sa stratégie par la data",
    categorie: "Business",
    prix: 97,
    dureeMinutes: 180,
    niveau: "Intermédiaire",
    formationAssocieeId: "FORM-BUSINESS-IA",
    formationAssocieeNom: "Formation Business IA",
    formationAssocieeUpsellPrix: 597,
    tags: ["stratégie", "marché", "concurrence", "business"],
    stripePriceId: process.env.STRIPE_PRICE_SK11!,
    ordre: 11,
  },
  {
    id: "SK12",
    nom: "Sales & Prospection IA",
    description: "Automatiser et personnaliser sa prospection commerciale avec l'IA",
    categorie: "Business",
    prix: 97,
    dureeMinutes: 150,
    niveau: "Intermédiaire",
    formationAssocieeId: "FORM-BUSINESS-IA",
    formationAssocieeNom: "Formation Business IA",
    formationAssocieeUpsellPrix: 597,
    tags: ["vente", "prospection", "crm", "leads"],
    stripePriceId: process.env.STRIPE_PRICE_SK12!,
    ordre: 12,
  },
  {
    id: "SK13",
    nom: "Finance & Rentabilité IA",
    description: "Modèles financiers intelligents et prévisions augmentées par IA",
    categorie: "Business",
    prix: 97,
    dureeMinutes: 200,
    niveau: "Avancé",
    prerequis: ["SK11"],
    formationAssocieeId: "FORM-BUSINESS-IA",
    formationAssocieeNom: "Formation Business IA",
    formationAssocieeUpsellPrix: 597,
    tags: ["finance", "prévisions", "rentabilité", "tableaux de bord"],
    stripePriceId: