import React, { useState, useEffect } from "react";

type Format = "visio" | "audio";

interface FormatSeanceProps {
  specialite: string;
  onFormatChange: (format: Format, prix: number) => void;
  prixVisio: number;
  prixAudio: number;
}

const RECOMMENDED_FORMATS: Record<string, Format> = {
  psychologie: "visio",
  coaching: "visio",
  meditation: "audio",
  sophrologie: "audio",
  nutrition: "visio",
  juridique: "audio",
  financier: "audio",
  default: "visio",
};

const FormatSeance: React.FC<FormatSeanceProps> = ({
  specialite,
  onFormatChange,
  prixVisio,
  prixAudio,
}) => {
  const storageKey = `academia_format_pref_${specialite}`;

  const getRecommended = (): Format =>
    RECOMMENDED_FORMATS[specialite?.toLowerCase()] ||
    RECOMMENDED_FORMATS.default;

  const getInitialFormat = (): Format => {
    try {
      const saved = localStorage.getItem(storageKey) as Format | null;
      if (saved === "visio" || saved === "audio") return saved;
    } catch {}
    return getRecommended();
  };

  const [selected, setSelected] = useState<Format>(getInitialFormat);
  const [animating, setAnimating] = useState(false);
  const [prevSelected, setPrevSelected] = useState<Format>(getInitialFormat);

  const recommended = getRecommended();

  useEffect(() => {
    const initial = getInitialFormat();
    setSelected(initial);
    setPrevSelected(initial);
  }, [specialite]);

  useEffect(() => {
    const prix = selected === "visio" ? prixVisio : prixAudio;
    onFormatChange(selected, prix);
    try {
      localStorage.setItem(storageKey, selected);
    } catch {}
  }, [selected, prixVisio, prixAudio]);

  const handleSelect = (format: Format) => {
    if (format === selected || animating) return;
    setPrevSelected(selected);
    setAnimating(true);
    setTimeout(() => {
      setSelected(format);
      setAnimating(false);
    }, 200);
  };

  const currentPrix = selected === "visio" ? prixVisio : prixAudio;
  const economie = prixVisio - prixAudio;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gray-900 border border-yellow-600/30 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-yellow-500/80 text-xs font-medium tracking-widest uppercase">
              AcadémIA Pro
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Format de{" "}
            <span
              style={{ color: "#c8a96e" }}
              className="italic"
            >
              votre séance
            </span>
          </h2>
          <p className="text-gray-400 text-sm">
            Spécialité :{" "}
            <span className="text-gray-200 font-medium capitalize">
              {specialite || "Non définie"}
            </span>
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-8">
          <div className="relative bg-gray-900 border border-gray-700/50 rounded-2xl p-1.5 flex gap-1">
            {/* Sliding background */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-in-out"
              style={{
                background:
                  "linear-gradient(135deg, #c8a96e22, #c8a96e44)",
                border: "1px solid #c8a96e55",
                width: "calc(50% - 8px)",
                left: selected === "visio" ? "6px" : "calc(50% + 2px)",
              }}
            />
            {(["visio", "audio"] as Format[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleSelect(fmt)}
                className="relative z-10 flex items-center gap-2 px-8 py-3 rounded-xl transition-all duration-300 focus:outline-none"
              >
                {fmt === "visio" ? (
                  <CameraIcon
                    active={selected === "visio"}
                  />
                ) : (
                  <MicIcon active={selected === "audio"} />
                )}
                <span
                  className={`font-semibold text-sm tracking-wide transition-colors duration-300 ${
                    selected === fmt
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                >
                  {fmt === "visio" ? "VISIO" : "AUDIO"}
                </span>
                {recommended === fmt && (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: "#c8a96e22",
                      color: "#c8a96e",
                      border: "1px solid #c8a96e55",
                      fontSize: "9px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ★
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* VISIO Card */}
          <FormatCard
            format="visio"
            selected={selected}
            recommended={recommended === "visio"}
            animating={animating && prevSelected === "visio"}
            onClick={() => handleSelect("visio")}
            prix={prixVisio}
            icon={<CameraIconLarge />}
            title="Séance Vidéo"
            subtitle="Avatar IA visible"
            description="Interagissez avec votre assistant IA en face à face grâce à un avatar animé ultra-réaliste. Idéal pour les séances nécessitant une présence visuelle forte."
            avantages={[
              "Avatar IA expressif en temps réel",
              "Lecture des expressions & émotions",
              "Engagement maximal",
              "Partage d'écran disponible",
            ]}
          />

          {/* AUDIO Card */}
          <FormatCard
            format="audio"
            selected={selected}
            recommended={recommended === "audio"}
            animating={animating && prevSelected === "audio"}
            onClick={() => handleSelect("audio")}
            prix={prixAudio}
            icon={<MicIconLarge />}
            title="Séance Audio"
            subtitle="Voix IA naturelle"
            description="Une voix IA neuronale d'une clarté exceptionnelle. Concentrez-vous sur le contenu sans distraction visuelle. Parfait pour la méditation et le coaching vocal."
            avantages={[
              "Voix neuronale haute fidélité",
              "Connexion plus légère",
              "Idéal mobilité & déplacement",
              `Économisez ${economie}€ par séance`,
            ]}
            badge={economie > 0 ? `-${economie}€` : undefined}
          />
        </div>

        {/* Prix dynamique */}
        <PrixDisplay
          selected={selected}
          prix={currentPrix}
          prixVisio={prixVisio}
          prixAudio={prixAudio}
          animating={animating}
        />

        {/* CTA */}
        <button
          className="w-full mt-6 py-4 rounded-2xl font-bold text-gray-950 text-lg tracking-wide transition-all duration-300 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
          style={{
            background:
              "linear-gradient(135deg, #c8a96e, #e8c97e, #c8a96e)",
            backgroundSize: "200% 200%",
          }}
        >
          Confirmer — {selected === "visio" ? "Séance Vidéo" : "Séance Audio"}
        </button>

        <p className="text-center text-gray-600 text-xs mt-4">
          Votre préférence est mémorisée pour{" "}
          <span className="text-gray-400 capitalize">{specialite}</span>
        </p>
      </div>
    </div>
  );
};

/* ─── FormatCard ─────────────────────────────────────────── */
interface FormatCardProps {
  format: Format;
  selected: Format;
  recommended: boolean;
  animating: boolean;
  onClick: () => void;
  prix: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  avantages: string[];
  badge?: string;
}

const FormatCard: React.FC<FormatCardProps> = ({
  format,
  selected,
  recommended,
  animating,
  onClick,
  prix,
  icon,
  title,
  subtitle,
  description,
  avantages,
  badge,
}) => {
  const isActive = selected === format;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 border ${
        isActive
          ? "border-yellow-600/60 shadow-lg shadow-yellow-900/20"
          : "border-gray-800 hover:border-gray-600"
      } ${animating ? "opacity-70 scale-[0.98]" : "opacity-100 scale-100"}`}
      style={{
        background: isActive
          ? "linear-gradient(145deg, #1a1508, #1c1a10, #111)"
          : "linear-gradient(145deg, #111111, #0d0d0d)",
      }}
    >
      {/* Glow effect */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top left, #c8a96e, transparent 70%)",
          }}
        />
      )}

      {/* Badges */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl transition-all duration-300 ${
            isActive ? "bg-yellow-900/30" : "bg-gray-800/60"
          }`}
          style={
            isActive
              ? { border: "1px solid #c8a96e33" }
              : { border: "1px solid transparent" }
          }
        >
          {icon}
        </div>
        <div className="flex flex-col