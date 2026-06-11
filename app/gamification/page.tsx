import React, { useState, useEffect } from "react";

const GOLD = "#c8a96e";
const DARK = "#050508";
const DARK2 = "#0d0d14";
const DARK3 = "#12121c";
const GOLD2 = "#e8c97e";
const GOLD3 = "#a07840";
const RED = "#e85555";
const GREEN = "#55e8a0";
const BLUE = "#5588e8";
const PURPLE = "#a055e8";

interface Badge {
  id: number;
  name: string;
  icon: string;
  desc: string;
  unlocked: boolean;
  rarity: string;
  color: string;
}

interface Challenge {
  id: number;
  title: string;
  desc: string;
  xpReward: number;
  progress: number;
  total: number;
  icon: string;
  done: boolean;
}

interface Player {
  rank: number;
  name: string;
  xp: number;
  level: number;
  avatar: string;
  isMe: boolean;
}

const initialBadges: Badge[] = [
  { id: 1, name: "Premier Pas", icon: "🚀", desc: "Première connexion", unlocked: true, rarity: "Commun", color: "#888" },
  { id: 2, name: "Flamme", icon: "🔥", desc: "7 jours de streak", unlocked: true, rarity: "Rare", color: BLUE },
  { id: 3, name: "Légendaire", icon: "👑", desc: "Atteindre niveau 10", unlocked: true, rarity: "Légendaire", color: GOLD },
  { id: 4, name: "Maître", icon: "⚔️", desc: "Compléter 50 défis", unlocked: false, rarity: "Épique", color: PURPLE },
  { id: 5, name: "Vitesse", icon: "⚡", desc: "30 jours de streak", unlocked: false, rarity: "Épique", color: PURPLE },
  { id: 6, name: "Invincible", icon: "🛡️", desc: "100 jours de streak", unlocked: false, rarity: "Mythique", color: RED },
];

const initialChallenges: Challenge[] = [
  { id: 1, title: "Connexion quotidienne", desc: "Se connecter 7 jours de suite", xpReward: 500, progress: 5, total: 7, icon: "📅", done: false },
  { id: 2, title: "Explorateur", desc: "Visiter 10 sections différentes", xpReward: 300, progress: 10, total: 10, icon: "🗺️", done: true },
  { id: 3, title: "Partage social", desc: "Partager 3 fois sur les réseaux", xpReward: 200, progress: 1, total: 3, icon: "📢", done: false },
  { id: 4, title: "Champion", desc: "Terminer 5 quêtes épiques", xpReward: 1000, progress: 2, total: 5, icon: "🏆", done: false },
];

const leaderboard: Player[] = [
  { rank: 1, name: "DarkLord99", xp: 48500, level: 32, avatar: "🦁", isMe: false },
  { rank: 2, name: "ShadowKing", xp: 41200, level: 28, avatar: "🐉", isMe: false },
  { rank: 3, name: "Vous", xp: 35800, level: 24, avatar: "⚔️", isMe: true },
  { rank: 4, name: "PhoenixRise", xp: 29000, level: 21, avatar: "🔥", isMe: false },
  { rank: 5, name: "MysticWolf", xp: 21500, level: 17, avatar: "🐺", isMe: false },
];

function XPBar({ current, max, level }: { current: number; max: number; level: number }) {
  const pct = Math.round((current / max) * 100);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>NIVEAU {level}</span>
        <span style={{ color: "#666", fontSize: 12 }}>{current.toLocaleString()} / {max.toLocaleString()} XP</span>
      </div>
      <div style={{ background: "#1a1a28", borderRadius: 99, height: 12, overflow: "hidden", position: "relative" }}>
        <div style={{
          width: animated + "%",
          height: "100%",
          background: "linear-gradient(90deg, " + GOLD3 + ", " + GOLD + ", " + GOLD2 + ")",
          borderRadius: 99,
          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "0 0 12px " + GOLD + "88",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 20,
            height: "100%",
            background: "rgba(255,255,255,0.3)",
            filter: "blur(4px)",
            borderRadius: 99,
          }} />
        </div>
      </div>
      <div style={{ textAlign: "right", fontSize: 11, color: GOLD3, marginTop: 4 }}>{pct}%</div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? DARK3 : DARK2,
        border: "1px solid",
        borderColor: hovered ? color + "88" : "#1e1e2e",
        borderRadius: 16,
        padding: "20px 16px",
        flex: 1,
        minWidth: 110,
        textAlign: "center",
        cursor: "default",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 8px 24px " + color + "33" : "none",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#555", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: badge.unlocked ? (hovered ? DARK3 : DARK2) : "#0a0a10",
        border: "1px solid",
        borderColor: badge.unlocked ? (hovered ? badge.color : badge.color + "44") : "#1a1a22",
        borderRadius: 14,
        padding: "16px 12px",
        textAlign: "center",
        opacity: badge.unlocked ? 1 : 0.4,
        cursor: badge.unlocked ? "default" : "not-allowed",
        transition: "all 0.3s ease",
        transform: hovered && badge.unlocked ? "translateY(-3px) scale(1.03)" : "none",
        boxShadow: hovered && badge.unlocked ? "0 6px 20px " + badge.color + "44" : "none",
        minWidth: 100,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8, filter: badge.unlocked ? "none" : "grayscale(1)" }}>{badge.icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: badge.unlocked ? badge.color : "#333", marginBottom: 4 }}>{badge.name}</div>
      <div style={{
        fontSize: 10,
        color: badge.color,
        background: badge.color + "22",
        border: "1px solid " + badge.color + "44",
        borderRadius: 99,
        padding: "2px 8px",
        display: "inline-block",
        marginBottom: 6,
      }}>{badge.rarity}</div>
      <div style={{ fontSize: 10, color: "#444" }}>{badge.desc}</div>
      {!badge.unlocked && <div style={{ fontSize: 18, color: "#222", marginTop: 4 }}>🔒</div>}
    </div>
  );
}

