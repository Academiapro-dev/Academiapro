```tsx
"use client";

import { useState, useEffect, useRef } from "react";

// ============================================================
// TYPES
// ============================================================
interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  initials: string;
  text: string;
  level: "Gratuit" | "Premium" | "VIP";
  joined: string;
  color: string;
}

interface DiscordActivity {
  id: number;
  user: string;
  initials: string;
  message: string;
  time: string;
  color: string;
}

interface CommunityLevel {
  name: string;
  badge: string;
  price: string;
  features: string[];
  highlight: boolean;
  cta: string;
  ctaStyle: string;
}

// ============================================================
// DATA
// ============================================================
const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Sophie Marchand",
    role: "Consultante Marketing",
    avatar: "",
    initials: "SM",
    text: "La communauté AcadémIA Pro a complètement transformé ma façon de travailler. Les prompts exclusifs chaque semaine me font gagner des heures. Le Discord est incroyablement actif !",
    level: "Premium",
    joined: "Membre depuis 8 mois",
    color: "#c8a96e",
  },
  {
    id: 2,
    name: "Thomas Lefevre",
    role: "Entrepreneur Digital",
    avatar: "",
    initials: "TL",
    text: "Le niveau VIP vaut chaque euro. L'accès direct à Jacques et le mastermind mensuel m'ont permis de lancer mon business IA en moins de 3 mois. ROI immédiat.",
    level: "VIP",
    joined: "Membre depuis 1 an",
    color: "#f0c674",
  },
  {
    id: 3,
    name: "Camille Rousseau",
    role: "Développeuse Freelance",
    avatar: "",
    initials: "CR",
    text: "J'ai commencé avec le niveau gratuit et j'ai très vite upgradé. La qualité des ressources et l'entraide dans la communauté sont exceptionnelles. Je recommande à 100%.",
    level: "Premium",
    joined: "Membre depuis 5 mois",
    color: "#9b8ecf",
  },
  {
    id: 4,
    name: "Alexandre Petit",
    role: "Chef de Projet IT",
    avatar: "",
    initials: "AP",
    text: "Les lives mensuels avec l'avatar IA expert sont une vraie pépite. On apprend des techniques avancées que vous ne trouvez nulle part ailleurs. La communauté est au top.",
    level: "Premium",
    joined: "Membre depuis 6 mois",
    color: "#6eb5c8",
  },
];

const DISCORD_ACTIVITY: DiscordActivity[] = [
  {
    id: 1,
    user: "Marie_L",
    initials: "ML",
    message: "Venez voir ce prompt fou pour générer des plans business complets 🔥",
    time: "il y a 2 min",
    color: "#c8a96e",
  },
  {
    id: 2,
    user: "Dev_Tom",
    initials: "DT",
    message: "Le live d'hier soir était incroyable ! Les nouvelles techniques sur GPT-4o changent tout",
    time: "il y a 8 min",
    color: "#9b8ecf",
  },
  {
    id: 3,
    user: "Sarah_Pro",
    initials: "SP",
    message: "Partage de ressources : j'ai créé un workflow Notion × IA qui fait gagner 3h/jour",
    time: "il y a 15 min",
    color: "#6eb5c8",
  },
  {
    id: 4,
    user: "Jacques_IA",
    initials: "JI",
    message: "🎯 Nouveau prompt pack disponible dans #ressources-exclusives — 47 prompts business",
    time: "il y a 23 min",
    color: "#f0c674",
  },
  {
    id: 5,
    user: "Lucas_M",
    initials: "LM",
    message: "Question : quelqu'un a testé Claude 3.5 pour la rédaction longue ? Mes résultats sont bluffants",
    time: "il y a 31 min",
    color: "#c8a96e",
  },
];

const COMMUNITY_LEVELS: CommunityLevel[] = [
  {
    name: "Gratuit",
    badge: "🌱",
    price: "0€ / mois",
    features: [
      "Accès Discord AcadémIA Pro",
      "Prompts hebdomadaires",
      "Forum communautaire",
      "Annonces & actualités IA",
    ],
    highlight: false,
    cta: "Rejoindre gratuitement",
    ctaStyle:
      "border border-[#c8a96e] text-[#c8a96e] hover:bg-[#c8a96e] hover:text-[#050508]",
  },
  {
    name: "Premium",
    badge: "⭐",
    price: "Inclus avec toute formation",
    features: [
      "Tout le niveau Gratuit",
      "Lives mensuels avatar IA expert",
      "Ressources membres exclusives",
      "Networking apprenants avancé",
      "Accès avant-première formations",
      "Réductions exclusives membres",
    ],
    highlight: true,
    cta: "Découvrir les formations",
    ctaStyle: "bg-[#c8a96e] text-[#050508] hover:bg-[#d4b97e]",
  },
  {
    name: "VIP",
    badge: "💎",
    price: "Inclus Pack Entrepreneur",
    features: [
      "Tout le niveau Premium",
      "Accès direct à Jacques",
      "Mastermind mensuel VIP",
      "Sessions stratégie personnalisées",
      "Canal VIP privé Discord",
      "Priorité sur toutes les nouveautés",
    ],
    highlight: false,
    cta: "Voir le Pack Entrepreneur",
    ctaStyle:
      "border border-[#f0c674] text-[#f0c674] hover:bg-[#f0c674] hover:text-[#050508]",
  },
];

const BENEFITS = [
  {
    icon: "💬",
    title: "Discord Privé",
    desc: "Accès au serveur Discord exclusif AcadémIA Pro avec des canaux thématiques et une communauté active 24h/24.",
  },
  {
    icon: "🎯",
    title: "Prompts Exclusifs",
    desc: "Chaque semaine, recevez des prompts avancés et testés pour booster votre productivité avec l'IA.",
  },
  {
    icon: "🎙️",
    title: "Lives Mensuels",
    desc: "Participez aux sessions live avec notre avatar IA expert pour apprendre les dernières techniques.",
  },
  {
    icon: "📚",
    title: "Ressources Premium",
    desc: "Bibliothèque de ressources exclusives : guides, templates, workflows et outils sélectionnés.",
  },
  {
    icon: "🤝",
    title: "Networking",
    desc: "Connectez-vous avec des centaines d'apprenants motivés et créez des opportunités professionnelles.",
  },
  {
    icon: "🚀",
    title: "Avant-Première",
    desc: "Soyez les premiers informés et accédez aux nouvelles formations avant leur sortie officielle.",
  },
];

// ============================================================
// ANIMATED COUNTER HOOK
// ============================================================
function useCounter(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// Avatar Component
function Avatar({
  initials,
  color,
  size = "md",
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ backgroundColor: `${color}20`, border: `1.5px solid ${color}40`, color }}
    >
      {initials}
    </div>
  );
}

// Badge Level
function LevelBadge({ level }: { level: "Gratuit" | "Premium" | "VIP" }) {
  const styles = {
    Gratuit: "bg-green-900/30 text-green-400 border-green-700/30",
    Premium: "bg-[#c8a96e]/10 text-[#c8a96e] border-[#c8a96e]/30",
    VIP: "bg-[#f0c674]/10 text-[#f0c674] border-[#f0c674]/30",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[level]}`}>
      {level}
    </span>
  );
}

