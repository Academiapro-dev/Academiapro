import React from "react";

// ============================================================
// TYPES & INTERFACES
// ============================================================

type Mention = "Félicitations" | "Très Bien" | "Bien";
type Variante = "STANDARD" | "EXCELLENCE" | "MASTER";

interface CertificatProps {
  nom: string;
  prenom: string;
  formation: string;
  score: number;
  duree: number;
  date: Date;
  mention?: Mention;
  variante?: Variante;
  numeroCertificat?: string;
}

// ============================================================
// HELPERS
// ============================================================

const getMention = (score: number): Mention => {
  if (score >= 90) return "Félicitations";
  if (score >= 75) return "Très Bien";
  return "Bien";
};

const getVariante = (score: number): Variante => {
  if (score >= 90) return "MASTER";
  if (score >= 85) return "EXCELLENCE";
  return "STANDARD";
};

const formatDateFr = (date: Date): string => {
  const mois = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  const jour = date.getDate();
  const m = mois[date.getMonth()];
  const annee = date.getFullYear();
  return `${jour} ${m} ${annee}`;
};

const generateNumero = (nom: string, date: Date): string => {
  const year = date.getFullYear();
  const hash = Math.abs(
    nom.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 37 + date.getMonth() * 13
  ) % 9000 + 1000;
  return `ACA${year}-${hash}`;
};

// ============================================================
// PALETTE & CONFIG PAR VARIANTE
// ============================================================

const varianteConfig = {
  STANDARD: {
    borderWidth: "3px",
    borderWidth2: "1px",
    borderGap: "6px",
    sealSize: 80,
    sealColor: "#c8a96e",
    ribbon: null,
    bgGradient: "linear-gradient(135deg, #FFF8F0 0%, #FFFCF7 50%, #FFF8F0 100%)",
    titleGlow: false,
    premium: false,
  },
  EXCELLENCE: {
    borderWidth: "5px",
    borderWidth2: "2px",
    borderGap: "8px",
    sealSize: 96,
    sealColor: "#b8860b",
    ribbon: "EXCELLENCE",
    bgGradient: "linear-gradient(135deg, #FFF8F0 0%, #FFFEF5 40%, #FFF3E0 60%, #FFF8F0 100%)",
    titleGlow: true,
    premium: false,
  },
  MASTER: {
    borderWidth: "6px",
    borderWidth2: "3px",
    borderGap: "10px",
    sealSize: 112,
    sealColor: "#8B6914",
    ribbon: "MASTER",
    bgGradient: "linear-gradient(135deg, #FFF5E0 0%, #FFFCF0 30%, #FFF8E8 60%, #FFF5E0 100%)",
    titleGlow: true,
    premium: true,
  },
};

// ============================================================
// SVG COMPONENTS
// ============================================================

const LogoAcademiaPro: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg width={size * 2.5} height={size} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mortarboard cap */}
    <polygon points="100,8 140,28 100,48 60,28" fill="none" stroke="#c8a96e" strokeWidth="2" />
    <polygon points="100,8 140,28 100,48 60,28" fill="url(#logoGold)" opacity="0.15" />
    <line x1="140" y1="28" x2="140" y2="44" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" />
    <circle cx="140" cy="46" r="3" fill="#c8a96e" />
    {/* Stars */}
    {[85, 100, 115].map((x, i) => (
      <text key={i} x={x} y="36" textAnchor="middle" fontSize="8" fill="#c8a96e" opacity="0.8">★</text>
    ))}
    {/* Text */}
    <text x="100" y="62" textAnchor="middle" fontSize="16" fontWeight="700"
      fontFamily="Georgia, serif" fill="#c8a96e" letterSpacing="3">
      AcadémIA
    </text>
    <text x="100" y="75" textAnchor="middle" fontSize="9" fontWeight="400"
      fontFamily="Georgia, serif" fill="#c8a96e" letterSpacing="6" opacity="0.9">
      P R O
    </text>
    <defs>
      <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c8a96e" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
    </defs>
  </svg>
);

