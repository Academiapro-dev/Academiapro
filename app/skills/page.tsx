"use client";

import { useState } from "react";

interface Skill {
  id: string;
  title: string;
  category: "IA" | "Business" | "Bien-être";
  price: number;
  duration: string;
  week: string;
  result: string;
  badge?: "NOUVEAU" | "POPULAIRE" | "BEST-SELLER";
  icon: string;
}

const skills: Skill[] = [
  {
    id: "SK01",
    title: "Écrire avec Claude en 1 heure",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Produisez 10x plus de contenu de qualité en une fraction du temps.",
    badge: "BEST-SELLER",
    icon: "✍️",
  },
  {
    id: "SK02",
    title: "Automatiser ses emails avec IA",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Réduisez votre temps email de 2h à 20 minutes par jour.",
    badge: "POPULAIRE",
    icon: "📧",
  },
  {
    id: "SK03",
    title: "Créer des visuels IA avec Midjourney",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Générez des visuels professionnels sans designer en 5 minutes.",
    icon: "🎨",
  },
  {
    id: "SK04",
    title: "Analyser des données avec Claude",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Transformez n'importe quel tableau en insights actionnables en 10 min.",
    badge: "NOUVEAU",
    icon: "📊",
  },
  {
    id: "SK05",
    title: "Créer un chatbot en 24h",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Déployez un assistant IA sur votre site sans coder.",
    icon: "🤖",
  },
  {
    id: "SK06",
    title: "Rédiger des prompts parfaits",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Obtenez des réponses IA précises du premier coup, à chaque fois.",
    badge: "BEST-SELLER",
    icon: "💬",
  },
  {
    id: "SK07",
    title: "Automatiser avec Make.com",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Créez votre premier flux automatisé et économisez 5h par semaine.",
    icon: "⚙️",
  },
  {
    id: "SK08",
    title: "Créer une landing page avec IA",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Lancez une page de vente convertissante en moins d'une journée.",
    badge: "NOUVEAU",
    icon: "🚀",
  },
  {
    id: "SK09",
    title: "Générer du contenu LinkedIn avec IA",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Publiez 5 posts LinkedIn percutants par semaine en 30 minutes.",
    badge: "POPULAIRE",
    icon: "💼",
  },
  {
    id: "SK10",
    title: "Construire un agent IA simple",
    category: "IA",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Déployez votre premier agent IA autonome sans expérience technique.",
    icon: "🧠",
  },
  {
    id: "SK11",
    title: "Écrire une offre irrésistible",
    category: "Business",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Rédigez une offre que vos clients veulent acheter immédiatement.",
    badge: "BEST-SELLER",
    icon: "💎",
  },
  {
    id: "SK12",
    title: "Créer son pitch en 30 minutes",
    category: "Business",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Présentez votre projet avec clarté et conviction en toute situation.",
    icon: "🎯",
  },
  {
    id: "SK13",
    title: "Prospecter sur LinkedIn en 15min/jour",
    category: "Business",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Générez 5 nouveaux prospects qualifiés chaque semaine sans effort.",
    badge: "POPULAIRE",
    icon: "🔍",
  },
  {
    id: "SK14",
    title: "Négocier son salaire",
    category: "Business",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Obtenez l'augmentation que vous méritez dès votre prochaine conversation.",
    badge: "NOUVEAU",
    icon: "💰",
  },
  {
    id: "SK15",
    title: "Gérer son temps avec IA",
    category: "Business",
    price: 97,
    duration: "5h",
    week: "1 semaine",
    result: "Reprenez 2h par jour en pilotant votre agenda avec l'intelligence artificielle.",
    icon: "⏱️",
  },
  {
    id: "SK16",
    title: "Méditation 5 minutes par jour",
    category: "Bien-être",
    price: 47,
    duration: "3h",
    week: "3 jours",
    result: "Installez une pratique quotidienne qui transforme votre clarté mentale.",
    icon: "🧘",
  },
  {
    id: "SK17",
    title: "Gérer son stress au travail",
    category: "Bien-être",
    price: 47,
    duration: "3h",
    week: "3 jours",
    result: "Réduisez votre niveau de stress de 50% avec 3 techniques immédiates.",
    badge: "BEST-SELLER",
    icon: "🌿",
  },
  {
    id: "SK18",
    title: "Mieux dormir avec la sophrologie",
    category: "Bien-être",
    price: 47,
    duration: "3h",
    week: "3 jours",
    result: "Endormez-vous en moins de 10 minutes dès la première nuit.",
    badge: "POPULAIRE",
    icon: "🌙",
  },
  {
    id: "SK19",
    title: "Reprendre confiance en soi",
    category: "Bien-être",
    price: 47,
    duration: "3h",
    week: "3 jours",
    result: "Retrouvez l'élan et l'assurance pour avancer sur vos projets.",
    badge: "NOUVEAU",
    icon: "⭐",
  },
  {
    id: "SK20",
    title: "Énergie et vitalité au quotidien",
    category: "Bien-être",
    price: 47,
    duration: "3h",
    week: "3 jours",
    result: "Terminez chaque journée avec de l'énergie grâce à 3 routines simples.",
    icon: "⚡",
  },
];

