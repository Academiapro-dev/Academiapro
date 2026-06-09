```tsx
"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Calendar,
  Clock,
  Star,
  Download,
  Play,
  FileText,
  TrendingUp,
  Award,
  Flame,
  ChevronRight,
  Video,
  Phone,
  MessageSquare,
  X,
  Edit,
  RefreshCw,
  BookOpen,
  Activity,
  Sparkles,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Abonnement {
  id: string;
  formule: string;
  format: string;
  seances_restantes: number;
  seances_totales: number;
  date_renouvellement: string;
  statut: string;
  prix_mensuel: number;
}

interface Reservation {
  id: string;
  date_seance: string;
  heure_debut: string;
  heure_fin: string;
  specialite: string;
  format: string;
  statut: string;
  praticien_nom: string;
  praticien_avatar?: string;
  lien_visio?: string;
}

interface SessionSeance {
  id: string;
  date_seance: string;
  specialite: string;
  format: string;
  duree_minutes: number;
  note: number | null;
  compte_rendu_url: string | null;
  replay_url: string | null;
  praticien_nom: string;
  resume: string | null;
  exercices: string[] | null;
}

interface Stats {
  total_seances: number;
  specialites_favorites: { specialite: string; count: number }[];
  score_bien_etre: number;
  progression: number;
  streak: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockAbonnement: Abonnement = {
  id: "1",
  formule: "Essentiel",
  format: "Visioconférence",
  seances_restantes: 3,
  seances_totales: 4,
  date_renouvellement: "2025-02-15",
  statut: "actif",
  prix_mensuel: 89,
};

const mockReservations: Reservation[] = [
  {
    id: "1",
    date_seance: "2025-01-20",
    heure_debut: "14:00",
    heure_fin: "15:00",
    specialite: "Sophrologie",
    format: "Visio",
    statut: "confirmé",
    praticien_nom: "Dr. Marie Laurent",
    lien_visio: "https://meet.academia.pro/session/xyz",
  },
  {
    id: "2",
    date_seance: "2025-01-24",
    heure_debut: "10:30",
    heure_fin: "11:30",
    specialite: "Coaching Bien-être",
    format: "Téléphone",
    statut: "confirmé",
    praticien_nom: "Thomas Benoit",
  },
  {
    id: "3",
    date_seance: "2025-01-28",
    heure_debut: "16:00",
    heure_fin: "17:00",
    specialite: "Méditation guidée",
    format: "Visio",
    statut: "en_attente",
    praticien_nom: "Sophia Chen",
  },
];

const mockSessions: SessionSeance[] = [
  {
    id: "1",
    date_seance: "2025-01-08",
    specialite: "Sophrologie",
    format: "Visio",
    duree_minutes: 60,
    note: 5,
    compte_rendu_url: "/comptes-rendus/session-1.pdf",
    replay_url: "/replays/session-1",
    praticien_nom: "Dr. Marie Laurent",
    resume: "Session axée sur la gestion du stress au travail. Techniques de relaxation dynamique pratiquées.",
    exercices: ["Respiration abdominale 4-7-8", "Scan corporel du matin", "Visualisation positive"],
  },
  {
    id: "2",
    date_seance: "2025-01-02",
    specialite: "Coaching Bien-être",
    format: "Téléphone",
    duree_minutes: 45,
    note: 4,
    compte_rendu_url: "/comptes-rendus/session-2.pdf",
    replay_url: null,
    praticien_nom: "Thomas Benoit",
    resume: "Définition des objectifs de l'année. Plan d'action personnalisé établi.",
    exercices: ["Journal de gratitude", "Routine matinale", "Objectifs SMART hebdomadaires"],
  },
  {
    id: "3",
    date_seance: "2024-12-18",
    specialite: "Méditation guidée",
    format: "Visio",
    duree_minutes: 30,
    note: 5,
    compte_rendu_url: null,
    replay_url: "/replays/session-3",
    praticien_nom: "Sophia Chen",
    resume: "Introduction à la pleine conscience. Méditation Vipassana adaptée aux débutants.",
    exercices: ["Méditation 10 min/jour", "Body scan le soir", "Observation des pensées"],
  },
  {
    id: "4",
    date_seance: "2024-12-10",
    specialite: "Sophrologie",
    format: "Visio",
    duree_minutes: 60,
    note: 4,
    compte_rendu_url: "/comptes-rendus/session-4.pdf",
    replay_url: null,
    praticien_nom: "Dr. Marie Laurent",
    resume: "Travail sur la confiance en soi. Exercices de renforcement positif.",
    exercices: ["Affirmations positives", "Posture de puissance", "Ancrage émotionnel"],
  },
];

const mockStats: Stats = {
  total_seances: 12,
  specialites_favorites: [
    { specialite: "Sophrologie", count: 6 },
    { specialite: "Coaching", count: 4 },
    { specialite: "Méditation", count: 2 },
  ],
  score_bien_etre: 78,
  progression: 23,
  streak: 4,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatShortDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

const getFormatIcon = (format: string) => {
  if (format.toLowerCase().includes("visio")) return <Video className="w-3.5 h-3.5" />;
  if (format.toLowerCase().includes("téléphone") || format.toLowerCase().includes("phone"))
    return <Phone className="w-3.5 h-3.5" />;
  return <MessageSquare className="w-3.5 h-3.5" />;
};

const StarRating = ({ note }: { note: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-3.5 h-3.5 ${s <= note ? "fill-[#c8a96e] text-[#c8a96e]" : "text-white/20"}`}
      />
    ))}
  </div>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="flex items-start gap-3 mb-6">
    <div className="w-10 h-10 rounded-xl bg-[#c8a96e]/10 border border-[#c8a96e]/20 flex items-center justify-center text-[#c8a96e] flex-shrink-0">
      {icon}
    </div>
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white/[0.03] border border-white/[0.08] rounded-2xl backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

const GoldBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#c8a96e]/10 border border-[#c8a96e]/30 text-[#c8a96e] text-xs font-medium">
    {children}
  </span>
);

const StatusBadge = ({ statut }: { statut: string }) => {
  const config: Record<string, { label: string; color: string }> = {
    confirmé: { label: "Confirmé", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
    en_attente: { label: "En attente", color: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
    annulé: { label: "Annulé", color: "bg-red-500/10 border-red-500/30 text-red-400" },
    actif: { label: "Actif", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  };
  const c = config[statut] || config["en_attente"];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
};

// ─── Section 1 : Abonnement ───────────────────────────────────────────────────

const AbonnementSection = ({ abonnement }: { abonnement: Abonnement }) => {
  const pct = Math.round((abonnement.seances_restantes / abonnement.seances_totales) * 100);

  return (
    <section>
      <SectionTitle
        icon={<Award className="w-5 h-5" />}
        title="Mon abonnement actif"
        subtitle="Gérez votre formule et vos séances"
      />
      <GlassCard className="p-6">
        {/* Header */