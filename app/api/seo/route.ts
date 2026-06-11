// app/api/seo-agent/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Types
interface Formation {
  id: string;
  title: string;
  description: string;
  domain: string;
  duration: string;
  level: string;
  price: number;
  instructor: string;
  topics: string[];
  prerequisites?: string[];
  relatedFormations?: string[];
}

interface SEOMetadata {
  title: string;
  metaDescription: string;
  h1: string;
  h2s: string[];
  longTailKeywords: string[];
  schemaOrgJsonLd: object;
  faqRichSnippets: FAQ[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface BlogArticle {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  internalLinks: InternalLink[];
  keywords: string[];
}

interface InternalLink {
  anchorText: string;
  targetUrl: string;
  context: string;
}

interface KeywordReport {
  formationId: string;
  primaryKeywords: KeywordData[];
  secondaryKeywords: KeywordData[];
  longTailKeywords: KeywordData[];
  competitorKeywords: string[];
  recommendations: string[];
}

interface KeywordData {
  keyword: string;
  searchVolume: string;
  difficulty: string;
  intent: string;
}

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

interface SEOAgentRequest {
  action:
    | "generate-seo-metadata"
    | "generate-blog-article"
    | "optimize-internal-linking"
    | "keyword-report"
    | "generate-sitemap";
  formations?: Formation[];
  formation?: Formation;
  domain?: string;
  baseUrl?: string;
}

interface SEOAgentResponse {
  success: boolean;
  action: string;
  data?: unknown;
  error?: string;
  generatedAt: string;
}

// Streaming text accumulator
async function streamClaudeResponse(prompt: string): Promise<string> {
  let fullContent = "";

  const stream = await anthropic.messages.stream({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    system: `Tu es un expert SEO spécialisé dans le secteur de la formation professionnelle et e-learning. 
Tu travailles pour AcadémIA Pro, une plateforme de formations en ligne premium.
Tu génères du contenu SEO optimisé, structuré et conforme aux meilleures pratiques Google 2024.
Tu réponds UNIQUEMENT en JSON valide, sans markdown ni texte supplémentaire.`,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullContent += chunk.delta.text;
      process.stdout.write(chunk.delta.text);
    }
  }

  return fullContent;
}

// Generate SEO Metadata for a formation
async function generateSEOMetadata(
  formation: Formation
): Promise<SEOMetadata> {
  const prompt = `Génère les métadonnées SEO complètes pour cette formation en ligne :

Formation :
- Titre : ${formation.title}
- Description : ${formation.description}
- Domaine : ${formation.domain}
- Durée : ${formation.duration}
- Niveau : ${formation.level}
- Prix : ${formation.price}€
- Formateur : ${formation.instructor}
- Sujets abordés : ${formation.topics.join(", ")}
- Prérequis : ${formation.prerequisites?.join(", ") || "Aucun"}

Génère un JSON avec cette structure EXACTE :
{
  "title": "titre SEO optimisé 50-60 caractères avec mot clé principal",
  "metaDescription": "meta description 150-160 caractères avec appel à l'action",
  "h1": "H1 optimisé avec mot clé principal",
  "h2s": ["H2 section 1", "H2 section 2", "H2 section 3", "H2 section 4", "H2 section 5"],
  "longTailKeywords": ["mot clé longue traîne 1", "mot clé longue traîne 2", "mot clé longue traîne 3", "mot clé longue traîne 4", "mot clé longue traîne 5", "mot clé longue traîne 6", "mot clé longue traîne 7", "mot clé longue traîne 8"],
  "schemaOrgJsonLd": {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "nom complet formation",
    "description": "description détaillée",
    "provider": {
      "@type": "Organization",
      "name": "AcadémIA Pro",
      "sameAs": "https://academia-pro.fr"
    },
    "instructor": {
      "@type": "Person",
      "name": "${formation.instructor}"
    },
    "courseMode": "online",
    "duration": "${formation.duration}",
    "inLanguage": "fr",
    "offers": {
      "@type": "Offer",
      "price": "${formation.price}",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    },
    "educationalLevel": "${formation.level}",
    "about": ${JSON.stringify(formation.topics)}
  },
  "faqRichSnippets": [
    {
      "question": "question fréquente 1 sur la formation",
      "answer": "réponse détaillée et utile"
    },
    {
      "question": "question fréquente 2",
      "answer": "réponse détaillée"
    },
    {
      "question": "question fréquente 3",
      "answer": "réponse détaillée"
    },
    {
      "question": "question fréquente 4",
      "answer": "réponse détaillée"
    },
    {
      "question": "question fréquente 5",
      "answer": "réponse détaillée"
    }
  ]
}`;

  const response = await streamClaudeResponse(prompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]) as SEOMetadata;
  } catch {
    throw new Error(`Failed to parse SEO metadata: ${response}`);
  }
}