const OrnementalDivider: React.FC<{ width?: number; height?: number }> = ({ width = 600, height = 24 }) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1={height / 2} x2={width * 0.35} y2={height / 2} stroke="#c8a96e" strokeWidth="1" opacity="0.7" />
    <line x1={width * 0.65} y1={height / 2} x2={width} y2={height / 2} stroke="#c8a96e" strokeWidth="1" opacity="0.7" />
    {/* Left ornament */}
    <path d={`M ${width * 0.32} ${height / 2} Q ${width * 0.34} ${height * 0.2} ${width * 0.36} ${height / 2} Q ${width * 0.34} ${height * 0.8} ${width * 0.32} ${height / 2}`}
      fill="#c8a96e" opacity="0.8" />
    {/* Right ornament */}
    <path d={`M ${width * 0.68} ${height / 2} Q ${width * 0.66} ${height * 0.2} ${width * 0.64} ${height / 2} Q ${width * 0.66} ${height * 0.8} ${width * 0.68} ${height / 2}`}
      fill="#c8a96e" opacity="0.8" />
    {/* Center diamond */}
    <polygon points={`${width / 2},${height * 0.1} ${width * 0.515},${height / 2} ${width / 2},${height * 0.9} ${width * 0.485},${height / 2}`}
      fill="#c8a96e" />
    {/* Side dots */}
    {[-24, -14, 14, 24].map((offset, i) => (
      <circle key={i} cx={width / 2 + offset} cy={height / 2} r="2" fill="#c8a96e" opacity="0.7" />
    ))}
    {/* Fleur-de-lis inspired small shapes */}
    <text x={width * 0.42} y={height / 2 + 4} textAnchor="middle" fontSize="10" fill="#c8a96e" opacity="0.6">✦</text>
    <text x={width * 0.58} y={height / 2 + 4} textAnchor="middle" fontSize="10" fill="#c8a96e" opacity="0.6">✦</text>
  </svg>
);

const OfficialSeal: React.FC<{ size: number; color: string; variante: Variante }> = ({ size, color, variante }) => {
  const isLarge = variante === "MASTER";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c8a96e" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#8B6914" stopOpacity="1" />
          <stop offset="100%" stopColor="#c8a96e" stopOpacity="0.9" />
        </linearGradient>
        <filter id="sealGlow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer ring with notches */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i * 10 * Math.PI) / 180;
        const x1 = 50 + 46 * Math.cos(angle);
        const y1 = 50 + 46 * Math.sin(angle);
        const x2 = 50 + 42 * Math.cos(angle);
        const y2 = 50 + 42 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" opacity="0.7" />;
      })}

      <circle cx="50" cy="50" r="40" stroke="url(#sealGrad)" strokeWidth={isLarge ? "2.5" : "2"} fill="none" filter="url(#sealGlow)" />
      <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="0.5" fill="none" opacity="0.5" />
      <circle cx="50" cy="50" r="30" stroke="url(#sealGrad)" strokeWidth="1" fill="#FFF8F0" opacity="0.9" />

      {/* Center icon - graduation cap */}
      <polygon points="50,28 63,35 50,42 37,35" fill="none" stroke={color} strokeWidth="1.5" />
      <polygon points="50,28 63,35 50,42 37,35" fill={color} opacity="0.2" />
      <line x1="63" y1="35" x2="63" y2="43" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="63" cy="44" r="1.5" fill={color} />

      {/* Stars */}
      <text x="50" y="56" textAnchor="middle" fontSize="6" fill={color}>★ ★ ★</text>

      {/* Curved text */}
      <path id="topArc" d="M 15,50 A 35,35 0 0,1 85,50" fill="none" />
      <path id="botArc" d="M 18,52 A 33,33 0 0,0 82,52" fill="none" />
      <text fontSize="5.5" fill={color} fontFamily="Georgia, serif" letterSpacing="1.5" fontWeight="600">
        <textPath href="#topArc" startOffset="10%">AcadémIA Pro · Officiel</textPath>
      </text>
      <text fontSize="4.5" fill={color} fontFamily="Georgia, serif" letterSpacing="1" opacity="0.8">
        <textPath href="#botArc" startOffset="15%">academiapro.fr · Certifié</textPath>
      </text>

      {/* Corner ornaments */}
      {variante === "MASTER" && (
        <>
          <text x="50" y="72" textAnchor="middle" fontSize="7" fill={color} opacity="0.8">✦</text>
        </>
      )}
    </svg>
  );
};

const QRCodePlaceholder: React.FC<{ numero: string }> = ({ numero }) => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="52" height="52" rx="2" fill="white" stroke="#c8a96e" strokeWidth="0.5" />
    {/* QR pattern simulation */}
    {[0, 1, 2, 3, 4, 5, 6].map(row =>
      [0, 1, 2, 3, 4, 5, 6].map(col => {
        const isCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
        const isData = (row + col + row * col) % 3 === 0;
        if (!isCorner && !isData) return null;
        return (
          <rect key={`${row}-${col}`} x={4 + col * 6.5} y={4 + row * 6.5} width="5.5" height="5.5"
            fill={isCorner ? "#8B6914" : "#c8a96e"} rx="0.5" opacity={isCorner ? 1 : 0.7} />
        );
      })
    )}
    <text x="26" y="49" textAnchor="middle" fontSize="3.5" fill="#c8a96e" fontFamily="monospace"
      letterSpacing="0.3">{numero.slice(0, 8)}</text>
  </svg>
);

const RibbonBadge: React.FC<{ text: string; variante: Variante }> = ({ text, variante }) => {
  const isMaster = variante === "MASTER";
  const w = isMaster ? 160 : 140;
  const h = isMaster ? 34 : 28;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isMaster ? "#8B6914" : "#b8860b"} />
          <stop offset="50%" stopColor={isMaster ? "#c8a96e" : "#d4a843"} />
          <stop offset="100%" stopColor={i