```tsx
"use client";

import { useState } from "react";
import { CheckCircle, Star, Zap, Crown, TrendingUp, Users, Shield, ChevronDown, ChevronUp, CreditCard, Award, Sparkles } from "lucide-react";

const packs = [
  {
    id: "starter",
    name: "STARTER PACK IA",
    price: 47,
    originalPrice: null,
    savings: null,
    badge: "OFFRE DE LANCEMENT",
    badgeColor: "bg-blue-500",
    icon: Zap,
    ctaText: "Je veux ma place — 47€",
    highlight: false,
    formations: [],
    contents: [
      "100 prompts Claude par métier",
      "Guide démarrage rapide",
      "Accès module 1 F128",
      "Communauté Discord",
      "Garantie 30 jours",
    ],
    bonuses: [],
    description: "Parfait pour découvrir la puissance de l'IA dans votre métier",
  },
  {
    id: "ia-complet",
    name: "PACK IA COMPLET",
    price: 2690,
    originalPrice: 3360,
    savings: 670,
    badge: "BEST-SELLER",
    badgeColor: "bg-amber-500",
    icon: Star,
    ctaText: "Obtenir le Pack IA Complet",
    highlight: true,
    formations: [
      { code: "F128", title: "Expert Claude", price: 690 },
      { code: "F129", title: "No-Code IA", price: 790 },
      { code: "F130", title: "Apps Natives IA", price: 990 },
      { code: "F131", title: "Marketing Digital IA", price: 890 },
    ],
    contents: [],
    bonuses: [
      "Agent IA tuteur dédié pour chaque formation",
      "Accès prioritaire nouvelles formations IA",
      "Badge Expert IA AcadémIA Pro",
    ],
    description: "Maîtrisez l'IA de A à Z et devenez un expert reconnu",
  },
  {
    id: "marketing",
    name: "PACK MARKETING DIGITAL × IA",
    price: 1490,
    originalPrice: 1980,
    savings: 490,
    badge: "RECOMMANDÉ",
    badgeColor: "bg-emerald-500",
    icon: TrendingUp,
    ctaText: "Obtenir le Pack Marketing",
    highlight: false,
    formations: [
      { code: "F10", title: "Marketing Digital", price: 690 },
      { code: "F43", title: "Community Management", price: 400 },
      { code: "F131", title: "Marketing Digital × IA Expert", price: 890 },
    ],
    contents: [],
    bonuses: [
      "Templates campagnes prêts à utiliser",
      "50 prompts marketing",
      "Audit marketing offert",
    ],
    description: "Boostez votre marketing grâce aux dernières techniques IA",
  },
  {
    id: "entrepreneur",
    name: "PACK ENTREPRENEUR DIGITAL COMPLET",
    price: 3490,
    originalPrice: 5530,
    savings: 2040,
    badge: "OFFRE PREMIUM",
    badgeColor: "bg-purple-500",
    icon: Crown,
    ctaText: "Accéder au Pack Premium",
    highlight: false,
    formations: [
      { code: "F38", title: "Entrepreneuriat", price: 690 },
      { code: "F125", title: "Personal Branding", price: 590 },
      { code: "F127", title: "Négociation", price: 590 },
      { code: "F128", title: "Expert Claude", price: 690 },
      { code: "F129", title: "No-Code IA", price: 790 },
      { code: "F130", title: "Apps Natives IA", price: 990 },
      { code: "F131", title: "Marketing Digital IA", price: 890 },
    ],
    contents: [],
    bonuses: [
      "Séance coaching stratégique offerte",
      "Accès VIP toutes nouvelles formations",
      "Badge Entrepreneur Digital Elite",
    ],
    description: "Le pack ultime pour bâtir votre empire digital avec l'IA",
  },
];

const faqs = [
  {
    question: "Puis-je payer en plusieurs fois ?",
    answer:
      "Oui ! Tous nos packs sont disponibles en paiement 3x sans frais. Le montant est divisé en 3 mensualités égales prélevées automatiquement. Aucuns frais supplémentaires.",
  },
  {
    question: "Combien de temps ai-je accès aux formations ?",
    answer:
      "Vous bénéficiez d'un accès à vie à toutes les formations incluses dans votre pack. Vous pouvez les suivre à votre rythme, les revoir autant de fois que vous le souhaitez.",
  },
  {
    question: "La garantie 30 jours s'applique-t-elle à tous les packs ?",
    answer:
      "Absolument. Si dans les 30 jours suivant votre achat vous n'êtes pas satisfait(e), nous vous remboursons intégralement, sans question ni condition.",
  },
  {
    question: "Les formations sont-elles accessibles immédiatement ?",
    answer:
      "Oui, dès validation de votre paiement vous recevez un email avec vos accès. Vous pouvez commencer à apprendre dans les minutes suivant votre inscription.",
  },
  {
    question: "Puis-je passer d'un pack à un pack supérieur ?",
    answer:
      "Bien sûr ! Vous pouvez upgrader votre pack à tout moment. Vous ne payez que la différence entre votre pack actuel et le pack supérieur.",
  },
  {
    question: "Y a-t-il un support si j'ai des questions ?",
    answer:
      "Chaque pack inclut un accès à notre communauté Discord active. Les packs premium incluent un agent IA tuteur dédié et un accès prioritaire au support humain.",
  },
];

const individualFormations = [
  { code: "F10", title: "Marketing Digital", price: 690 },
  { code: "F38", title: "Entrepreneuriat", price: 690 },
  { code: "F43", title: "Community Management", price: 400 },
  { code: "F125", title: "Personal Branding", price: 590 },
  { code: "F127", title: "Négociation", price: 590 },
  { code: "F128", title: "Expert Claude", price: 690 },
  { code: "F129", title: "No-Code IA", price: 790 },
  { code: "F130", title: "Apps Natives IA", price: 990 },
  { code: "F131", title: "Marketing Digital IA", price: 890 },
];

export default function PacksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"once" | "3x">("once");

  const formatPrice = (price: number, mode: "once" | "3x") => {
    if (mode === "3x") {
      return `3 × ${Math.ceil(price / 3)}€`;
    }
    return `${price.toLocaleString("fr-FR")}€`;
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#050508", color: "#f0ece4" }}
    >
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, #c8a96e, transparent)",
          }}
        />
        <div className="relative max-w-6xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
            style={{
              backgroundColor: "rgba(200,169,110,0.1)",
              borderColor: "rgba(200,169,110,0.3)",
              color: "#c8a96e",
            }}
          >
            <Sparkles size={14} />
            Économisez jusqu'à 2 040€ sur nos packs
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Nos{" "}
            <span style={{ color: "#c8a96e" }}>Packs Formations</span>
            <br />
            AcadémIA Pro
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Des bundles soigneusement conçus pour accélérer votre montée en
            compétences IA. Formations, bonus exclusifs et accompagnement
            inclus.
          </p>

          {/* Billing toggle */}
          <div
            className="inline-flex items-center rounded-xl p-1 border"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={() => setBillingCycle("once")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                billingCycle === "once"
                  ? "text-black"
                  : "text-gray-400 hover:text-white"
              }`}
              style={
                billingCycle === "once"
                  ? { backgroundColor: "#c8a96e" }
                  : {}
              }
            >
              Paiement unique
            </button>
            <button
              onClick={() => setBillingCycle("3x")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                billingCycle === "3x"
                  ? "text-black"
                  : "text-gray-400 hover:text-white"
              }`}
              style={
                billingCycle === "3x"
                  ? { backgroundColor: "#c8a96e" }
                  : {}
              }
            >
              3× sans frais
            </button>
          </div>
        </div>
      </section>

      {/* ── PACKS GRID ── */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {packs.map((pack) => {
            const Icon = pack.icon;
            return (
              <div
                key={pack.id}
                className={`relative flex flex-col rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                  pack.highlight
                    ? "shadow-2xl scale-[1.02]"
                    : "hover:shadow-xl"
                }`}
                style={{
                  backgroundColor: pack.highlight
                    ? "rgba(200,169,110,0.06)"
                    : "rgba(255,255,255,0.03)",
                  borderColor: pack.highlight
                    ? "#c8a96e"
                    : "rgba(255,255,255,0.08)",
                  boxShadow: pack.highlight
                    ? "0 0 60px rgba(200,169,110,0.15)"
                    : undefined,
                }}
              >
                {/* Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className={`${pack.badgeColor} text-white text-xs font-black px-4 py-1.5 rounded-full tracking-wider whitespace-nowrap shadow-lg`}
                  >
                    {pack.badge}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1 pt-8">
                  {/* Icon + Name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="p-2.5 rounded-xl shrink-0"
                      style={{
                        backgroundColor: "rgba(200,169,110,0.12)",
                      }}
                    >
                      <Icon size={20} style={{ color: "#c8a96e" }} />
                    </div>
                    <h2 className="text-sm font-black leading-tight uppercase tracking-wide">
                      {pack.name}
                    </h2>
                  </div>

                  <p className="text-gray-400 text-sm mb-5">
                    {pack.description}
                  </p>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-end gap-2">
                      <span
                        className="text-3xl font-black"
                        style={{ color: "#c8a96e" }}
                      >
                        {billingCycle === "3x"
                          ? `3 × ${Math.ceil(pack.price / 3)}€`
                          : `${pack.price.toLocaleString("fr-FR")}€`}
                      </span>
                    </div>
                    {pack.originalPrice && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-500 line-through text-sm">
                          {pack.originalPrice.toLocaleString("fr-FR")}€
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: "rgba(34,197,94,0.15)",
                            color: "#4ade80",
                          }}
                        >
                          -{pack.savings?.toLocaleString("fr-FR")}€
                        </span>
                      </div>
                    )}
                    {billingCycle === "3x" && (
                      <p className="text-xs text-gray-500 mt-1">
                        soit {pack.price.toLocaleString("fr-FR")}€ au total
                      </p>
                    )}
                  </div>

                  {/* Formations */}
                  {pack.formations.length > 0 && (
                    <div className="mb-4">
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-2"
                        style={{ color: "#c8a96e" }}
                      >
                        Formations incluses
                      </p>
                      <ul className="space-y-1.5