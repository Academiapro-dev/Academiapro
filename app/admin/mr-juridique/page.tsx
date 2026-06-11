"use client";
import React from "react";

const goldColor = "#c8a96e";
const darkBg = "#050508";
const cardBg = "#0d0d14";
const cardBorder = "1px solid #c8a96e33";
const textPrimary = "#ffffff";
const textSecondary = "#a0a0b0";
const successGreen = "#4caf7d";
const warningOrange = "#e8a44a";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend, trendUp }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? "#12121e" : cardBg,
        border: hovered ? "1px solid #c8a96e88" : cardBorder,
        borderRadius: "12px",
        padding: "24px",
        flex: "1",
        minWidth: "200px",
        cursor: "default",
        transition: "all 0.3s ease",
        boxShadow: hovered ? "0 4px 30px #c8a96e18" : "0 2px 10px #00000040",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div
          style={{
            backgroundColor: "#c8a96e18",
            border: "1px solid #c8a96e44",
            borderRadius: "10px",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: trendUp ? successGreen : warningOrange,
              backgroundColor: trendUp ? "#4caf7d18" : "#e8a44a18",
              padding: "4px 8px",
              borderRadius: "20px",
              border: trendUp ? "1px solid #4caf7d44" : "1px solid #e8a44a44",
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: "28px", fontWeight: "700", color: textPrimary, marginBottom: "4px", letterSpacing: "-0.5px" }}>
        {value}
      </div>
      <div style={{ fontSize: "14px", fontWeight: "600", color: goldColor, marginBottom: "4px" }}>{title}</div>
      <div style={{ fontSize: "12px", color: textSecondary }}>{subtitle}</div>
    </div>
  );
};

interface DocumentRowProps {
  name: string;
  type: string;
  entity: string;
  status: string;
  economy: string;
  date: string;
  index: number;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ name, type, entity, status, economy, date, index }) => {
  const [hovered, setHovered] = React.useState(false);

  const getStatusStyle = (s: string) => {
    if (s === "Validé") return { color: successGreen, bg: "#4caf7d18", border: "1px solid #4caf7d44" };
    if (s === "En cours") return { color: goldColor, bg: "#c8a96e18", border: "1px solid #c8a96e44" };
    return { color: warningOrange, bg: "#e8a44a18", border: "1px solid #e8a44a44" };
  };

  const st = getStatusStyle(status);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 20px",
        backgroundColor: hovered ? "#12121e" : index % 2 === 0 ? "transparent" : "#0a0a12",
        borderBottom: "1px solid #c8a96e18",
        transition: "background-color 0.2s ease",
        gap: "16px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          backgroundColor: "#c8a96e18",
          border: "1px solid #c8a96e44",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          flexShrink: 0,
        }}
      >
        📄
      </div>
      <div style={{ flex: "2", minWidth: "0" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </div>
        <div style={{ fontSize: "12px", color: textSecondary, marginTop: "2px" }}>{type}</div>
      </div>
      <div style={{ flex: "1", fontSize: "13px", color: textSecondary, minWidth: "100px" }}>{entity}</div>
      <div style={{ flex: "1", minWidth: "90px" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: st.color,
            backgroundColor: st.bg,
            border: st.border,
            padding: "4px 10px",
            borderRadius: "20px",
          }}
        >
          {status}
        </span>
      </div>
      <div style={{ flex: "1", fontSize: "13px", fontWeight: "700", color: successGreen, minWidth: "100px" }}>{economy}</div>
      <div style={{ flex: "1", fontSize: "12px", color: textSecondary, minWidth: "90px" }}>{date}</div>
      <div style={{ flexShrink: 0 }}>
        <button
          style={{
            backgroundColor: "transparent",
            border: "1px solid #c8a96e44",
            borderRadius: "6px",
            color: goldColor,
            padding: "6px 12px",
            fontSize: "12px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Voir
        </button>
      </div>
    </div>
  );
};

interface FluxCardProps {
  from: string;
  to: string;
  amount: string;
  type: string;
  saving: string;
}

const FluxCard: React.FC<FluxCardProps> = ({ from, to, amount, type, saving }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? "#12121e" : cardBg,
        border: hovered ? "1px solid #c8a96e66" : cardBorder,
        borderRadius: "12px",
        padding: "20px",
        transition: "all 0.3s ease",
        boxShadow: hovered ? "0 4px 20px #c8a96e12" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <div
          style={{
            backgroundColor: "#c8a96e18",
            border: "1px solid #c8a96e44",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "700",
            color: goldColor,
          }}
        >
          {from}
        </div>
        <div style={{ color: goldColor, fontSize: "18px" }}>→</div>
        <div
          style={{
            backgroundColor: "#4caf7d18",
            border: "1px solid #4caf7d44",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "700",
            color: successGreen,
          }}
        >
          {to}
        </div>
      </div>
      <div style={{ fontSize: "22px", fontWeight: "800", color: textPrimary, marginBottom: "6px" }}>{amount}</div>
      <div style={{ fontSize: "12px", color: textSecondary, marginBottom: "10px" }}>{type}</div>
      <div
        style={{
          borderTop: "1px solid #c8a96e22",
          paddingTop: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: textSecondary }}>Économie fiscale</span>
        <span style={{ fontSize: "14px", fontWeight: "700", color: successGreen }}>{saving}</span>
      </div>
    </div>
  );
};

interface ComplianceItemProps {
  label: string;
  score: number;
  entity: string;
}

const ComplianceItem: React.FC<ComplianceItemProps> = ({ label, score, entity }) => {
  const barColor = score >= 90 ? successGreen : score >= 70 ? goldColor : warningOrange;

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: textPrimary }}>{label}</div>
          <div style={{ fontSize: "11px", color: textSecondary, marginTop: "2px" }}>{entity}</div>
        </div>
        <span
          style={{
            fontSize: "14px",
            fontWeight: "700",
            color: barColor,
            backgroundColor: score >= 90 ? "#4caf7d18" : score >= 70 ? "#c8a96e18" : "#e8a44a18",
            padding: "3px 10px",
            borderRadius: "20px",
            border: score >= 90 ? "1px solid #4caf7d44" : score >= 70 ? "1px solid #c8a96e44" : "1px solid #e8a44a44",
          }}
        >
          {score}%
        </span>
      </div>
      <div style={{ backgroundColor: "#ffffff12", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
        <div
          style={{
            width: score + "%",
            height: "100%",
            backgroundColor: barColor,
            borderRadius: "4px",
            transition: "width 0.6s ease",
            boxShadow: "0 0 8px " + barColor + "66",
          }}
        />
      </div>
    </div>
  );
};

