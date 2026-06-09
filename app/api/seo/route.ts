```typescript
// app/api/seo-agent/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Types
interface Formation {
  id: string;
  title: string;
  domain: string;
  description: string;
  duration: string;
  level: string;
  price: number;
  instructor: string;
  objectives: string[];
  relatedFormations?: string[];
}

interface SEOMetadata {
  title: string;
  metaDescription: string;
  h1: string;
  h2s: string[];
  longTailKeywords: string[];
  schemaOrg: object;
  faqSnippets: { question: string; answer: string }[];
}

interface BlogArticle {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  internalLinks: { text: string; url: string }[];
  keywords: string[];
}

interface InternalMeshingData {
  formationId: string;
  complementaryFormations: { id: string; relevanceScore: number; reason: string }[];
  internalLinks: { anchorText: string; targetUrl: string; context: string }[];
}

interface KeywordReport {
  formationId: string;
  primaryKeywords: { keyword: string; volume: string; difficulty: string; intent: string }[];
  secondaryKeywords: { keyword: string; volume: string }[];
  recommendations: string[];
}

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

interface SEOAgentRequest {
  action: "generate_metadata" | "generate_blog" | "optimize_meshing" | "keyword_report" | "generate_sitemap" | "full_audit";
  formations: Formation[];
  siteBaseUrl?: string;
  targetDomain?: string;
}

// Stream helper
function createStreamResponse() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  const send = (data: object) => {
    const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    controller.enqueue(chunk);
  };

  const close = () => {
    controller.close();
  };

  return { stream, send, close };
}

// Generate SEO metadata for a formation
async function generateFormationMetadata(
  formation: Formation,
  send: (data: object) => void
): Promise<SEOMetadata> {
  send({ type: "progress", message: `Génération métadonnées SEO pour: ${formation.title}`, formationId: formation.id });

  const prompt = `Tu es un expert SEO spécialisé en e-learning et formations professionnelles. 
  
  Génère des métadonnées SEO optimisées pour cette formation de la plateforme AcadémIA Pro:
  
  Titre: ${formation.title}
  Domaine: ${formation.domain}
  Description: ${formation.description}
  Durée: ${formation.duration}
  Niveau: ${formation.level}
  Prix: ${formation.price}€
  Formateur: ${formation.instructor}
  Objectifs: ${formation.objectives.join(", ")}
  
  Retourne UNIQUEMENT un JSON valide avec cette structure exacte:
  {
    "title": "titre SEO optimisé 50-60 caractères avec mot clé principal",
    "metaDescription": "description 150-160 caractères avec appel à l'action",
    "h1": "H1 optimisé unique pour la page",
    "h2s": ["H2 section 1", "H2 section 2", "H2 section 3", "H2 section 4", "H2 section 5"],
    "longTailKeywords": ["mot clé longue traîne 1", "mot clé longue traîne 2", "mot clé longue traîne 3", "mot clé longue traîne 4", "mot clé longue traîne 5", "mot clé longue traîne 6", "mot clé longue traîne 7", "mot clé longue traîne 8"],
    "schemaOrg": {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "nom de la formation",
      "description": "description longue",
      "provider": {
        "@type": "Organization",
        "name": "AcadémIA Pro",
        "sameAs": "https://academia-pro.fr"
      },
      "instructor": {
        "@type": "Person",
        "name": "${formation.instructor}"
      },
      "timeRequired": "${formation.duration}",
      "educationalLevel": "${formation.level}",
      "offers": {
        "@type": "Offer",
        "price": "${formation.price}",
        "priceCurrency": "EUR"
      }
    },
    "faqSnippets": [
      {"question": "question fréquente 1", "answer": "réponse détaillée 1"},
      {"question": "question fréquente 2", "answer": "réponse détaillée 2"},
      {"question": "question fréquente 3", "answer": "réponse détaillée 3"},
      {"question": "question fréquente 4", "answer": "réponse détaillée 4"},
      {"question": "question fréquente 5", "answer": "réponse détaillée 5"}
    ]
  }`;

  let fullContent = "";

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      fullContent += chunk.delta.text;
      send({ type: "stream", formationId: formation.id, chunk: chunk.delta.text });
    }
  }

  const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Invalid JSON response for formation ${formation.id}`);
  
  return JSON.parse(jsonMatch[0]) as SEOMetadata;
}

