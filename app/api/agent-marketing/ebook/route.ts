# API Route Next.js 14 — Génération E-Book PDF AcadémIA Pro

## Structure des fichiers

```
app/api/agent-marketing/ebook/
├── generer/route.ts
├── telecharger/route.ts
├── stats/route.ts
├── _lib/
│   ├── claude-content-generator.ts
│   ├── html-template.ts
│   ├── pdf-generator.ts
│   ├── supabase-storage.ts
│   └── nurturing-sequence.ts
└── _types/index.ts
```

---

## `_types/index.ts`

```typescript
export interface EbookGenerationRequest {
  email: string;
  prenom: string;
  source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_source?: string;
  metadata?: Record<string, string>;
}

export interface EbookGenerationResponse {
  success: boolean;
  ebook_id: string;
  download_token: string;
  download_url: string;
  expires_at: string;
  message: string;
}

export interface EbookRecord {
  id: string;
  email: string;
  prenom: string;
  download_token: string;
  pdf_url: string;
  pdf_path: string;
  source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_source: string | null;
  download_count: number;
  first_downloaded_at: string | null;
  last_downloaded_at: string | null;
  nurturing_activated: boolean;
  created_at: string;
  expires_at: string;
}

export interface EbookStats {
  total_generated: number;
  total_downloads: number;
  unique_downloaders: number;
  downloads_by_source: Record<string, number>;
  downloads_by_day: Array<{ date: string; count: number }>;
  top_sources: Array<{ source: string; downloads: number; percentage: number }>;
  conversion_rate: number;
  nurturing_activated: number;
}

export interface ChapterContent {
  title: string;
  subtitle?: string;
  content: string;
  key_points?: string[];
}

export interface EbookContent {
  introduction: ChapterContent;
  chapters: ChapterContent[];
  conclusion: ChapterContent;
  bonus: ChapterContent;
  generated_at: string;
}
```

---

