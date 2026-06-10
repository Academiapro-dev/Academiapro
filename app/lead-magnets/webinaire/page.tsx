"use client";

import { useState, useEffect } from "react";

interface FormData {
  firstName: string;
  email: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  email?: string;
}

export default function WebinairePage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [placesLeft, setPlacesLeft] = useState(47);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calcul prochain 1er dimanche du mois à 20h
  const getNextFirstSunday = (): Date => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), 1);
    while (target.getDay() !== 0) {
      target.setDate(target.getDate() + 1);
    }
    target.setHours(20, 0, 0, 0);
    if (target <= now) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      while (nextMonth.getDay() !== 0) {
        nextMonth.setDate(nextMonth.getDate() + 1);
      }
      nextMonth.setHours(20, 0, 0, 0);
      return nextMonth;
    }
    return target;
  };

  useEffect(() => {
    const target = getNextFirstSunday();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target.getTime() - now;
      if (distance <= 0) {
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulation diminution places
  useEffect(() => {
    const interval = setInterval(() => {
      setPlacesLeft((prev) => {
        if (prev > 12) return prev - 1;
        return prev;
      });
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const getNextFirstSundayLabel = (): string => {
    const date = getNextFirstSunday();
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setIsLoading(false);
    setIsSubmitted(true);
    setPlacesLeft((prev) => Math.max(prev - 1, 1));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const programme = [
    {
      icon: "⚡",
      title: "Les 3 automatisations IA qui changent tout",
      desc: "Découvrez les workflows qui font gagner 10h/semaine",
    },
    {
      icon: "🎬",
      title: "Démonstration live Claude en action",
      desc: "Voyez en direct comment créer du contenu, analyser, automatiser",
    },
    {
      icon: "🤖",
      title: "Construire son premier agent IA",
      desc: "Step-by-step : votre agent opérationnel en moins d'1h",
    },
    {
      icon: "💬",
      title: "Questions réponses en direct",
      desc: "30 minutes dédiées à vos questions personnalisées",
    },
    {
      icon: "🎁",
      title: "Offre spéciale participants",
      desc: "Starter Pack à 47€ — réservé exclusivement aux présents",
    },
  ];

  const afterRegistration = [
    { icon: "📧", text: "Email de confirmation avec lien d'accès immédiat" },
    { icon: "🔔", text: "Rappel automatique J-1 et H-1 avant le live" },
    { icon: "🎥", text: "Replay disponible pendant 48h après le webinaire" },
    { icon: "💎", text: "Offre Starter Pack 47€ — valable 24h après le live" },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: "#050508", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: "#c8a96e" }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-8"
          style={{ backgroundColor: "#c8a96e" }}
        />
        <div className="absolute inset-0 opacity-3"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(200,169,110,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* TOP BANNER */}
        <div
          className="text-center py-2 px-4 text-sm font-medium tracking-wide"
          style={{ backgroundColor: "#c8a96e", color: "#050508" }}
        >
          🔴 WEBINAIRE GRATUIT — Places limitées •{" "}
          <span className="font-bold">{placesLeft} places restantes</span>
        </div>

        {/* HERO */}
        <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
            style={{ borderColor: "rgba(200,169,110,0.4)", backgroundColor: "rgba(200,169,110,0.08)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#c8a96e" }} />
            <span className="text-sm font-medium" style={{ color: "#c8a96e" }}>
              WEBINAIRE GRATUIT MENSUEL
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
            Comment{" "}
            <span
              className="relative"
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #f0d598 50%, #c8a96e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              automatiser son business
            </span>
            <br />
            avec l'IA en{" "}
            <span style={{ color: "#c8a96e" }}>7 jours</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            60 minutes de live intensif + 30 minutes de Q&A pour transformer votre façon de travailler avec l'intelligence artificielle.
          </p>

          {/* Date & Info pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { icon: "📅", text: `${getNextFirstSundayLabel()} à 20h` },
              { icon: "⏱️", text: "90 min — Live + Q&A" },
              { icon: "🆓", text: "100% Gratuit" },
              { icon: "🎯", text: "Places limitées" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <span>{item.icon}</span>
                <span className="text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Countdown */}
          <div className="inline-block rounded-2xl p-6 mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(200,169,110,0.1) 0%, rgba(200,169,110,0.05) 100%)",
              border: "1px solid rgba(200,169,110,0.25)",
            }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#c8a96e" }}>
              ⏳ Le webinaire commence dans
            </p>
            <div className="flex gap-4 justify-center">
              {[
                { value: timeLeft.days, label: "Jours" },
                { value: timeLeft.hours, label: "Heures" },
                { value: timeLeft.minutes, label: "Minutes" },
                { value: timeLeft.seconds, label: "Secondes" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div
                    className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-2xl md:text-3xl font-black mb-1"
                    style={{
                      backgroundColor: "rgba(200,169,110,0.15)",
                      border: "1px solid rgba(200,169,110,0.3)",
                      color: "#c8a96e",
                    }}
                  >
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AVATAR + PRESENTER */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8"
            style={{
              background: "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(5,5,8,0.9) 100%)",
              border: "1px solid rgba(200,169,110,0.2)",
            }}>
            {/* Avatar IA */}
            <div className="flex-shrink-0 relative">
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-6xl md:text-7xl relative"
                style={{
                  background: "linear-gradient(135deg, rgba(200,169,110,0.3) 0%, rgba(200,169,110,0.1) 100%)",
                  border: "3px solid rgba(200,169,110,0.5)",
                  boxShadow: "0 0 40px rgba(200,169,110,0.2)",
                }}
              >
                🤖
              </div>
              <div
                className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#c8a96e", color: "#050508" }}
              >
                IA
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c8a96e" }}>
                Votre animateur
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-3">
                Avatar IA <span style={{ color: "#c8a96e" }}>AcadémIA Pro</span>
              </h2>
              <p className="text-gray-400 leading-relaxed max-w-lg">
                Expert en IA générative et automatisation business. Notre avatar IA vous guide pas à pas à travers les stratégies les plus efficaces pour intégrer l'IA dans votre activité — de façon concrète, immédiate et mesurable.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {["IA Générative", "Claude & GPT", "Automatisation", "Agents IA"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(200,169,110,0.15)",
                      border: "1px solid rgba(200,169,110,0.3)",
                      color: "#c8a96e",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAMME */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="inline