```typescript
// app/api/agent-reseaux-sociaux/contenu/generer/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================
// TYPES & INTERFACES
// ============================================================

type Platform =
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "reels"
  | "youtube"
  | "facebook";

type ContentType =
  // LinkedIn
  | "linkedin_conseil_ia"
  | "linkedin_temoignage"
  | "linkedin_etude_cas"
  | "linkedin_actualite_ia"
  | "linkedin_annonce_formation"
  // Instagram
  | "instagram_caption"
  | "instagram_reel_description"
  | "instagram_story"
  | "instagram_bio"
  // TikTok & Reels
  | "tiktok_script"
  | "reels_script"
  // YouTube
  | "youtube_complet"
  // Facebook
  | "facebook_post"
  | "facebook_question"
  | "facebook_evenement"
  | "facebook_partage_article";

interface GenerateContentRequest {
  platform: Platform;
  contentType: ContentType;
  topic: string;
  additionalContext?: string;
  tone?: "professionnel" | "inspirant" | "educatif" | "conversationnel";
  targetAudience?: string;
  formation?: string;
  results?: string;
  testimonialName?: string;
  eventDate?: string;
  articleUrl?: string;
}

interface GeneratedContent {
  id: string;
  platform: Platform;
  contentType: ContentType;
  topic: string;
  generatedAt: string;
  content: ContentOutput;
  metadata: ContentMetadata;
}

interface ContentOutput {
  // LinkedIn
  postText?: string;
  hashtags?: string[];
  // Instagram
  caption?: string;
  bio?: string;
  storyText?: string;
  pollOptions?: string[];
  // TikTok/Reels
  hook?: string;
  body?: string;
  cta?: string;
  overlayTexts?: string[];
  // YouTube
  title?: string;
  description?: string;
  tags?: string[];
  chapters?: Chapter[];
  script?: string;
  // Facebook
  postContent?: string;
  question?: string;
  eventDetails?: EventDetails;
  // Common
  rawContent?: string;
}

interface Chapter {
  timestamp: string;
  title: string;
}

interface EventDetails {
  title: string;
  description: string;
  callToAction: string;
}

interface ContentMetadata {
  wordCount: number;
  characterCount: number;
  estimatedReadTime?: string;
  estimatedVideoLength?: string;
  hashtagCount?: number;
}

// ============================================================
// PROMPT BUILDERS
// ============================================================

function buildSystemPrompt(): string {
  return `Tu es l'Agent Réseaux Sociaux d'AcadémIA Pro, une plateforme de formation en ligne spécialisée dans :
- L'Intelligence Artificielle et les outils IA
- Le Bien-être et développement personnel
- Les Langues (apprentissage accéléré par IA)
- Le Business et entrepreneuriat digital

Ta mission : créer du contenu social media engageant, authentique et optimisé pour chaque plateforme.

IDENTITÉ DE MARQUE AcadémIA Pro :
- Ton : Expert accessible, bienveillant, innovant
- Valeurs : Excellence, Innovation, Accessibilité, Transformation
- Différenciateur : IA au service de l'apprentissage humain
- Slogan possible : "Apprenez plus vite. Évoluez plus loin."

RÈGLES ABSOLUES :
1. Toujours en français sauf hashtags internationaux
2. Jamais de promesses mensongères
3. Authenticité avant tout
4. Call-to-action clair et non agressif
5. Respect des guidelines de chaque plateforme
6. Retourner UNIQUEMENT du JSON valide, sans markdown ni backticks`;
}

function buildLinkedInPrompt(
  request: GenerateContentRequest
): string {
  const prompts: Record<string, string> = {
    linkedin_conseil_ia: `Génère un post LinkedIn "Conseil IA du jour" pour AcadémIA Pro.

Sujet : ${request.topic}
${request.additionalContext ? `Contexte : ${request.additionalContext}` : ""}
Ton : ${request.tone || "professionnel"}

STRUCTURE REQUISE :
- Accroche forte (1-2 lignes)
- Développement du conseil (3-4 paragraphes)
- Exemple concret ou statistique
- Takeaway actionnable
- 3 hashtags professionnels pertinents

CONTRAINTES : 150-300 mots, espacement visuel avec sauts de ligne

Retourne un JSON avec : { "postText": "...", "hashtags": ["...", "...", "..."] }`,

    linkedin_temoignage: `Mets en forme ce témoignage apprenant pour LinkedIn AcadémIA Pro.

