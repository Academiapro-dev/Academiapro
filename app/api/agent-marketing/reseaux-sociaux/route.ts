# API Route Next.js 14 TypeScript — Agent Réseaux Sociaux AcadémIA Pro

## Structure des fichiers

```
app/api/agent-marketing/reseaux-sociaux/
├── generer/route.ts
├── calendrier/route.ts
└── publier/route.ts

lib/
├── social-media/
│   ├── types.ts
│   ├── prompts.ts
│   ├── generators.ts
│   ├── calendar.ts
│   └── validators.ts
```

---

## `lib/social-media/types.ts`

```typescript
export type Platform = "linkedin" | "instagram" | "facebook" | "tiktok" | "youtube";

export type ContentType =
  | "conseil_ia"
  | "temoignage"
  | "actualite_formation"
  | "etude_de_cas"
  | "citation_motivante"
  | "avant_apres"
  | "conseil_rapide"
  | "coulisses"
  | "article_blog"
  | "annonce_formation"
  | "conseil_pratique"
  | "astuce_ia"
  | "prompt_du_jour"
  | "demo_rapide"
  | "titre_video"
  | "description_video";

export type Thematique = "ia" | "bien_etre" | "langues" | "business";

export type ContentStatus = "draft" | "scheduled" | "published" | "failed";

// ─── Contenu généré par plateforme ───────────────────────────────────────────

export interface LinkedInContent {
  platform: "linkedin";
  type: ContentType;
  title: string;
  body: string;
  hashtags: string[];
  cta: string;
  wordCount: number;
  estimatedReach?: number;
}

export interface InstagramContent {
  platform: "instagram";
  type: ContentType;
  caption: string;
  hashtags: string[];
  emojis: string[];
  cta: string;
  imagePrompt: string;
  wordCount: number;
}

export interface FacebookContent {
  platform: "facebook";
  type: ContentType;
  body: string;
  link?: string;
  imageDescription: string;
  cta: string;
  wordCount: number;
}

export interface TikTokContent {
  platform: "tiktok";
  type: ContentType;
  hook: string;
  script: string;
  value: string;
  cta: string;
  duration: number; // secondes
  hashtags: string[];
}

export interface YouTubeContent {
  platform: "youtube";
  type: ContentType;
  title: string;
  description: string;
  tags: string[];
  chapters: YouTubeChapter[];
  cta: string;
  thumbnail_prompt: string;
}

export interface YouTubeChapter {
  timestamp: string;
  title: string;
}

export type PlatformContent =
  | LinkedInContent
  | InstagramContent
  | FacebookContent
  | TikTokContent
  | YouTubeContent;

// ─── Requêtes ─────────────────────────────────────────────────────────────────

export interface GenerateRequest {
  platform: Platform;
  contentType?: ContentType;
  thematique?: Thematique;
  context?: string;
  targetAudience?: string;
  language?: "fr" | "en";
  tone?: string;
  keywords?: string[];
  count?: number; // 1-5 variantes
}

export interface PublishRequest {
  contentId: string;
  platform: Platform;
  content: PlatformContent;
  scheduledAt?: string; // ISO 8601
  accountId?: string;
}

// ─── Réponses ─────────────────────────────────────────────────────────────────

export interface GenerateResponse {
  success: boolean;
  requestId: string;
  platform: Platform;
  contentType: ContentType;
  thematique: Thematique;
  generatedAt: string;
  contents: PlatformContent[];
  metadata: ContentMetadata;
}

export interface ContentMetadata {
  model: string;
  tokensUsed: number;
  processingTimeMs: number;
  suggestions: string[];
  bestPractices: string[];
}

export interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  platform: Platform;
  contentType: ContentType;
  thematique: Thematique;
  title: string;
  status: ContentStatus;
  scheduledTime: string;
  content?: PlatformContent;
  tags: string[];
}

export interface CalendarResponse {
  success: boolean;
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  totalPosts: number;
  byPlatform: Record<Platform, number>;
  byThematique: Record<Thematique, number>;
  calendar: CalendarEntry[];
  generatedAt: string;
}

export interface PublishResponse {
  success: boolean;
  contentId: string;
  platform: Platform;
  status: ContentStatus;
  publishedAt?: string;
  scheduledAt?: string;
  platformPostId?: string;
  url?: string;
  error?: string;
}

// ─── Erreurs ──────────────────────────────────────────────────────────────────

export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
```

