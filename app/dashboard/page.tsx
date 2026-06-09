```tsx
"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  id: number;
  title: string;
  completed: boolean;
}

interface Formation {
  id: number;
  title: string;
  progress: number;
  modulesCompleted: number;
  totalModules: number;
  modules: Module[];
  lastModule: string;
  category: string;
}

interface LiveSession {
  id: number;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  joinUrl: string;
}

interface Certificate {
  id: number;
  title: string;
  issueDate: string;
  credentialId: string;
}

interface Notification {
  id: number;
  message: string;
  type: "info" | "warning" | "success";
  time: string;
  read: boolean;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockUser = {
  firstName: "Alexandre",
  lastName: "Moreau",
  avatar: "AM",
  plan: "Pro",
};

const mockFormations: Formation[] = [
  {
    id: 1,
    title: "Intelligence Artificielle & Machine Learning",
    progress: 68,
    modulesCompleted: 17,
    totalModules: 25,
    lastModule: "Module 18 — Réseaux de neurones convolutifs",
    category: "IA & Data",
    modules: [
      { id: 1, title: "Introduction à l'IA", completed: true },
      { id: 2, title: "Python pour la Data Science", completed: true },
      { id: 3, title: "Réseaux de neurones", completed: false },
    ],
  },
  {
    id: 2,
    title: "Leadership & Management Agile",
    progress: 42,
    modulesCompleted: 8,
    totalModules: 19,
    lastModule: "Module 9 — Facilitation d'équipe",
    category: "Management",
    modules: [
      { id: 1, title: "Fondements du leadership", completed: true },
      { id: 2, title: "Méthodes agiles", completed: true },
      { id: 3, title: "Communication non-violente", completed: false },
    ],
  },
  {
    id: 3,
    title: "Marketing Digital Avancé",
    progress: 91,
    modulesCompleted: 20,
    totalModules: 22,
    lastModule: "Module 21 — Analytics & ROI",
    category: "Marketing",
    modules: [
      { id: 1, title: "SEO avancé", completed: true },
      { id: 2, title: "Publicité programmatique", completed: true },
      { id: 3, title: "Analytics & ROI", completed: true },
    ],
  },
];

const mockLiveSessions: LiveSession[] = [
  {
    id: 1,
    title: "Deep Learning en pratique — Cas concrets",
    instructor: "Dr. Sophie Laurent",
    date: "Aujourd'hui",
    time: "18h00",
    duration: "2h",
    joinUrl: "#",
  },
  {
    id: 2,
    title: "Sprint Planning & OKRs",
    instructor: "Thomas Berger",
    date: "Jeudi 23 Jan.",
    time: "14h00",
    duration: "1h30",
    joinUrl: "#",
  },
];

const mockCertificates: Certificate[] = [
  {
    id: 1,
    title: "Python Data Science Professional",
    issueDate: "15 Nov. 2024",
    credentialId: "ACA-2024-78542",
  },
  {
    id: 2,
    title: "Fondamentaux du Management",
    issueDate: "3 Oct. 2024",
    credentialId: "ACA-2024-65219",
  },
  {
    id: 3,
    title: "Growth Hacking Certification",
    issueDate: "22 Août 2024",
    credentialId: "ACA-2024-51087",
  },
];

const mockNotifications: Notification[] = [
  {
    id: 1,
    message: "Votre classe live commence dans 30 minutes",
    type: "warning",
    time: "Il y a 5 min",
    read: false,
  },
  {
    id: 2,
    message: "Nouveau certificat disponible à télécharger",
    type: "success",
    time: "Il y a 2h",
    read: false,
  },
  {
    id: 3,
    message: "Rappel : Quiz à compléter avant vendredi",
    type: "info",
    time: "Hier",
    read: true,
  },
];

const aiResponses = [
  "Bien sûr ! Je peux vous aider avec ce sujet. Votre formation en IA couvre exactement ce concept au module 18. Souhaitez-vous que je vous génère un résumé personnalisé ?",
  "Excellente question ! D'après votre progression, vous maîtrisez déjà 68% du cours. Je vous recommande de vous concentrer sur les réseaux convolutifs avant la prochaine classe live.",
  "Je comprends. N'hésitez pas à me poser des questions spécifiques sur vos cours. Je suis disponible 24h/24 pour vous accompagner dans votre apprentissage.",
  "Votre rythme d'apprentissage est excellent ! Vous progressez 23% plus vite que la moyenne des apprenants sur cette formation.",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value, size = "default" }: { value: number; size?: "small" | "default" }) {
  const height = size === "small" ? "h-1" : "h-1.5";
  return (
    <div className={`w-full bg-white/10 rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} rounded-full transition-all duration-700 ease-out`}
        style={{
          width: `${value}%`,
          background: "linear-gradient(90deg, #c8a96e 0%, #e8c98e 100%)",
        }}
      />
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "pro" | "live" | "success" }) {
  const styles = {
    default: "bg-white/10 text-white/60",
    pro: "text-[#c8a96e] border border-[#c8a96e]/40",
    live: "bg-red-500/20 text-red-400 border border-red-500/30",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full tracking-wider uppercase ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ─── Chat Component ───────────────────────────────────────────────────────────

function AIChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Bonjour Alexandre ! Je suis votre assistant IA personnel. Comment puis-je vous aider dans votre apprentissage aujourd'hui ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMsg]);
    }, 1500);
  };

  return (
    <div
      className="fixed bottom-24 right-4 md:right-8 w-[calc(100vw-2rem)] max-w-sm rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col"
      style={{
        background: "linear-gradient(160deg, #0d0d12 0%, #080810 100%)",
        border: "1px solid rgba(200,169,110,0.2)",
        height: "480px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #c8a96e, #e8c98e)" }}
            >
              IA
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d0d12]" />
          </div>
          <div>
            <p className="text-white text-sm font-medium" style={{ fontFamily: "Georgia, serif" }}>
              Agent IA
            </p>
            <p className="text-[10px] text-emerald-400">En ligne · Réponse immédiate</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={