// Live indicator
function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
    </span>
  );
}

// Stats Counter Card
function StatCard({
  value,
  label,
  suffix = "",
  isVisible,
}: {
  value: number;
  label: string;
  suffix?: string;
  isVisible: boolean;
}) {
  const count = useCounter(value, 2200, isVisible);
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-[#c8a96e] tabular-nums">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}

// Testimonial Card
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:border-[#c8a96e]/20 transition-colors duration-300">
      <div className="flex items-start gap-3">
        <Avatar initials={testimonial.initials} color={testimonial.color} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{testimonial.name}</div>
          <div className="text-xs text-gray-400">{testimonial.role}</div>
          <div className="flex items-center gap-2 mt-1">
            <LevelBadge level={testimonial.level} />
            <span className="text-xs text-gray-500">{testimonial.joined}</span>
          </div>
        </div>
      </div>
      <div className="text-gray-300 text-sm leading-relaxed border-t border-white/5 pt-4">
        <span className="text-[#c8a96e] text-xl leading-none mr-1">"</span>
        {testimonial.text}
        <span className="text-[#c8a96e] text-xl leading-none ml-1">"</span>
      </div>
    </div>
  );
}

// Discord Activity Item
function ActivityItem({ activity }: { activity: DiscordActivity }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <Avatar initials={activity.initials} color={activity.color} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: activity.color }}>
            {activity.user}
          </span>
          <span className="text-xs text-gray-500">{activity.time}</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">{activity.message}</p>
      </div>
    </div>
  );
}

// Community Level Card
function LevelCard({ level }: { level: CommunityLevel }) {
  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col gap-4 transition-transform duration-300 hover:-translate-y-1 ${
        level.highlight
          ? "bg-gradient-to-b from-[#1a1508] to-[#0d0d14] border border-[#c8a96e]/40 shadow-[0_0_40px_rgba(200,169,110,0.1)]"
          : "bg-[#0d0d14] border border-white/5 hover:border-white/10"
      }`}
    >
      {level.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c8a96e] text-[#050508] text-xs font-bold px-3 py-1 rounded-full">
          POPULAIRE
        </div>
      )}
      <div>
        <div className="text-2xl mb-2">{level.badge}</div>
        <h3 className="text-xl font-bold text-white">{level.name}</h3>
        <p
          className={`text-sm mt-1 font-medium ${
            level.highlight ? "text-[#c8a96e]" : "text-gray-400"
          }`}
        >
          {level.price}
        </p>
      </div>
      <ul className