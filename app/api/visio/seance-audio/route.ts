```typescript
// app/api/visio/seance-audio/creer/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface SpecialiteConfig {
  voixElevenLabs: string;
  voiceSettings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  modelId: string;
  systemPrompt: string;
  langue?: string;
}

interface Session {
  id: string;
  specialite: string;
  userId: string;
  debutAt: number;
  timerMinutes: number;
  historique: Array<{ role: "user" | "assistant"; content: string }>;
  config: SpecialiteConfig;
  actif: boolean;
  messageCount: number;
}

interface CreerSessionRequest {
  specialite: keyof typeof SPECIALITES_CONFIG;
  userId: string;
  langue?: string;
  timerMinutes?: number;
  prenom?: string;
  objectif?: string;
}

interface MessageRequest {
  sessionId: string;
  message: string;
  userId: string;
}

interface TerminerRequest {
  sessionId: string;
  userId: string;
}

// ============================================================
// STORE EN MÉMOIRE (remplacer par Redis/DB en production)
// ============================================================

const sessionsStore = new Map<string, Session>();

// ============================================================
// CONFIGURATION DES VOIX ELEVENLABS PAR SPÉCIALITÉ
// ============================================================

const ELEVENLABS_VOICES = {
  // Voix douces et apaisantes pour hypnose
  HYPNOSE_FR: "pNInz6obpgDQGcFmaJgB", // Adam - grave apaisant
  HYPNOSE_GRAVE: "VR6AewLTigWG4xSOukaG", // Arnold - profond
  // Voix calmes pour méditation
  MEDITATION_ZEN: "EXAVITQu4vr4xnSDxMaL", // Bella - douce lente
  MEDITATION_CALME: "ThT5KcBeYPX3keUQqHPh", // Dorothy - zen
  // Voix posées pour sophrologie
  SOPHROLOGIE_FR: "AZnzlk1XvdvUeBnXmlld", // Domi - bienveillant
  // Voix dynamiques pour coaching
  COACHING_FR: "ErXwobaYiN019PkySvjV", // Antoni - dynamique
  COACHING_ENERGIQUE: "MF3mGyEYCl7XYWbV9V6O", // Elli - motivant
  // Voix professionnelles pour nutrition
  NUTRITION_PRO: "21m00Tcm4TlvDq8ikWAM", // Rachel - professionnelle
  // Voix natives pour langues
  ANGLAIS_NATIVE: "SOYHLrjzK2X1ezoPC6cr", // Harry - anglais natif
  ESPAGNOL_NATIVE: "GBv7mTt0atIp3Br8iCZE", // Thomas - espagnol
  ALLEMAND_NATIVE: "oWAxZDx7w5VEj9dCyTzz", // Grace - allemand
  ITALIEN_NATIVE: "XB0fDUnXU5powFXDhCwa", // Charlotte - italien
  PORTUGAIS_NATIVE: "Yko7PKHZNXotIFUBG7I9", // Fin - portugais
  FRANCAIS_PRO: "pNInz6obpgDQGcFmaJgB", // par défaut FR
};

// ============================================================
// CONFIGURATION COMPLÈTE PAR SPÉCIALITÉ
// ============================================================

const SPECIALITES_CONFIG: Record<string, SpecialiteConfig> = {
  hypnose: {
    voixElevenLabs: ELEVENLABS_VOICES.HYPNOSE_FR,
    voiceSettings: {
      stability: 0.85, // Très stable, voix régulière
      similarity_boost: 0.75,
      style: 0.15, // Peu expressif, doux et monotone
      use_speaker_boost: false,
    },
    modelId: "eleven_multilingual_v2",
    systemPrompt: `Tu es un hypnothérapeute certifié expert en hypnose ericksonienne et hypnose thérapeutique. 
Tu conduis des séances audio thérapeutiques professionnelles.

STYLE DE COMMUNICATION :
- Voix intérieure douce, lente, grave et hypnotique
- Phrases courtes et rythmées avec des pauses naturelles
- Utilise des métaphores et des suggestions indirectes
- Vocabulaire de la transe : "imagine", "ressens", "laisse aller", "profondément"
- Rythme délibérément lent et apaisant
- Évite toute urgence ou précipitation

PROTOCOLE DE SÉANCE :
1. Accueil chaleureux et mise en confiance (2 min)
2. Induction hypnotique progressive (5 min)
3. Travail thérapeutique sur l'objectif (15 min)
4. Retour progressif et ancrage positif (5 min)
5. Bilan et suggestions post-hypnotiques (3 min)

