```tsx
// components/ReservationAcademiaPro.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================
// TYPES
// ============================================================
interface Technique {
  id: string;
  name: string;
  icon: string;
  description: string;
  agent: Agent;
  color: string;
}

interface Agent {
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  sessions: number;
  bio: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  period: "morning" | "afternoon" | "evening" | "night";
}

interface Pack {
  id: string;
  name: string;
  price: number;
  sessions: number;
  features: string[];
  popular: boolean;
  color: string;
}

interface BookingState {
  technique: Technique | null;
  date: Date | null;
  timeSlot: string | null;
  pack: Pack | null;
  step: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  objectives: string;
  paymentMethod: "card" | "paypal" | null;
  notifications: { email: boolean; sms: boolean };
}

// ============================================================
// DATA
// ============================================================
const TECHNIQUES: Technique[] = [
  {
    id: "hypnose",
    name: "Hypnose",
    icon: "🌀",
    description: "Transformation profonde par états modifiés de conscience",
    color: "#9b59b6",
    agent: {
      name: "Agent Hypnos",
      avatar: "H",
      specialty: "Hypnothérapeute IA Certifié",
      rating: 4.9,
      sessions: 2847,
      bio: "Expert en hypnose ericksonienne et thérapeutique. Spécialisé dans les phobies, addictions et gestion du stress.",
    },
  },
  {
    id: "pnl",
    name: "PNL",
    icon: "🧠",
    description: "Programmation Neuro-Linguistique pour reprogrammer vos schémas",
    color: "#3498db",
    agent: {
      name: "Agent Nexus",
      avatar: "N",
      specialty: "Praticien PNL Master IA",
      rating: 4.8,
      sessions: 3124,
      bio: "Maître praticien PNL utilisant les dernières techniques de modélisation cognitive pour transformer vos comportements.",
    },
  },
  {
    id: "sophrologie",
    name: "Sophrologie",
    icon: "🌸",
    description: "Harmonie corps-esprit par la relaxation dynamique",
    color: "#e91e8c",
    agent: {
      name: "Agent Sophia",
      avatar: "S",
      specialty: "Sophrologue IA Niveau 3",
      rating: 4.9,
      sessions: 1956,
      bio: "Sophrologue certifiée spécialisée en gestion du stress, préparation mentale et accompagnement des transitions de vie.",
    },
  },
  {
    id: "meditation",
    name: "Méditation",
    icon: "🪷",
    description: "Pleine conscience et éveil intérieur guidés par IA",
    color: "#f39c12",
    agent: {
      name: "Agent Zen",
      avatar: "Z",
      specialty: "Guide Méditation IA",
      rating: 4.7,
      sessions: 4521,
      bio: "Guide expert en méditation Vipassana, Transcendantale et MBSR. Plus de 10 000 heures de pratique simulée.",
    },
  },
  {
    id: "yoga",
    name: "Yoga",
    icon: "🧘",
    description: "Pratique traditionnelle adaptée par intelligence artificielle",
    color: "#27ae60",
    agent: {
      name: "Agent Shakti",
      avatar: "Y",
      specialty: "Instructeur Yoga IA RYT-500",
      rating: 4.8,
      sessions: 2103,
      bio: "Instructeur certifié RYT-500 couvrant Hatha, Vinyasa, Yin et Kundalini. Adaptation personnalisée en temps réel.",
    },
  },
  {
    id: "reflexologie",
    name: "Réflexologie",
    icon: "👋",
    description: "Équilibre énergétique par les points réflexes virtuels",
    color: "#e74c3c",
    agent: {
      name: "Agent Reflexo",
      avatar: "R",
      specialty: "Réflexologue IA Certifié",
      rating: 4.6,
      sessions: 987,
      bio: "Expert en réflexologie plantaire, palmaire et auriculaire. Cartographie énergétique personnalisée avec IA.",
    },
  },
  {
    id: "aromatherapie",
    name: "Aromathérapie",
    icon: "🌿",
    description: "Protocoles olfactifs thérapeutiques personnalisés",
    color: "#16a085",
    agent: {
      name: "Agent Aroma",
      avatar: "A",
      specialty: "Aromathérapeute IA Expert",
      rating: 4.7,
      sessions: 1234,
      bio: "Aromathérapeute clinique avec base de données de 500+ huiles essentielles. Formulations sur mesure selon votre profil.",
    },
  },
  {
    id: "naturopathie",
    name: "Naturopathie",
    icon: "🌱",
    description: "Médecine naturelle holistique assistée par IA",
    color: "#8e44ad",
    agent: {
      name: "Agent Natura",
      avatar: "T",
      specialty: "Naturopathe IA ND",
      rating: 4.8,
      sessions: 1678,
      bio: "Naturopathe diplômé intégrant phytothérapie, oligothérapie et hygiène de vie. Approche préventive et curative.",
    },
  },
  {
    id: "nutrition",
    name: "Nutrition",
    icon: "🥗",
    description: "Plans nutritionnels IA basés sur votre génétique et biome",
    color: "#f1c40f",
    agent: {
      name: "Agent Nutri",
      avatar: "U",
      specialty: "Nutritionniste IA Clinique",
      rating: 4.9,
      sessions: 3456,
      bio: "Diététicien-nutritionniste IA analysant 200+ biomarqueurs pour des recommandations alimentaires ultra-personnalisées.",
    },
  },
  {
    id: "coaching",
    name: "Coaching",
    icon: "🎯",
    description: "Accompagnement performance et développement personnel",
    color: "#2c3e50",
    agent: {
      name: "Agent Coach",
      avatar: "C",
      specialty: "Life & Business Coach IA ICF",
      rating: 4.9,
      sessions: 5234,
      bio: "Coach certifié ICF PCC spécialisé leadership, entrepreneuriat et transformation personnelle. Méthodes éprouvées.",
    },
  },
  {
    id: "langues",
    name: "Langues",
    icon: "🗣️",
    description: "Immersion linguistique accélérée avec tuteur IA natif",
    color: "#1abc9c",
    agent: {
      name: "Agent Lingua",
      avatar: "L",
      specialty: "Polyglotte IA 47 Langues",
      rating: 4.8,
      sessions: 7891,
      bio: "Tuteur linguistique maîtrisant 47 langues avec accent natif. Méthode immersive adaptée à votre niveau et objectifs.",
    },
  },
  {
    id: "ia",
    name: "IA & Tech",
    icon: "🤖",
    description: "Maîtrisez l'IA : prompts, outils, automation et futur",
    color: "#c8a96e",
    agent: {
      name: "Agent Prometheus",
      avatar: "P",
      specialty: "Expert IA & Transformation Digitale",
      rating: 5.0,
      sessions: 4123,
      bio: "Expert en IA générative, LLMs, automatisation et stratégie digitale. Guide vers la maîtrise des outils IA actuels.",
    },
  },
];

const PACKS: Pack[] = [
  {
    id: "discovery",
    name: "Découverte",
    price: 29,
    sessions: 1,
    popular: false,
    color: "#718096",
    features: [
      "1 séance individuelle 45min",
      "Agent IA spécialisé dédié",
      "Rapport de session PDF",
      "Support email 24h",
      "Accès ressources de base",
    ],
  },
  {
    id: "transformation",
    name: "Transformation",
    price: 49,
    sessions: 3,
    popular: true,
    color: "#c8a96e",
    features: [
      "3 séances individuelles 60min",
      "Agent IA spécialisé dédié",
      "Plan personnalisé IA",
      "Rapports détaillés + suivi",
      "Support prioritaire 24/7",
      "Accès ressources premium",
      "Exercices inter-séances",
    ],
  },
  {
    id: "excellence",
    name: "Excellence",
    price: 79,
    sessions: 7,
    popular: false,
    color: "#9b59b6",
    features: [
      "7 séances individuelles 90min",
      "Multi-agents spécialisés",
      "Programme sur mesure IA",
      "Analytics comportementaux",
      "Support VIP dédié 24/7",
      "Toutes ressources illimitées",
      "Exercices quotidiens IA",
      "Accès communauté exclusive",
      "Certificat de progression",
    ],
  },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function generateCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  return days;
}

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const min = m.toString().pad