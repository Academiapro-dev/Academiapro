"use client";
import React from "react";

const gold = "#c8a96e";
const bg = "#050508";
const cardBg = "#0d0d14";
const cardBorder = "#1a1a2e";
const textMuted = "#8888aa";

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  trend: string;
  trendUp: boolean;
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: string;
  description: string;
}

const stats: StatCardProps[] = [
  {
    label: "Chiffre d'Affaires",
    value: "142 850 €",
    icon: "💰",
    trend: "+18.4%",
    trendUp: true,
  },
  {
    label: "Apprenants Actifs",
    value: "3 247",
    icon: "🎓",
    trend: "+12.1%",
    trendUp: true,
  },
  {
    label: "Formations Vendues",
    value: "891",
    icon: "📚",
    trend: "+9.7%",
    trendUp: true,
  },
  {
    label: "Séances Réalisées",
    value: "15 632",
    icon: "🎯",
    trend: "-2.3%",
    trendUp: false,
  },
];

const navLinks: NavLinkProps[] = [
  {
    href: "/admin/users",
    label: "Gestion Utilisateurs",
    icon: "👥",
    description: "Apprenants, coachs, rôles & permissions",
  },
  {
    href: "/admin/formations",
    label: "Formations",
    icon: "📖",
    description: "Catalogue, modules, contenus pédagogiques",
  },
  {
    href: "/admin/seances",
    label: "Séances & Planning",
    icon: "📅",
    description: "Calendrier, réservations, disponibilités",
  },
  {
    href: "/admin/finances",
    label: "Finances & Facturation",
    icon: "💳",
    description: "Revenus, remboursements, exports comptables",
  },
  {
    href: "/admin/analytics",
    label: "Analytics & Rapports",
    icon: "📊",
    description: "Statistiques avancées, taux de complétion",
  },
  {
    href: "/admin/ia",
    label: "IA & Personnalisation",
    icon: "🤖",
    description: "Modèles, recommandations, prompts",
  },
  {
    href: "/admin/marketing",
    label: "Marketing & CRM",
    icon: "📣",
    description: "Campagnes, leads, tunnel de conversion",
  },
  {
    href: "/admin/certifications",
    label: "Certifications",
    icon: "🏆",
    description: "Badges, diplômes, validation des acquis",
  },
  {
    href: "/admin/support",
    label: "Support & Tickets",
    icon: "🎫",
    description: "Helpdesk, FAQ, satisfaction client",
  },
  {
    href: "/admin/settings",
    label: "Paramètres Système",
    icon: "⚙️",
    description: "Config globale, intégrations, sécurité",
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    icon: "🔔",
    description: "Emails, SMS, push, automatisations",
  },
  {
    href: "/admin/content",
    label: "Gestion Contenu",
    icon: "✍️",
    description: "Blog, landing pages, ressources libres",
  },
];

function StatCard({ label, value, icon, trend, trendUp }: StatCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: cardBg,
        border: hovered ? "1px solid " + gold : "1px solid " + cardBorder,
        borderRadius: "16px",
        padding: "28px 24px",
        flex: "1",
        minWidth: "220px",
        cursor: "default",
        transition: "border 0.3s, box-shadow 0.3s",
        boxShadow: hovered
          ? "0 0 32px rgba(200,169,110,0.15)"
          : "0 2px 12px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-10px",
          fontSize: "72px",
          opacity: "0.06",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {icon}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "rgba(200,169,110,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>
        <span style={{ color: textMuted, fontSize: "13px", fontWeight: "500", letterSpacing: "0.5px" }}>
          {label}
        </span>
      </div>

      <div style={{ color: "#ffffff", fontSize: "32px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-0.5px" }}>
        {value}
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          backgroundColor: trendUp ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          color: trendUp ? "#4ade80" : "#f87171",
          fontSize: "12px",
          fontWeight: "600",
          padding: "3px 10px",
          borderRadius: "20px",
        }}
      >
        <span>{trendUp ? "▲" : "▼"}</span>
        <span>{trend} ce mois</span>
      </div>
    </div>
  );
}

