import React, { useState } from "react";

interface Formation {
  id: string;
  titre: string;
  dateDebut: string;
  dateFin: string;
  statut: "en_cours" | "termine" | "inscrit";
}

interface Seance {
  id: string;
  date: string;
  duree: number;
  type: string;
  notes: string;
}

interface Historique {
  id: string;
  action: string;
  date: string;
  utilisateur: string;
}

interface ContactData {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  score: number;
  formations: Formation[];
  seances: Seance[];
  historique: Historique[];
  notes: string;
}

interface ContactFicheProps {
  params: {
    id: string;
  };
}

const mockData: ContactData = {
  id: "CTX-00142",
  nom: "Dupont",
  prenom: "Alexandre",
  email: "alexandre.dupont@email.com",
  telephone: "+33 6 12 34 56 78",
  score: 87,
  formations: [
    {
      id: "F1",
      titre: "Management Avance",
      dateDebut: "2024-01-15",
      dateFin: "2024-03-30",
      statut: "termine",
    },
    {
      id: "F2",
      titre: "Leadership Strategique",
      dateDebut: "2024-04-01",
      dateFin: "2024-06-30",
      statut: "en_cours",
    },
    {
      id: "F3",
      titre: "Communication Executif",
      dateDebut: "2024-07-01",
      dateFin: "2024-09-30",
      statut: "inscrit",
    },
  ],
  seances: [
    {
      id: "S1",
      date: "2024-05-10",
      duree: 90,
      type: "Coaching individuel",
      notes: "Travail sur la delegation",
    },
    {
      id: "S2",
      date: "2024-05-24",
      duree: 60,
      type: "Atelier pratique",
      notes: "Simulation de presentation",
    },
    {
      id: "S3",
      date: "2024-06-07",
      duree: 120,
      type: "Session intensive",
      notes: "Bilan mi-parcours",
    },
  ],
  historique: [
    {
      id: "H1",
      action: "Email envoye",
      date: "2024-06-10",
      utilisateur: "Marie Lambert",
    },
    {
      id: "H2",
      action: "Appel entrant",
      date: "2024-06-08",
      utilisateur: "Pierre Martin",
    },
    {
      id: "H3",
      action: "Devis accepte",
      date: "2024-05-30",
      utilisateur: "Marie Lambert",
    },
    {
      id: "H4",
      action: "Inscription formation",
      date: "2024-05-28",
      utilisateur: "Systeme",
    },
  ],
  notes:
    "Client tres engage dans son parcours. Montre une forte progression sur les competences de leadership. A recontacter en juillet pour renouvellement.",
};

const gold = "#c8a96e";
const darkBg = "#050508";
const cardBg = "#0d0d14";
const borderColor = "#1a1a2e";
const textPrimary = "#f0e6d3";
const textSecondary = "#8a7a6a";
const goldLight = "#e8c98e";

export default function ContactFiche({ params }: ContactFicheProps) {
  const [activeTab, setActiveTab] = useState<
    "formations" | "seances" | "historique" | "notes"
  >("formations");
  const contact = mockData;

  const getStatutStyle = (statut: string) => {
    if (statut === "termine") {
      return {
        background: "rgba(100, 180, 100, 0.15)",
        color: "#7ecf7e",
        border: "1px solid rgba(100, 180, 100, 0.3)",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "600",
        letterSpacing: "0.5px",
      };
    }
    if (statut === "en_cours") {
      return {
        background: "rgba(200, 169, 110, 0.15)",
        color: gold,
        border: "1px solid rgba(200, 169, 110, 0.3)",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "600",
        letterSpacing: "0.5px",
      };
    }
    return {
      background: "rgba(100, 130, 200, 0.15)",
      color: "#8aa8e8",
      border: "1px solid rgba(100, 130, 200, 0.3)",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "0.5px",
    };
  };

  const scoreColor =
    contact.score >= 80
      ? "#7ecf7e"
      : contact.score >= 60
        ? gold
        : "#e87e7e";

  const tabStyle = (tab: string) => ({
    padding: "10px 20px",
    background: activeTab === tab ? "rgba(200, 169, 110, 0.1)" : "transparent",
    border: "none",
    borderBottom:
      activeTab === tab
        ? "2px solid " + gold
        : "2px solid transparent",
    color: activeTab === tab ? gold : textSecondary,
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: activeTab === tab ? "600" : "400",
    letterSpacing: "0.5px",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: darkBg,
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: textPrimary,
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "28px",
            fontSize: "12px",
            color: textSecondary,
          }}
        >
          <span style={{ cursor: "pointer", color: gold }}>CRM</span>
          <span>/</span>
          <span style={{ cursor: "pointer" }}>Contacts</span>
          <span>/</span>
          <span style={{ color: textPrimary }}>{params.id}</span>
        </div>

        {/* Card principale */}
        <div
          style={{
            background: cardBg,
            border: "1px solid " + borderColor,
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          {/* Bande dorée top */}
          <div
            style={{
              height: "3px",
              background:
                "linear-gradient(90deg, " + gold + ", " + goldLight + ", " + gold + ")",
            }}
          />

          {/* Profil header */}
          <div
            style={{
              padding: "32px",
              display: "flex",
              alignItems: "flex-start",
              gap: "24px",
              borderBottom: "1px solid " + borderColor,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(200,169,110,0.3), rgba(200,169,110,0.1))",
                border: "2px solid " + gold,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: "700",
                color: gold,
                flexShrink: 0,
              }}
            >
              {contact.prenom[0]}
              {contact.nom[0]}
            </div>

            {/* Infos */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "6px",
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "700",
                    color: textPrimary,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {contact.prenom} {contact.nom}
                </h1>
                <span
                  style={{
                    fontSize: "11px",
                    color: textSecondary,
                    background: "rgba(255,255,255,0.05)",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    border: "1px solid " + borderColor,
                  }}
                >
                  {contact.id}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  flexWrap: "wrap",
                  marginTop: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: textSecondary,
                  }}
                >
                  <span style={{ color: gold }}>@</span>
                  <span>{contact.email}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: textSecondary,
                  }}
                >
                  <span style={{ color: gold }}>tel</span>
                  <span>{contact.telephone}</span>
                </div>
              </div>
            </div>

            {/* Score */}
            <div
              style={{
                textAlign: "center",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid " + borderColor,
                borderRadius: "12px",
                padding: "16px 20px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "800",
                  color: scoreColor,
                  lineHeight: 1,
                }}
              >
                {contact.score}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginTop: "6px",
                }}
              >
                Score
              </div>
              {/* Barre score */}
              <div
                style={{
                  marginTop: "8px",
                  height: "4px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "2px",
                  width: "60px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: contact.score + "%",
                    background: scoreColor,
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stats rapides */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              borderBottom: "1px solid " + borderColor,
            }}
          >
            {[
              {
                label: "Formations",
                value: contact.formations.length,
                sub: "parcours",
              },
              {
                label: "Seances",
                value: contact.seances.length,
                sub: "realisees",
              },
              {
                label: "Activites",
                value: contact.historique.length,
                sub: "interactions",
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: "20px 24px",
                  borderRight:
                    i < 2 ? "1px solid " + borderColor : "none",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: gold,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: textSecondary,
                    marginTop: "2px",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "rgba(138,122,106,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid " + borderColor,
              paddingLeft: "12px",
            }}
          >
            {(
              [
                "formations",
                "seances",
                "historique",
                "notes",
              ] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={tabStyle(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "24px" }}>

            {/* FORMATIONS */}
            {activeTab === "formations" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {contact.formations.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      border: "1px solid " + borderColor,
                      borderRadius: "10px",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: text