---

## `lib/social-media/prompts.ts`

```typescript
import type {
  Platform,
  ContentType,
  Thematique,
  GenerateRequest,
} from "./types";

// ─── Configurations par plateforme ───────────────────────────────────────────

export const PLATFORM_CONFIGS: Record<
  Platform,
  {
    tone: string;
    audience: string;
    minWords: number;
    maxWords: number;
    hashtagCount: string;
    style: string;
  }
> = {
  linkedin: {
    tone: "professionnel, expert, inspirant",
    audience: "professionnels B2B, managers, entrepreneurs, RH",
    minWords: 150,
    maxWords: 300,
    hashtagCount: "3 à 5",
    style: "structuré avec sauts de ligne, pensées claires, données concrètes",
  },
  instagram: {
    tone: "inspirant, chaleureux, dynamique, authentique",
    audience: "apprenants 18-35 ans, créatifs, lifestyle",
    minWords: 50,
    maxWords: 150,
    hashtagCount: "exactement 20",
    style: "léger, emojis, phrases courtes, storytelling visuel",
  },
  facebook: {
    tone: "accessible, bienveillant, informatif, grand public",
    audience: "adultes 25-55 ans, grand public, familles, professionnels",
    minWords: 100,
    maxWords: 200,
    hashtagCount: "3 à 5",
    style: "conversationnel, links, descriptions d'images engageantes",
  },
  tiktok: {
    tone: "dynamique, rapide, fun, direct, punch",
    audience: "jeunes 16-30 ans, curieux du numérique, early adopters",
    minWords: 80,
    maxWords: 150,
    hashtagCount: "5 à 8",
    style: "script vidéo rythmé, hook ultra fort dans les 3 premières secondes",
  },
  youtube: {
    tone: "éducatif, approfondi, expert, pédagogue",
    audience: "apprenants motivés, professionnels en formation continue",
    minWords: 200,
    maxWords: 400,
    hashtagCount: "10 à 15 tags SEO",
    style: "titre accrocheur SEO, description structurée, chapitres détaillés",
  },
};

// ─── Thématiques ──────────────────────────────────────────────────────────────

export const THEMATIQUE_CONTEXTS: Record<Thematique, string> = {
  ia: `Intelligence Artificielle appliquée à l'apprentissage : prompts, ChatGPT, automatisation, 
       productivité, outils IA pour étudier et travailler plus efficacement.`,
  bien_etre: `Bien-être dans l'apprentissage : gestion du stress, mindfulness, équilibre vie pro/perso, 
              motivation, techniques de mémorisation, cerveau et apprentissage.`,
  langues: `Apprentissage des langues étrangères avec l'IA : anglais, espagnol, allemand, 
            methodes immersives, pratique quotidienne, certification, voyages linguistiques.`,
  business: `Business et entrepreneuriat augmenté par l'IA : marketing digital, creation d'entreprise, 
             freelance, monetisation compétences, personal branding, revenus passifs.`,
};

// ─── Types de contenu par plateforme ─────────────────────────────────────────

export const CONTENT_TYPE_MAP: Record<Platform, ContentType[]> = {
  linkedin: [
    "conseil_ia",
    "temoignage",
    "actualite_formation",
    "etude_de_cas",
  ],
  instagram: [
    "citation_motivante",
    "avant_apres",
    "conseil_rapide",
    "coulisses",
  ],
  facebook: [
    "article_blog",
    "annonce_formation",
    "temoignage",
    "conseil_pratique",
  ],
  tiktok: ["astuce_ia", "prompt_du_jour", "demo_rapide"],
  youtube: ["titre_video", "description_video"],
};

// ─── Constructeur de prompts ──────────────────────────────────────────────────

export function buildSystemPrompt(): string {
  return `Tu es l'agent marketing IA d'AcadémIA Pro, une plateforme innovante d'apprentissage 
augmenté par l'intelligence artificielle. 

🎯 MISSION : Créer du contenu éditorial percutant, authentique et orienté conversion pour 
les réseaux sociaux, dans le but de :
- Attirer de nouveaux apprenants
- Fidéliser la communauté existante
- Positionner AcadémIA Pro comme référence de l'edtech IA