const documents = [
  { name: "Pacte d'associés SAS Holding Alpha", type: "Structuration juridique", entity: "SAS Alpha", status: "Validé", economy: "+42 000 €", date: "15 jan 2025" },
  { name: "Convention de trésorerie groupe", type: "Flux inter-sociétés", entity: "Groupe Meridian", status: "En cours", economy: "+18 500 €", date: "18 jan 2025" },
  { name: "Certificate of Formation LLC Delaware", type: "Compliance LLC", entity: "LLC Delaware US", status: "Validé", economy: "+95 000 €", date: "20 jan 2025" },
  { name: "Accord de refacturation management fees", type: "Flux inter-sociétés", entity: "SAS Beta / LLC", status: "Révision", economy: "+31 200 €", date: "22 jan 2025" },
  { name: "Statuts SAS à directoire", type: "Structuration SAS", entity: "SAS Gamma", status: "Validé", economy: "+27 800 €", date: "24 jan 2025" },
  { name: "Operating Agreement LLC multi-membres", type: "Compliance LLC", entity: "LLC Nevada US", status: "En cours", economy: "+58 000 €", date: "25 jan 2025" },
  { name: "Plan d'optimisation IS groupe", type: "Optimisation fiscale", entity: "Groupe Meridian", status: "Validé", economy: "+124 500 €", date: "27 jan 2025" },
  { name: "Contrat de licence marque intra-groupe", type: "Flux inter-sociétés", entity: "Holding / Filiales", status: "En cours", economy: "+46 300 €", date: "29 jan 2025" },
];

const fluxData = [
  { from: "SAS Holding", to: "LLC Delaware", amount: "250 000 €", type: "Management Fees annuels", saving: "+38 400 €" },
  { from: "LLC Nevada", to: "SAS Alpha", amount: "180 000 €", type: "Redevance licence IP", saving: "+29 700 €" },
  { from: "SAS Beta", to: "SAS Holding", amount: "95 000 €", type: "Convention de trésorerie", saving: "+14 250 €" },
  { from: "LLC Delaware", to: "SAS Gamma", amount: "320 000 €", type: "Dividendes exonérés", saving: "+52 800 €" },
];

const complianceData = [
  { label: "Compliance LLC Delaware", entity: "Structure US - Registre agents", score: 97 },
  { label: "Conformité SAS Holding", entity: "SAS Alpha Group", score: 94 },
  { label: "Reporting flux inter-sociétés", entity: "Groupe Meridian consolidé", score: 88 },
  { label: "Documentation prix transfert", entity: "Entités transfrontalières", score: 76 },
  { label: "KYC / AML conformité", entity: "Toutes entités groupe", score: 91 },
  { label: "Obligations déclaratives IS", entity: "SAS Beta & Gamma", score: 83 },
];

export default function DashboardMrJuridique() {
  const [activeNav, setActiveNav] = React.useState("Dashboard");
  const [sidebarHovered, setSidebarHovered] = React.useState(false);

  const navItems = [
    { label: "Dashboard", icon: "⬡" },
    { label: "Documents", icon: "📋" },
    { label: "Compliance LLC", icon: "🏛" },
    { label: "Structures SAS", icon: "🏗" },
    { label: "