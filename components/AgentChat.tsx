```tsx
import React, { useState, useEffect, useRef, useCallback } from "react";

// Types
interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

interface Formation {
  id: string;
  nom: string;
}

interface AgentChatProps {
  formationEnCours?: Formation;
  utilisateurId?: string;
}

const STORAGE_KEY = "academia_chat_history";

const SUGGESTIONS_PAR_FORMATION: Record<string, string[]> = {
  default: [
    "Comment puis-je progresser plus vite ?",
    "Expliquez-moi ce concept",
    "Quelles ressources recommandez-vous ?",
    "Comment valider ce module ?",
  ],
  mathematiques: [
    "Comment résoudre cette équation ?",
    "Expliquez les intégrales",
    "Aide-moi avec les probabilités",
    "Réviser les matrices",
  ],
  programmation: [
    "Déboguez ce code pour moi",
    "Expliquez la récursivité",
    "Bonnes pratiques React ?",
    "Comment optimiser mes algorithmes ?",
  ],
  langue: [
    "Corrigez ma grammaire",
    "Vocabulaire du chapitre 3",
    "Aide avec la conjugaison",
    "Exercices de compréhension",
  ],
};

const generateId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-2 mb-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center text-sm">
      🤖
    </div>
    <div
      className="px-4 py-3 rounded-2xl rounded-bl-sm"
      style={{ backgroundColor: "#252545" }}
    >
      <div className="flex gap-1 items-center h-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: "#c8a96e",
              animationDelay: `${i * 0.15}s`,
              animationDuration: "0.8s",
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";
  const timeStr = message.timestamp.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex items-end gap-2 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center text-sm shadow-lg">
          🤖
        </div>
      )}
      {isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
          style={{ backgroundColor: "#c8a96e", color: "#1a1a2e" }}
        >
          V
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${
            isUser
              ? "rounded-br-sm text-white"
              : "rounded-bl-sm text-gray-100"
          }`}
          style={{
            backgroundColor: isUser ? "#c8a96e" : "#252545",
            color: isUser ? "#1a1a2e" : "#e8e8f0",
            fontWeight: isUser ? "500" : "400",
          }}
        >
          {message.content}
        </div>
        <span className="text-xs text-gray-500 px-1">{timeStr}</span>
      </div>
    </div>
  );
};

const AgentChat: React.FC<AgentChatProps> = ({
  formationEnCours,
  utilisateurId = "user_demo",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formationKey = formationEnCours?.id || "default";
  const suggestions =
    SUGGESTIONS_PAR_FORMATION[formationKey] ||
    SUGGESTIONS_PAR_FORMATION["default"];

  // Charger historique depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${utilisateurId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(withDates);
      } else {
        // Message de bienvenue
        const welcomeMsg: Message = {
          id: generateId(),
          role: "agent",
          content: `Bonjour ! Je suis votre assistant IA AcadémIA Pro 🎓\n\nJe suis disponible 24h/24 pour vous aider dans votre apprentissage${formationEnCours ? ` en **${formationEnCours.nom}**` : ""}.\n\nComment puis-je vous aider aujourd'hui ?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
      }
    } catch (e) {
      console.error("Erreur chargement historique:", e);
    }
  }, [utilisateurId, formationEnCours]);

  // Sauvegarder historique
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(
          `${STORAGE_KEY}_${utilisateurId}`,
          JSON.stringify(messages.slice(-100))
        );
      } catch (e) {
        console.error("Erreur sauvegarde historique:", e);
      }
    }
  }, [messages, utilisateurId]);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const callAgentAPI = useCallback(
    async (userMessage: string): Promise<string> => {
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/agent-tuteur", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            utilisateurId,
            formationId: formationEnCours?.id,
            formationNom: formationEnCours?.nom,
            historique: messages.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();
        return data.reponse || data.message || "Je n'ai pas pu traiter votre demande.";
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        // Simulation réponse en cas d'erreur API (développement)
        console.warn("API non disponible, réponse simulée:", error);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 1500)
        );
        return getSimulatedResponse(userMessage);
      }
    },
    [messages, utilisateurId, formationEnCours]
  );

  const getSimulatedResponse = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes("bonjour") || lower.includes("salut")) {
      return "Bonjour ! Ravi de vous retrouver. Comment puis-je vous accompagner dans votre apprentissage aujourd'hui ? 😊";
    }
    if (lower.includes("aide") || lower.includes("help")) {
      return "Bien sûr ! Je suis là pour vous aider. Pouvez-vous me préciser sur quel point vous avez besoin d'assistance ? Je peux vous expliquer des concepts, corriger des exercices, ou vous guider dans votre parcours.";
    }
    if (lower.includes("exercice") || lower.includes("problème")) {
      return "Partagez l'exercice avec moi et je vais l'analyser étape par étape. N'hésitez pas à me donner tous les détails pour que je puisse vous apporter la meilleure aide possible ! 📝";
    }
    return "Excellente question ! Laissez-moi vous expliquer ce concept en détail. En tant que votre assistant IA, je suis là pour rendre votre apprentissage plus efficace et personnalisé. Avez-vous des exemples spécifiques sur lesquels vous aimeriez travailler ?";
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isTyping) return;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsTyping(true);
      setShowSuggestions(false);

      try {
        const response = await callAgentAPI(content.trim());
        const agentMsg: Message = {
          id: generateId(),
          role: "agent",
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMsg]);

        if (!isOpen) {
          setUnreadCount((prev) => prev + 1