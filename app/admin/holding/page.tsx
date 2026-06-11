"use client";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface MetricProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

interface FluxRowProps {
  from: string;
  to: string;
  type: string;
  rate: string;
  amount: string;
}

const Card: React.FC<CardProps> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(200,169,110,0.2)",
      borderRadius: "16px",
      padding: "24px",
      backdropFilter: "blur(10px)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Metric: React.FC<MetricProps> = ({ label, value, sub, highlight }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}
  >
    <span
      style={{
        fontSize: "12px",
        color: "rgba(200,169,110,0.7)",
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        fontWeight: "600",
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: highlight ? "32px" : "22px",
        fontWeight: "700",
        color: highlight ? "#c8a96e" : "#ffffff",
        lineHeight: "1.1",
      }}
    >
      {value}
    </span>
    {sub && (
      <span
        style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        {sub}
      </span>
    )}
  </div>
);

const FluxRow: React.FC<FluxRowProps> = ({ from, to, type, rate, amount }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1.5fr 80px 100px",
      alignItems: "center",
      padding: "12px 16px",
      borderRadius: "10px",
      background: "rgba(200,169,110,0.04)",
      border: "1px solid rgba(200,169,110,0.08)",
      marginBottom: "8px",
      gap: "12px",
    }}
  >
    <span
      style={{
        fontSize: "13px",
        color: "#c8a96e",
        fontWeight: "600",
      }}
    >
      {from}
    </span>
    <span
      style={{
        fontSize: "13px",
        color: "rgba(255,255,255,0.5)",
      }}
    >
      {"→"} {to}
    </span>
    <span
      style={{
        fontSize: "12px",
        color: "rgba(255,255,255,0.6)",
      }}
    >
      {type}
    </span>
    <span
      style={{
        fontSize: "13px",
        color: "#c8a96e",
        fontWeight: "700",
        textAlign: "center" as const,
      }}
    >
      {rate}
    </span>
    <span
      style={{
        fontSize: "13px",
        color: "#ffffff",
        fontWeight: "600",
        textAlign: "right" as const,
      }}
    >
      {amount}
    </span>
  </div>
);

const ProgressBar: React.FC<{ value: number; label: string; color?: string }> = ({
  value,
  label,
  color,
}) => (
  <div style={{ marginBottom: "16px" }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "6px",
      }}
    >
      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
        {label}
      </span>
      <span style={{ fontSize: "12px", color: "#c8a96e", fontWeight: "700" }}>
        {value}%
      </span>
    </div>
    <div
      style={{
        height: "6px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "3px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: value + "%",
          background: color || "linear-gradient(90deg, #c8a96e, #e8c98e)",
          borderRadius: "3px",
          transition: "width 0.8s ease",
        }}
      />
    </div>
  </div>
);

const BadgeTax: React.FC<{ label: string; value: string; type: "good" | "neutral" | "alert" }> = ({
  label,
  value,
  type,
}) => {
  const colors = {
    good: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", text: "#22c55e" },
    neutral: { bg: "rgba(200,169,110,0.1)", border: "rgba(200,169,110,0.3)", text: "#c8a96e" },
    alert: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#ef4444" },
  };
  const c = colors[type];
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 20px",
        background: c.bg,
        border: "1px solid " + c.border,
        borderRadius: "12px",
        gap: "4px",
        minWidth: "120px",
      }}
    >
      <span style={{ fontSize: "18px", fontWeight: "700", color: c.text }}>
        {value}
      </span>
      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textAlign: "center" as const }}>
        {label}
      </span>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <div style={{ marginBottom: "20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
      <div
        style={{
          width: "3px",
          height: "20px",
          background: "linear-gradient(180deg, #c8a96e, rgba(200,169,110,0.2))",
          borderRadius: "2px",
        }}
      />
      <h2
        style={{
          margin: "0",
          fontSize: "16px",
          fontWeight: "700",
          color: "#ffffff",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </h2>
    </div>
    {subtitle && (
      <p
        style={{
          margin: "0",
          fontSize: "12px",
          color: "rgba(255,255,255,0.4)",
          paddingLeft: "13px",
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

export default function DashboardAcademia(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#ffffff",
        padding: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(5,5,8,0.95)",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          padding: "0 32px",
          position: "sticky",
          top: "0",
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              {"◈"}
            </div>
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "800",
                  color: "#ffffff",
                  letterSpacing: "0.5px",
                }}
              >
                AcadémIA Pro
              </div>
              <div style={{ fontSize: "10px", color: "rgba(200,169,110,0.7)", letterSpacing: "2px" }}>
                HOLDING DASHBOARD {currentYear}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: "600" }}>
                STRUCTURE ACTIVE
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
              Exercice {currentYear}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "32px",
        }}
      >
        {/* Hero KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <Card style={{ gridColumn: "span 1" }}>
            <Metric
              label="CA Consolidé Estimé"
              value="2.4M€"
              sub="Projection annuelle groupe"
              highlight
            />
          </Card>
          <Card>
            <Metric
              label="Économie Fiscale Annuelle"
              value="186K€"
              sub="vs structure simple"
            />
          </Card>
          <Card>
            <Metric
              label="Taux IS Effectif Groupe"
              value="8.2%"
              sub="Optimisé Wyoming + CIR"
            />
          </Card>
          <Card>
            <Metric
              label="Remontée Dividendes"
              value="68K€"
              sub="Net Jacques (5%) / an"
            />
          </Card>
        </div>

        {/* Structure Juridique */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <Card>
            <SectionTitle
              title="Structure Juridique Holding"
              subtitle="Répartition du capital et entités"
            />

            {/* Organigramme visuel */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0",
                padding: "8px 0",
              }}
            >
              {/* LLC Wyoming - Holding */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))",
                  border: "1.5px solid rgba(200,169,110,0.5)",
                  borderRadius: "14px",
                  padding: "16px 28px",
                  textAlign: "center" as const,
                  width: "280px",
                  position: "relative" as const,
                }}
              >
                <div style={{ fontSize: "10px", color: "rgba(200,169,110,0.7)", letterSpacing: "2px", marginBottom: "4px" }}>
                  HOLDING — ENTITÉ MÈRE
                </div>
                <div style={{ fontSize: "17px", fontWeight: "800", color: "#c8a96e" }}>
                  LLC Wyoming
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                  AcadémIA Pro LLC · USA
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                    marginTop: "10px",
                  }}
                >
                  <span
                    style={{
                      padding: "3px 10px",
                      background: "rgba(200,169,110,0.15)",
                      borderRadius: "6px",
                      fontSize: "11px",
                      color: "#c8a96e",
                      fontWeight: "700",
                    }}
                  >
                    IS : 0%
                  </span>
                  <span
                    style={{
                      padding: "3px 10px",
                      background: "rgba(200,169,110,0.15)",
                      borderRadius: "6px",
                      fontSize: "11px",
                      color: "#c8a96e",
                      fontWeight: "700",
                    }}
                  >
                    Pass-through
                  </span>
                </div>
              </div>

              {/* Ligne de connexion */}
              <div style={{ display: "flex", gap: "80px", alignItems: "flex-start" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div style={{ width: "2px", height: "20px", background: "rgba(200,169,110,0.3)" }} />
                  <div
                    style={{
                      padding: "3px 10px