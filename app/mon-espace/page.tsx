import React, { useState } from "react";

const gold = "#c8a96e";
const darkBg = "#050508";
const cardBg = "#0d0d14";
const cardBorder = "1px solid rgba(200,169,110,0.25)";
const textMuted = "rgba(200,169,110,0.6)";

const data = {
  formations: [
    {
      id: 1,
      titre: "Maîtrise du Leadership",
      progression: 72,
      modules: 12,
      modulesDone: 9,
      categorie: "Leadership",
      image: "🎯",
      certificat: false,
    },
    {
      id: 2,
      titre: "Communication Stratégique",
      progression: 100,
      modules: 8,
      modulesDone: 8,
      categorie: "Communication",
      image: "💬",
      certificat: true,
    },
    {
      id: 3,
      titre: "Intelligence Émotionnelle",
      progression: 35,
      modules: 10,
      modulesDone: 4,
      categorie: "Développement",
      image: "🧠",
      certificat: false,
    },
    {
      id: 4,
      titre: "Gestion de Projet Avancée",
      progression: 100,
      modules: 15,
      modulesDone: 15,
      categorie: "Management",
      image: "📊",
      certificat: true,
    },
  ],
  certifications: [
    {
      id: 1,
      titre: "Communication Stratégique",
      date: "15 Nov 2024",
      numero: "CERT-2024-0847",
      image: "💬",
    },
    {
      id: 2,
      titre: "Gestion de Projet Avancée",
      date: "03 Oct 2024",
      numero: "CERT-2024-0612",
      image: "📊",
    },
  ],
  seances: [
    {
      id: 1,
      titre: "Session Coaching Leadership",
      date: "22 Jan 2025",
      heure: "10:00",
      coach: "Marie Laurent",
      statut: "à venir",
      type: "Visio",
    },
    {
      id: 2,
      titre: "Atelier Communication",
      date: "18 Jan 2025",
      heure: "14:30",
      coach: "Thomas Renard",
      statut: "terminée",
      type: "Présentiel",
    },
    {
      id: 3,
      titre: "Suivi Intelligence Émotionnelle",
      date: "25 Jan 2025",
      heure: "09:00",
      coach: "Sophie Martin",
      statut: "à venir",
      type: "Visio",
    },
  ],
  paiements: [
    {
      id: 1,
      libelle: "Formation Leadership",
      date: "10 Jan 2025",
      montant: 490,
      statut: "payé",
      facture: "FAC-2025-001",
    },
    {
      id: 2,
      libelle: "Pack Coaching 5 séances",
      date: "03 Dec 2024",
      montant: 750,
      statut: "payé",
      facture: "FAC-2024-089",
    },
    {
      id: 3,
      libelle: "Formation IE",
      date: "15 Nov 2024",
      montant: 320,
      statut: "payé",
      facture: "FAC-2024-072",
    },
    {
      id: 4,
      libelle: "Renouvellement abonnement",
      date: "22 Jan 2025",
      montant: 49,
      statut: "en attente",
      facture: "FAC-2025-012",
    },
  ],
  profil: {
    nom: "Alexandre Moreau",
    email: "alexandre.moreau@email.com",
    telephone: "+33 6 12 34 56 78",
    ville: "Paris, France",
    membre: "Janvier 2024",
    abonnement: "Premium",
    avatar: "AM",
  },
};

const navItems = [
  { id: "formations", label: "Formations", icon: "📚" },
  { id: "certifications", label: "Certifications", icon: "🏆" },
  { id: "seances", label: "Séances", icon: "📅" },
  { id: "paiements", label: "Paiements", icon: "💳" },
  { id: "profil", label: "Profil", icon: "👤" },
];

