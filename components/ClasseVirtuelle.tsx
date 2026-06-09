```tsx
import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isHandRaised: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isInBreakout: boolean;
  joinedAt: Date;
  isSigned: boolean;
  role: "student" | "instructor" | "ai-avatar";
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: "text" | "system" | "emoji";
}

interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[];
  maxParticipants: number;
}

interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  size: number;
  type: "draw" | "erase" | "start";
}

type ActivePanel = "chat" | "participants" | "whiteboard" | "breakout" | null;

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: "ai-1",
    name: "Prof. Aria (IA)",
    isHandRaised: false,
    isMuted: false,
    isCameraOff: false,
    isInBreakout: false,
    joinedAt: new Date(),
    isSigned: true,
    role: "ai-avatar",
  },
  {
    id: "user-1",
    name: "Sophie Martin",
    isHandRaised: true,
    isMuted: false,
    isCameraOff: false,
    isInBreakout: false,
    joinedAt: new Date(),
    isSigned: true,
    role: "student",
  },
  {
    id: "user-2",
    name: "Thomas Dupont",
    isHandRaised: false,
    isMuted: true,
    isCameraOff: true,
    isInBreakout: false,
    joinedAt: new Date(),
    isSigned: true,
    role: "student",
  },
  {
    id: "user-3",
    name: "Emma Leroy",
    isHandRaised: false,
    isMuted: false,
    isCameraOff: false,
    isInBreakout: true,
    joinedAt: new Date(),
    isSigned: true,
    role: "student",
  },
  {
    id: "user-4",
    name: "Lucas Bernard",
    isHandRaised: false,
    isMuted: true,
    isCameraOff: false,
    isInBreakout: false,
    joinedAt: new Date(),
    isSigned: false,
    role: "student",
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    senderId: "ai-1",
    senderName: "Prof. Aria (IA)",
    content: "Bienvenue dans cette session ! Je suis votre formateur IA pour aujourd'hui. 🎓",
    timestamp: new Date(Date.now() - 300000),
    type: "text",
  },
  {
    id: "msg-2",
    senderId: "system",
    senderName: "Système",
    content: "Sophie Martin a rejoint la session",
    timestamp: new Date(Date.now() - 240000),
    type: "system",
  },
  {
    id: "msg-3",
    senderId: "user-1",
    senderName: "Sophie Martin",
    content: "Bonjour tout le monde ! Prête pour ce cours ! 👋",
    timestamp: new Date(Date.now() - 180000),
    type: "text",
  },
  {
    id: "msg-4",
    senderId: "user-2",
    senderName: "Thomas Dupont",
    content: "Peut-on avoir le support de cours en PDF svp ?",
    timestamp: new Date(Date.now() - 120000),
    type: "text",
  },
];

const MOCK_BREAKOUT_ROOMS: BreakoutRoom[] = [
  { id: "br-1", name: "Groupe A - Exercice", participants: ["user-3"], maxParticipants: 4 },
  { id: "br-2", name: "Groupe B - Discussion", participants: [], maxParticipants: 4 },
  { id: "br-3", name: "Groupe C - Projet", participants: [], maxParticipants: 4 },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

// --- Avatar Component ---
const Avatar: React.FC<{ name: string; size?: "sm" | "md" | "lg"; isAI?: boolean }> = ({
  name,
  size = "md",
  isAI = false,
}) => {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 relative ${
        isAI
          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900"
          : "bg-gradient-to-br from-gray-600 to-gray-700 text-yellow-400"
      }`}
    >
      {getInitials(name)}
      {isAI && (
        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 text-xs">
          ✦
        </span>
      )}
    </div>
  );
};

// --- Status Indicator ---
const StatusDot: React.FC<{ active: boolean; pulse?: boolean }> = ({ active, pulse = false }) => (
  <span
    className={`inline-block w-2 h-2 rounded-full ${
      active ? "bg-green-400" : "bg-gray-500"
    } ${pulse && active ? "animate-pulse" : ""}`}
  />
);

// --- Icon Button ---
const IconButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  badge?: number;
}> = ({ onClick, active = true, danger = false, disabled = false, title, children, badge }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`relative p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${
      danger
        ? "bg-red-600 hover:bg-red-500 text-white"
        : active
        ? "bg-gray-700 hover:bg-gray-600 text-white"
        : "bg-gray-800 hover:bg-gray-700 text-gray-400"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    {children}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </button>
);

// --- Video Tile ---
const VideoTile: React.FC<{
  participant: Participant;
  isMain?: boolean;
  isSelf?: boolean;
}> = ({ participant, isMain = false, isSelf = false }) => {
  const bgColors = [
    "from-blue-900 to-blue-800",
    "from-purple-900 to-purple-800",
    "from-teal-900 to-teal-800",
    "from-indigo-900 to-indigo-800",
  ];
  const colorIndex = participant.id.charCodeAt(participant.id.length - 1) % bgColors.length;

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${bgColors[colorIndex]} border ${
        isMain
          ? "border-yellow-400/50"
          : participant.isHandRaised
          ? "border-yellow-400 animate-pulse"
          : "border-gray-700/50"
      } flex items-center justify-center group`}
    >
      {/* Simulated video / camera off */}
      {participant.isCameraOff || participant.role === "ai-avatar" ? (
        <div className="flex flex-col items-center gap-2">
          {participant.role === "ai-avatar" ? (
            <div className="relative">
              <div
                className={`${
                  isMain ? "w-24 h-24" : "w-12 h-12"
                } rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center`}
              >
                <span className={`font-bold text-gray-900 ${isMain ? "text-3xl" : "text-lg"}`}>
                  {getInitials(participant.name)}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-gray-900 text-xs">✦</span>
              </div>
              {/* AI speaking animation */}
              <div className="absolute -inset-2 rounded-full border-2 border-yellow-400/30 animate-ping" />
            </div>
          ) : (
            <div
              className={`${isMain ? "w-20 h-20" : "w-10 h-10"} rounded-full bg-gray-700 flex items-center justify-center`}
            >
              <span className={`font-bold text-yellow-400 ${isMain ? "text-2xl" : "text-sm"}`}>
                {getInitials(participant.name)}
              </span>
            </div>
          )}
          {isMain && (
            <p className="text-gray-400 text-sm">
              {participant.role === "ai-avatar" ? "Avatar