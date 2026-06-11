"use client";

import { useState, useEffect } from "react";

// Types
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpRequired?: number;
}

interface XPEvent {
  id: string;
  description: string;
  xp: number;
  date: string;
  icon: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  level: string;
  xp: number;
  avatar: string;
  isCurrentUser?: boolean;
}

interface Level {
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  icon: string;
  nextReward: string;
}

// Data
const LEVELS: Level[] = [
  { name: "Débutant", minXP: 0, maxXP: 500, color: "#9ca3af", icon: "🌱", nextReward: "Badge Apprenti + 50 XP bonus" },
  { name: "Apprenti", minXP: 500, maxXP: 2000, color: "#60a5fa", icon: "📚", nextReward: "Badge Praticien + accès modules avancés" },
  { name: "Praticien", minXP: 2000, maxXP: 5000, color: "#34d399", icon: "⚕️", nextReward: "Badge Expert + certificat intermédiaire" },
  { name: "Expert", minXP: 5000, maxXP: 10000, color: "#f59e0b", icon: "🎯", nextReward: "Badge Maître + accès formations premium" },
  { name: "Maître", minXP: 10000, maxXP: 20000, color: "#c8a96e", icon: "👑", nextReward: "Badge Légende + statut VIP" },
  { name: "Légende", minXP: 20000, maxXP: Infinity, color: "#e879f9", icon: "⚡", nextReward: "Titre Légende + accès vie entière" },
];

const BADGES: Badge[] = [
  { id: "first-step", name: "Premier Pas", description: "Terminer votre premier module", icon: "👣", unlocked: true, rarity: "common" },
  { id: "assiduous", name: "Assidu", description: "7 jours de connexion consécutifs", icon: "🔥", unlocked: true, rarity: "rare" },
  { id: "perfectionist", name: "Perfectionniste", description: "Obtenir 10/10 à 5 exercices", icon: "💎", unlocked: true, rarity: "epic" },
  { id: "explorer", name: "Explorateur", description: "Visiter toutes les catégories", icon: "🗺️", unlocked: false, rarity: "rare" },
  { id: "wellness", name: "Bien-être", description: "Compléter 10 séances thérapeutiques", icon: "🧘", unlocked: false, rarity: "epic" },
  { id: "polyglot", name: "Polyglotte", description: "Suivre des formations en 3 langues", icon: "🌍", unlocked: false, rarity: "legendary" },
  { id: "leader", name: "Leader", description: "Atteindre le top 3 du classement", icon: "🏆", unlocked: false, rarity: "legendary" },
];

const XP_HISTORY: XPEvent[] = [
  { id: "1", description: "Module complété : Introduction IA", xp: 100, date: "Il y a 2h", icon: "📖" },
  { id: "2", description: "Connexion quotidienne", xp: 10, date: "Il y a 5h", icon: "☀️" },
  { id: "3", description: "Note 10/10 — Exercice algorithmes", xp: 100, date: "Hier", icon: "⭐" },
  { id: "4", description: "Streak 7 jours bonus", xp: 200, date: "Il y a 2j", icon: "🔥" },
  { id: "5", description: "Séance thérapeutique complétée", xp: 150, date: "Il y a 3j", icon: "🧘" },
  { id: "6", description: "Formation terminée : Machine Learning", xp: 500, date: "Il y a 5j", icon: "🎓" },
  { id: "7", description: "Premier exercice du module", xp: 50, date: "Il y a 6j", icon: "✨" },
];

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "A. Martin", level: "Légende", xp: 24500, avatar: "AM" },
  { rank: 2, name: "S. Dupont", level: "Maître", xp: 18200, avatar: "SD" },
  { rank: 3, name: "L. Bernard", level: "Maître", xp: 15800, avatar: "LB" },
  { rank: 4, name: "Vous", level: "Expert", xp: 7340, avatar: "YO", isCurrentUser: true },
  { rank: 5, name: "M. Lefebvre", level: "Expert", xp: 6900, avatar: "ML" },
  { rank: 6, name: "C. Rousseau", level: "Expert", xp: 6100, avatar: "CR" },
  { rank: 7, name: "P. Moreau", level: "Praticien", xp: 4800, avatar: "PM" },
  { rank: 8, name: "J. Simon", level: "Praticien", xp: 4200, avatar: "JS" },
  { rank: 9, name: "N. Laurent", level: "Praticien", xp: 3900, avatar: "NL" },
  { rank: 10, name: "T. Petit", level: "Praticien", xp: 3400, avatar: "TP" },
];

// Helper functions
const getCurrentLevel = (xp: number): Level => {
  return LEVELS.slice().reverse().find((l) => xp >= l.minXP) || LEVELS[0];
};

const getProgressPercent = (xp: number, level: Level): number => {
  if (level.maxXP === Infinity) return 100;
  const range = level.maxXP - level.minXP;
  const progress = xp - level.minXP;
  return Math.min(Math.round((progress / range) * 100), 100);
};

const getRarityColor = (rarity: Badge["rarity"]): string => {
  switch (rarity) {
    case "common": return "#9ca3af";
    case "rare": return "#60a5fa";
    case "epic": return "#a855f7";
    case "legendary": return "#c8a96e";
  }
};

const getRarityLabel = (rarity: Badge["rarity"]): string => {
  switch (rarity) {
    case "common": return "Commun";
    case "rare": return "Rare";
    case "epic": return "Épique";
    case "legendary": return "Légendaire";
  }
};

// Subcomponents
const AnimatedNumber = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString("fr-FR")}</span>;
};

const FlameAnimation = ({ streak }: { streak: number }) => {
  const [intensity, setIntensity] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setIntensity((prev) => (prev === 1 ? 1.15 : 1));
    }, 800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="text-5xl transition-transform duration-700 ease-in-out cursor-default select-none"
        style={{ transform: `scale(${intensity})`, filter: "drop-shadow(0 0 12px #f97316)" }}
      >
        🔥
      </div>
      <span className="text-3xl font-bold" style={{ color: "#f97316" }}>
        {streak}
      </span>
      <span className="text-xs text-gray-400 tracking-wider uppercase">jours</span>
    </div>
  );
};

const ProgressBar = ({
  percent,
  color,
  height = "h-3",
  animated = true,
}: {
  percent: number;
  color: string;
  height?: string;
  animated?: boolean;
}) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 200);
    return () => clearTimeout(t);
  }, [percent]);
  return (
    <div className={`w-full ${height} rounded-full overflow-hidden`} style={{ backgroundColor: "#1a1a2e" }}>
      <div
        className={`${height} rounded-full ${animated ? "transition-all duration-1000 ease-out" : ""}`}
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}66`,
        }}
      />
    </div>
  );
};

const GlassCard = ({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) => (
  <div
    className={`rounded-2xl border ${className}`}
    style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      borderColor: glow ? "rgba(200,169,110,0.3)" : "rgba(255,255,255,0.06)",
      boxShadow: glow
        ? "0 0 30px rgba(200,169,110,0.08), inset 0 1px 0 rgba(255,255,255,0.05)"
        : "inset 0 1px 0 rgba(255,255,255,0.04)",
      backdropFilter: "blur(10px)",
    }}
  >
    {children}
  </div>
);

const SectionTitle = ({ children, icon }: { children: React.ReactNode; icon: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="text-xl">{icon}</span>
    <h2 className="text-lg font-semibold tracking-wide" style={{ color: "#c