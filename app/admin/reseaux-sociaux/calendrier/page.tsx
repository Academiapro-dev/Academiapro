```tsx
"use client";

import { useState, useEffect } from "react";

// Types
type Platform = "LinkedIn" | "Instagram" | "Facebook" | "TikTok" | "YouTube";
type PostStatus = "planifié" | "publié" | "approuvé" | "brouillon";

interface Post {
  id: string;
  platform: Platform;
  status: PostStatus;
  date: Date;
  time: string;
  content: string;
  hashtags: string[];
  visualSuggestion: string;
  theme: string;
  engagementPrediction: number;
}

// Constants
const PLATFORMS: Platform[] = ["LinkedIn", "Instagram", "Facebook", "TikTok", "YouTube"];

const PLATFORM_CONFIG: Record<Platform, { color: string; bg: string; border: string; icon: string }> = {
  LinkedIn: {
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/50",
    icon: "in",
  },
  Instagram: {
    color: "text-pink-400",
    bg: "bg-pink-500/20",
    border: "border-pink-500/50",
    icon: "ig",
  },
  Facebook: {
    color: "text-blue-300",
    bg: "bg-blue-400/20",
    border: "border-blue-400/50",
    icon: "fb",
  },
  TikTok: {
    color: "text-slate-200",
    bg: "bg-slate-500/20",
    border: "border-slate-400/50",
    icon: "tt",
  },
  YouTube: {
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/50",
    icon: "yt",
  },
};

const STATUS_CONFIG: Record<PostStatus, { color: string; bg: string; dot: string }> = {
  planifié: { color: "text-yellow-300", bg: "bg-yellow-500/20", dot: "bg-yellow-400" },
  publié: { color: "text-emerald-300", bg: "bg-emerald-500/20", dot: "bg-emerald-400" },
  approuvé: { color: "text-cyan-300", bg: "bg-cyan-500/20", dot: "bg-cyan-400" },
  brouillon: { color: "text-slate-400", bg: "bg-slate-600/30", dot: "bg-slate-500" },
};

const THEMES = [
  "Innovation IA",
  "Success Story Client",
  "Conseil Productivité",
  "Tendances Marché",
  "Behind The Scenes",
  "Formation & Tips",
  "Étude de Cas",
  "Actualité Secteur",
];

const CONTENT_TEMPLATES: Record<Platform, string[]> = {
  LinkedIn: [
    "🚀 Découvrez comment l'IA transforme la gestion des réseaux sociaux. Nos clients constatent +47% d'engagement en moyenne après seulement 30 jours d'utilisation d'AcadémIA Pro. Voici les 3 stratégies clés...",
    "💡 Insight du jour : L'automatisation intelligente ne remplace pas la créativité humaine, elle l'amplifie. Voici pourquoi nos clients nous font confiance pour leur stratégie digitale...",
    "📊 Étude de cas : Comment TechCorp a multiplié son audience LinkedIn par 3 en 6 mois grâce à notre solution IA personnalisée.",
  ],
  Instagram: [
    "✨ Behind the scenes de notre IA en action ! Regardez comment nous créons du contenu authentique et engageant pour votre marque en quelques secondes seulement 🎯",
    "🔥 Tips du jour : 5 hashtags ultra-performants pour booster votre visibilité Instagram cette semaine. Save ce post ! ⬆️",
    "💫 Transformation digitale en cours... Avant/Après avec AcadémIA Pro. Les résultats parlent d'eux-mêmes ! 📈",
  ],
  Facebook: [
    "🎯 Nouveauté : Notre IA analyse maintenant le comportement de votre audience pour publier au moment optimal ! Rejoignez les 500+ entreprises qui font confiance à AcadémIA Pro.",
    "📱 Question du jour : Combien d'heures passez-vous chaque semaine sur vos réseaux sociaux ? Avec notre solution, nos clients économisent en moyenne 15h/semaine.",
    "🏆 Félicitations à nos clients du mois qui ont atteint leurs objectifs d'engagement ! Découvrez leurs secrets dans cet article...",
  ],
  TikTok: [
    "POV: Ton IA crée du contenu viral pendant que tu dors 😴✨ #AcadémiaPro #MarketingDigital #IA",
    "Avant AcadémIA Pro vs Après 👀 Le glow up de ta stratégie social media #Transformation #Marketing",
    "3 secrets que les gros comptes ne te diront jamais 🤫 #ContentCreator #Tips #Viral",
  ],
  YouTube: [
    "🎬 TUTO COMPLET : Comment automatiser 100% de votre stratégie Social Media avec l'IA en 2024 | AcadémIA Pro",
    "📹 INTERVIEW EXCLUSIVE : Ce dirigeant a transformé sa présence digitale en 90 jours - Voici sa méthode",
    "🎯 ANALYSE : Les tendances Social Media 2024 que vous devez absolument connaître | Expert IA",
  ],
};

const HASHTAG_POOL: Record<Platform, string[]> = {
  LinkedIn: ["#MarketingDigital", "#IA", "#Innovation", "#BusinessStrategy", "#Leadership", "#Entrepreneuriat", "#FutureOfWork"],
  Instagram: ["#socialmedia", "#marketing", "#IA", "#digital", "#entrepreneur", "#business", "#growth", "#success"],
  Facebook: ["#Marketing", "#PME", "#Digitalisation", "#IA", "#Entreprise", "#Réseauxsociaux"],
  TikTok: ["#fyp", "#pourtoi", "#marketing", "#IA", "#business", "#tips", "#viral", "#entrepreneur"],
  YouTube: ["#YouTube", "#Marketing", "#IA", "#Tutorial", "#Business", "#Digital"],
};

const VISUAL_SUGGESTIONS = [
  "Infographie colorée avec statistiques clés",
  "Photo lifestyle bureau moderne",
  "Vidéo courte présentation produit",
  "Carrousel avant/après résultats",
  "Illustration vectorielle abstraite",
  "Screenshot dashboard avec données",
  "Portrait professionnel client témoignage",
  "Animation logo brand",
];

// Generate posts utility
const generatePost = (date: Date, platform: Platform, existingThemes: string[]): Post => {
  const availableThemes = THEMES.filter((t) => !existingThemes.includes(t));
  const theme = availableThemes.length > 0
    ? availableThemes[Math.floor(Math.random() * availableThemes.length)]
    : THEMES[Math.floor(Math.random() * THEMES.length)];

  const contents = CONTENT_TEMPLATES[platform];
  const content = contents[Math.floor(Math.random() * contents.length)];
  const allHashtags = HASHTAG_POOL[platform];
  const selectedHashtags = allHashtags.sort(() => Math.random() - 0.5).slice(0, 5);
  const hours = ["08:00", "09:30", "12:00", "14:00", "17:00", "18:30", "20:00"];
  const time = hours[Math.floor(Math.random() * hours.length)];
  const visual = VISUAL_SUGGESTIONS[Math.floor(Math.random() * VISUAL_SUGGESTIONS.length)];

  return {
    id: `${date.toISOString()}-${platform}-${Math.random().toString(36).substr(2, 9)}`,
    platform,
    status: Math.random() > 0.7 ? "planifié" : Math.random() > 0.5 ? "brouillon" : "approuvé",
    date,
    time,
    content,
    hashtags: selectedHashtags,
    visualSuggestion: visual,
    theme,
    engagementPrediction: Math.floor(Math.random() * 500) + 100,
  };
};

// Main Component
export default function EditorialCalendar() {
  const [currentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterStatus, setFilterStatus] = useState<PostStatus | "all">("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Initialize with some posts
  useEffect(() => {
    const initialPosts: Post[] = [];
    const today = new Date();

    for (let day = 1; day <= 30; day++) {
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      const platformsForDay = PLATFORMS.filter(() => Math.random() > 0.6);
      const usedThemes: string[] = [];

      platformsForDay.forEach((platform) => {
        const post = generatePost(date, platform, usedThemes);
        usedThemes.push(post.theme);

        // Mark some as published if past
        if (date < today) {
          post.status = Math.random() > 0.3 ? "publié" : "approuvé";
        }

        initialPosts.push(post);
      });
    }

    setPosts(initialPosts);
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Padding days before
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startPadding; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    // Days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    // Padding days after
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getPostsForDay = (date: Date) => {
    return posts.filter((p) => {
      const sameDay =
        p.date.getDate() === date.getDate() &&
        p.date.getMonth() === date.getMonth() &&
        p.date.getFullYear() === date.getFullYear();
      const matchPlatform = filterPlatform === "all" || p.platform === filterPlatform;
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      return sameDay && matchPlatform && matchStatus;
    });
  };

  const stats = {
    planned: posts.filter((p) => p.status === "planifié" || p.status === "approuvé").length,
    published: posts.filter((p) => p.status === "publié").length,
    total: posts.length,
    publishRate: posts.length > 0 ? Math.round((posts.filter((p) => p.status === "publié").length / posts.length) * 100) : 0,
    avgEngagement: posts.length > 0 ? Math.round(posts.reduce((a, b) => a + b.engagementPrediction, 0) / posts.length) : 0,
  };

  const generateWeek = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));

    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7);

    const newPosts: Post[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(nextMonday);
      date.setDate(nextMonday.getDate() + i);
      const platformsForDay = PLATFORMS.filter(() => Math.random() > 0.5);
      const usedThemes: string[] = [];

      platformsForDay.forEach((platform) => {
        const existingThemesThisWeek = newPosts.map((p) => p.theme);
        const post = generatePost(date, platform, [...usedThemes, ...existingThemesThisWeek]);
        usedThemes.push(post.theme);
        newPosts.push(post);
      });
    }

    setPosts((prev) => [...prev.filter((p) => {
      const postDate = p.date;
      return postDate < nextMonday || postDate > new Date(nextMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
    }), ...newPosts]);

    setIsGenerating(false);
    showNotification("✅ Semaine générée avec succès !");
  };

  const generateMonth = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));

    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysInNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
    const newPosts: Post[] = [];

    for (let day = 1; day <= daysInNextMonth; day++) {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day);
      const platformsForDay = PLATFORMS.filter(() => Math.random() > 0.55);
      const usedThemes: string[] = [];

      platformsForDay.forEach((platform) => {
        const recentThemes = newPosts.slice(-8).map((p) => p.theme);
        const post = generatePost(date, platform, [...usedThemes, ...recentThemes]);
        usedThemes.push(post.theme);
        newPosts.push(post);
      });
    }

    setPosts((prev) => [
      ...prev.filter((p) => p.date.getMonth