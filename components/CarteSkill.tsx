```tsx
import React from "react";

type Badge = "NOUVEAU" | "POPULAIRE" | "BEST-SELLER" | null;
type Categorie = "IA" | "Business" | "Bien-être";

interface SkillCardProps {
  code: string;
  titre: string;
  categorie: Categorie;
  duree: string;
  prix: 47 | 97;
  resultat: string;
  badge?: Badge;
  onAcheter: (code: string) => void;
  onVoirDetail?: (code: string) => void;
}

const categoryConfig: Record<
  Categorie,
  { icon: string; label: string; color: string; bg: string }
> = {
  IA: {
    icon: "🤖",
    label: "Intelligence Artificielle",
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/30",
  },
  Business: {
    icon: "💼",
    label: "Business",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
  },
  "Bien-être": {
    icon: "🌿",
    label: "Bien-être",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/30",
  },
};

const badgeConfig: Record<
  NonNullable<Badge>,
  { label: string; style: string }
> = {
  NOUVEAU: {
    label: "✦ NOUVEAU",
    style: "bg-blue-500/20 text-blue-300 border border-blue-400/40",
  },
  POPULAIRE: {
    label: "🔥 POPULAIRE",
    style: "bg-orange-500/20 text-orange-300 border border-orange-400/40",
  },
  "BEST-SELLER": {
    label: "⭐ BEST-SELLER",
    style: "bg-[#c8a96e]/20 text-[#c8a96e] border border-[#c8a96e]/50",
  },
};

const skillLevels: Record<string, { avant: number; apres: number; label: string }> = {
  default: { avant: 15, apres: 85, label: "Maîtrise" },
};

const SkillCard: React.FC<SkillCardProps> = ({
  code,
  titre,
  categorie,
  duree,
  prix,
  resultat,
  badge = null,
  onAcheter,
  onVoirDetail,
}) => {
  const cat = categoryConfig[categorie];
  const level = skillLevels.default;

  return (
    <div className="relative w-full max-w-sm group">
      {/* Outer glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-[#c8a96e]/30 via-transparent to-[#c8a96e]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

      {/* Card */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 group-hover:-translate-y-1">

        {/* Top accent line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#c8a96e] to-transparent" />

        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Category badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${cat.bg} ${cat.color}`}
            >
              <span>{cat.icon}</span>
              <span>{categorie}</span>
            </div>

            {/* Status badge */}
            {badge && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider ${badgeConfig[badge].style}`}
              >
                {badgeConfig[badge].label}
              </span>
            )}
          </div>

          {/* Code */}
          <p className="text-[#c8a96e]/50 text-xs font-mono mb-1 tracking-widest uppercase">
            #{code}
          </p>

          {/* Title */}
          <h2 className="text-white text-xl font-bold leading-tight mb-3 tracking-tight">
            {titre}
          </h2>

          {/* Meta info row */}
          <div className="flex items-center gap-3 text-xs text-white/50 mb-4">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[#c8a96e]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {duree}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[#c8a96e]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Certification incluse
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

          {/* Result */}
          <div className="bg-[#c8a96e]/5 border border-[#c8a96e]/15 rounded-xl px-4 py-3 mb-5">
            <p className="text-[#c8a96e] text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>✦</span> Ce que tu sais faire après
            </p>
            <p className="text-white/80 text-sm leading-snug">{resultat}</p>
          </div>

          {/* Skill progression */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/40 text-xs font-medium">Niveau de compétence</span>
              <span className="text-[#c8a96e] text-xs font-semibold">+{level.apres - level.avant}%</span>
            </div>

            {/* Before bar */}
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-white/30 text-xs">Avant</span>
                <span className="text-white/30 text-xs">{level.avant}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/20 rounded-full transition-all duration-700"
                  style={{ width: `${level.avant}%` }}
                />
              </div>
            </div>

            {/* After bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#c8a96e]/80 text-xs font-medium">Après</span>
                <span className="text-[#c8a96e]/80 text-xs font-medium">{level.apres}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#c8a96e] to-[#e8c98e] transition-all duration-700 shadow-[0_0_8px_rgba(200,169,110,0.4)]"
                  style={{ width: `${level.apres}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          {/* Price + CTA */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-3xl font-black text-white">{prix}€</span>
              <span className="text-white/30 text-xs ml-1 line-through">
                {prix === 47 ? "89€" : "179€"}
              </span>
              <p className="text-white/30 text-xs">Accès à vie · Mises à jour incluses</p>
            </div>
            <div className="bg-[#c8a96e]/10 border border-[#c8a96e]/30 rounded-lg px-2.5 py-1.5 text-center">
              <p className="text-[#c8a96e] text-xs font-bold">
                {prix === 47 ? "-47%" : "-46%"}
              </p>
              <p className="text-[#c8a96e]/60 text-xs">OFF</p>
            </div>
          </div>

          {/* Buy button */}
          <button
            onClick={() => onAcheter(code)}
            className="w-full relative overflow-hidden bg-gradient-to-r from-[#c8a96e] to-[#e8c98e] text-[#0f0f1a] font-bold text-sm py-3.5 rounded-xl mb-2.5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,169,110,0.4)] hover:scale-[1.02] active:scale-[0.98] tracking-wide group/btn"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Acheter cette skill
            </span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-12" />
          </button>

          {/* Detail button */}
          <button
            onClick={() => onVoirDetail?.(code)}
            className="w-full border border-white/10 text-white/60 hover:text-white hover:border-[#c8a96e]/40 font-medium text-sm py-3 rounded-xl transition-all duration-300 hover:bg-[#c8a96e]/5 tracking-wide"
          >
            Voir le détail →
          </button>
        </div>

        {/* Bottom subtle gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#c8a96e]/3 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

// ─── Demo ───────────────────────────────────────────────────────────────────

const demoCards: SkillCardProps[] = [
  {
    code: "SK-IA-042",
    titre: "Automatise tes tâches avec ChatGPT",
    categorie: "IA",
    duree: "4h · 1 semaine",
    prix: 47,
    resultat: "Tu crées des prompts qui remplacent 3h de travail quotidien.",
    badge: "BEST-SELLER",
    onAcheter: (code) => alert(`Achat skill ${code}`),
    onVoirDetail: (code) => alert(`Détail skill ${code}`),
  },
  {
    code: "SK-BZ-017",
    titre: "Lance ton offre en 7 jours",
    categorie: "Business",
    duree: "5h · 1 semaine",
    prix: 97,
    resultat: "Tu publies une offre claire avec page de vente et premier client.",
    badge: "POPULAIRE",
    onAcheter: (code) => alert(`Achat skill ${code}`),
    onVoirDetail: (code) => alert(`Détail skill ${code}`),
  },
  {
    code: "SK-BE-009",
    titre: "Énergie maximale sans caféine",
    categorie: "Bien-être",
    duree: "3h · 1 semaine",
    prix: 47,
    resultat: "Tu maîtrises 5 routines qui boostent ton énergie naturellement.",
    badge: "NOUVEAU",
    onAcheter: (code) => alert(`Achat skill ${code}`),
    onVoirDetail: (code) => alert(`Détail skill ${code}`),
  },
];

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center px-6 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-[#c8a96e] text-xs font-semibold tracking-[0.3em] uppercase mb