// Generate Blog Article for a domain
async function generateBlogArticle(
  domain: string,
  formations: Formation[]
): Promise<BlogArticle> {
  const formationsList = formations
    .filter((f) => f.domain === domain)
    .map((f) => `- ${f.title} (${f.level}, ${f.duration})`)
    .join("\n");

  const prompt = `Génère un article de blog SEO complet pour le domaine "${domain}" sur la plateforme AcadémIA Pro.

Formations disponibles dans ce domaine :
${formationsList}

L'article doit :
- Cibler des mots clés à fort potentiel pour le domaine ${domain}
- Inclure des liens internes naturels vers les formations
- Avoir minimum 1500 mots
- Être structuré avec des H2 et H3
- Être orienté pour aider les lecteurs à choisir leur formation

Génère un JSON avec cette structure EXACTE :
{
  "title": "titre article SEO optimisé",
  "slug": "slug-url-optimise",
  "metaDescription": "meta description 150-160 caractères",
  "content": "contenu HTML complet de l'article avec balises H2, H3, p, ul, li",
  "internalLinks": [
    {
      "anchorText": "texte ancre optimisé",
      "targetUrl": "/formations/slug-formation",
      "context": "contexte où placer ce lien dans l'article"
    }
  ],
  "keywords": ["mot clé principal", "mot clé secondaire 1", "mot clé secondaire 2", "longue traîne 1", "longue traîne 2"]
}`;

  const response = await streamClaudeResponse(prompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]) as BlogArticle;
  } catch {
    throw new Error(`Failed to parse blog article: ${response}`);
  }
}

// Optimize Internal Linking
async function optimizeInternalLinking(formations: Formation[]): Promise<{
  linkingMap: Record<string, InternalLink[]>;
  recommendations: string[];
  siloClusters: Record<string, string[]>;
}> {
  const formationsData = formations
    .map(
      (f) =>
        `ID: ${f.id} | Titre: ${f.title} | Domaine: ${f.domain} | Sujets: ${f.topics.join(", ")}`
    )
    .join("\n");

  const prompt = `Optimise le maillage interne pour ces formations sur AcadémIA Pro :

${formationsData}

Analyse les relations thématiques et génère une stratégie de maillage interne optimale.

Génère un JSON avec cette structure EXACTE :
{
  "linkingMap": {
    "formation-id-1": [
      {
        "anchorText": "texte ancre naturel",
        "targetUrl": "/formations/formation-id-2",
        "context": "description du contexte de placement"
      }
    ]
  },
  "recommendations": [
    "recommandation stratégique 1",
    "recommandation stratégique 2",
    "recommandation stratégique 3",
    "recommandation stratégique 4",
    "recommandation stratégique 5"
  ],
  "siloClusters": {
    "nom-cluster-1": ["formation-id-1", "formation-id-2"],
    "nom-cluster-2": ["formation-id-3", "formation-id-4"]
  }
}`;

  const response = await streamClaudeResponse(prompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Failed to parse internal linking data: ${response}`);
  }
}

// Generate Keyword Report
async function generateKeywordReport(
  formation: Formation
): Promise<KeywordReport> {
  const prompt = `Génère un rapport complet de mots clés pour cette formation :

Formation :
- Titre : ${formation.title}
- Domaine : ${formation.domain}
- Niveau : ${formation.level}
- Sujets : ${formation.topics.join(", ")}

Analyse les opportunités de positionnement SEO pour le marché francophone.

Génère un JSON avec cette structure EXACTE :
{