```tsx
"use client";

import { useState } from "react";

const days = [
  {
    number: "01",
    label: "JOUR 1",
    title: "Ton premier prompt parfait",
    description: "Apprends la structure d'un prompt qui donne des résultats",
    exercise: "Exercice pratique : rédige un email professionnel avec Claude",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.001 3.001 0 01-2.02 2.02l-.347.347a5 5 0 01-7.072 0l.347-.347a3.001 3.001 0 012.02-2.02l.347-.347z" />
      </svg>
    ),
  },
  {
    number: "02",
    label: "JOUR 2",
    title: "Automatise ta première tâche",
    description: "Identifie les 3 tâches à automatiser en priorité",
    exercise: "Exercice pratique : crée ton premier workflow automatique",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    number: "03",
    label: "JOUR 3",
    title: "Construis ton premier agent IA",
    description: "Agent simple qui répond à tes emails automatiquement",
    exercise: "Exercice pratique : agent opérationnel en 30 minutes",
    highlight: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
      </svg>
    ),
  },
];

const professions = [
  "Entrepreneur / Freelance",
  "Manager / Directeur",
  "Commercial / Marketing",
  "Consultant",
  "Développeur",
  "RH / Formation",
  "Créateur de contenu",
  "Autre",
];

export default function MiniCoursPage() {
  const [form, setForm] = useState({ prenom: "", email: "", metier: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.prenom.trim()) newErrors.prenom = "Ton prénom est requis";
    if (!form.email.trim()) newErrors.email = "Ton email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Email invalide";
    if (!form.metier) newErrors.metier = "Sélectionne ton métier";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#050508", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px]"
          style={{ backgroundColor: "#c8a96e" }}
        />
        <div
          className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[100px]"
          style={{ backgroundColor: "#c8a96e" }}
        />
        <div
          className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full opacity-[0.04] blur-[80px]"
          style={{ backgroundColor: "#8b5cf6" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

        {/* ── HEADER ── */}
        <div className="text-center mb-16 sm:mb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold tracking-widest uppercase"
              style={{
                borderColor: "rgba(200,169,110,0.3)",
                backgroundColor: "rgba(200,169,110,0.06)",
                color: "#c8a96e",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              AcadémIA Pro · Mini-Cours Gratuit
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{ color: "#f5f0e8" }}
          >
            Maîtrise Claude en{" "}
            <span
              className="relative inline-block"
              style={{ color: "#c8a96e" }}
            >
              3 jours
              <span
                className="absolute -bottom-1 left-0 right-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #c8a96e, transparent)",
                }}
              />
            </span>
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl">
              15 minutes par jour
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg sm:text-xl max-w-xl mx-auto mb-10"
            style={{ color: "rgba(245,240,232,0.55)" }}
          >
            Sans compétences techniques · résultats immédiats
          </p>

          {/* Social proof chips */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-full"
              style={{
                backgroundColor: "rgba(200,169,110,0.08)",
                border: "1px solid rgba(200,169,110,0.2)",
              }}
            >
              <svg
                className="w-4 h-4"
                style={{ color: "#c8a96e" }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span
                className="text-sm font-semibold"
                style={{ color: "#f5f0e8" }}
              >
                2 384 personnes inscrites
              </span>
            </div>

            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-full"
              style={{
                backgroundColor: "rgba(200,169,110,0.08)",
                border: "1px solid rgba(200,169,110,0.2)",
              }}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-3.5 h-3.5"
                    style={{ color: "#c8a96e" }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: "#f5f0e8" }}
              >
                Note 4.9 / 5
              </span>
            </div>
          </div>
        </div>

        {/* ── SEPARATOR ── */}
        <div
          className="w-full h-px mb-16"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(200,169,110,0.3), transparent)",
          }}
        />

        {/* ── PROGRAMME 3 JOURS ── */}
        <div className="mb-16 sm:mb-20">
          <p
            className="text-center text-xs font-bold tracking-widest uppercase mb-10"
            style={{ color: "rgba(200,169,110,0.6)" }}
          >
            Le programme jour par jour
          </p>

          <div className="space-y-4">
            {days.map((day, index) => (
              <div
                key={index}
                className="relative group rounded-2xl p-6 sm:p-8 transition-all duration-300"
                style={{
                  backgroundColor: day.highlight
                    ? "rgba(200,169,110,0.07)"
                    : "rgba(255,255,255,0.02)",
                  border: day.highlight
                    ? "1px solid rgba(200,169,110,0.35)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {day.highlight && (
                  <div
                    className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
                    style={{
                      backgroundColor: "rgba(200,169,110,0.15)",
                      color: "#c8a96e",
                      border: "1px solid rgba(200,169,110,0.3)",
                    }}
                  >
                    Offre spéciale
                  </div>
                )}

                <div className="flex items-start gap-5 sm:gap-6">
                  {/* Day number */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: day.highlight
                          ? "rgba(200,169,110,0.15)"
                          : "rgba(200,169,110,0.06)",
                        border: "1px solid rgba(200,169,110,0.2)",
                        color: "#c8a96e",
                      }}
                    >
                      {day.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span
                        className="text-xs font-bold tracking-widest uppercase"
                        style={{ color: "rgba(200,169,110,0.7)" }}
                      >
                        {day.label}
                      </span>
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: "rgba(200,169,110,0.3)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "rgba(245,240,232,0.3)" }}
                      >
                        15 min
                      </span>
                    </div>

                    <h3
                      className="text-lg sm:text-xl font-bold mb-2"
                      style={{ color: "#f5f0e8" }}
                    >
                      {day.title}
                    </h3>
                    <p
                      className="text-sm sm:text-base mb-3"
                      style={{ color: "rgba(245,240,232,0.55)" }}
                