## `_lib/claude-content-generator.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { ChapterContent, EbookContent } from "../_types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const CHAPTER_PROMPTS = {
  introduction: `
    Écris l'introduction d'un e-book professionnel intitulé "Guide Pratique Claude et IA Générative 2026".
    
    CONSIGNES :
    - Titre : "Pourquoi l'IA Générative Change Tout en 2026"
    - Longueur : 600-800 mots
    - Ton : Expert, inspirant, direct, sans jargon inutile
    - Inclure : statistiques 2026 réalistes, promesse de valeur claire, roadmap du livre
    - Structure : Accroche forte → Contexte → Ce que tu vas apprendre → Comment utiliser ce guide
    - Format : HTML avec balises <p>, <strong>, <em>, <ul>, <li>
    
    Génère uniquement le contenu HTML de l'introduction, sans balise html/body/head.
  `,

  chapter1: `
    Écris le Chapitre 1 d'un e-book professionnel sur Claude et l'IA Générative 2026.
    
    TITRE : "Les 10 Prompts Claude les Plus Puissants"
    CONSIGNES :
    - Longueur : 900-1200 mots
    - Présenter exactement 10 prompts ultra-concrets avec exemples
    - Pour chaque prompt : nom, cas d'usage, template exact, résultat attendu
    - Catégories : rédaction, analyse, code, stratégie, création, recherche
    - Format : HTML avec sections <div class="prompt-card">, <pre><code> pour les templates
    - Ton : Pratique, actionnable, exemples réels
    
    Génère uniquement le contenu HTML, sans balise html/body/head.
  `,

  chapter2: `
    Écris le Chapitre 2 d'un e-book professionnel sur l'IA Générative 2026.
    
    TITRE : "Automatiser 80% de Ses Tâches Répétitives"
    CONSIGNES :
    - Longueur : 900-1200 mots
    - Identifier les 10 tâches les plus répétitives en entreprise
    - Pour chaque tâche : solution IA concrète, gain de temps estimé, outil recommandé
    - Inclure : matrice d'automatisation (facile/difficile × impact haut/bas)
    - Cas concrets : email, reporting, recherche, rédaction, data entry
    - Format : HTML avec tableaux <table>, listes et call-out boxes
    
    Génère uniquement le contenu HTML, sans balise html/body/head.
  `,

  chapter3: `
    Écris le Chapitre 3 d'un e-book professionnel sur l'IA Générative 2026.
    
    TITRE : "Les Meilleurs Outils IA par Métier"
    CONSIGNES :
    - Longueur : 900-1200 mots
    - Couvrir : Marketing, Développement, RH, Finance, Commercial, Design, Juridique
    - Pour chaque métier : top 3 outils, cas d'usage principal, ROI estimé
    - Comparatif Claude vs ChatGPT vs Gemini pour les use cases principaux
    - Format : HTML avec cards par métier, badges de notation, icônes emoji
    
    Génère uniquement le contenu HTML, sans balise html/body/head.
  `,

  chapter4: `
    Écris le Chapitre 4 d'un e-book professionnel sur l'IA Générative 2026.
    
    TITRE : "5 Workflows IA Prêts à Copier-Coller"
    CONSIGNES :
    - Longueur : 1000-1400 mots
    - Présenter exactement 5 workflows complets et opérationnels
    - Workflows : (1) Création de contenu SEO, (2) Analyse concurrentielle, 
      (3) Onboarding client, (4) Veille sectorielle, (5) Rédaction de rapports
    - Pour chaque workflow : étapes numérotées, outils, prompts exacts, output
    - Format : HTML avec steps visuels, <div class="workflow-step">, code blocks
    
    Génère uniquement le contenu HTML, sans balise html/body/head.
  `,

  chapter5: `
    Écris le Chapitre 5 d'un e-book professionnel sur l'IA Générative 2026.
    
    TITRE : "Les Erreurs à Éviter avec l'IA Générative"
    CONSIGNES :
    - Longueur : 700-1000 mots
    - Lister 10 erreurs critiques classées par fréquence et impact
    - Pour chaque erreur : description, pourquoi c'est un problème, solution correcte
    - Inclure : erreurs de prompt, erreurs de confiance aveugle, erreurs éthiques/légales
    - Format : HTML avec warning boxes, avant/après comparisons, checklist finale
    
    Génère uniquement le contenu HTML, sans balise html/body/head.
  `,

  chapter6: `
    Écris le Chapitre 6 d'un e-book professionnel sur l'IA Générative 2026.
    
    TITRE : "Cas Pratiques par Secteur"
    CONSIGNES :
    - Longueur : 1000-1300 mots
    - Secteurs : E-commerce, Santé, Éducation, Finance, Immobilier, Consulting
    - Pour chaque secteur : problème réel, solution IA implémentée, résultats chiffrés
    - Case studies format storytelling : situation → action → résultat
    - Format : HTML avec cards par secteur, métriques en highlight
    
    Génère uniquement le contenu HTML, sans balise html/body/head.
  `,

  conclusion: `
    Écris la conclusion d'un e-book professionnel sur Claude et l'IA Générative 2026.
    
    TITRE : "Passer à l'Action Dès Aujourd'hui"
    CONSIGNES :
    - Longueur : 400-600 mots
    - Récapituler les 3 insights les plus importants
    - Plan d'action 30 jours concret en 3 phases
    - CTA fort vers AcadémIA Pro (formation IA complète)
    - Message motivant sur l'opportunité unique de 2026
    - Format : HTML avec liste d'actions, timeline visuelle, bouton CTA
    
    Génère uniquement le contenu HTML, sans balise html/body/head.
  `,

  bonus: `
    Génère la section Bonus d'un e-book professionnel sur Claude et l'IA Générative 2026.
    
    TITRE : "20 Prompts Supplémentaires Exclusifs"
    CONSIGNES :
    - Longueur : 800-1000 mots
    - Exactement 20 prompts avancés non mentionnés dans le chapitre 1
    - Catégories : Prompts de raisonnement, prompts créatifs, prompts analytiques,
      prompts de productivité, prompts de recherche
    - Format : grille de prompts avec titre, icône, template copiable
    - Chaque prompt dans <div class="bonus-prompt">, template dans <pre><code>
    
    Génère uniquement le contenu HTML, sans balise html/body/head.
  `,
};

