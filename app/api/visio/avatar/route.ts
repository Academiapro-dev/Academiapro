// app/api/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";

// ============================================================
// TYPES & INTERFACES
// ============================================================

type Specialty =
  | "classe-virtuelle"
  | "hypnose"
  | "pnl"
  | "sophrologie"
  | "meditation"
  | "yoga"
  | "coaching"
  | "nutrition"
  | "langues";

type EmotionContext =
  | "neutral"
  | "encouraging"
  | "calming"
  | "energetic"
  | "focused"
  | "welcoming"
  | "professional";

interface AvatarConfig {
  avatarId: string;
  voiceId: string;
  voiceName: string;
  elevenLabsVoiceId: string;
  personality: string;
  speakingRate: number;
  emotionBaseline: EmotionContext;
  backgroundId?: string;
  language: string;
}

interface SessionConfig {
  specialty: Specialty;
  sessionId: string;
  userId: string;
  language?: string;
  domainExpertise?: string;
}

interface StreamSession {
  sessionId: string;
  sessionToken: string;
  sdpOffer?: string;
  iceServers?: RTCIceServer[];
  avatarConfig: AvatarConfig;
  status: "initializing" | "ready" | "streaming" | "stopped";
  createdAt: number;
}

interface AnimateAvatarRequest {
  sessionId: string;
  text: string;
  emotion?: EmotionContext;
  taskType?: "repeat" | "chat";
}

interface StopSessionRequest {
  sessionId: string;
}

interface HeyGenStreamSession {
  session_id: string;
  session_token: string;
  sdp?: {
    sdp: string;
    type: string;
  };
  ice_servers?: RTCIceServer[];
  status: string;
}

interface HeyGenTaskResponse {
  task_id: string;
  status: string;
}

// ============================================================
// AVATAR CONFIGURATIONS PAR SPÉCIALITÉ
// ============================================================