const packs = [
  {
    id: "PACK-IA",
    title: "Pack IA Complète",
    description: "Les 10 skills IA pour maîtriser l'intelligence artificielle de A à Z",
    skills: ["SK01", "SK02", "SK03", "SK04", "SK05", "SK06", "SK07", "SK08", "SK09", "SK10"],
    originalPrice: 970,
    packPrice: 697,
    savings: 273,
    icon: "🧠",
    color: "from-blue-900/40 to-purple-900/40",
    borderColor: "border-blue-500/30",
  },
  {
    id: "PACK-BUSINESS",
    title: "Pack Business Elite",
    description: "Les 5 skills business pour booster votre carrière et vos revenus",
    skills: ["SK11", "SK12", "SK13", "SK14", "SK15"],
    originalPrice: 485,
    packPrice: 347,
    savings: 138,
    icon: "💼",
    color: "from-amber-900/40 to-orange-900/40",
    borderColor: "border-amber-500/30",
  },
  {
    id: "PACK-BIEN-ETRE",
    title: "Pack Bien-être Total",
    description: "Les 5 skills bien-être pour votre équilibre mental et physique",
    skills: ["SK16", "SK17", "SK18", "SK19", "SK20"],
    originalPrice: 235,
    packPrice: 167,
    savings: 68,
    icon: "🌿",
    color: "from-green-900/40 to-teal-900/40",
    borderColor: "border-green-500/30",
  },
  {
    id: "PACK-ULTIMATE",
    title: "Pack AcadémIA Ultimate",
    description: "Les 20 skills pour une transformation complète — IA · Business · Bien-être",
    skills: skills.map((s) => s.id),
    originalPrice: 1690,
    packPrice: 997,
    savings: 693,
    icon: "👑",
    color: "from-yellow-900/40 to-amber-900/40",
    borderColor: "border-yellow-400/40",
    featured: true,
  },
];

const badgeStyles: Record<string, string> = {
  "BEST-SELLER": "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
  POPULAIRE: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  NOUVEAU: "bg-green-500/20 text-green-300 border border-green-500/40",
};

const categoryColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  IA: {
    bg: "bg-violet-500/10",
    text: "text-violet-300",
    border: "border-violet-500/20",
    dot: "bg-violet-400",
  },
  Business: {
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  "Bien-être": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
};

type FilterType = "Tous" | "IA" | "Business" | "Bien-être";

export default function CatalogueSkills() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("Tous");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filteredSkills =
    activeFilter === "Tous" ? skills : skills.filter((s) => s.category === activeFilter);

  const filters: FilterType[] = ["Tous", "IA", "Business", "Bien-être"];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#050508", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ backgroundColor: "#c8a96e" }}
        />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-5 blur-3xl bg-violet-600" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-3 blur-3xl bg-blue-600" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6 border"
            style={{
              backgroundColor: "rgba(200, 169, 110, 0.08)",
              borderColor: "rgba(200, 169, 110, 0.25)",
              color: "#c8a96e",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#c8a96e" }}
            />
            Catalogue 2024
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">
            Skills{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #c8a96e 0%, #e8d5a3 50%, #c8a96e 100%)",
              }}
            >
              AcadémIA Pro
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            20 micro-formations ultra-pratiques. Une compétence acquise en quelques jours.{" "}
            <span style={{ color: "#c8a96e" }}>Des résultats dès la première semaine.</span>
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-8 mt-8">
            {[
              { value: "20", label: "Skills" },
              { value: "3", label: "Catégories" },
              { value: "97€", label: "À partir de" },
              { value: "4.9/5", label: "Note moyenne" },