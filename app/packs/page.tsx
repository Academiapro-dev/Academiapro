"use client";

import { useState } from "react";

interface Pack {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  badge: string;
  badgeColor: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isRecommended?: boolean;
  theme: string;
  includes: string[];
  highlight?: string;
  description: string;
}

const packs: Pack[] = [
  {
    id: "starter",
    name: "STARTER PACK IA",
    price: 47,
    originalPrice: 47,
    badge: "OFFRE ENTRÉE",
    badgeColor: "from-slate-500 to-slate-600",
    theme: "decouverte",
    description: "Découvrez l'IA avec les essentiels pour commencer",
    includes: [
      "100 prompts Claude",
      "Guide PDF exclusif",
      "Module F128 (intro)",
      "Accès Discord communauté",
      "Garantie satisfait 30 jours",
    ],
    highlight: "Parfait pour débuter",
  },
  {
    id: "starter-complet",
    name: "PACK STARTER COMPLET",
    price: 97,
    originalPrice: 191,
    badge: "MEILLEUR DÉPART",
    badgeColor: "from-blue-600 to-blue-700",
    isNew: true,
    theme: "decouverte",
    description: "Le starter enrichi pour une vraie montée en compétences",
    includes: [
      "Tout le Starter Pack IA",
      "SK01 — Écrire avec Claude",
      "SK06 — Prompts parfaits",
      "SK07 — Make.com automatisation",
      "Garantie satisfait 30 jours",
    ],
    highlight: "3 Skills IA incluses",
  },
  {
    id: "skills-ia",
    name: "PACK SKILLS IA",
    price: 597,
    originalPrice: 970,
    badge: "PACK SKILLS",
    badgeColor: "from-violet-600 to-violet-700",
    isNew: true,
    theme: "skills",
    description: "Maîtrisez les 10 compétences IA essentielles du marché",
    includes: [
      "SK01 — Écrire avec Claude",
      "SK02 — Automatisation avancée",
      "SK03 — Data & Analyse IA",
      "SK04 — Création de contenu",
      "SK05 — SEO & IA",
      "SK06 — Prompts parfaits",
      "SK07 — Make.com",
      "SK08 — Workflows IA",
      "SK09 — IA & Productivité",
      "SK10 — IA Business",
      "Garantie satisfait 30 jours",
    ],
    highlight: "10 Skills complètes",
  },
  {
    id: "marketing",
    name: "PACK MARKETING DIGITAL × IA",
    price: 1490,
    originalPrice: 1980,
    badge: "RECOMMANDÉ",
    badgeColor: "from-emerald-600 to-emerald-700",
    isRecommended: true,
    theme: "marketing",
    description: "Dominez le marketing digital grâce à l'intelligence artificielle",
    includes: [
      "F10 — Marketing Digital",
      "F43 — Community Management",
      "F131 — Marketing Digital IA",
      "Accès Discord VIP",
      "Garantie satisfait 30 jours",
    ],
    highlight: "3 formations certifiantes",
  },
  {
    id: "ia-complet",
    name: "PACK IA COMPLET",
    price: 2690,
    originalPrice: 3360,
    badge: "BEST-SELLER",
    badgeColor: "from-amber-500 to-orange-600",
    isBestSeller: true,
    theme: "ia",
    description: "Le pack référence pour devenir expert en IA",
    includes: [
      "F128 — Expert Claude IA",
      "F129 — No-Code & IA",
      "F130 — Apps Natives IA",
      "F131 — Marketing Digital IA",
      "Support prioritaire",
      "Garantie satisfait 30 jours",
    ],
    highlight: "4 formations expertes",
  },
  {
    id: "ia-skills",
    name: "PACK IA + SKILLS",
    price: 2990,
    originalPrice: 4330,
    badge: "PACK ULTIME IA",
    badgeColor: "from-purple-600 to-pink-600",
    isNew: true,
    theme: "ia",
    description: "La combinaison ultime formations IA + toutes les skills",
    includes: [
      "F128 — Expert Claude IA",
      "F129 — No-Code & IA",
      "F130 — Apps Natives IA",
      "F131 — Marketing Digital IA",
      "SK01 à SK10 — Les 10 Skills IA",
      "Support prioritaire",
      "Garantie satisfait 30 jours",
    ],
    highlight: "4 formations + 10 skills",
  },
  {
    id: "entrepreneur",
    name: "PACK ENTREPRENEUR DIGITAL",
    price: 3490,
    originalPrice: 5530,
    badge: "PREMIUM",
    badgeColor: "from-rose-600 to-red-700",
    theme: "entrepreneur",
    description: "Lancez et développez votre business digital avec l'IA",
    includes: [
      "F38 — Entrepreneuriat Digital",
      "F125 — Création d'entreprise",
      "F127 — Stratégie Business",
      "F128 — Expert Claude IA",
      "F129 — No-Code & IA",
      "F130 — Apps Natives IA",
      "F131 — Marketing Digital IA",
      "Coaching de groupe mensuel",
      "Garantie satisfait 30 jours",
    ],
    highlight: "7 formations + coaching",
  },
  {
    id: "entrepreneur-elite",
    name: "PACK ENTREPRENEUR ELITE",
    price: 3990,
    originalPrice: 6500,
    badge: "VIP",
    badgeColor: "from-yellow-500 to-amber-600",
    theme: "entrepreneur",
    description: "L'offre la plus complète pour les entrepreneurs ambitieux",
    includes: [
      "F38 — Entrepreneuriat Digital",
      "F125 — Création d'entreprise",
      "F127 — Stratégie Business",
      "F128 — Expert Claude IA",
      "F129 — No-Code & IA",
      "F130 — Apps Natives IA",
      "F131 — Marketing Digital IA",
      "SK01 à SK15 — Les 15 Skills IA",
      "Coaching individuel 1h",
      "Accès VIP à vie",
      "Garantie satisfait 30 jours",
    ],
    highlight: "7 formations + 15 skills + coaching",
  },
];

