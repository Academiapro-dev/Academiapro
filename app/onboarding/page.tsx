import React, { useState } from "react";

const steps = [
  { id: 1, label: "Bienvenue" },
  { id: 2, label: "Profil" },
  { id: 3, label: "Objectifs" },
  { id: 4, label: "Recommandations" },
  { id: 5, label: "Premier accès" },
];

const gold = "#c8a96e";
const dark = "#050508";
const darkCard = "#0d0d14";
const darkBorder = "#1a1a2e";
const textLight = "#f0e6d3";
const textMuted = "#8a7a6a";

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = ((current - 1) / (total - 1)) * 100;
  return (
    <div style={{ width: "100%", marginBottom: "32px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        {steps.map((step) => (
          <div
            key={step.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              flex: 1,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor:
                  step.id < current
                    ? gold
                    : step.id === current
                    ? dark
                    : darkCard,
                border:
                  step.id === current
                    ? "2px solid " + gold
                    : step.id < current
                    ? "2px solid " + gold
                    : "2px solid " + darkBorder,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "700",
                color:
                  step.id < current
                    ? dark
                    : step.id === current
                    ? gold
                    : textMuted,
                transition: "all 0.3s ease",
                zIndex: 2,
                position: "relative",
              }}
            >
              {step.id < current ? "✓" : step.id}
            </div>
            <span
              style={{
                fontSize: "10px",
                color: step.id === current ? gold : textMuted,
                fontWeight: step.id === current ? "600" : "400",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "relative",
          height: "3px",
          backgroundColor: darkBorder,
          borderRadius: "2px",
          marginTop: "8px",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: percent + "%",
            backgroundColor: gold,
            borderRadius: "2px",
            transition: "width 0.4s ease",
            boxShadow: "0 0 8px " + gold,
          }}
        />
      </div>
      <div
        style={{
          textAlign: "right",
          marginTop: "6px",
          fontSize: "11px",
          color: textMuted,
        }}
      >
        Étape {current} sur {total}
      </div>
    </div>
  );
}

