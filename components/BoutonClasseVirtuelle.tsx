"use client";
import React, { useState, useEffect } from "react";

// ============================================================
// TYPES
// ============================================================
type SessionStatus = "live" | "upcoming" | "replay" | "none";
type AccompagnementLevel = "basic" | "premium" | "live";

interface Session {
  id: string;
  title: string;
  formation: string;
  startTime: Date;
  endTime: Date;
  replayUrl?: string;
  liveUrl?: string;
}

interface VirtualClassButtonProps {
  userLevel: AccompagnementLevel;
  sessions?: Session[];
  upgradeUrl?: string;
}

// ============================================================
// MOCK DATA (remplacer par API)
// ============================================================
const mockSessions: Session[] = [
  {
    id: "1",
    title: "Algorithmique Avancée",
    formation: "Développement Web Full-Stack",
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // dans 2h
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    liveUrl: "https://meet.academia-pro.fr/algo-avancee",
    replayUrl: "https://replay.academia-pro.fr/session-1",
  },
];

// ============================================================
// HOOKS
// ============================================================
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!targetDate) return;

    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0 });
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function useSessionStatus(sessions: Session[]): {
  status: SessionStatus;
  currentSession: Session | null;
  nextSession: Session | null;
} {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();

  const liveSession = sessions.find(
    (s) => s.startTime.getTime() <= now && s.endTime.getTime() >= now
  );

  const upcomingSessions = sessions
    .filter((s) => s.startTime.getTime() > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const nextSession = upcomingSessions[0] || null;

  const replaySession = sessions.find(
    (s) => s.endTime.getTime() < now && s.replayUrl
  );

  let status: SessionStatus = "none";
  if (liveSession) status = "live";
  else if (nextSession) status = "upcoming";
  else if (replaySession) status = "replay";

  return {
    status,
    currentSession: liveSession || null,
    nextSession: liveSession || nextSession || replaySession || null,
  };
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// Icône caméra SVG
const CameraIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M4 4h10.667L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
    <path d="M2 4h2v2H2V4zm0 14h2v2H2v-2z" opacity={0} />
  </svg>
);

const VideoIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M15 8v8H5V8h10zm1-2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4V6.5l-4 4V7a1 1 0 0 0-1-1z" />
  </svg>
);

const PlayIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

const LockIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
  </svg>
);

const SparklesIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const ClockIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// Unité du countdown
const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div
      className="
        w-12 h-12 rounded-lg flex items-center justify-center
        bg-[#0f1117] border border-[#c8a96e]/20
        text-[#c8a96e] font-mono text-xl font-bold
        shadow-inner
      "
      aria-label={`${value} ${label}`}
    >
      {String(value).padStart(2, "0")}
    </div>
    <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
      {label}
    </span>
  </div>
);

// Séparateur countdown
const CountdownSep = () => (
  <span className="text-[#c8a96e]/50 font-mono text-xl font-bold pb-4">:</span>
);

// Badge de niveau
const LevelBadge = ({ level }: { level: AccompagnementLevel }) => {
  const config = {
    basic: { label: "Basic", color: "text-gray-400 border-gray-600" },
    premium: { label: "Premium", color: "text-[#c8a96e] border-[#c8a96e]/40" },
    live: { label: "Live", color: "text-emerald-400 border-emerald-500/40" },
  };
  const { label, color } = config[level];
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${color} uppercase tracking-widest`}
    >
      {label}
    </span>
  );
};

// ============================================================
// UPGRADE NOTICE
// ============================================================
const UpgradeNotice = ({
  upgradeUrl,
  userLevel,
}: {
  upgradeUrl: string;
  userLevel: AccompagnementLevel;
}) => (
  <div
    className="
      relative overflow-hidden rounded-2xl
      bg-gradient-to-br from-[#0d1117] to-[#12181f]
      border border-[#c8a96e]/15
      p-5
    "
    role="alert"
    aria-live="polite"
  >
    {/* Glow décoratif */}
    <div
      className="
        absolute -top-8 -right-8 w-32 h-32 rounded-full
        bg-[#c8a96e]/5 blur-2xl pointer-events-none
      "
      aria-hidden="true"
    />

    <div className="flex items-start gap-3">
      <div
        className="
          shrink-0 w-9 h-9 rounded-xl
          bg-[#c8a96e]/10 border border-[#c8a96e]/20
          flex items-center justify-center
        "
        aria-hidden="true"
      >
        <LockIcon className="w-4 h-4 text-[#c8a96e]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white mb-0.5">
          Accès Classes Virtuelles
        </p>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">
          Votre formule{" "}
          <span className="text-[#c8a96e] font-medium capitalize">
            {userLevel}
          </span>{" "}
          ne comprend pas les sessions en direct