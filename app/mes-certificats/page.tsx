```tsx
"use client";

import { useState, useRef } from "react";
import {
  Award,
  Download,
  Share2,
  Link,
  Eye,
  Star,
  Trophy,
  Flame,
  ChevronRight,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Copy,
  X,
  ExternalLink,
  Zap,
  Medal,
  Target,
  BarChart3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Certificate {
  id: string;
  formation: string;
  category: string;
  date: string;
  mention: "Passable" | "Bien" | "Très Bien" | "Excellence";
  score: number;
  variant: "Gold" | "Silver" | "Platinum" | "Diamond";
  verifyUrl: string;
  instructor: string;
  duration: string;
  skills: string[];
}

interface OngoingFormation {
  id: string;
  title: string;
  category: string;
  progress: number;
  nextLesson: string;
  totalLessons: number;
  completedLessons: number;
  estimatedCompletion: string;
}

interface RecommendedFormation {
  id: string;
  title: string;
  category: string;
  duration: string;
  level: string;
  rating: number;
  students: number;
  reason: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const certificates: Certificate[] = [
  {
    id: "cert-001",
    formation: "Intelligence Artificielle Fondamentaux",
    category: "IA & Machine Learning",
    date: "15 mars 2024",
    mention: "Excellence",
    score: 97,
    variant: "Diamond",
    verifyUrl: "https://academia.pro/verify/cert-001-x9k2m",
    instructor: "Dr. Sophie Laurent",
    duration: "48h",
    skills: ["ML", "Neural Networks", "Python", "TensorFlow"],
  },
  {
    id: "cert-002",
    formation: "Prompt Engineering Avancé",
    category: "IA Générative",
    date: "28 janvier 2024",
    mention: "Très Bien",
    score: 91,
    variant: "Platinum",
    verifyUrl: "https://academia.pro/verify/cert-002-p4r7n",
    instructor: "Marc Dubois",
    duration: "24h",
    skills: ["ChatGPT", "Claude", "Prompt Design", "LLM"],
  },
  {
    id: "cert-003",
    formation: "Data Science avec Python",
    category: "Data Science",
    date: "10 novembre 2023",
    mention: "Bien",
    score: 84,
    variant: "Gold",
    verifyUrl: "https://academia.pro/verify/cert-003-d8f1q",
    instructor: "Isabelle Chen",
    duration: "60h",
    skills: ["Pandas", "NumPy", "Matplotlib", "Scikit-learn"],
  },
  {
    id: "cert-004",
    formation: "No-Code & Automatisation",
    category: "Productivité",
    date: "5 septembre 2023",
    mention: "Très Bien",
    score: 88,
    variant: "Gold",
    verifyUrl: "https://academia.pro/verify/cert-004-n2w5v",
    instructor: "Antoine Moreau",
    duration: "18h",
    skills: ["Zapier", "Make", "Notion", "Airtable"],
  },
  {
    id: "cert-005",
    formation: "Deep Learning & Vision",
    category: "IA & Machine Learning",
    date: "20 juin 2023",
    mention: "Bien",
    score: 82,
    variant: "Silver",
    verifyUrl: "https://academia.pro/verify/cert-005-v6l3e",
    instructor: "Dr. Sophie Laurent",
    duration: "72h",
    skills: ["CNN", "Computer Vision", "PyTorch", "OpenCV"],
  },
];

const ongoingFormations: OngoingFormation[] = [
  {
    id: "ong-001",
    title: "LLM Engineering & Fine-tuning",
    category: "IA Générative",
    progress: 67,
    nextLesson: "Fine-tuning avec LoRA",
    totalLessons: 42,
    completedLessons: 28,
    estimatedCompletion: "15 mai 2024",
  },
  {
    id: "ong-002",
    title: "MLOps & Déploiement IA",
    category: "DevOps IA",
    progress: 34,
    nextLesson: "Docker pour modèles ML",
    totalLessons: 38,
    completedLessons: 13,
    estimatedCompletion: "2 juin 2024",
  },
  {
    id: "ong-003",
    title: "NLP & Traitement du Langage",
    category: "IA & Machine Learning",
    progress: 12,
    nextLesson: "Tokenisation avancée",
    totalLessons: 55,
    completedLessons: 7,
    estimatedCompletion: "1 juillet 2024",
  },
];

const recommendedFormations: RecommendedFormation[] = [
  {
    id: "rec-001",
    title: "RAG & Vector Databases",
    category: "IA Générative",
    duration: "30h",
    level: "Avancé",
    rating: 4.9,
    students: 2847,
    reason: "Complète votre expertise LLM Engineering",
  },
  {
    id: "rec-002",
    title: "IA Agents & AutoGPT",
    category: "IA Générative",
    duration: "25h",
    level: "Expert",
    rating: 4.8,
    students: 1923,
    reason: "Prochaine étape vers certification Master",
  },
  {
    id: "rec-003",
    title: "Éthique & Gouvernance IA",
    category: "IA Responsable",
    duration: "15h",
    level: "Intermédiaire",
    rating: 4.7,
    students: 3156,
    reason: "Complète votre parcours Expert IA",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mentionColors: Record<Certificate["mention"], string> = {
  Passable: "text-gray-400 bg-gray-400/10 border-gray-400/30",
  Bien: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Très Bien": "text-purple-400 bg-purple-400/10 border-purple-400/30",
  Excellence: "text-[#c8a96e] bg-[#c8a96e]/10 border-[#c8a96e]/30",
};

const variantConfig: Record<
  Certificate["variant"],
  { gradient: string; glow: string; icon: string }
> = {
  Silver: {
    gradient: "from-slate-400 via-slate-300 to-slate-500",
    glow: "shadow-slate-400/20",
    icon: "🥈",
  },
  Gold: {
    gradient: "from-yellow-500 via-[#c8a96e] to-yellow-600",
    glow: "shadow-yellow-400/20",
    icon: "🥇",
  },
  Platinum: {
    gradient: "from-cyan-400 via-teal-300 to-cyan-500",
    glow: "shadow-cyan-400/20",
    icon: "💎",
  },
  Diamond: {
    gradient: "from-[#c8a96e] via-white to-[#c8a96e]",
    glow: "shadow-[#c8a96e]/30",
    icon: "✨",
  },
};

const badgeLevels = [
  { name: "Débutant", min: 0, max: 1, color: "text-gray-400", bg: "bg-gray-400/10", icon: "🌱" },
  { name: "Praticien", min: 2, max: 4, color: "text-blue-400", bg: "bg-blue-400/10", icon: "⚡" },
  { name: "Expert", min: 5, max: 8, color: "text-purple-400", bg: "bg-purple-400/10", icon: "🔥" },
  { name: "Master", min: 9, max: Infinity, color: "text-[#c8a96e]", bg: "bg-[#c8a96e]/10", icon: "👑" },
];

function getCurrentBadge(count: number) {
  return badgeLevels.find((b) => count >= b.min && count <= b.max) || badgeLevels[0];
}

function getNextBadge(count: number) {
  const idx = badgeLevels.findIndex((b) => count >= b.min && count <= b.max);
  return idx < badgeLevels.length - 1 ? badgeLevels[idx + 1] : null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-[#c8a96e]/30 bg-[#0d0d14] px-5 py-3 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 duration-300">
      <CheckCircle className="h-4 w-4 text-[#c8a96e]" />
      <span className="text-sm text-white">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-500 hover:text-white transition-colors">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function CertificatePreviewModal({
  cert,
  onClose,
}: {
  cert: Certificate;
  onClose: () => void;
}) {
  const vc = variantConfig[cert.variant];
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-[#c8a96e]/20 bg-[#0a0a0f] p-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Certificate Preview */}
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0d0d14] via-[#111118] to-[#0a0a0f] border border-white/5 p-10`}>
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 opacity-5">
            <div className={`absolute inset-0 bg-gradient-to-br ${vc.gradient}`} />
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#c8a96e]/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#c8a96e]/5 blur-3xl" />

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#c8a96e] to-yellow-600 flex items-center justify-center">
                  <Zap className="h-3 w-3 text-black" />
                </div>
                <span className="text-[#c8a96e] text-sm font-semibold tracking-widest uppercase">AcadémIA Pro</span>
              </div>
              <h2 className="text-gray-400 text-xs tracking-wider uppercase">Certificat de Réussite</h2>
            </div>
            <span className="text-3xl">{vc.icon}</span>
          </div>

          {/* Main content */}
          <div className="mb-8 text-center">
            <p className="text-gray-400 text-sm mb-2">Certifie que</p>
            <h1 className="text-2xl font-bold text-white mb-1">Alexandre Dupont</h1>
            <p className="text-gray-400 text-sm mb-6">a complété avec succès</p>
            <h2 className={`text-xl font-bold bg-gradient-to-r ${vc.gradient} bg-clip-text text-transparent mb-2`}>
              {cert.formation}
            </h2>
            <p className="text-gray-500 text-sm">{cert.category}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Score", value: `${cert.score}/100` },
              { label: "Mention", value: cert.mention },
              { label: "Durée", value: cert.duration },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-lg bg-white/5 py-3 px-2">
                <div className="text-white font-semibold text-sm">{s.value}</div>
                <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/5 pt-6">
            <div>
              <p className="text-gray-500 text-xs">Délivré par</p>
              <p className="text-white text-sm font-medium">{cert.instructor}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Date</p>
              <p className="text-white text-sm font-medium">{cert.date}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Variante</p>
              <p className={`text-sm font-bold bg-gradient-to-r ${vc.gradient} bg-clip-text text-transparent`}>
                {cert.variant}
              </p>
            </div>
          </div