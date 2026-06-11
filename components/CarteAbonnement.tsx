import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Formule = "Starter" | "Bien-être" | "Intensif";
type Format = "Visio" | "Audio";

interface SubscriptionCardProps {
  formule: Formule;
  format: Format;
  prix: number;
  seances: number;
  economie: number;
  bestSeller?: boolean;
  onSubscribe: (formule: Formule, format: Format) => void;
  onLearnMore?: (formule: Formule, format: Format) => void;
}

// ─── Icônes inline SVG ────────────────────────────────────────────────────────

const IconVideo = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
  </svg>
);

const IconMic = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
  </svg>
);

const IconStar = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const IconLeaf = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconZap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const IconSeedling = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M12 22V12M12 12C12 7 7 4 3 5c0 4 3 7 9 7zM12 12c0-5 5-8 9-7-1 4-4 7-9 7" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const IconArrow = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ─── Config formules ──────────────────────────────────────────────────────────

const formuleConfig: Record<Formule, {
  icon: React.FC;
  tagline: string;
  gradient: string;
  accentText: string;
}> = {
  Starter: {
    icon: IconSeedling,
    tagline: "Idéal pour débuter",
    gradient: "from-slate-800/80 to-slate-900/90",
    accentText: "Entrée en douceur",
  },
  "Bien-être": {
    icon: IconLeaf,
    tagline: "Équilibre & régularité",
    gradient: "from-slate-800/80 to-slate-900/90",
    accentText: "Suivi personnalisé",
  },
  Intensif: {
    icon: IconZap,
    tagline: "Progression maximale",
    gradient: "from-slate-800/80 to-slate-900/90",
    accentText: "Engagement total",
  },
};

const avantages = [
  { label: "Sans engagement, résiliable à tout moment" },
  { label: "Séances reportables (rollover)" },
  { label: "Accès toutes spécialités" },
  { label: "Compte-rendu inclus après chaque séance" },
];

// ─── Composant principal ──────────────────────────────────────────────────────

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  formule,
  format,
  prix,
  seances,
  economie,
  bestSeller = false,
  onSubscribe,
  onLearnMore,
}) => {
  const config = formuleConfig[formule];
  const FormulaIcon = config.icon;
  const FormatIcon = format === "Visio" ? IconVideo : IconMic;
  const prixUnitaire = (prix / seances).toFixed(2);

  return (
    <div className="relative w-full max-w-sm">
      {/* Halo décoratif */}
      <div
        className="absolute -inset-px rounded-2xl opacity-60 blur-sm pointer-events-none"
        style={{
          background: bestSeller
            ? "linear-gradient(135deg, #c8a96e44, #f0d080aa, #c8a96e44)"
            : "linear-gradient(135deg, #c8a96e22, #c8a96e55, #c8a96e22)",
        }}
      />

      {/* Carte principale */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1a1f2e 0%, #0f1320 60%, #141929 100%)",
          border: bestSeller
            ? "1.5px solid #c8a96e"
            : "1.5px solid rgba(200,169,110,0.3)",
          boxShadow: bestSeller
            ? "0 0 40px rgba(200,169,110,0.15), 0 20px 60px rgba(0,0,0,0.5)"
            : "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* ── BADGE BEST-SELLER ── */}
        {bestSeller && (
          <div className="absolute top-0 right-0 z-10">
            <div
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold tracking-widest uppercase"
              style={{
                background: "linear-gradient(90deg, #c8a96e, #f0d080)",
                color: "#0f1320",
                borderBottomLeftRadius: "12px",
              }}
            >
              <IconStar />
              Best-Seller
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div
          className="px-6 pt-6 pb-4"
          style={{
            background: "linear-gradient(180deg, rgba(200,169,110,0.08) 0%, transparent 100%)",
            borderBottom: "1px solid rgba(200,169,110,0.12)",
          }}
        >
          {/* Formule + icône */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.08))",
                border: "1px solid rgba(200,169,110,0.3)",
                color: "#c8a96e",
              }}
            >
              <FormulaIcon />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  AcadémIA
                </h2>
                <span
                  className="text-lg font-bold tracking-wide"
                  style={{ color: "#c8a96e" }}
                >
                  {formule}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{config.tagline}</p>
            </div>
          </div>

          {/* Badge format */}
          <div className="flex items-center gap-2 mt-1">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(200,169,110,0.12)",
                border: "1px solid rgba(200,169,110,0.25)",
                color: "#c8a96e",
              }}
            >
              <FormatIcon />
              Séances {format}
            </div>
            <span className="text-xs text-slate-500">{config.accentText}</span>
          </div>
        </div>

        {/* ── PRICING ── */}
        <div className="px-6 py-5">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {prix}€
            </span>
            <span className="text-slate-400 text-sm mb-1.5">/ mois</span>
          </div>
          <p className="text-xs text-slate-500">
            soit{" "}
            <span style={{ color: "#c8a96e" }} className="font-semibold">
              {prixUnitaire}€
            </span>{" "}
            par séance
          </p>

          {/* Séances incluses */}
          <div