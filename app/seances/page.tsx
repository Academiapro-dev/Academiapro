"use client";

import { useState } from "react";

type Mode = "visio" | "audio";

interface PricingItem {
  label: string;
  price: number;
  unit?: string;
  sessions?: string;
  badge?: string;
}

interface Specialty {
  name: string;
  icon: string;
  recommendation: "audio" | "visio" | "both";
}

const pricingData: Record<Mode, { individual: PricingItem[]; packs: PricingItem[]; subscriptions: PricingItem[] }> = {
  visio: {
    individual: [
      { label: "Découverte", price: 29 },
      { label: "Standard", price: 59 },
      { label: "Expert", price: 79 },
    ],
    packs: [
      { label: "Pack 5 séances", price: 249, sessions: "5 séances" },
      { label: "Pack 10 séances", price: 449, sessions: "10 séances" },
    ],
    subscriptions: [
      { label: "Starter", price: 35, unit: "mois", sessions: "1 séance / mois" },
      { label: "Bien-être", price: 79, unit: "mois", sessions: "2 séances / mois", badge: "BEST-SELLER" },
      { label: "Intensif", price: 129, unit: "mois", sessions: "4 séances / mois" },
    ],
  },
  audio: {
    individual: [
      { label: "Découverte", price: 19 },
      { label: "Standard", price: 39 },
      { label: "Expert", price: 55 },
    ],
    packs: [
      { label: "Pack 5 séances", price: 169, sessions: "5 séances" },
      { label: "Pack 10 séances", price: 299, sessions: "10 séances" },
    ],
    subscriptions: [
      { label: "Starter", price: 25, unit: "mois", sessions: "1 séance / mois" },
      { label: "Bien-être", price: 55, unit: "mois", sessions: "2 séances / mois", badge: "BEST-SELLER" },
      { label: "Intensif", price: 89, unit: "mois", sessions: "4 séances / mois" },
    ],
  },
};

const specialties: Specialty[] = [
  { name: "Hypnose", icon: "🌀", recommendation: "audio" },
  { name: "PNL", icon: "🧠", recommendation: "visio" },
  { name: "Sophrologie", icon: "🌿", recommendation: "audio" },
  { name: "Méditation", icon: "🧘", recommendation: "audio" },
  { name: "Yoga", icon: "🌸", recommendation: "both" },
  { name: "Réflexologie", icon: "👣", recommendation: "both" },
  { name: "Aromathérapie", icon: "🌺", recommendation: "audio" },
  { name: "Naturopathie", icon: "🍃", recommendation: "both" },
  { name: "Nutrition", icon: "🥗", recommendation: "both" },
  { name: "Coaching Personnel", icon: "⭐", recommendation: "visio" },
  { name: "Coaching Professionnel", icon: "💼", recommendation: "visio" },
  { name: "Intelligence Émotionnelle", icon: "❤️", recommendation: "visio" },
  { name: "Gestion Stress", icon: "🎯", recommendation: "both" },
  { name: "Langues", icon: "🌍", recommendation: "visio" },
];

const recommendationConfig = {
  audio: {
    label: "AUDIO RECOMMANDÉ",
    color: "text-blue-300",
    bg: "bg-blue-950/60",
    border: "border-blue-500/40",
    dot: "bg-blue-400",
    icon: "🎧",
  },
  visio: {
    label: "VISIO RECOMMANDÉ",
    color: "text-[#c8a96e]",
    bg: "bg-amber-950/60",
    border: "border-[#c8a96e]/40",
    dot: "bg-[#c8a96e]",
    icon: "🎥",
  },
  both: {
    label: "AUDIO & VISIO",
    color: "text-emerald-300",
    bg: "bg-emerald-950/60",
    border: "border-emerald-500/40",
    dot: "bg-emerald-400",
    icon: "✨",
  },
};

export default function SeancesTherapeutiques() {
  const [mode, setMode] = useState<Mode>("visio");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const pricing = pricingData[mode];

  const filteredSpecialties =
    selectedSpecialty === null
      ? specialties
      : specialties.filter((s) => s.name === selectedSpecialty);

  return (
    <main
      className="min-h-screen text-white"
      style={{ backgroundColor: "#050508" }}
    >
      {/* ─── Header ─── */}
      <header className="border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(5,5,8,0.92)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)" }}>
              <span className="text-lg">⚕</span>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight" style={{ color: "#c8a96e" }}>
                AcadémIA
              </span>
              <span className="font-light text-lg text-white/80"> Pro</span>
              <p className="text-xs text-white/40 leading-none mt-0.5">Séances Thérapeutiques IA</p>
            </div>
          </div>

          {/* Toggle principal */}
          <div
            className="flex rounded-xl p-1 gap-1 border border-white/10"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            role="group"
            aria-label="Choisir le format de séance"
          >
            <button
              onClick={() => setMode("visio")}
              aria-pressed={mode === "visio"}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                mode === "visio"
                  ? "text-[#050508] shadow-lg"
                  : "text-white/50 hover:text-white/80"
              }`}
              style={
                mode === "visio"
                  ? { background: "linear-gradient(135deg,#c8a96e,#a07840)" }
                  : {}
              }
            >
              <span className="text-base">🎥</span>
              <span>Visio</span>
              {mode === "visio" && (
                <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                  Avatar IA
                </span>
              )}
            </button>

            <button
              onClick={() => setMode("audio")}
              aria-pressed={mode === "audio"}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                mode === "audio"
                  ? "text-[#050508] shadow-lg"
                  : "text-white/50 hover:text-white/80"
              }`}
              style={
                mode === "audio"
                  ? { background: "linear-gradient(135deg,#c8a96e,#a07840)" }
                  : {}
              }
            >
              <span className="text-base">🎧</span>
              <span>Audio</span>
              {mode === "audio" && (
                <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                  Voix IA
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">

        {/* ─── Hero section ─── */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs text-white/50"
            style={{ backgroundColor: "rgba(200,169,110,0.06)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Disponible sans formation préalable · Accessible à tous
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Séances{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg,#c8a96e,#e8c98e,#a07840)" }}
            >
              Thérapeutiques
            </span>
            <br />
            <span className="text-white/60 text-3xl sm:text-4xl font-light">
              {mode === "visio" ? "avec Avatar IA · Format Visio" : "avec Voix IA · Format Audio"}
            </span>
          </h1>

          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            {mode === "visio"
              ? "Consultez votre thérapeute IA en face à face virtuel. Une présence visuelle apaisante pour un accompagnement profond et immersif."
              : "Laissez-vous guider par une voix IA chaleureuse et bienveillante. L'intimité sonore pour un travail intérieur authentique."}
          </p>

          {/* Mode badge */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border"
              style={{
                borderColor: "rgba(200,169,110,0.3)",
                backgroundColor: "rgba(200,169,110,0.06)",
              }}
            >
              <span className="text-2xl">{mode === "visio" ? "🎥" : "🎧"}</span>
              <div className="text-left">
                <p className="text-xs text-white/40 uppercase tracking-widest">Mode actif</p>