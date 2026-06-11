import React, { useState, useEffect } from "react";

const COLORS = {
  bg: "#050508",
  gold: "#c8a96e",
  goldLight: "#e8c98e",
  goldDark: "#a8893e",
  white: "#ffffff",
  gray: "#8a8a9a",
  grayLight: "#b0b0c0",
  dark: "#0d0d15",
  darker: "#080810",
  red: "#e85555",
  green: "#55e8a0",
  cardBg: "#0a0a14",
  borderGold: "1px solid rgba(200,169,110,0.3)",
  borderGoldStrong: "1px solid rgba(200,169,110,0.7)",
};

function useCountdown(initial: number) {
  const [count, setCount] = useState(initial);
  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);
  const h = Math.floor(count / 3600);
  const m = Math.floor((count % 3600) / 60);
  const s = count % 60;
  return { h, m, s };
}

function useCounter(end: number, duration: number = 2000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [end, duration]);
  return val;
}

function Timer({ seconds }: { seconds: number }) {
  const { h, m, s } = useCountdown(seconds);
  const box = {
    background: "rgba(200,169,110,0.1)",
    border: COLORS.borderGoldStrong,
    borderRadius: "8px",
    padding: "8px 14px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    minWidth: "52px",
  };
  const num = { fontSize: "28px", fontWeight: 700, color: COLORS.gold, lineHeight: 1 };
  const lbl = { fontSize: "10px", color: COLORS.gray, marginTop: "4px", textTransform: "uppercase" as const, letterSpacing: "1px" };
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <div style={box}><span style={num}>{String(h).padStart(2, "0")}</span><span style={lbl}>h</span></div>
      <span style={{ color: COLORS.gold, fontSize: "24px", fontWeight: 700 }}>:</span>
      <div style={box}><span style={num}>{String(m).padStart(2, "0")}</span><span style={lbl}>m</span></div>
      <span style={{ color: COLORS.gold, fontSize: "24px", fontWeight: 700 }}>:</span>
      <div style={box}><span style={num}>{String(s).padStart(2, "0")}</span><span style={lbl}>s</span></div>
    </div>
  );
}

function GoldButton({ children, onClick, size = "normal" }: { children: React.ReactNode; onClick?: () => void; size?: string }) {
  const [hover, setHover] = useState(false);
  const base = {
    background: hover ? "linear-gradient(135deg, #e8c98e, #c8a96e)" : "linear-gradient(135deg, #c8a96e, #a8893e)",
    color: "#050508",
    border: "none",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
    display: "block",
    width: "100%",
    transition: "all 0.2s",
    transform: hover ? "translateY(-2px)" : "translateY(0)",
    boxShadow: hover ? "0 8px 32px rgba(200,169,110,0.5)" : "0 4px 16px rgba(200,169,110,0.3)",
    padding: size === "large" ? "20px 32px" : "16px 24px",
    fontSize: size === "large" ? "18px" : "16px",
    letterSpacing: "0.5px",
  };
  return (
    <button style={base} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {children}
    </button>
  );
}

function StrikePrice({ price }: { price: string }) {
  return (
    <span style={{ textDecoration: "line-through", color: COLORS.gray, fontSize: "18px", marginRight: "8px" }}>
      {price}
    </span>
  );
}

function Badge({ children, color = COLORS.gold }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      background: "rgba(200,169,110,0.15)",
      border: "1px solid " + color,
      color: color,
      borderRadius: "20px",
      padding: "4px 14px",
      fontSize: "12px",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "1.5px",
    }}>
      {children}
    </span>
  );
}

function ProgressBar({ step }: { step: number }) {
  const steps = ["Lead Magnet", "Starter", "Formation", "Pack Premium"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "40px", flexWrap: "wrap" as const }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: i < step ? "linear-gradient(135deg, #c8a96e, #a8893e)" : i === step ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)",
              border: i === step ? COLORS.borderGoldStrong : i < step ? "none" : "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "14px",
              color: i < step ? "#050508" : i === step ? COLORS.gold : COLORS.gray,
              transition: "all 0.3s",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "10px", color: i === step ? COLORS.gold : COLORS.gray, fontWeight: i === step ? 700 : 400, whiteSpace: "nowrap" as const }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: "60px", height: "2px", background: i < step ? "linear-gradient(90deg, #c8a96e, #a8893e)" : "rgba(255,255,255,0.1)", margin: "0 4px", marginBottom: "20px", transition: "all 0.3s" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function SpotsLeft({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(232,85,85,0.1)", border: "1px solid rgba(232,85,85,0.3)", borderRadius: "8px", padding: "8px 16px", display: "inline-flex" as any }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS.red, boxShadow: "0 0 6px " + COLORS.red, animation: "pulse 1s infinite" }} />
      <span style={{ color: COLORS.red, fontSize: "13px", fontWeight: 700 }}>Plus que {count} places disponibles</span>
    </div>
  );
}