function StepBienvenue({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>✦</div>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "800",
          color: textLight,
          marginBottom: "8px",
          letterSpacing: "-0.5px",
        }}
      >
        Bienvenue
      </h1>
      <p
        style={{
          fontSize: "18px",
          color: gold,
          fontWeight: "600",
          marginBottom: "24px",
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}
      >
        dans votre espace exclusif
      </p>
      <p
        style={{
          fontSize: "15px",
          color: textMuted,
          lineHeight: "1.7",
          maxWidth: "400px",
          margin: "0 auto 40px auto",
        }}
      >
        Nous allons configurer votre expérience personnalisée en quelques étapes
        simples. Préparez-vous à découvrir un univers sur mesure.
      </p>
      <div
        style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "40px",
        }}
      >
        {["Personnalisé", "Exclusif", "Sécurisé"].map((tag) => (
          <span
            key={tag}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1px solid " + darkBorder,
              color: textMuted,
              fontSize: "13px",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <button
        onClick={onNext}
        style={{
          padding: "14px 48px",
          backgroundColor: gold,
          color: dark,
          border: "none",
          borderRadius: "8px",
          fontSize: "15px",
          fontWeight: "700",
          cursor: "pointer",
          letterSpacing: "0.5px",
        }}
      >
        Commencer →
      </button>
    </div>
  );
}

function StepProfil({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: darkCard,
    border: "1px solid " + darkBorder,
    borderRadius: "8px",
    color: textLight,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    color: textMuted,
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "6px",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
  };

  return (
    <div>
      <h2
        style={{
          fontSize: "26px",
          fontWeight: "800",
          color: textLight,
          marginBottom: "8px",
        }}
      >
        Votre Profil
      </h2>
      <p style={{ color: textMuted, fontSize: "14px", marginBottom: "32px" }}>
        Dites-nous qui vous êtes pour personnaliser votre expérience.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
        <div>
          <label style={labelStyle}>Prénom</label>
          <input
            style={inputStyle}
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Votre prénom"
          />
        </div>
        <div>
          <label style={labelStyle}>Nom</label>
          <input
            style={inputStyle}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Votre nom de famille"
          />
        </div>
        <div>
          <label style={labelStyle}>Âge</label>
          <input
            style={inputStyle}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Votre âge"
            type="number"
          />
        </div>
        <div>
          <label style={labelStyle}>Secteur d'activité</label>
          <select
            style={{ ...inputStyle, appearance: "none" as const }}
          >
            <option value="">Choisissez votre secteur</option>
            <option>Finance & Investissement</option>
            <option>Technologie</option>
            <option>Immobilier</option>
            <option>Santé</option>
            <option>Autre</option>
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={onBack}
          style={{
            padding: "12px 24px",
            backgroundColor: "transparent",
            color: textMuted,
            border: "1px solid " + darkBorder,
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ← Retour
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1,
            padding: "12px 24px",
            backgroundColor: gold,
            color: dark,
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}

function StepObjectifs({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const objectifs = [
    { icon: "📈", label: "Croissance patrimoine", desc: "Augmenter votre capital" },
    { icon: "🛡️", label: "Protection actifs", desc: "Sécuriser vos avoirs" },
    { icon: "🏡", label: "Immobilier", desc: "Investir dans la pierre" },
    { icon: "⚡", label: "Revenus passifs", desc: "Générer des flux réguliers" },
    { icon: "🌍", label: "Diversification", desc: "Répartir les risques" },
    { icon: "🎯", label: "Retraite", desc: "Préparer l'avenir" },
  ];

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div>
      <h2
        style={{
          fontSize: "26px",
          fontWeight: "800",
          color: textLight,
          marginBottom: "8px",
        }}
      >
        Vos Objectifs
      </h2>
      <p style={{ color: textMuted, fontSize: "14px", marginBottom: "32px" }}>
        Sélectionnez vos priorités. Vous pouvez en choisir plusieurs.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        {objectifs.map((obj) => {
          const isSelected = selected.includes(obj.label);
          return (
            <div
              key={obj.label}
              onClick={() => toggle(obj.label)}
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: isSelected ? "1px solid " + gold : "1px solid " + darkBorder,
                backgroundColor: isSelected ? "rgba(200,169,110,0.08)" : darkCard,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>{obj.icon}</div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: isSelected ? gold : textLight,
                  marginBottom: "4px",
                }}
              >
                {obj.label}
              </div>
              <div style={{ fontSize: "11px", color: textMuted }}>{obj.desc}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={onBack}
          style={{
            padding: "12px 24px",
            backgroundColor: "transparent",
            color: textMuted,
            border: "1px solid " + darkBorder,
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ← Retour
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1,
            padding: "12px 24px",
            backgroundColor: gold,
            color: dark,
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}

function StepRecommandations({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const recommandations = [
    {
      icon: "💼",
      titre: "Portefeuille Équilibré",
      desc: "Mix actions/obligations adapté à votre profil de risque modéré.",
      tag: "Recommandé",
    },
    {
      icon: "🏛️",
      titre: "Fonds Patrimoniaux",
      desc: "Accédez aux meilleures opportunités de gestion de patrimoine.",
      tag: "Premium",
    },
    {
      icon: "📊",
      titre: "Analyse Quotidienne",
      desc: "Recevez chaque matin une analyse personnalisée des marchés.",
      tag: "Populaire",
    },
  ];

  return (
    <div>
      <h2
        style={{
          fontSize: "26px",
          fontWeight: "800",
          color: textLight,
          marginBottom: "8px",
        }}
      >
        Recommandations
      </h2>
      <p style={{ color: textMuted, fontSize: "14px", marginBottom: "32px" }}>
        Basées sur votre profil, voici ce que nous vous suggérons.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
        {recommandations.map((r) => (
          <div
            key={r.titre}
            style={{
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid " + darkBorder,
              backgroundColor: darkCard,