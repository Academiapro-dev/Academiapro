```tsx
"use client";

import { useState, useEffect } from "react";

type SessionStatus = "upcoming" | "live" | "ended" | "replay";
type SessionLevel = "Premium" | "Live";

interface Session {
  id: string;
  title: string;
  day: string;
  time: string;
  date: Date;
  status: SessionStatus;
  trainer: string;
  trainerInitials: string;
  participants: number;
  maxParticipants: number;
  duration: string;
  formation: string;
  level: SessionLevel;
  replayUrl?: string;
}

const sessions: Session[] = [
  {
    id: "1",
    title: "Fondamentaux de l'IA Générative",
    day: "Lundi",
    time: "18h00",
    date: new Date(Date.now() + 1000 * 60 * 60 * 2),
    status: "live",
    trainer: "Atlas IA",
    trainerInitials: "AT",
    participants: 47,
    maxParticipants: 60,
    duration: "90 min",
    formation: "IA pour Entrepreneurs",
    level: "Premium",
  },
  {
    id: "2",
    title: "Automatisation des Workflows Métier",
    day: "Mercredi",
    time: "18h00",
    date: new Date(Date.now() + 1000 * 60 * 60 * 48),
    status: "upcoming",
    trainer: "Nova IA",
    trainerInitials: "NV",
    participants: 23,
    maxParticipants: 60,
    duration: "90 min",
    formation: "IA pour Entrepreneurs",
    level: "Live",
  },
  {
    id: "3",
    title: "Prompt Engineering Avancé",
    day: "Vendredi",
    time: "12h30",
    date: new Date(Date.now() + 1000 * 60 * 60 * 96),
    status: "upcoming",
    trainer: "Orion IA",
    trainerInitials: "OR",
    participants: 38,
    maxParticipants: 60,
    duration: "60 min",
    formation: "Maîtrise des LLMs",
    level: "Premium",
  },
  {
    id: "4",
    title: "Stratégie Commerciale avec l'IA",
    day: "Samedi",
    time: "10h00",
    date: new Date(Date.now() + 1000 * 60 * 60 * 120),
    status: "upcoming",
    trainer: "Lyra IA",
    trainerInitials: "LY",
    participants: 55,
    maxParticipants: 60,
    duration: "120 min",
    formation: "Business IA",
    level: "Live",
  },
  {
    id: "5",
    title: "Introduction au Machine Learning",
    day: "Lundi",
    time: "18h00",
    date: new Date(Date.now() - 1000 * 60 * 60 * 168),
    status: "replay",
    trainer: "Atlas IA",
    trainerInitials: "AT",
    participants: 52,
    maxParticipants: 60,
    duration: "90 min",
    formation: "IA pour Entrepreneurs",
    level: "Premium",
    replayUrl: "#",
  },
  {
    id: "6",
    title: "Outils No-Code & IA",
    day: "Mercredi",
    time: "18h00",
    date: new Date(Date.now() - 1000 * 60 * 60 * 120),
    status: "ended",
    trainer: "Nova IA",
    trainerInitials: "NV",
    participants: 41,
    maxParticipants: 60,
    duration: "90 min",
    formation: "IA pour Entrepreneurs",
    level: "Live",
  },
  {
    id: "7",
    title: "Fine-tuning de Modèles Personnalisés",
    day: "Vendredi",
    time: "12h30",
    date: new Date(Date.now() - 1000 * 60 * 60 * 72),
    status: "replay",
    trainer: "Orion IA",
    trainerInitials: "OR",
    participants: 29,
    maxParticipants: 60,
    duration: "60 min",
    formation: "Maîtrise des LLMs",
    level: "Premium",
    replayUrl: "#",
  },
];

const formations = ["Toutes", "IA pour Entrepreneurs", "Maîtrise des LLMs", "Business IA"];

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance > 0) {
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white border"
        style={{
          background: "rgba(200,169,110,0.1)",
          borderColor: "rgba(200,169,110,0.3)",
          fontFamily: "monospace",
        }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-xs mt-1.5" style={{ color: "#c8a96e" }}>
        {label}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const config = {
    live: { label: "EN COURS", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#10b981", pulse: true },
    upcoming: { label: "À VENIR", bg: "rgba(200,169,110,0.1)", border: "rgba(200,169,110,0.3)", text: "#c8a96e", pulse: false },
    ended: { label: "TERMINÉE", bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.3)", text: "#9ca3af", pulse: false },
    replay: { label: "REPLAY DISPO", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)", text: "#818cf8", pulse: false },
  };
  const c = config[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ background: c.bg, borderColor: c.border, color: c.text }}
    >
      {c.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: c.text }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: c.text }} />
        </span>
      )}
      {!c.pulse && status !== "upcoming" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.text }} />}
      {c.label}
    </span>
  );
}

function LevelBadge({ level }: { level: SessionLevel }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{
        background: level === "Live" ? "rgba(200,169,110,0.1)" : "rgba(200,169,110,0.05)",
        borderColor: "rgba(200,169,110,0.4)",
        color: "#c8a96e",
      }}
    >
      {level === "Live" ? "⚡" : "👑"} {level}
    </span>
  );
}

function TrainerAvatar({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
        style={{
          background: "linear-gradient(135deg, rgba(200,169,110,0.3), rgba(200,169,110,0.1))",
          borderColor: "#c8a96e",
          color: "#c8a96e",
        }}
      >
        {initials}
      </div>
      <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
        {name}
      </span>
    </div>
  );
}

function ParticipantsBar({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        <span>{current} participants</span>
        <span>{max} max</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct > 80 ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #c8a96e, #a8894e)",
          }}
        />
      </div>
    </div>
  );
}

function SessionCard({ session, featured = false }: { session: Session; featured?: boolean }) {
  const countdown = useCountdown(session.date);

  return (
    <div
      className="relative rounded-2xl p-5 border transition-all duration-300 hover:translate-y-[-2px] group"
      style={{
        background: featured
          ? "linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.03))"
          : "rgba(255,255,255,0.02)",
        borderColor: featured ? "rgba(200,169,110,0.4)" : session.status === "live" ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)",
        boxShad