```tsx
"use client";

import { useState, useRef } from "react";

// ============================================================
// TYPES
// ============================================================
type Stage =
  | "Visiteur"
  | "Prospect"
  | "Lead"
  | "Négociation"
  | "Client"
  | "VIP";

interface Contact {
  id: string;
  name: string;
  email: string;
  avatar: string;
  stage: Stage;
  score: number; // 0-100
  formation: string;
  value: number; // €
  daysInStage: number;
  tags: string[];
  blocked: boolean;
  lastActivity: string;
  phone: string;
}

// ============================================================
// DONNÉES INITIALES
// ============================================================
const initialContacts: Contact[] = [
  {
    id: "1",
    name: "Sophie Martin",
    email: "sophie.martin@email.com",
    avatar: "SM",
    stage: "Visiteur",
    score: 15,
    formation: "MBA Finance",
    value: 0,
    daysInStage: 2,
    tags: ["Organique"],
    blocked: false,
    lastActivity: "Visite landing page",
    phone: "+33 6 12 34 56 78",
  },
  {
    id: "2",
    name: "Thomas Dubois",
    email: "thomas.dubois@email.com",
    avatar: "TD",
    stage: "Visiteur",
    score: 22,
    formation: "Marketing Digital",
    value: 0,
    daysInStage: 8,
    tags: ["SEA"],
    blocked: true,
    lastActivity: "Téléchargement guide",
    phone: "+33 6 98 76 54 32",
  },
  {
    id: "3",
    name: "Amélie Rousseau",
    email: "amelie.rousseau@email.com",
    avatar: "AR",
    stage: "Prospect",
    score: 38,
    formation: "Data Science",
    value: 2500,
    daysInStage: 5,
    tags: ["LinkedIn", "Chaud"],
    blocked: false,
    lastActivity: "Inscription webinar",
    phone: "+33 6 11 22 33 44",
  },
  {
    id: "4",
    name: "Lucas Bernard",
    email: "lucas.bernard@email.com",
    avatar: "LB",
    stage: "Prospect",
    score: 45,
    formation: "DevOps Cloud",
    value: 3200,
    daysInStage: 12,
    tags: ["Référencement"],
    blocked: true,
    lastActivity: "Demo demandée",
    phone: "+33 6 55 44 33 22",
  },
  {
    id: "5",
    name: "Emma Lefebvre",
    email: "emma.lefebvre@email.com",
    avatar: "EL",
    stage: "Lead",
    score: 62,
    formation: "Leadership RH",
    value: 4800,
    daysInStage: 3,
    tags: ["Chaud", "Urgent"],
    blocked: false,
    lastActivity: "Appel découverte",
    phone: "+33 6 77 88 99 00",
  },
  {
    id: "6",
    name: "Nicolas Moreau",
    email: "nicolas.moreau@email.com",
    avatar: "NM",
    stage: "Lead",
    score: 71,
    formation: "Finance Avancée",
    value: 6500,
    daysInStage: 7,
    tags: ["Premium"],
    blocked: false,
    lastActivity: "Envoi proposition",
    phone: "+33 6 33 44 55 66",
  },
  {
    id: "7",
    name: "Camille Petit",
    email: "camille.petit@email.com",
    avatar: "CP",
    stage: "Lead",
    score: 58,
    formation: "MBA Finance",
    value: 5200,
    daysInStage: 15,
    tags: ["Froid"],
    blocked: true,
    lastActivity: "Sans réponse",
    phone: "+33 6 22 11 00 99",
  },
  {
    id: "8",
    name: "Antoine Garnier",
    email: "antoine.garnier@email.com",
    avatar: "AG",
    stage: "Négociation",
    score: 83,
    formation: "Data Science",
    value: 8900,
    daysInStage: 4,
    tags: ["Chaud", "Décideur"],
    blocked: false,
    lastActivity: "Contre-proposition",
    phone: "+33 6 44 55 66 77",
  },
  {
    id: "9",
    name: "Julie Chevalier",
    email: "julie.chevalier@email.com",
    avatar: "JC",
    stage: "Négociation",
    score: 79,
    formation: "Marketing Digital",
    value: 7200,
    daysInStage: 9,
    tags: ["Entreprise"],
    blocked: false,
    lastActivity: "Relance devis",
    phone: "+33 6 66 77 88 99",
  },
  {
    id: "10",
    name: "Maxime Fontaine",
    email: "maxime.fontaine@email.com",
    avatar: "MF",
    stage: "Client",
    score: 91,
    formation: "Leadership RH",
    value: 12000,
    daysInStage: 30,
    tags: ["Fidèle"],
    blocked: false,
    lastActivity: "Module 3 terminé",
    phone: "+33 6 88 99 00 11",
  },
  {
    id: "11",
    name: "Sarah Lambert",
    email: "sarah.lambert@email.com",
    avatar: "SL",
    stage: "Client",
    score: 87,
    formation: "DevOps Cloud",
    value: 9500,
    daysInStage: 18,
    tags: ["Actif"],
    blocked: false,
    lastActivity: "Certification obtenue",
    phone: "+33 6 00 11 22 33",
  },
  {
    id: "12",
    name: "Pierre Mercier",
    email: "pierre.mercier@email.com",
    avatar: "PM",
    stage: "VIP",
    score: 98,
    formation: "MBA Finance",
    value: 28000,
    daysInStage: 90,
    tags: ["Ambassadeur", "Multi-formation"],
    blocked: false,
    lastActivity: "Parrainage x3",
    phone: "+33 6 99 88 77 66",
  },
  {
    id: "13",
    name: "Isabelle Dupont",
    email: "isabelle.dupont@email.com",
    avatar: "ID",
    stage: "VIP",
    score: 95,
    formation: "Finance Avancée",
    value: 35000,
    daysInStage: 120,
    tags: ["CEO", "Ambassadeur"],
    blocked: false,
    lastActivity: "Recommandation équipe",
    phone: "+33 6 11 99 88 77",
  },
];

const STAGES: Stage[] = [
  "Visiteur",
  "Prospect",
  "Lead",
  "Négociation",
  "Client",
  "VIP",
];

const STAGE_CONFIG: Record<
  Stage,
  { color: string; bgColor: string; borderColor: string; icon: string }
> = {
  Visiteur: {
    color: "text-gray-400",
    bgColor: "bg-gray-800/40",
    borderColor: "border-gray-700/50",
    icon: "👁️",
  },
  Prospect: {
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-800/40",
    icon: "🎯",
  },
  Lead: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/20",
    borderColor: "border-yellow-800/40",
    icon: "🔥",
  },
  Négociation: {
    color: "text-orange-400",
    bgColor: "bg-orange-900/20",
    borderColor: "border-orange-800/40",
    icon: "🤝",
  },
  Client: {
    color: "text-green-400",
    bgColor: "bg-green-900/20",
    borderColor: "border-green-800/40",
    icon: "✅",
  },
  VIP: {
    color: "text-amber-300",
    bgColor: "bg-amber-900/20",
    borderColor: "border-amber-600/40",
    icon: "⭐",
  },
};

const FORMATIONS = [
  "Toutes",
  "MBA Finance",
  "Marketing Digital",
  "Data Science",
  "DevOps Cloud",
  "Leadership RH",
  "Finance Avancée",
];

// ============================================================
// COMPOSANT SCORE BAR
// ============================================================
function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-500"
      : score >= 60
      ? "bg-yellow-500"
      : score >= 40
      ? "bg-orange-500"
      : "bg-red-500";
  return (
    <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-1">
      <div
        className={`${color} h-1.5 rounded-full transition-all duration-500`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

// ============================================================
// COMPOSANT CARD CONTACT
// ============================================================
function ContactCard({
  contact,
  onDragStart,
  onDelete,
  onToggleBlocked,
}: {
  contact: Contact;
  onDragStart: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleBlocked: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const valueFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(contact.value);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(contact.id);
      }}
      className={`group relative rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-all duration-200 select-none
        ${
          contact.blocked
            ? "border-red-800/60 bg-red-950/30"
            : "border-gray-700/40 bg-gray-800/50"
        }
        hover:border-[#c8a96e]/50 hover:bg-gray-800/80 hover:shadow-lg hover:shadow-[#c8a96e]/5
        active:scale-95 active:opacity-80`}
    >
      {/* Alerte bloqué