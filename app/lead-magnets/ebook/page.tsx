```tsx
// app/ebook-gratuit/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  prenom: string;
  email: string;
  metier: string;
}

interface FormErrors {
  prenom?: string;
  email?: string;
  metier?: string;
}

const testimonials = [
  {
    name: "Sophie M.",
    role: "Consultante RH",
    text: "J'ai divisé mon temps de rédaction par 3 grâce aux workflows du guide. Indispensable.",
    avatar: "SM",
  },
  {
    name: "Thomas L.",
    role: "Entrepreneur",
    text: "Les 5 workflows sont directement applicables. ROI immédiat dès le premier jour.",
    avatar: "TL",
  },
  {
    name: "Camille D.",
    role: "Responsable Marketing",
    text: "Enfin un guide concret, sans blabla. Les prompts Claude changent vraiment la donne.",
    avatar: "CD",
  },
];

const contents = [
  {
    icon: "⚡",
    title: "Les 10 prompts Claude les plus puissants",
    desc: "Copiez-collez des prompts validés par des milliers d'utilisateurs",
  },
  {
    icon: "🤖",
    title: "Automatiser 80% de vos tâches répétitives",
    desc: "Identifiez et éliminez les tâches chronophages avec l'IA",
  },
  {
    icon: "🛠",
    title: "Meilleurs outils IA par métier",
    desc: "Sélection rigoureuse pour chaque secteur professionnel",
  },
  {
    icon: "📋",
    title: "5 workflows IA prêts à copier-coller",
    desc: "Implémentez immédiatement des systèmes IA dans votre quotidien",
  },
  {
    icon: "⚠️",
    title: "Erreurs à éviter avec l'IA générative",
    desc: "Les pièges que 90% des utilisateurs rencontrent — et comment les éviter",
  },
  {
    icon: "🏢",
    title: "Cas pratiques par secteur",
    desc: "Marketing, RH, Finance, Juridique, Tech : exemples concrets",
  },
];

const metiers = [
  "Entrepreneur / Fondateur",
  "Marketing / Communication",
  "Ressources Humaines",
  "Consultant / Freelance",
  "Commercial / Vente",
  "Finance / Comptabilité",
  "Juridique",
  "Tech / Développement",
  "Éducation / Formation",
  "Autre",
];

export default function EbookPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    prenom: "",
    email: "",
    metier: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.prenom.trim() || formData.prenom.trim().length < 2) {
      newErrors.prenom = "Veuillez entrer votre prénom";
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Veuillez entrer un email valide";
    }
    if (!formData.metier) {
      newErrors.metier = "Veuillez sélectionner votre métier";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/ebook-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Une erreur est survenue");
      }

      router.push("/merci-ebook");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen w-full"
      style={{ backgroundColor: "#050508" }}
    >
      {/* ── Noise texture overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Ambient glow ── */}
      <div
        className="pointer-events-none fixed left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] opacity-10 blur-[120px] z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, #c8a96e 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ══════════════════════════════════
            HEADER BADGE
        ══════════════════════════════════ */}
        <div className="mb-8 flex justify-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{
              borderColor: "rgba(200,169,110,0.35)",
              backgroundColor: "rgba(200,169,110,0.08)",
              color: "#c8a96e",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#c8a96e" }}
            />
            AcadémIA Pro · Ressource Gratuite
          </div>
        </div>

        {/* ══════════════════════════════════
            HERO HEADLINE
        ══════════════════════════════════ */}
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            <span className="text-white">Guide Pratique </span>
            <span
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #f0d080 50%, #c8a96e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Claude & IA Générative
            </span>
            <span className="text-white"> 2026</span>
          </h1>
        </div>

        <p
          className="mb-10 text-center text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Les{" "}
          <span className="font-semibold" style={{ color: "#c8a96e" }}>
            50 meilleures pratiques
          </span>{" "}
          pour transformer votre productivité avec l'IA
        </p>

        {/* ── Meta badges ── */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {[
            { icon: "📄", label: "50 pages" },
            { icon: "🎯", label: "PDF professionnel" },
            { icon: "🔄", label: "Mis à jour 2026" },
            { icon: "🆓", label: "100% Gratuit" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════
            TWO-COLUMN LAYOUT
        ══════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 items-start">
          {/* ── LEFT: Content list ── */}
          <div>
            {/* Social proof counter */}
            <div
              className="mb-6 flex items-center gap-3 rounded-xl p-4"
              style={{
                backgroundColor: "rgba(200,169,110,0.08)",
                border: "1px solid rgba(200,169,110,0.2)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black"
                style={{ backgroundColor: "rgba(200,169,110,0.15)", color: "#c8a96e" }}
              >
                📥
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  1 247 professionnels ont déjà téléchargé ce guide
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Cette semaine encore · Mis à jour janvier 2026
                </p>
              </div>
            </div>

            {/* Section title */}
            <h2
              className="mb-5 text-sm font-bold uppercase tracking-widest"
              style={{ color: "#c8a96e" }}
            >
              Ce que contient le guide
            </h2>

            {/* Content grid */}
            <div className="space-y-3">
              {contents.map((item, i) => (
                <div
                  key={i}
                  className="group flex gap-4 rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(200,169,110,0.25)";
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      "rgba(200,169,110,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      "rgba(255,255,255,0.03)";
                  }}
                >
                  <span className="mt-0.5 text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonials */}
            <div className="mt-8">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-widest"
                style={{ color: "#c8a96e" }}
              >
                Ce qu'ils en disent
              </h3>
              <div className="space-y-3">
                {testimonials.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p
                      className="mb-3 text-sm leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          background: "linear-gradient(135deg, #c8a96e, #f0d080)",
                          color: "#050508",
                        }}
                      >
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{t.name}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {t.role}
                        </p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {[...Array(5)].map((_, si) => (
                          <span key={si} className="text-xs" style={{ color: "#c8a96