const AVATAR_CONFIGS: Record<Specialty, Omit<AvatarConfig, "language">> = {
  "classe-virtuelle": {
    avatarId: process.env.HEYGEN_AVATAR_EXPERT || "Wayne_20240711",
    voiceId: "en-US-Neural2-D",
    voiceName: "Expert Formateur",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_EXPERT || "ErXwobaYiN019PkySvjV",
    personality:
      "Formateur expert pédagogue, clair et structuré, adapte son discours au niveau de l'apprenant",
    speakingRate: 1.0,
    emotionBaseline: "professional",
    backgroundId: process.env.HEYGEN_BG_CLASSROOM || "classroom_modern",
  },
  hypnose: {
    avatarId: process.env.HEYGEN_AVATAR_THERAPIST || "Susan_public_2_20240328",
    voiceId: "fr-FR-Neural2-C",
    voiceName: "Thérapeute Apaisante",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_HYPNOSE || "EXAVITQu4vr4xnSDxMaL",
    personality:
      "Thérapeute douce et apaisante, voix hypnotique et rassurante, guide avec bienveillance",
    speakingRate: 0.75,
    emotionBaseline: "calming",
    backgroundId: process.env.HEYGEN_BG_THERAPY || "therapy_room_soft",
  },
  pnl: {
    avatarId: process.env.HEYGEN_AVATAR_COACH_DYNAMIC || "Josh_lite3_20230714",
    voiceId: "fr-FR-Neural2-B",
    voiceName: "Coach PNL Dynamique",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_PNL || "VR6AewLTigWG4xSOukaG",
    personality:
      "Coach dynamique et motivant, expert en PNL, énergique et inspirant, pousse à l'action",
    speakingRate: 1.1,
    emotionBaseline: "energetic",
    backgroundId: process.env.HEYGEN_BG_COACHING || "modern_office_energetic",
  },
  sophrologie: {
    avatarId: process.env.HEYGEN_AVATAR_SOPHRO || "Anna_public_3_20240328",
    voiceId: "fr-FR-Neural2-A",
    voiceName: "Sophrologue Sereine",
    elevenLabsVoiceId:
      process.env.ELEVENLABS_VOICE_SOPHRO || "MF3mGyEYCl7XYWbV9V6O",
    personality:
      "Sophrologue sereine et structurée, voix posée et claire, guide vers la détente profonde",
    speakingRate: 0.8,
    emotionBaseline: "calming",
    backgroundId: process.env.HEYGEN_BG_SOPHRO || "nature_calm",
  },
  meditation: {
    avatarId: process.env.HEYGEN_AVATAR_ZEN || "Lily_public_lite_20240828",
    voiceId: "fr-FR-Neural2-C",
    voiceName: "Guide Zen",
    elevenLabsVoiceId:
      process.env.ELEVENLABS_VOICE_MEDITATION || "jsCqWAovK2LkecY7zXl4",
    personality:
      "Guide méditatif zen et apaisant, présence silencieuse et profonde, voix comme une rivière douce",
    speakingRate: 0.7,
    emotionBaseline: "calming",
    backgroundId: process.env.HEYGEN_BG_MEDITATION || "zen_garden",
  },
  yoga: {
    avatarId: process.env.HEYGEN_AVATAR_YOGA || "Monica_public_20240717",
    voiceId: "fr-FR-Neural2-A",
    voiceName: "Professeur Yoga",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_YOGA || "ThT5KcBeYPX3keUQqHPh",
    personality:
      "Professeur de yoga bienveillant et encourageant, accompagne chaque posture avec douceur et précision",
    speakingRate: 0.85,
    emotionBaseline: "welcoming",
    backgroundId: process.env.HEYGEN_BG_YOGA || "yoga_studio_natural",
  },
  coaching: {
    avatarId: process.env.HEYGEN_AVATAR_COACH || "Tyler-incasualsuit-20220721",
    voiceId: "fr-FR-Neural2-B",
    voiceName: "Coach Énergique",
    elevenLabsVoiceId:
      process.env.ELEVENLABS_VOICE_COACHING || "pNInz6obpgDQGcFmaJgB",
    personality:
      "Coach de vie énergique et encourageant, challengeur bienveillant, pousse vers l'excellence",
    speakingRate: 1.05,
    emotionBaseline: "encouraging",
    backgroundId: process.env.HEYGEN_BG_COACH || "executive_office",
  },
  nutrition: {
    avatarId: process.env.HEYGEN_AVATAR_NUTRITIONIST || "Daisy-inskirt-20220818",
    voiceId: "fr-FR-Neural2-A",
    voiceName: "Nutritionniste Pro",
    elevenLabsVoiceId:
      process.env.ELEVENLABS_VOICE_NUTRITION || "AZnzlk1XvdvUeBnXmlld",
    personality:
      "Nutritionniste professionnelle et passionnée, pédagogue sur la santé alimentaire, bienveillante",
    speakingRate: 0.95,
    emotionBaseline: "professional",
    backgroundId: process.env.HEYGEN_BG_NUTRITION || "kitchen_professional",
  },
  langues: {
    avatarId: process.env.HEYGEN_AVATAR_LANGUAGE || "Vanessa-inblackskirt-20220722",
    voiceId: "fr-FR-Neural2-C",
    voiceName: "Professeur Natif",
    elevenLabsVoiceId:
      process.env.ELEVENLABS_VOICE_LANGUAGE || "z9fAnlkpzviPz146aGWa",
    personality:
      "Professeur de langue natif enthousiaste, patient et encourageant, immersion linguistique totale",
    speakingRate: 0.9,
    emotionBaseline: "encouraging",
    backgroundId: process.env.HEYGEN_BG_LANGUAGE || "language_school",
  },
};

// ============================================================
// EMOTION MAPPINGS POUR EXPRESSIONS FACIALES
// ============================================================

const EMOTION_TO_HEYGEN_EXPRESSION: Record<EmotionContext, string> = {
  neutral: "neutral",
  encouraging: "happy",
  calming: "relaxed",
  energetic: "excited",
  focused: "serious",
  welcoming: "happy",
  professional: "neutral",
};

const CONTEXT_EMOTION_DETECTOR = (text: string): EmotionContext => {
  const lowerText = text.toLowerCase();

  const patterns: Array<{ keywords: string[]; emotion: EmotionContext }> = [
    {
      keywords: ["bravo", "excellent", "parfait", "bien joué", "félicitations", "super"],
      emotion: "encouraging",
    },
    {
      keywords: ["respirez", "détendez", "relâchez", "calme", "douceur", "sérénité"],
      emotion: "calming",
    },
    {
      keywords: ["action", "maintenant", "allez", "challenge", "dépassez", "forcez"],
      emotion: "energetic",
    },
    {
      keywords: ["concentrez", "attention", "focalisez", "important", "notez"],
      emotion: "focused",
    },
    {
      keywords: ["bienvenue", "bonjour", "ravi", "enchanté", "plaisir"],
      emotion: "welcoming",
    },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some((keyword) => lowerText.includes(keyword))) {
      return pattern.emotion;
    }
  }

  return "neutral";
};

// ============================================================
// HEYGEN API CLIENT
// ============================================================

class HeyGenClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY || "";
    this.baseUrl = "https://api.heygen.com";

    if (!this.apiKey) {
      throw new Error("HEYGEN_API_KEY is not configured");
    }
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "