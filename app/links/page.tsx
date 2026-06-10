```tsx
// app/links/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AcadémIA Pro — Liens",
  description:
    "La plateforme formation 100% IA · 131 formations · agents IA 24h/24",
  openGraph: {
    title: "AcadémIA Pro",
    description: "131 formations IA · Agents 24h/24",
    url: "https://academiapro.fr/links",
  },
};

const links = [
  {
    id: 1,
    emoji: "🎓",
    label: "Découvrir les 131 formations",
    href: "https://academiapro.fr/formations",
    highlight: false,
  },
  {
    id: 2,
    emoji: "🧘",
    label: "Réserver une séance thérapeutique",
    href: "https://academiapro.fr/therapeutique",
    highlight: false,
  },
  {
    id: 3,
    emoji: "📥",
    label: "Télécharger l'e-book gratuit",
    href: "https://academiapro.fr/ebook",
    highlight: false,
  },
  {
    id: 4,
    emoji: "⚡",
    label: "Starter Pack",
    badge: "47€",
    href: "https://academiapro.fr/starter-pack",
    highlight: false,
  },
  {
    id: 5,
    emoji: "🚀",
    label: "Pack IA Complet",
    badge: "2 690€",
    href: "https://academiapro.fr/pack-ia-complet",
    highlight: true,
  },
  {
    id: 6,
    emoji: "💬",
    label: "Rejoindre la communauté gratuite",
    href: "https://academiapro.fr/communaute",
    highlight: false,
  },
  {
    id: 7,
    emoji: "📅",
    label: "S'inscrire au webinaire gratuit",
    href: "https://academiapro.fr/webinaire",
    highlight: false,
  },
  {
    id: 8,
    emoji: "📱",
    label: "Mini-cours IA 3 jours gratuit",
    href: "https://academiapro.fr/mini-cours",
    highlight: false,
  },
];

const socials = [
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/academiapro",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://instagram.com/academiapro",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com/academiapro",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/@academiapro",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@academiapro",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function LinksPage() {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center px-4 py-10 pb-16"
      style={{ backgroundColor: "#050508" }}
    >
      {/* Glow background effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200,169,110,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* ── Logo ── */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <div className="flex items-center gap-2">
            {/* Logo mark */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black"
              style={{
                background:
                  "linear-gradient(135deg, #c8a96e 0%, #f0d5a0 50%, #c8a96e 100%)",
                boxShadow: "0 0 20px rgba(200,169,110,0.4)",
              }}
            >
              A
            </div>
            <span
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{
                background:
                  "linear-gradient(135deg, #c8a96e 0%, #f0d5a0 50%, #c8a96e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AcadémIA Pro
            </span>
          </div>
        </div>

        {/* ── Avatar ── */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
            style={{
              background:
                "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
              border: "2px solid #c8a96e",
              boxShadow:
                "0 0 30px rgba(200,169,110,0.25), 0 0 60px rgba(200,169,110,0.1)",
            }}
          >
            🤖
          </div>
          {/* Online indicator */}
          <span
            className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 animate-pulse"
            style={{
              backgroundColor: "#22c55e",
              borderColor: "#050508",
            }}
          />
        </div>

        {/* ── Bio ── */}
        <div className="text-center space-y-2 px-2">
          <p
            className="text-sm sm:text-base leading-relaxed"
            style={{ color: "#a0a0b8" }}
          >
            La plateforme formation{" "}
            <span style={{ color: "#c8a96e" }} className="font-semibold">
              100% IA
            </span>{" "}
            · 131 formations · agents IA{" "}
            <span style={{ color: "#c8a96e" }} className="font-semibold">
              24h/24
            </span>
          </p>

          {/* Social proof */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "rgba(200,169,110,0.1)",
              border: "1px solid rgba(200,169,110,0.3)",
              color: "#c8a96e",
            }}
          >
            <span className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-3 h-3"
                  fill="#c8a96e"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1