async function generateChapter(
  promptKey: keyof typeof CHAPTER_PROMPTS,
  retries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: CHAPTER_PROMPTS[promptKey],
          },
        ],
        system: `Tu es un expert en IA générative et en copywriting professionnel. 
        Tu génères du contenu HTML de haute qualité pour un e-book premium destiné à des professionnels francophones.
        Ton style est : expert mais accessible, concret, actionnable, inspirant.
        Tu utilises un vocabulaire professionnel sans jargon inutile.
        Tu génères UNIQUEMENT du HTML valide, jamais de markdown.`,
      });

      const content = message.content[0];
      if (content.type === "text") {
        return content.text;
      }
      throw new Error("Unexpected response type from Claude");
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (attempt + 1))
      );
    }
  }
  throw new Error("Failed to generate chapter after retries");
}

export async function generateFullEbookContent(): Promise<EbookContent> {
  console.log("🤖 Démarrage génération contenu via Claude API...");

  const [
    introContent,
    ch1Content,
    ch2Content,
    ch3Content,
    ch4Content,
    ch5Content,
    ch6Content,
    conclusionContent,
    bonusContent,
  ] = await Promise.all([
    generateChapter("introduction"),
    generateChapter("chapter1"),
    generateChapter("chapter2"),
    generateChapter("chapter3"),
    generateChapter("chapter4"),
    generateChapter("chapter5"),
    generateChapter("chapter6"),
    generateChapter("conclusion"),
    generateChapter("bonus"),
  ]);

  console.log("✅ Contenu généré avec succès");

  return {
    introduction: {
      title: "Pourquoi l'IA Générative Change Tout en 2026",
      content: introContent,
    },
    chapters: [
      {
        title: "Les 10 Prompts Claude les Plus Puissants",
        subtitle: "Chapitre 1",
        content: ch1Content,
      },
      {
        title: "Automatiser 80% de Ses Tâches Répétitives",
        subtitle: "Chapitre 2",
        content: ch2Content,
      },
      {
        title: "Les Meilleurs Outils IA par Métier",
        subtitle: "Chapitre 3",
        content: ch3Content,
      },
      {
        title: "5 Workflows IA Prêts à Copier-Coller",
        subtitle: "Chapitre 4",
        content: ch4Content,
      },
      {
        title: "Les Erreurs à Éviter avec l'IA Générative",
        subtitle: "Chapitre 5",
        content: ch5Content,
      },
      {
        title: "Cas Pratiques par Secteur",
        subtitle: "Chapitre 6",
        content: ch6Content,
      },
    ],
    conclusion: {
      title: "Passer à l'Action Dès Aujourd'hui",
      content: conclusionContent,
    },
    bonus: {
      title: "20 Prompts Supplémentaires Exclusifs",
      content: bonusContent,
    },
    generated_at: new Date().toISOString(),
  };
}
```

---

## `_lib/html-template.ts`

```typescript
import { EbookContent } from "../_types";

export function generateEbookHTML(
  content: EbookContent,
  prenom: string
): string {
  const chapters = content.chapters
    .map((chapter, index) => generateChapterHTML(chapter, index + 1))
    .join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guide Pratique Claude et IA Générative 2026 — AcadémIA Pro</title>
  <style>
    /* ============================================
       VARIABLES & RESET
    ============================================ */
    :root {
      --gold-primary: #D4AF37;
      --gold-light: #F0D060;
      --gold-dark: #A08820;
      --gold-accent: #FFD700;
      --bg-dark: #0A0A0F;
      --bg-card: #12121A;
      --bg-section: #0F0F18;
      --bg-highlight: #1A1A28;
      --text-primary: #F5F5F0;
      --text-secondary: