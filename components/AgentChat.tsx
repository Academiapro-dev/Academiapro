```tsx
import React, { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

interface QuickSuggestion {
  id: string;
  label: string;
  question: string;
}

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  {
    id: "1",
    label: "📚 Révision",
    question: "Peux-tu m'expliquer les concepts clés du module en cours ?",
  },
  {
    id: "2",
    label: "🧩 Exercice",
    question: "Propose-moi un exercice pratique sur ce que j'ai appris.",
  },
  {
    id: "3",
    label: "📝 Résumé",
    question: "Fais-moi un résumé des points importants vus aujourd'hui.",
  },
  {
    id: "4",
    label: "🎯 Objectifs",
    question: "Quels sont les objectifs pédagogiques de cette formation ?",
  },
  {
    id: "5",
    label: "💡 Astuce",
    question: "Donne-moi une astuce pour mieux mémoriser ce cours.",
  },
  {
    id: "6",
    label: "📅 Planning",
    question: "Comment organiser mon planning d'apprentissage efficacement ?",
  },
];

const STORAGE_KEY = "academia_chat_history";

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-2 mb-4">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)" }}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16.5 13M12 19c-2.21 0-4 .89-4 2v1h8v-1c0-1.11-1.79-2-4-2z" />
      </svg>
    </div>
    <div
      className="px-4 py-3 rounded-2xl rounded-bl-sm"
      style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }}
    >
      <div className="flex gap-1 items-center h-5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full inline-block"
            style={{
              backgroundColor: "#c8a96e",
              animation: `bounce 1.2s infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2 mb-4">
        <div className="max-w-[75%] flex flex-col items-end">
          <div
            className="px-4 py-3 rounded-2xl rounded-br-sm text-white text-sm leading-relaxed"
            style={{
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
            }}
          >
            {message.content}
          </div>
          <span className="text-xs mt-1 opacity-50" style={{ color: "#c8a96e" }}>
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, #2a2a4a, #1a1a3e)",
            border: "1px solid #c8a96e",
            color: "#c8a96e",
          }}
        >
          Moi
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)" }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16.5 13M12 19c-2.21 0-4 .89-4 2v1h8v-1c0-1.11-1.79-2-4-2z" />
        </svg>
      </div>
      <div className="max-w-[75%] flex flex-col">
        <div
          className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed"
          style={{
            backgroundColor: "#16213e",
            border: "1px solid #2a2a4a",
            color: "#e8e8f0",
          }}
        >
          {message.content}
        </div>
        <span className="text-xs mt-1 opacity-50" style={{ color: "#c8a96e" }}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

const EscalationModal: React.FC<{
  onClose: () => void;
  onConfirm: () => void;
}> = ({ onClose, onConfirm }) => (
  <div className="absolute inset-0 flex items-center justify-center z-50 p-4"
    style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
  >
    <div
      className="w-full max-w-sm rounded-2xl p-6"
      style={{
        backgroundColor: "#16213e",
        border: "1px solid #c8a96e",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(200, 169, 110, 0.2)" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#c8a96e">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <h3 className="font-semibold text-white text-lg">Contacter le support</h3>
      </div>
      <p className="text-sm mb-6" style={{ color: "#a8a8c0" }}>
        Vous allez être mis en relation avec un conseiller pédagogique humain.
        Temps d'attente estimé : <span style={{ color: "#c8a96e" }}>~5 minutes</span>
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: "#2a2a4a",
            color: "#a8a8c0",
            border: "1px solid #3a3a5a",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3a3a5a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2a2a4a")}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #c8a96e, #a07840)",
            color: "white",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "linear-gradient(135deg, #d4b87e, #b08850)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "linear-gradient(135deg, #c8a96e, #a