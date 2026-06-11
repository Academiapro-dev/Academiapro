import React, { useState, useEffect } from "react";

const GOLD = "#c8a96e";
const DARK = "#050508";
const DARK2 = "#0d0d14";
const DARK3 = "#13131f";
const GOLD2 = "#e8c87e";
const GOLD_DIM = "#7a6040";
const GREEN = "#4ade80";
const PURPLE = "#a855f7";
const BLUE = "#60a5fa";
const RED = "#f87171";
const ORANGE = "#fb923c";

interface Badge {
  id: number;
  name: string;
  icon: string;
  desc: string;
  earned: boolean;
  color: string;
}

interface Challenge {
  id: number;
  title: string;
  desc: string;
  xp: number;
  progress: number;
  total: number;
  icon: string;
  color: string;
}

interface Player {
  rank: number;
  name: string;
  level: number;
  xp: number;
  avatar: string;
  isMe: boolean;
}

const badges: Badge[] = [
  { id: 1, name: "Premier Pas", icon: "🚀", desc: "Première connexion", earned: true, color: GREEN },
  { id: 2, name: "Flamme", icon: "🔥", desc: "7 jours de streak", earned: true, color: ORANGE },
  { id: 3, name: "Centurion", icon: "⚔️", desc: "100 défis complétés", earned: true, color: GOLD },
  { id: 4, name: "Légende", icon: "👑", desc: "Top 10 classement", earned: false, color: PURPLE },
  { id: 5, name: "Éclair", icon: "⚡", desc: "Défi en moins d'1h", earned: true, color: BLUE },
  { id: 6, name: "Diamant", icon: "💎", desc: "Niveau 50 atteint", earned: false, color: "#22d3ee" },
  { id: 7, name: "Phénix", icon: "🦅", desc: "Revenir après 30j", earned: false, color: RED },
  { id: 8, name: "Oracle", icon: "🔮", desc: "Prédire 10 résultats", earned: true, color: PURPLE },
];

const challenges: Challenge[] = [
  { id: 1, title: "Maître du Code", desc: "Compléter 5 exercices de code", xp: 500, progress: 3, total: 5, icon: "💻", color: BLUE },
  { id: 2, title: "Streak Warrior", desc: "Maintenir 14 jours de suite", xp: 1000, progress: 12, total: 14, icon: "🔥", color: ORANGE },
  { id: 3, title: "Social King", desc: "Inviter 3 amis", xp: 750, progress: 1, total: 3, icon: "👥", color: GREEN },
  { id: 4, title: "XP Hunter", desc: "Gagner 5000 XP cette semaine", xp: 1500, progress: 3200, total: 5000, icon: "⭐", color: GOLD },
  { id: 5, title: "Perfectionniste", desc: "100% sur 3 défis", xp: 2000, progress: 2, total: 3, icon: "🎯", color: PURPLE },
];

const leaderboard: Player[] = [
  { rank: 1, name: "ShadowKing", level: 87, xp: 124500, avatar: "🦁", isMe: false },
  { rank: 2, name: "NightWolf", level: 82, xp: 118200, avatar: "🐺", isMe: false },
  { rank: 3, name: "DragonFly", level: 79, xp: 112800, avatar: "🐉", isMe: false },
  { rank: 4, name: "Toi", level: 42, xp: 87430, avatar: "⚡", isMe: true },
  { rank: 5, name: "StarGazer", level: 76, xp: 109300, avatar: "🌟", isMe: false },
  { rank: 6, name: "IronFist", level: 74, xp: 104700, avatar: "👊", isMe: false },
  { rank: 7, name: "PhoenixRise", level: 71, xp: 98200, avatar: "🔥", isMe: false },
];

const rewards = [
  { id: 1, name: "Avatar Légendaire", icon: "👑", cost: 5000, owned: false },
  { id: 2, name: "Thème Doré", icon: "✨", cost: 3000, owned: true },
  { id: 3, name: "Badge XP x2", icon: "⚡", cost: 2000, owned: false },
  { id: 4, name: "Titre Maître", icon: "🏆", cost: 8000, owned: false },
  { id: 5, name: "Bordure Arc-en-ciel", icon: "🌈", cost: 4000, owned: false },
  { id: 6, name: "Émoji Exclusif", icon: "💫", cost: 1500, owned: true },
];

