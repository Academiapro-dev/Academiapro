"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
// TYPES
// ============================================================
interface Replay {
  id: string;
  title: string;
  formation: string;
  formateur: string;
  formateurAvatar: string;
  date: string;
  duration: number; // minutes
  thumbnail: string;
  videoUrl: string;
  isNew: boolean;
  expiresAt: string;
  description: string;
  tags: string[];
}

interface UserProgress {
  [replayId: string]: {
    currentTime: number;
    percentage: number;
    completed: boolean;
  };
}

interface PersonalNotes {
  [replayId: string]: string;
}

// ============================================================
// MOCK DATA
// ============================================================
const FORMATIONS = [
  "Toutes les formations",
  "Intelligence Artificielle Avancée",
  "Machine Learning Pratique",
  "Deep Learning & NLP",
  "Data Science Fondamentaux",
  "Computer Vision",
];

const MOCK_REPLAYS: Replay[] = [
  {
    id: "1",
    title: "Introduction aux Transformers & Architecture BERT",
    formation: "Deep Learning & NLP",
    formateur: "Dr. Sophie Moreau",
    formateurAvatar: "SM",
    date: "2024-01-15",
    duration: 94,
    thumbnail: "",
    videoUrl: "",
    isNew: true,
    expiresAt: "2024-02-14",
    description:
      "Exploration complète de l'architecture Transformer, attention mechanisms et fine-tuning BERT pour des tâches NLP avancées.",
    tags: ["BERT", "Transformers", "NLP", "Attention"],
  },
  {
    id: "2",
    title: "Réseaux de Neurones Convolutifs - CNN Avancé",
    formation: "Computer Vision",
    formateur: "Prof. Alexandre Chen",
    formateurAvatar: "AC",
    date: "2024-01-12",
    duration: 110,
    thumbnail: "",
    videoUrl: "",
    isNew: true,
    expiresAt: "2024-02-11",
    description:
      "Maîtrisez les architectures ResNet, EfficientNet et Vision Transformers pour la classification et détection d'objets.",
    tags: ["CNN", "ResNet", "Vision", "Classification"],
  },
  {
    id: "3",
    title: "Pipeline MLOps : De l'Entraînement au Déploiement",
    formation: "Machine Learning Pratique",
    formateur: "Marie Dubois",
    formateurAvatar: "MD",
    date: "2024-01-08",
    duration: 127,
    thumbnail: "",
    videoUrl: "",
    isNew: false,
    expiresAt: "2024-02-07",
    description:
      "Construisez un pipeline MLOps complet avec MLflow, Docker, Kubernetes et monitoring en production.",
    tags: ["MLOps", "Docker", "MLflow", "Production"],
  },
  {
    id: "4",
    title: "Régression Avancée & Feature Engineering",
    formation: "Data Science Fondamentaux",
    formateur: "Dr. Thomas Laurent",
    formateurAvatar: "TL",
    date: "2024-01-05",
    duration: 88,
    thumbnail: "",
    videoUrl: "",
    isNew: false,
    expiresAt: "2024-02-04",
    description:
      "Techniques avancées de feature engineering, sélection de variables et ensemble methods pour améliorer vos modèles.",
    tags: ["Régression", "Feature Engineering", "XGBoost"],
  },
  {
    id: "5",
    title: "Prompt Engineering & Fine-tuning LLMs",
    formation: "Intelligence Artificielle Avancée",
    formateur: "Dr. Sophie Moreau",
    formateurAvatar: "SM",
    date: "2024-01-18",
    duration: 103,
    thumbnail: "",
    videoUrl: "",
    isNew: true,
    expiresAt: "2024-02-17",
    description:
      "Maîtrisez l'art du prompt engineering et apprenez à fine-tuner des LLMs comme GPT-4 et LLaMA pour vos cas d'usage.",
    tags: ["LLM", "Prompt", "Fine-tuning", "GPT-4"],
  },
  {
    id: "6",
    title: "Reinforcement Learning : Q-Learning et PPO",
    formation: "Intelligence Artificielle Avancée",
    formateur: "Prof. Alexandre Chen",
    formateurAvatar: "AC",
    date: "2023-12-28",
    duration: 135,
    thumbnail: "",
    videoUrl: "",
    isNew: false,
    expiresAt: "2024-01-27",
    description:
      "Implémentation pratique d'agents d'apprentissage par renforcement avec OpenAI Gym, Q-Learning et Proximal Policy Optimization.",
    tags: ["RL", "Q-Learning", "PPO", "OpenAI Gym"],
  },
  {
    id: "7",
    title: "GANs Génératifs : DCGAN, StyleGAN & Diffusion",
    formation: "Deep Learning & NLP",
    formateur: "Marie Dubois",
    formateurAvatar: "MD",
    date: "2024-01-10",
    duration: 118,
    thumbnail: "",
    videoUrl: "",
    isNew: false,
    expiresAt: "2024-02-09",
    description:
      "Créez des images photoréalistes avec les Generative Adversarial Networks et comprenez les modèles de diffusion.",
    tags: ["GAN", "StyleGAN", "Diffusion", "Génératif"],
  },
  {
    id: "8",
    title: "Analyse de Séries Temporelles avec LSTM",
    formation: "Machine Learning Pratique",
    formateur: "Dr. Thomas Laurent",
    formateurAvatar: "TL",
    date: "2024-01-03",
    duration: 96,
    thumbnail: "",
    videoUrl: "",
    isNew: false,
    expiresAt: "2024-02-02",
    description:
      "Prédiction de séries temporelles avec LSTM, GRU et Temporal Fusion Transformers pour la finance et l'IoT.",
    tags: ["LSTM", "Séries Temporelles", "GRU", "Prédiction"],
  },
];

// ============================================================
// UTILITIES
// ============================================================
const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}min` : `${m}min`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getDaysRemaining = (expiresAt: string): number => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getGradientForFormation = (formation: string): string => {
  const gradients: Record<string, string> = {
    "Intelligence Artificielle Avancée":
      "from-purple-900/80 via-purple-800/60 to-transparent",
    "Machine Learning Pratique":
      "from-blue-900/80 via-blue-800/60 to-transparent",
    "Deep Learning & NLP":
      "from-emerald-900/80 via-emerald-800/60 to-transparent",
    "Data Science Fondamentaux":
      "from-orange-900/80 via-orange-800/60 to-transparent",
    "Computer Vision": "from-rose-900/80 via-rose-800/60 to-transparent",
  };
  return gradients[formation] || "from-gray-900/80 via-gray-800/60 to-transparent";
};

const getAccentForFormation = (formation: string): string => {
  const accents: Record<string, string> = {
    "Intelligence Artificielle Avancée": "#a855f7",
    "Machine Learning Pratique": "#3b82f6",
    "Deep Learning & NLP": "#10b981",
    "Data Science Fondamentaux": "#f97316",
    "Computer Vision": "#f43f5e",
  };
  return accents[formation] || "#c8a96e";
};

// ============================================================
// SUB COMPONENTS
// ============================================================

// ---------- VIDEO PLAYER ----------
interface VideoPlayerProps {
  replay: Replay;
  progress: UserProgress;
  onProgressUpdate: (id: string, currentTime: number, percentage: number, completed: boolean) => void;
  isLiveUser: boolean;
}

function VideoPlayer({ replay, progress, onProgressUpdate, isLiveUser }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const savedProgress = progress[replay.id];

  useEffect(() => {
    // Simulate video duration from replay duration
    setTotalDuration(replay.duration * 60);
    if (savedProgress) {
      setCurrentTime(savedProgress.currentTime);
    }
  }, [replay.id, replay.duration, savedProgress]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio *