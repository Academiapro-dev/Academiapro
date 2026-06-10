```typescript
// app/api/agent-reseaux-sociaux/route.ts
// Main router - Not used directly, see individual route files below

// ============================================================
// app/api/agent-reseaux-sociaux/generer-contenu/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type Plateforme =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube";

export type TypeContenu =
  | "post"
  | "article"
  | "story"
  | "reel"
  | "video_courte"
  | "video_longue"
  | "short"
  | "campagne_ads"
  | "commentaire_reponse"
  | "message_prospection";

export interface ConfigPlateforme {
  nom: string;
  audience: string;
  trancheAge: string;
  frequencePost: string;
  typesContenu: TypeContenu[];
  tonalite: string;
  objectifPrincipal: string;
  tunnel: string[];
  formatOptimal: Record<string, string>;
  heuresOptimales: string[];
  hashtagsBase: string[];
  ctaTypes: string[];
}

export interface ContenuGenere {
  id: string;
  plateforme: Plateforme;
  typeContenu: TypeContenu;
  titre?: string;
  contenu: string;
  hook?: string;
  cta: string;
  hashtags: string[];
  suggestions_visuels: string[];
  tunnel_etape: string;
  score_viral_estime: number;
  mots_cles_seo?: string[];
  duree_estimee?: string;
  dateCreation: string;
  statut: "brouillon" | "pret" | "programme" | "publie";
  metadata: Record<string, unknown>;
}

export interface PublicationResult {
  id: string;
  plateforme: Plateforme;
  statut: "succes" | "echec" | "programme";
  datePublication?: string;
  url_post?: string;
  erreur?: string;
  engagement_predit: number;
}

export interface PerformanceMetrique {
  plateforme: Plateforme;
  periode: string;
  impressions: number;
  engagement_rate: number;
  clics: number;
  conversions: number;
  leads_generes: number;
  revenus_attribues: number;
  roi_percentage: number;
  contenu_top: ContenuPerformant[];
  recommandations: string[];
}

export interface ContenuPerformant {
  id: string;
  type: TypeContenu;
  titre: string;
  engagement: number;
  portee: number;
  conversions: number;
}

export interface OptimisationResult {
  plateforme: Plateforme;
  ajustements: Ajustement[];
  nouvelles_heures_publication: string[];
  formats_recommandes: TypeContenu[];
  contenus_a_dupliquer: string[];
  score_amelioration_prevu: number;
}

export interface Ajustement {
  type: "frequence" | "format" | "heure" | "ciblage" | "budget_ads";
  description: string;
  impact_prevu: string;
  priorite: "haute" | "moyenne" | "basse";
}

export interface CalendrierPost {
  date: string;
  heure: string;
  plateforme: Plateforme;
  typeContenu: TypeContenu;
  titre: string;
  statut: "planifie" | "brouillon" | "publie";
  contenuId?: string;
}

// ============================================================
// CONFIGURATION PLATEFORMES
// ============================================================

const CONFIGS_PLATEFORMES: Record<Plateforme, ConfigPlateforme> = {
  linkedin: {
    nom: "LinkedIn",
    audience: "B2B · Professionnels",
    trancheAge: "25-55 ans",
    frequencePost: "1 post/jour + 2 articles/semaine",
    typesContenu: [
      "post",
      "article",
      "campagne_ads",
      "commentaire_reponse",
      "message_prospection",
    ],
    tonalite: "Professionnel, expert, inspirant, orienté résultats",
    objectifPrincipal: "Génération de leads B2B et autorité professionnelle",
    tunnel: [
      "Post viral",
      "Visite profil",
      "Lead magnet téléchargé",
      "Vente formation",
    ],
    formatOptimal: {
      post: "150-300 mots avec espacement aéré",
      article: "800 mots minimum avec sous-titres",
      message_prospection: "50-80 mots personnalisés",
    },
    heuresOptimales: ["07:30", "12:00", "17:30", "19:00"],
    hashtagsBase: [
      "#IA",
      "#Intelligence Artificielle",
      "#Formation",
      "#Reconversion",
      "#AcadémIAPro",
      "#FutureOfWork",
      "#Leadership",
      "#Productivité",
    ],
    ctaTypes: [
      "Téléchargez le guide gratuit",
      "Rejoignez la formation",
      "Réservez votre appel stratégique",
    ],
  },
  instagram: {
    nom: "Instagram",
    audience: "Grand public · Bien-être · IA",
    trancheAge: "25-45 ans",
    frequencePost: "1 post/jour + 3 stories/jour + 3 reels/semaine",
    typesContenu: ["post", "story", "reel"],
    tonalite: "Inspirant, accessible, visuel, lifestyle",
    objectifPrincipal: "Notoriété et génération de leads via contenu viral",
    tunnel: [
      "Reel viral",
      "Visite bio",
      "Lien Linktree",
      "Lead magnet",
      "Vente",
    ],
    formatOptimal: {
      post: "Caption 150-200 mots + visuels impactants",
      story: "Format vertical 9:16 · texte court · swipe up",
      reel: "30-90 secondes · hook 3 premières secondes",
    },
    heuresOptimales: ["08:00", "12:30", "18:00", "21:00"],
    hashtagsBase: [
      "#IA",
      "#IntelligenceArtificielle",
      "#FormationEnLigne",
      "#Productivité",
      "#AcadémIA",
      "#ApprendreIA",
      "#TechLife",
      "#FutureReady",
    ],
    ctaTypes: [
      "Lien en bio ↑",
      "Sauvegarde ce post",
      "Partage à quelqu'un qui en a besoin",
    ],
  },
  facebook: {
    nom: "Facebook",
    audience: "35-55 ans · Reconversion · Formation",
    trancheAge: "35-55 ans",
    frequencePost: "1 post/jour + groupes gérés",
    typesContenu: ["post", "campagne_ads", "commentaire_reponse"],
    tonalite: "Chaleureux, rassurant, communautaire, pédagogique",
    objectifPrincipal: "Communauté engagée et conversions via ManyChat",
    tunnel: [
      "Post engageant",
      "Commentaire",
      "Bot ManyChat",
      "Qualification lead",
      "Vente",
    ],
    formatOptimal: {
      post: "200-400 mots · storytelling · question finale",
      groupe: "Contenu exclusif · valeur ajoutée · interaction",
    },
    heuresOptimales: ["09:00", "13:00", "19:00", "21:00"],
    hashtagsBase: [
      "#FormationIA",
      "#ReconversionPro",
      "#ApprendreIA",
      "#AcadémIAPro",
      "#TravailFutur",
    ],
    ctaTypes: [
      "Commente OUI pour recevoir le guide",
      "Rejoins notre groupe privé",
      "Clique sur le lien en commentaire",
    ],
  },
  tiktok: {
    nom: "TikTok",
    audience: "25-40 ans · IA · Productivité",
    trancheAge: "25-40 ans",
    frequencePost: "1 vidéo courte/jour 30-60 secondes",
    typesContenu: ["video_courte"],
    tonalite: "Dynamique, punch, éducatif-entertainment, tendance",
    objectifPrincipal: "Viralité et awareness via contenus IA tendance",
    tunnel: ["Vidéo virale", "Bio visitée", "Lead magnet", "Vente"],
    formatOptimal: {
      video_courte: "30-60 secondes · hook 3 premières secondes · sous-titres",
    },
    heuresOptimales: ["07:00", "12:00", "19:00", "22:00"],
    hashtagsBase: [
      "#IA",
      "#ChatGPT",
      "#AITips",
      "#ApprendreIA",
      "#TechTok",
      "#Productivité",
      "#AcadémIA",
      "#AITools",
    ],
    ctaTypes: [
      "Suis pour plus de tips IA",
      "Lien en bio pour la formation gratuite",
      "Commente IA si tu veux apprendre",
    ],
  },
  youtube: {
    nom: "YouTube",
    audience: "Tous âges · Contenu long · SEO · Autorité",
    trancheAge: "25-55 ans",
    frequencePost: "1 tutoriel/semaine + shorts quotidiens",
    typesContenu: ["video_longue", "short"],
    tonalite: "Pédagogique, expert, structuré, valeur maximale",
    objectifPrincipal: "Autorité SEO et génération de leads qualifiés",
    tunnel: [
      "Vidéo tutoriel",
      "Description avec liens",
      "Lead magnet",
      "Vente formation",
    ],
    formatOptimal: {
      video_longue: "10-15 minutes · chapitres · miniature cliquable",
      short: "15-60 secondes · vertical · hook immédiat",
    },
    heuresOptimales: ["09:00", "14:00", "17:00"],
    hashtagsBase: [
      "#IntelligenceArtificielle",
      "#FormationIA",
      "#TutorielIA",
      "#AcadémIAPro",
      "#ChatGPT",
      "#AIFrançais",
    ],
    ctaTypes: [
      "Abonne-toi pour ne rien manquer",
      "Télécharge le guide gratuit en description",
      "Rejoins AcadémIA Pro",
    ],
  },
};

// ============================================================
// AGENT IA - GÉNÉRATEUR DE CONTENU
// ============================================================

async function genererContenuIA(
  plateforme: Plateforme,
  typeContenu: TypeContenu,
  sujet: string,
  contexteSupplementaire?: string
): Promise<ContenuGenere> {
  const config = CONFIGS_PLATEFORMES[plateforme];

  const systemPrompt = `Tu es l'agent IA expert en marketing des réseaux sociaux pour AcadémIA Pro, 