Apprenant : ${request.testimonialName || "Un(e) apprenant(e)"}
Sujet/Formation : ${request.formation || request.topic}
Résultats : ${request.results || request.additionalContext || "transformation positive"}

STRUCTURE :
- Citation impactante en ouverture (entre guillemets)
- Contexte avant/après formation
- Résultats chiffrés si disponibles
- Message inspirant pour les lecteurs
- 3 hashtags

CONTRAINTES : 150-250 mots, format narrative

Retourne un JSON avec : { "postText": "...", "hashtags": ["...", "...", "..."] }`,

    linkedin_etude_cas: `Crée une étude de cas formation LinkedIn pour AcadémIA Pro.

Formation/Compétence : ${request.formation || request.topic}
Résultats chiffrés : ${request.results || request.additionalContext || "résultats significatifs"}
Public cible : ${request.targetAudience || "professionnels en reconversion"}

STRUCTURE :
- Titre accrocheur avec chiffre clé
- Présentation du défi initial
- Solution AcadémIA Pro
- Résultats concrets et mesurables
- Leçons applicables
- CTA vers la formation
- 3 hashtags

CONTRAINTES : 200-300 mots

Retourne un JSON avec : { "postText": "...", "hashtags": ["...", "...", "..."] }`,

    linkedin_actualite_ia: `Commente cette actualité IA en tant qu'expert AcadémIA Pro pour LinkedIn.

Actualité/Sujet : ${request.topic}
Angle souhaité : ${request.additionalContext || "impact sur la formation et l'emploi"}

STRUCTURE :
- Annonce de l'actualité
- Analyse experte (ce que ça signifie vraiment)
- Impact sur les professionnels
- Opportunité de formation/adaptation
- Question d'engagement pour la communauté
- 3 hashtags d'actualité

CONTRAINTES : 200-300 mots, positionner AcadémIA Pro comme référence IA

Retourne un JSON avec : { "postText": "...", "hashtags": ["...", "...", "..."] }`,

    linkedin_annonce_formation: `Annonce cette nouvelle formation/pack/skill pour AcadémIA Pro sur LinkedIn.

Formation : ${request.formation || request.topic}
Public cible : ${request.targetAudience || "professionnels"}
Contexte/Avantages : ${request.additionalContext || "formation innovante par IA"}

STRUCTURE :
- Annonce enthousiaste mais professionnelle
- Ce que l'apprenant va maîtriser (3-5 bullet points avec emojis)
- Pour qui c'est fait
- Résultats attendus
- Date/Disponibilité (si précisé)
- CTA clair
- 3 hashtags

CONTRAINTES : 200-300 mots

Retourne un JSON avec : { "postText": "...", "hashtags": ["...", "...", "..."] }`,
  };

  return (
    prompts[request.contentType] ||
    `Génère un post LinkedIn professionnel sur : ${request.topic}. Retourne un JSON avec : { "postText": "...", "hashtags": ["...", "...", "..."] }`
  );
}

function buildInstagramPrompt(
  request: GenerateContentRequest
): string {
  const prompts: Record<string, string> = {
    instagram_caption: `Crée une caption Instagram engageante pour AcadémIA Pro.

Sujet du visuel : ${request.topic}
Contexte : ${request.additionalContext || "contenu éducatif IA"}
Ton : ${request.tone || "inspirant"}

STRUCTURE :
- Hook visuel (1 ligne percutante)
- Développement avec valeur réelle
- Astuce pratique ou stat impactante
- CTA naturel (save, partage, lien en bio)
- 5 emojis stratégiquement placés