🏆 VALEURS DE LA MARQUE :
- Innovation pédagogique accessible à tous
- Apprentissage personnalisé par l'IA
- Communauté bienveillante et internationale
- Résultats concrets et mesurables
- Transparence et authenticité

📌 RÈGLES ABSOLUES :
1. Toujours inclure un CTA clair vers academiapro.com ou une formation spécifique
2. Utiliser des données réelles ou plausibles (ex: "87% des apprenants améliorent en 30 jours")
3. Adopter un langage inclusif et bienveillant
4. Ne jamais faire de fausses promesses
5. Répondre UNIQUEMENT en JSON valide selon le schéma demandé

🌍 Langue par défaut : Français`;
}

export function buildLinkedInPrompt(request: GenerateRequest): string {
  const config = PLATFORM_CONFIGS.linkedin;
  const thematique = request.thematique ?? "ia";
  const context = THEMATIQUE_CONTEXTS[thematique];
  const contentType = request.contentType ?? "conseil_ia";

  return `${buildSystemPrompt()}

═══════════════════════════════════════
PLATEFORME : LinkedIn
OBJECTIF : ${getContentTypeObjective(contentType)}
THÉMATIQUE : ${thematique.toUpperCase()} — ${context}
CONTEXTE ADDITIONNEL : ${request.context ?? "Post générique AcadémIA Pro"}
AUDIENCE CIBLE : ${request.targetAudience ?? config.audience}
═══════════════════════════════════════

CONTRAINTES FORMAT LINKEDIN :
• Ton : ${config.tone}
• Longueur body : ${config.minWords}-${config.maxWords} mots
• Hashtags : ${config.hashtagCount} hashtags professionnels
• Style : ${config.style}
• Structuration : Utiliser des sauts de ligne (\\n\\n) pour aérer
• Opening hook : Commencer par une question ou affirmation forte
• CTA : Pointer vers academiapro.com/formations ou une formation spécifique

MOTS-CLÉS À INTÉGRER : ${request.keywords?.join(", ") ?? "IA, apprentissage, formation, compétences, transformation digitale"}

GÉNÈRE un post LinkedIn de type "${contentType}" au format JSON suivant :
{
  "platform": "linkedin",
  "type": "${contentType}",
  "title": "titre interne du contenu (non publié)",
  "body": "Corps du post complet avec structure et sauts de ligne\\n\\nParagraphe 2\\n\\nParagraphe 3",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "cta": "Texte du call-to-action avec lien",
  "wordCount": 0,
  "estimatedReach": 0
}`;
}

export function buildInstagramPrompt(request: GenerateRequest): string {
  const config = PLATFORM_CONFIGS.instagram;
  const thematique = request.thematique ?? "bien_etre";
  const context = THEMATIQUE_CONTEXTS[thematique];
  const contentType = request.contentType ?? "citation_motivante";

  return `${buildSystemPrompt()}

═══════════════════════════════════════
PLATEFORME : Instagram
OBJECTIF : ${getContentTypeObjective(contentType)}
THÉMATIQUE : ${thematique.toUpperCase()} — ${context}
═══════════════════════════════════════

CONTRAINTES FORMAT INSTAGRAM :
• Ton : ${config.tone}
• Longueur caption : ${config.minWords}-${config.maxWords} mots
• Hashtags : EXACTEMENT 20 hashtags (mix populaires + niche)
• Emojis : Intégrer 5-8 emojis expressifs et pertinents
• Style : ${config.style}
• Image Prompt : Décrire l'image idéale pour accompagner le post (pour génération DALL-E ou MidJourney)
• CTA : "Lien en bio 🔗" avec indication claire de l'action

GÉNÈRE un post Instagram de type "${contentType}" au format JSON suivant :
{
  "platform": "instagram",
  "type": "${contentType}",
  "caption": "Caption complète avec emojis intégrés naturellement",
  "hashtags": ["hashtag1", "hashtag2", ...20 hashtags au total],
  "emojis": ["🚀", "💡", "✨", "🎯", "💪"],
  "cta": "🔗 Lien en bio pour [action spécifique]",
  "imagePrompt": "Description détaillée de l'image idéale pour ce post",
  "wordCount": 0
}`;
}

export function buildFacebookPrompt(request: GenerateRequest): string {
  const config = PLATFORM_CONFIGS.facebook;
  const thematique = request.thematique ??