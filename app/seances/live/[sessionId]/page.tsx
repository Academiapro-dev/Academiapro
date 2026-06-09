```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Specialty =
  | "Hypnose"
  | "PNL"
  | "Sophrologie"
  | "Méditation guidée"
  | "Thérapie cognitive"
  | "EMDR";

type SessionPhase = "welcome" | "active" | "paused" | "ended";

interface Message {
  id: string;
  sender: "user" | "therapist";
  text: string;
  timestamp: Date;
}

interface SessionSummary {
  duration: number;
  specialty: Specialty;
  keyPoints: string[];
  mood: string;
  nextSteps: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_DURATION = 30 * 60; // 30 minutes in seconds

const SPECIALTY_CONFIG: Record<
  Specialty,
  { color: string; icon: string; welcome: string; description: string }
> = {
  Hypnose: {
    color: "from-indigo-900/40 to-purple-900/40",
    icon: "◉",
    welcome:
      "Bienvenue dans votre séance d'hypnose thérapeutique. Installez-vous confortablement, respirez profondément et laissez-vous guider vers un état de relaxation profonde.",
    description: "Accès aux ressources inconscientes",
  },
  PNL: {
    color: "from-amber-900/30 to-yellow-900/30",
    icon: "◈",
    welcome:
      "Bienvenue dans votre séance de Programmation Neuro-Linguistique. Nous allons explorer ensemble vos schémas de pensée et développer de nouvelles ressources intérieures.",
    description: "Reprogrammation des schémas mentaux",
  },
  Sophrologie: {
    color: "from-teal-900/40 to-cyan-900/30",
    icon: "✦",
    welcome:
      "Bienvenue dans votre séance de sophrologie. À travers la relaxation dynamique et la visualisation positive, nous harmoniserons votre corps et votre esprit.",
    description: "Harmonie corps-esprit",
  },
  "Méditation guidée": {
    color: "from-violet-900/40 to-blue-900/30",
    icon: "☽",
    welcome:
      "Bienvenue dans votre séance de méditation guidée. Fermez les yeux, centrez-vous sur votre respiration et laissez les pensées s'écouler naturellement.",
    description: "Pleine conscience et présence",
  },
  "Thérapie cognitive": {
    color: "from-rose-900/30 to-pink-900/30",
    icon: "⬡",
    welcome:
      "Bienvenue dans votre séance de thérapie cognitive et comportementale. Ensemble, nous identifierons et restructurerons les pensées limitantes.",
    description: "Restructuration cognitive",
  },
  EMDR: {
    color: "from-emerald-900/30 to-green-900/30",
    icon: "⟁",
    welcome:
      "Bienvenue dans votre séance EMDR. Cette approche douce vous permettra de retraiter les expériences difficiles et de retrouver votre équilibre intérieur.",
    description: "Désensibilisation et retraitement",
  },
};

const MOCK_SUMMARY: SessionSummary = {
  duration: 30,
  specialty: "Sophrologie",
  keyPoints: [
    "Réduction significative du niveau de stress",
    "Ancrage d'un état de calme profond",
    "Identification des déclencheurs d'anxiété",
    "Exercices de cohérence cardiaque maîtrisés",
  ],
  mood: "Apaisé et recentré",
  nextSteps: [
    "Pratiquer la respiration 4-7-8 chaque matin",
    "Journal émotionnel quotidien",
    "Écouter l'enregistrement de relaxation fourni",
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoldenParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            background: `radial-gradient(circle, #d4af37, #b8960c)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 8 + 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

function TimerDisplay({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = ((SESSION_DURATION - seconds) / SESSION_DURATION) * 100;
  const isLow = seconds < 300;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="rgba(212,175,55,0.15)"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={isLow ? "rgba(239,68,68,0.6)" : "rgba(212,175,55,0.5)"}
            strokeWidth="2"
            strokeDasharray="100"
            strokeDashoffset={100 - progress}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
      </div>
      <span
        className={`font-light tabular-nums text-sm tracking-widest ${
          isLow ? "text-red-400" : "text-amber-300/70"
        }`}
      >
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}

function AvatarDisplay({
  isActive,
  isSpeaking,
  specialty,
}: {
  isActive: boolean;
  isSpeaking: boolean;
  specialty: Specialty;
}) {
  const config = SPECIALTY_CONFIG[specialty];

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Outer glow rings */}
      {isSpeaking && (
        <>
          <div className="absolute w-80 h-80 rounded-full border border-amber-400/10 animate-ping" />
          <div
            className="absolute w-96 h-96 rounded-full border border-amber-400/5 animate-ping"
            style={{ animationDelay: "0.3s" }}
          />
        </>
      )}

      {/* Avatar container */}
      <div
        className={`relative w-72 h-72 rounded-full overflow-hidden bg-gradient-to-b ${config.color} border border-amber-400/20 shadow-2xl`}
        style={{
          boxShadow: isSpeaking
            ? "0 0 60px rgba(212,175,55,0.15), 0 0 120px rgba(212,175,55,0.05)"
            : "0 0 40px rgba(0,0,0,0.8)",
        }}
      >
        {/* HeyGen avatar placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Abstract face representation */}
            <div className="w-48 h-48 rounded-full bg-gradient-to-b from-amber-950/50 to-stone-900/80 border border-amber-400/10 flex items-center justify-center">
              <div className="text-center">
                <div className="text-amber-300/60 text-5xl mb-2">
                  {config.icon}
                </div>
                <div className="w-16 h-0.5 bg-amber-400/20 mx-auto" />
              </div>
            </div>

            {/* Animated breathing effect */}
            {isActive && (
              <div
                className="absolute inset-0 rounded-full bg-amber-400/5"
                style={{
                  animation: "breathe 4s ease-in-out infinite",
                }}
              />
            )}
          </div>
        </div>

        {/* Speaking wave overlay */}
        {isSpeaking && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-amber-400/60 rounded-full"
                style={{
                  height: `${8 + Math.random() * 16}px`,
                  animation: `wave 0.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Therapist info */}
      <div className="mt-6 text-center">
        <p className="text-amber-200/80 text-lg font-light tracking-wider">
          Dr. Aria — AcadémIA Pro
        </p>
        <p className="text-amber-400/50 text-sm mt-1 tracking-widest uppercase font-light">
          {config.description}
        </p>
      </div>
    </div>
  );
}

function ChatPanel({
  messages,
  onSend,
  isOpen,
}: {
  messages: Message[];
  onSend: (text: string) => void;
  isOpen: boolean;
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-stone-950/80 backdrop-blur-sm border-l border-amber-400/10">
      <div className="px-4 py-3 border-b border-amber-400/10">
        <p className="text-amber-300/60 text-xs tracking-widest uppercase