```tsx
"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Formation {
  id: string;
  title: string;
  progress: number;
  completedModules: number;
  totalModules: number;
  lastModule: string;
  category: string;
}

interface LiveSession {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  joinUrl: string;
}

interface Certificate {
  id: string;
  title: string;
  issueDate: string;
  formation: string;
}

interface Notification {
  id: string;
  message: string;
  type: "info" | "alert" | "success";
  time: string;
  read: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const USER = {
  firstName: "Sophie",
  lastName: "Martin",
  email: "sophie.martin@email.com",
  avatar: "SM",
  memberSince: "2024",
};

const FORMATIONS: Formation[] = [
  {
    id: "f1",
    title: "Intelligence Artificielle & Machine Learning",
    progress: 68,
    completedModules: 17,
    totalModules: 25,
    lastModule: "Réseaux de neurones convolutifs",
    category: "IA",
  },
  {
    id: "f2",
    title: "Leadership & Management Stratégique",
    progress: 42,
    completedModules: 9,
    totalModules: 21,
    lastModule: "Communication en situation de crise",
    category: "Management",
  },
  {
    id: "f3",
    title: "Data Science Avancée",
    progress: 15,
    completedModules: 3,
    totalModules: 20,
    lastModule: "Nettoyage et préparation des données",
    category: "Data",
  },
];

const LIVE_SESSION: LiveSession = {
  id: "l1",
  title: "Masterclass : IA Générative en entreprise",
  instructor: "Dr. Luc Beaumont",
  date: "Aujourd'hui",
  time: "18h00",
  duration: "90 min",
  joinUrl: "#",
};

const CERTIFICATES: Certificate[] = [
  {
    id: "c1",
    title: "Expert en Cybersécurité",
    issueDate: "15 mars 2024",
    formation: "Cybersécurité Fondamentaux",
  },
  {
    id: "c2",
    title: "Python pour la Data Science",
    issueDate: "02 janvier 2024",
    formation: "Python Avancé",
  },
  {
    id: "c3",
    title: "Gestion de Projet Agile",
    issueDate: "10 novembre 2023",
    formation: "Méthodes Agile & Scrum",
  },
];

const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    message: "Nouveau module disponible dans votre formation IA",
    type: "info",
    time: "Il y a 2h",
    read: false,
  },
  {
    id: "n2",
    message: "Rappel : Classe virtuelle dans 1 heure",
    type: "alert",
    time: "Il y a 30 min",
    read: false,
  },
  {
    id: "n3",
    message: "Félicitations ! Vous avez complété 70% de votre formation",
    type: "success",
    time: "Hier",
    read: true,
  },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

const ProgressBar = ({
  progress,
  className = "",
}: {
  progress: number;
  className?: string;
}) => (
  <div
    className={`w-full bg-white/10 rounded-full overflow-hidden ${className}`}
    style={{ height: "6px" }}
  >
    <div
      className="h-full rounded-full transition-all duration-700 ease-out"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
      }}
    />
  </div>
);

const GoldButton = ({
  children,
  onClick,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-semibold tracking-widest uppercase transition-all duration-300 hover:opacity-90 hover:scale-105 active:scale-95 rounded-sm ${sizes[size]} ${className}`}
      style={{
        background: "linear-gradient(135deg, #c8a96e, #a07840)",
        color: "#050508",
        fontFamily: "Georgia, serif",
        letterSpacing: "0.12em",
      }}
    >
      {children}
    </button>
  );
};

const GhostButton = ({
  children,
  onClick,
  className = "",
  active = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm transition-all duration-200 rounded-sm ${className}`}
    style={{
      border: active ? "1px solid #c8a96e" : "1px solid rgba(200,169,110,0.3)",
      color: active ? "#c8a96e" : "rgba(200,169,110,0.7)",
      background: active ? "rgba(200,169,110,0.08)" : "transparent",
      fontFamily: "Georgia, serif",
    }}
  >
    {children}
  </button>
);

// ─── Views ────────────────────────────────────────────────────────────────────

const HomeView = ({
  onResume,
  onJoinLive,
}: {
  onResume: () => void;
  onJoinLive: () => void;
}) => (
  <div className="space-y-8">
    {/* Hero Welcome */}
    <div
      className="relative overflow-hidden rounded-sm p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(200,169,110,0.12) 0%, rgba(200,169,110,0.04) 100%)",
        border: "1px solid rgba(200,169,110,0.2)",
      }}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #c8a96e 0%, transparent 60%)",
        }}
      />
      <div className="relative">
        <p
          className="text-xs tracking-widest uppercase mb-2"
          style={{ color: "rgba(200,169,110,0.6)", fontFamily: "Georgia, serif" }}
        >
          Bienvenue sur AcadémIA Pro
        </p>
        <h1
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}
        >
          Bonjour, {USER.firstName}
        </h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          Vous avez{" "}
          <span style={{ color: "#c8a96e" }}>3 formations en cours</span> ·{" "}
          <span style={{ color: "#c8a96e" }}>2 notifications</span> non lues
        </p>
        <GoldButton onClick={onResume} size="lg">
          ▶ Reprendre ma formation
        </GoldButton>
      </div>
    </div>

    {/* Live Alert */}
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-sm"
      style={{
        background: "rgba(200,169,110,0.06)",
        border: "1px solid rgba(200,169,110,0.35)",
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="relative flex-shrink-0">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: "#c8a96e" }}
          />
          <div
            className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-50"
            style={{ background: "#c8a96e" }}
          />
        </div>
        <div>
          <p
            className="text-xs tracking-widest uppercase mb-0.5"
            style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}
          >
            Classe virtuelle — {LIVE_SESSION.date} à {LIVE_SESSION.time}
          </p>
          <p className="text-sm font-medium" style={{ color: "#fff" }}>
            {LIVE_SESSION.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Avec {LIVE_SESSION.instructor} · {LIVE_SESSION.duration}
          </p>
        </div>
      </div>
      <GoldButton onClick={onJoinLive} size="sm">
        Rejoindre
      </GoldButton>
    </div>

    {/* Active Formations */}
    <div>
      <p
        className="text-xs tracking-widest uppercase mb-4"
        style={{ color: "rgba(200,169,110,0.6)", fontFamily: "Georgia, serif" }}
      >
        Formations en cours
      </p>
      <div className="space-y-3">
        {FORMATIONS.map((f) => (
          <div
            key={f.id}
            className="p-5 rounded-sm transition-all duration-200 hover:border-opacity-60 cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <span
                  className="text-xs px-2 py-0.5 rounded-sm mb-2 inline-block"
                  style={{
                    background: "rgba(200,169,110,0.12)",
                    color: "#c8a96e",
                    fontFamily: