```tsx
// app/components/AudioTherapySession.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

interface SessionSummary {
  duration: string;
  topicsDiscussed: string[];
  keyInsights: string[];
  recommendedActions: string[];
  nextSessionDate?: string;
}

const AGENT = {
  name: "Dr. Aria",
  specialty: "Psychologie Cognitive & Bien-être",
  ambiance: "nature",
  avatar: "🌿",
  welcomeMessage:
    "Bonjour, je suis Dr. Aria. Je suis ravie de vous accueillir dans cet espace de sérénité. Prenez une grande inspiration... et laissez-vous guider. Comment vous sentez-vous aujourd'hui ?",
};

const SESSION_DURATION = 30 * 60;

export default function AudioTherapySession() {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [volume, setVolume] = useState(75);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [nextSessionBooked, setNextSessionBooked] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number }>
  >([]);
  const [wavePoints, setWavePoints] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseRef = useRef<NodeJS.Timeout | null>(null);
  const waveRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sessionSummary: SessionSummary = {
    duration: `${Math.floor((SESSION_DURATION - timeLeft) / 60)}min ${(SESSION_DURATION - timeLeft) % 60}s`,
    topicsDiscussed: [
      "Gestion du stress académique",
      "Techniques de respiration",
      "Organisation et planification",
    ],
    keyInsights: [
      "Vous avez identifié vos principales sources d'anxiété",
      "La technique de respiration 4-7-8 vous convient",
      "Un journal quotidien pourrait vous aider",
    ],
    recommendedActions: [
      "Pratiquer 5 min de méditation chaque matin",
      "Utiliser la méthode Pomodoro pour les révisions",
      "Tenir un journal des émotions",
    ],
  };

  useEffect(() => {
    setMounted(true);
    const pts = Array.from({ length: 20 }, (_, i) => 50 + Math.sin(i) * 20);
    setWavePoints(pts);
    const parts = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
    }));
    setParticles(parts);
  }, []);

  const animateWave = useCallback(() => {
    setWavePoints((prev) =>
      prev.map((_, i) => {
        const base = isAgentSpeaking ? pulseIntensity * 0.8 : 15;
        return 50 + Math.sin(Date.now() / 500 + i * 0.5) * base;
      })
    );
  }, [isAgentSpeaking, pulseIntensity]);

  useEffect(() => {
    if (!mounted) return;
    waveRef.current = setInterval(animateWave, 50);
    return () => {
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, [animateWave, mounted]);

  useEffect(() => {
    if (isActive && !isPaused && !sessionEnded) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, sessionEnded]);

  useEffect(() => {
    if (isMicOn) {
      pulseRef.current = setInterval(() => {
        setPulseIntensity(Math.random() * 60 + 20);
      }, 150);
    } else if (isAgentSpeaking) {
      pulseRef.current = setInterval(() => {
        setPulseIntensity(Math.random() * 40 + 15);
      }, 200);
    } else {
      setPulseIntensity(0);
      if (pulseRef.current) clearInterval(pulseRef.current);
    }
    return () => {
      if (pulseRef.current) clearInterval(pulseRef.current);
    };
  }, [isMicOn, isAgentSpeaking]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = () => {
    setIsActive(true);
    setIsAgentSpeaking(true);
    const welcomeMsg: Message = {
      id: "welcome",
      role: "agent",
      content: AGENT.welcomeMessage,
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
    setTimeout(() => setIsAgentSpeaking(false), 4000);
  };

  const handleSessionEnd = () => {
    setSessionEnded(true);
    setIsActive(false);
    setIsMicOn(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => setShowSummary(true), 1500);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setTimeout(() => {
      setIsAgentSpeaking(true);
      const responses = [
        "Je comprends ce que vous ressentez. C'est tout à fait normal de traverser ces moments. Parlons-en davantage...",
        "Merci de partager cela avec moi. Cette prise de conscience est déjà un grand pas. Comment cela vous affecte-t-il au quotidien ?",
        "Votre ressenti est valide. Ensemble, nous allons explorer des stratégies adaptées à votre situation.",
      ];
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setTimeout(() => setIsAgentSpeaking(false), 3000);
    }, 1200);
  };

  const progressPercent = ((SESSION_DURATION - timeLeft) / SESSION_DURATION) * 100;

  const wavePathD = mounted && wavePoints.length > 0
    ? `M 0 50 ${wavePoints.map((y, i) => `L ${(i / (wavePoints.length - 1)) * 100} ${y}`).join(" ")} L 100 50`
    : "M 0 50 L 100 50";

  if (!mounted) return null;

  // ── SESSION END / SUMMARY ────────────────────────────────────────────────
  if (showSummary) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-500/30 mb-4">
              <span className="text-3xl">✦</span>
            </div>
            <h1 className="text-2xl font-light text-white tracking-widest mb-1">
              Séance Terminée
            </h1>
            <p className="text-slate-400 text-sm tracking-wider">
              Durée · {sessionSummary.duration}
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-[#0a0f1a]/80 border border-slate-700/40 rounded-2xl p-6 mb-4 backdrop-blur-sm">
            <h2 className="text-slate-300 text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-4 h-px bg-emerald-500/60 inline-block"></span>
              Compte-rendu de séance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  label: "Thèmes abordés",
                  items: sessionSummary.topicsDiscussed,
                  color: "emerald",
                },
                {
                  label: "Insights clés",
                  items: sessionSummary.keyInsights,
                  color: "violet",
                },
                {
                  label: "Actions recommandées",
                  items: sessionSummary.recommendedActions,
                  color: "sky",
                },
              ].map((section) => (
                <div
                  key={section.label}
                  className="bg-slate-800/30 rounded-xl p-4"
                >
                  <p
                    className={`text-xs