// ETAPE 0 - Lead Magnet
function StepLeadMagnet({ onNext }: { onNext: () => void }) {
  const visitors = useCounter(1247);
  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <Badge>Accès Gratuit Immédiat</Badge>
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: COLORS.white,
          margin: "24px 0 16px", lineHeight: 1.15,
          background: "linear-gradient(135deg, #ffffff, #c8a96e)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Télécharge le Guide Gratuit qui a Changé la Vie de 12 000+ Entrepreneurs
        </h1>
        <p style={{ color: COLORS.grayLight, fontSize: "18px", lineHeight: 1.6, margin: "0 0 32px" }}>
          Découvre les 7 leviers secrets pour automatiser tes revenus en ligne — Sans expérience, Sans audience, Sans capital.
        </p>
      </div>

      <div style={{ background: COLORS.cardBg, border: COLORS.borderGold, borderRadius: "20px", padding: "32px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px", flexWrap: "wrap" as const }}>
          <div style={{
            width: "100px", height: "130px", background: "linear-gradient(135deg, #c8a96e22, #c8a96e44)",
            border: COLORS.borderGoldStrong, borderRadius: "12px", display: "flex", flexDirection: "column" as const,
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontSize: "36px" }}>📖</span>
            <span style={{ color: COLORS.gold, fontSize: "10px", fontWeight: 700, marginTop: "8px", textAlign: "center" as const }}>GUIDE PDF</span>
          </div>
          <div>
            <h3 style={{ color: COLORS.gold, fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>
              "Le Blueprint de la Liberté Financière"
            </h3>
            <p style={{ color: COLORS.grayLight, fontSize: "14px", margin: "0 0 12px", lineHeight: 1.5 }}>
              47 pages de stratégies actionnables. Format PDF + Checklist offerte.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
              {["47 pages", "Checklist incluse", "Mise à jour 2024"].map((t) => (
                <span key={t} style={{ background: "rgba(200,169,110,0.1)", border: COLORS.borderGold, color: COLORS.gold, borderRadius: "4px", padding: "2px 8px", fontSize: "11px" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {["7 leviers pour multiplier tes revenus x3 en 90 jours", "Comment construire ton premier tunnel de vente en 48h", "L'erreur fatale que font 97% des débutants (et comment l'éviter)", "Le script exact pour convertir des inconnus en clients"].map((item) => (
          <div key={item} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ color: COLORS.gold, fontSize: "16px", flexShrink: 0, marginTop: "2px" }}>✦</span>
            <span style={{ color: COLORS.grayLight, fontSize: "15px" }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ background: COLORS.cardBg, border: COLORS.borderGold, borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
        <p style={{ color: COLORS.gray, fontSize: "13px", marginBottom: "16px", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Ton accès gratuit</p>
        <input style={{
          width: "100%", padding: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "10px", color: COLORS.white, fontSize: "16px", marginBottom: "12px",
          outline: "none", boxSizing: "border-box" as const,
        }} placeholder="Prénom" type="text" />
        <input style={{
          width: "100%", padding: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "10px", color: COLORS.white, fontSize: "16px", marginBottom: "20px",
          outline: "none", boxSizing: "border-box" as const,
        }} placeholder="Email" type="email" />
        <GoldButton onClick={onNext} size="large">
          ⚡ OUI, JE VEUX MON GUIDE GRATUIT →
        </GoldButton>
        <p style={{ color: COLORS.gray, fontSize: "12px", textAlign: "center" as const, marginTop: "12px" }}>
          🔒 100% Gratuit · Zéro spam · Désabonnement en 1 clic
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap" as const }}>
        {[["12 000+", "Entrepreneurs"], [visitors.toLocaleString(), "Vues ce mois"], ["4.9/5", "Note moyenne"]].map(([v, l]) => (
          <div key={l} style={{ textAlign: "center" as const }}>
            <div style={{ color: COLORS.gold, fontSize: "22px", fontWeight: 800 }}>{v}</div>
            <div style={{ color: COLORS.gray, fontSize: "12px" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ETAPE 1 - Starter 47€