const themes = [
  { id: "all", label: "Tous les packs" },
  { id: "decouverte", label: "Découverte" },
  { id: "skills", label: "Skills IA" },
  { id: "marketing", label: "Marketing" },
  { id: "ia", label: "IA Expert" },
  { id: "entrepreneur", label: "Entrepreneur" },
];

type SortType = "price-asc" | "price-desc" | "savings";

export default function PacksPage() {
  const [sortBy, setSortBy] = useState<SortType>("price-asc");
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);

  const getSavings = (pack: Pack) => pack.originalPrice - pack.price;
  const getSavingsPercent = (pack: Pack) =>
    Math.round(((pack.originalPrice - pack.price) / pack.originalPrice) * 100);

  const filteredPacks = packs
    .filter((p) => selectedTheme === "all" || p.theme === selectedTheme)
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "savings") return getSavings(b) - getSavings(a);
      return 0;
    });

  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const packsToCompare = packs.filter((p) =>
    selectedForCompare.includes(p.id)
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#050508", color: "#f0e6d3" }}
    >
      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, #c8a96e44, transparent)",
          }}
        />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, #c8a96e22 60px, #c8a96e22 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, #c8a96e22 60px, #c8a96e22 61px)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest mb-6 border"
            style={{
              borderColor: "#c8a96e44",
              backgroundColor: "#c8a96e11",
              color: "#c8a96e",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            ACADÉMIA PRO — OFFRES EXCLUSIVES
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
            <span style={{ color: "#f0e6d3" }}>Nos </span>
            <span
              style={{
                background: "linear-gradient(135deg, #c8a96e, #e8c98e, #a07840)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Packs Formations
            </span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-3" style={{ color: "#9b8a70" }}>
            8 packs conçus pour votre niveau et vos ambitions.
            De 47€ à 3 990€, trouvez votre accélérateur.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {[
              { icon: "🛡️", text: "Garantie 30 jours" },
              { icon: "💳", text: "3x sans frais dès 490€" },
              { icon: "🏆", text: "Certifications incluses" },
              { icon: "🤖", text: "IA de pointe" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#9b8a70" }}
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div
        className="border-y"
        style={{ borderColor: "#c8a96e22", backgroundColor: "#0a0a0f" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: "8", label: "Packs disponibles" },
            { value: "2 500+", label: "Apprenants formés" },
            { value: "jusqu'à −62%", label: "Économies réalisées" },
            { value: "4.9/5", label: "Satisfaction moyenne" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                className="text-2xl font-black"
                style={{ color: "#c8a96e" }}
              >
                {stat.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#5a4f3f" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTROLS ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Themes */}
          <div className="flex flex-wrap gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTheme(t.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={
                  selectedTheme === t.id
                    ? {
                        background:
                          "linear-gradient(135deg, #c8a96e, #a07840)",
                        color: "#050508",
                      }
                    : {
                        backgroundColor: "#0f0f18",
                        color: "#9b8a70",
                        border: "1px solid #c8a96e22",
                      }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Sort + Compare */}
          <div className="flex gap-3 items-center flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
              style={{
                backgroundColor: "#0f0f18",
                color: "#c8a96e",
                border: