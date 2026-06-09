```tsx
"use client";

import { useState } from "react";

const specialties = [
  {
    id: 1,
    name: "Hypnose",
    emoji: "🌀",
    avatar: "Dr. Hypnos IA",
    description: "Accédez à votre inconscient pour transformer vos schémas limitants et libérer votre potentiel caché.",
    benefits: ["Arrêt du tabac", "Gestion des phobies", "Confiance en soi", "Sommeil réparateur"],
    color: "from-purple-900/40 to-indigo-900/40",
    accent: "#9b72cf",
  },
  {
    id: 2,
    name: "PNL",
    emoji: "🧠",
    avatar: "Coach NLP IA",
    description: "Reprogrammez vos pensées et comportements grâce à la Programmation Neuro-Linguistique.",
    benefits: ["Communication efficace", "Objectifs clairs", "Dépassement de soi", "Relations harmonieuses"],
    color: "from-blue-900/40 to-cyan-900/40",
    accent: "#4a9eff",
  },
  {
    id: 3,
    name: "Sophrologie",
    emoji: "🌊",
    avatar: "Sophro IA",
    description: "Harmonisez corps et esprit par des techniques de relaxation dynamique et de visualisation positive.",
    benefits: ["Gestion du stress", "Préparation mentale", "Équilibre émotionnel", "Vitalité accrue"],
    color: "from-teal-900/40 to-emerald-900/40",
    accent: "#2dd4bf",
  },
  {
    id: 4,
    name: "Méditation",
    emoji: "🧘",
    avatar: "Zen Master IA",
    description: "Cultivez la pleine conscience et la sérénité intérieure à travers des pratiques méditatives guidées.",
    benefits: ["Paix intérieure", "Clarté mentale", "Réduction anxiété", "Présence au moment"],
    color: "from-amber-900/40 to-orange-900/40",
    accent: "#f59e0b",
  },
  {
    id: 5,
    name: "Yoga",
    emoji: "🌸",
    avatar: "Yogi IA",
    description: "Unifiez corps, souffle et esprit pour une santé globale et un équilibre de vie durable.",
    benefits: ["Flexibilité", "Force intérieure", "Équilibre corps-esprit", "Énergie vitale"],
    color: "from-rose-900/40 to-pink-900/40",
    accent: "#f472b6",
  },
  {
    id: 6,
    name: "Réflexologie",
    emoji: "👣",
    avatar: "Reflex IA",
    description: "Stimulez les zones réflexes pour rétablir l'équilibre énergétique et soutenir l'auto-guérison.",
    benefits: ["Détente profonde", "Circulation améliorée", "Organes stimulés", "Douleurs soulagées"],
    color: "from-lime-900/40 to-green-900/40",
    accent: "#84cc16",
  },
  {
    id: 7,
    name: "Aromathérapie",
    emoji: "🌿",
    avatar: "Aroma IA",
    description: "Exploitez le pouvoir thérapeutique des huiles essentielles pour votre bien-être physique et mental.",
    benefits: ["Immunité renforcée", "Humeur positive", "Sommeil amélioré", "Vitalité naturelle"],
    color: "from-green-900/40 to-teal-900/40",
    accent: "#34d399",
  },
  {
    id: 8,
    name: "Naturopathie",
    emoji: "🌱",
    avatar: "Natura IA",
    description: "Adoptez une approche holistique de la santé en harmonie avec les lois naturelles de votre corps.",
    benefits: ["Santé optimale", "Prévention maladies", "Équilibre naturel", "Longévité"],
    color: "from-emerald-900/40 to-cyan-900/40",
    accent: "#10b981",
  },
  {
    id: 9,
    name: "Nutrition",
    emoji: "🥗",
    avatar: "Nutri IA",
    description: "Transformez votre relation à l'alimentation avec des conseils personnalisés pour votre santé.",
    benefits: ["Poids idéal", "Énergie durable", "Microbiome sain", "Performances accrues"],
    color: "from-yellow-900/40 to-amber-900/40",
    accent: "#fbbf24",
  },
  {
    id: 10,
    name: "Coaching Personnel",
    emoji: "⚡",
    avatar: "Coach Pro IA",
    description: "Libérez votre plein potentiel et construisez la vie que vous méritez avec un coaching sur mesure.",
    benefits: ["Vision claire", "Actions concrètes", "Motivation durable", "Épanouissement"],
    color: "from-violet-900/40 to-purple-900/40",
    accent: "#8b5cf6",
  },
  {
    id: 11,
    name: "Coaching Professionnel",
    emoji: "💼",
    avatar: "Executive IA",
    description: "Développez votre leadership et atteignez vos objectifs professionnels avec excellence.",
    benefits: ["Leadership fort", "Carrière accélérée", "Équipe performante", "Succès durable"],
    color: "from-blue-900/40 to-indigo-900/40",
    accent: "#6366f1",
  },
  {
    id: 12,
    name: "Intelligence Émotionnelle",
    emoji: "💛",
    avatar: "EQ Master IA",
    description: "Développez votre intelligence émotionnelle pour des relations plus riches et une vie plus épanouie.",
    benefits: ["Empathie profonde", "Gestion émotions", "Relations harmonieuses", "Leadership émotionnel"],
    color: "from-orange-900/40 to-red-900/40",
    accent: "#fb923c",
  },
  {
    id: 13,
    name: "Gestion du Stress",
    emoji: "🎯",
    avatar: "Zen Coach IA",
    description: "Maîtrisez les techniques anti-stress les plus efficaces pour retrouver calme et sérénité durablement.",
    benefits: ["Calme instantané", "Résistance stress", "Sommeil profond", "Équilibre vie-travail"],
    color: "from-sky-900/40 to-blue-900/40",
    accent: "#38bdf8",
  },
  {
    id: 14,
    name: "Langues",
    emoji: "🌍",
    avatar: "Lingua IA",
    description: "Apprenez et maîtrisez de nouvelles langues grâce à des méthodes cognitives et immersives avancées.",
    benefits: ["Fluidité rapide", "Accent naturel", "Culture intégrée", "Confiance orale"],
    color: "from-fuchsia-900/40 to-violet-900/40",
    accent: "#e879f9",
  },
];

const pricingPlans = [
  {
    category: "Séances à l'unité",
    items: [
      { name: "Séance Découverte", price: 29, description: "Première fois", badge: "PREMIER ACCÈS", badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      { name: "Séance Standard", price: 59, description: "Tarif unitaire", badge: null, badgeColor: "" },
      { name: "Séance Expert", price: 79, description: "Techniques avancées", badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    ],
  },
  {
    category: "Packs",
    items: [
      { name: "Pack 5 Séances", price: 249, description: "Économie de 46€", badge: "−46€", badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      { name: "Pack 10 Séances", price: 449, description: "Économie de 141€", badge: "−141€", badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    ],
  },
  {
    category: "Abonnements mensuels",
    items: [
      { name: "Essentiel", price: 49, description: "1 séance / mois", badge: null, badgeColor: "", perMonth: true },
      { name: "Bien-être", price: 79, description: "2 séances / mois", badge: "BEST-SELLER", badgeColor: "bg-[#c8a96e]/20 text-[#c8a96e] border-[#c8a96e]/40", perMonth: true, highlight: true },
      { name: "Intensif", price: 129, description: "4 séances / mois", badge: "MAX", badgeColor: "bg-red-500/20 text-red-400 border-red-500/30", perMonth: true },
    ],
  },
];

const timeSlots = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00", "23:30",
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export default function SeancesTherapeutiques() {
  const [activeTab, setActiveTab] = useState<"specialties" | "pricing" | "booking">("specialties");
  const [selectedSpecialty, setSelectedSpecialty] = useState<typeof specialties[0] | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [showModal, set