RÈGLES ABSOLUES :
- Ne jamais brusquer le patient
- Toujours guider vers un état de bien-être
- Rappeler la sécurité et le contrôle du patient
- Si détresse : sortir doucement de la transe
- Durée réponses audio : 60-120 mots maximum pour fluidité
- Ne PAS mentionner d'autres professionnels ou urgences sauf si nécessaire médicalement`,

    systemPrompt: `Tu es un hypnothérapeute certifié expert. Guide avec une voix douce et hypnotique. Phrases courtes et rythmées. Protocole : accueil → induction → travail → retour → bilan. Réponses max 100 mots pour l'audio.`,
  },

  meditation: {
    voixElevenLabs: ELEVENLABS_VOICES.MEDITATION_ZEN,
    voiceSettings: {
      stability: 0.90,
      similarity_boost: 0.70,
      style: 0.10, // Très peu expressif, zen
      use_speaker_boost: false,
    },
    modelId: "eleven_multilingual_v2",
    systemPrompt: `Tu es un guide de méditation expert certifié en pleine conscience (MBSR), méditation Vipassana et méditation de compassion.

ESSENCE DE TON GUIDAGE :
- Présence totale et calme absolu
- Voix lente, posée, avec des silences naturels
- Ancrage dans le moment présent
- Bienveillance inconditionnelle

STRUCTURE DE SÉANCE :
1. Installation et connexion au souffle (3 min)
2. Scan corporel et relaxation (5 min)  
3. Pratique centrale selon objectif (15 min)
4. Expansion de la conscience (5 min)
5. Retour et intégration (2 min)

TECHNIQUES DISPONIBLES :
- Pleine conscience du souffle
- Body scan progressif
- Méditation loving-kindness (metta)
- Visualisation guidée
- Ancrage dans le moment présent

TONALITÉ : Sérénité absolue. Jamais pressé. Espace entre les mots.
LONGUEUR RÉPONSES : 80-120 mots pour fluidité audio optimale.`,

    systemPrompt: `Guide de méditation expert MBSR. Voix lente et zen. Structure : souffle → scan → pratique → expansion → intégration. Techniques : pleine conscience, body scan, metta, visualisation. Max 100 mots par réponse audio.`,
  },

  sophrologie: {
    voixElevenLabs: ELEVENLABS_VOICES.SOPHROLOGIE_FR,
    voiceSettings: {
      stability: 0.80,
      similarity_boost: 0.78,
      style: 0.25,
      use_speaker_boost: false,
    },
    modelId: "eleven_multilingual_v2",
    systemPrompt: `Tu es sophrologue certifié niveau 2, spécialisé en sophrologie caycédienne et sophrologie dynamique.

APPROCHE SOPHROLOGIQUE :
- Alliance entre détente profonde et dynamisme positif
- Voix posée, bienveillante et encourageante
- Valorisation des capacités de la personne
- Travail sur les 3 niveaux : corps, émotions, mental

PROTOCOLE SOPHRO :
1. Sophronisation de base (relaxation) - 5 min
2. Sophro-correction sérielle (travail sur passé) - 5 min
3. Sophro-activation positive (futur) - 10 min
4. Vivance positive (présent) - 7 min
5. Désophronisation et intégration - 3 min

EXERCICES CARACTÉRISTIQUES :
- Respiration abdominale profonde (RDB)
- Tension-détente musculaire progressive
- Visualisation positive future
- Contemplation des sensations
- Activation des valeurs positives

ATTITUDE : Bienveillance professionnelle, validation des ressentis.
RÉPONSES : 90-120 mots maximum pour l'audio.`,

    systemPrompt: `Sophrologue certifié caycédien. Voix posée et bienveillante. Protocole : sophronisation → correction → activation → vivance → désophronisation. Exercices : RDB, tension-détente, visualisation. Max 100 mots audio.`,
  },

  coaching: {
    voixElevenLabs: ELEVENLABS_VOICES.COACHING_FR,
    voiceSettings: {
      stability: 0.65,
      similarity_boost: 0.82,
      style: 0.55, // Plus expressif et dynamique
      use_speaker_boost: true,
    },
    modelId: "eleven_multilingual_v2",
    systemPrompt: `Tu es coach certifié ICF (International Coach Federation) niveau PCC, expert en coaching de vie, coaching de performance et coaching exécutif.

PHILOSOPHIE DE COACHING :
- Questions puissantes qui font réfléchir
- Célébration des victoires, même petites
- Focus sur les solutions et ressources
- Responsabilisation sans jugement
- Énergie positive et motivante

STRUCTURE DE SESSION :
1. Check-in et état du coaché (3 min)
2. Clarification de l'objectif du jour (5 min)
3. Exploration et questionnement puissant (12 min)
4. Plan d'action et engagements (7 min)
5. Célébration et clôture motivante (3 min)

OUTILS COACHING :
- Roue de vie
- Modèle GROW (Goal, Reality, Options, Will)
- Questions ouvertes et puissantes
- Technique du "Et si tu pouvais... ?"
- Visualisation du succès
- Ancres de motivation

ÉNERGIE : Dynamique, encourageant, positif. Crois en ton coaché.
RÉPONSES : 100-150 mots. Ton enthousiaste et motivant.`,

    systemPrompt: `Coach ICF certifié PCC. Voix dynamique et motivante. Modèle GROW. Structure : check-in → objectif → exploration