// Generate blog article for a domain
async function generateBlogArticle(
  domain: string,
  formations: Formation[],
  send: (data: object) => void
): Promise<BlogArticle> {
  send({ type: "progress", message: `Génération article blog pour le domaine: ${domain}` });

  const domainFormations = formations.filter(f => f.domain === domain);
  const formationsList = domainFormations.map(f => `- ${f.title}: ${f.description}`).join("\n");

  const prompt = `Tu es un expert en content marketing et SEO pour les plateformes e-learning.
  
  Génère un article de blog SEO optimisé pour AcadémIA Pro sur le domaine: ${domain}
  
  Formations disponibles dans ce domaine:
  ${formationsList}
  
  L'article doit:
  - Cibler des mots clés à fort volume de recherche
  - Inclure des liens internes naturels vers les formations
  - Faire entre 1500-2000 mots
  - Avoir une structure avec H2 et H3
  - Inclure des conseils pratiques et concrets
  
  Retourne UNIQUEMENT un JSON valide:
  {
    "title": "titre article optimisé SEO",
    "slug": "url-slug-optimise",
    "metaDescription": "meta description 150-160 caractères",
    "content": "contenu complet de l'article en markdown avec ## pour H2 et ### pour H3",
    "internalLinks": [
      {"text": "texte ancre", "url": "/formations/[id]"},
      {"text": "texte ancre 2", "url": "/formations/[id2]"}
    ],
    "keywords": ["mot clé principal", "mot clé secondaire 1", "mot clé secondaire 2", "mot clé secondaire 3"]
  }`;

  let fullContent = "";

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      fullContent += chunk.delta.text;
      send({ type: "stream", domain, chunk: chunk.delta.text });
    }
  }

  const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Invalid JSON response for domain ${domain}`);
  
  return JSON.parse(jsonMatch[0]) as BlogArticle;
}

// Optimize internal meshing
async function optimizeInternalMeshing(
  formation: Formation,
  allFormations: Formation[],
  send: (data: object) => void
): Promise<InternalMeshingData> {
  send({ type: "progress", message: `Optimisation maillage interne pour: ${formation.title}`, formationId: formation.id });

  const otherFormations = allFormations
    .filter(f => f.id !== formation.id)
    .map(f => `ID: ${f.id} | Titre: ${f.title} | Domaine: ${f.domain} | Objectifs: ${f.objectives.slice(0, 2).join(", ")}`)
    .join("\n");

  const prompt = `Tu es un expert SEO spécialisé en architecture de site et maillage interne.
  
  Analyse cette formation et identifie les meilleures opportunités de maillage interne:
  
  FORMATION CIBLE:
  - ID: ${formation.id}
  - Titre: ${formation.title}
  - Domaine: ${formation.domain}
  - Objectifs: ${formation.objectives.join(", ")}
  
  AUTRES FORMATIONS DISPONIBLES:
  ${otherFormations}
  
  Identifie les 3-5 formations les plus complémentaires et propose des liens contextuels naturels.
  
  Retourne UNIQUEMENT un JSON valide:
  {
    "formationId": "${formation.id}",
    "complementaryFormations": [
      {
        "id": "id-formation",
        "relevanceScore": 95,
        "reason": "raison de la complémentarité"
      }
    ],
    "internalLinks": [
      {
        "anchorText": "texte ancre naturel et optimisé",
        "targetUrl": "/formations/[id]",
        "context": "phrase de contexte dans laquelle intégrer le lien"
      }
    ]
  }`;

  let fullContent = "";

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-5",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      fullContent += chunk.delta.text;
      send({ type: "stream", formationId: formation.id, chunk: chunk.delta.text });
    }