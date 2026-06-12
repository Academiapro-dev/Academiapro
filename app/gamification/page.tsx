"use client";
import { useState } from "react";

export default function GamificationPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);

  const user = {
    name: "Alexandre",
    level: 14,
    xp: 3420,
    xpRequired: 4000,
    streak: 7,
    rank: 3,
    totalUsers: 1248,
    badges: 12,
  };

  const xpPercent = Math.round((user.xp / user.xpRequired) * 100);

  const badges = [
    { id: 1, icon: "🔥", name: "Flamme", desc: "7 jours consécutifs", unlocked: true },
    { id: 2, icon: "⚡", name: "Éclair", desc: "50 défis complétés", unlocked: true },
    { id: 3, icon: "💎", name: "Diamant", desc: "Niveau 15 atteint", unlocked: false },
    { id: 4, icon: "🏆", name: "Champion", desc: "Top 3 classement", unlocked: true },
    { id: 5, icon: "🌟", name: "Étoile", desc: "Note parfaite x5", unlocked: true },
    { id: 6, icon: "🚀", name: "Fusée", desc: "XP x2 en 24h", unlocked: false },
    { id: 7, icon: "🎯", name: "Précision", desc: "100% accuracy", unlocked: true },
    { id: 8, icon: "👑", name: "Roi", desc: "Top 1 global", unlocked: false },
  ];

  const challenges = [
    { id: 1, title: "Sprint du jour", desc: "Complétez 3 leçons aujourd'hui", xp: 150, progress: 2, total: 3, category: "daily" },
    { id: 2, title: "Maître des séries", desc: "Maintenez un streak de 10 jours", xp: 500, progress: 7, total: 10, category: "weekly" },
    { id: 3, title: "Explorateur", desc: "Visitez 5 modules différents", xp: 200, progress: 5, total: 5, category: "daily" },
    { id: 4, title: "Sans erreur", desc: "Finissez un quiz parfait", xp: 300, progress: 0, total: 1, category: "special" },
    { id: 5, title: "Sociable", desc: "Interagissez avec 3 amis", xp: 100, progress: 1, total: 3, category: "weekly" },
  ];

  const leaderboard = [
    { rank: 1, name: "Sophie M.", xp: 8920, level: 22, avatar: "S" },
    { rank: 2, name: "Thomas K.", xp: 7650, level: 19, avatar: "T" },
    { rank: 3, name: "Alexandre", xp: 3420, level: 14, avatar: "A", isMe: true },
    { rank: 4, name: "Camille R.", xp: 3100, level: 13, avatar: "C" },
    { rank: 5, name: "Nathan B.", xp: 2850, level: 12, avatar: "N" },
    { rank: 6, name: "Léa F.", xp: 2400, level: 11, avatar: "L" },
    { rank: 7, name: "Hugo D.", xp: 2100, level: 10, avatar: "H" },
  ];

  const rewards = [
    { id: 1, title: "Boost XP x2", desc: "Double XP pendant 1 heure", cost: 500, icon: "⚡", color: "#f59e0b" },
    { id: 2, title: "Badge Exclusif", desc: "Badge rare limité", cost: 1000, icon: "🏅", color: "#c8a96e" },
    { id: 3, title: "Thème Sombre+", desc: "Interface premium", cost: 750, icon: "🎨", color: "#8b5cf6" },
    { id: 4, title: "Freeze Streak", desc: "Protège votre série", cost: 300, icon: "❄️", color: "#06b6d4" },
  ];

  const handleCompleteChallenge = (id) => {
    if (!completedChallenges.includes(id)) {
      setCompletedChallenges([...completedChallenges, id]);
    }
  };

  const handleClaimReward = (id) => {
    if (!claimedRewards.includes(id)) {
      setClaimedRewards([...claimedRewards, id]);
    }
  };

  const categoryColor = (cat) => {
    if (cat === "daily") return "#22c55e";
    if (cat === "weekly") return "#c8a96e";
    return "#a855f7";
  };

  const categoryLabel = (cat) => {
    if (cat === "daily") return "Quotidien";
    if (cat === "weekly") return "Hebdo";
    return "Spécial";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Segoe UI', sans-serif", color: "#ffffff" }}>

      <div style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #0a0a14 50%, #050508 100%)", borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "0 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #c8a96e, #f0d090)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🎮</div>
            <span style={{ fontSize: "20px", fontWeight: "700", background: "linear-gradient(90deg, #c8a96e, #f0d090)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>QuestLearn</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "20px", padding: "6px 14px" }}>
              <span style={{ fontSize: "14px" }}>🔥</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#f59e0b" }}>{user.streak}</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>streak</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "20px", padding: "6px 14px" }}>
              <span style={{ fontSize: "14px" }}>⚡</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#c8a96e" }}>{user.xp.toLocaleString()}</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>XP</span>
            </div>
            <div style={{ width: "38px", height: "38px", background: "linear-gradient(135deg, #c8a96e, #a07840)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", color: "#050508" }}>A</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 32px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>

          <div style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.15) 0%, rgba(200,169,110,0.05) 100%)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "0", right: "0", width: "80px", height: "80px", background: "radial-gradient(circle, rgba(200,169,110,0.15) 0%, transparent 70%)", borderRadius: "0 16px 0 80px" }}></div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Niveau actuel</div>
            <div style={{ fontSize: "48px", fontWeight: "900", color: "#c8a96e", lineHeight: "1" }}>{user.level}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "6px" }}>Prochain: {user.level + 1}</div>
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 100%)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "0", right: "0", width: "80px", height: "80px", background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)", borderRadius: "0 16px 0 80px" }}></div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Série active</div>
            <div style={{ fontSize: "48px", fontWeight: "900", color: "#22c55e", lineHeight: "1" }}>{user.streak}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "6px" }}>jours consécutifs 🔥</div>
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.03) 100%)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "0", right: "0", width: "80px", height: "80px", background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)", borderRadius: "0 16px 0 80px" }}></div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Classement</div>
            <div style={{ fontSize: "48px", fontWeight: "900", color: "#a855f7", lineHeight: "1" }}>#{user.rank}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "6px" }}>sur {user.totalUsers.toLocaleString()} joueurs</div>
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.03) 100%)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "0", right: "0", width: "80px", height: "80px", background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)", borderRadius: "0 16px 0 80px" }}></div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Badges</div>
            <div style={{ fontSize: "48px", fontWeight: "900", color: "#f59e0b", lineHeight: "1" }}>{user.badges}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "6px" }}>débloqués sur 20</div>
          </div>
        </div>

        <div style={{ background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#ffffff", marginBottom: "4px" }}>Progression XP — Niveau {user.level}</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{user.xp.toLocaleString()} / {user.xpRequired.toLocaleString()} XP requis</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#c8a96e" }}>{xpPercent}%</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>complété</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "100px", height: "14px", overflow: "hidden", position: "relative" }}>
            <div style={{ width: xpPercent + "%", height: "100%", background: "linear-gradient(90