une formation en intelligence artificielle premium. Tu crées du contenu hautement optimisé 
pour chaque plateforme avec pour objectif la conversion et la viralité.

CONTEXTE ACADÉM IA PRO :
- Formation IA complète pour professionnels et particuliers
- Prix : formations entre 297€ et 1997€  
- Promesse : Maîtriser l'IA en 30 jours et booster sa productivité/carrière
- Audience cible sur ${config.nom} : ${config.audience} (${config.trancheAge})
- Tonalité requise : ${config.tonalite}
- Objectif principal : ${config.objectifPrincipal}
- Tunnel de conversion : ${config.tunnel.join(" → ")}

FORMAT REQUIS POUR ${config.nom.toUpperCase()} (${typeContenu}) :
${config.formatOptimal[typeContenu] || "Format adapté à la plateforme"}

RÈGLES STRICTES :
1. Hook ultra-puissant dans les 3 premières secondes/lignes
2. Valeur réelle et actionnable dans chaque contenu
3. CTA clair orienté tunnel : ${config.ctaTypes.join(" | ")}
4. Hashtags optimaux inclus
5. Adapté algorithme ${config.nom} 2024
6. INTERDIT : contenu générique, clichés vides, promesses non tenues`;

  const userPrompt = `Crée un contenu ${typeContenu} pour ${config.nom} sur le sujet : "${sujet}"
${contexteSupplementaire ? `Contexte supplémentaire : ${contexteSupplementaire}` : ""}

Réponds en JSON strict avec cette structure :
{
  "titre": "titre accrocheur si applicable",
  "hook": "les 3 premières secondes/lignes ultra-puissantes",
  "contenu": "contenu complet optimisé",
  "cta": "appel à l'action précis",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "suggestions_visuels": ["description visuel 1", "description visuel 2"],
  "tunnel_etape": "étape du tunnel concernée",
  "score_viral_estime": 85,
  "mots_cles_seo": ["mot-clé 1", "mot-clé 2"],
  "duree_estimee": "durée si vidéo/article",
  "notes_optimisation": "conseils supplémentaires"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 2500,
  });

  const responseData = JSON.parse(
    completion.choices[0].message.content || "{}"
  );

  const contenuId = `cnt_${plateforme}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: contenuId,
    plateforme,
    typeContenu,
    titre: responseData.titre,
    contenu: responseData.contenu,
    hook: responseData.hook,
    cta: responseData.cta,
    hashtags: [
      ...new Set([
        ...(responseData.hashtags || []),
        ...config.hashtags