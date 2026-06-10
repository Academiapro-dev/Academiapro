"use client";

import { useState } from "react";

const checkIcon = (
  <svg className="w-4 h-4 text-[#c8a96e] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const starIcon = (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

interface Plan {
  name: string;
  price: number;
  sessions: number;
  badge?: string;
  unitPrice: number;
  savings: number;
  features: string[];
}

const visioPlans: Plan[] = [
  {
    name: "Starter",
    price: 35,
    sessions: 1,
    unitPrice: 45,
    savings: 10,
    features: [
      "1 séance visio / mois",
      "Choix libre de spécialité",
      "Sans engagement",
      "Résiliation à tout moment",
      "Rollover séance non utilisée",
    ],
  },
  {
    name: "Bien-être",
    price: 79,
    sessions: 2,
    badge: "BEST-SELLER",
    unitPrice: 90,
    savings: 11,
    features: [
      "2 séances visio / mois",
      "Mixer 2 spécialités différentes",
      "Sans engagement",
      "Résiliation à tout moment",
      "Rollover séance non utilisée",
      "Suivi personnalisé inclus",
    ],
  },
  {
    name: "Intensif",
    price: 129,
    sessions: 4,
    unitPrice: 180,
    savings: 28,
    features: [
      "4 séances visio / mois",
      "Mixer jusqu'à 4 spécialités",
      "Sans engagement",
      "Résiliation à tout moment",
      "Rollover séance non utilisée",
      "Suivi personnalisé inclus",
      "Accès prioritaire agenda",
    ],
  },
];

const audioPlans: Plan[] = [
  {
    name: "Starter",
    price: 25,
    sessions: 1,
    unitPrice: 32,
    savings: 7,
    features: [
      "1 séance audio / mois",
      "Choix libre de spécialité",
      "Sans engagement",
      "Résiliation à tout moment",
      "Rollover séance non utilisée",
    ],
  },
  {
    name: "Bien-être",
    price: 55,
    sessions: 2,
    badge: "BEST-SELLER",
    unitPrice: 64,
    savings: 9,
    features: [
      "2 séances audio / mois",
      "Mixer 2 spécialités différentes",
      "Sans engagement",
      "Résiliation à tout moment",
      "Rollover séance non utilisée",
      "Suivi personnalisé inclus",
    ],
  },
  {
    name: "Intensif",
    price: 89,
    sessions: 4,
    unitPrice: 128,
    savings: 30,
    features: [
      "4 séances audio / mois",
      "Mixer jusqu'à 4 spécialités",
      "Sans engagement",
      "Résiliation à tout moment",
      "Rollover séance non utilisée",
      "Suivi personnalisé inclus",
      "Accès prioritaire agenda",
    ],
  },
];

const comparisonRows = [
  { label: "Qualité vidéo", visio: "HD 1080p", audio: "—" },
  { label: "Connexion requise", visio: "Bonne connexion", audio: "Simple appel" },
  { label: "Disponibilité mobile", visio: "✓", audio: "✓" },
  { label: "Enregistrement séance", visio: "Optionnel", audio: "Optionnel" },
  { label: "Partage d'écran", visio: "✓", audio: "—" },
  { label: "Intimité & discrétion", visio: "Élevée", audio: "Maximale" },
  { label: "Praticité", visio: "Standard", audio: "Partout" },
];

type Tab = "visio" | "audio";

export default function AbonnementsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("visio");
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const currentPlans = activeTab === "visio" ? visioPlans : audioPlans;

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#050508", color: "#e8e0d0" }}
    >
      {/* ── Noise texture overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

        {/* ── Header ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c8a96e]/30 bg-[#c8a96e]/5 text-[#c8a96e] text-xs font-semibold tracking-widest uppercase mb-6">
            {starIcon}
            <span>AcadémIA Pro</span>
            {starIcon}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
            <span className="text-white">Abonnements</span>{" "}
            <span style={{ color: "#c8a96e" }}>Séances</span>
          </h1>
          <p className="text-lg text-[#9a9080] max-w-2xl mx-auto leading-relaxed">
            Accompagnement régulier, flexibilité totale. Choisissez votre format,
            mixez les spécialités, gardez le contrôle.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              { icon: "🔄", label: "Sans engagement" },
              { icon: "📅", label: "Rollover garanti" },
              { icon: "🎯", label: "Multi-spécialités" },
              { icon: "✂️", label: "Résiliation facile" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 text-sm text-[#9a9080]"
              >
                <span className="text-base">{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Format Tabs ── */}
        <div className="flex justify-center mb-12">
          <div
            className="inline-flex rounded-xl p-1 border border-white/5"
            style={{ backgroundColor: "#0d0d12" }}
          >
            {(["visio", "audio"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-8 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 ${
                  activeTab === tab
                    ? "text-[#050508]"
                    : "text-[#9a9080] hover:text-[#c8a96e]"
                }`}
                style={
                  activeTab === tab
                    ? { backgroundColor: "#c8a96e" }
                    : {}
                }
              >
                <span className="flex items-center gap-2">
                  {tab === "visio" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.876v6.248a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  )}
                  Séances {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Pricing Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {currentPlans.map((plan, idx) => {
            const isBest = plan.badge === "BEST-SELLER";
            const isHovered = hoveredPlan === `${activeTab}-${plan.name}`;

            return (
              <div
                key={plan.name}
                onMouseEnter={() =>