HASHTAGS (20 exactement) : mix populaires (#ia #formation) + niche (#apprentissageIA #academiapro) + trending

CONTRAINTES : Caption 50-150 mots

Retourne un JSON avec : { "caption": "...", "hashtags": ["...x20 hashtags"] }`,

    instagram_reel_description: `Écris la description d'un Reel Instagram pour AcadémIA Pro.

Sujet du Reel : ${request.topic}
Durée prévue : ${request.additionalContext || "30-60 secondes"}

STRUCTURE :
- Hook texte pour la description (curiosité/valeur)
- Ce qu'on apprend dans ce Reel
- CTA (follow, save, partage)
- Mention des hashtags

HOOK VIDÉO (pour l'écran) : phrase d'accroche en 3-5 mots max

20 HASHTAGS optimisés Reels

Retourne un JSON avec : { "caption": "...", "hook": "...", "hashtags": ["...x20"] }`,

    instagram_story: `Crée du contenu Story Instagram pour AcadémIA Pro.

Sujet : ${request.topic}
Type : ${request.additionalContext || "conseil/inspiration"}

CRÉER :
1. Story texte principal (max 3 lignes percutantes)
2. Question d'engagement (pour sticker Question)
3. Sondage (question + 2 options de vote)
4. Texte swipe-up/lien (si applicable)

TON : Direct, dynamique, personnel

Retourne un JSON avec : { "storyText": "...", "question": "...", "pollOptions": ["option1", "option2"], "linkText": "..." }`,

    instagram_bio: `Optimise la bio Instagram d'AcadémIA Pro.

Spécialités : ${request.topic || "IA, Langues, Business, Bien-être"}
CTA souhaité : ${request.additionalContext || "inscription newsletter/formation"}

CONTRAINTES BIO (150 caractères max) :
- Ligne 1 : Ce qu'on fait (valeur unique)
- Ligne 2 : Pour qui
- Ligne 3 : Preuve sociale ou chiffre
- Ligne 4 : CTA + lien

CRÉER AUSSI : 5 versions alternatives

Retourne un JSON avec : { "bio": "...", "alternatives": ["...", "...", "...", "...", "..."], "cta": "..." }`,
  };

  return (
    prompts[request.contentType] ||
    `Génère une caption Instagram sur : ${request.topic}. Retourne un JSON avec : { "caption": "...", "hashtags": ["...x20"] }`
  );
}

function buildTikTokReelsPrompt(
  request: GenerateContentRequest
): string {
  return `Écris un script ${request.platform === "tiktok" ? "TikTok" : "Reels"} complet pour AcadémIA Pro.

Sujet : ${request.topic}
Public : ${request.targetAudience || "apprenants 25-45 ans"}
Durée cible : ${request.additionalContext || "30-60 secondes"}

STRUCTURE OBLIGATOIRE :

🎣 HOOK (3 premières secondes - CRUCIAL) :
- Phrase choc OU question provocatrice OU stat surprenante
- Doit stopper le scroll instantanément

📚 CORPS (20-50 secondes) :
- 3-5 points de valeur maximum
- Rythme rapide, 1 idée = 1-2 secondes
- Transitions naturelles
- Exemple concret AcadémIA Pro

🎯 CTA FINAL (5 dernières secondes) :
- Action précise (follow, commentaire, lien bio)
- Urgence légère si pertinent

📝 TEXTES OVERLAY (superposés à l'écran) :
- 4-6 textes courts (max 5 mots chacun)
- Moments d'apparition suggérés

STYLE : Énergique, authentique, éducatif, humour bienveillant si approprié

Retourne un JSON avec : { "hook": "...", "body": "...", "cta": "...", "overlayTexts": ["...", "...", "...", "...", "..."], "totalDuration": "..." }`;
}

function buildYouTubePrompt(
  request: GenerateContentRequest
): string {
  return `Crée le contenu YouTube complet pour AcadémIA Pro.

Sujet de la vidéo : ${request.topic}
Durée cible : ${request.additionalContext || "10-15 minutes"}
Mots-clés principaux : ${request.formation || "IA, formation, apprentissage"}

GÉNÉRER :

1. TITRE SEO (max 60 caractères) :
- Mot-clé principal en premier
- Chiffre ou résultat si possible
- Curiosity gap ou bénéfice clair

2. DESCRIPTION (500 mots) :
- Paragraphe intro avec mots-clés
- Ce qu'on apprend (bullet points)
- À propos d'AcadémIA Pro
- Liens et ressources
- Timestamps intégrés
- CTA abonnement

3. TAGS (15 tags) :
- Mix short-tail + long-tail
- En français ET anglais
- Variations du sujet

4. CHAPITRES TIMESTAMPÉS :
- Format: 00:00 Titre du chapitre
- 6-8 chapitres logiques
- Commence obligatoirement par 00:00

5. SCRIPT COMPLET (10-15 min) :
- Intro accrocheuse (30-60 sec)
- Présentation speaker + canal
- Corps structuré avec transitions
- Exemples concrets
- Outro avec CTA abonnement + like

Retourne un JSON avec : { "title": "...", "description": "...", "tags": ["...x15"], "chapters": [{"timestamp": "00:00", "title": "..."}], "script": "..." }`;
}

function buildFacebookPrompt(
  request: GenerateContentRequest
): string {
  const prompts: Record<string, string> = {
    facebook_post: `Crée un post