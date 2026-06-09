```tsx
"use client";

import { useState } from "react";
import {
  Video,
  Headphones,
  Star,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Eye,
  EyeOff,
  Mic,
  Brain,
  Zap,
  Moon,
  Shield,
  Play,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Format = "visio" | "audio";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  popular?: boolean;
}

interface Review {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  format: Format;
  date: string;
  comment: string;
  specialty: string;
}

interface Tarif {
  label: string;
  duration: string;
  price: { visio: number; audio: number };
  features: string[];
  recommended?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TARIFS: Tarif[] = [
  {
    label: "Découverte",
    duration: "30 min",
    price: { visio: 29, audio: 19 },
    features: [
      "1 thème ciblé",
      "Compte-rendu PDF",
      "Accès replay 7 jours",
    ],
  },
  {
    label: "Essentiel",
    duration: "60 min",
    price: { visio: 49, audio: 34 },
    features: [
      "3 thèmes approfondis",
      "Compte-rendu détaillé",
      "Exercices personnalisés",
      "Accès replay 30 jours",
    ],
    recommended: true,
  },
  {
    label: "Immersion",
    duration: "90 min",
    price: { visio: 79, audio: 55 },
    features: [
      "Séance complète sans limite",
      "Compte-rendu enrichi + mindmap",
      "Plan d'action personnalisé",
      "Accès replay illimité",
      "Suivi 30 jours inclus",
    ],
  },
];

const TIME_SLOTS: TimeSlot[] = [
  { id: "1", time: "00:00", available: true },
  { id: "2", time: "01:00", available: true },
  { id: "3", time: "02:00", available: false },
  { id: "4", time: "03:00", available: true },
  { id: "5", time: "06:00", available: true, popular: false },
  { id: "6", time: "07:00", available: true },
  { id: "7", time: "08:00", available: false },
  { id: "8", time: "09:00", available: true, popular: true },
  { id: "9", time: "10:00", available: true, popular: true },
  { id: "10", time: "11:00", available: true },
  { id: "11", time: "12:00", available: false },
  { id: "12", time: "14:00", available: true, popular: true },
  { id: "13", time: "15:00", available: true },
  { id: "14", time: "16:00", available: false },
  { id: "15", time: "17:00", available: true, popular: true },
  { id: "16", time: "18:00", available: true },
  { id: "17", time: "19:00", available: true, popular: true },
  { id: "18", time: "20:00", available: true },
  { id: "19", time: "21:00", available: true },
  { id: "20", time: "22:00", available: false },
  { id: "21", time: "23:00", available: true },
];

const REVIEWS: Review[] = [
  {
    id: "1",
    name: "Marie L.",
    avatar: "ML",
    rating: 5,
    format: "audio",
    date: "12 jan 2025",
    comment:
      "Incroyable ! Les yeux fermés, je retenais tout. La voix de l'IA et l'absence d'écran ont tout changé pour moi. Je dors mieux et j'ai tout mémorisé.",
    specialty: "Méditation & Pleine conscience",
  },
  {
    id: "2",
    name: "Thomas R.",
    avatar: "TR",
    rating: 5,
    format: "audio",
    date: "8 jan 2025",
    comment:
      "J'étais sceptique mais la séance audio en mode nuit (23h) a été la meilleure expérience d'apprentissage de ma vie. Zéro distraction.",
    specialty: "Philosophie stoïcienne",
  },
  {
    id: "3",
    name: "Sophie M.",
    avatar: "SM",
    rating: 5,
    format: "visio",
    date: "15 jan 2025",
    comment:
      "La visio avec les schémas partagés en temps réel est parfaite pour les maths. L'IA adapte son tableau blanc à mon niveau instantanément.",
    specialty: "Mathématiques avancées",
  },
  {
    id: "4",
    name: "Lucas D.",
    avatar: "LD",
    rating: 4,
    format: "visio",
    date: "10 jan 2025",
    comment:
      "Format visio top pour le code. L'IA partage l'écran, corrige mon code en direct. Compte-rendu reçu en 2 min après la séance.",
    specialty: "Programmation Python",
  },
  {
    id: "5",
    name: "Camille B.",
    avatar: "CB",
    rating: 5,
    format: "audio",
    date: "5 jan 2025",
    comment:
      "Je faisais ma séance en marchant dans le parc. Format audio parfait pour la philosophie. On est dans les idées, pas dans les slides.",
    specialty: "Philosophie stoïcienne",
  },
  {
    id: "6",
    name: "Antoine P.",
    avatar: "AP",
    rating: 5,
    format: "audio",
    date: "3 jan 2025",
    comment:
      "Le mode audio nocturne a quelque chose de magique. On apprend comme on écoute un podcast intime. Mémoire décuplée, je confirme.",
    specialty: "Histoire ancienne",
  },
];

const CALENDAR_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoldBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        background: "linear-gradient(135deg, #c8a96e22, #c8a96e44)",
        border: "1px solid #c8a96e55",
        color: "#c8a96e",
      }}
    >
      {children}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < rating ? "#c8a96e" : "transparent"}
          stroke={i < rating ? "#c8a96e" : "#555"}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SeanceSpecialitePage() {
  const today = new Date();
  const [format, setFormat] = useState<Format>("audio");
  const [selectedTarif, setSelectedTarif] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [filterFormat, setFilterFormat] = useState<Format | "all">("all");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handleFormatChange = (newFormat: Format) => {
    if (newFormat === format) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setFormat(newFormat);
      setIsTransitioning(false);
    }, 200);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const currentTarif = TARIFS[selectedTarif];
  const filteredReviews =
    filterFormat === "all"
      ? REVIEWS
      : REVIEWS.filter((r) => r.format === filterFormat);

  const canReserve = selectedDate !== null && selectedSlot !== null;

  const audioRecommendedReasons = [
    {
      icon: <Moon size={18} style={{ color: "#c8a96e" }} />,
      title: "Apprentissage nocturne optimisé",
      desc: "Le cerveau consolide mieux en état de relaxation. Sans écran, vous atteignez un état alpha propice à la mémorisation.",
    },
    {
      icon: <Brain size={18} style={{ color: "#c8a96e" }} />,
      title: "Mémoire auditive renforcée",
      desc: "Les concepts abstraits (philosophie, histoire, méditation) s'ancrent 40