function NavCard({ href, label, icon, description }: NavLinkProps) {
  const [hovered, setHovered] = React.useState(false);

  const handleClick = () => {
    window.location.href = href;
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? "rgba(200,169,110,0.06)" : cardBg,
        border: hovered ? "1px solid " + gold : "1px solid " + cardBorder,
        borderRadius: "14px",
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.25s",
        boxShadow: hovered ? "0 0 24px rgba(200,169,110,0.1)" : "none",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          backgroundColor: hovered ? "rgba(200,169,110,0.18)" : "rgba(200,169,110,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          flexShrink: "0" as unknown as number,
          transition: "background-color 0.25s",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: "1" }}>
        <div
          style={{
            color: hovered ? gold : "#e0e0f0",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "4px",
            transition: "color 0.25s",
          }}
        >
          {label}
        </div>
        <div style={{ color: textMuted, fontSize: "12px", lineHeight: "1.5" }}>
          {description}
        </div>
      </div>
      <div
        style={{
          color: hovered ? gold : "#333355",
          fontSize: "18px",
          transition: "color 0.25s, transform 0.25s",
          transform: hovered ? "translateX(4px)" : "translateX(0)",
          alignSelf: "center",
        }}
      >
        →
      </div>
    </div>
  );
}

function ActivityItem({ text, time, type }: { text: string; time: string; type: string }) {
  const dotColor =
    type === "sale"
      ? "#4ade80"
      : type === "new"
      ? gold
      : type === "alert"
      ? "#f87171"
      : "#818cf8";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: dotColor,
          marginTop: "5px",
          flexShrink: "0" as unknown as number,
          boxShadow: "0 0 6px " + dotColor,
        }}
      />
      <div style={{ flex: "1" }}>
        <div style={{ color: "#d0d0e8", fontSize: "13px", lineHeight: "1.5" }}>{text}</div>
        <div style={{ color: textMuted, fontSize: "11px", marginTop: "2px" }}>{time}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const activities = [
    { text: "Nouvelle inscription : Marie Dupont — Formation React Avancé", time: "Il y a 3 min", type: "new" },
    { text: "Paiement reçu : 297€ — Pack Premium annuel", time: "Il y a 12 min", type: "sale" },
    { text: "Séance terminée : Coach Thomas avec groupe B2 (12 participants)", time: "Il y a 28 min", type: "info" },
    { text: "Alerte : Taux d'abandon élevé sur module 4 — Python IA", time: "Il y a 45 min", type: "alert" },
    { text: "Nouveau certificat délivré : Jean Martin — Fullstack Developer", time: "Il y a 1h", type: "sale" },
    { text: "Ticket support ouvert : Problème accès vidéo (#4421)", time: "Il y a 1h 20min", type: "alert" },
    { text: "Campagne email envoyée : 2 847 destinataires — Promo été", time: "Il y a 2h", type: "info" },
    { text: "Mise à jour contenu : Module 7 Data Science actualisé", time: "Il y a 3h", type: "new" },
  ];

  const quickMetrics = [
    { label: "Taux de complétion", value: "73%", color: "#4ade80" },
    { label: "Satisfaction moyenne", value: "4.8/5", color: gold },
    { label: "Tickets ouverts", value: "14", color: "#f87171" },
    { label: "Formations actives", value: "38", color: "#818cf8" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: bg,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#ffffff",
      }}
    >
      {/* TOP NAV */}
      <nav
        style={{
          backgroundColor: "rgba(5,5,8,0.95)",
          borderBottom: "1px solid " + cardBorder,
          padding: "0 32px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: "0",
          zIndex: "100",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "800",
              color: "#050508",
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.3px" }}>
              AcadémIA Pro
            </div>
            <div style={{ fontSize: "10px", color: gold, letterSpacing: "2px", textTransform: "uppercase" }}>
              Admin Dashboard
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              color: textMuted,
            }}
          >
            <span style={{ color: "#4ade80", fontSize: "8px" }}>●</span>
            <span>Système opérationnel</span>
          </div>

          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e44, #c8a96e22)",
              border: "1px solid rgba(200,169,110,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            🔔
          </div>

          <div
            style={{
              width: "36px",
              height: "36px",