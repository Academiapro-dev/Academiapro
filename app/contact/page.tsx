```tsx
// app/contact/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mail,
  MessageCircle,
  X,
  ChevronDown,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  User,
  Loader2,
  Phone,
  MapPin,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type FormStatus = "idle" | "loading" | "success" | "error";

// ─── Constants ───────────────────────────────────────────────────────────────

const SUBJECTS = [
  { value: "formation", label: "Question formation" },
  { value: "technique", label: "Problème technique" },
  { value: "remboursement", label: "Remboursement" },
  { value: "partenariat", label: "Partenariat" },
  { value: "autre", label: "Autre" },
];

const SOCIAL_LINKS = [
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/academiapro", color: "#1DA1F2" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/academiapro", color: "#0A66C2" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/academiapro", color: "#E1306C" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@academiapro", color: "#FF0000" },
];

const AI_RESPONSES: Record<string, string> = {
  formation: "Nos formations couvrent l'IA, le Machine Learning, le Deep Learning et bien plus. Chaque parcours est adapté à votre niveau. Voulez-vous que je vous guide vers la formation idéale ?",
  remboursement: "Notre politique de remboursement est de 30 jours satisfait ou remboursé. Si vous avez effectué un achat récent et souhaitez un remboursement, je peux initier la procédure. Pouvez-vous me donner votre numéro de commande ?",
  technique: "Je suis désolé d'apprendre que vous rencontrez un problème technique. Pouvez-vous me décrire l'erreur que vous voyez ? (message d'erreur, navigateur utilisé, appareil) Je vais essayer de vous aider immédiatement.",
  partenariat: "Nous sommes ravis de votre intérêt pour un partenariat avec AcadémIA Pro ! Notre équipe partenariats étudie chaque proposition avec attention. Pouvez-vous me donner plus de détails sur votre organisation et le type de collaboration envisagée ?",
  bonjour: "Bonjour ! Je suis l'assistant IA d'AcadémIA Pro. Je suis là pour répondre à vos questions instantanément. Comment puis-je vous aider aujourd'hui ? 🎓",
  prix: "Nos tarifs varient selon les formations : de 49€ pour des cours individuels à 299€/mois pour un accès illimité Pro. Nous proposons aussi des tarifs étudiants et entreprises. Souhaitez-vous plus de détails sur un plan spécifique ?",
  default: "Merci pour votre message ! Je transmets votre demande à notre équipe. En attendant, sachez que notre équipe répond généralement sous 24h. Y a-t-il autre chose avec laquelle je peux vous aider immédiatement ?",
};

// ─── Utility functions ───────────────────────────────────────────────────────

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim() || data.name.trim().length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères";
  }
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Veuillez entrer une adresse email valide";
  }
  if (!data.subject) {
    errors.subject = "Veuillez sélectionner un sujet";
  }
  if (!data.message.trim() || data.message.trim().length < 10) {
    errors.message = "Le message doit contenir au moins 10 caractères";
  }
  return errors;
}

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("formation") || lower.includes("cours") || lower.includes("apprendre")) return AI_RESPONSES.formation;
  if (lower.includes("remboursement") || lower.includes("rembourser") || lower.includes("refund")) return AI_RESPONSES.remboursement;
  if (lower.includes("problème") || lower.includes("erreur") || lower.includes("bug") || lower.includes("technique")) return AI_RESPONSES.technique;
  if (lower.includes("partenariat") || lower.includes("collaboration") || lower.includes("partner")) return AI_RESPONSES.partenariat;
  if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("hello") || lower.includes("bonsoir")) return AI_RESPONSES.bonjour;
  if (lower.includes("prix") || lower.includes("tarif") || lower.includes("coût") || lower.includes("abonnement")) return AI_RESPONSES.prix;
  return AI_RESPONSES.default;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/40 to-transparent" />
      <Sparkles className="w-3 h-3 text-[#c8a96e]/60" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/40 to-transparent" />
    </div>
  );
}

function FloatingOrb({ className }: { className: string }) {
  return (
    <div className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`} />
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  name: keyof FormData;
  type?: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isTextarea?: boolean;
  isSelect?: boolean;
}

function InputField({ label, name, type = "text", placeholder, value, error, onChange, isTextarea, isSelect }: InputFieldProps) {
  const baseClasses = `w-full bg-[#0a0a0f] border rounded-xl px-4 py-3 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:border-transparent text-sm ${
    error
      ? "border-red-500/60 focus:ring-red-500/40"
      : "border-white/10 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e]/50 hover:border-white/20"
  }`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/70">
        {label} <span className="text-[#c8a96e]">*</span>
      </label>
      {isTextarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={5}
          className={`${baseClasses} resize-none`}
        />
      ) : isSelect ? (
        <div className="relative">
          <select
            name={name}
            value={value}
            onChange={onChange}
            className={`${baseClasses} appearance-none cursor-pointer ${value === "" ? "text-white/30" : "text-white"}`}
          >
            <option value="" disabled className="bg-[#0a0a0f] text-white/30">
              {placeholder}
            </option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-[#0a0a0f] text-white">
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={baseClasses}
        />
      )}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-xs text-red-400"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI Chat Widget ───────────────────────────────────────────────────────────

function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Bonjour ! Je suis l'assistant IA d'AcadémIA Pro. Comment puis-je vous aider aujourd'hui ? 🎓",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.