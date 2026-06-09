```tsx
"use client";

import { useState } from "react";

// ============================================================
// TYPES
// ============================================================
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  avatar: string;
  status: "hot" | "warm" | "cold" | "client" | "lost";
  score: number;
  tags: string[];
  source: string;
  createdAt: string;
  lastContact: string;
  address: string;
  city: string;
  country: string;
  linkedin: string;
  website: string;
}

interface Formation {
  id: string;
  title: string;
  status: "enrolled" | "completed" | "dropped" | "interested";
  progress: number;
  startDate: string;
  endDate?: string;
  price: number;
  instructor: string;
}

interface Interaction {
  id: string;
  type: "call" | "email" | "meeting" | "demo" | "whatsapp" | "note";
  title: string;
  description: string;
  date: string;
  duration?: number;
  outcome: "positive" | "neutral" | "negative";
  agent: string;
}

interface Opportunity {
  id: string;
  title: string;
  stage: "discovery" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  value: number;
  probability: number;
  closeDate: string;
  formation: string;
}

interface Payment {
  id: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "refunded";
  date: string;
  method: string;
  formation: string;
  invoice: string;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  pinned: boolean;
}

// ============================================================
// MOCK DATA
// ============================================================
const mockContact: Contact = {
  id: "CTX-2024-001",
  firstName: "Sophie",
  lastName: "Marchand",
  email: "sophie.marchand@techcorp.fr",
  phone: "+33 6 12 34 56 78",
  company: "TechCorp Solutions",
  position: "Directrice Marketing",
  avatar: "SM",
  status: "hot",
  score: 87,
  tags: ["VIP", "Formation Pro", "Décideur"],
  source: "LinkedIn",
  createdAt: "2024-01-15",
  lastContact: "2024-12-28",
  address: "45 Avenue des Champs-Élysées",
  city: "Paris",
  country: "France",
  linkedin: "linkedin.com/in/sophiemarchand",
  website: "techcorp-solutions.fr",
};

const mockFormations: Formation[] = [
  {
    id: "F001",
    title: "IA & Machine Learning pour Managers",
    status: "enrolled",
    progress: 65,
    startDate: "2024-11-01",
    price: 2490,
    instructor: "Dr. Antoine Lebrun",
  },
  {
    id: "F002",
    title: "Data Analytics Avancé",
    status: "completed",
    progress: 100,
    startDate: "2024-06-01",
    endDate: "2024-08-30",
    price: 1890,
    instructor: "Marie Fontaine",
  },
  {
    id: "F003",
    title: "Leadership & Transformation Digitale",
    status: "interested",
    progress: 0,
    startDate: "2025-02-01",
    price: 3200,
    instructor: "Jean-Paul Moreau",
  },
];

const mockInteractions: Interaction[] = [
  {
    id: "I001",
    type: "call",
    title: "Appel découverte formation IA",
    description: "Discussion sur les besoins en formation IA pour son équipe de 15 personnes. Très intéressée par le programme sur mesure.",
    date: "2024-12-28",
    duration: 45,
    outcome: "positive",
    agent: "Marc Dupont",
  },
  {
    id: "I002",
    type: "email",
    title: "Envoi proposition commerciale",
    description: "Envoi du devis personnalisé pour le package Formation IA + Data Analytics pour 15 collaborateurs.",
    date: "2024-12-20",
    outcome: "neutral",
    agent: "Marc Dupont",
  },
  {
    id: "I003",
    type: "meeting",
    title: "Réunion présentation programme",
    description: "Présentation du catalogue complet. Sophie a demandé des références clients dans le secteur tech.",
    date: "2024-12-10",
    duration: 90,
    outcome: "positive",
    agent: "Lucie Bernard",
  },
  {
    id: "I004",
    type: "demo",
    title: "Démo plateforme e-learning",
    description: "Démonstration de la plateforme AcadémIA. Excellent retour sur l'interface et les fonctionnalités IA.",
    date: "2024-11-28",
    duration: 60,
    outcome: "positive",
    agent: "Marc Dupont",
  },
];

const mockOpportunities: Opportunity[] = [
  {
    id: "OPP001",
    title: "Formation IA Équipe 15 personnes",
    stage: "negotiation",
    value: 37500,
    probability: 75,
    closeDate: "2025-01-31",
    formation: "IA & Machine Learning pour Managers",
  },
  {
    id: "OPP002",
    title: "Certification Data Science - Batch 2025",
    stage: "proposal",
    value: 18900,
    probability: 45,
    closeDate: "2025-03-15",
    formation: "Data Analytics Avancé",
  },
];

const mockPayments: Payment[] = [
  {
    id: "PAY001",
    amount: 1890,
    status: "paid",
    date: "2024-06-01",
    method: "Virement bancaire",
    formation: "Data Analytics Avancé",
    invoice: "FAC-2024-0892",
  },
  {
    id: "PAY002",
    amount: 1245,
    status: "paid",
    date: "2024-11-01",
    method: "Carte bancaire",
    formation: "IA & Machine Learning - Acompte",
    invoice: "FAC-2024-1547",
  },
  {
    id: "PAY003",
    amount: 1245,
    status: "pending",
    date: "2025-01-15",
    method: "Virement bancaire",
    formation: "IA & Machine Learning - Solde",
    invoice: "FAC-2025-0023",
  },
];

const mockNotes: Note[] = [
  {
    id: "N001",
    content: "Sophie est décisionnaire principale. Son budget formation annuel est de ~80K€. Elle recherche des formations certifiantes reconnues. Privilégier contact en matinée (avant 10h). Très réactive sur WhatsApp.",
    createdAt: "2024-12-28",
    author: "Marc Dupont",
    pinned: true,
  },
  {
    id: "N002",
    content: "A mentionné un projet de transformation digitale pour Q1 2025. Potentiel élevé pour des formations sur mesure inter-entreprises. Relancer en janvier avec offre groupe.",
    createdAt: "2024-12-10",
    author: "Lucie Bernard",
    pinned: false,
  },
];

// ============================================================
// SUB-COMPONENTS
// ============================================================

const StatusBadge = ({ status }: { status: Contact["status"] }) => {
  const config = {
    hot: { label: "🔥 Chaud", bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
    warm: { label: "☀️ Tiède", bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
    cold: { label: "❄️ Froid", bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
    client: { label: "✅ Client", bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
    lost: { label: "✗ Perdu", bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

const ScoreRing = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#c8a96e" : score >= 40 ? "#f97316" : "#ef4444";

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#1a1a2e" strokeWidth="6" />
        <circle
          cx="32" cy="32" r="28" fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-bold text-white">{score}</span>
      </div>
    </div>
  );
};

const FormationStatusBadge = ({ status }: { status: Formation["status"] }) => {
  const config = {
    enrolled: { label: "En cours", bg: "bg-blue-500/20", text: "text-blue-400" },
    completed: { label: "Terminé", bg: "bg-emerald-500/20", text: "text-emerald-400" },
    dropped: { label: "Abandonné", bg: "bg-red-500/20", text: "text-red-400" },
    interested: { label: "Intéressé", bg: "bg-[#c8a96e]/20", text: "text-[#c8a96e]" },
  };
  const c = config[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
};

const InteractionIcon = ({ type }: { type: Interaction["type