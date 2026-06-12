"use client";
import { useState } from "react";

export default function CommunautePage() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const tiers = [
    {
      id: "gratuit",
      label: "Gratuit",
      price: "0€",
      period: "/mois",
      color: "#888888",
      glow: "rgba(136,136,136,0.3)",
      badge: "DÉMARRER",
      avantages: [
        "Accès aux ressources de base",
        "Canal Discord communautaire",
        "1 live mensuel ouvert",
        "Newsletter hebdomadaire",
      ],
      locked: [
        "Prompts exclusifs",
        "Sessions VIP",
        "Networking privé",
      ],
    },
    {
      id: "premium",
      label: "Premium",
      price: "29€",
      period: "/mois",
      color: "#c8a96e",
      glow: "rgba(200,169,110,0.4)",
      badge: "POPULAIRE",
      avantages: [
        "Tout le niveau Gratuit",
        "Prompts exclusifs illimités",
        "Accès à tous les lives",
        "Canal Discord Premium",
        "Ressources & templates",
        "Networking membres actifs",
      ],
      locked: [
        "Sessions 1-to-1 VIP",
      ],
    },
    {
      id: "vip",
      label: "VIP",
      price: "99€",
      period: "/mois",
      color: "#e8d5a3",
      glow: "rgba(232,213,163,0.5)",
      badge: "ÉLITE",
      avantages: [
        "Tout le niveau Premium",
        "Sessions 1-to-1 mensuelles",
        "Accès anticipé aux contenus",
        "Canal Discord VIP privé",
        "Masterminds exclusifs",
        "Badge VIP + reconnaissance",
        "Support prioritaire direct",
      ],
      locked: [],
    },
  ];

  const stats = [
    { value: "2 400+", label: "Membres actifs" },
    { value: "180+", label: "Ressources exclusives" },
    { value: "48", label: "Lives réalisés" },
    { value: "98%", label: "Satisfaction" },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#ffffff", overflowX: "hidden" }}>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,169,110,0.04) 0%, transparent 70%)" }} />
      </div>

      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px", borderBottom: "1px solid rgba(200,169,110,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "linear-gradient(135deg, #c8a96e, #e8d5a3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "18px", fontWeight: "900", color: "#050508" }}>C</span>
          </div>
          <span style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "0.05em", color: "#ffffff" }}>COMMUNAUTÉ</span>
          <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.15em", color: "#c8a96e", backgroundColor: "rgba(200,169,110,0.1)", padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(200,169,110,0.2)" }}>PRIVÉE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>À propos</span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Lives</span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Ressources</span>
          <button
            style={{ backgroundColor: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "10px 22px", fontSize: "13px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.05em" }}
          >
            Rejoindre Discord
          </button>
        </div>
      </nav>

      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "100px 24px 80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "100px", padding: "8px 20px", marginBottom: "32px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.8)" }} />
          <span style={{ fontSize: "13px", color: "#c8a96e", fontWeight: "600", letterSpacing: "0.08em" }}>COMMUNAUTÉ ACTIVE — 2 400+ MEMBRES</span>
        </div>

        <h1 style={{ fontSize: "clamp(42px, 7vw, 80px)", fontWeight: "900", lineHeight: "1.05", marginBottom: "24px", letterSpacing: "-0.02em" }}>
          <span style={{ color: "#ffffff" }}>La communauté</span>
          <br />
          <span style={{ background: "linear-gradient(135deg, #c8a96e 0%, #e8d5a3 50%, #c8a96e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>qui fait vraiment avancer</span>
        </h1>

        <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.55)", maxWidth: "560px", margin: "0 auto 48px", lineHeight: "1.7" }}>
          Prompts exclusifs, lives en direct, ressources premium et un réseau de professionnels qui partagent les mêmes ambitions que vous.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <button
            onMouseEnter={() => setHoveredBtn("hero-main")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{ background: "linear-gradient(135deg, #c8a96e, #e8d5a3)", color: "#050508", border: "none", borderRadius: "12px", padding: "16px 36px", fontSize: "15px", fontWeight: "800", cursor: "pointer", letterSpacing: "0.04em", transform: hoveredBtn === "hero-main" ? "translateY(-2px)" : "translateY(0)", transition: "transform 0.2s", boxShadow: hoveredBtn === "hero-main" ? "0 12px 40px rgba(200,169,110,0.5)" : "0 4px 20px rgba(200,169,110,0.2)" }}
          >
            Rejoindre maintenant
          </button>
          <button
            onMouseEnter={() => setHoveredBtn("hero-sec")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{ backgroundColor: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", padding: "16px 36px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transform: hoveredBtn === "hero-sec" ? "translateY(-2px)" : "translateY(0)", transition: "transform 0.2s" }}
          >
            Voir les offres ↓
          </button>
        </div>
      </section>

      <section style={{ position: "relative", zIndex: 1, padding: "0 24px 80px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", backgroundColor: "rgba(200,169,110,0.1)", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(200,169,110,0.1)" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "32px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: "900", color: "#c8a96e", marginBottom: "6px" }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ position: "relative", zIndex: 1, padding: "0 24px 80px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "800", color: "#ffffff", marginBottom: "12px" }}>Ce que vous obtenez</h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.45)" }}>Quatre piliers pour accélérer votre progression</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {[
              { icon: "✦", title: "Prompts Exclusifs", desc: "Des centaines de prompts testés et optimisés pour booster votre productivité, réservés aux membres premium et VIP.", color: "#c8a96e" },
              { icon: "◉", title: "Lives & Masterclasses", desc: "Des sessions en direct avec des experts, des Q&A exclusifs et des workshops pratiques chaque semaine.", color: "#9b8ce8" },
              { icon: "⬡", title: "Ressources & Templates", desc: "Bibliothèque complète de templates, guides, checklists et outils directement applicables dans vos projets.", color: "#5bb8f5" },
              { icon: "◈", title: "Networking Privé", desc: "Connectez-vous avec des membres sélectionnés, créez des synergies et développez votre réseau professionnel.", color: "#f5a623" },
            ].map((feat, i) => (
              <div key={i} style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "36px", display: "flex", gap: "20px", alignItems: "flex-start" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(200,169,110,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "22px", color: feat.color }}>{feat.icon}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#ffffff", marginBottom: "8px" }}>{feat.title}</h3>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: "1.65" }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ position: "relative", zIndex: 1, padding: "0 24px 100px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "800", color: "#ffffff", marginBottom: "12px" }}>Choisissez votre niveau</h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.45)" }}>Commencez gratuitement, évoluez selon vos ambitions</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", alignItems: "start" }}>
            {tiers.map((tier) => (
              <div
                key={tier.id}
                onMouseEnter={() => setHoveredCard(tier.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: hoveredCard === tier.id ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  border: tier.id === "premium" ? "1px solid rgba(200,169,110,0.5)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "20px",
                  padding: "36px 28px",
                  transition: "all 0.3s",
                  transform: hoveredCard === tier.id ? "translateY(-6px)" : tier.id === "premium" ? "translateY(-4px)" : "translateY(0)",
                  boxShadow: hoveredCard === tier.id ? "0 20px 60px " + tier.glow : tier.id === "premium" ? "0 8px 40px rgba(200,169,110,0.15)" : "none",
                  position: "relative",
                  overflow: "hidden",
                }}