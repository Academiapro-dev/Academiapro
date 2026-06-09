```tsx
// app/components/VirtualClassroom.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Participant {
  id: string;
  name: string;
  videoTrack?: MediaStreamTrack | null;
  audioTrack?: MediaStreamTrack | null;
  isHandRaised: boolean;
  joinedAt: Date;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isAI: boolean;
  type: "chat" | "question";
}

interface SessionData {
  sessionId: string;
  roomName: string;
  studentId: string;
  studentName: string;
  courseId: string;
}

// ─── Supabase Client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

// ─── AI Tutor Responses ───────────────────────────────────────────────────────
const AI_RESPONSES: Record<string, string> = {
  default:
    "Je suis votre assistant IA. N'hésitez pas à poser vos questions sur le cours.",
  question:
    "Excellente question ! Laissez-moi vous expliquer ce concept en détail...",
  help: "Je vais vous aider. Pouvez-vous préciser votre difficulté ?",
  bonjour: "Bonjour ! Bienvenue dans la session. Comment puis-je vous aider ?",
};

const getAIResponse = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("bonjour") || lower.includes("salut"))
    return AI_RESPONSES.bonjour;
  if (lower.includes("aide") || lower.includes("help"))
    return AI_RESPONSES.help;
  if (lower.includes("?")) return AI_RESPONSES.question;
  return AI_RESPONSES.default;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const AIAvatarDisplay = ({
  isRecording,
  isSpeaking,
}: {
  isRecording: boolean;
  isSpeaking: boolean;
}) => (
  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0a0a0f] to-[#0f0f1a] rounded-2xl overflow-hidden border border-[#2a2a3a]">
    {/* Animated background rings */}
    <div className="absolute inset-0 flex items-center justify-center">
      {isSpeaking && (
        <>
          <div className="absolute w-80 h-80 rounded-full border border-[#c9a84c]/10 animate-ping" />
          <div
            className="absolute w-64 h-64 rounded-full border border-[#c9a84c]/20 animate-ping"
            style={{ animationDelay: "0.3s" }}
          />
        </>
      )}
      <div className="absolute w-96 h-96 rounded-full bg-[#c9a84c]/3 blur-3xl" />
    </div>

    {/* Avatar container */}
    <div className="relative z-10 flex flex-col items-center gap-6">
      <div
        className={`relative w-48 h-48 rounded-full border-4 ${
          isSpeaking ? "border-[#c9a84c]" : "border-[#2a2a3a]"
        } transition-all duration-300 overflow-hidden shadow-2xl`}
      >
        {/* Avatar gradient face */}
        <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            {/* Head */}
            <circle cx="50" cy="35" r="22" fill="#c9a84c" opacity="0.9" />
            {/* Body */}
            <ellipse cx="50" cy="75" rx="28" ry="20" fill="#1e3a5f" />
            {/* Collar */}
            <path
              d="M35 65 Q50 70 65 65 L62 80 Q50 85 38 80 Z"
              fill="#c9a84c"
              opacity="0.3"
            />
            {/* Eyes */}
            <circle cx="43" cy="32" r="3" fill="#0a0a0f" />
            <circle cx="57" cy="32" r="3" fill="#0a0a0f" />
            <circle cx="44" cy="31" r="1" fill="white" />
            <circle cx="58" cy="31" r="1" fill="white" />
            {/* Smile */}
            <path
              d="M43 40 Q50 46 57 40"
              stroke="#0a0a0f"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 bg-[#c9a84c] rounded-full animate-bounce"
                style={{
                  height: `${8 + i * 4}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <h3 className="text-[#c9a84c] text-xl font-bold tracking-wide">
          Prof. AcadémIA
        </h3>
        <p className="text-[#6a6a8a] text-sm mt-1">Formateur IA • En ligne</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs">Actif</span>
          {isRecording && (
            <>
              <div className="w-1 h-1 rounded-full bg-[#6a6a8a]" />
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs">REC</span>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Corner decoration */}
    <div className="absolute top-4 left-4 text-[#c9a84c]/20 text-xs font-mono">
      AI_TUTOR_v2.4
    </div>
    <div className="absolute bottom-4 right-4 text-[#c9a84c]/20 text-xs font-mono">
      LIVE
    </div>
  </div>
);

const ParticipantCard = ({ participant }: { participant: Participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.videoTrack) {
      videoRef.current.srcObject = new MediaStream([participant.videoTrack]);
    }
  }, [participant.videoTrack]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#0f0f1a] border border-[#2a2a3a] hover:border-[#c9a84c]/40 transition-all duration-200 group">
      <div className="aspect-video bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e] flex items-center justify-center">
        {participant.videoTrack ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#8b6914] flex items-center justify-center text-[#0a0a0f] font-bold text-lg">
              {participant.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-xs font-medium truncate">
          {participant.name}
        </p>
      </div>

      {/* Hand raised indicator */}
      {participant.isHandRaised && (
        <div className="absolute top-2 right-2 bg-yellow-500/90 rounded-full p-1 animate-bounce">
          <span className="text-xs">✋</span>
        </div>
      )}

      {/* Audio indicator */}
      {participant.audioTrack && (
        <div className="absolute top-2 left-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}
    </div>
  );
};

const SessionTimer = ({ startTime }: { startTime: Date }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const format = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 bg-[#0f0f1a] border border-[#2a2a3a] rounded-xl px-4 py-2">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[#c9a84c] font-mono text-sm font-bold tracking-widest">
        {format(hours)}:{format(minutes)}:{format(seconds)}
      </span>
      <span className="text-[#6a6a8a] text-xs">Session</span>
    </div>
  );
};

const WhiteboardPanel = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);