function ChallengeCard({ challenge, onClaim }: { challenge: Challenge; onClaim: (id: number) => void }) {
  const pct = Math.round((challenge.progress / challenge.total) * 100);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: challenge.done ? "#0a1a14" : (hovered ? DARK3 : DARK2),
        border: "1px solid",
        borderColor: challenge.done ? GREEN + "44" : (hovered ? GOLD + "55" : "#1e1e2e"),
        borderRadius: 16,
        padding: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "all 0.3s ease",
        transform: hovered ? "translateX(4px)" : "none",
      }}
    >
      <div style={{
        fontSize: 32,
        width: 56,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: DARK,
        borderRadius: 14,
        border: "1px solid #1e1e2e",
        flexShrink: 0,
      }}>{challenge.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ color: "#ddd", fontWeight: 700, fontSize: 14 }}>{challenge.title}</span>
          <span style={{
            color: GOLD,
            fontSize: 12,
            fontWeight: 700,
            background: GOLD + "22",
            border: "1px solid " + GOLD + "44",
            borderRadius: 99,
            padding: "2px 10px",
          }}>+{challenge.xpReward} XP</span>
        </div>
        <div style={{ color: "#555", fontSize: 12, marginBottom: 8 }}>{challenge.desc}</div>
        <div style={{ background: "#1a1a28", borderRadius: 99, height: 6 }}>
          <div style={{
            width: pct + "%",
            height: "100%",
            background: challenge.done
              ? "linear-gradient(90deg, " + GREEN + "88, " + GREEN + ")"
              : "linear-gradient(90deg, " + GOLD3 + ", " + GOLD + ")",
            borderRadius: 99,
            transition: "width 0.8s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "#444" }}>{challenge.progress}/{challenge.total}</span>
          <span style={{ fontSize: 11, color: challenge.done ? GREEN : GOLD }}>{pct}%</span>
        </div>
      </div>
      {challenge.done && (
        <button
          onClick={() => onClaim(challenge.id)}
          style={{
            background: "linear-gradient(135deg, " + GREEN + "33, " + GREEN + "22)",
            border: "1px solid " + GREEN + "66",
            color: GREEN,
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >Réclamer ✓</button>
      )}
    </div>
  );
}

function LeaderboardRow({ player }: { player: Player }) {
  const [hovered, setHovered] = useState(false);
  const rankColors: Record<number, string> = { 1: GOLD, 2: "#c0c0c0", 3: "#cd7f32" };
  const rc = rankColors[player.rank] || "#444";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        background: player.isMe ? "#12182a" : (hovered ? DARK3 : "transparent"),
        borderRadius: 12,
        border: player.isMe ? "1px solid " + BLUE + "44" : "1px solid transparent",
        transition: "all 0.2s ease",
        cursor: "default",
      }}
    >
      <div style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        background: rc + "22",
        border: "1px solid " + rc + "66",
        color: rc,
        fontWeight: 900,
        fontSize: 14,
        flexShrink: 0,
      }}>{player.rank}</div>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: DARK,
        border: "2px solid " + (player.isMe ? BLUE : "#1e1e2e"),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        flexShrink: 0,
      }}>{player.avatar}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: player.isMe ? BLUE : "#ccc", fontWeight: 700, fontSize: 14 }}>
          {player.name} {player.isMe && <span