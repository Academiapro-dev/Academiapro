```tsx
"use client";

import { useState } from "react";

const specialtyData = {
  name: "Mathématiques Avancées",
  subtitle: "Algèbre linéaire & Analyse",
  description:
    "Maîtrisez les fondamentaux et les concepts avancés des mathématiques avec notre IA spécialisée. Des sessions adaptatives qui s'ajustent en temps réel à votre niveau et vos objectifs.",
  avatar: "∑",
  level: "Intermédiaire → Expert",
  rating: 4.9,
  totalSessions: 1284,
  benefits: [
    {
      icon: "⚡",
      title: "Adaptation en temps réel",
      description:
        "L'IA analyse vos réponses et ajuste instantanément le niveau de difficulté pour maximiser votre progression.",
    },
    {
      icon: "🎯",
      title: "Objectifs personnalisés",
      description:
        "Définissez vos cibles (concours, diplômes, projets) et obtenez un parcours sur-mesure optimisé par IA.",
    },
    {
      icon: "📊",
      title: "Analytics de progression",
      description:
        "Visualisez vos points forts et lacunes avec des métriques précises et des recommandations ciblées.",
    },
    {
      icon: "🔄",
      title: "Répétition espacée",
      description:
        "Algorithme de mémorisation scientifiquement prouvé pour ancrer durablement les connaissances.",
    },
    {
      icon: "💡",
      title: "Explications multi-niveaux",
      description:
        "Chaque concept expliqué de 5 façons différentes jusqu'à ce que vous ayez le déclic.",
    },
    {
      icon: "📝",
      title: "Compte-rendu automatique",
      description:
        "Synthèse détaillée générée après chaque séance : points abordés, erreurs, recommandations.",
    },
  ],
  protocol: [
    {
      step: "01",
      title: "Diagnostic initial",
      description: "Évaluation de votre niveau actuel en 10 minutes",
    },
    {
      step: "02",
      title: "Plan de séance",
      description: "L'IA génère un programme adapté à vos objectifs du jour",
    },
    {
      step: "03",
      title: "Session interactive",
      description: "Exercices, explications et feedback en continu",
    },
    {
      step: "04",
      title: "Synthèse & rapport",
      description: "Compte-rendu automatique envoyé dans votre espace",
    },
  ],
  reviews: [
    {
      name: "Sophie M.",
      avatar: "S",
      rating: 5,
      role: "Étudiante en Classes Prépa",
      comment:
        "Incroyable. En 3 semaines j'ai rattrapé tout mon retard en algèbre linéaire. L'IA explique mieux que certains profs !",
      date: "Il y a 2 jours",
      sessions: 12,
    },
    {
      name: "Thomas K.",
      avatar: "T",
      rating: 5,
      role: "Ingénieur en reconversion",
      comment:
        "Les comptes-rendus automatiques sont une révolution. Je peux revoir exactement ce qu'on a fait et mes erreurs récurrentes.",
      date: "Il y a 1 semaine",
      sessions: 8,
    },
    {
      name: "Amina B.",
      avatar: "A",
      rating: 4,
      role: "Lycéenne Terminale",
      comment:
        "Super pour réviser le bac. Les explications multi-niveaux m'ont sauvée pour les intégrales. Vraiment efficace.",
      date: "Il y a 2 semaines",
      sessions: 15,
    },
    {
      name: "Marc D.",
      avatar: "M",
      rating: 5,
      role: "Doctorant",
      comment:
        "Utilise AcadémIA Pro pour me préparer aux oraux. La qualité des échanges est bluffante, vraiment niveau recherche.",
      date: "Il y a 3 semaines",
      sessions: 6,
    },
  ],
};

const pricingPlans = [
  {
    id: "decouverte",
    name: "Découverte",
    price: 29,
    duration: "45 min",
    description: "Parfait pour tester et explorer",
    features: [
      "Session de 45 minutes",
      "Diagnostic de niveau inclus",
      "Compte-rendu automatique",
      "Support chat 24h",
    ],
    color: "from-slate-700 to-slate-800",
    accent: "border-slate-500",
    badge: null,
  },
  {
    id: "standard",
    name: "Standard",
    price: 59,
    duration: "90 min",
    description: "L'équilibre parfait qualité-prix",
    features: [
      "Session de 90 minutes",
      "Plan de progression personnalisé",
      "Compte-rendu détaillé + exercices",
      "Accès aux ressources premium",
      "Support prioritaire",
    ],
    color: "from-yellow-900/40 to-amber-900/30",
    accent: "border-[#c8a96e]",
    badge: "Populaire",
  },
  {
    id: "expert",
    name: "Expert",
    price: 79,
    duration: "120 min",
    description: "Pour aller au maximum de votre potentiel",
    features: [
      "Session de 2 heures",
      "Préparation concours/examens",
      "Rapport d'analyse avancé",
      "Exercices personnalisés illimités",
      "Suivi inter-séances",
      "Accès tableau de bord analytics",
    ],
    color: "from-purple-900/30 to-indigo-900/30",
    accent: "border-purple-400",
    badge: "Premium",
  },
];

const subscriptionPlan = {
  name: "Abonnement Mensuel",
  price: 149,
  originalPrice: 236,
  sessions: "4 séances Standard",
  description: "Le choix des apprenants sérieux",
  features: [
    "4 séances Standard de 90 min",
    "Tableau de bord analytics complet",
    "Historique de progression illimité",
    "Tous les comptes-rendus archivés",
    "Accès communauté apprenants",
    "Support dédié 7j/7",
    "-37% vs tarif unitaire",
  ],
};

const availableSlots = [
  { date: "Aujourd'hui", day: "Lun", slots: ["14:00", "16:30", "19:00"] },
  { date: "Demain", day: "Mar", slots: ["09:00", "11:30", "14:00", "20:00"] },
  { date: "Mer 15", day: "Mer", slots: ["10:00", "15:00", "17:30"] },
  { date: "Jeu 16", day: "Jeu", slots: ["09:30", "13:00", "18:00", "21:00"] },
  { date: "Ven 17", day: "Ven", slots: ["11:00", "14:30", "16:00"] },
  { date: "Sam 18", day: "Sam", slots: ["10:00", "12:00"] },
];

export default function SpecialtySessionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("standard");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubscription, setIsSubscription] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);

  const handleBooking = async () => {
    if (!selectedSlot && !isSubscription) return;
    setIsBooking(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsBooking(false);
    setBookingConfirmed(true);
  };

  const currentPlan = pricingPlans.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c8a96e]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c8a96e]/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-white/5 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#c8a96e] to-amber-600 rounded-lg flex items-center justify-center text-black font-bold text-sm">
                A
              </div>
              <span className="text-[#c8a96e] font-semibold tracking-wide">
                AcadémIA Pro
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-white/50 hover:text-white/80 text-sm transition-colors">
                ← Retour aux spécialités
              </button>
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm">
                U
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Header */}
        <header className="px-6 py-12 border-b border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Avatar IA */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#c8a96e]/20 to-amber-600/10 border border-[#c8a96e]/30 flex items-center justify-center text-5xl">
                  {specialtyData.avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-2 border-[#050508] flex items-center justify-center">
                  