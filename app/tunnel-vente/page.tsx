```tsx
"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// TYPES
// ============================================================
interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
  result: string;
}

interface StepConfig {
  id: number;
  title: string;
  subtitle: string;
  price: number | null;
  originalPrice: number | null;
  urgencyHours: number;
  maxPlaces: number;
  currentPlaces: number;
  testimonials: Testimonial[];
}

// ============================================================
// DATA
// ============================================================
const STEPS_CONFIG: StepConfig[] = [
  {
    id: 1,
    title: "Accès Gratuit Immédiat",
    subtitle: "Votre kit de démarrage IA",
    price: null,
    originalPrice: null,
    urgencyHours: 0,
    maxPlaces: 500,
    currentPlaces: 487,
    testimonials: [
      {
        name: "Sophie M.",
        role: "Entrepreneur",
        text: "Le mini-cours m'a ouvert les yeux sur ce qui est possible avec l'IA.",
        avatar: "SM",
        result: "+3h/jour récupérées",
      },
      {
        name: "Thomas R.",
        role: "Freelance",
        text: "En 20 minutes, j'ai compris comment automatiser mes tâches répétitives.",
        avatar: "TR",
        result: "2x plus productif",
      },
    ],
  },
  {
    id: 2,
    title: "Starter Pack AcadémIA",
    subtitle: "Offre réservée aux membres actifs",
    price: 47,
    originalPrice: 197,
    urgencyHours: 48,
    maxPlaces: 50,
    currentPlaces: 43,
    testimonials: [
      {
        name: "Marie L.",
        role: "Coach Business",
        text: "Le Starter Pack m'a permis de créer mes 3 premiers automatismes en 2 jours.",
        avatar: "ML",
        result: "ROI en 48h",
      },
      {
        name: "Pierre D.",
        role: "Consultant",
        text: "47€ pour ce contenu ? Honnêtement, c'était sous-évalué.",
        avatar: "PD",
        result: "+€800/mois",
      },
    ],
  },
  {
    id: 3,
    title: "Formation Complète AcadémIA Pro",
    subtitle: "Maîtrise totale de l'IA en 8 semaines",
    price: 490,
    originalPrice: 990,
    urgencyHours: 24,
    maxPlaces: 20,
    currentPlaces: 17,
    testimonials: [
      {
        name: "Julien B.",
        role: "CEO Startup",
        text: "La formation complète a transformé ma façon de travailler. Mon équipe est 3x plus efficace.",
        avatar: "JB",
        result: "+€15k/mois",
      },
      {
        name: "Amandine K.",
        role: "Directrice Marketing",
        text: "Chaque module m'a apporté des résultats concrets et mesurables.",
        avatar: "AK",
        result: "Promu en 3 mois",
      },
    ],
  },
  {
    id: 4,
    title: "Pack Complet Premium",
    subtitle: "L'expérience AcadémIA ultime",
    price: 1490,
    originalPrice: 3990,
    urgencyHours: 24,
    maxPlaces: 10,
    currentPlaces: 8,
    testimonials: [
      {
        name: "Alexandre F.",
        role: "Investisseur",
        text: "Le Pack complet est le meilleur investissement que j'ai fait pour mon business cette année.",
        avatar: "AF",
        result: "+€50k en 6 mois",
      },
      {
        name: "Nathalie C.",
        role: "Fondatrice",
        text: "Les séances 1:1 incluses ont été décisives. Mon business a décollé.",
        avatar: "NC",
        result: "Scale x4",
      },
    ],
  },
];

// ============================================================
// UTILITY HOOKS
// ============================================================
function useCountdown(hours: number) {
  const getInitialTime = useCallback(() => {
    if (hours <= 0) return { h: 0, m: 0, s: 0 };
    const total = hours * 3600;
    return {
      h: Math.floor(total / 3600),
      m: Math.floor((total % 3600) / 60),
      s: total % 60,
    };
  }, [hours]);

  const [time, setTime] = useState(getInitialTime);

  useEffect(() => {
    if (hours <= 0) return;
    const interval = setInterval(() => {
      setTime((prev) => {
        const totalSecs = prev.h * 3600 + prev.m * 60 + prev.s - 1;
        if (totalSecs <= 0) return { h: 0, m: 0, s: 0 };
        return {
          h: Math.floor(totalSecs / 3600),
          m: Math.floor((totalSecs % 3600) / 60),
          s: totalSecs % 60,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hours]);

  return time;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// Gold separator
function GoldDivider() {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#c8a96e]" />
      <div className="w-2 h-2 rounded-full bg-[#c8a96e]" />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#c8a96e]" />
    </div>
  );
}

// Countdown timer
function CountdownTimer({ hours, label }: { hours: number; label: string }) {
  const { h, m, s } = useCountdown(hours);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-black/40 border border-[#c8a96e]/30 rounded-2xl p-5 mb-6">
      <p className="text-[#c8a96e] text-sm font-semibold uppercase tracking-widest text-center mb-3">
        ⚡ {label}
      </p>
      <div className="flex justify-center gap-3">
        {[
          { value: pad(h), unit: "Heures" },
          { value: pad(m), unit: "Minutes" },
          { value: pad(s), unit: "Secondes" },
        ].map(({ value, unit }) => (
          <div key={unit} className="flex flex-col items-center">
            <div className="bg-[#c8a96e]/10 border border-[#c8a96e]/40 rounded-xl px-4 py-3 min-w-[64px] text-center">
              <span className="text-3xl font-black text-[#c8a96e] tabular-nums">
                {value}
              </span>
            </div>
            <span className="text-xs text-gray-400 mt-1">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Places left indicator
function PlacesLeft({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const percent = (current / max) * 100;
  const left = max - current;
  return (
    <div className="mb-5">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-400">
          <span className="text-red-400 font-bold">{left} places</span>{" "}
          restantes
        </span>
        <span className="text-gray-400">{current}/{max} prises</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#c8a96e] to-[#e8c97e] rounded-full transition-all duration-1000"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// Price display
function PriceDisplay({
  price,
  originalPrice,
  deducted,
}: {
  price: number;
  originalPrice: number;
  deducted?: number;
}) {
  const savings = originalPrice - price;
  const finalPrice = deducted ? price - deducted : price;

  return (
    <div className="text-center mb-6">
      {deducted && (
        <p className="text-[#c8a96e] text-sm mb-1">
          🎁 -{deducted}€ déduits (votre achat précédent)
        </p>
      )}
      <div className="flex items-center justify-center gap-4">
        <span className="text-gray-500 line-through text-2xl">
          {originalPrice}€
        </span>
        <span className="text-5xl font-black text-white">{finalPrice}€</span>
      </div>
      <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1 mt-2">
        <span className="text-green-400 font-bold text-sm">
          💰 Vous économisez {savings + (deducted || 0)}€
        </span>
      </div>
    </div>
  );
}

// Testimonial card
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-[#c8a96e]/30 transition-all duration-300">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c8a96e] to-[#8b6914] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{testimonial.name}</p>
          <p className="text-gray-400 text-xs">{testimonial.role}</p>
        </div>
        <div className="ml-auto">
          <span className="bg-[#c8a96e]/10 border border-[#c8a96e]/30 text-[#c8a96e] text-xs px-2 py-1 rounded-full font-semibold">
            {testimonial.result}
          </span>
        </div>
      </div>
      <p className="text-gray-300 text-sm italic leading-relaxed">
        &ldquo;{testimonial.text}&rdquo;
      </p>
      <div className="flex mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-[#c8a96e] text-sm">
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

// Progress stepper
function ProgressStepper({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  const steps = ["Gratuit", "Starter", "Formation", "Pack Pro"];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <div key={stepNum} className="flex items-center">
            <button
              onClick={() => onStepClick(stepNum)}
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                  isActive
                    ? "bg-[#c8a96e] border-[#c8a96e] text-black scale-110 shadow-lg shadow-[#c8a96e]/30"
                    : isDone
                    ? "bg-[#c8a96e]/20 border-[#c8a96e] text-[#c8a96e]"
                    : "bg-transparent border-gray-600 text-gray-600 group-hover:border-gray-400"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span
                className={`text-xs mt-1 font-medium transition-colors ${
                  isActive
                    ? "text-[#c8a96e]"
                    : isDone
                    ? "text-[#c8a96e]/60"
                    : "text-gray-600"
                }`}
              >
                {label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-px mx-1 transition-all duration-500 ${
                  isDone ? "bg-[#c8a96e]" : "bg-gray-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// STEP COMPONENTS
// ============================================================

// STEP 1 — Lead Magnet
function Step1({
  config,
  onNext,
}: {
  config: StepConfig;
  onNext: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  const offers = [
    {
      id: "ebook",
      icon: "📘",
      title: "E-book exclusif",
      desc: "47 prompts IA qui remplacent un assistant",
      value: "Valeur 97€",
    },
    {
      id: "webinaire",
      icon: "🎯",
      title: "Webinaire en direct",
      desc: "Comment gagner 10h/semaine avec l'IA",
      value: "Valeur 197€",