function ProgressBar(props: { value: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "6px",
        background: "rgba(200,169,110,0.15)",
        borderRadius: "3px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: props.value + "%",
          height: "100%",
          background:
            props.value === 100
              ? "linear-gradient(90deg, #c8a96e, #e8c97e)"
              : "linear-gradient(90deg, rgba(200,169,110,0.7), #c8a96e)",
          borderRadius: "3px",
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

function Badge(props: { text: string; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: props.color
          ? props.color + "20"
          : "rgba(200,169,110,0.15)",
        color: props.color || gold,
        border: "1px solid " + (props.color ? props.color + "40" : "rgba(200,169,110,0.3)"),
        letterSpacing: "0.5px",
        textTransform: "uppercase" as const,
      }}
    >
      {props.text}
    </span>
  );
}

function Card(props: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg,
        border: hovered
          ? "1px solid rgba(200,169,110,0.5)"
          : cardBorder,
        borderRadius: "12px",
        padding: "24px",
        transition: "border 0.3s ease, box-shadow 0.3s ease",
        boxShadow: hovered
          ? "0 4px 24px rgba(200,169,110,0.08)"
          : "none",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

function FormationsTab() {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.05))",
            border: cardBorder,
            borderRadius: "10px",
            padding: "18px",
            textAlign: "center" as const,
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 700, color: gold }}>
            {data.formations.length}
          </div>
          <div style={{ fontSize: "12px", color: textMuted, marginTop: "4px" }}>
            Formations achetées
          </div>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.05))",
            border: cardBorder,
            borderRadius: "10px",
            padding: "18px",
            textAlign: "center" as const,
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 700, color: gold }}>
            {data.formations.filter((f) => f.progression === 100).length}
          </div>
          <div style={{ fontSize: "12px", color: textMuted, marginTop: "4px" }}>
            Complétées
          </div>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.05))",
            border: cardBorder,
            borderRadius: "10px",
            padding: "18px",
            textAlign: "center" as const,
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 700, color: gold }}>
            {Math.round(
              data.formations.reduce((a, f) => a + f.progression, 0) /
                data.formations.length
            )}
            %
          </div>
          <div style={{ fontSize: "12px", color: textMuted, marginTop: "4px" }}>
            Progression moy.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: "16px" }}>
        {data.formations.map((f) => (
          <Card key={f.id}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  background: "rgba(200,169,110,0.1)",
                  border: cardBorder,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  flexShrink: 0,
                }}
              >
                {f.image}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#e8e0d0",
                        marginBottom: "4px",
                      }}
                    >
                      {f.titre}
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Badge text={f.categorie} />
                      {f.certificat && (
                        <Badge text="Certifiée" color="#4caf82" />
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: f.progression === 100 ? "#4caf82" : gold,
                      }}
                    >
                      {f.progression}%
                    </div>
                    <div style={{ fontSize: "11px", color: textMuted }}>
                      {f.modulesDone}/{f.modules} modules
                    </div>
                  </div>
                </div>
                <ProgressBar value={f.progression} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: textMuted }}>
                    {f.progression === 100
                      ? "✓ Formation terminée"
                      : f.modules - f.modulesDone + " modules restants"}
                  </span>
                  <button
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(200,169,110,0.4)",
                      color: gold,
                      padding: "5px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {f.progression === 100 ? "Revoir" : "Continuer →"}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CertificationsTab() {
  return (
    <div>
      <div
        style={{
          marginBottom: "24px",
          padding: "20px",
          background: "linear-gradient(135deg, rgba(200,169,110,0.08), transparent)",
          border: "1px solid rgba(200,169,110,0.2)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ fontSize: "36px" }}>🏆</div>
        <div>
          <div style={{ fontSize: "14px", color: "#e8e0d0", fontWeight: 600 }}>
            {data.certifications.length} certifications obtenues
          </div>
          <div style={{ fontSize: "12px", color: textMuted, marginTop: "3px" }}>
            Félicitations pour votre progression — continuez sur votre lancée !
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: "16px" }}>
        {data.certifications.map((c) => (
          <Card key={c.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.05))",
                    border: "1px solid rgba(200,169,110,0.4)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                  }}
                >
                  {c.image}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#e8e0d0",
                      marginBottom: "4px",