export default function App() {
  const [tab, setTab] = useState<"dashboard" | "badges" | "classement" | "defis" | "boutique">("dashboard");
  const [xp, setXp] = useState(87430);
  const [streak, setStreak] = useState(12);
  const [coins, setCoins] = useState(6800);
  const [levelXp, setLevelXp] = useState(2430);
  const [pulse, setPulse] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const level = 42;
  const maxLevelXp = 5000;

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const gainXp = (amount: number) => {
    setXp(x => x + amount);
    setLevelXp(lx => Math.min(lx + amount, maxLevelXp));
    showNotif("+" + amount + " XP gagné !");
  };

  const tabs = [
    { id: "dashboard", label: "Accueil", icon: "🏠" },
    { id: "badges", label: "Badges", icon: "🏅" },
    { id: "classement", label: "Top", icon: "🏆" },
    { id: "defis", label: "Défis", icon: "⚔️" },
    { id: "boutique", label: "Shop", icon: "💎" },
  ] as const;

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: DARK,
    color: GOLD,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  };

  const glowStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(ellipse at 20% 20%, rgba(200,169,110,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.04) 0%, transparent 60%)",
    pointerEvents: "none",
    zIndex: 0,
  };

  const contentStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    maxWidth: "480px",
    margin: "0 auto",
    paddingBottom: "80px",
  };

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, " + DARK2 + " 0%, " + DARK + " 100%)",
    borderBottom: "1px solid " + GOLD_DIM,
    padding: "20px 20px 16px",
  };

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, " + DARK2 + " 0%, " + DARK3 + " 100%)",
    border: "1px solid " + GOLD_DIM,
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "12px",
  };

  const goldCardStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(200,169,110,0.15) 0%, rgba(200,169,110,0.05) 100%)",
    border: "1px solid " + GOLD,
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "12px",
  };

  const tabBarStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: "480px",
    background: DARK2,
    borderTop: "1px solid " + GOLD_DIM,
    display: "flex",
    zIndex: 100,
  };

  const btnPrimaryStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, " + GOLD + " 0%, " + GOLD2 + " 100%)",
    color: DARK,
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const progressBarBg: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: "99px",
    overflow: "hidden",
    height: "8px",
    flex: 1,
  };

  const notifStyle: React.CSSProperties = {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, " + GOLD + " 0%, " + GOLD2 + " 100%)",
    color: DARK,
    padding: "12px 24px",
    borderRadius: "99px",
    fontWeight: "700",
    fontSize: "16px",
    zIndex: 999,
    boxShadow: "0 4px 24px rgba(200,169,110,0.5)",
    animation: "none",
    whiteSpace: "nowrap",
  };

  const renderDashboard = () => (
    <div style={{ padding: "16px" }}>
      <div style={goldCardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "linear-gradient(135deg, " + GOLD + ", " + GOLD_DIM + ")",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", border: "2px solid " + GOLD2,
            boxShadow: pulse ? "0 0 20px rgba(200,169,110,0.6)" : "0 0 8px rgba(200,169,110,0.3)",
            transition: "box-shadow 2s ease",
          }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: GOLD2 }}>Toi</div>
            <div style={{ fontSize: "13px", color: GOLD_DIM, marginBottom: "4px" }}>Rang #4 • Titan Elite</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                background: "linear-gradient(135deg, " + GOLD + ", " + GOLD2 + ")",
                color: DARK, fontSize: "11px", fontWeight: "800",
                padding: "2px 8px", borderRadius: "99px",
              }}>Niv. {level}</div>
              <div style={{ color: GOLD_DIM, fontSize: "12px" }}>{levelXp.toLocaleString()} / {maxLevelXp.toLocaleString()} XP</div>
            </div>
          </div>
        </div>
        <div style={progressBarBg}>
          <div style={{
            height: "100%", borderRadius: "99px",
            background: "linear-gradient(90deg, " + GOLD + ", " + GOLD2 + ")",
            width: Math.round((levelXp / maxLevelXp) * 100) + "%",
            transition: "width 0.5s ease",
            boxShadow: "0 0 8px " + GOLD,
          }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        {[
          { label: "XP Total", value: xp.toLocaleString(), icon: "⭐", color: GOLD },
          { label: "Streak", value: streak + " 🔥", icon: "🔥", color: ORANGE },
          { label: "Coins", value: coins.toLocaleString(), icon: "💰", color: GOLD2 },
        ].map((stat, i) => (
          <div key={i} style={{
            ...cardStyle,
            marginBottom: 0,
            textAlign: "center",
            padding: "14px 8px",
            border: "1px solid rgba(200,169,110,0.3)",
          }}>
            <div style={{ fontSize: "22px", marginBottom: "4px" }}>{stat.icon}</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "11px", color: GOLD_DIM }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px", color: GOLD2 }}>🎯 Défis du Jour</div>
        {challenges.slice(0, 3).map(c => (
          <div key={c.id} style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>