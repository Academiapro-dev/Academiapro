```tsx
import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface Participant {
  id: string;
  name: string;
  role: "student" | "instructor" | "ai";
  isHandRaised: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isInBreakout: boolean;
  joinedAt: Date;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: "text" | "system" | "reaction";
}

interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[];
  maxCapacity: number;
}

interface WhiteboardElement {
  id: string;
  type: "pen" | "rect" | "circle" | "text" | "arrow";
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  text?: string;
}

interface SessionInfo {
  id: string;
  title: string;
  instructor: string;
  startTime: Date;
  duration: number;
  isRecording: boolean;
  recordingDuration: number;
}

type ActivePanel = "chat" | "participants" | "whiteboard" | "breakout" | null;
type DrawTool = "pen" | "rect" | "circle" | "text" | "arrow" | "eraser" | "select";

// ============================================================
// MOCK DATA & HELPERS
// ============================================================

const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: "ai-instructor",
    name: "Alex IA — Formateur",
    role: "ai",
    isHandRaised: false,
    isMuted: false,
    isCameraOff: false,
    isInBreakout: false,
    joinedAt: new Date(),
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=alex",
  },
  {
    id: "user-1",
    name: "Marie Dupont",
    role: "student",
    isHandRaised: true,
    isMuted: false,
    isCameraOff: false,
    isInBreakout: false,
    joinedAt: new Date(),
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marie",
  },
  {
    id: "user-2",
    name: "Thomas Martin",
    role: "student",
    isHandRaised: false,
    isMuted: true,
    isCameraOff: true,
    isInBreakout: false,
    joinedAt: new Date(),
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=thomas",
  },
  {
    id: "user-3",
    name: "Sophie Leroy",
    role: "student",
    isHandRaised: false,
    isMuted: false,
    isCameraOff: false,
    isInBreakout: true,
    joinedAt: new Date(),
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophie",
  },
  {
    id: "user-4",
    name: "Lucas Bernard",
    role: "student",
    isHandRaised: false,
    isMuted: true,
    isCameraOff: false,
    isInBreakout: false,
    joinedAt: new Date(),
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucas",
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    senderId: "system",
    senderName: "Système",
    content: "La session a démarré. Bienvenue dans AcadémIA Pro !",
    timestamp: new Date(Date.now() - 900000),
    type: "system",
  },
  {
    id: "m2",
    senderId: "ai-instructor",
    senderName: "Alex IA",
    content:
      "Bonjour à tous ! Aujourd'hui nous allons explorer les fondamentaux du Machine Learning. N'hésitez pas à lever la main pour poser vos questions.",
    timestamp: new Date(Date.now() - 600000),
    type: "text",
  },
  {
    id: "m3",
    senderId: "user-1",
    senderName: "Marie Dupont",
    content: "Bonjour Alex ! Très enthousiaste pour cette session 🎉",
    timestamp: new Date(Date.now() - 300000),
    type: "text",
  },
  {
    id: "m4",
    senderId: "user-2",
    senderName: "Thomas Martin",
    content: "Est-ce qu'on aura accès au support de cours après la session ?",
    timestamp: new Date(Date.now() - 120000),
    type: "text",
  },
];

const MOCK_BREAKOUT_ROOMS: BreakoutRoom[] = [
  { id: "br-1", name: "Groupe Alpha", participants: ["user-3"], maxCapacity: 4 },
  { id: "br-2", name: "Groupe Beta", participants: [], maxCapacity: 4 },
  { id: "br-3", name: "Groupe Gamma", participants: [], maxCapacity: 4 },
];

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

// ============================================================
// SVG ICONS
// ============================================================

const Icons = {
  Mic: ({ muted }: { muted?: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      {muted ? (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      ) : (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </svg>
  ),
  Camera: ({ off }: { off?: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      {off ? (
        <>
          <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </>
      )}
    </svg>
  ),
  Screen: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Hand: ({ raised }: { raised?: boolean }) => (
    <svg viewBox="0 0 24 24" fill={raised ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0