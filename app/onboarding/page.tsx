```tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── Supabase Client ───────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OnboardingData {
  firstName: string;
  photoUrl: string | null;
  mainGoal: string;
  studyLevel: string;
  professionalStatus: string;
  activitySector: string;
  objectives: string[];
  weeklyTime: string;
  preferredSlots: string[];
  preferredFormat: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  format: string;
  tag: string;
  tagColor: string;
  icon: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 6;

const STUDY_LEVELS = [
  "Bac ou équivalent",
  "Bac+2 / BTS / DUT",
  "Bac+3 / Licence",
  "Bac+4 / Master 1",
  "Bac+5 / Master 2",
  "Doctorat",
  "Autodidacte",
];

const PRO_STATUS = [
  "Étudiant(e)",
  "Salarié(e)",
  "Freelance / Indépendant(e)",
  "Chef d'entreprise",
  "Demandeur d'emploi",
  "En reconversion",
];

const SECTORS = [
  "Tech & Digital",
  "Finance & Banque",
  "Santé & Médical",
  "Commerce & Vente",
  "Marketing & Communication",
  "Éducation",
  "Industrie & BTP",
  "Art & Créativité",
  "Autre",
];

const OBJECTIVES_LIST = [
  { id: "pro", label: "Développement professionnel", icon: "💼" },
  { id: "wellness", label: "Bien-être & Équilibre", icon: "🧘" },
  { id: "languages", label: "Langues étrangères", icon: "🌍" },
  { id: "reconversion", label: "Reconversion professionnelle", icon: "🔄" },
  { id: "leadership", label: "Leadership & Management", icon: "🎯" },
  { id: "other", label: "Autre", icon: "✨" },
];

const WEEKLY_TIMES = [
  { value: "1-3", label: "1 à 3h", sub: "Découverte légère" },
  { value: "4-7", label: "4 à 7h", sub: "Apprentissage régulier" },
  { value: "8-15", label: "8 à 15h", sub: "Formation intensive" },
  { value: "15+", label: "15h+", sub: "Immersion totale" },
];

const TIME_SLOTS = [
  "Matin (6h-12h)",
  "Après-midi (12h-18h)",
  "Soir (18h-23h)",
  "Week-end",
  "Flexible",
];

const FORMATS = [
  {
    id: "elearning",
    title: "E-Learning Autonome",
    icon: "📚",
    description:
      "Apprenez à votre rythme avec nos modules interactifs et vidéos HD.",
    features: ["Accès 24/7", "Quiz adaptatifs", "Certificats"],
    badge: "Populaire",
  },
  {
    id: "premium",
    title: "Premium avec Agent IA",
    icon: "🤖",
    description:
      "Un agent IA personnalisé vous guide et adapte chaque parcours.",
    features: ["Agent dédié", "Plan sur-mesure", "Suivi progressif"],
    badge: "Recommandé",
  },
  {
    id: "live",
    title: "Live avec Avatar",
    icon: "🎭",
    description:
      "Sessions live avec un avatar IA en temps réel pour une immersion maximale.",
    features: ["Sessions live", "Avatar interactif", "Coaching temps réel"],
    badge: "Premium",
  },
];

// ─── Recommendations Generator ─────────────────────────────────────────────────
function generateRecommendations(data: OnboardingData): Recommendation[] {
  const recs: Recommendation[] = [
    {
      id: "r1",
      title:
        data.objectives.includes("pro") || data.objectives.includes("reconversion")
          ? "Maîtrisez l'IA Générative en Entreprise"
          : data.objectives.includes("languages")
          ? "Anglais Professionnel Avancé"
          : "Communication & Leadership Moderne",
      description:
        "Formation certifiante adaptée à votre profil et vos objectifs déclarés.",
      duration:
        data.weeklyTime === "1-3" ? "6 semaines" : data.weeklyTime === "15+" ? "3 semaines" : "4 semaines",
      level: data.studyLevel.includes("Bac+5") ? "Expert" : "Intermédiaire",
      format: data.preferredFormat,
      tag: "🔥 Parfait pour vous",
      tagColor: "#c8a96e",
      icon: "🚀",
    },
    {
      id: "r2",
      title:
        data.objectives.includes("wellness")
          ? "Gestion du Stress & Pleine Conscience"
          : data.objectives.includes("leadership")
          ? "Management Agile & Leadership"
          : "Productivité & Organisation Personnelle",
      description:
        "Développez vos compétences transversales pour performer dans tous les domaines.",
      duration: "3 semaines",
      level: "Tous niveaux",
      format: "E-Learning Autonome",
      tag: "⭐ Très apprécié",
      tagColor: "#a78bfa",
      icon: "💡",
    },
    {
      id: "r3",
      title:
        data.activitySector === "Tech & Digital"
          ? "Data Science & Machine Learning"
          : data.activitySector === "Finance & Banque"
          ? "Analyse Financière & Excel Expert"
          : data.activitySector === "Marketing & Communication"
          ? "Growth Marketing & Analytics"
          : "Entrepreneuriat & Business Model Canvas",
      description: `Spécialement sélectionné pour votre secteur : ${data.activitySector || "votre domaine"}.`,
      duration: "5 semaines",
      level: "Avancé",
      format: data.preferredFormat,
      tag: "🎯 Sectoriel",
      tagColor: "#34d399",
      icon: "📊",
    },
  ];
  return recs;
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

// Progress Bar
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full px-6 pt-6 pb-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium tracking-widest uppercase text-[#c8a96e]">
          Étape {current} sur {total}
        </span>
        <span className="text-xs text-gray-500">
          {Math.round((current / total) * 100)}%
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1 flex-1 rounded-full overflow-hidden bg-white/10"
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  i < current
                    ? "linear-gradient(90deg, #c8a96e, #e8c98e)"
                    : "transparent",
              }}
              initial={{ width: 0 }}
              animate={{ width: i < current ? "100%" : "0%" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Selection Chip
function Chip({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
        selected
          ? "border-[#c8a96e] bg-[#c8a96e]/15 text-[#c8a96e]"
          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/25 hover:text-gray-200"
      }`}
    >
      {icon && <span>{icon}</span>}
      {label}
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-1 text-[#c8a96e]"
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
}

// Step wrapper animation variants
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OnboardingAcademIA() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    photoUrl: null,
    mainGoal: "",
    studyLevel: "",
    professionalStatus: "",
    activitySector: "",
    objectives: [],
    weeklyTime: "",
    preferredSlots: [],
    preferredFormat: "",
  });

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const recommendations =