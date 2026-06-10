```tsx
// app/page.tsx
"use client";

import { useState } from "react";

const testimonials = [
  {
    name: "Sophie Marchand",
    role: "Directrice RH",
    company: "Groupe Nexia",
    formation: "Management & Intelligence Émotionnelle",
    avatar: "SM",
    text: "Mon agent IA m'a aidée à préparer 3 entretiens difficiles à 23h. Disponible quand j'en avais besoin, avec mon contexte, mes objectifs. C'est une autre dimension de la formation.",
    stars: 5,
  },
  {
    name: "Karim Benali",
    role: "Entrepreneur",
    company: "Fondateur SaaSly",
    formation: "Growth Hacking & IA Appliquée",
    avatar: "KB",
    text: "J'ai suivi 4 formations en 2 mois. L'agent connaissait mes progrès, anticipait mes blocages. Les séances thérapeutiques sur la gestion du stress m'ont transformé.",
    stars: 5,
  },
  {
    name: "Isabelle Courtin",
    role: "Médecin généraliste",
    company: "Cabinet libéral",
    formation: "Gestion du Burn-out Professionnel",
    avatar: "IC",
    text: "Les séances audio de thérapie cognitive à 3h du matin pendant mes gardes. Sans jugement, avec une vraie profondeur. Je recommande à tous mes confrères épuisés.",
    stars: 5,
  },
];

const therapeuticSpecialties = [
  { icon: "🧠", name: "Thérapie Cognitive (TCC)" },
  { icon: "💆", name: "Gestion du Stress" },
  { icon: "🔥", name: "Burn-out Professionnel" },
  { icon: "😴", name: "Troubles du Sommeil" },
  { icon: "💪", name: "Confiance en Soi" },
  { icon: "❤️", name: "Relations & Communication" },
  { icon: "🎯", name: "Procrastination" },
  { icon: "😰", name: "Anxiété & Phobies" },
  { icon: "🌱", name: "Développement Personnel" },
  { icon: "⚖️", name: "Équilibre Vie Pro/Perso" },
  { icon: "🧘", name: "Pleine Conscience" },
  { icon: "💔", name: "Deuil & Transitions" },
  { icon: "🚀", name: "Performance Mentale" },
  { icon: "👨‍👩‍👧", name: "Parentalité & Famille" },
];

const comparisons = [
  {
    feature: "Agent IA personnel attitré",
    academia: true,
    udemy: false,
    coursera: false,
  },
  {
    feature: "Disponible à 3h du matin",
    academia: true,
    udemy: false,
    coursera: false,
  },
  {
    feature: "Mémorise votre historique",
    academia: true,
    udemy: false,
    coursera: false,
  },
  {
    feature: "Séances thérapeutiques",
    academia: true,
    udemy: false,
    coursera: false,
  },
  {
    feature: "Classes live avatar IA",
    academia: true,
    udemy: false,
    coursera: false,
  },
  {
    feature: "Certification reconnue",
    academia: true,
    udemy: true,
    coursera: true,
  },
  {
    feature: "Contenu vidéo",
    academia: true,
    udemy: true,
    coursera: true,
  },
  {
    feature: "Adaptation au niveau",
    academia: true,
    udemy: false,
    coursera: false,
  },
];

export default function HomePage() {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const [email, setEmail] = useState("");

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#050508", color: "#e8e0d0", fontFamily: "Georgia, serif" }}
    >
      {/* ─────────────────────────────────────────
          NAVBAR
      ───────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: "rgba(5, 5, 8, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xl font-bold tracking-wide"
            style={{ color: "#c8a96e" }}
          >
            Académ<span style={{ color: "#e8e0d0" }}>IA</span> Pro
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "#a09880" }}>
          <a href="#formations" className="hover:text-amber-400 transition-colors">Formations</a>
          <a href="#therapeutique" className="hover:text-amber-400 transition-colors">Thérapeutique</a>
          <a href="#tarifs" className="hover:text-amber-400 transition-colors">Tarifs</a>
          <a href="#temoignages" className="hover:text-amber-400 transition-colors">Témoignages</a>
        </div>
        <button
          className="hidden md:block px-5 py-2 text-sm font-medium rounded"
          style={{
            backgroundColor: "#c8a96e",
            color: "#050508",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d4b87e")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#c8a96e")}
        >
          Commencer gratuitement
        </button>
      </nav>

      {/* ─────────────────────────────────────────
          HERO
      ───────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,169,110,0.08) 0%, transparent 60%), #050508",
        }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(200,169,110,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Badge */}
        <div
          className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8"
          style={{
            border: "1px solid rgba(200,169,110,0.4)",
            backgroundColor: "rgba(200,169,110,0.06)",
            color: "#c8a96e",
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "#c8a96e" }}
          />
          Plateforme IA de nouvelle génération · Lancée en 2024
        </div>

        {/* Headline */}
        <h1
          className="relative text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 max-w-5xl"
          style={{ color: "#f0e8d8" }}
        >
          AcadémIA Pro{" "}
          <span
            className="block"
            style={{
              background: "linear-gradient(135deg, #c8a96e 0%, #e8c87e 50%, #c8a96e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            La Formation Professionnelle
          </span>
          100% Propulsée par l'IA
        </h1>

        {/* Subtitle */}
        <p
          className="relative text-lg md:text-xl max-w-2xl mb-4"
          style={{ color: "#a09880", lineHeight: "1.8" }}
        >
          127 formations · Agents IA disponibles 24h/24 · Séances thérapeutiques
          · Classes live avec avatar IA
        </p>
        <p
          className="relative text-sm mb-10"
          style={{ color: "#706858" }}
        >
          L'apprentissage qui s'adapte à vous — pas l'inverse.
        </p>

        {/* CTA Buttons */}
        <div className="relative flex flex-col sm:flex-row gap-4 mb-10">
          <button
            className="px-8 py-4 text-base font-semibold rounded-sm"
            style={{
              backgroundColor: "#c8a96e",
              color: "#050508",
              transition: "all 0.25s",
              boxShadow: "0 0 30px rgba(200,169,110,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#d4b87e";
              e.currentTarget.style.boxShadow = "0 0 45px rgba(200,169,110,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#c8a96e";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(200,169,110,0.25)";
            }}
          >
            Commencer gratuitement →
          </button>
          <button
            className="px-8 py-4 text-base font-medium rounded-sm"
            style={{
              border: "1px solid rgba(200,169,110,0.35)",
              color: "#c8a96e",
              backgroundColor: "transparent",
              transition: "all 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(200,169,110,0.06)";
              e.currentTarget.style.borderColor = "rgba(200,169,110,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "rgba(200,169,110,0.35)";
            }}
          >
            Voir le catalogue
          </button>
        </div>

        {/* Guarantee Badge */}
        <div
          className="relative inline-flex items-center gap-3 px-5 py-3 rounded"
          style={{
            border: "1px solid rgba(200,169,110,0