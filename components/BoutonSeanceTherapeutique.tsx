import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = "upcoming" | "imminent" | "live" | "none";

interface TherapySession {
  id: string;
  therapistName: string;
  therapistAvatar: string;
  specialty: string;
  scheduledAt: Date;
  status: SessionStatus;
  meetingUrl?: string;
}

interface PastSession {
  id: string;
  therapistName: string;
  specialty: string;
  date: Date;
  duration: number;
  reportUrl: string;
  rating: number;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  isBestSeller?: boolean;
  isSubscription?: boolean;
  features: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "discovery",
    name: "Découverte",
    price: 29,
    duration: 30,
    description: "Première consultation",
    features: ["30 minutes", "1 séance", "Compte-rendu inclus"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 59,
    duration: 60,
    description: "Séance complète",
    features: ["60 minutes", "1 séance", "Compte-rendu détaillé", "Suivi 48h"],
  },
  {
    id: "expert",
    name: "Expert",
    price: 79,
    duration: 90,
    description: "Accompagnement approfondi",
    features: [
      "90 minutes",
      "1 séance",
      "Compte-rendu complet",
      "Suivi 7 jours",
      "Exercices personnalisés",
    ],
  },
  {
    id: "wellness",
    name: "Abonnement Bien-être",
    price: 79,
    duration: 60,
    description: "4 séances / mois",
    isBestSeller: true,
    isSubscription: true,
    features: [
      "4 × 60 minutes / mois",
      "Comptes-rendus inclus",
      "Suivi continu",
      "Exercices personnalisés",
      "Accès prioritaire",
      "Annulation flexible",
    ],
  },
];

const PAST_SESSIONS: PastSession[] = [
  {
    id: "ps1",
    therapistName: "Dr. Sophie Laurent",
    specialty: "Gestion du stress",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    duration: 60,
    reportUrl: "#rapport-1",
    rating: 5,
  },
  {
    id: "ps2",
    therapistName: "Dr. Marc Fontaine",
    specialty: "Développement personnel",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    duration: 45,
    reportUrl: "#rapport-2",
    rating: 4,
  },
  {
    id: "ps3",
    therapistName: "Dr. Claire Dubois",
    specialty: "Anxiété & Confiance",
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    duration: 60,
    reportUrl: "#rapport-3",
    rating: 5,
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function computeStatus(scheduledAt: Date): SessionStatus {
  const now = Date.now();
  const diff = scheduledAt.getTime() - now;
  if (diff < 0 && diff > -60 * 60 * 1000) return "live";
  if (diff >= 0 && diff <= 15 * 60 * 1000) return "imminent";
  if (diff > 15 * 60 * 1000) return "upcoming";
  return "none";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 14) return "Il y a 1 semaine";
  return `Il y a ${Math.floor(days / 7)} semaines`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${star <= rating ? "text-amber-400" : "text-slate-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ name, src, size = "md" }: { name: string; src?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-sm", lg: "w-16 h-16 text-base" };
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-700/60 to-amber-500/40 border border-amber-500/30 flex items-center justify-center font-semibold text-amber-200 flex-shrink-0`}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// ─── Session Card Variants ────────────────────────────────────────────────────

function LiveSessionCard({ session }: { session: TherapySession }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 to-slate-900/90 p-5">
      {/* Animated bg glow */}
      <div className="absolute inset-0 bg-emerald-500/5 animate-pulse rounded-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">
            Séance en cours
          </span>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <Avatar name={session.therapistName} size="lg" />
          <div>
            <p className="text-white font-semibold text-base">{session.therapistName}</p>
            <p className="text-slate-400 text-sm">{session.specialty}</p>
            <p className="text-emerald-400 text-xs mt-1">
              Démarrée à {formatTime(session.scheduledAt)}
            </p>
          </div>
        </div>

        <a
          href={session.meetingUrl || "#"}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-sm shadow-lg shadow-emerald-900/50 transition-all duration-200 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Rejoindre maintenant
        </a>
      </div>
    </div>
  );
}

function ImminentSessionCard({ session }: { session: TherapySession }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = session.scheduledAt.getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative overflow-hidden rounded-2xl